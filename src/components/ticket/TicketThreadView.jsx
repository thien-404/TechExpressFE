import TicketMessageTimeline from "./TicketMessageTimeline";
import TicketReplyComposer from "./TicketReplyComposer";
import TicketStatusBadge from "./TicketStatusBadge";
import {
  formatTicketDateTime,
  getTicketPriorityLabel,
  getTicketTypeLabel,
} from "../../utils/ticket";

function MetaItem({ label, value }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
      <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </div>
      <div className="mt-1 text-sm text-slate-800">{value || "--"}</div>
    </div>
  );
}

export default function TicketThreadView({
  ticket,
  viewerKind,
  currentUserId,
  onReply,
  replySubmitting = false,
  replyDisabled = false,
  replyDisabledReason = "",
  topActions = null,
  extraPanel = null,
  composerPlaceholder,
  submitReplyLabel,
  emptyMessage,
}) {
  if (!ticket) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
        Chưa có ticket nào được chọn.
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <TicketStatusBadge status={ticket.status} />
            <h1 className="text-2xl font-semibold text-slate-900">{ticket.title}</h1>
            <p className="whitespace-pre-wrap text-sm leading-6 text-slate-600">
              {ticket.description}
            </p>
          </div>

          {topActions ? <div className="flex flex-wrap gap-2">{topActions}</div> : null}
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          <MetaItem label="Loại ticket" value={getTicketTypeLabel(ticket.type)} />
          <MetaItem label="Độ ưu tiên" value={getTicketPriorityLabel(ticket.priority)} />
          <MetaItem label="Người gửi" value={ticket.fullName || "--"} />
          <MetaItem label="Số điện thoại" value={ticket.phone || "--"} />
          <MetaItem label="Ngày tạo" value={formatTicketDateTime(ticket.createdAt)} />
          <MetaItem label="Cập nhật gần nhất" value={formatTicketDateTime(ticket.updatedAt)} />
          {ticket.completedByName ? (
            <MetaItem label="Người hoàn tất" value={ticket.completedByName} />
          ) : null}
          {ticket.resolvedAt ? (
            <MetaItem label="Thời điểm xử lý" value={formatTicketDateTime(ticket.resolvedAt)} />
          ) : null}
          {ticket.closedAt ? (
            <MetaItem label="Thời điểm đóng" value={formatTicketDateTime(ticket.closedAt)} />
          ) : null}
        </div>

        {ticket.customPC ? (
          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Cấu hình Custom PC
            </div>
            <div className="mt-1 text-sm text-slate-800">
              {ticket.customPC.name || ticket.customPC.id || ticket.customPCId || "--"}
            </div>
          </div>
        ) : null}

        {extraPanel ? <div className="mt-4">{extraPanel}</div> : null}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-slate-900">Lịch sử trao đổi</h2>
          <span className="text-xs text-slate-500">
            {Array.isArray(ticket.messages) ? ticket.messages.length : 0} tin nhắn
          </span>
        </div>

        <TicketMessageTimeline
          messages={ticket.messages}
          viewerKind={viewerKind}
          currentUserId={currentUserId}
          emptyMessage={emptyMessage}
        />
      </section>

      {onReply ? (
        <TicketReplyComposer
          onSubmit={onReply}
          submitting={replySubmitting}
          disabled={replyDisabled}
          disabledReason={replyDisabledReason}
          placeholder={composerPlaceholder}
          submitLabel={submitReplyLabel}
        />
      ) : null}
    </div>
  );
}