import React, { useState, useEffect } from 'react';
import {
  Inbox,
  RefreshCw,
  Search,
  CheckCircle2,
  Clock,
  UserCheck,
  X,
  Send
} from 'lucide-react';
import { AdminApi, AdminRequest } from '../../services/adminApi';

interface AdminRequestsProps {
  onShowMessage: (msg: string, isError?: boolean) => void;
}

export const AdminRequests: React.FC<AdminRequestsProps> = ({ onShowMessage }) => {
  const [requests, setRequests] = useState<AdminRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedReq, setSelectedReq] = useState<AdminRequest | null>(null);
  const [newStatus, setNewStatus] = useState('Ready for Pickup');
  const [statusMessage, setStatusMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await AdminApi.getRequests(statusFilter);
      if (res.success && res.data) {
        setRequests(res.data);
      } else {
        onShowMessage(res.message || 'Unable to query requests queue.', true);
      }
    } catch (err: any) {
      onShowMessage('Error querying requests: ' + err.message, true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [statusFilter]);

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReq) return;

    setSubmitting(true);
    try {
      const res = await AdminApi.updateRequest(selectedReq.id, newStatus, statusMessage);
      if (res.success) {
        onShowMessage(`Request #${selectedReq.reference_number} updated to '${newStatus}'.`);
        setSelectedReq(null);
        setStatusMessage('');
        await fetchRequests();
      } else {
        onShowMessage(res.message || 'Failed to update request status.', true);
      }
    } catch (err: any) {
      onShowMessage('Error updating request: ' + err.message, true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#17324D] tracking-tight">Student Request & Clearance Processing</h1>
          <p className="text-sm text-[#5F6B76]">
            Manage document pickups, clearance release authorizations, and student service tracking
          </p>
        </div>
        <button
          onClick={fetchRequests}
          disabled={loading}
          className="self-start sm:self-auto flex items-center gap-2 px-3.5 py-2 bg-white border border-[#D9E0E6] hover:bg-slate-50 text-[#17324D] text-sm font-semibold rounded-lg shadow-sm transition-all"
        >
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          <span>Refresh Queue</span>
        </button>
      </div>

      {/* Filter Chips */}
      <div className="bg-white p-3.5 rounded-xl border border-[#D9E0E6] shadow-sm flex flex-wrap items-center gap-2">
        <span className="text-xs font-bold text-[#5F6B76] mr-2">Status:</span>
        {['all', 'Processing', 'Ready for Pickup', 'Completed'].map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              statusFilter === status
                ? 'bg-[#17324D] text-white shadow-sm'
                : 'bg-[#F5F7FA] text-[#5F6B76] hover:bg-slate-200'
            }`}
          >
            {status === 'all' ? 'All Requests' : status}
          </button>
        ))}
      </div>

      {/* Requests Table */}
      <div className="bg-white rounded-xl border border-[#D9E0E6] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F5F7FA] border-b border-[#D9E0E6] text-xs font-bold uppercase tracking-wider text-[#5F6B76]">
                <th className="py-3.5 px-4">Tracking Reference</th>
                <th className="py-3.5 px-4">Student & Course</th>
                <th className="py-3.5 px-4">Request Item / Service</th>
                <th className="py-3.5 px-4">Status & Instructions</th>
                <th className="py-3.5 px-4">Handler</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D9E0E6] text-sm text-[#17202A]">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    Querying requests from PostgreSQL...
                  </td>
                </tr>
              ) : requests.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    No student service requests found.
                  </td>
                </tr>
              ) : (
                requests.map((req) => {
                  const isReady = req.status.toLowerCase().includes('ready');
                  const isCompleted = req.status.toLowerCase().includes('complete');

                  return (
                    <tr key={req.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-mono text-xs font-bold text-[#17324D]">
                        {req.reference_number}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-xs text-[#17202A]">{req.student_name || 'Student'}</div>
                        <div className="text-[11px] text-[#5F6B76]">{req.student_id} • {req.course}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-xs text-[#17202A]">{req.title}</div>
                        <div className="text-[11px] text-[#5F6B76]">{req.department}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            isCompleted
                              ? 'bg-emerald-50 text-[#2E7D5B] border border-emerald-200'
                              : isReady
                              ? 'bg-blue-50 text-[#2867A8] border border-blue-200'
                              : 'bg-amber-50 text-[#B7791F] border border-amber-200'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isCompleted ? 'bg-[#2E7D5B]' : isReady ? 'bg-[#2867A8]' : 'bg-[#B7791F]'
                            }`}
                          ></span>
                          {req.status}
                        </span>
                        {req.status_message && (
                          <p className="text-[11px] text-[#5F6B76] mt-0.5 max-w-xs truncate">{req.status_message}</p>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-[#5F6B76]">
                        {req.assigned_to || 'Unassigned'}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => {
                            setSelectedReq(req);
                            setNewStatus(req.status);
                            setStatusMessage(req.status_message || '');
                          }}
                          className="px-3 py-1 bg-white border border-[#D9E0E6] hover:bg-slate-100 text-xs font-semibold text-[#17324D] rounded shadow-sm transition-colors"
                        >
                          Update Status
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

      {/* Update Dialog Modal */}
      {selectedReq && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl border border-[#D9E0E6] space-y-4">
            <div className="flex items-start justify-between border-b border-[#D9E0E6] pb-3">
              <div>
                <h3 className="text-base font-bold text-[#17324D]">Update Request Status</h3>
                <span className="text-xs text-[#5F6B76]">Reference: {selectedReq.reference_number}</span>
              </div>
              <button
                onClick={() => setSelectedReq(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleUpdateSubmit} className="space-y-4">
              <div className="bg-[#F5F7FA] p-3 rounded-lg border border-[#D9E0E6] text-xs space-y-1">
                <div>Student: <strong>{selectedReq.student_name}</strong> ({selectedReq.student_id})</div>
                <div>Request: <strong>{selectedReq.title}</strong></div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#17202A] mb-1">Status Selection</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full p-2 bg-[#F5F7FA] border border-[#D9E0E6] rounded-lg text-xs font-semibold text-[#17202A] focus:outline-none focus:border-[#17324D]"
                >
                  <option value="Processing">Processing</option>
                  <option value="Ready for Pickup">Ready for Pickup</option>
                  <option value="Completed">Completed</option>
                  <option value="Requires Student Clearance">Requires Student Clearance</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#17202A] mb-1">
                  Pickup Instructions / Message for Student
                </label>
                <textarea
                  rows={3}
                  value={statusMessage}
                  onChange={(e) => setStatusMessage(e.target.value)}
                  placeholder="e.g. Ready for pickup at Office of Student Affairs Window 2. Bring 1 valid ID."
                  className="w-full p-2.5 bg-[#F5F7FA] border border-[#D9E0E6] focus:border-[#17324D] rounded-lg text-xs text-[#17202A] focus:outline-none focus:bg-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#D9E0E6]">
                <button
                  type="button"
                  onClick={() => setSelectedReq(null)}
                  disabled={submitting}
                  className="px-3.5 py-2 text-xs font-semibold text-[#5F6B76] hover:text-[#17202A] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-[#17324D] hover:bg-[#10283E] text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
                >
                  {submitting ? 'Saving to Database...' : 'Save & Notify Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
