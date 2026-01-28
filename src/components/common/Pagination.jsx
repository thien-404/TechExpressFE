import React, { useMemo } from 'react'
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi'

export default function Pagination({
  pageNumber = 0,      // 0-based (như response bạn đưa)
  pageSize = 10,
  totalItems = 0,
  totalPages = 1,
  loading = false,
  onPageChange
}) {
  const canPrev = pageNumber > 0 && !loading
  const canNext = pageNumber < totalPages - 1 && !loading

  const from = totalItems === 0 ? 0 : pageNumber * pageSize + 1
  const to = Math.min(totalItems, (pageNumber + 1) * pageSize)

  const pages = useMemo(() => {
    // hiển thị tối đa 5 nút trang cho gọn
    const maxButtons = 5
    const half = Math.floor(maxButtons / 2)

    let start = Math.max(0, pageNumber - half)
    let end = Math.min(totalPages - 1, start + maxButtons - 1)

    // chỉnh lại start nếu end chạm trần
    start = Math.max(0, end - (maxButtons - 1))

    const arr = []
    for (let p = start; p <= end; p++) arr.push(p)
    return arr
  }, [pageNumber, totalPages])

  return (
  <div className="flex flex-col items-center gap-2 px-4 py-3 text-sm">
    {/* Pagination buttons */}
    <div className="flex items-center gap-2">
      <button
        type="button"
        disabled={!canPrev}
        onClick={() => onPageChange(pageNumber - 1)}
        className={[
          'h-9 px-3 rounded border flex items-center gap-2',
          canPrev
            ? 'border-slate-200 text-[#334155] hover:bg-slate-50'
            : 'border-slate-200 text-slate-300 cursor-not-allowed bg-slate-50'
        ].join(' ')}
      >
        <FiChevronLeft />
        Prev
      </button>

      <div className="flex items-center overflow-hidden rounded border border-slate-200">
        {pages[0] > 0 && (
          <>
            <PageBtn
              p={0}
              active={pageNumber === 0}
              disabled={loading}
              onClick={onPageChange}
            />
            {pages[0] > 1 && <span className="px-2 text-slate-400">…</span>}
          </>
        )}

        {pages.map((p) => (
          <PageBtn
            key={p}
            p={p}
            active={p === pageNumber}
            disabled={loading}
            onClick={onPageChange}
          />
        ))}

        {pages[pages.length - 1] < totalPages - 1 && (
          <>
            {pages[pages.length - 1] < totalPages - 2 && (
              <span className="px-2 text-slate-400">…</span>
            )}
            <PageBtn
              p={totalPages - 1}
              active={pageNumber === totalPages - 1}
              disabled={loading}
              onClick={onPageChange}
            />
          </>
        )}
      </div>

      <button
        type="button"
        disabled={!canNext}
        onClick={() => onPageChange(pageNumber + 1)}
        className={[
          'h-9 px-3 rounded border flex items-center gap-2',
          canNext
            ? 'border-slate-200 text-[#334155] hover:bg-slate-50'
            : 'border-slate-200 text-slate-300 cursor-not-allowed bg-slate-50'
        ].join(' ')}
      >
        Next
        <FiChevronRight />
      </button>
    </div>

    {/* Showing info – xuống dưới */}
    <div className="text-slate-500 text-xs">
      {loading ? (
        'Loading...'
      ) : (
        <>
          Showing <span className="font-semibold text-[#334155]">{from}</span>–
          <span className="font-semibold text-[#334155]">{to}</span> of{' '}
          <span className="font-semibold text-[#334155]">{totalItems}</span>
        </>
      )}
    </div>
  </div>
)

}

function PageBtn({ p, active, disabled, onClick }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onClick(p)}
      className={[
        'h-9 w-10 text-sm border-r border-slate-200 last:border-r-0',
        active
          ? 'bg-[#0A804A] text-white font-semibold'
          : 'bg-white text-[#334155] hover:bg-slate-50',
        disabled ? 'opacity-60 cursor-not-allowed' : ''
      ].join(' ')}
      title={`Page ${p + 1}`}
    >
      {p + 1}
    </button>
  )
}
