import ProductListBase from "./ProductListBase";

export default function ProductCategoryPage() {
  return (
    <ProductListBase
      mode="category"
      pageTitle={({ categoryName }) => categoryName || "Danh mục sản phẩm"}
      subtitleBuilder={(_, __, context) =>
        context.loading ? "Danh sách..." : `${context.totalCount} sản phẩm`
      }
      emptyStateConfig={{
        title: "Không tìm thấy sản phẩm",
        description: "Thử điều chỉnh bộ lọc hoặc tìm kiếm để tìm sản phẩm bạn muốn.",
      }}
      allowCategoryChip
      requireSearchKeyword={false}
    />
  );
}
