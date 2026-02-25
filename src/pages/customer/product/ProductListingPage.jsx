import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { Search, Package, Loader2, SlidersHorizontal } from "lucide-react";
import { apiService } from "../../../config/axios";
import ProductCard from "../../../components/customer/ProductCard";

const PAGE_SIZE = 12;

export default function ProductListingPage() {
  const [searchParams] = useSearchParams();
  const categoryId = searchParams.get("category");

  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("");
  const [sortDirection, setSortDirection] = useState("");

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [draftSearchInput, setDraftSearchInput] = useState("");
  const [draftSortBy, setDraftSortBy] = useState("");
  const [draftSortDirection, setDraftSortDirection] = useState("");

  useEffect(() => {
    setSearchInput("");
    setSearchTerm("");
  }, [categoryId]);

  const { data: categoryName } = useQuery({
    queryKey: ["category-name", categoryId],
    queryFn: async () => {
      if (!categoryId) return null;
      const res = await apiService.get("/category/parent");
      if (res?.statusCode === 200) {
        const cat = (res.value || []).find((c) => c.id === categoryId);
        return cat?.name || null;
      }
      return null;
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!categoryId,
  });

  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useInfiniteQuery({
    queryKey: ["products-listing", categoryId, searchTerm, sortBy, sortDirection],
    queryFn: async ({ pageParam = 1 }) => {
      const params = {
        Page: pageParam,
        PageSize: PAGE_SIZE,
        Search: searchTerm || undefined,
        CategoryId: categoryId || undefined,
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
    staleTime: 30_000,
  });

  const products = data?.pages.flatMap((page) => page.items ?? []) ?? [];
  const totalItems = data?.pages[0]?.totalCount ?? 0;

  const handleSearch = () => {
    setSearchTerm(searchInput.trim());
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter") handleSearch();
  };

  const openMobileFilter = () => {
    setDraftSearchInput(searchInput);
    setDraftSortBy(sortBy);
    setDraftSortDirection(sortDirection);
    setIsFilterOpen(true);
  };

  const closeMobileFilter = () => setIsFilterOpen(false);

  const handleApplyMobileFilter = () => {
    setSearchInput(draftSearchInput);
    setSearchTerm(draftSearchInput.trim());
    setSortBy(draftSortBy);
    setSortDirection(draftSortDirection);
    setIsFilterOpen(false);
  };

  const handleResetMobileFilter = () => {
    setDraftSearchInput("");
    setDraftSortBy("");
    setDraftSortDirection("");
    setSearchInput("");
    setSearchTerm("");
    setSortBy("");
    setSortDirection("");
  };

  return (
    <div className="pb-4">
      <div className="mb-4 sm:mb-6">
        <h1 className="text-2xl font-bold text-slate-800">
          {categoryName || "Tất cả sản phẩm"}
        </h1>
        {categoryName && (
          <p className="hidden sm:block text-sm text-slate-500 mt-1">
            Hiển thị sản phẩm trong danh mục {categoryName}
          </p>
        )}
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
            value={`${sortBy}-${sortDirection}`}
            onChange={(event) => {
              const [sb, sd] = event.target.value.split("-");
              setSortBy(sb);
              setSortDirection(sd);
            }}
            className="px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0090D0]/20 focus:border-[#0090D0]"
          >
            <option value="-">Mặc định</option>
            <option value="0-0">Giá: Thấp đến cao</option>
            <option value="0-1">Giá: Cao đến thấp</option>
            <option value="1-0">Tên: A-Z</option>
            <option value="1-1">Tên: Z-A</option>
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
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {Array.from({ length: 6 }).map((_, index) => (
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
          <p className="text-sm text-slate-400 max-w-md mx-auto">
            {searchTerm ? `Không có kết quả cho "${searchTerm}"` : "Danh mục này chưa có sản phẩm nào"}
          </p>
        </div>
      ) : (
        <>
          <p className="text-sm text-slate-500 mb-4">Hiển thị {products.length} / {totalItems} sản phẩm</p>

          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
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
                value={`${draftSortBy}-${draftSortDirection}`}
                onChange={(event) => {
                  const [sb, sd] = event.target.value.split("-");
                  setDraftSortBy(sb || "");
                  setDraftSortDirection(sd || "");
                }}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0090D0]/20 focus:border-[#0090D0]"
              >
                <option value="-">Mặc định</option>
                <option value="0-0">Giá: Thấp đến cao</option>
                <option value="0-1">Giá: Cao đến thấp</option>
                <option value="1-0">Tên: A-Z</option>
                <option value="1-1">Tên: Z-A</option>
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
