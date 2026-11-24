import { useMemo } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

export default function BookingWizard({
  bookingStep,
  setBookingStep,
  availabilityChecked,
  checkingAvailability,
  formData,
  handleInputChange,
  handleSuiteCountChange,
  handleDormCountChange,
  suiteCount = 1,
  dormBedCount = 0,
  totalUnits = 1,
  singleSuiteTotal = 2500,
  singleDormTotal = 450,
  suiteSubtotal = 2500,
  dormSubtotal = 0,
  formattedAccommodation = 'Suite Room',
  handleCheckAvailability,
  handleResetStep,
  handleBookingSubmit,
  onOpenLookup,
  availability,
  suitePrice,
  dormPrice,
  nights = 1,
  totalAmount = 2500,
  isSoldOut,
  bookingError,
  isSubmitting,
}) {
  const minCheckInDate = useMemo(() => new Date(), []);
  const minCheckOutDate = useMemo(() => {
    if (formData.checkInDate) {
      const d = new Date(formData.checkInDate + 'T00:00:00');
      d.setDate(d.getDate() + 1);
      return d;
    }
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d;
  }, [formData.checkInDate]);

  const unitSummaryString = useMemo(() => {
    const parts = [];
    if (suiteCount > 0) parts.push(`${suiteCount} ${suiteCount === 1 ? 'Suite' : 'Suites'}`);
    if (dormBedCount > 0) parts.push(`${dormBedCount} ${dormBedCount === 1 ? 'Dorm Bed' : 'Dorm Beds'}`);
    return parts.join(' + ') || '0 Units';
  }, [suiteCount, dormBedCount]);
  return (
    <section id="booking" className="bg-slate-900 px-6 py-20 text-white">
      <div className="mx-auto mb-12 max-w-5xl text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-blue-500/20 border border-blue-400/20 px-4 py-1.5 text-xs sm:text-sm font-semibold text-blue-300">
          <span
            className={`h-2.5 w-2.5 rounded-full ${
              bookingStep === 1 ? 'bg-blue-400 animate-pulse' : 'bg-emerald-400'
            }`}
          ></span>
          {bookingStep === 1
            ? 'Step 1 of 2: Check Availability'
            : 'Step 2 of 2: Guest Details & Confirmation'}
        </div>

        <h3 className="mt-3 mb-4 text-3xl font-extrabold sm:text-4xl md:text-5xl text-white">
          {bookingStep === 1 ? 'Check Room Availability' : 'Complete Your Reservation'}
        </h3>

        <p className="text-sm sm:text-base md:text-lg text-slate-300 max-w-2xl mx-auto">
          {bookingStep === 1
            ? 'Select your arrival & departure dates and accommodation to verify live availability.'
            : 'Fill in your contact information to reserve your room immediately with Pay-at-Counter.'}
        </p>
      </div>

      <div
        className={`mx-auto grid gap-10 ${
          bookingStep === 2 ? 'max-w-5xl lg:grid-cols-2' : 'max-w-xl'
        }`}
      >
        {/* Left Column: Interactive Form */}
        <div className="flex flex-col justify-between rounded-3xl border border-white/10 bg-slate-800/80 p-6 sm:p-8 backdrop-blur-md shadow-2xl">
          {bookingStep === 1 ? (
            /* STEP 1: DATE & ROOM SELECTION */
            <div>
              <div className="mb-6 flex items-center justify-between">
                <h4 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
                  <span>📅</span> Select Stay Dates & Room
                </h4>
                <span className="rounded-full bg-blue-500/20 px-3 py-1 text-xs font-bold text-blue-300">
                  Step 1
                </span>
              </div>

              <form onSubmit={handleCheckAvailability} className="space-y-4">
                {/* Stay Dates (Check-in & Check-out) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-300">
                      Check-in Date *
                    </label>
                    <div className="relative w-full">
                      <DatePicker
                        selected={formData.checkInDate ? new Date(formData.checkInDate + 'T00:00:00') : null}
                        onChange={(date) => {
                          if (!date) {
                            return handleInputChange({ target: { name: 'checkInDate', value: '' } });
                          }
                          const localISOTime = new Date(
                            date.getTime() - date.getTimezoneOffset() * 60000
                          )
                            .toISOString()
                            .split('T')[0];
                          handleInputChange({ target: { name: 'checkInDate', value: localISOTime } });
                        }}
                        dateFormat="dd-MM-yyyy"
                        placeholderText="Check-in (DD-MM-YYYY)"
                        minDate={minCheckInDate}
                        required
                        className="w-full rounded-2xl border border-white/10 bg-slate-900/90 px-4 py-3.5 text-white outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-xs sm:text-sm"
                        wrapperClassName="w-full"
                        popperPlacement="bottom-start"
                      />
                      <div className="pointer-events-none absolute inset-y-0 right-3.5 flex items-center">
                        <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-300">
                      Check-out Date *
                    </label>
                    <div className="relative w-full">
                      <DatePicker
                        selected={formData.checkOutDate ? new Date(formData.checkOutDate + 'T00:00:00') : null}
                        onChange={(date) => {
                          if (!date) {
                            return handleInputChange({ target: { name: 'checkOutDate', value: '' } });
                          }
                          const localISOTime = new Date(
                            date.getTime() - date.getTimezoneOffset() * 60000
                          )
                            .toISOString()
                            .split('T')[0];
                          handleInputChange({ target: { name: 'checkOutDate', value: localISOTime } });
                        }}
                        dateFormat="dd-MM-yyyy"
                        placeholderText="Check-out (DD-MM-YYYY)"
                        minDate={minCheckOutDate}
                        required
                        className="w-full rounded-2xl border border-white/10 bg-slate-900/90 px-4 py-3.5 text-white outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-xs sm:text-sm"
                        wrapperClassName="w-full"
                        popperPlacement="bottom-start"
                      />
                      <div className="pointer-events-none absolute inset-y-0 right-3.5 flex items-center">
                        <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Duration of Stay Callout */}
                {formData.checkInDate && formData.checkOutDate && totalUnits > 0 && (
                  <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-slate-950/80 border border-slate-700/80 px-4 py-3 text-xs">
                    <div className="flex flex-wrap items-center gap-2 text-slate-300">
                      <span className="text-base">🌙</span>
                      <span>Stay Duration:</span>
                      <span className="font-bold text-white bg-blue-600/40 border border-blue-500/40 px-2.5 py-0.5 rounded-full">
                        {nights} {nights === 1 ? 'Night' : 'Nights'}
                      </span>
                      {suiteCount > 0 && (
                        <span className="font-bold text-blue-300 bg-blue-600/30 border border-blue-500/40 px-2 py-0.5 rounded-full">
                          {suiteCount} {suiteCount === 1 ? 'Suite Room' : 'Suite Rooms'}
                        </span>
                      )}
                      {dormBedCount > 0 && (
                        <span className="font-bold text-emerald-300 bg-emerald-600/30 border border-emerald-500/40 px-2 py-0.5 rounded-full">
                          {dormBedCount} {dormBedCount === 1 ? 'Dorm Bed' : 'Dorm Beds'}
                        </span>
                      )}
                    </div>
                    <div className="text-right text-slate-300">
                      <span className="text-slate-400">Total: </span>
                      <span className="font-extrabold text-emerald-400 text-sm">
                        ₹{totalAmount.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                )}

                {/* Simultaneous Room & Bed Accommodation Selection Cards */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                      Select Rooms & Beds (Book One or Both at Once) *
                    </label>
                    <span className="text-xs font-semibold text-slate-400">
                      Total: <strong className="text-emerald-400 font-bold">{totalUnits} {totalUnits === 1 ? 'Unit' : 'Units'}</strong>
                    </span>
                  </div>

                  {/* Card 1: Executive Suites */}
                  <div className={`rounded-2xl border p-4 transition ${
                    suiteCount > 0 ? 'border-blue-500/60 bg-blue-950/30 ring-1 ring-blue-500/20' : 'border-white/10 bg-slate-900/60'
                  }`}>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xl">🏨</span>
                          <span className="font-bold text-white text-sm sm:text-base">Executive Suite Room</span>
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold border ${
                            availability.availableSuites > 0
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                              : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                          }`}>
                            {availability.availableSuites} / 5 Available
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">
                          ₹{suitePrice.toLocaleString('en-IN')} / night • Premium private suite with king bed & balcony
                        </p>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-3.5">
                        {suiteCount > 0 && formData.checkInDate && formData.checkOutDate && (
                          <div className="text-right">
                            <span className="block text-xs font-bold text-blue-300">
                              ₹{suiteSubtotal.toLocaleString('en-IN')}
                            </span>
                            <span className="text-[10px] text-slate-400 block">
                              ({suiteCount} × ₹{Math.round(singleSuiteTotal / nights)}/n)
                            </span>
                          </div>
                        )}
                        <div className="flex items-center rounded-xl bg-slate-950 border border-slate-700/80 p-1">
                          <button
                            type="button"
                            onClick={() => handleSuiteCountChange(suiteCount - 1)}
                            disabled={suiteCount <= 0}
                            title="Decrease suite count"
                            className="h-8 w-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold transition flex items-center justify-center text-sm disabled:opacity-30 disabled:hover:bg-slate-800 cursor-pointer"
                          >
                            −
                          </button>
                          <span className="w-12 text-center font-bold text-white text-sm">
                            {suiteCount}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleSuiteCountChange(suiteCount + 1)}
                            disabled={suiteCount >= availability.availableSuites}
                            title="Increase suite count"
                            className="h-8 w-8 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold transition flex items-center justify-center text-sm disabled:opacity-30 disabled:hover:bg-blue-600 cursor-pointer"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card 2: Dormitory Beds */}
                  <div className={`rounded-2xl border p-4 transition ${
                    dormBedCount > 0 ? 'border-emerald-500/60 bg-emerald-950/30 ring-1 ring-emerald-500/20' : 'border-white/10 bg-slate-900/60'
                  }`}>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xl">🛏️</span>
                          <span className="font-bold text-white text-sm sm:text-base">Dormitory Bed</span>
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold border ${
                            availability.availableDormBeds > 0
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                              : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                          }`}>
                            {availability.availableDormBeds} / 15 Available
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">
                          ₹{dormPrice.toLocaleString('en-IN')} / night • Shared bunk bed with personal locker & charging point
                        </p>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-3.5">
                        {dormBedCount > 0 && formData.checkInDate && formData.checkOutDate && (
                          <div className="text-right">
                            <span className="block text-xs font-bold text-emerald-300">
                              ₹{dormSubtotal.toLocaleString('en-IN')}
                            </span>
                            <span className="text-[10px] text-slate-400 block">
                              ({dormBedCount} × ₹{Math.round(singleDormTotal / nights)}/n)
                            </span>
                          </div>
                        )}
                        <div className="flex items-center rounded-xl bg-slate-950 border border-slate-700/80 p-1">
                          <button
                            type="button"
                            onClick={() => handleDormCountChange(dormBedCount - 1)}
                            disabled={dormBedCount <= 0}
                            title="Decrease dorm bed count"
                            className="h-8 w-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold transition flex items-center justify-center text-sm disabled:opacity-30 disabled:hover:bg-slate-800 cursor-pointer"
                          >
                            −
                          </button>
                          <span className="w-12 text-center font-bold text-white text-sm">
                            {dormBedCount}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleDormCountChange(dormBedCount + 1)}
                            disabled={dormBedCount >= availability.availableDormBeds}
                            title="Increase dorm bed count"
                            className="h-8 w-8 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition flex items-center justify-center text-sm disabled:opacity-30 disabled:hover:bg-emerald-600 cursor-pointer"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {availabilityChecked && totalUnits < 1 && (
                  <div className="rounded-2xl border border-rose-500/40 bg-rose-500/10 p-3.5 text-xs text-rose-300 font-semibold">
                    ⚠️ Please select at least 1 Suite Room or 1 Dormitory Bed above to continue.
                  </div>
                )}

                {availabilityChecked && isSoldOut && (
                  <div className="rounded-2xl border border-rose-500/40 bg-rose-500/10 p-4 text-xs text-rose-300 font-semibold">
                    ⚠️ Selected accommodation category is completely <strong>Sold Out</strong> or exceeds available capacity on {formData.checkInDate}. Please adjust counts.
                  </div>
                )}

                {!availabilityChecked || isSoldOut ? (
                  <button
                    type="submit"
                    disabled={checkingAvailability}
                    className="w-full rounded-2xl bg-blue-600 py-4 text-base sm:text-lg font-bold text-white shadow-lg transition hover:bg-blue-700 disabled:opacity-50"
                  >
                    {checkingAvailability ? 'Checking Availability...' : '🔍 Check Live Availability'}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setBookingStep(2)}
                    className="w-full rounded-2xl bg-emerald-600 py-4 text-base sm:text-lg font-bold text-white shadow-lg transition hover:bg-emerald-700"
                  >
                    Continue to Reservation ➔
                  </button>
                )}
              </form>
            </div>
          ) : (
            /* STEP 2: GUEST DETAILS */
            <div>
              <div className="mb-5 flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <h4 className="text-lg sm:text-xl font-bold text-emerald-400 flex items-center gap-1.5">
                    <span>✅ Accommodation Available!</span>
                  </h4>
                  <p className="text-xs text-slate-300 mt-1">
                    {formattedAccommodation} • {formData.checkInDate} to {formData.checkOutDate} ({nights} {nights === 1 ? 'night' : 'nights'})
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleResetStep}
                  className="rounded-xl border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-white/20 transition"
                >
                  ← Change Selection
                </button>
              </div>

              <form onSubmit={handleBookingSubmit} className="space-y-4">
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-300">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    placeholder="e.g. Anand Kumar"
                    required
                    className="w-full rounded-2xl border border-white/10 bg-slate-900/90 px-5 py-3.5 text-white placeholder-slate-500 outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-300">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="e.g. anand@example.com"
                    required
                    className="w-full rounded-2xl border border-white/10 bg-slate-900/90 px-5 py-3.5 text-white placeholder-slate-500 outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-300">
                    Contact Phone (WhatsApp) *
                  </label>
                  <div className="flex gap-2">
                    <div className="relative shrink-0 w-36">
                      <select
                        name="countryCode"
                        value={formData.countryCode || '+91'}
                        onChange={handleInputChange}
                        className="w-full appearance-none rounded-2xl border border-white/10 bg-slate-900 px-3.5 py-3.5 text-xs font-bold text-white outline-none focus:border-blue-500 cursor-pointer"
                      >
                        <option value="+91" className="bg-slate-800 text-white">🇮🇳 +91 (India)</option>
                        <option value="+971" className="bg-slate-800 text-white">🇦🇪 +971 (UAE)</option>
                        <option value="+966" className="bg-slate-800 text-white">🇸🇦 +966 (KSA)</option>
                        <option value="+974" className="bg-slate-800 text-white">🇶🇦 +974 (Qatar)</option>
                        <option value="+968" className="bg-slate-800 text-white">🇴🇲 +968 (Oman)</option>
                        <option value="+965" className="bg-slate-800 text-white">🇰🇼 +965 (Kuwait)</option>
                        <option value="+1" className="bg-slate-800 text-white">🇺🇸 +1 (USA/CA)</option>
                        <option value="+44" className="bg-slate-800 text-white">🇬🇧 +44 (UK)</option>
                        <option value="+65" className="bg-slate-800 text-white">🇸🇬 +65 (SG)</option>
                        <option value="+61" className="bg-slate-800 text-white">🇦🇺 +61 (AU)</option>
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center text-xs text-slate-400">
                        ▼
                      </div>
                    </div>

                    <div className="relative flex-1">
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        placeholder="e.g. 98450 12345"
                        maxLength="15"
                        required
                        className="w-full rounded-2xl border border-white/10 bg-slate-900/90 px-5 py-3.5 text-white placeholder-slate-500 outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Summary Box */}
                <div className="rounded-2xl border border-slate-700/80 bg-slate-950/80 p-4 space-y-2.5">
                  <div className="flex items-center justify-between text-xs text-slate-300">
                    <span>Stay Duration:</span>
                    <span className="font-semibold text-white">
                      {nights} {nights === 1 ? 'Night' : 'Nights'} ({formData.checkInDate} to {formData.checkOutDate})
                    </span>
                  </div>
                  <div className="border-t border-slate-800/80 pt-2 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      <span>Reserved Accommodations</span>
                      <span className="text-indigo-400 font-semibold normal-case tracking-normal">({unitSummaryString})</span>
                    </div>
                    {suiteCount > 0 && (
                      <div className="flex items-center justify-between text-xs text-slate-200">
                        <span>🏨 {suiteCount} × Executive Suite Room ({nights}n):</span>
                        <span className="font-bold text-blue-300">₹{suiteSubtotal.toLocaleString('en-IN')}</span>
                      </div>
                    )}
                    {dormBedCount > 0 && (
                      <div className="flex items-center justify-between text-xs text-slate-200">
                        <span>🛏️ {dormBedCount} × Dormitory Bed ({nights}n):</span>
                        <span className="font-bold text-emerald-300">₹{dormSubtotal.toLocaleString('en-IN')}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-300 border-t border-slate-800/80 pt-2">
                    <span>Payment Option:</span>
                    <span className="font-bold text-emerald-400">
                      🏨 Pay at Counter / Arrival
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between border-t border-slate-700 pt-2.5 text-sm font-semibold">
                    <span>Total Amount Due:</span>
                    <span className="text-xl font-extrabold text-emerald-400">
                      ₹{totalAmount.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                {bookingError && (
                  <div className="rounded-2xl border border-rose-500/40 bg-rose-500/20 p-3.5 text-xs text-rose-300 font-semibold flex items-start gap-2">
                    <span className="text-base shrink-0">⚠️</span>
                    <span>{bookingError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`w-full rounded-2xl py-4 text-base sm:text-lg font-bold shadow-lg transition duration-200 bg-emerald-600 hover:bg-emerald-700 text-white ${
                    isSubmitting ? 'opacity-75 cursor-not-allowed' : ''
                  }`}
                >
                  {isSubmitting
                    ? 'Confirming Reservation...'
                    : '🏨 Confirm Reservation (Pay at Counter)'}
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Right Column: Payment Method Explanation */}
        {bookingStep === 2 && (
          <div className="flex flex-col justify-between rounded-3xl bg-white p-6 sm:p-8 text-slate-800 shadow-2xl">
            <div>
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h4 className="text-xl sm:text-2xl font-bold text-slate-900">
                    Payment Options
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-500">
                    Pay at Counter is currently active for all room reservations
                  </p>
                </div>
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
                  Active
                </span>
              </div>

              <div className="space-y-4">
                {/* Active Option: Pay at Counter */}
                <div className="relative rounded-2xl border-2 border-emerald-600 bg-emerald-50/70 p-5 shadow-sm ring-2 ring-emerald-600/10">
                  <div className="flex items-start gap-3.5">
                    <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white text-xs font-bold">
                      ✓
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h5 className="font-bold text-slate-900">
                          🏨 Pay at Counter / Property
                        </h5>
                        <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-bold text-blue-700">
                          Instant
                        </span>
                      </div>
                      <p className="mt-1 text-xs leading-relaxed text-slate-600">
                        Reserve your stay without advance online card deduction. Settle conveniently with cash or UPI QR at the front desk upon arrival.
                      </p>

                      <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-slate-700">
                        <span className="rounded-lg bg-white px-2.5 py-1 border border-slate-200">
                          💵 Cash at Desk
                        </span>
                        <span className="rounded-lg bg-white px-2.5 py-1 border border-slate-200">
                          ⚡ UPI QR (GPay / PhonePe / Paytm)
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Razorpay Integration: Temporarily On Hold */}
                <div className="relative rounded-2xl border border-amber-200/80 bg-amber-50/40 p-5 select-none">
                  <div className="flex items-start gap-3.5">
                    <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700 text-xs font-bold border border-amber-300">
                      ⏸️
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h5 className="font-semibold text-slate-700">
                          💳 Online Pre-payment (Razorpay)
                        </h5>
                        <span className="rounded-full bg-amber-100 border border-amber-300 px-2.5 py-0.5 text-[10px] font-bold text-amber-800">
                          Temporarily On Hold
                        </span>
                      </div>
                      <p className="mt-1 text-xs leading-relaxed text-slate-600">
                        Online gateway transactions are temporarily on hold. You can reserve your room immediately with zero prepayment — settle conveniently via UPI QR or Cash at the front desk upon arrival.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 rounded-2xl bg-slate-50 p-4 border border-slate-200/80 text-xs text-slate-600">
              🔒 <strong>Process Guarantee:</strong> Room reservation is held immediately under your name. Pay comfortably upon your arrival.
            </div>
          </div>
        )}

        {/* Global lookup banner for existing reservations */}
        {onOpenLookup && (
          <div className="mt-8 text-center">
            <button
              type="button"
              onClick={onOpenLookup}
              className="inline-flex items-center gap-2 rounded-full border border-blue-400/30 bg-blue-500/10 px-5 py-2.5 text-xs sm:text-sm font-semibold text-blue-300 hover:bg-blue-500/20 hover:text-white transition shadow-sm"
            >
              <span>🔍</span>
              <span>Already made a reservation? <strong>Find Booking Details & Status →</strong></span>
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
