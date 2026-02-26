import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiService } from "../../config/axios";
import { useAuth } from "../../store/authContext";
import { orderService } from "../../services/orderService";
import {
  clearCartItems,
  selectCartCanCheckout,
  selectCartInvalidItems,
  selectCartItems,
  selectCartSubtotal,
} from "../../store/slices/cartSlice";

const DeliveryType = {
  Shipping: 0,
  PickUp: 1,
};

const PaidType = {
  Full: 0,
  Installment: 1,
};

const PAYMENT_OPTION = {
  QR: "QR",
  COD: "COD",
  INSTALLMENT: "INSTALLMENT",
};
const ONLINE_PAYMENT_METHOD = 1;

const SHIPPING_FEE_THRESHOLD = 300000;
const SHIPPING_FEE = 30000;
const INSTALLMENT_OPTIONS = [6, 12];
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^0\d{9,10}$/;
const IDENTITY_REGEX = /^(\d{9}|\d{12})$/;

const PICKUP_STORES = [
  {
    id: "store-q1",
    name: "TechExpress Quận 1",
    address: "12 Nguyễn Huệ, Bến Nghé, Quận 1, TP.HCM",
    workingHours: "Thứ 2 - Thứ 7, 08:30 - 17:30",
  },
  {
    id: "store-tb",
    name: "TechExpress Tân Bình",
    address: "89 Cộng Hòa, Phường 4, Tân Bình, TP.HCM",
    workingHours: "Thứ 2 - Thứ 7, 08:30 - 17:30",
  },
  {
    id: "store-thuduc",
    name: "TechExpress Thủ Đức",
    address: "35 Võ Văn Ngân, Linh Chiểu, Thủ Đức, TP.HCM",
    workingHours: "Thứ 2 - Thứ 7, 08:30 - 17:30",
  },
];

function formatPrice(value) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(value || 0);
}

function normalizePhone(value) {
  return (value || "").replace(/\s+/g, "").trim();
}

function getCombinedName(user) {
  return `${user?.firstName || ""} ${user?.lastName || ""}`.trim();
}

function getCombinedAddress(user) {
  return [user?.address, user?.ward, user?.province]
    .map((part) => (part || "").trim())
    .filter(Boolean)
    .join(", ");
}

function validateForm(form, { isInstallment }) {
  const errors = {};
  const normalizedPhone = normalizePhone(form.trackingPhone);

  if (!form.receiverFullName.trim()) {
    errors.receiverFullName = "Vui lòng nhập họ tên người nhận";
  }

  if (!form.receiverEmail.trim()) {
    errors.receiverEmail = "Vui lòng nhập email";
  } else if (!EMAIL_REGEX.test(form.receiverEmail.trim())) {
    errors.receiverEmail = "Email không hợp lệ";
  }

  if (!normalizedPhone) {
    errors.trackingPhone = "Vui lòng nhập số điện thoại";
  } else if (!PHONE_REGEX.test(normalizedPhone)) {
    errors.trackingPhone = "Số điện thoại không hợp lệ";
  }

  if (form.deliveryType === DeliveryType.Shipping && !form.shippingAddress.trim()) {
    errors.shippingAddress = "Vui lòng nhập địa chỉ giao hàng";
  }

  if (form.deliveryType === DeliveryType.PickUp && !form.pickupStoreId) {
    errors.pickupStoreId = "Vui lòng chọn tiệm nhận hàng";
  }

  if (isInstallment) {
    if (!form.receiverIdentityCard.trim()) {
      errors.receiverIdentityCard = "Vui lòng nhập CCCD/CMND";
    } else if (!IDENTITY_REGEX.test(form.receiverIdentityCard.trim())) {
      errors.receiverIdentityCard = "CCCD/CMND phải là 9 hoặc 12 chữ số";
    }

    if (!INSTALLMENT_OPTIONS.includes(Number(form.installmentDurationMonth))) {
      errors.installmentDurationMonth = "Vui lòng chọn kỳ hạn trả góp";
    }
  }

  return errors;
}

function buildPaymentTag(paymentOption) {
  if (paymentOption === PAYMENT_OPTION.QR) return "[PaymentMethod:QR]";
  if (paymentOption === PAYMENT_OPTION.COD) return "[PaymentMethod:COD]";
  return "[PaymentMethod:INSTALLMENT]";
}

export default function CheckoutPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated, loading: authLoading, logout } = useAuth();
  const items = useSelector(selectCartItems);
  const subtotal = useSelector(selectCartSubtotal);
  const invalidItems = useSelector(selectCartInvalidItems);
  const canCheckout = useSelector(selectCartCanCheckout);
  const didPrefillRef = useRef(false);
  const isPaymentReturn = searchParams.get("paymentReturn") === "1";

  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [form, setForm] = useState({
    receiverFullName: "",
    receiverEmail: "",
    trackingPhone: "",
    shippingAddress: "",
    notes: "",
    receiverIdentityCard: "",
    installmentDurationMonth: 6,
    deliveryType: DeliveryType.Shipping,
    paymentOption: PAYMENT_OPTION.QR,
    pickupStoreId: "",
  });

  const { data: userMe } = useQuery({
    enabled: isAuthenticated,
    queryKey: ["checkout-user-me"],
    queryFn: async () => {
      const res = await apiService.get("/user/me");
      if (res?.statusCode !== 200) {
        throw new Error(res?.message || "Không thể lấy thông tin người dùng");
      }
      return res.value;
    },
  });

  useEffect(() => {
    if (!isAuthenticated) {
      didPrefillRef.current = false;
      return;
    }
    if (!userMe || didPrefillRef.current) return;

    didPrefillRef.current = true;
    setForm((prev) => ({
      ...prev,
      receiverFullName: getCombinedName(userMe) || prev.receiverFullName,
      receiverEmail: userMe?.email || prev.receiverEmail,
      trackingPhone: userMe?.phone || prev.trackingPhone,
      shippingAddress: getCombinedAddress(userMe) || prev.shippingAddress,
    }));
  }, [isAuthenticated, userMe]);

  const isInstallment = form.paymentOption === PAYMENT_OPTION.INSTALLMENT;
  const selectedStore = useMemo(
    () => PICKUP_STORES.find((store) => store.id === form.pickupStoreId) || null,
    [form.pickupStoreId]
  );
  const hasFilledAddress = form.shippingAddress.trim().length > 0;
  const shippingInfoVisible =
    hasFilledAddress || form.deliveryType === DeliveryType.PickUp;

  const shippingFee =
    form.deliveryType === DeliveryType.PickUp? 0 : SHIPPING_FEE;

  const tax = Math.round(subtotal * 0.1);
  const total = subtotal + shippingFee + tax;
  const disableSubmit =
    submitting || authLoading || !canCheckout || invalidItems.length > 0 || items.length === 0;

  const setField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => {
      if (!prev[field]) return prev;
      return { ...prev, [field]: "" };
    });
  };

  const handlePaymentChange = (nextOption) => {
    if (nextOption === PAYMENT_OPTION.INSTALLMENT) {
      setField("paymentOption", nextOption);
      return;
    }

    setForm((prev) => ({
      ...prev,
      paymentOption: nextOption,
      receiverIdentityCard: "",
      installmentDurationMonth: 6,
    }));
    setErrors((prev) => ({
      ...prev,
      receiverIdentityCard: "",
      installmentDurationMonth: "",
    }));
  };

  const handleDeliveryChange = (nextType) => {
    setForm((prev) => ({
      ...prev,
      deliveryType: nextType,
      pickupStoreId: nextType === DeliveryType.Shipping ? "" : prev.pickupStoreId,
      paymentOption:
        nextType === DeliveryType.Shipping && prev.paymentOption === PAYMENT_OPTION.COD
          ? PAYMENT_OPTION.QR
          : prev.paymentOption,
    }));
    setErrors((prev) => ({
      ...prev,
      shippingAddress: "",
      pickupStoreId: "",
    }));
  };

  const handleGoLogin = () => {
    navigate("/login?redirect=/checkout");
  };

  const handleLogout = () => {
    logout();
    toast.success("Đã đăng xuất");
    setForm({
      receiverFullName: "",
      receiverEmail: "",
      trackingPhone: "",
      shippingAddress: "",
      notes: "",
      receiverIdentityCard: "",
      installmentDurationMonth: 6,
      deliveryType: DeliveryType.Shipping,
      paymentOption: PAYMENT_OPTION.QR,
      pickupStoreId: "",
    });
    setErrors({});
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (disableSubmit) return;

    if (items.length === 0) {
      toast.error("Giỏ hàng đang trống");
      return;
    }

    if (invalidItems.length > 0) {
      toast.error("Có sản phẩm không hợp lệ trong giỏ hàng");
      return;
    }

    if (isAuthenticated && items.some((item) => !item.serverItemId)) {
      toast.error("Giỏ hàng chưa đồng bộ server. Vui lòng thử lại sau");
      return;
    }

    const nextErrors = validateForm(form, { isInstallment });
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      toast.error("Vui lòng kiểm tra lại thông tin");
      return;
    }

    const notesText = [form.notes.trim(), buildPaymentTag(form.paymentOption)]
      .filter(Boolean)
      .join(" ")
      .trim();
    const shippingAddress =
      form.deliveryType === DeliveryType.PickUp
        ? `${selectedStore?.name || ""} - ${selectedStore?.address || ""}`.trim()
        : form.shippingAddress.trim();
    const paidType = isInstallment ? PaidType.Installment : PaidType.Full;

    const commonPayload = {
      deliveryType: form.deliveryType,
      receiverEmail: form.receiverEmail.trim(),
      receiverFullName: form.receiverFullName.trim(),
      shippingAddress,
      trackingPhone: normalizePhone(form.trackingPhone),
      paidType,
      receiverIdentityCard: isInstallment ? form.receiverIdentityCard.trim() : "",
      installmentDurationMonth: isInstallment
        ? Number(form.installmentDurationMonth)
        : null,
      notes: notesText,
    };

    const clearCartSafely = async () => {
      try {
        await dispatch(clearCartItems({ isAuthenticated })).unwrap();
      } catch (error) {
        console.error("Failed to clear cart after checkout", error);
      }
    };

    setSubmitting(true);
    try {
      const response = isAuthenticated
        ? await orderService.memberCheckout({
            ...commonPayload,
            selectedCartItemIds: items.map((item) => item.serverItemId),
          })
        : await orderService.guestCheckout({
            ...commonPayload,
            items: items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
            })),
          });

      if (!response.succeeded) {
        throw new Error(response.message || "Không thể tạo đơn hàng");
      }

      const orderId = response.value?.id;
      if (!orderId) {
        throw new Error("Tạo đơn hàng thành công nhưng không nhận được mã đơn");
      }

      if (form.paymentOption === PAYMENT_OPTION.QR) {
        const returnUrl = `${window.location.origin}/checkout?paymentReturn=1`;
        const initResponse = await orderService.initOnlinePayment(orderId, {
          method: ONLINE_PAYMENT_METHOD,
          returnUrl,
        });
        const paymentRedirectUrl = initResponse?.value?.url;

        if (!initResponse.succeeded || !paymentRedirectUrl) {
          await clearCartSafely();
          toast.error("Đơn hàng đã được tạo nhưng chưa khởi tạo được thanh toán online");
          navigate("/");
          return;
        }

        await clearCartSafely();
        window.location.assign(paymentRedirectUrl);
        return;
      }

      await clearCartSafely();
      toast.success("Đặt hàng thành công");
      navigate("/");
    } catch (error) {
      toast.error(error?.message || "Đặt hàng thất bại");
    } finally {
      setSubmitting(false);
    }
  };

  if (isPaymentReturn) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
          <h1 className="mb-2 text-2xl font-semibold text-slate-900">
            Bạn đã quay lại từ cổng thanh toán
          </h1>
          <p className="mb-6 text-slate-500">
            Đơn hàng đang được xử lý. Bạn có thể quay về trang chủ để tiếp tục mua sắm.
          </p>
          <Link
            to="/"
            className="inline-flex h-10 items-center rounded-md bg-[#0090D0] px-5 font-medium text-white hover:bg-[#0077B0]"
          >
            Về trang chủ
          </Link>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
          <h1 className="mb-2 text-2xl font-semibold text-slate-900">Chưa có sản phẩm để thanh toán</h1>
          <p className="mb-6 text-slate-500">Vui lòng thêm sản phẩm vào giỏ hàng trước khi checkout.</p>
          <Link
            to="/cart"
            className="inline-flex h-10 items-center rounded-md bg-[#0090D0] px-5 font-medium text-white hover:bg-[#0077B0]"
          >
            Về giỏ hàng
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-3 py-4 sm:px-4 sm:py-6">
      <div className="mb-4 text-sm text-slate-500">
        <Link to="/" className="hover:text-[#0090D0]">Trang chủ</Link> /{" "}
        <Link to="/cart" className="hover:text-[#0090D0]">Giỏ hàng</Link> /{" "}
        <span className="text-slate-700">Thanh toán</span>
      </div>

      <h1 className="mb-4 text-2xl font-semibold text-slate-900 sm:mb-6">Thanh toán đơn hàng</h1>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_340px]">
        <div className="space-y-5">
          <section className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
            <h2 className="text-lg font-semibold text-slate-900">1. Thông tin đơn hàng</h2>
            <div className="mt-4 space-y-3">
              {items.map((item) => (
                <div
                  key={item.key}
                  className="flex flex-col gap-3 rounded-lg border border-slate-100 p-3 sm:flex-row sm:items-center"
                >
                  <img
                    src={item.productImage || "https://placehold.co/96x96?text=No+Image"}
                    alt={item.productName}
                    className="h-20 w-20 rounded border border-slate-200 object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-sm font-semibold text-slate-800">{item.productName}</p>
                    <p className="mt-1 text-sm text-slate-500">SL: {item.quantity}</p>
                    <p className="text-sm text-slate-500">Đơn giá: {formatPrice(item.unitPrice)}</p>
                  </div>
                  <p className="text-sm font-semibold text-red-600">
                    {formatPrice(item.subTotal || item.unitPrice * item.quantity)}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-semibold text-slate-900">2. Thông tin nhận hàng</h2>
              <div className="flex items-center gap-2">
                {!isAuthenticated && (
                  <button
                    type="button"
                    onClick={handleGoLogin}
                    className="h-9 rounded-md border border-[#0090D0] px-3 text-sm font-medium text-[#0090D0] hover:bg-[#0090D0]/5"
                  >
                    Đăng nhập
                  </button>
                )}
                {isAuthenticated && (
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="h-9 rounded-md border border-red-300 px-3 text-sm font-medium text-red-600 hover:bg-red-50"
                  >
                    Đăng xuất
                  </button>
                )}
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <InputField
                label="Họ và tên"
                value={form.receiverFullName}
                onChange={(value) => setField("receiverFullName", value)}
                error={errors.receiverFullName}
                required
              />
              <InputField
                label="Email"
                type="email"
                value={form.receiverEmail}
                onChange={(value) => setField("receiverEmail", value)}
                error={errors.receiverEmail}
                required
              />
              <InputField
                label="Số điện thoại"
                value={form.trackingPhone}
                onChange={(value) => setField("trackingPhone", value)}
                error={errors.trackingPhone}
                required
              />
              <div className="sm:col-span-2">
                <InputField
                  label="Địa chỉ giao hàng"
                  value={form.shippingAddress}
                  onChange={(value) => setField("shippingAddress", value)}
                  error={errors.shippingAddress}
                  required={form.deliveryType === DeliveryType.Shipping}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-medium text-slate-600">Ghi chú</label>
                <textarea
                  value={form.notes}
                  onChange={(event) => setField("notes", event.target.value)}
                  rows={3}
                  className="w-full rounded border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#0090D0]"
                  placeholder="Thêm ghi chú cho đơn hàng (nếu có)"
                />
              </div>
            </div>
          </section>

          {shippingInfoVisible ? (
            <section className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
              <h2 className="text-lg font-semibold text-slate-900">3. Thông tin vận chuyển</h2>
              <p className="mt-2 text-sm text-slate-500">
                Giao thứ 2 - thứ 7 trong giờ hành chính.
              </p>

              <div className="mt-4 space-y-2">
                <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 p-3">
                  <input
                    type="radio"
                    checked={form.deliveryType === DeliveryType.Shipping}
                    onChange={() => handleDeliveryChange(DeliveryType.Shipping)}
                  />
                  <span className="text-sm text-slate-800">Giao hàng tận nơi</span>
                </label>
                <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 p-3">
                  <input
                    type="radio"
                    checked={form.deliveryType === DeliveryType.PickUp}
                    onChange={() => handleDeliveryChange(DeliveryType.PickUp)}
                  />
                  <span className="text-sm text-slate-800">Nhận tại tiệm</span>
                </label>
              </div>

              {form.deliveryType === DeliveryType.PickUp && (
                <div className="mt-4">
                  <label className="mb-1 block text-xs font-medium text-slate-600">
                    Chọn tiệm nhận hàng <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={form.pickupStoreId}
                    onChange={(event) => setField("pickupStoreId", event.target.value)}
                    className="h-10 w-full rounded border border-slate-300 px-3 text-sm outline-none focus:border-[#0090D0]"
                  >
                    <option value="">-- Chọn tiệm --</option>
                    {PICKUP_STORES.map((store) => (
                      <option key={store.id} value={store.id}>
                        {store.name}
                      </option>
                    ))}
                  </select>
                  {errors.pickupStoreId && (
                    <p className="mt-1 text-xs text-red-600">{errors.pickupStoreId}</p>
                  )}

                  {selectedStore && (
                    <div className="mt-3 rounded-md bg-slate-50 p-3 text-sm text-slate-600">
                      <p className="font-medium text-slate-800">{selectedStore.name}</p>
                      <p>{selectedStore.address}</p>
                      <p>{selectedStore.workingHours}</p>
                    </div>
                  )}
                </div>
              )}
            </section>
          ) : (
            <section className="rounded-xl border border-dashed border-slate-300 bg-white p-4 sm:p-5">
              <h2 className="text-lg font-semibold text-slate-900">3. Thông tin vận chuyển</h2>
              <p className="mt-2 text-sm text-slate-500">
                Vui lòng nhập địa chỉ giao hàng để chọn vận chuyển, hoặc chọn nhận tại tiệm.
              </p>
              <button
                type="button"
                onClick={() => handleDeliveryChange(DeliveryType.PickUp)}
                className="mt-3 h-10 rounded-md border border-slate-300 px-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Chọn nhận tại tiệm
              </button>
            </section>
          )}

          <section className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
            <h2 className="text-lg font-semibold text-slate-900">4. Option thanh toán</h2>
            <div className="mt-4 space-y-2">
              <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 p-3">
                <input
                  type="radio"
                  checked={form.paymentOption === PAYMENT_OPTION.QR}
                  onChange={() => handlePaymentChange(PAYMENT_OPTION.QR)}
                />
                <span className="text-sm text-slate-800">Chuyển khoản mã QR</span>
              </label>
              {form.deliveryType === DeliveryType.PickUp && (
                <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 p-3">
                  <input
                    type="radio"
                    checked={form.paymentOption === PAYMENT_OPTION.COD}
                    onChange={() => handlePaymentChange(PAYMENT_OPTION.COD)}
                  />
                  <span className="text-sm text-slate-800">Thanh toán khi nhận hàng</span>
                </label>
              )}
              <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 p-3">
                <input
                  type="radio"
                  checked={form.paymentOption === PAYMENT_OPTION.INSTALLMENT}
                  onChange={() => handlePaymentChange(PAYMENT_OPTION.INSTALLMENT)}
                />
                <span className="text-sm text-slate-800">Trả góp</span>
              </label>
            </div>

            {isInstallment && (
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <InputField
                  label="CCCD/CMND"
                  value={form.receiverIdentityCard}
                  onChange={(value) => setField("receiverIdentityCard", value)}
                  error={errors.receiverIdentityCard}
                  required
                />
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">
                    Kỳ hạn trả góp <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={form.installmentDurationMonth}
                    onChange={(event) =>
                      setField("installmentDurationMonth", Number(event.target.value))
                    }
                    className="h-10 w-full rounded border border-slate-300 px-3 text-sm outline-none focus:border-[#0090D0]"
                  >
                    {INSTALLMENT_OPTIONS.map((month) => (
                      <option key={month} value={month}>
                        {month} tháng
                      </option>
                    ))}
                  </select>
                  {errors.installmentDurationMonth && (
                    <p className="mt-1 text-xs text-red-600">{errors.installmentDurationMonth}</p>
                  )}
                </div>
              </div>
            )}
          </section>
        </div>

        <aside className="lg:sticky lg:top-5 lg:h-fit">
          <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
            <h2 className="text-lg font-semibold text-slate-900">Tổng kết đơn hàng</h2>
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex items-center justify-between text-slate-600">
                <span>Tạm tính</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span>Thuế VAT (10%)</span>
                <span>{formatPrice(tax)}</span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span>Phí vận chuyển</span>
                <span>{formatPrice(shippingFee)}</span>
              </div>
              <div className="border-t border-slate-200 pt-2 text-base font-semibold text-slate-900">
                <div className="flex items-center justify-between">
                  <span>Tổng cộng</span>
                  <span className="text-red-600">{formatPrice(total)}</span>
                </div>
              </div>
            </div>

            {invalidItems.length > 0 && (
              <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
                Có {invalidItems.length} sản phẩm không hợp lệ. Vui lòng quay lại giỏ hàng để điều chỉnh.
              </div>
            )}

            <button
              type="submit"
              disabled={disableSubmit}
              className="mt-4 h-11 w-full rounded-md bg-green-700 text-sm font-semibold text-white hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "ĐANG ĐẶT HÀNG..." : "ĐẶT HÀNG"}
            </button>
            <Link
              to="/cart"
              className="mt-2 inline-flex h-11 w-full items-center justify-center rounded-md border border-slate-300 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Quay lại giỏ hàng
            </Link>
          </div>
        </aside>
      </form>
    </div>
  );
}

function InputField({ label, value, onChange, error, required = false, type = "text" }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-slate-600">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 w-full rounded border border-slate-300 px-3 text-sm outline-none focus:border-[#0090D0]"
      />
      {error ? <p className="mt-1 text-xs text-red-600">{error}</p> : null}
    </div>
  );
}

