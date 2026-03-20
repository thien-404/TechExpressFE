import { useState } from "react";
import { Loader2, Send } from "lucide-react";
import { toast } from "sonner";

import TicketAttachmentPicker from "./TicketAttachmentPicker";

export default function TicketReplyComposer({
  onSubmit,
  submitting = false,
  disabled = false,
  disabledReason = "",
  placeholder = "Nhập nội dung phản hồi...",
  submitLabel = "Gửi phản hồi",
}) {
  const [content, setContent] = useState("");
  const [files, setFiles] = useState([]);

  const isBlocked = disabled || submitting;

  const handleSubmit = async (event) => {
    event.preventDefault();

    const trimmedContent = content.trim();
    if (!trimmedContent && files.length === 0) {
      toast.info("Vui lòng nhập nội dung hoặc đính kèm tệp.");
      return;
    }

    try {
      const result = await onSubmit?.({
        content: trimmedContent,
        files,
      });

      if (result !== false) {
        setContent("");
        setFiles([]);
      }
    } catch {
      // Lỗi đã được xử lý ở nơi gọi.
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
    >
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-slate-900">Phản hồi ticket</h3>
        {disabledReason ? (
          <span className="text-xs text-slate-500">{disabledReason}</span>
        ) : null}
      </div>

      <textarea
        value={content}
        onChange={(event) => setContent(event.target.value)}
        disabled={isBlocked}
        placeholder={placeholder}
        rows={4}
        className="mt-3 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-[#0090D0] focus:ring-2 focus:ring-[#0090D0]/10 disabled:cursor-not-allowed disabled:bg-slate-100"
      />

      <div className="mt-3">
        <TicketAttachmentPicker
          files={files}
          onChange={setFiles}
          disabled={isBlocked}
        />
      </div>

      <div className="mt-4 flex justify-end">
        <button
          type="submit"
          disabled={isBlocked}
          className="inline-flex h-11 items-center gap-2 rounded-lg bg-[#0090D0] px-5 text-sm font-semibold text-white transition hover:bg-[#0077B0] disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {submitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          {submitting ? "Đang gửi..." : submitLabel}
        </button>
      </div>
    </form>
  );
}