import React, { useState, useEffect } from 'react';
import {
  FileCheck2,
  RefreshCw,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  ExternalLink,
  MessageSquare,
  X,
  FileText
} from 'lucide-react';
import { AdminApi, AdminDocument } from '../../services/adminApi';

interface AdminDocumentsProps {
  onShowMessage: (msg: string, isError?: boolean) => void;
}

export const AdminDocuments: React.FC<AdminDocumentsProps> = ({ onShowMessage }) => {
  const [documents, setDocuments] = useState<AdminDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [reviewModalDoc, setReviewModalDoc] = useState<AdminDocument | null>(null);
  const [reviewStatus, setReviewStatus] = useState<'Verified' | 'Rejected'>('Verified');
  const [adminNotes, setAdminNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const res = await AdminApi.getDocuments(statusFilter);
      if (res.success && res.data) {
        setDocuments(res.data);
      } else {
        onShowMessage(res.message || 'Unable to query documents queue.', true);
      }
    } catch (err: any) {
      onShowMessage('Error querying documents: ' + err.message, true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [statusFilter]);

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewModalDoc) return;

    setSubmitting(true);
    try {
      const res = await AdminApi.reviewDocument(reviewModalDoc.id, reviewStatus, adminNotes);
      if (res.success) {
        onShowMessage(`Document #${reviewModalDoc.id} marked as ${reviewStatus} and student notified.`);
        setReviewModalDoc(null);
        setAdminNotes('');
        await fetchDocuments();
      } else {
        onShowMessage(res.message || 'Failed to update document status.', true);
      }
    } catch (err: any) {
      onShowMessage('Error submitting document review: ' + err.message, true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#17324D] tracking-tight">Document Verification Queue</h1>
          <p className="text-sm text-[#5F6B76]">
            Review, verify, or reject uploaded clearance forms and certificates
          </p>
        </div>
        <button
          onClick={fetchDocuments}
          disabled={loading}
          className="self-start sm:self-auto flex items-center gap-2 px-3.5 py-2 bg-white border border-[#D9E0E6] hover:bg-slate-50 text-[#17324D] text-sm font-semibold rounded-lg shadow-sm transition-all"
        >
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          <span>Refresh Queue</span>
        </button>
      </div>

      {/* Filter Chips */}
      <div className="bg-white p-3.5 rounded-xl border border-[#D9E0E6] shadow-sm flex flex-wrap items-center gap-2">
        <span className="text-xs font-bold text-[#5F6B76] mr-2">Filter by Status:</span>
        {['all', 'Pending Review', 'Verified', 'Rejected'].map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              statusFilter === status
                ? 'bg-[#17324D] text-white shadow-sm'
                : 'bg-[#F5F7FA] text-[#5F6B76] hover:bg-slate-200'
            }`}
          >
            {status === 'all' ? 'All Uploads' : status}
          </button>
        ))}
      </div>

      {/* Documents Table */}
      <div className="bg-white rounded-xl border border-[#D9E0E6] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F5F7FA] border-b border-[#D9E0E6] text-xs font-bold uppercase tracking-wider text-[#5F6B76]">
                <th className="py-3.5 px-4">Student & ID</th>
                <th className="py-3.5 px-4">Document Type</th>
                <th className="py-3.5 px-4">File Details</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Review Metadata</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D9E0E6] text-sm text-[#17202A]">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    Loading documents from PostgreSQL...
                  </td>
                </tr>
              ) : documents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    No documents found matching the selected filter.
                  </td>
                </tr>
              ) : (
                documents.map((doc) => {
                  const isVerified = doc.status.toLowerCase().includes('verified');
                  const isRejected = doc.status.toLowerCase().includes('reject');

                  return (
                    <tr key={doc.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-[#17324D]">{doc.student_name || 'Student'}</div>
                        <div className="text-xs text-[#5F6B76] font-mono">{doc.student_id}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-xs text-[#17202A]">{doc.document_type}</div>
                        <div className="text-[11px] text-[#5F6B76] truncate max-w-xs">{doc.original_filename}</div>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-[#5F6B76]">
                        <div>{(doc.file_size_bytes / 1024).toFixed(1)} KB</div>
                        <div>{doc.mime_type}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            isVerified
                              ? 'bg-emerald-50 text-[#2E7D5B] border border-emerald-200'
                              : isRejected
                              ? 'bg-rose-50 text-[#B42318] border border-rose-200'
                              : 'bg-amber-50 text-[#B7791F] border border-amber-200'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isVerified ? 'bg-[#2E7D5B]' : isRejected ? 'bg-[#B42318]' : 'bg-[#B7791F]'
                            }`}
                          ></span>
                          {doc.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-xs">
                        {doc.reviewed_by ? (
                          <div>
                            <span className="font-semibold text-[#17202A]">By: {doc.reviewed_by}</span>
                            {doc.admin_notes && (
                              <p className="text-[#5F6B76] italic mt-0.5 truncate max-w-xs">"{doc.admin_notes}"</p>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400">Pending Staff Action</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => {
                            setReviewModalDoc(doc);
                            setReviewStatus(isVerified ? 'Verified' : 'Verified');
                            setAdminNotes(doc.admin_notes || '');
                          }}
                          className="px-3 py-1 bg-white border border-[#D9E0E6] hover:bg-slate-100 text-xs font-semibold text-[#17324D] rounded shadow-sm transition-colors"
                        >
                          Review File
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

      {/* Review Dialog Modal */}
      {reviewModalDoc && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl border border-[#D9E0E6] space-y-4">
            <div className="flex items-start justify-between border-b border-[#D9E0E6] pb-3">
              <div>
                <h3 className="text-base font-bold text-[#17324D]">Review Document</h3>
                <span className="text-xs text-[#5F6B76]">Record official evaluation in PostgreSQL</span>
              </div>
              <button
                onClick={() => setReviewModalDoc(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleReviewSubmit} className="space-y-4">
              <div className="bg-[#F5F7FA] p-3.5 rounded-lg border border-[#D9E0E6] text-xs space-y-1">
                <div>Student: <strong>{reviewModalDoc.student_name}</strong> ({reviewModalDoc.student_id})</div>
                <div>Document: <strong>{reviewModalDoc.document_type}</strong></div>
                <div>Filename: <span className="font-mono text-[11px]">{reviewModalDoc.original_filename}</span></div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#17202A] mb-1.5">Decision Status</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setReviewStatus('Verified')}
                    className={`py-2 px-3 rounded-lg border text-xs font-bold flex items-center justify-center gap-1.5 transition-colors ${
                      reviewStatus === 'Verified'
                        ? 'bg-emerald-50 border-emerald-500 text-[#2E7D5B]'
                        : 'border-[#D9E0E6] text-[#5F6B76] hover:bg-slate-50'
                    }`}
                  >
                    <CheckCircle2 size={16} />
                    <span>Verify / Approve</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setReviewStatus('Rejected')}
                    className={`py-2 px-3 rounded-lg border text-xs font-bold flex items-center justify-center gap-1.5 transition-colors ${
                      reviewStatus === 'Rejected'
                        ? 'bg-rose-50 border-rose-500 text-[#B42318]'
                        : 'border-[#D9E0E6] text-[#5F6B76] hover:bg-slate-50'
                    }`}
                  >
                    <XCircle size={16} />
                    <span>Reject / Resubmit</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#17202A] mb-1">
                  Staff Evaluation Notes (Visible in Student App notification)
                </label>
                <textarea
                  rows={3}
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="e.g. Official seal verified, minimum 1.35 GWA met, ready for release..."
                  className="w-full p-2.5 bg-[#F5F7FA] border border-[#D9E0E6] focus:border-[#17324D] rounded-lg text-xs text-[#17202A] focus:outline-none focus:bg-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#D9E0E6]">
                <button
                  type="button"
                  onClick={() => setReviewModalDoc(null)}
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
                  {submitting ? 'Saving to Database...' : 'Save & Dispatch Alert'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
