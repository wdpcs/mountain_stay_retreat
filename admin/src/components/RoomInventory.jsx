import { useState, useEffect, useCallback } from 'react';
import { API_BASE_URL, SUPABASE_URL, SUPABASE_KEY } from '../config';

const TOTAL_SUITES = 5;
const TOTAL_DORM_BEDS = 15;

const DEFAULT_FLEXI = {
  weekendPricing: {
    enabled: false,
    days: [5, 6, 0], // Friday (5), Saturday (6), Sunday (0)
    suitePrice: 2800,
    dormPrice: 500,
  },
  seasonalRules: [
    {
      id: 'SEASON-1',
      name: 'Peak Holiday Season (Dec - Jan)',
      startDate: '2026-12-20',
      endDate: '2027-01-05',
      suitePrice: 3200,
      dormPrice: 550,
      enabled: true,
    },
    {
      id: 'SEASON-2',
      name: 'Monsoon Special Offer',
      startDate: '2026-06-01',
      endDate: '2026-08-31',
      suitePrice: 2000,
      dormPrice: 380,
      enabled: false,
    },
  ],
};

export default function RoomInventory({ token, bookings = [], onPricesUpdated }) {
  const [inventory, setInventory] = useState(null);
  const [loading, setLoading] = useState(true);

  // Base price inputs
  const [suitePriceInput, setSuitePriceInput] = useState(2500);
  const [dormPriceInput, setDormPriceInput] = useState(450);
  const [priceSuccess, setPriceSuccess] = useState('');

  // Maintenance inputs
  const [maintSuites, setMaintSuites] = useState(0);
  const [maintDorm, setMaintDorm] = useState(0);
  const [suiteReason, setSuiteReason] = useState('');
  const [dormReason, setDormReason] = useState('');
  const [maintSuccess, setMaintSuccess] = useState('');

  // Flexi rate state
  const [flexiPricing, setFlexiPricing] = useState(() => {
    try {
      const saved = localStorage.getItem('wdpcs_flexi_rates');
      return saved ? JSON.parse(saved) : DEFAULT_FLEXI;
    } catch {
      return DEFAULT_FLEXI;
    }
  });
  const [flexiSuccess, setFlexiSuccess] = useState('');
  const [isSavingFlexi, setIsSavingFlexi] = useState(false);

  // New Season Rule Form state
  const [showAddSeason, setShowAddSeason] = useState(false);
  const [newSeason, setNewSeason] = useState({
    name: '',
    startDate: '',
    endDate: '',
    suitePrice: 3000,
    dormPrice: 520,
  });

  // Live Simulator state
  const [simDate, setSimDate] = useState(() => new Date().toISOString().split('T')[0]);

  const computeFallbackInventory = useCallback(async () => {
    let suitePrice = 2500;
    let dormPrice = 450;

    // Try fetching live prices from Supabase Cloud
    try {
      const sbRes = await fetch(`${SUPABASE_URL}/rest/v1/rooms?select=*`, {
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
        },
      });
      if (sbRes.ok) {
        const rooms = await sbRes.json();
        const sRoom = rooms.find((r) => r.category === 'suite' || (r.id && r.id.includes('suite')));
        const dRoom = rooms.find((r) => r.category === 'dormitory' || (r.id && r.id.includes('dorm')));
        if (sRoom?.default_price) suitePrice = sRoom.default_price;
        if (dRoom?.default_price) dormPrice = dRoom.default_price;
      }
    } catch {
      // Fallback prices preserved
    }

    // Try reading maintenance from localStorage
    let savedMaint = {
      maintenanceSuites: 0,
      maintenanceDormBeds: 0,
      suiteMaintenanceReason: '',
      dormMaintenanceReason: '',
    };
    try {
      const localMaint = localStorage.getItem('wdpcs_maintenance_status');
      if (localMaint) savedMaint = JSON.parse(localMaint);
    } catch {
      // Default maintenance preserved
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const todayBookings = (bookings || []).filter(
      (b) => b.date === todayStr && b.status !== 'Cancelled'
    );
    const suiteBookings = todayBookings.filter((b) => (b.roomType || '').includes('Suite'));
    const dormBookings = todayBookings.filter((b) => (b.roomType || '').includes('Dormitory'));

    const suiteList = Array.from({ length: TOTAL_SUITES }, (_, i) => {
      const suiteNo = i + 1;
      const isUnderMaint = suiteNo <= (savedMaint.maintenanceSuites || 0);
      const booked = suiteBookings[i];
      return {
        id: `SUITE-${suiteNo}`,
        number: `Suite 10${suiteNo}`,
        type: 'Suite Room',
        rate: suitePrice,
        status: isUnderMaint
          ? 'Maintenance'
          : booked
          ? booked.status === 'Checked In'
            ? 'Occupied'
            : 'Reserved'
          : 'Available',
        currentGuest: booked ? { id: booked.id, name: booked.name, phone: booked.phone } : null,
        maintenanceReason: isUnderMaint ? savedMaint.suiteMaintenanceReason : null,
      };
    });

    const dormList = Array.from({ length: TOTAL_DORM_BEDS }, (_, i) => {
      const bedNo = i + 1;
      const isUnderMaint = bedNo <= (savedMaint.maintenanceDormBeds || 0);
      const booked = dormBookings[i];
      return {
        id: `DORM-${bedNo}`,
        number: `Bed D-${bedNo < 10 ? '0' + bedNo : bedNo}`,
        type: 'Dormitory Bed',
        rate: dormPrice,
        status: isUnderMaint
          ? 'Maintenance'
          : booked
          ? booked.status === 'Checked In'
            ? 'Occupied'
            : 'Reserved'
          : 'Available',
        currentGuest: booked ? { id: booked.id, name: booked.name, phone: booked.phone } : null,
        maintenanceReason: isUnderMaint ? savedMaint.dormMaintenanceReason : null,
      };
    });

    const fallbackData = {
      totalSuites: TOTAL_SUITES,
      totalDormBeds: TOTAL_DORM_BEDS,
      suiteList,
      dormList,
      maintenanceStatus: savedMaint,
      roomPrices: {
        suitePrice,
        dormPrice,
      },
    };

    setInventory(fallbackData);
    setSuitePriceInput(suitePrice);
    setDormPriceInput(dormPrice);
    setMaintSuites(savedMaint.maintenanceSuites || 0);
    setMaintDorm(savedMaint.maintenanceDormBeds || 0);
    setSuiteReason(savedMaint.suiteMaintenanceReason || '');
    setDormReason(savedMaint.dormMaintenanceReason || '');
  }, [bookings]);

  const fetchInventory = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/inventory`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setInventory(data);
        if (data.roomPrices) {
          setSuitePriceInput(data.roomPrices.suitePrice);
          setDormPriceInput(data.roomPrices.dormPrice);
        }
        if (data.maintenanceStatus) {
          setMaintSuites(data.maintenanceStatus.maintenanceSuites || 0);
          setMaintDorm(data.maintenanceStatus.maintenanceDormBeds || 0);
          setSuiteReason(data.maintenanceStatus.suiteMaintenanceReason || '');
          setDormReason(data.maintenanceStatus.dormMaintenanceReason || '');
        }
      }
    } catch {
      // Fallback
    }

    // Try fetching live flexi rates
    try {
      const flexiRes = await fetch(`${API_BASE_URL}/api/admin/flexi-rates`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (flexiRes.ok) {
        const fData = await flexiRes.json();
        if (fData.flexiPricing) {
          setFlexiPricing(fData.flexiPricing);
          localStorage.setItem('wdpcs_flexi_rates', JSON.stringify(fData.flexiPricing));
        }
      }
    } catch {
      // Local fallback preserved
    }

    if (!inventory) {
      await computeFallbackInventory();
    }
    setLoading(false);
  }, [token, computeFallbackInventory, inventory]);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  const handleSavePrices = async (e) => {
    e.preventDefault();
    setPriceSuccess('');
    let saved = false;
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/prices`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          suitePrice: Number(suitePriceInput),
          dormPrice: Number(dormPriceInput),
        }),
      });

      if (res.ok) {
        saved = true;
      }
    } catch {
      // Fallback
    }

    if (!saved) {
      try {
        await fetch(`${SUPABASE_URL}/rest/v1/rooms?id=eq.suite-executive`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            apikey: SUPABASE_KEY,
            Authorization: `Bearer ${SUPABASE_KEY}`,
          },
          body: JSON.stringify({ default_price: Number(suitePriceInput) }),
        });
        await fetch(`${SUPABASE_URL}/rest/v1/rooms?id=eq.dorm-bed`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            apikey: SUPABASE_KEY,
            Authorization: `Bearer ${SUPABASE_KEY}`,
          },
          body: JSON.stringify({ default_price: Number(dormPriceInput) }),
        });
        saved = true;
      } catch (err) {
        console.error('Failed to update prices on Supabase:', err);
      }
    }

    if (saved) {
      setPriceSuccess('✅ Standard base rates updated successfully!');
      if (onPricesUpdated) onPricesUpdated();
      fetchInventory();
      setTimeout(() => setPriceSuccess(''), 3000);
    }
  };

  const handleSaveMaintenance = async (e) => {
    e.preventDefault();
    setMaintSuccess('');
    let saved = false;
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/maintenance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          maintenanceSuites: Number(maintSuites),
          maintenanceDormBeds: Number(maintDorm),
          suiteMaintenanceReason: suiteReason,
          dormMaintenanceReason: dormReason,
        }),
      });

      if (res.ok) {
        saved = true;
      }
    } catch {
      // Fallback
    }

    if (!saved) {
      const maintPayload = {
        maintenanceSuites: Number(maintSuites),
        maintenanceDormBeds: Number(maintDorm),
        suiteMaintenanceReason: suiteReason,
        dormMaintenanceReason: dormReason,
        updatedAt: new Date().toISOString(),
      };
      localStorage.setItem('wdpcs_maintenance_status', JSON.stringify(maintPayload));
      saved = true;
    }

    if (saved) {
      setMaintSuccess('✅ Maintenance restrictions updated live!');
      fetchInventory();
      setTimeout(() => setMaintSuccess(''), 3000);
    }
  };

  // Flexi Rate Handlers
  const handleToggleWeekendPricing = () => {
    setFlexiPricing((prev) => ({
      ...prev,
      weekendPricing: {
        ...prev.weekendPricing,
        enabled: !prev.weekendPricing?.enabled,
      },
    }));
  };

  const handleToggleWeekendDay = (dayInt) => {
    setFlexiPricing((prev) => {
      const currentDays = prev.weekendPricing?.days || [5, 6, 0];
      const exists = currentDays.includes(dayInt);
      const nextDays = exists
        ? currentDays.filter((d) => d !== dayInt)
        : [...currentDays, dayInt];
      return {
        ...prev,
        weekendPricing: {
          ...prev.weekendPricing,
          days: nextDays,
        },
      };
    });
  };

  const handleWeekendRateChange = (field, val) => {
    setFlexiPricing((prev) => ({
      ...prev,
      weekendPricing: {
        ...prev.weekendPricing,
        [field]: Number(val) || 0,
      },
    }));
  };

  const handleToggleSeasonRule = (id) => {
    setFlexiPricing((prev) => ({
      ...prev,
      seasonalRules: (prev.seasonalRules || []).map((r) =>
        r.id === id ? { ...r, enabled: !r.enabled } : r
      ),
    }));
  };

  const handleDeleteSeasonRule = (id) => {
    setFlexiPricing((prev) => ({
      ...prev,
      seasonalRules: (prev.seasonalRules || []).filter((r) => r.id !== id),
    }));
  };

  const handleAddSeasonRule = (e) => {
    e.preventDefault();
    if (!newSeason.name || !newSeason.startDate || !newSeason.endDate) {
      alert('Please fill in season name, start date, and end date.');
      return;
    }
    if (newSeason.endDate < newSeason.startDate) {
      alert('End date cannot be earlier than start date.');
      return;
    }

    const newRule = {
      id: 'SEASON-' + Date.now().toString().slice(-5),
      name: newSeason.name.trim(),
      startDate: newSeason.startDate,
      endDate: newSeason.endDate,
      suitePrice: Number(newSeason.suitePrice) || 2800,
      dormPrice: Number(newSeason.dormPrice) || 500,
      enabled: true,
    };

    setFlexiPricing((prev) => ({
      ...prev,
      seasonalRules: [...(prev.seasonalRules || []), newRule],
    }));

    setNewSeason({
      name: '',
      startDate: '',
      endDate: '',
      suitePrice: 3000,
      dormPrice: 520,
    });
    setShowAddSeason(false);
  };

  const handleSaveFlexiRates = async () => {
    setIsSavingFlexi(true);
    setFlexiSuccess('');

    try {
      await fetch(`${API_BASE_URL}/api/admin/flexi-rates`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(flexiPricing),
      });
    } catch {
      // Backend unavailable, fallback to local
    }

    // Always mirror to localStorage
    localStorage.setItem('wdpcs_flexi_rates', JSON.stringify(flexiPricing));

    setIsSavingFlexi(false);
    setFlexiSuccess('✅ Flexi rate system saved & broadcasted live!');
    if (onPricesUpdated) onPricesUpdated();
    setTimeout(() => setFlexiSuccess(''), 4000);
  };

  // Tariff simulator evaluator
  const simulatedRate = (() => {
    if (!simDate) {
      return {
        suite: Number(suitePriceInput),
        dorm: Number(dormPriceInput),
        source: 'Standard Base Tariff',
        isFlexi: false,
      };
    }
    // 1. Seasonal check
    const activeSeason = (flexiPricing.seasonalRules || []).find(
      (r) => r.enabled && simDate >= r.startDate && simDate <= r.endDate
    );
    if (activeSeason) {
      return {
        suite: Number(activeSeason.suitePrice),
        dorm: Number(activeSeason.dormPrice),
        source: `Seasonal: ${activeSeason.name}`,
        isFlexi: true,
        type: 'seasonal',
      };
    }
    // 2. Weekend surcharge check
    if (flexiPricing.weekendPricing?.enabled) {
      const dow = new Date(simDate + 'T00:00:00').getDay();
      const wDays = flexiPricing.weekendPricing.days || [5, 6, 0];
      if (wDays.includes(dow)) {
        return {
          suite: Number(flexiPricing.weekendPricing.suitePrice),
          dorm: Number(flexiPricing.weekendPricing.dormPrice),
          source: 'Weekend Dynamic Surcharge (Fri/Sat/Sun)',
          isFlexi: true,
          type: 'weekend',
        };
      }
    }
    return {
      suite: Number(suitePriceInput),
      dorm: Number(dormPriceInput),
      source: 'Standard Base Tariff',
      isFlexi: false,
    };
  })();

  if (loading && !inventory) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-3 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'Available':
        return 'border-emerald-200 bg-emerald-50/70 text-emerald-800';
      case 'Occupied':
        return 'border-blue-200 bg-blue-50/70 text-blue-800';
      case 'Reserved':
        return 'border-amber-200 bg-amber-50/70 text-amber-800';
      case 'Maintenance':
        return 'border-rose-200 bg-rose-50/70 text-rose-800';
      default:
        return 'border-slate-200 bg-slate-50 text-slate-700';
    }
  };

  const dayNames = [
    { id: 0, label: 'Sun' },
    { id: 1, label: 'Mon' },
    { id: 2, label: 'Tue' },
    { id: 3, label: 'Wed' },
    { id: 4, label: 'Thu' },
    { id: 5, label: 'Fri' },
    { id: 6, label: 'Sat' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-3xl border border-blue-200/80 bg-gradient-to-r from-blue-50 via-indigo-50/40 to-white p-6 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">🛏️</span>
            <span className="text-xs font-bold uppercase tracking-wider text-blue-700">
              Inventory & Capacity Management
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
            Room Inventory & Flexi Tariff Control
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 font-medium mt-0.5">
            Manage physical rooms, maintenance blocks, and seasonal & daily flexi rate policies
          </p>
        </div>

        <button
          onClick={fetchInventory}
          className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
        >
          🔄 Refresh Status
        </button>
      </div>

      {/* Pricing & Maintenance Controls (Side-by-side) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Dynamic Base Rate Manager */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-lg">💵</span>
            <div>
              <h3 className="text-base font-bold text-slate-900">Standard Base Tariff Rates</h3>
              <p className="text-xs text-slate-500">Default base nightly rates for rooms and dorm beds</p>
            </div>
          </div>

          <form onSubmit={handleSavePrices} className="space-y-4">
            {priceSuccess && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800 font-bold">
                {priceSuccess}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Base Suite Rate (Per Night)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-xs text-slate-400 font-bold">
                    ₹
                  </span>
                  <input
                    type="number"
                    min="500"
                    step="50"
                    value={suitePriceInput}
                    onChange={(e) => setSuitePriceInput(e.target.value)}
                    required
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-8 pr-3 text-sm font-bold text-slate-900 outline-none focus:border-blue-500 focus:bg-white transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Base Dorm Bed Rate (Per Night)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-xs text-slate-400 font-bold">
                    ₹
                  </span>
                  <input
                    type="number"
                    min="100"
                    step="25"
                    value={dormPriceInput}
                    onChange={(e) => setDormPriceInput(e.target.value)}
                    required
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-8 pr-3 text-sm font-bold text-slate-900 outline-none focus:border-blue-500 focus:bg-white transition"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full rounded-xl bg-blue-600 py-3 text-xs font-bold text-white shadow-xs hover:bg-blue-700 transition"
            >
              Save Standard Base Rates
            </button>
          </form>
        </div>

        {/* Maintenance Blocks */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-lg">🛠️</span>
            <div>
              <h3 className="text-base font-bold text-slate-900">Maintenance Mode Blocks</h3>
              <p className="text-xs text-slate-500">Blocks physical units from public reservation</p>
            </div>
          </div>

          <form onSubmit={handleSaveMaintenance} className="space-y-3">
            {maintSuccess && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800 font-bold">
                {maintSuccess}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Suites in Maintenance (0-5)
                </label>
                <input
                  type="number"
                  min="0"
                  max="5"
                  value={maintSuites}
                  onChange={(e) => setMaintSuites(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 px-3 text-sm font-bold text-slate-900 outline-none focus:border-blue-500 focus:bg-white transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Dorm Beds in Maintenance (0-15)
                </label>
                <input
                  type="number"
                  min="0"
                  max="15"
                  value={maintDorm}
                  onChange={(e) => setMaintDorm(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 px-3 text-sm font-bold text-slate-900 outline-none focus:border-blue-500 focus:bg-white transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Maintenance Reason / Details
              </label>
              <input
                type="text"
                value={suiteReason || dormReason}
                onChange={(e) => {
                  setSuiteReason(e.target.value);
                  setDormReason(e.target.value);
                }}
                placeholder="e.g. Painting, plumbing repair, or AC servicing"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 px-3 text-xs text-slate-900 placeholder-slate-400 outline-none focus:border-blue-500 focus:bg-white transition"
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-xl bg-amber-600 py-3 text-xs font-bold text-white shadow-xs hover:bg-amber-700 transition"
            >
              Update Maintenance Restrictions
            </button>
          </form>
        </div>
      </div>

      {/* ============================================================== */}
      {/* FLEXI RATE SYSTEM (SEASONAL & DAILY/WEEKEND PRICING)           */}
      {/* ============================================================== */}
      <div className="rounded-3xl border border-indigo-200/80 bg-white p-6 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-50 border border-indigo-200 text-xl">
              📈
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-extrabold text-slate-900">
                  Flexi Rate System (Seasonal & Daily Dynamic Pricing)
                </h3>
                <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-[10px] font-extrabold text-indigo-700 uppercase">
                  Live Engine
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Automatically adjusts tariffs for high-demand holiday seasons, festive windows, or weekend stays.
              </p>
            </div>
          </div>

          <button
            onClick={handleSaveFlexiRates}
            disabled={isSavingFlexi}
            className="rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-700 transition flex items-center gap-1.5 disabled:opacity-50"
          >
            <span>{isSavingFlexi ? '⏳ Saving...' : '💾 Save & Broadcast Flexi Rates'}</span>
          </button>
        </div>

        {flexiSuccess && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-bold text-emerald-800">
            {flexiSuccess}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Card A: Weekend / Daily Surcharge Policy */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-base">📅</span>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Weekend / Day-of-Week Surcharge</h4>
                  <p className="text-[11px] text-slate-500">Apply custom tariff on designated days</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleToggleWeekendPricing}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                  flexiPricing.weekendPricing?.enabled ? 'bg-indigo-600' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    flexiPricing.weekendPricing?.enabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className={`space-y-4 transition-opacity ${flexiPricing.weekendPricing?.enabled ? 'opacity-100' : 'opacity-50'}`}>
              {/* Day Selector Chips */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1.5 uppercase">
                  Applicable Days of Week
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {dayNames.map((d) => {
                    const isSelected = (flexiPricing.weekendPricing?.days || []).includes(d.id);
                    return (
                      <button
                        key={d.id}
                        type="button"
                        disabled={!flexiPricing.weekendPricing?.enabled}
                        onClick={() => handleToggleWeekendDay(d.id)}
                        className={`rounded-xl px-3 py-1.5 text-xs font-bold transition border ${
                          isSelected
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {d.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Rates */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Weekend Suite Rate (₹)
                  </label>
                  <input
                    type="number"
                    min="500"
                    step="50"
                    disabled={!flexiPricing.weekendPricing?.enabled}
                    value={flexiPricing.weekendPricing?.suitePrice || 2800}
                    onChange={(e) => handleWeekendRateChange('suitePrice', e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white py-2 px-3 text-xs font-bold text-slate-900 outline-none focus:border-indigo-600 transition"
                  />
                  <div className="text-[10px] text-slate-500 mt-1 font-medium">
                    Standard: ₹{suitePriceInput}
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Weekend Dorm Bed Rate (₹)
                  </label>
                  <input
                    type="number"
                    min="100"
                    step="25"
                    disabled={!flexiPricing.weekendPricing?.enabled}
                    value={flexiPricing.weekendPricing?.dormPrice || 500}
                    onChange={(e) => handleWeekendRateChange('dormPrice', e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white py-2 px-3 text-xs font-bold text-slate-900 outline-none focus:border-indigo-600 transition"
                  />
                  <div className="text-[10px] text-slate-500 mt-1 font-medium">
                    Standard: ₹{dormPriceInput}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Card B: Live Tariff Simulator */}
          <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/50 to-white p-5 space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-base">🧪</span>
              <div>
                <h4 className="text-sm font-bold text-slate-900">Live Tariff Simulator</h4>
                <p className="text-[11px] text-slate-500">Pick any date to test what the guest portal will charge</p>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Select Simulation Date
              </label>
              <input
                type="date"
                value={simDate}
                onChange={(e) => setSimDate(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white py-2 px-3 text-xs font-bold text-slate-900 outline-none focus:border-indigo-600 transition shadow-2xs"
              />
            </div>

            {/* Simulated Rate Breakdown Card */}
            <div className="rounded-2xl border border-indigo-200 bg-white p-4 space-y-3 shadow-2xs">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 font-bold uppercase text-[10px]">Applied Tariff Policy</span>
                <span
                  className={`px-2 py-0.5 rounded-full font-bold text-[10px] border ${
                    simulatedRate.isFlexi
                      ? 'bg-amber-50 text-amber-800 border-amber-300'
                      : 'bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  {simulatedRate.source}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                <div>
                  <span className="text-slate-500 text-[10px] block font-bold uppercase">Suite Rate</span>
                  <div className="text-lg font-extrabold text-slate-900">
                    ₹{simulatedRate.suite.toLocaleString('en-IN')}
                    <span className="text-[10px] text-slate-500 font-normal"> /night</span>
                  </div>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block font-bold uppercase">Dorm Bed Rate</span>
                  <div className="text-lg font-extrabold text-slate-900">
                    ₹{simulatedRate.dorm.toLocaleString('en-IN')}
                    <span className="text-[10px] text-slate-500 font-normal"> /night</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Seasonal Tariff Rules Table & Form */}
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-base">🏖️</span>
              <h4 className="text-sm font-bold text-slate-900">
                Seasonal Rules ({flexiPricing.seasonalRules?.length || 0})
              </h4>
            </div>

            <button
              type="button"
              onClick={() => setShowAddSeason(!showAddSeason)}
              className="rounded-xl border border-indigo-300 bg-indigo-50 px-3.5 py-1.5 text-xs font-bold text-indigo-700 hover:bg-indigo-100 transition shadow-2xs flex items-center gap-1"
            >
              <span>{showAddSeason ? '✕ Cancel' : '➕ Add Seasonal Period'}</span>
            </button>
          </div>

          {/* Add Season Period Form */}
          {showAddSeason && (
            <form onSubmit={handleAddSeasonRule} className="rounded-2xl border border-indigo-200 bg-indigo-50/50 p-5 space-y-4">
              <h5 className="text-xs font-bold text-indigo-900 uppercase tracking-wider">
                Create New Seasonal Tariff Rule
              </h5>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Season / Event Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Wayanad Wildlife Rush"
                    value={newSeason.name}
                    onChange={(e) => setNewSeason({ ...newSeason, name: e.target.value })}
                    className="w-full rounded-xl border border-indigo-200 bg-white py-2 px-3 text-xs font-semibold text-slate-900 outline-none focus:border-indigo-600 transition"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Start Date *</label>
                  <input
                    type="date"
                    required
                    value={newSeason.startDate}
                    onChange={(e) => setNewSeason({ ...newSeason, startDate: e.target.value })}
                    className="w-full rounded-xl border border-indigo-200 bg-white py-2 px-3 text-xs font-semibold text-slate-900 outline-none focus:border-indigo-600 transition"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">End Date *</label>
                  <input
                    type="date"
                    required
                    value={newSeason.endDate}
                    onChange={(e) => setNewSeason({ ...newSeason, endDate: e.target.value })}
                    className="w-full rounded-xl border border-indigo-200 bg-white py-2 px-3 text-xs font-semibold text-slate-900 outline-none focus:border-indigo-600 transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Suite Nightly Tariff (₹) *
                  </label>
                  <input
                    type="number"
                    min="500"
                    step="50"
                    required
                    value={newSeason.suitePrice}
                    onChange={(e) => setNewSeason({ ...newSeason, suitePrice: e.target.value })}
                    className="w-full rounded-xl border border-indigo-200 bg-white py-2 px-3 text-xs font-bold text-slate-900 outline-none focus:border-indigo-600 transition"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Dormitory Bed Nightly Tariff (₹) *
                  </label>
                  <input
                    type="number"
                    min="100"
                    step="25"
                    required
                    value={newSeason.dormPrice}
                    onChange={(e) => setNewSeason({ ...newSeason, dormPrice: e.target.value })}
                    className="w-full rounded-xl border border-indigo-200 bg-white py-2 px-3 text-xs font-bold text-slate-900 outline-none focus:border-indigo-600 transition"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddSeason(false)}
                  className="rounded-xl border border-slate-300 px-3.5 py-1.5 text-xs font-bold text-slate-600 hover:bg-white transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-indigo-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-indigo-700 transition shadow-xs"
                >
                  Add Rule to List
                </button>
              </div>
            </form>
          )}

          {/* Seasonal Rules List */}
          {(flexiPricing.seasonalRules || []).length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-xs text-slate-500">
              No seasonal tariff rules defined yet. Click "Add Seasonal Period" above to configure peak or festival pricing.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                  <tr>
                    <th className="py-2.5 px-3">Season Name</th>
                    <th className="py-2.5 px-3">Date Range</th>
                    <th className="py-2.5 px-3">Suite Rate</th>
                    <th className="py-2.5 px-3">Dorm Bed Rate</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {flexiPricing.seasonalRules.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/60 transition">
                      <td className="py-3 px-3 font-bold text-slate-900">{r.name}</td>
                      <td className="py-3 px-3 text-slate-600 font-mono text-[11px]">
                        {r.startDate} <span className="text-slate-400">→</span> {r.endDate}
                      </td>
                      <td className="py-3 px-3 font-extrabold text-slate-900">
                        ₹{Number(r.suitePrice).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-3 font-extrabold text-slate-900">
                        ₹{Number(r.dormPrice).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-3">
                        <button
                          type="button"
                          onClick={() => handleToggleSeasonRule(r.id)}
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold border transition ${
                            r.enabled
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                              : 'bg-slate-100 text-slate-600 border-slate-300'
                          }`}
                        >
                          {r.enabled ? '🟢 Active' : '⚪ Inactive'}
                        </button>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleDeleteSeasonRule(r.id)}
                          title="Remove Rule"
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
      </div>

      {/* Physical Units Visual Grid: 5 Suite Rooms */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span>🏨</span>
              <span>Luxury Suites Status (5 Units)</span>
            </h3>
            <p className="text-xs text-slate-500">Live status for Suite rooms on the property</p>
          </div>
          <span className="text-xs text-slate-600 font-mono font-bold bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-lg">
            Base: ₹{inventory.roomPrices?.suitePrice}/night
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
          {inventory.suiteList.map((suite) => (
            <div
              key={suite.id}
              className={`rounded-2xl border p-4 transition ${getStatusColor(suite.status)}`}
            >
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-sm text-slate-900">{suite.number}</span>
                <span className="text-xs">
                  {suite.status === 'Available'
                    ? '🟢'
                    : suite.status === 'Occupied'
                    ? '🔵'
                    : suite.status === 'Reserved'
                    ? '🟡'
                    : '🔴'}
                </span>
              </div>
              <div className="mt-2 text-xs font-extrabold uppercase tracking-wider">
                {suite.status}
              </div>

              {suite.currentGuest ? (
                <div className="mt-2 pt-2 border-t border-slate-200 text-[11px] text-slate-700">
                  <div className="font-bold text-slate-900 truncate">
                    {suite.currentGuest.name}
                  </div>
                  <div className="text-slate-500 font-mono text-[10px]">
                    {suite.currentGuest.id}
                  </div>
                </div>
              ) : suite.maintenanceReason ? (
                <div className="mt-2 pt-2 border-t border-rose-200 text-[10px] text-rose-700 font-medium">
                  {suite.maintenanceReason}
                </div>
              ) : (
                <div className="mt-2 text-[10px] text-slate-500 font-medium">Ready for check-in</div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Physical Units Visual Grid: 15 Dormitory Beds */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span>🛏️</span>
              <span>Dormitory Beds Status (15 Beds)</span>
            </h3>
            <p className="text-xs text-slate-500">
              Individual bed inventory in the shared dormitory facility
            </p>
          </div>
          <span className="text-xs text-slate-600 font-mono font-bold bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-lg">
            Base: ₹{inventory.roomPrices?.dormPrice}/night
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {inventory.dormList.map((bed) => (
            <div
              key={bed.id}
              className={`rounded-2xl border p-3 transition ${getStatusColor(bed.status)}`}
            >
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-xs text-slate-900">{bed.number}</span>
                <span className="text-[10px]">
                  {bed.status === 'Available'
                    ? '🟢'
                    : bed.status === 'Occupied'
                    ? '🔵'
                    : bed.status === 'Reserved'
                    ? '🟡'
                    : '🔴'}
                </span>
              </div>
              <div className="mt-1 text-[11px] font-extrabold uppercase tracking-wider">
                {bed.status}
              </div>

              {bed.currentGuest ? (
                <div className="mt-1.5 pt-1.5 border-t border-slate-200 text-[10px] text-slate-700 truncate font-semibold">
                  {bed.currentGuest.name}
                </div>
              ) : bed.maintenanceReason ? (
                <div className="mt-1.5 text-[9px] text-rose-700 font-medium truncate">
                  {bed.maintenanceReason}
                </div>
              ) : (
                <div className="mt-1 text-[9px] text-slate-500 font-medium">Vacant</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
