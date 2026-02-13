import { useState, useMemo } from 'react'
import { NavLink, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { apiService } from '../../config/axios'
import { LayoutGrid, Layers, ChevronDown } from 'lucide-react'

export default function CategorySidebar() {
  const [searchParams] = useSearchParams()
  const activeCategoryId = searchParams.get('category')
  const [expanded, setExpanded] = useState(new Set())

  const { data: allCategories = [], isLoading } = useQuery({
    queryKey: ['categories-sidebar'],
    queryFn: async () => {
      const res = await apiService.get('/Category/ui')
      if (res?.statusCode === 200) {
        return res.value || []
      }
      return []
    },
    staleTime: 5 * 60 * 1000
  })

  // Build parent-children tree
  const rootCategories = useMemo(() => {
    const map = new Map()
    const roots = []

    allCategories.forEach(cat => {
      map.set(cat.id, { ...cat, children: [] })
    })

    allCategories.forEach(cat => {
      if (cat.parentCategoryId) {
        const parent = map.get(cat.parentCategoryId)
        if (parent) {
          parent.children.push(map.get(cat.id))
        } else {
          roots.push(map.get(cat.id))
        }
      } else {
        roots.push(map.get(cat.id))
      }
    })

    return roots
  }, [allCategories])

  // Auto-expand parent of active category
  useMemo(() => {
    if (!activeCategoryId) return
    const parentCat = allCategories.find(c => c.id === activeCategoryId)
    if (parentCat?.parentCategoryId) {
      setExpanded(prev => {
        const next = new Set(prev)
        next.add(parentCat.parentCategoryId)
        return next
      })
    }
  }, [activeCategoryId, allCategories])

  const toggleExpand = (categoryId, e) => {
    e.preventDefault()
    e.stopPropagation()
    setExpanded(prev => {
      const next = new Set(prev)
      if (next.has(categoryId)) {
        next.delete(categoryId)
      } else {
        next.add(categoryId)
      }
      return next
    })
  }

  if (isLoading) {
    return (
      <aside className="w-64 shrink-0 hidden lg:block">
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4">
          <div className="h-5 bg-slate-200 rounded w-2/3 mb-4 animate-pulse" />
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 py-2.5">
              <div className="w-8 h-8 bg-slate-200 rounded-lg animate-pulse" />
              <div className="h-4 bg-slate-200 rounded w-24 animate-pulse" />
            </div>
          ))}
        </div>
      </aside>
    )
  }

  return (
    <aside className="w-64 shrink-0 hidden lg:block">
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 sticky top-4">
        {/* Header */}
        <div className="px-4 py-3 border-b border-slate-100">
          <h3 className="font-semibold text-slate-800 flex items-center gap-2">
            <Layers size={18} className="text-[#0090D0]" />
            Danh mục sản phẩm
          </h3>
        </div>

        {/* Category list */}
        <nav className="p-2">
          {/* All products link */}
          <NavLink
            to="/products"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
              !activeCategoryId
                ? 'bg-[#0090D0]/10 text-[#0090D0] font-semibold'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <LayoutGrid size={18} />
            Tất cả sản phẩm
          </NavLink>

          {rootCategories.map((category) => {
            const hasChildren = category.children.length > 0
            const isExpanded = expanded.has(category.id)
            const isActive = activeCategoryId === category.id
            const hasActiveChild = category.children.some(c => c.id === activeCategoryId)

            return (
              <div key={category.id}>
                {/* Parent category */}
                <NavLink
                  to={`/products?category=${category.id}`}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                    isActive || hasActiveChild
                      ? 'bg-[#0090D0]/10 text-[#0090D0] font-semibold'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {category.imageUrl ? (
                    <img
                      src={category.imageUrl}
                      alt={category.name}
                      className="w-6 h-6 object-contain rounded"
                    />
                  ) : (
                    <div className="w-6 h-6 bg-[#0090D0]/10 rounded flex items-center justify-center">
                      <span className="text-xs font-bold text-[#0090D0]">
                        {category.name.charAt(0)}
                      </span>
                    </div>
                  )}
                  <span className="flex-1">{category.name}</span>
                  {hasChildren && (
                    <button
                      onClick={(e) => toggleExpand(category.id, e)}
                      className="p-0.5 rounded hover:bg-slate-200/60 transition-colors"
                    >
                      <ChevronDown
                        size={16}
                        className={`text-slate-400 transition-transform duration-200 ${
                          isExpanded ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                  )}
                </NavLink>

                {/* Sub-categories */}
                {hasChildren && isExpanded && (
                  <div className="ml-5 pl-3 border-l-2 border-slate-100">
                    {category.children.map((child) => (
                      <NavLink
                        key={child.id}
                        to={`/products?category=${child.id}`}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                          activeCategoryId === child.id
                            ? 'bg-[#0090D0]/10 text-[#0090D0] font-semibold'
                            : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                        }`}
                      >
                        {child.imageUrl ? (
                          <img
                            src={child.imageUrl}
                            alt={child.name}
                            className="w-5 h-5 object-contain rounded"
                          />
                        ) : (
                          <div className="w-5 h-5 bg-slate-100 rounded flex items-center justify-center">
                            <span className="text-[10px] font-bold text-slate-400">
                              {child.name.charAt(0)}
                            </span>
                          </div>
                        )}
                        {child.name}
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </nav>
      </div>
    </aside>
  )
}
