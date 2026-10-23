import { useState, useEffect, useMemo } from 'react';
import { API_BASE_URL } from '../config';

export default function GuestDirectory({ token }) {
  const [guests, setGuests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedGuest, setSelectedGuest] = useState(null);

  const fetchGuests = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/guests`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setGuests(data.guests || []);
      }
    } catch (err) {
      console.error('Failed to fetch guests:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGuests();
  }, [token]);

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
            <span className="text-xl">👥</span>
            <span className="text-xs font-bold uppercase tracking-wider text-blue-400">
              Guest Database
            </span>
          </div>
          <h2 className="text-2xl font-bold text-white mt-1">
            Guest Records & Relationship Management
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Aggregated guest profiles, stay history, and direct communication
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <span className="absolute left-3.5 top-2.5 text-xs text-slate-500">🔍</span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, phone, or email..."
            className="w-full rounded-2xl border border-slate-800 bg-slate-950 py-2 pl-9 pr-3 text-xs text-white placeholder-slate-500 outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Guests Table */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-white">Registered Guests</h3>
            <span className="rounded-full bg-slate-800 px-2.5 py-0.5 text-xs font-semibold text-slate-300">
              {filtered.length} Unique Guests
            </span>
          </div>
          <button
            onClick={fetchGuests}
            className="text-xs text-slate-400 hover:text-white"
          >
            🔄 Refresh Directory
          </button>
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-800 p-12 text-center text-slate-500 text-xs">
            No guest records match your search query.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 text-slate-400 font-semibold">
                <tr>
                  <th className="pb-3">Guest Name</th>
                  <th className="pb-3">Contact Phone</th>
                  <th className="pb-3">Email Address</th>
                  <th className="pb-3">Total Stays</th>
                  <th className="pb-3">Total Spend</th>
                  <th className="pb-3">Last Visit</th>
                  <th className="pb-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {filtered.map((g, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 font-semibold text-white">
                      <button
                        onClick={() => setSelectedGuest(g)}
                        className="text-left hover:text-blue-400 hover:underline"
                      >
                        {g.name}
                      </button>
                    </td>
                    <td className="py-3 text-slate-300">
                      <a href={`tel:${g.phone}`} className="hover:underline">{g.phone || 'N/A'}</a>
                    </td>
                    <td className="py-3 text-slate-300">{g.email || 'N/A'}</td>
                    <td className="py-3">
                      <span className="rounded-full bg-blue-500/10 px-2.5 py-0.5 text-[11px] font-bold text-blue-400 border border-blue-500/20">
                        {g.totalBookings} Booking{g.totalBookings > 1 ? 's' : ''}
                      </span>
                    </td>
                    <td className="py-3 font-bold text-emerald-400">
                      ₹{g.totalSpent.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 text-slate-400">{g.lastVisit}</td>
                    <td className="py-3 text-right space-x-1.5">
                      {g.phone && (
                        <a
                          href={`https://wa.me/${g.phone.replace(/\D/g, '')}?text=${encodeURIComponent(
                            `Greetings from Mountain Stay Retreat, ${g.name}. How can we assist you with your stay?`
                          )}`}
                          target="_blank"
                          rel="noreferrer"
                          title="WhatsApp Message"
                          className="inline-block rounded-lg bg-emerald-600/20 p-1.5 text-emerald-400 hover:bg-emerald-600 hover:text-white transition border border-emerald-500/30"
                        >
                          💬
                        </a>
                      )}
                      <button
                        onClick={() => setSelectedGuest(g)}
                        title="View Full Stay History"
                        className="rounded-lg bg-slate-800 p-1.5 text-slate-300 hover:bg-slate-700 hover:text-white transition"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl border border-slate-800 bg-slate-900 p-6 text-white shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[11px] font-bold text-blue-400 uppercase tracking-wider">
                  Guest Profile & History
                </span>
                <h3 className="text-xl font-bold text-white">{selectedGuest.name}</h3>
                <p className="text-xs text-slate-400">
                  {selectedGuest.phone} • {selectedGuest.email}
                </p>
              </div>
              <button
                onClick={() => setSelectedGuest(null)}
                className="rounded-full p-2 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-3">
                <span className="text-slate-400 block text-[10px] font-bold uppercase">Lifetime Reservations</span>
                <span className="text-white font-bold text-lg">{selectedGuest.totalBookings}</span>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-3">
                <span className="text-slate-400 block text-[10px] font-bold uppercase">Total Lifetime Spend</span>
                <span className="text-emerald-400 font-bold text-lg">
                  ₹{selectedGuest.totalSpent.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                Stay History
              </h4>
              <div className="max-h-56 overflow-y-auto space-y-2">
                {selectedGuest.history.map((h, i) => (
                  <div key={i} className="rounded-xl border border-slate-800 bg-slate-950 p-3 text-xs flex items-center justify-between">
                    <div>
                      <div className="font-mono text-blue-400 font-bold">{h.id}</div>
                      <div className="text-slate-300 font-medium">{h.roomType}</div>
                      <div className="text-[11px] text-slate-500">Date: {h.date}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-white">₹{(h.amount || 0).toLocaleString('en-IN')}</div>
                      <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300">
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
