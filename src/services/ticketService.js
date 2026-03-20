import { apiService } from "../config/axios";
import {
  normalizeSortDirection,
  normalizeTicket,
  normalizeTicketEnvelope,
  normalizeTicketMessage,
  normalizeTicketPagination,
  normalizeTicketSortBy,
  normalizeTicketStatus,
  toSortDirectionApiValue,
  toTicketSortByApiValue,
  toTicketStatusApiValue,
} from "../utils/ticket";

function buildTicketRequestOptions(options = {}) {
  const { customPcGuestSessionId, headers, ...restOptions } = options;
  const nextHeaders = { ...(headers || {}) };

  if (customPcGuestSessionId) {
    nextHeaders["X-CustomPC-Guest-Session"] = customPcGuestSessionId;
  }

  return {
    ...restOptions,
    headers: nextHeaders,
  };
}

function normalizeListParams(params = {}) {
  const nextParams = {
    page: Math.max(Number(params.page) || 1, 1),
    pageSize: Math.min(Math.max(Number(params.pageSize) || 10, 1), 50),
  };

  const normalizedStatus = normalizeTicketStatus(params.status);
  if (normalizedStatus) {
    nextParams.status = toTicketStatusApiValue(normalizedStatus);
  }

  const normalizedSortBy = normalizeTicketSortBy(params.sortBy);
  if (normalizedSortBy) {
    nextParams.sortBy = toTicketSortByApiValue(normalizedSortBy);
  }

  const normalizedSortDirection = normalizeSortDirection(params.sortDirection);
  if (normalizedSortDirection) {
    nextParams.sortDirection = toSortDirectionApiValue(normalizedSortDirection);
  }

  return nextParams;
}

export const ticketService = {
  async createTicket(payload, options = {}) {
    const response = await apiService.post(
      "/Ticket",
      payload,
      buildTicketRequestOptions(options)
    );

    return normalizeTicketEnvelope(response, normalizeTicket);
  },

  async getMyTickets(params = {}, options = {}) {
    const response = await apiService.get(
      "/Ticket/my",
      {
        ...normalizeListParams(params),
        ...(options.phone ? { phone: options.phone } : {}),
      },
      buildTicketRequestOptions(options)
    );

    return normalizeTicketEnvelope(response, normalizeTicketPagination);
  },

  async getMyTicketDetail(ticketId, options = {}) {
    const response = await apiService.get(
      `/Ticket/my/${ticketId}`,
      options.phone ? { phone: options.phone } : undefined,
      buildTicketRequestOptions(options)
    );

    return normalizeTicketEnvelope(response, normalizeTicket);
  },

  async replyToTicket(ticketId, payload, options = {}) {
    const response = await apiService.post(
      `/Ticket/${ticketId}/messages`,
      payload,
      buildTicketRequestOptions(options)
    );

    return normalizeTicketEnvelope(response, normalizeTicketMessage);
  },

  async getAllTickets(params = {}, options = {}) {
    const response = await apiService.get(
      "/Ticket",
      normalizeListParams(params),
      buildTicketRequestOptions(options)
    );

    return normalizeTicketEnvelope(response, normalizeTicketPagination);
  },

  async getTicketDetail(ticketId, options = {}) {
    const response = await apiService.get(
      `/Ticket/${ticketId}`,
      undefined,
      buildTicketRequestOptions(options)
    );

    return normalizeTicketEnvelope(response, normalizeTicket);
  },

  async updateTicketStatus(ticketId, status, options = {}) {
    const response = await apiService.patch(
      `/Ticket/${ticketId}/status`,
      { status: toTicketStatusApiValue(status) },
      buildTicketRequestOptions(options)
    );

    return normalizeTicketEnvelope(response, normalizeTicket);
  },

  async completeTicket(ticketId, status, options = {}) {
    const response = await apiService.patch(
      `/Ticket/${ticketId}/complete`,
      { status: toTicketStatusApiValue(status) },
      buildTicketRequestOptions(options)
    );

    return normalizeTicketEnvelope(response, normalizeTicketMessage);
  },
};
