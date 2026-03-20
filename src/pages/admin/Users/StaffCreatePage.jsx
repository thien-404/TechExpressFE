import React, { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useMutation } from "@tanstack/react-query"
import { toast } from "sonner"
import { FiArrowLeft } from "react-icons/fi"

import { apiService } from "../../../config/axios"
import StaffForm from "../../../components/form/StaffForm.jsx"
import Breadcrumb from "../../../components/ui/Breadcrumb.jsx"

export default function StaffCreatePage() {
  const navigate = useNavigate()

  const [form, setForm] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    phone: "",
    gender: 0,              
    address: "",
    ward: "",
    province: "",
    postalCode: "",
    avatarImage: "",
    identity: "",
    salary: 0               
  })

  const setField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  /* =========================
   * CREATE STAFF MUTATION
   * ========================= */
  const createMutation = useMutation({
    mutationFn: async () => {
      // Validate trước khi gửi
      const payload = {
        email: form.email.trim(),
        password: form.password,
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        phone: form.phone.trim(),
        gender: Number(form.gender),           // ✅ Ensure number
        address: form.address.trim(),
        ward: form.ward.trim(),
        province: form.province.trim(),
        postalCode: form.postalCode.trim(),
        avatarImage: form.avatarImage,
        identity: form.identity.trim(),
        salary: Number(form.salary)            // ✅ Ensure number
      }

      console.log("📤 Payload:", payload) // Debug

      const res = await apiService.post("/user", payload)
      
      if (res?.statusCode !== 201 && res?.statusCode !== 200) {
        throw new Error(res?.message || "Tạo nhân viên thất bại")
      }
      
      return res.value
    },
    onSuccess: (staff) => {
      toast.success("Tạo nhân viên thành công")
      navigate(`/admin/users/${staff.id}`)
    },
    onError: (err) => {
      console.error("❌ Error:", err)
      toast.error(err.message || "Có lỗi xảy ra")
    }
  })

  const handleSubmit = () => {
    createMutation.mutate()
  }

  return (
    <div className="font-[var(--font-inter)]">
      {/* Breadcrumb & Back Button */}
      <div className="flex items-center justify-between">
        <Breadcrumb
          items={[
            { label: "Trang chủ", href: "/admin" },
            { label: "Quản lý nhân viên", href: "/admin/staff" },
            { label: "Tạo mới" }
          ]}
        />

        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 rounded bg-[#6e846f] px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90"
        >
          <FiArrowLeft />
          Quay lại
        </button>
      </div>

      {/* Header */}
      <div className="mt-3">
        <h1 className="text-2xl font-semibold text-[#334155]">
          Tạo nhân viên mới
        </h1>
      </div>

      {/* Form */}
      <div className="mt-4">
        <StaffForm
          form={form}
          loading={createMutation.isPending}
          onChange={setField}
          onSubmit={handleSubmit}
          mode="create"
        />
      </div>
    </div>
  )
}