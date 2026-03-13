import React, { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  FiAlertCircle,
  FiArrowLeft,
  FiGift,
  FiInfo,
  FiLayers,
  FiSettings,
  FiTag,
} from "react-icons/fi";

import Breadcrumb from "../../../components/ui/Breadcrumb";
import CategorySelect from "../../../components/ui/select/CategorySelect";
import BrandSelect from "../../../components/ui/select/BrandSelect";
import { apiService } from "../../../config/axios";
import { cachePromotion, PROMOTION_REQUIRED_LOGIC_OPTIONS, PROMOTION_SCOPE_OPTIONS, PROMOTION_TYPE_OPTIONS } from "./promotionHelpers";
import PromotionProductSelector from "./PromotionProductSelector";

const inputClass =
  "h-10 w-full rounded border border-slate-300 px-3 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100 bg-white transition-all";

const labelClass = "mb-1.5 block text-xs font-semibold text-slate-600";

const Field = ({ label, error, required = false, children }) => (
  <div>
    <label className={labelClass}>
      {label}
      {required && <span className="ml-1 text-red-500">*</span>}
    </label>
    {children}
    {error && (
      <div className="mt-1.5 flex items-center gap-1 text-xs text-red-500">
        <FiAlertCircle size={12} />
        {error}
      </div>
    )}
  </div>
);

const Section = ({ title, icon: Icon, children }) => (
  <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
    <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white px-4 py-3">
      <div className="flex items-center gap-2">
        {Icon && <Icon size={16} className="text-slate-500" />}
        <span className="text-sm font-semibold text-[#334155]">{title}</span>
      </div>
    </div>
    <div className="p-6">{children}</div>
  </div>
);

export default function PromotionCreatePage() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    code: "",
    description: "",
    type: "PercentageDiscount",
    scope: "Order",
    discountValue: "",
    maxDiscountValue: "",
    minOrderValue: "",
    requiredProducts: [],
    requiredProductLogic: "And",
    freeProducts: [],
    freeItemPickCount: 1,
    categoryId: "",
    brandId: "",
    appliedProducts: [],
    minAppliedQuantity: "",
    maxUsageCount: "",
    maxUsagePerUser: "",
    startDate: "",
    endDate: "",
    isStackable: false,
  });
  const [errors, setErrors] = useState({});

  const setField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: null }));
  };

  const { data: categoriesData } = useQuery({
    queryKey: ["categories-all"],
    queryFn: async () => {
      const res = await apiService.get("/category");
      return res?.statusCode === 200 ? res.value?.items || [] : [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: brandsData } = useQuery({
    queryKey: ["brands"],
    queryFn: async () => {
      const res = await apiService.get("/brand", {
        pageNumber: 1,
        pageSize: 100,
      });
      return res?.statusCode === 200 ? res.value?.items || [] : [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const categories = categoriesData || [];
  const brands = brandsData || [];

  const isFreeItem = form.type === "FreeItem";
  const isPercentageDiscount = form.type === "PercentageDiscount";
  const needsDiscountValue = form.type !== "FreeItem";
  const needsAppliedProducts = form.scope === "Product";
  const needsCategory = form.scope === "Category";
  const needsBrand = form.scope === "Brand";

  const summary = useMemo(
    () => ({
      appliedCount: form.appliedProducts.length,
      requiredCount: form.requiredProducts.length,
      freeCount: form.freeProducts.length,
    }),
    [form.appliedProducts.length, form.requiredProducts.length, form.freeProducts.length],
  );

  const validate = () => {
    const nextErrors = {};

    if (!form.name.trim()) nextErrors.name = "Tên khuyến mãi là bắt buộc";
    if (!form.code.trim()) nextErrors.code = "Mã khuyến mãi là bắt buộc";
    if (!form.description.trim()) nextErrors.description = "Mô tả là bắt buộc";
    if (!form.startDate) nextErrors.startDate = "Vui lòng chọn ngày bắt đầu";
    if (!form.endDate) nextErrors.endDate = "Vui lòng chọn ngày kết thúc";

    if (form.startDate && form.endDate) {
      const start = new Date(form.startDate);
      const end = new Date(form.endDate);
      if (end <= start) {
        nextErrors.endDate = "Ngày kết thúc phải sau ngày bắt đầu";
      }
    }

    if (needsDiscountValue && Number(form.discountValue) <= 0) {
      nextErrors.discountValue = "Giá trị khuyến mãi phải lớn hơn 0";
    }

    if (isPercentageDiscount && Number(form.discountValue) > 100) {
      nextErrors.discountValue = "Giảm theo phần trăm không được vượt quá 100";
    }

    if (form.maxDiscountValue !== "" && Number(form.maxDiscountValue) < 0) {
      nextErrors.maxDiscountValue = "Giá trị giảm tối đa không hợp lệ";
    }

    if (form.minOrderValue !== "" && Number(form.minOrderValue) < 0) {
      nextErrors.minOrderValue = "Giá trị đơn tối thiểu không hợp lệ";
    }

    if (needsCategory && !form.categoryId) {
      nextErrors.categoryId = "Vui lòng chọn danh mục áp dụng";
    }

    if (needsBrand && !form.brandId) {
      nextErrors.brandId = "Vui lòng chọn thương hiệu áp dụng";
    }

    if (needsAppliedProducts && form.appliedProducts.length === 0) {
      nextErrors.appliedProducts = "Vui lòng chọn ít nhất một sản phẩm áp dụng";
    }

    if (form.minAppliedQuantity !== "" && Number(form.minAppliedQuantity) < 1) {
      nextErrors.minAppliedQuantity = "Số lượng áp dụng tối thiểu phải từ 1";
    }

    if (form.maxUsageCount !== "" && Number(form.maxUsageCount) < 1) {
      nextErrors.maxUsageCount = "Số lượt sử dụng tối đa phải từ 1";
    }

    if (form.maxUsagePerUser !== "" && Number(form.maxUsagePerUser) < 1) {
      nextErrors.maxUsagePerUser = "Số lượt dùng tối đa mỗi khách phải từ 1";
    }

    form.requiredProducts.forEach((item, index) => {
      if (Number(item.minQuantity) < 1) {
        nextErrors[`requiredProducts_${index}`] = "Số lượng tối thiểu phải từ 1";
      }
      if (item.maxQuantity !== "" && Number(item.maxQuantity) < Number(item.minQuantity)) {
        nextErrors[`requiredProducts_${index}`] = "Số lượng tối đa phải lớn hơn hoặc bằng số lượng tối thiểu";
      }
    });

    if (isFreeItem) {
      if (form.freeProducts.length === 0) {
        nextErrors.freeProducts = "Vui lòng chọn ít nhất một sản phẩm tặng";
      }
      if (Number(form.freeItemPickCount) < 1) {
        nextErrors.freeItemPickCount = "Số lượng sản phẩm được chọn phải từ 1";
      }

      form.freeProducts.forEach((item, index) => {
        if (Number(item.quantity) < 1) {
          nextErrors[`freeProducts_${index}`] = "Số lượng tặng phải từ 1";
        }
      });
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const createMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name: form.name.trim(),
        code: form.code.trim(),
        description: form.description.trim(),
        type: form.type,
        scope: form.scope,
        discountValue: needsDiscountValue ? Number(form.discountValue) : 0,
        maxDiscountValue: form.maxDiscountValue === "" ? null : Number(form.maxDiscountValue),
        minOrderValue: form.minOrderValue === "" ? null : Number(form.minOrderValue),
        requiredProducts: form.requiredProducts.map((item) => ({
          productId: item.productId,
          minQuantity: Number(item.minQuantity),
          maxQuantity: item.maxQuantity === "" ? null : Number(item.maxQuantity),
        })),
        requiredProductLogic: form.requiredProductLogic,
        freeProducts: form.freeProducts.map((item) => ({
          productId: item.productId,
          quantity: Number(item.quantity),
        })),
        freeItemPickCount: isFreeItem ? Number(form.freeItemPickCount) : 0,
        categoryId: needsCategory ? form.categoryId : null,
        brandId: needsBrand ? form.brandId : null,
        appliedProducts: needsAppliedProducts
          ? form.appliedProducts.map((item) => item.productId)
          : [],
        minAppliedQuantity:
          form.minAppliedQuantity === "" ? null : Number(form.minAppliedQuantity),
        maxUsageCount: form.maxUsageCount === "" ? null : Number(form.maxUsageCount),
        maxUsagePerUser:
          form.maxUsagePerUser === "" ? null : Number(form.maxUsagePerUser),
        startDate: form.startDate,
        endDate: form.endDate,
        isStackable: form.isStackable,
      };

      const res = await apiService.post("/promotion", payload);

      if (res?.statusCode !== 201 && res?.statusCode !== 200) {
        throw new Error(res?.message || "Tạo khuyến mãi thất bại");
      }

      return res.value;
    },
    onSuccess: (promotion) => {
      cachePromotion(promotion);
      toast.success("Tạo khuyến mãi thành công");
      navigate(`/admin/promotions/${promotion.id}`, { state: { promotion } });
    },
    onError: (error) => {
      toast.error(error?.message || "Tạo khuyến mãi thất bại");
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validate()) {
      toast.error("Vui lòng kiểm tra lại thông tin khuyến mãi");
      return;
    }

    createMutation.mutate();
  };

  return (
    <div className="font-[var(--font-inter)]">
      <div className="flex items-center justify-between">
        <Breadcrumb
          items={[
            { label: "Trang chủ", href: "/admin" },
            { label: "Quản lý khuyến mãi", href: "/admin/promotions" },
            { label: "Tạo mới" },
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

      <div className="mt-3">
        <h1 className="text-2xl font-semibold text-[#334155]">
          Tạo khuyến mãi mới
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Cấu hình loại khuyến mãi, phạm vi áp dụng và điều kiện sử dụng.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mt-4 space-y-6">
        <Section title="Thông tin cơ bản" icon={FiInfo}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Tên khuyến mãi" error={errors.name} required>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setField("name", e.target.value)}
                className={inputClass}
                placeholder="Ví dụ: Giảm giá RAM tháng 3"
              />
            </Field>

            <Field label="Mã khuyến mãi" error={errors.code} required>
              <input
                type="text"
                value={form.code}
                onChange={(e) => setField("code", e.target.value.toUpperCase())}
                className={inputClass}
                placeholder="Ví dụ: RAMT3"
              />
            </Field>

            <Field label="Loại khuyến mãi" required>
              <select
                value={form.type}
                onChange={(e) => setField("type", e.target.value)}
                className={inputClass}
              >
                {PROMOTION_TYPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Phạm vi áp dụng" required>
              <select
                value={form.scope}
                onChange={(e) => setField("scope", e.target.value)}
                className={inputClass}
              >
                {PROMOTION_SCOPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Ngày bắt đầu" error={errors.startDate} required>
              <input
                type="datetime-local"
                value={form.startDate}
                onChange={(e) => setField("startDate", e.target.value)}
                className={inputClass}
              />
            </Field>

            <Field label="Ngày kết thúc" error={errors.endDate} required>
              <input
                type="datetime-local"
                value={form.endDate}
                onChange={(e) => setField("endDate", e.target.value)}
                className={inputClass}
              />
            </Field>

            <div className="md:col-span-2">
              <Field label="Mô tả" error={errors.description} required>
                <textarea
                  value={form.description}
                  onChange={(e) => setField("description", e.target.value)}
                  className={`${inputClass} h-24 resize-none`}
                  placeholder="Mô tả chi tiết nội dung khuyến mãi..."
                />
              </Field>
            </div>
          </div>
        </Section>

        <Section title="Thiết lập ưu đãi" icon={FiTag}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {needsDiscountValue && (
              <Field
                label={
                  form.type === "FixedPrice" ? "Giá bán cố định" : "Giá trị khuyến mãi"
                }
                error={errors.discountValue}
                required
              >
                <input
                  type="number"
                  min="0"
                  step={isPercentageDiscount ? "1" : "1000"}
                  value={form.discountValue}
                  onChange={(e) => setField("discountValue", e.target.value)}
                  className={inputClass}
                  placeholder={isPercentageDiscount ? "Ví dụ: 10" : "Ví dụ: 100000"}
                />
              </Field>
            )}

            {isPercentageDiscount && (
              <Field label="Giảm tối đa" error={errors.maxDiscountValue}>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={form.maxDiscountValue}
                  onChange={(e) => setField("maxDiscountValue", e.target.value)}
                  className={inputClass}
                  placeholder="Để trống nếu không giới hạn"
                />
              </Field>
            )}

            <Field label="Giá trị đơn tối thiểu" error={errors.minOrderValue}>
              <input
                type="number"
                min="0"
                step="1000"
                value={form.minOrderValue}
                onChange={(e) => setField("minOrderValue", e.target.value)}
                className={inputClass}
                placeholder="Để trống nếu không yêu cầu"
              />
            </Field>

            <Field label="Số lượt dùng tối đa" error={errors.maxUsageCount}>
              <input
                type="number"
                min="1"
                value={form.maxUsageCount}
                onChange={(e) => setField("maxUsageCount", e.target.value)}
                className={inputClass}
                placeholder="Để trống nếu không giới hạn"
              />
            </Field>

            <Field label="Số lượt tối đa mỗi khách" error={errors.maxUsagePerUser}>
              <input
                type="number"
                min="1"
                value={form.maxUsagePerUser}
                onChange={(e) => setField("maxUsagePerUser", e.target.value)}
                className={inputClass}
                placeholder="Để trống nếu không giới hạn"
              />
            </Field>

            <Field label="Số lượng áp dụng tối thiểu" error={errors.minAppliedQuantity}>
              <input
                type="number"
                min="1"
                value={form.minAppliedQuantity}
                onChange={(e) => setField("minAppliedQuantity", e.target.value)}
                className={inputClass}
                placeholder="Để trống nếu không yêu cầu"
              />
            </Field>

            <div className="md:col-span-2">
              <label className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={form.isStackable}
                  onChange={(e) => setField("isStackable", e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300"
                />
                Cho phép cộng dồn với khuyến mãi khác
              </label>
            </div>
          </div>
        </Section>

        <Section title="Phạm vi áp dụng" icon={FiLayers}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {needsCategory && (
              <Field label="Danh mục áp dụng" error={errors.categoryId} required>
                <CategorySelect
                  value={form.categoryId}
                  onChange={(id) => setField("categoryId", id)}
                  categories={categories}
                  placeholder="Chọn danh mục"
                />
              </Field>
            )}

            {needsBrand && (
              <Field label="Thương hiệu áp dụng" error={errors.brandId} required>
                <BrandSelect
                  value={form.brandId}
                  onChange={(id) => setField("brandId", id)}
                  brands={brands}
                  placeholder="Chọn thương hiệu"
                />
              </Field>
            )}

            {!needsCategory && !needsBrand && !needsAppliedProducts && (
              <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
                Khuyến mãi hiện đang áp dụng cho toàn đơn hàng, không cần chọn đối tượng cụ thể.
              </div>
            )}

            {errors.appliedProducts && (
              <div className="md:col-span-2 text-sm text-red-500">
                {errors.appliedProducts}
              </div>
            )}
          </div>
        </Section>

        {needsAppliedProducts && (
          <PromotionProductSelector
            title="Sản phẩm được áp dụng"
            description="Chọn các sản phẩm sẽ được áp dụng khuyến mãi khi phạm vi là sản phẩm."
            mode="applied"
            selectedItems={form.appliedProducts}
            onChange={(items) => setField("appliedProducts", items)}
          />
        )}

        <Section title="Điều kiện nhận khuyến mãi" icon={FiSettings}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Logic sản phẩm điều kiện">
              <select
                value={form.requiredProductLogic}
                onChange={(e) => setField("requiredProductLogic", e.target.value)}
                className={inputClass}
              >
                {PROMOTION_REQUIRED_LOGIC_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </Field>

            <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
              Đã chọn {summary.requiredCount} sản phẩm điều kiện, {summary.appliedCount} sản phẩm áp dụng
              và {summary.freeCount} sản phẩm tặng.
            </div>
          </div>
        </Section>

        <PromotionProductSelector
          title="Sản phẩm điều kiện"
          description="Khách hàng cần mua các sản phẩm này để đủ điều kiện hưởng khuyến mãi."
          mode="required"
          selectedItems={form.requiredProducts}
          onChange={(items) => setField("requiredProducts", items)}
        />

        {isFreeItem && (
          <>
            <Section title="Thiết lập quà tặng" icon={FiGift}>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Field
                  label="Số lượng sản phẩm được chọn"
                  error={errors.freeItemPickCount}
                  required
                >
                  <input
                    type="number"
                    min="1"
                    value={form.freeItemPickCount}
                    onChange={(e) => setField("freeItemPickCount", e.target.value)}
                    className={inputClass}
                  />
                </Field>

                <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                  Khách hàng có thể chọn tối đa {form.freeItemPickCount || 0} sản phẩm trong danh sách quà tặng bên dưới.
                </div>
              </div>

              {errors.freeProducts && (
                <div className="mt-3 text-sm text-red-500">{errors.freeProducts}</div>
              )}
            </Section>

            <PromotionProductSelector
              title="Sản phẩm quà tặng"
              description="Chọn các sản phẩm sẽ được tặng kèm khi khuyến mãi loại tặng sản phẩm."
              mode="free"
              selectedItems={form.freeProducts}
              onChange={(items) => setField("freeProducts", items)}
            />
          </>
        )}

        <div className="flex items-center justify-between pt-2">
          <div className="text-xs text-slate-500">
            <span className="text-red-500">*</span> Trường bắt buộc
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => navigate("/admin/promotions")}
              disabled={createMutation.isPending}
              className="h-10 rounded border border-slate-300 px-6 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
            >
              Hủy
            </button>

            <button
              type="submit"
              disabled={createMutation.isPending}
              className="h-10 rounded bg-[#6e846f] px-6 text-sm font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {createMutation.isPending ? "Đang tạo..." : "Tạo khuyến mãi"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
