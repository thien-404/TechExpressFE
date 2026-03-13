import React, { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { FiArrowLeft, FiGift, FiInfo, FiPackage, FiPower } from "react-icons/fi";
import { toast } from "sonner";

import Breadcrumb from "../../../components/ui/Breadcrumb";
import Pagination from "../../../components/common/Pagination";
import { apiService } from "../../../config/axios";
import { queryClient } from "../../../config/queryClient";
import {
  cachePromotion,
  formatCurrency,
  formatDateTime,
  getCachedPromotion,
  getPromotionScopeLabel,
  getPromotionStatus,
  getPromotionTypeLabel,
} from "./promotionHelpers";

function StatusBadge({ promotion }) {
  const status = getPromotionStatus(promotion);

  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${status.className}`}
    >
      {status.label}
    </span>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="flex items-center justify-between rounded-lg px-4 py-3 hover:bg-slate-50">
      <div className="text-sm text-slate-600">{label}</div>
      <div className="text-right text-sm font-medium text-slate-700">{value ?? "-"}</div>
    </div>
  );
}

function Tabs({ active, onChange }) {
  const tabs = [
    { key: "info", label: "Thông tin chung", icon: FiInfo },
    { key: "products", label: "Sản phẩm áp dụng", icon: FiPackage },
  ];

  return (
    <div className="border-b border-slate-200">
      <div className="flex gap-6 px-6">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = active === tab.key;

          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => onChange(tab.key)}
              className={`relative -mb-px flex items-center gap-2 py-4 text-sm transition-colors ${
                isActive
                  ? "font-semibold text-[#334155]"
                  : "text-slate-500 hover:text-[#334155]"
              }`}
            >
              <Icon size={16} />
              {tab.label}
              {isActive && (
                <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#6e846f]" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function PromotionDetailPage() {
  const { promotionId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  const tabFromUrl = searchParams.get("tab") || "info";
  const [activeTab, setActiveTab] = useState(tabFromUrl);
  const [promotion, setPromotion] = useState(
    location.state?.promotion || getCachedPromotion(promotionId),
  );
  const [productQuery, setProductQuery] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [pageNumber, setPageNumber] = useState(0);
  const [pageSize] = useState(20);

  useEffect(() => {
    setActiveTab(tabFromUrl);
  }, [tabFromUrl]);

  useEffect(() => {
    if (location.state?.promotion) {
      setPromotion(location.state.promotion);
      cachePromotion(location.state.promotion);
    }
  }, [location.state]);

  const disableMutation = useMutation({
    mutationFn: async () => {
      const res = await apiService.post("/promotion/disable", {
        promotionId,
      });

      if (res?.statusCode !== 200) {
        throw new Error(res?.message || "Vô hiệu hóa khuyến mãi thất bại");
      }

      return res.value;
    },
    onSuccess: (value) => {
      const nextValue = value || (promotion ? { ...promotion, isActive: false } : null);
      if (nextValue) {
        cachePromotion(nextValue);
        setPromotion(nextValue);
      }
      queryClient.invalidateQueries({ queryKey: ["admin-promotions"] });
      toast.success("Đã vô hiệu hóa khuyến mãi");
    },
    onError: (error) => {
      toast.error(error?.message || "Vô hiệu hóa khuyến mãi thất bại");
    },
  });

  const { data: productData, isLoading: productsLoading, isFetching: productsFetching } = useQuery({
    enabled: !!promotionId && activeTab === "products",
    queryKey: ["promotion-products-admin", promotionId, searchTerm, pageNumber, pageSize],
    queryFn: async () => {
      const res = await apiService.get(`/promotion/admin/${promotionId}/products`, {
        search: searchTerm || undefined,
        page: pageNumber + 1,
        pageSize,
      });

      if (res?.statusCode !== 200) {
        toast.error("Không thể tải danh sách sản phẩm của khuyến mãi");
        return { items: [], totalCount: 0, totalPages: 1 };
      }

      return res.value;
    },
    keepPreviousData: true,
    staleTime: 30_000,
  });

  const productRows = productData?.items || [];
  const totalItems = productData?.totalCount || 0;
  const totalPages = productData?.totalPages || 1;
  const loadingProducts = productsLoading || productsFetching;

  const changeTab = (tab) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  const handleDisable = () => {
    if (!promotion) return;

    const confirmed = window.confirm(
      `Bạn có chắc muốn vô hiệu hóa khuyến mãi "${promotion.name}"?`,
    );

    if (confirmed) {
      disableMutation.mutate();
    }
  };

  const status = useMemo(() => getPromotionStatus(promotion), [promotion]);

  return (
    <div className="font-[var(--font-inter)]">
      <div className="flex items-center justify-between">
        <Breadcrumb
          items={[
            { label: "Trang chủ", href: "/admin" },
            { label: "Quản lý khuyến mãi", href: "/admin/promotions" },
            { label: promotion?.name || "Chi tiết khuyến mãi" },
          ]}
        />

        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 rounded bg-[#6e846f] px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90"
        >
          <FiArrowLeft />
          Quay lại
        </button>
      </div>

      <div className="mt-3 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[#334155]">
            {promotion?.name || "Chi tiết khuyến mãi"}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            {promotion && <StatusBadge promotion={promotion} />}
            {promotion?.code && (
              <span className="text-sm text-slate-500">
                Mã: <code className="rounded bg-slate-100 px-2 py-1">{promotion.code}</code>
              </span>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={handleDisable}
          disabled={!promotion?.isActive || disableMutation.isPending}
          className="inline-flex h-9 items-center gap-2 rounded border border-rose-200 px-4 text-sm font-semibold text-rose-600 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <FiPower size={14} />
          Vô hiệu hóa
        </button>
      </div>

      {!promotion && (
        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          Không tìm thấy dữ liệu chi tiết đã lưu cho khuyến mãi này. Bạn vẫn có thể xem danh sách sản phẩm áp dụng ở tab bên dưới.
        </div>
      )}

      <div className="mt-4 rounded-lg border border-slate-200 bg-white shadow-sm">
        <Tabs active={activeTab} onChange={changeTab} />

        <div className="p-6">
          {activeTab === "info" && (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
              <div className="lg:col-span-4">
                <div className="rounded-lg border border-slate-200 bg-gradient-to-br from-emerald-50 to-white p-6">
                  <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                    <FiGift size={24} />
                  </div>
                  <h2 className="text-lg font-semibold text-slate-800">
                    {promotion?.name || "Khuyến mãi"}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {promotion?.description || "Chưa có mô tả chi tiết."}
                  </p>
                  <div className="mt-4 rounded-lg border border-white/80 bg-white/80 px-4 py-3 text-sm text-slate-600">
                    Trạng thái hiện tại: <span className="font-semibold">{status.label}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-6 lg:col-span-8">
                <div className="rounded-lg border border-slate-200 bg-white">
                  <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white px-4 py-3 text-sm font-semibold text-[#334155]">
                    Thông tin cơ bản
                  </div>
                  <div className="space-y-2 p-4">
                    <InfoRow label="Mã khuyến mãi" value={promotion?.code || "-"} />
                    <InfoRow label="Loại" value={getPromotionTypeLabel(promotion?.type)} />
                    <InfoRow label="Phạm vi" value={getPromotionScopeLabel(promotion?.scope)} />
                    <InfoRow
                      label="Giá trị ưu đãi"
                      value={
                        promotion?.type === "PercentageDiscount"
                          ? `${promotion?.discountValue ?? 0}%`
                          : formatCurrency(promotion?.discountValue)
                      }
                    />
                    <InfoRow
                      label="Lượt sử dụng"
                      value={`${promotion?.usageCount ?? 0}/${promotion?.maxUsageCount ?? "∞"}`}
                    />
                    <InfoRow label="Ngày tạo" value={formatDateTime(promotion?.createdAt)} />
                  </div>
                </div>

                <div className="rounded-lg border border-slate-200 bg-white">
                  <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white px-4 py-3 text-sm font-semibold text-[#334155]">
                    Thời gian áp dụng
                  </div>
                  <div className="space-y-2 p-4">
                    <InfoRow label="Bắt đầu" value={formatDateTime(promotion?.startDate)} />
                    <InfoRow label="Kết thúc" value={formatDateTime(promotion?.endDate)} />
                    <InfoRow label="Trạng thái" value={status.label} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "products" && (
            <div>
              <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-800">
                    Sản phẩm thuộc khuyến mãi
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Tổng cộng {totalItems} sản phẩm
                  </p>
                </div>

                <div className="flex gap-2">
                  <input
                    value={productQuery}
                    onChange={(e) => setProductQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        setPageNumber(0);
                        setSearchTerm(productQuery.trim());
                      }
                    }}
                    placeholder="Tìm theo tên sản phẩm"
                    className="h-10 rounded border border-slate-200 px-3 text-sm outline-none focus:border-slate-400"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setPageNumber(0);
                      setSearchTerm(productQuery.trim());
                    }}
                    className="h-10 rounded bg-blue-500 px-4 text-sm font-semibold text-white hover:bg-blue-600"
                  >
                    Tìm kiếm
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto rounded-lg border border-slate-200">
                <table className="w-full text-sm">
                  <thead className="border-b border-slate-200 bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-600">
                        Sản phẩm
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-600">
                        Danh mục
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-600">
                        Giá
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-600">
                        Tồn kho
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-600">
                        Trạng thái
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {productRows.map((product) => (
                      <tr
                        key={product.id}
                        className="cursor-pointer hover:bg-slate-50"
                        onClick={() => navigate(`/admin/products/${product.id}`)}
                      >
                        <td className="px-4 py-3">
                          <div className="font-medium text-slate-800">{product.name}</div>
                          <div className="mt-1 text-xs text-slate-500">{product.sku}</div>
                        </td>
                        <td className="px-4 py-3 text-slate-700">
                          {product.categoryName || "-"}
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-700">
                          {formatCurrency(product.price)}
                        </td>
                        <td className="px-4 py-3 text-slate-700">
                          {product.stockQty ?? product.stock ?? 0}
                        </td>
                        <td className="px-4 py-3 text-slate-700">{product.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {!loadingProducts && productRows.length === 0 && (
                <div className="py-12 text-center text-sm text-slate-500">
                  Không có sản phẩm nào trong khuyến mãi này
                </div>
              )}

              <div className="mt-4 flex justify-center">
                <Pagination
                  loading={loadingProducts}
                  pageNumber={pageNumber}
                  pageSize={pageSize}
                  totalItems={totalItems}
                  totalPages={totalPages}
                  onPageChange={setPageNumber}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
