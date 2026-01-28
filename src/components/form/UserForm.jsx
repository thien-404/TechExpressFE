import React from 'react'
import { FiUpload, FiTrash2, FiUser, FiMail, FiPhone, FiMapPin } from 'react-icons/fi'
import SquareAvatar from '../ui/avatar/SquareAvatar'

/* =========================
 * STYLES
 * ========================= */
const inputClass =
  'h-10 w-full rounded border border-slate-300 px-3 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100 bg-white transition-all'

const labelClass = 'mb-1.5 block text-xs font-semibold text-slate-600'

const sectionClass = 'rounded-lg border border-slate-200 bg-white'

/* =========================
 * SECTION COMPONENT
 * ========================= */
const Section = ({ title, icon: Icon, children }) => (
  <div className={sectionClass}>
    <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
      {Icon && <Icon size={16} className="text-slate-500" />}
      <span className="text-sm font-semibold text-[#334155]">{title}</span>
    </div>
    <div className="p-6">{children}</div>
  </div>
)

/* =========================
 * MAIN FORM
 * ========================= */
export default function UserForm({
  form,
  onChange,
  onSubmit,
  loading = false
}) {
  const setField = (key) => (e) => {
    onChange(key, e.target.value)
  }

  const fullName = `${form.firstName || ''} ${form.lastName || ''}`.trim()

  return (
    <form onSubmit={onSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* ================= LEFT COLUMN ================= */}
      <div className="lg:col-span-3 space-y-6">
        {/* Avatar Section */}
        <Section title="Ảnh đại diện" icon={FiUser}>
          <div className="space-y-4">
            <div className="flex justify-center">
              <SquareAvatar
                name={fullName || form.email}
                seed={form.avatarImage}
                size="lg"
              />
            </div>

            <div className="space-y-2">
              <button
                type="button"
                className="w-full h-9 rounded border border-slate-300 text-sm font-medium hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
              >
                <FiUpload size={14} />
                Chọn ảnh
              </button>

              <button
                type="button"
                className="w-full h-9 rounded border border-slate-300 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
              >
                <FiTrash2 size={14} />
                Xóa ảnh
              </button>

              <div className="text-[11px] text-slate-500 text-center mt-2">
                JPG, PNG · Tối đa 5MB
              </div>
            </div>
          </div>
        </Section>
      </div>

      {/* ================= RIGHT COLUMN ================= */}
      <div className="lg:col-span-9 space-y-6">
        {/* Personal Information */}
        <Section title="Thông tin cá nhân" icon={FiUser}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* First Name */}
            <div>
              <label className={labelClass}>Họ và tên đệm</label>
              <input
                value={form.firstName}
                onChange={setField('firstName')}
                className={inputClass}
                placeholder="VD: Nguyễn Văn"
              />
            </div>

            {/* Last Name */}
            <div>
              <label className={labelClass}>Tên</label>
              <input
                value={form.lastName}
                onChange={setField('lastName')}
                className={inputClass}
                placeholder="VD: An"
              />
            </div>

            {/* Email (readonly) */}
            <div>
              <label className={labelClass}>
                Email <span className="text-slate-400">(Không thể chỉnh sửa)</span>
              </label>
              <div className="relative">
                <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  value={form.email}
                  disabled
                  className={`${inputClass} bg-slate-50 pl-10 cursor-not-allowed`}
                />
              </div>
            </div>

            {/* Gender */}
            <div>
              <label className={labelClass}>Giới tính</label>
              <select
                value={form.gender ?? ''}
                onChange={setField('gender')}
                className={inputClass}
              >
                <option value="">Chọn giới tính</option>
                <option value="Male">Nam</option>
                <option value="Female">Nữ</option>
              </select>
            </div>
          </div>
        </Section>

        {/* Contact Information */}
        <Section title="Thông tin liên hệ" icon={FiPhone}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Phone */}
            <div>
              <label className={labelClass}>Số điện thoại</label>
              <div className="relative">
                <FiPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  value={form.phone}
                  onChange={setField('phone')}
                  className={`${inputClass} pl-10`}
                  placeholder="0912345678"
                />
              </div>
            </div>

            {/* Postal Code */}
            <div>
              <label className={labelClass}>Mã bưu điện</label>
              <input
                value={form.postalCode}
                onChange={setField('postalCode')}
                className={inputClass}
                placeholder="VD: 700000"
              />
            </div>
          </div>
        </Section>

        {/* Address Information */}
        <Section title="Địa chỉ" icon={FiMapPin}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Province */}
            <div>
              <label className={labelClass}>Tỉnh/Thành phố</label>
              <input
                value={form.province}
                onChange={setField('province')}
                className={inputClass}
                placeholder="VD: Hồ Chí Minh"
              />
            </div>

            {/* Ward */}
            <div>
              <label className={labelClass}>Quận/Huyện</label>
              <input
                value={form.ward}
                onChange={setField('ward')}
                className={inputClass}
                placeholder="VD: Quận 1"
              />
            </div>

            {/* Address (Full Width) */}
            <div className="md:col-span-2">
              <label className={labelClass}>Địa chỉ chi tiết</label>
              <input
                value={form.address}
                onChange={setField('address')}
                className={inputClass}
                placeholder="Số nhà, tên đường..."
              />
            </div>
          </div>
        </Section>

        {/* Form Actions */}
        <div className="flex items-center justify-between pt-2">
          <div className="text-xs text-slate-500">
            <span className="text-red-500">*</span> Các trường bắt buộc
          </div>
          
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => window.history.back()}
              className="h-10 rounded border border-slate-300 px-6 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Hủy
            </button>
            
            <button
              type="submit"
              disabled={loading}
              className="h-10 rounded bg-[#38976C] px-6 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
          </div>
        </div>
      </div>
    </form>
  )
}