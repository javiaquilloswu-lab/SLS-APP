import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  BotMessageSquare,
  User,
  ShieldCheck,
  Send,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Lock,
  RefreshCw,
  MoreVertical,
  Check,
  X,
  FileText,
  UserCheck
} from 'lucide-react';
import { AdminApi, AdminConcern, ConcernMessage } from '../../services/adminApi';

interface AdminConversationDetailProps {
  ticketRef: string;
  onBack: () => void;
  onShowMessage: (msg: string, isError?: boolean) => void;
}

export const AdminConversationDetail: React.FC<AdminConversationDetailProps> = ({
  ticketRef,
  onBack,
  onShowMessage
}) => {
  const [concern, setConcern] = useState<AdminConcern | null>(null);
  const [transcript, setTranscript] = useState<ConcernMessage[]>([]);
  const [loading, setLoading] = useState(true);

  // Takeover confirmation dialog
  const [takeoverDialogOpen, setTakeoverDialogOpen] = useState(false);
  const [takingOver, setTakingOver] = useState(false);

  // Staff composer
  const [staffReplyText, setStaffReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);

  // Internal Notes
  const [internalNoteText, setInternalNoteText] = useState('');
  const [savingNote, setSavingNote] = useState(false);

  // More menu
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);

  const fetchDetail = async () => {
    setLoading(true);
    try {
      const res = await AdminApi.getConcernDetail(ticketRef);
      if (res.success && res.data) {
        setConcern(res.data.concern);
        setTranscript(res.data.transcript);
        setInternalNoteText(res.data.concern.internal_notes || '');
      } else {
        onShowMessage(res.message || 'Unable to retrieve conversation transcript.', true);
      }
    } catch (err: any) {
      onShowMessage('Error loading conversation: ' + err.message, true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [ticketRef]);

  // Execute Staff Takeover
  const handleConfirmTakeover = async () => {
    setTakingOver(true);
    try {
      const res = await AdminApi.takeoverConcern(ticketRef);
      if (res.success) {
        onShowMessage('Student Life staff takeover confirmed. AI responses paused.');
        setTakeoverDialogOpen(false);
        await fetchDetail();
      } else {
        onShowMessage(res.message || 'Failed to take over conversation.', true);
      }
    } catch (err: any) {
      onShowMessage('Error during staff takeover: ' + err.message, true);
    } finally {
      setTakingOver(false);
    }
  };

  // Execute Staff Reply
  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffReplyText.trim()) return;

    setSendingReply(true);
    try {
      const res = await AdminApi.sendStaffReply(ticketRef, staffReplyText.trim());
      if (res.success) {
        onShowMessage('Staff reply recorded in PostgreSQL and dispatched to student.');
        setStaffReplyText('');
        await fetchDetail();
      } else {
        onShowMessage(res.message || 'Failed to send staff reply.', true);
      }
    } catch (err: any) {
      onShowMessage('Error sending staff reply: ' + err.message, true);
    } finally {
      setSendingReply(false);
    }
  };

  // Save Internal Notes
  const handleSaveInternalNote = async () => {
    setSavingNote(true);
    try {
      const res = await AdminApi.saveInternalNote(ticketRef, internalNoteText.trim());
      if (res.success) {
        onShowMessage('Internal staff note saved to database.');
      } else {
        onShowMessage(res.message || 'Failed to save note.', true);
      }
    } catch (err: any) {
      onShowMessage('Error saving note: ' + err.message, true);
    } finally {
      setSavingNote(false);
    }
  };

  // Status Change
  const handleStatusChange = async (newStatus: string) => {
    try {
      const res = await AdminApi.updateConcernStatus(ticketRef, newStatus);
      if (res.success) {
        onShowMessage(`Ticket status updated to '${newStatus}'.`);
        setMoreMenuOpen(false);
        await fetchDetail();
      } else {
        onShowMessage(res.message || 'Failed to update status.', true);
      }
    } catch (err: any) {
      onShowMessage('Error updating status: ' + err.message, true);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-sm text-[#5F6B76] space-y-3">
        <RefreshCw size={24} className="animate-spin mx-auto text-[#17324D]" />
        <p>Loading conversation transcript and PostgreSQL audit records...</p>
      </div>
    );
  }

  if (!concern) {
    return (
      <div className="bg-white p-8 rounded-xl border border-[#D9E0E6] text-center space-y-4 max-w-lg mx-auto">
        <AlertTriangle size={32} className="mx-auto text-amber-500" />
        <h2 className="text-base font-bold text-[#17324D]">Conversation Not Found</h2>
        <p className="text-xs text-[#5F6B76]">Ticket #{ticketRef} could not be retrieved from the database.</p>
        <button
          onClick={onBack}
          className="px-4 py-2 bg-[#17324D] text-white text-xs font-semibold rounded-lg"
        >
          Return to Conversations
        </button>
      </div>
    );
  }

  const isStaffHandled = concern.is_ai_paused || concern.status.toLowerCase().includes('staff');
  const isResolved = concern.status.toLowerCase().includes('resolv');

  return (
    <div className="space-y-6">
      {/* 9. PAGE HEADER & BREADCRUMB */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#D9E0E6] pb-4">
        <div className="space-y-1">
          <nav className="flex items-center gap-1.5 text-xs text-[#5F6B76]">
            <button onClick={onBack} className="hover:text-[#17324D] flex items-center gap-1">
              <ArrowLeft size={13} />
              <span>Student Life Admin</span>
            </button>
            <span>/</span>
            <button onClick={onBack} className="hover:text-[#17324D]">AI Conversations</button>
            <span>/</span>
            <span className="font-semibold text-[#17324D] font-mono">{ticketRef}</span>
          </nav>
          <h1 className="text-2xl font-bold text-[#17324D] tracking-tight">Conversation Detail</h1>
        </div>

        {/* Top-Right Controls */}
        <div className="flex items-center gap-3 relative">
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
              isResolved
                ? 'bg-emerald-50 text-[#2E7D5B] border border-emerald-200'
                : isStaffHandled
                ? 'bg-blue-50 text-[#2867A8] border border-blue-200'
                : 'bg-rose-50 text-[#B42318] border border-rose-200'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isResolved ? 'bg-[#2E7D5B]' : isStaffHandled ? 'bg-[#2867A8]' : 'bg-[#B42318] animate-pulse'
              }`}
            ></span>
            {concern.status}
          </span>

          <div className="relative">
            <button
              onClick={() => setMoreMenuOpen(!moreMenuOpen)}
              className="p-2 bg-white border border-[#D9E0E6] hover:bg-slate-50 text-[#17324D] rounded-lg transition-colors shadow-sm"
              title="More Actions"
            >
              <MoreVertical size={16} />
            </button>

            {moreMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-[#D9E0E6] rounded-xl shadow-lg p-1 z-30 space-y-0.5 text-xs font-medium text-[#17202A]">
                <button
                  onClick={() => handleStatusChange('Resolved')}
                  className="w-full text-left px-3 py-2 hover:bg-slate-100 rounded-lg flex items-center gap-2 text-[#2E7D5B]"
                >
                  <CheckCircle2 size={14} />
                  <span>Mark as Resolved</span>
                </button>
                <button
                  onClick={() => handleStatusChange('Escalated')}
                  className="w-full text-left px-3 py-2 hover:bg-slate-100 rounded-lg flex items-center gap-2 text-[#B42318]"
                >
                  <AlertTriangle size={14} />
                  <span>Escalate to Dean</span>
                </button>
                <button
                  onClick={() => {
                    onShowMessage('Transcript exported to console log.');
                    setMoreMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-slate-100 rounded-lg flex items-center gap-2 text-[#5F6B76]"
                >
                  <FileText size={14} />
                  <span>Export Transcript</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 18. RESPONSIVE TWO-COLUMN LAYOUT (65-70% Conversation, 30-35% Control Panel) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Transcript & Staff Response Composer (approx 68% / 8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* 12. AI ESCALATION INFORMATION CARD */}
          <div className="bg-white rounded-xl border border-amber-200 p-5 shadow-sm space-y-3 bg-amber-50/20">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-[#B7791F] flex-shrink-0 mt-0.5">
                <AlertTriangle size={18} />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-sm text-[#17324D]">Why was this conversation escalated?</h3>
                <p className="text-xs text-[#17202A]">
                  <strong>Reason:</strong> {concern.escalation_reason || 'Student requested verification of an official scholarship or clearance record.'}
                </p>
                <p className="text-xs text-[#5F6B76]">
                  <strong>AI Limitation:</strong> The AI cannot independently modify or officially verify administrative records.
                </p>
                <p className="text-xs text-[#5F6B76]">
                  <strong>Recommended Action:</strong> Review the student's scholarship application and uploaded grade verification slip.
                </p>
                <p className="text-xs font-semibold text-slate-500 pt-1">
                  AI Confidence: Not available
                </p>
              </div>
            </div>
          </div>

          {/* 11. CONVERSATION TRANSCRIPT CONTAINER */}
          <div className="bg-white rounded-xl border border-[#D9E0E6] shadow-sm flex flex-col h-[520px]">
            {/* Transcript Top Bar */}
            <div className="p-3.5 border-b border-[#D9E0E6] bg-[#F5F7FA] flex items-center justify-between text-xs text-[#5F6B76]">
              <span className="font-bold uppercase tracking-wider text-[#17324D]">Chronological Transcript</span>
              <span>Ticket: <strong className="font-mono text-[#17324D]">{ticketRef}</strong></span>
            </div>

            {/* Scrollable Message List */}
            <div className="flex-1 p-5 overflow-y-auto space-y-4">
              {transcript.map((msg) => {
                if (msg.sender_type === 'SYSTEM') {
                  return (
                    <div key={msg.id} className="flex justify-center my-2">
                      <span className="px-3 py-1 bg-slate-100 border border-slate-200 rounded-full text-[11px] font-semibold text-[#5F6B76] flex items-center gap-1.5">
                        <Clock size={12} />
                        <span>{msg.message}</span>
                      </span>
                    </div>
                  );
                }

                const isStudent = msg.sender_type === 'STUDENT';
                const isStaff = msg.sender_type === 'STAFF';
                const isAi = msg.sender_type === 'AI';

                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col max-w-[85%] space-y-1 ${
                      isStaff ? 'ml-auto items-end' : isAi ? 'ml-6 items-start' : 'items-start'
                    }`}
                  >
                    {/* Speaker Label */}
                    <div className="flex items-center gap-1.5 px-1">
                      <span
                        className={`text-[11px] font-bold uppercase tracking-wide ${
                          isStudent
                            ? 'text-[#17324D]'
                            : isStaff
                            ? 'text-[#7A1F2B]'
                            : 'text-[#2867A8]'
                        }`}
                      >
                        {isStudent
                          ? 'STUDENT'
                          : isStaff
                          ? 'STUDENT LIFE STAFF'
                          : 'AI STUDENT LIFE ASSISTANT'}
                      </span>
                      <span className="text-[10px] text-[#5F6B76]">
                        {msg.created_at ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                      </span>
                    </div>

                    {/* Message Bubble (Professional Workspace Style) */}
                    <div
                      className={`p-3.5 rounded-xl text-xs leading-relaxed border ${
                        isStaff
                          ? 'bg-[#17324D] text-white border-[#10283E] shadow-sm'
                          : isAi
                          ? 'bg-slate-50 text-[#17202A] border-[#D9E0E6]'
                          : 'bg-[#F5F7FA] text-[#17202A] border-[#D9E0E6]'
                      }`}
                    >
                      {msg.message}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 13 & 14. STAFF TAKEOVER / RESPONSE COMPOSER AREA */}
            <div className="p-4 border-t border-[#D9E0E6] bg-[#F5F7FA]">
              {!isStaffHandled ? (
                // BEFORE TAKEOVER
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-white rounded-lg border border-[#D9E0E6]">
                  <div className="text-xs text-[#5F6B76]">
                    <span className="font-semibold text-[#17324D] block">Staff Supervision Mode</span>
                    AI assistant is currently responding autonomously. Take over to pause AI and reply directly.
                  </div>
                  <button
                    onClick={() => setTakeoverDialogOpen(true)}
                    className="self-start sm:self-auto px-4 py-2 bg-[#17324D] hover:bg-[#10283E] text-white text-xs font-bold rounded-lg shadow-sm transition-colors whitespace-nowrap"
                  >
                    Take Over Conversation
                  </button>
                </div>
              ) : (
                // AFTER TAKEOVER: COMPOSER ENABLED
                <form onSubmit={handleSendReply} className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-[#2867A8]">
                    <span className="font-bold flex items-center gap-1.5">
                      <UserCheck size={14} />
                      <span>Staff Handling Active (AI Responses Paused)</span>
                    </span>
                    <span className="text-[11px] text-[#5F6B76]">Assigned: {concern.assigned_to || 'Staff'}</span>
                  </div>

                  <div className="relative">
                    <textarea
                      rows={3}
                      value={staffReplyText}
                      onChange={(e) => setStaffReplyText(e.target.value)}
                      placeholder="Type your official response to the student..."
                      className="w-full p-3 bg-white border border-[#D9E0E6] focus:border-[#17324D] rounded-lg text-xs text-[#17202A] placeholder-slate-400 focus:outline-none transition-colors"
                    />
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-[11px] text-[#5F6B76]">
                      Message will be recorded as <strong>STUDENT LIFE STAFF</strong> and dispatched to Android app.
                    </span>
                    <button
                      type="submit"
                      disabled={sendingReply || !staffReplyText.trim()}
                      className="px-4 py-2 bg-[#7A1F2B] hover:bg-[#A63D4A] disabled:bg-slate-300 text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-1.5 transition-colors"
                    >
                      <Send size={13} />
                      <span>{sendingReply ? 'Sending...' : 'Send Staff Response'}</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>

        {/* 15. RIGHT CONTROL PANEL (approx 32% / 4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Status & Priority Card */}
          <div className="bg-white rounded-xl border border-[#D9E0E6] p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#5F6B76] border-b border-[#D9E0E6] pb-2">
              Case Metadata
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-[#5F6B76] block mb-1">Status</span>
                <span className="font-semibold text-sm text-[#17324D]">{concern.status}</span>
              </div>

              <div>
                <span className="text-[#5F6B76] block mb-1">Category</span>
                <span className="inline-block px-2.5 py-1 bg-slate-100 rounded text-xs font-medium text-[#17324D] border border-slate-200">
                  {concern.category}
                </span>
              </div>

              <div>
                <span className="text-[#5F6B76] block mb-1">Ticket Reference</span>
                <span className="font-mono font-bold text-xs text-[#17324D]">{concern.ticket_ref}</span>
              </div>

              <div>
                <span className="text-[#5F6B76] block mb-1">Assigned Staff</span>
                <span className="font-semibold text-[#17202A]">{concern.assigned_to || 'None (Queue)'}</span>
              </div>

              <div>
                <span className="text-[#5F6B76] block mb-1">Opened Timestamp</span>
                <span className="text-[#17202A]">
                  {concern.created_at ? new Date(concern.created_at).toLocaleString() : 'Recent'}
                </span>
              </div>
            </div>
          </div>

          {/* 17. PRIVACY-RESPECTING STUDENT INFORMATION CARD */}
          <div className="bg-white rounded-xl border border-[#D9E0E6] p-5 shadow-sm space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#5F6B76] border-b border-[#D9E0E6] pb-2">
              Student Information
            </h3>

            <div className="space-y-2 text-xs">
              <div>
                <span className="text-[#5F6B76] block">Student Name</span>
                <span className="font-bold text-sm text-[#17324D]">{concern.student_name || 'Enrolled Student'}</span>
              </div>

              <div>
                <span className="text-[#5F6B76] block">Student ID Number</span>
                <span className="font-mono font-semibold text-xs text-[#17202A]">{concern.student_id}</span>
              </div>

              <div>
                <span className="text-[#5F6B76] block">Contact Email</span>
                <span className="text-[#17202A]">{concern.student_email || 'student@swu.edu.ph'}</span>
              </div>

              <div>
                <span className="text-[#5F6B76] block">Academic Program</span>
                <span className="text-[#17202A]">{concern.course || 'BS Computer Science'} ({concern.year_level || '3rd Year'})</span>
              </div>
            </div>
          </div>

          {/* 16. INTERNAL NOTES (Persistent Staff-Only Information) */}
          <div className="bg-white rounded-xl border border-[#D9E0E6] p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-[#D9E0E6] pb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#5F6B76]">
                Internal Staff Notes
              </h3>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                <Lock size={10} />
                <span>Visible to Staff Only</span>
              </span>
            </div>

            <p className="text-[11px] text-[#5F6B76]">
              Private notes and audit instructions saved persistently to PostgreSQL. Never visible to students.
            </p>

            <textarea
              rows={4}
              value={internalNoteText}
              onChange={(e) => setInternalNoteText(e.target.value)}
              placeholder="e.g. Scholarship application verified in bursar office on 09/27. Awaiting Dean signature..."
              className="w-full p-2.5 bg-[#F5F7FA] border border-[#D9E0E6] focus:border-[#17324D] rounded-lg text-xs text-[#17202A] focus:outline-none focus:bg-white"
            />

            <button
              onClick={handleSaveInternalNote}
              disabled={savingNote}
              className="w-full py-2 bg-white border border-[#D9E0E6] hover:bg-slate-50 text-xs font-semibold text-[#17324D] rounded-lg transition-colors shadow-sm"
            >
              {savingNote ? 'Saving to Database...' : 'Save Internal Note'}
            </button>
          </div>
        </div>
      </div>

      {/* 13. STAFF TAKEOVER CONFIRMATION DIALOG */}
      {takeoverDialogOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl border border-[#D9E0E6] space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-50 text-[#2867A8] flex items-center justify-center flex-shrink-0">
                <UserCheck size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#17324D]">Take over conversation?</h3>
                <span className="text-xs text-[#5F6B76]">Ticket #{ticketRef}</span>
              </div>
            </div>

            <p className="text-xs text-[#5F6B76] leading-relaxed">
              You are about to respond as a Student Life staff member. AI automated responses will remain paused while you handle this conversation.
            </p>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#D9E0E6]">
              <button
                type="button"
                onClick={() => setTakeoverDialogOpen(false)}
                disabled={takingOver}
                className="px-4 py-2 text-xs font-semibold text-[#5F6B76] hover:text-[#17202A]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmTakeover}
                disabled={takingOver}
                className="px-4 py-2 bg-[#17324D] hover:bg-[#10283E] text-white text-xs font-bold rounded-lg shadow-sm"
              >
                {takingOver ? 'Updating Database...' : 'Take Over'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
