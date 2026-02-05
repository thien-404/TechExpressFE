import { NavLink } from 'react-router-dom'
import { Heart, ShoppingCart, Package } from 'lucide-react'
import { useDispatch } from 'react-redux'
import { addToCart } from '../../store/slices/cartSlice'
import { toast } from 'sonner'

const formatPrice = (price) =>
  new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(price)

export default function ProductCard({ product, badge, showRank }) {
  const dispatch = useDispatch()

  const handleAddToCart = (e) => {
    e.preventDefault()
    e.stopPropagation()

    if (product.status === 'Unavailable' || product.stockQty === 0) {
      toast.error('Sản phẩm đã hết hàng')
      return
    }

    dispatch(addToCart({
      id: product.id,
      productId: product.id,
      name: product.name,
      price: product.price,
      image: product.firstImageUrl,
      quantity: 1,
      stock: product.stockQty
    }))

    toast.success('Đã thêm vào giỏ hàng')
  }

  const handleWishlist = (e) => {
    e.preventDefault()
    e.stopPropagation()
    toast.info('Tính năng yêu thích sẽ sớm có')
  }

  const isOutOfStock = product.status === 'Unavailable' || product.stockQty === 0

  return (
    <NavLink
      to={`/products/${product.id}`}
      className="group block bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg border border-slate-100 hover:border-[#0090D0]/30 transition-all"
    >
      {/* Image container */}
      <div className="relative aspect-square bg-slate-50 overflow-hidden">
        {product.firstImageUrl ? (
          <img
            src={product.firstImageUrl}
            alt={product.name}
            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package size={48} className="text-slate-300" />
          </div>
        )}

        {/* Badge - New */}
        {badge && !showRank && (
          <span className="absolute top-3 left-3 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
            {badge}
          </span>
        )}

        {/* Rank badge */}
        {showRank && (
          <span className="absolute top-3 left-3 bg-yellow-400 text-slate-900 text-sm font-bold w-8 h-8 rounded-full flex items-center justify-center shadow">
            #{showRank}
          </span>
        )}

        {/* Out of stock badge */}
        {isOutOfStock && (
          <span className="absolute top-3 right-3 bg-slate-600 text-white text-xs px-2 py-1 rounded">
            Hết hàng
          </span>
        )}

        {/* Quick actions - show on hover */}
        <div className="absolute bottom-3 left-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={handleAddToCart}
            disabled={isOutOfStock}
            className="flex-1 bg-[#0090D0] hover:bg-[#0077B0] disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-sm font-semibold py-2 px-3 rounded-lg flex items-center justify-center gap-1 transition-colors"
          >
            <ShoppingCart size={16} />
            <span className="hidden sm:inline">Thêm</span>
          </button>
          <button
            onClick={handleWishlist}
            className="bg-white hover:bg-slate-100 text-slate-600 p-2 rounded-lg border border-slate-200 transition-colors"
          >
            <Heart size={16} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Category */}
        {product.categoryName && (
          <div className="text-xs text-[#0090D0] font-medium mb-1 uppercase tracking-wide">
            {product.categoryName}
          </div>
        )}

        {/* Name */}
        <h3 className="font-semibold text-slate-800 mb-2 line-clamp-2 min-h-[2.5rem] group-hover:text-[#0090D0] transition-colors">
          {product.name}
        </h3>

        {/* Price */}
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-red-600">
            {formatPrice(product.price)}
          </span>
        </div>

        {/* Low stock indicator */}
        {product.stockQty !== undefined && product.stockQty <= 10 && product.stockQty > 0 && (
          <div className="text-xs text-orange-600 mt-2">
            Chỉ còn {product.stockQty} sản phẩm
          </div>
        )}
      </div>
    </NavLink>
  )
}
