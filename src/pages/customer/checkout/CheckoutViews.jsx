import { Gift, TicketPercent } from "lucide-react";
import { Link } from "react-router-dom";

import {
  getCartLineDiscountedUnitPrice,
  getCartLineDisplaySubtotal,
  getCartLineRawSubtotal,
  getCartLineSavings,
} from "../../../utils/cartPricing";
import {
  DeliveryType,
  INSTALLMENT_OPTIONS,
  PAYMENT_OPTION,
  PICKUP_STORES,
} from "./constants";
import { formatPrice } from "./utils";

function InputField({
  label,
  value,
  onChange,
  error,
  required = false,
  type = "text",
  disabled = false,
  helperText = "",
  placeholder = "",
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-slate-600">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        placeholder={placeholder}
        className="h-10 w-full rounded border border-slate-300 px-3 text-sm outline-none focus:border-[#0090D0] disabled:cursor-not-allowed disabled:bg-slate-100"
      />
      {error ? <p className="mt-1 text-xs text-red-600">{error}</p> : null}
      {!error && helperText ? (
        <p className="mt-1 text-xs text-slate-500">{helperText}</p>
      ) : null}
    </div>
  );
}

export function CheckoutPaymentReturnView({ paymentReturnState }) {
  const { handling, handled, ok, message } = paymentReturnState;

  const title = handling
    ? "Đang xác nhận thanh toán..."
    : ok === true
      ? "Thanh toán thành công"
      : ok === false
        ? "Thanh toán thất bại"
        : "Kết quả thanh toán";

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
        <h1 className="mb-2 text-2xl font-semibold text-slate-900">{title}</h1>
        <p className="mb-6 text-slate-500">
          {message ||
            "Đang xử lý thông tin thanh toán của bạn. Vui lòng chờ trong giây lát."}
        </p>

        {handling && !handled ? (
          <div className="mb-6 text-sm text-slate-500">
            Vui lòng không tắt trình duyệt trong khi hệ thống đang xác nhận thanh toán.
          </div>
        ) : null}

        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/"
            className="inline-flex h-10 items-center rounded-md bg-[#0090D0] px-5 text-sm font-medium text-white hover:bg-[#0077B0]"
          >
            Về trang chủ
          </Link>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="inline-flex h-10 items-center rounded-md border border-slate-300 px-5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Tải lại trang
          </button>
        </div>
      </div>
    </div>
  );
}

export function CheckoutEmptyView() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
        <h1 className="mb-2 text-2xl font-semibold text-slate-900">
          Chưa có sản phẩm để thanh toán
        </h1>
        <p className="mb-6 text-slate-500">
          Vui lòng thêm sản phẩm vào giỏ hàng trước khi thanh toán.
        </p>
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

export function CheckoutFormView({
  cartState,
  authState,
  formState,
  promotionState,
  summaryState,
  handlers,
}) {
  const { checkoutItems, invalidItems } = cartState;
  const { isAuthenticated, isTrackingPhoneLocked } = authState;
  const { form, errors, isInstallment, selectedStore, submitting, disableSubmit } =
    formState;
  const {
    promotionCode,
    promotionLoading,
    promotionError,
    lastAppliedPromotionCode,
    appliedPromotions,
    unappliedPromotionMessages,
    hasPromotionDetails,
    hasPromotionSummary,
    promotionGroups,
    giftProductMap,
    selectedFreeItemsByPromotionId,
    chosenFreeProductIds,
    incompleteFreeItemSelection,
  } = promotionState;
  const {
    subtotal,
    productSavings,
    totalDiscountAmount,
    effectivePromotionDiscount,
    overlappingPromotionDiscount,
    taxableAmount,
    shippingFee,
    tax,
    total,
  } = summaryState;
  const {
    onSubmit,
    onGoLogin,
    onLogout,
    onFieldChange,
    onPromotionCodeChange,
    onApplyPromotion,
    onClearPromotion,
    onToggleGift,
    onDeliveryChange,
    onPaymentChange,
  } = handlers;

  return (
    <div className="mx-auto max-w-7xl px-3 py-4 sm:px-4 sm:py-6">
      <div className="mb-4 text-sm text-slate-500">
        <Link to="/" className="hover:text-[#0090D0]">
          Trang chủ
        </Link>{" "}
        /{" "}
        <Link to="/cart" className="hover:text-[#0090D0]">
          Giỏ hàng
        </Link>{" "}
        / <span className="text-slate-700">Thanh toán</span>
      </div>

      <h1 className="mb-4 text-2xl font-semibold text-slate-900 sm:mb-6">
        Thanh toán đơn hàng
      </h1>

      <form
        onSubmit={onSubmit}
        className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_360px]"
      >
        <div className="space-y-5">
          <section className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
            <h2 className="text-lg font-semibold text-slate-900">
              1. Sản phẩm trong giỏ hàng
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Tất cả sản phẩm trong giỏ hàng sẽ được đưa vào đơn thanh toán.
            </p>
            <div className="mt-4 space-y-3">
              {checkoutItems.map((item) => {
                const rawLineSubtotal = getCartLineRawSubtotal(item);
                const displayLineSubtotal = getCartLineDisplaySubtotal(item);
                const hasDiscountedPrice = displayLineSubtotal < rawLineSubtotal;

                return (
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
                      <p className="line-clamp-2 text-sm font-semibold text-slate-800">
                        {item.productName}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        Số lượng: {item.quantity}
                      </p>
                      <p className="text-sm text-slate-500">
                        Đơn giá: {formatPrice(item.unitPrice)}
                      </p>
                      {hasDiscountedPrice ? (
                        <div className="mt-1 space-y-1">
                          <p className="text-sm font-semibold text-red-600">
                            Giá ưu đãi:{" "}
                            {formatPrice(getCartLineDiscountedUnitPrice(item))}
                          </p>
                          <p className="text-xs text-emerald-700">
                            Tiết kiệm {formatPrice(getCartLineSavings(item))}
                          </p>
                        </div>
                      ) : null}
                    </div>
                    <div className="text-right">
                      <p
                        className={`text-sm ${
                          hasDiscountedPrice
                            ? "text-slate-400 line-through"
                            : "font-semibold text-red-600"
                        }`}
                      >
                        {formatPrice(rawLineSubtotal)}
                      </p>
                      {hasDiscountedPrice ? (
                        <p className="text-sm font-semibold text-red-600">
                          {formatPrice(displayLineSubtotal)}
                        </p>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-semibold text-slate-900">
                2. Thông tin nhận hàng
              </h2>
              <div className="flex items-center gap-2">
                {!isAuthenticated ? (
                  <button
                    type="button"
                    onClick={onGoLogin}
                    className="h-9 rounded-md border border-[#0090D0] px-3 text-sm font-medium text-[#0090D0] hover:bg-[#0090D0]/5"
                  >
                    Đăng nhập
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={onLogout}
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
                onChange={(value) => onFieldChange("receiverFullName", value)}
                error={errors.receiverFullName}
                required
              />
              <InputField
                label="Email"
                type="email"
                value={form.receiverEmail}
                onChange={(value) => onFieldChange("receiverEmail", value)}
                error={errors.receiverEmail}
                placeholder="Có thể để trống"
              />
              <InputField
                label="Số điện thoại"
                value={form.trackingPhone}
                onChange={(value) => onFieldChange("trackingPhone", value)}
                error={errors.trackingPhone}
                required
                disabled={isTrackingPhoneLocked}
                helperText={
                  isTrackingPhoneLocked
                    ? "Số điện thoại được lấy từ tài khoản thành viên và không thể thay đổi."
                    : "Số điện thoại này sẽ được dùng để kiểm tra khuyến mãi và theo dõi đơn hàng."
                }
              />
              <div className="sm:col-span-2">
                <InputField
                  label="Địa chỉ giao hàng"
                  value={form.shippingAddress}
                  onChange={(value) => onFieldChange("shippingAddress", value)}
                  error={errors.shippingAddress}
                  required={form.deliveryType === DeliveryType.Shipping}
                  disabled={form.deliveryType === DeliveryType.PickUp}
                  placeholder={
                    form.deliveryType === DeliveryType.PickUp
                      ? "Không cần nhập khi nhận tại cửa hàng"
                      : "Nhập số nhà, đường, phường/xã, tỉnh/thành"
                  }
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-medium text-slate-600">
                  Ghi chú
                </label>
                <textarea
                  value={form.notes}
                  onChange={(event) => onFieldChange("notes", event.target.value)}
                  rows={3}
                  className="w-full rounded border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#0090D0]"
                  placeholder="Thêm ghi chú cho đơn hàng nếu cần"
                />
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
            <div className="flex items-center gap-2">
              <TicketPercent size={18} className="text-[#0090D0]" />
              <h2 className="text-lg font-semibold text-slate-900">3. Mã khuyến mãi</h2>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto_auto]">
              <input
                type="text"
                value={promotionCode}
                onChange={(event) => onPromotionCodeChange(event.target.value)}
                className="h-11 rounded border border-slate-300 px-3 text-sm uppercase outline-none focus:border-[#0090D0]"
                placeholder="Nhập mã khuyến mãi"
              />
              <button
                type="button"
                onClick={onApplyPromotion}
                disabled={promotionLoading || checkoutItems.length === 0}
                className="h-11 rounded-md bg-[#0090D0] px-4 text-sm font-semibold text-white hover:bg-[#0077B0] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {promotionLoading ? "Đang kiểm tra..." : "Áp dụng"}
              </button>
              <button
                type="button"
                onClick={onClearPromotion}
                className="h-11 rounded-md border border-slate-300 px-4 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Xóa mã
              </button>
            </div>

            <p className="mt-2 text-sm text-slate-500">
              Khuyến mãi sẽ được kiểm tra theo các sản phẩm trong giỏ hàng và số điện
              thoại ở trên.
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Hệ thống hiện áp dụng khuyến mãi theo toàn bộ sản phẩm trong giỏ hàng.
            </p>

            {promotionError ? (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {promotionError}
              </div>
            ) : null}

            {hasPromotionDetails ? (
              <div className="mt-4 space-y-3">
                {lastAppliedPromotionCode ? (
                  <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
                    Đang áp dụng mã{" "}
                    <span className="font-semibold">{lastAppliedPromotionCode}</span>.
                  </div>
                ) : null}

                {appliedPromotions.map((promotion) => (
                  <div
                    key={promotion.promotionId}
                    className="rounded-lg border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <div className="font-semibold text-slate-900">
                          {promotion.promotionName}
                        </div>
                        <div className="text-sm text-slate-500">
                          Mã: {promotion.promotionCode || "Tự động áp dụng"}
                        </div>
                      </div>
                      <div className="text-sm font-semibold text-red-600">
                        Giảm {formatPrice(promotion.discountAmount)}
                      </div>
                    </div>
                  </div>
                ))}

                {unappliedPromotionMessages.length > 0 ? (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
                    {unappliedPromotionMessages.map((message) => (
                      <p key={message}>{message}</p>
                    ))}
                  </div>
                ) : null}

                {promotionGroups.length > 0 ? (
                  <div className="rounded-lg border border-slate-200 p-4">
                    <div className="flex items-center gap-2">
                      <Gift size={18} className="text-[#0090D0]" />
                      <h3 className="font-semibold text-slate-900">Quà tặng</h3>
                    </div>

                    <div className="mt-4 space-y-4">
                      {promotionGroups.map((group) => (
                        <div key={group.promotionId} className="space-y-3">
                          <div>
                            <p className="font-medium text-slate-900">
                              {group.promotionName}
                            </p>
                            <p className="text-sm text-slate-500">
                              {group.isSelectable
                                ? `Chọn ${group.requiredPickCount} sản phẩm quà tặng.`
                                : "Quà tặng được thêm tự động cùng đơn hàng."}
                            </p>
                          </div>

                          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                            {group.items.map((giftItem) => {
                              const product = giftProductMap[giftItem.productId];
                              const selectedGiftIds =
                                selectedFreeItemsByPromotionId[group.promotionId] || [];
                              const checked = selectedGiftIds.includes(
                                giftItem.productId,
                              );

                              return (
                                <button
                                  key={`${group.promotionId}-${giftItem.productId}`}
                                  type="button"
                                  onClick={() => onToggleGift(group, giftItem.productId)}
                                  disabled={!group.isSelectable}
                                  className={`flex items-center gap-3 rounded-lg border p-3 text-left transition-colors ${
                                    checked
                                      ? "border-[#0090D0] bg-[#0090D0]/5"
                                      : "border-slate-200 bg-white"
                                  } ${
                                    group.isSelectable
                                      ? "hover:border-[#0090D0]/50"
                                      : "cursor-default"
                                  }`}
                                >
                                  <img
                                    src={
                                      product?.firstImageUrl ||
                                      "https://placehold.co/80x80?text=Gift"
                                    }
                                    alt={product?.name || giftItem.productId}
                                    className="h-16 w-16 rounded border border-slate-200 object-cover"
                                  />
                                  <div className="min-w-0 flex-1">
                                    <div className="line-clamp-2 text-sm font-semibold text-slate-800">
                                      {product?.name || `Sản phẩm #${giftItem.productId}`}
                                    </div>
                                    <div className="mt-1 text-sm text-slate-500">
                                      Số lượng quà: {giftItem.quantity}
                                    </div>
                                    {group.isSelectable ? (
                                      <div className="mt-1 text-xs text-[#0090D0]">
                                        {checked ? "Đã chọn" : "Nhấn để chọn quà"}
                                      </div>
                                    ) : (
                                      <div className="mt-1 text-xs text-emerald-600">
                                        Tự động tặng
                                      </div>
                                    )}
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
            <h2 className="text-lg font-semibold text-slate-900">
              4. Hình thức nhận hàng
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Bạn có thể nhận tại cửa hàng hoặc giao hàng tận nơi.
            </p>

            <div className="mt-4 space-y-2">
              <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 p-3">
                <input
                  type="radio"
                  checked={form.deliveryType === DeliveryType.Shipping}
                  onChange={() => onDeliveryChange(DeliveryType.Shipping)}
                />
                <span className="text-sm text-slate-800">Giao hàng tận nơi</span>
              </label>
              <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 p-3">
                <input
                  type="radio"
                  checked={form.deliveryType === DeliveryType.PickUp}
                  onChange={() => onDeliveryChange(DeliveryType.PickUp)}
                />
                <span className="text-sm text-slate-800">Nhận tại cửa hàng</span>
              </label>
            </div>

            {form.deliveryType === DeliveryType.PickUp ? (
              <div className="mt-4">
                <label className="mb-1 block text-xs font-medium text-slate-600">
                  Chọn cửa hàng nhận hàng <span className="text-red-500">*</span>
                </label>
                <select
                  value={form.pickupStoreId}
                  onChange={(event) => onFieldChange("pickupStoreId", event.target.value)}
                  className="h-10 w-full rounded border border-slate-300 px-3 text-sm outline-none focus:border-[#0090D0]"
                >
                  <option value="">-- Chọn cửa hàng --</option>
                  {PICKUP_STORES.map((store) => (
                    <option key={store.id} value={store.id}>
                      {store.name}
                    </option>
                  ))}
                </select>
                {errors.pickupStoreId ? (
                  <p className="mt-1 text-xs text-red-600">{errors.pickupStoreId}</p>
                ) : null}

                {selectedStore ? (
                  <div className="mt-3 rounded-md bg-slate-50 p-3 text-sm text-slate-600">
                    <p className="font-medium text-slate-800">{selectedStore.name}</p>
                    <p>{selectedStore.address}</p>
                    <p>{selectedStore.workingHours}</p>
                  </div>
                ) : null}
              </div>
            ) : null}
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
            <h2 className="text-lg font-semibold text-slate-900">
              5. Phương thức thanh toán
            </h2>
            <div className="mt-4 space-y-2">
              <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 p-3">
                <input
                  type="radio"
                  checked={form.paymentOption === PAYMENT_OPTION.QR}
                  onChange={() => onPaymentChange(PAYMENT_OPTION.QR)}
                />
                <span className="text-sm text-slate-800">
                  Thanh toán online qua mã QR
                </span>
              </label>

              <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 p-3">
                <input
                  type="radio"
                  checked={form.paymentOption === PAYMENT_OPTION.INSTALLMENT}
                  onChange={() => onPaymentChange(PAYMENT_OPTION.INSTALLMENT)}
                />
                <span className="text-sm text-slate-800">Trả góp</span>
              </label>
            </div>

            {isInstallment ? (
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <InputField
                  label="CCCD/CMND"
                  value={form.receiverIdentityCard}
                  onChange={(value) => onFieldChange("receiverIdentityCard", value)}
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
                      onFieldChange(
                        "installmentDurationMonth",
                        Number(event.target.value),
                      )
                    }
                    className="h-10 w-full rounded border border-slate-300 px-3 text-sm outline-none focus:border-[#0090D0]"
                  >
                    {INSTALLMENT_OPTIONS.map((month) => (
                      <option key={month} value={month}>
                        {month} tháng
                      </option>
                    ))}
                  </select>
                  {errors.installmentDurationMonth ? (
                    <p className="mt-1 text-xs text-red-600">
                      {errors.installmentDurationMonth}
                    </p>
                  ) : null}
                </div>
              </div>
            ) : null}
          </section>
        </div>

        <aside className="lg:sticky lg:top-5 lg:h-fit">
          <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
            <h2 className="text-lg font-semibold text-slate-900">
              Tổng kết đơn hàng
            </h2>

            <div className="mt-4 space-y-2 text-sm">
              <div className="flex items-center justify-between text-slate-600">
                <span>Tổng Sản phẩm</span>
                <span>{checkoutItems.length} sp</span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span>Tạm tính</span>
                <span className="flex flex-col items-end">
                  {productSavings > 0 ? (
                    <span className="text-xs text-slate-400 line-through">
                      {formatPrice(subtotal + productSavings)}
                    </span>
                  ) : null}
                  <span>{formatPrice(subtotal)}</span>
                </span>
              </div>
              {productSavings > 0 ? (
                <div className="flex items-center justify-between text-emerald-600">
                  <span>Tiết kiệm từ giá sản phẩm</span>
                  <span>-{formatPrice(productSavings)}</span>
                </div>
              ) : null}
              {effectivePromotionDiscount > 0 ? (
                <div className="flex items-center justify-between text-slate-600">
                  <span>Giảm thêm từ khuyến mãi</span>
                  <span className="text-emerald-600">
                    -{formatPrice(effectivePromotionDiscount)}
                  </span>
                </div>
              ) : null}
              <div className="flex items-center justify-between text-slate-600">
                <span>Tổng sau giảm</span>
                <span>{formatPrice(taxableAmount)}</span>
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

            {hasPromotionSummary ? (
              <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm">
                <p className="font-semibold text-slate-900">
                  {lastAppliedPromotionCode
                    ? `Mã khuyến mãi: ${lastAppliedPromotionCode}`
                    : "Khuyến mãi tự động đang áp dụng"}
                </p>
                {effectivePromotionDiscount > 0 ? (
                  <p className="mt-1 text-slate-600">
                    Giảm thêm dự kiến: {formatPrice(effectivePromotionDiscount)}
                  </p>
                ) : null}
                {overlappingPromotionDiscount > 0 ? (
                  <p className="mt-1 text-slate-600">
                    Ưu đãi hệ thống đã được tính trực tiếp vào giá sản phẩm.
                  </p>
                ) : null}
                {totalDiscountAmount > 0 ? (
                  <p className="mt-1 text-slate-500">
                    Tổng ưu đãi từ khuyến mãi: {formatPrice(totalDiscountAmount)}
                  </p>
                ) : null}
                {chosenFreeProductIds.length > 0 ? (
                  <p className="mt-1 text-slate-600">
                    Quà tặng đã chọn: {chosenFreeProductIds.length} sản phẩm
                  </p>
                ) : null}
              </div>
            ) : null}

            {invalidItems.length > 0 ? (
              <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
                Có sản phẩm không hợp lệ trong danh sách thanh toán. Vui lòng quay
                lại giỏ hàng để kiểm tra.
              </div>
            ) : null}

            {incompleteFreeItemSelection ? (
              <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
                Bạn cần chọn đủ quà tặng trước khi đặt hàng.
              </div>
            ) : null}

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
