// MAK Tours & Travels ERP - Collect Balance Payment Modal
import React, { useState, useEffect } from 'react';
import {
  X,
  CreditCard,
  IndianRupee,
  CheckCircle2,
  AlertCircle,
  QrCode,
  Banknote,
  Building,
  ShieldCheck
} from 'lucide-react';
import { Button } from '../ui/Button';
import { useTripContext } from '../../context/TripContext';
import { useToast } from '../../context/ToastContext';

export function CollectPaymentModal({ isOpen, onClose, booking, onSuccess }) {
  const toast = useToast();
  const tripCtx = useTripContext();
  const recordBalancePayment = tripCtx?.recordBalancePayment;

  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('UPI / QR');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Compute live booking financials
  const totalFare = Number(booking?.totalAmount || booking?.pricing || booking?.fare || booking?.totalFare || 0);
  const paidAmount = Number(booking?.amountPaid ?? booking?.advancePaid ?? 0);
  const balanceDue = booking?.balanceAmount !== undefined && booking?.balanceAmount !== null && !isNaN(Number(booking.balanceAmount))
    ? Math.max(0, Number(booking.balanceAmount))
    : Math.max(0, totalFare - paidAmount);

  useEffect(() => {
    if (isOpen && booking) {
      setAmount(String(balanceDue > 0 ? balanceDue : 0));
      setMethod('UPI / QR');
      setReference('');
      setNotes('');
      setIsSubmitting(false);
    }
  }, [isOpen, booking, balanceDue]);

  if (!isOpen || !booking) return null;

  const numAmount = parseFloat(amount) || 0;
  const isValidAmount = numAmount > 0 && numAmount <= (balanceDue + 0.01);
  const isFullSettlement = Math.abs(numAmount - balanceDue) <= 0.01;

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!isValidAmount) {
      toast.error(`Please enter a valid amount between ₹1 and ₹${balanceDue.toLocaleString('en-IN')}`);
      return;
    }

    if (!recordBalancePayment) {
      toast.error('Payment processing service is unavailable');
      return;
    }

    setIsSubmitting(true);
    try {
      const fullReference = reference.trim()
        ? `${reference.trim()}${notes.trim() ? ` (${notes.trim()})` : ''}`
        : notes.trim()
        ? `Notes: ${notes.trim()}`
        : '';

      const success = await recordBalancePayment(booking.id || booking.bookingNumber, numAmount, method, fullReference);

      if (success) {
        if (onSuccess) {
          onSuccess({
            bookingId: booking.id,
            amount: numAmount,
            method,
            isFullSettlement
          });
        }
        onClose();
      }
    } catch (err) {
      console.error('Collect balance error:', err);
      toast.error(err.message || 'Failed to record balance payment');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 99999,
        padding: '1rem'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) onClose();
      }}
    >
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '18px',
          width: '100%',
          maxWidth: '520px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '90vh'
        }}
      >
        {/* Header */}
        <div
          style={{
            backgroundColor: '#1E2456',
            color: '#ffffff',
            padding: '1.25rem 1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid rgba(255,255,255,0.1)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                backgroundColor: 'rgba(255,255,255,0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#4ade80'
              }}
            >
              <CreditCard size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0 }}>
                Collect Trip Payment
              </h2>
              <p style={{ fontSize: '0.8rem', color: '#93c5fd', margin: '0.15rem 0 0' }}>
                Manifest #{booking.bookingNumber || booking.id} &bull; {booking.customerName || 'Customer'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#ffffff',
              opacity: 0.8,
              cursor: 'pointer',
              padding: '0.35rem',
              borderRadius: '6px'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} style={{ padding: '1.25rem 1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
          {/* Trip & Pricing Ledger Pill */}
          <div
            style={{
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '1rem',
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '0.75rem',
              textAlign: 'center'
            }}
          >
            <div>
              <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                Total Fare
              </span>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', marginTop: '0.2rem' }}>
                ₹{totalFare.toLocaleString('en-IN')}
              </div>
            </div>

            <div>
              <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#16a34a', textTransform: 'uppercase' }}>
                Amount Paid
              </span>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#15803d', marginTop: '0.2rem' }}>
                ₹{paidAmount.toLocaleString('en-IN')}
              </div>
            </div>

            <div style={{ backgroundColor: '#fff7ed', borderRadius: '8px', padding: '0.35rem' }}>
              <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#c2410c', textTransform: 'uppercase' }}>
                Balance Due
              </span>
              <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#c2410c', marginTop: '0.15rem' }}>
                ₹{balanceDue.toLocaleString('en-IN')}
              </div>
            </div>
          </div>

          {/* Amount to Collect Input */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
              <label style={{ fontSize: '0.825rem', fontWeight: 700, color: '#0f172a' }}>
                Collection Amount (₹) <span style={{ color: '#dc2626' }}>*</span>
              </label>
              {numAmount !== balanceDue && balanceDue > 0 && (
                <button
                  type="button"
                  onClick={() => setAmount(String(balanceDue))}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#2C3480',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    textDecoration: 'underline'
                  }}
                >
                  Pay Full Balance (₹{balanceDue.toLocaleString('en-IN')})
                </button>
              )}
            </div>

            <div style={{ position: 'relative' }}>
              <span
                style={{
                  position: 'absolute',
                  left: '0.85rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  fontWeight: 800,
                  color: '#64748b'
                }}
              >
                ₹
              </span>
              <input
                type="number"
                min="1"
                max={balanceDue}
                step="any"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount collected"
                disabled={isSubmitting}
                required
                style={{
                  width: '100%',
                  padding: '0.7rem 0.85rem 0.7rem 2rem',
                  borderRadius: '10px',
                  border: !isValidAmount && amount ? '1.5px solid #ef4444' : '1px solid #cbd5e1',
                  fontSize: '1.1rem',
                  fontWeight: 800,
                  color: '#0f172a',
                  outline: 'none',
                  backgroundColor: '#ffffff'
                }}
              />
            </div>
            {isFullSettlement && numAmount > 0 && (
              <span style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: 700, marginTop: '0.3rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <CheckCircle2 size={13} /> Full settlement: booking will be marked as 100% Paid.
              </span>
            )}
            {!isFullSettlement && numAmount > 0 && isValidAmount && (
              <span style={{ fontSize: '0.75rem', color: '#d97706', fontWeight: 700, marginTop: '0.3rem', display: 'block' }}>
                Partial settlement: remaining balance of ₹{(balanceDue - numAmount).toLocaleString('en-IN')} will remain pending.
              </span>
            )}
          </div>

          {/* Payment Method Selector */}
          <div>
            <label style={{ fontSize: '0.825rem', fontWeight: 700, color: '#0f172a', display: 'block', marginBottom: '0.45rem' }}>
              Payment Method <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
              {[
                { id: 'UPI / QR', label: 'UPI / QR Code', icon: QrCode },
                { id: 'Cash', label: 'Cash (Driver/Desk)', icon: Banknote },
                { id: 'Direct Bank Transfer', label: 'Bank Transfer (IMPS/NEFT)', icon: Building },
                { id: 'Credit / Debit Card', label: 'Card (POS Machine)', icon: CreditCard }
              ].map((m) => {
                const Icon = m.icon;
                const isSelected = method === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setMethod(m.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.65rem 0.75rem',
                      borderRadius: '8px',
                      border: isSelected ? '2px solid #2C3480' : '1px solid #e2e8f0',
                      backgroundColor: isSelected ? '#eef2ff' : '#ffffff',
                      color: isSelected ? '#1e2456' : '#475569',
                      fontWeight: isSelected ? 800 : 600,
                      fontSize: '0.785rem',
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                  >
                    <Icon size={16} color={isSelected ? '#2C3480' : '#64748b'} />
                    <span>{m.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Transaction Reference / UTR */}
          <div>
            <label style={{ fontSize: '0.825rem', fontWeight: 700, color: '#0f172a', display: 'block', marginBottom: '0.4rem' }}>
              Transaction Reference / UTR / Receipt No. (Optional)
            </label>
            <input
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="e.g. UTR-9823412039 or Receipt #4820"
              disabled={isSubmitting}
              style={{
                width: '100%',
                padding: '0.6rem 0.85rem',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '0.85rem',
                color: '#0f172a',
                outline: 'none'
              }}
            />
          </div>

          {/* Real-time Ledger Impact Notice */}
          <div
            style={{
              backgroundColor: '#ecfdf5',
              border: '1px solid #a7f3d0',
              borderRadius: '10px',
              padding: '0.75rem 0.9rem',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.6rem'
            }}
          >
            <ShieldCheck size={18} color="#059669" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div style={{ fontSize: '0.75rem', color: '#065f46', lineHeight: 1.45 }}>
              <strong>Instant Ledger Reconciliation:</strong> Recording this collection will immediately add <strong>₹{numAmount.toLocaleString('en-IN')}</strong> to <strong>RECOGNISED REVENUE</strong>, deduct it from <strong>PENDINGS (BENDINGS)</strong>, update the customer's outstanding balance, and settle the billing ledger invoice.
            </div>
          </div>

          {/* Action Footer */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem', paddingTop: '0.75rem', borderTop: '1px solid #f1f5f9' }}>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={!isValidAmount || isSubmitting}
              style={{
                backgroundColor: '#16a34a',
                borderColor: '#15803d',
                fontWeight: 800,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}
            >
              <CheckCircle2 size={16} />
              {isSubmitting ? 'Recording Collection...' : `Confirm Payment of ₹${numAmount.toLocaleString('en-IN')}`}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CollectPaymentModal;
