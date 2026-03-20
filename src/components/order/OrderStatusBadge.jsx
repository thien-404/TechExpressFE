import React from "react";

import { getStatusBadgeClass, getStatusText } from "../../utils/orderManagement";

export default function OrderStatusBadge({ status }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${getStatusBadgeClass(status)}`}
    >
      {getStatusText(status)}
    </span>
  );
}