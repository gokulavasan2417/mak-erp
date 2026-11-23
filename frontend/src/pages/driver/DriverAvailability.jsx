// MAK Tours & Travels ERP - Driver Duty Availability & Leave Roster
import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Clock,
  CheckCircle,
  AlertTriangle,
  Plus,
  ArrowRight,
  ShieldCheck,
  CalendarCheck
} from 'lucide-react';
import { Breadcrumbs } from '../../components/common/Breadcrumbs';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { useToast } from '../../context/ToastContext';
import { useDriverData } from '../../context/DriverDataContext';
import { initialDriverProfile } from '../../data/driverPortalData';

export function DriverAvailability() {
  const toast = useToast();
  const {
    driver,
    trips = [],
    leaveRequests = [],
    setDutyStatus,
    requestLeave,
    cancelLeave
  } = useDriverData();

  const safeDriver = driver ? { ...initialDriverProfile, ...driver } : initialDriverProfile;
  const safeLeaves = Array.isArray(leaveRequests) ? leaveRequests : [];

  const [cancelConfirmLeave, setCancelConfirmLeave] = useState(null);

  // Today's date YYYY-MM-DD
  const todayStr = useMemo(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }, []);

  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [leaveStart, setLeaveStart] = useState(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  });
  const [leaveEnd, setLeaveEnd] = useState(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  });
  const [leaveReason, setLeaveReason] = useState('');

  // Format date to DD-MM-YYYY
  const formatDmy = (dateVal) => {
    if (!dateVal) return '—';
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return String(dateVal);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  };

  // Normalize any date string to YYYY-MM-DD for reliable comparison
  const normalizeDateStr = (dateVal) => {
    if (!dateVal) return '';
    if (typeof dateVal === 'string') {
      const dmy = dateVal.match(/^(\d{2})-(\d{2})-(\d{4})$/);
      if (dmy) return `${dmy[3]}-${dmy[2]}-${dmy[1]}`;
      const ymd = dateVal.match(/^(\d{4})-(\d{2})-(\d{2})/);
      if (ymd) return `${ymd[1]}-${ymd[2]}-${ymd[3]}`;
    }
    try {
      const d = new Date(dateVal);
      if (!isNaN(d.getTime())) {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
      }
    } catch {
      // fallback
    }
    return String(dateVal);
  };

  // 14 days schedule matrix for November 2026
  const scheduleDays = useMemo(() => [
    { day: '15 Sun', date: '2026-11-15' },
    { day: '16 Mon', date: '2026-11-16' },
    { day: '17 Tue', date: '2026-11-17' },
    { day: '18 Wed', date: '2026-11-18' },
    { day: '19 Thu', date: '2026-11-19' },
    { day: '20 Fri', date: '2026-11-20' },
    { day: '21 Sat', date: '2026-11-21' },
    { day: '22 Sun', date: '2026-11-22' },
    { day: '23 Mon', date: '2026-11-23' },
    { day: '24 Tue', date: '2026-11-24' },
    { day: '25 Wed', date: '2026-11-25' },
    { day: '26 Thu', date: '2026-11-26' },
    { day: '27 Fri', date: '2026-11-27' },
    { day: '28 Sat', date: '2026-11-28' }
  ], []);

  // Evaluated status according to specification:
  // - Past date with completed trip: COMPLETED (Grey)
  // - Past date with no assigned trip: NO TRIP (Light grey)
  // - Past date with cancelled trip: CANCELLED (Red)
  // - Current date with no trip: AVAILABLE (Green)
  // - Future date with no assignment: AVAILABLE (Green)
  // - Future date with assigned trip: SCHEDULED (Blue)
  // - Approved leave: ON LEAVE (Orange)
  const dynamicScheduleDays = useMemo(() => {
    return scheduleDays.map((item) => {
      const itemDate = normalizeDateStr(item.date);
      const isPast = itemDate < todayStr;
      const isToday = itemDate === todayStr;
      const isFuture = itemDate > todayStr;

      // Condition 7: Approved leave -> ON LEAVE (Orange)
      const matchedLeave = safeLeaves.find((l) => {
        const start = normalizeDateStr(l.startDate);
        const end = normalizeDateStr(l.endDate) || start;
        const isApproved = l.status === 'Approved';
        return isApproved && itemDate >= start && itemDate <= end;
      });

      if (matchedLeave) {
        return {
          ...item,
          status: 'ON LEAVE',
          tripId: null,
          info: matchedLeave.reason || 'Approved Planned Leave'
        };
      }

      // Check for matched trip on this date
      const matchedTrip = (trips || []).find((t) => {
        const start = normalizeDateStr(t.pickupDate || t.journeyDate || t.travelDate || t.departureDate);
        const end = normalizeDateStr(t.returnDate) || start;
        return itemDate >= start && itemDate <= end;
      });

      const tripStatusRaw = (matchedTrip?.status || matchedTrip?.bookingStatus || matchedTrip?.tripStatus || '').toLowerCase();
      const isCancelled = tripStatusRaw.includes('cancel');
      const isCompleted = tripStatusRaw.includes('complete') || tripStatusRaw === 'trip completed';

      // 1. Past date
      if (isPast) {
        if (matchedTrip) {
          if (isCancelled) {
            // Past date with cancelled trip -> CANCELLED (Red)
            return {
              ...item,
              status: 'CANCELLED',
              tripId: matchedTrip.bookingNumber || matchedTrip.bookingId || matchedTrip.id,
              info: `Cancelled (${(matchedTrip.destination || '').split(',')[0] || 'Trip'})`
            };
          }
          // Past date with completed trip -> COMPLETED (Grey)
          return {
            ...item,
            status: 'COMPLETED',
            tripId: matchedTrip.bookingNumber || matchedTrip.bookingId || matchedTrip.id,
            info: `${matchedTrip.tripCategory || 'Trip'} (${(matchedTrip.destination || '').split(',')[0] || 'Tour'})`
          };
        }
        // Past date with no assigned trip -> NO TRIP (Light grey)
        return {
          ...item,
          status: 'NO TRIP',
          tripId: null,
          info: 'No Trip Logged'
        };
      }

      // 2. Current date
      if (isToday) {
        if (matchedTrip) {
          if (isCancelled) {
            return {
              ...item,
              status: 'CANCELLED',
              tripId: matchedTrip.bookingNumber || matchedTrip.bookingId || matchedTrip.id,
              info: `Cancelled (${(matchedTrip.destination || '').split(',')[0] || 'Trip'})`
            };
          }
          if (isCompleted) {
            return {
              ...item,
              status: 'COMPLETED',
              tripId: matchedTrip.bookingNumber || matchedTrip.bookingId || matchedTrip.id,
              info: `${matchedTrip.tripCategory || 'Trip'} (${(matchedTrip.destination || '').split(',')[0] || 'Concluded'})`
            };
          }
          // Current date with active/assigned trip -> SCHEDULED (Blue)
          return {
            ...item,
            status: 'SCHEDULED',
            tripId: matchedTrip.bookingNumber || matchedTrip.bookingId || matchedTrip.id,
            info: `${matchedTrip.tripCategory || 'Trip'} (${(matchedTrip.destination || '').split(',')[0] || 'Active'})`
          };
        }
        // Current date with no trip -> AVAILABLE (Green)
        return {
          ...item,
          status: 'AVAILABLE',
          tripId: null,
          info: 'Standby / Pool'
        };
      }

      // 3. Future date
      if (isFuture) {
        if (matchedTrip) {
          if (isCancelled) {
            return {
              ...item,
              status: 'CANCELLED',
              tripId: matchedTrip.bookingNumber || matchedTrip.bookingId || matchedTrip.id,
              info: `Cancelled (${(matchedTrip.destination || '').split(',')[0] || 'Trip'})`
            };
          }
          // Future date with assigned trip -> SCHEDULED (Blue)
          return {
            ...item,
            status: 'SCHEDULED',
            tripId: matchedTrip.bookingNumber || matchedTrip.bookingId || matchedTrip.id,
            info: `${matchedTrip.tripCategory || 'Trip'} (${(matchedTrip.destination || '').split(',')[0] || 'Tour'})`
          };
        }
        // Future date with no assignment -> AVAILABLE (Green)
        return {
          ...item,
          status: 'AVAILABLE',
          tripId: null,
          info: 'Standby / Pool'
        };
      }

      return item;
    });
  }, [scheduleDays, safeLeaves, trips, todayStr]);

  const handleLeaveSubmit = (e) => {
    e.preventDefault();
    if (!leaveStart || leaveStart < todayStr) {
      toast.error('Past leave dates cannot be applied. Please choose today or a future date.');
      return;
    }
    if (!leaveEnd || leaveEnd < leaveStart) {
      toast.error('End date cannot be earlier than start date.');
      return;
    }
    if (!leaveReason.trim()) {
      toast.error('Please enter a reason for the leave request.');
      return;
    }

    requestLeave({
      startDate: leaveStart,
      endDate: leaveEnd,
      reason: leaveReason.trim()
    });
    setIsLeaveModalOpen(false);
    setLeaveReason('');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'COMPLETED':
        return {
          bg: '#f1f5f9',
          text: '#475569',
          border: '#cbd5e1',
          badgeBg: '#e2e8f0',
          badgeText: '#334155'
        };
      case 'NO TRIP':
        return {
          bg: '#f8fafc',
          text: '#94a3b8',
          border: '#e2e8f0',
          badgeBg: '#f1f5f9',
          badgeText: '#64748b'
        };
      case 'CANCELLED':
        return {
          bg: '#fef2f2',
          text: '#dc2626',
          border: '#fecaca',
          badgeBg: '#fee2e2',
          badgeText: '#b91c1c'
        };
      case 'AVAILABLE':
        return {
          bg: '#f0fdf4',
          text: '#15803d',
          border: '#bbf7d0',
          badgeBg: '#dcfce7',
          badgeText: '#166534'
        };
      case 'SCHEDULED':
      case 'ON TRIP':
        return {
          bg: '#eff6ff',
          text: '#1d4ed8',
          border: '#bfdbfe',
          badgeBg: '#dbeafe',
          badgeText: '#1e40af'
        };
      case 'ON LEAVE':
        return {
          bg: '#fff7ed',
          text: '#c2410c',
          border: '#fed7aa',
          badgeBg: '#ffedd5',
          badgeText: '#9a3412'
        };
      default:
        return {
          bg: '#f8fafc',
          text: '#64748b',
          border: '#e2e8f0',
          badgeBg: '#f1f5f9',
          badgeText: '#475569'
        };
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
        <div>
          <Breadcrumbs portal="driver" />
          <h1 style={{ fontSize: '1.625rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.25rem' }}>
            Duty Availability & Leave Calendar
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Manage standby duty hours, planned leaves, and view your upcoming dispatch schedule.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Button
            variant="primary"
            size="md"
            style={{ backgroundColor: '#2C3480', borderColor: '#2C3480' }}
            leftIcon={<Plus size={16} />}
            onClick={() => {
              setLeaveStart(todayStr);
              setLeaveEnd(todayStr);
              setIsLeaveModalOpen(true);
            }}
          >
            Request Planned Leave
          </Button>
        </div>
      </div>

      {/* Current Duty State Indicator */}
      <Card>
        <CardBody style={{ padding: '1.25rem', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                backgroundColor: safeDriver.dutyStatus === 'Available' ? '#f0fdf4' : '#f8fafc',
                color: safeDriver.dutyStatus === 'Available' ? '#16a34a' : '#64748b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <CheckCircle size={24} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-main)' }}>
                  Current Duty Status:
                </span>
                <Badge variant={safeDriver.dutyStatus === 'Available' ? 'success' : 'default'} size="sm" dot>
                  {safeDriver.dutyStatus}
                </Badge>
              </div>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', margin: '0.15rem 0 0 0' }}>
                {safeDriver.dutyStatus === 'Available'
                  ? 'You are active in the MAK Operations standby pool ready for trip allocations.'
                  : 'You are marked offline or off-duty.'}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Button
              variant={safeDriver.dutyStatus === 'Available' ? 'primary' : 'outline'}
              size="sm"
              style={safeDriver.dutyStatus === 'Available' ? { backgroundColor: '#10b981', borderColor: '#10b981' } : {}}
              onClick={() => setDutyStatus('Available')}
            >
              Set Available
            </Button>
            <Button
              variant={safeDriver.dutyStatus === 'Unavailable' ? 'primary' : 'outline'}
              size="sm"
              style={safeDriver.dutyStatus === 'Unavailable' ? { backgroundColor: '#64748b', borderColor: '#64748b' } : {}}
              onClick={() => setDutyStatus('Unavailable')}
            >
              Set Unavailable
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* 14-Day Calendar Matrix */}
      <Card>
        <CardHeader
          title="Fortnight Duty Schedule (November 2026)"
          subtitle="Assigned tour circuits, standby availability, and scheduled leave days"
        />
        <CardBody style={{ padding: '1.5rem' }}>
          {/* Recommended Status Labels Legend */}
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem', padding: '0.75rem 1rem', backgroundColor: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.75rem' }}>
            <span style={{ fontWeight: 800, color: '#334155', marginRight: '0.25rem' }}>Status Guide:</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span style={{ width: '9px', height: '9px', borderRadius: '50%', backgroundColor: '#64748b' }} />
              <span style={{ fontWeight: 700, color: '#475569' }}>COMPLETED</span>
              <span style={{ color: '#94a3b8', fontSize: '0.7rem' }}>(Past completed trip)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span style={{ width: '9px', height: '9px', borderRadius: '50%', backgroundColor: '#cbd5e1' }} />
              <span style={{ fontWeight: 700, color: '#94a3b8' }}>NO TRIP</span>
              <span style={{ color: '#94a3b8', fontSize: '0.7rem' }}>(Past date no trip)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span style={{ width: '9px', height: '9px', borderRadius: '50%', backgroundColor: '#ef4444' }} />
              <span style={{ fontWeight: 700, color: '#dc2626' }}>CANCELLED</span>
              <span style={{ color: '#94a3b8', fontSize: '0.7rem' }}>(Past cancelled)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span style={{ width: '9px', height: '9px', borderRadius: '50%', backgroundColor: '#22c55e' }} />
              <span style={{ fontWeight: 700, color: '#15803d' }}>AVAILABLE</span>
              <span style={{ color: '#94a3b8', fontSize: '0.7rem' }}>(Current / Future standby)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span style={{ width: '9px', height: '9px', borderRadius: '50%', backgroundColor: '#3b82f6' }} />
              <span style={{ fontWeight: 700, color: '#1d4ed8' }}>SCHEDULED</span>
              <span style={{ color: '#94a3b8', fontSize: '0.7rem' }}>(Future assigned trip)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span style={{ width: '9px', height: '9px', borderRadius: '50%', backgroundColor: '#f97316' }} />
              <span style={{ fontWeight: 700, color: '#c2410c' }}>ON LEAVE</span>
              <span style={{ color: '#94a3b8', fontSize: '0.7rem' }}>(Approved leave)</span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem' }}>
            {dynamicScheduleDays.map((item) => {
              const colors = getStatusColor(item.status);

              return (
                <div
                  key={item.date}
                  style={{
                    borderRadius: '10px',
                    border: `1px solid ${colors.border}`,
                    backgroundColor: colors.bg,
                    padding: '0.875rem 0.625rem',
                    textAlign: 'center',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    minHeight: '125px',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <span style={{ fontSize: '0.8125rem', fontWeight: 800, color: 'var(--text-main)' }}>
                    {item.day}
                  </span>

                  <div>
                    <span
                      style={{
                        fontSize: '0.6875rem',
                        fontWeight: 800,
                        color: colors.badgeText || colors.text,
                        backgroundColor: colors.badgeBg || 'transparent',
                        padding: '0.2rem 0.5rem',
                        borderRadius: '6px',
                        textTransform: 'uppercase',
                        display: 'inline-block',
                        marginBottom: item.tripId ? '0.25rem' : '0'
                      }}
                    >
                      {item.status}
                    </span>
                    {item.tripId && (
                      <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', fontWeight: 700, color: '#2C3480', display: 'block' }}>
                        {item.tripId}
                      </span>
                    )}
                  </div>

                  <span style={{ fontSize: '0.7rem', color: colors.text, fontWeight: 500 }}>
                    {item.info}
                  </span>
                </div>
              );
            })}
          </div>
        </CardBody>
      </Card>

      {/* Leave Requests Log */}
      <Card>
        <CardHeader
          title="Submitted Leave & Holiday Requests"
          subtitle="Track approval progress with Admin Operations Desk"
        />
        <CardBody style={{ padding: 0 }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--bg-surface-hover)', borderBottom: '1px solid var(--border-light)', textAlign: 'left' }}>
                  <th style={{ padding: '0.75rem 1.25rem', color: 'var(--text-muted)' }}>LEAVE REF</th>
                  <th style={{ padding: '0.75rem 1.25rem', color: 'var(--text-muted)' }}>DATES</th>
                  <th style={{ padding: '0.75rem 1.25rem', color: 'var(--text-muted)' }}>REASON</th>
                  <th style={{ padding: '0.75rem 1.25rem', color: 'var(--text-muted)' }}>STATUS</th>
                  <th style={{ padding: '0.75rem 1.25rem', color: 'var(--text-muted)', textAlign: 'right' }}>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {safeLeaves.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                      No leave requests filed yet. Click "Request Planned Leave" above to apply.
                    </td>
                  </tr>
                ) : (
                  safeLeaves.map((req) => {
                    const isApproved = req.status === 'Approved';
                    const isCancelled = req.status === 'Cancelled';
                    const isRejected = req.status === 'Rejected';
                    const isPending = req.status === 'Under Review' || req.status === 'Pending';

                    return (
                      <tr key={req.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                        <td style={{ padding: '0.875rem 1.25rem', fontFamily: 'monospace', fontWeight: 700, color: '#2C3480' }}>
                          {req.id}
                        </td>
                        <td style={{ padding: '0.875rem 1.25rem', fontWeight: 600 }}>
                          {formatDmy(req.startDate)} to {formatDmy(req.endDate)}
                        </td>
                        <td style={{ padding: '0.875rem 1.25rem', color: 'var(--text-secondary)' }}>
                          {req.reason}
                        </td>
                        <td style={{ padding: '0.875rem 1.25rem' }}>
                          <Badge
                            variant={isApproved ? 'success' : isPending ? 'warning' : isCancelled ? 'neutral' : 'danger'}
                            dot
                            size="sm"
                          >
                            {req.status || 'Under Review'}
                          </Badge>
                        </td>
                        <td style={{ padding: '0.875rem 1.25rem', textAlign: 'right' }}>
                          {!isCancelled && !isRejected ? (
                            <Button
                              size="xs"
                              variant="outline"
                              style={{
                                color: '#dc2626',
                                borderColor: '#fca5a5',
                                fontWeight: 700,
                                fontSize: '0.75rem',
                                padding: '0.25rem 0.65rem'
                              }}
                              onClick={() => setCancelConfirmLeave(req)}
                            >
                              Cancel Leave
                            </Button>
                          ) : (
                            <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontStyle: 'italic', fontWeight: 500 }}>
                              {isCancelled ? 'Cancelled' : '—'}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>

      {/* Cancel Leave Confirmation Modal */}
      <Modal
        isOpen={Boolean(cancelConfirmLeave)}
        onClose={() => setCancelConfirmLeave(null)}
        title="Cancel Leave Request"
        subtitle={`Leave Application Ref #${cancelConfirmLeave?.id}`}
        size="sm"
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', width: '100%' }}>
            <Button variant="ghost" onClick={() => setCancelConfirmLeave(null)}>
              Keep Leave
            </Button>
            <Button
              variant="danger"
              style={{ backgroundColor: '#dc2626', borderColor: '#dc2626', fontWeight: 700 }}
              onClick={() => {
                if (cancelConfirmLeave) {
                  if (cancelLeave) {
                    cancelLeave(cancelConfirmLeave.id, 'Cancelled by Driver');
                  }
                  setCancelConfirmLeave(null);
                }
              }}
            >
              Confirm Cancellation
            </Button>
          </div>
        }
      >
        {cancelConfirmLeave && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <p style={{ margin: 0, fontSize: '0.875rem', color: '#334155', lineHeight: 1.5 }}>
              Are you sure you want to cancel your leave request for{' '}
              <strong>
                {formatDmy(cancelConfirmLeave.startDate)} to {formatDmy(cancelConfirmLeave.endDate)}
              </strong>
              ?
            </p>
            <div
              style={{
                backgroundColor: '#fff7ed',
                border: '1px solid #fed7aa',
                borderRadius: '8px',
                padding: '0.75rem',
                fontSize: '0.8125rem',
                color: '#9a3412',
                lineHeight: 1.4
              }}
            >
              ⚠ Cancelling this leave will restore your roster availability to <strong>Standby / Pool</strong> and notify
              the Admin Operations Desk immediately.
            </div>
          </div>
        )}
      </Modal>

      {/* Request Leave Modal */}
      <Modal
        isOpen={isLeaveModalOpen}
        onClose={() => setIsLeaveModalOpen(false)}
        title="Request Planned Leave / Time-Off"
        subtitle="Submit holiday notice for Admin Operations approval"
        size="md"
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', width: '100%' }}>
            <Button variant="outline" onClick={() => setIsLeaveModalOpen(false)}>Cancel</Button>
            <Button variant="primary" style={{ backgroundColor: '#2C3480', borderColor: '#2C3480', fontWeight: 700 }} onClick={handleLeaveSubmit}>
              Submit Leave Request
            </Button>
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                Start Date * (Today or Future)
              </label>
              <Input
                type="date"
                min={todayStr}
                value={leaveStart}
                onChange={(e) => {
                  const val = e.target.value;
                  setLeaveStart(val);
                  if (leaveEnd < val) {
                    setLeaveEnd(val);
                  }
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                End Date *
              </label>
              <Input
                type="date"
                min={leaveStart || todayStr}
                value={leaveEnd}
                onChange={(e) => setLeaveEnd(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
              Reason for Leave *
            </label>
            <textarea
              rows={3}
              placeholder="e.g. Annual family temple festival in Tirunelveli..."
              value={leaveReason}
              onChange={(e) => setLeaveReason(e.target.value)}
              style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.875rem', fontFamily: 'inherit' }}
            />
          </div>

          <div style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '0.75rem', fontSize: '0.75rem', color: '#1e40af' }}>
            ℹ Notice: Leave requests must be filed at least 72 hours prior to scheduled dates to ensure relief driver dispatch.
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default DriverAvailability;
