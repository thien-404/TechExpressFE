import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { FiBox, FiChevronDown, FiLogOut, FiMenu, FiShoppingCart, FiTag } from "react-icons/fi";

import { useAuth } from "../../store/authContext";

function IconButton({ children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-9 w-9 items-center justify-center rounded-md text-slate-600 transition-colors hover:bg-slate-50 hover:text-[#334155]"
    >
      {children}
    </button>
  );
}

export default function StaffTopBar({ onOpenSidebar }) {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    toast.success("\u0110\u0103ng xu\u1ea5t th\u00e0nh c\u00f4ng");
    navigate("/login", { replace: true });
  };

  const fullName =
    user?.firstName && user?.lastName
      ? `${user.firstName} ${user.lastName}`
      : user?.email?.split("@")[0] || "Staff";

  return (
    <header className="flex h-14 items-center justify-between border-b border-slate-200 bg-white px-4 shadow-sm">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenSidebar}
          className="flex h-9 w-9 items-center justify-center rounded-md text-slate-600 transition-colors hover:bg-slate-50 hover:text-[#334155] lg:hidden"
        >
          <FiMenu size={20} />
        </button>

        <div className="hidden items-center gap-1 lg:flex">
          <IconButton onClick={() => navigate("/staff/orders")}>
            <FiShoppingCart size={18} />
          </IconButton>
          <IconButton onClick={() => navigate("/staff/products")}>
            <FiBox size={18} />
          </IconButton>
          <IconButton onClick={() => navigate("/staff/promotions")}>
            <FiTag size={18} />
          </IconButton>
        </div>

        <div className="hidden h-6 w-px bg-slate-200 lg:block" />

        <div className="hidden md:block">
          <h2 className="text-sm font-semibold text-[#334155]">{"Trang nh\u00e2n vi\u00ean"}</h2>
        </div>
      </div>

      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => isAuthenticated && setDropdownOpen((prev) => !prev)}
          className="group flex items-center gap-2 rounded-md px-3 py-1.5 transition-colors hover:bg-slate-50"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-cyan-600 text-sm font-semibold text-white shadow-sm">
            {fullName.charAt(0).toUpperCase()}
          </div>

          <div className="hidden text-left sm:block">
            <div className="text-sm font-semibold text-[#334155] transition-colors group-hover:text-slate-700">
              {fullName}
            </div>
            <div className="text-xs text-slate-500">{user?.role || "Staff"}</div>
          </div>

          <FiChevronDown
            size={16}
            className={`text-slate-400 transition-transform ${dropdownOpen ? "rotate-180" : ""}`}
          />
        </button>

        {dropdownOpen && (
          <div className="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg">
            <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white px-4 py-3">
              <div className="text-sm font-semibold text-[#334155]">{fullName}</div>
              <div className="mt-0.5 text-xs text-slate-500">{user?.email}</div>
            </div>

            <div className="border-t border-slate-100">
              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-600 transition-colors hover:bg-red-50"
              >
                <FiLogOut size={16} />
                {"\u0110\u0103ng xu\u1ea5t"}
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}