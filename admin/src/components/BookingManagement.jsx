import { useState, useMemo } from 'react';
import { API_BASE_URL, SOCIETY_INFO } from '../config';

export default function BookingManagement({
  bookings,
  token,
  onRefresh,
  onOpenWalkIn,
  onStatusChange,
  onDeleteBooking,
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [roomFilter, setRoomFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState('');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  // Filtered list
  const filtered = useMemo(() => {
    return bookings.filter((b) => {
      const s = searchTerm.toLowerCase();
      const matchesSearch =
        !searchTerm ||
        b.id.toLowerCase().includes(s) ||
        b.name.toLowerCase().includes(s) ||
        b.email.toLowerCase().includes(s) ||
        (b.phone && b.phone.toLowerCase().includes(s));

      const matchesStatus = statusFilter === 'All' || b.status === statusFilter;

      const matchesRoom =
        roomFilter === 'All' ||
        (roomFilter === 'Suite' && b.roomType.includes('Suite')) ||
        (roomFilter === 'Dormitory' && b.roomType.includes('Dormitory'));

      const matchesDate = !dateFilter || b.date === dateFilter;

      return matchesSearch && matchesStatus && matchesRoom && matchesDate;
    });
  }, [bookings, searchTerm, statusFilter, roomFilter, dateFilter]);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Paid Online':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      case 'Paid at Counter':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'Checked In':
        return 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30';
      case 'Checked Out':
        return 'bg-slate-500/20 text-slate-300 border-slate-500/30';
      case 'Pending at Check-in':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      case 'Cancelled':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/30';
      default:
        return 'bg-slate-700 text-slate-200 border-slate-600';
    }
  };

  const handlePrintVoucher = (booking) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Reservation Receipt - ${booking.id}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 40px; color: #1e293b; }
            .header { border-bottom: 2px solid #0f172a; padding-bottom: 16px; margin-bottom: 24px; }
            .entity { font-size: 13px; font-weight: bold; color: #3b82f6; text-transform: uppercase; }
            .title { font-size: 24px; font-weight: bold; color: #0f172a; margin-top: 4px; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px; }
            .label { font-size: 12px; color: #64748b; font-weight: 600; text-transform: uppercase; }
            .val { font-size: 15px; font-weight: 600; color: #0f172a; margin-top: 2px; }
            .amount-box { background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 12px; padding: 16px; margin-top: 24px; }
            .total { font-size: 22px; font-weight: bold; color: #059669; }
            .footer { margin-top: 40px; border-top: 1px solid #e2e8f0; padding-top: 16px; font-size: 12px; color: #94a3b8; text-align: center; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="entity">${SOCIETY_INFO.name}</div>
            <div class="title">${SOCIETY_INFO.property} — Guest Folio</div>
            <div style="font-size: 12px; color: #64748b; margin-top: 4px;">${SOCIETY_INFO.location} | Ph: ${SOCIETY_INFO.contactPhone}</div>
          </div>

          <div class="grid">
            <div>
              <div class="label">Booking Reference</div>
              <div class="val" style="font-family: monospace;">${booking.id}</div>
            </div>
            <div>
              <div class="label">Date of Reservation</div>
              <div class="val">${new Date(booking.createdAt).toLocaleString('en-IN')}</div>
            </div>
            <div>
              <div class="label">Guest Full Name</div>
              <div class="val">${booking.name}</div>
            </div>
            <div>
              <div class="label">Contact Number</div>
              <div class="val">${booking.phone || 'N/A'}</div>
            </div>
            <div>
              <div class="label">Check-in Date</div>
              <div class="val">${booking.date} (Check-in 1:00 PM)</div>
            </div>
            <div>
              <div class="label">Accommodation Type</div>
              <div class="val">${booking.roomType}</div>
            </div>
          </div>

          <div class="amount-box">
            <div class="label">Payment Status & Method</div>
            <div class="val">${booking.paymentMethod} — <strong>${booking.status}</strong></div>
            <div style="margin-top: 12px;" class="label">Total Amount Due / Paid</div>
            <div class="total">₹${(booking.amount || 0).toLocaleString('en-IN')}</div>
          </div>

          <div class="footer">
            Official System Generated Document — Wayanad District Police Co-operative Society Ltd. No. W 208.<br/>
            Present this folio upon arrival at Mountain Stay Retreat reception.
          </div>
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6">
      {/* Controls Bar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 rounded-3xl border border-slate-800 bg-slate-900/80 p-5 shadow-xl">
        {/* Search */}
        <div className="relative flex-1">
          <span className="absolute left-4 top-3 text-sm text-slate-500">🔍</span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search bookings by ID, guest name, phone, or email..."
            className="w-full rounded-2xl border border-slate-800 bg-slate-950 py-2.5 pl-11 pr-4 text-xs text-white placeholder-slate-500 outline-none focus:border-blue-500 transition"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-white"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs font-semibold text-slate-300 outline-none focus:border-blue-500"
          >
            <option value="All">All Statuses</option>
            <option value="Paid Online">Paid Online</option>
            <option value="Paid at Counter">Paid at Counter</option>
            <option value="Checked In">Checked In</option>
            <option value="Checked Out">Checked Out</option>
            <option value="Pending at Check-in">Pending at Check-in</option>
            <option value="Cancelled">Cancelled</option>
          </select>

          {/* Room Filter */}
          <select
            value={roomFilter}
            onChange={(e) => setRoomFilter(e.target.value)}
            className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs font-semibold text-slate-300 outline-none focus:border-blue-500"
          >
            <option value="All">All Rooms</option>
            <option value="Suite">Suites</option>
            <option value="Dormitory">Dormitory</option>
          </select>

          {/* Date Filter */}
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs font-semibold text-slate-300 outline-none focus:border-blue-500"
          />
          {dateFilter && (
            <button
              onClick={() => setDateFilter('')}
              className="text-xs text-slate-400 hover:text-white underline"
            >
              Clear Date
            </button>
          )}

          {/* Action: Walk In */}
          <button
            onClick={onOpenWalkIn}
            className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-md hover:from-blue-500 hover:to-indigo-500 transition flex items-center gap-1.5"
          >
            <span>➕</span>
            <span>Walk-In Booking</span>
          </button>
        </div>
      </div>

      {/* Bookings Table */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-white">All Bookings Roster</h3>
            <span className="rounded-full bg-slate-800 px-2.5 py-0.5 text-xs font-semibold text-slate-300">
              {filtered.length} of {bookings.length}
            </span>
          </div>
          <button
            onClick={onRefresh}
            className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
          >
            <span>🔄</span> Refresh Roster
          </button>
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-800 p-12 text-center text-slate-500 text-xs">
            No bookings match the specified filters. Try clearing your search or filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 text-slate-400 font-semibold">
                <tr>
                  <th className="pb-3">Reference</th>
                  <th className="pb-3">Guest</th>
                  <th className="pb-3">Check-in Date</th>
                  <th className="pb-3">Accommodation</th>
                  <th className="pb-3">Amount</th>
                  <th className="pb-3">Payment Method</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {filtered.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3.5">
                      <button
                        onClick={() => setSelectedBooking(b)}
                        className="font-mono font-bold text-blue-400 hover:underline text-left"
                      >
                        {b.id}
                      </button>
                    </td>
                    <td className="py-3.5">
                      <div className="text-white font-semibold">{b.name}</div>
                      <div className="text-[11px] text-slate-400">{b.phone || b.email}</div>
                    </td>
                    <td className="py-3.5 text-slate-200">{b.date}</td>
                    <td className="py-3.5 text-slate-300">{b.roomType}</td>
                    <td className="py-3.5 font-bold text-white">
                      ₹{(b.amount || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 text-slate-400 text-[11px]">
                      {b.paymentMethod}
                    </td>
                    <td className="py-3.5">
                      <select
                        value={b.status}
                        onChange={(e) => onStatusChange(b.id, e.target.value)}
                        className={`rounded-lg px-2 py-1 text-[11px] font-bold border outline-none bg-slate-950 ${getStatusBadge(
                          b.status
                        )}`}
                      >
                        <option value="Paid Online">Paid Online</option>
                        <option value="Paid at Counter">Paid at Counter</option>
                        <option value="Checked In">Checked In</option>
                        <option value="Checked Out">Checked Out</option>
                        <option value="Pending at Check-in">Pending at Check-in</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </td>
                    <td className="py-3.5 text-right space-x-1.5">
                      <button
                        onClick={() => setSelectedBooking(b)}
                        title="View Details"
                        className="rounded-lg bg-slate-800 p-1.5 text-slate-300 hover:bg-slate-700 hover:text-white transition"
                      >
                        👁️
                      </button>
                      <button
                        onClick={() => handlePrintVoucher(b)}
                        title="Print Receipt Voucher"
                        className="rounded-lg bg-slate-800 p-1.5 text-slate-300 hover:bg-slate-700 hover:text-white transition"
                      >
                        🖨️
                      </button>
                      <button
                        onClick={() => setDeleteConfirmId(b.id)}
                        title="Delete Record"
                        className="rounded-lg bg-rose-500/10 p-1.5 text-rose-400 hover:bg-rose-500 hover:text-white transition border border-rose-500/20"
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl border border-slate-800 bg-slate-900 p-6 text-white shadow-2xl">
            <h4 className="text-base font-bold text-white flex items-center gap-2">
              <span>⚠️</span>
              <span>Confirm Record Deletion</span>
            </h4>
            <p className="mt-2 text-xs text-slate-400">
              Are you sure you want to remove booking <span className="font-mono text-blue-400">{deleteConfirmId}</span>? This action is recorded in the audit log.
            </p>
            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="rounded-xl border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onDeleteBooking(deleteConfirmId);
                  setDeleteConfirmId(null);
                }}
                className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-500"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Booking Details Drawer / Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl border border-slate-800 bg-slate-900 p-6 text-white shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[11px] font-bold text-blue-400 uppercase tracking-wider">
                  Reservation Details
                </span>
                <h3 className="text-lg font-bold text-white font-mono">{selectedBooking.id}</h3>
              </div>
              <button
                onClick={() => setSelectedBooking(null)}
                className="rounded-full p-2 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-3">
                <span className="text-slate-400 block text-[10px] font-bold uppercase">Guest Full Name</span>
                <span className="text-white font-semibold text-sm">{selectedBooking.name}</span>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-3">
                <span className="text-slate-400 block text-[10px] font-bold uppercase">Contact Phone</span>
                <span className="text-white font-semibold text-sm">{selectedBooking.phone || 'N/A'}</span>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-3">
                <span className="text-slate-400 block text-[10px] font-bold uppercase">Email Address</span>
                <span className="text-white font-semibold">{selectedBooking.email || 'N/A'}</span>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-3">
                <span className="text-slate-400 block text-[10px] font-bold uppercase">Check-in Date</span>
                <span className="text-white font-semibold">{selectedBooking.date}</span>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-3 col-span-2">
                <span className="text-slate-400 block text-[10px] font-bold uppercase">Accommodation Type</span>
                <span className="text-white font-semibold">{selectedBooking.roomType}</span>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-3">
                <span className="text-slate-400 block text-[10px] font-bold uppercase">Payment Status</span>
                <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadge(selectedBooking.status)}`}>
                  {selectedBooking.status}
                </span>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-3">
                <span className="text-slate-400 block text-[10px] font-bold uppercase">Total Amount</span>
                <span className="text-emerald-400 font-extrabold text-base">
                  ₹{(selectedBooking.amount || 0).toLocaleString('en-IN')}
                </span>
              </div>
              {selectedBooking.notes && (
                <div className="rounded-2xl border border-slate-800 bg-slate-950 p-3 col-span-2">
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">Staff Notes</span>
                  <span className="text-slate-300">{selectedBooking.notes}</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              {selectedBooking.phone && (
                <a
                  href={`https://wa.me/${selectedBooking.phone.replace(/\D/g, '')}?text=${encodeURIComponent(
                    `Hello ${selectedBooking.name}, this is Mountain Stay Retreat reception regarding your booking ${selectedBooking.id} for ${selectedBooking.date}.`
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-emerald-500 transition flex items-center gap-1.5"
                >
                  <span>💬</span> WhatsApp Guest
                </a>
              )}
              <button
                onClick={() => handlePrintVoucher(selectedBooking)}
                className="rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-blue-500 transition flex items-center gap-1.5"
              >
                <span>🖨️</span> Print Folio
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
