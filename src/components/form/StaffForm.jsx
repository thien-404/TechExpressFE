import React, { useState, useCallback } from 'react'
import {
  FiUser,
  FiMail,
  FiPhone,
  FiMapPin,
  FiDollarSign,
  FiHash,
  FiUpload,
  FiTrash2,
  FiLock,
  FiAlertCircle
} from 'react-icons/fi'
import { toast } from 'sonner'
import SquareAvatar from '../ui/avatar/SquareAvatar'
import { uploadUserAvatar, deleteUserAvatar } from '../../utils/uploadImage'

/* =========================
 * STYLES
 * ========================= */
const inputClass =
  'h-10 w-full rounded border border-slate-300 px-3 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100 bg-white transition-all disabled:bg-slate-50 disabled:cursor-not-allowed'

const labelClass = 'mb-1.5 block text-xs font-semibold text-slate-600'

const sectionClass = 'rounded-lg border border-slate-200 bg-white shadow-sm'

/* =========================
 * SECTION COMPONENT
 * ========================= */
const Section = ({ title, icon: Icon, children }) => (
  <div className={sectionClass}>
    <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2 bg-gradient-to-r from-slate-50 to-white">
      {Icon && <Icon size={16} className="text-slate-500" />}
      <span className="text-sm font-semibold text-[#334155]">{title}</span>
    </div>
    <div className="p-6">{children}</div>
  </div>
)

/* =========================
 * FIELD COMPONENT
 * ========================= */
const Field = ({ label, error, required = false, children }) => (
  <div>
    <label className={labelClass}>
      {label}
      {required && <span className="text-red-500 ml-1">*</span>}
    </label>
    {children}
    {error && (
      <div className="flex items-center gap-1 text-xs text-red-500 mt-1.5">
        <FiAlertCircle size={12} />
        {error}
      </div>
    )}
  </div>
)

/* =========================
 * MAIN FORM
 * ========================= */
export default function StaffForm({
  form,
  onChange,
  onSubmit,
  loading = false,
  mode = 'create' // 'create' | 'edit'
}) {
  const [errors, setErrors] = useState({})
  const [uploading, setUploading] = useState(false)

  const setField = useCallback((key) => (e) => {
    const value = e.target.type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value
    onChange(key, value)
    // Clear error khi user bắt đầu nhập
    setErrors((prev) => ({ ...prev, [key]: null }))
  }, [onChange])

  /* =========================
   * VALIDATION
   * ========================= */
  const validate = useCallback(() => {
    const newErrors = {}

    // Required fields
    if (!form.firstName?.trim()) newErrors.firstName = 'Họ là bắt buộc'
    if (!form.lastName?.trim()) newErrors.lastName = 'Tên là bắt buộc'
    if (!form.email?.trim()) newErrors.email = 'Email là bắt buộc'
    if (!form.phone?.trim()) newErrors.phone = 'Số điện thoại là bắt buộc'
    if (!form.identity?.trim()) newErrors.identity = 'CMND/CCCD là bắt buộc'

    // Email format
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = 'Email không hợp lệ'
    }

    // Phone format (VN)
    if (form.phone && !/^(0|\+84)[0-9]{9,10}$/.test(form.phone.replace(/\s/g, ''))) {
      newErrors.phone = 'Số điện thoại không hợp lệ'
    }

    // Password (create mode only)
    if (mode === 'create') {
      if (!form.password?.trim()) {
        newErrors.password = 'Mật khẩu là bắt buộc'
      } else if (form.password.length < 6) {
        newErrors.password = 'Mật khẩu phải có ít nhất 6 ký tự'
      }
    }

    // Salary
    if (form.salary <= 0) {
      newErrors.salary = 'Lương phải lớn hơn 0'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [form, mode])

  const handleSubmit = (e) => {
    e.preventDefault()
    
    if (!validate()) {
      toast.error('Vui lòng kiểm tra lại thông tin')
      return
    }

    onSubmit()
  }

  /* =========================
   * AVATAR UPLOAD (EDIT MODE)
   * ========================= */
  const handleSelectAvatar = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Kích thước ảnh không được vượt quá 5MB')
      return
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Vui lòng chọn file ảnh')
      return
    }

    try {
      setUploading(true)
      const url = await uploadUserAvatar({ file, userId: form.id })
      onChange('avatarImage', url)
      toast.success('Tải ảnh lên thành công')
    } catch (error) {
      toast.error(error.message || 'Tải ảnh lên thất bại')
    } finally {
      setUploading(false)
    }
  }

  const handleRemoveAvatar = async () => {
    if (!form.avatarImage) return

    try {
      await deleteUserAvatar(form.id)
      onChange('avatarImage', '')
      toast.success('Đã xóa ảnh đại diện')
    } catch (error) {
      toast.error('Xóa ảnh thất bại')
    }
  }

  const fullName = `${form.firstName || ''} ${form.lastName || ''}`.trim()
  const isSubmitting = loading || uploading

  /* =========================
   * RENDER
   * ========================= */
  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* ================= LEFT COLUMN ================= */}
      {mode === 'edit' && (
        <div className="lg:col-span-3 space-y-6">
          <Section title="Ảnh đại diện" icon={FiUser}>
            <div className="space-y-4">
              {/* Avatar */}
              <div className="flex justify-center">
                <div className="relative">
                  <SquareAvatar
                    name={fullName || form.email}
                    seed={form.avatarImage}
                    size="lg"
                  />
                  {uploading && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center">
                      <div className="text-white text-xs">Đang tải...</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Upload Button */}
              <label className="block">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/jpg"
                  onChange={handleSelectAvatar}
                  disabled={uploading}
                  className="hidden"
                />
                <div className="w-full h-9 rounded border border-slate-300 text-sm font-medium hover:bg-slate-50 transition-colors flex items-center justify-center gap-2 cursor-pointer">
                  <FiUpload size={14} />
                  {uploading ? 'Đang tải...' : 'Chọn ảnh'}
                </div>
              </label>

              {/* Remove Button */}
              {form.avatarImage && (
                <button
                  type="button"
                  onClick={handleRemoveAvatar}
                  disabled={uploading}
                  className="w-full h-9 rounded border border-slate-300 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
                >
                  <FiTrash2 size={14} />
                  Xóa ảnh
                </button>
              )}

              {/* Helper Text */}
              <div className="text-[11px] text-slate-500 text-center">
                JPG, PNG · Tối đa 5MB
              </div>
            </div>
          </Section>
        </div>
      )}

      {/* ================= RIGHT COLUMN ================= */}
      <div className={mode === 'edit' ? 'lg:col-span-9 space-y-6' : 'lg:col-span-12 space-y-6'}>
        {/* BASIC INFORMATION */}
        <Section title="Thông tin cơ bản" icon={FiUser}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Họ và tên đệm" error={errors.firstName} required>
              <input
                type="text"
                value={form.firstName}
                onChange={setField('firstName')}
                className={inputClass}
                placeholder="VD: Nguyễn Văn"
              />
            </Field>

            <Field label="Tên" error={errors.lastName} required>
              <input
                type="text"
                value={form.lastName}
                onChange={setField('lastName')}
                className={inputClass}
                placeholder="VD: An"
              />
            </Field>

            <Field label="Email" error={errors.email} required>
              <div className="relative">
                <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="email"
                  value={form.email}
                  onChange={setField('email')}
                  className={`${inputClass} pl-10`}
                  placeholder="example@email.com"
                  disabled={mode === 'edit'}
                />
              </div>
            </Field>

            {mode === 'create' && (
              <Field label="Mật khẩu" error={errors.password} required>
                <div className="relative">
                  <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    type="password"
                    value={form.password}
                    onChange={setField('password')}
                    className={`${inputClass} pl-10`}
                    placeholder="Tối thiểu 6 ký tự"
                  />
                </div>
              </Field>
            )}

            <Field label="Giới tính">
              <select
                value={form.gender ?? 0}
                onChange={setField('gender')}
                className={inputClass}
              >
                <option value={0}>Nam</option>
                <option value={1}>Nữ</option>
                <option value={2}>Khác</option>
              </select>
            </Field>
          </div>
        </Section>

        {/* STAFF INFORMATION */}
        <Section title="Thông tin nhân viên" icon={FiHash}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="CMND/CCCD" error={errors.identity} required>
              <input
                type="text"
                value={form.identity}
                onChange={setField('identity')}
                className={inputClass}
                placeholder="VD: 001234567890"
              />
            </Field>

            <Field label="Lương (VNĐ)" error={errors.salary} required>
              <div className="relative">
                <FiDollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="number"
                  value={form.salary}
                  onChange={setField('salary')}
                  className={`${inputClass} pl-10`}
                  placeholder="VD: 10000000"
                  min="0"
                  step="100000"
                />
              </div>
            </Field>
          </div>
        </Section>

        {/* CONTACT & ADDRESS */}
        <Section title="Liên hệ & Địa chỉ" icon={FiMapPin}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Số điện thoại" error={errors.phone} required>
              <div className="relative">
                <FiPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="tel"
                  value={form.phone}
                  onChange={setField('phone')}
                  className={`${inputClass} pl-10`}
                  placeholder="0912345678"
                />
              </div>
            </Field>

            <Field label="Mã bưu điện">
              <input
                type="text"
                value={form.postalCode}
                onChange={setField('postalCode')}
                className={inputClass}
                placeholder="VD: 700000"
              />
            </Field>

            <Field label="Tỉnh/Thành phố">
              <input
                type="text"
                value={form.province}
                onChange={setField('province')}
                className={inputClass}
                placeholder="VD: Hồ Chí Minh"
              />
            </Field>

            <Field label="Quận/Huyện">
              <input
                type="text"
                value={form.ward}
                onChange={setField('ward')}
                className={inputClass}
                placeholder="VD: Quận 1"
              />
            </Field>

            <div className="md:col-span-2">
              <Field label="Địa chỉ chi tiết">
                <input
                  type="text"
                  value={form.address}
                  onChange={setField('address')}
                  className={inputClass}
                  placeholder="Số nhà, tên đường..."
                />
              </Field>
            </div>
          </div>
        </Section>

        {/* FORM ACTIONS */}
        <div className="flex items-center justify-between pt-2">
          <div className="text-xs text-slate-500">
            <span className="text-red-500">*</span> Trường bắt buộc
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => window.history.back()}
              disabled={isSubmitting}
              className="h-10 rounded border border-slate-300 px-6 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
              Hủy
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="h-10 rounded bg-[#6e846f] px-6 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? 'Đang lưu...' : mode === 'create' ? 'Tạo mới' : 'Lưu thay đổi'}
            </button>
          </div>
        </div>
      </div>
    </form>
  )
}