// MAK Tours & Travels ERP - Booking Controller
// Connected to MongoDB Atlas "bookings" collection
// CRITICAL: ONE WAY TRIP IS STRICTLY FORBIDDEN AND DOES NOT EXIST IN THIS APPLICATION.
import { Booking } from '../models/Booking.js';
import { Vehicle } from '../models/Vehicle.js';
import { Driver } from '../models/Driver.js';
import { sequenceService } from '../services/sequenceService.js';
import { stripProtectedFields, whitelistFields } from '../utils/fieldHelper.js';
import { escapeRegex } from '../utils/escapeRegex.js';
import { buildTenantQuery } from '../middleware/tenantMiddleware.js';
import { autoEnrollRepeatCustomers } from './customerController.js';

// Helper to dynamically enrich a booking with assigned vehicle and driver details
// Stripped of all fabricated defaults (no fake plates, 85% payouts, or 1500 allowances)
export async function enrichBookingWithAssignments(booking, tenantId = null) {
  if (!booking) return booking;
  const b = { ...booking };
  const targetTenant = (tenantId || b.tenantId || 'mak-tours').toLowerCase().trim();

  // 1. Enrich Vehicle details from company fleet
  if (!b.assignedVehicle || !b.assignedVehicle.regNo) {
    const vId = b.vehicleId || (b.assignedVehicle && b.assignedVehicle.id);
    if (vId) {
      const vQuery = {
        ...buildTenantQuery(targetTenant),
        $or: [
          { id: vId },
          { regNo: vId },
          { numberPlate: vId },
          { _id: String(vId).match(/^[0-9a-fA-F]{24}$/) ? vId : null }
        ]
      };
      const v = await Vehicle.findOne(vQuery).lean();

      if (v) {
        const isCompany = !v.vendorId || v.ownership === 'MAK Owned' || v.ownership === 'Company Owned';
        b.assignedVehicle = {
          id: v.id || v._id.toString(),
          brand: v.brand || '',
          model: v.model || v.name || '',
          name: v.model || v.name || '',
          regNo: v.regNo || v.numberPlate || '',
          category: v.category || '',
          seating: typeof v.passengers === 'string' ? v.passengers : `${v.passengers || ''} Passengers`,
          fuelType: v.fuelType || '',
          status: v.status || 'Reserved',
          ratePerKm: v.ratePerKm || v.pricePerKm || 0,
          pricePerKm: v.pricePerKm || v.ratePerKm || 0,
          driverAllowance: v.driverAllowance || 0,
          image: v.image || '',
          ownership: v.ownership || (isCompany ? 'Company Owned' : 'Vendor Attached'),
          isVendorVehicle: !isCompany,
          vendorId: v.vendorId || null,
          vendorName: v.vendorName || null,
          vendorPayoutPercent: b.vendorPayoutPercent ?? v.vendorPayoutPercent ?? null,
          vendorPayableAmount: b.vendorPayableAmount || 0
        };
      }
    }
  }

  // Vehicle rates & distance calculations without fabricated 15/km
  if (!b.vehicleRatePerKm && b.assignedVehicle) {
    b.vehicleRatePerKm = b.assignedVehicle.ratePerKm || b.assignedVehicle.pricePerKm || 0;
  }
  b.distanceTravelled = b.distanceTravelled || b.actualDistanceKm || (b.endOdometer && b.startOdometer ? Math.max(0, b.endOdometer - b.startOdometer) : 0);
  b.actualDistanceKm = b.distanceTravelled;
  if (!b.vehicleTripCharge && b.distanceTravelled && b.vehicleRatePerKm) {
    b.vehicleTripCharge = Math.round(b.distanceTravelled * b.vehicleRatePerKm);
  }
  b.invoiceNumber = b.invoiceNumber || (b.invoice && b.invoice.invoiceNumber) || (b.refId ? `INV-${b.refId}` : '');

  // 2. Enrich Driver details from company roster
  if (!b.assignedDriver || (!b.assignedDriver.name && !b.assignedDriver.fullName)) {
    const dId = b.driverId || b.assignedDriverId || (b.assignedDriver && b.assignedDriver.id);
    if (dId) {
      const dQuery = {
        ...buildTenantQuery(targetTenant),
        $or: [
          { id: dId },
          { driverBadgeId: dId },
          { _id: String(dId).match(/^[0-9a-fA-F]{24}$/) ? dId : null }
        ]
      };
      const d = await Driver.findOne(dQuery).lean();

      if (d) {
        b.assignedDriver = {
          id: d.id || d.driverBadgeId || d._id.toString(),
          name: d.fullName || d.name || '',
          fullName: d.fullName || d.name || '',
          phone: d.phone || '',
          photo: d.avatar || d.photo || '',
          licenseNumber: d.drivingLicenseNumber || d.licenseNumber || '',
          rating: d.rating ?? null,
          status: d.status || 'Active'
        };
      } else if (b.driverName || b.assignedDriverName) {
        b.assignedDriver = {
          id: dId,
          name: b.driverName || b.assignedDriverName,
          fullName: b.driverName || b.assignedDriverName,
          phone: b.driverPhone || b.assignedDriverPhone || '',
          licenseNumber: '',
          rating: null,
          status: 'Assigned'
        };
      }
    }
  }

  // 3. Ensure assignment timeline is present
  if (!b.assignmentTimeline || !Array.isArray(b.assignmentTimeline)) {
    b.assignmentTimeline = [];
  }

  // 4. Bi-directional customer & booking identifier synchronization
  const resolvedCustomerName = String(b.customerName || b.fullName || b.name || '').trim() || 'Valued Guest';
  const resolvedCustomerPhone = String(b.customerPhone || b.mobileNumber || b.phone || '').trim();
  const resolvedBookingNumber = String(b.bookingNumber || b.refId || b.bookingId || b.id || (b._id ? b._id.toString() : '')).trim();

  b.customerName = resolvedCustomerName;
  b.fullName = resolvedCustomerName;
  b.name = resolvedCustomerName;

  b.customerPhone = resolvedCustomerPhone;
  b.mobileNumber = resolvedCustomerPhone;
  b.phone = resolvedCustomerPhone;

  b.bookingNumber = resolvedBookingNumber;
  b.refId = resolvedBookingNumber;
  b.bookingId = resolvedBookingNumber;
  b.id = b.id || resolvedBookingNumber;

  return b;
}

export const bookingController = {
  // 1. Get All Bookings (Fix filter overwrite bug with $and)
  getAll: async (req, res, next) => {
    try {
      const { status, bookingType, driverId, vehicleId, search } = req.query;
      const tenantId = (req.tenantId || req.user?.tenantId || 'mak-tours').toLowerCase().trim();

      const andClauses = [];

      // Tenant isolation filter (Super Admin without explicit tenant sees all)
      if (!req.isSuperAdmin || req.tenantId) {
        andClauses.push(buildTenantQuery(tenantId));
      }

      // Status filter
      if (status && status !== 'All') {
        andClauses.push({
          $or: [{ bookingStatus: status }, { tripStatus: status }, { status }]
        });
      }

      // Booking type filter
      if (bookingType && bookingType !== 'All') {
        andClauses.push({ bookingType });
      }

      // Driver filter (combined with $and so it NEVER overwrites status!)
      if (driverId) {
        andClauses.push({
          $or: [{ driverId }, { assignedDriverId: driverId }]
        });
      }

      // Vehicle filter
      if (vehicleId) {
        andClauses.push({ vehicleId });
      }

      // Search filter
      if (search && search.trim()) {
        const s = escapeRegex(search.trim());
        andClauses.push({
          $or: [
            { fullName: { $regex: s, $options: 'i' } },
            { refId: { $regex: s, $options: 'i' } },
            { bookingNumber: { $regex: s, $options: 'i' } },
            { mobileNumber: { $regex: s, $options: 'i' } }
          ]
        });
      }

      const query = andClauses.length > 0 ? { $and: andClauses } : {};

      const list = await Booking.find(query).sort({ createdAt: -1 }).lean();

      const formatted = await Promise.all(
        list.map(async (rawB) => {
          const b = await enrichBookingWithAssignments(rawB, rawB.tenantId || tenantId);
          return {
            ...b,
            id: b.id || b.refId || b.bookingNumber || b._id.toString(),
            bookingNumber: b.bookingNumber || b.refId || b.id || b._id.toString(),
            refId: b.refId || b.bookingNumber || b.id || b._id.toString(),
            bookingId: b.bookingId || b.refId || b.bookingNumber || b.id || b._id.toString(),
            customerName: b.customerName || b.fullName || 'Valued Guest',
            fullName: b.fullName || b.customerName || 'Valued Guest',
            name: b.name || b.fullName || b.customerName || 'Valued Guest',
            customerPhone: b.customerPhone || b.mobileNumber || b.phone || '',
            mobileNumber: b.mobileNumber || b.customerPhone || b.phone || '',
            phone: b.phone || b.mobileNumber || b.customerPhone || '',
            customerEmail: b.email || b.customerEmail || '',
            email: b.email || b.customerEmail || '',
            pickupLocation: b.pickupLocation || b.fromLocation || '',
            destination: b.dropLocation || b.toLocation || b.destination || '',
            fromLocation: b.pickupLocation || b.fromLocation || '',
            toLocation: b.dropLocation || b.toLocation || b.destination || '',
            journeyDate: b.travelDate || b.pickupDate || b.journeyDate || '',
            travelDate: b.travelDate || b.pickupDate || b.journeyDate || '',
            pickupDate: b.pickupDate || b.travelDate || b.journeyDate || '',
            returnDate: b.returnDate || b.travelDate || b.pickupDate || b.journeyDate || '',
            journeyTime: b.pickupTime || b.journeyTime || '',
            pickupTime: b.pickupTime || b.journeyTime || '',
            fare: b.totalFare || b.pricing || b.fare || b.totalAmount || 0,
            totalFare: b.totalFare || b.pricing || b.fare || b.totalAmount || 0,
            pricing: b.totalFare || b.pricing || b.fare || b.totalAmount || 0,
            totalAmount: b.totalFare || b.pricing || b.fare || b.totalAmount || 0,
            advancePaid: b.advancePaid !== undefined ? b.advancePaid : 0,
            balanceDue: b.balanceDue !== undefined ? b.balanceDue : Math.max(0, (b.totalFare || b.pricing || 0) - (b.advancePaid || 0)),
            balanceAmount: b.balanceDue !== undefined ? b.balanceDue : Math.max(0, (b.totalFare || b.pricing || 0) - (b.advancePaid || 0)),
            vehicleReserved: b.vehicleName || b.vehicleReserved || '',
            vehicleName: b.vehicleName || b.vehicleReserved || '',
            passengerCount: b.passengers || b.passengerCount || 1,
            passengers: b.passengers || b.passengerCount || 1,
            tripCategory: b.bookingType || 'Round Trip',
            bookingCategory: b.bookingType || 'Round Trip',
            bookingStatus: b.bookingStatus || b.status || 'Confirmed'
          };
        })
      );

      return res.status(200).json({ status: 'success', count: formatted.length, data: formatted });
    } catch (err) {
      next(err);
    }
  },

  // 2. Get Single Booking
  getById: async (req, res, next) => {
    try {
      const { id } = req.params;
      const tenantId = (req.tenantId || req.user?.tenantId || 'mak-tours').toLowerCase().trim();

      const orClauses = [{ id }, { refId: id }, { bookingNumber: id }];
      if (typeof id === 'string') {
        if (id.startsWith('BK-')) {
          const alt = id.replace('BK-', 'MAK-');
          orClauses.push({ id: alt }, { refId: alt }, { bookingNumber: alt });
        } else if (id.startsWith('MAK-')) {
          const alt = id.replace('MAK-', 'BK-');
          orClauses.push({ id: alt }, { refId: alt }, { bookingNumber: alt });
        }
        if (id.match(/^[0-9a-fA-F]{24}$/)) {
          orClauses.push({ _id: id });
        }
      }
      const tenantFilter = req.tenantQuery || ((!req.isSuperAdmin || req.tenantId) ? buildTenantQuery(tenantId) : {});
      const findQuery = {
        ...tenantFilter,
        $or: orClauses
      };
      const rawBooking = await Booking.findOne(findQuery).lean();

      if (!rawBooking) {
        return res.status(404).json({ status: 'error', message: 'Booking not found' });
      }

      const booking = await enrichBookingWithAssignments(rawBooking, rawBooking.tenantId || tenantId);

      return res.status(200).json({
        status: 'success',
        data: {
          ...booking,
          id: booking.id || booking.refId || booking.bookingNumber || booking._id.toString(),
          bookingNumber: booking.bookingNumber || booking.refId || booking.id || booking._id.toString(),
          refId: booking.refId || booking.bookingNumber || booking.id || booking._id.toString(),
          bookingId: booking.bookingId || booking.refId || booking.bookingNumber || booking.id || booking._id.toString(),
          customerName: booking.customerName || booking.fullName || 'Valued Guest',
          fullName: booking.fullName || booking.customerName || 'Valued Guest',
          name: booking.name || booking.fullName || booking.customerName || 'Valued Guest',
          customerPhone: booking.customerPhone || booking.mobileNumber || booking.phone || '',
          mobileNumber: booking.mobileNumber || booking.customerPhone || booking.phone || '',
          phone: booking.phone || booking.mobileNumber || booking.customerPhone || '',
          customerEmail: booking.email || booking.customerEmail || '',
          email: booking.email || booking.customerEmail || ''
        }
      });
    } catch (err) {
      next(err);
    }
  },

  // 3. Create Booking (Validation, No Upsert, 409 on Duplicate, Atomic Sequence)
  create: async (req, res, next) => {
    try {
      const tenantId = (req.tenantId || req.user?.tenantId || 'mak-tours').toLowerCase().trim();
      const tenantQuery = buildTenantQuery(tenantId);
      const rawBody = stripProtectedFields(req.body);

      // Validate required fields
      const fullName = (rawBody.fullName || rawBody.customerName || '').trim();
      const mobileNumber = (rawBody.mobileNumber || rawBody.customerPhone || rawBody.phone || '').trim();
      const bookingType = (rawBody.bookingType || rawBody.bookingCategory || rawBody.tripType || '').trim();
      const travelDate = (rawBody.travelDate || rawBody.journeyDate || rawBody.pickupDate || '').trim();
      let pickupLocation = (rawBody.pickupLocation || rawBody.fromLocation || '').trim();
      let toLocation = (rawBody.toLocation || rawBody.destination || rawBody.dropLocation || '').trim();

      if ((!pickupLocation || !toLocation) && rawBody.route) {
        const parts = String(rawBody.route).includes('–') ? String(rawBody.route).split('–') : String(rawBody.route).split('-');
        if (!pickupLocation && parts[0]) pickupLocation = parts[0].trim();
        if (!toLocation && parts[1]) toLocation = parts[1].trim();
      }

      const rawStatus = (rawBody.bookingStatus || rawBody.status || 'Confirmed').toLowerCase();
      const isHistorical = rawStatus.includes('complete') || rawStatus.includes('cancel') || rawStatus.includes('progress');

      const validationErrors = {};
      if (!fullName) validationErrors.fullName = 'Customer name is required';
      if (!mobileNumber) validationErrors.mobileNumber = 'Mobile number is required';
      if (!bookingType) validationErrors.bookingType = 'Booking type is required';
      if (!travelDate) {
        validationErrors.travelDate = 'Travel date is required';
      } else if (!isHistorical) {
        const now = new Date();
        const istDate = new Date(now.getTime() + (5.5 * 60 * 60 * 1000));
        const todayDateStr = istDate.toISOString().substring(0, 10);
        const minDate = now.toISOString().substring(0, 10) < todayDateStr ? now.toISOString().substring(0, 10) : todayDateStr;
        const normTravelDate = travelDate.substring(0, 10);
        if (normTravelDate < minDate) {
          validationErrors.travelDate = 'Travel departure date cannot be in the past';
        }
      }
      if (!pickupLocation) validationErrors.pickupLocation = 'Pickup location is required';
      if (!toLocation) validationErrors.toLocation = 'Destination is required';

      if (Object.keys(validationErrors).length > 0) {
        return res.status(400).json({
          status: 'error',
          code: 'VALIDATION_ERROR',
          message: 'Missing required booking fields',
          errors: validationErrors
        });
      }

      // Prohibit One Way Trip
      if (bookingType.toLowerCase().includes('one way')) {
        return res.status(400).json({
          status: 'error',
          code: 'ONE_WAY_PROHIBITED',
          message: 'ONE WAY TRIP IS STRICTLY PROHIBITED IN MAK TOURS ERP'
        });
      }

      // Check if reference is provided or generate new atomic reference
      let refId = (rawBody.refId || rawBody.bookingNumber || '').trim();
      let wasColliding = false;
      if (refId) {
        // If reference exists in tenant, auto-resolve by assigning a guaranteed-unique atomic reference
        const existing = await Booking.findOne({ ...tenantQuery, refId });
        if (existing) {
          wasColliding = true;
          refId = await sequenceService.getNextBookingRef(tenantId);
        }
      } else {
        refId = await sequenceService.getNextBookingRef(tenantId);
      }

      // Ensure refId is 100% unique in this company
      let isRefUnique = false;
      let collisionRetries = 0;
      while (!isRefUnique && collisionRetries < 30) {
        const dupCheck = await Booking.findOne({ ...tenantQuery, refId });
        if (!dupCheck) {
          isRefUnique = true;
        } else {
          collisionRetries++;
          wasColliding = true;
          refId = await sequenceService.getNextBookingRef(tenantId);
        }
      }

      const docId = wasColliding ? refId : (rawBody.id || refId);
      const bNumber = wasColliding ? refId : (rawBody.bookingNumber || refId);

      const pricing = Math.max(0, Number(rawBody.pricing || rawBody.fare || rawBody.totalFare || rawBody.totalAmount) || 0);
      const advancePaid = Math.max(0, Number(rawBody.advancePaid) || 0);
      const balanceDue = Math.max(0, pricing - advancePaid);

      const targetVehicleId = rawBody.vehicleId || (rawBody.assignedVehicle && (rawBody.assignedVehicle.id || rawBody.assignedVehicle.regNo));
      const targetDriverId = rawBody.driverId || (rawBody.assignedDriver && rawBody.assignedDriver.id);

      if (targetVehicleId) {
        const vCheck = await Vehicle.findOne({
          ...tenantQuery,
          $or: [
            { id: targetVehicleId },
            { regNo: targetVehicleId },
            { numberPlate: targetVehicleId },
            { _id: String(targetVehicleId).match(/^[0-9a-fA-F]{24}$/) ? targetVehicleId : null }
          ]
        }).lean();
        if (vCheck && (vCheck.isActive === false || ['Maintenance', 'Unavailable', 'Inactive'].includes(vCheck.status))) {
          return res.status(400).json({
            status: 'error',
            code: 'VEHICLE_NOT_AVAILABLE',
            message: `Vehicle ${vCheck.model || vCheck.name} (${vCheck.regNo || vCheck.numberPlate}) is currently marked as '${vCheck.status}' and cannot be booked.`
          });
        }
      }

      const timelineEntries = Array.isArray(rawBody.assignmentTimeline) && rawBody.assignmentTimeline.length > 0
        ? rawBody.assignmentTimeline
        : [
            {
              id: `TL-${Date.now()}`,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              event: targetVehicleId && targetDriverId
                ? `Booking created (${refId}) with Vehicle & Driver assigned`
                : targetVehicleId
                ? `Booking created (${refId}) with Vehicle allocated`
                : `Booking created (${refId})`,
              actor: 'System / Operations Desk',
              status: (targetVehicleId && targetDriverId) ? 'Assigned' : 'Confirmed'
            }
          ];

      const newBooking = await Booking.create({
        ...rawBody,
        tenantId,
        id: docId,
        refId,
        bookingNumber: bNumber,
        fullName,
        customerName: fullName,
        mobileNumber,
        customerPhone: mobileNumber,
        email: rawBody.email || '',
        bookingType,
        bookingCategory: bookingType,
        fromLocation: pickupLocation,
        pickupLocation,
        toLocation,
        destination: toLocation,
        travelDate,
        journeyDate: travelDate,
        pickupDate: travelDate,
        returnDate: rawBody.returnDate || travelDate,
        pickupTime: rawBody.pickupTime || rawBody.journeyTime || '',
        pricing,
        fare: pricing,
        totalFare: pricing,
        totalAmount: pricing,
        advancePaid,
        balanceDue,
        balanceAmount: balanceDue,
        paymentOption: rawBody.paymentOption || (advancePaid === 0 ? 'Pay on Departure' : advancePaid >= pricing ? 'Fully Paid' : 'Partial Advance'),
        paymentType: rawBody.paymentType || (advancePaid === 0 ? 'Book at ₹0 (Pay on Departure)' : advancePaid >= pricing ? 'Full Payment (100% Settled)' : 'Partial Advance Payment'),
        paymentStatus: rawBody.paymentStatus || (advancePaid === 0 ? 'Pending' : advancePaid >= pricing ? 'Paid' : 'Partially Paid'),
        vehicleId: targetVehicleId || '',
        vehicleName: rawBody.vehicleName || '',
        assignedVehicle: rawBody.assignedVehicle || null,
        driverId: targetDriverId || '',
        driverName: rawBody.driverName || (rawBody.assignedDriver && (rawBody.assignedDriver.name || rawBody.assignedDriver.fullName)) || '',
        assignedDriver: rawBody.assignedDriver || null,
        driverCompensationAmount: Number(rawBody.driverCompensationAmount) || 0,
        driverBaseTripPay: Number(rawBody.driverBaseTripPay || rawBody.driverCompensationAmount) || 0,
        vendorPayoutPercent: rawBody.vendorPayoutPercent !== undefined ? rawBody.vendorPayoutPercent : null,
        vendorPayableAmount: Number(rawBody.vendorPayableAmount) || 0,
        bookingStatus: rawBody.bookingStatus || rawBody.status || ((targetVehicleId && targetDriverId) ? 'Confirmed' : 'Pending'),
        status: rawBody.status || rawBody.bookingStatus || ((targetVehicleId && targetDriverId) ? 'Confirmed' : 'Pending'),
        tripStatus: rawBody.tripStatus || (targetDriverId ? 'Awaiting Driver Acceptance' : 'Upcoming'),
        driverAssignmentStatus: rawBody.driverAssignmentStatus || (targetDriverId ? 'Assigned' : 'Unassigned'),
        assignmentTimeline: timelineEntries
      });

      // Mark vehicle as Reserved in fleet if assigned upon creation
      if (targetVehicleId) {
        await Vehicle.findOneAndUpdate(
          { ...buildTenantQuery(tenantId), $or: [{ id: targetVehicleId }, { regNo: targetVehicleId }, { numberPlate: targetVehicleId }] },
          { $set: { status: 'Reserved' } }
        );
      }

      // Mark driver as Assigned in roster if assigned upon creation
      if (targetDriverId) {
        await Driver.findOneAndUpdate(
          { ...buildTenantQuery(tenantId), $or: [{ id: targetDriverId }, { driverBadgeId: targetDriverId }] },
          { $set: { dutyStatus: 'Assigned' } }
        );
      }

      const enriched = await enrichBookingWithAssignments(newBooking.toObject ? newBooking.toObject() : newBooking, tenantId);

      // Auto-enroll customer into Customer CRM (all booking passengers are considered customers, even for 1 trip)
      autoEnrollRepeatCustomers(tenantQuery, tenantId).catch(() => {});

      return res.status(201).json({ status: 'success', data: enriched });
    } catch (err) {
      next(err);
    }
  },

  // 4. Update Booking (Whitelisted Fields, Scoped Vehicle/Driver)
  update: async (req, res, next) => {
    try {
      const { id } = req.params;
      const tenantId = (req.tenantId || req.user?.tenantId || 'mak-tours').toLowerCase().trim();

      const orClauses = [{ id }, { refId: id }, { bookingNumber: id }];
      if (typeof id === 'string') {
        if (id.startsWith('BK-')) {
          const alt = id.replace('BK-', 'MAK-');
          orClauses.push({ id: alt }, { refId: alt }, { bookingNumber: alt });
        } else if (id.startsWith('MAK-')) {
          const alt = id.replace('MAK-', 'BK-');
          orClauses.push({ id: alt }, { refId: alt }, { bookingNumber: alt });
        }
        if (id.match(/^[0-9a-fA-F]{24}$/)) {
          orClauses.push({ _id: id });
        }
      }
      const tenantFilter = req.tenantQuery || ((!req.isSuperAdmin || req.tenantId) ? buildTenantQuery(tenantId) : {});
      const findQuery = {
        ...tenantFilter,
        $or: orClauses
      };

      const existingBooking = await Booking.findOne(findQuery);
      if (!existingBooking) {
        return res.status(404).json({ status: 'error', message: 'Booking not found' });
      }

      const bookingTenantId = existingBooking.tenantId || tenantId;

      // Whitelist editable fields (protect tenantId, refId, bookingNumber, payments)
      const ALLOWED_UPDATE_FIELDS = [
        'fullName',
        'customerName',
        'mobileNumber',
        'customerPhone',
        'email',
        'bookingType',
        'vehicleId',
        'vehicleName',
        'vehicleCategory',
        'passengers',
        'pricing',
        'fare',
        'totalFare',
        'totalAmount',
        'fromLocation',
        'toLocation',
        'pickupLocation',
        'dropLocation',
        'travelDate',
        'pickupDate',
        'pickupTime',
        'returnDate',
        'packageName',
        'packageId',
        'notes',
        'tripRemarks'
      ];
      const cleanData = whitelistFields(req.body, ALLOWED_UPDATE_FIELDS);

      if (cleanData.customerName || cleanData.fullName) {
        const cName = String(cleanData.customerName || cleanData.fullName).trim();
        cleanData.customerName = cName;
        cleanData.fullName = cName;
        cleanData.name = cName;
      }
      if (cleanData.customerPhone || cleanData.mobileNumber) {
        const cPhone = String(cleanData.customerPhone || cleanData.mobileNumber).trim();
        cleanData.customerPhone = cPhone;
        cleanData.mobileNumber = cPhone;
        cleanData.phone = cPhone;
      }

      if (cleanData.bookingType && cleanData.bookingType.toLowerCase().includes('one way')) {
        return res.status(400).json({
          status: 'error',
          message: 'One Way Trip is strictly prohibited in this application.'
        });
      }

      // Validate date sequence: returnDate cannot be before travelDate
      const effTravel = cleanData.travelDate || existingBooking.travelDate;
      const effReturn = cleanData.returnDate || existingBooking.returnDate;
      if (effTravel && effReturn && effReturn < effTravel) {
        return res.status(400).json({
          status: 'error',
          code: 'INVALID_DATE_RANGE',
          message: `Return date (${effReturn}) cannot be earlier than travel date (${effTravel})`
        });
      }

      // If vehicleId changed, ensure it belongs to the tenant
      if (cleanData.vehicleId && cleanData.vehicleId !== existingBooking.vehicleId) {
        const v = await Vehicle.findOne({
          ...buildTenantQuery(bookingTenantId),
          $or: [
            { id: cleanData.vehicleId },
            { regNo: cleanData.vehicleId },
            { numberPlate: cleanData.vehicleId },
            { _id: cleanData.vehicleId.match(/^[0-9a-fA-F]{24}$/) ? cleanData.vehicleId : null }
          ]
        }).lean();

        if (!v) {
          return res.status(404).json({
            status: 'error',
            message: 'Vehicle does not belong to your company fleet'
          });
        }
        if (v.isActive === false || ['Maintenance', 'Unavailable', 'Inactive'].includes(v.status)) {
          return res.status(400).json({
            status: 'error',
            code: 'VEHICLE_NOT_AVAILABLE',
            message: `Vehicle ${v.model || v.name} (${v.regNo || v.numberPlate}) is currently marked as '${v.status}' and cannot be assigned.`
          });
        }
        cleanData.vehicleName = v.model || v.name;
        cleanData.vehicleRatePerKm = v.ratePerKm || v.pricePerKm || 0;
      }

      const updated = await Booking.findByIdAndUpdate(
        existingBooking._id,
        { $set: cleanData },
        { returnDocument: 'after', runValidators: true }
      );

      const enriched = await enrichBookingWithAssignments(updated.toObject ? updated.toObject() : updated, bookingTenantId);
      return res.status(200).json({ status: 'success', data: enriched });
    } catch (err) {
      next(err);
    }
  },

  // 5. Assign Vehicle & Driver (Overlap Prevention & Tenant Isolation)
  assign: async (req, res, next) => {
    try {
      const { id } = req.params;
      const {
        driverId,
        driverName,
        driverPhone,
        vehicleId,
        vehicleName,
        assignedVehicle,
        assignedDriver,
        driverCompensationAmount,
        vendorPayoutPercent,
        vendorPayableAmount
      } = req.body;

      const tenantId = (req.tenantId || req.user?.tenantId || 'mak-tours').toLowerCase().trim();
      const orClauses = [{ id }, { refId: id }, { bookingNumber: id }];
      if (typeof id === 'string') {
        if (id.startsWith('BK-')) {
          const alt = id.replace('BK-', 'MAK-');
          orClauses.push({ id: alt }, { refId: alt }, { bookingNumber: alt });
        } else if (id.startsWith('MAK-')) {
          const alt = id.replace('MAK-', 'BK-');
          orClauses.push({ id: alt }, { refId: alt }, { bookingNumber: alt });
        }
        if (id.match(/^[0-9a-fA-F]{24}$/)) {
          orClauses.push({ _id: id });
        }
      }
      const tenantFilter = req.tenantQuery || ((!req.isSuperAdmin || req.tenantId) ? buildTenantQuery(tenantId) : {});
      const findQuery = {
        ...tenantFilter,
        $or: orClauses
      };

      const existingBooking = await Booking.findOne(findQuery);
      if (!existingBooking) {
        return res.status(404).json({ status: 'error', message: 'Booking not found' });
      }

      const bookingTenantId = existingBooking.tenantId || tenantId;
      const tripStartDate = existingBooking.travelDate || existingBooking.pickupDate || existingBooking.journeyDate || '';
      const tripEndDate = existingBooking.returnDate || tripStartDate;

      // Validate vehicle within booking's tenant
      let finalVehicleObj = assignedVehicle;
      const vLookupId = vehicleId || (assignedVehicle && (assignedVehicle.regNo || assignedVehicle.id));
      if (vLookupId) {
        const v = await Vehicle.findOne({
          ...buildTenantQuery(bookingTenantId),
          $or: [
            { id: vLookupId },
            { regNo: vLookupId },
            { numberPlate: vLookupId },
            { _id: String(vLookupId).match(/^[0-9a-fA-F]{24}$/) ? vLookupId : null }
          ]
        }).lean();

        if (!v) {
          return res.status(404).json({
            status: 'error',
            code: 'CROSS_TENANT_RELATIONSHIP_FORBIDDEN',
            message: 'Vehicle does not belong to this company or was not found in company fleet'
          });
        }

        if (v.isActive === false || ['Maintenance', 'Unavailable', 'Inactive'].includes(v.status)) {
          return res.status(400).json({
            status: 'error',
            code: 'VEHICLE_NOT_AVAILABLE',
            message: `Vehicle ${v.model || v.name} (${v.regNo || v.numberPlate}) is currently marked as '${v.status}' and cannot be assigned to trips.`
          });
        }

        // OVERLAP PREVENTION: Check if vehicle has another active trip overlapping [tripStartDate, tripEndDate]
        if (tripStartDate) {
          const vehicleOverlap = await Booking.findOne({
            ...buildTenantQuery(bookingTenantId),
            _id: { $ne: existingBooking._id },
            vehicleId: v.regNo || v.id,
            status: { $nin: ['Cancelled', 'Trip Completed', 'Completed'] },
            tripStatus: { $nin: ['Cancelled', 'Trip Completed', 'Completed'] },
            $or: [
              { travelDate: { $lte: tripEndDate }, returnDate: { $gte: tripStartDate } },
              { travelDate: { $gte: tripStartDate, $lte: tripEndDate } }
            ]
          }).lean();

          if (vehicleOverlap) {
            return res.status(409).json({
              status: 'error',
              code: 'VEHICLE_OVERLAP_CONFLICT',
              message: `Vehicle ${v.model || v.name} (${v.regNo}) is already dispatched on Booking #${vehicleOverlap.bookingNumber || vehicleOverlap.refId} between ${vehicleOverlap.travelDate} and ${vehicleOverlap.returnDate || vehicleOverlap.travelDate}.`
            });
          }
        }

        const isCompany = !v.vendorId || v.ownership === 'MAK Owned' || v.ownership === 'Company Owned';
        finalVehicleObj = {
          id: v.id || v._id.toString(),
          brand: v.brand || '',
          model: v.model || v.name || '',
          name: v.model || v.name || '',
          regNo: v.regNo || v.numberPlate || '',
          category: v.category || '',
          seating: typeof v.passengers === 'string' ? v.passengers : `${v.passengers || ''} Passengers`,
          fuelType: v.fuelType || '',
          status: 'Reserved',
          ratePerKm: v.pricePerKm || v.ratePerKm || 0,
          driverAllowance: v.driverAllowance || 0,
          image: v.image || '',
          ownership: v.ownership || (isCompany ? 'Company Owned' : 'Vendor Attached'),
          isVendorVehicle: !isCompany,
          vendorId: v.vendorId || null,
          vendorName: v.vendorName || null,
          vendorPayoutPercent: vendorPayoutPercent ?? v.vendorPayoutPercent ?? null,
          vendorPayableAmount: vendorPayableAmount || 0
        };
      }

      // Validate driver within booking's tenant
      let finalDriverObj = assignedDriver;
      const dLookupId = driverId || (assignedDriver && (assignedDriver.id || assignedDriver.driverBadgeId));
      if (dLookupId) {
        const d = await Driver.findOne({
          tenantId: bookingTenantId,
          $or: [
            { id: dLookupId },
            { driverBadgeId: dLookupId },
            { _id: String(dLookupId).match(/^[0-9a-fA-F]{24}$/) ? dLookupId : null }
          ]
        }).lean();

        if (!d) {
          return res.status(404).json({
            status: 'error',
            code: 'CROSS_TENANT_RELATIONSHIP_FORBIDDEN',
            message: 'Driver does not belong to this company or was not found on company roster'
          });
        }

        // OVERLAP PREVENTION: Check if driver has another active trip overlapping [tripStartDate, tripEndDate]
        if (tripStartDate) {
          const drvIdVal = d.driverBadgeId || d.id;
          const driverOverlap = await Booking.findOne({
            ...buildTenantQuery(bookingTenantId),
            _id: { $ne: existingBooking._id },
            $or: [{ driverId: drvIdVal }, { assignedDriverId: drvIdVal }],
            status: { $nin: ['Cancelled', 'Trip Completed', 'Completed'] },
            tripStatus: { $nin: ['Cancelled', 'Trip Completed', 'Completed'] },
            $or: [
              { travelDate: { $lte: tripEndDate }, returnDate: { $gte: tripStartDate } },
              { travelDate: { $gte: tripStartDate, $lte: tripEndDate } }
            ]
          }).lean();

          if (driverOverlap) {
            return res.status(409).json({
              status: 'error',
              code: 'DRIVER_OVERLAP_CONFLICT',
              message: `Chauffeur ${d.fullName || d.name} is already assigned to Booking #${driverOverlap.bookingNumber || driverOverlap.refId} between ${driverOverlap.travelDate} and ${driverOverlap.returnDate || driverOverlap.travelDate}.`
            });
          }
        }

        finalDriverObj = {
          id: d.id || d.driverBadgeId || d._id.toString(),
          name: d.fullName || d.name,
          fullName: d.fullName || d.name,
          phone: d.phone || '',
          photo: d.avatar || d.photo || '',
          licenseNumber: d.drivingLicenseNumber || d.licenseNumber || '',
          rating: d.rating ?? null,
          status: 'Assigned'
        };
      }

      const vDisplay = finalVehicleObj ? `${finalVehicleObj.model || finalVehicleObj.name} [${finalVehicleObj.regNo}]` : (vehicleName || vehicleId || '');
      const dDisplay = finalDriverObj ? (finalDriverObj.name || finalDriverObj.fullName) : (driverName || driverId || '');

      const setPayload = {
        driverId: driverId || (finalDriverObj && finalDriverObj.id),
        driverName: dDisplay,
        driverPhone: driverPhone || (finalDriverObj && finalDriverObj.phone) || '',
        assignedDriverId: driverId || (finalDriverObj && finalDriverObj.id),
        assignedDriverName: dDisplay,
        assignedDriverPhone: driverPhone || (finalDriverObj && finalDriverObj.phone) || '',
        vehicleId: vehicleId || (finalVehicleObj && (finalVehicleObj.regNo || finalVehicleObj.id)),
        vehicleName: vDisplay,
        driverAssignmentStatus: 'Assigned',
        tripStatus: 'Awaiting Driver Acceptance'
      };

      if (finalVehicleObj) {
        setPayload.assignedVehicle = finalVehicleObj;
        setPayload.vehicleRatePerKm = finalVehicleObj.ratePerKm || finalVehicleObj.pricePerKm || 0;
      }
      if (finalDriverObj) setPayload.assignedDriver = finalDriverObj;
      if (driverCompensationAmount !== undefined) setPayload.driverCompensationAmount = Number(driverCompensationAmount);
      if (vendorPayoutPercent !== undefined) setPayload.vendorPayoutPercent = Number(vendorPayoutPercent);
      if (vendorPayableAmount !== undefined) setPayload.vendorPayableAmount = Number(vendorPayableAmount);

      const timelineEntry = {
        id: `TL-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        event: `Vehicle Assigned: ${vDisplay} & Driver Assigned: ${dDisplay} (Compensation: ₹${Number(driverCompensationAmount || 0).toLocaleString('en-IN')})`,
        actor: 'Operations Admin',
        status: 'Assigned'
      };

      const updated = await Booking.findOneAndUpdate(
        findQuery,
        {
          $set: setPayload,
          $push: { assignmentTimeline: timelineEntry }
        },
        { returnDocument: 'after' }
      );

      // Update vehicle status in Vehicle collection to Reserved
      if (finalVehicleObj && finalVehicleObj.regNo) {
        await Vehicle.findOneAndUpdate(
          { ...buildTenantQuery(bookingTenantId), $or: [{ regNo: finalVehicleObj.regNo }, { numberPlate: finalVehicleObj.regNo }, { id: finalVehicleObj.id }] },
          { $set: { status: 'Reserved' } }
        );
      }

      const enriched = await enrichBookingWithAssignments(updated.toObject ? updated.toObject() : updated, bookingTenantId);
      return res.status(200).json({ status: 'success', data: enriched });
    } catch (err) {
      next(err);
    }
  },

  // 6. Cancel Booking (Frees Vehicle and Driver, Blocks Completed Cancellation)
  cancel: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { reason = '' } = req.body;
      const tenantId = (req.tenantId || req.user?.tenantId || 'mak-tours').toLowerCase().trim();

      const orClauses = [{ id }, { refId: id }, { bookingNumber: id }];
      if (typeof id === 'string') {
        if (id.startsWith('BK-')) {
          const alt = id.replace('BK-', 'MAK-');
          orClauses.push({ id: alt }, { refId: alt }, { bookingNumber: alt });
        } else if (id.startsWith('MAK-')) {
          const alt = id.replace('MAK-', 'BK-');
          orClauses.push({ id: alt }, { refId: alt }, { bookingNumber: alt });
        }
        if (id.match(/^[0-9a-fA-F]{24}$/)) {
          orClauses.push({ _id: id });
        }
      }
      const tenantFilter = req.tenantQuery || ((!req.isSuperAdmin || req.tenantId) ? buildTenantQuery(tenantId) : {});
      const findQuery = {
        ...tenantFilter,
        $or: orClauses
      };

      const existing = await Booking.findOne(findQuery);
      if (!existing) {
        return res.status(404).json({ status: 'error', message: 'Booking not found' });
      }

      // Block cancelling completed trips
      if (existing.bookingStatus === 'Completed' || existing.tripStatus === 'Trip Completed' || existing.tripStatus === 'Completed') {
        return res.status(400).json({
          status: 'error',
          code: 'CANNOT_CANCEL_COMPLETED',
          message: 'Completed trips cannot be cancelled.'
        });
      }

      const bookingTenantId = existing.tenantId || tenantId;

      const timelineEntry = {
        id: `TL-CANCEL-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        event: `Trip cancelled. Reason: ${reason || 'Cancelled by Operations Desk'}. Vehicle & Driver released.`,
        actor: 'Operations Admin',
        status: 'Cancelled'
      };

      existing.bookingStatus = 'Cancelled';
      existing.tripStatus = 'Cancelled';
      existing.status = 'Cancelled';
      existing.driverAssignmentStatus = 'Unassigned';
      existing.notes = reason ? `Cancelled. Reason: ${reason}` : 'Cancelled by Operations Desk';
      existing.assignmentTimeline = existing.assignmentTimeline || [];
      existing.assignmentTimeline.push(timelineEntry);

      await existing.save();

      // Free vehicle availability in Vehicle collection
      const vId = existing.vehicleId || (existing.assignedVehicle && (existing.assignedVehicle.regNo || existing.assignedVehicle.id));
      if (vId) {
        await Vehicle.findOneAndUpdate(
          { ...buildTenantQuery(bookingTenantId), $or: [{ regNo: vId }, { numberPlate: vId }, { id: vId }] },
          { $set: { status: 'Available' } }
        );
      }

      // Free driver availability in Driver collection
      const dId = existing.driverId || existing.assignedDriverId || (existing.assignedDriver && (existing.assignedDriver.id || existing.assignedDriver.driverBadgeId));
      if (dId) {
        await Driver.findOneAndUpdate(
          { tenantId: bookingTenantId, $or: [{ id: dId }, { driverBadgeId: dId }] },
          { $set: { dutyStatus: 'Available' } }
        );
      }

      const enriched = await enrichBookingWithAssignments(existing.toObject ? existing.toObject() : existing, bookingTenantId);

      return res.status(200).json({
        status: 'success',
        message: 'Booking cancelled successfully. Vehicle and driver released.',
        data: enriched
      });
    } catch (err) {
      next(err);
    }
  },

  // 7. Change Status
  updateStatus: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { status, ...rest } = req.body;
      const tenantId = (req.tenantId || req.user?.tenantId || 'mak-tours').toLowerCase().trim();

      const orClauses = [{ id }, { refId: id }, { bookingNumber: id }];
      if (typeof id === 'string') {
        if (id.startsWith('BK-')) {
          const alt = id.replace('BK-', 'MAK-');
          orClauses.push({ id: alt }, { refId: alt }, { bookingNumber: alt });
        } else if (id.startsWith('MAK-')) {
          const alt = id.replace('MAK-', 'BK-');
          orClauses.push({ id: alt }, { refId: alt }, { bookingNumber: alt });
        }
        if (id.match(/^[0-9a-fA-F]{24}$/)) {
          orClauses.push({ _id: id });
        }
      }
      const tenantFilter = req.tenantQuery || ((!req.isSuperAdmin || req.tenantId) ? buildTenantQuery(tenantId) : {});
      const findQuery = {
        ...tenantFilter,
        $or: orClauses
      };

      const cleanRest = stripProtectedFields(rest);

      const updated = await Booking.findOneAndUpdate(
        findQuery,
        {
          $set: {
            bookingStatus: status,
            status,
            tripStatus: status,
            ...cleanRest
          }
        },
        { returnDocument: 'after' }
      );

      if (!updated) {
        return res.status(404).json({ status: 'error', message: 'Booking not found' });
      }

      return res.status(200).json({ status: 'success', data: updated });
    } catch (err) {
      next(err);
    }
  },

  // 8. Delete Booking
  delete: async (req, res, next) => {
    try {
      const { id } = req.params;
      const tenantId = (req.tenantId || req.user?.tenantId || 'mak-tours').toLowerCase().trim();

      const orClauses = [{ id }, { refId: id }, { bookingNumber: id }];
      if (typeof id === 'string') {
        if (id.startsWith('BK-')) {
          const alt = id.replace('BK-', 'MAK-');
          orClauses.push({ id: alt }, { refId: alt }, { bookingNumber: alt });
        } else if (id.startsWith('MAK-')) {
          const alt = id.replace('MAK-', 'BK-');
          orClauses.push({ id: alt }, { refId: alt }, { bookingNumber: alt });
        }
        if (id.match(/^[0-9a-fA-F]{24}$/)) {
          orClauses.push({ _id: id });
        }
      }
      const tenantFilter = req.tenantQuery || ((!req.isSuperAdmin || req.tenantId) ? buildTenantQuery(tenantId) : {});
      const findQuery = {
        ...tenantFilter,
        $or: orClauses
      };

      const deleted = await Booking.findOneAndDelete(findQuery);

      if (!deleted) {
        return res.status(404).json({ status: 'error', message: 'Booking not found' });
      }

      return res.status(200).json({ status: 'success', message: 'Booking deleted successfully' });
    } catch (err) {
      next(err);
    }
  }
};

export default bookingController;
