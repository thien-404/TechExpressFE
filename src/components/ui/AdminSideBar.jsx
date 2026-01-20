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
      ${
        isActive
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
      ${
        isActive
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
        <span className="text-lg font-semibold text-slate-800">
          Admin Panel
        </span>
      </div>

      <nav className="p-3 space-y-1">
        <SideLink to="/admin" icon={LayoutDashboard} end>
          Dashboard
        </SideLink>

        <SideLink to="/admin/analytics" icon={BarChart3}>
          Analytics
        </SideLink>

        {/* Management */}
        <div className="pt-2">
          <DropdownButton
            icon={Settings}
            label="Management"
            open={openManagement}
            onClick={() => setOpenManagement((v) => !v)}
          />

          {openManagement && (
            <div className="mt-1 space-y-1">
              <DropdownItem to="/admin/users" icon={Users}>
                Users
              </DropdownItem>
              <DropdownItem to="/admin/products" icon={Package}>
                Products
              </DropdownItem>
              <DropdownItem to="/admin/orders" icon={ShoppingCart}>
                Orders
              </DropdownItem>
            </div>
          )}
        </div>

        {/* Pages */}
        <NavLink
          to="/admin/pages"
          className={({ isActive }) =>
            `
            flex items-center gap-3 px-4 py-2.5 rounded-md text-sm font-medium
            ${
              isActive
                ? 'bg-emerald-50 text-emerald-600'
                : 'text-slate-600 hover:bg-slate-100'
            }
            `
          }
        >
          <FileText size={18} />
          <span className="flex-1">Pages</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-600">
            8
          </span>
        </NavLink>

        <SideLink to="/admin/calendar" icon={CalendarDays}>
          Calendars
        </SideLink>
      </nav>
    </aside>
  )
}
