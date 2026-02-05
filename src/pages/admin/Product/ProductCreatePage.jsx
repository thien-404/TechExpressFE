import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  FiArrowLeft,
  FiPackage,
  FiTag,
  FiDollarSign,
  FiBox,
  FiAlertCircle,
  FiCpu,
  FiInfo,
} from "react-icons/fi";

import { apiService } from "../../../config/axios";
import Breadcrumb from "../../../components/ui/Breadcrumb";
import CategorySelect from "../../../components/ui/select/CategorySelect";
import BrandSelect from "../../../components/ui/select/BrandSelect";

/* =========================
 * STYLES
 * ========================= */
const inputClass =
  "h-10 w-full rounded border border-slate-300 px-3 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100 bg-white transition-all";

const labelClass = "mb-1.5 block text-xs font-semibold text-slate-600";

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
);

/* =========================
 * SECTION COMPONENT
 * ========================= */
const Section = ({ title, icon: Icon, children }) => (
  <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
    <div className="px-4 py-3 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
      <div className="flex items-center gap-2">
        {Icon && <Icon size={16} className="text-slate-500" />}
        <span className="text-sm font-semibold text-[#334155]">{title}</span>
      </div>
    </div>
    <div className="p-6">{children}</div>
  </div>
);

/* =========================
 * MAIN PAGE
 * ========================= */
export default function ProductCreatePage() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    sku: "",
    categoryId: "",
    brandId: "",
    price: 0,
    stock: 0,
    warrantyMonth: 0,
    status: 0,
    description: "",
    specValues: [],
  });

  const [errors, setErrors] = useState({});

  const setField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    // Clear error khi user nhập
    setErrors((prev) => ({ ...prev, [key]: null }));
  };

  /* =========================
   * FETCH CATEGORIES
   * ========================= */
  const { data: categoriesData } = useQuery({
    queryKey: ["categories-all"],
    queryFn: async () => {
      const res = await apiService.get("/category");
      return res?.statusCode === 200 ? res.value?.items || [] : [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const categories = categoriesData || [];

  /* =========================
  * FETCH BRANDS
  * ========================= */
  const { data: brandsData } = useQuery({
    queryKey: ["brands"],
    queryFn: async () => {
      const res = await apiService.get("/brand", {
        pageNumber: 1,
        pageSize: 100,
      })
      return res?.statusCode === 200 ? res.value?.items || [] : []
    },
    staleTime: 5 * 60 * 1000,
  })

  const brands = brandsData || []

  /* =========================
   * FETCH SPEC DEFINITIONS (khi đã chọn category)
   * ========================= */
  const { data: specsData, isLoading: specsLoading } = useQuery({
    queryKey: ["spec-definitions", form.categoryId],
    queryFn: async () => {
      if (!form.categoryId) return [];

      const res = await apiService.get(
        `/specdefinition/category/${form.categoryId}`,
      );
      return res?.statusCode === 200 ? res.value?.items || [] : [];
    },
    enabled: !!form.categoryId,
    staleTime: 5 * 60 * 1000,
  });

  const specDefinitions = specsData || [];

  /* =========================
   * RESET SPECS khi đổi category
   * ========================= */
  useEffect(() => {
    if (form.categoryId) {
      // Reset spec values khi đổi category
      setForm((prev) => ({ ...prev, specValues: [] }));
    }
  }, [form.categoryId]);

  /* =========================
   * UPDATE SPEC VALUE
   * ========================= */
  const updateSpecValue = (specDefId, value) => {
    setForm((prev) => {
      const existing = prev.specValues.find(
        (s) => s.specDefinitionId === specDefId,
      );

      if (existing) {
        // Update existing
        return {
          ...prev,
          specValues: prev.specValues.map((s) =>
            s.specDefinitionId === specDefId ? { ...s, value } : s,
          ),
        };
      } else {
        // Add new
        return {
          ...prev,
          specValues: [
            ...prev.specValues,
            { specDefinitionId: specDefId, value },
          ],
        };
      }
    });
  };

  const getSpecValue = (specDefId) => {
    const spec = form.specValues.find((s) => s.specDefinitionId === specDefId);
    return spec?.value || "";
  };

  /* =========================
   * VALIDATION
   * ========================= */
  const validate = () => {
    const newErrors = {};

    // Required fields
    if (!form.name?.trim()) newErrors.name = "Tên sản phẩm là bắt buộc";
    if (!form.sku?.trim()) newErrors.sku = "SKU là bắt buộc";
    if (!form.categoryId) newErrors.categoryId = "Vui lòng chọn danh mục";
    if (form.price <= 0) newErrors.price = "Giá phải lớn hơn 0";
    if (form.stock < 0) newErrors.stock = "Số lượng không được âm";
    if (!form.brandId) newErrors.brandId = "Vui lòng chọn thương hiệu";
    if (form.warrantyMonth < 0)
      newErrors.warrantyMonth = "Thời gian bảo hành không hợp lệ";

    // Validate required specs
    specDefinitions.forEach((spec) => {
      if (spec.isRequired) {
        const value = getSpecValue(spec.id);
        if (!value?.trim()) {
          newErrors[`spec_${spec.id}`] = `${spec.name} là bắt buộc`;
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /* =========================
   * CREATE MUTATION
   * ========================= */
  const createMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name: form.name.trim(),
        sku: form.sku.trim(),
        categoryId: form.categoryId,
        brandId: form.brandId,
        price: Number(form.price),
        stock: Number(form.stock),
        warrantyMonth: Number(form.warrantyMonth),
        status: Number(form.status),
        description: form.description.trim(),
        images: [], // Không thêm ảnh lúc create
        specValues: form.specValues.filter((s) => s.value?.trim()), // Chỉ gửi specs có giá trị
      };

      const res = await apiService.post("/product/create-product", payload);

      if (res?.statusCode !== 201 && res?.statusCode !== 200) {
        throw new Error(res?.message || "Tạo sản phẩm thất bại");
      }

      return res.value;
    },
    onSuccess: (product) => {
      toast.success("Tạo sản phẩm thành công");
      navigate(`/admin/products/${product.id}`);
    },
    onError: (err) => {
      toast.error(err?.message || "Tạo sản phẩm thất bại");
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validate()) {
      toast.error("Vui lòng kiểm tra lại thông tin");
      return;
    }

    createMutation.mutate();
  };

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
            { label: "Quản lý sản phẩm", href: "/admin/products" },
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

      {/* Header */}
      <div className="mt-3">
        <h1 className="text-2xl font-semibold text-[#334155]">
          Tạo sản phẩm mới
        </h1>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="mt-4 space-y-6">
        {/* Basic Information */}
        <Section title="Thông tin cơ bản" icon={FiInfo}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Name */}
            <Field label="Tên sản phẩm" error={errors.name} required>
              <div className="relative">
                <FiPackage
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  size={16}
                />
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setField("name", e.target.value)}
                  className={`${inputClass} pl-10`}
                  placeholder="VD: Intel Core i5-13400F"
                />
              </div>
            </Field>

            {/* SKU */}
            <Field label="SKU" error={errors.sku} required>
              <div className="relative">
                <FiTag
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  size={16}
                />
                <input
                  type="text"
                  value={form.sku}
                  onChange={(e) => setField("sku", e.target.value)}
                  className={`${inputClass} pl-10`}
                  placeholder="VD: CPU-I5-13400F"
                />
              </div>
            </Field>

            {/* Category */}
            <Field label="Danh mục" error={errors.categoryId} required>
              <CategorySelect
                value={form.categoryId}
                onChange={(id) => setField("categoryId", id)}
                categories={categories}
                placeholder="Chọn danh mục sản phẩm"
              />
            </Field>

            {/* Brand */}
            <Field label="Thương hiệu" error={errors.brandId} required>
              <BrandSelect
                value={form.brandId}
                onChange={(id) => setField("brandId", id)}
                brands={brands}
                placeholder="Chọn thương hiệu"
              />
            </Field>

            {/* Status */}
            <Field label="Trạng thái" required>
              <select
                value={form.status}
                onChange={(e) => setField("status", e.target.value)}
                className={inputClass}
              >
                <option value={0}>Available</option>
                <option value={1}>Unavailable</option>
              </select>
            </Field>

            {/* Price */}
            <Field label="Giá (VNĐ)" error={errors.price} required>
              <div className="relative">
                <FiDollarSign
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  size={16}
                />
                <input
                  type="number"
                  value={form.price}
                  onChange={(e) => setField("price", e.target.value)}
                  className={`${inputClass} pl-10`}
                  placeholder="VD: 5490000"
                  min="0"
                  step="1000"
                />
              </div>
            </Field>

            {/* Stock Qty */}
            <Field label="Số lượng tồn kho" error={errors.stock} required>
              <div className="relative">
                <FiBox
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  size={16}
                />
                <input
                  type="number"
                  value={form.stock}
                  onChange={(e) => setField("stock", e.target.value)}
                  className={`${inputClass} pl-10`}
                  placeholder="VD: 30"
                  min="0"
                />
              </div>
            </Field>
            {/* Warranty Month */}
            <Field label="Bảo hành (tháng)" error={errors.warrantyMonth}>
              <input
                type="number"
                min="0"
                value={form.warrantyMonth}
                onChange={(e) => setField("warrantyMonth", e.target.value)}
                className={inputClass}
                placeholder="VD: 12"
              />
            </Field>

            {/* Description */}
            <div className="md:col-span-2">
              <Field label="Mô tả sản phẩm">
                <textarea
                  value={form.description}
                  onChange={(e) => setField("description", e.target.value)}
                  className={`${inputClass} h-24 resize-none`}
                  placeholder="Mô tả chi tiết về sản phẩm..."
                />
              </Field>
            </div>
          </div>
        </Section>

        {/* Specifications */}
        {form.categoryId && (
          <Section title="Thông số kỹ thuật" icon={FiCpu}>
            {specsLoading ? (
              <div className="text-center py-8 text-sm text-slate-500">
                Đang tải thông số kỹ thuật...
              </div>
            ) : specDefinitions.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {specDefinitions.map((spec) => {
                  const inputType =
                    spec.acceptValueType === "Number" ||
                      spec.acceptValueType === "Decimal"
                      ? "number"
                      : "text";

                  const step = spec.acceptValueType === "Decimal" ? "0.1" : "1";

                  return (
                    <Field
                      key={spec.id}
                      label={spec.name}
                      error={errors[`spec_${spec.id}`]}
                      required={spec.isRequired}
                    >
                      <div className="relative">
                        <FiCpu
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                          size={16}
                        />
                        <input
                          type={inputType}
                          value={getSpecValue(spec.id)}
                          onChange={(e) =>
                            updateSpecValue(spec.id, e.target.value)
                          }
                          className={`${inputClass} pl-10 ${spec.unit ? "pr-16" : ""}`}
                          placeholder={spec.description || spec.name}
                          step={inputType === "number" ? step : undefined}
                        />
                        {spec.unit && (
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 bg-slate-50 px-2 py-1 rounded">
                            {spec.unit}
                          </span>
                        )}
                      </div>
                      {spec.code && (
                        <div className="text-xs text-slate-400 mt-1">
                          Code:{" "}
                          <code className="bg-slate-100 px-1 py-0.5 rounded">
                            {spec.code}
                          </code>
                        </div>
                      )}
                    </Field>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <FiCpu size={48} className="mx-auto text-slate-300 mb-4" />
                <p className="text-sm text-slate-500">
                  Danh mục này chưa có thông số kỹ thuật định nghĩa
                </p>
              </div>
            )}
          </Section>
        )}

        {/* Form Actions */}
        <div className="flex items-center justify-between pt-2">
          <div className="text-xs text-slate-500">
            <span className="text-red-500">*</span> Trường bắt buộc
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              disabled={createMutation.isPending}
              className="h-10 rounded border border-slate-300 px-6 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
              Hủy
            </button>

            <button
              type="submit"
              disabled={createMutation.isPending}
              className="h-10 rounded bg-[#6e846f] px-6 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {createMutation.isPending ? "Đang tạo..." : "Tạo sản phẩm"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
