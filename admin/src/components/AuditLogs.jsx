import { useState, useEffect, useMemo } from 'react';
import { API_BASE_URL } from '../config';

export default function AuditLogs({ token }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('All');

  const fetchLogs = async () => {
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
  };

  useEffect(() => {
    fetchLogs();
  }, [token]);

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
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  const getActionBadge = (act) => {
    if (act.includes('LOGIN')) return 'bg-blue-500/10 text-blue-300 border-blue-500/20';
    if (act.includes('DELETE')) return 'bg-rose-500/10 text-rose-300 border-rose-500/20';
    if (act.includes('UPDATE')) return 'bg-amber-500/10 text-amber-300 border-amber-500/20';
    if (act.includes('CREATE')) return 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20';
    if (act.includes('REFUND')) return 'bg-purple-500/10 text-purple-300 border-purple-500/20';
    return 'bg-slate-800 text-slate-300 border-slate-700';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">📜</span>
            <span className="text-xs font-bold uppercase tracking-wider text-blue-400">
              Security Compliance
            </span>
          </div>
          <h2 className="text-2xl font-bold text-white mt-1">
            System Audit Trail & Security Logs
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Tamper-evident chronological log of all administrative operations
          </p>
        </div>

        <button
          onClick={fetchLogs}
          className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-bold text-slate-200 hover:bg-slate-700 transition"
        >
          🔄 Refresh Log Stream
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-3xl border border-slate-800 bg-slate-900/80 p-4 shadow-xl">
        <div className="relative w-full sm:w-80">
          <span className="absolute left-3.5 top-2.5 text-xs text-slate-500">🔍</span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search logs by keyword, staff, or ID..."
            className="w-full rounded-2xl border border-slate-800 bg-slate-950 py-2 pl-9 pr-3 text-xs text-white placeholder-slate-500 outline-none focus:border-blue-500"
          />
        </div>

        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs font-semibold text-slate-300 outline-none focus:border-blue-500 w-full sm:w-auto"
        >
          <option value="All">All Operations ({logs.length})</option>
          {uniqueActions.map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
      </div>

      {/* Logs Table */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl">
        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-800 p-12 text-center text-slate-500 text-xs">
            No audit events found matching the criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 text-slate-400 font-semibold">
                <tr>
                  <th className="pb-3">Event Ref</th>
                  <th className="pb-3">Timestamp</th>
                  <th className="pb-3">Staff Member</th>
                  <th className="pb-3">Action</th>
                  <th className="pb-3">Target</th>
                  <th className="pb-3">Event Details</th>
                  <th className="pb-3 text-right">Source IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {filtered.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 font-mono font-bold text-blue-400">{log.id}</td>
                    <td className="py-3 text-slate-400 text-[11px]">
                      {new Date(log.timestamp).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3">
                      <div className="text-white font-semibold">{log.username}</div>
                      <div className="text-[10px] text-slate-400 uppercase font-mono">{log.role}</div>
                    </td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${getActionBadge(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 font-mono text-slate-300 text-[11px]">
                      {log.targetType}:{log.targetId}
                    </td>
                    <td className="py-3 text-slate-300 max-w-sm truncate" title={log.details}>
                      {log.details}
                    </td>
                    <td className="py-3 text-right font-mono text-slate-500 text-[11px]">
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
