import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  FiAlertCircle,
  FiArrowLeft,
  FiCheckCircle,
  FiChevronLeft,
  FiChevronRight,
  FiCpu,
  FiDollarSign,
  FiExternalLink,
  FiFolder,
  FiImage,
  FiInfo,
  FiLoader,
  FiPackage,
  FiPlus,
  FiRefreshCcw,
  FiSearch,
  FiShield,
  FiTag,
  FiTrash2,
  FiUpload,
  FiX,
} from "react-icons/fi";

import { apiService } from "../../../config/axios";
import Breadcrumb from "../../../components/ui/Breadcrumb";
import CategorySelect from "../../../components/ui/select/CategorySelect";
import BrandSelect from "../../../components/ui/select/BrandSelect";
import useCustomPcCategories from "../../../hooks/useCustomPcCategories";
import { productPcService } from "../../../services/productPcService";
import { uploadProductImages, validateImageFiles } from "../../../utils/uploadImage";

const COMPONENT_PAGE_SIZE = 8;

const inputClass =
  "h-10 w-full rounded border border-slate-300 px-3 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100 bg-white transition-all";

const labelClass = "mb-1.5 block text-xs font-semibold text-slate-600";

const Field = ({ label, error, required = false, children, hint }) => (
  <div>
    <label className={labelClass}>
      {label}
      {required && <span className="ml-1 text-red-500">*</span>}
    </label>
    {children}
    {hint ? <div className="mt-1 text-xs text-slate-400">{hint}</div> : null}
    {error ? (
      <div className="mt-1.5 flex items-center gap-1 text-xs text-red-500">
        <FiAlertCircle size={12} />
        {error}
      </div>
    ) : null}
  </div>
);

const Section = ({ title, icon: Icon, children, extra }) => (
  <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
    <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {Icon ? <Icon size={16} className="text-slate-500" /> : null}
          <span className="text-sm font-semibold text-[#334155]">{title}</span>
        </div>
        {extra}
      </div>
    </div>
    <div className="p-6">{children}</div>
  </div>
);

const money = (value) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(Number(value || 0));

const generateUploadSessionId = () => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `pc-${Date.now()}`;
};

const normalizeText = (value) =>
  String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

const CATEGORY_PRIORITY_RULES = [
  { key: "cpu", keywords: ["cpu", "vi xu ly", "bo xu ly", "processor"] },
  { key: "main", keywords: ["main", "mainboard", "motherboard", "bo mach chu"] },
  { key: "gpu", keywords: ["gpu", "vga", "card do hoa", "card man hinh", "graphics"] },
  { key: "ram", keywords: ["ram", "bo nho"] },
  { key: "storage", keywords: ["ssd", "hdd", "nvme", "o cung", "storage"] },
  { key: "psu", keywords: ["psu", "nguon", "power supply", "nguon may"] },
  { key: "case", keywords: ["case", "vo may", "thung may"] },
  { key: "cooler", keywords: ["tan nhiet", "cooler", "fan cpu", "heatsink"] },
];

const getCategoryPriority = (category) => {
  const categoryText = normalizeText(`${category?.name || ""} ${category?.description || ""}`);
  const index = CATEGORY_PRIORITY_RULES.findIndex(({ keywords }) =>
    keywords.some((keyword) => categoryText.includes(keyword))
  );
  return index === -1 ? CATEGORY_PRIORITY_RULES.length : index;
};

const sortCategories = (categories = []) =>
  [...categories].sort((left, right) => {
    const priorityDiff = getCategoryPriority(left) - getCategoryPriority(right);
    if (priorityDiff !== 0) return priorityDiff;
    return String(left?.name || "").localeCompare(String(right?.name || ""), "vi");
  });

const getCategoryType = (value) => {
  const text = normalizeText(value);

  if (!text) return null;
  if (text.includes("tan nhiet") || text.includes("cooler") || text.includes("heatsink") || text.includes("fan cpu")) return "cooler";
  if (text.includes("bo mach chu") || text.includes("mainboard") || text.includes("motherboard") || text === "main") return "main";
  if (text.includes("card do hoa") || text.includes("card man hinh") || text.includes("gpu") || text.includes("vga")) return "gpu";
  if (text.includes("ram") || text.includes("bo nho")) return "ram";
  if (text.includes("o cung") || text.includes("ssd") || text.includes("hdd") || text.includes("nvme") || text.includes("storage")) return "storage";
  if (text.includes("nguon may") || text.includes("power supply") || text.includes("psu") || text === "nguon") return "psu";
  if (text.includes("vo may") || text.includes("thung may") || text === "case") return "case";
  if (text.includes("vi xu ly") || text.includes("bo xu ly") || text === "cpu" || text.includes("processor")) return "cpu";

  return null;
};

const buildCategoryKeywords = (category) => {
  const baseKeywords = [category?.name, category?.description].map(normalizeText).filter(Boolean);
  const categoryName = normalizeText(category?.name);

  if (categoryName.includes("o cung")) return [...baseKeywords, "ssd", "hdd", "nvme", "o cung"];
  if (categoryName.includes("vo may")) return [...baseKeywords, "case", "vo may", "thung may"];
  if (categoryName.includes("card do hoa")) return [...baseKeywords, "vga", "gpu", "graphics", "card man hinh"];
  if (categoryName.includes("bo mach chu")) return [...baseKeywords, "mainboard", "motherboard", "main"];
  if (categoryName.includes("nguon may")) return [...baseKeywords, "psu", "power supply", "nguon"];
  if (categoryName.includes("tan nhiet")) return [...baseKeywords, "cooler", "fan cpu", "heatsink"];

  return baseKeywords;
};

const categoryMatch = (category, categoryName) => {
  const categoryType = getCategoryType(`${category?.name || ""} ${category?.description || ""}`);
  const itemCategoryType = getCategoryType(categoryName);

  if (categoryType && itemCategoryType) {
    return categoryType === itemCategoryType;
  }

  return buildCategoryKeywords(category).some((keyword) => normalizeText(categoryName).includes(keyword));
};

export default function PcCreatePage() {
  const navigate = useNavigate();
  const [uploadSessionId] = useState(generateUploadSessionId);
  const [form, setForm] = useState({
    name: "",
    sku: "",
    categoryId: "",
    brandId: "",
    price: 0,
    warrantyMonth: 0,
    status: 0,
    description: "",
    specValues: [],
  });
  const [errors, setErrors] = useState({});
  const [imageFiles, setImageFiles] = useState([]);
  const [componentItems, setComponentItems] = useState([]);
  const [componentSearchInput, setComponentSearchInput] = useState("");
  const [componentSearchTerm, setComponentSearchTerm] = useState("");
  const [componentPage, setComponentPage] = useState(1);
  const [selectedComponentCategoryId, setSelectedComponentCategoryId] = useState("");
  const [compatibilityResult, setCompatibilityResult] = useState(null);
  const [isComponentModalOpen, setIsComponentModalOpen] = useState(false);

  const setField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: null }));
  };

  const { data: categoriesData = [] } = useQuery({
    queryKey: ["categories-all"],
    queryFn: async () => {
      const res = await apiService.get("/category");
      return res?.statusCode === 200 ? res.value?.items || [] : [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: brandsData = [] } = useQuery({
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

  const { data: specsData = [], isLoading: specsLoading } = useQuery({
    queryKey: ["pc-spec-definitions", form.categoryId],
    queryFn: async () => {
      if (!form.categoryId) return [];
      const res = await apiService.get(`/specdefinition/category/${form.categoryId}`);
      return res?.statusCode === 200 ? res.value?.items || [] : [];
    },
    enabled: !!form.categoryId,
    staleTime: 5 * 60 * 1000,
  });

  const { data: componentCategoriesData = [] } = useCustomPcCategories();

  const orderedComponentCategories = useMemo(
    () => sortCategories(componentCategoriesData),
    [componentCategoriesData]
  );

  const selectedComponentCategory = useMemo(
    () =>
      orderedComponentCategories.find((category) => category.id === selectedComponentCategoryId) ||
      null,
    [orderedComponentCategories, selectedComponentCategoryId]
  );

  const {
    data: componentPageData,
    isLoading: componentsLoading,
    refetch: refetchComponents,
  } = useQuery({
    queryKey: ["product-pc-components", selectedComponentCategoryId, componentSearchTerm, componentPage],
    queryFn: async () => {
      const res = await apiService.get("/Product/ui", {
        Page: componentPage,
        PageSize: COMPONENT_PAGE_SIZE,
        Search: componentSearchTerm || undefined,
        CategoryId: selectedComponentCategoryId || undefined,
      });

      if (res?.statusCode !== 200) {
        throw new Error(res?.message || "Không thể tải danh sách linh kiện");
      }

      return res.value || { items: [], totalPages: 1, totalCount: 0, pageNumber: 1 };
    },
    enabled: isComponentModalOpen,
    placeholderData: (previousValue) => previousValue,
  });

  const componentProducts = useMemo(() => {
    const normalized = (componentPageData?.items || [])
      .map(productPcService.normalizeProductPcComponent)
      .filter(Boolean);

    if (selectedComponentCategory) return normalized;

    return normalized.filter((product) =>
      orderedComponentCategories.some((category) => categoryMatch(category, product.categoryName))
    );
  }, [componentPageData, orderedComponentCategories, selectedComponentCategory]);

  useEffect(() => {
    if (form.categoryId) {
      setForm((prev) => ({ ...prev, specValues: [] }));
    }
  }, [form.categoryId]);

  useEffect(() => {
    setCompatibilityResult(null);
  }, [componentItems]);

  const updateSpecValue = (specDefinitionId, value) => {
    setForm((prev) => {
      const existing = prev.specValues.find((spec) => spec.specDefinitionId === specDefinitionId);
      if (existing) {
        return {
          ...prev,
          specValues: prev.specValues.map((spec) =>
            spec.specDefinitionId === specDefinitionId ? { ...spec, value } : spec
          ),
        };
      }

      return {
        ...prev,
        specValues: [...prev.specValues, { specDefinitionId, value }],
      };
    });
  };

  const getSpecValue = (specDefinitionId) =>
    form.specValues.find((spec) => spec.specDefinitionId === specDefinitionId)?.value || "";

  const handleImageChange = (event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    const validation = validateImageFiles(files);
    if (!validation.valid) {
      (validation.errors || []).forEach((error) => toast.error(error));
      event.target.value = "";
      return;
    }

    setImageFiles((prev) => [...prev, ...files]);
    event.target.value = "";
  };

  const handleRemovePendingImage = (index) => {
    setImageFiles((prev) => prev.filter((_, itemIndex) => itemIndex !== index));
  };

  const openComponentModal = () => {
    setIsComponentModalOpen(true);
    if (!selectedComponentCategoryId && orderedComponentCategories[0]?.id) {
      setSelectedComponentCategoryId(orderedComponentCategories[0].id);
    }
  };

  const closeComponentModal = () => {
    setIsComponentModalOpen(false);
  };

  const handleComponentSearch = () => {
    setComponentPage(1);
    setComponentSearchTerm(componentSearchInput.trim());
  };

  const addComponent = (product) => {
    setComponentItems((prev) => {
      const existing = prev.find((item) => item.componentProductId === product.id);
      if (existing) {
        return prev.map((item) =>
          item.componentProductId === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }

      return [
        ...prev,
        {
          componentProductId: product.id,
          quantity: 1,
          product,
        },
      ];
    });
    setErrors((prev) => ({ ...prev, components: null }));
    toast.success("Đã thêm linh kiện vào cấu hình");
  };

  const updateComponentQuantity = (componentProductId, nextQuantity) => {
    if (nextQuantity < 1) return;
    setComponentItems((prev) =>
      prev.map((item) =>
        item.componentProductId === componentProductId ? { ...item, quantity: nextQuantity } : item
      )
    );
  };

  const removeComponent = (componentProductId) => {
    setComponentItems((prev) => prev.filter((item) => item.componentProductId !== componentProductId));
  };

  const totalComponentQuantity = useMemo(
    () => componentItems.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0),
    [componentItems]
  );

  const totalComponentPrice = useMemo(
    () =>
      componentItems.reduce(
        (sum, item) => sum + (Number(item.product?.price || 0) || 0) * (Number(item.quantity) || 0),
        0
      ),
    [componentItems]
  );

  const imagePreviews = useMemo(
    () =>
      imageFiles.map((file) => ({
        key: `${file.name}-${file.size}-${file.lastModified}`,
        file,
        url: URL.createObjectURL(file),
      })),
    [imageFiles]
  );

  useEffect(() => {
    return () => {
      imagePreviews.forEach((item) => URL.revokeObjectURL(item.url));
    };
  }, [imagePreviews]);

  const priceGap = Number(form.price || 0) - totalComponentPrice;

  const validate = () => {
    const nextErrors = {};

    if (!form.name?.trim()) nextErrors.name = "Tên sản phẩm là bắt buộc";
    if (!form.sku?.trim()) nextErrors.sku = "SKU là bắt buộc";
    if (!form.categoryId) nextErrors.categoryId = "Vui lòng chọn danh mục";
    if (!form.brandId) nextErrors.brandId = "Vui lòng chọn thương hiệu";
    if (Number(form.price) <= 0) nextErrors.price = "Giá phải lớn hơn 0";
    if (Number(form.warrantyMonth) < 0) nextErrors.warrantyMonth = "Bảo hành không hợp lệ";
    if (!componentItems.length) nextErrors.components = "Cần thêm ít nhất 1 linh kiện";

    componentItems.forEach((item) => {
      if (Number(item.quantity) < 1) {
        nextErrors.components = "Số lượng linh kiện phải lớn hơn 0";
      }
    });

    specsData.forEach((spec) => {
      if (spec.isRequired && !getSpecValue(spec.id)?.trim()) {
        nextErrors[`spec_${spec.id}`] = `${spec.name} là bắt buộc`;
      }
    });

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const compatibilityMutation = useMutation({
    mutationFn: async () => {
      const schema = componentItems.map((item) => ({
        productId: item.componentProductId,
        quantity: Number(item.quantity) || 0,
      }));

      const response = await productPcService.checkProductPcCompatibility({ schema });
      if (!response.succeeded && !response.message) {
        throw new Error("Không thể kiểm tra độ tương thích");
      }
      return response;
    },
    onSuccess: (response) => {
      const isCompatible = response.succeeded;
      setCompatibilityResult({
        type: isCompatible ? "success" : "error",
        message:
          response.message || (isCompatible ? "Cấu hình tương thích" : "Cấu hình chưa tương thích"),
      });

      if (isCompatible) {
        toast.success("Kiểm tra tương thích thành công");
      } else {
        toast.error(response.message || "Cấu hình chưa tương thích");
      }
    },
    onError: (error) => {
      setCompatibilityResult({
        type: "error",
        message: error?.message || "Không thể kiểm tra độ tương thích",
      });
      toast.error(error?.message || "Không thể kiểm tra độ tương thích");
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      let uploadedUrls = [];

      if (imageFiles.length) {
        uploadedUrls = await uploadProductImages({
          files: imageFiles,
          productId: uploadSessionId,
        });
      }

      const payload = {
        name: form.name.trim(),
        sku: form.sku.trim(),
        categoryId: form.categoryId,
        brandId: form.brandId,
        price: Number(form.price),
        warrantyMonth: Number(form.warrantyMonth),
        status: Number(form.status),
        description: form.description.trim(),
        images: uploadedUrls,
        specValues: form.specValues.filter((spec) => spec.value?.trim()),
        components: componentItems.map((item) => ({
          componentProductId: item.componentProductId,
          quantity: Number(item.quantity),
        })),
      };

      const response = await productPcService.createProductPc(payload);
      if (!response.succeeded || !response.value) {
        throw new Error(response.message || "Tạo PC thất bại");
      }

      return response.value;
    },
    onSuccess: (product) => {
      toast.success("Tạo PC thành công");
      navigate(`/admin/products/${product.id}`);
    },
    onError: (error) => {
      toast.error(error?.message || "Tạo PC thất bại");
    },
  });

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!validate()) {
      toast.error("Vui lòng kiểm tra lại thông tin");
      return;
    }
    createMutation.mutate();
  };

  const isSubmitting = createMutation.isPending;
  const isBusy = isSubmitting || compatibilityMutation.isPending;

  return (
    <div className="font-[var(--font-inter)]">
      <div className="flex items-center justify-between">
        <Breadcrumb
          items={[
            { label: "Trang chủ", href: "/admin" },
            { label: "Quản lý sản phẩm", href: "/admin/products" },
            { label: "Tạo PC" },
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

      <div className="mt-3 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#334155]">Tạo sản phẩm PC</h1>
          <p className="mt-1 text-sm text-slate-500">
            Dựng sẵn một bộ PC hoàn chỉnh từ linh kiện, hình ảnh và thông số kỹ thuật.
          </p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm">
          <div className="font-semibold text-slate-800">Tóm tắt nhanh</div>
          <div className="mt-1">Linh kiện: {totalComponentQuantity}</div>
          <div>Ảnh chờ upload: {imageFiles.length}</div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-4 space-y-6">
        <Section title="Thông tin cơ bản" icon={FiInfo}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Tên sản phẩm" error={errors.name} required>
              <div className="relative">
                <FiPackage className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="text"
                  value={form.name}
                  onChange={(event) => setField("name", event.target.value)}
                  className={`${inputClass} pl-10`}
                  placeholder="VD: PC Gaming RTX 4060 Ryzen 5"
                />
              </div>
            </Field>

            <Field label="SKU" error={errors.sku} required>
              <div className="relative">
                <FiTag className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="text"
                  value={form.sku}
                  onChange={(event) => setField("sku", event.target.value)}
                  className={`${inputClass} pl-10`}
                  placeholder="VD: PC-GAMING-4060-R5"
                />
              </div>
            </Field>

            <Field label="Danh mục" error={errors.categoryId} required>
              <CategorySelect
                value={form.categoryId}
                onChange={(id) => setField("categoryId", id)}
                categories={categoriesData}
                placeholder="Chọn danh mục sản phẩm PC"
              />
            </Field>

            <Field label="Thương hiệu" error={errors.brandId} required>
              <BrandSelect
                value={form.brandId}
                onChange={(id) => setField("brandId", id)}
                brands={brandsData}
                placeholder="Chọn thương hiệu"
              />
            </Field>

            <Field label="Trạng thái">
              <select
                value={form.status}
                onChange={(event) => setField("status", event.target.value)}
                className={inputClass}
              >
                <option value={0}>Available</option>
                <option value={1}>Unavailable</option>
              </select>
            </Field>

            <Field label="Giá bán (VND)" error={errors.price} required>
              <div className="relative">
                <FiDollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={form.price}
                  onChange={(event) => setField("price", event.target.value)}
                  className={`${inputClass} pl-10`}
                  placeholder="VD: 19990000"
                />
              </div>
            </Field>

            <Field label="Bảo hành (tháng)" error={errors.warrantyMonth}>
              <input
                type="number"
                min="0"
                value={form.warrantyMonth}
                onChange={(event) => setField("warrantyMonth", event.target.value)}
                className={inputClass}
                placeholder="VD: 24"
              />
            </Field>

            <div className="md:col-span-2">
              <Field label="Mô tả">
                <textarea
                  value={form.description}
                  onChange={(event) => setField("description", event.target.value)}
                  className={`${inputClass} h-28 resize-none`}
                  placeholder="Mô tả tổng quan về cấu hình, đối tượng phù hợp, ưu điểm..."
                />
              </Field>
            </div>
          </div>
        </Section>

        <Section
          title="Hình ảnh"
          icon={FiImage}
          extra={<span className="text-xs text-slate-500">{imageFiles.length} ảnh đang chờ upload</span>}
        >
          <div className="space-y-4">
            <label className="block">
              <input
                type="file"
                multiple
                accept="image/jpeg,image/png,image/jpg,image/webp"
                onChange={handleImageChange}
                disabled={isSubmitting}
                className="hidden"
              />
              <div
                className={`flex h-28 w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed transition-all ${
                  isSubmitting
                    ? "cursor-not-allowed border-slate-200 bg-slate-50"
                    : "cursor-pointer border-slate-300 bg-slate-50 hover:border-blue-400 hover:bg-blue-50"
                }`}
              >
                <FiUpload size={24} className={isSubmitting ? "text-slate-400" : "text-slate-500"} />
                <span className="text-sm font-medium text-slate-600">Click để thêm nhiều hình ảnh</span>
                <span className="text-xs text-slate-500">JPG, PNG, WebP - tối đa 5MB mỗi ảnh</span>
              </div>
            </label>

            {imagePreviews.length ? (
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
                {imagePreviews.map(({ file, key, url }, index) => (
                  <div
                    key={`${key}-${index}`}
                    className="overflow-hidden rounded-lg border border-slate-200 bg-white"
                  >
                    <div className="aspect-square bg-slate-100">
                      <img
                        src={url}
                        alt={file.name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="space-y-2 p-3">
                      <div className="truncate text-xs font-medium text-slate-700">{file.name}</div>
                      <button
                        type="button"
                        onClick={() => handleRemovePendingImage(index)}
                        disabled={isSubmitting}
                        className="inline-flex items-center gap-1 text-xs font-medium text-red-500 hover:text-red-600 disabled:opacity-50"
                      >
                        <FiTrash2 size={12} />
                        Xóa ảnh
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                Chưa có hình ảnh nào. Bạn có thể upload trước khi tạo PC.
              </div>
            )}
          </div>
        </Section>

        {form.categoryId ? (
          <Section title="Thông số kỹ thuật" icon={FiCpu}>
            {specsLoading ? (
              <div className="py-8 text-center text-sm text-slate-500">Đang tải thông số kỹ thuật...</div>
            ) : specsData.length ? (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {specsData.map((spec) => {
                  const inputType =
                    spec.acceptValueType === "Number" || spec.acceptValueType === "Decimal"
                      ? "number"
                      : "text";
                  const step = spec.acceptValueType === "Decimal" ? "0.1" : "1";

                  return (
                    <Field
                      key={spec.id}
                      label={spec.name}
                      error={errors[`spec_${spec.id}`]}
                      required={spec.isRequired}
                      hint={spec.description || ""}
                    >
                      <div className="relative">
                        <FiCpu className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                          type={inputType}
                          step={inputType === "number" ? step : undefined}
                          value={getSpecValue(spec.id)}
                          onChange={(event) => updateSpecValue(spec.id, event.target.value)}
                          className={`${inputClass} pl-10 ${spec.unit ? "pr-16" : ""}`}
                          placeholder={spec.name}
                        />
                        {spec.unit ? (
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 rounded bg-slate-50 px-2 py-1 text-xs text-slate-500">
                            {spec.unit}
                          </span>
                        ) : null}
                      </div>
                    </Field>
                  );
                })}
              </div>
            ) : (
              <div className="py-8 text-center">
                <FiCpu size={48} className="mx-auto mb-4 text-slate-300" />
                <p className="text-sm text-slate-500">Danh mục này chưa có thông số kỹ thuật được định nghĩa.</p>
              </div>
            )}
          </Section>
        ) : null}

        <Section
          title="Linh kiện cấu hình"
          icon={FiPackage}
          extra={
            <button
              type="button"
              onClick={openComponentModal}
              className="inline-flex items-center gap-2 rounded bg-[#0090D0] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#0077B0]"
            >
              <FiPlus size={14} />
              Thêm linh kiện
            </button>
          }
        >
          <div className="space-y-4">
            {errors.components ? (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {errors.components}
              </div>
            ) : null}

            {componentItems.length ? (
              <div className="space-y-3">
                {componentItems.map((item) => {
                  const product = item.product || {};
                  const itemTotal = (Number(product.price) || 0) * (Number(item.quantity) || 0);

                  return (
                    <div
                      key={item.componentProductId}
                      className="flex flex-col gap-4 rounded-xl border border-slate-200 p-4 lg:flex-row lg:items-center lg:justify-between"
                    >
                      <div className="flex min-w-0 gap-4">
                        <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
                          {product.firstImageUrl ? (
                            <img
                              src={product.firstImageUrl}
                              alt={product.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center">
                              <FiPackage size={22} className="text-slate-300" />
                            </div>
                          )}
                        </div>

                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="truncate text-base font-semibold text-slate-900">{product.name}</p>
                            <a
                              href={`/products/${product.id}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-xs font-medium text-[#0090D0] hover:underline"
                            >
                              Xem nhanh
                              <FiExternalLink size={12} />
                            </a>
                          </div>
                          <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500">
                            <span>{product.categoryName || "Linh kiện"}</span>
                            <span>Giá: {money(product.price)}</span>
                            <span>BH: {product.warrantyMonth || 0} tháng</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-3">
                        <div className="inline-flex items-center rounded-lg border border-slate-300">
                          <button
                            type="button"
                            onClick={() => updateComponentQuantity(item.componentProductId, item.quantity - 1)}
                            className="inline-flex h-10 w-10 items-center justify-center text-slate-700 hover:bg-slate-50"
                          >
                            <FiChevronLeft size={16} />
                          </button>
                          <div className="inline-flex h-10 min-w-14 items-center justify-center border-x border-slate-300 px-3 text-sm font-semibold text-slate-900">
                            {item.quantity}
                          </div>
                          <button
                            type="button"
                            onClick={() => updateComponentQuantity(item.componentProductId, item.quantity + 1)}
                            className="inline-flex h-10 w-10 items-center justify-center text-slate-700 hover:bg-slate-50"
                          >
                            <FiChevronRight size={16} />
                          </button>
                        </div>

                        <div className="min-w-32 text-right text-sm">
                          <div className="font-semibold text-[#0090D0]">{money(itemTotal)}</div>
                          <div className="text-slate-400">Tổng dòng</div>
                        </div>

                        <button
                          type="button"
                          onClick={() => removeComponent(item.componentProductId)}
                          className="inline-flex h-10 items-center gap-2 rounded-lg border border-red-200 px-3 text-sm font-medium text-red-500 hover:bg-red-50"
                        >
                          <FiTrash2 size={14} />
                          Xóa
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                <FiPackage size={36} className="mx-auto mb-3 text-slate-300" />
                <p className="text-sm font-semibold text-slate-700">Chưa có linh kiện nào trong cấu hình</p>
                <p className="mt-1 text-sm text-slate-500">Thêm CPU, RAM, SSD, VGA... để tạo bộ PC hoàn chỉnh.</p>
                <button
                  type="button"
                  onClick={openComponentModal}
                  className="mt-4 inline-flex items-center gap-2 rounded bg-[#0090D0] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0077B0]"
                >
                  <FiPlus size={16} />
                  Chọn linh kiện
                </button>
              </div>
            )}
          </div>
        </Section>

        <Section
          title="Tổng hợp và kiểm tra"
          icon={FiShield}
          extra={
            <button
              type="button"
              onClick={() => compatibilityMutation.mutate()}
              disabled={!componentItems.length || isBusy}
              className="inline-flex items-center gap-2 rounded border border-[#0090D0] px-3 py-1.5 text-xs font-semibold text-[#0090D0] hover:bg-[#0090D0]/5 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {compatibilityMutation.isPending ? <FiLoader className="animate-spin" size={14} /> : <FiShield size={14} />}
              Kiểm tra tương thích
            </button>
          }
        >
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-sm text-slate-500">Tổng số linh kiện</div>
              <div className="mt-2 text-2xl font-semibold text-slate-900">{totalComponentQuantity}</div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-sm text-slate-500">Tổng giá linh kiện</div>
              <div className="mt-2 text-2xl font-semibold text-slate-900">{money(totalComponentPrice)}</div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-sm text-slate-500">Chênh lệch với giá bán</div>
              <div className={`mt-2 text-2xl font-semibold ${priceGap >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                {priceGap >= 0 ? "+" : "-"}
                {money(Math.abs(priceGap))}
              </div>
            </div>
          </div>

          {compatibilityResult ? (
            <div
              className={`mt-4 flex items-start gap-3 rounded-lg border px-4 py-3 text-sm ${
                compatibilityResult.type === "success"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-red-200 bg-red-50 text-red-600"
              }`}
            >
              {compatibilityResult.type === "success" ? (
                <FiCheckCircle size={18} className="mt-0.5 shrink-0" />
              ) : (
                <FiAlertCircle size={18} className="mt-0.5 shrink-0" />
              )}
              <div>{compatibilityResult.message}</div>
            </div>
          ) : (
            <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
              Chưa kiểm tra tương thích. Sau khi chọn linh kiện, bạn có thể kiểm tra trước khi lưu.
            </div>
          )}
        </Section>

        <div className="flex items-center justify-between pt-2">
          <div className="text-xs text-slate-500">
            <span className="text-red-500">*</span> Trường bắt buộc
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => navigate("/admin/products")}
              disabled={isSubmitting}
              className="h-10 rounded border border-slate-300 px-6 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
              Hủy
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex h-10 items-center gap-2 rounded bg-[#6e846f] px-6 text-sm font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? <FiLoader className="animate-spin" size={16} /> : null}
              {isSubmitting ? "Đang tạo PC..." : "Tạo sản phẩm PC"}
            </button>
          </div>
        </div>
      </form>

      {isComponentModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="flex max-h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex flex-col gap-3 bg-[#0090D0] px-5 py-4 text-white lg:flex-row lg:items-center">
              <div>
                <h2 className="text-2xl font-bold">Chọn linh kiện</h2>
                <p className="text-sm text-white/80">Tìm nhanh và thêm nhiều linh kiện vào cấu hình PC.</p>
              </div>

              <div className="relative flex-1">
                <FiSearch size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  value={componentSearchInput}
                  onChange={(event) => setComponentSearchInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      handleComponentSearch();
                    }
                  }}
                  placeholder="Tìm theo tên sản phẩm, SKU..."
                  className="h-11 w-full rounded-lg bg-white pl-10 pr-4 text-sm text-slate-900 outline-none"
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleComponentSearch}
                  className="inline-flex h-10 items-center gap-2 rounded-lg border border-white/25 px-4 text-sm font-semibold text-white hover:bg-white/10"
                >
                  <FiSearch size={16} />
                  Tìm
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setComponentSearchInput("");
                    setComponentSearchTerm("");
                    setComponentPage(1);
                    refetchComponents();
                  }}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/25 text-white hover:bg-white/10"
                >
                  <FiRefreshCcw size={16} />
                </button>
                <button
                  type="button"
                  onClick={closeComponentModal}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/25 text-white hover:bg-white/10"
                >
                  <FiX size={18} />
                </button>
              </div>
            </div>

            <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[280px_minmax(0,1fr)]">
              <aside className="border-r border-slate-200 bg-slate-50 p-5">
                <h3 className="text-sm font-bold uppercase tracking-wide text-slate-700">Danh mục linh kiện</h3>
                <div className="mt-4 space-y-2 overflow-y-auto">
                  {orderedComponentCategories.map((category) => {
                    const isActive = selectedComponentCategoryId === category.id;
                    return (
                      <button
                        key={category.id}
                        type="button"
                        onClick={() => {
                          setSelectedComponentCategoryId(category.id);
                          setComponentPage(1);
                        }}
                        className={`flex w-full items-start gap-3 rounded-xl border px-3 py-3 text-left transition ${
                          isActive
                            ? "border-[#0090D0] bg-[#0090D0]/10 text-[#0077B0]"
                            : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                        }`}
                      >
                        <FiFolder size={16} className="mt-0.5 shrink-0" />
                        <div className="min-w-0">
                          <div className="truncate text-sm font-semibold">{category.name}</div>
                          {category.description ? (
                            <div className="mt-1 line-clamp-2 text-xs text-slate-500">{category.description}</div>
                          ) : null}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </aside>

              <div className="flex min-h-0 flex-col">
                <div className="border-b border-slate-200 px-5 py-4 text-sm text-slate-600">
                  Đang hiển thị linh kiện cho{" "}
                  <span className="font-semibold text-slate-900">
                    {selectedComponentCategory?.name || "tất cả nhóm linh kiện"}
                  </span>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto p-5">
                  {componentsLoading ? (
                    <div className="space-y-4">
                      {Array.from({ length: 4 }).map((_, index) => (
                        <div key={index} className="animate-pulse rounded-xl border border-slate-200 p-4">
                          <div className="flex gap-4">
                            <div className="h-24 w-24 rounded bg-slate-200" />
                            <div className="flex-1 space-y-3">
                              <div className="h-4 w-1/2 rounded bg-slate-200" />
                              <div className="h-3 w-1/3 rounded bg-slate-200" />
                              <div className="h-10 w-40 rounded bg-slate-200" />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : !componentProducts.length ? (
                    <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                      <p className="text-sm font-semibold text-slate-700">Không tìm thấy linh kiện phù hợp</p>
                      <p className="mt-1 text-sm text-slate-500">Hãy thử từ khóa khác hoặc chuyển sang danh mục khác.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {componentProducts.map((product) => {
                        const stock =
                          product.stockQty === null || product.stockQty === undefined
                            ? null
                            : Math.max(Number(product.stockQty || 0), 0);
                        const isOutOfStock = stock !== null && stock === 0;
                        const isDisabled = product.status === "Unavailable" || isOutOfStock;
                        const existingQuantity =
                          componentItems.find((item) => item.componentProductId === product.id)?.quantity || 0;

                        return (
                          <div
                            key={product.id}
                            className="flex flex-col gap-4 rounded-xl border border-slate-200 p-4 md:flex-row md:items-center md:justify-between"
                          >
                            <div className="flex min-w-0 gap-4">
                              <div className="h-24 w-24 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
                                {product.firstImageUrl ? (
                                  <img
                                    src={product.firstImageUrl}
                                    alt={product.name}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <div className="flex h-full w-full items-center justify-center">
                                    <FiPackage size={28} className="text-slate-300" />
                                  </div>
                                )}
                              </div>

                              <div className="min-w-0">
                                <p className="text-lg font-semibold text-slate-900">{product.name}</p>
                                <p className="mt-1 text-sm text-slate-500">{product.categoryName || "Linh kiện"}</p>
                                <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm">
                                  <span className="text-slate-600">
                                    Kho hàng: {stock === null ? "Không rõ" : stock > 0 ? `Còn ${stock}` : "Hết hàng"}
                                  </span>
                                  <span className="font-semibold text-[#0090D0]">{money(product.price)}</span>
                                  {existingQuantity ? (
                                    <span className="text-emerald-600">Đã thêm: {existingQuantity}</span>
                                  ) : null}
                                </div>
                              </div>
                            </div>

                            <button
                              type="button"
                              disabled={isDisabled}
                              onClick={() => addComponent(product)}
                              className="inline-flex h-11 shrink-0 items-center justify-center rounded-lg bg-[#0090D0] px-5 text-sm font-semibold text-white hover:bg-[#0077B0] disabled:cursor-not-allowed disabled:bg-slate-300"
                            >
                              {isOutOfStock ? "Hết hàng" : "Thêm vào cấu hình"}
                            </button>
                          </div>
                        );
                      })}

                      <div className="flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-sm text-slate-600">
                          Trang {componentPageData?.pageNumber || componentPage}/{componentPageData?.totalPages || 1}
                          {" "}• Tổng {componentPageData?.totalCount || 0} sản phẩm
                        </p>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            disabled={!componentPageData?.hasPreviousPage}
                            onClick={() => setComponentPage((prev) => Math.max(1, prev - 1))}
                            className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-300 px-4 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            Trang trước
                          </button>
                          <button
                            type="button"
                            disabled={!componentPageData?.hasNextPage}
                            onClick={() => setComponentPage((prev) => prev + 1)}
                            className="inline-flex h-10 items-center justify-center rounded-lg bg-[#0090D0] px-4 text-sm font-semibold text-white hover:bg-[#0077B0] disabled:cursor-not-allowed disabled:bg-slate-300"
                          >
                            Trang sau
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
