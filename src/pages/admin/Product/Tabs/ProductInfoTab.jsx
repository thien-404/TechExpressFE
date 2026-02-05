import React from "react"
import {
  FiPackage,
  FiTag,
  FiDollarSign,
  FiBox,
  FiInfo,
  FiImage,
  FiShield
} from "react-icons/fi"

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
 * INFO ROW
 * ========================= */
const InfoRow = ({ icon: Icon, label, value, highlight = false }) => (
  <div
    className={`flex items-center justify-between py-3 px-4 rounded-lg transition-colors ${
      highlight ? "bg-blue-50 hover:bg-blue-100" : "hover:bg-slate-50"
    }`}
  >
    <div className="flex items-center gap-2 text-slate-600 text-sm">
      {Icon && <Icon size={16} className="text-blue-500" />}
      {label}
    </div>
    <div
      className={`text-sm font-medium text-right ${
        highlight ? "text-blue-600" : "text-slate-700"
      }`}
    >
      {value ?? "-"}
    </div>
  </div>
)

/* =========================
 * FORMAT PRICE
 * ========================= */
const formatPrice = (price) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(price)

/* =========================
 * PRODUCT INFO TAB
 * ========================= */
export default function ProductInfoTab({ product, brandName }) {
  if (!product) return null

  const images = product.thumbnailUrl || []

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* LEFT */}
      <div className="lg:col-span-4">
        <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
            <div className="flex items-center gap-2">
              <FiImage size={16} className="text-slate-500" />
              <span className="text-sm font-semibold text-[#334155]">
                Hình ảnh sản phẩm
              </span>
            </div>
          </div>

          <div className="p-6">
            {images.length > 0 ? (
              <img
                src={images[0]}
                alt={product.name}
                className="w-full rounded-lg border border-slate-200"
              />
            ) : (
              <div className="aspect-square flex items-center justify-center bg-slate-100 rounded-lg border border-slate-200">
                <FiPackage size={48} className="text-slate-300" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* RIGHT */}
      <div className="lg:col-span-8 space-y-6">
        {/* BASIC INFO */}
        <div className="rounded-lg border border-slate-200 bg-white">
          <div className="px-4 py-3 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
            <div className="flex items-center gap-2">
              <FiInfo size={16} className="text-slate-500" />
              <span className="text-sm font-semibold text-[#334155]">
                Thông tin cơ bản
              </span>
            </div>
          </div>

          <div className="p-4 space-y-2">
            <InfoRow icon={FiTag} label="Tên sản phẩm" value={product.name} highlight />
            <InfoRow icon={FiPackage} label="SKU" value={product.sku} />
            <InfoRow icon={FiBox} label="Danh mục" value={product.categoryName} />
            {/* <InfoRow
              icon={FiTag}
              label="Thương hiệu"
              value={brandName || product.brandId}
            /> */}
            <InfoRow
              icon={FiDollarSign}
              label="Giá"
              value={formatPrice(product.price)}
              highlight
            />
            <InfoRow
              icon={FiShield}
              label="Bảo hành"
              value={
                product.warrantyMonth > 0
                  ? `${product.warrantyMonth} tháng`
                  : "Không bảo hành"
              }
            />
          </div>
        </div>

        {/* STOCK & STATUS */}
        <div className="rounded-lg border border-slate-200 bg-white">
          <div className="px-4 py-3 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
            <div className="flex items-center gap-2">
              <FiBox size={16} className="text-slate-500" />
              <span className="text-sm font-semibold text-[#334155]">
                Kho hàng
              </span>
            </div>
          </div>

          <div className="p-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg bg-slate-50 p-4 border border-slate-200">
                <div className="text-xs text-slate-600 mb-1">Số lượng tồn</div>
                <div
                  className={`text-2xl font-bold ${
                    product.stock <= 10
                      ? "text-red-600"
                      : product.stock <= 30
                      ? "text-orange-600"
                      : "text-green-600"
                  }`}
                >
                  {product.stock}
                </div>
              </div>

              <div className="rounded-lg bg-slate-50 p-4 border border-slate-200">
                <div className="text-xs text-slate-600 mb-1">Trạng thái</div>
                <div className="mt-2">
                  <StatusBadge status={product.status} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* DESCRIPTION */}
        {product.description && (
          <div className="rounded-lg border border-slate-200 bg-white">
            <div className="px-4 py-3 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
              <span className="text-sm font-semibold text-[#334155]">Mô tả</span>
            </div>

            <div className="p-4">
              <p className="text-sm text-slate-600 leading-relaxed">
                {product.description}
              </p>
            </div>
          </div>
        )}

        {/* TIME */}
        <div className="rounded-lg border border-slate-200 bg-white">
          <div className="px-4 py-3 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
            <span className="text-sm font-semibold text-[#334155]">Thời gian</span>
          </div>

          <div className="p-4 space-y-2">
            <InfoRow
              label="Ngày tạo"
              value={new Date(product.createdAt).toLocaleString("vi-VN")}
            />
            <InfoRow
              label="Cập nhật lần cuối"
              value={new Date(product.updatedAt).toLocaleString("vi-VN")}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
