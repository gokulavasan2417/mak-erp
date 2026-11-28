# MAK TAXI Vendor App & MAK Journey ERP — API Integration Specification

> **Version:** 1.0  
> **Protocol:** HTTPS REST + JSON Webhooks  
> **Security:** Shared Secret API Key (`X-API-Key` / `Bearer`) + HMAC-SHA256 Signatures (`X-MAK-ERP-Signature`)  
> **Architectural Constraint:** Databases remain completely separate. No shared database connection is required. All communication occurs over secure APIs.

---

## 1. System Architecture & Overview

```
┌─────────────────────────────────┐                 ┌─────────────────────────────────┐
│     MAK TAXI Vendor App         │                 │       MAK Journey ERP           │
│     (Vendor Mobile/Backend)     │                 │   (Admin Portal & Operations)   │
│                                 │                 │                                 │
│  [Vendors Register & Approve]   │ ── API (1) ───► │  [Vendor Synced to ERP]         │
│                                 │                 │                                 │
│  [Receive Push & Buzzer Alert]  │ ◄─ Webhook (2) ─│  [Admin Assigns Outstation]     │
│                                 │                 │                                 │
│  [Vendor Selects Car & Driver]  │ ── API (3) ───► │  [Real-Time Manifest Updated]   │
└─────────────────────────────────┘                 └─────────────────────────────────┘
```

---

## 2. Authentication & Security Headers

All communication between the two backends is secured via:

| Header | Value | Description |
| :--- | :--- | :--- |
| `X-API-Key` or `X-MAK-TAXI-API-KEY` | Secret Key | Shared secret key configured in environment (`MAK_TAXI_API_KEY`) |
| `Authorization` | `Bearer <API_KEY>` | Standard Bearer token authentication (alternative) |
| `X-MAK-ERP-Signature` | `sha256=<hex>` | HMAC-SHA256 signature generated using `MAK_TAXI_WEBHOOK_SECRET` |
| `Content-Type` | `application/json` | All payloads are strict JSON |

Default Key (configurable in `.env`):
```env
MAK_TAXI_API_KEY=mak_taxi_sec_993847a82b01c3d4
MAK_TAXI_WEBHOOK_URL=https://api.maktaxi.com/api/webhooks/journey-erp
MAK_TAXI_WEBHOOK_SECRET=mak_taxi_sec_993847a82b01c3d4
```

---

## 3. Integration 1: Vendor Registration Sync

When a vendor registers in the **MAK TAXI Vendor App** and is approved by your app admin, your backend calls MAK Journey ERP to register or update that vendor in the ERP vendor list.

### Endpoint:
```http
POST /api/integrations/mak-taxi/vendors/sync
```

### Request Headers:
```http
Content-Type: application/json
X-API-Key: mak_taxi_sec_993847a82b01c3d4
```

### Request Body:
```json
{
  "externalVendorId": "TX-VND-001",
  "companyName": "Murugan Super Fleet Travels",
  "ownerName": "Murugan S",
  "contactPerson": "Murugan S",
  "phone": "+91 98401 11004",
  "email": "murugan@superfleet.com",
  "city": "Chennai",
  "state": "Tamil Nadu",
  "pincode": "600001",
  "gstin": "33AAAAA1234A1Z5",
  "panNumber": "ABCDE1234F",
  "contractPayoutPercent": 85,
  "totalVehiclesAttached": 6,
  "status": "Active",
  "bankDetails": {
    "accountHolderName": "Murugan S",
    "accountNumber": "98765432100",
    "ifscCode": "HDFC0001234",
    "bankName": "HDFC Bank",
    "branch": "T. Nagar, Chennai",
    "upiId": "murugan@upi"
  }
}
```

### Response (`201 Created` or `200 OK`):
```json
{
  "status": "success",
  "action": "created",
  "data": {
    "id": "TX-VND-001",
    "vendorId": "TX-VND-001",
    "companyName": "Murugan Super Fleet Travels",
    "phone": "+91 98401 11004",
    "source": "MAK_TAXI_APP",
    "contractPayoutPercent": 85,
    "status": "Active"
  },
  "message": "Vendor partner Murugan Super Fleet Travels (TX-VND-001) successfully synced and registered in MAK Journey ERP"
}
```

**ERP Actions Performed:**
1. Validates API key.
2. Upserts vendor in ERP `vendors` collection by `externalVendorId`, `vendorId`, or `phone`.
3. Labels vendor with `source: 'MAK_TAXI_APP'`.
4. Emits real-time notification to ERP Admin: *"New Partner Connected from MAK TAXI App"*.
5. Appears in ERP Admin Vendor Directory with a `📱 MAK TAXI App` badge.

---

## 4. Integration 2: Outstation Trip Assignment Webhook

When the MAK Journey ERP admin assigns an outstation booking to a vendor (either directly via the new **"Delegate to MAK TAXI Partner App"** tab or by assigning a vendor-attached vehicle), the ERP backend automatically dispatches an HTTP POST webhook to your MAK TAXI backend.

### Your MAK TAXI Webhook Endpoint:
Configured via `MAK_TAXI_WEBHOOK_URL` in ERP `.env`.  
*Example:* `https://api.maktaxi.com/api/webhooks/journey-erp`

### Webhook Request Headers Sent by ERP:
```http
Content-Type: application/json
X-API-Key: mak_taxi_sec_993847a82b01c3d4
X-MAK-ERP-Signature: sha256=<HMAC_HEX_DIGEST>
X-Timestamp: 2026-11-28T11:45:00.000Z
```

### Webhook Payload Sent by ERP:
```json
{
  "event": "trip.assigned",
  "timestamp": "2026-11-28T11:45:00.000Z",
  "erpSource": "MAK Journey ERP",
  "version": "1.0",
  "booking": {
    "bookingId": "BK-2026-005",
    "bookingNumber": "BK-2026-005",
    "bookingCategory": "Round Trip",
    "tripType": "Outstation",
    "customerName": "Anand Swaminathan",
    "customerPhone": "+91 98401 12345",
    "customerEmail": "anand@example.com",
    "pickupLocation": "Chennai Central Railway Station",
    "destination": "Pondicherry Beach Promenade",
    "journeyDate": "2026-11-29",
    "journeyTime": "06:00 AM",
    "returnDate": "2026-11-30",
    "passengerCount": 4,
    "vehicleRequested": "Toyota Innova Crysta",
    "totalAmount": 14000,
    "advancePaid": 3000,
    "balanceAmount": 11000,
    "paymentOption": "Pay on Departure",
    "paymentStatus": "Partially Paid",
    "vendorPayoutPercent": 85,
    "vendorPayableAmount": 11900,
    "driverBaseTripPay": 1500,
    "notes": "VIP corporate traveler, AC required",
    "status": "Assigned"
  },
  "vendor": {
    "vendorId": "TX-VND-001",
    "companyName": "Murugan Super Fleet Travels",
    "contactPerson": "Murugan S",
    "phone": "+91 98401 11004",
    "email": "murugan@superfleet.com",
    "externalVendorId": "TX-VND-001"
  }
}
```

### Required Actions for MAK TAXI Backend:
1. Verify the signature: Compute HMAC-SHA256 of the raw body using `MAK_TAXI_WEBHOOK_SECRET` and compare with `X-MAK-ERP-Signature`.
2. Save the booking in your database.
3. Trigger instant **Push Notification & In-App Loud Buzzer Alert** to the assigned vendor's phone (via FCM / APNs).
4. Return HTTP `200 OK` with JSON:
```json
{
  "status": "success",
  "message": "Trip assignment received and buzzer triggered"
}
```

---

## 5. Integration 3: Driver and Vehicle Allocation Sync

After the vendor opens their **MAK TAXI Vendor App** and selects an available vehicle and driver from their fleet, your backend sends the allocation details back to MAK Journey ERP.

### Endpoint:
```http
POST /api/integrations/mak-taxi/trips/:id/allocate
```
*(Also accessible at `POST /api/integrations/mak-taxi/trips/allocate` with `bookingId` in the body)*

### Request Headers:
```http
Content-Type: application/json
X-API-Key: mak_taxi_sec_993847a82b01c3d4
```

### Request Body:
```json
{
  "bookingId": "BK-2026-005",
  "vendorId": "TX-VND-001",
  "externalVendorId": "TX-VND-001",
  "allocatedVehicle": {
    "regNo": "TN-09-CB-9999",
    "brand": "Toyota",
    "model": "Innova Crysta Luxury",
    "category": "SUV",
    "seatingCapacity": 7,
    "fuelType": "Diesel",
    "color": "Silver"
  },
  "allocatedDriver": {
    "name": "V. Sundaram",
    "phone": "+91 97890 12345",
    "licenseNumber": "TN-09-2018-0098765",
    "rating": 4.95,
    "photo": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80"
  },
  "driverCompensationAmount": 1500,
  "vendorNotes": "Sanitized vehicle dispatched with senior chauffeur.",
  "allocatedAt": "2026-11-28T11:55:00.000Z"
}
```

### Response (`200 OK`):
```json
{
  "status": "success",
  "data": {
    "bookingNumber": "BK-2026-005",
    "tripStatus": "Awaiting Driver Acceptance",
    "driverAssignmentStatus": "Assigned",
    "vendorAppAssignmentStatus": "Allocated by Vendor",
    "assignedVehicle": {
      "regNo": "TN-09-CB-9999",
      "model": "Innova Crysta Luxury",
      "ownership": "Vendor Attached",
      "vendorName": "Murugan Super Fleet Travels"
    },
    "assignedDriver": {
      "name": "V. Sundaram",
      "phone": "+91 97890 12345",
      "status": "Assigned"
    }
  },
  "allocatedVehicle": {
    "regNo": "TN-09-CB-9999",
    "model": "Innova Crysta Luxury"
  },
  "allocatedDriver": {
    "name": "V. Sundaram",
    "phone": "+91 97890 12345"
  },
  "message": "Driver V. Sundaram and Vehicle TN-09-CB-9999 successfully allocated to Booking #BK-2026-005 in MAK Journey ERP"
}
```

**ERP Actions Performed:**
1. Validates API key.
2. Automatically registers / attaches the vehicle into the company fleet with `ownership: 'Vendor Attached'`.
3. Automatically registers / attaches the driver to the driver roster with `dutyStatus: 'Assigned'`.
4. Updates booking status to `tripStatus: 'Awaiting Driver Acceptance'`, `driverAssignmentStatus: 'Assigned'`, `vendorAppAssignmentStatus: 'Allocated by Vendor'`.
5. Appends audit timeline event:  
   `"Allocated via MAK TAXI Vendor App: Driver V. Sundaram (+91 97890 12345) & Vehicle Toyota Innova Crysta Luxury [TN-09-CB-9999] assigned by Vendor Partner Murugan Super Fleet Travels"`
6. Triggers real-time notification to the ERP Operations Admin.
7. Admin Portal immediately reflects the assigned vehicle, driver, and trip status.

---

## 6. Connectivity & Status Health Check

To test or verify the integration at any time:

### Endpoint:
```http
GET /api/integrations/mak-taxi/status
```

### Response:
```json
{
  "status": "success",
  "integration": "MAK TAXI Vendor App",
  "active": true,
  "config": {
    "webhookUrlConfigured": true,
    "apiKeyConfigured": true,
    "authMethodsSupported": ["X-API-Key", "X-MAK-TAXI-API-KEY", "Bearer Token", "HMAC-SHA256 Signature"]
  },
  "stats": {
    "syncedVendorsCount": 5,
    "dispatchedTripsCount": 12
  }
}
```

---

## 7. cURL Testing Quickstart

### Test 1: Sync a Vendor
```bash
curl -X POST "http://localhost:5000/api/integrations/mak-taxi/vendors/sync" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: mak_taxi_sec_993847a82b01c3d4" \
  -d '{
    "externalVendorId": "TX-VND-001",
    "companyName": "Murugan Travels",
    "phone": "+91 98401 11004",
    "city": "Chennai",
    "contractPayoutPercent": 85,
    "totalVehiclesAttached": 4
  }'
```

### Test 2: Allocate Driver & Vehicle
```bash
curl -X POST "http://localhost:5000/api/integrations/mak-taxi/trips/BK-2026-OUT-001/allocate" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: mak_taxi_sec_993847a82b01c3d4" \
  -d '{
    "vendorId": "TX-VND-001",
    "allocatedVehicle": {
      "regNo": "TN-01-AB-1234",
      "brand": "Toyota",
      "model": "Innova Crysta",
      "seatingCapacity": 7
    },
    "allocatedDriver": {
      "name": "K. Murugan",
      "phone": "+91 98765 43210",
      "licenseNumber": "TN-01-2015-00123"
    }
  }'
```
