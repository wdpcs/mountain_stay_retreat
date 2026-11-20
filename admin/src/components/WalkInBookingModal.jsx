import { useState } from 'react';
import { API_BASE_URL, SUPABASE_URL, SUPABASE_KEY } from '../config';

function generateWalkInBookingId() {
  return `MSR-WLK-${Math.floor(100000 + Math.random() * 900000)}`;
}

export default function WalkInBookingModal({ isOpen, onClose, token, prices, onBookingCreated }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [checkOutDate, setCheckOutDate] = useState(() => {
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
    return tomorrow.toISOString().split('T')[0];
  });
  const [roomType, setRoomType] = useState('Suite Room (₹2,500/night)');
  const [paymentMethod, setPaymentMethod] = useState('Cash at Counter');
  const [status, setStatus] = useState('Paid at Counter');
  const [notes, setNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const calculateNights = (inDate, outDate) => {
    if (!inDate || !outDate) return 1;
    const d1 = new Date(inDate + 'T00:00:00');
    const d2 = new Date(outDate + 'T00:00:00');
    const diff = Math.round((d2 - d1) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 1;
  };

  const calculateStayTotal = (inDate, outDate, rType) => {
    const isDorm = (rType || '').includes('Dormitory');
    const baseSuite = prices?.suitePrice || 2500;
    const baseDorm = prices?.dormPrice || 450;
    const defaultRate = isDorm ? baseDorm : baseSuite;
    if (!inDate) return defaultRate;

    let flexi = null;
    try {
      const saved = localStorage.getItem('wdpcs_flexi_rates');
      if (saved) flexi = JSON.parse(saved);
    } catch {
      // Local fallback
    }

    const d1 = new Date(inDate + 'T00:00:00');
    const d2 = outDate ? new Date(outDate + 'T00:00:00') : new Date(d1.getTime() + 86400000);
    let total = 0;
    const current = new Date(d1);

    while (current < d2) {
      const dStr = current.toISOString().split('T')[0];
      let dayRate = isDorm ? baseDorm : baseSuite;
      if (flexi) {
        const activeSeason = (flexi.seasonalRules || []).find(
          (rule) => rule.enabled && dStr >= rule.startDate && dStr <= rule.endDate
        );
        if (activeSeason) {
          dayRate = isDorm ? Number(activeSeason.dormPrice) : Number(activeSeason.suitePrice);
        } else if (flexi.weekendPricing?.enabled) {
          const dow = current.getDay();
          const weekendDays = flexi.weekendPricing.days || [5, 6, 0];
          if (weekendDays.includes(dow)) {
            dayRate = isDorm ? Number(flexi.weekendPricing.dormPrice) : Number(flexi.weekendPricing.suitePrice);
          }
        }
      }
      total += dayRate;
      current.setDate(current.getDate() + 1);
    }
    return total > 0 ? total : defaultRate;
  };

  const nights = calculateNights(date, checkOutDate);
  const currentPrice = calculateStayTotal(date, checkOutDate, roomType);
  const ratePerNight = Math.round(currentPrice / nights);

  const handleInDateChange = (newInDate) => {
    setDate(newInDate);
    if (!checkOutDate || checkOutDate <= newInDate) {
      const nextDay = new Date(new Date(newInDate + 'T00:00:00').getTime() + 86400000)
        .toISOString()
        .split('T')[0];
      setCheckOutDate(nextDay);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (checkOutDate <= date) {
      setErrorMsg('Check-out date must be after check-in date (minimum 1 night stay).');
      return;
    }

    setIsSubmitting(true);
    const combinedNotes = [notes.trim(), `Stay: ${date} to ${checkOutDate} (${nights} nights)`].filter(Boolean).join(' | ');

    // 1. Try Node backend API
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
          checkInDate: date,
          checkOutDate,
          nights,
          roomType,
          amount: currentPrice,
          paymentMethod,
          status,
          notes: combinedNotes,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        onBookingCreated();
        onClose();
        return;
      }
    } catch {
      // Fallback to Supabase direct insert below
    }

    // 2. Direct Supabase Cloud Fallback
    try {
      const bookingId = generateWalkInBookingId();
      const cleanPhone = phone.trim() || '+91 70250 17611';
      const cleanEmail = email.trim() || `${phone.replace(/\D/g, '') || 'walkin'}@wdpcs.in`;

      const sbRes = await fetch(`${SUPABASE_URL}/rest/v1/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
          Prefer: 'return=minimal',
        },
        body: JSON.stringify({
          id: bookingId,
          guest_name: name.trim(),
          guest_email: cleanEmail,
          guest_phone: cleanPhone,
          check_in_date: date,
          room_type: roomType,
          amount: currentPrice,
          payment_method: 'Pay at Counter / Property',
          status: status || 'Paid at Counter',
          notes: combinedNotes,
        }),
      });

      if (sbRes.ok) {
        onBookingCreated();
        onClose();
        return;
      } else {
        const errJson = await sbRes.json();
        setErrorMsg(errJson.message || 'Failed to register walk-in booking.');
      }
    } catch {
      setErrorMsg('Failed to connect to the server or database.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
      <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 text-slate-900 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-3">
            <img
              src="./logo.png"
              alt="Mountain Stay Retreat"
              className="h-10 w-10 rounded-full object-contain border border-slate-200 bg-white"
            />
            <div>
              <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">
                Front Desk Reception
              </span>
              <h3 className="text-lg font-extrabold text-slate-900">
                New Walk-in Reservation
              </h3>
            </div>
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
                onChange={(e) => handleInDateChange(e.target.value)}
                required
                className="w-full rounded-2xl border border-slate-300 bg-white p-2.5 text-slate-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 font-medium"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Check-out Date *</label>
              <input
                type="date"
                value={checkOutDate}
                min={date}
                onChange={(e) => setCheckOutDate(e.target.value)}
                required
                className="w-full rounded-2xl border border-slate-300 bg-white p-2.5 text-slate-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 font-medium"
              />
            </div>

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
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-slate-600">
              <span>🌙</span>
              <span>Stay Duration:</span>
              <span className="font-bold text-slate-900 bg-white border border-slate-200 px-2 py-0.5 rounded-lg">
                {nights} {nights === 1 ? 'Night' : 'Nights'}
              </span>
            </div>
            <div className="text-right">
              <span className="text-slate-500 mr-1.5">Total Tariff:</span>
              <span className="text-base font-extrabold text-emerald-700">
                ₹{currentPrice.toLocaleString('en-IN')}
              </span>
              <span className="block text-[10px] text-slate-400">
                (avg ₹{ratePerNight.toLocaleString('en-IN')}/night)
              </span>
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
