import React, { useState } from 'react';
import {
  Lock,
  User,
  ShieldCheck,
  AlertCircle,
  ArrowRight,
  Info
} from 'lucide-react';
import { AdminApi, AdminUser } from '../../services/adminApi';

interface AdminLoginProps {
  onLoginSuccess: (admin: AdminUser) => void;
  onShowMessage: (msg: string, isError?: boolean) => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({
  onLoginSuccess,
  onShowMessage
}) => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password) {
      setErrorMsg('Please enter your administrator username and password.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const res = await AdminApi.login(identifier.trim(), password);
      if (res.success && res.data) {
        onShowMessage('Administrative authentication verified.');
        onLoginSuccess(res.data.admin);
      } else {
        setErrorMsg(res.message || 'Invalid administrator credentials.');
      }
    } catch (err: any) {
      setErrorMsg('Network error connecting to PHP backend: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA] flex flex-col justify-center items-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl border border-[#D9E0E6] shadow-xl p-8 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-xl bg-[#7A1F2B] text-white flex items-center justify-center font-bold text-2xl mx-auto shadow-sm">
            SWU
          </div>
          <h1 className="text-xl font-bold text-[#17324D] tracking-tight">
            Student Life Admin Console
          </h1>
          <p className="text-xs text-[#5F6B76]">
            Southwestern University PHINMA • Administrative Portal
          </p>
        </div>

        {/* Authentication Notice */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-[#5F6B76] flex items-start gap-2">
          <Info size={16} className="text-[#17324D] flex-shrink-0 mt-0.5" />
          <p>
            Locally managed administrative accounts using username/email and password. Authorized personnel only.
          </p>
        </div>

        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-[#B42318] text-xs rounded-lg flex items-center gap-2">
            <AlertCircle size={16} className="flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#17202A] mb-1">
              Username or Administrator Email
            </label>
            <div className="relative">
              <User size={16} className="absolute left-3 top-3 text-[#5F6B76]" />
              <input
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="admin or admin@swu.phinma.edu.ph"
                className="w-full pl-9 pr-3 py-2 bg-[#F5F7FA] border border-[#D9E0E6] focus:border-[#17324D] rounded-lg text-xs text-[#17202A] placeholder-slate-400 focus:outline-none focus:bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#17202A] mb-1">
              Password
            </label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-3 text-[#5F6B76]" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-9 pr-3 py-2 bg-[#F5F7FA] border border-[#D9E0E6] focus:border-[#17324D] rounded-lg text-xs text-[#17202A] placeholder-slate-400 focus:outline-none focus:bg-white"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-[#17324D] hover:bg-[#10283E] text-white text-xs font-bold rounded-lg shadow-sm flex items-center justify-center gap-2 transition-colors disabled:bg-slate-300"
          >
            <span>{loading ? 'Authenticating with PostgreSQL...' : 'Sign In to Console'}</span>
            <ArrowRight size={14} />
          </button>
        </form>

        {/* Development Seed Notice */}
        <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-lg text-[11px] text-amber-900 space-y-1">
          <div className="font-bold flex items-center gap-1 text-[#B7791F]">
            <ShieldCheck size={13} />
            <span>DEVELOPMENT ENVIRONMENT NOTICE</span>
          </div>
          <p>
            Default credentials must be updated before production deployment. Initial administrator setup can be verified through migration 002.
          </p>
        </div>
      </div>
    </div>
  );
};
