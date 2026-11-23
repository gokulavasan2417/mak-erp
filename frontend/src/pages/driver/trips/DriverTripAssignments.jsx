// MAK Tours & Travels ERP - Driver Trip Assignment Acceptance
// CRITICAL: ONE WAY TRIP MUST NOT EXIST ANYWHERE IN THIS APPLICATION.
import React, { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Compass,
  CalendarCheck,
  Calendar,
  Clock,
  MapPin,
  Car,
  User,
  Phone,
  Navigation,
  Receipt,
  CheckCircle,
  XCircle,
  HelpCircle,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  DollarSign,
  Eye,
  Info,
  PhoneCall,
  ExternalLink,
  FileText
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

const getVehicleDisplay = (veh) => {
  if (!veh) return 'Toyota Innova Crysta';
  if (typeof veh === 'string') return veh.split('(')[0]?.trim() || veh;
  return veh.model || veh.name || 'Toyota Innova Crysta';
};

const getVehicleFullDisplay = (veh) => {
  if (!veh) return 'Toyota Innova Crysta (KA-01-MJ-8890)';
  if (typeof veh === 'string') return veh;
  return `${veh.model || 'Toyota Innova Crysta'}${veh.regNo ? ` (${veh.regNo})` : ''}`.trim();
};

export function DriverTripAssignments() {
  const navigate = useNavigate();
  const toast = useToast();
  const {
    pendingAssignments = [],
    trips = [],
    acceptTripAssignment,
    declineTripAssignment,
    updateTripStatus
  } = useDriverData();

  // Trip Actions Modal State
  const [actionModalTrip, setActionModalTrip] = useState(null);
  const [startOdoInput, setStartOdoInput] = useState('34200');
  const [endOdoInput, setEndOdoInput] = useState('34345');
  const [completionRemarks, setCompletionRemarks] = useState('Trip completed smoothly. All passengers dropped safely at destination.');
  const [activeActionStep, setActiveActionStep] = useState('menu'); // 'menu' | 'start' | 'complete'

  // Live synced trip for the actions modal
  const liveActionTrip = useMemo(() => {
    if (!actionModalTrip) return null;
    return (trips || []).find((t) => t.id === actionModalTrip.id || t.bookingId === actionModalTrip.bookingId) || actionModalTrip;
  }, [actionModalTrip, trips]);

  const { isLiveTripFuture, liveTripJDate } = useMemo(() => {
    if (!liveActionTrip) return { isLiveTripFuture: false, liveTripJDate: '' };
    const rawTripDate = liveActionTrip.pickupDate || liveActionTrip.journeyDate || liveActionTrip.travelDate || liveActionTrip.date;
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    let jDate = '';
    if (rawTripDate) {
      if (typeof rawTripDate === 'string' && rawTripDate.match(/^\d{4}-\d{2}-\d{2}/)) {
        jDate = rawTripDate.substring(0, 10);
      } else if (typeof rawTripDate === 'string' && rawTripDate.match(/^\d{2}-\d{2}-\d{4}/)) {
        const p = rawTripDate.split('-');
        jDate = `${p[2]}-${p[1]}-${p[0]}`;
      } else {
        try {
          const parsed = new Date(rawTripDate);
          if (!isNaN(parsed.getTime())) jDate = parsed.toISOString().substring(0, 10);
        } catch (_) {}
      }
    }
    return {
      isLiveTripFuture: Boolean(jDate && todayStr < jDate),
      liveTripJDate: jDate
    };
  }, [liveActionTrip]);

  const acceptedTrips = useMemo(() => {
    return (trips || []).filter(
      (t) =>
        t.status === 'Accepted' ||
        t.status === 'Assigned' ||
        t.status === 'Trip Started' ||
        t.status === 'Arrived at Pickup' ||
        t.rawStatus === 'Driver Accepted'
    );
  }, [trips]);

  // Full Details Modal State
  const [detailsModalItem, setDetailsModalItem] = useState(null);

  // Decline Modal State
  const [declineModalItem, setDeclineModalItem] = useState(null);
  const [declineReason, setDeclineReason] = useState('Personal health / medical indisposition');
  const [declineExplanation, setDeclineExplanation] = useState('');

  // Clarification Modal State
  const [clarifyModalItem, setClarifyModalItem] = useState(null);
  const [clarifyQuery, setClarifyQuery] = useState('');

  const declineReasons = [
    'Personal health / medical indisposition',
    'Exceeds permitted daily driving duty hours',
    'Personal family emergency',
    'Route familiarization concern on Ghat section',
    'Assigned vehicle scheduled for workshop service'
  ];

  const handleConfirmDecline = () => {
    if (!declineModalItem) return;
    declineTripAssignment(declineModalItem.bookingId || declineModalItem.id, declineReason, declineExplanation);
    setDeclineModalItem(null);
    setDeclineExplanation('');
    if (detailsModalItem?.id === declineModalItem.id) {
      setDetailsModalItem(null);
    }
  };

  const handleSendClarification = () => {
    setClarifyModalItem(null);
    setClarifyQuery('');
  };

  const handleAcceptFromModal = (assignmentId) => {
    const targetId = assignmentId || detailsModalItem?.bookingId || detailsModalItem?.id;
    acceptTripAssignment(targetId);
    setDetailsModalItem(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div>
        <Breadcrumbs portal="driver" />
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginTop: '0.25rem' }}>
          <div>
            <h1 style={{ fontSize: '1.625rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
              New Trip Assignments ({pendingAssignments.length})
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
              Trip manifests dispatched to your driver badge by MAK Admin Operations Desk.
            </p>
          </div>

          <Button
            variant="secondary"
            size="sm"
            leftIcon={<Compass size={14} />}
            onClick={() => navigate('/driver/trips')}
          >
            View All Trips
          </Button>
        </div>
      </div>

      {pendingAssignments.length === 0 ? (
        <Card>
          <CardBody style={{ padding: '2.5rem 1.5rem', textAlign: 'center' }}>
            <CheckCircle size={44} color="#10b981" style={{ margin: '0 auto 0.75rem' }} />
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-main)' }}>
              All New Trip Assignments Acknowledged
            </h3>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '0.25rem', marginBottom: '1.25rem' }}>
              {acceptedTrips.length > 0
                ? `You have ${acceptedTrips.length} active or scheduled trip(s) confirmed on your duty roster below.`
                : 'You have no pending assignments awaiting acceptance. Check your active duty calendar or scheduled trips.'}
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Button
                variant="primary"
                size="sm"
                style={{ backgroundColor: '#2C3480', borderColor: '#2C3480' }}
                onClick={() => navigate('/driver/trips')}
              >
                View All Trips Roster
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => navigate('/driver/availability')}
              >
                Check Duty Availability Calendar
              </Button>
            </div>
          </CardBody>
        </Card>
      ) : (
        /* Grid of Modern Elevated Assignment Cards */
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
            gap: '1.5rem',
            alignItems: 'stretch'
          }}
        >
          {pendingAssignments.map((assignment) => (
            <div
              key={assignment.id}
              style={{
                backgroundColor: 'var(--bg-surface, #ffffff)',
                borderRadius: '16px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 4px 20px -2px rgba(44, 52, 128, 0.08), 0 2px 6px -1px rgba(0, 0, 0, 0.04)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                overflow: 'hidden',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                position: 'relative'
              }}
            >
              {/* Top Accent Strip with Cobalt Gradient */}
              <div style={{ height: '4px', background: 'linear-gradient(90deg, #2C3480 0%, #4338ca 100%)' }} />

              <div style={{ padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1 }}>
                {/* Header: ID + Category + Urgency */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '1.125rem', color: '#2C3480', letterSpacing: '-0.02em' }}>
                      {assignment.bookingId}
                    </span>
                    <span
                      style={{
                        fontSize: '0.6875rem',
                        fontWeight: 700,
                        backgroundColor: '#EEF0FD',
                        color: '#2C3480',
                        padding: '0.2rem 0.55rem',
                        borderRadius: '6px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em'
                      }}
                    >
                      {assignment.tripCategory}
                    </span>
                  </div>

                  <span
                    style={{
                      fontSize: '0.6875rem',
                      fontWeight: 700,
                      backgroundColor: '#fef3c7',
                      color: '#b45309',
                      padding: '0.2rem 0.55rem',
                      borderRadius: '9999px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.3rem'
                    }}
                  >
                    <Clock size={11} /> &lt; {assignment.deadlineHours}h Left
                  </span>
                </div>

                {/* Route Visual Section */}
                <div
                  style={{
                    backgroundColor: '#f8fafc',
                    borderRadius: '12px',
                    padding: '0.875rem 1rem',
                    border: '1px solid #edf2f7',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem'
                  }}
                >
                  {/* Origin */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#2C3480', flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>PICKUP</div>
                      <div style={{ fontWeight: 700, fontSize: '0.875rem', color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {assignment.pickupLocation}
                      </div>
                    </div>
                  </div>

                  {/* Route connector line */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', paddingLeft: '4px' }}>
                    <div style={{ width: '2px', height: '12px', backgroundColor: '#cbd5e1' }} />
                    <span style={{ fontSize: '0.6875rem', color: '#94a3b8', fontStyle: 'italic' }}>
                      {assignment.durationDays} Day Circuit
                    </span>
                  </div>

                  {/* Destination */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#10b981', flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>DESTINATION</div>
                      <div style={{ fontWeight: 700, fontSize: '0.875rem', color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {assignment.dropLocation || assignment.destination}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Date / Vehicle Chips */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#475569', backgroundColor: '#f1f5f9', padding: '0.45rem 0.65rem', borderRadius: '8px' }}>
                    <Calendar size={13} color="#2C3480" style={{ flexShrink: 0 }} />
                    <span style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {formatDateDMY(assignment.pickupDate)} ({assignment.pickupTime})
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#475569', backgroundColor: '#f1f5f9', padding: '0.45rem 0.65rem', borderRadius: '8px' }}>
                    <Car size={13} color="#2C3480" style={{ flexShrink: 0 }} />
                    <span style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {getVehicleDisplay(assignment.assignedVehicle)}
                    </span>
                  </div>
                </div>

                {/* Passenger Info Chip */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.45rem 0.75rem', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #edf2f7', fontSize: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: '#334155' }}>
                    <User size={13} color="#2C3480" style={{ flexShrink: 0 }} />
                    <span style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {assignment.customerName} ({assignment.passengerCount || 6} Pax)
                    </span>
                  </div>
                  <span style={{ fontSize: '0.6875rem', color: '#64748b', fontWeight: 600, flexShrink: 0 }}>
                    Assigned by Desk
                  </span>
                </div>

                {/* Earnings Ribbon */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.625rem 0.875rem',
                    backgroundColor: '#ecfdf5',
                    borderRadius: '10px',
                    border: '1px solid #d1fae5'
                  }}
                >
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#065f46' }}>
                    Driver Allowance & Bata
                  </span>
                  <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#047857' }}>
                    ₹{assignment.estimatedEarnings}
                  </span>
                </div>
              </div>

              {/* Card Action Footer */}
              <div
                style={{
                  padding: '0.875rem 1.25rem',
                  backgroundColor: '#f8fafc',
                  borderTop: '1px solid #e2e8f0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '0.5rem'
                }}
              >
                {/* Details Button */}
                <button
                  type="button"
                  onClick={() => setDetailsModalItem(assignment)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    padding: '0.5rem 0.85rem',
                    fontSize: '0.8125rem',
                    fontWeight: 700,
                    color: '#2C3480',
                    backgroundColor: '#ffffff',
                    border: '1.5px solid #2C3480',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#2C3480';
                    e.currentTarget.style.color = '#ffffff';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#ffffff';
                    e.currentTarget.style.color = '#2C3480';
                  }}
                >
                  <Eye size={15} /> Details
                </button>

                {/* Decline & Accept Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={() => setDeclineModalItem(assignment)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#dc2626',
                      fontSize: '0.8125rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      padding: '0.4rem 0.6rem',
                      borderRadius: '6px'
                    }}
                  >
                    Decline
                  </button>

                  <button
                    type="button"
                    onClick={() => acceptTripAssignment(assignment.bookingId || assignment.id)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      padding: '0.5rem 1rem',
                      fontSize: '0.8125rem',
                      fontWeight: 700,
                      color: '#ffffff',
                      backgroundColor: '#10b981',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      boxShadow: '0 2px 6px rgba(16, 185, 129, 0.25)',
                      transition: 'transform 0.15s ease'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.02)')}
                    onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                  >
                    <CheckCircle size={15} /> Accept
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ========================================================
          ACCEPTED & SCHEDULED TRIPS (Visible immediately on accept)
          ======================================================== */}
      {acceptedTrips.length > 0 && (
        <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                Accepted &amp; Confirmed Trips ({acceptedTrips.length})
              </h2>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', margin: '0.2rem 0 0 0' }}>
                Trip manifests confirmed on your driver duty roster. Dispatched and ready for execution.
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              rightIcon={<ArrowRight size={14} />}
              onClick={() => navigate('/driver/trips')}
            >
              View All Trips In Roster
            </Button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.25rem' }}>
            {acceptedTrips.map((trip) => (
              <div
                key={trip.id}
                style={{
                  backgroundColor: 'var(--bg-surface, #ffffff)',
                  borderRadius: '14px',
                  border: '1.5px solid #86efac',
                  boxShadow: '0 4px 16px -2px rgba(16, 185, 129, 0.12)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  overflow: 'hidden'
                }}
              >
                <div style={{ height: '4px', backgroundColor: '#10b981' }} />
                <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '1rem', color: '#2C3480' }}>
                        {trip.bookingNumber || trip.bookingId || trip.id}
                      </span>
                      <Badge variant="success" dot size="sm">
                        {trip.status}
                      </Badge>
                    </div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#166534', backgroundColor: '#dcfce7', padding: '0.15rem 0.5rem', borderRadius: '4px' }}>
                      {trip.tripCategory}
                    </span>
                  </div>

                  <div style={{ fontSize: '0.8125rem', color: 'var(--text-main)', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <User size={14} color="#64748b" />
                      <strong>{trip.customerName}</strong> ({trip.passengerCount || 4} Pax)
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Car size={14} color="#64748b" />
                      <span>{trip.vehicle?.model || 'Maruti Suzuki Swift'} ({trip.vehicle?.regNo || 'KA-01-MJ-4419'})</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Calendar size={14} color="#64748b" />
                      <span>Departure: {trip.pickupDate} at {trip.pickupTime}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                      <MapPin size={14} color="#2C3480" style={{ marginTop: '2px', flexShrink: 0 }} />
                      <span style={{ fontSize: '0.775rem' }}>{trip.pickupLocation} → {trip.destination || trip.dropLocation}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0.75rem', backgroundColor: '#f0fdf4', borderRadius: '8px', border: '1px solid #dcfce7' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#166534' }}>Driver Allowance:</span>
                    <strong style={{ fontSize: '1.1rem', color: '#15803d' }}>₹{trip.totalTripEarnings || 1365}</strong>
                  </div>
                </div>

                <div style={{ padding: '0.75rem 1.25rem', backgroundColor: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/driver/trips/${trip.bookingId || trip.id}`)}
                  >
                    View Manifest
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    style={{ backgroundColor: '#2C3480', borderColor: '#2C3480' }}
                    onClick={() => {
                      const curOdo = Math.max(
                        Number(trip.currentOdometer || trip.startOdometer || 42100),
                        Number(trip.vehicle?.odometerKm || 42100),
                        42100
                      );
                      setActionModalTrip(trip);
                      setStartOdoInput(String(curOdo));
                      setEndOdoInput(String(curOdo + 145));
                      setActiveActionStep('menu');
                    }}
                  >
                    Open Trip Actions
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================
          FULL TRIP ASSIGNMENT DETAILS MODAL
          ======================================================== */}
      <Modal
        isOpen={Boolean(detailsModalItem)}
        onClose={() => setDetailsModalItem(null)}
        title={`Trip Manifest #${detailsModalItem?.bookingId}`}
        subtitle="Complete journey itinerary, reporting time, passenger contact, and allowance manifest"
        size="lg"
        maxWidth="720px"
        footer={
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: '0.75rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setClarifyModalItem(detailsModalItem);
                }}
              >
                Request Clarification
              </Button>
              <Button
                variant="outline"
                size="sm"
                style={{ color: '#dc2626', borderColor: '#fca5a5' }}
                onClick={() => {
                  setDeclineModalItem(detailsModalItem);
                }}
              >
                Decline
              </Button>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <Button variant="outline" size="sm" onClick={() => setDetailsModalItem(null)}>
                Close
              </Button>
              <Button
                variant="primary"
                size="sm"
                style={{ backgroundColor: '#10b981', borderColor: '#10b981', fontWeight: 700 }}
                onClick={() => handleAcceptFromModal(detailsModalItem?.id)}
                leftIcon={<CheckCircle size={15} />}
              >
                Accept Trip Assignment
              </Button>
            </div>
          </div>
        }
      >
        {detailsModalItem && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Header Highlight Banner */}
            <div
              style={{
                backgroundColor: '#EEF0FD',
                border: '1px solid #C7CEFA',
                borderRadius: '12px',
                padding: '1rem 1.25rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '1rem'
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', flexWrap: 'wrap' }}>
                  <span style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '1.25rem', color: '#2C3480' }}>
                    {detailsModalItem.bookingId}
                  </span>
                  <Badge variant="primary" size="sm">
                    {detailsModalItem.tripCategory}
                  </Badge>
                  <Badge variant="warning" dot size="sm">
                    Action Deadline: &lt; {detailsModalItem.deadlineHours}h Remaining
                  </Badge>
                </div>
                <div style={{ fontSize: '0.8125rem', color: '#475569', marginTop: '0.25rem' }}>
                  Dispatched on {formatDateDMY(detailsModalItem.assignedDate)} by MAK Operations Desk
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.75rem', color: '#475569', fontWeight: 600 }}>Total Driver Payout</span>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#10b981' }}>
                  ₹{detailsModalItem.estimatedEarnings}
                </div>
              </div>
            </div>

            {/* 1. Route & Navigation Details */}
            <div style={{ border: '1px solid var(--border-light)', borderRadius: '12px', padding: '1rem 1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <MapPin size={18} color="#2C3480" />
                <h4 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-main)' }}>
                  Route & Navigation Manifest
                </h4>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', paddingLeft: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                  <div style={{ width: '22px', height: '22px', borderRadius: '50%', backgroundColor: '#2C3480', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6875rem', fontWeight: 700, marginTop: '2px', flexShrink: 0 }}>
                    1
                  </div>
                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                      Pickup Landmark & Boarding Point
                    </span>
                    <div style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--text-main)' }}>
                      {detailsModalItem.pickupLocation}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#b45309', fontWeight: 600, marginTop: '0.15rem' }}>
                      ⚠️ Driver must arrive 15 minutes before departure ({detailsModalItem.pickupTime})
                    </div>
                  </div>
                </div>

                <div style={{ borderLeft: '2px dashed #cbd5e1', marginLeft: '10px', height: '14px' }} />

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                  <div style={{ width: '22px', height: '22px', borderRadius: '50%', backgroundColor: '#10b981', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6875rem', fontWeight: 700, marginTop: '2px', flexShrink: 0 }}>
                    2
                  </div>
                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                      Destination & Circuit
                    </span>
                    <div style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--text-main)' }}>
                      {detailsModalItem.dropLocation}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Schedule & Passenger Info (Two Column) */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
              {/* Schedule Box */}
              <div style={{ border: '1px solid var(--border-light)', borderRadius: '12px', padding: '1rem 1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  <Calendar size={18} color="#2C3480" />
                  <h4 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-main)' }}>
                    Schedule & Timing
                  </h4>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.8125rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Departure:</span>
                    <strong style={{ color: 'var(--text-main)' }}>{formatDateDMY(detailsModalItem.pickupDate)} at {detailsModalItem.pickupTime}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Return / End:</span>
                    <strong style={{ color: 'var(--text-main)' }}>{detailsModalItem.returnDate ? formatDateDMY(detailsModalItem.returnDate) : 'Same Day'} at {detailsModalItem.returnTime || 'N/A'}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-light)', paddingTop: '0.5rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Total Duration:</span>
                    <strong style={{ color: '#2C3480' }}>{detailsModalItem.durationDays} Day{detailsModalItem.durationDays > 1 ? 's' : ''}</strong>
                  </div>
                </div>
              </div>

              {/* Passenger Box */}
              <div style={{ border: '1px solid var(--border-light)', borderRadius: '12px', padding: '1rem 1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  <User size={18} color="#2C3480" />
                  <h4 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-main)' }}>
                    Passenger Information
                  </h4>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.8125rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Contact Name:</span>
                    <strong style={{ color: 'var(--text-main)' }}>{detailsModalItem.customerName}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Phone:</span>
                    <a
                      href={`tel:${detailsModalItem.customerPhone}`}
                      style={{
                        color: '#2C3480',
                        fontWeight: 700,
                        textDecoration: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        backgroundColor: '#EEF0FD',
                        padding: '0.2rem 0.5rem',
                        borderRadius: '4px'
                      }}
                    >
                      <PhoneCall size={12} /> {detailsModalItem.customerPhone}
                    </a>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-light)', paddingTop: '0.5rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Passenger Count:</span>
                    <strong style={{ color: 'var(--text-main)' }}>{detailsModalItem.passengerCount} Passengers</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Fleet & Allowance Breakdown */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
              {/* Assigned Vehicle */}
              <div style={{ border: '1px solid var(--border-light)', borderRadius: '12px', padding: '1rem 1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  <Car size={18} color="#2C3480" />
                  <h4 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-main)' }}>
                    Assigned Fleet Vehicle
                  </h4>
                </div>
                <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-main)' }}>
                  {getVehicleFullDisplay(detailsModalItem.assignedVehicle)}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                  Air-Conditioned &bull; Commercial Tourist Taxi Badge Validated &bull; Cleaned & Sanitized
                </div>
              </div>

              {/* Allowance Breakdown */}
              <div style={{ border: '1px solid var(--border-light)', borderRadius: '12px', padding: '1rem 1.25rem', backgroundColor: '#f0fdf4' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  <DollarSign size={18} color="#15803d" />
                  <h4 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 700, color: '#166534' }}>
                    Allowance Breakdown
                  </h4>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.8125rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#166534' }}>
                    <span>Daily Driver Bata:</span>
                    <span>₹500 / day ({detailsModalItem.durationDays} days)</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#166534' }}>
                    <span>Outstation / Night Stay Allowance:</span>
                    <span>₹350 / night</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #bbf7d0', paddingTop: '0.35rem', fontWeight: 800, color: '#15803d', fontSize: '0.875rem' }}>
                    <span>Total Settlement:</span>
                    <span>₹{detailsModalItem.estimatedEarnings}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 4. Admin Instructions */}
            <div style={{ backgroundColor: '#f8fafc', border: '1px solid var(--border-light)', borderRadius: '12px', padding: '1rem 1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                <Info size={16} color="#2C3480" />
                <strong style={{ fontSize: '0.8125rem', color: '#0f172a' }}>
                  Admin Operations Dispatch Instructions
                </strong>
              </div>
              <p style={{ margin: 0, fontSize: '0.8125rem', color: '#475569', lineHeight: 1.5 }}>
                VIP client journey. Please ensure proper driver uniform with badge. Vehicle must be clean with fresh bottled water, tissues, and mobile chargers. Report at pickup location 15 minutes before scheduled departure time.
              </p>
            </div>
          </div>
        )}
      </Modal>

      {/* Decline Reason Modal */}
      <Modal
        isOpen={Boolean(declineModalItem)}
        onClose={() => setDeclineModalItem(null)}
        title={`Decline Trip Assignment #${declineModalItem?.bookingId}`}
        subtitle="Mandatory operational reason required by MAK Admin Operations Desk"
        size="md"
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', width: '100%' }}>
            <Button variant="outline" onClick={() => setDeclineModalItem(null)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              style={{ backgroundColor: '#dc2626', borderColor: '#dc2626', fontWeight: 700 }}
              onClick={handleConfirmDecline}
            >
              Confirm Decline
            </Button>
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
              Primary Reason for Declining *
            </label>
            <select
              value={declineReason}
              onChange={(e) => setDeclineReason(e.target.value)}
              style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.875rem', backgroundColor: '#fff' }}
            >
              {declineReasons.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
              Explanation / Notes for Dispatch Supervisor
            </label>
            <textarea
              rows={3}
              placeholder="Provide brief details so Admin can re-assign another driver..."
              value={declineExplanation}
              onChange={(e) => setDeclineExplanation(e.target.value)}
              style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.875rem', fontFamily: 'inherit' }}
            />
          </div>
        </div>
      </Modal>

      {/* ========================================================
          TRIP ACTIONS MODAL (Opens on "Open Trip Actions" click)
          ======================================================== */}
      <Modal
        isOpen={Boolean(liveActionTrip)}
        onClose={() => {
          setActionModalTrip(null);
          setActiveActionStep('menu');
        }}
        title={`Trip Actions – #${liveActionTrip?.bookingNumber || liveActionTrip?.bookingId || liveActionTrip?.id}`}
        subtitle="Execute dispatch steps, passenger boarding, odometer logs, and settlement"
        size="lg"
        maxWidth="680px"
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', width: '100%' }}>
            {activeActionStep !== 'menu' && (
              <Button variant="outline" size="sm" onClick={() => setActiveActionStep('menu')}>
                &larr; Back to Actions
              </Button>
            )}
            <Button variant="secondary" size="sm" onClick={() => setActionModalTrip(null)}>
              Close
            </Button>
          </div>
        }
      >
        {liveActionTrip && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Trip Info Header Strip */}
            <div
              style={{
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                padding: '1rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontFamily: 'monospace', fontWeight: 800, color: '#2C3480', fontSize: '1rem' }}>
                    {liveActionTrip.bookingNumber || liveActionTrip.bookingId || liveActionTrip.id}
                  </span>
                  <Badge variant="info" size="sm">
                    {liveActionTrip.tripCategory}
                  </Badge>
                </div>
                <Badge
                  variant={
                    liveActionTrip.status === 'Trip Started'
                      ? 'primary'
                      : liveActionTrip.status === 'Arrived at Pickup'
                      ? 'warning'
                      : liveActionTrip.status === 'Trip Completed'
                      ? 'success'
                      : 'default'
                  }
                  dot
                  size="sm"
                >
                  {liveActionTrip.status}
                </Badge>
              </div>

              <div style={{ fontSize: '0.8125rem', color: '#0f172a', fontWeight: 600 }}>
                {liveActionTrip.pickupLocation} &rarr; {liveActionTrip.destination || liveActionTrip.dropLocation}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: '#64748b', flexWrap: 'wrap', gap: '0.5rem', paddingTop: '0.35rem', borderTop: '1px solid #edf2f7' }}>
                <span>Passenger: <strong>{liveActionTrip.customerName}</strong> ({liveActionTrip.passengerCount || 4} Pax)</span>
                <span>Vehicle: <strong>{liveActionTrip.vehicle?.model || 'Swift VXI'}</strong> ({liveActionTrip.vehicle?.regNo || 'TN-01-AB-2144'})</span>
                <span style={{ color: '#16a34a', fontWeight: 700 }}>Allowance: ₹{liveActionTrip.totalTripEarnings || 1800}</span>
              </div>
            </div>

            {/* Step 1: Main Actions Menu */}
            {activeActionStep === 'menu' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {/* Status-Based Execution Action Cards */}
                {(liveActionTrip.status === 'Accepted' || liveActionTrip.status === 'Assigned' || liveActionTrip.rawStatus === 'Driver Accepted') && (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', backgroundColor: '#fffbeb', borderRadius: '12px', border: '1px solid #fde68a', gap: '0.75rem', flexWrap: 'wrap' }}>
                      <div>
                        <strong style={{ color: '#92400e', fontSize: '0.9rem', display: 'block' }}>Step 1: Arrive at Pickup Location</strong>
                        <span style={{ fontSize: '0.775rem', color: '#b45309' }}>Notify Admin &amp; passenger that vehicle is at reporting location.</span>
                      </div>
                      <Button
                        variant="primary"
                        size="sm"
                        style={{ backgroundColor: '#f59e0b', borderColor: '#f59e0b', color: '#000', fontWeight: 800 }}
                        onClick={() => {
                          updateTripStatus(liveActionTrip.bookingId || liveActionTrip.id, 'Arrived at Pickup');
                        }}
                      >
                        I Have Arrived at Pickup
                      </Button>
                    </div>

                    {isLiveTripFuture ? (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', gap: '0.75rem', flexWrap: 'wrap' }}>
                        <div>
                          <strong style={{ color: '#475569', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <Clock size={16} color="#2C3480" /> Step 2: Starts on Journey Date
                          </strong>
                          <span style={{ fontSize: '0.775rem', color: '#64748b' }}>
                            Journey scheduled for {formatDateDMY(liveTripJDate)}. Driver can start the trip on the journey start date.
                          </span>
                        </div>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => {
                            toast.info(`Journey scheduled for ${formatDateDMY(liveTripJDate)}. Driver can start the trip on the journey start date.`);
                          }}
                          style={{ backgroundColor: '#f1f5f9', color: '#64748b', fontWeight: 700 }}
                        >
                          Starts on {formatDateDMY(liveTripJDate)}
                        </Button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', backgroundColor: '#eef2ff', borderRadius: '12px', border: '1px solid #c7d2fe', gap: '0.75rem', flexWrap: 'wrap' }}>
                        <div>
                          <strong style={{ color: '#2C3480', fontSize: '0.9rem', display: 'block' }}>Step 2: Start Trip &amp; Board Passengers</strong>
                          <span style={{ fontSize: '0.775rem', color: '#4338ca' }}>Record starting vehicle odometer reading to start journey.</span>
                        </div>
                        <Button
                          variant="primary"
                          size="sm"
                          style={{ backgroundColor: '#2C3480', borderColor: '#2C3480', fontWeight: 800 }}
                          onClick={() => setActiveActionStep('start')}
                        >
                          Start Trip &rarr;
                        </Button>
                      </div>
                    )}
                  </>
                )}

                {liveActionTrip.status === 'Arrived at Pickup' && (
                  isLiveTripFuture ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', gap: '0.75rem', flexWrap: 'wrap' }}>
                      <div>
                        <strong style={{ color: '#475569', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <Clock size={16} color="#2C3480" /> Journey Starts on {formatDateDMY(liveTripJDate)}
                        </strong>
                        <span style={{ fontSize: '0.775rem', color: '#64748b' }}>
                          Reporting confirmed. Driver can start the trip on the journey start date ({formatDateDMY(liveTripJDate)}).
                        </span>
                      </div>
                      <Button
                        variant="secondary"
                        size="sm"
                        disabled
                        style={{ backgroundColor: '#f1f5f9', color: '#64748b', fontWeight: 700 }}
                      >
                        Starts {formatDateDMY(liveTripJDate)}
                      </Button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', backgroundColor: '#eef2ff', borderRadius: '12px', border: '1px solid #c7d2fe', gap: '0.75rem', flexWrap: 'wrap' }}>
                      <div>
                        <strong style={{ color: '#2C3480', fontSize: '0.9rem', display: 'block' }}>Passengers Boarded &bull; Ready to Roll</strong>
                        <span style={{ fontSize: '0.775rem', color: '#4338ca' }}>Record starting vehicle odometer reading and commence route.</span>
                      </div>
                      <Button
                        variant="primary"
                        size="sm"
                        style={{ backgroundColor: '#2C3480', borderColor: '#2C3480', fontWeight: 800 }}
                        onClick={() => setActiveActionStep('start')}
                      >
                        Record Meter &amp; Start &rarr;
                      </Button>
                    </div>
                  )
                )}

                {liveActionTrip.status === 'Trip Started' && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.1rem', backgroundColor: '#ecfdf5', borderRadius: '12px', border: '1.5px solid #86efac', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981' }} />
                        <strong style={{ color: '#065f46', fontSize: '0.95rem' }}>Trip Currently In Progress (Live on Road)</strong>
                      </div>
                      <span style={{ fontSize: '0.775rem', color: '#047857', display: 'block', marginTop: '0.2rem' }}>
                        Starting Odometer: <strong>{liveActionTrip.startOdometer || 34200} KM</strong> &bull; GPS tracking active
                      </span>
                    </div>
                    <Button
                      variant="primary"
                      size="sm"
                      style={{ backgroundColor: '#10b981', borderColor: '#10b981', fontWeight: 800 }}
                      onClick={() => setActiveActionStep('complete')}
                    >
                      Complete Trip &amp; Settle &rarr;
                    </Button>
                  </div>
                )}

                {liveActionTrip.status === 'Trip Completed' && (
                  <div style={{ padding: '1.25rem', backgroundColor: '#f0fdf4', borderRadius: '12px', border: '1.5px solid #86efac', textAlign: 'center' }}>
                    <CheckCircle size={32} color="#16a34a" style={{ margin: '0 auto 0.4rem' }} />
                    <strong style={{ fontSize: '1rem', color: '#166534', display: 'block' }}>Journey Completed &amp; Settled!</strong>
                    <span style={{ fontSize: '0.8rem', color: '#15803d' }}>
                      Distance: {liveActionTrip.distanceTravelled || 145} KM &bull; Driver Allowance: ₹{liveActionTrip.totalTripEarnings || 1800} Credited to Account
                    </span>
                  </div>
                )}

                {/* Quick Utility Links Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(135px, 1fr))', gap: '0.75rem', marginTop: '0.5rem' }}>
                  <a
                    href={`tel:${liveActionTrip.customerPhone || '9840199880'}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.45rem',
                      padding: '0.65rem 0.75rem',
                      backgroundColor: '#f0fdf4',
                      color: '#166534',
                      borderRadius: '8px',
                      border: '1px solid #bbf7d0',
                      fontSize: '0.8125rem',
                      fontWeight: 700,
                      textDecoration: 'none'
                    }}
                  >
                    <Phone size={15} /> Call Passenger
                  </a>

                  <button
                    type="button"
                    onClick={() => {
                      const query = encodeURIComponent(`${liveActionTrip.pickupLocation} to ${liveActionTrip.destination || liveActionTrip.dropLocation}`);
                      window.open(`https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(liveActionTrip.pickupLocation)}&destination=${encodeURIComponent(liveActionTrip.destination || liveActionTrip.dropLocation)}`, '_blank');
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.45rem',
                      padding: '0.65rem 0.75rem',
                      backgroundColor: '#eff6ff',
                      color: '#1e40af',
                      borderRadius: '8px',
                      border: '1px solid #bfdbfe',
                      fontSize: '0.8125rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    <Navigation size={15} /> Google Maps
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActionModalTrip(null);
                      navigate(`/driver/trips/${liveActionTrip.bookingId || liveActionTrip.id}/expenses`);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.45rem',
                      padding: '0.65rem 0.75rem',
                      backgroundColor: '#fffbeb',
                      color: '#92400e',
                      borderRadius: '8px',
                      border: '1px solid #fde68a',
                      fontSize: '0.8125rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    <Receipt size={15} /> Claim Toll/Fuel
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActionModalTrip(null);
                      navigate(`/driver/trips/${liveActionTrip.bookingId || liveActionTrip.id}`);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.45rem',
                      padding: '0.65rem 0.75rem',
                      backgroundColor: '#f8fafc',
                      color: '#334155',
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0',
                      fontSize: '0.8125rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    <FileText size={15} /> Full Manifest
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Start Trip Odometer Input */}
            {activeActionStep === 'start' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ padding: '0.75rem 1rem', backgroundColor: '#eef2ff', borderRadius: '8px', border: '1px solid #c7d2fe', fontSize: '0.8125rem', color: '#2C3480' }}>
                  Please inspect vehicle dashboard and enter starting odometer reading before beginning travel.
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                    Current Starting Odometer Reading (KM) *
                  </label>
                  <Input
                    type="number"
                    value={startOdoInput}
                    onChange={(e) => setStartOdoInput(e.target.value)}
                    placeholder="e.g. 34200"
                  />
                  <span style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.25rem', display: 'block' }}>
                    Minimum reading: {liveActionTrip.startOdometer || 34200} KM
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                  <Button variant="outline" size="sm" onClick={() => setActiveActionStep('menu')}>
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    style={{ backgroundColor: '#2C3480', borderColor: '#2C3480', fontWeight: 800 }}
                    onClick={() => {
                      if (isLiveTripFuture) {
                        toast.error(`Trip cannot be started prior to the journey start date (${formatDateDMY(liveTripJDate)}). The driver/admin can start the trip on the journey start date.`);
                        return;
                      }
                      const odo = parseInt(startOdoInput, 10) || 42100;
                      const res = updateTripStatus(liveActionTrip.bookingId || liveActionTrip.id, 'Trip Started', { startOdometer: odo });
                      if (res !== false) {
                        setActiveActionStep('menu');
                      }
                    }}
                  >
                    Confirm Start Trip
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: Complete Trip Input */}
            {activeActionStep === 'complete' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ padding: '0.75rem 1rem', backgroundColor: '#f0fdf4', borderRadius: '8px', border: '1px solid #bbf7d0', fontSize: '0.8125rem', color: '#166534' }}>
                  Enter ending odometer to finalize trip distance and submit completion manifest for allowance settlement.
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                    Final Ending Odometer Reading (KM) *
                  </label>
                  <Input
                    type="number"
                    value={endOdoInput}
                    onChange={(e) => setEndOdoInput(e.target.value)}
                    placeholder="e.g. 34345"
                  />
                  <span style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.25rem', display: 'block' }}>
                    Traversed: {(parseInt(endOdoInput, 10) || 34345) - (liveActionTrip.startOdometer || 34200)} KM
                  </span>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                    Trip Completion Remarks
                  </label>
                  <textarea
                    rows={3}
                    value={completionRemarks}
                    onChange={(e) => setCompletionRemarks(e.target.value)}
                    style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.875rem', fontFamily: 'inherit' }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                  <Button variant="outline" size="sm" onClick={() => setActiveActionStep('menu')}>
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    style={{ backgroundColor: '#10b981', borderColor: '#10b981', fontWeight: 800 }}
                    onClick={() => {
                      const endOdo = parseInt(endOdoInput, 10) || 42245;
                      updateTripStatus(liveActionTrip.bookingId || liveActionTrip.id, 'Trip Completed', {
                        endOdometer: endOdo,
                        completionRemarks
                      });
                      setActiveActionStep('menu');
                    }}
                  >
                    Finalize &amp; Complete Trip
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Clarification Request Modal */}
      <Modal
        isOpen={Boolean(clarifyModalItem)}
        onClose={() => setClarifyModalItem(null)}
        title={`Request Clarification for #${clarifyModalItem?.bookingId}`}
        subtitle="Send inquiry to MAK Operations Desk"
        size="md"
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', width: '100%' }}>
            <Button variant="outline" onClick={() => setClarifyModalItem(null)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              style={{ backgroundColor: '#2C3480', borderColor: '#2C3480', fontWeight: 700 }}
              onClick={handleSendClarification}
            >
              Send Inquiry
            </Button>
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
              Your Question regarding Route / Timings / Allowances
            </label>
            <textarea
              rows={4}
              placeholder="e.g. Please confirm if interstate AP permit toll is pre-paid or cash reimbursement..."
              value={clarifyQuery}
              onChange={(e) => setClarifyQuery(e.target.value)}
              style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.875rem', fontFamily: 'inherit' }}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default DriverTripAssignments;
