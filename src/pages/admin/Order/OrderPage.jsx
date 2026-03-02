import React, { useMemo, useState } from "react";
import { toast } from "sonner";
import { FiSearch, FiShoppingCart } from "react-icons/fi";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

import Pagination from "../../../components/common/Pagination";
import Breadcrumb from "../../../components/ui/Breadcrumb.jsx";
import { orderService } from "../../../services/orderService";

const ORDER_STATUS_OPTIONS = [
  { value: "", label: "Tất cả trạng thái" },
  { value: "0", label: "Pending" },
  { value: "1", label: "Confirmed" },
  { value: "2", label: "Processing" },
  { value: "3", label: "Shipping" },
  { value: "4", label: "Delivered" },
  { value: "5", label: "ReadyForPickup" },
  { value: "6", label: "PickedUp" },
  { value: "7", label: "Completed" },
  { value: "8", label: "Installing" },
  { value: "9", label: "Canceled" },
  { value: "10", label: "Refunded" },
];

const STATUS_BADGE_CLASS = {
  Pending: "bg-amber-100 text-amber-700 border-amber-200",
  Confirmed: "bg-indigo-100 text-indigo-700 border-indigo-200",
  Processing: "bg-blue-100 text-blue-700 border-blue-200",
  Shipping: "bg-sky-100 text-sky-700 border-sky-200",
  Delivered: "bg-emerald-100 text-emerald-700 border-emerald-200",
  ReadyForPickup: "bg-cyan-100 text-cyan-700 border-cyan-200",
  PickedUp: "bg-emerald-100 text-emerald-700 border-emerald-200",
  Completed: "bg-green-100 text-green-700 border-green-200",
  Installing: "bg-violet-100 text-violet-700 border-violet-200",
  Canceled: "bg-rose-100 text-rose-700 border-rose-200",
  Refunded: "bg-slate-100 text-slate-700 border-slate-200",
};

const DELIVERY_TEXT = {
  Shipping: "Giao hàng",
  PickUp: "Nhận tại cửa hàng",
};

const PAID_TEXT = {
  Full: "Thanh toán đủ",
  Installment: "Trả góp",
};

const SORT_BY_OPTIONS = [
  { value: "", label: "Sắp xếp theo" },
  { value: "0", label: "Ngày đặt" },
  { value: "1", label: "Tổng tiền" },
];

function formatPrice(value) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(Number(value || 0));
}

function formatDate(value) {
  if (!value) return "--";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "--";
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(parsed);
}

function StatusBadge({ status }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${
        STATUS_BADGE_CLASS[status] || "bg-slate-100 text-slate-700 border-slate-200"
      }`}
    >
      {status || "--"}
    </span>
  );
}

export default function OrderPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [status, setStatus] = useState("");
  const [sortBy, setSortBy] = useState("");
  const [sortDirection, setSortDirection] = useState("");

  const [pageNumber, setPageNumber] = useState(0);
  const [pageSize] = useState(20);

  const queryParams = {
    Page: pageNumber + 1,
    PageSize: pageSize,
    Search: searchTerm || null,
    Status: status !== "" ? Number(status) : null,
    SortBy: sortBy !== "" ? Number(sortBy) : null,
    SortDirection: sortDirection !== "" ? Number(sortDirection) : null,
  };

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["admin-orders", queryParams],
    queryFn: async () => {
      const res = await orderService.getOrders(queryParams);
      if (!res.succeeded) {
        toast.error(res.message || "Không thể tải danh sách đơn hàng");
        return { items: [], totalCount: 0, totalPages: 1 };
      }
      return res.value;
    },
    staleTime: 30_000,
    placeholderData: (prev) => prev,
  });

  const loading = isLoading || isFetching;
  const rows = useMemo(() => data?.items ?? [], [data?.items]);
  const totalItems = data?.totalCount ?? 0;
  const totalPages = data?.totalPages ?? 1;

  const handleSearch = () => {
    setPageNumber(0);
    setSearchTerm(query.trim());
  };

  const handleResetFilters = () => {
    setQuery("");
    setSearchTerm("");
    setStatus("");
    setSortBy("");
    setSortDirection("");
    setPageNumber(0);
  };

  const paddedRows = useMemo(() => {
    const real = rows.slice(0, pageSize);
    const missing = Math.max(0, pageSize - real.length);
    return [...real, ...Array.from({ length: missing }, () => null)];
  }, [rows, pageSize]);

  const hasActiveFilters =
    searchTerm || status !== "" || sortBy !== "" || sortDirection !== "";

  return (
    <div className="font-[var(--font-inter)]">
      <Breadcrumb
        items={[
          { label: "Trang chủ", href: "/admin" },
          { label: "Quản lý đơn hàng" },
        ]}
      />

      <div className="mt-3">
        <h1 className="text-2xl font-semibold text-[#334155]">Quản lý đơn hàng</h1>
        <p className="text-sm text-slate-500 mt-1">
          Tổng cộng <span className="font-semibold text-blue-600">{totalItems}</span> đơn hàng
        </p>
      </div>

      <div className="mt-4 rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="p-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
            <div className="md:col-span-4 relative">
              <FiSearch
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                size={18}
              />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") handleSearch();
                }}
                placeholder="Tìm theo mã đơn, email, tên khách..."
                className="h-10 w-full rounded border border-slate-200 pl-10 pr-3 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100 transition-all"
              />
            </div>

            <div className="md:col-span-3">
              <select
                value={status}
                onChange={(event) => {
                  setStatus(event.target.value);
                  setPageNumber(0);
                }}
                className="h-10 w-full rounded border border-slate-200 px-3 text-sm outline-none focus:border-slate-400"
              >
                {ORDER_STATUS_OPTIONS.map((option) => (
                  <option key={option.value || "all"} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <select
                value={sortBy}
                onChange={(event) => {
                  setSortBy(event.target.value);
                  setPageNumber(0);
                  if (sortDirection === "") setSortDirection("0");
                }}
                className="h-10 w-full rounded border border-slate-200 px-3 text-sm outline-none focus:border-slate-400"
              >
                {SORT_BY_OPTIONS.map((option) => (
                  <option key={option.value || "none"} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <select
                value={sortDirection}
                onChange={(event) => {
                  setSortDirection(event.target.value);
                  setPageNumber(0);
                }}
                className="h-10 w-full rounded border border-slate-200 px-3 text-sm outline-none focus:border-slate-400"
              >
                <option value="">Hướng sắp xếp</option>
                <option value="0">Tăng dần</option>
                <option value="1">Giảm dần</option>
              </select>
            </div>

            <div className="md:col-span-1">
              <button
                type="button"
                onClick={handleSearch}
                disabled={loading}
                className="h-10 w-full rounded bg-blue-500 text-white text-sm font-semibold hover:bg-blue-600 disabled:opacity-50 transition-colors"
              >
                Tìm
              </button>
            </div>
          </div>

          {hasActiveFilters && (
            <div className="mt-3 flex items-center justify-between">
              <div className="text-xs text-slate-500">Đang lọc kết quả</div>
              <button
                type="button"
                onClick={handleResetFilters}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium"
              >
                Xóa bộ lọc
              </button>
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gradient-to-r from-slate-50 to-slate-100 border-b-2 border-slate-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                  Mã đơn
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                  Ngày đặt
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                  Người nhận
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                  Giao nhận
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                  Thanh toán
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                  Tổng tiền
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                  Trạng thái
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {paddedRows.map((order, index) => {
                if (!order) {
                  return (
                    <tr key={`empty-${index}`} className="bg-slate-50">
                      <td colSpan={7} className="px-6 py-4">
                        <div className="h-12" />
                      </td>
                    </tr>
                  );
                }

                return (
                  <tr
                    key={order.id}
                    className="hover:bg-blue-50 transition-colors cursor-pointer"
                    onClick={() => navigate(`/admin/orders/${order.id}`)}
                  >
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-800">
                        #{String(order.id || "").slice(0, 8).toUpperCase()}
                      </div>
                      <div className="text-xs text-slate-500">{order.id}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-700">{formatDate(order.orderDate)}</td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-800">{order.receiverFullName || "--"}</div>
                      <div className="text-xs text-slate-500">{order.receiverEmail || "--"}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-700">
                      {DELIVERY_TEXT[order.deliveryType] || order.deliveryType || "--"}
                    </td>
                    <td className="px-6 py-4 text-slate-700">
                      {PAID_TEXT[order.paidType] || order.paidType || "--"}
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-700">
                      {formatPrice(order.totalPrice)}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={order.status} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {!loading && rows.length === 0 && (
          <div className="py-16 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-100 rounded-full mb-4">
              <FiShoppingCart className="text-slate-400" size={32} />
            </div>
            <h3 className="text-lg font-semibold text-slate-700 mb-1">Không tìm thấy đơn hàng</h3>
            <p className="text-sm text-slate-500">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
          </div>
        )}
      </div>

      <div className="mt-4 flex justify-center">
        <Pagination
          loading={loading}
          pageNumber={pageNumber}
          pageSize={pageSize}
          totalItems={totalItems}
          totalPages={totalPages}
          onPageChange={setPageNumber}
        />
      </div>
    </div>
  );
}
