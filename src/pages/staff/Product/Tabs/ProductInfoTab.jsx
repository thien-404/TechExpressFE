import React from "react";
import {
  FiBox,
  FiDollarSign,
  FiImage,
  FiInfo,
  FiPackage,
  FiShield,
  FiTag,
} from "react-icons/fi";

const T = {
  productImages: "H\u00ecnh \u1ea3nh s\u1ea3n ph\u1ea9m",
  basicInfo: "Th\u00f4ng tin c\u01a1 b\u1ea3n",
  productName: "T\u00ean s\u1ea3n ph\u1ea9m",
  category: "Danh m\u1ee5c",
  price: "Gi\u00e1",
  warranty: "B\u1ea3o h\u00e0nh",
  noWarranty: "Kh\u00f4ng b\u1ea3o h\u00e0nh",
  month: "th\u00e1ng",
  inventory: "Kho h\u00e0ng",
  stock: "S\u1ed1 l\u01b0\u1ee3ng t\u1ed3n",
  status: "Tr\u1ea1ng th\u00e1i",
  description: "M\u00f4 t\u1ea3",
  time: "Th\u1eddi gian",
  createdAt: "Ng\u00e0y t\u1ea1o",
  updatedAt: "C\u1eadp nh\u1eadt l\u1ea7n cu\u1ed1i",
};

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

function InfoRow({ icon: Icon, label, value, highlight = false }) {
  return (
    <div
      className={`flex items-center justify-between rounded-lg px-4 py-3 transition-colors ${
        highlight ? "bg-blue-50 hover:bg-blue-100" : "hover:bg-slate-50"
      }`}
    >
      <div className="flex items-center gap-2 text-sm text-slate-600">
        {Icon && <Icon size={16} className="text-blue-500" />}
        {label}
      </div>
      <div
        className={`text-right text-sm font-medium ${
          highlight ? "text-blue-600" : "text-slate-700"
        }`}
      >
        {value ?? "-"}
      </div>
    </div>
  );
}

function formatPrice(price) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(Number(price || 0));
}

export default function ProductInfoTab({ product }) {
  if (!product) return null;

  const images = product.thumbnailUrl || [];
  const stock = product.stockQty ?? product.stock ?? 0;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      <div className="lg:col-span-4">
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white px-4 py-3">
            <div className="flex items-center gap-2">
              <FiImage size={16} className="text-slate-500" />
              <span className="text-sm font-semibold text-[#334155]">{T.productImages}</span>
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
              <div className="flex aspect-square items-center justify-center rounded-lg border border-slate-200 bg-slate-100">
                <FiPackage size={48} className="text-slate-300" />
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-6 lg:col-span-8">
        <div className="rounded-lg border border-slate-200 bg-white">
          <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white px-4 py-3">
            <div className="flex items-center gap-2">
              <FiInfo size={16} className="text-slate-500" />
              <span className="text-sm font-semibold text-[#334155]">{T.basicInfo}</span>
            </div>
          </div>

          <div className="space-y-2 p-4">
            <InfoRow icon={FiTag} label={T.productName} value={product.name} highlight />
            <InfoRow icon={FiPackage} label="SKU" value={product.sku} />
            <InfoRow icon={FiBox} label={T.category} value={product.categoryName || "-"} />
            <InfoRow icon={FiDollarSign} label={T.price} value={formatPrice(product.price)} highlight />
            <InfoRow
              icon={FiShield}
              label={T.warranty}
              value={product.warrantyMonth > 0 ? `${product.warrantyMonth} ${T.month}` : T.noWarranty}
            />
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white">
          <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white px-4 py-3">
            <div className="flex items-center gap-2">
              <FiBox size={16} className="text-slate-500" />
              <span className="text-sm font-semibold text-[#334155]">{T.inventory}</span>
            </div>
          </div>

          <div className="p-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <div className="mb-1 text-xs text-slate-600">{T.stock}</div>
                <div
                  className={`text-2xl font-bold ${
                    stock <= 10
                      ? "text-red-600"
                      : stock <= 30
                        ? "text-orange-600"
                        : "text-green-600"
                  }`}
                >
                  {stock}
                </div>
              </div>

              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <div className="mb-1 text-xs text-slate-600">{T.status}</div>
                <div className="mt-2">
                  <StatusBadge status={product.status} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {product.description && (
          <div className="rounded-lg border border-slate-200 bg-white">
            <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white px-4 py-3">
              <span className="text-sm font-semibold text-[#334155]">{T.description}</span>
            </div>

            <div className="p-4">
              <p className="text-sm leading-relaxed text-slate-600">{product.description}</p>
            </div>
          </div>
        )}

        <div className="rounded-lg border border-slate-200 bg-white">
          <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white px-4 py-3">
            <span className="text-sm font-semibold text-[#334155]">{T.time}</span>
          </div>

          <div className="space-y-2 p-4">
            <InfoRow
              label={T.createdAt}
              value={product.createdAt ? new Date(product.createdAt).toLocaleString("vi-VN") : "-"}
            />
            <InfoRow
              label={T.updatedAt}
              value={product.updatedAt ? new Date(product.updatedAt).toLocaleString("vi-VN") : "-"}
            />
          </div>
        </div>
      </div>
    </div>
  );
}