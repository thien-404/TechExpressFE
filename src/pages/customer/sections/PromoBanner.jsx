import { useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Clock, TicketPercent, Zap } from "lucide-react";

import { promotionService } from "../../../services/promotionService";
import {
  cacheCustomerPromotions,
  formatDateTime,
  formatPromotionValue,
  getPromotionStatus,
  getPromotionTypeLabel,
} from "../../admin/Promotions/promotionHelpers";

function PromoCard({ promotion, index, onClick }) {
  const status = getPromotionStatus(promotion);

  return (
    <button
      type="button"
      onClick={() => onClick(promotion)}
      className="min-w-[290px] flex-1 rounded-2xl border border-white/10 bg-white/10 p-5 text-left backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:bg-white/15"
      style={{ transitionDelay: `${index * 40}ms` }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-yellow-400 text-slate-900">
          <TicketPercent size={22} />
        </div>
        <span
          className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${status.className}`}
        >
          {status.label}
        </span>
      </div>

      <div className="mt-5">
        <div className="text-xs font-semibold uppercase tracking-[0.2em] text-yellow-300">
          {getPromotionTypeLabel(promotion)}
        </div>
        <h3 className="mt-2 line-clamp-2 text-xl font-bold text-white">
          {promotion.name}
        </h3>
        <p className="mt-3 line-clamp-2 text-sm leading-6 text-white/70">
          {promotion.description ||
            "Khuyến mãi đang áp dụng cho nhiều sản phẩm nổi bật."}
        </p>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-white/10 p-3">
          <div className="text-xs text-white/60">Giá trị</div>
          <div className="mt-1 font-semibold text-yellow-300">
            {formatPromotionValue(promotion)}
          </div>
        </div>
        <div className="rounded-xl bg-white/10 p-3">
          <div className="text-xs text-white/60">Code</div>
          <div className="mt-1 font-semibold text-white">
            {promotion.code || "Không cần mã"}
          </div>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between text-sm text-white/70">
        <div className="inline-flex items-center gap-2">
          <Clock size={16} />
          <span>{formatDateTime(promotion.endDate)}</span>
        </div>
        <div className="inline-flex items-center gap-2 font-semibold text-white">
          Xem sản phẩm
          <ArrowRight size={16} />
        </div>
      </div>
    </button>
  );
}

function PromoBannerSkeleton() {
  return (
    <section className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 py-12">
      <div className="mx-auto max-w-7xl px-4">
        <div className="animate-pulse rounded-3xl border border-white/10 bg-white/5 p-8">
          <div className="h-10 w-32 rounded-full bg-white/10" />
          <div className="mt-6 h-10 w-2/3 rounded bg-white/10" />
          <div className="mt-4 h-4 w-1/2 rounded bg-white/10" />
          <div className="mt-8 flex gap-4 overflow-hidden">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="min-w-[290px] flex-1 rounded-2xl bg-white/10 p-5"
              >
                <div className="h-12 w-12 rounded-2xl bg-white/10" />
                <div className="mt-5 h-4 w-24 rounded bg-white/10" />
                <div className="mt-3 h-6 w-4/5 rounded bg-white/10" />
                <div className="mt-3 h-4 w-full rounded bg-white/10" />
                <div className="mt-6 h-24 rounded-xl bg-white/10" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default function PromoBanner() {
  const navigate = useNavigate();
  const scrollRef = useRef(null);
  const isDraggingRef = useRef(false);
  const dragMovedRef = useRef(false);
  const dragStartXRef = useRef(0);
  const dragStartScrollLeftRef = useRef(0);

  const { data, isLoading } = useQuery({
    queryKey: ["customer-promotions-banner"],
    queryFn: async () => {
      const response = await promotionService.getCustomerPromotions({
        page: 1,
        pageSize: 6,
        sortBy: "CreatedAt",
        isDescending: true,
      });

      if (response.succeeded) {
        return response.value?.items || [];
      }

      return [];
    },
    staleTime: 30_000,
  });

  const promotions = useMemo(() => data || [], [data]);

  const handleDragStart = (event) => {
    if (!scrollRef.current) return;

    isDraggingRef.current = true;
    dragMovedRef.current = false;
    dragStartXRef.current = event.clientX;
    dragStartScrollLeftRef.current = scrollRef.current.scrollLeft;
    scrollRef.current.style.cursor = "grabbing";
  };

  const handleDragMove = (event) => {
    if (!isDraggingRef.current || !scrollRef.current) return;

    const delta = event.clientX - dragStartXRef.current;
    if (Math.abs(delta) > 6) {
      dragMovedRef.current = true;
    }

    scrollRef.current.scrollLeft = dragStartScrollLeftRef.current - delta;
  };

  const handleDragEnd = () => {
    if (!scrollRef.current) return;

    isDraggingRef.current = false;
    scrollRef.current.style.cursor = "grab";

    window.setTimeout(() => {
      dragMovedRef.current = false;
    }, 0);
  };

  const handlePromotionClick = (promotion) => {
    if (dragMovedRef.current) return;

    navigate(`/promotions/${promotion.id}`, {
      state: { promotion },
    });
  };

  useEffect(() => {
    if (promotions.length > 0) {
      cacheCustomerPromotions(promotions);
    }
  }, [promotions]);

  if (isLoading) {
    return <PromoBannerSkeleton />;
  }

  if (promotions.length === 0) {
    return null;
  }

  return (
    <section className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 py-12">
      <div className="mx-auto max-w-7xl px-4">
        <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-sm lg:p-10">
          <div className="relative">
            <div className="absolute -right-16 -top-20 h-56 w-56 rounded-full bg-yellow-400/15 blur-3xl" />
            <div className="absolute left-1/3 top-10 h-40 w-40 rounded-full bg-sky-400/10 blur-3xl" />

            <div className="relative">
              <div className="inline-flex items-center gap-2 rounded-full bg-yellow-400 px-4 py-2 text-sm font-bold text-slate-900">
                <Zap size={16} />
                Khuyến mãi nổi bật hôm nay
              </div>

              <div className="mt-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div className="max-w-2xl">
                  <h2 className="text-3xl font-bold text-white lg:text-4xl">
                    Khám phá các chương trình ưu đãi đang diễn ra
                  </h2>
                  <p className="mt-3 text-sm leading-7 text-white/75 lg:text-base">
                    Chọn một chương trình khuyến mãi để xem nhanh các sản phẩm
                    đang được áp dụng ưu đãi.
                  </p>
                  <p className="mt-2 text-xs font-medium uppercase tracking-[0.18em] text-white/45">
                    Giữ chuột và kéo để xem thêm ưu đãi
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => navigate("/promotions")}
                  className="inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 text-sm font-semibold text-[#0090D0] transition-colors hover:bg-slate-100"
                >
                  Xem tất cả khuyến mãi
                  <ArrowRight size={16} />
                </button>
              </div>

              <div
                ref={scrollRef}
                className="mt-8 flex cursor-grab gap-4 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                onMouseDown={handleDragStart}
                onMouseMove={handleDragMove}
                onMouseUp={handleDragEnd}
                onMouseLeave={handleDragEnd}
              >
                {promotions.map((promotion, index) => (
                  <PromoCard
                    key={promotion.id}
                    promotion={promotion}
                    index={index}
                    onClick={handlePromotionClick}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
