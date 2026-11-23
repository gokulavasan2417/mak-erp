// MAK Tours & Travels ERP - Accounts Payable & Vendor Bills Module
import React, { useState, useEffect } from 'react';
import {
  Truck,
  Search,
  Plus,
  CreditCard,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  FileText,
  IndianRupee
} from 'lucide-react';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Modal } from '../../components/ui/Modal';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { accountantService } from '../../services/accountantService';
import { formatDateDMY } from '../../utils/dateUtils';

export function PayablePage() {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Modals
  const [isBillModalOpen, setIsBillModalOpen] = useState(false);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [selectedBill, setSelectedBill] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState('');

  // Bill Form Data
  const [billForm, setBillForm] = useState({
    vendorId: 'VND-001',
    vendorName: '',
    billDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    description: '',
    amount: '',
    taxRate: 18
  });

  // Payment Form Data
  const [payForm, setPayForm] = useState({
    amount: '',
    paymentMethod: 'Bank Transfer',
    transactionRef: '',
    notes: '',
    allowAdvance: false
  });

  const loadBills = async () => {
    setLoading(true);
    try {
      const res = await accountantService.getVendorBills();
      setBills(Array.isArray(res?.data) ? res.data : []);
    } catch (err) {
      console.error('Error fetching vendor bills:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBills();
  }, []);

  const handleCreateBill = async (e) => {
    e.preventDefault();
    setModalError('');
    if (!billForm.vendorName || !billForm.amount) {
      setModalError('Vendor Name and Base Amount are required.');
      return;
    }

    setSubmitting(true);
    try {
      const baseAmt = Number(billForm.amount);
      const tax = (baseAmt * Number(billForm.taxRate)) / 100;
      await accountantService.createVendorBill({
        vendorId: billForm.vendorId.trim(),
        vendorName: billForm.vendorName.trim(),
        billDate: billForm.billDate,
        dueDate: billForm.dueDate || undefined,
        lineItems: [
          {
            description: billForm.description || 'Vendor Fleet / Maintenance Services',
            quantity: 1,
            unitPrice: baseAmt,
            amount: baseAmt
          }
        ],
        subtotal: baseAmt,
        taxAmount: tax,
        totalAmount: baseAmt + tax
      });
      setIsBillModalOpen(false);
      setBillForm({
        vendorId: 'VND-001',
        vendorName: '',
        billDate: new Date().toISOString().split('T')[0],
        dueDate: '',
        description: '',
        amount: '',
        taxRate: 18
      });
      loadBills();
    } catch (err) {
      setModalError(err.message || 'Failed to create vendor bill.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenPayment = (bill) => {
    setSelectedBill(bill);
    setPayForm({
      amount: bill.balanceDue || bill.totalAmount,
      paymentMethod: 'Bank Transfer',
      transactionRef: '',
      notes: '',
      allowAdvance: false
    });
    setModalError('');
    setIsPayModalOpen(true);
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    setModalError('');
    if (!selectedBill || !payForm.amount) return;

    setSubmitting(true);
    try {
      await accountantService.recordVendorPayment({
        billNumber: selectedBill.billNumber,
        amount: Number(payForm.amount),
        paymentMethod: payForm.paymentMethod,
        transactionRef: payForm.transactionRef.trim(),
        notes: payForm.notes.trim(),
        allowAdvance: payForm.allowAdvance
      });
      setIsPayModalOpen(false);
      loadBills();
    } catch (err) {
      setModalError(err.message || 'Payment recording failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredBills = bills.filter((b) => {
    const q = searchTerm.toLowerCase();
    const matchSearch =
      (b.billNumber || '').toLowerCase().includes(q) ||
      (b.vendorName || '').toLowerCase().includes(q) ||
      (b.vendorId || '').toLowerCase().includes(q);

    const matchStatus = statusFilter === 'All' || b.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalOutstanding = bills.reduce((sum, b) => sum + Number(b.balanceDue || 0), 0);
  const totalPaid = bills.reduce((sum, b) => sum + Number(b.paidAmount || 0), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
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
            Accounts Payable & Vendor Bills
          </h1>
          <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0.25rem 0 0' }}>
            Vendor invoices, fleet supplier dues, and disbursements with ledger posting
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#dc2626', backgroundColor: '#fef2f2', padding: '0.45rem 0.85rem', borderRadius: '8px' }}>
            Balance Due: ₹{totalOutstanding.toLocaleString('en-IN')}
          </div>
          <Button variant="primary" size="sm" onClick={() => setIsBillModalOpen(true)}>
            <Plus size={16} style={{ marginRight: '0.35rem' }} /> Create Vendor Bill
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
            placeholder="Search by Bill #, Vendor Name, ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%', border: 'none', outline: 'none', fontSize: '0.9rem' }}
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{ padding: '0.45rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', backgroundColor: '#ffffff' }}
        >
          <option value="All">All Statuses</option>
          <option value="Approved">Approved</option>
          <option value="Partially Paid">Partially Paid</option>
          <option value="Paid">Fully Paid</option>
          <option value="Draft">Draft</option>
        </select>
      </div>

      {/* Bills Table */}
      <Card>
        <CardBody style={{ padding: 0 }}>
          {loading ? (
            <LoadingSpinner message="Loading vendor payables..." />
          ) : filteredBills.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
              No vendor bills found matching criteria.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b' }}>
                    <th style={{ padding: '0.85rem 1.25rem' }}>Bill #</th>
                    <th style={{ padding: '0.85rem 1.25rem' }}>Vendor</th>
                    <th style={{ padding: '0.85rem 1.25rem' }}>Bill Date</th>
                    <th style={{ padding: '0.85rem 1.25rem' }}>Total Amount</th>
                    <th style={{ padding: '0.85rem 1.25rem' }}>Paid</th>
                    <th style={{ padding: '0.85rem 1.25rem' }}>Balance Due</th>
                    <th style={{ padding: '0.85rem 1.25rem' }}>Status</th>
                    <th style={{ padding: '0.85rem 1.25rem' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBills.map((b) => (
                    <tr key={b._id || b.billNumber} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '0.85rem 1.25rem', fontWeight: 700, color: '#0f172a' }}>
                        {b.billNumber}
                      </td>
                      <td style={{ padding: '0.85rem 1.25rem' }}>
                        <div style={{ fontWeight: 600, color: '#0f172a' }}>{b.vendorName}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>ID: {b.vendorId}</div>
                      </td>
                      <td style={{ padding: '0.85rem 1.25rem', color: '#64748b' }}>
                        {formatDateDMY(b.billDate) || '—'}
                      </td>
                      <td style={{ padding: '0.85rem 1.25rem', fontWeight: 700, color: '#0f172a' }}>
                        ₹{Number(b.totalAmount || 0).toLocaleString('en-IN')}
                      </td>
                      <td style={{ padding: '0.85rem 1.25rem', color: '#059669', fontWeight: 600 }}>
                        ₹{Number(b.paidAmount || 0).toLocaleString('en-IN')}
                      </td>
                      <td style={{ padding: '0.85rem 1.25rem', fontWeight: 800, color: b.balanceDue > 0 ? '#dc2626' : '#059669' }}>
                        ₹{Number(b.balanceDue || 0).toLocaleString('en-IN')}
                      </td>
                      <td style={{ padding: '0.85rem 1.25rem' }}>
                        <StatusBadge status={b.status || 'Approved'} />
                      </td>
                      <td style={{ padding: '0.85rem 1.25rem' }}>
                        {b.balanceDue > 0 ? (
                          <Button size="xs" variant="primary" onClick={() => handleOpenPayment(b)}>
                            Pay Bill
                          </Button>
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                            <CheckCircle2 size={13} /> Settled
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Create Bill Modal */}
      {isBillModalOpen && (
        <Modal
          isOpen={isBillModalOpen}
          onClose={() => setIsBillModalOpen(false)}
          title="Create Vendor Bill"
        >
          <form onSubmit={handleCreateBill} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {modalError && (
              <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', padding: '0.75rem', borderRadius: '8px', color: '#b91c1c', fontSize: '0.85rem' }}>
                {modalError}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                  Vendor ID *
                </label>
                <input
                  type="text"
                  required
                  value={billForm.vendorId}
                  onChange={(e) => setBillForm({ ...billForm, vendorId: e.target.value })}
                  style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                  Vendor Company Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Apex Fleet Logistics"
                  value={billForm.vendorName}
                  onChange={(e) => setBillForm({ ...billForm, vendorName: e.target.value })}
                  style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                Service Description
              </label>
              <input
                type="text"
                placeholder="e.g. Innova monthly rental and fleet deployment"
                value={billForm.description}
                onChange={(e) => setBillForm({ ...billForm, description: e.target.value })}
                style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                  Base Amount (INR) *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  placeholder="0.00"
                  value={billForm.amount}
                  onChange={(e) => setBillForm({ ...billForm, amount: e.target.value })}
                  style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                  GST Tax Rate
                </label>
                <select
                  value={billForm.taxRate}
                  onChange={(e) => setBillForm({ ...billForm, taxRate: Number(e.target.value) })}
                  style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff' }}
                >
                  <option value={0}>0% (Exempt)</option>
                  <option value={5}>5% GST</option>
                  <option value={12}>12% GST</option>
                  <option value={18}>18% GST (Standard)</option>
                  <option value={28}>28% GST</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
              <Button variant="ghost" onClick={() => setIsBillModalOpen(false)}>Cancel</Button>
              <Button variant="primary" type="submit" disabled={submitting}>
                {submitting ? 'Creating...' : 'Create Bill'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Record Payment Modal */}
      {isPayModalOpen && selectedBill && (
        <Modal
          isOpen={isPayModalOpen}
          onClose={() => setIsPayModalOpen(false)}
          title={`Record Payment for ${selectedBill.billNumber}`}
        >
          <form onSubmit={handleRecordPayment} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {modalError && (
              <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', padding: '0.75rem', borderRadius: '8px', color: '#b91c1c', fontSize: '0.85rem' }}>
                {modalError}
              </div>
            )}

            <div style={{ backgroundColor: '#f8fafc', padding: '0.85rem', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Vendor: <strong>{selectedBill.vendorName}</strong></span>
                <span>Outstanding: <strong style={{ color: '#dc2626' }}>₹{Number(selectedBill.balanceDue || 0).toLocaleString('en-IN')}</strong></span>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                Payment Amount (INR) *
              </label>
              <input
                type="number"
                required
                min="1"
                value={payForm.amount}
                onChange={(e) => setPayForm({ ...payForm, amount: e.target.value })}
                style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                  Payment Method
                </label>
                <select
                  value={payForm.paymentMethod}
                  onChange={(e) => setPayForm({ ...payForm, paymentMethod: e.target.value })}
                  style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff' }}
                >
                  <option value="Bank Transfer">Bank Transfer (NEFT/RTGS)</option>
                  <option value="UPI">UPI</option>
                  <option value="Cash">Cash</option>
                  <option value="Cheque">Cheque</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                  Bank UTR / Cheque Ref
                </label>
                <input
                  type="text"
                  placeholder="e.g. UTR12384729"
                  value={payForm.transactionRef}
                  onChange={(e) => setPayForm({ ...payForm, transactionRef: e.target.value })}
                  style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
              <Button variant="ghost" onClick={() => setIsPayModalOpen(false)}>Cancel</Button>
              <Button variant="primary" type="submit" disabled={submitting}>
                {submitting ? 'Disbursing...' : 'Disburse Payment'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

export default PayablePage;
