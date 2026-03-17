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

export const promotionService = {
  async calculatePromotion(payload) {
    const response = await apiService.post("/Promotion/calculate", payload);
    return normalizeEnvelope(response);
  },
};
