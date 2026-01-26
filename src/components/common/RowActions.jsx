import React, { useEffect, useRef, useState } from 'react'
import {
  FiMoreHorizontal,
  FiEye,
  FiEdit2,
  FiTrash2,
  FiCheckCircle,
  FiXCircle
} from 'react-icons/fi'

const normalizeStatus = (status) => {
  if (status === undefined || status === null) return undefined
  if (typeof status === 'number') {
    // CommonStatus: 0 Active, 1 Inactive, 2 Deleted
    return status === 0 ? 'Active' : status === 1 ? 'Inactive' : 'Deleted'
  }
  return String(status)
}

export default function RowActions({
  showDetail = true,
  showUpdate = true,
  showDelete = true,

  // ✅ new
  showStatusActions = true,
  status,
  onActivate,
  onDisable,

  onDetail,
  onUpdate,
  onDelete
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const s = normalizeStatus(status)
  const isActive = (s || '').toLowerCase() === 'active'
  const isInactive = (s || '').toLowerCase() === 'inactive' || (s || '').toLowerCase() === 'disabled'
  const isDeleted = (s || '').toLowerCase() === 'deleted'

  return (
    <div ref={ref} className="relative inline-block text-left">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-8 w-8 items-center justify-center rounded hover:bg-slate-100"
        title="Actions"
      >
        <FiMoreHorizontal />
      </button>

      {open && (
        <div className="absolute right-0 z-20 mt-1 w-44 rounded-md border border-slate-200 bg-white shadow-lg">
          <ul className="py-1 text-sm text-[#334155]">
            {showDetail && (
              <li>
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false)
                    onDetail?.()
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 hover:bg-slate-50"
                >
                  <FiEye />
                  Detail
                </button>
              </li>
            )}

            {showUpdate && (
              <li>
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false)
                    onUpdate?.()
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 hover:bg-slate-50"
                >
                  <FiEdit2 />
                  Update
                </button>
              </li>
            )}

            {/* ✅ Status actions */}
            {showStatusActions && !isDeleted && (
              <>
                <li className="my-1 border-t border-slate-100" />

                <li>
                  <button
                    type="button"
                    disabled={isActive}
                    onClick={() => {
                      setOpen(false)
                      onActivate?.()
                    }}
                    className={[
                      'flex w-full items-center gap-2 px-3 py-2 hover:bg-slate-50',
                      isActive ? 'text-slate-300 cursor-not-allowed' : 'text-emerald-700'
                    ].join(' ')}
                    title={isActive ? 'User đang Active' : 'Activate user'}
                  >
                    <FiCheckCircle />
                    Activate
                  </button>
                </li>

                <li>
                  <button
                    type="button"
                    disabled={isInactive}
                    onClick={() => {
                      setOpen(false)
                      onDisable?.()
                    }}
                    className={[
                      'flex w-full items-center gap-2 px-3 py-2 hover:bg-slate-50',
                      isInactive ? 'text-slate-300 cursor-not-allowed' : 'text-rose-700'
                    ].join(' ')}
                    title={isInactive ? 'User đang Disabled' : 'Disable user'}
                  >
                    <FiXCircle />
                    Disable
                  </button>
                </li>
              </>
            )}

            {showDelete && (
              <>
                <li className="my-1 border-slate-100" />
                <li>
                  <button
                    type="button"
                    onClick={() => {
                      setOpen(false)
                      onDelete?.()
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50"
                  >
                    <FiTrash2 />
                    Delete
                  </button>
                </li>
              </>
            )}
          </ul>
        </div>
      )}
    </div>
  )
}
