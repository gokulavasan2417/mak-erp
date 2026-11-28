// MAK Tours & Travels ERP - MAK TAXI Vendor App Integration Service
// Secure API & Webhook orchestration for:
// 1. Inbound Vendor Registration Sync from MAK TAXI Vendor App
// 2. Outbound Outstation Trip Assignment Webhook to MAK TAXI Backend (buzzer & push alert)
// 3. Inbound Driver and Vehicle Allocation Sync from MAK TAXI Vendor App

import crypto from 'crypto';
import { Vendor } from '../models/Vendor.js';
import { Booking } from '../models/Booking.js';
import { Vehicle } from '../models/Vehicle.js';
import { Driver } from '../models/Driver.js';
import { Notification } from '../models/Notification.js';
import { buildTenantQuery } from '../middleware/tenantMiddleware.js';

// Default configuration with fallback for seamless out-of-the-box operation
export const INTEGRATION_CONFIG = {
  get apiKey() {
    return process.env.MAK_TAXI_API_KEY || 'mak_taxi_sec_993847a82b01c3d4';
  },
  get webhookUrl() {
    return process.env.MAK_TAXI_WEBHOOK_URL || '';
  },
  get webhookSecret() {
    return process.env.MAK_TAXI_WEBHOOK_SECRET || process.env.MAK_TAXI_API_KEY || 'mak_taxi_sec_993847a82b01c3d4';
  },
  timeoutMs: 8000
};

/**
 * Validate inbound request API key or Bearer token
 * @param {import('express').Request} req
 * @returns {boolean}
 */
export function verifyInboundApiKey(req) {
  const incomingKey =
    req.headers['x-api-key'] ||
    req.headers['x-mak-taxi-api-key'] ||
    (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')
      ? req.headers.authorization.substring(7)
      : null);

  if (!incomingKey) return false;
  return incomingKey.trim() === INTEGRATION_CONFIG.apiKey.trim();
}

/**
 * Verify HMAC-SHA256 signature if provided in incoming headers
 * @param {string|Buffer} rawBody
 * @param {string} signatureHeader
 * @param {string} [secret]
 * @returns {boolean}
 */
export function verifyHmacSignature(rawBody, signatureHeader, secret = INTEGRATION_CONFIG.webhookSecret) {
  if (!signatureHeader || !rawBody) return false;
  try {
    const cleanSig = signatureHeader.replace(/^sha256=/i, '').trim();
    const expectedSig = crypto
      .createHmac('sha256', secret)
      .update(typeof rawBody === 'string' ? rawBody : JSON.stringify(rawBody))
      .digest('hex');
    return crypto.timingSafeEqual(Buffer.from(cleanSig, 'hex'), Buffer.from(expectedSig, 'hex'));
  } catch {
    return false;
  }
}

/**
 * Generate HMAC-SHA256 signature for outgoing payloads
 * @param {object|string} payload
 * @param {string} [secret]
 * @returns {string}
 */
export function generateHmacSignature(payload, secret = INTEGRATION_CONFIG.webhookSecret) {
  const content = typeof payload === 'string' ? payload : JSON.stringify(payload);
  return 'sha256=' + crypto.createHmac('sha256', secret).update(content).digest('hex');
}

/**
 * 1. VENDOR REGISTRATION SYNC
 * Synchronizes an approved vendor from the MAK TAXI Vendor App into MAK Journey ERP
 * @param {object} vendorData
 * @param {string} [tenantId]
 * @returns {Promise<object>}
 */
export async function syncVendorFromTaxiApp(vendorData, tenantId = 'mak-tours') {
  if (!vendorData || typeof vendorData !== 'object') {
    throw new Error('Invalid vendor data received');
  }

  const companyName = (vendorData.companyName || vendorData.businessName || vendorData.name || '').trim();
  const phone = (vendorData.phone || vendorData.mobileNumber || '').trim();

  if (!companyName) {
    throw new Error('Missing required field: companyName or businessName is required');
  }
  if (!phone) {
    throw new Error('Missing required field: phone number is required');
  }

  const externalVendorId = (vendorData.externalVendorId || vendorData.vendorId || vendorData.id || '').trim();

  // Search by external ID, vendor ID, or phone
  const searchCriteria = [
    { phone },
    ...(externalVendorId ? [{ externalVendorId }, { vendorId: externalVendorId }, { id: externalVendorId }] : []),
    ...(vendorData.email ? [{ email: vendorData.email.toLowerCase().trim() }] : [])
  ];

  const existingVendor = await Vendor.findOne({
    ...buildTenantQuery(tenantId),
    $or: searchCriteria
  });

  const now = new Date();

  if (existingVendor) {
    // Update existing vendor with latest details from app
    existingVendor.companyName = companyName;
    existingVendor.name = companyName;
    if (vendorData.ownerName || vendorData.contactPerson) {
      existingVendor.ownerName = vendorData.ownerName || vendorData.contactPerson;
      existingVendor.contactPerson = vendorData.contactPerson || vendorData.ownerName;
    }
    if (vendorData.email) existingVendor.email = vendorData.email.toLowerCase().trim();
    if (vendorData.city) existingVendor.city = vendorData.city;
    if (vendorData.state) existingVendor.state = vendorData.state;
    if (vendorData.pincode) existingVendor.pincode = vendorData.pincode;
    if (vendorData.gstin) existingVendor.gstin = vendorData.gstin.toUpperCase();
    if (vendorData.panNumber) existingVendor.panNumber = vendorData.panNumber.toUpperCase();
    if (vendorData.contractPayoutPercent !== undefined) {
      existingVendor.contractPayoutPercent = Number(vendorData.contractPayoutPercent);
    }
    if (vendorData.totalVehiclesAttached !== undefined) {
      existingVendor.totalVehiclesAttached = Number(vendorData.totalVehiclesAttached);
      existingVendor.fleetCount = Number(vendorData.totalVehiclesAttached);
    }
    if (vendorData.bankDetails) {
      existingVendor.bankDetails = {
        ...existingVendor.bankDetails,
        ...vendorData.bankDetails
      };
    }
    if (externalVendorId && !existingVendor.externalVendorId) {
      existingVendor.externalVendorId = externalVendorId;
    }
    existingVendor.status = vendorData.status || existingVendor.status || 'Active';
    existingVendor.appRegistrationStatus = vendorData.appRegistrationStatus || 'Approved';
    existingVendor.source = 'MAK_TAXI_APP';
    existingVendor.lastSyncedAt = now;

    await existingVendor.save();

    return {
      status: 'success',
      action: 'updated',
      vendor: existingVendor,
      message: `Vendor partner ${companyName} (${existingVendor.vendorId || existingVendor.id}) updated from MAK TAXI App`
    };
  }

  // Generate new sequential vendor ID
  const count = await Vendor.countDocuments({ tenantId });
  const seq = (count + 1).toString().padStart(3, '0');
  const generatedVendorId = `VND-${seq}`;
  const finalVendorId = externalVendorId ? `TX-${externalVendorId.replace(/^TX-?/i, '')}` : generatedVendorId;

  const newVendor = await Vendor.create({
    tenantId,
    vendorId: finalVendorId,
    id: finalVendorId,
    externalVendorId: externalVendorId || finalVendorId,
    companyName,
    name: companyName,
    ownerName: vendorData.ownerName || vendorData.contactPerson || companyName,
    contactPerson: vendorData.contactPerson || vendorData.ownerName || companyName,
    phone,
    email: vendorData.email ? vendorData.email.toLowerCase().trim() : '',
    city: vendorData.city || 'Chennai',
    state: vendorData.state || 'Tamil Nadu',
    pincode: vendorData.pincode || '',
    gstin: (vendorData.gstin || '').toUpperCase(),
    panNumber: (vendorData.panNumber || '').toUpperCase(),
    contractPayoutPercent: Number(vendorData.contractPayoutPercent || 85),
    commissionRate: Number(vendorData.commissionRate || (100 - Number(vendorData.contractPayoutPercent || 85))),
    totalVehiclesAttached: Number(vendorData.totalVehiclesAttached || vendorData.fleetCount || 0),
    fleetCount: Number(vendorData.totalVehiclesAttached || vendorData.fleetCount || 0),
    driversCount: Number(vendorData.driversCount || 0),
    rating: Number(vendorData.rating || 5.0),
    bankDetails: vendorData.bankDetails || {},
    documents: vendorData.documents || {},
    avatar: vendorData.avatar || '',
    status: vendorData.status || 'Active',
    source: 'MAK_TAXI_APP',
    appRegistrationStatus: 'Approved',
    syncedFromAppAt: now,
    lastSyncedAt: now
  });

  // Create real-time notification for admin in MAK Journey ERP
  try {
    await Notification.create({
      tenantId,
      id: `NOTIF-${Date.now()}`,
      portal: 'admin',
      title: 'New Partner Connected from MAK TAXI App',
      message: `Partner "${companyName}" (${phone}) has registered and synced automatically from the MAK TAXI Vendor App.`,
      description: `Vendor Code: ${finalVendorId} • Vehicles: ${newVendor.totalVehiclesAttached} • Default Payout: ${newVendor.contractPayoutPercent}%`,
      category: 'Vendor',
      priority: 'Normal',
      actionUrl: `/admin/vendors/${newVendor.id || newVendor.vendorId}`,
      actionLink: `/admin/vendors/${newVendor.id || newVendor.vendorId}`,
      isRead: false,
      unread: true,
      time: 'Just now',
      timestamp: now.toISOString()
    });
  } catch (notifErr) {
    console.warn('[MAK TAXI Integration] Failed to log admin notification:', notifErr.message);
  }

  return {
    status: 'success',
    action: 'created',
    vendor: newVendor,
    message: `Vendor partner ${companyName} (${finalVendorId}) successfully synced and registered in MAK Journey ERP`
  };
}

/**
 * 2. OUTSTATION TRIP ASSIGNMENT WEBHOOK
 * Sends booking & vendor assignment details to the MAK TAXI backend API/webhook
 * @param {object} booking
 * @param {object} vendor
 * @param {object} [options]
 * @returns {Promise<object>}
 */
export async function dispatchOutstationTripToVendor(booking, vendor, options = {}) {
  if (!booking) throw new Error('Booking is required for outstation trip assignment');
  if (!vendor) throw new Error('Vendor is required for outstation trip assignment');

  const webhookUrl = (options.webhookUrl || INTEGRATION_CONFIG.webhookUrl || '').trim();
  const timestamp = new Date().toISOString();

  const bookingId = booking.bookingNumber || booking.refId || booking.id || booking._id?.toString();
  const totalAmt = Number(booking.totalAmount || booking.pricing || booking.totalFare || 0);
  const payoutPercent = Number(options.vendorPayoutPercent ?? booking.vendorPayoutPercent ?? vendor.contractPayoutPercent ?? 85);
  const payableAmount = Number(
    options.vendorPayableAmount !== undefined
      ? options.vendorPayableAmount
      : (booking.vendorPayableAmount > 0 ? booking.vendorPayableAmount : Math.round(totalAmt * (payoutPercent / 100)))
  );

  // Strict check: One Way trips are forbidden
  const bType = String(booking.bookingCategory || booking.bookingType || 'Round Trip');
  if (bType.toLowerCase().includes('one way')) {
    throw new Error('ONE WAY TRIP IS STRICTLY PROHIBITED IN MAK JOURNEY ERP');
  }

  const payload = {
    event: 'trip.assigned',
    timestamp,
    erpSource: 'MAK Journey ERP',
    version: '1.0',
    booking: {
      bookingId,
      bookingNumber: bookingId,
      bookingCategory: bType,
      tripType: 'Outstation',
      customerName: booking.customerName || booking.fullName || booking.name || 'Valued Passenger',
      customerPhone: booking.customerPhone || booking.mobileNumber || booking.phone || '',
      customerEmail: booking.customerEmail || booking.email || '',
      pickupLocation: booking.pickupLocation || booking.fromLocation || '',
      destination: booking.destination || booking.toLocation || booking.dropLocation || '',
      journeyDate: booking.journeyDate || booking.travelDate || booking.pickupDate || '',
      journeyTime: booking.journeyTime || booking.pickupTime || '06:00 AM',
      returnDate: booking.returnDate || '',
      passengerCount: Number(booking.passengerCount || booking.passengers || 4),
      vehicleRequested: booking.vehicleReserved || booking.vehicleName || 'Standard Fleet Cab',
      totalAmount: totalAmt,
      advancePaid: Number(booking.advancePaid || booking.advancePayment || 0),
      balanceAmount: Number(booking.balanceAmount || (totalAmt - Number(booking.advancePaid || 0))),
      paymentOption: booking.paymentOption || 'Pay on Departure',
      paymentStatus: booking.paymentStatus || 'unpaid',
      vendorPayoutPercent: payoutPercent,
      vendorPayableAmount: payableAmount,
      driverBaseTripPay: Number(booking.driverBaseTripPay || 1500),
      notes: booking.notes || '',
      status: 'Assigned'
    },
    vendor: {
      vendorId: vendor.vendorId || vendor.id,
      companyName: vendor.companyName || vendor.name,
      contactPerson: vendor.contactPerson || vendor.ownerName || '',
      phone: vendor.phone,
      email: vendor.email || '',
      externalVendorId: vendor.externalVendorId || vendor.vendorId || vendor.id
    }
  };

  const signature = generateHmacSignature(payload);

  // If webhookUrl is not yet set in environment, save payload and return informative pending response
  if (!webhookUrl) {
    console.log(`[MAK TAXI Integration] Notice: MAK_TAXI_WEBHOOK_URL is not set. Payload prepared for Booking #${bookingId}:`, payload);

    await Booking.updateOne(
      { _id: booking._id || booking.id },
      {
        $set: {
          makTaxiDispatchStatus: 'pending',
          makTaxiWebhookPayload: payload,
          assignedVendorId: vendor.vendorId || vendor.id,
          assignedVendorName: vendor.companyName || vendor.name,
          assignedVendor: {
            id: vendor.vendorId || vendor.id,
            name: vendor.companyName || vendor.name,
            phone: vendor.phone,
            externalVendorId: vendor.externalVendorId || vendor.vendorId || vendor.id
          },
          vendorAppAssignmentStatus: 'Awaiting Driver Allocation'
        }
      }
    );

    return {
      success: true,
      dispatched: false,
      status: 'pending',
      message: `Trip assigned to vendor ${vendor.companyName}. Webhook URL not configured in .env; payload queued successfully.`,
      payload
    };
  }

  // Attempt real HTTP Webhook call with timeout
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), INTEGRATION_CONFIG.timeoutMs);

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': INTEGRATION_CONFIG.apiKey,
        'X-MAK-ERP-Signature': signature,
        'X-Timestamp': timestamp
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    clearTimeout(timeout);

    const responseText = await response.text();
    let responseJson = null;
    try {
      responseJson = JSON.parse(responseText);
    } catch {
      responseJson = { raw: responseText };
    }

    const isDelivered = response.ok;

    await Booking.updateOne(
      { _id: booking._id || booking.id },
      {
        $set: {
          makTaxiDispatchStatus: isDelivered ? 'delivered' : 'failed',
          makTaxiDispatchedAt: new Date(),
          makTaxiWebhookPayload: payload,
          makTaxiWebhookResponse: responseJson,
          assignedVendorId: vendor.vendorId || vendor.id,
          assignedVendorName: vendor.companyName || vendor.name,
          assignedVendor: {
            id: vendor.vendorId || vendor.id,
            name: vendor.companyName || vendor.name,
            phone: vendor.phone,
            externalVendorId: vendor.externalVendorId || vendor.vendorId || vendor.id
          },
          vendorAppAssignmentStatus: 'Dispatched to App'
        }
      }
    );

    return {
      success: isDelivered,
      dispatched: true,
      httpStatus: response.status,
      status: isDelivered ? 'delivered' : 'failed',
      message: isDelivered
        ? `Outstation trip successfully dispatched to MAK TAXI backend for vendor ${vendor.companyName}`
        : `Webhook responded with HTTP ${response.status}`,
      responseData: responseJson,
      payload
    };
  } catch (fetchErr) {
    console.error('[MAK TAXI Integration] Webhook dispatch error:', fetchErr.message);

    await Booking.updateOne(
      { _id: booking._id || booking.id },
      {
        $set: {
          makTaxiDispatchStatus: 'failed',
          makTaxiWebhookPayload: payload,
          makTaxiWebhookResponse: { error: fetchErr.message }
        }
      }
    );

    return {
      success: false,
      dispatched: false,
      status: 'failed',
      error: fetchErr.message,
      message: `Failed to connect to MAK TAXI webhook at ${webhookUrl}: ${fetchErr.message}. The assignment is recorded in ERP.`,
      payload
    };
  }
}

/**
 * 3. DRIVER AND VEHICLE ALLOCATION SYNC
 * Updates booking with vehicle & driver chosen by the vendor inside the MAK TAXI App
 * @param {string} bookingIdentifier
 * @param {object} allocationData
 * @param {string} [tenantId]
 * @returns {Promise<object>}
 */
export async function allocateDriverAndVehicleFromTaxiApp(bookingIdentifier, allocationData, tenantId = 'mak-tours') {
  if (!bookingIdentifier) throw new Error('Booking identifier is required');
  if (!allocationData || typeof allocationData !== 'object') {
    throw new Error('Allocation data is required');
  }

  const { allocatedVehicle, allocatedDriver, vendorId, externalVendorId, driverCompensationAmount, vendorNotes } = allocationData;

  if (!allocatedVehicle || !allocatedVehicle.regNo) {
    throw new Error('Missing required vehicle details: allocatedVehicle.regNo is required');
  }
  if (!allocatedDriver || !allocatedDriver.name) {
    throw new Error('Missing required driver details: allocatedDriver.name is required');
  }

  const orClauses = [
    { id: bookingIdentifier },
    { refId: bookingIdentifier },
    { bookingNumber: bookingIdentifier },
    { bookingId: bookingIdentifier }
  ];
  if (typeof bookingIdentifier === 'string' && bookingIdentifier.match(/^[0-9a-fA-F]{24}$/)) {
    orClauses.push({ _id: bookingIdentifier });
  }

  const booking = await Booking.findOne({
    ...buildTenantQuery(tenantId),
    $or: orClauses
  });

  if (!booking) {
    throw new Error(`Booking #${bookingIdentifier} not found in MAK Journey ERP`);
  }

  const bookingTenantId = booking.tenantId || tenantId;

  // Resolve vendor if specified
  let vendorObj = null;
  const vLookup = vendorId || externalVendorId || booking.assignedVendorId;
  if (vLookup) {
    vendorObj = await Vendor.findOne({
      ...buildTenantQuery(bookingTenantId),
      $or: [{ vendorId: vLookup }, { externalVendorId: vLookup }, { id: vLookup }, { _id: String(vLookup).match(/^[0-9a-fA-F]{24}$/) ? vLookup : null }]
    }).lean();
  }

  const vendorName = vendorObj?.companyName || vendorObj?.name || booking.assignedVendorName || 'MAK TAXI Partner Vendor';
  const resolvedVendorId = vendorObj?.vendorId || vendorObj?.id || vLookup || 'VND-ATTACHED';

  // 1. Ensure or auto-register Vehicle in Vehicle collection
  const cleanRegNo = allocatedVehicle.regNo.trim().toUpperCase();
  const cleanAlphanumeric = cleanRegNo.replace(/[^A-Z0-9]/g, '');
  const regPattern = new RegExp(cleanAlphanumeric.split('').join('\\s*[-_\\s]?\\s*'), 'i');

  let vehicleDoc = await Vehicle.findOne({
    ...buildTenantQuery(bookingTenantId),
    $or: [
      { regNo: regPattern },
      { numberPlate: regPattern },
      { registrationNumber: regPattern },
      { regNo: cleanRegNo },
      { numberPlate: cleanRegNo }
    ]
  });

  if (!vehicleDoc) {
    vehicleDoc = await Vehicle.create({
      tenantId: bookingTenantId,
      name: `${allocatedVehicle.brand || ''} ${allocatedVehicle.model || 'Cab'}`.trim() || cleanRegNo,
      brand: allocatedVehicle.brand || 'Commercial Fleet',
      model: allocatedVehicle.model || 'Commercial Vehicle',
      category: allocatedVehicle.category || 'Sedan',
      regNo: cleanRegNo,
      numberPlate: cleanRegNo,
      color: allocatedVehicle.color || 'White',
      seatingCapacity: Number(allocatedVehicle.seatingCapacity || 4),
      passengers: `${allocatedVehicle.seatingCapacity || 4} Passengers`,
      fuelType: allocatedVehicle.fuelType || 'Diesel',
      ratePerKm: Number(allocatedVehicle.ratePerKm || 15),
      pricePerKm: Number(allocatedVehicle.ratePerKm || 15),
      driverAllowance: Number(allocatedVehicle.driverAllowance || 500),
      driverBata: Number(allocatedVehicle.driverAllowance || 500),
      image: allocatedVehicle.image || '',
      status: 'Reserved',
      ownership: 'Vendor Attached',
      ownershipType: 'Vendor Attached',
      vendorId: resolvedVendorId,
      vendorName,
      vendorContact: vendorObj?.phone || allocatedDriver.phone || ''
    });
  } else {
    vehicleDoc.status = 'Reserved';
    vehicleDoc.vendorId = resolvedVendorId;
    vehicleDoc.vendorName = vendorName;
    await vehicleDoc.save();
  }

  // 2. Ensure or auto-register Driver in Driver collection
  const driverPhone = (allocatedDriver.phone || '').trim();
  let driverDoc = null;
  if (driverPhone) {
    driverDoc = await Driver.findOne({
      tenantId: bookingTenantId,
      phone: driverPhone
    });
  }

  if (!driverDoc) {
    const driverCount = await Driver.countDocuments({ tenantId: bookingTenantId });
    const badgeId = `DRV-TX-${(driverCount + 1).toString().padStart(3, '0')}`;
    driverDoc = await Driver.create({
      tenantId: bookingTenantId,
      driverBadgeId: badgeId,
      id: badgeId,
      fullName: allocatedDriver.name.trim(),
      name: allocatedDriver.name.trim(),
      phone: driverPhone || '+91 90000 00000',
      licenseNumber: allocatedDriver.licenseNumber || '',
      rating: Number(allocatedDriver.rating || 4.9),
      dutyStatus: 'Assigned',
      avatar: allocatedDriver.photo || allocatedDriver.avatar || '',
      assignedVehicleId: cleanRegNo,
      assignedVehicleReg: cleanRegNo,
      assignedVehicleName: `${allocatedVehicle.brand || ''} ${allocatedVehicle.model || ''} (${cleanRegNo})`.trim()
    });
  } else {
    driverDoc.dutyStatus = 'Assigned';
    driverDoc.assignedVehicleReg = cleanRegNo;
    await driverDoc.save();
  }

  // 3. Build enriched vehicle and driver objects for booking
  const enrichedVehicleObj = {
    id: vehicleDoc.id || vehicleDoc._id.toString(),
    brand: vehicleDoc.brand,
    model: vehicleDoc.model || vehicleDoc.name,
    name: vehicleDoc.model || vehicleDoc.name,
    regNo: cleanRegNo,
    category: vehicleDoc.category,
    seating: `${vehicleDoc.seatingCapacity || 4} Passengers`,
    fuelType: vehicleDoc.fuelType,
    status: 'Reserved',
    ratePerKm: vehicleDoc.ratePerKm || 15,
    driverAllowance: vehicleDoc.driverAllowance || 500,
    image: vehicleDoc.image,
    ownership: 'Vendor Attached',
    isVendorVehicle: true,
    vendorId: resolvedVendorId,
    vendorName,
    vendorPayoutPercent: booking.vendorPayoutPercent || vendorObj?.contractPayoutPercent || 85,
    vendorPayableAmount: booking.vendorPayableAmount || 0
  };

  const enrichedDriverObj = {
    id: driverDoc.id || driverDoc.driverBadgeId || driverDoc._id.toString(),
    name: driverDoc.fullName || driverDoc.name,
    fullName: driverDoc.fullName || driverDoc.name,
    phone: driverDoc.phone,
    licenseNumber: driverDoc.licenseNumber,
    rating: driverDoc.rating,
    photo: driverDoc.avatar || driverDoc.photo || '',
    status: 'Assigned'
  };

  const vDisplay = `${enrichedVehicleObj.brand} ${enrichedVehicleObj.model} [${cleanRegNo}]`;
  const dDisplay = `${enrichedDriverObj.name} (${enrichedDriverObj.phone})`;
  const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const timelineEntry = {
    id: `TL-ALLOC-${Date.now()}`,
    timestamp: nowTime,
    event: `Allocated via MAK TAXI Vendor App: Driver ${dDisplay} & Vehicle ${vDisplay} assigned by Vendor Partner ${vendorName}${vendorNotes ? ` (Notes: ${vendorNotes})` : ''}`,
    actor: `Vendor: ${vendorName}`,
    status: 'Assigned'
  };

  const driverPay = Number(driverCompensationAmount || booking.driverCompensationAmount || 1500);

  // 4. Update the Booking
  booking.vehicleId = cleanRegNo;
  booking.vehicleName = vDisplay;
  booking.assignedVehicle = enrichedVehicleObj;
  booking.driverId = enrichedDriverObj.id;
  booking.driverName = enrichedDriverObj.name;
  booking.driverPhone = enrichedDriverObj.phone;
  booking.assignedDriverId = enrichedDriverObj.id;
  booking.assignedDriverName = enrichedDriverObj.name;
  booking.assignedDriverPhone = enrichedDriverObj.phone;
  booking.assignedDriver = enrichedDriverObj;
  booking.driverCompensationAmount = driverPay;
  booking.driverAssignmentStatus = 'Assigned';
  booking.tripStatus = 'Awaiting Driver Acceptance';
  booking.vendorAppAssignmentStatus = 'Allocated by Vendor';
  booking.makTaxiAllocatedAt = new Date();
  booking.assignedVendorId = resolvedVendorId;
  booking.assignedVendorName = vendorName;
  if (!booking.assignedVendor) {
    booking.assignedVendor = {
      id: resolvedVendorId,
      name: vendorName,
      phone: vendorObj?.phone || '',
      externalVendorId: vendorObj?.externalVendorId || resolvedVendorId
    };
  }

  if (!Array.isArray(booking.assignmentTimeline)) {
    booking.assignmentTimeline = [];
  }
  booking.assignmentTimeline.push(timelineEntry);

  await booking.save();

  // 5. Notify Operations Admin
  try {
    await Notification.create({
      tenantId: bookingTenantId,
      id: `NOTIF-${Date.now()}`,
      portal: 'admin',
      title: `Driver & Cab Allocated - Booking #${booking.bookingNumber || booking.refId}`,
      message: `Vendor "${vendorName}" has allocated Driver ${enrichedDriverObj.name} and Vehicle ${cleanRegNo} via the MAK TAXI Vendor App.`,
      description: `Trip Date: ${booking.travelDate || booking.journeyDate} • Destination: ${booking.destination || booking.toLocation} • Driver: ${enrichedDriverObj.phone}`,
      category: 'Dispatch',
      priority: 'High',
      bookingId: booking.bookingNumber || booking.refId || booking.id,
      actionUrl: `/admin/bookings/${booking.id || booking.bookingNumber}`,
      actionLink: `/admin/bookings/${booking.id || booking.bookingNumber}`,
      isRead: false,
      unread: true,
      time: 'Just now',
      timestamp: new Date().toISOString()
    });
  } catch (notifErr) {
    console.warn('[MAK TAXI Integration] Failed to log admin notification for allocation:', notifErr.message);
  }

  return {
    status: 'success',
    bookingId: booking.bookingNumber || booking.refId || booking.id,
    booking,
    allocatedVehicle: enrichedVehicleObj,
    allocatedDriver: enrichedDriverObj,
    message: `Driver ${enrichedDriverObj.name} and Vehicle ${cleanRegNo} successfully allocated to Booking #${booking.bookingNumber || booking.refId} in MAK Journey ERP`
  };
}
