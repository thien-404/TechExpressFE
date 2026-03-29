import { useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";

import apiService from "../config/axios";
import { useAuth } from "../store/authContext";

export default function GoogleCallbackPage() {
	const navigate = useNavigate();
	const [searchParams] = useSearchParams();
	const { login } = useAuth();
	const hasHandledRef = useRef(false);

	useEffect(() => {
		if (hasHandledRef.current) return;
		hasHandledRef.current = true;

		const handleGoogleCallback = async () => {
			const code = searchParams.get("code");
			const state = searchParams.get("state");
			const error = searchParams.get("error");
			const redirectUri = `${window.location.origin}/google-callback`;

			if (error) {
				toast.error(`Google login error: ${error}`);
				navigate("/login", { replace: true });
				return;
			}

			if (!code) {
				toast.error("Authorization code not found.");
				navigate("/login", { replace: true });
				return;
			}

			try {
				const response = await apiService.get("/Auth/google-callback", {
					params: {
						code,
						state: state || undefined,
						redirectUri,
					},
				});

				const payload = response?.data;
				const statusCode = payload?.statusCode;
				const authValue = payload?.value;
				const accessToken = authValue?.accessToken;
				const refreshToken = authValue?.refreshToken;

				if (statusCode !== 200 || !accessToken) {
					toast.error("Đăng nhập Google thất bại.");
					navigate("/login", { replace: true });
					return;
				}

				login(accessToken);
				if (refreshToken) {
					localStorage.setItem("refreshToken", refreshToken);
				}

				toast.success("Đăng nhập Google thành công!");
				navigate("/", { replace: true });
			} catch (apiError) {
				toast.error(
					apiError.response?.data?.message || "Không thể hoàn tất đăng nhập Google."
				);
				navigate("/login", { replace: true });
			}
		};

		handleGoogleCallback();
	}, [login, navigate, searchParams]);

	return (
		<div className="max-w-3xl mx-auto px-4 py-10 text-center">
			<h1 className="text-xl font-semibold mb-2">Đang xử lý đăng nhập Google</h1>
			<p className="text-slate-600">Vui lòng chờ trong giây lát...</p>
		</div>
	);
}
