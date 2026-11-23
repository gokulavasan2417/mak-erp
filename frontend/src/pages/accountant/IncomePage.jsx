// MAK Tours & Travels ERP - Customer Income & Receipts Module
import React, { useState, useEffect } from 'react';
import {
  IndianRupee,
  Search,
  Plus,
  Download,
  Filter,
  CheckCircle2,
  AlertCircle,
  FileText,
  CreditCard
} from 'lucide-react';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Modal } from '../../components/ui/Modal';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { accountantService } from '../../services/accountantService';
import { formatDateDMY } from '../../utils/dateUtils';

export function IncomePage() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [methodFilter, setMethodFilter] = useState('All');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState('');
  const [formData, setFormData] = useState({
    bookingId: '',
    amount: '',
    paymentMethod: 'Bank Transfer',
    transactionRef: '',
    notes: '',
    allowOverpayment: false
  });

  const loadPayments = async () => {
    setLoading(true);
    try {
      const res = await accountantService.getPayments();
      setPayments(Array.isArray(res?.data) ? res.data : []);
    } catch (err) {
      console.error('Error fetching payments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayments();
  }, []);

  const handleCreatePayment = async (e) => {
    e.preventDefault();
    setModalError('');
    if (!formData.bookingId || !formData.amount) {
      setModalError('Booking Reference and Amount are required.');
      return;
    }

    setSubmitting(true);
    try {
      await accountantService.recordPayment({
        bookingId: formData.bookingId.trim(),
        amount: Number(formData.amount),
        method: formData.paymentMethod,
        transactionRef: formData.transactionRef.trim(),
        notes: formData.notes.trim(),
        allowOverpayment: formData.allowOverpayment,
        idempotencyKey: `PAY-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`
      });
      setIsModalOpen(false);
      setFormData({
        bookingId: '',
        amount: '',
        paymentMethod: 'Bank Transfer',
        transactionRef: '',
        notes: '',
        allowOverpayment: false
      });
      loadPayments();
    } catch (err) {
      setModalError(err.message || 'Error recording payment.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredPayments = payments.filter((p) => {
    const q = searchTerm.toLowerCase();
    const matchSearch =
      (p.paymentId || '').toLowerCase().includes(q) ||
      (p.bookingRef || p.bookingId || '').toLowerCase().includes(q) ||
      (p.customerName || '').toLowerCase().includes(q) ||
      (p.transactionRef || '').toLowerCase().includes(q);

    const matchStatus = statusFilter === 'All' || p.status === statusFilter;
    const matchMethod = methodFilter === 'All' || p.method === methodFilter || p.paymentMethod === methodFilter;
    return matchSearch && matchStatus && matchMethod;
  });

  const totalCollected = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          backgroundColor: '#ffffff',
          padding: '1.25rem 1.75rem',
          borderRadius: '16px',
          border: '1px solid #e2e8f0'
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
            Customer Income & Receipts
          </h1>
          <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0.25rem 0 0' }}>
            Real-time customer payments, bank transfers, and cash collections
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#059669', backgroundColor: '#ecfdf5', padding: '0.45rem 0.85rem', borderRadius: '8px' }}>
            Total Collected: ₹{totalCollected.toLocaleString('en-IN')}
          </div>
          <Button variant="primary" size="sm" onClick={() => setIsModalOpen(true)}>
            <Plus size={16} style={{ marginRight: '0.35rem' }} /> Record Payment
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          flexWrap: 'wrap',
          backgroundColor: '#ffffff',
          padding: '1rem 1.25rem',
          borderRadius: '12px',
          border: '1px solid #e2e8f0'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flex: 1, minWidth: '240px' }}>
          <Search size={18} style={{ color: '#94a3b8' }} />
          <input
            type="text"
            placeholder="Search by Receipt #, Booking Ref, Customer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              border: 'none',
              outline: 'none',
              fontSize: '0.9rem',
              color: '#0f172a'
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ padding: '0.45rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', backgroundColor: '#ffffff' }}
          >
            <option value="All">All Statuses</option>
            <option value="Completed">Completed</option>
            <option value="Pending">Pending</option>
            <option value="Refunded">Refunded</option>
          </select>

          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            style={{ padding: '0.45rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', backgroundColor: '#ffffff' }}
          >
            <option value="All">All Methods</option>
            <option value="Cash">Cash</option>
            <option value="UPI">UPI</option>
            <option value="Bank Transfer">Bank Transfer</option>
            <option value="Credit Card">Credit Card</option>
          </select>
        </div>
      </div>

      {/* Payments Table */}
      <Card>
        <CardBody style={{ padding: 0 }}>
          {loading ? (
            <LoadingSpinner message="Loading customer payments..." />
          ) : filteredPayments.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
              No payments found matching your filter criteria.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b' }}>
                    <th style={{ padding: '0.85rem 1.25rem' }}>Receipt #</th>
                    <th style={{ padding: '0.85rem 1.25rem' }}>Booking Ref</th>
                    <th style={{ padding: '0.85rem 1.25rem' }}>Date & Time</th>
                    <th style={{ padding: '0.85rem 1.25rem' }}>Method</th>
                    <th style={{ padding: '0.85rem 1.25rem' }}>Transaction Ref</th>
                    <th style={{ padding: '0.85rem 1.25rem' }}>Amount</th>
                    <th style={{ padding: '0.85rem 1.25rem' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPayments.map((p) => (
                    <tr key={p._id || p.paymentId} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '0.85rem 1.25rem', fontWeight: 700, color: '#0f172a' }}>
                        {p.paymentId || p.receiptNumber || 'REC'}
                      </td>
                      <td style={{ padding: '0.85rem 1.25rem', color: '#2563eb', fontWeight: 600 }}>
                        {p.bookingRef || p.bookingId || '—'}
                      </td>
                      <td style={{ padding: '0.85rem 1.25rem', color: '#64748b' }}>
                        {formatDateDMY(p.createdAt, true) || '—'}
                      </td>
                      <td style={{ padding: '0.85rem 1.25rem', color: '#475569' }}>
                        {p.method || p.paymentMethod || 'Cash'}
                      </td>
                      <td style={{ padding: '0.85rem 1.25rem', color: '#64748b', fontFamily: 'monospace' }}>
                        {p.transactionRef || '—'}
                      </td>
                      <td style={{ padding: '0.85rem 1.25rem', fontWeight: 800, color: '#059669' }}>
                        ₹{Number(p.amount || 0).toLocaleString('en-IN')}
                      </td>
                      <td style={{ padding: '0.85rem 1.25rem' }}>
                        <StatusBadge status={p.status || 'Completed'} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Record Payment Modal */}
      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Record Customer Payment"
        >
          <form onSubmit={handleCreatePayment} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {modalError && (
              <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', padding: '0.75rem', borderRadius: '8px', color: '#b91c1c', fontSize: '0.85rem' }}>
                {modalError}
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                Booking Reference # *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. BK-2026-0001"
                value={formData.bookingId}
                onChange={(e) => setFormData({ ...formData, bookingId: e.target.value })}
                style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                Amount (INR) *
              </label>
              <input
                type="number"
                required
                min="1"
                placeholder="0.00"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                  Payment Method
                </label>
                <select
                  value={formData.paymentMethod}
                  onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                  style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff' }}
                >
                  <option value="Cash">Cash</option>
                  <option value="UPI">UPI</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Credit Card">Credit Card</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                  UTR / Transaction Ref
                </label>
                <input
                  type="text"
                  placeholder="Optional reference"
                  value={formData.transactionRef}
                  onChange={(e) => setFormData({ ...formData, transactionRef: e.target.value })}
                  style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: '#475569', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={formData.allowOverpayment}
                  onChange={(e) => setFormData({ ...formData, allowOverpayment: e.target.checked })}
                />
                Allow advance payment or overpayment (bypasses outstanding cap)
              </label>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
              <Button variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
              <Button variant="primary" type="submit" disabled={submitting}>
                {submitting ? 'Recording...' : 'Record Payment'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

export default IncomePage;
