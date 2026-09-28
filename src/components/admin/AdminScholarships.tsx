import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  Plus,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  X
} from 'lucide-react';
import {
  AdminApi,
  AdminScholarshipProgram,
  AdminScholarshipApplication
} from '../../services/adminApi';

interface AdminScholarshipsProps {
  onShowMessage: (msg: string, isError?: boolean) => void;
}

export const AdminScholarships: React.FC<AdminScholarshipsProps> = ({ onShowMessage }) => {
  const [programs, setPrograms] = useState<AdminScholarshipProgram[]>([]);
  const [applications, setApplications] = useState<AdminScholarshipApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'programs' | 'applications'>('programs');

  // Program creation modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newCode, setNewCode] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newAcadYear, setNewAcadYear] = useState('AY 2026–2027');
  const [newDeadline, setNewDeadline] = useState('October 31, 2026');
  const [newStipend, setNewStipend] = useState('₱30,000.00');
  const [submittingProgram, setSubmittingProgram] = useState(false);

  // Application evaluation modal
  const [evalApp, setEvalApp] = useState<AdminScholarshipApplication | null>(null);
  const [evalStatus, setEvalStatus] = useState<'Approved' | 'Rejected'>('Approved');
  const [evalNotes, setEvalNotes] = useState('');
  const [submittingEval, setSubmittingEval] = useState(false);

  const fetchScholarships = async () => {
    setLoading(true);
    try {
      const res = await AdminApi.getScholarships();
      if (res.success && res.data) {
        setPrograms(res.data.programs);
        setApplications(res.data.applications);
      } else {
        onShowMessage(res.message || 'Unable to query scholarships.', true);
      }
    } catch (err: any) {
      onShowMessage('Error querying scholarships: ' + err.message, true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScholarships();
  }, []);

  const handleCreateProgram = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingProgram(true);
    try {
      const res = await AdminApi.createScholarshipProgram({
        code: newCode,
        title: newTitle,
        description: newDesc,
        academic_year: newAcadYear,
        deadline: newDeadline,
        stipend_amount: newStipend
      });

      if (res.success) {
        onShowMessage(`Scholarship program '${newTitle}' created in PostgreSQL.`);
        setCreateModalOpen(false);
        setNewCode('');
        setNewTitle('');
        setNewDesc('');
        await fetchScholarships();
      } else {
        onShowMessage(res.message || 'Failed to create program.', true);
      }
    } catch (err: any) {
      onShowMessage('Error creating scholarship: ' + err.message, true);
    } finally {
      setSubmittingProgram(false);
    }
  };

  const handleEvaluateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!evalApp) return;

    setSubmittingEval(true);
    try {
      const res = await AdminApi.updateApplication(evalApp.id, evalStatus, evalNotes);
      if (res.success) {
        onShowMessage(`Application #${evalApp.tracking_ref} marked as ${evalStatus} and student notified.`);
        setEvalApp(null);
        setEvalNotes('');
        await fetchScholarships();
      } else {
        onShowMessage(res.message || 'Failed to evaluate application.', true);
      }
    } catch (err: any) {
      onShowMessage('Error evaluating application: ' + err.message, true);
    } finally {
      setSubmittingEval(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#17324D] tracking-tight">Scholarship Management Center</h1>
          <p className="text-sm text-[#5F6B76]">
            Manage institutional scholarship grants, renewal deadlines, and bursar evaluations
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCreateModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#17324D] hover:bg-[#10283E] text-white text-sm font-semibold rounded-lg shadow-sm transition-colors"
          >
            <Plus size={16} />
            <span>Create Scholarship</span>
          </button>
          <button
            onClick={fetchScholarships}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-[#D9E0E6] hover:bg-slate-50 text-[#17324D] text-sm font-semibold rounded-lg shadow-sm transition-colors"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Switcher Tabs */}
      <div className="border-b border-[#D9E0E6] flex gap-6">
        <button
          onClick={() => setActiveTab('programs')}
          className={`pb-3 text-sm font-bold border-b-2 transition-colors ${
            activeTab === 'programs'
              ? 'border-[#17324D] text-[#17324D]'
              : 'border-transparent text-[#5F6B76] hover:text-[#17202A]'
          }`}
        >
          Active Programs ({programs.length})
        </button>
        <button
          onClick={() => setActiveTab('applications')}
          className={`pb-3 text-sm font-bold border-b-2 transition-colors ${
            activeTab === 'applications'
              ? 'border-[#17324D] text-[#17324D]'
              : 'border-transparent text-[#5F6B76] hover:text-[#17202A]'
          }`}
        >
          Student Applications ({applications.length})
        </button>
      </div>

      {/* Programs Tab */}
      {activeTab === 'programs' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading ? (
            <div className="col-span-3 py-12 text-center text-sm text-[#5F6B76]">
              Loading scholarship programs from PostgreSQL...
            </div>
          ) : programs.length === 0 ? (
            <div className="col-span-3 py-12 text-center text-sm text-[#5F6B76]">
              No active scholarship programs created yet.
            </div>
          ) : (
            programs.map((prog) => (
              <div
                key={prog.id}
                className="bg-white p-5 rounded-xl border border-[#D9E0E6] shadow-sm space-y-3 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-slate-100 text-[#17324D] border border-slate-200">
                      {prog.code}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#2E7D5B]">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#2E7D5B]"></span>
                      Active
                    </span>
                  </div>
                  <h3 className="font-bold text-sm text-[#17324D] mt-2">{prog.title}</h3>
                  <p className="text-xs text-[#5F6B76] mt-1 line-clamp-2">{prog.description}</p>
                </div>

                <div className="pt-3 border-t border-[#D9E0E6] text-xs text-[#5F6B76] space-y-1">
                  <div className="flex justify-between">
                    <span>Academic Year:</span>
                    <span className="font-medium text-[#17202A]">{prog.academic_year}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Deadline:</span>
                    <span className="font-medium text-[#17202A]">{prog.deadline}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Grant Stipend:</span>
                    <span className="font-bold text-[#2E7D5B]">{prog.stipend_amount}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Applications Tab */}
      {activeTab === 'applications' && (
        <div className="bg-white rounded-xl border border-[#D9E0E6] shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F5F7FA] border-b border-[#D9E0E6] text-xs font-bold uppercase tracking-wider text-[#5F6B76]">
                  <th className="py-3.5 px-4">Tracking Ref</th>
                  <th className="py-3.5 px-4">Applicant Student</th>
                  <th className="py-3.5 px-4">Program Applied</th>
                  <th className="py-3.5 px-4">Type</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Evaluation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D9E0E6] text-sm text-[#17202A]">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-500">
                      Querying applications from PostgreSQL...
                    </td>
                  </tr>
                ) : applications.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-500">
                      No scholarship applications submitted yet.
                    </td>
                  </tr>
                ) : (
                  applications.map((app) => (
                    <tr key={app.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-mono text-xs font-bold text-[#17324D]">
                        {app.tracking_ref}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-xs text-[#17202A]">{app.student_name || 'Student'}</div>
                        <div className="text-[11px] text-[#5F6B76]">{app.student_id} • {app.course}</div>
                      </td>
                      <td className="py-3.5 px-4 text-xs font-medium text-[#17202A]">
                        {app.program_name}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-[#5F6B76]">
                        {app.application_type}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-[#B7791F] border border-amber-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#B7791F]"></span>
                          {app.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => {
                            setEvalApp(app);
                            setEvalStatus('Approved');
                            setEvalNotes(app.admin_notes || '');
                          }}
                          className="px-3 py-1 bg-white border border-[#D9E0E6] hover:bg-slate-100 text-xs font-semibold text-[#17324D] rounded shadow-sm transition-colors"
                        >
                          Evaluate
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Program Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl border border-[#D9E0E6] space-y-4">
            <div className="flex items-start justify-between border-b border-[#D9E0E6] pb-3">
              <div>
                <h3 className="text-base font-bold text-[#17324D]">Create Scholarship Program</h3>
                <span className="text-xs text-[#5F6B76]">Adds to master database catalog</span>
              </div>
              <button
                onClick={() => setCreateModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateProgram} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-[#17202A] mb-1">Program Code</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CHED-CMSP-2026"
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value)}
                  className="w-full p-2 bg-[#F5F7FA] border border-[#D9E0E6] rounded-lg text-xs font-mono text-[#17202A] focus:outline-none focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#17202A] mb-1">Scholarship Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CHED Academic Excellence Merit Award"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full p-2 bg-[#F5F7FA] border border-[#D9E0E6] rounded-lg text-xs text-[#17202A] focus:outline-none focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#17202A] mb-1">Description / Eligibility</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Open to 3rd & 4th year collegiate scholars with minimum 1.35 GWA..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full p-2 bg-[#F5F7FA] border border-[#D9E0E6] rounded-lg text-xs text-[#17202A] focus:outline-none focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#17202A] mb-1">Academic Cycle</label>
                  <input
                    type="text"
                    value={newAcadYear}
                    onChange={(e) => setNewAcadYear(e.target.value)}
                    className="w-full p-2 bg-[#F5F7FA] border border-[#D9E0E6] rounded-lg text-xs text-[#17202A]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#17202A] mb-1">Deadline Date</label>
                  <input
                    type="text"
                    value={newDeadline}
                    onChange={(e) => setNewDeadline(e.target.value)}
                    className="w-full p-2 bg-[#F5F7FA] border border-[#D9E0E6] rounded-lg text-xs text-[#17202A]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#17202A] mb-1">Grant Stipend Amount</label>
                <input
                  type="text"
                  value={newStipend}
                  onChange={(e) => setNewStipend(e.target.value)}
                  className="w-full p-2 bg-[#F5F7FA] border border-[#D9E0E6] rounded-lg text-xs font-bold text-[#2E7D5B]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#D9E0E6]">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  disabled={submittingProgram}
                  className="px-3 py-1.5 text-xs font-semibold text-[#5F6B76] hover:text-[#17202A]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingProgram}
                  className="px-4 py-2 bg-[#17324D] hover:bg-[#10283E] text-white text-xs font-semibold rounded-lg shadow-sm"
                >
                  {submittingProgram ? 'Saving...' : 'Create Program'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Evaluate Application Modal */}
      {evalApp && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl border border-[#D9E0E6] space-y-4">
            <div className="flex items-start justify-between border-b border-[#D9E0E6] pb-3">
              <div>
                <h3 className="text-base font-bold text-[#17324D]">Evaluate Application</h3>
                <span className="text-xs text-[#5F6B76]">Reference: {evalApp.tracking_ref}</span>
              </div>
              <button
                onClick={() => setEvalApp(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleEvaluateSubmit} className="space-y-4">
              <div className="bg-[#F5F7FA] p-3 rounded-lg border border-[#D9E0E6] text-xs space-y-1">
                <div>Applicant: <strong>{evalApp.student_name}</strong> ({evalApp.student_id})</div>
                <div>Program: <strong>{evalApp.program_name}</strong></div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#17202A] mb-1.5">Decision</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setEvalStatus('Approved')}
                    className={`py-2 px-3 rounded-lg border text-xs font-bold flex items-center justify-center gap-1.5 ${
                      evalStatus === 'Approved'
                        ? 'bg-emerald-50 border-emerald-500 text-[#2E7D5B]'
                        : 'border-[#D9E0E6] text-[#5F6B76] hover:bg-slate-50'
                    }`}
                  >
                    <CheckCircle2 size={16} />
                    <span>Approve Application</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEvalStatus('Rejected')}
                    className={`py-2 px-3 rounded-lg border text-xs font-bold flex items-center justify-center gap-1.5 ${
                      evalStatus === 'Rejected'
                        ? 'bg-rose-50 border-rose-500 text-[#B42318]'
                        : 'border-[#D9E0E6] text-[#5F6B76] hover:bg-slate-50'
                    }`}
                  >
                    <XCircle size={16} />
                    <span>Reject Application</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#17202A] mb-1">
                  Bursar Evaluation Notes (Saved to PostgreSQL & Dispatched to Student)
                </label>
                <textarea
                  rows={3}
                  value={evalNotes}
                  onChange={(e) => setEvalNotes(e.target.value)}
                  placeholder="e.g. Qualification requirements met. Endorsed for stipend release..."
                  className="w-full p-2.5 bg-[#F5F7FA] border border-[#D9E0E6] focus:border-[#17324D] rounded-lg text-xs text-[#17202A] focus:outline-none focus:bg-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#D9E0E6]">
                <button
                  type="button"
                  onClick={() => setEvalApp(null)}
                  disabled={submittingEval}
                  className="px-3.5 py-2 text-xs font-semibold text-[#5F6B76] hover:text-[#17202A]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingEval}
                  className="px-4 py-2 bg-[#17324D] hover:bg-[#10283E] text-white text-xs font-semibold rounded-lg shadow-sm"
                >
                  {submittingEval ? 'Saving...' : 'Save & Dispatch Decision'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
