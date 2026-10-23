import { useState, useEffect } from 'react';
import { API_BASE_URL, SOCIETY_INFO } from '../config';

export default function ReportsExports({ token }) {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchReports = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/reports`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setReport(data);
      }
    } catch (err) {
      console.error('Failed to fetch reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [token]);

  const handleExportCSV = () => {
    if (!report || !report.bookingsRoster) return;

    const headers = ['Booking ID', 'Guest Name', 'Email', 'Phone', 'Check-in Date', 'Room Type', 'Amount (INR)', 'Payment Method', 'Status', 'Booked At'];
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

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `WDPCS_Accommodation_Report_${new Date().toISOString().split('T')[0]}.csv`);
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
              ${(todayBookings.length > 0 ? todayBookings : report.bookingsRoster.slice(0, 8)).map(b => `
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
              `).join('')}
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

  if (loading || !report) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  const { summary, byRoom, byPayment } = report;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">📈</span>
            <span className="text-xs font-bold uppercase tracking-wider text-blue-400">
              Auditing & Exports
            </span>
          </div>
          <h2 className="text-2xl font-bold text-white mt-1">
            Reports & Operational Analytics
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Financial reconciliation, occupancy reports, and CSV downloads
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleExportCSV}
            className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-emerald-600/20 hover:from-emerald-500 hover:to-teal-500 transition flex items-center gap-1.5"
          >
            <span>📥</span>
            <span>Export Roster (CSV)</span>
          </button>

          <button
            onClick={handlePrintDailyManifest}
            className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-bold text-slate-200 hover:bg-slate-700 transition flex items-center gap-1.5"
          >
            <span>🖨️</span>
            <span>Print Reception Manifest</span>
          </button>
        </div>
      </div>

      {/* High-Level Financial & Volume Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5">
          <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Total Active Bookings</span>
          <div className="mt-2 text-3xl font-extrabold text-white">{summary.activeBookings}</div>
          <p className="text-[11px] text-slate-500 mt-1">Excludes cancelled records</p>
        </div>

        <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5">
          <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Total Revenue Generated</span>
          <div className="mt-2 text-3xl font-extrabold text-emerald-400">
            ₹{summary.totalRevenue.toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Online + Counter combined</p>
        </div>

        <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5">
          <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Average Booking Value</span>
          <div className="mt-2 text-3xl font-extrabold text-blue-400">
            ₹{summary.averageBookingValue.toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Average per registered booking</p>
        </div>

        <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5">
          <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Cancellations</span>
          <div className="mt-2 text-3xl font-extrabold text-rose-400">{summary.cancelledBookings}</div>
          <p className="text-[11px] text-slate-500 mt-1">Refunded or voided reservations</p>
        </div>
      </div>

      {/* Breakdown Grids */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Breakdown by Accommodation Type */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl">
          <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
            <span>🏨</span>
            <span>Accommodation Revenue Breakdown</span>
          </h3>

          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 flex items-center justify-between">
              <div>
                <div className="font-bold text-white text-sm">Luxury Suites</div>
                <div className="text-xs text-slate-400 mt-0.5">{byRoom.suites.count} Bookings Recorded</div>
              </div>
              <div className="text-right">
                <div className="font-extrabold text-emerald-400 text-lg">
                  ₹{byRoom.suites.revenue.toLocaleString('en-IN')}
                </div>
                <div className="text-[10px] text-slate-500">Tariff: ₹2,500/night</div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 flex items-center justify-between">
              <div>
                <div className="font-bold text-white text-sm">Dormitory Beds</div>
                <div className="text-xs text-slate-400 mt-0.5">{byRoom.dormitory.count} Bookings Recorded</div>
              </div>
              <div className="text-right">
                <div className="font-extrabold text-emerald-400 text-lg">
                  ₹{byRoom.dormitory.revenue.toLocaleString('en-IN')}
                </div>
                <div className="text-[10px] text-slate-500">Tariff: ₹450/night</div>
              </div>
            </div>
          </div>
        </div>

        {/* Breakdown by Payment Channel */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl">
          <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
            <span>💳</span>
            <span>Collection Channel Breakdown</span>
          </h3>

          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 flex items-center justify-between">
              <div>
                <div className="font-bold text-white text-sm">Online Gateway (Razorpay)</div>
                <div className="text-xs text-slate-400 mt-0.5">{byPayment.online.count} Online Transactions</div>
              </div>
              <div className="text-right">
                <div className="font-extrabold text-blue-400 text-lg">
                  ₹{byPayment.online.revenue.toLocaleString('en-IN')}
                </div>
                <div className="text-[10px] text-slate-500">Direct settlement</div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 flex items-center justify-between">
              <div>
                <div className="font-bold text-white text-sm">Counter / Property Receipts</div>
                <div className="text-xs text-slate-400 mt-0.5">{byPayment.counter.count} Walk-ins & Cash Bookings</div>
              </div>
              <div className="text-right">
                <div className="font-extrabold text-indigo-400 text-lg">
                  ₹{byPayment.counter.revenue.toLocaleString('en-IN')}
                </div>
                <div className="text-[10px] text-slate-500">Front desk custody</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
