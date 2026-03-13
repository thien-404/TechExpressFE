export const PROMOTION_TYPE_OPTIONS = [
  { value: "PercentageDiscount", label: "Giảm theo phần trăm" },
  { value: "FixedDiscount", label: "Giảm số tiền cố định" },
  { value: "FreeItem", label: "Tặng sản phẩm" },
  { value: "FixedPrice", label: "Giá cố định" },
];

export const PROMOTION_SCOPE_OPTIONS = [
  { value: "Order", label: "Toàn đơn hàng" },
  { value: "Product", label: "Sản phẩm cụ thể" },
  { value: "Category", label: "Danh mục" },
  { value: "Brand", label: "Thương hiệu" },
];

export const PROMOTION_REQUIRED_LOGIC_OPTIONS = [
  { value: "And", label: "Tất cả sản phẩm điều kiện" },
  { value: "Or", label: "Một trong các sản phẩm điều kiện" },
];

export const PROMOTION_SORT_OPTIONS = [
  { value: "Code or Name", label: "Mã hoặc tên" },
  { value: "CreatedAt", label: "Ngày tạo" },
  { value: "StartDate", label: "Ngày bắt đầu" },
  { value: "EndDate", label: "Ngày kết thúc" },
];

const CACHE_KEY = "admin-promotion-cache";

export function getPromotionTypeLabel(type) {
  return PROMOTION_TYPE_OPTIONS.find((item) => item.value === type)?.label || type || "-";
}

export function getPromotionScopeLabel(scope) {
  return PROMOTION_SCOPE_OPTIONS.find((item) => item.value === scope)?.label || scope || "-";
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

export function toDateTimeOffsetString(value, endOfDay = false) {
  if (!value) return undefined;
  return `${value}T${endOfDay ? "23:59:59" : "00:00:00"}`;
}

export function getPromotionStatus(promotion) {
  if (!promotion) {
    return {
      label: "Không xác định",
      className: "bg-slate-100 text-slate-700 border-slate-200",
    };
  }

  if (promotion.isExpired) {
    return {
      label: "Đã hết hạn",
      className: "bg-amber-100 text-amber-700 border-amber-200",
    };
  }

  if (promotion.isActive) {
    return {
      label: "Đang hoạt động",
      className: "bg-emerald-100 text-emerald-700 border-emerald-200",
    };
  }

  const startDate = promotion.startDate ? new Date(promotion.startDate) : null;
  if (startDate && startDate > new Date()) {
    return {
      label: "Sắp diễn ra",
      className: "bg-sky-100 text-sky-700 border-sky-200",
    };
  }

  return {
    label: "Đã tắt",
    className: "bg-rose-100 text-rose-700 border-rose-200",
  };
}

function readCache() {
  if (typeof window === "undefined") return {};

  try {
    return JSON.parse(sessionStorage.getItem(CACHE_KEY) || "{}");
  } catch {
    return {};
  }
}

function writeCache(value) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(CACHE_KEY, JSON.stringify(value));
}

export function cachePromotion(promotion) {
  if (!promotion?.id) return;
  const current = readCache();
  current[promotion.id] = promotion;
  writeCache(current);
}

export function cachePromotions(promotions = []) {
  const current = readCache();
  promotions.forEach((promotion) => {
    if (promotion?.id) {
      current[promotion.id] = promotion;
    }
  });
  writeCache(current);
}

export function getCachedPromotion(id) {
  if (!id) return null;
  return readCache()[id] || null;
}
