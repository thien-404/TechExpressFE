import React, { useState } from 'react'
import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  Package,
  ShoppingCart,
  ChevronDown,
  ChevronRight,
  X
} from 'lucide-react'

/* =========================
 * Base Link (GIỮ NGUYÊN)
 * ========================= */
const SideLink = ({ to, icon: Icon, children, end, onClick }) => (
  <NavLink
    to={to}
    end={end}
    onClick={onClick}
    className={({ isActive }) =>
      `
      flex items-center gap-3 px-4 py-2.5 rounded-md text-sm font-medium
      transition
      ${isActive
        ? 'bg-emerald-50 text-emerald-600'
        : 'text-slate-600 hover:bg-slate-100'
      }
      `
    }
  >
    <Icon size={18} />
    <span>{children}</span>
  </NavLink>
)

/* =========================
 * Dropdown (GIỮ NGUYÊN)
 * ========================= */
const DropdownButton = ({ icon: Icon, label, open, onClick }) => (
  <button
    onClick={onClick}
    className="
      w-full flex items-center gap-3 px-4 py-2.5
      text-sm font-medium text-slate-600
      hover:bg-slate-100 rounded-md
    "
  >
    <Icon size={18} />
    <span className="flex-1 text-left">{label}</span>
    {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
  </button>
)

const DropdownItem = ({ to, icon: Icon, children, onClick }) => (
  <NavLink
    to={to}
    onClick={onClick}
    className={({ isActive }) =>
      `
      flex items-center gap-3 pl-12 pr-4 py-2 text-sm rounded-md
      ${isActive
        ? 'bg-emerald-50 text-emerald-600'
        : 'text-slate-600 hover:bg-slate-100'
      }
      `
    }
  >
    <Icon size={16} />
    {children}
  </NavLink>
)

/* =========================
 * Sidebar (RESPONSIVE)
 * ========================= */
export default function AdminSideBar({ open, onClose }) {
  const [openManagement, setOpenManagement] = useState(true)

  return (
    <>
      {/* Overlay – mobile only */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-50
          w-64 min-h-screen bg-white border-r border-slate-200
          transform transition-transform duration-300
          ${open ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
        `}
      >
        {/* Logo (GIỮ NGUYÊN) */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-200">
          <NavLink to="/" className="flex items-center gap-2">
            <div className="text-2xl font-bold tracking-wide">
              <span className="text-sky-600">Tech</span>
              <span className="text-yellow-400">Express</span>
            </div>
          </NavLink>

          {/* Close button – mobile */}
          <button onClick={onClose} className="lg:hidden">
            <X size={20} />
          </button>
        </div>

        <nav className="p-3 space-y-1">
          <SideLink to="/admin" icon={LayoutDashboard} end onClick={onClose}>
            Dashboard
          </SideLink>

          {/* Management */}
          <div className="pt-2">
            <DropdownButton
              icon={Package}
              label="Sản phẩm"
              open={openManagement}
              onClick={() => setOpenManagement(v => !v)}
            />
            {openManagement && (
              <div className="mt-1 space-y-1">
                <DropdownItem to="/admin/products" icon={Package} onClick={onClose}>
                  Danh sách Sản Phẩm
                </DropdownItem>
                <DropdownItem to="/admin/products" icon={Package} onClick={onClose}>
                  Tạo PC
                </DropdownItem>
                <DropdownItem to="/admin/orders" icon={ShoppingCart} onClick={onClose}>
                  Thêm Linh Kiện
                </DropdownItem>
              </div>
            )}
          </div>

          <SideLink to="/admin/users" icon={Users} onClick={onClose}>
            Người Dùng
          </SideLink>

          <SideLink to="/admin/orders" icon={ShoppingCart} onClick={onClose}>
            Đơn Hàng
          </SideLink>
        </nav>
      </aside>
    </>
  )
}
