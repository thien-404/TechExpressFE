import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { orderService } from "../../../../services/orderService";
import { useAuth } from "../../../../store/authContext.jsx";
import { canViewerCompleteOrder } from "../../../../utils/orderManagement";
import {
  buildCheckoutPaymentUrls,
  storePendingPaymentSessionId,
} from "../../../../utils/paymentGateway";
import { buildTicketEntryPath } from "../../../../utils/ticket";

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
  const key = normalizeKey(value);
  if (key === "pending") return "Đang chờ";
  if (key === "confirmed") return "Đã xác nhận";
  if (key === "processing") return "Đang xử lý";
  if (key === "shipping") return "Đang giao";
  if (key === "delivered") return "Đã giao";
  if (key === "readyforpickup") return "Sẵn sàng nhận tại cửa hàng";
  if (key === "pickedup") return "Đã nhận tại cửa hàng";
  if (key === "completed") return "Hoàn tất";
  if (key === "installing") return "Đang lắp đặt";
  if (key === "canceled" || key === "cancelled") return "Đã hủy";
  if (key === "refunded") return "Đã hoàn tiền";
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

function getPayableInstallmentId(orderDetail) {
  if (!orderDetail) return null;
  const installments = orderDetail.installments || [];
  const payableInstallment = installments.find(isInstallmentInPaymentWindow);
  return payableInstallment?.id || null;
}

function hasOrderDiscount(orderDetail) {
  return Number(orderDetail?.discountAmount ?? orderDetail?.subTotalDiscountValue ?? 0) > 0;
}

function getPromotionBenefitText(promotion) {
  const type = normalizeKey(promotion?.type);
  const discountValue = Number(promotion?.discountValue);
  const maxDiscountValue = Number(promotion?.maxDiscountValue);

  if (type.includes("percentage") && Number.isFinite(discountValue) && discountValue > 0) {
    const maxText =
      Number.isFinite(maxDiscountValue) && maxDiscountValue > 0
        ? ` • tối đa ${formatMoney(maxDiscountValue)}`
        : "";
    return `Giảm ${discountValue}%${maxText}`;
  }

  if (type.includes("fixed") && Number.isFinite(discountValue) && discountValue > 0) {
    return `Giảm ${formatMoney(discountValue)}`;
  }

  if (Array.isArray(promotion?.freeProducts) && promotion.freeProducts.length > 0) {
    return "Khuyến mãi quà tặng";
  }

  return promotion?.code || promotion?.type || "Khuyến mãi áp dụng";
}

export default function OrderDetailTab({ orderId, onBack }) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { user } = useAuth();

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
  const canCompleteOrder = useMemo(
    () =>
      canViewerCompleteOrder(order, {
        role: user?.role,
        userId: user?.id,
      }),
    [order, user?.id, user?.role]
  );
  const notesText = useMemo(() => getPlainNotes(order?.notes), [order?.notes]);
  const orderHasDiscount = useMemo(() => hasOrderDiscount(order), [order]);

  const payMutation = useMutation({
    mutationFn: async () => {
      if (!order?.id) {
        throw new Error("Không tìm thấy mã đơn để thanh toán");
      }

      const payableInstallmentId = getPayableInstallmentId(order);
      const isInstallmentOrder =
        normalizeKey(order?.paidType) === "installment" || (order?.installments || []).length > 0;
      const { returnUrl, cancelUrl } = buildCheckoutPaymentUrls(
        window.location.origin
      );
      let response;

      if (payableInstallmentId) {
        response = await orderService.initInstallmentOnlinePayment(payableInstallmentId, {
          method: ONLINE_PAYMENT_METHOD,
          returnUrl,
          cancelUrl,
        });
      } else if (isInstallmentOrder) {
        throw new Error("Không tìm thấy kỳ trả góp nào đang trong thời hạn thanh toán");
      } else {
        response = await orderService.initOnlinePayment(order.id, {
          method: ONLINE_PAYMENT_METHOD,
          returnUrl,
          cancelUrl,
        });
      }

      if (!response.succeeded) {
        throw new Error(response.message || "Không thể khởi tạo thanh toán online");
      }

      const redirectUrl = response.value?.redirectUrl;
      if (!redirectUrl) {
        throw new Error("Không nhận được link thanh toán");
      }

      storePendingPaymentSessionId(response.value?.sessionId);
      return redirectUrl;
    },
    onSuccess: (redirectUrl) => {
      window.location.assign(redirectUrl);
    },
    onError: (err) => {
      toast.error(err?.message || "Khởi tạo thanh toán thất bại");
    },
  });

  const completeMutation = useMutation({
    mutationFn: async () => {
      if (!order?.id) {
        throw new Error("Không tìm thấy mã đơn hàng.");
      }

      const response = await orderService.completeOrder(order.id);
      if (!response.succeeded) {
        throw new Error(response.message || "Không thể hoàn tất đơn hàng.");
      }
    },
    onSuccess: async () => {
      toast.success("Đã hoàn tất đơn hàng.");
      await Promise.all([
        refetch(),
        queryClient.invalidateQueries({ queryKey: ["account-orders"] }),
      ]);
    },
    onError: (err) => {
      toast.error(err?.message || "Không thể hoàn tất đơn hàng.");
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

        <div className="flex flex-wrap items-center gap-2">
          {order?.id && (
            <button
              type="button"
              onClick={() =>
                navigate(
                  buildTicketEntryPath({
                    isAuthenticated: true,
                    type: "OrderIssue",
                    orderId: order.id,
                  })
                )
              }
              className="h-9 rounded-lg border border-[#0090D0] px-4 text-sm font-semibold text-[#0090D0] hover:bg-[#0090D0]/5"
            >
              Gửi ticket đơn hàng
            </button>
          )}
          {canCompleteOrder && (
            <button
              type="button"
              onClick={() => completeMutation.mutate()}
              disabled={completeMutation.isPending}
              className="h-9 rounded-lg bg-emerald-600 px-4 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {completeMutation.isPending ? "Đang hoàn tất..." : "Hoàn tất đơn hàng"}
            </button>
          )}

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
            <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-sm md:grid-cols-3">
              <PriceRow label="Tạm tính" value={order.originalSubTotal ?? order.subTotal} />
              {orderHasDiscount && (
                <PriceRow
                  label="Giảm giá đơn hàng"
                  value={order.discountAmount ?? order.subTotalDiscountValue}
                  prefix="- "
                  valueClassName="text-emerald-700"
                />
              )}
              {orderHasDiscount && (
                <PriceRow
                  label="Tạm tính sau giảm"
                  value={order.discountedSubTotal ?? order.subTotalDiscount}
                />
              )}
              <PriceRow label="Phí ship" value={order.shippingCost} />
              <PriceRow label="Thuế" value={order.tax} />
              <PriceRow label="Tổng tiền" value={order.totalPrice} highlight />
            </div>
          </div>

          {(order.promotions || []).length > 0 && (
            <section className="mt-4">
              <h3 className="text-sm font-semibold text-slate-900">Khuyến mãi áp dụng</h3>
              <div className="mt-2 space-y-2">
                {order.promotions.map((promotion, index) => (
                  <article
                    key={promotion.id || promotion.code || index}
                    className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900">
                          {promotion.name || promotion.code || "Khuyến mãi áp dụng"}
                        </p>
                        {promotion.code && (
                          <p className="mt-0.5 text-xs text-slate-600">Mã: {promotion.code}</p>
                        )}
                      </div>
                      <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                        {getPromotionBenefitText(promotion)}
                      </span>
                    </div>
                    {promotion.description && (
                      <p className="mt-2 text-xs text-slate-600">{promotion.description}</p>
                    )}
                  </article>
                ))}
              </div>
            </section>
          )}

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
                      <OrderItemPricing item={item} />
                      <div className="mt-3">
                        <button
                          type="button"
                          onClick={() =>
                            navigate(
                              buildTicketEntryPath({
                                isAuthenticated: true,
                                type: "WarrantyRequest",
                                orderItemId: item.id,
                              })
                            )
                          }
                          className="inline-flex h-9 items-center rounded-lg border border-slate-300 px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                        >
                          Tạo ticket bảo hành
                        </button>
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

function PriceRow({ label, value, highlight = false, prefix = "", valueClassName = "" }) {
  return (
    <div>
      <p className="text-[11px] text-slate-500">{label}</p>
      <p
        className={`text-sm font-semibold ${
          highlight ? "text-red-600" : "text-slate-800"
        } ${valueClassName}`.trim()}
      >
        {prefix}
        {formatMoney(value)}
      </p>
    </div>
  );
}

function OrderItemPricing({ item }) {
  if (!item?.hasDiscount) {
    return (
      <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
        <span>SL: {item?.quantity || 0}</span>
        <span>Đơn giá: {formatMoney(item?.unitPrice)}</span>
        <span className="font-semibold text-slate-800">
          Thành tiền: {formatMoney(item?.discountedLineTotal ?? item?.totalPrice)}
        </span>
      </div>
    );
  }

  return (
    <div className="mt-1 space-y-1 text-xs text-slate-600">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
        <span>SL: {item?.quantity || 0}</span>
        <span>
          Đơn giá gốc:{" "}
          <span className="text-slate-500 line-through">{formatMoney(item?.unitPrice)}</span>
        </span>
        <span className="font-semibold text-emerald-700">
          Đơn giá sau giảm: {formatMoney(item?.effectiveUnitPrice)}
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
        {item?.discountValue != null && (
          <span>Giảm mỗi sản phẩm: {formatMoney(item.discountValue)}</span>
        )}
        <span>
          Thành tiền gốc:{" "}
          <span className="text-slate-500 line-through">
            {formatMoney(item?.originalLineTotal)}
          </span>
        </span>
        <span className="font-semibold text-emerald-700">
          Thành tiền sau giảm: {formatMoney(item?.discountedLineTotal)}
        </span>
      </div>
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

