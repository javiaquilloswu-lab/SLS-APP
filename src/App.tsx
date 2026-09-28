/**
 * SWU PHINMA - Student Life Administrative Management System
 * Production Admin Console for Student Life Staff & Officers
 */

import React, { useState, useEffect } from 'react';
import {
  AdminLayout,
  AdminTab
} from './components/admin/AdminLayout';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { AdminStudents } from './components/admin/AdminStudents';
import { AdminScholarships } from './components/admin/AdminScholarships';
import { AdminDocuments } from './components/admin/AdminDocuments';
import { AdminRequests } from './components/admin/AdminRequests';
import { AdminNotifications } from './components/admin/AdminNotifications';
import { AdminConversations } from './components/admin/AdminConversations';
import { AdminConversationDetail } from './components/admin/AdminConversationDetail';
import { AdminLogin } from './components/admin/AdminLogin';
import { StudentSimulator } from './components/StudentSimulator';
import {
  AdminApi,
  AdminUser,
  getStoredAdminProfile,
  getStoredAdminToken
} from './services/adminApi';
import { CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react';

export default function App() {
  const [view, setView] = useState<'admin' | 'student_preview'>('admin');
  const [adminUser, setAdminUser] = useState<AdminUser | null>(getStoredAdminProfile());
  const [currentTab, setCurrentTab] = useState<AdminTab>('dashboard');
  const [selectedTicket, setSelectedTicket] = useState<string>('');

  // Toast Banner
  const [toast, setToast] = useState<{ message: string; isError?: boolean } | null>(null);

  const showToast = (message: string, isError = false) => {
    setToast({ message, isError });
    setTimeout(() => {
      setToast((prev) => (prev?.message === message ? null : prev));
    }, 4500);
  };

  const handleLoginSuccess = (admin: AdminUser) => {
    setAdminUser(admin);
    setCurrentTab('dashboard');
  };

  const handleLogout = async () => {
    await AdminApi.logout();
    setAdminUser(null);
    showToast('Administrative session concluded.');
  };

  const handleSelectTicket = (ticketRef: string) => {
    setSelectedTicket(ticketRef);
    setCurrentTab('concern_detail');
  };

  // If in Student Preview mode
  if (view === 'student_preview') {
    return (
      <div className="relative">
        <div className="bg-[#17324D] text-white px-4 py-2.5 flex items-center justify-between text-xs sticky top-0 z-50 shadow-md">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#2E7D5B]"></span>
            <span className="font-bold">Student Mobile App Verification Preview</span>
            <span className="text-slate-300 hidden sm:inline">
              (Use this to verify student-facing changes made in the Admin Console)
            </span>
          </div>
          <button
            onClick={() => setView('admin')}
            className="flex items-center gap-1.5 px-3 py-1 bg-[#7A1F2B] hover:bg-[#A63D4A] text-white font-bold rounded shadow-sm transition-colors"
          >
            <ArrowLeft size={14} />
            <span>Return to Admin Console</span>
          </button>
        </div>
        <StudentSimulator onBackToAdmin={() => setView('admin')} />
      </div>
    );
  }

  // If unauthenticated on Admin Console
  if (!adminUser || !getStoredAdminToken()) {
    return (
      <>
        {toast && (
          <div
            className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-xl text-xs font-semibold ${
              toast.isError
                ? 'bg-rose-900 text-rose-100 border border-rose-700'
                : 'bg-emerald-900 text-emerald-100 border border-emerald-700'
            }`}
          >
            {toast.isError ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
            <span>{toast.message}</span>
          </div>
        )}
        <AdminLogin
          onLoginSuccess={handleLoginSuccess}
          onShowMessage={showToast}
        />
      </>
    );
  }

  // Authenticated Admin Console
  return (
    <>
      {/* Global Toast Alert */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-xl text-xs font-semibold animate-fade-in ${
            toast.isError
              ? 'bg-rose-900 text-rose-100 border border-rose-700'
              : 'bg-emerald-900 text-emerald-100 border border-emerald-700'
          }`}
        >
          {toast.isError ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
          <span>{toast.message}</span>
        </div>
      )}

      <AdminLayout
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        adminProfile={adminUser}
        onLogout={handleLogout}
        selectedTicketRef={selectedTicket}
        onSelectTicket={handleSelectTicket}
        onSwitchToStudentView={() => setView('student_preview')}
      >
        {currentTab === 'dashboard' && (
          <AdminDashboard
            onNavigate={(tab, ref) => {
              if (ref) setSelectedTicket(ref);
              setCurrentTab(tab);
            }}
            onShowMessage={showToast}
          />
        )}

        {currentTab === 'students' && (
          <AdminStudents onShowMessage={showToast} />
        )}

        {currentTab === 'scholarships' && (
          <AdminScholarships onShowMessage={showToast} />
        )}

        {currentTab === 'documents' && (
          <AdminDocuments onShowMessage={showToast} />
        )}

        {currentTab === 'requests' && (
          <AdminRequests onShowMessage={showToast} />
        )}

        {currentTab === 'notifications' && (
          <AdminNotifications onShowMessage={showToast} />
        )}

        {currentTab === 'concerns' && (
          <AdminConversations
            onSelectTicket={handleSelectTicket}
            onShowMessage={showToast}
          />
        )}

        {currentTab === 'concern_detail' && (
          <AdminConversationDetail
            ticketRef={selectedTicket || 'SL-2026-000121'}
            onBack={() => setCurrentTab('concerns')}
            onShowMessage={showToast}
          />
        )}
      </AdminLayout>
    </>
  );
}
