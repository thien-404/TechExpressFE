import { apiService } from "../config/axios";

function normalizeEnvelope(response) {
  const statusCode = response?.statusCode ?? response?.status;
  const succeeded = statusCode === 200;

  return {
    succeeded,
    statusCode,
    message: response?.message || "",
    value: response?.value,
  };
}

export const orderService = {
  async guestCheckout(payload) {
    const response = await apiService.post("/Order/guest-checkout", payload);
    return normalizeEnvelope(response);
  },

  async memberCheckout(payload) {
    const response = await apiService.post("/Order/member-checkout", payload);
    return normalizeEnvelope(response);
  },

  async initOnlinePayment(orderId, payload) {
    const response = await apiService.post(`/payments/orders/${orderId}/online/init`, payload);
    return normalizeEnvelope(response);
  },
};

