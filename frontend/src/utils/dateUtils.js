// MAK Tours & Travels ERP - Date & Availability Utilities
// Robust date comparison and conflict checking for drivers and fleet vehicles

/**
 * Format any date or ISO string to standard dd-mm-yyyy format (e.g. 19-11-2026).
 * In the whole ERP this format (dd-mm-yyyy) must be strictly followed.
 * If withTime is true, appends 12-hour formatted time (e.g. 19-11-2026 10:27 AM).
 */
export function formatDateDMY(dateVal, withTime = false) {
  if (!dateVal) return '';
  try {
    let d;
    if (dateVal instanceof Date) {
      d = dateVal;
    } else if (typeof dateVal === 'string') {
      const trimmed = dateVal.trim();
      // If already DD-MM-YYYY or DD/MM/YYYY
      const dmyMatch = trimmed.match(/^(\d{2})[-/](\d{2})[-/](\d{4})/);
      if (dmyMatch) {
        const datePart = `${dmyMatch[1]}-${dmyMatch[2]}-${dmyMatch[3]}`;
        if (withTime && trimmed.includes(':')) {
          const tMatch = trimmed.match(/(\d{1,2}:\d{2}(?::\d{2})?(?:\s*[AaPp][Mm])?)/);
          if (tMatch) return `${datePart} ${tMatch[1]}`;
        }
        return datePart;
      }
      // If YYYY-MM-DD
      const ymdMatch = trimmed.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
      if (ymdMatch) {
        const year = ymdMatch[1];
        const month = String(ymdMatch[2]).padStart(2, '0');
        const day = String(ymdMatch[3]).padStart(2, '0');
        const datePart = `${day}-${month}-${year}`;
        if (withTime && (trimmed.includes(':') || trimmed.includes('T'))) {
          const tMatch = trimmed.match(/(\d{1,2}:\d{2}(?::\d{2})?(?:\s*[AaPp][Mm])?)/);
          if (tMatch) return `${datePart} ${tMatch[1]}`;
          // Fallback to Date object time
          const dt = new Date(trimmed);
          if (!isNaN(dt.getTime())) {
            let h = dt.getHours();
            const m = String(dt.getMinutes()).padStart(2, '0');
            const ampm = h >= 12 ? 'PM' : 'AM';
            h = h % 12 || 12;
            return `${datePart} ${String(h).padStart(2, '0')}:${m} ${ampm}`;
          }
        }
        return datePart;
      }
      d = new Date(trimmed);
    } else if (typeof dateVal === 'number') {
      d = new Date(dateVal);
    }

    if (!d || isNaN(d.getTime())) return String(dateVal);

    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const datePart = `${day}-${month}-${year}`;

    if (withTime) {
      let hours = d.getHours();
      const minutes = String(d.getMinutes()).padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12;
      return `${datePart} ${hours}:${minutes} ${ampm}`;
    }

    return datePart;
  } catch {
    return String(dateVal);
  }
}

export const formatDate = formatDateDMY;

/**
 * Check if a key or value represents a date that should be rendered as DD-MM-YYYY
 */
export function isDateLike(key = '', val = '') {
  if (val === null || val === undefined || typeof val === 'boolean' || typeof val === 'number') return false;
  if (typeof val !== 'string') return false;
  const str = val.trim();
  if (!str) return false;
  // If pure number string or currency or booking/voucher code
  if (/^[A-Z0-9_\-\s]{1,4}$/.test(str)) return false;
  if (/^\d+(\.\d+)?$/.test(str)) return false;

  // Match YYYY-MM-DD or DD-MM-YYYY
  if (/^\d{4}[-/]\d{1,2}[-/]\d{1,2}/.test(str)) return true;
  if (/^\d{1,2}[-/]\d{1,2}[-/]\d{4}/.test(str)) return true;

  const dateKeyPattern = /(date|time|created|updated|period|pickup|drop|journey|dispatch|arrival|start|end)/i;
  if (dateKeyPattern.test(key)) {
    const d = new Date(str);
    return !isNaN(d.getTime());
  }
  return false;
}

export function normalizeDate(dateVal) {
  if (!dateVal) return '';
  if (typeof dateVal === 'string') {
    const trimmed = dateVal.trim();
    // If it's already YYYY-MM-DD or starts with it
    if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
      return trimmed.substring(0, 10);
    }
    // If DD-MM-YYYY or DD/MM/YYYY
    const dmy = trimmed.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
    if (dmy) {
      const d = String(dmy[1]).padStart(2, '0');
      const m = String(dmy[2]).padStart(2, '0');
      const y = dmy[3];
      return `${y}-${m}-${d}`;
    }
    const d = new Date(trimmed);
    if (!isNaN(d.getTime())) {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    }
    return trimmed;
  }
  if (dateVal instanceof Date && !isNaN(dateVal.getTime())) {
    const y = dateVal.getFullYear();
    const m = String(dateVal.getMonth() + 1).padStart(2, '0');
    const day = String(dateVal.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
  return '';
}

/**
 * Check if a booking is associated with today (created today, journey date today, or started/completed today).
 */
export function isBookingToday(b) {
  if (!b) return false;
  const todayYMD = normalizeDate(new Date());

  const check = (val) => {
    if (!val) return false;
    return normalizeDate(val) === todayYMD;
  };

  return (
    check(b.createdAt) ||
    check(b.journeyDate) ||
    check(b.travelDate) ||
    check(b.pickupDate) ||
    check(b.startDate) ||
    check(b.date) ||
    check(b.tripStartedAt) ||
    check(b.completedAt)
  );
}

/**
 * Check if a booking is active (on trip / in progress).
 */
export function isBookingActive(b) {
  if (!b) return false;
  const bStatus = (b.bookingStatus || b.status || '').trim().toLowerCase();
  const tStatus = (b.tripStatus || '').trim().toLowerCase();
  return (
    bStatus === 'on trip' ||
    bStatus === 'in progress' ||
    tStatus === 'in progress' ||
    tStatus === 'on trip' ||
    tStatus === 'in transit'
  );
}

/**
 * Check if a booking is completed.
 */
export function isBookingCompleted(b) {
  if (!b) return false;
  const bStatus = (b.bookingStatus || b.status || '').trim().toLowerCase();
  const tStatus = (b.tripStatus || '').trim().toLowerCase();
  return (
    bStatus === 'completed' ||
    bStatus === 'concluded' ||
    tStatus === 'completed' ||
    tStatus === 'trip completed'
  );
}

/**
 * Check if a booking is upcoming.
 */
export function isBookingUpcoming(b) {
  if (!b) return false;
  const bStatus = (b.bookingStatus || b.status || '').trim().toLowerCase();
  const tStatus = (b.tripStatus || '').trim().toLowerCase();
  const isCancelled = bStatus.includes('cancel') || tStatus.includes('cancel');
  if (isCancelled || isBookingCompleted(b) || isBookingActive(b)) return false;

  const todayYMD = normalizeDate(new Date());
  const jDate = normalizeDate(b.journeyDate || b.travelDate || b.pickupDate || b.startDate);
  
  if (jDate && jDate > todayYMD) return true;

  return (
    bStatus === 'confirmed' ||
    bStatus === 'pending' ||
    tStatus === 'upcoming' ||
    tStatus.includes('awaiting') ||
    tStatus.includes('accepted') ||
    tStatus.includes('assigned')
  );
}

/**
 * Check if two date ranges [startA, endA] and [startB, endB] overlap inclusive.
 */
export function datesOverlap(startA, endA, startB, endB) {
  const sA = normalizeDate(startA);
  const eA = normalizeDate(endA || startA);
  const sB = normalizeDate(startB);
  const eB = normalizeDate(endB || startB);

  if (!sA || !sB) return false;
  return sA <= eB && sB <= eA;
}

/**
 * Calculate the number of days between two dates inclusive.
 * Minimum 1 day.
 */
export function getDaysBetween(startDate, endDate) {
  const s = normalizeDate(startDate);
  const e = normalizeDate(endDate || startDate);
  if (!s || !e) return 1;
  const d1 = new Date(s);
  const d2 = new Date(e);
  const diffTime = d2.getTime() - d1.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  return Math.max(1, isNaN(diffDays) ? 1 : diffDays);
}

/**
 * Check if a leave record belongs to a given driver (matches ID, driverBadge, driverCode, or name).
 */
export function isSameDriver(leave, driverOrId) {
  if (!leave || !driverOrId) return false;

  const dObj = typeof driverOrId === 'object' ? driverOrId : { id: driverOrId };
  const dIds = [
    dObj.id,
    dObj.driverId,
    dObj.driverBadgeId,
    dObj.badgeId,
    dObj._id,
    typeof driverOrId === 'string' ? driverOrId : null
  ]
    .filter(Boolean)
    .map((v) => String(v).trim().toLowerCase());

  const lIds = [
    leave.driverId,
    leave.driverBadge,
    leave.driverBadgeId,
    leave.driverCode,
    leave.empId
  ]
    .filter(Boolean)
    .map((v) => String(v).trim().toLowerCase());

  // Check ID matching
  for (const did of dIds) {
    for (const lid of lIds) {
      if (did === lid || did.includes(lid) || lid.includes(did)) {
        return true;
      }
    }
  }

  // Check Name matching (e.g. Murugan / Murugan S)
  const dNames = [dObj.name, dObj.fullName].filter(Boolean).map((v) => String(v).trim().toLowerCase());
  const lNames = [leave.driverName, leave.name, leave.fullName].filter(Boolean).map((v) => String(v).trim().toLowerCase());

  for (const dn of dNames) {
    for (const ln of lNames) {
      if (dn === ln || dn.includes(ln) || ln.includes(dn)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Check if a driver has an active, applied, or approved leave conflict for a date range.
 * Returns the conflict details object if conflicting, or null if available.
 */
export function getDriverLeaveConflict(driverOrId, startDate, endDate, driverLeaves = []) {
  if (!driverOrId || !startDate) return null;
  const s = normalizeDate(startDate);
  const e = normalizeDate(endDate || startDate);
  if (!s) return null;

  let list = Array.isArray(driverLeaves) && driverLeaves.length > 0 ? driverLeaves : [];
  if (list.length === 0 && typeof window !== 'undefined' && window.localStorage) {
    try {
      const raw =
        localStorage.getItem('mak_driver_leaves_v10_atlas') ||
        localStorage.getItem('mak_driver_leaves_v7');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) list = parsed;
      }
    } catch {
      // fallback if storage unavailable
    }
  }

  for (const l of list) {
    if (!l) continue;
    // Cancelled or rejected leaves do not block duty
    const status = String(l.status || '').trim();
    const isCancelled = status.toLowerCase().includes('cancel') || status.toLowerCase().includes('reject');
    if (isCancelled) continue;

    if (!isSameDriver(l, driverOrId)) continue;

    const lStart = normalizeDate(l.approvedStartDate || l.startDate);
    const lEnd = normalizeDate(l.approvedEndDate || l.endDate || l.approvedStartDate || l.startDate);
    if (!lStart) continue;

    if (datesOverlap(s, e, lStart, lEnd)) {
      const isApproved = status.toLowerCase() === 'approved';
      return {
        onLeave: true,
        leaveId: l.id,
        status: l.status || (isApproved ? 'Approved' : 'Under Review'),
        startDate: lStart,
        endDate: lEnd,
        reason: l.reason || 'Personal Reason',
        approvedDays: l.approvedDays || l.totalDays || 1,
        description: isApproved
          ? `Driver is ON LEAVE from ${formatDateDMY(lStart)} to ${formatDateDMY(lEnd)} (${l.reason || 'Approved Planned Leave'})`
          : `Driver applied LEAVE for ${formatDateDMY(lStart)} to ${formatDateDMY(lEnd)} (${l.reason || 'Leave Under Review'})`
      };
    }
  }

  return null;
}

/**
 * Find conflicting assignments, bookings, or approved leaves for a driver in a date range.
 */
export function getDriverConflicts(driverId, startDate, endDate, assignments = [], bookings = [], excludeBookingId = null, driverLeaves = []) {
  if (!driverId || !startDate) return [];
  const s = normalizeDate(startDate);
  const e = normalizeDate(endDate || startDate);

  const conflicts = [];

  // Check planned / approved leave
  const leaveConflict = getDriverLeaveConflict(driverId, startDate, endDate, driverLeaves);
  if (leaveConflict) {
    conflicts.push({
      source: 'Leave',
      id: leaveConflict.leaveId,
      status: leaveConflict.status,
      startDate: leaveConflict.startDate,
      endDate: leaveConflict.endDate,
      description: leaveConflict.description
    });
  }

  // Check assignments
  if (Array.isArray(assignments)) {
    assignments.forEach((asn) => {
      if (asn.driverId === driverId && asn.bookingId !== excludeBookingId) {
        // Active statuses: Assigned, Accepted, In Progress
        if (['Assigned', 'Accepted', 'In Progress'].includes(asn.status)) {
          const aStart = asn.pickupDate || asn.startDate || asn.journeyDate;
          const aEnd = asn.returnDate || asn.endDate || aStart;
          if (datesOverlap(s, e, aStart, aEnd)) {
            conflicts.push({
              source: 'Assignment',
              id: asn.id,
              bookingId: asn.bookingId,
              status: asn.status,
              startDate: aStart,
              endDate: aEnd,
              description: `Assignment ${asn.id} (${aStart} to ${aEnd})`
            });
          }
        }
      }
    });
  }

  // Check bookings directly (to catch cases where assignment may not be synced yet)
  if (Array.isArray(bookings)) {
    bookings.forEach((b) => {
      if (b.driverId === driverId && b.id !== excludeBookingId) {
        if (!['Cancelled', 'Completed'].includes(b.bookingStatus)) {
          if (datesOverlap(s, e, b.journeyDate, b.returnDate)) {
            // Avoid duplicate if already caught via assignment
            if (!conflicts.some((c) => c.bookingId === b.id)) {
              conflicts.push({
                source: 'Booking',
                id: b.id,
                bookingId: b.id,
                status: b.bookingStatus,
                startDate: b.journeyDate,
                endDate: b.returnDate,
                description: `Booking ${b.bookingNumber || b.id} (${b.journeyDate} to ${b.returnDate || b.journeyDate})`
              });
            }
          }
        }
      }
    });
  }

  return conflicts;
}

/**
 * Check if a driver is available for a date range.
 * Considers approval status, active status, duty status, date conflicts, and planned leaves.
 */
export function isDriverAvailable(driverId, startDate, endDate, drivers = [], assignments = [], bookings = [], excludeBookingId = null, driverLeaves = []) {
  if (!driverId) return { available: false, reason: 'No driver specified' };

  const driver = drivers.find((d) => d.id === driverId || d.driverId === driverId || d.driverBadgeId === driverId || d._id === driverId);
  const targetDriver = driver || (typeof driverId === 'object' ? driverId : { id: driverId });

  // 1. Check approval and active status
  if (targetDriver.approvalStatus && targetDriver.approvalStatus !== 'Approved') {
    return { available: false, reason: `Driver application status is "${targetDriver.approvalStatus}" (Requires Approved)` };
  }
  if (targetDriver.status && targetDriver.status !== 'Active' && targetDriver.status !== 'Available') {
    return { available: false, reason: `Driver status is "${targetDriver.status}" (Requires Active)` };
  }

  // 2. Check planned / approved leave for this date range
  const leaveConflict = getDriverLeaveConflict(targetDriver, startDate, endDate, driverLeaves);
  if (leaveConflict) {
    return {
      available: false,
      onLeave: true,
      reason: `Driver is on leave for the requested journey date (${leaveConflict.description})`,
      leaveConflict,
      conflicts: [
        {
          source: 'Leave',
          id: leaveConflict.leaveId,
          status: leaveConflict.status,
          startDate: leaveConflict.startDate,
          endDate: leaveConflict.endDate,
          description: leaveConflict.description
        }
      ]
    };
  }

  // 3. Check current duty status if journey starts today
  const todayYMD = normalizeDate(new Date());
  const s = normalizeDate(startDate);
  if (s === todayYMD && ['On Leave', 'Suspended', 'Unavailable'].includes(targetDriver.dutyStatus)) {
    return { available: false, reason: `Driver is currently ${targetDriver.dutyStatus}` };
  }

  // 4. Check schedule conflicts
  const conflicts = getDriverConflicts(driverId, startDate, endDate, assignments, bookings, excludeBookingId, driverLeaves);
  if (conflicts.length > 0) {
    return {
      available: false,
      reason: `Schedule conflict: Driver already allocated to ${conflicts[0].description}`,
      conflicts
    };
  }

  return { available: true };
}

/**
 * Find conflicting reservations for a vehicle in a date range.
 */
export function getVehicleConflicts(vehicleId, startDate, endDate, bookings = [], excludeBookingId = null) {
  if (!vehicleId || !startDate) return [];
  const s = normalizeDate(startDate);
  const e = normalizeDate(endDate || startDate);

  const conflicts = [];

  if (Array.isArray(bookings)) {
    bookings.forEach((b) => {
      if (b.id !== excludeBookingId) {
        const matchesVehicle = b.vehicleId === vehicleId || (b.assignedVehicle && b.assignedVehicle.id === vehicleId);
        if (matchesVehicle) {
          // If record has pickupDate/startDate (assignment schema)
          if (b.pickupDate || b.startDate) {
            const aStart = b.pickupDate || b.startDate;
            const aEnd = b.returnDate || b.endDate || aStart;
            const aStatus = b.status || b.bookingStatus || 'Active';
            if (!['Cancelled', 'Completed', 'Declined', 'Reassigned'].includes(aStatus)) {
              if (datesOverlap(s, e, aStart, aEnd)) {
                conflicts.push({
                  source: 'Reservation',
                  id: b.id,
                  bookingId: b.bookingId || b.id,
                  status: aStatus,
                  startDate: aStart,
                  endDate: aEnd,
                  description: `Reservation ${b.id} (${aStart} to ${aEnd})`
                });
              }
            }
          } else {
            // Standard booking schema
            if (!['Cancelled', 'Completed'].includes(b.bookingStatus)) {
              const bStart = b.journeyDate || b.pickupDate;
              const bEnd = b.returnDate || bStart;
              if (datesOverlap(s, e, bStart, bEnd)) {
                conflicts.push({
                  source: 'Booking',
                  id: b.id,
                  bookingId: b.id,
                  bookingNumber: b.bookingNumber || b.id,
                  status: b.bookingStatus,
                  startDate: bStart,
                  endDate: bEnd,
                  description: `Booking ${b.bookingNumber || b.id} (${bStart} to ${bEnd})`
                });
              }
            }
          }
        }
      }
    });
  }

  return conflicts;
}

/**
 * Check if a vehicle is available for a date range.
 * Considers maintenance/status and booking schedule conflicts.
 */
export function isVehicleAvailable(vehicleId, startDate, endDate, vehicles = [], bookings = [], excludeBookingId = null) {
  if (!vehicleId) return { available: false, reason: 'No vehicle specified' };

  const vehicle = vehicles.find((v) => v.id === vehicleId);
  if (!vehicle) {
    return { available: false, reason: 'Vehicle record not found' };
  }

  // Maintenance and breakdown checks
  if (['Maintenance', 'Unavailable', 'Under Maintenance', 'Breakdown'].includes(vehicle.status)) {
    return { available: false, reason: `Vehicle is currently marked as "${vehicle.status}"` };
  }

  // Schedule conflicts
  const conflicts = getVehicleConflicts(vehicleId, startDate, endDate, bookings, excludeBookingId);
  if (conflicts.length > 0) {
    return {
      available: false,
      reason: `Schedule conflict: Vehicle already reserved for ${conflicts[0].description}`,
      conflicts
    };
  }

  return { available: true };
}

/**
 * Calculate the exact number of days in a given month (31, 30, 28, or 29 days).
 * @param {number|string} year - Full year (e.g. 2026)
 * @param {number|string} month - Month (1-12 or 0-11 if isZeroIndexed is true)
 * @param {boolean} isZeroIndexed - Whether month parameter is 0-indexed (Jan=0)
 * @returns {number} 28, 29, 30, or 31
 */
export function getDaysInMonth(year = 2026, month = 11, isZeroIndexed = false) {
  const y = parseInt(year, 10) || 2026;
  const m = isZeroIndexed ? parseInt(month, 10) + 1 : parseInt(month, 10) || 11;
  return new Date(y, m, 0).getDate();
}

/**
 * Returns comprehensive month details including calendar days, month name, and leap year detection.
 */
export function getMonthDaysInfo(monthStrOrDate) {
  let y = 2026;
  let m = 11;
  if (typeof monthStrOrDate === 'string' && monthStrOrDate.includes('-')) {
    const parts = monthStrOrDate.split('-');
    y = parseInt(parts[0], 10) || 2026;
    m = parseInt(parts[1], 10) || 11;
  } else if (monthStrOrDate instanceof Date) {
    y = monthStrOrDate.getFullYear();
    m = monthStrOrDate.getMonth() + 1;
  }
  const totalDays = new Date(y, m, 0).getDate();
  const monthName = new Date(y, m - 1, 1).toLocaleDateString('en-IN', { month: 'long' });
  const isLeapYear = (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;

  return {
    year: y,
    month: m,
    totalDays, // 30, 31, 28, or 29 days
    monthName,
    isLeapYear,
    label: `${monthName} ${y}`
  };
}
