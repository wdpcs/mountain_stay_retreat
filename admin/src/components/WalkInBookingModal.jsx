import { useState } from 'react';
import { API_BASE_URL } from '../config';

export default function WalkInBookingModal({ isOpen, onClose, token, onBookingCreated, prices }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [roomType, setRoomType] = useState('Suite Room (₹2,500/night)');
  const [paymentMethod, setPaymentMethod] = useState('Cash at Counter');
  const [status, setStatus] = useState('Paid at Counter');
  const [notes, setNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const currentPrice = roomType.includes('Dormitory')
    ? prices?.dormPrice || 450
    : prices?.suitePrice || 2500;

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
          email: email.trim().toLowerCase(),
          phone: phone.trim(),
          date,
          roomType,
          amount: currentPrice,
          paymentMethod,
          status,
          notes,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        onBookingCreated(data.booking);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-3xl border border-slate-800 bg-slate-900 p-6 text-white shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <span className="text-[11px] font-bold text-blue-400 uppercase tracking-wider">
              Front Desk Reception
            </span>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <span>🛎️</span>
              <span>New Walk-in Reservation</span>
            </h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          {errorMsg && (
            <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-rose-300">
              {errorMsg}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Guest Full Name *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Guest name"
                required
                className="w-full rounded-2xl border border-slate-800 bg-slate-950 p-2.5 text-white outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Contact Phone *</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98450 12345"
                required
                className="w-full rounded-2xl border border-slate-800 bg-slate-950 p-2.5 text-white outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Email Address *</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="guest@example.com"
                required
                className="w-full rounded-2xl border border-slate-800 bg-slate-950 p-2.5 text-white outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Check-in Date *</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full rounded-2xl border border-slate-800 bg-slate-950 p-2 text-white outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Accommodation Type</label>
              <select
                value={roomType}
                onChange={(e) => setRoomType(e.target.value)}
                className="w-full rounded-2xl border border-slate-800 bg-slate-950 p-2.5 text-white outline-none focus:border-blue-500"
              >
                <option value="Suite Room (₹2,500/night)">Suite Room (₹{prices?.suitePrice || 2500}/night)</option>
                <option value="Dormitory Bed (₹450/night)">Dormitory Bed (₹{prices?.dormPrice || 450}/night)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Total Due</label>
              <div className="w-full rounded-2xl border border-slate-800 bg-slate-950 p-2.5 text-emerald-400 font-extrabold text-sm">
                ₹{currentPrice.toLocaleString('en-IN')}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Payment Method</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full rounded-2xl border border-slate-800 bg-slate-950 p-2.5 text-white outline-none focus:border-blue-500"
              >
                <option value="Cash at Counter">Cash at Counter</option>
                <option value="UPI / QR Code at Desk">UPI / QR Code at Desk</option>
                <option value="Card POS Machine">Card POS Machine</option>
                <option value="Pay at Counter / Property">Pay at Counter / Later</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Initial Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full rounded-2xl border border-slate-800 bg-slate-950 p-2.5 text-white outline-none focus:border-blue-500"
              >
                <option value="Paid at Counter">Paid at Counter</option>
                <option value="Checked In">Checked In (Key Handed Over)</option>
                <option value="Pending at Check-in">Pending at Check-in</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Receptionist Notes</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Police society member discount applied, extra bedding provided..."
              className="w-full rounded-2xl border border-slate-800 bg-slate-950 p-2.5 text-white placeholder-slate-500 outline-none focus:border-blue-500"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-700 px-4 py-2 font-semibold text-slate-300 hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2 font-bold text-white shadow-lg shadow-blue-600/30 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50"
            >
              {isSubmitting ? 'Registering...' : 'Confirm Walk-In Booking'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
