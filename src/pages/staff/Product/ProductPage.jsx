import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FiPackage, FiSearch } from "react-icons/fi";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

import Pagination from "../../../components/common/Pagination";
import Breadcrumb from "../../../components/ui/Breadcrumb.jsx";
import CategorySelect from "../../../components/ui/select/CategorySelect.jsx";
import { apiService } from "../../../config/axios";

const T = {
  home: "Trang ch\u1ee7",
  title: "Qu\u1ea3n l\u00fd s\u1ea3n ph\u1ea9m",
  total: "T\u1ed5ng c\u1ed9ng",
  products: "s\u1ea3n ph\u1ea9m",
  searchPlaceholder: "T\u00ecm theo t\u00ean, SKU...",
  allCategories: "T\u1ea5t c\u1ea3 danh m\u1ee5c",
  allStatus: "T\u1ea5t c\u1ea3 tr\u1ea1ng th\u00e1i",
  sort: "S\u1eafp x\u1ebfp",
  price: "Gi\u00e1",
  createdAt: "Ng\u00e0y t\u1ea1o",
  stock: "T\u1ed3n kho",
  sortDirection: "H\u01b0\u1edbng s\u1eafp x\u1ebfp",
  asc: "T\u0103ng d\u1ea7n",
  desc: "Gi\u1ea3m d\u1ea7n",
  search: "T\u00ecm",
  filtering: "\u0110ang l\u1ecdc k\u1ebft qu\u1ea3",
  clearFilters: "X\u00f3a b\u1ed9 l\u1ecdc",
  product: "S\u1ea3n ph\u1ea9m",
  category: "Danh m\u1ee5c",
  sku: "SKU",
  status: "Tr\u1ea1ng th\u00e1i",
  emptyTitle: "Kh\u00f4ng t\u00ecm th\u1ea5y s\u1ea3n ph\u1ea9m",
  emptyDesc: "Th\u1eed thay \u0111\u1ed5i t\u1eeb kh\u00f3a t\u00ecm ki\u1ebfm ho\u1eb7c b\u1ed9 l\u1ecdc.",
  loadError: "Kh\u00f4ng th\u1ec3 t\u1ea3i danh s\u00e1ch s\u1ea3n ph\u1ea9m",
};

function StatusBadge({ status }) {
  const variants = {
    Available: "bg-green-100 text-green-700 border-green-200",
    Unavailable: "bg-red-100 text-red-700 border-red-200",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${
        variants[status] || "bg-slate-100 text-slate-700 border-slate-200"
      }`}
    >
      {status}
    </span>
  );
}

function formatPrice(price) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(Number(price || 0));
}

export default function StaffProductPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [status, setStatus] = useState("");
  const [sortBy, setSortBy] = useState("");
  const [sortDirection, setSortDirection] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [pageNumber, setPageNumber] = useState(0);
  const [pageSize] = useState(20);

  const queryParams = {
    Page: pageNumber + 1,
    PageSize: pageSize,
    Search: searchTerm || undefined,
    CategoryId: categoryId || undefined,
    Status: status !== "" ? Number(status) : undefined,
    SortBy: sortBy !== "" ? Number(sortBy) : undefined,
    SortDirection: sortDirection !== "" ? Number(sortDirection) : undefined,
  };

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["staff-products", queryParams],
    queryFn: async () => {
      const res = await apiService.get("/product", queryParams);

      if (res?.statusCode !== 200) {
        toast.error(T.loadError);
        return { items: [], totalCount: 0, totalPages: 1 };
      }

      return res.value;
    },
    keepPreviousData: true,
    staleTime: 30_000,
  });

  const loading = isLoading || isFetching;
  const rows = useMemo(() => data?.items ?? [], [data?.items]);
  const totalItems = data?.totalCount ?? 0;
  const totalPages = data?.totalPages ?? 1;

  const { data: categoriesData } = useQuery({
    queryKey: ["categories-all"],
    queryFn: async () => {
      const res = await apiService.get("/category");
      if (res?.statusCode === 200) {
        return res.value?.items || [];
      }
      return [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const categories = categoriesData || [];

  const handleSearch = () => {
    setPageNumber(0);
    setSearchTerm(query.trim());
  };

  const handleResetFilters = () => {
    setQuery("");
    setSearchTerm("");
    setCategoryId("");
    setStatus("");
    setSortBy("");
    setSortDirection("");
    setPageNumber(0);
  };

  const paddedRows = useMemo(() => {
    const real = rows.slice(0, pageSize);
    const missing = Math.max(0, pageSize - real.length);
    return [...real, ...Array.from({ length: missing }, () => null)];
  }, [rows, pageSize]);

  const hasActiveFilters =
    Boolean(searchTerm) || Boolean(categoryId) || status !== "" || sortBy !== "" || sortDirection !== "";

  return (
    <div className="font-[var(--font-inter)]">
      <Breadcrumb
        items={[
          { label: T.home, href: "/staff" },
          { label: T.title },
        ]}
      />

      <div className="mt-3">
        <h1 className="text-2xl font-semibold text-[#334155]">{T.title}</h1>
        <p className="mt-1 text-sm text-slate-500">
          {T.total} <span className="font-semibold text-blue-600">{totalItems}</span> {T.products}
        </p>
      </div>

      <div className="mt-4 rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white p-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
            <div className="relative md:col-span-3">
              <FiSearch
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                size={18}
              />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") handleSearch();
                }}
                placeholder={T.searchPlaceholder}
                className="h-10 w-full rounded border border-slate-200 pl-10 pr-3 text-sm outline-none transition-all focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
              />
            </div>

            <div className="md:col-span-2">
              <CategorySelect
                value={categoryId}
                onChange={(id) => {
                  setPageNumber(0);
                  setCategoryId(id);
                }}
                categories={categories}
                placeholder={T.allCategories}
              />
            </div>

            <div className="md:col-span-2">
              <select
                value={status}
                onChange={(event) => {
                  setPageNumber(0);
                  setStatus(event.target.value);
                }}
                className="h-10 w-full rounded border border-slate-200 px-3 text-sm outline-none focus:border-slate-400"
              >
                <option value="">{T.allStatus}</option>
                <option value="0">Available</option>
                <option value="1">Unavailable</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <select
                value={sortBy}
                onChange={(event) => {
                  setPageNumber(0);
                  setSortBy(event.target.value);
                  if (sortDirection === "") setSortDirection("0");
                }}
                className="h-10 w-full rounded border border-slate-200 px-3 text-sm outline-none focus:border-slate-400"
              >
                <option value="">{T.sort}</option>
                <option value="0">{T.price}</option>
                <option value="1">{T.createdAt}</option>
                <option value="2">{T.stock}</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <select
                value={sortDirection}
                onChange={(event) => {
                  setPageNumber(0);
                  setSortDirection(event.target.value);
                }}
                className="h-10 w-full rounded border border-slate-200 px-3 text-sm outline-none focus:border-slate-400"
              >
                <option value="">{T.sortDirection}</option>
                <option value="0">{T.asc}</option>
                <option value="1">{T.desc}</option>
              </select>
            </div>

            <div className="md:col-span-1">
              <button
                type="button"
                onClick={handleSearch}
                disabled={loading}
                className="h-10 w-full rounded bg-blue-500 text-sm font-semibold text-white transition-colors hover:bg-blue-600 disabled:opacity-50"
              >
                {T.search}
              </button>
            </div>
          </div>

          {hasActiveFilters && (
            <div className="mt-3 flex items-center justify-between">
              <div className="text-xs text-slate-500">{T.filtering}</div>
              <button
                type="button"
                onClick={handleResetFilters}
                className="text-xs font-medium text-blue-600 hover:text-blue-700"
              >
                {T.clearFilters}
              </button>
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b-2 border-slate-200 bg-gradient-to-r from-slate-50 to-slate-100">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-600">
                  {T.product}
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-600">
                  {T.category}
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-600">
                  {T.sku}
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-600">
                  {T.price}
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-600">
                  {T.stock}
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-600">
                  {T.status}
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {paddedRows.map((product, index) => {
                if (!product) {
                  return (
                    <tr key={`empty-${index}`} className="bg-slate-50">
                      <td colSpan={6} className="px-6 py-4">
                        <div className="h-12" />
                      </td>
                    </tr>
                  );
                }

                const stock = product.stockQty ?? product.stock ?? 0;

                return (
                  <tr
                    key={product.id}
                    className="cursor-pointer transition-colors hover:bg-blue-50"
                    onClick={() => navigate(`/staff/products/${product.id}`)}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {product.firstImageUrl ? (
                          <img
                            src={product.firstImageUrl}
                            alt={product.name}
                            className="h-12 w-12 rounded-lg border border-slate-200 object-cover"
                          />
                        ) : (
                          <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-slate-200 bg-slate-100">
                            <FiPackage className="text-slate-400" size={20} />
                          </div>
                        )}

                        <div className="font-semibold text-slate-800">{product.name}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-700">{product.categoryName || "-"}</td>
                    <td className="px-6 py-4">
                      <code className="rounded bg-slate-100 px-2 py-1 text-xs">{product.sku}</code>
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-700">{formatPrice(product.price)}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`font-medium ${
                          stock <= 10
                            ? "text-red-600"
                            : stock <= 30
                              ? "text-orange-600"
                              : "text-green-600"
                        }`}
                      >
                        {stock}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={product.status} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {!loading && rows.length === 0 && (
          <div className="py-16 text-center">
            <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
              <FiPackage className="text-slate-400" size={32} />
            </div>
            <h3 className="mb-1 text-lg font-semibold text-slate-700">{T.emptyTitle}</h3>
            <p className="text-sm text-slate-500">{T.emptyDesc}</p>
          </div>
        )}
      </div>

      <div className="mt-4 flex justify-center">
        <Pagination
          loading={loading}
          pageNumber={pageNumber}
          pageSize={pageSize}
          totalItems={totalItems}
          totalPages={totalPages}
          onPageChange={setPageNumber}
        />
      </div>
    </div>
  );
}