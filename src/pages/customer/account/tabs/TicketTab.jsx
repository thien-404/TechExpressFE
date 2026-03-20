import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useSearchParams } from "react-router-dom";
import { Loader2, MessageSquarePlus, RefreshCw } from "lucide-react";
import { toast } from "sonner";

import TicketForm from "../../../../components/ticket/TicketForm";
import TicketPaginationBar from "../../../../components/ticket/TicketPaginationBar";
import TicketSummaryCard from "../../../../components/ticket/TicketSummaryCard";
import TicketThreadView from "../../../../components/ticket/TicketThreadView";
import useTicketSignalR from "../../../../hooks/useTicketSignalR";
import { ticketService } from "../../../../services/ticketService";
import { uploadTicketAttachments } from "../../../../utils/ticketUpload";
import {
  appendTicketMessage,
  buildTicketReplyPayload,
  buildTicketCreatePayload,
  getTicketFormDefaults,
  isTicketReplyLocked,
  mergeTicketUpdate,
  ticketStatusOptions,
} from "../../../../utils/ticket";
import { useAuth } from "../../../../store/authContext";

const PAGE_SIZE = 6;

function buildDetailQueryKey(ticketId) {
  return ["ticket", "my", ticketId];
}

function buildListQueryKey(params) {
  return ["tickets", "my", params];
}

export default function TicketTab() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [pageNumber, setPageNumber] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");

  const selectedTicketId = searchParams.get("ticketId") || "";
  const isCreateMode = searchParams.get("mode") === "create";

  const listParams = useMemo(
    () => ({
      page: pageNumber,
      pageSize: PAGE_SIZE,
      sortBy: "UpdatedAt",
      sortDirection: "Desc",
      status: statusFilter || null,
    }),
    [pageNumber, statusFilter]
  );

  const ticketListQuery = useQuery({
    queryKey: buildListQueryKey(listParams),
    queryFn: async () => {
      const response = await ticketService.getMyTickets(listParams);
      if (!response.succeeded || !response.value) {
        throw new Error(response.message || "Không thể tải danh sách ticket.");
      }
      return response.value;
    },
    placeholderData: (previousValue) => previousValue,
  });

  const ticketDetailQuery = useQuery({
    enabled: !!selectedTicketId && !isCreateMode,
    queryKey: buildDetailQueryKey(selectedTicketId),
    queryFn: async () => {
      const response = await ticketService.getMyTicketDetail(selectedTicketId);
      if (!response.succeeded || !response.value) {
        throw new Error(response.message || "Không thể tải chi tiết ticket.");
      }
      return response.value;
    },
  });

  useEffect(() => {
    if (isCreateMode) {
      return;
    }

    const firstTicketId = ticketListQuery.data?.items?.[0]?.id;
    if (!selectedTicketId && firstTicketId) {
      const nextParams = new URLSearchParams(searchParams);
      nextParams.set("ticketId", firstTicketId);
      setSearchParams(nextParams, { replace: true });
    }
  }, [
    isCreateMode,
    searchParams,
    selectedTicketId,
    setSearchParams,
    ticketListQuery.data?.items,
  ]);

  const createFormValues = useMemo(
    () =>
      getTicketFormDefaults({
        type: searchParams.get("type") || "TechnicalSupport",
        customPCId: searchParams.get("customPCId") || "",
        orderId: searchParams.get("orderId") || "",
        orderItemId: searchParams.get("orderItemId") || "",
      }),
    [searchParams]
  );

  const openTicketDetail = (ticketId) => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete("mode");
    nextParams.delete("type");
    nextParams.delete("customPCId");
    nextParams.delete("orderId");
    nextParams.delete("orderItemId");
    nextParams.set("ticketId", ticketId);
    setSearchParams(nextParams);
  };

  const openCreateMode = () => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete("ticketId");
    nextParams.set("mode", "create");
    setSearchParams(nextParams);
  };

  const createTicketMutation = useMutation({
    mutationFn: async ({ files, ...values }) => {
      const attachmentUrls = await uploadTicketAttachments({
        files,
        ownerKey: `user-${user?.id || "customer"}`,
      });
      const payload = buildTicketCreatePayload(values, {
        includeGuestInfo: false,
        attachmentUrls,
      });
      const response = await ticketService.createTicket(payload);
      if (!response.succeeded || !response.value) {
        throw new Error(response.message || "Không thể tạo ticket.");
      }
      return response.value;
    },
    onSuccess: (ticket) => {
      toast.success("Đã tạo ticket thành công.");
      queryClient.invalidateQueries({ queryKey: ["tickets", "my"] });
      queryClient.setQueryData(buildDetailQueryKey(ticket.id), ticket);
      openTicketDetail(ticket.id);
    },
    onError: (error) => {
      toast.error(error?.message || "Tạo ticket thất bại.");
    },
  });

  const replyTicketMutation = useMutation({
    mutationFn: async ({ files, content }) => {
      if (!selectedTicketId) {
        throw new Error("Không tìm thấy ticket để phản hồi.");
      }

      const attachmentUrls = await uploadTicketAttachments({
        files,
        ownerKey: `user-${user?.id || "customer"}`,
      });
      const payload = buildTicketReplyPayload(
        { content },
        {
          includeGuestPhone: false,
          attachmentUrls,
        }
      );
      const response = await ticketService.replyToTicket(selectedTicketId, payload);
      if (!response.succeeded || !response.value) {
        throw new Error(response.message || "Không thể gửi phản hồi.");
      }
      return response.value;
    },
    onSuccess: (message) => {
      queryClient.setQueryData(buildDetailQueryKey(selectedTicketId), (currentTicket) =>
        appendTicketMessage(currentTicket, message)
      );
      queryClient.invalidateQueries({ queryKey: ["tickets", "my"] });
      toast.success("Đã gửi phản hồi.");
    },
    onError: (error) => {
      toast.error(error?.message || "Gửi phản hồi thất bại.");
    },
  });

  useTicketSignalR({
    enabled: true,
    onTicketUpdated: (ticket) => {
      if (!ticket?.id) return;

      queryClient.invalidateQueries({ queryKey: ["tickets", "my"] });
      queryClient.setQueryData(buildDetailQueryKey(ticket.id), (currentTicket) =>
        mergeTicketUpdate(currentTicket, ticket)
      );
    },
    onTicketMessageReceived: (message) => {
      if (!message?.ticketId) return;

      queryClient.invalidateQueries({ queryKey: ["tickets", "my"] });
      queryClient.setQueryData(buildDetailQueryKey(message.ticketId), (currentTicket) =>
        appendTicketMessage(currentTicket, message)
      );
    },
  });

  const selectedTicket = ticketDetailQuery.data || null;
  const replyLocked = isTicketReplyLocked(selectedTicket?.status);

  return (
    <section className="flex-1 min-w-0 w-full rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Ticket hỗ trợ</h2>
          <p className="mt-1 text-sm text-slate-500">
            Theo dõi yêu cầu hỗ trợ, phản hồi từ kỹ thuật và tạo ticket mới.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={statusFilter}
            onChange={(event) => {
              setPageNumber(1);
              setStatusFilter(event.target.value);
            }}
            className="h-10 rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-[#0090D0]"
          >
            <option value="">Tất cả trạng thái</option>
            {ticketStatusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => {
              ticketListQuery.refetch();
              if (selectedTicketId && !isCreateMode) {
                ticketDetailQuery.refetch();
              }
            }}
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-300 px-4 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <RefreshCw size={16} />
            Làm mới
          </button>

          <button
            type="button"
            onClick={openCreateMode}
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#0090D0] px-4 text-sm font-semibold text-white hover:bg-[#0077B0]"
          >
            <MessageSquarePlus size={16} />
            Tạo ticket
          </button>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-[340px_minmax(0,1fr)]">
        <div className="space-y-4">
          {ticketListQuery.isLoading ? (
            <div className="flex h-40 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50">
              <Loader2 size={24} className="animate-spin text-[#0090D0]" />
            </div>
          ) : ticketListQuery.isError ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-6 text-sm text-rose-700">
              {ticketListQuery.error?.message || "Không thể tải danh sách ticket."}
            </div>
          ) : ticketListQuery.data?.items?.length ? (
            <>
              <div className="space-y-3">
                {ticketListQuery.data.items.map((item) => (
                  <TicketSummaryCard
                    key={item.id}
                    item={item}
                    selected={!isCreateMode && item.id === selectedTicketId}
                    onClick={() => openTicketDetail(item.id)}
                  />
                ))}
              </div>

              <TicketPaginationBar
                pageNumber={ticketListQuery.data.pageNumber}
                totalPages={ticketListQuery.data.totalPages}
                totalCount={ticketListQuery.data.totalCount}
                pageSize={ticketListQuery.data.pageSize}
                loading={ticketListQuery.isFetching}
                onPageChange={setPageNumber}
              />
            </>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
              Bạn chưa có ticket nào. Hãy tạo ticket đầu tiên để được hỗ trợ.
            </div>
          )}
        </div>

        <div className="min-w-0">
          {isCreateMode ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <div className="text-sm text-slate-600">
                  Bạn đang tạo ticket mới. Có thể mở từ đơn hàng hoặc Custom PC để hệ thống điền sẵn ngữ cảnh.
                </div>
                {selectedTicketId ? (
                  <button
                    type="button"
                    onClick={() => openTicketDetail(selectedTicketId)}
                    className="text-sm font-medium text-[#0090D0] hover:underline"
                  >
                    Quay lại ticket đang xem
                  </button>
                ) : null}
              </div>

              <TicketForm
                initialValues={createFormValues}
                submitting={createTicketMutation.isPending}
                onSubmit={(values) => createTicketMutation.mutateAsync(values)}
                title="Tạo ticket hỗ trợ"
                submitLabel="Gửi ticket"
              />
            </div>
          ) : ticketDetailQuery.isLoading ? (
            <div className="flex h-64 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50">
              <Loader2 size={26} className="animate-spin text-[#0090D0]" />
            </div>
          ) : ticketDetailQuery.isError ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-6 text-sm text-rose-700">
              {ticketDetailQuery.error?.message || "Không thể tải chi tiết ticket."}
            </div>
          ) : selectedTicket ? (
            <TicketThreadView
              ticket={selectedTicket}
              viewerKind="customer"
              currentUserId={user?.id}
              onReply={(values) => replyTicketMutation.mutateAsync(values)}
              replySubmitting={replyTicketMutation.isPending}
              replyDisabled={replyLocked}
              replyDisabledReason={replyLocked ? "Ticket đã hoàn tất nên không thể phản hồi thêm." : ""}
              composerPlaceholder="Nhập phản hồi cho bộ phận hỗ trợ..."
              submitReplyLabel="Gửi phản hồi"
            />
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
              Hãy chọn một ticket ở bên trái hoặc <Link to="/account?tab=ticket&mode=create" className="font-medium text-[#0090D0] hover:underline">tạo ticket mới</Link>.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}