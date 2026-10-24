import { useState, useEffect, useCallback } from 'react';
import { API_BASE_URL, SOCIETY_INFO } from './config';
import AdminLogin from './components/AdminLogin';
import DashboardOverview from './components/DashboardOverview';
import BookingManagement from './components/BookingManagement';
import RoomInventory from './components/RoomInventory';
import AvailabilityCalendar from './components/AvailabilityCalendar';
import GuestDirectory from './components/GuestDirectory';
import PaymentMonitor from './components/PaymentMonitor';
import CancellationsRefunds from './components/CancellationsRefunds';
import ReportsExports from './components/ReportsExports';
import UserManagement from './components/UserManagement';
import AuditLogs from './components/AuditLogs';
import AdminSettings from './components/AdminSettings';
import WalkInBookingModal from './components/WalkInBookingModal';

export default function AdminApp() {
  const [token, setToken] = useState(() => sessionStorage.getItem('wdpcs_admin_token') || null);
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = sessionStorage.getItem('wdpcs_admin_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isWalkInOpen, setIsWalkInOpen] = useState(false);
  const [toastAlert, setToastAlert] = useState(null);

  // Audio chime for new incoming booking notifications
  const playAlertChime = useCallback(() => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    } catch {
      // Audio playback restrictions handled
    }
  }, []);

  const handleLogout = useCallback(async () => {
    if (token) {
      try {
        await fetch(`${API_BASE_URL}/api/admin/logout`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch {
        // Logged out locally regardless
      }
    }
    sessionStorage.removeItem('wdpcs_admin_token');
    sessionStorage.removeItem('wdpcs_admin_user');
    setToken(null);
    setCurrentUser(null);
  }, [token]);

  const fetchStats = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/dashboard/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401 || res.status === 403) {
        handleLogout();
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.warn('Failed to fetch stats:', err);
    }
  }, [token, handleLogout]);

  const fetchBookings = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/bookings`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setBookings(data.bookings || []);
      }
    } catch (err) {
      console.warn('Failed to fetch bookings:', err);
    }
  }, [token]);

  const fetchNotifications = useCallback(
    async (detectNew = false) => {
      if (!token) return;
      try {
        const res = await fetch(`${API_BASE_URL}/api/admin/notifications`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          if (data && Array.isArray(data.notifications)) {
            if (detectNew && data.notifications.length > 0) {
              const latest = data.notifications[0];
              setNotifications((prev) => {
                const prevTopId = prev[0]?.id;
                if (latest && !latest.read && latest.id !== prevTopId) {
                  setToastAlert(latest);
                  playAlertChime();
                  setTimeout(() => setToastAlert(null), 8000);
                }
                return data.notifications;
              });
            } else {
              setNotifications(data.notifications);
            }
            setUnreadCount(data.unreadCount || 0);
          }
        }
      } catch (err) {
        console.warn('Failed to fetch notifications:', err);
      }
    },
    [token, playAlertChime]
  );

  // Status changer
  const handleStatusChange = async (id, newStatus) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/bookings/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setBookings((prev) =>
          prev.map((b) => (b.id === id ? { ...b, status: newStatus } : b))
        );
        fetchStats();
      }
    } catch (err) {
      console.error('Failed to change booking status:', err);
    }
  };

  // Delete booking
  const handleDeleteBooking = async (id) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/bookings/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setBookings((prev) => prev.filter((b) => b.id !== id));
        fetchStats();
      }
    } catch (err) {
      console.error('Failed to delete booking:', err);
    }
  };

  // Notification actions
  const handleMarkNotificationRead = async (id) => {
    try {
      await fetch(`${API_BASE_URL}/api/admin/notifications/${id}/read`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark read:', err);
    }
  };

  const handleMarkAllNotificationsRead = async () => {
    try {
      await fetch(`${API_BASE_URL}/api/admin/notifications/mark-all-read`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all read:', err);
    }
  };

  // Lifecycle
  useEffect(() => {
    if (!token) return;

    fetchStats();
    fetchBookings();
    fetchNotifications(false);

    // Polling every 10 seconds for real-time background sync
    const interval = setInterval(() => {
      fetchStats();
      fetchBookings();
      fetchNotifications(true);
    }, 10000);

    return () => clearInterval(interval);
  }, [token, fetchStats, fetchBookings, fetchNotifications]);

  if (!token || !currentUser) {
    return (
      <AdminLogin
        onLoginSuccess={(user, newToken) => {
          setToken(newToken);
          setCurrentUser(user);
        }}
      />
    );
  }

  const navItems = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'bookings', label: 'Bookings', icon: '📋', count: bookings.length },
    { id: 'inventory', label: 'Inventory', icon: '🛏️' },
    { id: 'calendar', label: 'Calendar', icon: '🗓️' },
    { id: 'guests', label: 'Guests', icon: '👥' },
    { id: 'payments', label: 'Transactions', icon: '💳' },
    { id: 'refunds', label: 'Cancellations', icon: '🔄' },
    { id: 'reports', label: 'Reports', icon: '📈' },
    { id: 'users', label: 'Staff Roles', icon: '🛡️' },
    { id: 'audit', label: 'Audit Logs', icon: '📜' },
    { id: 'settings', label: 'Settings', icon: '⚙️' },
  ];

  return (
    <div className="min-h-screen bg-slate-100/70 font-sans text-slate-800 flex flex-col antialiased">
      {/* Top Header Bar */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-md px-4 sm:px-6 py-3 shadow-xs">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          {/* Logo & Society Info */}
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-700 via-blue-600 to-indigo-600 text-2xl text-white shadow-md shadow-blue-500/20">
              🛡️
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-extrabold tracking-tight text-slate-900">
                  Mountain Stay Retreat
                </h1>
                <span className="rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-extrabold text-blue-700 border border-blue-200">
                  ADMIN CONSOLE
                </span>
              </div>
              <p className="text-[11px] font-medium text-slate-500 hidden sm:block">
                Wayanad District Police Co-operative Society Ltd. No. W 208
              </p>
            </div>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* Notifications Button */}
            <div className="relative">
              <button
                onClick={() => setIsNotifOpen((prev) => !prev)}
                className={`relative flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold transition ${
                  unreadCount > 0
                    ? 'border-blue-300 bg-blue-50 text-blue-700 shadow-xs'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
                title="Booking Alerts"
              >
                <span>🔔</span>
                <span className="hidden sm:inline">Alerts</span>
                {unreadCount > 0 && (
                  <span className="rounded-full bg-rose-600 px-1.5 py-0.2 text-[10px] font-extrabold text-white">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Notifications Dropdown */}
              {isNotifOpen && (
                <div className="absolute right-0 mt-3 w-80 sm:w-96 rounded-3xl border border-slate-200 bg-white p-4 text-slate-800 shadow-2xl z-50">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
                    <div className="flex items-center gap-2">
                      <span>🔔</span>
                      <h4 className="font-bold text-xs text-slate-900">Booking Notifications</h4>
                      {unreadCount > 0 && (
                        <span className="rounded-full bg-blue-100 text-blue-800 px-2 py-0.5 text-[10px] font-bold">
                          {unreadCount} unread
                        </span>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllNotificationsRead}
                        className="text-[11px] font-semibold text-blue-600 hover:underline"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>

                  <div className="max-h-72 overflow-y-auto space-y-2">
                    {notifications.length === 0 ? (
                      <p className="text-center text-xs text-slate-400 py-6 font-medium">
                        No notifications received.
                      </p>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          onClick={() => {
                            handleMarkNotificationRead(n.id);
                            setActiveTab('bookings');
                            setIsNotifOpen(false);
                          }}
                          className={`rounded-2xl p-3 text-xs transition cursor-pointer border ${
                            n.read
                              ? 'border-slate-100 bg-slate-50 opacity-75'
                              : 'border-blue-200 bg-blue-50/60'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <strong className="font-bold text-slate-900">{n.title}</strong>
                            {!n.read && (
                              <span className="h-2 w-2 rounded-full bg-blue-600 shrink-0 mt-1"></span>
                            )}
                          </div>
                          <p className="mt-1 text-[11px] text-slate-600 leading-relaxed">{n.message}</p>
                          <div className="mt-2 text-[10px] text-slate-400 font-mono">
                            {new Date(n.createdAt).toLocaleTimeString()}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Current Staff User Chip */}
            <div className="hidden md:flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-1.5 shadow-2xs">
              <div className="h-7 w-7 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center text-xs font-bold font-mono">
                {currentUser.username.slice(0, 2).toUpperCase()}
              </div>
              <div className="text-left">
                <div className="text-xs font-bold text-slate-900 leading-none">{currentUser.name}</div>
                <div className="text-[10px] text-slate-500 font-mono capitalize leading-tight mt-0.5">
                  {currentUser.role}
                </div>
              </div>
            </div>

            {/* Public Site Link */}
            <a
              href="https://rooms.wdpcs.in"
              target="_blank"
              rel="noreferrer"
              className="hidden lg:flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:text-blue-600 hover:bg-slate-50 transition shadow-2xs"
              title="Open public guest booking site"
            >
              <span>🌐</span>
              <span>rooms.wdpcs.in</span>
            </a>

            {/* Sign Out Button */}
            <button
              onClick={handleLogout}
              className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700 hover:bg-rose-600 hover:text-white transition flex items-center gap-1.5"
            >
              <span>🚪</span>
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Prominent Secondary Navigation Bar (Visible on all tabs) */}
      <nav className="sticky top-[57px] sm:top-[65px] z-30 border-b border-slate-200 bg-white px-2 sm:px-4 py-2 shadow-xs">
        <div className="mx-auto max-w-7xl flex items-center justify-between gap-1 overflow-x-auto pb-0.5 scrollbar-none">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`whitespace-nowrap rounded-lg px-2 xl:px-2.5 py-1.5 text-[11px] xl:text-xs font-bold transition flex items-center gap-1 shrink-0 ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/25 ring-2 ring-blue-600/20'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 bg-slate-50/70 border border-slate-200/60'
                }`}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
                {item.count !== undefined && (
                  <span
                    className={`ml-0.5 rounded-full px-1.5 py-0.2 text-[9px] font-extrabold ${
                      isActive ? 'bg-white/25 text-white' : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Real-time Toast Alert */}
      {toastAlert && (
        <div className="fixed top-28 right-6 z-50 w-80 sm:w-96 rounded-3xl border border-emerald-300 bg-white p-4 text-slate-800 shadow-2xl border-l-4 border-l-emerald-500 animate-bounce">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg">🎉</span>
              <strong className="text-xs font-bold text-emerald-800">New Booking Alert!</strong>
            </div>
            <button
              onClick={() => setToastAlert(null)}
              className="text-xs text-slate-400 hover:text-slate-700"
            >
              ✕
            </button>
          </div>
          <p className="mt-1 text-xs text-slate-600 leading-relaxed">{toastAlert.message}</p>
        </div>
      )}

      {/* Main Content Area */}
      <main className="mx-auto flex-1 max-w-7xl w-full px-4 sm:px-6 py-6">
        {activeTab === 'overview' && (
          <DashboardOverview
            stats={stats}
            onNavigate={setActiveTab}
            onOpenWalkIn={() => setIsWalkInOpen(true)}
            onStatusChange={handleStatusChange}
          />
        )}

        {activeTab === 'bookings' && (
          <BookingManagement
            bookings={bookings}
            token={token}
            onRefresh={fetchBookings}
            onOpenWalkIn={() => setIsWalkInOpen(true)}
            onStatusChange={handleStatusChange}
            onDeleteBooking={handleDeleteBooking}
          />
        )}

        {activeTab === 'inventory' && (
          <RoomInventory
            token={token}
            onPricesUpdated={() => {
              fetchStats();
              fetchBookings();
            }}
          />
        )}

        {activeTab === 'calendar' && (
          <AvailabilityCalendar token={token} />
        )}

        {activeTab === 'guests' && (
          <GuestDirectory token={token} />
        )}

        {activeTab === 'payments' && (
          <PaymentMonitor token={token} />
        )}

        {activeTab === 'refunds' && (
          <CancellationsRefunds
            token={token}
            bookings={bookings}
            onRefreshBookings={() => {
              fetchBookings();
              fetchStats();
            }}
          />
        )}

        {activeTab === 'reports' && (
          <ReportsExports token={token} />
        )}

        {activeTab === 'users' && (
          <UserManagement token={token} currentUser={currentUser} />
        )}

        {activeTab === 'audit' && (
          <AuditLogs token={token} />
        )}

        {activeTab === 'settings' && (
          <AdminSettings token={token} currentUser={currentUser} />
        )}
      </main>

      {/* Front Desk Walk-In Booking Modal */}
      <WalkInBookingModal
        isOpen={isWalkInOpen}
        onClose={() => setIsWalkInOpen(false)}
        token={token}
        prices={stats?.roomPrices}
        onBookingCreated={() => {
          fetchBookings();
          fetchStats();
        }}
      />

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500 mt-auto">
        <div className="mx-auto max-w-7xl px-6 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span className="font-medium text-slate-700">{SOCIETY_INFO.name}</span>
          <span className="font-mono text-[11px] text-slate-500">
            Secure Admin Session • TLS Encrypted • Active Role: {currentUser.role}
          </span>
        </div>
      </footer>
    </div>
  );
}
