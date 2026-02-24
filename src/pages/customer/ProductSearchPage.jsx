import ProductListBase from "./ProductListBase";

export default function ProductSearchPage() {
  return (
    <ProductListBase
      mode="search"
      pageTitle={({ search }) =>
        search ? `Kết quả tìm kiếm: "${search}"` : "Tìm kiếm sản phẩm"
      }
      subtitleBuilder={(_, __, context) => {
        if (!context.search) {
          return "Nhập từ khóa để tìm sản phẩm";
        }
        return context.loading
          ? "Đang tải kết quả..."
          : `${context.totalCount} kết quả cho "${context.search}"`;
      }}
      emptyStateConfig={{
        title: "Không có kết quả phù hợp",
        description: "Thử từ khóa ngắn gọn hơn hoặc đổi bộ lọc sắp xếp.",
      }}
      allowCategoryChip={false}
      requireSearchKeyword
    />
  );
}
