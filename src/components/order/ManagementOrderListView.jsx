import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FiSearch, FiShoppingCart } from "react-icons/fi";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

import Pagination from "../common/Pagination";
import Breadcrumb from "../ui/Breadcrumb.jsx";
import OrderStatusBadge from "./OrderStatusBadge.jsx";
import { orderService } from "../../services/orderService";
import {
  ORDER_STATUS_OPTIONS,
  formatDate,
  formatPrice,
  getDeliveryText,
  getPaidText,
} from "../../utils/orderManagement";

const T = {
  home: "Trang chủ",
  title: "Quản lý đơn hàng",
  total: "Tổng cộng",
  searchPlaceholder: "Tìm theo mã đơn, email, tên khách...",
  sortBy: "Sắp xếp theo",
  orderDate: "Ngày đặt",
  totalPrice: "Tổng tiền",
  sortDirection: "Hướng sắp xếp",
  asc: "Tăng dần",
  desc: "Giảm dần",
  search: "Tìm",
  filtering: "Đang lọc kết quả",
  clearFilters: "Xóa bộ lọc",
  orderCode: "Mã đơn",
  receiver: "Người nhận",
  delivery: "Giao nhận",
  payment: "Thanh toán",
  status: "Trạng thái",
  emptyTitle: "Không tìm thấy đơn hàng",
  emptyDesc: "Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm.",
  loadError: "Không thể tải danh sách đơn hàng",
};

const SORT_BY_OPTIONS = [
  { value: "", label: T.sortBy },
  { value: "0", label: T.orderDate },
  { value: "1", label: T.totalPrice },
];

export default function ManagementOrderListView({ basePath, listQueryKey }) {
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
    queryKey: [listQueryKey, queryParams],
    queryFn: async () => {
      const res = await orderService.getOrders(queryParams);
      if (!res.succeeded) {
        toast.error(res.message || T.loadError);
        return { items: [], totalCount: 0, totalPages: 1 };
      }
      return res.value;
    },
    staleTime: 30_000,
    placeholderData: (previous) => previous,
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
    Boolean(searchTerm) || status !== "" || sortBy !== "" || sortDirection !== "";

  return (
    <div className="font-[var(--font-inter)]">
      <Breadcrumb
        items={[
          { label: T.home, href: basePath },
          { label: T.title },
        ]}
      />

      <div className="mt-3">
        <h1 className="text-2xl font-semibold text-[#334155]">{T.title}</h1>
        <p className="mt-1 text-sm text-slate-500">
          {T.total} <span className="font-semibold text-blue-600">{totalItems}</span> {"đơn hàng"}
        </p>
      </div>

      <div className="mt-4 rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white p-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
            <div className="relative md:col-span-4">
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
                placeholder={T.searchPlaceholder}
                className="h-10 w-full rounded border border-slate-200 pl-10 pr-3 text-sm outline-none transition-all focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
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
                <option value="">{T.sortDirection}</option>
                <option value="0">{T.asc}</option>
                <option value="1">{T.desc}</option>
              </select>
            </div>

            <div className="md:col-span-1">
              <button
                type="button"
                onClick={handleSearch}
                disabled={loading}
                className="h-10 w-full rounded bg-blue-500 text-sm font-semibold text-white transition-colors hover:bg-blue-600 disabled:opacity-50"
              >
                {T.search}
              </button>
            </div>
          </div>

          {hasActiveFilters && (
            <div className="mt-3 flex items-center justify-between">
              <div className="text-xs text-slate-500">{T.filtering}</div>
              <button
                type="button"
                onClick={handleResetFilters}
                className="text-xs font-medium text-blue-600 hover:text-blue-700"
              >
                {T.clearFilters}
              </button>
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b-2 border-slate-200 bg-gradient-to-r from-slate-50 to-slate-100">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-600">
                  {T.orderCode}
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-600">
                  {T.orderDate}
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-600">
                  {T.receiver}
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-600">
                  {T.delivery}
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-600">
                  {T.payment}
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-600">
                  {T.totalPrice}
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-600">
                  {T.status}
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
                    className="cursor-pointer transition-colors hover:bg-blue-50"
                    onClick={() => navigate(`${basePath}/orders/${order.id}`)}
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
                    <td className="px-6 py-4 text-slate-700">{getDeliveryText(order.deliveryType)}</td>
                    <td className="px-6 py-4 text-slate-700">{getPaidText(order.paidType)}</td>
                    <td className="px-6 py-4 font-semibold text-slate-700">{formatPrice(order.totalPrice)}</td>
                    <td className="px-6 py-4">
                      <OrderStatusBadge status={order.status} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {!loading && rows.length === 0 && (
          <div className="py-16 text-center">
            <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
              <FiShoppingCart className="text-slate-400" size={32} />
            </div>
            <h3 className="mb-1 text-lg font-semibold text-slate-700">{T.emptyTitle}</h3>
            <p className="text-sm text-slate-500">{T.emptyDesc}</p>
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