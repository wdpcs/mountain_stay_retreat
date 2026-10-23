import { useState, useEffect } from 'react';
import { API_BASE_URL, SOCIETY_INFO } from '../config';

export default function AdminSettings({ token, currentUser }) {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saveSuccess, setSaveSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchSettings = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/settings`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setSettings(data.settings);
      }
    } catch (err) {
      console.error('Failed to fetch settings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, [token]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaveSuccess('');
    setIsSubmitting(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/settings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(settings),
      });

      if (res.ok) {
        setSaveSuccess('✅ Property & system configurations saved successfully!');
        setTimeout(() => setSaveSuccess(''), 3000);
      }
    } catch {
      console.error('Failed to save settings.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading || !settings) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  const isSuperAdmin = currentUser?.role === 'admin';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">⚙️</span>
            <span className="text-xs font-bold uppercase tracking-wider text-blue-400">
              System Configuration
            </span>
          </div>
          <h2 className="text-2xl font-bold text-white mt-1">
            Society Profile & Gateway Settings
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Operational hours, contact phone numbers, and payment gateway configuration
          </p>
        </div>

        {!isSuperAdmin && (
          <span className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-400">
            🔒 Read-only view (Super Admin privileges required to edit)
          </span>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {saveSuccess && (
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs text-emerald-300 font-semibold">
            {saveSuccess}
          </div>
        )}

        {/* Entity Metadata */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <span>🏛️</span>
            <span>Parent Entity & Facility Profile</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Registered Society Name
              </label>
              <input
                type="text"
                disabled={!isSuperAdmin}
                value={settings.societyName || ''}
                onChange={(e) => setSettings({ ...settings, societyName: e.target.value })}
                className="w-full rounded-2xl border border-slate-800 bg-slate-950 p-2.5 text-white outline-none focus:border-blue-500 disabled:opacity-60"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Accommodation Facility Name
              </label>
              <input
                type="text"
                disabled={!isSuperAdmin}
                value={settings.property || ''}
                onChange={(e) => setSettings({ ...settings, property: e.target.value })}
                className="w-full rounded-2xl border border-slate-800 bg-slate-950 p-2.5 text-white outline-none focus:border-blue-500 disabled:opacity-60"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-slate-300 font-semibold mb-1">
                Property Physical Address
              </label>
              <input
                type="text"
                disabled={!isSuperAdmin}
                value={settings.address || ''}
                onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                className="w-full rounded-2xl border border-slate-800 bg-slate-950 p-2.5 text-white outline-none focus:border-blue-500 disabled:opacity-60"
              />
            </div>
          </div>
        </div>

        {/* Operating Hours & Contact */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <span>⏰</span>
            <span>Operating Timings & Front Desk Contacts</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Standard Check-in Time
              </label>
              <input
                type="time"
                disabled={!isSuperAdmin}
                value={settings.checkInTime || '13:00'}
                onChange={(e) => setSettings({ ...settings, checkInTime: e.target.value })}
                className="w-full rounded-2xl border border-slate-800 bg-slate-950 p-2.5 text-white outline-none focus:border-blue-500 disabled:opacity-60 font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Standard Check-out Time
              </label>
              <input
                type="time"
                disabled={!isSuperAdmin}
                value={settings.checkOutTime || '12:00'}
                onChange={(e) => setSettings({ ...settings, checkOutTime: e.target.value })}
                className="w-full rounded-2xl border border-slate-800 bg-slate-950 p-2.5 text-white outline-none focus:border-blue-500 disabled:opacity-60 font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Reception Duty Phone
              </label>
              <input
                type="text"
                disabled={!isSuperAdmin}
                value={settings.receptionPhone || ''}
                onChange={(e) => setSettings({ ...settings, receptionPhone: e.target.value })}
                className="w-full rounded-2xl border border-slate-800 bg-slate-950 p-2.5 text-white outline-none focus:border-blue-500 disabled:opacity-60"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Manager Contact Phone
              </label>
              <input
                type="text"
                disabled={!isSuperAdmin}
                value={settings.managerPhone || ''}
                onChange={(e) => setSettings({ ...settings, managerPhone: e.target.value })}
                className="w-full rounded-2xl border border-slate-800 bg-slate-950 p-2.5 text-white outline-none focus:border-blue-500 disabled:opacity-60"
              />
            </div>
          </div>
        </div>

        {/* Payment Gateway Mode */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <span>💳</span>
            <span>Razorpay Payment Gateway Mode</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Active Gateway Environment
              </label>
              <select
                disabled={!isSuperAdmin}
                value={settings.razorpayMode || 'test'}
                onChange={(e) => setSettings({ ...settings, razorpayMode: e.target.value })}
                className="w-full rounded-2xl border border-slate-800 bg-slate-950 p-2.5 text-white outline-none focus:border-blue-500 disabled:opacity-60 font-bold"
              >
                <option value="test">Sandbox Test Mode (Simulated Payments)</option>
                <option value="live">Live Production Gateway (Real Transactions)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Server Credentials Status
              </label>
              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-2.5 text-slate-300 flex items-center justify-between">
                <span>RAZORPAY_KEY_SECRET</span>
                <span className="font-mono text-emerald-400 font-bold text-[11px]">Protected on Server (Hidden)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Cancellation Policy */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <span>📄</span>
            <span>Standard Cancellation & Retention Policy</span>
          </h3>

          <div className="text-xs">
            <textarea
              rows="3"
              disabled={!isSuperAdmin}
              value={settings.cancellationPolicy || ''}
              onChange={(e) => setSettings({ ...settings, cancellationPolicy: e.target.value })}
              className="w-full rounded-2xl border border-slate-800 bg-slate-950 p-3 text-white outline-none focus:border-blue-500 disabled:opacity-60"
            ></textarea>
          </div>
        </div>

        {/* Domain Mapping Reference */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl space-y-3">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <span>🌐</span>
            <span>Three-Tier Domain Routing Configuration</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-3">
              <span className="text-slate-500 text-[10px] uppercase font-bold block">Public Guest Frontend</span>
              <a href="https://rooms.wdpcs.in" target="_blank" rel="noreferrer" className="text-blue-400 font-mono font-bold hover:underline">
                rooms.wdpcs.in
              </a>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-3">
              <span className="text-slate-500 text-[10px] uppercase font-bold block">Admin Operations Portal</span>
              <span className="text-emerald-400 font-mono font-bold">
                roomsadmin.wdpcs.in
              </span>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-3">
              <span className="text-slate-500 text-[10px] uppercase font-bold block">Central Backend API</span>
              <span className="text-indigo-400 font-mono font-bold">
                api.wdpcs.in
              </span>
            </div>
          </div>
        </div>

        {isSuperAdmin && (
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-2xl bg-blue-600 px-6 py-3 font-bold text-xs text-white shadow-lg shadow-blue-600/30 hover:bg-blue-500 transition disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Save Configuration Changes'}
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
