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
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background soft ambient accents */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-200/50 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-indigo-200/50 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-lg z-10">
        {/* Entity Header Banner */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-gradient-to-tr from-blue-700 via-blue-600 to-indigo-600 shadow-xl shadow-blue-500/20 text-3xl mb-3 text-white">
            🛡️
          </div>
          <h2 className="text-xs font-extrabold uppercase tracking-wider text-blue-700">
            Wayanad District Police Co-operative Society Ltd. No. W 208
          </h2>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
            Mountain Stay Retreat
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 font-medium">
            Administrative Management Portal & Accommodation Inventory Control
          </p>
        </div>

        {/* Login Card */}
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Staff Sign In</h3>
              <p className="text-xs text-slate-500 font-medium">Authorised personnel access only</p>
            </div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
              <span className="h-2 w-2 rounded-full bg-blue-600"></span>
              roomsadmin.wdpcs.in
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMsg && (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-800 font-semibold flex items-start gap-2">
                <span className="text-base shrink-0">⚠️</span>
                <span>{errorMsg}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Staff Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                required
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-xs text-blue-600 hover:text-blue-800 font-semibold"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                required
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-2xl bg-blue-600 py-3.5 text-sm font-bold text-white shadow-md shadow-blue-500/25 transition hover:bg-blue-700 disabled:opacity-50"
            >
              {isSubmitting ? 'Authenticating...' : '🔐 Authenticate & Access Dashboard'}
            </button>
          </form>

          {/* Quick Preset Buttons for local testing */}
          <div className="mt-6 border-t border-slate-100 pt-5">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
              Quick Credential Presets (Staff Roles):
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPreset('admin', 'admin123')}
                className="rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-2 text-center hover:bg-slate-100 transition"
              >
                <span className="block text-xs font-bold text-slate-800">Super Admin</span>
                <span className="block text-[10px] text-slate-500 font-mono">admin</span>
              </button>
              <button
                type="button"
                onClick={() => setPreset('manager', 'manager123')}
                className="rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-2 text-center hover:bg-slate-100 transition"
              >
                <span className="block text-xs font-bold text-slate-800">Manager</span>
                <span className="block text-[10px] text-slate-500 font-mono">manager</span>
              </button>
              <button
                type="button"
                onClick={() => setPreset('reception', 'reception123')}
                className="rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-2 text-center hover:bg-slate-100 transition"
              >
                <span className="block text-xs font-bold text-slate-800">Front Desk</span>
                <span className="block text-[10px] text-slate-500 font-mono">reception</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
