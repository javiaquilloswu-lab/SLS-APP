import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface PaginationMeta {
  current_page: number;
  per_page: number;
  total_records: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

interface AdminPaginationProps {
  pagination?: PaginationMeta;
  onPageChange: (newPage: number) => void;
  onLimitChange: (newLimit: number) => void;
  loading?: boolean;
}

export const AdminPagination: React.FC<AdminPaginationProps> = ({
  pagination,
  onPageChange,
  onLimitChange,
  loading = false
}) => {
  if (!pagination || pagination.total_records === 0) {
    return null;
  }

  const { current_page, per_page, total_records, total_pages, has_next, has_prev } = pagination;
  const startItem = (current_page - 1) * per_page + 1;
  const endItem = Math.min(current_page * per_page, total_records);

  return (
    <div className="bg-white px-4 py-3 border-t border-[#D9E0E6] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#5F6B76] rounded-b-xl">
      <div className="flex items-center gap-3">
        <span>
          Showing <strong className="text-[#17202A] font-semibold">{startItem}–{endItem}</strong> of{' '}
          <strong className="text-[#17202A] font-semibold">{total_records}</strong> records
        </span>

        <div className="flex items-center gap-1.5 pl-3 border-l border-[#D9E0E6]">
          <label htmlFor="per-page-select" className="text-slate-500 font-medium">Per page:</label>
          <select
            id="per-page-select"
            value={per_page}
            onChange={(e) => onLimitChange(Number(e.target.value))}
            className="py-1 px-2 bg-[#F5F7FA] border border-[#D9E0E6] rounded text-xs font-semibold text-[#17202A] focus:outline-none focus:border-[#17324D]"
          >
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(current_page - 1)}
          disabled={!has_prev || loading}
          className="px-2.5 py-1.5 bg-white border border-[#D9E0E6] hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white text-[#17324D] font-semibold rounded-lg shadow-sm flex items-center gap-1 transition-all"
        >
          <ChevronLeft size={14} />
          <span>Previous</span>
        </button>

        <span className="px-2 py-1 font-semibold text-[#17324D]">
          Page {current_page} of {total_pages || 1}
        </span>

        <button
          onClick={() => onPageChange(current_page + 1)}
          disabled={!has_next || loading}
          className="px-2.5 py-1.5 bg-white border border-[#D9E0E6] hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white text-[#17324D] font-semibold rounded-lg shadow-sm flex items-center gap-1 transition-all"
        >
          <span>Next</span>
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
};
