import React, { useState } from 'react'
import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  Package,
  ShoppingCart,
  ChevronDown,
  ChevronRight,
  X,
  PcCase,
  ChartBarStacked,
  Bandage,
  MessageSquare,
  BadgePercent,
  LifeBuoy,
} from 'lucide-react'

const SideLink = ({ to, icon, children, end, onClick }) => {
  const Icon = icon

  return (
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
}

const DropdownButton = ({ icon, label, open, onClick }) => {
  const Icon = icon

  return (
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
}

const DropdownItem = ({ to, icon, children, onClick }) => {
  const Icon = icon

  return (
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
}

export default function AdminSideBar({ open, onClose }) {
  const [openManagement, setOpenManagement] = useState(true)

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`
          fixed inset-y-0 left-0 z-50 min-h-screen w-64
          transform border-r border-slate-200 bg-white transition-transform duration-300
          ${open ? 'translate-x-0' : '-translate-x-full'}
          lg:static lg:translate-x-0
        `}
      >
        <div className="flex h-16 items-center justify-between border-b border-slate-200 px-6">
          <NavLink to="/" className="flex items-center gap-2">
            <div className="text-2xl font-bold tracking-wide">
              <span className="text-sky-600">Tech</span>
              <span className="text-yellow-400">Express</span>
            </div>
          </NavLink>

          <button onClick={onClose} className="lg:hidden">
            <X size={20} />
          </button>
        </div>

        <nav className="space-y-1 p-3">
          <SideLink to="/admin" icon={LayoutDashboard} end onClick={onClose}>
            Dashboard
          </SideLink>

          <div className="pt-2">
            <SideLink to="/admin/categories" icon={ChartBarStacked} onClick={onClose}>
              Danh mục sản phẩm
            </SideLink>
          </div>

          <div className="pt-2">
            <SideLink to="/admin/brands" icon={Bandage} onClick={onClose}>
              Thương hiệu
            </SideLink>
          </div>

          <div className="pt-2">
            <DropdownButton
              icon={Package}
              label="Sản phẩm"
              open={openManagement}
              onClick={() => setOpenManagement((value) => !value)}
            />
            {openManagement && (
              <div className="mt-1 space-y-1">
                <DropdownItem to="/admin/products" icon={Package} onClick={onClose}>
                  Danh sách sản phẩm
                </DropdownItem>
                <DropdownItem to="/admin/products/pc-create" icon={PcCase} onClick={onClose}>
                  Tạo PC
                </DropdownItem>
                <DropdownItem to="/admin/orders" icon={ShoppingCart} onClick={onClose}>
                  Thêm linh kiện
                </DropdownItem>
              </div>
            )}
          </div>

          <SideLink to="/admin/promotions" icon={BadgePercent} onClick={onClose}>
            Khuyến mãi
          </SideLink>

          <SideLink to="/admin/users" icon={Users} onClick={onClose}>
            Người dùng
          </SideLink>

          <SideLink to="/admin/orders" icon={ShoppingCart} onClick={onClose}>
            Đơn hàng
          </SideLink>

          <SideLink to="/admin/tickets" icon={LifeBuoy} onClick={onClose}>
            Ticket hỗ trợ
          </SideLink>

          <SideLink to="/admin/chat" icon={MessageSquare} onClick={onClose}>
            Chat hỗ trợ
          </SideLink>
        </nav>
      </aside>
    </>
  )
}