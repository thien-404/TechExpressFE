import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

import { useAuth } from "../../store/authContext";
import {
  changeCartItemQuantity,
  clearCartItems,
  removeCartItem,
  selectCartActionLoading,
  selectCartCanCheckout,
  selectCartDisplaySubtotal,
  selectCartInvalidItems,
  selectCartItemCount,
  selectCartItems,
  selectCartProductSavings,
  selectCartSubtotal,
} from "../../store/slices/cartSlice";
import {
  getCartLineDiscountedUnitPrice,
  getCartLineDisplaySubtotal,
  getCartLineRawSubtotal,
  getCartLineSavings,
} from "../../utils/cartPricing";

function formatPrice(value) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(value || 0);
}

function getItemIssueLabel(item) {
  if (item?.productStatus && item.productStatus !== "Available") {
    return "Sản phẩm hiện không còn kinh doanh.";
  }

  if (item?.availableStock !== null && item?.availableStock <= 0) {
    return "Sản phẩm đã hết hàng.";
  }

  if (item?.availableStock !== null && item?.quantity > item.availableStock) {
    return `Số lượng vượt quá tồn kho hiện tại (${item.availableStock}).`;
  }

  return "";
}

function getPromotionBadgeLabel(item) {
  if (!item?.hasCartPromotion) {
    return "";
  }

  const discountValue = Number(item?.discountValue);
  if (!Number.isFinite(discountValue) || discountValue <= 0) {
    return "Ưu đãi tự động";
  }

  if (item?.promotionType === "PercentageDiscount") {
    return `Giảm ${discountValue}%`;
  }

  if (item?.promotionType === "FixedPrice") {
    return `Giá chỉ ${formatPrice(discountValue)}`;
  }

  if (item?.promotionType === "FixedDiscount") {
    return `Giảm ${formatPrice(discountValue)}`;
  }

  return "Ưu đãi tự động";
}

export default function CartPage() {
  const dispatch = useDispatch();
  const { isAuthenticated } = useAuth();

  const items = useSelector(selectCartItems);
  const itemCount = useSelector(selectCartItemCount);
  const rawSubtotal = useSelector(selectCartSubtotal);
  const displaySubtotal = useSelector(selectCartDisplaySubtotal);
  const productSavings = useSelector(selectCartProductSavings);
  const invalidItems = useSelector(selectCartInvalidItems);
  const canCheckout = useSelector(selectCartCanCheckout);
  const actionLoading = useSelector(selectCartActionLoading);

  const handleChangeQuantity = async (item, nextQuantity) => {
    const safeQuantity = Math.max(Number(nextQuantity) || 0, 0);
    const maxStock =
      item.availableStock === null ? null : Math.max(item.availableStock, 0);
    const clampedQuantity =
      maxStock === null ? safeQuantity : Math.min(safeQuantity, maxStock);

    if (safeQuantity > 0 && maxStock !== null && safeQuantity > maxStock) {
      toast.warning(`Số lượng tối đa có thể mua là ${maxStock}`);
    }

    try {
      await dispatch(
        changeCartItemQuantity({
          serverItemId: item.serverItemId,
          productId: item.productId,
          quantity: clampedQuantity,
          isAuthenticated,
        }),
      ).unwrap();
    } catch (error) {
      toast.error(error || "Không thể cập nhật số lượng");
    }
  };

  const handleRemoveItem = async (item) => {
    try {
      await dispatch(
        removeCartItem({
          serverItemId: item.serverItemId,
          productId: item.productId,
          isAuthenticated,
        }),
      ).unwrap();
      toast.success("Đã xóa sản phẩm khỏi giỏ hàng");
    } catch (error) {
      toast.error(error || "Không thể xóa sản phẩm");
    }
  };

  const handleClearCart = async () => {
    if (!window.confirm("Bạn chắc chắn muốn xóa toàn bộ giỏ hàng?")) {
      return;
    }

    try {
      await dispatch(clearCartItems({ isAuthenticated })).unwrap();
      toast.success("Đã xóa toàn bộ giỏ hàng");
    } catch (error) {
      toast.error(error || "Không thể xóa giỏ hàng");
    }
  };

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
          <h1 className="mb-2 text-2xl font-semibold text-slate-800">
            Giỏ hàng trống
          </h1>
          <p className="mb-6 text-slate-500">
            Bạn chưa có sản phẩm nào trong giỏ hàng.
          </p>
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-[#0090D0] px-5 py-2.5 font-medium text-white transition-colors hover:bg-[#0077B0]"
          >
            Quay lại trang chủ
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="flex flex-col gap-6 lg:flex-row">
        <div className="flex-1 space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <h1 className="text-2xl font-semibold text-slate-900">Giỏ hàng</h1>
            <p className="mt-1 text-sm text-slate-500">
              Kiểm tra lại sản phẩm, số lượng và giá trước khi thanh toán.
            </p>
          </div>

          {items.map((item) => {
            const issueLabel = getItemIssueLabel(item);
            const rawLineSubtotal = getCartLineRawSubtotal(item);
            const displayLineSubtotal = getCartLineDisplaySubtotal(item);
            const discountedUnitPrice = getCartLineDiscountedUnitPrice(item);
            const lineSavings = getCartLineSavings(item);
            const hasVisibleDiscount =
              Boolean(item?.hasCartPromotion) &&
              displayLineSubtotal < rawLineSubtotal;
            const promotionBadgeLabel = getPromotionBadgeLabel(item);

            return (
              <div
                key={item.key}
                className={`rounded-xl border bg-white p-4 ${
                  issueLabel
                    ? "border-amber-200 bg-amber-50/40"
                    : "border-slate-200"
                }`}
              >
                <div className="flex flex-col gap-4 sm:flex-row">
                  <div className="flex items-start gap-3">
                    <img
                      src={
                        item.productImage ||
                        "https://placehold.co/120x120?text=No+Image"
                      }
                      alt={item.productName}
                      className="h-24 w-24 rounded-md border border-slate-200 object-cover"
                    />
                  </div>

                  <div className="flex-1">
                    <Link to={`/products/${item.productId}`}>
                      <h2 className="font-semibold text-slate-800 transition-colors hover:text-[#0090D0]">
                        {item.productName}
                      </h2>
                    </Link>

                    {hasVisibleDiscount ? (
                      <div className="mt-2 space-y-1">
                        <div className="flex flex-wrap items-center gap-2 text-sm">
                          <span className="text-slate-400 line-through">
                            {formatPrice(item.unitPrice)}
                          </span>
                          {promotionBadgeLabel ? (
                            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                              {promotionBadgeLabel}
                            </span>
                          ) : null}
                        </div>
                        <div className="text-sm font-semibold text-red-600">
                          Giá ưu đãi: {formatPrice(discountedUnitPrice)}
                        </div>
                        <div className="text-xs text-emerald-700">
                          Tiết kiệm {formatPrice(lineSavings)}
                        </div>
                      </div>
                    ) : (
                      <div className="mt-1 text-sm text-slate-500">
                        Đơn giá: {formatPrice(item.unitPrice)}
                      </div>
                    )}

                    {item.availableStock !== null ? (
                      <div className="mt-1 text-xs text-slate-500">
                        Tồn kho: {item.availableStock}
                      </div>
                    ) : null}

                    {issueLabel ? (
                      <div className="mt-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
                        {issueLabel}
                      </div>
                    ) : null}

                    <div className="mt-3 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleChangeQuantity(item, item.quantity - 1)}
                        className="h-8 w-8 rounded border border-slate-300 text-slate-700 hover:bg-slate-100"
                        disabled={actionLoading.update}
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min={0}
                        value={item.quantity}
                        onChange={(event) =>
                          handleChangeQuantity(item, event.target.value)
                        }
                        className="h-8 w-16 rounded border border-slate-300 text-center outline-none focus:border-[#0090D0]"
                        disabled={actionLoading.update}
                      />
                      <button
                        type="button"
                        onClick={() => handleChangeQuantity(item, item.quantity + 1)}
                        className="h-8 w-8 rounded border border-slate-300 text-slate-700 hover:bg-slate-100"
                        disabled={actionLoading.update}
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-between gap-3 sm:flex-col sm:items-end">
                    <div className="text-right">
                      {hasVisibleDiscount ? (
                        <div className="text-sm text-slate-400 line-through">
                          {formatPrice(rawLineSubtotal)}
                        </div>
                      ) : null}
                      <div className="font-semibold text-red-600">
                        {formatPrice(displayLineSubtotal)}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(item)}
                      className="inline-flex items-center gap-1 text-sm text-red-600 hover:text-red-700"
                      disabled={actionLoading.remove}
                    >
                      <Trash2 size={15} />
                      Xóa
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <aside className="lg:w-80">
          <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
            <h2 className="text-lg font-semibold text-slate-900">
              Tổng kết đơn hàng
            </h2>

            <div className="flex justify-between text-sm text-slate-600">
              <span>Tổng số lượng trong giỏ</span>
              <span>{itemCount}</span>
            </div>

            <div className="flex justify-between text-sm text-slate-600">
              <span>Số mặt hàng</span>
              <span>{items.length}</span>
            </div>

            <div className="flex justify-between text-base font-semibold text-slate-900">
              <span>Tạm tính</span>
              <span className="flex flex-col items-end">
                {productSavings > 0 ? (
                  <span className="text-xs font-medium text-slate-400 line-through">
                    {formatPrice(rawSubtotal)}
                  </span>
                ) : null}
                <span className="text-red-600">{formatPrice(displaySubtotal)}</span>
              </span>
            </div>

            {productSavings > 0 ? (
              <div className="flex justify-between text-sm text-emerald-700">
                <span>Tiết kiệm từ giá sản phẩm</span>
                <span>-{formatPrice(productSavings)}</span>
              </div>
            ) : null}

            {invalidItems.length > 0 ? (
              <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
                Có {invalidItems.length} sản phẩm không hợp lệ trong giỏ. Vui
                lòng cập nhật số lượng hoặc xóa các sản phẩm này trước khi thanh
                toán.
              </div>
            ) : null}

            {canCheckout ? (
              <Link
                to="/checkout"
                className="inline-flex h-11 w-full items-center justify-center rounded-md bg-green-700 font-semibold text-white hover:bg-green-800"
              >
                Thanh toán toàn bộ giỏ hàng
              </Link>
            ) : (
              <button
                type="button"
                disabled
                className="h-11 w-full rounded-md bg-green-700 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cần xử lý sản phẩm không hợp lệ
              </button>
            )}

            <button
              type="button"
              onClick={handleClearCart}
              disabled={actionLoading.clear}
              className="h-11 w-full rounded-md border border-slate-300 font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
            >
              Xóa toàn bộ giỏ hàng
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
