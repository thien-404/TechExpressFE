import React, { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { useMutation, useQuery } from "@tanstack/react-query"
import { queryClient } from "../../../config/queryClient.js"
import { toast } from "sonner"
import { FiArrowLeft } from "react-icons/fi"

import { apiService } from "../../../config/axios"
import UserForm from "../../../components/form/UserForm"
import Breadcrumb from "../../../components/ui/Breadcrumb.jsx"


/* =========================
 * MAIN PAGE
 * ========================= */
export default function UserUpdatePage() {
  const { userId } = useParams()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    gender: null,
    address: "",
    ward: "",
    province: "",
    postalCode: "",
    avatarImage: "",
    email: "",
  })

  const setField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }))
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

  // Cập nhật form khi có dữ liệu user
  useEffect(() => {
    if (!user) return
    setForm({
      firstName: user.firstName ?? "",
      lastName: user.lastName ?? "",
      phone: user.phone ?? "",
      gender: user.gender ?? null,
      address: user.address ?? "",
      ward: user.ward ?? "",
      province: user.province ?? "",
      postalCode: user.postalCode ?? "",
      avatarImage: user.avatarImage ?? "",
      email: user.email ?? "",
    })
  }, [user])

  /* =========================
   * UPDATE MUTATION
   * ========================= */
  const updateMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        firstName: form.firstName,
        lastName: form.lastName,
        phone: form.phone,
        gender: form.gender,
        address: form.address,
        ward: form.ward,
        province: form.province,
        postalCode: form.postalCode,
        avatarImage: form.avatarImage,
      }

      const res = await apiService.put(`/user/${userId}`, payload)
      if (res?.statusCode !== 200) {
        throw new Error(res?.message || "Cập nhật thất bại")
      }
      return res
    },
    onSuccess: () => {
      toast.success("Cập nhật thông tin người dùng thành công")
      queryClient.invalidateQueries({ queryKey: ["user-detail", userId] })
      navigate(`/admin/users/${userId}`)
    },
    onError: (err) => {
      toast.error(err?.message || "Cập nhật thất bại")
    },
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    updateMutation.mutate()
  }

  const fullName = `${form.firstName || ""} ${form.lastName || ""}`.trim()

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
            { label: fullName || user?.email || "Cập nhật" , href: `/admin/users/${userId}` },
            { label: "Cập nhật" },
          ]}
        />

        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 rounded bg-[#38976C] px-4 py-2.5 text-xs font-semibold text-white hover:opacity-90"
        >
          <FiArrowLeft />
          Quay lại
        </button>
      </div>

      {/* Header */}
      <div className="mt-3">
        <h1 className="text-2xl font-semibold text-[#334155]">
          Cập nhật thông tin người dùng
        </h1>
      </div>

      {/* Form */}
      <div className="mt-4">
        <UserForm
          form={form}
          loading={isLoading || updateMutation.isPending}
          onChange={setField}
          onSubmit={handleSubmit}
        />
      </div>
    </div>
  )
}