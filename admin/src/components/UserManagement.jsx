import { useState, useEffect, useCallback } from 'react';
import { API_BASE_URL } from '../config';

export default function UserManagement({ token, currentUser }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form state
  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('receptionist');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      }
    } catch (err) {
      console.error('Failed to fetch users:', err);
    } finally {
      setLoading(false);
    }
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
        setIsModalOpen(false);
        setUsername('');
        setName('');
        setPassword('');
        setEmail('');
        setPhone('');
        fetchUsers();
      } else {
        setErrorMsg(data.error || 'Failed to create user account.');
      }
    } catch {
      setErrorMsg('Failed to reach backend server.');
    } finally {
      setIsSubmitting(false);
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
            Configure administrative accounts, role-based privileges, and security credentials
          </p>
        </div>

        {currentUser?.role === 'admin' && (
          <button
            onClick={() => {
              setIsModalOpen(true);
              setErrorMsg('');
            }}
            className="rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-500/20 hover:bg-blue-700 transition flex items-center gap-2"
          >
            <span>➕</span>
            <span>Add Staff Account</span>
          </button>
        )}
      </div>

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
                  <th className="py-3 px-4 text-right">Created</th>
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
                      <span className="inline-flex items-center gap-1.5 text-[11px] text-emerald-700 font-bold">
                        <span className="h-2 w-2 rounded-full bg-emerald-600"></span> Active
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right text-slate-500 text-[11px] whitespace-nowrap">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
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
              <li>Manage staff users & roles</li>
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

      {/* Create User Modal */}
      {isModalOpen && (
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
                onClick={() => setIsModalOpen(false)}
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
                  placeholder="Set initial password"
                  required
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
                  onClick={() => setIsModalOpen(false)}
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
    </div>
  );
}
