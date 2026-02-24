import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { apiService } from "../../config/axios";
import ProductCard from "../../components/customer/ProductCard";
import Pagination from "../../components/common/Pagination";

const SORT_BY_OPTIONS = [
  { value: 0, label: "Giá" },
  { value: 1, label: "Ngày Thêm" },
  { value: 2, label: "Tồn Kho" },
  { value: 3, label: "Bán Chạy" },
];

const SORT_DIRECTION_OPTIONS = [
  { value: 0, label: "Tăng dần" },
  { value: 1, label: "Giảm dần" },
];

function toNumber(value, fallback) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function mapLegacySort(sortValue) {
  if (sortValue === "newest") return { sortBy: 1, sortDirection: 1 };
  if (sortValue === "bestseller") return { sortBy: 3, sortDirection: 0 };
  return { sortBy: 3, sortDirection: 0 };
}

function resolveText(textOrBuilder, context, fallback = "") {
  if (typeof textOrBuilder === "function") {
    return textOrBuilder(context);
  }
  return textOrBuilder ?? fallback;
}

export default function ProductListBase({
  mode,
  pageTitle,
  subtitleBuilder,
  emptyStateConfig,
  allowCategoryChip = true,
  requireSearchKeyword = false,
}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  const search = searchParams.get("search") || "";
  const categoryId = searchParams.get("categoryId") || searchParams.get("category") || "";
  const page = Math.max(toNumber(searchParams.get("page"), 1), 1);
  const pageSize = Math.max(toNumber(searchParams.get("pageSize"), 12), 12);
  const legacySort = searchParams.get("sort") || "";
  const fallbackSort = mapLegacySort(legacySort);
  const sortBy = toNumber(searchParams.get("sortBy"), fallbackSort.sortBy);
  const sortDirection = toNumber(
    searchParams.get("sortDirection"),
    fallbackSort.sortDirection
  );

  const [searchDraft, setSearchDraft] = useState(search);

  useEffect(() => {
    setSearchDraft(search);
  }, [search]);

  const shouldQuery = !requireSearchKeyword || !!search.trim();

  const queryParams = useMemo(
    () => ({
      search: search || undefined,
      categoryId: categoryId || undefined,
      page,
      pageSize,
      sortBy,
      sortDirection,
    }),
    [search, categoryId, page, pageSize, sortBy, sortDirection]
  );

  const { data, isLoading, isFetching } = useQuery({
    enabled: shouldQuery,
    queryKey: ["product-ui-list", mode, queryParams],
    queryFn: async () => {
      const res = await apiService.get("/Product/ui", queryParams);
      if (res?.statusCode !== 200) {
        return {
          items: [],
          totalCount: 0,
          totalPages: 1,
          pageNumber: page,
          pageSize,
        };
      }
      return {
        items: res?.value?.items || [],
        totalCount: res?.value?.totalCount ?? 0,
        totalPages: res?.value?.totalPages ?? 1,
        pageNumber: res?.value?.pageNumber ?? page,
        pageSize: res?.value?.pageSize ?? pageSize,
      };
    },
    keepPreviousData: true,
  });

  const items = data?.items || [];
  const totalCount = data?.totalCount ?? items.length;
  const totalPages = Math.max(data?.totalPages ?? 1, 1);
  const loading = shouldQuery && (isLoading || isFetching);
  const categoryName = items[0]?.categoryName || "";

  const context = {
    search,
    categoryId,
    categoryName,
    totalCount,
    loading,
    mode,
    shouldQuery,
  };

  const headerTitle = resolveText(
    pageTitle,
    context,
    categoryName || "Danh sách sản phẩm"
  );
  const subtitle =
    subtitleBuilder?.(
      {
        items,
        totalCount,
        totalPages,
      },
      queryParams,
      context
    ) ?? (loading ? "Đang tải..." : `${totalCount} sản phẩm`);

  const updateParams = (patch) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(patch).forEach(([key, value]) => {
      if (
        value === undefined ||
        value === null ||
        value === "" ||
        (key === "page" && Number(value) <= 1) ||
        (key === "pageSize" && Number(value) === 12)
      ) {
        next.delete(key);
      } else {
        next.set(key, String(value));
      }
    });
    next.delete("sort");
    setSearchParams(next);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    updateParams({ search: searchDraft.trim(), page: 1 });
  };

  const clearSearch = () => {
    setSearchDraft("");
    updateParams({ search: "", page: 1 });
  };

  const hasAnyFilter = !!search || !!categoryId;
  const showSearchPrompt = requireSearchKeyword && !search.trim();
  const emptyTitle =
    emptyStateConfig?.title ||
    "Không tìm thấy sản phẩm";
  const emptyDescription =
    emptyStateConfig?.description ||
    "Thử điều chỉnh bộ lọc hoặc tìm kiếm để tìm sản phẩm bạn muốn.";

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 md:py-8">
      <div className="mb-4">
        <Link to="/" className="text-sm text-[#0090D0] hover:underline">
          Trang Chủ
        </Link>
        <span className="mx-2 text-slate-400">/</span>
        <span className="text-sm text-slate-600">{headerTitle}</span>
      </div>

      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900">{headerTitle}</h1>
          <p className="text-sm text-slate-500 mt-1">{subtitle}</p>
        </div>

        <button
          type="button"
          onClick={() => setIsFiltersOpen((prev) => !prev)}
          className="md:hidden h-10 px-3 rounded-lg border border-slate-300 bg-white text-slate-700 inline-flex items-center gap-2"
        >
          <SlidersHorizontal size={16} />
          Lọc
        </button>
      </div>

      <form onSubmit={handleSearch} className="rounded-xl border border-slate-200 bg-white p-3 md:p-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              value={searchDraft}
              onChange={(e) => setSearchDraft(e.target.value)}
              placeholder="Tìm kiếm sản phẩm..."
              className="w-full h-11 rounded-lg border border-slate-300 pl-10 pr-10 text-sm outline-none focus:border-[#0090D0]"
            />
            {searchDraft && (
              <button
                type="button"
                onClick={clearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X size={16} />
              </button>
            )}
          </div>

          <button
            type="submit"
            className="h-11 px-5 rounded-lg bg-[#0090D0] hover:bg-[#0077B0] text-white font-semibold"
          >
            Tìm kiếm
          </button>
        </div>

        <div className={`mt-3 grid grid-cols-1 md:grid-cols-3 gap-3 ${isFiltersOpen ? "block" : "hidden md:grid"}`}>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Sắp xếp theo</label>
            <select
              value={sortBy}
              onChange={(e) => updateParams({ sortBy: Number(e.target.value), page: 1 })}
              className="w-full h-10 rounded-md border border-slate-300 px-3 text-sm bg-white outline-none focus:border-[#0090D0]"
            >
              {SORT_BY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs text-slate-500 mb-1">Hướng</label>
            <select
              value={sortDirection}
              onChange={(e) => updateParams({ sortDirection: Number(e.target.value), page: 1 })}
              className="w-full h-10 rounded-md border border-slate-300 px-3 text-sm bg-white outline-none focus:border-[#0090D0]"
            >
              {SORT_DIRECTION_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs text-slate-500 mb-1">Số lượng/trang</label>
            <select
              value={pageSize}
              onChange={(e) => updateParams({ pageSize: Number(e.target.value), page: 1 })}
              className="w-full h-10 rounded-md border border-slate-300 px-3 text-sm bg-white outline-none focus:border-[#0090D0]"
            >
              <option value={12}>12</option>
              <option value={16}>16</option>
              <option value={20}>20</option>
            </select>
          </div>
        </div>
      </form>

      {hasAnyFilter && (
        <div className="mt-3 flex flex-wrap gap-2">
          {allowCategoryChip && categoryId && (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-slate-200 text-slate-700 text-xs">
              categoryId: {categoryId.slice(0, 8)}...
            </span>
          )}
          {search && (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs">
              search: {search}
            </span>
          )}
        </div>
      )}

      <div className="mt-5">
        {showSearchPrompt ? (
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
            <h2 className="text-lg font-semibold text-slate-800">Vui lòng nhập từ khóa để bắt đầu tìm kiếm</h2>
            <p className="text-sm text-slate-500 mt-1">Bạn có thể tìm theo tên sản phẩm hoặc SKU.</p>
          </div>
        ) : loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
            {Array.from({ length: pageSize }).map((_, index) => (
              <div key={index} className="bg-white rounded-xl p-4 border border-slate-200 animate-pulse">
                <div className="aspect-square bg-slate-200 rounded-lg mb-3" />
                <div className="h-3 bg-slate-200 rounded w-2/3 mb-2" />
                <div className="h-4 bg-slate-200 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : items.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
            {items.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
            <h2 className="text-lg font-semibold text-slate-800">{emptyTitle}</h2>
            <p className="text-sm text-slate-500 mt-1">{emptyDescription}</p>
            <button
              type="button"
              onClick={() => setSearchParams(categoryId ? { categoryId } : {})}
              className="mt-4 h-10 px-4 rounded-md bg-[#0090D0] text-white font-medium"
            >
              Xóa bộ lọc
            </button>
          </div>
        )}
      </div>

      {!showSearchPrompt && (
        <div className="mt-6">
          <Pagination
            loading={loading}
            pageNumber={Math.max(page - 1, 0)}
            pageSize={pageSize}
            totalItems={totalCount}
            totalPages={totalPages}
            onPageChange={(nextPageNumber) => updateParams({ page: nextPageNumber + 1 })}
          />
        </div>
      )}
    </div>
  );
}
