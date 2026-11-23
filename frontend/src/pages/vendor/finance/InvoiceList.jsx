// MAK Tours & Travels ERP - Vendor Invoices & Tax Billing
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Upload,
  Download,
  Plus,
  ArrowLeft,
  CheckCircle,
  Eye,
  Calendar,
  IndianRupee
} from 'lucide-react';
import { Card, CardHeader, CardBody } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { Modal } from '../../../components/ui/Modal';
import { useVendorData } from '../../../context/VendorDataContext';
import { VendorNavTabs, VENDOR_FINANCE_TABS } from '../../../components/vendor/VendorNavTabs';

export function InvoiceList() {
  const navigate = useNavigate();
  const { invoices, addInvoice, profile } = useVendorData();

  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [billingPeriod, setBillingPeriod] = useState('November 2026');
  const [tripsCoveredCount, setTripsCoveredCount] = useState('8');
  const [grossAmount, setGrossAmount] = useState('112000');
  const [invoiceNumber, setInvoiceNumber] = useState(`APX/26-27/0${invoices.length + 50}`);

  const [previewInvoice, setPreviewInvoice] = useState(null);

  const handleUploadInvoice = (e) => {
    e.preventDefault();
    const gross = parseFloat(grossAmount) || 0;
    const comm = gross * 0.1;
    const tds = gross * 0.01;
    const net = gross - comm - tds;

    addInvoice({
      invoiceNumber,
      billingPeriod,
      tripsCoveredCount: parseInt(tripsCoveredCount) || 5,
      grossAmount: gross,
      adminCommissionDeducted: comm,
      tdsDeducted: tds,
      netPayable: net,
      balanceDue: net,
      paidAmount: 0
    });

    setIsUploadModalOpen(false);
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
            Vendor Invoices & Tax Claims
          </h1>
          <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0.25rem 0 0' }}>
            Submit GST tax invoices for completed billing periods and track settlement status
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Button
            variant="outline"
            onClick={() => navigate('/vendor/statements')}
          >
            Statements
          </Button>
          <Button
            variant="primary"
            style={{ backgroundColor: '#2C3480' }}
            onClick={() => setIsUploadModalOpen(true)}
          >
            <Upload size={16} style={{ marginRight: '0.35rem' }} /> Submit Invoice
          </Button>
        </div>
      </div>

      {/* Invoice Table */}
      <Card>
        <CardBody style={{ padding: 0 }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                  <th style={{ padding: '0.875rem 1rem' }}>Invoice #</th>
                  <th style={{ padding: '0.875rem 1rem' }}>Billing Period</th>
                  <th style={{ padding: '0.875rem 1rem' }}>Trips</th>
                  <th style={{ padding: '0.875rem 1rem', textAlign: 'right' }}>Gross Billed</th>
                  <th style={{ padding: '0.875rem 1rem', textAlign: 'right' }}>Commission (10%)</th>
                  <th style={{ padding: '0.875rem 1rem', textAlign: 'right' }}>Net Payable</th>
                  <th style={{ padding: '0.875rem 1rem', textAlign: 'center' }}>Status</th>
                  <th style={{ padding: '0.875rem 1rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr key={inv.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '0.875rem 1rem', fontWeight: 800, color: '#2C3480', fontFamily: 'monospace' }}>
                      {inv.invoiceNumber}
                    </td>
                    <td style={{ padding: '0.875rem 1rem', fontWeight: 600 }}>
                      {inv.billingPeriod}
                    </td>
                    <td style={{ padding: '0.875rem 1rem' }}>
                      {inv.tripsCoveredCount} Trips
                    </td>
                    <td style={{ padding: '0.875rem 1rem', textAlign: 'right', fontWeight: 600 }}>
                      ₹{inv.grossAmount?.toLocaleString('en-IN')}
                    </td>
                    <td style={{ padding: '0.875rem 1rem', textAlign: 'right', color: '#dc2626' }}>
                      - ₹{inv.adminCommissionDeducted?.toLocaleString('en-IN')}
                    </td>
                    <td style={{ padding: '0.875rem 1rem', textAlign: 'right', fontWeight: 800, color: '#0f172a' }}>
                      ₹{inv.netPayable?.toLocaleString('en-IN')}
                    </td>
                    <td style={{ padding: '0.875rem 1rem', textAlign: 'center' }}>
                      <StatusBadge status={inv.status} />
                    </td>
                    <td style={{ padding: '0.875rem 1rem', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setPreviewInvoice(inv)}
                        >
                          <Eye size={13} style={{ marginRight: '0.2rem' }} /> Preview
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => alert(`Downloading Invoice ${inv.invoiceNumber} PDF`)}
                        >
                          <Download size={14} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>

      {/* Upload Invoice Modal */}
      <Modal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        title="Upload Vendor GST Invoice"
        subtitle="Submit monthly or fortnightly billing statement to MAK Finance Desk"
        size="md"
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', width: '100%' }}>
            <Button variant="outline" onClick={() => setIsUploadModalOpen(false)}>Cancel</Button>
            <Button
              type="submit"
              form="invoice-upload-form"
              variant="primary"
              style={{ backgroundColor: '#2C3480' }}
            >
              Submit for Audit
            </Button>
          </div>
        }
      >
        <form id="invoice-upload-form" onSubmit={handleUploadInvoice} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
              Vendor Invoice Number *
            </label>
            <input
              type="text"
              value={invoiceNumber}
              onChange={(e) => setInvoiceNumber(e.target.value)}
              required
              style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.875rem', fontFamily: 'monospace' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                Billing Period *
              </label>
              <input
                type="text"
                placeholder="e.g. November 2026"
                value={billingPeriod}
                onChange={(e) => setBillingPeriod(e.target.value)}
                required
                style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.875rem' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                Completed Trips Covered
              </label>
              <input
                type="number"
                value={tripsCoveredCount}
                onChange={(e) => setTripsCoveredCount(e.target.value)}
                style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.875rem' }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
              Gross Claim Amount (₹) *
            </label>
            <input
              type="number"
              value={grossAmount}
              onChange={(e) => setGrossAmount(e.target.value)}
              required
              style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.875rem', fontWeight: 700 }}
            />
            <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
              Platform 10% commission and 1% TDS will be deducted automatically in the audit statement.
            </span>
          </div>
        </form>
      </Modal>

      {/* Invoice Preview Modal */}
      <Modal
        isOpen={Boolean(previewInvoice)}
        onClose={() => setPreviewInvoice(null)}
        title={`Tax Invoice - ${previewInvoice?.invoiceNumber}`}
        subtitle={`Issued by: ${profile.companyName}`}
        size="md"
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', width: '100%' }}>
            <Button variant="outline" onClick={() => setPreviewInvoice(null)}>Close</Button>
            <Button variant="primary" style={{ backgroundColor: '#2C3480' }} onClick={() => alert('Invoice PDF downloaded')}>
              Download PDF
            </Button>
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.85rem' }}>
          <div style={{ backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ color: '#64748b' }}>Billed Period:</span>
              <strong>{previewInvoice?.billingPeriod}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
              <span style={{ color: '#64748b' }}>Gross Invoiced Amount:</span>
              <strong style={{ fontWeight: 700 }}>₹{previewInvoice?.grossAmount?.toLocaleString('en-IN')}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
              <span style={{ color: '#64748b' }}>Admin Commission (10%):</span>
              <strong style={{ color: '#dc2626' }}>- ₹{previewInvoice?.adminCommissionDeducted?.toLocaleString('en-IN')}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ color: '#64748b' }}>TDS u/s 194C (1%):</span>
              <strong style={{ color: '#dc2626' }}>- ₹{previewInvoice?.tdsDeducted?.toLocaleString('en-IN')}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #e2e8f0', paddingTop: '0.5rem' }}>
              <span style={{ fontWeight: 700, color: '#0f172a' }}>Net Settlement Payable:</span>
              <strong style={{ fontSize: '1.2rem', color: '#16a34a' }}>₹{previewInvoice?.netPayable?.toLocaleString('en-IN')}</strong>
            </div>
          </div>

          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
            Status: <StatusBadge status={previewInvoice?.status} /> &bull; UTR: {previewInvoice?.utrNumber || 'Pending settlement'}
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default InvoiceList;
