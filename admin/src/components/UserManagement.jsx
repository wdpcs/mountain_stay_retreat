import { useState, useEffect, useCallback } from 'react';
import { API_BASE_URL } from '../config';
import UserProfileModal from './UserProfileModal';

export default function UserManagement({ token, currentUser, onUserUpdated }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSelfProfileOpen, setIsSelfProfileOpen] = useState(false);

  // Add User Form State
  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('receptionist');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit Staff User Modal State
  const [editingUser, setEditingUser] = useState(null);
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState('receptionist');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editActive, setEditActive] = useState(true);
  const [editError, setEditError] = useState('');
  const [isEditSubmitting, setIsEditSubmitting] = useState(false);

  // Reset Staff Password Modal State
  const [resettingUser, setResettingUser] = useState(null);
  const [adminNewPassword, setAdminNewPassword] = useState('');
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [resetPasswordError, setResetPasswordError] = useState('');
  const [isResetSubmitting, setIsResetSubmitting] = useState(false);

  // Status message
  const [actionNotice, setActionNotice] = useState('');

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.users && data.users.length > 0) {
          setUsers(data.users);
          setLoading(false);
          return;
        }
      }
    } catch {
      // Fallback below
    }

    try {
      const saved = localStorage.getItem('wdpcs_staff_users');
      if (saved) {
        setUsers(JSON.parse(saved));
        setLoading(false);
        return;
      }
    } catch {
      // Use standard default staff
    }

    setUsers([
      {
        id: 'USR-001',
        username: 'admin',
        name: 'Chief Security Officer',
        role: 'admin',
        email: 'admin@wdpcs.in',
        phone: '+91 70250 17611',
        active: true,
        createdAt: '2026-01-01T00:00:00.000Z',
      },
      {
        id: 'USR-002',
        username: 'manager',
        name: 'Operations Manager',
        role: 'manager',
        email: 'manager@wdpcs.in',
        phone: '+91 83019 95940',
        active: true,
        createdAt: '2026-01-01T00:00:00.000Z',
      },
      {
        id: 'USR-003',
        username: 'receptionist',
        name: 'Duty Receptionist',
        role: 'receptionist',
        email: 'reception@wdpcs.in',
        phone: '+91 70250 17611',
        active: true,
        createdAt: '2026-01-01T00:00:00.000Z',
      },
    ]);
    setLoading(false);
  }, [token]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setIsSubmitting(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          username,
          name,
          role,
          password,
          email,
          phone,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setIsAddModalOpen(false);
        setUsername('');
        setName('');
        setPassword('');
        setEmail('');
        setPhone('');
        setActionNotice(`✅ Staff account ${data.user.username} created successfully.`);
        fetchUsers();
        setTimeout(() => setActionNotice(''), 4000);
      } else {
        setErrorMsg(data.error || 'Failed to create user account.');
      }
    } catch {
      setErrorMsg('Failed to reach backend server.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditModal = (user) => {
    setEditingUser(user);
    setEditName(user.name || '');
    setEditRole(user.role || 'receptionist');
    setEditEmail(user.email || '');
    setEditPhone(user.phone || '');
    setEditActive(user.active !== false);
    setEditError('');
  };

  const handleUpdateStaffUser = async (e) => {
    e.preventDefault();
    if (!editingUser) return;
    setEditError('');
    setIsEditSubmitting(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/users/${editingUser.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: editName,
          role: editRole,
          email: editEmail,
          phone: editPhone,
          active: editActive,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setEditingUser(null);
        setActionNotice(`✅ Staff profile for ${editingUser.username} updated.`);
        fetchUsers();
        if (editingUser.id === currentUser?.id && onUserUpdated) {
          onUserUpdated(data.user);
        }
        setTimeout(() => setActionNotice(''), 4000);
      } else {
        setEditError(data.error || 'Failed to update staff user.');
      }
    } catch {
      setEditError('Server connection error. Please try again.');
    } finally {
      setIsEditSubmitting(false);
    }
  };

  const openResetModal = (user) => {
    setResettingUser(user);
    setAdminNewPassword('');
    setShowAdminPassword(false);
    setResetPasswordError('');
  };

  const handleAdminResetPassword = async (e) => {
    e.preventDefault();
    if (!resettingUser) return;
    setResetPasswordError('');

    if (adminNewPassword.length < 6) {
      setResetPasswordError('Password must be at least 6 characters long.');
      return;
    }

    setIsResetSubmitting(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/users/${resettingUser.id}/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ newPassword: adminNewPassword }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setResettingUser(null);
        setActionNotice(`✅ Password for ${resettingUser.username} was reset successfully.`);
        setTimeout(() => setActionNotice(''), 4000);
      } else {
        setResetPasswordError(data.error || 'Failed to reset staff password.');
      }
    } catch {
      setResetPasswordError('Server connection error. Please try again.');
    } finally {
      setIsResetSubmitting(false);
    }
  };

  const handleDeleteUser = async (user) => {
    if (user.id === currentUser?.id) {
      alert('You cannot delete your own active administrator account.');
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to remove the staff account for "${user.name}" (${user.username})?`
    );
    if (!confirmed) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/users/${user.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setActionNotice(`✅ Staff account ${user.username} has been removed.`);
        fetchUsers();
        setTimeout(() => setActionNotice(''), 4000);
      } else {
        alert(data.error || 'Failed to remove staff account.');
      }
    } catch {
      alert('Server connection error. Please try again.');
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

  const isSuperAdmin = currentUser?.role === 'admin';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-3xl border border-blue-200/80 bg-gradient-to-r from-blue-50 via-indigo-50/40 to-white p-6 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">🛡️</span>
            <span className="text-xs font-bold uppercase tracking-wider text-blue-700">
              Access Control & RBAC
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
            Staff & Role Management
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 font-medium mt-0.5">
            Configure administrative accounts, role-based privileges, and password reset facilities
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setIsSelfProfileOpen(true)}
            className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition flex items-center gap-1.5 shadow-2xs"
          >
            <span>👤</span>
            <span>My Profile & Password</span>
          </button>

          {isSuperAdmin && (
            <button
              onClick={() => {
                setIsAddModalOpen(true);
                setErrorMsg('');
              }}
              className="rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-500/20 hover:bg-blue-700 transition flex items-center gap-2"
            >
              <span>➕</span>
              <span>Add Staff Account</span>
            </button>
          )}
        </div>
      </div>

      {/* Global Action Banner */}
      {actionNotice && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-bold text-emerald-800 flex items-center justify-between shadow-xs">
          <span>{actionNotice}</span>
          <button onClick={() => setActionNotice('')} className="text-slate-400 hover:text-slate-700">
            ✕
          </button>
        </div>
      )}

      {/* Users Table */}
      <div className="rounded-3xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <h3 className="text-base font-bold text-slate-900">Authorized Personnel</h3>
          <span className="rounded-full bg-blue-50 border border-blue-200 px-3 py-0.5 text-xs font-bold text-blue-700">
            {users.length} Active Accounts
          </span>
        </div>

        {loading ? (
          <div className="flex h-32 items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-3 border-blue-600 border-t-transparent"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50/70 text-slate-600 font-bold">
                <tr>
                  <th className="py-3 px-4">User ID</th>
                  <th className="py-3 px-4">Name</th>
                  <th className="py-3 px-4">Username</th>
                  <th className="py-3 px-4">Assigned Role</th>
                  <th className="py-3 px-4">Contact Email</th>
                  <th className="py-3 px-4">Phone</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Created</th>
                  {isSuperAdmin && <th className="py-3 px-4 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 font-mono font-bold text-blue-600">{u.id}</td>
                    <td className="py-3 px-4 text-slate-900 font-bold">
                      {u.name}
                      {u.id === currentUser?.id && (
                        <span className="ml-2 text-[10px] text-blue-600 font-mono">(You)</span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-700">{u.username}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border uppercase tracking-wider ${getRoleBadge(
                          u.role
                        )}`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600">{u.email}</td>
                    <td className="py-3 px-4 text-slate-600">{u.phone || 'N/A'}</td>
                    <td className="py-3 px-4">
                      {u.active !== false ? (
                        <span className="inline-flex items-center gap-1.5 text-[11px] text-emerald-700 font-bold">
                          <span className="h-2 w-2 rounded-full bg-emerald-600"></span> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-[11px] text-rose-700 font-bold">
                          <span className="h-2 w-2 rounded-full bg-rose-600"></span> Inactive
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-500 text-[11px] whitespace-nowrap">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    {isSuperAdmin && (
                      <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                        <button
                          onClick={() => openEditModal(u)}
                          title="Edit Staff Profile & Role"
                          className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-700 hover:bg-slate-100 hover:text-blue-600 transition shadow-2xs"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => openResetModal(u)}
                          title="Reset Staff Password"
                          className="rounded-lg border border-amber-200 bg-amber-50 p-1.5 text-amber-700 hover:bg-amber-100 transition shadow-2xs"
                        >
                          🔑
                        </button>
                        {u.id !== currentUser?.id && (
                          <button
                            onClick={() => handleDeleteUser(u)}
                            title="Delete Staff Account"
                            className="rounded-lg border border-rose-200 bg-rose-50 p-1.5 text-rose-700 hover:bg-rose-100 transition shadow-2xs"
                          >
                            🗑️
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Role Matrix */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-3">
        <h3 className="text-base font-bold text-slate-900">
          Role-Based Access Control (RBAC) Matrix
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="rounded-2xl border border-rose-200 bg-rose-50/40 p-4 space-y-2">
            <div className="font-extrabold text-rose-800 text-sm">Super Admin</div>
            <p className="text-slate-600 text-[11px] font-medium">Full system authority</p>
            <ul className="text-slate-700 space-y-1 list-disc list-inside font-medium leading-relaxed">
              <li>Manage staff users, passwords & roles</li>
              <li>Global system settings & credentials</li>
              <li>Delete reservations & audit purge</li>
              <li>Price & maintenance control</li>
            </ul>
          </div>

          <div className="rounded-2xl border border-blue-200 bg-blue-50/40 p-4 space-y-2">
            <div className="font-extrabold text-blue-800 text-sm">Property Manager</div>
            <p className="text-slate-600 text-[11px] font-medium">Operations & revenue oversight</p>
            <ul className="text-slate-700 space-y-1 list-disc list-inside font-medium leading-relaxed">
              <li>Adjust room & dorm tariffs</li>
              <li>Toggle room maintenance blocks</li>
              <li>Process cancellations & refunds</li>
              <li>Export CSV reports & reconcile payments</li>
            </ul>
          </div>

          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-4 space-y-2">
            <div className="font-extrabold text-emerald-800 text-sm">Front Desk Receptionist</div>
            <p className="text-slate-600 text-[11px] font-medium">Day-to-day front desk duties</p>
            <ul className="text-slate-700 space-y-1 list-disc list-inside font-medium leading-relaxed">
              <li>Guest check-ins & check-outs</li>
              <li>Create walk-in counter bookings</li>
              <li>Print guest folios & vouchers</li>
              <li>View availability calendar & manifest</li>
            </ul>
          </div>
        </div>
      </div>

      {/* MODAL 1: ADD STAFF ACCOUNT */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 text-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <span>➕</span>
                  <span>Add Administrative Account</span>
                </h3>
                <p className="text-xs text-slate-500">Grant portal access to staff member</p>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-3 text-xs">
              {errorMsg && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-rose-700 font-medium">
                  {errorMsg}
                </div>
              )}

              <div>
                <label className="block text-slate-700 font-bold mb-1">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Rajesh Kumar"
                  required
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-slate-900 outline-none focus:border-blue-500 focus:bg-white transition"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. rajesh"
                  required
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-slate-900 outline-none focus:border-blue-500 focus:bg-white font-mono transition"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Assigned Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-slate-900 outline-none focus:border-blue-500 focus:bg-white transition"
                >
                  <option value="receptionist">Front Desk Receptionist</option>
                  <option value="manager">Property Manager</option>
                  <option value="admin">Super Administrator</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Initial Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Set initial password (min 6 chars)"
                  required
                  minLength={6}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-slate-900 outline-none focus:border-blue-500 focus:bg-white transition"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Staff Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="rajesh@wdpcs.in"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-slate-900 outline-none focus:border-blue-500 focus:bg-white transition"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Phone Number</label>
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
                  onClick={() => setIsAddModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 font-semibold text-slate-600 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-xl bg-blue-600 px-4 py-2 font-bold text-white hover:bg-blue-700 transition disabled:opacity-50 shadow-xs"
                >
                  {isSubmitting ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EDIT STAFF PROFILE & ROLE */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 text-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <span>✏️</span>
                  <span>Edit Staff Profile: {editingUser.username}</span>
                </h3>
                <p className="text-xs text-slate-500">Update staff details and access tier</p>
              </div>
              <button
                onClick={() => setEditingUser(null)}
                className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateStaffUser} className="space-y-3 text-xs">
              {editError && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-2.5 text-rose-700 font-bold">
                  {editError}
                </div>
              )}

              <div>
                <label className="block text-slate-700 font-bold mb-1">Full Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-slate-900 outline-none focus:border-blue-500 focus:bg-white transition"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Assigned Role</label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-slate-900 outline-none focus:border-blue-500 focus:bg-white transition"
                >
                  <option value="receptionist">Front Desk Receptionist</option>
                  <option value="manager">Property Manager</option>
                  <option value="admin">Super Administrator</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Email Address</label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  required
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-slate-900 outline-none focus:border-blue-500 focus:bg-white transition"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-slate-900 outline-none focus:border-blue-500 focus:bg-white transition"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Account Status</label>
                <select
                  value={editActive ? 'true' : 'false'}
                  onChange={(e) => setEditActive(e.target.value === 'true')}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-slate-900 outline-none focus:border-blue-500 focus:bg-white transition"
                >
                  <option value="true">Active (Access Granted)</option>
                  <option value="false">Suspended / Inactive</option>
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="rounded-xl border border-slate-200 px-4 py-2 font-semibold text-slate-600 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isEditSubmitting}
                  className="rounded-xl bg-blue-600 px-5 py-2 font-bold text-white hover:bg-blue-700 transition disabled:opacity-50 shadow-xs"
                >
                  {isEditSubmitting ? 'Saving...' : 'Save Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: ADMIN RESET STAFF PASSWORD */}
      {resettingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl border border-amber-200 bg-white p-6 text-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">🔑</span>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Reset Password for {resettingUser.username}
                  </h3>
                  <p className="text-xs text-slate-500">Provide a new password for this staff member</p>
                </div>
              </div>
              <button
                onClick={() => setResettingUser(null)}
                className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAdminResetPassword} className="space-y-3.5 text-xs">
              {resetPasswordError && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-2.5 text-rose-700 font-bold">
                  {resetPasswordError}
                </div>
              )}

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-slate-700 text-[11px]">
                Target Staff: <strong>{resettingUser.name}</strong> ({resettingUser.role})
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  New Password (minimum 6 characters)
                </label>
                <div className="relative">
                  <input
                    type={showAdminPassword ? 'text' : 'password'}
                    value={adminNewPassword}
                    onChange={(e) => setAdminNewPassword(e.target.value)}
                    required
                    minLength={6}
                    placeholder="Enter new password"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 pr-10 text-slate-900 font-mono text-xs outline-none focus:border-amber-500 focus:bg-white transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAdminPassword((p) => !p)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-700 text-xs"
                  >
                    {showAdminPassword ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setResettingUser(null)}
                  className="rounded-xl border border-slate-200 px-4 py-2 font-semibold text-slate-600 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isResetSubmitting || adminNewPassword.length < 6}
                  className="rounded-xl bg-amber-600 px-5 py-2 font-bold text-white hover:bg-amber-700 transition disabled:opacity-50 shadow-xs"
                >
                  {isResetSubmitting ? 'Updating...' : 'Set New Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SELF PROFILE & PASSWORD MODAL */}
      <UserProfileModal
        isOpen={isSelfProfileOpen}
        onClose={() => setIsSelfProfileOpen(false)}
        token={token}
        currentUser={currentUser}
        onUserUpdated={onUserUpdated}
      />
    </div>
  );
}
