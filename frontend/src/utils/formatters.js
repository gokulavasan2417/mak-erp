// Utility formatters for MAK Tours & Travels ERP

export function formatCurrency(amount) {
  if (typeof amount === 'number') {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  }
  return amount;
}

export function getStatusVariant(status) {
  const normalized = String(status).toLowerCase();
  if (['active', 'confirmed', 'completed', 'paid', 'verified', 'success'].includes(normalized)) {
    return 'success';
  }
  if (['in progress', 'in-transit', 'on-trip', 'pending', 'pending approval', 'warning'].includes(normalized)) {
    return 'warning';
  }
  if (['cancelled', 'suspended', 'rejected', 'failed', 'danger'].includes(normalized)) {
    return 'danger';
  }
  if (['dispatched', 'scheduled', 'standby', 'info'].includes(normalized)) {
    return 'info';
  }
  return 'neutral';
}

/**
 * Calculate or estimate the distance in KM for any booking or trip record.
 * Checks explicit distance properties, odometer differences, route text, and fare/rate estimates.
 * @param {Object} b - The booking or trip object
 * @returns {number} The distance in kilometers (integer)
 */
export function calculateBookingKm(b) {
  if (!b) return 0;

  // 1. Explicit distance properties
  const directKm = Number(
    b.distanceKm ||
    b.actualDistanceKm ||
    b.distanceTravelled ||
    b.distance ||
    b.km ||
    b.totalKm ||
    b.estimatedDistance
  );
  if (!isNaN(directKm) && directKm > 0) return Math.round(directKm);

  // 2. Odometer difference if available
  if (b.endOdometer && b.startOdometer && Number(b.endOdometer) > Number(b.startOdometer)) {
    return Math.round(Number(b.endOdometer) - Number(b.startOdometer));
  }

  // 3. Extract km pattern like "[150 km]" or "150 km" or "150km" from route/details
  const combinedText = `${b.description || ''} ${b.destination || ''} ${b.toLocation || ''} ${b.dropLocation || ''} ${b.pickupLocation || ''} ${b.fromLocation || ''} ${b.packageName || ''} ${b.tripNotes || ''} ${b.tripRemarks || ''}`;
  const kmMatch = combinedText.match(/(?:\[|\()?\s*(\d+(?:\.\d+)?)\s*(?:km|kms|kilometers)\s*(?:\]|\))?/i);
  if (kmMatch && parseFloat(kmMatch[1]) > 0) {
    return Math.round(parseFloat(kmMatch[1]));
  }

  // 4. Derive from fare / vehicle rate per km if available
  const fare = Number(b.totalAmount || b.pricing || b.totalFare || b.fare || b.baseTripPay || 0);
  const rate = Number(b.vehicleRatePerKm || b.ratePerKm || b.vehicle?.ratePerKm || b.assignedVehicle?.ratePerKm || 18);
  if (fare > 0 && rate > 0) {
    const derived = Math.round(fare / rate);
    if (derived >= 40) return derived;
  }

  // 5. Fallback based on category & duration
  const days = Math.max(1, parseInt(b.durationDays || b.daysCount || b.days || 1, 10));
  const category = String(b.bookingCategory || b.tripCategory || b.category || b.tripType || '').toLowerCase();
  if (category.includes('airport')) return 50;
  if (category.includes('local')) return days * 80;
  if (category.includes('tour') || category.includes('package')) return days * 250;
  return days * 250; // Standard commercial outstation / round trip minimum
}
