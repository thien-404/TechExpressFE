import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { Search, Package, Loader2 } from 'lucide-react'
import { apiService } from '../../config/axios'
import ProductCard from '../../components/customer/ProductCard'

const PAGE_SIZE = 12

export default function ProductListingPage() {
  const [searchParams] = useSearchParams()
  const categoryId = searchParams.get('category')

  const [searchInput, setSearchInput] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('')
  const [sortDirection, setSortDirection] = useState('')

  // Reset when category changes
  useEffect(() => {
    setSearchInput('')
    setSearchTerm('')
  }, [categoryId])

  // Fetch category name if filtered
  const { data: categoryName } = useQuery({
    queryKey: ['category-name', categoryId],
    queryFn: async () => {
      if (!categoryId) return null
      const res = await apiService.get('/category/parent')
      if (res?.statusCode === 200) {
        const cat = (res.value || []).find(c => c.id === categoryId)
        return cat?.name || null
      }
      return null
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!categoryId
  })

  // Infinite query for products
  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useInfiniteQuery({
    queryKey: ['products-listing', categoryId, searchTerm, sortBy, sortDirection],
    queryFn: async ({ pageParam = 1 }) => {
      const params = {
        Page: pageParam,
        PageSize: PAGE_SIZE,
        Search: searchTerm || undefined,
        CategoryId: categoryId || undefined,
        SortBy: sortBy !== '' ? Number(sortBy) : undefined,
        SortDirection: sortDirection !== '' ? Number(sortDirection) : undefined,
      }
      const res = await apiService.get('/Product/ui', params)
      if (res?.statusCode === 200) {
        return res.value
      }
      return { items: [], totalCount: 0, totalPages: 1, pageNumber: pageParam }
    },
    getNextPageParam: (lastPage) => {
      const currentPage = lastPage.pageNumber ?? 1
      if (currentPage < (lastPage.totalPages ?? 1)) {
        return currentPage + 1
      }
      return undefined
    },
    staleTime: 30_000,
  })

  // Flatten all pages into a single product list
  const products = data?.pages.flatMap(page => page.items ?? []) ?? []
  const totalItems = data?.pages[0]?.totalCount ?? 0

  const handleSearch = () => {
    setSearchTerm(searchInput.trim())
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSearch()
  }

  return (
    <div>
      {/* Page title */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">
          {categoryName || 'Tất cả sản phẩm'}
        </h1>
        {categoryName && (
          <p className="text-sm text-slate-500 mt-1">
            Hiển thị sản phẩm trong danh mục {categoryName}
          </p>
        )}
      </div>

      {/* Search & Sort bar */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Tìm kiếm sản phẩm..."
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0090D0]/20 focus:border-[#0090D0]"
            />
          </div>

          {/* Sort */}
          <select
            value={`${sortBy}-${sortDirection}`}
            onChange={(e) => {
              const [sb, sd] = e.target.value.split('-')
              setSortBy(sb)
              setSortDirection(sd)
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

      {/* Products grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl overflow-hidden shadow-sm border border-slate-100 animate-pulse">
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
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-12 text-center">
          <Package size={48} className="mx-auto text-slate-300 mb-4" />
          <h3 className="text-lg font-semibold text-slate-600 mb-2">Không tìm thấy sản phẩm</h3>
          <p className="text-sm text-slate-400">
            {searchTerm
              ? `Không có kết quả cho "${searchTerm}"`
              : 'Danh mục này chưa có sản phẩm nào'}
          </p>
        </div>
      ) : (
        <>
          {/* Product count */}
          <p className="text-sm text-slate-500 mb-4">
            Hiển thị {products.length} / {totalItems} sản phẩm
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          {/* Load more button */}
          {hasNextPage && (
            <div className="mt-8 text-center">
              <button
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                className="inline-flex items-center gap-2 px-8 py-3 bg-white hover:bg-slate-50 text-[#0090D0] font-semibold text-sm border-2 border-[#0090D0] rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isFetchingNextPage ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Đang tải...
                  </>
                ) : (
                  `Xem thêm sản phẩm`
                )}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
