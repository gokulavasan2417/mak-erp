// MAK Tours & Travels ERP - Vendor Payment Statements & CSV Export
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Download,
  Calendar,
  IndianRupee,
  ArrowLeft,
  CheckCircle2
} from 'lucide-react';
import { Card, CardHeader, CardBody } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { useVendorData } from '../../../context/VendorDataContext';
import { VendorNavTabs, VENDOR_FINANCE_TABS } from '../../../components/vendor/VendorNavTabs';
import { formatDateDMY } from '../../../utils/dateUtils';

export function PaymentStatements() {
  const navigate = useNavigate();
  const { bookings, profile } = useVendorData();

  const [statementMonth, setStatementMonth] = useState('All');

  const handleExportCSV = () => {
    const headers = ['Booking ID', 'Customer', 'Category', 'Travel Date', 'Pickup', 'Destination', 'Gross Booking Amount', 'Admin Commission (10%)', 'Vendor Net Payable', 'Amount Paid', 'Remaining Dues', 'Status'];
    const rows = bookings.map((b) => [
      b.id,
      `"${b.customerName}"`,
      b.bookingCategory,
      formatDateDMY(b.travelDate),
      `"${b.pickupLocation}"`,
      `"${b.dropLocation}"`,
      b.bookingAmount,
      b.adminCommission,
      b.vendorPayable,
      b.paidAmount,
      b.remainingAmount,
      b.paymentStatus
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Vendor_Statement_${profile.vendorId}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
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
          <button
            onClick={() => navigate('/vendor/finance')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              background: 'none',
              border: 'none',
              color: '#64748b',
              fontSize: '0.85rem',
              cursor: 'pointer',
              marginBottom: '0.4rem',
              padding: 0
            }}
          >
            <ArrowLeft size={16} /> Back to Finance Dashboard
          </button>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
            Vendor Monthly Payment Statements
          </h1>
          <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0.25rem 0 0' }}>
            Consolidated booking-wise financial ledger with working CSV data export
          </p>
        </div>

        <Button
          variant="primary"
          style={{ backgroundColor: '#2C3480' }}
          onClick={handleExportCSV}
        >
          <Download size={16} style={{ marginRight: '0.35rem' }} /> Export Statement (CSV)
        </Button>
      </div>

      {/* Statement Table */}
      <Card>
        <CardHeader
          title={`Booking-Wise Statement Ledger (${bookings.length} Records)`}
          subtitle={`Entity: ${profile.companyName} &bull; GSTIN: ${profile.gstin}`}
        />
        <CardBody style={{ padding: 0 }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                  <th style={{ padding: '0.875rem 1rem' }}>Booking #</th>
                  <th style={{ padding: '0.875rem 1rem' }}>Customer</th>
                  <th style={{ padding: '0.875rem 1rem' }}>Category</th>
                  <th style={{ padding: '0.875rem 1rem' }}>Date</th>
                  <th style={{ padding: '0.875rem 1rem', textAlign: 'right' }}>Booking Amount</th>
                  <th style={{ padding: '0.875rem 1rem', textAlign: 'right' }}>Commission (10%)</th>
                  <th style={{ padding: '0.875rem 1rem', textAlign: 'right' }}>Net Vendor Payable</th>
                  <th style={{ padding: '0.875rem 1rem', textAlign: 'right' }}>Paid Amount</th>
                  <th style={{ padding: '0.875rem 1rem', textAlign: 'right' }}>Remaining Balance</th>
                  <th style={{ padding: '0.875rem 1rem', textAlign: 'center' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((b) => (
                  <tr key={b.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '0.875rem 1rem', fontWeight: 800, color: '#2C3480' }}>
                      #{b.id}
                    </td>
                    <td style={{ padding: '0.875rem 1rem' }}>{b.customerName}</td>
                    <td style={{ padding: '0.875rem 1rem' }}>{b.bookingCategory}</td>
                    <td style={{ padding: '0.875rem 1rem' }}>{formatDateDMY(b.travelDate)}</td>
                    <td style={{ padding: '0.875rem 1rem', textAlign: 'right' }}>₹{b.bookingAmount?.toLocaleString('en-IN')}</td>
                    <td style={{ padding: '0.875rem 1rem', textAlign: 'right', color: '#dc2626' }}>- ₹{b.adminCommission?.toLocaleString('en-IN')}</td>
                    <td style={{ padding: '0.875rem 1rem', textAlign: 'right', fontWeight: 800, color: '#2C3480' }}>₹{b.vendorPayable?.toLocaleString('en-IN')}</td>
                    <td style={{ padding: '0.875rem 1rem', textAlign: 'right', color: '#16a34a' }}>₹{b.paidAmount?.toLocaleString('en-IN')}</td>
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

export default PaymentStatements;
