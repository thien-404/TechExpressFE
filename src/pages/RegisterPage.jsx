import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { toast } from 'sonner'
import { useAuth } from '../store/authContext.jsx'
// import apiService from '../../config/axios' // ⛔ BE: sẽ dùng khi tích hợp backend
// import { GoogleLogin } from '@react-oauth/google' // ⛔ BE: đăng ký bằng Google

export default function RegisterPage() {
  /* =======================
   * STATE
   * ======================= */
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    password: ''
  })
  const [loading, setLoading] = useState(false)

  /* =======================
   * ROUTER / AUTH
   * ======================= */
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuth()

  // ⛳ redirect sau register (nếu có)
  const from = location.state?.from?.pathname || '/'

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
   * ⛔ BE: REGISTER ACCOUNT
   * - POST /auths/register
   * - body:
   *   {
   *     firstName,
   *     lastName,
   *     phone,
   *     email,
   *     password
   *   }
   * - response: { token, user }
   */
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (loading) return

    setLoading(true)

    try {
      // ⛔ BE CALL (tạm thời mock)
      /*
      const response = await apiService.post('/auths/register', {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim(),
        password: formData.password
      })

      if (response.data.succeeded && response.data.data.token) {
        login(response.data.data.token)
        toast.success('Đăng ký thành công!')
        navigate(from, { replace: true })
      }
      */

      // ✅ MOCK để test UI
      if (
        formData.firstName &&
        formData.lastName &&
        formData.email &&
        formData.password
      ) {
        login('FAKE_REGISTER_TOKEN')
        toast.success('Đăng ký thành công (mock)')
        navigate(from, { replace: true })
        return
      }

      toast.error('Vui lòng nhập đầy đủ thông tin!')
    } catch (error) {
      toast.error('Đăng ký thất bại. Vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }

  /**
   * ⛔ BE: REGISTER / LOGIN GOOGLE
   * - POST /auths/google
   * - body: { idToken }
   */
  const onGoogleRegister = () => {
    toast.info('Đăng ký Google chưa được tích hợp.')
  }

  /* =======================
   * RENDER
   * ======================= */
  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      {/* Breadcrumb */}
      <div className="text-sm text-slate-500 mb-8">
        <NavLink to="/" className="hover:underline hover:text-[#0090D0]">Trang chủ</NavLink> / <span className="text-slate-700">Đăng ký tài khoản</span>
      </div>

      {/* Title */}
      <h1 className="text-2xl font-semibold text-center mb-2">
        ĐĂNG KÝ TÀI KHOẢN
      </h1>
      <p className="text-center text-sm text-slate-600 mb-8">
        Bạn đã có tài khoản?{' '}
        <NavLink to="/login" className="text-[#0090D0] hover:underline">
          Đăng nhập tại đây
        </NavLink>
      </p>

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="max-w-xl mx-auto space-y-5"
      >
        <h2 className="text-center text-lg font-medium mb-4">
          THÔNG TIN CÁ NHÂN
        </h2>

        {/* Họ */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Họ <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            placeholder="Họ"
            value={formData.firstName}
            onChange={handleChange('firstName')}
            disabled={loading}
            className="
              w-full border border-slate-300 rounded-md
              px-4 py-2 focus:outline-none focus:ring-1
              focus:ring-[#0090D0] disabled:bg-slate-100
            "
            required
          />
        </div>

        {/* Tên */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Tên <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            placeholder="Tên"
            value={formData.lastName}
            onChange={handleChange('lastName')}
            disabled={loading}
            className="
              w-full border border-slate-300 rounded-md
              px-4 py-2 focus:outline-none focus:ring-1
              focus:ring-[#0090D0] disabled:bg-slate-100
            "
            required
          />
        </div>

        {/* Phone */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Số điện thoại <span className="text-red-500">*</span>
          </label>
          <input
            type="tel"
            placeholder="Số điện thoại"
            value={formData.phone}
            onChange={handleChange('phone')}
            disabled={loading}
            className="
              w-full border border-slate-300 rounded-md
              px-4 py-2 focus:outline-none focus:ring-1
              focus:ring-[#0090D0] disabled:bg-slate-100
            "
            required
          />
        </div>

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
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="
            w-full bg-yellow-400 hover:bg-yellow-500
            text-green-800 font-semibold
            py-3 rounded-full transition
            disabled:opacity-60
          "
        >
          {loading ? 'ĐANG ĐĂNG KÝ...' : 'Đăng ký'}
        </button>

        {/* Divider */}
        <div className="text-center text-sm text-slate-500 pt-4">
          Hoặc đăng nhập bằng
        </div>

        {/* Social register */}
        <div className="flex gap-3 justify-center pt-2">
          <button
            type="button"
            onClick={onGoogleRegister}
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


// import React, { useState } from 'react'
// import { Link, useNavigate, useLocation } from 'react-router-dom'
// import { toast } from 'sonner'
// import apiService from '../config/axios.js'

// export default function RegisterPage() {
//     const [formData, setFormData] = useState({
//         email: '',
//         password: '',
//         firstName: '',
//         lastName: '',
//     })

//     const [loading, setLoading] = useState(false)
//     const [showPassword, setShowPassword] = useState(false)

//     const navigate = useNavigate()
//     const location = useLocation()

//     // nếu bạn muốn sau register quay lại login và giữ "from" để login xong quay về đúng trang
//     const from = location.state?.from?.pathname || '/'

//     const handleInputChange = (field) => (e) => {
//         setFormData((prev) => ({
//             ...prev,
//             [field]: e.target.value
//         }))
//     }

//     const togglePasswordVisibility = () => setShowPassword((v) => !v)

//     const handleSubmit = async (e) => {
//         e.preventDefault()
//         if (loading) return

//         const email = formData.email.trim()
//         const password = formData.password

//         if (!email) {
//             toast.error('Vui lòng nhập email!')
//             return
//         }
//         if (!password) {
//             toast.error('Vui lòng nhập mật khẩu!')
//             return
//         }

//         setLoading(true)
//         try {
//             const payload = {
//                 email,
//                 password,
//                 firstName: formData.firstName?.trim() || null,
//                 lastName: formData.lastName?.trim() || null
//             }

//             // role hardcode
//             const response = await apiService.post(
//                 '/auths/user/register',
//                 payload
//             )

//             if (response?.data?.succeeded) {
//                 toast.success(response?.data?.message || 'Đăng ký thành công!')
//                 navigate('/login', { replace: true })
//                 return
//             }

//             toast.error(response?.data?.message || 'Đăng ký thất bại!')
//         } catch (error) {
//             const errorMsg =
//                 error?.response?.data?.message ||
//                 error?.message ||
//                 'Register failed. Please try again.'
//             toast.error(errorMsg)
//         } finally {
//             setLoading(false)
//         }
//     }


//     return (
//         <div className="w-full">
//             {/* Back */}
//             <div className="px-6 pt-4">
//                 <Link
//                     to="/"
//                     className="inline-flex items-center gap-2 text-sm text-gray-700 hover:text-black"
//                 >
//                     <span className="text-lg leading-none">‹</span>
//                     <span>Quay lại Mua Sắm</span>
//                 </Link>
//             </div>

//             {/* Content */}
//             <div className="mx-auto flex w-full max-w-3xl flex-col items-center px-6 pb-16 pt-10">
//                 <h1 className="mb-10 text-center text-4xl font-light tracking-wide">
//                     Create My Viren Account
//                 </h1>

//                 <form onSubmit={handleSubmit} className="w-full max-w-md space-y-5">


//                     {/* First Name */}
//                     <div>
//                         <label className="mb-2 block text-[11px] font-semibold tracking-wider text-gray-700">
//                             FIRST NAME:
//                         </label>
//                         <input
//                             type="text"
//                             value={formData.firstName}
//                             onChange={handleInputChange('firstName')}
//                             disabled={loading}
//                             className="h-10 w-full border border-gray-300 px-3 text-sm outline-none focus:border-black disabled:bg-gray-50"
//                             placeholder="First name"
//                             autoComplete="given-name"
//                         />
//                     </div>

//                     {/* Last Name */}
//                     <div>
//                         <label className="mb-2 block text-[11px] font-semibold tracking-wider text-gray-700">
//                             LAST NAME:
//                         </label>
//                         <input
//                             type="text"
//                             value={formData.lastName}
//                             onChange={handleInputChange('lastName')}
//                             disabled={loading}
//                             className="h-10 w-full border border-gray-300 px-3 text-sm outline-none focus:border-black disabled:bg-gray-50"
//                             placeholder="Last name"
//                             autoComplete="family-name"
//                         />
//                     </div>

//                     {/* Email */}
//                     <div>
//                         <label className="mb-2 block text-[11px] font-semibold tracking-wider text-gray-700">
//                             EMAIL:
//                         </label>
//                         <input
//                             type="email"
//                             value={formData.email}
//                             onChange={handleInputChange('email')}
//                             disabled={loading}
//                             className="h-10 w-full border border-gray-300 px-3 text-sm outline-none focus:border-black disabled:bg-gray-50"
//                             placeholder="example@email.com"
//                             autoComplete="email"
//                             required
//                         />
//                     </div>

//                     {/* Password */}
//                     <div>
//                         <label className="mb-2 block text-[11px] font-semibold tracking-wider text-gray-700">
//                             MẬT KHẨU:
//                         </label>

//                         <div className="relative">
//                             <input
//                                 type={showPassword ? 'text' : 'password'}
//                                 value={formData.password}
//                                 onChange={handleInputChange('password')}
//                                 disabled={loading}
//                                 className="h-10 w-full border border-gray-300 px-3 text-sm outline-none focus:border-black pr-16 disabled:bg-gray-50"
//                                 placeholder="Password"
//                                 autoComplete="new-password"
//                                 required
//                             />

//                             <button
//                                 type="button"
//                                 onClick={togglePasswordVisibility}
//                                 disabled={loading}
//                                 className="absolute inset-y-0 right-0 px-3 text-xs font-semibold tracking-wider text-gray-600 hover:text-black"
//                             >
//                                 {showPassword ? 'HIDE' : 'SHOW'}
//                             </button>
//                         </div>

//                         <div className="mt-2 flex justify-end text-[11px] text-gray-600">
//                             <Link to="/login" className="hover:underline hover:text-black">
//                                 Đã có tài khoản? Đăng nhập
//                             </Link>
//                         </div>
//                     </div>

//                     {/* Buttons */}
//                     <div className="space-y-4 pt-4">
//                         <button
//                             type="submit"
//                             disabled={loading}
//                             className="h-10 w-full bg-black text-xs font-semibold tracking-wider text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
//                         >
//                             {loading ? 'ĐANG ĐĂNG KÝ...' : 'ĐĂNG KÝ'}
//                         </button>

//                         <button
//                             type="button"
//                             disabled={loading}
//                             onClick={() => navigate('/login', { state: { from } })}
//                             className="h-10 w-full border border-gray-300 text-xs font-semibold tracking-wider text-gray-800 hover:border-black disabled:opacity-50 disabled:cursor-not-allowed"
//                         >
//                             QUAY LẠI ĐĂNG NHẬP
//                         </button>
//                     </div>
//                 </form>
//             </div>
//         </div>
//     )
// }
