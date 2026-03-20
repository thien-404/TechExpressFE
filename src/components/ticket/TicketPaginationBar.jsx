export default function TicketPaginationBar({
  pageNumber = 1,
  totalPages = 1,
  totalCount = 0,
  pageSize = 10,
  onPageChange,
  loading = false,
}) {
  const canGoPrevious = pageNumber > 1 && !loading;
  const canGoNext = pageNumber < totalPages && !loading;
  const from = totalCount === 0 ? 0 : (pageNumber - 1) * pageSize + 1;
  const to = Math.min(totalCount, pageNumber * pageSize);

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm md:flex-row md:items-center md:justify-between">
      <div className="text-sm text-slate-600">
        Hiển thị {from}-{to} trên tổng số {totalCount} ticket
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={!canGoPrevious}
          onClick={() => onPageChange?.(pageNumber - 1)}
          className="inline-flex h-10 items-center rounded-lg border border-slate-300 px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Trang trước
        </button>

        <span className="text-sm font-medium text-slate-700">
          Trang {pageNumber}/{totalPages}
        </span>

        <button
          type="button"
          disabled={!canGoNext}
          onClick={() => onPageChange?.(pageNumber + 1)}
          className="inline-flex h-10 items-center rounded-lg bg-[#0090D0] px-4 text-sm font-semibold text-white transition hover:bg-[#0077B0] disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          Trang sau
        </button>
      </div>
    </div>
  );
}