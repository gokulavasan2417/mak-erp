// MAK Tours & Travels ERP - Advanced Attendance-Based Automatic Payroll Controller
import mongoose from 'mongoose';
import { Payroll } from '../models/Payroll.js';
import { SalaryPayment } from '../models/SalaryPayment.js';
import { PayrollPolicy } from '../models/PayrollPolicy.js';
import { Employee } from '../models/Employee.js';
import { Driver } from '../models/Driver.js';
import { Attendance } from '../models/Attendance.js';
import { Booking } from '../models/Booking.js';
import { Expense } from '../models/Expense.js';
import { Company } from '../models/Company.js';
import { escapeRegex } from '../utils/escapeRegex.js';
import { validateMonth, getDaysInMonth, calculateScheduledWorkingDays, isNightShift } from '../utils/dateUtils.js';
import { sequenceService } from '../services/sequenceService.js';
import { postingService } from '../services/postingService.js';
import { stripProtectedFields, whitelistFields } from '../utils/fieldHelper.js';

// Helper to get or create active payroll policy (race-safe upsert)
export async function getActivePolicy(tenantId = 'mak-tours') {
  const normTenant = (tenantId || 'mak-tours').toLowerCase().trim();

  let policy = await PayrollPolicy.findOne({ tenantId: normTenant, isDefault: true }).lean();
  if (!policy) {
    policy = await PayrollPolicy.findOneAndUpdate(
      { tenantId: normTenant, isDefault: true },
      {
        $setOnInsert: {
          tenantId: normTenant,
          name: 'Standard Corporate Policy',
          isDefault: true,
          payrollWorkingDays: 26,
          calculationMethod: 'Fixed Payroll Working Days',
          weeklyOffDays: ['Sunday'],
          publicHolidays: [],
          nightShiftStart: '22:00',
          nightShiftEnd: '06:00',
          statutory: {
            pf: { enabled: true, employeeRate: 0.12, employerRate: 0.12, wageCeiling: 15000, enforceCeiling: true },
            esi: { enabled: true, employeeRate: 0.0075, employerRate: 0.0325, wageCeiling: 21000 },
            professionalTax: {
              enabled: true,
              slabs: [
                { minGross: 0, maxGross: 15000, taxAmount: 0 },
                { minGross: 15001, maxGross: 20000, taxAmount: 150 },
                { minGross: 20001, maxGross: null, taxAmount: 200 }
              ]
            },
            applyToContractors: false
          }
        }
      },
      {
        upsert: true,
        returnDocument: 'after',
        setDefaultsOnInsert: true
      }
    ).lean();
  }
  return policy;
}

// Convert amount in words (Indian Rupees)
export function numberToWords(amount) {
  const num = Math.round(Number(amount) || 0);
  if (num === 0) return 'Zero Rupees Only';

  const a = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'
  ];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function convertBelowThousand(n) {
    if (n === 0) return '';
    if (n < 20) return a[n] + ' ';
    if (n < 100) return b[Math.floor(n / 10)] + ' ' + a[n % 10] + ' ';
    return a[Math.floor(n / 100)] + ' Hundred ' + convertBelowThousand(n % 100);
  }

  let words = '';
  const crore = Math.floor(num / 10000000);
  const lakh = Math.floor((num % 10000000) / 100000);
  const thousand = Math.floor((num % 100000) / 1000);
  const remainder = num % 1000;

  if (crore > 0) words += convertBelowThousand(crore) + 'Crore ';
  if (lakh > 0) words += convertBelowThousand(lakh) + 'Lakh ';
  if (thousand > 0) words += convertBelowThousand(thousand) + 'Thousand ';
  if (remainder > 0) words += convertBelowThousand(remainder);

  return words.trim() + ' Rupees Only';
}

// Helper: Calculate or Upsert Single Employee Payroll Snapshot
export async function calculateOrUpsertEmployeePayroll(emp, month, policy, attendanceRecords, completedTrips) {
  const [yearStr, monthStr] = month.split('-');
  const year = parseInt(yearStr, 10);
  const monthNum = parseInt(monthStr, 10);

  const tenantId = (emp.tenantId || 'mak-tours').toLowerCase().trim();
  const empId = String(emp.employeeCode || emp.id || emp._id);
  const cleanEmpId = empId.replace(/[^A-Za-z0-9]/g, '');
  const payrollCode = `PAY-${month.replace('-', '')}-${cleanEmpId}`;

  // Check if payroll already exists
  const existing = await Payroll.findOne({
    tenantId,
    $or: [
      { payrollCode },
      { employeeId: empId, month },
      { employeeCode: emp.employeeCode, month }
    ]
  });

  // If payroll is already Approved, Paid, or Partially Paid, preserve it!
  if (existing && (existing.status === 'Approved' || existing.status === 'Paid' || existing.status === 'Partially Paid')) {
    return { status: 'preserved', payroll: existing };
  }

  // Exact matching only: NO name matching, NO endsWith("")
  const norm = (val) => String(val || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const targetCodes = new Set(
    [
      norm(emp.employeeCode),
      norm(emp.code),
      norm(emp.id),
      norm(emp._id),
      norm(emp.driverId),
      norm(emp.driverBadgeId)
    ].filter((c) => c && c.length > 0)
  );

  // Filter attendance records strictly for this employee in this month
  const empAttendanceMap = new Map();
  attendanceRecords.forEach((a) => {
    const aEmpId = norm(a.employeeId);
    const aCode = norm(a.employeeCode);
    const aDrv = norm(a.driverId);

    const isMatch = (aEmpId && targetCodes.has(aEmpId)) || (aCode && targetCodes.has(aCode)) || (aDrv && targetCodes.has(aDrv));
    if (isMatch) {
      const dKey = a.date || a.createdAt?.toString()?.substring(0, 10);
      if (dKey) {
        empAttendanceMap.set(dKey, a);
      }
    }
  });

  const empAttendance = Array.from(empAttendanceMap.values());

  // Summarize attendance classifications (check half-day BEFORE office/trip/standby)
  let presentOfficeDays = 0;
  let presentTripDays = 0;
  let presentStandbyDays = 0;
  let presentOtherDutyDays = 0;
  let halfDays = 0;
  let paidLeaveDays = 0;
  let unpaidLeaveDays = 0;
  let absentDays = 0;
  let weeklyOffDays = 0;
  let publicHolidays = 0;
  let overtimeHours = 0;

  empAttendance.forEach((att) => {
    const st = String(att.status || '').toLowerCase().trim();
    if (st.includes('half day') || st.includes('half-day')) {
      halfDays++;
    } else if (st.includes('unpaid')) {
      unpaidLeaveDays++;
    } else if (st.includes('paid leave') || st.includes('on leave') || st === 'leave' || (st.includes('leave') && !st.includes('unpaid'))) {
      paidLeaveDays++;
    } else if (st.includes('absent')) {
      absentDays++;
    } else if (st.includes('weekly off') || st.includes('week off')) {
      weeklyOffDays++;
    } else if (st.includes('holiday')) {
      publicHolidays++;
    } else if (st.includes('trip')) {
      presentTripDays++;
    } else if (st.includes('standby')) {
      presentStandbyDays++;
    } else if (st.includes('other duty')) {
      presentOtherDutyDays++;
    } else if (st.includes('office') || (st === 'present' && !att.isDriverAttendance)) {
      presentOfficeDays++;
    } else if (st.includes('present')) {
      presentOfficeDays++;
    } else {
      presentOfficeDays++;
    }
    if (att.overtimeHours) overtimeHours += Number(att.overtimeHours) || 0;
  });

  // Calculate scheduled working days using real calendar
  const calInfo = calculateScheduledWorkingDays(
    year,
    monthNum,
    policy.weeklyOffDays || ['Sunday'],
    policy.publicHolidays || []
  );

  let payrollWorkingDays = 26;
  let unmarkedDaysCount = 0;

  if (policy.calculationMethod === 'Calendar Days') {
    payrollWorkingDays = calInfo.daysInMonth;
  } else if (policy.calculationMethod === 'Actual Scheduled Working Days') {
    payrollWorkingDays = calInfo.scheduledWorkingDays;
  } else {
    // Fixed Payroll Working Days
    payrollWorkingDays = policy.payrollWorkingDays || 26;
  }

  const totalPresentDays = presentOfficeDays + presentTripDays + presentStandbyDays + presentOtherDutyDays;
  const halfDayPayFactor = policy.halfDayRules?.payFactor ?? 0.5;

  let payableDays = 0;
  if (empAttendance.length === 0) {
    if (policy.allowFullPayForMissingAttendance === true) {
      payableDays = payrollWorkingDays;
    } else {
      payableDays = 0;
    }
  } else if (policy.calculationMethod === 'Calendar Days') {
    // In Calendar Days mode: pay ONLY for days explicitly marked present, paid leave, half days * factor, counted holiday or weekly off
    // Unmarked days are not paid automatically
    const accountedDays = totalPresentDays + halfDays + paidLeaveDays + unpaidLeaveDays + absentDays + weeklyOffDays + publicHolidays;
    unmarkedDaysCount = Math.max(0, calInfo.daysInMonth - accountedDays);
    payableDays = totalPresentDays + (halfDays * halfDayPayFactor) + paidLeaveDays + weeklyOffDays + publicHolidays;
    payableDays = Math.min(calInfo.daysInMonth, payableDays);
  } else {
    // Working days mode
    payableDays = totalPresentDays + (halfDays * halfDayPayFactor) + paidLeaveDays;
    payableDays = Math.min(payrollWorkingDays, payableDays);
  }

  // Driver Trips & Allowances: Match by unique ID only (no name matching)
  const driverTrips = completedTrips.filter((t) => {
    const tDrvId = norm(t.driverId);
    const tAssignedDrv = norm(t.assignedDriverId);
    return (tDrvId && targetCodes.has(tDrvId)) || (tAssignedDrv && targetCodes.has(tAssignedDrv));
  });

  let perTripAllowanceTotal = 0;
  let nightAllowanceTotal = 0;
  let longDistanceAllowanceTotal = 0;
  let overnightAllowanceTotal = 0;
  let extraDutyAllowanceTotal = 0;

  const perTripRate = emp.allowanceConfig?.perTripAllowance ?? policy.driverAllowanceRules?.perTripAllowance ?? 300;
  const nightRate = emp.allowanceConfig?.nightAllowance ?? policy.driverAllowanceRules?.nightAllowance ?? 250;
  const longDistRate = emp.allowanceConfig?.longDistanceAllowance ?? policy.driverAllowanceRules?.longDistanceAllowance ?? 400;
  const overnightRate = emp.allowanceConfig?.overnightAllowance ?? policy.driverAllowanceRules?.overnightAllowance ?? 500;
  const distThreshold = policy.driverAllowanceRules?.longDistanceThresholdKm ?? 250;

  const tripDetails = driverTrips.map((tr) => {
    const dist = Number(tr.actualDistanceKm || tr.distanceTravelled || 0);
    const isNight = isNightShift(
      tr.pickupTime || tr.journeyTime,
      policy.nightShiftStart || '22:00',
      policy.nightShiftEnd || '06:00'
    );
    const isOvernight = (tr.bookingType && tr.bookingType.includes('Tour Package')) || dist > 400;

    let trAllowances = perTripRate;
    perTripAllowanceTotal += perTripRate;

    if (isNight) {
      nightAllowanceTotal += nightRate;
      trAllowances += nightRate;
    }
    if (dist >= distThreshold) {
      longDistanceAllowanceTotal += longDistRate;
      trAllowances += longDistRate;
    }
    if (isOvernight) {
      overnightAllowanceTotal += overnightRate;
      trAllowances += overnightRate;
    }

    return {
      tripId: tr.id || tr.bookingNumber || tr.refId,
      bookingRef: tr.bookingNumber || tr.refId,
      pickupDate: tr.travelDate || tr.pickupDate || tr.journeyDate,
      pickupTime: tr.pickupTime || tr.journeyTime || '',
      distanceKm: dist,
      isNightDuty: isNight,
      isOvernightDuty: isOvernight,
      tripAllowanceAmount: trAllowances
    };
  });

  const totalDriverAllowances =
    perTripAllowanceTotal +
    nightAllowanceTotal +
    longDistanceAllowanceTotal +
    overnightAllowanceTotal +
    extraDutyAllowanceTotal;

  // Normalize salary category
  const rawCat = String(emp.salaryCategory || emp.category || 'Category A');
  let cat = 'Category A';
  if (rawCat.includes('Category B') || rawCat.includes('B –')) cat = 'Category B';
  else if (rawCat.includes('Category C') || rawCat.includes('C –')) cat = 'Category C';
  else if (rawCat.includes('Category D') || rawCat.includes('D –')) cat = 'Category D';
  else if (rawCat.includes('Category E') || rawCat.includes('E –')) cat = 'Category E';

  // Check if employee is a driver - Drivers must strictly be Trip-Based (Category C) without monthly salaries!
  const isDriver = Boolean(
    emp.isDriver ||
    cat === 'Category C' ||
    String(emp.designation || '').toLowerCase().includes('driver') ||
    String(emp.designation || '').toLowerCase().includes('per-trip') ||
    emp.department === 'Fleet Logistics' ||
    emp.driverId
  );
  if (isDriver) {
    cat = 'Category C';
  }

  const str = emp.salaryStructure || {};

  // Validate salary presence - NO FABRICATED DEFAULTS!
  let monthlyGrossSalary = 0;
  if (cat === 'Category C' || isDriver) {
    // Drivers are strictly trip-based without monthly salary
    monthlyGrossSalary = 0;
  } else if (cat === 'Category A' || cat === 'Category B') {
    const explicitGross = Number(emp.monthlySalary || emp.salary || 0);
    const compGross = (Number(str.basicSalary || 0) + Number(str.hra || 0) + Number(str.fixedAllowances || 0) + Number(str.fixedIncentives || 0));
    monthlyGrossSalary = explicitGross || compGross;
    if (monthlyGrossSalary <= 0) {
      return {
        status: 'skipped',
        error: {
          employeeId: empId,
          code: emp.employeeCode || empId,
          message: `Missing salary structure or monthly salary for ${emp.fullName || emp.name || empId} (${cat})`
        }
      };
    }
  } else if (cat === 'Category D') {
    const dailyWageVal = Number(str.dailyWage || emp.dailyWage || 0);
    if (dailyWageVal <= 0) {
      return {
        status: 'skipped',
        error: {
          employeeId: empId,
          code: emp.employeeCode || empId,
          message: `Missing daily wage for Category D daily worker ${emp.fullName || emp.name || empId}`
        }
      };
    }
    monthlyGrossSalary = dailyWageVal * payrollWorkingDays;
  } else if (cat === 'Category E') {
    const contractRate = Number(str.contractTerms?.rate || emp.monthlySalary || emp.salary || 0);
    if (contractRate <= 0) {
      return {
        status: 'skipped',
        error: {
          employeeId: empId,
          code: emp.employeeCode || empId,
          message: `Missing contract rate for Category E contractor ${emp.fullName || emp.name || empId}`
        }
      };
    }
    monthlyGrossSalary = contractRate;
  }

  // Basic and components calculation without fabricated fallbacks
  let basic = Number(str.basicSalary || 0);
  let hra = Number(str.hra || 0);
  let fixedAllow = Number(str.fixedAllowances || 0);
  let fixedIncent = Number(str.fixedIncentives || 0);

  if (monthlyGrossSalary > 0 && basic === 0) {
    basic = Math.round(monthlyGrossSalary * 0.50);
    hra = Math.round(monthlyGrossSalary * 0.25);
    fixedAllow = Math.round(monthlyGrossSalary * 0.15);
    fixedIncent = Math.max(0, monthlyGrossSalary - basic - hra - fixedAllow);
  }

  // Attendance Pay (Direct calculation: Monthly Salary / Working Days * Payable Days)
  let attendancePay = 0;
  const unpaidDays = Math.max(0, payrollWorkingDays - payableDays);
  const unpaidLeaveDeduction = 0; // Days not worked are already prorated out of attendancePay

  if (cat === 'Category A' || cat === 'Category B' || cat === 'Category E') {
    attendancePay = Math.round((monthlyGrossSalary / payrollWorkingDays) * payableDays);
  } else if (cat === 'Category D') {
    const dailyWageVal = Number(str.dailyWage || emp.dailyWage || 0);
    attendancePay = dailyWageVal * payableDays;
  } else if (cat === 'Category C' || isDriver) {
    const perTripRateVal = Number(str.perTripRate || emp.perTripRate || policy.driverAllowanceRules?.perTripAllowance || 600);
    attendancePay = driverTrips.length * perTripRateVal;
  }

  // Driver trip allowances: Category B and Category C receive allowances even when attendance is 0
  let tripAllowances = (cat === 'Category B' || cat === 'Category C') ? totalDriverAllowances : 0;
  let approvedOvertimePay = overtimeHours * (policy.overtimeRules?.fixedHourlyRate || 150);
  let approvedIncentives = 0;
  let otherAllowances = 0;

  // Gross Earnings
  let grossEarnings = 0;
  if (cat === 'Category A') {
    grossEarnings = attendancePay + approvedOvertimePay + approvedIncentives + otherAllowances;
  } else if (cat === 'Category B') {
    // Attendance pay + trip allowances
    grossEarnings = attendancePay + tripAllowances + approvedOvertimePay + approvedIncentives + otherAllowances;
  } else if (cat === 'Category C') {
    grossEarnings = attendancePay + tripAllowances + approvedOvertimePay;
  } else if (cat === 'Category D') {
    grossEarnings = attendancePay + approvedOvertimePay;
  } else if (cat === 'Category E') {
    grossEarnings = attendancePay;
  }

  // Statutory Deductions (Driven by configurable policy fields)
  const statConfig = policy.statutory || {};
  const isContractor = (cat === 'Category E');
  const applyStatutory = !isContractor || (statConfig.applyToContractors === true);

  let pf = 0;
  let esi = 0;
  let pt = 0;
  let tds = Number(str.tdsDeduction ?? 0);

  if (applyStatutory) {
    // Earned basic for part-month
    const earnedBasic = (monthlyGrossSalary > 0 && payrollWorkingDays > 0)
      ? Math.round((basic / payrollWorkingDays) * payableDays)
      : basic;

    // 1. PF: Disabled ERP-wide (PF method removed per business requirements)
    pf = 0;

    // 2. ESI: Applies only when monthly gross wages are within ESI ceiling (default 21,000)
    if (statConfig.esi?.enabled) {
      const esiCeiling = statConfig.esi.wageCeiling || 21000;
      if (monthlyGrossSalary <= esiCeiling) {
        const esiRate = statConfig.esi.employeeRate ?? 0.0075;
        esi = Math.round(grossEarnings * esiRate);
      }
    }

    // 3. Professional Tax: Slabs based on earned gross
    if (statConfig.professionalTax?.enabled) {
      const slabs = statConfig.professionalTax.slabs || [];
      const matchingSlab = slabs.find((s) => {
        const minOk = grossEarnings >= (s.minGross || 0);
        const maxOk = s.maxGross === null || s.maxGross === undefined || grossEarnings <= s.maxGross;
        return minOk && maxOk;
      });
      if (matchingSlab) {
        pt = Number(matchingSlab.taxAmount || 0);
      }
    }
  }

  // Explicit employee overrides take precedence if configured (PF disabled)
  pf = 0;
  if (typeof str.esiDeduction === 'number') esi = str.esiDeduction;
  if (typeof str.professionalTax === 'number') pt = str.professionalTax;

  const totalStatutory = 0;
  const totalDeductions = 0;
  let netPayableSalary = Math.round(grossEarnings);

  // Determine status: A Cancelled payroll stays Cancelled!
  let status = 'Calculated';
  if (existing) {
    if (existing.status === 'Cancelled') {
      status = 'Cancelled';
    } else if (existing.status === 'Approved' || existing.status === 'Paid' || existing.status === 'Partially Paid') {
      status = existing.status;
    }
  }

  const payrollData = {
    tenantId,
    payrollCode,
    month,
    employeeId: empId,
    employeeCode: emp.employeeCode || emp.code || empId,
    employeeName: emp.fullName || emp.name,
    designation: emp.designation || emp.role || 'Staff Member',
    department: emp.department || 'Operations & Dispatch',
    salaryCategory: cat,
    isDriver: Boolean(emp.isDriver || cat === 'Category B' || cat === 'Category C'),
    driverId: emp.driverId || '',
    status,
    policySnapshot: {
      payrollWorkingDays,
      payrollStartDate: '01',
      payrollEndDate: String(calInfo.daysInMonth),
      calculationMethod: policy.calculationMethod
    },
    attendanceSummary: {
      totalScheduledDays: payrollWorkingDays,
      presentOfficeDays,
      presentTripDays,
      presentStandbyDays,
      presentOtherDutyDays,
      totalPresentDays,
      paidLeaveDays,
      unpaidLeaveDays,
      halfDays,
      absentDays,
      weeklyOffDays,
      publicHolidays,
      payableDays,
      overtimeHours,
      unmarkedDaysCount
    },
    driverTripSummary: {
      totalEligibleTrips: driverTrips.length,
      totalTripDistanceKm: driverTrips.reduce((s, t) => s + (Number(t.actualDistanceKm || t.distanceTravelled) || 0), 0),
      perTripAllowanceTotal,
      nightAllowanceTotal,
      longDistanceAllowanceTotal,
      overnightAllowanceTotal,
      extraDutyAllowanceTotal,
      totalAllowances: totalDriverAllowances,
      tripDetails
    },
    earningsBreakdown: {
      basicSalary: basic,
      hra,
      fixedAllowances: fixedAllow,
      fixedIncentives: fixedIncent,
      monthlyGrossSalary,
      attendancePay,
      tripAllowances,
      approvedOvertimePay,
      approvedIncentives,
      otherAllowances,
      grossEarnings,
      isProRata: false,
      proRataDetails: null
    },
    deductionsBreakdown: {
      unpaidLeaveDeduction,
      pfDeduction: pf,
      esiDeduction: esi,
      professionalTax: pt,
      tdsDeduction: tds,
      otherDeductions: 0,
      totalDeductions
    },
    netPayableSalary,
    totalPaidAmount: existing ? (existing.totalPaidAmount || 0) : 0,
    outstandingSalary: existing
      ? Math.max(0, netPayableSalary - (existing.totalPaidAmount || 0))
      : netPayableSalary
  };

  let saved;
  if (existing) {
    saved = await Payroll.findByIdAndUpdate(
      existing._id,
      { $set: payrollData },
      { returnDocument: 'after', runValidators: true }
    );
  } else {
    saved = await Payroll.create(payrollData);
  }

  return { status: 'calculated', payroll: saved };
}

export const payrollController = {
  // 1. Calculate / Regenerate Monthly Payroll
  calculateMonthlyPayroll: async (req, res, next) => {
    try {
      const tenantId = (req.tenantId || 'mak-tours').toLowerCase().trim();
      const tenantQuery = req.tenantQuery || { tenantId };
      const { month = new Date().toISOString().substring(0, 7) } = req.body;

      if (!validateMonth(month)) {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid month format. Expected YYYY-MM (e.g. 2026-11).'
        });
      }

      const policy = await getActivePolicy(tenantId);

      // Fetch all active employees
      const employees = await Employee.find({ ...tenantQuery, status: { $ne: 'Terminated' } }).lean();

      // Fetch active drivers who are NOT already included as employees
      const drivers = await Driver.find({ ...tenantQuery, status: { $in: ['Active', 'Verified'] } }).lean();
      const existingDriverIds = new Set(
        employees.map((e) => e.driverId || e.id || e.employeeCode).filter(Boolean)
      );
      const standaloneDrivers = drivers.filter(
        (d) => !existingDriverIds.has(d.id) && !existingDriverIds.has(d.driverBadgeId)
      );

      // Fetch attendance records strictly for this month (safe string prefix match)
      const attendanceRecords = await Attendance.find({
        ...tenantQuery,
        date: { $gte: `${month}-01`, $lte: `${month}-31` }
      }).lean();

      // Fetch completed trips for this month: strictly by trip travelDate/pickupDate (remove createdAt branch)
      const completedTrips = await Booking.find({
        ...tenantQuery,
        tripStatus: { $in: ['Completed', 'Trip Completed'] },
        $or: [
          { travelDate: { $gte: `${month}-01`, $lte: `${month}-31` } },
          { pickupDate: { $gte: `${month}-01`, $lte: `${month}-31` } },
          { journeyDate: { $gte: `${month}-01`, $lte: `${month}-31` } }
        ]
      }).lean();

      const calculatedPayrolls = [];
      const skippedErrors = [];

      for (const emp of employees) {
        const empWithTenant = { ...emp, tenantId };
        const result = await calculateOrUpsertEmployeePayroll(empWithTenant, month, policy, attendanceRecords, completedTrips);
        if (result.status === 'skipped') {
          skippedErrors.push(result.error);
        } else if (result.payroll) {
          calculatedPayrolls.push(result.payroll);
        }
      }

      for (const drv of standaloneDrivers) {
        // Driver must have explicit salary info configured
        const drvAsEmp = {
          tenantId,
          _id: drv._id,
          id: drv.id || drv.driverBadgeId,
          employeeCode: drv.driverBadgeId || drv.id,
          fullName: drv.fullName || drv.name,
          name: drv.name || drv.fullName,
          designation: 'Fleet Driver',
          department: 'Fleet Logistics',
          isDriver: true,
          driverId: drv.id || drv.driverBadgeId,
          salaryCategory: 'Category C',
          monthlySalary: 0,
          salary: 0,
          perTripRate: drv.perTripRate || drv.tripRate || policy.driverAllowanceRules?.perTripAllowance || 600,
          salaryStructure: {
            perTripRate: drv.perTripRate || drv.tripRate || policy.driverAllowanceRules?.perTripAllowance || 600,
            ...(drv.salaryStructure || {})
          },
          salaryRevisionHistory: drv.salaryRevisionHistory || [],
          status: 'Active'
        };
        const result = await calculateOrUpsertEmployeePayroll(drvAsEmp, month, policy, attendanceRecords, completedTrips);
        if (result.status === 'skipped') {
          skippedErrors.push(result.error);
        } else if (result.payroll) {
          calculatedPayrolls.push(result.payroll);
        }
      }

      return res.status(200).json({
        status: 'success',
        message: `Successfully calculated payroll for ${calculatedPayrolls.length} staff members for ${month}`,
        count: calculatedPayrolls.length,
        month,
        errors: skippedErrors,
        data: calculatedPayrolls
      });
    } catch (err) {
      next(err);
    }
  },

  // 2. Get All Payroll Records for a Month with Filters
  getAll: async (req, res, next) => {
    try {
      const tenantId = (req.tenantId || 'mak-tours').toLowerCase().trim();
      const tenantQuery = req.tenantQuery || { tenantId };
      const { month = new Date().toISOString().substring(0, 7), status, department, category, search } = req.query;

      if (!validateMonth(month)) {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid month format. Expected YYYY-MM.'
        });
      }

      const query = { ...tenantQuery, month };

      if (status && status !== 'All') {
        query.status = status;
      }
      if (department && department !== 'All' && department !== 'All Departments') {
        query.department = department;
      }
      if (category && category !== 'All' && category !== 'All Categories') {
        query.salaryCategory = category;
      }
      if (search && search.trim()) {
        const safeSearch = escapeRegex(search.trim());
        query.$or = [
          { employeeName: { $regex: safeSearch, $options: 'i' } },
          { employeeCode: { $regex: safeSearch, $options: 'i' } },
          { designation: { $regex: safeSearch, $options: 'i' } },
          { payrollCode: { $regex: safeSearch, $options: 'i' } }
        ];
      }

      const list = await Payroll.find(query).sort({ employeeName: 1 }).lean();

      // Compute aggregates
      const totalGross = list.reduce((sum, p) => sum + (p.earningsBreakdown?.grossEarnings || 0), 0);
      const totalNet = list.reduce((sum, p) => sum + (p.netPayableSalary || 0), 0);
      const totalPaid = list.reduce((sum, p) => sum + (p.totalPaidAmount || 0), 0);
      const totalOutstanding = list.reduce((sum, p) => sum + (p.outstandingSalary || 0), 0);
      const approvedCount = list.filter((p) => p.status === 'Approved' || p.status === 'Paid' || p.status === 'Partially Paid').length;

      return res.status(200).json({
        status: 'success',
        month,
        count: list.length,
        metrics: {
          totalGross,
          totalNet,
          totalPaid,
          totalOutstanding,
          approvedCount,
          totalEmployees: list.length
        },
        data: list
      });
    } catch (err) {
      next(err);
    }
  },

  // 3. Get Single Payroll Record
  getById: async (req, res, next) => {
    try {
      const tenantId = (req.tenantId || 'mak-tours').toLowerCase().trim();
      const tenantQuery = req.tenantQuery || { tenantId };
      const { id } = req.params;

      const payroll = await Payroll.findOne({
        ...tenantQuery,
        $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { payrollCode: id }, { employeeId: id }]
      }).lean();

      if (!payroll) {
        return res.status(404).json({ status: 'error', message: 'Payroll record not found' });
      }

      // Fetch driver approved expense reimbursements for information only
      let reimbursements = [];
      if (payroll.isDriver || payroll.driverId) {
        reimbursements = await Expense.find({
          ...tenantQuery,
          driverId: payroll.driverId || payroll.employeeId,
          status: 'Approved'
        }).lean();
      }

      return res.status(200).json({
        status: 'success',
        data: {
          ...payroll,
          netInWords: numberToWords(payroll.netPayableSalary),
          separateReimbursements: reimbursements
        }
      });
    } catch (err) {
      next(err);
    }
  },

  // 4. Approve Payroll: Allowed ONLY from Calculated or Under Review
  approve: async (req, res, next) => {
    try {
      const tenantId = (req.tenantId || 'mak-tours').toLowerCase().trim();
      const tenantQuery = req.tenantQuery || { tenantId };
      const { id } = req.params;
      const { remarks = 'Approved by HR Operations', approverName = 'Operations Admin' } = req.body;

      // First check existing status
      const existing = await Payroll.findOne({
        ...tenantQuery,
        $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { payrollCode: id }]
      });

      if (!existing) {
        return res.status(404).json({ status: 'error', message: 'Payroll record not found' });
      }

      if (existing.status !== 'Calculated' && existing.status !== 'Under Review') {
        return res.status(409).json({
          status: 'error',
          code: 'INVALID_STATUS_TRANSITION',
          message: `Cannot approve payroll in '${existing.status}' status. Only 'Calculated' or 'Under Review' can be approved.`
        });
      }

      existing.status = 'Approved';
      existing.approvalInfo = {
        approvedBy: approverName,
        approvedAt: new Date(),
        remarks
      };

      await existing.save();

      return res.status(200).json({ status: 'success', message: 'Payroll approved successfully', data: existing });
    } catch (err) {
      next(err);
    }
  },

  // 5. Record Salary Payment: Concurrency-safe, overpayment guard, Approved/Partially Paid only
  recordPayment: async (req, res, next) => {
    try {
      const tenantId = (req.tenantId || 'mak-tours').toLowerCase().trim();
      const tenantQuery = req.tenantQuery || { tenantId };
      const { id } = req.params;
      const { amount, paymentDate, paymentMethod = 'Bank Transfer', transactionRef, notes, recordedBy = 'Accounts & HR Admin' } = req.body;

      const payAmt = Number(amount);
      if (!payAmt || payAmt <= 0) {
        return res.status(400).json({ status: 'error', message: 'Valid payment amount greater than zero is required' });
      }

      // Check current record
      const existing = await Payroll.findOne({
        ...tenantQuery,
        $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { payrollCode: id }]
      });

      if (!existing) {
        return res.status(404).json({ status: 'error', message: 'Payroll record not found' });
      }

      // Validation: Already settled check
      if (existing.status === 'Settled' || existing.status === 'Paid') {
        return res.status(409).json({
          status: 'error',
          code: 'PAYMENT_ALREADY_SETTLED',
          message: 'This salary has already been settled.'
        });
      }

      // Overpayment guard
      const currentOutstanding = existing.outstandingSalary !== undefined
        ? existing.outstandingSalary
        : Math.max(0, existing.netPayableSalary - (existing.totalPaidAmount || 0));

      // Collision-safe sequence for payment reference
      const paymentRef = await sequenceService.getNextSalaryPaymentRef(tenantId);
      const effectiveTxnRef = transactionRef || paymentRef;

      // Concurrency-safe atomic update
      const updatedPayroll = await Payroll.findOneAndUpdate(
        {
          _id: existing._id,
          tenantId
        },
        {
          $set: {
            status: 'Settled',
            totalPaidAmount: payAmt,
            outstandingSalary: 0
          },
          $push: {
            paymentHistory: {
              paymentRef,
              amount: payAmt,
              paymentDate: paymentDate || new Date().toISOString().substring(0, 10),
              paymentMethod: paymentMethod || 'Bank Transfer',
              transactionRef: effectiveTxnRef,
              recordedBy
            }
          }
        },
        { returnDocument: 'after' }
      );

      if (!updatedPayroll) {
        return res.status(409).json({
          status: 'error',
          code: 'CONCURRENT_PAYMENT_CONFLICT',
          message: 'Payment rejected due to concurrent modification.'
        });
      }

      // Mark settled
      updatedPayroll.status = 'Settled';
      updatedPayroll.outstandingSalary = 0;
      await updatedPayroll.save();

      // Create SalaryPayment audit entry
      const salaryPayment = await SalaryPayment.create({
        tenantId,
        paymentRef,
        payrollId: updatedPayroll._id,
        payrollCode: updatedPayroll.payrollCode,
        employeeId: updatedPayroll.employeeId,
        employeeName: updatedPayroll.employeeName,
        month: updatedPayroll.month,
        amount: payAmt,
        paymentDate: paymentDate || new Date().toISOString().substring(0, 10),
        paymentMethod,
        transactionRef: effectiveTxnRef,
        notes: notes || 'Salary disbursement',
        recordedBy
      });

      // Post to Double-Entry General Ledger (Debit: 2040 Salary Payable, Credit: 1020 Bank)
      try {
        await postingService.postSalaryPayment({
          tenantId,
          paymentCode: paymentRef,
          amount: payAmt,
          date: paymentDate || new Date().toISOString().substring(0, 10),
          employeeId: updatedPayroll.employeeId,
          employeeName: updatedPayroll.employeeName,
          month: updatedPayroll.month,
          user: req.user
        });
      } catch (postErr) {
        console.warn('[PayrollController] Ledger posting note on recordPayment:', postErr.message);
      }

      return res.status(201).json({
        status: 'success',
        message: `Disbursement of ₹${payAmt} recorded successfully. Outstanding: ₹${updatedPayroll.outstandingSalary}`,
        data: { payroll: updatedPayroll, payment: salaryPayment }
      });
    } catch (err) {
      next(err);
    }
  },

  // 6. Get Salary Slip Data: Dynamic Company branding per tenant
  getSalarySlip: async (req, res, next) => {
    try {
      const tenantId = (req.tenantId || 'mak-tours').toLowerCase().trim();
      const tenantQuery = req.tenantQuery || { tenantId };
      const { id } = req.params;

      const payroll = await Payroll.findOne({
        ...tenantQuery,
        $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { payrollCode: id }]
      }).lean();

      if (!payroll) {
        return res.status(404).json({ status: 'error', message: 'Payroll record not found' });
      }

      // Look up tenant's Company record for dynamic branding
      const company = await Company.findOne({ tenantId }).lean();
      if (!company) {
        return res.status(404).json({
          status: 'error',
          code: 'COMPANY_BRANDING_MISSING',
          message: `Company profile for tenant '${tenantId}' is not configured. Please configure company profile before generating salary slips.`
        });
      }

      const emp = await Employee.findOne({
        ...tenantQuery,
        $or: [{ id: payroll.employeeId }, { employeeCode: payroll.employeeId }]
      }).lean();

      const salarySlip = {
        company: {
          name: company.name || company.legalName || 'Travels ERP',
          address: company.address || `${company.city || ''}, ${company.state || ''}`.trim(),
          gstin: company.gstin || '',
          pan: company.pan || '',
          email: company.email || '',
          phone: company.phone || ''
        },
        slipNumber: `SLIP-${payroll.payrollCode}`,
        month: payroll.month,
        generatedAt: new Date().toISOString(),
        employee: {
          id: payroll.employeeId,
          code: payroll.employeeCode,
          name: payroll.employeeName,
          designation: payroll.designation,
          department: payroll.department,
          joiningDate: emp?.joiningDate || '',
          bankName: emp?.bankDetails?.bankName || '',
          accountNo: emp?.bankDetails?.accountNumber || '',
          ifsc: emp?.bankDetails?.ifscCode || '',
          panNumber: emp?.panNumber || '',
          pfNumber: emp?.pfNumber || '',
          salaryCategory: payroll.salaryCategory
        },
        attendance: payroll.attendanceSummary,
        earnings: payroll.earningsBreakdown,
        deductions: payroll.deductionsBreakdown,
        netPayableSalary: payroll.netPayableSalary,
        totalPaidAmount: payroll.totalPaidAmount,
        outstandingSalary: payroll.outstandingSalary,
        netInWords: numberToWords(payroll.netPayableSalary),
        status: payroll.status,
        paymentHistory: payroll.paymentHistory,
        approvalInfo: payroll.approvalInfo
      };

      return res.status(200).json({ status: 'success', data: salarySlip });
    } catch (err) {
      next(err);
    }
  },

  // 7. Get Active Policy
  getPolicy: async (req, res, next) => {
    try {
      const tenantId = (req.tenantId || 'mak-tours').toLowerCase().trim();
      const policy = await getActivePolicy(tenantId);
      return res.status(200).json({ status: 'success', data: policy });
    } catch (err) {
      next(err);
    }
  },

  // 8. Update Active Policy
  updatePolicy: async (req, res, next) => {
    try {
      const tenantId = (req.tenantId || 'mak-tours').toLowerCase().trim();
      const updateData = stripProtectedFields(req.body);

      const policy = await PayrollPolicy.findOneAndUpdate(
        { tenantId, isDefault: true },
        { $set: updateData },
        { upsert: true, returnDocument: 'after' }
      );

      return res.status(200).json({ status: 'success', message: 'Payroll policy updated successfully', data: policy });
    } catch (err) {
      next(err);
    }
  },

  // 9. Update Employee / Driver Salary
  updateSalary: async (req, res, next) => {
    try {
      const tenantId = (req.tenantId || 'mak-tours').toLowerCase().trim();
      const tenantQuery = req.tenantQuery || { tenantId };
      const employeeId = req.params.employeeId || req.params.id;
      const cleanData = stripProtectedFields(req.body);

      let target = await Employee.findOne({
        ...tenantQuery,
        $or: [{ id: employeeId }, { employeeCode: employeeId }, { _id: (employeeId && employeeId.match(/^[0-9a-fA-F]{24}$/)) ? employeeId : null }]
      });

      if (!target) {
        target = await Driver.findOne({
          ...tenantQuery,
          $or: [{ id: employeeId }, { driverBadgeId: employeeId }, { _id: (employeeId && employeeId.match(/^[0-9a-fA-F]{24}$/)) ? employeeId : null }]
        });
      }

      if (!target) {
        return res.status(404).json({ status: 'error', message: 'Employee or Driver not found in your company' });
      }

      if (cleanData.monthlySalary !== undefined) target.monthlySalary = Number(cleanData.monthlySalary);
      if (cleanData.salary !== undefined) target.salary = Number(cleanData.salary);
      if (cleanData.salaryBasis) target.salaryBasis = cleanData.salaryBasis;
      if (cleanData.salaryCategory) target.salaryCategory = cleanData.salaryCategory;
      if (cleanData.salaryStructure) target.salaryStructure = { ...target.salaryStructure, ...cleanData.salaryStructure };

      if (cleanData.effectiveDate && cleanData.newSalary) {
        target.salaryRevisionHistory = target.salaryRevisionHistory || [];
        target.salaryRevisionHistory.push({
          revisionId: `REV-${Date.now()}`,
          effectiveDate: cleanData.effectiveDate,
          previousSalary: cleanData.previousSalary || target.monthlySalary,
          newSalary: cleanData.newSalary,
          remarks: cleanData.remarks || 'Salary updated by Admin'
        });
      }

      await target.save();

      return res.status(200).json({
        status: 'success',
        message: 'Salary revised successfully',
        data: target
      });
    } catch (err) {
      next(err);
    }
  },

  // Alias for backward and route compatibility
  updateEmployeeSalary: async (req, res, next) => {
    return payrollController.updateSalary(req, res, next);
  },

  // 10. Get Salary Revision History
  getSalaryHistory: async (req, res, next) => {
    try {
      const tenantId = (req.tenantId || 'mak-tours').toLowerCase().trim();
      const tenantQuery = req.tenantQuery || { tenantId };
      const employeeId = req.params.employeeId || req.params.id;

      const emp = await Employee.findOne({
        ...tenantQuery,
        $or: [{ id: employeeId }, { employeeCode: employeeId }, { _id: (employeeId && employeeId.match(/^[0-9a-fA-F]{24}$/)) ? employeeId : null }]
      }).lean();

      if (!emp) {
        return res.status(404).json({ status: 'error', message: 'Employee not found' });
      }

      return res.status(200).json({
        status: 'success',
        data: emp.salaryRevisionHistory || []
      });
    } catch (err) {
      next(err);
    }
  },

  // 11. Accountant View: Monthly Payroll Accounting Summary
  getAccountingSummary: async (req, res, next) => {
    try {
      const tenantId = (req.tenantId || 'mak-tours').toLowerCase().trim();
      const tenantQuery = req.tenantQuery || { tenantId };
      const { month } = req.query;

      const query = { ...tenantQuery };
      if (month) query.month = month;

      const payrolls = await Payroll.find(query).lean();

      let totalGrossSalary = 0;
      let totalBasicSalary = 0;
      let totalHra = 0;
      let totalSpecialAllowance = 0;
      let totalTripAllowances = 0;
      let totalPfDeduction = 0;
      let totalEsiDeduction = 0;
      let totalTdsDeduction = 0;
      let totalOtherDeductions = 0;
      let totalNetPayableSalary = 0;
      let totalDisbursed = 0;
      let totalOutstanding = 0;

      for (const p of payrolls) {
        const gross = p.grossSalary || p.earningsBreakdown?.grossEarnings || p.earningsBreakdown?.monthlyGrossSalary || 0;
        const basic = p.basicSalary || p.earningsBreakdown?.basicSalary || 0;
        const hra = p.hra || p.earningsBreakdown?.hra || 0;
        const spAllow = p.specialAllowance || p.earningsBreakdown?.fixedAllowances || 0;
        const tripAllow = p.totalDriverAllowances || p.earningsBreakdown?.tripAllowances || p.driverTripSummary?.totalAllowances || 0;
        const pf = p.pfDeduction || p.deductionsBreakdown?.pfDeduction || 0;
        const esi = p.esiDeduction || p.deductionsBreakdown?.esiDeduction || 0;
        const tds = p.tdsDeduction || p.deductionsBreakdown?.tdsDeduction || 0;
        const otherDed = p.otherDeductions || p.deductionsBreakdown?.otherDeductions || 0;

        totalGrossSalary += Number(gross);
        totalBasicSalary += Number(basic);
        totalHra += Number(hra);
        totalSpecialAllowance += Number(spAllow);
        totalTripAllowances += Number(tripAllow);
        totalPfDeduction += Number(pf);
        totalEsiDeduction += Number(esi);
        totalTdsDeduction += Number(tds);
        totalOtherDeductions += Number(otherDed);
        totalNetPayableSalary += Number(p.netPayableSalary || 0);
        totalDisbursed += Number(p.totalPaidAmount || 0);
        totalOutstanding += Number(p.outstandingSalary !== undefined ? p.outstandingSalary : Math.max(0, (p.netPayableSalary || 0) - (p.totalPaidAmount || 0)));
      }

      return res.status(200).json({
        status: 'success',
        month: month || 'All',
        data: {
          totalCount: payrolls.length,
          totalGrossSalary: Math.round(totalGrossSalary * 100) / 100,
          totalBasicSalary: Math.round(totalBasicSalary * 100) / 100,
          totalHra: Math.round(totalHra * 100) / 100,
          totalSpecialAllowance: Math.round(totalSpecialAllowance * 100) / 100,
          totalTripAllowances: Math.round(totalTripAllowances * 100) / 100,
          statutoryDeductions: {
            pf: Math.round(totalPfDeduction * 100) / 100,
            esi: Math.round(totalEsiDeduction * 100) / 100,
            tds: Math.round(totalTdsDeduction * 100) / 100,
            other: Math.round(totalOtherDeductions * 100) / 100,
            totalDeductions: Math.round((totalPfDeduction + totalEsiDeduction + totalTdsDeduction + totalOtherDeductions) * 100) / 100
          },
          totalNetPayableSalary: Math.round(totalNetPayableSalary * 100) / 100,
          totalDisbursed: Math.round(totalDisbursed * 100) / 100,
          totalOutstanding: Math.round(totalOutstanding * 100) / 100
        }
      });
    } catch (err) {
      next(err);
    }
  },

  // 12. Accountant View: Salary Disbursements List
  getAccountingDisbursements: async (req, res, next) => {
    try {
      const tenantId = (req.tenantId || 'mak-tours').toLowerCase().trim();
      const tenantQuery = req.tenantQuery || { tenantId };
      const { month, employeeId } = req.query;

      const query = { ...tenantQuery };
      if (month) query.month = month;
      if (employeeId) query.employeeId = employeeId;

      const disbursements = await SalaryPayment.find(query).sort({ paymentDate: -1, createdAt: -1 }).lean();
      return res.status(200).json({ status: 'success', count: disbursements.length, data: disbursements });
    } catch (err) {
      next(err);
    }
  },

  // Alias for backward and route compatibility
  getEmployeeSalaryHistory: async (req, res, next) => {
    return payrollController.getSalaryHistory(req, res, next);
  }
};

export default payrollController;
