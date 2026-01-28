import React from 'react'
import { NavLink } from 'react-router-dom'

function AccountTabs({ active, onChange }) {
  const tabs = [
    { key: 'profile', label: 'Tài Khoản Của Tôi' },
    { key: 'orders', label: 'Đơn Mua' },
    { key: 'voucher', label: 'Kho Voucher' },
  ]

  return (
    <div className="space-y-1">
      {tabs.map((t) => (
        <button
          key={t.key}
          type="button"
          onClick={() => onChange(t.key)}
          className={[
            'w-full text-left px-3 py-2 rounded text-sm',
            active === t.key
              ? 'text-red-500 font-semibold bg-red-50'
              : 'text-slate-700 hover:bg-slate-100'
          ].join(' ')}
        >
          {t.label}
        </button>
      ))}
    </div>
  )
}

export default function AccountSidebar({ user, activeTab, onTabChange, onLogout }) {
  return (
    <aside className="w-64 bg-white rounded-lg p-4">
      {/* User info */}
      <div className="flex items-center gap-3 pb-4 border-b">
        <div className="h-12 w-12 rounded-full bg-slate-200 flex items-center justify-center">
          <span className="text-slate-500">👤</span>
        </div>
        <div>
          <div className="font-semibold text-sm">
            {user?.fullName || 'User'}
          </div>
          <div className="text-xs text-slate-500">{user?.email}</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-4">
        <div className="text-xs text-slate-500 mb-2">Thông Báo</div>
        <AccountTabs active={activeTab} onChange={onTabChange} />

        <button
          onClick={onLogout}
          className="mt-4 w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 rounded"
        >
          Đăng Xuất
        </button>
      </div>
    </aside>
  )
}