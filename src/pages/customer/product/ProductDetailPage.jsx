import { useEffect, useMemo, useRef, useState } from "react";
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import {
  ChevronLeft,
  ChevronRight,
  ImagePlus,
  Loader2,
  Minus,
  Package,
  Plus,
  ShoppingCart,
  Star,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { apiService } from "../../../config/axios";
import ProductCard from "../../../components/customer/ProductCard";
import {
  REVIEW_SORT_BY,
  REVIEW_SORT_DIRECTION,
  reviewService,
} from "../../../services/reviewService";
import useCartAccess from "../../../hooks/useCartAccess";
import { addCartItem } from "../../../store/slices/cartSlice";
import { CART_ACCESS_DENIED_MESSAGE } from "../../../utils/cartAccess";
import { normalizeProductPricing } from "../../../utils/productPricing";
import { uploadReviewImages, validateImageFiles } from "../../../utils/uploadImage";

const REVIEW_PAGE_SIZE = 5;

const reviewSortOptions = [
  { label: "Mới nhất", sortBy: REVIEW_SORT_BY.CREATED_AT, sortDirection: REVIEW_SORT_DIRECTION.DESC },
  { label: "Cũ nhất", sortBy: REVIEW_SORT_BY.CREATED_AT, sortDirection: REVIEW_SORT_DIRECTION.ASC },
  { label: "Sao cao nhất", sortBy: REVIEW_SORT_BY.RATING, sortDirection: REVIEW_SORT_DIRECTION.DESC },
  { label: "Sao thấp nhất", sortBy: REVIEW_SORT_BY.RATING, sortDirection: REVIEW_SORT_DIRECTION.ASC },
];

function formatPrice(value) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(value || 0);
}

function formatDate(value) {
  if (!value) return "--";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "--";

  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(parsed);
}

function SectionAccordion({ title, open, onToggle, children }) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <button
        type="button"
        className="flex w-full items-center justify-between px-4 py-3 text-left"
        onClick={onToggle}
      >
        <span className="font-semibold text-slate-800">{title}</span>
        <span className="text-slate-500">{open ? "-" : "+"}</span>
      </button>
      {open && <div className="px-4 pb-4">{children}</div>}
    </div>
  );
}

function RatingStars({ rating, size = 14 }) {
  const safeRating = Math.max(0, Math.min(5, Math.round(Number(rating) || 0)));

  return (
    <div className="flex items-center gap-0.5 text-amber-500">
      {Array.from({ length: 5 }).map((_, index) => (
        <Star
          key={index}
          size={size}
          fill={index < safeRating ? "currentColor" : "none"}
          className={index < safeRating ? "" : "text-slate-300"}
        />
      ))}
    </div>
  );
}

function ReviewFilterBar({ filters, onRatingChange, onHasMediaChange, onSortChange }) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 md:flex-row md:items-center md:justify-between">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <select
          value={filters.rating}
          onChange={(event) => onRatingChange(event.target.value)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-[#0090D0] focus:outline-none"
        >
          <option value="">Tất cả mức sao</option>
          <option value="5">5 sao</option>
          <option value="4">4 sao</option>
          <option value="3">3 sao</option>
          <option value="2">2 sao</option>
          <option value="1">1 sao</option>
        </select>

        <label className="inline-flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={filters.hasMedia}
            onChange={(event) => onHasMediaChange(event.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-[#0090D0] focus:ring-[#0090D0]"
          />
          Chỉ hiện review có ảnh
        </label>
      </div>

      <select
        value={`${filters.sortBy}-${filters.sortDirection}`}
        onChange={(event) => onSortChange(event.target.value)}
        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-[#0090D0] focus:outline-none"
      >
        {reviewSortOptions.map((option) => (
          <option key={`${option.sortBy}-${option.sortDirection}`} value={`${option.sortBy}-${option.sortDirection}`}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function ReviewSummary({ averageRating, totalReviews }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-3xl font-bold text-slate-900">{averageRating.toFixed(1)}/5</p>
          <p className="mt-1 text-sm text-slate-500">{totalReviews} đánh giá</p>
        </div>
        <RatingStars rating={averageRating} size={18} />
      </div>
    </div>
  );
}

function ReviewMediaGrid({ mediaUrls = [] }) {
  if (!mediaUrls.length) return null;

  return (
    <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
      {mediaUrls.map((url) => (
        <a
          key={`${url.mediaUrl}-${url.id}`}
          href={url.mediaUrl}
          target="_blank"
          rel="noreferrer"
          className="group block overflow-hidden rounded-lg border border-slate-200 bg-slate-50"
        >
          <img
            src={url.mediaUrl}
            alt={`Review media ${url.id}`}
            className="h-28 w-full object-cover transition-transform duration-200 group-hover:scale-105"
          />
        </a>
      ))}
    </div>
  );
}

function ReviewCard({ review, canDelete, deleting, onDelete }) {
  return (
    <article className="rounded-xl border border-slate-200 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-900">{review.fullName || "Ẩn Danh"}</p>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <RatingStars rating={review.rating} />
            <span className="text-xs text-slate-500">{formatDate(review.createdAt)}</span>
          </div>
        </div>

        {canDelete && (
          <button
            type="button"
            onClick={() => onDelete(review)}
            disabled={deleting}
            className="inline-flex h-9 items-center gap-1 rounded-lg border border-rose-200 px-3 text-sm font-medium text-rose-600 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
            Xóa
          </button>
        )}
      </div>

      <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-slate-700">
        {review.comment || "Không có nội dung."}
      </p>

      <ReviewMediaGrid mediaUrls={review.mediaUrls} />
    </article>
  );
}

function ReviewComposer({
  isAuthenticated,
  form,
  selectedFiles,
  previewUrls,
  isSubmitting,
  onChange,
  onFilesChange,
  onRemoveFile,
  onSubmit,
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 md:p-6">
      <div>
        <h3 className="text-lg font-semibold text-slate-900">Viết đánh giá</h3>
        <p className="mt-1 text-sm text-slate-500">
          {isAuthenticated
            ? "Nhập đánh giá của bạn về sản phẩm này. Bạn có thể chia sẻ trải nghiệm, nhận xét về chất lượng, dịch vụ hoặc bất kỳ điều gì bạn muốn người khác biết."
            : "Khách vãng lai vui lòng nhập họ tên và số điện thoại để gửi đánh giá. Thông tin này sẽ không được hiển thị công khai."}
        </p>
      </div>

      <form className="mt-4 space-y-4" onSubmit={onSubmit}>
        {!isAuthenticated && (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Họ tên</label>
              <input
                type="text"
                value={form.fullName}
                onChange={(event) => onChange("fullName", event.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#0090D0] focus:outline-none"
                placeholder="Nhập họ tên"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Số điện thoại</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(event) => onChange("phone", event.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#0090D0] focus:outline-none"
                placeholder="Nhập số điện thoại"
              />
            </div>
          </div>
        )}

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Số sao</label>
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 5 }).map((_, index) => {
              const value = index + 1;
              const active = Number(form.rating) === value;

              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => onChange("rating", String(value))}
                  className={`inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-sm font-medium ${
                    active
                      ? "border-amber-400 bg-amber-50 text-amber-700"
                      : "border-slate-300 text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <Star size={14} fill={active ? "currentColor" : "none"} />
                  {value}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Nội Dung</label>
          <textarea
            rows={4}
            value={form.comment}
            onChange={(event) => onChange("comment", event.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#0090D0] focus:outline-none"
            placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">Ảnh đính kèm</label>
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-slate-300 px-4 py-3 text-sm text-slate-700 hover:border-[#0090D0] hover:text-[#0090D0]">
            <ImagePlus size={16} />
            Chọn ảnh
            <input
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp"
              multiple
              className="hidden"
              onChange={(event) => onFilesChange(event.target.files)}
            />
          </label>
          {selectedFiles.length > 0 && <p className="mt-2 text-xs text-slate-500">Đã chọn {selectedFiles.length} ảnh</p>}
          {previewUrls.length > 0 && (
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {previewUrls.map((url, index) => (
                <div key={`${url}-${index}`} className="relative overflow-hidden rounded-lg border border-slate-200">
                  <img src={url} alt={`Preview ${index + 1}`} className="h-24 w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => onRemoveFile(index)}
                    className="absolute right-2 top-2 rounded-full bg-black/60 px-2 py-1 text-[11px] font-medium text-white"
                  >
                    Xóa
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#0090D0] px-5 text-sm font-semibold text-white hover:bg-[#0077B0] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : null}
            Gửi đánh giá
          </button>
        </div>
      </form>
    </section>
  );
}

function ReviewsPanel({
  summary,
  filters,
  reviews,
  hasNextPage,
  isLoading,
  isFetchingNextPage,
  isRefreshing,
  isSubmitting,
  isDeletingReviewId,
  form,
  selectedFiles,
  previewUrls,
  isAuthenticated,
  onRatingChange,
  onHasMediaChange,
  onSortChange,
  onFieldChange,
  onFilesChange,
  onRemoveFile,
  onSubmit,
  onLoadMore,
  onDeleteReview,
  canDeleteReview,
}) {
  return (
    <div className="space-y-4">
      <ReviewSummary averageRating={summary.averageRating} totalReviews={summary.totalReviews} />

      <ReviewComposer
        isAuthenticated={isAuthenticated}
        form={form}
        selectedFiles={selectedFiles}
        previewUrls={previewUrls}
        isSubmitting={isSubmitting}
        onChange={onFieldChange}
        onFilesChange={onFilesChange}
        onRemoveFile={onRemoveFile}
        onSubmit={onSubmit}
      />

      <section className="rounded-xl border border-slate-200 bg-white p-4 md:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Danh sách đánh giá</h3>
            <p className="mt-1 text-sm text-slate-500">{summary.totalReviews} đánh giá hiện có</p>
          </div>
          {isRefreshing && !isLoading && (
            <span className="inline-flex items-center gap-2 text-sm text-slate-500">
              <Loader2 size={14} className="animate-spin" />
              Đang cập nhật
            </span>
          )}
        </div>

        <ReviewFilterBar
          filters={filters}
          onRatingChange={onRatingChange}
          onHasMediaChange={onHasMediaChange}
          onSortChange={onSortChange}
        />

        {isLoading ? (
          <div className="mt-4 space-y-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="animate-pulse rounded-xl border border-slate-200 p-4">
                <div className="h-4 w-32 rounded bg-slate-200" />
                <div className="mt-2 h-3 w-24 rounded bg-slate-200" />
                <div className="mt-3 h-3 w-full rounded bg-slate-200" />
                <div className="mt-2 h-3 w-4/5 rounded bg-slate-200" />
              </div>
            ))}
          </div>
        ) : reviews.length === 0 ? (
          <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
            <p className="text-sm font-medium text-slate-700">Chưa có đánh giá phù hợp</p>
            <p className="mt-1 text-sm text-slate-500">
              Hãy là người đầu tiên chia sẻ trải nghiệm về sản phẩm này.
            </p>
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {reviews.map((review) => (
              <ReviewCard
                key={review.id}
                review={review}
                canDelete={canDeleteReview(review)}
                deleting={isDeletingReviewId === review.id}
                onDelete={onDeleteReview}
              />
            ))}
          </div>
        )}

        {hasNextPage && (
          <div className="mt-4 flex justify-center">
            <button
              type="button"
              onClick={onLoadMore}
              disabled={isFetchingNextPage}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[#0090D0] px-5 text-sm font-semibold text-[#0090D0] hover:bg-[#0090D0]/5 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isFetchingNextPage ? <Loader2 size={16} className="animate-spin" /> : null}
              Xem thêm đánh giá
            </button>
          </div>
        )}
      </section>
    </div>
  );
}

function normalizeReviewItem(review) {
  return reviewService.normalizeReview(review);
}

function getReviewCount(pages) {
  const firstPage = pages?.[0];
  if (!firstPage) return 0;
  return Number(firstPage.totalReviews ?? firstPage.totalItems ?? 0) || 0;
}

function getAverageRating(pages, reviews) {
  const firstPage = pages?.[0];
  const apiAverage = Number(firstPage?.averageRating);
  if (!Number.isNaN(apiAverage) && apiAverage > 0) return apiAverage;
  if (!reviews.length) return 0;

  const total = reviews.reduce((sum, review) => sum + (Number(review.rating) || 0), 0);
  return total / reviews.length;
}

function isOwnReview(review, user) {
  if (!review?.userId || !user?.id) return false;
  return String(review.userId).toLowerCase() === String(user.id).toLowerCase();
}

function validateReviewForm({ isAuthenticated, form }) {
  const rating = Number(form.rating);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return "Số sao không hợp lệ. Vui lòng chọn từ 1 đến 5 sao.";
  }

  if (!String(form.comment || "").trim()) {
    return "Vui lòng nhập nội dung đánh giá.";
  }

  if (!isAuthenticated) {
    if (!String(form.fullName || "").trim()) {
      return "Vui lòng nhập họ tên.";
    }

    const phone = String(form.phone || "").trim();
    if (!/^\d{9,12}$/.test(phone)) {
      return "Số điện thoại phải là chữ số và dài từ 9-12 ký tự.";
    }
  }

  return null;
}

export default function ProductDetailPage() {
  const { productId } = useParams();
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  const { isAuthenticated, user, loading: authLoading, canUseCart } = useCartAccess();
  const mobileCarouselRef = useRef(null);

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [openSection, setOpenSection] = useState("description");
  const [reviewFilters, setReviewFilters] = useState({
    rating: "",
    hasMedia: false,
    sortBy: REVIEW_SORT_BY.CREATED_AT,
    sortDirection: REVIEW_SORT_DIRECTION.DESC,
  });
  const [reviewForm, setReviewForm] = useState({
    fullName: "",
    phone: "",
    comment: "",
    rating: "5",
  });
  const [reviewFiles, setReviewFiles] = useState([]);

  const previewUrls = useMemo(() => reviewFiles.map((file) => URL.createObjectURL(file)), [reviewFiles]);

  useEffect(() => {
    return () => {
      previewUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [previewUrls]);

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
    queryKey: ["customer-related-products", product?.categoryId, product?.id],
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

  const {
    data: reviewData,
    isLoading: reviewsLoading,
    isFetching,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useInfiniteQuery({
    enabled: !!productId,
    queryKey: [
      "product-reviews",
      productId,
      reviewFilters.rating,
      reviewFilters.hasMedia,
      reviewFilters.sortBy,
      reviewFilters.sortDirection,
    ],
    queryFn: async ({ pageParam = 1 }) => {
      const response = await reviewService.getProductReviews(productId, {
        Page: pageParam,
        PageSize: REVIEW_PAGE_SIZE,
        Rating: reviewFilters.rating ? Number(reviewFilters.rating) : undefined,
        HasMedia: reviewFilters.hasMedia || undefined,
        SortBy: reviewFilters.sortBy,
        SortDirection: reviewFilters.sortDirection,
      });
      if (!response.succeeded) {
        throw new Error(response.message || "Không thể tải đánh giá sản phẩm");
      }

      return {
        ...response.value,
        items: (response.value?.items || []).map(normalizeReviewItem).filter(Boolean),
      };
    },
    getNextPageParam: (lastPage) => {
      const currentPage = Number(lastPage?.page ?? 1) || 1;
      const totalPages = Number(lastPage?.totalPages ?? 1) || 1;
      return currentPage < totalPages ? currentPage + 1 : undefined;
    },
    initialPageParam: 1,
  });

  const createReviewMutation = useMutation({
    mutationFn: async () => {
      const validationMessage = validateReviewForm({ isAuthenticated, form: reviewForm });
      if (validationMessage) throw new Error(validationMessage);

      let mediaUrls = [];
      if (reviewFiles.length > 0) {
        const validation = validateImageFiles(reviewFiles);
        if (!validation.valid) {
          throw new Error(validation.errors?.[0] || "Ảnh không hợp lệ.");
        }
        mediaUrls = await uploadReviewImages({ files: reviewFiles, productId });
      }

      const response = await reviewService.createReview(productId, {
        fullName: !isAuthenticated ? reviewForm.fullName.trim() : undefined,
        phone: !isAuthenticated ? reviewForm.phone.trim() : undefined,
        comment: reviewForm.comment.trim(),
        rating: Number(reviewForm.rating),
        mediaUrls,
      });

      if (!response.succeeded) {
        throw new Error(response.message || "Không thể gửi đánh giá");
      }

      return response.value;
    },
    onSuccess: async () => {
      toast.success("Gửi đánh giá thành công");
      setReviewForm({
        fullName: "",
        phone: "",
        comment: "",
        rating: "5",
      });
      setReviewFiles([]);
      setOpenSection("reviews");
      await queryClient.invalidateQueries({ queryKey: ["product-reviews", productId] });
    },
    onError: (error) => {
      toast.error(error?.message || "Gửi đánh giá thất bại");
    },
  });

  const deleteReviewMutation = useMutation({
    mutationFn: async (reviewId) => {
      const response = await reviewService.deleteReview(reviewId);
      if (!response.succeeded) {
        throw new Error(response.message || "Không thể xóa đánh giá");
      }
      return reviewId;
    },
    onSuccess: async () => {
      toast.success("Đã xóa đánh giá");
      await queryClient.invalidateQueries({ queryKey: ["product-reviews", productId] });
    },
    onError: (error) => {
      toast.error(error?.message || "Xóa đánh giá thất bại");
    },
  });

  const images = useMemo(() => {
    const list = Array.isArray(product?.thumbnailUrl) ? product.thumbnailUrl : [];
    if (list.length > 0) return list;
    if (product?.firstImageUrl) return [product.firstImageUrl];
    return [];
  }, [product]);
  const pricing = useMemo(() => normalizeProductPricing(product), [product]);

  const reviews = useMemo(() => reviewData?.pages?.flatMap((page) => page?.items || []) ?? [], [reviewData]);
  const reviewSummary = useMemo(
    () => ({
      totalReviews: getReviewCount(reviewData?.pages),
      averageRating: getAverageRating(reviewData?.pages, reviews),
    }),
    [reviewData, reviews]
  );

  const stock = Math.max(Number(product?.stock ?? product?.stockQty ?? 0) || 0, 0);
  const isOutOfStock = product?.status === "Unavailable" || stock <= 0;
  const maxQuantity = stock > 0 ? stock : 1;
  const safeQuantity = Math.min(Math.max(quantity, 1), maxQuantity);
  const showCartActions = !authLoading && canUseCart;

  const handleSetQuantity = (nextValue) => {
    const numeric = Number(nextValue) || 1;
    const clamped = Math.min(Math.max(numeric, 1), maxQuantity);
    setQuantity(clamped);
  };

  const handleAddToCart = async () => {
    if (!canUseCart) {
      toast.info(CART_ACCESS_DENIED_MESSAGE);
      return;
    }

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
            unitPrice: pricing.originalPrice,
            discountValue: product.discountValue,
            discountAmountPerItem: pricing.discountAmount,
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

  const handleReviewFieldChange = (field, value) => {
    setReviewForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleReviewFilesChange = (fileList) => {
    const nextFiles = Array.from(fileList || []);
    if (!nextFiles.length) return;

    const validation = validateImageFiles(nextFiles);
    if (!validation.valid) {
      toast.error(validation.errors?.[0] || "Ảnh không hợp lệ");
      return;
    }

    setReviewFiles((prev) => [...prev, ...nextFiles]);
  };

  const handleRemoveReviewFile = (fileIndex) => {
    setReviewFiles((prev) => prev.filter((_, index) => index !== fileIndex));
  };

  const handleReviewSortChange = (value) => {
    const [sortBy, sortDirection] = String(value).split("-");
    setReviewFilters((prev) => ({
      ...prev,
      sortBy: Number(sortBy),
      sortDirection: Number(sortDirection),
    }));
  };

  const handleDeleteReview = (review) => {
    if (!review?.id) return;
    if (!window.confirm("Bạn có chắc muốn xóa đánh giá này?")) return;
    deleteReviewMutation.mutate(review.id);
  };

  const canDeleteReview = (review) => isOwnReview(review, user);

  const handleSubmitReview = (event) => {
    event.preventDefault();
    createReviewMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="space-y-4 animate-pulse">
          <div className="h-8 w-2/3 rounded bg-slate-200" />
          <div className="h-80 rounded-xl bg-slate-200" />
          <div className="h-40 rounded-xl bg-slate-200" />
        </div>
      </div>
    );
  }

  if (isError || !product) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
          <h1 className="mb-2 text-xl font-semibold text-red-700">Không tìm thấy sản phẩm</h1>
          <p className="mb-4 text-sm text-red-600">Dữ liệu có thể đã bị thay đổi hoặc không tồn tại.</p>
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-[#0090D0] px-4 py-2 font-medium text-white"
          >
            Về trang chủ
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 pb-28 md:py-8 md:pb-8">
      <div className="mb-4">
        <Link to="/" className="text-sm text-[#0090D0] hover:underline">
          Trang chủ
        </Link>
        <span className="mx-2 text-slate-400">/</span>
        <span className="text-sm text-slate-600">{product.categoryName || "Sản phẩm"}</span>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-6">
          <div className="md:hidden">
            {images.length > 0 ? (
              <>
                <div
                  ref={mobileCarouselRef}
                  onScroll={handleMobileScroll}
                  className="flex snap-x snap-mandatory overflow-x-auto rounded-xl border border-slate-200 bg-white [&::-webkit-scrollbar]:hidden"
                >
                  {images.map((imageUrl, index) => (
                    <div key={`${imageUrl}-${index}`} className="aspect-square w-full shrink-0 snap-center">
                      <img src={imageUrl} alt={`${product.name} ${index + 1}`} className="h-full w-full object-contain" />
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
              <div className="flex aspect-square items-center justify-center rounded-xl border border-slate-200 bg-white">
                <Package size={54} className="text-slate-300" />
              </div>
            )}
          </div>

          <div className="hidden gap-3 md:grid md:grid-cols-12">
            <div className="max-h-[520px] space-y-2 overflow-y-auto pr-1 md:col-span-2">
              {images.map((imageUrl, index) => (
                <button
                  type="button"
                  key={`${imageUrl}-${index}`}
                  onClick={() => setActiveImageIndex(index)}
                  className={`w-full overflow-hidden rounded-lg border ${
                    activeImageIndex === index ? "border-[#0090D0]" : "border-slate-200"
                  }`}
                >
                  <img src={imageUrl} alt={`${product.name} thumb ${index + 1}`} className="aspect-square h-full w-full object-cover" />
                </button>
              ))}
            </div>

            <div className="md:col-span-10">
              <div className="aspect-square overflow-hidden rounded-xl border border-slate-200 bg-white">
                {images.length > 0 ? (
                  <img src={images[activeImageIndex] || images[0]} alt={product.name} className="h-full w-full object-contain" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <Package size={64} className="text-slate-300" />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-6">
          <div className="rounded-xl border border-slate-200 bg-white p-4 md:p-6">
            <h1 className="text-xl font-semibold text-slate-900 md:text-2xl">{product.name}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-600">
              <span>SKU: {product.sku || "-"}</span>
              <span className="text-slate-300">|</span>
              <span>{product.categoryName || "Không rõ danh mục"}</span>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <div className="flex flex-col">
                <div className="flex flex-wrap items-end gap-x-3 gap-y-1">
                  <span className="text-2xl font-bold text-red-600 md:text-3xl">
                    {formatPrice(pricing.displayPrice)}
                  </span>
                  {pricing.hasDiscount ? (
                    <span className="text-base text-slate-400 line-through">
                      {formatPrice(pricing.originalPrice)}
                    </span>
                  ) : null}
                </div>
              </div>
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

            {showCartActions ? (
              <>
                <div className="mt-5">
              <div className="mb-2 text-sm font-medium text-slate-700">Số lượng</div>
              <div className="inline-flex items-center overflow-hidden rounded-md border border-slate-300">
                <button
                  type="button"
                  onClick={() => handleSetQuantity(safeQuantity - 1)}
                  disabled={isOutOfStock}
                  className="flex h-10 w-10 items-center justify-center hover:bg-slate-100 disabled:opacity-50"
                >
                  <Minus size={16} />
                </button>
                <input
                  type="number"
                  min={1}
                  max={maxQuantity}
                  value={safeQuantity}
                  onChange={(event) => handleSetQuantity(event.target.value)}
                  disabled={isOutOfStock}
                  className="h-10 w-14 border-x border-slate-300 text-center outline-none"
                />
                <button
                  type="button"
                  onClick={() => handleSetQuantity(safeQuantity + 1)}
                  disabled={isOutOfStock}
                  className="flex h-10 w-10 items-center justify-center hover:bg-slate-100 disabled:opacity-50"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={handleAddToCart}
              disabled={isOutOfStock}
              className="mt-5 hidden h-11 w-full items-center justify-center gap-2 rounded-md bg-[#0090D0] font-semibold text-white hover:bg-[#0077B0] disabled:bg-slate-300 md:flex"
            >
              <ShoppingCart size={18} />
              Thêm vào giỏ hàng
            </button>
              </>
            ) : null}
          </div>
        </div>
      </div>

      <div className="mt-6 space-y-4 md:hidden">
        <SectionAccordion
          title="Mô tả sản phẩm"
          open={openSection === "description"}
          onToggle={() => setOpenSection((prev) => (prev === "description" ? "" : "description"))}
        >
          <p className="text-sm leading-relaxed text-slate-700">
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
                  <span className="text-right font-medium text-slate-800">
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
          title="Danh gia san pham"
          open={openSection === "reviews"}
          onToggle={() => setOpenSection((prev) => (prev === "reviews" ? "" : "reviews"))}
        >
          <ReviewsPanel
            summary={reviewSummary}
            filters={reviewFilters}
            reviews={reviews}
            hasNextPage={hasNextPage}
            isLoading={reviewsLoading}
            isFetchingNextPage={isFetchingNextPage}
            isRefreshing={isFetching && !isFetchingNextPage}
            isSubmitting={createReviewMutation.isPending}
            isDeletingReviewId={deleteReviewMutation.isPending ? deleteReviewMutation.variables : null}
            form={reviewForm}
            selectedFiles={reviewFiles}
            previewUrls={previewUrls}
            isAuthenticated={isAuthenticated}
            onRatingChange={(value) => setReviewFilters((prev) => ({ ...prev, rating: value }))}
            onHasMediaChange={(value) => setReviewFilters((prev) => ({ ...prev, hasMedia: value }))}
            onSortChange={handleReviewSortChange}
            onFieldChange={handleReviewFieldChange}
            onFilesChange={handleReviewFilesChange}
            onRemoveFile={handleRemoveReviewFile}
            onSubmit={handleSubmitReview}
            onLoadMore={() => fetchNextPage()}
            onDeleteReview={handleDeleteReview}
            canDeleteReview={canDeleteReview}
          />
        </SectionAccordion>
      </div>

      <div className="mt-8 hidden space-y-6 md:block">
        <section className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="mb-3 text-lg font-semibold text-slate-900">Mô tả sản phẩm</h2>
          <p className="text-sm leading-relaxed text-slate-700">
            {product.description || "Chưa có mô tả cho sản phẩm này."}
          </p>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="mb-3 text-lg font-semibold text-slate-900">Thông số kỹ thuật</h2>
          {(product.specValues || []).length > 0 ? (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
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

        <ReviewsPanel
          summary={reviewSummary}
          filters={reviewFilters}
          reviews={reviews}
          hasNextPage={hasNextPage}
          isLoading={reviewsLoading}
          isFetchingNextPage={isFetchingNextPage}
          isRefreshing={isFetching && !isFetchingNextPage}
          isSubmitting={createReviewMutation.isPending}
          isDeletingReviewId={deleteReviewMutation.isPending ? deleteReviewMutation.variables : null}
          form={reviewForm}
          selectedFiles={reviewFiles}
          previewUrls={previewUrls}
          isAuthenticated={isAuthenticated}
          onRatingChange={(value) => setReviewFilters((prev) => ({ ...prev, rating: value }))}
          onHasMediaChange={(value) => setReviewFilters((prev) => ({ ...prev, hasMedia: value }))}
          onSortChange={handleReviewSortChange}
          onFieldChange={handleReviewFieldChange}
          onFilesChange={handleReviewFilesChange}
          onRemoveFile={handleRemoveReviewFile}
          onSubmit={handleSubmitReview}
          onLoadMore={() => fetchNextPage()}
          onDeleteReview={handleDeleteReview}
          canDeleteReview={canDeleteReview}
        />
      </div>

      <section className="mt-8 md:mt-10">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-900">Sản phẩm cùng danh mục</h2>
        </div>

        {relatedLoading ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 lg:gap-6">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="animate-pulse rounded-xl border border-slate-200 bg-white p-4">
                <div className="mb-3 aspect-square rounded-lg bg-slate-200" />
                <div className="mb-2 h-3 w-2/3 rounded bg-slate-200" />
                <div className="h-4 w-1/2 rounded bg-slate-200" />
              </div>
            ))}
          </div>
        ) : relatedProducts.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 lg:gap-6">
            {relatedProducts.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-500">
            Không có sản phẩm liên quan.
          </div>
        )}
      </section>

      {showCartActions ? (
        <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-slate-200 bg-white px-4 py-3 shadow-[0_-4px_12px_rgba(15,23,42,0.08)] md:hidden">
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <div className="truncate text-base font-bold text-red-600">{formatPrice(pricing.displayPrice)}</div>
            {pricing.hasDiscount ? (
              <div className="truncate text-xs text-slate-400 line-through">
                {formatPrice(pricing.originalPrice)}
              </div>
            ) : null}
            <div className={`text-xs ${isOutOfStock ? "text-red-600" : "text-green-700"}`}>
              {isOutOfStock ? "Hết hàng" : `Còn ${stock} sản phẩm`}
            </div>
          </div>
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={isOutOfStock}
            className="inline-flex h-11 items-center gap-2 rounded-md bg-[#0090D0] px-4 font-semibold text-white hover:bg-[#0077B0] disabled:bg-slate-300"
          >
            <ShoppingCart size={17} />
            Thêm vào giỏ
          </button>
        </div>
        </div>
      ) : null}
    </div>
  );
}
