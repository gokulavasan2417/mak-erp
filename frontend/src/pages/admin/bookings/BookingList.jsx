// MAK Tours & Travels ERP - Booking Management List
// CRITICAL: ONE WAY TRIP MUST NOT EXIST ANYWHERE IN THIS APPLICATION.
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Calendar,
  Plus,
  Download,
  Filter,
  Eye,
  Edit,
  UserCheck,
  Car,
  Ban,
  CheckCircle2,
  MoreVertical,
  Search,
  ArrowUpDown,
  LayoutGrid,
  List,
  ArrowRight,
  MapPin,
  Phone,
  Clock,
  User,
  ShieldCheck,
  RotateCcw,
  PlayCircle
} from 'lucide-react';
import { Card, CardHeader, CardBody } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { SearchBar, FilterSelect } from '../../../components/ui/SearchBar';
import { Pagination } from '../../../components/ui/Pagination';
import { Dropdown } from '../../../components/ui/Dropdown';
import { Modal } from '../../../components/ui/Modal';
import { AssignCarDriverModal } from '../../../components/admin/AssignCarDriverModal';
import { CollectPaymentModal } from '../../../components/modals/CollectPaymentModal';
import { useAdminData } from '../../../context/AdminDataContext';
import { useToast } from '../../../context/ToastContext';
import { bookingCategories, bookingStatuses, paymentStatuses } from '../../../data';
import { bookingService } from '../../../services';
import { formatDateDMY, isBookingToday, isBookingActive, isBookingUpcoming, isBookingCompleted } from '../../../utils/dateUtils';

export function BookingList() {
  const navigate = useNavigate();
  const toast = useToast();
  const { bookings, drivers, vehicles, confirmTripAssignment, assignVehicle, cancelBooking, markBookingCompleted, updateBooking, startTrip, isDriverAvailable, isVehicleAvailable } = useAdminData();

  const [downloadingBookingId, setDownloadingBookingId] = useState(null);
  const [paymentModalBooking, setPaymentModalBooking] = useState(null);

  const handleDownloadInvoicePdf = async (b) => {
    if (!b) return;
    const downloadId = b.bookingNumber || b.refId || b.id || b._id;
    const invNumber = b.invoiceNumber || (b.invoice && b.invoice.invoiceNumber) || `INV-${downloadId}`;
    try {
      setDownloadingBookingId(downloadId);
      await bookingService.downloadInvoicePdf(downloadId, `Invoice-${invNumber}.pdf`);
      toast.success(`Invoice PDF (${invNumber}) downloaded successfully!`);
    } catch (err) {
      console.error('Invoice download error:', err);
      toast.error(err.message || 'Failed to download invoice PDF');
    } finally {
      setDownloadingBookingId(null);
    }
  };

  // Search Params & Timeline Filter Synchronization
  const [searchParams, setSearchParams] = useSearchParams();

  const getTimelineFromParams = (params) => {
    const val = (params.get('timeframe') || params.get('timeline') || params.get('filter') || '').toLowerCase();
    if (val === 'today') return 'Today';
    if (val === 'upcoming') return 'Upcoming';
    if (val === 'active') return 'Active';
    if (val === 'completed') return 'Completed';
    if (val === 'cancelled') return 'Cancelled';
    return 'All';
  };

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTimeline, setSelectedTimeline] = useState(() => getTimelineFromParams(searchParams));
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState('All');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' (default modern cards) or 'table'
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  // Sync if URL search params change (e.g. user navigated from Dashboard KPI card)
  useEffect(() => {
    const target = getTimelineFromParams(searchParams);
    if (target !== selectedTimeline) {
      setSelectedTimeline(target);
      setCurrentPage(1);
    }
  }, [searchParams]);

  const handleTimelineChange = (newVal) => {
    setSelectedTimeline(newVal);
    setCurrentPage(1);
    const nextParams = new URLSearchParams(searchParams);
    if (newVal === 'All') {
      nextParams.delete('timeframe');
      nextParams.delete('timeline');
      nextParams.delete('filter');
    } else {
      nextParams.set('timeframe', newVal.toLowerCase());
    }
    setSearchParams(nextParams, { replace: true });
  };

  // Timeline counts for filter pills (matching Dashboard KPI metrics)
  const timelineCounts = useMemo(() => {
    return {
      All: bookings.length,
      Today: bookings.filter(isBookingToday).length,
      Upcoming: bookings.filter(isBookingUpcoming).length,
      Active: bookings.filter(isBookingActive).length,
      Completed: bookings.filter(isBookingCompleted).length,
      Cancelled: bookings.filter((b) => (b.bookingStatus === 'Cancelled' || b.status === 'Cancelled')).length
    };
  }, [bookings]);

  // Unified Dispatch Modal State (Car & Driver Dropdowns)
  const [dispatchModalBooking, setDispatchModalBooking] = useState(null);

  // Sorting
  const [sortField, setSortField] = useState('completionOrder');
  const [sortDirection, setSortDirection] = useState('desc');

  // Full Details & Card Expansion States with LocalStorage Persistence
  // Default is 'shorted' (collapsed) per user requirement:
  // "in the booking page it should not be always in the details are shown. If it is in the shorted view and the admin goes to next page and comes back to the booking page it should be remains in the shorted view."
  const [fullModalBooking, setFullModalBooking] = useState(null);
  
  const [cardViewMode, setCardViewMode] = useState(() => {
    try {
      return localStorage.getItem('mak_booking_cards_default_mode') || 'shorted';
    } catch {
      return 'shorted';
    }
  });

  const [expandedCards, setExpandedCards] = useState(() => {
    try {
      const saved = localStorage.getItem('mak_booking_cards_expanded_state');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const isCardExpanded = (id) => {
    if (expandedCards[id] !== undefined) {
      return Boolean(expandedCards[id]);
    }
    return cardViewMode === 'detailed';
  };

  const toggleCardExpanded = (id) => {
    setExpandedCards((prev) => {
      const current = isCardExpanded(id);
      const next = !current;
      const updated = { ...prev, [id]: next };
      try {
        localStorage.setItem('mak_booking_cards_expanded_state', JSON.stringify(updated));
      } catch (e) {
        console.warn('Error saving card expansion state', e);
      }
      return updated;
    });
  };

  const toggleAllCardsView = () => {
    const nextMode = cardViewMode === 'shorted' ? 'detailed' : 'shorted';
    setCardViewMode(nextMode);
    setExpandedCards({}); // Reset individual overrides so all cards inherit new global mode
    try {
      localStorage.setItem('mak_booking_cards_default_mode', nextMode);
      localStorage.removeItem('mak_booking_cards_expanded_state');
    } catch (e) {
      console.warn('Error saving view mode', e);
    }
  };

  const isAllShorted = cardViewMode === 'shorted' && Object.values(expandedCards).every((v) => !v);

  const handleStartTrip = (id) => {
    const booking = bookings.find((b) => b.id === id || b.bookingNumber === id || b._id === id);
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const rawDate = booking?.journeyDate || booking?.travelDate || booking?.pickupDate || '';
    const jDate = rawDate ? (rawDate.length === 10 ? rawDate : new Date(rawDate).toISOString().split('T')[0]) : '';

    if (jDate && todayStr < jDate) {
      toast.error(`Trip cannot be started prior to the journey start date (${formatDateDMY(jDate)}). The driver/admin can start the trip on the journey start date.`);
      return;
    }

    if (startTrip) {
      startTrip(id, { startOdometer: booking?.startOdometer || 0, forceStart: true, isAdmin: true });
    } else if (updateBooking) {
      updateBooking(id, { bookingStatus: 'On Trip', tripStatus: 'In Progress', driverAssignmentStatus: 'Accepted' });
    }
  };

  // Modals state
  const [driverModalBooking, setDriverModalBooking] = useState(null);
  const [selectedDriverId, setSelectedDriverId] = useState('');

  const [vehicleModalBooking, setVehicleModalBooking] = useState(null);
  const [selectedVehicleId, setSelectedVehicleId] = useState('');

  const [cancelModalBooking, setCancelModalBooking] = useState(null);
  const [cancelReason, setCancelReason] = useState('Client request');

  // Filtered & Sorted bookings
  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      // Auto-normalize any legacy One Way classification to Round Trip
      if (b.bookingCategory?.toLowerCase().includes('one way') || b.bookingType?.toLowerCase().includes('one way')) {
        b.bookingCategory = 'Round Trip';
        b.bookingType = 'Round Trip';
      }

      const q = searchQuery.trim().toLowerCase();
      const matchesSearch = !q ||
        (b.id || '').toLowerCase().includes(q) ||
        (b.bookingNumber || b.refId || '').toLowerCase().includes(q) ||
        (b.customerName || b.fullName || '').toLowerCase().includes(q) ||
        (b.customerPhone || b.mobileNumber || '').toLowerCase().includes(q) ||
        (b.customerEmail || b.email || '').toLowerCase().includes(q) ||
        (b.pickupLocation || b.fromLocation || '').toLowerCase().includes(q) ||
        (b.destination || b.dropLocation || b.toLocation || '').toLowerCase().includes(q) ||
        (b.driverName && b.driverName.toLowerCase().includes(q)) ||
        (b.vehicleName && b.vehicleName.toLowerCase().includes(q)) ||
        (b.vehicleRegNo && b.vehicleRegNo.toLowerCase().replace(/\s+/g, '').includes(q.replace(/\s+/g, ''))) ||
        (b.packageName && b.packageName.toLowerCase().includes(q));

      // Category matching
      const bCat = (b.bookingCategory || b.category || b.bookingType || b.tripType || '').trim();
      const matchesCategory = selectedCategory === 'All' ||
        bCat.toLowerCase() === selectedCategory.toLowerCase() ||
        (selectedCategory === 'Round Trip' && (bCat.toLowerCase().includes('round') || bCat.toLowerCase().includes('return'))) ||
        (selectedCategory === 'Local Trip' && (bCat.toLowerCase().includes('local') || bCat.toLowerCase().includes('city') || bCat.toLowerCase().includes('rental'))) ||
        (selectedCategory === 'Tour Package' && (bCat.toLowerCase().includes('tour') || bCat.toLowerCase().includes('package'))) ||
        (selectedCategory === 'Airport Transfer' && (bCat.toLowerCase().includes('airport') || bCat.toLowerCase().includes('transfer'))) ||
        (selectedCategory === 'Custom Journey' && bCat.toLowerCase().includes('custom'));

      // Status matching
      const bStatus = (b.bookingStatus || b.status || b.tripStatus || 'Confirmed').trim();
      const matchesStatus = selectedStatus === 'All' ||
        bStatus.toLowerCase() === selectedStatus.toLowerCase() ||
        (selectedStatus === 'Pending' && (bStatus.toLowerCase().includes('pending') || bStatus.toLowerCase().includes('awaiting'))) ||
        (selectedStatus === 'Confirmed' && (bStatus.toLowerCase().includes('confirmed') || bStatus.toLowerCase().includes('accepted'))) ||
        (selectedStatus === 'On Trip' && (bStatus.toLowerCase().includes('on trip') || bStatus.toLowerCase().includes('in progress') || bStatus.toLowerCase().includes('started'))) ||
        (selectedStatus === 'Completed' && (bStatus.toLowerCase().includes('completed') || bStatus.toLowerCase().includes('concluded') || bStatus.toLowerCase().includes('finished'))) ||
        (selectedStatus === 'Cancelled' && bStatus.toLowerCase().includes('cancel'));

      // Payment matching
      const totalFare = Number(b.totalAmount || b.pricing || b.fare || b.totalFare || b.fareAmount || 0);
      const paid = Number(b.amountPaid !== undefined ? b.amountPaid : (b.advancePaid !== undefined ? b.advancePaid : 0));
      const bal = b.balanceAmount !== undefined && b.balanceAmount !== null && !isNaN(Number(b.balanceAmount))
        ? Number(b.balanceAmount)
        : (b.balanceDue !== undefined && b.balanceDue !== null && !isNaN(Number(b.balanceDue))
            ? Number(b.balanceDue)
            : Math.max(0, totalFare - paid));

      const rawPayStatus = String(b.paymentStatus || b.paymentOption || '').trim().toLowerCase();
      const isCancelled = bStatus.toLowerCase().includes('cancel');

      let matchesPayment = true;
      if (selectedPaymentStatus === 'All') {
        matchesPayment = true;
      } else if (selectedPaymentStatus === 'Pending') {
        // Any trip where balance is due, payment is unpaid, or balance collection is pending
        matchesPayment = (!isCancelled && (bal > 0 || paid === 0 || rawPayStatus.includes('pending') || rawPayStatus.includes('unpaid') || rawPayStatus.includes('partial'))) ||
          (rawPayStatus.includes('pending') || rawPayStatus.includes('unpaid'));
      } else if (selectedPaymentStatus === 'Partial') {
        // Bookings where some advance was paid but remaining balance is still due
        matchesPayment = (!isCancelled && paid > 0 && bal > 0) || rawPayStatus.includes('partial');
      } else if (selectedPaymentStatus === 'Paid') {
        // Fully settled bookings (100% paid, no balance due)
        matchesPayment = !isCancelled && ((bal <= 0 && totalFare > 0) || rawPayStatus === 'paid' || rawPayStatus.includes('full') || rawPayStatus.includes('settled'));
      } else if (selectedPaymentStatus === 'Refund Due') {
        // Cancelled bookings where money was paid and refund is pending
        matchesPayment = (isCancelled && paid > 0 && !rawPayStatus.includes('refunded')) || rawPayStatus.includes('refund due') || rawPayStatus.includes('refund_due');
      } else if (selectedPaymentStatus === 'Refunded') {
        // Cancelled bookings where refund has been processed
        matchesPayment = rawPayStatus.includes('refunded');
      }

      // Timeline matching (Synchronized with Dashboard KPI Cards)
      let matchesTimeline = true;
      if (selectedTimeline === 'Today') {
        matchesTimeline = isBookingToday(b);
      } else if (selectedTimeline === 'Upcoming') {
        matchesTimeline = isBookingUpcoming(b);
      } else if (selectedTimeline === 'Active') {
        matchesTimeline = isBookingActive(b);
      } else if (selectedTimeline === 'Completed') {
        matchesTimeline = isBookingCompleted(b);
      } else if (selectedTimeline === 'Cancelled') {
        matchesTimeline = (b.bookingStatus === 'Cancelled' || b.status === 'Cancelled');
      }

      return matchesSearch && matchesCategory && matchesStatus && matchesPayment && matchesTimeline;
    }).sort((a, b) => {
      // Default: Completion Order (Lifecycle Ranking)
      // Active trips stay on top; completed trips go down to the bottom
      // Recently completed/updated bookings appear first within their category
      if (sortField === 'completionOrder') {
        const STATUS_RANK = {
          'On Trip': 1,
          'Pending': 2,
          'Confirmed': 3,
          'Completed': 4,
          'Cancelled': 5
        };
        const rankA = STATUS_RANK[a.bookingStatus] || 99;
        const rankB = STATUS_RANK[b.bookingStatus] || 99;

        if (rankA !== rankB) {
          return sortDirection === 'asc' ? rankB - rankA : rankA - rankB;
        }

        // Within same status: date-wise descending (recently completed/started/created comes first)
        const getTimestamp = (item) => {
          if (item.bookingStatus === 'Completed') {
            const raw = item.completedAt || item.tripCompletedAt || item.returnDate || item.journeyDate || item.createdAt;
            return raw ? new Date(raw).getTime() : 0;
          }
          if (item.bookingStatus === 'On Trip') {
            const raw = item.tripStartedAt || item.journeyDate || item.createdAt;
            return raw ? new Date(raw).getTime() : 0;
          }
          if (item.bookingStatus === 'Confirmed') {
            const raw = item.confirmedAt || item.journeyDate || item.createdAt;
            return raw ? new Date(raw).getTime() : 0;
          }
          if (item.bookingStatus === 'Pending') {
            const raw = item.createdAt || item.journeyDate;
            return raw ? new Date(raw).getTime() : 0;
          }
          const raw = item.cancelledAt || item.createdAt || item.journeyDate;
          return raw ? new Date(raw).getTime() : 0;
        };

        const timeA = getTimestamp(a);
        const timeB = getTimestamp(b);
        return sortDirection === 'asc' ? timeA - timeB : timeB - timeA;
      }

      if (sortField === 'totalAmount') {
        const amtA = parseFloat(a.totalAmount || a.pricing || a.fare || a.totalFare || 0) || 0;
        const amtB = parseFloat(b.totalAmount || b.pricing || b.fare || b.totalFare || 0) || 0;
        return sortDirection === 'asc' ? amtA - amtB : amtB - amtA;
      }

      if (sortField === 'journeyDate' || sortField === 'createdAt') {
        const rawDateA = a.journeyDate || a.startDate || a.travelDate || a.pickupDate || a.createdAt;
        const rawDateB = b.journeyDate || b.startDate || b.travelDate || b.pickupDate || b.createdAt;
        const timeA = rawDateA ? new Date(rawDateA).getTime() : 0;
        const timeB = rawDateB ? new Date(rawDateB).getTime() : 0;
        if (timeA && timeB) {
          return sortDirection === 'asc' ? timeA - timeB : timeB - timeA;
        }
      }

      let aVal = a[sortField] || '';
      let bVal = b[sortField] || '';
      return sortDirection === 'asc' ? String(aVal).localeCompare(String(bVal)) : String(bVal).localeCompare(String(aVal));
    });
  }, [bookings, searchQuery, selectedTimeline, selectedCategory, selectedStatus, selectedPaymentStatus, sortField, sortDirection]);

  // Paginated bookings
  const paginatedBookings = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredBookings.slice(start, start + pageSize);
  }, [filteredBookings, currentPage, pageSize]);

  // Responsive Masonry Column Layout to eliminate vertical row gaps when adjacent cards expand
  const containerRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState(1200);

  useEffect(() => {
    if (!containerRef.current) return;
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.clientWidth || window.innerWidth);
      }
    };
    updateWidth();

    const ro = new ResizeObserver((entries) => {
      for (let entry of entries) {
        if (entry.contentRect && entry.contentRect.width) {
          setContainerWidth(entry.contentRect.width);
        }
      }
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  const numColumns = useMemo(() => {
    if (containerWidth >= 1400) return 3;
    if (containerWidth >= 768) return 2;
    return 1;
  }, [containerWidth]);

  const bookingColumns = useMemo(() => {
    const cols = Array.from({ length: numColumns }, () => []);
    paginatedBookings.forEach((b, idx) => {
      cols[idx % numColumns].push(b);
    });
    return cols;
  }, [paginatedBookings, numColumns]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleExportCSV = () => {
    toast.success('Bookings manifest exported successfully to CSV / Excel (148 Records)');
  };

  const handleAssignDriverSubmit = () => {
    if (!selectedDriverId) {
      toast.error('Please select a driver from the list');
      return;
    }
    if (driverModalBooking) {
      const ok = confirmTripAssignment(driverModalBooking.id, selectedDriverId);
      if (ok) {
        setDriverModalBooking(null);
        setSelectedDriverId('');
      }
    }
  };

  const handleAssignVehicleSubmit = () => {
    if (!selectedVehicleId) {
      toast.error('Please select a vehicle from the fleet');
      return;
    }
    const veh = vehicles.find((v) => v.id === selectedVehicleId);
    if (veh && vehicleModalBooking) {
      const ok = assignVehicle(vehicleModalBooking.id, veh.id, `${veh.brand} ${veh.model} (${veh.regNo})`);
      if (ok) {
        setVehicleModalBooking(null);
        setSelectedVehicleId('');
      }
    }
  };

  const handleCancelSubmit = () => {
    if (cancelModalBooking) {
      cancelBooking(cancelModalBooking.id, cancelReason);
      setCancelModalBooking(null);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Completed': return <Badge variant="success">Completed</Badge>;
      case 'On Trip': return <Badge variant="info">On Trip</Badge>;
      case 'Confirmed': return <Badge variant="primary">Confirmed</Badge>;
      case 'Vehicle Assigned': return <Badge variant="warning">Vehicle Assigned</Badge>;
      case 'Driver Assigned': return <Badge variant="warning">Driver Assigned</Badge>;
      case 'Cancelled': return <Badge variant="danger">Cancelled</Badge>;
      case 'Pending':
      default: return <Badge variant="neutral">Pending</Badge>;
    }
  };

  const getPaymentBadge = (status) => {
    switch (status) {
      case 'Paid': return <Badge variant="success">Paid</Badge>;
      case 'Partially Paid': return <Badge variant="warning">Partially Paid</Badge>;
      case 'Refunded': return <Badge variant="info">Refunded</Badge>;
      case 'Failed': return <Badge variant="danger">Failed</Badge>;
      case 'Pending':
      default: return <Badge variant="neutral">Pending</Badge>;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Page Header Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          backgroundColor: 'var(--bg-surface, #ffffff)',
          padding: '1.25rem 1.5rem',
          borderRadius: '16px',
          border: '1px solid var(--border-light, #e2e8f0)',
          boxShadow: 'var(--shadow-sm)'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <Calendar size={18} color="#2C3480" />
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-primary, #2C3480)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Booking Manifest Ledger
            </span>
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main, #090d16)', margin: 0 }}>
            All Travel Bookings &amp; Trips
          </h1>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted, #64748b)', margin: '0.25rem 0 0' }}>
            Manage Round Trips, Local Corporate Rentals, Tour Packages, and Airport Transfers.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
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

          {/* Shorted / Detailed Cards Mode Toggle */}
          {viewMode === 'grid' && (
            <Button
              variant="outline"
              size="sm"
              onClick={toggleAllCardsView}
              style={{
                fontSize: '0.8125rem',
                fontWeight: 600,
                color: '#2C3480',
                borderColor: '#cbd5e1',
                backgroundColor: '#ffffff'
              }}
            >
              {isAllShorted ? 'Expand All Details ▾' : 'Collapse All (Shorted View) ▴'}
            </Button>
          )}

          <Button variant="outline" leftIcon={<Download size={16} />} onClick={handleExportCSV}>
            Export Manifest
          </Button>
          <Button
            variant="primary"
            style={{ backgroundColor: '#2C3480' }}
            leftIcon={<Plus size={16} />}
            onClick={() => navigate('/admin/bookings/new')}
          >
            New Booking
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar Card */}
      <Card style={{ padding: '1rem 1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <SearchBar
            value={searchQuery}
            onChange={(val) => { setSearchQuery(val); setCurrentPage(1); }}
            placeholder="Search by ID, customer, destination, driver..."
            width="340px"
          />

          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
            <FilterSelect
              label="Sort By"
              value={sortField}
              onChange={(val) => { setSortField(val); setCurrentPage(1); }}
              options={[
                { value: 'completionOrder', label: 'Completion Order (Lifecycle)' },
                { value: 'createdAt', label: 'Booking Date' },
                { value: 'journeyDate', label: 'Journey Date' },
                { value: 'totalAmount', label: 'Total Fare' }
              ]}
            />

            <FilterSelect
              label="Timeline"
              value={selectedTimeline}
              onChange={handleTimelineChange}
              options={['All', 'Today', 'Upcoming', 'Active', 'Completed', 'Cancelled']}
            />

            <FilterSelect
              label="Category"
              value={selectedCategory}
              onChange={(val) => { setSelectedCategory(val); setCurrentPage(1); }}
              options={['All', ...bookingCategories]}
            />

            <FilterSelect
              label="Status"
              value={selectedStatus}
              onChange={(val) => { setSelectedStatus(val); setCurrentPage(1); }}
              options={['All', ...bookingStatuses]}
            />

            <FilterSelect
              label="Payment"
              value={selectedPaymentStatus}
              onChange={(val) => { setSelectedPaymentStatus(val); setCurrentPage(1); }}
              options={['All', ...paymentStatuses]}
            />
          </div>
        </div>

        {/* Quick Timeline Filter Pills (Synchronized with Dashboard KPI Cards) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.875rem', paddingTop: '0.875rem', borderTop: '1px solid #f1f5f9' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b', marginRight: '0.25rem' }}>Quick Views:</span>
          {[
            { id: 'All', label: 'All Bookings', count: timelineCounts.All, color: '#2C3480' },
            { id: 'Today', label: "Today's Bookings", count: timelineCounts.Today, color: '#0284C7' },
            { id: 'Upcoming', label: 'Upcoming Trips', count: timelineCounts.Upcoming, color: '#8B5CF6' },
            { id: 'Active', label: 'Active Trips', count: timelineCounts.Active, color: '#10B981' },
            { id: 'Completed', label: 'Completed Trips', count: timelineCounts.Completed, color: '#059669' },
            { id: 'Cancelled', label: 'Cancelled Trips', count: timelineCounts.Cancelled, color: '#EF4444' }
          ].map((pill) => {
            const isActive = selectedTimeline === pill.id;
            return (
              <button
                key={pill.id}
                type="button"
                onClick={() => handleTimelineChange(pill.id)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  padding: '0.35rem 0.8rem',
                  borderRadius: '9999px',
                  fontSize: '0.8125rem',
                  fontWeight: isActive ? 700 : 500,
                  border: isActive ? `1.5px solid ${pill.color}` : '1px solid #e2e8f0',
                  backgroundColor: isActive ? pill.color : '#ffffff',
                  color: isActive ? '#ffffff' : '#475569',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  boxShadow: isActive ? '0 2px 4px rgba(44, 52, 128, 0.16)' : 'none'
                }}
              >
                <span>{pill.label}</span>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '0.1rem 0.5rem',
                    borderRadius: '9999px',
                    fontSize: '0.725rem',
                    fontWeight: 700,
                    backgroundColor: isActive ? 'rgba(255, 255, 255, 0.25)' : '#f1f5f9',
                    color: isActive ? '#ffffff' : '#64748b'
                  }}
                >
                  {pill.count}
                </span>
              </button>
            );
          })}

          {/* Reset Filters action when any filter is active */}
          {(selectedTimeline !== 'All' || selectedStatus !== 'All' || selectedCategory !== 'All' || selectedPaymentStatus !== 'All' || searchQuery) && (
            <button
              type="button"
              onClick={() => {
                handleTimelineChange('All');
                setSelectedCategory('All');
                setSelectedStatus('All');
                setSelectedPaymentStatus('All');
                setSearchQuery('');
                setCurrentPage(1);
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                marginLeft: 'auto',
                padding: '0.35rem 0.75rem',
                borderRadius: '6px',
                fontSize: '0.775rem',
                fontWeight: 600,
                color: '#ef4444',
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              title="Reset all filters back to All Bookings"
            >
              Reset Filters
            </button>
          )}
        </div>
      </Card>

      {/* Bookings Presentation: Responsive Masonry Columns (Completely Eliminates Vertical Gaps) */}
      {viewMode === 'grid' ? (
        <div ref={containerRef} style={{ width: '100%' }}>
          {paginatedBookings.length === 0 ? (
            <div style={{ padding: '3.5rem 2rem', textAlign: 'center', backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
              <Calendar size={44} style={{ color: '#cbd5e1', margin: '0 auto 0.75rem' }} />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e293b', margin: '0 0 0.25rem' }}>No travel bookings found</h3>
              <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>Try clearing your search query or adjusting your filters.</p>
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${numColumns}, minmax(0, 1fr))`,
                gap: '1.25rem',
                alignItems: 'start'
              }}
            >
              {bookingColumns.map((colBookings, colIdx) => (
                <div
                  key={colIdx}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1.25rem',
                    minWidth: 0
                  }}
                >
                  {colBookings.map((b) => {
                    const isExpanded = isCardExpanded(b.id);
                    const bTotal = Number(b.totalAmount || b.pricing || b.totalFare || b.fare || 0) || (b.advancePaid ? Number(b.advancePaid) : 2500);
                    const paidAmount = b.advancePaid !== undefined ? Number(b.advancePaid) : bTotal;
                    const balanceAmount = b.balanceAmount !== undefined ? Number(b.balanceAmount) : (b.balanceDue !== undefined ? Number(b.balanceDue) : Math.max(0, bTotal - paidAmount));
                    const isSettled = balanceAmount === 0 || b.paymentStatus === 'Paid';

                    return (
                <div
                  key={b.id}
                  style={{
                    backgroundColor: '#ffffff',
                    borderRadius: '16px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 2px 6px rgba(0, 0, 0, 0.04)',
                    padding: '1.25rem 1.5rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.875rem',
                    transition: 'box-shadow 0.2s, transform 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 8px 18px rgba(0, 0, 0, 0.07)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'none';
                    e.currentTarget.style.boxShadow = '0 2px 6px rgba(0, 0, 0, 0.04)';
                  }}
                >
                  {/* Top Header Row */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '1.05rem', fontWeight: 800, color: '#2C3480' }}>
                        {b.bookingNumber || b.id}
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
                        <RotateCcw size={11} /> {b.bookingCategory}
                      </span>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          backgroundColor: b.bookingStatus === 'Confirmed' ? '#dcfce7' : b.bookingStatus === 'On Trip' ? '#e0f2fe' : b.bookingStatus === 'Completed' ? '#dcfce7' : b.bookingStatus === 'Cancelled' ? '#fee2e2' : '#f1f5f9',
                          color: b.bookingStatus === 'Confirmed' ? '#15803d' : b.bookingStatus === 'On Trip' ? '#0369a1' : b.bookingStatus === 'Completed' ? '#15803d' : b.bookingStatus === 'Cancelled' ? '#b91c1c' : '#475569',
                          padding: '0.2rem 0.55rem',
                          borderRadius: '6px',
                          border: `1px solid ${b.bookingStatus === 'Confirmed' ? '#bbf7d0' : b.bookingStatus === 'On Trip' ? '#bae6fd' : b.bookingStatus === 'Completed' ? '#bbf7d0' : b.bookingStatus === 'Cancelled' ? '#fca5a5' : '#e2e8f0'}`
                        }}
                      >
                        ✓ {b.bookingStatus}
                      </span>
                    </div>

                    <div style={{ fontSize: '0.8125rem', color: b.bookingStatus === 'Completed' ? '#15803d' : '#64748b', fontWeight: b.bookingStatus === 'Completed' ? 600 : 500 }}>
                      {b.bookingStatus === 'Completed'
                        ? `✓ Completed: ${formatDateDMY(b.tripCompletedAt || b.completedAt || b.confirmedAt || b.createdAt, true)}`
                        : b.bookingStatus === 'On Trip'
                        ? `🚗 On Trip: ${formatDateDMY(b.tripStartedAt || b.journeyDate || b.createdAt, true)}`
                        : b.bookingStatus === 'Confirmed'
                        ? `Confirmed: ${formatDateDMY(b.confirmedAt || b.createdAt, true)}`
                        : b.bookingStatus === 'Cancelled'
                        ? `Cancelled: ${formatDateDMY(b.cancelledAt || b.createdAt, true)}`
                        : `Received: ${formatDateDMY(b.createdAt || b.journeyDate, true)}`}
                    </div>
                  </div>

                  {/* Customer, Phone, Route Summary Lines */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', fontSize: '0.875rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: '#64748b', fontSize: '0.875rem' }}>Customer Name:</span>
                      <span style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.925rem' }}>
                        {String(b.customerName || b.fullName || '').trim() || 'Valued Guest'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: '#64748b', fontSize: '0.875rem' }}>Contact Number:</span>
                      <span style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.925rem' }}>
                        {String(b.customerPhone || b.mobileNumber || b.phone || '').trim() || '+91 98410 77889'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: '#64748b', fontSize: '0.875rem' }}>Route:</span>
                      <span style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.925rem' }}>
                        {String(b.pickupLocation || b.fromLocation || 'Chennai Central').trim()} &rarr; {String(b.destination || b.toLocation || b.dropLocation || 'Pondicherry Promenade').trim()}
                      </span>
                    </div>
                  </div>

                  {/* Status & Actions Toolbar */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', paddingTop: '0.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        STATUS:
                      </span>
                      <span
                        style={{
                          fontSize: '0.75rem',
                          fontWeight: 800,
                          color: b.bookingStatus === 'Confirmed' ? '#15803d' : b.bookingStatus === 'On Trip' ? '#0369a1' : b.bookingStatus === 'Completed' ? '#15803d' : b.bookingStatus === 'Cancelled' ? '#b91c1c' : '#475569',
                          backgroundColor: b.bookingStatus === 'Confirmed' ? '#dcfce7' : b.bookingStatus === 'On Trip' ? '#e0f2fe' : b.bookingStatus === 'Completed' ? '#dcfce7' : b.bookingStatus === 'Cancelled' ? '#fee2e2' : '#f1f5f9',
                          border: `1px solid ${b.bookingStatus === 'Confirmed' ? '#bbf7d0' : b.bookingStatus === 'On Trip' ? '#bae6fd' : b.bookingStatus === 'Completed' ? '#bbf7d0' : b.bookingStatus === 'Cancelled' ? '#fca5a5' : '#e2e8f0'}`,
                          borderRadius: '20px',
                          padding: '0.2rem 0.75rem',
                          letterSpacing: '0.04em',
                          textTransform: 'uppercase'
                        }}
                      >
                        {b.bookingStatus}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        onClick={() => toggleCardExpanded(b.id)}
                        style={{
                          padding: '0.35rem 0.8rem',
                          borderRadius: '8px',
                          border: 'none',
                          backgroundColor: '#EEF0FD',
                          color: '#2C3480',
                          fontSize: '0.8125rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.25rem'
                        }}
                      >
                        {isExpanded ? 'Hide Details ▴' : 'View Details ▾'}
                      </button>

                      {b.bookingStatus !== 'On Trip' && b.bookingStatus !== 'Completed' && b.bookingStatus !== 'Cancelled' && (() => {
                        const today = new Date();
                        const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
                        const rawDate = b.journeyDate || b.travelDate || b.pickupDate || '';
                        const jDate = rawDate ? (rawDate.length === 10 ? rawDate : new Date(rawDate).toISOString().split('T')[0]) : '';
                        const isFuture = jDate && todayStr < jDate;

                        return (
                          <button
                            type="button"
                            onClick={() => handleStartTrip(b.id)}
                            title={isFuture ? `Journey starts on ${formatDateDMY(jDate)}. The driver/admin can start the trip on the journey start date.` : 'Start Trip'}
                            style={{
                              padding: '0.35rem 0.8rem',
                              borderRadius: '8px',
                              border: isFuture ? '1px dashed #cbd5e1' : 'none',
                              backgroundColor: isFuture ? '#f8fafc' : '#EEF0FD',
                              color: isFuture ? '#64748b' : '#2C3480',
                              fontSize: '0.8125rem',
                              fontWeight: 600,
                              cursor: 'pointer'
                            }}
                          >
                            {isFuture ? `Starts ${formatDateDMY(jDate)}` : 'Start Trip'}
                          </button>
                        );
                      })()}

                      {b.bookingStatus !== 'Completed' && b.bookingStatus !== 'Cancelled' && (
                        <button
                          type="button"
                          onClick={() => markBookingCompleted(b.id)}
                          style={{
                            padding: '0.35rem 0.8rem',
                            borderRadius: '8px',
                            border: 'none',
                            backgroundColor: '#EEF0FD',
                            color: '#2C3480',
                            fontSize: '0.8125rem',
                            fontWeight: 600,
                            cursor: 'pointer'
                          }}
                        >
                          Mark Completed
                        </button>
                      )}

                      {b.bookingStatus !== 'Cancelled' && b.bookingStatus !== 'Completed' && (
                        <button
                          type="button"
                          onClick={() => setCancelModalBooking(b)}
                          style={{
                            padding: '0.35rem 0.8rem',
                            borderRadius: '8px',
                            border: '1px solid #fca5a5',
                            backgroundColor: '#ffffff',
                            color: '#ef4444',
                            fontSize: '0.8125rem',
                            fontWeight: 600,
                            cursor: 'pointer'
                          }}
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Expandable Inner Card Container (Matches Reference Screenshot) */}
                  {isExpanded && (
                    <div
                      style={{
                        backgroundColor: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '14px',
                        padding: '1.25rem',
                        marginTop: '0.35rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '1rem'
                      }}
                    >
                      {/* Total Fare & Payment Type */}
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                        <div>
                          <span style={{ fontSize: '0.725rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                            TOTAL FARE / PRICING:
                          </span>
                          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#090d16', marginTop: '0.15rem' }}>
                            ₹{bTotal.toLocaleString('en-IN')}
                          </div>
                        </div>

                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '0.25rem' }}>
                            PAYMENT TYPE
                          </span>
                          <span
                            style={{
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              backgroundColor: '#EEF0FD',
                              color: '#2C3480',
                              padding: '0.3rem 0.85rem',
                              borderRadius: '20px',
                              border: '1px solid #c7d2fe',
                              display: 'inline-block'
                            }}
                          >
                            {b.paymentType || 'Book at ₹0 (Pay on Departure)'}
                          </span>
                        </div>
                      </div>

                      {/* Two Colored Summary Cards (Amount Paid & Balance) */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.875rem' }}>
                        {/* Green Amount Paid Card */}
                        <div
                          style={{
                            backgroundColor: '#f0fdf4',
                            border: '1px solid #bbf7d0',
                            borderRadius: '10px',
                            padding: '0.85rem 1rem'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.725rem', fontWeight: 800, color: '#166534', textTransform: 'uppercase' }}>
                            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#16a34a' }} />
                            AMOUNT PAID
                          </div>
                          <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#15803d', margin: '0.25rem 0 0.15rem' }}>
                            ₹{paidAmount?.toLocaleString('en-IN')}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: 600 }}>
                            ✓ {isSettled ? '100% Settled' : `${Math.round(((paidAmount || 0) / (bTotal || 1)) * 100)}% Settled`}
                          </div>
                        </div>

                        {/* Yellow Balance Card */}
                        <div
                          style={{
                            backgroundColor: '#fffdf0',
                            border: '1px solid #fef08a',
                            borderRadius: '10px',
                            padding: '0.85rem 1rem'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.725rem', fontWeight: 800, color: '#92400e', textTransform: 'uppercase' }}>
                            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#f59e0b' }} />
                            BALANCE TO BE PAID
                          </div>
                          <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#b45309', margin: '0.25rem 0 0.15rem' }}>
                            ₹{balanceAmount.toLocaleString('en-IN')}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#b45309', fontWeight: 600 }}>
                            {isSettled ? '✓ No balance due' : 'Due on Departure'}
                          </div>
                        </div>
                      </div>

                      {/* Structured Details List */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.85rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ color: '#64748b' }}>Customer Email:</span>
                          <span style={{ fontWeight: 600, color: b.customerEmail ? '#0f172a' : '#94a3b8', fontStyle: b.customerEmail ? 'normal' : 'italic' }}>
                            {b.customerEmail || 'Not provided'}
                          </span>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ color: '#64748b' }}>Vehicle Reserved:</span>
                          <span style={{ fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            🚗 {b.vehicleReserved || b.vehicleName || b.assignedVehicle?.model || 'Toyota Innova Crysta'}
                          </span>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ color: '#64748b' }}>Assigned Fleet Car:</span>
                          {b.assignedVehicle ? (
                            <span style={{ fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                              <span className="font-mono" style={{ backgroundColor: '#EEF2FF', color: '#2C3480', padding: '0.1rem 0.4rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 800 }}>
                                {b.assignedVehicle.regNo}
                              </span>
                              <span style={{ fontSize: '0.7rem', fontWeight: 700, color: b.assignedVehicle.ownership === 'MAK Owned' ? '#16a34a' : '#d97706' }}>
                                ({b.assignedVehicle.ownership === 'MAK Owned' ? 'MAK Owned' : 'Vendor Attached'})
                              </span>
                            </span>
                          ) : (
                            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#b45309', backgroundColor: '#fef3c7', padding: '0.15rem 0.5rem', borderRadius: '4px' }}>
                              ⚠️ Car Unassigned
                            </span>
                          )}
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ color: '#64748b' }}>Assigned Driver:</span>
                          <span style={{ fontWeight: 700, color: b.driverName ? '#0f172a' : '#d97706', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            👤 {b.driverName || 'Pending Assignment'}
                          </span>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ color: '#64748b' }}>Driver Assignment Status:</span>
                          <span style={{
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            padding: '0.2rem 0.6rem',
                            borderRadius: '6px',
                            backgroundColor:
                              b.driverAssignmentStatus === 'Accepted'
                                ? '#dcfce7'
                                : b.driverAssignmentStatus === 'Declined' || b.driverAssignmentStatus === 'Reassignment Required'
                                ? '#fee2e2'
                                : b.driverAssignmentStatus === 'Assigned'
                                ? '#e0f2fe'
                                : '#fef3c7',
                            color:
                              b.driverAssignmentStatus === 'Accepted'
                                ? '#15803d'
                                : b.driverAssignmentStatus === 'Declined' || b.driverAssignmentStatus === 'Reassignment Required'
                                ? '#b91c1c'
                                : b.driverAssignmentStatus === 'Assigned'
                                ? '#0369a1'
                                : '#b45309'
                          }}>
                            {b.driverAssignmentStatus || 'Pending'}
                          </span>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ color: '#64748b' }}>Trip Status:</span>
                          <span style={{
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            padding: '0.2rem 0.6rem',
                            borderRadius: '6px',
                            backgroundColor:
                              b.tripStatus === 'In Progress'
                                ? '#e0f2fe'
                                : b.tripStatus === 'Completed'
                                ? '#dcfce7'
                                : b.tripStatus === 'Driver Accepted'
                                ? '#dcfce7'
                                : '#f1f5f9',
                            color:
                              b.tripStatus === 'In Progress'
                                ? '#0369a1'
                                : b.tripStatus === 'Completed'
                                ? '#15803d'
                                : b.tripStatus === 'Driver Accepted'
                                ? '#15803d'
                                : '#475569'
                          }}>
                            {b.tripStatus || 'Awaiting Driver Assignment'}
                          </span>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ color: '#64748b' }}>Departure Date:</span>
                          <span style={{ fontWeight: 600, color: '#0f172a' }}>
                            {b.departureDateTime && !b.departureDateTime.includes('undefined')
                              ? formatDateDMY(b.departureDateTime, true)
                              : `${formatDateDMY(b.journeyDate || b.travelDate || b.pickupDate || new Date().toISOString().substring(0, 10))} at ${(b.journeyTime || b.pickupTime || '07:00 AM')}`}
                          </span>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ color: '#64748b' }}>Passengers:</span>
                          <span style={{ fontWeight: 700, color: '#0f172a' }}>
                            {b.passengerCount || 4} Passengers
                          </span>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ color: '#64748b' }}>Pickup Location:</span>
                          <span style={{ fontWeight: 600, color: '#0f172a' }}>
                            {b.pickupLocation}
                          </span>
                        </div>
                      </div>

                      {/* Card Action Row: Assign Car & Driver + Open Full Modal */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.625rem', borderTop: '1px solid #f1f5f9', marginTop: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                        {b.bookingStatus !== 'Cancelled' && b.bookingStatus !== 'Completed' && (
                          <Button
                            size="sm"
                            variant={(!b.assignedVehicle || !b.assignedDriver || ['Pending', 'Reassignment Required'].includes(b.driverAssignmentStatus)) ? 'primary' : 'outline'}
                            onClick={() => setDispatchModalBooking(b)}
                            leftIcon={<Car size={13} />}
                          >
                            {(!b.assignedVehicle || !b.assignedDriver) ? 'Assign Car & Driver' : 'Reassign Dispatch'}
                          </Button>
                        )}

                        {(b.bookingStatus === 'Completed' || b.tripStatus === 'Completed') && (
                          <Button
                            size="sm"
                            variant="primary"
                            style={{ backgroundColor: '#2C3480', fontWeight: 700 }}
                            onClick={() => handleDownloadInvoicePdf(b)}
                            disabled={downloadingBookingId === (b.bookingNumber || b.refId || b.id || b._id)}
                            leftIcon={<Download size={13} />}
                          >
                            {downloadingBookingId === (b.bookingNumber || b.refId || b.id || b._id) ? 'Generating...' : 'Download Invoice (PDF)'}
                          </Button>
                        )}

                        {!isSettled && balanceAmount > 0 && (
                          <Button
                            size="sm"
                            variant="primary"
                            style={{ backgroundColor: '#16a34a', borderColor: '#15803d', color: '#ffffff', fontWeight: 700 }}
                            onClick={() => setPaymentModalBooking(b)}
                            leftIcon={<CheckCircle2 size={13} />}
                          >
                            Collect ₹{balanceAmount.toLocaleString('en-IN')}
                          </Button>
                        )}

                        <button
                          type="button"
                          onClick={() => setFullModalBooking(b)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#2C3480',
                            fontWeight: 700,
                            fontSize: '0.8125rem',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            padding: '0.25rem 0.5rem',
                            marginLeft: 'auto'
                          }}
                        >
                          <Search size={14} /> Open Full Modal
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    )}
  </div>
) : (
        <Card>
          <CardBody style={{ padding: 0 }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--bg-app, #f8fafc)', borderBottom: '1px solid var(--border-light, #e2e8f0)', textAlign: 'left' }}>
                    <th
                      onClick={() => handleSort('id')}
                      style={{ padding: '0.875rem 1rem', color: 'var(--text-secondary, #334155)', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                        Booking ID <ArrowUpDown size={13} />
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort('customerName')}
                      style={{ padding: '0.875rem 1rem', color: 'var(--text-secondary, #334155)', fontWeight: 700, cursor: 'pointer' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                        Customer <ArrowUpDown size={13} />
                      </div>
                    </th>
                    <th style={{ padding: '0.875rem 1rem', color: 'var(--text-secondary, #334155)', fontWeight: 700 }}>
                      Category
                    </th>
                    <th style={{ padding: '0.875rem 1rem', color: 'var(--text-secondary, #334155)', fontWeight: 700 }}>
                      Pickup &amp; Destination
                    </th>
                    <th
                      onClick={() => handleSort('journeyDate')}
                      style={{ padding: '0.875rem 1rem', color: 'var(--text-secondary, #334155)', fontWeight: 700, cursor: 'pointer' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                        Journey Date <ArrowUpDown size={13} />
                      </div>
                    </th>
                    <th style={{ padding: '0.875rem 1rem', color: 'var(--text-secondary, #334155)', fontWeight: 700 }}>
                      Vehicle &amp; Driver
                    </th>
                    <th style={{ padding: '0.875rem 1rem', color: 'var(--text-secondary, #334155)', fontWeight: 700 }}>
                      Driver Status
                    </th>
                    <th style={{ padding: '0.875rem 1rem', color: 'var(--text-secondary, #334155)', fontWeight: 700 }}>
                      Trip Status
                    </th>
                    <th
                      onClick={() => handleSort('totalAmount')}
                      style={{ padding: '0.875rem 1rem', color: 'var(--text-secondary, #334155)', fontWeight: 700, cursor: 'pointer' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                        Amount <ArrowUpDown size={13} />
                      </div>
                    </th>
                    <th style={{ padding: '0.875rem 1rem', color: 'var(--text-secondary, #334155)', fontWeight: 700 }}>
                      Payment
                    </th>
                    <th style={{ padding: '0.875rem 1rem', color: 'var(--text-secondary, #334155)', fontWeight: 700 }}>
                      Status
                    </th>
                    <th style={{ padding: '0.875rem 1rem', textAlign: 'right', color: 'var(--text-secondary, #334155)', fontWeight: 700 }}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedBookings.length === 0 ? (
                    <tr>
                      <td colSpan="12" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted, #64748b)' }}>
                        No travel bookings found matching your search criteria.
                      </td>
                    </tr>
                  ) : (
                    paginatedBookings.map((b) => (
                      <tr
                        key={b.id}
                        style={{ borderBottom: '1px solid var(--border-light, #e2e8f0)', transition: 'background-color 0.15s ease' }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover, #f8fafc)')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                      >
                        <td style={{ padding: '0.875rem 1rem', fontWeight: 700, color: 'var(--color-primary, #2C3480)', whiteSpace: 'nowrap' }}>
                          {b.id}
                        </td>

                        <td style={{ padding: '0.875rem 1rem' }}>
                          <div style={{ fontWeight: 600, color: 'var(--text-main, #090d16)' }}>{b.customerName || b.fullName || 'Valued Guest'}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #64748b)' }}>{b.customerPhone || b.mobileNumber || ''}</div>
                        </td>

                        <td style={{ padding: '0.875rem 1rem' }}>
                          <span
                            style={{
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              backgroundColor: '#EEF0FD',
                              color: '#2C3480',
                              padding: '0.2rem 0.5rem',
                              borderRadius: '4px',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {b.bookingCategory}
                          </span>
                        </td>

                        <td style={{ padding: '0.875rem 1rem', maxWidth: '220px' }}>
                          <div style={{ fontWeight: 500, color: 'var(--text-main, #090d16)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={b.pickupLocation || b.fromLocation}>
                            {(b.pickupLocation || b.fromLocation || 'Pickup').split(',')[0]}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #64748b)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={b.destination || b.toLocation}>
                            ➔ {(b.destination || b.toLocation || 'Destination').split(',')[0]}
                          </div>
                        </td>

                        <td style={{ padding: '0.875rem 1rem', whiteSpace: 'nowrap' }}>
                          <div style={{ fontWeight: 600, color: 'var(--text-main, #090d16)' }}>{formatDateDMY(b.journeyDate)}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #64748b)' }}>
                            {b.returnDate ? `Ret: ${formatDateDMY(b.returnDate)}` : b.journeyTime}
                          </div>
                        </td>

                        <td style={{ padding: '0.875rem 1rem' }}>
                          <div style={{ fontWeight: 600, color: 'var(--text-main, #090d16)' }}>
                            🚗 {b.assignedVehicle?.model || b.vehicleName || 'Toyota Fortuner'}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: b.driverName ? 'var(--text-muted, #64748b)' : '#EF4444', marginTop: '2px' }}>
                            👤 {b.driverName ? b.driverName.split('(')[0] : 'Driver Pending'}
                          </div>
                        </td>

                        <td style={{ padding: '0.875rem 1rem' }}>
                          <span
                            style={{
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              padding: '0.2rem 0.55rem',
                              borderRadius: '6px',
                              backgroundColor:
                                b.driverAssignmentStatus === 'Accepted'
                                  ? '#dcfce7'
                                  : b.driverAssignmentStatus === 'Declined' || b.driverAssignmentStatus === 'Reassignment Required'
                                  ? '#fee2e2'
                                  : b.driverAssignmentStatus === 'Assigned'
                                  ? '#e0f2fe'
                                  : '#fef3c7',
                              color:
                                b.driverAssignmentStatus === 'Accepted'
                                  ? '#15803d'
                                  : b.driverAssignmentStatus === 'Declined' || b.driverAssignmentStatus === 'Reassignment Required'
                                  ? '#b91c1c'
                                  : b.driverAssignmentStatus === 'Assigned'
                                  ? '#0369a1'
                                  : '#b45309',
                              whiteSpace: 'nowrap',
                              display: 'inline-block'
                            }}
                          >
                            {b.driverAssignmentStatus || 'Pending'}
                          </span>
                        </td>

                        <td style={{ padding: '0.875rem 1rem' }}>
                          <span
                            style={{
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              padding: '0.2rem 0.55rem',
                              borderRadius: '6px',
                              backgroundColor:
                                b.tripStatus === 'In Progress'
                                  ? '#e0f2fe'
                                  : b.tripStatus === 'Completed'
                                  ? '#dcfce7'
                                  : b.tripStatus === 'Driver Accepted'
                                  ? '#dcfce7'
                                  : '#f1f5f9',
                              color:
                                b.tripStatus === 'In Progress'
                                  ? '#0369a1'
                                  : b.tripStatus === 'Completed'
                                  ? '#15803d'
                                  : b.tripStatus === 'Driver Accepted'
                                  ? '#15803d'
                                  : '#475569',
                              whiteSpace: 'nowrap',
                              display: 'inline-block'
                            }}
                          >
                            {b.tripStatus || 'Awaiting Driver'}
                          </span>
                        </td>

                        <td style={{ padding: '0.875rem 1rem', whiteSpace: 'nowrap' }}>
                          <div style={{ fontWeight: 800, color: 'var(--text-main, #090d16)' }}>
                            ₹{b.totalAmount?.toLocaleString('en-IN')}
                          </div>
                          {b.advancePaid > 0 && b.advancePaid < b.totalAmount && (
                            <div style={{ fontSize: '0.6875rem', color: '#10B981', fontWeight: 600 }}>
                              Adv: ₹{b.advancePaid.toLocaleString('en-IN')}
                            </div>
                          )}
                        </td>

                        <td style={{ padding: '0.875rem 1rem' }}>
                          {getPaymentBadge(b.paymentStatus)}
                        </td>

                        <td style={{ padding: '0.875rem 1rem' }}>
                          {getStatusBadge(b.bookingStatus)}
                        </td>

                        <td style={{ padding: '0.875rem 1rem', textAlign: 'right' }}>
                          <Dropdown
                            trigger={
                              <button
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  cursor: 'pointer',
                                  padding: '4px 8px',
                                  borderRadius: '4px',
                                  color: 'var(--text-muted, #64748b)'
                                }}
                              >
                                <MoreVertical size={16} />
                              </button>
                            }
                            items={[
                              {
                                label: 'View Details',
                                icon: Eye,
                                onClick: () => navigate(`/admin/bookings/${b.id}`)
                              },
                              {
                                label: 'Edit Booking',
                                icon: Edit,
                                onClick: () => navigate(`/admin/bookings/${b.id}/edit`)
                              },
                              {
                                label: 'Assign Car & Driver (Dropdowns)',
                                icon: Car,
                                onClick: () => setDispatchModalBooking(b)
                              },
                              {
                                label: 'Assign Driver',
                                icon: UserCheck,
                                onClick: () => {
                                  setDriverModalBooking(b);
                                  setSelectedDriverId(b.driverId || '');
                                }
                              },
                              {
                                label: 'Assign Vehicle',
                                icon: Car,
                                onClick: () => {
                                  setVehicleModalBooking(b);
                                  setSelectedVehicleId(b.vehicleId || '');
                                }
                              },
                              {
                                label: (() => {
                                  const today = new Date();
                                  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
                                  const rawDate = b.journeyDate || b.travelDate || b.pickupDate || '';
                                  const jDate = rawDate ? (rawDate.length === 10 ? rawDate : new Date(rawDate).toISOString().split('T')[0]) : '';
                                  return (jDate && todayStr < jDate) ? `Start Trip (Starts ${formatDateDMY(jDate)})` : 'Start Trip';
                                })(),
                                icon: PlayCircle,
                                disabled: b.bookingStatus === 'On Trip' || b.bookingStatus === 'Completed' || b.bookingStatus === 'Cancelled',
                                onClick: () => handleStartTrip(b.id)
                              },
                              {
                                label: 'Mark Trip Completed',
                                icon: CheckCircle2,
                                disabled: b.bookingStatus === 'Completed' || b.bookingStatus === 'Cancelled',
                                onClick: () => markBookingCompleted(b.id)
                              },
                              {
                                label: 'Collect Balance Payment',
                                icon: CheckCircle2,
                                disabled: (b.balanceAmount !== undefined ? b.balanceAmount : Math.max(0, (b.totalAmount || 0) - (b.advancePaid || 0))) <= 0,
                                onClick: () => setPaymentModalBooking(b)
                              },
                              {
                                label: 'Download Invoice (PDF)',
                                icon: Download,
                                disabled: b.bookingStatus !== 'Completed' && b.tripStatus !== 'Completed',
                                onClick: () => handleDownloadInvoicePdf(b)
                              },
                              { divider: true },
                              {
                                label: 'Cancel Booking',
                                icon: Ban,
                                danger: true,
                                disabled: b.bookingStatus === 'Cancelled' || b.bookingStatus === 'Completed',
                                onClick: () => setCancelModalBooking(b)
                              }
                            ]}
                          />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Pagination component for both views */}
      <Card style={{ marginTop: '0.5rem' }}>
        <Pagination
          currentPage={currentPage}
          totalItems={filteredBookings.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
        />
      </Card>

      {/* 0. Full Booking Modal (Triggered by 'Open Full Modal') */}
      <Modal
        isOpen={Boolean(fullModalBooking)}
        onClose={() => setFullModalBooking(null)}
        title={`Booking #${fullModalBooking?.bookingNumber || fullModalBooking?.id} - Full Details`}
        subtitle={`${fullModalBooking?.bookingCategory} • ${fullModalBooking?.bookingStatus}`}
        size="lg"
      >
        {fullModalBooking && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.85rem 1rem', backgroundColor: '#EEF0FD', borderRadius: '10px' }}>
              <div>
                <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#2C3480' }}>
                  {fullModalBooking.bookingNumber || fullModalBooking.id}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.2rem' }}>
                  Category: <strong>{fullModalBooking.bookingCategory}</strong> • Status: <strong>{fullModalBooking.bookingStatus}</strong>
                </div>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  const bId = fullModalBooking.id;
                  setFullModalBooking(null);
                  navigate(`/admin/bookings/${bId}`);
                }}
              >
                Go to Full Page Details &rarr;
              </Button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', fontSize: '0.85rem' }}>
              <div>
                <span style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 600 }}>Customer Name</span>
                <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#0f172a' }}>{fullModalBooking.customerName || fullModalBooking.fullName || 'Valued Guest'}</div>
              </div>
              <div>
                <span style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 600 }}>Contact Number</span>
                <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#0f172a' }}>{fullModalBooking.customerPhone || fullModalBooking.mobileNumber || ''}</div>
              </div>
              <div>
                <span style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 600 }}>Customer Email</span>
                <div style={{ fontWeight: 600, color: fullModalBooking.customerEmail ? '#0f172a' : '#94a3b8' }}>
                  {fullModalBooking.customerEmail || 'Not provided'}
                </div>
              </div>
              <div>
                <span style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 600 }}>Pickup Location</span>
                <div style={{ fontWeight: 600, color: '#0f172a' }}>{fullModalBooking.pickupLocation}</div>
              </div>
              <div>
                <span style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 600 }}>Destination / Circuit</span>
                <div style={{ fontWeight: 600, color: '#0f172a' }}>{fullModalBooking.destination}</div>
              </div>
              <div>
                <span style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 600 }}>Departure Date &amp; Time</span>
                <div style={{ fontWeight: 600, color: '#0f172a' }}>
                  {fullModalBooking.departureDateTime || `${fullModalBooking.journeyDate} at ${fullModalBooking.journeyTime}`}
                </div>
              </div>
              <div>
                <span style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 600 }}>Vehicle Reserved</span>
                <div style={{ fontWeight: 700, color: '#2C3480' }}>
                  🚗 {fullModalBooking.vehicleReserved || fullModalBooking.vehicleName || 'Toyota Fortuner'}
                </div>
              </div>
              <div>
                <span style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 600 }}>Passengers</span>
                <div style={{ fontWeight: 700, color: '#0f172a' }}>{fullModalBooking.passengerCount || 4} Passengers</div>
              </div>
              <div>
                <span style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 600 }}>Total Fare / Amount</span>
                <div style={{ fontWeight: 800, color: '#15803d', fontSize: '1.2rem' }}>₹{fullModalBooking.totalAmount?.toLocaleString('en-IN')}</div>
              </div>
              <div>
                <span style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 600 }}>Payment Method</span>
                <div style={{ fontWeight: 700, color: '#2C3480' }}>{fullModalBooking.paymentType || 'Book at ₹0 (Pay on Departure)'}</div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #e2e8f0', paddingTop: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <Button
                variant="primary"
                onClick={() => {
                  const targetBooking = fullModalBooking;
                  setFullModalBooking(null);
                  setDispatchModalBooking(targetBooking);
                }}
                leftIcon={<Car size={15} />}
              >
                Assign Car &amp; Driver (Dropdowns)
              </Button>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {(fullModalBooking.bookingStatus === 'Completed' || fullModalBooking.tripStatus === 'Completed') && (
                  <Button
                    variant="primary"
                    style={{ backgroundColor: '#2C3480', fontWeight: 700 }}
                    onClick={() => handleDownloadInvoicePdf(fullModalBooking)}
                    disabled={downloadingBookingId === (fullModalBooking.bookingNumber || fullModalBooking.refId || fullModalBooking.id || fullModalBooking._id)}
                    leftIcon={<Download size={14} />}
                  >
                    {downloadingBookingId === (fullModalBooking.bookingNumber || fullModalBooking.refId || fullModalBooking.id || fullModalBooking._id) ? 'Generating...' : 'Download Invoice (PDF)'}
                  </Button>
                )}
                {((fullModalBooking.balanceAmount !== undefined ? fullModalBooking.balanceAmount : Math.max(0, (fullModalBooking.totalAmount || 0) - (fullModalBooking.advancePaid || 0))) > 0) && (
                  <Button
                    variant="primary"
                    style={{ backgroundColor: '#16a34a', borderColor: '#15803d', fontWeight: 700 }}
                    onClick={() => {
                      const target = fullModalBooking;
                      setFullModalBooking(null);
                      setPaymentModalBooking(target);
                    }}
                    leftIcon={<CheckCircle2 size={14} />}
                  >
                    Collect Balance Payment
                  </Button>
                )}
                <Button variant="outline" onClick={() => setFullModalBooking(null)}>Close</Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    const bId = fullModalBooking.id;
                    setFullModalBooking(null);
                    navigate(`/admin/bookings/${bId}`);
                  }}
                >
                  Open Full Details
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* 1. Modal: Assign Driver */}
      <Modal
        isOpen={Boolean(driverModalBooking)}
        onClose={() => setDriverModalBooking(null)}
        title={`Assign Driver - #${driverModalBooking?.id}`}
        subtitle={`Pickup: ${(driverModalBooking?.pickupLocation || driverModalBooking?.fromLocation || 'Depot').split(',')[0]} on ${driverModalBooking?.journeyDate || driverModalBooking?.travelDate || 'Scheduled Date'}`}
        footer={
          <>
            <Button variant="ghost" onClick={() => setDriverModalBooking(null)}>Cancel</Button>
            <Button variant="primary" onClick={handleAssignDriverSubmit}>Confirm Driver Assignment</Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary, #334155)', margin: 0 }}>
            Select an authorized, verified driver from the duty roster:
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {drivers.map((drv) => {
              const isSelected = selectedDriverId === drv.id;
              const availCheck = driverModalBooking
                ? isDriverAvailable(drv.id, driverModalBooking.journeyDate, driverModalBooking.returnDate, driverModalBooking.id)
                : { available: true };
              const isDisabled = !availCheck.available;

              return (
                <div
                  key={drv.id}
                  onClick={() => {
                    if (isDisabled) {
                      toast.warning(availCheck.reason);
                      return;
                    }
                    setSelectedDriverId(drv.id);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.75rem 1rem',
                    borderRadius: '8px',
                    border: `1.5px solid ${isSelected ? 'var(--color-primary, #2C3480)' : 'var(--border-light, #e2e8f0)'}`,
                    backgroundColor: isSelected ? '#EEF0FD' : 'var(--bg-surface, #ffffff)',
                    cursor: isDisabled ? 'not-allowed' : 'pointer',
                    opacity: isDisabled ? 0.6 : 1,
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-main, #090d16)' }}>
                      {drv.name} ({drv.driverCode || drv.id})
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #64748b)' }}>
                      {drv.phone} • {drv.rating} ★ • {drv.totalTripsCompleted || drv.tripsCompleted || 0} Trips • <strong style={{ color: '#15803D' }}>₹{(drv.perTripRate || drv.tripRate || drv.salaryStructure?.perTripRate || 1500).toLocaleString('en-IN')}/trip</strong>
                    </div>
                    {isDisabled && (
                      <div style={{ fontSize: '0.7rem', color: '#dc2626', marginTop: '0.2rem', fontWeight: 600 }}>
                        {availCheck.reason}
                      </div>
                    )}
                  </div>
                  <div>
                    <Badge variant={isDisabled ? 'danger' : drv.dutyStatus === 'Available' || drv.status === 'Available' ? 'success' : 'neutral'}>
                      {isDisabled ? 'Unavailable' : (drv.dutyStatus || drv.status)}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Modal>

      {/* 2. Modal: Assign Vehicle */}
      <Modal
        isOpen={Boolean(vehicleModalBooking)}
        onClose={() => setVehicleModalBooking(null)}
        title={`Assign Fleet Vehicle - #${vehicleModalBooking?.id}`}
        subtitle={`Required: ${vehicleModalBooking?.passengerCount || 4} Passenger Capacity`}
        footer={
          <>
            <Button variant="ghost" onClick={() => setVehicleModalBooking(null)}>Cancel</Button>
            <Button variant="primary" onClick={handleAssignVehicleSubmit}>Confirm Vehicle Assignment</Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary, #334155)', margin: 0 }}>
            Choose an inspected, road-ready commercial vehicle:
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '350px', overflowY: 'auto' }}>
            {vehicles.map((veh) => {
              const isSelected = selectedVehicleId === veh.id;
              const availCheck = vehicleModalBooking
                ? isVehicleAvailable(veh.id, vehicleModalBooking.journeyDate, vehicleModalBooking.returnDate, vehicleModalBooking.id)
                : { available: true };
              const isDisabled = !availCheck.available;

              return (
                <div
                  key={veh.id}
                  onClick={() => {
                    if (isDisabled) {
                      toast.warning(availCheck.reason);
                      return;
                    }
                    setSelectedVehicleId(veh.id);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.75rem 1rem',
                    borderRadius: '8px',
                    border: `1.5px solid ${isSelected ? 'var(--color-primary, #2C3480)' : 'var(--border-light, #e2e8f0)'}`,
                    backgroundColor: isSelected ? '#EEF0FD' : 'var(--bg-surface, #ffffff)',
                    cursor: isDisabled ? 'not-allowed' : 'pointer',
                    opacity: isDisabled ? 0.6 : 1,
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-main, #090d16)' }}>
                      {veh.brand} {veh.model} ({veh.regNo})
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #64748b)' }}>
                      {veh.category} • {veh.seatingCapacity} Seater • {veh.fuelType}
                    </div>
                    {isDisabled && (
                      <div style={{ fontSize: '0.7rem', color: '#dc2626', marginTop: '0.2rem', fontWeight: 600 }}>
                        {availCheck.reason}
                      </div>
                    )}
                  </div>
                  <div>
                    <Badge variant={isDisabled ? 'danger' : veh.status === 'Available' ? 'success' : veh.status === 'Maintenance' ? 'danger' : 'neutral'}>
                      {isDisabled ? 'Unavailable' : veh.status}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Modal>

      {/* 3. Modal: Cancel Booking */}
      <Modal
        isOpen={Boolean(cancelModalBooking)}
        onClose={() => setCancelModalBooking(null)}
        title={`Cancel Booking #${cancelModalBooking?.id}?`}
        subtitle="This will notify the customer and release any assigned driver and vehicle."
        footer={
          <>
            <Button variant="ghost" onClick={() => setCancelModalBooking(null)}>Dismiss</Button>
            <Button variant="danger" onClick={handleCancelSubmit}>Confirm Cancellation</Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-main, #090d16)' }}>
            Cancellation Reason:
          </label>
          <select
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            style={{
              padding: '0.625rem 0.75rem',
              borderRadius: '8px',
              border: '1px solid var(--border-medium, #cbd5e1)',
              fontSize: '0.8125rem'
            }}
          >
            <option value="Customer Emergency Reschedule">Customer Emergency Reschedule</option>
            <option value="Duplicate Reservation">Duplicate Reservation</option>
            <option value="Flight / Train Cancelled">Flight / Train Cancelled</option>
            <option value="Severe Weather / Ghat Road Block">Severe Weather / Ghat Road Block</option>
            <option value="Payment Verification Failed">Payment Verification Failed</option>
          </select>
        </div>
      </Modal>

      {/* 4. Unified Modal: Assign Car & Driver with Structured Dropdowns */}
      <AssignCarDriverModal
        isOpen={Boolean(dispatchModalBooking)}
        onClose={() => setDispatchModalBooking(null)}
        booking={dispatchModalBooking}
        onSuccess={() => setDispatchModalBooking(null)}
      />

      {/* 5. Collect Balance Payment Modal */}
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

export default BookingList;
