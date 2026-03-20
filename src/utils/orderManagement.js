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
    allowedRoles: ["Admin"],
    run: (orderId) => orderService.completeOrder(orderId),
  },
};

export function normalizeKey(value) {
  return String(value || "").trim().toLowerCase();
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

function buildActionState(action, role) {
  if (action.allowedRoles.includes(role)) {
    return {
      type: "action",
      tone: "info",
      nextStatus: action.nextStatus,
      hint: `Chỉ được chuyển tuần tự sang ${getStatusText(action.nextStatus)}.`,
      action,
    };
  }

  return {
    type: "blocked",
    tone: "warning",
    nextStatus: action.nextStatus,
    hint: `Tài khoản ${role.toLowerCase()} không có quyền chuyển sang ${getStatusText(action.nextStatus)}.`,
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

export function getOrderTransitionState(order, role) {
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
    return buildActionState(ORDER_STATUS_ACTIONS.process, role);
  }

  if (status === "processing") {
    if (deliveryType === "pickup") {
      return buildActionState(ORDER_STATUS_ACTIONS.readyForPickup, role);
    }

    return buildActionState(ORDER_STATUS_ACTIONS.deliver, role);
  }

  if (status === "shipping") {
    if (role === "Staff") {
      return buildActionState(ORDER_STATUS_ACTIONS.delivered, role);
    }

    return {
      type: "blocked",
      tone: "warning",
      nextStatus: "Delivered",
      hint: "Chỉ staff có quyền xác nhận đã giao hàng.",
    };
  }

  if (status === "readyforpickup") {
    return buildActionState(ORDER_STATUS_ACTIONS.pickedUp, role);
  }

  if (status === "delivered" || status === "pickedup") {
    return buildActionState(ORDER_STATUS_ACTIONS.completed, role);
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
