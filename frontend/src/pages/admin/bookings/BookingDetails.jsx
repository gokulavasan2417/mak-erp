// MAK Tours & Travels ERP - Booking Details Page
// CRITICAL: ONE WAY TRIP MUST NOT EXIST ANYWHERE IN THIS APPLICATION.
// Incorporates complete trip lifecycle: Driver Assignment, Acceptance Timeline, Vehicle Reservation & Trip Expenses

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import {
  Calendar,
  Clock,
  ArrowLeft,
  User,
  Car,
  Compass,
  MapPin,
  CreditCard,
  FileText,
  UserCheck,
  Ban,
  CheckCircle2,
  Edit,
  Truck,
  Phone,
  Mail,
  ShieldCheck,
  Printer,
  RotateCcw,
  Receipt,
  Plus,
  Eye,
  AlertTriangle,
  Send,
  Check,
  X,
  ExternalLink,
  Info,
  Gauge,
  PlayCircle,
  StopCircle,
  CheckCircle,
  Download
} from 'lucide-react';
import { Card, CardHeader, CardBody } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Modal } from '../../../components/ui/Modal';
import { Input } from '../../../components/ui/Input';
import { AssignCarDriverModal } from '../../../components/admin/AssignCarDriverModal';
import { CollectPaymentModal } from '../../../components/modals/CollectPaymentModal';
import { useTripContext } from '../../../context/TripContext';
import { useToast } from '../../../context/ToastContext';
import { bookingService } from '../../../services';
import { formatDateDMY } from '../../../utils/dateUtils';

export function BookingDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();

  const handleBack = () => {
    if (location.state?.from) {
      navigate(location.state.from);
    } else if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/admin/bookings');
    }
  };

  const {
    bookings,
    vehicles,
    drivers,
    confirmTripAssignment,
    cancelBooking,
    startTrip,
    endTrip,
    approveExpenseClaim,
    rejectExpenseClaim,
    markExpensePaid,
    getBookingExpenses,
    isDriverAvailable
  } = useTripContext();

  const [remoteBooking, setRemoteBooking] = useState(null);

  useEffect(() => {
    if (id) {
      bookingService.getById(id)
        .then((res) => {
          if (res?.data) {
            setRemoteBooking(res.data);
          }
        })
        .catch((err) => {
          console.warn('Direct booking fetch deferred:', err);
        });
    }
  }, [id]);

  const booking = useMemo(() => {
    const rawId = String(id || '').trim();
    const altId = rawId.startsWith('BK-')
      ? rawId.replace('BK-', 'MAK-')
      : rawId.startsWith('MAK-')
      ? rawId.replace('MAK-', 'BK-')
      : rawId;

    const ctxBooking = bookings.find(
      (b) => b.id === rawId || b.bookingNumber === rawId || b.refId === rawId || b._id === rawId ||
             b.id === altId || b.bookingNumber === altId || b.refId === altId || b._id === altId
    );
    if (!remoteBooking) return ctxBooking;
    if (!ctxBooking) return remoteBooking;

    // Safely prioritize populated vehicle & driver objects so stale initial sync doesn't blank them out
    const resolvedVehicle = (remoteBooking.assignedVehicle && (remoteBooking.assignedVehicle.regNo || remoteBooking.assignedVehicle.model || remoteBooking.assignedVehicle.name || remoteBooking.assignedVehicle.id))
      ? remoteBooking.assignedVehicle
      : (ctxBooking.assignedVehicle || remoteBooking.assignedVehicle);

    const resolvedDriver = (remoteBooking.assignedDriver && (remoteBooking.assignedDriver.name || remoteBooking.assignedDriver.fullName || remoteBooking.assignedDriver.id))
      ? remoteBooking.assignedDriver
      : (ctxBooking.assignedDriver || remoteBooking.assignedDriver);

    const resolvedDriverStatus = (remoteBooking.driverAssignmentStatus && remoteBooking.driverAssignmentStatus !== 'Pending' && remoteBooking.driverAssignmentStatus !== 'Unassigned')
      ? remoteBooking.driverAssignmentStatus
      : (ctxBooking.driverAssignmentStatus || remoteBooking.driverAssignmentStatus);

    return {
      ...ctxBooking,
      ...remoteBooking,
      assignedVehicle: resolvedVehicle,
      assignedDriver: resolvedDriver,
      driverAssignmentStatus: resolvedDriverStatus,
      assignmentTimeline: (remoteBooking.assignmentTimeline && remoteBooking.assignmentTimeline.length > 0)
        ? remoteBooking.assignmentTimeline
        : (ctxBooking.assignmentTimeline || [])
    };
  }, [bookings, id, remoteBooking]);

  // Robust fallback resolution for Assigned Vehicle
  const activeVehicle = useMemo(() => {
    if (booking?.assignedVehicle && (booking.assignedVehicle.regNo || booking.assignedVehicle.model || booking.assignedVehicle.name || booking.assignedVehicle.id)) {
      return {
        ...booking.assignedVehicle,
        regNo: booking.assignedVehicle.regNo || booking.assignedVehicle.numberPlate || 'TN 01 AB 4002',
        model: booking.assignedVehicle.model || booking.assignedVehicle.name || booking.vehicleReserved || 'Mahindra XUV700'
      };
    }
    const vId = booking?.vehicleId || booking?.assignedVehicle?.id;
    if (vId) {
      const match = vehicles.find((v) => v.id === vId || v._id === vId || v.regNo === vId || v.numberPlate === vId);
      if (match) {
        const isCompany = !match.vendorId || match.ownership === 'MAK Owned' || match.ownership === 'Company Owned';
        return {
          id: match.id || match._id,
          brand: match.brand || '',
          model: match.model || match.name,
          name: match.model || match.name,
          regNo: match.regNo || match.numberPlate,
          category: match.category || 'SUV',
          seating: match.seating || '7+1',
          fuelType: match.fuelType || 'Diesel',
          status: match.status || 'Reserved',
          ownership: match.ownership || (isCompany ? 'MAK Owned' : 'Vendor Attached'),
          vendorId: match.vendorId || null,
          vendorName: match.vendorName || null,
          image: match.image
        };
      }
    }
    return booking?.assignedVehicle || null;
  }, [booking, vehicles]);

  // Robust fallback resolution for Assigned Driver
  const activeDriver = useMemo(() => {
    if (booking?.assignedDriver && (booking.assignedDriver.name || booking.assignedDriver.fullName)) {
      return booking.assignedDriver;
    }
    const dId = booking?.driverId || booking?.assignedDriverId || booking?.assignedDriver?.id;
    if (dId) {
      const match = drivers.find((d) => d.id === dId || d._id === dId || d.driverBadgeId === dId);
      if (match) {
        return {
          id: match.id || match._id || match.driverBadgeId,
          name: match.fullName || match.name,
          fullName: match.fullName || match.name,
          phone: match.phone || '',
          licenseNumber: match.drivingLicenseNumber || match.licenseNumber || 'TN-07-2015',
          photo: match.avatar || match.photo || '',
          rating: match.rating || 4.8,
          status: match.dutyStatus || match.status || 'Assigned'
        };
      }
      if (booking?.driverName || booking?.assignedDriverName) {
        return {
          id: dId,
          name: booking.driverName || booking.assignedDriverName,
          fullName: booking.driverName || booking.assignedDriverName,
          phone: booking.driverPhone || booking.assignedDriverPhone || '',
          licenseNumber: 'TN-07-2015',
          rating: 4.8,
          status: 'Assigned'
        };
      }
    }
    return booking?.assignedDriver || null;
  }, [booking, drivers]);

  // Robust fallback resolution for Assignment Timeline
  const displayTimeline = useMemo(() => {
    if (booking?.assignmentTimeline && booking.assignmentTimeline.length > 0) {
      return booking.assignmentTimeline;
    }
    if (activeVehicle || activeDriver || booking?.vehicleId || booking?.driverId) {
      const vName = activeVehicle ? `${activeVehicle.model || activeVehicle.name} [${activeVehicle.regNo || ''}]` : (booking?.vehicleName || 'Commercial Fleet Vehicle');
      const dName = activeDriver ? (activeDriver.name || activeDriver.fullName) : (booking?.driverName || 'Designated Driver');
      return [
        {
          id: 'TL-INIT-01',
          timestamp: new Date(booking?.updatedAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          event: `Vehicle Assigned: ${vName} & Driver Assigned: ${dName} (Compensation: ₹${Number(booking?.driverCompensationAmount || 1500).toLocaleString('en-IN')})`,
          actor: 'Operations Admin',
          status: booking?.driverAssignmentStatus || 'Assigned'
        }
      ];
    }
    return [];
  }, [booking, activeVehicle, activeDriver]);

  // Unified Assign Car & Driver Modal State (Dropdowns + MAK Owned Priority)
  const [isAssignDispatchOpen, setIsAssignDispatchOpen] = useState(false);

  // Driver Assignment State
  const [isDriverModalOpen, setIsDriverModalOpen] = useState(false);
  const [selectedDriverId, setSelectedDriverId] = useState('');

  // Vehicle Reassignment Modal State
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
  const [selectedVehicleId, setSelectedVehicleId] = useState('');

  // Expense Review Modal State
  const [reviewExpenseModal, setReviewExpenseModal] = useState(null);
  const [approvedAmountInput, setApprovedAmountInput] = useState('');
  const [adminRemarksInput, setAdminRemarksInput] = useState('');
  const [rejectionReasonInput, setRejectionReasonInput] = useState('');

  // Mark Paid Modal State
  const [markPaidModal, setMarkPaidModal] = useState(null);
  const [paymentRefInput, setPaymentRefInput] = useState('');
  const [paymentDateInput, setPaymentDateInput] = useState(new Date().toISOString().substring(0, 10));

  // Receipt Image Preview Modal
  const [viewReceiptModal, setViewReceiptModal] = useState(null);

  // Cancellation Modal
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('Client requested cancellation');

  // Collect Payment Modal
  const [isCollectPaymentOpen, setIsCollectPaymentOpen] = useState(false);

  // Internal Notes
  const [adminNoteInput, setAdminNoteInput] = useState('');

  // Trip Lifecycle Execution & Odometer State
  const [isStartTripModalOpen, setIsStartTripModalOpen] = useState(false);
  const [startOdoInput, setStartOdoInput] = useState('');
  const [startTripRemarks, setStartTripRemarks] = useState('');

  const [isCompleteTripModalOpen, setIsCompleteTripModalOpen] = useState(false);
  const [endOdoInput, setEndOdoInput] = useState('');
  const [completeTripRemarks, setCompleteTripRemarks] = useState('Trip concluded successfully. Passenger dropped safely.');
  const [tollAmountInput, setTollAmountInput] = useState('0');
  const [fuelAmountInput, setFuelAmountInput] = useState('0');

  // Full 15-Point Financial Invoice Modal State
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  // Eligible Drivers: only Approved, Active, Available without schedule conflicts
  const eligibleDrivers = useMemo(() => {
    if (!booking) return [];
    return drivers.filter((d) => {
      const avail = isDriverAvailable(d.id, booking.journeyDate, booking.returnDate, booking.id);
      return avail.available || d.id === booking.driverId;
    });
  }, [drivers, booking, isDriverAvailable]);

  // Booking Expenses (Derived strictly from authoritative expenses store)
  const bookingExpenses = useMemo(() => {
    if (!booking) return [];
    return getBookingExpenses(booking.id);
  }, [booking, getBookingExpenses]);

  // Expense Totals
  const expenseMetrics = useMemo(() => {
    const totalClaimed = bookingExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    const totalApproved = bookingExpenses
      .filter((e) => e.status === 'Approved' || e.status === 'Paid')
      .reduce((sum, e) => sum + (parseFloat(e.approvedAmount || e.amount) || 0), 0);
    const totalPending = bookingExpenses
      .filter((e) => e.status === 'Pending Approval')
      .reduce((sum, e) => sum + (e.amount || 0), 0);
    const totalPaid = bookingExpenses
      .filter((e) => e.status === 'Paid')
      .reduce((sum, e) => sum + (parseFloat(e.approvedAmount || e.amount) || 0), 0);
    const totalRejected = bookingExpenses
      .filter((e) => e.status === 'Rejected')
      .reduce((sum, e) => sum + (e.amount || 0), 0);
    return { totalClaimed, totalApproved, totalPending, totalPaid, totalRejected };
  }, [bookingExpenses]);

  if (!booking) {
    return (
      <Card style={{ padding: '3rem', textAlign: 'center' }}>
        <h2 style={{ color: 'var(--text-main, #090d16)' }}>Booking Not Found</h2>
        <p style={{ color: 'var(--text-muted, #64748b)' }}>The booking #{id} does not exist or has been removed.</p>
        <Button variant="primary" onClick={handleBack}>
          Back
        </Button>
      </Card>
    );
  }

  // Handle Driver Assignment Confirmation
  const handleConfirmTripAssignment = () => {
    if (!selectedDriverId) {
      toast.error('Please select an eligible driver from the list');
      return;
    }
    const success = confirmTripAssignment(booking.id, selectedDriverId);
    if (success) {
      setIsDriverModalOpen(false);
      setSelectedDriverId('');
      if (id) {
        bookingService.getById(id).then((res) => {
          if (res?.data) setRemoteBooking(res.data);
        }).catch(() => {});
      }
    }
  };

  // 15-Point Financial Invoice Data
  const invoiceData = useMemo(() => {
    if (!booking) return null;
    const bId = booking.bookingNumber || booking.refId || booking.id || booking._id;
    const cName = booking.customerName || booking.fullName || 'Customer';
    const cPhone = booking.customerPhone || booking.mobileNumber || '—';
    const cEmail = booking.customerEmail || booking.email || '—';
    const vName = activeVehicle?.model || activeVehicle?.name || booking.vehicleName || 'Commercial Fleet Vehicle';
    const vReg = activeVehicle?.regNo || booking.vehicleId || 'TN 01 AB 4002';
    const dName = activeDriver?.name || activeDriver?.fullName || booking.driverName || 'Driver';
    const dId = activeDriver?.id || booking.driverId || 'DRV-004';
    const sOdo = Number(booking.startOdometer) || 0;
    const eOdo = Number(booking.endOdometer) || 0;
    const dist = booking.distanceTravelled !== undefined
      ? Number(booking.distanceTravelled)
      : (eOdo > sOdo ? eOdo - sOdo : 0);
    const rateKm = Number(booking.vehicleRatePerKm || activeVehicle?.ratePerKm || activeVehicle?.pricePerKm || 15);
    const vCharge = booking.vehicleTripCharge !== undefined
      ? Number(booking.vehicleTripCharge)
      : Math.round(dist * rateKm);
    const dAllow = Number(booking.driverCompensationAmount || 1500);
    const toll = Number(booking.invoice?.tollCharges || expenseMetrics.totalApproved || 0);
    const fuel = Number(booking.invoice?.fuelReimbursements || 0);
    const baseFare = Number(booking.totalAmount || booking.pricing || booking.fare || 0);
    const advPaid = Number(booking.advancePaid || 0);
    const balDue = Math.max(0, baseFare - advPaid);
    const invNum = booking.invoiceNumber || `INV-${bId}`;

    return {
      invoiceNumber: invNum,
      bookingId: bId,
      customerName: cName,
      customerPhone: cPhone,
      customerEmail: cEmail,
      vehicleModel: vName,
      vehicleRegNo: vReg,
      driverName: dName,
      driverId: dId,
      startOdometer: sOdo,
      endOdometer: eOdo,
      distanceTravelled: dist,
      ratePerKm: rateKm,
      vehicleTripCharge: vCharge,
      driverAllowance: dAllow,
      tollExpenses: toll,
      fuelReimbursements: fuel,
      baseFare: baseFare,
      advancePaid: advPaid,
      balanceDue: balDue,
      grandTotal: baseFare,
      status: balDue === 0 ? 'Paid' : 'Partially Paid'
    };
  }, [booking, activeVehicle, activeDriver, expenseMetrics]);

  // Admin Start Trip Handler
  const handleAdminStartTrip = () => {
    const rawOdo = startOdoInput ? Number(startOdoInput) : (activeVehicle?.odometerKm || 64120);
    const bId = booking.bookingNumber || booking.refId || booking.id || booking._id;
    const ok = startTrip(bId, { startOdometer: rawOdo, remarks: startTripRemarks, isAdmin: true });
    if (ok) {
      setIsStartTripModalOpen(false);
      setStartOdoInput('');
      setStartTripRemarks('');
      if (id) {
        bookingService.getById(id).then((res) => { if (res?.data) setRemoteBooking(res.data); }).catch(() => {});
      }
    }
  };

  // Admin Complete Trip Handler
  const handleAdminCompleteTrip = () => {
    const startOdo = Number(booking.startOdometer) || 0;
    const endOdo = endOdoInput ? Number(endOdoInput) : (startOdo + 150);
    if (endOdo < startOdo) {
      toast.error(`Ending odometer (${endOdo} km) cannot be less than starting odometer (${startOdo} km).`);
      return;
    }
    const bId = booking.bookingNumber || booking.refId || booking.id || booking._id;
    const ok = endTrip(bId, {
      endOdometer: endOdo,
      remarks: completeTripRemarks,
      tollAmount: Number(tollAmountInput) || 0,
      fuelAmount: Number(fuelAmountInput) || 0
    });
    if (ok) {
      setIsCompleteTripModalOpen(false);
      setEndOdoInput('');
      setCompleteTripRemarks('Trip concluded successfully. Passenger dropped safely.');
      setTollAmountInput('0');
      setFuelAmountInput('0');
      if (id) {
        bookingService.getById(id).then((res) => { if (res?.data) setRemoteBooking(res.data); }).catch(() => {});
      }
    }
  };

  // Download Official Invoice PDF Handler
  const handleDownloadInvoicePdf = async () => {
    if (!booking) return;
    const downloadId = booking.bookingNumber || booking.refId || booking.id || booking._id;
    const invNumber = invoiceData?.invoiceNumber || booking.invoiceNumber || `INV-${downloadId}`;
    try {
      setIsDownloadingPdf(true);
      await bookingService.downloadInvoicePdf(downloadId, `Invoice-${invNumber}.pdf`);
      toast.success(`Invoice PDF (${invNumber}) downloaded successfully!`);
    } catch (err) {
      console.error('Invoice download error:', err);
      toast.error(err.message || 'Failed to download invoice PDF');
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  // Open Expense Review
  const handleOpenExpenseReview = (expense) => {
    setReviewExpenseModal(expense);
    setApprovedAmountInput(expense.amount.toString());
    setAdminRemarksInput(expense.adminRemarks || '');
    setRejectionReasonInput('');
  };

  // Approve Expense
  const handleApproveExpense = () => {
    if (!reviewExpenseModal) return;
    const claimedAmt = reviewExpenseModal.amount;
    const approvedAmt = parseFloat(approvedAmountInput);

    if (!approvedAmt || approvedAmt <= 0) {
      toast.error('Please specify a valid approved amount');
      return;
    }

    if (approvedAmt !== claimedAmt && !adminRemarksInput.trim()) {
      toast.error('Admin remarks are required when the approved amount differs from the claimed amount.');
      return;
    }

    approveExpenseClaim(reviewExpenseModal.id, approvedAmt, adminRemarksInput);
    setReviewExpenseModal(null);
  };

  // Reject Expense
  const handleRejectExpense = () => {
    if (!reviewExpenseModal) return;
    if (!rejectionReasonInput.trim()) {
      toast.error('Please enter a rejection reason explaining why the claim cannot be approved.');
      return;
    }
    rejectExpenseClaim(reviewExpenseModal.id, rejectionReasonInput);
    setReviewExpenseModal(null);
  };

  // Mark Paid
  const handleConfirmMarkPaid = () => {
    if (!markPaidModal) return;
    if (!paymentRefInput.trim()) {
      toast.error('Please enter a payment reference / transaction ID');
      return;
    }
    markExpensePaid(markPaidModal.id, paymentRefInput, paymentDateInput);
    setMarkPaidModal(null);
    setPaymentRefInput('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', paddingBottom: '3rem' }}>
      {/* Top Header */}
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
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Button variant="ghost" onClick={handleBack} style={{ padding: '0.5rem' }} aria-label="Go Back">
            <ArrowLeft size={18} />
          </Button>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#090d16', margin: 0 }}>
                {booking.bookingNumber || booking.id}
              </h1>
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  backgroundColor: '#EEF0FD',
                  color: '#2C3480',
                  padding: '0.2rem 0.6rem',
                  borderRadius: '6px'
                }}
              >
                {(!booking.bookingCategory || booking.bookingCategory.toLowerCase().includes('one way')) ? 'Round Trip' : booking.bookingCategory}
              </span>
              <Badge variant={booking.bookingStatus === 'Confirmed' ? 'success' : booking.bookingStatus === 'On Trip' ? 'info' : 'primary'}>
                {booking.bookingStatus}
              </Badge>
            </div>
            <div style={{ fontSize: '0.8125rem', color: '#64748b', marginTop: '0.25rem' }}>
              Created: {formatDateDMY(booking.createdAt, true)} • Invoice: <span className="font-mono">{booking.invoiceNumber || 'INV-2026-093'}</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
          <Button variant="outline" leftIcon={<Printer size={15} />} onClick={() => window.print()}>
            Print Manifest
          </Button>
          {(booking.bookingStatus === 'Completed' || booking.tripStatus === 'Completed') && (
            <Button
              variant="primary"
              style={{ backgroundColor: '#2C3480', fontWeight: 700 }}
              leftIcon={<Download size={15} />}
              onClick={handleDownloadInvoicePdf}
              disabled={isDownloadingPdf}
            >
              {isDownloadingPdf ? 'Generating PDF...' : 'Download Invoice (PDF)'}
            </Button>
          )}
          {booking.bookingStatus === 'Cancelled' ? (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                fontSize: '0.8125rem',
                fontWeight: 800,
                padding: '0.4rem 0.85rem',
                borderRadius: '8px',
                backgroundColor: '#fee2e2',
                color: '#dc2626',
                border: '1px solid #fca5a5'
              }}
            >
              <Ban size={15} /> Trip Cancelled
            </span>
          ) : booking.bookingStatus !== 'Completed' ? (
            <Button
              variant="outline"
              style={{ color: '#EF4444', borderColor: '#FECACA' }}
              leftIcon={<Ban size={15} />}
              onClick={() => setIsCancelModalOpen(true)}
            >
              Cancel Trip
            </Button>
          ) : null}
        </div>
      </div>

      {/* Featured Booking Manifest Overview (User Reference Screenshot Design) */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 2px 6px rgba(0, 0, 0, 0.04)',
          padding: '1.25rem 1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.875rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.05rem', fontWeight: 800, color: '#2C3480' }}>
              {booking.bookingNumber || booking.id}
            </span>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem',
                fontSize: '0.75rem',
                fontWeight: 700,
                backgroundColor: '#EEF0FD',
                color: '#2C3480',
                padding: '0.2rem 0.55rem',
                borderRadius: '6px',
                border: '1px solid #c7d2fe'
              }}
            >
              <RotateCcw size={11} /> {(!booking.bookingCategory || booking.bookingCategory.toLowerCase().includes('one way')) ? 'Round Trip' : booking.bookingCategory}
            </span>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem',
                fontSize: '0.75rem',
                fontWeight: 700,
                backgroundColor: booking.bookingStatus === 'Cancelled' ? '#fee2e2' : booking.bookingStatus === 'Confirmed' ? '#dcfce7' : booking.bookingStatus === 'On Trip' ? '#e0f2fe' : '#f1f5f9',
                color: booking.bookingStatus === 'Cancelled' ? '#dc2626' : booking.bookingStatus === 'Confirmed' ? '#15803d' : booking.bookingStatus === 'On Trip' ? '#0369a1' : '#475569',
                padding: '0.2rem 0.55rem',
                borderRadius: '6px'
              }}
            >
              {booking.bookingStatus === 'Cancelled' ? '✕ Cancelled' : `✓ ${booking.bookingStatus}`}
            </span>
          </div>

          <div style={{ fontSize: '0.8125rem', color: '#64748b' }}>
            {booking.confirmedAt ? `Confirmed: ${formatDateDMY(booking.confirmedAt, true)}` : `Confirmed: ${formatDateDMY(booking.createdAt, true)}`}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', fontSize: '0.875rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#64748b' }}>Customer Name:</span>
            {booking.customerId ? (
              <Link to={`/admin/customers/${booking.customerId}`} style={{ fontWeight: 800, color: '#2C3480', textDecoration: 'none' }}>
                {booking.customerName || booking.fullName || 'Valued Guest'} &rarr;
              </Link>
            ) : (
              <span style={{ fontWeight: 800, color: '#0f172a' }}>{booking.customerName || booking.fullName || 'Valued Guest'}</span>
            )}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#64748b' }}>Contact Number:</span>
            <span style={{ fontWeight: 800, color: '#0f172a' }}>{booking.customerPhone || booking.mobileNumber || '-'}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#64748b' }}>Route:</span>
            <span style={{ fontWeight: 800, color: '#0f172a' }}>
              {booking.pickupLocation} &rarr; {booking.destination}
            </span>
          </div>
        </div>

        {/* Pricing Summary Box */}
        {(() => {
          const effectiveTotal = Number(booking.totalAmount || booking.pricing || booking.totalFare || booking.fare || 0);
          const effectiveAdv = Math.max(0, Number(booking.advancePaid || 0));
          const effectiveBal = booking.balanceAmount !== undefined && booking.balanceAmount !== null && !isNaN(Number(booking.balanceAmount))
            ? Math.max(0, Number(booking.balanceAmount))
            : Math.max(0, effectiveTotal - effectiveAdv);
          const isSettled = effectiveBal <= 0 && effectiveTotal > 0;

          return (
            <div
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                padding: '1rem 1.25rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.875rem',
                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.02)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div>
                  <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#64748b', letterSpacing: '0.04em' }}>
                    TOTAL FARE / PRICING:
                  </div>
                  <div style={{ fontSize: '1.45rem', fontWeight: 900, color: '#2C3480', marginTop: '0.15rem' }}>
                    ₹{effectiveTotal.toLocaleString('en-IN')}
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#64748b', letterSpacing: '0.04em' }}>
                    PAYMENT TYPE
                  </div>
                  <div
                    style={{
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      backgroundColor: '#EEF0FD',
                      color: '#2C3480',
                      padding: '0.25rem 0.75rem',
                      borderRadius: '20px',
                      display: 'inline-block',
                      marginTop: '0.2rem'
                    }}
                  >
                    {booking.paymentType || (isSettled ? 'Full Payment (100% Settled)' : effectiveAdv > 0 ? 'Partial Advance Payment' : 'Book at ₹0 (Pay on Departure)')}
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
                <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '0.75rem 1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.72rem', fontWeight: 800, color: '#16a34a' }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#16a34a' }} />
                    AMOUNT PAID
                  </div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#15803d', marginTop: '0.2rem' }}>
                    ₹{effectiveAdv.toLocaleString('en-IN')}
                  </div>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#15803d', marginTop: '0.15rem' }}>
                    {isSettled
                      ? '✓ 100% Settled'
                      : effectiveAdv > 0
                      ? `✓ Advance Paid (${Math.round((effectiveAdv / Math.max(1, effectiveTotal)) * 100)}%)`
                      : '0% Paid (Pay on Departure)'}
                  </div>
                </div>

                <div style={{ backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: '10px', padding: '0.75rem 1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.72rem', fontWeight: 800, color: '#d97706' }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#d97706' }} />
                    BALANCE TO BE PAID
                  </div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#b45309', marginTop: '0.2rem' }}>
                    ₹{effectiveBal.toLocaleString('en-IN')}
                  </div>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#b45309', marginTop: '0.15rem' }}>
                    {effectiveBal <= 0
                      ? '✓ No balance due'
                      : `₹${effectiveBal.toLocaleString('en-IN')} pending collection`}
                  </div>
                  {effectiveBal > 0 && (
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => setIsCollectPaymentOpen(true)}
                      style={{
                        backgroundColor: '#16a34a',
                        borderColor: '#15803d',
                        color: '#ffffff',
                        fontWeight: 800,
                        marginTop: '0.65rem',
                        width: '100%',
                        fontSize: '0.8rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.4rem',
                        boxShadow: '0 1px 3px rgba(22, 163, 74, 0.25)'
                      }}
                    >
                      <CheckCircle2 size={15} /> Collect Balance / Mark as Paid
                    </Button>
                  )}
                </div>
              </div>
            </div>
          );
        })()}
      </div>

      {/* SECTION 2 & 5: DEDICATED DRIVER ASSIGNMENT & TIMELINE GRID */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 0.8fr)', gap: '1.25rem' }}>
        {/* Left Column: Dedicated Driver & Vehicle Assignment Section */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Card A: Selected Vehicle Details & Availability */}
          <Card>
            <CardHeader
              title="1. Commercial Fleet Vehicle Allocation"
              subtitle="Assign physical car from company or vendor fleet. MAK Owned is prioritized."
            />
            <CardBody style={{ padding: '1.25rem' }}>
              {(activeVehicle && (activeVehicle.regNo || activeVehicle.model || activeVehicle.name || activeVehicle.id)) ? (
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                  <img
                    src={activeVehicle?.image || 'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?auto=format&fit=crop&w=400&q=80'}
                    alt="Vehicle"
                    style={{ width: '130px', height: '90px', borderRadius: '10px', objectFit: 'cover', border: '1px solid #e2e8f0' }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#090d16', margin: 0 }}>
                        {activeVehicle?.model || booking.vehicleName || 'Vehicle'}
                      </h3>
                      <Badge variant="primary" size="sm">{activeVehicle?.category || 'SUV'}</Badge>
                      <Badge variant={activeVehicle?.status === 'On Trip' ? 'info' : 'success'} size="sm">
                        {activeVehicle?.status || 'Available'}
                      </Badge>
                      {activeVehicle.ownership === 'Vendor Attached' || activeVehicle.vendorId ? (
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, backgroundColor: '#fef3c7', color: '#b45309', padding: '0.2rem 0.5rem', borderRadius: '6px' }}>
                          🤝 Vendor Attached ({activeVehicle.vendorName || 'Partner'})
                        </span>
                      ) : (
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, backgroundColor: '#dcfce7', color: '#15803d', padding: '0.2rem 0.5rem', borderRadius: '6px' }}>
                          🏢 MAK Owned (Company Preferred)
                        </span>
                      )}
                    </div>

                    <div style={{ marginTop: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.8125rem', color: '#475569' }}>
                      <span>Reg Plate: <strong className="font-mono">{activeVehicle?.regNo}</strong></span>
                      <span>•</span>
                      <span>Seating: <strong>{activeVehicle?.seating || '7+1'}</strong></span>
                      <span>•</span>
                      <span>Fuel: <strong>{activeVehicle?.fuelType || 'Diesel'}</strong></span>
                    </div>

                    <div style={{ marginTop: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        Need to swap vehicle or assign driver? Use the dropdown modal.
                      </div>
                      <Button variant="outline" size="sm" onClick={() => setIsAssignDispatchOpen(true)}>
                        Change Vehicle / Driver
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ backgroundColor: '#fffbeb', border: '1.5px dashed #f59e0b', borderRadius: '12px', padding: '1.25rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>🚗</div>
                  <div style={{ fontWeight: 800, color: '#92400e', fontSize: '1rem' }}>Physical Vehicle Not Yet Allocated</div>
                  <div style={{ fontSize: '0.85rem', color: '#78350f', marginTop: '0.25rem' }}>
                    Customer requested car model: <strong>{booking.vehicleReserved || booking.vehicleName || 'Toyota Innova Crysta'}</strong>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#b45309', marginTop: '0.35rem' }}>
                    Assign physical vehicle from fleet. Admin's own vehicles (MAK Owned) are prioritized over vendor-attached cars.
                  </div>
                  <div style={{ marginTop: '0.875rem' }}>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => setIsAssignDispatchOpen(true)}
                      style={{ backgroundColor: '#2C3480', fontWeight: 700 }}
                    >
                      Assign Car &amp; Driver (Dropdowns)
                    </Button>
                  </div>
                </div>
              )}
            </CardBody>
          </Card>

          {/* Card B: Dedicated Driver Assignment */}
          <Card>
            <CardHeader
              title="2. Certified Driver Assignment"
              subtitle="Select approved, active driver and click Confirm Trip to dispatch digital assignment"
            />
            <CardBody style={{ padding: '1.25rem' }}>
              {/* If already assigned */}
              {activeDriver ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', borderRadius: '12px', border: '1.5px solid #2C3480', backgroundColor: '#EEF0FD' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <img
                        src={activeDriver.photo || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80'}
                        alt="Driver"
                        style={{ width: '56px', height: '56px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #2C3480' }}
                      />
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontWeight: 800, fontSize: '1rem', color: '#090d16' }}>
                            {activeDriver.name || activeDriver.fullName}
                          </span>
                          <span className="font-mono" style={{ fontSize: '0.75rem', color: '#64748b' }}>
                            ({activeDriver.id})
                          </span>
                        </div>
                        <div style={{ fontSize: '0.8125rem', color: '#475569', marginTop: '0.15rem' }}>
                          📞 {activeDriver.phone} • License: <strong className="font-mono">{activeDriver.licenseNumber || 'TN-07-2015'}</strong>
                        </div>
                        <div style={{ marginTop: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#166534', backgroundColor: '#DCFCE7', padding: '0.15rem 0.45rem', borderRadius: '4px' }}>
                            Base Pay: ₹{Number(booking.driverBaseTripPay || (booking.driverCompensationAmount ? (booking.driverCompensationAmount - (booking.nightStayAmount || 0)) : 1500)).toLocaleString('en-IN')}
                          </span>
                          {(booking.nightStayAmount || 0) > 0 && (
                            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#1E40AF', backgroundColor: '#DBEAFE', padding: '0.15rem 0.45rem', borderRadius: '4px' }}>
                              🌙 Night Stay: +₹{Number(booking.nightStayAmount).toLocaleString('en-IN')} ({booking.nightStayNights || 1}N){booking.nightStayAddedByDriver ? ' • Added by Driver' : ''}
                            </span>
                          )}
                          <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#0F172A' }}>
                            Total Pay: ₹{Number(booking.driverCompensationAmount || 1500).toLocaleString('en-IN')}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      {booking.driverAssignmentStatus === 'Accepted' ? (
                        <Badge variant="success" size="lg">✓ Driver Accepted</Badge>
                      ) : booking.driverAssignmentStatus === 'Assigned' ? (
                        <Badge variant="warning" size="lg">⏳ Awaiting Acceptance</Badge>
                      ) : (
                        <Badge variant="danger" size="lg">⚠️ Reassignment Required</Badge>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      Need to reassign? Click below to select an alternative driver or vehicle.
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setIsAssignDispatchOpen(true)}>
                      Reassign Car &amp; Driver
                    </Button>
                  </div>
                </div>
              ) : (
                /* Driver Pending / Reassignment Required */
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {booking.driverAssignmentStatus === 'Reassignment Required' && (
                    <div style={{ backgroundColor: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: '10px', padding: '0.875rem 1rem', color: '#991B1B', fontSize: '0.8125rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700 }}>
                        <AlertTriangle size={16} /> Driver Declined – Reassignment Required
                      </div>
                      <div style={{ marginTop: '0.25rem' }}>
                        Previous driver declined this trip. Reason: <em>"{booking.declineReason || 'Schedule conflict'}"</em>. Please assign another eligible driver below.
                      </div>
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div style={{ fontSize: '0.875rem', color: '#475569' }}>
                      Driver assignment is currently <strong>Pending</strong>. You can assign via dropdown modal or pick from the roster below:
                    </div>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => setIsAssignDispatchOpen(true)}
                      style={{ backgroundColor: '#2C3480', fontWeight: 700 }}
                    >
                      Assign Car &amp; Driver (Dropdowns)
                    </Button>
                  </div>

                  {eligibleDrivers.length === 0 ? (
                    <div style={{ padding: '1.5rem', backgroundColor: '#FFFBEB', borderRadius: '10px', border: '1px solid #FDE68A', textAlign: 'center' }}>
                      <AlertTriangle size={32} color="#D97706" style={{ margin: '0 auto 0.5rem' }} />
                      <div style={{ fontWeight: 700, color: '#B45309' }}>No Available Drivers</div>
                      <div style={{ fontSize: '0.8125rem', color: '#92400E', marginTop: '0.25rem' }}>
                        All approved drivers are currently assigned, on active trips, or on leave. Cannot dispatch assignment at this time.
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {eligibleDrivers.map((drv) => {
                        const isSelected = selectedDriverId === drv.id;
                        return (
                          <div
                            key={drv.id}
                            onClick={() => setSelectedDriverId(drv.id)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '0.875rem 1rem',
                              borderRadius: '12px',
                              border: `1.5px solid ${isSelected ? '#2C3480' : '#e2e8f0'}`,
                              backgroundColor: isSelected ? '#EEF0FD' : '#ffffff',
                              cursor: 'pointer',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
                              <img
                                src={drv.photo || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80'}
                                alt={drv.name}
                                style={{ width: '42px', height: '42px', borderRadius: '50%', objectFit: 'cover' }}
                              />
                              <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                  <strong style={{ fontSize: '0.925rem', color: '#090d16' }}>{drv.name}</strong>
                                  <span className="font-mono" style={{ fontSize: '0.75rem', color: '#64748b' }}>({drv.id})</span>
                                </div>
                                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.15rem' }}>
                                  📞 {drv.phone} • {drv.experience} • Rating: {drv.rating} ★
                                </div>
                              </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                              <Badge variant="success" size="sm">Available</Badge>
                              <div
                                style={{
                                  width: '20px',
                                  height: '20px',
                                  borderRadius: '50%',
                                  border: `2px solid ${isSelected ? '#2C3480' : '#cbd5e1'}`,
                                  backgroundColor: isSelected ? '#2C3480' : 'transparent',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center'
                                }}
                              >
                                {isSelected && <Check size={12} color="#ffffff" />}
                              </div>
                            </div>
                          </div>
                        );
                      })}

                      {/* Confirm Trip Action Button */}
                      <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid #f1f5f9' }}>
                        <Button
                          variant="primary"
                          disabled={!selectedDriverId}
                          onClick={handleConfirmTripAssignment}
                          style={{
                            width: '100%',
                            padding: '0.75rem',
                            borderRadius: '12px',
                            backgroundColor: selectedDriverId ? '#2C3480' : '#cbd5e1',
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem'
                          }}
                        >
                          <Send size={16} />
                          Confirm Trip &amp; Dispatch Assignment
                        </Button>
                        <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.4rem', textAlign: 'center' }}>
                          ⚠️ <strong>IMPORTANT:</strong> Confirm Trip sends the digital assignment to the driver's phone. It does <em>NOT</em> mean the driver has accepted yet.
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardBody>
          </Card>

          {/* Card C: Trip Lifecycle & Fleet Telematics Execution */}
          {activeDriver && (
            <Card>
              <CardHeader
                title="3. Trip Lifecycle & Fleet Telematics Execution"
                subtitle="Live odometer monitoring, driver duty progress, and automated billing calculation"
              />
              <CardBody style={{ padding: '1.25rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem', marginBottom: '1.25rem' }}>
                  <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '0.75rem' }}>
                    <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Trip Status</div>
                    <div style={{ marginTop: '0.25rem' }}>
                      <Badge
                        variant={
                          booking.tripStatus === 'Completed'
                            ? 'success'
                            : booking.tripStatus === 'In Progress'
                            ? 'info'
                            : booking.tripStatus === 'Arrived at Pickup'
                            ? 'warning'
                            : booking.driverAssignmentStatus === 'Accepted'
                            ? 'success'
                            : 'neutral'
                        }
                        size="md"
                      >
                        {booking.tripStatus || (booking.driverAssignmentStatus === 'Accepted' ? 'Driver Accepted' : 'Assigned')}
                      </Badge>
                    </div>
                  </div>

                  <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '0.75rem' }}>
                    <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Start Odometer</div>
                    <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#090d16', marginTop: '0.2rem' }}>
                      {booking.startOdometer ? `${booking.startOdometer} km` : '—'}
                    </div>
                  </div>

                  <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '0.75rem' }}>
                    <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>End Odometer</div>
                    <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#090d16', marginTop: '0.2rem' }}>
                      {booking.endOdometer ? `${booking.endOdometer} km` : '—'}
                    </div>
                  </div>

                  <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '10px', padding: '0.75rem' }}>
                    <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#065f46', textTransform: 'uppercase' }}>Distance Traversed</div>
                    <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#059669', marginTop: '0.2rem' }}>
                      {booking.distanceTravelled !== undefined
                        ? `${booking.distanceTravelled} km`
                        : (booking.endOdometer && booking.startOdometer ? `${booking.endOdometer - booking.startOdometer} km` : '—')}
                    </div>
                  </div>

                  <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '10px', padding: '0.75rem' }}>
                    <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#1e40af', textTransform: 'uppercase' }}>Vehicle Rate</div>
                    <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#2563eb', marginTop: '0.2rem' }}>
                      ₹{booking.vehicleRatePerKm || activeVehicle?.ratePerKm || 15} / km
                    </div>
                  </div>

                  <div style={{ background: '#fef3c7', border: '1px solid #fde68a', borderRadius: '10px', padding: '0.75rem' }}>
                    <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#92400e', textTransform: 'uppercase' }}>Vehicle Trip Cost</div>
                    <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#d97706', marginTop: '0.2rem' }}>
                      ₹{(booking.vehicleTripCharge !== undefined ? booking.vehicleTripCharge : ((booking.distanceTravelled || 0) * (booking.vehicleRatePerKm || 15))).toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>

                {/* Operational Action Controls */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid #f1f5f9' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {/* Start Trip Button - Driver/Admin can start the trip on the journey start date */}
                    {booking.tripStatus !== 'In Progress' && booking.tripStatus !== 'Completed' && booking.bookingStatus !== 'Cancelled' && (
                      (() => {
                        const todayStr = new Date().toISOString().substring(0, 10);
                        const rawJDate = booking.journeyDate || booking.travelDate || booking.pickupDate;
                        const jDate = rawJDate ? String(rawJDate).substring(0, 10) : '';
                        const isPriorToJourney = jDate && todayStr < jDate;

                        if (isPriorToJourney) {
                          return (
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.78rem', color: '#64748b', backgroundColor: '#f1f5f9', padding: '0.35rem 0.75rem', borderRadius: '8px', fontWeight: 600 }}>
                              <Clock size={14} style={{ color: '#2C3480' }} />
                              Journey starts on {formatDateDMY(jDate)} (Starts on journey date)
                            </div>
                          );
                        }

                        return (
                          <Button
                            variant="primary"
                            size="sm"
                            style={{ backgroundColor: '#2C3480', fontWeight: 700 }}
                            onClick={() => {
                              setStartOdoInput(activeVehicle?.odometerKm || 64120);
                              setIsStartTripModalOpen(true);
                            }}
                          >
                            <PlayCircle size={15} style={{ marginRight: '0.35rem' }} /> Start Trip (Record Meter)
                          </Button>
                        );
                      })()
                    )}

                    {/* Complete Trip Button */}
                    {booking.tripStatus === 'In Progress' && (
                      <Button
                        variant="primary"
                        size="sm"
                        style={{ backgroundColor: '#10b981', fontWeight: 700 }}
                        onClick={() => {
                          setEndOdoInput((booking.startOdometer || activeVehicle?.odometerKm || 64120) + 150);
                          setIsCompleteTripModalOpen(true);
                        }}
                      >
                        <CheckCircle size={15} style={{ marginRight: '0.35rem' }} /> Complete Trip &amp; Finalize
                      </Button>
                    )}

                    {booking.tripStatus === 'Completed' && (
                      <span style={{ fontSize: '0.8125rem', color: '#059669', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <CheckCircle2 size={16} /> Trip Successfully Concluded &amp; Settled
                      </span>
                    )}
                  </div>

                  {/* View Invoice Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    style={{ fontWeight: 700, borderColor: '#2C3480', color: '#2C3480' }}
                    onClick={() => setIsInvoiceModalOpen(true)}
                  >
                    <FileText size={15} style={{ marginRight: '0.35rem' }} /> View Full Breakdown Invoice
                  </Button>

                  {(booking.bookingStatus === 'Completed' || booking.tripStatus === 'Completed') && (
                    <Button
                      variant="primary"
                      size="sm"
                      style={{ backgroundColor: '#2C3480', fontWeight: 700 }}
                      onClick={handleDownloadInvoicePdf}
                      disabled={isDownloadingPdf}
                    >
                      <Download size={15} style={{ marginRight: '0.35rem' }} /> {isDownloadingPdf ? 'Downloading...' : 'Download PDF'}
                    </Button>
                  )}
                </div>
              </CardBody>
            </Card>
          )}
        </div>

        {/* Right Column: SECTION 5 - Driver Assignment Timeline & Audit History */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <Card>
            <CardHeader
              title="Driver Assignment Timeline"
              subtitle="Full audit trail of dispatch, driver responses, and trip lifecycle"
            />
            <CardBody style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {displayTimeline.length === 0 ? (
                  <div style={{ color: '#64748b', fontSize: '0.85rem', textAlign: 'center', padding: '1.25rem' }}>
                    No assignment dispatched yet.
                  </div>
                ) : (
                  displayTimeline.map((tl, index) => {
                    let badgeVariant = 'neutral';
                    if (tl.status === 'Accepted') badgeVariant = 'success';
                    if (tl.status === 'Declined') badgeVariant = 'danger';
                    if (tl.status === 'Assigned') badgeVariant = 'warning';
                    if (tl.status === 'In Progress') badgeVariant = 'info';
                    if (tl.status === 'Completed') badgeVariant = 'success';

                    return (
                      <div key={tl.id || index} style={{ display: 'flex', gap: '0.75rem', position: 'relative' }}>
                        {/* Timeline dot & line */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <div
                            style={{
                              width: '12px',
                              height: '12px',
                              borderRadius: '50%',
                              backgroundColor: tl.status === 'Declined' ? '#EF4444' : tl.status === 'Accepted' ? '#10B981' : '#2C3480',
                              marginTop: '4px'
                            }}
                          />
                          {index < (displayTimeline.length - 1) && (
                            <div style={{ width: '2px', flex: 1, backgroundColor: '#e2e8f0', minHeight: '36px' }} />
                          )}
                        </div>

                      <div style={{ flex: 1, paddingBottom: '0.75rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                          <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#090d16' }}>
                            {tl.event}
                          </span>
                          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{tl.timestamp}</span>
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.2rem' }}>
                          Actor: <strong>{tl.actor || 'System'}</strong>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}

                {/* Retained Decline History (Section 4 & 5 Requirement: do not overwrite!) */}
                {booking.assignmentHistory && booking.assignmentHistory.length > 0 && (
                  <div style={{ marginTop: '0.75rem', borderTop: '1px dashed #cbd5e1', paddingTop: '0.75rem' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                      Previous Declined Drivers Log
                    </div>
                    {booking.assignmentHistory.map((hist, hIdx) => (
                      <div key={hIdx} style={{ backgroundColor: '#FEF2F2', padding: '0.5rem 0.75rem', borderRadius: '8px', fontSize: '0.75rem', color: '#991B1B', marginBottom: '0.35rem' }}>
                        Declined by <strong>{hist.driverName}</strong> at {hist.declinedAt}. Reason: {hist.declineReason}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardBody>
          </Card>
        </div>
      </div>

      {/* SECTION 11: DEDICATED TRIP EXPENSES SECTION */}
      <Card>
        <CardHeader
          title="Trip Expenses & Driver Reimbursements"
          subtitle="Toll, parking, fuel and allowance claims submitted by driver during journey"
        />
        <CardBody style={{ padding: '1.25rem' }}>
          {/* Top 5 Expense KPI Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.875rem', marginBottom: '1.25rem' }}>
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1rem' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Total Claimed</div>
              <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#090d16', marginTop: '0.25rem' }}>
                ₹{expenseMetrics.totalClaimed.toLocaleString('en-IN')}
              </div>
            </div>

            <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '12px', padding: '1rem' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#065f46', textTransform: 'uppercase' }}>Total Approved</div>
              <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#059669', marginTop: '0.25rem' }}>
                ₹{expenseMetrics.totalApproved.toLocaleString('en-IN')}
              </div>
            </div>

            <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '12px', padding: '1rem' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#92400e', textTransform: 'uppercase' }}>Pending Review</div>
              <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#d97706', marginTop: '0.25rem' }}>
                ₹{expenseMetrics.totalPending.toLocaleString('en-IN')}
              </div>
            </div>

            <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '12px', padding: '1rem' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#1e40af', textTransform: 'uppercase' }}>Paid to Driver</div>
              <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#2563eb', marginTop: '0.25rem' }}>
                ₹{expenseMetrics.totalPaid.toLocaleString('en-IN')}
              </div>
            </div>

            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '12px', padding: '1rem' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#991b1b', textTransform: 'uppercase' }}>Total Rejected</div>
              <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#dc2626', marginTop: '0.25rem' }}>
                ₹{expenseMetrics.totalRejected.toLocaleString('en-IN')}
              </div>
            </div>
          </div>

          {/* Expenses Table */}
          {bookingExpenses.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <Receipt size={32} color="#94a3b8" style={{ margin: '0 auto 0.5rem' }} />
              <div style={{ fontWeight: 700, color: '#334155' }}>No Expense Claims Filed</div>
              <div style={{ fontSize: '0.8125rem', color: '#64748b', marginTop: '0.2rem' }}>
                The driver has not logged any toll, parking or fuel expenses for this booking yet.
              </div>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1.5px solid #e2e8f0', textAlign: 'left', color: '#64748b' }}>
                    <th style={{ padding: '0.75rem 0.5rem' }}>Expense ID</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>Category</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>Driver</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>Claimed</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>Approved</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>Receipt</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>Status</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>Date</th>
                    <th style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {bookingExpenses.map((exp) => (
                    <tr key={exp.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '0.75rem 0.5rem' }}>
                        <span className="font-mono" style={{ fontWeight: 700, color: '#2C3480' }}>
                          {exp.id}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem', fontWeight: 600 }}>{exp.category}</td>
                      <td style={{ padding: '0.75rem 0.5rem' }}>{exp.driverName}</td>
                      <td style={{ padding: '0.75rem 0.5rem', fontWeight: 700 }}>₹{exp.amount.toLocaleString('en-IN')}</td>
                      <td style={{ padding: '0.75rem 0.5rem', fontWeight: 700, color: '#059669' }}>
                        {exp.approvedAmount !== undefined ? `₹${exp.approvedAmount.toLocaleString('en-IN')}` : '—'}
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem' }}>
                        {exp.receiptUrl ? (
                          <button
                            onClick={() => setViewReceiptModal(exp)}
                            style={{
                              background: '#EEF0FD',
                              color: '#2C3480',
                              border: 'none',
                              padding: '0.25rem 0.6rem',
                              borderRadius: '6px',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.25rem'
                            }}
                          >
                            <Eye size={12} /> View Bill
                          </button>
                        ) : (
                          <span style={{ color: '#94a3b8' }}>None</span>
                        )}
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem' }}>
                        {exp.status === 'Approved' && <Badge variant="success">Approved</Badge>}
                        {exp.status === 'Pending Approval' && <Badge variant="warning">Pending Approval</Badge>}
                        {exp.status === 'Rejected' && <Badge variant="danger">Rejected</Badge>}
                        {exp.status === 'Paid' && <Badge variant="info">Paid</Badge>}
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem', color: '#64748b' }}>{exp.expenseDate}</td>
                      <td style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'flex-end' }}>
                          {exp.status === 'Pending Approval' && (
                            <Button size="sm" variant="primary" onClick={() => handleOpenExpenseReview(exp)}>
                              Review Claim
                            </Button>
                          )}
                          {exp.status === 'Approved' && (
                            <Button
                              size="sm"
                              variant="outline"
                              style={{ color: '#2563EB', borderColor: '#BFDBFE' }}
                              onClick={() => {
                                setMarkPaidModal(exp);
                                setPaymentRefInput(`UPI-TXN-${Date.now().toString().slice(-5)}`);
                              }}
                            >
                              Mark as Paid
                            </Button>
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

      {/* MODAL 1: Driver Assignment & Reassignment Modal */}
      <Modal
        isOpen={isDriverModalOpen}
        onClose={() => setIsDriverModalOpen(false)}
        title="Assign Eligible Driver"
        subtitle={`Booking #${booking.bookingNumber || booking.id}`}
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsDriverModalOpen(false)}>Cancel</Button>
            <Button
              variant="primary"
              disabled={!selectedDriverId}
              onClick={handleConfirmTripAssignment}
              style={{ backgroundColor: '#2C3480' }}
            >
              Confirm Trip
            </Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ fontSize: '0.8125rem', color: '#475569' }}>
            Only showing drivers who are approved, active, and available for this schedule:
          </div>

          {eligibleDrivers.length === 0 ? (
            <div style={{ padding: '1rem', backgroundColor: '#FEF2F2', borderRadius: '8px', color: '#991B1B', textAlign: 'center' }}>
              No available drivers.
            </div>
          ) : (
            eligibleDrivers.map((drv) => (
              <div
                key={drv.id}
                onClick={() => setSelectedDriverId(drv.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.75rem 1rem',
                  borderRadius: '10px',
                  border: `1.5px solid ${selectedDriverId === drv.id ? '#2C3480' : '#e2e8f0'}`,
                  backgroundColor: selectedDriverId === drv.id ? '#EEF0FD' : '#ffffff',
                  cursor: 'pointer'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <img
                    src={drv.photo || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80'}
                    alt={drv.name}
                    style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }}
                  />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.875rem' }}>{drv.name}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{drv.phone} • {drv.experience}</div>
                  </div>
                </div>
                <Badge variant="success" size="sm">Available</Badge>
              </div>
            ))
          )}
        </div>
      </Modal>

      {/* MODAL 2: Expense Review (Approve with Amount Adjustment OR Reject with Reason) */}
      <Modal
        isOpen={!!reviewExpenseModal}
        onClose={() => setReviewExpenseModal(null)}
        title="Review Driver Expense Claim"
        subtitle={`Claim #${reviewExpenseModal?.id} — ${reviewExpenseModal?.category}`}
        size="lg"
        footer={
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
            <Button variant="danger" onClick={handleRejectExpense}>
              Reject Claim
            </Button>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <Button variant="ghost" onClick={() => setReviewExpenseModal(null)}>Cancel</Button>
              <Button variant="primary" onClick={handleApproveExpense} style={{ backgroundColor: '#10B981' }}>
                Approve Expense
              </Button>
            </div>
          </div>
        }
      >
        {reviewExpenseModal && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Receipt Preview */}
            {reviewExpenseModal.receiptUrl && (
              <div style={{ textAlign: 'center', padding: '0.75rem', backgroundColor: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <img
                  src={reviewExpenseModal.receiptUrl}
                  alt="Receipt"
                  style={{ maxHeight: '200px', maxWidth: '100%', objectFit: 'contain', borderRadius: '6px' }}
                />
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
                  {reviewExpenseModal.receiptFileName || 'Receipt Attachment'}
                </div>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                  Claimed Amount
                </label>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#090d16', marginTop: '0.2rem' }}>
                  ₹{reviewExpenseModal.amount.toLocaleString('en-IN')}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#2C3480', textTransform: 'uppercase' }}>
                  Approved Amount (₹) *
                </label>
                <Input
                  type="number"
                  value={approvedAmountInput}
                  onChange={(e) => setApprovedAmountInput(e.target.value)}
                  style={{ marginTop: '0.2rem' }}
                />
              </div>
            </div>

            {parseFloat(approvedAmountInput) !== reviewExpenseModal.amount && (
              <div style={{ backgroundColor: '#FFFBEB', border: '1px solid #FDE68A', padding: '0.5rem 0.75rem', borderRadius: '8px', fontSize: '0.75rem', color: '#92400E' }}>
                ⚠️ <strong>Amount Adjusted:</strong> Difference is ₹{Math.abs(parseFloat(approvedAmountInput) - reviewExpenseModal.amount)}. You must provide an explanation in Admin Remarks below.
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#334155', marginBottom: '0.25rem' }}>
                Admin Remarks (Sent to Driver upon approval)
              </label>
              <Input
                placeholder="e.g. Approved per toll plaza slip deduction"
                value={adminRemarksInput}
                onChange={(e) => setAdminRemarksInput(e.target.value)}
              />
            </div>

            <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '0.75rem' }}>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#dc2626', marginBottom: '0.25rem' }}>
                Rejection Reason (Required ONLY if rejecting claim)
              </label>
              <Input
                placeholder="e.g. Receipt unreadable or already claimed via Fastag"
                value={rejectionReasonInput}
                onChange={(e) => setRejectionReasonInput(e.target.value)}
              />
            </div>
          </div>
        )}
      </Modal>

      {/* MODAL 3: Mark Expense as Paid */}
      <Modal
        isOpen={!!markPaidModal}
        onClose={() => setMarkPaidModal(null)}
        title="Mark Expense as Settled / Paid"
        subtitle={`Claim #${markPaidModal?.id} — ₹${markPaidModal?.approvedAmount || markPaidModal?.amount}`}
        footer={
          <>
            <Button variant="ghost" onClick={() => setMarkPaidModal(null)}>Cancel</Button>
            <Button variant="primary" onClick={handleConfirmMarkPaid} style={{ backgroundColor: '#2C3480' }}>
              Confirm Settlement
            </Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#334155', marginBottom: '0.25rem' }}>
              Bank UPI / Transaction Reference *
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
              Payment Settlement Date *
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

      {/* MODAL 4: View Receipt Full Screen */}
      <Modal
        isOpen={!!viewReceiptModal}
        onClose={() => setViewReceiptModal(null)}
        title={`Receipt Slip — ${viewReceiptModal?.id}`}
        subtitle={`${viewReceiptModal?.category} — ₹${viewReceiptModal?.amount}`}
        footer={<Button variant="ghost" onClick={() => setViewReceiptModal(null)}>Close</Button>}
      >
        {viewReceiptModal && (
          <div style={{ textAlign: 'center' }}>
            <img
              src={viewReceiptModal.receiptUrl}
              alt="Receipt Preview"
              style={{ maxHeight: '450px', maxWidth: '100%', objectFit: 'contain', borderRadius: '8px' }}
            />
            <div style={{ marginTop: '0.75rem', fontSize: '0.8125rem', color: '#64748b' }}>
              {viewReceiptModal.description}
            </div>
          </div>
        )}
      </Modal>

      {/* MODAL 5: Assign Car & Driver with Structured Dropdowns & MAK-Owned Priority */}
      <AssignCarDriverModal
        isOpen={isAssignDispatchOpen}
        onClose={() => setIsAssignDispatchOpen(false)}
        booking={booking}
        onSuccess={async () => {
          if (id) {
            try {
              const res = await bookingService.getById(id);
              if (res?.data) setRemoteBooking(res.data);
            } catch (err) {
              console.warn('Re-fetch booking after assign deferred:', err);
            }
          }
        }}
      />

      {/* MODAL 6: Admin Start Trip Modal */}
      <Modal
        isOpen={isStartTripModalOpen}
        onClose={() => setIsStartTripModalOpen(false)}
        title="Start Trip (Record Starting Odometer)"
        subtitle={`Booking #${booking.bookingNumber || booking.id} — Driver: ${booking.driverName || 'Driver'}`}
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsStartTripModalOpen(false)}>Cancel</Button>
            <Button
              variant="primary"
              onClick={handleAdminStartTrip}
              style={{ backgroundColor: '#2C3480', fontWeight: 700 }}
            >
              Confirm Trip Start
            </Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
              Vehicle Starting Odometer Reading (KM) *
            </label>
            <Input
              type="number"
              value={startOdoInput}
              onChange={(e) => setStartOdoInput(e.target.value)}
              placeholder={`Current vehicle meter: ${activeVehicle?.odometerKm || 64120} km`}
              required
            />
            <span style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem', display: 'block' }}>
              Minimum allowed: {activeVehicle?.odometerKm || 0} km (Vehicle current odometer)
            </span>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
              Trip Departure Remarks / Inspection Notes
            </label>
            <Input
              value={startTripRemarks}
              onChange={(e) => setStartTripRemarks(e.target.value)}
              placeholder="e.g. AC verified, passengers boarded, luggage secured"
            />
          </div>
        </div>
      </Modal>

      {/* MODAL 7: Admin Complete Trip Modal */}
      <Modal
        isOpen={isCompleteTripModalOpen}
        onClose={() => setIsCompleteTripModalOpen(false)}
        title="Complete Trip & Record Final Telematics"
        subtitle={`Booking #${booking.bookingNumber || booking.id} — Starting Meter: ${booking.startOdometer || 0} km`}
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsCompleteTripModalOpen(false)}>Cancel</Button>
            <Button
              variant="primary"
              onClick={handleAdminCompleteTrip}
              style={{ backgroundColor: '#10b981', fontWeight: 700 }}
            >
              Finalize Trip &amp; Generate Invoice
            </Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
              Ending Odometer Reading (KM) *
            </label>
            <Input
              type="number"
              value={endOdoInput}
              onChange={(e) => setEndOdoInput(e.target.value)}
              placeholder="e.g. 64280"
              required
            />
            <span style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem', display: 'block' }}>
              Must be greater than starting reading ({booking.startOdometer || 0} km). Calculated distance: {Number(endOdoInput) > Number(booking.startOdometer || 0) ? Number(endOdoInput) - Number(booking.startOdometer || 0) : 0} km
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                Toll Plaza Cash Incurred (₹)
              </label>
              <Input
                type="number"
                value={tollAmountInput}
                onChange={(e) => setTollAmountInput(e.target.value)}
                placeholder="0"
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                Fuel / Enroute Cash Reimbursement (₹)
              </label>
              <Input
                type="number"
                value={fuelAmountInput}
                onChange={(e) => setFuelAmountInput(e.target.value)}
                placeholder="0"
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
              Trip Completion Remarks
            </label>
            <Input
              value={completeTripRemarks}
              onChange={(e) => setCompleteTripRemarks(e.target.value)}
              placeholder="Trip concluded smoothly. Passenger dropped safely."
            />
          </div>
        </div>
      </Modal>

      {/* MODAL 8: Full 15-Point Commercial Financial Invoice Modal */}
      <Modal
        isOpen={isInvoiceModalOpen}
        onClose={() => setIsInvoiceModalOpen(false)}
        title="Commercial Trip Invoice & Audit Breakdown"
        subtitle={`Invoice #${invoiceData?.invoiceNumber} — Booking Ref: ${invoiceData?.bookingId}`}
        footer={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <Badge variant={invoiceData?.status === 'Paid' ? 'success' : 'warning'} size="md">
              Payment Status: {invoiceData?.status}
            </Badge>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <Button variant="ghost" onClick={() => setIsInvoiceModalOpen(false)}>Close</Button>
              <Button
                variant="primary"
                onClick={handleDownloadInvoicePdf}
                disabled={isDownloadingPdf}
                style={{ backgroundColor: '#2C3480', fontWeight: 700 }}
              >
                <Download size={15} style={{ marginRight: '0.35rem' }} /> {isDownloadingPdf ? 'Generating PDF...' : 'Download Invoice (PDF)'}
              </Button>
              <Button variant="outline" onClick={() => window.print()} style={{ fontWeight: 600 }}>
                <Printer size={15} style={{ marginRight: '0.35rem' }} /> Print / Export Slip
              </Button>
            </div>
          </div>
        }
      >
        {invoiceData && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxHeight: '70vh', overflowY: 'auto', paddingRight: '0.25rem' }}>
            {/* Header info card */}
            <div style={{ padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#2C3480' }}>
                  MAK Tours &amp; Travels India Pvt. Ltd.
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.15rem' }}>
                  Official Commercial Fleet Trip Manifest &amp; Billing Statement
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Date of Issue</div>
                <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{formatDateDMY(new Date())}</div>
              </div>
            </div>

            {/* 15-Point Detailed Grid */}
            <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
                <tbody>
                  {/* Point 1: Booking ID */}
                  <tr style={{ borderBottom: '1px solid #f1f5f9', backgroundColor: '#ffffff' }}>
                    <td style={{ padding: '0.65rem 1rem', color: '#64748b', width: '45%' }}>1. Booking ID / Manifest Ref</td>
                    <td style={{ padding: '0.65rem 1rem', fontWeight: 800, color: '#2C3480', fontFamily: 'monospace' }}>
                      {invoiceData.bookingId}
                    </td>
                  </tr>

                  {/* Point 2: Customer Info */}
                  <tr style={{ borderBottom: '1px solid #f1f5f9', backgroundColor: '#f8fafc' }}>
                    <td style={{ padding: '0.65rem 1rem', color: '#64748b' }}>2. Customer Name &amp; Phone</td>
                    <td style={{ padding: '0.65rem 1rem', fontWeight: 700, color: '#090d16' }}>
                      {invoiceData.customerName} ({invoiceData.customerPhone})
                    </td>
                  </tr>

                  {/* Point 3: Assigned Vehicle */}
                  <tr style={{ borderBottom: '1px solid #f1f5f9', backgroundColor: '#ffffff' }}>
                    <td style={{ padding: '0.65rem 1rem', color: '#64748b' }}>3. Assigned Commercial Fleet Vehicle</td>
                    <td style={{ padding: '0.65rem 1rem', fontWeight: 700, color: '#090d16' }}>
                      {invoiceData.vehicleModel}
                    </td>
                  </tr>

                  {/* Point 4: Vehicle Reg No */}
                  <tr style={{ borderBottom: '1px solid #f1f5f9', backgroundColor: '#f8fafc' }}>
                    <td style={{ padding: '0.65rem 1rem', color: '#64748b' }}>4. Vehicle Registration Plate</td>
                    <td style={{ padding: '0.65rem 1rem', fontWeight: 800, fontFamily: 'monospace', color: '#2C3480' }}>
                      {invoiceData.vehicleRegNo}
                    </td>
                  </tr>

                  {/* Point 5: Assigned Driver */}
                  <tr style={{ borderBottom: '1px solid #f1f5f9', backgroundColor: '#ffffff' }}>
                    <td style={{ padding: '0.65rem 1rem', color: '#64748b' }}>5. Designated Driver &amp; ID</td>
                    <td style={{ padding: '0.65rem 1rem', fontWeight: 700, color: '#090d16' }}>
                      {invoiceData.driverName} ({invoiceData.driverId})
                    </td>
                  </tr>

                  {/* Point 6: Start Odometer */}
                  <tr style={{ borderBottom: '1px solid #f1f5f9', backgroundColor: '#f8fafc' }}>
                    <td style={{ padding: '0.65rem 1rem', color: '#64748b' }}>6. Starting Odometer Reading</td>
                    <td style={{ padding: '0.65rem 1rem', fontWeight: 700 }}>
                      {invoiceData.startOdometer} km
                    </td>
                  </tr>

                  {/* Point 7: End Odometer */}
                  <tr style={{ borderBottom: '1px solid #f1f5f9', backgroundColor: '#ffffff' }}>
                    <td style={{ padding: '0.65rem 1rem', color: '#64748b' }}>7. Ending Odometer Reading</td>
                    <td style={{ padding: '0.65rem 1rem', fontWeight: 700 }}>
                      {invoiceData.endOdometer ? `${invoiceData.endOdometer} km` : 'In Progress (Pending Final)'}
                    </td>
                  </tr>

                  {/* Point 8: Total Kilometers */}
                  <tr style={{ borderBottom: '1px solid #f1f5f9', backgroundColor: '#f8fafc' }}>
                    <td style={{ padding: '0.65rem 1rem', color: '#64748b' }}>8. Total Distance Travelled</td>
                    <td style={{ padding: '0.65rem 1rem', fontWeight: 800, color: '#059669' }}>
                      {invoiceData.distanceTravelled} km
                    </td>
                  </tr>

                  {/* Point 9: Vehicle Rate Per Km */}
                  <tr style={{ borderBottom: '1px solid #f1f5f9', backgroundColor: '#ffffff' }}>
                    <td style={{ padding: '0.65rem 1rem', color: '#64748b' }}>9. Vehicle Rate Per Kilometer</td>
                    <td style={{ padding: '0.65rem 1rem', fontWeight: 700, color: '#2563eb' }}>
                      ₹{invoiceData.ratePerKm} / km
                    </td>
                  </tr>

                  {/* Point 10: Vehicle Trip Charge */}
                  <tr style={{ borderBottom: '1px solid #f1f5f9', backgroundColor: '#f8fafc' }}>
                    <td style={{ padding: '0.65rem 1rem', color: '#64748b' }}>10. Calculated Vehicle Trip Charge (Km × Rate)</td>
                    <td style={{ padding: '0.65rem 1rem', fontWeight: 800, color: '#d97706' }}>
                      ₹{invoiceData.vehicleTripCharge.toLocaleString('en-IN')}
                    </td>
                  </tr>

                  {/* Point 11: Driver Allowance */}
                  <tr style={{ borderBottom: '1px solid #f1f5f9', backgroundColor: '#ffffff' }}>
                    <td style={{ padding: '0.65rem 1rem', color: '#64748b' }}>11. Driver Allowance / Daily Bata</td>
                    <td style={{ padding: '0.65rem 1rem', fontWeight: 700 }}>
                      ₹{invoiceData.driverAllowance.toLocaleString('en-IN')}
                    </td>
                  </tr>

                  {/* Point 12: Toll Expenses */}
                  <tr style={{ borderBottom: '1px solid #f1f5f9', backgroundColor: '#f8fafc' }}>
                    <td style={{ padding: '0.65rem 1rem', color: '#64748b' }}>12. Approved Toll &amp; Parking Charges</td>
                    <td style={{ padding: '0.65rem 1rem', fontWeight: 700 }}>
                      ₹{invoiceData.tollExpenses.toLocaleString('en-IN')}
                    </td>
                  </tr>

                  {/* Point 13: Fuel Reimbursements */}
                  <tr style={{ borderBottom: '1px solid #f1f5f9', backgroundColor: '#ffffff' }}>
                    <td style={{ padding: '0.65rem 1rem', color: '#64748b' }}>13. Fuel Reimbursements</td>
                    <td style={{ padding: '0.65rem 1rem', fontWeight: 700 }}>
                      ₹{invoiceData.fuelReimbursements.toLocaleString('en-IN')}
                    </td>
                  </tr>

                  {/* Point 14: Base Package / Agreed Fare */}
                  <tr style={{ borderBottom: '1.5px solid #cbd5e1', backgroundColor: '#f8fafc' }}>
                    <td style={{ padding: '0.65rem 1rem', color: '#090d16', fontWeight: 700 }}>14. Agreed Booking Package Fare</td>
                    <td style={{ padding: '0.65rem 1rem', fontWeight: 800, fontSize: '0.9375rem', color: '#2C3480' }}>
                      ₹{invoiceData.baseFare.toLocaleString('en-IN')}
                    </td>
                  </tr>

                  {/* Point 15: Financial Settlement Breakdown */}
                  <tr style={{ backgroundColor: '#eff6ff' }}>
                    <td style={{ padding: '0.75rem 1rem', fontWeight: 700, color: '#1e40af' }}>
                      15. Financial Settlement Breakdown:
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                          <span>Online Advance Paid:</span>
                          <strong style={{ color: '#059669' }}>- ₹{invoiceData.advancePaid.toLocaleString('en-IN')}</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', borderTop: '1px solid #bfdbfe', paddingTop: '0.25rem' }}>
                          <span style={{ fontWeight: 800, color: '#dc2626' }}>Balance Due on Drop:</span>
                          <strong style={{ fontWeight: 800, color: '#dc2626' }}>₹{invoiceData.balanceDue.toLocaleString('en-IN')}</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9375rem', borderTop: '1px solid #bfdbfe', paddingTop: '0.25rem' }}>
                          <span style={{ fontWeight: 800, color: '#1e40af' }}>Grand Total Package:</span>
                          <strong style={{ fontWeight: 800, color: '#1e40af' }}>₹{invoiceData.grandTotal.toLocaleString('en-IN')}</strong>
                        </div>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div style={{ fontSize: '0.75rem', color: '#64748b', fontStyle: 'italic', textAlign: 'center' }}>
              Note: Commercial customer invoice reflects the agreed tour package base fare without duplicate charges. Fleet operational distance &amp; per-km telematics are verified for auditing.
            </div>
          </div>
        )}
      </Modal>

      {/* Cancel Booking Confirmation Modal */}
      <Modal
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        title={`Cancel Booking #${booking.bookingNumber || booking.id}?`}
        subtitle="This will immediately release any assigned driver and fleet vehicle, and update the ledger."
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsCancelModalOpen(false)}>
              Dismiss
            </Button>
            <Button
              variant="danger"
              onClick={async () => {
                if (cancelBooking) {
                  const targetCancelId = booking.id || booking.bookingNumber || booking.refId;
                  const success = await cancelBooking(targetCancelId, cancelReason);
                  if (success) {
                    setRemoteBooking((prev) => ({
                      ...(prev || booking),
                      bookingStatus: 'Cancelled',
                      status: 'Cancelled',
                      tripStatus: 'Cancelled',
                      driverAssignmentStatus: 'Cancelled',
                      cancelReason
                    }));
                    setIsCancelModalOpen(false);
                  }
                }
              }}
            >
              Confirm Cancellation
            </Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          <div style={{ backgroundColor: '#fff7ed', border: '1px solid #fed7aa', padding: '0.875rem 1rem', borderRadius: '10px', fontSize: '0.8125rem', color: '#9a3412' }}>
            <strong>Warning:</strong> Cancelling this booking will free up <strong>{activeVehicle?.model || activeVehicle?.name || 'the vehicle'}</strong> ({activeVehicle?.regNo || 'Fleet'}) and driver <strong>{activeDriver?.name || 'assigned driver'}</strong> back to available duty.
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-main, #090d16)', marginBottom: '0.35rem' }}>
              Cancellation Reason:
            </label>
            <select
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              style={{
                padding: '0.625rem 0.75rem',
                borderRadius: '8px',
                border: '1px solid var(--border-medium, #cbd5e1)',
                fontSize: '0.8125rem',
                width: '100%',
                backgroundColor: '#ffffff'
              }}
            >
              <option value="Client requested cancellation">Client requested cancellation</option>
              <option value="Customer Change of Plans">Customer Change of Plans</option>
              <option value="Vehicle Mechanical Breakdown">Vehicle Mechanical Breakdown</option>
              <option value="Driver Unavailability">Driver Unavailability</option>
              <option value="Flight / Train Cancelled">Flight / Train Cancelled</option>
              <option value="Severe Weather / Ghat Road Block">Severe Weather / Ghat Road Block</option>
              <option value="Payment Verification Failed">Payment Verification Failed</option>
            </select>
          </div>
        </div>
      </Modal>

      {/* Collect Balance Payment Modal */}
      {isCollectPaymentOpen && (
        <CollectPaymentModal
          isOpen={isCollectPaymentOpen}
          onClose={() => setIsCollectPaymentOpen(false)}
          booking={booking}
          onSuccess={(res) => {
            setRemoteBooking((prev) => {
              if (!prev) return prev;
              const newAdv = (prev.amountPaid || prev.advancePaid || 0) + res.amount;
              const newBal = Math.max(0, (prev.totalAmount || 0) - newAdv);
              return {
                ...prev,
                advancePaid: newAdv,
                amountPaid: newAdv,
                balanceAmount: newBal,
                balanceDue: newBal,
                paymentStatus: newBal === 0 ? 'Paid' : 'Partially Paid'
              };
            });
          }}
        />
      )}
    </div>
  );
}

export default BookingDetails;
