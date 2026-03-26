import { apiService } from "../config/axios";

function normalizeEnvelope(response) {
  const statusCode = response?.statusCode ?? response?.status;

  return {
    succeeded: statusCode >= 200 && statusCode < 300,
    statusCode,
    message: response?.message || "",
    value: response?.value,
  };
}

function normalizePromotionCollection(value, fallbackPage = 1) {
  return {
    items: Array.isArray(value?.items) ? value.items : [],
    totalPages: Number(value?.totalPages) || 1,
    totalCount: Number(value?.totalCount) || 0,
    pageNumber: Number(value?.pageNumber) || fallbackPage,
    hasPreviousPage: Boolean(value?.hasPreviousPage),
    hasNextPage: Boolean(value?.hasNextPage),
  };
}

export const promotionService = {
  async calculatePromotion(payload) {
    const response = await apiService.post("/Promotion/calculate", payload);
    return normalizeEnvelope(response);
  },

  async getCustomerPromotions(params = {}) {
    const response = await apiService.get("/promotion/customer_guest/all", params);
    const normalized = normalizeEnvelope(response);

    return {
      ...normalized,
      value: normalizePromotionCollection(normalized.value, Number(params?.page) || 1),
    };
  },
};
