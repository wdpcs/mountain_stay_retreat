export default function DashboardOverview({ stats, onNavigate, onOpenWalkIn, onStatusChange }) {
  if (!stats) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-3 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  const occupancyPct = stats.occupancyPercentage || 0;
  const suitesAvailable = stats.availableSuites !== undefined ? stats.availableSuites : 5;
  const totalSuites = stats.totalSuites || 5;
  const dormAvailable = stats.availableDormBeds !== undefined ? stats.availableDormBeds : 15;
  const totalDormBeds = stats.totalDormBeds || 15;

  return (
    <div className="space-y-6">
      {/* Top Banner with Quick Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-3xl border border-blue-200/80 bg-gradient-to-r from-blue-50 via-indigo-50/50 to-white p-6 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">📅</span>
            <span className="text-xs font-bold uppercase tracking-wider text-blue-700">
              Operations Overview
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
            Mountain Stay Retreat Console
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 font-medium mt-0.5">
            Real-time accommodation status for today ({stats.todayDate || new Date().toISOString().split('T')[0]})
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={onOpenWalkIn}
            className="rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-500/20 hover:bg-blue-700 transition flex items-center gap-2"
          >
            <span>➕</span>
            <span>New Walk-in Reservation</span>
          </button>

          <button
            onClick={() => onNavigate('calendar')}
            className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition flex items-center gap-1.5 shadow-2xs"
          >
            <span>🗓️</span>
            <span>Availability Calendar</span>
          </button>

          <button
            onClick={() => onNavigate('reports')}
            className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition flex items-center gap-1.5 shadow-2xs"
          >
            <span>📑</span>
            <span>Daily Manifest Sheet</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today's Check-ins */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Today's Check-ins
            </span>
            <div className="h-9 w-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-lg border border-blue-100">
              🛎️
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">
              {stats.todayCheckInsCount || 0}
            </span>
            <span className="text-xs text-slate-500 font-semibold">Guests Scheduled</span>
          </div>
          <p className="mt-2 text-xs text-blue-700 font-semibold">
            Ready for reception check-in
          </p>
        </div>

        {/* Today's Check-outs */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              In-House / Check-outs
            </span>
            <div className="h-9 w-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-lg border border-indigo-100">
              🚪
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">
              {stats.todayCheckOutsCount || 0}
            </span>
            <span className="text-xs text-slate-500 font-semibold">Currently In-House</span>
          </div>
          <p className="mt-2 text-xs text-indigo-700 font-semibold">
            Checkout by 12:00 PM standard
          </p>
        </div>

        {/* Current Occupancy */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Occupancy Rate
            </span>
            <div className="h-9 w-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-lg border border-emerald-100">
              📊
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">
              {occupancyPct}%
            </span>
            <span className="text-xs text-slate-500 font-semibold">
              ({stats.totalOccupied || 0} / {stats.totalCapacity || 20} Occupied)
            </span>
          </div>
          <div className="mt-3 w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(0, occupancyPct))}%` }}
            ></div>
          </div>
        </div>

        {/* Revenue Summary */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Total Revenue
            </span>
            <div className="h-9 w-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center text-lg border border-amber-100">
              💰
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              ₹{(stats.revenue?.total || 0).toLocaleString('en-IN')}
            </span>
          </div>
          <p className="mt-2 text-xs text-slate-600 font-medium">
            Online: <strong>₹{(stats.revenue?.online || 0).toLocaleString('en-IN')}</strong> | Counter: <strong>₹{(stats.revenue?.counter || 0).toLocaleString('en-IN')}</strong>
          </p>
        </div>
      </div>

      {/* Secondary Metrics: Inventory & Bookings Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Available Suite Rooms */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold mb-2">
            <span>Premium & Family Suites</span>
            <span className="text-blue-700">₹{stats.roomPrices?.suitePrice || 2500}/night</span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <span className="text-3xl font-extrabold text-slate-900">{suitesAvailable}</span>
              <span className="text-xs text-slate-500 font-semibold ml-1">/ {totalSuites} Available</span>
            </div>
            <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
              suitesAvailable > 0
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-rose-50 text-rose-700 border border-rose-200'
            }`}>
              {suitesAvailable > 0 ? 'Bookable' : 'Sold Out'}
            </span>
          </div>
          {stats.maintenanceSuites > 0 && (
            <p className="text-[11px] text-amber-700 font-semibold mt-2">
              ⚠️ {stats.maintenanceSuites} suite(s) under maintenance
            </p>
          )}
        </div>

        {/* Available Dormitory Beds */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold mb-2">
            <span>Dormitory Beds</span>
            <span className="text-blue-700">₹{stats.roomPrices?.dormPrice || 450}/night</span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <span className="text-3xl font-extrabold text-slate-900">{dormAvailable}</span>
              <span className="text-xs text-slate-500 font-semibold ml-1">/ {totalDormBeds} Available</span>
            </div>
            <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
              dormAvailable > 0
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-rose-50 text-rose-700 border border-rose-200'
            }`}>
              {dormAvailable > 0 ? 'Bookable' : 'Sold Out'}
            </span>
          </div>
          {stats.maintenanceDormBeds > 0 && (
            <p className="text-[11px] text-amber-700 font-semibold mt-2">
              ⚠️ {stats.maintenanceDormBeds} bed(s) under maintenance
            </p>
          )}
        </div>

        {/* Confirmed Bookings */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="text-xs text-slate-500 font-semibold mb-2">Confirmed Active</div>
          <div className="flex items-center justify-between">
            <span className="text-3xl font-extrabold text-emerald-600">{stats.confirmedBookings || 0}</span>
            <span className="text-xs text-slate-500 font-semibold">of {stats.totalBookings || 0} total</span>
          </div>
          <p className="text-[11px] text-slate-500 font-medium mt-2">
            Pre-paid or verified at counter
          </p>
        </div>

        {/* Pending Bookings */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="text-xs text-slate-500 font-semibold mb-2">Pending Reservations</div>
          <div className="flex items-center justify-between">
            <span className="text-3xl font-extrabold text-amber-600">{stats.pendingBookings || 0}</span>
            <button
              onClick={() => onNavigate('bookings')}
              className="text-xs text-blue-600 hover:text-blue-800 font-bold"
            >
              Review List →
            </button>
          </div>
          <p className="text-[11px] text-slate-500 font-medium mt-2">
            Awaiting arrival payment or confirmation
          </p>
        </div>
      </div>

      {/* Today's Check-in Manifest Table */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <span>🛎️</span>
              <span>Today's Expected Arrivals</span>
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Front desk check-in manifest for today
            </p>
          </div>
          <button
            onClick={() => onNavigate('bookings')}
            className="text-xs font-bold text-blue-600 hover:text-blue-800"
          >
            View All Reservations →
          </button>
        </div>

        {(!stats.todayCheckIns || stats.todayCheckIns.length === 0) ? (
          <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-slate-500 text-xs font-medium">
            No pending arrivals scheduled for today ({stats.todayDate}).
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50/70 text-slate-600 font-bold">
                <tr>
                  <th className="py-3 px-3">Booking ID</th>
                  <th className="py-3 px-3">Guest Name</th>
                  <th className="py-3 px-3">Contact</th>
                  <th className="py-3 px-3">Accommodation</th>
                  <th className="py-3 px-3">Amount</th>
                  <th className="py-3 px-3">Payment</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-right">Quick Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {stats.todayCheckIns.map((booking) => (
                  <tr key={booking.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-3 font-mono font-bold text-blue-700">{booking.id}</td>
                    <td className="py-3.5 px-3 text-slate-900 font-bold">{booking.name}</td>
                    <td className="py-3.5 px-3 text-slate-600">
                      <a href={`tel:${booking.phone}`} className="hover:text-blue-600 font-semibold">{booking.phone}</a>
                    </td>
                    <td className="py-3.5 px-3 text-slate-700">{booking.roomType}</td>
                    <td className="py-3.5 px-3 font-extrabold text-slate-900">₹{(booking.amount || 0).toLocaleString('en-IN')}</td>
                    <td className="py-3.5 px-3">
                      <span className="text-[11px] text-slate-600 font-medium">{booking.paymentMethod}</span>
                    </td>
                    <td className="py-3.5 px-3">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        booking.status === 'Checked In'
                          ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                          : booking.status === 'Paid Online'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-50 text-amber-800 border border-amber-200'
                      }`}>
                        {booking.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-right">
                      {booking.status !== 'Checked In' ? (
                        <button
                          onClick={() => onStatusChange(booking.id, 'Checked In')}
                          className="rounded-xl bg-emerald-600 px-3.5 py-1.5 text-[11px] font-bold text-white hover:bg-emerald-700 transition shadow-xs"
                        >
                          Check In Guest
                        </button>
                      ) : (
                        <button
                          onClick={() => onStatusChange(booking.id, 'Checked Out')}
                          className="rounded-xl bg-slate-200 px-3.5 py-1.5 text-[11px] font-bold text-slate-700 hover:bg-slate-300 transition"
                        >
                          Check Out
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
