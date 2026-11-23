// MAK Tours & Travels ERP - Dedicated Staff Portal Data Context
// Connected to MongoDB Atlas "employees", "attendance", and "payrolls" collections
import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { employeeService } from '../services/employeeService';
import { payrollService } from '../services/payrollService';
import { apiClient } from '../services/apiClient';
import { loadStoredJson, saveStoredJson } from '../utils/storage';
import { useToast } from './ToastContext';
import { TripContext } from './TripContext';

export const StaffDataContext = createContext();

const STORAGE_KEYS = {
  STAFF_PROFILE: 'mak_staff_profile_cache',
  STAFF_LEAVES: 'mak_staff_leaves_cache',
  STAFF_PUNCHES: 'mak_staff_punches_cache',
  STAFF_DEDUCTIONS: 'mak_staff_deduction_overrides'
};

export const defaultDeductionConfig = {
  isWaived: false,
  deductionAmount: 200,
  reason: 'Professional Tax (PT) statutory deduction',
  months: {
    'October 2026': { isWaived: false, deductionAmount: 200, reason: 'Late arrival penalty (3 instances > 15 mins)' },
    'September 2026': { isWaived: false, deductionAmount: 200, reason: 'Professional Tax statutory deduction' },
    'August 2026': { isWaived: false, deductionAmount: 200, reason: 'Professional Tax statutory deduction' },
    'November 2026': { isWaived: false, deductionAmount: 200, reason: 'Professional Tax statutory deduction' }
  }
};

const buildStaffProfileFromUser = (u) => {
  if (!u) return null;
  const name = u.fullName || u.name || 'Staff Member';
  const email = u.email || '';
  const phone = u.phone || u.mobileNumber || '';
  const code = u.employeeCode || u.code || u.id || '';
  const avatar = u.avatar || (name ? name.substring(0, 2).toUpperCase() : 'ST');

  return {
    id: u.employeeId || u.id || u._id || code,
    employeeCode: code,
    code: code,
    fullName: name,
    name: name,
    email: email,
    phone: phone,
    designation: u.designation || u.role || 'Operations Staff',
    department: u.department || 'Operations & Dispatch',
    workType: u.workType || 'Operations Staff',
    jobRole: u.jobRole || u.designation || 'Operations Associate',
    reportingManager: u.reportingManager || 'Ananya Deshmukh (General Operations Manager)',
    joiningDate: u.joiningDate ? String(u.joiningDate).substring(0, 10) : '2024-03-15',
    employmentType: u.employmentType || 'Full-Time',
    workLocation: u.workLocation || 'Chennai HQ - Main Operations Center',
    workStatus: u.status || 'Active',
    employmentStatus: u.status === 'Active' ? 'Confirmed' : (u.status || 'Active'),
    shift: u.shift || 'General (09:30 - 18:30)',
    salaryBasis: u.salaryBasis || 'Attendance-Based Monthly Salary',
    monthlySalary: Number(u.monthlySalary || u.salary || 42000),
    salaryCategory: u.salaryCategory || 'Category A – Fixed Monthly',
    responsibilities: Array.isArray(u.responsibilities) && u.responsibilities.length > 0
      ? u.responsibilities
      : [
          'Live customer itinerary management and tour reservations',
          'Fleet vehicle assignment coordination with senior dispatchers',
          'Customer travel support, route coordination & emergency resolution',
          'Daily manifest reconciliation and journey closure verification'
        ],
    avatar: avatar,
    address: u.address || '',
    emergencyContact: u.emergencyContact || ''
  };
};

export function StaffDataProvider({ children }) {
  const { currentUser, updateUserProfile } = useAuth();
  const toast = useToast();
  const tripCtx = useContext(TripContext);

  const selectedMonth = '2026-11';

  // 1. Employee Profile State derived directly from authenticated user
  const [profile, setProfile] = useState(() => {
    const cached = loadStoredJson(STORAGE_KEYS.STAFF_PROFILE, null);
    if (currentUser) {
      const built = buildStaffProfileFromUser(currentUser);
      return cached && cached.email === currentUser.email ? { ...cached, ...built } : built;
    }
    return cached || buildStaffProfileFromUser({});
  });

  // Keep profile synchronized whenever currentUser updates
  useEffect(() => {
    if (!currentUser) return;
    setProfile((prev) => {
      const fresh = buildStaffProfileFromUser(currentUser);
      const merged = { ...prev, ...fresh, ...currentUser };
      if (currentUser.fullName) merged.fullName = currentUser.fullName;
      if (currentUser.name) merged.name = currentUser.name;
      if (currentUser.avatar) merged.avatar = currentUser.avatar;
      if (currentUser.designation) merged.designation = currentUser.designation;
      saveStoredJson(STORAGE_KEYS.STAFF_PROFILE, merged);
      return merged;
    });
  }, [currentUser]);

  // Listen for custom event 'mak_staff_profile_updated'
  useEffect(() => {
    const handleProfileUpdate = (e) => {
      if (e?.detail) {
        setProfile((prev) => {
          const fresh = buildStaffProfileFromUser(e.detail);
          const merged = { ...prev, ...fresh, ...e.detail };
          if (e.detail.fullName) merged.fullName = e.detail.fullName;
          if (e.detail.name) merged.name = e.detail.name;
          if (e.detail.avatar) merged.avatar = e.detail.avatar;
          if (e.detail.designation) merged.designation = e.detail.designation;
          saveStoredJson(STORAGE_KEYS.STAFF_PROFILE, merged);
          return merged;
        });
      }
    };

    window.addEventListener('mak_staff_profile_updated', handleProfileUpdate);
    return () => window.removeEventListener('mak_staff_profile_updated', handleProfileUpdate);
  }, []);

  // 2. Live Employee Profile Sync from MongoDB Atlas via /api/employees
  useEffect(() => {
    if (!currentUser?.email) return;

    employeeService.getAll()
      .then((res) => {
        if (res?.data && Array.isArray(res.data) && res.data.length > 0) {
          const matched = res.data.find(
            (e) => (e.email && e.email.toLowerCase() === currentUser.email.toLowerCase()) ||
                   (e.employeeCode && currentUser.employeeCode && e.employeeCode.toUpperCase() === currentUser.employeeCode.toUpperCase()) ||
                   (e.fullName && currentUser.name && e.fullName.toLowerCase() === currentUser.name.toLowerCase())
          );

          if (matched) {
            setProfile((prev) => {
              const merged = {
                ...prev,
                ...matched,
                id: matched.id || matched.employeeCode || matched._id,
                employeeCode: matched.employeeCode || matched.code || prev.employeeCode,
                fullName: matched.fullName || matched.name || prev.fullName,
                name: matched.fullName || matched.name || prev.name,
                designation: matched.designation || matched.role || prev.designation,
                department: matched.department || prev.department,
                workType: matched.workType || prev.workType,
                jobRole: matched.jobRole || matched.designation || prev.jobRole,
                monthlySalary: Number(matched.monthlySalary || matched.salary) || prev.monthlySalary,
                salaryBasis: matched.salaryBasis || prev.salaryBasis,
                reportingManager: matched.reportingManager || prev.reportingManager,
                joiningDate: matched.joiningDate ? String(matched.joiningDate).substring(0, 10) : prev.joiningDate,
                employmentType: matched.employmentType || prev.employmentType,
                workLocation: matched.workLocation || prev.workLocation,
                employmentStatus: matched.status === 'Active' ? 'Confirmed' : (matched.status || 'Active'),
                workStatus: matched.status || 'Active',
                responsibilities: Array.isArray(matched.responsibilities) && matched.responsibilities.length > 0
                  ? matched.responsibilities
                  : prev.responsibilities,
                avatar: matched.avatar || prev.avatar,
                address: matched.address || prev.address,
                emergencyContact: matched.emergencyContact || prev.emergencyContact
              };
              saveStoredJson(STORAGE_KEYS.STAFF_PROFILE, merged);
              return merged;
            });
          }
        }
      })
      .catch((err) => {
        console.warn('Staff profile fetch deferred:', err);
      });
  }, [currentUser?.email, currentUser?.employeeCode]);

  // Profile update handler
  const updateStaffProfile = useCallback(async (updatedFields) => {
    // 1. Optimistic update in StaffDataContext
    setProfile((prev) => {
      const merged = { ...prev, ...updatedFields };
      saveStoredJson(STORAGE_KEYS.STAFF_PROFILE, merged);
      return merged;
    });
    // 2. Call AuthContext updateUserProfile to hit backend API PUT /api/auth/me
    const success = await updateUserProfile(updatedFields);
    return success;
  }, [updateUserProfile]);

  // 3. Attendance Simulation & Live Data for Current Month (Nov 2026)
  const [attendanceLog, setAttendanceLog] = useState(() => {
    const punches = loadStoredJson(STORAGE_KEYS.STAFF_PUNCHES, []);
    // Days 1 through 13 of Nov 2026:
    const initialDays = [
      { date: '2026-11-01', day: 'Sun', status: 'Weekly Off', checkIn: '-', checkOut: '-', hours: 0 },
      { date: '2026-11-02', day: 'Mon', status: 'Present', checkIn: '09:25 AM', checkOut: '06:35 PM', hours: 9.1 },
      { date: '2026-11-03', day: 'Tue', status: 'Present', checkIn: '09:30 AM', checkOut: '06:30 PM', hours: 9.0 },
      { date: '2026-11-04', day: 'Wed', status: 'Present', checkIn: '09:15 AM', checkOut: '06:45 PM', hours: 9.5 },
      { date: '2026-11-05', day: 'Thu', status: 'Present', checkIn: '09:28 AM', checkOut: '06:32 PM', hours: 9.1 },
      { date: '2026-11-06', day: 'Fri', status: 'Present', checkIn: '09:35 AM', checkOut: '06:30 PM', hours: 8.9 },
      { date: '2026-11-07', day: 'Sat', status: 'Present', checkIn: '09:30 AM', checkOut: '02:30 PM', hours: 5.0 },
      { date: '2026-11-08', day: 'Sun', status: 'Weekly Off', checkIn: '-', checkOut: '-', hours: 0 },
      { date: '2026-11-09', day: 'Mon', status: 'Present', checkIn: '09:20 AM', checkOut: '06:40 PM', hours: 9.3 },
      { date: '2026-11-10', day: 'Tue', status: 'Paid Leave', checkIn: '-', checkOut: '-', hours: 0, remarks: 'Casual Leave Approved' },
      { date: '2026-11-11', day: 'Wed', status: 'Present', checkIn: '09:30 AM', checkOut: '06:30 PM', hours: 9.0 },
      { date: '2026-11-12', day: 'Thu', status: 'Present', checkIn: '09:25 AM', checkOut: '06:35 PM', hours: 9.2 },
      { date: '2026-11-13', day: 'Fri', status: 'Present', checkIn: '09:18 AM', checkOut: 'In Progress', hours: 4.5 }
    ];

    if (punches && punches.length > 0) {
      const punchMap = new Map(punches.map((p) => [p.date, p]));
      return initialDays.map((d) => (punchMap.has(d.date) ? { ...d, ...punchMap.get(d.date) } : d));
    }
    return initialDays;
  });

  // Admin-controlled deduction configuration (can be waived/cancelled or applied with specific reason)
  const [deductionConfig, setDeductionConfig] = useState(() => {
    return loadStoredJson(STORAGE_KEYS.STAFF_DEDUCTIONS, defaultDeductionConfig);
  });

  useEffect(() => {
    const handleUpdate = () => {
      const stored = loadStoredJson(STORAGE_KEYS.STAFF_DEDUCTIONS, defaultDeductionConfig);
      setDeductionConfig(stored);
    };
    window.addEventListener('mak_staff_deduction_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('mak_staff_deduction_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  const updateDeduction = useCallback((monthKey, { isWaived, deductionAmount, reason }) => {
    setDeductionConfig((prev) => {
      const next = {
        ...prev,
        isWaived: isWaived !== undefined ? isWaived : prev.isWaived,
        deductionAmount: deductionAmount !== undefined ? deductionAmount : prev.deductionAmount,
        reason: reason || prev.reason,
        months: {
          ...(prev.months || {}),
          [monthKey]: {
            isWaived: Boolean(isWaived),
            deductionAmount: isWaived ? 0 : Number(deductionAmount || 0),
            reason: isWaived ? 'Waived / Cancelled by Admin' : (reason || 'Deduction applied by Admin')
          }
        }
      };
      saveStoredJson(STORAGE_KEYS.STAFF_DEDUCTIONS, next);
      window.dispatchEvent(new CustomEvent('mak_staff_deduction_updated', { detail: next }));
      return next;
    });
  }, []);

  // Calculate Attendance Metrics strictly using Admin Payroll logic and dynamic calendar days (30, 31, 28/29)
  const attendanceMetrics = useMemo(() => {
    let year = 2026;
    let monthNum = 11;
    if (selectedMonth && typeof selectedMonth === 'string' && selectedMonth.includes('-')) {
      const parts = selectedMonth.split('-');
      year = parseInt(parts[0], 10) || 2026;
      monthNum = parseInt(parts[1], 10) || 11;
    }
    // Dynamic days according to month: 30 for Nov/Apr/Jun/Sep, 31 for Oct/Dec/Jan/Mar/May/Jul/Aug, 28/29 for Feb
    const totalMonthDays = new Date(year, monthNum, 0).getDate();
    const weeklyOffs = 4;
    const holidays = 1; // Deepavali Festival Off
    const workingDays = totalMonthDays - weeklyOffs - holidays;

    let presentDays = 0;
    let halfDays = 0;
    let paidLeaves = 0;
    let unpaidLeaves = 0;
    let absentDays = 0;

    attendanceLog.forEach((d) => {
      if (d.status === 'Present') presentDays += 1;
      else if (d.status === 'Half Day') halfDays += 1;
      else if (d.status === 'Paid Leave') paidLeaves += 1;
      else if (d.status === 'Unpaid Leave') unpaidLeaves += 1;
      else if (d.status === 'Absent') absentDays += 1;
    });

    // Payable days calculation
    const effectivePresentDays = presentDays + (halfDays * 0.5) + paidLeaves;
    const elapsedWorkingDays = 11; // 13 elapsed minus 2 Sundays
    const attendancePercentage = Math.min(100, Math.round((effectivePresentDays / elapsedWorkingDays) * 100));

    return {
      totalMonthDays, // e.g. 30 for November, 31 for October, 28/29 for February
      weeklyOffs,
      holidays,
      workingDays,
      presentDays,
      halfDays,
      paidLeaves,
      unpaidLeaves,
      absentDays,
      effectivePresentDays,
      attendancePercentage: isNaN(attendancePercentage) ? 96 : attendancePercentage,
      payableDays: effectivePresentDays + (attendanceLog.length >= workingDays ? weeklyOffs + holidays : 0)
    };
  }, [attendanceLog, selectedMonth]);

  // Synchronize official backend payroll data for this employee
  const [backendPayrolls, setBackendPayrolls] = useState([]);

  useEffect(() => {
    payrollService
      .getAll({ month: '2026-11' })
      .then((res) => {
        if (res?.data && Array.isArray(res.data)) {
          setBackendPayrolls(res.data);
        }
      })
      .catch((err) => console.warn('Staff payroll sync deferred:', err.message));
  }, [profile?.code, profile?.id]);

  const matchedPayroll = useMemo(() => {
    if (!profile) return null;
    const c = (profile.code || profile.employeeCode || profile.id || '').toLowerCase();
    const n = (profile.fullName || profile.name || '').toLowerCase();
    return backendPayrolls.find(
      (p) =>
        (p.employeeCode && p.employeeCode.toLowerCase() === c) ||
        (p.employeeId && p.employeeId.toLowerCase() === c) ||
        (p.employeeName && p.employeeName.toLowerCase() === n)
    );
  }, [backendPayrolls, profile]);

  // 4. Authoritative Attendance-Based Salary Calculation with Admin Deduction Control
  const salaryDetails = useMemo(() => {
    const novCfg = deductionConfig?.months?.['November 2026'] || deductionConfig?.months?.['2026-11'] || {
      isWaived: Boolean(deductionConfig?.isWaived),
      amount: deductionConfig?.isWaived ? 0 : Number(deductionConfig?.deductionAmount || 0),
      reason: deductionConfig?.isWaived ? 'Waived by Admin' : (deductionConfig?.reason || 'Statutory / Biometric grace deduction')
    };
    const isDeductionWaived = Boolean(novCfg.isWaived || deductionConfig?.isWaived);
    const configuredDeduction = isDeductionWaived ? 0 : Number(novCfg.amount ?? (deductionConfig?.deductionAmount || 0));
    const deductionReason = isDeductionWaived
      ? 'Deduction Waived / Cancelled by Operations Admin'
      : (novCfg.reason || deductionConfig?.reason || 'Biometric attendance adjustment');

    if (matchedPayroll) {
      const eb = matchedPayroll.earningsBreakdown || {};
      const db = matchedPayroll.deductionsBreakdown || {};
      const actualDeduction = isDeductionWaived ? 0 : (configuredDeduction || Number(db.totalDeductions || db.professionalTax || 0));
      const calculatedNet = Math.max(0, (eb.grossEarnings || eb.monthlyGrossSalary || profile.monthlySalary || 0) - actualDeduction);

      return {
        monthlyBasicSalary: eb.monthlyGrossSalary || eb.basicSalary || profile.monthlySalary || 0,
        salaryBasis: profile.salaryBasis || 'Attendance-Based Monthly Salary',
        salaryStructure: {
          basicPay: eb.basicSalary || 0,
          hra: eb.hra || 0,
          travelAllowance: eb.fixedAllowances || 0,
          specialAllowance: eb.fixedIncentives || 0,
          grossSalary: eb.grossEarnings || eb.monthlyGrossSalary || 0
        },
        statutoryDeductions: {
          pf: 0,
          esi: isDeductionWaived ? 0 : (db.esiDeduction || 0),
          professionalTax: isDeductionWaived ? 0 : (db.professionalTax || configuredDeduction),
          totalDeductions: actualDeduction
        },
        isDeductionWaived,
        deductionReason,
        earnedGrossSalary: eb.grossEarnings || 0,
        netPayableSalary: calculatedNet,
        lastSalaryPaid: matchedPayroll.totalPaidAmount || 0,
        pendingSalary: calculatedNet,
        paymentStatus: matchedPayroll.status || 'Calculated'
      };
    }

    const basicMonthly = profile.monthlySalary || 42000;
    const workingDays = attendanceMetrics.workingDays || 25;
    const basicPortion = Math.round(basicMonthly * 0.50);
    const hraPortion = Math.round(basicMonthly * 0.25);
    const travelAllowance = Math.round(basicMonthly * 0.15);
    const specialAllowance = Math.max(0, basicMonthly - basicPortion - hraPortion - travelAllowance);

    const projectedFullMonthGross = Math.round(basicMonthly * ((attendanceMetrics.attendancePercentage || 100) / 100));
    const actualDeduction = isDeductionWaived ? 0 : configuredDeduction;
    const calculatedNet = Math.max(0, projectedFullMonthGross - actualDeduction);

    return {
      monthlyBasicSalary: basicMonthly,
      salaryBasis: profile.salaryBasis || 'Attendance-Based Monthly Salary',
      salaryStructure: {
        basicPay: basicPortion,
        hra: hraPortion,
        travelAllowance,
        specialAllowance,
        grossSalary: basicMonthly
      },
      statutoryDeductions: {
        pf: 0,
        esi: 0,
        professionalTax: actualDeduction,
        totalDeductions: actualDeduction
      },
      isDeductionWaived,
      deductionReason,
      earnedGrossSalary: projectedFullMonthGross,
      netPayableSalary: calculatedNet,
      lastSalaryPaid: 0,
      pendingSalary: calculatedNet,
      paymentStatus: 'Awaiting Calculation'
    };
  }, [matchedPayroll, profile.monthlySalary, profile.salaryBasis, attendanceMetrics, deductionConfig]);

  // 5. Leave Management State
  const [leaveBalances, setLeaveBalances] = useState({
    casualLeave: { total: 12, used: 2, remaining: 10 },
    sickLeave: { total: 10, used: 1, remaining: 9 },
    earnedLeave: { total: 15, used: 3, remaining: 12 }
  });

  const [leaveRequests, setLeaveRequests] = useState(() => {
    return loadStoredJson(STORAGE_KEYS.STAFF_LEAVES, [
      {
        id: 'LV-2026-081',
        leaveType: 'Casual Leave',
        startDate: '2026-11-10',
        endDate: '2026-11-10',
        days: 1,
        reason: 'Personal family engagement in Chennai',
        status: 'Approved',
        appliedAt: '2026-11-08 10:15 AM',
        reviewedBy: 'Ananya Deshmukh (Manager)',
        reviewedAt: '2026-11-08 04:30 PM'
      },
      {
        id: 'LV-2026-062',
        leaveType: 'Sick Leave',
        startDate: '2026-10-18',
        endDate: '2026-10-18',
        days: 1,
        reason: 'Medical health checkup',
        status: 'Approved',
        appliedAt: '2026-10-17 08:30 AM',
        reviewedBy: 'Ananya Deshmukh (Manager)',
        reviewedAt: '2026-10-17 11:00 AM'
      }
    ]);
  });

  useEffect(() => {
    saveStoredJson(STORAGE_KEYS.STAFF_LEAVES, leaveRequests);
  }, [leaveRequests]);

  const applyForLeave = useCallback((newLeave) => {
    const leaveId = `LV-2026-${Math.floor(100 + Math.random() * 900)}`;
    const empName = profile?.fullName || profile?.name || 'Staff Member';
    const empCode = profile?.code || profile?.employeeCode || 'EMP-STF';
    const record = {
      ...newLeave,
      id: leaveId,
      employeeName: empName,
      employeeCode: empCode,
      department: profile?.department || 'Operations & Dispatch',
      status: 'Pending',
      appliedAt: 'Just now',
      reviewedBy: 'Pending Admin Review'
    };

    setLeaveRequests((prev) => [record, ...prev]);

    // Sync to Admin Leaves storage so admin attendance immediately reflects it
    try {
      const adminLeaves = loadStoredJson('mak_admin_leaves_v10_atlas', []) || [];
      const updatedAdmin = [
        {
          id: leaveId,
          employeeId: profile?.id || empCode,
          employeeName: empName,
          employeeCode: empCode,
          department: profile?.department || 'Operations & Dispatch',
          leaveType: newLeave.leaveType || 'Casual Leave',
          fromDate: newLeave.startDate,
          toDate: newLeave.endDate,
          totalDays: newLeave.days || 1,
          reason: newLeave.reason,
          status: 'Pending',
          appliedOn: new Date().toISOString().substring(0, 10),
          reviewedBy: null
        },
        ...adminLeaves.filter((l) => l.id !== leaveId)
      ];
      saveStoredJson('mak_admin_leaves_v10_atlas', updatedAdmin);
    } catch (e) {}

    // Dispatch admin notification
    if (tripCtx?.pushAdminNotification) {
      tripCtx.pushAdminNotification(
        `Staff Leave Request: ${empName} (${empCode})`,
        `${empName} submitted ${newLeave.leaveType || 'leave'} for ${newLeave.startDate} to ${newLeave.endDate} (${newLeave.days || 1} day(s)). Reason: "${newLeave.reason}"`,
        {
          type: 'leave',
          category: 'Staff Leave Request',
          priority: 'Normal',
          actionUrl: '/admin/attendance?tab=leaves',
          actionLink: '/admin/attendance?tab=leaves'
        }
      );
    }

    toast.success(`Leave request ${leaveId} submitted for managerial approval!`);
    return record;
  }, [profile, tripCtx, toast]);

  const cancelLeave = useCallback((leaveId, reason = 'Cancelled by Staff') => {
    let target = null;
    setLeaveRequests((prev) =>
      prev.map((l) => {
        if (l.id === leaveId) {
          target = {
            ...l,
            status: 'Cancelled',
            cancelledAt: new Date().toISOString(),
            cancellationReason: reason
          };
          return target;
        }
        return l;
      })
    );

    // Update shared admin storage
    try {
      const adminLeaves = loadStoredJson('mak_admin_leaves_v10_atlas', null);
      if (adminLeaves && Array.isArray(adminLeaves)) {
        const updatedAdmin = adminLeaves.map((l) =>
          l.id === leaveId ? { ...l, status: 'Cancelled', cancellationReason: reason } : l
        );
        saveStoredJson('mak_admin_leaves_v10_atlas', updatedAdmin);
      }
    } catch (e) {}

    const empName = profile?.fullName || profile?.name || target?.employeeName || 'Staff Member';
    const empCode = profile?.code || profile?.employeeCode || target?.employeeCode || 'Staff';

    if (tripCtx?.cancelStaffLeave && target) {
      tripCtx.cancelStaffLeave(leaveId, {
        name: empName,
        code: empCode,
        startDate: target.startDate || target.fromDate,
        endDate: target.endDate || target.toDate
      }, reason);
    } else if (tripCtx?.pushAdminNotification && target) {
      tripCtx.pushAdminNotification(
        `Staff Leave Cancelled: ${empName} (${empCode})`,
        `${empName} has cancelled leave request ${target.id} (${target.startDate || target.fromDate} to ${target.endDate || target.toDate}).`,
        {
          type: 'leave',
          category: 'Staff Leave Request',
          priority: 'High',
          actionUrl: '/admin/attendance?tab=leaves',
          actionLink: '/admin/attendance?tab=leaves'
        }
      );
    }

    window.dispatchEvent(new CustomEvent('mak_staff_leave_updated', { detail: { id: leaveId, status: 'Cancelled' } }));
    toast.success(`Leave request ${leaveId} cancelled. Admin has been notified.`);
    return target;
  }, [profile, tripCtx, toast]);

  // 6. Punch In / Out Handler
  const recordTodayPunch = useCallback((type = 'Punch In') => {
    const todayStr = '2026-11-13';
    const nowTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    setAttendanceLog((prev) =>
      prev.map((item) => {
        if (item.date === todayStr) {
          if (type === 'Punch In') {
            return { ...item, status: 'Present', checkIn: nowTime };
          } else {
            return { ...item, checkOut: nowTime, hours: 9.0 };
          }
        }
        return item;
      })
    );

    toast.success(`Attendance ${type} successfully recorded at ${nowTime}!`);
  }, [toast]);

  // 7. Salary Slips & History with dynamic calendar days & Admin-controlled deductions
  const salarySlips = useMemo(() => {
    const getMonthConfig = (mName, defaultDeduct, defaultReason) => {
      const mCfg = deductionConfig?.months?.[mName];
      if (mCfg) {
        return {
          isWaived: Boolean(mCfg.isWaived),
          amount: mCfg.isWaived ? 0 : Number(mCfg.deductionAmount || 0),
          reason: mCfg.reason || (mCfg.isWaived ? 'Waived / Cancelled by Admin' : defaultReason)
        };
      }
      if (deductionConfig?.isWaived) {
        return {
          isWaived: true,
          amount: 0,
          reason: 'Waived / Cancelled by Admin'
        };
      }
      return {
        isWaived: false,
        amount: deductionConfig?.deductionAmount !== undefined ? deductionConfig.deductionAmount : defaultDeduct,
        reason: deductionConfig?.reason || defaultReason
      };
    };

    const octCfg = getMonthConfig('October 2026', 200, 'Late arrival penalty (3 instances > 15 mins)');
    const sepCfg = getMonthConfig('September 2026', 200, 'Professional Tax statutory deduction');
    const augCfg = getMonthConfig('August 2026', 200, 'Professional Tax statutory deduction');

    const baseGross = Number(profile.monthlySalary || 42000);

    return [
      {
        month: 'October 2026',
        period: '2026-10-01 to 2026-10-31',
        slipNumber: 'MAK-SLIP-2026-10-010',
        basicSalary: baseGross,
        attendancePercentage: 98,
        presentDays: 24,
        totalMonthDays: 31, // October has 31 days
        workingDays: 27, // 31 days minus 4 Sundays
        grossSalary: baseGross,
        totalDeductions: octCfg.amount,
        deductionReason: octCfg.reason,
        isDeductionWaived: octCfg.isWaived,
        deductionStatus: octCfg.isWaived ? 'Waived by Admin' : 'Applied',
        netSalary: baseGross - octCfg.amount,
        paymentStatus: 'Paid',
        paymentDate: '2026-10-31',
        paymentMethod: 'Bank Direct NEFT',
        transactionRef: 'NEFT-MAK-88910243'
      },
      {
        month: 'September 2026',
        period: '2026-09-01 to 2026-09-30',
        slipNumber: 'MAK-SLIP-2026-09-010',
        basicSalary: baseGross,
        attendancePercentage: 96,
        presentDays: 24,
        totalMonthDays: 30, // September has 30 days
        workingDays: 26, // 30 days minus 4 Sundays
        grossSalary: baseGross,
        totalDeductions: sepCfg.amount,
        deductionReason: sepCfg.reason,
        isDeductionWaived: sepCfg.isWaived,
        deductionStatus: sepCfg.isWaived ? 'Waived by Admin' : 'Applied',
        netSalary: baseGross - sepCfg.amount,
        paymentStatus: 'Paid',
        paymentDate: '2026-09-30',
        paymentMethod: 'Bank Direct NEFT',
        transactionRef: 'NEFT-MAK-77192840'
      },
      {
        month: 'August 2026',
        period: '2026-08-01 to 2026-08-31',
        slipNumber: 'MAK-SLIP-2026-08-010',
        basicSalary: baseGross,
        attendancePercentage: 100,
        presentDays: 26,
        totalMonthDays: 31, // August has 31 days
        workingDays: 26, // 31 days minus 5 Sundays
        grossSalary: baseGross,
        totalDeductions: augCfg.amount,
        deductionReason: augCfg.reason,
        isDeductionWaived: augCfg.isWaived,
        deductionStatus: augCfg.isWaived ? 'Waived by Admin' : 'Applied',
        netSalary: baseGross - augCfg.amount,
        paymentStatus: 'Paid',
        paymentDate: '2026-08-31',
        paymentMethod: 'Bank Direct NEFT',
        transactionRef: 'NEFT-MAK-66291048'
      }
    ];
  }, [profile.monthlySalary, deductionConfig]);

  const value = {
    profile,
    selectedMonth,
    attendanceMetrics,
    attendanceLog,
    salaryDetails,
    leaveBalances,
    leaveRequests,
    applyForLeave,
    cancelLeave,
    recordTodayPunch,
    updateStaffProfile,
    salarySlips,
    deductionConfig,
    updateDeduction
  };

  return <StaffDataContext.Provider value={value}>{children}</StaffDataContext.Provider>;
}

export function useStaffData() {
  const context = useContext(StaffDataContext);
  if (!context) {
    throw new Error('useStaffData must be used within a StaffDataProvider');
  }
  return context;
}

export default StaffDataProvider;
