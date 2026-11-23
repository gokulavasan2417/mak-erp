// MAK Tours & Travels ERP - Operational Expenses & Driver Trip Claims
// Full lifecycle integration: Driver Expense Submission → Admin Review & Adjustment → Approval / Rejection → Settlement & Finance

import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Receipt,
  IndianRupee,
  Plus,
  Search,
  Download,
  Filter,
  Check,
  X,
  Fuel,
  Car,
  FileText,
  AlertCircle,
  Calendar,
  LayoutGrid,
  List,
  ArrowRight,
  Eye,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  CreditCard,
  Send,
  Upload,
  Wrench
} from 'lucide-react';
import { Card, CardHeader, CardBody } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Modal } from '../../../components/ui/Modal';
import { Input } from '../../../components/ui/Input';
import { Badge } from '../../../components/ui/Badge';
import { Pagination } from '../../../components/ui/Pagination';
import { useTripContext } from '../../../context/TripContext';
import { useToast } from '../../../context/ToastContext';
import { formatDateDMY } from '../../../utils/dateUtils';

export function ExpensesList() {
  const toast = useToast();
  const tripCtx = useTripContext() || {};
  const {
    expenses = [],
    bookings = [],
    drivers = [],
    vehicles = [],
    approveExpenseClaim,
    rejectExpenseClaim,
    markExpensePaid,
    submitExpenseClaim,
    addAdminExpense
  } = tripCtx;

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [viewMode, setViewMode] = useState('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  // Add Expense Voucher Modal (Internal Admin)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [expenseType, setExpenseType] = useState('service'); // 'service' (Car Service & Maintenance) or 'trip' (Booking Trip)
  const [selectedVehicleReg, setSelectedVehicleReg] = useState('');
  const [serviceSubCategory, setServiceSubCategory] = useState('General Periodic Service (Oil, Filters & Fluids)');
  const [workshopName, setWorkshopName] = useState('');
  const [odometerKm, setOdometerKm] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [newCategory, setNewCategory] = useState('Vehicle Maintenance');
  const [newAmount, setNewAmount] = useState('');
  const [newBookingId, setNewBookingId] = useState(bookings[0]?.id || bookings[0]?._id || bookings[0]?.bookingNumber || 'BK-508331');
  const [newDriverId, setNewDriverId] = useState(drivers[0]?.id || drivers[0]?._id || 'DRV-001');
  const [newDescription, setNewDescription] = useState('');
  const [newPaymentMethod, setNewPaymentMethod] = useState('Company Card / Bank Transfer');

  // Review & Approve / Reject Modal
  const [reviewModalExpense, setReviewModalExpense] = useState(null);
  const [approvedAmountInput, setApprovedAmountInput] = useState('');
  const [adminRemarksInput, setAdminRemarksInput] = useState('');
  const [rejectionReasonInput, setRejectionReasonInput] = useState('');

  // Mark Paid Modal
  const [markPaidExpense, setMarkPaidExpense] = useState(null);
  const [paymentRefInput, setPaymentRefInput] = useState('');
  const [paymentDateInput, setPaymentDateInput] = useState(new Date().toISOString().substring(0, 10));

  // Full Screen Receipt Preview
  const [viewReceiptModal, setViewReceiptModal] = useState(null);

  const categories = [
    'All Categories',
    'Vendor Payout',
    'Driver Salary',
    'Driver Allowance',
    'Fuel',
    'Toll',
    'Parking',
    'Food',
    'Hotel',
    'State Permit',
    'Vehicle Maintenance',
    'Other Trip Expenses'
  ];

  // Filtered expenses
  const filteredExpenses = useMemo(() => {
    return (expenses || []).filter((e) => {
      if (!e) return false;
      const sTerm = (searchTerm || '').trim().toLowerCase();
      const eId = String(e.id || e._id || '').toLowerCase();
      const eBookingId = String(e.bookingId || e.bookingNumber || e.bookingRef || '').toLowerCase();
      const eDriverName = String(e.driverName || e.payee || '').toLowerCase();
      const eDescription = String(e.description || e.title || '').toLowerCase();
      const eCategory = String(e.category || '').toLowerCase();

      const matchSearch =
        sTerm === '' ||
        eId.includes(sTerm) ||
        eBookingId.includes(sTerm) ||
        eDriverName.includes(sTerm) ||
        eDescription.includes(sTerm) ||
        eCategory.includes(sTerm);

      const matchCategory =
        categoryFilter === 'All' ||
        categoryFilter === 'All Categories' ||
        eCategory === categoryFilter.toLowerCase();

      const matchStatus = statusFilter === 'All' || e.status === statusFilter;

      return matchSearch && matchCategory && matchStatus;
    });
  }, [expenses, searchTerm, categoryFilter, statusFilter]);

  // Paginated
  const paginatedExpenses = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredExpenses.slice(start, start + pageSize);
  }, [filteredExpenses, currentPage, pageSize]);

  // Metrics (Matching prompt formula: Pending expenses are NOT counted as approved!)
  const totalApproved = useMemo(() => {
    return (expenses || [])
      .filter((e) => e && (e.status === 'Approved' || e.status === 'Paid'))
      .reduce((sum, e) => sum + (parseFloat(e.approvedAmount || e.amount || 0) || 0), 0);
  }, [expenses]);

  const totalPending = useMemo(() => {
    return (expenses || [])
      .filter((e) => e && e.status === 'Pending Approval')
      .reduce((sum, e) => sum + (parseFloat(e.amount || 0) || 0), 0);
  }, [expenses]);

  const pendingCount = useMemo(() => {
    return (expenses || []).filter((e) => e && e.status === 'Pending Approval').length;
  }, [expenses]);

  const totalPaid = useMemo(() => {
    return (expenses || [])
      .filter((e) => e && e.status === 'Paid')
      .reduce((sum, e) => sum + (parseFloat(e.approvedAmount || e.amount || 0) || 0), 0);
  }, [expenses]);

  const outstandingSettlement = Math.max(0, totalApproved - totalPaid);

  // Handle Review Modal Open
  const handleOpenReview = (expense) => {
    setReviewModalExpense(expense);
    setApprovedAmountInput((expense.approvedAmount || expense.amount).toString());
    setAdminRemarksInput(expense.adminRemarks || '');
    setRejectionReasonInput('');
  };

  // Handle Approve
  const handleConfirmApprove = () => {
    if (!reviewModalExpense) return;
    const claimedAmt = reviewModalExpense.amount;
    const approvedAmt = parseFloat(approvedAmountInput);

    if (!approvedAmt || approvedAmt <= 0) {
      toast.error('Please enter a valid approved amount');
      return;
    }

    if (approvedAmt !== claimedAmt && !adminRemarksInput.trim()) {
      toast.error('Admin remarks are mandatory when the approved amount differs from the claimed amount.');
      return;
    }

    approveExpenseClaim(reviewModalExpense.id, approvedAmt, adminRemarksInput);
    setReviewModalExpense(null);
  };

  // Handle Reject
  const handleConfirmReject = () => {
    if (!reviewModalExpense) return;
    if (!rejectionReasonInput.trim()) {
      toast.error('A rejection reason is mandatory when declining an expense claim.');
      return;
    }

    rejectExpenseClaim(reviewModalExpense.id, rejectionReasonInput);
    setReviewModalExpense(null);
  };

  // Handle Mark Paid
  const handleConfirmMarkPaid = () => {
    if (!markPaidExpense) return;
    if (!paymentRefInput.trim()) {
      toast.error('Please enter a payment transaction reference');
      return;
    }

    markExpensePaid(markPaidExpense.id, paymentRefInput, paymentDateInput);
    setMarkPaidExpense(null);
  };

  // Create internal expense (Car Service or Trip Voucher)
  const handleCreateInternalExpense = (e) => {
    e.preventDefault();
    if (!newAmount || parseFloat(newAmount) <= 0) {
      toast.error('Please enter a valid expense amount');
      return;
    }

    if (expenseType === 'service') {
      const activeVehicle = (vehicles || []).find(
        (v) => (v.regNo || v.registrationNumber || v.numberPlate || v.id) === selectedVehicleReg
      ) || vehicles[0];

      const vReg = activeVehicle?.regNo || activeVehicle?.registrationNumber || activeVehicle?.numberPlate || selectedVehicleReg || 'TN-09-CD-1234';
      const vName = activeVehicle?.name || activeVehicle?.model || 'Vehicle';
      const matchedDrv = (drivers || []).find((d) => (d.id && d.id === newDriverId) || (d._id && d._id === newDriverId));

      const fullDesc = newDescription.trim()
        ? `${serviceSubCategory} for ${vReg} (${vName}) at ${workshopName || 'Authorized Service Centre'} — ${newDescription.trim()}`
        : `${serviceSubCategory} for ${vReg} (${vName}) at ${workshopName || 'Authorized Service Centre'}`;

      if (addAdminExpense) {
        addAdminExpense({
          category: 'Vehicle Maintenance',
          subCategory: serviceSubCategory,
          vehicleId: activeVehicle?.id || activeVehicle?._id || '',
          vehicleRegNo: vReg,
          vehicleNumber: vReg,
          workshopName: workshopName.trim() || 'Authorized Workshop',
          odometerKm: odometerKm ? Number(odometerKm) : 0,
          invoiceNo: invoiceNumber.trim() || `SRV-${Date.now().toString().slice(-5)}`,
          receiptNumber: invoiceNumber.trim() || `SRV-${Date.now().toString().slice(-5)}`,
          amount: parseFloat(newAmount),
          driverId: newDriverId || null,
          driverName: matchedDrv?.name || matchedDrv?.fullName || 'Fleet Supervisor',
          description: fullDesc,
          paymentMethod: newPaymentMethod || 'Company Card / Bank Transfer',
          status: 'Approved',
          source: 'Fleet Maintenance'
        });
      } else {
        submitExpenseClaim({
          category: 'Vehicle Maintenance',
          vehicleRegNo: vReg,
          amount: parseFloat(newAmount),
          description: fullDesc,
          driverName: matchedDrv?.name || 'Fleet Supervisor'
        });
      }
    } else {
      // Trip / Booking linked expense
      const matchedDrv = (drivers || []).find((d) => (d.id && d.id === newDriverId) || (d._id && d._id === newDriverId));
      const matchedBkg = (bookings || []).find((b) => (b.id && b.id === newBookingId) || (b._id && b._id === newBookingId) || (b.bookingNumber && b.bookingNumber === newBookingId));

      if (addAdminExpense) {
        addAdminExpense({
          bookingId: newBookingId || matchedBkg?.id || null,
          tripId: matchedBkg?.bookingNumber || `TRP-${newBookingId || '001'}`,
          driverId: newDriverId,
          driverName: matchedDrv?.name || matchedDrv?.fullName || 'Assigned Driver',
          vehicleRegNo: matchedBkg?.assignedVehicle?.regNo || matchedBkg?.assignedVehicle?.registrationNumber || 'KA-01-MJ-8890',
          category: newCategory,
          amount: parseFloat(newAmount),
          description: newDescription || `Admin logged ${newCategory} operational expense`,
          paymentMethod: newPaymentMethod,
          status: 'Approved',
          source: 'Admin Operations'
        });
      } else {
        submitExpenseClaim({
          bookingId: newBookingId,
          tripId: matchedBkg?.bookingNumber || `TRP-${newBookingId}`,
          driverId: newDriverId,
          driverName: matchedDrv?.name || matchedDrv?.fullName || 'Assigned Driver',
          vehicleRegNo: matchedBkg?.assignedVehicle?.regNo || matchedBkg?.assignedVehicle?.registrationNumber || 'KA-01-MJ-8890',
          category: newCategory,
          amount: parseFloat(newAmount),
          description: newDescription || `Admin logged ${newCategory} expense`,
          paymentMethod: newPaymentMethod,
          notes: 'Logged directly from Admin Operations Desk'
        });
      }
    }

    setIsAddModalOpen(false);
    setNewAmount('');
    setNewDescription('');
    setWorkshopName('');
    setOdometerKm('');
    setInvoiceNumber('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', paddingBottom: '3rem' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.625rem', fontWeight: 800, color: '#090d16', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <Receipt size={26} color="#2C3480" />
            Trip Expenses &amp; Driver Claims
          </h1>
          <p style={{ fontSize: '0.875rem', color: '#64748b', marginTop: '0.25rem' }}>
            Audit toll bills, Fastag deductions, parking receipts and settle approved driver disbursements.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'inline-flex', borderRadius: '8px', border: '1px solid #cbd5e1', overflow: 'hidden' }}>
            <button
              onClick={() => setViewMode('grid')}
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
                fontWeight: 600
              }}
            >
              <LayoutGrid size={15} /> Cards
            </button>
            <button
              onClick={() => setViewMode('table')}
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
                fontWeight: 600
              }}
            >
              <List size={15} /> Table
            </button>
          </div>

          <Button
            variant="primary"
            style={{ backgroundColor: '#2C3480' }}
            leftIcon={<Plus size={16} />}
            onClick={() => setIsAddModalOpen(true)}
          >
            Log Expense Voucher
          </Button>
        </div>
      </div>

      {/* KPI Cards (Exact Financial Formulas from Section 12) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        <div style={{ backgroundColor: '#ffffff', padding: '1.25rem', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#059669', textTransform: 'uppercase' }}>
            Total Approved Expenses
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#059669', marginTop: '0.35rem' }}>
            ₹{(totalApproved || 0).toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
            Included in Net Profit formula
          </div>
        </div>

        <div style={{ backgroundColor: '#ffffff', padding: '1.25rem', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#d97706', textTransform: 'uppercase' }}>
            Pending Approval ({pendingCount})
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#d97706', marginTop: '0.35rem' }}>
            ₹{(totalPending || 0).toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
            ⚠️ Awaiting review — not in profit
          </div>
        </div>

        <div style={{ backgroundColor: '#ffffff', padding: '1.25rem', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#2563eb', textTransform: 'uppercase' }}>
            Total Paid to Drivers
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#2563eb', marginTop: '0.35rem' }}>
            ₹{(totalPaid || 0).toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
            Bank / UPI transactions settled
          </div>
        </div>

        <div style={{ backgroundColor: '#ffffff', padding: '1.25rem', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#dc2626', textTransform: 'uppercase' }}>
            Outstanding Payments
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#dc2626', marginTop: '0.35rem' }}>
            ₹{(outstandingSettlement || 0).toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
            Approved - Paid balance due
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <Card>
        <CardBody style={{ padding: '1rem 1.25rem' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {['All', 'Pending Approval', 'Approved', 'Rejected', 'Paid'].map((st) => (
                <button
                  key={st}
                  onClick={() => { setStatusFilter(st); setCurrentPage(1); }}
                  style={{
                    padding: '0.45rem 0.85rem',
                    borderRadius: '8px',
                    fontSize: '0.8125rem',
                    fontWeight: 700,
                    border: 'none',
                    cursor: 'pointer',
                    backgroundColor: statusFilter === st ? '#2C3480' : '#f1f5f9',
                    color: statusFilter === st ? '#ffffff' : '#475569'
                  }}
                >
                  {st}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <select
                value={categoryFilter}
                onChange={(e) => { setCategoryFilter(e.target.value); setCurrentPage(1); }}
                style={{
                  padding: '0.5rem 0.75rem',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.8125rem'
                }}
              >
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>

              <div style={{ position: 'relative', minWidth: '240px' }}>
                <Search size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input
                  type="text"
                  placeholder="Search by ID, Driver, Booking..."
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                  style={{
                    width: '100%',
                    padding: '0.5rem 0.75rem 0.5rem 2.2rem',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.8125rem'
                  }}
                />
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Grid or Table Display */}
      {viewMode === 'grid' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(420px, 1fr))', gap: '1.25rem' }}>
          {paginatedExpenses.length === 0 ? (
            <div style={{ gridColumn: '1 / -1', padding: '3.5rem 2rem', textAlign: 'center', backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
              <Receipt size={40} style={{ color: '#cbd5e1', margin: '0 auto 0.75rem' }} />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e293b' }}>No expense claims found</h3>
              <p style={{ fontSize: '0.85rem', color: '#64748b' }}>Try changing the status or category filter.</p>
            </div>
          ) : (
            paginatedExpenses.map((exp, eIdx) => {
              const expId = exp.id || exp._id || `EXP-${eIdx + 1}`;
              return (
              <div
                key={expId}
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '16px',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 2px 5px rgba(0,0,0,0.03)',
                  padding: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.875rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span className="font-mono" style={{ fontWeight: 800, fontSize: '0.95rem', color: '#2C3480' }}>
                      {expId}
                    </span>
                    <Badge variant="primary" size="sm">{exp.category}</Badge>
                    {exp.status === 'Approved' && <Badge variant="success">Approved</Badge>}
                    {exp.status === 'Pending Approval' && <Badge variant="warning">Pending Approval</Badge>}
                    {exp.status === 'Rejected' && <Badge variant="danger">Rejected</Badge>}
                    {exp.status === 'Paid' && <Badge variant="info">Paid</Badge>}
                  </div>

                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#090d16' }}>
                    ₹{Number(exp.amount || 0).toLocaleString('en-IN')}
                  </div>
                </div>

                <div style={{ fontSize: '0.8125rem', color: '#475569', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                  {exp.vehicleRegNo || exp.vehicleNumber ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#1e293b' }}>
                      <Car size={15} color="#2C3480" />
                      <span>Vehicle: <strong style={{ color: '#2C3480' }}>{exp.vehicleRegNo || exp.vehicleNumber}</strong></span>
                      {exp.workshopName && <span style={{ color: '#64748b' }}>• Workshop: {exp.workshopName}</span>}
                      {exp.odometerKm > 0 && <span style={{ color: '#64748b' }}>• {Number(exp.odometerKm).toLocaleString('en-IN')} KM</span>}
                    </div>
                  ) : (
                    <div>
                      Booking: <Link to={`/admin/bookings/${exp.bookingId || exp.id || ''}`} style={{ fontWeight: 700, color: '#2C3480' }}>{exp.bookingId || exp.id || 'N/A'}</Link> • Trip: <span className="font-mono">{exp.tripId || 'TRP-001'}</span>
                    </div>
                  )}
                  <div>
                    Handled by: <strong>{exp.driverName || exp.payee || 'Operations'}</strong> • Date: {formatDateDMY(exp.expenseDate || exp.date) || 'Recent'}
                    {exp.invoiceNo && <span> • Bill #{exp.invoiceNo}</span>}
                  </div>
                  <div>
                    Description: <em>"{exp.description || exp.title || exp.category || 'Expense Voucher'}"</em>
                  </div>
                </div>

                {exp.status === 'Approved' && (
                  <div style={{ backgroundColor: '#ECFDF5', padding: '0.5rem 0.75rem', borderRadius: '8px', fontSize: '0.75rem', color: '#065F46' }}>
                    Approved for <strong>₹{Number(exp.approvedAmount || exp.amount || 0).toLocaleString('en-IN')}</strong>. {exp.adminRemarks ? `Remarks: "${exp.adminRemarks}"` : ''}
                  </div>
                )}

                {exp.status === 'Rejected' && (
                  <div style={{ backgroundColor: '#FEF2F2', padding: '0.5rem 0.75rem', borderRadius: '8px', fontSize: '0.75rem', color: '#991B1B' }}>
                    Rejected: {exp.rejectionReason || 'Declined by operations'}
                  </div>
                )}

                {exp.status === 'Paid' && (
                  <div style={{ backgroundColor: '#EFF6FF', padding: '0.5rem 0.75rem', borderRadius: '8px', fontSize: '0.75rem', color: '#1E40AF' }}>
                    Paid on {formatDateDMY(exp.paymentDate) || 'Recent'}. Ref: <strong className="font-mono">{exp.paymentReference || 'Bank Transfer'}</strong>
                  </div>
                )}

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #f1f5f9', paddingTop: '0.75rem' }}>
                  {exp.receiptUrl ? (
                    <Button size="sm" variant="ghost" onClick={() => setViewReceiptModal(exp)}>
                      <Eye size={13} style={{ marginRight: '0.25rem' }} /> View Slip
                    </Button>
                  ) : (
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>No Receipt</span>
                  )}

                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {exp.status === 'Pending Approval' && (
                      <Button size="sm" variant="primary" onClick={() => handleOpenReview(exp)}>
                        Review &amp; Approve
                      </Button>
                    )}
                    {exp.status === 'Approved' && (
                      <Button
                        size="sm"
                        variant="outline"
                        style={{ color: '#2563EB', borderColor: '#BFDBFE' }}
                        onClick={() => {
                          setMarkPaidExpense(exp);
                          setPaymentRefInput(`UPI-TXN-${Date.now().toString().slice(-5)}`);
                        }}
                      >
                        Mark as Paid
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
          )}
        </div>
      ) : (
        /* Table View */
        <Card>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
              <thead>
                <tr style={{ borderBottom: '1.5px solid #e2e8f0', textAlign: 'left', color: '#64748b' }}>
                  <th style={{ padding: '0.75rem 1rem' }}>Claim ID</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Vehicle / Booking</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Driver</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Category</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Claimed</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Approved</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Receipt</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedExpenses.map((exp, eIdx) => {
                  const expId = exp.id || exp._id || `EXP-${eIdx + 1}`;
                  return (
                  <tr key={expId} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <span className="font-mono" style={{ fontWeight: 800, color: '#2C3480' }}>{expId}</span>
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      {exp.vehicleRegNo || exp.vehicleNumber ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700, color: '#2C3480' }}>
                          <Car size={13} color="#2C3480" />
                          {exp.vehicleRegNo || exp.vehicleNumber}
                        </span>
                      ) : (
                        <Link to={`/admin/bookings/${exp.bookingId || exp.id || ''}`} style={{ fontWeight: 700, color: '#2C3480' }}>
                          {exp.bookingId || exp.id || 'N/A'}
                        </Link>
                      )}
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>{exp.driverName || exp.payee || 'Operations'}</td>
                    <td style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>
                      {exp.category === 'Vehicle Maintenance' ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', color: '#b45309' }}>
                          <Wrench size={13} />
                          {exp.subCategory || 'Car Service'}
                        </span>
                      ) : (
                        exp.category
                      )}
                    </td>
                    <td style={{ padding: '0.75rem 1rem', fontWeight: 700 }}>₹{Number(exp.amount || 0).toLocaleString('en-IN')}</td>
                    <td style={{ padding: '0.75rem 1rem', fontWeight: 700, color: '#059669' }}>
                      {exp.approvedAmount !== undefined ? `₹${Number(exp.approvedAmount || 0).toLocaleString('en-IN')}` : '—'}
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      {exp.receiptUrl ? (
                        <button
                          onClick={() => setViewReceiptModal(exp)}
                          style={{
                            background: '#EEF0FD',
                            color: '#2C3480',
                            border: 'none',
                            padding: '0.2rem 0.5rem',
                            borderRadius: '6px',
                            fontSize: '0.75rem',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.25rem'
                          }}
                        >
                          <Eye size={12} /> View
                        </button>
                      ) : (
                        <span style={{ color: '#94a3b8' }}>None</span>
                      )}
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      {exp.status === 'Approved' && <Badge variant="success">Approved</Badge>}
                      {exp.status === 'Pending Approval' && <Badge variant="warning">Pending</Badge>}
                      {exp.status === 'Rejected' && <Badge variant="danger">Rejected</Badge>}
                      {exp.status === 'Paid' && <Badge variant="info">Paid</Badge>}
                    </td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'flex-end' }}>
                        {exp.status === 'Pending Approval' && (
                          <Button size="sm" variant="primary" onClick={() => handleOpenReview(exp)}>
                            Review
                          </Button>
                        )}
                        {exp.status === 'Approved' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setMarkPaidExpense(exp);
                              setPaymentRefInput(`UPI-TXN-${Date.now().toString().slice(-5)}`);
                            }}
                          >
                            Pay
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={Math.ceil(filteredExpenses.length / pageSize) || 1}
        onPageChange={setCurrentPage}
      />

      {/* MODAL 1: Admin Log Operational / Car Service Expense Voucher */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Log Operational / Car Service Expense"
        subtitle="Record direct vehicle maintenance, workshop bills, road permits, or trip expenses"
        maxWidth="640px"
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleCreateInternalExpense} style={{ backgroundColor: '#2C3480' }}>
              Record Expense Voucher
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreateInternalExpense} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Segmented Switcher: Car Service vs Trip Expense */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.35rem' }}>
              Expense Type &amp; Purpose *
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', backgroundColor: '#f1f5f9', padding: '0.3rem', borderRadius: '10px' }}>
              <button
                type="button"
                onClick={() => {
                  setExpenseType('service');
                  setNewCategory('Vehicle Maintenance');
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.45rem',
                  padding: '0.6rem 0.75rem',
                  borderRadius: '8px',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontSize: '0.8125rem',
                  backgroundColor: expenseType === 'service' ? '#2C3480' : 'transparent',
                  color: expenseType === 'service' ? '#ffffff' : '#64748b',
                  transition: 'all 0.2s ease',
                  boxShadow: expenseType === 'service' ? '0 2px 8px rgba(44, 52, 128, 0.25)' : 'none'
                }}
              >
                <Wrench size={15} />
                <span>Car Service &amp; Maintenance</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setExpenseType('trip');
                  if (newCategory === 'Vehicle Maintenance') setNewCategory('Fuel');
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.45rem',
                  padding: '0.6rem 0.75rem',
                  borderRadius: '8px',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontSize: '0.8125rem',
                  backgroundColor: expenseType === 'trip' ? '#2C3480' : 'transparent',
                  color: expenseType === 'trip' ? '#ffffff' : '#64748b',
                  transition: 'all 0.2s ease',
                  boxShadow: expenseType === 'trip' ? '0 2px 8px rgba(44, 52, 128, 0.25)' : 'none'
                }}
              >
                <Car size={15} />
                <span>Trip / Booking Expense</span>
              </button>
            </div>
          </div>

          {/* MODE A: CAR SERVICE & FLEET MAINTENANCE */}
          {expenseType === 'service' ? (
            <>
              {/* Target Vehicle Dropdown */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#334155', marginBottom: '0.25rem' }}>
                  Target Vehicle / Car *
                </label>
                <select
                  value={selectedVehicleReg || (vehicles[0]?.regNo || vehicles[0]?.registrationNumber || vehicles[0]?.numberPlate || '')}
                  onChange={(e) => setSelectedVehicleReg(e.target.value)}
                  style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.875rem', backgroundColor: '#ffffff' }}
                  required
                >
                  {(vehicles || []).map((v, vIdx) => {
                    const reg = v.regNo || v.registrationNumber || v.numberPlate || v.id || `VEH-${vIdx}`;
                    const vName = v.name || v.model || v.vehicleName || 'Vehicle';
                    const owner = v.ownership || v.ownershipType || 'MAK Owned';
                    return (
                      <option key={v.id || reg} value={reg}>
                        {reg} — {vName} ({owner})
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Service Subcategory & Workshop Name */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#334155', marginBottom: '0.25rem' }}>
                    Service / Repair Type *
                  </label>
                  <select
                    value={serviceSubCategory}
                    onChange={(e) => setServiceSubCategory(e.target.value)}
                    style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.875rem', backgroundColor: '#ffffff' }}
                  >
                    <option value="General Periodic Service (Oil, Filters & Fluids)">General Periodic Service (Oil, Filters & Fluids)</option>
                    <option value="Engine Oil & Filter Change">Engine Oil & Filter Change</option>
                    <option value="Brake System & Brake Pads Replacement">Brake System & Brake Pads Replacement</option>
                    <option value="Tyre Replacement & Wheel Alignment">Tyre Replacement & Wheel Alignment</option>
                    <option value="AC Servicing & Gas Recharge">AC Servicing & Gas Recharge</option>
                    <option value="Battery Replacement & Electrical Check">Battery Replacement & Electrical Check</option>
                    <option value="Clutch & Transmission Repair">Clutch & Transmission Repair</option>
                    <option value="Suspension & Shock Absorber Overhaul">Suspension & Shock Absorber Overhaul</option>
                    <option value="Denting, Painting & Body Repair">Denting, Painting & Body Repair</option>
                    <option value="Full Water Wash & Interior Detailing">Full Water Wash & Interior Detailing</option>
                    <option value="FC (Fitness Certificate) & RTO Inspection">FC (Fitness Certificate) & RTO Inspection</option>
                    <option value="Emergency Breakdown Repair">Emergency Breakdown Repair</option>
                    <option value="Spare Parts & Accessories Replacement">Spare Parts & Accessories Replacement</option>
                    <option value="Other Fleet Maintenance">Other Fleet Maintenance</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#334155', marginBottom: '0.25rem' }}>
                    Workshop / Service Centre
                  </label>
                  <Input
                    type="text"
                    value={workshopName}
                    onChange={(e) => setWorkshopName(e.target.value)}
                    placeholder="e.g. Authorized Toyota Lanson / Bosch Workshop"
                  />
                </div>
              </div>

              {/* Amount & Payment Method */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#334155', marginBottom: '0.25rem' }}>
                    Service Cost Amount (₹) *
                  </label>
                  <Input
                    type="number"
                    value={newAmount}
                    onChange={(e) => setNewAmount(e.target.value)}
                    placeholder="e.g. 7500"
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#334155', marginBottom: '0.25rem' }}>
                    Payment Mode
                  </label>
                  <select
                    value={newPaymentMethod}
                    onChange={(e) => setNewPaymentMethod(e.target.value)}
                    style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.875rem', backgroundColor: '#ffffff' }}
                  >
                    <option value="Company Card / Bank Transfer">Company Card / Bank Transfer</option>
                    <option value="UPI / Direct Transfer">UPI / Direct Transfer</option>
                    <option value="Cash Payment">Cash Payment</option>
                    <option value="Corporate Account / Credit">Corporate Account / Credit</option>
                  </select>
                </div>
              </div>

              {/* Odometer & Invoice No */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#334155', marginBottom: '0.25rem' }}>
                    Odometer Reading (KM)
                  </label>
                  <Input
                    type="number"
                    value={odometerKm}
                    onChange={(e) => setOdometerKm(e.target.value)}
                    placeholder="e.g. 48500"
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#334155', marginBottom: '0.25rem' }}>
                    Workshop Bill / Invoice No
                  </label>
                  <Input
                    type="text"
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                    placeholder="e.g. INV-SER-4819"
                  />
                </div>
              </div>

              {/* Attending Driver / Fleet Supervisor */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#334155', marginBottom: '0.25rem' }}>
                  Handled By (Driver / Fleet Supervisor)
                </label>
                <select
                  value={newDriverId}
                  onChange={(e) => setNewDriverId(e.target.value)}
                  style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.875rem', backgroundColor: '#ffffff' }}
                >
                  <option value="">Internal Fleet Depot / Operations</option>
                  {(drivers || []).map((d, dIdx) => {
                    const dVal = d.id || d._id || `drv-${dIdx}`;
                    const dName = d.name || d.fullName || 'Driver';
                    return (
                      <option key={dVal} value={dVal}>{dName} ({dVal})</option>
                    );
                  })}
                </select>
              </div>

              {/* Work Done Description */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#334155', marginBottom: '0.25rem' }}>
                  Service Description / Parts Replaced Notes
                </label>
                <Input
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="e.g. 50,000 km routine service, synthetic engine oil replaced, brake pad cleaning, wheel alignment"
                />
              </div>
            </>
          ) : (
            /* MODE B: TRIP / BOOKING LINKED EXPENSE */
            <>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#334155', marginBottom: '0.25rem' }}>
                  Linked Booking Manifest *
                </label>
                <select
                  value={newBookingId}
                  onChange={(e) => setNewBookingId(e.target.value)}
                  style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.875rem', backgroundColor: '#ffffff' }}
                >
                  {(bookings || []).map((b) => {
                    if (!b) return null;
                    const bId = b.id || b._id || b.refId || b.bookingNumber || '';
                    const bNum = b.bookingNumber || b.refId || bId;
                    const cName = String(b.customerName || b.fullName || b.name || 'Customer').trim();
                    const pLoc = typeof b.pickupLocation === 'string' ? b.pickupLocation : (typeof b.fromLocation === 'string' ? b.fromLocation : 'Pickup');
                    const dLoc = typeof b.destination === 'string' ? b.destination : (typeof b.toLocation === 'string' ? b.toLocation : (typeof b.dropLocation === 'string' ? b.dropLocation : 'Destination'));
                    const pickup = pLoc.split(',')[0].trim();
                    const dest = dLoc.split(',')[0].trim();
                    return (
                      <option key={bId} value={bId}>
                        {bNum} — {cName} ({pickup} → {dest})
                      </option>
                    );
                  })}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#334155', marginBottom: '0.25rem' }}>
                    Expense Category *
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.875rem', backgroundColor: '#ffffff' }}
                  >
                    {categories.filter((c) => c !== 'All Categories').map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#334155', marginBottom: '0.25rem' }}>
                    Amount (₹) *
                  </label>
                  <Input
                    type="number"
                    value={newAmount}
                    onChange={(e) => setNewAmount(e.target.value)}
                    placeholder="e.g. 1500"
                    required
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#334155', marginBottom: '0.25rem' }}>
                  Responsible Driver *
                </label>
                <select
                  value={newDriverId}
                  onChange={(e) => setNewDriverId(e.target.value)}
                  style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.875rem', backgroundColor: '#ffffff' }}
                >
                  {(drivers || []).map((d, dIdx) => {
                    const dVal = d.id || d._id || `drv-${dIdx}`;
                    const dName = d.name || d.fullName || 'Driver';
                    return (
                      <option key={dVal} value={dVal}>{dName} ({dVal})</option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#334155', marginBottom: '0.25rem' }}>
                  Description *
                </label>
                <Input
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="e.g. Fastag toll deduction, passenger food allowance, parking slip"
                  required
                />
              </div>
            </>
          )}
        </form>
      </Modal>

      {/* MODAL 2: Review & Approve / Reject Driver Expense Claim */}
      <Modal
        isOpen={!!reviewModalExpense}
        onClose={() => setReviewModalExpense(null)}
        title="Audit Driver Expense Claim"
        subtitle={`Claim #${reviewModalExpense?.id} — ${reviewModalExpense?.category}`}
        size="lg"
        footer={
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
            <Button variant="danger" onClick={handleConfirmReject}>
              Reject Claim
            </Button>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <Button variant="ghost" onClick={() => setReviewModalExpense(null)}>Cancel</Button>
              <Button variant="primary" onClick={handleConfirmApprove} style={{ backgroundColor: '#10B981' }}>
                Approve Expense
              </Button>
            </div>
          </div>
        }
      >
        {reviewModalExpense && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {reviewModalExpense.receiptUrl && (
              <div style={{ textAlign: 'center', backgroundColor: '#f8fafc', padding: '0.875rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <img
                  src={reviewModalExpense.receiptUrl}
                  alt="Receipt Preview"
                  style={{ maxHeight: '220px', maxWidth: '100%', objectFit: 'contain', borderRadius: '6px' }}
                />
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
                  {reviewModalExpense.receiptFileName || 'Driver uploaded receipt'}
                </div>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                  Claimed by Driver
                </label>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#090d16', marginTop: '0.15rem' }}>
                  ₹{Number(reviewModalExpense?.amount || 0).toLocaleString('en-IN')}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Driver: {reviewModalExpense.driverName || 'Driver'}</div>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#2C3480', textTransform: 'uppercase' }}>
                  Approved Amount (₹) *
                </label>
                <Input
                  type="number"
                  value={approvedAmountInput}
                  onChange={(e) => setApprovedAmountInput(e.target.value)}
                  style={{ marginTop: '0.15rem' }}
                />
              </div>
            </div>

            {parseFloat(approvedAmountInput) !== Number(reviewModalExpense?.amount || 0) && (
              <div style={{ backgroundColor: '#FFFBEB', border: '1px solid #FDE68A', padding: '0.5rem 0.75rem', borderRadius: '8px', fontSize: '0.75rem', color: '#92400E' }}>
                ⚠️ <strong>Approved amount differs from claimed:</strong> Difference is ₹{Math.abs(parseFloat(approvedAmountInput) - Number(reviewModalExpense?.amount || 0))}. Explanatory remarks below are required.
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#334155', marginBottom: '0.25rem' }}>
                Admin Remarks (Communicated to Driver)
              </label>
              <Input
                placeholder="e.g. Approved per toll plaza slip deduction"
                value={adminRemarksInput}
                onChange={(e) => setAdminRemarksInput(e.target.value)}
              />
            </div>

            <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '0.75rem' }}>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#dc2626', marginBottom: '0.25rem' }}>
                Rejection Reason (Required ONLY if Rejecting Claim)
              </label>
              <Input
                placeholder="e.g. Receipt date does not match trip manifest"
                value={rejectionReasonInput}
                onChange={(e) => setRejectionReasonInput(e.target.value)}
              />
            </div>
          </div>
        )}
      </Modal>

      {/* MODAL 3: Mark as Paid */}
      <Modal
        isOpen={!!markPaidExpense}
        onClose={() => setMarkPaidExpense(null)}
        title="Mark Expense as Paid / Settled"
        subtitle={`Claim #${markPaidExpense?.id || markPaidExpense?._id || ''} — ₹${Number(markPaidExpense?.approvedAmount || markPaidExpense?.amount || 0).toLocaleString('en-IN')}`}
        footer={
          <>
            <Button variant="ghost" onClick={() => setMarkPaidExpense(null)}>Cancel</Button>
            <Button variant="primary" onClick={handleConfirmMarkPaid} style={{ backgroundColor: '#2C3480' }}>
              Confirm Payment
            </Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#334155', marginBottom: '0.25rem' }}>
              Payment Transaction / Reference Number *
            </label>
            <Input
              value={paymentRefInput}
              onChange={(e) => setPaymentRefInput(e.target.value)}
              placeholder="e.g. UPI-TXN-9840112"
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#334155', marginBottom: '0.25rem' }}>
              Settlement Date *
            </label>
            <Input
              type="date"
              value={paymentDateInput}
              onChange={(e) => setPaymentDateInput(e.target.value)}
              required
            />
          </div>
        </div>
      </Modal>

      {/* MODAL 4: Full Receipt View */}
      <Modal
        isOpen={!!viewReceiptModal}
        onClose={() => setViewReceiptModal(null)}
        title={`Receipt Slip — ${viewReceiptModal?.id || viewReceiptModal?._id || ''}`}
        subtitle={`${viewReceiptModal?.category || ''} — ₹${Number(viewReceiptModal?.amount || 0).toLocaleString('en-IN')}`}
        footer={<Button variant="ghost" onClick={() => setViewReceiptModal(null)}>Close</Button>}
      >
        {viewReceiptModal && (
          <div style={{ textAlign: 'center' }}>
            <img
              src={viewReceiptModal.receiptUrl}
              alt="Receipt"
              style={{ maxHeight: '450px', maxWidth: '100%', objectFit: 'contain', borderRadius: '8px' }}
            />
            <div style={{ marginTop: '0.75rem', fontSize: '0.8125rem', color: '#64748b' }}>
              {viewReceiptModal.description}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default ExpensesList;
