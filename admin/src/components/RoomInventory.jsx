import { useState, useEffect, useCallback } from 'react';
import { API_BASE_URL } from '../config';

export default function RoomInventory({ token, onPricesUpdated }) {
  const [inventory, setInventory] = useState(null);
  const [loading, setLoading] = useState(true);

  // Price inputs
  const [suitePriceInput, setSuitePriceInput] = useState(2500);
  const [dormPriceInput, setDormPriceInput] = useState(450);
  const [priceSuccess, setPriceSuccess] = useState('');

  // Maintenance inputs
  const [maintSuites, setMaintSuites] = useState(0);
  const [maintDorm, setMaintDorm] = useState(0);
  const [suiteReason, setSuiteReason] = useState('');
  const [dormReason, setDormReason] = useState('');
  const [maintSuccess, setMaintSuccess] = useState('');

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
    } catch (err) {
      console.error('Failed to fetch inventory:', err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  const handleSavePrices = async (e) => {
    e.preventDefault();
    setPriceSuccess('');
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
        setPriceSuccess('✅ Public room rates updated successfully!');
        if (onPricesUpdated) onPricesUpdated();
        setTimeout(() => setPriceSuccess(''), 3000);
      }
    } catch (err) {
      console.error('Failed to update prices:', err);
    }
  };

  const handleSaveMaintenance = async (e) => {
    e.preventDefault();
    setMaintSuccess('');
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
        setMaintSuccess('✅ Maintenance restrictions updated live!');
        fetchInventory();
        setTimeout(() => setMaintSuccess(''), 3000);
      }
    } catch (err) {
      console.error('Failed to update maintenance:', err);
    }
  };

  if (loading || !inventory) {
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-3xl border border-blue-200/80 bg-gradient-to-r from-blue-50 via-indigo-50/40 to-white p-6 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">🛏️</span>
            <span className="text-xs font-bold uppercase tracking-wider text-blue-700">
              Inventory & Capacity
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
            Room & Dormitory Inventory Control
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 font-medium mt-0.5">
            Manage physical rooms, maintenance blocks, and dynamic public tariff rates
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
        {/* Dynamic Rate Manager */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-lg">💵</span>
            <div>
              <h3 className="text-base font-bold text-slate-900">Dynamic Rate Manager</h3>
              <p className="text-xs text-slate-500">Updates prices live on rooms.wdpcs.in</p>
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
                  Suite Rate (Per Night)
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
                  Dormitory Bed Rate (Per Night)
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
              Save & Broadcast Rates Live
            </button>
          </form>
        </div>

        {/* Maintenance Blocks */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-lg">🛠️</span>
            <div>
              <h3 className="text-base font-bold text-slate-900">Maintenance Mode Blocks</h3>
              <p className="text-xs text-slate-500">Blocks rooms from public reservation</p>
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
                placeholder="e.g. Annual painting, plumbing repair, or AC servicing"
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
            Rate: ₹{inventory.roomPrices?.suitePrice}/night
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
            Rate: ₹{inventory.roomPrices?.dormPrice}/night
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
