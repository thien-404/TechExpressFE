import React, { useState, useMemo, useRef, useEffect } from 'react'
import { FiChevronDown, FiSearch, FiFolder, FiX } from 'react-icons/fi'

/* =========================
 * CATEGORY SELECT COMPONENT
 * ========================= */
export default function CategorySelect({ 
  value, 
  onChange, 
  categories = [],
  placeholder = "Chọn danh mục" 
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const dropdownRef = useRef(null)

  // Close dropdown when click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  /* =========================
   * BUILD HIERARCHICAL STRUCTURE
   * ========================= */
  const hierarchicalCategories = useMemo(() => {
    const parentCategories = categories.filter(cat => !cat.parentCategoryId)
    const childCategories = categories.filter(cat => cat.parentCategoryId)

    const result = []

    parentCategories.forEach(parent => {
      const children = childCategories.filter(child => child.parentCategoryId === parent.id)
      
      result.push({
        ...parent,
        isParent: true,
        hasChildren: children.length > 0
      })
      
      children.forEach(child => {
        result.push({
          ...child,
          isChild: true,
          parentName: parent.name
        })
      })
    })

    return result
  }, [categories])

  /* =========================
   * FILTER BY SEARCH
   * ========================= */
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return hierarchicalCategories

    const query = searchQuery.toLowerCase()
    return hierarchicalCategories.filter(cat => 
      cat.name.toLowerCase().includes(query) ||
      cat.description?.toLowerCase().includes(query) ||
      cat.parentName?.toLowerCase().includes(query)
    )
  }, [hierarchicalCategories, searchQuery])

  /* =========================
   * SELECTED CATEGORY
   * ========================= */
  const selectedCategory = useMemo(() => {
    return categories.find(cat => cat.id === value)
  }, [categories, value])

  const handleSelect = (categoryId) => {
    onChange(categoryId)
    setIsOpen(false)
    setSearchQuery('')
  }

  const handleClear = (e) => {
    e.stopPropagation()
    onChange('')
    setSearchQuery('')
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
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
          <FiChevronDown 
            size={16} 
            className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          />
        </div>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 mt-2 w-full bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden">
          {/* Search Box */}
          <div className="p-3 border-b border-slate-100 bg-slate-50">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm danh mục..."
                className="w-full h-9 pl-9 pr-3 border border-slate-200 rounded text-sm outline-none focus:border-slate-400 transition-colors"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>

          {/* Category List */}
          <div className="max-h-64 overflow-y-auto">
            {filteredCategories.length === 0 ? (
              <div className="py-8 text-center text-sm text-slate-500">
                Không tìm thấy danh mục
              </div>
            ) : (
              <div className="py-1">
                {filteredCategories.map((category) => (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => handleSelect(category.id)}
                    className={`w-full px-3 py-2.5 text-left text-sm flex items-center gap-2 transition-colors ${
                      value === category.id
                        ? 'bg-blue-50 text-blue-700 font-medium'
                        : 'hover:bg-slate-50 text-slate-700'
                    } ${
                      category.isChild ? 'pl-8' : ''
                    }`}
                  >
                    {/* Icon */}
                    {category.isParent && (
                      category.hasChildren ? (
                        <FiFolder size={16} className="text-slate-400 flex-shrink-0" />
                      ) : (
                        <FiFolder size={16} className="text-slate-400 flex-shrink-0" />
                      )
                    )}
                    
                    {category.isChild && (
                      <span className="text-slate-300 flex-shrink-0">└─</span>
                    )}

                    {/* Name & Description */}
                    <div className="flex-1 min-w-0">
                      <div className="truncate">{category.name}</div>
                      {category.description && (
                        <div className="text-xs text-slate-500 truncate mt-0.5">
                          {category.description}
                        </div>
                      )}
                    </div>

                    {/* Selected Indicator */}
                    {value === category.id && (
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {filteredCategories.length > 0 && (
            <div className="p-2 border-t border-slate-100 bg-slate-50 text-xs text-slate-500 text-center">
              {filteredCategories.length} danh mục
            </div>
          )}
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
      <h2 className="text-xl font-semibold mb-4">Category Select Demo</h2>
      
      <CategorySelect
        value={selectedCategory}
        onChange={setSelectedCategory}
        categories={mockCategories}
      />

      {selectedCategory && (
        <div className="mt-4 p-3 bg-blue-50 rounded text-sm">
          Selected: <strong>{selectedCategory}</strong>
        </div>
      )}
    </div>
  )
}