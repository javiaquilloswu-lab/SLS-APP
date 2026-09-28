import React, { useState, useEffect } from 'react';
import {
  BellRing,
  Send,
  RefreshCw,
  Users,
  User,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { AdminApi, AdminNotification } from '../../services/adminApi';

interface AdminNotificationsProps {
  onShowMessage: (msg: string, isError?: boolean) => void;
}

export const AdminNotifications: React.FC<AdminNotificationsProps> = ({ onShowMessage }) => {
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [targetType, setTargetType] = useState<'all' | 'specific'>('all');
  const [specificStudentId, setSpecificStudentId] = useState('');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [category, setCategory] = useState('Official Notice');
  const [statusTag, setStatusTag] = useState('Important');
  const [submitting, setSubmitting] = useState(false);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await AdminApi.getNotifications();
      if (res.success && res.data) {
        setNotifications(res.data);
      } else {
        onShowMessage(res.message || 'Unable to query notifications.', true);
      }
    } catch (err: any) {
      onShowMessage('Error querying notifications: ' + err.message, true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) {
      onShowMessage('Title and message body are required.', true);
      return;
    }

    const target = targetType === 'all' ? 'all' : specificStudentId.trim();
    if (targetType === 'specific' && !target) {
      onShowMessage('Please specify a valid Student ID.', true);
      return;
    }

    setSubmitting(true);
    try {
      const res = await AdminApi.dispatchNotification({
        title,
        body,
        category,
        status_tag: statusTag,
        target
      });

      if (res.success) {
        onShowMessage(res.message || 'Notifications dispatched and saved to PostgreSQL.');
        setTitle('');
        setBody('');
        setSpecificStudentId('');
        await fetchNotifications();
      } else {
        onShowMessage(res.message || 'Failed to dispatch notification.', true);
      }
    } catch (err: any) {
      onShowMessage('Error dispatching notifications: ' + err.message, true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#17324D] tracking-tight">Notification Dispatch Center</h1>
          <p className="text-sm text-[#5F6B76]">
            Broadcast institutional announcements or send targeted alerts directly to the Android Student App
          </p>
        </div>
        <button
          onClick={fetchNotifications}
          disabled={loading}
          className="self-start sm:self-auto flex items-center gap-2 px-3.5 py-2 bg-white border border-[#D9E0E6] hover:bg-slate-50 text-[#17324D] text-sm font-semibold rounded-lg shadow-sm transition-all"
        >
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          <span>Refresh History</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Composer Form (Left 5 Cols) */}
        <div className="lg:col-span-5 bg-white p-6 rounded-xl border border-[#D9E0E6] shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-[#D9E0E6]">
            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-[#17324D]">
              <BellRing size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#17324D]">Compose Notification</h2>
              <span className="text-xs text-[#5F6B76]">Saves persistently to student_notifications</span>
            </div>
          </div>

          <form onSubmit={handleDispatch} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#17202A] mb-1.5">Recipient Target</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setTargetType('all')}
                  className={`py-2 px-3 rounded-lg border text-xs font-bold flex items-center justify-center gap-1.5 transition-colors ${
                    targetType === 'all'
                      ? 'bg-[#17324D] text-white border-[#17324D]'
                      : 'border-[#D9E0E6] text-[#5F6B76] hover:bg-slate-50'
                  }`}
                >
                  <Users size={14} />
                  <span>All Students (Broadcast)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTargetType('specific')}
                  className={`py-2 px-3 rounded-lg border text-xs font-bold flex items-center justify-center gap-1.5 transition-colors ${
                    targetType === 'specific'
                      ? 'bg-[#17324D] text-white border-[#17324D]'
                      : 'border-[#D9E0E6] text-[#5F6B76] hover:bg-slate-50'
                  }`}
                >
                  <User size={14} />
                  <span>Specific Student ID</span>
                </button>
              </div>
            </div>

            {targetType === 'specific' && (
              <div>
                <label className="block text-xs font-bold text-[#17202A] mb-1">Target Student ID</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 2024-08912"
                  value={specificStudentId}
                  onChange={(e) => setSpecificStudentId(e.target.value)}
                  className="w-full p-2.5 bg-[#F5F7FA] border border-[#D9E0E6] focus:border-[#17324D] rounded-lg text-xs font-mono text-[#17202A] focus:outline-none focus:bg-white"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-[#17202A] mb-1">Notification Title</label>
              <input
                type="text"
                required
                placeholder="e.g. Mid-Year Scholarship Renewal Cutoff"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full p-2.5 bg-[#F5F7FA] border border-[#D9E0E6] focus:border-[#17324D] rounded-lg text-xs text-[#17202A] focus:outline-none focus:bg-white font-medium"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-[#17202A] mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full p-2 bg-[#F5F7FA] border border-[#D9E0E6] rounded-lg text-xs font-semibold text-[#17202A] focus:outline-none focus:border-[#17324D]"
                >
                  <option value="Official Notice">Official Notice</option>
                  <option value="Scholarship">Scholarship</option>
                  <option value="Document">Document</option>
                  <option value="Clearance">Clearance</option>
                  <option value="Student Life">Student Life</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#17202A] mb-1">Status Tag</label>
                <select
                  value={statusTag}
                  onChange={(e) => setStatusTag(e.target.value)}
                  className="w-full p-2 bg-[#F5F7FA] border border-[#D9E0E6] rounded-lg text-xs font-semibold text-[#17202A] focus:outline-none focus:border-[#17324D]"
                >
                  <option value="Important">Important</option>
                  <option value="Action Required">Action Required</option>
                  <option value="Notice">Notice</option>
                  <option value="Award">Award</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#17202A] mb-1">Message Body</label>
              <textarea
                rows={4}
                required
                placeholder="Detailed instructions or announcement body visible to the student in their Android inbox..."
                value={body}
                onChange={(e) => setBody(e.target.value)}
                className="w-full p-2.5 bg-[#F5F7FA] border border-[#D9E0E6] focus:border-[#17324D] rounded-lg text-xs text-[#17202A] focus:outline-none focus:bg-white"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 bg-[#17324D] hover:bg-[#10283E] text-white text-xs font-bold rounded-lg shadow-sm flex items-center justify-center gap-2 transition-colors"
            >
              <Send size={15} />
              <span>{submitting ? 'Dispatching to PostgreSQL...' : 'Dispatch Notification'}</span>
            </button>
          </form>
        </div>

        {/* Sent History Table (Right 7 Cols) */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-[#D9E0E6] shadow-sm overflow-hidden">
          <div className="p-4 border-b border-[#D9E0E6] flex items-center justify-between">
            <h2 className="text-base font-bold text-[#17324D]">Recent Dispatched Notifications</h2>
            <span className="text-xs text-[#5F6B76]">Stored in PostgreSQL database</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F5F7FA] border-b border-[#D9E0E6] text-xs font-bold uppercase tracking-wider text-[#5F6B76]">
                  <th className="py-3 px-4">Recipient</th>
                  <th className="py-3 px-4">Notification Content</th>
                  <th className="py-3 px-4">Tag</th>
                  <th className="py-3 px-4 whitespace-nowrap">Dispatched</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D9E0E6] text-sm text-[#17202A]">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-slate-500 text-xs">
                      Loading notification records...
                    </td>
                  </tr>
                ) : notifications.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-slate-500 text-xs">
                      No notifications have been dispatched yet.
                    </td>
                  </tr>
                ) : (
                  notifications.map((notif) => (
                    <tr key={notif.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-xs text-[#17202A]">{notif.student_name || 'Student'}</div>
                        <div className="text-[11px] text-[#5F6B76] font-mono">{notif.student_id}</div>
                      </td>
                      <td className="py-3 px-4 max-w-xs">
                        <div className="font-semibold text-xs text-[#17324D]">{notif.title}</div>
                        <div className="text-[11px] text-[#5F6B76] line-clamp-2 mt-0.5">{notif.body}</div>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-[#17324D] border border-slate-200">
                          {notif.status_tag}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-xs text-[#5F6B76] whitespace-nowrap">
                        {notif.created_at ? new Date(notif.created_at).toLocaleDateString() : 'Just now'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
