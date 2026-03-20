import { NavLink, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { useState } from 'react'
import { toast } from 'sonner'

import apiService from '../config/axios'
import { useAuth } from '../store/authContext'
import { decodeToken } from '../utils/jwt'

const ROLE_HOME_PATHS = {
  admin: '/admin',
  staff: '/staff',
  customer: '/',
}

const normalizeRole = (role) => String(role || '').trim().toLowerCase()

const getRoleHomePath = (role) => {
  const normalizedRole = normalizeRole(role)
  return ROLE_HOME_PATHS[normalizedRole] || ROLE_HOME_PATHS.customer
}

const normalizeRequestedPath = (requestedPath) => {
  if (!requestedPath || typeof requestedPath !== 'string') return ''

  try {
    const parsed = new URL(requestedPath, 'http://localhost')
    if (parsed.origin !== 'http://localhost') return ''
    return `${parsed.pathname}${parsed.search}${parsed.hash}`
  } catch {
    return ''
  }
}

const isPathAllowedForRole = (requestedPath, role) => {
  const normalizedPath = normalizeRequestedPath(requestedPath)
  if (!normalizedPath.startsWith('/')) return false

  const normalizedRole = normalizeRole(role)

  if (normalizedPath.startsWith('/admin')) {
    return normalizedRole === 'admin'
  }

  if (normalizedPath.startsWith('/staff')) {
    return normalizedRole === 'staff'
  }

  return true
}

const resolvePostLoginPath = ({ requestedPath, role }) => {
  if (isPathAllowedForRole(requestedPath, role)) {
    return normalizeRequestedPath(requestedPath)
  }

  return getRoleHomePath(role)
}

export default function LoginPage() {
  const [formData, setFormData] = useState({
    email: 'admin@techexpress.com',
    password: 'Admin@12345',
  })
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const { login } = useAuth()

  const requestedPath =
    searchParams.get('redirect') || location.state?.from?.pathname || '/'

  const handleChange = (field) => (event) => {
    setFormData((prev) => ({
      ...prev,
      [field]: event.target.value,
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (loading) return

    setLoading(true)

    try {
      const response = await apiService.post('/auth/login', {
        email: formData.email.trim(),
        password: formData.password,
      })

      const { statusCode, value } = response.data || {}

      if (statusCode !== 200 || !value?.accessToken) {
        toast.error('Email hoặc mật khẩu không đúng!')
        return
      }

      const { accessToken, refreshToken, role: responseRole } = value
      const decodedUser = decodeToken(accessToken)
      const resolvedRole = responseRole || decodedUser?.role

      login(accessToken)

      if (refreshToken) {
        localStorage.setItem('refreshToken', refreshToken)
      }

      const destination = resolvePostLoginPath({
        requestedPath,
        role: resolvedRole,
      })

      toast.success('Đăng nhập thành công!')
      navigate(destination, { replace: true })
    } catch (error) {
      toast.error(
        error.response?.data?.message || 'Đăng nhập thất bại. Vui lòng thử lại.'
      )
    } finally {
      setLoading(false)
    }
  }

  const onGoogleLogin = () => {
    toast.info('Google login chưa được tích hợp.')
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="text-sm text-slate-500 mb-8">
        <NavLink to="/" className="hover:underline hover:text-[#0090D0]">
          Trang chủ
        </NavLink>{' '}
        / <span className="text-slate-700">Đăng nhập tài khoản</span>
      </div>

      <h1 className="text-2xl font-semibold text-center mb-2">
        ĐĂNG NHẬP TÀI KHOẢN
      </h1>
      <p className="text-center text-sm text-slate-600 mb-8">
        Bạn chưa có tài khoản?{' '}
        <NavLink to="/register" className="text-[#0090D0] hover:underline">
          Đăng ký tại đây
        </NavLink>
      </p>

      <form onSubmit={handleSubmit} className="max-w-xl mx-auto space-y-5">
        <div>
          <label className="block text-sm font-medium mb-1">
            Email <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange('email')}
            disabled={loading}
            className="
              w-full border border-slate-300 rounded-md
              px-4 py-2 focus:outline-none focus:ring-1
              focus:ring-[#0090D0] disabled:bg-slate-100
            "
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Mật khẩu <span className="text-red-500">*</span>
          </label>
          <input
            type="password"
            placeholder="Mật khẩu"
            value={formData.password}
            onChange={handleChange('password')}
            disabled={loading}
            className="
              w-full border border-slate-300 rounded-md
              px-4 py-2 focus:outline-none focus:ring-1
              focus:ring-[#0090D0] disabled:bg-slate-100
            "
            required
          />
          <div className="text-sm mt-2">
            Quên mật khẩu?{' '}
            <NavLink to="/forgot-password" className="text-[#0090D0]">
              Nhấn vào đây
            </NavLink>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="
            w-full bg-yellow-400 hover:bg-yellow-500
            text-white font-semibold
            py-3 rounded-full transition
            disabled:opacity-60
          "
        >
          {loading ? 'ĐANG ĐĂNG NHẬP...' : 'Đăng nhập'}
        </button>

        <div className="text-center text-sm text-slate-500 pt-4">
          Hoặc đăng nhập bằng
        </div>

        <div className="flex gap-3 justify-center pt-2">
          <button
            type="button"
            onClick={onGoogleLogin}
            disabled={loading}
            className="flex items-center gap-2 bg-[#dd4b39] text-white px-6 py-2 rounded-md text-sm"
          >
            Google
          </button>
        </div>
      </form>
    </div>
  )
}
