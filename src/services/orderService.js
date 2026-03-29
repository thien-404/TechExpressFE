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

function toFiniteNumber(value, fallback = 0) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : fallback;
}

function hasFiniteNumber(value) {
  return value !== null && value !== undefined && Number.isFinite(Number(value));
}

function normalizeCollection(value) {
  return Array.isArray(value) ? value : [];
}

function normalizePromotion(promotion, index) {
  return {
    ...promotion,
    id: promotion?.id ?? promotion?.promotionId ?? `promotion-${index}`,
    code: promotion?.code ?? promotion?.promotionCode ?? "",
    name: promotion?.name ?? promotion?.promotionName ?? "",
    discountValue: hasFiniteNumber(promotion?.discountValue)
      ? toFiniteNumber(promotion.discountValue)
      : null,
    maxDiscountValue: hasFiniteNumber(promotion?.maxDiscountValue)
      ? toFiniteNumber(promotion.maxDiscountValue)
      : null,
  };
}

function normalizeInstallment(installment) {
  const amount = toFiniteNumber(installment?.amount ?? installment?.totalAmount);
  const dueDate =
    installment?.dueDate ??
    installment?.paymentDueDate ??
    installment?.dueAt ??
    installment?.dueOn ??
    null;

  return {
    ...installment,
    amount,
    totalAmount: amount,
    dueDate,
    paymentDueDate: installment?.paymentDueDate ?? dueDate,
    dueAt: installment?.dueAt ?? dueDate,
    dueOn: installment?.dueOn ?? dueDate,
  };
}

function normalizePayment(payment) {
  return {
    ...payment,
    amount: toFiniteNumber(payment?.amount),
  };
}

function normalizeOrderItem(item) {
  const quantity = toFiniteNumber(item?.quantity);
  const unitPrice = toFiniteNumber(item?.unitPrice);
  const discountPriceSource = item?.discountPrice ?? item?.product?.discountPrice;
  const discountValueSource = item?.discountValue ?? item?.product?.discountValue;
  const discountPrice = hasFiniteNumber(discountPriceSource)
    ? toFiniteNumber(discountPriceSource)
    : null;
  const discountValue = hasFiniteNumber(discountValueSource)
    ? toFiniteNumber(discountValueSource)
    : null;
  const originalLineTotal = quantity * unitPrice;
  const effectiveUnitPrice = discountPrice ?? unitPrice;
  const discountedLineTotal = quantity * effectiveUnitPrice;
  const productDiscountPrice = hasFiniteNumber(item?.product?.discountPrice)
    ? toFiniteNumber(item.product.discountPrice)
    : discountPrice;
  const productDiscountValue = hasFiniteNumber(item?.product?.discountValue)
    ? toFiniteNumber(item.product.discountValue)
    : discountValue;

  return {
    ...item,
    quantity,
    unitPrice,
    discountPrice,
    discountValue,
    totalPrice: hasFiniteNumber(item?.totalPrice)
      ? toFiniteNumber(item.totalPrice)
      : originalLineTotal,
    originalLineTotal,
    effectiveUnitPrice,
    discountedLineTotal,
    hasDiscount: discountPrice !== null || discountValue !== null,
    product: item?.product
      ? {
          ...item.product,
          firstImageUrl: item.product.firstImageUrl ?? item.product.imageUrl ?? "",
          discountPrice: productDiscountPrice,
          discountValue: productDiscountValue,
        }
      : item?.product,
  };
}

function normalizeOrderDetail(orderDetail) {
  if (!orderDetail || typeof orderDetail !== "object") {
    return orderDetail;
  }

  const items = normalizeCollection(orderDetail?.items).map(normalizeOrderItem);
  const originalSubTotal = toFiniteNumber(orderDetail?.subTotal);
  const computedDiscountAmount = items.reduce((total, item) => {
    return total + Math.max(0, item.originalLineTotal - item.discountedLineTotal);
  }, 0);
  const discountAmount = hasFiniteNumber(orderDetail?.subTotalDiscountValue)
    ? toFiniteNumber(orderDetail.subTotalDiscountValue)
    : computedDiscountAmount;
  const discountedSubTotal = hasFiniteNumber(orderDetail?.subTotalDiscount)
    ? toFiniteNumber(orderDetail.subTotalDiscount)
    : Math.max(0, originalSubTotal - discountAmount);

  return {
    ...orderDetail,
    subTotal: originalSubTotal,
    subTotalDiscount: discountedSubTotal,
    subTotalDiscountValue: discountAmount,
    originalSubTotal,
    discountedSubTotal,
    discountAmount,
    shippingCost: toFiniteNumber(orderDetail?.shippingCost),
    tax: toFiniteNumber(orderDetail?.tax),
    totalPrice: toFiniteNumber(orderDetail?.totalPrice),
    items,
    promotions: normalizeCollection(orderDetail?.promotions).map(normalizePromotion),
    installments: normalizeCollection(orderDetail?.installments).map(normalizeInstallment),
    payments: normalizeCollection(orderDetail?.payments).map(normalizePayment),
  };
}

function normalizeOrderDetailEnvelope(response) {
  const envelope = normalizeEnvelope(response);

  return {
    ...envelope,
    value: envelope.succeeded ? normalizeOrderDetail(envelope.value) : envelope.value,
  };
}

async function runOrderStatusAction(orderId, action) {
  const response = await apiService.get(`/Order/${orderId}/${action}`);
  return normalizeOrderDetailEnvelope(response);
}

async function runOrderStatusPutAction(orderId, action, payload = {}) {
  const response = await apiService.patch(`/Order/${orderId}/${action}`, payload);
  return normalizeOrderDetailEnvelope(response);
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
    return normalizeOrderDetailEnvelope(response);
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
