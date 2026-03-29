import { Link } from "react-router-dom";

import TicketStatusBadge from "./TicketStatusBadge";
import { formatTicketDateTime, formatTicketRelativeTime } from "../../utils/ticket";

function CardBody({ item, selected = false }) {
  const ticketCode = String(item.id || "").slice(0, 8).toUpperCase();

  return (
    <div
      className={`rounded-3xl border p-4 shadow-sm transition ${
        selected
          ? "border-[#0090D0] bg-[#0090D0]/5 ring-1 ring-[#0090D0]/10"
          : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <span className="font-semibold uppercase tracking-[0.14em]">#{ticketCode || "--"}</span>
            {selected ? (
              <span className="rounded-full bg-[#0090D0]/10 px-2 py-0.5 font-medium text-[#0090D0]">
                Đang xem
              </span>
            ) : null}
          </div>
          <h3 className="mt-2 line-clamp-2 text-base font-semibold text-slate-900">
            {item.title || `Ticket #${ticketCode || "--"}`}
          </h3>
        </div>
        <TicketStatusBadge status={item.status} />
      </div>

      <p className="mt-3 line-clamp-3 whitespace-pre-wrap text-sm leading-6 text-slate-600">
        {item.description || "Chưa có mô tả chi tiết."}
      </p>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
        <span>Cập nhật {formatTicketRelativeTime(item.updatedAt)}</span>
        <span>{formatTicketDateTime(item.updatedAt)}</span>
      </div>
    </div>
  );
}

export default function TicketSummaryCard({ item, selected = false, to, onClick }) {
  if (to) {
    return (
      <Link to={to} className="block">
        <CardBody item={item} selected={selected} />
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className="block w-full text-left">
      <CardBody item={item} selected={selected} />
    </button>
  );
}
