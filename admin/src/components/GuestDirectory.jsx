import { useState, useEffect, useMemo, useCallback } from 'react';
import { API_BASE_URL } from '../config';

export default function GuestDirectory({ token, bookings = [] }) {
  const [guests, setGuests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedGuest, setSelectedGuest] = useState(null);

  const computeFallbackGuests = useCallback(() => {
    const guestMap = new Map();
    (bookings || []).forEach((b) => {
      const key = b.email || b.phone || b.name;
      if (!key) return;
      if (!guestMap.has(key)) {
        guestMap.set(key, {
          name: b.name,
          email: b.email,
          phone: b.phone,
          totalBookings: 0,
          totalSpent: 0,
          lastVisit: b.date,
          history: [],
        });
      }

      const g = guestMap.get(key);
      g.totalBookings += 1;
      if (b.status !== 'Cancelled') {
        g.totalSpent += b.amount || 0;
      }
      if (!g.lastVisit || b.date > g.lastVisit) {
        g.lastVisit = b.date;
      }
      g.history.push({
        id: b.id,
        date: b.date,
        roomType: b.roomType,
        amount: b.amount,
        status: b.status,
      });
    });

    const guestList = Array.from(guestMap.values()).sort((a, b) => b.totalSpent - a.totalSpent);
    setGuests(guestList);
  }, [bookings]);

  const fetchGuests = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/guests`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.guests) {
          setGuests(data.guests);
          return;
        }
      }
    } catch {
      // Fallback below
    }

    computeFallbackGuests();
    setLoading(false);
  }, [token, computeFallbackGuests]);

  useEffect(() => {
    fetchGuests();
  }, [fetchGuests]);

  const filtered = useMemo(() => {
    if (!search) return guests;
    const s = search.toLowerCase();
    return guests.filter(
      (g) =>
        g.name.toLowerCase().includes(s) ||
        (g.phone && g.phone.toLowerCase().includes(s)) ||
        (g.email && g.email.toLowerCase().includes(s))
    );
  }, [guests, search]);

  if (loading && guests.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-3 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-3xl border border-blue-200/80 bg-gradient-to-r from-blue-50 via-indigo-50/40 to-white p-6 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">👥</span>
            <span className="text-xs font-bold uppercase tracking-wider text-blue-700">
              Guest Database
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
            Guest Records & Relationship Management
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 font-medium mt-0.5">
            Aggregated guest profiles, stay history, and direct communication
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <span className="absolute left-3.5 top-2.5 text-xs text-slate-400">🔍</span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, phone, or email..."
            className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs text-slate-900 placeholder-slate-400 outline-none focus:border-blue-500 shadow-2xs transition"
          />
        </div>
      </div>

      {/* Guests Table */}
      <div className="rounded-3xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-900">Registered Guests</h3>
            <span className="rounded-full bg-blue-50 border border-blue-200 px-2.5 py-0.5 text-xs font-bold text-blue-700">
              {filtered.length} Unique Guests
            </span>
          </div>
          <button
            onClick={fetchGuests}
            className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1 transition"
          >
            🔄 Refresh Directory
          </button>
        </div>

        {filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs font-medium">
            No guest records match your search query.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50/70 text-slate-600 font-bold">
                <tr>
                  <th className="py-3 px-4">Guest Name</th>
                  <th className="py-3 px-4">Contact Phone</th>
                  <th className="py-3 px-4">Email Address</th>
                  <th className="py-3 px-4">Total Stays</th>
                  <th className="py-3 px-4">Total Spend</th>
                  <th className="py-3 px-4">Last Visit</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filtered.map((g, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 font-bold text-slate-900">
                      <button
                        onClick={() => setSelectedGuest(g)}
                        className="text-left text-slate-900 hover:text-blue-600 hover:underline transition"
                      >
                        {g.name}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      <a href={`tel:${g.phone}`} className="hover:text-blue-600 hover:underline font-mono">
                        {g.phone || 'N/A'}
                      </a>
                    </td>
                    <td className="py-3 px-4 text-slate-600">{g.email || 'N/A'}</td>
                    <td className="py-3 px-4">
                      <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-extrabold text-blue-700 border border-blue-200">
                        {g.totalBookings} Booking{g.totalBookings > 1 ? 's' : ''}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-extrabold text-emerald-700">
                      ₹{g.totalSpent.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4 text-slate-500">{g.lastVisit}</td>
                    <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                      {g.phone && (
                        <a
                          href={`https://wa.me/${g.phone.replace(/\D/g, '')}?text=${encodeURIComponent(
                            `Greetings from Mountain Stay Retreat, ${g.name}. How can we assist you with your stay?`
                          )}`}
                          target="_blank"
                          rel="noreferrer"
                          title="WhatsApp Message"
                          className="inline-block rounded-lg bg-emerald-50 p-1.5 text-emerald-700 hover:bg-emerald-600 hover:text-white transition border border-emerald-200"
                        >
                          💬
                        </a>
                      )}
                      <button
                        onClick={() => setSelectedGuest(g)}
                        title="View Full Stay History"
                        className="rounded-lg bg-slate-100 p-1.5 text-slate-700 hover:bg-slate-200 transition border border-slate-200"
                      >
                        📋
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Guest Stay History Modal */}
      {selectedGuest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 text-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">
                  Guest Profile & History
                </span>
                <h3 className="text-xl font-extrabold text-slate-900">{selectedGuest.name}</h3>
                <p className="text-xs text-slate-500 font-medium">
                  {selectedGuest.phone} • {selectedGuest.email}
                </p>
              </div>
              <button
                onClick={() => setSelectedGuest(null)}
                className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <span className="text-slate-500 block text-[10px] font-bold uppercase tracking-wider">
                  Lifetime Reservations
                </span>
                <span className="text-slate-900 font-extrabold text-lg">
                  {selectedGuest.totalBookings}
                </span>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <span className="text-slate-500 block text-[10px] font-bold uppercase tracking-wider">
                  Total Lifetime Spend
                </span>
                <span className="text-emerald-700 font-extrabold text-lg">
                  ₹{selectedGuest.totalSpent.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Stay History
              </h4>
              <div className="max-h-56 overflow-y-auto space-y-2">
                {selectedGuest.history.map((h, i) => (
                  <div
                    key={i}
                    className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 text-xs flex items-center justify-between"
                  >
                    <div>
                      <div className="font-mono text-blue-600 font-bold">{h.id}</div>
                      <div className="text-slate-900 font-bold">{h.roomType}</div>
                      <div className="text-[11px] text-slate-500 font-medium">Date: {h.date}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-extrabold text-slate-900">
                        ₹{(h.amount || 0).toLocaleString('en-IN')}
                      </div>
                      <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                        {h.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
