import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Clock3, Gift, Loader2, TicketPercent } from "lucide-react";

import { promotionService } from "../../../../services/promotionService";
import {
  cacheCustomerPromotions,
  formatDateTime,
  formatPromotionValue,
  getPromotionScopeLabel,
  getPromotionStatus,
  getPromotionTypeLabel,
} from "../../../admin/Promotions/promotionHelpers";

const PAGE_SIZE = 6;

function VoucherCard({ promotion }) {
  const navigate = useNavigate();
  const status = getPromotionStatus(promotion);

  return (
    <button
      type="button"
      onClick={() =>
        navigate(`/promotions/${promotion.id}`, {
          state: { promotion },
        })
      }
      className="w-full rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition-all hover:-translate-y-1 hover:border-[#0090D0]/30 hover:shadow-lg"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[#0090D0]/10 text-[#0090D0]">
          <TicketPercent size={20} />
        </div>
        <span
          className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${status.className}`}
        >
          {status.label}
        </span>
      </div>

      <div className="mt-4">
        <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[#0090D0]">
          {getPromotionTypeLabel(promotion)}
        </div>
        <h3 className="mt-2 line-clamp-2 text-lg font-bold text-slate-900">
          {promotion.name}
        </h3>
        <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">
          {promotion.description || "Ưu đãi đang áp dụng cho nhiều sản phẩm nổi bật."}
        </p>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
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

      <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-slate-500">
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

function VoucherCardSkeleton() {
  return (
    <div className="animate-pulse rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="h-11 w-11 rounded-2xl bg-slate-200" />
        <div className="h-6 w-24 rounded-full bg-slate-200" />
      </div>
      <div className="mt-4 space-y-3">
        <div className="h-3 w-28 rounded bg-slate-200" />
        <div className="h-6 w-3/4 rounded bg-slate-200" />
        <div className="h-4 w-full rounded bg-slate-200" />
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="h-20 rounded-xl bg-slate-100" />
        <div className="h-20 rounded-xl bg-slate-100" />
      </div>
      <div className="mt-4 h-4 w-2/3 rounded bg-slate-200" />
    </div>
  );
}

export default function VoucherTab() {
  const [pageNumber, setPageNumber] = useState(0);

  const queryParams = useMemo(
    () => ({
      page: pageNumber + 1,
      pageSize: PAGE_SIZE,
      sortBy: "CreatedAt",
      isDescending: true,
    }),
    [pageNumber],
  );

  const { data, isLoading, isFetching, isError, error, refetch } = useQuery({
    queryKey: ["account-vouchers", queryParams],
    queryFn: async () => {
      const response = await promotionService.getCustomerPromotions(queryParams);

      if (!response.succeeded) {
        throw new Error(response.message || "Không thể tải danh sách voucher");
      }

      return response.value;
    },
    staleTime: 30_000,
    placeholderData: (previousData) => previousData,
  });

  const promotions = useMemo(() => data?.items || [], [data]);
  const totalPages = Math.max(data?.totalPages || 1, 1);
  const totalCount = data?.totalCount || 0;

  useEffect(() => {
    if (promotions.length > 0) {
      cacheCustomerPromotions(promotions);
    }
  }, [promotions]);

  useEffect(() => {
    if (pageNumber > totalPages - 1) {
      setPageNumber(Math.max(totalPages - 1, 0));
    }
  }, [pageNumber, totalPages]);

  return (
    <section className="flex-1 min-w-0 w-full rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Kho voucher</h2>
          <p className="mt-1 text-xs text-slate-500">
            Tổng cộng {totalCount} chương trình ưu đãi đang khả dụng.
          </p>
        </div>
        <button
          type="button"
          onClick={() => refetch()}
          className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Làm mới
        </button>
      </div>

      {isLoading && (
        <div className="mt-4 grid gap-4 xl:grid-cols-2">
          {Array.from({ length: PAGE_SIZE }).map((_, index) => (
            <VoucherCardSkeleton key={index} />
          ))}
        </div>
      )}

      {isError && !isLoading && (
        <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-4">
          <p className="text-sm font-semibold text-rose-700">Tải voucher thất bại</p>
          <p className="mt-1 text-xs text-rose-600">{error?.message || "Có lỗi xảy ra"}</p>
          <button
            type="button"
            onClick={() => refetch()}
            className="mt-3 h-9 rounded-lg bg-rose-600 px-4 text-sm font-semibold text-white hover:bg-rose-700"
          >
            Thử lại
          </button>
        </div>
      )}

      {!isLoading && !isError && promotions.length === 0 && (
        <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center">
          <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-full bg-white text-slate-400 shadow-sm">
            <Gift size={24} />
          </div>
          <h3 className="mt-4 text-sm font-semibold text-slate-700">Chưa có voucher nào</h3>
          <p className="mt-2 text-sm text-slate-500">
            Hãy quay lại sau để cập nhật thêm các chương trình ưu đãi mới.
          </p>
        </div>
      )}

      {!isLoading && !isError && promotions.length > 0 && (
        <>
          <div className="mt-4 grid gap-4 xl:grid-cols-2">
            {promotions.map((promotion) => (
              <VoucherCard key={promotion.id} promotion={promotion} />
            ))}
          </div>

          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-slate-600">
              Trang {pageNumber + 1}/{totalPages} - {totalCount} voucher
            </p>
            <div className="flex w-full gap-2 sm:w-auto">
              <button
                type="button"
                disabled={pageNumber === 0 || isFetching}
                onClick={() => setPageNumber((prev) => Math.max(prev - 1, 0))}
                className="h-9 flex-1 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none"
              >
                Trang trước
              </button>
              <button
                type="button"
                disabled={pageNumber >= totalPages - 1 || isFetching}
                onClick={() =>
                  setPageNumber((prev) => Math.min(prev + 1, totalPages - 1))
                }
                className="h-9 flex-1 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none"
              >
                Trang sau
              </button>
            </div>
          </div>
        </>
      )}

      {isFetching && !isLoading && (
        <div className="mt-4 flex items-center justify-center gap-2 text-sm text-slate-500">
          <Loader2 size={16} className="animate-spin" />
          Đang cập nhật danh sách voucher...
        </div>
      )}
    </section>
  );
}
