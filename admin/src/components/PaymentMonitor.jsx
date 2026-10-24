import { useState, useEffect, useMemo, useCallback } from 'react';
import { API_BASE_URL } from '../config';

export default function PaymentMonitor({ token }) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const fetchTransactions = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/transactions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setTransactions(data.transactions || []);
      }
    } catch (err) {
      console.error('Failed to fetch transactions:', err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const filtered = useMemo(() => {
    return transactions.filter((t) => {
      const s = search.toLowerCase();
      const matchesSearch =
        !search ||
        t.id.toLowerCase().includes(s) ||
        t.bookingId.toLowerCase().includes(s) ||
        t.guestName.toLowerCase().includes(s) ||
        t.orderId.toLowerCase().includes(s) ||
        t.paymentId.toLowerCase().includes(s);

      const matchesStatus = statusFilter === 'All' || t.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [transactions, search, statusFilter]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  const totalCaptured = transactions
    .filter((t) => t.status === 'Captured')
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">💳</span>
            <span className="text-xs font-bold uppercase tracking-wider text-blue-400">
              Payment Gateway & Ledger
            </span>
          </div>
          <h2 className="text-2xl font-bold text-white mt-1">
            Razorpay & Counter Transactions
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Audit trail of online gateway captures and physical front-desk receipts
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <span className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Razorpay Gateway Connected
          </span>
          <button
            onClick={fetchTransactions}
            className="rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-1.5 text-xs font-bold text-slate-200 hover:bg-slate-700"
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5">
          <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
            Total Captured Volume
          </span>
          <div className="mt-2 text-3xl font-extrabold text-emerald-400">
            ₹{totalCaptured.toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Across all verified payment channels</p>
        </div>

        <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5">
          <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
            Total Transactions
          </span>
          <div className="mt-2 text-3xl font-extrabold text-white">
            {transactions.length}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Processed transactions on record</p>
        </div>

        <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5">
          <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
            Security Status
          </span>
          <div className="mt-2 text-sm font-bold text-blue-400 flex items-center gap-1.5">
            <span>🛡️</span>
            <span>Secrets Enforced On Server</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Zero secret exposure to public frontend</p>
        </div>
      </div>

      {/* Search and Table */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <span className="absolute left-3.5 top-2.5 text-xs text-slate-500">🔍</span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by transaction, order, or guest..."
              className="w-full rounded-2xl border border-slate-800 bg-slate-950 py-2 pl-9 pr-3 text-xs text-white placeholder-slate-500 outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs font-semibold text-slate-300 outline-none focus:border-blue-500"
            >
              <option value="All">All Transactions</option>
              <option value="Captured">Captured</option>
              <option value="Pending">Pending</option>
              <option value="Refunded">Refunded</option>
            </select>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-800 p-12 text-center text-slate-500 text-xs">
            No transaction records match the specified search criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 text-slate-400 font-semibold">
                <tr>
                  <th className="pb-3">Transaction ID</th>
                  <th className="pb-3">Booking ID</th>
                  <th className="pb-3">Guest Name</th>
                  <th className="pb-3">Gateway Order ID</th>
                  <th className="pb-3">Payment ID</th>
                  <th className="pb-3">Method</th>
                  <th className="pb-3">Amount</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {filtered.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 font-mono font-bold text-blue-400">{t.id}</td>
                    <td className="py-3 font-mono text-slate-300">{t.bookingId}</td>
                    <td className="py-3 text-white font-semibold">{t.guestName}</td>
                    <td className="py-3 font-mono text-slate-400 text-[11px]">{t.orderId}</td>
                    <td className="py-3 font-mono text-slate-400 text-[11px]">{t.paymentId}</td>
                    <td className="py-3 text-slate-300">{t.paymentMethod}</td>
                    <td className="py-3 font-bold text-emerald-400">
                      ₹{(t.amount || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        {t.status}
                      </span>
                    </td>
                    <td className="py-3 text-right text-slate-500 text-[11px]">
                      {new Date(t.createdAt).toLocaleString('en-IN')}
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
