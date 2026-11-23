// MAK Tours & Travels ERP - GST Invoices & Billing Module
import React, { useState, useEffect } from 'react';
import {
  FileText,
  Search,
  Plus,
  Download,
  Printer,
  XCircle,
  AlertCircle,
  CheckCircle2,
  Calendar,
  IndianRupee
} from 'lucide-react';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Modal } from '../../components/ui/Modal';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { accountantService } from '../../services/accountantService';

export function InvoicesPage() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isCreditNoteModalOpen, setIsCreditNoteModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState('');

  // Form State
  const [createForm, setCreateForm] = useState({
    bookingRef: '',
    customerName: '',
    customerEmail: '',
    customerGstin: '',
    customerState: 'Tamil Nadu',
    companyState: 'Tamil Nadu',
    baseAmount: '',
    discount: 0,
    gstRate: 5
  });

  const [cancelReason, setCancelReason] = useState('');
  const [creditNoteForm, setCreditNoteForm] = useState({
    amount: '',
    reason: ''
  });

  const loadInvoices = async () => {
    setLoading(true);
    try {
      const res = await accountantService.getInvoices();
      setInvoices(Array.isArray(res?.data) ? res.data : []);
    } catch (err) {
      console.error('Error fetching invoices:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvoices();
  }, []);

  const handleCreateInvoice = async (e) => {
    e.preventDefault();
    setModalError('');
    if (!createForm.bookingRef || !createForm.customerName || !createForm.baseAmount) {
      setModalError('Booking Reference, Customer Name, and Base Fare are required.');
      return;
    }

    setSubmitting(true);
    try {
      const base = Number(createForm.baseAmount);
      const disc = Number(createForm.discount || 0);
      const taxable = Math.max(0, base - disc);
      const isIntra = createForm.customerState.toLowerCase() === createForm.companyState.toLowerCase();

      const rate = Number(createForm.gstRate);
      let cgst = 0, sgst = 0, igst = 0;
      if (isIntra) {
        cgst = (taxable * (rate / 2)) / 100;
        sgst = (taxable * (rate / 2)) / 100;
      } else {
        igst = (taxable * rate) / 100;
      }

      await accountantService.createInvoice({
        bookingRef: createForm.bookingRef.trim(),
        customerName: createForm.customerName.trim(),
        customerEmail: createForm.customerEmail.trim(),
        customerGstin: createForm.customerGstin.trim(),
        customerState: createForm.customerState,
        baseAmount: base,
        discount: disc,
        taxableAmount: taxable,
        cgstAmount: cgst,
        sgstAmount: sgst,
        igstAmount: igst,
        totalAmount: taxable + cgst + sgst + igst,
        balanceDue: taxable + cgst + sgst + igst
      });

      setIsCreateModalOpen(false);
      setCreateForm({
        bookingRef: '',
        customerName: '',
        customerEmail: '',
        customerGstin: '',
        customerState: 'Tamil Nadu',
        companyState: 'Tamil Nadu',
        baseAmount: '',
        discount: 0,
        gstRate: 5
      });
      loadInvoices();
    } catch (err) {
      setModalError(err.message || 'Error generating invoice.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelInvoice = async (e) => {
    e.preventDefault();
    if (!selectedInvoice || !cancelReason.trim()) return;

    setSubmitting(true);
    try {
      await accountantService.cancelInvoice(selectedInvoice.invoiceNumber || selectedInvoice._id, cancelReason.trim());
      setIsCancelModalOpen(false);
      setCancelReason('');
      loadInvoices();
    } catch (err) {
      setModalError(err.message || 'Invoice cancellation failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleIssueCreditNote = async (e) => {
    e.preventDefault();
    if (!selectedInvoice || !creditNoteForm.amount) return;

    setSubmitting(true);
    try {
      await accountantService.issueCreditNote(selectedInvoice.invoiceNumber || selectedInvoice._id, {
        amount: Number(creditNoteForm.amount),
        reason: creditNoteForm.reason.trim()
      });
      setIsCreditNoteModalOpen(false);
      setCreditNoteForm({ amount: '', reason: '' });
      loadInvoices();
    } catch (err) {
      setModalError(err.message || 'Error issuing credit note.');
    } finally {
      setSubmitting(false);
    }
  };

  const downloadPdf = (inv) => {
    const id = inv.invoiceNumber || inv._id;
    const token = localStorage.getItem('mak_erp_auth_token');
    window.open(`/api/finance/invoices/${id}/pdf?token=${encodeURIComponent(token)}`, '_blank');
  };

  const filteredInvoices = invoices.filter((inv) => {
    const q = searchTerm.toLowerCase();
    const matchSearch =
      (inv.invoiceNumber || '').toLowerCase().includes(q) ||
      (inv.bookingRef || '').toLowerCase().includes(q) ||
      (inv.customerName || '').toLowerCase().includes(q);

    const matchStatus = statusFilter === 'All' || inv.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalInvoiced = invoices.filter(i => i.status !== 'Cancelled').reduce((sum, i) => sum + Number(i.totalAmount || 0), 0);

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
            GST Invoices & Billing
          </h1>
          <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0.25rem 0 0' }}>
            GST compliant tax invoices, credit notes, and downloadable PDF statements
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#2563eb', backgroundColor: '#eff6ff', padding: '0.45rem 0.85rem', borderRadius: '8px' }}>
            Total Invoiced: ₹{totalInvoiced.toLocaleString('en-IN')}
          </div>
          <Button variant="primary" size="sm" onClick={() => setIsCreateModalOpen(true)}>
            <Plus size={16} style={{ marginRight: '0.35rem' }} /> Generate Invoice
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
            placeholder="Search by Invoice #, Booking Ref, Customer..."
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
          <option value="Paid">Paid</option>
          <option value="Partially Paid">Partially Paid</option>
          <option value="Unpaid">Unpaid</option>
          <option value="Cancelled">Cancelled</option>
        </select>
      </div>

      {/* Invoices Table */}
      <Card>
        <CardBody style={{ padding: 0 }}>
          {loading ? (
            <LoadingSpinner message="Loading invoices..." />
          ) : filteredInvoices.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
              No tax invoices generated yet.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b' }}>
                    <th style={{ padding: '0.85rem 1.25rem' }}>Invoice #</th>
                    <th style={{ padding: '0.85rem 1.25rem' }}>Booking Ref</th>
                    <th style={{ padding: '0.85rem 1.25rem' }}>Customer Name</th>
                    <th style={{ padding: '0.85rem 1.25rem' }}>Tax Math</th>
                    <th style={{ padding: '0.85rem 1.25rem' }}>Total Amount</th>
                    <th style={{ padding: '0.85rem 1.25rem' }}>Balance Due</th>
                    <th style={{ padding: '0.85rem 1.25rem' }}>Status</th>
                    <th style={{ padding: '0.85rem 1.25rem' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInvoices.map((inv) => (
                    <tr key={inv._id || inv.invoiceNumber} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '0.85rem 1.25rem', fontWeight: 700, color: '#0f172a' }}>
                        {inv.invoiceNumber}
                      </td>
                      <td style={{ padding: '0.85rem 1.25rem', color: '#2563eb', fontWeight: 600 }}>
                        {inv.bookingRef}
                      </td>
                      <td style={{ padding: '0.85rem 1.25rem' }}>
                        <div style={{ fontWeight: 600, color: '#0f172a' }}>{inv.customerName}</div>
                        {inv.customerGstin && (
                          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>GSTIN: {inv.customerGstin}</div>
                        )}
                      </td>
                      <td style={{ padding: '0.85rem 1.25rem', fontSize: '0.8rem', color: '#64748b' }}>
                        {inv.igstAmount > 0 ? (
                          <span>IGST: ₹{inv.igstAmount}</span>
                        ) : (
                          <span>CGST: ₹{inv.cgstAmount} | SGST: ₹{inv.sgstAmount}</span>
                        )}
                      </td>
                      <td style={{ padding: '0.85rem 1.25rem', fontWeight: 700, color: '#0f172a' }}>
                        ₹{Number(inv.totalAmount || 0).toLocaleString('en-IN')}
                      </td>
                      <td style={{ padding: '0.85rem 1.25rem', fontWeight: 800, color: inv.balanceDue > 0 ? '#ea580c' : '#059669' }}>
                        ₹{Number(inv.balanceDue || 0).toLocaleString('en-IN')}
                      </td>
                      <td style={{ padding: '0.85rem 1.25rem' }}>
                        <StatusBadge status={inv.status || 'Unpaid'} />
                      </td>
                      <td style={{ padding: '0.85rem 1.25rem' }}>
                        <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                          <Button size="xs" variant="outline" onClick={() => downloadPdf(inv)}>
                            <Download size={13} style={{ marginRight: '0.2rem' }} /> PDF
                          </Button>
                          {inv.status !== 'Cancelled' && (
                            <>
                              <Button
                                size="xs"
                                variant="ghost"
                                onClick={() => {
                                  setSelectedInvoice(inv);
                                  setCreditNoteForm({ amount: '', reason: '' });
                                  setIsCreditNoteModalOpen(true);
                                }}
                              >
                                Credit Note
                              </Button>
                              <Button
                                size="xs"
                                variant="ghost"
                                style={{ color: '#dc2626' }}
                                onClick={() => {
                                  setSelectedInvoice(inv);
                                  setCancelReason('');
                                  setIsCancelModalOpen(true);
                                }}
                              >
                                Cancel
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Generate Invoice Modal */}
      {isCreateModalOpen && (
        <Modal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          title="Generate GST Tax Invoice"
        >
          <form onSubmit={handleCreateInvoice} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {modalError && (
              <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', padding: '0.75rem', borderRadius: '8px', color: '#b91c1c', fontSize: '0.85rem' }}>
                {modalError}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                  Booking Ref # *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. BK-2026-0001"
                  value={createForm.bookingRef}
                  onChange={(e) => setCreateForm({ ...createForm, bookingRef: e.target.value })}
                  style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                  Customer Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Krishnan"
                  value={createForm.customerName}
                  onChange={(e) => setCreateForm({ ...createForm, customerName: e.target.value })}
                  style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                  Customer GSTIN (Optional)
                </label>
                <input
                  type="text"
                  placeholder="33AAAAA0000A1Z5"
                  value={createForm.customerGstin}
                  onChange={(e) => setCreateForm({ ...createForm, customerGstin: e.target.value })}
                  style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                  Customer State (For GST Split)
                </label>
                <select
                  value={createForm.customerState}
                  onChange={(e) => setCreateForm({ ...createForm, customerState: e.target.value })}
                  style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff' }}
                >
                  <option value="Tamil Nadu">Tamil Nadu (Intra-state: CGST+SGST)</option>
                  <option value="Karnataka">Karnataka (Inter-state: IGST)</option>
                  <option value="Kerala">Kerala (Inter-state: IGST)</option>
                  <option value="Andhra Pradesh">Andhra Pradesh (Inter-state: IGST)</option>
                  <option value="Maharashtra">Maharashtra (Inter-state: IGST)</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                  Base Fare *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  placeholder="0.00"
                  value={createForm.baseAmount}
                  onChange={(e) => setCreateForm({ ...createForm, baseAmount: e.target.value })}
                  style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                  Discount (INR)
                </label>
                <input
                  type="number"
                  min="0"
                  value={createForm.discount}
                  onChange={(e) => setCreateForm({ ...createForm, discount: e.target.value })}
                  style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                  GST Rate
                </label>
                <select
                  value={createForm.gstRate}
                  onChange={(e) => setCreateForm({ ...createForm, gstRate: Number(e.target.value) })}
                  style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff' }}
                >
                  <option value={5}>5% Transport GST</option>
                  <option value={12}>12% GST</option>
                  <option value={18}>18% Commercial GST</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
              <Button variant="ghost" onClick={() => setIsCreateModalOpen(false)}>Cancel</Button>
              <Button variant="primary" type="submit" disabled={submitting}>
                {submitting ? 'Generating...' : 'Create Invoice'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Cancel Invoice Modal */}
      {isCancelModalOpen && selectedInvoice && (
        <Modal
          isOpen={isCancelModalOpen}
          onClose={() => setIsCancelModalOpen(false)}
          title={`Cancel Invoice: ${selectedInvoice.invoiceNumber}`}
        >
          <form onSubmit={handleCancelInvoice} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>
              Cancelling this invoice will audit-trail the cancellation, reverse pending dues, and issue a cancellation stamp.
            </p>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                Cancellation Reason *
              </label>
              <textarea
                required
                rows={3}
                placeholder="Reason for audit trail (e.g. Trip cancelled by client)..."
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <Button variant="ghost" onClick={() => setIsCancelModalOpen(false)}>Close</Button>
              <Button variant="danger" type="submit" disabled={submitting}>
                {submitting ? 'Cancelling...' : 'Confirm Cancellation'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Credit Note Modal */}
      {isCreditNoteModalOpen && selectedInvoice && (
        <Modal
          isOpen={isCreditNoteModalOpen}
          onClose={() => setIsCreditNoteModalOpen(false)}
          title={`Issue Credit Note for ${selectedInvoice.invoiceNumber}`}
        >
          <form onSubmit={handleIssueCreditNote} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                Credit Note Amount (INR) *
              </label>
              <input
                type="number"
                required
                min="1"
                placeholder="0.00"
                value={creditNoteForm.amount}
                onChange={(e) => setCreditNoteForm({ ...creditNoteForm, amount: e.target.value })}
                style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                Reason for Credit Note *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Discount for AC malfunction during trip"
                value={creditNoteForm.reason}
                onChange={(e) => setCreditNoteForm({ ...creditNoteForm, reason: e.target.value })}
                style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <Button variant="ghost" onClick={() => setIsCreditNoteModalOpen(false)}>Cancel</Button>
              <Button variant="primary" type="submit" disabled={submitting}>
                {submitting ? 'Issuing...' : 'Issue Credit Note'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

export default InvoicesPage;
