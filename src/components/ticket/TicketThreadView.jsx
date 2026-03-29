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
    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
      <div className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-1 text-sm text-slate-800">{value || "--"}</div>
    </div>
  );
}

function buildMetaItems(ticket, viewerKind) {
  const items = [
    { label: "Loại hỗ trợ", value: getTicketTypeLabel(ticket.type) },
    { label: "Mức ưu tiên", value: getTicketPriorityLabel(ticket.priority) },
    { label: "Tạo lúc", value: formatTicketDateTime(ticket.createdAt) },
    { label: "Cập nhật gần nhất", value: formatTicketDateTime(ticket.updatedAt) },
  ];

  if (viewerKind === "staff") {
    items.push(
      { label: "Người gửi", value: ticket.fullName || "--" },
      { label: "Số điện thoại", value: ticket.phone || "--" }
    );
  }

  if (ticket.completedByName) {
    items.push({ label: "Người hoàn tất", value: ticket.completedByName });
  }

  if (ticket.resolvedAt) {
    items.push({ label: "Thời điểm xử lý", value: formatTicketDateTime(ticket.resolvedAt) });
  }

  if (ticket.closedAt) {
    items.push({ label: "Thời điểm đóng", value: formatTicketDateTime(ticket.closedAt) });
  }

  return items;
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
      <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-4 py-10 text-center text-sm text-slate-500 shadow-sm">
        Chưa có ticket nào được chọn.
      </div>
    );
  }

  const metaItems = buildMetaItems(ticket, viewerKind);
  const ticketCode = String(ticket.id || "").slice(0, 8).toUpperCase();

  return (
    <div className="space-y-5">
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                Ticket #{ticketCode || "--"}
              </span>
              <TicketStatusBadge status={ticket.status} />
            </div>

            <h1 className="text-2xl font-semibold text-slate-900">{ticket.title}</h1>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-600">
              {ticket.description || "Chưa có mô tả chi tiết cho ticket này."}
            </p>
          </div>

          {topActions ? <div className="flex flex-wrap gap-2">{topActions}</div> : null}
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {metaItems.map((item) => (
            <MetaItem key={item.label} label={item.label} value={item.value} />
          ))}
        </div>

        {ticket.customPC ? (
          <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
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

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Lịch sử trao đổi</h2>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              Tất cả phản hồi giữa bạn và bộ phận hỗ trợ sẽ xuất hiện tại đây.
            </p>
          </div>
          <span className="text-xs font-medium text-slate-500">
            {Array.isArray(ticket.messages) ? ticket.messages.length : 0} tin nhắn
          </span>
        </div>

        <TicketMessageTimeline
          messages={ticket.messages}
          viewerKind={viewerKind}
          currentUserId={currentUserId}
          emptyMessage={emptyMessage || "Chưa có trao đổi nào trong ticket này."}
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
