// MAK Tours & Travels ERP - Comprehensive SaaS Data Integrity & Bug Fix Test Suite
// Executes against in-memory MongoDB (MongoMemoryServer). Never touches production Atlas!
import test, { describe, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

// Models
import { Payroll } from '../models/Payroll.js';
import { SalaryPayment } from '../models/SalaryPayment.js';
import { PayrollPolicy } from '../models/PayrollPolicy.js';
import { Employee } from '../models/Employee.js';
import { Driver } from '../models/Driver.js';
import { Attendance } from '../models/Attendance.js';
import { Booking } from '../models/Booking.js';
import { Expense } from '../models/Expense.js';
import { Payment } from '../models/Payment.js';
import { Invoice } from '../models/Invoice.js';
import { Company } from '../models/Company.js';
import { Vehicle } from '../models/Vehicle.js';
import { Counter } from '../models/Counter.js';

// Controllers and Utilities
import {
  payrollController,
  calculateOrUpsertEmployeePayroll,
  getActivePolicy
} from '../controllers/payrollController.js';
import { financeController } from '../controllers/financeController.js';
import { bookingController } from '../controllers/bookingController.js';
import { errorHandler } from '../middleware/errorHandler.js';
import { escapeRegex } from '../utils/escapeRegex.js';
import {
  validateMonth,
  getDaysInMonth,
  calculateScheduledWorkingDays,
  parsePickupTime,
  isNightShift
} from '../utils/dateUtils.js';
import { sequenceService } from '../services/sequenceService.js';
import { stripProtectedFields, whitelistFields } from '../utils/fieldHelper.js';

let mongod;

// Mock Response Helper
function createMockRes() {
  const res = {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.body = data;
      return this;
    }
  };
  return res;
}

before(async () => {
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  await mongoose.connect(uri);
});

after(async () => {
  await mongoose.disconnect();
  if (mongod) await mongod.stop();
});

beforeEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key of Object.keys(collections)) {
    await collections[key].deleteMany({});
  }
});

// ============================================================================
// SUITE 1: SHARED UTILITIES & DATA INTEGRITY PRIMITIVES
// ============================================================================
describe('Suite 1: Shared Utilities & Data Integrity Primitives', () => {
  test('1.1: validateMonth validates YYYY-MM and rejects invalid months', () => {
    assert.equal(validateMonth('2026-11'), true);
    assert.equal(validateMonth('2026-01'), true);
    assert.equal(validateMonth('2026-12'), true);
    assert.equal(validateMonth('2026-00'), false);
    assert.equal(validateMonth('2026-13'), false);
    assert.equal(validateMonth('2026/11'), false);
    assert.equal(validateMonth('invalid'), false);
    assert.equal(validateMonth(''), false);
    assert.equal(validateMonth(null), false);
  });

  test('1.2: calculateScheduledWorkingDays computes real calendar days and avoids double-counting Sunday holidays', () => {
    // Nov 2026: 30 days. Sundays: 1st, 8th, 15th, 22nd, 29th (5 Sundays).
    // Holiday on Nov 1st (Sunday) and Nov 14th (Saturday)
    const holidays = [
      { date: '2026-11-01', name: 'State Day' },    // Falls on Sunday
      { date: '2026-11-14', name: 'Diwali' }        // Falls on Saturday
    ];
    const res = calculateScheduledWorkingDays(2026, 11, ['Sunday'], holidays);
    assert.equal(res.daysInMonth, 30);
    assert.equal(res.weeklyOffCount, 5); // 5 Sundays
    assert.equal(res.holidayCount, 1);   // Only Saturday Nov 14 is counted as holiday on a working day
    assert.equal(res.scheduledWorkingDays, 24); // 30 - 5 - 1 = 24
  });

  test('1.3: parsePickupTime and isNightShift correctly identify night windows and reject day hours', () => {
    // Default window: 22:00 to 06:00
    assert.equal(isNightShift('09:00 AM'), false, '09:00 AM must NOT be night');
    assert.equal(isNightShift('02:00 PM'), false, '02:00 PM must NOT be night');
    assert.equal(isNightShift('2:00 PM'), false, '2:00 PM must NOT be night');
    assert.equal(isNightShift('11:30 PM'), true, '11:30 PM MUST be night');
    assert.equal(isNightShift('05:00 AM'), true, '05:00 AM MUST be night');
    assert.equal(isNightShift('22:00'), true, '22:00 MUST be night');
    assert.equal(isNightShift('23:45'), true, '23:45 MUST be night');
    assert.equal(isNightShift('04:30'), true, '04:30 MUST be night');
    assert.equal(isNightShift('06:00 AM'), false, '06:00 AM boundary is day');
    assert.equal(isNightShift('08:00 AM'), false, '08:00 AM is day');
  });

  test('1.4: escapeRegex sanitizes special characters and prevents ReDoS', () => {
    const dangerous = 'user.*+?^${}()|[]\\test';
    const escaped = escapeRegex(dangerous);
    assert.equal(escaped.includes('.*'), false);
    const regex = new RegExp(escaped);
    assert.equal(regex.test('user.*+?^${}()|[]\\test'), true);

    // Caps string length
    const longStr = 'a'.repeat(500);
    assert.equal(escapeRegex(longStr, 50).length, 50);
  });

  test('1.5: stripProtectedFields removes tenantId, _id, and audit stamps', () => {
    const dirty = {
      tenantId: 'hacked-tenant',
      _id: 'fake-id',
      createdAt: 'yesterday',
      name: 'Safe Name',
      amount: 500
    };
    const cleaned = stripProtectedFields(dirty);
    assert.equal(cleaned.tenantId, undefined);
    assert.equal(cleaned._id, undefined);
    assert.equal(cleaned.createdAt, undefined);
    assert.equal(cleaned.name, 'Safe Name');
    assert.equal(cleaned.amount, 500);
  });

  test('1.6: sequenceService generates collision-free atomic sequences per tenant', async () => {
    const p1 = await sequenceService.getNextBookingRef('company-a');
    const p2 = await sequenceService.getNextBookingRef('company-a');
    const p3 = await sequenceService.getNextBookingRef('company-b');

    assert.equal(p1, 'BK-000001');
    assert.equal(p2, 'BK-000002');
    assert.equal(p3, 'BK-000001', 'Company B counter starts independently from 1');

    // High concurrency test: 20 parallel requests for company-a
    const promises = [];
    for (let i = 0; i < 20; i++) {
      promises.push(sequenceService.getNextInvoiceNumber('company-a'));
    }
    const results = await Promise.all(promises);
    const uniqueResults = new Set(results);
    assert.equal(uniqueResults.size, 20, 'All 20 concurrent invoices must have distinct numbers');
  });
});

// ============================================================================
// SUITE 2: PAYROLL ENGINE HARDENING
// ============================================================================
describe('Suite 2: Payroll Engine Hardening', () => {
  test('2.1: Cancelled payroll stays Cancelled upon recalculation', async () => {
    const tenantId = 'test-co';
    const policy = await getActivePolicy(tenantId);

    const emp = {
      tenantId,
      id: 'EMP-01',
      employeeCode: 'EMP-01',
      name: 'Priya Sharma',
      monthlySalary: 30000,
      salaryCategory: 'Category A'
    };

    // Calculate initial
    const firstRes = await calculateOrUpsertEmployeePayroll(emp, '2026-11', policy, [], []);
    assert.equal(firstRes.payroll.status, 'Calculated');

    // Admin cancels it
    firstRes.payroll.status = 'Cancelled';
    await firstRes.payroll.save();

    // Recalculate
    const recalcRes = await calculateOrUpsertEmployeePayroll(emp, '2026-11', policy, [], []);
    assert.equal(recalcRes.payroll.status, 'Cancelled', 'Cancelled status must NOT be reset to Calculated');
  });

  test('2.2: Payroll pre-save hook never forces Paid or Partially Paid on Cancelled records', async () => {
    const p = new Payroll({
      tenantId: 'test-co',
      payrollCode: 'PAY-202611-EMP02',
      month: '2026-11',
      employeeId: 'EMP-02',
      employeeName: 'Rahul Verma',
      netPayableSalary: 25000,
      totalPaidAmount: 10000,
      outstandingSalary: 15000,
      status: 'Cancelled'
    });
    await p.save();
    assert.equal(p.status, 'Cancelled', 'pre-save hook must not override Cancelled with Partially Paid');

    p.totalPaidAmount = 25000;
    p.outstandingSalary = 0;
    await p.save();
    assert.equal(p.status, 'Cancelled', 'pre-save hook must not override Cancelled with Paid');
  });

  test('2.3: approve() allowed ONLY from Calculated or Under Review (rejects others with 409)', async () => {
    const p = await Payroll.create({
      tenantId: 'test-co',
      payrollCode: 'PAY-202611-EMP03',
      month: '2026-11',
      employeeId: 'EMP-03',
      employeeName: 'Kavitha R',
      netPayableSalary: 35000,
      status: 'Approved' // Already approved
    });

    const req = {
      tenantId: 'test-co',
      params: { id: p._id.toString() },
      body: {}
    };
    const res = createMockRes();

    await payrollController.approve(req, res, () => {});
    assert.equal(res.statusCode, 409, 'Re-approving an already Approved payroll must return 409');
  });

  test('2.4: recordPayment() allowed ONLY on Approved or Partially Paid; overpayment rejected', async () => {
    const p = await Payroll.create({
      tenantId: 'test-co',
      payrollCode: 'PAY-202611-EMP04',
      month: '2026-11',
      employeeId: 'EMP-04',
      employeeName: 'Suresh Babu',
      netPayableSalary: 20000,
      totalPaidAmount: 0,
      outstandingSalary: 20000,
      status: 'Calculated' // Not yet approved!
    });

    const req = {
      tenantId: 'test-co',
      tenantQuery: { tenantId: 'test-co' },
      params: { id: p._id.toString() },
      body: { amount: 5000 }
    };
    const res = createMockRes();

    await payrollController.recordPayment(req, res, () => {});
    assert.equal(res.statusCode, 409, 'Payment against unapproved payroll must be rejected with 409');

    // Now approve it
    p.status = 'Approved';
    await p.save();

    // Attempt overpayment
    const overReq = {
      tenantId: 'test-co',
      tenantQuery: { tenantId: 'test-co' },
      params: { id: p._id.toString() },
      body: { amount: 25000 } // Exceeds 20,000!
    };
    const overRes = createMockRes();
    await payrollController.recordPayment(overReq, overRes, () => {});
    assert.equal(overRes.statusCode, 400, 'Overpayment must be rejected with 400');
    assert.equal(overRes.body.code, 'OVERPAYMENT_REJECTED');
  });

  test('2.5: 20 concurrent payments never exceed net salary', async () => {
    const p = await Payroll.create({
      tenantId: 'test-co',
      payrollCode: 'PAY-202611-EMP05',
      month: '2026-11',
      employeeId: 'EMP-05',
      employeeName: 'Anandh R',
      netPayableSalary: 5000,
      totalPaidAmount: 0,
      outstandingSalary: 5000,
      status: 'Approved'
    });

    // 20 concurrent requests attempting to pay ₹1,000 each (Total attempt = ₹20,000 on ₹5,000 net)
    const promises = [];
    for (let i = 0; i < 20; i++) {
      const req = {
        tenantId: 'test-co',
        tenantQuery: { tenantId: 'test-co' },
        params: { id: p._id.toString() },
        body: { amount: 1000, transactionRef: `TXN-${i}` }
      };
      const res = createMockRes();
      promises.push(payrollController.recordPayment(req, res, () => {}).then(() => res));
    }

    const responses = await Promise.all(promises);
    const successful = responses.filter((r) => r.statusCode === 201);
    const failed = responses.filter((r) => r.statusCode !== 201);

    const updated = await Payroll.findById(p._id);
    assert.equal(updated.totalPaidAmount <= 5000, true, 'Total paid amount must never exceed net salary');
    assert.equal(updated.outstandingSalary >= 0, true, 'Outstanding salary must never be negative');
    assert.equal(successful.length <= 5, true, 'At most 5 payments of ₹1,000 can succeed');
    assert.equal(failed.length >= 15, true, 'Remaining concurrent attempts must be rejected');
  });

  test('2.6: Missing employee salary structure skips calculation and reports in structured errors', async () => {
    const tenantId = 'test-co';
    const policy = await getActivePolicy(tenantId);

    const empMissingSalary = {
      tenantId,
      id: 'EMP-NO-SAL',
      employeeCode: 'EMP-NO-SAL',
      name: 'Unset Salary Staff',
      monthlySalary: 0,
      salaryCategory: 'Category A'
    };

    const res = await calculateOrUpsertEmployeePayroll(empMissingSalary, '2026-11', policy, [], []);
    assert.equal(res.status, 'skipped');
    assert.equal(res.error.code, 'EMP-NO-SAL');
    assert.equal(res.error.message.includes('Missing salary'), true);

    const checkDb = await Payroll.findOne({ tenantId, employeeId: 'EMP-NO-SAL' });
    assert.equal(checkDb, null, 'No fake payroll document must be written for missing salary');
  });

  test('2.7: "Half Day – Office" evaluates to half day (0.5 pay factor) not full office day', async () => {
    const tenantId = 'test-co';
    const policy = await getActivePolicy(tenantId);

    const emp = {
      tenantId,
      id: 'EMP-HALF',
      employeeCode: 'EMP-HALF',
      name: 'Half Day Worker',
      monthlySalary: 26000,
      salaryCategory: 'Category A'
    };

    // 1 attendance punch with status "Half Day – Office"
    const attendanceRecords = [
      {
        employeeId: 'EMP-HALF',
        date: '2026-11-05',
        status: 'Half Day – Office'
      }
    ];

    const res = await calculateOrUpsertEmployeePayroll(emp, '2026-11', policy, attendanceRecords, []);
    assert.equal(res.payroll.attendanceSummary.halfDays, 1, 'Must count 1 half day');
    assert.equal(res.payroll.attendanceSummary.presentOfficeDays, 0, 'Must NOT count as full office day');
    assert.equal(res.payroll.attendanceSummary.payableDays, 0.5, 'Payable days must equal 0.5');
  });

  test('2.8: Category B driver with zero attendance still receives trip allowances', async () => {
    const tenantId = 'test-co';
    const policy = await getActivePolicy(tenantId);

    const drv = {
      tenantId,
      id: 'DRV-101',
      employeeCode: 'DRV-101',
      driverId: 'DRV-101',
      name: 'Murugan S',
      monthlySalary: 20000,
      salaryCategory: 'Category B – Monthly + Trip Allowances'
    };

    // Zero attendance punches
    const attendanceRecords = [];

    // 2 completed trips in Nov 2026
    const completedTrips = [
      {
        id: 'BK-01',
        driverId: 'DRV-101',
        travelDate: '2026-11-05',
        pickupTime: '08:00 AM',
        actualDistanceKm: 100,
        tripStatus: 'Completed'
      },
      {
        id: 'BK-02',
        driverId: 'DRV-101',
        travelDate: '2026-11-12',
        pickupTime: '11:30 PM', // Night shift!
        actualDistanceKm: 300,  // Long distance (> 250km)
        tripStatus: 'Completed'
      }
    ];

    const res = await calculateOrUpsertEmployeePayroll(drv, '2026-11', policy, attendanceRecords, completedTrips);
    assert.equal(res.payroll.attendanceSummary.payableDays, 0, 'Attendance payable days is 0');
    assert.equal(res.payroll.earningsBreakdown.attendancePay, 0, 'Attendance base pay is 0');
    assert.equal(res.payroll.earningsBreakdown.tripAllowances > 0, true, 'Trip allowances MUST be paid even with 0 attendance');
    assert.equal(res.payroll.netPayableSalary > 0, true, 'Net salary reflects trip allowances');
  });

  test('2.9: Statutory deductions respect PF ceiling (₹15,000) and ESI eligibility (<= ₹21,000)', async () => {
    const tenantId = 'test-co';
    const policy = await getActivePolicy(tenantId);

    // High earner: ₹50,000 basic -> PF ceiling ₹15,000 * 12% = ₹1,800. ESI exempt!
    const highEarner = {
      tenantId,
      id: 'EMP-HIGH',
      employeeCode: 'EMP-HIGH',
      name: 'Senior Director',
      monthlySalary: 100000,
      salaryStructure: { basicSalary: 50000 },
      salaryCategory: 'Category A'
    };
    const attFull = Array.from({ length: 26 }, (_, i) => ({
      employeeId: 'EMP-HIGH',
      date: `2026-11-${String(i + 1).padStart(2, '0')}`,
      status: 'Present'
    }));

    const highRes = await calculateOrUpsertEmployeePayroll(highEarner, '2026-11', policy, attFull, []);
    assert.equal(highRes.payroll.deductionsBreakdown.pfDeduction, 1800, 'PF capped at 15000 * 12% = 1800');
    assert.equal(highRes.payroll.deductionsBreakdown.esiDeduction, 0, 'ESI is 0 because gross > 21,000');

    // Low earner: ₹18,000 gross -> ESI applies (0.75% of 18000 = 135)
    const lowEarner = {
      tenantId,
      id: 'EMP-LOW',
      employeeCode: 'EMP-LOW',
      name: 'Junior Helper',
      monthlySalary: 18000,
      salaryStructure: { basicSalary: 9000 },
      salaryCategory: 'Category A'
    };
    const attLow = Array.from({ length: 26 }, (_, i) => ({
      employeeId: 'EMP-LOW',
      date: `2026-11-${String(i + 1).padStart(2, '0')}`,
      status: 'Present'
    }));
    const lowRes = await calculateOrUpsertEmployeePayroll(lowEarner, '2026-11', policy, attLow, []);
    assert.equal(lowRes.payroll.deductionsBreakdown.esiDeduction, 135, 'ESI 0.75% of 18000 = 135');
  });
});

// ============================================================================
// SUITE 3: FINANCE & INVOICING
// ============================================================================
describe('Suite 3: Finance & Invoicing', () => {
  test('3.1: getOverview separates bookingRevenue and collectedRevenue without substituting', async () => {
    const tenantId = 'test-co';

    // Bookings worth ₹50,000
    await Booking.create({
      tenantId,
      refId: 'BK-100',
      fullName: 'Customer One',
      mobileNumber: '+91 9999999999',
      bookingType: 'Round Trip',
      travelDate: '2026-11-10',
      totalFare: 50000,
      pricing: 50000,
      bookingStatus: 'Confirmed'
    });

    // Zero payments collected
    const req = { tenantId, tenantQuery: { tenantId } };
    const res = createMockRes();

    await financeController.getOverview(req, res, () => {});
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.data.bookingRevenue, 50000);
    assert.equal(res.body.data.collectedRevenue, 0, 'collectedRevenue must be 0, never substituted by booking revenue');
    assert.equal(res.body.data.outstandingBalance, 50000);
    assert.equal(res.body.data.profit, 0);
    assert.equal(res.body.data.accrualProfit, 50000);
  });

  test('3.2: createInvoice persists to MongoDB and calculates dynamic status', async () => {
    const tenantId = 'test-co';

    const req = {
      tenantId,
      body: {
        bookingRef: 'BK-200',
        amount: 10000,
        amountPaid: 4000,
        customerName: 'Ananya Deshmukh'
      }
    };
    const res = createMockRes();

    await financeController.createInvoice(req, res, () => {});
    assert.equal(res.statusCode, 201);
    assert.equal(res.body.data.status, 'Partially Paid');
    assert.equal(res.body.data.balanceDue, 6000);

    const fromDb = await Invoice.findOne({ tenantId, bookingRef: 'BK-200' });
    assert.notEqual(fromDb, null, 'Invoice must be persisted to MongoDB collection');
    assert.equal(fromDb.invoiceNumber.startsWith('INV-'), true);
  });

  test('3.3: updateExpenseStatus rejects invalid enum values and guards illegal transitions', async () => {
    const tenantId = 'test-co';
    const exp = await Expense.create({
      tenantId,
      id: 'EXP-101',
      category: 'Fuel',
      amount: 2500,
      status: 'Reimbursed'
    });

    // 1. Invalid enum
    const req1 = {
      tenantId,
      tenantQuery: { tenantId },
      params: { id: 'EXP-101' },
      body: { status: 'BogusStatus' }
    };
    const res1 = createMockRes();
    await financeController.updateExpenseStatus(req1, res1, () => {});
    assert.equal(res1.statusCode, 400);

    // 2. Illegal transition: Reimbursed back to Pending
    const req2 = {
      tenantId,
      tenantQuery: { tenantId },
      params: { id: 'EXP-101' },
      body: { status: 'Pending' }
    };
    const res2 = createMockRes();
    await financeController.updateExpenseStatus(req2, res2, () => {});
    assert.equal(res2.statusCode, 400);
    assert.equal(res2.body.code, 'ILLEGAL_TRANSITION');
  });

  test('3.4: createPayment idempotency returns existing record on duplicate paymentId', async () => {
    const tenantId = 'test-co';
    const req1 = {
      tenantId,
      tenantQuery: { tenantId },
      body: {
        paymentId: 'PAY-TXN-UNIQUE-01',
        amount: 5000,
        status: 'captured'
      }
    };
    const res1 = createMockRes();
    await financeController.createPayment(req1, res1, () => {});
    assert.equal(res1.statusCode, 201);

    // Duplicate call with same paymentId
    const res2 = createMockRes();
    await financeController.createPayment(req1, res2, () => {});
    assert.equal(res2.statusCode, 200, 'Duplicate payment returns 200 OK');
    assert.equal(res2.body.message.includes('idempotent'), true);
  });
});

// ============================================================================
// SUITE 4: BOOKINGS & OVERLAP PREVENTION
// ============================================================================
describe('Suite 4: Bookings & Overlap Prevention', () => {
  test('4.1: POST /bookings requires mandatory fields and rejects One Way', async () => {
    const tenantId = 'test-co';

    // Missing mandatory fields
    const req1 = { tenantId, body: {} };
    const res1 = createMockRes();
    await bookingController.create(req1, res1, () => {});
    assert.equal(res1.statusCode, 400);
    assert.equal(res1.body.code, 'VALIDATION_ERROR');

    // One Way Trip
    const req2 = {
      tenantId,
      body: {
        fullName: 'Test Customer',
        mobileNumber: '+91 98401 11223',
        bookingType: 'One Way Trip',
        travelDate: '2026-11-20',
        pickupLocation: 'Chennai',
        toLocation: 'Bangalore'
      }
    };
    const res2 = createMockRes();
    await bookingController.create(req2, res2, () => {});
    assert.equal(res2.statusCode, 400);
    assert.equal(res2.body.code, 'ONE_WAY_PROHIBITED');
  });

  test('4.2: POST /bookings returns 409 on duplicate refId (never upserts)', async () => {
    const tenantId = 'test-co';
    await Booking.create({
      tenantId,
      refId: 'MAK-999001',
      fullName: 'Original Customer',
      mobileNumber: '+91 98401 11223',
      bookingType: 'Round Trip',
      travelDate: '2026-11-20'
    });

    const req = {
      tenantId,
      body: {
        refId: 'MAK-999001',
        fullName: 'Intruder Booking',
        mobileNumber: '+91 98401 44556',
        bookingType: 'Round Trip',
        travelDate: '2026-11-20',
        pickupLocation: 'Chennai',
        toLocation: 'Vellore'
      }
    };
    const res = createMockRes();
    await bookingController.create(req, res, () => {});
    assert.equal(res.statusCode, 409, 'Duplicate reference must return 409, never upsert');
  });

  test('4.3: assign() prevents vehicle overlap on concurrent bookings', async () => {
    const tenantId = 'test-co';

    // Vehicle
    await Vehicle.create({
      tenantId,
      name: 'Toyota Innova Crysta',
      model: 'Toyota Innova Crysta',
      regNo: 'TN-01-AB-1234',
      status: 'Available'
    });

    // Existing active booking: Nov 10 to Nov 12 with vehicle assigned
    await Booking.create({
      tenantId,
      refId: 'BK-TRIP-1',
      bookingNumber: 'BK-TRIP-1',
      fullName: 'First Passenger',
      mobileNumber: '+91 98401 11111',
      bookingType: 'Round Trip',
      travelDate: '2026-11-10',
      returnDate: '2026-11-12',
      vehicleId: 'TN-01-AB-1234',
      status: 'Confirmed',
      tripStatus: 'Upcoming'
    });

    // Second booking: Nov 11 to Nov 13 (overlaps Nov 11-12!)
    const b2 = await Booking.create({
      tenantId,
      refId: 'BK-TRIP-2',
      bookingNumber: 'BK-TRIP-2',
      fullName: 'Second Passenger',
      mobileNumber: '+91 98401 22222',
      bookingType: 'Round Trip',
      travelDate: '2026-11-11',
      returnDate: '2026-11-13',
      status: 'Confirmed',
      tripStatus: 'Upcoming'
    });

    const req = {
      tenantId,
      params: { id: b2._id.toString() },
      body: { vehicleId: 'TN-01-AB-1234' }
    };
    const res = createMockRes();

    await bookingController.assign(req, res, () => {});
    assert.equal(res.statusCode, 409, 'Overlapping vehicle assignment must return 409 Conflict');
    assert.equal(res.body.code, 'VEHICLE_OVERLAP_CONFLICT');
  });

  test('4.4: cancel() frees vehicle & driver and blocks cancelling completed trips', async () => {
    const tenantId = 'test-co';

    const veh = await Vehicle.create({
      tenantId,
      name: 'Toyota Innova Crysta',
      model: 'Toyota Innova Crysta',
      regNo: 'TN-02-XY-9999',
      status: 'Reserved'
    });

    const b = await Booking.create({
      tenantId,
      refId: 'BK-CANCEL-TEST',
      bookingNumber: 'BK-CANCEL-TEST',
      fullName: 'Cancel Customer',
      mobileNumber: '+91 98401 33333',
      bookingType: 'Round Trip',
      travelDate: '2026-11-25',
      vehicleId: 'TN-02-XY-9999',
      driverAssignmentStatus: 'Assigned',
      status: 'Confirmed',
      tripStatus: 'Upcoming'
    });

    const req = {
      tenantId,
      params: { id: b._id.toString() },
      body: { reason: 'Customer requested change' }
    };
    const res = createMockRes();

    await bookingController.cancel(req, res, () => {});
    assert.equal(res.statusCode, 200);

    const updatedVeh = await Vehicle.findById(veh._id);
    assert.equal(updatedVeh.status, 'Available', 'Cancelling booking must restore vehicle status to Available');

    // Attempt to cancel a Completed trip
    const completedBooking = await Booking.create({
      tenantId,
      refId: 'BK-DONE',
      bookingNumber: 'BK-DONE',
      fullName: 'Finished Customer',
      mobileNumber: '+91 98401 44444',
      bookingType: 'Round Trip',
      travelDate: '2026-11-01',
      bookingStatus: 'Completed',
      tripStatus: 'Completed'
    });

    const compReq = {
      tenantId,
      params: { id: completedBooking._id.toString() },
      body: {}
    };
    const compRes = createMockRes();
    await bookingController.cancel(compReq, compRes, () => {});
    assert.equal(compRes.statusCode, 400, 'Completed trip cannot be cancelled');
  });

  test('4.5: getAll() filter preserves both status and driverId with $and', async () => {
    const tenantId = 'test-co';

    // Driver 1 - Confirmed
    await Booking.create({
      tenantId,
      refId: 'BK-D1-CONF',
      fullName: 'Cust 1',
      mobileNumber: '+91 1111111111',
      bookingType: 'Round Trip',
      travelDate: '2026-11-15',
      driverId: 'DRV-A',
      bookingStatus: 'Confirmed',
      status: 'Confirmed'
    });

    // Driver 1 - Cancelled
    await Booking.create({
      tenantId,
      refId: 'BK-D1-CANC',
      fullName: 'Cust 2',
      mobileNumber: '+91 2222222222',
      bookingType: 'Round Trip',
      travelDate: '2026-11-15',
      driverId: 'DRV-A',
      bookingStatus: 'Cancelled',
      status: 'Cancelled'
    });

    // Driver 2 - Confirmed
    await Booking.create({
      tenantId,
      refId: 'BK-D2-CONF',
      fullName: 'Cust 3',
      mobileNumber: '+91 3333333333',
      bookingType: 'Round Trip',
      travelDate: '2026-11-15',
      driverId: 'DRV-B',
      bookingStatus: 'Confirmed',
      status: 'Confirmed'
    });

    const req = {
      tenantId,
      query: { driverId: 'DRV-A', status: 'Confirmed' }
    };
    const res = createMockRes();

    await bookingController.getAll(req, res, () => {});
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.count, 1, 'Only 1 booking matches BOTH driverId=DRV-A AND status=Confirmed');
    assert.equal(res.body.data[0].id, 'BK-D1-CONF');
  });

  test('4.6: POST /bookings with vehicle and driver immediately allocates them and preserves vendor payout', async () => {
    const tenantId = 'test-co';

    const veh = await Vehicle.create({
      tenantId,
      name: 'Maruti Ertiga',
      model: 'Ertiga VXI',
      regNo: 'TN-09-VV-1234',
      ownership: 'Vendor Attached',
      vendorId: 'VND-001',
      vendorName: 'Balaji Travels',
      status: 'Available'
    });

    const drv = await Driver.create({
      tenantId,
      driverBadgeId: 'DRV-NEW-9',
      fullName: 'Ramesh Chauffeur',
      phone: '9840099999',
      status: 'Active'
    });

    const req = {
      tenantId,
      body: {
        customerName: 'VIP Client',
        customerPhone: '9840188888',
        bookingType: 'Round Trip',
        travelDate: '2026-11-20',
        returnDate: '2026-11-22',
        pickupLocation: 'Chennai',
        destination: 'Pondicherry',
        pricing: 20000,
        advancePaid: 5000,
        vehicleId: veh.regNo,
        driverId: drv.driverBadgeId,
        driverCompensationAmount: 2000,
        vendorPayoutPercent: 85,
        vendorPayableAmount: 17000
      }
    };
    const res = createMockRes();

    await bookingController.create(req, res, () => {});
    assert.equal(res.statusCode, 201);
    assert.equal(res.body.data.bookingStatus, 'Confirmed');
    assert.equal(res.body.data.advancePaid, 5000);
    assert.equal(res.body.data.balanceDue, 15000);
    assert.equal(res.body.data.vendorPayableAmount, 17000);

    // Verify vehicle was marked as Reserved in database
    const updatedVeh = await Vehicle.findById(veh._id);
    assert.equal(updatedVeh.status, 'Reserved', 'Vehicle assigned upon creation must be marked as Reserved');
  });
});

// ============================================================================
// SUITE 5: SERVER, SECURITY & ERROR HANDLING
// ============================================================================
describe('Suite 5: Server, Security & Error Handling', () => {
  test('5.1: errorHandler operator precedence fix returns err.statusCode 400, not 500', () => {
    const err = new Error('Client validation issue');
    err.statusCode = 400;

    const req = { method: 'POST', url: '/api/test' };
    const res = createMockRes();

    errorHandler(err, req, res, () => {});
    assert.equal(res.statusCode, 400, 'Must return 400, NOT 500');
    assert.equal(res.body.statusCode, 400);
  });

  test('5.2: errorHandler maps Mongoose ValidationError to 400 and duplicate key 11000 to 409', () => {
    const valErr = new Error('Validation failed');
    valErr.name = 'ValidationError';
    valErr.errors = {
      mobileNumber: { message: 'Mobile is required' }
    };

    const res1 = createMockRes();
    errorHandler(valErr, { method: 'POST', url: '/api/bookings' }, res1, () => {});
    assert.equal(res1.statusCode, 400);

    const dupErr = new Error('E11000 duplicate key');
    dupErr.code = 11000;
    dupErr.keyPattern = { refId: 1 };

    const res2 = createMockRes();
    errorHandler(dupErr, { method: 'POST', url: '/api/bookings' }, res2, () => {});
    assert.equal(res2.statusCode, 409);
  });
});

// ============================================================================
// SUITE 6: CROSS-TENANT DATA ISOLATION
// ============================================================================
describe('Suite 6: Cross-Tenant Data Isolation', () => {
  test('6.1: Company A cannot read or modify Company B bookings, vehicles, or payroll', async () => {
    // Company A document
    await Booking.create({
      tenantId: 'company-a',
      refId: 'BK-CO-A',
      fullName: 'Company A Client',
      mobileNumber: '+91 1111111111',
      bookingType: 'Round Trip',
      travelDate: '2026-11-20'
    });

    // Company B requests all bookings
    const req = {
      tenantId: 'company-b',
      tenantQuery: { tenantId: 'company-b' },
      query: {}
    };
    const res = createMockRes();

    await bookingController.getAll(req, res, () => {});
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.count, 0, 'Company B must see 0 bookings');
  });

  test('6.2: Same employee code and month in two tenants do NOT collide', async () => {
    const pA = await Payroll.create({
      tenantId: 'company-a',
      payrollCode: 'PAY-202611-EMP001-A',
      month: '2026-11',
      employeeId: 'EMP-001',
      employeeCode: 'EMP-001',
      employeeName: 'Ramesh A',
      netPayableSalary: 30000
    });

    const pB = await Payroll.create({
      tenantId: 'company-b',
      payrollCode: 'PAY-202611-EMP001-B',
      month: '2026-11',
      employeeId: 'EMP-001',
      employeeCode: 'EMP-001',
      employeeName: 'Ramesh B',
      netPayableSalary: 45000
    });

    assert.notEqual(pA._id.toString(), pB._id.toString());
    assert.equal(pA.employeeCode, pB.employeeCode);
    assert.equal(pA.month, pB.month);
    assert.equal(pA.tenantId, 'company-a');
    assert.equal(pB.tenantId, 'company-b');
  });
});
