import express from 'express';
import cors from 'cors';
import Razorpay from 'razorpay';
import dotenv from 'dotenv';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });
dotenv.config();

const app = express();

// ==========================================
// 1. SECURITY, CORS & SENSITIVE CONFIGURATION
// ==========================================

const JWT_SECRET = process.env.SESSION_SECRET || 'wdpcs_admin_super_secret_jwt_key_2026_w208_retreat';

// Private Network Access (PNA) support for Chrome when calling localhost from public domains
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Private-Network', 'true');
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Access-Control-Request-Private-Network');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    return res.sendStatus(204);
  }
  next();
});

// Whitelist approved origins (both HTTP and HTTPS)
const allowedOrigins = [
  'https://rooms.wdpcs.in',
  'http://rooms.wdpcs.in',
  'https://roomsadmin.wdpcs.in',
  'http://roomsadmin.wdpcs.in',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
  'http://127.0.0.1:5000',
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      const isAllowed =
        allowedOrigins.indexOf(origin) !== -1 ||
        /^https?:\/\/(.*\.)?wdpcs\.in(:\d+)?$/.test(origin) ||
        /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin) ||
        process.env.NODE_ENV !== 'production';

      if (isAllowed) {
        return callback(null, true);
      }
      return callback(new Error('CORS policy: Access denied for this origin.'));
    },
    credentials: true,
  })
);

app.use(express.json());

// Razorpay client (Key Secret is NEVER sent to frontend)
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_dummy',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'dummy_secret',
});

// ==========================================
// 2. CRYPTOGRAPHIC TOKEN & AUTH UTILITIES
// ==========================================

function hashPassword(password) {
  return crypto.createHash('sha256').update(password + '_wdpcs_salt').digest('hex');
}

function generateToken(payload) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(
    JSON.stringify({
      ...payload,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 12 * 60 * 60, // 12-hour session
    })
  ).toString('base64url');
  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${header}.${body}`)
    .digest('base64url');
  return `${header}.${body}.${signature}`;
}

function verifyToken(token) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;

  const [header, body, signature] = parts;
  const expectedSignature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${header}.${body}`)
    .digest('base64url');

  if (signature !== expectedSignature) return null;

  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null; // Expired
    }
    return payload;
  } catch {
    return null;
  }
}

// In-memory brute-force rate limiter on login
const loginAttempts = new Map(); // ip -> { count, lockedUntil }

function checkRateLimit(ip) {
  const now = Date.now();
  const record = loginAttempts.get(ip);
  if (!record) return { allowed: true };

  if (record.lockedUntil && record.lockedUntil > now) {
    const remainingSeconds = Math.ceil((record.lockedUntil - now) / 1000);
    return {
      allowed: false,
      error: `Too many failed attempts. Locked for ${remainingSeconds} seconds.`,
    };
  }

  if (record.lockedUntil && record.lockedUntil <= now) {
    loginAttempts.delete(ip);
    return { allowed: true };
  }

  return { allowed: true };
}

function registerFailedLogin(ip) {
  const now = Date.now();
  const record = loginAttempts.get(ip) || { count: 0, firstAttempt: now };
  record.count += 1;

  if (record.count >= 5) {
    record.lockedUntil = now + 15 * 60 * 1000; // 15 minute lock
  }
  loginAttempts.set(ip, record);
}

function registerSuccessfulLogin(ip) {
  loginAttempts.delete(ip);
}

// Middleware: Authenticate Admin requests
function requireAuth(allowedRoles = []) {
  return (req, res, next) => {
    const authHeader = req.headers.authorization || req.headers['x-admin-token'];
    let token = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else if (authHeader) {
      token = authHeader;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required. Missing administrative authorization token.',
      });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired administrative session token. Please re-authenticate.',
      });
    }

    if (allowedRoles.length > 0 && !allowedRoles.includes(payload.role)) {
      return res.status(403).json({
        success: false,
        error: `Forbidden: User role '${payload.role}' lacks permission for this action.`,
      });
    }

    req.adminUser = payload;
    next();
  };
}

// ==========================================
// 3. CENTRAL DATA STORE & SEED DATA
// ==========================================

const staffUsers = [
  {
    id: 'USR-001',
    username: 'admin',
    name: 'Chief Security Officer',
    role: 'admin',
    passwordHash: hashPassword('admin123'),
    email: 'admin@wdpcs.in',
    phone: '+91 70250 17611',
    active: true,
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'USR-002',
    username: 'manager',
    name: 'Retreat Facility Manager',
    role: 'manager',
    passwordHash: hashPassword('manager123'),
    email: 'manager@wdpcs.in',
    phone: '+91 98450 12345',
    active: true,
    createdAt: '2026-01-15T00:00:00Z',
  },
  {
    id: 'USR-003',
    username: 'reception',
    name: 'Front Desk Receptionist',
    role: 'receptionist',
    passwordHash: hashPassword('reception123'),
    email: 'reception@wdpcs.in',
    phone: '+91 97412 67890',
    active: true,
    createdAt: '2026-02-01T00:00:00Z',
  },
];

const TOTAL_SUITES = 5;
const TOTAL_DORM_BEDS = 15;

let roomPrices = {
  suitePrice: 2500,
  dormPrice: 450,
};

let maintenanceStatus = {
  maintenanceSuites: 0,
  maintenanceDormBeds: 0,
  suiteMaintenanceReason: '',
  dormMaintenanceReason: '',
  updatedAt: new Date().toISOString(),
};

let societySettings = {
  societyName: 'Wayanad District Police Co-operative Society Ltd. No. W 208',
  property: 'Mountain Stay Retreat',
  address: 'Mananthavady, Wayanad, Kerala 670645',
  receptionPhone: '+91 70250 17611',
  managerPhone: '+91 98450 12345',
  checkInTime: '13:00',
  checkOutTime: '12:00',
  razorpayMode: 'test',
  cancellationPolicy:
    'Full refund if cancelled at least 24 hours prior to check-in date. Cancellations within 24 hours incur 1-night retention charges.',
};

// Dynamic transactional stores (initialized empty, storing real activity only)
let bookings = [];
let transactions = [];
let refunds = [];
let auditLogs = [
  {
    id: 'AUD-001',
    timestamp: new Date().toISOString(),
    userId: 'USR-001',
    username: 'admin',
    role: 'admin',
    action: 'SYSTEM_INITIALIZATION',
    targetType: 'System',
    targetId: 'W208',
    details: 'WDPCS Accommodation system initialized with clean default values.',
    ip: '127.0.0.1',
  },
];
let notifications = [];

function logAuditEvent(adminUser, action, targetType, targetId, details, req) {
  const logEntry = {
    id: 'AUD-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
    timestamp: new Date().toISOString(),
    userId: adminUser?.id || 'ANONYMOUS',
    username: adminUser?.username || 'SYSTEM',
    role: adminUser?.role || 'SYSTEM',
    action,
    targetType,
    targetId: String(targetId || 'N/A'),
    details: typeof details === 'object' ? JSON.stringify(details) : String(details),
    ip: req?.headers['x-forwarded-for'] || req?.socket?.remoteAddress || '127.0.0.1',
  };
  auditLogs.unshift(logEntry);
  if (auditLogs.length > 500) auditLogs.pop();
  return logEntry;
}

// Validation helper
function validateBookingData({ name, email, phone, date, roomType }) {
  const errors = [];
  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    errors.push('Guest name is required (minimum 2 characters).');
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || typeof email !== 'string' || !emailRegex.test(email.trim())) {
    errors.push('A valid email address is required (e.g. name@example.com).');
  }
  const phoneDigits = (phone || '').replace(/\D/g, '');
  if (!phone || typeof phone !== 'string' || phoneDigits.length < 7) {
    errors.push('A valid contact phone number with at least 7 digits is required.');
  }
  if (!date || typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    errors.push('A valid check-in date in YYYY-MM-DD format is required.');
  }
  if (!roomType || typeof roomType !== 'string') {
    errors.push('Room type selection is required.');
  }
  return errors;
}

function checkRoomAvailability(date, roomType) {
  const activeBookings = bookings.filter(
    (b) => b.status !== 'Cancelled' && b.date === date
  );
  const isDorm = (roomType || '').toLowerCase().includes('dormitory');
  const isSuite = (roomType || '').toLowerCase().includes('suite');

  if (isSuite) {
    const bookedSuites = activeBookings.filter((b) => b.roomType.includes('Suite')).length;
    const availableSuites = Math.max(0, TOTAL_SUITES - bookedSuites - maintenanceStatus.maintenanceSuites);
    if (availableSuites <= 0) {
      return {
        available: false,
        error: `Suite rooms are completely booked or under maintenance on ${date}. Please choose another date.`,
      };
    }
  } else if (isDorm) {
    const bookedDormBeds = activeBookings.filter((b) => b.roomType.includes('Dormitory')).length;
    const availableDormBeds = Math.max(0, TOTAL_DORM_BEDS - bookedDormBeds - maintenanceStatus.maintenanceDormBeds);
    if (availableDormBeds <= 0) {
      return {
        available: false,
        error: `Dormitory beds are completely booked or under maintenance on ${date}. Please choose another date.`,
      };
    }
  }
  return { available: true };
}

// ==========================================
// 4. PUBLIC GUEST API ENDPOINTS (rooms.wdpcs.in)
// ==========================================

// Public availability endpoint
app.get('/api/availability', (req, res) => {
  const { date } = req.query;
  const activeBookings = bookings.filter(
    (b) => b.status !== 'Cancelled' && (!date || b.date === date)
  );

  const bookedSuites = activeBookings.filter((b) => b.roomType.includes('Suite')).length;
  const bookedDormBeds = activeBookings.filter((b) => b.roomType.includes('Dormitory')).length;

  const availableSuites = Math.max(0, TOTAL_SUITES - bookedSuites - maintenanceStatus.maintenanceSuites);
  const availableDormBeds = Math.max(0, TOTAL_DORM_BEDS - bookedDormBeds - maintenanceStatus.maintenanceDormBeds);

  res.json({
    date: date || null,
    totalSuites: TOTAL_SUITES,
    availableSuites,
    maintenanceSuites: maintenanceStatus.maintenanceSuites,
    totalDormBeds: TOTAL_DORM_BEDS,
    availableDormBeds,
    maintenanceDormBeds: maintenanceStatus.maintenanceDormBeds,
    roomPrices,
  });
});

// Public prices endpoint
app.get('/api/prices', (req, res) => {
  res.json(roomPrices);
});

// Public Counter booking reservation
app.post('/book-counter', (req, res) => {
  try {
    const { name, email, phone, date, roomType } = req.body;

    const validationErrors = validateBookingData({ name, email, phone, date, roomType });
    if (validationErrors.length > 0) {
      return res.status(400).json({ success: false, error: validationErrors[0], errors: validationErrors });
    }

    const availCheck = checkRoomAvailability(date, roomType);
    if (!availCheck.available) {
      return res.status(400).json({ success: false, error: availCheck.error });
    }

    const bookingId = 'MSR-CTR-' + Math.floor(100000 + Math.random() * 900000);
    const amount = roomType && roomType.includes('Dormitory') ? roomPrices.dormPrice : roomPrices.suitePrice;

    const newBooking = {
      id: bookingId,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone ? phone.trim() : '',
      date,
      roomType: roomType || 'Suite Room (₹2,500/night)',
      amount,
      paymentMethod: 'Pay at Counter / Property',
      status: 'Pending at Check-in',
      createdAt: new Date().toISOString(),
    };

    bookings.unshift(newBooking);

    // Create Admin Notification
    const notif = {
      id: 'NOTIF-' + Date.now(),
      type: 'new_booking',
      bookingId: newBooking.id,
      title: `New Reservation: ${newBooking.name}`,
      message: `${newBooking.name} reserved ${newBooking.roomType} for ${newBooking.date} (₹${newBooking.amount.toLocaleString('en-IN')})`,
      amount: newBooking.amount,
      roomType: newBooking.roomType,
      guestName: newBooking.name,
      guestPhone: newBooking.phone,
      guestEmail: newBooking.email,
      checkInDate: newBooking.date,
      paymentMethod: newBooking.paymentMethod,
      read: false,
      createdAt: new Date().toISOString(),
    };
    notifications.unshift(notif);

    res.status(201).json({
      success: true,
      bookingId,
      message: 'Booking confirmed! Please pay at the counter during check-in.',
      details: newBooking,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Razorpay Order creation (Key Secret is NEVER returned)
app.post('/create-order', async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount || isNaN(Number(amount))) {
      return res.status(400).json({ error: 'Valid amount is required.' });
    }

    const options = {
      amount: Math.round(Number(amount) * 100), // in paise
      currency: 'INR',
      receipt: 'rcpt_' + Date.now().toString().slice(-6),
    };

    const order = await razorpay.orders.create(options);
    res.json({
      id: order.id,
      amount: order.amount,
      currency: order.currency,
      key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_dummy',
    });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Razorpay order creation failed.' });
  }
});

// Confirm online payment
app.post('/api/confirm-online-booking', (req, res) => {
  try {
    const { id, name, email, phone, date, roomType, amount, paymentId, orderId } = req.body;

    const validationErrors = validateBookingData({ name, email, phone, date, roomType });
    if (validationErrors.length > 0) {
      return res.status(400).json({ success: false, error: validationErrors[0] });
    }

    const availCheck = checkRoomAvailability(date, roomType);
    if (!availCheck.available) {
      return res.status(400).json({ success: false, error: availCheck.error });
    }

    const bookingId = id || ('MSR-RZP-' + Math.floor(100000 + Math.random() * 900000));
    const calculatedAmount = Number(amount) || (roomType.includes('Dormitory') ? roomPrices.dormPrice : roomPrices.suitePrice);

    const newBooking = {
      id: bookingId,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone ? phone.trim() : '',
      date,
      roomType,
      amount: calculatedAmount,
      paymentMethod: 'Online Pre-payment (Razorpay)',
      status: 'Paid Online',
      createdAt: new Date().toISOString(),
    };

    bookings.unshift(newBooking);

    // Record Transaction
    transactions.unshift({
      id: 'TXN-' + Date.now(),
      orderId: orderId || 'order_direct',
      paymentId: paymentId || 'pay_online_auto',
      bookingId,
      guestName: newBooking.name,
      amount: calculatedAmount,
      paymentMethod: 'Razorpay Online',
      status: 'Captured',
      createdAt: new Date().toISOString(),
    });

    // Notify Admin
    notifications.unshift({
      id: 'NOTIF-' + Date.now(),
      type: 'new_booking',
      bookingId: newBooking.id,
      title: `Online Payment Confirmed: ${newBooking.name}`,
      message: `${newBooking.name} paid ₹${calculatedAmount.toLocaleString('en-IN')} for ${newBooking.roomType}`,
      amount: calculatedAmount,
      roomType: newBooking.roomType,
      guestName: newBooking.name,
      guestPhone: newBooking.phone,
      guestEmail: newBooking.email,
      checkInDate: newBooking.date,
      paymentMethod: newBooking.paymentMethod,
      read: false,
      createdAt: new Date().toISOString(),
    });

    res.status(201).json({
      success: true,
      bookingId: newBooking.id,
      message: 'Online booking confirmed successfully!',
      booking: newBooking,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==========================================
// 5. ADMINISTRATIVE API (roomsadmin.wdpcs.in)
// ==========================================

// Staff Login
app.post('/api/admin/login', (req, res) => {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
  const rateCheck = checkRateLimit(ip);
  if (!rateCheck.allowed) {
    return res.status(429).json({ success: false, error: rateCheck.error });
  }

  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ success: false, error: 'Username and password are required.' });
  }

  const user = staffUsers.find(
    (u) => u.username.toLowerCase() === username.trim().toLowerCase() && u.active
  );

  const givenHash = hashPassword(password);
  if (user && user.passwordHash === givenHash) {
    registerSuccessfulLogin(ip);

    const tokenPayload = {
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
      email: user.email,
    };

    const token = generateToken(tokenPayload);

    logAuditEvent(user, 'STAFF_LOGIN', 'Auth', user.id, `User ${user.username} (${user.role}) logged in successfully.`, req);

    return res.json({
      success: true,
      token,
      user: tokenPayload,
    });
  }

  registerFailedLogin(ip);
  return res.status(401).json({
    success: false,
    error: 'Invalid staff credentials. Please check your username and password.',
  });
});

// Staff Session Verification
app.get('/api/admin/me', requireAuth(), (req, res) => {
  res.json({
    success: true,
    user: req.adminUser,
    society: societySettings,
  });
});

// Staff Logout
app.post('/api/admin/logout', requireAuth(), (req, res) => {
  logAuditEvent(req.adminUser, 'STAFF_LOGOUT', 'Auth', req.adminUser.id, 'Session terminated.', req);
  res.json({ success: true, message: 'Logged out successfully.' });
});

// Dashboard Overview KPIs
app.get('/api/admin/dashboard/stats', requireAuth(), (req, res) => {
  const todayStr = new Date().toISOString().split('T')[0];

  const todayCheckIns = bookings.filter((b) => b.date === todayStr && b.status !== 'Cancelled');
  const todayCheckOuts = bookings.filter((b) => b.status === 'Checked In'); // In-house ready for checkout

  const activeBookings = bookings.filter((b) => b.status !== 'Cancelled');
  const occupiedSuites = activeBookings.filter((b) => b.roomType.includes('Suite') && (b.status === 'Checked In' || b.date === todayStr)).length;
  const occupiedDormBeds = activeBookings.filter((b) => b.roomType.includes('Dormitory') && (b.status === 'Checked In' || b.date === todayStr)).length;

  const totalCapacity = TOTAL_SUITES + TOTAL_DORM_BEDS;
  const totalOccupied = occupiedSuites + occupiedDormBeds;
  const occupancyPercentage = Math.round((totalOccupied / totalCapacity) * 100);

  const availableSuites = Math.max(0, TOTAL_SUITES - occupiedSuites - maintenanceStatus.maintenanceSuites);
  const availableDormBeds = Math.max(0, TOTAL_DORM_BEDS - occupiedDormBeds - maintenanceStatus.maintenanceDormBeds);

  const pendingBookings = bookings.filter((b) => b.status.includes('Pending')).length;
  const confirmedBookings = bookings.filter((b) => b.status === 'Paid Online' || b.status === 'Paid at Counter' || b.status === 'Checked In').length;

  const totalRevenue = bookings.filter((b) => b.status !== 'Cancelled').reduce((sum, b) => sum + (b.amount || 0), 0);
  const onlineRevenue = bookings.filter((b) => b.status === 'Paid Online').reduce((sum, b) => sum + (b.amount || 0), 0);
  const counterRevenue = bookings.filter((b) => b.status === 'Paid at Counter').reduce((sum, b) => sum + (b.amount || 0), 0);

  res.json({
    todayDate: todayStr,
    todayCheckInsCount: todayCheckIns.length,
    todayCheckIns,
    todayCheckOutsCount: todayCheckOuts.length,
    todayCheckOuts,
    occupancyPercentage,
    totalOccupied,
    totalCapacity,
    availableSuites,
    totalSuites: TOTAL_SUITES,
    maintenanceSuites: maintenanceStatus.maintenanceSuites,
    availableDormBeds,
    totalDormBeds: TOTAL_DORM_BEDS,
    maintenanceDormBeds: maintenanceStatus.maintenanceDormBeds,
    pendingBookings,
    confirmedBookings,
    totalBookings: bookings.length,
    revenue: {
      total: totalRevenue,
      online: onlineRevenue,
      counter: counterRevenue,
    },
    roomPrices,
  });
});

// Bookings List with Filters
app.get('/api/admin/bookings', requireAuth(), (req, res) => {
  const { search, status, roomType, date } = req.query;
  let result = [...bookings];

  if (search) {
    const s = search.toLowerCase();
    result = result.filter(
      (b) =>
        b.id.toLowerCase().includes(s) ||
        b.name.toLowerCase().includes(s) ||
        b.email.toLowerCase().includes(s) ||
        (b.phone && b.phone.toLowerCase().includes(s))
    );
  }

  if (status && status !== 'All') {
    result = result.filter((b) => b.status === status);
  }

  if (roomType && roomType !== 'All') {
    result = result.filter((b) => b.roomType.toLowerCase().includes(roomType.toLowerCase()));
  }

  if (date) {
    result = result.filter((b) => b.date === date);
  }

  res.json({ success: true, count: result.length, bookings: result });
});

// Manual Front Desk Walk-In Booking
app.post('/api/admin/bookings/walkin', requireAuth(['admin', 'manager', 'receptionist']), (req, res) => {
  const { name, email, phone, date, roomType, amount, paymentMethod, status, notes } = req.body;

  const validationErrors = validateBookingData({ name, email, phone, date, roomType });
  if (validationErrors.length > 0) {
    return res.status(400).json({ success: false, error: validationErrors[0] });
  }

  const bookingId = 'MSR-CTR-' + Math.floor(100000 + Math.random() * 900000);
  const calculatedAmount = Number(amount) || (roomType.includes('Dormitory') ? roomPrices.dormPrice : roomPrices.suitePrice);

  const newBooking = {
    id: bookingId,
    name: name.trim(),
    email: email.trim().toLowerCase(),
    phone: phone ? phone.trim() : '',
    date,
    roomType,
    amount: calculatedAmount,
    paymentMethod: paymentMethod || 'Cash at Counter',
    status: status || 'Paid at Counter',
    notes: notes || 'Front Desk Walk-in',
    createdBy: req.adminUser.username,
    createdAt: new Date().toISOString(),
  };

  bookings.unshift(newBooking);

  // If marked paid, create transaction record
  if (newBooking.status === 'Paid at Counter' || newBooking.status === 'Checked In') {
    transactions.unshift({
      id: 'TXN-' + Date.now(),
      orderId: 'counter_reception',
      paymentId: 'CASH_' + bookingId,
      bookingId,
      guestName: newBooking.name,
      amount: calculatedAmount,
      paymentMethod: newBooking.paymentMethod,
      status: 'Captured',
      createdAt: new Date().toISOString(),
    });
  }

  logAuditEvent(req.adminUser, 'CREATE_WALKIN_BOOKING', 'Booking', bookingId, `Created walk-in booking for ${newBooking.name} (₹${calculatedAmount})`, req);

  res.status(201).json({ success: true, booking: newBooking });
});

// Update Booking Status
app.patch('/api/admin/bookings/:id', requireAuth(), (req, res) => {
  const { id } = req.params;
  const { status, notes } = req.body;
  const booking = bookings.find((b) => b.id === id);

  if (!booking) {
    return res.status(404).json({ success: false, error: 'Booking not found.' });
  }

  const oldStatus = booking.status;
  if (status) booking.status = status;
  if (notes !== undefined) booking.notes = notes;

  logAuditEvent(req.adminUser, 'UPDATE_BOOKING_STATUS', 'Booking', id, `Changed status from '${oldStatus}' to '${status}'.`, req);

  res.json({ success: true, booking });
});

// Delete Booking (Admin & Manager only)
app.delete('/api/admin/bookings/:id', requireAuth(['admin', 'manager']), (req, res) => {
  const { id } = req.params;
  const initialLength = bookings.length;
  bookings = bookings.filter((b) => b.id !== id);

  if (bookings.length === initialLength) {
    return res.status(404).json({ success: false, error: 'Booking not found.' });
  }

  logAuditEvent(req.adminUser, 'DELETE_BOOKING', 'Booking', id, `Removed booking ${id}.`, req);
  res.json({ success: true, message: 'Booking removed from records.' });
});

// Inventory Status & Maintenance Controls
app.get('/api/admin/inventory', requireAuth(), (req, res) => {
  const todayStr = new Date().toISOString().split('T')[0];
  const activeBookings = bookings.filter((b) => b.date === todayStr && b.status !== 'Cancelled');

  const suiteList = Array.from({ length: TOTAL_SUITES }, (_, i) => {
    const suiteNo = i + 1;
    const isUnderMaint = suiteNo <= maintenanceStatus.maintenanceSuites;
    const booked = activeBookings.filter((b) => b.roomType.includes('Suite'))[i];
    return {
      id: `SUITE-${suiteNo}`,
      number: `Suite 10${suiteNo}`,
      type: 'Suite Room',
      rate: roomPrices.suitePrice,
      status: isUnderMaint ? 'Maintenance' : booked ? (booked.status === 'Checked In' ? 'Occupied' : 'Reserved') : 'Available',
      currentGuest: booked ? { id: booked.id, name: booked.name, phone: booked.phone } : null,
      maintenanceReason: isUnderMaint ? maintenanceStatus.suiteMaintenanceReason : null,
    };
  });

  const dormList = Array.from({ length: TOTAL_DORM_BEDS }, (_, i) => {
    const bedNo = i + 1;
    const isUnderMaint = bedNo <= maintenanceStatus.maintenanceDormBeds;
    const booked = activeBookings.filter((b) => b.roomType.includes('Dormitory'))[i];
    return {
      id: `DORM-${bedNo}`,
      number: `Bed D-${bedNo < 10 ? '0' + bedNo : bedNo}`,
      type: 'Dormitory Bed',
      rate: roomPrices.dormPrice,
      status: isUnderMaint ? 'Maintenance' : booked ? (booked.status === 'Checked In' ? 'Occupied' : 'Reserved') : 'Available',
      currentGuest: booked ? { id: booked.id, name: booked.name, phone: booked.phone } : null,
      maintenanceReason: isUnderMaint ? maintenanceStatus.dormMaintenanceReason : null,
    };
  });

  res.json({
    totalSuites: TOTAL_SUITES,
    totalDormBeds: TOTAL_DORM_BEDS,
    suiteList,
    dormList,
    maintenanceStatus,
    roomPrices,
  });
});

// Update Maintenance Controls
app.post('/api/admin/maintenance', requireAuth(['admin', 'manager']), (req, res) => {
  const { maintenanceSuites, maintenanceDormBeds, suiteMaintenanceReason, dormMaintenanceReason } = req.body;

  if (maintenanceSuites !== undefined) {
    maintenanceStatus.maintenanceSuites = Math.min(TOTAL_SUITES, Math.max(0, Number(maintenanceSuites)));
  }
  if (maintenanceDormBeds !== undefined) {
    maintenanceStatus.maintenanceDormBeds = Math.min(TOTAL_DORM_BEDS, Math.max(0, Number(maintenanceDormBeds)));
  }
  if (suiteMaintenanceReason !== undefined) {
    maintenanceStatus.suiteMaintenanceReason = String(suiteMaintenanceReason);
  }
  if (dormMaintenanceReason !== undefined) {
    maintenanceStatus.dormMaintenanceReason = String(dormMaintenanceReason);
  }
  maintenanceStatus.updatedAt = new Date().toISOString();

  logAuditEvent(req.adminUser, 'UPDATE_MAINTENANCE', 'Inventory', 'MAINT', maintenanceStatus, req);
  res.json({ success: true, maintenanceStatus });
});

app.get('/api/admin/maintenance', requireAuth(), (req, res) => {
  res.json(maintenanceStatus);
});

// Update Room Prices
app.post('/api/admin/prices', requireAuth(['admin', 'manager']), (req, res) => {
  const { suitePrice, dormPrice } = req.body;
  const oldPrices = { ...roomPrices };

  if (suitePrice !== undefined && !isNaN(Number(suitePrice))) {
    roomPrices.suitePrice = Number(suitePrice);
  }
  if (dormPrice !== undefined && !isNaN(Number(dormPrice))) {
    roomPrices.dormPrice = Number(dormPrice);
  }

  logAuditEvent(req.adminUser, 'UPDATE_PRICES', 'Pricing', 'RATES', { oldPrices, newPrices: roomPrices }, req);
  res.json({ success: true, roomPrices });
});

// Availability Calendar View (Next 30 days)
app.get('/api/admin/calendar', requireAuth(), (req, res) => {
  const { days = 30 } = req.query;
  const calendarData = [];
  const today = new Date();

  for (let i = 0; i < Number(days); i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];

    const dayBookings = bookings.filter((b) => b.date === dateStr && b.status !== 'Cancelled');
    const suitesBooked = dayBookings.filter((b) => b.roomType.includes('Suite')).length;
    const dormBooked = dayBookings.filter((b) => b.roomType.includes('Dormitory')).length;

    const suitesAvailable = Math.max(0, TOTAL_SUITES - suitesBooked - maintenanceStatus.maintenanceSuites);
    const dormAvailable = Math.max(0, TOTAL_DORM_BEDS - dormBooked - maintenanceStatus.maintenanceDormBeds);

    calendarData.push({
      date: dateStr,
      dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
      suitesBooked,
      suitesAvailable,
      totalSuites: TOTAL_SUITES,
      dormBooked,
      dormAvailable,
      totalDormBeds: TOTAL_DORM_BEDS,
      hasMaintenance: maintenanceStatus.maintenanceSuites > 0 || maintenanceStatus.maintenanceDormBeds > 0,
      bookings: dayBookings.map((b) => ({ id: b.id, name: b.name, roomType: b.roomType, status: b.status })),
    });
  }

  res.json({ success: true, days: calendarData.length, calendar: calendarData });
});

// Guest Directory CRM
app.get('/api/admin/guests', requireAuth(), (req, res) => {
  const guestMap = new Map();

  bookings.forEach((b) => {
    const key = b.email || b.phone || b.name;
    if (!guestMap.has(key)) {
      guestMap.set(key, {
        name: b.name,
        email: b.email,
        phone: b.phone,
        totalBookings: 0,
        totalSpent: 0,
        lastVisit: b.date,
        history: [],
      });
    }

    const g = guestMap.get(key);
    g.totalBookings += 1;
    if (b.status !== 'Cancelled') {
      g.totalSpent += b.amount || 0;
    }
    g.history.push({
      id: b.id,
      date: b.date,
      roomType: b.roomType,
      amount: b.amount,
      status: b.status,
    });
  });

  const guestList = Array.from(guestMap.values()).sort((a, b) => b.totalSpent - a.totalSpent);
  res.json({ success: true, count: guestList.length, guests: guestList });
});

// Transactions & Razorpay Monitoring
app.get('/api/admin/transactions', requireAuth(), (req, res) => {
  res.json({ success: true, count: transactions.length, transactions });
});

// Cancellations & Refunds Management
app.get('/api/admin/refunds', requireAuth(), (req, res) => {
  res.json({ success: true, refunds });
});

app.post('/api/admin/refunds', requireAuth(['admin', 'manager']), (req, res) => {
  const { bookingId, refundAmount, reason, refundMethod } = req.body;
  const booking = bookings.find((b) => b.id === bookingId);

  if (!booking) {
    return res.status(404).json({ success: false, error: 'Booking not found.' });
  }

  booking.status = 'Cancelled';

  const refundEntry = {
    id: 'REF-' + Date.now().toString().slice(-6),
    bookingId,
    guestName: booking.name,
    amount: booking.amount,
    refundAmount: Number(refundAmount) || booking.amount,
    reason: reason || 'Customer requested cancellation',
    refundMethod: refundMethod || 'Cash Counter Settlement',
    status: 'Processed',
    processedBy: req.adminUser.username,
    createdAt: new Date().toISOString(),
  };

  refunds.unshift(refundEntry);
  logAuditEvent(req.adminUser, 'PROCESS_REFUND', 'Refund', refundEntry.id, refundEntry, req);

  res.status(201).json({ success: true, refund: refundEntry });
});

// Reports & Analytics
app.get('/api/admin/reports', requireAuth(), (req, res) => {
  const totalBookings = bookings.length;
  const activeBookings = bookings.filter((b) => b.status !== 'Cancelled');
  const cancelledBookings = bookings.filter((b) => b.status === 'Cancelled');
  const totalRevenue = activeBookings.reduce((sum, b) => sum + (b.amount || 0), 0);

  // Group by room type
  const suiteBookings = activeBookings.filter((b) => b.roomType.includes('Suite'));
  const dormBookings = activeBookings.filter((b) => b.roomType.includes('Dormitory'));

  const suiteRevenue = suiteBookings.reduce((sum, b) => sum + (b.amount || 0), 0);
  const dormRevenue = dormBookings.reduce((sum, b) => sum + (b.amount || 0), 0);

  // Group by payment method
  const onlineBookings = activeBookings.filter((b) => b.paymentMethod.includes('Online'));
  const counterBookings = activeBookings.filter((b) => b.paymentMethod.includes('Counter'));

  res.json({
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
    bookingsRoster: bookings,
  });
});

// User & Role Management (Super Admin only)
app.get('/api/admin/users', requireAuth(['admin']), (req, res) => {
  const sanitizedUsers = staffUsers.map((user) => {
    const copy = { ...user };
    delete copy.passwordHash;
    return copy;
  });
  res.json({ success: true, users: sanitizedUsers });
});

app.post('/api/admin/users', requireAuth(['admin']), (req, res) => {
  const { username, name, role, password, email, phone } = req.body;
  if (!username || !password || !role) {
    return res.status(400).json({ success: false, error: 'Username, password, and role are required.' });
  }

  const existing = staffUsers.find((u) => u.username.toLowerCase() === username.trim().toLowerCase());
  if (existing) {
    return res.status(400).json({ success: false, error: 'Username already in use.' });
  }

  const newUser = {
    id: 'USR-' + (staffUsers.length + 1).toString().padStart(3, '0'),
    username: username.trim().toLowerCase(),
    name: name || username,
    role: role || 'receptionist',
    passwordHash: hashPassword(password),
    email: email || `${username}@wdpcs.in`,
    phone: phone || '',
    active: true,
    createdAt: new Date().toISOString(),
  };

  staffUsers.push(newUser);
  logAuditEvent(req.adminUser, 'CREATE_USER', 'User', newUser.id, `Created staff user ${newUser.username} with role ${newUser.role}`, req);

  const sanitized = { ...newUser };
  delete sanitized.passwordHash;
  res.status(201).json({ success: true, user: sanitized });
});

// Get Logged-in Staff Profile
app.get('/api/admin/profile', requireAuth(), (req, res) => {
  const user = staffUsers.find((u) => u.id === req.adminUser.id);
  if (!user) {
    return res.status(404).json({ success: false, error: 'User profile not found.' });
  }
  const sanitized = { ...user };
  delete sanitized.passwordHash;
  res.json({ success: true, profile: sanitized });
});

// Update Logged-in Staff Profile
app.put('/api/admin/profile', requireAuth(), (req, res) => {
  const user = staffUsers.find((u) => u.id === req.adminUser.id);
  if (!user) {
    return res.status(404).json({ success: false, error: 'User profile not found.' });
  }

  const { name, email, phone } = req.body;
  if (name) user.name = name.trim();
  if (email) user.email = email.trim();
  if (phone !== undefined) user.phone = phone.trim();

  logAuditEvent(req.adminUser, 'UPDATE_PROFILE', 'User', user.id, `User ${user.username} updated profile information.`, req);

  const tokenPayload = {
    id: user.id,
    username: user.username,
    name: user.name,
    role: user.role,
    email: user.email,
  };
  const newToken = generateToken(tokenPayload);

  res.json({
    success: true,
    message: 'Profile updated successfully.',
    user: tokenPayload,
    token: newToken,
  });
});

// Self Password Reset / Change
app.post('/api/admin/profile/change-password', requireAuth(), (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ success: false, error: 'Current password and new password are required.' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ success: false, error: 'New password must be at least 6 characters long.' });
  }

  const user = staffUsers.find((u) => u.id === req.adminUser.id);
  if (!user) {
    return res.status(404).json({ success: false, error: 'User not found.' });
  }

  if (user.passwordHash !== hashPassword(currentPassword)) {
    return res.status(400).json({ success: false, error: 'Current password is incorrect.' });
  }

  user.passwordHash = hashPassword(newPassword);
  logAuditEvent(req.adminUser, 'CHANGE_PASSWORD', 'Auth', user.id, `User ${user.username} changed their account password.`, req);

  res.json({ success: true, message: 'Password changed successfully.' });
});

// Admin Edit Staff User Profile & Role
app.patch('/api/admin/users/:id', requireAuth(['admin']), (req, res) => {
  const { id } = req.params;
  const user = staffUsers.find((u) => u.id === id);
  if (!user) {
    return res.status(404).json({ success: false, error: 'Staff account not found.' });
  }

  const { name, role, email, phone, active } = req.body;
  if (name !== undefined) user.name = name.trim();
  if (email !== undefined) user.email = email.trim();
  if (phone !== undefined) user.phone = phone.trim();
  if (role !== undefined) user.role = role;
  if (active !== undefined) user.active = Boolean(active);

  logAuditEvent(req.adminUser, 'ADMIN_UPDATE_USER', 'User', id, `Updated staff profile for ${user.username} (${user.role})`, req);

  const sanitized = { ...user };
  delete sanitized.passwordHash;
  res.json({ success: true, user: sanitized, message: 'Staff profile updated successfully.' });
});

// Admin Reset Staff Password
app.post('/api/admin/users/:id/reset-password', requireAuth(['admin']), (req, res) => {
  const { id } = req.params;
  const { newPassword } = req.body;

  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({ success: false, error: 'Password must be at least 6 characters long.' });
  }

  const user = staffUsers.find((u) => u.id === id);
  if (!user) {
    return res.status(404).json({ success: false, error: 'Staff account not found.' });
  }

  user.passwordHash = hashPassword(newPassword);
  logAuditEvent(req.adminUser, 'ADMIN_RESET_PASSWORD', 'Auth', id, `Admin reset password for staff member ${user.username}`, req);

  res.json({ success: true, message: `Password for ${user.username} has been reset successfully.` });
});

// Admin Delete / Deactivate Staff User
app.delete('/api/admin/users/:id', requireAuth(['admin']), (req, res) => {
  const { id } = req.params;
  if (id === req.adminUser.id) {
    return res.status(400).json({ success: false, error: 'You cannot delete your own administrative account.' });
  }

  const idx = staffUsers.findIndex((u) => u.id === id);
  if (idx === -1) {
    return res.status(404).json({ success: false, error: 'Staff account not found.' });
  }

  const removed = staffUsers.splice(idx, 1)[0];
  logAuditEvent(req.adminUser, 'ADMIN_DELETE_USER', 'User', id, `Deleted staff account ${removed.username}`, req);

  res.json({ success: true, message: `Staff account ${removed.username} has been removed.` });
});

// Audit Logs
app.get('/api/admin/audit-logs', requireAuth(), (req, res) => {
  res.json({ success: true, count: auditLogs.length, auditLogs });
});

// System Settings
app.get('/api/admin/settings', requireAuth(), (req, res) => {
  res.json({ success: true, settings: societySettings });
});

app.post('/api/admin/settings', requireAuth(['admin']), (req, res) => {
  societySettings = { ...societySettings, ...req.body };
  logAuditEvent(req.adminUser, 'UPDATE_SETTINGS', 'Settings', 'GLOBAL', societySettings, req);
  res.json({ success: true, settings: societySettings });
});

// Admin Notifications
app.get('/api/admin/notifications', requireAuth(), (req, res) => {
  const unreadCount = notifications.filter((n) => !n.read).length;
  res.json({
    success: true,
    unreadCount,
    totalCount: notifications.length,
    notifications,
  });
});

app.patch('/api/admin/notifications/:id/read', requireAuth(), (req, res) => {
  const { id } = req.params;
  const notif = notifications.find((n) => n.id === id);
  if (notif) {
    notif.read = true;
    const unreadCount = notifications.filter((n) => !n.read).length;
    return res.json({ success: true, notification: notif, unreadCount });
  }
  res.status(404).json({ success: false, error: 'Notification not found' });
});

app.post('/api/admin/notifications/mark-all-read', requireAuth(), (req, res) => {
  notifications.forEach((n) => {
    n.read = true;
  });
  res.json({ success: true, unreadCount: 0 });
});

app.delete('/api/admin/notifications/:id', requireAuth(), (req, res) => {
  const { id } = req.params;
  const initialLength = notifications.length;
  notifications = notifications.filter((n) => n.id !== id);
  if (notifications.length === initialLength) {
    return res.status(404).json({ success: false, error: 'Notification not found' });
  }
  const unreadCount = notifications.filter((n) => !n.read).length;
  res.json({ success: true, message: 'Notification removed', unreadCount });
});

// System Data Reset (Super Admin only)
app.post('/api/admin/system/reset', requireAuth(['admin']), (req, res) => {
  const { mode = 'factory_seed' } = req.body;

  if (mode === 'clear_all') {
    bookings = [];
    transactions = [];
    refunds = [];
    notifications = [];
    maintenanceStatus = {
      maintenanceSuites: 0,
      maintenanceDormBeds: 0,
      suiteMaintenanceReason: '',
      dormMaintenanceReason: '',
      updatedAt: new Date().toISOString(),
    };
    logAuditEvent(
      req.adminUser,
      'DATA_RESET_CLEAR_ALL',
      'System',
      'ALL_RECORDS',
      'Cleared all active bookings, transactions, and refund records.',
      req
    );
    return res.json({
      success: true,
      message: 'All reservation and transaction history records have been cleared successfully.',
    });
  }

  // Default: Restore clean default state
  bookings = [];
  transactions = [];
  refunds = [];
  notifications = [];
  roomPrices = {
    suitePrice: 2500,
    dormPrice: 450,
  };
  maintenanceStatus = {
    maintenanceSuites: 0,
    maintenanceDormBeds: 0,
    suiteMaintenanceReason: '',
    dormMaintenanceReason: '',
    updatedAt: new Date().toISOString(),
  };

  logAuditEvent(
    req.adminUser,
    'DATA_RESET_FACTORY',
    'System',
    'FACTORY_SEED',
    'Restored all reservations, inventory tariffs, and transactions to factory defaults.',
    req
  );

  res.json({
    success: true,
    message: 'System data successfully restored to factory defaults.',
  });
});

// Public health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    service: 'WDPCS Accommodation Unified API',
    domains: {
      guest: 'https://rooms.wdpcs.in',
      admin: 'https://roomsadmin.wdpcs.in',
    },
  });
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🛡️  WDPCS Accommodation API Server running on port ${PORT}`);
  console.log(`   Guest Domain:  https://rooms.wdpcs.in`);
  console.log(`   Admin Domain:  https://roomsadmin.wdpcs.in`);
  console.log(`=======================================================`);
});