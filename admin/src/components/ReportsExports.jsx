import { useState, useEffect, useCallback } from 'react';
import { API_BASE_URL, SOCIETY_INFO } from '../config';

export default function ReportsExports({ token, bookings = [] }) {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  const computeFallbackReport = useCallback(() => {
    const totalBookings = (bookings || []).length;
    const activeBookings = (bookings || []).filter((b) => b.status !== 'Cancelled');
    const cancelledBookings = (bookings || []).filter((b) => b.status === 'Cancelled');
    const totalRevenue = activeBookings.reduce((sum, b) => sum + (b.amount || 0), 0);

    const suiteBookings = activeBookings.filter((b) => (b.roomType || '').includes('Suite'));
    const dormBookings = activeBookings.filter((b) => (b.roomType || '').includes('Dormitory'));

    const suiteRevenue = suiteBookings.reduce((sum, b) => sum + (b.amount || 0), 0);
    const dormRevenue = dormBookings.reduce((sum, b) => sum + (b.amount || 0), 0);

    const onlineBookings = activeBookings.filter((b) => (b.paymentMethod || '').includes('Online'));
    const counterBookings = activeBookings.filter((b) => (b.paymentMethod || '').includes('Counter'));

    const fallbackReport = {
      generatedAt: new Date().toISOString(),
      summary: {
        totalBookings,
        activeBookings: activeBookings.length,
        cancelledBookings: cancelledBookings.length,
        totalRevenue,
        averageBookingValue: activeBookings.length ? Math.round(totalRevenue / activeBookings.length) : 0,
      },
      byRoom: {
        suites: { count: suiteBookings.length, revenue: suiteRevenue },
        dormitory: { count: dormBookings.length, revenue: dormRevenue },
      },
      byPayment: {
        online: { count: onlineBookings.length, revenue: onlineBookings.reduce((s, b) => s + (b.amount || 0), 0) },
        counter: { count: counterBookings.length, revenue: counterBookings.reduce((s, b) => s + (b.amount || 0), 0) },
      },
      bookingsRoster: bookings || [],
    };
    setReport(fallbackReport);
  }, [bookings]);

  const fetchReports = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/reports`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.summary) {
          setReport(data);
          return;
        }
      }
    } catch {
      // Fallback below
    }

    computeFallbackReport();
    setLoading(false);
  }, [token, computeFallbackReport]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleExportCSV = () => {
    if (!report || !report.bookingsRoster) return;

    const headers = [
      'Booking ID',
      'Guest Name',
      'Email',
      'Phone',
      'Check-in Date',
      'Room Type',
      'Amount (INR)',
      'Payment Method',
      'Status',
      'Booked At',
    ];
    const rows = report.bookingsRoster.map((b) => [
      `"${b.id}"`,
      `"${b.name}"`,
      `"${b.email || ''}"`,
      `"${b.phone || ''}"`,
      `"${b.date}"`,
      `"${b.roomType}"`,
      b.amount || 0,
      `"${b.paymentMethod}"`,
      `"${b.status}"`,
      `"${b.createdAt}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `WDPCS_Accommodation_Report_${new Date().toISOString().split('T')[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintDailyManifest = () => {
    if (!report || !report.bookingsRoster) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const todayStr = new Date().toISOString().split('T')[0];
    const todayBookings = report.bookingsRoster.filter((b) => b.date === todayStr);

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Daily Reception Check-in Manifest - ${todayStr}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 30px; color: #0f172a; }
            .header { border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 20px; }
            .society { font-size: 13px; font-weight: bold; color: #2563eb; }
            .title { font-size: 20px; font-weight: bold; margin-top: 4px; }
            table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 12px; }
            th, td { border: 1px solid #cbd5e1; padding: 8px 10px; text-align: left; }
            th { background: #f1f5f9; font-weight: bold; text-transform: uppercase; font-size: 11px; }
            .sign { margin-top: 40px; display: flex; justify-content: space-between; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="society">${SOCIETY_INFO.name}</div>
            <div class="title">${SOCIETY_INFO.property} — Daily Front Desk Check-in Manifest</div>
            <div style="font-size: 11px; color: #64748b; margin-top: 2px;">Date: ${todayStr} | Generated: ${new Date().toLocaleTimeString()}</div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Booking ID</th>
                <th>Guest Name</th>
                <th>Phone Number</th>
                <th>Room Type</th>
                <th>Tariff</th>
                <th>Payment Mode</th>
                <th>Status</th>
                <th>Guest Signature</th>
              </tr>
            </thead>
            <tbody>
              ${(todayBookings.length > 0 ? todayBookings : report.bookingsRoster.slice(0, 8))
                .map(
                  (b) => `
                <tr>
                  <td style="font-family: monospace; font-weight: bold;">${b.id}</td>
                  <td><strong>${b.name}</strong></td>
                  <td>${b.phone || 'N/A'}</td>
                  <td>${b.roomType}</td>
                  <td>₹${(b.amount || 0).toLocaleString('en-IN')}</td>
                  <td>${b.paymentMethod}</td>
                  <td>${b.status}</td>
                  <td style="width: 120px;"></td>
                </tr>
              `
                )
                .join('')}
            </tbody>
          </table>

          <div class="sign">
            <div>Duty Receptionist Signature: _______________________</div>
            <div>Manager Verified Signature: _______________________</div>
          </div>

          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  if (loading && !report) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-3 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  const { summary, byRoom, byPayment } = report;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-3xl border border-blue-200/80 bg-gradient-to-r from-blue-50 via-indigo-50/40 to-white p-6 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">📈</span>
            <span className="text-xs font-bold uppercase tracking-wider text-blue-700">
              Auditing & Exports
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
            Reports & Operational Analytics
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 font-medium mt-0.5">
            Financial reconciliation, occupancy reports, and CSV downloads
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleExportCSV}
            className="rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 transition flex items-center gap-1.5"
          >
            <span>📥</span>
            <span>Export Roster (CSV)</span>
          </button>

          <button
            onClick={handlePrintDailyManifest}
            className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-2xs flex items-center gap-1.5"
          >
            <span>🖨️</span>
            <span>Print Reception Manifest</span>
          </button>
        </div>
      </div>

      {/* High-Level Financial & Volume Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">
            Total Active Bookings
          </span>
          <div className="mt-2 text-3xl font-extrabold text-slate-900">{summary.activeBookings}</div>
          <p className="text-[11px] text-slate-500 mt-1">Excludes cancelled records</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">
            Total Revenue Generated
          </span>
          <div className="mt-2 text-3xl font-extrabold text-emerald-700">
            ₹{summary.totalRevenue.toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Online + Counter combined</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">
            Average Booking Value
          </span>
          <div className="mt-2 text-3xl font-extrabold text-blue-700">
            ₹{summary.averageBookingValue.toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Average per registered booking</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">
            Cancellations
          </span>
          <div className="mt-2 text-3xl font-extrabold text-rose-700">
            {summary.cancelledBookings}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Refunded or voided reservations</p>
        </div>
      </div>

      {/* Breakdown Grids */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Breakdown by Accommodation Type */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <span>🏨</span>
            <span>Accommodation Revenue Breakdown</span>
          </h3>

          <div className="space-y-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 flex items-center justify-between">
              <div>
                <div className="font-bold text-slate-900 text-sm">Luxury Suites</div>
                <div className="text-xs text-slate-500 mt-0.5">
                  {byRoom.suites.count} Bookings Recorded
                </div>
              </div>
              <div className="text-right">
                <div className="font-extrabold text-emerald-700 text-lg">
                  ₹{byRoom.suites.revenue.toLocaleString('en-IN')}
                </div>
                <div className="text-[11px] text-slate-500 font-medium">Tariff: ₹2,500/night</div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 flex items-center justify-between">
              <div>
                <div className="font-bold text-slate-900 text-sm">Dormitory Beds</div>
                <div className="text-xs text-slate-500 mt-0.5">
                  {byRoom.dormitory.count} Bookings Recorded
                </div>
              </div>
              <div className="text-right">
                <div className="font-extrabold text-emerald-700 text-lg">
                  ₹{byRoom.dormitory.revenue.toLocaleString('en-IN')}
                </div>
                <div className="text-[11px] text-slate-500 font-medium">Tariff: ₹450/night</div>
              </div>
            </div>
          </div>
        </div>

        {/* Breakdown by Payment Channel */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <span>💳</span>
            <span>Collection Channel Breakdown</span>
          </h3>

          <div className="space-y-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 flex items-center justify-between">
              <div>
                <div className="font-bold text-slate-900 text-sm">Online Gateway (Razorpay)</div>
                <div className="text-xs text-slate-500 mt-0.5">
                  {byPayment.online.count} Online Transactions
                </div>
              </div>
              <div className="text-right">
                <div className="font-extrabold text-blue-700 text-lg">
                  ₹{byPayment.online.revenue.toLocaleString('en-IN')}
                </div>
                <div className="text-[11px] text-slate-500 font-medium">Direct settlement</div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 flex items-center justify-between">
              <div>
                <div className="font-bold text-slate-900 text-sm">Counter / Property Receipts</div>
                <div className="text-xs text-slate-500 mt-0.5">
                  {byPayment.counter.count} Walk-ins & Cash Bookings
                </div>
              </div>
              <div className="text-right">
                <div className="font-extrabold text-indigo-700 text-lg">
                  ₹{byPayment.counter.revenue.toLocaleString('en-IN')}
                </div>
                <div className="text-[11px] text-slate-500 font-medium">Front desk custody</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
