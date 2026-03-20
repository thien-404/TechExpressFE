import React from "react";
import { FiCpu } from "react-icons/fi";

const T = {
  specs: "Th\u00f4ng s\u1ed1 k\u1ef9 thu\u1eadt",
  specCount: "th\u00f4ng s\u1ed1",
  empty: "Ch\u01b0a c\u00f3 th\u00f4ng s\u1ed1 k\u1ef9 thu\u1eadt.",
};

function SpecRow({ spec }) {
  const displayValue = spec.unit ? `${spec.value} ${spec.unit}` : spec.value;

  return (
    <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 transition-colors last:border-b-0 hover:bg-slate-50">
      <div className="flex items-center gap-2">
        <FiCpu size={14} className="text-slate-400" />
        <span className="text-sm text-slate-600">{spec.specName}</span>
        {spec.code && (
          <code className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
            {spec.code}
          </code>
        )}
      </div>
      <div className="text-sm font-semibold text-slate-700">{displayValue}</div>
    </div>
  );
}

export default function ProductSpecsTab({ product }) {
  if (!product) return null;

  const specs = product.specValues || [];

  return (
    <div className="max-w-4xl">
      <div className="rounded-lg border border-slate-200 bg-white">
        <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FiCpu size={16} className="text-slate-500" />
              <span className="text-sm font-semibold text-[#334155]">{T.specs}</span>
            </div>
            <span className="text-xs text-slate-500">{specs.length} {T.specCount}</span>
          </div>
        </div>

        {specs.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {specs.map((spec, index) => (
              <SpecRow key={`${spec.code || spec.specName || "spec"}-${index}`} spec={spec} />
            ))}
          </div>
        ) : (
          <div className="p-12 text-center">
            <FiCpu size={48} className="mx-auto mb-4 text-slate-300" />
            <p className="text-sm text-slate-500">{T.empty}</p>
          </div>
        )}
      </div>
    </div>
  );
}