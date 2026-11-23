// MAK Tours & Travels ERP - Phase 7 Final Validation & End-to-End Regression Test Suite
// Verifies all 11 items:
// 1. Accountant login
// 2. Role denial
// 3. Tenant isolation across two tenants (including header tampering)
// 4. Payment math & overpayment protection
// 5. Duplicate payment prevention (idempotency)
// 6. Debit == credit on every journal entry
// 7. Trial balance equals zero difference
// 8. Invoice PDF generation
// 9. Report exports (PDF & Excel)
// 10. Payroll and driver reuse
// 11. Regression of Admin and Vendor flows

import test, { describe, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

import app from '../app.js';
import { User } from '../models/User.js';
import { Company } from '../models/Company.js';
import { Booking } from '../models/Booking.js';
import { Payment } from '../models/Payment.js';
import { Expense } from '../models/Expense.js';
import { Invoice } from '../models/Invoice.js';
import { Vendor } from '../models/Vendor.js';
import { Driver } from '../models/Driver.js';
import { Vehicle } from '../models/Vehicle.js';
import { Payroll } from '../models/Payroll.js';
import { DriverSettlement } from '../models/DriverSettlement.js';
import { Account } from '../models/Account.js';
import { JournalEntry } from '../models/JournalEntry.js';
import { seedChartOfAccounts } from '../services/chartOfAccountsSeedService.js';
import { signToken } from '../utils/jwtUtils.js';

let mongod;
let server;
let baseUrl;

before(async () => {
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  await mongoose.connect(uri);

  await new Promise((resolve) => {
    server = app.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://127.0.0.1:${port}`;
      resolve();
    });
  });
});

after(async () => {
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
  await mongoose.disconnect();
  if (mongod) {
    await mongod.stop();
  }
});

beforeEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

async function setupCompanyAndAccountant(tenantId = 'mak-tours') {
  const company = await Company.create({
    tenantId,
    name: tenantId === 'mak-tours' ? 'MAK Tours & Travels Private Limited' : 'Apex Fleet Logistics Pvt Ltd',
    slug: tenantId,
    email: `admin@${tenantId}.com`,
    state: 'Tamil Nadu',
    gstin: '33AABCT1234A1Z5',
    status: 'Active'
  });

  const accountant = await User.create({
    tenantId,
    fullName: 'Rajesh Ramanathan',
    name: 'Rajesh Ramanathan',
    email: tenantId === 'mak-tours' ? 'finance@maktours.com' : `finance@${tenantId}.com`,
    password: 'MakSecure@2026',
    role: 'accountant',
    portal: 'accountant',
    permissions: [
      'finance.view', 'finance.manage', 'finance.create', 'finance.edit',
      'income.view', 'income.manage', 'income.create',
      'expense.view', 'expense.manage', 'expense.create', 'expense.edit', 'expense.approve',
      'invoice.view', 'invoice.manage', 'invoice.create', 'invoice.edit', 'invoice.cancel',
      'payments.view', 'payments.manage', 'payments.create',
      'ledger.view', 'ledger.manage', 'ledger.create',
      'reports.view', 'reports.export',
      'payroll.view', 'driver.settle', 'vendor.pay'
    ],
    status: 'Active'
  });

  await seedChartOfAccounts(tenantId);
  const token = signToken({ id: accountant._id.toString(), email: accountant.email, role: accountant.role, tenantId });
  return { company, accountant, token };
}

describe('=== PHASE 7: FINAL END-TO-END VALIDATION & REGRESSION SUITE ===', () => {

  // 1. Accountant Login
  test('7.1: Accountant login returns signed JWT and normalized user with accountant permissions', async () => {
    await setupCompanyAndAccountant('mak-tours');

    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'finance@maktours.com',
        password: 'MakSecure@2026',
        role: 'accountant'
      })
    });

    assert.equal(res.status, 200);
    const body = await res.json();
    console.log('[Phase 7.1 Real Output - Accountant Login]:', {
      status: body.status,
      role: body.user.role,
      portal: body.user.portal,
      tenantId: body.user.tenantId,
      permissionsCount: body.user.permissions?.length,
      hasToken: Boolean(body.token)
    });

    assert.equal(body.status, 'success');
    assert.equal(body.user.role, 'accountant');
    assert.equal(body.user.portal, 'accountant');
    assert.equal(body.user.tenantId, 'mak-tours');
    assert.ok(body.token, 'Must return cryptographically signed JWT token');
    assert.ok(body.user.permissions.includes('finance.view'));
    assert.ok(body.user.permissions.includes('reports.view'));
    assert.ok(!body.user.permissions.includes('vehicle.view'));
  });

  // 2. Role Denial
  test('7.2: Role Denial: Accountant is strictly denied operations & vehicle endpoints (403 Forbidden)', async () => {
    const { token } = await setupCompanyAndAccountant('mak-tours');

    // Attempt 1: Accountant attempts to read fleet vehicles
    const fleetRes = await fetch(`${baseUrl}/api/vehicles`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    assert.equal(fleetRes.status, 403);
    const fleetErr = await fleetRes.json();
    console.log('[Phase 7.2 Real Output - Vehicle Access Denial]:', fleetErr);
    assert.ok(fleetErr.code.includes('FORBIDDEN'));

    // Attempt 2: Accountant attempts to dispatch/assign a vehicle to booking
    const assignRes = await fetch(`${baseUrl}/api/bookings/BK-TEST-001/assign`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ vehicleId: 'VEH-01', driverId: 'DRV-01' })
    });
    assert.equal(assignRes.status, 403);
    const assignErr = await assignRes.json();
    console.log('[Phase 7.2 Real Output - Trip Assignment Denial]:', assignErr);
    assert.ok(assignErr.code.includes('FORBIDDEN'));
  });

  // 3. Tenant Isolation Across Two Tenants (Including Header Tampering)
  test('7.3: Tenant Isolation: Tenant A accountant with Tenant B header accesses ONLY Tenant A data', async () => {
    const tenantA = await setupCompanyAndAccountant('mak-tours');
    const tenantB = await setupCompanyAndAccountant('apex-travels');

    // Create Booking in Tenant A (25,000)
    await Booking.create({
      tenantId: 'mak-tours',
      refId: 'BK-TENANT-A',
      bookingNumber: 'BK-TENANT-A',
      customerName: 'Tenant A Customer',
      fullName: 'Tenant A Customer',
      mobileNumber: '+91 98401 11111',
      bookingType: 'Round Trip',
      pickupLocation: 'Chennai',
      dropoffLocation: 'Pondicherry',
      tripType: 'Round Trip',
      pickupDate: '2026-11-10',
      totalFare: 25000,
      status: 'Completed'
    });

    // Create Booking in Tenant B (80,000)
    await Booking.create({
      tenantId: 'apex-travels',
      refId: 'BK-TENANT-B',
      bookingNumber: 'BK-TENANT-B',
      customerName: 'Tenant B Customer',
      fullName: 'Tenant B Customer',
      mobileNumber: '+91 98401 22222',
      bookingType: 'Round Trip',
      pickupLocation: 'Bangalore',
      dropoffLocation: 'Mysore',
      tripType: 'Round Trip',
      pickupDate: '2026-11-10',
      totalFare: 80000,
      status: 'Completed'
    });

    // Tenant A accountant queries /api/finance/overview with TAMPERED HEADER x-tenant-id: apex-travels
    const tamperRes = await fetch(`${baseUrl}/api/finance/overview`, {
      headers: {
        Authorization: `Bearer ${tenantA.token}`,
        'x-tenant-id': 'apex-travels' // Spoofed header
      }
    });

    assert.equal(tamperRes.status, 200);
    const overview = await tamperRes.json();
    console.log('[Phase 7.3 Real Output - Header Tampering Isolation]:', {
      bookingRevenue: overview.data.bookingRevenue,
      expected: 25000,
      tenantBDataLeaked: overview.data.bookingRevenue === 80000
    });

    // Must strictly equal Tenant A recognized revenue (25,000), NEVER Tenant B (80,000)!
    assert.equal(overview.data.bookingRevenue, 25000);
  });

  // 4. Payment Math & Overpayment Protection
  test('7.4: Payment Math: Overpayment is rejected by default and balance is accurately tracked', async () => {
    const { token } = await setupCompanyAndAccountant('mak-tours');

    // Create booking for 20,000 with 5,000 advance -> balance 15,000
    await Booking.create({
      tenantId: 'mak-tours',
      refId: 'BK-PAYMATH-01',
      bookingNumber: 'BK-PAYMATH-01',
      customerName: 'Vasanth Kumar',
      fullName: 'Vasanth Kumar',
      mobileNumber: '+91 98401 33333',
      bookingType: 'Round Trip',
      pickupLocation: 'Chennai',
      dropoffLocation: 'Coimbatore',
      tripType: 'Round Trip',
      pickupDate: '2026-11-12',
      totalFare: 20000,
      advancePaid: 5000,
      balanceDue: 15000,
      status: 'Confirmed'
    });

    // 1. Attempt Overpayment of 18,000 without allowOverpayment flag -> 400 Bad Request
    const overpayRes = await fetch(`${baseUrl}/api/finance/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        bookingRef: 'BK-PAYMATH-01',
        amount: 18000,
        paymentMethod: 'UPI'
      })
    });

    assert.equal(overpayRes.status, 400);
    const overpayErr = await overpayRes.json();
    console.log('[Phase 7.4 Real Output - Overpayment Rejection]:', overpayErr);
    assert.equal(overpayErr.code, 'OVERPAYMENT_REJECTED');

    // 2. Legitimate Payment of 10,000 -> 201 Created
    const validPayRes = await fetch(`${baseUrl}/api/finance/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        bookingRef: 'BK-PAYMATH-01',
        amount: 10000,
        paymentMethod: 'Bank Transfer'
      })
    });

    assert.equal(validPayRes.status, 201);
    const validPay = await validPayRes.json();
    console.log('[Phase 7.4 Real Output - Legitimate Payment Receipt]:', {
      paymentId: validPay.data.paymentId,
      receiptNumber: validPay.data.receiptNumber,
      amount: validPay.data.amount
    });

    assert.ok(validPay.data.paymentId);
    assert.ok(validPay.data.receiptNumber, 'Must generate formal receipt number');

    // Verify remaining booking balance in DB is accurately tracked as ₹5,000
    const updatedBooking = await Booking.findOne({ refId: 'BK-PAYMATH-01' });
    assert.equal(updatedBooking.balanceDue, 5000); // 15,000 - 10,000 = 5,000
  });

  // 5. Duplicate Payment Prevention (Idempotency)
  test('7.5: Duplicate Payment Prevention: Idempotency key prevents double charging and returns existing record', async () => {
    const { token } = await setupCompanyAndAccountant('mak-tours');

    await Booking.create({
      tenantId: 'mak-tours',
      refId: 'BK-IDEM-01',
      bookingNumber: 'BK-IDEM-01',
      customerName: 'Anand Kumar',
      fullName: 'Anand Kumar',
      mobileNumber: '+91 98401 44444',
      bookingType: 'Round Trip',
      pickupLocation: 'Chennai',
      dropoffLocation: 'Salem',
      tripType: 'Round Trip',
      pickupDate: '2026-11-12',
      totalFare: 30000,
      advancePaid: 0,
      balanceDue: 30000,
      status: 'Confirmed'
    });

    const paymentPayload = {
      bookingRef: 'BK-IDEM-01',
      amount: 12000,
      paymentMethod: 'UPI',
      idempotencyKey: 'IDEM-KEY-PHASE7-999'
    };

    // First Submission -> 201 Created
    const res1 = await fetch(`${baseUrl}/api/finance/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(paymentPayload)
    });
    assert.equal(res1.status, 201);
    const body1 = await res1.json();

    // Re-submission with SAME idempotency key -> 200 OK (Duplicate blocked, returns existing)
    const res2 = await fetch(`${baseUrl}/api/finance/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(paymentPayload)
    });
    assert.equal(res2.status, 200);
    const body2 = await res2.json();

    console.log('[Phase 7.5 Real Output - Idempotency Re-submission]:', {
      firstCallStatus: res1.status,
      secondCallStatus: res2.status,
      firstPaymentId: body1.data.paymentId,
      secondPaymentId: body2.data.paymentId,
      message: body2.message
    });

    assert.equal(body1.data.paymentId, body2.data.paymentId);
    assert.ok(body2.message.includes('idempotent'));

    // Verify only ONE payment document exists in MongoDB
    const paymentCount = await Payment.countDocuments({ tenantId: 'mak-tours', bookingRef: 'BK-IDEM-01' });
    assert.equal(paymentCount, 1);
  });

  // 6. Debit == Credit on Every Journal Entry
  test('7.6: Debit == Credit Invariant: Every financial transaction creates balanced double-entry journals', async () => {
    const { token } = await setupCompanyAndAccountant('mak-tours');

    // 1. Create a Customer Payment (triggers postingService.postCustomerPayment)
    await Booking.create({
      tenantId: 'mak-tours',
      refId: 'BK-JOURNAL-01',
      bookingNumber: 'BK-JOURNAL-01',
      customerName: 'Karthik S',
      fullName: 'Karthik S',
      mobileNumber: '+91 98401 55555',
      bookingType: 'Round Trip',
      pickupLocation: 'Chennai',
      dropoffLocation: 'Madurai',
      tripType: 'Round Trip',
      pickupDate: '2026-11-14',
      totalFare: 15000,
      balanceDue: 15000,
      status: 'Confirmed'
    });

    await fetch(`${baseUrl}/api/finance/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        bookingRef: 'BK-JOURNAL-01',
        amount: 15000,
        paymentMethod: 'Bank Transfer'
      })
    });

    // 2. Create and Approve an Expense (triggers postingService.postExpense)
    const expRes = await fetch(`${baseUrl}/api/finance/expenses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        title: 'Highway Fastag Toll',
        category: 'Toll Plaza',
        amount: 2500,
        date: '2026-11-14',
        paymentMode: 'Bank Transfer'
      })
    });
    const exp = (await expRes.json()).data;
    const expId = exp.id || exp._id;
    await fetch(`${baseUrl}/api/finance/expenses/${expId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ status: 'Approved' })
    });
    await fetch(`${baseUrl}/api/finance/expenses/${expId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ status: 'Paid' })
    });

    // Inspect all Journal Entries created in MongoDB
    const journals = await JournalEntry.find({ tenantId: 'mak-tours' }).lean();
    console.log(`[Phase 7.6 Real Output - Total Posted Journals: ${journals.length}]`);

    assert.ok(journals.length >= 2, 'Must have created journals for payment and expense');

    for (const j of journals) {
      const totalDebit = j.lines.reduce((s, l) => s + (l.debit || 0), 0);
      const totalCredit = j.lines.reduce((s, l) => s + (l.credit || 0), 0);
      console.log(`  Journal [${j.entryNo}] ${j.narration}: Debit = ₹${totalDebit}, Credit = ₹${totalCredit}`);
      assert.equal(totalDebit, totalCredit, `Journal ${j.entryNo} must strictly have totalDebit === totalCredit`);
    }

    // Attempt direct save of an UNBALANCED journal entry -> Must throw ValidationError
    await assert.rejects(
      async () => {
        await JournalEntry.create({
          tenantId: 'mak-tours',
          entryNo: 'JE-FAIL-01',
          date: '2026-11-14',
          narration: 'Illegal unbalanced entry',
          lines: [
            { account: '1010', debit: 5000, credit: 0 },
            { account: '4010', debit: 0, credit: 3000 } // Imbalanced!
          ]
        });
      },
      /Validation failed|debit.*credit/i,
      'Unbalanced journal entry must be rejected by model validation'
    );
  });

  // 7. Trial Balance Equals Zero Difference
  test('7.7: Trial Balance Verification: Total Net Debit equals Total Net Credit with ZERO difference', async () => {
    const { token } = await setupCompanyAndAccountant('mak-tours');

    // Run transaction: Payment of 50,000
    await Booking.create({
      tenantId: 'mak-tours',
      refId: 'BK-TB-01',
      bookingNumber: 'BK-TB-01',
      customerName: 'Global Corporate Tours',
      fullName: 'Global Corporate Tours',
      mobileNumber: '+91 98401 66666',
      bookingType: 'Round Trip',
      pickupLocation: 'Chennai',
      dropoffLocation: 'Kanchipuram',
      tripType: 'Round Trip',
      pickupDate: '2026-11-15',
      totalFare: 50000,
      balanceDue: 50000,
      status: 'Confirmed'
    });

    await fetch(`${baseUrl}/api/finance/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        bookingRef: 'BK-TB-01',
        amount: 50000,
        paymentMethod: 'Bank Transfer'
      })
    });

    const tbRes = await fetch(`${baseUrl}/api/accounting/reports/trial-balance`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    assert.equal(tbRes.status, 200);
    const tb = await tbRes.json();
    console.log('[Phase 7.7 Real Output - Trial Balance Summary]:', {
      totalDebit: tb.totalDebit,
      totalCredit: tb.totalCredit,
      difference: tb.difference,
      isBalanced: tb.isBalanced
    });

    assert.equal(tb.totalDebit, tb.totalCredit);
    assert.equal(tb.difference, 0);
    assert.equal(tb.isBalanced, true);
  });

  // 8. Invoice PDF Generation
  test('7.8: Invoice PDF: Generates and streams valid PDF document buffer', async () => {
    const { token } = await setupCompanyAndAccountant('mak-tours');

    // Create Invoice with line items and GST
    const invRes = await fetch(`${baseUrl}/api/finance/invoices`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        customer: {
          name: 'Sundaram Fasteners Ltd',
          email: 'accounts@sundaram.in',
          phone: '+91 98401 77777',
          address: 'Padi, Chennai',
          gstin: '33AABCS1234A1Z9'
        },
        lineItems: [
          { description: 'Executive Innova Crysta Round Trip (Chennai to Trichy)', quantity: 1, rate: 20000, amount: 20000 }
        ],
        customerState: 'Tamil Nadu', // Intra-state -> CGST + SGST (5%)
        invoiceDate: '2026-11-15',
        dueDate: '2026-11-30'
      })
    });

    assert.equal(invRes.status, 201);
    const invoice = (await invRes.json()).data;

    // Download Invoice PDF
    const pdfRes = await fetch(`${baseUrl}/api/finance/invoices/${invoice.invoiceNumber}/pdf`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    assert.equal(pdfRes.status, 200);
    assert.equal(pdfRes.headers.get('content-type'), 'application/pdf');
    const pdfBuffer = await pdfRes.arrayBuffer();

    console.log('[Phase 7.8 Real Output - Invoice PDF Generation]:', {
      invoiceNumber: invoice.invoiceNumber,
      contentType: pdfRes.headers.get('content-type'),
      pdfByteLength: pdfBuffer.byteLength,
      isNonEmpty: pdfBuffer.byteLength > 1000
    });

    assert.ok(pdfBuffer.byteLength > 1000, 'Invoice PDF must be non-empty and well-formed');
    const headerBytes = new Uint8Array(pdfBuffer.slice(0, 5));
    const headerStr = String.fromCharCode(...headerBytes);
    assert.equal(headerStr, '%PDF-', 'Invoice PDF must have standard %PDF- header signature');
  });

  // 9. Report Exports (PDF & Excel)
  test('7.9: Report Exports: Streams valid PDF and Excel .xlsx workbooks', async () => {
    const { token } = await setupCompanyAndAccountant('mak-tours');

    // PDF Export of Profit & Loss Report
    const pdfRes = await fetch(`${baseUrl}/api/reports/export/pdf?reportType=profit-and-loss`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    assert.equal(pdfRes.status, 200);
    assert.equal(pdfRes.headers.get('content-type'), 'application/pdf');
    const pdfBuf = await pdfRes.arrayBuffer();

    // Excel Export of Monthly Revenue Report
    const excelRes = await fetch(`${baseUrl}/api/reports/export/excel?reportType=monthly-revenue-expense`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    assert.equal(excelRes.status, 200);
    assert.equal(excelRes.headers.get('content-type'), 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    const excelBuf = await excelRes.arrayBuffer();

    console.log('[Phase 7.9 Real Output - Executive Report Exports]:', {
      pdfContentType: pdfRes.headers.get('content-type'),
      pdfSize: pdfBuf.byteLength,
      excelContentType: excelRes.headers.get('content-type'),
      excelSize: excelBuf.byteLength
    });

    assert.ok(pdfBuf.byteLength > 500, 'PDF export buffer must be non-empty');
    assert.ok(excelBuf.byteLength > 1000, 'Excel .xlsx export buffer must be non-empty');
  });

  // 10. Payroll & Driver Allowance Logic Reuse
  test('7.10: Engine Reuse: Driver settlements and payroll reuse core logic and record ledger entries', async () => {
    const { token } = await setupCompanyAndAccountant('mak-tours');

    // 1. Driver Settlement Engine Reuse
    await Driver.create({
      tenantId: 'mak-tours',
      id: 'DRV-701',
      fullName: 'Venkatesh Raghavan',
      name: 'Venkatesh Raghavan',
      phone: '+91 98401 99887',
      status: 'Active'
    });

    await Booking.create({
      tenantId: 'mak-tours',
      refId: 'BK-DRV-REUSE',
      bookingNumber: 'BK-DRV-REUSE',
      fullName: 'Passenger X',
      bookingType: 'Round Trip',
      mobileNumber: '+91 98401 00000',
      driverId: 'drv-701',
      status: 'Completed',
      travelDate: '2026-11-10',
      pickupTime: '22:30', // Night shift
      actualDistanceKm: 320 // Long distance
    });

    const calcRes = await fetch(`${baseUrl}/api/driver-settlements/calculate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        driverId: 'DRV-701',
        periodStart: '2026-11-01',
        periodEnd: '2026-11-15'
      })
    });
    assert.equal(calcRes.status, 200);
    const calc = await calcRes.json();
    console.log('[Phase 7.10 Real Output - Driver Allowance Calculation Reuse]:', {
      perTrip: calc.calculation.perTripAllowanceTotal,
      nightDuty: calc.calculation.nightAllowanceTotal,
      longDistance: calc.calculation.longDistanceAllowanceTotal,
      grossEarnings: calc.calculation.grossEarnings
    });

    assert.equal(calc.calculation.grossEarnings, 950); // 300 (per-trip) + 250 (night) + 400 (long distance)

    // 2. Payroll Accounting Ledger Reuse
    await Payroll.create({
      tenantId: 'mak-tours',
      payrollCode: 'PAY-202611-EMP99',
      employeeId: 'EMP-99',
      employeeName: 'Latha Natarajan',
      month: '2026-11',
      earningsBreakdown: { monthlyGrossSalary: 45000 },
      deductionsBreakdown: { pfDeduction: 1800, esiDeduction: 0, tdsDeduction: 2000 },
      netPayableSalary: 41200,
      totalPaidAmount: 0,
      status: 'Approved'
    });

    const payDisburseRes = await fetch(`${baseUrl}/api/payroll/PAY-202611-EMP99/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        amount: 41200,
        paymentMethod: 'Bank Transfer'
      })
    });
    assert.equal(payDisburseRes.status, 201);
    const payBody = await payDisburseRes.json();
    console.log('[Phase 7.10 Real Output - Payroll Disbursement Ledger Entry]:', {
      payrollCode: payBody.data?.payroll?.payrollCode,
      status: payBody.data?.payroll?.status,
      netPaid: payBody.data?.payroll?.totalPaidAmount
    });

    assert.equal(payBody.data?.payroll?.status, 'Paid');
  });

  // 11. Regression of Admin and Vendor Flows
  test('7.11: Regression: Company Admin, Vendor portal, and public booking site work without disruption', async () => {
    // 1. Create Admin User
    await Company.create({
      tenantId: 'mak-tours',
      name: 'MAK Tours & Travels Private Limited',
      slug: 'mak-tours',
      email: 'admin@maktours.com',
      status: 'Active'
    });

    await User.create({
      tenantId: 'mak-tours',
      fullName: 'MAK Operations Director',
      name: 'MAK Operations Director',
      email: 'admin@maktours.com',
      password: 'MakSecure@2026',
      role: 'company_admin',
      portal: 'admin',
      status: 'Active'
    });

    // Admin Login
    const adminLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@maktours.com', password: 'MakSecure@2026', role: 'company_admin' })
    });
    assert.equal(adminLoginRes.status, 200);
    const adminLogin = await adminLoginRes.json();
    assert.equal(adminLogin.user.role, 'company_admin');
    assert.equal(adminLogin.user.portal, 'admin');

    // Admin accesses fleet management -> 200 OK
    const adminFleetRes = await fetch(`${baseUrl}/api/vehicles`, {
      headers: { Authorization: `Bearer ${adminLogin.token}` }
    });
    assert.equal(adminFleetRes.status, 200);

    // 2. Vendor Login & Access
    await Vendor.create({
      tenantId: 'mak-tours',
      vendorId: 'VND-REGRESS-01',
      companyName: 'Apex Logistics Chennai',
      email: 'vendor@apexfleet.in',
      phone: '+91 98401 88990',
      status: 'Active'
    });

    const vendorLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'vendor@apexfleet.in', password: 'MakSecure@2026', role: 'vendor' })
    });
    assert.equal(vendorLoginRes.status, 200);
    const vendorLogin = await vendorLoginRes.json();
    assert.equal(vendorLogin.user.role, 'vendor');
    assert.equal(vendorLogin.user.portal, 'vendor');

    // 3. Public Customer Booking Website (NO TOKEN) -> 201 Created
    const pubBookRes = await fetch(`${baseUrl}/api/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Tourist Ramesh',
        mobileNumber: '+91 98401 99999',
        bookingType: 'Round Trip',
        pickupLocation: 'Chennai Airport',
        dropLocation: 'Mahabalipuram',
        travelDate: '2026-11-20',
        totalFare: 3500
      })
    });
    assert.equal(pubBookRes.status, 201);
    const pubBook = await pubBookRes.json();

    console.log('[Phase 7.11 Real Output - Admin, Vendor & Public Regression]:', {
      adminRole: adminLogin.user.role,
      adminFleetStatus: adminFleetRes.status,
      vendorRole: vendorLogin.user.role,
      vendorPortal: vendorLogin.user.portal,
      publicBookingNumber: pubBook.data?.bookingNumber || pubBook.data?.refId
    });

    assert.ok(pubBook.data, 'Public booking must be created successfully without auth token');
  });

});
