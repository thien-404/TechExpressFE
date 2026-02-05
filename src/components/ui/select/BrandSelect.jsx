import React, { useState, useMemo } from "react"
import { FiChevronDown, FiSearch, FiX, FiTag } from "react-icons/fi"

/* =========================
 * BRAND SELECT WITH MODAL
 * ========================= */
export default function BrandSelect({
  value,
  onChange,
  brands = [],
  placeholder = "Chọn thương hiệu",
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  /* =========================
   * FILTER BRANDS
   * ========================= */
  const displayBrands = useMemo(() => {
    if (!searchQuery.trim()) return brands
    return brands.filter((b) =>
      b.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [brands, searchQuery])

  /* =========================
   * SELECTED BRAND
   * ========================= */
  const selectedBrand = useMemo(() => {
    return brands.find((b) => b.id === value)
  }, [brands, value])

  /* =========================
   * HANDLERS
   * ========================= */
  const handleSelect = (brandId) => {
    onChange(brandId)
    setIsOpen(false)
    setSearchQuery("")
  }

  const handleClear = (e) => {
    e.stopPropagation()
    onChange("")
  }

  return (
    <div className="relative">
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="h-10 w-full rounded border border-slate-200 px-3 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100 transition-all bg-white text-left flex items-center justify-between"
      >
        <span className={selectedBrand ? "text-slate-700" : "text-slate-400"}>
          {selectedBrand?.name || placeholder}
        </span>

        <div className="flex items-center gap-1">
          {selectedBrand && (
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
          <div className="bg-white rounded-lg w-full max-w-xl max-h-[80vh] flex flex-col shadow-xl">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-800">
                  Chọn thương hiệu
                </h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <FiX size={20} className="text-slate-500" />
                </button>
              </div>
            </div>

            {/* Search */}
            <div className="px-6 py-4 border-b border-slate-200">
              <div className="relative">
                <FiSearch
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  size={18}
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm kiếm theo tên thương hiệu..."
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  autoFocus
                />
              </div>
            </div>

            {/* Brand List */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {displayBrands.length === 0 ? (
                <div className="py-12 text-center text-sm text-slate-500">
                  Không tìm thấy thương hiệu
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {displayBrands.map((brand) => (
                    <div
                      key={brand.id}
                      onClick={() => handleSelect(brand.id)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors cursor-pointer border ${
                        value === brand.id
                          ? "bg-blue-50 border-blue-200 text-blue-700 font-medium"
                          : "border-slate-200 hover:bg-slate-50 text-slate-700"
                      }`}
                    >
                      {/* Logo */}
                      {brand.imageUrl ? (
                        <img
                          src={brand.imageUrl}
                          alt={brand.name}
                          className="h-8 w-8 object-contain"
                        />
                      ) : (
                        <FiTag size={20} className="text-slate-400" />
                      )}

                      <span className="truncate">{brand.name}</span>

                      {value === brand.id && (
                        <div className="ml-auto w-2 h-2 rounded-full bg-blue-500" />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-200 bg-slate-50">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>{displayBrands.length} thương hiệu</span>
                {selectedBrand && (
                  <span className="font-medium text-slate-700">
                    Đã chọn: {selectedBrand.name}
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
