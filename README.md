# FreightIQ App

FreightIQ is a role-based logistics platform for **shippers** and **carriers**, built with Next.js + Supabase.

It supports:
- load posting and lifecycle management
- carrier marketplace matching and acceptance
- shipment tracking with live route maps
- sustainability analytics (CO2 + offsets)
- report exports (CSV)
- delivery receipt PDF generation with barcode
- authentication with login/register/forgot-password/reset-password

---

## 1) Tech Stack

- **Frontend/App:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4
- **Auth + DB + RLS:** Supabase (Postgres + Auth + RLS)
- **Maps:** Leaflet + OpenStreetMap tiles
- **Geospatial:** Turf.js
- **Routing APIs:** OpenRouteService (optional), Nominatim geocoding (optional/fallback)
- **Icons/Typography:** Material Symbols, Space Grotesk

---

## 2) Role-Based Product Features

### Shipper
- Dashboard with operational KPIs and recommendations
- Manage loads:
  - Create load
  - Edit open loads
  - Delete open loads without active shipment
  - Filter/search by query, status, mode
- Track active shipments:
  - Live journey board with map and timeline
  - Shipment detail view
- Sustainability:
  - Total CO2, offset totals, baseline savings
  - Modal split and monthly footprint
  - Recent records table
- Reports:
  - Monthly shipment summaries
  - Shipment-level reporting
  - CSV export endpoint

### Carrier
- Dashboard with availability, assignments, delivery, and analytics cards
- Marketplace:
  - Browse open loads
  - Filter by mode/freight type/pickup window/min budget/search
  - Fit scoring + labels
  - Load acceptance flow
- Assigned shipments:
  - Status updates (matched -> picked_up -> in_transit -> delivered)
  - Live dispatcher map
  - Timeline updates (location + note)
  - Shipment detail page
- Settings:
  - Carrier profile create/update
  - Service modes and fleet size
  - Coverage corridors (Origin -> Destination)
  - Route posting/removal helpers
- Delivery receipt:
  - Downloadable PDF for delivered shipments only
  - Code39 barcode included

### Shared
- Secure auth session handling via Supabase SSR
- `/dashboard/*` middleware protection
- Role-aware dashboard navigation and route gating

---

## 3) Authentication & Authorization

### Auth Methods Currently Enabled
- Email/password login
- Email/password registration
- Forgot password email
- Reset password flow via callback session

Google login and enterprise SSO are not wired in the current UI flow.

### Auth Pages
- `/auth?mode=login`
- `/auth?mode=register`
- `/auth/reset-password`
- `/auth/callback` (Supabase code exchange)

### Role Rules
- Roles in `profiles.role`: `shipper`, `carrier`, `admin`
- Carrier-focused routes are enforced in server logic.
- Shipper-focused routes are enforced in server logic.
- Middleware ensures unauthenticated users are redirected to auth.

---

## 4) Transport Modes & Shipment Statuses

### Supported transport modes
- `truck`
- `ev_truck`
- `van`
- `flatbed`
- `reefer`
- `drayage`
- `rail`
- `intermodal`
- `sea`
- `air`
- `express_air`

### Load statuses
- `open`
- `matched`
- `in_transit`
- `delivered`
- `cancelled`

### Shipment statuses
- `matched`
- `picked_up`
- `in_transit`
- `delivered`
- `cancelled`

DB constraints enforce valid mode/status values.

---

## 5) Maps & Live Tracking Behavior

### Realtime Journey Board
- Polls shipment feeds every **20 seconds**
- Poll timeout: **15 seconds**
- Shows up to 8 visible journeys
- If `prioritizeActiveJourneys` is true, focuses on active statuses first

### Route geometry strategy
- For truck-like modes (`truck`, `ev_truck`, `van`, `flatbed`, `reefer`, `drayage`, `intermodal`):
  - Uses OpenRouteService (`driving-hgv`) if `OPENROUTESERVICE_API_KEY` exists
  - Falls back to straight line geometry otherwise
- For air-like modes (`air`, `express_air`):
  - Uses great-circle arc fallback geometry

### Geocoding
- Uses DB coordinates if present
- If missing, attempts Nominatim geocoding

---

## 6) API Reference

All endpoints require authenticated session cookies unless otherwise noted.

### Carrier APIs

`GET /api/carrier/marketplace`
- Query: `search`, `mode`, `freightType`, `pickupWindow`, `minBudget`
- Returns filtered load opportunities with fit score

`GET /api/carrier/marketplace/:loadId`
- Returns detailed marketplace load data

`POST /api/carrier/loads/:loadId/accept`
- Body:
```json
{ "agreedPriceUsd": 1200 }
```
- Creates shipment if load is open and service mode matches

`GET /api/carrier/shipments`
- Query: `status`, `search`
- Returns assigned shipments

`GET /api/carrier/shipments/:shipmentId`
- Returns shipment detail

`PATCH /api/carrier/shipments/:shipmentId`
- Body:
```json
{ "status": "in_transit", "location": "Nashik", "note": "Crossed checkpoint" }
```

`GET /api/carrier/shipments/:shipmentId/receipt`
- Returns PDF receipt (delivered shipments only)

`GET /api/carrier/settings`
- Returns carrier settings snapshot

`PATCH /api/carrier/settings`
- Body:
```json
{
  "fullName": "John Doe",
  "companyName": "Acme Logistics",
  "fleetSize": 25,
  "serviceModes": ["truck", "reefer"],
  "corridorsText": "Ahmedabad -> Mumbai\nDelhi -> Jaipur"
}
```

### Shipper APIs

`GET /api/shipper/dashboard`
- Returns shipper dashboard data

`GET /api/shipper/loads`
- Returns shipper-owned loads

`POST /api/shipper/loads`
- Body:
```json
{
  "title": "Retail dispatch",
  "originAddress": "Ahmedabad",
  "destinationAddress": "Mumbai",
  "preferredMode": "truck",
  "weightKg": 5300,
  "volumeM3": 18,
  "freightType": "retail",
  "pickupDate": "2026-03-14",
  "deliveryDate": "2026-03-15",
  "budgetUsd": 1340
}
```

`GET /api/shipper/loads/:loadId`
- Returns load detail + shipment + modal comparison

`PATCH /api/shipper/loads/:loadId`
- Same body shape as create

`DELETE /api/shipper/loads/:loadId`
- Deletes only if load is open and not actively shipped

`GET /api/shipper/shipments`
- Returns shipper-linked shipments

`GET /api/shipper/sustainability`
- Returns CO2 and offset analytics

`GET /api/shipper/reports`
- Returns report aggregates and shipment reports

`GET /api/shipper/reports/export`
- Downloads CSV report export

### Maps API

`POST /api/maps/routes`
- Body:
```json
{ "journeys": [/* up to 8 journey items */] }
```
- Returns route geometry payload for live map rendering

---

## 7) Database Schema (Supabase)

Primary tables:
- `profiles` (auth-linked role profile)
- `loads` (shipper-created freight requests)
- `carriers` (carrier profile + service modes + corridors)
- `shipments` (carrier-load assignments)
- `co2_records` (shipment emissions accounting)
- `modal_comparisons` (mode benchmark per load)

Important constraints/business rules:
- one active shipment per load (partial unique index)
- trigger syncs shipment status -> load status
- RLS policies for shipper/carrier/admin access
- transport mode and service mode check constraints

See: `supabase/SCHEMA_RELATIONSHIPS.md`

---

## 8) Environment Configuration

Create `.env.local` (or update existing) with:

```env
NEXT_PUBLIC_SUPABASE_URL="https://<project-ref>.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="<anon-key>"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

SUPABASE_PROJECT_REF="<project-ref>"
SUPABASE_ACCESS_TOKEN="<personal-access-token>"

OPENROUTESERVICE_API_KEY="<optional-ors-key>"
NOMINATIM_CONTACT_EMAIL="<optional-contact-email>"
```

### Variable notes
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`: required for auth/session.
- `NEXT_PUBLIC_APP_URL`: used in email redirect URLs for auth callback/reset.
- `SUPABASE_PROJECT_REF`, `SUPABASE_ACCESS_TOKEN`: needed for Supabase CLI push/link commands.
- `OPENROUTESERVICE_API_KEY`: optional; enables detailed road routing for truck-like modes.
- `NOMINATIM_CONTACT_EMAIL`: optional but recommended for geocoding request identification.

Security note:
- Do not keep real production secrets in committed env files.
- Rotate keys if any sensitive value was shared.

---

## 9) Local Development

### Prerequisites
- Node.js 20+
- npm
- Supabase project (local or remote)
- Optional: Supabase CLI (`npx supabase ...`)

### Install
```bash
npm install
```

### Run
```bash
npm run dev
```

App URL:
- `http://localhost:3000`

### Quality checks
```bash
npm run lint
npm run build
```

---

## 10) Supabase Migration Workflow

Migrations are in:
- `supabase/migrations`

Current migration timeline includes:
- auth/profile bootstrap
- loads/carriers/shipments/co2/modal tables
- RLS hardening and recursion fixes
- expanded transport modes
- large demo data seeding

Typical remote push flow:
```bash
npx supabase link --project-ref <your-project-ref>
npx supabase db push
```

---

## 11) Demo Credentials (Seed Data)

Seed scripts include demo users with password:
- `SeedDemo123!`

Examples from `supabase/seed.sql`:
- `ava.shipper@freightiq.demo` (shipper)
- `noah.shipper@freightiq.demo` (shipper)
- `ethan.shipper@freightiq.demo` (shipper)
- `liam.carrier@freightiq.demo` (carrier)
- `mia.carrier@freightiq.demo` (carrier)
- `zoe.carrier@freightiq.demo` (carrier)
- `aria.admin@freightiq.demo` (admin)

Additional scenario users are added in migration-based seed files (for larger route and shipment datasets).

---

## 12) Project Structure

```text
freightiq-app/
  src/
    app/
      auth/                    # login/register/forgot/reset/callback
      dashboard/               # role-based pages + server actions
      api/                     # REST-like route handlers
    components/
      maps/                    # realtime journey board
      dashboard/               # badges + receipt downloader
      shared/                  # nav/header/buttons
    lib/
      shipper/                 # shipper domain services
      carrier/                 # carrier domain services
      maps/                    # route/geocode logic
      supabase/                # SSR/browser clients
      auth/                    # role-based routing helpers
      receipt/                 # code39 barcode renderer
  supabase/
    migrations/                # SQL migrations
    seed.sql                   # seed data
```

---

## 13) NPM Scripts

```json
{
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "eslint"
}
```

---

## 14) Troubleshooting

### Dashboard redirects to login repeatedly
- Check `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- Verify Supabase auth cookies are being set.

### Map visible area is blank
- Ensure network access to `tile.openstreetmap.org`.
- Check browser console for tile loading errors.
- Ensure shipment/load origin/destination coordinates exist or geocoding can resolve.

### Road routes not appearing
- Set `OPENROUTESERVICE_API_KEY`.
- Without it, app falls back to straight/arc geometry.

### Carrier cannot accept a load
- Ensure carrier profile exists.
- Ensure load is still `open`.
- Ensure carrier `serviceModes` includes load `preferredMode`.

### Cannot edit/delete shipper load
- Allowed only for open loads with no active shipment.

---

## 15) Deployment Notes

- Deploy as a standard Next.js app (Vercel recommended).
- Configure all required environment variables on the hosting platform.
- Apply Supabase migrations to target environment before enabling traffic.
- Keep anon/service credentials scoped correctly and rotated when needed.
