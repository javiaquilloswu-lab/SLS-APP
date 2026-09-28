import React, { useState, useEffect } from 'react';
import { Database, Server, CheckCircle2, AlertCircle, RefreshCw, ExternalLink, X, Settings2 } from 'lucide-react';
import { getApiBaseUrl, setApiBaseUrl, resetApiBaseUrl, DEFAULT_API_BASE_URL } from '../config/api';
import { StudentLifeApi } from '../services/api';

interface BackendStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnectedChange?: (connected: boolean) => void;
}

export function BackendStatusModal({ isOpen, onClose, onConnectedChange }: BackendStatusModalProps) {
  const [urlInput, setUrlInput] = useState(getApiBaseUrl());
  const [testing, setTesting] = useState(false);
  const [status, setStatus] = useState<{
    tested: boolean;
    connected: boolean;
    message: string;
    details?: any;
  }>({
    tested: false,
    connected: false,
    message: 'Click Test Connection to ping PHP + PostgreSQL'
  });

  const checkConnection = async () => {
    setTesting(true);
    const result = await StudentLifeApi.testConnection();
    setStatus({
      tested: true,
      connected: result.connected,
      message: result.message,
      details: result.details
    });
    setTesting(false);
    if (onConnectedChange) {
      onConnectedChange(result.connected);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setUrlInput(getApiBaseUrl());
      checkConnection();
    }
  }, [isOpen]);

  const handleSaveUrl = () => {
    setApiBaseUrl(urlInput);
    checkConnection();
  };

  const handleResetUrl = () => {
    resetApiBaseUrl();
    setUrlInput(DEFAULT_API_BASE_URL);
    checkConnection();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-6 text-slate-200">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-950 text-rose-400 border border-rose-800/40">
              <Database className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">PHP + PostgreSQL Connection</h3>
              <p className="text-xs text-slate-400">Target: Windows · XAMPP Apache · PostgreSQL</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Live Status Banner */}
        <div className="mt-4">
          <div
            className={`flex items-start gap-3 rounded-xl p-3.5 border ${
              status.connected
                ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
                : 'bg-amber-950/40 border-amber-800/60 text-amber-300'
            }`}
          >
            {status.connected ? (
              <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400 mt-0.5" />
            ) : (
              <AlertCircle className="h-5 w-5 shrink-0 text-amber-400 mt-0.5" />
            )}
            <div className="text-xs flex-1">
              <div className="font-bold text-sm">
                {status.connected ? 'Connected to PostgreSQL Backend' : 'Local PHP Server Offline / Unreachable'}
              </div>
              <p className="mt-1 text-slate-300 leading-relaxed">{status.message}</p>

              {status.details && (
                <div className="mt-2.5 rounded-lg bg-slate-950/70 p-2.5 font-mono text-[11px] text-slate-300 space-y-1">
                  <div>Database: <span className="text-emerald-400">{status.details.database}</span></div>
                  <div>Host: <span className="text-slate-400">{status.details.host}:{status.details.port}</span></div>
                  <div>Server: <span className="text-slate-400">{status.details.server_version}</span></div>
                  {status.details.table_counts && (
                    <div className="pt-1 text-[10px] text-slate-400 border-t border-slate-800">
                      Tables: {Object.entries(status.details.table_counts).map(([k, v]) => `${k} (${v})`).join(', ')}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Base URL Configuration */}
        <div className="mt-4 space-y-2">
          <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
            <span>PHP API Base URL</span>
            <span className="text-[11px] text-slate-400 font-normal">Centralized Endpoint Config</span>
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={urlInput}
              onChange={e => setUrlInput(e.target.value)}
              placeholder="http://localhost:8080/android_api"
              className="flex-1 rounded-xl bg-slate-800 border border-slate-700 px-3 py-2 text-xs font-mono text-slate-100 outline-none focus:border-rose-500"
            />
            <button
              onClick={handleSaveUrl}
              className="rounded-xl bg-[#5B0E1B] px-3.5 py-2 text-xs font-bold text-white hover:bg-[#721222] transition-colors"
            >
              Save &amp; Test
            </button>
          </div>
        </div>

        {/* Quick presets for development */}
        <div className="mt-3 flex flex-wrap gap-1.5 text-[11px]">
          <span className="text-slate-400 self-center mr-1">Presets:</span>
          <button
            onClick={() => { setUrlInput('http://localhost:8080/android_api'); setApiBaseUrl('http://localhost:8080/android_api'); checkConnection(); }}
            className="rounded-md bg-slate-800 hover:bg-slate-700 px-2 py-1 text-slate-300"
          >
            PC / Localhost
          </button>
          <button
            onClick={() => { setUrlInput('http://10.0.2.2:8080/android_api'); setApiBaseUrl('http://10.0.2.2:8080/android_api'); checkConnection(); }}
            className="rounded-md bg-slate-800 hover:bg-slate-700 px-2 py-1 text-slate-300"
          >
            Android Emulator (10.0.2.2)
          </button>
          <button
            onClick={handleResetUrl}
            className="rounded-md bg-slate-800 hover:bg-slate-700 px-2 py-1 text-slate-400"
          >
            Reset
          </button>
        </div>

        {/* Helpful Local Checklist */}
        <div className="mt-4 rounded-xl bg-slate-800/60 p-3.5 border border-slate-700/60 text-xs space-y-2">
          <div className="font-bold text-slate-200 flex items-center gap-1.5">
            <Server className="h-4 w-4 text-rose-400" />
            Quick Setup for Windows XAMPP + PostgreSQL:
          </div>
          <ol className="list-decimal list-inside space-y-1 text-slate-300 text-[11px] leading-relaxed">
            <li>Copy the <code className="text-rose-300">/android_api</code> folder to <code className="text-rose-300">C:\xampp\htdocs\android_api</code></li>
            <li>In XAMPP Control Panel, ensure <b>Apache</b> is started.</li>
            <li>In PostgreSQL (pgAdmin / psql), run <code className="text-rose-300">android_api/schema.sql</code></li>
            <li>Ensure <code className="text-rose-300">extension=pdo_pgsql</code> and <code className="text-rose-300">extension=pgsql</code> are enabled in <code className="text-rose-300">php.ini</code>.</li>
          </ol>
        </div>

        {/* Actions Bar */}
        <div className="mt-5 flex items-center justify-between pt-3 border-t border-slate-800">
          <a
            href={`${getApiBaseUrl()}/admin.php`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-300 font-semibold"
          >
            Open Admin Dashboard <ExternalLink className="h-3.5 w-3.5" />
          </a>

          <div className="flex gap-2">
            <button
              onClick={checkConnection}
              disabled={testing}
              className="flex items-center gap-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 px-3.5 py-2 text-xs font-semibold text-white transition-colors"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${testing ? 'animate-spin' : ''}`} />
              {testing ? 'Testing...' : 'Retest'}
            </button>
            <button
              onClick={onClose}
              className="rounded-xl bg-[#5B0E1B] px-4 py-2 text-xs font-bold text-white hover:bg-[#721222] transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
