// pages/customer/AccountPage.jsx
import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../../store/authContext.jsx";
import { apiService } from "../../../config/axios";

import AccountSidebar from "../../../components/ui/AccountSideBar.jsx";
import AccountInfoTab from "./tabs/AccountInfoTab";

export default function AccountPage() {
  const { token, logout } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("profile");

  const [form, setForm] = useState({
    id: "",
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    gender: null,
    address: "",
    ward: "",
    province: "",
    postalCode: "",
    avatarImage: ""
  });

  const setField = (k, v) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  /* ================= GET /user/me ================= */
  const { data: user, isLoading } = useQuery({
    enabled: !!token,
    queryKey: ["user-me"],
    queryFn: async () => {
      const res = await apiService.get("/user/me");
      if (res?.statusCode !== 200) {
        throw new Error("Không lấy được thông tin người dùng");
      }
      return res.value;
    },
  });

    // Cập nhật form khi có dữ liệu user
    useEffect(() => {
      if (!user) return;
      setForm({
        id: user.id ?? "",
        firstName: user.firstName ?? "",
        lastName: user.lastName ?? "",
        email: user.email ?? "",
        phone: user.phone ?? "",
        gender: user.gender ?? null,
        address: user.address ?? "",
        ward: user.ward ?? "",
        province: user.province ?? "",
        postalCode: user.postalCode ?? "",
        avatarImage: user.avatarImage ?? ""
      });
    }, [user]);

  /* ================= PUT /user/me ================= */
  const updateMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        firstName: form.firstName,
        lastName: form.lastName,
        phone: form.phone,
        gender: form.gender, // Male | Female | Other
        address: form.address,
        ward: form.ward,
        province: form.province,
        postalCode: form.postalCode,
        avatarImage: form.avatarImage
      };
      console.log("Updating user with payload:", payload);
      const res = await apiService.put("/user/me", payload);
      if (res?.statusCode !== 200) {
        throw new Error(res?.message || "Cập nhật thất bại");
      }
      return res;
    },
    onSuccess: () => {
      toast.success("Cập nhật thông tin thành công");
      queryClient.invalidateQueries({ queryKey: ["user-me"] });
    },
    onError: (err) =>
      toast.error(err?.message || "Cập nhật thất bại")
  });

  const onSubmit = (e) => {
    e.preventDefault();
    updateMutation.mutate();
  };

  const onLogout = () => {
    logout();
    toast.success("Đã đăng xuất");
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="text-sm text-slate-500 mb-4">
        Trang chủ / Tài khoản
      </div>

      <div className="flex gap-6">
        <AccountSidebar
          user={form}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onLogout={onLogout}
        />

        {activeTab === "profile" && (
          <AccountInfoTab
            form={form}
            loading={isLoading || updateMutation.isPending}
            onChange={setField}
            onSubmit={onSubmit}
          />
        )}

        {activeTab !== "profile" && (
          <div className="flex-1 bg-white rounded-lg p-6 text-sm text-slate-500">
            Tab này sẽ làm sau
          </div>
        )}
      </div>
    </div>
  );
}
