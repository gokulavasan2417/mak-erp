import { calculateOrUpsertEmployeePayroll } from 'file:///c:/project/MAK%20ERP/backend/src/controllers/payrollController.js';
import { Payroll } from 'file:///c:/project/MAK%20ERP/backend/src/models/Payroll.js';

Payroll.findOne = () => Promise.resolve(null);
Payroll.create = (doc) => Promise.resolve({ ...doc, _id: 'PAY_MOCK_1' });
Payroll.findByIdAndUpdate = (id, op) => Promise.resolve({ ...(op['$set'] || {}), _id: id });

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

async function testDriverPayroll() {
  console.log('--- Testing Category B: Driver with Monthly Salary + Trips ---');
  const driverB = {
    _id: '777777777777777777777777',
    employeeCode: 'EMP-004',
    id: 'EMP-004',
    fullName: 'Murugan S',
    name: 'Murugan S',
    designation: 'Permanent Senior Driver',
    department: 'Fleet Logistics',
    salaryCategory: 'Category B – Monthly + Trip Allowances',
    isDriver: true,
    driverId: 'DRV-001',
    monthlySalary: 22000,
    salaryStructure: {
      basicSalary: 12000,
      hra: 4000,
      fixedAllowances: 3000,
      fixedIncentives: 3000,
      pfDeduction: 1800,
      esiDeduction: 350,
      professionalTax: 200,
      tdsDeduction: 0
    },
    status: 'Active',
    toObject() { return { ...this }; }
  };

  const att = [{ employeeId: 'EMP-004', date: '2026-11-02', status: 'Present – Trip' }];
  // 3 completed trips
  const trips = [
    { driverId: 'DRV-001', actualDistanceKm: 120, pickupTime: '10:00 AM' }, // 300
    { driverId: 'DRV-001', actualDistanceKm: 300, pickupTime: '09:00 PM' }, // 300 + 250 + 400 = 950
    { driverId: 'DRV-001', actualDistanceKm: 150, pickupTime: '11:00 AM' }  // 300
  ]; // Total trip allowances = 1550

  const resB = await calculateOrUpsertEmployeePayroll(driverB, '2026-11', standardPolicy, att, trips);
  const pB = resB.payroll;
  console.log('Driver B Monthly Gross Base: ₹' + pB.earningsBreakdown.monthlyGrossSalary);
  console.log('Driver B Attendance Pay (1 day): ₹' + pB.earningsBreakdown.attendancePay);
  console.log('Driver B Trip Allowances (3 trips): ₹' + pB.earningsBreakdown.tripAllowances);
  console.log('Driver B Gross Earnings: ₹' + pB.earningsBreakdown.grossEarnings);
  console.log('Driver B Net Payable: ₹' + pB.netPayableSalary);

  console.log('\n--- Testing Category C: Per-Trip Driver ---');
  const driverC = {
    _id: '999999999999999999999999',
    employeeCode: 'EMP-007',
    id: 'EMP-007',
    fullName: 'Anandh R',
    name: 'Anandh R',
    designation: 'Per-Trip Specialist',
    department: 'Fleet Logistics',
    salaryCategory: 'Category C – Trip-Based Driver',
    isDriver: true,
    driverId: 'DRV-004',
    monthlySalary: 0,
    salaryStructure: {
      perTripRate: 1500,
      pfDeduction: 0,
      esiDeduction: 0,
      professionalTax: 0,
      tdsDeduction: 0
    },
    status: 'Active',
    toObject() { return { ...this }; }
  };

  const driverCTrips = [
    { driverId: 'DRV-004', actualDistanceKm: 100, pickupTime: '10:00 AM' },
    { driverId: 'DRV-004', actualDistanceKm: 280, pickupTime: '10:00 PM' }
  ];

  const resC = await calculateOrUpsertEmployeePayroll(driverC, '2026-11', standardPolicy, [], driverCTrips);
  const pC = resC.payroll;
  console.log('Driver C Trips Count:', pC.driverTripSummary.totalEligibleTrips);
  console.log('Driver C Trip Allowances: ₹' + pC.earningsBreakdown.tripAllowances);
  console.log('Driver C Gross Earnings: ₹' + pC.earningsBreakdown.grossEarnings);
  console.log('Driver C Net Payable: ₹' + pC.netPayableSalary);
  console.log('Category C Test: ' + (pC.netPayableSalary > 0 ? 'PASS ✓' : 'FAIL ✗'));
}

testDriverPayroll().catch(console.error);
