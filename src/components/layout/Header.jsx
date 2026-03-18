import { NavLink, useNavigate } from "react-router-dom";
import { useState } from "react";
import { Search, User, ShoppingCart, Menu } from "lucide-react";
import { useSelector } from "react-redux";
import { toast } from "sonner";
import useCartAccess from "../../hooks/useCartAccess";
import { selectCartItemCount } from "../../store/slices/cartSlice";

const HEADER_COPY = {
  searchRequired: "Vui lòng nhập từ khóa tìm kiếm",
  searchPlaceholder: "Bạn cần tìm gì?",
  account: "Tài Khoản",
  login: "Đăng nhập",
  cart: "Giỏ hàng",
  checkout: "THANH TOÁN",
  installment: "TRẢ GÓP",
  contact: "LIÊN HỆ",
  support: "HỖ TRỢ KHÁCH HÀNG",
  library: "THƯ VIỆN",
  careers: "TUYỂN DỤNG",
};

export default function Header({ onToggleCategorySidebar }) {
  const { user, loading, canUseCart } = useCartAccess();
  const itemCount = useSelector(selectCartItemCount);
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState("");
  const showCartEntryPoints = !loading && canUseCart;

  const handleSearchSubmit = () => {
    const trimmedKeyword = keyword.trim();
    if (!trimmedKeyword) {
      toast.info(HEADER_COPY.searchRequired);
      return;
    }

    const query = new URLSearchParams({
      search: trimmedKeyword,
      page: "1",
      pageSize: "12",
      sortBy: "3",
      sortDirection: "0",
    }).toString();

    navigate(`/products/search?${query}`);
  };

  const handleSearchKeyDown = (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      handleSearchSubmit();
    }
  };

  return (
    <header className="w-full">
      <div className="bg-[#0090D0] lg:hidden">
        <div className="px-4 py-3 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                className="text-white"
                type="button"
                onClick={onToggleCategorySidebar}
                aria-label="Toggle category sidebar"
              >
                <Menu size={22} />
              </button>

              <NavLink to="/" className="text-lg font-bold text-white">
                Tech<span className="text-yellow-400">Express</span>
              </NavLink>
            </div>

            <div className="flex items-center gap-4">
              <NavLink to={user ? "/account" : "/login"} className="text-white">
                <User size={20} />
              </NavLink>

              {showCartEntryPoints ? (
                <NavLink to="/cart" className="relative text-white">
                  <ShoppingCart size={20} />
                  <span className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-yellow-400 text-black text-xs flex items-center justify-center font-bold">
                    {itemCount}
                  </span>
                </NavLink>
              ) : null}
            </div>
          </div>

          <div className="flex bg-white rounded-sm overflow-hidden">
            <input
              type="text"
              placeholder={HEADER_COPY.searchPlaceholder}
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              onKeyDown={handleSearchKeyDown}
              className="flex-1 px-4 py-2 text-sm outline-none"
            />
            <button
              type="button"
              onClick={handleSearchSubmit}
              className="px-4 bg-yellow-400 flex items-center justify-center"
            >
              <Search size={18} className="text-black" />
            </button>
          </div>

          <div className="text-[11px] text-white/80 truncate">
            ban phim keychron . MSI Cyborg 15 . ASUS OLED . Custom PC Builder . Razer . USB . Loa
          </div>

          <NavLink
            to="/custom-pc-builder"
            className="inline-flex h-9 items-center justify-center rounded-lg bg-white/15 px-3 text-sm font-medium text-white hover:bg-white/20"
          >
            Custom PC Builder
          </NavLink>
        </div>
      </div>

      <div className="bg-[#0090D0] hidden lg:block">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center gap-6">
          <NavLink to="/" className="flex items-center gap-2">
            <div className="text-2xl font-bold text-white tracking-wide">
              Tech<span className="text-yellow-400">Express</span>
            </div>
          </NavLink>

          <div className="flex-1">
            <div className="flex bg-white rounded-sm overflow-hidden">
            <input
              type="text"
              placeholder={HEADER_COPY.searchPlaceholder}
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              onKeyDown={handleSearchKeyDown}
                className="flex-1 px-4 py-2 text-sm outline-none"
              />
              <button
                type="button"
                onClick={handleSearchSubmit}
                className="px-4 bg-yellow-400 hover:bg-yellow-500 flex items-center justify-center"
              >
                <Search size={18} className="text-black" />
              </button>
            </div>

            <div className="text-[11px] text-white/80 mt-1 truncate">
              ban phim keychron . MSI Cyborg 15 . ASUS OLED . PC Gaming . Razer . USB . Loa
            </div>
          </div>

          <NavLink
            to={user ? "/account" : "/login"}
            className="flex items-center gap-1 text-white text-sm hover:underline"
          >
            <User size={18} />
            <div className="leading-tight">
              <div className="text-xs">{HEADER_COPY.account}</div>
              <div className="font-medium">{user?.email || HEADER_COPY.login}</div>
            </div>
          </NavLink>

          {showCartEntryPoints ? (
            <NavLink
              to="/cart"
              className="relative flex items-center gap-2 bg-green-700 hover:bg-green-800 text-white px-3 py-2 rounded-md"
            >
              <ShoppingCart size={18} />
              <span className="text-sm font-medium">{HEADER_COPY.cart}</span>
              <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-yellow-400 text-black text-xs flex items-center justify-center font-bold">
                {itemCount}
              </span>
            </NavLink>
          ) : null}
        </div>
      </div>

      <div className="bg-slate-700 hidden lg:block">
        <div className="max-w-7xl mx-auto px-4 h-10 flex items-center justify-center gap-12  text-sm text-white">
          <NavLink className="hover:text-yellow-400" to="/custom-pc-builder">
            CUSTOM PC
          </NavLink>
          {showCartEntryPoints ? (
            <NavLink className="hover:text-yellow-400" to="/checkout">
              {HEADER_COPY.checkout}
            </NavLink>
          ) : null}
          <NavLink className="hover:text-yellow-400" to="/installment">
            {HEADER_COPY.installment}
          </NavLink>
          <NavLink className="hover:text-yellow-400" to="/contact">
            {HEADER_COPY.contact}
          </NavLink>
          <NavLink className="hover:text-yellow-400" to="/support">
            {HEADER_COPY.support}
          </NavLink>
          <NavLink className="hover:text-yellow-400" to="/blog">
            {HEADER_COPY.library}
          </NavLink>
          <NavLink className="hover:text-yellow-400" to="/careers">
            {HEADER_COPY.careers}
          </NavLink>
        </div>
      </div>
    </header>
  );
}
