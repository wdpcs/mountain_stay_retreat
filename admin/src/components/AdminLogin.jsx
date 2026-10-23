import { useState } from 'react';
import { API_BASE_URL } from '../config';

export default function AdminLogin({ onLoginSuccess }) {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setIsSubmitting(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        sessionStorage.setItem('wdpcs_admin_token', data.token);
        sessionStorage.setItem('wdpcs_admin_user', JSON.stringify(data.user));
        onLoginSuccess(data.user, data.token);
      } else {
        setErrorMsg(data.error || 'Authentication failed. Please verify your credentials.');
      }
    } catch {
      setErrorMsg('Unable to reach authentication server. Please ensure the backend API is running on port 5000.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const setPreset = (u, p) => {
    setUsername(u);
    setPassword(p);
    setErrorMsg('');
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-lg z-10">
        {/* Entity Header Banner */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-gradient-to-tr from-blue-700 via-blue-600 to-indigo-500 shadow-xl shadow-blue-500/20 text-3xl mb-3 border border-blue-400/30">
            🛡️
          </div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-blue-400">
            Wayanad District Police Co-operative Society Ltd. No. W 208
          </h2>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
            Mountain Stay Retreat
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Administrative Management Portal & Accommodation Inventory Control
          </p>
        </div>

        {/* Login Card */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-8 shadow-2xl backdrop-blur-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
            <div>
              <h3 className="text-lg font-bold text-white">Staff Sign In</h3>
              <p className="text-xs text-slate-400">Authorised personnel access only</p>
            </div>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              roomsadmin.wdpcs.in
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMsg && (
              <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs text-rose-300 font-medium flex items-start gap-2">
                <span className="text-base shrink-0">⚠️</span>
                <span>{errorMsg}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Staff Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username (e.g. admin)"
                required
                className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white placeholder-slate-500 outline-none focus:border-blue-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter staff password"
                  required
                  className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white placeholder-slate-500 outline-none focus:border-blue-500 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-3 text-xs font-medium text-slate-400 hover:text-slate-200"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 py-3.5 font-bold text-sm text-white shadow-lg shadow-blue-600/30 transition hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <span className="h-4 w-4 rounded-full border-2 border-white/20 border-t-white animate-spin"></span>
                    <span>Verifying Credentials...</span>
                  </>
                ) : (
                  <>
                    <span>🔐</span>
                    <span>Authenticate & Access Dashboard</span>
                  </>
                )}
              </button>
            </div>

            {/* Quick Demo Credentials */}
            <div className="pt-4 border-t border-slate-800">
              <p className="text-[11px] font-semibold text-slate-400 mb-2">
                Quick Credential Presets (Staff Roles):
              </p>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setPreset('admin', 'admin123')}
                  className="rounded-xl border border-slate-800 bg-slate-950/80 p-2 text-left hover:border-blue-500/50 transition group"
                >
                  <p className="text-[11px] font-bold text-slate-200 group-hover:text-blue-400">Super Admin</p>
                  <p className="text-[10px] text-slate-500 font-mono">admin</p>
                </button>
                <button
                  type="button"
                  onClick={() => setPreset('manager', 'manager123')}
                  className="rounded-xl border border-slate-800 bg-slate-950/80 p-2 text-left hover:border-blue-500/50 transition group"
                >
                  <p className="text-[11px] font-bold text-slate-200 group-hover:text-blue-400">Manager</p>
                  <p className="text-[10px] text-slate-500 font-mono">manager</p>
                </button>
                <button
                  type="button"
                  onClick={() => setPreset('reception', 'reception123')}
                  className="rounded-xl border border-slate-800 bg-slate-950/80 p-2 text-left hover:border-blue-500/50 transition group"
                >
                  <p className="text-[11px] font-bold text-slate-200 group-hover:text-blue-400">Front Desk</p>
                  <p className="text-[10px] text-slate-500 font-mono">reception</p>
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Security Notice Footer */}
        <div className="mt-6 text-center text-xs text-slate-500 space-y-1">
          <p>
            🔒 All administrative actions are recorded in immutable audit logs.
          </p>
          <p>
            Guest booking site: <a href="https://rooms.wdpcs.in" target="_blank" rel="noreferrer" className="text-blue-400 hover:underline">rooms.wdpcs.in</a>
          </p>
        </div>
      </div>
    </div>
  );
}
