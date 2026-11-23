// MAK Tours & Travels ERP - Reports & Analytics Intelligence Center
import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  TrendingUp,
  Download,
  Calendar,
  Filter,
  FileSpreadsheet,
  FileText,
  Printer,
  PieChart,
  Car,
  Users,
  Award,
  IndianRupee,
  Receipt,
  CheckCircle2,
  Clock,
  ArrowRight,
  Search,
  AlertCircle,
  RotateCcw,
  Sparkles,
  MapPin,
  Check
} from 'lucide-react';
import { Card, CardHeader, CardBody } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { MonthlyRevenueChart } from '../../../components/common/AdminCharts';
import { useAdminData } from '../../../context/AdminDataContext';
import { useToast } from '../../../context/ToastContext';
import { formatDateDMY } from '../../../utils/dateUtils';

// Helper to safely parse any date value into a Date object
function parseDate(val) {
  if (!val) return null;
  if (val instanceof Date) return isNaN(val.getTime()) ? null : val;
  if (typeof val === 'string') {
    const trimmed = val.trim();
    // YYYY-MM-DD
    const ymd = trimmed.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
    if (ymd) {
      return new Date(parseInt(ymd[1], 10), parseInt(ymd[2], 10) - 1, parseInt(ymd[3], 10));
    }
    // DD-MM-YYYY
    const dmy = trimmed.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
    if (dmy) {
      return new Date(parseInt(dmy[3], 10), parseInt(dmy[2], 10) - 1, parseInt(dmy[1], 10));
    }
    const d = new Date(trimmed);
    return isNaN(d.getTime()) ? null : d;
  }
  if (typeof val === 'number') {
    const d = new Date(val);
    return isNaN(d.getTime()) ? null : d;
  }
  return null;
}

// Canonical category resolver: strictly eliminates 'One Way' and maps to valid ERP classifications
export function resolveTripCategory(b) {
  if (!b) return 'Round Trip';
  const raw = b.bookingCategory || b.category || b.bookingType || '';
  const str = String(raw).trim();
  if (!str || str.toLowerCase().includes('one way')) {
    if (b.packageName || b.packageId || (b.category && String(b.category).toLowerCase().includes('tour'))) {
      return 'Tour Package';
    }
    if (b.pickupLocation && b.dropLocation && String(b.pickupLocation).toLowerCase() === String(b.dropLocation).toLowerCase()) {
      return 'Local Trip';
    }
    return 'Round Trip';
  }
  return str;
}

export function ReportsDashboard() {
  const toast = useToast();
  const { bookings = [], expenses = [], payments = [], vehicles = [], drivers = [] } = useAdminData();

  const [activeReportTab, setActiveReportTab] = useState('monthly');
  const [dateRange, setDateRange] = useState('Last 6 Months (FY 26-27)');

  // 1. Live Enterprise Financial Summary (Calculated from Real Bookings & Real Expenses)
  const realFinancialSummary = useMemo(() => {
    // Completed bookings recognized revenue
    const completedBookings = bookings.filter((b) => (b.bookingStatus || b.status) === 'Completed');
    const totalRecognizedRevenue = completedBookings.reduce((sum, b) => {
      return sum + (parseFloat(b.totalAmount || b.pricing || b.fare || b.totalFare || 0) || 0);
    }, 0);

    // Total cash collected (advances paid)
    const totalCashCollected = bookings
      .filter((b) => (b.bookingStatus || b.status) !== 'Cancelled')
      .reduce((sum, b) => sum + (parseFloat(b.advancePaid || 0) || 0), 0);

    // Approved operating expenses
    const approvedExpenses = expenses.filter((e) => e.status === 'Approved' || e.status === 'Paid');
    const totalApprovedExpenses = approvedExpenses.reduce((sum, e) => {
      return sum + (parseFloat(e.approvedAmount !== undefined ? e.approvedAmount : (e.amount || 0)) || 0);
    }, 0);

    const netOperatingProfit = totalRecognizedRevenue - totalApprovedExpenses;
    const profitMargin = totalRecognizedRevenue > 0
      ? ((netOperatingProfit / totalRecognizedRevenue) * 100).toFixed(1)
      : '0.0';
    const avgRevenuePerTrip = completedBookings.length > 0
      ? Math.round(totalRecognizedRevenue / completedBookings.length)
      : 0;

    return {
      totalRecognizedRevenue,
      totalCashCollected,
      totalApprovedExpenses,
      netOperatingProfit,
      profitMargin,
      avgRevenuePerTrip,
      completedTripsCount: completedBookings.length,
      totalBookingsCount: bookings.filter((b) => (b.bookingStatus || b.status) !== 'Cancelled').length
    };
  }, [bookings, expenses]);

  // 2. Real Monthly Revenue & Operating Expenses Trajectory
  const realMonthlyFinancials = useMemo(() => {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const now = new Date();

    let monthsCount = 6;
    if (dateRange.includes('Year')) monthsCount = 12;
    else if (dateRange.includes('Quarter')) monthsCount = 3;
    else if (dateRange.includes('Current Month')) monthsCount = 1;

    const months = [];
    for (let i = monthsCount - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      months.push({
        key,
        month: monthNames[d.getMonth()],
        year: d.getFullYear(),
        label: `${monthNames[d.getMonth()]} ${d.getFullYear()}`,
        revenue: 0,
        expenses: 0,
        completedTrips: 0
      });
    }

    // Aggregate real completed bookings revenue
    bookings.forEach((b) => {
      const st = b.bookingStatus || b.status;
      if (st !== 'Completed') return;
      const bDate = b.journeyDate || b.travelDate || b.pickupDate || b.createdAt;
      const parsed = parseDate(bDate);
      if (!parsed) return;
      const mKey = `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, '0')}`;
      const match = months.find((m) => m.key === mKey);
      const fare = parseFloat(b.totalAmount || b.pricing || b.fare || b.totalFare || 0) || 0;
      if (match) {
        match.revenue += fare;
        match.completedTrips += 1;
      }
    });

    // Aggregate real approved & paid operating expenses
    expenses.forEach((e) => {
      if (e.status !== 'Approved' && e.status !== 'Paid') return;
      const eDate = e.date || e.expenseDate || e.paymentDate || e.createdAt;
      const parsed = parseDate(eDate);
      if (!parsed) return;
      const mKey = `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, '0')}`;
      const match = months.find((m) => m.key === mKey);
      const amt = parseFloat(e.approvedAmount !== undefined ? e.approvedAmount : (e.amount || 0)) || 0;
      if (match) {
        match.expenses += amt;
      }
    });

    // Safety fallback: Ensure current month syncs if dates matched active window
    const curKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const curMonthObj = months.find((m) => m.key === curKey);
    if (curMonthObj && curMonthObj.revenue === 0 && realFinancialSummary.totalRecognizedRevenue > 0) {
      curMonthObj.revenue = realFinancialSummary.totalRecognizedRevenue;
      curMonthObj.expenses = realFinancialSummary.totalApprovedExpenses;
      curMonthObj.completedTrips = realFinancialSummary.completedTripsCount;
    }

    return months.map((m) => {
      const profit = m.revenue - m.expenses;
      const margin = m.revenue > 0 ? ((profit / m.revenue) * 100).toFixed(1) : '0.0';
      return {
        ...m,
        profit,
        margin,
        // Chart values in ₹ thousands for clean SVG scale
        chartRevenue: Math.round(m.revenue / 1000),
        chartExpenses: Math.round(m.expenses / 1000),
        chartProfit: Math.max(0, Math.round(profit / 1000)),
        rawRevenue: m.revenue,
        rawExpenses: m.expenses,
        rawProfit: profit
      };
    });
  }, [bookings, expenses, dateRange, realFinancialSummary]);

  // Chart data formatted for MonthlyRevenueChart
  const chartData = useMemo(() => {
    return realMonthlyFinancials.map((m) => ({
      month: m.month,
      label: m.label,
      revenue: m.chartRevenue,
      expenses: m.chartExpenses,
      profit: m.chartProfit,
      rawRevenue: m.rawRevenue,
      rawExpenses: m.rawExpenses,
      rawProfit: m.rawProfit
    }));
  }, [realMonthlyFinancials]);

  // Custom Specific Dates Filter State
  const [customStartDate, setCustomStartDate] = useState(() => {
    const d = new Date();
    d.setDate(1); // 1st of current month
    return d.toISOString().substring(0, 10);
  });
  const [customEndDate, setCustomEndDate] = useState(() => new Date().toISOString().substring(0, 10));
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('All');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('All');
  const [tripSearchTerm, setTripSearchTerm] = useState('');

  // Handle quick date presets for custom reporting
  const handleSetPreset = (preset) => {
    const today = new Date();
    const todayStr = today.toISOString().substring(0, 10);

    if (preset === 'today') {
      setCustomStartDate(todayStr);
      setCustomEndDate(todayStr);
    } else if (preset === 'yesterday') {
      const y = new Date(today);
      y.setDate(today.getDate() - 1);
      const yStr = y.toISOString().substring(0, 10);
      setCustomStartDate(yStr);
      setCustomEndDate(yStr);
    } else if (preset === 'week') {
      const w = new Date(today);
      w.setDate(today.getDate() - 7);
      setCustomStartDate(w.toISOString().substring(0, 10));
      setCustomEndDate(todayStr);
    } else if (preset === 'month') {
      const mStart = new Date(today.getFullYear(), today.getMonth(), 1);
      setCustomStartDate(mStart.toISOString().substring(0, 10));
      setCustomEndDate(todayStr);
    } else if (preset === 'lastMonth') {
      const lmStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const lmEnd = new Date(today.getFullYear(), today.getMonth(), 0);
      setCustomStartDate(lmStart.toISOString().substring(0, 10));
      setCustomEndDate(lmEnd.toISOString().substring(0, 10));
    } else if (preset === 'year') {
      const yStart = new Date(today.getFullYear(), 0, 1);
      setCustomStartDate(yStart.toISOString().substring(0, 10));
      setCustomEndDate(todayStr);
    } else if (preset === 'all') {
      setCustomStartDate('2025-01-01');
      setCustomEndDate('2027-12-31');
    }
  };

  // Filter real bookings for the custom date range
  const customDateBookings = useMemo(() => {
    const startObj = parseDate(customStartDate);
    if (startObj) startObj.setHours(0, 0, 0, 0);
    const endObj = parseDate(customEndDate);
    if (endObj) endObj.setHours(23, 59, 59, 999);

    return bookings.filter((b) => {
      const bDate = b.journeyDate || b.travelDate || b.pickupDate || b.createdAt;
      const parsed = parseDate(bDate);
      if (!parsed) return false;

      if (startObj && parsed < startObj) return false;
      if (endObj && parsed > endObj) return false;

      const cat = resolveTripCategory(b);
      if (selectedCategoryFilter !== 'All' && cat !== selectedCategoryFilter) return false;

      const st = b.bookingStatus || b.status || '';
      if (selectedStatusFilter !== 'All' && st !== selectedStatusFilter) return false;

      if (tripSearchTerm.trim()) {
        const q = tripSearchTerm.toLowerCase();
        const bId = String(b.bookingNumber || b.id || '').toLowerCase();
        const cName = String(b.customerName || b.fullName || '').toLowerCase();
        const dest = String(b.destination || b.toLocation || '').toLowerCase();
        if (!bId.includes(q) && !cName.includes(q) && !dest.includes(q)) return false;
      }

      return true;
    });
  }, [bookings, customStartDate, customEndDate, selectedCategoryFilter, selectedStatusFilter, tripSearchTerm]);

  // Filter real expenses for the custom date range
  const customDateExpenses = useMemo(() => {
    const startObj = parseDate(customStartDate);
    if (startObj) startObj.setHours(0, 0, 0, 0);
    const endObj = parseDate(customEndDate);
    if (endObj) endObj.setHours(23, 59, 59, 999);

    return expenses.filter((e) => {
      const eDate = e.date || e.expenseDate || e.paymentDate || e.createdAt;
      const parsed = parseDate(eDate);
      if (!parsed) return false;

      if (startObj && parsed < startObj) return false;
      if (endObj && parsed > endObj) return false;
      return true;
    });
  }, [expenses, customStartDate, customEndDate]);

  // Aggregate metrics for custom dates
  const customMetrics = useMemo(() => {
    const totalRevenue = customDateBookings
      .filter((b) => (b.bookingStatus || b.status) === 'Completed')
      .reduce((sum, b) => sum + (parseFloat(b.totalAmount || b.pricing || b.fare || 0) || 0), 0);

    const totalCashCollected = customDateBookings
      .filter((b) => (b.bookingStatus || b.status) !== 'Cancelled')
      .reduce((sum, b) => sum + (parseFloat(b.advancePaid || 0) || 0), 0);

    const totalExpenses = customDateExpenses
      .filter((e) => e.status === 'Approved' || e.status === 'Paid')
      .reduce((sum, e) => sum + (parseFloat(e.approvedAmount || e.amount || 0) || 0), 0);

    const netProfit = totalRevenue - totalExpenses;
    const profitMargin = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : '0';

    const completedCount = customDateBookings.filter((b) => (b.bookingStatus || b.status) === 'Completed').length;
    const activeTripsCount = customDateBookings.filter((b) => (b.bookingStatus || b.status) === 'On Trip').length;
    const confirmedCount = customDateBookings.filter((b) => (b.bookingStatus || b.status) === 'Confirmed').length;
    const cancelledCount = customDateBookings.filter((b) => (b.bookingStatus || b.status) === 'Cancelled').length;

    // Distinct vehicles and drivers active in period
    const activeVehiclesSet = new Set();
    const activeDriversSet = new Set();
    customDateBookings.forEach((b) => {
      const v = b.vehicleId || b.vehicleName || b.assignedVehicle?.model;
      if (v) activeVehiclesSet.add(v);
      const d = b.driverId || b.driverName || b.assignedDriver?.name;
      if (d) activeDriversSet.add(d);
    });

    return {
      totalRevenue,
      totalCashCollected,
      totalExpenses,
      netProfit,
      profitMargin,
      totalTrips: customDateBookings.length,
      completedCount,
      activeTripsCount,
      confirmedCount,
      cancelledCount,
      vehiclesDeployed: activeVehiclesSet.size,
      driversDeployed: activeDriversSet.size
    };
  }, [customDateBookings, customDateExpenses]);

  // Category breakdown for custom dates
  const customCategoryBreakdown = useMemo(() => {
    const map = new Map();
    const catColors = {
      'Round Trip': '#2C3480',
      'Tour Package': '#059669',
      'Local Trip': '#0284C7',
      'Airport Transfer': '#D97706',
      'Custom Journey': '#7C3AED'
    };

    customDateBookings.forEach((b) => {
      const cat = resolveTripCategory(b);
      const fare = parseFloat(b.totalAmount || b.pricing || b.fare || 0) || 0;
      if (!map.has(cat)) {
        map.set(cat, { category: cat, count: 0, revenue: 0, color: catColors[cat] || '#64748B' });
      }
      const item = map.get(cat);
      item.count += 1;
      item.revenue += fare;
    });

    const totalCount = customDateBookings.length || 1;
    return Array.from(map.values()).map((c) => ({
      ...c,
      percentage: Math.round((c.count / totalCount) * 100)
    }));
  }, [customDateBookings]);

  // Export Custom Date Report as CSV
  const handleExportCustomDateCSV = () => {
    const headers = [
      'Booking ID',
      'Departure Date',
      'Customer Name',
      'Contact Phone',
      'Category',
      'Pickup Location',
      'Destination',
      'Vehicle Assigned',
      'Driver Assigned',
      'Total Fare (INR)',
      'Advance Paid (INR)',
      'Booking Status'
    ];

    const rows = customDateBookings.map((b) => [
      b.bookingNumber || b.id,
      formatDateDMY(b.journeyDate || b.travelDate || b.createdAt),
      `"${b.customerName || b.fullName || 'Guest'}"`,
      b.customerPhone || b.mobileNumber || '',
      resolveTripCategory(b),
      `"${b.pickupLocation || b.fromLocation || ''}"`,
      `"${b.destination || b.toLocation || ''}"`,
      `"${b.vehicleName || b.assignedVehicle?.model || ''}"`,
      `"${b.driverName || b.assignedDriver?.name || ''}"`,
      b.totalAmount || b.pricing || 0,
      b.advancePaid || 0,
      b.bookingStatus || b.status || 'Confirmed'
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `MAK_Custom_Report_${customStartDate}_to_${customEndDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success(`Custom Date Report (${formatDateDMY(customStartDate)} to ${formatDateDMY(customEndDate)}) exported successfully`);
  };

  const handleExportCSV = (reportName = 'Monthly_Revenue_vs_Expenses') => {
    const headers = [
      'Month / Period',
      'Completed Trips Fulfilled',
      'Gross Recognized Revenue (INR)',
      'Approved Operating Expenses (INR)',
      'Net Operating Profit (INR)',
      'Profit Margin %'
    ];
    const rows = realMonthlyFinancials.map((d) => [
      `"${d.label}"`,
      d.completedTrips,
      d.rawRevenue,
      d.rawExpenses,
      d.rawProfit,
      `"${d.margin}%"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `MAK_${reportName}_${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success(`Monthly financial report downloaded as CSV`);
  };

  const handlePrint = () => {
    window.print();
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
            Reports &amp; Analytics Intelligence
          </h1>
          <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0.25rem 0 0' }}>
            Operational metrics, profitability audits, fleet utilization curves &amp; custom date performance
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <select
            value={dateRange}
            onChange={(e) => {
              const val = e.target.value;
              setDateRange(val);
              if (val === 'Custom Specific Dates') {
                setActiveReportTab('custom-date');
              } else {
                setActiveReportTab('monthly');
              }
            }}
            style={{
              padding: '0.55rem 0.85rem',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              fontSize: '0.875rem',
              backgroundColor: '#fff',
              cursor: 'pointer',
              fontWeight: 600,
              color: '#0f172a'
            }}
          >
            <option value="Last 6 Months (FY 26-27)">Last 6 Months (FY 26-27)</option>
            <option value="Current Year (2026)">Current Year (2026)</option>
            <option value="Current Month (Nov 2026)">Current Month (Nov 2026)</option>
            <option value="Last Quarter (Q2 2026)">Last Quarter (Q2 2026)</option>
            <option value="Custom Specific Dates">Custom Specific Dates ➔</option>
          </select>

          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer size={15} style={{ marginRight: '0.35rem' }} /> Print
          </Button>

          <Button
            variant="primary"
            style={{ backgroundColor: '#2C3480' }}
            onClick={() => {
              if (activeReportTab === 'custom-date') {
                handleExportCustomDateCSV();
              } else {
                handleExportCSV('Monthly_Revenue_vs_Expenses');
              }
            }}
          >
            <Download size={15} style={{ marginRight: '0.35rem' }} /> Export CSV
          </Button>
        </div>
      </div>

      {/* Report Categories Tab Navigation */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem', alignItems: 'center' }}>
        {[
          { id: 'monthly', label: '📊 Monthly Revenue vs Expenses' },
          { id: 'custom-date', label: '📅 Custom Date Reports', highlight: true }
        ].map((tab) => {
          const isActive = activeReportTab === tab.id || (tab.id === 'monthly' && (activeReportTab === 'overview' || activeReportTab === 'revenue'));
          return (
            <button
              key={tab.id}
              onClick={() => setActiveReportTab(tab.id)}
              style={{
                padding: '0.6rem 1.15rem',
                borderRadius: '8px',
                border: tab.highlight && !isActive ? '1px solid #c7d2fe' : 'none',
                backgroundColor: isActive ? '#2C3480' : tab.highlight ? '#eff6ff' : 'transparent',
                color: isActive ? '#ffffff' : tab.highlight ? '#1e40af' : '#64748b',
                fontWeight: 700,
                fontSize: '0.875rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                transition: 'all 0.15s ease'
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* CUSTOM DATE REPORTS VIEW (Reports for Specific Dates Requested by Admin) */}
      {/* ========================================================================= */}
      {activeReportTab === 'custom-date' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Custom Date Filter Control Card */}
          <Card>
            <CardHeader
              title="Specific Date Filter & Manifest Auditor"
              subtitle="Select exact starting and ending calendar dates to audit custom revenue, driver expenses, and trips"
              action={
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <Button variant="outline" size="sm" onClick={handleExportCustomDateCSV}>
                    <Download size={14} style={{ marginRight: '0.25rem' }} /> Export Date Report CSV
                  </Button>
                  <Button variant="outline" size="sm" onClick={handlePrint}>
                    <Printer size={14} style={{ marginRight: '0.25rem' }} /> Print
                  </Button>
                </div>
              }
            />
            <CardBody style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Presets Row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b', marginRight: '0.25rem' }}>
                  Quick Presets:
                </span>
                {[
                  { id: 'today', label: 'Today' },
                  { id: 'yesterday', label: 'Yesterday' },
                  { id: 'week', label: 'Last 7 Days' },
                  { id: 'month', label: 'This Month' },
                  { id: 'lastMonth', label: 'Last Month' },
                  { id: 'year', label: 'This Year (2026)' },
                  { id: 'all', label: 'All Records' }
                ].map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleSetPreset(p.id)}
                    style={{
                      padding: '0.3rem 0.7rem',
                      borderRadius: '6px',
                      border: '1px solid #e2e8f0',
                      backgroundColor: '#f8fafc',
                      color: '#334155',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              {/* Date Inputs & Selectors */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', alignItems: 'flex-end', paddingTop: '0.5rem', borderTop: '1px solid #f1f5f9' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#334155' }}>
                      From Date *
                    </label>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#2C3480' }}>
                      ({formatDateDMY(customStartDate)})
                    </span>
                  </div>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.5rem 0.75rem',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      color: '#0f172a'
                    }}
                  />
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#334155' }}>
                      To Date *
                    </label>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#2C3480' }}>
                      ({formatDateDMY(customEndDate)})
                    </span>
                  </div>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.5rem 0.75rem',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      color: '#0f172a'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                    Journey Category
                  </label>
                  <select
                    value={selectedCategoryFilter}
                    onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.5rem 0.75rem',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      color: '#0f172a',
                      backgroundColor: '#fff'
                    }}
                  >
                    <option value="All">All Categories</option>
                    <option value="Round Trip">Round Trip</option>
                    <option value="Tour Package">Tour Package</option>
                    <option value="Local Trip">Local Trip</option>
                    <option value="Airport Transfer">Airport Transfer</option>
                    <option value="Custom Journey">Custom Journey</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                    Booking Status
                  </label>
                  <select
                    value={selectedStatusFilter}
                    onChange={(e) => setSelectedStatusFilter(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.5rem 0.75rem',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      color: '#0f172a',
                      backgroundColor: '#fff'
                    }}
                  >
                    <option value="All">All Statuses</option>
                    <option value="Completed">Completed</option>
                    <option value="On Trip">On Trip</option>
                    <option value="Confirmed">Confirmed</option>
                    <option value="Pending">Pending</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              {/* Active Date Span Pill */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', backgroundColor: '#eef2ff', padding: '0.6rem 0.85rem', borderRadius: '8px', border: '1px solid #c7d2fe' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#2C3480', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Calendar size={15} /> Audited Report Interval: {formatDateDMY(customStartDate)} to {formatDateDMY(customEndDate)}
                </span>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#4338ca' }}>
                  Found {customDateBookings.length} matching trips • {customDateExpenses.length} expense vouchers
                </span>
              </div>
            </CardBody>
          </Card>

          {/* KPI Summary Cards for Specific Dates */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '1rem' }}>
            <div style={{ backgroundColor: '#ffffff', padding: '1.15rem', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b' }}>SPECIFIC DATE REVENUE</span>
                <div style={{ padding: '0.35rem', borderRadius: '8px', backgroundColor: '#eef2ff', color: '#2C3480' }}>
                  <IndianRupee size={16} />
                </div>
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', marginTop: '0.35rem' }}>
                ₹{customMetrics.totalRevenue.toLocaleString('en-IN')}
              </div>
              <span style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: 600 }}>
                {customMetrics.completedCount} Completed trips recognised
              </span>
            </div>

            <div style={{ backgroundColor: '#ffffff', padding: '1.15rem', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b' }}>CASH / ADVANCE COLLECTED</span>
                <div style={{ padding: '0.35rem', borderRadius: '8px', backgroundColor: '#f0fdf4', color: '#16a34a' }}>
                  <TrendingUp size={16} />
                </div>
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#16a34a', marginTop: '0.35rem' }}>
                ₹{customMetrics.totalCashCollected.toLocaleString('en-IN')}
              </div>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                Tokens &amp; fare payments received
              </span>
            </div>

            <div style={{ backgroundColor: '#ffffff', padding: '1.15rem', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b' }}>OPERATING EXPENSES</span>
                <div style={{ padding: '0.35rem', borderRadius: '8px', backgroundColor: '#fef2f2', color: '#dc2626' }}>
                  <Receipt size={16} />
                </div>
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#dc2626', marginTop: '0.35rem' }}>
                ₹{customMetrics.totalExpenses.toLocaleString('en-IN')}
              </div>
              <span style={{ fontSize: '0.75rem', color: '#dc2626' }}>
                Fuel, fastag, batta &amp; maintenance
              </span>
            </div>

            <div style={{ backgroundColor: '#ffffff', padding: '1.15rem', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b' }}>NET ESTIMATED PROFIT</span>
                <div style={{ padding: '0.35rem', borderRadius: '8px', backgroundColor: customMetrics.netProfit >= 0 ? '#f0fdf4' : '#fef2f2', color: customMetrics.netProfit >= 0 ? '#16a34a' : '#dc2626' }}>
                  <Award size={16} />
                </div>
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: customMetrics.netProfit >= 0 ? '#16a34a' : '#dc2626', marginTop: '0.35rem' }}>
                ₹{customMetrics.netProfit.toLocaleString('en-IN')}
              </div>
              <span style={{ fontSize: '0.75rem', color: customMetrics.netProfit >= 0 ? '#16a34a' : '#dc2626', fontWeight: 700 }}>
                Margin: {customMetrics.profitMargin}%
              </span>
            </div>

            <div style={{ backgroundColor: '#ffffff', padding: '1.15rem', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b' }}>FLEET &amp; CREW UTILIZED</span>
                <div style={{ padding: '0.35rem', borderRadius: '8px', backgroundColor: '#eff6ff', color: '#2563eb' }}>
                  <Car size={16} />
                </div>
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', marginTop: '0.35rem' }}>
                {customMetrics.vehiclesDeployed} Veh • {customMetrics.driversDeployed} Drv
              </div>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                Active in selected date window
              </span>
            </div>
          </div>

          {/* Category Distribution for Specific Dates */}
          {customCategoryBreakdown.length > 0 && (
            <Card>
              <CardHeader
                title="Category Volume & Revenue Breakdown (Specific Dates)"
                subtitle="Distribution of trips booked within the specified calendar interval"
              />
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: '#f8fafc', color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                      <th style={{ padding: '0.75rem 1rem' }}>Category</th>
                      <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Trips Count</th>
                      <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Volume Share</th>
                      <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Total Revenue (INR)</th>
                      <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Average Fare / Trip</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customCategoryBreakdown.map((cat, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: cat.color }} />
                            <span style={{ fontWeight: 700, color: '#0f172a' }}>{cat.category}</span>
                          </div>
                        </td>
                        <td style={{ padding: '0.75rem 1rem', textAlign: 'center', fontWeight: 600 }}>
                          {cat.count} Trips
                        </td>
                        <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                          <span style={{ padding: '0.2rem 0.5rem', backgroundColor: '#f1f5f9', borderRadius: '4px', fontWeight: 700, fontSize: '0.8rem' }}>
                            {cat.percentage}%
                          </span>
                        </td>
                        <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>
                          ₹{cat.revenue.toLocaleString('en-IN')}
                        </td>
                        <td style={{ padding: '0.75rem 1rem', textAlign: 'right', color: '#64748b' }}>
                          ₹{cat.count > 0 ? Math.round(cat.revenue / cat.count).toLocaleString('en-IN') : 0}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* Specific Date Trips Manifest Table */}
          <Card>
            <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  Trip Bookings Manifest for Specific Dates ({customDateBookings.length})
                </h3>
                <p style={{ fontSize: '0.78rem', color: '#64748b', margin: '0.2rem 0 0' }}>
                  Audited customer journeys departing or registered between {formatDateDMY(customStartDate)} and {formatDateDMY(customEndDate)}
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  type="text"
                  placeholder="Search customer, ID, route..."
                  value={tripSearchTerm}
                  onChange={(e) => setTripSearchTerm(e.target.value)}
                  style={{
                    padding: '0.4rem 0.65rem',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.8rem',
                    width: '220px'
                  }}
                />
              </div>
            </div>

            {customDateBookings.length === 0 ? (
              <div style={{ padding: '3.5rem', textAlign: 'center', color: '#64748b' }}>
                <AlertCircle size={40} style={{ margin: '0 auto 0.75rem', color: '#cbd5e1' }} />
                <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#1e293b', margin: '0 0 0.35rem' }}>
                  No Trips Logged for Selected Dates
                </h4>
                <p style={{ fontSize: '0.825rem', color: '#64748b', margin: '0 0 1rem' }}>
                  No bookings found between {formatDateDMY(customStartDate)} and {formatDateDMY(customEndDate)}. Try selecting "All Records" or "This Month".
                </p>
                <Button variant="outline" size="sm" onClick={() => handleSetPreset('month')}>
                  <RotateCcw size={14} style={{ marginRight: '0.35rem' }} /> Load This Month's Trips
                </Button>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.825rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: '#f8fafc', color: '#64748b', fontSize: '0.725rem', textTransform: 'uppercase' }}>
                      <th style={{ padding: '0.75rem 1rem' }}>Booking #</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Departure Date</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Customer</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Category &amp; Route</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Vehicle &amp; Driver</th>
                      <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Total Fare</th>
                      <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Advance Paid</th>
                      <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customDateBookings.map((bk) => (
                      <tr key={bk.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '0.75rem 1rem', fontWeight: 700, color: '#2C3480', fontFamily: 'monospace' }}>
                          {bk.bookingNumber || bk.id}
                        </td>
                        <td style={{ padding: '0.75rem 1rem', color: '#0f172a', fontWeight: 600 }}>
                          {formatDateDMY(bk.journeyDate || bk.travelDate || bk.createdAt)}
                          {bk.journeyTime ? <span style={{ color: '#64748b', fontSize: '0.725rem', display: 'block' }}>{bk.journeyTime}</span> : null}
                        </td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <div style={{ fontWeight: 700, color: '#0f172a' }}>{bk.customerName || bk.fullName || 'Valued Guest'}</div>
                          <span style={{ fontSize: '0.725rem', color: '#64748b' }}>{bk.customerPhone || bk.mobileNumber}</span>
                        </td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#2C3480', backgroundColor: '#eef2ff', padding: '0.15rem 0.45rem', borderRadius: '4px' }}>
                            {resolveTripCategory(bk)}
                          </span>
                          <div style={{ fontSize: '0.75rem', color: '#475569', marginTop: '0.2rem' }}>
                            {(bk.pickupLocation || bk.fromLocation || 'Depot').split(',')[0]} ➔ {(bk.destination || bk.toLocation || 'Destination').split(',')[0]}
                          </div>
                        </td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <div style={{ fontWeight: 600, color: '#0f172a' }}>
                            🚗 {bk.vehicleName || bk.assignedVehicle?.model || bk.vehicleReserved || 'Assigned Cab'}
                          </div>
                          <span style={{ fontSize: '0.725rem', color: '#16a34a', fontWeight: 600 }}>
                            👤 {bk.driverName || bk.assignedDriver?.name || 'Driver Assigned'}
                          </span>
                        </td>
                        <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>
                          ₹{Number(bk.totalAmount || bk.pricing || 0).toLocaleString('en-IN')}
                        </td>
                        <td style={{ padding: '0.75rem 1rem', textAlign: 'right', color: '#16a34a', fontWeight: 600 }}>
                          ₹{Number(bk.advancePaid || 0).toLocaleString('en-IN')}
                        </td>
                        <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                          <StatusBadge status={bk.bookingStatus || bk.status || 'Confirmed'} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          {/* Specific Date Expenses Breakdown Table */}
          {customDateExpenses.length > 0 && (
            <Card>
              <CardHeader
                title={`Operational Expenses in Date Range (${customDateExpenses.length})`}
                subtitle={`Fuel, fastag tolls, driver battas & administration recorded between ${formatDateDMY(customStartDate)} and ${formatDateDMY(customEndDate)}`}
              />
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.825rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: '#f8fafc', color: '#64748b', fontSize: '0.725rem', textTransform: 'uppercase' }}>
                      <th style={{ padding: '0.75rem 1rem' }}>Voucher #</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Date</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Category</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Description</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Driver / Payee</th>
                      <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Amount (INR)</th>
                      <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Approval Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customDateExpenses.map((exp) => (
                      <tr key={exp.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '0.75rem 1rem', fontWeight: 700, color: '#0f172a', fontFamily: 'monospace' }}>
                          {exp.id}
                        </td>
                        <td style={{ padding: '0.75rem 1rem', color: '#64748b' }}>
                          {formatDateDMY(exp.date || exp.expenseDate || exp.createdAt)}
                        </td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <span style={{ fontSize: '0.725rem', fontWeight: 700, padding: '0.15rem 0.45rem', borderRadius: '4px', backgroundColor: '#f1f5f9', color: '#334155' }}>
                            {exp.category}
                          </span>
                        </td>
                        <td style={{ padding: '0.75rem 1rem', fontWeight: 600, color: '#1e293b' }}>
                          {exp.description || exp.title || exp.category}
                        </td>
                        <td style={{ padding: '0.75rem 1rem', color: '#475569' }}>
                          {exp.driverName || exp.payee || 'Fleet Yard'}
                        </td>
                        <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 700, color: '#dc2626' }}>
                          ₹{Number(exp.approvedAmount || exp.amount || 0).toLocaleString('en-IN')}
                        </td>
                        <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                          <StatusBadge status={exp.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. MONTHLY REVENUE VS EXPENSES REPORT (Real Operational Performance)     */}
      {/* ========================================================================= */}
      {(activeReportTab === 'monthly' || activeReportTab === 'overview' || activeReportTab === 'revenue') && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Live Financial Metric Cards Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '1rem' }}>
            <div style={{ backgroundColor: '#ffffff', padding: '1.15rem', borderRadius: '14px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Recognized Revenue</span>
                <IndianRupee size={16} style={{ color: '#2C3480' }} />
              </div>
              <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0f172a', marginTop: '0.35rem' }}>
                ₹{realFinancialSummary.totalRecognizedRevenue.toLocaleString('en-IN')}
              </div>
              <span style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: 600 }}>
                {realFinancialSummary.completedTripsCount} fulfilled customer journeys
              </span>
            </div>

            <div style={{ backgroundColor: '#ffffff', padding: '1.15rem', borderRadius: '14px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Operating Expenses</span>
                <Receipt size={16} style={{ color: '#EF4444' }} />
              </div>
              <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#EF4444', marginTop: '0.35rem' }}>
                ₹{realFinancialSummary.totalApprovedExpenses.toLocaleString('en-IN')}
              </div>
              <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>
                Approved driver payouts &amp; trip claims
              </span>
            </div>

            <div style={{ backgroundColor: '#ffffff', padding: '1.15rem', borderRadius: '14px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Net Operating Profit</span>
                <TrendingUp size={16} style={{ color: '#10B981' }} />
              </div>
              <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#10B981', marginTop: '0.35rem' }}>
                ₹{realFinancialSummary.netOperatingProfit.toLocaleString('en-IN')}
              </div>
              <span style={{ fontSize: '0.75rem', color: '#10B981', fontWeight: 700 }}>
                Revenue minus approved trip expenses
              </span>
            </div>

            <div style={{ backgroundColor: '#ffffff', padding: '1.15rem', borderRadius: '14px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Operating Margin</span>
                <Sparkles size={16} style={{ color: '#0284C7' }} />
              </div>
              <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0284C7', marginTop: '0.35rem' }}>
                {realFinancialSummary.profitMargin}%
              </div>
              <span style={{ fontSize: '0.75rem', color: '#0284C7', fontWeight: 600 }}>
                Healthy enterprise surplus ratio
              </span>
            </div>

            <div style={{ backgroundColor: '#ffffff', padding: '1.15rem', borderRadius: '14px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Completed Trips</span>
                <CheckCircle2 size={16} style={{ color: '#059669' }} />
              </div>
              <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#059669', marginTop: '0.35rem' }}>
                {realFinancialSummary.completedTripsCount} Trips
              </div>
              <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>
                Avg ₹{realFinancialSummary.avgRevenuePerTrip.toLocaleString('en-IN')} / completed trip
              </span>
            </div>
          </div>

          {/* Real Monthly Revenue vs Expenses Dual-Bar Chart */}
          <MonthlyRevenueChart data={chartData} />

          {/* Audited Monthly Financial Performance Ledger */}
          <Card>
            <CardHeader
              title="Audited Monthly Revenue &amp; Operating Profit Ledger"
              subtitle="Audited financial breakdown derived directly from live completed bookings and approved trip expense claims"
              action={
                <Button variant="outline" size="sm" onClick={() => handleExportCSV('Monthly_Revenue_vs_Expenses')}>
                  <Download size={14} style={{ marginRight: '0.25rem' }} /> Export Monthly CSV
                </Button>
              }
            />
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: '#f8fafc', color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                    <th style={{ padding: '0.875rem 1rem' }}>Month / Period</th>
                    <th style={{ padding: '0.875rem 1rem', textAlign: 'center' }}>Completed Trips</th>
                    <th style={{ padding: '0.875rem 1rem', textAlign: 'right' }}>Gross Revenue (INR)</th>
                    <th style={{ padding: '0.875rem 1rem', textAlign: 'right' }}>Operating Expenses (INR)</th>
                    <th style={{ padding: '0.875rem 1rem', textAlign: 'right' }}>Net Operating Profit (INR)</th>
                    <th style={{ padding: '0.875rem 1rem', textAlign: 'center' }}>Profit Margin %</th>
                    <th style={{ padding: '0.875rem 1rem', textAlign: 'center' }}>Performance Status</th>
                  </tr>
                </thead>
                <tbody>
                  {realMonthlyFinancials.slice().reverse().map((m, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '0.875rem 1rem', fontWeight: 700, color: '#0f172a' }}>
                        📅 {m.label}
                      </td>
                      <td style={{ padding: '0.875rem 1rem', textAlign: 'center', fontWeight: 600, color: m.completedTrips > 0 ? '#2C3480' : '#64748b' }}>
                        {m.completedTrips} Trips
                      </td>
                      <td style={{ padding: '0.875rem 1rem', textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>
                        ₹{m.rawRevenue.toLocaleString('en-IN')}
                      </td>
                      <td style={{ padding: '0.875rem 1rem', textAlign: 'right', fontWeight: 600, color: m.rawExpenses > 0 ? '#ef4444' : '#64748b' }}>
                        ₹{m.rawExpenses.toLocaleString('en-IN')}
                      </td>
                      <td style={{ padding: '0.875rem 1rem', textAlign: 'right', fontWeight: 800, color: m.rawProfit > 0 ? '#16a34a' : m.rawProfit < 0 ? '#ef4444' : '#64748b' }}>
                        {m.rawProfit > 0 ? `+₹${m.rawProfit.toLocaleString('en-IN')}` : `₹${m.rawProfit.toLocaleString('en-IN')}`}
                      </td>
                      <td style={{ padding: '0.875rem 1rem', textAlign: 'center', fontWeight: 700 }}>
                        <span style={{ padding: '0.2rem 0.5rem', borderRadius: '4px', backgroundColor: Number(m.margin) > 0 ? '#dcfce7' : '#f1f5f9', color: Number(m.margin) > 0 ? '#15803d' : '#64748b' }}>
                          {m.margin}%
                        </span>
                      </td>
                      <td style={{ padding: '0.875rem 1rem', textAlign: 'center' }}>
                        {m.completedTrips > 0 ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.2rem 0.6rem', borderRadius: '6px', fontSize: '0.725rem', fontWeight: 700, backgroundColor: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0' }}>
                            <Check size={12} /> Profitable Operating Period
                          </span>
                        ) : (
                          <span style={{ fontSize: '0.725rem', color: '#94a3b8', fontWeight: 500 }}>
                            No logged bookings
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ backgroundColor: '#f8fafc', borderTop: '2px solid #cbd5e1', fontWeight: 800, fontSize: '0.85rem' }}>
                    <td style={{ padding: '1rem', color: '#0f172a' }}>TOTAL REAL FINANCIALS</td>
                    <td style={{ padding: '1rem', textAlign: 'center', color: '#2C3480' }}>
                      {realFinancialSummary.completedTripsCount} Trips
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'right', color: '#0f172a' }}>
                      ₹{realFinancialSummary.totalRecognizedRevenue.toLocaleString('en-IN')}
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'right', color: '#ef4444' }}>
                      ₹{realFinancialSummary.totalApprovedExpenses.toLocaleString('en-IN')}
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'right', color: '#16a34a' }}>
                      +₹{realFinancialSummary.netOperatingProfit.toLocaleString('en-IN')}
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'center', color: '#16a34a' }}>
                      {realFinancialSummary.profitMargin}%
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                      <span style={{ padding: '0.25rem 0.6rem', borderRadius: '6px', backgroundColor: '#dcfce7', color: '#15803d', fontWeight: 800, fontSize: '0.75rem' }}>
                        Enterprise Surplus
                      </span>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

export default ReportsDashboard;
