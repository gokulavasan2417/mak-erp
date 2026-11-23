// MAK Tours & Travels ERP - Dispatch & Assignment Helper Utilities
// Implements Vehicle Priority Rule:
// 1. Company-Owned (MAK Owned) vehicles matching the requested car model are strictly PREFERRED.
// 2. Vendor Partner vehicles are secondary and should only be assigned if Company-Owned vehicles are unavailable (or if explicitly selected).
// 3. Driver Availability checks ensure no overlapping assignments or leave conflicts.

import { isVehicleAvailable, isDriverAvailable } from './dateUtils';

/**
 * Categorize and sort vehicles for a specific booking
 * @param {Object} booking - The booking requiring vehicle dispatch
 * @param {Array} vehicles - The fleet vehicles array
 * @param {Array} bookings - All existing bookings in the system
 * @returns {Object} Grouped vehicles, recommendation, and availability state
 */
export function getVehiclesForBooking(booking, vehicles = [], bookings = []) {
  if (!booking) {
    return {
      matchingCompanyOwnedAvailable: [],
      matchingCompanyOwnedUnavailable: [],
      matchingVendorAvailable: [],
      matchingVendorUnavailable: [],
      otherVehiclesAvailable: [],
      hasAvailableCompanyOwned: false,
      recommendedVehicleId: null,
      preferenceMessage: '',
      isCompanyOwnedAvailable: false
    };
  }

  const jDate = booking.journeyDate || booking.travelDate || booking.pickupDate;
  const rDate = booking.returnDate || booking.travelDate || booking.pickupDate || booking.journeyDate || jDate;

  // Determine requested vehicle keywords
  const rawModel = (booking.vehicleReserved || booking.vehicleName || booking.requestedVehicleModel || '').toLowerCase();
  
  // Extract key search terms (e.g., 'swift', 'innova', 'dzire', 'fortuner', 'crysta', 'hycross', 'tempo', 'traveller', 'ertiga')
  let keyword = '';
  if (rawModel.includes('innova hycross') || rawModel.includes('hycross')) keyword = 'hycross';
  else if (rawModel.includes('innova')) keyword = 'innova';
  else if (rawModel.includes('dzire')) keyword = 'dzire';
  else if (rawModel.includes('fortuner')) keyword = 'fortuner';
  else if (rawModel.includes('ertiga')) keyword = 'ertiga';
  else if (rawModel.includes('traveller') || rawModel.includes('tempo')) keyword = 'traveller';
  else if (rawModel.includes('urbania')) keyword = 'urbania';
  else if (rawModel.includes('etios')) keyword = 'etios';
  else if (rawModel.includes('swift')) keyword = 'swift';
  else if (rawModel.includes('i20')) keyword = 'i20';
  else if (rawModel.includes('xuv')) keyword = 'xuv';
  else if (rawModel.includes('amaze')) keyword = 'amaze';
  else if (rawModel.includes('carens')) keyword = 'carens';
  else if (rawModel.includes('mercedes') || rawModel.includes('e-class')) keyword = 'mercedes';

  const matchingCompanyOwnedAvailable = [];
  const matchingCompanyOwnedUnavailable = [];
  const matchingVendorAvailable = [];
  const matchingVendorUnavailable = [];
  const otherVehiclesAvailable = [];

  vehicles.forEach((veh) => {
    const isCompanyOwned = !veh.vendorId || veh.ownership === 'MAK Owned' || veh.ownership === 'Company Owned';
    
    // Check model match
    const vehText = `${veh.brand || ''} ${veh.model || ''} ${veh.name || ''} ${veh.category || ''}`.toLowerCase();
    const isModelMatch = keyword ? vehText.includes(keyword) : (rawModel ? vehText.includes(rawModel) : true);

    const availCheck = isVehicleAvailable(veh.id, jDate, rDate, vehicles, bookings, booking.id);
    const isAvail = availCheck.available;
    const item = {
      ...veh,
      isAvailable: isAvail,
      unavailabilityReason: availCheck.reason || '',
      isCompanyOwned
    };

    if (isModelMatch) {
      if (isCompanyOwned) {
        if (isAvail) matchingCompanyOwnedAvailable.push(item);
        else matchingCompanyOwnedUnavailable.push(item);
      } else {
        if (isAvail) matchingVendorAvailable.push(item);
        else matchingVendorUnavailable.push(item);
      }
    } else {
      if (isAvail) {
        otherVehiclesAvailable.push(item);
      }
    }
  });

  const hasAvailableCompanyOwned = matchingCompanyOwnedAvailable.length > 0;
  
  // Recommended Vehicle: Company Owned first, then Vendor Partner
  let recommendedVehicleId = null;
  let preferenceMessage = '';

  if (hasAvailableCompanyOwned) {
    recommendedVehicleId = matchingCompanyOwnedAvailable[0].id;
    preferenceMessage = `★ Preferred: ${matchingCompanyOwnedAvailable.length} Company-Owned vehicle(s) ready. Prioritize in-house fleet to maximize margin.`;
  } else if (matchingVendorAvailable.length > 0) {
    recommendedVehicleId = matchingVendorAvailable[0].id;
    preferenceMessage = `Notice: All company-owned matching vehicles are currently committed or on trip. An attached vendor partner vehicle (${matchingVendorAvailable[0].vendorName || 'Vendor Fleet'}) can be assigned.`;
  } else if (otherVehiclesAvailable.length > 0) {
    recommendedVehicleId = otherVehiclesAvailable[0].id;
    preferenceMessage = 'Notice: No exact model matches are available for these journey dates. You may assign an alternate fleet category.';
  } else {
    preferenceMessage = 'Warning: No fleet vehicles are available for the selected dates.';
  }

  return {
    matchingCompanyOwnedAvailable,
    matchingCompanyOwnedUnavailable,
    matchingVendorAvailable,
    matchingVendorUnavailable,
    otherVehiclesAvailable,
    hasAvailableCompanyOwned,
    recommendedVehicleId,
    preferenceMessage,
    isCompanyOwnedAvailable: hasAvailableCompanyOwned
  };
}

/**
 * Filter and categorize drivers for a booking's date range
 * @param {Object} booking - The booking requiring a driver
 * @param {Array} drivers - All drivers array
 * @param {Array} assignments - Active assignments
 * @param {Array} bookings - All bookings
 * @returns {Object} Available drivers, unavailable drivers, and recommended driver
 */
export function getDriversForBooking(booking, drivers = [], assignments = [], bookings = []) {
  if (!booking) {
    return { availableDrivers: [], unavailableDrivers: [], recommendedDriverId: null };
  }

  const jDate = booking.journeyDate || booking.travelDate || booking.pickupDate;
  const rDate = booking.returnDate || booking.travelDate || booking.pickupDate || booking.journeyDate || jDate;

  const availableDrivers = [];
  const unavailableDrivers = [];

  drivers.forEach((drv) => {
    const isDutyAvailable = drv.status === 'Active' && drv.dutyStatus !== 'On Leave' && drv.dutyStatus !== 'Suspended';
    const check = isDriverAvailable(drv.id, jDate, rDate, drivers, assignments, bookings, booking.id);
    const isAvail = isDutyAvailable && check.available;

    const item = {
      ...drv,
      isAvailable: isAvail,
      unavailabilityReason: !isDutyAvailable
        ? `Driver status: ${drv.dutyStatus || drv.status}`
        : check.reason || 'Committed on another assignment'
    };

    if (isAvail) {
      availableDrivers.push(item);
    } else {
      unavailableDrivers.push(item);
    }
  });

  const recommendedDriverId = availableDrivers.length > 0 ? availableDrivers[0].id : null;

  return {
    availableDrivers,
    unavailableDrivers,
    recommendedDriverId
  };
}
