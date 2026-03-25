export function formatDashboardCurrency(value) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
}

export function formatDashboardNumber(value) {
  return new Intl.NumberFormat("vi-VN", {
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
}

export function formatDashboardPercentage(value) {
  return new Intl.NumberFormat("vi-VN", {
    style: "percent",
    maximumFractionDigits: 1,
  }).format(Number(value) || 0);
}

export function formatDashboardCurrencyShort(value) {
  const numericValue = Number(value) || 0;
  const absoluteValue = Math.abs(numericValue);

  if (absoluteValue >= 1_000_000_000) {
    return `${(numericValue / 1_000_000_000).toFixed(
      absoluteValue >= 10_000_000_000 ? 0 : 1,
    )}B`;
  }

  if (absoluteValue >= 1_000_000) {
    return `${(numericValue / 1_000_000).toFixed(
      absoluteValue >= 10_000_000 ? 0 : 1,
    )}M`;
  }

  if (absoluteValue >= 1_000) {
    return `${(numericValue / 1_000).toFixed(absoluteValue >= 10_000 ? 0 : 1)}K`;
  }

  return formatDashboardNumber(numericValue);
}

export function formatDashboardMonthLabel(value, options = {}) {
  if (!value) return "-";

  const [year, month] = String(value)
    .split("-")
    .map((item) => Number(item));

  if (!year || !month) return value;

  const date = new Date(year, month - 1, 1);
  const formatter = new Intl.DateTimeFormat("vi-VN", {
    month: options.short ? "2-digit" : "long",
    year: "numeric",
  });

  return formatter.format(date);
}

function formatDateInput(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function getDefaultDashboardFilters() {
  const today = new Date();
  const startDate = new Date(today.getFullYear(), today.getMonth() - 11, 1);

  return {
    brandId: "",
    categoryId: "",
    fromDate: formatDateInput(startDate),
    toDate: formatDateInput(today),
  };
}

export function toDashboardDateTimeOffsetString(value, endOfDay = false) {
  if (!value) return undefined;
  return `${value}T${endOfDay ? "23:59:59" : "00:00:00"}`;
}

export function buildDashboardRevenueMetrics(items = []) {
  let totalRevenue = 0;
  let monthsWithSales = 0;
  let highestMonth = null;

  items.forEach((item) => {
    const revenue = Number(item?.revenue) || 0;

    totalRevenue += revenue;

    if (revenue > 0) {
      monthsWithSales += 1;
    }

    if (!highestMonth || revenue > highestMonth.revenue) {
      highestMonth = {
        month: item?.month || "",
        revenue,
      };
    }
  });

  return {
    totalRevenue,
    averageRevenue: items.length > 0 ? totalRevenue / items.length : 0,
    highestMonth: highestMonth || { month: "", revenue: 0 },
    monthsWithSales,
  };
}
