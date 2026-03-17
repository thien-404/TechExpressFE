import { apiService } from "../config/axios";

function normalizeEnvelope(response) {
  const statusCode = response?.statusCode ?? response?.status;
  const succeeded = statusCode === 200 || statusCode === 201 || statusCode === 204;

  return {
    succeeded,
    statusCode,
    message: response?.message || "",
    value: response?.value,
  };
}

export function normalizeProductPcComponent(product) {
  if (!product) return null;

  const images = product.images || product.imageUrls || product.productImages || [];
  const firstImageUrl =
    product.firstImageUrl ||
    product.thumbnailUrl?.[0] ||
    product.thumbnailUrl ||
    product.imageUrl ||
    images?.[0]?.imageUrl ||
    images?.[0]?.url ||
    images?.[0] ||
    "";

  return {
    id: product.id ?? product.productId ?? "",
    name: product.name ?? product.productName ?? "San pham",
    sku: product.sku ?? product.code ?? "",
    price: Number(product.price ?? product.unitPrice ?? product.salePrice ?? 0) || 0,
    firstImageUrl,
    categoryId: product.categoryId ?? product.category?.id ?? null,
    categoryName: product.categoryName ?? product.category?.name ?? "Linh kien khac",
    warrantyMonth: Number(product.warrantyMonth ?? product.warrantyMonths ?? 0) || 0,
    stockQty:
      product.stockQty === null || product.stockQty === undefined
        ? null
        : Math.max(Number(product.stockQty ?? product.stock ?? 0) || 0, 0),
    status: product.status ?? product.productStatus ?? "Available",
  };
}

export const productPcService = {
  async createProductPc(payload) {
    return normalizeEnvelope(await apiService.post("/ProductPC", payload));
  },

  async checkProductPcCompatibility(payload) {
    return normalizeEnvelope(await apiService.post("/ProductPC/compatibility", payload));
  },

  normalizeProductPcComponent,
};
