import React from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { FiArrowLeft, FiShoppingBag } from "react-icons/fi";

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
};

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

function InfoField({ label, value }) {
  return (
    <div className="rounded-lg border border-slate-200 p-3">
      <div className="text-[11px] uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-1 text-sm text-slate-800 break-words">{value || "--"}</div>
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
      {status || "--"}
    </span>
  );
}

export default function OrderDetailPage() {
  const navigate = useNavigate();
  const { orderId } = useParams();

  const { data: order, isLoading } = useQuery({
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
          <p className="text-sm text-slate-500 mt-1">{formatDate(order.orderDate)}</p>
        </div>
        <StatusBadge status={order.status} />
      </div>

      <div className="mt-4 rounded-lg border border-slate-200 bg-white shadow-sm p-5">
        <h2 className="text-base font-semibold text-slate-800">Thông tin đơn hàng</h2>
        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
          <InfoField label="Mã đơn" value={order.id} />
          <InfoField label="Khách hàng ID" value={order.userId} />
          <InfoField label="Người nhận" value={order.receiverFullName} />
          <InfoField label="Email" value={order.receiverEmail} />
          <InfoField label="Số điện thoại" value={order.trackingPhone} />
          <InfoField label="Hình thức giao" value={DELIVERY_TEXT[order.deliveryType] || order.deliveryType} />
          <InfoField label="Hình thức thanh toán" value={PAID_TEXT[order.paidType] || order.paidType} />
          <InfoField label="Payment method" value={parsePaymentMethod(order.notes)} />
        </div>

        <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
          <div className="text-[11px] uppercase tracking-wide text-slate-500">Địa chỉ giao hàng</div>
          <div className="mt-1 text-sm text-slate-800 break-words">{order.shippingAddress || "--"}</div>
        </div>

        {noteText && (
          <div className="mt-3 rounded-lg border border-slate-200 p-3">
            <div className="text-[11px] uppercase tracking-wide text-slate-500">Ghi chú</div>
            <div className="mt-1 text-sm text-slate-800 break-words">{noteText}</div>
          </div>
        )}

        <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3">
          <InfoField label="Tạm tính" value={formatPrice(order.subTotal)} />
          <InfoField label="Phí ship" value={formatPrice(order.shippingCost)} />
          <InfoField label="Thuế" value={formatPrice(order.tax)} />
          <InfoField label="Tổng tiền" value={formatPrice(order.totalPrice)} />
        </div>
      </div>

      <div className="mt-4 rounded-lg border border-slate-200 bg-white shadow-sm p-5">
        <h2 className="text-base font-semibold text-slate-800">Sản phẩm trong đơn</h2>
        {(order.items || []).length === 0 ? (
          <div className="mt-3 text-sm text-slate-500">Không có sản phẩm.</div>
        ) : (
          <div className="mt-3 space-y-3">
            {order.items.map((item) => (
              <article
                key={item.id}
                className="rounded-lg border border-slate-200 p-3 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-start gap-3">
                  {item?.product?.firstImageUrl ? (
                    <img
                      src={item.product.firstImageUrl}
                      alt={item?.product?.name || "product"}
                      className="h-16 w-16 rounded object-cover border border-slate-200"
                    />
                  ) : (
                    <div className="h-16 w-16 rounded border border-slate-200 bg-slate-100 flex items-center justify-center">
                      <FiShoppingBag className="text-slate-400" />
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <Link to={`/admin/products/${item?.product?.id}`} className="font-medium text-slate-800 line-clamp-2 hover:text-blue-600 transition-colors">
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

      <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-lg border border-slate-200 bg-white shadow-sm p-5">
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

        <div className="rounded-lg border border-slate-200 bg-white shadow-sm p-5">
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
