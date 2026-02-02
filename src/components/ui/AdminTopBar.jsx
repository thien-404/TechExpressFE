import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useAuth } from '../../store/authContext'
import {
  FiGrid,
  FiMail,
  FiUsers,
  FiStar,
  FiChevronDown,
  FiUser,
  FiMenu,
  FiSettings,
  FiLogOut,
  FiBell
} from 'react-icons/fi'

/* =========================
 * ICON BUTTON
 * ========================= */
const IconButton = ({ children, active = false, badge = null, onClick }) => (
  <button
    onClick={onClick}
    className={`relative h-9 w-9 flex items-center justify-center rounded-md transition-colors ${
      active 
        ? 'bg-slate-100 text-[#334155]' 
        : 'text-slate-600 hover:bg-slate-50 hover:text-[#334155]'
    }`}
  >
    {children}
    {badge && (
      <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-[10px] font-semibold rounded-full flex items-center justify-center">
        {badge}
      </span>
    )}
  </button>
)

/* =========================
 * MAIN TOPBAR
 * ========================= */
export default function AdminTopbar({ onOpenSidebar }) {
  const navigate = useNavigate()
  const { user, isAuthenticated, logout } = useAuth()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)

  // Đóng dropdown khi click bên ngoài
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = () => {
    logout()
    toast.success('Đăng xuất thành công')
    navigate('/login', { replace: true })
  }

  const fullName = user?.firstName && user?.lastName 
    ? `${user.firstName} ${user.lastName}` 
    : user?.email?.split('@')[0] || 'Admin'

  return (
    <header className="h-14 bg-white border-b border-slate-200 px-4 flex items-center justify-between shadow-sm">
      {/* ================= LEFT SIDE ================= */}
      <div className="flex items-center gap-3">
        {/* Mobile Menu Button */}
        <button
          onClick={onOpenSidebar}
          className="lg:hidden h-9 w-9 flex items-center justify-center rounded-md text-slate-600 hover:bg-slate-50 hover:text-[#334155] transition-colors"
        >
          <FiMenu size={20} />
        </button>

        {/* Desktop Quick Actions */}
        <div className="hidden lg:flex items-center gap-1">
          <IconButton onClick={() => navigate('/admin/dashboard')}>
            <FiGrid size={18} />
          </IconButton>
          
          <IconButton badge={3}>
            <FiMail size={18} />
          </IconButton>
          
          <IconButton onClick={() => navigate('/admin/users')}>
            <FiUsers size={18} />
          </IconButton>
          
          <IconButton>
            <FiStar size={18} />
          </IconButton>
        </div>

        {/* Divider */}
        <div className="hidden lg:block h-6 w-px bg-slate-200" />

        {/* Page Title - Optional */}
        <div className="hidden md:block">
          <h2 className="text-sm font-semibold text-[#334155]">
            Trang quản trị
          </h2>
        </div>
      </div>

      {/* ================= RIGHT SIDE ================= */}
      <div className="flex items-center gap-2">
        {/* Notifications */}
        <IconButton badge={5}>
          <FiBell size={18} />
        </IconButton>

        {/* Settings */}
        <IconButton onClick={() => navigate('/admin/settings')}>
          <FiSettings size={18} />
        </IconButton>

        {/* Divider */}
        <div className="h-6 w-px bg-slate-200" />

        {/* User Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => isAuthenticated && setDropdownOpen(prev => !prev)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-slate-50 transition-colors group"
          >
            {/* Avatar */}
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white font-semibold text-sm shadow-sm">
              {fullName.charAt(0).toUpperCase()}
            </div>

            {/* User Info */}
            <div className="hidden sm:block text-left">
              <div className="text-sm font-semibold text-[#334155] group-hover:text-slate-700 transition-colors">
                {fullName}
              </div>
              <div className="text-xs text-slate-500">
                {user?.role || 'Admin'}
              </div>
            </div>

            {/* Chevron */}
            <FiChevronDown 
              size={16} 
              className={`text-slate-400 transition-transform ${
                dropdownOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          {/* Dropdown Menu */}
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden z-50 animate-fadeIn">
              {/* User Info Header */}
              <div className="px-4 py-3 bg-gradient-to-r from-slate-50 to-white border-b border-slate-100">
                <div className="text-sm font-semibold text-[#334155]">
                  {fullName}
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  {user?.email}
                </div>
              </div>

              {/* Menu Items */}
              <div className="py-1">
                <button
                  onClick={() => {
                    navigate('/admin/account')
                    setDropdownOpen(false)
                  }}
                  className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <FiUser size={16} className="text-slate-400" />
                  Thông tin tài khoản
                </button>

                <button
                  onClick={() => {
                    navigate('/admin/settings')
                    setDropdownOpen(false)
                  }}
                  className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <FiSettings size={16} className="text-slate-400" />
                  Cài đặt
                </button>
              </div>

              {/* Logout */}
              <div className="border-t border-slate-100">
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <FiLogOut size={16} />
                  Đăng xuất
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Fade-in animation */}
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
      `}</style>
    </header>
  )
}