import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import { apiService } from "../config/axios";

const CATEGORY_UI_STALE_TIME = 5 * 60 * 1000;

function buildCategoryTree(categories = []) {
  const categoryTreeMap = new Map();
  const rootCategories = [];

  categories.forEach((category) => {
    categoryTreeMap.set(category.id, { ...category, children: [] });
  });

  categories.forEach((category) => {
    const currentCategory = categoryTreeMap.get(category.id);

    if (!currentCategory) return;

    if (category.parentCategoryId) {
      const parentCategory = categoryTreeMap.get(category.parentCategoryId);

      if (parentCategory) {
        parentCategory.children.push(currentCategory);
        return;
      }
    }

    rootCategories.push(currentCategory);
  });

  return rootCategories;
}

export default function useCategoriesUi() {
  const { data: categories = [], isLoading, isFetching } = useQuery({
    queryKey: ["categories-ui"],
    queryFn: async () => {
      const res = await apiService.get("/Category/ui");

      if (res?.statusCode === 200 && Array.isArray(res.value)) {
        return res.value;
      }

      return [];
    },
    staleTime: CATEGORY_UI_STALE_TIME,
  });

  const categoryMap = useMemo(() => {
    const nextCategoryMap = new Map();

    categories.forEach((category) => {
      nextCategoryMap.set(category.id, category);
    });

    return nextCategoryMap;
  }, [categories]);

  const rootCategories = useMemo(() => buildCategoryTree(categories), [categories]);

  return {
    categories,
    rootCategories,
    categoryMap,
    isLoading,
    isFetching,
  };
}
