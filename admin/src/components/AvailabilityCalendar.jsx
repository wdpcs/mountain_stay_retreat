import { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config';

export default function AvailabilityCalendar({ token, onSelectDate }) {
  const [calendarDays, setCalendarDays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState(null);

  const fetchCalendar = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/calendar?days=30`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setCalendarDays(data.calendar || []);
        if (data.calendar && data.calendar.length > 0) {
          setSelectedDay(data.calendar[0]);
        }
      }
    } catch (err) {
      console.error('Failed to fetch calendar:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCalendar();
  }, [token]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  const getDayCardClass = (day) => {
    const isSelected = selectedDay?.date === day.date;
    const totalAvail = day.suitesAvailable + day.dormAvailable;

    let baseBg = 'border-slate-800 bg-slate-900/60 hover:border-slate-700';
    if (totalAvail === 0) {
      baseBg = 'border-rose-900/40 bg-rose-950/20 hover:border-rose-700/60';
    } else if (day.suitesAvailable <= 1 || day.dormAvailable <= 3) {
      baseBg = 'border-amber-900/40 bg-amber-950/20 hover:border-amber-700/60';
    } else {
      baseBg = 'border-slate-800 bg-slate-900/60 hover:border-blue-500/50';
    }

    if (isSelected) {
      return `${baseBg} ring-2 ring-blue-500 bg-blue-950/30`;
    }
    return baseBg;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">🗓️</span>
            <span className="text-xs font-bold uppercase tracking-wider text-blue-400">
              Forward Schedule
            </span>
          </div>
          <h2 className="text-2xl font-bold text-white mt-1">
            30-Day Availability Calendar
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Forward-looking room occupancy and capacity planning
          </p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
            <span className="text-slate-300">Available</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500"></span>
            <span className="text-slate-300">Limited Capacity</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-500"></span>
            <span className="text-slate-300">Fully Booked</span>
          </div>
        </div>
      </div>

      {/* 30-Day Calendar Grid */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl">
        <h3 className="text-sm font-bold text-slate-300 mb-4">
          Select a date to view reservations & room allocations:
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-3">
          {calendarDays.map((day) => {
            const dateObj = new Date(day.date + 'T00:00:00');
            const dayNum = dateObj.getDate();
            const monthName = dateObj.toLocaleDateString('en-US', { month: 'short' });

            return (
              <button
                key={day.date}
                onClick={() => setSelectedDay(day)}
                className={`rounded-2xl border p-3 text-left transition flex flex-col justify-between ${getDayCardClass(
                  day
                )}`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400">
                    {day.dayName}
                  </span>
                  <span className="text-sm font-extrabold text-white">
                    {monthName} {dayNum}
                  </span>
                </div>

                <div className="mt-3 space-y-1 text-[11px]">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Suites:</span>
                    <span
                      className={`font-bold ${
                        day.suitesAvailable === 0
                          ? 'text-rose-400'
                          : day.suitesAvailable <= 2
                          ? 'text-amber-400'
                          : 'text-emerald-400'
                      }`}
                    >
                      {day.suitesAvailable} / {day.totalSuites}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Dorm:</span>
                    <span
                      className={`font-bold ${
                        day.dormAvailable === 0
                          ? 'text-rose-400'
                          : day.dormAvailable <= 4
                          ? 'text-amber-400'
                          : 'text-emerald-400'
                      }`}
                    >
                      {day.dormAvailable} / {day.totalDormBeds}
                    </span>
                  </div>
                </div>

                {day.bookings && day.bookings.length > 0 && (
                  <div className="mt-2 text-[10px] text-blue-400 font-semibold truncate">
                    {day.bookings.length} Booking{day.bookings.length > 1 ? 's' : ''}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Date Detail Panel */}
      {selectedDay && (
        <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">
                Date Manifest
              </span>
              <h3 className="text-xl font-bold text-white mt-0.5">
                {new Date(selectedDay.date + 'T00:00:00').toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </h3>
            </div>

            <div className="flex items-center gap-3 text-xs">
              <div className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-1.5">
                <span className="text-slate-400">Suites Available: </span>
                <strong className="text-emerald-400">{selectedDay.suitesAvailable} / {selectedDay.totalSuites}</strong>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-1.5">
                <span className="text-slate-400">Dorm Beds Available: </span>
                <strong className="text-emerald-400">{selectedDay.dormAvailable} / {selectedDay.totalDormBeds}</strong>
              </div>
            </div>
          </div>

          {selectedDay.bookings && selectedDay.bookings.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-800 text-slate-400">
                  <tr>
                    <th className="pb-2">Booking ID</th>
                    <th className="pb-2">Guest Name</th>
                    <th className="pb-2">Accommodation</th>
                    <th className="pb-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 font-medium">
                  {selectedDay.bookings.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-800/40">
                      <td className="py-2.5 font-mono text-blue-400 font-bold">{b.id}</td>
                      <td className="py-2.5 text-white">{b.name}</td>
                      <td className="py-2.5 text-slate-300">{b.roomType}</td>
                      <td className="py-2.5">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300">
                          {b.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-800 p-8 text-center text-slate-500 text-xs">
              No bookings registered for this date. Full capacity is currently available for guest reservation.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
