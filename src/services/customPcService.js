import { apiService } from "../config/axios";
import { getOrCreateCustomPcGuestSessionId } from "../utils/customPcSession";

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

function normalizeProduct(product) {
  if (!product) return null;

  const images = product.images || product.imageUrls || product.productImages || [];
  const firstImage =
    product.firstImageUrl ||
    product.thumbnailUrl ||
    product.imageUrl ||
    images?.[0]?.imageUrl ||
    images?.[0]?.url ||
    images?.[0] ||
    "";

  return {
    id: product.id ?? product.productId ?? "",
    name: product.name ?? product.productName ?? "Unnamed product",
    sku: product.sku ?? product.code ?? "",
    price: Number(product.price ?? product.unitPrice ?? product.salePrice ?? 0) || 0,
    firstImageUrl: firstImage,
    categoryName: product.categoryName ?? product.category?.name ?? product.productCategoryName ?? "Other parts",
    categoryId: product.categoryId ?? product.category?.id ?? null,
    stockQty: Number(product.stockQty ?? product.stock ?? product.quantityAvailable ?? 0) || 0,
    status: product.status ?? product.productStatus ?? "Available",
    warrantyMonth: Number(product.warrantyMonth ?? product.warrantyMonths ?? 0) || 0,
  };
}

function normalizeItem(item) {
  const product = normalizeProduct(item?.product ?? item?.productResponse ?? item?.productDetail ?? null);

  return {
    id: item?.id ?? item?.customPcItemId ?? item?.itemId ?? null,
    productId: item?.productId ?? product?.id ?? "",
    customPcId: item?.customPCId ?? item?.customPcId ?? item?.customPcID ?? null,
    quantity: Number(item?.quantity ?? item?.qty ?? 1) || 1,
    unitPrice: Number(item?.unitPrice ?? item?.price ?? product?.price ?? 0) || 0,
    warrantyMonth: Number(item?.warrantyMonth ?? product?.warrantyMonth ?? 0) || 0,
    categoryId: item?.categoryId ?? product?.categoryId ?? null,
    firstImageUrl: item?.firstImageUrl ?? product?.firstImageUrl ?? "",
    productName: item?.productName ?? product?.name ?? "Unnamed product",
    product:
      product ||
      normalizeProduct({
        id: item?.productId,
        name: item?.productName,
        price: item?.price,
        firstImageUrl: item?.firstImageUrl,
        categoryId: item?.categoryId,
        warrantyMonth: item?.warrantyMonth,
      }),
  };
}

function normalizeBuild(build) {
  const items = Array.isArray(build?.items)
    ? build.items
    : Array.isArray(build?.customPcItems)
      ? build.customPcItems
      : Array.isArray(build?.components)
        ? build.components
        : [];

  const normalizedItems = items.map(normalizeItem);
  const computedTotal = normalizedItems.reduce((sum, item) => {
    const unitPrice = Number(item?.unitPrice ?? item?.product?.price ?? 0) || 0;
    return sum + unitPrice * (Number(item?.quantity ?? 0) || 0);
  }, 0);

  return {
    id: build?.id ?? build?.customPCId ?? build?.customPcId ?? "",
    userId: build?.userId ?? build?.customerId ?? null,
    sessionId: build?.sessionId ?? null,
    name: build?.name ?? build?.customPCName ?? build?.customPcName ?? "Custom PC",
    createdAt: build?.createdAt ?? build?.createdDate ?? build?.creationTime ?? null,
    updatedAt: build?.updatedAt ?? build?.lastModifiedAt ?? build?.modifiedAt ?? null,
    totalPrice: Number(build?.totalPrice ?? build?.price ?? computedTotal) || computedTotal,
    items: normalizedItems,
  };
}

function buildCustomPcRequestOptions() {
  if (typeof localStorage === "undefined") {
    return {};
  }

  const token = localStorage.getItem("token");
  if (token) {
    return {};
  }

  return {
    headers: {
      "X-CustomPC-Guest-Session": getOrCreateCustomPcGuestSessionId(),
    },
  };
}

export const customPcService = {
  async getCustomPcBuilds() {
    const response = await apiService.get("/custompc", undefined, buildCustomPcRequestOptions());
    const normalized = normalizeEnvelope(response);

    return {
      ...normalized,
      value: Array.isArray(normalized.value) ? normalized.value.map(normalizeBuild) : [],
    };
  },

  async createCustomPcBuild(payload) {
    const response = await apiService.post("/custompc", payload, buildCustomPcRequestOptions());
    const normalized = normalizeEnvelope(response);

    return {
      ...normalized,
      value: normalized.value ? normalizeBuild(normalized.value) : null,
    };
  },

  async getCustomPcBuildDetail(customPcId) {
    const response = await apiService.get(`/custompc/${customPcId}/items`, undefined, buildCustomPcRequestOptions());
    const normalized = normalizeEnvelope(response);

    return {
      ...normalized,
      value: normalized.value ? normalizeBuild(normalized.value) : null,
    };
  },

  async addItemToCustomPc(customPcId, payload) {
    const response = await apiService.post(`/custompc/${customPcId}/items`, payload, buildCustomPcRequestOptions());
    const normalized = normalizeEnvelope(response);

    return {
      ...normalized,
      value: normalized.value ? normalizeBuild(normalized.value) : null,
    };
  },

  async checkCompatibility(payload) {
    const response = await apiService.post("/ProductPC/compatibility", payload, buildCustomPcRequestOptions());
    return normalizeEnvelope(response);
  },

  async deleteCustomPcBuild(customPcId) {
    const response = await apiService.delete(`/custompc/${customPcId}`, buildCustomPcRequestOptions());
    return normalizeEnvelope(response);
  },

  normalizeBuild,
  normalizeItem,
  normalizeProduct,
};
