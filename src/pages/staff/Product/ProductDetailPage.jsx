import React, { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FiArrowLeft, FiCpu, FiImage, FiInfo } from "react-icons/fi";
import { toast } from "sonner";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";

import Breadcrumb from "../../../components/ui/Breadcrumb";
import { apiService } from "../../../config/axios";
import ProductInfoTab from "./Tabs/ProductInfoTab.jsx";
import ProductSpecsTab from "./Tabs/ProductSpecsTab.jsx";
import ProductImagesReadOnlyTab from "./Tabs/ProductImagesReadOnlyTab.jsx";

const T = {
  home: "Trang ch\u1ee7",
  title: "Qu\u1ea3n l\u00fd s\u1ea3n ph\u1ea9m",
  generalInfo: "Th\u00f4ng tin chung",
  specs: "Th\u00f4ng s\u1ed1 k\u1ef9 thu\u1eadt",
  images: "H\u00ecnh \u1ea3nh",
  loadError: "Kh\u00f4ng th\u1ec3 t\u1ea3i th\u00f4ng tin s\u1ea3n ph\u1ea9m",
  loading: "\u0110ang t\u1ea3i th\u00f4ng tin s\u1ea3n ph\u1ea9m...",
  notFound: "Kh\u00f4ng t\u00ecm th\u1ea5y s\u1ea3n ph\u1ea9m ho\u1eb7c d\u1eef li\u1ec7u kh\u00f4ng c\u00f2n kh\u1ea3 d\u1ee5ng.",
  back: "Quay l\u1ea1i",
};

const TABS = [
  { key: "info", label: T.generalInfo, icon: FiInfo },
  { key: "specs", label: T.specs, icon: FiCpu },
  { key: "images", label: T.images, icon: FiImage },
];

function Tabs({ active, onChange }) {
  return (
    <div className="border-b border-slate-200">
      <div className="flex gap-6 px-6">
        {TABS.map((tab) => {
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

function StatusBadge({ status }) {
  const variants = {
    Available: "bg-green-100 text-green-700 border-green-200",
    Unavailable: "bg-red-100 text-red-700 border-red-200",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${
        variants[status] || "bg-slate-100 text-slate-700 border-slate-200"
      }`}
    >
      {status}
    </span>
  );
}

export default function StaffProductDetailPage() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromUrl = searchParams.get("tab") || "info";
  const [activeTab, setActiveTab] = useState(tabFromUrl);

  useEffect(() => {
    setActiveTab(tabFromUrl);
  }, [tabFromUrl]);

  const changeTab = (nextTab) => {
    setActiveTab(nextTab);
    setSearchParams({ tab: nextTab });
  };

  const { data: product, isLoading } = useQuery({
    enabled: !!productId,
    queryKey: ["staff-product-detail", productId],
    queryFn: async () => {
      const res = await apiService.get(`/product/${productId}`);
      if (res?.statusCode !== 200) {
        toast.error(res?.message || T.loadError);
        return null;
      }
      return res.value;
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-sm text-slate-500">{T.loading}</div>
      </div>
    );
  }

  if (!product) {
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
            { label: T.title, href: "/staff/products" },
            { label: product.name },
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

      <div className="mt-3 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-[#334155]">{product.name}</h1>
          <div className="mt-2 flex items-center gap-3">
            <StatusBadge status={product.status} />
            <span className="text-sm text-slate-500">
              SKU: <code className="rounded bg-slate-100 px-2 py-1">{product.sku}</code>
            </span>
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-lg border border-slate-200 bg-white shadow-sm">
        <Tabs active={activeTab} onChange={changeTab} />

        <div className="p-6">
          {activeTab === "info" && <ProductInfoTab product={product} />}
          {activeTab === "specs" && <ProductSpecsTab product={product} />}
          {activeTab === "images" && <ProductImagesReadOnlyTab product={product} />}
        </div>
      </div>
    </div>
  );
}