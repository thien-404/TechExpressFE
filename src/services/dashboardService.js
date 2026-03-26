import instance, { apiService } from "../config/axios";

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

function buildDashboardParams(filters = {}, extraParams = {}) {
  return {
    brandId: filters.brandId || undefined,
    categoryId: filters.categoryId || undefined,
    fromDate: filters.fromDate || undefined,
    toDate: filters.toDate || undefined,
    ...extraParams,
  };
}

function extractFilename(contentDisposition) {
  if (!contentDisposition) return null;

  const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) {
    return decodeURIComponent(utf8Match[1]);
  }

  const basicMatch = contentDisposition.match(/filename="?([^"]+)"?/i);
  return basicMatch?.[1] || null;
}

async function readBlobErrorMessage(error, fallbackMessage) {
  const responseData = error?.response?.data;

  if (responseData instanceof Blob) {
    try {
      const text = await responseData.text();
      const parsed = JSON.parse(text);
      return parsed?.message || parsed?.value || fallbackMessage;
    } catch {
      return fallbackMessage;
    }
  }

  return (
    responseData?.message ||
    responseData?.value ||
    error?.message ||
    fallbackMessage
  );
}

export const dashboardService = {
  async getMonthlyRevenue(filters = {}) {
    const response = await apiService.get(
      "/Dashboard/monthly-revenue",
      buildDashboardParams(filters),
    );

    return normalizeEnvelope(response);
  },

  async downloadMonthlyRevenuePdf(filters = {}) {
    try {
      const response = await instance.get("/Dashboard/monthly-revenue", {
        params: buildDashboardParams(filters, { exportPdf: true }),
        responseType: "blob",
      });

      return {
        succeeded: true,
        statusCode: response.status,
        message: "",
        value: {
          blob: response.data,
          filename:
            extractFilename(response.headers?.["content-disposition"]) ||
            `monthly-revenue_${Date.now()}.pdf`,
        },
      };
    } catch (error) {
      return {
        succeeded: false,
        statusCode: error?.response?.status || 500,
        message: await readBlobErrorMessage(
          error,
          "Khong the xuat bao cao PDF luc nay.",
        ),
        value: null,
      };
    }
  },

  async getBestWorstSelling(filters = {}) {
    const response = await apiService.get(
      "/Dashboard/products/best-worst-selling",
      buildDashboardParams(filters, {
        top: filters.top || 5,
      }),
    );

    return normalizeEnvelope(response);
  },

  async getRevenueInsights(filters = {}) {
    const response = await apiService.get(
      "/Dashboard/ai/revenue-insights",
      buildDashboardParams(filters, {
        forecastMonths: filters.forecastMonths || 3,
        topProducts: filters.topProducts || 5,
      }),
    );

    return normalizeEnvelope(response);
  },
};

export default dashboardService;
