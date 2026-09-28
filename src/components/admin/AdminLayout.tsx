import React from 'react';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  FileCheck2,
  Inbox,
  BellRing,
  BotMessageSquare,
  LogOut,
  ShieldAlert,
  Menu,
  X,
  ExternalLink,
  ChevronRight,
  Sparkles,
  LifeBuoy
} from 'lucide-react';
import { AdminUser } from '../../services/adminApi';

export type AdminTab =
  | 'dashboard'
  | 'students'
  | 'scholarships'
  | 'documents'
  | 'requests'
  | 'notifications'
  | 'concerns'
  | 'concern_detail';

interface AdminLayoutProps {
  currentTab: AdminTab;
  onSelectTab: (tab: AdminTab) => void;
  adminProfile: AdminUser | null;
  onLogout: () => void;
  selectedTicketRef?: string;
  onSelectTicket?: (ticketRef: string) => void;
  children: React.ReactNode;
  onSwitchToStudentView?: () => void;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  currentTab,
  onSelectTab,
  adminProfile,
  onLogout,
  selectedTicketRef,
  children,
  onSwitchToStudentView
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const navItems = [
    {
      group: 'Overview',
      items: [
        { id: 'dashboard' as AdminTab, label: 'Dashboard', icon: LayoutDashboard }
      ]
    },
    {
      group: 'Student Services',
      items: [
        { id: 'students' as AdminTab, label: 'Student Directory', icon: Users },
        { id: 'scholarships' as AdminTab, label: 'Scholarships & Grants', icon: GraduationCap },
        { id: 'documents' as AdminTab, label: 'Document Review', icon: FileCheck2 },
        { id: 'requests' as AdminTab, label: 'Student Requests', icon: Inbox }
      ]
    },
    {
      group: 'Student Support & AI',
      items: [
        { id: 'concerns' as AdminTab, label: 'AI Inquiries & Escalations', icon: BotMessageSquare }
      ]
    },
    {
      group: 'Broadcast & Alert',
      items: [
        { id: 'notifications' as AdminTab, label: 'Notification Dispatch', icon: BellRing }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-[#F5F7FA] text-[#17202A] flex flex-col font-sans">
      {/* Top Application Bar */}
      <header className="h-16 bg-[#17324D] text-white flex items-center justify-between px-4 sm:px-6 sticky top-0 z-50 shadow-md">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-slate-200 hover:text-white hover:bg-[#10283E] transition-colors"
            title="Toggle Menu"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          {/* SWU PHINMA Institutional Header */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#7A1F2B] flex items-center justify-center text-white font-bold text-lg shadow-sm border border-rose-300/20">
              SWU
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-base leading-tight tracking-tight flex items-center gap-2">
                Southwestern University PHINMA
                <span className="hidden sm:inline-block px-2 py-0.5 text-[11px] font-medium bg-[#7A1F2B] text-white rounded">
                  Admin Console
                </span>
              </span>
              <span className="text-xs text-slate-300 font-medium tracking-wide uppercase">
                Student Life & Support Management
              </span>
            </div>
          </div>
        </div>

        {/* Right Admin Controls */}
        <div className="flex items-center gap-3">
          {onSwitchToStudentView && (
            <button
              onClick={onSwitchToStudentView}
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-slate-800/80 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg border border-slate-700 transition-colors"
              title="Open Student App Simulator for cross-verification"
            >
              <span>Student App Preview</span>
              <ExternalLink size={13} />
            </button>
          )}

          <div className="hidden sm:flex flex-col text-right">
            <span className="text-xs font-semibold text-white">
              {adminProfile?.full_name || 'Administrator'}
            </span>
            <span className="text-[11px] text-slate-300">
              {adminProfile?.department || 'Student Life Office'}
            </span>
          </div>

          <div className="w-8 h-8 rounded-full bg-[#10283E] border border-slate-600 flex items-center justify-center font-bold text-xs text-white">
            {adminProfile?.full_name ? adminProfile.full_name.charAt(0) : 'A'}
          </div>

          <button
            onClick={onLogout}
            className="p-2 rounded-lg text-slate-300 hover:text-rose-300 hover:bg-[#10283E] transition-colors ml-1"
            title="Log Out"
          >
            <LogOut size={18} />
          </button>
        </div>
      </header>

      {/* Main Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Sidebar Navigation */}
        <aside
          className={`fixed inset-y-0 left-0 pt-16 z-40 w-64 bg-white border-r border-[#D9E0E6] flex flex-col justify-between transition-transform duration-200 md:static md:translate-x-0 ${
            mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
          }`}
        >
          <div className="flex-1 py-4 px-3 overflow-y-auto space-y-6">
            {navItems.map((group, gIdx) => (
              <div key={gIdx} className="space-y-1">
                <div className="px-3 text-[11px] font-bold uppercase tracking-wider text-[#5F6B76]">
                  {group.group}
                </div>
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive =
                    currentTab === item.id ||
                    (item.id === 'concerns' && currentTab === 'concern_detail');

                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        onSelectTab(item.id);
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-[#17324D] text-white font-semibold shadow-sm'
                          : 'text-[#5F6B76] hover:bg-slate-100 hover:text-[#17202A]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon size={18} className={isActive ? 'text-white' : 'text-[#5F6B76]'} />
                        <span>{item.label}</span>
                      </div>
                      {isActive && <ChevronRight size={14} className="text-slate-300" />}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Sidebar Institutional Footer */}
          <div className="p-4 border-t border-[#D9E0E6] bg-[#F5F7FA]">
            <div className="text-[11px] text-[#5F6B76] space-y-1">
              <div className="font-semibold text-[#17202A] flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#2E7D5B]"></span>
                <span>PostgreSQL Backend Connected</span>
              </div>
              <p>SWU PHINMA Student Life System</p>
              <p className="text-[10px] text-slate-400">AY 2026–2027 Console</p>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
