import {
  DeliveryType,
  EMAIL_REGEX,
  IDENTITY_REGEX,
  INSTALLMENT_OPTIONS,
  PHONE_REGEX,
} from "./constants";

export function formatPrice(value) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(value || 0);
}

export function normalizePhone(value) {
  return (value || "").replace(/\s+/g, "").trim();
}

export function getCombinedName(user) {
  return `${user?.firstName || ""} ${user?.lastName || ""}`.trim();
}

export function getCombinedAddress(user) {
  return [user?.address, user?.ward, user?.province]
    .map((part) => (part || "").trim())
    .filter(Boolean)
    .join(", ");
}

export function isCheckoutItemInvalid(item) {
  const outOfStatus = item?.productStatus && item.productStatus !== "Available";
  const outOfStock = item?.availableStock !== null && item?.availableStock <= 0;
  const overStock =
    item?.availableStock !== null && item?.quantity > item.availableStock;

  return outOfStatus || outOfStock || overStock;
}

export function buildPickupAddress(store) {
  if (!store) return "";
  return `${store.name} - ${store.address}`.trim();
}

export function buildCheckoutItemsSignature(items) {
  return JSON.stringify(
    (items || []).map((item) => ({
      key: item.key,
      productId: item.productId,
      quantity: item.quantity,
    })),
  );
}

export function mapCheckoutItemsToRequestItems(items) {
  return (items || []).map((item) => ({
    productId: item.productId,
    quantity: item.quantity,
  }));
}

export function buildPromotionGroups(promotionResult) {
  const promotionLines = promotionResult?.appliedPromotions || [];

  return promotionLines
    .map((line) => {
      const freeItems = Array.isArray(line?.freeItems) ? line.freeItems : [];
      if (freeItems.length === 0) {
        return null;
      }

      const mergedItems = freeItems.reduce((map, item) => {
        const productId = item?.productId;
        if (!productId) return map;

        const current = map.get(productId) || {
          productId,
          quantity: 0,
        };

        current.quantity += Math.max(Number(item?.quantity) || 0, 0);
        map.set(productId, current);
        return map;
      }, new Map());

      const uniqueItems = Array.from(mergedItems.values());
      const rawPickCount = Number(line?.freeItemPickCount);
      const requiredPickCount =
        Number.isFinite(rawPickCount) && rawPickCount > 0
          ? Math.min(rawPickCount, uniqueItems.length)
          : 0;

      return {
        promotionId: line?.promotionId,
        promotionName: line?.promotionName || "Khuyến mãi quà tặng",
        promotionCode: line?.promotionCode || "",
        items: uniqueItems,
        requiredPickCount,
        isSelectable: requiredPickCount > 0,
      };
    })
    .filter(Boolean);
}

export function validateCheckoutForm(form, { isInstallment }) {
  const errors = {};
  const normalizedPhone = normalizePhone(form.trackingPhone);
  const trimmedEmail = form.receiverEmail.trim();

  if (!form.receiverFullName.trim()) {
    errors.receiverFullName = "Vui lòng nhập họ tên người nhận.";
  }

  if (trimmedEmail && !EMAIL_REGEX.test(trimmedEmail)) {
    errors.receiverEmail = "Email không hợp lệ.";
  }

  if (!normalizedPhone) {
    errors.trackingPhone = "Vui lòng nhập số điện thoại.";
  } else if (!PHONE_REGEX.test(normalizedPhone)) {
    errors.trackingPhone = "Số điện thoại không hợp lệ.";
  }

  if (form.deliveryType === DeliveryType.Shipping && !form.shippingAddress.trim()) {
    errors.shippingAddress = "Vui lòng nhập địa chỉ giao hàng.";
  }

  if (form.deliveryType === DeliveryType.PickUp && !form.pickupStoreId) {
    errors.pickupStoreId = "Vui lòng chọn cửa hàng nhận hàng.";
  }

  if (isInstallment) {
    if (!form.receiverIdentityCard.trim()) {
      errors.receiverIdentityCard = "Vui lòng nhập CCCD/CMND.";
    } else if (!IDENTITY_REGEX.test(form.receiverIdentityCard.trim())) {
      errors.receiverIdentityCard = "CCCD/CMND phải gồm 9 hoặc 12 chữ số.";
    }

    if (!INSTALLMENT_OPTIONS.includes(Number(form.installmentDurationMonth))) {
      errors.installmentDurationMonth = "Vui lòng chọn kỳ hạn trả góp.";
    }
  }

  return errors;
}
