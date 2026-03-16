import React, { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  FiGift,
  FiPlus,
  FiPower,
  FiSearch,
  FiTrash2,
} from "react-icons/fi";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

import Breadcrumb from "../../../components/ui/Breadcrumb";
import Pagination from "../../../components/common/Pagination";
import { apiService } from "../../../config/axios";
import { queryClient } from "../../../config/queryClient";
import {
  cachePromotions,
  formatCurrency,
  formatDateTime,
  getPromotionScopeLabel,
  getPromotionStatus,
  getPromotionTypeLabel,
  PROMOTION_SORT_OPTIONS,
  toDateTimeOffsetString,
} from "./promotionHelpers";

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

export default function PromotionPage() {
  const navigate = useNavigate();

  const [query, setQuery] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [status, setStatus] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [sortBy, setSortBy] = useState("CreatedAt");
  const [isDescending, setIsDescending] = useState(true);
  const [pageNumber, setPageNumber] = useState(0);
  const [pageSize] = useState(20);

  const queryParams = {
    search: searchTerm || undefined,
    status: status === "" ? undefined : status === "true",
    fromDate: toDateTimeOffsetString(fromDate),
    toDate: toDateTimeOffsetString(toDate, true),
    sortBy,
    isDescending,
    page: pageNumber + 1,
    pageSize,
  };

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["admin-promotions", queryParams],
    queryFn: async () => {
      const res = await apiService.get("/promotion/admin/all", queryParams);

      if (res?.statusCode !== 200) {
        toast.error("Không thể tải danh sách khuyến mãi");
        return { items: [], totalCount: 0, totalPages: 1 };
      }

      return res.value;
    },
    keepPreviousData: true,
    staleTime: 30_000,
  });

  const rows = useMemo(() => data?.items || [], [data]);
  const totalItems = data?.totalCount || 0;
  const totalPages = data?.totalPages || 1;
  const loading = isLoading || isFetching;

  useEffect(() => {
    cachePromotions(rows);
  }, [rows]);

  const disableMutation = useMutation({
    mutationFn: async (promotionId) => {
      const res = await apiService.post("/promotion/disable", { promotionId });

      if (res?.statusCode !== 200) {
        throw new Error(res?.message || "Vô hiệu hóa khuyến mãi thất bại");
      }

      return res.value;
    },
    onSuccess: () => {
      toast.success("Đã vô hiệu hóa khuyến mãi");
      queryClient.invalidateQueries({ queryKey: ["admin-promotions"] });
    },
    onError: (error) => {
      toast.error(error?.message || "Vô hiệu hóa khuyến mãi thất bại");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (promotionId) => {
      const res = await apiService.delete(`/promotion/${promotionId}`);

      if (res?.statusCode !== 200) {
        throw new Error(res?.message || "Xóa khuyến mãi thất bại");
      }

      return res.value;
    },
    onSuccess: (message) => {
      toast.success(message || "Đã xử lý xóa khuyến mãi");
      queryClient.invalidateQueries({ queryKey: ["admin-promotions"] });
    },
    onError: (error) => {
      toast.error(error?.message || "Xóa khuyến mãi thất bại");
    },
  });

  const handleSearch = () => {
    setPageNumber(0);
    setSearchTerm(query.trim());
  };

  const handleResetFilters = () => {
    setQuery("");
    setSearchTerm("");
    setStatus("");
    setFromDate("");
    setToDate("");
    setSortBy("CreatedAt");
    setIsDescending(true);
    setPageNumber(0);
  };

  const handleDisable = (promotion) => {
    const confirmed = window.confirm(
      `Bạn có chắc muốn vô hiệu hóa khuyến mãi "${promotion.name}"?`,
    );

    if (confirmed) {
      disableMutation.mutate(promotion.id);
    }
  };

  const handleDelete = (promotion) => {
    const confirmed = window.confirm(
      `Bạn có chắc muốn xóa khuyến mãi "${promotion.name}"?\n\nNếu khuyến mãi đã có lượt dùng, BE sẽ chuyển sang vô hiệu hóa thay vì xóa cứng.`,
    );

    if (confirmed) {
      deleteMutation.mutate(promotion.id);
    }
  };

  const paddedRows = useMemo(() => {
    const real = rows.slice(0, pageSize);
    const missing = Math.max(0, pageSize - real.length);
    return [...real, ...Array.from({ length: missing }, () => null)];
  }, [rows, pageSize]);

  const hasActiveFilters =
    searchTerm ||
    status !== "" ||
    fromDate ||
    toDate ||
    sortBy !== "CreatedAt" ||
    !isDescending;

  return (
    <div className="font-[var(--font-inter)]">
      <Breadcrumb
        items={[
          { label: "Trang chủ", href: "/admin" },
          { label: "Quản lý khuyến mãi" },
        ]}
      />

      <div className="mt-3 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#334155]">
            Quản lý khuyến mãi
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Tổng cộng <span className="font-semibold text-blue-600">{totalItems}</span>{" "}
            khuyến mãi
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate("/admin/promotions/create")}
          className="flex h-9 items-center gap-2 rounded bg-[#6e846f] px-4 text-sm font-semibold text-white hover:opacity-90"
        >
          <FiPlus size={16} />
          Tạo khuyến mãi
        </button>
      </div>

      <div className="mt-4 rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white p-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
            <div className="relative md:col-span-3">
              <FiSearch
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                size={18}
              />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="Tìm theo tên hoặc mã"
                className="h-10 w-full rounded border border-slate-200 pl-10 pr-3 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
              />
            </div>

            <div className="md:col-span-2">
              <select
                value={status}
                onChange={(e) => {
                  setPageNumber(0);
                  setStatus(e.target.value);
                }}
                className="h-10 w-full rounded border border-slate-200 px-3 text-sm outline-none focus:border-slate-400"
              >
                <option value="">Tất cả trạng thái</option>
                <option value="true">Đang bật</option>
                <option value="false">Đã tắt</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <input
                type="date"
                value={fromDate}
                onChange={(e) => {
                  setPageNumber(0);
                  setFromDate(e.target.value);
                }}
                className="h-10 w-full rounded border border-slate-200 px-3 text-sm outline-none focus:border-slate-400"
              />
            </div>

            <div className="md:col-span-2">
              <input
                type="date"
                value={toDate}
                onChange={(e) => {
                  setPageNumber(0);
                  setToDate(e.target.value);
                }}
                className="h-10 w-full rounded border border-slate-200 px-3 text-sm outline-none focus:border-slate-400"
              />
            </div>

            <div className="md:col-span-2">
              <select
                value={sortBy}
                onChange={(e) => {
                  setPageNumber(0);
                  setSortBy(e.target.value);
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
                title="Đổi chiều sắp xếp"
              >
                {isDescending ? "Giảm" : "Tăng"}
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
              Tìm kiếm
            </button>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                Xóa bộ lọc
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b-2 border-slate-200 bg-gradient-to-r from-slate-50 to-slate-100">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-600">
                  Khuyến mãi
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-600">
                  Loại
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-600">
                  Phạm vi
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-600">
                  Giá trị
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-600">
                  Lượt dùng
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-600">
                  Thời gian
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-600">
                  Trạng thái
                </th>
                <th className="px-6 py-4 text-center text-xs font-bold uppercase tracking-wider text-slate-600">
                  Thao tác
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {paddedRows.map((promotion, idx) => {
                if (!promotion) {
                  return (
                    <tr key={`empty-${idx}`} className="bg-slate-50">
                      <td colSpan={8} className="px-6 py-4">
                        <div className="h-12" />
                      </td>
                    </tr>
                  );
                }

                return (
                  <tr
                    key={promotion.id}
                    className="cursor-pointer transition-colors hover:bg-blue-50"
                    onClick={() => navigate(`/admin/promotions/${promotion.id}`)}
                  >
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-800">
                        {promotion.name}
                      </div>
                      <div className="mt-1 text-xs text-slate-500">
                        Mã:{" "}
                        <code className="rounded bg-slate-100 px-2 py-1">
                          {promotion.code || "-"}
                        </code>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-700">
                      {getPromotionTypeLabel(promotion.type)}
                    </td>
                    <td className="px-6 py-4 text-slate-700">
                      {getPromotionScopeLabel(promotion.scope)}
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-700">
                      {promotion.type === "PercentageDiscount"
                        ? `${promotion.discountValue}%`
                        : formatCurrency(promotion.discountValue)}
                    </td>
                    <td className="px-6 py-4 text-slate-700">
                      {promotion.usageCount ?? 0}/{promotion.maxUsageCount ?? "∞"}
                    </td>
                    <td className="px-6 py-4 text-slate-700">
                      <div>{formatDateTime(promotion.startDate)}</div>
                      <div className="mt-1 text-xs text-slate-500">
                        đến {formatDateTime(promotion.endDate)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge promotion={promotion} />
                    </td>
                    <td
                      className="px-6 py-4"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => navigate(`/admin/promotions/${promotion.id}`)}
                          className="rounded border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                        >
                          Chi tiết
                        </button>

                        <button
                          type="button"
                          disabled={!promotion.isActive || disableMutation.isPending}
                          onClick={() => handleDisable(promotion)}
                          className="inline-flex items-center gap-1 rounded border border-rose-200 px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <FiPower size={12} />
                          Vô hiệu hóa
                        </button>

                        <button
                          type="button"
                          disabled={deleteMutation.isPending}
                          onClick={() => handleDelete(promotion)}
                          className="inline-flex items-center gap-1 rounded border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <FiTrash2 size={12} />
                          Xóa
                        </button>
                      </div>
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
            <h3 className="mb-1 text-lg font-semibold text-slate-700">
              Không tìm thấy khuyến mãi
            </h3>
            <p className="text-sm text-slate-500">
              Hãy thử thay đổi từ khóa tìm kiếm hoặc bộ lọc
            </p>
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
