// MAK Tours & Travels ERP - Centralized Driver Trip Earnings & Allowance Engine
// Reused identically across Payroll and Driver Settlement Accounting
import { isNightShift } from '../utils/dateUtils.js';

/**
 * Calculate Driver Trip Allowances & Earnings
 * Strictly adheres to company payroll policy & driver allowance rules
 *
 * @param {Object} options
 * @param {Array} options.trips - Completed bookings / trips
 * @param {Set|Array|string} options.driverCodes - Target driver identifier(s)
 * @param {Object} options.policy - Active PayrollPolicy document
 * @param {Object} options.allowanceConfig - Driver-specific allowance overrides (optional)
 * @returns {Object} Structured breakdown of allowances & total earnings
 */
export function calculateDriverTripAllowances({ trips = [], driverCodes = [], policy = {}, allowanceConfig = {} }) {
  let perTripAllowanceTotal = 0;
  let nightAllowanceTotal = 0;
  let longDistanceAllowanceTotal = 0;
  let overnightAllowanceTotal = 0;
  let extraDutyAllowanceTotal = 0;

  const perTripRate = allowanceConfig?.perTripAllowance ?? policy.driverAllowanceRules?.perTripAllowance ?? 300;
  const nightRate = allowanceConfig?.nightAllowance ?? policy.driverAllowanceRules?.nightAllowance ?? 250;
  const longDistRate = allowanceConfig?.longDistanceAllowance ?? policy.driverAllowanceRules?.longDistanceAllowance ?? 400;
  const overnightRate = allowanceConfig?.overnightAllowance ?? policy.driverAllowanceRules?.overnightAllowance ?? 500;
  const distThreshold = policy.driverAllowanceRules?.longDistanceThresholdKm ?? 250;

  const targetCodes = driverCodes instanceof Set
    ? driverCodes
    : new Set((Array.isArray(driverCodes) ? driverCodes : [driverCodes]).map((c) => String(c || '').toLowerCase().trim()).filter(Boolean));

  const driverTrips = trips.filter((t) => {
    const tDrvId = String(t.driverId || '').toLowerCase().trim();
    const tAssignedDrv = String(t.assignedDriverId || '').toLowerCase().trim();
    return (tDrvId && targetCodes.has(tDrvId)) || (tAssignedDrv && targetCodes.has(tAssignedDrv));
  });

  const tripBreakdown = driverTrips.map((tr) => {
    const dist = Number(tr.actualDistanceKm || tr.distanceTravelled || 0);
    const isNight = isNightShift(
      tr.pickupTime || tr.journeyTime,
      policy.nightShiftStart || '22:00',
      policy.nightShiftEnd || '06:00'
    );
    const isOvernight = (tr.bookingType && tr.bookingType.includes('Tour Package')) || dist > 400;

    let trAllowances = perTripRate;
    perTripAllowanceTotal += perTripRate;

    if (isNight) {
      nightAllowanceTotal += nightRate;
      trAllowances += nightRate;
    }
    if (dist >= distThreshold) {
      longDistanceAllowanceTotal += longDistRate;
      trAllowances += longDistRate;
    }
    if (isOvernight) {
      overnightAllowanceTotal += overnightRate;
      trAllowances += overnightRate;
    }

    return {
      tripId: tr.id || tr.bookingNumber || tr.refId,
      bookingRef: tr.bookingNumber || tr.refId,
      date: tr.travelDate || tr.pickupDate || tr.journeyDate,
      pickupTime: tr.pickupTime || tr.journeyTime || '',
      distanceKm: dist,
      isNightDuty: isNight,
      isOvernightDuty: isOvernight,
      allowanceAmount: trAllowances
    };
  });

  const totalDriverAllowances =
    perTripAllowanceTotal +
    nightAllowanceTotal +
    longDistanceAllowanceTotal +
    overnightAllowanceTotal +
    extraDutyAllowanceTotal;

  return {
    trips: tripBreakdown,
    tripCount: tripBreakdown.length,
    perTripAllowanceTotal,
    nightAllowanceTotal,
    longDistanceAllowanceTotal,
    overnightAllowanceTotal,
    extraDutyAllowanceTotal,
    totalDriverAllowances
  };
}

export default {
  calculateDriverTripAllowances
};