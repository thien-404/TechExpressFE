import React from "react";

import ManagementOrderDetailView from "../../../components/order/ManagementOrderDetailView.jsx";

export default function OrderDetailPage() {
  return (
    <ManagementOrderDetailView
      role="Admin"
      basePath="/admin"
      listQueryKey="admin-orders"
      detailQueryKey="admin-order-detail"
      productBasePath="/admin/products"
    />
  );
}