// MAK Tours & Travels ERP - Edit Travel Booking
// CRITICAL: ONE WAY TRIP MUST NOT EXIST ANYWHERE IN THIS APPLICATION.
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, AlertCircle } from 'lucide-react';
import { Card, CardHeader, CardBody } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { useAdminData } from '../../../context/AdminDataContext';
import { useToast } from '../../../context/ToastContext';
import { bookingCategories, bookingStatuses, paymentStatuses } from '../../../data';

export function BookingEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { bookings, updateBooking, vehicles, drivers, tourPackages = [] } = useAdminData();

  const getTodayStr = () => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };
  const todayStr = getTodayStr();

  const booking = bookings.find((b) => b.id === id);

  const [bookingCategory, setBookingCategory] = useState('');
  const [selectedTourPackageId, setSelectedTourPackageId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [pickupLocation, setPickupLocation] = useState('');
  const [destination, setDestination] = useState('');
  const [journeyDate, setJourneyDate] = useState('');
  const [journeyTime, setJourneyTime] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [selectedDriverId, setSelectedDriverId] = useState('');
  const [driverCompensationAmount, setDriverCompensationAmount] = useState(1500);
  const [passengerCount, setPassengerCount] = useState(4);
  const [bookingAmount, setBookingAmount] = useState(0);
  const [advancePaid, setAdvancePaid] = useState(0);
  const [additionalCharges, setAdditionalCharges] = useState(0);
  const [bookingStatus, setBookingStatus] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('');
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

  const selectedTourPackage = (tourPackages || []).find((p) => p.id === selectedTourPackageId) || null;
  const packagePerPersonRate = getPackagePricePerPerson(selectedTourPackage);

  const handleTourPackageChange = (pkgId) => {
    setSelectedTourPackageId(pkgId);
    const found = (tourPackages || []).find((p) => p.id === pkgId);
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

  const handlePassengerCountChange = (val) => {
    setPassengerCount(val);
    if (bookingCategory === 'Tour Package' && selectedTourPackage) {
      const count = Math.max(1, parseInt(val, 10) || 1);
      const rate = getPackagePricePerPerson(selectedTourPackage);
      if (rate > 0) {
        setBookingAmount(rate * count);
      }
    }
  };

  const handleDriverChange = (driverId) => {
    setSelectedDriverId(driverId);
    if (driverId) {
      const chosen = (drivers || []).find(
        (d) => d.id === driverId || d.driverId === driverId || d.driverBadgeId === driverId
      );
      if (chosen) {
        const rate =
          chosen.perTripRate ||
          chosen.tripRate ||
          chosen.salaryStructure?.perTripRate ||
          1500;
        setDriverCompensationAmount(Number(rate));
      }
    }
  };

  useEffect(() => {
    if (booking) {
      const rawCat = booking.bookingCategory || booking.category || booking.bookingType || 'Round Trip';
      setBookingCategory((!rawCat || rawCat.toLowerCase().includes('one way')) ? 'Round Trip' : rawCat);
      setSelectedTourPackageId(
        booking.tourPackageId ||
        booking.packageId ||
        (tourPackages || []).find((p) => p.name === booking.packageName || p.name === booking.tourPackageName)?.id ||
        ''
      );
      setCustomerName(booking.customerName || booking.fullName || '');
      setCustomerPhone(booking.customerPhone || booking.mobileNumber || '');
      setCustomerEmail(booking.customerEmail || '');
      setPickupLocation(booking.pickupLocation || '');
      setDestination(booking.destination || '');
      setJourneyDate(booking.journeyDate || '');
      setJourneyTime(booking.journeyTime || '');
      setReturnDate(booking.returnDate || '');
      setSelectedVehicleId(booking.vehicleId || '');
      setSelectedDriverId(booking.driverId || '');
      setDriverCompensationAmount(booking.driverCompensationAmount || 1500);
      setPassengerCount(booking.passengerCount || 4);
      setBookingAmount(booking.bookingAmount || 0);
      setAdvancePaid(booking.advancePaid || 0);
      setAdditionalCharges(booking.additionalCharges || 0);
      setBookingStatus(booking.bookingStatus || 'Confirmed');
      setPaymentStatus(booking.paymentStatus || 'Partially Paid');
      setNotes(booking.notes || '');
    }
  }, [booking, tourPackages]);

  if (!booking) {
    return (
      <Card style={{ padding: '3rem', textAlign: 'center' }}>
        <h2>Booking Not Found</h2>
        <Button variant="primary" onClick={() => navigate('/admin/bookings')}>
          Back to Bookings
        </Button>
      </Card>
    );
  }

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!journeyDate) {
      toast?.error ? toast.error('Journey date is required') : alert('Journey date is required');
      return;
    }

    if (journeyDate < todayStr) {
      toast?.error ? toast.error('Journey departure date cannot be in the past. Please select today or a future date.') : alert('Journey departure date cannot be in the past.');
      return;
    }

    if (bookingCategory === 'Round Trip' && returnDate && returnDate < journeyDate) {
      toast?.error ? toast.error('Return date cannot be earlier than journey departure date.') : alert('Return date cannot be earlier than departure date.');
      return;
    }

    const selectedVehicle = vehicles.find((v) => v.id === selectedVehicleId);
    const selectedDriver = drivers.find((d) => d.id === selectedDriverId);
    const totalAmount = Number(bookingAmount) + Number(additionalCharges || 0);

    updateBooking(booking.id, {
      customerName,
      fullName: customerName,
      name: customerName,
      customerPhone,
      mobileNumber: customerPhone,
      phone: customerPhone,
      customerEmail,
      email: customerEmail,
      bookingCategory,
      tourPackageId: bookingCategory === 'Tour Package' ? selectedTourPackageId : null,
      tourPackageName: bookingCategory === 'Tour Package' ? selectedTourPackage?.name : null,
      packageName: bookingCategory === 'Tour Package' ? selectedTourPackage?.name : null,
      packageId: bookingCategory === 'Tour Package' ? selectedTourPackageId : null,
      pickupLocation,
      destination,
      journeyDate,
      journeyTime,
      returnDate: bookingCategory === 'Round Trip' ? returnDate : null,
      vehicleId: selectedVehicle?.id || null,
      vehicleName: selectedVehicle ? `${selectedVehicle.brand} ${selectedVehicle.model} (${selectedVehicle.regNo})` : null,
      driverId: selectedDriver?.id || null,
      driverName: selectedDriver ? `${selectedDriver.name} (${selectedDriver.phone})` : null,
      driverCompensationAmount: Number(driverCompensationAmount),
      passengerCount: Number(passengerCount),
      bookingAmount: Number(bookingAmount),
      advancePaid: Number(advancePaid),
      additionalCharges: Number(additionalCharges),
      totalAmount,
      bookingStatus,
      paymentStatus,
      notes
    });

    navigate(`/admin/bookings/${booking.id}`);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: '1000px', margin: '0 auto' }}>
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
          <Button variant="ghost" onClick={() => navigate(`/admin/bookings/${booking.id}`)} style={{ padding: '0.5rem' }}>
            <ArrowLeft size={18} />
          </Button>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main, #090d16)', margin: 0 }}>
              Edit Booking #{booking.id}
            </h1>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted, #64748b)', margin: '0.25rem 0 0' }}>
              Update manifest particulars, passenger roster, and vehicle assignment.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <Card>
          <CardHeader title="Customer & Category" subtitle="Passenger contact and authorized category" />
          <CardBody style={{ padding: '1.25rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, marginBottom: '0.375rem' }}>
                  Booking Category *
                </label>
                <select
                  required
                  value={bookingCategory}
                  onChange={(e) => setBookingCategory(e.target.value)}
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
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.375rem' }}>
                  Customer Name *
                </label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  style={{ width: '100%', padding: '0.625rem 0.75rem', fontSize: '0.8125rem', borderRadius: '8px', border: '1px solid var(--border-medium, #cbd5e1)', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.375rem' }}>
                  Phone Number *
                </label>
                <input
                  type="text"
                  required
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  style={{ width: '100%', padding: '0.625rem 0.75rem', fontSize: '0.8125rem', borderRadius: '8px', border: '1px solid var(--border-medium, #cbd5e1)', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.375rem' }}>
                  Email Address
                </label>
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  style={{ width: '100%', padding: '0.625rem 0.75rem', fontSize: '0.8125rem', borderRadius: '8px', border: '1px solid var(--border-medium, #cbd5e1)', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.375rem' }}>
                  Passenger Count
                </label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={passengerCount}
                  onChange={(e) => handlePassengerCountChange(e.target.value)}
                  style={{ width: '100%', padding: '0.625rem 0.75rem', fontSize: '0.8125rem', borderRadius: '8px', border: '1px solid var(--border-medium, #cbd5e1)', boxSizing: 'border-box' }}
                />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Routing & Dates" subtitle="Journey timing and checkpoints" />
          <CardBody style={{ padding: '1.25rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.375rem' }}>
                  Pickup Location *
                </label>
                <input
                  type="text"
                  required
                  value={pickupLocation}
                  onChange={(e) => setPickupLocation(e.target.value)}
                  style={{ width: '100%', padding: '0.625rem 0.75rem', fontSize: '0.8125rem', borderRadius: '8px', border: '1px solid var(--border-medium, #cbd5e1)', boxSizing: 'border-box' }}
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
                    onChange={(e) => handleTourPackageChange(e.target.value)}
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
                    {(tourPackages || []).map((p) => {
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

              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.375rem' }}>
                  Destination Location *
                </label>
                <input
                  type="text"
                  required
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  style={{ width: '100%', padding: '0.625rem 0.75rem', fontSize: '0.8125rem', borderRadius: '8px', border: '1px solid var(--border-medium, #cbd5e1)', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.375rem' }}>
                  Journey Date *
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
                  style={{ width: '100%', padding: '0.625rem 0.75rem', fontSize: '0.8125rem', borderRadius: '8px', border: '1px solid var(--border-medium, #cbd5e1)', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.375rem' }}>
                  Departure Time
                </label>
                <input
                  type="text"
                  value={journeyTime}
                  onChange={(e) => setJourneyTime(e.target.value)}
                  style={{ width: '100%', padding: '0.625rem 0.75rem', fontSize: '0.8125rem', borderRadius: '8px', border: '1px solid var(--border-medium, #cbd5e1)', boxSizing: 'border-box' }}
                />
              </div>

              {bookingCategory === 'Round Trip' && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, marginBottom: '0.375rem', color: '#2C3480' }}>
                    Return Date (Round Trip)
                  </label>
                  <input
                    type="date"
                    min={journeyDate || todayStr}
                    value={returnDate}
                    onChange={(e) => setReturnDate(e.target.value)}
                    style={{ width: '100%', padding: '0.625rem 0.75rem', fontSize: '0.8125rem', borderRadius: '8px', border: '1.5px solid #2C3480', backgroundColor: '#EEF0FD', boxSizing: 'border-box' }}
                  />
                </div>
              )}
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Assignments & Financials" subtitle="Vehicle, driver, and billing ledger" />
          <CardBody style={{ padding: '1.25rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.375rem' }}>
                  Assigned Vehicle
                </label>
                <select
                  value={selectedVehicleId}
                  onChange={(e) => setSelectedVehicleId(e.target.value)}
                  style={{ width: '100%', padding: '0.625rem 0.75rem', fontSize: '0.8125rem', borderRadius: '8px', border: '1px solid var(--border-medium, #cbd5e1)' }}
                >
                  <option value="">-- No Vehicle Assigned --</option>
                  {vehicles.map((v) => {
                    const vehVal = v.id || v._id || v.regNo;
                    return (
                      <option key={vehVal} value={vehVal}>
                        {v.brand} {v.model || v.name} ({v.regNo || v.numberPlate})
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.375rem' }}>
                  Assigned Driver
                </label>
                <select
                  value={selectedDriverId}
                  onChange={(e) => handleDriverChange(e.target.value)}
                  style={{ width: '100%', padding: '0.625rem 0.75rem', fontSize: '0.8125rem', borderRadius: '8px', border: '1px solid var(--border-medium, #cbd5e1)' }}
                >
                  <option value="">-- No Driver Assigned --</option>
                  {drivers.map((d) => {
                    const drvVal = d.id || d._id || d.driverBadgeId;
                    const tripRate = d.perTripRate || d.tripRate || d.salaryStructure?.perTripRate || 1500;
                    return (
                      <option key={drvVal} value={drvVal}>
                        {d.name || d.fullName} ({d.phone}) • ₹{tripRate.toLocaleString('en-IN')}/trip
                      </option>
                    );
                  })}
                </select>
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

              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.375rem' }}>
                  <label style={{ fontSize: '0.8125rem', fontWeight: 600 }}>
                    Base Amount (₹)
                  </label>
                  {bookingCategory === 'Tour Package' && selectedTourPackage && packagePerPersonRate > 0 && (
                    <span style={{ fontSize: '0.6875rem', color: '#15803D', fontWeight: 700 }}>
                      Auto-calculated: ₹{packagePerPersonRate.toLocaleString('en-IN')} × {Math.max(1, parseInt(passengerCount, 10) || 1)}
                    </span>
                  )}
                </div>
                <input
                  type="number"
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

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.375rem' }}>
                  Advance Paid (₹)
                </label>
                <input
                  type="number"
                  value={advancePaid}
                  onChange={(e) => setAdvancePaid(e.target.value)}
                  style={{ width: '100%', padding: '0.625rem 0.75rem', fontSize: '0.8125rem', borderRadius: '8px', border: '1px solid var(--border-medium, #cbd5e1)', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.375rem' }}>
                  Booking Status
                </label>
                <select
                  value={bookingStatus}
                  onChange={(e) => setBookingStatus(e.target.value)}
                  style={{ width: '100%', padding: '0.625rem 0.75rem', fontSize: '0.8125rem', borderRadius: '8px', border: '1px solid var(--border-medium, #cbd5e1)' }}
                >
                  {bookingStatuses.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.375rem' }}>
                  Payment Status
                </label>
                <select
                  value={paymentStatus}
                  onChange={(e) => setPaymentStatus(e.target.value)}
                  style={{ width: '100%', padding: '0.625rem 0.75rem', fontSize: '0.8125rem', borderRadius: '8px', border: '1px solid var(--border-medium, #cbd5e1)' }}
                >
                  {paymentStatuses.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.375rem' }}>
                  Admin Notes
                </label>
                <textarea
                  rows="3"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  style={{ width: '100%', padding: '0.625rem 0.75rem', fontSize: '0.8125rem', borderRadius: '8px', border: '1px solid var(--border-medium, #cbd5e1)', boxSizing: 'border-box' }}
                />
              </div>
            </div>
          </CardBody>
        </Card>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          <Button variant="ghost" onClick={() => navigate(`/admin/bookings/${booking.id}`)}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" leftIcon={<Save size={16} />}>
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  );
}

export default BookingEdit;
