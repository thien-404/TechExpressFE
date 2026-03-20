import { Link } from "react-router-dom";

import TicketStatusBadge from "./TicketStatusBadge";
import {
  formatTicketDateTime,
  formatTicketRelativeTime,
} from "../../utils/ticket";

function CardBody({ item, selected = false }) {
  return (
    <div
      className={`rounded-2xl border p-4 shadow-sm transition ${
        selected
          ? "border-[#0090D0] bg-[#0090D0]/5"
          : "border-slate-200 bg-white hover:border-slate-300"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Ticket #{String(item.id || "").slice(0, 8).toUpperCase()}
          </div>
          <h3 className="mt-1 line-clamp-2 text-base font-semibold text-slate-900">
            {item.title}
          </h3>
        </div>
        <TicketStatusBadge status={item.status} />
      </div>

      <p className="mt-3 line-clamp-3 whitespace-pre-wrap text-sm leading-6 text-slate-600">
        {item.description || "Không có mô tả."}
      </p>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
        <span>Cập nhật {formatTicketRelativeTime(item.updatedAt)}</span>
        <span>{formatTicketDateTime(item.updatedAt)}</span>
      </div>
    </div>
  );
}

export default function TicketSummaryCard({
  item,
  selected = false,
  to,
  onClick,
}) {
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