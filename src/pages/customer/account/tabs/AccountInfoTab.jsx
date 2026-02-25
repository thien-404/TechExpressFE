import { useState } from "react";
import { toast } from "sonner";
import { uploadUserAvatar } from "../../../../utils/uploadImage";

export default function AccountInfoTab({
  form,
  onChange,
  onSubmit,
  loading,
  onAvatarUploaded,
  avatarSyncing = false,
}) {
  const [uploading, setUploading] = useState(false);

  const onAvatarChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Chỉ cho phép tải lên file ảnh");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Ảnh tối đa 5MB");
      return;
    }

    try {
      setUploading(true);
      const url = await uploadUserAvatar({ file, userId: form.id });
      if (onAvatarUploaded) {
        onAvatarUploaded(url);
      } else {
        onChange("avatarImage", url);
      }
      toast.success("Upload ảnh thành công");
    } catch (err) {
      toast.error(err?.message || "Upload ảnh thất bại");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  const buttonBusy = loading || uploading || avatarSyncing;

  return (
    <form
      onSubmit={onSubmit}
      className="flex-1 bg-white rounded-xl p-4 md:p-6 shadow-sm border border-slate-100"
    >
      <h2 className="text-base md:text-lg font-semibold text-left md:text-center mb-4 md:mb-6">
        Thông tin tài khoản
      </h2>

      <div className="flex items-center gap-3 md:flex-col md:items-center mb-5 md:mb-6">
        <img
          src={form.avatarImage || "/AnonymouseUser.png"}
          alt="avatar"
          className="h-16 w-16 md:h-20 md:w-20 rounded-full object-cover border"
        />

        <div className="flex flex-col gap-1">
          <label className="text-xs text-blue-600 font-medium cursor-pointer w-fit">
            {uploading ? "Đang upload..." : "Đổi ảnh đại diện"}
            <input
              type="file"
              hidden
              accept="image/*"
              onChange={onAvatarChange}
              disabled={uploading || avatarSyncing}
            />
          </label>
          {avatarSyncing && (
            <span className="text-[11px] text-slate-500">Đang cập nhật ảnh lên hồ sơ...</span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
        <Input label="Họ" value={form.firstName} onChange={(v) => onChange("firstName", v)} />
        <Input label="Tên" value={form.lastName} onChange={(v) => onChange("lastName", v)} />

        <Input label="Email" value={form.email} disabled />
        <Input label="Số điện thoại" value={form.phone} onChange={(v) => onChange("phone", v)} />

        <Select
          label="Giới tính"
          value={form.gender ?? ""}
          onChange={(v) => onChange("gender", v)}
          options={[
            { value: "", label: "-- Chọn --" },
            { value: "Male", label: "Nam" },
            { value: "Female", label: "Nữ" },
            { value: "Other", label: "Khác" },
          ]}
        />

        <Input label="Tỉnh / Thành phố" value={form.province} onChange={(v) => onChange("province", v)} />
        <Input label="Phường / Huyện" value={form.ward} onChange={(v) => onChange("ward", v)} />
        <Input label="Mã bưu điện" value={form.postalCode} onChange={(v) => onChange("postalCode", v)} />

        <div className="md:col-span-2">
          <Input
            label="Địa chỉ"
            value={form.address}
            onChange={(v) => onChange("address", v)}
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={buttonBusy}
        className="mt-5 md:mt-6 w-full h-11 rounded bg-orange-500 text-white text-sm font-semibold hover:opacity-90 disabled:opacity-60"
      >
        {buttonBusy ? "ĐANG LƯU..." : "LƯU THÔNG TIN"}
      </button>
    </form>
  );
}

function Input({ label, value, onChange, disabled }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-600 mb-1">
        {label}
      </label>
      <input
        value={value}
        disabled={disabled}
        onChange={(event) => onChange?.(event.target.value)}
        className="w-full h-10 md:h-9 rounded border border-slate-300 px-3 text-sm outline-none focus:border-orange-400 disabled:bg-slate-100"
      />
    </div>
  );
}

function Select({ label, value, onChange, options }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-600 mb-1">
        {label}
      </label>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full h-10 md:h-9 rounded border border-slate-300 px-3 text-sm outline-none focus:border-orange-400"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
