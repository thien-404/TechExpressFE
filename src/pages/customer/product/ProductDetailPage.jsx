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
import { useAuth } from "../../../store/authContext";
import { addCartItem } from "../../../store/slices/cartSlice";
import { uploadReviewImages, validateImageFiles } from "../../../utils/uploadImage";

const REVIEW_PAGE_SIZE = 5;

const reviewSortOptions = [
  { label: "Moi nhat", sortBy: REVIEW_SORT_BY.CREATED_AT, sortDirection: REVIEW_SORT_DIRECTION.DESC },
  { label: "Cu nhat", sortBy: REVIEW_SORT_BY.CREATED_AT, sortDirection: REVIEW_SORT_DIRECTION.ASC },
  { label: "Sao cao nhat", sortBy: REVIEW_SORT_BY.RATING, sortDirection: REVIEW_SORT_DIRECTION.DESC },
  { label: "Sao thap nhat", sortBy: REVIEW_SORT_BY.RATING, sortDirection: REVIEW_SORT_DIRECTION.ASC },
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
          <option value="">Tat ca muc sao</option>
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
          Chi hien review co anh
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
          <p className="mt-1 text-sm text-slate-500">{totalReviews} danh gia</p>
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
      {mediaUrls.map((url, index) => (
        <a
          key={`${url}-${index}`}
          href={url}
          target="_blank"
          rel="noreferrer"
          className="group block overflow-hidden rounded-lg border border-slate-200 bg-slate-50"
        >
          <img
            src={url}
            alt={`Review media ${index + 1}`}
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
          <p className="text-sm font-semibold text-slate-900">{review.fullName || "Anonymous"}</p>
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
            Xoa
          </button>
        )}
      </div>

      <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-slate-700">
        {review.comment || "Khong co noi dung."}
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
        <h3 className="text-lg font-semibold text-slate-900">Viet danh gia</h3>
        <p className="mt-1 text-sm text-slate-500">
          {isAuthenticated
            ? "Nhap noi dung va so sao. Ho ten, so dien thoai se duoc backend lay tu profile neu de trong."
            : "Khach vang lai can nhap ho ten, so dien thoai, noi dung va so sao."}
        </p>
      </div>

      <form className="mt-4 space-y-4" onSubmit={onSubmit}>
        {!isAuthenticated && (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Ho ten</label>
              <input
                type="text"
                value={form.fullName}
                onChange={(event) => onChange("fullName", event.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#0090D0] focus:outline-none"
                placeholder="Nhap ho ten"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">So dien thoai</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(event) => onChange("phone", event.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#0090D0] focus:outline-none"
                placeholder="Nhap so dien thoai"
              />
            </div>
          </div>
        )}

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">So sao</label>
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
          <label className="mb-1 block text-sm font-medium text-slate-700">Noi dung</label>
          <textarea
            rows={4}
            value={form.comment}
            onChange={(event) => onChange("comment", event.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#0090D0] focus:outline-none"
            placeholder="Chia se trai nghiem cua ban ve san pham"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">Anh dinh kem</label>
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-slate-300 px-4 py-3 text-sm text-slate-700 hover:border-[#0090D0] hover:text-[#0090D0]">
            <ImagePlus size={16} />
            Chon anh
            <input
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp"
              multiple
              className="hidden"
              onChange={(event) => onFilesChange(event.target.files)}
            />
          </label>
          {selectedFiles.length > 0 && <p className="mt-2 text-xs text-slate-500">Da chon {selectedFiles.length} anh</p>}
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
                    Xoa
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
            Gui danh gia
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
            <h3 className="text-lg font-semibold text-slate-900">Danh sach danh gia</h3>
            <p className="mt-1 text-sm text-slate-500">{summary.totalReviews} danh gia hien co</p>
          </div>
          {isRefreshing && !isLoading && (
            <span className="inline-flex items-center gap-2 text-sm text-slate-500">
              <Loader2 size={14} className="animate-spin" />
              Dang cap nhat
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
            <p className="text-sm font-medium text-slate-700">Chua co danh gia phu hop</p>
            <p className="mt-1 text-sm text-slate-500">
              Hay la nguoi dau tien chia se trai nghiem ve san pham nay.
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
              Xem them danh gia
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
    return "So sao phai tu 1 den 5.";
  }

  if (!String(form.comment || "").trim()) {
    return "Vui long nhap noi dung danh gia.";
  }

  if (!isAuthenticated) {
    if (!String(form.fullName || "").trim()) {
      return "Vui long nhap ho ten.";
    }

    const phone = String(form.phone || "").trim();
    if (!/^\d{9,12}$/.test(phone)) {
      return "So dien thoai phai la chu so va dai 9-12 ky tu.";
    }
  }

  return null;
}

export default function ProductDetailPage() {
  const { productId } = useParams();
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  const { isAuthenticated, user } = useAuth();
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
        throw new Error(res?.message || "Khong the tai thong tin san pham");
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
        throw new Error(response.message || "Khong the tai danh gia san pham");
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
          throw new Error(validation.errors?.[0] || "Anh khong hop le.");
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
        throw new Error(response.message || "Khong the gui danh gia");
      }

      return response.value;
    },
    onSuccess: async () => {
      toast.success("Gui danh gia thanh cong");
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
      toast.error(error?.message || "Gui danh gia that bai");
    },
  });

  const deleteReviewMutation = useMutation({
    mutationFn: async (reviewId) => {
      const response = await reviewService.deleteReview(reviewId);
      if (!response.succeeded) {
        throw new Error(response.message || "Khong the xoa danh gia");
      }
      return reviewId;
    },
    onSuccess: async () => {
      toast.success("Da xoa danh gia");
      await queryClient.invalidateQueries({ queryKey: ["product-reviews", productId] });
    },
    onError: (error) => {
      toast.error(error?.message || "Xoa danh gia that bai");
    },
  });

  const images = useMemo(() => {
    const list = Array.isArray(product?.thumbnailUrl) ? product.thumbnailUrl : [];
    if (list.length > 0) return list;
    if (product?.firstImageUrl) return [product.firstImageUrl];
    return [];
  }, [product]);

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

  const handleSetQuantity = (nextValue) => {
    const numeric = Number(nextValue) || 1;
    const clamped = Math.min(Math.max(numeric, 1), maxQuantity);
    setQuantity(clamped);
  };

  const handleAddToCart = async () => {
    if (!product?.id) {
      toast.error("Khong tim thay san pham");
      return;
    }

    if (isOutOfStock) {
      toast.error("San pham da het hang");
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
      toast.success("Da them vao gio hang");
    } catch (error) {
      toast.error(error || "Khong the them vao gio hang");
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
      toast.error(validation.errors?.[0] || "Anh khong hop le");
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
    if (!window.confirm("Ban co chac muon xoa danh gia nay?")) return;
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
          <h1 className="mb-2 text-xl font-semibold text-red-700">Khong tim thay san pham</h1>
          <p className="mb-4 text-sm text-red-600">Du lieu co the da bi thay doi hoac khong ton tai.</p>
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-[#0090D0] px-4 py-2 font-medium text-white"
          >
            Ve trang chu
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 pb-28 md:py-8 md:pb-8">
      <div className="mb-4">
        <Link to="/" className="text-sm text-[#0090D0] hover:underline">
          Trang chu
        </Link>
        <span className="mx-2 text-slate-400">/</span>
        <span className="text-sm text-slate-600">{product.categoryName || "San pham"}</span>
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
              <span>{product.categoryName || "Khong ro danh muc"}</span>
            </div>

            <div className="mt-4 flex items-center gap-3">
              <span className="text-2xl font-bold text-red-600 md:text-3xl">{formatPrice(product.price)}</span>
              <span
                className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                  isOutOfStock ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
                }`}
              >
                {isOutOfStock ? "Het hang" : "Con hang"}
              </span>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-md bg-slate-50 p-3">
                <div className="text-slate-500">Ton kho</div>
                <div className="font-semibold text-slate-800">{stock}</div>
              </div>
              <div className="rounded-md bg-slate-50 p-3">
                <div className="text-slate-500">Bao hanh</div>
                <div className="font-semibold text-slate-800">{product.warrantyMonth || 0} thang</div>
              </div>
            </div>

            <div className="mt-5">
              <div className="mb-2 text-sm font-medium text-slate-700">So luong</div>
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
              Them vao gio hang
            </button>
          </div>
        </div>
      </div>

      <div className="mt-6 space-y-4 md:hidden">
        <SectionAccordion
          title="Mo ta san pham"
          open={openSection === "description"}
          onToggle={() => setOpenSection((prev) => (prev === "description" ? "" : "description"))}
        >
          <p className="text-sm leading-relaxed text-slate-700">
            {product.description || "Chua co mo ta cho san pham nay."}
          </p>
        </SectionAccordion>

        <SectionAccordion
          title="Thong so ky thuat"
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
            <p className="text-sm text-slate-500">Chua co thong so ky thuat.</p>
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
          <h2 className="mb-3 text-lg font-semibold text-slate-900">Mo ta san pham</h2>
          <p className="text-sm leading-relaxed text-slate-700">
            {product.description || "Chua co mo ta cho san pham nay."}
          </p>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="mb-3 text-lg font-semibold text-slate-900">Thong so ky thuat</h2>
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
            <p className="text-sm text-slate-500">Chua co thong so ky thuat.</p>
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
          <h2 className="text-xl font-semibold text-slate-900">San pham cung danh muc</h2>
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
            Chua co san pham lien quan.
          </div>
        )}
      </section>

      <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-slate-200 bg-white px-4 py-3 shadow-[0_-4px_12px_rgba(15,23,42,0.08)] md:hidden">
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <div className="truncate text-base font-bold text-red-600">{formatPrice(product.price)}</div>
            <div className={`text-xs ${isOutOfStock ? "text-red-600" : "text-green-700"}`}>
              {isOutOfStock ? "Het hang" : `Con ${stock} san pham`}
            </div>
          </div>
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={isOutOfStock}
            className="inline-flex h-11 items-center gap-2 rounded-md bg-[#0090D0] px-4 font-semibold text-white hover:bg-[#0077B0] disabled:bg-slate-300"
          >
            <ShoppingCart size={17} />
            Them vao gio
          </button>
        </div>
      </div>
    </div>
  );
}
