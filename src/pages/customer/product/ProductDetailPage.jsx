import { useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useDispatch } from "react-redux";
import {
  ChevronLeft,
  ChevronRight,
  Package,
  Minus,
  Plus,
  ShoppingCart,
  Star,
} from "lucide-react";
import { toast } from "sonner";
import { apiService } from "../../../config/axios";
import { useAuth } from "../../../store/authContext";
import { addCartItem } from "../../../store/slices/cartSlice";
import ProductCard from "../../../components/customer/ProductCard";

function formatPrice(value) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(value || 0);
}

function SectionAccordion({ title, open, onToggle, children }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
      <button
        type="button"
        className="w-full px-4 py-3 text-left flex items-center justify-between"
        onClick={onToggle}
      >
        <span className="font-semibold text-slate-800">{title}</span>
        <span className="text-slate-500">{open ? "-" : "+"}</span>
      </button>
      {open && <div className="px-4 pb-4">{children}</div>}
    </div>
  );
}

export default function ProductDetailPage() {
  const { productId } = useParams();
  const dispatch = useDispatch();
  const { isAuthenticated } = useAuth();
  const mobileCarouselRef = useRef(null);

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [openSection, setOpenSection] = useState("description");

  const { data: product, isLoading, isError } = useQuery({
    enabled: !!productId,
    queryKey: ["customer-product-detail", productId],
    queryFn: async () => {
      const res = await apiService.get(`/product/${productId}`);
      if (res?.statusCode !== 200) {
        throw new Error(res?.message || "Không thể tải thông tin sản phẩm");
      }
      return res.value;
    },
  });

  const { data: relatedProducts = [], isLoading: relatedLoading } = useQuery({
    enabled: !!product?.categoryId,
    queryKey: ["customer-related-products", product?.categoryId],
    queryFn: async () => {
      const res = await apiService.get("/product/ui", {
        CategoryId: product.categoryId,
        Page: 1,
        PageSize: 12,
      });
      if (res?.statusCode !== 200) {
        return [];
      }
      const items = res?.value?.items || [];
      return items.filter((item) => item.id !== product.id).slice(0, 8);
    },
  });

  const images = useMemo(() => {
    const list = Array.isArray(product?.thumbnailUrl) ? product.thumbnailUrl : [];
    if (list.length > 0) return list;
    if (product?.firstImageUrl) return [product.firstImageUrl];
    return [];
  }, [product]);

  const stock = Math.max(Number(product?.stock ?? product?.stockQty ?? 0) || 0, 0);
  const isOutOfStock = product?.status === "Unavailable" || stock <= 0;
  const maxQuantity = stock > 0 ? stock : 1;
  const safeQuantity = Math.min(Math.max(quantity, 1), maxQuantity);

  const handleSetQuantity = (nextValue) => {
    const numeric = Number(nextValue) || 1;
    const clamped = Math.min(Math.max(numeric, 1), maxQuantity);
    setQuantity(clamped);
  };

  const handleAddToCart = async () => {
    if (!product?.id) {
      toast.error("Không tìm thấy sản phẩm");
      return;
    }

    if (isOutOfStock) {
      toast.error("Sản phẩm đã hết hàng");
      return;
    }

    try {
      await dispatch(
        addCartItem({
          productId: product.id,
          quantity: safeQuantity,
          isAuthenticated,
          meta: {
            productName: product.name,
            productImage: images[0] || "",
            unitPrice: product.price,
            availableStock: stock,
            productStatus: product.status || "Available",
          },
        })
      ).unwrap();
      toast.success("Đã thêm vào giỏ hàng");
    } catch (error) {
      toast.error(error || "Không thể thêm vào giỏ hàng");
    }
  };

  const goToSlide = (index) => {
    if (!mobileCarouselRef.current) return;
    const container = mobileCarouselRef.current;
    const safeIndex = Math.min(Math.max(index, 0), Math.max(images.length - 1, 0));
    const itemWidth = container.clientWidth;
    container.scrollTo({ left: itemWidth * safeIndex, behavior: "smooth" });
    setActiveImageIndex(safeIndex);
  };

  const handleMobileScroll = () => {
    if (!mobileCarouselRef.current) return;
    const container = mobileCarouselRef.current;
    const itemWidth = container.clientWidth || 1;
    const index = Math.round(container.scrollLeft / itemWidth);
    setActiveImageIndex(Math.min(Math.max(index, 0), Math.max(images.length - 1, 0)));
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-2/3 bg-slate-200 rounded" />
          <div className="h-80 bg-slate-200 rounded-xl" />
          <div className="h-40 bg-slate-200 rounded-xl" />
        </div>
      </div>
    );
  }

  if (isError || !product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
          <h1 className="text-xl font-semibold text-red-700 mb-2">Không tìm thấy sản phẩm</h1>
          <p className="text-sm text-red-600 mb-4">Dữ liệu có thể đã bị thay đổi hoặc không tồn tại.</p>
          <Link
            to="/"
            className="inline-flex items-center justify-center px-4 py-2 rounded-md bg-[#0090D0] text-white font-medium"
          >
            Về trang chủ
          </Link>
        </div>
      </div>
    );
  }

  const mockReviews = [
    {
      id: "rv-1",
      name: "Nguyen Minh",
      rating: 5,
      content: "Hiệu năng rất mạnh, chơi game 4K mượt. Nhiệt độ vẫn ổn định.",
    },
    {
      id: "rv-2",
      name: "Tran Anh",
      rating: 4,
      content: "Build tốt, đèn RGB đẹp, nhưng card khá to nên cần case rộng.",
    },
    {
      id: "rv-3",
      name: "Le Quoc",
      rating: 5,
      content: "Render và AI workload rất nhanh. Rất đáng tiền trong phân khúc cao cấp.",
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 md:py-8 pb-28 md:pb-8">
      <div className="mb-4">
        <Link to="/" className="text-sm text-[#0090D0] hover:underline">
          Trang chủ
        </Link>
        <span className="mx-2 text-slate-400">/</span>
        <span className="text-sm text-slate-600">{product.categoryName || "Sản phẩm"}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-6">
          <div className="md:hidden">
            {images.length > 0 ? (
              <>
                <div
                  ref={mobileCarouselRef}
                  onScroll={handleMobileScroll}
                  className="flex overflow-x-auto snap-x snap-mandatory rounded-xl border border-slate-200 bg-white [&::-webkit-scrollbar]:hidden"
                >
                  {images.map((imageUrl, index) => (
                    <div key={`${imageUrl}-${index}`} className="snap-center shrink-0 w-full aspect-square">
                      <img src={imageUrl} alt={`${product.name} ${index + 1}`} className="w-full h-full object-contain" />
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => goToSlide(activeImageIndex - 1)}
                    disabled={activeImageIndex === 0}
                    className="h-9 w-9 rounded-full border border-slate-300 text-slate-700 disabled:opacity-40"
                  >
                    <ChevronLeft size={18} className="mx-auto" />
                  </button>
                  <div className="flex items-center gap-2">
                    {images.map((_, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => goToSlide(index)}
                        className={`h-2.5 rounded-full transition-all ${
                          activeImageIndex === index ? "w-6 bg-[#0090D0]" : "w-2.5 bg-slate-300"
                        }`}
                      />
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => goToSlide(activeImageIndex + 1)}
                    disabled={activeImageIndex >= images.length - 1}
                    className="h-9 w-9 rounded-full border border-slate-300 text-slate-700 disabled:opacity-40"
                  >
                    <ChevronRight size={18} className="mx-auto" />
                  </button>
                </div>
              </>
            ) : (
              <div className="aspect-square rounded-xl border border-slate-200 bg-white flex items-center justify-center">
                <Package size={54} className="text-slate-300" />
              </div>
            )}
          </div>

          <div className="hidden md:grid md:grid-cols-12 gap-3">
            <div className="md:col-span-2 space-y-2 max-h-[520px] overflow-y-auto pr-1">
              {images.map((imageUrl, index) => (
                <button
                  type="button"
                  key={`${imageUrl}-${index}`}
                  onClick={() => setActiveImageIndex(index)}
                  className={`w-full aspect-square rounded-lg border overflow-hidden ${
                    activeImageIndex === index ? "border-[#0090D0]" : "border-slate-200"
                  }`}
                >
                  <img src={imageUrl} alt={`${product.name} thumb ${index + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>

            <div className="md:col-span-10">
              <div className="aspect-square rounded-xl border border-slate-200 bg-white overflow-hidden">
                {images.length > 0 ? (
                  <img
                    src={images[activeImageIndex] || images[0]}
                    alt={product.name}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package size={64} className="text-slate-300" />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-6">
          <div className="rounded-xl border border-slate-200 bg-white p-4 md:p-6">
            <h1 className="text-xl md:text-2xl font-semibold text-slate-900">{product.name}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-600">
              <span>SKU: {product.sku || "-"}</span>
              <span className="text-slate-300">|</span>
              <span>{product.categoryName || "Không rõ danh mục"}</span>
            </div>

            <div className="mt-4 flex items-center gap-3">
              <span className="text-2xl md:text-3xl font-bold text-red-600">{formatPrice(product.price)}</span>
              <span
                className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                  isOutOfStock ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
                }`}
              >
                {isOutOfStock ? "Hết hàng" : "Còn hàng"}
              </span>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-md bg-slate-50 p-3">
                <div className="text-slate-500">Tồn kho</div>
                <div className="font-semibold text-slate-800">{stock}</div>
              </div>
              <div className="rounded-md bg-slate-50 p-3">
                <div className="text-slate-500">Bảo hành</div>
                <div className="font-semibold text-slate-800">{product.warrantyMonth || 0} tháng</div>
              </div>
            </div>

            <div className="mt-5">
              <div className="text-sm font-medium text-slate-700 mb-2">Số lượng</div>
              <div className="inline-flex items-center rounded-md border border-slate-300 overflow-hidden">
                <button
                  type="button"
                  onClick={() => handleSetQuantity(safeQuantity - 1)}
                  disabled={isOutOfStock}
                  className="h-10 w-10 flex items-center justify-center hover:bg-slate-100 disabled:opacity-50"
                >
                  <Minus size={16} />
                </button>
                <input
                  type="number"
                  min={1}
                  max={maxQuantity}
                  value={safeQuantity}
                  onChange={(e) => handleSetQuantity(e.target.value)}
                  disabled={isOutOfStock}
                  className="w-14 h-10 text-center outline-none border-x border-slate-300"
                />
                <button
                  type="button"
                  onClick={() => handleSetQuantity(safeQuantity + 1)}
                  disabled={isOutOfStock}
                  className="h-10 w-10 flex items-center justify-center hover:bg-slate-100 disabled:opacity-50"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={handleAddToCart}
              disabled={isOutOfStock}
              className="hidden md:flex mt-5 w-full h-11 rounded-md bg-[#0090D0] hover:bg-[#0077B0] disabled:bg-slate-300 text-white font-semibold items-center justify-center gap-2"
            >
              <ShoppingCart size={18} />
              Thêm vào giỏ hàng
            </button>
          </div>
        </div>
      </div>

      <div className="mt-6 space-y-4 md:hidden">
        <SectionAccordion
          title="Mô tả sản phẩm"
          open={openSection === "description"}
          onToggle={() =>
            setOpenSection((prev) => (prev === "description" ? "" : "description"))
          }
        >
          <p className="text-sm text-slate-700 leading-relaxed">
            {product.description || "Chưa có mô tả cho sản phẩm này."}
          </p>
        </SectionAccordion>

        <SectionAccordion
          title="Thông số kỹ thuật"
          open={openSection === "specs"}
          onToggle={() => setOpenSection((prev) => (prev === "specs" ? "" : "specs"))}
        >
          {(product.specValues || []).length > 0 ? (
            <div className="space-y-2">
              {(product.specValues || []).map((spec) => (
                <div key={spec.specDefinitionId} className="flex items-start justify-between gap-3 text-sm">
                  <span className="text-slate-500">{spec.specName}</span>
                  <span className="text-slate-800 font-medium text-right">
                    {spec.value}
                    {spec.unit ? ` ${spec.unit}` : ""}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">Chưa có thông số kỹ thuật.</p>
          )}
        </SectionAccordion>

        <SectionAccordion
          title="Đánh giá sản phẩm"
          open={openSection === "reviews"}
          onToggle={() => setOpenSection((prev) => (prev === "reviews" ? "" : "reviews"))}
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold text-slate-900">4.8/5</div>
              <div className="flex items-center text-amber-500">
                {Array.from({ length: 5 }).map((_, index) => (
                  <Star key={index} size={16} fill="currentColor" />
                ))}
              </div>
            </div>
            <div className="text-xs font-medium inline-flex px-2 py-1 rounded bg-slate-100 text-slate-600">
              Chưa kết nối API đánh giá
            </div>
            {mockReviews.map((review) => (
              <div key={review.id} className="rounded-md border border-slate-200 p-3">
                <div className="font-medium text-sm text-slate-800">{review.name}</div>
                <div className="text-amber-500 flex items-center mt-1">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <Star
                      key={index}
                      size={14}
                      fill={index < review.rating ? "currentColor" : "none"}
                    />
                  ))}
                </div>
                <p className="text-sm text-slate-600 mt-2">{review.content}</p>
              </div>
            ))}
          </div>
        </SectionAccordion>
      </div>

      <div className="hidden md:block mt-8 space-y-6">
        <section className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-3">Mô tả sản phẩm</h2>
          <p className="text-sm text-slate-700 leading-relaxed">
            {product.description || "Chưa có mô tả cho sản phẩm này."}
          </p>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-3">Thông số kỹ thuật</h2>
          {(product.specValues || []).length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {(product.specValues || []).map((spec) => (
                <div key={spec.specDefinitionId} className="rounded-md bg-slate-50 p-3">
                  <div className="text-sm text-slate-500">{spec.specName}</div>
                  <div className="mt-1 font-semibold text-slate-800">
                    {spec.value}
                    {spec.unit ? ` ${spec.unit}` : ""}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">Chưa có thông số kỹ thuật.</p>
          )}
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900">Đánh giá sản phẩm</h2>
            <span className="text-xs font-medium inline-flex px-2 py-1 rounded bg-slate-100 text-slate-600">
              Chưa kết nối API đánh giá
            </span>
          </div>
          <div className="space-y-3">
            {mockReviews.map((review) => (
              <div key={review.id} className="rounded-md border border-slate-200 p-4">
                <div className="flex items-center justify-between">
                  <div className="font-medium text-sm text-slate-800">{review.name}</div>
                  <div className="text-amber-500 flex items-center">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <Star
                        key={index}
                        size={14}
                        fill={index < review.rating ? "currentColor" : "none"}
                      />
                    ))}
                  </div>
                </div>
                <p className="text-sm text-slate-600 mt-2">{review.content}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="mt-8 md:mt-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-slate-900">Sản phẩm cùng danh mục</h2>
        </div>

        {relatedLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="bg-white rounded-xl p-4 border border-slate-200 animate-pulse">
                <div className="aspect-square bg-slate-200 rounded-lg mb-3" />
                <div className="h-3 bg-slate-200 rounded w-2/3 mb-2" />
                <div className="h-4 bg-slate-200 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : relatedProducts.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
            {relatedProducts.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-500">
            Chưa có sản phẩm liên quan.
          </div>
        )}
      </section>

      <div className="md:hidden fixed bottom-0 left-0 right-0 z-20 border-t border-slate-200 bg-white px-4 py-3 shadow-[0_-4px_12px_rgba(15,23,42,0.08)]">
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <div className="text-base font-bold text-red-600 truncate">{formatPrice(product.price)}</div>
            <div className={`text-xs ${isOutOfStock ? "text-red-600" : "text-green-700"}`}>
              {isOutOfStock ? "Hết hàng" : `Còn ${stock} sản phẩm`}
            </div>
          </div>
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={isOutOfStock}
            className="h-11 px-4 rounded-md bg-[#0090D0] hover:bg-[#0077B0] disabled:bg-slate-300 text-white font-semibold inline-flex items-center gap-2"
          >
            <ShoppingCart size={17} />
            Thêm vào giỏ
          </button>
        </div>
      </div>
    </div>
  );
}
