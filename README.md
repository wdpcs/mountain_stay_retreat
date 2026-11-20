# Mountain Stay Retreat — WDPCS Accommodation System

Official accommodation reservation and management system for **Mountain Stay Retreat**, operated by **Wayanad District Police Co-operative Society Ltd. No. W 208** in Kalpetta North, Wayanad, Kerala.

---

## Architecture Overview

The platform operates across three dedicated subdomains under `wdpcs.in`:

| Subdomain | Component | Directory | Description |
| :--- | :--- | :--- | :--- |
| **`rooms.wdpcs.in`** | Public Guest Portal | `src/` | Public reservation portal for Executive Suites and Dormitory beds. |
| **`roomsadmin.wdpcs.in`** | Staff Admin Portal | `admin/src/` | Front-desk console for reservations, inventory tariffs, walk-in bookings, reports, and staff management. |
| **`api.wdpcs.in`** | Central Express API | `Server/` | Unified Node.js backend providing authentication, Razorpay payments, and live Supabase synchronization. |

---

## Key Features

- **Public Guest Booking (`rooms.wdpcs.in`):**
  - Real-time availability checks for 5 Executive Suites and 15 Dormitory beds.
  - Multi-step booking wizard with instant price calculation and validation.
  - Razorpay online payment integration with Pay at Counter / UPI fallback support.
  - Automated booking confirmation and receipt generation.

- **Staff Admin Console (`roomsadmin.wdpcs.in`):**
  - **Overview & Statistics:** Live occupancy, revenue tracking, and quick actions.
  - **Booking Management:** Check-in, check-out, status transitions, and walk-in creation.
  - **Inventory & Dynamic Pricing:** Seasonal tariff adjustments and maintenance room toggles.
  - **Availability Calendar:** Visual day-by-day room occupancy calendar.
  - **Guest Directory & Reports:** Exportable guest data and booking archives.
  - **User & Security Management:** Role-based access control (`admin`, `manager`, `receptionist`), session tokens, and cryptographic audit logging.

- **Backend API & Database (`Server/` & `supabase/`):**
  - Express server with secure JWT authentication and brute-force rate limiting.
  - Dual storage architecture: direct Supabase Cloud PostgreSQL database with in-memory resilient fallback.
  - Host-based reverse proxy static serving support for unified single-server deployments.

---

## Development Setup

### 1. Prerequisites
- Node.js 20+ installed
- npm 10+ installed

### 2. Environment Configuration
Copy the example environment files to configure local and production credentials:
```bash
# Frontend client configuration
cp .env.example .env

# Backend API server configuration
cp Server/.env.example Server/.env
```

### 3. Available Scripts

| Command | Action |
| :--- | :--- |
| `npm run dev` | Launch the Public Guest Portal dev server (`http://localhost:5173`) |
| `npm run dev:admin` | Launch the Staff Admin Portal dev server (`http://localhost:5174`) |
| `npm run server` | Start the local Node.js API server (`http://localhost:5000`) |
| `npm run build` | Unified production build (`dist/` for guest portal and `dist/admin/` for admin portal) |
| `npm run build:guest` | Build only the Public Guest Portal into `dist/` |
| `npm run build:admin` | Build only the Staff Admin Portal into `dist/admin/` |
| `npm run lint` | Run ESLint across all guest, admin, and server codebases |
| `npm run preview` | Preview production build of the Guest Portal |
| `npm run preview:admin` | Preview production build of the Admin Portal |
| `npm run deploy:guest` | Deploy `dist/` to GitHub Pages (`gh-pages` branch) |
| `npm run deploy:admin` | Deploy `dist/admin/` to GitHub Pages (`gh-pages-admin` branch) |

---

## Production Deployment & DNS Guide

For detailed hostinger DNS zone records, VPS Nginx configuration, PM2 process management, and SSL certificate setup, refer to:
👉 [DEPLOYMENT_AND_DNS_GUIDE.md](./DEPLOYMENT_AND_DNS_GUIDE.md)

---

## License & Ownership

Proprietary software developed for **Wayanad District Police Co-operative Society Ltd. No. W 208**. All rights reserved.
