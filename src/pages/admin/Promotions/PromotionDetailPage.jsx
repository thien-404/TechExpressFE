import React, { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  FiArrowLeft,
  FiGift,
  FiInfo,
  FiLayers,
  FiPackage,
  FiPower,
  FiTrash2,
} from "react-icons/fi";
import { toast } from "sonner";

import Breadcrumb from "../../../components/ui/Breadcrumb";
import Pagination from "../../../components/common/Pagination";
import { apiService } from "../../../config/axios";
import { queryClient } from "../../../config/queryClient";
import {
  cachePromotion,
  formatCurrency,
  formatDateTime,
  getPromotionScopeLabel,
  getPromotionStatus,
  getPromotionTypeLabel,
  getRequiredProductLogicLabel,
} from "./promotionHelpers";

const DEFAULT_TAB = "info";

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
      <div className="text-right text-sm font-medium text-slate-700">
        {value ?? "-"}
      </div>
    </div>
  );
}

function Tabs({ active, onChange, tabs }) {
  return (
    <div className="border-b border-slate-200">
      <div className="flex flex-wrap gap-6 px-6">
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

function getProductThumbnail(product) {
  if (Array.isArray(product?.thumbnailUrl) && product.thumbnailUrl.length > 0) {
    return product.thumbnailUrl[0];
  }

  return product?.firstImageUrl || "";
}

function RelatedProductCell({ product, productId }) {
  const thumbnailUrl = getProductThumbnail(product);

  return (
    <div className="flex min-w-0 items-center gap-3">
      <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
        {thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt={product?.name || productId}
            className="h-full w-full object-contain"
          />
        ) : (
          <FiPackage size={20} className="text-slate-300" />
        )}
      </div>

      <div className="min-w-0">
        <div className="truncate font-medium text-slate-800">
          {product?.name || "Không tải được thông tin sản phẩm"}
        </div>
        <div className="mt-1 text-xs text-slate-500">
          {product?.sku || `ID: ${productId}`}
        </div>
      </div>
    </div>
  );
}

function RelatedProductsTable({
  rows,
  productMap,
  loading,
  emptyText,
  quantityColumns,
  onProductClick,
}) {
  if (loading) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white py-12 text-center text-sm text-slate-500">
        Đang tải thông tin sản phẩm...
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white py-12 text-center text-sm text-slate-500">
        {emptyText}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200">
      <table className="w-full text-sm">
        <thead className="border-b border-slate-200 bg-slate-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-600">
              Sản phẩm
            </th>
            <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-600">
              SKU
            </th>
            <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-600">
              Giá
            </th>
            {quantityColumns.map((column) => (
              <th
                key={column.key}
                className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-600"
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>

        <tbody className="divide-y divide-slate-100">
          {rows.map((row) => {
            const product = productMap[String(row.productId)] || null;
            const canNavigate = Boolean(product?.id);

            return (
              <tr
                key={`${row.id}-${row.productId}`}
                className={canNavigate ? "cursor-pointer hover:bg-slate-50" : ""}
                onClick={() => {
                  if (canNavigate) {
                    onProductClick(product.id);
                  }
                }}
              >
                <td className="px-4 py-3">
                  <RelatedProductCell product={product} productId={row.productId} />
                </td>
                <td className="px-4 py-3 text-slate-700">
                  {product?.sku || "-"}
                </td>
                <td className="px-4 py-3 font-medium text-slate-700">
                  {product ? formatCurrency(product.price) : "-"}
                </td>
                {quantityColumns.map((column) => (
                  <td key={column.key} className="px-4 py-3 text-slate-700">
                    {column.render(row)}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default function PromotionDetailPage() {
  const { promotionId } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const tabFromUrl = searchParams.get("tab") || DEFAULT_TAB;
  const [activeTab, setActiveTab] = useState(tabFromUrl);
  const [productQuery, setProductQuery] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [pageNumber, setPageNumber] = useState(0);
  const [pageSize] = useState(20);

  const {
    data: promotion,
    isLoading: promotionLoading,
    refetch: refetchPromotion,
  } = useQuery({
    enabled: !!promotionId,
    queryKey: ["promotion-detail", promotionId],
    queryFn: async () => {
      const res = await apiService.get(`/promotion/${promotionId}`);

      if (res?.statusCode !== 200) {
        toast.error(res?.message || "Không thể tải chi tiết khuyến mãi");
        return null;
      }

      cachePromotion(res.value);
      return res.value;
    },
    staleTime: 30_000,
  });

  const tabs = useMemo(() => {
    const nextTabs = [
      { key: "info", label: "Thông tin chung", icon: FiInfo },
      { key: "products", label: "Sản phẩm áp dụng", icon: FiPackage },
    ];

    if ((promotion?.requiredProducts || []).length > 0) {
      nextTabs.push({
        key: "required-products",
        label: "Sản phẩm điều kiện",
        icon: FiLayers,
      });
    }

    if ((promotion?.freeProducts || []).length > 0) {
      nextTabs.push({
        key: "free-products",
        label: "Sản phẩm quà tặng",
        icon: FiGift,
      });
    }

    return nextTabs;
  }, [promotion]);

  useEffect(() => {
    if (!promotion) {
      setActiveTab(tabFromUrl);
      return;
    }

    const nextTab = tabs.some((tab) => tab.key === tabFromUrl)
      ? tabFromUrl
      : DEFAULT_TAB;

    setActiveTab(nextTab);

    if (nextTab !== tabFromUrl) {
      setSearchParams({ tab: nextTab }, { replace: true });
    }
  }, [promotion, setSearchParams, tabFromUrl, tabs]);

  const relatedProductIds = useMemo(() => {
    if (!promotion) return [];

    const ids = new Set();

    [...(promotion.requiredProducts || []), ...(promotion.freeProducts || [])].forEach(
      (item) => {
        if (item?.productId) {
          ids.add(String(item.productId));
        }
      },
    );

    return Array.from(ids);
  }, [promotion]);

  const {
    data: relatedProductMap = {},
    isLoading: relatedProductsLoading,
    isFetching: relatedProductsFetching,
  } = useQuery({
    enabled: relatedProductIds.length > 0,
    queryKey: ["promotion-related-products", relatedProductIds],
    queryFn: async () => {
      const entries = await Promise.all(
        relatedProductIds.map(async (productId) => {
          const res = await apiService.get(`/product/${productId}`);
          const succeeded = res?.statusCode === 200 || res?.status === 200;

          return [productId, succeeded && res.value ? res.value : null];
        }),
      );

      return Object.fromEntries(entries);
    },
    staleTime: 5 * 60 * 1000,
  });

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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-promotions"] });
      queryClient.invalidateQueries({ queryKey: ["promotion-detail", promotionId] });
      toast.success("Đã vô hiệu hóa khuyến mãi");
      refetchPromotion();
    },
    onError: (error) => {
      toast.error(error?.message || "Vô hiệu hóa khuyến mãi thất bại");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await apiService.delete(`/promotion/${promotionId}`);

      if (res?.statusCode !== 200) {
        throw new Error(res?.message || "Xóa khuyến mãi thất bại");
      }

      return res.value;
    },
    onSuccess: (message) => {
      toast.success(message || "Đã xử lý xóa khuyến mãi");
      queryClient.invalidateQueries({ queryKey: ["admin-promotions"] });
      navigate("/admin/promotions");
    },
    onError: (error) => {
      toast.error(error?.message || "Xóa khuyến mãi thất bại");
    },
  });

  const {
    data: productData,
    isLoading: productsLoading,
    isFetching: productsFetching,
  } = useQuery({
    enabled: !!promotionId && activeTab === "products",
    queryKey: [
      "promotion-products-admin",
      promotionId,
      searchTerm,
      pageNumber,
      pageSize,
    ],
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
  const loadingRelatedProducts = relatedProductsLoading || relatedProductsFetching;
  const status = useMemo(() => getPromotionStatus(promotion), [promotion]);
  const isActive = promotion?.isActive ?? promotion?.status ?? false;
  const discountType = promotion?.discountType ?? promotion?.type;
  const requiredProducts = promotion?.requiredProducts || [];
  const freeProducts = promotion?.freeProducts || [];

  const requiredLogicLabel =
    requiredProducts.length > 1
      ? getRequiredProductLogicLabel(promotion?.requiredProductLogic)
      : "Không áp dụng";

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

  const handleDelete = () => {
    if (!promotion) return;

    const confirmed = window.confirm(
      `Bạn có chắc muốn xóa khuyến mãi "${promotion.name}"?\n\nNếu khuyến mãi đã có lượt dùng, BE sẽ chuyển sang vô hiệu hóa thay vì xóa cứng.`,
    );

    if (confirmed) {
      deleteMutation.mutate();
    }
  };

  if (promotionLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-sm text-slate-500">Đang tải thông tin khuyến mãi...</div>
      </div>
    );
  }

  if (!promotion) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-700">
        Không tìm thấy khuyến mãi hoặc dữ liệu không còn khả dụng.
      </div>
    );
  }

  return (
    <div className="font-[var(--font-inter)]">
      <div className="flex items-center justify-between">
        <Breadcrumb
          items={[
            { label: "Trang chủ", href: "/admin" },
            { label: "Quản lý khuyến mãi", href: "/admin/promotions" },
            { label: promotion.name || "Chi tiết khuyến mãi" },
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
            {promotion.name || "Chi tiết khuyến mãi"}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <StatusBadge promotion={promotion} />
            <span className="text-sm text-slate-500">
              Mã:{" "}
              <code className="rounded bg-slate-100 px-2 py-1">
                {promotion.code || "-"}
              </code>
            </span>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleDisable}
            disabled={!isActive || disableMutation.isPending}
            className="inline-flex h-9 items-center gap-2 rounded border border-rose-200 px-4 text-sm font-semibold text-rose-600 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <FiPower size={14} />
            Vô hiệu hóa
          </button>

          <button
            type="button"
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
            className="inline-flex h-9 items-center gap-2 rounded border border-slate-200 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <FiTrash2 size={14} />
            Xóa
          </button>
        </div>
      </div>

      <div className="mt-4 rounded-lg border border-slate-200 bg-white shadow-sm">
        <Tabs active={activeTab} onChange={changeTab} tabs={tabs} />

        <div className="p-6">
          {activeTab === "info" && (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
              <div className="lg:col-span-4">
                <div className="rounded-lg border border-slate-200 bg-gradient-to-br from-emerald-50 to-white p-6">
                  <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                    <FiGift size={24} />
                  </div>
                  <h2 className="text-lg font-semibold text-slate-800">
                    {promotion.name}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {promotion.description || "Chưa có mô tả chi tiết."}
                  </p>
                  <div className="mt-4 rounded-lg border border-white/80 bg-white/80 px-4 py-3 text-sm text-slate-600">
                    Trạng thái hiện tại:{" "}
                    <span className="font-semibold">{status.label}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-6 lg:col-span-8">
                <div className="rounded-lg border border-slate-200 bg-white">
                  <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white px-4 py-3 text-sm font-semibold text-[#334155]">
                    Thông tin cơ bản
                  </div>
                  <div className="space-y-2 p-4">
                    <InfoRow label="Mã khuyến mãi" value={promotion.code || "-"} />
                    <InfoRow
                      label="Loại khuyến mãi"
                      value={getPromotionTypeLabel(discountType)}
                    />
                    <InfoRow
                      label="Phạm vi áp dụng"
                      value={getPromotionScopeLabel(promotion.scope)}
                    />
                    <InfoRow
                      label="Giá trị ưu đãi"
                      value={
                        discountType === "PercentageDiscount"
                          ? `${promotion.discountValue ?? 0}%`
                          : formatCurrency(promotion.discountValue)
                      }
                    />
                    <InfoRow
                      label="Giảm tối đa"
                      value={formatCurrency(promotion.maxDiscountValue)}
                    />
                    <InfoRow
                      label="Giá trị đơn tối thiểu"
                      value={formatCurrency(promotion.minOrderValue)}
                    />
                    <InfoRow
                      label="Số lượng áp dụng tối thiểu"
                      value={promotion.minAppliedQuantity ?? "-"}
                    />
                    <InfoRow
                      label="Số lượt đã dùng"
                      value={promotion.usageCount ?? 0}
                    />
                    <InfoRow
                      label="Giới hạn sử dụng"
                      value={promotion.maxUsageCount ?? promotion.usageLimit ?? "∞"}
                    />
                    <InfoRow
                      label="Giới hạn mỗi khách"
                      value={promotion.maxUsagePerUser ?? promotion.usagePerUser ?? "-"}
                    />
                    <InfoRow
                      label="Cộng dồn khuyến mãi"
                      value={promotion.isStackable ? "Có" : "Không"}
                    />
                    <InfoRow
                      label="Logic sản phẩm điều kiện"
                      value={requiredLogicLabel}
                    />
                    <InfoRow
                      label="Số sản phẩm quà tặng được chọn"
                      value={promotion.freeItemPickCount ?? "-"}
                    />
                  </div>
                </div>

                <div className="rounded-lg border border-slate-200 bg-white">
                  <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white px-4 py-3 text-sm font-semibold text-[#334155]">
                    Phạm vi và thời gian áp dụng
                  </div>
                  <div className="space-y-2 p-4">
                    <InfoRow label="Category ID" value={promotion.categoryId || "-"} />
                    <InfoRow label="Brand ID" value={promotion.brandId || "-"} />
                    <InfoRow label="Bắt đầu" value={formatDateTime(promotion.startDate)} />
                    <InfoRow label="Kết thúc" value={formatDateTime(promotion.endDate)} />
                    <InfoRow label="Đang bật" value={isActive ? "Có" : "Không"} />
                    <InfoRow
                      label="Đã hết hạn"
                      value={promotion.isExpired ? "Có" : "Không"}
                    />
                    <InfoRow
                      label="Ngày tạo"
                      value={formatDateTime(promotion.createdAt)}
                    />
                    <InfoRow
                      label="Cập nhật gần nhất"
                      value={formatDateTime(promotion.updatedAt)}
                    />
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

          {activeTab === "required-products" && (
            <div>
              <div className="mb-4 flex flex-col gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-800">
                    Sản phẩm điều kiện
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Tổng cộng {requiredProducts.length} sản phẩm điều kiện
                  </p>
                </div>

                <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
                  Logic áp dụng:{" "}
                  <span className="font-semibold text-slate-800">
                    {requiredLogicLabel}
                  </span>
                </div>
              </div>

              <RelatedProductsTable
                rows={requiredProducts}
                productMap={relatedProductMap}
                loading={loadingRelatedProducts}
                emptyText="Khuyến mãi này không có sản phẩm điều kiện."
                quantityColumns={[
                  {
                    key: "minQuantity",
                    label: "Số lượng tối thiểu",
                    render: (row) => row.minQuantity ?? "-",
                  },
                  {
                    key: "maxQuantity",
                    label: "Số lượng tối đa",
                    render: (row) => row.maxQuantity ?? "-",
                  },
                ]}
                onProductClick={(productId) => navigate(`/admin/products/${productId}`)}
              />
            </div>
          )}

          {activeTab === "free-products" && (
            <div>
              <div className="mb-4 flex flex-col gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-800">
                    Sản phẩm quà tặng
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Tổng cộng {freeProducts.length} sản phẩm quà tặng
                  </p>
                </div>

                <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
                  Khách hàng được chọn tối đa{" "}
                  <span className="font-semibold text-slate-800">
                    {promotion.freeItemPickCount ?? "-"}
                  </span>{" "}
                  sản phẩm
                </div>
              </div>

              <RelatedProductsTable
                rows={freeProducts}
                productMap={relatedProductMap}
                loading={loadingRelatedProducts}
                emptyText="Khuyến mãi này không có sản phẩm quà tặng."
                quantityColumns={[
                  {
                    key: "quantity",
                    label: "Số lượng tặng",
                    render: (row) => row.quantity ?? "-",
                  },
                ]}
                onProductClick={(productId) => navigate(`/admin/products/${productId}`)}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
