import { useEffect, useMemo, useRef } from "react";
import { Paperclip, X } from "lucide-react";
import { toast } from "sonner";

import {
  MAX_TICKET_ATTACHMENTS,
  TICKET_ATTACHMENT_ACCEPT,
  validateTicketAttachmentFile,
} from "../../utils/ticketUpload";
import { fileIcon, pdfIcon, videoIcon } from "../../assets/icons";
import { getFileType } from "../../utils/fileType";

function PreviewCard({ entry, onRemove, disabled }) {
  if (entry.type === "image" || entry.type === "gif") {
    return (
      <div className="group relative">
        <img
          src={entry.previewUrl}
          alt={entry.file.name}
          className="h-20 w-20 rounded-xl border border-slate-200 object-cover"
        />
        <button
          type="button"
          disabled={disabled}
          onClick={onRemove}
          className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white opacity-0 transition group-hover:opacity-100 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <X size={12} />
        </button>
      </div>
    );
  }

  const previewIcon =
    entry.type === "pdf" ? pdfIcon : entry.type === "video" ? videoIcon : fileIcon;

  return (
    <div className="group relative flex w-32 flex-col gap-2 rounded-xl border border-slate-200 bg-white p-3">
      <img src={previewIcon} alt={entry.file.name} className="h-10 w-10 object-contain" />
      <div className="line-clamp-2 text-xs font-medium text-slate-700">{entry.file.name}</div>
      <button
        type="button"
        disabled={disabled}
        onClick={onRemove}
        className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white opacity-0 transition group-hover:opacity-100 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <X size={12} />
      </button>
    </div>
  );
}

export default function TicketAttachmentPicker({
  files,
  onChange,
  disabled = false,
}) {
  const inputRef = useRef(null);

  const previewEntries = useMemo(
    () =>
      (Array.isArray(files) ? files : []).map((file) => ({
        file,
        previewUrl:
          file.type.startsWith("image/") || file.type === "image/gif"
            ? URL.createObjectURL(file)
            : null,
        type: getFileType({
          name: file.name,
          contentType: file.type,
        }),
      })),
    [files]
  );

  useEffect(() => {
    return () => {
      previewEntries.forEach((entry) => {
        if (entry.previewUrl) {
          URL.revokeObjectURL(entry.previewUrl);
        }
      });
    };
  }, [previewEntries]);

  const handleAddFiles = (event) => {
    const incomingFiles = Array.from(event.target.files || []);
    if (!incomingFiles.length) {
      return;
    }

    const currentFiles = Array.isArray(files) ? files : [];
    const remainingSlots = MAX_TICKET_ATTACHMENTS - currentFiles.length;

    if (remainingSlots <= 0) {
      toast.error(`Chỉ được đính kèm tối đa ${MAX_TICKET_ATTACHMENTS} tệp.`);
      event.target.value = "";
      return;
    }

    const acceptedFiles = incomingFiles.slice(0, remainingSlots);
    if (incomingFiles.length > remainingSlots) {
      toast.warning(`Chỉ thêm được ${remainingSlots} tệp nữa.`);
    }

    for (const file of acceptedFiles) {
      const validation = validateTicketAttachmentFile(file);
      if (!validation.valid) {
        toast.error(validation.error);
        event.target.value = "";
        return;
      }
    }

    onChange?.([...currentFiles, ...acceptedFiles]);
    event.target.value = "";
  };

  const handleRemoveFile = (indexToRemove) => {
    const currentFiles = Array.isArray(files) ? files : [];
    onChange?.(currentFiles.filter((_, index) => index !== indexToRemove));
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={disabled || (files?.length || 0) >= MAX_TICKET_ATTACHMENTS}
          onClick={() => inputRef.current?.click()}
          className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-300 px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Paperclip size={16} />
          Đính kèm tệp
        </button>

        <span className="text-xs text-slate-500">
          Tối đa {MAX_TICKET_ATTACHMENTS} tệp, mỗi tệp không quá 10MB.
        </span>
      </div>

      <input
        ref={inputRef}
        type="file"
        hidden
        multiple
        disabled={disabled}
        accept={TICKET_ATTACHMENT_ACCEPT}
        onChange={handleAddFiles}
      />

      {!!previewEntries.length && (
        <div className="flex flex-wrap gap-3">
          {previewEntries.map((entry, index) => (
            <PreviewCard
              key={`${entry.file.name}-${index}`}
              entry={entry}
              disabled={disabled}
              onRemove={() => handleRemoveFile(index)}
            />
          ))}
        </div>
      )}
    </div>
  );
}