import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Clock3, Gift, Loader2, TicketPercent } from "lucide-react";

import { apiService } from "../../../config/axios";
import {
  cacheCustomerPromotions,
  formatDateTime,
  formatPromotionValue,
  getPromotionScopeLabel,
  getPromotionStatus,
  getPromotionTypeLabel,
} from "../../admin/Promotions/promotionHelpers";

const PAGE_SIZE = 12;

function PromotionCard({ promotion }) {
  const navigate = useNavigate();
  const status = getPromotionStatus(promotion);

  return (
    <button
      type="button"
      onClick={() =>
        navigate(`/promotions/${promotion.id}`, { state: { promotion } })
      }
      className="w-full rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-sm transition-all hover:-translate-y-1 hover:border-[#0090D0]/30 hover:shadow-lg"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0090D0]/10 text-[#0090D0]">
          <TicketPercent size={22} />
        </div>
        <span
          className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${status.className}`}
        >
          {status.label}
        </span>
      </div>

      <div className="mt-5">
        <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[#0090D0]">
          {getPromotionTypeLabel(promotion)}
        </div>
        <h2 className="mt-2 line-clamp-2 text-xl font-bold text-slate-900">
          {promotion.name}
        </h2>
        <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-600">
          {promotion.description ||
            "Khuyến mãi đang áp dụng cho nhiều sản phẩm nổi bật."}
        </p>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-slate-50 p-3">
          <div className="text-xs text-slate-500">Giá trị</div>
          <div className="mt-1 font-semibold text-red-600">
            {formatPromotionValue(promotion)}
          </div>
        </div>
        <div className="rounded-xl bg-slate-50 p-3">
          <div className="text-xs text-slate-500">Phạm vi</div>
          <div className="mt-1 font-semibold text-slate-800">
            {getPromotionScopeLabel(promotion.scope)}
          </div>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3 text-sm text-slate-500">
        <div className="inline-flex items-center gap-2">
          <Gift size={16} />
          <span>{promotion.code || "Không cần mã"}</span>
        </div>
        <div className="inline-flex items-center gap-2">
          <Clock3 size={16} />
          <span>Hết hạn {formatDateTime(promotion.endDate)}</span>
        </div>
      </div>
    </button>
  );
}

function PromotionCardSkeleton() {
  return (
    <div className="animate-pulse rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="h-12 w-12 rounded-2xl bg-slate-200" />
        <div className="h-6 w-24 rounded-full bg-slate-200" />
      </div>
      <div className="mt-5 space-y-3">
        <div className="h-3 w-28 rounded bg-slate-200" />
        <div className="h-6 w-3/4 rounded bg-slate-200" />
        <div className="h-4 w-full rounded bg-slate-200" />
        <div className="h-4 w-4/5 rounded bg-slate-200" />
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="h-20 rounded-xl bg-slate-100" />
        <div className="h-20 rounded-xl bg-slate-100" />
      </div>
      <div className="mt-5 h-4 w-2/3 rounded bg-slate-200" />
    </div>
  );
}

export default function CustomerPromotionPage() {
  const [pageNumber, setPageNumber] = useState(0);
  const [pageSize] = useState(PAGE_SIZE);

  const queryParams = useMemo(
    () => ({
      page: pageNumber + 1,
      pageSize,
      sortBy: "CreatedAt",
      isDescending: true,
    }),
    [pageNumber, pageSize],
  );

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["customer-promotions", queryParams],
    queryFn: async () => {
      const res = await apiService.get("/promotion/customer_guest/all", queryParams);
      if (res?.statusCode === 200) {
        return res.value;
      }
      return { items: [], totalPages: 1, totalCount: 0 };
    },
    keepPreviousData: true,
    staleTime: 30_000,
  });

  const promotions = useMemo(() => data?.items || [], [data]);
  const totalPages = data?.totalPages || 1;
  const totalItems = data?.totalCount || 0;
  const loading = isLoading || isFetching;

  useEffect(() => {
    if (promotions.length > 0) {
      cacheCustomerPromotions(promotions);
    }
  }, [promotions]);

  return (
    <div className="min-h-screen bg-slate-50 pb-10">
      <section className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 py-14">
        <div className="mx-auto max-w-7xl px-4">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-yellow-400 px-4 py-2 text-sm font-bold text-slate-900">
              <TicketPercent size={16} />
              Khuyến mãi đang diễn ra
            </div>
            <h1 className="mt-5 text-3xl font-bold text-white sm:text-4xl">
              Danh sách chương trình ưu đãi dành cho bạn
            </h1>
            <p className="mt-3 text-sm leading-6 text-white/80 sm:text-base">
              Khám phá các khuyến mãi mới nhất và chọn ngay sản phẩm đang nằm
              trong chương trình ưu đãi phù hợp.
            </p>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 pt-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">
              Khuyến mãi nổi bật
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Hiện có {totalItems} chương trình ưu đãi
            </p>
          </div>

          <Link
            to="/products"
            className="hidden rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 sm:inline-flex"
          >
            Xem tất cả sản phẩm
          </Link>
        </div>

        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <PromotionCardSkeleton key={index} />
            ))}
          </div>
        ) : promotions.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white px-6 py-14 text-center shadow-sm">
            <div className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-400">
              <Gift size={28} />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-slate-700">
              Chưa có khuyến mãi nào
            </h3>
            <p className="mt-2 text-sm text-slate-500">
              Hãy quay lại sau để cập nhật thêm các chương trình ưu đãi mới.
            </p>
          </div>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {promotions.map((promotion) => (
                <PromotionCard key={promotion.id} promotion={promotion} />
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

        {loading && !isLoading && (
          <div className="mt-6 flex items-center justify-center gap-2 text-sm text-slate-500">
            <Loader2 size={16} className="animate-spin" />
            Đang cập nhật dữ liệu...
          </div>
        )}
      </div>
    </div>
  );
}
