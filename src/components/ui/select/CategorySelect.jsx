import React, { useEffect, useMemo, useState } from "react";
import { FiChevronDown, FiChevronRight, FiFolder, FiLoader, FiSearch, FiX } from "react-icons/fi";

import { apiService } from "../../../config/axios";

/* =========================
 * CATEGORY SELECT WITH MODAL
 * ========================= */
export default function CategorySelect({
  value,
  onChange,
  categories = [],
  placeholder = "Chọn danh mục",
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [expandedCategories, setExpandedCategories] = useState(new Set());
  const [page, setPage] = useState(1);
  const [pageItems, setPageItems] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selectedCategoryData, setSelectedCategoryData] = useState(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearchQuery(searchQuery.trim());
    }, 300);

    return () => window.clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearchQuery]);

  useEffect(() => {
    setExpandedCategories(new Set());
  }, [pageItems]);

  useEffect(() => {
    let ignore = false;

    if (!isOpen) return undefined;

    const fetchCategories = async () => {
      setLoading(true);

      const res = await apiService.get("/Category", {
        SearchName: debouncedSearchQuery || undefined,
        Page: page,
      });

      if (ignore) return;

      if (res?.statusCode === 200) {
        setPageItems(Array.isArray(res.value?.items) ? res.value.items : []);
        setTotalPages(Math.max(Number(res.value?.totalPages || 1), 1));
        setTotalCount(Number(res.value?.totalCount || 0));
      } else {
        setPageItems([]);
        setTotalPages(1);
        setTotalCount(0);
      }

      setLoading(false);
    };

    fetchCategories();

    return () => {
      ignore = true;
    };
  }, [debouncedSearchQuery, isOpen, page]);

  useEffect(() => {
    let ignore = false;

    if (!value) {
      setSelectedCategoryData(null);
      return undefined;
    }

    const selectedFromKnownLists =
      pageItems.find((category) => category.id === value) ||
      categories.find((category) => category.id === value);

    if (selectedFromKnownLists) {
      setSelectedCategoryData(selectedFromKnownLists);
      return undefined;
    }

    const fetchSelectedCategory = async () => {
      const res = await apiService.get(`/Category/${value}`);

      if (ignore) return;

      if (res?.statusCode === 200 && res.value) {
        setSelectedCategoryData(res.value);
      } else {
        setSelectedCategoryData(null);
      }
    };

    fetchSelectedCategory();

    return () => {
      ignore = true;
    };
  }, [categories, pageItems, value]);

  const activeCategories = useMemo(() => {
    if (pageItems.length > 0 || isOpen) return pageItems;
    return categories;
  }, [categories, isOpen, pageItems]);

  const hierarchicalCategories = useMemo(() => {
    const categoryMap = new Map();
    const rootCategories = [];

    activeCategories.forEach((category) => {
      categoryMap.set(category.id, { ...category, children: [] });
    });

    activeCategories.forEach((category) => {
      const currentCategory = categoryMap.get(category.id);

      if (category.parentCategoryId) {
        const parentCategory = categoryMap.get(category.parentCategoryId);

        if (parentCategory) {
          parentCategory.children.push(currentCategory);
        } else {
          rootCategories.push(currentCategory);
        }
      } else {
        rootCategories.push(currentCategory);
      }
    });

    return rootCategories;
  }, [activeCategories]);

  const displayCategories = useMemo(() => {
    const flattened = [];

    const flatten = (items, level = 0) => {
      items.forEach((category) => {
        flattened.push({ ...category, level });

        if (category.children?.length > 0 && expandedCategories.has(category.id)) {
          flatten(category.children, level + 1);
        }
      });
    };

    flatten(hierarchicalCategories);
    return flattened;
  }, [expandedCategories, hierarchicalCategories]);

  const selectedCategory = useMemo(() => {
    return (
      pageItems.find((category) => category.id === value) ||
      categories.find((category) => category.id === value) ||
      selectedCategoryData
    );
  }, [categories, pageItems, selectedCategoryData, value]);

  const openModal = () => {
    setIsOpen(true);
    setSearchQuery("");
    setDebouncedSearchQuery("");
    setPage(1);
    setExpandedCategories(new Set());
  };

  const closeModal = () => {
    setIsOpen(false);
    setExpandedCategories(new Set());
  };

  const handleSelect = (categoryId) => {
    const nextSelectedCategory =
      activeCategories.find((category) => category.id === categoryId) ||
      selectedCategoryData;

    onChange(categoryId);
    if (nextSelectedCategory) {
      setSelectedCategoryData(nextSelectedCategory);
    }
    closeModal();
  };

  const handleClear = (event) => {
    event.stopPropagation();
    setSelectedCategoryData(null);
    onChange("");
  };

  const toggleCategory = (categoryId, event) => {
    event.stopPropagation();

    setExpandedCategories((prev) => {
      const next = new Set(prev);

      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }

      return next;
    });
  };

  const expandAll = () => {
    const allParentIds = activeCategories
      .filter((category) => activeCategories.some((item) => item.parentCategoryId === category.id))
      .map((category) => category.id);

    setExpandedCategories(new Set(allParentIds));
  };

  const collapseAll = () => {
    setExpandedCategories(new Set());
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={openModal}
        className="flex h-10 w-full items-center justify-between rounded border border-slate-200 bg-white px-3 text-left text-sm outline-none transition-all focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
      >
        <span className={selectedCategory ? "text-slate-700" : "text-slate-400"}>
          {selectedCategory?.name || placeholder}
        </span>

        <div className="flex items-center gap-1">
          {selectedCategory ? (
            <div
              onClick={handleClear}
              className="cursor-pointer rounded p-0.5 transition-colors hover:bg-slate-100"
            >
              <FiX size={14} className="text-slate-400" />
            </div>
          ) : null}
          <FiChevronDown size={16} className="text-slate-400" />
        </div>
      </button>

      {isOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="flex max-h-[80vh] w-full max-w-2xl flex-col rounded-lg bg-white shadow-xl">
            <div className="border-b border-slate-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-800">Chọn danh mục</h3>
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-lg p-2 transition-colors hover:bg-slate-100"
                >
                  <FiX size={20} className="text-slate-500" />
                </button>
              </div>
            </div>

            <div className="space-y-3 border-b border-slate-200 px-6 py-4">
              <div className="relative">
                <FiSearch
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  size={18}
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Tìm kiếm theo tên danh mục..."
                  className="w-full rounded-lg border border-slate-300 py-2.5 pl-10 pr-4 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={expandAll}
                  className="flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  <FiChevronDown size={16} />
                  Mở rộng tất cả
                </button>
                <button
                  type="button"
                  onClick={collapseAll}
                  className="flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  <FiChevronRight size={16} />
                  Thu gọn tất cả
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4">
              {loading ? (
                <div className="flex items-center justify-center gap-2 py-12 text-sm text-slate-500">
                  <FiLoader size={16} className="animate-spin" />
                  Đang tải danh mục...
                </div>
              ) : displayCategories.length === 0 ? (
                <div className="py-12 text-center text-sm text-slate-500">
                  Không tìm thấy danh mục
                </div>
              ) : (
                <div className="space-y-1">
                  {displayCategories.map((category) => (
                    <div
                      key={category.id}
                      className={`flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2.5 transition-colors ${
                        value === category.id
                          ? "bg-blue-50 font-medium text-blue-700"
                          : "text-slate-700 hover:bg-slate-50"
                      }`}
                      style={{ paddingLeft: `${12 + category.level * 24}px` }}
                      onClick={() => handleSelect(category.id)}
                    >
                      {category.children?.length > 0 ? (
                        <button
                          type="button"
                          onClick={(event) => toggleCategory(category.id, event)}
                          className="flex-shrink-0 rounded p-1 transition hover:bg-slate-200"
                        >
                          {expandedCategories.has(category.id) ? (
                            <FiChevronDown size={16} className="text-slate-600" />
                          ) : (
                            <FiChevronRight size={16} className="text-slate-600" />
                          )}
                        </button>
                      ) : (
                        <div className="w-6" />
                      )}

                      <FiFolder size={16} className="flex-shrink-0 text-slate-400" />

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          {category.level > 0 ? <span className="text-slate-300">└─</span> : null}
                          <span className="truncate">{category.name}</span>
                          {category.children?.length > 0 ? (
                            <span className="flex-shrink-0 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                              {category.children.length}
                            </span>
                          ) : null}
                        </div>
                        {category.description ? (
                          <div className="mt-0.5 truncate text-xs text-slate-500">
                            {category.description}
                          </div>
                        ) : null}
                      </div>

                      {value === category.id ? (
                        <div className="h-2 w-2 flex-shrink-0 rounded-full bg-blue-500" />
                      ) : null}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="border-t border-slate-200 bg-slate-50 px-6 py-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center justify-between gap-4 text-xs text-slate-500">
                  <span>{totalCount} danh mục</span>
                  {selectedCategory ? (
                    <span className="font-medium text-slate-700">Đã chọn: {selectedCategory.name}</span>
                  ) : null}
                </div>

                <div className="flex items-center justify-between gap-3 sm:justify-end">
                  <span className="text-xs text-slate-500">
                    Trang {Math.min(page, totalPages)}/{totalPages}
                  </span>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                      disabled={loading || page <= 1}
                      className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Trang trước
                    </button>
                    <button
                      type="button"
                      onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                      disabled={loading || page >= totalPages}
                      className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Trang sau
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

/* =========================
 * USAGE EXAMPLE
 * ========================= */
export function CategorySelectExample() {
  const [selectedCategory, setSelectedCategory] = useState("");

  return (
    <div className="mx-auto max-w-md p-8">
      <h2 className="mb-4 text-xl font-semibold">Category Select Modal Demo</h2>

      <CategorySelect
        value={selectedCategory}
        onChange={setSelectedCategory}
      />

      {selectedCategory ? (
        <div className="mt-4 rounded bg-blue-50 p-3 text-sm">
          Selected category id: <strong>{selectedCategory}</strong>
        </div>
      ) : null}
    </div>
  );
}
