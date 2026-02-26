import { NavLink, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { toast } from 'sonner'
import { apiService } from '../config/axios'

export default function ForgotPasswordPage() {
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)

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
      const res = await apiService.post('/Auth/forgot-password/request-otp', {
        email: trimmedEmail
      })

      if (res?.statusCode === 200) {
        toast.success(res?.message || 'Gửi mã OTP thành công.')
        navigate(`/reset-password?email=${encodeURIComponent(trimmedEmail)}`)
        return
      }

      toast.error(res?.message || 'Gửi yêu cầu thất bại.')
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

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="text-sm text-slate-500 mb-8">
        <NavLink to="/" className="hover:underline hover:text-[#0090D0]">
          Trang chu
        </NavLink>{' '}
        / <span className="text-slate-700">Dăng nhập</span>
      </div>

      <h1 className="text-2xl font-semibold text-center mb-2">Đặt lại mật khẩu</h1>
      <p className="text-center text-sm text-slate-600 mb-8">
        Chúng tôi sẽ gửi mã OTP qua email để bạn đặt lại mật khẩu.
      </p>

      <form onSubmit={handleSubmit} className="max-w-xl mx-auto space-y-5">
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
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
          {loading ? 'Đang gửi...' : 'Lấy lại mật khẩu'}
        </button>

        <div className="text-center text-sm text-slate-600">
          <NavLink to="/login" className="hover:underline hover:text-[#0090D0]">
            Quay lại
          </NavLink>
        </div>

        <div className="text-center text-sm text-slate-500 pt-6">Hoặc đăng nhập bằng</div>

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
