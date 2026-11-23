// MAK Tours & Travels ERP - Driver Payments History & Receipts
import React, { useState } from 'react';
import {
  CreditCard,
  Download,
  CheckCircle,
  FileText,
  Building,
  ShieldCheck,
  Eye,
  ArrowRight
} from 'lucide-react';
import { Breadcrumbs } from '../../components/common/Breadcrumbs';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { useDriverData } from '../../context/DriverDataContext';
import { initialDriverProfile } from '../../data/driverPortalData';
import { formatCurrency } from '../../utils/formatters';

export function DriverPayments() {
  const { payments, driver } = useDriverData();
  const safePayments = Array.isArray(payments) ? payments : [];
  const safeDriver = driver ? { ...initialDriverProfile, ...driver } : initialDriverProfile;
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div>
        <Breadcrumbs portal="driver" />
        <h1 style={{ fontSize: '1.625rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.25rem' }}>
          Direct Bank Payment Settlements
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          Official payment remittance advice, bank UTR numbers, and downloadable payment vouchers.
        </p>
      </div>

      {/* Payments History Cards View */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
              Bank Remittance Receipts
            </h2>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', margin: '0.2rem 0 0' }}>
              Direct UPI &amp; IMPS transfers disbursed to your registered bank account
            </p>
          </div>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b' }}>
            {safePayments.length} Vouchers Issued
          </span>
        </div>

        {safePayments.length === 0 ? (
          <div
            style={{
              padding: '3rem 1.5rem',
              textAlign: 'center',
              backgroundColor: 'var(--bg-surface)',
              borderRadius: '14px',
              border: '1px solid var(--border-light)',
              color: 'var(--text-muted)'
            }}
          >
            <CreditCard size={36} style={{ margin: '0 auto 0.75rem auto', opacity: 0.5 }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', margin: '0 0 0.25rem 0' }}>
              No Remittance Vouchers Yet
            </h3>
            <p style={{ fontSize: '0.85rem', margin: 0 }}>
              Direct bank settlements and allowance disbursements will appear here upon admin approval.
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
            {safePayments.map((p) => (
              <div
                key={p.id}
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  borderRadius: '14px',
                  border: '1px solid var(--border-light)',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                  padding: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.875rem'
                }}
              >
                {/* Top Row: IDs & Status */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontFamily: 'monospace', fontWeight: 800, color: '#2C3480', fontSize: '0.875rem' }}>
                      {p.id}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: '#64748b', fontFamily: 'monospace' }}>
                      ({p.tripId})
                    </span>
                  </div>
                  <Badge variant="success" dot size="sm">
                    {p.status}
                  </Badge>
                </div>

                {/* Amount Disbursed & Date */}
                <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                  <div>
                    <span style={{ fontSize: '0.6875rem', color: '#64748b', fontWeight: 600, display: 'block', textTransform: 'uppercase' }}>
                      Disbursed Amount
                    </span>
                    <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#10b981' }}>
                      ₹{Number(p.amount || 0).toLocaleString('en-IN')}
                    </div>
                  </div>
                  <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                    {p.date}
                  </span>
                </div>

                {/* Method & Bank UTR */}
                <div style={{ backgroundColor: 'var(--bg-app, #f8fafc)', borderRadius: '8px', padding: '0.625rem 0.75rem', border: '1px solid #f1f5f9' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#090d16' }}>
                    {p.paymentMethod}
                  </div>
                  <div style={{ fontSize: '0.725rem', fontFamily: 'monospace', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                    UTR: {p.utrNumber}
                  </div>
                </div>

                {/* Action Button */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid #f1f5f9', paddingTop: '0.75rem' }}>
                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={<Eye size={14} />}
                    onClick={() => setSelectedReceipt(p)}
                    style={{ width: '100%', justifyContent: 'center' }}
                  >
                    View Remittance Receipt
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Payment Receipt Modal */}
      <Modal
        isOpen={Boolean(selectedReceipt)}
        onClose={() => setSelectedReceipt(null)}
        title="Official Payment Remittance Advice"
        subtitle={`Receipt Ref #${selectedReceipt?.id}`}
        size="md"
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', width: '100%' }}>
            <Button variant="outline" onClick={() => setSelectedReceipt(null)}>
              Close
            </Button>
            <Button
              variant="primary"
              style={{ backgroundColor: '#2C3480', borderColor: '#2C3480' }}
              leftIcon={<Download size={14} />}
              onClick={() => {
                alert('Downloading official payment advice PDF voucher...');
              }}
            >
              Download PDF Voucher
            </Button>
          </div>
        }
      >
        {selectedReceipt && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.875rem' }}>
            <div style={{ textAlign: 'center', padding: '1rem', backgroundColor: '#f0fdf4', borderRadius: '10px', border: '1px solid #bbf7d0' }}>
              <span style={{ fontSize: '0.75rem', color: '#166534', fontWeight: 600 }}>SETTLED DISBURSEMENT</span>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#15803d', marginTop: '0.2rem' }}>
                ₹{Number(selectedReceipt.amount || 0).toLocaleString('en-IN')}
              </div>
              <span style={{ fontSize: '0.75rem', color: '#166534' }}>
                Disbursed on {selectedReceipt.date} via {selectedReceipt.paymentMethod}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.8125rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Beneficiary Driver:</span>
                <strong>{safeDriver?.fullName || safeDriver?.name || 'Arun Kumar Sundaram'}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Driver ID:</span>
                <strong style={{ fontFamily: 'monospace' }}>{safeDriver?.id || 'DRV-001'}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Bank UTR / Transaction No:</span>
                <strong style={{ fontFamily: 'monospace', color: '#2C3480' }}>{selectedReceipt.utrNumber}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Trip Manifest Ref:</span>
                <strong style={{ fontFamily: 'monospace' }}>{selectedReceipt.tripId}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Narration:</span>
                <span>{selectedReceipt.description}</span>
              </div>
            </div>

            <div style={{ fontSize: '0.75rem', color: '#64748b', textAlign: 'center' }}>
              Issued by MAK Tours & Travels Accounts & Settlements Directorate, Chennai.
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default DriverPayments;
