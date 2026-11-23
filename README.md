# MAK Tours and Travels ERP (MAK-ERP)

Enterprise Resource Planning (ERP) system for **MAK Tours and Travels**, architected with a decoupled React.js frontend and Express.js backend.

---

## 1. Technology Stack

### Frontend
- **Framework / Library**: React 18
- **Build Tool / Bundler**: Vite
- **Language**: JavaScript (ES6+)
- **Package Manager**: npm
- **Port**: `5173`

### Backend
- **Runtime**: Node.js (ES Modules)
- **Framework**: Express.js
- **Language**: JavaScript (ES6+)
- **Package Manager**: npm
- **Port**: `5000`

### Database (Planned)
- **Database**: MongoDB (will be integrated in subsequent milestones)

---

## 2. Directory Structure

```text
MAK-ERP/
│
├── frontend/
│   ├── public/                 # Static assets directly served by Vite
│   │
│   ├── src/
│   │   ├── assets/             # Raw media and global style assets
│   │   │   ├── images/         # Project images and logos
│   │   │   ├── icons/          # Vector icons and symbol assets
│   │   │   └── styles/         # Global stylesheets and CSS variables
│   │   │
│   │   ├── components/         # Reusable React components
│   │   │   ├── common/         # Generic components (Buttons, Inputs, Modals)
│   │   │   ├── layout/         # Structural components (Navbar, Sidebar, Footer)
│   │   │   └── ui/             # Design-system / atomic UI primitives
│   │   │
│   │   ├── layouts/            # Page layout templates (AdminLayout, PublicLayout)
│   │   ├── pages/              # Routed view / page components
│   │   ├── routes/             # App routing definitions and route guards
│   │   ├── services/           # API clients and HTTP communication layer
│   │   ├── hooks/              # Custom reusable React hooks
│   │   ├── context/            # React Context providers for global state
│   │   ├── utils/              # Helper functions and formatting utilities
│   │   │
│   │   ├── App.jsx             # Root React component
│   │   └── main.jsx            # React DOM mounting entry point
│   │
│   ├── .env.example            # Frontend environment variable template
│   ├── .gitignore              # Frontend Git exclusion rules
│   ├── index.html              # Vite HTML entry template
│   ├── package.json            # Frontend dependencies and scripts
│   └── vite.config.js          # Vite build and server configuration
│
├── backend/
│   ├── src/
│   │   ├── config/             # Environment, database, and third-party configuration
│   │   ├── controllers/        # Express request handling and business logic orchestration
│   │   ├── routes/             # Express API endpoint definitions
│   │   ├── models/             # Data schemas and database models (MongoDB/Mongoose)
│   │   ├── services/           # Reusable core business logic layer
│   │   ├── middleware/         # Custom Express middleware (auth, logging, error handling)
│   │   ├── validators/         # Input validation schemas and sanitizers
│   │   ├── utils/              # Backend utility helpers and constants
│   │   │
│   │   ├── app.js              # Express app initialization, middleware, and base routes
│   │   └── server.js           # Server bootstrap and port listener
│   │
│   ├── .env.example            # Backend environment variable template
│   ├── .gitignore              # Backend Git exclusion rules
│   └── package.json            # Backend dependencies and scripts
│
├── .gitignore                  # Root Git exclusion rules
├── README.md                   # Project documentation and architectural overview
└── package.json                # Root orchestration package configuration
```

---

## 3. Folder Responsibilities

### Frontend Folders
| Folder | Purpose |
|---|---|
| `public/` | Static files (favicon, manifest, static media) served without Vite bundling. |
| `src/assets/images/` | Static graphics, illustrations, and logos. |
| `src/assets/icons/` | Custom SVG icons and icon assets. |
| `src/assets/styles/` | Global CSS stylesheets, theme definitions, and CSS reset. |
| `src/components/common/` | Shared, reusable generic components (Buttons, Inputs, Dialogs). |
| `src/components/layout/` | Structural UI components like Header, Sidebar, and Footer. |
| `src/components/ui/` | Primitive UI components matching the design system. |
| `src/layouts/` | Shell templates wrapping groups of pages with shared layout. |
| `src/pages/` | Page-level components corresponding to specific routes. |
| `src/routes/` | Application routing configuration, route guards, and path constants. |
| `src/services/` | Centralized API client service calls (e.g., Axios/Fetch modules). |
| `src/hooks/` | Custom React hooks encapsulating shared stateful logic. |
| `src/context/` | React Context definitions for application-wide state management. |
| `src/utils/` | Formatting, validation, date, and math helper functions. |

### Backend Folders
| Folder | Purpose |
|---|---|
| `src/config/` | Central configuration files (environment variables, database connector). |
| `src/controllers/` | Request handlers containing endpoint logic and response dispatching. |
| `src/routes/` | Route definitions mapping HTTP methods and endpoints to controllers. |
| `src/models/` | Database schemas and entity definitions for MongoDB/Mongoose. |
| `src/services/` | Dedicated business logic decoupled from HTTP transport. |
| `src/middleware/` | Express middleware functions (JWT validation, error handling, rate limiting). |
| `src/validators/` | Request payload schema validators (e.g., Joi / Zod). |
| `src/utils/` | Shared backend utility functions, custom error classes, and loggers. |

---

## 4. Setup and Installation

### Prerequisites
- Node.js (`v18+` or higher recommended, tested on `v24.x`)
- npm (`v9+` or higher)

### Installation
Run the following command from the root directory to install all dependencies for root, backend, and frontend:

```bash
npm run install:all
```

Alternatively, install each workspace individually:

```bash
# Root
npm install

# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

---

## 5. Development Server Execution

### Run Both Applications Simultaneously (Root)
From the project root directory:

```bash
npm run dev
```
This runs the Express backend on port `5000` and Vite frontend on port `5173` concurrently.

### Run Individually

**Backend Only:**
```bash
# From root
npm run backend

# Or from backend directory
cd backend
npm run dev
```
Backend will start on: **http://localhost:5000** (Health check: http://localhost:5000/api/health)

**Frontend Only:**
```bash
# From root
npm run frontend

# Or from frontend directory
cd frontend
npm run dev
```
Frontend will start on: **http://localhost:5173**

---

## 6. Environment Configurations

Both `frontend/` and `backend/` contain `.env.example` templates. To customize environments, copy `.env.example` to `.env` in respective directories:

```bash
# Backend
cp backend/.env.example backend/.env

# Frontend
cp frontend/.env.example frontend/.env
```

---

## 7. Frontend State Architecture & Backend Migration Blueprint

Currently, the MAK ERP operations, finance, driver dispatch, and customer booking logic are implemented on the client side using centralized React contexts with persistent `localStorage` synchronization. All core business rules and state machines documented below must be migrated to the Express/MongoDB backend in future milestones:

### 1. Business Logic Currently Handled in Frontend Contexts
- **Trip & Assignment Lifecycle (`TripContext.jsx`)**:
  - Canonical 3-tier status model (`bookingStatus`, `tripStatus`, `driverAssignmentStatus`).
  - Strict date overlap and schedule conflict validation for drivers and vehicles (`isDriverAvailable`, `isVehicleAvailable`).
  - Sequential journey progression: Grace period check, starting odometer validation ($\ge$ vehicle's current odometer), ending odometer validation ($>$ start odometer), vehicle/driver release only if no other active trips exist.
  - Reassignment preserves historic assignment records as `Reassigned` / `Declined`.
- **Finance & Accounting Engine (`TripContext.jsx`, `AdminDataContext.jsx`)**:
  - Revenue recognition: Only bookings with `bookingStatus: 'Completed'` are recognized as revenue.
  - Cash collections: Sum of advance payments and balance receipts across non-cancelled bookings.
  - Receivables: `recognisedRevenue` minus collections on completed bookings.
  - Refunds Due: Tracked for cancelled bookings that had paid advances.
  - Operating expenses & Net Profit: Net profit is derived exclusively from real recorded expenses (`recognisedRevenue - approvedTripExpenses - approvedOfficeExpenses`), eliminating fabricated overheads.
  - Sequential payment receipts (`REC-YYYY-XXXX`) and post-trip invoice generation (`INV-YYYY-XXXX`).
  - Expense state machine: Strict linear transitions (`Pending Approval` $\rightarrow$ `Approved` / `Rejected` $\rightarrow$ `Paid`), immutable approved/paid records, driver-specific resubmissions.
  - Vendor payables: `completedVendorCost - vendorPaymentsMade`.
- **Data Integrity & Sequential Identifiers (`idGenerator.js`, `storage.js`)**:
  - Monotonic entity ID generation (`BK-`, `TRP-`, `INV-`, `PAY-`, `REC-`, `EXP-`, `DRV-`, `VEH-`, `CUST-`, `VND-`, `HTL-`, `PKG-`, `EMP-`).
  - Synchronized `localStorage` persistence with cross-context event broadcasting.
- **Enterprise Access Control & Role Protection (`AuthContext.jsx`, `ProtectedRoute.jsx`)**:
  - Role-gated portal entry for Super Admin, Admin Operations, Driver, and Vendor.
  - Centralized demo credential repository (`src/constants/demoUsers.js`).

### 2. Statutory Fleet Rule
> **IMPORTANT SYSTEM CONSTRAINT**: "ONE WAY TRIP" is strictly prohibited across the entire MAK Tours & Travels platform. Supported commercial booking categories are restricted to:
> - Round Trip
> - Local Trip
> - Tour Package
> - Airport Transfer
> - Custom Journey

