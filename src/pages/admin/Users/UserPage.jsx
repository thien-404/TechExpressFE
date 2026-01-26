import React, { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { FiSearch, FiSliders } from 'react-icons/fi'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'

import Pagination from '../../../components/common/Pagination'
import RowActions from '../../../components/common/RowActions'
import UserStatus from '../../../components/ui/icon/ActiveStatus.jsx'
import SquareAvatar from '../../../components/ui/avatar/SquareAvatar.jsx'
import { apiService } from '../../../config/axios'

const formatPhone = (s) => (s ? s : '-')

const Pill = ({ children }) => (
  <span className="inline-flex items-center rounded bg-slate-100 px-2 py-1 text-[11px] text-[#334155]">
    {children}
  </span>
)

export default function UsersPage() {
  const navigate = useNavigate()

  /* =========================
   * STATE
   * ========================= */
  const [query, setQuery] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  // FE dùng 0-based
  const [pageNumber, setPageNumber] = useState(0)
  const [pageSize] = useState(10)

  /* =========================
   * FETCH USERS
   * ========================= */
  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['users', pageNumber, pageSize, searchTerm],
    queryFn: async () => {
      const res = await apiService.get('/user/pagination', {
        pageNumber: pageNumber + 1, // FE → BE
        pageSize,
        search: searchTerm || ''
      })

      if (res?.statusCode !== 200) {
        toast.error('Không tải được danh sách người dùng')
        return {
          items: [],
          totalCount: 0,
          totalPages: 1
        }
      }

      return res.value
    },
    keepPreviousData: true,
    staleTime: 30_000
  })

  const loading = isLoading || isFetching
  const rows = data?.items ?? []
  const totalItems = data?.totalCount ?? 0
  const totalPages = data?.totalPages ?? 1


  /* =========================
   * SEARCH
   * ========================= */
  const handleSearch = () => {
    setPageNumber(0)
    setSelected(new Set())
    setSearchTerm(query.trim())
  }

  const onSearchKeyDown = (e) => {
    if (e.key === 'Enter') handleSearch()
  }

  const paddedRows = useMemo(() => {
    const real = rows.slice(0, pageSize)
    const missing = Math.max(0, pageSize - real.length)
    return [...real, ...Array.from({ length: missing }, () => null)]
  }, [rows, pageSize])

  /* =========================
   * RENDER
   * ========================= */
  return (
    <div className="font-[var(--font-inter)]">
      {/* Breadcrumb */}
      <div className="text-xs text-slate-500">
        Home <span className="mx-2">/</span> Người Dùng
      </div>

      {/* Header */}
      <div className="mt-3 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-[#334155]">Người Dùng</h1>

        <button
          type="button"
          onClick={() => toast.info('Chưa làm Add User')}
          className="h-9 rounded bg-[#6e846f] px-4 text-sm font-semibold text-white hover:opacity-90"
        >
          + Add
        </button>
      </div>

      {/* Card */}
      <div className="mt-4 rounded-lg border border-slate-200 bg-white">
        {/* Toolbar */}
        <div className="flex items-center gap-2 px-3 py-3 border-b border-slate-100">
          <div className="relative flex-1">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={onSearchKeyDown}
              placeholder="Search (backend)"
              className="h-10 w-full rounded border border-slate-200 pl-10 pr-3 text-sm outline-none focus:border-slate-400"
            />
          </div>

          <button
            type="button"
            className="h-10 w-10 rounded border border-slate-200 text-slate-600 hover:bg-slate-50 flex items-center justify-center"
          >
            <FiSliders />
          </button>

          <button
            type="button"
            onClick={handleSearch}
            disabled={loading}
            className="h-10 px-4 rounded border text-sm font-semibold text-[#334155] hover:bg-slate-50 disabled:opacity-50"
          >
            <FiSearch className="inline mr-1" />
            Search
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500">
              <tr className="border-b border-slate-100">
                <th className="px-4 py-3 text-left">Họ và tên</th>
                <th className="px-4 py-3 text-left">Vai trò</th>
                <th className="px-4 py-3 text-left">SĐT</th>
                <th className="px-4 py-3 text-left">Gmail</th>
                <th className="px-4 py-3 text-left">Trạng thái</th>
                <th className="px-4 py-3 text-center">Hành động</th>
              </tr>
            </thead>

            <tbody className="text-[#334155]">
              {paddedRows.map((u, idx) => {
                if (!u) {
                  return (
                    <tr key={idx} className="bg-slate-100">
                      <td colSpan={7} className="px-4 py-3">
                        <div className="h-5" />
                      </td>
                    </tr>
                  )
                }

                return (
                  <tr key={u.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <SquareAvatar
                          name={`${u.firstName} ${u.lastName}`}
                          seed={u.email}
                          size="sm"
                        />
                        <div>
                          <div className="font-medium">
                            {u.lastName} {u.firstName}
                          </div>
                          <div className="text-xs text-slate-500">
                            {new Date(u.createdAt).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <Pill>{u.role}</Pill>
                    </td>

                    <td className="px-4 py-3">{formatPhone(u.phone)}</td>
                    <td className="px-4 py-3">{u.email}</td>

                    <td className="px-4 py-3">
                      <UserStatus status={u.status} />
                    </td>

                    <td className="px-4 py-3 text-center">
                      <RowActions
                        status={u.status}
                        showStatusActions={false}
                        onDetail={() => navigate(`/admin/users/${u.id}`)}
                        onUpdate={() => navigate(`/admin/users/${u.id}/edit`)}
                        onDelete={() => toast.error(`Delete: ${u.email}`)}
                      />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="mt-4 flex justify-center">
        <Pagination
          loading={loading}
          pageNumber={pageNumber}
          pageSize={pageSize}
          totalItems={totalItems}
          totalPages={totalPages}
          onPageChange={(p) => {
            setPageNumber(p)
            setSelected(new Set())
          }}
        />
      </div>
    </div>
  )
}
