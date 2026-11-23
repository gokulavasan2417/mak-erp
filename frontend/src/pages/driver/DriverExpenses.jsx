// MAK Tours & Travels ERP - Driver Trip Expense Claim System
// Allows drivers to submit on-trip expense claims with receipts & track approval/settlement status

import React, { useState, useRef, useMemo, useEffect } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import {
  Receipt,
  Plus,
  Filter,
  CheckCircle2,
  Clock,
  XCircle,
  FileText,
  Upload,
  Image,
  Eye,
  AlertTriangle,
  RotateCcw,
  CreditCard,
  DollarSign,
  Car,
  Calendar,
  ArrowRight,
  ShieldCheck,
  Check,
  Trash2
} from 'lucide-react';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { useTripContext } from '../../context/TripContext';
import { useToast } from '../../context/ToastContext';

export function DriverExpenses() {
  const { id: routeTripId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const {
    bookings,
    expenses,
    submitExpenseClaim,
    resubmitExpenseClaim,
    removeExpenseClaim
  } = useTripContext();

  const safeBookings = Array.isArray(bookings) ? bookings : [];
  const safeExpenses = Array.isArray(expenses) ? expenses : [];

  const fileInputRef = useRef(null);

  // Active / relevant bookings for current driver (DRV-001)
  const driverBookings = useMemo(() => {
    return safeBookings.filter(
      (b) => b.driverId === 'DRV-001' || b.assignedDriver?.id === 'DRV-001' || b.driverAssignmentStatus === 'Accepted'
    );
  }, [safeBookings]);

  // Active driver expenses
  const driverExpenses = useMemo(() => {
    return safeExpenses.filter(
      (e) => e.driverId === 'DRV-001' || driverBookings.some((b) => b.id === e.bookingId)
    );
  }, [safeExpenses, driverBookings]);

  // Tab filter
  const [activeTab, setActiveTab] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  // Submit Modal
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);

  // Sync tab and modal from URL search query parameters (e.g. ?status=pending or ?action=new)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const statusParam = params.get('status') || params.get('tab') || params.get('filter');
    if (statusParam) {
      const s = statusParam.toLowerCase();
      if (s.includes('pend')) {
        setActiveTab('Pending Approval');
      } else if (s.includes('approv')) {
        setActiveTab('Approved');
      } else if (s.includes('reject')) {
        setActiveTab('Rejected');
      } else if (s.includes('paid') || s.includes('settl')) {
        setActiveTab('Paid');
      } else if (s === 'all') {
        setActiveTab('All');
      }
    }

    const actionParam = params.get('action');
    if (actionParam === 'new' || actionParam === 'create' || actionParam === 'submit') {
      setIsSubmitModalOpen(true);
    }
  }, [location.search]);
  const [selectedBookingId, setSelectedBookingId] = useState(
    routeTripId || (driverBookings[0]?.id || 'BK-2026-002')
  );
  const [category, setCategory] = useState('Toll');
  const [amount, setAmount] = useState('');
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().substring(0, 10));
  const [description, setDescription] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Fastag / UPI');
  const [notes, setNotes] = useState('');

  // Receipt upload & preview
  const [receiptFile, setReceiptFile] = useState(null);
  const [receiptPreview, setReceiptPreview] = useState('https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=800&q=80');
  const [receiptFileName, setReceiptFileName] = useState('toll_receipt_sample.jpg');
  const [receiptFileType, setReceiptFileType] = useState('image'); // 'image' or 'pdf'

  // View Receipt Modal
  const [viewReceiptModal, setViewReceiptModal] = useState(null);

  // Edit / Resubmit Modal
  const [editClaimModal, setEditClaimModal] = useState(null);
  const [editAmount, setEditAmount] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const editFileInputRef = useRef(null);
  const [editReceiptPreview, setEditReceiptPreview] = useState(null);
  const [editReceiptFileName, setEditReceiptFileName] = useState('');

  // Delete / Remove Confirmation Modal
  const [deleteConfirmClaim, setDeleteConfirmClaim] = useState(null);

  const categories = [
    'Toll',
    'Parking',
    'Fuel',
    'Food',
    'Night Stay / Night Halt Allowance',
    'Driver Allowance',
    'Hotel',
    'State Permit',
    'Vehicle Maintenance',
    'Other Trip Expenses'
  ];

  const paymentMethods = [
    'Fastag / UPI',
    'Cash',
    'Fuel Card',
    'Personal Card',
    'Company Account'
  ];

  // Handle receipt selection
  const handleReceiptChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size exceeds 10MB limit.');
      return;
    }

    setReceiptFile(file);
    setReceiptFileName(file.name);

    if (file.type.includes('pdf')) {
      setReceiptFileType('pdf');
      setReceiptPreview('');
    } else {
      setReceiptFileType('image');
      const reader = new FileReader();
      reader.onload = (event) => {
        setReceiptPreview(event.target.result);
      };
      reader.readAsDataURL(file);
    }
    toast.success(`Receipt "${file.name}" uploaded successfully`);
  };

  const handleOpenSubmit = (prefillBookingId = null) => {
    if (prefillBookingId) {
      setSelectedBookingId(prefillBookingId);
    }
    setAmount('');
    setDescription('');
    setNotes('');
    setIsSubmitModalOpen(true);
  };

  const handleSubmitClaim = (e) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid expense amount');
      return;
    }
    if (!description.trim()) {
      toast.error('Please provide a short description for this expense');
      return;
    }

    const matchedBooking = safeBookings.find((b) => b.id === selectedBookingId);

    submitExpenseClaim({
      bookingId: selectedBookingId,
      tripId: matchedBooking?.bookingNumber || `TRP-${selectedBookingId}`,
      driverId: 'DRV-001',
      driverName: 'Arun Kumar Sundaram',
      vehicleRegNo: matchedBooking?.assignedVehicle?.regNo || 'KA-01-MJ-8890',
      category,
      expenseDate,
      amount: parseFloat(amount),
      description,
      receiptUrl: receiptPreview || 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=800&q=80',
      receiptFileName,
      receiptType: receiptFileType,
      paymentMethod,
      notes
    });

    setIsSubmitModalOpen(false);
  };

  const handleOpenEdit = (claim) => {
    setEditClaimModal(claim);
    setEditAmount(claim.amount.toString());
    setEditDescription(claim.description || '');
    setEditNotes(claim.notes || '');
    setEditReceiptPreview(claim.receiptUrl || null);
    setEditReceiptFileName(claim.receiptFileName || '');
  };

  const handleEditFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setEditReceiptFileName(file.name);
      const url = URL.createObjectURL(file);
      setEditReceiptPreview(url);
      toast.success(`Attached new receipt: ${file.name}`);
    }
  };

  const handleConfirmResubmit = () => {
    if (!editClaimModal) return;
    if (!editAmount || parseFloat(editAmount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    resubmitExpenseClaim(editClaimModal.id, {
      amount: parseFloat(editAmount),
      description: editDescription,
      notes: editNotes,
      receiptUrl: editReceiptPreview || editClaimModal.receiptUrl,
      receiptFileName: editReceiptFileName || editClaimModal.receiptFileName
    });
    setEditClaimModal(null);
  };

  const handleConfirmDelete = () => {
    if (!deleteConfirmClaim) return;
    if (removeExpenseClaim) {
      removeExpenseClaim(deleteConfirmClaim.id);
    }
    if (editClaimModal && editClaimModal.id === deleteConfirmClaim.id) {
      setEditClaimModal(null);
    }
    setDeleteConfirmClaim(null);
  };

  // Filtered claims
  const filteredClaims = useMemo(() => {
    return driverExpenses.filter((claim) => {
      const matchTab =
        activeTab === 'All' ||
        claim.status === activeTab;
      const matchSearch =
        searchTerm === '' ||
        claim.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        claim.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        claim.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (claim.bookingId && claim.bookingId.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchTab && matchSearch;
    });
  }, [driverExpenses, activeTab, searchTerm]);

  // Metrics
  const metrics = useMemo(() => {
    const totalClaimed = driverExpenses.reduce((s, e) => s + (e.amount || 0), 0);
    const approvedAmount = driverExpenses
      .filter((e) => e.status === 'Approved' || e.status === 'Paid')
      .reduce((s, e) => s + (e.approvedAmount || e.amount || 0), 0);
    const pendingAmount = driverExpenses
      .filter((e) => e.status === 'Pending Approval')
      .reduce((s, e) => s + (e.amount || 0), 0);
    const paidAmount = driverExpenses
      .filter((e) => e.status === 'Paid')
      .reduce((s, e) => s + (e.approvedAmount || e.amount || 0), 0);
    return { totalClaimed, approvedAmount, pendingAmount, paidAmount };
  }, [driverExpenses]);

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem', paddingBottom: '2rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.625rem', fontWeight: 800, color: 'var(--text-main, #090d16)', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <Receipt size={26} color="#2C3480" />
            Trip Expense Claims
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted, #64748b)', marginTop: '0.25rem' }}>
            Upload receipts, submit on-duty trip disbursements, and track reimbursement approval.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Button
            variant="primary"
            onClick={() => handleOpenSubmit()}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#2C3480', padding: '0.65rem 1.25rem', borderRadius: '12px', fontWeight: 700 }}
          >
            <Plus size={18} />
            Submit Trip Expense
          </Button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '1rem' }}>
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Total Expenses Claimed</div>
          <div style={{ fontSize: '1.625rem', fontWeight: 800, color: '#090d16', marginTop: '0.35rem' }}>
            ₹{metrics.totalClaimed.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>{driverExpenses.length} claims filed</div>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#d97706', textTransform: 'uppercase' }}>Awaiting Admin Approval</div>
          <div style={{ fontSize: '1.625rem', fontWeight: 800, color: '#d97706', marginTop: '0.35rem' }}>
            ₹{metrics.pendingAmount.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
            {driverExpenses.filter((e) => e.status === 'Pending Approval').length} pending review
          </div>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#10b981', textTransform: 'uppercase' }}>Total Approved Amount</div>
          <div style={{ fontSize: '1.625rem', fontWeight: 800, color: '#10b981', marginTop: '0.35rem' }}>
            ₹{metrics.approvedAmount.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#065f46', marginTop: '0.25rem' }}>Ready for settlement</div>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#2C3480', textTransform: 'uppercase' }}>Settled / Paid to Driver</div>
          <div style={{ fontSize: '1.625rem', fontWeight: 800, color: '#2C3480', marginTop: '0.35rem' }}>
            ₹{metrics.paidAmount.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>Bank / UPI settled</div>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', background: '#ffffff', padding: '0.875rem 1.25rem', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {['All', 'Pending Approval', 'Approved', 'Rejected', 'Paid'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '0.45rem 0.95rem',
                borderRadius: '10px',
                fontSize: '0.8125rem',
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer',
                backgroundColor: activeTab === tab ? '#2C3480' : '#f1f5f9',
                color: activeTab === tab ? '#ffffff' : '#475569',
                transition: 'all 0.15s ease'
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        <div style={{ minWidth: '240px', flex: 1, maxWidth: '360px' }}>
          <input
            type="text"
            placeholder="Search by ID, Category, Booking..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '0.5rem 0.85rem',
              borderRadius: '10px',
              border: '1px solid #cbd5e1',
              fontSize: '0.8125rem'
            }}
          />
        </div>
      </div>

      {/* Claims List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {filteredClaims.length === 0 ? (
          <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '3.5rem 1.5rem', textAlign: 'center' }}>
            <Receipt size={42} color="#94a3b8" style={{ margin: '0 auto 1rem' }} />
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#1e293b' }}>No Expense Claims Found</h3>
            <p style={{ fontSize: '0.875rem', color: '#64748b', marginTop: '0.25rem', maxWidth: '420px', margin: '0.25rem auto 1.25rem' }}>
              {activeTab === 'All'
                ? 'You have not submitted any expense claims yet. Click the button below to submit a claim for your active trip.'
                : `No expense claims with status "${activeTab}".`}
            </p>
            <Button variant="primary" onClick={() => handleOpenSubmit()}>
              <Plus size={16} style={{ marginRight: '0.35rem' }} />
              Submit First Expense
            </Button>
          </div>
        ) : (
          filteredClaims.map((claim) => (
            <div
              key={claim.id}
              style={{
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '16px',
                padding: '1.25rem',
                boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div
                    style={{
                      width: '46px',
                      height: '46px',
                      borderRadius: '12px',
                      backgroundColor: '#EEF0FD',
                      color: '#2C3480',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <Receipt size={24} />
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span className="font-mono" style={{ fontWeight: 800, fontSize: '1rem', color: '#090d16' }}>
                        {claim.id}
                      </span>
                      <Badge variant="primary" size="sm">{claim.category}</Badge>
                      {claim.status === 'Approved' && <Badge variant="success">Approved</Badge>}
                      {claim.status === 'Pending Approval' && <Badge variant="warning">Pending Approval</Badge>}
                      {claim.status === 'Rejected' && <Badge variant="danger">Rejected</Badge>}
                      {claim.status === 'Paid' && <Badge variant="info">Paid &amp; Settled</Badge>}
                    </div>
                    <div style={{ fontSize: '0.8125rem', color: '#64748b', marginTop: '0.2rem' }}>
                      Booking: <span className="font-mono" style={{ fontWeight: 600 }}>{claim.bookingId}</span> • Date: {claim.expenseDate} • Pay Method: {claim.paymentMethod}
                    </div>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#2C3480' }}>
                    ₹{claim.amount.toLocaleString('en-IN')}
                  </div>
                  {claim.status === 'Approved' && claim.approvedAmount !== claim.amount && (
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#059669' }}>
                      Approved: ₹{claim.approvedAmount.toLocaleString('en-IN')}
                    </div>
                  )}
                </div>
              </div>

              {/* Description */}
              <div style={{ fontSize: '0.875rem', color: '#334155', backgroundColor: '#f8fafc', padding: '0.75rem 1rem', borderRadius: '10px' }}>
                <span style={{ fontWeight: 600 }}>Description:</span> {claim.description}
                {claim.notes && (
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
                    Notes: {claim.notes}
                  </div>
                )}
              </div>

              {/* Rejection Alert & Action */}
              {claim.status === 'Rejected' && (
                <div style={{ backgroundColor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '10px', padding: '0.875rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#991B1B', fontSize: '0.8125rem', flex: 1, minWidth: '220px' }}>
                    <AlertTriangle size={18} style={{ flexShrink: 0 }} />
                    <span><strong>Claim Rejected:</strong> {claim.rejectionReason && claim.rejectionReason.toLowerCase() !== 'nil' ? claim.rejectionReason : 'Receipt was unclear or requires revision.'}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <Button size="sm" variant="danger" onClick={() => handleOpenEdit(claim)}>
                      <RotateCcw size={14} style={{ marginRight: '0.35rem' }} />
                      Edit &amp; Resubmit
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => setDeleteConfirmClaim(claim)}
                      style={{ color: '#dc2626', borderColor: '#fca5a5', backgroundColor: '#ffffff' }}
                    >
                      <Trash2 size={14} style={{ marginRight: '0.35rem' }} />
                      Remove Claim
                    </Button>
                  </div>
                </div>
              )}

              {/* Approved / Settlement Notes */}
              {claim.status === 'Approved' && (
                <div style={{ backgroundColor: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: '10px', padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#065F46', fontSize: '0.8125rem' }}>
                  <CheckCircle2 size={16} />
                  <span>Approved by Operations Desk on {claim.approvalDate || 'Today'}. {claim.adminRemarks ? `Remarks: "${claim.adminRemarks}"` : ''}</span>
                </div>
              )}

              {/* Paid Status */}
              {claim.status === 'Paid' && (
                <div style={{ backgroundColor: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '10px', padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#1E40AF', fontSize: '0.8125rem' }}>
                  <CreditCard size={16} />
                  <span>Settled via UPI / Direct Transfer on {claim.paymentDate || 'Recently'}. Ref: <strong className="font-mono">{claim.paymentReference || 'TXN-SETTLE-OK'}</strong></span>
                </div>
              )}

              {/* Footer / Actions */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #f1f5f9', paddingTop: '0.75rem', fontSize: '0.75rem', color: '#94a3b8' }}>
                <div>Submitted: {claim.submittedAt}</div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {claim.receiptUrl && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setViewReceiptModal(claim)}
                      style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                    >
                      <Eye size={14} />
                      View Receipt ({claim.receiptFileName || 'File'})
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal 1: Submit New Expense Claim */}
      <Modal
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
        title="Submit Trip Expense Claim"
        subtitle="File toll, parking, fuel or allowance bills for reimbursement"
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsSubmitModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleSubmitClaim} style={{ backgroundColor: '#2C3480' }}>
              Submit Claim
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmitClaim} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
              Select Active / Recent Booking *
            </label>
            <select
              value={selectedBookingId}
              onChange={(e) => setSelectedBookingId(e.target.value)}
              style={{
                width: '100%',
                padding: '0.6rem 0.85rem',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '0.875rem'
              }}
            >
              {safeBookings.map((b) => {
                const origin = (b.pickupLocation || '').split(',')[0] || 'Origin';
                const dest = (b.destination || '').split(',')[0] || 'Destination';
                return (
                  <option key={b.id} value={b.id}>
                    {b.bookingNumber || b.id} — {b.bookingCategory || 'Trip'} ({origin} → {dest})
                  </option>
                );
              })}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                Expense Category *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.6rem 0.85rem',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.875rem'
                }}
              >
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                Claimed Amount (₹) *
              </label>
              <Input
                type="number"
                placeholder="e.g. 450"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                Date of Expense *
              </label>
              <Input
                type="date"
                value={expenseDate}
                onChange={(e) => setExpenseDate(e.target.value)}
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                Payment Method Used *
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.6rem 0.85rem',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.875rem'
                }}
              >
                {paymentMethods.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
              Expense Description &amp; Bill Details *
            </label>
            <Input
              placeholder="e.g. NH45 Paranur Toll Plaza Fastag deduction or IOCL Petrol Refill"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>

          {/* Receipt Upload & Preview */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
              Bill / Receipt / Payment Slip (JPG, PNG, WEBP, PDF &lt; 10MB) *
            </label>

            <input
              type="file"
              ref={fileInputRef}
              accept="image/*,application/pdf"
              onChange={handleReceiptChange}
              style={{ display: 'none' }}
            />

            <div
              style={{
                border: '2px dashed #cbd5e1',
                borderRadius: '12px',
                padding: '1.25rem',
                textAlign: 'center',
                backgroundColor: '#f8fafc',
                cursor: 'pointer'
              }}
              onClick={() => fileInputRef.current?.click()}
            >
              {receiptPreview ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '0.5rem' }}>
                  <img
                    src={receiptPreview}
                    alt="Receipt Preview"
                    style={{ maxHeight: '140px', borderRadius: '8px', objectFit: 'contain', border: '1px solid #cbd5e1' }}
                  />
                  <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#2C3480' }}>
                    {receiptFileName} (Click to replace file)
                  </div>
                </div>
              ) : receiptFileType === 'pdf' ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: '#dc2626' }}>
                  <FileText size={32} />
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.875rem' }}>{receiptFileName}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>PDF document attached (Click to replace)</div>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.35rem' }}>
                  <Upload size={28} color="#2C3480" />
                  <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#334155' }}>Click to upload bill or slip</div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Supports camera photos, screenshots &amp; invoices</div>
                </div>
              )}
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
              Additional Notes (Optional)
            </label>
            <Input
              placeholder="e.g. Passenger requested AC on hills, extra route km covered"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </form>
      </Modal>

      {/* Modal 2: View Receipt Modal */}
      <Modal
        isOpen={!!viewReceiptModal}
        onClose={() => setViewReceiptModal(null)}
        title={`Receipt for ${viewReceiptModal?.id}`}
        subtitle={`${viewReceiptModal?.category} — ₹${viewReceiptModal?.amount}`}
        footer={
          <Button variant="ghost" onClick={() => setViewReceiptModal(null)}>Close</Button>
        }
      >
        {viewReceiptModal && (
          <div style={{ textAlign: 'center' }}>
            {viewReceiptModal.receiptType === 'pdf' ? (
              <div style={{ padding: '2rem', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <FileText size={48} color="#dc2626" style={{ margin: '0 auto 0.5rem' }} />
                <h4 style={{ fontWeight: 700 }}>{viewReceiptModal.receiptFileName || 'Document.pdf'}</h4>
                <p style={{ fontSize: '0.8125rem', color: '#64748b' }}>PDF Receipt Attachment for {viewReceiptModal.category}</p>
              </div>
            ) : (
              <img
                src={viewReceiptModal.receiptUrl}
                alt="Receipt Slip"
                style={{ maxWidth: '100%', maxHeight: '450px', borderRadius: '8px', objectFit: 'contain', border: '1px solid #e2e8f0' }}
              />
            )}
            <div style={{ marginTop: '1rem', fontSize: '0.8125rem', color: '#64748b', textAlign: 'left' }}>
              <strong>Description:</strong> {viewReceiptModal.description}
            </div>
          </div>
        )}
      </Modal>

      {/* Modal 3: Edit & Resubmit Modal */}
      <Modal
        isOpen={!!editClaimModal}
        onClose={() => setEditClaimModal(null)}
        title="Edit & Resubmit Rejected Expense"
        subtitle={`Claim #${editClaimModal?.id}`}
        footer={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', flexWrap: 'wrap', gap: '0.5rem' }}>
            <Button
              variant="secondary"
              onClick={() => {
                const claimToDelete = editClaimModal;
                setEditClaimModal(null);
                setDeleteConfirmClaim(claimToDelete);
              }}
              style={{ color: '#dc2626', borderColor: '#fca5a5', backgroundColor: '#ffffff' }}
            >
              <Trash2 size={14} style={{ marginRight: '0.35rem' }} />
              Remove Claim
            </Button>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <Button variant="ghost" onClick={() => setEditClaimModal(null)}>Cancel</Button>
              <Button variant="primary" onClick={handleConfirmResubmit} style={{ backgroundColor: '#2C3480' }}>
                Resubmit for Approval
              </Button>
            </div>
          </div>
        }
      >
        {editClaimModal && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ backgroundColor: '#FEF2F2', padding: '0.75rem', borderRadius: '8px', border: '1px solid #FECACA', fontSize: '0.8125rem', color: '#991B1B' }}>
              <strong>Admin Rejection Reason:</strong> {editClaimModal.rejectionReason && editClaimModal.rejectionReason.toLowerCase() !== 'nil' ? editClaimModal.rejectionReason : 'Receipt was unclear or requires revision.'}
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                Corrected Amount (₹) *
              </label>
              <Input
                type="number"
                value={editAmount}
                onChange={(e) => setEditAmount(e.target.value)}
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                Updated Description *
              </label>
              <Input
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                Replacement Receipt / Bill Photo (Optional)
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                <input
                  type="file"
                  ref={editFileInputRef}
                  accept="image/*,application/pdf"
                  onChange={handleEditFileChange}
                  style={{ display: 'none' }}
                />
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => editFileInputRef.current?.click()}
                  leftIcon={<Upload size={14} />}
                >
                  {editReceiptFileName ? 'Change Receipt File' : 'Upload New Receipt'}
                </Button>
                {editReceiptFileName && (
                  <span style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 600 }}>
                    ✓ {editReceiptFileName}
                  </span>
                )}
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                Clarification Notes for Operations Admin
              </label>
              <Input
                placeholder="Clarify toll slip details, corrected GST number, etc."
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
              />
            </div>
          </div>
        )}
      </Modal>

      {/* Modal 4: Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteConfirmClaim}
        onClose={() => setDeleteConfirmClaim(null)}
        title="Remove Expense Claim"
        subtitle={`Claim #${deleteConfirmClaim?.id}`}
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeleteConfirmClaim(null)}>
              Keep Claim
            </Button>
            <Button
              variant="danger"
              onClick={handleConfirmDelete}
            >
              <Trash2 size={14} style={{ marginRight: '0.35rem' }} />
              Yes, Remove Claim
            </Button>
          </>
        }
      >
        {deleteConfirmClaim && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', padding: '1rem', backgroundColor: '#FEF2F2', borderRadius: '10px', border: '1px solid #FECACA', color: '#991B1B' }}>
              <AlertTriangle size={24} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div style={{ fontSize: '0.875rem' }}>
                <div style={{ fontWeight: 700, marginBottom: '0.25rem' }}>Permanently remove this claim?</div>
                <div>
                  You are about to remove claim <strong>#{deleteConfirmClaim.id}</strong> for <strong>₹{deleteConfirmClaim.amount}</strong> ({deleteConfirmClaim.category}). This claim will be removed from your expense records.
                </div>
              </div>
            </div>
            <p style={{ fontSize: '0.8125rem', color: '#64748b', margin: 0 }}>
              If you wish to correct an error instead, you can use the <strong>Edit &amp; Resubmit</strong> option to re-apply.
            </p>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default DriverExpenses;
