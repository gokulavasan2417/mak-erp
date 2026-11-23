// MAK Tours & Travels ERP - Payment Ledger & Transactions
import React, { useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  CreditCard,
  IndianRupee,
  Plus,
  Search,
  Download,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  Calendar,
  X,
  FileText,
  LayoutGrid,
  List,
  ArrowRight
} from 'lucide-react';
import { Card, CardHeader, CardBody } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Modal } from '../../../components/ui/Modal';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { Pagination } from '../../../components/ui/Pagination';
import { useAdminData } from '../../../context/AdminDataContext';
import { paymentMethods } from '../../../data';
import { formatDateDMY } from '../../../utils/dateUtils';

export function PaymentsList() {
  const navigate = useNavigate();
  const location = useLocation();
  const adminData = useAdminData() || {};
  const { payments = [], addPayment = () => {}, bookings = [] } = adminData;

  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [methodFilter, setMethodFilter] = useState('All');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' (default) or 'table'
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  // Record Payment Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [paymentType, setPaymentType] = useState('Customer Payment');
  const [partyName, setPartyName] = useState('');
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('UPI / QR');
  const [transactionRef, setTransactionRef] = useState('');
  const [bookingId, setBookingId] = useState('');
  const [category, setCategory] = useState('Advance Booking Fee');
  const [notes, setNotes] = useState('');

  // Filtered payments
  const filteredPayments = useMemo(() => {
    return (payments || []).filter((p) => {
      if (!p) return false;
      const pNum = String(p.paymentNumber || p.receiptNumber || p.id || p._id || '').toLowerCase();
      const pParty = String(p.partyName || p.customerName || '').toLowerCase();
      const pRef = String(p.transactionRef || p.paymentReference || '').toLowerCase();
      const pBId = String(p.bookingNumber || p.bookingId || '').toLowerCase();
      const sTerm = (searchTerm || '').trim().toLowerCase();

      const matchSearch =
        sTerm === '' ||
        pNum.includes(sTerm) ||
        pParty.includes(sTerm) ||
        pRef.includes(sTerm) ||
        pBId.includes(sTerm);

      const pType = p.type || (p.paymentType ? `${p.paymentType} Payment` : 'Customer Payment');
      const matchType =
        typeFilter === 'All' ||
        pType === typeFilter ||
        (typeFilter === 'Customer Payment' && (p.paymentType === 'Advance' || p.paymentType === 'Balance' || p.paymentType === 'Balance Settlement' || String(p.type || '').toLowerCase().includes('customer')));
      const pMethod = String(p.method || p.paymentMethod || '');
      const matchMethod =
        methodFilter === 'All' ||
        methodFilter === 'All Methods' ||
        pMethod.toLowerCase() === methodFilter.toLowerCase();

      return matchSearch && matchType && matchMethod;
    });
  }, [payments, searchTerm, typeFilter, methodFilter]);

  // Paginated
  const paginatedPayments = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredPayments.slice(start, start + pageSize);
  }, [filteredPayments, currentPage, pageSize]);

  // Aggregates
  const totalInflows = (payments || [])
    .filter((p) => p && (p.type === 'Customer Payment' || !p.type))
    .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

  const totalOutflows = (payments || [])
    .filter((p) => p && p.type && p.type !== 'Customer Payment')
    .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

  const handleOpenModal = () => {
    setPaymentType('Customer Payment');
    setPartyName('');
    setAmount('');
    setMethod('UPI / QR');
    setTransactionRef(`UPI-${Date.now().toString().slice(-6)}`);
    setBookingId('');
    setCategory('Advance Booking Fee');
    setNotes('');
    setIsModalOpen(true);
  };

  const handleRecordPayment = (e) => {
    e.preventDefault();
    if (!partyName || !amount) return;

    addPayment({
      type: paymentType,
      partyName,
      bookingId: bookingId || null,
      amount: Number(amount),
      method,
      transactionRef,
      category,
      notes
    });

    setIsModalOpen(false);
  };

  const handleExportCSV = () => {
    const headers = ['Receipt #', 'Date', 'Type', 'Party Name', 'Booking ID', 'Amount (INR)', 'Method', 'Transaction Ref', 'Status'];
    const rows = filteredPayments.map((p) => [
      p.paymentNumber || p.receiptNumber || p.id || p._id || '',
      p.date || p.createdAt || '',
      p.type || 'Customer Payment',
      `"${p.partyName || p.customerName || 'Customer'}"`,
      p.bookingId || p.bookingNumber || 'N/A',
      Number(p.amount || 0),
      p.method || p.paymentMethod || 'UPI / QR',
      p.transactionRef || '',
      p.status || 'Completed'
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `MAK_Payments_${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
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
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
            Payments & Collections Ledger
          </h1>
          <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0.25rem 0 0' }}>
            Real-time tracking of customer receipts, vendor disbursements, driver batta & client refunds
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          {/* View Mode Toggle: Cards (default) or Table */}
          <div style={{ display: 'flex', border: '1px solid #cbd5e1', borderRadius: '8px', overflow: 'hidden' }}>
            <button
              onClick={() => setViewMode('grid')}
              title="Modern Cards View"
              style={{
                padding: '0.45rem 0.75rem',
                border: 'none',
                backgroundColor: viewMode === 'grid' ? '#2C3480' : '#ffffff',
                color: viewMode === 'grid' ? '#ffffff' : '#64748b',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                fontSize: '0.8125rem',
                fontWeight: 600,
                transition: 'all 0.15s ease'
              }}
            >
              <LayoutGrid size={15} /> Cards
            </button>
            <button
              onClick={() => setViewMode('table')}
              title="Classic Table View"
              style={{
                padding: '0.45rem 0.75rem',
                border: 'none',
                backgroundColor: viewMode === 'table' ? '#2C3480' : '#ffffff',
                color: viewMode === 'table' ? '#ffffff' : '#64748b',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                fontSize: '0.8125rem',
                fontWeight: 600,
                transition: 'all 0.15s ease'
              }}
            >
              <List size={15} /> Table
            </button>
          </div>

          <Button variant="outline" size="sm" onClick={handleExportCSV}>
            <Download size={15} style={{ marginRight: '0.35rem' }} /> Export CSV
          </Button>
          <Button
            variant="primary"
            style={{ backgroundColor: '#2C3480' }}
            onClick={handleOpenModal}
          >
            <Plus size={16} style={{ marginRight: '0.35rem' }} /> Record Payment
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        <div style={{ backgroundColor: '#ffffff', padding: '1.15rem', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b' }}>TOTAL INFLOWS</span>
            <div style={{ padding: '0.4rem', borderRadius: '8px', backgroundColor: '#f0fdf4', color: '#16a34a' }}>
              <ArrowDownRight size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#16a34a', marginTop: '0.4rem' }}>
            ₹{totalInflows.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
            Customer fares & tour package receipts
          </div>
        </div>

        <div style={{ backgroundColor: '#ffffff', padding: '1.15rem', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b' }}>TOTAL OUTFLOWS</span>
            <div style={{ padding: '0.4rem', borderRadius: '8px', backgroundColor: '#fef2f2', color: '#dc2626' }}>
              <ArrowUpRight size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#dc2626', marginTop: '0.4rem' }}>
            ₹{totalOutflows.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
            Vendor settlements & driver payouts
          </div>
        </div>

        <div style={{ backgroundColor: '#ffffff', padding: '1.15rem', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b' }}>NET CASH FLOW</span>
            <div style={{ padding: '0.4rem', borderRadius: '8px', backgroundColor: '#eef2ff', color: '#2C3480' }}>
              <IndianRupee size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#2C3480', marginTop: '0.4rem' }}>
            ₹{(totalInflows - totalOutflows).toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#16a34a', marginTop: '0.25rem' }}>
            Positive operational balance
          </div>
        </div>

        <div style={{ backgroundColor: '#ffffff', padding: '1.15rem', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b' }}>TRANSACTION COUNT</span>
            <div style={{ padding: '0.4rem', borderRadius: '8px', backgroundColor: '#eff6ff', color: '#2563eb' }}>
              <CreditCard size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0f172a', marginTop: '0.4rem' }}>
            {payments.length}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
            Reconciled banking vouchers
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <Card>
        <CardBody style={{ padding: '1rem 1.25rem' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', flex: 1, minWidth: '280px' }}>
              <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
                <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input
                  type="text"
                  placeholder="Search receipt #, party name, UTR ref or booking ID..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  style={{
                    width: '100%',
                    padding: '0.55rem 0.75rem 0.55rem 2.25rem',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.875rem'
                  }}
                />
              </div>

              <select
                value={typeFilter}
                onChange={(e) => {
                  setTypeFilter(e.target.value);
                  setCurrentPage(1);
                }}
                style={{
                  padding: '0.55rem 0.85rem',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.875rem',
                  backgroundColor: '#fff'
                }}
              >
                <option value="All">All Transaction Types</option>
                <option value="Customer Payment">Customer Payment</option>
                <option value="Vendor Payment">Vendor Payment</option>
                <option value="Driver Settlement">Driver Settlement</option>
                <option value="Customer Refund">Customer Refund</option>
              </select>

              <select
                value={methodFilter}
                onChange={(e) => {
                  setMethodFilter(e.target.value);
                  setCurrentPage(1);
                }}
                style={{
                  padding: '0.55rem 0.85rem',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.875rem',
                  backgroundColor: '#fff'
                }}
              >
                {paymentMethods.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ fontSize: '0.825rem', color: '#64748b' }}>
              Showing {filteredPayments.length} entries
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Payments Presentation: Cards Grid View (Default) or Table View */}
      {viewMode === 'grid' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.25rem' }}>
          {paginatedPayments.length === 0 ? (
            <div style={{ gridColumn: '1 / -1', padding: '3.5rem 2rem', textAlign: 'center', backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
              <CreditCard size={44} style={{ color: '#cbd5e1', margin: '0 auto 0.75rem' }} />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e293b', margin: '0 0 0.25rem' }}>No payment vouchers found</h3>
              <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>Try clearing your search query or adjusting your filters.</p>
            </div>
          ) : (
            paginatedPayments.map((pay, pIdx) => {
              const pType = pay.type || (pay.paymentType ? `${pay.paymentType} Payment` : 'Customer Payment');
              const isInflow = pType === 'Customer Payment';
              const isRefund = pType === 'Customer Refund';
              const pNum = pay.paymentNumber || pay.receiptNumber || pay.id || pay._id || `PAY-${pIdx + 1}`;
              const pDate = formatDateDMY(pay.date || pay.createdAt, true) || 'Recent';
              const pParty = pay.partyName || pay.customerName || 'Customer';
              const pMethod = pay.method || pay.paymentMethod || 'UPI / QR';
              const pAmt = Number(pay.amount || 0);

              return (
                <div
                  key={pay.id || pay._id || `pay-${pIdx}`}
                  style={{
                    backgroundColor: '#ffffff',
                    borderRadius: '16px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.04)',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'transform 0.2s, box-shadow 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 6px 14px rgba(0,0,0,0.08)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'none';
                    e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.04)';
                  }}
                >
                  {/* Card Top Strip */}
                  <div style={{ padding: '0.875rem 1.25rem', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fafbfc' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span
                        style={{
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          backgroundColor: isInflow ? '#f0fdf4' : isRefund ? '#fef2f2' : '#f8fafc',
                          color: isInflow ? '#15803d' : isRefund ? '#b91c1c' : '#334155',
                          border: `1px solid ${isInflow ? '#bbf7d0' : isRefund ? '#fecaca' : '#e2e8f0'}`,
                          padding: '0.2rem 0.55rem',
                          borderRadius: '6px'
                        }}
                      >
                        {pType}
                      </span>
                    </div>
                    <StatusBadge status={pay.status || 'Completed'} />
                  </div>

                  {/* Card Body */}
                  <div style={{ padding: '1.25rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#2C3480', fontFamily: 'monospace' }}>
                          {pNum}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', color: '#64748b' }}>
                          <Calendar size={13} style={{ color: '#2C3480' }} />
                          <span>{pDate}</span>
                        </div>
                      </div>

                      <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', margin: '0.35rem 0 0.15rem' }}>
                        {pParty}
                      </h3>
                      <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                        {pay.category || 'Advance Fare Allocation'}
                      </div>
                    </div>

                    {/* Transaction Details Box */}
                    <div
                      style={{
                        backgroundColor: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: '10px',
                        padding: '0.75rem 0.875rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.5rem',
                        fontSize: '0.8rem'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <CreditCard size={13} style={{ color: '#2C3480' }} /> Method
                        </span>
                        <span style={{ fontWeight: 600, color: '#1e293b' }}>{pMethod}</span>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: '#64748b' }}>UTR / Reference</span>
                        <span style={{ fontWeight: 600, color: '#334155', fontFamily: 'monospace', fontSize: '0.75rem' }}>
                          {pay.transactionRef || pay.paymentReference || 'N/A'}
                        </span>
                      </div>

                      {(pay.bookingId || pay.bookingNumber) && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <FileText size={13} style={{ color: '#2C3480' }} /> Linked Booking
                          </span>
                          <span
                            onClick={() => navigate(`/admin/bookings/${pay.bookingId || pay.bookingNumber}`, { state: { from: location.pathname } })}
                            style={{ fontWeight: 700, color: '#2C3480', cursor: 'pointer', textDecoration: 'underline' }}
                          >
                            #{pay.bookingNumber || pay.bookingId}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Card Footer */}
                    <div
                      style={{
                        marginTop: 'auto',
                        paddingTop: '0.875rem',
                        borderTop: '1px solid #f1f5f9',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}
                    >
                      <div>
                        <span style={{ fontSize: '0.6875rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block' }}>
                          {isInflow ? 'Amount Received' : 'Amount Disbursed'}
                        </span>
                        <div
                          style={{
                            fontSize: '1.3rem',
                            fontWeight: 800,
                            color: isRefund ? '#dc2626' : isInflow ? '#16a34a' : '#0f172a'
                          }}
                        >
                          {isRefund ? '-' : isInflow ? '+' : ''}₹{pAmt.toLocaleString('en-IN')}
                        </div>
                      </div>

                      <Button
                        variant="primary"
                        size="sm"
                        style={{ backgroundColor: '#2C3480', fontWeight: 700 }}
                        onClick={() => {
                          if (pay.bookingId || pay.bookingNumber) {
                            navigate(`/admin/bookings/${pay.bookingId || pay.bookingNumber}`, { state: { from: location.pathname } });
                          }
                        }}
                      >
                        Voucher Info <ArrowRight size={14} style={{ marginLeft: '0.25rem' }} />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        <Card>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: '#f8fafc', color: '#475569', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  <th style={{ padding: '0.875rem 1rem' }}>Receipt #</th>
                  <th style={{ padding: '0.875rem 1rem' }}>Date & Time</th>
                  <th style={{ padding: '0.875rem 1rem' }}>Party / Account</th>
                  <th style={{ padding: '0.875rem 1rem' }}>Category & Booking</th>
                  <th style={{ padding: '0.875rem 1rem' }}>Payment Method</th>
                  <th style={{ padding: '0.875rem 1rem' }}>Transaction Ref</th>
                  <th style={{ padding: '0.875rem 1rem', textAlign: 'right' }}>Amount (INR)</th>
                  <th style={{ padding: '0.875rem 1rem', textAlign: 'center' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {paginatedPayments.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
                      <CreditCard size={36} style={{ color: '#cbd5e1', margin: '0 auto 0.75rem' }} />
                      <p style={{ fontWeight: 600, color: '#334155' }}>No payment records match the filter criteria</p>
                    </td>
                  </tr>
                ) : (
                  paginatedPayments.map((pay, pIdx) => {
                    const pType = pay.type || (pay.paymentType ? `${pay.paymentType} Payment` : 'Customer Payment');
                    const isRefund = pType === 'Customer Refund';
                    const isInflow = pType === 'Customer Payment';
                    const pNum = pay.paymentNumber || pay.receiptNumber || pay.id || pay._id || `PAY-${pIdx + 1}`;
                    const pParty = pay.partyName || pay.customerName || 'Customer';
                    const pAmt = Number(pay.amount || 0);

                    return (
                      <tr
                        key={pay.id || pay._id || `pay-tbl-${pIdx}`}
                        style={{
                          borderBottom: '1px solid #f1f5f9',
                          transition: 'background-color 0.15s'
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                      >
                        <td style={{ padding: '0.875rem 1rem', fontWeight: 700, color: '#2C3480', fontFamily: 'monospace' }}>
                          {pNum}
                        </td>

                        <td style={{ padding: '0.875rem 1rem', color: '#64748b', fontSize: '0.8rem' }}>
                          {formatDateDMY(pay.date || pay.createdAt, true) || 'Recent'}
                        </td>

                        <td style={{ padding: '0.875rem 1rem' }}>
                          <div style={{ fontWeight: 600, color: '#0f172a' }}>{pParty}</div>
                          <span
                            style={{
                              fontSize: '0.7rem',
                              color: isInflow ? '#16a34a' : '#64748b',
                              fontWeight: 500
                            }}
                          >
                            {pType}
                          </span>
                        </td>

                        <td style={{ padding: '0.875rem 1rem' }}>
                          <div style={{ fontSize: '0.825rem', color: '#1e293b' }}>{pay.category || 'Trip Advance'}</div>
                          {(pay.bookingId || pay.bookingNumber) && (
                            <span
                              onClick={() => navigate(`/admin/bookings/${pay.bookingId || pay.bookingNumber}`, { state: { from: location.pathname } })}
                              style={{ fontSize: '0.75rem', color: '#2C3480', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}
                            >
                              Booking #{pay.bookingNumber || pay.bookingId}
                            </span>
                          )}
                        </td>

                        <td style={{ padding: '0.875rem 1rem', fontSize: '0.85rem', color: '#475569' }}>
                          {pay.method || pay.paymentMethod || 'UPI / QR'}
                        </td>

                        <td style={{ padding: '0.875rem 1rem', fontSize: '0.8rem', color: '#64748b', fontFamily: 'monospace' }}>
                          {pay.transactionRef || pay.paymentReference || 'N/A'}
                        </td>

                        <td style={{ padding: '0.875rem 1rem', textAlign: 'right', fontWeight: 700, fontSize: '0.95rem', color: isRefund ? '#dc2626' : isInflow ? '#16a34a' : '#0f172a' }}>
                          {isRefund ? '-' : '+'}₹{pAmt.toLocaleString('en-IN')}
                        </td>

                        <td style={{ padding: '0.875rem 1rem', textAlign: 'center' }}>
                          <StatusBadge status={pay.status || 'Completed'} />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Shared Pagination component */}
      {filteredPayments.length > pageSize && (
        <Card style={{ marginTop: '0.5rem', padding: '0.75rem 1rem' }}>
          <Pagination
            currentPage={currentPage}
            totalItems={filteredPayments.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
          />
        </Card>
      )}

      {/* Record Payment Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Record Payment / Disbursal"
        size="md"
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', width: '100%' }}>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              form="record-payment-form"
              variant="primary"
              style={{ backgroundColor: '#2C3480' }}
            >
              Confirm & Log Payment
            </Button>
          </div>
        }
      >
        <form id="record-payment-form" onSubmit={handleRecordPayment} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
              Transaction Type *
            </label>
            <select
              value={paymentType}
              onChange={(e) => setPaymentType(e.target.value)}
              style={{
                width: '100%',
                padding: '0.6rem 0.85rem',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '0.875rem',
                backgroundColor: '#fff'
              }}
            >
              <option value="Customer Payment">Customer Payment (Inflow)</option>
              <option value="Vendor Payment">Vendor Payment (Outflow)</option>
              <option value="Driver Settlement">Driver Settlement (Outflow)</option>
              <option value="Customer Refund">Customer Refund (Outflow)</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
              Party / Client / Beneficiary Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Infosys Corp Mobility or Driver Rajesh"
              value={partyName}
              onChange={(e) => setPartyName(e.target.value)}
              style={{
                width: '100%',
                padding: '0.6rem 0.85rem',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '0.875rem'
              }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                Amount (INR) *
              </label>
              <input
                type="number"
                min="1"
                required
                placeholder="₹ Amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.6rem 0.85rem',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.875rem',
                  fontWeight: 700
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                Payment Method *
              </label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.6rem 0.85rem',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.875rem',
                  backgroundColor: '#fff'
                }}
              >
                {paymentMethods.filter((m) => m !== 'All Methods').map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                Transaction / UTR Reference
              </label>
              <input
                type="text"
                placeholder="e.g. UPI-REF-99210"
                value={transactionRef}
                onChange={(e) => setTransactionRef(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.6rem 0.85rem',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.875rem',
                  fontFamily: 'monospace'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                Related Booking ID
              </label>
              <select
                value={bookingId}
                onChange={(e) => {
                  const bId = e.target.value;
                  setBookingId(bId);
                  if (bId) {
                    const sel = (bookings || []).find((b) => (b.id && b.id === bId) || (b._id && b._id === bId) || (b.bookingNumber && b.bookingNumber === bId));
                    if (sel) {
                      setPartyName(sel.customerName || sel.fullName || sel.name || '');
                      if (sel.balanceAmount && Number(sel.balanceAmount) > 0) {
                        setAmount(String(sel.balanceAmount));
                      }
                    }
                  }
                }}
                style={{
                  width: '100%',
                  padding: '0.6rem 0.85rem',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.875rem',
                  backgroundColor: '#fff'
                }}
              >
                <option value="">-- Standalone Transaction --</option>
                {(bookings || []).map((b, idx) => {
                  const bVal = b.id || b._id || b.bookingNumber || `bkg-${idx}`;
                  const bLabel = b.bookingNumber || b.id || b._id || 'Booking';
                  const cName = b.customerName || b.fullName || b.name || 'Customer';
                  return (
                    <option key={bVal} value={bVal}>
                      {bLabel} - {cName}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
              Purpose / Notes
            </label>
            <input
              type="text"
              placeholder="e.g. 50% Advance booking deposit"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              style={{
                width: '100%',
                padding: '0.6rem 0.85rem',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '0.875rem'
              }}
            />
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default PaymentsList;
