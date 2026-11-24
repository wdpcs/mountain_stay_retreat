/**
 * Supabase Data Client & Graceful Offline Storage Adapter
 * Designed for static hosting on GitHub Pages without requiring a Node.js server.
 */

const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL || 'https://djbizcrfqqurtfwiivds.supabase.co';
const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_l3CBp7BV49BdGVfsOKQ2HA_3vXO3eP8';
const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export const isSupabaseConfigured = () => {
  return (
    Boolean(SUPABASE_URL) &&
    Boolean(SUPABASE_ANON_KEY) &&
    !SUPABASE_URL.includes('your-project-id')
  );
};

// Local storage key for offline/fallback persistence
const STORAGE_KEY_BOOKINGS = 'wdpcs_retreat_local_bookings';

const DEFAULT_SETTINGS = {
  totalSuites: 5,
  availableSuites: 5,
  maintenanceSuites: 0,
  totalDormBeds: 15,
  availableDormBeds: 15,
  maintenanceDormBeds: 0,
  roomPrices: {
    suitePrice: 2500,
    dormPrice: 450,
  },
};

export const getLocalBookings = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_BOOKINGS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const saveLocalBooking = (booking) => {
  try {
    const current = getLocalBookings();
    current.unshift(booking);
    localStorage.setItem(STORAGE_KEY_BOOKINGS, JSON.stringify(current));
  } catch (err) {
    console.warn('Failed to save to local storage fallback:', err);
  }
};

/**
 * Fetch room availability and live tariffs for a specific check-in date.
 */
export async function getRoomAvailability(dateStr = '') {
  const targetDate = dateStr || new Date().toISOString().split('T')[0];
  let cloudPrices = null;
  let cloudFlexi = null;

  if (isSupabaseConfigured()) {
    try {
      // 1. Fetch live system rates config and active bookings in parallel from Supabase Cloud
      const [configRes, bookingsRes] = await Promise.all([
        fetch(`${SUPABASE_URL}/rest/v1/bookings?id=eq.SYS-RATES-CONFIG`, {
          headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
        }),
        fetch(
          `${SUPABASE_URL}/rest/v1/bookings?select=*&status=not.in.(Cancelled,Refunded)&id=not.like.SYS-*`,
          {
            headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
          }
        ),
      ]);

      if (configRes.ok) {
        const rows = await configRes.json();
        if (rows.length > 0 && rows[0].notes) {
          try {
            const parsed = JSON.parse(rows[0].notes);
            if (parsed.suitePrice && parsed.dormPrice) {
              cloudPrices = {
                suitePrice: Number(parsed.suitePrice),
                dormPrice: Number(parsed.dormPrice),
              };
            }
            if (parsed.flexiPricing) {
              cloudFlexi = parsed.flexiPricing;
            }
          } catch {
            // Ignore parse error
          }
        }
      }

      if (bookingsRes.ok) {
        const activeRows = await bookingsRes.json();
        const isRowActiveOnDate = (b, dStr) => {
          const inDate = b.check_in_date || b.checkInDate || b.date;
          let outDate = b.check_out_date || b.checkOutDate;
          if (!outDate && b.notes && b.notes.includes('Stay:')) {
            const m = b.notes.match(/Stay:\s*([0-9-]+)\s*to\s*([0-9-]+)/i);
            if (m) outDate = m[2];
          }
          if (inDate && outDate) {
            return dStr >= inDate && dStr < outDate;
          }
          return inDate === dStr;
        };

        const getRowUnits = (b) => {
          if (b.room_count) return Number(b.room_count) || 1;
          if (b.roomCount) return Number(b.roomCount) || 1;
          if (b.notes && b.notes.includes('Units:')) {
            const m = b.notes.match(/Units:\s*(\d+)/i);
            if (m) return Number(m[1]) || 1;
          }
          return 1;
        };

        const bookedSuites = activeRows
          .filter((b) => isRowActiveOnDate(b, targetDate) && (b.room_type || b.roomType || '').includes('Suite'))
          .reduce((sum, b) => sum + getRowUnits(b), 0);

        const bookedDorms = activeRows
          .filter((b) => isRowActiveOnDate(b, targetDate) && (b.room_type || b.roomType || '').includes('Dormitory'))
          .reduce((sum, b) => sum + getRowUnits(b), 0);

        const finalPrices = cloudPrices || DEFAULT_SETTINGS.roomPrices;

        return {
          totalSuites: DEFAULT_SETTINGS.totalSuites,
          bookedSuites,
          availableSuites: Math.max(0, DEFAULT_SETTINGS.totalSuites - bookedSuites),
          maintenanceSuites: 0,
          totalDormBeds: DEFAULT_SETTINGS.totalDormBeds,
          bookedDormBeds: bookedDorms,
          availableDormBeds: Math.max(0, DEFAULT_SETTINGS.totalDormBeds - bookedDorms),
          maintenanceDormBeds: 0,
          roomPrices: finalPrices,
          basePrices: finalPrices,
          flexiPricing: cloudFlexi,
        };
      }
    } catch (err) {
      console.warn('Supabase live availability fetch error, falling back:', err);
    }
  }

  // Fallback: If legacy API_BASE_URL is set, attempt it
  if (API_BASE_URL) {
    try {
      const url = targetDate
        ? `${API_BASE_URL}/api/availability?date=${targetDate}`
        : `${API_BASE_URL}/api/availability`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (data && typeof data === 'object') return data;
      }
    } catch {
      // Continue to local calculation
    }
  }

  // Offline / Default calculation from local storage
  const localBookings = getLocalBookings();
  const isBookingActiveOnDate = (b, dStr) => {
    if (b.status === 'Cancelled' || b.status === 'Refunded') return false;
    const inDate = b.checkInDate || b.date;
    const outDate = b.checkOutDate;
    if (inDate && outDate) {
      return dStr >= inDate && dStr < outDate;
    }
    return inDate === dStr;
  };

  const getLocalUnits = (b) => Number(b.roomCount || b.quantity || b.units) || 1;

  const bookedSuites = localBookings
    .filter((b) => isBookingActiveOnDate(b, targetDate) && (b.roomType || '').includes('Suite'))
    .reduce((sum, b) => sum + getLocalUnits(b), 0);

  const bookedDorms = localBookings
    .filter((b) => isBookingActiveOnDate(b, targetDate) && (b.roomType || '').includes('Dormitory'))
    .reduce((sum, b) => sum + getLocalUnits(b), 0);

  return {
    ...DEFAULT_SETTINGS,
    bookedSuites,
    availableSuites: Math.max(0, DEFAULT_SETTINGS.totalSuites - bookedSuites),
    bookedDormBeds: bookedDorms,
    availableDormBeds: Math.max(0, DEFAULT_SETTINGS.totalDormBeds - bookedDorms),
  };
}

/**
 * Create a Pay-at-Counter booking reservation.
 */
export async function submitCounterBooking(bookingData) {
  const bookingId = `MSR-CTR-${Date.now().toString().slice(-6)}`;
  const checkInDate = bookingData.checkInDate || bookingData.date;
  const checkOutDate = bookingData.checkOutDate || '';
  const nights = bookingData.nights || 1;
  const roomCount = Math.max(1, Number(bookingData.roomCount) || 1);
  const isDorm = (bookingData.roomType || '').includes('Dormitory');
  const unitLabel = isDorm ? (roomCount === 1 ? 'Bed' : 'Beds') : (roomCount === 1 ? 'Room' : 'Rooms');

  const stayNote = checkOutDate
    ? `Stay: ${checkInDate} to ${checkOutDate} (${nights} ${nights === 1 ? 'night' : 'nights'}) | Units: ${roomCount} ${unitLabel}`
    : `Units: ${roomCount} ${unitLabel}`;
  const combinedNotes = [bookingData.notes, stayNote].filter(Boolean).join(' | ');

  const baseRecord = {
    id: bookingId,
    guest_name: bookingData.name,
    guest_email: bookingData.email,
    guest_phone: bookingData.phone,
    check_in_date: checkInDate,
    room_type: bookingData.roomType,
    amount: Number(bookingData.amount) || 0,
    payment_method: 'Pay at Counter / Property',
    status: 'Pending at Check-in',
    notes: combinedNotes,
    created_at: new Date().toISOString(),
  };

  const payloadWithDetails = {
    ...baseRecord,
    ...(checkOutDate ? { check_out_date: checkOutDate } : {}),
    room_count: roomCount,
  };

  // Always mirror to localStorage as offline safety net
  saveLocalBooking({
    ...baseRecord,
    name: bookingData.name,
    email: bookingData.email,
    phone: bookingData.phone,
    date: checkInDate,
    checkInDate,
    checkOutDate,
    nights,
    roomCount,
    roomType: bookingData.roomType,
    paymentMethod: 'Pay at Counter / Property',
    status: 'Pending at Check-in',
    notes: combinedNotes,
    createdAt: baseRecord.created_at,
  });

  if (isSupabaseConfigured()) {
    try {
      // 1. Attempt insert with dedicated columns (check_out_date, room_count)
      let res = await fetch(`${SUPABASE_URL}/rest/v1/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          Prefer: 'return=minimal',
        },
        body: JSON.stringify(payloadWithDetails),
      });

      // 2. If schema does not yet have extra columns, retry with base record
      if (!res.ok && res.status === 400) {
        const errorText = await res.text();
        if (errorText.includes('check_out_date') || errorText.includes('room_count')) {
          console.warn('Supabase schema missing extra columns; retrying with details in notes.');
          res = await fetch(`${SUPABASE_URL}/rest/v1/bookings`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              apikey: SUPABASE_ANON_KEY,
              Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
              Prefer: 'return=minimal',
            },
            body: JSON.stringify(baseRecord),
          });
        } else {
          console.error('Supabase booking sync error response:', res.status, errorText);
        }
      }

      if (res.ok) {
        return { success: true, bookingId, syncedToCloud: true };
      } else {
        const errorText = await res.text();
        console.error('Supabase booking sync error response:', res.status, errorText);
      }
    } catch (err) {
      console.warn('Supabase booking sync failed (saved locally):', err);
    }
  }

  // If external Node server is configured, try it
  if (API_BASE_URL) {
    try {
      const res = await fetch(`${API_BASE_URL}/book-counter`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...bookingData, roomCount }),
      });
      if (res.ok) {
        const data = await res.json();
        return { success: true, bookingId: data.bookingId || bookingId, syncedToCloud: true };
      }
    } catch {
      // Fall through to local success
    }
  }

  // Graceful offline success
  return { success: true, bookingId, syncedToCloud: false };
}

/**
 * Request a Razorpay order from the Supabase Edge Function or backend.
 */
export async function createRazorpayOrder({ amount, currency = 'INR', receipt, notes = {} }) {
  if (isSupabaseConfigured()) {
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/create-razorpay-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ amount, currency, receipt, notes }),
      });

      if (res.ok) {
        return await res.json();
      }
    } catch (err) {
      console.warn('Edge function order creation failed:', err);
    }
  }

  if (API_BASE_URL) {
    const res = await fetch(`${API_BASE_URL}/create-order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount, currency, receipt, notes }),
    });
    if (res.ok) return await res.json();
  }

  throw new Error('Unable to create Razorpay payment order. Backend/Edge Function not available.');
}

/**
 * Confirm online paid booking.
 */
export async function submitOnlineBooking(bookingData) {
  const bookingId = `MSR-RZP-${Date.now().toString().slice(-6)}`;
  const checkInDate = bookingData.checkInDate || bookingData.date;
  const checkOutDate = bookingData.checkOutDate || '';
  const nights = bookingData.nights || 1;
  const stayNote = checkOutDate
    ? `Stay: ${checkInDate} to ${checkOutDate} (${nights} ${nights === 1 ? 'night' : 'nights'})`
    : '';
  const combinedNotes = [bookingData.notes, stayNote].filter(Boolean).join(' | ');

  const record = {
    id: bookingId,
    guest_name: bookingData.name,
    guest_email: bookingData.email,
    guest_phone: bookingData.phone,
    check_in_date: checkInDate,
    room_type: bookingData.roomType,
    amount: bookingData.amount,
    payment_method: 'Online Pre-payment (Razorpay)',
    status: 'Paid Online',
    payment_id: bookingData.paymentId,
    order_id: bookingData.orderId,
    notes: combinedNotes,
    created_at: new Date().toISOString(),
  };

  saveLocalBooking({
    id: bookingId,
    name: bookingData.name,
    email: bookingData.email,
    phone: bookingData.phone,
    date: checkInDate,
    checkInDate,
    checkOutDate,
    nights,
    roomType: bookingData.roomType,
    amount: bookingData.amount,
    paymentMethod: 'Online Pre-payment (Razorpay)',
    status: 'Paid Online',
    paymentId: bookingData.paymentId,
    notes: combinedNotes,
    createdAt: record.created_at,
  });

  if (isSupabaseConfigured()) {
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          Prefer: 'return=minimal',
        },
        body: JSON.stringify(record),
      });
    } catch (err) {
      console.warn('Supabase sync error on paid booking:', err);
    }
  }

  return { success: true, bookingId };
}

/**
 * Look up an existing reservation by Booking ID, phone number, or email.
 */
export async function lookupBooking(searchQuery) {
  if (!searchQuery || !searchQuery.trim()) return [];
  const q = searchQuery.trim();
  const lowerQ = q.toLowerCase();

  // 1. Check Supabase Cloud database
  if (isSupabaseConfigured()) {
    try {
      const cleanPhone = q.replace(/\D/g, '');
      const filterConditions = [
        `id.ilike.*${encodeURIComponent(q)}*`,
        `guest_email.ilike.*${encodeURIComponent(q)}*`,
        `guest_name.ilike.*${encodeURIComponent(q)}*`,
      ];
      if (cleanPhone.length >= 10) {
        const last10 = cleanPhone.slice(-10);
        filterConditions.push(`guest_phone.ilike.*${encodeURIComponent(last10)}*`);
        filterConditions.push(`guest_phone.ilike.*${encodeURIComponent(last10.slice(0, 5))}*${encodeURIComponent(last10.slice(5))}*`);
      } else if (cleanPhone.length >= 5) {
        filterConditions.push(`guest_phone.ilike.*${encodeURIComponent(cleanPhone)}*`);
      }
      const url = `${SUPABASE_URL}/rest/v1/bookings?or=(${filterConditions.join(',')})&order=created_at.desc&limit=10`;
      const res = await fetch(url, {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          return data.map((b) => {
            const checkIn = b.check_in_date || b.checkInDate || b.date || '';
            let checkOut = b.check_out_date || b.checkOutDate || '';
            let nights = Number(b.nights) || 0;
            const notes = b.notes || '';

            if (!checkOut && notes.includes('Stay:')) {
              const stayMatch = notes.match(/Stay:\s*([0-9-]+)\s*to\s*([0-9-]+)\s*\((\d+)\s*night/i);
              if (stayMatch) {
                checkOut = stayMatch[2];
                nights = Number(stayMatch[3]) || 1;
              }
            }

            if (checkIn && checkOut && !nights) {
              const d1 = new Date(checkIn + 'T00:00:00');
              const d2 = new Date(checkOut + 'T00:00:00');
              const diff = Math.round((d2 - d1) / (1000 * 60 * 60 * 24));
              nights = diff > 0 ? diff : 1;
            }
            if (!nights) nights = 1;

            let roomCount = Number(b.room_count || b.roomCount) || 0;
            if (!roomCount && notes.includes('Units:')) {
              const uMatch = notes.match(/Units:\s*(\d+)/i);
              if (uMatch) roomCount = Number(uMatch[1]) || 1;
            }
            if (!roomCount) roomCount = 1;

            return {
              bookingId: b.id,
              id: b.id,
              name: b.guest_name || b.name || '',
              email: b.guest_email || b.email || '',
              phone: b.guest_phone || b.phone || '',
              date: checkIn,
              checkInDate: checkIn,
              checkOutDate: checkOut,
              nights,
              roomCount,
              roomType: b.room_type || b.roomType || '',
              amount: Number(b.amount) || 0,
              paymentMethod: b.payment_method || b.paymentMethod || 'Pay at Counter / Property',
              status: b.status || 'Pending at Check-in',
              notes,
              createdAt: b.created_at || b.createdAt || '',
            };
          });
        }
      }
    } catch (err) {
      console.warn('Supabase lookup error:', err);
    }
  }

  // 2. Check localStorage fallback
  try {
    const local = getLocalBookings();
    const matched = local.filter((b) => {
      const bId = (b.id || '').toLowerCase();
      const bPhone = (b.phone || '').replace(/\D/g, '');
      const bEmail = (b.email || '').toLowerCase();
      const bName = (b.name || '').toLowerCase();
      const cleanQ = q.replace(/\D/g, '');

      return (
        bId.includes(lowerQ) ||
        bEmail.includes(lowerQ) ||
        bName.includes(lowerQ) ||
        (cleanQ.length >= 5 && bPhone.includes(cleanQ))
      );
    });

    if (matched.length > 0) {
      return matched.map((b) => ({
        bookingId: b.id,
        id: b.id,
        name: b.name,
        email: b.email,
        phone: b.phone,
        date: b.checkInDate || b.date,
        checkInDate: b.checkInDate || b.date,
        checkOutDate: b.checkOutDate,
        nights: b.nights || 1,
        roomCount: b.roomCount || 1,
        roomType: b.roomType,
        amount: b.amount,
        paymentMethod: b.paymentMethod,
        status: b.status,
        notes: b.notes,
        createdAt: b.createdAt,
      }));
    }
  } catch {
    // Ignore
  }

  return [];
}
