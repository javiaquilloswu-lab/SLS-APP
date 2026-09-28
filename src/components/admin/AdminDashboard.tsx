import React, { useState, useEffect } from 'react';
import {
  Users,
  GraduationCap,
  FileCheck2,
  Inbox,
  BotMessageSquare,
  AlertTriangle,
  RefreshCw,
  ArrowRight,
  Clock,
  ShieldCheck,
  CheckCircle2,
  FileText
} from 'lucide-react';
import { AdminApi, AdminStats } from '../../services/adminApi';
import { AdminTab } from './AdminLayout';

interface AdminDashboardProps {
  onNavigate: (tab: AdminTab, ticketRef?: string) => void;
  onShowMessage: (msg: string, isError?: boolean) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  onNavigate,
  onShowMessage
}) => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await AdminApi.getStats();
      if (res.success && res.data) {
        setStats(res.data);
      } else {
        onShowMessage(res.message || 'Unable to retrieve statistics from PostgreSQL.', true);
      }
    } catch (err: any) {
      onShowMessage('Network error connecting to PHP backend: ' + err.message, true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <div className="space-y-6">
      {/* Page Title & Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#17324D] tracking-tight">Administrative Dashboard</h1>
          <p className="text-sm text-[#5F6B76]">
            Real-time telemetry and management overview from PostgreSQL database
          </p>
        </div>
        <button
          onClick={fetchStats}
          disabled={loading}
          className="self-start sm:self-auto flex items-center gap-2 px-3.5 py-2 bg-white border border-[#D9E0E6] hover:bg-slate-50 text-[#17324D] text-sm font-semibold rounded-lg shadow-sm transition-all"
        >
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Students */}
        <div
          onClick={() => onNavigate('students')}
          className="bg-white p-5 rounded-xl border border-[#D9E0E6] shadow-sm hover:border-[#17324D] transition-all cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#5F6B76]">Students</span>
            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-[#17324D]">
              <Users size={18} />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold text-[#17324D]">
              {loading ? '...' : (stats?.total_students ?? 0)}
            </div>
            <p className="text-xs text-[#5F6B76] mt-1">Registered in system</p>
          </div>
        </div>

        {/* Pending Scholarships */}
        <div
          onClick={() => onNavigate('scholarships')}
          className="bg-white p-5 rounded-xl border border-[#D9E0E6] shadow-sm hover:border-amber-500 transition-all cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#5F6B76]">Scholarships</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-[#B7791F]">
              <GraduationCap size={18} />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold text-[#B7791F]">
              {loading ? '...' : (stats?.pending_scholarships ?? 0)}
            </div>
            <p className="text-xs text-[#5F6B76] mt-1">Pending bursar evaluation</p>
          </div>
        </div>

        {/* Documents Pending Review */}
        <div
          onClick={() => onNavigate('documents')}
          className="bg-white p-5 rounded-xl border border-[#D9E0E6] shadow-sm hover:border-blue-500 transition-all cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#5F6B76]">Documents</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-[#2867A8]">
              <FileCheck2 size={18} />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold text-[#2867A8]">
              {loading ? '...' : (stats?.documents_pending_review ?? 0)}
            </div>
            <p className="text-xs text-[#5F6B76] mt-1">Awaiting staff verification</p>
          </div>
        </div>

        {/* Active Requests */}
        <div
          onClick={() => onNavigate('requests')}
          className="bg-white p-5 rounded-xl border border-[#D9E0E6] shadow-sm hover:border-emerald-500 transition-all cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#5F6B76]">Requests</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-[#2E7D5B]">
              <Inbox size={18} />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold text-[#2E7D5B]">
              {loading ? '...' : (stats?.active_requests ?? 0)}
            </div>
            <p className="text-xs text-[#5F6B76] mt-1">In clearance & processing</p>
          </div>
        </div>

        {/* Escalated AI Concerns */}
        <div
          onClick={() => onNavigate('concerns')}
          className="bg-white p-5 rounded-xl border border-[#D9E0E6] shadow-sm hover:border-rose-500 transition-all cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#5F6B76]">AI Escalated</span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center text-[#B42318]">
              <AlertTriangle size={18} />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold text-[#B42318]">
              {loading ? '...' : (stats?.escalated_concerns ?? 0)}
            </div>
            <p className="text-xs text-[#5F6B76] mt-1">Awaiting human staff review</p>
          </div>
        </div>
      </div>

      {/* Main Two-Column Workflow Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Triage Stations & Actions */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quick Actions Panel */}
          <div className="bg-white rounded-xl border border-[#D9E0E6] p-6 shadow-sm">
            <h2 className="text-base font-bold text-[#17324D] mb-4">Immediate Administrative Actions</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <button
                onClick={() => onNavigate('documents')}
                className="p-4 rounded-lg border border-[#D9E0E6] hover:bg-slate-50 transition-colors text-left space-y-2 group"
              >
                <div className="flex items-center justify-between text-[#2867A8]">
                  <FileCheck2 size={20} />
                  <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </div>
                <div className="font-semibold text-sm text-[#17202A]">Review Documents</div>
                <p className="text-xs text-[#5F6B76]">Verify student uploaded grade slips, clearances, and IDs</p>
              </button>

              <button
                onClick={() => onNavigate('requests')}
                className="p-4 rounded-lg border border-[#D9E0E6] hover:bg-slate-50 transition-colors text-left space-y-2 group"
              >
                <div className="flex items-center justify-between text-[#2E7D5B]">
                  <Inbox size={20} />
                  <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </div>
                <div className="font-semibold text-sm text-[#17202A]">Process Requests</div>
                <p className="text-xs text-[#5F6B76]">Update status to 'Ready for Pickup' and notify students</p>
              </button>

              <button
                onClick={() => onNavigate('concerns')}
                className="p-4 rounded-lg border border-[#D9E0E6] hover:bg-slate-50 transition-colors text-left space-y-2 group"
              >
                <div className="flex items-center justify-between text-[#B42318]">
                  <BotMessageSquare size={20} />
                  <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </div>
                <div className="font-semibold text-sm text-[#17202A]">Take Over Conversations</div>
                <p className="text-xs text-[#5F6B76]">Handle escalated student inquiries and appeals</p>
              </button>
            </div>
          </div>

          {/* Recent Student Activity from PostgreSQL */}
          <div className="bg-white rounded-xl border border-[#D9E0E6] p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-[#17324D]">Recent Activity Feed</h2>
              <span className="text-xs text-[#5F6B76]">Live from PostgreSQL database</span>
            </div>

            {loading ? (
              <div className="py-8 text-center text-sm text-[#5F6B76]">Loading activity feed...</div>
            ) : !stats?.recent_activities || stats.recent_activities.length === 0 ? (
              <div className="py-8 text-center text-sm text-[#5F6B76]">No recent activity recorded.</div>
            ) : (
              <div className="divide-y divide-[#D9E0E6]">
                {stats.recent_activities.map((act, idx) => (
                  <div key={idx} className="py-3 flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-[#17324D] mt-0.5">
                        {act.type === 'document' && <FileCheck2 size={16} />}
                        {act.type === 'request' && <Inbox size={16} />}
                        {act.type === 'concern' && <BotMessageSquare size={16} />}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-[#17202A]">
                          {act.student_name || 'Student'} — <span className="font-normal text-[#5F6B76]">{act.title}</span>
                        </div>
                        <div className="text-xs text-[#5F6B76] mt-0.5">
                          Status: <span className="font-medium text-[#17202A]">{act.status}</span>
                        </div>
                      </div>
                    </div>
                    <span className="text-xs text-[#5F6B76] whitespace-nowrap">
                      {act.event_time ? new Date(act.event_time).toLocaleDateString() : 'Recent'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: AI Supervision & Governance Card */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-[#D9E0E6] p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-[#17324D]">
                <BotMessageSquare size={22} />
              </div>
              <div>
                <h3 className="font-bold text-sm text-[#17324D]">AI Assistant Telemetry</h3>
                <span className="text-xs text-[#5F6B76]">Student Life Knowledge Bot</span>
              </div>
            </div>

            <div className="space-y-3 bg-[#F5F7FA] p-4 rounded-lg border border-[#D9E0E6]">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#5F6B76]">Total Inquiries Logged:</span>
                <span className="font-bold text-[#17202A]">{stats?.total_concerns ?? 0}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#5F6B76]">Escalated to Staff:</span>
                <span className="font-bold text-[#B42318]">{stats?.escalated_concerns ?? 0}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#5F6B76]">Resolved:</span>
                <span className="font-bold text-[#2E7D5B]">{stats?.resolved_concerns ?? 0}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#5F6B76]">AI Confidence Metric:</span>
                <span className="font-semibold text-slate-500">Not available</span>
              </div>
            </div>

            <div className="p-3.5 bg-blue-50/50 rounded-lg border border-blue-100 text-xs text-[#2867A8] space-y-1">
              <div className="font-semibold flex items-center gap-1.5">
                <ShieldCheck size={14} />
                <span>Institutional Governance Notice</span>
              </div>
              <p className="text-slate-600">
                The AI cannot officially approve scholarships, alter academic records, or clear holds. All final administrative actions require staff sign-off.
              </p>
            </div>

            <button
              onClick={() => onNavigate('concerns')}
              className="w-full py-2.5 px-4 bg-[#17324D] hover:bg-[#10283E] text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm"
            >
              <span>View Escalated Conversations</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
