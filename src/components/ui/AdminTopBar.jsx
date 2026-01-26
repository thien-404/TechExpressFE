import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useAuth } from '../../store/authContext'
import {
  LayoutGrid,
  Mail,
  Users,
  Star,
  ChevronDown,
  User,
  Menu
} from 'lucide-react'

export default function AdminTopbar({ onOpenSidebar }) {
  const navigate = useNavigate()
  const { user, isAuthenticated, logout } = useAuth()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const close = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  const onLogout = () => {
    logout()
    toast.success('Đã đăng xuất')
    navigate('/login', { replace: true })
  }

  return (
    <header className="h-14 bg-white border-b px-4 flex items-center justify-between">
      {/* LEFT */}
      <div className="flex items-center gap-2">
        {/* Mobile menu */}
        <button
          onClick={onOpenSidebar}
          className="lg:hidden text-slate-600"
        >
          <Menu size={20} />
        </button>

        {/* Desktop icons */}
        <div className="hidden lg:flex items-center gap-1">
          <Icon><LayoutGrid size={18} /></Icon>
          <Icon><Mail size={18} /></Icon>
          <Icon><Users size={18} /></Icon>
          <Icon><Star size={18} /></Icon>
        </div>
      </div>

      {/* RIGHT */}
      <div className="relative" ref={ref}>
        <button
          onClick={() => isAuthenticated && setOpen(v => !v)}
          className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-slate-100"
        >
          <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center">
            <User size={16} />
          </div>

          <div className="hidden sm:block text-left">
            <div className="text-sm font-medium">
              {user?.email || 'Admin'}
            </div>
            <div className="text-xs text-slate-500">Admin</div>
          </div>

          <ChevronDown size={16} />
        </button>

        {open && (
          <div className="absolute right-0 mt-2 w-48 bg-white border rounded-md shadow-lg">
            <button
              onClick={() => navigate('/admin/account')}
              className="block w-full text-left px-4 py-2 text-sm hover:bg-slate-100"
            >
              Thông tin tài khoản
            </button>
            <button
              onClick={onLogout}
              className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
            >
              Đăng xuất
            </button>
          </div>
        )}
      </div>
    </header>
  )
}

const Icon = ({ children }) => (
  <div className="h-9 w-9 flex items-center justify-center rounded-md hover:bg-slate-100">
    {children}
  </div>
)
