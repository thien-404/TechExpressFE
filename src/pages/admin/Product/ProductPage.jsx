import React, { useMemo, useState } from "react";
import { toast } from "sonner";
import { FiSearch, FiSliders, FiPackage, FiPlus } from "react-icons/fi";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { queryClient } from "../../../config/queryClient";

import Pagination from "../../../components/common/Pagination";
import RowActions from "../../../components/common/RowActions";
import Breadcrumb from "../../../components/ui/Breadcrumb.jsx";
import CategorySelect from "../../../components/ui/select/CategorySelect.jsx";
import { apiService } from "../../../config/axios";

/* =========================
 * STATUS BADGE
 * ========================= */
const StatusBadge = ({ status }) => {
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
};

/* =========================
 * FORMAT PRICE
 * ========================= */
const formatPrice = (price) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(price);

/* =========================
 * MAIN PAGE
 * ========================= */
export default function ProductPage() {
  const navigate = useNavigate();

  // Form states
  const [query, setQuery] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [status, setStatus] = useState("");
  const [sortBy, setSortBy] = useState("");
  const [sortDirection, setSortDirection] = useState("");

  // Search term (only update on button click)
  const [searchTerm, setSearchTerm] = useState("");

  // Pagination
  const [pageNumber, setPageNumber] = useState(0);
  const [pageSize] = useState(20);

  /* =========================
   * FETCH PRODUCTS
   * ========================= */
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
    queryKey: ["products", queryParams],
    queryFn: async () => {
      const res = await apiService.get("/product", queryParams);

      if (res?.statusCode !== 200) {
        toast.error("Không thể tải danh sách sản phẩm");
        return { items: [], totalCount: 0, totalPages: 1 };
      }

      return res.value;
    },
    keepPreviousData: true,
    staleTime: 30_000,
  });

  const loading = isLoading || isFetching;
  const rows = data?.items ?? [];
  const totalItems = data?.totalCount ?? 0;
  const totalPages = data?.totalPages ?? 1;

  /* =========================
   * FETCH CATEGORIES (for filter)
   * ========================= */
  const { data: categoriesData } = useQuery({
    queryKey: ["categories-all"],
    queryFn: async () => {
      const res = await apiService.get("/category");
      if (res?.statusCode === 200) {
        return res.value?.items || [];
      }
      return [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const categories = categoriesData || [];

  /* =========================
   * SEARCH HANDLER
   * ========================= */
  const handleSearch = () => {
    setPageNumber(0);
    setSearchTerm(query.trim());
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  /* =========================
   * DELETE MUTATION
   * ========================= */
  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const res = await apiService.delete(`/product/${id}`);

      if (res?.statusCode !== 200) {
        throw new Error(res?.message || "Xóa sản phẩm thất bại");
      }

      return res;
    },
    onSuccess: () => {
      toast.success("Đã xóa sản phẩm thành công");
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (err) => {
      toast.error(err?.message || "Xóa sản phẩm thất bại");
    },
  });

  const handleDelete = (id, name) => {
    const confirmed = window.confirm(
      `Bạn có chắc muốn xóa sản phẩm "${name}"?\n\nHành động này không thể hoàn tác.`,
    );

    if (confirmed) {
      deleteMutation.mutate(id);
    }
  };

  /* =========================
   * RESET FILTERS
   * ========================= */
  const handleResetFilters = () => {
    setQuery("");
    setSearchTerm("");
    setCategoryId("");
    setStatus("");
    setSortBy("");
    setSortDirection("");
    setPageNumber(0);
  };

  /* =========================
   * PAD ROWS
   * ========================= */
  const paddedRows = useMemo(() => {
    const real = rows.slice(0, pageSize);
    const missing = Math.max(0, pageSize - real.length);
    return [...real, ...Array.from({ length: missing }, () => null)];
  }, [rows, pageSize]);

  const hasActiveFilters =
    searchTerm || categoryId || status !== "" || sortBy !== "" || sortDirection !== "";

  /* =========================
   * RENDER
   * ========================= */
  return (
    <div className="font-[var(--font-inter)]">
      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { label: "Trang chủ", href: "/admin" },
          { label: "Quản lý sản phẩm" },
        ]}
      />

      {/* Header */}
      <div className="mt-3 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#334155]">
            Quản lý sản phẩm
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Tổng cộng{" "}
            <span className="font-semibold text-blue-600">{totalItems}</span>{" "}
            sản phẩm
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate("/admin/products/create")}
          className="flex items-center gap-2 h-9 rounded bg-[#6e846f] px-4 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
        >
          <FiPlus size={16} />
          Thêm sản phẩm
        </button>
      </div>

      {/* Main Card */}
      <div className="mt-4 rounded-lg border border-slate-200 bg-white shadow-sm">
        {/* Toolbar */}
        <div className="p-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
            {/* Search Input */}
            <div className="md:col-span-3 relative">
              <FiSearch
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                size={18}
              />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Tìm theo tên, SKU..."
                className="h-10 w-full rounded border border-slate-200 pl-10 pr-3 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100 transition-all"
              />
            </div>

            {/* Category Filter */}
            <div className="md:col-span-2">
              <CategorySelect
                value={categoryId}
                onChange={(id) => {
                  setPageNumber(0);
                  setCategoryId(id);
                }}
                categories={categories}
                placeholder="Tất cả danh mục"
              />
            </div>

            {/* Status Filter */}
            <div className="md:col-span-2">
              <select
                value={status}
                onChange={(e) => {
                  setPageNumber(0);
                  setStatus(e.target.value);
                }}
                className="h-10 w-full rounded border border-slate-200 px-3 text-sm outline-none focus:border-slate-400"
              >
                <option value="">Tất cả trạng thái</option>
                <option value="0">Available</option>
                <option value="1">Unavailable</option>
              </select>
            </div>

            {/* Sort By */}
            <div className="md:col-span-2">
              <select
                value={sortBy}
                onChange={(e) => {
                  setPageNumber(0);
                  setSortBy(e.target.value);
                  if(sortDirection==="") {
                    setSortDirection("0");
                  }
                }}
                className="h-10 w-full rounded border border-slate-200 px-3 text-sm outline-none focus:border-slate-400"
              >
                <option value="">Sắp xếp</option>
                <option value="0">Giá</option>
                <option value="1">Ngày tạo</option>
                <option value="2">Tồn Kho</option>
              </select>
            </div>

            {/* Sort Direction */}
            <div className="md:col-span-2">
              <select
                value={sortDirection}
                onChange={(e) => {
                  setPageNumber(0);
                  setSortDirection(e.target.value);
                }}
                className="h-10 w-full rounded border border-slate-200 px-3 text-sm outline-none focus:border-slate-400"
              >
                <option value="">Hướng sắp xếp</option>
                <option value="0">Tăng dần</option>
                <option value="1">Giảm dần</option>
              </select>
            </div>

            {/* Search Button */}
            <div className="md:col-span-2 flex gap-2">
              <button
                type="button"
                onClick={handleSearch}
                disabled={loading}
                className="flex-1 h-10 rounded bg-blue-500 text-white text-sm font-semibold hover:bg-blue-600 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              >
                <FiSearch size={16} />
                Tìm kiếm
              </button>
            </div>
          </div>

          {/* Active Filters & Reset */}
          {hasActiveFilters && (
            <div className="mt-3 flex items-center justify-between">
              <div className="text-xs text-slate-500">Đang lọc kết quả</div>
              <button
                type="button"
                onClick={handleResetFilters}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium"
              >
                Xóa bộ lọc
              </button>
            </div>
          )}
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gradient-to-r from-slate-50 to-slate-100 border-b-2 border-slate-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                  Sản phẩm
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                  Danh mục
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                  SKU
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                  Giá
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                  Tồn kho
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                  Trạng thái
                </th>
                <th className="px-6 py-4 text-center text-xs font-bold text-slate-600 uppercase tracking-wider">
                  Thao tác
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {paddedRows.map((product, idx) => {
                if (!product) {
                  return (
                    <tr key={`empty-${idx}`} className="bg-slate-50">
                      <td colSpan={7} className="px-6 py-4">
                        <div className="h-12" />
                      </td>
                    </tr>
                  );
                }

                return (
                  <tr
                    key={product.id}
                    className="hover:bg-blue-50 transition-colors cursor-pointer"
                    onClick={() => navigate(`/admin/products/${product.id}`)}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {product.firstImageUrl ? (
                          <img
                            src={product.firstImageUrl}
                            alt={product.name}
                            className="h-12 w-12 rounded-lg object-cover border border-slate-200"
                          />
                        ) : (
                          <div className="h-12 w-12 flex items-center justify-center rounded-lg bg-slate-100 border border-slate-200">
                            <FiPackage className="text-slate-400" size={20} />
                          </div>
                        )}

                        <div className="font-semibold text-slate-800">
                          {product.name}
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-slate-700">
                      {product.categoryName || "-"}
                    </td>

                    <td className="px-6 py-4">
                      <code className="text-xs bg-slate-100 px-2 py-1 rounded">
                        {product.sku}
                      </code>
                    </td>

                    <td className="px-6 py-4 font-semibold text-slate-700">
                      {formatPrice(product.price)}
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`font-medium ${
                          product.stockQty <= 10
                            ? "text-red-600"
                            : product.stockQty <= 30
                              ? "text-orange-600"
                              : "text-green-600"
                        }`}
                      >
                        {product.stockQty}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <StatusBadge status={product.status} />
                    </td>

                    <td
                      className="px-6 py-4"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex justify-center">
                        <RowActions
                          showStatusActions={false}
                          onDetail={() =>
                            navigate(`/admin/products/${product.id}`)
                          }
                          onUpdate={() =>
                            navigate(`/admin/products/${product.id}/edit`)
                          }
                          onDelete={() =>
                            handleDelete(product.id, product.name)
                          }
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {!loading && rows.length === 0 && (
          <div className="py-16 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-100 rounded-full mb-4">
              <FiPackage className="text-slate-400" size={32} />
            </div>
            <h3 className="text-lg font-semibold text-slate-700 mb-1">
              Không tìm thấy sản phẩm
            </h3>
            <p className="text-sm text-slate-500">
              Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc
            </p>
          </div>
        )}
      </div>

      {/* Pagination */}
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
