import React from "react";
import { NavLink } from "react-router-dom";
import { FiBox, FiShoppingCart, FiTag, FiX } from "react-icons/fi";

function linkClass(isActive) {
  return `flex items-center gap-3 rounded-md px-4 py-2.5 text-sm font-medium transition ${
    isActive ? "bg-emerald-50 text-emerald-600" : "text-slate-600 hover:bg-slate-100"
  }`;
}

export default function StaffSideBar({ open, onClose }) {
  return (
    <>
      {open && (
        <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={onClose} />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 min-h-screen w-64 transform border-r border-slate-200 bg-white transition-transform duration-300 ${
          open ? "translate-x-0" : "-translate-x-full"
        } lg:static lg:translate-x-0`}
      >
        <div className="flex h-16 items-center justify-between border-b border-slate-200 px-6">
          <NavLink to="/staff" className="flex items-center gap-2">
            <div className="text-2xl font-bold tracking-wide">
              <span className="text-sky-600">Tech</span>
              <span className="text-yellow-400">Express</span>
            </div>
          </NavLink>

          <button type="button" onClick={onClose} className="lg:hidden">
            <FiX size={20} />
          </button>
        </div>

        <nav className="space-y-1 p-3">
          <NavLink to="/staff/orders" end onClick={onClose} className={({ isActive }) => linkClass(isActive)}>
            <FiShoppingCart size={18} />
            <span>{"Đơn hàng"}</span>
          </NavLink>

          <NavLink to="/staff/products" onClick={onClose} className={({ isActive }) => linkClass(isActive)}>
            <FiBox size={18} />
            <span>{"Sản phẩm"}</span>
          </NavLink>

          <NavLink to="/staff/promotions" onClick={onClose} className={({ isActive }) => linkClass(isActive)}>
            <FiTag size={18} />
            <span>{"Khuyến mãi"}</span>
          </NavLink>
        </nav>
      </aside>
    </>
  );
}