import React from "react";

import ManagementOrderDetailView from "../../../components/order/ManagementOrderDetailView.jsx";

export default function StaffOrderDetailPage() {
  return (
    <ManagementOrderDetailView
      role="Staff"
      basePath="/staff"
      listQueryKey="staff-orders"
      detailQueryKey="staff-order-detail"
      productBasePath="/staff/products"
    />
  );
}