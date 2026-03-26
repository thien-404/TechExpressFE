import React from "react";
import { FiBarChart2, FiRefreshCw } from "react-icons/fi";

import {
  formatDashboardCurrency,
  formatDashboardCurrencyShort,
  formatDashboardMonthLabel,
} from "../../utils/dashboard";

function StateCard({ title, message, actionLabel, onAction }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white px-5 py-4">
        <h2 className="text-lg font-semibold text-[#334155]">{title}</h2>
      </div>

      <div className="flex min-h-[360px] flex-col items-center justify-center px-6 py-10 text-center">
        <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-500">
          <FiBarChart2 size={24} />
        </div>
        <p className="mt-4 max-w-xl text-sm text-slate-500">{message}</p>
        {onAction ? (
          <button
            type="button"
            onClick={onAction}
            className="mt-5 inline-flex items-center gap-2 rounded border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            <FiRefreshCw />
            {actionLabel}
          </button>
        ) : null}
      </div>
    </div>
  );
}

export default function AdminDashboardRevenueChart({
  items,
  isLoading,
  error,
  onRetry,
}) {
  if (isLoading) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white px-5 py-4">
          <div className="h-6 w-48 animate-pulse rounded bg-slate-100" />
          <div className="mt-2 h-4 w-72 animate-pulse rounded bg-slate-100" />
        </div>

        <div className="p-6">
          <div className="h-[320px] animate-pulse rounded-xl bg-slate-100" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <StateCard
        title="Doanh thu theo tháng"
        message={error.message || "Không thể tải dữ liệu doanh thu."}
        actionLabel="Tải lại dữ liệu doanh thu"
        onAction={onRetry}
      />
    );
  }

  if (!items.length) {
    return (
      <StateCard
        title="Doanh thu theo tháng"
        message="Chưa có dữ liệu doanh thu trong khoảng thời gian đã chọn."
      />
    );
  }

  const maxRevenue = Math.max(
    ...items.map((item) => Number(item?.revenue) || 0),
    0,
  );
  const hasRevenue = maxRevenue > 0;
  const guideValues = [1, 0.75, 0.5, 0.25, 0].map((ratio) =>
    Math.round(maxRevenue * ratio),
  );

  if (!hasRevenue) {
    return (
      <StateCard
        title="Doanh thu theo tháng"
        message="Khoảng thời gian này chưa phát sinh doanh thu. KPI vẫn giữ nguyên để bạn đối chiếu với các tháng còn lại."
      />
    );
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white px-5 py-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[#334155]">
              Doanh thu theo tháng
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              So sánh nhịp doanh thu giữa các tháng để nhận ra mùa cao điểm và
              các khoảng chững lại.
            </p>
          </div>

          <div className="rounded-full bg-sky-50 px-3 py-1.5 text-xs font-medium text-sky-700">
            {items.length} tháng dữ liệu
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
          <div className="grid gap-4 lg:grid-cols-[88px_minmax(0,1fr)]">
            <div className="hidden h-[320px] flex-col justify-between text-xs text-slate-400 lg:flex">
              {guideValues.map((value, index) => (
                <div key={`${value}-${index}`} className="leading-none">
                  {formatDashboardCurrencyShort(value)}
                </div>
              ))}
            </div>

            <div className="overflow-x-auto">
              <div className="relative min-w-[760px]">
                <div className="pointer-events-none absolute inset-0 flex flex-col justify-between pb-10">
                  {guideValues.map((value, index) => (
                    <div
                      key={`${value}-${index}`}
                      className="border-t border-dashed border-slate-200"
                    />
                  ))}
                </div>

                <div className="relative flex h-[320px] items-end gap-3 px-2 pt-4">
                  {items.map((item) => {
                    const revenue = Number(item?.revenue) || 0;
                    const height =
                      revenue > 0
                        ? Math.max((revenue / maxRevenue) * 220, 18)
                        : 0;

                    return (
                      <div
                        key={item.month}
                        className="flex w-14 flex-col items-center gap-3"
                      >
                        <div
                          className="text-center text-[11px] font-semibold text-slate-600"
                          title={formatDashboardCurrency(revenue)}
                        >
                          {formatDashboardCurrencyShort(revenue)}
                        </div>

                        <div className="flex h-56 items-end">
                          <div
                            className="w-10 rounded-t-xl bg-gradient-to-t from-sky-500 via-cyan-400 to-emerald-300 shadow-sm transition-all duration-300"
                            style={{ height }}
                            title={`${formatDashboardMonthLabel(
                              item.month,
                            )}: ${formatDashboardCurrency(revenue)}`}
                          />
                        </div>

                        <div className="text-center text-xs text-slate-500">
                          {formatDashboardMonthLabel(item.month, { short: true })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          <p className="mt-4 text-xs text-slate-500">
            Trục dọc được rút gọn để dễ so sánh tương quan giữa các tháng. Di
            chuột lên từng cột để xem giá trị đầy đủ.
          </p>
        </div>
      </div>
    </div>
  );
}
