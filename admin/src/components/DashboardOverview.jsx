export default function DashboardOverview({ stats, onNavigate, onOpenWalkIn, onStatusChange }) {
  if (!stats) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-3xl border border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900 to-blue-950/40 p-6 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">📅</span>
            <span className="text-xs font-bold uppercase tracking-wider text-blue-400">
              Operations Overview
            </span>
          </div>
          <h2 className="text-2xl font-bold text-white mt-1">
            Mountain Stay Retreat Console
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time accommodation status for today ({stats.todayDate || new Date().toISOString().split('T')[0]})
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={onOpenWalkIn}
            className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-blue-600/30 hover:from-blue-500 hover:to-indigo-500 transition flex items-center gap-2"
          >
            <span>➕</span>
            <span>New Walk-in Reservation</span>
          </button>

          <button
            onClick={() => onNavigate('calendar')}
            className="rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2.5 text-xs font-bold text-slate-200 hover:bg-slate-700 transition flex items-center gap-1.5"
          >
            <span>🗓️</span>
            <span>Availability Calendar</span>
          </button>

          <button
            onClick={() => onNavigate('reports')}
            className="rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2.5 text-xs font-bold text-slate-200 hover:bg-slate-700 transition flex items-center gap-1.5"
          >
            <span>📑</span>
            <span>Daily Manifest Sheet</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today's Check-ins */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5 shadow-lg relative overflow-hidden group hover:border-blue-500/50 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Today's Check-ins
            </span>
            <div className="h-9 w-9 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center text-lg">
              🛎️
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white">
              {stats.todayCheckInsCount || 0}
            </span>
            <span className="text-xs text-slate-400 font-medium">Guests Scheduled</span>
          </div>
          <p className="mt-2 text-xs text-blue-400 font-medium">
            Ready for reception check-in
          </p>
        </div>

        {/* Today's Check-outs */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5 shadow-lg relative overflow-hidden group hover:border-indigo-500/50 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              In-House / Check-outs
            </span>
            <div className="h-9 w-9 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center text-lg">
              🚪
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white">
              {stats.todayCheckOutsCount || 0}
            </span>
            <span className="text-xs text-slate-400 font-medium">Currently In-House</span>
          </div>
          <p className="mt-2 text-xs text-indigo-400 font-medium">
            Checkout by 12:00 PM standard
          </p>
        </div>

        {/* Current Occupancy */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5 shadow-lg relative overflow-hidden group hover:border-emerald-500/50 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Occupancy Rate
            </span>
            <div className="h-9 w-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center text-lg">
              📊
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white">
              {occupancyPct}%
            </span>
            <span className="text-xs text-slate-400 font-medium">
              ({stats.totalOccupied || 0} / {stats.totalCapacity || 20} Occupied)
            </span>
          </div>
          <div className="mt-2 w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(0, occupancyPct))}%` }}
            ></div>
          </div>
        </div>

        {/* Revenue Summary */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5 shadow-lg relative overflow-hidden group hover:border-amber-500/50 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Total Revenue
            </span>
            <div className="h-9 w-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center text-lg">
              💰
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-white">
              ₹{(stats.revenue?.total || 0).toLocaleString('en-IN')}
            </span>
          </div>
          <p className="mt-2 text-xs text-amber-400/90 font-medium">
            Online: ₹{(stats.revenue?.online || 0).toLocaleString('en-IN')} | Counter: ₹{(stats.revenue?.counter || 0).toLocaleString('en-IN')}
          </p>
        </div>
      </div>

      {/* Secondary Metrics: Inventory & Bookings Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Available Suite Rooms */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium mb-2">
            <span>Premium & Family Suites</span>
            <span>Rate: ₹{stats.roomPrices?.suitePrice || 2500}/night</span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <span className="text-3xl font-extrabold text-white">{suitesAvailable}</span>
              <span className="text-xs text-slate-400 ml-1">/ {totalSuites} Available</span>
            </div>
            <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
              suitesAvailable > 0 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
            }`}>
              {suitesAvailable > 0 ? 'Bookable' : 'Sold Out'}
            </span>
          </div>
          {stats.maintenanceSuites > 0 && (
            <p className="text-[11px] text-amber-400 mt-2">
              ⚠️ {stats.maintenanceSuites} suite(s) under maintenance
            </p>
          )}
        </div>

        {/* Available Dormitory Beds */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium mb-2">
            <span>Dormitory Beds</span>
            <span>Rate: ₹{stats.roomPrices?.dormPrice || 450}/night</span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <span className="text-3xl font-extrabold text-white">{dormAvailable}</span>
              <span className="text-xs text-slate-400 ml-1">/ {totalDormBeds} Available</span>
            </div>
            <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
              dormAvailable > 0 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
            }`}>
              {dormAvailable > 0 ? 'Bookable' : 'Sold Out'}
            </span>
          </div>
          {stats.maintenanceDormBeds > 0 && (
            <p className="text-[11px] text-amber-400 mt-2">
              ⚠️ {stats.maintenanceDormBeds} bed(s) under maintenance
            </p>
          )}
        </div>

        {/* Confirmed Bookings */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5">
          <div className="text-xs text-slate-400 font-medium mb-2">Confirmed Active</div>
          <div className="flex items-center justify-between">
            <span className="text-3xl font-extrabold text-emerald-400">{stats.confirmedBookings || 0}</span>
            <span className="text-xs text-slate-500">of {stats.totalBookings || 0} total</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            Pre-paid or verified at counter
          </p>
        </div>

        {/* Pending Bookings */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5">
          <div className="text-xs text-slate-400 font-medium mb-2">Pending Reservations</div>
          <div className="flex items-center justify-between">
            <span className="text-3xl font-extrabold text-amber-400">{stats.pendingBookings || 0}</span>
            <button
              onClick={() => onNavigate('bookings')}
              className="text-xs text-blue-400 hover:underline font-semibold"
            >
              Review List →
            </button>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            Awaiting arrival payment or confirmation
          </p>
        </div>
      </div>

      {/* Today's Check-in Manifest Table */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span>🛎️</span>
              <span>Today's Expected Arrivals</span>
            </h3>
            <p className="text-xs text-slate-400">
              Front desk check-in manifest for today
            </p>
          </div>
          <button
            onClick={() => onNavigate('bookings')}
            className="text-xs text-blue-400 hover:text-blue-300 font-semibold"
          >
            View All Reservations →
          </button>
        </div>

        {(!stats.todayCheckIns || stats.todayCheckIns.length === 0) ? (
          <div className="rounded-2xl border border-dashed border-slate-800 p-8 text-center text-slate-500 text-xs">
            No pending arrivals scheduled for today ({stats.todayDate}).
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 text-slate-400 font-semibold">
                <tr>
                  <th className="pb-3">Booking ID</th>
                  <th className="pb-3">Guest Name</th>
                  <th className="pb-3">Contact</th>
                  <th className="pb-3">Accommodation</th>
                  <th className="pb-3">Amount</th>
                  <th className="pb-3">Payment</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 text-right">Quick Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {stats.todayCheckIns.map((booking) => (
                  <tr key={booking.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 font-mono font-bold text-blue-400">{booking.id}</td>
                    <td className="py-3 text-white font-semibold">{booking.name}</td>
                    <td className="py-3 text-slate-300">
                      <a href={`tel:${booking.phone}`} className="hover:underline">{booking.phone}</a>
                    </td>
                    <td className="py-3 text-slate-300">{booking.roomType}</td>
                    <td className="py-3 font-bold text-white">₹{(booking.amount || 0).toLocaleString('en-IN')}</td>
                    <td className="py-3">
                      <span className="text-[11px] text-slate-400">{booking.paymentMethod}</span>
                    </td>
                    <td className="py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        booking.status === 'Checked In'
                          ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                          : booking.status === 'Paid Online'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}>
                        {booking.status}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      {booking.status !== 'Checked In' ? (
                        <button
                          onClick={() => onStatusChange(booking.id, 'Checked In')}
                          className="rounded-xl bg-emerald-600 px-3 py-1.5 text-[11px] font-bold text-white hover:bg-emerald-500 transition shadow-sm"
                        >
                          Check In Guest
                        </button>
                      ) : (
                        <button
                          onClick={() => onStatusChange(booking.id, 'Checked Out')}
                          className="rounded-xl bg-slate-700 px-3 py-1.5 text-[11px] font-bold text-slate-200 hover:bg-slate-600 transition"
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
