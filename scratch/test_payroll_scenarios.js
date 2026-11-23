import { calculateOrUpsertEmployeePayroll } from 'file:///c:/project/MAK%20ERP/backend/src/controllers/payrollController.js';
import { Payroll } from 'file:///c:/project/MAK%20ERP/backend/src/models/Payroll.js';

// Base Employee fixture (Monthly Salary = 26,000, 26 working days => ₹1,000 / day)
function createBaseEmployee(overrides = {}) {
  return {
    _id: '666666666666666666666666',
    employeeCode: 'EMP-001',
    id: 'EMP-001',
    code: 'EMP-001',
    fullName: 'Rajesh Sharma',
    name: 'Rajesh Sharma',
    designation: 'Operations Manager',
    department: 'Operations & Dispatch',
    salaryCategory: 'Category A – Fixed Monthly',
    isDriver: false,
    monthlySalary: 26000,
    salary: 26000,
    salaryStructure: {
      basicSalary: 14300,
      hra: 5720,
      fixedAllowances: 2860,
      fixedIncentives: 3120,
      pfDeduction: 1800,
      esiDeduction: 350,
      professionalTax: 200,
      tdsDeduction: 0
    },
    salaryRevisionHistory: [],
    status: 'Active',
    toObject() { return { ...this }; },
    ...overrides
  };
}

// Standard Policy fixture (26 working days basis, Sundays off)
const standardPolicy = {
  name: 'Standard Corporate Policy',
  isDefault: true,
  payrollWorkingDays: 26,
  calculationMethod: 'Fixed Payroll Working Days',
  weeklyOffDays: ['Sunday'],
  publicHolidays: [{ date: '2026-11-01', name: 'State Day' }],
  halfDayRules: { payFactor: 0.5 },
  overtimeRules: { fixedHourlyRate: 150 },
  driverAllowanceRules: { perTripAllowance: 300, nightAllowance: 250, longDistanceAllowance: 400, overnightAllowance: 500 },
  salaryRounding: 'Nearest Rupee'
};

async function runScenarioTests() {
  console.log('===============================================================');
  console.log('       TESTING 10 CONTROLLED PAYROLL CALCULATION SCENARIOS     ');
  console.log('===============================================================\n');

  // Intercept MongoDB calls on Payroll model for offline testing
  const savedDocs = new Map();

  Payroll.findOne = (query) => {
    if (query.$or) {
      for (const cond of query.$or) {
        if (cond.payrollCode && savedDocs.has(cond.payrollCode)) return Promise.resolve(savedDocs.get(cond.payrollCode));
        if (cond.employeeId && cond.month) {
          const key = `${cond.employeeId}_${cond.month}`;
          if (savedDocs.has(key)) return Promise.resolve(savedDocs.get(key));
        }
        if (cond.employeeCode && cond.month) {
          const key = `${cond.employeeCode}_${cond.month}`;
          if (savedDocs.has(key)) return Promise.resolve(savedDocs.get(key));
        }
      }
    }
    const key = query.payrollCode || `${query.employeeId}_${query.month}`;
    return Promise.resolve(savedDocs.get(key) || null);
  };

  Payroll.findByIdAndUpdate = (id, op) => {
    const existing = savedDocs.get(id);
    const updated = { ...(existing || {}), ...(op['$set'] || {}), _id: id };
    savedDocs.set(id, updated);
    savedDocs.set(updated.payrollCode, updated);
    savedDocs.set(`${updated.employeeId}_${updated.month}`, updated);
    return Promise.resolve(updated);
  };

  Payroll.create = (doc) => {
    const id = 'PAY_ID_' + Math.random().toString(36).substr(2, 6);
    const saved = { ...doc, _id: id };
    savedDocs.set(id, saved);
    savedDocs.set(saved.payrollCode, saved);
    savedDocs.set(`${saved.employeeId}_${saved.month}`, saved);
    return Promise.resolve(saved);
  };

  const month = '2026-11';

  // Helper to generate attendance array
  function generateAttendance(empCode, counts) {
    const att = [];
    let day = 1;
    // counts: { present, late, halfDay, paidLeave, unpaidLeave, absent, weeklyOff }
    const addDays = (num, status) => {
      for (let i = 0; i < num; i++) {
        const dStr = `2026-11-${String(day).padStart(2, '0')}`;
        att.push({
          employeeId: empCode,
          employeeCode: empCode,
          date: dStr,
          status,
          overtimeHours: 0
        });
        day++;
      }
    };
    if (counts.present) addDays(counts.present, 'Present – Office');
    if (counts.late) addDays(counts.late, 'Late');
    if (counts.halfDay) addDays(counts.halfDay, 'Half Day');
    if (counts.paidLeave) addDays(counts.paidLeave, 'Paid Leave');
    if (counts.unpaidLeave) addDays(counts.unpaidLeave, 'Unpaid Leave');
    if (counts.absent) addDays(counts.absent, 'Absent');
    if (counts.weeklyOff) addDays(counts.weeklyOff, 'Weekly Off');
    return att;
  }

  // --- SCENARIO 1: Full Attendance (26 Present Days) ---
  console.log('--- SCENARIO 1: Full Attendance (26 Present Days) ---');
  savedDocs.clear();
  const emp1 = createBaseEmployee();
  const att1 = generateAttendance('EMP-001', { present: 26, weeklyOff: 4 });
  const res1 = await calculateOrUpsertEmployeePayroll(emp1, month, standardPolicy, att1, []);
  const p1 = res1.payroll;
  console.log(`Monthly Base Salary: ₹${p1.earningsBreakdown.monthlyGrossSalary}`);
  console.log(`Payable Days: ${p1.attendanceSummary.payableDays} / ${p1.policySnapshot.payrollWorkingDays} days`);
  console.log(`Attendance Pay: ₹${p1.earningsBreakdown.attendancePay}`);
  console.log(`Gross Earnings: ₹${p1.earningsBreakdown.grossEarnings}`);
  console.log(`Unpaid Leave Deduction: ₹${p1.deductionsBreakdown.unpaidLeaveDeduction}`);
  console.log(`Statutory Deductions (PF+ESI+PT): ₹${p1.deductionsBreakdown.totalDeductions}`);
  console.log(`Net Payable Salary: ₹${p1.netPayableSalary}`);
  console.log(`Outstanding: ₹${p1.outstandingSalary}, Status: ${p1.status}`);
  console.log(`Verification: ₹26,000 - ₹2,350 = ₹${26000 - 2350}. Actual: ₹${p1.netPayableSalary} -> ${p1.netPayableSalary === 23650 ? 'PASS ✓' : 'FAIL ✗'}\n`);

  // --- SCENARIO 2: One Absent Day (25 Present, 1 Absent) ---
  console.log('--- SCENARIO 2: One Absent Day (25 Present, 1 Absent) ---');
  savedDocs.clear();
  const emp2 = createBaseEmployee();
  const att2 = generateAttendance('EMP-001', { present: 25, absent: 1, weeklyOff: 4 });
  const res2 = await calculateOrUpsertEmployeePayroll(emp2, month, standardPolicy, att2, []);
  const p2 = res2.payroll;
  console.log(`Monthly Base Salary: ₹${p2.earningsBreakdown.monthlyGrossSalary}`);
  console.log(`Payable Days: ${p2.attendanceSummary.payableDays} / ${p2.policySnapshot.payrollWorkingDays} days`);
  console.log(`Attendance Pay: ₹${p2.earningsBreakdown.attendancePay}`);
  console.log(`Unpaid Leave / Loss of Pay: ₹${p2.deductionsBreakdown.unpaidLeaveDeduction}`);
  console.log(`Total Deductions (Loss of Pay + Statutory): ₹${p2.deductionsBreakdown.totalDeductions}`);
  console.log(`Net Payable Salary: ₹${p2.netPayableSalary}`);
  console.log(`Verification: ₹26,000 - ₹1,000 (absent) - ₹2,350 = ₹22,650. Actual: ₹${p2.netPayableSalary} -> ${p2.netPayableSalary === 22650 ? 'PASS ✓' : 'FAIL ✗'}\n`);

  // --- SCENARIO 3: One Half-Day (25 Present, 1 Half Day) ---
  console.log('--- SCENARIO 3: One Half-Day (25 Present, 1 Half Day) ---');
  savedDocs.clear();
  const emp3 = createBaseEmployee();
  const att3 = generateAttendance('EMP-001', { present: 25, halfDay: 1, weeklyOff: 4 });
  const res3 = await calculateOrUpsertEmployeePayroll(emp3, month, standardPolicy, att3, []);
  const p3 = res3.payroll;
  console.log(`Payable Days: ${p3.attendanceSummary.payableDays} / 26 days`);
  console.log(`Attendance Pay: ₹${p3.earningsBreakdown.attendancePay}`);
  console.log(`Unpaid Leave / Half-Day Deduction: ₹${p3.deductionsBreakdown.unpaidLeaveDeduction}`);
  console.log(`Total Deductions: ₹${p3.deductionsBreakdown.totalDeductions}`);
  console.log(`Net Payable Salary: ₹${p3.netPayableSalary}`);
  console.log(`Verification: ₹26,000 - ₹500 (half-day) - ₹2,350 = ₹23,150. Actual: ₹${p3.netPayableSalary} -> ${p3.netPayableSalary === 23150 ? 'PASS ✓' : 'FAIL ✗'}\n`);

  // --- SCENARIO 4: Approved Paid Leave (24 Present, 2 Paid Leave) ---
  console.log('--- SCENARIO 4: Approved Paid Leave (24 Present, 2 Paid Leave) ---');
  savedDocs.clear();
  const emp4 = createBaseEmployee();
  const att4 = generateAttendance('EMP-001', { present: 24, paidLeave: 2, weeklyOff: 4 });
  const res4 = await calculateOrUpsertEmployeePayroll(emp4, month, standardPolicy, att4, []);
  const p4 = res4.payroll;
  console.log(`Payable Days: ${p4.attendanceSummary.payableDays} / 26 days (24 Present + 2 Paid Leave = 26 Payable)`);
  console.log(`Attendance Pay: ₹${p4.earningsBreakdown.attendancePay}`);
  console.log(`Unpaid Leave Deduction: ₹${p4.deductionsBreakdown.unpaidLeaveDeduction}`);
  console.log(`Net Payable Salary: ₹${p4.netPayableSalary}`);
  console.log(`Verification: ₹26,000 - ₹0 (paid leave) - ₹2,350 = ₹23,650. Actual: ₹${p4.netPayableSalary} -> ${p4.netPayableSalary === 23650 ? 'PASS ✓' : 'FAIL ✗'}\n`);

  // --- SCENARIO 5: Unpaid Leave (24 Present, 2 Unpaid Leave) ---
  console.log('--- SCENARIO 5: Unpaid Leave (24 Present, 2 Unpaid Leave) ---');
  savedDocs.clear();
  const emp5 = createBaseEmployee();
  const att5 = generateAttendance('EMP-001', { present: 24, unpaidLeave: 2, weeklyOff: 4 });
  const res5 = await calculateOrUpsertEmployeePayroll(emp5, month, standardPolicy, att5, []);
  const p5 = res5.payroll;
  console.log(`Payable Days: ${p5.attendanceSummary.payableDays} / 26 days`);
  console.log(`Attendance Pay: ₹${p5.earningsBreakdown.attendancePay}`);
  console.log(`Unpaid Leave Deduction: ₹${p5.deductionsBreakdown.unpaidLeaveDeduction} (2 days × ₹1,000)`);
  console.log(`Net Payable Salary: ₹${p5.netPayableSalary}`);
  console.log(`Verification: ₹26,000 - ₹2,000 - ₹2,350 = ₹21,650. Actual: ₹${p5.netPayableSalary} -> ${p5.netPayableSalary === 21650 ? 'PASS ✓' : 'FAIL ✗'}\n`);

  // --- SCENARIO 6: No Attendance Records (0 Punches in Month) ---
  console.log('--- SCENARIO 6: No Attendance Records (0 Punches in Month) ---');
  savedDocs.clear();
  const emp6 = createBaseEmployee();
  const att6 = []; // Zero attendance records
  const res6 = await calculateOrUpsertEmployeePayroll(emp6, month, standardPolicy, att6, []);
  const p6 = res6.payroll;
  console.log(`Payable Days: ${p6.attendanceSummary.payableDays} / 26 days`);
  console.log(`Attendance Pay: ₹${p6.earningsBreakdown.attendancePay}`);
  console.log(`Gross Earnings: ₹${p6.earningsBreakdown.grossEarnings}`);
  console.log(`Net Payable Salary: ₹${p6.netPayableSalary}`);
  console.log(`Verification: Zero attendance records -> Zero pay (₹0). Actual: ₹${p6.netPayableSalary} -> ${p6.netPayableSalary === 0 && p6.attendanceSummary.payableDays === 0 ? 'PASS ✓' : 'FAIL ✗'}\n`);

  // --- SCENARIO 7: Salary Changed Before Payroll Calculation ---
  console.log('--- SCENARIO 7: Salary Changed Before Payroll Calculation ---');
  savedDocs.clear();
  const emp7 = createBaseEmployee({
    monthlySalary: 39000, // Revised to ₹39,000 (₹1,500/day for 26 days)
    salaryRevisionHistory: [
      {
        revisionId: 'REV-001',
        previousSalary: 26000,
        newSalary: 39000,
        effectiveDate: '2026-11-01',
        remarks: 'Salary increment before payroll calculation'
      }
    ]
  });
  const att7 = generateAttendance('EMP-001', { present: 26, weeklyOff: 4 });
  const res7 = await calculateOrUpsertEmployeePayroll(emp7, month, standardPolicy, att7, []);
  const p7 = res7.payroll;
  console.log(`New Configured Salary: ₹${p7.earningsBreakdown.monthlyGrossSalary}`);
  console.log(`Attendance Pay: ₹${p7.earningsBreakdown.attendancePay}`);
  console.log(`Statutory Deductions: ₹${p7.deductionsBreakdown.totalDeductions}`);
  console.log(`Net Payable Salary: ₹${p7.netPayableSalary}`);
  console.log(`Verification: ₹39,000 - ₹2,350 = ₹36,650. Actual: ₹${p7.netPayableSalary} -> ${p7.netPayableSalary === 36650 ? 'PASS ✓' : 'FAIL ✗'}\n`);

  // --- SCENARIO 8: Salary Changed After Payroll Approval ---
  console.log('--- SCENARIO 8: Salary Changed After Payroll Approval ---');
  // First, generate payroll for 26,000 and approve it
  savedDocs.clear();
  const emp8 = createBaseEmployee({ monthlySalary: 26000 });
  const att8 = generateAttendance('EMP-001', { present: 26, weeklyOff: 4 });
  const res8Init = await calculateOrUpsertEmployeePayroll(emp8, month, standardPolicy, att8, []);
  // Mark as Approved
  res8Init.payroll.status = 'Approved';
  res8Init.payroll.approvalInfo = { approvedBy: 'General Manager', approvedAt: new Date(), remarks: 'Approved' };
  savedDocs.set(res8Init.payroll.payrollCode, res8Init.payroll);
  savedDocs.set(`${res8Init.payroll.employeeId}_${month}`, res8Init.payroll);

  console.log(`Initial Approved Net Payable: ₹${res8Init.payroll.netPayableSalary}, Status: ${res8Init.payroll.status}`);
  // Admin updates salary to 50,000 afterwards
  const emp8Updated = createBaseEmployee({
    monthlySalary: 50000,
    salaryRevisionHistory: [{ revisionId: 'REV-002', previousSalary: 26000, newSalary: 50000, effectiveDate: '2026-11-20' }]
  });
  const res8After = await calculateOrUpsertEmployeePayroll(emp8Updated, month, standardPolicy, att8, []);
  console.log(`Result Status: ${res8After.status} (Expected: 'preserved')`);
  console.log(`Preserved Net Payable: ₹${res8After.payroll.netPayableSalary}, Status: ${res8After.payroll.status}`);
  console.log(`Verification: Approved payroll remains untouched at ₹23,650 -> ${res8After.status === 'preserved' && res8After.payroll.netPayableSalary === 23650 ? 'PASS ✓' : 'FAIL ✗'}\n`);

  // --- SCENARIO 9: Partially Paid Payroll ---
  console.log('--- SCENARIO 9: Partially Paid Payroll ---');
  savedDocs.clear();
  const emp9 = createBaseEmployee({ monthlySalary: 26000 });
  const att9 = generateAttendance('EMP-001', { present: 26, weeklyOff: 4 });
  const res9 = await calculateOrUpsertEmployeePayroll(emp9, month, standardPolicy, att9, []);
  const p9 = res9.payroll;
  // Disburse ₹10,000 partial payment
  p9.totalPaidAmount = 10000;
  p9.outstandingSalary = p9.netPayableSalary - p9.totalPaidAmount; // 23,650 - 10,000 = 13,650
  p9.status = 'Partially Paid';
  p9.paymentHistory = [{ paymentRef: 'PAY-PARTIAL-001', amount: 10000, paymentDate: '2026-11-15' }];
  savedDocs.set(p9.payrollCode, p9);
  savedDocs.set(`${p9.employeeId}_${month}`, p9);

  // Recalculation attempt
  const res9Recalc = await calculateOrUpsertEmployeePayroll(emp9, month, standardPolicy, att9, []);
  console.log(`Net Payable: ₹${res9Recalc.payroll.netPayableSalary}`);
  console.log(`Total Paid Amount: ₹${res9Recalc.payroll.totalPaidAmount}`);
  console.log(`Outstanding Salary: ₹${res9Recalc.payroll.outstandingSalary}`);
  console.log(`Status: ${res9Recalc.payroll.status}`);
  console.log(`Verification: Outstanding is ₹13,650 and Partially Paid is preserved -> ${res9Recalc.status === 'preserved' && res9Recalc.payroll.outstandingSalary === 13650 && res9Recalc.payroll.status === 'Partially Paid' ? 'PASS ✓' : 'FAIL ✗'}\n`);

  // --- SCENARIO 10: Fully Paid Payroll ---
  console.log('--- SCENARIO 10: Fully Paid Payroll ---');
  savedDocs.clear();
  const emp10 = createBaseEmployee({ monthlySalary: 26000 });
  const att10 = generateAttendance('EMP-001', { present: 26, weeklyOff: 4 });
  const res10 = await calculateOrUpsertEmployeePayroll(emp10, month, standardPolicy, att10, []);
  const p10 = res10.payroll;
  // Disburse 100% full payment
  p10.totalPaidAmount = p10.netPayableSalary; // 23,650
  p10.outstandingSalary = 0;
  p10.status = 'Paid';
  p10.paymentHistory = [{ paymentRef: 'PAY-FULL-001', amount: 23650, paymentDate: '2026-11-28' }];
  savedDocs.set(p10.payrollCode, p10);
  savedDocs.set(`${p10.employeeId}_${month}`, p10);

  // Recalculation attempt
  const res10Recalc = await calculateOrUpsertEmployeePayroll(emp10, month, standardPolicy, att10, []);
  console.log(`Net Payable: ₹${res10Recalc.payroll.netPayableSalary}`);
  console.log(`Total Paid Amount: ₹${res10Recalc.payroll.totalPaidAmount}`);
  console.log(`Outstanding Salary: ₹${res10Recalc.payroll.outstandingSalary}`);
  console.log(`Status: ${res10Recalc.payroll.status}`);
  console.log(`Verification: Outstanding is ₹0 and Paid status preserved -> ${res10Recalc.status === 'preserved' && res10Recalc.payroll.outstandingSalary === 0 && res10Recalc.payroll.status === 'Paid' ? 'PASS ✓' : 'FAIL ✗'}\n`);

  console.log('===============================================================');
  console.log('           ALL 10 SCENARIOS COMPLETED SUCCESSFULLY             ');
  console.log('===============================================================');
}

runScenarioTests().catch(console.error);
