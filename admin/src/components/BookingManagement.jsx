import { useState, useMemo } from 'react';
import { SOCIETY_INFO } from '../config';

export default function BookingManagement({
  bookings,
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

  // Checkout & Discount Modal state
  const [checkoutBooking, setCheckoutBooking] = useState(null);
  const [discountType, setDiscountType] = useState('amount'); // 'amount' | 'percent'
  const [discountVal, setDiscountVal] = useState(0);
  const [discountReason, setDiscountReason] = useState('Police Personnel Privilege');
  const [customReason, setCustomReason] = useState('');
  const [checkoutPaymentMethod, setCheckoutPaymentMethod] = useState('Cash at Reception');
  const [isSubmittingCheckout, setIsSubmittingCheckout] = useState(false);

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
        return 'bg-emerald-50 text-emerald-800 border-emerald-300';
      case 'Paid at Counter':
        return 'bg-blue-50 text-blue-800 border-blue-300';
      case 'Checked In':
        return 'bg-indigo-50 text-indigo-800 border-indigo-300';
      case 'Checked Out':
        return 'bg-slate-100 text-slate-700 border-slate-300';
      case 'Pending at Check-in':
        return 'bg-amber-50 text-amber-800 border-amber-300';
      case 'Cancelled':
        return 'bg-rose-50 text-rose-800 border-rose-300';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-300';
    }
  };

  const handleOpenCheckout = (booking) => {
    setCheckoutBooking(booking);
    setDiscountType('amount');
    setDiscountVal(booking.discountAmount || 0);
    setDiscountReason(booking.discountReason || 'Police Personnel Privilege');
    setCustomReason('');
    setCheckoutPaymentMethod(booking.paymentMethod || 'Cash at Reception');
  };

  const handleStatusSelectChange = (booking, newStatus) => {
    if (newStatus === 'Checked Out' && booking.status !== 'Checked Out') {
      handleOpenCheckout(booking);
      return;
    }
    onStatusChange(booking.id, newStatus);
  };

  // Calculations for checkout
  const grossBill = checkoutBooking
    ? checkoutBooking.originalAmount ||
      (checkoutBooking.amount + (checkoutBooking.discountAmount || 0)) ||
      checkoutBooking.amount ||
      0
    : 0;

  const computedDiscount = useMemo(() => {
    if (!checkoutBooking) return 0;
    const num = Math.max(0, Number(discountVal) || 0);
    if (discountType === 'percent') {
      const pctDiscount = Math.round((grossBill * num) / 100);
      return Math.min(Math.max(0, pctDiscount), grossBill);
    }
    return Math.min(Math.max(0, Math.round(num)), grossBill);
  }, [checkoutBooking, discountType, discountVal, grossBill]);

  const netBill = Math.max(0, grossBill - computedDiscount);

  const handleConfirmCheckout = async (e) => {
    e.preventDefault();
    if (!checkoutBooking) return;
    setIsSubmittingCheckout(true);

    const finalReason =
      discountReason === 'Other'
        ? customReason.trim() || 'Staff Privilege Discount'
        : discountReason;

    await onStatusChange(checkoutBooking.id, 'Checked Out', {
      discountAmount: computedDiscount,
      discountReason: computedDiscount > 0 ? finalReason : '',
      finalAmount: netBill,
      originalAmount: grossBill,
      paymentMethod: checkoutPaymentMethod,
    });

    setIsSubmittingCheckout(false);
    const settledBooking = {
      ...checkoutBooking,
      status: 'Checked Out',
      amount: netBill,
      originalAmount: grossBill,
      discountAmount: computedDiscount,
      discountReason: computedDiscount > 0 ? finalReason : '',
      paymentMethod: checkoutPaymentMethod,
    };
    setCheckoutBooking(null);
    setSelectedBooking(settledBooking);
  };

  const handlePrintVoucher = (booking) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const bOriginal =
      booking.originalAmount ||
      (booking.amount + (booking.discountAmount || 0)) ||
      booking.amount;
    const bDiscount = booking.discountAmount || 0;
    const bFinal = booking.amount || 0;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Reservation & Settlement Folio - ${booking.id}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 40px; color: #1e293b; }
            .header { border-bottom: 2px solid #0f172a; padding-bottom: 16px; margin-bottom: 24px; }
            .entity { font-size: 13px; font-weight: bold; color: #3b82f6; text-transform: uppercase; }
            .title { font-size: 24px; font-weight: bold; color: #0f172a; margin-top: 4px; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px; }
            .label { font-size: 12px; color: #64748b; font-weight: 600; text-transform: uppercase; }
            .val { font-size: 15px; font-weight: 600; color: #0f172a; margin-top: 2px; }
            .amount-box { background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 12px; padding: 18px; margin-top: 24px; }
            .bill-row { display: flex; justify-content: space-between; font-size: 14px; margin-bottom: 8px; }
            .bill-row.discount { color: #059669; font-weight: 600; }
            .bill-row.total { border-top: 2px solid #cbd5e1; padding-top: 10px; margin-top: 10px; font-size: 20px; font-weight: bold; color: #0f172a; }
            .footer { margin-top: 40px; border-top: 1px solid #e2e8f0; padding-top: 16px; font-size: 12px; color: #94a3b8; text-align: center; }
          </style>
        </head>
        <body>
          <div class="header" style="display: flex; align-items: center; justify-content: space-between; gap: 16px;">
            <div>
              <div class="entity">${SOCIETY_INFO.name}</div>
              <div class="title">${SOCIETY_INFO.property} — Guest Folio</div>
              <div style="font-size: 12px; color: #64748b; margin-top: 4px;">${SOCIETY_INFO.location} | Ph: ${SOCIETY_INFO.contactPhone}</div>
            </div>
            <img src="./logo.png" alt="Mountain Stay Retreat Logo" style="height: 68px; width: 68px; object-fit: contain; border-radius: 50%; border: 1px solid #cbd5e1;" />
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
              <div class="val">${booking.checkInDate || booking.date} (Check-in 1:00 PM)</div>
            </div>
            <div>
              <div class="label">Check-out Date</div>
              <div class="val">${booking.checkOutDate || 'Next Day'} (Check-out 12:00 PM)</div>
            </div>
            <div>
              <div class="label">Duration of Stay</div>
              <div class="val">${booking.nights || 1} ${(booking.nights || 1) === 1 ? 'Night' : 'Nights'}</div>
            </div>
            <div>
              <div class="label">Accommodation Type</div>
              <div class="val">${booking.roomType} (${booking.roomCount || 1} ${(booking.roomType || '').includes('Dormitory') ? ((booking.roomCount || 1) === 1 ? 'Bed' : 'Beds') : ((booking.roomCount || 1) === 1 ? 'Room' : 'Rooms')})</div>
            </div>
          </div>

          <div class="amount-box">
            <div class="label" style="margin-bottom: 12px;">Billing & Settlement Breakdown</div>
            
            <div class="bill-row">
              <span>Standard Tariff for ${booking.nights || 1} ${(booking.nights || 1) === 1 ? 'Night' : 'Nights'}:</span>
              <span>₹${bOriginal.toLocaleString('en-IN')}</span>
            </div>

            ${
              bDiscount > 0
                ? `<div class="bill-row discount">
                    <span>Discount Privilege (${booking.discountReason || 'Authorized Courtesy'}):</span>
                    <span>- ₹${bDiscount.toLocaleString('en-IN')}</span>
                  </div>`
                : ''
            }

            <div class="bill-row total">
              <span>Net Settled Amount (${booking.paymentMethod}):</span>
              <span>₹${bFinal.toLocaleString('en-IN')}</span>
            </div>

            <div style="margin-top: 10px; font-size: 12px; color: #475569;">
              Folio Status: <strong>${booking.status}</strong>
            </div>
          </div>

          <div class="footer">
            Official System Generated Document — Wayanad District Police Co-operative Society Ltd. No. W 208.<br/>
            Thank you for staying at Mountain Stay Retreat.
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
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-xs">
        {/* Search */}
        <div className="relative flex-1">
          <span className="absolute left-4 top-3 text-sm text-slate-400">🔍</span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search bookings by ID, guest name, phone, or email..."
            className="w-full rounded-2xl border border-slate-300 bg-white py-2.5 pl-11 pr-4 text-xs text-slate-900 placeholder-slate-400 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition font-medium"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-700"
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
            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:border-blue-600 shadow-2xs cursor-pointer"
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
            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:border-blue-600 shadow-2xs cursor-pointer"
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
            className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 outline-none focus:border-blue-600 shadow-2xs"
          />
          {dateFilter && (
            <button
              onClick={() => setDateFilter('')}
              className="text-xs text-blue-600 hover:text-blue-800 font-bold underline"
            >
              Clear Date
            </button>
          )}

          {/* Action: Walk In */}
          <button
            onClick={onOpenWalkIn}
            className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-blue-500/20 hover:bg-blue-700 transition flex items-center gap-1.5"
          >
            <span>➕</span>
            <span>Walk-In Booking</span>
          </button>
        </div>
      </div>

      {/* Bookings Table */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-extrabold text-slate-900">All Bookings Roster</h3>
            <span className="rounded-full bg-slate-100 border border-slate-200 px-2.5 py-0.5 text-xs font-bold text-slate-700">
              {filtered.length} of {bookings.length}
            </span>
          </div>
          <button
            onClick={onRefresh}
            className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
          >
            <span>🔄</span> Refresh Roster
          </button>
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 p-12 text-center text-slate-500 text-xs font-medium">
            No bookings match the specified filters. Try clearing your search or filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50/70 text-slate-600 font-bold">
                <tr>
                  <th className="py-3 px-3">Reference</th>
                  <th className="py-3 px-3">Guest</th>
                  <th className="py-3 px-3">Stay Dates</th>
                  <th className="py-3 px-3">Accommodation</th>
                  <th className="py-3 px-3">Amount</th>
                  <th className="py-3 px-3">Payment Method</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filtered.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-3">
                      <button
                        onClick={() => setSelectedBooking(b)}
                        className="font-mono font-bold text-blue-700 hover:underline text-left"
                      >
                        {b.id}
                      </button>
                    </td>
                    <td className="py-3.5 px-3">
                      <div className="text-slate-900 font-bold">{b.name}</div>
                      <div className="text-[11px] text-slate-500 font-medium">{b.phone || b.email}</div>
                    </td>
                    <td className="py-3.5 px-3">
                      <div className="text-slate-900 font-semibold">{b.checkInDate || b.date}</div>
                      <div className="text-[11px] text-slate-500 font-medium">
                        {b.checkOutDate ? `to ${b.checkOutDate} (${b.nights || 1}n)` : `${b.nights || 1} night`}
                      </div>
                    </td>
                    <td className="py-3.5 px-3 text-slate-700">
                      <div>{b.roomType}</div>
                      <div className="text-[11px] font-bold text-emerald-700">
                        {b.roomCount || 1} {(b.roomType || '').includes('Dormitory') ? ((b.roomCount || 1) === 1 ? 'Bed' : 'Beds') : ((b.roomCount || 1) === 1 ? 'Room' : 'Rooms')}
                      </div>
                    </td>
                    <td className="py-3.5 px-3">
                      <div className="font-extrabold text-slate-900 text-xs">
                        ₹{(b.amount || 0).toLocaleString('en-IN')}
                      </div>
                      {b.discountAmount > 0 && (
                        <div className="flex items-center gap-1 mt-0.5">
                          <span className="line-through text-slate-400 text-[10px]">
                            ₹{((b.originalAmount || b.amount + b.discountAmount) || 0).toLocaleString('en-IN')}
                          </span>
                          <span className="rounded bg-emerald-50 px-1 py-0.2 text-[9px] font-bold text-emerald-700 border border-emerald-200">
                            -₹{b.discountAmount.toLocaleString('en-IN')} disc.
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-3 text-slate-600 text-[11px]">
                      {b.paymentMethod}
                    </td>
                    <td className="py-3.5 px-3">
                      <select
                        value={b.status}
                        onChange={(e) => handleStatusSelectChange(b, e.target.value)}
                        className={`rounded-lg px-2.5 py-1 text-[11px] font-bold border outline-none bg-white shadow-2xs ${getStatusBadge(
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
                    <td className="py-3.5 px-3 text-right space-x-1.5 whitespace-nowrap">
                      {b.status !== 'Checked Out' && b.status !== 'Cancelled' && (
                        <button
                          onClick={() => handleOpenCheckout(b)}
                          title="Settle Bill & Check Out Guest with Optional Discount"
                          className="rounded-lg bg-indigo-50 hover:bg-indigo-600 hover:text-white px-2 py-1 text-[11px] font-bold text-indigo-700 transition border border-indigo-200 shadow-2xs inline-flex items-center gap-1"
                        >
                          <span>🚪</span>
                          <span>Check Out</span>
                        </button>
                      )}
                      <button
                        onClick={() => setSelectedBooking(b)}
                        title="View Details"
                        className="rounded-lg bg-slate-100 p-1.5 text-slate-700 hover:bg-slate-200 transition border border-slate-200"
                      >
                        👁️
                      </button>
                      <button
                        onClick={() => handlePrintVoucher(b)}
                        title="Print Receipt Voucher"
                        className="rounded-lg bg-slate-100 p-1.5 text-slate-700 hover:bg-slate-200 transition border border-slate-200"
                      >
                        🖨️
                      </button>
                      <button
                        onClick={() => setDeleteConfirmId(b.id)}
                        title="Delete Record"
                        className="rounded-lg bg-rose-50 p-1.5 text-rose-700 hover:bg-rose-600 hover:text-white transition border border-rose-200"
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

      {/* Checkout & Bill Settlement Modal (with Discount options) */}
      {checkoutBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 text-slate-900 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-lg">🚪</span>
                  <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider">
                    Guest Check-Out & Bill Settlement
                  </span>
                </div>
                <h3 className="text-lg font-extrabold text-slate-900 font-mono mt-0.5">
                  {checkoutBooking.id}
                </h3>
              </div>
              <button
                onClick={() => setCheckoutBooking(null)}
                className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
              >
                ✕
              </button>
            </div>

            {/* Guest & Stay Context Card */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3.5 grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-slate-500 block text-[10px] font-bold uppercase">Guest Name</span>
                <span className="font-bold text-slate-900 text-sm">{checkoutBooking.name}</span>
                <div className="text-[11px] text-slate-500 font-mono">{checkoutBooking.phone || 'No phone'}</div>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] font-bold uppercase">Stay Duration</span>
                <span className="font-bold text-slate-900">
                  {checkoutBooking.nights || 1} {(checkoutBooking.nights || 1) === 1 ? 'Night' : 'Nights'}
                </span>
                <div className="text-[11px] text-slate-500">
                  {checkoutBooking.checkInDate || checkoutBooking.date} → {checkoutBooking.checkOutDate || 'Next Day'}
                </div>
              </div>
              <div className="col-span-2 pt-1 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
                <span className="text-slate-600">Accommodation: <strong>{checkoutBooking.roomType}</strong></span>
                <span className="text-slate-600">Current Status: <strong className="text-indigo-700">{checkoutBooking.status}</strong></span>
              </div>
            </div>

            <form onSubmit={handleConfirmCheckout} className="space-y-4">
              {/* Discount Section */}
              <div className="rounded-2xl border border-indigo-100 bg-indigo-50/40 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-base">🏷️</span>
                    <label className="text-xs font-bold text-slate-800">
                      Apply Checkout Discount (Optional)
                    </label>
                  </div>
                  {/* Mode Tabs */}
                  <div className="flex items-center rounded-xl bg-white p-0.5 border border-indigo-200 shadow-2xs text-xs font-bold">
                    <button
                      type="button"
                      onClick={() => setDiscountType('amount')}
                      className={`px-3 py-1 rounded-lg transition ${
                        discountType === 'amount'
                          ? 'bg-indigo-600 text-white'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Flat ₹
                    </button>
                    <button
                      type="button"
                      onClick={() => setDiscountType('percent')}
                      className={`px-3 py-1 rounded-lg transition ${
                        discountType === 'percent'
                          ? 'bg-indigo-600 text-white'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Percent %
                    </button>
                  </div>
                </div>

                {/* Discount Input & Presets */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      {discountType === 'percent' ? 'Discount Percentage (%)' : 'Discount Amount (₹)'}
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-2.5 text-xs text-slate-400 font-bold">
                        {discountType === 'percent' ? '%' : '₹'}
                      </span>
                      <input
                        type="number"
                        min="0"
                        max={discountType === 'percent' ? 100 : grossBill}
                        value={discountVal}
                        onChange={(e) => setDiscountVal(e.target.value)}
                        className="w-full rounded-xl border border-indigo-200 bg-white py-2 pl-8 pr-3 text-sm font-bold text-slate-900 outline-none focus:border-indigo-600 transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Quick Privilege Presets
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setDiscountType('amount');
                          setDiscountVal(0);
                        }}
                        className={`rounded-lg px-2 py-1 text-[10px] font-bold border transition ${
                          computedDiscount === 0
                            ? 'bg-slate-800 text-white border-slate-800'
                            : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                        }`}
                      >
                        None (₹0)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setDiscountType('percent');
                          setDiscountVal(10);
                          setDiscountReason('Extended Stay Courtesy');
                        }}
                        className="rounded-lg bg-white px-2 py-1 text-[10px] font-bold text-indigo-700 border border-indigo-200 hover:bg-indigo-50 transition"
                      >
                        10% Courtesy
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setDiscountType('percent');
                          setDiscountVal(15);
                          setDiscountReason('Police Personnel Privilege');
                        }}
                        className="rounded-lg bg-white px-2 py-1 text-[10px] font-bold text-blue-700 border border-blue-200 hover:bg-blue-50 transition"
                      >
                        15% Police
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setDiscountType('amount');
                          setDiscountVal(500);
                          setDiscountReason('Goodwill / Service Adjustment');
                        }}
                        className="rounded-lg bg-white px-2 py-1 text-[10px] font-bold text-emerald-700 border border-emerald-200 hover:bg-emerald-50 transition"
                      >
                        ₹500 Goodwill
                      </button>
                    </div>
                  </div>
                </div>

                {/* Reason Selection */}
                {computedDiscount > 0 && (
                  <div className="pt-2 border-t border-indigo-100 space-y-2">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Reason for Discount Privilege *
                      </label>
                      <select
                        value={discountReason}
                        onChange={(e) => setDiscountReason(e.target.value)}
                        className="w-full rounded-xl border border-indigo-200 bg-white px-3 py-2 text-xs font-semibold text-slate-900 outline-none focus:border-indigo-600 transition"
                      >
                        <option value="Police Personnel Privilege">
                          Police Department / Society Member Privilege
                        </option>
                        <option value="Extended Stay Courtesy">
                          Extended Stay Courtesy
                        </option>
                        <option value="Co-operative Society Executive Privilege">
                          Co-operative Society Executive Privilege
                        </option>
                        <option value="Goodwill / Service Adjustment">
                          Goodwill / Service Recovery Adjustment
                        </option>
                        <option value="Special Counter Promotion">
                          Special Counter Promotion
                        </option>
                        <option value="Other">Other Custom Reason</option>
                      </select>
                    </div>

                    {discountReason === 'Other' && (
                      <div>
                        <input
                          type="text"
                          required
                          value={customReason}
                          onChange={(e) => setCustomReason(e.target.value)}
                          placeholder="Please enter specific discount approval reason..."
                          className="w-full rounded-xl border border-indigo-200 bg-white px-3 py-2 text-xs text-slate-900 outline-none focus:border-indigo-600 transition"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Settlement Payment Method */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Settlement Payment Method *
                </label>
                <select
                  value={checkoutPaymentMethod}
                  onChange={(e) => setCheckoutPaymentMethod(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-900 outline-none focus:border-indigo-600 transition shadow-2xs"
                >
                  <option value="Cash at Reception">Cash at Reception</option>
                  <option value="UPI / QR Code">UPI / QR Code (Google Pay, PhonePe, Paytm)</option>
                  <option value="Credit / Debit Card (POS)">Credit / Debit Card (Counter POS)</option>
                  <option value="Direct Bank Transfer">Direct Bank Transfer (NEFT/RTGS/IMPS)</option>
                  <option value="Online Pre-payment (Razorpay)">Online Pre-payment (Pre-settled via Razorpay)</option>
                </select>
              </div>

              {/* Net Billing Breakdown Box */}
              <div className="rounded-2xl border border-slate-200 bg-slate-900 p-4 text-white space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-300">
                  <span>Gross Tariff ({checkoutBooking.nights || 1} nights):</span>
                  <span className="font-semibold text-slate-200">₹{grossBill.toLocaleString('en-IN')}</span>
                </div>

                {computedDiscount > 0 && (
                  <div className="flex items-center justify-between text-xs text-emerald-400 font-bold">
                    <span>Discount Deducted:</span>
                    <span>- ₹{computedDiscount.toLocaleString('en-IN')}</span>
                  </div>
                )}

                <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                      Net Settled Amount
                    </span>
                    <span className="text-[10px] text-slate-400">
                      via {checkoutPaymentMethod}
                    </span>
                  </div>
                  <span className="text-2xl font-black text-emerald-400">
                    ₹{netBill.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCheckoutBooking(null)}
                  className="rounded-xl border border-slate-300 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingCheckout}
                  className="rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-indigo-700 transition shadow-md shadow-indigo-600/20 disabled:opacity-50 flex items-center gap-1.5"
                >
                  <span>{isSubmittingCheckout ? '⏳ Settle & Checking Out...' : '✅ Settle & Check Out'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-3xl border border-slate-200 bg-white p-6 text-slate-900 shadow-2xl">
            <h4 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span>⚠️</span>
              <span>Confirm Record Deletion</span>
            </h4>
            <p className="mt-2 text-xs text-slate-600 leading-relaxed">
              Are you sure you want to remove booking <span className="font-mono font-bold text-blue-700">{deleteConfirmId}</span>? This action is recorded in the audit log.
            </p>
            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onDeleteBooking(deleteConfirmId);
                  setDeleteConfirmId(null);
                }}
                className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-700 transition shadow-sm"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Booking Details Drawer / Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 text-slate-900 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">
                  Reservation Details
                </span>
                <h3 className="text-lg font-extrabold text-slate-900 font-mono">{selectedBooking.id}</h3>
              </div>
              <button
                onClick={() => setSelectedBooking(null)}
                className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <span className="text-slate-500 block text-[10px] font-bold uppercase">Guest Full Name</span>
                <span className="text-slate-900 font-bold text-sm">{selectedBooking.name}</span>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <span className="text-slate-500 block text-[10px] font-bold uppercase">Contact Phone</span>
                <span className="text-slate-900 font-bold text-sm">{selectedBooking.phone || 'N/A'}</span>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <span className="text-slate-500 block text-[10px] font-bold uppercase">Email Address</span>
                <span className="text-slate-800 font-semibold">{selectedBooking.email || 'N/A'}</span>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <span className="text-slate-500 block text-[10px] font-bold uppercase">Check-in Date</span>
                <span className="text-slate-800 font-semibold">{selectedBooking.checkInDate || selectedBooking.date}</span>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <span className="text-slate-500 block text-[10px] font-bold uppercase">Check-out Date</span>
                <span className="text-slate-800 font-semibold">{selectedBooking.checkOutDate || 'Next Day'}</span>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <span className="text-slate-500 block text-[10px] font-bold uppercase">Stay Duration</span>
                <span className="text-slate-900 font-bold">{selectedBooking.nights || 1} {(selectedBooking.nights || 1) === 1 ? 'Night' : 'Nights'}</span>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <span className="text-slate-500 block text-[10px] font-bold uppercase">Accommodation Type</span>
                <span className="text-slate-800 font-semibold">{selectedBooking.roomType}</span>
                <span className="text-emerald-700 font-bold block text-xs mt-0.5">
                  {selectedBooking.roomCount || 1} {(selectedBooking.roomType || '').includes('Dormitory') ? ((selectedBooking.roomCount || 1) === 1 ? 'Bed' : 'Beds') : ((selectedBooking.roomCount || 1) === 1 ? 'Room' : 'Rooms')}
                </span>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <span className="text-slate-500 block text-[10px] font-bold uppercase">Payment Status</span>
                <span className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadge(selectedBooking.status)}`}>
                  {selectedBooking.status}
                </span>
              </div>

              {/* Billing Itemization in Details */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 col-span-2 space-y-1.5">
                <span className="text-slate-500 block text-[10px] font-bold uppercase">Billing & Payment Summary</span>
                <div className="flex items-center justify-between text-xs text-slate-700">
                  <span>Gross Tariff:</span>
                  <span className="font-semibold">
                    ₹{((selectedBooking.originalAmount || selectedBooking.amount + (selectedBooking.discountAmount || 0)) || selectedBooking.amount || 0).toLocaleString('en-IN')}
                  </span>
                </div>
                {selectedBooking.discountAmount > 0 && (
                  <div className="flex items-center justify-between text-xs text-emerald-700 font-bold">
                    <span>Discount ({selectedBooking.discountReason || 'Staff privilege'}):</span>
                    <span>- ₹{selectedBooking.discountAmount.toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div className="pt-1.5 border-t border-slate-200 flex items-center justify-between">
                  <span className="font-bold text-slate-900">Net Settled Amount:</span>
                  <span className="text-emerald-700 font-extrabold text-base">
                    ₹{(selectedBooking.amount || 0).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 font-medium">
                  Payment Method: <strong>{selectedBooking.paymentMethod}</strong>
                </div>
              </div>

              {selectedBooking.notes && (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 col-span-2">
                  <span className="text-slate-500 block text-[10px] font-bold uppercase">Staff Notes</span>
                  <span className="text-slate-700">{selectedBooking.notes}</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              {selectedBooking.status !== 'Checked Out' && selectedBooking.status !== 'Cancelled' && (
                <button
                  onClick={() => {
                    const b = selectedBooking;
                    setSelectedBooking(null);
                    handleOpenCheckout(b);
                  }}
                  className="rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-indigo-700 transition flex items-center gap-1.5 shadow-xs"
                >
                  <span>🚪</span> Check Out Guest
                </button>
              )}
              {selectedBooking.phone && (
                <a
                  href={`https://wa.me/${selectedBooking.phone.replace(/\D/g, '')}?text=${encodeURIComponent(
                    `Hello ${selectedBooking.name}, this is Mountain Stay Retreat reception regarding your booking ${selectedBooking.id} for ${selectedBooking.date}.`
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-emerald-700 transition flex items-center gap-1.5 shadow-xs"
                >
                  <span>💬</span> WhatsApp Guest
                </a>
              )}
              <button
                onClick={() => handlePrintVoucher(selectedBooking)}
                className="rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-blue-700 transition flex items-center gap-1.5 shadow-xs"
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
