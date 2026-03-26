import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useSearchParams } from "react-router-dom";

import { apiService } from "../../../config/axios";
import AccountSidebar from "../../../components/ui/AccountSideBar.jsx";
import { useAuth } from "../../../store/authContext.jsx";
import AccountInfoTab from "./tabs/AccountInfoTab";
import OrderDetailTab from "./tabs/OrderDetailTab";
import OrderTab from "./tabs/OrderTab";
import TicketTab from "./tabs/TicketTab";
import VoucherTab from "./tabs/VoucherTab";

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

const VALID_TABS = new Set(["profile", "orders", "ticket", "voucher"]);

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
    setForm((previous) => ({ ...previous, [key]: value }));

  const { data: user, isLoading } = useQuery({
    enabled: !!token,
    queryKey: ["user-me"],
    queryFn: async () => {
      const response = await apiService.get("/user/me");

      if (response?.statusCode !== 200) {
        throw new Error("Không lấy được thông tin người dùng");
      }

      return response.value;
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
      const response = await apiService.put("/user/me", payload);

      if (response?.statusCode !== 200) {
        throw new Error(response?.message || "Cập nhật thông tin thất bại");
      }

      return response;
    },
    onSuccess: () => {
      toast.success("Cập nhật thông tin thành công");
      queryClient.invalidateQueries({ queryKey: ["user-me"] });
    },
    onError: (error) =>
      toast.error(error?.message || "Cập nhật thông tin thất bại"),
  });

  const syncAvatarMutation = useMutation({
    mutationFn: async (payload) => {
      const response = await apiService.put("/user/me", payload);

      if (response?.statusCode !== 200) {
        throw new Error(response?.message || "Không thể cập nhật ảnh đại diện");
      }

      return response;
    },
    onSuccess: () => {
      toast.success("Đã cập nhật ảnh đại diện");
      queryClient.invalidateQueries({ queryKey: ["user-me"] });
    },
    onError: (error) =>
      toast.error(error?.message || "Cập nhật ảnh đại diện thất bại"),
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
        setForm((previous) => ({ ...previous, avatarImage: previousAvatar }));
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

    if (nextTab !== "ticket") {
      nextParams.delete("mode");
      nextParams.delete("ticketId");
      nextParams.delete("type");
      nextParams.delete("customPCId");
      nextParams.delete("orderId");
      nextParams.delete("orderItemId");
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
    <div className="mx-auto max-w-6xl overflow-x-hidden px-3 py-4 sm:px-4 sm:py-6">
      <div className="mb-4 hidden text-sm text-slate-500 md:block">
        <Link to="/">Trang chủ</Link> / Tài khoản
      </div>

      <div className="mb-4 rounded-xl border border-slate-200 bg-white p-3 shadow-sm md:hidden">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
          <img
            src={form.avatarImage || "/AnonymouseUser.png"}
            alt="avatar"
            className="h-10 w-10 rounded-full border border-slate-200 object-cover"
          />
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-slate-800">
              {fullName}
            </div>
            <div className="truncate text-xs text-slate-500">
              {form.email || "Chưa có email"}
            </div>
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
            Tài khoản
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
            onClick={() => handleTabChange("ticket")}
            className={`h-9 rounded-lg text-sm font-medium ${
              activeTab === "ticket"
                ? "bg-[#0090D0]/10 text-[#0090D0]"
                : "bg-slate-100 text-slate-700"
            }`}
          >
            Ticket
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
            className="col-span-2 h-9 rounded-lg bg-red-50 text-sm font-medium text-red-600"
          >
            Đăng xuất
          </button>
        </div>
      </div>

      <div className="flex min-w-0 gap-6">
        <div className="hidden shrink-0 md:block">
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
          <OrderTab onViewDetail={setSelectedOrderId} />
        )}

        {activeTab === "orders" && selectedOrderId && (
          <OrderDetailTab
            orderId={selectedOrderId}
            onBack={() => setSelectedOrderId(null)}
          />
        )}

        {activeTab === "ticket" && <TicketTab />}

        {activeTab === "voucher" && <VoucherTab />}
      </div>
    </div>
  );
}
