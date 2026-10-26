export default function BookingModal({ bookingConfirmation, onClose }) {
  if (!bookingConfirmation) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md overflow-hidden rounded-3xl bg-white p-6 sm:p-8 text-slate-800 shadow-2xl">
        <div className="text-center">
          <img
            src={`${(import.meta.env.BASE_URL || './').replace(/\/+$/, '')}/logo.png`}
            alt="Mountain Stay Retreat"
            className="mx-auto mb-3 h-16 w-16 rounded-full object-contain border border-slate-200 shadow-sm bg-white"
          />
          <h3 className="text-2xl font-bold text-slate-900">
            Booking Confirmed!
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Thank you for choosing Mountain Stay Retreat.
          </p>
        </div>

        <div className="my-6 space-y-2.5 rounded-2xl bg-slate-50 p-5 text-xs sm:text-sm border border-slate-200/80">
          <div className="flex justify-between border-b border-slate-200 pb-2">
            <span className="text-slate-500">Booking Ref ID:</span>
            <span className="font-mono font-bold text-slate-900">{bookingConfirmation.bookingId}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Guest Name:</span>
            <span className="font-semibold text-slate-800">{bookingConfirmation.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Contact Number:</span>
            <span className="font-semibold text-slate-800">{bookingConfirmation.phone || 'N/A'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Check-in Date:</span>
            <span className="font-semibold text-slate-800">{bookingConfirmation.date}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Accommodation:</span>
            <span className="font-semibold text-slate-800">{bookingConfirmation.roomType}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Total Amount:</span>
            <span className="font-bold text-slate-900">₹{(bookingConfirmation.amount || 0).toLocaleString('en-IN')}</span>
          </div>
          <div className="flex justify-between items-center pt-2 border-t border-slate-200">
            <span className="text-slate-500">Payment Status:</span>
            <span
              className={`rounded-full px-3 py-1 text-xs font-bold ${
                bookingConfirmation.status.includes('Paid')
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-amber-100 text-amber-800'
              }`}
            >
              {bookingConfirmation.status}
            </span>
          </div>
        </div>

        <div className="mb-4 rounded-2xl border border-blue-200 bg-blue-50/80 p-3.5 text-xs text-blue-900 flex items-start gap-2.5">
          <span className="text-base shrink-0">🛎️</span>
          <div>
            <strong className="block font-semibold">Front Desk Reservation Alert:</strong>
            <span>Mountain Stay Retreat front desk has recorded your reservation. Please show your Booking ID at check-in.</span>
          </div>
        </div>

        <div className="space-y-2.5">
          <a
            href={`https://wa.me/917025017611?text=${encodeURIComponent(
              `🏨 *Mountain Stay Retreat - New Reservation Alert*\n\n` +
                `• *Booking ID:* ${bookingConfirmation.bookingId}\n` +
                `• *Guest Name:* ${bookingConfirmation.name}\n` +
                `• *Contact Number:* ${bookingConfirmation.phone}\n` +
                `• *Email:* ${bookingConfirmation.email}\n` +
                `• *Check-in Date:* ${bookingConfirmation.date}\n` +
                `• *Accommodation:* ${bookingConfirmation.roomType}\n` +
                `• *Total Due:* ₹${(bookingConfirmation.amount || 0).toLocaleString('en-IN')}\n` +
                `• *Payment Status:* ${bookingConfirmation.status}\n\n` +
                `Please confirm room readiness. Thank you!`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-3 text-xs sm:text-sm font-bold text-white shadow-md hover:bg-emerald-700 transition"
          >
            <span>💬 WhatsApp Reception (+91 70250 17611)</span>
          </a>

          <button
            type="button"
            onClick={() => window.print()}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-300 bg-white py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
          >
            <span>🖨️ Print / Save Booking Receipt</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-2xl bg-slate-900 py-3 text-xs sm:text-sm font-bold text-white transition hover:bg-slate-800"
          >
            Done & Return to Site
          </button>
        </div>
      </div>
    </div>
  );
}
