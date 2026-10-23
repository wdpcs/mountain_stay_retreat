import { useState, useEffect } from 'react';
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

  const fetchUsers = async () => {
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
  };

  useEffect(() => {
    fetchUsers();
  }, [token]);

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
        return 'bg-rose-500/10 text-rose-300 border-rose-500/20';
      case 'manager':
        return 'bg-blue-500/10 text-blue-300 border-blue-500/20';
      case 'receptionist':
        return 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20';
      default:
        return 'bg-slate-800 text-slate-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">🛡️</span>
            <span className="text-xs font-bold uppercase tracking-wider text-blue-400">
              Access Control & RBAC
            </span>
          </div>
          <h2 className="text-2xl font-bold text-white mt-1">
            Staff & Role Management
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Configure administrative accounts, role-based privileges, and security credentials
          </p>
        </div>

        {currentUser?.role === 'admin' && (
          <button
            onClick={() => {
              setIsModalOpen(true);
              setErrorMsg('');
            }}
            className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-blue-600/20 hover:from-blue-500 hover:to-indigo-500 transition flex items-center gap-2"
          >
            <span>➕</span>
            <span>Add Staff Account</span>
          </button>
        )}
      </div>

      {/* Users Table */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-white">Authorized Personnel</h3>
          <span className="rounded-full bg-slate-800 px-2.5 py-0.5 text-xs font-semibold text-slate-300">
            {users.length} Active Accounts
          </span>
        </div>

        {loading ? (
          <div className="flex h-32 items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 text-slate-400 font-semibold">
                <tr>
                  <th className="pb-3">User ID</th>
                  <th className="pb-3">Name</th>
                  <th className="pb-3">Username</th>
                  <th className="pb-3">Assigned Role</th>
                  <th className="pb-3">Contact Email</th>
                  <th className="pb-3">Phone</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 text-right">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 font-mono font-bold text-blue-400">{u.id}</td>
                    <td className="py-3 text-white font-semibold">
                      {u.name}
                      {u.id === currentUser?.id && (
                        <span className="ml-2 text-[10px] text-blue-400 font-mono">(You)</span>
                      )}
                    </td>
                    <td className="py-3 font-mono text-slate-300">{u.username}</td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold border uppercase tracking-wider ${getRoleBadge(u.role)}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 text-slate-300">{u.email}</td>
                    <td className="py-3 text-slate-300">{u.phone || 'N/A'}</td>
                    <td className="py-3">
                      <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-semibold">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span> Active
                      </span>
                    </td>
                    <td className="py-3 text-right text-slate-500 text-[11px]">
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
      <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl">
        <h3 className="text-base font-bold text-white mb-3">Role-Based Access Control (RBAC) Matrix</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-4 space-y-2">
            <div className="font-bold text-rose-300 text-sm">Super Admin</div>
            <p className="text-slate-400 text-[11px]">Full system authority</p>
            <ul className="text-slate-300 space-y-1 list-disc list-inside">
              <li>Manage staff users & roles</li>
              <li>Global system settings & credentials</li>
              <li>Delete reservations & audit purge</li>
              <li>Price & maintenance control</li>
            </ul>
          </div>

          <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-4 space-y-2">
            <div className="font-bold text-blue-300 text-sm">Property Manager</div>
            <p className="text-slate-400 text-[11px]">Operations & revenue oversight</p>
            <ul className="text-slate-300 space-y-1 list-disc list-inside">
              <li>Adjust room & dorm tariffs</li>
              <li>Toggle room maintenance blocks</li>
              <li>Process cancellations & refunds</li>
              <li>Export CSV reports & reconcile payments</li>
            </ul>
          </div>

          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 space-y-2">
            <div className="font-bold text-emerald-300 text-sm">Front Desk Receptionist</div>
            <p className="text-slate-400 text-[11px]">Day-to-day front desk duties</p>
            <ul className="text-slate-300 space-y-1 list-disc list-inside">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900 p-6 text-white shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>➕</span>
                  <span>Add Administrative Account</span>
                </h3>
                <p className="text-xs text-slate-400">Grant portal access to staff member</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-full p-2 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-3 text-xs">
              {errorMsg && (
                <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-rose-300">
                  {errorMsg}
                </div>
              )}

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Rajesh Kumar"
                  required
                  className="w-full rounded-2xl border border-slate-800 bg-slate-950 p-2.5 text-white outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. rajesh"
                  required
                  className="w-full rounded-2xl border border-slate-800 bg-slate-950 p-2.5 text-white outline-none focus:border-blue-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Assigned Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full rounded-2xl border border-slate-800 bg-slate-950 p-2.5 text-white outline-none focus:border-blue-500"
                >
                  <option value="receptionist">Front Desk Receptionist</option>
                  <option value="manager">Property Manager</option>
                  <option value="admin">Super Administrator</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Initial Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Set initial password"
                  required
                  className="w-full rounded-2xl border border-slate-800 bg-slate-950 p-2.5 text-white outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Staff Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="rajesh@wdpcs.in"
                  className="w-full rounded-2xl border border-slate-800 bg-slate-950 p-2.5 text-white outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98450 XXXXX"
                  className="w-full rounded-2xl border border-slate-800 bg-slate-950 p-2.5 text-white outline-none focus:border-blue-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-slate-700 px-4 py-2 font-semibold text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-xl bg-blue-600 px-4 py-2 font-bold text-white hover:bg-blue-500 transition disabled:opacity-50"
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
