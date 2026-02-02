// pages/customer/tabs/AccountInfoTab.jsx
import { useState } from 'react'
import { toast } from 'sonner'
import { uploadUserAvatar } from '../../../../utils/uploadImage'

export default function AccountInfoTab({ form, onChange, onSubmit, loading }) {
  const [uploading, setUploading] = useState(false)

  const onAvatarChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Chỉ cho phép upload ảnh')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Ảnh tối đa 5MB')
      return
    }

    try {
      setUploading(true)
      const url = await uploadUserAvatar({ file, userId: form.id })
      onChange('avatarImage', url)
      toast.success('Upload ảnh thành công')
    } catch (err) {
      toast.error(err.message || 'Upload ảnh thất bại')
    } finally {
      setUploading(false)
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="flex-1 bg-white rounded-xl p-6 shadow-sm"
    >
      <h2 className="text-lg font-semibold text-center mb-6">
        Thông tin tài khoản
      </h2>

      {/* Avatar */}
      <div className="flex flex-col items-center mb-6">
        <img
          src={form.avatarImage || '/avatar-placeholder.png'}
          alt="avatar"
          className="h-20 w-20 rounded-full object-cover border"
        />

        <label className="mt-2 text-xs text-blue-500 cursor-pointer">
          {uploading ? 'Đang upload...' : 'Đổi ảnh đại diện'}
          <input
            type="file"
            hidden
            accept="image/*"
            onChange={onAvatarChange}
            disabled={uploading}
          />
        </label>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input label="Họ" value={form.firstName} onChange={(v) => onChange('firstName', v)} />
        <Input label="Tên" value={form.lastName} onChange={(v) => onChange('lastName', v)} />

        <Input label="Email" value={form.email} disabled />
        <Input label="Số điện thoại" value={form.phone} onChange={(v) => onChange('phone', v)} />

        <Select
          label="Giới tính"
          value={form.gender ?? ''}
          onChange={(v) => onChange('gender', v)}
          options={[
            { value: '', label: '-- Chọn --' },
            { value: 'Male', label: 'Nam' },
            { value: 'Female', label: 'Nữ' },
            { value: 'Other', label: 'Khác' }
          ]}
        />

        <Input label="Tỉnh / Thành phố" value={form.province} onChange={(v) => onChange('province', v)} />
        <Input label="Quận / Huyện" value={form.ward} onChange={(v) => onChange('ward', v)} />
        <Input label="Mã bưu điện" value={form.postalCode} onChange={(v) => onChange('postalCode', v)} />

        <div className="md:col-span-2">
          <Input
            label="Địa chỉ"
            value={form.address}
            onChange={(v) => onChange('address', v)}
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading || uploading}
        className="mt-6 w-full h-10 rounded bg-orange-500 text-white text-sm font-semibold hover:opacity-90 disabled:opacity-60"
      >
        {loading || uploading ? 'ĐANG LƯU...' : 'LƯU THÔNG TIN'}
      </button>
    </form>
  )
}

/* ================= SUB COMPONENTS ================= */

function Input({ label, value, onChange, disabled }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-600 mb-1">
        {label}
      </label>
      <input
        value={value}
        disabled={disabled}
        onChange={(e) => onChange?.(e.target.value)}
        className="w-full h-9 rounded border border-slate-300 px-3 text-sm outline-none focus:border-orange-400 disabled:bg-slate-100"
      />
    </div>
  )
}

function Select({ label, value, onChange, options }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-600 mb-1">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-9 rounded border border-slate-300 px-3 text-sm outline-none focus:border-orange-400"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  )
}
