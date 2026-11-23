// MAK Tours & Travels ERP - Corporate Finance & Accounting Dashboard
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  IndianRupee,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  CreditCard,
  FileText,
  AlertTriangle,
  Receipt,
  Download,
  Calendar,
  Building,
  CheckCircle2,
  Clock,
  Plus,
  Banknote,
  Filter,
  RotateCcw,
  Fuel,
  Car,
  Wrench,
  Users,
  PieChart,
  BarChart3,
  Award,
  ExternalLink
} from 'lucide-react';
import { Card, CardHeader, CardBody } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { useAdminData } from '../../../context/AdminDataContext';
import { financeKPIs } from '../../../data';
import { formatDateDMY } from '../../../utils/dateUtils';

// Helper to reliably parse string, timestamp, or Date into a Date object
function parseDateToObj(dateVal) {
  if (!dateVal) return null;
  if (dateVal instanceof Date) return isNaN(dateVal.getTime()) ? null : dateVal;
  if (typeof dateVal === 'string') {
    const trimmed = dateVal.trim();
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
  if (typeof dateVal === 'number') {
    const d = new Date(dateVal);
    return isNaN(d.getTime()) ? null : d;
  }
  return null;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const SPEND_CATEGORY_DEFINITIONS = [
  {
    id: 'Fuel',
    label: 'Fuel',
    icon: Fuel,
    color: '#D97706',
    bgColor: '#FFFBEB',
    borderColor: '#FDE68A',
    description: 'Diesel, petrol & commercial fuel refills on transit routes'
  },
  {
    id: 'Toll / Fastag',
    label: 'Toll / Fastag',
    icon: Receipt,
    color: '#2563EB',
    bgColor: '#EFF6FF',
    borderColor: '#BFDBFE',
    description: 'NHAI Fastag highway tolls & expressway electronic plazas'
  },
  {
    id: 'Driver Allowance',
    label: 'Driver Allowance',
    icon: Users,
    color: '#10B981',
    bgColor: '#ECFDF5',
    borderColor: '#A7F3D0',
    description: 'Driver battas, night halt allowances & food compensations'
  },
  {
    id: 'Vendor Payment',
    label: 'Vendor Payment',
    icon: Building,
    color: '#7C3AED',
    bgColor: '#F5F3FF',
    borderColor: '#DDD6FE',
    description: 'Disbursements and contracted payouts to vehicle fleet vendors'
  },
  {
    id: 'Parking',
    label: 'Parking',
    icon: Car,
    color: '#0284C7',
    bgColor: '#F0F9FF',
    borderColor: '#BAE6FD',
    description: 'Airport terminal entry fees, tourist parking & station charges'
  },
  {
    id: 'Car Services & Maintenance',
    label: 'Car Services & Maintenance',
    icon: Wrench,
    color: '#DC2626',
    bgColor: '#FEF2F2',
    borderColor: '#FECACA',
    description: 'Periodic workshop servicing, oil change, tyre replacement & repairs'
  }
];

export function mapExpenseToCategory(item) {
  const cat = String(item.category || item.type || item.paymentType || '').toLowerCase();
  const sub = String(item.subCategory || '').toLowerCase();
  const desc = String(item.description || item.adminRemarks || item.notes || '').toLowerCase();
  const payee = String(item.payee || item.workshopName || item.vendorName || '').toLowerCase();
  const combined = `${cat} ${sub} ${desc} ${payee}`;

  if (combined.includes('fuel') || combined.includes('diesel') || combined.includes('petrol') || combined.includes('cng') || combined.includes('refuel')) {
    return 'Fuel';
  }
  if (combined.includes('toll') || combined.includes('fastag') || combined.includes('expressway') || combined.includes('nhai')) {
    return 'Toll / Fastag';
  }
  if (combined.includes('driver allowance') || combined.includes('batta') || combined.includes('night stay') || combined.includes('driver salary') || combined.includes('driver food')) {
    return 'Driver Allowance';
  }
  if (combined.includes('vendor') || combined.includes('payout') || combined.includes('partner') || cat === 'vendor payment' || cat === 'vendor charges') {
    return 'Vendor Payment';
  }
  if (combined.includes('parking') || combined.includes('airport parking') || combined.includes('valet')) {
    return 'Parking';
  }
  if (combined.includes('maintenance') || combined.includes('service') || combined.includes('repair') || combined.includes('tyre') || combined.includes('brake') || combined.includes('clutch') || combined.includes('workshop') || combined.includes('car service') || combined.includes('engine')) {
    return 'Car Services & Maintenance';
  }
  return 'Car Services & Maintenance';
}

export function FinanceDashboard() {
  const navigate = useNavigate();
  const { payments = [], invoices = [], expenses = [], bookings = [], financialMetrics = {} } = useAdminData();

  const [activeTab, setActiveTab] = useState('recent-payments');
  const [selectedExpenseCat, setSelectedExpenseCat] = useState('All');

  // Time Period Filter State: 'all' | 'weekly' | 'monthly' | 'yearly' | 'custom'
  const [periodFilter, setPeriodFilter] = useState('all');
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().getMonth()); // 0-11
  const [selectedYear, setSelectedYear] = useState(() => new Date().getFullYear()); // e.g. 2026
  const [customStartDate, setCustomStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().substring(0, 10);
  });
  const [customEndDate, setCustomEndDate] = useState(() => new Date().toISOString().substring(0, 10));

  // Determine if a given date falls inside the selected period filter
  const isDateInPeriod = useMemo(() => {
    return (dateVal) => {
      if (periodFilter === 'all') return true;
      const d = parseDateToObj(dateVal);
      if (!d) return false;

      const today = new Date();

      if (periodFilter === 'weekly') {
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - 7);
        weekStart.setHours(0, 0, 0, 0);

        const weekEnd = new Date(today);
        weekEnd.setHours(23, 59, 59, 999);

        return d >= weekStart && d <= weekEnd;
      }

      if (periodFilter === 'monthly') {
        return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
      }

      if (periodFilter === 'yearly') {
        return d.getFullYear() === selectedYear;
      }

      if (periodFilter === 'custom') {
        const cStart = parseDateToObj(customStartDate);
        if (cStart) cStart.setHours(0, 0, 0, 0);
        const cEnd = parseDateToObj(customEndDate);
        if (cEnd) cEnd.setHours(23, 59, 59, 999);
        return (!cStart || d >= cStart) && (!cEnd || d <= cEnd);
      }

      return true;
    };
  }, [periodFilter, selectedMonth, selectedYear, customStartDate, customEndDate]);

  // Filter Bookings, Expenses, Payments, and Invoices
  const filteredBookings = useMemo(() => {
    if (periodFilter === 'all') return bookings;
    return bookings.filter((b) => {
      const dateVal = b.tripCompletedAt || b.completedAt || b.returnDate || b.journeyDate || b.travelDate || b.createdAt;
      return isDateInPeriod(dateVal);
    });
  }, [bookings, periodFilter, isDateInPeriod]);

  const filteredExpenses = useMemo(() => {
    if (periodFilter === 'all') return expenses;
    return expenses.filter((e) => {
      const dateVal = e.paymentDate || e.approvalDate || e.expenseDate || e.date || e.createdAt;
      return isDateInPeriod(dateVal);
    });
  }, [expenses, periodFilter, isDateInPeriod]);

  const filteredPayments = useMemo(() => {
    if (periodFilter === 'all') return payments;
    return payments.filter((p) => {
      const dateVal = p.date || p.paymentDate || p.createdAt;
      return isDateInPeriod(dateVal);
    });
  }, [payments, periodFilter, isDateInPeriod]);

  const filteredInvoices = useMemo(() => {
    if (periodFilter === 'all') return invoices;
    return invoices.filter((inv) => {
      const dateVal = inv.date || inv.invoiceDate || inv.createdAt;
      return isDateInPeriod(dateVal);
    });
  }, [invoices, periodFilter, isDateInPeriod]);

  // Compute live aggregates dynamically based on filtered records
  const {
    recognisedRevenue,
    totalRevenueCollected,
    totalOperatingExpenses,
    netProfit,
    totalOutstandingReceivables,
    vendorPayables,
    vendorPayoutsTotal,
    driverSalariesTotal,
    operationalTripExpenses,
    profitMargin
  } = useMemo(() => {
    // If 'all' is selected, align with shared context metrics as authoritative baseline
    if (periodFilter === 'all' && financialMetrics?.recognisedRevenue !== undefined) {
      const recRev = financialMetrics?.recognisedRevenue || 0;
      const opExp = financialMetrics?.totalOperatingExpenses || 0;
      const np = financialMetrics?.netProfit || (recRev - opExp);
      return {
        recognisedRevenue: recRev,
        totalRevenueCollected: financialMetrics?.cashCollected || 0,
        totalOperatingExpenses: opExp,
        netProfit: np,
        totalOutstandingReceivables: financialMetrics?.receivables || 0,
        vendorPayables: financialMetrics?.vendorPayables || 0,
        vendorPayoutsTotal: financialMetrics?.vendorPayoutsTotal || 0,
        driverSalariesTotal: financialMetrics?.driverSalariesTotal || 0,
        operationalTripExpenses: financialMetrics?.operationalTripExpenses || 0,
        profitMargin: recRev > 0 ? ((np / recRev) * 100).toFixed(1) : '0'
      };
    }

    // Dynamic calculations for Weekly / Monthly / Yearly / Custom periods
    const recRev = filteredBookings
      .filter((b) => b.bookingStatus === 'Completed')
      .reduce((sum, b) => sum + (parseFloat(b.amountPaid ?? b.advancePaid ?? 0) || 0), 0);

    const cashColl = filteredBookings
      .filter((b) => b.bookingStatus !== 'Cancelled')
      .reduce((sum, b) => sum + (parseFloat(b.amountPaid ?? b.advancePaid ?? 0) || 0), 0);

    const rec = filteredBookings
      .filter((b) => b.bookingStatus === 'Completed')
      .reduce((sum, b) => {
        const tot = parseFloat(b.totalAmount || b.pricing || b.fare || 0) || 0;
        const pd = parseFloat(b.amountPaid ?? b.advancePaid ?? 0) || 0;
        const bal = b.balanceAmount !== undefined && b.balanceAmount !== null && !isNaN(Number(b.balanceAmount))
          ? parseFloat(b.balanceAmount)
          : Math.max(0, tot - pd);
        return sum + Math.max(0, bal);
      }, 0);

    const approvedTrip = filteredExpenses
      .filter((e) => e.bookingId && (e.status === 'Approved' || e.status === 'Paid'))
      .reduce((sum, e) => sum + (parseFloat(e.approvedAmount || e.amount || 0) || 0), 0);

    const approvedOffice = filteredExpenses
      .filter((e) => !e.bookingId && (e.status === 'Approved' || e.status === 'Paid'))
      .reduce((sum, e) => sum + (parseFloat(e.approvedAmount || e.amount || 0) || 0), 0);

    const opExp = approvedTrip + approvedOffice;
    const np = recRev - opExp;

    const vPayouts = filteredExpenses
      .filter((e) => e.category === 'Vendor Payout' && (e.status === 'Approved' || e.status === 'Paid'))
      .reduce((sum, e) => sum + (parseFloat(e.approvedAmount || e.amount || 0) || 0), 0);

    const dSalaries = filteredExpenses
      .filter((e) => (e.category === 'Driver Salary' || e.category === 'Driver Allowance') && (e.status === 'Approved' || e.status === 'Paid'))
      .reduce((sum, e) => sum + (parseFloat(e.approvedAmount || e.amount || 0) || 0), 0);

    const opTripExp = filteredExpenses
      .filter((e) => e.category !== 'Vendor Payout' && e.category !== 'Driver Salary' && e.bookingId && (e.status === 'Approved' || e.status === 'Paid'))
      .reduce((sum, e) => sum + (parseFloat(e.approvedAmount || e.amount || 0) || 0), 0);

    // Vendor payables calculation
    const vendorExpensesCost = filteredExpenses
      .filter((e) => e.category === 'Vendor Payout')
      .reduce((sum, e) => sum + (parseFloat(e.approvedAmount || e.amount || 0) || 0), 0);

    const fallbackVendorCost = filteredBookings
      .filter((b) => b.bookingStatus === 'Completed' && (b.vendorId || b.isVendorVehicle || b.assignedVehicle?.isVendorVehicle || b.assignedVehicle?.vendorId))
      .reduce((sum, b) => {
        const vPay = b.vendorPayableAmount || (b.vendorPayoutPercent ? (Number(b.totalAmount || b.pricing || 0) * Number(b.vendorPayoutPercent) / 100) : 0);
        return sum + (parseFloat(vPay) || 0);
      }, 0);

    const completedVendorCost = Math.max(vendorExpensesCost, fallbackVendorCost);
    const vendorPaymentsMade = filteredPayments
      .filter((p) => p.paymentType === 'Vendor Payment' || p.type === 'Vendor Payment' || p.paymentType === 'Vendor Payout')
      .reduce((sum, p) => sum + (parseFloat(p.amount || 0) || 0), 0);
    const vPayables = Math.max(0, completedVendorCost - vendorPaymentsMade);

    const margin = recRev > 0 ? ((np / recRev) * 100).toFixed(1) : '0';

    return {
      recognisedRevenue: recRev,
      totalRevenueCollected: cashColl,
      totalOperatingExpenses: opExp,
      netProfit: np,
      totalOutstandingReceivables: rec,
      vendorPayables: vPayables,
      vendorPayoutsTotal: vPayouts,
      driverSalariesTotal: dSalaries,
      operationalTripExpenses: opTripExp,
      profitMargin: margin
    };
  }, [filteredBookings, filteredExpenses, filteredPayments, periodFilter, financialMetrics]);

  // Formatted label describing active date span
  const activeDateLabel = useMemo(() => {
    if (periodFilter === 'all') return 'All-Time Financial Ledger';
    if (periodFilter === 'weekly') {
      const today = new Date();
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - 7);
      return `Weekly: ${formatDateDMY(weekStart)} to ${formatDateDMY(today)}`;
    }
    if (periodFilter === 'monthly') {
      const monthStart = new Date(selectedYear, selectedMonth, 1);
      const monthEnd = new Date(selectedYear, selectedMonth + 1, 0);
      return `Monthly: ${MONTH_NAMES[selectedMonth]} ${selectedYear} (${formatDateDMY(monthStart)} to ${formatDateDMY(monthEnd)})`;
    }
    if (periodFilter === 'yearly') {
      return `Yearly: ${selectedYear} (01-01-${selectedYear} to 31-12-${selectedYear})`;
    }
    if (periodFilter === 'custom') {
      return `Custom: ${formatDateDMY(customStartDate)} to ${formatDateDMY(customEndDate)}`;
    }
    return '';
  }, [periodFilter, selectedMonth, selectedYear, customStartDate, customEndDate]);

  // Operational Expense Category Analytics & Spend Breakdown (Fuel, Toll, Allowance, Vendor, Parking, Maintenance)
  const categoryAnalyticsData = useMemo(() => {
    const recordsByCat = {
      'Fuel': [],
      'Toll / Fastag': [],
      'Driver Allowance': [],
      'Vendor Payment': [],
      'Parking': [],
      'Car Services & Maintenance': []
    };

    // 1. Map filtered expenses
    (filteredExpenses || []).forEach((exp) => {
      const catId = mapExpenseToCategory(exp);
      if (recordsByCat[catId]) {
        recordsByCat[catId].push({
          id: exp.id || exp._id,
          date: exp.expenseDate || exp.date || exp.createdAt,
          category: catId,
          subCategory: exp.subCategory || exp.category,
          description: exp.description || exp.notes || `${catId} operational voucher`,
          amount: Number(exp.approvedAmount || exp.amount || 0),
          status: exp.status || 'Approved',
          payee: exp.payee || exp.workshopName || exp.driverName || 'Fleet Operations',
          vehicle: exp.vehicleRegNo || exp.vehicleNumber || exp.vehicleModel || (exp.bookingId ? `Booking #${exp.bookingNumber || exp.bookingId}` : 'Depot Fleet'),
          source: 'Expense Voucher',
          raw: exp
        });
      }
    });

    // 2. Map vendor payments from filteredPayments if not already in expenses
    const existingExpenseIds = new Set((filteredExpenses || []).map((e) => String(e.id || e._id)));
    (filteredPayments || []).forEach((pay) => {
      const isVendorPay = pay.type === 'Vendor Payment' || pay.paymentType === 'Vendor Payment' || pay.paymentType === 'Vendor Payout';
      const pId = String(pay.id || pay._id || pay.paymentNumber);
      if (isVendorPay && !existingExpenseIds.has(pId)) {
        recordsByCat['Vendor Payment'].push({
          id: pId,
          date: pay.date || pay.createdAt,
          category: 'Vendor Payment',
          subCategory: 'Vendor Fleet Disbursement',
          description: pay.notes || pay.description || 'Vendor vehicle contracted disbursement',
          amount: Number(pay.amount || 0),
          status: pay.status || 'Completed',
          payee: pay.partyName || pay.vendorName || 'Fleet Partner Vendor',
          vehicle: pay.bookingNumber || pay.bookingId ? `Booking #${pay.bookingNumber || pay.bookingId}` : 'Fleet Partner',
          source: 'Payment Voucher',
          raw: pay
        });
      }
    });

    // Calculate sum across all categories
    let totalAllCategoriesSpend = 0;
    const categoriesWithStats = SPEND_CATEGORY_DEFINITIONS.map((def) => {
      const list = recordsByCat[def.id] || [];
      const totalAmount = list.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
      totalAllCategoriesSpend += totalAmount;
      return {
        ...def,
        totalAmount,
        count: list.length,
        items: list
      };
    });

    // Compute percentage and rank
    const categoriesWithPercentages = categoriesWithStats.map((cat) => {
      const pct = totalAllCategoriesSpend > 0 ? ((cat.totalAmount / totalAllCategoriesSpend) * 100).toFixed(1) : '0';
      return {
        ...cat,
        percentage: parseFloat(pct)
      };
    });

    const rankedCategories = [...categoriesWithPercentages].sort((a, b) => b.totalAmount - a.totalAmount);
    const highestSpendCategory = rankedCategories[0] && rankedCategories[0].totalAmount > 0 ? rankedCategories[0] : rankedCategories[0];

    // Filter items based on selectedExpenseCat
    let activeItems = [];
    if (selectedExpenseCat === 'All') {
      activeItems = Object.values(recordsByCat).flat().sort((a, b) => (Number(b.amount) || 0) - (Number(a.amount) || 0));
    } else {
      activeItems = (recordsByCat[selectedExpenseCat] || []).sort((a, b) => (Number(b.amount) || 0) - (Number(a.amount) || 0));
    }

    const selectedCategoryStats = selectedExpenseCat === 'All'
      ? {
          id: 'All',
          label: 'All Expense Categories',
          totalAmount: totalAllCategoriesSpend,
          count: activeItems.length,
          percentage: 100
        }
      : categoriesWithPercentages.find((c) => c.id === selectedExpenseCat) || {
          id: selectedExpenseCat,
          label: selectedExpenseCat,
          totalAmount: 0,
          count: 0,
          percentage: 0
        };

    return {
      categories: categoriesWithPercentages,
      rankedCategories,
      highestSpendCategory,
      totalAllCategoriesSpend,
      activeItems,
      selectedCategoryStats
    };
  }, [filteredExpenses, filteredPayments, selectedExpenseCat]);

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
            Finance & Accounts Command Center
          </h1>
          <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0.25rem 0 0' }}>
            Revenues, customer collections, fleet operating expenses & GST tax compliance
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <Button variant="outline" size="sm" onClick={() => navigate('/admin/payroll')}>
            <Banknote size={15} style={{ marginRight: '0.35rem' }} /> Payroll System
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate('/admin/expenses')}>
            <Receipt size={15} style={{ marginRight: '0.35rem' }} /> Expense Tracker
          </Button>
          <Button
            variant="primary"
            style={{ backgroundColor: '#2C3480' }}
            onClick={() => navigate('/admin/payments')}
          >
            <CreditCard size={15} style={{ marginRight: '0.35rem' }} /> Payment Ledger
          </Button>
        </div>
      </div>

      {/* Time Period Filter Bar (Weekly / Monthly / Yearly / All Time) */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          backgroundColor: '#ffffff',
          padding: '1rem 1.25rem',
          borderRadius: '14px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.825rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.4rem', marginRight: '0.25rem' }}>
            <Calendar size={16} color="#2C3480" /> Time Period:
          </span>

          {[
            { id: 'all', label: 'All Time' },
            { id: 'weekly', label: 'Weekly (Last 7 Days)' },
            { id: 'monthly', label: 'Monthly' },
            { id: 'yearly', label: 'Yearly' },
            { id: 'custom', label: 'Custom Range' }
          ].map((tab) => {
            const isActive = periodFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setPeriodFilter(tab.id)}
                style={{
                  padding: '0.45rem 0.95rem',
                  borderRadius: '8px',
                  border: isActive ? '1px solid #2C3480' : '1px solid #e2e8f0',
                  backgroundColor: isActive ? '#2C3480' : '#f8fafc',
                  color: isActive ? '#ffffff' : '#475569',
                  fontWeight: 700,
                  fontSize: '0.8rem',
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

        {/* Dynamic Contextual Selectors (Month picker, Year picker, Custom date picker) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          {periodFilter === 'monthly' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                style={{
                  padding: '0.4rem 0.65rem',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  color: '#0f172a',
                  backgroundColor: '#ffffff',
                  cursor: 'pointer'
                }}
              >
                {MONTH_NAMES.map((m, idx) => (
                  <option key={m} value={idx}>{m}</option>
                ))}
              </select>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                style={{
                  padding: '0.4rem 0.65rem',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  color: '#0f172a',
                  backgroundColor: '#ffffff',
                  cursor: 'pointer'
                }}
              >
                {[2027, 2026, 2025, 2024].map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          )}

          {periodFilter === 'yearly' && (
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              style={{
                padding: '0.4rem 0.75rem',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '0.8rem',
                fontWeight: 700,
                color: '#0f172a',
                backgroundColor: '#ffffff',
                cursor: 'pointer'
              }}
            >
              {[2027, 2026, 2025, 2024].map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          )}

          {periodFilter === 'custom' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem' }}>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                style={{
                  padding: '0.35rem 0.5rem',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.8rem',
                  fontFamily: 'inherit'
                }}
              />
              <span style={{ color: '#94a3b8', fontWeight: 600 }}>to</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                style={{
                  padding: '0.35rem 0.5rem',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.8rem',
                  fontFamily: 'inherit'
                }}
              />
            </div>
          )}

          {/* Active Period & Records Badge */}
          <span
            style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              color: '#2C3480',
              backgroundColor: '#eef2ff',
              padding: '0.35rem 0.65rem',
              borderRadius: '8px',
              border: '1px solid #c7d2fe',
              whiteSpace: 'nowrap'
            }}
          >
            {activeDateLabel} • {filteredBookings.length} Trips • {filteredExpenses.length} Expenses
          </span>

          {periodFilter !== 'all' && (
            <button
              type="button"
              onClick={() => setPeriodFilter('all')}
              title="Reset to All-Time"
              style={{
                border: 'none',
                background: '#f1f5f9',
                color: '#64748b',
                padding: '0.35rem 0.55rem',
                borderRadius: '6px',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem'
              }}
            >
              <RotateCcw size={12} /> Reset
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        <div style={{ backgroundColor: '#ffffff', padding: '1.15rem', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b' }}>RECOGNISED REVENUE</span>
            <div style={{ padding: '0.4rem', borderRadius: '8px', backgroundColor: '#eef2ff', color: '#2C3480' }}>
              <IndianRupee size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0f172a', marginTop: '0.4rem' }}>
            ₹{recognisedRevenue.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#16a34a', display: 'flex', alignItems: 'center', gap: '0.2rem', marginTop: '0.25rem' }}>
            <TrendingUp size={13} /> Completed trip recognition ({periodFilter})
          </div>
        </div>

        <div style={{ backgroundColor: '#ffffff', padding: '1.15rem', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b' }}>OPERATING EXPENSES</span>
            <div style={{ padding: '0.4rem', borderRadius: '8px', backgroundColor: '#fef2f2', color: '#dc2626' }}>
              <Receipt size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#dc2626', marginTop: '0.4rem' }}>
            ₹{totalOperatingExpenses.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
            Approved trip and operational expenses
          </div>
        </div>

        <div style={{ backgroundColor: '#ffffff', padding: '1.15rem', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b' }}>NET EARNINGS</span>
            <div style={{ padding: '0.4rem', borderRadius: '8px', backgroundColor: '#f0fdf4', color: '#16a34a' }}>
              <TrendingUp size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: netProfit >= 0 ? '#16a34a' : '#dc2626', marginTop: '0.4rem' }}>
            ₹{netProfit.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#16a34a', marginTop: '0.25rem' }}>
            Recognised revenue minus approved expenses
          </div>
        </div>

        <div style={{ backgroundColor: '#ffffff', padding: '1.15rem', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b' }}>BENDINGS / PENDING AMOUNT</span>
            <div style={{ padding: '0.4rem', borderRadius: '8px', backgroundColor: '#fff7ed', color: '#ea580c' }}>
              <AlertTriangle size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#ea580c', marginTop: '0.4rem' }}>
            ₹{totalOutstandingReceivables.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#ea580c', marginTop: '0.25rem' }}>
            Pending balance collection on completed trips
          </div>
        </div>

        <div style={{ backgroundColor: '#ffffff', padding: '1.15rem', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b' }}>VENDOR PAYABLES</span>
            <div style={{ padding: '0.4rem', borderRadius: '8px', backgroundColor: '#f5f3ff', color: '#7c3aed' }}>
              <CreditCard size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0f172a', marginTop: '0.4rem' }}>
            ₹{vendorPayables.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
            Completed vendor bookings minus payouts
          </div>
        </div>
      </div>

      {/* Commercial P&L Waterfall Breakdown Card */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          padding: '1.5rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <TrendingUp size={20} color="#2C3480" />
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                Commercial P&L Ledger (Income, Expenses, Driver Salary &amp; Profit)
              </h2>
            </div>
            <p style={{ fontSize: '0.8125rem', color: '#64748b', margin: '0.25rem 0 0' }}>
              Centralized financial breakdown of completed booking revenues, vendor vehicle payouts, and driver compensations for {periodFilter === 'all' ? 'All-Time' : activeDateLabel}
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, padding: '0.35rem 0.75rem', borderRadius: '20px', backgroundColor: '#ecfdf5', color: '#065f46', border: '1px solid #a7f3d0' }}>
              Net Margin: {profitMargin}%
            </span>
            <button
              onClick={() => navigate('/admin/vendors')}
              style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                color: '#2C3480',
                background: '#eef2ff',
                border: '1px solid #c7d2fe',
                padding: '0.35rem 0.75rem',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
            >
              Configure Vendor % &amp; Driver Rates &rarr;
            </button>
          </div>
        </div>

        {/* Detailed Waterfall Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '1rem' }}>
          {/* 1. Income (Revenue) */}
          <div style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '1rem' }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#0369A1', textTransform: 'uppercase', display: 'block' }}>
              1. TOTAL INCOME (REVENUE)
            </span>
            <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0284C7', marginTop: '0.25rem' }}>
              ₹{recognisedRevenue.toLocaleString('en-IN')}
            </div>
            <span style={{ fontSize: '0.72rem', color: '#64748B', marginTop: '0.25rem', display: 'block' }}>
              Completed customer trip fares
            </span>
          </div>

          {/* 2. Vendor Payout Expenses */}
          <div style={{ backgroundColor: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '12px', padding: '1rem' }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#92400E', textTransform: 'uppercase', display: 'block' }}>
              2. VENDOR VEHICLE PAYOUTS
            </span>
            <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#B45309', marginTop: '0.25rem' }}>
              - ₹{vendorPayoutsTotal.toLocaleString('en-IN')}
            </div>
            <span style={{ fontSize: '0.72rem', color: '#92400E', marginTop: '0.25rem', display: 'block' }}>
              Vendor partner % disbursements
            </span>
          </div>

          {/* 3. Driver Salary & Compensations */}
          <div style={{ backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '12px', padding: '1rem' }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#166534', textTransform: 'uppercase', display: 'block' }}>
              3. DRIVER COMPENSATIONS
            </span>
            <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#16A34A', marginTop: '0.25rem' }}>
              - ₹{driverSalariesTotal.toLocaleString('en-IN')}
            </div>
            <span style={{ fontSize: '0.72rem', color: '#15803D', marginTop: '0.25rem', display: 'block' }}>
              Fixed ₹ for Round Trips &amp; Tours
            </span>
          </div>

          {/* 4. Tolls, Fuel & Operations */}
          <div style={{ backgroundColor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '12px', padding: '1rem' }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#991B1B', textTransform: 'uppercase', display: 'block' }}>
              4. TRIP OPERATING EXPENSES
            </span>
            <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#DC2626', marginTop: '0.25rem' }}>
              - ₹{operationalTripExpenses.toLocaleString('en-IN')}
            </div>
            <span style={{ fontSize: '0.72rem', color: '#991B1B', marginTop: '0.25rem', display: 'block' }}>
              Fuel, fastag tolls &amp; parking claims
            </span>
          </div>

          {/* 5. Net Profit */}
          <div style={{ backgroundColor: netProfit >= 0 ? '#F0FDF4' : '#FEF2F2', border: `1.5px solid ${netProfit >= 0 ? '#86EFAC' : '#FCA5A5'}`, borderRadius: '12px', padding: '1rem' }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: netProfit >= 0 ? '#166534' : '#991B1B', textTransform: 'uppercase', display: 'block' }}>
              5. NET OPERATING PROFIT
            </span>
            <div style={{ fontSize: '1.45rem', fontWeight: 800, color: netProfit >= 0 ? '#15803D' : '#DC2626', marginTop: '0.25rem' }}>
              ₹{netProfit.toLocaleString('en-IN')}
            </div>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: netProfit >= 0 ? '#16A34A' : '#DC2626', marginTop: '0.25rem', display: 'block' }}>
              Income minus all operating expenses
            </span>
          </div>
        </div>
      </div>

      {/* SECTION: OPERATIONAL EXPENSE CATEGORY ANALYTICS & SPEND BREAKDOWN */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          padding: '1.5rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem'
        }}
      >
        {/* Module Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <PieChart size={20} color="#2C3480" />
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                Operational Expense Category Analytics &amp; Spend Breakdown
              </h2>
            </div>
            <p style={{ fontSize: '0.8125rem', color: '#64748b', margin: '0.25rem 0 0' }}>
              Audit expenditure across Fuel, Toll, Driver Allowance, Vendor Payments, Parking &amp; Car Services ({periodFilter === 'all' ? 'All-Time' : activeDateLabel})
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate('/admin/expenses')}
              style={{ fontSize: '0.8125rem', fontWeight: 600 }}
            >
              <Receipt size={14} style={{ marginRight: '0.35rem' }} /> Manage Expense Vouchers &rarr;
            </Button>
          </div>
        </div>

        {/* Highlight Banner: Highest Spend Category Spotlight */}
        {categoryAnalyticsData.highestSpendCategory && categoryAnalyticsData.totalAllCategoriesSpend > 0 ? (
          <div
            style={{
              backgroundColor: '#fffbeb',
              border: '1.5px solid #fde68a',
              borderRadius: '12px',
              padding: '1rem 1.25rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '1rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '10px',
                  backgroundColor: '#fef3c7',
                  border: '1px solid #fcd34d',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#b45309',
                  flexShrink: 0
                }}
              >
                <Award size={22} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#b45309' }}>
                    Highest Spend Category Identified
                  </span>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, backgroundColor: '#fef3c7', color: '#92400e', padding: '0.1rem 0.5rem', borderRadius: '12px', border: '1px solid #fde68a' }}>
                    {categoryAnalyticsData.highestSpendCategory.percentage}% of all expenses
                  </span>
                </div>
                <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#78350f', marginTop: '0.15rem' }}>
                  {categoryAnalyticsData.highestSpendCategory.label}: ₹{categoryAnalyticsData.highestSpendCategory.totalAmount.toLocaleString('en-IN')}
                </div>
                <div style={{ fontSize: '0.78rem', color: '#92400e', marginTop: '0.1rem' }}>
                  {categoryAnalyticsData.highestSpendCategory.description} ({categoryAnalyticsData.highestSpendCategory.count} vouchers processed)
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSelectedExpenseCat(categoryAnalyticsData.highestSpendCategory.id)}
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid #fcd34d',
                color: '#b45309',
                padding: '0.45rem 0.85rem',
                borderRadius: '8px',
                fontSize: '0.8125rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
              }}
            >
              Filter this category &rarr;
            </button>
          </div>
        ) : null}

        {/* Multi-Color Category Distribution Meter Bar */}
        {categoryAnalyticsData.totalAllCategoriesSpend > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>
              <span>Relative Spending Distribution (% share)</span>
              <span>Total Operating Spend: <strong>₹{categoryAnalyticsData.totalAllCategoriesSpend.toLocaleString('en-IN')}</strong></span>
            </div>
            <div style={{ width: '100%', height: '12px', borderRadius: '6px', overflow: 'hidden', display: 'flex', backgroundColor: '#f1f5f9' }}>
              {categoryAnalyticsData.rankedCategories.map((cat) => {
                if (cat.percentage <= 0) return null;
                return (
                  <div
                    key={cat.id}
                    title={`${cat.label}: ₹${cat.totalAmount.toLocaleString('en-IN')} (${cat.percentage}%)`}
                    style={{
                      width: `${cat.percentage}%`,
                      backgroundColor: cat.color,
                      height: '100%',
                      transition: 'width 0.3s ease'
                    }}
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* 6 Category Spending Cards Grid (Ranked from highest to lowest) */}
        <div>
          <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.75rem' }}>
            Spend by Category &bull; Click any category to drill down
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.875rem' }}>
            {categoryAnalyticsData.rankedCategories.map((cat, idx) => {
              const Icon = cat.icon;
              const isSelected = selectedExpenseCat === cat.id;
              const isHighest = idx === 0 && cat.totalAmount > 0;

              return (
                <div
                  key={cat.id}
                  onClick={() => setSelectedExpenseCat(isSelected ? 'All' : cat.id)}
                  title={`Click to view ${cat.label} vouchers`}
                  style={{
                    backgroundColor: isSelected ? cat.bgColor : '#f8fafc',
                    border: `1.5px solid ${isSelected ? cat.color : isHighest ? '#fde68a' : '#e2e8f0'}`,
                    borderRadius: '12px',
                    padding: '0.875rem',
                    cursor: 'pointer',
                    transition: 'all 0.18s ease',
                    position: 'relative'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 6px 14px rgba(0,0,0,0.06)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'none';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <div
                        style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '6px',
                          backgroundColor: `${cat.color}18`,
                          color: cat.color,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <Icon size={14} />
                      </div>
                      <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#64748b' }}>
                        #{idx + 1}
                      </span>
                    </div>

                    <span
                      style={{
                        fontSize: '0.6875rem',
                        fontWeight: 800,
                        color: cat.color,
                        backgroundColor: `${cat.color}15`,
                        padding: '0.1rem 0.4rem',
                        borderRadius: '4px'
                      }}
                    >
                      {cat.percentage}%
                    </span>
                  </div>

                  <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {cat.label}
                  </div>

                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: cat.totalAmount > 0 ? '#0f172a' : '#94a3b8', marginTop: '0.2rem' }}>
                    ₹{cat.totalAmount.toLocaleString('en-IN')}
                  </div>

                  <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '0.2rem' }}>
                    {cat.count} {cat.count === 1 ? 'voucher' : 'vouchers'} logged
                  </div>

                  {/* Progress bar */}
                  <div style={{ width: '100%', height: '4px', backgroundColor: '#e2e8f0', borderRadius: '2px', marginTop: '0.5rem', overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${Math.min(100, cat.percentage)}%`,
                        height: '100%',
                        backgroundColor: cat.color
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Category Filter Selector Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', paddingTop: '0.75rem', borderTop: '1px solid #f1f5f9' }}>
          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b', marginRight: '0.25rem' }}>
            Filter Category:
          </span>

          <button
            type="button"
            onClick={() => setSelectedExpenseCat('All')}
            style={{
              padding: '0.4rem 0.8rem',
              borderRadius: '20px',
              border: selectedExpenseCat === 'All' ? '1.5px solid #2C3480' : '1px solid #cbd5e1',
              backgroundColor: selectedExpenseCat === 'All' ? '#2C3480' : '#ffffff',
              color: selectedExpenseCat === 'All' ? '#ffffff' : '#475569',
              fontSize: '0.75rem',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            All Categories (₹{categoryAnalyticsData.totalAllCategoriesSpend.toLocaleString('en-IN')})
          </button>

          {SPEND_CATEGORY_DEFINITIONS.map((def) => {
            const isSelected = selectedExpenseCat === def.id;
            const stat = categoryAnalyticsData.categories.find((c) => c.id === def.id);
            const amt = stat ? stat.totalAmount : 0;
            return (
              <button
                key={def.id}
                type="button"
                onClick={() => setSelectedExpenseCat(def.id)}
                style={{
                  padding: '0.4rem 0.8rem',
                  borderRadius: '20px',
                  border: isSelected ? `1.5px solid ${def.color}` : '1px solid #cbd5e1',
                  backgroundColor: isSelected ? def.color : '#ffffff',
                  color: isSelected ? '#ffffff' : '#475569',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {def.label} (₹{amt.toLocaleString('en-IN')})
              </button>
            );
          })}
        </div>

        {/* Selected Category Drill-Down Details & Vouchers */}
        <div style={{ backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.875rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div>
              <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0f172a' }}>
                {categoryAnalyticsData.selectedCategoryStats.label} Breakdown
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                Showing {categoryAnalyticsData.activeItems.length} matching expense vouchers &bull; Total: ₹{categoryAnalyticsData.selectedCategoryStats.totalAmount.toLocaleString('en-IN')}
              </div>
            </div>

            {selectedExpenseCat !== 'All' && (
              <button
                type="button"
                onClick={() => setSelectedExpenseCat('All')}
                style={{
                  border: 'none',
                  backgroundColor: 'transparent',
                  color: '#2C3480',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  textDecoration: 'underline'
                }}
              >
                Reset to All Categories
              </button>
            )}
          </div>

          {/* Vouchers Table */}
          {categoryAnalyticsData.activeItems.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
              <Receipt size={32} style={{ color: '#cbd5e1', margin: '0 auto 0.5rem' }} />
              <div style={{ fontWeight: 700, color: '#334155' }}>No expense vouchers recorded for {categoryAnalyticsData.selectedCategoryStats.label}</div>
              <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.25rem' }}>Try adjusting your date range filter or record a new claim.</div>
            </div>
          ) : (
            <div style={{ overflowX: 'auto', backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.8125rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: '#f1f5f9', color: '#475569', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    <th style={{ padding: '0.75rem 0.875rem' }}>Voucher Ref</th>
                    <th style={{ padding: '0.75rem 0.875rem' }}>Date</th>
                    <th style={{ padding: '0.75rem 0.875rem' }}>Category</th>
                    <th style={{ padding: '0.75rem 0.875rem' }}>Payee / Beneficiary</th>
                    <th style={{ padding: '0.75rem 0.875rem' }}>Vehicle / Booking</th>
                    <th style={{ padding: '0.75rem 0.875rem' }}>Description</th>
                    <th style={{ padding: '0.75rem 0.875rem', textAlign: 'right' }}>Amount (INR)</th>
                    <th style={{ padding: '0.75rem 0.875rem', textAlign: 'center' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {categoryAnalyticsData.activeItems.map((item, itIdx) => {
                    const catDef = SPEND_CATEGORY_DEFINITIONS.find((c) => c.id === item.category) || { color: '#64748b' };
                    return (
                      <tr
                        key={item.id || `exp-cat-${itIdx}`}
                        style={{ borderBottom: '1px solid #f1f5f9', transition: 'background-color 0.15s' }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                      >
                        <td style={{ padding: '0.75rem 0.875rem', fontWeight: 700, color: '#2C3480', fontFamily: 'monospace' }}>
                          {item.id}
                        </td>
                        <td style={{ padding: '0.75rem 0.875rem', color: '#64748b', fontSize: '0.78rem' }}>
                          {formatDateDMY(item.date, true) || 'Recent'}
                        </td>
                        <td style={{ padding: '0.75rem 0.875rem' }}>
                          <span
                            style={{
                              fontSize: '0.7rem',
                              fontWeight: 700,
                              color: catDef.color,
                              backgroundColor: `${catDef.color}15`,
                              padding: '0.15rem 0.45rem',
                              borderRadius: '4px'
                            }}
                          >
                            {item.category}
                          </span>
                        </td>
                        <td style={{ padding: '0.75rem 0.875rem', fontWeight: 600, color: '#1e293b' }}>
                          {item.payee}
                        </td>
                        <td style={{ padding: '0.75rem 0.875rem', color: '#64748b' }}>
                          {item.vehicle}
                        </td>
                        <td style={{ padding: '0.75rem 0.875rem', color: '#334155', maxWidth: '280px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={item.description}>
                          {item.description}
                        </td>
                        <td style={{ padding: '0.75rem 0.875rem', textAlign: 'right', fontWeight: 800, color: '#dc2626' }}>
                          ₹{Number(item.amount || 0).toLocaleString('en-IN')}
                        </td>
                        <td style={{ padding: '0.75rem 0.875rem', textAlign: 'center' }}>
                          <StatusBadge status={item.status || 'Approved'} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Tabs Switcher */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <button
          onClick={() => setActiveTab('recent-payments')}
          style={{
            padding: '0.6rem 1.2rem',
            borderRadius: '8px',
            border: 'none',
            backgroundColor: activeTab === 'recent-payments' ? '#2C3480' : 'transparent',
            color: activeTab === 'recent-payments' ? '#ffffff' : '#64748b',
            fontWeight: 700,
            fontSize: '0.875rem',
            cursor: 'pointer'
          }}
        >
          Recent Transactions ({filteredPayments.length})
        </button>

        <button
          onClick={() => setActiveTab('invoices')}
          style={{
            padding: '0.6rem 1.2rem',
            borderRadius: '8px',
            border: 'none',
            backgroundColor: activeTab === 'invoices' ? '#2C3480' : 'transparent',
            color: activeTab === 'invoices' ? '#ffffff' : '#64748b',
            fontWeight: 700,
            fontSize: '0.875rem',
            cursor: 'pointer'
          }}
        >
          Customer Invoices ({filteredInvoices.length})
        </button>

        <button
          onClick={() => setActiveTab('expenses')}
          style={{
            padding: '0.6rem 1.2rem',
            borderRadius: '8px',
            border: 'none',
            backgroundColor: activeTab === 'expenses' ? '#2C3480' : 'transparent',
            color: activeTab === 'expenses' ? '#ffffff' : '#64748b',
            fontWeight: 700,
            fontSize: '0.875rem',
            cursor: 'pointer'
          }}
        >
          Expense Vouchers ({filteredExpenses.length})
        </button>
      </div>

      {/* Tab 1: Recent Payments */}
      {activeTab === 'recent-payments' && (
        <Card>
          <CardHeader
            title="Real-Time Payment Receipts &amp; Payouts"
            subtitle={`Customer receipts, vendor disbursements, driver allowances (${filteredPayments.length} records in ${periodFilter})`}
            action={
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/admin/payments')}
              >
                View Full Ledger &rarr;
              </Button>
            }
          />
          {filteredPayments.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
              <Receipt size={36} style={{ margin: '0 auto 0.5rem', color: '#cbd5e1' }} />
              <div style={{ fontWeight: 700, color: '#334155' }}>No transactions recorded for the selected {periodFilter} period.</div>
              <button
                type="button"
                onClick={() => setPeriodFilter('all')}
                style={{ marginTop: '0.5rem', border: 'none', background: 'transparent', color: '#2C3480', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline' }}
              >
                View All-Time Transactions
              </button>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: '#f8fafc', color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                    <th style={{ padding: '0.875rem 1rem' }}>Receipt #</th>
                    <th style={{ padding: '0.875rem 1rem' }}>Date &amp; Time</th>
                    <th style={{ padding: '0.875rem 1rem' }}>Party Name</th>
                    <th style={{ padding: '0.875rem 1rem' }}>Transaction Type</th>
                    <th style={{ padding: '0.875rem 1rem' }}>Method</th>
                    <th style={{ padding: '0.875rem 1rem', textAlign: 'right' }}>Amount (INR)</th>
                    <th style={{ padding: '0.875rem 1rem', textAlign: 'center' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPayments.slice(0, 15).map((pay) => {
                    const payType = String(pay.type || pay.paymentType || 'Customer Payment');
                    const party = pay.partyName || pay.customerName || 'Customer';
                    const payNum = pay.paymentNumber || pay.receiptNumber || pay.id;
                    const payMethod = pay.method || pay.paymentMethod || 'UPI / QR';
                    const payAmt = Number(pay.amount) || 0;
                    const isRefund = payType.toLowerCase().includes('refund');

                    return (
                      <tr key={pay.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '0.875rem 1rem', fontWeight: 700, color: '#2C3480', fontFamily: 'monospace' }}>
                          {payNum}
                        </td>
                        <td style={{ padding: '0.875rem 1rem', color: '#64748b', fontSize: '0.8rem' }}>
                          {formatDateDMY(pay.date || pay.createdAt, true) || 'Recent'}
                        </td>
                        <td style={{ padding: '0.875rem 1rem', fontWeight: 600, color: '#0f172a' }}>
                          {party}
                        </td>
                        <td style={{ padding: '0.875rem 1rem' }}>
                          <span
                            style={{
                              fontSize: '0.75rem',
                              padding: '0.2rem 0.5rem',
                              borderRadius: '6px',
                              backgroundColor: payType.includes('Customer') ? '#eff6ff' : '#f8fafc',
                              color: payType.includes('Customer') ? '#1e40af' : '#475569',
                              fontWeight: 600
                            }}
                          >
                            {payType}
                          </span>
                        </td>
                        <td style={{ padding: '0.875rem 1rem', fontSize: '0.8rem', color: '#475569' }}>
                          {payMethod}
                        </td>
                        <td style={{ padding: '0.875rem 1rem', textAlign: 'right', fontWeight: 700, color: isRefund ? '#dc2626' : '#0f172a' }}>
                          {isRefund ? '-' : '+'}₹{payAmt.toLocaleString('en-IN')}
                        </td>
                        <td style={{ padding: '0.875rem 1rem', textAlign: 'center' }}>
                          <StatusBadge status={pay.status || 'Completed'} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* Tab 2: Invoices */}
      {activeTab === 'invoices' && (
        <Card>
          <CardHeader
            title="Customer Invoices &amp; Billing Bendings"
            subtitle={`GST tax invoices issued for B2B & individual journeys (${filteredInvoices.length} records in ${periodFilter})`}
          />
          {filteredInvoices.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
              <FileText size={36} style={{ margin: '0 auto 0.5rem', color: '#cbd5e1' }} />
              <div style={{ fontWeight: 700, color: '#334155' }}>No customer invoices found for the selected {periodFilter} period.</div>
              <button
                type="button"
                onClick={() => setPeriodFilter('all')}
                style={{ marginTop: '0.5rem', border: 'none', background: 'transparent', color: '#2C3480', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline' }}
              >
                View All-Time Invoices
              </button>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: '#f8fafc', color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                    <th style={{ padding: '0.875rem 1rem' }}>Invoice #</th>
                    <th style={{ padding: '0.875rem 1rem' }}>Client Name</th>
                    <th style={{ padding: '0.875rem 1rem' }}>Invoice Date</th>
                    <th style={{ padding: '0.875rem 1rem' }}>Due Date</th>
                    <th style={{ padding: '0.875rem 1rem', textAlign: 'right' }}>Total (₹)</th>
                    <th style={{ padding: '0.875rem 1rem', textAlign: 'right' }}>Paid (₹)</th>
                    <th style={{ padding: '0.875rem 1rem', textAlign: 'right' }}>Balance Due (₹)</th>
                    <th style={{ padding: '0.875rem 1rem', textAlign: 'center' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInvoices.map((inv, iIdx) => {
                    const invTotal = Number(inv.total || 0);
                    const invPaid = Number(inv.paidAmount || 0);
                    const balanceDue = invTotal - invPaid;
                    return (
                      <tr key={inv.id || inv._id || `inv-${iIdx}`} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '0.875rem 1rem', fontWeight: 700, color: '#0f172a', fontFamily: 'monospace' }}>
                          {inv.id || inv.invoiceNumber || `INV-${iIdx + 1}`}
                        </td>
                        <td style={{ padding: '0.875rem 1rem', fontWeight: 600, color: '#1e293b' }}>
                          {inv.customer || inv.clientName || 'Customer'}
                        </td>
                        <td style={{ padding: '0.875rem 1rem', color: '#64748b', fontSize: '0.8rem' }}>{formatDateDMY(inv.date) || 'Recent'}</td>
                        <td style={{ padding: '0.875rem 1rem', color: '#64748b', fontSize: '0.8rem' }}>{formatDateDMY(inv.dueDate) || 'N/A'}</td>
                        <td style={{ padding: '0.875rem 1rem', textAlign: 'right', fontWeight: 600 }}>
                          ₹{invTotal.toLocaleString('en-IN')}
                        </td>
                        <td style={{ padding: '0.875rem 1rem', textAlign: 'right', color: '#16a34a', fontWeight: 600 }}>
                          ₹{invPaid.toLocaleString('en-IN')}
                        </td>
                        <td style={{ padding: '0.875rem 1rem', textAlign: 'right', fontWeight: 700, color: balanceDue > 0 ? '#dc2626' : '#16a34a' }}>
                          ₹{balanceDue.toLocaleString('en-IN')}
                        </td>
                        <td style={{ padding: '0.875rem 1rem', textAlign: 'center' }}>
                          <StatusBadge status={inv.status || 'Sent'} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* Tab 3: Expenses */}
      {activeTab === 'expenses' && (
        <Card>
          <CardHeader
            title="Operational Expense Vouchers"
            subtitle={`Fleet running costs, tolls, driver battas & administration (${filteredExpenses.length} records in ${periodFilter})`}
            action={
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/admin/expenses')}
              >
                Open Expense Log &rarr;
              </Button>
            }
          />
          {filteredExpenses.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
              <Receipt size={36} style={{ margin: '0 auto 0.5rem', color: '#cbd5e1' }} />
              <div style={{ fontWeight: 700, color: '#334155' }}>No expense vouchers recorded for the selected {periodFilter} period.</div>
              <button
                type="button"
                onClick={() => setPeriodFilter('all')}
                style={{ marginTop: '0.5rem', border: 'none', background: 'transparent', color: '#2C3480', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline' }}
              >
                View All-Time Expenses
              </button>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: '#f8fafc', color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                    <th style={{ padding: '0.875rem 1rem' }}>Voucher ID</th>
                    <th style={{ padding: '0.875rem 1rem' }}>Date</th>
                    <th style={{ padding: '0.875rem 1rem' }}>Category</th>
                    <th style={{ padding: '0.875rem 1rem' }}>Expense Description</th>
                    <th style={{ padding: '0.875rem 1rem' }}>Vehicle / Driver</th>
                    <th style={{ padding: '0.875rem 1rem', textAlign: 'right' }}>Amount (₹)</th>
                    <th style={{ padding: '0.875rem 1rem', textAlign: 'center' }}>Approval</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredExpenses.slice(0, 15).map((exp) => (
                    <tr key={exp.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '0.875rem 1rem', fontWeight: 700, color: '#0f172a', fontFamily: 'monospace' }}>
                        {exp.id}
                      </td>
                      <td style={{ padding: '0.875rem 1rem', color: '#64748b', fontSize: '0.8rem' }}>{formatDateDMY(exp.date)}</td>
                      <td style={{ padding: '0.875rem 1rem' }}>
                        <span
                          style={{
                            fontSize: '0.75rem',
                            padding: '0.2rem 0.55rem',
                            borderRadius: '6px',
                            backgroundColor: exp.category === 'Vendor Payout' ? '#FEF3C7' : exp.category === 'Driver Salary' ? '#DCFCE7' : '#F1F5F9',
                            color: exp.category === 'Vendor Payout' ? '#92400E' : exp.category === 'Driver Salary' ? '#166534' : '#334155',
                            fontWeight: 700
                          }}
                        >
                          {exp.category}
                        </span>
                      </td>
                      <td style={{ padding: '0.875rem 1rem', fontWeight: 600, color: '#1e293b' }}>
                        {exp.description || exp.title || exp.category}
                      </td>
                      <td style={{ padding: '0.875rem 1rem', fontSize: '0.8rem', color: '#64748b' }}>
                        {exp.vehicleRegNo ? `${exp.vehicleRegNo} (${exp.driverName || 'Yard'})` : (exp.driverName || exp.payee || 'Administrative')}
                      </td>
                      <td style={{ padding: '0.875rem 1rem', textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>
                        ₹{Number(exp.approvedAmount || exp.amount || 0).toLocaleString('en-IN')}
                      </td>
                      <td style={{ padding: '0.875rem 1rem', textAlign: 'center' }}>
                        <StatusBadge status={exp.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}

export default FinanceDashboard;
