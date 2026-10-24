import { useState } from 'react';
import { API_BASE_URL } from '../config';

export default function WalkInBookingModal({ isOpen, onClose, token, prices, onBookingCreated }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [roomType, setRoomType] = useState('Suite Room (₹2,500/night)');
  const [paymentMethod, setPaymentMethod] = useState('Cash at Counter');
  const [status, setStatus] = useState('Paid at Counter');
  const [notes, setNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const currentPrice = roomType.includes('Dormitory')
    ? (prices?.dormPrice || 450)
    : (prices?.suitePrice || 2500);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setIsSubmitting(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/bookings/walkin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim() || `${phone.replace(/\D/g, '')}@walkin.wdpcs.in`,
          date,
          roomType,
          paymentMethod,
          status,
          notes: notes.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        onBookingCreated();
        onClose();
      } else {
        setErrorMsg(data.error || 'Failed to register walk-in booking.');
      }
    } catch {
      setErrorMsg('Failed to connect to the server.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
      <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 text-slate-900 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">
              Front Desk Reception
            </span>
            <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <span>🛎️</span>
              <span>New Walk-in Reservation</span>
            </h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          {errorMsg && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-rose-800 font-semibold">
              {errorMsg}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Guest Full Name *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Guest name"
                required
                className="w-full rounded-2xl border border-slate-300 bg-white p-2.5 text-slate-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 font-medium"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Contact Phone *</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98450 12345"
                required
                className="w-full rounded-2xl border border-slate-300 bg-white p-2.5 text-slate-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 font-medium"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="guest@example.com (optional)"
                className="w-full rounded-2xl border border-slate-300 bg-white p-2.5 text-slate-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 font-medium"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Check-in Date *</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full rounded-2xl border border-slate-300 bg-white p-2 text-slate-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 font-medium"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Accommodation Type</label>
              <select
                value={roomType}
                onChange={(e) => setRoomType(e.target.value)}
                className="w-full rounded-2xl border border-slate-300 bg-white p-2.5 text-slate-900 outline-none focus:border-blue-600 font-medium"
              >
                <option value="Suite Room (₹2,500/night)">Suite Room (₹{prices?.suitePrice || 2500}/night)</option>
                <option value="Dormitory Bed (₹450/night)">Dormitory Bed (₹{prices?.dormPrice || 450}/night)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Total Due</label>
              <div className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-2.5 text-emerald-700 font-extrabold text-sm">
                ₹{currentPrice.toLocaleString('en-IN')}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Payment Method</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full rounded-2xl border border-slate-300 bg-white p-2.5 text-slate-900 outline-none focus:border-blue-600 font-medium"
              >
                <option value="Cash at Counter">Cash at Counter</option>
                <option value="UPI / QR Code at Desk">UPI / QR Code at Desk</option>
                <option value="Card POS Machine">Card POS Machine</option>
                <option value="Pay at Counter / Property">Pay at Counter / Later</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Initial Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full rounded-2xl border border-slate-300 bg-white p-2.5 text-slate-900 outline-none focus:border-blue-600 font-medium"
              >
                <option value="Paid at Counter">Paid at Counter</option>
                <option value="Checked In">Checked In (Key Handed Over)</option>
                <option value="Pending at Check-in">Pending at Check-in</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1">Receptionist Notes</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Police society member discount applied, extra bedding provided..."
              className="w-full rounded-2xl border border-slate-300 bg-white p-2.5 text-slate-900 placeholder-slate-400 outline-none focus:border-blue-600 font-medium"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-300 px-4 py-2 font-bold text-slate-700 hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl bg-blue-600 px-5 py-2 font-bold text-white shadow-md shadow-blue-500/20 hover:bg-blue-700 transition disabled:opacity-50"
            >
              {isSubmitting ? 'Registering...' : 'Confirm Walk-In Booking'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
