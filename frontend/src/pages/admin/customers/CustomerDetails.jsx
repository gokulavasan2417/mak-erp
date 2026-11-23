// MAK Tours & Travels ERP - Customer Profile & Trip History
import React, { useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  ArrowLeft,
  Edit,
  Building2,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  IndianRupee,
  Clock,
  Car,
  FileText,
  AlertCircle,
  Plus,
  ShieldCheck,
  CreditCard,
  CheckCircle2
} from 'lucide-react';
import { Card, CardHeader, CardBody } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { useAdminData } from '../../../context/AdminDataContext';
import { formatDateDMY } from '../../../utils/dateUtils';
import { CollectPaymentModal } from '../../../components/modals/CollectPaymentModal';

export function CustomerDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { customers = [], bookings = [], invoices = [] } = useAdminData();
  const [paymentModalBooking, setPaymentModalBooking] = useState(null);

  const customer = (customers || []).find(
    (c) => c.id === id || c._id === id || (c.id && String(c.id).toLowerCase() === String(id || '').toLowerCase())
  );

  if (!customer) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', backgroundColor: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
        <AlertCircle size={48} style={{ color: '#ef4444', margin: '0 auto 1rem' }} />
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>Customer Not Found</h2>
        <p style={{ color: '#64748b', margin: '0.5rem 0 1.5rem' }}>No client profile matches account ID: {id}</p>
        <Button variant="primary" onClick={() => navigate('/admin/customers')} style={{ backgroundColor: '#2C3480' }}>
          Back to Customer List
        </Button>
      </div>
    );
  }

  const normalizeDigits = (val) => {
    if (!val) return '';
    const digits = String(val).replace(/\D/g, '');
    if (digits.length === 12 && digits.startsWith('91')) return digits.slice(2);
    if (digits.length === 11 && digits.startsWith('0')) return digits.slice(1);
    return digits.length >= 10 ? digits.slice(-10) : digits;
  };
  const custCleanPhone = normalizeDigits(customer.phone);

  // Linked bookings for this customer
  const customerBookings = (bookings || []).filter((b) => {
    const bCleanPhone = normalizeDigits(b.customerPhone || b.mobileNumber || b.phone);
    if (custCleanPhone && bCleanPhone && custCleanPhone === bCleanPhone) return true;
    if (b.customerId && (b.customerId === customer.id || b.customerId === customer._id)) return true;
    if (b.customerName && customer.name && b.customerName.toLowerCase().includes(customer.name.toLowerCase().substring(0, 5))) return true;
    return false;
  });

  // Set of linked booking IDs and references to cross-match invoices
  const customerBookingsIds = new Set(customerBookings.map((b) => b.id || b._id));
  const customerBookingsRefs = new Set(customerBookings.map((b) => b.bookingNumber).filter(Boolean));

  // Linked invoices
  const customerInvoices = (invoices || []).filter(
    (inv) =>
      (inv.customerId && (inv.customerId === customer.id || inv.customerId === customer._id)) ||
      (inv.customerName && customer.name && inv.customerName.toLowerCase().includes(customer.name.toLowerCase().substring(0, 5))) ||
      customerBookingsIds.has(inv.bookingId) ||
      customerBookingsRefs.has(inv.bookingRef) ||
      customerBookingsRefs.has(inv.bookingNumber)
  );

  const totalBookingsCount = customerBookings.length > 0 ? customerBookings.length : Number(customer.totalBookings || 0);

  const computedTotalSpent = customerBookings.reduce((sum, bk) => {
    return sum + Number(bk.totalAmount || bk.fareAmount || bk.fare || bk.pricing || 0);
  }, 0);
  const totalSpent = customerBookings.length > 0 ? computedTotalSpent : Number(customer.totalSpent || 0);

  const computedOutstanding = customerBookings.reduce((sum, bk) => {
    const tot = Number(bk.totalAmount || bk.fareAmount || bk.fare || bk.pricing || 0);
    const paid = Number(bk.amountPaid ?? bk.advancePaid ?? 0);
    const bal = bk.balanceAmount !== undefined && bk.balanceAmount !== null && !isNaN(Number(bk.balanceAmount))
      ? Number(bk.balanceAmount)
      : Math.max(0, tot - paid);
    return sum + Math.max(0, bal);
  }, 0);
  const outstandingBalance = customerBookings.length > 0 ? computedOutstanding : Number(customer.outstandingBalance || 0);

  const handleSettleInvoice = (inv) => {
    // Find matching booking to settle via booking lifecycle
    const matchingBooking = customerBookings.find(
      (b) => b.id === inv.bookingId || b.bookingNumber === inv.bookingRef || b.bookingNumber === inv.bookingNumber
    );

    if (matchingBooking) {
      setPaymentModalBooking(matchingBooking);
    } else {
      // Create synthetic booking wrapper to pass to CollectPaymentModal
      const invTotal = Number(inv.totalAmount || inv.amount || inv.subtotal || 0);
      const invPaid = Number(inv.amountPaid ?? inv.advancePaid ?? 0);
      const invBal = inv.balanceDue !== undefined && !isNaN(Number(inv.balanceDue))
        ? Number(inv.balanceDue)
        : Math.max(0, invTotal - invPaid);

      setPaymentModalBooking({
        id: inv.bookingId || inv.bookingRef || inv.id,
        bookingNumber: inv.bookingRef || inv.invoiceNumber || inv.id,
        customerName: customer.name,
        customerPhone: customer.phone,
        totalAmount: invTotal,
        advancePaid: invPaid,
        amountPaid: invPaid,
        balanceAmount: invBal
      });
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header Bar */}
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
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Button variant="outline" size="sm" onClick={() => navigate('/admin/customers')}>
            <ArrowLeft size={16} style={{ marginRight: '0.25rem' }} /> Back
          </Button>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <h1 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                {customer.name}
              </h1>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  padding: '0.2rem 0.55rem',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  backgroundColor: customer.type === 'Corporate' ? '#eff6ff' : '#f8fafc',
                  color: customer.type === 'Corporate' ? '#1e40af' : '#475569',
                  border: customer.type === 'Corporate' ? '1px solid #bfdbfe' : '1px solid #cbd5e1'
                }}
              >
                {customer.type === 'Corporate' ? <Building2 size={12} /> : <User size={12} />}
                {customer.type} Account
              </span>
              <StatusBadge status={customer.status} />
            </div>
            <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0.25rem 0 0' }}>
              Account #{customer.id} &bull; Member since {customer.createdAt} &bull; Rating: {customer.rating} / 5.0
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/admin/customers/${customer.id}/edit`)}
          >
            <Edit size={15} style={{ marginRight: '0.35rem' }} /> Edit Profile
          </Button>
          <Button
            variant="primary"
            size="sm"
            style={{ backgroundColor: '#2C3480' }}
            onClick={() => navigate('/admin/bookings/new')}
          >
            <Plus size={15} style={{ marginRight: '0.35rem' }} /> New Booking
          </Button>
        </div>
      </div>

      {/* KPI Highlights */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        <div style={{ backgroundColor: '#ffffff', padding: '1.15rem', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b' }}>TOTAL TRIPS RECORDED</span>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', marginTop: '0.35rem' }}>
            {totalBookingsCount}
          </div>
          <span style={{ fontSize: '0.75rem', color: '#16a34a' }}>Lifetime completed journeys</span>
        </div>

        <div style={{ backgroundColor: '#ffffff', padding: '1.15rem', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b' }}>TOTAL BILLED TO DATE</span>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', marginTop: '0.35rem' }}>
            ₹{Number(totalSpent || 0).toLocaleString('en-IN')}
          </div>
          <span style={{ fontSize: '0.75rem', color: '#2563eb' }}>Gross billing aggregate</span>
        </div>

        <div style={{ backgroundColor: '#ffffff', padding: '1.15rem', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b' }}>OUTSTANDING BALANCE</span>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: outstandingBalance > 0 ? '#dc2626' : '#16a34a', marginTop: '0.35rem' }}>
            ₹{Number(outstandingBalance || 0).toLocaleString('en-IN')}
          </div>
          <span style={{ fontSize: '0.75rem', color: outstandingBalance > 0 ? '#dc2626' : '#16a34a' }}>
            {outstandingBalance > 0 ? 'Pending collection' : 'Zero dues on file'}
          </span>
        </div>

        <div style={{ backgroundColor: '#ffffff', padding: '1.15rem', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b' }}>LOYALTY TIER</span>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#2C3480', marginTop: '0.35rem' }}>
            {totalBookingsCount > 50 ? 'Diamond Club' : totalBookingsCount > 10 ? 'Gold Elite' : 'Silver Regular'}
          </div>
          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Customer satisfaction {customer.rating || '5.0'}</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 2fr', gap: '1.25rem', alignItems: 'start' }}>
        {/* Left Column: Account Info & Notes */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <Card>
            <CardHeader title="Account Details" subtitle="Contact & Tax Identification" />
            <CardBody style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>Primary Contact Person</span>
                <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#1e293b' }}>{customer.contactPerson || 'Self'}</span>
              </div>

              <div>
                <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>Phone / Mobile</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.9rem', fontWeight: 600, color: '#2C3480' }}>
                  <Phone size={14} /> {customer.phone}
                </div>
              </div>

              <div>
                <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>Email Address</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', color: '#475569' }}>
                  <Mail size={14} /> {customer.email || 'N/A'}
                </div>
              </div>

              <div>
                <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>Operating City & Address</span>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.4rem', fontSize: '0.85rem', color: '#334155', marginTop: '0.2rem' }}>
                  <MapPin size={15} style={{ flexShrink: 0, marginTop: '0.15rem', color: '#64748b' }} />
                  <div>{customer.address}</div>
                </div>
              </div>

              {customer.gstin && (
                <div style={{ padding: '0.75rem', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>GSTIN (Goods & Services Tax)</span>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a', fontFamily: 'monospace' }}>
                    {customer.gstin}
                  </span>
                </div>
              )}
            </CardBody>
          </Card>

          {/* Account Operational Notes */}
          <Card>
            <CardHeader title="Account Preferences & Notes" subtitle="Dispatcher guidelines" />
            <CardBody>
              <div style={{ fontSize: '0.85rem', color: '#475569', lineHeight: 1.6, backgroundColor: '#fdf4ff', padding: '0.875rem', borderRadius: '8px', border: '1px solid #f0abfc' }}>
                {customer.notes || 'No specific operational requirements specified.'}
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Right Column: Trip History & Invoices */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Linked Bookings Table */}
          <Card>
            <CardHeader
              title={`Recent Trips & Bookings (${customerBookings.length})`}
              subtitle="All reservation manifests under this customer profile"
            />
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: '#f8fafc', color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                    <th style={{ padding: '0.75rem 1rem' }}>Booking #</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Category & Route</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Dates</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Fare (INR)</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Balance Due</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Trip Status</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Payment</th>
                  </tr>
                </thead>
                <tbody>
                  {customerBookings.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>
                        No specific recent trips logged under this customer account.
                      </td>
                    </tr>
                  ) : (
                    customerBookings.map((bk) => {
                      const totalBkFare = Number(bk.fareAmount || bk.totalAmount || bk.fare || bk.totalFare || bk.pricing || 0);
                      const paidBk = Number(bk.amountPaid ?? bk.advancePaid ?? 0);
                      const balBk = bk.balanceAmount !== undefined && bk.balanceAmount !== null && !isNaN(Number(bk.balanceAmount))
                        ? Number(bk.balanceAmount)
                        : Math.max(0, totalBkFare - paidBk);
                      const isBkPaid = balBk <= 0 || bk.paymentStatus === 'Paid';

                      return (
                        <tr
                          key={bk.id}
                          style={{ borderBottom: '1px solid #f1f5f9', cursor: 'pointer' }}
                          onClick={() => navigate(`/admin/bookings/${bk.id}`, { state: { from: location.pathname } })}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                        >
                          <td style={{ padding: '0.75rem 1rem', fontWeight: 700, color: '#2C3480' }}>
                            {bk.bookingNumber || bk.id}
                          </td>
                          <td style={{ padding: '0.75rem 1rem' }}>
                            <div style={{ fontWeight: 600, color: '#0f172a' }}>{bk.category || bk.bookingCategory || bk.bookingType || 'Trip'}</div>
                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                              {bk.pickupLocation || bk.fromLocation || 'Pickup'} &rarr; {bk.dropLocation || bk.toLocation || bk.destination || 'Drop'}
                            </div>
                          </td>
                          <td style={{ padding: '0.75rem 1rem', fontSize: '0.8rem', color: '#475569' }}>
                            {formatDateDMY(bk.journeyDate || bk.startDate || bk.pickupDate || bk.travelDate) || 'Scheduled'}
                          </td>
                          <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 600, color: '#0f172a' }}>
                            ₹{totalBkFare.toLocaleString('en-IN')}
                          </td>
                          <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 700, color: balBk > 0 ? '#ea580c' : '#16a34a' }}>
                            {balBk > 0 ? `₹${balBk.toLocaleString('en-IN')}` : '₹0'}
                          </td>
                          <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                            <StatusBadge status={bk.bookingStatus || bk.status || 'Confirmed'} />
                          </td>
                          <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                            {balBk > 0 ? (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setPaymentModalBooking(bk);
                                }}
                                style={{
                                  backgroundColor: '#16a34a',
                                  color: '#ffffff',
                                  border: 'none',
                                  borderRadius: '6px',
                                  padding: '0.35rem 0.65rem',
                                  fontSize: '0.75rem',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.25rem',
                                  boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                                }}
                              >
                                <CheckCircle2 size={13} /> Collect ₹{balBk.toLocaleString('en-IN')}
                              </button>
                            ) : (
                              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#16a34a', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                                <CheckCircle2 size={13} /> Paid in Full
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Invoices & Ledgers */}
          <Card>
            <CardHeader
              title={`Corporate Billing Ledger (${customerInvoices.length})`}
              subtitle="Tax invoices and GST reconciliation"
            />
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: '#f8fafc', color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                    <th style={{ padding: '0.75rem 1rem' }}>Invoice #</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Date</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Total (₹)</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Balance Due (₹)</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Payment Status</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {customerInvoices.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>
                        No separate corporate invoices pending.
                      </td>
                    </tr>
                  ) : (
                    customerInvoices.map((inv) => {
                      const invTotal = Number(inv.totalAmount || inv.amount || inv.subtotal || 0);
                      const invPaid = Number(inv.amountPaid ?? inv.advancePaid ?? (inv.status === 'Paid' ? invTotal : 0));
                      const invBal = inv.balanceDue !== undefined && !isNaN(Number(inv.balanceDue))
                        ? Number(inv.balanceDue)
                        : Math.max(0, invTotal - invPaid);
                      const isInvPaid = invBal <= 0 || inv.status === 'Paid' || inv.paymentStatus === 'Paid';

                      return (
                        <tr key={inv.id || inv._id || inv.invoiceNumber} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '0.75rem 1rem', fontWeight: 700, color: '#0f172a', fontFamily: 'monospace' }}>
                            {inv.invoiceNumber || inv.id}
                          </td>
                          <td style={{ padding: '0.75rem 1rem', color: '#475569' }}>{formatDateDMY(inv.date || inv.invoiceDate || inv.createdAt) || 'N/A'}</td>
                          <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 600 }}>
                            ₹{invTotal.toLocaleString('en-IN')}
                          </td>
                          <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 700, color: invBal > 0 ? '#dc2626' : '#16a34a' }}>
                            ₹{invBal.toLocaleString('en-IN')}
                          </td>
                          <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                            <StatusBadge status={isInvPaid ? 'Paid' : (inv.status || 'Partially Paid')} />
                          </td>
                          <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                            {invBal > 0 && (
                              <button
                                type="button"
                                onClick={() => handleSettleInvoice(inv)}
                                style={{
                                  backgroundColor: '#16a34a',
                                  color: '#ffffff',
                                  border: 'none',
                                  borderRadius: '6px',
                                  padding: '0.3rem 0.55rem',
                                  fontSize: '0.75rem',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.25rem'
                                }}
                              >
                                <CheckCircle2 size={12} /> Settle
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>

      {/* Collect Balance Payment Modal */}
      {paymentModalBooking && (
        <CollectPaymentModal
          isOpen={Boolean(paymentModalBooking)}
          onClose={() => setPaymentModalBooking(null)}
          booking={paymentModalBooking}
        />
      )}
    </div>
  );
}

export default CustomerDetails;
