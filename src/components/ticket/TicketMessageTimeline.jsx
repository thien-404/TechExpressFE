import TicketAttachmentGallery from "./TicketAttachmentGallery";
import { formatTicketDateTime } from "../../utils/ticket";

function getMessageMeta(message, viewerKind, currentUserId) {
  if (viewerKind === "staff") {
    return {
      isOwn: Boolean(message?.isStaffMessage),
      authorLabel: message?.isStaffMessage ? "Bạn" : "Khách hàng",
    };
  }

  if (viewerKind === "guest") {
    return {
      isOwn: !message?.isStaffMessage,
      authorLabel: message?.isStaffMessage ? "Nhân viên hỗ trợ" : "Bạn",
    };
  }

  const isOwn =
    !message?.isStaffMessage &&
    (!currentUserId || String(message?.userId || "") === String(currentUserId));

  return {
    isOwn,
    authorLabel: message?.isStaffMessage ? "Nhân viên hỗ trợ" : "Bạn",
  };
}

export default function TicketMessageTimeline({
  messages,
  viewerKind,
  currentUserId,
  emptyMessage = "Chưa có trao đổi nào.",
}) {
  const safeMessages = Array.isArray(messages) ? messages : [];

  if (!safeMessages.length) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {safeMessages.map((message) => {
        const { isOwn, authorLabel } = getMessageMeta(
          message,
          viewerKind,
          currentUserId
        );

        return (
          <div
            key={message.id}
            className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-full space-y-2 rounded-2xl border px-4 py-3 shadow-sm md:max-w-[80%] ${
                isOwn
                  ? "border-[#0090D0] bg-[#0090D0] text-white"
                  : "border-slate-200 bg-white text-slate-800"
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span
                  className={`text-xs font-semibold ${
                    isOwn ? "text-white/90" : "text-slate-500"
                  }`}
                >
                  {authorLabel}
                </span>
                <span
                  className={`text-xs ${
                    isOwn ? "text-white/80" : "text-slate-400"
                  }`}
                >
                  {formatTicketDateTime(message.sentAt)}
                </span>
              </div>

              {message.content ? (
                <div className="whitespace-pre-wrap text-sm leading-6">
                  {message.content}
                </div>
              ) : null}

              <TicketAttachmentGallery attachments={message.attachments} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
