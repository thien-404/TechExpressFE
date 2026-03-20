import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import TicketAttachmentPicker from "./TicketAttachmentPicker";
import {
  getTicketFormDefaults,
  normalizeTicketType,
  shouldShowCustomPcField,
  shouldShowOrderIdField,
  shouldShowOrderItemIdField,
  ticketTypeOptions,
} from "../../utils/ticket";

function TextField({
  label,
  value,
  onChange,
  placeholder,
  error,
  disabled = false,
  type = "text",
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className={`h-11 w-full rounded-xl border px-4 text-sm outline-none transition ${
          error
            ? "border-red-300 bg-red-50"
            : "border-slate-300 focus:border-[#0090D0] focus:ring-2 focus:ring-[#0090D0]/10"
        } disabled:cursor-not-allowed disabled:bg-slate-100`}
      />
      {error ? <span className="text-xs text-red-600">{error}</span> : null}
    </label>
  );
}

function TextAreaField({
  label,
  value,
  onChange,
  placeholder,
  error,
  disabled = false,
  rows = 4,
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <textarea
        rows={rows}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition ${
          error
            ? "border-red-300 bg-red-50"
            : "border-slate-300 focus:border-[#0090D0] focus:ring-2 focus:ring-[#0090D0]/10"
        } disabled:cursor-not-allowed disabled:bg-slate-100`}
      />
      {error ? <span className="text-xs text-red-600">{error}</span> : null}
    </label>
  );
}

function getTypeHint(ticketType) {
  const normalizedType = normalizeTicketType(ticketType);

  if (normalizedType === "OrderIssue") {
    return "Vui lòng nhập mã đơn hàng để bộ phận hỗ trợ kiểm tra đúng đơn phát sinh vấn đề.";
  }

  if (normalizedType === "WarrantyRequest") {
    return "Vui lòng nhập mã sản phẩm trong đơn hàng để yêu cầu bảo hành được xử lý chính xác.";
  }

  if (normalizedType === "BuildAdvice" || normalizedType === "CompatibilityQuestion") {
    return "Bạn có thể nhập mã cấu hình Custom PC để đội ngũ kỹ thuật tư vấn nhanh hơn.";
  }

  return "Mô tả rõ tình huống để bộ phận hỗ trợ phản hồi chính xác hơn.";
}

function validatePhone(phone) {
  return /^(0|\+84)[0-9]{9}$/.test(String(phone || "").trim());
}

export default function TicketForm({
  mode = "customer",
  initialValues,
  submitting = false,
  onSubmit,
  title = "Tạo ticket mới",
  submitLabel = "Tạo ticket",
}) {
  const [form, setForm] = useState(getTicketFormDefaults(initialValues));
  const [files, setFiles] = useState([]);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    setForm(getTicketFormDefaults(initialValues));
    setFiles([]);
    setErrors({});
  }, [initialValues]);

  const normalizedType = useMemo(
    () => normalizeTicketType(form.type) || "TechnicalSupport",
    [form.type]
  );

  const showCustomPcField = shouldShowCustomPcField(normalizedType);
  const showOrderIdField = shouldShowOrderIdField(normalizedType);
  const showOrderItemIdField = shouldShowOrderItemIdField(normalizedType);
  const isGuestMode = mode === "guest";

  const setField = (field, value) => {
    setForm((currentValue) => ({
      ...currentValue,
      [field]: value,
    }));

    setErrors((currentValue) => {
      if (!currentValue[field]) return currentValue;
      return {
        ...currentValue,
        [field]: "",
      };
    });
  };

  const validateForm = () => {
    const nextErrors = {};

    if (isGuestMode) {
      if (!String(form.fullName || "").trim()) {
        nextErrors.fullName = "Vui lòng nhập họ và tên.";
      }

      const trimmedPhone = String(form.phone || "").trim();
      if (!trimmedPhone) {
        nextErrors.phone = "Vui lòng nhập số điện thoại.";
      } else if (!validatePhone(trimmedPhone)) {
        nextErrors.phone = "Số điện thoại không hợp lệ.";
      }
    }

    if (!String(form.title || "").trim()) {
      nextErrors.title = "Vui lòng nhập tiêu đề ticket.";
    }

    if (!String(form.description || "").trim()) {
      nextErrors.description = "Vui lòng nhập mô tả ticket.";
    }

    if (!String(form.message || "").trim()) {
      nextErrors.message = "Vui lòng nhập nội dung phản hồi đầu tiên.";
    }

    if (showOrderIdField && !String(form.orderId || "").trim()) {
      nextErrors.orderId = "Vui lòng nhập mã đơn hàng.";
    }

    if (showOrderItemIdField && !String(form.orderItemId || "").trim()) {
      nextErrors.orderItemId = "Vui lòng nhập mã sản phẩm trong đơn hàng.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validateForm()) {
      toast.error("Vui lòng kiểm tra lại thông tin ticket.");
      return;
    }

    try {
      const result = await onSubmit?.({
        ...form,
        type: normalizedType,
        files,
      });

      if (result !== false) {
        setForm((currentValue) => ({
          ...currentValue,
          title: "",
          description: "",
          message: "",
        }));
        setFiles([]);
      }
    } catch {
      // Lỗi đã được xử lý ở nơi gọi.
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          <p className="mt-1 text-sm text-slate-500">{getTypeHint(normalizedType)}</p>
        </div>
        <span className="rounded-full bg-[#0090D0]/10 px-3 py-1 text-xs font-semibold text-[#0090D0]">
          Ticket mới
        </span>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
        {isGuestMode ? (
          <>
            <TextField
              label="Họ và tên"
              value={form.fullName}
              onChange={(value) => setField("fullName", value)}
              placeholder="Nguyễn Văn A"
              error={errors.fullName}
              disabled={submitting}
            />
            <TextField
              label="Số điện thoại"
              value={form.phone}
              onChange={(value) => setField("phone", value)}
              placeholder="0912345678"
              error={errors.phone}
              disabled={submitting}
            />
          </>
        ) : null}

        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-slate-700">Loại ticket</span>
          <select
            value={normalizedType}
            onChange={(event) => setField("type", event.target.value)}
            disabled={submitting}
            className="h-11 w-full rounded-xl border border-slate-300 px-4 text-sm outline-none transition focus:border-[#0090D0] focus:ring-2 focus:ring-[#0090D0]/10 disabled:cursor-not-allowed disabled:bg-slate-100"
          >
            {ticketTypeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <TextField
          label="Tiêu đề"
          value={form.title}
          onChange={(value) => setField("title", value)}
          placeholder="Ví dụ: Cần kiểm tra tình trạng đơn hàng"
          error={errors.title}
          disabled={submitting}
        />
      </div>

      <div className="mt-4 space-y-4">
        <TextAreaField
          label="Mô tả ticket"
          value={form.description}
          onChange={(value) => setField("description", value)}
          placeholder="Mô tả ngắn gọn tình huống để bộ phận hỗ trợ nắm nhanh vấn đề."
          error={errors.description}
          disabled={submitting}
          rows={3}
        />

        <TextAreaField
          label="Tin nhắn đầu tiên"
          value={form.message}
          onChange={(value) => setField("message", value)}
          placeholder="Nhập nội dung cần hỗ trợ chi tiết hơn."
          error={errors.message}
          disabled={submitting}
          rows={5}
        />

        {(showCustomPcField || showOrderIdField || showOrderItemIdField) ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {showCustomPcField ? (
              <TextField
                label="Mã cấu hình Custom PC"
                value={form.customPCId}
                onChange={(value) => setField("customPCId", value)}
                placeholder="Nhập mã cấu hình nếu có"
                error={errors.customPCId}
                disabled={submitting}
              />
            ) : null}

            {showOrderIdField ? (
              <TextField
                label="Mã đơn hàng"
                value={form.orderId}
                onChange={(value) => setField("orderId", value)}
                placeholder="Nhập mã đơn hàng"
                error={errors.orderId}
                disabled={submitting}
              />
            ) : null}

            {showOrderItemIdField ? (
              <TextField
                label="Mã sản phẩm trong đơn hàng"
                value={form.orderItemId}
                onChange={(value) => setField("orderItemId", value)}
                placeholder="Nhập mã sản phẩm cần bảo hành"
                error={errors.orderItemId}
                disabled={submitting}
                type="number"
              />
            ) : null}
          </div>
        ) : null}

        <TicketAttachmentPicker
          files={files}
          onChange={setFiles}
          disabled={submitting}
        />
      </div>

      <div className="mt-5 flex justify-end">
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex h-11 items-center gap-2 rounded-lg bg-[#0090D0] px-5 text-sm font-semibold text-white transition hover:bg-[#0077B0] disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {submitting ? <Loader2 size={16} className="animate-spin" /> : null}
          {submitting ? "Đang gửi..." : submitLabel}
        </button>
      </div>
    </form>
  );
}