import React from "react";

import ManagementOrderListView from "../../../components/order/ManagementOrderListView.jsx";

export default function StaffOrderPage() {
  return <ManagementOrderListView basePath="/staff" listQueryKey="staff-orders" />;
}