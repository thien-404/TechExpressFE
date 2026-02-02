import React from "react"
import { FiCpu } from "react-icons/fi"

/* =========================
 * SPEC ROW
 * ========================= */
const SpecRow = ({ spec }) => {
  const displayValue = spec.unit 
    ? `${spec.value} ${spec.unit}`
    : spec.value

  return (
    <div className="flex items-center justify-between py-3 px-4 border-b border-slate-100 last:border-b-0 hover:bg-slate-50 transition-colors">
      <div className="flex items-center gap-2">
        <FiCpu size={14} className="text-slate-400" />
        <span className="text-sm text-slate-600">{spec.specName}</span>
        {spec.code && (
          <code className="text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-500">
            {spec.code}
          </code>
        )}
      </div>
      <div className="text-sm font-semibold text-slate-700">
        {displayValue}
      </div>
    </div>
  )
}

/* =========================
 * PRODUCT SPECS TAB
 * ========================= */
export default function ProductSpecsTab({ product }) {
  if (!product) return null

  const specs = product.specValues || []

  return (
    <div className="max-w-4xl">
      <div className="rounded-lg border border-slate-200 bg-white">
        <div className="px-4 py-3 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FiCpu size={16} className="text-slate-500" />
              <span className="text-sm font-semibold text-[#334155]">
                Thông số kỹ thuật
              </span>
            </div>
            <span className="text-xs text-slate-500">
              {specs.length} thông số
            </span>
          </div>
        </div>

        {specs.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {specs.map((spec, idx) => (
              <SpecRow key={idx} spec={spec} />
            ))}
          </div>
        ) : (
          <div className="p-12 text-center">
            <FiCpu size={48} className="mx-auto text-slate-300 mb-4" />
            <p className="text-sm text-slate-500">
              Chưa có thông số kỹ thuật
            </p>
          </div>
        )}
      </div>
    </div>
  )
}