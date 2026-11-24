// MAK Tours & Travels ERP - Create Travel Booking Form
// CRITICAL: ONE WAY TRIP MUST NOT EXIST ANYWHERE IN THIS APPLICATION.
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Save, CheckCircle2, AlertCircle } from 'lucide-react';
import { Card, CardHeader, CardBody } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { useAdminData } from '../../../context/AdminDataContext';
import { useToast } from '../../../context/ToastContext';
import { bookingCategories, paymentStatuses } from '../../../data';
import { getDriverLeaveConflict, formatDateDMY, normalizeDate } from '../../../utils/dateUtils';

export function BookingCreate() {
  const navigate = useNavigate();
  const toast = useToast();
  const { addBooking, customers, tourPackages, vehicles, drivers, driverLeaves = [], driverLeaveRequests = [] } = useAdminData();
  const allDriverLeaves = driverLeaves.length > 0 ? driverLeaves : driverLeaveRequests;

  // Today's local date string (YYYY-MM-DD)
  const getTodayStr = () => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const getTomorrowStr = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const todayStr = getTodayStr();

  // Form State
  const [bookingCategory, setBookingCategory] = useState('Round Trip');
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerType, setCustomerType] = useState('Individual');

  const [pickupLocation, setPickupLocation] = useState('');
  const [destination, setDestination] = useState('');
  const [journeyDate, setJourneyDate] = useState(() => getTodayStr());
  const [journeyTime, setJourneyTime] = useState('06:00 AM');
  const [returnDate, setReturnDate] = useState(() => getTomorrowStr());

  const [selectedTourPackageId, setSelectedTourPackageId] = useState('');
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [vendorPayoutPercent, setVendorPayoutPercent] = useState(85);
  const [vendorPayableAmount, setVendorPayableAmount] = useState(0);

  const [selectedDriverId, setSelectedDriverId] = useState('');
  const [driverCompensationAmount, setDriverCompensationAmount] = useState(1500);
  const [passengerCount, setPassengerCount] = useState(4);

  // Financials & Payment Options
  const [bookingAmount, setBookingAmount] = useState(18000);
  const [additionalCharges, setAdditionalCharges] = useState(1000);
  const [paymentOption, setPaymentOption] = useState('partial_advance'); // 'pay_on_departure' | 'partial_advance' | 'fully_paid'
  const [advancePaid, setAdvancePaid] = useState(5000);
  const [paymentMethod, setPaymentMethod] = useState('UPI / QR');
  const [notes, setNotes] = useState('');

  // Tour Package price per individual person helper
  const getPackagePricePerPerson = (pkg) => {
    if (!pkg) return 0;
    if (typeof pkg.priceNumeric === 'number' && pkg.priceNumeric > 0) return pkg.priceNumeric;
    if (typeof pkg.startingPrice === 'number' && pkg.startingPrice > 0) return pkg.startingPrice;
    if (typeof pkg.pricePerPerson === 'number' && pkg.pricePerPerson > 0) return pkg.pricePerPerson;
    if (typeof pkg.ratePerPerson === 'number' && pkg.ratePerPerson > 0) return pkg.ratePerPerson;
    if (typeof pkg.price === 'number' && pkg.price > 0) return pkg.price;
    if (typeof pkg.price === 'string') {
      const cleaned = pkg.price.replace(/[^0-9.]/g, '');
      const parsed = parseFloat(cleaned);
      if (!isNaN(parsed) && parsed > 0) return parsed;
    }
    return 0;
  };

  const getPackageDurationLabel = (pkg) => {
    if (!pkg) return '';
    if (pkg.duration) return pkg.duration;
    if (pkg.daysCount) return `${pkg.daysCount} Days / ${Math.max(1, pkg.daysCount - 1)} Nights`;
    if (pkg.days && pkg.nights) return `${pkg.days}D / ${pkg.nights}N`;
    return '';
  };

  const selectedTourPackage = tourPackages.find((p) => p.id === selectedTourPackageId) || null;
  const packagePerPersonRate = getPackagePricePerPerson(selectedTourPackage);

  // Auto-calculate Tour Package amount whenever passenger count or selected package changes
  React.useEffect(() => {
    if (bookingCategory === 'Tour Package' && selectedTourPackage) {
      const count = Math.max(1, parseInt(passengerCount, 10) || 1);
      const rate = getPackagePricePerPerson(selectedTourPackage);
      if (rate > 0) {
        setBookingAmount(rate * count);
      }
    }
  }, [bookingCategory, selectedTourPackageId, passengerCount, selectedTourPackage]);

  // Derived Total Amount
  const totalAmount = Math.max(0, Number(bookingAmount || 0) + Number(additionalCharges || 0));

  // Resolved selected vehicle and vendor status
  const selectedVehicle = vehicles.find(
    (v) => v.id === selectedVehicleId || v._id === selectedVehicleId || v.regNo === selectedVehicleId || v.numberPlate === selectedVehicleId
  ) || null;
  const isVendorVehicle = Boolean(
    selectedVehicle &&
    (selectedVehicle.vendorId || selectedVehicle.ownership === 'Vendor Attached' || selectedVehicle.ownership === 'Vendor Owned')
  );

  const handleVehicleChange = (vId) => {
    setSelectedVehicleId(vId);
    if (!vId) {
      setVendorPayableAmount(0);
      return;
    }
    const veh = vehicles.find((v) => v.id === vId || v._id === vId || v.regNo === vId || v.numberPlate === vId);
    if (veh) {
      const isVendor = Boolean(veh.vendorId || veh.ownership === 'Vendor Attached' || veh.ownership === 'Vendor Owned');
      if (isVendor) {
        const pct = veh.vendorPayoutPercent ?? 85;
        setVendorPayoutPercent(pct);
        setVendorPayableAmount(Math.round(totalAmount * (pct / 100)));
      } else {
        setVendorPayableAmount(0);
      }
    }
  };

  const handleVendorPercentChange = (pct) => {
    const num = Number(pct);
    setVendorPayoutPercent(num);
    setVendorPayableAmount(Math.round(totalAmount * (num / 100)));
  };

  // Evaluate driver availability and leave conflicts against selected journeyDate and returnDate
  const { availableDrivers, onLeaveDrivers } = useMemo(() => {
    const avail = [];
    const onLeave = [];

    (drivers || []).forEach((d) => {
      const conflict = getDriverLeaveConflict(d, journeyDate, returnDate || journeyDate, allDriverLeaves);
      if (conflict) {
        onLeave.push({ ...d, leaveConflict: conflict });
      } else {
        avail.push(d);
      }
    });

    return { availableDrivers: avail, onLeaveDrivers: onLeave };
  }, [drivers, journeyDate, returnDate, allDriverLeaves]);

  // Check if currently selected driver has a leave conflict for the journey date
  const selectedDriverLeaveConflict = useMemo(() => {
    if (!selectedDriverId || !journeyDate) return null;
    const chosen = (drivers || []).find(
      (d) => d.id === selectedDriverId || d._id === selectedDriverId || d.driverId === selectedDriverId || d.driverBadgeId === selectedDriverId
    );
    if (!chosen) return null;
    return getDriverLeaveConflict(chosen, journeyDate, returnDate || journeyDate, allDriverLeaves);
  }, [selectedDriverId, journeyDate, returnDate, drivers, allDriverLeaves]);

  // If journey date changes and current driver is on leave, automatically clear driver selection
  useEffect(() => {
    if (selectedDriverLeaveConflict) {
      setSelectedDriverId('');
      toast.warning(`Driver is on leave for ${formatDateDMY(journeyDate)}. Driver assignment was cleared.`);
    }
  }, [selectedDriverLeaveConflict, journeyDate]);

  const handleDriverChange = (driverId) => {
    if (!driverId) {
      setSelectedDriverId('');
      return;
    }
    const chosen = (drivers || []).find(
      (d) => d.id === driverId || d._id === driverId || d.driverId === driverId || d.driverBadgeId === driverId
    );
    if (chosen) {
      const conflict = getDriverLeaveConflict(chosen, journeyDate, returnDate || journeyDate, allDriverLeaves);
      if (conflict) {
        toast.error(`Cannot select ${chosen.name || chosen.fullName}: Driver is on leave on ${formatDateDMY(journeyDate)} (${conflict.description}).`);
        setSelectedDriverId('');
        return;
      }

      setSelectedDriverId(driverId);
      const rate =
        chosen.perTripRate ||
        chosen.tripRate ||
        chosen.salaryStructure?.perTripRate ||
        1500;
      setDriverCompensationAmount(Number(rate));
    }
  };

  // Synchronize vendor payable amount if total amount or vendor percent changes
  React.useEffect(() => {
    if (isVendorVehicle) {
      setVendorPayableAmount(Math.round(totalAmount * ((Number(vendorPayoutPercent) || 85) / 100)));
    }
  }, [totalAmount, vendorPayoutPercent, isVendorVehicle]);

  // Effective advance and balance based on payment option
  const effectiveAdvancePaid = paymentOption === 'fully_paid'
    ? totalAmount
    : paymentOption === 'pay_on_departure'
    ? 0
    : Math.min(totalAmount, Math.max(0, Number(advancePaid || 0)));

  const balanceDue = Math.max(0, totalAmount - effectiveAdvancePaid);

  const effectivePaymentStatus = paymentOption === 'fully_paid' || balanceDue === 0
    ? 'Paid'
    : effectiveAdvancePaid > 0
    ? 'Partially Paid'
    : 'Pending';

  const effectivePaymentType = paymentOption === 'fully_paid'
    ? 'Full Payment (100% Settled)'
    : paymentOption === 'partial_advance'
    ? 'Partial Advance Payment'
    : 'Book at ₹0 (Pay on Departure)';

  // Handle Customer Selection
  const handleCustomerChange = (e) => {
    const custId = e.target.value;
    setSelectedCustomerId(custId);
    if (custId === 'new') {
      setCustomerName('');
      setCustomerPhone('+91 ');
      setCustomerEmail('');
      setCustomerType('Individual');
    } else {
      const found = customers.find((c) => c.id === custId);
      if (found) {
        setCustomerName(found.name);
        setCustomerPhone(found.phone);
        setCustomerEmail(found.email);
        setCustomerType(found.type);
      }
    }
  };

  // Handle Tour Package Selection
  const handleTourPackageChange = (e) => {
    const pkgId = e.target.value;
    setSelectedTourPackageId(pkgId);
    const found = tourPackages.find((p) => p.id === pkgId);
    if (found) {
      if (found.destination) setDestination(found.destination);
      if (found.pickupLocation && !pickupLocation) setPickupLocation(found.pickupLocation);
      const count = Math.max(1, parseInt(passengerCount, 10) || 1);
      const rate = getPackagePricePerPerson(found);
      if (rate > 0) {
        setBookingAmount(rate * count);
      }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!journeyDate) {
      toast.error('Please select a journey departure date');
      return;
    }

    if (journeyDate < todayStr) {
      toast.error('Journey departure date cannot be in the past. Please select today or a future date.');
      return;
    }

    if (bookingCategory === 'Round Trip' && returnDate && returnDate < journeyDate) {
      toast.error('Return journey date cannot be earlier than departure date.');
      return;
    }

    let assignedVehObj = null;
    if (selectedVehicle) {
      const isCompany = !isVendorVehicle;
      assignedVehObj = {
        id: selectedVehicle.id || selectedVehicle._id || selectedVehicle.regNo,
        brand: selectedVehicle.brand || '',
        model: selectedVehicle.model || selectedVehicle.name || '',
        name: selectedVehicle.model || selectedVehicle.name || '',
        regNo: selectedVehicle.regNo || selectedVehicle.numberPlate || '',
        numberPlate: selectedVehicle.regNo || selectedVehicle.numberPlate || '',
        category: selectedVehicle.category || 'SUV',
        seating: selectedVehicle.seating || '7+1',
        fuelType: selectedVehicle.fuelType || 'Diesel',
        status: 'Reserved',
        ratePerKm: selectedVehicle.ratePerKm || selectedVehicle.pricePerKm || 0,
        pricePerKm: selectedVehicle.pricePerKm || selectedVehicle.ratePerKm || 0,
        driverAllowance: selectedVehicle.driverAllowance || 0,
        image: selectedVehicle.image || '',
        ownership: selectedVehicle.ownership || (isCompany ? 'MAK Owned' : 'Vendor Attached'),
        isVendorVehicle,
        vendorId: selectedVehicle.vendorId || null,
        vendorName: selectedVehicle.vendorName || null,
        vendorPayoutPercent: isVendorVehicle ? Number(vendorPayoutPercent) : null,
        vendorPayableAmount: isVendorVehicle ? Number(vendorPayableAmount) : 0
      };
    }

    const selectedDriver = drivers.find(
      (d) => d.id === selectedDriverId || d._id === selectedDriverId || d.driverId === selectedDriverId || d.driverBadgeId === selectedDriverId
    );
    let assignedDriverObj = null;
    if (selectedDriver) {
      const conflict = getDriverLeaveConflict(selectedDriver, journeyDate, returnDate || journeyDate, allDriverLeaves);
      if (conflict) {
        toast.error(`Cannot create booking: Driver ${selectedDriver.name || selectedDriver.fullName} is on leave on the trip start date (${formatDateDMY(journeyDate)}). Please choose another driver or assign later.`);
        return;
      }
      assignedDriverObj = {
        id: selectedDriver.id || selectedDriver._id || selectedDriver.driverBadgeId,
        name: selectedDriver.name || selectedDriver.fullName,
        fullName: selectedDriver.fullName || selectedDriver.name,
        phone: selectedDriver.phone || '',
        photo: selectedDriver.photo || selectedDriver.avatar || '',
        licenseNumber: selectedDriver.licenseNumber || selectedDriver.drivingLicenseNumber || '',
        status: 'Assigned'
      };
    }

    const selectedPkg = tourPackages.find((p) => p.id === selectedTourPackageId);

    const newBooking = addBooking({
      customerName,
      customerPhone,
      customerEmail,
      customerType,
      bookingCategory,
      pickupLocation,
      destination,
      journeyDate,
      journeyTime,
      returnDate: bookingCategory === 'Round Trip' ? returnDate : null,
      tourPackageId: bookingCategory === 'Tour Package' ? selectedTourPackageId : null,
      tourPackageName: bookingCategory === 'Tour Package' ? selectedPkg?.name : null,
      vehicleId: assignedVehObj ? (assignedVehObj.regNo || assignedVehObj.id) : null,
      vehicleName: assignedVehObj ? `${assignedVehObj.brand} ${assignedVehObj.model} (${assignedVehObj.regNo})`.trim() : null,
      assignedVehicle: assignedVehObj,
      driverId: assignedDriverObj ? assignedDriverObj.id : null,
      driverName: assignedDriverObj ? (assignedDriverObj.name || assignedDriverObj.fullName) : null,
      assignedDriver: assignedDriverObj,
      driverCompensationAmount: Number(driverCompensationAmount),
      driverBaseTripPay: Number(driverCompensationAmount),
      vendorPayoutPercent: isVendorVehicle ? Number(vendorPayoutPercent) : null,
      vendorPayableAmount: isVendorVehicle ? Number(vendorPayableAmount) : 0,
      passengerCount: Number(passengerCount),
      bookingAmount: Number(bookingAmount),
      advancePaid: effectiveAdvancePaid,
      additionalCharges: Number(additionalCharges),
      totalAmount,
      balanceAmount: balanceDue,
      paymentOption,
      paymentType: effectivePaymentType,
      paymentStatus: effectivePaymentStatus,
      paymentMethod: paymentOption === 'pay_on_departure' ? 'Pay on Departure' : paymentMethod,
      bookingStatus: (assignedVehObj && assignedDriverObj) ? 'Confirmed' : 'Pending',
      status: (assignedVehObj && assignedDriverObj) ? 'Confirmed' : 'Pending',
      tripStatus: assignedDriverObj ? 'Awaiting Driver Acceptance' : 'Upcoming',
      driverAssignmentStatus: assignedDriverObj ? 'Assigned' : 'Unassigned',
      notes
    });

    const targetNavId = newBooking?.bookingNumber || newBooking?.id || newBooking?.refId;
    if (targetNavId) {
      navigate(`/admin/bookings/${targetNavId}`);
    } else {
      navigate('/admin/bookings');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: '1000px', margin: '0 auto' }}>
      {/* Top Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: 'var(--bg-surface, #ffffff)',
          padding: '1.25rem 1.5rem',
          borderRadius: '16px',
          border: '1px solid var(--border-light, #e2e8f0)',
          boxShadow: 'var(--shadow-sm)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Button variant="ghost" onClick={() => navigate('/admin/bookings')} style={{ padding: '0.5rem' }}>
            <ArrowLeft size={18} />
          </Button>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main, #090d16)', margin: 0 }}>
              Create Travel Booking
            </h1>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted, #64748b)', margin: '0.25rem 0 0' }}>
              Dispatch a new driver-assigned journey with live fleet scheduling.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {/* Step 1: Category & Customer */}
        <Card>
          <CardHeader title="1. Journey Category & Customer Information" subtitle="Select journey model and passenger details" />
          <CardBody style={{ padding: '1.25rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
              {/* Category Dropdown (NO ONE WAY TRIP) */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, marginBottom: '0.375rem', color: 'var(--text-main, #090d16)' }}>
                  Booking Category *
                </label>
                <select
                  required
                  value={bookingCategory}
                  onChange={(e) => {
                    const newCat = e.target.value;
                    setBookingCategory(newCat);
                    if (newCat === 'Tour Package' && selectedTourPackage) {
                      const count = Math.max(1, parseInt(passengerCount, 10) || 1);
                      const rate = getPackagePricePerPerson(selectedTourPackage);
                      if (rate > 0) setBookingAmount(rate * count);
                    }
                  }}
                  style={{
                    width: '100%',
                    padding: '0.625rem 0.75rem',
                    fontSize: '0.8125rem',
                    borderRadius: '8px',
                    border: '1.5px solid var(--color-primary, #2C3480)',
                    backgroundColor: '#EEF0FD',
                    fontWeight: 700,
                    color: '#2C3480'
                  }}
                >
                  {bookingCategories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
                <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted, #64748b)', marginTop: '0.25rem', display: 'block' }}>
                  Choose from Round Trip, Local Trip, Tour Package, Airport Transfer, or Custom Journey.
                </span>
              </div>

              {/* Customer Selector */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.375rem', color: 'var(--text-main, #090d16)' }}>
                  Existing Customer
                </label>
                <select
                  value={selectedCustomerId}
                  onChange={handleCustomerChange}
                  style={{
                    width: '100%',
                    padding: '0.625rem 0.75rem',
                    fontSize: '0.8125rem',
                    borderRadius: '8px',
                    border: '1px solid var(--border-medium, #cbd5e1)',
                    backgroundColor: 'var(--bg-surface, #ffffff)'
                  }}
                >
                  <option value="">-- Select from Database or enter new --</option>
                  <option value="new">+ Enter New Customer Details</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.type}) - {c.phone}
                    </option>
                  ))}
                </select>
              </div>

              {/* Customer Name */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.375rem' }}>
                  Customer Name *
                </label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g. Rajesh Sharma"
                  style={{
                    width: '100%',
                    padding: '0.625rem 0.75rem',
                    fontSize: '0.8125rem',
                    borderRadius: '8px',
                    border: '1px solid var(--border-medium, #cbd5e1)',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Customer Phone */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.375rem' }}>
                  Contact Phone Number *
                </label>
                <input
                  type="tel"
                  required
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="+91 98450 12345"
                  style={{
                    width: '100%',
                    padding: '0.625rem 0.75rem',
                    fontSize: '0.8125rem',
                    borderRadius: '8px',
                    border: '1px solid var(--border-medium, #cbd5e1)',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Customer Email */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.375rem' }}>
                  Customer Email
                </label>
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="passenger@example.com"
                  style={{
                    width: '100%',
                    padding: '0.625rem 0.75rem',
                    fontSize: '0.8125rem',
                    borderRadius: '8px',
                    border: '1px solid var(--border-medium, #cbd5e1)',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Passenger Count */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.375rem' }}>
                  Passenger Count
                </label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={passengerCount}
                  onChange={(e) => {
                    const val = e.target.value;
                    setPassengerCount(val);
                    if (bookingCategory === 'Tour Package' && selectedTourPackage) {
                      const count = Math.max(1, parseInt(val, 10) || 1);
                      const rate = getPackagePricePerPerson(selectedTourPackage);
                      if (rate > 0) {
                        setBookingAmount(rate * count);
                      }
                    }
                  }}
                  style={{
                    width: '100%',
                    padding: '0.625rem 0.75rem',
                    fontSize: '0.8125rem',
                    borderRadius: '8px',
                    border: '1px solid var(--border-medium, #cbd5e1)',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Step 2: Route & Conditional Fields */}
        <Card>
          <CardHeader title="2. Journey Routing & Dates" subtitle="Pickup point, destination, and conditional schedule" />
          <CardBody style={{ padding: '1.25rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
              {/* Pickup Location */}
              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.375rem' }}>
                  Pickup Location &amp; Landmark *
                </label>
                <input
                  type="text"
                  required
                  value={pickupLocation}
                  onChange={(e) => setPickupLocation(e.target.value)}
                  placeholder="e.g. Indiranagar 100ft Road, Bengaluru or BLR Airport T1"
                  style={{
                    width: '100%',
                    padding: '0.625rem 0.75rem',
                    fontSize: '0.8125rem',
                    borderRadius: '8px',
                    border: '1px solid var(--border-medium, #cbd5e1)',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Conditional: Tour Package Dropdown (ONLY if category is Tour Package) */}
              {bookingCategory === 'Tour Package' && (
                <div style={{ gridColumn: 'span 2' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.375rem' }}>
                    <label style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#047857' }}>
                      Select Tour Package Circuit *
                    </label>
                    <span style={{ fontSize: '0.6875rem', color: '#047857', fontWeight: 700 }}>
                      Individual per-person rates apply
                    </span>
                  </div>
                  <select
                    required
                    value={selectedTourPackageId}
                    onChange={handleTourPackageChange}
                    style={{
                      width: '100%',
                      padding: '0.625rem 0.75rem',
                      fontSize: '0.8125rem',
                      borderRadius: '8px',
                      border: '1.5px solid #10B981',
                      backgroundColor: '#ECFDF5',
                      fontWeight: 600,
                      color: '#065F46'
                    }}
                  >
                    <option value="">-- Choose Curated Tour Package --</option>
                    {tourPackages.map((p) => {
                      const rate = getPackagePricePerPerson(p);
                      const duration = getPackageDurationLabel(p);
                      return (
                        <option key={p.id} value={p.id}>
                          {p.name} {duration ? `(${duration})` : ''} — ₹{rate.toLocaleString('en-IN')} / person
                        </option>
                      );
                    })}
                  </select>

                  {/* Calculation Breakdown Pill */}
                  {selectedTourPackage && packagePerPersonRate > 0 && (
                    <div
                      style={{
                        marginTop: '0.625rem',
                        padding: '0.75rem 1rem',
                        backgroundColor: '#F0FDF4',
                        border: '1.5px solid #86EFAC',
                        borderRadius: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '0.75rem'
                      }}
                    >
                      <div>
                        <span style={{ fontSize: '0.7rem', color: '#166534', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block' }}>
                          PACKAGE RATE PER INDIVIDUAL PERSON
                        </span>
                        <span style={{ fontSize: '1.05rem', fontWeight: 800, color: '#15803D' }}>
                          ₹{packagePerPersonRate.toLocaleString('en-IN')} <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#166534' }}>/ individual person</span>
                        </span>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '0.7rem', color: '#166534', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block' }}>
                          AUTO-CALCULATED FARE ({Math.max(1, parseInt(passengerCount, 10) || 1)} PASSENGER{(Math.max(1, parseInt(passengerCount, 10) || 1)) > 1 ? 'S' : ''})
                        </span>
                        <span style={{ fontSize: '1.25rem', fontWeight: 900, color: '#15803D' }}>
                          ₹{(packagePerPersonRate * Math.max(1, parseInt(passengerCount, 10) || 1)).toLocaleString('en-IN')}
                        </span>
                        <span style={{ fontSize: '0.7rem', color: '#166534', display: 'block' }}>
                          (₹{packagePerPersonRate.toLocaleString('en-IN')} × {Math.max(1, parseInt(passengerCount, 10) || 1)})
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Destination */}
              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.375rem' }}>
                  Destination / Drop Location *
                </label>
                <input
                  type="text"
                  required
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder="e.g. Mysore Palace & Heritage Tour or Ooty Botanical Garden"
                  style={{
                    width: '100%',
                    padding: '0.625rem 0.75rem',
                    fontSize: '0.8125rem',
                    borderRadius: '8px',
                    border: '1px solid var(--border-medium, #cbd5e1)',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Departure Date */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.375rem' }}>
                  Journey Departure Date *
                </label>
                <input
                  type="date"
                  required
                  min={todayStr}
                  value={journeyDate}
                  onChange={(e) => {
                    const val = e.target.value;
                    setJourneyDate(val);
                    if (returnDate && returnDate < val) {
                      setReturnDate(val);
                    }
                  }}
                  style={{
                    width: '100%',
                    padding: '0.625rem 0.75rem',
                    fontSize: '0.8125rem',
                    borderRadius: '8px',
                    border: '1px solid var(--border-medium, #cbd5e1)',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Departure Time */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.375rem' }}>
                  Departure Pickup Time *
                </label>
                <input
                  type="text"
                  required
                  value={journeyTime}
                  onChange={(e) => setJourneyTime(e.target.value)}
                  placeholder="e.g. 06:00 AM"
                  style={{
                    width: '100%',
                    padding: '0.625rem 0.75rem',
                    fontSize: '0.8125rem',
                    borderRadius: '8px',
                    border: '1px solid var(--border-medium, #cbd5e1)',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Conditional: Return Date (ONLY for Round Trip) */}
              {bookingCategory === 'Round Trip' && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, marginBottom: '0.375rem', color: '#2C3480' }}>
                    Return Journey Date *
                  </label>
                  <input
                    type="date"
                    required
                    min={journeyDate || todayStr}
                    value={returnDate}
                    onChange={(e) => setReturnDate(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.625rem 0.75rem',
                      fontSize: '0.8125rem',
                      borderRadius: '8px',
                      border: '1.5px solid #2C3480',
                      boxSizing: 'border-box',
                      backgroundColor: '#EEF0FD'
                    }}
                  />
                  <span style={{ fontSize: '0.6875rem', color: '#2C3480', marginTop: '0.25rem', display: 'block' }}>
                    Required for Round Trip vehicle reservation
                  </span>
                </div>
              )}
            </div>
          </CardBody>
        </Card>

        {/* Step 3: Vehicle, Driver & Financials */}
        <Card>
          <CardHeader title="3. Fleet Assignment & Billing" subtitle="Driver duty allocation, vendor pricing & payment terms" />
          <CardBody style={{ padding: '1.25rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
              {/* Vehicle Selection */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.375rem' }}>
                  Assign Vehicle
                </label>
                <select
                  value={selectedVehicleId}
                  onChange={(e) => handleVehicleChange(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.625rem 0.75rem',
                    fontSize: '0.8125rem',
                    borderRadius: '8px',
                    border: '1px solid var(--border-medium, #cbd5e1)',
                    backgroundColor: 'var(--bg-surface, #ffffff)'
                  }}
                >
                  <option value="">-- Assign Later --</option>
                  {vehicles.map((v) => {
                    const vehVal = v.id || v._id || v.regNo;
                    const isVen = Boolean(v.vendorId || v.ownership === 'Vendor Attached' || v.ownership === 'Vendor Owned');
                    return (
                      <option key={vehVal} value={vehVal}>
                        {v.brand} {v.model || v.name} ({v.regNo || v.numberPlate}) • {isVen ? `Vendor (${v.vendorName || 'Attached'})` : 'MAK Owned'} - {v.status}
                      </option>
                    );
                  })}
                </select>

                {selectedVehicle && (
                  <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', padding: '0.35rem 0.65rem', borderRadius: '6px', backgroundColor: isVendorVehicle ? '#fef3c7' : '#dcfce7', color: isVendorVehicle ? '#92400e' : '#166534', fontWeight: 700 }}>
                    {isVendorVehicle ? `🤝 Vendor Vehicle: ${selectedVehicle.vendorName || 'Attached Partner'}` : '🏢 Company Fleet Vehicle (MAK Owned)'}
                  </div>
                )}
              </div>

              {/* Vendor Payout Fields (Shown when a vendor car is chosen) */}
              {isVendorVehicle && (
                <div style={{ gridColumn: 'span 2', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', backgroundColor: '#fffbeb', border: '1.5px solid #fde68a', borderRadius: '10px', padding: '0.875rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#92400e', marginBottom: '0.25rem' }}>
                      Vendor Partner Name
                    </label>
                    <input
                      type="text"
                      readOnly
                      value={selectedVehicle?.vendorName || 'Attached Vendor Partner'}
                      style={{ width: '100%', padding: '0.5rem 0.75rem', fontSize: '0.8125rem', borderRadius: '6px', border: '1px solid #fcd34d', backgroundColor: '#fef3c7', fontWeight: 700, color: '#78350f' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#92400e', marginBottom: '0.25rem' }}>
                      Vendor Payout %
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={vendorPayoutPercent}
                      onChange={(e) => handleVendorPercentChange(e.target.value)}
                      style={{ width: '100%', padding: '0.5rem 0.75rem', fontSize: '0.8125rem', borderRadius: '6px', border: '1px solid #fcd34d', backgroundColor: '#ffffff', fontWeight: 700, color: '#78350f' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#92400e', marginBottom: '0.25rem' }}>
                      Vendor Payable Amount (₹)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={vendorPayableAmount}
                      onChange={(e) => setVendorPayableAmount(Number(e.target.value))}
                      style={{ width: '100%', padding: '0.5rem 0.75rem', fontSize: '0.8125rem', borderRadius: '6px', border: '1px solid #fcd34d', backgroundColor: '#ffffff', fontWeight: 800, color: '#b45309' }}
                    />
                    <span style={{ fontSize: '0.6875rem', color: '#92400e', marginTop: '0.2rem', display: 'block' }}>
                      Auto-calculated from total fare (₹{totalAmount.toLocaleString('en-IN')})
                    </span>
                  </div>
                </div>
              )}

              {/* Driver Selection */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.375rem' }}>
                  <label style={{ fontSize: '0.8125rem', fontWeight: 600 }}>
                    Assign Driver
                  </label>
                  <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                    Trip Start Date: <strong style={{ color: '#0f172a' }}>{formatDateDMY(journeyDate)}</strong>
                  </span>
                </div>
                <select
                  value={selectedDriverId}
                  onChange={(e) => handleDriverChange(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.625rem 0.75rem',
                    fontSize: '0.8125rem',
                    borderRadius: '8px',
                    border: '1px solid var(--border-medium, #cbd5e1)',
                    backgroundColor: 'var(--bg-surface, #ffffff)'
                  }}
                >
                  <option value="">-- Assign Later --</option>

                  <optgroup label="Available Drivers (Ready for Duty)">
                    {availableDrivers.map((d) => {
                      const drvVal = d.id || d._id || d.driverBadgeId;
                      const tripRate = d.perTripRate || d.tripRate || d.salaryStructure?.perTripRate || 1500;
                      return (
                        <option key={drvVal} value={drvVal}>
                          ✓ {d.name || d.fullName} ({d.phone}) • ₹{tripRate.toLocaleString('en-IN')}/trip - Available
                        </option>
                      );
                    })}
                  </optgroup>

                  {onLeaveDrivers.length > 0 && (
                    <optgroup label="Unavailable Drivers (On Leave - Cannot Assign on Trip Date)">
                      {onLeaveDrivers.map((d) => {
                        const drvVal = d.id || d._id || d.driverBadgeId;
                        const leaveInfo = d.leaveConflict;
                        return (
                          <option
                            key={drvVal}
                            value={drvVal}
                            disabled
                            style={{ color: '#94a3b8', backgroundColor: '#fef2f2' }}
                          >
                            ⛔ {d.name || d.fullName} ({d.phone}) • [ON LEAVE: {formatDateDMY(leaveInfo.startDate)} to {formatDateDMY(leaveInfo.endDate)}] - Cannot Assign
                          </option>
                        );
                      })}
                    </optgroup>
                  )}
                </select>

                {/* Driver on Leave Notice Alert */}
                {onLeaveDrivers.length > 0 && (
                  <div style={{ marginTop: '0.4rem', padding: '0.45rem 0.75rem', backgroundColor: '#fff7ed', border: '1px solid #fed7aa', borderRadius: '6px', fontSize: '0.73rem', color: '#9a3412', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <AlertCircle size={15} style={{ color: '#ea580c', flexShrink: 0 }} />
                    <span>
                      <strong>{onLeaveDrivers.map((d) => d.name || d.fullName).join(', ')}</strong> {onLeaveDrivers.length === 1 ? 'is' : 'are'} on leave on trip start date (<strong>{formatDateDMY(journeyDate)}</strong>) and cannot be assigned.
                    </span>
                  </div>
                )}
              </div>

              {/* Driver Trip Pay (Editable) */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.375rem' }}>
                  <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#166534' }}>
                    Driver Trip Pay (₹)
                  </label>
                  <span style={{ fontSize: '0.6875rem', color: '#166534', fontWeight: 700 }}>
                    Auto-set from Driver • Editable
                  </span>
                </div>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', fontWeight: 800, color: '#166534' }}>
                    ₹
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    value={driverCompensationAmount}
                    onChange={(e) => setDriverCompensationAmount(Number(e.target.value))}
                    style={{
                      width: '100%',
                      padding: '0.625rem 0.75rem 0.625rem 1.85rem',
                      fontSize: '0.8125rem',
                      fontWeight: 700,
                      borderRadius: '8px',
                      border: '1.5px solid #86EFAC',
                      backgroundColor: '#F0FDF4',
                      color: '#15803D',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              {/* Base Fare */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.375rem' }}>
                  <label style={{ fontSize: '0.8125rem', fontWeight: 600 }}>
                    Base Booking Amount (₹) *
                  </label>
                  {bookingCategory === 'Tour Package' && selectedTourPackage && packagePerPersonRate > 0 && (
                    <span style={{ fontSize: '0.6875rem', color: '#15803D', fontWeight: 700 }}>
                      Auto-calculated: ₹{packagePerPersonRate.toLocaleString('en-IN')} × {Math.max(1, parseInt(passengerCount, 10) || 1)}
                    </span>
                  )}
                </div>
                <input
                  type="number"
                  required
                  min="0"
                  value={bookingAmount}
                  onChange={(e) => setBookingAmount(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.625rem 0.75rem',
                    fontSize: '0.8125rem',
                    borderRadius: '8px',
                    border: bookingCategory === 'Tour Package' && selectedTourPackage ? '1.5px solid #86EFAC' : '1px solid var(--border-medium, #cbd5e1)',
                    backgroundColor: bookingCategory === 'Tour Package' && selectedTourPackage ? '#F0FDF4' : '#ffffff',
                    color: bookingCategory === 'Tour Package' && selectedTourPackage ? '#15803D' : '#0f172a',
                    boxSizing: 'border-box',
                    fontWeight: 700
                  }}
                />
                {bookingCategory === 'Tour Package' && selectedTourPackage && packagePerPersonRate > 0 && (
                  <span style={{ fontSize: '0.6875rem', color: '#166534', marginTop: '0.25rem', display: 'block', fontWeight: 600 }}>
                    Auto-calculated for {selectedTourPackage.name} (₹{packagePerPersonRate.toLocaleString('en-IN')} / individual person)
                  </span>
                )}
              </div>

              {/* Additional Charges (Toll/Batta) */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.375rem' }}>
                  Toll &amp; Fastag Permit Charges (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  value={additionalCharges}
                  onChange={(e) => setAdditionalCharges(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.625rem 0.75rem',
                    fontSize: '0.8125rem',
                    borderRadius: '8px',
                    border: '1px solid var(--border-medium, #cbd5e1)',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Payment Settlement Options */}
              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, marginBottom: '0.5rem', color: '#0f172a' }}>
                  Payment Terms &amp; Advance Collection *
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setPaymentOption('pay_on_departure');
                      setAdvancePaid(0);
                    }}
                    style={{
                      padding: '0.75rem 1rem',
                      borderRadius: '10px',
                      border: paymentOption === 'pay_on_departure' ? '2px solid #2C3480' : '1px solid #cbd5e1',
                      backgroundColor: paymentOption === 'pay_on_departure' ? '#EEF0FD' : '#ffffff',
                      textAlign: 'left',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ fontWeight: 800, fontSize: '0.85rem', color: paymentOption === 'pay_on_departure' ? '#2C3480' : '#334155' }}>
                      ₹0 (Pay on Departure)
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.2rem' }}>
                      Collect 100% at trip start / end (Unpaid)
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setPaymentOption('partial_advance');
                      if (advancePaid <= 0) setAdvancePaid(Math.round(totalAmount * 0.3) || 5000);
                    }}
                    style={{
                      padding: '0.75rem 1rem',
                      borderRadius: '10px',
                      border: paymentOption === 'partial_advance' ? '2px solid #2563eb' : '1px solid #cbd5e1',
                      backgroundColor: paymentOption === 'partial_advance' ? '#eff6ff' : '#ffffff',
                      textAlign: 'left',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ fontWeight: 800, fontSize: '0.85rem', color: paymentOption === 'partial_advance' ? '#2563eb' : '#334155' }}>
                      Partial Advance Paid
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.2rem' }}>
                      Customer paid token/advance deposit
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setPaymentOption('fully_paid');
                      setAdvancePaid(totalAmount);
                    }}
                    style={{
                      padding: '0.75rem 1rem',
                      borderRadius: '10px',
                      border: paymentOption === 'fully_paid' ? '2px solid #16a34a' : '1px solid #cbd5e1',
                      backgroundColor: paymentOption === 'fully_paid' ? '#f0fdf4' : '#ffffff',
                      textAlign: 'left',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ fontWeight: 800, fontSize: '0.85rem', color: paymentOption === 'fully_paid' ? '#16a34a' : '#334155' }}>
                      100% Fully Paid
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.2rem' }}>
                      Total booking amount settled in full
                    </div>
                  </button>
                </div>
              </div>

              {/* Conditional Advance Amount Field */}
              {paymentOption === 'partial_advance' && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#2563eb', marginBottom: '0.375rem' }}>
                    Advance Payment Received (₹) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={totalAmount}
                    value={advancePaid}
                    onChange={(e) => setAdvancePaid(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.625rem 0.75rem',
                      fontSize: '0.8125rem',
                      borderRadius: '8px',
                      border: '1.5px solid #60a5fa',
                      backgroundColor: '#eff6ff',
                      fontWeight: 800,
                      color: '#1e40af',
                      boxSizing: 'border-box'
                    }}
                  />
                  <span style={{ fontSize: '0.6875rem', color: '#2563eb', marginTop: '0.2rem', display: 'block' }}>
                    Balance of ₹{balanceDue.toLocaleString('en-IN')} due upon departure
                  </span>
                </div>
              )}

              {/* Payment Method - only asked when money is collected (advance or full settlement) */}
              {paymentOption !== 'pay_on_departure' && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.375rem' }}>
                    Payment Method *
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.625rem 0.75rem',
                      fontSize: '0.8125rem',
                      borderRadius: '8px',
                      border: '1px solid var(--border-medium, #cbd5e1)',
                      backgroundColor: 'var(--bg-surface, #ffffff)'
                    }}
                  >
                    <option value="UPI / QR">UPI / QR Code</option>
                    <option value="Cash">Cash in Hand</option>
                    <option value="Credit / Debit Card">Credit / Debit Card</option>
                    <option value="NEFT / Net Banking">NEFT / Net Banking</option>
                  </select>
                </div>
              )}

              {/* Live Financial Settlement Summary Strip */}
              <div style={{ gridColumn: 'span 2', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1rem' }}>
                <div>
                  <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748b' }}>TOTAL TRIP FARE</div>
                  <div style={{ fontSize: '1.3rem', fontWeight: 900, color: '#2C3480', marginTop: '0.15rem' }}>
                    ₹{totalAmount.toLocaleString('en-IN')}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#16a34a' }}>ADVANCE PAID</div>
                  <div style={{ fontSize: '1.3rem', fontWeight: 900, color: '#15803d', marginTop: '0.15rem' }}>
                    ₹{effectiveAdvancePaid.toLocaleString('en-IN')}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#b45309' }}>BALANCE DUE</div>
                  <div style={{ fontSize: '1.3rem', fontWeight: 900, color: '#b45309', marginTop: '0.15rem' }}>
                    ₹{balanceDue.toLocaleString('en-IN')}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748b' }}>SETTLEMENT STATUS</div>
                  <div style={{ marginTop: '0.25rem' }}>
                    <span style={{
                      display: 'inline-block',
                      padding: '0.25rem 0.65rem',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      backgroundColor: effectivePaymentStatus === 'Paid' ? '#dcfce7' : effectivePaymentStatus === 'Partially Paid' ? '#dbeafe' : '#fef3c7',
                      color: effectivePaymentStatus === 'Paid' ? '#15803d' : effectivePaymentStatus === 'Partially Paid' ? '#1e40af' : '#92400e'
                    }}>
                      {effectivePaymentStatus}
                    </span>
                  </div>
                </div>
              </div>

              {/* Admin Notes */}
              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.375rem' }}>
                  Internal Dispatcher Notes
                </label>
                <textarea
                  rows="3"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Special passenger requests, flight timings, luggage count, child seat..."
                  style={{
                    width: '100%',
                    padding: '0.625rem 0.75rem',
                    fontSize: '0.8125rem',
                    borderRadius: '8px',
                    border: '1px solid var(--border-medium, #cbd5e1)',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Action Button Row */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          <Button variant="ghost" onClick={() => navigate('/admin/bookings')}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" leftIcon={<Save size={16} />}>
            Create &amp; Dispatch Booking
          </Button>
        </div>
      </form>
    </div>
  );
}

export default BookingCreate;
