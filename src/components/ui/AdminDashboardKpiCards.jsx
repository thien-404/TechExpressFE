import React from "react";
import {
  FiBarChart2,
  FiCalendar,
  FiDollarSign,
  FiTrendingUp,
} from "react-icons/fi";

import {
  formatDashboardCurrency,
  formatDashboardMonthLabel,
  formatDashboardNumber,
} from "../../utils/dashboard";

function SkeletonCard() {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="h-4 w-24 animate-pulse rounded bg-slate-100" />
      <div className="mt-4 h-8 w-32 animate-pulse rounded bg-slate-100" />
      <div className="mt-3 h-4 w-40 animate-pulse rounded bg-slate-100" />
    </div>
  );
}

export default function AdminDashboardKpiCards({ metrics, isLoading }) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <SkeletonCard key={index} />
        ))}
      </div>
    );
  }

  const cards = [
    {
      label: "Tổng doanh thu",
      value: formatDashboardCurrency(metrics.totalRevenue),
      hint: "Tổng cộng toàn bộ doanh thu trong khoảng lọc hiện tại.",
      icon: FiDollarSign,
      accentClass: "bg-emerald-50 text-emerald-700",
    },
    {
      label: "Trung bình mỗi tháng",
      value: formatDashboardCurrency(metrics.averageRevenue),
      hint: "Giá trị trung bình trên từng tháng của biểu đồ doanh thu.",
      icon: FiBarChart2,
      accentClass: "bg-sky-50 text-sky-700",
    },
    {
      label: "Tháng cao nhất",
      value: metrics.highestMonth.month
        ? formatDashboardMonthLabel(metrics.highestMonth.month)
        : "-",
      hint: metrics.highestMonth.month
        ? formatDashboardCurrency(metrics.highestMonth.revenue)
        : "Chưa có doanh thu phát sinh trong giai đoạn này.",
      icon: FiTrendingUp,
      accentClass: "bg-violet-50 text-violet-700",
    },
    {
      label: "Tháng có doanh thu",
      value: formatDashboardNumber(metrics.monthsWithSales),
      hint: "Số tháng có phát sinh doanh thu lớn hơn 0 trong kỳ theo dõi.",
      icon: FiCalendar,
      accentClass: "bg-amber-50 text-amber-700",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;

        return (
          <div
            key={card.label}
            className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-sm font-medium text-slate-500">
                  {card.label}
                </div>
                <div className="mt-3 text-2xl font-semibold text-[#334155]">
                  {card.value}
                </div>
              </div>

              <div
                className={`inline-flex h-11 w-11 items-center justify-center rounded-xl ${card.accentClass}`}
              >
                <Icon size={20} />
              </div>
            </div>

            <p className="mt-4 text-sm text-slate-500">{card.hint}</p>
          </div>
        );
      })}
    </div>
  );
}
