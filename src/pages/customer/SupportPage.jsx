import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useSearchParams } from "react-router-dom";
import { Loader2, Search } from "lucide-react";
import { toast } from "sonner";

import TicketForm from "../../components/ticket/TicketForm";
import TicketPaginationBar from "../../components/ticket/TicketPaginationBar";
import TicketSummaryCard from "../../components/ticket/TicketSummaryCard";
import TicketThreadView from "../../components/ticket/TicketThreadView";
import CustomerSupportCenter from "../../components/ticket/CustomerSupportCenter";
import { ticketService } from "../../services/ticketService";
import { useAuth } from "../../store/authContext";
import {
  appendTicketMessage,
  buildTicketReplyPayload,
  buildTicketCreatePayload,
  getTicketFormDefaults,
  isTicketReplyLocked,
  ticketStatusOptions,
} from "../../utils/ticket";
import { uploadTicketAttachments } from "../../utils/ticketUpload";
import { getOrCreateCustomPcGuestSessionId } from "../../utils/customPcSession";

const PAGE_SIZE = 6;

function buildGuestDetailQueryKey(ticketId, phone) {
  return ["ticket", "guest", ticketId, phone];
}

export default function SupportPage() {
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuth();
  const [searchParams] = useSearchParams();
  const [phoneInput, setPhoneInput] = useState("");
  const [lookupPhone, setLookupPhone] = useState("");
  const [selectedTicketId, setSelectedTicketId] = useState("");
  const [pageNumber, setPageNumber] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");

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

  const guestTicketsQuery = useQuery({
    enabled: !!lookupPhone,
    queryKey: ["tickets", "guest", lookupPhone, listParams],
    queryFn: async () => {
      const response = await ticketService.getMyTickets(listParams, {
        phone: lookupPhone,
      });
      if (!response.succeeded || !response.value) {
        throw new Error(response.message || "Không thể tải danh sách ticket.");
      }
      return response.value;
    },
    placeholderData: (previousValue) => previousValue,
  });

  const guestTicketDetailQuery = useQuery({
    enabled: !!lookupPhone && !!selectedTicketId,
    queryKey: buildGuestDetailQueryKey(selectedTicketId, lookupPhone),
    queryFn: async () => {
      const response = await ticketService.getMyTicketDetail(selectedTicketId, {
        phone: lookupPhone,
      });
      if (!response.succeeded || !response.value) {
        throw new Error(response.message || "Không thể tải chi tiết ticket.");
      }
      return response.value;
    },
  });

  useEffect(() => {
    const firstTicketId = guestTicketsQuery.data?.items?.[0]?.id;
    const hasSelectedTicket = guestTicketsQuery.data?.items?.some(
      (item) => item.id === selectedTicketId
    );

    if (!selectedTicketId || !hasSelectedTicket) {
      setSelectedTicketId(firstTicketId || "");
    }
  }, [guestTicketsQuery.data?.items, selectedTicketId]);

  const createFormValues = useMemo(
    () =>
      getTicketFormDefaults({
        phone: lookupPhone || "",
        type: searchParams.get("type") || "TechnicalSupport",
        customPCId: searchParams.get("customPCId") || "",
        orderId: searchParams.get("orderId") || "",
        orderItemId: searchParams.get("orderItemId") || "",
      }),
    [lookupPhone, searchParams]
  );

  const createTicketMutation = useMutation({
    mutationFn: async ({ files, ...values }) => {
      const attachmentUrls = await uploadTicketAttachments({
        files,
        ownerKey: `guest-${String(values.phone || "khach").replace(/[^0-9]/g, "") || "khach"}`,
      });
      const payload = buildTicketCreatePayload(values, {
        includeGuestInfo: true,
        attachmentUrls,
      });
      const response = await ticketService.createTicket(payload, {
        customPcGuestSessionId: payload.customPCId ? getOrCreateCustomPcGuestSessionId() : null,
      });
      if (!response.succeeded || !response.value) {
        throw new Error(response.message || "Không thể tạo ticket.");
      }
      return response.value;
    },
    onSuccess: (ticket) => {
      const nextPhone = ticket.phone || createFormValues.phone || phoneInput;
      setPhoneInput(nextPhone || "");
      setLookupPhone(nextPhone || "");
      setSelectedTicketId(ticket.id);
      queryClient.invalidateQueries({ queryKey: ["tickets", "guest"] });
      queryClient.setQueryData(buildGuestDetailQueryKey(ticket.id, nextPhone), ticket);
      toast.success("Đã tạo ticket thành công.");
    },
    onError: (error) => {
      toast.error(error?.message || "Tạo ticket thất bại.");
    },
  });

  const replyTicketMutation = useMutation({
    mutationFn: async ({ files, content }) => {
      if (!selectedTicketId || !lookupPhone) {
        throw new Error("Vui lòng chọn ticket cần phản hồi.");
      }

      const attachmentUrls = await uploadTicketAttachments({
        files,
        ownerKey: `guest-${String(lookupPhone || "khach").replace(/[^0-9]/g, "") || "khach"}`,
      });
      const payload = buildTicketReplyPayload(
        { content, phone: lookupPhone },
        {
          includeGuestPhone: true,
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
      queryClient.setQueryData(
        buildGuestDetailQueryKey(selectedTicketId, lookupPhone),
        (currentTicket) => appendTicketMessage(currentTicket, message)
      );
      queryClient.invalidateQueries({ queryKey: ["tickets", "guest"] });
      toast.success("Đã gửi phản hồi.");
    },
    onError: (error) => {
      toast.error(error?.message || "Gửi phản hồi thất bại.");
    },
  });

  const selectedTicket = guestTicketDetailQuery.data || null;
  const replyLocked = isTicketReplyLocked(selectedTicket?.status);

  if (isAuthenticated) {
    return <CustomerSupportCenter />;
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="text-sm text-slate-500">
          <Link to="/" className="hover:text-[#0090D0] hover:underline">
            Trang chủ
          </Link>
          <span className="mx-2 text-slate-300">/</span>
          <span>Hỗ trợ ticket</span>
        </div>
        <h1 className="mt-3 text-3xl font-semibold text-slate-900">Hệ thống ticket hỗ trợ</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
          Khách chưa đăng nhập có thể tạo ticket mới, tra cứu ticket theo số điện thoại và phản hồi trực tiếp với bộ phận hỗ trợ.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
        <TicketForm
          mode="guest"
          initialValues={createFormValues}
          submitting={createTicketMutation.isPending}
          onSubmit={(values) => createTicketMutation.mutateAsync(values)}
          title="Tạo ticket mới"
          submitLabel="Gửi yêu cầu hỗ trợ"
        />

        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Tra cứu ticket</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Nhập số điện thoại đã dùng khi tạo ticket để xem danh sách và tiếp tục trao đổi.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
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
                    if (lookupPhone) {
                      guestTicketsQuery.refetch();
                      if (selectedTicketId) {
                        guestTicketDetailQuery.refetch();
                      }
                    }
                  }}
                  className="inline-flex h-10 items-center rounded-lg border border-slate-300 px-4 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Làm mới
                </button>
              </div>
            </div>

            <form
              onSubmit={(event) => {
                event.preventDefault();
                const trimmedPhone = phoneInput.trim();
                if (!trimmedPhone) {
                  toast.info("Vui lòng nhập số điện thoại để tra cứu.");
                  return;
                }
                setPageNumber(1);
                setLookupPhone(trimmedPhone);
              }}
              className="mt-4 flex flex-col gap-3 md:flex-row"
            >
              <div className="relative flex-1">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  value={phoneInput}
                  onChange={(event) => setPhoneInput(event.target.value)}
                  placeholder="Nhập số điện thoại đã tạo ticket"
                  className="h-11 w-full rounded-xl border border-slate-300 pl-10 pr-4 text-sm outline-none focus:border-[#0090D0] focus:ring-2 focus:ring-[#0090D0]/10"
                />
              </div>
              <button
                type="submit"
                className="inline-flex h-11 items-center justify-center rounded-lg bg-[#0090D0] px-5 text-sm font-semibold text-white hover:bg-[#0077B0]"
              >
                Tra cứu
              </button>
            </form>
          </div>

          {lookupPhone ? (
            <div className="grid grid-cols-1 gap-5 2xl:grid-cols-[320px_minmax(0,1fr)]">
              <div className="space-y-4">
                {guestTicketsQuery.isLoading ? (
                  <div className="flex h-40 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50">
                    <Loader2 size={24} className="animate-spin text-[#0090D0]" />
                  </div>
                ) : guestTicketsQuery.isError ? (
                  <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-6 text-sm text-rose-700">
                    {guestTicketsQuery.error?.message || "Không thể tải danh sách ticket."}
                  </div>
                ) : guestTicketsQuery.data?.items?.length ? (
                  <>
                    <div className="space-y-3">
                      {guestTicketsQuery.data.items.map((item) => (
                        <TicketSummaryCard
                          key={item.id}
                          item={item}
                          selected={item.id === selectedTicketId}
                          onClick={() => setSelectedTicketId(item.id)}
                        />
                      ))}
                    </div>

                    <TicketPaginationBar
                      pageNumber={guestTicketsQuery.data.pageNumber}
                      totalPages={guestTicketsQuery.data.totalPages}
                      totalCount={guestTicketsQuery.data.totalCount}
                      pageSize={guestTicketsQuery.data.pageSize}
                      loading={guestTicketsQuery.isFetching}
                      onPageChange={setPageNumber}
                    />
                  </>
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
                    Chưa tìm thấy ticket nào với số điện thoại này.
                  </div>
                )}
              </div>

              <div className="min-w-0">
                {guestTicketDetailQuery.isLoading ? (
                  <div className="flex h-64 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50">
                    <Loader2 size={26} className="animate-spin text-[#0090D0]" />
                  </div>
                ) : guestTicketDetailQuery.isError ? (
                  <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-6 text-sm text-rose-700">
                    {guestTicketDetailQuery.error?.message || "Không thể tải chi tiết ticket."}
                  </div>
                ) : selectedTicket ? (
                  <TicketThreadView
                    ticket={selectedTicket}
                    viewerKind="guest"
                    onReply={(values) => replyTicketMutation.mutateAsync(values)}
                    replySubmitting={replyTicketMutation.isPending}
                    replyDisabled={replyLocked}
                    replyDisabledReason={replyLocked ? "Ticket đã hoàn tất nên không thể phản hồi thêm." : ""}
                    composerPlaceholder="Nhập phản hồi cho ticket của bạn..."
                    submitReplyLabel="Gửi phản hồi"
                  />
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
                    Hãy chọn một ticket ở bên trái để xem chi tiết.
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
              Nhập số điện thoại để bắt đầu tra cứu ticket đã tạo.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
