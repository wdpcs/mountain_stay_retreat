# WDPCS Accommodation System — Multi-Domain Deployment & Hostinger DNS Guide

**Entity:** Wayanad District Police Co-operative Society Ltd. No. W 208  
**Property:** Mountain Stay Retreat (Suites & Dormitory)  
**System Architecture:** Independent 3-Tier Multi-Domain Infrastructure  

---

## 1. Architecture Overview

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
                                  CENTRAL DATA STORE
                                (Bookings, Audit, Rates)
```

---

## 2. Hostinger DNS Zone Configuration

Log into your **Hostinger Control Panel (hPanel)**:
1. Navigate to **Domains** → Select **wdpcs.in** → **DNS / Nameservers**.
2. Add or update the following DNS records:

| Record Type | Subdomain / Name | Points To / Target Value | TTL | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| **CNAME** | `rooms` | `<your-github-username>.github.io` *(or Hostinger server IP / domain)* | `300` | Public Guest Portal (`rooms.wdpcs.in`) |
| **CNAME** | `roomsadmin` | `<your-github-username>.github.io` *(or admin repository pages target)* | `300` | Staff Admin Portal (`roomsadmin.wdpcs.in`) |
| **A** | `api` | `<Your VPS / Cloud IP Address>` *(e.g. Hostinger VPS)* | `300` | Central Backend API (`api.wdpcs.in`) |

> [!NOTE]
> If using Cloudflare or Hostinger Proxy, enable **SSL Full (Strict)** and set DNS proxy mode to "Proxied" (orange cloud) for automatic SSL certificate issuance.

---

## 3. GitHub Pages Deployment Strategy

Because GitHub Pages assigns **one custom domain per repository**, there are two battle-tested approaches:

### Approach A: Dual Repositories (Recommended for strict isolation)
1. **Public Guest Repository:** `mountain_stay_retreat`
   - Build output: `dist/` (contains `CNAME` with `rooms.wdpcs.in`)
   - Deploy command: `npm run deploy:guest`
   - In GitHub Settings → Pages → Custom Domain: `rooms.wdpcs.in`

2. **Dedicated Admin Repository:** `wdpcs-accommodation-admin`
   - Copy or initialize the `admin/` directory as its own GitHub repository.
   - Build output: `admin/dist/` (contains `CNAME` with `roomsadmin.wdpcs.in`)
   - In GitHub Settings → Pages → Custom Domain: `roomsadmin.wdpcs.in`

### Approach B: Single Repo with Hostinger Web Hosting (All-in-One)
On Hostinger Web Hosting / Cloud Hosting:
1. Create Subdomains in hPanel:
   - `rooms.wdpcs.in` → Root folder: `/public_html/rooms`
   - `roomsadmin.wdpcs.in` → Root folder: `/public_html/roomsadmin`
2. Build both frontends locally:
   ```bash
   npm run build:all
   ```
3. Upload `dist/*` files to `/public_html/rooms`
4. Upload `admin/dist/*` files to `/public_html/roomsadmin`

---

## 4. Backend Deployment (`api.wdpcs.in`)

### Setting up the Node.js API on Hostinger VPS or Cloud Server:
1. Transfer the `Server/` directory to the server:
   ```bash
   cd /var/www/wdpcs-api
   npm install --production
   ```
2. Create production `.env` file:
   ```env
   PORT=5000
   NODE_ENV=production
   SESSION_SECRET=your_long_cryptographic_jwt_secret_2026
   RAZORPAY_KEY_ID=rzp_live_your_actual_key_id
   RAZORPAY_KEY_SECRET=your_actual_razorpay_secret
   ```
3. Run with **PM2 Process Manager**:
   ```bash
   npm install -g pm2
   pm2 start Server.js --name "wdpcs-accommodation-api"
   pm2 startup
   pm2 save
   ```
4. Configure Nginx Reverse Proxy for `api.wdpcs.in`:
   ```nginx
   server {
       server_name api.wdpcs.in;

       location / {
           proxy_pass http://127.0.0.1:5000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```
5. Install SSL Certificate:
   ```bash
   certbot --nginx -d api.wdpcs.in
   ```

---

## 5. Security Checklist

- [x] **Zero Admin Footprint on Guest Site:** No admin components or credentials bundled in `rooms.wdpcs.in`.
- [x] **JWT Authentication:** Cryptographic signature verification on every `/api/admin/*` endpoint.
- [x] **Role-Based Access Control (RBAC):** Privileges enforced for `admin`, `manager`, and `receptionist`.
- [x] **Rate Limiting:** Maximum 5 failed login attempts per 15 minutes to defeat brute force attacks.
- [x] **CORS Whitelist:** Access restricted strictly to `rooms.wdpcs.in`, `roomsadmin.wdpcs.in`, and verified local origins.
- [x] **Secrets Isolation:** `RAZORPAY_KEY_SECRET` never leaves the backend environment.
- [x] **Audit Trail:** All price modifications, cancellations, refunds, and walk-ins recorded in immutable audit logs.

---

## 6. Local Development Reference

| Service | Command | URL |
| :--- | :--- | :--- |
| **Guest Website** | `npm run dev` | [http://localhost:5173/](http://localhost:5173/) |
| **Admin Portal** | `npm run dev:admin` | [http://localhost:5174/](http://localhost:5174/) |
| **Backend API** | `npm run server` | [http://localhost:5000/](http://localhost:5000/) |
| **Build Both Portals** | `npm run build:all` | Produces `dist/` & `admin/dist/` |
