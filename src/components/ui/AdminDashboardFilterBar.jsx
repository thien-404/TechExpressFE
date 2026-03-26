import React from "react";
import { FiDownload, FiRefreshCw, FiRotateCcw } from "react-icons/fi";

import BrandSelect from "./select/BrandSelect.jsx";
import CategorySelect from "./select/CategorySelect.jsx";

function LoadingField() {
  return (
    <div className="h-10 animate-pulse rounded border border-slate-200 bg-slate-100" />
  );
}

export default function AdminDashboardFilterBar({
  filters,
  brands,
  brandsLoading,
  brandsError,
  isRefreshing,
  isExporting,
  onFilterChange,
  onRefresh,
  onReset,
  onExportPdf,
}) {
  const hasInvalidDateRange =
    filters.fromDate && filters.toDate && filters.fromDate > filters.toDate;

  return (
    <div className="mt-4 rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white px-4 py-4">
        <h2 className="text-lg font-semibold text-[#334155]">Bộ lọc dashboard</h2>
        <p className="mt-1 text-sm text-slate-500">
          Đồng bộ doanh thu, bảng xếp hạng sản phẩm và gợi ý nhập hàng theo cùng
          một khoảng thời gian.
        </p>
      </div>

      <div className="space-y-4 p-4">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
          <div className="lg:col-span-3">
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Thương hiệu
            </label>
            {brandsLoading ? (
              <LoadingField />
            ) : (
              <BrandSelect
                value={filters.brandId}
                onChange={(value) => onFilterChange("brandId", value)}
                brands={brands}
                placeholder="Tất cả thương hiệu"
              />
            )}
            {brandsError ? (
              <p className="mt-2 text-xs text-amber-700">
                Không tải được danh sách thương hiệu, bạn vẫn có thể lọc theo
                danh mục và thời gian.
              </p>
            ) : null}
          </div>

          <div className="lg:col-span-3">
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Danh mục
            </label>
            <CategorySelect
              value={filters.categoryId}
              onChange={(value) => onFilterChange("categoryId", value)}
              categories={[]}
              placeholder="Tất cả danh mục"
            />
          </div>

          <div className="lg:col-span-2">
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Từ ngày
            </label>
            <input
              type="date"
              value={filters.fromDate}
              onChange={(event) => onFilterChange("fromDate", event.target.value)}
              className="h-10 w-full rounded border border-slate-200 px-3 text-sm outline-none transition-all focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
            />
          </div>

          <div className="lg:col-span-2">
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Đến ngày
            </label>
            <input
              type="date"
              value={filters.toDate}
              onChange={(event) => onFilterChange("toDate", event.target.value)}
              className="h-10 w-full rounded border border-slate-200 px-3 text-sm outline-none transition-all focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
            />
          </div>

          <div className="lg:col-span-2">
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Hành động
            </label>
            <div className="flex h-10 gap-2">
              <button
                type="button"
                onClick={onRefresh}
                disabled={isRefreshing || hasInvalidDateRange}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded border border-slate-200 px-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <FiRefreshCw className={isRefreshing ? "animate-spin" : ""} />
                Làm mới
              </button>

              <button
                type="button"
                onClick={onReset}
                className="inline-flex items-center justify-center rounded border border-slate-200 px-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                title="Đặt lại bộ lọc"
              >
                <FiRotateCcw />
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-slate-500">
            Mặc định đang hiển thị 12 tháng gần nhất, bạn có thể điều chỉnh để
            đối chiếu theo chiến dịch hoặc mùa vụ.
          </div>

          <button
            type="button"
            onClick={onExportPdf}
            disabled={isExporting || hasInvalidDateRange}
            className="inline-flex items-center justify-center gap-2 rounded bg-[#6e846f] px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <FiDownload />
            {isExporting ? "Đang xuất PDF..." : "Xuất PDF"}
          </button>
        </div>

        {hasInvalidDateRange ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Từ ngày không được lớn hơn đến ngày. Hãy điều chỉnh lại khoảng thời
            gian để tải dữ liệu dashboard.
          </div>
        ) : null}
      </div>
    </div>
  );
}
