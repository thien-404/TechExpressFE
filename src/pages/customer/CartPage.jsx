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
  selectCartInvalidItems,
  selectCartItemCount,
  selectCartItems,
  selectCartSubtotal,
} from "../../store/slices/cartSlice";

function formatPrice(value) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(value || 0);
}

export default function CartPage() {
  const dispatch = useDispatch();
  const { isAuthenticated } = useAuth();
  const items = useSelector(selectCartItems);
  const itemCount = useSelector(selectCartItemCount);
  const subtotal = useSelector(selectCartSubtotal);
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
      toast.warning(`So luong toi da co the mua la ${maxStock}`);
    }

    try {
      await dispatch(
        changeCartItemQuantity({
          serverItemId: item.serverItemId,
          productId: item.productId,
          quantity: clampedQuantity,
          isAuthenticated,
        })
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
        })
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
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
          <h1 className="text-2xl font-semibold text-slate-800 mb-2">Giỏ hàng trống</h1>
          <p className="text-slate-500 mb-6">
            bạn chưa có sản phẩm nào trong giỏ hàng.
          </p>
          <Link
            to="/"
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-md bg-[#0090D0] text-white font-medium hover:bg-[#0077B0] transition-colors"
          >
            Quay lại trang chủ
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 space-y-4">
          <h1 className="text-2xl font-semibold text-slate-900">Giỏ hàng</h1>

          {items.map((item) => (
            <div
              key={item.key}
              className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col sm:flex-row gap-4"
            >
              <img
                src={item.productImage || "https://placehold.co/120x120?text=No+Image"}
                alt={item.productName}
                className="w-24 h-24 object-cover rounded-md border border-slate-200"
              />

              <div className="flex-1">
                <Link to={`/products/${item.productId}`}>
                  <h2 className="font-semibold text-slate-800 hover:text-[#0090D0]">{item.productName}</h2>
                </Link>
                <div className="text-sm text-slate-500 mt-1">
                  Đơn giá: {formatPrice(item.unitPrice)}
                </div>
                {item.availableStock !== null && (
                  <div className="text-xs text-slate-500 mt-1">
                    Tồn kho: {item.availableStock}
                  </div>
                )}

                <div className="mt-3 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleChangeQuantity(item, item.quantity - 1)}
                    className="w-8 h-8 rounded border border-slate-300 text-slate-700 hover:bg-slate-100"
                    disabled={actionLoading.update}
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min={0}
                    value={item.quantity}
                    onChange={(e) => handleChangeQuantity(item, e.target.value)}
                    className="w-16 h-8 text-center border border-slate-300 rounded outline-none focus:border-[#0090D0]"
                    disabled={actionLoading.update}
                  />
                  <button
                    type="button"
                    onClick={() => handleChangeQuantity(item, item.quantity + 1)}
                    className="w-8 h-8 rounded border border-slate-300 text-slate-700 hover:bg-slate-100"
                    disabled={actionLoading.update}
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="sm:text-right flex sm:flex-col sm:items-end justify-between gap-3">
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
          ))}
        </div>

        <aside className="lg:w-80">
          <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
            <h2 className="text-lg font-semibold text-slate-900">Tổng kết đơn hàng</h2>
            <div className="flex justify-between text-sm text-slate-600">
              <span>Tổng số lượng</span>
              <span>{itemCount}</span>
            </div>
            <div className="flex justify-between text-base font-semibold text-slate-900">
              <span>Thành tiền</span>
              <span className="text-red-600">{formatPrice(subtotal)}</span>
            </div>

            {invalidItems.length > 0 && (
              <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
                Có {invalidItems.length} sản phẩm không hợp lệ do hết hàng/trạng thái.
                Vui lòng điều chỉnh trước khi thanh toán.
              </div>
            )}

            <button
              type="button"
              disabled={!canCheckout}
              className="w-full h-11 rounded-md bg-green-700 hover:bg-green-800 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Thanh toán
            </button>

            <button
              type="button"
              onClick={handleClearCart}
              disabled={actionLoading.clear}
              className="w-full h-11 rounded-md border border-slate-300 text-slate-700 hover:bg-slate-50 font-medium disabled:opacity-60"
            >
              Xóa toàn bộ
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
