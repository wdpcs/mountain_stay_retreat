import { useState, useEffect } from 'react';
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

  const fetchInventory = async () => {
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
  };

  useEffect(() => {
    fetchInventory();
  }, [token]);

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
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'Available':
        return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300';
      case 'Occupied':
        return 'border-indigo-500/30 bg-indigo-500/10 text-indigo-300';
      case 'Reserved':
        return 'border-amber-500/30 bg-amber-500/10 text-amber-300';
      case 'Maintenance':
        return 'border-rose-500/30 bg-rose-500/10 text-rose-300';
      default:
        return 'border-slate-800 bg-slate-900 text-slate-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">🛏️</span>
            <span className="text-xs font-bold uppercase tracking-wider text-blue-400">
              Inventory & Capacity
            </span>
          </div>
          <h2 className="text-2xl font-bold text-white mt-1">
            Room & Dormitory Inventory Control
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage physical rooms, maintenance blocks, and dynamic public tariff rates
          </p>
        </div>

        <button
          onClick={fetchInventory}
          className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-bold text-slate-200 hover:bg-slate-700 transition"
        >
          🔄 Refresh Status
        </button>
      </div>

      {/* Pricing & Maintenance Controls (Side-by-side) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Dynamic Rate Manager */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-lg">💵</span>
            <div>
              <h3 className="text-base font-bold text-white">Dynamic Rate Manager</h3>
              <p className="text-xs text-slate-400">Updates prices live on rooms.wdpcs.in</p>
            </div>
          </div>

          <form onSubmit={handleSavePrices} className="space-y-4">
            {priceSuccess && (
              <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-300 font-semibold">
                {priceSuccess}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Suite Rate (Per Night)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-xs text-slate-400 font-bold">₹</span>
                  <input
                    type="number"
                    min="500"
                    step="50"
                    value={suitePriceInput}
                    onChange={(e) => setSuitePriceInput(e.target.value)}
                    required
                    className="w-full rounded-2xl border border-slate-800 bg-slate-950 py-2.5 pl-8 pr-3 text-sm font-bold text-white outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Dormitory Bed Rate (Per Night)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-xs text-slate-400 font-bold">₹</span>
                  <input
                    type="number"
                    min="100"
                    step="25"
                    value={dormPriceInput}
                    onChange={(e) => setDormPriceInput(e.target.value)}
                    required
                    className="w-full rounded-2xl border border-slate-800 bg-slate-950 py-2.5 pl-8 pr-3 text-sm font-bold text-white outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full rounded-2xl bg-blue-600 py-3 text-xs font-bold text-white shadow-lg hover:bg-blue-500 transition"
            >
              Save & Broadcast Rates Live
            </button>
          </form>
        </div>

        {/* Maintenance Blocks */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-lg">🛠️</span>
            <div>
              <h3 className="text-base font-bold text-white">Maintenance Mode Blocks</h3>
              <p className="text-xs text-slate-400">Blocks rooms from public reservation</p>
            </div>
          </div>

          <form onSubmit={handleSaveMaintenance} className="space-y-3">
            {maintSuccess && (
              <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-300 font-semibold">
                {maintSuccess}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Suites in Maintenance (0-5)
                </label>
                <input
                  type="number"
                  min="0"
                  max="5"
                  value={maintSuites}
                  onChange={(e) => setMaintSuites(e.target.value)}
                  className="w-full rounded-2xl border border-slate-800 bg-slate-950 py-2 px-3 text-sm font-bold text-white outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Dorm Beds in Maintenance (0-15)
                </label>
                <input
                  type="number"
                  min="0"
                  max="15"
                  value={maintDorm}
                  onChange={(e) => setMaintDorm(e.target.value)}
                  className="w-full rounded-2xl border border-slate-800 bg-slate-950 py-2 px-3 text-sm font-bold text-white outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
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
                className="w-full rounded-2xl border border-slate-800 bg-slate-950 py-2 px-3 text-xs text-white placeholder-slate-500 outline-none focus:border-blue-500"
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-2xl bg-amber-600 py-3 text-xs font-bold text-white shadow-lg hover:bg-amber-500 transition"
            >
              Update Maintenance Restrictions
            </button>
          </form>
        </div>
      </div>

      {/* Physical Units Visual Grid: 5 Suite Rooms */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span>🏨</span>
              <span>Luxury Suites Status (5 Units)</span>
            </h3>
            <p className="text-xs text-slate-400">
              Live status for Suite rooms on the property
            </p>
          </div>
          <span className="text-xs text-slate-400 font-mono">
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
                <span className="font-bold text-sm text-white">{suite.number}</span>
                <span className="text-xs">
                  {suite.status === 'Available' ? '🟢' : suite.status === 'Occupied' ? '🔵' : suite.status === 'Reserved' ? '🟡' : '🔴'}
                </span>
              </div>
              <div className="mt-2 text-xs font-bold">{suite.status}</div>

              {suite.currentGuest ? (
                <div className="mt-2 pt-2 border-t border-slate-800/80 text-[11px] text-slate-300">
                  <div className="font-semibold text-white truncate">{suite.currentGuest.name}</div>
                  <div className="text-slate-400 font-mono text-[10px]">{suite.currentGuest.id}</div>
                </div>
              ) : suite.maintenanceReason ? (
                <div className="mt-2 pt-2 border-t border-rose-500/20 text-[10px] text-rose-300">
                  {suite.maintenanceReason}
                </div>
              ) : (
                <div className="mt-2 text-[10px] text-slate-500">Ready for check-in</div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Physical Units Visual Grid: 15 Dormitory Beds */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span>🛏️</span>
              <span>Dormitory Beds Status (15 Beds)</span>
            </h3>
            <p className="text-xs text-slate-400">
              Individual bed inventory in the shared dormitory facility
            </p>
          </div>
          <span className="text-xs text-slate-400 font-mono">
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
                <span className="font-bold text-xs text-white">{bed.number}</span>
                <span className="text-[10px]">
                  {bed.status === 'Available' ? '🟢' : bed.status === 'Occupied' ? '🔵' : bed.status === 'Reserved' ? '🟡' : '🔴'}
                </span>
              </div>
              <div className="mt-1 text-[11px] font-bold">{bed.status}</div>

              {bed.currentGuest ? (
                <div className="mt-1.5 pt-1.5 border-t border-slate-800/80 text-[10px] text-slate-300 truncate">
                  {bed.currentGuest.name}
                </div>
              ) : bed.maintenanceReason ? (
                <div className="mt-1.5 text-[9px] text-rose-300 truncate">
                  {bed.maintenanceReason}
                </div>
              ) : (
                <div className="mt-1 text-[9px] text-slate-500">Vacant</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
