import { useState, useEffect, useCallback } from 'react';
import { API_BASE_URL } from '../config';

export default function CancellationsRefunds({ token, bookings, onRefreshBookings }) {
  const [refunds, setRefunds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form state
  const [selectedBookingId, setSelectedBookingId] = useState('');
  const [refundAmount, setRefundAmount] = useState('');
  const [reason, setReason] = useState('');
  const [refundMethod, setRefundMethod] = useState('Cash Counter Settlement');
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchRefunds = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/refunds`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setRefunds(data.refunds || []);
      }
    } catch (err) {
      console.error('Failed to fetch refunds:', err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchRefunds();
  }, [fetchRefunds]);

  const activeCancellableBookings = bookings.filter((b) => b.status !== 'Cancelled');

  const handleBookingSelect = (id) => {
    setSelectedBookingId(id);
    const b = bookings.find((item) => item.id === id);
    if (b) {
      setRefundAmount(String(b.amount || 0));
    }
  };

  const handleProcessRefund = async (e) => {
    e.preventDefault();
    setSubmitError('');
    if (!selectedBookingId) {
      setSubmitError('Please select a booking to cancel.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/refunds`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          bookingId: selectedBookingId,
          refundAmount: Number(refundAmount),
          reason,
          refundMethod,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setIsModalOpen(false);
        setSelectedBookingId('');
        setReason('');
        fetchRefunds();
        onRefreshBookings();
      } else {
        setSubmitError(data.error || 'Failed to process cancellation.');
      }
    } catch {
      setSubmitError('Server connection error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">🔄</span>
            <span className="text-xs font-bold uppercase tracking-wider text-rose-400">
              Cancellations & Adjustments
            </span>
          </div>
          <h2 className="text-2xl font-bold text-white mt-1">
            Booking Cancellations & Refunds
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Process reservation cancellations and manage refund disbursements
          </p>
        </div>

        <button
          onClick={() => {
            setIsModalOpen(true);
            setSubmitError('');
          }}
          className="rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 px-4 py-2.5 text-xs font-bold text-white shadow-lg hover:from-rose-500 hover:to-rose-600 transition flex items-center gap-2"
        >
          <span>✕</span>
          <span>Initiate Cancellation / Refund</span>
        </button>
      </div>

      {/* Refunds History Table */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-white">Cancellation & Refund Ledger</h3>
            <span className="rounded-full bg-slate-800 px-2.5 py-0.5 text-xs font-semibold text-slate-300">
              {refunds.length} Recorded
            </span>
          </div>
          <button
            onClick={fetchRefunds}
            className="text-xs text-slate-400 hover:text-white"
          >
            🔄 Refresh
          </button>
        </div>

        {refunds.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-800 p-12 text-center text-slate-500 text-xs">
            No cancellation or refund records have been logged yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 text-slate-400 font-semibold">
                <tr>
                  <th className="pb-3">Refund Ref</th>
                  <th className="pb-3">Booking ID</th>
                  <th className="pb-3">Guest Name</th>
                  <th className="pb-3">Reason</th>
                  <th className="pb-3">Disbursement Method</th>
                  <th className="pb-3">Original</th>
                  <th className="pb-3">Refunded</th>
                  <th className="pb-3">Processed By</th>
                  <th className="pb-3 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {refunds.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 font-mono font-bold text-rose-400">{r.id}</td>
                    <td className="py-3 font-mono text-slate-300">{r.bookingId}</td>
                    <td className="py-3 text-white font-semibold">{r.guestName}</td>
                    <td className="py-3 text-slate-300 max-w-xs truncate">{r.reason}</td>
                    <td className="py-3 text-slate-300">{r.refundMethod}</td>
                    <td className="py-3 text-slate-400">₹{(r.amount || 0).toLocaleString('en-IN')}</td>
                    <td className="py-3 font-bold text-emerald-400">
                      ₹{(r.refundAmount || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 text-slate-400 font-mono text-[11px]">{r.processedBy}</td>
                    <td className="py-3 text-right text-slate-500 text-[11px]">
                      {new Date(r.createdAt).toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Cancellation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900 p-6 text-white shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>⚠️</span>
                  <span>Cancel Reservation & Process Refund</span>
                </h3>
                <p className="text-xs text-slate-400">This action updates booking status to Cancelled</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-full p-2 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleProcessRefund} className="space-y-3.5 text-xs">
              {submitError && (
                <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-rose-300">
                  {submitError}
                </div>
              )}

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Select Active Reservation
                </label>
                <select
                  value={selectedBookingId}
                  onChange={(e) => handleBookingSelect(e.target.value)}
                  required
                  className="w-full rounded-2xl border border-slate-800 bg-slate-950 p-2.5 text-white outline-none focus:border-blue-500"
                >
                  <option value="">-- Choose Reservation --</option>
                  {activeCancellableBookings.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.id} — {b.name} ({b.roomType}) [₹{b.amount}]
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Refund Amount (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(e.target.value)}
                  required
                  className="w-full rounded-2xl border border-slate-800 bg-slate-950 p-2.5 text-white font-bold outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Refund Method
                </label>
                <select
                  value={refundMethod}
                  onChange={(e) => setRefundMethod(e.target.value)}
                  className="w-full rounded-2xl border border-slate-800 bg-slate-950 p-2.5 text-white outline-none focus:border-blue-500"
                >
                  <option value="Cash Counter Settlement">Cash Counter Settlement</option>
                  <option value="Online Razorpay Reversal">Online Razorpay Reversal</option>
                  <option value="Policy Retention (No Refund)">Policy Retention (No Refund)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Reason for Cancellation
                </label>
                <textarea
                  rows="2"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. Guest travel emergency, double reservation, or medical reason..."
                  required
                  className="w-full rounded-2xl border border-slate-800 bg-slate-950 p-2.5 text-white placeholder-slate-500 outline-none focus:border-blue-500"
                ></textarea>
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
                  className="rounded-xl bg-rose-600 px-4 py-2 font-bold text-white hover:bg-rose-500 transition disabled:opacity-50"
                >
                  {isSubmitting ? 'Processing...' : 'Confirm Cancellation & Refund'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
