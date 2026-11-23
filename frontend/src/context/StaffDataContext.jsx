// MAK Tours & Travels ERP - Dedicated Staff Portal Data Context
// Connected to MongoDB Atlas "employees", "attendance", and "payrolls" collections
import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { employeeService } from '../services/employeeService';
import { payrollService } from '../services/payrollService';
import { apiClient } from '../services/apiClient';
import { loadStoredJson, saveStoredJson } from '../utils/storage';
import { useToast } from './ToastContext';

export const StaffDataContext = createContext();

const STORAGE_KEYS = {
  STAFF_PROFILE: 'mak_staff_profile_cache',
  STAFF_LEAVES: 'mak_staff_leaves_cache',
  STAFF_PUNCHES: 'mak_staff_punches_cache'
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

  // Calculate Attendance Metrics strictly using Admin Payroll logic
  const attendanceMetrics = useMemo(() => {
    const totalMonthDays = 30; // November
    const weeklyOffs = 4;
    const holidays = 1; // Deepavali Festival Off
    const workingDays = totalMonthDays - weeklyOffs - holidays; // 25 days

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
      totalMonthDays,
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
      payableDays: effectivePresentDays + (attendanceLog.length >= 25 ? weeklyOffs + holidays : 0)
    };
  }, [attendanceLog]);

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

  // 4. Authoritative Attendance-Based Salary Calculation (Consumes Backend Payroll when available)
  const salaryDetails = useMemo(() => {
    if (matchedPayroll) {
      const eb = matchedPayroll.earningsBreakdown || {};
      const db = matchedPayroll.deductionsBreakdown || {};
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
          esi: db.esiDeduction || 0,
          professionalTax: db.professionalTax || 0,
          totalDeductions: (Number(db.esiDeduction || 0) + Number(db.professionalTax || 0)) || 0
        },
        earnedGrossSalary: eb.grossEarnings || 0,
        netPayableSalary: matchedPayroll.netPayableSalary || 0,
        lastSalaryPaid: matchedPayroll.totalPaidAmount || 0,
        pendingSalary: matchedPayroll.outstandingSalary !== undefined ? matchedPayroll.outstandingSalary : Math.max(0, (matchedPayroll.netPayableSalary || 0) - (matchedPayroll.totalPaidAmount || 0)),
        paymentStatus: matchedPayroll.status || 'Calculated'
      };
    }

    const basicMonthly = profile.monthlySalary || 0;
    const workingDays = attendanceMetrics.workingDays || 26;
    const basicPortion = Math.round(basicMonthly * 0.50);
    const hraPortion = Math.round(basicMonthly * 0.25);
    const travelAllowance = Math.round(basicMonthly * 0.15);
    const specialAllowance = Math.max(0, basicMonthly - basicPortion - hraPortion - travelAllowance);

    const projectedFullMonthGross = Math.round(basicMonthly * ((attendanceMetrics.attendancePercentage || 100) / 100));

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
        professionalTax: 0,
        totalDeductions: 0
      },
      earnedGrossSalary: projectedFullMonthGross,
      netPayableSalary: projectedFullMonthGross,
      lastSalaryPaid: 0,
      pendingSalary: projectedFullMonthGross,
      paymentStatus: 'Awaiting Calculation'
    };
  }, [matchedPayroll, profile.monthlySalary, profile.salaryBasis, attendanceMetrics]);

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
    const record = {
      ...newLeave,
      id: leaveId,
      status: 'Pending',
      appliedAt: 'Just now',
      reviewedBy: 'Pending Admin Review'
    };

    setLeaveRequests((prev) => [record, ...prev]);
    toast.success(`Leave request ${leaveId} submitted for managerial approval!`);
    return record;
  }, [toast]);

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

  // 7. Salary Slips & History
  const salarySlips = useMemo(() => {
    return [
      {
        month: 'October 2026',
        period: '2026-10-01 to 2026-10-31',
        slipNumber: 'MAK-SLIP-2026-10-010',
        basicSalary: profile.monthlySalary || 42000,
        attendancePercentage: 98,
        presentDays: 24,
        workingDays: 25,
        grossSalary: 42000,
        totalDeductions: 200,
        netSalary: 41800,
        paymentStatus: 'Paid',
        paymentDate: '2026-10-31',
        paymentMethod: 'Bank Direct NEFT',
        transactionRef: 'NEFT-MAK-88910243'
      },
      {
        month: 'September 2026',
        period: '2026-09-01 to 2026-09-30',
        slipNumber: 'MAK-SLIP-2026-09-010',
        basicSalary: profile.monthlySalary || 42000,
        attendancePercentage: 96,
        presentDays: 24,
        workingDays: 25,
        grossSalary: 42000,
        totalDeductions: 200,
        netSalary: 41800,
        paymentStatus: 'Paid',
        paymentDate: '2026-09-30',
        paymentMethod: 'Bank Direct NEFT',
        transactionRef: 'NEFT-MAK-77192840'
      },
      {
        month: 'August 2026',
        period: '2026-08-01 to 2026-08-31',
        slipNumber: 'MAK-SLIP-2026-08-010',
        basicSalary: profile.monthlySalary || 42000,
        attendancePercentage: 100,
        presentDays: 26,
        workingDays: 26,
        grossSalary: 42000,
        totalDeductions: 200,
        netSalary: 41800,
        paymentStatus: 'Paid',
        paymentDate: '2026-08-31',
        paymentMethod: 'Bank Direct NEFT',
        transactionRef: 'NEFT-MAK-66291048'
      }
    ];
  }, [profile.monthlySalary]);

  const value = {
    profile,
    selectedMonth,
    attendanceMetrics,
    attendanceLog,
    salaryDetails,
    leaveBalances,
    leaveRequests,
    applyForLeave,
    recordTodayPunch,
    updateStaffProfile,
    salarySlips
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
