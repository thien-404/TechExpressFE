import React, { useEffect, useMemo, useState } from "react"
import { useNavigate, useParams, useSearchParams } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { toast } from "sonner"
import { FiArrowLeft } from "react-icons/fi"

import { apiService } from "../../../config/axios"
import UserInfoTab from "./Tabs/UserInfoTab.jsx"
import Breadcrumb from "../../../components/ui/Breadcrumb.jsx"

/* =========================
 * TABS COMPONENT
 * ========================= */
const Tabs = ({ active, onChange }) => {
  const items = useMemo(
    () => [
      { key: "info", label: "Thông tin" },
      { key: "orders", label: "Đơn hàng" },
      { key: "configs", label: "Cấu hình" },
    ],
    []
  )

  return (
    <div className="border-b border-slate-200">
      <div className="flex gap-6 px-6">
        {items.map((tab) => {
          const isActive = active === tab.key
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => onChange(tab.key)}
              className={`relative -mb-px py-4 text-sm transition-colors ${
                isActive
                  ? "text-[#334155] font-semibold"
                  : "text-slate-500 hover:text-[#334155]"
              }`}
            >
              {tab.label}
              {isActive && (
                <span className="absolute left-0 right-0 bottom-0 h-[2px] bg-[#22c55e]" />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

/* =========================
 * MAIN PAGE
 * ========================= */
export default function UserDetailPage() {
  const { userId } = useParams()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const tabFromUrl = searchParams.get("tab") || "info"
  const [activeTab, setActiveTab] = useState(tabFromUrl)

  useEffect(() => {
    setActiveTab(tabFromUrl)
  }, [tabFromUrl])

  const changeTab = (nextTab) => {
    setActiveTab(nextTab)
    setSearchParams({ tab: nextTab })
  }

  /* =========================
   * FETCH USER DATA
   * ========================= */
  const { data: user, isLoading } = useQuery({
    enabled: !!userId,
    queryKey: ["user-detail", userId],
    queryFn: async () => {
      const res = await apiService.get(`/user/${userId}`)
      if (res?.statusCode !== 200) {
        toast.error(res?.message || "Không thể tải thông tin người dùng")
        return null
      }
      return res.value
    },
  })

  /* =========================
   * LOADING STATE
   * ========================= */
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-sm text-slate-500">Đang tải thông tin...</div>
      </div>
    )
  }

  if (!user) return null

  const fullName = `${user.firstName || ""} ${user.lastName || ""}`.trim()

  /* =========================
   * RENDER
   * ========================= */
  return (
    <div className="font-[var(--font-inter)]">
      {/* Breadcrumb & Back Button */}
      <div className="flex items-center justify-between">
        <Breadcrumb
          items={[
            { label: "Trang chủ", href: "/admin" },
            { label: "Quản lý người dùng", href: "/admin/users" },
            { label: fullName || user.email },
          ]}
        />
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 rounded bg-[#f00303] px-4 py-2.5 text-xs font-semibold text-white hover:opacity-90"
          >
            Xóa
          </button>
          <button
            type="button"
            onClick={() => navigate("/admin/users/" + userId + "/edit")}
            className="inline-flex items-center gap-2 rounded bg-[#1B67FF] px-4 py-2.5 text-xs font-semibold text-white hover:opacity-90"
          >
            Cập Nhật
          </button>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 rounded bg-[#228C5C] px-4 py-2.5 text-xs font-semibold text-white hover:opacity-90"
          >
            <FiArrowLeft />
            Quay lại
          </button>
        </div>
      </div>

      {/* Main Card */}
      <div className="mt-4 rounded-lg border border-slate-200 bg-white">
        <Tabs active={activeTab} onChange={changeTab} />

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === "info" && <UserInfoTab user={user} />}

          {activeTab === "orders" && (
            <div className="text-center py-12">
              <p className="text-sm text-slate-500">
                Danh sách đơn hàng sẽ được phát triển sau
              </p>
            </div>
          )}

          {activeTab === "configs" && (
            <div className="text-center py-12">
              <p className="text-sm text-slate-500">
                Danh sách cấu hình đã lưu sẽ được phát triển sau
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}