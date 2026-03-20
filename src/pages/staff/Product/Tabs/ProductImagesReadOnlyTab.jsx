import React from "react";
import { FiImage } from "react-icons/fi";

const T = {
  title: "H\u00ecnh \u1ea3nh s\u1ea3n ph\u1ea9m",
  imageCount: "h\u00ecnh \u1ea3nh",
  empty: "S\u1ea3n ph\u1ea9m ch\u01b0a c\u00f3 h\u00ecnh \u1ea3nh.",
};

export default function ProductImagesReadOnlyTab({ product }) {
  if (!product) return null;

  const images = product.thumbnailUrl || [];

  return (
    <div className="rounded-lg border border-slate-200 bg-white">
      <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FiImage size={16} className="text-slate-500" />
            <span className="text-sm font-semibold text-[#334155]">{T.title}</span>
          </div>
          <span className="text-xs text-slate-500">{images.length} {T.imageCount}</span>
        </div>
      </div>

      <div className="p-6">
        {images.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {images.map((url, index) => (
              <div
                key={`${url}-${index}`}
                className="overflow-hidden rounded-lg border border-slate-200 bg-slate-50"
              >
                <img
                  src={url}
                  alt={`${product.name} - ${index + 1}`}
                  className="aspect-square h-full w-full object-cover"
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="py-16 text-center">
            <FiImage size={48} className="mx-auto mb-4 text-slate-300" />
            <p className="text-sm text-slate-500">{T.empty}</p>
          </div>
        )}
      </div>
    </div>
  );
}