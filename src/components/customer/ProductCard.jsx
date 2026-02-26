import { useState } from "react";
import { NavLink } from "react-router-dom";
import { Heart, ShoppingCart, Package } from "lucide-react";
import { useDispatch } from "react-redux";
import { toast } from "sonner";
import { useAuth } from "../../store/authContext";
import { addCartItem } from "../../store/slices/cartSlice";

const formatPrice = (price) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(price);

export default function ProductCard({ product, badge, showRank }) {
  const dispatch = useDispatch();
  const { isAuthenticated } = useAuth();
  const [hovered, setHovered] = useState(false);

  const stock = Math.max(Number(product.stockQty ?? product.stock ?? 0) || 0, 0);
  const isOutOfStock = product.status === "Unavailable" || stock === 0;

  const handleAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!product?.id) {
      toast.error("Không tìm thấy thông tin sản phẩm");
      return;
    }

    if (isOutOfStock) {
      toast.error("Sản phẩm đã hết hàng");
      return;
    }

    try {
      await dispatch(
        addCartItem({
          productId: product.id,
          quantity: 1,
          isAuthenticated,
          meta: {
            productName: product.name,
            productImage: product.firstImageUrl,
            unitPrice: product.price,
            availableStock: stock,
            productStatus: product.status || "Available",
          },
        })
      ).unwrap();

      toast.success("Đã thêm vào giỏ hàng");
    } catch (error) {
      toast.error(error || "Không thể thêm vào giỏ hàng");
    }
  };

  const handleWishlist = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toast.info("Tính năng yêu thích sẽ sớm có");
  };

  return (
    <NavLink
      to={`/products/${product.id}`}
      className="group block bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg border border-slate-100 hover:border-[#0090D0]/30 transition-all"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="relative aspect-square bg-slate-50 overflow-hidden">
        {product.firstImageUrl ? (
          <img
            src={product.firstImageUrl}
            alt={product.name}
            className="w-full h-full object-contain transition-transform duration-300"
            style={{ transform: hovered ? "scale(1.05)" : "scale(1)" }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package size={48} className="text-slate-300" />
          </div>
        )}

        {badge && !showRank && (
          <span className="absolute top-3 left-3 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
            {badge}
          </span>
        )}

        {showRank && (
          <span className="absolute top-3 left-3 bg-yellow-400 text-slate-900 text-sm font-bold w-8 h-8 rounded-full flex items-center justify-center shadow">
            #{showRank}
          </span>
        )}

        {isOutOfStock && (
          <span className="absolute top-3 right-3 bg-slate-600 text-white text-xs px-2 py-1 rounded">
            Hết hàng
          </span>
        )}

        {/* Desktop: hiện khi hover | Mobile: luôn hiện ở dưới cùng */}
        <div
          className="absolute bottom-3 left-3 right-3 flex gap-2 transition-opacity duration-200 sm:pointer-events-none"
          style={{
            opacity: hovered ? 1 : 0,
            pointerEvents: hovered ? "auto" : "none",
          }}
        >
          <button
            onClick={handleAddToCart}
            disabled={isOutOfStock}
            className="flex-1 bg-[#0090D0] hover:bg-[#0077B0] disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-sm font-semibold py-2 px-3 rounded-lg flex items-center justify-center gap-1 transition-colors"
          >
            <ShoppingCart size={16} />
            <span>Thêm vào giỏ</span>
          </button>
          <button
            onClick={handleWishlist}
            className="bg-white hover:bg-slate-100 text-slate-600 p-2 rounded-lg border border-slate-200 transition-colors"
          >
            <Heart size={16} />
          </button>
        </div>
      </div>

      <div className="p-4">
        {product.categoryName && (
          <div className="text-xs text-[#0090D0] font-medium mb-1 uppercase tracking-wide">
            {product.categoryName}
          </div>
        )}

        <h3
          className="font-semibold mb-2 line-clamp-2 min-h-[2.5rem] transition-colors"
          style={{ color: hovered ? "#0090D0" : "#1e293b" }}
        >
          {product.name}
        </h3>

        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-red-600">{formatPrice(product.price)}</span>
        </div>

        {/* Mobile: nút thêm vào giỏ cố định dưới giá */}
        <div className="flex gap-2 mt-3 sm:hidden">
          <button
            onClick={handleAddToCart}
            disabled={isOutOfStock}
            className="flex-1 bg-[#0090D0] disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-sm font-semibold py-2 px-3 rounded-lg flex items-center justify-center gap-1 transition-colors"
          >
            <ShoppingCart size={16} />
            <span>{isOutOfStock ? "Hết hàng" : ""}</span>
          </button>
          <button
            onClick={handleWishlist}
            className="bg-slate-100 text-slate-600 p-2 rounded-lg border border-slate-200"
          >
            <Heart size={14} />
          </button>
        </div>

        {stock > 0 && stock <= 10 && (
          <div className="text-xs text-orange-600 mt-2">Chỉ còn {stock} sản phẩm</div>
        )}
      </div>
    </NavLink>
  );
}