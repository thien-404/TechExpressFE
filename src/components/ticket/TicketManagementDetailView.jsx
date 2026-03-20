import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";

import Breadcrumb from "../ui/Breadcrumb";
import TicketThreadView from "./TicketThreadView";
import useTicketSignalR from "../../hooks/useTicketSignalR";
import { ticketService } from "../../services/ticketService";
import { warrantySupportService } from "../../services/warrantySupportService";
import { useAuth } from "../../store/authContext";
import { uploadTicketAttachments } from "../../utils/ticketUpload";
import {
  appendTicketMessage,
  buildTicketReplyPayload,
  formatTicketDate,
  getTicketStatusLabel,
  isTicketReplyLocked,
  mergeTicketUpdate,
} from "../../utils/ticket";

const ACTION_CLASS_NAMES = {
  primary: "bg-[#0090D0] text-white hover:bg-[#0077B0]",
  success: "bg-emerald-600 text-white hover:bg-emerald-700",
  warning: "bg-amber-500 text-white hover:bg-amber-600",
  neutral: "bg-slate-700 text-white hover:bg-slate-800",
};

function getTicketActions(status) {
  if (status === "Open") {
    return [
      { label: "Nhận xử lý", status: "InProgress", kind: "status", tone: "primary" },
    ];
  }

  if (status === "InProgress") {
    return [
      {
        label: "Chờ khách hàng phản hồi",
        status: "WaitingForCustomer",
        kind: "status",
        tone: "warning",
      },
      { label: "Đánh dấu đã xử lý", status: "Resolved", kind: "complete", tone: "success" },
    ];
  }

  if (status === "WaitingForCustomer") {
    return [
      { label: "Tiếp tục xử lý", status: "InProgress", kind: "status", tone: "primary" },
      { label: "Đóng ticket", status: "Closed", kind: "complete", tone: "neutral" },
    ];
  }

  if (status === "Resolved") {
    return [
      { label: "Đóng ticket", status: "Closed", kind: "complete", tone: "neutral" },
    ];
  }

  return [];
}

function WarrantyPanel({
  result,
  checkDate,
  onCheckDateChange,
  onCheckNow,
  onCheckCustomDate,
  checkingNow,
  checkingCustomDate,
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h3 className="text-base font-semibold text-slate-900">Kiểm tra bảo hành</h3>
          <p className="mt-1 text-sm text-slate-500">
            Dùng dữ liệu từ ticket hiện tại để kiểm tra thời hạn bảo hành của sản phẩm.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onCheckNow}
            disabled={checkingNow}
            className="inline-flex h-10 items-center rounded-lg bg-[#0090D0] px-4 text-sm font-semibold text-white hover:bg-[#0077B0] disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {checkingNow ? "Đang kiểm tra..." : "Kiểm tra hiện tại"}
          </button>

          <input
            type="date"
            value={checkDate}
            onChange={(event) => onCheckDateChange(event.target.value)}
            className="h-10 rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-[#0090D0]"
          />
          <button
            type="button"
            onClick={onCheckCustomDate}
            disabled={checkingCustomDate || !checkDate}
            className="inline-flex h-10 items-center rounded-lg border border-slate-300 px-4 text-sm font-medium text-slate-700 hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {checkingCustomDate ? "Đang kiểm tra..." : "Kiểm tra theo ngày"}
          </button>
        </div>
      </div>

      {result ? (
        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
            <div className="text-xs uppercase tracking-wide text-slate-500">Sản phẩm</div>
            <div className="mt-1 text-sm font-medium text-slate-900">{result.productName}</div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
            <div className="text-xs uppercase tracking-wide text-slate-500">SKU</div>
            <div className="mt-1 text-sm font-medium text-slate-900">{result.productSku}</div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
            <div className="text-xs uppercase tracking-wide text-slate-500">Trạng thái</div>
            <div className={`mt-1 text-sm font-semibold ${result.isValid ? "text-emerald-600" : "text-rose-600"}`}>
              {result.isValid ? "Còn bảo hành" : "Hết bảo hành"}
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
            <div className="text-xs uppercase tracking-wide text-slate-500">Bắt đầu bảo hành</div>
            <div className="mt-1 text-sm text-slate-900">{formatTicketDate(result.warrantyStartDate)}</div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
            <div className="text-xs uppercase tracking-wide text-slate-500">Hết hạn bảo hành</div>
            <div className="mt-1 text-sm text-slate-900">{formatTicketDate(result.warrantyExpiredAt)}</div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
            <div className="text-xs uppercase tracking-wide text-slate-500">Số ngày còn lại/quá hạn</div>
            <div className="mt-1 text-sm text-slate-900">{result.remainingDays}</div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 md:col-span-2 xl:col-span-3">
            <div className="text-xs uppercase tracking-wide text-slate-500">Kết luận</div>
            <div className="mt-1 text-sm leading-6 text-slate-900">{result.message}</div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function TicketManagementDetailView({ basePath, roleLabel }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { ticketId } = useParams();
  const { user } = useAuth();
  const [checkDate, setCheckDate] = useState("");
  const [warrantyResult, setWarrantyResult] = useState(null);

  const ticketQueryKey = ["ticket", "manage", ticketId];
  const ticketQuery = useQuery({
    enabled: !!ticketId,
    queryKey: ticketQueryKey,
    queryFn: async () => {
      const response = await ticketService.getTicketDetail(ticketId);
      if (!response.succeeded || !response.value) {
        throw new Error(response.message || "Không thể tải chi tiết ticket.");
      }
      return response.value;
    },
  });

  useEffect(() => {
    setWarrantyResult(null);
    setCheckDate("");
  }, [ticketId]);

  const ticket = ticketQuery.data || null;

  const statusMutation = useMutation({
    mutationFn: async ({ nextStatus, kind }) => {
      const response =
        kind === "status"
          ? await ticketService.updateTicketStatus(ticketId, nextStatus)
          : await ticketService.completeTicket(ticketId, nextStatus);
      if (!response.succeeded) {
        throw new Error(response.message || `Không thể cập nhật trạng thái sang ${getTicketStatusLabel(nextStatus)}.`);
      }
      return { nextStatus };
    },
    onSuccess: async ({ nextStatus }) => {
      toast.success(`Đã cập nhật trạng thái sang ${getTicketStatusLabel(nextStatus)}.`);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["ticket", "manage", ticketId] }),
        queryClient.invalidateQueries({ queryKey: ["tickets", "manage", basePath] }),
      ]);
    },
    onError: (error) => {
      toast.error(error?.message || "Không thể cập nhật trạng thái ticket.");
    },
  });

  const replyMutation = useMutation({
    mutationFn: async ({ files, content }) => {
      const attachmentUrls = await uploadTicketAttachments({
        files,
        ownerKey: `staff-${user?.id || "support"}`,
      });
      const payload = buildTicketReplyPayload(
        { content },
        {
          includeGuestPhone: false,
          attachmentUrls,
        }
      );
      const response = await ticketService.replyToTicket(ticketId, payload);
      if (!response.succeeded || !response.value) {
        throw new Error(response.message || "Không thể gửi phản hồi.");
      }
      return response.value;
    },
    onSuccess: (message) => {
      queryClient.setQueryData(ticketQueryKey, (currentTicket) => appendTicketMessage(currentTicket, message));
      queryClient.invalidateQueries({ queryKey: ["tickets", "manage", basePath] });
      toast.success("Đã gửi phản hồi cho ticket.");
    },
    onError: (error) => {
      toast.error(error?.message || "Gửi phản hồi thất bại.");
    },
  });

  const checkWarrantyNowMutation = useMutation({
    mutationFn: async () => {
      const response = await warrantySupportService.checkWarrantyByTicket(ticketId);
      if (!response.succeeded || !response.value) {
        throw new Error(response.message || "Không thể kiểm tra bảo hành.");
      }
      return response.value;
    },
    onSuccess: (value) => {
      setWarrantyResult(value);
      toast.success("Đã kiểm tra bảo hành.");
    },
    onError: (error) => {
      toast.error(error?.message || "Kiểm tra bảo hành thất bại.");
    },
  });

  const checkWarrantyCustomDateMutation = useMutation({
    mutationFn: async () => {
      const response = await warrantySupportService.checkWarrantyByTicketDate(ticketId, checkDate);
      if (!response.succeeded || !response.value) {
        throw new Error(response.message || "Không thể kiểm tra bảo hành theo ngày.");
      }
      return response.value;
    },
    onSuccess: (value) => {
      setWarrantyResult(value);
      toast.success("Đã kiểm tra bảo hành theo ngày chọn.");
    },
    onError: (error) => {
      toast.error(error?.message || "Kiểm tra bảo hành theo ngày thất bại.");
    },
  });

  useTicketSignalR({
    enabled: true,
    onTicketUpdated: (nextTicket) => {
      if (!nextTicket?.id) return;
      queryClient.invalidateQueries({ queryKey: ["tickets", "manage", basePath] });
      queryClient.setQueryData(["ticket", "manage", nextTicket.id], (currentTicket) =>
        mergeTicketUpdate(currentTicket, nextTicket)
      );
    },
    onTicketMessageReceived: (message) => {
      if (!message?.ticketId) return;
      queryClient.invalidateQueries({ queryKey: ["tickets", "manage", basePath] });
      queryClient.setQueryData(["ticket", "manage", message.ticketId], (currentTicket) =>
        appendTicketMessage(currentTicket, message)
      );
    },
  });

  const actions = getTicketActions(ticket?.status);
  const replyLocked = isTicketReplyLocked(ticket?.status);

  return (
    <div className="space-y-5">
      <Breadcrumb
        items={[
          { label: "Trang chủ", href: basePath },
          { label: `${roleLabel} quản lý ticket`, href: `${basePath}/tickets` },
          { label: ticket ? `Ticket #${String(ticket.id).slice(0, 8).toUpperCase()}` : "Chi tiết ticket" },
        ]}
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => navigate(`${basePath}/tickets`)}
          className="inline-flex h-10 items-center rounded-lg border border-slate-300 px-4 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Quay lại danh sách
        </button>

        <button
          type="button"
          onClick={() => ticketQuery.refetch()}
          className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-300 px-4 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          <RefreshCw size={16} />
          Làm mới
        </button>
      </div>

      {ticketQuery.isLoading ? (
        <div className="flex h-64 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50">
          <Loader2 size={26} className="animate-spin text-[#0090D0]" />
        </div>
      ) : ticketQuery.isError ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-6 text-sm text-rose-700">
          {ticketQuery.error?.message || "Không thể tải chi tiết ticket."}
        </div>
      ) : ticket ? (
        <TicketThreadView
          ticket={ticket}
          viewerKind="staff"
          currentUserId={user?.id}
          onReply={(values) => replyMutation.mutateAsync(values)}
          replySubmitting={replyMutation.isPending}
          replyDisabled={replyLocked}
          replyDisabledReason={replyLocked ? "Ticket đã hoàn tất nên không thể phản hồi thêm." : ""}
          composerPlaceholder="Nhập phản hồi gửi cho khách hàng..."
          submitReplyLabel="Gửi phản hồi"
          topActions={actions.map((action) => (
            <button
              key={`${action.kind}-${action.status}`}
              type="button"
              onClick={() => statusMutation.mutate({ nextStatus: action.status, kind: action.kind })}
              disabled={statusMutation.isPending}
              className={`inline-flex h-10 items-center rounded-lg px-4 text-sm font-semibold transition disabled:cursor-not-allowed disabled:bg-slate-300 ${ACTION_CLASS_NAMES[action.tone]}`}
            >
              {statusMutation.isPending ? "Đang cập nhật..." : action.label}
            </button>
          ))}
          extraPanel={
            ticket.type === "WarrantyRequest" ? (
              <WarrantyPanel
                result={warrantyResult}
                checkDate={checkDate}
                onCheckDateChange={setCheckDate}
                onCheckNow={() => checkWarrantyNowMutation.mutate()}
                onCheckCustomDate={() => checkWarrantyCustomDateMutation.mutate()}
                checkingNow={checkWarrantyNowMutation.isPending}
                checkingCustomDate={checkWarrantyCustomDateMutation.isPending}
              />
            ) : null
          }
        />
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
          Không tìm thấy thông tin ticket.
        </div>
      )}
    </div>
  );
}
