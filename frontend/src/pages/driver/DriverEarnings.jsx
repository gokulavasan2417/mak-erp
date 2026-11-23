// MAK Tours & Travels ERP - Driver Earnings & Allowances
import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DollarSign,
  TrendingUp,
  CreditCard,
  CheckCircle,
  Calendar,
  ArrowRight,
  Download
} from 'lucide-react';
import { Breadcrumbs } from '../../components/common/Breadcrumbs';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { StatCard } from '../../components/common/StatCard';
import { useDriverData } from '../../context/DriverDataContext';
import { formatCurrency } from '../../utils/formatters';

export function DriverEarnings() {
  const navigate = useNavigate();
  const { earnings = [] } = useDriverData();

  const safeEarnings = Array.isArray(earnings) ? earnings : [];
  const totalEarnings = safeEarnings.reduce((sum, e) => sum + (e.totalEarnings || 0), 0);
  const thisMonthEarnings = safeEarnings.reduce((sum, e) => sum + (e.totalEarnings || 0), 0);
  const paidAmount = safeEarnings
    .filter((e) => e.paymentStatus === 'Paid')
    .reduce((sum, e) => sum + (e.totalEarnings || 0), 0);
  const pendingAmount = safeEarnings
    .filter((e) => e.paymentStatus === 'Pending')
    .reduce((sum, e) => sum + (e.totalEarnings || 0), 0);
  const totalAllowances = safeEarnings.reduce((sum, e) => sum + (e.driverAllowance || 0), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
        <div>
          <Breadcrumbs portal="driver" />
          <h1 style={{ fontSize: '1.625rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.25rem' }}>
            Driver Earnings & Duty Allowances
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Detailed breakdown of trip allowances, night halting fees, and payment settlements.
          </p>
        </div>

        <Button
          variant="secondary"
          size="md"
          rightIcon={<ArrowRight size={14} />}
          onClick={() => navigate('/driver/payments')}
        >
          View Bank Settlements
        </Button>
      </div>

      {/* Summary KPI Cards Grid (5 Cards) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', alignItems: 'stretch' }}>
        <StatCard
          title="Total Lifetime Earnings"
          value={formatCurrency(totalEarnings)}
          change="All Completed"
          isPositive={true}
          description="Cumulative earnings"
          icon={TrendingUp}
          accentColor="#2C3480"
        />

        <StatCard
          title="This Month (Nov 2026)"
          value={formatCurrency(thisMonthEarnings)}
          change="Current Cycle"
          isPositive={true}
          description="Trip duty earnings"
          icon={DollarSign}
          accentColor="#059669"
        />

        <StatCard
          title="Disbursed & Paid"
          value={formatCurrency(paidAmount)}
          change="Bank Settled"
          isPositive={true}
          description="Direct to bank account"
          icon={CheckCircle}
          accentColor="#10b981"
        />

        <StatCard
          title="Pending Settlement"
          value={formatCurrency(pendingAmount)}
          change="In Queue"
          isPositive={false}
          description="Clearing by Friday"
          icon={CreditCard}
          accentColor="#f59e0b"
        />

        <StatCard
          title="Total Base Allowances"
          value={formatCurrency(totalAllowances)}
          change="Duty Batta"
          isPositive={true}
          description="Standard trip batta"
          icon={DollarSign}
          accentColor="#6366f1"
        />
      </div>

      {/* Trip-Wise Allowance Breakdown - Modern Cards View */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
              Trip-Wise Allowance Breakdown
            </h2>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', margin: '0.2rem 0 0' }}>
              Itemized driver batta, night surcharges, and approved toll allowances
            </p>
          </div>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b' }}>
            {safeEarnings.length} Disbursed Trips
          </span>
        </div>

        {safeEarnings.length === 0 ? (
          <Card>
            <CardBody style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              <DollarSign size={40} style={{ margin: '0 auto 0.75rem', opacity: 0.5, color: '#2C3480' }} />
              <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-main)' }}>No trip earnings recorded yet</div>
              <p style={{ fontSize: '0.8125rem', marginTop: '0.25rem' }}>Completed trips and driver allowances will appear here once finalized by Operations Desk.</p>
            </CardBody>
          </Card>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem', alignItems: 'stretch' }}>
            {safeEarnings.map((e) => (
            <div
              key={e.id}
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderRadius: '14px',
                border: '1px solid var(--border-light)',
                boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                padding: '1.25rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                height: '100%',
                gap: '0.875rem'
              }}
            >
              {/* Top Row: Trip & Booking IDs + Status */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontFamily: 'monospace', fontWeight: 800, color: '#2C3480', fontSize: '0.875rem' }}>
                    {e.tripId}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: '#64748b', fontFamily: 'monospace' }}>
                    ({e.bookingId})
                  </span>
                </div>
                <Badge variant={e.paymentStatus === 'Paid' ? 'success' : 'warning'} dot size="sm">
                  {e.paymentStatus}
                </Badge>
              </div>

              {/* Date & Category */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
                <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{e.date}</span>
                <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.55rem', backgroundColor: '#f1f5f9', borderRadius: '4px', fontWeight: 700, color: '#334155' }}>
                  {e.tripCategory}
                </span>
              </div>

              {/* Allowance Breakdown Grid */}
              <div style={{ backgroundColor: 'var(--bg-app, #f8fafc)', borderRadius: '10px', padding: '0.75rem', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', textAlign: 'center' }}>
                <div>
                  <span style={{ fontSize: '0.6875rem', color: '#64748b', fontWeight: 600, display: 'block' }}>Driver Batta</span>
                  <strong style={{ fontSize: '0.875rem', color: '#090d16' }}>₹{e.driverAllowance}</strong>
                </div>
                <div>
                  <span style={{ fontSize: '0.6875rem', color: '#64748b', fontWeight: 600, display: 'block' }}>Night/Extra</span>
                  <strong style={{ fontSize: '0.875rem', color: '#090d16' }}>₹{e.extraAllowance}</strong>
                </div>
                <div style={{ borderLeft: '1px solid #e2e8f0' }}>
                  <span style={{ fontSize: '0.6875rem', color: '#15803d', fontWeight: 700, display: 'block' }}>Total Payout</span>
                  <strong style={{ fontSize: '1rem', color: '#10b981', fontWeight: 800 }}>₹{e.totalEarnings}</strong>
                </div>
              </div>

              {/* Footer Payment Date */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', borderTop: '1px solid #f1f5f9', paddingTop: '0.5rem' }}>
                <span>Disbursement Date</span>
                <strong style={{ color: '#090d16' }}>{e.paymentDate || 'Scheduled in Next Cycle'}</strong>
              </div>
            </div>
          ))}
        </div>
      )}
      </div>
    </div>
  );
}

export default DriverEarnings;
