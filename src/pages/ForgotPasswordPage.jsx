import React, { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import apiService from "../config/axios.js";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    const trimmed = email.trim();
    if (!trimmed) {
      toast.error("Vui lòng nhập email.");
      return;
    }

    setLoading(true);
    try {
      const res = await apiService.post("/auths/forgot-password", { email: trimmed });

      // backend thường trả Ok kể cả email không tồn tại (security)
      if (res?.data?.succeeded) {
        toast.success(res?.data?.message || "Nếu email tồn tại, hệ thống đã gửi link đặt lại mật khẩu.");
      } else {
        toast.error(res?.data?.message || "Gửi yêu cầu thất bại.");
      }
    } catch (error) {
      const msg =
        error?.response?.data?.message ||
        error?.message ||
        "Forgot password failed. Please try again.";
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
          Quên mật khẩu
        </h1>

        <form onSubmit={handleSubmit} className="w-full max-w-md space-y-5">
          <div>
            <label className="mb-2 block text-[11px] font-semibold tracking-wider text-gray-700">
              EMAIL:
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              className="h-10 w-full border border-gray-300 px-3 text-sm outline-none focus:border-black disabled:bg-gray-50"
              placeholder="example@email.com"
              autoComplete="email"
              required
            />
            <p className="mt-2 text-[11px] text-gray-600">
              Nếu email tồn tại, hệ thống sẽ gửi link đặt lại mật khẩu qua email của bạn.
            </p>
          </div>

          <div className="space-y-4 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="h-10 w-full bg-black text-xs font-semibold tracking-wider text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "ĐANG GỬI..." : "GỬI LINK RESET"}
            </button>

            <Link
              to="/login"
              className="block text-center text-[11px] text-gray-700 hover:text-black hover:underline"
            >
              Về trang đăng nhập
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
