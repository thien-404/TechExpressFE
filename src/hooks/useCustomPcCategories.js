import { useQuery } from "@tanstack/react-query";

import { apiService } from "../config/axios";

const CUSTOM_PC_PARENT_SEARCH_NAME = "Linh kiện PC";
const CUSTOM_PC_CATEGORIES_STALE_TIME = 5 * 60 * 1000;

const normalizeText = (value) =>
  String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

const getCategoryItems = (response) =>
  response?.statusCode === 200 && Array.isArray(response.value?.items) ? response.value.items : [];

export default function useCustomPcCategories() {
  return useQuery({
    queryKey: ["custom-pc-categories", CUSTOM_PC_PARENT_SEARCH_NAME],
    queryFn: async () => {
      const parentResponse = await apiService.get("/Category", {
        SearchName: CUSTOM_PC_PARENT_SEARCH_NAME,
        Page: 1,
      });
      const parentItems = getCategoryItems(parentResponse);

      if (!parentItems.length) return [];

      const exactParentMatch = parentItems.find(
        (category) => normalizeText(category?.name) === normalizeText(CUSTOM_PC_PARENT_SEARCH_NAME)
      );
      const resolvedParentId = exactParentMatch?.id || parentItems[0]?.id;

      if (!resolvedParentId) return [];

      const childCategoriesResponse = await apiService.get("/Category", {
        ParentId: resolvedParentId,
        Page: 1,
      });

      return getCategoryItems(childCategoriesResponse);
    },
    staleTime: CUSTOM_PC_CATEGORIES_STALE_TIME,
  });
}
