export const PROMOTION_TYPE_OPTIONS = [
  { value: "PercentageDiscount", label: "Gi\u1ea3m theo ph\u1ea7n tr\u0103m" },
  { value: "FixedDiscount", label: "Gi\u1ea3m s\u1ed1 ti\u1ec1n c\u1ed1 \u0111\u1ecbnh" },
  { value: "FreeItem", label: "T\u1eb7ng s\u1ea3n ph\u1ea9m" },
  { value: "FixedPrice", label: "\u0110\u1ed3ng gi\u00e1" },
];

export const PROMOTION_SCOPE_OPTIONS = [
  { value: "Order", label: "To\u00e0n \u0111\u01a1n h\u00e0ng" },
  { value: "Product", label: "S\u1ea3n ph\u1ea9m c\u1ee5 th\u1ec3" },
  { value: "Category", label: "Danh m\u1ee5c" },
  { value: "Brand", label: "Th\u01b0\u01a1ng hi\u1ec7u" },
];

export const PROMOTION_REQUIRED_LOGIC_OPTIONS = [
  { value: "And", label: "T\u1ea5t c\u1ea3 s\u1ea3n ph\u1ea9m \u0111i\u1ec1u ki\u1ec7n" },
  { value: "Or", label: "M\u1ed9t trong c\u00e1c s\u1ea3n ph\u1ea9m \u0111i\u1ec1u ki\u1ec7n" },
];

export const PROMOTION_SORT_OPTIONS = [
  { value: "CreatedAt", label: "Ng\u00e0y t\u1ea1o" },
  { value: "StartDate", label: "Ng\u00e0y b\u1eaft \u0111\u1ea7u" },
  { value: "EndDate", label: "Ng\u00e0y k\u1ebft th\u00fac" },
  { value: "Name", label: "T\u00ean khuy\u1ebfn m\u00e3i" },
  { value: "Code", label: "M\u00e3 khuy\u1ebfn m\u00e3i" },
];

const ADMIN_CACHE_KEY = "admin-promotion-cache";
const CUSTOMER_CACHE_KEY = "customer-promotion-cache";

export function getPromotionDisplayType(promotionOrType) {
  if (!promotionOrType) return "";
  if (typeof promotionOrType === "string") return promotionOrType;
  return promotionOrType.discountType || promotionOrType.type || "";
}

export function getPromotionTypeLabel(promotionOrType) {
  const type = getPromotionDisplayType(promotionOrType);
  return (
    PROMOTION_TYPE_OPTIONS.find((item) => item.value === type)?.label ||
    type ||
    "-"
  );
}

export function getPromotionScopeLabel(scope) {
  return (
    PROMOTION_SCOPE_OPTIONS.find((item) => item.value === scope)?.label ||
    scope ||
    "-"
  );
}

export function getRequiredProductLogicLabel(logic) {
  return (
    PROMOTION_REQUIRED_LOGIC_OPTIONS.find((item) => item.value === logic)
      ?.label ||
    logic ||
    "-"
  );
}

export function formatCurrency(value) {
  if (value === null || value === undefined || value === "") return "-";
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
}

export function formatDateTime(value) {
  if (!value) return "-";
  return new Date(value).toLocaleString("vi-VN");
}

export function formatPromotionValue(promotion) {
  const type = getPromotionDisplayType(promotion);
  if (type === "PercentageDiscount") {
    const discountValue = Number(promotion?.discountValue ?? 0);
    const maxDiscountValue = promotion?.maxDiscountValue;

    if (maxDiscountValue) {
      return `${discountValue}% - t\u1ed1i \u0111a ${formatCurrency(maxDiscountValue)}`;
    }

    return `${discountValue}%`;
  }

  if (type === "FreeItem") {
    return "T\u1eb7ng s\u1ea3n ph\u1ea9m";
  }

  return formatCurrency(promotion?.discountValue);
}

export function toDateTimeOffsetString(value, endOfDay = false) {
  if (!value) return undefined;
  return `${value}T${endOfDay ? "23:59:59" : "00:00:00"}`;
}

export function getPromotionStatus(promotion) {
  if (!promotion) {
    return {
      label: "Kh\u00f4ng x\u00e1c \u0111\u1ecbnh",
      className: "bg-slate-100 text-slate-700 border-slate-200",
    };
  }

  const now = new Date();
  const startDate = promotion.startDate ? new Date(promotion.startDate) : null;
  const endDate = promotion.endDate ? new Date(promotion.endDate) : null;
  const isExpired = promotion.isExpired ?? (endDate ? endDate < now : false);
  const isActive = promotion.isActive ?? promotion.status ?? false;

  if (isExpired) {
    return {
      label: "\u0110\u00e3 h\u1ebft h\u1ea1n",
      className: "bg-amber-100 text-amber-700 border-amber-200",
    };
  }

  if (isActive) {
    return {
      label: "\u0110ang ho\u1ea1t \u0111\u1ed9ng",
      className: "bg-emerald-100 text-emerald-700 border-emerald-200",
    };
  }

  if (startDate && startDate > now) {
    return {
      label: "S\u1eafp di\u1ec5n ra",
      className: "bg-sky-100 text-sky-700 border-sky-200",
    };
  }

  return {
    label: "\u0110\u00e3 t\u1eaft",
    className: "bg-rose-100 text-rose-700 border-rose-200",
  };
}

function readCache(cacheKey) {
  if (typeof window === "undefined") return {};

  try {
    return JSON.parse(sessionStorage.getItem(cacheKey) || "{}");
  } catch {
    return {};
  }
}

function writeCache(cacheKey, value) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(cacheKey, JSON.stringify(value));
}

function cacheSingle(cacheKey, promotion) {
  if (!promotion?.id) return;
  const current = readCache(cacheKey);
  current[promotion.id] = promotion;
  writeCache(cacheKey, current);
}

function cacheMany(cacheKey, promotions = []) {
  const current = readCache(cacheKey);
  promotions.forEach((promotion) => {
    if (promotion?.id) {
      current[promotion.id] = promotion;
    }
  });
  writeCache(cacheKey, current);
}

export function cachePromotion(promotion) {
  cacheSingle(ADMIN_CACHE_KEY, promotion);
}

export function cachePromotions(promotions = []) {
  cacheMany(ADMIN_CACHE_KEY, promotions);
}

export function getCachedPromotion(id) {
  if (!id) return null;
  return readCache(ADMIN_CACHE_KEY)[id] || null;
}

export function cacheCustomerPromotion(promotion) {
  cacheSingle(CUSTOMER_CACHE_KEY, promotion);
}

export function cacheCustomerPromotions(promotions = []) {
  cacheMany(CUSTOMER_CACHE_KEY, promotions);
}

export function getCachedCustomerPromotion(id) {
  if (!id) return null;
  return readCache(CUSTOMER_CACHE_KEY)[id] || null;
}
