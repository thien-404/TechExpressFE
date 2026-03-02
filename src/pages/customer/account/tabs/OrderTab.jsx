import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { orderService } from "../../../../services/orderService";

const moneyFormatter = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
});

const dateFormatter = new Intl.DateTimeFormat("vi-VN", {
  dateStyle: "medium",
  timeStyle: "short",
});

const STATUS_META = {
  pending: "bg-amber-50 text-amber-700 border border-amber-200",
  confirmed: "bg-indigo-50 text-indigo-700 border border-indigo-200",
  processing: "bg-blue-50 text-blue-700 border border-blue-200",
  shipping: "bg-sky-50 text-sky-700 border border-sky-200",
  shipped: "bg-sky-50 text-sky-700 border border-sky-200",
  delivered: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  readyforpickup: "bg-cyan-50 text-cyan-700 border border-cyan-200",
  pickedup: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  completed: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  installing: "bg-violet-50 text-violet-700 border border-violet-200",
  canceled: "bg-rose-50 text-rose-700 border border-rose-200",
  cancelled: "bg-rose-50 text-rose-700 border border-rose-200",
  refunded: "bg-slate-100 text-slate-700 border border-slate-200",
};

function normalizeStatus(status) {
  return String(status || "").trim().toLowerCase();
}

function getStatusText(status) {
  const key = normalizeStatus(status);
  if (key === "pending") return "Đang chờ";
  if (key === "confirmed") return "Đã xác nhận";
  if (key === "processing") return "Đang xử lý";
  if (key === "shipping" || key === "shipped") return "Đang giao";
  if (key === "delivered") return "Đã giao";
  if (key === "readyforpickup") return "Sẵn sàng nhận tại cửa hàng";
  if (key === "pickedup") return "Đã nhận tại cửa hàng";
  if (key === "completed") return "Hoàn tất";
  if (key === "installing") return "Đang lắp đặt";
  if (key === "canceled" || key === "cancelled") return "Đã hủy";
  if (key === "refunded") return "Đã hoàn tiền";
  return status || "Không xác định";
}

function getStatusClass(status) {
  return STATUS_META[normalizeStatus(status)] || "bg-slate-100 text-slate-700 border border-slate-200";
}

function formatMoney(value) {
  return moneyFormatter.format(Number(value || 0));
}

function formatOrderDate(value) {
  if (!value) return "--";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "--";
  return dateFormatter.format(parsed);
}

function shortenOrderId(id) {
  if (!id) return "--";
  return id.slice(0, 8).toUpperCase();
}

export default function OrderTab({ customerId, onViewDetail }) {
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState(null);
  const pageSize = 10;

  const queryParams = useMemo(
    () => ({
      Search: search ?? null,
      Status: null,
      SortBy: null,
      SortDirection: null,
      Page: page,
      PageSize: pageSize,
      CustomerId: customerId ?? null,
    }),
    [search, page, customerId]
  );

  const { data, isLoading, isFetching, isError, error, refetch } = useQuery({
    queryKey: ["account-orders", queryParams],
    queryFn: async () => {
      const response = await orderService.getOrders(queryParams);
      if (!response.succeeded) {
        throw new Error(response.message || "Không thể tải danh sách đơn hàng");
      }
      return response.value;
    },
    staleTime: 30_000,
    placeholderData: (prev) => prev,
  });

  const onSearchSubmit = (event) => {
    event.preventDefault();
    const keyword = searchInput.trim();
    setPage(1);
    setSearch(keyword || null);
  };

  const items = data?.items || [];

  return (
    <section className="flex-1 min-w-0 w-full rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Đơn mua</h2>
          <p className="mt-1 text-xs text-slate-500">Danh sách đơn hàng của bạn.</p>
        </div>
        <button
          type="button"
          onClick={() => refetch()}
          className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Làm mới
        </button>
      </div>

      <form onSubmit={onSearchSubmit} className="mt-4 flex flex-col gap-2 sm:flex-row">
        <input
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          placeholder="Tìm theo mã đơn, email, số điện thoại..."
          className="h-10 w-full min-w-0 flex-1 rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-[#0090D0]"
        />
        <button
          type="submit"
          className="h-10 w-full rounded-lg bg-[#0090D0] px-4 text-sm font-semibold text-white hover:bg-[#0077B0] sm:w-auto"
        >
          Tìm kiếm
        </button>
      </form>

      {isLoading && (
        <div className="mt-4 space-y-3">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      )}

      {isError && !isLoading && (
        <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-4">
          <p className="text-sm font-semibold text-rose-700">Tải đơn hàng thất bại</p>
          <p className="mt-1 text-xs text-rose-600">{error?.message || "Có lỗi xảy ra"}</p>
        </div>
      )}

      {!isLoading && !isError && items.length === 0 && (
        <div className="mt-4 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
          <p className="text-sm font-semibold text-slate-700">Chưa có đơn hàng nào</p>
        </div>
      )}

      {!isLoading && !isError && items.length > 0 && (
        <div className="mt-4 space-y-3">
          {items.map((order) => (
            <article key={order.id} className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[11px] uppercase tracking-wide text-slate-500">Mã đơn</p>
                  <p className="break-words text-sm font-semibold text-slate-900">#{shortenOrderId(order.id)}</p>
                  <p className="mt-1 text-xs text-slate-500">{formatOrderDate(order.orderDate)}</p>
                </div>
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${getStatusClass(
                    order.status
                  )}`}
                >
                  {getStatusText(order.status)}
                </span>
              </div>

              <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm text-slate-600">
                  Người nhận: <span className="font-medium text-slate-800">{order.receiverFullName || "--"}</span>
                </p>
                <p className="text-base font-semibold text-red-600">{formatMoney(order.totalPrice)}</p>
              </div>

              <button
                type="button"
                onClick={() => onViewDetail?.(order.id)}
                className="mt-3 h-9 w-full rounded-lg border border-slate-300 text-sm font-medium text-slate-700 hover:bg-slate-50 sm:w-auto sm:px-4"
              >
                Xem chi tiết
              </button>
            </article>
          ))}
        </div>
      )}

      {!isLoading && !isError && (
        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-slate-600">
            Trang {data?.pageNumber || 1}/{data?.totalPages || 1} - {data?.totalCount || 0} đơn
          </p>
          <div className="flex w-full gap-2 sm:w-auto">
            <button
              type="button"
              disabled={!data?.hasPreviousPage || isFetching}
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              className="h-9 flex-1 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none"
            >
              Trang trước
            </button>
            <button
              type="button"
              disabled={!data?.hasNextPage || isFetching}
              onClick={() => setPage((prev) => prev + 1)}
              className="h-9 flex-1 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none"
            >
              Trang sau
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

function SkeletonCard() {
  return (
    <div className="rounded-xl border border-slate-200 p-4 animate-pulse">
      <div className="h-4 w-24 rounded bg-slate-200" />
      <div className="mt-2 h-3 w-44 rounded bg-slate-200" />
      <div className="mt-3 h-3 w-32 rounded bg-slate-200" />
      <div className="mt-4 h-9 w-28 rounded bg-slate-200" />
    </div>
  );
}
