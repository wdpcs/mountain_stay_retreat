import { useState, useEffect, useCallback } from 'react';
import { API_BASE_URL, SUPABASE_URL, SUPABASE_KEY } from '../config';
import UserManagement from './UserManagement';

const DEFAULT_SETTINGS = {
  societyName: 'Wayanad District Police Co-operative Society Ltd. No. W 208',
  property: 'Mountain Stay Retreat',
  address:
    'Kalpetta North Post, Opposite to Skyface Apartment, SP office Road, Wayanad, Kerala. 673122',
  receptionPhone: '+91 70250 17611',
  managerPhone: '+91 83019 95940',
  checkInTime: '13:00',
  checkOutTime: '12:00',
  razorpayMode: 'hold',
  cancellationPolicy:
    'Full refund if cancelled at least 24 hours prior to check-in date. Cancellations within 24 hours incur 1-night retention charges.',
};

export default function AdminSettings({ token, currentUser, onDataReset, onUserUpdated }) {
  const [activeSubTab, setActiveSubTab] = useState('profile');
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saveSuccess, setSaveSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Self Profile & Password State
  const [myProfileName, setMyProfileName] = useState(currentUser?.name || '');
  const [myProfileEmail, setMyProfileEmail] = useState(currentUser?.email || '');
  const [myProfilePhone, setMyProfilePhone] = useState(currentUser?.phone || '');
  const [myProfileSuccess, setMyProfileSuccess] = useState('');
  const [myProfileError, setMyProfileError] = useState('');
  const [isMyProfileSubmitting, setIsMyProfileSubmitting] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [pwSuccess, setPwSuccess] = useState('');
  const [pwError, setPwError] = useState('');
  const [isPwSubmitting, setIsPwSubmitting] = useState(false);

  // Reset modal state
  const [resetModalMode, setResetModalMode] = useState(null); // 'factory_seed' or 'clear_all'
  const [confirmInput, setConfirmInput] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState('');
  const [resetError, setResetError] = useState('');

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/settings`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.settings) {
          setSettings(data.settings);
          setLoading(false);
          return;
        }
      }
    } catch {
      // Fallback below
    }

    try {
      const sbRes = await fetch(`${SUPABASE_URL}/rest/v1/property_settings?select=*&limit=1`, {
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
        },
      });
      if (sbRes.ok) {
        const rows = await sbRes.json();
        if (rows && rows.length > 0) {
          const r = rows[0];
          setSettings((prev) => ({
            ...prev,
            ...r,
            address:
              r.address ||
              'Kalpetta North Post, Opposite to Skyface Apartment, SP office Road, Wayanad, Kerala. 673122',
            managerPhone: r.manager_phone === '+91 98450 12345' ? '+91 83019 95940' : (r.manager_phone || '+91 83019 95940'),
          }));
        }
      }
    } catch {
      // Retain DEFAULT_SETTINGS
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  useEffect(() => {
    if (currentUser) {
      setMyProfileName(currentUser.name || '');
      setMyProfileEmail(currentUser.email || '');
      setMyProfilePhone(currentUser.phone || '');
    }
  }, [currentUser]);

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

  const handleUpdateMyProfile = async (e) => {
    e.preventDefault();
    setMyProfileError('');
    setMyProfileSuccess('');
    setIsMyProfileSubmitting(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: myProfileName,
          email: myProfileEmail,
          phone: myProfilePhone,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setMyProfileSuccess('✅ Profile updated successfully!');
        if (onUserUpdated) {
          onUserUpdated(data.user, data.token);
        }
        setTimeout(() => setMyProfileSuccess(''), 3000);
      } else {
        setMyProfileError(data.error || 'Failed to update profile.');
      }
    } catch {
      setMyProfileError('Failed to reach backend server. Please try again.');
    } finally {
      setIsMyProfileSubmitting(false);
    }
  };

  const handleChangeMyPassword = async (e) => {
    e.preventDefault();
    setPwError('');
    setPwSuccess('');

    if (newPassword.length < 6) {
      setPwError('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPwError('New password and confirmation do not match.');
      return;
    }

    setIsPwSubmitting(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/profile/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setPwSuccess('✅ Your password has been changed successfully!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => setPwSuccess(''), 4000);
      } else {
        setPwError(data.error || 'Failed to change password.');
      }
    } catch {
      setPwError('Failed to reach backend server. Please try again.');
    } finally {
      setIsPwSubmitting(false);
    }
  };

  const handleExecuteReset = async () => {
    if (confirmInput.trim().toUpperCase() !== 'RESET') {
      setResetError('Please type RESET exactly to confirm.');
      return;
    }

    setResetError('');
    setResetLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/system/reset`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ mode: resetModalMode }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setResetSuccess(data.message || 'Data reset executed successfully!');
        setResetModalMode(null);
        setConfirmInput('');
        if (onDataReset) onDataReset();
        setTimeout(() => setResetSuccess(''), 4000);
      } else {
        setResetError(data.error || 'Failed to execute system data reset.');
      }
    } catch {
      setResetError('Server connection error. Please ensure backend is running.');
    } finally {
      setResetLoading(false);
    }
  };

  if (loading && !settings) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-3 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  const isSuperAdmin = currentUser?.role === 'admin';

  return (
    <div className="space-y-6">
      {/* Settings Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-3xl border border-blue-200/80 bg-gradient-to-r from-blue-50 via-indigo-50/40 to-white p-6 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">⚙️</span>
            <span className="text-xs font-bold uppercase tracking-wider text-blue-700">
              System Configuration & Administration
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
            Portal Settings & Controls
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 font-medium mt-0.5">
            Manage society profile, user accounts, password resets, and system data maintenance
          </p>
        </div>

        {!isSuperAdmin && (
          <span className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-800">
            🔒 Read-only view (Super Admin privileges required to edit)
          </span>
        )}
      </div>

      {/* Sub-Navigation Pills Inside Settings */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveSubTab('profile')}
          className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition whitespace-nowrap ${
            activeSubTab === 'profile'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:text-slate-900'
          }`}
        >
          <span>🏛️</span>
          <span>Society Profile</span>
        </button>

        <button
          onClick={() => setActiveSubTab('my-profile')}
          className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition whitespace-nowrap ${
            activeSubTab === 'my-profile'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:text-slate-900'
          }`}
        >
          <span>👤</span>
          <span>My Profile & Password</span>
        </button>

        <button
          onClick={() => setActiveSubTab('users')}
          className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition whitespace-nowrap ${
            activeSubTab === 'users'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:text-slate-900'
          }`}
        >
          <span>👥</span>
          <span>Staff User Management</span>
        </button>

        <button
          onClick={() => setActiveSubTab('domains')}
          className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition whitespace-nowrap ${
            activeSubTab === 'domains'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:text-slate-900'
          }`}
        >
          <span>💳</span>
          <span>Gateway & Routing</span>
        </button>

        <button
          onClick={() => setActiveSubTab('reset')}
          className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition whitespace-nowrap ${
            activeSubTab === 'reset'
              ? 'bg-rose-600 text-white shadow-xs'
              : 'bg-white text-rose-700 border border-rose-200 hover:bg-rose-50'
          }`}
        >
          <span>⚠️</span>
          <span>Data Reset Option</span>
        </button>
      </div>

      {/* Global Success / Reset Alert */}
      {resetSuccess && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-bold text-emerald-800 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <span className="text-lg">🎉</span>
            <span>{resetSuccess}</span>
          </div>
          <button
            onClick={() => setResetSuccess('')}
            className="text-slate-400 hover:text-slate-700"
          >
            ✕
          </button>
        </div>
      )}

      {/* SUB-TAB 1: SOCIETY & FACILITY PROFILE */}
      {activeSubTab === 'profile' && (
        <form onSubmit={handleSave} className="space-y-6">
          {saveSuccess && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs text-emerald-800 font-bold">
              {saveSuccess}
            </div>
          )}

          {/* Entity Metadata */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span>🏛️</span>
              <span>Parent Entity & Facility Profile</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Registered Society Name
                </label>
                <input
                  type="text"
                  disabled={!isSuperAdmin}
                  value={settings.societyName || ''}
                  onChange={(e) => setSettings({ ...settings, societyName: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-slate-900 outline-none focus:border-blue-500 focus:bg-white transition disabled:opacity-60"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Accommodation Facility Name
                </label>
                <input
                  type="text"
                  disabled={!isSuperAdmin}
                  value={settings.property || ''}
                  onChange={(e) => setSettings({ ...settings, property: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-slate-900 outline-none focus:border-blue-500 focus:bg-white transition disabled:opacity-60"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-slate-700 font-bold mb-1">
                  Property Physical Address
                </label>
                <input
                  type="text"
                  disabled={!isSuperAdmin}
                  value={settings.address || ''}
                  onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-slate-900 outline-none focus:border-blue-500 focus:bg-white transition disabled:opacity-60"
                />
              </div>
            </div>
          </div>

          {/* Operating Hours & Contact */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span>⏰</span>
              <span>Operating Timings & Front Desk Contacts</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Standard Check-in Time
                </label>
                <input
                  type="time"
                  disabled={!isSuperAdmin}
                  value={settings.checkInTime || '13:00'}
                  onChange={(e) => setSettings({ ...settings, checkInTime: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-slate-900 outline-none focus:border-blue-500 focus:bg-white transition disabled:opacity-60 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Standard Check-out Time
                </label>
                <input
                  type="time"
                  disabled={!isSuperAdmin}
                  value={settings.checkOutTime || '12:00'}
                  onChange={(e) => setSettings({ ...settings, checkOutTime: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-slate-900 outline-none focus:border-blue-500 focus:bg-white transition disabled:opacity-60 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Reception Duty Phone
                </label>
                <input
                  type="text"
                  disabled={!isSuperAdmin}
                  value={settings.receptionPhone || ''}
                  onChange={(e) => setSettings({ ...settings, receptionPhone: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-slate-900 outline-none focus:border-blue-500 focus:bg-white transition disabled:opacity-60"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Manager Contact Phone
                </label>
                <input
                  type="text"
                  disabled={!isSuperAdmin}
                  value={settings.managerPhone || ''}
                  onChange={(e) => setSettings({ ...settings, managerPhone: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-slate-900 outline-none focus:border-blue-500 focus:bg-white transition disabled:opacity-60"
                />
              </div>
            </div>
          </div>

          {/* Cancellation Policy */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span>📄</span>
              <span>Standard Cancellation & Retention Policy</span>
            </h3>

            <div className="text-xs">
              <textarea
                rows="3"
                disabled={!isSuperAdmin}
                value={settings.cancellationPolicy || ''}
                onChange={(e) => setSettings({ ...settings, cancellationPolicy: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-slate-900 outline-none focus:border-blue-500 focus:bg-white transition disabled:opacity-60 leading-relaxed font-medium"
              ></textarea>
            </div>
          </div>

          {isSuperAdmin && (
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-xl bg-blue-600 px-6 py-3 font-bold text-xs text-white shadow-xs hover:bg-blue-700 transition disabled:opacity-50"
              >
                {isSubmitting ? 'Saving...' : 'Save Configuration Changes'}
              </button>
            </div>
          )}
        </form>
      )}

      {/* SUB-TAB 2: MY PROFILE & PASSWORD RESET */}
      {activeSubTab === 'my-profile' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Card 1: Personal Profile Details */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <span className="text-xl">👤</span>
              <div>
                <h3 className="text-base font-bold text-slate-900">Personal Profile Details</h3>
                <p className="text-xs text-slate-500">Update your staff name, email, and contact phone</p>
              </div>
            </div>

            <form onSubmit={handleUpdateMyProfile} className="space-y-3.5 text-xs">
              {myProfileSuccess && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-2.5 text-emerald-800 font-bold">
                  {myProfileSuccess}
                </div>
              )}
              {myProfileError && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-2.5 text-rose-700 font-bold">
                  {myProfileError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Username</label>
                  <input
                    type="text"
                    disabled
                    value={currentUser?.username || ''}
                    className="w-full rounded-xl border border-slate-200 bg-slate-100 p-2.5 text-slate-600 font-mono outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">System Role</label>
                  <input
                    type="text"
                    disabled
                    value={currentUser?.role?.toUpperCase() || ''}
                    className="w-full rounded-xl border border-slate-200 bg-slate-100 p-2.5 text-slate-600 font-mono outline-none font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Full Display Name</label>
                <input
                  type="text"
                  value={myProfileName}
                  onChange={(e) => setMyProfileName(e.target.value)}
                  required
                  placeholder="e.g. Chief Security Officer"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-slate-900 outline-none focus:border-blue-500 focus:bg-white transition"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Official Email Address</label>
                <input
                  type="email"
                  value={myProfileEmail}
                  onChange={(e) => setMyProfileEmail(e.target.value)}
                  required
                  placeholder="admin@wdpcs.in"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-slate-900 outline-none focus:border-blue-500 focus:bg-white transition"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Contact Phone Number</label>
                <input
                  type="tel"
                  value={myProfilePhone}
                  onChange={(e) => setMyProfilePhone(e.target.value)}
                  placeholder="+91 98450 XXXXX"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-slate-900 outline-none focus:border-blue-500 focus:bg-white transition"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={isMyProfileSubmitting}
                  className="rounded-xl bg-blue-600 px-5 py-2.5 font-bold text-white hover:bg-blue-700 transition disabled:opacity-50 shadow-xs"
                >
                  {isMyProfileSubmitting ? 'Saving...' : 'Save Profile Changes'}
                </button>
              </div>
            </form>
          </div>

          {/* Card 2: Password Reset Facility */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <span className="text-xl">🔑</span>
              <div>
                <h3 className="text-base font-bold text-slate-900">Password Reset Facility</h3>
                <p className="text-xs text-slate-500">Change your administrative account password</p>
              </div>
            </div>

            <form onSubmit={handleChangeMyPassword} className="space-y-3.5 text-xs">
              {pwSuccess && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-2.5 text-emerald-800 font-bold">
                  {pwSuccess}
                </div>
              )}
              {pwError && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-2.5 text-rose-700 font-bold">
                  {pwError}
                </div>
              )}

              <div>
                <label className="block text-slate-700 font-bold mb-1">Current Password</label>
                <div className="relative">
                  <input
                    type={showCurrent ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    placeholder="Enter current password"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 pr-10 text-slate-900 outline-none focus:border-blue-500 focus:bg-white transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrent((p) => !p)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-700 text-xs"
                  >
                    {showCurrent ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  New Password (min 6 characters)
                </label>
                <div className="relative">
                  <input
                    type={showNew ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={6}
                    placeholder="Create new password"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 pr-10 text-slate-900 outline-none focus:border-blue-500 focus:bg-white transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew((p) => !p)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-700 text-xs"
                  >
                    {showNew ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Confirm New Password</label>
                <input
                  type={showNew ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="Re-type new password"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-slate-900 outline-none focus:border-blue-500 focus:bg-white transition"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={isPwSubmitting || !currentPassword || !newPassword}
                  className="rounded-xl bg-blue-600 px-5 py-2.5 font-bold text-white hover:bg-blue-700 transition disabled:opacity-50 shadow-xs"
                >
                  {isPwSubmitting ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: EMBEDDED USER MANAGEMENT */}
      {activeSubTab === 'users' && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-blue-200 bg-blue-50/60 p-4 text-xs text-blue-900 font-medium flex items-center gap-2">
            <span>🛡️</span>
            <span>
              Manage all administrative and reception personnel, create credentials, reset staff passwords, and configure role-based permissions directly from settings.
            </span>
          </div>
          <UserManagement token={token} currentUser={currentUser} onUserUpdated={onUserUpdated} />
        </div>
      )}

      {/* SUB-TAB 4: GATEWAY & ROUTING */}
      {activeSubTab === 'domains' && (
        <div className="space-y-6">
          {/* Payment Gateway Mode */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span>💳</span>
              <span>Razorpay Payment Gateway Mode</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Active Gateway Environment
                </label>
                <select
                  disabled={!isSuperAdmin}
                  value={settings.razorpayMode || 'hold'}
                  onChange={(e) => setSettings({ ...settings, razorpayMode: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-slate-900 outline-none focus:border-blue-500 focus:bg-white transition disabled:opacity-60 font-bold"
                >
                  <option value="hold">⏸️ Temporarily On Hold / Paused (Counter & UPI Only)</option>
                  <option value="test">Sandbox Test Mode (Simulated Payments)</option>
                  <option value="live">Live Production Gateway (Real Transactions)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Server Credentials Status
                </label>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-slate-700 flex items-center justify-between font-medium">
                  <span className="font-mono text-xs">RAZORPAY_KEY_SECRET</span>
                  <span className="font-mono text-emerald-700 font-bold text-[11px] bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                    Protected on Server
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Domain Mapping Reference */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-3">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span>🌐</span>
              <span>Three-Tier Domain Routing Configuration</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3.5">
                <span className="text-slate-500 text-[10px] uppercase font-bold block">
                  Public Guest Frontend
                </span>
                <a
                  href="https://rooms.wdpcs.in"
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-600 font-mono font-bold hover:underline"
                >
                  rooms.wdpcs.in
                </a>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3.5">
                <span className="text-slate-500 text-[10px] uppercase font-bold block">
                  Admin Operations Portal
                </span>
                <span className="text-emerald-700 font-mono font-bold">roomsadmin.wdpcs.in</span>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3.5">
                <span className="text-slate-500 text-[10px] uppercase font-bold block">
                  Central Backend API
                </span>
                <span className="text-indigo-700 font-mono font-bold">api.wdpcs.in</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 5: DATA RESET OPTION & SYSTEM MAINTENANCE */}
      {activeSubTab === 'reset' && (
        <div className="space-y-6">
          <div className="rounded-3xl border border-rose-200 bg-gradient-to-r from-rose-50 via-orange-50/30 to-white p-6 shadow-xs">
            <div className="flex items-center gap-2">
              <span className="text-xl">⚠️</span>
              <span className="text-xs font-bold uppercase tracking-wider text-rose-700">
                Data Maintenance & Reset Control
              </span>
            </div>
            <h3 className="text-xl font-extrabold text-slate-900 mt-1">
              System State & Data Reset Utilities
            </h3>
            <p className="text-xs text-slate-600 font-medium mt-0.5 leading-relaxed">
              Use these tools to re-initialize demonstration records or purge transactional test data
              prior to production rollout. All actions require Super Admin privileges and an explicit
              confirmation phrase.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Action Card 1: Restore Demo Seed Baseline */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xl">🔄</span>
                  <h4 className="text-base font-bold text-slate-900">
                    Restore Baseline Factory Data
                  </h4>
                </div>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  Restores verified sample bookings, clean simulated transactions, and resets all
                  room inventory to default tariffs (₹2,500 Suite / ₹450 Dorm). Useful for testing
                  features, onboarding staff, or demonstrating the portal.
                </p>
                <div className="mt-3 rounded-xl bg-slate-50 border border-slate-200 p-2.5 text-[11px] text-slate-600 space-y-1">
                  <div>• Resets Bookings to 2 sample reservations</div>
                  <div>• Restores standard Razorpay and Counter transactions</div>
                  <div>• Clears room maintenance blocks</div>
                </div>
              </div>

              <button
                onClick={() => {
                  setResetModalMode('factory_seed');
                  setConfirmInput('');
                  setResetError('');
                }}
                disabled={!isSuperAdmin}
                className="w-full rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-blue-700 transition disabled:opacity-50"
              >
                Restore Factory Demo Data
              </button>
            </div>

            {/* Action Card 2: Purge All Active Reservations */}
            <div className="rounded-3xl border border-rose-200 bg-white p-6 shadow-xs flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xl">🗑️</span>
                  <h4 className="text-base font-bold text-rose-800">
                    Purge All Reservations & History
                  </h4>
                </div>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  Completely wipes all active and archived booking reservations, payment
                  transactions, and refund logs. Provides a 100% clean, blank slate for real guests.
                  Staff accounts and login credentials remain completely intact.
                </p>
                <div className="mt-3 rounded-xl bg-rose-50 border border-rose-200 p-2.5 text-[11px] text-rose-800 space-y-1 font-medium">
                  <div>• Clears all bookings (0 total reservations)</div>
                  <div>• Wipes transactions and refund ledger</div>
                  <div>• Preserves all staff accounts and system settings</div>
                </div>
              </div>

              <button
                onClick={() => {
                  setResetModalMode('clear_all');
                  setConfirmInput('');
                  setResetError('');
                }}
                disabled={!isSuperAdmin}
                className="w-full rounded-xl bg-rose-600 px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-rose-700 transition disabled:opacity-50"
              >
                Purge All Reservations (Clean Slate)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Explicit Confirmation Modal for Data Reset */}
      {resetModalMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl border border-rose-200 bg-white p-6 text-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl">⚠️</span>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    {resetModalMode === 'clear_all'
                      ? 'Confirm Full Data Purge'
                      : 'Confirm Factory Data Reset'}
                  </h3>
                  <span className="text-[11px] text-rose-600 font-bold uppercase tracking-wider">
                    Irreversible Operation
                  </span>
                </div>
              </div>
              <button
                onClick={() => setResetModalMode(null)}
                className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              {resetModalMode === 'clear_all'
                ? 'You are about to completely wipe all bookings, counter receipts, online payments, and refund records. This cannot be undone.'
                : 'You are about to restore default demonstration bookings, pricing, and transactions. Any custom walk-in bookings created during testing will be replaced with clean seed data.'}
            </p>

            {resetError && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-2.5 text-xs text-rose-700 font-bold">
                {resetError}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-800">
                To confirm this operation, type <span className="font-mono text-rose-600">RESET</span> below:
              </label>
              <input
                type="text"
                value={confirmInput}
                onChange={(e) => setConfirmInput(e.target.value)}
                placeholder="Type RESET"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-slate-900 font-mono font-bold text-xs outline-none focus:border-rose-500 focus:bg-white transition"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setResetModalMode(null)}
                className="rounded-xl border border-slate-200 px-4 py-2 font-semibold text-xs text-slate-600 hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteReset}
                disabled={confirmInput.trim().toUpperCase() !== 'RESET' || resetLoading}
                className="rounded-xl bg-rose-600 px-4 py-2 font-bold text-xs text-white hover:bg-rose-700 transition disabled:opacity-40 shadow-xs"
              >
                {resetLoading ? 'Executing Reset...' : 'Execute Reset Now'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
