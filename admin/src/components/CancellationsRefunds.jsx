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
        <div className="h-8 w-8 animate-spin rounded-full border-3 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-3xl border border-rose-200/80 bg-gradient-to-r from-rose-50 via-orange-50/30 to-white p-6 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">🔄</span>
            <span className="text-xs font-bold uppercase tracking-wider text-rose-700">
              Cancellations & Adjustments
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
            Booking Cancellations & Refunds
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 font-medium mt-0.5">
            Process reservation cancellations and manage refund disbursements
          </p>
        </div>

        <button
          onClick={() => {
            setIsModalOpen(true);
            setSubmitError('');
          }}
          className="rounded-xl bg-rose-600 px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-rose-700 transition flex items-center gap-2"
        >
          <span>✕</span>
          <span>Initiate Cancellation / Refund</span>
        </button>
      </div>

      {/* Refunds History Table */}
      <div className="rounded-3xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-900">Cancellation & Refund Ledger</h3>
            <span className="rounded-full bg-slate-100 border border-slate-200 px-2.5 py-0.5 text-xs font-bold text-slate-700">
              {refunds.length} Recorded
            </span>
          </div>
          <button
            onClick={fetchRefunds}
            className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1 transition"
          >
            🔄 Refresh
          </button>
        </div>

        {refunds.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs font-medium">
            No cancellation or refund records have been logged yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50/70 text-slate-600 font-bold">
                <tr>
                  <th className="py-3 px-4">Refund Ref</th>
                  <th className="py-3 px-4">Booking ID</th>
                  <th className="py-3 px-4">Guest Name</th>
                  <th className="py-3 px-4">Reason</th>
                  <th className="py-3 px-4">Disbursement Method</th>
                  <th className="py-3 px-4">Original</th>
                  <th className="py-3 px-4">Refunded</th>
                  <th className="py-3 px-4">Processed By</th>
                  <th className="py-3 px-4 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {refunds.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 font-mono font-bold text-rose-600">{r.id}</td>
                    <td className="py-3 px-4 font-mono text-slate-700">{r.bookingId}</td>
                    <td className="py-3 px-4 text-slate-900 font-bold">{r.guestName}</td>
                    <td className="py-3 px-4 text-slate-700 max-w-xs truncate" title={r.reason}>
                      {r.reason}
                    </td>
                    <td className="py-3 px-4 text-slate-700">{r.refundMethod}</td>
                    <td className="py-3 px-4 text-slate-500">
                      ₹{(r.amount || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4 font-bold text-emerald-700">
                      ₹{(r.refundAmount || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">{r.processedBy}</td>
                    <td className="py-3 px-4 text-right text-slate-500 text-[11px] whitespace-nowrap">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 text-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <span>⚠️</span>
                  <span>Cancel Reservation & Process Refund</span>
                </h3>
                <p className="text-xs text-slate-500">
                  This action updates booking status to Cancelled
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleProcessRefund} className="space-y-3.5 text-xs">
              {submitError && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-rose-700 font-medium">
                  {submitError}
                </div>
              )}

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Select Active Reservation
                </label>
                <select
                  value={selectedBookingId}
                  onChange={(e) => handleBookingSelect(e.target.value)}
                  required
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-slate-900 outline-none focus:border-blue-500 focus:bg-white transition"
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
                <label className="block text-slate-700 font-bold mb-1">Refund Amount (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(e.target.value)}
                  required
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-slate-900 font-bold outline-none focus:border-blue-500 focus:bg-white transition"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Refund Method</label>
                <select
                  value={refundMethod}
                  onChange={(e) => setRefundMethod(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-slate-900 outline-none focus:border-blue-500 focus:bg-white transition"
                >
                  <option value="Cash Counter Settlement">Cash Counter Settlement</option>
                  <option value="Online Razorpay Reversal">Online Razorpay Reversal</option>
                  <option value="Policy Retention (No Refund)">Policy Retention (No Refund)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Reason for Cancellation
                </label>
                <textarea
                  rows="2"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. Guest travel emergency, double reservation, or medical reason..."
                  required
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-slate-900 placeholder-slate-400 outline-none focus:border-blue-500 focus:bg-white transition"
                ></textarea>
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
                  className="rounded-xl bg-rose-600 px-4 py-2 font-bold text-white hover:bg-rose-700 transition disabled:opacity-50 shadow-xs"
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
