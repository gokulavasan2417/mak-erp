import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Car,
  CalendarCheck,
  CreditCard,
  CheckCircle,
  Plus,
  Download,
  Building,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  Clock,
  MapPin,
  User,
  ShieldAlert,
  HelpCircle,
  ExternalLink,
  Check,
  X
} from 'lucide-react';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { StatCard } from '../../components/common/StatCard';
import { SimpleChart } from '../../components/common/SimpleChart';
import { useVendorData } from '../../context/VendorDataContext';
import { formatCurrency } from '../../utils/formatters';
import { formatDateDMY } from '../../utils/dateUtils';

export function VendorDashboard() {
  const navigate = useNavigate();
  const {
    profile,
    vehicles,
    drivers,
    bookingRequests,
    bookings,
    trips,
    kpis,
    acceptBookingRequest,
    rejectBookingRequest,
    recentActivities
  } = useVendorData();

  const handleDownloadStatement = () => {
    try {
      const headers = [
        'Booking ID',
        'Customer',
        'Category',
        'Travel Date',
        'Pickup',
        'Destination',
        'Gross Booking Amount',
        'Admin Commission (10%)',
        'Vendor Net Payable',
        'Amount Paid',
        'Remaining Dues',
        'Status'
      ];
      const rows = (bookings || []).map((b) => [
        b.id,
        `"${b.customerName || 'Direct Booking'}"`,
        b.bookingCategory || 'Journey',
        formatDateDMY(b.travelDate),
        `"${b.pickupLocation || ''}"`,
        `"${b.dropLocation || ''}"`,
        b.bookingAmount || 0,
        b.adminCommission || 0,
        b.vendorPayable || 0,
        b.paidAmount || 0,
        b.remainingAmount || 0,
        b.paymentStatus || 'Pending'
      ]);

      const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `Vendor_Statement_${profile?.vendorId || 'VND'}_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to export statement CSV', err);
    }
    navigate('/vendor/finance/statements');
  };

  // Dynamic 6-month Remittances and Fleet Utilization calculations from actual bookings & vehicles
  const { chartRemittances, chartMonths, chartUtilization, chartDays } = useMemo(() => {
    // 1. Monthly remittances (last 6 months in ₹ Lakhs)
    const months = [];
    const remittances = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      months.push(d.toLocaleString('en-US', { month: 'short' }));
      const mIdx = d.getMonth();
      const yVal = d.getFullYear();

      const mBookings = (bookings || []).filter((b) => {
        const dateStr = b.travelDate || b.journeyDate || b.createdAt;
        if (!dateStr) return false;
        const bDate = new Date(dateStr);
        return !isNaN(bDate.getTime()) && bDate.getMonth() === mIdx && bDate.getFullYear() === yVal;
      });

      const mNet = mBookings.reduce((sum, b) => sum + (Number(b.vendorPayable) || 0), 0);
      remittances.push(Number((mNet / 100000).toFixed(2)));
    }

    // 2. Day of week fleet utilization (Mon - Sat)
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dayMap = { 1: 0, 2: 1, 3: 2, 4: 3, 5: 4, 6: 5 };
    const dayCounts = [0, 0, 0, 0, 0, 0];

    (bookings || []).forEach((b) => {
      const dateStr = b.travelDate || b.journeyDate;
      if (dateStr) {
        const bDate = new Date(dateStr);
        const dayIdx = dayMap[bDate.getDay()];
        if (dayIdx !== undefined) {
          dayCounts[dayIdx] += 1;
        }
      }
    });

    const totalVeh = (vehicles || []).length;
    const utilization = dayCounts.map((count) => {
      if (totalVeh === 0 || count === 0) return 0;
      return Math.min(100, Math.round((count / totalVeh) * 100));
    });

    return {
      chartRemittances: remittances,
      chartMonths: months,
      chartUtilization: utilization,
      chartDays: days
    };
  }, [bookings, vehicles]);

  const pendingRequests = bookingRequests.filter((r) => r.status === 'Pending');
  const recentBookings = bookings.slice(0, 5);

  // Check for compliance expiry
  const expiringVehicles = vehicles.filter(
    (v) =>
      (v.documents?.insuranceExpiry && v.documents.insuranceExpiry.startsWith('2026-12')) ||
      (v.documents?.fitnessExpiry && v.documents.fitnessExpiry.startsWith('2026-12'))
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Vendor Profile Header */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          backgroundColor: 'var(--bg-surface)',
          padding: '1.25rem 1.5rem',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-light)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'rgba(44, 52, 128, 0.1)',
              color: '#2C3480',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '1.25rem'
            }}
          >
            <Building size={28} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', flexWrap: 'wrap' }}>
              <h1 style={{ fontSize: '1.375rem', fontWeight: 700, color: 'var(--text-main)', letterSpacing: '-0.02em', margin: 0 }}>
                {profile.companyName || 'My Fleet Partner Agency'}
              </h1>
              <Badge variant="warning" size="sm">
                {profile.partnerTier || 'Partner Fleet'}
              </Badge>
              <Badge variant="success" dot size="sm">
                {profile.status || 'Active'}
              </Badge>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', marginTop: '0.25rem', margin: 0 }}>
              Partner ID: <strong style={{ color: '#2C3480', fontFamily: 'monospace' }}>{profile.vendorId || 'VND-NEW'}</strong> &bull; GSTIN: {profile.gstin || 'Not registered'} &bull; Fleet Base: {profile.city || 'Not set'}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<Download size={14} />}
            onClick={handleDownloadStatement}
          >
            Download Statement
          </Button>
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Plus size={14} />}
            onClick={() => navigate('/vendor/vehicles/new')}
          >
            Attach Vehicle
          </Button>
        </div>
      </div>

      {/* Urgent Action Alerts */}
      {pendingRequests.length > 0 && (
        <div
          style={{
            backgroundColor: 'rgba(44, 52, 128, 0.05)',
            border: '1px solid rgba(44, 52, 128, 0.2)',
            borderRadius: 'var(--radius-md)',
            padding: '1rem 1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            flexWrap: 'wrap'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'rgba(44, 52, 128, 0.1)', color: '#2C3480', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Clock size={20} />
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.9375rem', color: '#2C3480' }}>
                {pendingRequests.length} Booking Dispatch Request{pendingRequests.length > 1 ? 's' : ''} Awaiting Your Acceptance
              </div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                Accept within scheduled lead time to avoid automated platform reallocation.
              </div>
            </div>
          </div>
          <Button
            variant="primary"
            size="sm"
            rightIcon={<ArrowRight size={14} />}
            onClick={() => navigate('/vendor/booking-requests')}
          >
            Review Booking Requests
          </Button>
        </div>
      )}

      {/* Compliance Expiry Warning */}
      {expiringVehicles.length > 0 && (
        <div
          style={{
            backgroundColor: '#fffbeb',
            border: '1px solid #fde68a',
            borderRadius: 'var(--radius-md)',
            padding: '0.875rem 1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            fontSize: '0.875rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', color: '#92400e' }}>
            <AlertTriangle size={18} color="#d97706" />
            <span>
              <strong>Statutory Compliance Notice:</strong> {expiringVehicles.length} vehicle(s) have insurance or fitness renewals due within 30 days.
            </span>
          </div>
          <Link to="/vendor/vehicles">
            <span style={{ color: '#d97706', fontWeight: 600, fontSize: '0.8125rem', textDecoration: 'underline' }}>
              Inspect Fleet
            </span>
          </Link>
        </div>
      )}

      {/* 5 Enterprise KPI Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '1rem' }}>
        <StatCard
          title="Attached Fleet"
          value={`${kpis.totalVehicles || 0} Vehicles`}
          change={`${kpis.availableVehicles || 0} Ready | ${kpis.onTripVehicles || 0} On Trip`}
          isPositive={true}
          description="Contracted in MAK pool"
          icon={Car}
          accentColor="#2C3480"
          onClick={() => navigate('/vendor/vehicles')}
          tooltip="View Attached Vehicle Fleet"
        />

        <StatCard
          title="Pending Requests"
          value={String(kpis.pendingRequests)}
          change={kpis.pendingRequests > 0 ? 'Action Needed' : 'All Clear'}
          isPositive={kpis.pendingRequests === 0}
          description="New trip allocations"
          icon={Clock}
          accentColor="#f59e0b"
          onClick={() => navigate('/vendor/booking-requests')}
          tooltip="Review Pending Booking Requests"
        />

        <StatCard
          title="Confirmed Bookings"
          value={String(kpis.confirmedBookings)}
          change="90% Net Payout"
          isPositive={true}
          description="Active and upcoming journeys"
          icon={CalendarCheck}
          accentColor="#10b981"
          onClick={() => navigate('/vendor/bookings')}
          tooltip="View Confirmed Trip Bookings"
        />

        <StatCard
          title="Total Net Earnings"
          value={formatCurrency(kpis.totalRevenue)}
          change="After 10% platform share"
          isPositive={true}
          description="Cumulative billings"
          icon={TrendingUp}
          accentColor="#2C3480"
          onClick={() => navigate('/vendor/finance/statements')}
          tooltip="View Financial Statements & Revenue"
        />

        <StatCard
          title="Pending Clearance"
          value={formatCurrency(kpis.pendingPayments)}
          change="Fortnightly NEFT cycle"
          isPositive={false}
          description="Unpaid trip balances"
          icon={CreditCard}
          accentColor="#6366f1"
          onClick={() => navigate('/vendor/finance/payments')}
          tooltip="View Settlement & Payout Clearance"
        />
      </div>

      {/* Interactive Charts Grid */}
      <div className="grid-cols-2">
        <SimpleChart
          title="Monthly Vendor Net Remittances (₹ Lakhs)"
          subtitle="Net payouts credited to your account after 10% platform fee"
          data={chartRemittances}
          labels={chartMonths}
          type="line"
          accentColor="#2C3480"
        />

        <SimpleChart
          title="Fleet Utilization Rate (%)"
          subtitle="Daily percentage of attached vehicles on active road dispatch"
          data={chartUtilization}
          labels={chartDays}
          type="bar"
          accentColor="#10b981"
        />
      </div>

      {/* Pending Dispatch Requests Quick Table */}
      {pendingRequests.length > 0 && (
        <Card>
          <CardHeader
            title="Immediate Action Required: Incoming Booking Requests"
            subtitle="Confirm availability of vehicle for upcoming bookings"
            action={
              <Button
                variant="ghost"
                size="sm"
                rightIcon={<ArrowRight size={14} />}
                onClick={() => navigate('/vendor/booking-requests')}
              >
                View All Requests
              </Button>
            }
          />
          <CardBody style={{ padding: 0 }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--bg-surface-hover)', borderBottom: '1px solid var(--border-light)', textAlign: 'left' }}>
                    <th style={{ padding: '0.75rem 1.25rem', color: 'var(--text-muted)' }}>REQUEST ID</th>
                    <th style={{ padding: '0.75rem 1.25rem', color: 'var(--text-muted)' }}>SERVICE TYPE</th>
                    <th style={{ padding: '0.75rem 1.25rem', color: 'var(--text-muted)' }}>ROUTE & DATES</th>
                    <th style={{ padding: '0.75rem 1.25rem', color: 'var(--text-muted)' }}>VEHICLE REQUIRED</th>
                    <th style={{ padding: '0.75rem 1.25rem', color: 'var(--text-muted)' }}>NET PAYOUT (90%)</th>
                    <th style={{ padding: '0.75rem 1.25rem', textAlign: 'right', color: 'var(--text-muted)' }}>ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingRequests.slice(0, 3).map((req) => (
                    <tr key={req.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                      <td style={{ padding: '0.875rem 1.25rem', fontFamily: 'monospace', fontWeight: 600, color: '#2C3480' }}>
                        {req.requestId}
                      </td>
                      <td style={{ padding: '0.875rem 1.25rem' }}>
                        <Badge variant="info" size="sm">{req.tripType}</Badge>
                      </td>
                      <td style={{ padding: '0.875rem 1.25rem' }}>
                        <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{req.pickupLocation} → {req.dropLocation}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {req.startDate} to {req.endDate} ({req.durationDays} Days)
                        </div>
                      </td>
                      <td style={{ padding: '0.875rem 1.25rem', color: 'var(--text-secondary)' }}>
                        {req.requestedVehicleType}
                      </td>
                      <td style={{ padding: '0.875rem 1.25rem', fontWeight: 700, color: '#10b981' }}>
                        {formatCurrency(req.netVendorPayout)}
                      </td>
                      <td style={{ padding: '0.875rem 1.25rem', textAlign: 'right' }}>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => navigate('/vendor/booking-requests')}
                        >
                          Respond
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Two-Column Grid: Recent Assigned Bookings & Fleet Status */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(400px, 1.6fr) minmax(320px, 1fr)', gap: '1.5rem', alignItems: 'start' }}>
        {/* Recent Bookings */}
        <Card>
          <CardHeader
            title="Recent Assigned Bookings"
            subtitle="Confirmed client manifests fulfilling your fleet schedule"
            action={
              <Button
                variant="ghost"
                size="sm"
                rightIcon={<ArrowRight size={14} />}
                onClick={() => navigate('/vendor/bookings')}
              >
                View All
              </Button>
            }
          />
          <CardBody style={{ padding: '1.25rem' }}>
            {recentBookings.length === 0 ? (
              <div style={{ padding: '2.5rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                <CalendarCheck size={36} style={{ margin: '0 auto 0.75rem', opacity: 0.35, color: '#2C3480' }} />
                <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.9375rem' }}>No assigned bookings yet</div>
                <div style={{ fontSize: '0.8125rem', marginTop: '0.25rem' }}>Client manifests accepted through booking requests will display here.</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                {recentBookings.map((b) => (
                  <div
                    key={b.id}
                    onClick={() => navigate(`/vendor/bookings/${b.id}`)}
                    style={{
                      padding: '1rem',
                      borderRadius: '10px',
                      backgroundColor: 'var(--bg-app, #f8fafc)',
                      border: '1px solid var(--border-light, #e2e8f0)',
                      cursor: 'pointer',
                      transition: 'border-color 0.15s ease'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#2C3480')}
                    onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border-light, #e2e8f0)')}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#2C3480', fontSize: '0.875rem' }}>
                          {b.bookingNumber}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{b.tripType}</span>
                      </div>
                      <Badge
                        variant={
                          b.bookingStatus === 'Confirmed'
                            ? 'success'
                            : b.bookingStatus === 'In Progress'
                            ? 'info'
                            : 'default'
                        }
                        dot
                        size="sm"
                      >
                        {b.bookingStatus}
                      </Badge>
                    </div>

                    <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.875rem' }}>
                      {b.pickupLocation} → {b.dropLocation}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      <div>Passenger: {b.customerName} ({b.passengers} Pax)</div>
                      <div style={{ fontWeight: 700, color: '#10b981', fontSize: '0.875rem' }}>
                        {formatCurrency(b.vendorPayable)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>

        {/* Right Side: Attached Fleet Status & Recent Activity */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Fleet Status Snapshot */}
          <Card>
            <CardHeader
              title="Fleet Status Breakdown"
              subtitle={`${vehicles.length} vehicles under contract`}
              action={
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/vendor/vehicles')}
                >
                  Manage
                </Button>
              }
            />
            <CardBody style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--border-light)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981' }} />
                  Available for Assignment
                </span>
                <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>{kpis.availableVehicles}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--border-light)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#2C3480' }} />
                  Currently On Road / In Trip
                </span>
                <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>{kpis.onTripVehicles}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--border-light)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#f59e0b' }} />
                  Reserved for Upcoming Booking
                </span>
                <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>{kpis.reservedVehicles}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#ef4444' }} />
                  In Workshop / Maintenance
                </span>
                <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>{kpis.maintenanceVehicles || kpis.vehiclesUnderMaintenance || 0}</span>
              </div>
            </CardBody>
          </Card>

          {/* Recent Activity Log */}
          <Card>
            <CardHeader
              title="Recent Partner Activity"
              subtitle="Audit events on your vendor account"
            />
            <CardBody style={{ padding: '1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              {recentActivities && recentActivities.slice(0, 4).map((act) => (
                <div key={act.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', fontSize: '0.8125rem' }}>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#2C3480', marginTop: '0.4rem', flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{act.action}</div>
                    <div style={{ color: 'var(--text-muted)' }}>{act.details}</div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{act.timestamp}</span>
                  </div>
                </div>
              ))}
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default VendorDashboard;
