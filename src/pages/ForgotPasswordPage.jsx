import { NavLink } from 'react-router-dom'
import { useState } from 'react'
import { toast } from 'sonner'
// import apiService from '../config/axios' // ⛔ BE: dùng khi tích hợp backend

export default function ForgotPasswordPage() {
  /* =======================
   * STATE
   * ======================= */
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)

  /* =======================
   * HANDLERS
   * ======================= */

  /**
   * ⛔ BE: FORGOT PASSWORD
   * - POST /auths/forgot-password
   * - body: { email }
   * - response: { succeeded, message }
   *
   * ⚠️ Lưu ý:
   * Backend thường trả OK dù email không tồn tại (security reason)
   */
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (loading) return

    const trimmedEmail = email.trim()
    if (!trimmedEmail) {
      toast.error('Vui lòng nhập email.')
      return
    }

    setLoading(true)
    try {
      // ⛔ BE CALL (tạm thời mock)
      /*
      const res = await apiService.post('/auths/forgot-password', {
        email: trimmedEmail
      })

      if (res?.data?.succeeded) {
        toast.success(
          res?.data?.message ||
            'Nếu email tồn tại, hệ thống đã gửi link đặt lại mật khẩu.'
        )
      } else {
        toast.error(res?.data?.message || 'Gửi yêu cầu thất bại.')
      }
      */

      // ✅ MOCK để test UI
      toast.success(
        'Nếu email tồn tại, hệ thống đã gửi link đặt lại mật khẩu.'
      )
      setEmail('')
    } catch (error) {
      const msg =
        error?.response?.data?.message ||
        error?.message ||
        'Gửi yêu cầu thất bại. Vui lòng thử lại.'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  /* =======================
   * RENDER
   * ======================= */
  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      {/* Breadcrumb */}
      <div className="text-sm text-slate-500 mb-8">
        <NavLink
          to="/"
          className="hover:underline hover:text-[#0090D0]"
        >
          Trang chủ
        </NavLink>{' '}
        / <span className="text-slate-700">Đăng nhập tài khoản</span>
      </div>

      {/* Title */}
      <h1 className="text-2xl font-semibold text-center mb-2">
        ĐẶT LẠI MẬT KHẨU
      </h1>
      <p className="text-center text-sm text-slate-600 mb-8">
        Chúng tôi sẽ gửi cho bạn một email để kích hoạt việc đặt lại mật
        khẩu.
      </p>

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="max-w-xl mx-auto space-y-5"
      >
        {/* Email */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Email
          </label>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            className="
              w-full border border-slate-300 rounded-md
              px-4 py-2 focus:outline-none focus:ring-1
              focus:ring-[#0090D0] disabled:bg-slate-100
            "
            required
          />
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
          {loading ? 'ĐANG GỬI...' : 'Lấy lại mật khẩu'}
        </button>

        {/* Back */}
        <div className="text-center text-sm text-slate-600">
          <NavLink
            to="/login"
            className="hover:underline hover:text-[#0090D0]"
          >
            Quay lại
          </NavLink>
        </div>

        {/* Divider */}
        <div className="text-center text-sm text-slate-500 pt-6">
          Hoặc đăng nhập bằng
        </div>

        {/* Social login */}
        <div className="flex gap-3 justify-center pt-2">
          <button
            type="button"
            disabled
            className="flex items-center gap-2 bg-[#dd4b39] text-white px-6 py-2 rounded-md text-sm opacity-70 cursor-not-allowed"
          >
            Google
          </button>
        </div>
      </form>
    </div>
  )
}
