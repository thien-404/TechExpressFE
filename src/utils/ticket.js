const TICKET_TYPE_VALUES = [
  "CompatibilityQuestion",
  "BuildAdvice",
  "OrderIssue",
  "TechnicalSupport",
  "WarrantyRequest",
  "Other",
];

const TICKET_STATUS_VALUES = [
  "Open",
  "InProgress",
  "WaitingForCustomer",
  "Resolved",
  "Closed",
];

const TICKET_PRIORITY_VALUES = ["Low", "Medium", "High", "Urgent"];

const TICKET_SORT_BY_VALUES = ["CreatedAt", "UpdatedAt", "Status"];

const SORT_DIRECTION_VALUES = ["Asc", "Desc"];

const TICKET_TYPE_LABELS = {
  CompatibilityQuestion: "Câu hỏi tương thích",
  BuildAdvice: "Tư vấn cấu hình",
  OrderIssue: "Vấn đề đơn hàng",
  TechnicalSupport: "Hỗ trợ kỹ thuật",
  WarrantyRequest: "Yêu cầu bảo hành",
  Other: "Khác",
};

const TICKET_STATUS_LABELS = {
  Open: "Mới tạo",
  InProgress: "Đang xử lý",
  WaitingForCustomer: "Chờ khách hàng phản hồi",
  Resolved: "Đã xử lý",
  Closed: "Đã đóng",
};

const TICKET_PRIORITY_LABELS = {
  Low: "Thấp",
  Medium: "Trung bình",
  High: "Cao",
  Urgent: "Khẩn cấp",
};

const TICKET_SORT_BY_LABELS = {
  CreatedAt: "Ngày tạo",
  UpdatedAt: "Ngày cập nhật",
  Status: "Trạng thái",
};

const SORT_DIRECTION_LABELS = {
  Asc: "Tăng dần",
  Desc: "Giảm dần",
};

const DATE_TIME_FORMATTER = new Intl.DateTimeFormat("vi-VN", {
  dateStyle: "short",
  timeStyle: "short",
});

const DATE_ONLY_FORMATTER = new Intl.DateTimeFormat("vi-VN", {
  dateStyle: "medium",
});

function readValue(source, keys, fallback = null) {
  for (const key of keys) {
    const value = source?.[key];
    if (value !== undefined && value !== null) {
      return value;
    }
  }

  return fallback;
}

function normalizeEnumKey(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, "");
}

function matchEnumValue(value, allowedValues) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return allowedValues[value] || null;
  }

  const stringValue = String(value).trim();
  if (/^\d+$/.test(stringValue)) {
    return allowedValues[Number(stringValue)] || null;
  }

  const normalizedValue = normalizeEnumKey(stringValue);
  return (
    allowedValues.find((item) => normalizeEnumKey(item) === normalizedValue) ||
    null
  );
}

function toApiEnumValue(value, allowedValues) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  const stringValue = String(value).trim();
  if (/^\d+$/.test(stringValue)) {
    return Number(stringValue);
  }

  const matchedValue = matchEnumValue(stringValue, allowedValues);
  return matchedValue ? allowedValues.indexOf(matchedValue) : null;
}

function trimOrNull(value) {
  const trimmedValue = String(value || "").trim();
  return trimmedValue ? trimmedValue : null;
}

function parseNullableInteger(value) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const parsedValue = Number(value);
  if (!Number.isFinite(parsedValue)) {
    return null;
  }

  return parsedValue;
}

function getSafeDate(value) {
  if (!value) return null;

  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    return null;
  }

  return parsedDate;
}

function compareDatesAsc(leftValue, rightValue) {
  const leftDate = getSafeDate(leftValue)?.getTime() || 0;
  const rightDate = getSafeDate(rightValue)?.getTime() || 0;
  return leftDate - rightDate;
}

function parseFileNameFromUrl(fileUrl) {
  if (!fileUrl) return "Tệp đính kèm";

  const rawName = String(fileUrl).split("?")[0].split("#")[0].split("/").pop();
  if (!rawName) return "Tệp đính kèm";

  try {
    return decodeURIComponent(rawName);
  } catch {
    return rawName;
  }
}

export function normalizeTicketType(value) {
  return matchEnumValue(value, TICKET_TYPE_VALUES);
}

export function normalizeTicketStatus(value) {
  return matchEnumValue(value, TICKET_STATUS_VALUES);
}

export function normalizeTicketPriority(value) {
  return matchEnumValue(value, TICKET_PRIORITY_VALUES);
}

export function normalizeTicketSortBy(value) {
  return matchEnumValue(value, TICKET_SORT_BY_VALUES);
}

export function normalizeSortDirection(value) {
  return matchEnumValue(value, SORT_DIRECTION_VALUES);
}

export function toTicketTypeApiValue(value) {
  return toApiEnumValue(value, TICKET_TYPE_VALUES);
}

export function toTicketStatusApiValue(value) {
  return toApiEnumValue(value, TICKET_STATUS_VALUES);
}

export function toTicketSortByApiValue(value) {
  return toApiEnumValue(value, TICKET_SORT_BY_VALUES);
}

export function toSortDirectionApiValue(value) {
  return toApiEnumValue(value, SORT_DIRECTION_VALUES);
}

export function getTicketTypeLabel(value) {
  const normalizedValue = normalizeTicketType(value);
  return normalizedValue ? TICKET_TYPE_LABELS[normalizedValue] : "Không xác định";
}

export function getTicketStatusLabel(value) {
  const normalizedValue = normalizeTicketStatus(value);
  return normalizedValue ? TICKET_STATUS_LABELS[normalizedValue] : "Không xác định";
}

export function getTicketPriorityLabel(value) {
  const normalizedValue = normalizeTicketPriority(value);
  return normalizedValue ? TICKET_PRIORITY_LABELS[normalizedValue] : "Không xác định";
}

export function getTicketSortByLabel(value) {
  const normalizedValue = normalizeTicketSortBy(value);
  return normalizedValue ? TICKET_SORT_BY_LABELS[normalizedValue] : "Không xác định";
}

export function getSortDirectionLabel(value) {
  const normalizedValue = normalizeSortDirection(value);
  return normalizedValue ? SORT_DIRECTION_LABELS[normalizedValue] : "Không xác định";
}

export function formatTicketDateTime(value) {
  const parsedDate = getSafeDate(value);
  return parsedDate ? DATE_TIME_FORMATTER.format(parsedDate) : "--";
}

export function formatTicketDate(value) {
  const parsedDate = getSafeDate(value);
  return parsedDate ? DATE_ONLY_FORMATTER.format(parsedDate) : "--";
}

export function formatTicketRelativeTime(value) {
  const parsedDate = getSafeDate(value);
  if (!parsedDate) return "--";

  const diffMs = Date.now() - parsedDate.getTime();
  if (diffMs < 60_000) return "Vừa xong";
  if (diffMs < 3_600_000) return `${Math.max(1, Math.floor(diffMs / 60_000))} phút trước`;
  if (diffMs < 86_400_000) {
    return parsedDate.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return parsedDate.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function normalizeTicketAttachment(attachment, index = 0) {
  const fileUrl = readValue(attachment, ["fileUrl", "FileUrl", "url", "Url"], "");

  return {
    id: readValue(attachment, ["id", "Id"], `${fileUrl || "attachment"}-${index}`),
    fileUrl,
    uploadedAt: readValue(attachment, ["uploadedAt", "UploadedAt"], null),
    name: readValue(attachment, ["name", "Name"], parseFileNameFromUrl(fileUrl)),
  };
}

export function normalizeTicketMessage(message) {
  const attachments = readValue(message, ["attachments", "Attachments"], []);

  return {
    id: readValue(message, ["id", "Id"], null),
    ticketId: readValue(message, ["ticketId", "TicketId"], null),
    userId: readValue(message, ["userId", "UserId"], null),
    content: readValue(message, ["content", "Content"], ""),
    isStaffMessage: Boolean(
      readValue(message, ["isStaffMessage", "IsStaffMessage"], false)
    ),
    attachments: Array.isArray(attachments)
      ? attachments.map(normalizeTicketAttachment)
      : [],
    sentAt: readValue(message, ["sentAt", "SentAt"], null),
  };
}

export function normalizeTicketListItem(ticket) {
  return {
    id: readValue(ticket, ["id", "Id"], null),
    userId: readValue(ticket, ["userId", "UserId"], null),
    title: readValue(ticket, ["title", "Title"], ""),
    description: readValue(
      ticket,
      ["description", "Description", "content", "Content"],
      ""
    ),
    status: normalizeTicketStatus(readValue(ticket, ["status", "Status"], "Open")) || "Open",
    createdAt: readValue(ticket, ["createdAt", "CreatedAt"], null),
    updatedAt: readValue(ticket, ["updatedAt", "UpdatedAt"], null),
  };
}

export function normalizeTicket(ticket) {
  const messages = readValue(ticket, ["messages", "Messages"], []);

  return {
    id: readValue(ticket, ["id", "Id"], null),
    userId: readValue(ticket, ["userId", "UserId"], null),
    fullName: readValue(ticket, ["fullName", "FullName"], null),
    phone: readValue(ticket, ["phone", "Phone"], null),
    title: readValue(ticket, ["title", "Title"], ""),
    description: readValue(ticket, ["description", "Description"], ""),
    type: normalizeTicketType(readValue(ticket, ["type", "Type"], "Other")) || "Other",
    status: normalizeTicketStatus(readValue(ticket, ["status", "Status"], "Open")) || "Open",
    priority:
      normalizeTicketPriority(readValue(ticket, ["priority", "Priority"], "Medium")) ||
      "Medium",
    customPCId: readValue(ticket, ["customPCId", "CustomPCId"], null),
    customPC: readValue(ticket, ["customPC", "CustomPC"], null),
    messages: Array.isArray(messages)
      ? messages
          .map(normalizeTicketMessage)
          .sort((leftValue, rightValue) =>
            compareDatesAsc(leftValue.sentAt, rightValue.sentAt)
          )
      : [],
    completedByUserId: readValue(
      ticket,
      ["completedByUserId", "CompletedByUserId"],
      null
    ),
    completedByName: readValue(ticket, ["completedByName", "CompletedByName"], null),
    resolvedAt: readValue(ticket, ["resolvedAt", "ResolvedAt"], null),
    closedAt: readValue(ticket, ["closedAt", "ClosedAt"], null),
    createdAt: readValue(ticket, ["createdAt", "CreatedAt"], null),
    updatedAt: readValue(ticket, ["updatedAt", "UpdatedAt"], null),
  };
}

export function normalizeTicketPagination(pagination) {
  const items = readValue(pagination, ["items", "Items"], []);
  const pageNumber = Number(readValue(pagination, ["pageNumber", "PageNumber"], 1)) || 1;
  const pageSize = Number(readValue(pagination, ["pageSize", "PageSize"], 10)) || 10;
  const totalCount = Number(readValue(pagination, ["totalCount", "TotalCount"], 0)) || 0;
  const totalPages =
    Number(readValue(pagination, ["totalPages", "TotalPages"], 0)) ||
    Math.max(1, Math.ceil(totalCount / Math.max(pageSize, 1)));

  const hasPreviousPage = Boolean(
    readValue(pagination, ["hasPreviousPage", "HasPreviousPage"], pageNumber > 1)
  );
  const hasNextPage = Boolean(
    readValue(pagination, ["hasNextPage", "HasNextPage"], pageNumber < totalPages)
  );

  return {
    items: Array.isArray(items) ? items.map(normalizeTicketListItem) : [],
    pageNumber,
    pageSize,
    totalCount,
    totalPages,
    hasPreviousPage,
    hasNextPage,
  };
}

export function normalizeTicketEnvelope(response, normalizer = (value) => value) {
  const statusCode = response?.statusCode ?? response?.status ?? 500;
  const succeeded = statusCode >= 200 && statusCode < 300 && response?.succeeded !== false;
  const normalizedValue = succeeded ? normalizer(response?.value) : null;

  return {
    succeeded,
    statusCode,
    message: response?.message || "",
    value: normalizedValue,
  };
}

export function isTicketReplyLocked(status) {
  const normalizedStatus = normalizeTicketStatus(status);
  return normalizedStatus === "Resolved" || normalizedStatus === "Closed";
}

export function shouldShowCustomPcField(ticketType) {
  const normalizedType = normalizeTicketType(ticketType);
  return normalizedType === "BuildAdvice" || normalizedType === "CompatibilityQuestion";
}

export function shouldShowOrderIdField(ticketType) {
  return normalizeTicketType(ticketType) === "OrderIssue";
}

export function shouldShowOrderItemIdField(ticketType) {
  return normalizeTicketType(ticketType) === "WarrantyRequest";
}

export function getTicketFormDefaults(overrides = {}) {
  return {
    fullName: "",
    phone: "",
    title: "",
    description: "",
    message: "",
    type: "TechnicalSupport",
    customPCId: "",
    orderId: "",
    orderItemId: "",
    ...overrides,
  };
}

export function buildTicketCreatePayload(
  values,
  { includeGuestInfo = false, attachmentUrls = [] } = {}
) {
  const normalizedType = normalizeTicketType(values?.type) || "TechnicalSupport";
  const customPCId = shouldShowCustomPcField(normalizedType)
    ? trimOrNull(values?.customPCId)
    : null;
  const orderId = shouldShowOrderIdField(normalizedType)
    ? trimOrNull(values?.orderId)
    : null;
  const orderItemId = shouldShowOrderItemIdField(normalizedType)
    ? parseNullableInteger(values?.orderItemId)
    : null;

  return {
    fullName: includeGuestInfo ? trimOrNull(values?.fullName) : null,
    phone: includeGuestInfo ? trimOrNull(values?.phone) : null,
    title: String(values?.title || "").trim(),
    description: String(values?.description || "").trim(),
    message: String(values?.message || "").trim(),
    type: toTicketTypeApiValue(normalizedType),
    customPCId,
    orderId,
    orderItemId,
    attachments: attachmentUrls,
  };
}

export function buildTicketReplyPayload(
  values,
  { includeGuestPhone = false, attachmentUrls = [] } = {}
) {
  return {
    content: String(values?.content || "").trim(),
    attachments: attachmentUrls,
    phone: includeGuestPhone ? trimOrNull(values?.phone) : null,
  };
}

export function appendTicketMessage(ticket, message) {
  if (!ticket) return ticket;

  const normalizedMessage = normalizeTicketMessage(message);
  const currentMessages = Array.isArray(ticket.messages) ? ticket.messages : [];
  if (currentMessages.some((item) => String(item.id) === String(normalizedMessage.id))) {
    return ticket;
  }

  return {
    ...ticket,
    updatedAt: normalizedMessage.sentAt || ticket.updatedAt,
    messages: [...currentMessages, normalizedMessage].sort((leftValue, rightValue) =>
      compareDatesAsc(leftValue.sentAt, rightValue.sentAt)
    ),
  };
}

export function buildTicketEntryPath({
  isAuthenticated,
  mode = "create",
  ticketId = null,
  type = null,
  customPCId = null,
  orderId = null,
  orderItemId = null,
}) {
  const pathname = isAuthenticated ? "/account" : "/support";
  const searchParams = new URLSearchParams();

  if (isAuthenticated) {
    searchParams.set("tab", "ticket");
  }

  if (mode) searchParams.set("mode", mode);
  if (ticketId) searchParams.set("ticketId", ticketId);
  if (type) searchParams.set("type", normalizeTicketType(type) || String(type));
  if (customPCId) searchParams.set("customPCId", customPCId);
  if (orderId) searchParams.set("orderId", orderId);
  if (orderItemId) searchParams.set("orderItemId", String(orderItemId));

  const search = searchParams.toString();
  return search ? `${pathname}?${search}` : pathname;
}

export function mergeTicketUpdate(currentTicket, nextTicket) {
  const normalizedNextTicket = normalizeTicket(nextTicket);

  if (!currentTicket) {
    return normalizedNextTicket;
  }

  return {
    ...currentTicket,
    ...normalizedNextTicket,
    messages:
      normalizedNextTicket.messages?.length > 0
        ? normalizedNextTicket.messages
        : currentTicket.messages || [],
  };
}

export const ticketTypeOptions = TICKET_TYPE_VALUES.map((value) => ({
  value,
  label: getTicketTypeLabel(value),
}));

export const ticketStatusOptions = TICKET_STATUS_VALUES.map((value) => ({
  value,
  label: getTicketStatusLabel(value),
}));

export const ticketPriorityOptions = TICKET_PRIORITY_VALUES.map((value) => ({
  value,
  label: getTicketPriorityLabel(value),
}));

export const ticketSortByOptions = TICKET_SORT_BY_VALUES.map((value) => ({
  value,
  label: getTicketSortByLabel(value),
}));

export const sortDirectionOptions = SORT_DIRECTION_VALUES.map((value) => ({
  value,
  label: getSortDirectionLabel(value),
}));
