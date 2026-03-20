import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, RefreshCw } from "lucide-react";

import Breadcrumb from "../ui/Breadcrumb";
import TicketPaginationBar from "./TicketPaginationBar";
import TicketSummaryCard from "./TicketSummaryCard";
import useTicketSignalR from "../../hooks/useTicketSignalR";
import { ticketService } from "../../services/ticketService";
import {
  sortDirectionOptions,
  ticketSortByOptions,
  ticketStatusOptions,
} from "../../utils/ticket";

const PAGE_SIZE = 10;

export default function TicketManagementListView({ basePath, roleLabel }) {
  const queryClient = useQueryClient();
  const [pageNumber, setPageNumber] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [sortBy, setSortBy] = useState("UpdatedAt");
  const [sortDirection, setSortDirection] = useState("Desc");

  const listParams = useMemo(
    () => ({
      page: pageNumber,
      pageSize: PAGE_SIZE,
      status: statusFilter || null,
      sortBy,
      sortDirection,
    }),
    [pageNumber, sortBy, sortDirection, statusFilter]
  );

  const ticketsQuery = useQuery({
    queryKey: ["tickets", "manage", basePath, listParams],
    queryFn: async () => {
      const response = await ticketService.getAllTickets(listParams);
      if (!response.succeeded || !response.value) {
        throw new Error(response.message || "Không thể tải danh sách ticket.");
      }
      return response.value;
    },
    placeholderData: (previousValue) => previousValue,
  });

  useTicketSignalR({
    enabled: true,
    onTicketUpdated: () => {
      queryClient.invalidateQueries({ queryKey: ["tickets", "manage", basePath] });
    },
    onTicketMessageReceived: () => {
      queryClient.invalidateQueries({ queryKey: ["tickets", "manage", basePath] });
    },
  });

  return (
    <div className="space-y-5">
      <Breadcrumb
        items={[
          { label: "Trang chủ", href: basePath },
          { label: `${roleLabel} quản lý ticket` },
        ]}
      />

      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Quản lý ticket</h1>
          <p className="mt-1 text-sm text-slate-500">
            Theo dõi ticket mới, cập nhật trạng thái và trả lời khách hàng theo thời gian thực.
          </p>
        </div>

        <button
          type="button"
          onClick={() => ticketsQuery.refetch()}
          className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-300 px-4 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          <RefreshCw size={16} />
          Làm mới
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:grid-cols-4">
        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-slate-700">Trạng thái</span>
          <select
            value={statusFilter}
            onChange={(event) => {
              setPageNumber(1);
              setStatusFilter(event.target.value);
            }}
            className="h-11 w-full rounded-xl border border-slate-300 px-4 text-sm outline-none focus:border-[#0090D0]"
          >
            <option value="">Tất cả trạng thái</option>
            {ticketStatusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-slate-700">Sắp xếp theo</span>
          <select
            value={sortBy}
            onChange={(event) => {
              setPageNumber(1);
              setSortBy(event.target.value);
            }}
            className="h-11 w-full rounded-xl border border-slate-300 px-4 text-sm outline-none focus:border-[#0090D0]"
          >
            {ticketSortByOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-slate-700">Thứ tự</span>
          <select
            value={sortDirection}
            onChange={(event) => {
              setPageNumber(1);
              setSortDirection(event.target.value);
            }}
            className="h-11 w-full rounded-xl border border-slate-300 px-4 text-sm outline-none focus:border-[#0090D0]"
          >
            {sortDirectionOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
          <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Tổng số ticket
          </div>
          <div className="mt-1 text-2xl font-semibold text-slate-900">
            {ticketsQuery.data?.totalCount || 0}
          </div>
        </div>
      </div>

      {ticketsQuery.isLoading ? (
        <div className="flex h-52 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50">
          <Loader2 size={26} className="animate-spin text-[#0090D0]" />
        </div>
      ) : ticketsQuery.isError ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-6 text-sm text-rose-700">
          {ticketsQuery.error?.message || "Không thể tải danh sách ticket."}
        </div>
      ) : ticketsQuery.data?.items?.length ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            {ticketsQuery.data.items.map((item) => (
              <TicketSummaryCard
                key={item.id}
                item={item}
                to={`${basePath}/tickets/${item.id}`}
              />
            ))}
          </div>

          <TicketPaginationBar
            pageNumber={ticketsQuery.data.pageNumber}
            totalPages={ticketsQuery.data.totalPages}
            totalCount={ticketsQuery.data.totalCount}
            pageSize={ticketsQuery.data.pageSize}
            loading={ticketsQuery.isFetching}
            onPageChange={setPageNumber}
          />
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
          Không có ticket nào phù hợp với bộ lọc hiện tại.
        </div>
      )}
    </div>
  );
}