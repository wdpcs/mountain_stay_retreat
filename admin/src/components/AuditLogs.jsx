import { useState, useEffect, useMemo, useCallback } from 'react';
import { API_BASE_URL } from '../config';

export default function AuditLogs({ token }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('All');

  const fetchLogs = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/audit-logs`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setLogs(data.auditLogs || []);
      }
    } catch (err) {
      console.error('Failed to fetch audit logs:', err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const filtered = useMemo(() => {
    return logs.filter((l) => {
      const s = search.toLowerCase();
      const matchesSearch =
        !search ||
        l.id.toLowerCase().includes(s) ||
        l.username.toLowerCase().includes(s) ||
        l.details.toLowerCase().includes(s) ||
        l.action.toLowerCase().includes(s);

      const matchesAction = actionFilter === 'All' || l.action === actionFilter;

      return matchesSearch && matchesAction;
    });
  }, [logs, search, actionFilter]);

  const uniqueActions = useMemo(() => {
    const set = new Set(logs.map((l) => l.action));
    return Array.from(set);
  }, [logs]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-3 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  const getActionBadge = (act) => {
    if (act.includes('LOGIN')) return 'bg-blue-50 text-blue-700 border-blue-200';
    if (act.includes('DELETE')) return 'bg-rose-50 text-rose-700 border-rose-200';
    if (act.includes('UPDATE')) return 'bg-amber-50 text-amber-700 border-amber-200';
    if (act.includes('CREATE')) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (act.includes('REFUND')) return 'bg-purple-50 text-purple-700 border-purple-200';
    return 'bg-slate-100 text-slate-700 border-slate-200';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-3xl border border-blue-200/80 bg-gradient-to-r from-blue-50 via-indigo-50/40 to-white p-6 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">📜</span>
            <span className="text-xs font-bold uppercase tracking-wider text-blue-700">
              Security Compliance
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
            System Audit Trail & Security Logs
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 font-medium mt-0.5">
            Tamper-evident chronological log of all administrative operations
          </p>
        </div>

        <button
          onClick={fetchLogs}
          className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
        >
          🔄 Refresh Log Stream
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
        <div className="relative w-full sm:w-80">
          <span className="absolute left-3.5 top-2.5 text-xs text-slate-400">🔍</span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search logs by keyword, staff, or ID..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs text-slate-900 placeholder-slate-400 outline-none focus:border-blue-500 focus:bg-white transition"
          />
        </div>

        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-blue-500 focus:bg-white w-full sm:w-auto transition"
        >
          <option value="All">All Operations ({logs.length})</option>
          {uniqueActions.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
      </div>

      {/* Logs Table */}
      <div className="rounded-3xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs font-medium">
            No audit events found matching the criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50/70 text-slate-600 font-bold">
                <tr>
                  <th className="py-3 px-4">Event Ref</th>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Staff Member</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Target</th>
                  <th className="py-3 px-4">Event Details</th>
                  <th className="py-3 px-4 text-right">Source IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filtered.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 font-mono font-bold text-blue-600">{log.id}</td>
                    <td className="py-3 px-4 text-slate-500 text-[11px] whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-slate-900 font-bold">{log.username}</div>
                      <div className="text-[10px] text-slate-500 uppercase font-mono">{log.role}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border uppercase tracking-wider ${getActionBadge(
                          log.action
                        )}`}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-700 text-[11px] whitespace-nowrap">
                      {log.targetType}:{log.targetId}
                    </td>
                    <td className="py-3 px-4 text-slate-700 max-w-sm truncate" title={log.details}>
                      {log.details}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-500 text-[11px]">
                      {log.ip}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
