import React, { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Compass,
  Calendar,
  Clock,
  MapPin,
  Car,
  User,
  Phone,
  ArrowRight,
  TrendingUp,
  CreditCard,
  CheckCircle,
  AlertTriangle,
  Award,
  ShieldCheck,
  CalendarCheck,
  ChevronRight,
  Navigation,
  FileCheck,
  DollarSign,
  Receipt,
  Plus,
  Play,
  CheckCircle2
} from 'lucide-react';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { StatCard } from '../../components/common/StatCard';
import { SimpleChart } from '../../components/common/SimpleChart';
import { useDriverData } from '../../context/DriverDataContext';
import { useTripContext } from '../../context/TripContext';
import { formatCurrency, calculateBookingKm } from '../../utils/formatters';
import { initialDriverProfile, initialDriverTrips, initialDriverEarnings } from '../../data/driverPortalData';

export function DriverDashboard() {
  const navigate = useNavigate();
  const tripCtx = useTripContext();
  const {
    driver,
    trips,
    pendingAssignments,
    earnings,
    expenses = [],
    notifications,
    setDutyStatus,
    triggerEmergencySos
  } = useDriverData();

  const driverExpenses = useMemo(() => {
    if (Array.isArray(expenses) && expenses.length > 0) return expenses;
    if (tripCtx?.expenses) {
      return tripCtx.expenses.filter((e) => e.driverId === 'DRV-001' || e.driverId === driver?.id);
    }
    return [];
  }, [expenses, tripCtx, driver]);

  const pendingExpenses = driverExpenses.filter((e) => e.status === 'Pending Approval');
  const approvedExpenses = driverExpenses.filter((e) => e.status === 'Approved' || e.status === 'Paid');
  const rejectedExpenses = driverExpenses.filter((e) => e.status === 'Rejected');

  const safeDriver = driver ? { ...initialDriverProfile, ...driver } : initialDriverProfile;
  const safeTrips = Array.isArray(trips) ? trips : [];
  const safeEarnings = Array.isArray(earnings) ? earnings : [];
  const safeAssignments = Array.isArray(pendingAssignments) ? pendingAssignments : [];

  // Trips filtering
  const todayStr = new Date().toISOString().substring(0, 10);
  const todayTrips = safeTrips.filter((t) => t.pickupDate === todayStr && t.status !== 'Trip Completed');
  const upcomingTrips = safeTrips.filter((t) => t.status === 'Accepted' || t.status === 'Assigned');
  const activeTrips = safeTrips.filter((t) => t.status === 'Trip Started' || t.status === 'Arrived at Pickup');
  const completedTrips = safeTrips.filter((t) => t.status === 'Trip Completed');
  const completedTripsCount = Math.max(
    completedTrips.length,
    safeTrips.length,
    Number(safeDriver?.totalTripsCompleted || 0)
  );

  // Total calculations
  const totalEarningsAmount = safeEarnings.reduce((sum, e) => sum + (e.totalEarnings || 0), 0);
  const pendingPaymentAmount = safeEarnings
    .filter((e) => e.paymentStatus === 'Pending')
    .reduce((sum, e) => sum + (e.totalEarnings || 0), 0);
  const thisMonthEarnings = safeEarnings.reduce((sum, e) => sum + (e.totalEarnings || 0), 0);

  const driverId = safeDriver?.id || driver?.id || 'DRV-001';
  const driverName = String(safeDriver?.name || driver?.name || safeDriver?.fullName || '').toLowerCase().trim();

  // Calculate total distance driven across all assigned bookings for this driver (trip completion is NOT required)
  const totalDistanceDrivenKm = useMemo(() => {
    const seenIds = new Set();
    let totalKm = 0;

    // 1. Gather all driver trips & assignments from DriverDataContext
    [...(safeTrips || []), ...(safeAssignments || [])].forEach((t) => {
      const tKey = t.id || t.bookingId || t.bookingNumber;
      if (tKey && !seenIds.has(tKey)) {
        seenIds.add(tKey);
        totalKm += calculateBookingKm(t);
      }
    });

    // 2. Gather all matching bookings from TripContext (active, confirmed, upcoming, completed)
    const allBookings = tripCtx?.bookings || [];
    allBookings.forEach((b) => {
      const bStatus = String(b.status || b.bookingStatus || '').toLowerCase();
      if (bStatus === 'cancelled') return;

      const bDriverId = String(b.driverId || b.assignedDriver?.id || b.assignedDriverId || '').trim();
      const bDriverName = String(b.driverName || b.assignedDriver?.name || b.assignedDriver?.fullName || '').toLowerCase().trim();

      const isMatch =
        (driverId && bDriverId === driverId) ||
        (driverName && bDriverName && (bDriverName.includes(driverName) || driverName.includes(bDriverName))) ||
        (!bDriverId && (driverId === 'DRV-001' || driverName.includes('murugan')));

      if (isMatch) {
        const bKey = b.id || b.bookingNumber || b.refId || b._id;
        if (bKey && !seenIds.has(bKey)) {
          seenIds.add(bKey);
          totalKm += calculateBookingKm(b);
        }
      }
    });

    // 3. Baseline for historical verified trips on record
    if (totalKm === 0 && completedTripsCount > 0) {
      totalKm = completedTripsCount * 250;
    }

    return Math.max(totalKm, Number(safeDriver?.totalDistanceKm || 0));
  }, [safeTrips, safeAssignments, tripCtx?.bookings, driverId, driverName, completedTripsCount, safeDriver?.totalDistanceKm]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case 'Trip Started':
        return 'primary';
      case 'Arrived at Pickup':
        return 'warning';
      case 'Accepted':
        return 'info';
      case 'Trip Completed':
        return 'success';
      case 'Assigned':
        return 'warning';
      default:
        return 'default';
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header Welcome Card */}
      <div
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderRadius: '16px',
          border: '1px solid var(--border-light)',
          padding: '1.5rem',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1.25rem',
          boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          {safeDriver?.avatar || safeDriver?.photo ? (
            <img
              src={safeDriver?.avatar || safeDriver?.photo}
              alt={safeDriver?.displayName || safeDriver?.name || 'Driver'}
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                objectFit: 'cover',
                border: '3px solid #2C3480',
                boxShadow: '0 4px 10px rgba(44, 52, 128, 0.15)'
              }}
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          ) : (
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: '#2C3480',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.5rem',
                fontWeight: 800,
                border: '3px solid #ffffff',
                boxShadow: '0 4px 10px rgba(44, 52, 128, 0.2)'
              }}
            >
              {(safeDriver?.displayName || safeDriver?.name || 'CH').substring(0, 2).toUpperCase()}
            </div>
          )}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', flexWrap: 'wrap' }}>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                {getGreeting()}, {safeDriver?.displayName || safeDriver?.fullName || safeDriver?.name || 'Driver'}!
              </h1>
              <Badge variant="success" size="sm" dot>
                Verified Driver
              </Badge>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', margin: '0.25rem 0 0 0' }}>
              Driver ID: <strong style={{ color: '#2C3480', fontFamily: 'monospace' }}>{safeDriver?.id || safeDriver?.driverBadgeId || 'DRV-001'}</strong> &bull; Assigned Fleet:{' '}
              <strong>{safeDriver?.assignedVehicle?.model || 'Toyota Innova Crysta'} ({safeDriver?.assignedVehicle?.regNo || 'TN-09-CB-4491'})</strong>
            </p>
          </div>
        </div>

        {/* Duty Status Selector & SOS */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', backgroundColor: 'var(--bg-surface-hover)', padding: '0.35rem 0.6rem', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Duty:</span>
            {['Available', 'Unavailable'].map((st) => (
              <button
                key={st}
                onClick={() => setDutyStatus(st)}
                style={{
                  padding: '0.25rem 0.6rem',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  backgroundColor: (safeDriver?.dutyStatus || 'Available') === st ? (st === 'Available' ? '#10b981' : '#64748b') : 'transparent',
                  color: (safeDriver?.dutyStatus || 'Available') === st ? '#ffffff' : 'var(--text-muted)'
                }}
              >
                {st}
              </button>
            ))}
          </div>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate('/driver/availability')}
            leftIcon={<Calendar size={14} />}
          >
            Duty Calendar
          </Button>

          <Button
            variant="primary"
            size="sm"
            style={{ backgroundColor: '#2C3480', borderColor: '#2C3480', fontWeight: 700 }}
            leftIcon={<Receipt size={14} />}
            onClick={() => navigate('/driver/expenses?action=new')}
          >
            Submit Trip Expense
          </Button>
        </div>
      </div>

      {/* New Trip Assignment Alert Banner */}
      {pendingAssignments.length > 0 && (
        <div
          style={{
            backgroundColor: '#EEF0FD',
            border: '1px solid #C7CEFA',
            borderRadius: '12px',
            padding: '1rem 1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            flexWrap: 'wrap'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#2C3480', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CalendarCheck size={20} />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '0.9375rem', color: '#2C3480' }}>
                {pendingAssignments.length} New Trip Assignment{pendingAssignments.length > 1 ? 's' : ''} Awaiting Your Acceptance
              </div>
              <div style={{ fontSize: '0.8125rem', color: '#475569' }}>
                Assigned by Admin Operations. Please confirm within scheduled deadline.
              </div>
            </div>
          </div>

          <Button
            variant="primary"
            size="sm"
            style={{ backgroundColor: '#2C3480', borderColor: '#2C3480', fontWeight: 700 }}
            rightIcon={<ArrowRight size={14} />}
            onClick={() => navigate('/driver/trips/assignments')}
          >
            Review Assignments
          </Button>
        </div>
      )}

      {/* Summary KPI Cards Grid (6 Cards) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
        <StatCard
          title="Today's Trips"
          value={String(todayTrips.length)}
          change={todayTrips.length > 0 ? 'Active Duty' : 'No trips today'}
          isPositive={todayTrips.length > 0}
          description="Scheduled for today"
          icon={Navigation}
          accentColor="#2C3480"
          onClick={() => navigate('/driver/trips?tab=Today')}
          tooltip="View Today's Duty & Schedule"
        />

        <StatCard
          title="Upcoming Trips"
          value={String(upcomingTrips.length)}
          change="Confirmed on roster"
          isPositive={true}
          description="Next 7 days"
          icon={Calendar}
          accentColor="#6366f1"
          onClick={() => navigate('/driver/trips?tab=Upcoming')}
          tooltip="View Upcoming Assigned Trips"
        />

        <StatCard
          title="Completed Trips"
          value={String(completedTripsCount)}
          change="Career total"
          isPositive={true}
          description="Zero incident rating"
          icon={CheckCircle}
          accentColor="#10b981"
          onClick={() => navigate('/driver/trips?tab=Completed')}
          tooltip="View Completed Trips Manifest"
        />

        <StatCard
          title="This Month"
          value={formatCurrency(thisMonthEarnings)}
          change="Driver allowances"
          isPositive={true}
          description="Trip allowances"
          icon={TrendingUp}
          accentColor="#2C3480"
          onClick={() => navigate('/driver/earnings')}
          tooltip="View Monthly Earnings & Allowances"
        />

        <StatCard
          title="Total Earnings"
          value={formatCurrency(totalEarningsAmount)}
          change="All approved trips"
          isPositive={true}
          description="Cumulative allowances"
          icon={DollarSign}
          accentColor="#059669"
          onClick={() => navigate('/driver/earnings')}
          tooltip="View Total Cumulative Allowances"
        />

        <StatCard
          title="Pending Clearance"
          value={formatCurrency(pendingPaymentAmount)}
          change="Next payout cycle"
          isPositive={false}
          description="Unpaid trip allowances"
          icon={CreditCard}
          accentColor="#f59e0b"
          onClick={() => navigate('/driver/payments')}
          tooltip="View Pending Clearance & Payout History"
        />
      </div>

      {/* Driver Trip Expenses Summary Cards */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Receipt size={18} color="#2C3480" />
            <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#090d16', margin: 0 }}>
              Trip Expenses &amp; Reimbursement Claims
            </h3>
          </div>
          <Button
            size="sm"
            variant="ghost"
            rightIcon={<ArrowRight size={14} />}
            onClick={() => navigate('/driver/expenses')}
          >
            Manage Expenses
          </Button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '0.85rem' }}>
          <div
            onClick={() => navigate('/driver/expenses?status=pending')}
            role="button"
            tabIndex={0}
            title="Filter by Pending Claims"
            style={{
              backgroundColor: '#fffbeb',
              border: '1px solid #fde68a',
              borderRadius: '12px',
              padding: '0.85rem 1rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              userSelect: 'none'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 16px rgba(180, 83, 9, 0.12)';
              e.currentTarget.style.borderColor = '#d97706';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'none';
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.style.borderColor = '#fde68a';
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#92400e', textTransform: 'uppercase' }}>
                Pending Approval ({pendingExpenses.length})
              </div>
              <ArrowRight size={12} color="#b45309" />
            </div>
            <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#b45309', marginTop: '0.2rem' }}>
              ₹{pendingExpenses.reduce((s, e) => s + (e.amount || 0), 0).toLocaleString('en-IN')}
            </div>
            <div style={{ fontSize: '0.7rem', color: '#92400e', marginTop: '0.15rem' }}>Awaiting Operations review</div>
          </div>

          <div
            onClick={() => navigate('/driver/expenses?status=approved')}
            role="button"
            tabIndex={0}
            title="Filter by Approved Claims"
            style={{
              backgroundColor: '#ecfdf5',
              border: '1px solid #a7f3d0',
              borderRadius: '12px',
              padding: '0.85rem 1rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              userSelect: 'none'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 16px rgba(5, 150, 105, 0.12)';
              e.currentTarget.style.borderColor = '#059669';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'none';
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.style.borderColor = '#a7f3d0';
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#065f46', textTransform: 'uppercase' }}>
                Approved Claims ({approvedExpenses.length})
              </div>
              <ArrowRight size={12} color="#059669" />
            </div>
            <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#059669', marginTop: '0.2rem' }}>
              ₹{approvedExpenses.reduce((s, e) => s + (parseFloat(e.approvedAmount || e.amount) || 0), 0).toLocaleString('en-IN')}
            </div>
            <div style={{ fontSize: '0.7rem', color: '#065f46', marginTop: '0.15rem' }}>Cleared for reimbursement</div>
          </div>

          <div
            onClick={() => navigate('/driver/expenses?status=rejected')}
            role="button"
            tabIndex={0}
            title="Filter by Rejected Claims"
            style={{
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '12px',
              padding: '0.85rem 1rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              userSelect: 'none'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 16px rgba(220, 38, 38, 0.12)';
              e.currentTarget.style.borderColor = '#dc2626';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'none';
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.style.borderColor = '#fecaca';
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#991b1b', textTransform: 'uppercase' }}>
                Rejected Claims ({rejectedExpenses.length})
              </div>
              <ArrowRight size={12} color="#dc2626" />
            </div>
            <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#dc2626', marginTop: '0.2rem' }}>
              ₹{rejectedExpenses.reduce((s, e) => s + (e.amount || 0), 0).toLocaleString('en-IN')}
            </div>
            <div style={{ fontSize: '0.7rem', color: '#991b1b', marginTop: '0.15rem' }}>Requires correction &amp; resubmit</div>
          </div>
        </div>
      </div>

      {/* Today's Schedule Card */}
      <Card>
        <CardHeader
          title="Today's Duty Schedule & Active Trips"
          subtitle="Real-time pickup coordination and navigation manifest"
          action={
            <Button
              variant="ghost"
              size="sm"
              rightIcon={<ArrowRight size={14} />}
              onClick={() => navigate('/driver/trips')}
            >
              View All Trips
            </Button>
          }
        />
        <CardBody style={{ padding: '1.25rem' }}>
          {todayTrips.length === 0 ? (
            <div style={{ padding: '2.5rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              <Navigation size={36} style={{ margin: '0 auto 0.75rem', opacity: 0.35, color: '#2C3480' }} />
              <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.9375rem' }}>No trips scheduled for today</div>
              <div style={{ fontSize: '0.8125rem', marginTop: '0.25rem' }}>You are currently on standby in Available status.</div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
              {todayTrips.map((trip) => (
                <div
                  key={trip.id}
                  style={{
                    backgroundColor: 'var(--bg-surface, #ffffff)',
                    border: '1px solid var(--border-light, #e2e8f0)',
                    borderRadius: '12px',
                    padding: '1.125rem',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '0.875rem',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <span style={{ fontFamily: 'monospace', fontWeight: 800, color: '#2C3480', fontSize: '0.875rem' }}>
                        {trip.bookingId}
                      </span>
                      <span style={{ marginLeft: '0.5rem', fontSize: '0.75rem', padding: '0.15rem 0.5rem', backgroundColor: '#f1f5f9', borderRadius: '4px', fontWeight: 600 }}>
                        {trip.tripCategory}
                      </span>
                      {(trip.nightStayAmount || 0) > 0 && (
                        <span style={{ marginLeft: '0.35rem', fontSize: '0.7rem', padding: '0.1rem 0.45rem', backgroundColor: '#DCFCE7', color: '#15803D', borderRadius: '4px', fontWeight: 700 }}>
                          🌙 +₹{Number(trip.nightStayAmount).toLocaleString('en-IN')} Night
                        </span>
                      )}
                    </div>
                    <Badge variant={getStatusBadgeVariant(trip.status)} dot size="sm">
                      {trip.status}
                    </Badge>
                  </div>

                  <div>
                    <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.35rem' }}>
                      <Clock size={13} color="#64748b" /> {trip.pickupTime}
                    </div>
                    <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.875rem' }}>
                      {trip.pickupLocation}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                      ➔ {trip.dropLocation}
                    </div>
                  </div>

                  <div style={{ fontSize: '0.8125rem', padding: '0.5rem 0.75rem', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{trip.customerName}</div>
                    <a href={`tel:${trip.customerPhone}`} style={{ fontSize: '0.75rem', color: '#2C3480', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.15rem' }}>
                      <Phone size={11} /> {trip.customerPhone}
                    </a>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.5rem', borderTop: '1px solid var(--border-light, #e2e8f0)' }}>
                    <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '0.8125rem', color: '#64748b' }}>
                      {trip.vehicle?.regNo || 'Vehicle TBD'}
                    </span>
                    <Button
                      variant="primary"
                      size="sm"
                      style={{ backgroundColor: '#2C3480', borderColor: '#2C3480' }}
                      onClick={() => navigate(`/driver/trips/${trip.id}`)}
                    >
                      View Trip
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Two Column Grid: Upcoming Trips & Driver Performance */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem', alignItems: 'start' }}>
        {/* Upcoming Trips List */}
        <Card>
          <CardHeader
            title="Upcoming Assigned Tours & Trips"
            subtitle="Future journeys confirmed on your duty calendar"
            action={
              <Button
                variant="ghost"
                size="sm"
                rightIcon={<ArrowRight size={14} />}
                onClick={() => navigate('/driver/trips/upcoming')}
              >
                View All
              </Button>
            }
          />
          <CardBody style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            {upcomingTrips.length === 0 ? (
              <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                <Calendar size={32} style={{ margin: '0 auto 0.5rem', opacity: 0.35, color: '#2C3480' }} />
                <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.875rem' }}>No upcoming trips assigned</div>
                <div style={{ fontSize: '0.75rem', marginTop: '0.2rem' }}>New trip dispatches will appear on your roster here.</div>
              </div>
            ) : (
              upcomingTrips.slice(0, 3).map((up) => (
                <div
                  key={up.id}
                  onClick={() => navigate(`/driver/trips/${up.id}`)}
                  style={{
                    padding: '1rem',
                    borderRadius: '10px',
                    backgroundColor: 'var(--bg-surface-hover)',
                    border: '1px solid var(--border-light)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#2C3480', fontSize: '0.875rem' }}>
                        {up.bookingId}
                      </span>
                      <Badge variant="info" size="sm">
                        {up.tripCategory}
                      </Badge>
                    </div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#10b981' }}>
                      Allowance: ₹{Number(up.totalTripEarnings || 1500).toLocaleString('en-IN')}{(up.nightStayAmount || 0) > 0 ? ` (incl. ₹${Number(up.nightStayAmount).toLocaleString('en-IN')} Night)` : ''}
                    </span>
                  </div>

                  <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main)' }}>
                    {up.pickupLocation} ➔ {up.dropLocation}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    <span>
                      <Calendar size={12} style={{ display: 'inline', marginRight: '3px' }} />
                      {up.pickupDate} at {up.pickupTime}
                    </span>
                    <span>Passenger: {up.customerName}</span>
                  </div>
                </div>
              ))
            )}
          </CardBody>
        </Card>

        {/* Driver Performance Card */}
        <Card>
          <CardHeader
            title="Driver Safety & Quality Performance"
            subtitle="Customer feedback scores and on-time ratings"
          />
          <CardBody style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div style={{ padding: '0.875rem', borderRadius: '10px', backgroundColor: '#fefce8', border: '1px solid #fef08a', textAlign: 'center' }}>
                <span style={{ fontSize: '0.75rem', color: '#854d0e', fontWeight: 600 }}>STAR RATING</span>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#a16207', marginTop: '0.2rem' }}>
                  ★ {safeDriver?.rating || '4.9'}
                </div>
                <span style={{ fontSize: '0.7rem', color: '#854d0e' }}>
                  {completedTripsCount ? `Based on ${completedTripsCount} verified trips` : 'New driver profile'}
                </span>
              </div>

              <div style={{ padding: '0.875rem', borderRadius: '10px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', textAlign: 'center' }}>
                <span style={{ fontSize: '0.75rem', color: '#166534', fontWeight: 600 }}>PUNCTUALITY</span>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#15803d', marginTop: '0.2rem' }}>
                  {safeDriver?.onTimePerformanceRate || 99}%
                </div>
                <span style={{ fontSize: '0.7rem', color: '#166534' }}>On-time pickup rate</span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', fontSize: '0.8125rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-light)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Total Distance Driven:</span>
                <strong style={{ color: 'var(--text-main)', fontSize: '0.9rem', fontWeight: 800 }}>
                  {totalDistanceDrivenKm.toLocaleString('en-IN')} KM
                </strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Commercial Driving Experience:</span>
                <strong style={{ color: '#2C3480', fontWeight: 700 }}>{safeDriver?.experienceYears || 9} Years</strong>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

export default DriverDashboard;
