import React, { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { apiService } from "../config/axios.js";

export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    otp: "",
    newPassword: "",
    confirmNewPassword: "",
  });

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const email = params.get("email") || "";

    setFormData((prev) => ({
      ...prev,
      email,
    }));

    if (!email) {
      toast.info("Vui lòng nhập email.");
    }
  }, [params]);

  const handleInputChange = (field) => (e) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const togglePasswordVisibility = () => setShowPassword((v) => !v);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    const email = formData.email.trim();
    const otp = formData.otp.trim();

    if (!email) {
      toast.error("Vui lòng nhập email.");
      return;
    }

    if (!otp) {
      toast.error("Vui lòng nhập OTP.");
      return;
    }

    if (!formData.newPassword) {
      toast.error("Vui lòng nhập mật khẩu mới.");
      return;
    }

    if (formData.newPassword !== formData.confirmNewPassword) {
      toast.error("Mật khẩu xác nhận không khớp.");
      return;
    }

    setLoading(true);
    try {
      const res = await apiService.post("/Auth/forgot-password", {
        email,
        otp,
        newPassword: formData.newPassword,
        confirmNewPassword: formData.confirmNewPassword,
      });

      if (res?.statusCode === 200) {
        toast.success(res?.message || "Đặt lại mật khẩu thành công!");
        navigate("/login", { replace: true });
        return;
      }

      toast.error(res?.message || "Đặt lại mật khẩu thất bại.");
    } catch (error) {
      const msg =
        error?.response?.data?.message ||
        error?.message ||
        "Đặt lại mật khẩu thất bại. Vui lòng thử lại.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <div className="px-6 pt-4">
        <Link
          to="/login"
          className="inline-flex items-center gap-2 text-sm text-gray-700 hover:text-black"
        >
          <span className="text-lg leading-none">&lt;</span>
          <span>Quay lại Đăng nhập</span>
        </Link>
      </div>

      <div className="mx-auto flex w-full max-w-3xl flex-col items-center px-6 pb-16 pt-10">
        <h1 className="mb-10 text-center text-4xl font-light tracking-wide">
          Đặt lại mật khẩu
        </h1>

        <form onSubmit={handleSubmit} className="w-full max-w-md space-y-5">
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

          <div>
            <label className="mb-2 block text-[11px] font-semibold tracking-wider text-gray-700">
              OTP:
            </label>
            <input
              type="text"
              value={formData.otp}
              onChange={handleInputChange("otp")}
              disabled={loading}
              className="h-10 w-full border border-gray-300 px-3 text-sm outline-none focus:border-black disabled:bg-gray-50"
              placeholder="Nhập mã OTP"
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-[11px] font-semibold tracking-wider text-gray-700">
              Mật khẩu mới:
            </label>

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={formData.newPassword}
                onChange={handleInputChange("newPassword")}
                disabled={loading}
                className="h-10 w-full border border-gray-300 px-3 text-sm outline-none focus:border-black pr-16 disabled:bg-gray-50"
                placeholder="Nhập mật khẩu mới"
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

          <div>
            <label className="mb-2 block text-[11px] font-semibold tracking-wider text-gray-700">
              Xác nhận mật khẩu mới:
            </label>

            <input
              type={showPassword ? "text" : "password"}
              value={formData.confirmNewPassword}
              onChange={handleInputChange("confirmNewPassword")}
              disabled={loading}
              className="h-10 w-full border border-gray-300 px-3 text-sm outline-none focus:border-black disabled:bg-gray-50"
              placeholder="Xác nhận mật khẩu mới"
              autoComplete="new-password"
              required
            />

            <p className="mt-2 text-[11px] text-gray-600">
              Mật khẩu phải có ít nhất 8 ký tự, bao gồm ít nhất một chữ cái viết hoa, một chữ cái viết thường, một số và một ký tự đặc biệt.
            </p>
          </div>

          <div className="space-y-4 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="h-10 w-full bg-black text-xs font-semibold tracking-wider text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Đang đặt lại..." : "Đặt lại mật khẩu"}
            </button>

            <Link
              to="/forgot-password"
              className="block text-center text-[11px] text-gray-700 hover:text-black hover:underline"
            >
              Gửi lại OTP
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
