import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  AlertCircle,
  CheckCircle2,
  Cpu,
  ExternalLink,
  Loader2,
  Minus,
  Package,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  ShoppingCart,
  Trash2,
  X,
} from "lucide-react";
import { useDispatch } from "react-redux";
import { toast } from "sonner";
import { apiService } from "../../config/axios";
import useCartAccess from "../../hooks/useCartAccess";
import { customPcService } from "../../services/customPcService";
import { addCartItem } from "../../store/slices/cartSlice";
import { CART_ACCESS_DENIED_MESSAGE } from "../../utils/cartAccess";
import { getCustomPcGuestSessionId, getOrCreateCustomPcGuestSessionId } from "../../utils/customPcSession";

const PAGE_SIZE = 12;
const CUSTOM_PC_PARENT_ID = "ea7f1e64-8abf-49fe-a38f-f75528a1f832";

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

const normalizeText = (value) =>
  String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

const money = (value) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(Number(value || 0));

const dateText = (value) => {
  if (!value) return "--";

  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) return "--";

  return new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium", timeStyle: "short" }).format(parsedDate);
};

const normalizeProduct = (product) =>
  product
    ? {
        id: product.id ?? product.productId ?? "",
        name: product.name ?? product.productName ?? "Sản phẩm chưa có tên",
        price: Number(product.price ?? product.unitPrice ?? 0) || 0,
        firstImageUrl: product.firstImageUrl ?? product.thumbnailUrl?.[0] ?? product.thumbnailUrl ?? product.imageUrl ?? "",
        categoryName: product.categoryName ?? product.category?.name ?? "Linh kiện khác",
        categoryId: product.categoryId ?? product.category?.id ?? null,
        stockQty:
          product.stock === null || product.stock === undefined ? null : Math.max(Number(product.stock) || 0, 0),
        status: product.status ?? "Available",
        warrantyMonth: Number(product.warrantyMonth ?? 0) || 0,
      }
    : null;

const enrichBuildItems = async (build) => {
  if (!build) return null;

  const enrichedItems = await Promise.all(
    (build.items || []).map(async (item) => {
      if (!item?.productId) return item;

      const response = await apiService.get(`/product/${item.productId}`);
      if (response?.statusCode !== 200 || !response?.value) {
        return item;
      }

      const productDetail = normalizeProduct(response.value);

      return {
        ...item,
        product: {
          ...(item.product || {}),
          ...productDetail,
          id: productDetail?.id || item.productId,
          name: productDetail?.name || item.productName || item.product?.name,
          price: productDetail?.price ?? item.unitPrice ?? item.price ?? 0,
          firstImageUrl: productDetail?.firstImageUrl || item.firstImageUrl || item.product?.firstImageUrl || "",
          categoryName: productDetail?.categoryName || item.product?.categoryName || "Linh kiện khác",
          categoryId: productDetail?.categoryId || item.categoryId || item.product?.categoryId || null,
          warrantyMonth: productDetail?.warrantyMonth || item.warrantyMonth || item.product?.warrantyMonth || 0,
          status: productDetail?.status || item.product?.status || "Available",
          stockQty:
            productDetail?.stockQty === null || productDetail?.stockQty === undefined
              ? item.product?.stockQty ?? null
              : productDetail.stockQty,
        },
      };
    })
  );

  return {
    ...build,
    items: enrichedItems,
  };
};

const total = (build) =>
  Number(build?.totalPrice) > 0
    ? Number(build.totalPrice)
    : (build?.items || []).reduce(
        (sum, item) =>
          sum +
          (Number(item?.unitPrice ?? item?.price ?? item?.product?.price ?? 0) || 0) *
            (Number(item?.quantity ?? 0) || 0),
        0
      );

const countItems = (build) => (build?.items || []).reduce((sum, item) => sum + (Number(item?.quantity ?? 0) || 0), 0);

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

const categoryMatch = (category, categoryName) => {
  const categoryType = getCategoryType(`${category?.name || ""} ${category?.description || ""}`);
  const itemCategoryType = getCategoryType(categoryName);

  if (categoryType && itemCategoryType) {
    return categoryType === itemCategoryType;
  }

  return buildCategoryKeywords(category).some((keyword) => normalizeText(categoryName).includes(keyword));
};

const getCategoryPriority = (category) => {
  const categoryText = normalizeText(`${category?.name || ""} ${category?.description || ""}`);
  const index = CATEGORY_PRIORITY_RULES.findIndex(({ keywords }) => keywords.some((keyword) => categoryText.includes(keyword)));
  return index === -1 ? CATEGORY_PRIORITY_RULES.length : index;
};

const sortCategories = (categories = []) =>
  [...categories].sort((left, right) => {
    const priorityDiff = getCategoryPriority(left) - getCategoryPriority(right);
    if (priorityDiff !== 0) return priorityDiff;
    return String(left?.name || "").localeCompare(String(right?.name || ""), "vi");
  });

const sortProducts = (items, sort) => {
  const nextItems = [...items];

  if (sort === "price-asc") nextItems.sort((left, right) => left.price - right.price);
  if (sort === "price-desc") nextItems.sort((left, right) => right.price - left.price);
  if (sort === "name-asc") nextItems.sort((left, right) => String(left.name || "").localeCompare(String(right.name || ""), "vi"));

  return nextItems;
};

const groupItemsByCategory = (items = [], categories = []) => {
  const pool = items.map((item) => ({ item, used: false }));
  const grouped = {};

  categories.forEach((category) => {
    grouped[category.id] = [];

    pool.forEach((entry) => {
      if (entry.used) return;

      const matchesCategory =
        entry.item?.categoryId === category.id ||
        entry.item?.product?.categoryId === category.id ||
        categoryMatch(category, entry.item?.product?.categoryName || entry.item?.productName || "");

      if (matchesCategory) {
        grouped[category.id].push(entry.item);
        entry.used = true;
      }
    });
  });

  return {
    grouped,
    extras: pool.filter((entry) => !entry.used).map((entry) => entry.item),
  };
};

export default function CustomPcBuilderPage() {
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  const { isAuthenticated, user, loading: authLoading, canUseCart } = useCartAccess();

  const [guestSessionId, setGuestSessionId] = useState(() => (isAuthenticated ? null : getCustomPcGuestSessionId()));
  const [activeBuildId, setActiveBuildId] = useState("");
  const [modalSlot, setModalSlot] = useState(null);
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [sort, setSort] = useState("price-asc");
  const [modalPage, setModalPage] = useState(1);
  const [compatibilityResult, setCompatibilityResult] = useState(null);

  useEffect(() => {
    if (authLoading) return;

    if (isAuthenticated) {
      setGuestSessionId(null);
      return;
    }

    setGuestSessionId((currentValue) => currentValue || getOrCreateCustomPcGuestSessionId());
  }, [authLoading, isAuthenticated]);

  const identityMode = isAuthenticated ? "auth" : "guest";
  const identityValue = isAuthenticated ? user?.id || "authenticated" : guestSessionId || "guest-pending";
  const identityReady = !authLoading && (isAuthenticated || !!guestSessionId);

  const buildsQueryKey = useMemo(() => ["custom-pc-builds", identityMode, identityValue], [identityMode, identityValue]);
  const activeBuildDetailQueryKey = useMemo(
    () => ["custom-pc-build-detail", identityMode, identityValue, activeBuildId],
    [activeBuildId, identityMode, identityValue]
  );

  const { data: builds = [], isLoading: buildsLoading, isError, error, refetch: refetchBuilds } = useQuery({
    enabled: identityReady,
    queryKey: buildsQueryKey,
    queryFn: async () => {
      const response = await customPcService.getCustomPcBuilds();
      if (!response.succeeded) throw new Error(response.message || "Không thể tải danh sách cấu hình");
      return response.value || [];
    },
  });

  useEffect(() => {
    if (!builds.length) {
      setActiveBuildId("");
      setCompatibilityResult(null);
      return;
    }

    if (!builds.some((build) => build.id === activeBuildId)) {
      setActiveBuildId(builds[0].id);
    }
  }, [activeBuildId, builds]);

  const { data: categories = [] } = useQuery({
    queryKey: ["custom-pc-categories"],
    queryFn: async () => {
      const response = await apiService.get("/Category", { ParentId: CUSTOM_PC_PARENT_ID, Page: 1 });
      return response?.statusCode === 200 && Array.isArray(response.value?.items) ? response.value.items : [];
    },
    staleTime: 300000,
  });

  const orderedCategories = useMemo(() => sortCategories(categories), [categories]);
  const selectedCategory = useMemo(
    () => orderedCategories.find((category) => category.id === modalSlot?.id) || null,
    [orderedCategories, modalSlot]
  );
  const activeBuildSummary = useMemo(() => builds.find((build) => build.id === activeBuildId) || null, [activeBuildId, builds]);

  const {
    data: activeBuild,
    isLoading: activeBuildLoading,
    refetch: refetchActiveBuild,
  } = useQuery({
    enabled: identityReady && !!activeBuildId,
    queryKey: activeBuildDetailQueryKey,
    queryFn: async () => {
      const response = await customPcService.getCustomPcBuildDetail(activeBuildId);
      if (!response.succeeded || !response.value) throw new Error(response.message || "Không thể tải chi tiết cấu hình");
      return enrichBuildItems(response.value);
    },
    placeholderData: (previousValue) => previousValue,
  });

  useEffect(() => {
    setCompatibilityResult(null);
  }, [activeBuildId, activeBuild?.updatedAt, activeBuild?.items?.length]);

  const slotState = useMemo(() => groupItemsByCategory(activeBuild?.items || [], orderedCategories), [activeBuild, orderedCategories]);

  const { data: productPage, isLoading: productsLoading, refetch: refetchProducts } = useQuery({
    enabled: !!modalSlot,
    queryKey: ["custom-pc-modal-products", modalSlot?.id, selectedCategory?.id, searchTerm, modalPage],
    queryFn: async () => {
      const response = await apiService.get("/Product/ui", {
        Page: modalPage,
        PageSize: PAGE_SIZE,
        Search: searchTerm || undefined,
        CategoryId: selectedCategory?.id || undefined,
      });

      if (response?.statusCode !== 200) throw new Error(response?.message || "Không thể tải danh sách sản phẩm");
      return response.value || { items: [] };
    },
    placeholderData: (previousValue) => previousValue,
  });

  const modalProducts = useMemo(() => {
    const products = (productPage?.items || []).map(normalizeProduct).filter(Boolean);
    const filteredProducts =
      modalSlot && !selectedCategory?.id ? products.filter((product) => categoryMatch(modalSlot, product.categoryName)) : products;
    return sortProducts(filteredProducts, sort);
  }, [modalSlot, productPage, selectedCategory, sort]);

  const resetModalState = () => {
    setModalSlot(null);
    setSearchInput("");
    setSearchTerm("");
    setSort("price-asc");
    setModalPage(1);
  };

  const clearCompatibilityResult = () => {
    setCompatibilityResult(null);
  };

  const invalidateActiveBuildQueries = (buildId = activeBuildId) => {
    queryClient.invalidateQueries({ queryKey: buildsQueryKey });
    if (buildId) {
      queryClient.invalidateQueries({ queryKey: ["custom-pc-build-detail", identityMode, identityValue, buildId] });
    }
    clearCompatibilityResult();
  };

  const createBuildMutation = useMutation({
    mutationFn: async () => {
      const response = await customPcService.createCustomPcBuild({ name: `Cấu hình ${builds.length + 1}` });
      if (!response.succeeded || !response.value) throw new Error(response.message || "Không thể tạo cấu hình mới");
      return response.value;
    },
    onSuccess: (build) => {
      setGuestSessionId((currentValue) => currentValue || getCustomPcGuestSessionId());
      queryClient.setQueryData(buildsQueryKey, (previousValue = []) => [build, ...previousValue]);
      setActiveBuildId(build.id);
      clearCompatibilityResult();
      queryClient.invalidateQueries({ queryKey: ["custom-pc-build-detail", identityMode, identityValue, build.id] });
      toast.success("Đã tạo cấu hình mới");
    },
    onError: (mutationError) => {
      toast.error(mutationError?.message || "Tạo cấu hình thất bại");
    },
  });

  const deleteBuildMutation = useMutation({
    mutationFn: async (customPcId) => {
      const response = await customPcService.deleteCustomPcBuild(customPcId);
      if (!response.succeeded) throw new Error(response.message || "Không thể xóa cấu hình");
      return customPcId;
    },
    onSuccess: (customPcId) => {
      queryClient.setQueryData(buildsQueryKey, (previousValue = []) => previousValue.filter((build) => build.id !== customPcId));
      queryClient.removeQueries({ queryKey: ["custom-pc-build-detail", identityMode, identityValue, customPcId] });
      clearCompatibilityResult();
      toast.success("Đã xóa cấu hình");
    },
    onError: (mutationError) => {
      toast.error(mutationError?.message || "Xóa cấu hình thất bại");
    },
  });

  const addItemMutation = useMutation({
    mutationFn: async (product) => {
      if (!activeBuildId) throw new Error("Vui lòng tạo hoặc chọn cấu hình trước khi thêm linh kiện");

      const response = await customPcService.addItemToCustomPc(activeBuildId, { productId: product.id, quantity: 1 });
      if (!response.succeeded) throw new Error(response.message || "Không thể thêm sản phẩm vào cấu hình");
      return response.value;
    },
    onSuccess: () => {
      invalidateActiveBuildQueries();
      resetModalState();
      toast.success("Đã thêm linh kiện vào cấu hình");
    },
    onError: (mutationError) => {
      toast.error(mutationError?.message || "Thêm linh kiện thất bại");
    },
  });

  const changeQuantityMutation = useMutation({
    mutationFn: async ({ productId, quantityDelta }) => {
      if (!activeBuildId) throw new Error("Vui lòng chọn cấu hình trước");

      const response = await customPcService.addItemToCustomPc(activeBuildId, { productId, quantity: quantityDelta });
      if (!response.succeeded) throw new Error(response.message || "Không thể cập nhật số lượng");
      return { response: response.value, quantityDelta, productId };
    },
    onSuccess: ({ quantityDelta }) => {
      invalidateActiveBuildQueries();
      toast.success(quantityDelta > 0 ? "Đã tăng số lượng linh kiện" : "Đã giảm số lượng linh kiện");
    },
    onError: (mutationError) => {
      toast.error(mutationError?.message || "Cập nhật số lượng thất bại");
    },
  });

  const checkCompatibilityMutation = useMutation({
    mutationFn: async () => {
      const schema = (activeBuild?.items || [])
        .filter((item) => item?.productId)
        .map((item) => ({
          productId: item.productId,
          quantity: Math.max(Number(item.quantity) || 0, 0),
        }))
        .filter((item) => item.quantity > 0);

      if (!schema.length) {
        throw new Error("Cấu hình hiện tại chưa có linh kiện để kiểm tra");
      }

      return customPcService.checkCompatibility({ schema });
    },
    onSuccess: (response) => {
      const isCompatible = response.statusCode >= 200 && response.statusCode < 300;
      const message = response.message || (isCompatible ? "Cấu hình tương thích" : "Cấu hình chưa tương thích");

      setCompatibilityResult({
        type: isCompatible ? "success" : "error",
        message,
      });
    },
    onError: (mutationError) => {
      setCompatibilityResult({
        type: "error",
        message: mutationError?.message || "Không thể kiểm tra độ tương thích",
      });
    },
  });

  const addBuildToCartMutation = useMutation({
    mutationFn: async () => {
      if (!canUseCart) {
        throw new Error(CART_ACCESS_DENIED_MESSAGE);
      }

      if (!activeBuild?.items?.length) throw new Error("Cấu hình hiện tại chưa có sản phẩm để thêm vào giỏ");

      for (const item of activeBuild.items) {
        const product = item?.product || {};
        if (!item?.productId) continue;

        await dispatch(
          addCartItem({
            productId: item.productId,
            quantity: Math.max(Number(item.quantity) || 1, 1),
            isAuthenticated,
            meta: {
              productName: product.name || item.productName || "Sản phẩm",
              productImage: product.firstImageUrl || item.firstImageUrl || "",
              unitPrice: Number(item.unitPrice ?? product.price ?? 0) || 0,
              availableStock:
                product.stockQty === null || product.stockQty === undefined ? null : Math.max(Number(product.stockQty) || 0, 0),
              productStatus: product.status || "Available",
            },
          })
        ).unwrap();
      }
    },
    onSuccess: () => {
      toast.success("Đã thêm toàn bộ cấu hình vào giỏ hàng");
    },
    onError: (mutationError) => {
      toast.error(mutationError?.message || mutationError || "Không thể thêm cấu hình vào giỏ hàng");
    },
  });

  const handleAddBuildToCart = () => {
    if (!canUseCart) {
      toast.info(CART_ACCESS_DENIED_MESSAGE);
      return;
    }

    addBuildToCartMutation.mutate();
  };

  const openSlot = (slot) => {
    if (!activeBuildSummary) {
      toast.info("Vui lòng tạo hoặc chọn cấu hình trước");
      return;
    }

    setModalSlot(slot);
    setSearchInput("");
    setSearchTerm("");
    setSort("price-asc");
    setModalPage(1);
  };

  const handleRefresh = () => {
    clearCompatibilityResult();
    refetchBuilds();
    refetchActiveBuild();
    refetchProducts();
  };

  if (authLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-10">
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
          <Loader2 size={24} className="mx-auto animate-spin text-[#0090D0]" />
          <p className="mt-3 text-sm text-slate-500">Đang tải dữ liệu Custom PC...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 md:py-8">
      <div className="mb-6">
        <div className="text-sm text-slate-500">
          <Link to="/" className="hover:text-[#0090D0] hover:underline">
            Trang chủ
          </Link>
          <span className="mx-2 text-slate-300">/</span>
          <span>Custom PC Builder</span>
        </div>
        <div className="mt-3 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Tự xây dựng cấu hình PC</h1>
            <p className="mt-2 max-w-3xl text-sm text-slate-500">
              Chọn linh kiện theo từng danh mục và lưu nhiều cấu hình khác nhau. 
            </p>
          </div>
          {activeBuild && (
            <div className="text-right">
              <p className="text-sm text-slate-500">Chi phí dự tính</p>
              <p className="text-3xl font-bold text-[#0090D0]">{money(total(activeBuild))}</p>
            </div>
          )}
        </div>
      </div>

      {isError && (
        <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {error?.message || "Không thể tải danh sách cấu hình."}
        </div>
      )}

      <div className="space-y-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
          <div className="flex flex-wrap items-center gap-2">
            {builds.map((build, index) => (
              <button
                key={build.id}
                type="button"
                onClick={() => setActiveBuildId(build.id)}
                className={`rounded-md px-4 py-3 text-sm font-semibold ${
                  build.id === activeBuildId ? "bg-amber-400 text-white" : "bg-[#0090D0] text-white hover:bg-[#0077B0]"
                }`}
              >
                {build.name || `Cấu hình ${index + 1}`}
              </button>
            ))}
            <button
              type="button"
              onClick={() => createBuildMutation.mutate()}
              disabled={createBuildMutation.isPending}
              className="inline-flex items-center rounded-md border border-dashed border-[#0090D0]/30 px-4 py-3 text-sm font-semibold text-[#0090D0] hover:bg-[#0090D0]/5 disabled:opacity-60"
            >
              {createBuildMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} className="mr-2" />}
              Tạo cấu hình
            </button>
          </div>
        </div>

        {activeBuildSummary && (
          <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="text-sm text-slate-500">
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleRefresh}
                  className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#0090D0] px-4 text-sm font-semibold text-white hover:bg-[#0077B0]"
                >
                  <RefreshCw size={16} />
                  Tải lại
                  </button>
                <button
                  type="button"
                  onClick={() => checkCompatibilityMutation.mutate()}
                  disabled={checkCompatibilityMutation.isPending || !activeBuild?.items?.length}
                  className="inline-flex h-10 items-center gap-2 rounded-lg border border-[#0090D0] px-4 text-sm font-semibold text-[#0090D0] hover:bg-[#0090D0]/5 disabled:cursor-not-allowed disabled:border-slate-300 disabled:text-slate-400"
                >
                  {checkCompatibilityMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />}
                  Kiểm tra tương thích
                </button>
                {canUseCart ? (
                  <button
                    type="button"
                    onClick={handleAddBuildToCart}
                  disabled={addBuildToCartMutation.isPending || !activeBuild?.items?.length}
                  className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#0090D0] px-4 text-sm font-semibold text-white hover:bg-[#0077B0] disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  {addBuildToCartMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <ShoppingCart size={16} />}
                  Thêm tất cả vào giỏ
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm(`Bạn có chắc muốn xóa "${activeBuildSummary.name}"?`)) deleteBuildMutation.mutate(activeBuildSummary.id);
                  }}
                  disabled={deleteBuildMutation.isPending}
                  className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#0090D0] px-4 text-sm font-semibold text-white hover:bg-[#0077B0] disabled:opacity-60"
                >
                  {deleteBuildMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                  Xóa cấu hình
                </button>
              </div>
            </div>

            {compatibilityResult && (
              <div
                className={`mt-3 flex items-start gap-3 rounded-xl border px-4 py-3 text-sm ${
                  compatibilityResult.type === "success"
                    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                    : "border-amber-200 bg-amber-50 text-amber-800"
                }`}
              >
                {compatibilityResult.type === "success" ? <CheckCircle2 size={18} className="mt-0.5 shrink-0" /> : <AlertCircle size={18} className="mt-0.5 shrink-0" />}
                <div>{compatibilityResult.message}</div>
              </div>
            )}
          </div>
        )}
        {!activeBuildSummary && !buildsLoading ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
            <Cpu size={38} className="mx-auto text-slate-300" />
            <h2 className="mt-4 text-xl font-semibold text-slate-900">Chưa có cấu hình nào</h2>
            <p className="mt-2 text-sm text-slate-500">Hãy tạo một cấu hình mới để bắt đầu chọn linh kiện theo từng danh mục.</p>
          </div>
        ) : (
          <>
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center justify-between bg-[#0090D0] px-4 py-3 text-white">
                <div className="font-semibold">Linh kiện cho cấu hình</div>
                {activeBuild && <div className="text-sm text-sky-50">{countItems(activeBuild)} linh kiện • Cập nhật {dateText(activeBuild.updatedAt || activeBuild.createdAt)}</div>}
              </div>

              {buildsLoading || activeBuildLoading ? (
                <div className="space-y-3 p-4">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <div key={index} className="h-20 animate-pulse rounded-xl bg-slate-100" />
                  ))}
                </div>
              ) : (
                orderedCategories.map((category) => {
                  const items = slotState.grouped[category.id] || [];

                  return (
                    <div key={category.id} className="grid grid-cols-1 border-b border-slate-200 last:border-b-0 md:grid-cols-[220px_minmax(0,1fr)]">
                      <div className="bg-slate-50 px-4 py-4 text-sm font-medium text-slate-700">{category.name}</div>
                      <div className="space-y-4 px-4 py-4">
                        {items.length ? (
                          <>
                            {items.map((item, index) => {
                              const product = item?.product || {};
                              const unitPrice = Number(item?.unitPrice ?? item?.price ?? product.price ?? 0) || 0;
                              const quantity = Math.max(Number(item?.quantity ?? 0) || 0, 0);
                              const isPendingThisItem =
                                changeQuantityMutation.isPending &&
                                changeQuantityMutation.variables?.productId === item?.productId;

                              return (
                                <div
                                  key={item.id || `${item.productId}-${index}`}
                                  className="flex flex-col gap-4 rounded-xl border border-slate-200 p-4 lg:flex-row lg:items-start lg:justify-between"
                                >
                                  <div className="flex min-w-0 gap-4">
                                    <div className="h-24 w-24 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-white">
                                      {product.firstImageUrl || item.firstImageUrl ? (
                                        <img
                                          src={product.firstImageUrl || item.firstImageUrl}
                                          alt={product.name || item.productName}
                                          className="h-full w-full object-contain"
                                        />
                                      ) : (
                                        <div className="flex h-full w-full items-center justify-center">
                                          <Package size={24} className="text-slate-300" />
                                        </div>
                                      )}
                                    </div>
                                    <div className="min-w-0">
                                      <p className="text-lg font-semibold text-slate-900">{product.name || item.productName || "Sản phẩm"}</p>
                                      <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-sm text-slate-600">
                                        <span>Danh mục: {product.categoryName || category.name || "Linh kiện khác"}</span>
                                        <span>Bảo hành: {item.warrantyMonth || product.warrantyMonth || 0} tháng</span>
                                      </div>
                                      <div className="mt-3 flex flex-wrap items-center gap-3">
                                        <div className="inline-flex items-center rounded-lg border border-slate-300">
                                          <button
                                            type="button"
                                            onClick={() => changeQuantityMutation.mutate({ productId: item.productId, quantityDelta: -1 })}
                                            disabled={isPendingThisItem || !item?.productId}
                                            className="inline-flex h-10 w-10 items-center justify-center text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                                          >
                                            <Minus size={16} />
                                          </button>
                                          <div className="inline-flex h-10 min-w-16 items-center justify-center border-x border-slate-300 px-3 text-sm font-semibold text-slate-900">
                                            {isPendingThisItem ? <Loader2 size={16} className="animate-spin" /> : quantity}
                                          </div>
                                          <button
                                            type="button"
                                            onClick={() => changeQuantityMutation.mutate({ productId: item.productId, quantityDelta: 1 })}
                                            disabled={isPendingThisItem || !item?.productId}
                                            className="inline-flex h-10 w-10 items-center justify-center text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                                          >
                                            <Plus size={16} />
                                          </button>
                                        </div>
                                        <button
                                          type="button"
                                          onClick={() => openSlot(category)}
                                          className="inline-flex h-10 items-center gap-2 rounded-lg border border-[#0090D0] px-4 text-sm font-semibold text-[#0090D0] hover:bg-[#0090D0]/5"
                                        >
                                          <Search size={16} />
                                          Thêm sản phẩm cùng nhóm
                                        </button>
                                      </div>
                                      <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-sm">
                                        <span className="font-semibold text-slate-700">Đơn giá: {money(unitPrice)}</span>
                                        <span className="font-semibold text-[#0090D0]">Thành tiền: {money(unitPrice * quantity)}</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                            <button
                              type="button"
                              onClick={() => openSlot(category)}
                              className="inline-flex h-11 items-center gap-2 rounded-md border border-dashed border-[#0090D0]/40 px-4 text-sm font-semibold text-[#0090D0] hover:bg-[#0090D0]/5"
                            >
                              <Plus size={16} />
                              Thêm {String(category.name || "").toLowerCase()}
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={() => openSlot(category)}
                            className="inline-flex h-11 items-center gap-2 rounded-md bg-[#0090D0] px-4 text-sm font-semibold text-white hover:bg-[#0077B0]"
                          >
                            <Plus size={16} />
                            {`CHỌN ${String(category.name || "").toUpperCase()}`}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            {!!slotState.extras.length && (
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
                  <Cpu size={16} className="text-[#0090D0]" />
                  <h2 className="text-lg font-semibold text-slate-900">Linh kiện khác</h2>
                </div>
                <div className="mt-4 space-y-3">
                  {slotState.extras.map((item, index) => {
                    const product = item?.product || {};
                    const quantity = Number(item?.quantity ?? 0) || 0;
                    const unitPrice = Number(item?.unitPrice ?? item?.price ?? product?.price ?? 0) || 0;

                    return (
                      <div
                        key={item.id || `${item.productId}-${index}`}
                        className="flex flex-col gap-3 rounded-xl border border-slate-200 p-4 md:flex-row md:items-center md:justify-between"
                      >
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{product.name || item.productName || "Sản phẩm"}</p>
                          <p className="mt-1 text-xs text-slate-500">{product.categoryName || "Linh kiện khác"}</p>
                        </div>
                        <div className="text-sm text-slate-600">
                          SL: {quantity} • {money(unitPrice * quantity)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {!!modalSlot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="flex max-h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex flex-col gap-3 bg-[#0090D0] px-5 py-4 text-white lg:flex-row lg:items-center">
              <h2 className="text-2xl font-bold">Chọn linh kiện</h2>
              <div className="relative flex-1">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      setModalPage(1);
                      setSearchTerm(searchInput.trim());
                    }
                  }}
                  placeholder={`Bạn muốn tìm ${String(modalSlot.name || "").toLowerCase()} nào?`}
                  className="h-11 w-full rounded-lg bg-white pl-10 pr-4 text-sm text-slate-900 outline-none"
                />
              </div>
              <button
                type="button"
                onClick={resetModalState}
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/25 text-white hover:bg-white/10"
              >
                <X size={18} />
              </button>
            </div>

            <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[320px_minmax(0,1fr)]">
              <aside className="border-r border-slate-200 bg-slate-50 p-5">
                <h3 className="text-sm font-bold uppercase tracking-wide text-slate-700">Lọc theo sản phẩm</h3>
                <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#0090D0]">Danh mục đang chọn</p>
                  <p className="mt-2 text-lg font-semibold text-slate-900">{modalSlot.name}</p>
                  <p className="mt-1 text-sm text-slate-500">{selectedCategory?.name || "Hiển thị theo danh mục tương ứng."}</p>
                </div>
                <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
                  Có thể thêm nhiều sản phẩm trong cùng một danh mục. Các sản phẩm sẽ được hiển thị chung trong khung danh mục đó.
                </div>
              </aside>

              <div className="flex min-h-0 flex-col">
                <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 md:flex-row md:items-center md:justify-between">
                  <div className="text-sm text-slate-600">
                    Đang hiển thị linh kiện cho <span className="font-semibold text-slate-900">{modalSlot.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="text-sm text-slate-600">Sắp xếp</label>
                    <select
                      value={sort}
                      onChange={(event) => setSort(event.target.value)}
                      className="h-10 rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-[#0090D0]"
                    >
                      <option value="price-asc">Giá tăng dần</option>
                      <option value="price-desc">Giá giảm dần</option>
                      <option value="name-asc">Tên A-Z</option>
                    </select>
                  </div>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto p-5">
                  {productsLoading ? (
                    <div className="space-y-4">
                      {Array.from({ length: 4 }).map((_, index) => (
                        <div key={index} className="animate-pulse rounded-xl border border-slate-200 p-4">
                          <div className="flex gap-4">
                            <div className="h-24 w-24 rounded bg-slate-200" />
                            <div className="flex-1 space-y-3">
                              <div className="h-4 w-2/3 rounded bg-slate-200" />
                              <div className="h-3 w-1/2 rounded bg-slate-200" />
                              <div className="h-10 w-40 rounded bg-slate-200" />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : !modalProducts.length ? (
                    <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                      <p className="text-sm font-semibold text-slate-700">Không tìm thấy sản phẩm phù hợp</p>
                      <p className="mt-1 text-sm text-slate-500">Hãy thử từ khóa khác hoặc chọn danh mục khác.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {modalProducts.map((product) => {
                        const stock =
                          product.stockQty === null || product.stockQty === undefined ? null : Math.max(Number(product.stockQty ?? 0) || 0, 0);
                        const isOutOfStock = stock !== null && stock === 0;
                        const disabled =
                          product.status === "Unavailable" ||
                          isOutOfStock ||
                          (addItemMutation.isPending && addItemMutation.variables?.id === product.id);

                        return (
                          <div key={product.id} className="flex flex-col gap-4 rounded-xl border border-slate-200 p-4 md:flex-row md:items-center md:justify-between">
                            <div className="flex min-w-0 gap-4">
                              <div className="h-24 w-24 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
                                {product.firstImageUrl ? (
                                  <img src={product.firstImageUrl} alt={product.name} className="h-full w-full object-contain" />
                                ) : (
                                  <div className="flex h-full w-full items-center justify-center">
                                    <Package size={28} className="text-slate-300" />
                                  </div>
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="text-lg font-semibold text-slate-900">{product.name}</p>
                                <p className="mt-1 text-sm text-slate-500">{product.categoryName || "Linh kiện"}</p>
                                <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm">
                                  <span className="text-slate-600">
                                    Kho hàng: {stock === null ? "Không rõ tồn kho" : stock > 0 ? "Còn hàng" : "Hết hàng"}
                                  </span>
                                  <span className="font-semibold text-[#0090D0]">{money(product.price)}</span>
                                </div>
                                <Link to={`/products/${product.id}`} className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-[#0090D0] hover:underline">
                                  Xem chi tiết <ExternalLink size={14} />
                                </Link>
                              </div>
                            </div>
                            <button
                              type="button"
                              disabled={disabled}
                              onClick={() => addItemMutation.mutate(product)}
                              className="inline-flex h-11 shrink-0 items-center justify-center rounded-lg bg-[#0090D0] px-5 text-sm font-semibold text-white hover:bg-[#0077B0] disabled:cursor-not-allowed disabled:bg-slate-300"
                            >
                              {addItemMutation.isPending && addItemMutation.variables?.id === product.id ? <Loader2 size={16} className="animate-spin" /> : "THÊM VÀO CẤU HÌNH"}
                            </button>
                          </div>
                        );
                      })}

                      <div className="flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-sm text-slate-600">
                          Trang {productPage?.pageNumber || modalPage}/{productPage?.totalPages || 1} • Tổng {productPage?.totalCount || 0} sản phẩm
                        </p>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            disabled={!productPage?.hasPreviousPage || productsLoading}
                            onClick={() => setModalPage((previousValue) => Math.max(1, previousValue - 1))}
                            className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-300 px-4 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            Trang trước
                          </button>
                          <button
                            type="button"
                            disabled={!productPage?.hasNextPage || productsLoading}
                            onClick={() => setModalPage((previousValue) => previousValue + 1)}
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
      )}
    </div>
  );
}
