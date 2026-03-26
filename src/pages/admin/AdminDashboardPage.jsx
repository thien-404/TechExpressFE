import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FiBarChart2 } from "react-icons/fi";
import { toast } from "sonner";

import { apiService } from "../../config/axios";
import dashboardService from "../../services/dashboardService";
import AdminDashboardAiInsightsPanel from "../../components/ui/AdminDashboardAiInsightsPanel.jsx";
import AdminDashboardFilterBar from "../../components/ui/AdminDashboardFilterBar.jsx";
import AdminDashboardKpiCards from "../../components/ui/AdminDashboardKpiCards.jsx";
import AdminDashboardRankingPanel from "../../components/ui/AdminDashboardRankingPanel.jsx";
import AdminDashboardRevenueChart from "../../components/ui/AdminDashboardRevenueChart.jsx";
import Breadcrumb from "../../components/ui/Breadcrumb.jsx";
import {
  buildDashboardRevenueMetrics,
  getDefaultDashboardFilters,
  toDashboardDateTimeOffsetString,
} from "../../utils/dashboard";

async function getQueryValue(loader, fallbackMessage) {
  const response = await loader();

  if (!response.succeeded) {
    throw new Error(response.message || fallbackMessage);
  }

  return response.value;
}

function downloadBlobFile(blob, filename) {
  const downloadUrl = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = downloadUrl;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();

  window.URL.revokeObjectURL(downloadUrl);
}

export default function AdminDashboardPage() {
  const [filters, setFilters] = useState(getDefaultDashboardFilters);
  const [isExporting, setIsExporting] = useState(false);

  const hasInvalidDateRange =
    filters.fromDate && filters.toDate && filters.fromDate > filters.toDate;

  const requestFilters = {
    brandId: filters.brandId,
    categoryId: filters.categoryId,
    fromDate: toDashboardDateTimeOffsetString(filters.fromDate),
    toDate: toDashboardDateTimeOffsetString(filters.toDate, true),
  };

  const brandsQuery = useQuery({
    queryKey: ["dashboard-brands"],
    queryFn: async () => {
      const response = await apiService.get("/Brand", {
        PageNumber: 1,
        PageSize: 500,
      });

      if (response?.statusCode !== 200) {
        throw new Error(response?.message || "Không thể tải danh sách thương hiệu.");
      }

      return response?.value?.items || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const revenueQuery = useQuery({
    queryKey: ["admin-dashboard", "revenue", requestFilters],
    queryFn: () =>
      getQueryValue(
        () => dashboardService.getMonthlyRevenue(requestFilters),
        "Không thể tải dữ liệu doanh thu theo tháng.",
      ),
    enabled: !hasInvalidDateRange,
    staleTime: 30_000,
  });

  const rankingsQuery = useQuery({
    queryKey: ["admin-dashboard", "rankings", requestFilters],
    queryFn: () =>
      getQueryValue(
        () => dashboardService.getBestWorstSelling(requestFilters),
        "Không thể tải bảng xếp hạng sản phẩm.",
      ),
    enabled: !hasInvalidDateRange,
    staleTime: 30_000,
  });

  const insightsQuery = useQuery({
    queryKey: ["admin-dashboard", "insights", requestFilters],
    queryFn: () =>
      getQueryValue(
        () => dashboardService.getRevenueInsights(requestFilters),
        "Không thể tải insight doanh thu từ AI.",
      ),
    enabled: !hasInvalidDateRange,
    staleTime: 30_000,
  });

  const revenueItems = hasInvalidDateRange ? [] : revenueQuery.data || [];
  const revenueMetrics = buildDashboardRevenueMetrics(revenueItems);
  const rankings = hasInvalidDateRange
    ? { bestSelling: [], leastSelling: [] }
    : rankingsQuery.data || { bestSelling: [], leastSelling: [] };
  const insights = hasInvalidDateRange ? null : insightsQuery.data || null;
  const isRefreshing =
    revenueQuery.isFetching || rankingsQuery.isFetching || insightsQuery.isFetching;

  const handleFilterChange = (key, value) => {
    setFilters((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const handleResetFilters = () => {
    setFilters(getDefaultDashboardFilters());
  };

  const handleRefresh = async () => {
    if (hasInvalidDateRange) {
      return;
    }

    await Promise.allSettled([
      revenueQuery.refetch(),
      rankingsQuery.refetch(),
      insightsQuery.refetch(),
    ]);
  };

  const handleExportPdf = async () => {
    if (hasInvalidDateRange) {
      toast.error("Khoảng thời gian chưa hợp lệ để xuất báo cáo PDF.");
      return;
    }

    setIsExporting(true);

    try {
      const response = await dashboardService.downloadMonthlyRevenuePdf(
        requestFilters,
      );

      if (!response.succeeded || !response.value?.blob) {
        throw new Error(response.message || "Không thể xuất báo cáo PDF.");
      }

      downloadBlobFile(
        response.value.blob,
        response.value.filename || `monthly-revenue_${Date.now()}.pdf`,
      );
      toast.success("Đã bắt đầu tải báo cáo PDF.");
    } catch (error) {
      toast.error(error.message || "Không thể xuất báo cáo PDF.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="font-[var(--font-inter)]">
      <Breadcrumb
        items={[
          { label: "Trang chủ", href: "/admin/dashboard" },
          { label: "Dashboard" },
        ]}
      />

      <div className="mt-3 flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-sky-50 px-3 py-1.5 text-xs font-medium text-sky-700">
            <FiBarChart2 size={14} />
            Dashboard quản trị
          </div>
          <h1 className="mt-3 text-2xl font-semibold text-[#334155]">
            Theo dõi doanh thu và vận hành bán hàng
          </h1>
          <p className="mt-2 max-w-3xl text-sm text-slate-500">
            Tổng hợp doanh thu theo tháng, sản phẩm bán chạy hoặc bán chậm, cùng
            insight AI để bạn theo dõi hiệu suất kinh doanh ở một nơi duy nhất.
          </p>
        </div>

        <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          Bộ lọc đang tác động đồng thời lên toàn bộ widget của dashboard.
        </div>
      </div>

      <AdminDashboardFilterBar
        filters={filters}
        brands={brandsQuery.data || []}
        brandsLoading={brandsQuery.isLoading}
        brandsError={brandsQuery.isError}
        isRefreshing={isRefreshing}
        isExporting={isExporting}
        onFilterChange={handleFilterChange}
        onRefresh={handleRefresh}
        onReset={handleResetFilters}
        onExportPdf={handleExportPdf}
      />

      {hasInvalidDateRange ? (
        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-800">
          Khoảng thời gian hiện tại chưa hợp lệ nên dashboard tạm dừng tải dữ
          liệu. Hãy chỉnh lại bộ lọc để tiếp tục xem báo cáo.
        </div>
      ) : (
        <>
          <div className="mt-6">
            <AdminDashboardKpiCards
              metrics={revenueMetrics}
              isLoading={revenueQuery.isLoading}
            />
          </div>

          <div className="mt-4">
            <AdminDashboardRevenueChart
              items={revenueItems}
              isLoading={revenueQuery.isLoading}
              error={revenueQuery.error}
              onRetry={revenueQuery.refetch}
            />
          </div>

          <div className="mt-4 grid gap-4 xl:grid-cols-2">
            <AdminDashboardRankingPanel
              title="Top sản phẩm bán tốt"
              description="Ưu tiên theo doanh thu và tỷ trọng đóng góp để nhận diện nhóm sản phẩm đang kéo tăng trưởng."
              items={rankings.bestSelling || []}
              isLoading={rankingsQuery.isLoading}
              error={rankingsQuery.error}
              onRetry={rankingsQuery.refetch}
              tone="emerald"
              emptyMessage="Chưa có sản phẩm bán chạy trong khoảng thời gian đã chọn."
            />

            <AdminDashboardRankingPanel
              title="Sản phẩm bán chậm"
              description="Theo dõi những sản phẩm đóng góp thấp để cân nhắc khuyến mãi, xoay vòng tồn kho hoặc thay đổi trưng bày."
              items={rankings.leastSelling || []}
              isLoading={rankingsQuery.isLoading}
              error={rankingsQuery.error}
              onRetry={rankingsQuery.refetch}
              tone="rose"
              emptyMessage="Chưa có dữ liệu sản phẩm bán chậm trong khoảng thời gian đã chọn."
            />
          </div>

          <div className="mt-4">
            <AdminDashboardAiInsightsPanel
              data={insights}
              isLoading={insightsQuery.isLoading}
              error={insightsQuery.error}
              onRetry={insightsQuery.refetch}
            />
          </div>
        </>
      )}
    </div>
  );
}
