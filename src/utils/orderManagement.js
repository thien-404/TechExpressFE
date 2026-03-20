import { orderService } from "../services/orderService";

export const DELIVERY_TEXT = {
  Shipping: "Giao hàng",
  PickUp: "Nhận tại cửa hàng",
};

export const PAID_TEXT = {
  Full: "Thanh toán đủ",
  Installment: "Trả góp",
};

export const ORDER_STATUS_TEXT = {
  Pending: "Chờ xác nhận",
  Confirmed: "Đã xác nhận",
  Processing: "Đang xử lý",
  Shipping: "Đang giao hàng",
  Delivered: "Đã giao hàng",
  ReadyForPickup: "Sẵn sàng nhận tại cửa hàng",
  PickedUp: "Đã nhận tại cửa hàng",
  Completed: "Hoàn tất",
  Installing: "Đang lắp đặt",
  Canceled: "Đã hủy",
  Refunded: "Đã hoàn tiền",
  Expired: "Hết hạn",
};

export const STATUS_BADGE_CLASS = {
  Pending: "bg-amber-100 text-amber-700 border-amber-200",
  Confirmed: "bg-indigo-100 text-indigo-700 border-indigo-200",
  Processing: "bg-blue-100 text-blue-700 border-blue-200",
  Shipping: "bg-sky-100 text-sky-700 border-sky-200",
  Delivered: "bg-emerald-100 text-emerald-700 border-emerald-200",
  ReadyForPickup: "bg-cyan-100 text-cyan-700 border-cyan-200",
  PickedUp: "bg-emerald-100 text-emerald-700 border-emerald-200",
  Completed: "bg-green-100 text-green-700 border-green-200",
  Installing: "bg-violet-100 text-violet-700 border-violet-200",
  Canceled: "bg-rose-100 text-rose-700 border-rose-200",
  Refunded: "bg-slate-100 text-slate-700 border-slate-200",
  Expired: "bg-orange-100 text-orange-700 border-orange-200",
};

export const ORDER_STATUS_OPTIONS = [
  { value: "", label: "Tất cả trạng thái" },
  { value: "0", label: ORDER_STATUS_TEXT.Pending },
  { value: "1", label: ORDER_STATUS_TEXT.Confirmed },
  { value: "2", label: ORDER_STATUS_TEXT.Processing },
  { value: "3", label: ORDER_STATUS_TEXT.Shipping },
  { value: "4", label: ORDER_STATUS_TEXT.Delivered },
  { value: "5", label: ORDER_STATUS_TEXT.ReadyForPickup },
  { value: "6", label: ORDER_STATUS_TEXT.PickedUp },
  { value: "7", label: ORDER_STATUS_TEXT.Completed },
  { value: "8", label: ORDER_STATUS_TEXT.Installing },
  { value: "9", label: ORDER_STATUS_TEXT.Canceled },
  { value: "10", label: ORDER_STATUS_TEXT.Refunded },
  { value: "11", label: ORDER_STATUS_TEXT.Expired },
];

const TERMINAL_ORDER_STATUSES = new Set([
  "completed",
  "canceled",
  "cancelled",
  "refunded",
  "expired",
]);

const MANAGEMENT_ROLES = new Set(["admin", "staff"]);

const DELIVERY_TEXT_BY_KEY = Object.entries(DELIVERY_TEXT).reduce((acc, [key, value]) => {
  acc[normalizeKey(key)] = value;
  return acc;
}, {});

const PAID_TEXT_BY_KEY = Object.entries(PAID_TEXT).reduce((acc, [key, value]) => {
  acc[normalizeKey(key)] = value;
  return acc;
}, {});

const ORDER_STATUS_TEXT_BY_KEY = Object.entries(ORDER_STATUS_TEXT).reduce((acc, [key, value]) => {
  acc[normalizeKey(key)] = value;
  return acc;
}, {});

const STATUS_BADGE_CLASS_BY_KEY = Object.entries(STATUS_BADGE_CLASS).reduce((acc, [key, value]) => {
  acc[normalizeKey(key)] = value;
  return acc;
}, {});

const ORDER_STATUS_ACTIONS = {
  process: {
    key: "process",
    label: "Chuyển sang Đang xử lý",
    nextStatus: "Processing",
    allowedRoles: ["Admin", "Staff"],
    run: (orderId) => orderService.processOrder(orderId),
  },
  deliver: {
    key: "deliver",
    label: "Bắt đầu giao hàng",
    nextStatus: "Shipping",
    allowedRoles: ["Staff"],
    requiresPayload: true,
    run: (orderId, payload) => orderService.deliverOrder(orderId, payload),
  },
  readyForPickup: {
    key: "ready-for-pickup",
    label: "Chuyển sang Sẵn sàng nhận",
    nextStatus: "ReadyForPickup",
    allowedRoles: ["Admin", "Staff"],
    run: (orderId) => orderService.markOrderReadyForPickup(orderId),
  },
  pickedUp: {
    key: "picked-up",
    label: "Xác nhận đã nhận tại cửa hàng",
    nextStatus: "PickedUp",
    allowedRoles: ["Admin", "Staff"],
    run: (orderId) => orderService.markOrderPickedUp(orderId),
  },
  delivered: {
    key: "delivered",
    label: "Xác nhận đã giao hàng",
    nextStatus: "Delivered",
    allowedRoles: ["Staff"],
    run: (orderId) => orderService.markOrderDelivered(orderId),
  },
  completed: {
    key: "completed",
    label: "Hoàn tất đơn hàng",
    nextStatus: "Completed",
    run: (orderId) => orderService.completeOrder(orderId),
  },
};

export function normalizeKey(value) {
  return String(value || "").trim().toLowerCase();
}

export function normalizeViewer(viewerOrRole) {
  if (typeof viewerOrRole === "string") {
    return {
      role: viewerOrRole,
      userId: null,
    };
  }

  return {
    role: viewerOrRole?.role || "",
    userId: viewerOrRole?.userId || viewerOrRole?.id || null,
  };
}

export function formatPrice(value) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(Number(value || 0));
}

export function formatDate(value) {
  if (!value) return "--";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "--";

  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(parsed);
}

export function parsePaymentMethod(notes) {
  if (!notes) return "--";

  const matched = String(notes).match(/\[PaymentMethod:(.+?)\]/i);
  if (!matched?.[1]) return "--";

  const method = matched[1].toUpperCase();
  if (method === "QR") return "QR";
  if (method === "COD") return "COD";
  if (method === "INSTALLMENT") return "Trả góp";
  return method;
}

export function plainNotes(notes) {
  if (!notes) return "";
  return String(notes).replace(/\[PaymentMethod:.+?\]/gi, "").trim();
}

export function getStatusText(status) {
  return ORDER_STATUS_TEXT_BY_KEY[normalizeKey(status)] || status || "--";
}

export function getStatusBadgeClass(status) {
  return (
    STATUS_BADGE_CLASS_BY_KEY[normalizeKey(status)] ||
    "bg-slate-100 text-slate-700 border-slate-200"
  );
}

export function getDeliveryText(deliveryType) {
  return DELIVERY_TEXT_BY_KEY[normalizeKey(deliveryType)] || deliveryType || "--";
}

export function getPaidText(paidType) {
  return PAID_TEXT_BY_KEY[normalizeKey(paidType)] || paidType || "--";
}

function isManagementRole(role) {
  return MANAGEMENT_ROLES.has(normalizeKey(role));
}

function isViewerOwner(order, viewer) {
  const orderUserId = String(order?.userId || "").trim().toLowerCase();
  const viewerUserId = String(viewer?.userId || "").trim().toLowerCase();

  return Boolean(orderUserId) && Boolean(viewerUserId) && orderUserId === viewerUserId;
}

function hasMemberOwner(order) {
  return order?.userId != null;
}

function hasAllowedRole(action, role) {
  return action.allowedRoles?.some((allowedRole) => normalizeKey(allowedRole) === normalizeKey(role));
}

function buildActionState(action, viewerOrRole) {
  const viewer = normalizeViewer(viewerOrRole);

  if (hasAllowedRole(action, viewer.role)) {
    return {
      type: "action",
      tone: "info",
      nextStatus: action.nextStatus,
      hint: `Chỉ được chuyển tuần tự sang ${getStatusText(action.nextStatus)}.`,
      action,
    };
  }

  const roleLabel = viewer.role ? normalizeKey(viewer.role) : "hiện tại";

  return {
    type: "blocked",
    tone: "warning",
    nextStatus: action.nextStatus,
    hint: `Tài khoản ${roleLabel} không có quyền chuyển sang ${getStatusText(action.nextStatus)}.`,
  };
}

function getCompletedBlockedHint(order, viewer) {
  const deliveryType = normalizeKey(order?.deliveryType);
  const viewerIsManagement = isManagementRole(viewer.role);
  const memberOrder = hasMemberOwner(order);

  if (deliveryType === "shipping") {
    if (memberOrder) {
      return viewerIsManagement
        ? "Đơn giao hàng của khách thành viên chỉ chính khách hàng đó mới có thể hoàn tất."
        : "Bạn chỉ có thể hoàn tất đơn giao hàng của chính mình.";
    }

    return "Đơn hàng khách vãng lai chỉ quản trị viên hoặc nhân viên mới có thể hoàn tất.";
  }

  if (memberOrder) {
    return viewerIsManagement
      ? "Không thể hoàn tất đơn hàng này với tài khoản hiện tại."
      : "Bạn chỉ có thể hoàn tất đơn nhận tại cửa hàng của chính mình.";
  }

  return "Đơn hàng khách vãng lai chỉ quản trị viên hoặc nhân viên mới có thể hoàn tất.";
}

export function canViewerCompleteOrder(order, viewerOrRole) {
  const viewer = normalizeViewer(viewerOrRole);
  const status = normalizeKey(order?.status);
  const deliveryType = normalizeKey(order?.deliveryType);
  const viewerIsManagement = isManagementRole(viewer.role);
  const memberOrder = hasMemberOwner(order);

  if (status !== "delivered" && status !== "pickedup") {
    return false;
  }

  if (deliveryType === "shipping") {
    if (memberOrder) {
      return isViewerOwner(order, viewer);
    }

    return viewerIsManagement;
  }

  if (memberOrder) {
    return viewerIsManagement || isViewerOwner(order, viewer);
  }

  return viewerIsManagement;
}

function buildCompletedTransitionState(order, viewerOrRole) {
  const viewer = normalizeViewer(viewerOrRole);

  if (canViewerCompleteOrder(order, viewer)) {
    return {
      type: "action",
      tone: "info",
      nextStatus: ORDER_STATUS_ACTIONS.completed.nextStatus,
      hint: `Chỉ được chuyển tuần tự sang ${getStatusText(ORDER_STATUS_ACTIONS.completed.nextStatus)}.`,
      action: ORDER_STATUS_ACTIONS.completed,
    };
  }

  return {
    type: "blocked",
    tone: "warning",
    nextStatus: ORDER_STATUS_ACTIONS.completed.nextStatus,
    hint: getCompletedBlockedHint(order, viewer),
  };
}

function getBaseOrderFlow(deliveryType) {
  if (normalizeKey(deliveryType) === "pickup") {
    return ["Pending", "Confirmed", "Processing", "ReadyForPickup", "PickedUp", "Completed"];
  }

  return ["Pending", "Confirmed", "Processing", "Shipping", "Delivered", "Completed"];
}

export function getOrderFlow(order) {
  const baseFlow = getBaseOrderFlow(order?.deliveryType);
  const currentStatus = order?.status;
  const currentStatusKey = normalizeKey(currentStatus);

  if (!currentStatus) return baseFlow;

  if (currentStatusKey === "installing") {
    return [...baseFlow.slice(0, -1), "Installing", "Completed"];
  }

  if (["canceled", "refunded", "expired"].includes(currentStatusKey)) {
    return [...baseFlow.slice(0, -1), currentStatus];
  }

  if (!baseFlow.some((step) => normalizeKey(step) === currentStatusKey)) {
    return [...baseFlow, currentStatus];
  }

  return baseFlow;
}

export function getOrderTransitionState(order, viewerOrRole) {
  const viewer = normalizeViewer(viewerOrRole);
  const status = normalizeKey(order?.status);
  const deliveryType = normalizeKey(order?.deliveryType);

  if (!status) {
    return {
      type: "info",
      tone: "muted",
      nextStatus: null,
      hint: "Không xác định được trạng thái hiện tại.",
    };
  }

  if (TERMINAL_ORDER_STATUSES.has(status)) {
    return {
      type: "terminal",
      tone: "muted",
      nextStatus: null,
      hint: "Đơn hàng đã kết thúc, không thể cập nhật thêm.",
    };
  }

  if (status === "pending") {
    return {
      type: "blocked",
      tone: "warning",
      nextStatus: "Confirmed",
      hint: "Chưa có API chuyển từ Chờ xác nhận sang Đã xác nhận.",
    };
  }

  if (status === "confirmed") {
    return buildActionState(ORDER_STATUS_ACTIONS.process, viewer);
  }

  if (status === "processing") {
    if (deliveryType === "pickup") {
      return buildActionState(ORDER_STATUS_ACTIONS.readyForPickup, viewer);
    }

    return buildActionState(ORDER_STATUS_ACTIONS.deliver, viewer);
  }

  if (status === "shipping") {
    if (normalizeKey(viewer.role) === "staff") {
      return buildActionState(ORDER_STATUS_ACTIONS.delivered, viewer);
    }

    return {
      type: "blocked",
      tone: "warning",
      nextStatus: "Delivered",
      hint: "Chỉ staff có quyền xác nhận đã giao hàng.",
    };
  }

  if (status === "readyforpickup") {
    return buildActionState(ORDER_STATUS_ACTIONS.pickedUp, viewer);
  }

  if (status === "delivered" || status === "pickedup") {
    return buildCompletedTransitionState(order, viewer);
  }

  if (status === "installing") {
    return {
      type: "blocked",
      tone: "warning",
      nextStatus: "Completed",
      hint: "Chưa có endpoint chuyển từ Đang lắp đặt sang Hoàn tất.",
    };
  }

  return {
    type: "info",
    tone: "muted",
    nextStatus: null,
    hint: "Trạng thái này chưa có API chuyển bước phù hợp.",
  };
}
