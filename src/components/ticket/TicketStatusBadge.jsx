import { getTicketStatusLabel, normalizeTicketStatus } from "../../utils/ticket";

const STATUS_CLASS_NAMES = {
  Open: "border-blue-200 bg-blue-50 text-blue-700",
  InProgress: "border-amber-200 bg-amber-50 text-amber-700",
  WaitingForCustomer: "border-violet-200 bg-violet-50 text-violet-700",
  Resolved: "border-emerald-200 bg-emerald-50 text-emerald-700",
  Closed: "border-slate-200 bg-slate-100 text-slate-700",
};

export default function TicketStatusBadge({ status, className = "" }) {
  const normalizedStatus = normalizeTicketStatus(status) || "Open";

  return (
    <span
      className={[
        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold",
        STATUS_CLASS_NAMES[normalizedStatus] || STATUS_CLASS_NAMES.Open,
        className,
      ].join(" ")}
    >
      {getTicketStatusLabel(normalizedStatus)}
    </span>
  );
}
