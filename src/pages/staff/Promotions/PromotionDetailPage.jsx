import React, { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { FiArrowLeft, FiGift, FiInfo, FiPackage } from "react-icons/fi";

import Breadcrumb from "../../../components/ui/Breadcrumb";
import Pagination from "../../../components/common/Pagination";
import { apiService } from "../../../config/axios";
import {
  cacheCustomerPromotion,
  cacheCustomerPromotions,
  formatCurrency,
  formatDateTime,
  getCachedCustomerPromotion,
  getPromotionScopeLabel,
  getPromotionStatus,
  getPromotionTypeLabel,
  getRequiredProductLogicLabel,
} from "../../admin/Promotions/promotionHelpers";

const T = {
  home: "Trang ch\u1ee7",
  title: "Qu\u1ea3n l\u00fd khuy\u1ebfn m\u00e3i",
  detailTitle: "Chi ti\u1ebft khuy\u1ebfn m\u00e3i",
  generalInfo: "Th\u00f4ng tin chung",
  productTab: "S\u1ea3n ph\u1ea9m \u00e1p d\u1ee5ng",
  loading: "\u0110ang t\u1ea3i th\u00f4ng tin khuy\u1ebfn m\u00e3i...",
  notFound: "Kh\u00f4ng t\u00ecm th\u1ea5y khuy\u1ebfn m\u00e3i ho\u1eb7c d\u1eef li\u1ec7u kh\u00f4ng c\u00f2n kh\u1ea3 d\u1ee5ng.",
  back: "Quay l\u1ea1i",
  code: "M\u00e3",
  noDescription: "Ch\u01b0a c\u00f3 m\u00f4 t\u1ea3 chi ti\u1ebft.",
  currentStatus: "Tr\u1ea1ng th\u00e1i hi\u1ec7n t\u1ea1i",
  basicInfo: "Th\u00f4ng tin c\u01a1 b\u1ea3n",
  promotionCode: "M\u00e3 khuy\u1ebfn m\u00e3i",
  promotionType: "Lo\u1ea1i khuy\u1ebfn m\u00e3i",
  scope: "Ph\u1ea1m vi \u00e1p d\u1ee5ng",
  discountValue: "Gi\u00e1 tr\u1ecb \u01b0u \u0111\u00e3i",
  maxDiscount: "Gi\u1ea3m t\u1ed1i \u0111a",
  minOrder: "Gi\u00e1 tr\u1ecb \u0111\u01a1n t\u1ed1i thi\u1ec3u",
  minQuantity: "S\u1ed1 l\u01b0\u1ee3ng \u00e1p d\u1ee5ng t\u1ed1i thi\u1ec3u",
  usageCount: "S\u1ed1 l\u01b0\u1ee3t \u0111\u00e3 d\u00f9ng",
  usageLimit: "Gi\u1edbi h\u1ea1n s\u1eed d\u1ee5ng",
  usagePerUser: "Gi\u1edbi h\u1ea1n m\u1ed7i kh\u00e1ch",
  stackable: "C\u1ed9ng d\u1ed3n khuy\u1ebfn m\u00e3i",
  requiredLogic: "Logic s\u1ea3n ph\u1ea9m \u0111i\u1ec1u ki\u1ec7n",
  freeItemPickCount: "S\u1ed1 s\u1ea3n ph\u1ea9m qu\u00e0 t\u1eb7ng \u0111\u01b0\u1ee3c ch\u1ecdn",
  scopeAndTime: "Ph\u1ea1m vi v\u00e0 th\u1eddi gian \u00e1p d\u1ee5ng",
  startDate: "B\u1eaft \u0111\u1ea7u",
  endDate: "K\u1ebft th\u00fac",
  active: "\u0110ang b\u1eadt",
  expired: "\u0110\u00e3 h\u1ebft h\u1ea1n",
  createdAt: "Ng\u00e0y t\u1ea1o",
  updatedAt: "C\u1eadp nh\u1eadt g\u1ea7n nh\u1ea5t",
  yes: "C\u00f3",
  no: "Kh\u00f4ng",
  infinite: "\u221e",
  productsInPromotion: "S\u1ea3n ph\u1ea9m thu\u1ed9c khuy\u1ebfn m\u00e3i",
  totalProducts: "T\u1ed5ng c\u1ed9ng",
  productSearchPlaceholder: "T\u00ecm theo t\u00ean s\u1ea3n ph\u1ea9m",
  search: "T\u00ecm ki\u1ebfm",
  product: "S\u1ea3n ph\u1ea9m",
  category: "Danh m\u1ee5c",
  price: "Gi\u00e1",
  stock: "T\u1ed3n kho",
  status: "Tr\u1ea1ng th\u00e1i",
  emptyProducts: "Kh\u00f4ng c\u00f3 s\u1ea3n ph\u1ea9m n\u00e0o trong khuy\u1ebfn m\u00e3i n\u00e0y.",
};

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
    { key: "info", label: T.generalInfo, icon: FiInfo },
    { key: "products", label: T.productTab, icon: FiPackage },
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
                isActive ? "font-semibold text-[#334155]" : "text-slate-500 hover:text-[#334155]"
              }`}
            >
              <Icon size={16} />
              {tab.label}
              {isActive && <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#6e846f]" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function StaffPromotionDetailPage() {
  const { promotionId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromUrl = searchParams.get("tab") || "info";
  const [activeTab, setActiveTab] = useState(tabFromUrl);
  const [productQuery, setProductQuery] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [pageNumber, setPageNumber] = useState(0);
  const [pageSize] = useState(20);
  const [promotion, setPromotion] = useState(
    location.state?.promotion || getCachedCustomerPromotion(promotionId)
  );

  useEffect(() => {
    setActiveTab(tabFromUrl);
  }, [tabFromUrl]);

  useEffect(() => {
    if (location.state?.promotion) {
      setPromotion(location.state.promotion);
      cacheCustomerPromotion(location.state.promotion);
    }
  }, [location.state]);

  const { data: fallbackPromotions, isLoading: fallbackLoading } = useQuery({
    enabled: !!promotionId && !promotion,
    queryKey: ["staff-promotions-fallback", promotionId],
    queryFn: async () => {
      const res = await apiService.get("/promotion/customer_guest/all", {
        page: 1,
        pageSize: 100,
        sortBy: "CreatedAt",
        isDescending: true,
      });
      if (res?.statusCode === 200) {
        return res.value?.items || [];
      }
      return [];
    },
    staleTime: 30_000,
  });

  useEffect(() => {
    if (!promotion && fallbackPromotions?.length) {
      cacheCustomerPromotions(fallbackPromotions);
      const matchedPromotion = fallbackPromotions.find(
        (item) => String(item.id) === String(promotionId)
      );
      if (matchedPromotion) {
        setPromotion(matchedPromotion);
        cacheCustomerPromotion(matchedPromotion);
      }
    }
  }, [fallbackPromotions, promotion, promotionId]);

  const { data: productData, isLoading, isFetching } = useQuery({
    enabled: !!promotionId && activeTab === "products",
    queryKey: ["staff-promotion-products", promotionId, searchTerm, pageNumber, pageSize],
    queryFn: async () => {
      const res = await apiService.get(`/promotion/customer/${promotionId}/products`, {
        search: searchTerm || undefined,
        page: pageNumber + 1,
        pageSize,
      });

      if (res?.statusCode !== 200) {
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
  const loadingProducts = isLoading || isFetching;
  const status = useMemo(() => getPromotionStatus(promotion), [promotion]);
  const discountType = promotion?.discountType ?? promotion?.type;
  const isActive = promotion ? promotion.isActive ?? promotion.status ?? false : false;
  const isPromotionLoading = !promotion && fallbackLoading;

  const changeTab = (tab) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  if (isPromotionLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-sm text-slate-500">{T.loading}</div>
      </div>
    );
  }

  if (!promotion) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-700">
        {T.notFound}
      </div>
    );
  }

  return (
    <div className="font-[var(--font-inter)]">
      <div className="flex items-center justify-between">
        <Breadcrumb
          items={[
            { label: T.home, href: "/staff" },
            { label: T.title, href: "/staff/promotions" },
            { label: promotion.name || T.detailTitle },
          ]}
        />

        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 rounded bg-[#6e846f] px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90"
        >
          <FiArrowLeft />
          {T.back}
        </button>
      </div>

      <div className="mt-3 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[#334155]">
            {promotion.name || T.detailTitle}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <StatusBadge promotion={promotion} />
            <span className="text-sm text-slate-500">
              {T.code}: <code className="rounded bg-slate-100 px-2 py-1">{promotion.code || "-"}</code>
            </span>
          </div>
        </div>
      </div>

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
                  <h2 className="text-lg font-semibold text-slate-800">{promotion.name}</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {promotion.description || T.noDescription}
                  </p>
                  <div className="mt-4 rounded-lg border border-white/80 bg-white/80 px-4 py-3 text-sm text-slate-600">
                    {T.currentStatus}: <span className="font-semibold">{status.label}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-6 lg:col-span-8">
                <div className="rounded-lg border border-slate-200 bg-white">
                  <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white px-4 py-3 text-sm font-semibold text-[#334155]">
                    {T.basicInfo}
                  </div>
                  <div className="space-y-2 p-4">
                    <InfoRow label={T.promotionCode} value={promotion.code || "-"} />
                    <InfoRow label={T.promotionType} value={getPromotionTypeLabel(discountType)} />
                    <InfoRow label={T.scope} value={getPromotionScopeLabel(promotion.scope)} />
                    <InfoRow
                      label={T.discountValue}
                      value={
                        discountType === "PercentageDiscount"
                          ? `${promotion.discountValue ?? 0}%`
                          : formatCurrency(promotion.discountValue)
                      }
                    />
                    <InfoRow label={T.maxDiscount} value={formatCurrency(promotion.maxDiscountValue)} />
                    <InfoRow label={T.minOrder} value={formatCurrency(promotion.minOrderValue)} />
                    <InfoRow label={T.minQuantity} value={promotion.minAppliedQuantity ?? "-"} />
                    <InfoRow label={T.usageCount} value={promotion.usageCount ?? 0} />
                    <InfoRow label={T.usageLimit} value={promotion.usageLimit ?? T.infinite} />
                    <InfoRow label={T.usagePerUser} value={promotion.usagePerUser ?? "-"} />
                    <InfoRow label={T.stackable} value={promotion.isStackable ? T.yes : T.no} />
                    <InfoRow
                      label={T.requiredLogic}
                      value={getRequiredProductLogicLabel(promotion.requiredProductLogic)}
                    />
                    <InfoRow label={T.freeItemPickCount} value={promotion.freeItemPickCount ?? "-"} />
                  </div>
                </div>

                <div className="rounded-lg border border-slate-200 bg-white">
                  <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white px-4 py-3 text-sm font-semibold text-[#334155]">
                    {T.scopeAndTime}
                  </div>
                  <div className="space-y-2 p-4">
                    <InfoRow label="Category ID" value={promotion.categoryId || "-"} />
                    <InfoRow label="Brand ID" value={promotion.brandId || "-"} />
                    <InfoRow label={T.startDate} value={formatDateTime(promotion.startDate)} />
                    <InfoRow label={T.endDate} value={formatDateTime(promotion.endDate)} />
                    <InfoRow label={T.active} value={isActive ? T.yes : T.no} />
                    <InfoRow label={T.expired} value={promotion.isExpired ? T.yes : T.no} />
                    <InfoRow label={T.createdAt} value={formatDateTime(promotion.createdAt)} />
                    <InfoRow label={T.updatedAt} value={formatDateTime(promotion.updatedAt)} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "products" && (
            <div>
              <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-800">{T.productsInPromotion}</h2>
                  <p className="mt-1 text-sm text-slate-500">{T.totalProducts} {totalItems} {"s\u1ea3n ph\u1ea9m"}</p>
                </div>

                <div className="flex gap-2">
                  <input
                    value={productQuery}
                    onChange={(event) => setProductQuery(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        setPageNumber(0);
                        setSearchTerm(productQuery.trim());
                      }
                    }}
                    placeholder={T.productSearchPlaceholder}
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
                    {T.search}
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto rounded-lg border border-slate-200">
                <table className="w-full text-sm">
                  <thead className="border-b border-slate-200 bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-600">
                        {T.product}
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-600">
                        {T.category}
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-600">
                        {T.price}
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-600">
                        {T.stock}
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-600">
                        {T.status}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {productRows.map((product) => (
                      <tr
                        key={product.id}
                        className="cursor-pointer hover:bg-slate-50"
                        onClick={() => navigate(`/staff/products/${product.id}`)}
                      >
                        <td className="px-4 py-3">
                          <div className="font-medium text-slate-800">{product.name}</div>
                          <div className="mt-1 text-xs text-slate-500">{product.sku}</div>
                        </td>
                        <td className="px-4 py-3 text-slate-700">{product.categoryName || "-"}</td>
                        <td className="px-4 py-3 font-medium text-slate-700">{formatCurrency(product.price)}</td>
                        <td className="px-4 py-3 text-slate-700">{product.stockQty ?? product.stock ?? 0}</td>
                        <td className="px-4 py-3 text-slate-700">{product.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {!loadingProducts && productRows.length === 0 && (
                <div className="py-12 text-center text-sm text-slate-500">
                  {T.emptyProducts}
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