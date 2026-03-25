import React from "react";
import { FiPackage, FiRefreshCw } from "react-icons/fi";
import { Link } from "react-router-dom";

import {
  formatDashboardCurrency,
  formatDashboardNumber,
  formatDashboardPercentage,
} from "../../utils/dashboard";

const toneClasses = {
  emerald: {
    badge: "bg-emerald-50 text-emerald-700",
    bar: "bg-emerald-500",
  },
  rose: {
    badge: "bg-rose-50 text-rose-700",
    bar: "bg-rose-500",
  },
};

function LoadingRow() {
  return (
    <div className="rounded-xl border border-slate-200 p-4">
      <div className="h-4 w-20 animate-pulse rounded bg-slate-100" />
      <div className="mt-3 h-5 w-48 animate-pulse rounded bg-slate-100" />
      <div className="mt-3 h-3 w-full animate-pulse rounded bg-slate-100" />
      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="h-10 animate-pulse rounded bg-slate-100" />
        ))}
      </div>
    </div>
  );
}

export default function AdminDashboardRankingPanel({
  title,
  description,
  items,
  isLoading,
  error,
  onRetry,
  tone = "emerald",
  emptyMessage,
}) {
  const classes = toneClasses[tone] || toneClasses.emerald;

  return (
    <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white px-5 py-4">
        <h2 className="text-lg font-semibold text-[#334155]">{title}</h2>
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      </div>

      <div className="space-y-4 p-5">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, index) => <LoadingRow key={index} />)
        ) : error ? (
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-8 text-center">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-500">
              <FiPackage size={20} />
            </div>
            <p className="mt-4 text-sm text-slate-500">
              {error.message || "Không thể tải bảng xếp hạng sản phẩm."}
            </p>
            <button
              type="button"
              onClick={onRetry}
              className="mt-5 inline-flex items-center gap-2 rounded border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-white"
            >
              <FiRefreshCw />
              Thử lại
            </button>
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-10 text-center">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-500">
              <FiPackage size={20} />
            </div>
            <p className="mt-4 text-sm text-slate-500">{emptyMessage}</p>
          </div>
        ) : (
          items.map((item, index) => {
            const contributionPercent = Math.min(
              Math.max((Number(item?.contributionRatio) || 0) * 100, 0),
              100,
            );

            return (
              <div
                key={`${item.productId}-${index}`}
                className="rounded-xl border border-slate-200 p-4 transition hover:border-slate-300"
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-sm font-semibold ${classes.badge}`}
                  >
                    #{index + 1}
                  </div>

                  <div className="min-w-0 flex-1">
                    <Link
                      to={`/admin/products/${item.productId}`}
                      className="block truncate text-base font-semibold text-[#334155] transition hover:text-blue-600"
                    >
                      {item.productName}
                    </Link>

                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={`h-full rounded-full ${classes.bar}`}
                        style={{ width: `${contributionPercent}%` }}
                      />
                    </div>

                    <div className="mt-4 grid gap-2 sm:grid-cols-3">
                      <div className="rounded-lg bg-slate-50 px-3 py-2">
                        <div className="text-xs uppercase tracking-wide text-slate-400">
                          Doanh thu
                        </div>
                        <div className="mt-1 text-sm font-semibold text-slate-700">
                          {formatDashboardCurrency(item.revenue)}
                        </div>
                      </div>

                      <div className="rounded-lg bg-slate-50 px-3 py-2">
                        <div className="text-xs uppercase tracking-wide text-slate-400">
                          Đã bán
                        </div>
                        <div className="mt-1 text-sm font-semibold text-slate-700">
                          {formatDashboardNumber(item.totalQuantitySold)} sản phẩm
                        </div>
                      </div>

                      <div className="rounded-lg bg-slate-50 px-3 py-2">
                        <div className="text-xs uppercase tracking-wide text-slate-400">
                          Tỷ trọng
                        </div>
                        <div className="mt-1 text-sm font-semibold text-slate-700">
                          {formatDashboardPercentage(item.contributionRatio)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
