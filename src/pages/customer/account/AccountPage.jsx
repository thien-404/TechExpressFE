import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useSearchParams } from "react-router-dom";
import { useAuth } from "../../../store/authContext.jsx";
import { apiService } from "../../../config/axios";
import AccountSidebar from "../../../components/ui/AccountSideBar.jsx";
import AccountInfoTab from "./tabs/AccountInfoTab";
import OrderTab from "./tabs/OrderTab";
import OrderDetailTab from "./tabs/OrderDetailTab";

const buildUpdatePayload = (source) => ({
  firstName: source.firstName,
  lastName: source.lastName,
  phone: source.phone,
  gender: source.gender || null,
  address: source.address,
  ward: source.ward,
  province: source.province,
  postalCode: source.postalCode,
  avatarImage: source.avatarImage,
});

const VALID_TABS = new Set(["profile", "orders", "voucher"]);

const normalizeTab = (value) => {
  const tab = String(value || "").toLowerCase().trim();
  if (VALID_TABS.has(tab)) return tab;
  return "profile";
};

export default function AccountPage() {
  const { token, logout } = useAuth();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = normalizeTab(searchParams.get("tab"));
  const [selectedOrderId, setSelectedOrderId] = useState(null);

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
    avatarImage: "",
  });

  const setField = (key, value) =>
    setForm((prev) => ({ ...prev, [key]: value }));

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
      avatarImage: user.avatarImage ?? "",
    });
  }, [user]);

  const updateProfileMutation = useMutation({
    mutationFn: async (payload) => {
      const res = await apiService.put("/user/me", payload);
      if (res?.statusCode !== 200) {
        throw new Error(res?.message || "Cập nhật thông tin thất bại");
      }
      return res;
    },
    onSuccess: () => {
      toast.success("Cập nhật thông tin thành công");
      queryClient.invalidateQueries({ queryKey: ["user-me"] });
    },
    onError: (err) =>
      toast.error(err?.message || "Cập nhật thông tin thất bại"),
  });

  const syncAvatarMutation = useMutation({
    mutationFn: async (payload) => {
      const res = await apiService.put("/user/me", payload);
      if (res?.statusCode !== 200) {
        throw new Error(res?.message || "Không thể cập nhật ảnh đại diện");
      }
      return res;
    },
    onSuccess: () => {
      toast.success("Đã cập nhật ảnh đại diện");
      queryClient.invalidateQueries({ queryKey: ["user-me"] });
    },
    onError: (err) =>
      toast.error(err?.message || "Cập nhật ảnh đại diện thất bại"),
  });

  const onSubmit = (event) => {
    event.preventDefault();
    updateProfileMutation.mutate(buildUpdatePayload(form));
  };

  const handleAvatarUploaded = (avatarUrl) => {
    const previousAvatar = form.avatarImage;
    const nextForm = { ...form, avatarImage: avatarUrl };
    setForm(nextForm);

    syncAvatarMutation.mutate(buildUpdatePayload(nextForm), {
      onError: () => {
        setForm((prev) => ({ ...prev, avatarImage: previousAvatar }));
      },
    });
  };

  const onLogout = () => {
    logout();
    toast.success("Đã đăng xuất");
  };

  const handleTabChange = (tab) => {
    const nextTab = normalizeTab(tab);
    const nextParams = new URLSearchParams(searchParams);

    if (nextTab === "profile") {
      nextParams.delete("tab");
    } else {
      nextParams.set("tab", nextTab);
    }

    setSearchParams(nextParams, { replace: true });
    setSelectedOrderId(null);
  };

  useEffect(() => {
    if (activeTab !== "orders" && selectedOrderId) {
      setSelectedOrderId(null);
    }
  }, [activeTab, selectedOrderId]);

  const fullName =
    `${form.firstName || ""} ${form.lastName || ""}`.trim() || "User";
  const isProfilePending =
    updateProfileMutation.isPending || syncAvatarMutation.isPending;

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-4 py-4 sm:py-6 overflow-x-hidden">
      <div className="hidden md:block text-sm text-slate-500 mb-4">
        <Link to="/">Trang chủ</Link> / Tài khoản
      </div>

      <div className="md:hidden mb-4 bg-white rounded-xl border border-slate-200 p-3 shadow-sm">
        <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
          <img
            src={form.avatarImage || "/AnonymouseUser.png"}
            alt="avatar"
            className="h-10 w-10 rounded-full object-cover border border-slate-200"
          />
          <div className="min-w-0">
            <div className="text-sm font-semibold text-slate-800 truncate">{fullName}</div>
            <div className="text-xs text-slate-500 truncate">{form.email || "Chưa có email"}</div>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => handleTabChange("profile")}
            className={`h-9 rounded-lg text-sm font-medium ${
              activeTab === "profile"
                ? "bg-[#0090D0]/10 text-[#0090D0]"
                : "bg-slate-100 text-slate-700"
            }`}
          >
            Tài Khoản
          </button>
          <button
            type="button"
            onClick={() => handleTabChange("orders")}
            className={`h-9 rounded-lg text-sm font-medium ${
              activeTab === "orders"
                ? "bg-[#0090D0]/10 text-[#0090D0]"
                : "bg-slate-100 text-slate-700"
            }`}
          >
            Đơn mua
          </button>
          <button
            type="button"
            onClick={() => handleTabChange("voucher")}
            className={`h-9 rounded-lg text-sm font-medium ${
              activeTab === "voucher"
                ? "bg-[#0090D0]/10 text-[#0090D0]"
                : "bg-slate-100 text-slate-700"
            }`}
          >
            Voucher
          </button>
          <button
            type="button"
            onClick={onLogout}
            className="h-9 rounded-lg text-sm font-medium bg-red-50 text-red-600"
          >
            Đăng xuất
          </button>
        </div>
      </div>

      <div className="flex gap-6 min-w-0">
        <div className="hidden md:block shrink-0">
          <AccountSidebar
            user={{ ...form, fullName }}
            activeTab={activeTab}
            onTabChange={handleTabChange}
            onLogout={onLogout}
          />
        </div>

        {activeTab === "profile" && (
          <AccountInfoTab
            form={form}
            loading={isLoading || isProfilePending}
            onChange={setField}
            onSubmit={onSubmit}
            onAvatarUploaded={handleAvatarUploaded}
            avatarSyncing={syncAvatarMutation.isPending}
          />
        )}

        {activeTab === "orders" && !selectedOrderId && (
          <OrderTab customerId={form.id || undefined} onViewDetail={setSelectedOrderId} />
        )}

        {activeTab === "orders" && selectedOrderId && (
          <OrderDetailTab orderId={selectedOrderId} onBack={() => setSelectedOrderId(null)} />
        )}

        {activeTab === "voucher" && (
          <div className="flex-1 min-w-0 bg-white rounded-lg p-6 text-sm text-slate-500">
            Tab này sẽ làm sau
          </div>
        )}
      </div>
    </div>
  );
}
