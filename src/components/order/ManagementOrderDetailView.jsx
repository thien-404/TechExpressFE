import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { FiArrowLeft, FiLoader, FiShoppingBag } from "react-icons/fi";

import Breadcrumb from "../ui/Breadcrumb.jsx";
import OrderStatusBadge from "./OrderStatusBadge.jsx";
import { orderService } from "../../services/orderService";
import {
  formatDate,
  formatPrice,
  getDeliveryText,
  getOrderFlow,
  getOrderTransitionState,
  getPaidText,
  getStatusText,
  normalizeKey,
  parsePaymentMethod,
  plainNotes,
} from "../../utils/orderManagement";

const T = {
  home: "Trang chủ",
  title: "Quản lý đơn hàng",
  back: "Quay lại",
  detailPrefix: "Chi tiết đơn hàng #",
  updateStatus: "Cập nhật trạng thái",
  noAction: "Không có thao tác khả dụng",
  currentStatus: "Trạng thái hiện tại",
  nextStep: "Bước kế tiếp",
  deliveryType: "Loại giao/nhận",
  unavailable: "Không khả dụng",
  flow: "Luồng trạng thái",
  refreshing: "Đang làm mới dữ liệu đơn hàng...",
  orderInfo: "Thông tin đơn hàng",
  orderId: "Mã đơn",
  userId: "Khách hàng ID",
  receiver: "Người nhận",
  email: "Email",
  phone: "Số điện thoại",
  deliveryMethod: "Hình thức giao nhận",
  paidType: "Kiểu thanh toán",
  paymentMethod: "Phương thức thanh toán",
  shippingAddress: "Địa chỉ giao hàng",
  notes: "Ghi chú",
  subtotal: "Tạm tính",
  shippingFee: "Phí ship",
  tax: "Thuế",
  total: "Tổng tiền",
  orderItems: "Sản phẩm trong đơn",
  emptyItems: "Không có sản phẩm.",
  product: "Sản phẩm",
  sku: "SKU",
  quantity: "SL",
  unitPrice: "Đơn giá",
  lineTotal: "Thành tiền",
  paymentHistory: "Lịch sử thanh toán",
  noPayments: "Chưa có giao dịch thanh toán.",
  installmentHistory: "Lịch trả góp",
  noInstallments: "Không có kỳ trả góp.",
  installment: "Kỳ",
  loading: "Đang tải thông tin đơn hàng...",
  notFound: "Không tìm thấy thông tin đơn hàng.",
  backToList: "Quay lại danh sách",
  orderLoadError: "Không thể tải chi tiết đơn hàng",
  updating: "Đang cập nhật...",
  updateMissingId: "Không tìm thấy mã đơn hàng.",
  updateErrorPrefix: "Không thể cập nhật trạng thái sang",
  updateSuccessPrefix: "Đã cập nhật trạng thái sang",
  updateFailed: "Không thể cập nhật trạng thái đơn hàng.",
  paymentStatus: "Trạng thái",
  deliverMode: "Hình thức bàn giao",
  deliverModeHelp: "Chọn cách đơn hàng bắt đầu đi giao để gửi đúng dữ liệu cho backend.",
  partnerDelivery: "Bàn giao cho đơn vị vận chuyển",
  selfDelivery: "Staff tự giao hàng",
  courierService: "Đơn vị vận chuyển",
  courierServicePlaceholder: "Ví dụ: Giao Hàng Nhanh",
  trackingCode: "Mã vận đơn",
  trackingCodePlaceholder: "Nhập mã vận đơn",
  selfDeliveryHint:
    "Đơn sẽ được ghi nhận là staff tự giao hàng, không cần nhập thêm thông tin vận chuyển.",
  courierServiceRequired: "Vui lòng nhập đơn vị vận chuyển.",
  trackingCodeRequired: "Vui lòng nhập mã vận đơn.",
};

const TRANSITION_TONE_CLASS = {
  info: "border-blue-200 bg-blue-50 text-blue-700",
  warning: "border-amber-200 bg-amber-50 text-amber-700",
  muted: "border-slate-200 bg-slate-50 text-slate-600",
  terminal: "border-slate-200 bg-slate-50 text-slate-600",
};

const DEFAULT_DELIVERY_FORM = {
  mode: "partner",
  courierService: "",
  courierTrackingCode: "",
};

function InfoField({ label, value }) {
  return (
    <div className="rounded-lg border border-slate-200 p-3">
      <div className="text-[11px] uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-1 break-words text-sm text-slate-800">{value ?? "--"}</div>
    </div>
  );
}

function OrderFlowSteps({ flow, currentStatus }) {
  const currentKey = normalizeKey(currentStatus);
  const currentIndex = flow.findIndex((step) => normalizeKey(step) === currentKey);

  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {flow.map((step, index) => {
        const stepKey = normalizeKey(step);
        const isCurrent = stepKey === currentKey;
        const isDone = currentIndex >= 0 && index < currentIndex;

        let className = "border-slate-200 bg-slate-50 text-slate-500";
        if (isCurrent) {
          className = "border-blue-200 bg-blue-50 text-blue-700";
        } else if (isDone) {
          className = "border-emerald-200 bg-emerald-50 text-emerald-700";
        }

        return (
          <span
            key={`${step}-${index}`}
            className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${className}`}
          >
            {index + 1}. {getStatusText(step)}
          </span>
        );
      })}
    </div>
  );
}

export default function ManagementOrderDetailView({
  role,
  basePath,
  listQueryKey,
  detailQueryKey,
  productBasePath,
}) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { orderId } = useParams();
  const [deliveryForm, setDeliveryForm] = useState(DEFAULT_DELIVERY_FORM);

  const { data: order, isLoading, isFetching } = useQuery({
    enabled: !!orderId,
    queryKey: [detailQueryKey, orderId],
    queryFn: async () => {
      const res = await orderService.getOrderDetail(orderId);
      if (!res.succeeded) {
        toast.error(res.message || T.orderLoadError);
        return null;
      }
      return res.value;
    },
  });

  const orderFlow = useMemo(() => getOrderFlow(order), [order]);
  const transitionState = useMemo(() => getOrderTransitionState(order, role), [order, role]);
  const isDeliverAction =
    transitionState.type === "action" && transitionState.action?.key === "deliver";

  const deliveryPayloadState = useMemo(() => {
    if (!isDeliverAction) {
      return {
        isValid: true,
        message: "",
        payload: undefined,
      };
    }

    const isSelfDeliver = deliveryForm.mode === "self";
    const courierService = deliveryForm.courierService.trim();
    const courierTrackingCode = deliveryForm.courierTrackingCode.trim();

    if (!isSelfDeliver && !courierService) {
      return {
        isValid: false,
        message: T.courierServiceRequired,
        payload: undefined,
      };
    }

    if (!isSelfDeliver && !courierTrackingCode) {
      return {
        isValid: false,
        message: T.trackingCodeRequired,
        payload: undefined,
      };
    }

    return {
      isValid: true,
      message: "",
      payload: {
        isSelfDeliver,
        courierService: isSelfDeliver ? null : courierService,
        courierTrackingCode: isSelfDeliver ? null : courierTrackingCode,
      },
    };
  }, [deliveryForm, isDeliverAction]);

  useEffect(() => {
    if (!isDeliverAction) {
      setDeliveryForm(DEFAULT_DELIVERY_FORM);
    }
  }, [isDeliverAction, orderId]);

  const updateStatusMutation = useMutation({
    mutationFn: async ({ action, payload }) => {
      if (!orderId) {
        throw new Error(T.updateMissingId);
      }

      const res = await action.run(orderId, payload);
      if (!res.succeeded) {
        throw new Error(res.message || `${T.updateErrorPrefix} ${getStatusText(action.nextStatus)}.`);
      }

      return action;
    },
    onSuccess: async (action) => {
      toast.success(`${T.updateSuccessPrefix} ${getStatusText(action.nextStatus)}.`);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: [detailQueryKey, orderId] }),
        queryClient.invalidateQueries({ queryKey: [listQueryKey] }),
      ]);
    },
    onError: (error) => {
      toast.error(error?.message || T.updateFailed);
    },
  });

  const handleUpdateStatus = () => {
    if (transitionState.type !== "action" || updateStatusMutation.isPending) return;

    if (transitionState.action.requiresPayload && !deliveryPayloadState.isValid) {
      toast.error(deliveryPayloadState.message || T.updateFailed);
      return;
    }

    updateStatusMutation.mutate({
      action: transitionState.action,
      payload: transitionState.action.requiresPayload ? deliveryPayloadState.payload : undefined,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-sm text-slate-500">{T.loading}</div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-8 text-center">
        <p className="text-sm text-slate-600">{T.notFound}</p>
        <button
          type="button"
          onClick={() => navigate(`${basePath}/orders`)}
          className="mt-4 h-9 rounded bg-[#6e846f] px-4 text-sm font-semibold text-white hover:opacity-90"
        >
          {T.backToList}
        </button>
      </div>
    );
  }

  const noteText = plainNotes(order.notes);
  const toneClass = TRANSITION_TONE_CLASS[transitionState.tone] || TRANSITION_TONE_CLASS.muted;
  const receiverPhone = order.trackingPhone || order.receiverPhone || "--";
  const orderLabel = `#${String(order.id || "").slice(0, 8).toUpperCase()}`;

  return (
    <div className="font-[var(--font-inter)]">
      <div className="flex items-center justify-between">
        <Breadcrumb
          items={[
            { label: T.home, href: basePath },
            { label: T.title, href: `${basePath}/orders` },
            { label: `Đơn ${orderLabel}` },
          ]}
        />

        <button
          type="button"
          onClick={() => navigate(`${basePath}/orders`)}
          className="inline-flex items-center gap-2 rounded bg-[#6e846f] px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90"
        >
          <FiArrowLeft />
          {T.back}
        </button>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-[#334155]">
            {T.detailPrefix}
            {String(order.id || "").slice(0, 8).toUpperCase()}
          </h1>
          <p className="mt-1 text-sm text-slate-500">{formatDate(order.orderDate)}</p>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      <div className="mt-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-2xl">
            <h2 className="text-base font-semibold text-slate-800">{T.updateStatus}</h2>
          </div>

          {transitionState.type === "action" ? (
            <button
              type="button"
              onClick={handleUpdateStatus}
              disabled={
                updateStatusMutation.isPending ||
                (transitionState.action.requiresPayload && !deliveryPayloadState.isValid)
              }
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {updateStatusMutation.isPending && <FiLoader className="animate-spin" />}
              {updateStatusMutation.isPending ? T.updating : transitionState.action.label}
            </button>
          ) : (
            <div className="inline-flex h-10 items-center rounded-lg border border-slate-200 bg-slate-50 px-4 text-sm text-slate-500">
              {T.noAction}
            </div>
          )}
        </div>

        <div className={`mt-4 rounded-lg border px-4 py-3 text-sm ${toneClass}`}>
          {transitionState.hint}
        </div>

        {isDeliverAction && (
          <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-slate-700" htmlFor="deliver-mode">
                  {T.deliverMode}
                </label>
                <select
                  id="deliver-mode"
                  value={deliveryForm.mode}
                  onChange={(event) =>
                    setDeliveryForm((prev) => ({
                      ...prev,
                      mode: event.target.value,
                    }))
                  }
                  className="mt-1 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="partner">{T.partnerDelivery}</option>
                  <option value="self">{T.selfDelivery}</option>
                </select>
                <p className="mt-1 text-xs text-slate-500">{T.deliverModeHelp}</p>
              </div>

              {deliveryForm.mode === "partner" ? (
                <>
                  <div>
                    <label className="text-sm font-medium text-slate-700" htmlFor="courier-service">
                      {T.courierService}
                    </label>
                    <input
                      id="courier-service"
                      type="text"
                      value={deliveryForm.courierService}
                      onChange={(event) =>
                        setDeliveryForm((prev) => ({
                          ...prev,
                          courierService: event.target.value,
                        }))
                      }
                      placeholder={T.courierServicePlaceholder}
                      className="mt-1 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-slate-700" htmlFor="tracking-code">
                      {T.trackingCode}
                    </label>
                    <input
                      id="tracking-code"
                      type="text"
                      value={deliveryForm.courierTrackingCode}
                      onChange={(event) =>
                        setDeliveryForm((prev) => ({
                          ...prev,
                          courierTrackingCode: event.target.value,
                        }))
                      }
                      placeholder={T.trackingCodePlaceholder}
                      className="mt-1 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                </>
              ) : (
                <div className="md:col-span-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
                  {T.selfDeliveryHint}
                </div>
              )}
            </div>

            {!deliveryPayloadState.isValid && (
              <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                {deliveryPayloadState.message}
              </div>
            )}
          </div>
        )}

        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
          <InfoField label={T.currentStatus} value={<OrderStatusBadge status={order.status} />} />
          <InfoField
            label={T.nextStep}
            value={transitionState.nextStatus ? getStatusText(transitionState.nextStatus) : T.unavailable}
          />
          <InfoField label={T.deliveryType} value={getDeliveryText(order.deliveryType)} />
        </div>

        <div className="mt-4">
          <div className="text-[11px] uppercase tracking-wide text-slate-500">{T.flow}</div>
          <OrderFlowSteps flow={orderFlow} currentStatus={order.status} />
          {isFetching && !isLoading && <div className="mt-3 text-xs text-slate-500">{T.refreshing}</div>}
        </div>
      </div>

      <div className="mt-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold text-slate-800">{T.orderInfo}</h2>
        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
          <InfoField label={T.orderId} value={order.id} />
          <InfoField label={T.userId} value={order.userId} />
          <InfoField label={T.receiver} value={order.receiverFullName} />
          <InfoField label={T.email} value={order.receiverEmail} />
          <InfoField label={T.phone} value={receiverPhone} />
          <InfoField label={T.deliveryMethod} value={getDeliveryText(order.deliveryType)} />
          <InfoField label={T.paidType} value={getPaidText(order.paidType)} />
          <InfoField label={T.paymentMethod} value={parsePaymentMethod(order.notes)} />
        </div>

        <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
          <div className="text-[11px] uppercase tracking-wide text-slate-500">{T.shippingAddress}</div>
          <div className="mt-1 break-words text-sm text-slate-800">{order.shippingAddress || "--"}</div>
        </div>

        {noteText && (
          <div className="mt-3 rounded-lg border border-slate-200 p-3">
            <div className="text-[11px] uppercase tracking-wide text-slate-500">{T.notes}</div>
            <div className="mt-1 break-words text-sm text-slate-800">{noteText}</div>
          </div>
        )}

        <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
          <InfoField label={T.subtotal} value={formatPrice(order.subTotal)} />
          <InfoField label={T.shippingFee} value={formatPrice(order.shippingCost)} />
          <InfoField label={T.tax} value={formatPrice(order.tax)} />
          <InfoField label={T.total} value={formatPrice(order.totalPrice)} />
        </div>
      </div>

      <div className="mt-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold text-slate-800">{T.orderItems}</h2>
        {(order.items || []).length === 0 ? (
          <div className="mt-3 text-sm text-slate-500">{T.emptyItems}</div>
        ) : (
          <div className="mt-3 space-y-3">
            {order.items.map((item) => {
              const product = item?.product;
              const canNavigateToProduct = Boolean(product?.id);

              return (
                <article
                  key={item.id}
                  className="rounded-lg border border-slate-200 p-3 transition-colors hover:bg-slate-50"
                >
                  <div className="flex items-start gap-3">
                    {product?.firstImageUrl ? (
                      <img
                        src={product.firstImageUrl}
                        alt={product?.name || "product"}
                        className="h-16 w-16 rounded border border-slate-200 object-cover"
                      />
                    ) : (
                      <div className="flex h-16 w-16 items-center justify-center rounded border border-slate-200 bg-slate-100">
                        <FiShoppingBag className="text-slate-400" />
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      {canNavigateToProduct ? (
                        <Link
                          to={`${productBasePath}/${product.id}`}
                          className="line-clamp-2 font-medium text-slate-800 transition-colors hover:text-blue-600"
                        >
                          {product?.name || T.product}
                        </Link>
                      ) : (
                        <div className="line-clamp-2 font-medium text-slate-800">{product?.name || T.product}</div>
                      )}

                      <div className="mt-1 text-xs text-slate-500">
                        {T.sku}: {product?.sku || "--"}
                      </div>
                      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
                        <span>{T.quantity}: {item.quantity || 0}</span>
                        <span>{T.unitPrice}: {formatPrice(item.unitPrice)}</span>
                        <span className="font-semibold text-slate-800">
                          {T.lineTotal}: {formatPrice(item.totalPrice)}
                        </span>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-slate-800">{T.paymentHistory}</h2>
          {(order.payments || []).length === 0 ? (
            <div className="mt-3 text-sm text-slate-500">{T.noPayments}</div>
          ) : (
            <div className="mt-3 space-y-2">
              {order.payments.map((payment) => (
                <div key={payment.id} className="rounded border border-slate-200 p-3">
                  <div className="text-sm font-medium text-slate-800">
                    {formatPrice(payment.amount)} - {payment.method || "--"}
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    {T.paymentStatus}: {payment.status || "--"} | {formatDate(payment.paymentDate)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-slate-800">{T.installmentHistory}</h2>
          {(order.installments || []).length === 0 ? (
            <div className="mt-3 text-sm text-slate-500">{T.noInstallments}</div>
          ) : (
            <div className="mt-3 space-y-2">
              {order.installments.map((installment, index) => (
                <div key={installment.id || index} className="rounded border border-slate-200 p-3">
                  <div className="text-sm font-medium text-slate-800">
                    {T.installment} {index + 1}: {formatPrice(installment.amount || installment.totalAmount)}
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    {T.paymentStatus}: {installment.status || "--"}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
