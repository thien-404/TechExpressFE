import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FiGift, FiPackage, FiPlus, FiSearch, FiTrash2 } from "react-icons/fi";

import { apiService } from "../../../config/axios";
import { formatCurrency } from "./promotionHelpers";

const inputClass =
  "h-10 w-full rounded border border-slate-300 px-3 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100 bg-white transition-all";

function SelectedFields({ mode, item, onChange }) {
  if (mode === "required") {
    return (
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">
            Số lượng tối thiểu
          </label>
          <input
            type="number"
            min="1"
            value={item.minQuantity}
            onChange={(e) => onChange({ ...item, minQuantity: e.target.value })}
            className={inputClass}
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">
            Số lượng tối đa
          </label>
          <input
            type="number"
            min="1"
            value={item.maxQuantity ?? ""}
            onChange={(e) => onChange({ ...item, maxQuantity: e.target.value })}
            className={inputClass}
            placeholder="Để trống nếu không giới hạn"
          />
        </div>
      </div>
    );
  }

  if (mode === "free") {
    return (
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-500">
          Số lượng tặng
        </label>
        <input
          type="number"
          min="1"
          value={item.quantity}
          onChange={(e) => onChange({ ...item, quantity: e.target.value })}
          className={inputClass}
        />
      </div>
    );
  }

  return null;
}

export default function PromotionProductSelector({
  title,
  description,
  mode = "applied",
  selectedItems = [],
  onChange,
}) {
  const [query, setQuery] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [pageNumber, setPageNumber] = useState(0);

  const selectedIds = useMemo(
    () => new Set(selectedItems.map((item) => item.productId)),
    [selectedItems],
  );

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["promotion-product-selector", mode, searchTerm, pageNumber],
    queryFn: async () => {
      const res = await apiService.get("/product", {
        Page: pageNumber + 1,
        PageSize: 8,
        Search: searchTerm || undefined,
      });

      if (res?.statusCode !== 200) {
        return { items: [], totalPages: 1 };
      }

      return res.value;
    },
    keepPreviousData: true,
    staleTime: 30_000,
  });

  const rows = data?.items || [];
  const totalPages = data?.totalPages || 1;
  const loading = isLoading || isFetching;

  const handleSearch = () => {
    setPageNumber(0);
    setSearchTerm(query.trim());
  };

  const addProduct = (product) => {
    if (selectedIds.has(product.id)) return;

    const baseItem = {
      productId: product.id,
      productName: product.name,
      sku: product.sku,
      price: product.price,
    };

    if (mode === "required") {
      onChange([...selectedItems, { ...baseItem, minQuantity: 1, maxQuantity: "" }]);
      return;
    }

    if (mode === "free") {
      onChange([...selectedItems, { ...baseItem, quantity: 1 }]);
      return;
    }

    onChange([...selectedItems, baseItem]);
  };

  const removeProduct = (productId) => {
    onChange(selectedItems.filter((item) => item.productId !== productId));
  };

  const updateProduct = (nextItem) => {
    onChange(
      selectedItems.map((item) =>
        item.productId === nextItem.productId ? nextItem : item,
      ),
    );
  };

  return (
    <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white px-4 py-3">
        <div className="flex items-center gap-2">
          <FiGift size={16} className="text-slate-500" />
          <div>
            <div className="text-sm font-semibold text-[#334155]">{title}</div>
            {description && (
              <p className="mt-0.5 text-xs text-slate-500">{description}</p>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-4 p-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
          <div className="relative md:col-span-9">
            <FiSearch
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={16}
            />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className={`${inputClass} pl-10`}
              placeholder="Tìm sản phẩm theo tên hoặc SKU"
            />
          </div>

          <button
            type="button"
            onClick={handleSearch}
            className="h-10 rounded bg-blue-500 px-4 text-sm font-semibold text-white hover:bg-blue-600 md:col-span-3"
          >
            Tìm sản phẩm
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <div className="rounded-lg border border-slate-200">
            <div className="border-b border-slate-100 px-4 py-3 text-sm font-semibold text-slate-700">
              Danh sách sản phẩm
            </div>

            <div className="divide-y divide-slate-100">
              {rows.map((product) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between gap-3 px-4 py-3"
                >
                  <div className="min-w-0">
                    <div className="truncate font-medium text-slate-800">
                      {product.name}
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                      {product.sku} • {formatCurrency(product.price)}
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={selectedIds.has(product.id)}
                    onClick={() => addProduct(product)}
                    className="inline-flex h-9 items-center gap-2 rounded border border-slate-200 px-3 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <FiPlus size={14} />
                    Chọn
                  </button>
                </div>
              ))}

              {!loading && rows.length === 0 && (
                <div className="px-4 py-8 text-center text-sm text-slate-500">
                  Không tìm thấy sản phẩm phù hợp
                </div>
              )}

              {loading && (
                <div className="px-4 py-8 text-center text-sm text-slate-500">
                  Đang tải sản phẩm...
                </div>
              )}
            </div>

            <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-xs text-slate-500">
              <span>Trang {pageNumber + 1}</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPageNumber((prev) => Math.max(0, prev - 1))}
                  disabled={pageNumber === 0 || loading}
                  className="rounded border border-slate-200 px-3 py-1 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Trước
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setPageNumber((prev) => Math.min(totalPages - 1, prev + 1))
                  }
                  disabled={pageNumber >= totalPages - 1 || loading}
                  className="rounded border border-slate-200 px-3 py-1 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Sau
                </button>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-slate-200">
            <div className="border-b border-slate-100 px-4 py-3 text-sm font-semibold text-slate-700">
              Đã chọn ({selectedItems.length})
            </div>

            <div className="space-y-3 p-4">
              {selectedItems.length === 0 && (
                <div className="rounded-lg border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500">
                  Chưa có sản phẩm nào được chọn
                </div>
              )}

              {selectedItems.map((item) => (
                <div
                  key={item.productId}
                  className="rounded-lg border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 font-medium text-slate-800">
                        <FiPackage size={14} className="text-slate-500" />
                        <span className="truncate">{item.productName}</span>
                      </div>
                      <div className="mt-1 text-xs text-slate-500">
                        {item.sku || "Không có SKU"}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeProduct(item.productId)}
                      className="inline-flex h-8 w-8 items-center justify-center rounded text-red-600 hover:bg-red-50"
                      title="Xóa khỏi danh sách"
                    >
                      <FiTrash2 size={14} />
                    </button>
                  </div>

                  {mode !== "applied" && (
                    <div className="mt-4">
                      <SelectedFields
                        mode={mode}
                        item={item}
                        onChange={updateProduct}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
