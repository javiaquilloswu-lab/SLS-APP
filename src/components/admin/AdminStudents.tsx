import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  RefreshCw,
  Filter,
  CheckCircle2,
  AlertCircle,
  FileCheck2,
  X,
  Mail,
  GraduationCap
} from 'lucide-react';
import { AdminApi, AdminStudent } from '../../services/adminApi';

interface AdminStudentsProps {
  onShowMessage: (msg: string, isError?: boolean) => void;
}

export const AdminStudents: React.FC<AdminStudentsProps> = ({ onShowMessage }) => {
  const [students, setStudents] = useState<AdminStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [courseFilter, setCourseFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedStudent, setSelectedStudent] = useState<AdminStudent | null>(null);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const res = await AdminApi.getStudents(search, courseFilter, statusFilter);
      if (res.success && res.data) {
        setStudents(res.data.students);
      } else {
        onShowMessage(res.message || 'Unable to retrieve students directory.', true);
      }
    } catch (err: any) {
      onShowMessage('Error querying students: ' + err.message, true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchStudents();
    }, 250);
    return () => clearTimeout(timer);
  }, [search, courseFilter, statusFilter]);

  return (
    <div className="space-y-6">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#17324D] tracking-tight">Student Directory</h1>
          <p className="text-sm text-[#5F6B76]">
            Manage student records, academic status, and clearance progress
          </p>
        </div>
        <button
          onClick={fetchStudents}
          disabled={loading}
          className="self-start sm:self-auto flex items-center gap-2 px-3.5 py-2 bg-white border border-[#D9E0E6] hover:bg-slate-50 text-[#17324D] text-sm font-semibold rounded-lg shadow-sm transition-all"
        >
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          <span>Refresh List</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-[#D9E0E6] shadow-sm flex flex-col md:flex-row items-stretch md:items-center gap-3">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3.5 top-3 text-[#5F6B76]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by student name, ID (e.g. 2024-08912), or email..."
            className="w-full pl-10 pr-4 py-2 bg-[#F5F7FA] border border-[#D9E0E6] focus:border-[#17324D] rounded-lg text-sm text-[#17202A] placeholder-slate-400 focus:outline-none focus:bg-white transition-colors"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={courseFilter}
            onChange={(e) => setCourseFilter(e.target.value)}
            className="py-2 px-3 bg-[#F5F7FA] border border-[#D9E0E6] rounded-lg text-xs font-medium text-[#17202A] focus:outline-none focus:border-[#17324D]"
          >
            <option value="all">All Academic Programs</option>
            <option value="Computer Science">Computer Science</option>
            <option value="Nursing">Nursing</option>
            <option value="Accountancy">Accountancy</option>
            <option value="Medical Technology">Medical Technology</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="py-2 px-3 bg-[#F5F7FA] border border-[#D9E0E6] rounded-lg text-xs font-medium text-[#17202A] focus:outline-none focus:border-[#17324D]"
          >
            <option value="all">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Probation">Probation</option>
            <option value="Graduating">Graduating</option>
          </select>
        </div>
      </div>

      {/* Student Data Table */}
      <div className="bg-white rounded-xl border border-[#D9E0E6] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F5F7FA] border-b border-[#D9E0E6] text-xs font-bold uppercase tracking-wider text-[#5F6B76]">
                <th className="py-3.5 px-4">Student ID & Name</th>
                <th className="py-3.5 px-4">Academic Program</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Requirements Progress</th>
                <th className="py-3.5 px-4">Verified Docs</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D9E0E6] text-sm text-[#17202A]">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    Querying student records from PostgreSQL...
                  </td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    No matching student records found.
                  </td>
                </tr>
              ) : (
                students.map((student) => (
                  <tr key={student.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-[#17324D]">
                        {student.first_name} {student.last_name}
                      </div>
                      <div className="text-xs text-[#5F6B76] font-mono">{student.student_id}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-xs text-[#17202A]">{student.course}</div>
                      <div className="text-xs text-[#5F6B76]">{student.year_level}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-[#2E7D5B] border border-emerald-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#2E7D5B]"></span>
                        {student.academic_status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
                          <div
                            className="bg-[#17324D] h-full rounded-full"
                            style={{ width: `${student.requirements_progress || 0}%` }}
                          ></div>
                        </div>
                        <span className="text-xs font-semibold text-[#17324D]">
                          {student.requirements_progress || 0}%
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-xs">
                      <span className="font-semibold text-[#17202A]">
                        {student.verified_docs_count || 0}
                      </span>{' '}
                      / {student.total_docs_count || 0} docs
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setSelectedStudent(student)}
                        className="px-3 py-1 bg-white border border-[#D9E0E6] hover:bg-slate-100 text-xs font-semibold text-[#17324D] rounded shadow-sm transition-colors"
                      >
                        View Profile
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Student Profile Drawer / Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-2xl border border-[#D9E0E6] space-y-6">
            <div className="flex items-start justify-between border-b border-[#D9E0E6] pb-4">
              <div>
                <h3 className="text-lg font-bold text-[#17324D]">
                  {selectedStudent.first_name} {selectedStudent.middle_name ? `${selectedStudent.middle_name} ` : ''}{selectedStudent.last_name}
                </h3>
                <span className="text-xs text-[#5F6B76] font-mono">ID: {selectedStudent.student_id}</span>
              </div>
              <button
                onClick={() => setSelectedStudent(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4 bg-[#F5F7FA] p-4 rounded-lg border border-[#D9E0E6]">
                <div>
                  <div className="text-xs text-[#5F6B76]">Email Address</div>
                  <div className="font-semibold text-xs text-[#17202A] mt-0.5">{selectedStudent.email}</div>
                </div>
                <div>
                  <div className="text-xs text-[#5F6B76]">Academic Status</div>
                  <div className="font-semibold text-xs text-[#2E7D5B] mt-0.5">{selectedStudent.academic_status}</div>
                </div>
                <div>
                  <div className="text-xs text-[#5F6B76]">Program / Course</div>
                  <div className="font-semibold text-xs text-[#17202A] mt-0.5">{selectedStudent.course}</div>
                </div>
                <div>
                  <div className="text-xs text-[#5F6B76]">Year Level</div>
                  <div className="font-semibold text-xs text-[#17202A] mt-0.5">{selectedStudent.year_level}</div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-[#5F6B76]">Clearance & Requirements Progress:</span>
                  <span className="font-bold text-[#17324D]">{selectedStudent.requirements_progress || 0}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden border border-slate-200">
                  <div
                    className="bg-[#17324D] h-full rounded-full"
                    style={{ width: `${selectedStudent.requirements_progress || 0}%` }}
                  ></div>
                </div>
              </div>

              <div className="flex justify-between items-center text-xs text-[#5F6B76] pt-2">
                <span>Verified Documents: <strong>{selectedStudent.verified_docs_count || 0}</strong></span>
                <span>Pending Actions: <strong>{selectedStudent.pending_actions_count || 0}</strong></span>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-[#D9E0E6]">
              <button
                onClick={() => setSelectedStudent(null)}
                className="px-4 py-2 bg-[#17324D] text-white text-xs font-semibold rounded-lg hover:bg-[#10283E] transition-colors"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
