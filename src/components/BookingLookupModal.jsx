import { useState } from 'react';
import { lookupBooking } from '../lib/supabase';

export default function BookingLookupModal({ isOpen, onClose }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);

  if (!isOpen) return null;

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setHasSearched(true);
    try {
      const results = await lookupBooking(searchQuery);
      setSearchResults(results);
    } catch (err) {
      console.error('Lookup failed:', err);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handlePrint = (booking) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Reservation Voucher - ${booking.id || booking.bookingId}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 40px; color: #1e293b; }
            .header { border-bottom: 2px solid #0f172a; padding-bottom: 16px; margin-bottom: 24px; }
            .entity { font-size: 13px; font-weight: bold; color: #3b82f6; text-transform: uppercase; }
            .title { font-size: 24px; font-weight: bold; color: #0f172a; margin-top: 4px; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px; }
            .label { font-size: 12px; color: #64748b; font-weight: 600; text-transform: uppercase; }
            .val { font-size: 15px; font-weight: 600; color: #0f172a; margin-top: 2px; }
            .amount-box { background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 12px; padding: 18px; margin-top: 24px; }
            .total { font-size: 22px; font-weight: bold; color: #059669; }
            .footer { margin-top: 40px; border-top: 1px solid #e2e8f0; padding-top: 16px; font-size: 12px; color: #94a3b8; text-align: center; }
          </style>
        </head>
        <body>
          <div class="header" style="display: flex; align-items: center; justify-content: space-between; gap: 16px;">
            <div>
              <div class="entity">Wayanad District Police Co-operative Society Ltd. No. W 208</div>
              <div class="title">Mountain Stay Retreat — Reservation Voucher</div>
              <div style="font-size: 12px; color: #64748b; margin-top: 4px;">Kalpetta North, Wayanad, Kerala | Ph: +91 70250 17611</div>
            </div>
            <img src="./logo.png" alt="Logo" style="height: 64px; width: 64px; border-radius: 50%;" />
          </div>

          <div class="grid">
            <div>
              <div class="label">Booking Reference</div>
              <div class="val" style="font-family: monospace;">${booking.id || booking.bookingId}</div>
            </div>
            <div>
              <div class="label">Guest Full Name</div>
              <div class="val">${booking.name}</div>
            </div>
            <div>
              <div class="label">Contact Phone</div>
              <div class="val">${booking.phone || 'N/A'}</div>
            </div>
            <div>
              <div class="label">Email Address</div>
              <div class="val">${booking.email || 'N/A'}</div>
            </div>
            <div>
              <div class="label">Check-in Date</div>
              <div class="val">${booking.checkInDate || booking.date} (1:00 PM)</div>
            </div>
            <div>
              <div class="label">Check-out Date</div>
              <div class="val">${booking.checkOutDate || 'Next Day'} (12:00 PM)</div>
            </div>
            <div>
              <div class="label">Duration of Stay</div>
              <div class="val">${booking.nights || 1} ${(booking.nights || 1) === 1 ? 'Night' : 'Nights'}</div>
            </div>
            <div>
              <div class="label">Accommodation</div>
              <div class="val">${booking.roomType}</div>
            </div>
            <div>
              <div class="label">Units Reserved</div>
              <div class="val">${booking.roomCount || 1} ${(booking.roomType || '').includes('Dormitory') ? ((booking.roomCount || 1) === 1 ? 'Bed' : 'Beds') : ((booking.roomCount || 1) === 1 ? 'Room' : 'Rooms')}</div>
            </div>
          </div>

          <div class="amount-box">
            <div class="label">Payment Status & Method</div>
            <div class="val">${booking.paymentMethod} — <strong>${booking.status}</strong></div>
            <div style="margin-top: 10px;" class="label">Total Amount Due / Paid</div>
            <div class="total">₹${(booking.amount || 0).toLocaleString('en-IN')}</div>
          </div>

          <div class="footer">
            Official System Generated Document — Wayanad District Police Co-operative Society Ltd. No. W 208.<br/>
            Present this voucher upon check-in at Mountain Stay Retreat reception.
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg overflow-hidden rounded-3xl bg-white p-6 sm:p-7 text-slate-800 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 text-lg border border-blue-100">
              🔍
            </span>
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                Find Your Reservation
              </h3>
              <p className="text-xs text-slate-500">
                Lookup booking details, check-in dates, and payment status
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
          >
            ✕
          </button>
        </div>

        {/* Search Input Form */}
        <form onSubmit={handleSearch} className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Enter Booking Ref ID, Phone Number, or Email *
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-3 text-sm text-slate-400">
                🔎
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="e.g. MSR-CTR-123456 or 9845012345 or yourname@gmail.com"
                required
                className="w-full rounded-2xl border border-slate-300 bg-slate-50 py-2.5 pl-10 pr-24 text-xs sm:text-sm font-semibold text-slate-900 outline-none focus:border-blue-600 focus:bg-white transition"
              />
              <button
                type="submit"
                disabled={isSearching}
                className="absolute right-1.5 top-1.5 rounded-xl bg-blue-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-blue-700 transition shadow-xs disabled:opacity-50"
              >
                {isSearching ? 'Searching...' : 'Search'}
              </button>
            </div>
          </div>
        </form>

        {/* Results Area */}
        {hasSearched && (
          <div className="space-y-3 pt-2 border-t border-slate-100">
            {isSearching ? (
              <div className="flex h-32 items-center justify-center">
                <div className="h-7 w-7 animate-spin rounded-full border-3 border-blue-600 border-t-transparent"></div>
              </div>
            ) : searchResults && searchResults.length > 0 ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-600">
                  <span className="font-bold">
                    Found {searchResults.length} {searchResults.length === 1 ? 'reservation' : 'reservations'}:
                  </span>
                </div>

                {searchResults.map((booking) => (
                  <div
                    key={booking.id}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-3 hover:border-blue-300 transition"
                  >
                    <div className="flex items-start justify-between border-b border-slate-200/70 pb-2.5">
                      <div>
                        <span className="font-mono font-bold text-blue-700 text-sm block">
                          {booking.id}
                        </span>
                        <span className="font-bold text-slate-900 text-sm">
                          {booking.name}
                        </span>
                      </div>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${
                          booking.status.includes('Paid')
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                            : 'bg-amber-50 text-amber-800 border-amber-300'
                        }`}
                      >
                        {booking.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-500 font-bold uppercase block">Stay Dates</span>
                        <span className="font-semibold text-slate-800">
                          {booking.checkInDate || booking.date} → {booking.checkOutDate || 'Next Day'}
                        </span>
                        <div className="text-[10px] text-slate-500">
                          ({booking.nights || 1} {(booking.nights || 1) === 1 ? 'night' : 'nights'})
                        </div>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 font-bold uppercase block">Accommodation</span>
                        <span className="font-semibold text-slate-800 truncate block">
                          {booking.roomType}
                        </span>
                        <span className="text-[11px] font-bold text-emerald-700 block">
                          {booking.roomCount || 1} {(booking.roomType || '').includes('Dormitory') ? ((booking.roomCount || 1) === 1 ? 'Bed' : 'Beds') : ((booking.roomCount || 1) === 1 ? 'Room' : 'Rooms')}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 font-bold uppercase block">Contact Phone</span>
                        <span className="font-semibold text-slate-800">
                          {booking.phone || 'N/A'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 font-bold uppercase block">Total Tariff</span>
                        <span className="text-sm font-extrabold text-emerald-700">
                          ₹{(booking.amount || 0).toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-slate-200/60">
                      {booking.phone && (
                        <a
                          href={`https://wa.me/917025017611?text=${encodeURIComponent(
                            `Hello Mountain Stay Retreat, I am inquiring about my booking ${booking.id} for ${booking.checkInDate || booking.date} under name ${booking.name}.`
                          )}`}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 transition flex items-center gap-1 shadow-2xs"
                        >
                          <span>💬</span> WhatsApp Reception
                        </a>
                      )}
                      <button
                        onClick={() => handlePrint(booking)}
                        className="rounded-xl bg-blue-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-700 transition flex items-center gap-1 shadow-2xs"
                      >
                        <span>🖨️</span> Print Voucher
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center space-y-2">
                <span className="text-2xl block">🔍</span>
                <p className="text-xs font-bold text-slate-800">
                  No booking details found for &ldquo;{searchQuery}&rdquo;
                </p>
                <p className="text-[11px] text-slate-500 leading-relaxed max-w-sm mx-auto">
                  Please verify your Booking Reference ID (e.g. <span className="font-mono font-bold">MSR-CTR-XXXXXX</span>) or the 10-digit phone number entered during reservation.
                </p>
                <div className="pt-2">
                  <a
                    href="tel:+917025017611"
                    className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:underline"
                  >
                    <span>📞</span> Call Reception: +91 70250 17611
                  </a>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
