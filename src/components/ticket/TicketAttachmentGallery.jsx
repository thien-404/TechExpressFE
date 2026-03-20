import { fileIcon, pdfIcon, videoIcon } from "../../assets/icons";
import { getFileType } from "../../utils/fileType";

function AttachmentCard({ attachment }) {
  const fileType = getFileType({
    name: attachment?.name,
    url: attachment?.fileUrl,
  });

  if (fileType === "image" || fileType === "gif") {
    return (
      <a
        href={attachment.fileUrl}
        target="_blank"
        rel="noreferrer"
        className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50"
      >
        <img
          src={attachment.fileUrl}
          alt={attachment.name || "Tệp đính kèm"}
          className="h-24 w-24 object-cover"
        />
      </a>
    );
  }

  const previewIcon = fileType === "pdf" ? pdfIcon : fileType === "video" ? videoIcon : fileIcon;
  const label =
    fileType === "pdf" ? "Tệp PDF" : fileType === "video" ? "Video" : "Tệp đính kèm";

  return (
    <a
      href={attachment.fileUrl}
      target="_blank"
      rel="noreferrer"
      className="flex w-28 flex-col items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-3 text-center transition hover:border-[#0090D0] hover:bg-[#0090D0]/5"
    >
      <img src={previewIcon} alt={label} className="h-10 w-10 object-contain" />
      <span className="line-clamp-2 text-xs font-medium text-slate-700">
        {attachment.name || label}
      </span>
    </a>
  );
}

export default function TicketAttachmentGallery({ attachments }) {
  if (!Array.isArray(attachments) || attachments.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {attachments.map((attachment, index) => (
        <AttachmentCard
          key={attachment.id || attachment.fileUrl || index}
          attachment={attachment}
        />
      ))}
    </div>
  );
}
