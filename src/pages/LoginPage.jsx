import React, { useEffect, useState, useRef } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useAuth } from '../store/authContext.jsx'
import apiService from '../config/axios.js'
import { GoogleLogin } from "@react-oauth/google";


export default function LoginPage() {
  const [formData, setFormData] = useState({
    email: 'admin@viren.com',
    password: 'Admin@123'
  })
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const googleBtnRef = useRef(null)

  const navigate = useNavigate()
  const location = useLocation()
  const { login, isAuthenticated } = useAuth()

  const from = location.state?.from?.pathname || '/'

  

  const handleInputChange = (field) => (e) => {
    setFormData((prev) => ({
      ...prev,
      [field]: e.target.value
    }))
  }

  const togglePasswordVisibility = () => {
    setShowPassword((v) => !v)
  }

  const getRedirectPath = (role, fromPath) => {
    if (role === 'Admin') {
      return fromPath?.startsWith('/admin') ? fromPath : '/admin'
    }
    return fromPath || '/'
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (loading) return

    setLoading(true)
    try {
      const response = await apiService.post('/auths/login', {
        emailOrUsername: formData.email.trim(),
        password: formData.password
      })
      console.log('Login response:', response)
      if (response?.data?.succeeded && response?.data?.data?.token) {
        const token = response.data.data.token
        login(token)
      
        toast.success(response.data.message || 'Đăng nhập thành công!')
      
        const savedUser = JSON.parse(localStorage.getItem('user') || 'null')
        const role = savedUser?.role
      
        const nextPath = getRedirectPath(role, from)
        navigate(nextPath, { replace: true })
        return
      }
      

      toast.error(response?.data?.message || 'Sai email hoặc mật khẩu!')
    } catch (error) {
      console.error('Login error:', error)
      const errorMsg =
        error?.response?.data?.message ||
        error?.message ||
        'Login failed. Please try again.'
      toast.error(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  const onGoogleLogin = () => {
    toast.info('Google login chưa được tích hợp.')
  }

  return (
    <div className="w-full">
      {/* Back */}
      <div className="px-6 pt-4">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-gray-700 hover:text-black"
        >
          <span className="text-lg leading-none">‹</span>
          <span>Quay lại Mua Sắm</span>
        </Link>
      </div>

      {/* Content */}
      <div className="mx-auto flex w-full max-w-3xl flex-col items-center px-6 pb-16 pt-10">
        <h1 className="mb-10 text-center text-4xl font-light tracking-wide">
          My Viren Account
        </h1>

        <form onSubmit={handleSubmit} className="w-full max-w-md space-y-5">
          {/* Email */}
          <div>
            <label className="mb-2 block text-[11px] font-semibold tracking-wider text-gray-700">
              EMAIL:
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={handleInputChange('email')}
              disabled={loading}
              className="h-10 w-full border border-gray-300 px-3 text-sm outline-none focus:border-black disabled:bg-gray-50"
              placeholder="example@email.com"
              autoComplete="email"
              required
            />
          </div>

          {/* Password */}
          <div>
            <label className="mb-2 block text-[11px] font-semibold tracking-wider text-gray-700">
              MẬT KHẨU:
            </label>

            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={handleInputChange('password')}
                disabled={loading}
                className="h-10 w-full border border-gray-300 px-3 text-sm outline-none focus:border-black pr-16 disabled:bg-gray-50"
                placeholder="Password"
                autoComplete="current-password"
                required
              />

              <button
                type="button"
                onClick={togglePasswordVisibility}
                disabled={loading}
                className="absolute inset-y-0 right-0 px-3 text-xs font-semibold tracking-wider text-gray-600 hover:text-black"
              >
                {showPassword ? 'HIDE' : 'SHOW'}
              </button>
            </div>

            <div className="mt-2 flex justify-between text-[11px] text-gray-600">
            <Link
              to="/forgot-password"
              className="hover:underline hover:text-black"
            >
              Quên mật khẩu?
            </Link>

              {/* Bạn có thể đổi sang /register nếu bạn tạo page register */}
              <Link to="/register" className="hover:underline hover:text-black">
                Đăng ký?
              </Link>
            </div>
          </div>

          {/* Buttons */}
          <div className="space-y-4 pt-4">
  {/* Normal login */}
  <button
    type="submit"
    disabled={loading}
    className="h-10 w-full bg-black text-xs font-semibold tracking-wider text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
  >
    {loading ? 'ĐANG ĐĂNG NHẬP...' : 'ĐĂNG NHẬP'}
  </button>

  {/* Google login (custom UI + hidden Google button) */}
  <div className="relative">
    {/* Button UI của bạn (giữ y như cũ) */}
    <button
      type="button"
      disabled={loading}
      onClick={() => {
        const btn = googleBtnRef.current?.querySelector('div[role="button"]')
        btn?.click()
      }}
      className="flex h-10 w-full items-center justify-center gap-2 border border-gray-300 text-xs font-semibold tracking-wider text-gray-800 hover:border-black disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <img
        src="https://www.svgrepo.com/show/475656/google-color.svg"
        alt="google"
        className="h-4 w-4"
      />
      LOGIN WITH GOOGLE
    </button>

    {/* GoogleLogin thật (ẩn) */}
    <div ref={googleBtnRef} className="absolute inset-0 opacity-0" aria-hidden="true">
      <GoogleLogin
        useOneTap={false}
        onSuccess={async (cred) => {
          const idToken = cred?.credential
          if (!idToken) {
            toast.error('Không lấy được Google credential.')
            return
          }

          if (loading) return
          setLoading(true)

          try {
            const response = await apiService.post('/auths/google', { idToken })
            const token = response?.data?.data?.token

            if (response?.data?.succeeded && token) {
              login(token)
              toast.success(response.data.message || 'Đăng nhập Google thành công!')
            
              const savedUser = JSON.parse(localStorage.getItem('user') || 'null')
              const role = savedUser?.role
            
              const nextPath = getRedirectPath(role, from)
              navigate(nextPath, { replace: true })
              return
            }
            

            toast.error(response?.data?.message || 'Đăng nhập Google thất bại!')
          } catch (error) {
            const errorMsg =
              error?.response?.data?.message ||
              error?.message ||
              'Google login failed. Please try again.'
            toast.error(errorMsg)
          } finally {
            setLoading(false)
          }
        }}
        onError={() => toast.error('Google login failed.')}
      />
    </div>
  </div>
</div>

        </form>
      </div>
    </div>
  )
}
