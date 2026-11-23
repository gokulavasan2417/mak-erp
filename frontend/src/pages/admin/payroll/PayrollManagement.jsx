// MAK Tours & Travels ERP - Advanced Attendance-Based Automatic Payroll System
// Full Lifecycle: Attendance Calculation → Policy Evaluation → Driver Trip Allowances → Admin Audit & Approval → Salary Disbursement & Printable Slips
import React, { useState, useMemo, useEffect } from 'react';
import {
  Banknote,
  Calendar,
  Calculator,
  CheckCircle2,
  AlertCircle,
  Clock,
  Car,
  FileText,
  Search,
  Filter,
  Download,
  Printer,
  Eye,
  Check,
  X,
  CreditCard,
  Building,
  Plus,
  RefreshCw,
  LayoutGrid,
  List,
  ArrowRight,
  ShieldCheck,
  ChevronRight,
  DollarSign,
  Receipt,
  UserCheck,
  Info,
  Settings,
  Edit3,
  TrendingUp,
  History,
  Sparkles,
  ChevronLeft,
  ArrowUpDown,
  Sliders
} from 'lucide-react';
import { Card, CardHeader, CardBody } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Modal } from '../../../components/ui/Modal';
import { Badge } from '../../../components/ui/Badge';
import { Input } from '../../../components/ui/Input';
import { useAdminData } from '../../../context/AdminDataContext';
import { useToast } from '../../../context/ToastContext';

export function PayrollManagement() {
  const toast = useToast();
  const {
    payrolls = [],
    employees = [],
    payrollPolicy = {},
    selectedPayrollMonth,
    setSelectedPayrollMonth,
    calculatePayroll,
    approvePayroll,
    recordSalaryPayment,
    updatePayrollPolicy,
    updateEmployeeSalary,
    getSalaryHistory
  } = useAdminData();

  const [month, setMonth] = useState(selectedPayrollMonth || '2026-11');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [departmentFilter, setDepartmentFilter] = useState('All');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' (modern cards) or 'table'
  const [isCalculating, setIsCalculating] = useState(false);

  // Sorting & Pagination States
  const [sortField, setSortField] = useState('name'); // 'name', 'code', 'salary', 'payableDays', 'netSalary', 'due'
  const [sortDirection, setSortDirection] = useState('asc'); // 'asc' or 'desc'
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  // Modal States
  const [selectedPayroll, setSelectedPayroll] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [detailTab, setDetailTab] = useState('formula'); // 'formula', 'attendance', 'trips', 'payments', 'salaryHistory'

  // Salary Revision Modal States
  const [isSalaryModalOpen, setIsSalaryModalOpen] = useState(false);
  const [salaryTarget, setSalaryTarget] = useState(null);
  const [newSalaryInput, setNewSalaryInput] = useState('');
  const [effectiveDateInput, setEffectiveDateInput] = useState(new Date().toISOString().substring(0, 10));
  const [salaryCategoryInput, setSalaryCategoryInput] = useState('Category A');
  const [salaryRemarksInput, setSalaryRemarksInput] = useState('');
  const [basicInput, setBasicInput] = useState('');
  const [hraInput, setHraInput] = useState('');
  const [allowanceInput, setAllowanceInput] = useState('');
  const [incentiveInput, setIncentiveInput] = useState('');
  const [pfInput, setPfInput] = useState('0');
  const [esiInput, setEsiInput] = useState('350');
  const [ptInput, setPtInput] = useState('200');
  const [tdsInput, setTdsInput] = useState('0');
  const [isSubmittingSalary, setIsSubmittingSalary] = useState(false);
  const [employeeRevisionHistory, setEmployeeRevisionHistory] = useState([]);

  // Payment Recording Modal
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [payTarget, setPayTarget] = useState(null);
  const [payAmount, setPayAmount] = useState('');
  const [payDate, setPayDate] = useState(new Date().toISOString().substring(0, 10));
  const [payMethod, setPayMethod] = useState('Bank Transfer');
  const [payRef, setPayRef] = useState('');
  const [payNotes, setPayNotes] = useState('');

  // Salary Slip Modal
  const [isSlipModalOpen, setIsSlipModalOpen] = useState(false);
  const [slipData, setSlipData] = useState(null);

  // Policy Settings Modal
  const [isPolicyModalOpen, setIsPolicyModalOpen] = useState(false);
  const [policyWorkingDays, setPolicyWorkingDays] = useState(payrollPolicy?.payrollWorkingDays || 26);
  const [policyCalcMethod, setPolicyCalcMethod] = useState(payrollPolicy?.calculationMethod || 'Fixed Payroll Working Days');
  const [policyPerTripRate, setPolicyPerTripRate] = useState(payrollPolicy?.driverAllowanceRules?.perTripAllowance || 300);
  const [policyNightRate, setPolicyNightRate] = useState(payrollPolicy?.driverAllowanceRules?.nightAllowance || 250);
  const [policyLongDistRate, setPolicyLongDistRate] = useState(payrollPolicy?.driverAllowanceRules?.longDistanceAllowance || 400);
  const [policyOvernightRate, setPolicyOvernightRate] = useState(payrollPolicy?.driverAllowanceRules?.overnightAllowance || 500);

  // Sync month change
  useEffect(() => {
    if (setSelectedPayrollMonth) {
      setSelectedPayrollMonth(month);
    }
  }, [month, setSelectedPayrollMonth]);

  // Fetch fresh calculations silently on mount or month change (no popup toast)
  useEffect(() => {
    if (calculatePayroll) {
      calculatePayroll(month, false);
    }
  }, [month]);

  // Filtered Payroll list
  const filteredPayrolls = useMemo(() => {
    return (payrolls || []).filter((p) => {
      if (!p) return false;
      const sTerm = (searchTerm || '').trim().toLowerCase();
      const pName = String(p.employeeName || '').toLowerCase();
      const pCode = String(p.employeeCode || p.employeeId || '').toLowerCase();
      const pDesig = String(p.designation || '').toLowerCase();
      const pDept = String(p.department || '').toLowerCase();

      const matchSearch =
        sTerm === '' ||
        pName.includes(sTerm) ||
        pCode.includes(sTerm) ||
        pDesig.includes(sTerm) ||
        pDept.includes(sTerm);

      const isSettled = p.status === 'Settled' || p.status === 'Paid';
      let matchStatus = true;
      if (statusFilter === 'Settled') {
        matchStatus = isSettled;
      } else if (statusFilter === 'Pending') {
        matchStatus = !isSettled;
      } else if (statusFilter !== 'All') {
        matchStatus = p.status === statusFilter;
      }
      const matchCategory =
        categoryFilter === 'All' ||
        categoryFilter === 'All Categories' ||
        p.salaryCategory === categoryFilter;
      const matchDept =
        departmentFilter === 'All' ||
        departmentFilter === 'All Departments' ||
        p.department === departmentFilter;

      return matchSearch && matchStatus && matchCategory && matchDept;
    });
  }, [payrolls, searchTerm, statusFilter, categoryFilter, departmentFilter]);

  // Sort and Paginate Payroll List
  const sortedPayrolls = useMemo(() => {
    const list = [...filteredPayrolls];
    list.sort((a, b) => {
      let valA = 0;
      let valB = 0;
      if (sortField === 'name') {
        const res = String(a.employeeName || '').localeCompare(String(b.employeeName || ''));
        return sortDirection === 'asc' ? res : -res;
      } else if (sortField === 'code') {
        const res = String(a.employeeCode || '').localeCompare(String(b.employeeCode || ''));
        return sortDirection === 'asc' ? res : -res;
      } else if (sortField === 'salary') {
        valA = Number(a.earningsBreakdown?.monthlyGrossSalary || 0);
        valB = Number(b.earningsBreakdown?.monthlyGrossSalary || 0);
      } else if (sortField === 'payableDays') {
        valA = Number(a.attendanceSummary?.payableDays || 0);
        valB = Number(b.attendanceSummary?.payableDays || 0);
      } else if (sortField === 'netSalary') {
        valA = Number(a.netPayableSalary || 0);
        valB = Number(b.netPayableSalary || 0);
      } else if (sortField === 'due') {
        valA = Number(a.outstandingSalary || 0);
        valB = Number(b.outstandingSalary || 0);
      }
      return sortDirection === 'asc' ? valA - valB : valB - valA;
    });
    return list;
  }, [filteredPayrolls, sortField, sortDirection]);

  const totalPages = Math.max(1, Math.ceil(sortedPayrolls.length / pageSize));
  const paginatedPayrolls = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedPayrolls.slice(start, start + pageSize);
  }, [sortedPayrolls, currentPage, pageSize]);

  // Handle Sort Toggle
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Salary Revision Handlers
  const handleOpenSalaryModal = async (p) => {
    setSalaryTarget(p);
    const isDriverTarget = Boolean(
      p.isDriver ||
      p.salaryCategory === 'Category C' ||
      p.salaryCategory === 'Category B' ||
      p.salaryCategory?.toLowerCase().includes('trip') ||
      p.salaryCategory?.toLowerCase().includes('driver') ||
      String(p.designation || '').toLowerCase().includes('driver') ||
      String(p.designation || '').toLowerCase().includes('per-trip') ||
      p.department === 'Fleet Logistics' ||
      Boolean(p.driverId)
    );
    const currRate = Number(p.salaryStructure?.perTripRate || p.perTripRate || 600);
    const currGross = isDriverTarget ? currRate : Number(p.earningsBreakdown?.monthlyGrossSalary || p.monthlySalary || 30000);
    setNewSalaryInput(String(currGross));
    setEffectiveDateInput(p.month ? `${p.month}-15` : new Date().toISOString().substring(0, 10));
    setSalaryCategoryInput(isDriverTarget ? 'Category C' : (p.salaryCategory || 'Category A'));
    setSalaryRemarksInput(isDriverTarget ? 'Driver per-trip compensation rate adjustment' : 'Role adjustment & performance increment');

    // Prepopulate structure
    const b = p.earningsBreakdown?.basicSalary || Math.round(currGross * 0.55);
    const h = p.earningsBreakdown?.hra || Math.round(currGross * 0.22);
    const a = p.earningsBreakdown?.fixedAllowances || Math.round(currGross * 0.11);
    const inc = p.earningsBreakdown?.fixedIncentives || Math.round(currGross * 0.12);
    setBasicInput(String(b));
    setHraInput(String(h));
    setAllowanceInput(String(a));
    setIncentiveInput(String(inc));
    setPfInput(String(p.deductionsBreakdown?.pfDeduction ?? 0));
    setEsiInput(String(p.deductionsBreakdown?.esiDeduction ?? 350));
    setPtInput(String(p.deductionsBreakdown?.professionalTax ?? 200));
    setTdsInput(String(p.deductionsBreakdown?.tdsDeduction ?? 0));

    // Fetch revision history
    try {
      const hist = await getSalaryHistory(p.employeeId || p.employeeCode || p.id);
      setEmployeeRevisionHistory(hist || p.salaryRevisionHistory || []);
    } catch {
      setEmployeeRevisionHistory(p.salaryRevisionHistory || []);
    }

    setIsSalaryModalOpen(true);
  };

  const handleAutoSplit = () => {
    const gross = Number(newSalaryInput) || 0;
    if (gross > 0) {
      setBasicInput(String(Math.round(gross * 0.55)));
      setHraInput(String(Math.round(gross * 0.22)));
      setAllowanceInput(String(Math.round(gross * 0.11)));
      setIncentiveInput(String(Math.round(gross * 0.12)));
      toast.info('Standard proportions applied: 55% Basic, 22% HRA, 11% Allowances, 12% Incentives');
    }
  };

  const handleConfirmSalaryRevision = async (e) => {
    e.preventDefault();
    const isDriverRevision = (salaryCategoryInput === 'Category C' || Boolean(salaryTarget?.isDriver));
    if (!salaryTarget || !newSalaryInput || Number(newSalaryInput) <= 0) {
      toast.error(isDriverRevision ? 'Please enter a valid rate per trip' : 'Please enter a valid monthly salary');
      return;
    }

    setIsSubmittingSalary(true);
    try {
      const payload = isDriverRevision
        ? {
            newMonthlySalary: 0,
            perTripRate: Number(newSalaryInput),
            effectiveDate: effectiveDateInput,
            salaryCategory: 'Category C',
            salaryStructure: {
              perTripRate: Number(newSalaryInput),
              basicSalary: 0,
              hra: 0,
              fixedAllowances: 0,
              fixedIncentives: 0,
              pfDeduction: 0,
              esiDeduction: Number(esiInput) || 0,
              professionalTax: Number(ptInput) || 0,
              tdsDeduction: Number(tdsInput) || 0
            },
            remarks: salaryRemarksInput || 'Driver per-trip rate revised by Admin',
            updatedBy: 'Operations Admin'
          }
        : {
            newMonthlySalary: Number(newSalaryInput),
            effectiveDate: effectiveDateInput,
            salaryCategory: salaryCategoryInput,
            salaryStructure: {
              basicSalary: Number(basicInput) || Math.round(Number(newSalaryInput) * 0.55),
              hra: Number(hraInput) || Math.round(Number(newSalaryInput) * 0.22),
              fixedAllowances: Number(allowanceInput) || Math.round(Number(newSalaryInput) * 0.11),
              fixedIncentives: Number(incentiveInput) || Math.round(Number(newSalaryInput) * 0.12),
              pfDeduction: 0,
              esiDeduction: Number(esiInput) || 350,
              professionalTax: Number(ptInput) || 200,
              tdsDeduction: Number(tdsInput) || 0
            },
            remarks: salaryRemarksInput || 'Salary revised by Admin',
            updatedBy: 'Operations Admin'
          };

      await updateEmployeeSalary(salaryTarget.employeeId || salaryTarget.employeeCode || salaryTarget.id, payload);
      setIsSalaryModalOpen(false);
      // Recalculate view if on this month
      handleRecalculate();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingSalary(false);
    }
  };

  // Aggregated KPIs
  const totalGross = useMemo(() => {
    return (payrolls || []).reduce((sum, p) => sum + (p.earningsBreakdown?.grossEarnings || 0), 0);
  }, [payrolls]);

  const totalNet = useMemo(() => {
    return (payrolls || []).reduce((sum, p) => sum + (p.netPayableSalary || 0), 0);
  }, [payrolls]);

  const totalPaid = useMemo(() => {
    return (payrolls || []).reduce((sum, p) => sum + (p.totalPaidAmount || 0), 0);
  }, [payrolls]);

  const totalOutstanding = useMemo(() => {
    return (payrolls || []).reduce((sum, p) => sum + (p.outstandingSalary || 0), 0);
  }, [payrolls]);

  const pendingPaymentCount = useMemo(() => {
    return (payrolls || []).filter((p) => p.status !== 'Settled' && p.status !== 'Paid').length;
  }, [payrolls]);

  const settledCount = useMemo(() => {
    return (payrolls || []).filter((p) => p.status === 'Settled' || p.status === 'Paid').length;
  }, [payrolls]);

  // Trigger Payroll Recalculation
  const handleRecalculate = async () => {
    setIsCalculating(true);
    try {
      await calculatePayroll(month, true);
    } catch (e) {
      console.error(e);
    } finally {
      setIsCalculating(false);
    }
  };

  // Open Payment Modal
  const handleOpenPayModal = (p) => {
    setPayTarget(p);
    setIsPayModalOpen(true);
  };

  // Confirm Payment & Mark as Settled
  const handleConfirmPayment = async () => {
    if (!payTarget) return;
    const isDriverTarget = Boolean(
      payTarget.isDriver ||
      payTarget.salaryCategory === 'Category C' ||
      payTarget.salaryCategory === 'Category B' ||
      payTarget.salaryCategory?.toLowerCase().includes('trip') ||
      payTarget.salaryCategory?.toLowerCase().includes('driver') ||
      String(payTarget.designation || '').toLowerCase().includes('driver') ||
      String(payTarget.designation || '').toLowerCase().includes('per-trip') ||
      payTarget.department === 'Fleet Logistics' ||
      Boolean(payTarget.driverId)
    );
    const targetTrips = Number(payTarget.driverTripSummary?.totalEligibleTrips || payTarget.completedTrips || payTarget.totalTrips || 0);
    const targetPerTripRate = Number(payTarget.salaryStructure?.perTripRate || payTarget.perTripRate || 600);
    const targetTripEarnings = Number(payTarget.earningsBreakdown?.attendancePay ?? (targetTrips * targetPerTripRate));
    const targetTripAllow = Number(payTarget.earningsBreakdown?.tripAllowances || payTarget.driverTripSummary?.totalAllowances || 0);
    const targetDriverNet = targetTripEarnings + targetTripAllow;

    const targetGross = Number(payTarget.earningsBreakdown?.monthlyGrossSalary || payTarget.grossEarnings || 0);
    const targetDays = payTarget.attendanceSummary?.payableDays ?? 26;
    const targetSched = payTarget.policySnapshot?.payrollWorkingDays ?? 26;
    const targetAttPay = Number(payTarget.earningsBreakdown?.attendancePay || Math.round((targetGross / targetSched) * targetDays));
    const targetAllow = Number(payTarget.earningsBreakdown?.tripAllowances || 0);
    const targetNet = isDriverTarget ? targetDriverNet : (targetAttPay + targetAllow);

    await recordSalaryPayment(payTarget._id || payTarget.payrollCode || payTarget.id, {
      amount: targetNet,
      paymentDate: new Date().toISOString().substring(0, 10),
      paymentMethod: 'Bank Transfer (NEFT)',
      transactionRef: `SAL-TXN-${Date.now().toString().slice(-6)}`,
      notes: `Salary settled for ${payTarget.employeeName} (${payTarget.month})`,
      recordedBy: 'Operations Admin'
    });
    setIsPayModalOpen(false);
  };

  // Open Salary Slip
  const handleOpenSlip = (p) => {
    setSlipData(p);
    setIsSlipModalOpen(true);
  };

  // Save Policy Updates
  const handleSavePolicy = async (e) => {
    e.preventDefault();
    await updatePayrollPolicy({
      payrollWorkingDays: Number(policyWorkingDays),
      calculationMethod: policyCalcMethod,
      driverAllowanceRules: {
        perTripAllowance: Number(policyPerTripRate),
        nightAllowance: Number(policyNightRate),
        longDistanceAllowance: Number(policyLongDistRate),
        overnightAllowance: Number(policyOvernightRate)
      }
    });
    setIsPolicyModalOpen(false);
    handleRecalculate();
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = [
      'Payroll Code',
      'Employee Code',
      'Employee Name',
      'Designation',
      'Category',
      'Payable Days',
      'Basic Salary',
      'Gross Salary',
      'Attendance Pay',
      'Trip Allowances',
      'Overtime',
      'Deductions',
      'Net Salary',
      'Paid Amount',
      'Outstanding',
      'Status'
    ];

    const rows = filteredPayrolls.map((p) => [
      p.payrollCode || p.id,
      p.employeeCode,
      `"${p.employeeName}"`,
      `"${p.designation}"`,
      `"${p.salaryCategory}"`,
      p.attendanceSummary?.payableDays || 0,
      p.earningsBreakdown?.basicSalary || 0,
      p.earningsBreakdown?.monthlyGrossSalary || 0,
      p.earningsBreakdown?.attendancePay || 0,
      p.earningsBreakdown?.tripAllowances || 0,
      p.earningsBreakdown?.approvedOvertimePay || 0,
      p.deductionsBreakdown?.totalDeductions || 0,
      p.netPayableSalary || 0,
      p.totalPaidAmount || 0,
      p.outstandingSalary || 0,
      p.status
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `MAK_Payroll_${month}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Helper for Category badge colors
  const getCategoryBadge = (cat) => {
    switch (cat) {
      case 'Category A':
        return { label: 'Cat A: Fixed Monthly', bg: '#EEF0FD', color: '#2C3480', border: '#D2D7F9' };
      case 'Category B':
        return { label: 'Cat B: Monthly + Trips', bg: '#ECFDF5', color: '#065F46', border: '#A7F3D0' };
      case 'Category C':
        return { label: 'Cat C: Trip-Based Driver', bg: '#FFFBEB', color: '#92400E', border: '#FDE68A' };
      case 'Category D':
        return { label: 'Cat D: Daily Wage', bg: '#F5F3FF', color: '#5B21B6', border: '#DDD6FE' };
      case 'Category E':
        return { label: 'Cat E: Contract', bg: '#FDF2F8', color: '#9D174D', border: '#FBCFE8' };
      default:
        return { label: cat || 'Category A', bg: '#F1F5F9', color: '#475569', border: '#CBD5E1' };
    }
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
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#090d16', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '0.625rem', margin: 0 }}>
            <Banknote size={26} color="#2C3480" />
            Automatic Attendance-Based Payroll
          </h1>
          <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.25rem', margin: 0 }}>
            Proportionate attendance pay, driver trip allowances, statutory deductions & salary disbursements for {month}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          {/* Month Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', backgroundColor: '#f8fafc', padding: '0.25rem 0.6rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
            <Calendar size={15} color="#2C3480" />
            <select
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              style={{ border: 'none', background: 'transparent', fontSize: '0.85rem', fontWeight: 700, color: '#1e293b', outline: 'none', cursor: 'pointer' }}
            >
              <option value="2026-11">November 2026</option>
              <option value="2026-10">October 2026</option>
              <option value="2026-09">September 2026</option>
              <option value="2026-08">August 2026</option>
              <option value="2026-12">December 2026</option>
            </select>
          </div>

          {/* View Toggle */}
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

          {/* Policy Config Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsPolicyModalOpen(true)}
            leftIcon={<Settings size={15} />}
          >
            Policy Rules
          </Button>

          {/* Export CSV */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            leftIcon={<Download size={15} />}
          >
            Export CSV
          </Button>

          {/* Calculate Button */}
          <Button
            variant="primary"
            style={{ backgroundColor: '#2C3480' }}
            onClick={handleRecalculate}
            disabled={isCalculating}
            leftIcon={isCalculating ? <RefreshCw size={15} className="animate-spin" /> : <Calculator size={16} />}
          >
            {isCalculating ? 'Computing...' : 'Recalculate Payroll'}
          </Button>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
        <div style={{ backgroundColor: '#ffffff', padding: '1.15rem', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#2C3480', textTransform: 'uppercase' }}>
            Total Net Payroll
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#2C3480', marginTop: '0.35rem' }}>
            ₹{Number(totalNet || 0).toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
            Attendance-calculated payroll
          </div>
        </div>

        <div style={{ backgroundColor: '#ffffff', padding: '1.15rem', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#b45309', textTransform: 'uppercase' }}>
            Pending Payment
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#b45309', marginTop: '0.35rem' }}>
            {pendingPaymentCount} Staff
          </div>
          <div style={{ fontSize: '0.75rem', color: '#b45309', marginTop: '0.25rem' }}>
            Awaiting Pay click
          </div>
        </div>

        <div style={{ backgroundColor: '#ffffff', padding: '1.15rem', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#16a34a', textTransform: 'uppercase' }}>
            Settled Salaries
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#16a34a', marginTop: '0.35rem' }}>
            {settledCount} Staff
          </div>
          <div style={{ fontSize: '0.75rem', color: '#16a34a', marginTop: '0.25rem' }}>
            Payment confirmed
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <Card>
        <CardBody style={{ padding: '1rem 1.25rem' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center', justifyContent: 'space-between' }}>
            {/* Status Pills */}
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {['All', 'Pending', 'Settled'].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  style={{
                    padding: '0.45rem 0.85rem',
                    borderRadius: '8px',
                    fontSize: '0.8125rem',
                    fontWeight: 700,
                    border: 'none',
                    cursor: 'pointer',
                    backgroundColor: statusFilter === st ? '#2C3480' : '#f1f5f9',
                    color: statusFilter === st ? '#ffffff' : '#475569',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {st}
                </button>
              ))}
            </div>

            {/* Dropdown Filters & Search */}
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
              {/* Category Filter */}
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                style={{
                  padding: '0.5rem 0.75rem',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.8125rem',
                  backgroundColor: '#ffffff'
                }}
              >
                <option value="All">All Salary Categories</option>
                <option value="Category A">Category A: Fixed Monthly</option>
                <option value="Category B">Category B: Monthly + Trip Allowances</option>
                <option value="Category C">Category C: Trip-Based Driver</option>
                <option value="Category D">Category D: Daily Wage</option>
                <option value="Category E">Category E: Contract</option>
              </select>

              {/* Department Filter */}
              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                style={{
                  padding: '0.5rem 0.75rem',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.8125rem',
                  backgroundColor: '#ffffff'
                }}
              >
                <option value="All">All Departments</option>
                <option value="Operations & Dispatch">Operations &amp; Dispatch</option>
                <option value="Fleet Logistics">Fleet Logistics</option>
                <option value="Finance & Accounts">Finance &amp; Accounts</option>
                <option value="Tour Packages & Sales">Tour Packages &amp; Sales</option>
                <option value="Customer Support">Customer Support</option>
                <option value="IT & Engineering">IT &amp; Engineering</option>
              </select>

              {/* Search */}
              <div style={{ position: 'relative', minWidth: '240px' }}>
                <Search size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input
                  type="text"
                  placeholder="Search staff, code, role..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
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

      {/* Main Payroll Grid or Table Display */}
      {viewMode === 'grid' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1.25rem' }}>
          {filteredPayrolls.length === 0 ? (
            <div style={{ gridColumn: '1 / -1', padding: '3.5rem 2rem', textAlign: 'center', backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
              <Banknote size={44} style={{ color: '#cbd5e1', margin: '0 auto 0.75rem' }} />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e293b', margin: '0 0 0.25rem' }}>No payroll records found</h3>
              <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0 0 1rem' }}>
                Click "Recalculate Payroll" above to automatically generate attendance-based calculations for {month}.
              </p>
              <Button variant="primary" style={{ backgroundColor: '#2C3480' }} onClick={handleRecalculate}>
                Compute Payroll Now
              </Button>
            </div>
          ) : (
            filteredPayrolls.map((p, pIdx) => {
              const isDriver = Boolean(
                p.isDriver ||
                p.salaryCategory === 'Category C' ||
                p.salaryCategory === 'Category B' ||
                p.salaryCategory?.toLowerCase().includes('trip') ||
                p.salaryCategory?.toLowerCase().includes('driver') ||
                String(p.designation || '').toLowerCase().includes('driver') ||
                String(p.designation || '').toLowerCase().includes('per-trip') ||
                p.department === 'Fleet Logistics' ||
                Boolean(p.driverId)
              );
              const catBadge = getCategoryBadge(p.salaryCategory);
              const displayBadge = isDriver
                ? { label: 'Cat C: Trip-Based Driver', bg: '#FFFBEB', color: '#92400E', border: '#FDE68A' }
                : catBadge;
              const pDays = p.attendanceSummary?.payableDays ?? 26;
              const schedDays = p.policySnapshot?.payrollWorkingDays ?? 26;
              const isPaid = p.status === 'Paid';
              const isPartiallyPaid = p.status === 'Partially Paid';
              const isApproved = p.status === 'Approved';
              const cardGross = Number(p.earningsBreakdown?.monthlyGrossSalary || p.grossEarnings || 0);
              const cardAttPay = Number(p.earningsBreakdown?.attendancePay || Math.round((cardGross / schedDays) * pDays));
              const cardTripAllow = Number(p.earningsBreakdown?.tripAllowances || p.driverTripSummary?.totalAllowances || 0);
              const cardNetPay = cardAttPay + cardTripAllow;

              const cardTripCount = Number(p.driverTripSummary?.totalEligibleTrips || p.completedTrips || p.totalTrips || 0);
              const cardPerTripRate = Number(p.salaryStructure?.perTripRate || p.perTripRate || 600);
              const cardTripEarnings = Number(p.earningsBreakdown?.attendancePay ?? (cardTripCount * cardPerTripRate));
              const cardFinalNetPay = isDriver ? (cardTripEarnings + cardTripAllow) : cardNetPay;
              const cardDue = Math.max(0, cardFinalNetPay - Number(p.totalPaidAmount || 0));

              return (
                <div
                  key={p._id || p.payrollCode || `payroll-${pIdx}`}
                  style={{
                    backgroundColor: '#ffffff',
                    borderRadius: '16px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 2px 5px rgba(0,0,0,0.03)',
                    padding: '1.25rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1rem',
                    transition: 'transform 0.15s, box-shadow 0.15s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 6px 14px rgba(0,0,0,0.07)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'none';
                    e.currentTarget.style.boxShadow = '0 2px 5px rgba(0,0,0,0.03)';
                  }}
                >
                  {/* Top Row: Employee & Status */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                      <div
                        style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '10px',
                          backgroundColor: '#EEF0FD',
                          color: '#2C3480',
                          fontWeight: 800,
                          fontSize: '0.9rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        {p.employeeName?.substring(0, 2).toUpperCase() || 'EM'}
                      </div>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: '1rem', color: '#090d16' }}>{p.employeeName}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                          <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#2C3480' }}>{p.employeeCode}</span> • {p.designation}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.25rem' }}>
                      {p.status === 'Settled' || p.status === 'Paid' ? (
                        <Badge
                          variant="success"
                          style={{
                            backgroundColor: '#ecfdf5',
                            color: '#059669',
                            borderColor: '#a7f3d0',
                            fontWeight: 700
                          }}
                        >
                          ✓ Settled
                        </Badge>
                      ) : (
                        <Badge
                          variant="warning"
                          style={{
                            backgroundColor: '#fffbeb',
                            color: '#b45309',
                            borderColor: '#fde68a',
                            fontWeight: 700
                          }}
                        >
                          Pending
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Category Pill */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                    <span
                      style={{
                        padding: '0.2rem 0.55rem',
                        borderRadius: '6px',
                        backgroundColor: displayBadge.bg,
                        color: displayBadge.color,
                        border: `1px solid ${displayBadge.border}`,
                        fontWeight: 700
                      }}
                    >
                      {displayBadge.label}
                    </span>
                    <span style={{ color: '#64748b', fontWeight: 600 }}>
                      {isDriver ? (
                        <>Completed: <strong style={{ color: '#090d16' }}>{cardTripCount}</strong> {cardTripCount === 1 ? 'Trip' : 'Trips'}</>
                      ) : (
                        <>Payable: <strong style={{ color: '#090d16' }}>{pDays} / {schedDays}</strong> days</>
                      )}
                    </span>
                  </div>

                  {/* Financial Breakdown Box */}
                  <div
                    style={{
                      backgroundColor: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '12px',
                      padding: '0.75rem 0.85rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.4rem',
                      fontSize: '0.8rem'
                    }}
                  >
                    {isDriver ? (
                      <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
                          <span>Salary Basis:</span>
                          <strong style={{ color: '#059669', backgroundColor: '#ecfdf5', padding: '0.1rem 0.4rem', borderRadius: '4px', fontSize: '0.75rem' }}>
                            Trip-Based Pay
                          </strong>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#2C3480', fontWeight: 600 }}>
                          <span>Trip Pay ({cardTripCount} {cardTripCount === 1 ? 'trip' : 'trips'} @ ₹{cardPerTripRate}/trip):</span>
                          <strong style={{ color: '#16a34a' }}>₹{cardTripEarnings.toLocaleString('en-IN')}</strong>
                        </div>

                        {cardTripAllow > 0 && (
                          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#059669' }}>
                            <span>Trip Allowances (Bata/Night):</span>
                            <strong>+₹{cardTripAllow.toLocaleString('en-IN')}</strong>
                          </div>
                        )}

                        <div style={{ borderTop: '1px dashed #cbd5e1', paddingTop: '0.45rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontWeight: 800, color: '#2C3480', fontSize: '0.85rem' }}>NET PAYABLE:</span>
                          <span style={{ fontWeight: 800, color: '#2C3480', fontSize: '1.15rem' }}>
                            ₹{cardFinalNetPay.toLocaleString('en-IN')}
                          </span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
                          <span>Monthly Salary:</span>
                          <strong style={{ color: '#1e293b' }}>₹{cardGross.toLocaleString('en-IN')}</strong>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#2C3480', fontWeight: 600 }}>
                          <span>Attendance Pay ({pDays} / {schedDays} days):</span>
                          <strong style={{ color: '#16a34a' }}>₹{cardAttPay.toLocaleString('en-IN')}</strong>
                        </div>

                        {cardTripAllow > 0 && (
                          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#059669' }}>
                            <span>Allowances:</span>
                            <strong>+₹{cardTripAllow.toLocaleString('en-IN')}</strong>
                          </div>
                        )}

                        <div style={{ borderTop: '1px dashed #cbd5e1', paddingTop: '0.45rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontWeight: 800, color: '#2C3480', fontSize: '0.85rem' }}>NET PAYABLE:</span>
                          <span style={{ fontWeight: 800, color: '#2C3480', fontSize: '1.15rem' }}>
                            ₹{cardNetPay.toLocaleString('en-IN')}
                          </span>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Actions Row */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #f1f5f9', paddingTop: '0.75rem', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                      <Button
                        size="sm"
                        variant="ghost"
                        style={{ color: '#2C3480' }}
                        onClick={() => handleOpenSalaryModal(p)}
                        title="Configure / Edit Salary Structure"
                      >
                        <Edit3 size={13} style={{ marginRight: '0.25rem' }} /> Edit Salary
                      </Button>

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleOpenSlip(p)}
                        title="View Salary Slip"
                      >
                        <FileText size={13} style={{ marginRight: '0.25rem' }} /> Slip
                      </Button>
                    </div>

                    <div style={{ display: 'flex', gap: '0.35rem' }}>
                      {p.status !== 'Settled' && p.status !== 'Paid' ? (
                        <Button
                          size="sm"
                          variant="primary"
                          style={{ backgroundColor: '#2C3480' }}
                          onClick={() => handleOpenPayModal(p)}
                        >
                          <CreditCard size={13} style={{ marginRight: '0.2rem' }} /> Pay
                        </Button>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.2rem', backgroundColor: '#ecfdf5', padding: '0.3rem 0.6rem', borderRadius: '6px', border: '1px solid #a7f3d0' }}>
                          <CheckCircle2 size={14} /> Settled
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        /* Enhanced Payroll Master Table */
        <Card>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.8125rem' }}>
              <thead>
                <tr style={{ borderBottom: '1.5px solid #e2e8f0', backgroundColor: '#f8fafc', color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  <th style={{ padding: '0.75rem 1rem', cursor: 'pointer' }} onClick={() => handleSort('code')}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      ID / Code <ArrowUpDown size={12} />
                    </div>
                  </th>
                  <th style={{ padding: '0.75rem 1rem', cursor: 'pointer' }} onClick={() => handleSort('name')}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      Staff &amp; Role <ArrowUpDown size={12} />
                    </div>
                  </th>
                  <th style={{ padding: '0.75rem 1rem' }}>Category</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'right', cursor: 'pointer' }} onClick={() => handleSort('salary')}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.25rem' }}>
                      Monthly Salary <ArrowUpDown size={12} />
                    </div>
                  </th>
                  <th style={{ padding: '0.75rem 0.5rem', textAlign: 'center' }}>Present</th>
                  <th style={{ padding: '0.75rem 0.5rem', textAlign: 'center' }}>Absent</th>
                  <th style={{ padding: '0.75rem 0.5rem', textAlign: 'center' }}>Leaves</th>
                  <th style={{ padding: '0.75rem 0.5rem', textAlign: 'center', cursor: 'pointer' }} onClick={() => handleSort('payableDays')}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}>
                      Payable <ArrowUpDown size={12} />
                    </div>
                  </th>
                  <th style={{ padding: '0.75rem 0.75rem', textAlign: 'right' }}>Allowances</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'right', cursor: 'pointer' }} onClick={() => handleSort('netSalary')}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.25rem' }}>
                      Net Payable <ArrowUpDown size={12} />
                    </div>
                  </th>
                  <th style={{ padding: '0.75rem 0.75rem', textAlign: 'center' }}>Status</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedPayrolls.length === 0 ? (
                  <tr>
                    <td colSpan={12} style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
                      No payroll records match the selected filters.
                    </td>
                  </tr>
                ) : (
                  paginatedPayrolls.map((p, pIdx) => {
                    const isDriver = Boolean(
                      p.isDriver ||
                      p.salaryCategory === 'Category C' ||
                      p.salaryCategory === 'Category B' ||
                      p.salaryCategory?.toLowerCase().includes('trip') ||
                      p.salaryCategory?.toLowerCase().includes('driver') ||
                      String(p.designation || '').toLowerCase().includes('driver') ||
                      String(p.designation || '').toLowerCase().includes('per-trip') ||
                      p.department === 'Fleet Logistics' ||
                      Boolean(p.driverId)
                    );
                    const catBadge = getCategoryBadge(p.salaryCategory);
                    const displayTblBadge = isDriver
                      ? { label: 'Cat C: Trip-Based Driver', bg: '#FFFBEB', color: '#92400E' }
                      : catBadge;
                    const pDays = p.attendanceSummary?.payableDays ?? 26;
                    const schedDays = p.policySnapshot?.payrollWorkingDays ?? 26;
                    const presentDays = p.attendanceSummary?.totalPresentDays ?? (p.attendanceSummary?.presentOfficeDays || 0) + (p.attendanceSummary?.presentTripDays || 0);
                    const absentDays = p.attendanceSummary?.absentDays ?? 0;
                    const leaveDays = `${p.attendanceSummary?.paidLeaveDays || 0}P / ${p.attendanceSummary?.unpaidLeaveDays || 0}U`;
                    const allowancesTotal = Number(p.earningsBreakdown?.tripAllowances || 0) + Number(p.earningsBreakdown?.approvedOvertimePay || 0);
                    const tblGross = Number(p.earningsBreakdown?.monthlyGrossSalary || p.grossEarnings || 0);
                    const tblAttPay = Number(p.earningsBreakdown?.attendancePay || Math.round((tblGross / schedDays) * pDays));
                    const tblNetPay = tblAttPay + allowancesTotal;

                    const tblTripCount = Number(p.driverTripSummary?.totalEligibleTrips || p.completedTrips || p.totalTrips || 0);
                    const tblPerTripRate = Number(p.salaryStructure?.perTripRate || p.perTripRate || 600);
                    const tblTripEarnings = Number(p.earningsBreakdown?.attendancePay ?? (tblTripCount * tblPerTripRate));
                    const tblTripAllowances = Number(p.earningsBreakdown?.tripAllowances || p.driverTripSummary?.totalAllowances || 0);
                    const tblDriverNetPay = tblTripEarnings + tblTripAllowances;
                    const rowNetPay = isDriver ? tblDriverNetPay : tblNetPay;
                    const tblDue = Math.max(0, rowNetPay - Number(p.totalPaidAmount || 0));

                    return (
                      <tr key={p._id || p.payrollCode || `payroll-tbl-${pIdx}`} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '0.75rem 1rem', fontWeight: 700, color: '#2C3480', fontFamily: 'monospace' }}>
                          <div>{p.employeeCode}</div>
                          <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{p.payrollCode}</span>
                        </td>

                        <td style={{ padding: '0.75rem 1rem' }}>
                          <div style={{ fontWeight: 700, color: '#090d16' }}>{p.employeeName}</div>
                          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{p.designation} • {p.department}</span>
                        </td>

                        <td style={{ padding: '0.75rem 1rem' }}>
                          <span
                            style={{
                              padding: '0.15rem 0.45rem',
                              borderRadius: '6px',
                              backgroundColor: displayTblBadge.bg,
                              color: displayTblBadge.color,
                              fontSize: '0.7rem',
                              fontWeight: 700
                            }}
                          >
                            {displayTblBadge.label}
                          </span>
                        </td>

                        <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 700 }}>
                          {isDriver ? (
                            <span style={{ color: '#059669', backgroundColor: '#ecfdf5', padding: '0.2rem 0.45rem', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 700 }}>
                              Trip-Based
                            </span>
                          ) : (
                            `₹${tblGross.toLocaleString('en-IN')}`
                          )}
                        </td>

                        <td style={{ padding: '0.75rem 0.5rem', textAlign: 'center', fontWeight: 600, color: '#16a34a' }}>
                          {presentDays}
                        </td>

                        <td style={{ padding: '0.75rem 0.5rem', textAlign: 'center', fontWeight: 600, color: absentDays > 0 ? '#dc2626' : '#64748b' }}>
                          {absentDays}
                        </td>

                        <td style={{ padding: '0.75rem 0.5rem', textAlign: 'center', fontSize: '0.75rem', color: '#475569' }}>
                          {isDriver ? '—' : leaveDays}
                        </td>

                        <td style={{ padding: '0.75rem 0.5rem', textAlign: 'center', fontWeight: 700, color: isDriver ? '#059669' : '#2C3480' }}>
                          {isDriver ? `${tblTripCount} Trips` : `${pDays} / ${schedDays}`}
                        </td>

                        <td style={{ padding: '0.75rem 0.75rem', textAlign: 'right', fontWeight: 600, color: '#059669' }}>
                          ₹{(isDriver ? tblTripAllowances : allowancesTotal).toLocaleString('en-IN')}
                        </td>

                        <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 800, color: '#2C3480', fontSize: '0.95rem' }}>
                          ₹{rowNetPay.toLocaleString('en-IN')}
                        </td>

                        <td style={{ padding: '0.75rem 0.75rem', textAlign: 'center' }}>
                          {p.status === 'Settled' || p.status === 'Paid' ? (
                            <Badge
                              variant="success"
                              style={{
                                backgroundColor: '#ecfdf5',
                                color: '#059669',
                                borderColor: '#a7f3d0',
                                fontWeight: 700
                              }}
                            >
                              ✓ Settled
                            </Badge>
                          ) : (
                            <Badge
                              variant="warning"
                              style={{
                                backgroundColor: '#fffbeb',
                                color: '#b45309',
                                borderColor: '#fde68a',
                                fontWeight: 700
                              }}
                            >
                              Pending
                            </Badge>
                          )}
                        </td>

                        <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'flex-end', alignItems: 'center' }}>
                            <button
                              onClick={() => handleOpenSalaryModal(p)}
                              style={{ border: 'none', background: '#EEF0FD', color: '#2C3480', cursor: 'pointer', padding: '0.3rem 0.45rem', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.2rem' }}
                              title="Edit Salary Structure"
                            >
                              <Edit3 size={13} /> Edit
                            </button>
                            <button
                              onClick={() => handleOpenSlip(p)}
                              style={{ border: 'none', background: 'transparent', color: '#2C3480', cursor: 'pointer', padding: '0.2rem' }}
                              title="Salary Slip"
                            >
                              <FileText size={15} />
                            </button>
                            {p.status !== 'Settled' && p.status !== 'Paid' ? (
                              <button
                                onClick={() => handleOpenPayModal(p)}
                                style={{ border: 'none', background: '#2C3480', color: '#ffffff', cursor: 'pointer', padding: '0.3rem 0.65rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700 }}
                              >
                                Pay
                              </button>
                            ) : (
                              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#059669', padding: '0.2rem 0.45rem', backgroundColor: '#ecfdf5', borderRadius: '4px' }}>
                                Settled
                              </span>
                            )}
                          </div>
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

      {/* Pagination Controls */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.875rem 1.25rem', backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
          Showing <strong>{sortedPayrolls.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}</strong> to <strong>{Math.min(currentPage * pageSize, sortedPayrolls.length)}</strong> of <strong>{sortedPayrolls.length}</strong> staff members
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <Button
            size="sm"
            variant="outline"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          >
            <ChevronLeft size={14} style={{ marginRight: '0.2rem' }} /> Previous
          </Button>
          {Array.from({ length: totalPages }).map((_, i) => (
            <button
              key={`page-btn-${i + 1}`}
              onClick={() => setCurrentPage(i + 1)}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '6px',
                border: '1px solid',
                borderColor: currentPage === i + 1 ? '#2C3480' : '#cbd5e1',
                backgroundColor: currentPage === i + 1 ? '#2C3480' : '#ffffff',
                color: currentPage === i + 1 ? '#ffffff' : '#475569',
                fontWeight: 700,
                fontSize: '0.8125rem',
                cursor: 'pointer'
              }}
            >
              {i + 1}
            </button>
          ))}
          <Button
            size="sm"
            variant="outline"
            disabled={currentPage === totalPages || totalPages === 0}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
          >
            Next <ChevronRight size={14} style={{ marginLeft: '0.2rem' }} />
          </Button>
        </div>
      </div>

      {/* MODAL 1: Detailed Calculation Breakdown Modal */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title={`Payroll Calculation Audit — ${selectedPayroll?.employeeName}`}
        subtitle={`${selectedPayroll?.payrollCode} • Month: ${selectedPayroll?.month} • ${selectedPayroll?.salaryCategory}`}
        size="lg"
        footer={<Button variant="ghost" onClick={() => setIsDetailModalOpen(false)}>Close Breakdown</Button>}
      >
        {selectedPayroll && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Modal Tabs */}
            <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>
              <button
                onClick={() => setDetailTab('formula')}
                style={{
                  padding: '0.45rem 0.85rem',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: detailTab === 'formula' ? '#2C3480' : 'transparent',
                  color: detailTab === 'formula' ? '#ffffff' : '#64748b',
                  fontSize: '0.8125rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Salary Formula &amp; Math
              </button>
              <button
                onClick={() => setDetailTab('attendance')}
                style={{
                  padding: '0.45rem 0.85rem',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: detailTab === 'attendance' ? '#2C3480' : 'transparent',
                  color: detailTab === 'attendance' ? '#ffffff' : '#64748b',
                  fontSize: '0.8125rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Attendance Log Matrix
              </button>
              {(selectedPayroll.isDriver || selectedPayroll.salaryCategory === 'Category B' || selectedPayroll.salaryCategory === 'Category C') && (
                <button
                  onClick={() => setDetailTab('trips')}
                  style={{
                    padding: '0.45rem 0.85rem',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: detailTab === 'trips' ? '#2C3480' : 'transparent',
                    color: detailTab === 'trips' ? '#ffffff' : '#64748b',
                    fontSize: '0.8125rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Driver Trip Allowances ({selectedPayroll.driverTripSummary?.totalEligibleTrips || 0})
                </button>
              )}
              <button
                onClick={() => setDetailTab('payments')}
                style={{
                  padding: '0.45rem 0.85rem',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: detailTab === 'payments' ? '#2C3480' : 'transparent',
                  color: detailTab === 'payments' ? '#ffffff' : '#64748b',
                  fontSize: '0.8125rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Disbursement History
              </button>
              <button
                onClick={() => setDetailTab('salaryHistory')}
                style={{
                  padding: '0.45rem 0.85rem',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: detailTab === 'salaryHistory' ? '#2C3480' : 'transparent',
                  color: detailTab === 'salaryHistory' ? '#ffffff' : '#64748b',
                  fontSize: '0.8125rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem'
                }}
              >
                <TrendingUp size={14} /> Structure &amp; Revisions ({selectedPayroll.salaryRevisionHistory?.length || 0})
              </button>
            </div>

            {/* TAB 1: FORMULA & EARNINGS BREAKDOWN */}
            {detailTab === 'formula' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {/* Mathematical Equation Card */}
                <div style={{ backgroundColor: '#F8FAFC', padding: '1rem', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#2C3480', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                    Formula Applied ({selectedPayroll.salaryCategory}):
                  </div>
                  <div style={{ fontFamily: 'monospace', fontSize: '0.875rem', color: '#1e293b', lineHeight: 1.6 }}>
                    Attendance Pay = (Gross ₹{selectedPayroll.earningsBreakdown?.monthlyGrossSalary || 0} ÷ {selectedPayroll.policySnapshot?.payrollWorkingDays || 26} Working Days) × {selectedPayroll.attendanceSummary?.payableDays || 0} Payable Days = <strong>₹{selectedPayroll.earningsBreakdown?.attendancePay || 0}</strong>
                    <br />
                    Net Payable = Attendance Pay (₹{selectedPayroll.earningsBreakdown?.attendancePay || 0}) + Trip Allowances (₹{selectedPayroll.earningsBreakdown?.tripAllowances || 0}) + Overtime (₹{selectedPayroll.earningsBreakdown?.approvedOvertimePay || 0}) - Deductions (₹{selectedPayroll.deductionsBreakdown?.totalDeductions || 0}) = <strong style={{ color: '#2C3480' }}>₹{selectedPayroll.netPayableSalary}</strong>
                  </div>

                  {selectedPayroll.earningsBreakdown?.isProRata && (
                    <div style={{ marginTop: '0.75rem', padding: '0.65rem 0.85rem', backgroundColor: '#FEF3C7', border: '1px solid #FCD34D', borderRadius: '8px', fontSize: '0.8rem', color: '#92400E' }}>
                      <span style={{ fontWeight: 800, display: 'block' }}>⚡ Mid-Month Pro-Rata Applied (Scenario 2):</span>
                      Salary revision effective {selectedPayroll.earningsBreakdown?.proRataDetails?.effectiveDate}:
                      Day 1–{selectedPayroll.earningsBreakdown?.proRataDetails?.period1?.toDay} at ₹{Number(selectedPayroll.earningsBreakdown?.proRataDetails?.period1?.rate || 0).toLocaleString('en-IN')} rate &amp; Day {selectedPayroll.earningsBreakdown?.proRataDetails?.period2?.fromDay}–end at ₹{Number(selectedPayroll.earningsBreakdown?.proRataDetails?.period2?.rate || 0).toLocaleString('en-IN')} rate.
                      Blended Base: <strong>₹{Number(selectedPayroll.earningsBreakdown?.proRataDetails?.blendedGross || 0).toLocaleString('en-IN')}</strong>.
                    </div>
                  )}
                </div>

                {/* Earnings & Deductions Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  {/* Earnings */}
                  <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '0.875rem' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#16a34a', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                      Earnings Breakdown
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.8125rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Basic Salary:</span>
                        <strong>₹{Number(selectedPayroll.earningsBreakdown?.basicSalary || 0).toLocaleString('en-IN')}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>HRA:</span>
                        <strong>₹{Number(selectedPayroll.earningsBreakdown?.hra || 0).toLocaleString('en-IN')}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Fixed Allowances:</span>
                        <strong>₹{Number(selectedPayroll.earningsBreakdown?.fixedAllowances || 0).toLocaleString('en-IN')}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Fixed Incentives:</span>
                        <strong>₹{Number(selectedPayroll.earningsBreakdown?.fixedIncentives || 0).toLocaleString('en-IN')}</strong>
                      </div>
                      <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '0.35rem', display: 'flex', justifyContent: 'space-between', color: '#2C3480' }}>
                        <strong>Calculated Attendance Pay:</strong>
                        <strong>₹{Number(selectedPayroll.earningsBreakdown?.attendancePay || 0).toLocaleString('en-IN')}</strong>
                      </div>
                      {selectedPayroll.earningsBreakdown?.tripAllowances > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#059669' }}>
                          <span>Driver Trip Allowances:</span>
                          <strong>+₹{Number(selectedPayroll.earningsBreakdown?.tripAllowances).toLocaleString('en-IN')}</strong>
                        </div>
                      )}
                      {selectedPayroll.earningsBreakdown?.approvedOvertimePay > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#059669' }}>
                          <span>Approved Overtime Pay:</span>
                          <strong>+₹{Number(selectedPayroll.earningsBreakdown?.approvedOvertimePay).toLocaleString('en-IN')}</strong>
                        </div>
                      )}
                      <div style={{ borderTop: '1px dashed #cbd5e1', paddingTop: '0.35rem', display: 'flex', justifyContent: 'space-between', fontWeight: 800 }}>
                        <span>Total Gross Earnings:</span>
                        <span style={{ color: '#16a34a' }}>₹{Number(selectedPayroll.earningsBreakdown?.grossEarnings || 0).toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  </div>

                  {/* Deductions */}
                  <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '0.875rem' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#dc2626', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                      Statutory &amp; Leave Deductions
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.8125rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Unpaid Leave ({selectedPayroll.attendanceSummary?.unpaidLeaveDays || 0} days):</span>
                        <strong>₹{Number(selectedPayroll.deductionsBreakdown?.unpaidLeaveDeduction || 0).toLocaleString('en-IN')}</strong>
                      </div>
                      {Number(selectedPayroll.deductionsBreakdown?.pfDeduction || 0) > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>Provident Fund (PF):</span>
                          <strong>₹{Number(selectedPayroll.deductionsBreakdown?.pfDeduction || 0).toLocaleString('en-IN')}</strong>
                        </div>
                      )}
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>ESI Contribution:</span>
                        <strong>₹{Number(selectedPayroll.deductionsBreakdown?.esiDeduction || 0).toLocaleString('en-IN')}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Professional Tax (PT):</span>
                        <strong>₹{Number(selectedPayroll.deductionsBreakdown?.professionalTax || 0).toLocaleString('en-IN')}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>TDS (Tax):</span>
                        <strong>₹{Number(selectedPayroll.deductionsBreakdown?.tdsDeduction || 0).toLocaleString('en-IN')}</strong>
                      </div>
                      <div style={{ borderTop: '1px dashed #cbd5e1', paddingTop: '0.35rem', display: 'flex', justifyContent: 'space-between', fontWeight: 800 }}>
                        <span>Total Deductions:</span>
                        <span style={{ color: '#dc2626' }}>-₹{Number(selectedPayroll.deductionsBreakdown?.totalDeductions || 0).toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: ATTENDANCE SUMMARY */}
            {detailTab === 'attendance' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem' }}>
                <div style={{ backgroundColor: '#f8fafc', padding: '0.75rem', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Scheduled Days</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#090d16' }}>{selectedPayroll.attendanceSummary?.totalScheduledDays || 26}</div>
                </div>
                <div style={{ backgroundColor: '#f0fdf4', padding: '0.75rem', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.75rem', color: '#16a34a' }}>Present Office</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#16a34a' }}>{selectedPayroll.attendanceSummary?.presentOfficeDays || 0}</div>
                </div>
                <div style={{ backgroundColor: '#eff6ff', padding: '0.75rem', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.75rem', color: '#2563eb' }}>Present Trip</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#2563eb' }}>{selectedPayroll.attendanceSummary?.presentTripDays || 0}</div>
                </div>
                <div style={{ backgroundColor: '#fef3c7', padding: '0.75rem', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.75rem', color: '#d97706' }}>Present Standby</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#d97706' }}>{selectedPayroll.attendanceSummary?.presentStandbyDays || 0}</div>
                </div>
                <div style={{ backgroundColor: '#f0fdf4', padding: '0.75rem', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.75rem', color: '#16a34a' }}>Approved Paid Leave</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#16a34a' }}>{selectedPayroll.attendanceSummary?.paidLeaveDays || 0}</div>
                </div>
                <div style={{ backgroundColor: '#fef2f2', padding: '0.75rem', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.75rem', color: '#dc2626' }}>Unpaid Leave</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#dc2626' }}>{selectedPayroll.attendanceSummary?.unpaidLeaveDays || 0}</div>
                </div>
                <div style={{ backgroundColor: '#fff7ed', padding: '0.75rem', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.75rem', color: '#ea580c' }}>Half Days (0.5x)</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ea580c' }}>{selectedPayroll.attendanceSummary?.halfDays || 0}</div>
                </div>
                <div style={{ backgroundColor: '#f8fafc', padding: '0.75rem', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Weekly Offs</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#090d16' }}>{selectedPayroll.attendanceSummary?.weeklyOffDays || 4}</div>
                </div>
                <div style={{ backgroundColor: '#f8fafc', padding: '0.75rem', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Public Holidays</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#090d16' }}>{selectedPayroll.attendanceSummary?.publicHolidays || 1}</div>
                </div>
                <div style={{ backgroundColor: '#EEF0FD', padding: '0.75rem', borderRadius: '8px', textAlign: 'center', border: '1.5px solid #C7D2FE' }}>
                  <div style={{ fontSize: '0.75rem', color: '#2C3480', fontWeight: 700 }}>Total Payable Days</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#2C3480' }}>{selectedPayroll.attendanceSummary?.payableDays || 26}</div>
                </div>
              </div>
            )}

            {/* TAB 3: DRIVER TRIP ALLOWANCES */}
            {detailTab === 'trips' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1e293b' }}>
                    Verified Trips in {selectedPayroll.month}: {selectedPayroll.driverTripSummary?.totalEligibleTrips || 0} completed journeys
                  </div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#059669' }}>
                    Total Trip Allowances: ₹{Number(selectedPayroll.driverTripSummary?.totalAllowances || 0).toLocaleString('en-IN')}
                  </div>
                </div>

                {selectedPayroll.driverTripSummary?.tripDetails?.length === 0 ? (
                  <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
                    No trips assigned for this driver during {selectedPayroll.month}. Driver attendance tracked under standby / office.
                  </div>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b', textAlign: 'left', backgroundColor: '#f8fafc' }}>
                        <th style={{ padding: '0.5rem 0.75rem' }}>Trip ID</th>
                        <th style={{ padding: '0.5rem 0.75rem' }}>Date</th>
                        <th style={{ padding: '0.5rem 0.75rem' }}>Route</th>
                        <th style={{ padding: '0.5rem 0.75rem', textAlign: 'right' }}>Allowances Earned</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedPayroll.driverTripSummary?.tripDetails?.map((tr, trIdx) => (
                        <tr key={tr.tripId || `tr-${trIdx}`} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '0.5rem 0.75rem', fontWeight: 700, color: '#2C3480', fontFamily: 'monospace' }}>
                            {tr.bookingNumber || tr.tripId}
                          </td>
                          <td style={{ padding: '0.5rem 0.75rem' }}>{tr.date}</td>
                          <td style={{ padding: '0.5rem 0.75rem' }}>{tr.route}</td>
                          <td style={{ padding: '0.5rem 0.75rem', textAlign: 'right', fontWeight: 700, color: '#059669' }}>
                            ₹{Number(tr.allowancesEarned || 0).toLocaleString('en-IN')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {/* TAB 4: DISBURSEMENT HISTORY */}
            {detailTab === 'payments' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
                  <span>Net Approved: <strong>₹{Number(selectedPayroll.netPayableSalary).toLocaleString('en-IN')}</strong></span>
                  <span>Paid: <strong style={{ color: '#16a34a' }}>₹{Number(selectedPayroll.totalPaidAmount).toLocaleString('en-IN')}</strong></span>
                  <span>Outstanding: <strong style={{ color: selectedPayroll.outstandingSalary > 0 ? '#dc2626' : '#16a34a' }}>₹{Number(selectedPayroll.outstandingSalary).toLocaleString('en-IN')}</strong></span>
                </div>

                {(!selectedPayroll.paymentHistory || selectedPayroll.paymentHistory.length === 0) ? (
                  <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
                    No disbursement transactions recorded yet for this payroll record.
                  </div>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b', textAlign: 'left' }}>
                        <th style={{ padding: '0.5rem 0.75rem' }}>Payment Ref</th>
                        <th style={{ padding: '0.5rem 0.75rem' }}>Date</th>
                        <th style={{ padding: '0.5rem 0.75rem' }}>Method</th>
                        <th style={{ padding: '0.5rem 0.75rem' }}>Transaction Ref</th>
                        <th style={{ padding: '0.5rem 0.75rem', textAlign: 'right' }}>Amount Disbursed</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedPayroll.paymentHistory.map((pm, pmIdx) => (
                        <tr key={pm.paymentRef || `pm-${pmIdx}`} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '0.5rem 0.75rem', fontFamily: 'monospace', fontWeight: 700, color: '#2C3480' }}>{pm.paymentRef}</td>
                          <td style={{ padding: '0.5rem 0.75rem' }}>{pm.paymentDate}</td>
                          <td style={{ padding: '0.5rem 0.75rem' }}>{pm.paymentMethod}</td>
                          <td style={{ padding: '0.5rem 0.75rem', fontFamily: 'monospace' }}>{pm.transactionRef}</td>
                          <td style={{ padding: '0.5rem 0.75rem', textAlign: 'right', fontWeight: 700, color: '#16a34a' }}>
                            ₹{Number(pm.amount).toLocaleString('en-IN')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {/* TAB 5: SALARY STRUCTURE & REVISION LOG */}
            {detailTab === 'salaryHistory' && (() => {
              const isDriverDetail = Boolean(
                selectedPayroll.isDriver ||
                selectedPayroll.salaryCategory === 'Category C' ||
                selectedPayroll.salaryCategory === 'Category B' ||
                selectedPayroll.salaryCategory?.toLowerCase().includes('trip') ||
                selectedPayroll.salaryCategory?.toLowerCase().includes('driver') ||
                String(selectedPayroll.designation || '').toLowerCase().includes('driver') ||
                String(selectedPayroll.designation || '').toLowerCase().includes('per-trip') ||
                selectedPayroll.department === 'Fleet Logistics' ||
                Boolean(selectedPayroll.driverId)
              );
              const detailTripCount = Number(selectedPayroll.driverTripSummary?.totalEligibleTrips || selectedPayroll.completedTrips || selectedPayroll.totalTrips || 0);
              const detailPerTripRate = Number(selectedPayroll.salaryStructure?.perTripRate || selectedPayroll.perTripRate || 600);

              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {/* Configured Salary Structure Cards */}
                  <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <h4 style={{ fontSize: '0.875rem', fontWeight: 800, color: '#2C3480', margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <TrendingUp size={16} /> {isDriverDetail ? 'Configured Trip-Based Driver Compensation' : `Configured Monthly Salary Structure (${selectedPayroll.salaryCategory})`}
                      </h4>
                      <Button size="sm" variant="outline" onClick={() => handleOpenSalaryModal(selectedPayroll)}>
                        <Edit3 size={13} style={{ marginRight: '0.25rem' }} /> Edit Salary
                      </Button>
                    </div>

                    {isDriverDetail ? (
                      <div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem', marginBottom: '0.5rem' }}>
                          <div style={{ backgroundColor: '#f8fafc', padding: '0.75rem', borderRadius: '8px' }}>
                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Rate Per Trip</div>
                            <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#090d16' }}>
                              ₹{detailPerTripRate.toLocaleString('en-IN')}
                            </div>
                          </div>
                          <div style={{ backgroundColor: '#f8fafc', padding: '0.75rem', borderRadius: '8px' }}>
                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Completed Trips</div>
                            <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#059669' }}>
                              {detailTripCount} Trips
                            </div>
                          </div>
                          <div style={{ backgroundColor: '#f8fafc', padding: '0.75rem', borderRadius: '8px' }}>
                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Per-Trip Allowance</div>
                            <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#1e293b' }}>
                              ₹{payrollPolicy?.driverAllowanceRules?.perTripAllowance || 300}
                            </div>
                          </div>
                          <div style={{ backgroundColor: '#f8fafc', padding: '0.75rem', borderRadius: '8px' }}>
                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Night Allowance</div>
                            <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#1e293b' }}>
                              ₹{payrollPolicy?.driverAllowanceRules?.nightAllowance || 250}
                            </div>
                          </div>
                          <div style={{ backgroundColor: '#f8fafc', padding: '0.75rem', borderRadius: '8px' }}>
                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Long Dist. Allowance</div>
                            <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#1e293b' }}>
                              ₹{payrollPolicy?.driverAllowanceRules?.longDistanceAllowance || 400}
                            </div>
                          </div>
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b', fontStyle: 'italic', marginTop: '0.25rem' }}>
                          * Drivers are compensated strictly per completed trip plus duty allowances. Monthly basic salary proration does not apply.
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem' }}>
                        <div style={{ backgroundColor: '#f8fafc', padding: '0.75rem', borderRadius: '8px' }}>
                          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Monthly Base</div>
                          <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#090d16' }}>
                            ₹{Number(selectedPayroll.earningsBreakdown?.monthlyGrossSalary || 0).toLocaleString('en-IN')}
                          </div>
                        </div>
                        <div style={{ backgroundColor: '#f8fafc', padding: '0.75rem', borderRadius: '8px' }}>
                          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Basic (55%)</div>
                          <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#1e293b' }}>
                            ₹{Number(selectedPayroll.earningsBreakdown?.basicSalary || 0).toLocaleString('en-IN')}
                          </div>
                        </div>
                        <div style={{ backgroundColor: '#f8fafc', padding: '0.75rem', borderRadius: '8px' }}>
                          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>HRA (22%)</div>
                          <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#1e293b' }}>
                            ₹{Number(selectedPayroll.earningsBreakdown?.hra || 0).toLocaleString('en-IN')}
                          </div>
                        </div>
                        <div style={{ backgroundColor: '#f8fafc', padding: '0.75rem', borderRadius: '8px' }}>
                          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Fixed Allow.</div>
                          <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#1e293b' }}>
                            ₹{Number(selectedPayroll.earningsBreakdown?.fixedAllowances || 0).toLocaleString('en-IN')}
                          </div>
                        </div>
                        <div style={{ backgroundColor: '#f8fafc', padding: '0.75rem', borderRadius: '8px' }}>
                          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Fixed Incent.</div>
                          <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#1e293b' }}>
                            ₹{Number(selectedPayroll.earningsBreakdown?.fixedIncentives || 0).toLocaleString('en-IN')}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                {/* Pro-Rata Card if Mid-Month Revision occurred */}
                {selectedPayroll.earningsBreakdown?.isProRata && (
                  <div style={{ backgroundColor: '#FFFBEB', border: '1.5px solid #FDE68A', borderRadius: '12px', padding: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 800, color: '#92400E', fontSize: '0.875rem', marginBottom: '0.35rem' }}>
                      <Sparkles size={16} /> Mid-Month Salary Revision Pro-Rata Applied (Scenario 2)
                    </div>
                    <p style={{ fontSize: '0.8rem', color: '#78350F', margin: '0 0 0.5rem 0' }}>
                      Salary structure was revised effective from <strong>{selectedPayroll.earningsBreakdown?.proRataDetails?.effectiveDate}</strong>. Pro-rata earnings computed proportionally:
                    </p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.8rem' }}>
                      <div style={{ backgroundColor: '#ffffff', padding: '0.65rem', borderRadius: '6px', border: '1px solid #FCD34D' }}>
                        <div style={{ fontWeight: 700, color: '#92400E' }}>Period 1: Day 1 to Day {selectedPayroll.earningsBreakdown?.proRataDetails?.period1?.toDay}</div>
                        <div>Gross Base: ₹{Number(selectedPayroll.earningsBreakdown?.proRataDetails?.period1?.rate || 0).toLocaleString('en-IN')}</div>
                        <div>Payable Days: {selectedPayroll.earningsBreakdown?.proRataDetails?.period1?.payableDays || '-'}</div>
                        <div style={{ fontWeight: 700, color: '#1e293b' }}>Period 1 Pay: ₹{Number(selectedPayroll.earningsBreakdown?.proRataDetails?.period1?.pay || 0).toLocaleString('en-IN')}</div>
                      </div>
                      <div style={{ backgroundColor: '#ffffff', padding: '0.65rem', borderRadius: '6px', border: '1px solid #FCD34D' }}>
                        <div style={{ fontWeight: 700, color: '#92400E' }}>Period 2: Day {selectedPayroll.earningsBreakdown?.proRataDetails?.period2?.fromDay} to End</div>
                        <div>Gross Base: ₹{Number(selectedPayroll.earningsBreakdown?.proRataDetails?.period2?.rate || 0).toLocaleString('en-IN')}</div>
                        <div>Payable Days: {selectedPayroll.earningsBreakdown?.proRataDetails?.period2?.payableDays || '-'}</div>
                        <div style={{ fontWeight: 700, color: '#1e293b' }}>Period 2 Pay: ₹{Number(selectedPayroll.earningsBreakdown?.proRataDetails?.period2?.pay || 0).toLocaleString('en-IN')}</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Salary Revision Audit Log */}
                <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1rem' }}>
                  <h4 style={{ fontSize: '0.875rem', fontWeight: 800, color: '#2C3480', margin: '0 0 0.75rem 0', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <History size={16} /> Salary Revision History &amp; Audit Trail
                  </h4>
                  {(!selectedPayroll.salaryRevisionHistory || selectedPayroll.salaryRevisionHistory.length === 0) ? (
                    <div style={{ padding: '1.5rem', textAlign: 'center', color: '#64748b', fontSize: '0.8125rem', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
                      No previous salary revisions logged for this employee. Click "Edit Salary" to record a salary revision.
                    </div>
                  ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: '#f8fafc', color: '#64748b', textAlign: 'left' }}>
                          <th style={{ padding: '0.5rem 0.75rem' }}>Revision Ref</th>
                          <th style={{ padding: '0.5rem 0.75rem' }}>Effective Date</th>
                          <th style={{ padding: '0.5rem 0.75rem', textAlign: 'right' }}>Previous Salary</th>
                          <th style={{ padding: '0.5rem 0.75rem', textAlign: 'right' }}>New Salary</th>
                          <th style={{ padding: '0.5rem 0.75rem' }}>Remarks</th>
                          <th style={{ padding: '0.5rem 0.75rem' }}>Updated By</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedPayroll.salaryRevisionHistory.map((rev, rIdx) => (
                          <tr key={rev.revisionId || `rev-${rIdx}`} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '0.5rem 0.75rem', fontFamily: 'monospace', fontWeight: 700, color: '#2C3480' }}>
                              {rev.revisionId || `REV-${rIdx + 1}`}
                            </td>
                            <td style={{ padding: '0.5rem 0.75rem', fontWeight: 600 }}>{rev.effectiveDate}</td>
                            <td style={{ padding: '0.5rem 0.75rem', textAlign: 'right', color: '#64748b' }}>
                              ₹{Number(rev.previousSalary || 0).toLocaleString('en-IN')}
                            </td>
                            <td style={{ padding: '0.5rem 0.75rem', textAlign: 'right', fontWeight: 800, color: '#16a34a' }}>
                              ₹{Number(rev.newSalary || 0).toLocaleString('en-IN')}
                            </td>
                            <td style={{ padding: '0.5rem 0.75rem' }}>{rev.remarks || 'Standard salary adjustment'}</td>
                            <td style={{ padding: '0.5rem 0.75rem', color: '#64748b' }}>{rev.updatedBy || 'Operations Admin'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            );
          })()}
          </div>
        )}
      </Modal>

      {/* MODAL 2: Confirm Salary Payment Modal */}
      <Modal
        isOpen={isPayModalOpen}
        onClose={() => setIsPayModalOpen(false)}
        title="Confirm Salary Payment"
        subtitle={`Staff: ${payTarget?.employeeName} (${payTarget?.employeeCode}) • Month: ${payTarget?.month}`}
        size="sm"
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', width: '100%' }}>
            <Button variant="ghost" onClick={() => setIsPayModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleConfirmPayment} style={{ backgroundColor: '#2C3480' }}>
              Confirm
            </Button>
          </div>
        }
      >
        {payTarget && (() => {
          const isDriverTarget = Boolean(
            payTarget.isDriver ||
            payTarget.salaryCategory === 'Category C' ||
            payTarget.salaryCategory === 'Category B' ||
            payTarget.salaryCategory?.toLowerCase().includes('trip') ||
            payTarget.salaryCategory?.toLowerCase().includes('driver') ||
            String(payTarget.designation || '').toLowerCase().includes('driver') ||
            String(payTarget.designation || '').toLowerCase().includes('per-trip') ||
            payTarget.department === 'Fleet Logistics' ||
            Boolean(payTarget.driverId)
          );
          const targetTrips = Number(payTarget.driverTripSummary?.totalEligibleTrips || payTarget.completedTrips || payTarget.totalTrips || 0);
          const targetPerTripRate = Number(payTarget.salaryStructure?.perTripRate || payTarget.perTripRate || 600);
          const targetTripEarnings = Number(payTarget.earningsBreakdown?.attendancePay ?? (targetTrips * targetPerTripRate));
          const targetTripAllow = Number(payTarget.earningsBreakdown?.tripAllowances || payTarget.driverTripSummary?.totalAllowances || 0);
          const targetDriverNet = targetTripEarnings + targetTripAllow;

          const targetGross = Number(payTarget.earningsBreakdown?.monthlyGrossSalary || payTarget.grossEarnings || 0);
          const targetDays = payTarget.attendanceSummary?.payableDays ?? 26;
          const targetSched = payTarget.policySnapshot?.payrollWorkingDays ?? 26;
          const targetAttPay = Number(payTarget.earningsBreakdown?.attendancePay || Math.round((targetGross / targetSched) * targetDays));
          const targetAllow = Number(payTarget.earningsBreakdown?.tripAllowances || 0);
          const targetNet = isDriverTarget ? targetDriverNet : (targetAttPay + targetAllow);

          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '0.25rem' }}>
              <div style={{ backgroundColor: '#EEF0FD', border: '1.5px solid #2C3480', borderRadius: '12px', padding: '1.25rem', textAlign: 'center' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#2C3480', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  NET PAYABLE SALARY
                </span>
                <div style={{ fontSize: '1.85rem', fontWeight: 900, color: '#2C3480', margin: '0.35rem 0' }}>
                  ₹{targetNet.toLocaleString('en-IN')}
                </div>
                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                  {isDriverTarget
                    ? `Based on ${targetTrips} completed trips (Trip-based)`
                    : `Based on attendance (${targetDays} of ${targetSched} days)`}
                </span>
              </div>

              <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '0.85rem 1rem', fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Staff Member:</span>
                  <strong>{payTarget.employeeName}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Designation:</span>
                  <span>{payTarget.designation}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Salary Basis:</span>
                  <strong style={{ color: isDriverTarget ? '#059669' : '#2C3480' }}>
                    {isDriverTarget ? 'Trip-Based' : 'Attendance-Based'}
                  </strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Payroll Month:</span>
                  <span>{payTarget.month}</span>
                </div>
              </div>

              <p style={{ margin: 0, fontSize: '0.825rem', color: '#64748b', textAlign: 'center' }}>
                Click <strong>Confirm</strong> to disburse and mark this salary as <strong>Settled</strong>.
              </p>
            </div>
          );
        })()}
      </Modal>

      {/* MODAL 3: Printable Salary Slip Modal */}
      <Modal
        isOpen={isSlipModalOpen}
        onClose={() => setIsSlipModalOpen(false)}
        title="Official Salary Pay Slip"
        subtitle={`Pay Slip #${slipData?.payrollCode} • Month: ${slipData?.month}`}
        size="lg"
        footer={
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
            <Button variant="ghost" onClick={() => setIsSlipModalOpen(false)}>Close</Button>
            <Button
              variant="primary"
              style={{ backgroundColor: '#2C3480' }}
              onClick={() => window.print()}
              leftIcon={<Printer size={15} />}
            >
              Print / Save PDF
            </Button>
          </div>
        }
      >
        {slipData && (
          <div id="salary-slip-print-area" style={{ backgroundColor: '#ffffff', padding: '1.5rem', border: '1px solid #e2e8f0', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Company Branding Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #2C3480', paddingBottom: '0.875rem' }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#2C3480', margin: 0 }}>
                  MAK TOURS &amp; TRAVELS PRIVATE LIMITED
                </h2>
                <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.2rem' }}>
                  Head Office: #42 Anna Salai, Thousand Lights, Chennai, Tamil Nadu 600006
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                  GSTIN: 33AABCM9842F1Z8 • PAN: AABCM9842F • support@maktours.com
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#2C3480', textTransform: 'uppercase' }}>
                  PAYSLIP FOR {slipData.month}
                </div>
                <div style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '0.85rem', color: '#090d16' }}>
                  {slipData.payrollCode}
                </div>
                <Badge variant={slipData.status === 'Paid' || slipData.status === 'Settled' ? 'success' : 'warning'}>
                  {slipData.status === 'Paid' || slipData.status === 'Settled' ? '✓ Settled' : 'Pending'}
                </Badge>
              </div>
            </div>

            {/* Employee Information Strip */}
            {(() => {
              const isDriverSlip = Boolean(
                slipData.isDriver ||
                slipData.salaryCategory === 'Category C' ||
                slipData.salaryCategory === 'Category B' ||
                slipData.salaryCategory?.toLowerCase().includes('trip') ||
                slipData.salaryCategory?.toLowerCase().includes('driver') ||
                String(slipData.designation || '').toLowerCase().includes('driver') ||
                String(slipData.designation || '').toLowerCase().includes('per-trip') ||
                slipData.department === 'Fleet Logistics' ||
                Boolean(slipData.driverId)
              );
              const slipTripCount = Number(slipData.driverTripSummary?.totalEligibleTrips || slipData.completedTrips || slipData.totalTrips || 0);

              return (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', backgroundColor: '#f8fafc', padding: '0.875rem', borderRadius: '8px', fontSize: '0.8125rem' }}>
                  <div>
                    <div><strong>Employee Name:</strong> {slipData.employeeName}</div>
                    <div><strong>Employee ID:</strong> {slipData.employeeCode}</div>
                    <div><strong>Designation:</strong> {slipData.designation}</div>
                    <div><strong>Department:</strong> {slipData.department}</div>
                  </div>
                  <div>
                    <div><strong>Salary Category:</strong> {isDriverSlip ? 'Category C: Trip-Based Driver' : slipData.salaryCategory}</div>
                    <div><strong>Bank Name:</strong> HDFC Corporate Bank</div>
                    <div><strong>Bank Account:</strong> ••••••••8912</div>
                    {isDriverSlip ? (
                      <div><strong>Completed Trips:</strong> <span style={{ color: '#059669', fontWeight: 700 }}>{slipTripCount} {slipTripCount === 1 ? 'Trip' : 'Trips'}</span></div>
                    ) : (
                      <div><strong>Payable Days:</strong> {slipData.attendanceSummary?.payableDays || 26} of {slipData.policySnapshot?.payrollWorkingDays || 26} days</div>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Direct Attendance or Trip-Based Salary Calculation */}
            {(() => {
              const isDriverSlip = Boolean(
                slipData.isDriver ||
                slipData.salaryCategory === 'Category C' ||
                slipData.salaryCategory === 'Category B' ||
                slipData.salaryCategory?.toLowerCase().includes('trip') ||
                slipData.salaryCategory?.toLowerCase().includes('driver') ||
                String(slipData.designation || '').toLowerCase().includes('driver') ||
                String(slipData.designation || '').toLowerCase().includes('per-trip') ||
                slipData.department === 'Fleet Logistics' ||
                Boolean(slipData.driverId)
              );

              const slipTripCount = Number(slipData.driverTripSummary?.totalEligibleTrips || slipData.completedTrips || slipData.totalTrips || 0);
              const slipPerTripRate = Number(slipData.salaryStructure?.perTripRate || slipData.perTripRate || 600);
              const slipTripEarnings = Number(slipData.earningsBreakdown?.attendancePay ?? (slipTripCount * slipPerTripRate));
              const slipTripAllowances = Number(slipData.earningsBreakdown?.tripAllowances || slipData.driverTripSummary?.totalAllowances || 0);
              const slipDriverNetPay = slipTripEarnings + slipTripAllowances;

              const slipMonthlySalary = Number(
                slipData.earningsBreakdown?.monthlyGrossSalary ||
                slipData.grossEarnings ||
                slipData.basicSalary ||
                42000
              );
              const slipWorkingDays = slipData.policySnapshot?.payrollWorkingDays || 26;
              const slipPayableDays = slipData.attendanceSummary?.payableDays ?? 26;
              const slipAttendancePay = Number(
                slipData.earningsBreakdown?.attendancePay ||
                Math.round((slipMonthlySalary / slipWorkingDays) * slipPayableDays)
              );
              const slipOfficeAllowances = Number(slipData.earningsBreakdown?.tripAllowances || 0);
              const slipOfficeNetPay = slipAttendancePay + slipOfficeAllowances;

              if (isDriverSlip) {
                return (
                  <>
                    <div style={{ backgroundColor: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: '12px', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                      <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#2C3480', textTransform: 'uppercase', letterSpacing: '0.04em', borderBottom: '1.5px solid #e2e8f0', paddingBottom: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>Trip-Based Driver Earnings Calculation</span>
                        <span style={{ fontSize: '0.72rem', backgroundColor: '#ecfdf5', color: '#059669', padding: '0.15rem 0.45rem', borderRadius: '4px', textTransform: 'none', fontWeight: 700 }}>
                          Per-Trip Basis
                        </span>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.95rem' }}>
                        <span style={{ color: '#475569', fontWeight: 600 }}>Salary Basis:</span>
                        <span style={{ fontWeight: 800, color: '#059669', fontSize: '1.05rem' }}>
                          Trip-Based (Not Monthly)
                        </span>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.9rem' }}>
                        <span style={{ color: '#475569' }}>Completed Eligible Trips:</span>
                        <span style={{ fontWeight: 700, color: '#0f172a' }}>
                          {slipTripCount} {slipTripCount === 1 ? 'Trip' : 'Trips'}
                        </span>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.9rem' }}>
                        <span style={{ color: '#475569' }}>Rate Per Trip:</span>
                        <span style={{ fontWeight: 700, color: '#0f172a' }}>
                          ₹{slipPerTripRate.toLocaleString('en-IN')} / trip
                        </span>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.95rem', borderTop: '1px dashed #cbd5e1', paddingTop: '0.65rem' }}>
                        <div>
                          <span style={{ fontWeight: 700, color: '#2C3480' }}>Trip Earnings:</span>
                          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                            {slipTripCount} {slipTripCount === 1 ? 'trip' : 'trips'} &times; ₹{slipPerTripRate.toLocaleString('en-IN')}
                          </div>
                        </div>
                        <span style={{ fontWeight: 800, color: '#16a34a', fontSize: '1.25rem' }}>
                          ₹{slipTripEarnings.toLocaleString('en-IN')}
                        </span>
                      </div>

                      {slipTripAllowances > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.9rem', color: '#059669' }}>
                          <span style={{ fontWeight: 600 }}>Driver Trip Allowances (Bata/Night/Distance):</span>
                          <span style={{ fontWeight: 700 }}>+₹{slipTripAllowances.toLocaleString('en-IN')}</span>
                        </div>
                      )}
                    </div>

                    {/* Net Pay Banner */}
                    <div style={{ backgroundColor: '#EEF0FD', border: '1.5px solid #2C3480', borderRadius: '10px', padding: '1.1rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#2C3480', textTransform: 'uppercase' }}>
                          NET PAYABLE SALARY
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                          Calculated on trip basis ({slipTripCount} {slipTripCount === 1 ? 'trip' : 'trips'} completed)
                        </div>
                      </div>
                      <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#2C3480' }}>
                        ₹{slipDriverNetPay.toLocaleString('en-IN')}
                      </div>
                    </div>
                  </>
                );
              }

              // Regular office staff calculation
              return (
                <>
                  <div style={{ backgroundColor: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: '12px', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#2C3480', textTransform: 'uppercase', letterSpacing: '0.04em', borderBottom: '1.5px solid #e2e8f0', paddingBottom: '0.5rem' }}>
                      Salary &amp; Attendance Calculation
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.95rem' }}>
                      <span style={{ color: '#475569', fontWeight: 600 }}>Monthly Salary:</span>
                      <span style={{ fontWeight: 800, color: '#0f172a', fontSize: '1.15rem' }}>
                        ₹{slipMonthlySalary.toLocaleString('en-IN')}
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.9rem' }}>
                      <span style={{ color: '#475569' }}>Total Working Days in Month:</span>
                      <span style={{ fontWeight: 700, color: '#0f172a' }}>
                        {slipWorkingDays} Days
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.9rem' }}>
                      <span style={{ color: '#475569' }}>Attendance (Payable Days):</span>
                      <span style={{ fontWeight: 700, color: '#16a34a' }}>
                        {slipPayableDays} of {slipWorkingDays} Days
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.95rem', borderTop: '1px dashed #cbd5e1', paddingTop: '0.65rem' }}>
                      <div>
                        <span style={{ fontWeight: 700, color: '#2C3480' }}>Calculated Amount (From Attendance):</span>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                          (₹{slipMonthlySalary.toLocaleString('en-IN')} &divide; {slipWorkingDays} days) &times; {slipPayableDays} {slipPayableDays === 1 ? 'day' : 'days'}
                        </div>
                      </div>
                      <span style={{ fontWeight: 800, color: '#16a34a', fontSize: '1.25rem' }}>
                        ₹{slipAttendancePay.toLocaleString('en-IN')}
                      </span>
                    </div>

                    {slipOfficeAllowances > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.9rem', color: '#059669' }}>
                        <span style={{ fontWeight: 600 }}>Allowances:</span>
                        <span style={{ fontWeight: 700 }}>+₹{slipOfficeAllowances.toLocaleString('en-IN')}</span>
                      </div>
                    )}
                  </div>

                  {/* Net Pay Banner */}
                  <div style={{ backgroundColor: '#EEF0FD', border: '1.5px solid #2C3480', borderRadius: '10px', padding: '1.1rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#2C3480', textTransform: 'uppercase' }}>
                        NET PAYABLE SALARY
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                        Amount calculated from attendance ({slipPayableDays} of {slipWorkingDays} days)
                      </div>
                    </div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#2C3480' }}>
                      ₹{slipOfficeNetPay.toLocaleString('en-IN')}
                    </div>
                  </div>
                </>
              );
            })()}

            {/* Informational Reimbursements Note (Separate from salary!) */}
            <div style={{ fontSize: '0.72rem', color: '#64748b', borderTop: '1px solid #f1f5f9', paddingTop: '0.5rem' }}>
              * Note: Fuel, toll, and trip reimbursements are audited separately under Expense Vouchers and are not taxable salary components.
            </div>

            {/* Authorized Signatures */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px dashed #cbd5e1', fontSize: '0.75rem', color: '#64748b' }}>
              <div>Employee Signature</div>
              <div style={{ textAlign: 'right' }}>
                For MAK TOURS &amp; TRAVELS PVT LTD
                <div style={{ marginTop: '1.5rem', fontWeight: 700, color: '#090d16' }}>Authorized Signatory</div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* MODAL 4: Policy Configuration Modal */}
      <Modal
        isOpen={isPolicyModalOpen}
        onClose={() => setIsPolicyModalOpen(false)}
        title="Configure Company Payroll Policy"
        subtitle="Define base working days, calculation method, and driver allowance rates"
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', width: '100%' }}>
            <Button variant="ghost" onClick={() => setIsPolicyModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleSavePolicy} style={{ backgroundColor: '#2C3480' }}>
              Save &amp; Apply Policy
            </Button>
          </div>
        }
      >
        <form onSubmit={handleSavePolicy} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#334155', marginBottom: '0.25rem' }}>
                Standard Working Days / Month *
              </label>
              <Input
                type="number"
                value={policyWorkingDays}
                onChange={(e) => setPolicyWorkingDays(e.target.value)}
                min="20"
                max="31"
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#334155', marginBottom: '0.25rem' }}>
                Salary Calculation Method *
              </label>
              <select
                value={policyCalcMethod}
                onChange={(e) => setPolicyCalcMethod(e.target.value)}
                style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.875rem' }}
              >
                <option value="Fixed Payroll Working Days">Fixed Payroll Working Days (e.g. 26 Days)</option>
                <option value="Calendar Days">Calendar Days (28-31 Days in Month)</option>
                <option value="Actual Scheduled Working Days">Actual Scheduled Working Days</option>
              </select>
            </div>
          </div>

          <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '0.75rem' }}>
            <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: '#2C3480', margin: '0 0 0.5rem 0' }}>
              Driver Trip Allowance Rates (₹)
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: '#475569', marginBottom: '0.2rem' }}>
                  Per-Trip Allowance (₹)
                </label>
                <Input
                  type="number"
                  value={policyPerTripRate}
                  onChange={(e) => setPolicyPerTripRate(e.target.value)}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: '#475569', marginBottom: '0.2rem' }}>
                  Night Driving Allowance (₹)
                </label>
                <Input
                  type="number"
                  value={policyNightRate}
                  onChange={(e) => setPolicyNightRate(e.target.value)}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: '#475569', marginBottom: '0.2rem' }}>
                  Long-Distance (&gt;250km) Allowance (₹)
                </label>
                <Input
                  type="number"
                  value={policyLongDistRate}
                  onChange={(e) => setPolicyLongDistRate(e.target.value)}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: '#475569', marginBottom: '0.2rem' }}>
                  Overnight Outstation Allowance (₹)
                </label>
                <Input
                  type="number"
                  value={policyOvernightRate}
                  onChange={(e) => setPolicyOvernightRate(e.target.value)}
                />
              </div>
            </div>
          </div>
        </form>
      </Modal>

      {/* MODAL 5: Edit Salary Structure Modal */}
      <Modal
        isOpen={isSalaryModalOpen}
        onClose={() => setIsSalaryModalOpen(false)}
        title={`Edit Salary Structure — ${salaryTarget?.employeeName}`}
        subtitle={`${salaryTarget?.employeeCode || salaryTarget?.employeeId} • ${salaryTarget?.designation || 'Staff'} • ${salaryTarget?.department}`}
        size="lg"
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', width: '100%' }}>
            <Button variant="ghost" onClick={() => setIsSalaryModalOpen(false)}>Cancel</Button>
            <Button
              variant="primary"
              onClick={handleConfirmSalaryRevision}
              disabled={isSubmittingSalary}
              style={{ backgroundColor: '#2C3480' }}
            >
              {isSubmittingSalary ? 'Saving & Recalculating...' : 'Save & Recalculate Payroll'}
            </Button>
          </div>
        }
      >
        {salaryTarget && (() => {
          const isDriverModal = Boolean(
            salaryTarget.isDriver ||
            salaryCategoryInput === 'Category C' ||
            salaryTarget.salaryCategory === 'Category C' ||
            String(salaryTarget.designation || '').toLowerCase().includes('driver') ||
            String(salaryTarget.designation || '').toLowerCase().includes('per-trip') ||
            salaryTarget.department === 'Fleet Logistics' ||
            Boolean(salaryTarget.driverId)
          );
          const currentTripRate = Number(salaryTarget.salaryStructure?.perTripRate || salaryTarget.perTripRate || 600);
          const currentMonthly = Number(salaryTarget.earningsBreakdown?.monthlyGrossSalary || salaryTarget.monthlySalary || 0);

          return (
            <form onSubmit={handleConfirmSalaryRevision} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Current vs New Banner */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', backgroundColor: '#F8FAFC', padding: '1rem', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                    {isDriverModal ? 'Current Rate Per Trip' : 'Current Monthly Base'}
                  </span>
                  <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#090d16' }}>
                    ₹{isDriverModal ? `${currentTripRate.toLocaleString('en-IN')} / trip` : currentMonthly.toLocaleString('en-IN')}
                  </div>
                  <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                    {isDriverModal ? 'Category C: Trip-Based Driver' : salaryTarget.salaryCategory}
                  </span>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#2C3480', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                    {isDriverModal ? 'New Rate Per Trip (₹) *' : 'New Monthly Salary (₹) *'}
                  </label>
                  <Input
                    type="number"
                    value={newSalaryInput}
                    onChange={(e) => setNewSalaryInput(e.target.value)}
                    placeholder={isDriverModal ? 'e.g. 600 or 1500' : 'e.g. 35000'}
                    required
                    style={{ fontSize: '1rem', fontWeight: 700 }}
                  />
                </div>
              </div>

              {/* Effective Date & Salary Category */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#334155', marginBottom: '0.25rem' }}>
                    Effective From Date *
                  </label>
                  <Input
                    type="date"
                    value={effectiveDateInput}
                    onChange={(e) => setEffectiveDateInput(e.target.value)}
                    required
                  />
                  <span style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.2rem', display: 'block' }}>
                    {isDriverModal ? 'Effective date for updated trip rate' : 'Mid-month dates trigger pro-rata attendance pay automatically'}
                  </span>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#334155', marginBottom: '0.25rem' }}>
                    Salary Category *
                  </label>
                  <select
                    value={salaryCategoryInput}
                    onChange={(e) => setSalaryCategoryInput(e.target.value)}
                    style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.875rem', backgroundColor: '#ffffff' }}
                  >
                    <option value="Category A">Category A – Fixed Monthly</option>
                    <option value="Category B">Category B – Monthly + Trip Allowances</option>
                    <option value="Category C">Category C – Trip-Based Driver</option>
                    <option value="Category D">Category D – Daily Wage</option>
                    <option value="Category E">Category E – Contract</option>
                  </select>
                </div>
              </div>

              {isDriverModal ? (
                /* Driver Trip-Based Notice Card */
                <div style={{ border: '1.5px solid #A7F3D0', backgroundColor: '#ECFDF5', borderRadius: '10px', padding: '1rem' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#065F46', marginBottom: '0.35rem' }}>
                    ✓ Trip-Based Compensation Structure
                  </div>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: '#047857' }}>
                    Drivers are compensated strictly per completed trip. Monthly base salary and attendance prorations do not apply. Driver trip earnings equal <strong>Completed Eligible Trips &times; Per-Trip Rate</strong> plus official trip duty allowances (bata, night shifts, outstation distance, and overnight allowances).
                  </p>
                </div>
              ) : (
                /* Salary Structure Breakdown with Auto-Split Button */
                <div style={{ border: '1px solid #e2e8f0', borderRadius: '10px', padding: '1rem', backgroundColor: '#ffffff' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#2C3480', textTransform: 'uppercase' }}>
                      Structure Breakdown (Earnings &amp; Deductions)
                    </span>
                    <Button type="button" size="sm" variant="outline" onClick={handleAutoSplit}>
                      <Sparkles size={13} style={{ marginRight: '0.25rem' }} /> Auto-Split Proportions (55% Basic, 22% HRA, 11% Allow, 12% Incent)
                    </Button>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', color: '#475569', marginBottom: '0.2rem' }}>Basic Salary (₹)</label>
                      <Input type="number" value={basicInput} onChange={(e) => setBasicInput(e.target.value)} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', color: '#475569', marginBottom: '0.2rem' }}>HRA (₹)</label>
                      <Input type="number" value={hraInput} onChange={(e) => setHraInput(e.target.value)} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', color: '#475569', marginBottom: '0.2rem' }}>Fixed Allowances (₹)</label>
                      <Input type="number" value={allowanceInput} onChange={(e) => setAllowanceInput(e.target.value)} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', color: '#475569', marginBottom: '0.2rem' }}>Fixed Incentives (₹)</label>
                      <Input type="number" value={incentiveInput} onChange={(e) => setIncentiveInput(e.target.value)} />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginTop: '0.75rem', borderTop: '1px solid #f1f5f9', paddingTop: '0.75rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', color: '#dc2626', marginBottom: '0.2rem' }}>ESI Deduction (₹)</label>
                      <Input type="number" value={esiInput} onChange={(e) => setEsiInput(e.target.value)} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', color: '#dc2626', marginBottom: '0.2rem' }}>Professional Tax (₹)</label>
                      <Input type="number" value={ptInput} onChange={(e) => setPtInput(e.target.value)} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', color: '#dc2626', marginBottom: '0.2rem' }}>TDS / Tax (₹)</label>
                      <Input type="number" value={tdsInput} onChange={(e) => setTdsInput(e.target.value)} />
                    </div>
                  </div>
                </div>
              )}

            {/* Revision Remarks */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#334155', marginBottom: '0.25rem' }}>
                Revision Reason / Audit Remarks *
              </label>
              <Input
                value={salaryRemarksInput}
                onChange={(e) => setSalaryRemarksInput(e.target.value)}
                placeholder="e.g. Annual performance increment, Grade revision, Promotion"
                required
              />
            </div>

            {/* Previous History Preview */}
            {employeeRevisionHistory && employeeRevisionHistory.length > 0 && (
              <div style={{ backgroundColor: '#F8FAFC', borderRadius: '8px', padding: '0.75rem', border: '1px solid #E2E8F0' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#2C3480', display: 'block', marginBottom: '0.35rem' }}>
                  Previous Salary Revisions:
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.75rem', color: '#475569' }}>
                  {employeeRevisionHistory.slice(-3).map((r, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.2rem' }}>
                      <span>{r.effectiveDate}: ₹{Number(r.previousSalary || 0).toLocaleString('en-IN')} → <strong>₹{Number(r.newSalary || 0).toLocaleString('en-IN')}</strong> ({r.remarks})</span>
                      <span style={{ color: '#64748b' }}>by {r.updatedBy}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </form>
        );
      })()}
      </Modal>
    </div>
  );
}

export default PayrollManagement;
