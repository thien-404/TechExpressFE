import React, { useEffect, useState } from "react"
import { useNavigate, useParams, useSearchParams } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { toast } from "sonner"
import {
  FiArrowLeft,
  FiInfo,
  FiImage,
  FiCpu
} from "react-icons/fi"

import { apiService } from "../../../config/axios"
import Breadcrumb from "../../../components/ui/Breadcrumb"
import ProductInfoTab from "./Tabs/ProductInfoTab"
import ProductSpecsTab from "./Tabs/ProductSpecsTab"
import ProductImagesTab from "./Tabs/ProductImagesTab"

/* =========================
 * TABS COMPONENT
 * ========================= */
const Tabs = ({ active, onChange }) => {
  const tabs = [
    { key: "info", label: "Thông tin chung", icon: FiInfo },
    { key: "specs", label: "Thông số kỹ thuật", icon: FiCpu },
    { key: "images", label: "Hình ảnh", icon: FiImage },
  ]

  return (
    <div className="border-b border-slate-200">
      <div className="flex gap-6 px-6">
        {tabs.map((tab) => {
          const isActive = active === tab.key
          const Icon = tab.icon
          
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => onChange(tab.key)}
              className={`relative -mb-px py-4 text-sm flex items-center gap-2 transition-colors ${
                isActive
                  ? "text-[#334155] font-semibold"
                  : "text-slate-500 hover:text-[#334155]"
              }`}
            >
              <Icon size={16} />
              {tab.label}
              {isActive && (
                <span className="absolute left-0 right-0 bottom-0 h-[2px] bg-[#6e846f]" />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

/* =========================
 * STATUS BADGE
 * ========================= */
const StatusBadge = ({ status }) => {
  const variants = {
    Available: "bg-green-100 text-green-700 border-green-200",
    Unavailable: "bg-red-100 text-red-700 border-red-200",
  }

  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${
        variants[status] || "bg-slate-100 text-slate-700 border-slate-200"
      }`}
    >
      {status}
    </span>
  )
}

/* =========================
 * MAIN PAGE
 * ========================= */
export default function ProductDetailPage() {
  const { productId } = useParams()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const tabFromUrl = searchParams.get("tab") || "info"
  const [activeTab, setActiveTab] = useState(tabFromUrl)

  useEffect(() => {
    setActiveTab(tabFromUrl)
  }, [tabFromUrl])

  const changeTab = (nextTab) => {
    setActiveTab(nextTab)
    setSearchParams({ tab: nextTab })
  }

  /* =========================
   * FETCH PRODUCT DATA
   * ========================= */
  const { data: product, isLoading } = useQuery({
    enabled: !!productId,
    queryKey: ["product-detail", productId],
    queryFn: async () => {
      const res = await apiService.get(`/product/${productId}`)
      if (res?.statusCode !== 200) {
        toast.error(res?.message || "Không thể tải thông tin sản phẩm")
        return null
      }
      return res.value
    },
  })

  /* =========================
   * LOADING STATE
   * ========================= */
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-sm text-slate-500">Đang tải thông tin...</div>
      </div>
    )
  }

  if (!product) return null

  /* =========================
   * RENDER
   * ========================= */
  return (
    <div className="font-[var(--font-inter)]">
      {/* Breadcrumb & Back Button */}
      <div className="flex items-center justify-between">
        <Breadcrumb
          items={[
            { label: "Trang chủ", href: "/admin" },
            { label: "Quản lý sản phẩm", href: "/admin/products" },
            { label: product.name },
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

      {/* Header */}
      <div className="mt-3 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#334155]">
            {product.name}
          </h1>
          <div className="flex items-center gap-3 mt-2">
            <StatusBadge status={product.status} />
            <span className="text-sm text-slate-500">
              SKU: <code className="bg-slate-100 px-2 py-1 rounded">{product.sku}</code>
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => navigate(`/admin/products/${productId}/edit`)}
          className="h-9 rounded bg-blue-500 px-4 text-sm font-semibold text-white hover:bg-blue-600"
        >
          Chỉnh sửa
        </button>
      </div>

      {/* Main Card */}
      <div className="mt-4 rounded-lg border border-slate-200 bg-white shadow-sm">
        <Tabs active={activeTab} onChange={changeTab} />

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === "info" && <ProductInfoTab product={product} />}
          {activeTab === "specs" && <ProductSpecsTab product={product} />}
          {activeTab === "images" && <ProductImagesTab product={product} />}
        </div>
      </div>
    </div>
  )
}