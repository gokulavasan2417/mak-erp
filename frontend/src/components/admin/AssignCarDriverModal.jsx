// MAK Tours & Travels ERP - Unified Car & Driver Dispatch Assignment Modal
// Implements Statutory Vehicle Allocation Logic:
// 1. Company-Owned (MAK Owned) vehicles matching the requested car model are PREFERRED.
// 2. Vendor Partner vehicles are secondary and available when company-owned vehicles are unavailable.
// 3. Both Car and Driver selections are presented as structured, validated dropdowns.

import React, { useState, useEffect, useMemo } from 'react';
import {
  Car,
  UserCheck,
  Calendar,
  Clock,
  Shield,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  Info,
  Check,
  Building,
  Star,
  Phone,
  Send,
  ArrowRight,
  IndianRupee,
  Smartphone,
  Bell
} from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { useAdminData } from '../../context/AdminDataContext';
import { useToast } from '../../context/ToastContext';
import { getVehiclesForBooking, getDriversForBooking } from '../../utils/assignmentUtils';
import { getDriverLeaveConflict, formatDateDMY } from '../../utils/dateUtils';

export function AssignCarDriverModal({
  isOpen,
  onClose,
  booking,
  onSuccess
}) {
  const toast = useToast();
  const {
    vehicles = [],
    drivers = [],
    bookings = [],
    vendors = [],
    driverLeaves = [],
    driverLeaveRequests = [],
    confirmTripAssignment,
    assignOutstationTripToVendor,
    assignVehicle,
    settings
  } = useAdminData();
  const allDriverLeaves = driverLeaves.length > 0 ? driverLeaves : driverLeaveRequests;

  const safeBooking = useMemo(() => {
    if (!booking) return null;
    const pLoc = typeof booking.pickupLocation === 'string' && booking.pickupLocation.trim()
      ? booking.pickupLocation
      : (typeof booking.fromLocation === 'string' && booking.fromLocation.trim() ? booking.fromLocation : 'Chennai, Tamil Nadu');
    const dLoc = typeof booking.destination === 'string' && booking.destination.trim()
      ? booking.destination
      : (typeof booking.toLocation === 'string' && booking.toLocation.trim() ? booking.toLocation : (typeof booking.dropLocation === 'string' && booking.dropLocation.trim() ? booking.dropLocation : 'Pondicherry Promenade'));
    const jDate = (booking.journeyDate || booking.travelDate || booking.pickupDate || '').trim() || new Date().toISOString().substring(0, 10);
    const rDate = (booking.returnDate || booking.travelDate || booking.pickupDate || booking.journeyDate || '').trim() || jDate;
    const jTime = (booking.journeyTime || booking.pickupTime || '').trim() || '07:00 AM';
    const totalAmt = Number(booking.totalAmount || booking.pricing || booking.totalFare || booking.fare || 0) || Number(booking.advancePaid || 2500);
    const id = booking.id || booking.bookingNumber || booking.refId || booking._id;
    return {
      ...booking,
      id,
      bookingNumber: booking.bookingNumber || booking.refId || id,
      journeyDate: jDate,
      returnDate: rDate,
      journeyTime: jTime,
      totalAmount: totalAmt,
      pickupLocation: pLoc,
      destination: dLoc,
      vehicleReserved: booking.vehicleReserved || booking.vehicleName || 'Standard Fleet Cab',
      passengerCount: booking.passengerCount || booking.passengers || 4,
      bookingCategory: booking.bookingCategory || booking.tripCategory || 'Round Trip'
    };
  }, [booking]);

  const defaultVendorPercent = settings?.payoutPolicies?.vendorPayoutPercent ?? 85;
  const defaultRoundTripPay = settings?.payoutPolicies?.driverRoundTripPay ?? 1500;
  const defaultTourPackagePay = settings?.payoutPolicies?.driverTourPackagePay ?? 2500;

  const [dispatchMode, setDispatchMode] = useState('fleet'); // 'fleet' | 'makTaxiVendor'
  const [selectedVendorPartnerId, setSelectedVendorPartnerId] = useState('');
  const [vendorNotes, setVendorNotes] = useState('');
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [selectedDriverId, setSelectedDriverId] = useState('');
  const [vendorPercent, setVendorPercent] = useState(defaultVendorPercent);
  const [driverPay, setDriverPay] = useState(defaultRoundTripPay);
  const [nightStayPay, setNightStayPay] = useState(0);
  const [showAllVehicles, setShowAllVehicles] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Compute eligible & categorized vehicles for this booking
  const vehicleAnalysis = useMemo(() => {
    return getVehiclesForBooking(safeBooking, vehicles, bookings);
  }, [safeBooking, vehicles, bookings]);

  // Compute eligible drivers for this booking
  const driverAnalysis = useMemo(() => {
    return getDriversForBooking(safeBooking, drivers, [], bookings, allDriverLeaves);
  }, [safeBooking, drivers, bookings, allDriverLeaves]);

  // Pre-select recommended vehicle and driver when modal opens or booking changes
  useEffect(() => {
    if (safeBooking && isOpen) {
      // 1. Vehicle pre-selection:
      // If booking already has an assigned vehicle, use it; otherwise use recommended (MAK Owned preferred)
      const currentVehId = safeBooking.vehicleId || safeBooking.assignedVehicle?.id;
      if (currentVehId) {
        setSelectedVehicleId(currentVehId);
      } else if (vehicleAnalysis.recommendedVehicleId) {
        setSelectedVehicleId(vehicleAnalysis.recommendedVehicleId);
      } else {
        setSelectedVehicleId('');
      }

      // 2. Driver pre-selection:
      const currentDrvId = safeBooking.driverId || safeBooking.assignedDriver?.id;
      let targetDrvId = '';
      if (currentDrvId) {
        const existingDriver = drivers.find((d) => d.id === currentDrvId || d.driverId === currentDrvId || d.driverBadgeId === currentDrvId);
        const leaveConflict = existingDriver ? getDriverLeaveConflict(existingDriver, safeBooking.journeyDate, safeBooking.returnDate || safeBooking.journeyDate, allDriverLeaves) : null;
        if (!leaveConflict) {
          targetDrvId = currentDrvId;
        } else if (driverAnalysis.recommendedDriverId) {
          targetDrvId = driverAnalysis.recommendedDriverId;
        }
      } else if (driverAnalysis.recommendedDriverId) {
        targetDrvId = driverAnalysis.recommendedDriverId;
      }
      setSelectedDriverId(targetDrvId);

      setShowAllVehicles(false);
      setIsSubmitting(false);

      const targetDriver = drivers.find((d) => d.id === targetDrvId || d.driverId === targetDrvId || d.driverBadgeId === targetDrvId);
      const targetDriverRate = targetDriver?.perTripRate || targetDriver?.salaryStructure?.perTripRate;

      const initNightStay = Number(safeBooking.nightStayAmount || 0);
      setNightStayPay(initNightStay);

      const initDriverPay = safeBooking.driverBaseTripPay || (safeBooking.driverCompensationAmount ? (safeBooking.driverCompensationAmount - initNightStay) : targetDriverRate) ||
        (safeBooking.bookingCategory === 'Tour Package' ? defaultTourPackagePay : defaultRoundTripPay);
      setDriverPay(Number(initDriverPay));
      setVendorPercent(safeBooking.vendorPayoutPercent || defaultVendorPercent);
    }
  }, [safeBooking, isOpen, vehicleAnalysis.recommendedVehicleId, driverAnalysis.recommendedDriverId, defaultTourPackagePay, defaultRoundTripPay, defaultVendorPercent]);

  if (!safeBooking) return null;

  // Selected vehicle object details
  const selectedVehicle = vehicles.find(
    (v) => v.id === selectedVehicleId || v._id === selectedVehicleId || v.regNo === selectedVehicleId
  );
  const isSelectedVehicleCompany = selectedVehicle && (!selectedVehicle.vendorId || selectedVehicle.ownership === 'MAK Owned' || selectedVehicle.ownership === 'Company Owned');

  // Selected driver object details
  const selectedDriver = drivers.find(
    (d) => d.id === selectedDriverId || d._id === selectedDriverId || d.driverId === selectedDriverId || d.driverBadgeId === selectedDriverId
  );

  // Count matching physical vehicles
  const matchingCompanyCount = vehicleAnalysis.matchingCompanyOwnedAvailable.length + vehicleAnalysis.matchingCompanyOwnedUnavailable.length;
  const matchingVendorCount = vehicleAnalysis.matchingVendorAvailable.length + vehicleAnalysis.matchingVendorUnavailable.length;
  const totalMatchingCount = matchingCompanyCount + matchingVendorCount;

  const handleDriverChange = (newDriverId) => {
    if (!newDriverId) {
      setSelectedDriverId('');
      return;
    }
    const chosen = drivers.find(
      (d) => d.id === newDriverId || d.driverId === newDriverId || d.driverBadgeId === newDriverId
    );
    if (chosen) {
      const conflict = getDriverLeaveConflict(chosen, safeBooking.journeyDate, safeBooking.returnDate || safeBooking.journeyDate, allDriverLeaves);
      if (conflict) {
        toast.error(`Cannot assign ${chosen.name || chosen.fullName}: Driver is on leave on trip date (${conflict.description}).`);
        setSelectedDriverId('');
        return;
      }
      setSelectedDriverId(newDriverId);
      const rate =
        chosen.perTripRate ||
        chosen.tripRate ||
        chosen.salaryStructure?.perTripRate ||
        (safeBooking.bookingCategory === 'Tour Package' ? defaultTourPackagePay : defaultRoundTripPay);
      setDriverPay(Number(rate));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (dispatchMode === 'makTaxiVendor') {
      if (!selectedVendorPartnerId) {
        toast.error('Please select a partner vendor to delegate this outstation trip');
        return;
      }
      setIsSubmitting(true);
      try {
        const targetId = safeBooking.id || safeBooking.bookingNumber;
        const selectedVenObj = (vendors || []).find(
          (v) => v.id === selectedVendorPartnerId || v.vendorId === selectedVendorPartnerId || v.externalVendorId === selectedVendorPartnerId
        );
        const ok = await assignOutstationTripToVendor(targetId, selectedVendorPartnerId, {
          vendorPayoutPercent: Number(vendorPercent),
          vendorObj: selectedVenObj,
          notes: vendorNotes
        });
        if (ok) {
          if (onSuccess) await onSuccess();
          onClose();
        }
      } catch (err) {
        console.error('Vendor dispatch error:', err);
        toast.error('Failed to dispatch trip to vendor app');
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    if (!selectedVehicleId) {
      toast.error('Please select a commercial fleet vehicle from the dropdown');
      return;
    }

    if (!selectedDriverId) {
      toast.error('Please select an available driver from the dropdown');
      return;
    }

    if (selectedDriver) {
      const conflict = getDriverLeaveConflict(selectedDriver, safeBooking.journeyDate, safeBooking.returnDate || safeBooking.journeyDate, allDriverLeaves);
      if (conflict) {
        toast.error(`Cannot dispatch booking: Driver ${selectedDriver.name || selectedDriver.fullName} is on leave on the trip start date (${formatDateDMY(safeBooking.journeyDate)}). Please select another driver.`);
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const targetId = safeBooking.id || safeBooking.bookingNumber;
      const totalDriverCompensation = Number(driverPay) + Number(nightStayPay || 0);
      const ok = await confirmTripAssignment(targetId, selectedDriverId, selectedVehicleId, {
        vendorPayoutPercent: Number(vendorPercent),
        driverCompensationAmount: totalDriverCompensation,
        driverBaseTripPay: Number(driverPay),
        nightStayAmount: Number(nightStayPay || 0),
        nightStayNights: Number(nightStayPay > 0 ? 1 : 0)
      });
      if (ok) {
        if (onSuccess) await onSuccess();
        onClose();
      }
    } catch (err) {
      console.error('Assignment error:', err);
      toast.error('Failed to complete dispatch assignment');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Dispatch & Allocation - Booking #${safeBooking.bookingNumber || safeBooking.id}`}
      subtitle={`Journey: ${String(safeBooking.pickupLocation || 'Depot').split(',')[0]} → ${String(safeBooking.destination || 'Destination').split(',')[0]} (${safeBooking.journeyDate} to ${safeBooking.returnDate || safeBooking.journeyDate})`}
      maxWidth="680px"
      footer={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <Button variant="ghost" type="button" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            variant="primary"
            type="button"
            onClick={handleSubmit}
            disabled={
              dispatchMode === 'makTaxiVendor'
                ? (!selectedVendorPartnerId || isSubmitting)
                : (!selectedVehicleId || !selectedDriverId || isSubmitting)
            }
            leftIcon={dispatchMode === 'makTaxiVendor' ? <Smartphone size={15} /> : <Send size={15} />}
          >
            {isSubmitting
              ? 'Dispatching...'
              : (dispatchMode === 'makTaxiVendor' ? 'Dispatch to MAK TAXI Vendor App' : 'Confirm Car & Driver Dispatch')}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {/* Dispatch Mode Toggle: In-House Fleet vs MAK TAXI Partner App */}
        <div style={{ display: 'flex', backgroundColor: '#F1F5F9', padding: '0.25rem', borderRadius: '10px', gap: '0.35rem' }}>
          <button
            type="button"
            onClick={() => setDispatchMode('fleet')}
            style={{
              flex: 1,
              padding: '0.6rem 0.75rem',
              borderRadius: '8px',
              border: 'none',
              fontWeight: 700,
              fontSize: '0.8125rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.45rem',
              backgroundColor: dispatchMode === 'fleet' ? '#FFFFFF' : 'transparent',
              color: dispatchMode === 'fleet' ? '#2C3480' : '#64748B',
              boxShadow: dispatchMode === 'fleet' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            <Car size={16} />
            Direct Fleet Dispatch (Car & Driver)
          </button>
          <button
            type="button"
            onClick={() => setDispatchMode('makTaxiVendor')}
            style={{
              flex: 1,
              padding: '0.6rem 0.75rem',
              borderRadius: '8px',
              border: 'none',
              fontWeight: 700,
              fontSize: '0.8125rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.45rem',
              backgroundColor: dispatchMode === 'makTaxiVendor' ? '#FFFFFF' : 'transparent',
              color: dispatchMode === 'makTaxiVendor' ? '#2C3480' : '#64748B',
              boxShadow: dispatchMode === 'makTaxiVendor' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            <Smartphone size={16} />
            Delegate to MAK TAXI Partner App
          </button>
        </div>

        {dispatchMode === 'makTaxiVendor' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Real-time Push Alert Banner */}
            <div
              style={{
                backgroundColor: '#EEF2FF',
                border: '1.5px solid #C7D2FE',
                borderRadius: '10px',
                padding: '0.875rem 1rem',
                display: 'flex',
                gap: '0.75rem',
                alignItems: 'flex-start'
              }}
            >
              <Bell size={20} style={{ color: '#2C3480', flexShrink: 0, marginTop: '0.1rem' }} />
              <div style={{ fontSize: '0.8rem', color: '#1E293B', lineHeight: 1.45 }}>
                <strong style={{ color: '#2C3480', display: 'block', marginBottom: '0.2rem' }}>
                  Real-time Outstation Trip Assignment
                </strong>
                Assigning this outstation booking will send an instant push notification and buzzer to the chosen partner's <strong>MAK TAXI Vendor App</strong>. The vendor will select their available driver and car directly from their app, which will automatically sync back to your ERP manifest.
              </div>
            </div>

            {/* Vendor Partner Select */}
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 700, color: '#0F172A', marginBottom: '0.4rem' }}>
                Select Partner Vendor <span style={{ color: '#DC2626' }}>*</span>
              </label>
              <select
                value={selectedVendorPartnerId}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedVendorPartnerId(val);
                  const found = (vendors || []).find((v) => v.id === val || v.vendorId === val || v.externalVendorId === val);
                  if (found && found.contractPayoutPercent) {
                    setVendorPercent(found.contractPayoutPercent);
                  }
                }}
                style={{
                  width: '100%',
                  padding: '0.625rem 0.875rem',
                  borderRadius: '8px',
                  border: '1.5px solid #CBD5E1',
                  backgroundColor: '#FFFFFF',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: '#0F172A',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                <option value="">-- Choose Partner Vendor ({vendors.length} Registered Partners) --</option>
                {vendors.map((vnd) => {
                  const vId = vnd.vendorId || vnd.id || vnd._id;
                  const isAppSynced = vnd.source === 'MAK_TAXI_APP' || Boolean(vnd.externalVendorId);
                  return (
                    <option key={vId} value={vId}>
                      {isAppSynced ? '📱 [MAK TAXI App] ' : '🏢 '}
                      {vnd.companyName || vnd.name || 'Vendor'} ({vnd.phone}) &bull; {vnd.city || 'Chennai'} &bull; Fleet: {vnd.totalVehiclesAttached || vnd.fleetCount || 0} Cars &bull; {vnd.contractPayoutPercent || 85}% Payout
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Selected Vendor Preview */}
            {selectedVendorPartnerId && (() => {
              const currentVnd = (vendors || []).find((v) => v.id === selectedVendorPartnerId || v.vendorId === selectedVendorPartnerId || v.externalVendorId === selectedVendorPartnerId);
              if (!currentVnd) return null;
              const isApp = currentVnd.source === 'MAK_TAXI_APP' || Boolean(currentVnd.externalVendorId);
              const totalFare = Number(safeBooking.totalAmount || 0);
              const payable = Math.round(totalFare * (vendorPercent / 100));

              return (
                <div style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '0.875rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <strong style={{ fontSize: '0.95rem', color: '#0F172A' }}>
                          {currentVnd.companyName || currentVnd.name}
                        </strong>
                        {isApp && (
                          <span style={{ fontSize: '0.7rem', fontWeight: 800, padding: '0.15rem 0.45rem', borderRadius: '6px', backgroundColor: '#DCFCE7', color: '#166534', border: '1px solid #BBF7D0' }}>
                            📱 Connected to MAK TAXI App
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '0.15rem' }}>
                        Contact: {currentVnd.contactPerson || currentVnd.ownerName || 'Admin'} &bull; Phone: {currentVnd.phone} &bull; {currentVnd.city || 'Chennai'}
                      </div>
                    </div>
                    <Badge variant="primary" size="sm">
                      {currentVnd.totalVehiclesAttached || currentVnd.fleetCount || 0} Vehicles Attached
                    </Badge>
                  </div>

                  {/* Financial Settlement Terms */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem', paddingTop: '0.65rem', borderTop: '1px dashed #CBD5E1' }}>
                    <div>
                      <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.25rem' }}>
                        Vendor Payout (%)
                      </label>
                      <input
                        type="number"
                        min="50"
                        max="95"
                        value={vendorPercent}
                        onChange={(e) => setVendorPercent(Number(e.target.value))}
                        style={{
                          width: '100%',
                          padding: '0.5rem 0.65rem',
                          borderRadius: '6px',
                          border: '1px solid #CBD5E1',
                          fontSize: '0.875rem',
                          fontWeight: 700
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.25rem' }}>
                        Calculated Vendor Payable
                      </label>
                      <div style={{ fontSize: '1rem', fontWeight: 800, color: '#166534', paddingTop: '0.35rem' }}>
                        ₹{payable.toLocaleString('en-IN')}
                        <span style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 500, marginLeft: '0.3rem' }}>
                          (of ₹{totalFare.toLocaleString('en-IN')})
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Notes / Special Instructions */}
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.25rem' }}>
                      Instructions for Vendor (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. VIP passenger, AC required, neat sedan requested"
                      value={vendorNotes}
                      onChange={(e) => setVendorNotes(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.5rem 0.65rem',
                        borderRadius: '6px',
                        border: '1px solid #CBD5E1',
                        fontSize: '0.8125rem'
                      }}
                    />
                  </div>
                </div>
              );
            })()}
          </div>
        ) : (
          <>
        {/* Customer Requested Vehicle Notice */}
        <div
          style={{
            backgroundColor: '#F8FAFC',
            border: '1px solid #E2E8F0',
            borderRadius: '12px',
            padding: '0.875rem 1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            flexWrap: 'wrap'
          }}
        >
          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748B', display: 'block' }}>
              Customer Requested Car Model:
            </span>
            <div style={{ fontSize: '1rem', fontWeight: 800, color: '#2C3480', display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.15rem' }}>
              <Car size={18} />
              {safeBooking.vehicleReserved || safeBooking.vehicleName || 'Toyota Innova Crysta'}
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748B', display: 'block' }}>
              Passenger Capacity:
            </span>
            <span style={{ fontWeight: 800, color: '#0F172A', fontSize: '0.875rem' }}>
              {safeBooking.passengerCount || 4} Passengers &bull; {safeBooking.bookingCategory}
            </span>
          </div>
        </div>

        {/* ========================================================
            1. VEHICLE SELECTION DROPDOWN (MAK OWNED PREFERRED)
            ======================================================== */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <label style={{ fontSize: '0.875rem', fontWeight: 700, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Car size={16} style={{ color: '#2C3480' }} />
              1. Select Vehicle (Dropdown) <span style={{ color: '#DC2626' }}>*</span>
            </label>

            <button
              type="button"
              onClick={() => setShowAllVehicles(!showAllVehicles)}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '0.75rem',
                color: '#2C3480',
                fontWeight: 600,
                cursor: 'pointer',
                textDecoration: 'underline',
                padding: 0
              }}
            >
              {showAllVehicles ? 'Show only matching models' : 'Browse all fleet categories'}
            </button>
          </div>

          <div style={{ fontSize: '0.78rem', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.25rem', backgroundColor: '#F8FAFC', padding: '0.35rem 0.65rem', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
            <span>
              Found <strong>{totalMatchingCount}</strong> vehicles matching <strong>"{safeBooking.vehicleReserved || safeBooking.vehicleName}"</strong> in fleet ({matchingCompanyCount} MAK Owned + {matchingVendorCount} Vendor Attached). Select within these {totalMatchingCount} cars:
            </span>
            <span style={{ fontSize: '0.72rem', color: '#16a34a', fontWeight: 700 }}>
              🏢 Priority: MAK Owned
            </span>
          </div>

          {/* Vehicle Dropdown */}
          <select
            value={selectedVehicleId}
            onChange={(e) => setSelectedVehicleId(e.target.value)}
            style={{
              width: '100%',
              padding: '0.625rem 0.875rem',
              borderRadius: '8px',
              border: '1.5px solid #CBD5E1',
              backgroundColor: '#FFFFFF',
              fontSize: '0.875rem',
              fontWeight: 600,
              color: '#0F172A',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            <option value="">-- Choose Physical Vehicle ({totalMatchingCount} in Fleet) --</option>

            {/* OPTGROUP 1: Company Owned Vehicles (PREFERRED) */}
            <optgroup label="★ Company Owned Fleet (MAK Owned - Preferred)">
              {vehicleAnalysis.matchingCompanyOwnedAvailable.map((v) => (
                <option key={v.id} value={v.id}>
                  ⭐ {v.brand} {v.model} ({v.regNo}) - MAK Owned [Available] (Recommended)
                </option>
              ))}
              {vehicleAnalysis.matchingCompanyOwnedUnavailable.map((v) => (
                <option key={v.id} value={v.id} disabled>
                  ⚠️ {v.brand} {v.model} ({v.regNo}) - MAK Owned [Unavailable: {v.unavailabilityReason}]
                </option>
              ))}
            </optgroup>

            {/* OPTGROUP 2: Vendor Partner Vehicles */}
            <optgroup label="Vendor Partner Fleet (Secondary Option)">
              {vehicleAnalysis.matchingVendorAvailable.map((v) => (
                <option key={v.id} value={v.id}>
                  🏢 {v.brand} {v.model} ({v.regNo}) - Vendor: {v.vendorName || 'Attached Partner'} [Available]
                </option>
              ))}
              {vehicleAnalysis.matchingVendorUnavailable.map((v) => (
                <option key={v.id} value={v.id} disabled>
                  ⚠️ {v.brand} {v.model} ({v.regNo}) - Vendor: {v.vendorName} [Unavailable: {v.unavailabilityReason}]
                </option>
              ))}
            </optgroup>

            {/* OPTGROUP 3: Other Fleet Vehicles (Optional / Upgrades) */}
            {showAllVehicles && vehicleAnalysis.otherVehiclesAvailable.length > 0 && (
              <optgroup label="Other Available Fleet Categories (Alternate / Upgrade)">
                {vehicleAnalysis.otherVehiclesAvailable.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.brand} {v.model} ({v.regNo}) - {v.isCompanyOwned ? 'MAK Owned' : `Vendor: ${v.vendorName}`} [{v.category}]
                  </option>
                ))}
              </optgroup>
            )}
          </select>

          {/* Preference Alert Notice */}
          <div
            style={{
              padding: '0.625rem 0.875rem',
              borderRadius: '8px',
              fontSize: '0.75rem',
              lineHeight: 1.4,
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              backgroundColor: isSelectedVehicleCompany ? '#F0FDF4' : vehicleAnalysis.hasAvailableCompanyOwned ? '#EFF6FF' : '#FFFBEB',
              border: `1px solid ${isSelectedVehicleCompany ? '#BBF7D0' : vehicleAnalysis.hasAvailableCompanyOwned ? '#BFDBFE' : '#FDE68A'}`,
              color: isSelectedVehicleCompany ? '#166534' : vehicleAnalysis.hasAvailableCompanyOwned ? '#1E40AF' : '#92400E'
            }}
          >
            {isSelectedVehicleCompany ? (
              <>
                <CheckCircle2 size={15} style={{ flexShrink: 0, color: '#16A34A' }} />
                <span>
                  <strong>Preferred In-House Fleet:</strong> Selected car is MAK-owned. Directly deployed from our local garage to maximize enterprise margins.
                </span>
              </>
            ) : selectedVehicle ? (
              <>
                <Info size={15} style={{ flexShrink: 0, color: '#D97706' }} />
                <span>
                  <strong>Vendor Partner Fleet:</strong> Selected car is supplied by <em>{selectedVehicle.vendorName || 'Attached Partner'}</em>.
                  {!vehicleAnalysis.hasAvailableCompanyOwned && ' (Assigned because company-owned matching units are currently committed on road/maintenance).'}
                </span>
              </>
            ) : (
              <>
                <Info size={15} style={{ flexShrink: 0 }} />
                <span>{vehicleAnalysis.preferenceMessage}</span>
              </>
            )}
          </div>

          {/* Selected Vehicle Card Preview */}
          {selectedVehicle && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.875rem',
                padding: '0.75rem',
                borderRadius: '8px',
                border: '1px solid #E2E8F0',
                backgroundColor: '#FFFFFF',
                marginTop: '0.25rem'
              }}
            >
              <img
                src={selectedVehicle.image || 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=400&q=80'}
                alt={selectedVehicle.model}
                style={{ width: '75px', height: '52px', borderRadius: '6px', objectFit: 'cover' }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <strong style={{ fontSize: '0.875rem', color: '#0F172A' }}>
                    {selectedVehicle.brand} {selectedVehicle.model}
                  </strong>
                  <span className="font-mono" style={{ fontSize: '0.75rem', color: '#2C3480', fontWeight: 800, backgroundColor: '#EEF2FF', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>
                    {selectedVehicle.regNo}
                  </span>
                  <Badge variant={isSelectedVehicleCompany ? 'primary' : 'warning'} size="sm">
                    {isSelectedVehicleCompany ? 'MAK Owned' : `Vendor: ${selectedVehicle.vendorName?.split(' ')[0] || 'Partner'}`}
                  </Badge>
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '0.2rem' }}>
                  Seating: {selectedVehicle.seatingCapacity || selectedVehicle.seating} &bull; Fuel: {selectedVehicle.fuelType} &bull; Rate: ₹{selectedVehicle.ratePerKm}/km &bull; Batta: ₹{selectedVehicle.driverAllowance}/day
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ========================================================
            2. DRIVER SELECTION DROPDOWN
            ======================================================== */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid #F1F5F9' }}>
          <label style={{ fontSize: '0.875rem', fontWeight: 700, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <UserCheck size={16} style={{ color: '#2C3480' }} />
            2. Select Driver (Dropdown) <span style={{ color: '#DC2626' }}>*</span>
          </label>

          {/* Driver Dropdown */}
          <select
            value={selectedDriverId}
            onChange={(e) => handleDriverChange(e.target.value)}
            style={{
              width: '100%',
              padding: '0.625rem 0.875rem',
              borderRadius: '8px',
              border: '1.5px solid #CBD5E1',
              backgroundColor: '#FFFFFF',
              fontSize: '0.875rem',
              fontWeight: 600,
              color: '#0F172A',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            <option value="">-- Choose Commercial Driver --</option>

            <optgroup label="Available Drivers (Ready for Duty)">
              {driverAnalysis.availableDrivers.map((d) => {
                const tripRate = d.perTripRate || d.tripRate || d.salaryStructure?.perTripRate || 1500;
                return (
                  <option key={d.id} value={d.id}>
                    👤 {d.name} ({d.driverCode || d.id}) &bull; ₹{tripRate.toLocaleString('en-IN')}/trip &bull; Rating: {d.rating} ★ [Available for {safeBooking.journeyDate}]
                  </option>
                );
              })}
            </optgroup>

            {driverAnalysis.unavailableDrivers.length > 0 && (
              <optgroup label="Unavailable Drivers (On Trip / Leave / Conflict)">
                {driverAnalysis.unavailableDrivers.map((d) => (
                  <option key={d.id} value={d.id} disabled>
                    ⛔ {d.name} ({d.id}) [Unavailable: {d.unavailabilityReason}]
                  </option>
                ))}
              </optgroup>
            )}
          </select>

          {/* Driver on Leave Notice */}
          {driverAnalysis.unavailableDrivers.some((d) => d.onLeave) && (
            <div style={{ marginTop: '0.25rem', padding: '0.45rem 0.75rem', backgroundColor: '#fff7ed', border: '1px solid #fed7aa', borderRadius: '6px', fontSize: '0.73rem', color: '#9a3412', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <AlertTriangle size={15} style={{ color: '#ea580c', flexShrink: 0 }} />
              <span>
                <strong>{driverAnalysis.unavailableDrivers.filter((d) => d.onLeave).map((d) => d.name).join(', ')}</strong> {driverAnalysis.unavailableDrivers.filter((d) => d.onLeave).length === 1 ? 'is' : 'are'} on approved leave on the journey date (<strong>{formatDateDMY(safeBooking.journeyDate)}</strong>) and cannot be assigned.
              </span>
            </div>
          )}

          {/* Selected Driver Preview Card */}
          {selectedDriver && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.875rem',
                padding: '0.75rem',
                borderRadius: '8px',
                border: '1px solid #E2E8F0',
                backgroundColor: '#FFFFFF',
                marginTop: '0.25rem'
              }}
            >
              <img
                src={selectedDriver.photo || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80'}
                alt={selectedDriver.name}
                style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #2C3480' }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <strong style={{ fontSize: '0.875rem', color: '#0F172A' }}>
                    {selectedDriver.name || selectedDriver.fullName}
                  </strong>
                  <span className="font-mono" style={{ fontSize: '0.75rem', color: '#64748B' }}>
                    ({selectedDriver.id})
                  </span>
                  <Badge variant="success" size="sm">Available</Badge>
                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      backgroundColor: '#EEF0FD',
                      color: '#2C3480',
                      padding: '0.15rem 0.5rem',
                      borderRadius: '4px'
                    }}
                  >
                    Rate: ₹{(selectedDriver.perTripRate || selectedDriver.tripRate || selectedDriver.salaryStructure?.perTripRate || 1500).toLocaleString('en-IN')}/trip
                  </span>
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '0.2rem' }}>
                  📞 {selectedDriver.phone} &bull; Badge: <span className="font-mono">{selectedDriver.badgeNumber || 'BDG-TN-8812'}</span> &bull; Rating: {selectedDriver.rating} ★ ({selectedDriver.totalTripsCompleted || selectedDriver.tripsCompleted || 0} Trips)
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ========================================================
            3. COMMERCIAL PAYOUTS & OPERATING PROFIT (ADMIN DECISION)
            ======================================================== */}
        {selectedVehicle && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid #F1F5F9' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <label style={{ fontSize: '0.875rem', fontWeight: 700, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <IndianRupee size={16} style={{ color: '#2C3480' }} />
                3. Commercial Payouts & Operational Accounting
              </label>
              <span style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 600 }}>
                Total Fare: <strong style={{ color: '#0F172A' }}>₹{Number(safeBooking.totalAmount || 0).toLocaleString('en-IN')}</strong>
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '0.75rem' }}>
              {/* Vendor Share Config (if vendor vehicle) */}
              {!isSelectedVehicleCompany ? (
                <div style={{ backgroundColor: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '10px', padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#92400E', textTransform: 'uppercase' }}>
                      Vendor Share (%)
                    </span>
                    <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#B45309' }}>
                      {selectedVehicle.vendorName?.split(' ')[0] || 'Vendor'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input
                      type="number"
                      min="50"
                      max="95"
                      step="1"
                      value={vendorPercent}
                      onChange={(e) => setVendorPercent(Number(e.target.value))}
                      style={{ width: '70px', padding: '0.35rem 0.5rem', borderRadius: '6px', border: '1px solid #FCD34D', fontSize: '0.875rem', fontWeight: 800, color: '#78350F' }}
                    />
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#78350F' }}>% of Booking Fare</span>
                  </div>

                  <div style={{ fontSize: '0.75rem', color: '#92400E', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Vendor Payout Expense:</span>
                    <strong>₹{Math.round(Number(safeBooking.totalAmount || 0) * (vendorPercent / 100)).toLocaleString('en-IN')}</strong>
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#64748B', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Admin Retained Margin:</span>
                    <strong style={{ color: '#16A34A' }}>₹{Math.round(Number(safeBooking.totalAmount || 0) * ((100 - vendorPercent) / 100)).toLocaleString('en-IN')} ({100 - vendorPercent}%)</strong>
                  </div>
                </div>
              ) : (
                <div style={{ backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '10px', padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.35rem', justifyContent: 'center' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#166534', textTransform: 'uppercase' }}>
                    🏢 MAK In-House Fleet
                  </div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#15803D' }}>
                    ₹0 Vendor Expense
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#166534' }}>
                    100% of customer booking fare retained by company.
                  </div>
                </div>
              )}

              {/* Driver Compensation Config */}
              <div style={{ backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '10px', padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.25rem' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#166534', textTransform: 'uppercase' }}>
                    Driver Trip Pay (₹)
                  </span>
                  <span style={{ fontSize: '0.675rem', fontWeight: 700, backgroundColor: '#DCFCE7', color: '#166534', padding: '0.1rem 0.45rem', borderRadius: '4px' }}>
                    Auto-Set From Driver • Editable
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#166534' }}>₹</span>
                  <input
                    type="number"
                    min="500"
                    step="50"
                    value={driverPay}
                    onChange={(e) => setDriverPay(Number(e.target.value))}
                    style={{ width: '100px', padding: '0.35rem 0.5rem', borderRadius: '6px', border: '1px solid #86EFAC', fontSize: '0.875rem', fontWeight: 800, color: '#166534' }}
                  />
                  <span style={{ fontSize: '0.75rem', color: '#15803D' }}>Fixed Trip Fee</span>
                </div>

                {/* Night Stay Allowance Row */}
                <div style={{ paddingTop: '0.45rem', borderTop: '1px dashed #BBF7D0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.35rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#15803D' }}>🌙 Night Stay (₹):</span>
                    <input
                      type="number"
                      min="0"
                      step="50"
                      value={nightStayPay}
                      onChange={(e) => setNightStayPay(Number(e.target.value))}
                      placeholder="0"
                      style={{ width: '85px', padding: '0.25rem 0.4rem', borderRadius: '5px', border: '1px solid #86EFAC', fontSize: '0.8rem', fontWeight: 800, color: '#15803D' }}
                    />
                  </div>
                  <span style={{ fontSize: '0.72rem', color: '#166534', fontWeight: 700 }}>
                    Total: ₹{(Number(driverPay || 0) + Number(nightStayPay || 0)).toLocaleString('en-IN')}
                  </span>
                </div>

                <div style={{ fontSize: '0.7rem', color: '#15803D', lineHeight: 1.3 }}>
                  💡 If the driver stays the night, they can also add or adjust this additional amount directly in their Driver App.
                </div>
              </div>
            </div>

            {/* Financial Ledger & Profit Breakdown */}
            {(() => {
              const totalFare = Number(safeBooking.totalAmount || 0);
              const vCost = !isSelectedVehicleCompany ? Math.round(totalFare * (vendorPercent / 100)) : 0;
              const dCost = Number(driverPay || 0) + Number(nightStayPay || 0);
              const totalExpenses = vCost + dCost;
              const netProfit = totalFare - totalExpenses;
              const profitMargin = totalFare > 0 ? ((netProfit / totalFare) * 100).toFixed(1) : 0;

              return (
                <div style={{ backgroundColor: '#EEF0FD', border: '1px solid #C7CEFA', borderRadius: '10px', padding: '0.75rem 0.875rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div>
                    <span style={{ fontSize: '0.68rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>DISPATCH EXPENSES</span>
                    <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#DC2626' }}>
                      ₹{totalExpenses.toLocaleString('en-IN')}
                    </div>
                    <span style={{ fontSize: '0.65rem', color: '#64748B' }}>
                      Vendor ₹{vCost.toLocaleString('en-IN')} + Driver ₹{dCost.toLocaleString('en-IN')}{nightStayPay > 0 ? ` (incl. ₹${Number(nightStayPay).toLocaleString('en-IN')} Night)` : ''}
                    </span>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '0.68rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>PROJECTED NET PROFIT</span>
                    <div style={{ fontSize: '1.15rem', fontWeight: 800, color: netProfit >= 0 ? '#16A34A' : '#DC2626' }}>
                      ₹{netProfit.toLocaleString('en-IN')}
                    </div>
                    <span style={{ fontSize: '0.7rem', fontWeight: 700, color: netProfit >= 0 ? '#16A34A' : '#DC2626' }}>
                      {profitMargin}% Net Margin
                    </span>
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </>
    )}
      </form>
    </Modal>
  );
}

export default AssignCarDriverModal;
