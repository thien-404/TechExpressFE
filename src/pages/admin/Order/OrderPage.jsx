import React from "react";

import ManagementOrderListView from "../../../components/order/ManagementOrderListView.jsx";

export default function OrderPage() {
  return <ManagementOrderListView basePath="/admin" listQueryKey="admin-orders" />;
}