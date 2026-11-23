// MAK Tours & Travels ERP - Driver Trip Details & Lifecycle Execution
// CRITICAL: ONE WAY TRIP MUST NOT EXIST ANYWHERE IN THIS APPLICATION.
import React, { useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Compass,
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Car,
  User,
  Phone,
  Navigation,
  CheckCircle,
  AlertTriangle,
  FileText,
  DollarSign,
  ShieldCheck,
  Camera,
  AlertOctagon,
  ExternalLink,
  MessageSquare,
  Moon
} from 'lucide-react';
import { Breadcrumbs } from '../../../components/common/Breadcrumbs';
import { Card, CardHeader, CardBody, CardFooter } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Modal } from '../../../components/ui/Modal';
import { Input } from '../../../components/ui/Input';
import { useDriverData } from '../../../context/DriverDataContext';
import { useToast } from '../../../context/ToastContext';
import { formatDateDMY } from '../../../utils/dateUtils';

export function DriverTripDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { trips, updateTripStatus, triggerEmergencySos, addNightStay } = useDriverData();

  // Find trip by ID or bookingId
  const trip = trips.find((t) => t.id === id || t.bookingId === id) || trips[0];

  // Journey date check: trip can only be started on or after journey start date
  const { isFutureTrip, jDate } = useMemo(() => {
    if (!trip) return { isFutureTrip: false, jDate: '' };
    const rawTripDate = trip.pickupDate || trip.journeyDate || trip.travelDate || trip.date;
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    let parsedJDate = '';
    if (rawTripDate) {
      if (typeof rawTripDate === 'string' && rawTripDate.match(/^\d{4}-\d{2}-\d{2}/)) {
        parsedJDate = rawTripDate.substring(0, 10);
      } else if (typeof rawTripDate === 'string' && rawTripDate.match(/^\d{2}-\d{2}-\d{4}/)) {
        const p = rawTripDate.split('-');
        parsedJDate = `${p[2]}-${p[1]}-${p[0]}`;
      } else {
        try {
          const parsed = new Date(rawTripDate);
          if (!isNaN(parsed.getTime())) parsedJDate = parsed.toISOString().substring(0, 10);
        } catch (_) {}
      }
    }
    return {
      isFutureTrip: Boolean(parsedJDate && todayStr < parsedJDate),
      jDate: parsedJDate
    };
  }, [trip]);

  // Start Trip Modal
  const [isStartModalOpen, setIsStartModalOpen] = useState(false);
  const [startOdoInput, setStartOdoInput] = useState(trip?.startOdometer || 64120);

  // Complete Trip Modal
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);
  const [endOdoInput, setEndOdoInput] = useState((trip?.currentOdometer || 64120) + 145);
  const [completionPhoto, setCompletionPhoto] = useState(null);
  const [completionRemarks, setCompletionRemarks] = useState('Trip completed smoothly. All passengers dropped safely at destination.');
  const [extraAllowanceClaim, setExtraAllowanceClaim] = useState('0');
  const [isLocallyCompleted, setIsLocallyCompleted] = useState(false);

  // Night Stay Modal State
  const [isNightStayModalOpen, setIsNightStayModalOpen] = useState(false);
  const [nightStayNights, setNightStayNights] = useState(trip?.nightStayNights || 1);
  const [nightStayRate, setNightStayRate] = useState(500);
  const [nightStayCustomAmount, setNightStayCustomAmount] = useState(trip?.nightStayAmount || (trip?.nightStayNights ? trip.nightStayNights * 500 : 500));
  const [nightStayRemarks, setNightStayRemarks] = useState(trip?.nightStayRemarks || 'Overnight stay near tour destination');
  const [nightStayDate, setNightStayDate] = useState(trip?.nightStayDate || new Date().toISOString().substring(0, 10));

  // Complete Trip Overnight Stay checkbox state
  const [hasCompletedNightStay, setHasCompletedNightStay] = useState(Boolean(trip?.nightStayAmount && trip.nightStayAmount > 0));

  const currentStatus = isLocallyCompleted ? 'Trip Completed' : (trip?.status || 'Assigned');
  const isCompleted = currentStatus === 'Trip Completed';

  const handleNightsChange = (val) => {
    const n = Math.max(1, parseInt(val) || 1);
    setNightStayNights(n);
    setNightStayCustomAmount(n * (parseInt(nightStayRate) || 500));
  };

  const handleRateChange = (val) => {
    const r = Math.max(0, parseInt(val) || 0);
    setNightStayRate(r);
    setNightStayCustomAmount((parseInt(nightStayNights) || 1) * r);
  };

  const handleSaveNightStay = async () => {
    const totalAmt = Number(nightStayCustomAmount) || (Number(nightStayNights) * Number(nightStayRate));
    if (totalAmt < 0) return;
    if (addNightStay) {
      await addNightStay(trip.bookingId || trip.id, {
        nights: Number(nightStayNights),
        ratePerNight: Number(nightStayRate),
        totalAmount: totalAmt,
        remarks: nightStayRemarks,
        date: nightStayDate
      });
    }
    setIsNightStayModalOpen(false);
  };

  if (!trip) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)' }}>Trip Not Found</h2>
        <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem', marginBottom: '1.5rem' }}>
          The requested trip #{id} could not be located in your assigned manifests.
        </p>
        <Button variant="primary" onClick={() => navigate('/driver/trips')}>
          Return to My Trips
        </Button>
      </div>
    );
  }

  const handleArrived = () => {
    updateTripStatus(trip.id, 'Arrived at Pickup');
  };

  const handleConfirmStart = () => {
    if (isFutureTrip) {
      toast.error(`Trip cannot be started prior to the journey start date (${formatDateDMY(jDate)}). The driver/admin can start the trip on the journey start date.`);
      return;
    }
    const ok = updateTripStatus(trip.id, 'Trip Started', {
      startOdometer: parseInt(startOdoInput) || 64120
    });
    if (ok !== false) {
      setIsStartModalOpen(false);
    }
  };

  const handleConfirmComplete = async () => {
    setIsLocallyCompleted(true);
    let finalNightAmt = Number(trip.nightStayAmount || 0);
    if (hasCompletedNightStay) {
      finalNightAmt = Number(nightStayCustomAmount) || (Number(nightStayNights) * Number(nightStayRate));
      if (addNightStay) {
        await addNightStay(trip.bookingId || trip.id, {
          nights: Number(nightStayNights),
          ratePerNight: Number(nightStayRate),
          totalAmount: finalNightAmt,
          remarks: nightStayRemarks,
          date: nightStayDate
        });
      }
    }
    updateTripStatus(trip.id, 'Trip Completed', {
      endOdometer: parseInt(endOdoInput) || 64265,
      completionRemarks,
      extraAllowance: parseInt(extraAllowanceClaim) || 0,
      nightStayAmount: finalNightAmt,
      completionPhotoUrl: completionPhoto || 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=600&q=80'
    });
    setIsCompleteModalOpen(false);
  };

  const openGoogleMaps = () => {
    const query = encodeURIComponent(`${trip.pickupLocation} to ${trip.dropLocation}`);
    window.open(`https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(trip.pickupLocation)}&destination=${encodeURIComponent(trip.dropLocation)}`, '_blank');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '1000px', margin: '0 auto' }}>
      {/* Header */}
      <div>
        <Breadcrumbs portal="driver" />
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginTop: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Button variant="ghost" size="sm" onClick={() => navigate('/driver/trips')}>
              <ArrowLeft size={16} />
            </Button>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                <span style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '1.25rem', color: '#2C3480' }}>
                  {trip.bookingId}
                </span>
                <Badge variant="info" size="sm">
                  {trip.tripCategory}
                </Badge>
                <Badge
                  variant={
                    currentStatus === 'Trip Started'
                      ? 'primary'
                      : currentStatus === 'Arrived at Pickup'
                      ? 'warning'
                      : currentStatus === 'Trip Completed'
                      ? 'success'
                      : 'default'
                  }
                  dot
                  size="sm"
                >
                  {currentStatus}
                </Badge>
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', margin: '0.2rem 0 0 0' }}>
                Dispatch Manifest Ref: {trip.id} &bull; Passenger: {trip.customerName} ({trip.passengerCount} Pax)
              </p>
            </div>
          </div>

          {/* Quick External Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<DollarSign size={14} color="#10b981" />}
              style={{ fontWeight: 700 }}
              onClick={() => navigate(`/driver/trips/${trip.bookingId || trip.id}/expenses`)}
            >
              Claim Expenses
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={openGoogleMaps}
              leftIcon={<Navigation size={14} />}
            >
              Open Maps
            </Button>
            <a
              href={`tel:${trip.customerPhone}`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.45rem 0.85rem',
                backgroundColor: '#10b981',
                color: '#ffffff',
                borderRadius: '6px',
                fontSize: '0.8125rem',
                fontWeight: 700,
                textDecoration: 'none'
              }}
            >
              <Phone size={14} /> Call Passenger
            </a>
            <Button
              variant="primary"
              size="sm"
              style={{ backgroundColor: '#dc2626', borderColor: '#dc2626' }}
              onClick={() => triggerEmergencySos(trip.id, 'SOS from Trip Details')}
              leftIcon={<AlertOctagon size={14} />}
            >
              SOS
            </Button>
          </div>
        </div>
      </div>

      {/* Sequential Execution Action Banner */}
      <Card
        style={{
          backgroundColor: isCompleted ? '#F0FDF4' : '#EEF0FD',
          border: isCompleted ? '1px solid #BBF7D0' : '1px solid #C7CEFA'
        }}
      >
        <CardBody style={{ padding: '1.25rem', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
          <div>
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 800,
                color: isCompleted ? '#166534' : '#2C3480',
                textTransform: 'uppercase'
              }}
            >
              Sequential Trip Execution Workflow
            </span>
            <div
              style={{
                fontSize: '1rem',
                fontWeight: 700,
                color: isCompleted ? '#14532D' : '#0f172a',
                marginTop: '0.2rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              Current Status: {currentStatus}
              {isCompleted && (
                <span
                  style={{
                    backgroundColor: '#DCFCE7',
                    color: '#15803D',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    padding: '0.15rem 0.6rem',
                    borderRadius: '9999px',
                    border: '1px solid #86EFAC'
                  }}
                >
                  Completed
                </span>
              )}
            </div>
            <p style={{ fontSize: '0.8125rem', color: isCompleted ? '#166534' : '#475569', margin: '0.2rem 0 0 0' }}>
              {currentStatus === 'Assigned' && 'Please accept this trip assignment to confirm your duty.'}
              {currentStatus === 'Accepted' && 'Head to pickup point and click "I Have Arrived" when reached.'}
              {currentStatus === 'Arrived at Pickup' && 'Board passengers, verify luggage, record starting odometer, and start trip.'}
              {currentStatus === 'Trip Started' && 'Drive safely on prescribed route. Complete journey at final destination.'}
              {currentStatus === 'Trip Completed' && 'Trip completed and verified! Allowance credited to your earnings.'}
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {currentStatus === 'Assigned' && (
              <Button
                variant="primary"
                size="md"
                style={{ backgroundColor: '#10b981', borderColor: '#10b981', fontWeight: 800 }}
                onClick={() => updateTripStatus(trip.id, 'Accepted')}
              >
                Accept Trip Assignment
              </Button>
            )}

            {currentStatus === 'Accepted' && (
              isFutureTrip ? (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8125rem', color: '#64748b', backgroundColor: '#f1f5f9', padding: '0.45rem 0.85rem', borderRadius: '8px', fontWeight: 600 }}>
                  <Clock size={14} style={{ color: '#2C3480' }} />
                  Journey starts on {formatDateDMY(jDate)} (Starts on journey date)
                </div>
              ) : (
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <Button
                    variant="primary"
                    size="md"
                    style={{ backgroundColor: '#f59e0b', borderColor: '#f59e0b', fontWeight: 800, color: '#000' }}
                    onClick={handleArrived}
                  >
                    I Have Arrived at Pickup
                  </Button>
                  <Button
                    variant="primary"
                    size="md"
                    style={{ backgroundColor: '#2C3480', borderColor: '#2C3480', fontWeight: 800 }}
                    onClick={() => setIsStartModalOpen(true)}
                  >
                    Start Trip
                  </Button>
                </div>
              )
            )}

            {currentStatus === 'Arrived at Pickup' && (
              isFutureTrip ? (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8125rem', color: '#64748b', backgroundColor: '#f1f5f9', padding: '0.45rem 0.85rem', borderRadius: '8px', fontWeight: 600 }}>
                  <Clock size={14} style={{ color: '#2C3480' }} />
                  Journey starts on {formatDateDMY(jDate)} (Starts on journey date)
                </div>
              ) : (
                <Button
                  variant="primary"
                  size="md"
                  style={{ backgroundColor: '#2C3480', borderColor: '#2C3480', fontWeight: 800 }}
                  onClick={() => setIsStartModalOpen(true)}
                >
                  Start Trip (Boarded)
                </Button>
              )
            )}

            {currentStatus === 'Trip Started' && (
              <Button
                variant="primary"
                size="md"
                style={{ backgroundColor: '#10b981', borderColor: '#10b981', fontWeight: 800 }}
                onClick={() => setIsCompleteModalOpen(true)}
              >
                Complete Trip & Settle
              </Button>
            )}

            {currentStatus === 'Trip Completed' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    color: '#15803D',
                    fontWeight: 800,
                    fontSize: '0.9rem',
                    padding: '0.45rem 0.9rem',
                    backgroundColor: '#DCFCE7',
                    borderRadius: '8px',
                    border: '1px solid #86EFAC'
                  }}
                >
                  <CheckCircle size={18} color="#15803D" /> Journey Completed & Settled
                </span>
                <Button
                  variant="secondary"
                  size="md"
                  onClick={() => navigate('/driver/trips')}
                  style={{ fontWeight: 700 }}
                >
                  Return to Trips &rarr;
                </Button>
              </div>
            )}
          </div>
        </CardBody>
      </Card>

      {/* Night Stay / Overnight Halt Allowance Banner for Driver */}
      <div
        style={{
          backgroundColor: (trip.nightStayAmount || 0) > 0 ? '#F0FDF4' : '#EEF0FD',
          border: `1.5px solid ${(trip.nightStayAmount || 0) > 0 ? '#86EFAC' : '#C7CEFA'}`,
          borderRadius: '14px',
          padding: '1rem 1.25rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              backgroundColor: (trip.nightStayAmount || 0) > 0 ? '#15803D' : '#2C3480',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            <Moon size={22} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0F172A' }}>
                {(trip.nightStayAmount || 0) > 0
                  ? `Night Stay Allowance Recorded: +₹${Number(trip.nightStayAmount).toLocaleString('en-IN')}`
                  : 'Staying Overnight for this Trip?'}
              </span>
              {(trip.nightStayAmount || 0) > 0 && (
                <span
                  style={{
                    backgroundColor: '#DCFCE7',
                    color: '#15803D',
                    fontSize: '0.725rem',
                    fontWeight: 700,
                    padding: '0.15rem 0.5rem',
                    borderRadius: '6px',
                    border: '1px solid #86EFAC'
                  }}
                >
                  ✓ Claim Added to Payout
                </span>
              )}
            </div>
            <p style={{ fontSize: '0.8rem', color: '#475569', margin: '0.2rem 0 0' }}>
              {(trip.nightStayAmount || 0) > 0
                ? `${trip.nightStayNights || 1} Night(s) recorded (${trip.nightStayRemarks || 'Overnight stay'}). Credited directly to your driver earnings!`
                : 'If your journey includes an overnight halt, you can add your additional night stay allowance here.'}
            </p>
          </div>
        </div>

        <Button
          variant={(trip.nightStayAmount || 0) > 0 ? 'outline' : 'primary'}
          size="sm"
          style={{
            backgroundColor: (trip.nightStayAmount || 0) > 0 ? '#ffffff' : '#2C3480',
            borderColor: (trip.nightStayAmount || 0) > 0 ? '#15803D' : '#2C3480',
            color: (trip.nightStayAmount || 0) > 0 ? '#15803D' : '#ffffff',
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem'
          }}
          onClick={() => setIsNightStayModalOpen(true)}
        >
          <Moon size={15} />
          {(trip.nightStayAmount || 0) > 0 ? 'Edit Night Stay (+₹)' : 'Add Night Stay (+₹)'}
        </Button>
      </div>

      {/* Main Details Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem', alignItems: 'start' }}>
        {/* Route, Schedule & Instructions */}
        <Card>
          <CardHeader
            title="Trip Route & Schedule"
            subtitle="Verified route checkpoints and timing schedule"
          />
          <CardBody style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#10b981', marginTop: '5px', flexShrink: 0 }} />
                <div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>PICKUP LOCATION</span>
                  <div style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--text-main)' }}>
                    {trip.pickupLocation}
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: '#2C3480', fontWeight: 600 }}>
                    Date & Time: {trip.pickupDate} at {trip.pickupTime}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#dc2626', marginTop: '5px', flexShrink: 0 }} />
                <div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>FINAL DESTINATION</span>
                  <div style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--text-main)' }}>
                    {trip.dropLocation}
                  </div>
                  {trip.returnDate && (
                    <div style={{ fontSize: '0.8125rem', color: '#2C3480', fontWeight: 600 }}>
                      Return Date: {trip.returnDate} at {trip.returnTime} ({trip.durationDays} Days Circuit)
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Special Instructions & Notes */}
            <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {trip.adminInstructions && (
                <div style={{ backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', padding: '0.85rem', fontSize: '0.8125rem' }}>
                  <strong style={{ color: '#92400e', display: 'block', marginBottom: '0.2rem' }}>Admin Dispatch Instructions:</strong>
                  <span style={{ color: '#78350f' }}>{trip.adminInstructions}</span>
                </div>
              )}

              {trip.tripNotes && (
                <div style={{ backgroundColor: 'var(--bg-surface-hover)', border: '1px solid var(--border-light)', borderRadius: '8px', padding: '0.85rem', fontSize: '0.8125rem' }}>
                  <strong style={{ color: 'var(--text-main)', display: 'block', marginBottom: '0.2rem' }}>Trip Notes:</strong>
                  <span style={{ color: 'var(--text-muted)' }}>{trip.tripNotes}</span>
                </div>
              )}
            </div>
          </CardBody>
        </Card>

        {/* Fleet, Passenger & Financial Details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Passenger & Vehicle Card */}
          <Card>
            <CardHeader title="Passenger & Fleet Allocation" subtitle="Assigned vehicle and primary passenger contact" />
            <CardBody style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.8125rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-light)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Passenger Name:</span>
                <strong style={{ color: 'var(--text-main)', fontSize: '0.9375rem' }}>{trip.customerName}</strong>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-light)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Passenger Contact:</span>
                <a href={`tel:${trip.customerPhone}`} style={{ color: '#2C3480', fontWeight: 700, textDecoration: 'none' }}>
                  {trip.customerPhone}
                </a>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-light)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Passenger Count:</span>
                <strong style={{ color: 'var(--text-main)' }}>{trip.passengerCount} Adults</strong>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-light)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Assigned Vehicle:</span>
                <strong style={{ color: 'var(--text-main)' }}>{trip.vehicle?.model}</strong>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Registration Number:</span>
                <strong style={{ color: '#2C3480', fontFamily: 'monospace', fontSize: '0.9375rem' }}>{trip.vehicle?.regNo}</strong>
              </div>
            </CardBody>
          </Card>

          {/* Earnings & Allowance Card */}
          <Card>
            <CardHeader title="Driver Allowances & Fleet Telematics" subtitle="Remuneration & verified journey metrics" />
            <CardBody style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.8125rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.4rem', borderBottom: '1px solid var(--border-light)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Base Driver Trip Pay:</span>
                <span style={{ fontWeight: 700, color: '#0F172A' }}>
                  ₹{Number(trip.baseTripPay || (trip.totalTripEarnings ? (trip.totalTripEarnings - (trip.nightStayAmount || 0)) : 1000)).toLocaleString('en-IN')}
                </span>
              </div>

              {/* Night Stay / Overnight Halt Row */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: '1px solid var(--border-light)', backgroundColor: (trip.nightStayAmount || 0) > 0 ? '#F0FDF4' : 'transparent', paddingLeft: (trip.nightStayAmount || 0) > 0 ? '0.5rem' : '0', paddingRight: (trip.nightStayAmount || 0) > 0 ? '0.5rem' : '0', borderRadius: '6px' }}>
                <div>
                  <span style={{ fontWeight: (trip.nightStayAmount || 0) > 0 ? 800 : 600, color: (trip.nightStayAmount || 0) > 0 ? '#15803D' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Moon size={14} color={(trip.nightStayAmount || 0) > 0 ? '#15803D' : '#64748B'} /> Night Stay Allowance:
                  </span>
                  {(trip.nightStayAmount || 0) > 0 && (
                    <span style={{ fontSize: '0.7rem', color: '#16A34A', display: 'block', marginTop: '0.1rem' }}>
                      {trip.nightStayNights || 1} Night(s) &bull; {trip.nightStayRemarks || 'Added by Driver'}
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontWeight: 800, color: (trip.nightStayAmount || 0) > 0 ? '#15803D' : '#64748B', fontSize: '0.9rem' }}>
                    {(trip.nightStayAmount || 0) > 0 ? `+₹${Number(trip.nightStayAmount).toLocaleString('en-IN')}` : '₹0'}
                  </span>
                  <button
                    onClick={() => setIsNightStayModalOpen(true)}
                    style={{
                      border: '1px solid #C7CEFA',
                      backgroundColor: '#EEF0FD',
                      color: '#2C3480',
                      padding: '0.2rem 0.5rem',
                      borderRadius: '5px',
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    {(trip.nightStayAmount || 0) > 0 ? 'Edit' : '+ Add'}
                  </button>
                </div>
              </div>

              {trip.startOdometer && (
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.4rem', borderBottom: '1px solid var(--border-light)' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Starting Odometer:</span>
                  <span style={{ fontWeight: 700, fontFamily: 'monospace' }}>{trip.startOdometer} km</span>
                </div>
              )}
              {trip.endOdometer && (
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.4rem', borderBottom: '1px solid var(--border-light)' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Ending Odometer:</span>
                  <span style={{ fontWeight: 700, fontFamily: 'monospace' }}>{trip.endOdometer} km</span>
                </div>
              )}
              {(trip.distanceTravelled !== undefined || (trip.endOdometer && trip.startOdometer)) && (
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.4rem', borderBottom: '1px solid var(--border-light)' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Distance Traversed:</span>
                  <strong style={{ color: '#059669', fontFamily: 'monospace' }}>
                    {trip.distanceTravelled !== undefined ? trip.distanceTravelled : (trip.endOdometer - trip.startOdometer)} km
                  </strong>
                </div>
              )}
              {trip.vehicleRatePerKm && (
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.4rem', borderBottom: '1px solid var(--border-light)' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Vehicle Rate per KM:</span>
                  <span style={{ fontWeight: 600, color: '#2563eb' }}>₹{trip.vehicleRatePerKm} / km</span>
                </div>
              )}
              {trip.vehicleTripCharge && (
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.4rem', borderBottom: '1px solid var(--border-light)' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Calculated Vehicle Trip Charge:</span>
                  <strong style={{ color: '#d97706' }}>₹{Number(trip.vehicleTripCharge).toLocaleString('en-IN')}</strong>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.4rem', borderTop: '1px solid var(--border-light)' }}>
                <div>
                  <span style={{ color: 'var(--text-main)', fontWeight: 800, fontSize: '0.9rem', display: 'block' }}>
                    Total Driver Earnings:
                  </span>
                  <span style={{ fontSize: '0.675rem', color: '#64748B' }}>
                    Base ₹{Number(trip.baseTripPay || (trip.totalTripEarnings ? (trip.totalTripEarnings - (trip.nightStayAmount || 0)) : 1000)).toLocaleString('en-IN')}{(trip.nightStayAmount || 0) > 0 ? ` + Night Stay ₹${Number(trip.nightStayAmount).toLocaleString('en-IN')}` : ''}
                  </span>
                </div>
                <strong style={{ color: '#10b981', fontSize: '1.2rem', fontWeight: 800 }}>
                  ₹{Number(trip.totalTripEarnings || ((trip.baseTripPay || 1000) + (trip.nightStayAmount || 0))).toLocaleString('en-IN')}
                </strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                <span>Settlement Status:</span>
                <Badge variant={isCompleted || trip.paymentStatus === 'Paid' ? 'success' : 'warning'} size="sm">
                  {isCompleted ? 'Pending Settlement' : trip.paymentStatus}
                </Badge>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>

      {/* Start Trip Modal (Prompts for start odometer) */}
      <Modal
        isOpen={isStartModalOpen}
        onClose={() => setIsStartModalOpen(false)}
        title="Start Trip Journey"
        subtitle={`Booking #${trip.bookingId} - Confirm passengers boarded`}
        size="md"
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', width: '100%' }}>
            <Button variant="outline" onClick={() => setIsStartModalOpen(false)}>Cancel</Button>
            <Button variant="primary" style={{ backgroundColor: '#2C3480', borderColor: '#2C3480', fontWeight: 800 }} onClick={handleConfirmStart}>
              Confirm Start Trip
            </Button>
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
              Current Vehicle Odometer Reading (KM) *
            </label>
            <Input
              type="number"
              value={startOdoInput}
              onChange={(e) => setStartOdoInput(e.target.value)}
              placeholder="e.g. 64120"
            />
            <span style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem', display: 'block' }}>
              Ensure meter reading matches vehicle dashboard display.
            </span>
          </div>

          <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '0.75rem', fontSize: '0.8125rem', color: '#166534' }}>
            ✓ Passengers verified and boarded.<br />
            ✓ AC and hygiene amenities checked.<br />
            ✓ AIS-140 GPS telematics online.
          </div>
        </div>
      </Modal>

      {/* Complete Trip Modal */}
      <Modal
        isOpen={isCompleteModalOpen}
        onClose={() => setIsCompleteModalOpen(false)}
        title="Complete Trip & Submit Final Readings"
        subtitle={`Booking #${trip.bookingId} - Final settlement and review`}
        size="md"
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', width: '100%' }}>
            <Button variant="outline" onClick={() => setIsCompleteModalOpen(false)}>Cancel</Button>
            <Button variant="primary" style={{ backgroundColor: '#10b981', borderColor: '#10b981', fontWeight: 800 }} onClick={handleConfirmComplete}>
              Finalize & Complete Trip
            </Button>
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
              Ending Odometer Reading (KM) *
            </label>
            <Input
              type="number"
              value={endOdoInput}
              onChange={(e) => setEndOdoInput(e.target.value)}
            />
            <span style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem', display: 'block' }}>
              Distance traversed: {endOdoInput - (trip.startOdometer || 64120)} KM
            </span>
          </div>

          {/* Overnight Stay Checkbox & inputs in Complete Trip Modal */}
          <div style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '0.85rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer', fontWeight: 700, color: '#0F172A', fontSize: '0.85rem' }}>
              <input
                type="checkbox"
                checked={hasCompletedNightStay}
                onChange={(e) => setHasCompletedNightStay(e.target.checked)}
                style={{ width: '17px', height: '17px', accentColor: '#2C3480' }}
              />
              <span>🌙 Did you stay overnight for this tour? (Add Night Stay Batta)</span>
            </label>

            {hasCompletedNightStay && (
              <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label style={{ fontSize: '0.75rem', color: '#64748B', display: 'block', fontWeight: 600, marginBottom: '0.2rem' }}>
                      Nights
                    </label>
                    <Input
                      type="number"
                      min="1"
                      max="10"
                      value={nightStayNights}
                      onChange={(e) => handleNightsChange(e.target.value)}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.75rem', color: '#64748B', display: 'block', fontWeight: 600, marginBottom: '0.2rem' }}>
                      Night Stay Amount (₹)
                    </label>
                    <Input
                      type="number"
                      step="50"
                      value={nightStayCustomAmount}
                      onChange={(e) => setNightStayCustomAmount(e.target.value)}
                    />
                  </div>
                </div>
                <div style={{ fontSize: '0.75rem', color: '#16A34A', fontWeight: 600 }}>
                  ✓ ₹{Number(nightStayCustomAmount || 0).toLocaleString('en-IN')} will be credited as Night Halt Allowance to your earnings.
                </div>
              </div>
            )}
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
              Extra Approved Allowances / Toll Cash Paid (₹)
            </label>
            <Input
              type="number"
              value={extraAllowanceClaim}
              onChange={(e) => setExtraAllowanceClaim(e.target.value)}
              placeholder="0"
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
              Completion Remarks / Customer Feedback
            </label>
            <textarea
              rows={3}
              value={completionRemarks}
              onChange={(e) => setCompletionRemarks(e.target.value)}
              style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.875rem', fontFamily: 'inherit' }}
            />
          </div>
        </div>
      </Modal>

      {/* Modal 3: Add / Edit Night Stay Allowance Modal */}
      <Modal
        isOpen={isNightStayModalOpen}
        onClose={() => setIsNightStayModalOpen(false)}
        title="🌙 Record Night Stay Allowance"
        subtitle={`Booking #${trip.bookingNumber || trip.bookingId || trip.id} - Additional overnight halt remuneration`}
        size="md"
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', width: '100%' }}>
            <Button variant="outline" onClick={() => setIsNightStayModalOpen(false)}>Cancel</Button>
            <Button
              variant="primary"
              style={{ backgroundColor: '#2C3480', borderColor: '#2C3480', fontWeight: 800 }}
              onClick={handleSaveNightStay}
            >
              Confirm Night Stay Allowance (+₹{Number(nightStayCustomAmount || 0).toLocaleString('en-IN')})
            </Button>
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
          <div style={{ backgroundColor: '#EEF0FD', border: '1px solid #C7CEFA', borderRadius: '10px', padding: '0.85rem 1rem', fontSize: '0.8125rem', color: '#1E293B' }}>
            <strong>💡 Night Stay Policy:</strong> When your duty involves an overnight halt or staying overnight at a tour location, you can claim this additional night stay allowance. It is directly credited to your driver trip earnings and visible to admin.
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                Number of Nights *
              </label>
              <Input
                type="number"
                min="1"
                max="10"
                value={nightStayNights}
                onChange={(e) => handleNightsChange(e.target.value)}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                Rate per Night (₹) *
              </label>
              <Input
                type="number"
                step="50"
                min="0"
                value={nightStayRate}
                onChange={(e) => handleRateChange(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
              Total Additional Night Stay Amount (₹) *
            </label>
            <Input
              type="number"
              value={nightStayCustomAmount}
              onChange={(e) => setNightStayCustomAmount(e.target.value)}
              placeholder="500"
            />
            <span style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '0.25rem', display: 'block' }}>
              Calculated: {nightStayNights} Night(s) × ₹{nightStayRate} = ₹{nightStayNights * nightStayRate} (can be customized if approved).
            </span>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
              Date of Night Stay *
            </label>
            <Input
              type="date"
              value={nightStayDate}
              onChange={(e) => setNightStayDate(e.target.value)}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
              Location &amp; Remarks (Optional)
            </label>
            <Input
              type="text"
              value={nightStayRemarks}
              onChange={(e) => setNightStayRemarks(e.target.value)}
              placeholder="e.g. Overnight halt in Pondicherry, waited for morning departure"
            />
          </div>

          <div style={{ backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '10px', padding: '0.85rem 1rem' }}>
            <div style={{ fontSize: '0.75rem', color: '#166534', fontWeight: 700 }}>UPDATED DRIVER EARNINGS PREVIEW:</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.35rem' }}>
              <span style={{ fontSize: '0.85rem', color: '#15803D' }}>
                Base Pay ₹{Number(trip.baseTripPay || (trip.totalTripEarnings ? (trip.totalTripEarnings - (trip.nightStayAmount || 0)) : 1000)).toLocaleString('en-IN')} + Night Stay ₹{Number(nightStayCustomAmount || 0).toLocaleString('en-IN')}
              </span>
              <strong style={{ fontSize: '1.15rem', color: '#15803D' }}>
                ₹{(Number(trip.baseTripPay || (trip.totalTripEarnings ? (trip.totalTripEarnings - (trip.nightStayAmount || 0)) : 1000)) + Number(nightStayCustomAmount || 0)).toLocaleString('en-IN')}
              </strong>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default DriverTripDetails;
