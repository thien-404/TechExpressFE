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
  selectCartAllSelectableSelected,
  selectCartCanCheckout,
  selectCartInvalidItems,
  selectCartItemCount,
  selectCartItems,
  selectCartSelectedItemKeys,
  selectCartSelectedItemCount,
  selectCartSelectedLineCount,
  selectCartSelectedSubtotal,
  toggleCartItemSelection,
  toggleSelectAllCartItems,
} from "../../store/slices/cartSlice";

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

export default function CartPage() {
  const dispatch = useDispatch();
  const { isAuthenticated } = useAuth();

  const items = useSelector(selectCartItems);
  const selectedItemKeys = useSelector(selectCartSelectedItemKeys);
  const itemCount = useSelector(selectCartItemCount);
  const selectedItemCount = useSelector(selectCartSelectedItemCount);
  const selectedLineCount = useSelector(selectCartSelectedLineCount);
  const selectedSubtotal = useSelector(selectCartSelectedSubtotal);
  const invalidItems = useSelector(selectCartInvalidItems);
  const canCheckout = useSelector(selectCartCanCheckout);
  const allSelectableSelected = useSelector(selectCartAllSelectableSelected);
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
          <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-slate-900">Giỏ hàng</h1>
              <p className="mt-1 text-sm text-slate-500">
                Chọn những sản phẩm bạn muốn mang sang bước thanh toán.
              </p>
            </div>

            <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-700">
              <input
                type="checkbox"
                checked={allSelectableSelected}
                onChange={() => dispatch(toggleSelectAllCartItems())}
                className="h-4 w-4 rounded border-slate-300 text-[#0090D0] focus:ring-[#0090D0]"
              />
              Chọn tất cả sản phẩm hợp lệ
            </label>
          </div>

          {items.map((item) => {
            const issueLabel = getItemIssueLabel(item);
            const isSelectable = !issueLabel;

            return (
              <div
                key={item.key}
                className={`rounded-xl border bg-white p-4 ${
                  isSelectable
                    ? "border-slate-200"
                    : "border-amber-200 bg-amber-50/40"
                }`}
              >
                <div className="flex flex-col gap-4 sm:flex-row">
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={Boolean(
                        isSelectable && selectedItemKeys.includes(item.key),
                      )}
                      onChange={() => dispatch(toggleCartItemSelection(item.key))}
                      disabled={!isSelectable}
                      className="mt-1 h-4 w-4 rounded border-slate-300 text-[#0090D0] focus:ring-[#0090D0] disabled:cursor-not-allowed"
                    />

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

                    <div className="mt-1 text-sm text-slate-500">
                      Đơn giá: {formatPrice(item.unitPrice)}
                    </div>

                    {item.availableStock !== null && (
                      <div className="mt-1 text-xs text-slate-500">
                        Tồn kho: {item.availableStock}
                      </div>
                    )}

                    {issueLabel && (
                      <div className="mt-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
                        {issueLabel}
                      </div>
                    )}

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
                    <div className="font-semibold text-red-600">
                      {formatPrice(item.subTotal || item.unitPrice * item.quantity)}
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
              <span>Tổng số lượng sẽ mua</span>
              <span>{selectedItemCount}</span>
            </div>

            <div className="flex justify-between text-base font-semibold text-slate-900">
              <span>Tạm tính</span>
              <span className="text-red-600">
                {formatPrice(selectedSubtotal)}
              </span>
            </div>

            {invalidItems.length > 0 && (
              <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
                Có {invalidItems.length} sản phẩm không hợp lệ trong giỏ. Bạn vẫn
                có thể thanh toán các sản phẩm hợp lệ đã chọn.
              </div>
            )}

            {canCheckout ? (
              <Link
                to="/checkout"
                className="inline-flex h-11 w-full items-center justify-center rounded-md bg-green-700 font-semibold text-white hover:bg-green-800"
              >
                Thanh toán các sản phẩm đã chọn
              </Link>
            ) : (
              <button
                type="button"
                disabled
                className="h-11 w-full rounded-md bg-green-700 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                Chọn sản phẩm để thanh toán
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
