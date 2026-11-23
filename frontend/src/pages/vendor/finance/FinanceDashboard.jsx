// MAK Tours & Travels ERP - Vendor Finance Dashboard & Earnings
import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DollarSign,
  CreditCard,
  FileText,
  TrendingUp,
  Download,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  Clock,
  IndianRupee
} from 'lucide-react';
import { Card, CardHeader, CardBody } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { useVendorData } from '../../../context/VendorDataContext';
import { VendorNavTabs, VENDOR_FINANCE_TABS } from '../../../components/vendor/VendorNavTabs';

export function FinanceDashboard() {
  const navigate = useNavigate();
  const { bookings, payments, invoices, kpis } = useVendorData();

  const totalGrossBookingAmount = bookings.reduce((sum, b) => sum + (b.bookingAmount || 0), 0);
  const totalAdminCommission = bookings.reduce((sum, b) => sum + (b.adminCommission || 0), 0);
  const totalVendorPayable = bookings.reduce((sum, b) => sum + (b.vendorPayable || 0), 0);
  const totalPaidReceived = bookings.reduce((sum, b) => sum + (b.paidAmount || 0), 0);
  const totalRemainingDues = bookings.reduce((sum, b) => sum + (b.remainingAmount || 0), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <VendorNavTabs tabs={VENDOR_FINANCE_TABS} />
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          backgroundColor: '#ffffff',
          padding: '1.25rem 1.5rem',
          borderRadius: '16px',
          border: '1px solid #e2e8f0'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <DollarSign size={18} color="#2C3480" />
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#2C3480', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Vendor Revenue & Payouts
            </span>
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
            Financial Overview & Settlement Ledger
          </h1>
          <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0.25rem 0 0' }}>
            Track booking earnings, net payable settlements, platform commission deductions and pending payouts
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Button
            variant="outline"
            onClick={() => navigate('/vendor/statements')}
          >
            Payment Statements
          </Button>
          <Button
            variant="primary"
            style={{ backgroundColor: '#2C3480' }}
            onClick={() => navigate('/vendor/payments')}
          >
            Disbursement History →
          </Button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        <div style={{ backgroundColor: '#ffffff', padding: '1.25rem', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>TOTAL NET EARNINGS</span>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', marginTop: '0.3rem' }}>
            ₹{totalVendorPayable.toLocaleString('en-IN')}
          </div>
          <span style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: 600 }}>90% Net of 10% Platform fee</span>
        </div>

        <div style={{ backgroundColor: '#ffffff', padding: '1.25rem', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>COMPLETED DISBURSEMENTS</span>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#16a34a', marginTop: '0.3rem' }}>
            ₹{totalPaidReceived.toLocaleString('en-IN')}
          </div>
          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Banked via IMPS / NEFT</span>
        </div>

        <div style={{ backgroundColor: '#ffffff', padding: '1.25rem', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>PENDING SETTLEMENTS</span>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#d97706', marginTop: '0.3rem' }}>
            ₹{totalRemainingDues.toLocaleString('en-IN')}
          </div>
          <span style={{ fontSize: '0.75rem', color: '#d97706', fontWeight: 600 }}>Scheduled for fortnightly payout</span>
        </div>

        <div style={{ backgroundColor: '#ffffff', padding: '1.25rem', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>ADMIN COMMISSION (10%)</span>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#64748b', marginTop: '0.3rem' }}>
            ₹{totalAdminCommission.toLocaleString('en-IN')}
          </div>
          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Platform service deduction</span>
        </div>
      </div>

      {/* Booking-Wise Earnings Breakdown Table */}
      <Card>
        <CardHeader
          title="Booking-Wise Earnings & Settlements"
          subtitle="Net vendor payable calculated automatically (Vendor Payable = Booking Total - 10% Commission)"
        />
        <CardBody style={{ padding: 0 }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                  <th style={{ padding: '0.875rem 1rem' }}>Booking #</th>
                  <th style={{ padding: '0.875rem 1rem' }}>Customer & Route</th>
                  <th style={{ padding: '0.875rem 1rem', textAlign: 'right' }}>Booking Amount</th>
                  <th style={{ padding: '0.875rem 1rem', textAlign: 'right' }}>Admin Commission (10%)</th>
                  <th style={{ padding: '0.875rem 1rem', textAlign: 'right' }}>Vendor Payable (90%)</th>
                  <th style={{ padding: '0.875rem 1rem', textAlign: 'right' }}>Amount Paid</th>
                  <th style={{ padding: '0.875rem 1rem', textAlign: 'right' }}>Remaining Balance</th>
                  <th style={{ padding: '0.875rem 1rem', textAlign: 'center' }}>Settlement Status</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((b) => (
                  <tr key={b.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '0.875rem 1rem', fontWeight: 800, color: '#2C3480' }}>
                      #{b.id}
                    </td>
                    <td style={{ padding: '0.875rem 1rem' }}>
                      <div style={{ fontWeight: 600, color: '#0f172a' }}>{b.customerName}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{b.pickupLocation.split(',')[0]} ➔ {b.dropLocation.split(',')[0]}</div>
                    </td>
                    <td style={{ padding: '0.875rem 1rem', textAlign: 'right', fontWeight: 600 }}>
                      ₹{b.bookingAmount?.toLocaleString('en-IN')}
                    </td>
                    <td style={{ padding: '0.875rem 1rem', textAlign: 'right', color: '#dc2626', fontWeight: 600 }}>
                      - ₹{b.adminCommission?.toLocaleString('en-IN')}
                    </td>
                    <td style={{ padding: '0.875rem 1rem', textAlign: 'right', fontWeight: 800, color: '#2C3480' }}>
                      ₹{b.vendorPayable?.toLocaleString('en-IN')}
                    </td>
                    <td style={{ padding: '0.875rem 1rem', textAlign: 'right', color: '#16a34a', fontWeight: 600 }}>
                      ₹{b.paidAmount?.toLocaleString('en-IN')}
                    </td>
                    <td style={{ padding: '0.875rem 1rem', textAlign: 'right', fontWeight: 800, color: b.remainingAmount > 0 ? '#d97706' : '#16a34a' }}>
                      ₹{b.remainingAmount?.toLocaleString('en-IN')}
                    </td>
                    <td style={{ padding: '0.875rem 1rem', textAlign: 'center' }}>
                      <StatusBadge status={b.paymentStatus} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

export default FinanceDashboard;
