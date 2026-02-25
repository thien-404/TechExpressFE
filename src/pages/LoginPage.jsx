import { NavLink, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { useState } from 'react'
import { toast } from 'sonner'
import { useAuth } from '../store/authContext'
import apiService from '../config/axios'
// import { GoogleLogin } from '@react-oauth/google' // ⛔ BE: login Google

export default function LoginPage() {
  /* =======================
   * STATE
   * ======================= */
  const [formData, setFormData] = useState({
    email: 'admin@techexpress.com',
    password: 'Admin@12345'
  })
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const { login } = useAuth()

  // ⛳ redirect sau login
  const from = searchParams.get("redirect") || location.state?.from?.pathname || '/'

  /* =======================
   * HANDLERS
   * ======================= */
  const handleChange = (field) => (e) => {
    setFormData((prev) => ({
      ...prev,
      [field]: e.target.value
    }))
  }

  /**
   * ⛔ BE: LOGIN BẰNG EMAIL + PASSWORD
   * - POST /auths/login
   * - body: { emailOrUsername, password }
   * - response: { token, user }
   */
  const handleSubmit = async (e) => {
  e.preventDefault()
  if (loading) return

  setLoading(true)

  try {
    const response = await apiService.post('/auth/login', {
      email: formData.email.trim(),
      password: formData.password
    })

    /**
     * BE response:
     * {
     *   statusCode: 200,
     *   value: { accessToken, refreshToken, email, role }
     * }
     */
    const { statusCode, value } = response.data || {}

    if (statusCode !== 200 || !value?.accessToken) {
      toast.error('Email hoặc mật khẩu không đúng!')
      return
    }

    const { accessToken, refreshToken } = value

    // AuthContext chịu trách nhiệm validate + decode JWT
    login(accessToken)

    // Lưu refresh token cho bước sau
    if (refreshToken) {
      localStorage.setItem('refreshToken', refreshToken)
    }

    toast.success('Đăng nhập thành công!')
    navigate(from, { replace: true })
  } catch (error) {
    toast.error(
      error.response?.data?.message ||
      'Đăng nhập thất bại. Vui lòng thử lại.'
    )
  } finally {
    setLoading(false)
  }
}

  /**
   * ⛔ BE: LOGIN GOOGLE
   * - POST /auths/google
   * - body: { idToken }
   */
  const onGoogleLogin = () => {
    toast.info('Google login chưa được tích hợp.')
  }

  /* =======================
   * RENDER
   * ======================= */
  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      {/* Breadcrumb */}
      <div className="text-sm text-slate-500 mb-8">
        <NavLink to="/" className="hover:underline hover:text-[#0090D0]">Trang chủ</NavLink> / <span className="text-slate-700">Đăng nhập tài khoản</span>
      </div>

      {/* Title */}
      <h1 className="text-2xl font-semibold text-center mb-2">
        ĐĂNG NHẬP TÀI KHOẢN
      </h1>
      <p className="text-center text-sm text-slate-600 mb-8">
        Bạn chưa có tài khoản?{' '}
        <NavLink to="/register" className="text-[#0090D0] hover:underline">
          Đăng ký tại đây
        </NavLink>
      </p>

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="max-w-xl mx-auto space-y-5"
      >
        {/* Email */}
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

        {/* Password */}
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

        {/* Submit */}
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

        {/* Divider */}
        <div className="text-center text-sm text-slate-500 pt-4">
          Hoặc đăng nhập bằng
        </div>

        {/* Social login */}
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
