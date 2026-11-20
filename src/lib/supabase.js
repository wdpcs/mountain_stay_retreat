/**
 * Supabase Data Client & Graceful Offline Storage Adapter
 * Designed for static hosting on GitHub Pages without requiring a Node.js server.
 */

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
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
 * Fetch room availability for a specific check-in date.
 */
export async function getRoomAvailability(dateStr = '') {
  if (isSupabaseConfigured()) {
    try {
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/rpc/get_room_availability`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            target_date: dateStr || new Date().toISOString().split('T')[0],
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data && typeof data === 'object') {
          return data;
        }
      }
    } catch (err) {
      console.warn('Supabase availability fetch failed, falling back to local calculation:', err);
    }
  }

  // Fallback: If legacy API_BASE_URL is set, attempt it
  if (API_BASE_URL) {
    try {
      const url = dateStr
        ? `${API_BASE_URL}/api/availability?date=${dateStr}`
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

  const bookedSuites = localBookings.filter(
    (b) => isBookingActiveOnDate(b, dateStr) && b.roomType.includes('Suite')
  ).length;
  const bookedDorms = localBookings.filter(
    (b) => isBookingActiveOnDate(b, dateStr) && b.roomType.includes('Dormitory')
  ).length;

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
    payment_method: 'Pay at Counter / Property',
    status: 'Pending at Check-in',
    notes: combinedNotes,
    created_at: new Date().toISOString(),
  };

  // Always mirror to localStorage as offline safety net
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
    paymentMethod: 'Pay at Counter / Property',
    status: 'Pending at Check-in',
    notes: combinedNotes,
    createdAt: record.created_at,
  });

  if (isSupabaseConfigured()) {
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          Prefer: 'return=minimal',
        },
        body: JSON.stringify(record),
      });

      if (res.ok) {
        return { success: true, bookingId, syncedToCloud: true };
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
        body: JSON.stringify(bookingData),
      });
      if (res.ok) {
        const data = await res.json();
        return { success: true, bookingId: data.bookingId || bookingId };
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
