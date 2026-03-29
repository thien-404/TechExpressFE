import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useSearchParams } from "react-router-dom";
import { Loader2, MessageSquarePlus, RefreshCw } from "lucide-react";
import { toast } from "sonner";

import useTicketSignalR from "../../hooks/useTicketSignalR";
import { ticketService } from "../../services/ticketService";
import { useAuth } from "../../store/authContext";
import { uploadTicketAttachments } from "../../utils/ticketUpload";
import {
  appendTicketMessage,
  buildTicketCreatePayload,
  buildTicketEntryPath,
  buildTicketReplyPayload,
  getTicketFormDefaults,
  isTicketReplyLocked,
  mergeTicketUpdate,
  ticketStatusOptions,
} from "../../utils/ticket";
import TicketForm from "./TicketForm";
import TicketPaginationBar from "./TicketPaginationBar";
import TicketSummaryCard from "./TicketSummaryCard";
import TicketThreadView from "./TicketThreadView";

const PAGE_SIZE = 6;

function buildDetailQueryKey(ticketId) {
  return ["ticket", "my", ticketId];
}

function buildListQueryKey(params) {
  return ["tickets", "my", params];
}

function shortenTicketId(ticketId) {
  return String(ticketId || "").slice(0, 8).toUpperCase();
}

function OverviewCard({ label, value, description }) {
  return (
    <div className="rounded-2xl border border-white/70 bg-white/80 p-4 backdrop-blur">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{label}</p>
      <p className="mt-2 text-lg font-semibold text-slate-900">{value}</p>
      <p className="mt-1 text-sm leading-6 text-slate-600">{description}</p>
    </div>
  );
}

function GuideCard({ title, description }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <p className="text-sm font-semibold text-slate-900">{title}</p>
      <p className="mt-1 text-sm leading-6 text-slate-600">{description}</p>
    </div>
  );
}

export default function CustomerSupportCenter() {
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

  const ticketItems = useMemo(() => ticketListQuery.data?.items || [], [ticketListQuery.data?.items]);

  useEffect(() => {
    if (isCreateMode) {
      return;
    }

    const firstTicketId = ticketItems[0]?.id || "";
    const hasSelectedTicket = ticketItems.some((item) => item.id === selectedTicketId);
    const nextSelectedTicketId = hasSelectedTicket ? selectedTicketId : firstTicketId;

    if (nextSelectedTicketId === selectedTicketId) {
      return;
    }

    const nextParams = new URLSearchParams(searchParams);
    if (nextSelectedTicketId) {
      nextParams.set("ticketId", nextSelectedTicketId);
    } else {
      nextParams.delete("ticketId");
    }
    setSearchParams(nextParams, { replace: true });
  }, [isCreateMode, searchParams, selectedTicketId, setSearchParams, ticketItems]);

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

  const returnFromCreateMode = () => {
    const fallbackTicketId = selectedTicketId || ticketItems[0]?.id;

    if (fallbackTicketId) {
      openTicketDetail(fallbackTicketId);
      return;
    }

    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete("mode");
    nextParams.delete("type");
    nextParams.delete("customPCId");
    nextParams.delete("orderId");
    nextParams.delete("orderItemId");
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
  const totalTickets = ticketListQuery.data?.totalCount || 0;
  const currentFilterLabel =
    ticketStatusOptions.find((option) => option.value === statusFilter)?.label || "Tất cả trạng thái";
  const currentFocusLabel = isCreateMode
    ? "Biểu mẫu tạo ticket mới"
    : selectedTicket?.title || "Chọn một ticket để xem chi tiết";
  const currentFocusDescription = isCreateMode
    ? "Điền thông tin ngắn gọn, rõ ràng để bộ phận hỗ trợ phản hồi nhanh hơn."
    : selectedTicket?.id
      ? `Mã ticket #${shortenTicketId(selectedTicket.id)}`
      : "Bạn có thể chọn ticket ở cột bên trái hoặc tạo ticket mới.";

  const handleRefresh = () => {
    ticketListQuery.refetch();
    if (selectedTicketId && !isCreateMode) {
      ticketDetailQuery.refetch();
    }
  };

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-3xl border border-sky-200 bg-gradient-to-br from-sky-50 via-white to-cyan-50 p-5 shadow-sm md:p-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <div className="text-sm text-slate-500">
              <Link to="/" className="hover:text-[#0090D0] hover:underline">
                Trang chủ
              </Link>
              <span className="mx-2 text-slate-300">/</span>
              <span>Trung tâm hỗ trợ</span>
            </div>

            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">
              Trung tâm hỗ trợ của bạn
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Tạo ticket mới, theo dõi phản hồi từ kỹ thuật và tiếp tục trao đổi ở cùng một nơi.
              Mọi cập nhật mới sẽ hiển thị ngay trong cuộc hội thoại của ticket.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleRefresh}
              className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              <RefreshCw size={16} />
              Làm mới
            </button>

            <button
              type="button"
              onClick={isCreateMode ? returnFromCreateMode : openCreateMode}
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#0090D0] px-5 text-sm font-semibold text-white transition hover:bg-[#0077B0]"
            >
              <MessageSquarePlus size={16} />
              {isCreateMode ? "Quay lại danh sách" : "Tạo ticket mới"}
            </button>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-3">
          <OverviewCard
            label="Tổng ticket"
            value={`${totalTickets} ticket`}
            description="Toàn bộ yêu cầu hỗ trợ của bạn được quản lý tập trung tại đây."
          />
          <OverviewCard
            label="Bộ lọc hiện tại"
            value={currentFilterLabel}
            description={
              statusFilter
                ? "Danh sách đang được rút gọn theo trạng thái bạn chọn."
                : "Bạn đang xem tất cả ticket, không áp dụng bộ lọc."
            }
          />
          <OverviewCard
            label={isCreateMode ? "Bạn đang làm gì" : "Đang mở"}
            value={currentFocusLabel}
            description={currentFocusDescription}
          />
        </div>
      </section>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[340px_minmax(0,1fr)]">
        <aside className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Danh sách ticket</h2>
              <p className="mt-1 text-sm leading-6 text-slate-500">
                Chọn một ticket để xem chi tiết, hoặc tạo ticket mới khi bạn cần hỗ trợ thêm.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                Đang hiển thị
              </p>
              <p className="mt-1 text-sm text-slate-700">
                {ticketItems.length} ticket trên trang này
              </p>
            </div>
          </div>

          <div className="mt-4">
            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-slate-700">Lọc theo trạng thái</span>
              <select
                value={statusFilter}
                onChange={(event) => {
                  setPageNumber(1);
                  setStatusFilter(event.target.value);
                }}
                className="h-11 w-full rounded-xl border border-slate-300 px-4 text-sm outline-none transition focus:border-[#0090D0] focus:ring-2 focus:ring-[#0090D0]/10"
              >
                <option value="">Tất cả trạng thái</option>
                {ticketStatusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="mt-4 space-y-4">
            {ticketListQuery.isLoading ? (
              <div className="flex h-40 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50">
                <Loader2 size={24} className="animate-spin text-[#0090D0]" />
              </div>
            ) : ticketListQuery.isError ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-6 text-sm text-rose-700">
                {ticketListQuery.error?.message || "Không thể tải danh sách ticket."}
              </div>
            ) : ticketItems.length ? (
              <>
                <div className="space-y-3">
                  {ticketItems.map((item) => (
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
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center">
                <p className="text-sm font-semibold text-slate-800">Bạn chưa có ticket nào.</p>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Hãy tạo ticket đầu tiên để bộ phận hỗ trợ có thể nắm và xử lý vấn đề của bạn.
                </p>
                <button
                  type="button"
                  onClick={openCreateMode}
                  className="mt-4 inline-flex h-10 items-center rounded-xl bg-[#0090D0] px-4 text-sm font-semibold text-white transition hover:bg-[#0077B0]"
                >
                  Tạo ticket đầu tiên
                </button>
              </div>
            )}
          </div>
        </aside>

        <div className="min-w-0">
          {isCreateMode ? (
            <div className="space-y-4">
              <div className="rounded-3xl border border-amber-200 bg-amber-50/70 p-5 shadow-sm">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">Tạo ticket mới</h2>
                    <p className="mt-1 text-sm leading-6 text-slate-600">
                      Chỉ cần mô tả ngắn gọn và chọn đúng loại hỗ trợ. Sau khi gửi, bạn có thể
                      tiếp tục phản hồi ngay tại đây.
                    </p>
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

                <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
                  <GuideCard
                    title="1. Chọn đúng loại ticket"
                    description="Hệ thống sẽ tự mở thêm các trường liên quan như đơn hàng hoặc bảo hành."
                  />
                  <GuideCard
                    title="2. Viết ngắn gọn, dễ hiểu"
                    description="Tiêu đề rõ ràng và mô tả súc tích giúp đội ngũ hỗ trợ nắm vấn đề nhanh hơn."
                  />
                  <GuideCard
                    title="3. Đính kèm khi cần"
                    description="Bạn có thể gửi ảnh, video hoặc tài liệu để việc xử lý chính xác hơn."
                  />
                </div>
              </div>

              <TicketForm
                initialValues={createFormValues}
                submitting={createTicketMutation.isPending}
                onSubmit={(values) => createTicketMutation.mutateAsync(values)}
                title="Gửi yêu cầu hỗ trợ"
                submitLabel="Gửi ticket"
              />
            </div>
          ) : ticketDetailQuery.isLoading ? (
            <div className="flex h-64 items-center justify-center rounded-3xl border border-slate-200 bg-white shadow-sm">
              <Loader2 size={26} className="animate-spin text-[#0090D0]" />
            </div>
          ) : ticketDetailQuery.isError ? (
            <div className="rounded-3xl border border-rose-200 bg-rose-50 px-4 py-6 text-sm text-rose-700 shadow-sm">
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
              replyDisabledReason={
                replyLocked ? "Ticket đã hoàn tất nên bạn không thể phản hồi thêm." : ""
              }
              composerPlaceholder="Nhập phản hồi của bạn cho bộ phận hỗ trợ..."
              submitReplyLabel="Gửi phản hồi"
            />
          ) : (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900">Chưa chọn ticket nào</h3>
              <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">
                Hãy chọn một ticket ở cột bên trái để xem lịch sử trao đổi, hoặc tạo ticket mới nếu
                bạn đang cần được hỗ trợ.
              </p>
              <Link
                to={buildTicketEntryPath({ isAuthenticated: true, mode: "create" })}
                className="mt-5 inline-flex h-11 items-center rounded-xl bg-[#0090D0] px-5 text-sm font-semibold text-white transition hover:bg-[#0077B0]"
              >
                Tạo ticket mới
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
