// MAK Tours & Travels ERP - Vendor Payment Disbursements History
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CreditCard,
  Download,
  Search,
  CheckCircle2,
  ArrowLeft,
  Calendar,
  IndianRupee,
  FileText
} from 'lucide-react';
import { Card, CardHeader, CardBody } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { Modal } from '../../../components/ui/Modal';
import { useVendorData } from '../../../context/VendorDataContext';
import { VendorNavTabs, VENDOR_FINANCE_TABS } from '../../../components/vendor/VendorNavTabs';
import { formatDateDMY } from '../../../utils/dateUtils';

export function PaymentList() {
  const navigate = useNavigate();
  const { payments, profile } = useVendorData();

  const [receiptModalPayment, setReceiptModalPayment] = useState(null);

  const totalDisbursed = payments.reduce((sum, p) => sum + (p.amount || 0), 0);

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
            Disbursement Payout History
          </h1>
          <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0.25rem 0 0' }}>
            Verified bank settlements, UTR transaction references and payment vouchers
          </p>
        </div>

        <Button
          variant="outline"
          onClick={() => navigate('/vendor/invoices')}
        >
          View Invoices →
        </Button>
      </div>

      {/* Disbursed Banner */}
      <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', padding: '1rem 1.25rem', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#16a34a', textTransform: 'uppercase' }}>CUMULATIVE PAYOUTS RECEIVED</span>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#15803d' }}>
            ₹{totalDisbursed.toLocaleString('en-IN')}
          </div>
          <span style={{ fontSize: '0.75rem', color: '#475569' }}>
            Credited to {profile.bankDetails?.bankName} (Acct ending in {profile.bankDetails?.accountNumber?.slice(-4)})
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#15803d', fontWeight: 700, fontSize: '0.85rem' }}>
          <CheckCircle2 size={18} /> Direct NEFT/IMPS Verified
        </div>
      </div>

      {/* Payments Table */}
      <Card>
        <CardBody style={{ padding: 0 }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                  <th style={{ padding: '0.875rem 1rem' }}>Voucher Ref</th>
                  <th style={{ padding: '0.875rem 1rem' }}>Date & Time</th>
                  <th style={{ padding: '0.875rem 1rem' }}>Payment Method</th>
                  <th style={{ padding: '0.875rem 1rem' }}>UTR / Bank Reference</th>
                  <th style={{ padding: '0.875rem 1rem' }}>Invoice Ref</th>
                  <th style={{ padding: '0.875rem 1rem', textAlign: 'right' }}>Amount Paid (INR)</th>
                  <th style={{ padding: '0.875rem 1rem', textAlign: 'center' }}>Status</th>
                  <th style={{ padding: '0.875rem 1rem', textAlign: 'right' }}>Receipt</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '0.875rem 1rem', fontWeight: 800, color: '#2C3480', fontFamily: 'monospace' }}>
                      {p.paymentNumber}
                    </td>
                    <td style={{ padding: '0.875rem 1rem' }}>
                      <div>{formatDateDMY(p.date)}</div>
                      <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{p.time}</div>
                    </td>
                    <td style={{ padding: '0.875rem 1rem' }}>{p.method}</td>
                    <td style={{ padding: '0.875rem 1rem', fontFamily: 'monospace', fontWeight: 600 }}>{p.transactionRef}</td>
                    <td style={{ padding: '0.875rem 1rem', color: '#2C3480', fontWeight: 600 }}>{p.invoiceRef}</td>
                    <td style={{ padding: '0.875rem 1rem', textAlign: 'right', fontWeight: 800, color: '#16a34a', fontSize: '0.95rem' }}>
                      ₹{p.amount.toLocaleString('en-IN')}
                    </td>
                    <td style={{ padding: '0.875rem 1rem', textAlign: 'center' }}>
                      <StatusBadge status={p.status} />
                    </td>
                    <td style={{ padding: '0.875rem 1rem', textAlign: 'right' }}>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setReceiptModalPayment(p)}
                      >
                        <Download size={13} style={{ marginRight: '0.2rem' }} /> Receipt
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>

      {/* Payment Receipt Modal */}
      <Modal
        isOpen={Boolean(receiptModalPayment)}
        onClose={() => setReceiptModalPayment(null)}
        title={`Payment Voucher - ${receiptModalPayment?.paymentNumber}`}
        subtitle="Official settlement remittance advice"
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', width: '100%' }}>
            <Button variant="outline" onClick={() => setReceiptModalPayment(null)}>Close</Button>
            <Button variant="primary" style={{ backgroundColor: '#2C3480' }} onClick={() => alert('Remittance voucher PDF downloaded')}>
              Download PDF Voucher
            </Button>
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.85rem' }}>
          <div style={{ backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ color: '#64748b' }}>Remitted Amount:</span>
              <strong style={{ fontSize: '1.2rem', color: '#16a34a' }}>₹{receiptModalPayment?.amount?.toLocaleString('en-IN')}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
              <span style={{ color: '#64748b' }}>UTR Reference:</span>
              <strong style={{ fontFamily: 'monospace' }}>{receiptModalPayment?.transactionRef}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
              <span style={{ color: '#64748b' }}>Disbursement Date:</span>
              <span>{formatDateDMY(receiptModalPayment?.date)} at {receiptModalPayment?.time}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748b' }}>Beneficiary Account:</span>
              <span>{receiptModalPayment?.beneficiaryAccount}</span>
            </div>
          </div>

          <p style={{ fontSize: '0.75rem', color: '#64748b', margin: 0 }}>
            Remitted by: MAK Tours & Travels Operations Private Limited &bull; GSTIN: 33AAACM5512L1Z9
          </p>
        </div>
      </Modal>
    </div>
  );
}

export default PaymentList;
