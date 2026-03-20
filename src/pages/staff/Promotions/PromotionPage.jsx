import React, { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FiGift, FiSearch } from "react-icons/fi";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

import Breadcrumb from "../../../components/ui/Breadcrumb";
import Pagination from "../../../components/common/Pagination";
import { apiService } from "../../../config/axios";
import {
  cacheCustomerPromotions,
  formatCurrency,
  formatDateTime,
  getPromotionScopeLabel,
  getPromotionStatus,
  getPromotionTypeLabel,
  PROMOTION_SORT_OPTIONS,
  toDateTimeOffsetString,
} from "../../admin/Promotions/promotionHelpers";

const T = {
  home: "Trang ch\u1ee7",
  title: "Qu\u1ea3n l\u00fd khuy\u1ebfn m\u00e3i",
  total: "T\u1ed5ng c\u1ed9ng",
  visibleForCustomer: "khuy\u1ebfn m\u00e3i \u0111ang hi\u1ec3n th\u1ecb cho kh\u00e1ch h\u00e0ng",
  searchPlaceholder: "T\u00ecm theo t\u00ean ho\u1eb7c m\u00e3",
  desc: "Gi\u1ea3m",
  asc: "T\u0103ng",
  search: "T\u00ecm ki\u1ebfm",
  clearFilters: "X\u00f3a b\u1ed9 l\u1ecdc",
  promotion: "Khuy\u1ebfn m\u00e3i",
  type: "Lo\u1ea1i",
  scope: "Ph\u1ea1m vi",
  value: "Gi\u00e1 tr\u1ecb",
  time: "Th\u1eddi gian",
  status: "Tr\u1ea1ng th\u00e1i",
  code: "M\u00e3",
  until: "\u0111\u1ebfn",
  emptyTitle: "Kh\u00f4ng t\u00ecm th\u1ea5y khuy\u1ebfn m\u00e3i",
  emptyDesc: "H\u00e3y th\u1eed thay \u0111\u1ed5i t\u1eeb kh\u00f3a t\u00ecm ki\u1ebfm ho\u1eb7c b\u1ed9 l\u1ecdc.",
  loadError: "Kh\u00f4ng th\u1ec3 t\u1ea3i danh s\u00e1ch khuy\u1ebfn m\u00e3i",
};

function StatusBadge({ promotion }) {
  const status = getPromotionStatus(promotion);

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${status.className}`}
    >
      {status.label}
    </span>
  );
}

export default function StaffPromotionPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [sortBy, setSortBy] = useState("CreatedAt");
  const [isDescending, setIsDescending] = useState(true);
  const [pageNumber, setPageNumber] = useState(0);
  const [pageSize] = useState(20);

  const queryParams = {
    search: searchTerm || undefined,
    fromDate: toDateTimeOffsetString(fromDate),
    toDate: toDateTimeOffsetString(toDate, true),
    sortBy,
    isDescending,
    page: pageNumber + 1,
    pageSize,
  };

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["staff-promotions", queryParams],
    queryFn: async () => {
      const res = await apiService.get("/promotion/customer_guest/all", queryParams);

      if (res?.statusCode !== 200) {
        toast.error(T.loadError);
        return { items: [], totalCount: 0, totalPages: 1 };
      }

      return res.value;
    },
    keepPreviousData: true,
    staleTime: 30_000,
  });

  const rows = useMemo(() => data?.items ?? [], [data?.items]);
  const totalItems = data?.totalCount ?? 0;
  const totalPages = data?.totalPages ?? 1;
  const loading = isLoading || isFetching;

  useEffect(() => {
    cacheCustomerPromotions(rows);
  }, [rows]);

  const handleSearch = () => {
    setPageNumber(0);
    setSearchTerm(query.trim());
  };

  const handleResetFilters = () => {
    setQuery("");
    setSearchTerm("");
    setFromDate("");
    setToDate("");
    setSortBy("CreatedAt");
    setIsDescending(true);
    setPageNumber(0);
  };

  const paddedRows = useMemo(() => {
    const real = rows.slice(0, pageSize);
    const missing = Math.max(0, pageSize - real.length);
    return [...real, ...Array.from({ length: missing }, () => null)];
  }, [rows, pageSize]);

  const hasActiveFilters =
    Boolean(searchTerm) || Boolean(fromDate) || Boolean(toDate) || sortBy !== "CreatedAt" || !isDescending;

  return (
    <div className="font-[var(--font-inter)]">
      <Breadcrumb
        items={[
          { label: T.home, href: "/staff" },
          { label: T.title },
        ]}
      />

      <div className="mt-3">
        <h1 className="text-2xl font-semibold text-[#334155]">{T.title}</h1>
        <p className="mt-1 text-sm text-slate-500">
          {T.total} <span className="font-semibold text-blue-600">{totalItems}</span> {T.visibleForCustomer}
        </p>
      </div>

      <div className="mt-4 rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white p-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-10">
            <div className="relative md:col-span-3">
              <FiSearch
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                size={18}
              />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={(event) => event.key === "Enter" && handleSearch()}
                placeholder={T.searchPlaceholder}
                className="h-10 w-full rounded border border-slate-200 pl-10 pr-3 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
              />
            </div>

            <div className="md:col-span-2">
              <input
                type="date"
                value={fromDate}
                onChange={(event) => {
                  setPageNumber(0);
                  setFromDate(event.target.value);
                }}
                className="h-10 w-full rounded border border-slate-200 px-3 text-sm outline-none focus:border-slate-400"
              />
            </div>

            <div className="md:col-span-2">
              <input
                type="date"
                value={toDate}
                onChange={(event) => {
                  setPageNumber(0);
                  setToDate(event.target.value);
                }}
                className="h-10 w-full rounded border border-slate-200 px-3 text-sm outline-none focus:border-slate-400"
              />
            </div>

            <div className="md:col-span-2">
              <select
                value={sortBy}
                onChange={(event) => {
                  setPageNumber(0);
                  setSortBy(event.target.value);
                }}
                className="h-10 w-full rounded border border-slate-200 px-3 text-sm outline-none focus:border-slate-400"
              >
                {PROMOTION_SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-1">
              <button
                type="button"
                onClick={() => {
                  setPageNumber(0);
                  setIsDescending((prev) => !prev);
                }}
                className="h-10 w-full rounded border border-slate-200 px-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                {isDescending ? T.desc : T.asc}
              </button>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between">
            <button
              type="button"
              onClick={handleSearch}
              disabled={loading}
              className="inline-flex h-10 items-center gap-2 rounded bg-blue-500 px-4 text-sm font-semibold text-white hover:bg-blue-600 disabled:opacity-50"
            >
              <FiSearch size={16} />
              {T.search}
            </button>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                {T.clearFilters}
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b-2 border-slate-200 bg-gradient-to-r from-slate-50 to-slate-100">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-600">
                  {T.promotion}
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-600">
                  {T.type}
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-600">
                  {T.scope}
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-600">
                  {T.value}
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-600">
                  {T.time}
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-600">
                  {T.status}
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {paddedRows.map((promotion, index) => {
                if (!promotion) {
                  return (
                    <tr key={`empty-${index}`} className="bg-slate-50">
                      <td colSpan={6} className="px-6 py-4">
                        <div className="h-12" />
                      </td>
                    </tr>
                  );
                }

                const discountType = promotion.discountType ?? promotion.type;

                return (
                  <tr
                    key={promotion.id}
                    className="cursor-pointer transition-colors hover:bg-blue-50"
                    onClick={() => navigate(`/staff/promotions/${promotion.id}`, { state: { promotion } })}
                  >
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-800">{promotion.name}</div>
                      <div className="mt-1 text-xs text-slate-500">
                        {T.code}: <code className="rounded bg-slate-100 px-2 py-1">{promotion.code || "-"}</code>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-700">{getPromotionTypeLabel(promotion)}</td>
                    <td className="px-6 py-4 text-slate-700">{getPromotionScopeLabel(promotion.scope)}</td>
                    <td className="px-6 py-4 font-semibold text-slate-700">
                      {discountType === "PercentageDiscount"
                        ? `${promotion.discountValue}%`
                        : formatCurrency(promotion.discountValue)}
                    </td>
                    <td className="px-6 py-4 text-slate-700">
                      <div>{formatDateTime(promotion.startDate)}</div>
                      <div className="mt-1 text-xs text-slate-500">{T.until} {formatDateTime(promotion.endDate)}</div>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge promotion={promotion} />
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
              <FiGift className="text-slate-400" size={32} />
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