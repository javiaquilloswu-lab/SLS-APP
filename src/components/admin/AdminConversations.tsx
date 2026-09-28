import React, { useState, useEffect } from 'react';
import {
  BotMessageSquare,
  RefreshCw,
  Search,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowRight,
  Headphones,
  ShieldCheck,
  UserCheck
} from 'lucide-react';
import { AdminApi, AdminConcern } from '../../services/adminApi';

interface AdminConversationsProps {
  onSelectTicket: (ticketRef: string) => void;
  onShowMessage: (msg: string, isError?: boolean) => void;
}

export const AdminConversations: React.FC<AdminConversationsProps> = ({
  onSelectTicket,
  onShowMessage
}) => {
  const [concerns, setConcerns] = useState<AdminConcern[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');

  const fetchConcerns = async () => {
    setLoading(true);
    try {
      const res = await AdminApi.getConcerns(statusFilter);
      if (res.success && res.data) {
        setConcerns(res.data);
      } else {
        onShowMessage(res.message || 'Unable to query AI conversations.', true);
      }
    } catch (err: any) {
      onShowMessage('Error querying conversations: ' + err.message, true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConcerns();
  }, [statusFilter]);

  const filtered = concerns.filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (c.student_name && c.student_name.toLowerCase().includes(q)) ||
      c.student_id.toLowerCase().includes(q) ||
      c.ticket_ref.toLowerCase().includes(q) ||
      c.category.toLowerCase().includes(q) ||
      c.message.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#17324D] tracking-tight">AI Conversations & Escalated Concerns</h1>
          <p className="text-sm text-[#5F6B76]">
            Supervise AI student interactions, take over critical inquiries, and dispatch official staff replies
          </p>
        </div>
        <button
          onClick={fetchConcerns}
          disabled={loading}
          className="self-start sm:self-auto flex items-center gap-2 px-3.5 py-2 bg-white border border-[#D9E0E6] hover:bg-slate-50 text-[#17324D] text-sm font-semibold rounded-lg shadow-sm transition-all"
        >
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          <span>Refresh Queue</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-[#D9E0E6] shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search size={18} className="absolute left-3.5 top-3 text-[#5F6B76]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by student name, ID, ticket ref (SL-2026-...), or message..."
            className="w-full pl-10 pr-4 py-2 bg-[#F5F7FA] border border-[#D9E0E6] focus:border-[#17324D] rounded-lg text-xs text-[#17202A] placeholder-slate-400 focus:outline-none focus:bg-white transition-colors"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {['all', 'Escalated', 'Staff Handling', 'Open', 'Resolved'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                statusFilter === status
                  ? 'bg-[#17324D] text-white shadow-sm'
                  : 'bg-[#F5F7FA] text-[#5F6B76] hover:bg-slate-200'
              }`}
            >
              {status === 'all' ? 'All Inquiries' : status}
            </button>
          ))}
        </div>
      </div>

      {/* Conversations Table */}
      <div className="bg-white rounded-xl border border-[#D9E0E6] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F5F7FA] border-b border-[#D9E0E6] text-xs font-bold uppercase tracking-wider text-[#5F6B76]">
                <th className="py-3.5 px-4">Ticket Ref</th>
                <th className="py-3.5 px-4">Student & Program</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Status & AI State</th>
                <th className="py-3.5 px-4">Inquiry Excerpt</th>
                <th className="py-3.5 px-4 whitespace-nowrap">Updated</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D9E0E6] text-sm text-[#17202A]">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    Querying conversation tickets from PostgreSQL...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    No conversation tickets found.
                  </td>
                </tr>
              ) : (
                filtered.map((item) => {
                  const isStaffHandling = item.status.toLowerCase().includes('staff') || item.is_ai_paused;
                  const isEscalated = item.status.toLowerCase().includes('escalat') || item.status.toLowerCase().includes('review');
                  const isResolved = item.status.toLowerCase().includes('resolv') || item.status.toLowerCase().includes('close');

                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-slate-50/70 transition-colors ${
                        isEscalated ? 'bg-rose-50/20' : ''
                      }`}
                    >
                      <td className="py-3.5 px-4 font-mono text-xs font-bold text-[#17324D] whitespace-nowrap">
                        {item.ticket_ref}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-xs text-[#17202A]">{item.student_name || 'Student'}</div>
                        <div className="text-[11px] text-[#5F6B76]">{item.student_id} • {item.course}</div>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-[#17324D] border border-slate-200">
                          {item.category}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            isResolved
                              ? 'bg-emerald-50 text-[#2E7D5B] border border-emerald-200'
                              : isStaffHandling
                              ? 'bg-blue-50 text-[#2867A8] border border-blue-200'
                              : isEscalated
                              ? 'bg-rose-50 text-[#B42318] border border-rose-200'
                              : 'bg-amber-50 text-[#B7791F] border border-amber-200'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isResolved
                                ? 'bg-[#2E7D5B]'
                                : isStaffHandling
                                ? 'bg-[#2867A8]'
                                : isEscalated
                                ? 'bg-[#B42318] animate-pulse'
                                : 'bg-[#B7791F]'
                            }`}
                          ></span>
                          {item.status}
                        </span>
                        {item.is_ai_paused && (
                          <span className="block text-[10px] text-blue-800 font-semibold mt-0.5">
                            AI Paused (Staff)
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 max-w-xs md:max-w-sm">
                        <p className="text-xs text-[#17202A] truncate" title={item.message}>
                          "{item.message}"
                        </p>
                        {item.response && (
                          <p className="text-[11px] text-[#5F6B76] truncate mt-0.5 italic" title={item.response}>
                            ↳ {item.response}
                          </p>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-[#5F6B76] whitespace-nowrap">
                        {item.updated_at
                          ? new Date(item.updated_at).toLocaleDateString()
                          : item.created_at
                          ? new Date(item.created_at).toLocaleDateString()
                          : 'Recent'}
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <button
                          onClick={() => onSelectTicket(item.ticket_ref)}
                          className="px-3 py-1 bg-[#17324D] hover:bg-[#10283E] text-white text-xs font-semibold rounded shadow-sm transition-colors flex items-center gap-1.5 ml-auto"
                        >
                          <span>Review & Detail</span>
                          <ArrowRight size={13} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
