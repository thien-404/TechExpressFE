import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Cpu, ExternalLink, Loader2, Minus, Package, Plus, RefreshCw, Search, ShoppingCart, Trash2, X } from "lucide-react";
import { useDispatch } from "react-redux";
import { toast } from "sonner";
import { apiService } from "../../config/axios";
import { customPcService } from "../../services/customPcService";
import { useAuth } from "../../store/authContext";
import { addCartItem } from "../../store/slices/cartSlice";

const PAGE_SIZE = 12;
const CUSTOM_PC_PARENT_ID = "ea7f1e64-8abf-49fe-a38f-f75528a1f832";

const n = (v) =>
  String(v || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
const money = (v) => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(Number(v || 0));
const dateText = (v) => {
  if (!v) return "--";
  const d = new Date(v);
  return Number.isNaN(d.getTime())
    ? "--"
    : new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium", timeStyle: "short" }).format(d);
};
const normProduct = (p) =>
  p
    ? {
        id: p.id ?? p.productId ?? "",
        name: p.name ?? p.productName ?? "Sản phẩm chưa có tên",
        price: Number(p.price ?? p.unitPrice ?? 0) || 0,
        firstImageUrl: p.firstImageUrl ?? p.thumbnailUrl?.[0] ?? p.imageUrl ?? "",
        categoryName: p.categoryName ?? p.category?.name ?? "Linh kiện khác",
        stockQty: Number(p.stockQty ?? p.stock ?? 0) || 0,
        status: p.status ?? "Available",
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

      const enrichedProduct = normProduct(response.value);
      return {
        ...item,
        product: {
          ...(item.product || {}),
          ...enrichedProduct,
          name: enrichedProduct?.name || item.productName || item.product?.name,
          price: enrichedProduct?.price ?? item.unitPrice ?? 0,
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
    : (build?.items || []).reduce((s, i) => s + (Number(i?.unitPrice ?? i?.product?.price ?? 0) || 0) * (Number(i?.quantity ?? 0) || 0), 0);
const countItems = (build) => (build?.items || []).reduce((s, i) => s + (Number(i?.quantity ?? 0) || 0), 0);
const buildCategoryKeywords = (category) => {
  const base = [category?.name, category?.description].map(n).filter(Boolean);
  const name = n(category?.name);
  if (name.includes("ổ cứng") || name.includes("o cung")) return [...base, "ssd", "hdd", "ổ cứng", "o cung"];
  if (name.includes("vỏ máy") || name.includes("vo may")) return [...base, "case", "vỏ máy", "vo may", "thùng máy", "thung may"];
  if (name.includes("card đồ họa") || name.includes("card do hoa")) return [...base, "vga", "gpu", "graphics", "card màn hình", "card man hinh"];
  if (name.includes("bo mạch chủ") || name.includes("bo mach chu")) return [...base, "mainboard", "motherboard"];
  if (name.includes("nguồn máy") || name.includes("nguon may")) return [...base, "psu", "power supply"];
  return base;
};
const categoryMatch = (category, categoryName) => buildCategoryKeywords(category).some((k) => n(categoryName).includes(k));
const sortProducts = (items, sort) => {
  const next = [...items];
  if (sort === "price-asc") next.sort((a, b) => a.price - b.price);
  if (sort === "price-desc") next.sort((a, b) => b.price - a.price);
  if (sort === "name-asc") next.sort((a, b) => String(a.name || "").localeCompare(String(b.name || ""), "vi"));
  return next;
};
const assignCategories = (items = [], categories = []) => {
  const pool = items.map((item) => ({ item, used: false }));
  const assigned = {};
  categories.forEach((category) => {
    const found = pool.find((entry) => !entry.used && categoryMatch(category, entry.item?.product?.categoryName || ""));
    assigned[category.id] = found?.item || null;
    if (found) found.used = true;
  });
  return { assigned, extras: pool.filter((e) => !e.used).map((e) => e.item) };
};

export default function CustomPcBuilderPage() {
  const dispatch = useDispatch();
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [activeBuildId, setActiveBuildId] = useState("");
  const [modalSlot, setModalSlot] = useState(null);
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [sort, setSort] = useState("price-asc");
  const [modalPage, setModalPage] = useState(1);

  const { data: builds = [], isLoading: buildsLoading, isError, error, refetch: refetchBuilds } = useQuery({
    queryKey: ["custom-pc-builds"],
    queryFn: async () => {
      const res = await customPcService.getCustomPcBuilds();
      if (!res.succeeded) throw new Error(res.message || "Không thể tải danh sách cấu hình");
      return res.value || [];
    },
  });

  useEffect(() => {
    if (!builds.length) return setActiveBuildId("");
    if (!builds.some((b) => b.id === activeBuildId)) setActiveBuildId(builds[0].id);
  }, [builds, activeBuildId]);

  const { data: categories = [] } = useQuery({
    queryKey: ["custom-pc-categories"],
    queryFn: async () => {
      const res = await apiService.get("/Category", {
        ParentId: CUSTOM_PC_PARENT_ID,
        Page: 1,
      });
      return res?.statusCode === 200 && Array.isArray(res.value?.items) ? res.value.items : [];
    },
    staleTime: 300000,
  });

  const activeBuildSummary = useMemo(() => builds.find((b) => b.id === activeBuildId) || null, [builds, activeBuildId]);
  const selectedCategory = useMemo(() => categories.find((category) => category.id === modalSlot?.id) || null, [modalSlot, categories]);
  const {
    data: activeBuild,
    isLoading: activeBuildLoading,
    refetch: refetchActiveBuild,
  } = useQuery({
    enabled: !!activeBuildId,
    queryKey: ["custom-pc-build-detail", activeBuildId],
    queryFn: async () => {
      const response = await customPcService.getCustomPcBuildDetail(activeBuildId);
      if (!response.succeeded || !response.value) {
        throw new Error(response.message || "Không thể tải chi tiết cấu hình");
      }
      return enrichBuildItems(response.value);
    },
    placeholderData: (previous) => previous,
  });
  const slotState = useMemo(() => assignCategories(activeBuild?.items || [], categories), [activeBuild, categories]);

  const { data: productPage, isLoading: productsLoading, refetch: refetchProducts } = useQuery({
    enabled: !!modalSlot,
    queryKey: ["custom-pc-modal-products", modalSlot?.id, searchTerm, selectedCategory?.id, modalPage],
    queryFn: async () => {
      const res = await apiService.get("/Product/ui", {
        Page: modalPage,
        PageSize: PAGE_SIZE,
        Search: searchTerm || undefined,
        CategoryId: selectedCategory?.id || undefined,
      });
      if (res?.statusCode !== 200) throw new Error(res?.message || "Không thể tải danh sách sản phẩm");
      return res.value || { items: [] };
    },
    placeholderData: (prev) => prev,
  });

  const modalProducts = useMemo(() => {
    const items = (productPage?.items || []).map(normProduct).filter(Boolean);
    const filtered = modalSlot && !selectedCategory?.id ? items.filter((p) => categoryMatch(modalSlot, p.categoryName)) : items;
    return sortProducts(filtered, sort);
  }, [productPage, modalSlot, selectedCategory, sort]);

  const createBuildMutation = useMutation({
    mutationFn: async () => {
      const res = await customPcService.createCustomPcBuild({ name: `Cấu hình ${builds.length + 1}` });
      if (!res.succeeded || !res.value) throw new Error(res.message || "Không thể tạo cấu hình mới");
      return res.value;
    },
    onSuccess: (build) => {
      queryClient.setQueryData(["custom-pc-builds"], (prev = []) => [build, ...prev]);
      setActiveBuildId(build.id);
      queryClient.invalidateQueries({ queryKey: ["custom-pc-build-detail", build.id] });
      toast.success("Đã tạo cấu hình mới");
    },
    onError: (e) => toast.error(e?.message || "Tạo cấu hình thất bại"),
  });

  const deleteBuildMutation = useMutation({
    mutationFn: async (id) => {
      const res = await customPcService.deleteCustomPcBuild(id);
      if (!res.succeeded) throw new Error(res.message || "Không thể xóa cấu hình");
      return id;
    },
    onSuccess: (id) => {
      queryClient.setQueryData(["custom-pc-builds"], (prev = []) => prev.filter((b) => b.id !== id));
      queryClient.removeQueries({ queryKey: ["custom-pc-build-detail", id] });
      toast.success("Đã xóa cấu hình");
    },
    onError: (e) => toast.error(e?.message || "Xóa cấu hình thất bại"),
  });

  const addItemMutation = useMutation({
    mutationFn: async (product) => {
      if (!activeBuildId) throw new Error("Vui lòng chọn cấu hình trước khi thêm linh kiện");
      const res = await customPcService.addItemToCustomPc(activeBuildId, { productId: product.id, quantity: 1 });
      if (!res.succeeded || !res.value) throw new Error(res.message || "Không thể thêm sản phẩm vào cấu hình");
      return res.value;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["custom-pc-builds"] });
      queryClient.invalidateQueries({ queryKey: ["custom-pc-build-detail", activeBuildId] });
      setModalSlot(null);
      setSearchInput("");
      setSearchTerm("");
      setModalPage(1);
      toast.success("Đã thêm linh kiện vào cấu hình");
    },
    onError: (e) => toast.error(e?.message || "Thêm linh kiện thất bại"),
  });

  const changeQuantityMutation = useMutation({
    mutationFn: async ({ productId, quantityDelta }) => {
      if (!activeBuildId) throw new Error("Vui lòng chọn cấu hình trước");
      const response = await customPcService.addItemToCustomPc(activeBuildId, {
        productId,
        quantity: quantityDelta,
      });
      if (!response.succeeded) {
        throw new Error(response.message || "Không thể cập nhật số lượng");
      }
      return response.value;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["custom-pc-builds"] });
      queryClient.invalidateQueries({ queryKey: ["custom-pc-build-detail", activeBuildId] });
    },
    onError: (error) => {
      toast.error(error?.message || "Cập nhật số lượng thất bại");
    },
  });

  const addBuildToCartMutation = useMutation({
    mutationFn: async () => {
      if (!activeBuild?.items?.length) {
        throw new Error("Cấu hình hiện tại chưa có sản phẩm để thêm vào giỏ");
      }

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
              productImage: product.firstImageUrl || "",
              unitPrice: Number(item.unitPrice ?? product.price ?? 0) || 0,
              availableStock:
                product.stockQty === null || product.stockQty === undefined
                  ? null
                  : Math.max(Number(product.stockQty) || 0, 0),
              productStatus: product.status || "Available",
            },
          })
        ).unwrap();
      }
    },
    onSuccess: () => {
      toast.success("Đã thêm toàn bộ cấu hình vào giỏ hàng");
    },
    onError: (error) => {
      toast.error(error || error?.message || "Không thể thêm cấu hình vào giỏ hàng");
    },
  });

  const openSlot = (slot) => {
    if (!activeBuildSummary) return toast.info("Vui lòng tạo hoặc chọn cấu hình trước");
    setModalSlot(slot);
    setSearchInput("");
    setSearchTerm("");
    setSort("price-asc");
    setModalPage(1);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 md:py-8">
      <div className="mb-6">
        <div className="text-sm text-slate-500">
          <Link to="/" className="hover:text-[#0090D0] hover:underline">Trang chủ</Link>
          <span className="mx-2 text-slate-300">/</span>
          <span>Custom PC Builder</span>
        </div>
        <div className="mt-3 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Tự xây dựng cấu hình PC</h1>
            <p className="mt-2 max-w-3xl text-sm text-slate-500">Chọn linh kiện theo từng danh mục như CPU, Mainboard, RAM, VGA và lưu thành nhiều cấu hình khác nhau.</p>
          </div>
          {activeBuild && (
            <div className="text-right">
              <p className="text-sm text-slate-500">Chi phí dự tính</p>
              <p className="text-3xl font-bold text-[#0090D0]">{money(total(activeBuild))}</p>
            </div>
          )}
        </div>
      </div>

      {isError && <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error?.message || "Không thể tải danh sách cấu hình."}</div>}

      <div className="space-y-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
          <div className="flex flex-wrap items-center gap-2">
            {builds.map((build, index) => (
              <button
                key={build.id}
                type="button"
                onClick={() => setActiveBuildId(build.id)}
                className={`rounded-md px-4 py-3 text-sm font-semibold ${build.id === activeBuildId ? "bg-amber-400 text-white" : "bg-[#0090D0] text-white hover:bg-[#0077B0]"}`}
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
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-end">
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => { refetchBuilds(); refetchActiveBuild(); refetchProducts(); }} className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#0090D0] px-4 text-sm font-semibold text-white hover:bg-[#0077B0]"><RefreshCw size={16} />Tải lại</button>
                <button
                  type="button"
                  onClick={() => addBuildToCartMutation.mutate()}
                  disabled={addBuildToCartMutation.isPending || !activeBuild?.items?.length}
                  className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#0090D0] px-4 text-sm font-semibold text-white hover:bg-[#0077B0] disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  {addBuildToCartMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <ShoppingCart size={16} />}
                  Thêm tất cả vào giỏ
                </button>
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
                <div className="font-semibold">Linh kiện tương thích</div>
                {activeBuild && <div className="text-sm text-sky-50">{countItems(activeBuild)} linh kiện • Cập nhật {dateText(activeBuild.updatedAt || activeBuild.createdAt)}</div>}
              </div>
              {buildsLoading || activeBuildLoading ? (
                <div className="space-y-3 p-4">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-20 animate-pulse rounded-xl bg-slate-100" />)}</div>
              ) : (
                categories.map((category) => {
                  const item = slotState.assigned[category.id];
                  const p = item?.product || {};
                  const unit = Number(item?.unitPrice ?? p.price ?? 0) || 0;
                  const qty = Number(item?.quantity ?? 0) || 0;
                  const changingThisItem =
                    changeQuantityMutation.isPending &&
                    changeQuantityMutation.variables?.productId === item?.productId;
                  return (
                    <div key={category.id} className="grid grid-cols-1 border-b border-slate-200 last:border-b-0 md:grid-cols-[220px_minmax(0,1fr)]">
                      <div className="bg-slate-50 px-4 py-4 text-sm font-medium text-slate-700">{category.name}</div>
                      <div className="px-4 py-4">
                        {item ? (
                          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                            <div className="flex min-w-0 gap-4">
                              <div className="h-24 w-24 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-white">
                                {p.firstImageUrl ? <img src={p.firstImageUrl} alt={p.name} className="h-full w-full object-contain" /> : <div className="flex h-full w-full items-center justify-center"><Package size={24} className="text-slate-300" /></div>}
                              </div>
                              <div className="min-w-0">
                                <p className="text-lg font-semibold text-slate-900">{p.name || "Sản phẩm chưa có tên"}</p>
                                <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-sm text-slate-600">
                                  <span>Danh mục: {p.categoryName || "--"}</span>
                                  <span>Tình trạng: {p.stockQty > 0 ? "Còn hàng" : "Hết hàng"}</span>
                                </div>
                                <div className="mt-3 inline-flex items-center overflow-hidden rounded-lg border border-slate-300">
                                  <button
                                    type="button"
                                    onClick={() => changeQuantityMutation.mutate({ productId: item.productId, quantityDelta: -1 })}
                                    disabled={changingThisItem || !item?.productId}
                                    className="flex h-10 w-10 items-center justify-center text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                                  >
                                    <Minus size={16} />
                                  </button>
                                  <div className="flex h-10 min-w-14 items-center justify-center border-x border-slate-300 px-3 text-sm font-semibold text-slate-900">
                                    {changingThisItem ? <Loader2 size={16} className="animate-spin" /> : qty}
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => changeQuantityMutation.mutate({ productId: item.productId, quantityDelta: 1 })}
                                    disabled={changingThisItem || !item?.productId}
                                    className="flex h-10 w-10 items-center justify-center text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                                  >
                                    <Plus size={16} />
                                  </button>
                                </div>
                                <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-sm">
                                  <span className="font-semibold text-slate-700">Đơn giá: {money(unit)}</span>
                                  <span className="font-semibold text-[#0090D0]">Thành tiền: {money(unit * qty)}</span>
                                </div>
                              </div>
                            </div>
                            <button type="button" onClick={() => openSlot(category)} className="inline-flex h-10 items-center gap-2 rounded-lg border border-[#0090D0] px-4 text-sm font-semibold text-[#0090D0] hover:bg-[#0090D0]/5"><Search size={16} />Chọn lại</button>
                          </div>
                        ) : (
                          <button type="button" onClick={() => openSlot(category)} className="inline-flex h-11 items-center gap-2 rounded-md bg-[#0090D0] px-4 text-sm font-semibold text-white hover:bg-[#0077B0]"><Plus size={16} />{`CHỌN ${String(category.name || "").toUpperCase()}`}</button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {!!slotState.extras.length && (
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-center gap-2 border-b border-slate-200 pb-3"><Cpu size={16} className="text-[#0090D0]" /><h2 className="text-lg font-semibold text-slate-900">Linh kiện khác</h2></div>
                <div className="mt-4 space-y-3">
                  {slotState.extras.map((item, index) => {
                    const p = item?.product || {};
                    const qty = Number(item?.quantity ?? 0) || 0;
                    const unit = Number(item?.unitPrice ?? p?.price ?? 0) || 0;
                    return <div key={item.id || `${item.productId}-${index}`} className="flex flex-col gap-3 rounded-xl border border-slate-200 p-4 md:flex-row md:items-center md:justify-between"><div><p className="text-sm font-semibold text-slate-900">{p.name || "Sản phẩm chưa có tên"}</p><p className="mt-1 text-xs text-slate-500">{p.categoryName || "Linh kiện khác"}</p></div><div className="text-sm text-slate-600">SL: {qty} • {money(unit * qty)}</div></div>;
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
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { setModalPage(1); setSearchTerm(searchInput.trim()); } }}
                  placeholder={`Bạn muốn tìm ${String(modalSlot.name || "").toLowerCase()} nào?`}
                  className="h-11 w-full rounded-lg bg-white pl-10 pr-4 text-sm text-slate-900 outline-none"
                />
              </div>
              <button type="button" onClick={() => { setModalSlot(null); setModalPage(1); }} className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/25 text-white hover:bg-white/10"><X size={18} /></button>
            </div>

            <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[320px_minmax(0,1fr)]">
              <aside className="border-r border-slate-200 bg-slate-50 p-5">
                <h3 className="text-sm font-bold uppercase tracking-wide text-slate-700">Lọc theo sản phẩm</h3>
                <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#0090D0]">Danh mục đang chọn</p>
                  <p className="mt-2 text-lg font-semibold text-slate-900">{modalSlot.name}</p>
                  <p className="mt-1 text-sm text-slate-500">{selectedCategory?.name || "Hiển thị theo danh mục tương ứng."}</p>
                </div>
                <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600">Chọn một sản phẩm để thêm ngay vào cấu hình hiện tại. Phiên bản này chưa hỗ trợ xóa linh kiện riêng lẻ.</div>
              </aside>

              <div className="flex min-h-0 flex-col">
                <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 md:flex-row md:items-center md:justify-between">
                  <div className="text-sm text-slate-600">Đang hiển thị linh kiện cho <span className="font-semibold text-slate-900">{modalSlot.name}</span></div>
                  <div className="flex items-center gap-3">
                    <label className="text-sm text-slate-600">Sắp xếp</label>
                    <select value={sort} onChange={(e) => setSort(e.target.value)} className="h-10 rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-[#0090D0]">
                      <option value="price-asc">Giá tăng dần</option>
                      <option value="price-desc">Giá giảm dần</option>
                      <option value="name-asc">Tên A-Z</option>
                    </select>
                  </div>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto p-5">
                  {productsLoading ? (
                    <div className="space-y-4">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="animate-pulse rounded-xl border border-slate-200 p-4"><div className="flex gap-4"><div className="h-24 w-24 rounded bg-slate-200" /><div className="flex-1 space-y-3"><div className="h-4 w-2/3 rounded bg-slate-200" /><div className="h-3 w-1/2 rounded bg-slate-200" /><div className="h-10 w-40 rounded bg-slate-200" /></div></div></div>)}</div>
                  ) : !modalProducts.length ? (
                    <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center"><p className="text-sm font-semibold text-slate-700">Không tìm thấy sản phẩm phù hợp</p><p className="mt-1 text-sm text-slate-500">Hãy thử từ khóa khác hoặc chọn danh mục khác.</p></div>
                  ) : (
                    <div className="space-y-4">
                      {modalProducts.map((product) => {
                        const stock = Math.max(Number(product.stockQty ?? 0) || 0, 0);
                        const disabled = product.status === "Unavailable" || stock === 0 || (addItemMutation.isPending && addItemMutation.variables?.id === product.id);
                        return (
                          <div key={product.id} className="flex flex-col gap-4 rounded-xl border border-slate-200 p-4 md:flex-row md:items-center md:justify-between">
                            <div className="flex min-w-0 gap-4">
                              <div className="h-24 w-24 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
                                {product.firstImageUrl ? <img src={product.firstImageUrl} alt={product.name} className="h-full w-full object-contain" /> : <div className="flex h-full w-full items-center justify-center"><Package size={28} className="text-slate-300" /></div>}
                              </div>
                              <div className="min-w-0">
                                <p className="text-lg font-semibold text-slate-900">{product.name}</p>
                                <p className="mt-1 text-sm text-slate-500">{product.categoryName || "Linh kiện"}</p>
                                <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm">
                                  <span className="text-slate-600">Kho hàng: {stock > 0 ? "Còn hàng" : "Hết hàng"}</span>
                                  <span className="font-semibold text-[#0090D0]">{money(product.price)}</span>
                                </div>
                                <Link to={`/products/${product.id}`} className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-[#0090D0] hover:underline">Xem chi tiết <ExternalLink size={14} /></Link>
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
                            onClick={() => setModalPage((prev) => Math.max(1, prev - 1))}
                            className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-300 px-4 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            Trang trước
                          </button>
                          <button
                            type="button"
                            disabled={!productPage?.hasNextPage || productsLoading}
                            onClick={() => setModalPage((prev) => prev + 1)}
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
