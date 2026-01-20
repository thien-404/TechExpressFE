import React, { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import apiService from "../config/axios.js";

export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    token: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const email = params.get("email") || "";
    const token = params.get("token") || "";

    setFormData((prev) => ({
      ...prev,
      email,
      token,
    }));

    // Nếu user vào thẳng page mà không có token
    if (!email || !token) {
      toast.info("Thiếu email hoặc token. Vui lòng mở link từ email reset password.");
    }
  }, [params]);

  const handleInputChange = (field) => (e) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const togglePasswordVisibility = () => setShowPassword((v) => !v);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    const email = formData.email?.trim();
    const token = formData.token?.trim();

    if (!email || !token) {
      toast.error("Thiếu email hoặc token. Hãy mở link từ email reset password.");
      return;
    }

    if (!formData.newPassword) {
      toast.error("Vui lòng nhập mật khẩu mới.");
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      toast.error("Mật khẩu xác nhận không khớp.");
      return;
    }

    setLoading(true);
    try {
      const res = await apiService.post("/auths/reset-password", {
        email,
        token,
        newPassword: formData.newPassword,
        confirmPassword: formData.confirmPassword,
      });

      if (res?.data?.succeeded) {
        toast.success(res?.data?.message || "Đặt lại mật khẩu thành công!");
        navigate("/login", { replace: true });
        return;
      }

      toast.error(res?.data?.message || "Reset password thất bại.");
    } catch (error) {
      const msg =
        error?.response?.data?.message ||
        error?.message ||
        "Reset password failed. Please try again.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      {/* Back */}
      <div className="px-6 pt-4">
        <Link
          to="/login"
          className="inline-flex items-center gap-2 text-sm text-gray-700 hover:text-black"
        >
          <span className="text-lg leading-none">‹</span>
          <span>Quay lại Đăng nhập</span>
        </Link>
      </div>

      {/* Content */}
      <div className="mx-auto flex w-full max-w-3xl flex-col items-center px-6 pb-16 pt-10">
        <h1 className="mb-10 text-center text-4xl font-light tracking-wide">
          Đặt lại mật khẩu
        </h1>

        <form onSubmit={handleSubmit} className="w-full max-w-md space-y-5">
          {/* Email (readonly nếu có từ link) */}
          <div>
            <label className="mb-2 block text-[11px] font-semibold tracking-wider text-gray-700">
              EMAIL:
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={handleInputChange("email")}
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
              MẬT KHẨU MỚI:
            </label>

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={formData.newPassword}
                onChange={handleInputChange("newPassword")}
                disabled={loading}
                className="h-10 w-full border border-gray-300 px-3 text-sm outline-none focus:border-black pr-16 disabled:bg-gray-50"
                placeholder="New password"
                autoComplete="new-password"
                required
              />

              <button
                type="button"
                onClick={togglePasswordVisibility}
                disabled={loading}
                className="absolute inset-y-0 right-0 px-3 text-xs font-semibold tracking-wider text-gray-600 hover:text-black"
              >
                {showPassword ? "HIDE" : "SHOW"}
              </button>
            </div>
          </div>

          {/* Confirm */}
          <div>
            <label className="mb-2 block text-[11px] font-semibold tracking-wider text-gray-700">
              XÁC NHẬN MẬT KHẨU:
            </label>

            <input
              type={showPassword ? "text" : "password"}
              value={formData.confirmPassword}
              onChange={handleInputChange("confirmPassword")}
              disabled={loading}
              className="h-10 w-full border border-gray-300 px-3 text-sm outline-none focus:border-black disabled:bg-gray-50"
              placeholder="Confirm password"
              autoComplete="new-password"
              required
            />

            <p className="mt-2 text-[11px] text-gray-600">
              Link token chỉ dùng được 1 lần. Nếu báo token không hợp lệ, bạn hãy gửi lại yêu cầu “quên mật khẩu”.
            </p>
          </div>

          <div className="space-y-4 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="h-10 w-full bg-black text-xs font-semibold tracking-wider text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "ĐANG RESET..." : "RESET PASSWORD"}
            </button>

            <Link
              to="/forgot-password"
              className="block text-center text-[11px] text-gray-700 hover:text-black hover:underline"
            >
              Gửi lại link reset
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
