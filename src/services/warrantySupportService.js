import { apiService } from "../config/axios";

function normalizeWarrantyResponse(response) {
  const statusCode = response?.statusCode ?? response?.status ?? 500;
  const succeeded = statusCode >= 200 && statusCode < 300 && response?.succeeded !== false;

  return {
    succeeded,
    statusCode,
    message: response?.message || "",
    value: succeeded ? response?.value || null : null,
  };
}

export const warrantySupportService = {
  async checkWarrantyByTicket(ticketId) {
    const response = await apiService.post(
      `/WarrantySupport/tickets/${ticketId}/check-warranty`,
      {}
    );

    return normalizeWarrantyResponse(response);
  },

  async checkWarrantyByTicketDate(ticketId, checkDate) {
    const response = await apiService.post(
      `/WarrantySupport/tickets/${ticketId}/check-warranty-custom-date`,
      { checkDate }
    );

    return normalizeWarrantyResponse(response);
  },
};
