import React, { useMemo, useState } from "react";
import { toast } from "sonner";
import { FiSearch, FiSliders } from "react-icons/fi";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
// import { queryClient } from "../../../config/queryClient.jsx";

import Pagination from "../../../components/common/Pagination";
import RowActions from "../../../components/common/RowActions";
import UserStatus from "../../../components/ui/icon/ActiveStatus.jsx";
import SquareAvatar from "../../../components/ui/avatar/SquareAvatar.jsx";
import Breadcrumb from "../../../components/ui/Breadcrumb.jsx";
import { apiService } from "../../../config/axios";

/* =========================
 * BADGE
 * ========================= */
const Badge = ({ children, variant = "default" }) => {
  const variants = {
    default: "bg-slate-100 text-[#334155]",
    admin: "bg-purple-100 text-purple-700",
    user: "bg-blue-100 text-blue-700",
    moderator: "bg-indigo-100 text-indigo-700",
  };

  return (
    <span
      className={`inline-flex items-center rounded px-2 py-1 text-[11px] ${variants[variant] || variants.default}`}
    >
      {children}
    </span>
  );
};

/* =========================
 * MAIN PAGE
 * ========================= */
export default function UsersPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [pageNumber, setPageNumber] = useState(0);
  const [pageSize] = useState(10);

  /* =========================
   * FETCH DATA
   * ========================= */
  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["users", pageNumber, pageSize, searchTerm],
    queryFn: async () => {
      const res = await apiService.get("/user/pagination", {
        pageNumber: pageNumber + 1,
        pageSize,
        search: searchTerm || "",
      });

      if (res?.statusCode !== 200) {
        toast.error("Không thể tải danh sách người dùng");
        return { items: [], totalCount: 0, totalPages: 1 };
      }

      return res.value;
    },
    keepPreviousData: true,
    staleTime: 30_000,
  });

  const loading = isLoading || isFetching;
  const rows = data?.items ?? [];
  const totalItems = data?.totalCount ?? 0;
  const totalPages = data?.totalPages ?? 1;

  /* =========================
   * DELETE USER
   * ========================= */
  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const res = await apiService.delete(`/user/${id}`);
      if (res?.statusCode !== 200) {
        throw new Error(res?.message || "Xóa người dùng thất bại");
      }
      return res;
    },
    onSuccess: () => {
      toast.success("Đã xóa người dùng");
      // queryClient.invalidateQueries({ queryKey: ["users"] }); // list page
    },
    onError: (err) => {
      toast.error(err?.message || "Xóa người dùng thất bại");
    },
  });

  const onDeleteUser = (id) => {
    const ok = window.confirm(
      `Bạn có chắc chắn muốn xóa người dùng ""?\nHành động này không thể hoàn tác.`,
    );
    if (!ok) return;

    deleteMutation.mutate(id);
  };

  /* =========================
   * HANDLERS
   * ========================= */
  const handleSearch = () => {
    setPageNumber(0);
    setSearchTerm(query.trim());
  };

  const paddedRows = useMemo(() => {
    const real = rows.slice(0, pageSize);
    const missing = Math.max(0, pageSize - real.length);
    return [...real, ...Array.from({ length: missing }, () => null)];
  }, [rows, pageSize]);

  const getRoleBadgeVariant = (role) => {
    const map = {
      admin: "admin",
      user: "user",
      staff: "staff",
    };
    return map[role?.toLowerCase()] || "default";
  };

  /* =========================
   * RENDER
   * ========================= */
  return (
    <div className="font-[var(--font-inter)]">
      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { label: "Trang chủ", href: "/admin" },
          { label: "Quản lý người dùng" },
        ]}
      />

      {/* Header */}
      <div className="mt-3 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-[#334155]">
          Quản lý người dùng
        </h1>

        <button
          type="button"
          onClick={() => navigate("/admin/staff/create")}
          className="h-9 rounded bg-[#0A804A] px-4 text-sm font-semibold text-white hover:opacity-90"
        >
          + Thêm Staff
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
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Tìm kiếm theo tên, email, số điện thoại..."
              className="h-10 w-full rounded border border-slate-200 pl-10 pr-3 text-sm outline-none focus:border-slate-400"
            />
          </div>

          <button
            type="button"
            onClick={() => toast.info("Bộ lọc nâng cao đang phát triển")}
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
            Tìm kiếm
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500">
              <tr className="border-b border-slate-100">
                <th className="px-4 py-3 text-left">Người dùng</th>
                <th className="px-4 py-3 text-left">Vai trò</th>
                <th className="px-4 py-3 text-left">Số điện thoại</th>
                <th className="px-4 py-3 text-left">Email</th>
                <th className="px-4 py-3 text-left">Trạng thái</th>
                <th className="px-4 py-3 text-center">Thao tác</th>
              </tr>
            </thead>

            <tbody className="text-[#334155]">
              {paddedRows.map((user, idx) => {
                if (!user) {
                  return (
                    <tr key={`empty-${idx}`} className="bg-slate-100">
                      <td colSpan={6} className="px-4 py-3">
                        <div className="h-5" />
                      </td>
                    </tr>
                  );
                }

                const fullName =
                  `${user.firstName || ""} ${user.lastName || ""}`.trim();

                return (
                  <tr
                    key={user.id}
                    className="border-b border-slate-100 hover:bg-slate-50"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <SquareAvatar
                          name={fullName}
                          seed={user.avatarImage}
                          size="sm"
                        />
                        <div>
                          <div className="font-medium">
                            {fullName || "Chưa có tên"}
                          </div>
                          <div className="text-xs text-slate-500">
                            {new Date(user.createdAt).toLocaleDateString(
                              "vi-VN",
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <Badge variant={getRoleBadgeVariant(user.role)}>
                        {user.role}
                      </Badge>
                    </td>

                    <td className="px-4 py-3">{user.phone || "-"}</td>
                    <td className="px-4 py-3">{user.email}</td>

                    <td className="px-4 py-3">
                      <UserStatus status={user.status} />
                    </td>

                    <td className="px-4 py-3 text-center">
                      <RowActions
                        status={user.status}
                        showStatusActions={false}
                        onDetail={() => navigate(`/admin/users/${user.id}`)}
                        onUpdate={() =>
                          navigate(`/admin/users/${user.id}/edit`)
                        }
                        onDelete={() => onDeleteUser(user.id)}
                      />
                    </td>
                  </tr>
                );
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
          onPageChange={setPageNumber}
        />
      </div>
    </div>
  );
}
