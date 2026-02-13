import { NavLink } from 'react-router-dom'
import { Search, User, ShoppingCart, Menu } from 'lucide-react'
import { useAuth } from '../../store/authContext'

export default function Header() {
  const { user } = useAuth()

  return (
    <header className="w-full">
      {/* ================= MOBILE HEADER ================= */}
      <div className="bg-[#0090D0] lg:hidden">
        <div className="px-4 py-3 space-y-3">

          {/* ROW 1: MENU - LOGO - USER - CART */}
          <div className="flex items-center justify-between">
            {/* Left */}
            <div className="flex items-center gap-3">
              <button className="text-white">
                <Menu size={22} />
              </button>

              <NavLink to="/" className="text-lg font-bold text-white">
                Tech<span className="text-yellow-400">Express</span>
              </NavLink>
            </div>

            {/* Right */}
            <div className="flex items-center gap-4">
              <NavLink to="/login" className="text-white">
                <User size={20} />
              </NavLink>

              <NavLink to="/cart" className="relative text-white">
                <ShoppingCart size={20} />
                <span className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-yellow-400 text-black text-xs flex items-center justify-center font-bold">
                  1
                </span>
              </NavLink>
            </div>
          </div>

          {/* ROW 2: SEARCH */}
          <div className="flex bg-white rounded-sm overflow-hidden">
            <input
              type="text"
              placeholder="Bạn cần tìm gì?"
              className="flex-1 px-4 py-2 text-sm outline-none"
            />
            <button className="px-4 bg-yellow-400 flex items-center justify-center">
              <Search size={18} className="text-black" />
            </button>
          </div>

          {/* ROW 3: SEARCH SUGGEST */}
          <div className="text-[11px] text-white/80 truncate">
            bàn phím keychron · MSI Cyborg 15 · ASUS OLED · PC Gaming · Razer · USB · Loa
          </div>
        </div>
      </div>

      {/* ================= DESKTOP HEADER (GIỮ NGUYÊN) ================= */}
      <div className="bg-[#0090D0] hidden lg:block">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center gap-6">
          {/* Logo */}
          <NavLink to="/" className="flex items-center gap-2">
            <div className="text-2xl font-bold text-white tracking-wide">
              Tech<span className="text-yellow-400">Express</span>
            </div>
          </NavLink>

          {/* Search */}
          <div className="flex-1">
            <div className="flex bg-white rounded-sm overflow-hidden">
              <input
                type="text"
                placeholder="Bạn cần tìm gì?"
                className="flex-1 px-4 py-2 text-sm outline-none"
              />
              <button className="px-4 bg-yellow-400 hover:bg-yellow-500 flex items-center justify-center">
                <Search size={18} className="text-black" />
              </button>
            </div>

            {/* Gợi ý tìm kiếm */}
            <div className="text-[11px] text-white/80 mt-1 truncate">
              bàn phím keychron · MSI Cyborg 15 · ASUS OLED · PC Gaming · razer · USB · Loa
            </div>
          </div>

          {/* Account */}
          <NavLink
            to={user ? '/account' : '/login'}
            className="flex items-center gap-1 text-white text-sm hover:underline"
          >
            <User size={18} />
            <div className="leading-tight">
              <div className="text-xs">Tài khoản</div>
              <div className="font-medium">{user?.role || 'Đăng nhập'}</div>
            </div>
          </NavLink>

          {/* Cart */}
          <NavLink
            to="/cart"
            className="relative flex items-center gap-2 bg-green-700 hover:bg-green-800 text-white px-3 py-2 rounded-md"
          >
            <ShoppingCart size={18} />
            <span className="text-sm font-medium">Giỏ hàng</span>
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-yellow-400 text-black text-xs flex items-center justify-center font-bold">
              1
            </span>
          </NavLink>
        </div>
      </div>

      {/* ================= DESKTOP MENU BAR ================= */}
      <div className="bg-slate-700 hidden lg:block">
        <div className="max-w-7xl mx-auto px-4 h-10 flex items-center justify-center gap-12  text-sm text-white">
          <NavLink className="hover:text-yellow-400" to="/checkout">
            THANH TOÁN
          </NavLink>
          <NavLink className="hover:text-yellow-400" to="/installment">
            TRẢ GÓP
          </NavLink>
          <NavLink className="hover:text-yellow-400" to="/contact">
            LIÊN HỆ
          </NavLink>
          <NavLink className="hover:text-yellow-400" to="/support">
            HỖ TRỢ KHÁCH HÀNG
          </NavLink>
          <NavLink className="hover:text-yellow-400" to="/blog">
            THƯ VIỆN
          </NavLink>
          <NavLink className="hover:text-yellow-400" to="/careers">
            TUYỂN DỤNG
          </NavLink>
        </div>
      </div>
    </header>
  )
}
