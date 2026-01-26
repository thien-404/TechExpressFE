import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import { FiArrowLeft } from "react-icons/fi";

import { apiService } from "../../../config/axios";
import UserInfoTab from "./Tabs/UserInfoTab.jsx";

/* =========================
 * Tabs (reuse logic)
 * ========================= */
const Tabs = ({ active, onChange }) => {
  const items = useMemo(
    () => [
      { key: "info", label: "Thông tin" },
      { key: "orders", label: "Đơn đã đặt" },
      { key: "configs", label: "Cấu hình đã lưu" },
    ],
    [],
  );

  return (
    <div className="border-b border-slate-200">
      <div className="flex gap-6 px-6">
        {items.map((t) => {
          const isActive = active === t.key;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => onChange(t.key)}
              className={[
                "relative -mb-px py-4 text-sm",
                isActive
                  ? "text-[#334155] font-semibold"
                  : "text-slate-500 hover:text-[#334155]",
              ].join(" ")}
            >
              {t.label}
              {isActive && (
                <span className="absolute left-0 right-0 bottom-0 h-[2px] bg-[#22c55e]" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};


/* =========================
 * Page
 * ========================= */
export default function UserDetailPage() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const tabFromUrl = searchParams.get("tab") || "info";
  const [activeTab, setActiveTab] = useState(tabFromUrl);

  useEffect(() => {
    setActiveTab(tabFromUrl);
  }, [tabFromUrl]);

  const changeTab = (next) => {
    setActiveTab(next);
    setSearchParams({ tab: next });
  };

  const { data, isLoading } = useQuery({
    enabled: !!userId,
    queryKey: ["user-detail", userId],
    queryFn: async () => {
      const res = await apiService.get(`/user/${userId}`);
      if (res?.statusCode !== 200) {
        toast.error(res?.message || "Không tải được user");
        return null;
      }
      return res.value;
    },
  });

  if (isLoading) {
    return <div className="p-6 text-sm text-slate-500">Đang tải...</div>;
  }

  if (!data) return null;

  const fullName = `${data.firstName || ""} ${data.lastName || ""}`.trim();

  return (
    <div className="font-[var(--font-inter)]">
      {/* Breadcrumb */}
      <div className="flex items-center justify-between">
        <div className="text-xs text-slate-500">
          Home <span className="mx-2">›</span> Người Dùng{" "}
          <span className="mx-2">›</span>{" "}
          <span className="text-slate-700">{fullName || data.email}</span>
        </div>

        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 rounded bg-green-600 px-3 py-1.5 text-xs font-semibold text-white"
        >
          <FiArrowLeft />
          Back to list
        </button>
      </div>

      {/* Header */}
      <div className="mt-4 rounded-lg border border-slate-200 bg-white">
        <Tabs active={activeTab} onChange={changeTab} />

        {/* ================= TAB CONTENT ================= */}
        {activeTab === "info" && (
          <div className="p-6">
            <UserInfoTab user={data} />
          </div>
        )}

        {activeTab === "orders" && (
          <div className="p-6 text-sm text-slate-500">
            Danh sách đơn hàng sẽ làm sau.
          </div>
        )}

        {activeTab === "configs" && (
          <div className="p-6 text-sm text-slate-500">
            Danh sách cấu hình đã lưu sẽ làm sau.
          </div>
        )}
      </div>
    </div>
  );
}
