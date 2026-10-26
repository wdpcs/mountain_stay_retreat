# WDPCS Accommodation System — Multi-Domain Deployment & Hostinger DNS Guide

**Entity:** Wayanad District Police Co-operative Society Ltd. No. W 208  
**Property:** Mountain Stay Retreat (Suites & Dormitory)  
**System Architecture:** Production Multi-Domain Cloud Infrastructure  

---

## 1. Architecture & Domain Overview

The retreat accommodation platform binds three dedicated subdomains under `wdpcs.in`:

```
                                  HOSTINGER DNS ZONE
                                     (wdpcs.in)
                 ┌─────────────────────────┼─────────────────────────┐
                 │                         │                         │
                 ▼                         ▼                         ▼
          rooms.wdpcs.in          roomsadmin.wdpcs.in           api.wdpcs.in
        Public Guest Portal        Staff Admin Portal        Central Express API
        (Vite + React SPA)        (Vite + React SPA)        (Node.js / Port 5000)
                 │                         │                         ▲
                 │   Public Booking Data   │    Secure JWT Session   │
                 └─────────────────────────┼─────────────────────────┘
                                           │
                                  SUPABASE CLOUD DB
                           (PostgreSQL Live Reservations)
```

| Subdomain | Target System | Audience | SSL Certificate |
| :--- | :--- | :--- | :--- |
| **`rooms.wdpcs.in`** | Public Guest SPA | Society Members, Police Personnel, Public Guests | Required (HTTPS) |
| **`roomsadmin.wdpcs.in`** | Admin & Front-Desk Console | CSO, Retreat Manager, Receptionist Staff | Required (HTTPS) |
| **`api.wdpcs.in`** | Backend API & Database Engine | Secure Internal API (Razorpay, Auth, Supabase Sync) | Required (HTTPS) |

---

## 2. Hostinger DNS Zone Configuration

Log into your **Hostinger Control Panel (hPanel)**:
1. Navigate to **Domains** → Select **wdpcs.in** → **DNS / Nameservers**.
2. Add or update the following DNS records according to your chosen deployment strategy:

### Standard Production DNS Table:
| Type | Name / Subdomain | Points To / Target Value | TTL | Note |
| :---: | :--- | :--- | :---: | :--- |
| **A** | `rooms` | `<Server Public IP Address>` | `300` | Points to your VPS or Web Hosting IP |
| **A** | `roomsadmin` | `<Server Public IP Address>` | `300` | Points to your VPS or Web Hosting IP |
| **A** | `api` | `<Server Public IP Address>` | `300` | Points to your VPS running Node.js / Port 5000 |

*(If using GitHub Pages for static frontends, point `rooms` and `roomsadmin` CNAMEs to `<username>.github.io` instead).*

> [!TIP]
> If using Cloudflare DNS or Hostinger Proxy, set SSL to **Full (Strict)** and activate the orange cloud (Proxied) for automatic SSL renewal and DDoS mitigation.

---

## 3. Deployment Architectures

You can deploy the platform using any of the following 3 architectures:

### Option A: Unified VPS / Cloud Server (Recommended — Simplest & Most Resilient)
Both frontends (`dist/` and `dist/admin/`) and the Node.js API run on a single Hostinger VPS or Linux Cloud Server. The Express server in `Server/Server.js` automatically routes requests based on the `Host` / `X-Forwarded-Host` header!

1. **Build locally with production API URL:**
   ```bash
   # Set production API URL in .env.production
   VITE_API_URL=https://api.wdpcs.in
   npm run build:all
   ```
2. **Transfer Project to Server (`/var/www/wdpcs-retreat`):**
   ```bash
   scp -r dist admin/dist Server package.json user@your-server-ip:/var/www/wdpcs-retreat
   ```
3. **Configure Environment in `Server/.env`:**
   ```env
   PORT=5000
   NODE_ENV=production
   SESSION_SECRET=your_super_strong_random_jwt_secret_64_chars
   RAZORPAY_KEY_ID=rzp_live_your_actual_key_id
   RAZORPAY_KEY_SECRET=your_actual_live_razorpay_secret
   VITE_SUPABASE_URL=https://djbizcrfqqurtfwiivds.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your_live_service_role_secret_key
   ```
4. **Start with PM2:**
   ```bash
   cd /var/www/wdpcs-retreat
   npm install --production
   pm2 start Server/Server.js --name "wdpcs-retreat"
   pm2 startup && pm2 save
   ```
5. **Nginx Reverse Proxy (`/etc/nginx/sites-available/wdpcs.conf`):**
   ```nginx
   server {
       server_name rooms.wdpcs.in roomsadmin.wdpcs.in api.wdpcs.in;

       location / {
           proxy_pass http://127.0.0.1:5000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_set_header X-Forwarded-Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }
   }
   ```
6. **Obtain SSL Certificates:**
   ```bash
   sudo certbot --nginx -d rooms.wdpcs.in -d roomsadmin.wdpcs.in -d api.wdpcs.in
   ```

---

### Option B: Hostinger Web Hosting (cPanel / hPanel) + Backend API
Host static files in Hostinger Web Hosting file manager and run the API on Node.js:
1. In hPanel, create subdomains:
   - `rooms.wdpcs.in` → Root folder: `/public_html/rooms`
   - `roomsadmin.wdpcs.in` → Root folder: `/public_html/roomsadmin`
2. Run build:
   ```bash
   npm run build:all
   ```
3. Upload contents of `dist/*` (except `admin/` folder) to `/public_html/rooms/`.
4. Upload contents of `dist/admin/*` to `/public_html/roomsadmin/`.
5. Point `api.wdpcs.in` to your Hostinger Node.js application (running `Server/Server.js`).

---

### Option C: GitHub Pages / Cloudflare Pages + Remote API
1. Deploy `dist/` to `gh-pages` branch with custom domain `rooms.wdpcs.in`.
2. Deploy `dist/admin/` to `gh-pages-admin` branch with custom domain `roomsadmin.wdpcs.in`.
3. Point API calls to `https://api.wdpcs.in` hosted on Render, Railway, or VPS.

---

## 4. Production Environment Configuration Checklist

### Frontend Client Build (`.env.production`):
```env
VITE_SUPABASE_URL=https://djbizcrfqqurtfwiivds.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_live_anon_key
VITE_API_URL=https://api.wdpcs.in
VITE_RAZORPAY_KEY_ID=rzp_live_your_actual_key_id
```

### Backend API Server (`Server/.env`):
```env
PORT=5000
NODE_ENV=production
SESSION_SECRET=wdpcs_super_secure_jwt_random_secret_2026_w208_mountain_retreat
RAZORPAY_KEY_ID=rzp_live_your_actual_key_id
RAZORPAY_KEY_SECRET=your_actual_live_razorpay_secret
VITE_SUPABASE_URL=https://djbizcrfqqurtfwiivds.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_secret_key
VITE_SUPABASE_ANON_KEY=your_supabase_anon_public_key
```

---

## 5. Pre-Flight Verification & Health Check

After DNS propagation and server deployment, verify each link:

- [ ] **API Health Check:** Visit `https://api.wdpcs.in/api/health` ➔ Should return:
  ```json
  {
    "status": "online",
    "service": "WDPCS Accommodation Unified API",
    "domains": {
      "guest": "https://rooms.wdpcs.in",
      "admin": "https://roomsadmin.wdpcs.in"
    }
  }
  ```
- [ ] **Guest Portal:** Visit `https://rooms.wdpcs.in` ➔ Verify room tariffs (Suite ₹2,500, Dorm ₹450) and test Razorpay modal opening.
- [ ] **Admin Portal:** Visit `https://roomsadmin.wdpcs.in` ➔ Log in with `admin` / `reception` credentials.
- [ ] **CORS Verification:** In browser DevTools Console, verify that API requests succeed with zero CORS or Mixed Content warnings.
- [ ] **Live Database Sync:** Create a test walk-in booking on `roomsadmin.wdpcs.in` and confirm it immediately appears in your Supabase `bookings` table.

