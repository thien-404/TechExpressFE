import React from "react";
import { FiCpu, FiRefreshCw } from "react-icons/fi";
import { Link } from "react-router-dom";

import {
  formatDashboardCurrency,
  formatDashboardMonthLabel,
  formatDashboardNumber,
} from "../../utils/dashboard";

function SectionTitle({ title, subtitle }) {
  return (
    <div>
      <h3 className="text-base font-semibold text-[#334155]">{title}</h3>
      {subtitle ? <p className="mt-1 text-sm text-slate-500">{subtitle}</p> : null}
    </div>
  );
}

export default function AdminDashboardAiInsightsPanel({
  data,
  isLoading,
  error,
  onRetry,
}) {
  if (isLoading) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white px-5 py-4">
          <div className="h-6 w-56 animate-pulse rounded bg-slate-100" />
          <div className="mt-2 h-4 w-72 animate-pulse rounded bg-slate-100" />
        </div>

        <div className="space-y-6 p-6">
          <div className="h-24 animate-pulse rounded-xl bg-slate-100" />
          <div className="grid gap-6 xl:grid-cols-2">
            <div className="h-64 animate-pulse rounded-xl bg-slate-100" />
            <div className="h-64 animate-pulse rounded-xl bg-slate-100" />
          </div>
          <div className="h-32 animate-pulse rounded-xl bg-slate-100" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white px-5 py-4">
          <h2 className="text-lg font-semibold text-[#334155]">AI insight doanh thu</h2>
        </div>

        <div className="flex min-h-[280px] flex-col items-center justify-center px-6 py-10 text-center">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-500">
            <FiCpu size={24} />
          </div>
          <p className="mt-4 max-w-xl text-sm text-slate-500">
            {error.message || "Không thể tải insight AI cho dashboard."}
          </p>
          <button
            type="button"
            onClick={onRetry}
            className="mt-5 inline-flex items-center gap-2 rounded border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            <FiRefreshCw />
            Tải lại insight
          </button>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white px-5 py-4">
          <h2 className="text-lg font-semibold text-[#334155]">AI insight doanh thu</h2>
        </div>

        <div className="flex min-h-[280px] flex-col items-center justify-center px-6 py-10 text-center">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-500">
            <FiCpu size={24} />
          </div>
          <p className="mt-4 max-w-xl text-sm text-slate-500">
            Chưa có insight AI để hiển thị cho bộ lọc hiện tại.
          </p>
        </div>
      </div>
    );
  }

  const aiGenerated = Boolean(data.aiGenerated);
  const forecast = Array.isArray(data.forecast) ? data.forecast : [];
  const suggestions = Array.isArray(data.productImportSuggestions)
    ? data.productImportSuggestions
    : [];
  const actions = Array.isArray(data.suggestedActions)
    ? data.suggestedActions
    : [];

  return (
    <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white px-5 py-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[#334155]">
              AI insight doanh thu
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Phân tích xu hướng doanh thu, dự báo ngắn hạn và gợi ý nhập hàng
              dựa trên dữ liệu hiện có.
            </p>
          </div>

          <div
            className={`rounded-full px-3 py-1.5 text-xs font-medium ${
              aiGenerated
                ? "bg-emerald-50 text-emerald-700"
                : "bg-amber-50 text-amber-700"
            }`}
          >
            {aiGenerated ? "AI generated" : "Fallback nội bộ"}
          </div>
        </div>
      </div>

      <div className="space-y-6 p-6">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
          <SectionTitle
            title="Nhận định tổng quan"
            subtitle={
              aiGenerated
                ? "Nội dung được sinh từ mô hình AI theo bộ lọc đang chọn."
                : "AI hiện không phản hồi, phần này đang dùng kết quả fallback từ dữ liệu lịch sử nội bộ."
            }
          />
          <p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-600">
            {data.analysis || "Chưa có nhận định tổng quan cho giai đoạn này."}
          </p>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <div className="rounded-xl border border-slate-200 p-5">
            <SectionTitle
              title="Dự báo doanh thu"
              subtitle="Dự báo 3 tháng kế tiếp để bạn theo dõi xu hướng doanh thu ngắn hạn."
            />

            <div className="mt-4 space-y-3">
              {forecast.length === 0 ? (
                <div className="rounded-lg bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                  Chưa có dữ liệu dự báo cho giai đoạn này.
                </div>
              ) : (
                forecast.map((item) => (
                  <div
                    key={item.month}
                    className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-4"
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div className="text-sm font-semibold text-[#334155]">
                        {formatDashboardMonthLabel(item.month)}
                      </div>
                      <div className="text-sm font-semibold text-emerald-700">
                        {formatDashboardCurrency(item.predictedRevenue)}
                      </div>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      {item.reason}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 p-5">
            <SectionTitle
              title="Gợi ý nhập hàng"
              subtitle="Các sản phẩm nên theo dõi để duy trì nhịp doanh thu ổn định."
            />

            <div className="mt-4 space-y-3">
              {suggestions.length === 0 ? (
                <div className="rounded-lg bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                  Chưa có gợi ý nhập hàng nào cho bộ lọc này.
                </div>
              ) : (
                suggestions.map((item) => (
                  <div
                    key={`${item.productId}-${item.productName}`}
                    className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-4"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <Link
                          to={`/admin/products/${item.productId}`}
                          className="block truncate text-sm font-semibold text-[#334155] transition hover:text-blue-600"
                        >
                          {item.productName}
                        </Link>
                        <p className="mt-2 text-sm leading-6 text-slate-500">
                          {item.reason}
                        </p>
                      </div>

                      <div className="rounded-full bg-sky-50 px-3 py-1.5 text-xs font-semibold text-sky-700">
                        Đề xuất {formatDashboardNumber(item.suggestedQuantity)} sp
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 p-5">
          <SectionTitle
            title="Hành động gợi ý"
            subtitle="Danh sách các việc nên ưu tiên sau khi xem insight doanh thu."
          />

          {actions.length === 0 ? (
            <div className="mt-4 rounded-lg bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
              Chưa có hành động cụ thể nào được đề xuất cho giai đoạn này.
            </div>
          ) : (
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {actions.map((action, index) => (
                <div
                  key={`${action}-${index}`}
                  className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-4 text-sm leading-6 text-slate-600"
                >
                  <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Hành động {index + 1}
                  </div>
                  {action}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
