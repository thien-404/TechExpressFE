import { useEffect, useMemo, useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { Search, Package, Loader2, SlidersHorizontal } from "lucide-react";
import { apiService } from "../../../config/axios";
import ProductCard from "../../../components/customer/ProductCard";

const DEFAULT_PAGE_SIZE = 12;

function parsePositiveNumber(value, fallback) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return parsed;
}

function normalizeSortValue(sortBy, sortDirection) {
  if (sortBy === "" || sortDirection === "") return "-";
  return `${sortBy}-${sortDirection}`;
}

export default function ProductSearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const urlSearch = (searchParams.get("search") || "").trim();
  const urlSortBy = searchParams.get("sortBy") || "";
  const urlSortDirection = searchParams.get("sortDirection") || "";
  const urlPage = parsePositiveNumber(searchParams.get("page"), 1);
  const urlPageSize = parsePositiveNumber(searchParams.get("pageSize"), DEFAULT_PAGE_SIZE);

  const [searchInput, setSearchInput] = useState(urlSearch);
  const [searchTerm, setSearchTerm] = useState(urlSearch);
  const [sortBy, setSortBy] = useState(urlSortBy);
  const [sortDirection, setSortDirection] = useState(urlSortDirection);
  const [pageSize, setPageSize] = useState(urlPageSize);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const [draftSearchInput, setDraftSearchInput] = useState(urlSearch);
  const [draftSortBy, setDraftSortBy] = useState(urlSortBy);
  const [draftSortDirection, setDraftSortDirection] = useState(urlSortDirection);
  const [draftPageSize, setDraftPageSize] = useState(urlPageSize);

  useEffect(() => {
    setSearchInput(urlSearch);
    setSearchTerm(urlSearch);
    setSortBy(urlSortBy);
    setSortDirection(urlSortDirection);
    setPageSize(urlPageSize);
  }, [urlSearch, urlSortBy, urlSortDirection, urlPageSize]);

  const updateUrlParams = ({
    nextSearch = searchTerm,
    nextSortBy = sortBy,
    nextSortDirection = sortDirection,
    nextPage = 1,
    nextPageSize = pageSize,
  }) => {
    const next = new URLSearchParams();

    if (nextSearch) next.set("search", nextSearch);
    if (nextSortBy !== "") next.set("sortBy", String(nextSortBy));
    if (nextSortDirection !== "") next.set("sortDirection", String(nextSortDirection));
    if (nextPage > 1) next.set("page", String(nextPage));
    if (nextPageSize !== DEFAULT_PAGE_SIZE) next.set("pageSize", String(nextPageSize));

    setSearchParams(next);
  };

  const queryKey = useMemo(
    () => ["products-search", searchTerm, sortBy, sortDirection, pageSize, urlPage],
    [searchTerm, sortBy, sortDirection, pageSize, urlPage]
  );

  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useInfiniteQuery({
    queryKey,
    enabled: !!searchTerm,
    queryFn: async ({ pageParam = urlPage }) => {
      const params = {
        Page: pageParam,
        PageSize: pageSize,
        Search: searchTerm || undefined,
        SortBy: sortBy !== "" ? Number(sortBy) : undefined,
        SortDirection: sortDirection !== "" ? Number(sortDirection) : undefined,
      };
      const res = await apiService.get("/Product/ui", params);
      if (res?.statusCode === 200) return res.value;
      return { items: [], totalCount: 0, totalPages: 1, pageNumber: pageParam };
    },
    getNextPageParam: (lastPage) => {
      const currentPage = lastPage.pageNumber ?? 1;
      if (currentPage < (lastPage.totalPages ?? 1)) return currentPage + 1;
      return undefined;
    },
    initialPageParam: urlPage,
    staleTime: 30_000,
  });

  const products = data?.pages.flatMap((page) => page.items ?? []) ?? [];
  const totalItems = data?.pages[0]?.totalCount ?? 0;

  const handleSearch = () => {
    const nextSearch = searchInput.trim();
    setSearchTerm(nextSearch);
    updateUrlParams({
      nextSearch,
      nextSortBy: sortBy,
      nextSortDirection: sortDirection,
      nextPage: 1,
      nextPageSize: pageSize,
    });
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter") handleSearch();
  };

  const handlePageSizeChange = (value) => {
    const nextPageSize = parsePositiveNumber(value, DEFAULT_PAGE_SIZE);
    setPageSize(nextPageSize);
    updateUrlParams({
      nextSearch: searchTerm,
      nextSortBy: sortBy,
      nextSortDirection: sortDirection,
      nextPage: 1,
      nextPageSize,
    });
  };

  const openMobileFilter = () => {
    setDraftSearchInput(searchInput);
    setDraftSortBy(sortBy);
    setDraftSortDirection(sortDirection);
    setDraftPageSize(pageSize);
    setIsFilterOpen(true);
  };

  const closeMobileFilter = () => setIsFilterOpen(false);

  const handleApplyMobileFilter = () => {
    const nextSearch = draftSearchInput.trim();
    setSearchInput(draftSearchInput);
    setSearchTerm(nextSearch);
    setSortBy(draftSortBy);
    setSortDirection(draftSortDirection);
    setPageSize(draftPageSize);
    updateUrlParams({
      nextSearch,
      nextSortBy: draftSortBy,
      nextSortDirection: draftSortDirection,
      nextPage: 1,
      nextPageSize: draftPageSize,
    });
    setIsFilterOpen(false);
  };

  const handleResetMobileFilter = () => {
    setDraftSearchInput("");
    setDraftSortBy("");
    setDraftSortDirection("");
    setDraftPageSize(DEFAULT_PAGE_SIZE);
    setSearchInput("");
    setSearchTerm("");
    setSortBy("");
    setSortDirection("");
    setPageSize(DEFAULT_PAGE_SIZE);
    setSearchParams(new URLSearchParams());
  };

  if (!searchTerm) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-8 text-center">
          <h1 className="text-2xl font-bold text-slate-800">Tìm kiếm sản phẩm</h1>
          <p className="text-sm text-slate-500 mt-2">
            Vui lòng nhập từ khóa để bắt đầu tìm kiếm.
          </p>
          <button
            type="button"
            onClick={openMobileFilter}
            className="sm:hidden mt-4 inline-flex items-center gap-2 px-4 h-10 rounded-lg border border-slate-300 text-slate-700 text-sm font-medium"
          >
            <Search size={16} />
            Mở tìm kiếm
          </button>
        </div>

        {isFilterOpen && (
          <div className="fixed inset-0 z-50 sm:hidden flex items-end">
            <button
              type="button"
              aria-label="Close filter"
              onClick={closeMobileFilter}
              className="absolute inset-0 bg-black/40"
            />

            <div className="relative w-full max-h-[85vh] bg-white rounded-t-2xl shadow-xl pointer-events-auto flex flex-col">
              <div className="px-4 pt-3 pb-2">
                <div className="w-10 h-1 bg-slate-300 rounded mx-auto mb-4" />
                <h3 className="text-base font-semibold text-slate-800">Tìm kiếm và bộ lọc</h3>
              </div>

              <div className="flex-1 overflow-y-auto px-4 pb-20 space-y-3">
                <div className="relative">
                  <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={draftSearchInput}
                    onChange={(event) => setDraftSearchInput(event.target.value)}
                    placeholder="Tìm kiếm sản phẩm..."
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0090D0]/20 focus:border-[#0090D0]"
                  />
                </div>

                <select
                  value={normalizeSortValue(draftSortBy, draftSortDirection)}
                  onChange={(event) => {
                    const value = event.target.value;
                    if (value === "-") {
                      setDraftSortBy("");
                      setDraftSortDirection("");
                      return;
                    }
                    const [sb, sd] = value.split("-");
                    setDraftSortBy(sb);
                    setDraftSortDirection(sd);
                  }}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0090D0]/20 focus:border-[#0090D0]"
                >
                  <option value="-">Mặc định</option>
                  <option value="0-0">Giá: Thấp đến cao</option>
                  <option value="0-1">Giá: Cao đến thấp</option>
                  <option value="1-0">Ngày thêm: Cũ đến mới</option>
                  <option value="1-1">Ngày thêm: Mới đến cũ</option>
                  <option value="2-1">Tồn kho: Nhiều đến ít</option>
                </select>

                <select
                  value={draftPageSize}
                  onChange={(event) =>
                    setDraftPageSize(parsePositiveNumber(event.target.value, DEFAULT_PAGE_SIZE))
                  }
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0090D0]/20 focus:border-[#0090D0]"
                >
                  <option value={12}>12 / trang</option>
                  <option value={16}>16 / trang</option>
                  <option value={20}>20 / trang</option>
                </select>
              </div>

              <div className="sticky bottom-0 border-t border-slate-200 bg-white px-4 pt-3 pb-[calc(env(safe-area-inset-bottom)+12px)]">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={handleResetMobileFilter}
                    className="h-10 rounded-lg border border-slate-300 text-slate-700 text-sm font-medium"
                  >
                    Đặt lại
                  </button>
                  <button
                    type="button"
                    onClick={handleApplyMobileFilter}
                    disabled={isLoading || isFetchingNextPage}
                    className="h-10 rounded-lg bg-[#0090D0] text-white text-sm font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    Áp dụng
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 md:py-8 pb-4">
      <div className="mb-4 sm:mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Kết quả tìm kiếm</h1>
        <p className="text-sm text-slate-500 mt-1">
          Từ khóa: <span className="font-medium text-slate-700">"{searchTerm}"</span>
        </p>
      </div>

      <div className="flex sm:hidden gap-2 mb-4">
        <button
          type="button"
          onClick={openMobileFilter}
          className="flex-1 h-10 rounded-lg border border-slate-300 bg-white text-slate-700 text-sm font-medium inline-flex items-center justify-center gap-2"
        >
          <Search size={16} />
          Tìm kiếm
        </button>
        <button
          type="button"
          onClick={openMobileFilter}
          className="flex-1 h-10 rounded-lg border border-slate-300 bg-white text-slate-700 text-sm font-medium inline-flex items-center justify-center gap-2"
        >
          <SlidersHorizontal size={16} />
          Lọc
        </button>
      </div>

      <div className="hidden sm:block bg-white rounded-xl shadow-sm border border-slate-100 p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Tìm kiếm sản phẩm..."
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0090D0]/20 focus:border-[#0090D0]"
            />
          </div>

          <select
            value={normalizeSortValue(sortBy, sortDirection)}
            onChange={(event) => {
              const value = event.target.value;
              if (value === "-") {
                setSortBy("");
                setSortDirection("");
                return;
              }
              const [sb, sd] = value.split("-");
              setSortBy(sb);
              setSortDirection(sd);
            }}
            className="px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0090D0]/20 focus:border-[#0090D0]"
          >
            <option value="-">Mặc định</option>
            <option value="0-0">Giá: Thấp đến cao</option>
            <option value="0-1">Giá: Cao đến thấp</option>
            <option value="1-0">Ngày thêm: Cũ đến mới</option>
            <option value="1-1">Ngày thêm: Mới đến cũ</option>
            <option value="2-1">Tồn kho: Nhiều đến ít</option>
          </select>

          <select
            value={pageSize}
            onChange={(event) => handlePageSizeChange(event.target.value)}
            className="px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0090D0]/20 focus:border-[#0090D0]"
          >
            <option value={12}>12 / trang</option>
            <option value={16}>16 / trang</option>
            <option value={20}>20 / trang</option>
          </select>

          <button
            onClick={handleSearch}
            className="px-5 py-2.5 bg-[#0090D0] hover:bg-[#0077B0] text-white text-sm font-semibold rounded-lg transition-colors"
          >
            Tìm kiếm
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
          {Array.from({ length: pageSize }).map((_, index) => (
            <div key={index} className="bg-white rounded-xl overflow-hidden shadow-sm border border-slate-100 animate-pulse">
              <div className="aspect-square bg-slate-200" />
              <div className="p-4 space-y-3">
                <div className="h-3 bg-slate-200 rounded w-1/4" />
                <div className="h-4 bg-slate-200 rounded w-3/4" />
                <div className="h-5 bg-slate-200 rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-8 sm:p-12 text-center">
          <Package size={40} className="mx-auto text-slate-300 mb-3 sm:mb-4" />
          <h3 className="text-lg font-semibold text-slate-600 mb-2">Không tìm thấy sản phẩm</h3>
          <p className="text-sm text-slate-400 max-w-md mx-auto">Không có kết quả cho "{searchTerm}".</p>
        </div>
      ) : (
        <>
          <p className="text-sm text-slate-500 mb-4">Hiển thị {products.length} / {totalItems} sản phẩm</p>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          {hasNextPage && (
            <div className="mt-8 text-center">
              <button
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3 bg-white hover:bg-slate-50 text-[#0090D0] font-semibold text-sm border-2 border-[#0090D0] rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isFetchingNextPage ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Đang tải...
                  </>
                ) : (
                  "Xem thêm sản phẩm"
                )}
              </button>
            </div>
          )}
        </>
      )}

      {isFilterOpen && (
        <div className="fixed inset-0 z-50 sm:hidden flex items-end">
          <button
            type="button"
            aria-label="Close filter"
            onClick={closeMobileFilter}
            className="absolute inset-0 bg-black/40"
          />

          <div className="relative w-full max-h-[85vh] bg-white rounded-t-2xl shadow-xl pointer-events-auto flex flex-col">
            <div className="px-4 pt-3 pb-2">
              <div className="w-10 h-1 bg-slate-300 rounded mx-auto mb-4" />
              <h3 className="text-base font-semibold text-slate-800">Tìm kiếm và bộ lọc</h3>
            </div>

            <div className="flex-1 overflow-y-auto px-4 pb-20 space-y-3">
              <div className="relative">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={draftSearchInput}
                  onChange={(event) => setDraftSearchInput(event.target.value)}
                  placeholder="Tìm kiếm sản phẩm..."
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0090D0]/20 focus:border-[#0090D0]"
                />
              </div>

              <select
                value={normalizeSortValue(draftSortBy, draftSortDirection)}
                onChange={(event) => {
                  const value = event.target.value;
                  if (value === "-") {
                    setDraftSortBy("");
                    setDraftSortDirection("");
                    return;
                  }
                  const [sb, sd] = value.split("-");
                  setDraftSortBy(sb);
                  setDraftSortDirection(sd);
                }}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0090D0]/20 focus:border-[#0090D0]"
              >
                <option value="-">Mặc định</option>
                <option value="0-0">Giá: Thấp đến cao</option>
                <option value="0-1">Giá: Cao đến thấp</option>
                <option value="1-0">Ngày thêm: Cũ đến mới</option>
                <option value="1-1">Ngày thêm: Mới đến cũ</option>
                <option value="2-1">Tồn kho: Nhiều đến ít</option>
              </select>

              <select
                value={draftPageSize}
                onChange={(event) =>
                  setDraftPageSize(parsePositiveNumber(event.target.value, DEFAULT_PAGE_SIZE))
                }
                className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0090D0]/20 focus:border-[#0090D0]"
              >
                <option value={12}>12 / trang</option>
                <option value={16}>16 / trang</option>
                <option value={20}>20 / trang</option>
              </select>
            </div>

            <div className="sticky bottom-0 border-t border-slate-200 bg-white px-4 pt-3 pb-[calc(env(safe-area-inset-bottom)+12px)]">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleResetMobileFilter}
                  className="h-10 rounded-lg border border-slate-300 text-slate-700 text-sm font-medium"
                >
                  Đặt lại
                </button>
                <button
                  type="button"
                  onClick={handleApplyMobileFilter}
                  disabled={isLoading || isFetchingNextPage}
                  className="h-10 rounded-lg bg-[#0090D0] text-white text-sm font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  Áp dụng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
