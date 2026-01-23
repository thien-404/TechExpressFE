import React, { useState } from 'react'
import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  BarChart3,
  Settings,
  Users,
  Package,
  ShoppingCart,
  FileText,
  CalendarDays,
  ChevronDown,
  ChevronRight
} from 'lucide-react'

/* =========================
 * Base Link
 * ========================= */
const SideLink = ({ to, icon: Icon, children, end }) => (
  <NavLink
    to={to}
    end={end}
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
 * Dropdown
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

const DropdownItem = ({ to, icon: Icon, children }) => (
  <NavLink
    to={to}
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
 * Sidebar
 * ========================= */
export default function AdminSidebar() {
  const [openManagement, setOpenManagement] = useState(true)

  return (
    <aside className="w-64 min-h-screen bg-white border-r border-slate-200">
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-slate-200">
        <NavLink to="/" className="flex items-center gap-2">
            <div className="text-2xl font-bold text-white tracking-wide">
              <span className='text-sky-600'>Tech</span><span className="text-yellow-400">Express</span>
            </div>
          </NavLink>
      </div>

      <nav className="p-3 space-y-1">
        <SideLink to="/admin" icon={LayoutDashboard} end>
          Dashboard
        </SideLink>

        {/* Management */}
        <div className="pt-2">
          <DropdownButton
            icon={Package}
            label="Sản phẩm"
            open={openManagement}
            onClick={() => setOpenManagement((v) => !v)}
          />
          {openManagement && (
            <div className="mt-1 space-y-1">
              <DropdownItem to="/admin/users" icon={Users}>
                Danh sách Sản Phẩm
              </DropdownItem>
              <DropdownItem to="/admin/products" icon={Package}>
                Tạo PC
              </DropdownItem>
              <DropdownItem to="/admin/orders" icon={ShoppingCart}>
                Thêm Linh Kiện
              </DropdownItem>
            </div>
          )}
        </div>

        <SideLink to="/admin/products" icon={Users}>
          Người Dùng
        </SideLink>

        <SideLink to="/admin/orders" icon={ShoppingCart}>
          Đơn Hàng
        </SideLink>
      </nav>
    </aside>
  )
}
