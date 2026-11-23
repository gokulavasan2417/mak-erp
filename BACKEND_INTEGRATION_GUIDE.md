# MAK Tours & Travels ERP - Full-Stack Backend Integration Guide

## 1. Architecture Overview

The system is now completely prepared for full-stack operation with a decoupled **Express.js API Backend** (`/backend`) and **Vite + React Frontend** (`/frontend`).

```
MAK ERP
├── backend/
│   ├── src/
│   │   ├── config/          # Database & Environment Configuration (db.js)
│   │   ├── controllers/     # REST Controllers (auth, bookings, trips, drivers, fleet, vendors, finance)
│   │   ├── middleware/      # Auth, Request Logger, Error Handler
│   │   ├── routes/          # Express Routers (auth, bookings, trips, drivers, vehicles, vendors, finance)
│   │   ├── app.js           # Express App Configuration & Middleware Pipeline
│   │   └── server.js        # Server Entry Point (Port 5000)
│   ├── .env                 # Backend Environment Variables
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── services/        # Centralized HTTP API Layer (apiClient, authService, bookingService, etc.)
│   │   ├── context/         # Hybrid Contexts with Backend Health Detection & Fallback
│   ├── vite.config.js       # Vite Dev Server with Automatic `/api` -> `http://localhost:5000` Proxy
│   ├── .env                 # Frontend Environment Variables (`VITE_API_BASE_URL=/api`)
│   └── package.json
│
├── dev.js                   # Unified Runner (Runs both Backend & Frontend concurrently)
└── package.json             # Root Scripts (`npm run dev`, `npm run backend`, `npm run frontend`)
```

---

## 2. Quick Start Commands

### A. Start Full Stack (Recommended)
From the project root:
```bash
npm run dev
```
- Starts the **Backend API** at `http://localhost:5000`
- Starts the **Frontend UI** at `http://localhost:5173`
- Frontend requests to `/api/*` are automatically proxied to `http://localhost:5000/api/*` with zero CORS issues.

### B. Start Backend Only
```bash
npm run backend
```

### C. Start Frontend Only
```bash
npm run frontend
```

---

## 3. Frontend Service Layer (`frontend/src/services/`)

All HTTP interactions pass through the centralized, strongly-typed service layer:

| Service Module | Purpose | Key Methods |
| :--- | :--- | :--- |
| `apiClient.js` | Base HTTP wrapper | `get()`, `post()`, `put()`, `patch()`, `delete()`, `healthCheck()` |
| `authService.js` | Authentication & Sessions | `login()`, `register()`, `getProfile()`, `logout()` |
| `bookingService.js` | Bookings Management | `getAll()`, `getById()`, `create()`, `update()`, `assign()`, `cancel()` |
| `tripService.js` | Driver Dispatch & Lifecycle | `getAssignments()`, `acceptAssignment()`, `declineAssignment()`, `arriveAtPickup()`, `startTrip()`, `endTrip()` |
| `driverService.js` | Chauffeur Directory | `getAll()`, `getById()`, `create()`, `update()`, `getAvailability()`, `updateAvailability()` |
| `vehicleService.js` | Fleet Assets | `getAll()`, `getById()`, `create()`, `update()`, `delete()`, `updateStatus()` |
| `vendorService.js` | Partner Network & Attached Fleet | `getAll()`, `getById()`, `create()`, `getVehicles()`, `addVehicle()` |
| `financeService.js` | Accounting, Expenses & Payouts | `getOverview()`, `getExpenses()`, `createExpense()`, `getPayments()`, `getInvoices()` |
| `notificationService.js` | Ops & Dispatch Alerts | `getAll()`, `markAsRead()`, `markAllAsRead()` |

---

## 4. REST API Endpoint Directory

All routes are mounted at `/api/*`:

### Authentication (`/api/auth`)
- `POST /api/auth/login` - Authenticate user credentials and retrieve Bearer JWT
- `POST /api/auth/register` - Chauffeur / Vendor application onboarding
- `GET  /api/auth/me` - Get profile for authenticated user
- `POST /api/auth/logout` - Invalidate session

### Bookings (`/api/bookings`)
- `GET  /api/bookings` - List all bookings (supports `?status=&category=&driverId=&vehicleId=`)
- `GET  /api/bookings/:id` - Retrieve full booking manifest
- `POST /api/bookings` - Create new booking (*One Way Trip strictly rejected*)
- `PUT  /api/bookings/:id` - Update booking details
- `POST /api/bookings/:id/assign` - Assign chauffeur and vehicle to booking
- `POST /api/bookings/:id/cancel` - Cancel booking with operational reason

### Trips & Chauffeur Lifecycle (`/api/trips`)
- `GET  /api/trips/assignments` - Retrieve assignments pending driver acceptance
- `POST /api/trips/:id/accept` - Driver accepts trip assignment
- `POST /api/trips/:id/decline` - Driver declines trip assignment
- `POST /api/trips/:id/arrive` - Chauffeur marks arrival at pickup point
- `POST /api/trips/:id/start` - Record starting odometer and start journey
- `POST /api/trips/:id/end` - Record ending odometer, remarks, and trigger salary credit

### Fleet & Vehicles (`/api/vehicles`)
- `GET    /api/vehicles` - List all fleet vehicles (Company Owned & Vendor Attached)
- `GET    /api/vehicles/:id` - Vehicle telematic profile
- `POST   /api/vehicles` - Add vehicle asset
- `PUT    /api/vehicles/:id` - Update vehicle specs / maintenance status
- `DELETE /api/vehicles/:id` - Remove vehicle asset

### Vendors (`/api/vendors`)
- `GET  /api/vendors` - List all partner vendors
- `GET  /api/vendors/:id` - Vendor profile
- `POST /api/vendors` - Onboard new fleet vendor
- `GET  /api/vendors/:id/vehicles` - List vehicles attached by this vendor
- `POST /api/vendors/:id/vehicles` - Add vendor vehicle (automatically tagged with vendor name & ID in Admin Fleet)

### Finance & Accounting (`/api/finance`)
- `GET   /api/finance/overview` - Executive metrics (Revenue, Expenses, Driver Salaries, Vendor Payouts, Net Profit)
- `GET   /api/finance/expenses` - List all operational expenses & claims
- `POST  /api/finance/expenses` - Submit expense claim
- `PATCH /api/finance/expenses/:id/status` - Approve / Reject expense
- `GET   /api/finance/payments` - Transaction ledger
- `POST  /api/finance/payments` - Record customer advance or balance collection
- `GET   /api/finance/invoices` - Tax invoices & billing statements

---

## 5. Connecting a Real Database (MongoDB / PostgreSQL)

Currently, `backend/src/config/db.js` provides an in-memory data store with realistic seed data. Because all controllers interact through service functions, connecting a database is straightforward:

### To connect MongoDB (Mongoose):
1. Install mongoose in backend:
   ```bash
   npm --prefix backend install mongoose
   ```
2. Update `backend/src/config/db.js` to connect to `process.env.MONGODB_URI`:
   ```javascript
   import mongoose from 'mongoose';
   export const connectDB = async () => {
     await mongoose.connect(process.env.MONGODB_URI);
     console.log('MongoDB Connected');
   };
   ```
3. Create Mongoose models in `backend/src/models/` for `Booking`, `Driver`, `Vehicle`, `Vendor`, `Expense`.

### To connect PostgreSQL (Prisma):
1. Install Prisma in backend:
   ```bash
   npm --prefix backend install @prisma/client prisma
   ```
2. Run `npx prisma init` in `backend/` and define schema.
3. Import `prisma` in controllers.
