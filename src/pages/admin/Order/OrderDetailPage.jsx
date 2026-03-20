import React, { useMemo } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { FiArrowLeft, FiLoader, FiShoppingBag } from "react-icons/fi";

import Breadcrumb from "../../../components/ui/Breadcrumb.jsx";
import { orderService } from "../../../services/orderService";

const DELIVERY_TEXT = {
  Shipping: "Giao hàng",
  PickUp: "Nhận tại cửa hàng",
};

const PAID_TEXT = {
  Full: "Thanh toán đủ",
  Installment: "Trả góp",
};

const ORDER_STATUS_TEXT = {
  Pending: "Chờ xác nhận",
  Confirmed: "Đã xác nhận",
  Processing: "Đang xử lý",
  Shipping: "Đang giao hàng",
  Delivered: "Đã giao hàng",
  ReadyForPickup: "Sẵn sàng nhận tại cửa hàng",
  PickedUp: "Đã nhận tại cửa hàng",
  Completed: "Hoàn tất",
  Installing: "Đang lắp đặt",
  Canceled: "Đã hủy",
  Refunded: "Đã hoàn tiền",
  Expired: "Hết hạn",
};

const STATUS_BADGE_CLASS = {
  Pending: "bg-amber-100 text-amber-700 border-amber-200",
  Confirmed: "bg-indigo-100 text-indigo-700 border-indigo-200",
  Processing: "bg-blue-100 text-blue-700 border-blue-200",
  Shipping: "bg-sky-100 text-sky-700 border-sky-200",
  Delivered: "bg-emerald-100 text-emerald-700 border-emerald-200",
  ReadyForPickup: "bg-cyan-100 text-cyan-700 border-cyan-200",
  PickedUp: "bg-emerald-100 text-emerald-700 border-emerald-200",
  Completed: "bg-green-100 text-green-700 border-green-200",
  Installing: "bg-violet-100 text-violet-700 border-violet-200",
  Canceled: "bg-rose-100 text-rose-700 border-rose-200",
  Refunded: "bg-slate-100 text-slate-700 border-slate-200",
  Expired: "bg-orange-100 text-orange-700 border-orange-200",
};

const TERMINAL_ORDER_STATUSES = new Set(["completed", "canceled", "cancelled", "refunded", "expired"]);

const ORDER_STATUS_ACTIONS = {
  process: {
    key: "process",
    label: "Chuyển sang Đang xử lý",
    nextStatus: "Processing",
    run: (orderId) => orderService.processOrder(orderId),
  },
  deliver: {
    key: "deliver",
    label: "Chuyển sang Đang giao hàng",
    nextStatus: "Shipping",
    run: (orderId) => orderService.deliverOrder(orderId),
  },
  delivered: {
    key: "delivered",
    label: "Xác nhận đã giao hàng",
    nextStatus: "Delivered",
    run: (orderId) => orderService.markOrderDelivered(orderId),
  },
  readyForPickup: {
    key: "ready-for-pickup",
    label: "Chuyển sang Sẵn sàng nhận",
    nextStatus: "ReadyForPickup",
    run: (orderId) => orderService.markOrderReadyForPickup(orderId),
  },
  pickedUp: {
    key: "picked-up",
    label: "Xác nhận đã nhận tại cửa hàng",
    nextStatus: "PickedUp",
    run: (orderId) => orderService.markOrderPickedUp(orderId),
  },
  completed: {
    key: "completed",
    label: "Hoàn tất đơn hàng",
    nextStatus: "Completed",
    run: (orderId) => orderService.completeOrder(orderId),
  },
};

function normalizeKey(value) {
  return String(value || "").trim().toLowerCase();
}

function formatPrice(value) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(Number(value || 0));
}

function formatDate(value) {
  if (!value) return "--";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "--";
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(parsed);
}

function parsePaymentMethod(notes) {
  if (!notes) return "--";
  const matched = String(notes).match(/\[PaymentMethod:(.+?)\]/i);
  if (!matched?.[1]) return "--";
  const method = matched[1].toUpperCase();
  if (method === "QR") return "QR";
  if (method === "COD") return "COD";
  if (method === "INSTALLMENT") return "Trả góp";
  return method;
}

function plainNotes(notes) {
  if (!notes) return "";
  return String(notes).replace(/\[PaymentMethod:.+?\]/gi, "").trim();
}

function getStatusText(status) {
  return ORDER_STATUS_TEXT[status] || status || "--";
}

function getBaseOrderFlow(deliveryType) {
  if (normalizeKey(deliveryType) === "pickup") {
    return ["Pending", "Confirmed", "Processing", "ReadyForPickup", "PickedUp", "Completed"];
  }

  return ["Pending", "Confirmed", "Processing", "Shipping", "Delivered", "Completed"];
}

function getOrderFlow(order) {
  const baseFlow = getBaseOrderFlow(order?.deliveryType);
  const currentStatus = order?.status;

  if (!currentStatus) return baseFlow;

  if (currentStatus === "Installing") {
    return [...baseFlow.slice(0, -1), "Installing", "Completed"];
  }

  if (["Canceled", "Refunded", "Expired"].includes(currentStatus)) {
    return [...baseFlow.slice(0, -1), currentStatus];
  }

  if (!baseFlow.includes(currentStatus)) {
    return [...baseFlow, currentStatus];
  }

  return baseFlow;
}

function getNextOrderAction(order) {
  const status = normalizeKey(order?.status);
  const deliveryType = normalizeKey(order?.deliveryType);

  if (!status || TERMINAL_ORDER_STATUSES.has(status)) return null;

  if (status === "pending" || status === "confirmed") {
    return ORDER_STATUS_ACTIONS.process;
  }

  if (status === "processing") {
    return deliveryType === "pickup"
      ? ORDER_STATUS_ACTIONS.readyForPickup
      : ORDER_STATUS_ACTIONS.deliver;
  }

  if (status === "shipping") {
    return ORDER_STATUS_ACTIONS.delivered;
  }

  if (status === "readyforpickup") {
    return ORDER_STATUS_ACTIONS.pickedUp;
  }

  if (status === "delivered" || status === "pickedup" || status === "installing") {
    return ORDER_STATUS_ACTIONS.completed;
  }

  return null;
}

function getStatusUpdateHint(order, nextAction) {
  const currentStatus = normalizeKey(order?.status);

  if (nextAction) {
    return `Chỉ có thể chuyển tuần tự sang bước kế tiếp là ${getStatusText(nextAction.nextStatus)}.`;
  }

  if (TERMINAL_ORDER_STATUSES.has(currentStatus)) {
    return "Đơn hàng đã ở trạng thái kết thúc, không thể cập nhật thêm.";
  }

  return "Trạng thái hiện tại chưa có API chuyển bước phù hợp trong giao diện này.";
}

function InfoField({ label, value }) {
  return (
    <div className="rounded-lg border border-slate-200 p-3">
      <div className="text-[11px] uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-1 break-words text-sm text-slate-800">{value ?? "--"}</div>
    </div>
  );
}

function StatusBadge({ status }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${
        STATUS_BADGE_CLASS[status] || "bg-slate-100 text-slate-700 border-slate-200"
      }`}
    >
      {getStatusText(status)}
    </span>
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

export default function OrderDetailPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { orderId } = useParams();

  const { data: order, isLoading, isFetching } = useQuery({
    enabled: !!orderId,
    queryKey: ["admin-order-detail", orderId],
    queryFn: async () => {
      const res = await orderService.getOrderDetail(orderId);
      if (!res.succeeded) {
        toast.error(res.message || "Không thể tải chi tiết đơn hàng");
        return null;
      }
      return res.value;
    },
  });

  const nextOrderAction = useMemo(() => getNextOrderAction(order), [order]);
  const orderFlow = useMemo(() => getOrderFlow(order), [order]);
  const statusUpdateHint = useMemo(
    () => getStatusUpdateHint(order, nextOrderAction),
    [order, nextOrderAction]
  );

  const updateStatusMutation = useMutation({
    mutationFn: async (action) => {
      if (!orderId) {
        throw new Error("Không tìm thấy mã đơn hàng.");
      }

      const res = await action.run(orderId);
      if (!res.succeeded) {
        throw new Error(
          res.message || `Không thể cập nhật trạng thái sang ${getStatusText(action.nextStatus)}.`
        );
      }

      return action;
    },
    onSuccess: async (action) => {
      toast.success(`Đã cập nhật trạng thái sang ${getStatusText(action.nextStatus)}.`);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin-order-detail", orderId] }),
        queryClient.invalidateQueries({ queryKey: ["admin-orders"] }),
      ]);
    },
    onError: (error) => {
      toast.error(error?.message || "Không thể cập nhật trạng thái đơn hàng.");
    },
  });

  const handleUpdateStatus = () => {
    if (!nextOrderAction || updateStatusMutation.isPending) return;
    updateStatusMutation.mutate(nextOrderAction);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-sm text-slate-500">Đang tải thông tin đơn hàng...</div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-8 text-center">
        <p className="text-sm text-slate-600">Không tìm thấy thông tin đơn hàng.</p>
        <button
          type="button"
          onClick={() => navigate("/admin/orders")}
          className="mt-4 h-9 rounded bg-[#6e846f] px-4 text-sm font-semibold text-white hover:opacity-90"
        >
          Quay lại danh sách
        </button>
      </div>
    );
  }

  const noteText = plainNotes(order.notes);

  return (
    <div className="font-[var(--font-inter)]">
      <div className="flex items-center justify-between">
        <Breadcrumb
          items={[
            { label: "Trang chủ", href: "/admin" },
            { label: "Quản lý đơn hàng", href: "/admin/orders" },
            { label: `Đơn #${String(order.id || "").slice(0, 8).toUpperCase()}` },
          ]}
        />

        <button
          type="button"
          onClick={() => navigate("/admin/orders")}
          className="inline-flex items-center gap-2 rounded bg-[#6e846f] px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90"
        >
          <FiArrowLeft />
          Quay lại
        </button>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-[#334155]">
            Chi tiết đơn hàng #{String(order.id || "").slice(0, 8).toUpperCase()}
          </h1>
          <p className="mt-1 text-sm text-slate-500">{formatDate(order.orderDate)}</p>
        </div>
        <StatusBadge status={order.status} />
      </div>

      <div className="mt-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-2xl">
            <h2 className="text-base font-semibold text-slate-800">Cập nhật trạng thái</h2>
            <p className="mt-1 text-sm text-slate-500">{statusUpdateHint}</p>
          </div>

          {nextOrderAction ? (
            <button
              type="button"
              onClick={handleUpdateStatus}
              disabled={updateStatusMutation.isPending}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {updateStatusMutation.isPending && <FiLoader className="animate-spin" />}
              {updateStatusMutation.isPending ? "Đang cập nhật..." : nextOrderAction.label}
            </button>
          ) : (
            <div className="inline-flex h-10 items-center rounded-lg border border-slate-200 bg-slate-50 px-4 text-sm text-slate-500">
              Không có bước tiếp theo
            </div>
          )}
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
          <InfoField label="Trạng thái hiện tại" value={<StatusBadge status={order.status} />} />
          <InfoField
            label="Bước kế tiếp"
            value={nextOrderAction ? getStatusText(nextOrderAction.nextStatus) : "Không khả dụng"}
          />
          <InfoField
            label="Loại giao/nhận"
            value={DELIVERY_TEXT[order.deliveryType] || order.deliveryType || "--"}
          />
        </div>

        <div className="mt-4">
          <div className="text-[11px] uppercase tracking-wide text-slate-500">Luồng trạng thái</div>
          <OrderFlowSteps flow={orderFlow} currentStatus={order.status} />
          {isFetching && !isLoading && (
            <div className="mt-3 text-xs text-slate-500">Đang làm mới dữ liệu đơn hàng...</div>
          )}
        </div>
      </div>

      <div className="mt-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold text-slate-800">Thông tin đơn hàng</h2>
        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
          <InfoField label="Mã đơn" value={order.id} />
          <InfoField label="Khách hàng ID" value={order.userId} />
          <InfoField label="Người nhận" value={order.receiverFullName} />
          <InfoField label="Email" value={order.receiverEmail} />
          <InfoField label="Số điện thoại" value={order.trackingPhone} />
          <InfoField
            label="Hình thức giao"
            value={DELIVERY_TEXT[order.deliveryType] || order.deliveryType}
          />
          <InfoField label="Hình thức thanh toán" value={PAID_TEXT[order.paidType] || order.paidType} />
          <InfoField label="Phương thức thanh toán" value={parsePaymentMethod(order.notes)} />
        </div>

        <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
          <div className="text-[11px] uppercase tracking-wide text-slate-500">Địa chỉ giao hàng</div>
          <div className="mt-1 break-words text-sm text-slate-800">
            {order.shippingAddress || "--"}
          </div>
        </div>

        {noteText && (
          <div className="mt-3 rounded-lg border border-slate-200 p-3">
            <div className="text-[11px] uppercase tracking-wide text-slate-500">Ghi chú</div>
            <div className="mt-1 break-words text-sm text-slate-800">{noteText}</div>
          </div>
        )}

        <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
          <InfoField label="Tạm tính" value={formatPrice(order.subTotal)} />
          <InfoField label="Phí ship" value={formatPrice(order.shippingCost)} />
          <InfoField label="Thuế" value={formatPrice(order.tax)} />
          <InfoField label="Tổng tiền" value={formatPrice(order.totalPrice)} />
        </div>
      </div>

      <div className="mt-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold text-slate-800">Sản phẩm trong đơn</h2>
        {(order.items || []).length === 0 ? (
          <div className="mt-3 text-sm text-slate-500">Không có sản phẩm.</div>
        ) : (
          <div className="mt-3 space-y-3">
            {order.items.map((item) => (
              <article
                key={item.id}
                className="rounded-lg border border-slate-200 p-3 transition-colors hover:bg-slate-50"
              >
                <div className="flex items-start gap-3">
                  {item?.product?.firstImageUrl ? (
                    <img
                      src={item.product.firstImageUrl}
                      alt={item?.product?.name || "product"}
                      className="h-16 w-16 rounded border border-slate-200 object-cover"
                    />
                  ) : (
                    <div className="flex h-16 w-16 items-center justify-center rounded border border-slate-200 bg-slate-100">
                      <FiShoppingBag className="text-slate-400" />
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <Link
                      to={`/admin/products/${item?.product?.id}`}
                      className="line-clamp-2 font-medium text-slate-800 transition-colors hover:text-blue-600"
                    >
                      {item?.product?.name || "Sản phẩm"}
                    </Link>
                    <div className="mt-1 text-xs text-slate-500">SKU: {item?.product?.sku || "--"}</div>
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
                      <span>SL: {item.quantity || 0}</span>
                      <span>Đơn giá: {formatPrice(item.unitPrice)}</span>
                      <span className="font-semibold text-slate-800">
                        Thành tiền: {formatPrice(item.totalPrice)}
                      </span>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-slate-800">Lịch sử thanh toán</h2>
          {(order.payments || []).length === 0 ? (
            <div className="mt-3 text-sm text-slate-500">Chưa có giao dịch thanh toán.</div>
          ) : (
            <div className="mt-3 space-y-2">
              {order.payments.map((payment) => (
                <div key={payment.id} className="rounded border border-slate-200 p-3">
                  <div className="text-sm font-medium text-slate-800">
                    {formatPrice(payment.amount)} - {payment.method || "--"}
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    Trạng thái: {payment.status || "--"} | {formatDate(payment.paymentDate)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-slate-800">Lịch trả góp</h2>
          {(order.installments || []).length === 0 ? (
            <div className="mt-3 text-sm text-slate-500">Không có kỳ trả góp.</div>
          ) : (
            <div className="mt-3 space-y-2">
              {order.installments.map((installment, index) => (
                <div key={installment.id || index} className="rounded border border-slate-200 p-3">
                  <div className="text-sm font-medium text-slate-800">
                    Kỳ {index + 1}: {formatPrice(installment.amount || installment.totalAmount)}
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    Trạng thái: {installment.status || "--"}
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
