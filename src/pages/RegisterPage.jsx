import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "../store/authContext";
import apiService from "../config/axios";

const validateForm = ({ firstName, lastName, phone, email, password }) => {
  if (!firstName.trim() || firstName.length < 2)
    return "Họ phải có ít nhất 2 ký tự";

  if (!lastName.trim() || lastName.length < 2)
    return "Tên phải có ít nhất 2 ký tự";

  if (!/^0\d{9,10}$/.test(phone)) return "Số điện thoại không hợp lệ";

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return "Email không đúng định dạng";

  if (!/^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(password))
    return "Mật khẩu ≥ 8 ký tự, gồm chữ & số";

  return null; // ✅ hợp lệ
};

export default function RegisterPage() {
  /* =======================
   * STATE
   * ======================= */
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);

  /* =======================
   * ROUTER / AUTH
   * ======================= */
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const from = location.state?.from?.pathname || "/";

  /* =======================
   * HANDLERS
   * ======================= */
  const handleChange = (field) => (e) => {
    setFormData((prev) => ({
      ...prev,
      [field]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    const error = validateForm(formData);
    if (error) {
      toast.error(error);
      return;
    }

    setLoading(true);

    try {
      const res = await apiService.post("/auth/register", {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim(),
        password: formData.password,
      });

      const { statusCode, value } = res.data || {};

      if (statusCode !== 201) {
        toast.error("Đăng ký thất bại!");
        return;
      }

      if (value?.accessToken) {
        login(value.accessToken);
        value.refreshToken &&
          localStorage.setItem("refreshToken", value.refreshToken);
        navigate(from, { replace: true });
        toast.success("Đăng ký thành công!");
        return;
      }

      toast.success("Đăng ký thành công! Vui lòng đăng nhập.");
      navigate("/login");
    } catch (err) {
      toast.error(err.response?.data?.message || "Đăng ký thất bại");
    } finally {
      setLoading(false);
    }
  };

  /* =======================
   * RENDER
   * ======================= */
  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      {/* Breadcrumb */}
      <div className="text-sm text-slate-500 mb-8">
        <NavLink to="/" className="hover:underline hover:text-[#0090D0]">
          Trang chủ
        </NavLink>{" "}
        / <span className="text-slate-700">Đăng ký tài khoản</span>
      </div>

      {/* Title */}
      <h1 className="text-2xl font-semibold text-center mb-2">
        ĐĂNG KÝ TÀI KHOẢN
      </h1>
      <p className="text-center text-sm text-slate-600 mb-8">
        Bạn đã có tài khoản?{" "}
        <NavLink to="/login" className="text-[#0090D0] hover:underline">
          Đăng nhập tại đây
        </NavLink>
      </p>

      {/* Form */}
      <form onSubmit={handleSubmit} className="max-w-xl mx-auto space-y-5">
        <h2 className="text-center text-lg font-medium mb-4">
          THÔNG TIN CÁ NHÂN
        </h2>

        {/* First name */}
        <Input
          label="Họ"
          value={formData.firstName}
          onChange={handleChange("firstName")}
          disabled={loading}
        />

        {/* Last name */}
        <Input
          label="Tên"
          value={formData.lastName}
          onChange={handleChange("lastName")}
          disabled={loading}
        />

        {/* Phone */}
        <Input
          label="Số điện thoại"
          value={formData.phone}
          onChange={handleChange("phone")}
          disabled={loading}
          type="tel"
        />

        {/* Email */}
        <Input
          label="Email"
          value={formData.email}
          onChange={handleChange("email")}
          disabled={loading}
          type="email"
        />

        {/* Password */}
        <Input
          label="Mật khẩu"
          value={formData.password}
          onChange={handleChange("password")}
          disabled={loading}
          type="password"
        />

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
          {loading ? "ĐANG ĐĂNG KÝ..." : "Đăng ký"}
        </button>
      </form>
    </div>
  );
}

/* =======================
 * SUB COMPONENT
 * ======================= */
function Input({ label, ...props }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1">
        {label} <span className="text-red-500">*</span>
      </label>
      <input
        {...props}
        required
        className="
          w-full border border-slate-300 rounded-md
          px-4 py-2 focus:outline-none focus:ring-1
          focus:ring-[#0090D0] disabled:bg-slate-100
        "
      />
    </div>
  );
}
