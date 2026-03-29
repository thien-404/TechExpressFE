import { useQuery } from "@tanstack/react-query";

import { apiService } from "../config/axios";

const BUILD_PC_CATEGORIES_STALE_TIME = 5 * 60 * 1000;

export default function useBuildPcCategories() {
  return useQuery({
    queryKey: ["build-pc-categories"],
    queryFn: async () => {
      const response = await apiService.get("/Category/buildPC");

      if (response?.statusCode !== 200) {
        throw new Error(response?.message || "Không thể tải danh mục build PC");
      }

      return Array.isArray(response.value) ? response.value : [];
    },
    staleTime: BUILD_PC_CATEGORIES_STALE_TIME,
  });
}
