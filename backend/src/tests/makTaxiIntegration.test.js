// MAK Tours & Travels ERP - MAK TAXI Vendor App Integration Tests
// Verifies:
// 1. Vendor Registration Sync (Inbound, validation & upsert)
// 2. Outstation Trip Assignment Webhook (Outbound, payload, HMAC signature)
// 3. Driver & Vehicle Allocation Sync (Inbound, vehicle & driver auto-registry, timeline)
// 4. API Key Security & Signature Validation

import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { Vendor } from '../models/Vendor.js';
import { Booking } from '../models/Booking.js';
import { Vehicle } from '../models/Vehicle.js';
import { Driver } from '../models/Driver.js';
import { Notification } from '../models/Notification.js';
import {
  syncVendorFromTaxiApp,
  dispatchOutstationTripToVendor,
  allocateDriverAndVehicleFromTaxiApp,
  verifyInboundApiKey,
  verifyHmacSignature,
  generateHmacSignature,
  INTEGRATION_CONFIG
} from '../services/makTaxiIntegrationService.js';
import { integrationController } from '../controllers/integrationController.js';

let mongod;

async function setup() {
  console.log('\n======================================================');
  console.log('   MAK TAXI VENDOR APP INTEGRATION TEST SUITE');
  console.log('======================================================\n');

  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  await mongoose.connect(uri);
  console.log('[Test Setup] In-memory MongoDB initialized.');
}

async function teardown() {
  await mongoose.disconnect();
  await mongod.stop();
  console.log('\n[Test Teardown] In-memory MongoDB stopped.\n');
}

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  } else {
    console.log(`✓ PASSED: ${message}`);
  }
}

async function runTests() {
  await setup();
  const tenantId = 'mak-tours';

  try {
    // ----------------------------------------------------
    // TEST 1: Security - API Key & HMAC Signature
    // ----------------------------------------------------
    console.log('\n--- 1. Security & Authentication Tests ---');
    const validReq = {
      headers: { 'x-api-key': INTEGRATION_CONFIG.apiKey }
    };
    assert(verifyInboundApiKey(validReq) === true, 'Valid API key in x-api-key header accepted');

    const bearerReq = {
      headers: { authorization: `Bearer ${INTEGRATION_CONFIG.apiKey}` }
    };
    assert(verifyInboundApiKey(bearerReq) === true, 'Valid Bearer token accepted');

    const invalidReq = {
      headers: { 'x-api-key': 'wrong_secret_key' }
    };
    assert(verifyInboundApiKey(invalidReq) === false, 'Invalid API key rejected');

    const testPayload = { trip: 'assigned', test: 123 };
    const validSig = generateHmacSignature(testPayload);
    assert(verifyHmacSignature(testPayload, validSig) === true, 'Valid HMAC signature verified');
    assert(verifyHmacSignature(testPayload, 'sha256=invalidhex123') === false, 'Invalid HMAC signature rejected');

    // ----------------------------------------------------
    // TEST 2: Inbound Vendor Registration Sync
    // ----------------------------------------------------
    console.log('\n--- 2. Vendor Registration Sync Tests ---');

    const vendorPayload = {
      externalVendorId: 'TX-VND-889',
      companyName: 'Murugan Super Fleet Travels',
      ownerName: 'Murugan S',
      phone: '+91 98401 11004',
      email: 'murugan@superfleet.com',
      city: 'Chennai',
      state: 'Tamil Nadu',
      pincode: '600001',
      gstin: '33AAAAA1234A1Z5',
      panNumber: 'ABCDE1234F',
      contractPayoutPercent: 85,
      totalVehiclesAttached: 5,
      status: 'Active'
    };

    const syncResult = await syncVendorFromTaxiApp(vendorPayload, tenantId);
    assert(syncResult.action === 'created', 'Vendor successfully created via sync');
    assert(syncResult.vendor.companyName === 'Murugan Super Fleet Travels', 'Vendor company name matches');
    assert(syncResult.vendor.source === 'MAK_TAXI_APP', 'Vendor source tagged as MAK_TAXI_APP');
    assert(syncResult.vendor.contractPayoutPercent === 85, 'Vendor payout percentage set to 85%');

    // Verify vendor persisted in MongoDB
    const persistedVendor = await Vendor.findOne({ externalVendorId: 'TX-VND-889' });
    assert(Boolean(persistedVendor), 'Vendor persisted in MongoDB vendors collection');

    // Verify admin notification created
    const notif = await Notification.findOne({ category: 'Vendor', portal: 'admin' });
    assert(Boolean(notif), 'Admin notification created in ERP for new vendor');
    assert(notif.title.includes('MAK TAXI App'), 'Admin notification references MAK TAXI App');

    // Test updating the existing vendor via sync
    const updatePayload = {
      ...vendorPayload,
      companyName: 'Murugan Super Fleet Travels Pvt Ltd',
      totalVehiclesAttached: 8,
      contractPayoutPercent: 88
    };
    const updateResult = await syncVendorFromTaxiApp(updatePayload, tenantId);
    assert(updateResult.action === 'updated', 'Existing vendor correctly updated on repeated sync');
    assert(updateResult.vendor.totalVehiclesAttached === 8, 'Attached vehicle count updated to 8');
    assert(updateResult.vendor.contractPayoutPercent === 88, 'Contract payout updated to 88%');

    // ----------------------------------------------------
    // TEST 3: Outstation Trip Assignment Webhook Dispatch
    // ----------------------------------------------------
    console.log('\n--- 3. Outstation Trip Assignment Dispatch Tests ---');

    // Create an outstation booking in ERP
    const booking = await Booking.create({
      tenantId,
      bookingNumber: 'BK-2026-OUT-001',
      refId: 'BK-2026-OUT-001',
      id: 'BK-2026-OUT-001',
      bookingType: 'Round Trip',
      bookingCategory: 'Round Trip',
      customerName: 'Karthik Raman',
      customerPhone: '+91 98401 55555',
      pickupLocation: 'Chennai Central',
      destination: 'Pondicherry Promenade',
      travelDate: '2026-11-29',
      journeyDate: '2026-11-29',
      journeyTime: '06:00 AM',
      returnDate: '2026-11-30',
      passengerCount: 4,
      totalAmount: 14000,
      pricing: 14000,
      advancePaid: 3000,
      balanceAmount: 11000,
      vehicleReserved: 'Toyota Innova Crysta',
      status: 'Confirmed'
    });

    const dispatchRes = await dispatchOutstationTripToVendor(booking, updateResult.vendor, {
      vendorPayoutPercent: 85
    });

    assert(dispatchRes.success === true, 'Trip assignment dispatched successfully');
    assert(dispatchRes.payload.event === 'trip.assigned', 'Webhook payload contains event trip.assigned');
    assert(dispatchRes.payload.booking.bookingNumber === 'BK-2026-OUT-001', 'Webhook payload contains accurate booking number');
    assert(dispatchRes.payload.booking.vendorPayoutPercent === 85, 'Webhook payload contains vendor payout percent');
    assert(dispatchRes.payload.booking.vendorPayableAmount === 11900, 'Calculated vendor payable (85% of 14,000 = 11,900)');
    assert(dispatchRes.payload.vendor.externalVendorId === 'TX-VND-889', 'Vendor external ID included in payload');

    // Verify booking updated in database
    const updatedBooking = await Booking.findOne({ bookingNumber: 'BK-2026-OUT-001' });
    assert(updatedBooking.assignedVendorName === 'Murugan Super Fleet Travels Pvt Ltd', 'Booking assignedVendorName saved');
    assert(updatedBooking.vendorAppAssignmentStatus === 'Awaiting Driver Allocation', 'Vendor app status set to Awaiting Driver Allocation');

    // ----------------------------------------------------
    // TEST 4: Driver and Vehicle Allocation Sync
    // ----------------------------------------------------
    console.log('\n--- 4. Driver & Vehicle Allocation Sync Tests ---');

    const allocationPayload = {
      bookingId: 'BK-2026-OUT-001',
      vendorId: updateResult.vendor.vendorId,
      externalVendorId: 'TX-VND-889',
      allocatedVehicle: {
        regNo: 'TN-09-CB-9999',
        brand: 'Toyota',
        model: 'Innova Crysta Luxury',
        category: 'SUV',
        seatingCapacity: 7,
        fuelType: 'Diesel',
        color: 'Silver'
      },
      allocatedDriver: {
        name: 'V. Sundaram',
        phone: '+91 97890 12345',
        licenseNumber: 'TN-09-2018-0098765',
        rating: 4.95
      },
      driverCompensationAmount: 1500,
      vendorNotes: 'Clean, sanitized vehicle dispatched with senior chauffeur.'
    };

    const allocResult = await allocateDriverAndVehicleFromTaxiApp('BK-2026-OUT-001', allocationPayload, tenantId);

    assert(allocResult.status === 'success', 'Driver and vehicle allocation succeeded');
    assert(allocResult.allocatedVehicle.regNo === 'TN-09-CB-9999', 'Allocated vehicle reg plate matches');
    assert(allocResult.allocatedDriver.name === 'V. Sundaram', 'Allocated driver name matches');
    assert(allocResult.booking.tripStatus === 'Awaiting Driver Acceptance', 'Booking tripStatus updated to Awaiting Driver Acceptance');
    assert(allocResult.booking.vendorAppAssignmentStatus === 'Allocated by Vendor', 'Booking vendorAppAssignmentStatus set to Allocated by Vendor');

    // Verify vehicle was registered/attached in Vehicle collection
    const vehicleDoc = await Vehicle.findOne({
      $or: [{ regNo: 'TN 09 CB 9999' }, { regNo: 'TN-09-CB-9999' }, { regNo: /TN.*09.*CB.*9999/i }]
    });
    assert(Boolean(vehicleDoc), 'Allocated vehicle automatically registered in fleet');
    assert(vehicleDoc.ownership === 'Vendor Attached', 'Allocated vehicle ownership is Vendor Attached');

    // Verify driver was registered in Driver collection
    const driverDoc = await Driver.findOne({ phone: '+91 97890 12345' });
    assert(Boolean(driverDoc), 'Allocated driver automatically registered on roster');
    assert(driverDoc.fullName === 'V. Sundaram', 'Driver name saved correctly');

    // Verify timeline entry added on booking
    const finalBooking = await Booking.findOne({ bookingNumber: 'BK-2026-OUT-001' });
    assert(finalBooking.assignmentTimeline.length > 0, 'Assignment timeline recorded');
    const latestTimeline = finalBooking.assignmentTimeline[finalBooking.assignmentTimeline.length - 1];
    assert(latestTimeline.event.includes('Allocated via MAK TAXI Vendor App'), 'Timeline records allocation via MAK TAXI Vendor App');

    // ----------------------------------------------------
    // TEST 5: HTTP Controller Integration Endpoints
    // ----------------------------------------------------
    console.log('\n--- 5. HTTP Controller Inbound Tests ---');

    // Unauthorized without key
    const mockRes401 = {
      statusCode: 200,
      status(code) { this.statusCode = code; return this; },
      json(data) { this.body = data; return this; }
    };
    await integrationController.syncVendor({ headers: {}, body: {} }, mockRes401, (err) => { throw err; });
    assert(mockRes401.statusCode === 401, 'POST /api/integrations/mak-taxi/vendors/sync without key returns 401 Unauthorized');

    // Status endpoint
    const mockResStatus = {
      statusCode: 200,
      status(code) { this.statusCode = code; return this; },
      json(data) { this.body = data; return this; }
    };
    await integrationController.getStatus({ tenantId }, mockResStatus, (err) => { throw err; });
    assert(mockResStatus.statusCode === 200, 'GET /api/integrations/mak-taxi/status returns 200 OK');
    assert(mockResStatus.body.integration === 'MAK TAXI Vendor App', 'Status reports MAK TAXI Vendor App');

    console.log('\n======================================================');
    console.log('   ALL 18 INTEGRATION TESTS PASSED PERFECTLY!');
    console.log('======================================================\n');
  } finally {
    await teardown();
  }
}

runTests().catch((err) => {
  console.error('Test suite failed:', err);
  process.exit(1);
});
