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

export const cartService = {
  async getItems() {
    const response = await apiService.get("/cart/items");
    return normalizeEnvelope(response);
  },

  async addItem(payload) {
    const response = await apiService.post("/cart/items", payload);
    return normalizeEnvelope(response);
  },

  async updateItem(itemId, payload) {
    const response = await apiService.put(`/cart/items/${itemId}`, payload);
    return normalizeEnvelope(response);
  },

  async removeItem(itemId) {
    const response = await apiService.delete(`/cart/items/${itemId}`);
    return normalizeEnvelope(response);
  },

  async clearCart() {
    const response = await apiService.delete("/cart/clear");
    return normalizeEnvelope(response);
  },
};
