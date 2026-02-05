import React, { useState, useMemo, useRef, useEffect } from 'react'
import { FiChevronDown, FiSearch, FiFolder, FiX, FiChevronRight } from 'react-icons/fi'

/* =========================
 * CATEGORY SELECT WITH MODAL
 * ========================= */
export default function CategorySelect({ 
  value, 
  onChange, 
  categories = [],
  placeholder = "Chọn danh mục" 
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedCategories, setExpandedCategories] = useState(new Set())

  /* =========================
   * BUILD HIERARCHICAL STRUCTURE
   * ========================= */
  const hierarchicalCategories = useMemo(() => {
    const categoryMap = new Map()
    const rootCategories = []

    // First pass: create map
    categories.forEach(cat => {
      categoryMap.set(cat.id, { ...cat, children: [] })
    })

    // Second pass: organize tree
    categories.forEach(cat => {
      if (cat.parentCategoryId) {
        const parent = categoryMap.get(cat.parentCategoryId)
        if (parent) {
          parent.children.push(categoryMap.get(cat.id))
        } else {
          rootCategories.push(categoryMap.get(cat.id))
        }
      } else {
        rootCategories.push(categoryMap.get(cat.id))
      }
    })

    return rootCategories
  }, [categories])

  /* =========================
   * FLATTEN FOR DISPLAY
   * ========================= */
  const displayCategories = useMemo(() => {
    const flattened = []

    const flatten = (cats, level = 0) => {
      cats.forEach(cat => {
        // Filter by search
        const matchesSearch = !searchQuery.trim() || 
          cat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          cat.description?.toLowerCase().includes(searchQuery.toLowerCase())

        if (matchesSearch) {
          flattened.push({ ...cat, level })
        }

        if (cat.children && cat.children.length > 0 && expandedCategories.has(cat.id)) {
          flatten(cat.children, level + 1)
        }
      })
    }

    flatten(hierarchicalCategories)
    return flattened
  }, [hierarchicalCategories, expandedCategories, searchQuery])

  /* =========================
   * SELECTED CATEGORY
   * ========================= */
  const selectedCategory = useMemo(() => {
    return categories.find(cat => cat.id === value)
  }, [categories, value])

  /* =========================
   * HANDLERS
   * ========================= */
  const handleSelect = (categoryId) => {
    onChange(categoryId)
    setIsOpen(false)
    setSearchQuery('')
    setExpandedCategories(new Set())
  }

  const handleClear = (e) => {
    e.stopPropagation()
    onChange('')
  }

  const toggleCategory = (categoryId, e) => {
    e.stopPropagation()
    setExpandedCategories(prev => {
      const newSet = new Set(prev)
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId)
      } else {
        newSet.add(categoryId)
      }
      return newSet
    })
  }

  const expandAll = () => {
    const allParentIds = categories
      .filter(cat => categories.some(c => c.parentCategoryId === cat.id))
      .map(cat => cat.id)
    setExpandedCategories(new Set(allParentIds))
  }

  const collapseAll = () => {
    setExpandedCategories(new Set())
  }

  return (
    <div className="relative">
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="h-10 w-full rounded border border-slate-200 px-3 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100 transition-all bg-white text-left flex items-center justify-between"
      >
        <span className={selectedCategory ? 'text-slate-700' : 'text-slate-400'}>
          {selectedCategory?.name || placeholder}
        </span>
        
        <div className="flex items-center gap-1">
          {selectedCategory && (
            <div
              onClick={handleClear}
              className="p-0.5 hover:bg-slate-100 rounded transition-colors cursor-pointer"
            >
              <FiX size={14} className="text-slate-400" />
            </div>
          )}
          <FiChevronDown size={16} className="text-slate-400" />
        </div>
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[80vh] flex flex-col shadow-xl">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-800">
                  Chọn danh mục
                </h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <FiX size={20} className="text-slate-500" />
                </button>
              </div>
            </div>

            {/* Search & Controls */}
            <div className="px-6 py-4 border-b border-slate-200 space-y-3">
              {/* Search */}
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm kiếm theo tên danh mục..."
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  autoFocus
                />
              </div>

              {/* Expand/Collapse */}
              <div className="flex gap-2">
                <button
                  onClick={expandAll}
                  className="flex items-center gap-2 px-3 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition text-sm font-medium"
                >
                  <FiChevronDown size={16} />
                  Mở rộng tất cả
                </button>
                <button
                  onClick={collapseAll}
                  className="flex items-center gap-2 px-3 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition text-sm font-medium"
                >
                  <FiChevronRight size={16} />
                  Thu gọn tất cả
                </button>
              </div>
            </div>

            {/* Category List */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {displayCategories.length === 0 ? (
                <div className="py-12 text-center text-sm text-slate-500">
                  Không tìm thấy danh mục
                </div>
              ) : (
                <div className="space-y-1">
                  {displayCategories.map((category) => (
                    <div
                      key={category.id}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-lg transition-colors cursor-pointer ${
                        value === category.id
                          ? 'bg-blue-50 text-blue-700 font-medium'
                          : 'hover:bg-slate-50 text-slate-700'
                      }`}
                      style={{ paddingLeft: `${12 + category.level * 24}px` }}
                      onClick={() => handleSelect(category.id)}
                    >
                      {/* Expand/Collapse Button */}
                      {category.children && category.children.length > 0 ? (
                        <button
                          onClick={(e) => toggleCategory(category.id, e)}
                          className="p-1 hover:bg-slate-200 rounded transition flex-shrink-0"
                        >
                          {expandedCategories.has(category.id) ? (
                            <FiChevronDown size={16} className="text-slate-600" />
                          ) : (
                            <FiChevronRight size={16} className="text-slate-600" />
                          )}
                        </button>
                      ) : (
                        <div className="w-6" /> // Spacer
                      )}

                      {/* Icon */}
                      <FiFolder size={16} className="flex-shrink-0 text-slate-400" />

                      {/* Name & Description */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          {category.level > 0 && (
                            <span className="text-slate-300">└─</span>
                          )}
                          <span className="truncate">{category.name}</span>
                          {category.children && category.children.length > 0 && (
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full font-medium flex-shrink-0">
                              {category.children.length}
                            </span>
                          )}
                        </div>
                        {category.description && (
                          <div className="text-xs text-slate-500 truncate mt-0.5">
                            {category.description}
                          </div>
                        )}
                      </div>

                      {/* Selected Indicator */}
                      {value === category.id && (
                        <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-200 bg-slate-50">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>{displayCategories.length} danh mục</span>
                {selectedCategory && (
                  <span className="font-medium text-slate-700">
                    Đã chọn: {selectedCategory.name}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* =========================
 * USAGE EXAMPLE
 * ========================= */
export function CategorySelectExample() {
  const [selectedCategory, setSelectedCategory] = useState('')

  const mockCategories = [
    {
      id: '1',
      name: 'Linh kiện máy tính',
      parentCategoryId: null,
      description: 'Linh kiện và phần cứng máy tính'
    },
    {
      id: '2',
      name: 'CPU',
      parentCategoryId: '1',
      description: 'Bộ vi xử lý'
    },
    {
      id: '3',
      name: 'RAM',
      parentCategoryId: '1',
      description: 'Bộ nhớ RAM'
    },
    {
      id: '4',
      name: 'Thiết bị ngoại vi',
      parentCategoryId: null,
      description: 'Thiết bị ngoại vi cho máy tính'
    },
    {
      id: '5',
      name: 'Màn hình',
      parentCategoryId: '4',
      description: 'Màn hình máy tính'
    },
  ]

  return (
    <div className="p-8 max-w-md mx-auto">
      <h2 className="text-xl font-semibold mb-4">Category Select Modal Demo</h2>
      
      <CategorySelect
        value={selectedCategory}
        onChange={setSelectedCategory}
        categories={mockCategories}
      />

      {selectedCategory && (
        <div className="mt-4 p-3 bg-blue-50 rounded text-sm">
          Selected: <strong>{mockCategories.find(c => c.id === selectedCategory)?.name}</strong>
        </div>
      )}
    </div>
  )
}