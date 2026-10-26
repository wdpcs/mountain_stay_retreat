import { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config';

export default function UserProfileModal({
  isOpen,
  onClose,
  token,
  currentUser,
  onUserUpdated,
}) {
  const [activeTab, setActiveTab] = useState('profile'); // 'profile' or 'password'

  // Profile Form State
  const [name, setName] = useState(currentUser?.name || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');
  const [isProfileSubmitting, setIsProfileSubmitting] = useState(false);

  // Password Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isPasswordSubmitting, setIsPasswordSubmitting] = useState(false);

  useEffect(() => {
    if (currentUser) {
      setName(currentUser.name || '');
      setEmail(currentUser.email || '');
      setPhone(currentUser.phone || '');
    }
  }, [currentUser]);

  if (!isOpen) return null;

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileError('');
    setProfileSuccess('');
    setIsProfileSubmitting(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name, email, phone }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setProfileSuccess('✅ Profile updated successfully!');
        if (onUserUpdated) {
          onUserUpdated(data.user, data.token);
        }
        setTimeout(() => setProfileSuccess(''), 3000);
      } else {
        setProfileError(data.error || 'Failed to update profile.');
      }
    } catch {
      setProfileError('Failed to reach backend server. Please try again.');
    } finally {
      setIsProfileSubmitting(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirmation do not match.');
      return;
    }

    setIsPasswordSubmitting(true);

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
        setPasswordSuccess('✅ Your password has been changed successfully!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => setPasswordSuccess(''), 4000);
      } else {
        setPasswordError(data.error || 'Failed to change password.');
      }
    } catch {
      setPasswordError('Failed to reach backend server. Please try again.');
    } finally {
      setIsPasswordSubmitting(false);
    }
  };

  const getRoleBadge = (r) => {
    switch (r) {
      case 'admin':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'manager':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'receptionist':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
      <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 text-slate-800 shadow-2xl space-y-4">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-800 font-bold font-mono text-sm">
              {currentUser?.username?.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">
                Staff Profile & Security
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Manage your administrative identity and login credentials
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
          >
            ✕
          </button>
        </div>

        {/* User Quick Info Chip */}
        <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50/70 p-3 text-xs">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
              Signed in as
            </span>
            <span className="font-mono font-bold text-slate-800">{currentUser?.username}</span>
          </div>
          <div>
            <span
              className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border uppercase tracking-wider ${getRoleBadge(
                currentUser?.role
              )}`}
            >
              {currentUser?.role}
            </span>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-200">
          <button
            onClick={() => setActiveTab('profile')}
            className={`pb-2.5 px-4 text-xs font-bold transition border-b-2 flex items-center gap-1.5 ${
              activeTab === 'profile'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>👤</span>
            <span>Edit Profile</span>
          </button>
          <button
            onClick={() => setActiveTab('password')}
            className={`pb-2.5 px-4 text-xs font-bold transition border-b-2 flex items-center gap-1.5 ${
              activeTab === 'password'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>🔑</span>
            <span>Password Reset</span>
          </button>
        </div>

        {/* TAB 1: EDIT PROFILE */}
        {activeTab === 'profile' && (
          <form onSubmit={handleUpdateProfile} className="space-y-3.5 text-xs">
            {profileSuccess && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-2.5 text-emerald-800 font-bold">
                {profileSuccess}
              </div>
            )}
            {profileError && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-2.5 text-rose-700 font-bold">
                {profileError}
              </div>
            )}

            <div>
              <label className="block text-slate-700 font-bold mb-1">Full Display Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-slate-900 outline-none focus:border-blue-500 focus:bg-white transition"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Official Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-slate-900 outline-none focus:border-blue-500 focus:bg-white transition"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Contact Phone Number</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98450 XXXXX"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-slate-900 outline-none focus:border-blue-500 focus:bg-white transition"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-slate-200 px-4 py-2 font-semibold text-slate-600 hover:bg-slate-50 transition"
              >
                Close
              </button>
              <button
                type="submit"
                disabled={isProfileSubmitting}
                className="rounded-xl bg-blue-600 px-5 py-2 font-bold text-white hover:bg-blue-700 transition disabled:opacity-50 shadow-xs"
              >
                {isProfileSubmitting ? 'Saving...' : 'Save Profile Changes'}
              </button>
            </div>
          </form>
        )}

        {/* TAB 2: PASSWORD RESET FACILITY */}
        {activeTab === 'password' && (
          <form onSubmit={handleChangePassword} className="space-y-3.5 text-xs">
            {passwordSuccess && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-2.5 text-emerald-800 font-bold">
                {passwordSuccess}
              </div>
            )}
            {passwordError && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-2.5 text-rose-700 font-bold">
                {passwordError}
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
                  placeholder="Enter your current password"
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
                New Password (minimum 6 characters)
              </label>
              <div className="relative">
                <input
                  type={showNew ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                  placeholder="Create new strong password"
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

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-slate-200 px-4 py-2 font-semibold text-slate-600 hover:bg-slate-50 transition"
              >
                Close
              </button>
              <button
                type="submit"
                disabled={isPasswordSubmitting}
                className="rounded-xl bg-blue-600 px-5 py-2 font-bold text-white hover:bg-blue-700 transition disabled:opacity-50 shadow-xs"
              >
                {isPasswordSubmitting ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
