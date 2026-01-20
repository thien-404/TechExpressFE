import React, { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useAuth } from '../../store/authContext.jsx'
import {
  LayoutGrid,
  Mail,
  Users,
  Star,
  ChevronDown,
  User
} from 'lucide-react'

/* =========================
 * Icon Button
 * ========================= */
const IconButton = ({ children, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="
      h-9 w-9 rounded-md
      flex items-center justify-center
      text-slate-600
      hover:bg-slate-100 hover:text-slate-900
      transition
    "
  >
    {children}
  </button>
)

export default function AdminTopbar() {
  const navigate = useNavigate()
  const { user, isAuthenticated, logout } = useAuth()

  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const onClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  const onLogout = () => {
    logout()
    setOpen(false)
    toast.success('Đã đăng xuất')
    navigate('/login', { replace: true })
  }

  const displayName =
    user?.name || user?.username || user?.email || 'User'

  return (
    <header className="h-14 bg-white border-b border-slate-200 px-4 flex items-center justify-between">
      {/* LEFT */}
      <div className="flex items-center gap-1">
        <IconButton>
          <LayoutGrid size={18} />
        </IconButton>
        <IconButton>
          <Mail size={18} />
        </IconButton>
        <IconButton>
          <Users size={18} />
        </IconButton>
        <IconButton>
          <Star size={18} />
        </IconButton>
      </div>

      {/* RIGHT */}
      <div className="flex items-center gap-4">
        {/* Language */}
        <button className="
          px-2 py-1 rounded-md text-xs font-medium
          text-slate-600 hover:bg-slate-100
        ">
          VN
        </button>

        {/* User */}
        <div className="relative" ref={ref}>
          <button
            onClick={() => isAuthenticated && setOpen((v) => !v)}
            className="
              flex items-center gap-2 px-2 py-1.5 rounded-md
              hover:bg-slate-100 transition
            "
          >
            <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
              <User size={16} />
            </div>

            <div className="text-left hidden sm:block">
              <div className="text-sm font-medium text-slate-700">
                {displayName}
              </div>
              <div className="text-xs text-slate-500">
                Admin
              </div>
            </div>

            <ChevronDown size={16} className="text-slate-500" />
          </button>

          {/* Dropdown */}
          {open && isAuthenticated && (
            <div className="
              absolute right-0 mt-2 w-56
              rounded-md bg-white border border-slate-200
              shadow-lg overflow-hidden
            ">
              <div className="px-4 py-3 border-b border-slate-100">
                <div className="text-sm font-medium text-slate-700">
                  {displayName}
                </div>
                <div className="text-xs text-slate-500">
                  Administrator
                </div>
              </div>

              <button
                onClick={() => {
                  setOpen(false)
                  navigate('/admin/account')
                }}
                className="
                  w-full text-left px-4 py-2 text-sm
                  text-slate-600 hover:bg-slate-100
                "
              >
                Thông tin tài khoản
              </button>

              <button
                onClick={onLogout}
                className="
                  w-full text-left px-4 py-2 text-sm
                  text-red-600 hover:bg-red-50
                "
              >
                Đăng xuất
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
