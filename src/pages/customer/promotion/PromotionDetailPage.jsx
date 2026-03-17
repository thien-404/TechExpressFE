import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Clock3, Gift, Search, TicketPercent } from "lucide-react";

import { apiService } from "../../../config/axios";
import ProductCard from "../../../components/customer/ProductCard";
import {
  cacheCustomerPromotion,
  cacheCustomerPromotions,
  formatDateTime,
  formatPromotionValue,
  getCachedCustomerPromotion,
  getPromotionScopeLabel,
  getPromotionStatus,
  getPromotionTypeLabel,
} from "../../admin/Promotions/promotionHelpers";

const PAGE_SIZE = 12;

function ProductCardSkeleton() {
  return (
    <div className="animate-pulse overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm">
      <div className="aspect-square bg-slate-200" />
      <div className="space-y-3 p-4">
        <div className="h-3 w-1/4 rounded bg-slate-200" />
        <div className="h-4 w-3/4 rounded bg-slate-200" />
        <div className="h-5 w-1/3 rounded bg-slate-200" />
      </div>
    </div>
  );
}

function PromotionHero({ promotion, promotionId }) {
  const status = getPromotionStatus(promotion);

  return (
    <section className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 py-14">
      <div className="mx-auto max-w-7xl px-4">
        <Link
          to="/promotions"
          className="inline-flex items-center gap-2 text-sm font-medium text-white/80 transition-colors hover:text-white"
        >
          ← Quay lại danh sách khuyến mãi
        </Link>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-sm">
            <div className="inline-flex items-center gap-2 rounded-full bg-yellow-400 px-4 py-2 text-sm font-bold text-slate-900">
              <TicketPercent size={16} />
              {getPromotionTypeLabel(promotion)}
            </div>

            <h1 className="mt-5 text-3xl font-bold text-white sm:text-4xl">
              {promotion?.name || `Khuyến mãi #${promotionId}`}
            </h1>

            <p className="mt-4 max-w-3xl text-sm leading-7 text-white/80 sm:text-base">
              {promotion?.description ||
                "Đang hiển thị danh sách sản phẩm nằm trong chương trình khuyến mãi này."}
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <span
                className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${status.className}`}
              >
                {status.label}
              </span>
              <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-white/80">
                Mã: {promotion?.code || "Không cần mã"}
              </span>
              <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-white/80">
                Phạm vi: {getPromotionScopeLabel(promotion?.scope)}
              </span>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
              <div className="rounded-2xl bg-white/10 p-4">
                <div className="text-xs uppercase tracking-[0.2em] text-white/60">
                  Giá trị ưu đãi
                </div>
                <div className="mt-2 text-2xl font-bold text-yellow-300">
                  {promotion ? formatPromotionValue(promotion) : "-"}
                </div>
              </div>

              <div className="rounded-2xl bg-white/10 p-4">
                <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-white/60">
                  <Clock3 size={14} />
                  Thời hạn
                </div>
                <div className="mt-2 text-sm font-medium text-white">
                  {promotion?.endDate
                    ? `Hết hạn ${formatDateTime(promotion.endDate)}`
                    : "Chưa xác định thời hạn"}
                </div>
              </div>

              <div className="rounded-2xl bg-white/10 p-4">
                <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-white/60">
                  <Gift size={14} />
                  Trạng thái
                </div>
                <div className="mt-2 text-sm font-medium text-white">
                  {status.label}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function CustomerPromotionDetailPage() {
  const { promotionId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [promotion, setPromotion] = useState(
    location.state?.promotion || getCachedCustomerPromotion(promotionId),
  );
  const [productQuery, setProductQuery] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [pageNumber, setPageNumber] = useState(0);
  const [pageSize] = useState(PAGE_SIZE);

  useEffect(() => {
    if (location.state?.promotion) {
      setPromotion(location.state.promotion);
      cacheCustomerPromotion(location.state.promotion);
    }
  }, [location.state]);

  const { data: fallbackPromotions } = useQuery({
    enabled: !!promotionId && !promotion,
    queryKey: ["customer-promotions-fallback", promotionId],
    queryFn: async () => {
      const res = await apiService.get("/promotion/customer_guest/all", {
        page: 1,
        pageSize: 100,
        sortBy: "CreatedAt",
        isDescending: true,
      });
      if (res?.statusCode === 200) {
        return res.value?.items || [];
      }
      return [];
    },
    staleTime: 30_000,
  });

  useEffect(() => {
    if (!promotion && fallbackPromotions?.length) {
      cacheCustomerPromotions(fallbackPromotions);
      const matchedPromotion = fallbackPromotions.find(
        (item) => String(item.id) === String(promotionId),
      );
      if (matchedPromotion) {
        setPromotion(matchedPromotion);
        cacheCustomerPromotion(matchedPromotion);
      }
    }
  }, [fallbackPromotions, promotion, promotionId]);

  const queryParams = useMemo(
    () => ({
      search: searchTerm || undefined,
      page: pageNumber + 1,
      pageSize,
    }),
    [pageNumber, pageSize, searchTerm],
  );

  const { data, isLoading, isFetching } = useQuery({
    enabled: !!promotionId,
    queryKey: ["customer-promotion-products", promotionId, queryParams],
    queryFn: async () => {
      const res = await apiService.get(
        `/promotion/customer/${promotionId}/products`,
        queryParams,
      );
      if (res?.statusCode === 200) {
        return res.value;
      }
      return { items: [], totalCount: 0, totalPages: 1 };
    },
    keepPreviousData: true,
    staleTime: 30_000,
  });

  const products = useMemo(() => data?.items || [], [data]);
  const totalItems = data?.totalCount || 0;
  const totalPages = data?.totalPages || 1;
  const loading = isLoading || isFetching;

  return (
    <div className="min-h-screen bg-slate-50 pb-10">
      <PromotionHero promotion={promotion} promotionId={promotionId} />

      <div className="mx-auto max-w-7xl px-4 pt-8">
        <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">
              Sản phẩm trong chương trình khuyến mãi
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Hiển thị {products.length} / {totalItems} sản phẩm
            </p>
          </div>

          <div className="flex w-full gap-2 md:w-auto">
            <div className="relative flex-1 md:w-80">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                value={productQuery}
                onChange={(event) => setProductQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    setPageNumber(0);
                    setSearchTerm(productQuery.trim());
                  }
                }}
                placeholder="Tìm trong khuyến mãi..."
                className="w-full rounded-lg border border-slate-200 py-2.5 pl-10 pr-4 text-sm focus:border-[#0090D0] focus:outline-none focus:ring-2 focus:ring-[#0090D0]/20"
              />
            </div>

            <button
              type="button"
              onClick={() => {
                setPageNumber(0);
                setSearchTerm(productQuery.trim());
              }}
              className="rounded-lg bg-[#0090D0] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#0077B0]"
            >
              Tìm kiếm
            </button>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <ProductCardSkeleton key={index} />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white px-6 py-14 text-center shadow-sm">
            <div className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-400">
              <Gift size={28} />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-slate-700">
              Không có sản phẩm phù hợp
            </h3>
            <p className="mt-2 text-sm text-slate-500">
              {searchTerm
                ? `Không tìm thấy sản phẩm nào với từ khóa "${searchTerm}".`
                : "Chương trình này hiện chưa có sản phẩm khả dụng cho khách hàng."}
            </p>
            <button
              type="button"
              onClick={() => navigate("/promotions")}
              className="mt-6 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
            >
              Xem khuyến mãi khác
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            <div className="mt-8 flex items-center justify-center gap-3">
              <button
                type="button"
                disabled={pageNumber === 0 || loading}
                onClick={() => setPageNumber((prev) => Math.max(prev - 1, 0))}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Trang trước
              </button>
              <div className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm text-slate-600 shadow-sm ring-1 ring-slate-200">
                <span>Trang {pageNumber + 1}</span>
                <span>/</span>
                <span>{totalPages}</span>
              </div>
              <button
                type="button"
                disabled={pageNumber >= totalPages - 1 || loading}
                onClick={() =>
                  setPageNumber((prev) => Math.min(prev + 1, totalPages - 1))
                }
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Trang sau
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
