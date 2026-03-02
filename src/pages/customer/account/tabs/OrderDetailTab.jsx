import { useMemo } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { orderService } from "../../../../services/orderService";

const ONLINE_PAYMENT_METHOD = 1;

const moneyFormatter = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
});

const dateFormatter = new Intl.DateTimeFormat("vi-VN", {
  dateStyle: "medium",
  timeStyle: "short",
});

const DELIVERY_TEXT = {
  Shipping: "Giao hàng",
  PickUp: "Nhận tại cửa hàng",
};

const PAID_TEXT = {
  Full: "Thanh toán 100%",
  Installment: "Trả góp",
};

const ORDER_STATUS_TEXT = {
  Pending: "Đang chờ",
  Confirmed: "Đã xác nhận",
  Processing: "Đang xử lý",
  Shipping: "Đang giao",
  Delivered: "Đã giao",
  ReadyForPickup: "Sẵn sàng nhận tại cửa hàng",
  PickedUp: "Đã nhận tại cửa hàng",
  Completed: "Hoàn tất",
  Installing: "Đang lắp đặt",
  Canceled: "Đã hủy",
  Refunded: "Đã hoàn tiền",
};

const TERMINAL_ORDER_STATUSES = new Set(["canceled", "cancelled", "refunded"]);
const PAID_PAYMENT_STATUSES = new Set(["success", "succeeded", "paid", "completed"]);
const INSTALLMENT_PAID_STATUSES = new Set(["paid", "completed", "success", "succeeded"]);

function formatMoney(value) {
  return moneyFormatter.format(Number(value || 0));
}

function formatDate(value) {
  if (!value) return "--";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "--";
  return dateFormatter.format(parsed);
}

function normalizeKey(value) {
  return String(value || "").trim().toLowerCase();
}

function getOrderStatusText(value) {
  return ORDER_STATUS_TEXT[value] || value || "--";
}

function getPaymentMethodFromNotes(notes) {
  if (!notes) return "--";
  const matched = String(notes).match(/\[PaymentMethod:(.+?)\]/i);
  if (!matched?.[1]) return "--";
  const method = matched[1].toUpperCase();
  if (method === "QR") return "QR";
  if (method === "COD") return "COD";
  if (method === "INSTALLMENT") return "Trả góp";
  return method;
}

function getPlainNotes(notes) {
  if (!notes) return "";
  return String(notes).replace(/\[PaymentMethod:.+?\]/gi, "").trim();
}

function hasSuccessfulPayment(payments = []) {
  return payments.some((payment) => PAID_PAYMENT_STATUSES.has(normalizeKey(payment?.status)));
}

function isInstallmentPaid(installment) {
  const status = normalizeKey(installment?.status);
  if (INSTALLMENT_PAID_STATUSES.has(status)) return true;
  if (Number(installment?.remainingAmount) === 0 && installment?.remainingAmount != null) return true;
  return false;
}

function isInstallmentInPaymentWindow(installment) {
  if (!installment || isInstallmentPaid(installment)) return false;

  const now = Date.now();
  const dueRaw =
    installment?.dueDate ??
    installment?.paymentDueDate ??
    installment?.dueAt ??
    installment?.dueOn ??
    null;

  if (!dueRaw) return true;

  const due = new Date(dueRaw).getTime();
  if (Number.isNaN(due)) return true;

  return now <= due;
}

function canShowPayButton(orderDetail) {
  if (!orderDetail) return false;

  const orderStatus = normalizeKey(orderDetail.status);
  const orderClosed = TERMINAL_ORDER_STATUSES.has(orderStatus);

  const successPaid = hasSuccessfulPayment(orderDetail.payments || []);
  const payableByOrder = !orderClosed && !successPaid;

  const installments = orderDetail.installments || [];
  const payableInstallment = installments.some(isInstallmentInPaymentWindow);

  return payableByOrder || payableInstallment;
}

export default function OrderDetailTab({ orderId, onBack }) {
  const {
    data: order,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    enabled: !!orderId,
    queryKey: ["account-order-detail", orderId],
    queryFn: async () => {
      const response = await orderService.getOrderDetail(orderId);
      if (!response.succeeded) {
        throw new Error(response.message || "Không thể tải chi tiết đơn hàng");
      }
      return response.value;
    },
  });

  const showPayButton = useMemo(() => canShowPayButton(order), [order]);
  const notesText = useMemo(() => getPlainNotes(order?.notes), [order?.notes]);

  const payMutation = useMutation({
    mutationFn: async () => {
      if (!order?.id) {
        throw new Error("Không tìm thấy mã đơn để thanh toán");
      }
      const returnUrl = `${window.location.origin}/account`;
      const response = await orderService.initOnlinePayment(order.id, {
        method: ONLINE_PAYMENT_METHOD,
        returnUrl,
      });

      if (!response.succeeded) {
        throw new Error(response.message || "Không thể khởi tạo thanh toán online");
      }

      const redirectUrl = response.value?.redirectUrl;
      if (!redirectUrl) {
        throw new Error("Không nhận được link thanh toán");
      }

      return redirectUrl;
    },
    onSuccess: (redirectUrl) => {
      window.location.assign(redirectUrl);
    },
    onError: (err) => {
      toast.error(err?.message || "Khởi tạo thanh toán thất bại");
    },
  });

  return (
    <section className="flex-1 min-w-0 w-full rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <button
          type="button"
          onClick={onBack}
          className="h-9 rounded-lg border border-slate-300 px-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Quay lại danh sách
        </button>
        {showPayButton && (
          <button
            type="button"
            onClick={() => payMutation.mutate()}
            disabled={payMutation.isPending}
            className="h-9 rounded-lg bg-[#0090D0] px-4 text-sm font-semibold text-white hover:bg-[#0077B0] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {payMutation.isPending ? "Đang khởi tạo..." : "Thanh toán ngay"}
          </button>
        )}
      </div>

      {isLoading && (
        <div className="mt-4 space-y-3">
          <SkeletonRow />
          <SkeletonRow />
          <SkeletonRow />
        </div>
      )}

      {isError && !isLoading && (
        <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-4">
          <p className="text-sm font-semibold text-rose-700">Tải chi tiết đơn hàng thất bại</p>
          <p className="mt-1 text-xs text-rose-600">{error?.message || "Có lỗi xảy ra"}</p>
          <button
            type="button"
            onClick={() => refetch()}
            className="mt-3 h-9 rounded-lg border border-rose-300 px-3 text-sm font-medium text-rose-700 hover:bg-rose-100"
          >
            Thử lại
          </button>
        </div>
      )}

      {!isLoading && !isError && order && (
        <>
          <h2 className="mt-4 text-base font-semibold text-slate-900 md:text-lg">Chi tiết đơn hàng</h2>

          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
            <InfoLine label="Mã đơn" value={order.id || "--"} />
            <InfoLine label="Ngày đặt" value={formatDate(order.orderDate)} />
            <InfoLine label="Trạng thái" value={getOrderStatusText(order.status)} />
            <InfoLine label="Người nhận" value={order.receiverFullName || "--"} />
            <InfoLine label="Email" value={order.receiverEmail || "--"} />
            <InfoLine label="Điện thoại" value={order.trackingPhone || "--"} />
            <InfoLine label="Giao nhận" value={DELIVERY_TEXT[order.deliveryType] || order.deliveryType || "--"} />
            <InfoLine label="Thanh toán" value={PAID_TEXT[order.paidType] || order.paidType || "--"} />
            <InfoLine label="Phương thức" value={getPaymentMethodFromNotes(order.notes)} />
          </div>

          <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-[11px] text-slate-500">Địa chỉ giao hàng</p>
            <p className="mt-1 break-words text-sm text-slate-700">{order.shippingAddress || "--"}</p>
          </div>

          {notesText && (
            <div className="mt-3 rounded-xl border border-slate-200 p-3">
              <p className="text-[11px] text-slate-500">Ghi chú</p>
              <p className="mt-1 break-words text-sm text-slate-700">{notesText}</p>
            </div>
          )}

          <div className="mt-3 rounded-xl border border-slate-200 p-3">
            <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
              <PriceRow label="Tạm tính" value={order.subTotal} />
              <PriceRow label="Phí ship" value={order.shippingCost} />
              <PriceRow label="Thuế" value={order.tax} />
              <PriceRow label="Tổng tiền" value={order.totalPrice} highlight />
            </div>
          </div>

          <section className="mt-4">
            <h3 className="text-sm font-semibold text-slate-900">Sản phẩm</h3>
            <div className="mt-2 space-y-2">
              {(order.items || []).map((item) => (
                <article key={item.id} className="rounded-xl border border-slate-200 p-3">
                  <div className="flex gap-3">
                    <img
                      src={item?.product?.firstImageUrl || "https://placehold.co/80x80?text=No+Image"}
                      alt={item?.product?.name || "Product"}
                      className="h-16 w-16 shrink-0 rounded border border-slate-200 object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 text-sm font-medium text-slate-900">
                        {item?.product?.name || "Sản phẩm"}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500">SKU: {item?.product?.sku || "--"}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
                        <span>SL: {item.quantity || 0}</span>
                        <span>Đơn giá: {formatMoney(item.unitPrice)}</span>
                        <span className="font-semibold text-slate-800">Thành tiền: {formatMoney(item.totalPrice)}</span>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>

          {(order.payments || []).length > 0 && (
            <section className="mt-4">
              <h3 className="text-sm font-semibold text-slate-900">Lịch sử thanh toán</h3>
              <div className="mt-2 space-y-2">
                {order.payments.map((payment) => (
                  <div key={payment.id} className="rounded-xl border border-slate-200 p-3 text-sm">
                    <p className="text-slate-700">
                      {formatMoney(payment.amount)} - {payment.method || "--"}
                    </p>
                    <p className="text-xs text-slate-500">
                      Trạng thái: {payment.status || "--"} • {formatDate(payment.paymentDate)}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {(order.installments || []).length > 0 && (
            <section className="mt-4">
              <h3 className="text-sm font-semibold text-slate-900">Lịch trả góp</h3>
              <div className="mt-2 space-y-2">
                {order.installments.map((installment, index) => (
                  <div key={installment.id || index} className="rounded-xl border border-slate-200 p-3 text-sm">
                    <p className="text-slate-700">
                      Kỳ {index + 1}: {formatMoney(installment.amount || installment.totalAmount)}
                    </p>
                    <p className="text-xs text-slate-500">
                      Trạng thái: {installment.status || "--"} • Hạn thanh toán:{" "}
                      {formatDate(
                        installment.dueDate ||
                          installment.paymentDueDate ||
                          installment.dueAt ||
                          installment.dueOn
                      )}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </section>
  );
}

function InfoLine({ label, value }) {
  return (
    <div className="rounded-lg border border-slate-200 p-2.5">
      <p className="text-[11px] text-slate-500">{label}</p>
      <p className="mt-0.5 break-words text-sm text-slate-800">{value}</p>
    </div>
  );
}

function PriceRow({ label, value, highlight = false }) {
  return (
    <div>
      <p className="text-[11px] text-slate-500">{label}</p>
      <p className={`text-sm font-semibold ${highlight ? "text-red-600" : "text-slate-800"}`}>
        {formatMoney(value)}
      </p>
    </div>
  );
}

function SkeletonRow() {
  return (
    <div className="rounded-lg border border-slate-200 p-3 animate-pulse">
      <div className="h-3 w-32 rounded bg-slate-200" />
      <div className="mt-2 h-3 w-48 rounded bg-slate-200" />
    </div>
  );
}
