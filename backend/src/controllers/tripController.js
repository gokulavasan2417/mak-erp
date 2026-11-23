// MAK Tours & Travels ERP - Trip & Driver Execution Controller
// CRITICAL: ONE WAY TRIP IS STRICTLY FORBIDDEN AND DOES NOT EXIST IN THIS APPLICATION.
import { Booking } from '../models/Booking.js';
import { Driver } from '../models/Driver.js';
import { Vehicle } from '../models/Vehicle.js';
import { Attendance } from '../models/Attendance.js';
import { Notification } from '../models/Notification.js';
import { db } from '../config/db.js';
import { buildTenantQuery } from '../middleware/tenantMiddleware.js';

// Helper to push system notifications into the persistent DB and shared in-memory queue
async function pushSystemNotification({
  tenantId = 'mak-tours',
  portal = 'admin',
  title,
  description,
  category = 'Driver Assignment',
  bookingId = null,
  driverName = null,
  priority = 'Normal',
  actionUrl = '/admin/bookings'
}) {
  const id = `NOTIF-${Date.now().toString().slice(-4)}`;
  const now = new Date();
  const timeFormatted = now.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
  const notif = {
    id,
    tenantId: tenantId ? String(tenantId).toLowerCase().trim() : 'mak-tours',
    portal,
    title,
    description,
    message: description,
    time: timeFormatted,
    timestamp: timeFormatted,
    category,
    priority,
    bookingId,
    driverName,
    isRead: false,
    unread: true,
    actionUrl,
    createdAt: now
  };
  try {
    await Notification.create(notif);
  } catch (err) {
    console.warn('[Notification] Persist warning:', err.message);
  }
  if (db && Array.isArray(db.notifications)) {
    db.notifications.unshift(notif);
  }
  return notif;
}

// Helper to enrich a booking with vehicle, driver, and calculation snapshots
async function enrichTripBooking(b) {
  if (!b) return null;
  const raw = b.toObject ? b.toObject() : { ...b };

  const startOdo = Number(raw.startOdometer) || 0;
  const endOdo = Number(raw.endOdometer) || 0;
  const dist = raw.distanceTravelled || raw.actualDistanceKm || (endOdo > startOdo ? endOdo - startOdo : 0);
  const rate = raw.vehicleRatePerKm || (raw.assignedVehicle && (raw.assignedVehicle.ratePerKm || raw.assignedVehicle.pricePerKm)) || 15;
  const vCharge = raw.vehicleTripCharge || (dist > 0 ? Math.round(dist * rate) : 0);
  const invNum = raw.invoiceNumber || (raw.invoice && raw.invoice.invoiceNumber) || (raw.refId ? `INV-${raw.refId}` : '');

  raw.distanceTravelled = dist;
  raw.actualDistanceKm = dist;
  raw.vehicleRatePerKm = rate;
  raw.vehicleTripCharge = vCharge;
  raw.invoiceNumber = invNum;

  return {
    ...raw,
    id: raw.refId || raw.bookingNumber || raw._id.toString(),
    bookingId: raw.refId || raw.bookingNumber || raw._id.toString(),
    bookingNumber: raw.refId || raw.bookingNumber || raw._id.toString(),
    customerName: raw.customerName || raw.fullName || 'Customer',
    customerPhone: raw.customerPhone || raw.mobileNumber || '',
    pickupLocation: raw.pickupLocation || raw.fromLocation || 'Depot',
    destination: raw.destination || raw.toLocation || raw.dropLocation || 'Destination',
    fare: raw.fare || raw.pricing || raw.totalFare || 0,
    driverAllowance: raw.driverCompensationAmount || Math.round((raw.pricing || raw.fare || 1500) * 0.15) || 1500,
    tripCategory: raw.bookingType || 'Round Trip'
  };
}

export const tripController = {
  /**
   * Fetch trip assignments awaiting chauffeur action or currently active
   */
  getAssignments: async (req, res, next) => {
    try {
      const { driverId } = req.query;
      const tenantQuery = req.tenantQuery || buildTenantQuery(req.tenantId || 'mak-tours');
      const query = {
        ...tenantQuery,
        tripStatus: { $ne: 'Completed' }
      };

      if (driverId) {
        query.$or = [{ driverId }, { assignedDriverId: driverId }];
      }

      const list = await Booking.find(query).sort({ createdAt: -1 }).lean();
      const formatted = await Promise.all(list.map((b) => enrichTripBooking(b)));

      return res.status(200).json({ status: 'success', count: formatted.length, data: formatted });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Fetch single trip details
   */
  getTrip: async (req, res, next) => {
    try {
      const { id } = req.params;
      const cleanId = String(id).replace(/^ASN-/, '');
      const tenantQuery = req.tenantQuery || buildTenantQuery(req.tenantId || 'mak-tours');

      const booking = await Booking.findOne({
        ...tenantQuery,
        $or: [{ refId: cleanId }, { bookingNumber: cleanId }, { _id: cleanId.match(/^[0-9a-fA-F]{24}$/) ? cleanId : null }]
      });

      if (!booking) {
        return res.status(404).json({ status: 'error', message: 'Trip not found' });
      }

      const enriched = await enrichTripBooking(booking);
      return res.status(200).json({ status: 'success', data: enriched });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Chauffeur accepts assigned trip
   */
  accept: async (req, res, next) => {
    try {
      const { id } = req.params;
      const cleanId = String(id).replace(/^ASN-/, '');
      const tenantQuery = req.tenantQuery || buildTenantQuery(req.tenantId || 'mak-tours');

      const existing = await Booking.findOne({
        ...tenantQuery,
        $or: [{ refId: cleanId }, { bookingNumber: cleanId }, { _id: cleanId.match(/^[0-9a-fA-F]{24}$/) ? cleanId : null }]
      });

      if (!existing) {
        return res.status(404).json({ status: 'error', message: 'Trip assignment not found' });
      }

      const tenantId = existing.tenantId || req.tenantId || 'mak-tours';

      // Prevent duplicate acceptance processing
      if (existing.driverAssignmentStatus === 'Accepted') {
        const alreadyEnriched = await enrichTripBooking(existing);
        return res.status(200).json({ status: 'success', message: 'Trip assignment already accepted', data: alreadyEnriched });
      }

      const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const driverName = existing.driverName || existing.assignedDriverName || (existing.assignedDriver && existing.assignedDriver.name) || 'Chauffeur';
      const driverId = existing.driverId || existing.assignedDriverId || (existing.assignedDriver && existing.assignedDriver.id);

      const timelineEntry = {
        id: `TL-ACC-${Date.now()}`,
        timestamp: nowTime,
        event: `Chauffeur Accepted Assignment (${driverName})`,
        actor: driverName,
        status: 'Accepted'
      };

      const updated = await Booking.findOneAndUpdate(
        { _id: existing._id, tenantId },
        {
          $set: {
            driverAssignmentStatus: 'Accepted',
            tripStatus: 'Driver Accepted',
            status: 'Confirmed',
            bookingStatus: 'Confirmed',
            driverAcceptedAt: new Date()
          },
          $push: { assignmentTimeline: timelineEntry }
        },
        { returnDocument: 'after' }
      );

      // Update Driver dutyStatus in Driver collection
      if (driverId) {
        await Driver.findOneAndUpdate(
          { tenantId, $or: [{ id: driverId }, { driverBadgeId: driverId }] },
          { $set: { dutyStatus: 'Assigned' } }
        );
      }

      // Notify Admin
      const bIdent = updated.bookingNumber || updated.refId || updated._id.toString();
      await pushSystemNotification({
        tenantId,
        portal: 'admin',
        title: `Driver Accepted Trip – ${bIdent}`,
        description: `Driver ${driverName} has ACCEPTED trip assignment for #${bIdent} (${updated.customerName || 'Passenger'}). Booking is now Confirmed on active roster.`,
        category: 'Driver Assignment',
        priority: 'High',
        bookingId: bIdent,
        driverName,
        actionUrl: `/admin/bookings/${bIdent}`
      });

      const enriched = await enrichTripBooking(updated);
      return res.status(200).json({ status: 'success', message: 'Trip assignment accepted successfully', data: enriched });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Chauffeur declines / rejects assigned trip
   */
  decline: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { reason, explanation } = req.body;
      const cleanId = String(id).replace(/^ASN-/, '');
      const tenantQuery = req.tenantQuery || buildTenantQuery(req.tenantId || 'mak-tours');

      const existing = await Booking.findOne({
        ...tenantQuery,
        $or: [{ refId: cleanId }, { bookingNumber: cleanId }, { _id: cleanId.match(/^[0-9a-fA-F]{24}$/) ? cleanId : null }]
      });

      if (!existing) {
        return res.status(404).json({ status: 'error', message: 'Trip assignment not found' });
      }

      const tenantId = existing.tenantId || req.tenantId || 'mak-tours';
      const fullReason = explanation ? `${reason}: ${explanation}` : (reason || 'Schedule conflict');
      const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const nowFormatted = new Date().toLocaleString();

      const dId = existing.driverId || existing.assignedDriverId || (existing.assignedDriver && existing.assignedDriver.id) || 'DRV';
      const dName = existing.driverName || existing.assignedDriverName || (existing.assignedDriver && existing.assignedDriver.name) || 'Chauffeur';

      const historyEntry = {
        driverId: dId,
        driverName: dName,
        assignedAt: existing.createdAt ? new Date(existing.createdAt).toLocaleString() : nowFormatted,
        declinedAt: nowFormatted,
        status: 'Declined',
        declineReason: fullReason
      };

      const timelineEntry = {
        id: `TL-DEC-${Date.now()}`,
        timestamp: nowTime,
        event: `Driver Declined (${dName}) – Reason: ${reason || 'Schedule conflict'}`,
        actor: dName,
        status: 'Declined'
      };

      const updated = await Booking.findOneAndUpdate(
        { _id: existing._id, tenantId },
        {
          $set: {
            driverId: '',
            driverName: '',
            driverPhone: '',
            assignedDriverId: '',
            assignedDriverName: '',
            assignedDriverPhone: '',
            assignedDriver: null,
            driverAssignmentStatus: 'Reassignment Required',
            tripStatus: 'Driver Declined',
            declineReason: fullReason,
            declineExplanation: explanation || '',
            declinedAt: new Date()
          },
          $push: {
            assignmentHistory: historyEntry,
            assignmentTimeline: timelineEntry
          }
        },
        { returnDocument: 'after' }
      );

      // Release driver in Driver collection if no other in-progress trips
      if (dId && dId !== 'DRV') {
        const otherActive = await Booking.findOne({
          ...buildTenantQuery(tenantId),
          _id: { $ne: existing._id },
          driverId: dId,
          tripStatus: 'In Progress'
        });
        if (!otherActive) {
          await Driver.findOneAndUpdate(
            { tenantId, $or: [{ id: dId }, { driverBadgeId: dId }] },
            { $set: { dutyStatus: 'Available' } }
          );
        }
      }

      // Notify Admin
      const bIdent = updated.bookingNumber || updated.refId || updated._id.toString();
      await pushSystemNotification({
        tenantId,
        portal: 'admin',
        title: `Driver Declined Trip – ${bIdent}`,
        description: `Driver ${dName} declined trip for #${bIdent}. Reason: ${fullReason}. Immediate chauffeur reassignment required.`,
        category: 'Driver Assignment',
        priority: 'High',
        bookingId: bIdent,
        driverName: dName,
        actionUrl: `/admin/bookings/${bIdent}`
      });

      const enriched = await enrichTripBooking(updated);
      return res.status(200).json({ status: 'success', message: 'Trip assignment declined. Returned for reassignment.', data: enriched });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Chauffeur arrives at pickup location
   */
  arrivedAtPickup: async (req, res, next) => {
    try {
      const { id } = req.params;
      const cleanId = String(id).replace(/^ASN-/, '');
      const tenantQuery = req.tenantQuery || buildTenantQuery(req.tenantId || 'mak-tours');

      const existing = await Booking.findOne({
        ...tenantQuery,
        $or: [{ refId: cleanId }, { bookingNumber: cleanId }, { _id: cleanId.match(/^[0-9a-fA-F]{24}$/) ? cleanId : null }]
      });

      if (!existing) {
        return res.status(404).json({ status: 'error', message: 'Trip not found' });
      }

      const tenantId = existing.tenantId || req.tenantId || 'mak-tours';
      const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const dName = existing.driverName || (existing.assignedDriver && existing.assignedDriver.name) || 'Chauffeur';

      const timelineEntry = {
        id: `TL-ARR-${Date.now()}`,
        timestamp: nowTime,
        event: `Chauffeur Arrived at Pickup Location (${dName})`,
        actor: dName,
        status: 'Arrived at Pickup'
      };

      const updated = await Booking.findOneAndUpdate(
        { _id: existing._id, tenantId },
        {
          $set: {
            tripStatus: 'Arrived at Pickup',
            arrivedAtPickupAt: new Date()
          },
          $push: { assignmentTimeline: timelineEntry }
        },
        { returnDocument: 'after' }
      );

      // Notify Admin
      const bIdent = updated.bookingNumber || updated.refId || updated._id.toString();
      await pushSystemNotification({
        tenantId,
        portal: 'admin',
        title: `Chauffeur Arrived at Pickup – ${bIdent}`,
        description: `Chauffeur ${dName} has reached pickup point (${updated.pickupLocation || 'depot'}) and reported ready for departure.`,
        category: 'Trip Status',
        priority: 'Normal',
        bookingId: bIdent,
        driverName: dName,
        actionUrl: `/admin/bookings/${bIdent}`
      });

      const enriched = await enrichTripBooking(updated);
      return res.status(200).json({ status: 'success', message: 'Status updated to Arrived at Pickup', data: enriched });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Start Trip with starting odometer reading
   */
  startTrip: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { startOdometer, remarks } = req.body;
      const cleanId = String(id).replace(/^ASN-/, '');
      const tenantQuery = req.tenantQuery || buildTenantQuery(req.tenantId || 'mak-tours');

      const existing = await Booking.findOne({
        ...tenantQuery,
        $or: [{ refId: cleanId }, { bookingNumber: cleanId }, { _id: cleanId.match(/^[0-9a-fA-F]{24}$/) ? cleanId : null }]
      });

      if (!existing) {
        return res.status(404).json({ status: 'error', message: 'Trip not found' });
      }

      const tenantId = existing.tenantId || req.tenantId || 'mak-tours';

      if (existing.tripStatus === 'Completed') {
        return res.status(400).json({ status: 'error', message: 'Trip is already completed and cannot be restarted.' });
      }

      if (existing.tripStatus === 'In Progress') {
        return res.status(400).json({ status: 'error', message: 'Trip is already in progress.' });
      }

      // Validate journey start date: driver/admin can start the trip on or after the journey start date
      const rawJDate = existing.travelDate || existing.journeyDate || existing.pickupDate;
      if (rawJDate && !req.body.overrideDateCheck) {
        let jDateStr = '';
        if (typeof rawJDate === 'string') {
          jDateStr = rawJDate.substring(0, 10);
        } else if (rawJDate instanceof Date) {
          jDateStr = rawJDate.toISOString().substring(0, 10);
        }
        const now = new Date();
        const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        if (jDateStr && todayStr < jDateStr) {
          const parts = jDateStr.split('-');
          const displayDate = parts.length === 3 ? `${parts[2]}-${parts[1]}-${parts[0]}` : jDateStr;
          return res.status(400).json({
            status: 'error',
            message: `Trip cannot be started prior to the journey start date (${displayDate}). Driver/Admin can start the trip on the journey start date.`
          });
        }
      }

      // Check vehicle current odometer within tenant
      const vId = existing.vehicleId || (existing.assignedVehicle && existing.assignedVehicle.id);
      let vehicleDoc = null;
      if (vId) {
        vehicleDoc = await Vehicle.findOne({
          ...buildTenantQuery(tenantId),
          $or: [{ id: vId }, { regNo: vId }, { numberPlate: vId }]
        });
      }
      const vehicleCurrentKm = (vehicleDoc && vehicleDoc.odometerKm) || 45000;

      let startOdo = Number(startOdometer);
      if (startOdometer === undefined || startOdometer === null || startOdometer === '' || isNaN(startOdo) || startOdo <= 0) {
        startOdo = vehicleCurrentKm;
      }

      if (startOdo < 0) {
        return res.status(400).json({ status: 'error', message: 'Starting odometer cannot be negative.' });
      }

      if (vehicleDoc && vehicleDoc.odometerKm && startOdo < vehicleDoc.odometerKm && !req.body.overrideOdometer && !req.body.isAdmin && !req.body.forceStart) {
        return res.status(400).json({
          status: 'error',
          message: `Starting odometer (${startOdo} km) cannot be less than vehicle's current odometer (${vehicleDoc.odometerKm} km).`
        });
      }

      const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const dName = existing.driverName || (existing.assignedDriver && existing.assignedDriver.name) || 'Driver';
      const dId = existing.driverId || (existing.assignedDriver && existing.assignedDriver.id);

      // Determine applicable vehicle per-km rate snapshot
      const rateSnapshot = existing.vehicleRatePerKm || (existing.assignedVehicle && (existing.assignedVehicle.ratePerKm || existing.assignedVehicle.pricePerKm)) || (vehicleDoc && (vehicleDoc.ratePerKm || vehicleDoc.pricePerKm)) || 15;

      const timelineEntry = {
        id: `TL-STR-${Date.now()}`,
        timestamp: nowTime,
        event: `Trip Started by ${dName} (Odometer: ${startOdo} km)`,
        actor: dName,
        status: 'In Progress'
      };

      const updated = await Booking.findOneAndUpdate(
        { _id: existing._id, tenantId },
        {
          $set: {
            tripStatus: 'In Progress',
            bookingStatus: 'On Trip',
            driverAssignmentStatus: 'Accepted',
            startOdometer: startOdo,
            tripStartedAt: new Date(),
            vehicleRatePerKm: rateSnapshot,
            notes: remarks || existing.notes || ''
          },
          $push: { assignmentTimeline: timelineEntry }
        },
        { returnDocument: 'after' }
      );

      // Update vehicle status & odometer
      if (vId) {
        await Vehicle.findOneAndUpdate(
          { tenantId, $or: [{ id: vId }, { regNo: vId }, { numberPlate: vId }] },
          { $set: { status: 'On Trip', odometerKm: startOdo } }
        );
      }

      // Update driver dutyStatus
      if (dId) {
        await Driver.findOneAndUpdate(
          { tenantId, $or: [{ id: dId }, { driverBadgeId: dId }] },
          { $set: { dutyStatus: 'On Trip' } }
        );
      }

      // Notify Admin
      const bIdent = updated.bookingNumber || updated.refId || updated._id.toString();
      await pushSystemNotification({
        tenantId,
        portal: 'admin',
        title: `Trip Started – ${bIdent}`,
        description: `Chauffeur ${dName} started journey for #${bIdent}. Vehicle: ${updated.vehicleName || 'Vehicle'}, Starting Odometer: ${startOdo} km.`,
        category: 'Trip Operations',
        priority: 'Normal',
        bookingId: bIdent,
        driverName: dName,
        actionUrl: `/admin/bookings/${bIdent}`
      });

      const enriched = await enrichTripBooking(updated);
      return res.status(200).json({ status: 'success', message: 'Trip started successfully', data: enriched });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Complete Trip with ending odometer reading, remarks, and automatic charge computation
   */
  completeTrip: async (req, res, next) => {
    try {
      const { id } = req.params;
      const {
        endOdometer,
        remarks,
        completionRemarks,
        tollAmount,
        fuelAmount
      } = req.body;
      const cleanId = String(id).replace(/^ASN-/, '');
      const tenantQuery = req.tenantQuery || buildTenantQuery(req.tenantId || 'mak-tours');

      const existing = await Booking.findOne({
        ...tenantQuery,
        $or: [{ refId: cleanId }, { bookingNumber: cleanId }, { _id: cleanId.match(/^[0-9a-fA-F]{24}$/) ? cleanId : null }]
      });

      if (!existing) {
        return res.status(404).json({ status: 'error', message: 'Trip not found' });
      }

      const tenantId = existing.tenantId || req.tenantId || 'mak-tours';

      if (existing.tripStatus === 'Completed') {
        const alreadyEnriched = await enrichTripBooking(existing);
        return res.status(200).json({ status: 'success', message: 'Trip is already completed', data: alreadyEnriched });
      }

      if (!['In Progress', 'Trip Started', 'Arrived at Pickup'].includes(existing.tripStatus)) {
        return res.status(400).json({
          status: 'error',
          message: 'Cannot complete a trip that is not currently in progress. Trip must be started first.'
        });
      }

      if (endOdometer === undefined || endOdometer === null || endOdometer === '' || isNaN(Number(endOdometer))) {
        return res.status(400).json({ status: 'error', message: 'A valid ending odometer reading is required.' });
      }

      const endOdo = Number(endOdometer);
      const startOdo = Number(existing.startOdometer) || 0;

      if (endOdo < startOdo) {
        return res.status(400).json({
          status: 'error',
          message: `Ending odometer (${endOdo} km) must be greater than or equal to starting odometer (${startOdo} km).`
        });
      }

      const distance = endOdo - startOdo;
      const rate = Number(existing.vehicleRatePerKm || (existing.assignedVehicle && (existing.assignedVehicle.ratePerKm || existing.assignedVehicle.pricePerKm)) || 15);
      const vehicleCharge = Math.round(distance * rate);

      const baseFare = Number(existing.totalAmount || existing.pricing || existing.fare || 0);
      const advPaid = Number(existing.advancePaid || 0);
      const balDue = Math.max(0, baseFare - advPaid);

      const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const nowFormatted = new Date().toLocaleString();
      const todayStr = new Date().toISOString().substring(0, 10);
      const bIdent = existing.bookingNumber || existing.refId || existing._id.toString();
      const invoiceNum = existing.invoiceNumber || `INV-${bIdent}`;

      const finalRemarks = remarks || completionRemarks || 'Trip concluded successfully. Passenger dropped safely.';

      // Structured Financial Invoice Snapshot
      const invoiceObj = {
        id: `INV-${bIdent}`,
        invoiceNumber: invoiceNum,
        bookingId: bIdent,
        bookingNumber: bIdent,
        customerName: existing.customerName || existing.fullName || 'Customer',
        customerPhone: existing.customerPhone || existing.mobileNumber || '',
        customerEmail: existing.customerEmail || existing.email || '',
        assignedVehicle: existing.vehicleName || 'Fleet Vehicle',
        vehicleRegNo: (existing.assignedVehicle && existing.assignedVehicle.regNo) || existing.vehicleId || 'N/A',
        assignedDriver: existing.driverName || 'Chauffeur',
        driverId: existing.driverId || 'DRV',
        startOdometer: startOdo,
        endOdometer: endOdo,
        totalKilometers: distance,
        distanceTravelled: distance,
        vehicleRatePerKm: rate,
        vehicleTripCharge: vehicleCharge,
        driverAllowance: existing.driverCompensationAmount || 1500,
        tollCharges: Number(tollAmount || 0),
        fuelReimbursements: Number(fuelAmount || 0),
        existingBookingCharges: baseFare,
        baseFare,
        totalAmount: baseFare,
        advancePaid: advPaid,
        remainingBalance: balDue,
        balanceDue: balDue,
        finalInvoiceTotal: baseFare,
        status: balDue === 0 ? 'Paid' : 'Partially Paid',
        issueDate: todayStr,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().substring(0, 10),
        items: [
          {
            id: 'ITEM-1',
            description: `${existing.bookingType || 'Round Trip'} – ${existing.pickupLocation || 'Chennai'} to ${existing.destination || 'Destination'} (${distance} km travelled)`,
            amount: baseFare
          }
        ]
      };

      const timelineEntry = {
        id: `TL-CMP-${Date.now()}`,
        timestamp: nowTime,
        event: `Trip Completed (Odometer: ${endOdo} km, Distance: ${distance} km, Vehicle Charge: ₹${vehicleCharge.toLocaleString('en-IN')})`,
        actor: existing.driverName || 'Driver',
        status: 'Completed'
      };

      const updated = await Booking.findOneAndUpdate(
        { _id: existing._id, tenantId },
        {
          $set: {
            tripStatus: 'Completed',
            bookingStatus: 'Completed',
            status: 'Completed',
            completedAt: new Date(),
            tripCompletedAt: nowFormatted,
            endOdometer: endOdo,
            distanceTravelled: distance,
            actualDistanceKm: distance,
            vehicleRatePerKm: rate,
            vehicleTripCharge: vehicleCharge,
            balanceAmount: balDue,
            balanceDue: balDue,
            tripRemarks: finalRemarks,
            invoiceNumber: invoiceNum,
            invoice: invoiceObj
          },
          $push: { assignmentTimeline: timelineEntry }
        },
        { returnDocument: 'after' }
      );

      // Release vehicle in Vehicle collection
      const vId = existing.vehicleId || (existing.assignedVehicle && existing.assignedVehicle.id);
      if (vId) {
        await Vehicle.findOneAndUpdate(
          { tenantId, $or: [{ id: vId }, { regNo: vId }, { numberPlate: vId }] },
          { $set: { status: 'Available', odometerKm: endOdo } }
        );
      }

      // Release driver in Driver collection & increment completed count
      const dId = existing.driverId || (existing.assignedDriver && existing.assignedDriver.id);
      if (dId) {
        await Driver.findOneAndUpdate(
          { tenantId, $or: [{ id: dId }, { driverBadgeId: dId }] },
          {
            $set: { dutyStatus: 'Available' },
            $inc: { totalTripsCompleted: 1 }
          }
        );
      }

      // Automatic Driver Attendance Integration (Tenant Scoped)
      const driverId = existing.driverId || existing.assignedDriverId;
      const driverName = existing.driverName || existing.assignedDriverName || 'Chauffeur';
      const tripDate = existing.travelDate || existing.pickupDate || todayStr;
      if (driverId) {
        try {
          const tripEntry = {
            tripId: bIdent,
            bookingNumber: bIdent,
            dutyDurationHours: 8,
            distanceKm: distance,
            pickupLocation: existing.pickupLocation || existing.fromLocation || '',
            dropLocation: existing.dropLocation || existing.toLocation || '',
            startTime: existing.pickupTime || '08:00 AM',
            endTime: nowTime,
            status: 'Completed',
            verified: true
          };

          const existingAtt = await Attendance.findOne({ tenantId, employeeId: driverId, date: tripDate });
          if (existingAtt) {
            const tripExists = (existingAtt.trips || []).some((t) => t.tripId === tripEntry.tripId);
            if (!tripExists) {
              existingAtt.trips = existingAtt.trips || [];
              existingAtt.trips.push(tripEntry);
            }
            existingAtt.status = 'Present – Trip';
            existingAtt.isDriverAttendance = true;
            existingAtt.driverId = driverId;
            existingAtt.checkOut = tripEntry.endTime;
            await existingAtt.save();
          } else {
            await Attendance.create({
              tenantId,
              employeeId: driverId,
              employeeCode: driverId,
              employeeName: driverName,
              date: tripDate,
              status: 'Present – Trip',
              checkIn: existing.pickupTime || '08:00 AM',
              checkOut: tripEntry.endTime,
              shift: 'Trip Operations Shift',
              department: 'Operations & Dispatch',
              role: 'Chauffeur',
              isDriverAttendance: true,
              driverId: driverId,
              trips: [tripEntry],
              remarks: `Automatically verified for trip #${bIdent}`
            });
          }
        } catch (attErr) {
          console.warn('Driver attendance auto-logging warning:', attErr.message);
        }
      }

      // Notify Admin
      await pushSystemNotification({
        tenantId,
        portal: 'admin',
        title: `Trip Completed – ${bIdent}`,
        description: `Trip concluded by ${driverName}. Distance: ${distance} km (Odo: ${startOdo} → ${endOdo}). Vehicle Charge: ₹${vehicleCharge}. Invoice #${invoiceNum} generated.`,
        category: 'Trip Operations',
        priority: 'Normal',
        bookingId: bIdent,
        driverName,
        actionUrl: `/admin/bookings/${bIdent}`
      });

      const enriched = await enrichTripBooking(updated);
      return res.status(200).json({ status: 'success', message: 'Trip completed successfully', data: enriched });
    } catch (err) {
      next(err);
    }
  },

  // Aliases for route handlers
  arrive: async (req, res, next) => tripController.arrivedAtPickup(req, res, next),
  start: async (req, res, next) => tripController.startTrip(req, res, next),
  end: async (req, res, next) => tripController.completeTrip(req, res, next)
};

export default tripController;
