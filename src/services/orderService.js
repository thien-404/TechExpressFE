import { apiService } from "../config/axios";

function normalizeEnvelope(response) {
  const statusCode = response?.statusCode ?? response?.status;
  const succeeded = statusCode >= 200 && statusCode < 300;

  return {
    succeeded,
    statusCode,
    message: response?.message || "",
    value: response?.value,
  };
}

async function runOrderStatusAction(orderId, action) {
  const response = await apiService.get(`/Order/${orderId}/${action}`);
  return normalizeEnvelope(response);
}

async function runOrderStatusPutAction(orderId, action, payload = {}) {
  const response = await apiService.put(`/Order/${orderId}/${action}`, payload);
  return normalizeEnvelope(response);
}

export const orderService = {
  async getOrders(params = {}) {
    const response = await apiService.get("/Order", params);
    return normalizeEnvelope(response);
  },

  async getMyOrders(params = {}) {
    const response = await apiService.get("/Order/my-orders", params);
    return normalizeEnvelope(response);
  },

  async getOrderDetail(orderId) {
    const response = await apiService.get(`/Order/getOrderDetail/${orderId}`);
    return normalizeEnvelope(response);
  },

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

  async initInstallmentOnlinePayment(installmentId, payload) {
    const response = await apiService.post(
      `/payments/installments/${installmentId}/online/init`,
      payload
    );
    return normalizeEnvelope(response);
  },

  async processOrder(orderId) {
    return runOrderStatusAction(orderId, "process");
  },

  async deliverOrder(orderId, payload) {
    return runOrderStatusPutAction(orderId, "deliver", payload);
  },

  async markOrderDelivered(orderId) {
    return runOrderStatusAction(orderId, "delivered");
  },

  async markOrderReadyForPickup(orderId) {
    return runOrderStatusAction(orderId, "ready-to-pickup");
  },

  async markOrderPickedUp(orderId) {
    return runOrderStatusAction(orderId, "picked-up");
  },

  async completeOrder(orderId) {
    return runOrderStatusAction(orderId, "completed");
  },
};
