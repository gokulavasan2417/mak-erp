// MAK Tours & Travels ERP - Phase 4 Payable, Driver, Payroll, Cash & Bank Test Suite
import test, { describe, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

import app from '../app.js';
import { User } from '../models/User.js';
import { Company } from '../models/Company.js';
import { Vendor } from '../models/Vendor.js';
import { VendorBill } from '../models/VendorBill.js';
import { VendorPayment } from '../models/VendorPayment.js';
import { Driver } from '../models/Driver.js';
import { DriverSettlement } from '../models/DriverSettlement.js';
import { Booking } from '../models/Booking.js';
import { Employee } from '../models/Employee.js';
import { Payroll } from '../models/Payroll.js';
import { PayrollPolicy } from '../models/PayrollPolicy.js';
import { CashBankAccount } from '../models/CashBankAccount.js';
import { CashBankTransaction } from '../models/CashBankTransaction.js';
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
  for (const key of Object.keys(collections)) {
    await collections[key].deleteMany({});
  }
});

describe('Phase 4: Payable, Driver, Payroll, Cash & Bank Suite', () => {

  async function setupAccountant(tenantId = 'mak-tours') {
    await Company.create({
      tenantId,
      name: 'MAK Tours & Travels',
      slug: tenantId,
      email: `admin@${tenantId}.com`,
      state: 'Tamil Nadu',
      gstin: '33AABCT1234A1Z5'
    });

    const user = await User.create({
      fullName: 'Suresh Accountant',
      name: 'Suresh Accountant',
      email: `accountant@${tenantId}.com`,
      password: 'SecurePassword123!',
      role: 'accountant',
      tenantId
    });

    await seedChartOfAccounts(tenantId);
    const token = signToken({ id: user._id.toString(), email: user.email, role: user.role, tenantId });
    return { user, token };
  }

  // 1. Vendor Bills, Payments & Ledger
  test('4.1: Vendor Bills, partial/full payments, overpayment guard, and vendor ledger', async () => {
    const { token } = await setupAccountant('mak-tours');

    // Create Vendor
    const vendor = await Vendor.create({
      tenantId: 'mak-tours',
      vendorId: 'VND-001',
      companyName: 'SRS Travels Fleet Partners',
      phone: '+91 98401 88888',
      email: 'srs@example.com'
    });

    // 1. Create Vendor Bill for 25,000
    const billRes = await fetch(`${baseUrl}/api/payable/bills`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        vendorId: vendor.vendorId,
        category: 'Subcontract Vehicle',
        subtotal: 25000,
        billDate: '2026-11-01',
        dueDate: '2026-11-15',
        notes: 'Monthly Innova subcontract lease'
      })
    });

    assert.equal(billRes.status, 201);
    const bill = (await billRes.json()).data;
    assert.equal(bill.totalAmount, 25000);
    assert.equal(bill.balanceDue, 25000);
    assert.equal(bill.status, 'Unpaid');

    // 2. Overpayment Guard: Trying to pay 30,000 on a 25,000 bill must be REJECTED with 400
    const overpayRes = await fetch(`${baseUrl}/api/payable/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        vendorId: vendor.vendorId,
        billNumber: bill.billNumber,
        amount: 30000,
        paymentType: 'Full Payment'
      })
    });

    assert.equal(overpayRes.status, 400);
    const overpayBody = await overpayRes.json();
    assert.equal(overpayBody.code, 'OVERPAYMENT_REJECTED');

    // 3. Partial Payment of 10,000
    const partPayRes = await fetch(`${baseUrl}/api/payable/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        vendorId: vendor.vendorId,
        billNumber: bill.billNumber,
        amount: 10000,
        paymentType: 'Partial Payment',
        paymentMethod: 'Bank Transfer'
      })
    });

    assert.equal(partPayRes.status, 201);
    const partPayBody = await partPayRes.json();
    assert.equal(partPayBody.bill.amountPaid, 10000);
    assert.equal(partPayBody.bill.balanceDue, 15000);
    assert.equal(partPayBody.bill.status, 'Partially Paid');

    // 4. Remaining Payment of 15,000 -> Marks Bill as Paid
    const fullPayRes = await fetch(`${baseUrl}/api/payable/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        vendorId: vendor.vendorId,
        billNumber: bill.billNumber,
        amount: 15000,
        paymentType: 'Full Payment',
        paymentMethod: 'Bank Transfer'
      })
    });

    assert.equal(fullPayRes.status, 201);
    const fullPayBody = await fullPayRes.json();
    assert.equal(fullPayBody.bill.balanceDue, 0);
    assert.equal(fullPayBody.bill.status, 'Paid');

    // 5. Vendor Ledger Query
    const ledgerRes = await fetch(`${baseUrl}/api/payable/ledger?vendorId=${vendor.vendorId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    assert.equal(ledgerRes.status, 200);
    const ledger = await ledgerRes.json();
    assert.equal(ledger.summary.totalBilled, 25000);
    assert.equal(ledger.summary.totalPaid, 25000);
    assert.equal(ledger.summary.outstandingBalance, 0);
    assert.equal(ledger.count, 3); // 1 bill + 2 payments

    // 6. Outstanding Report
    const outRes = await fetch(`${baseUrl}/api/payable/outstanding`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    assert.equal(outRes.status, 200);
    const outBody = await outRes.json();
    assert.equal(outBody.totalOutstanding, 0);
  });

  // 2. Driver Settlements Reusing Phase 0 Trip Allowance Engine
  test('4.2: Driver settlement calculation reuses Phase 0 allowance engine and records disbursement', async () => {
    const { token } = await setupAccountant('mak-tours');

    // Create Driver
    const driver = await Driver.create({
      tenantId: 'mak-tours',
      id: 'DRV-101',
      fullName: 'Muruganandam Selvam',
      name: 'Muruganandam Selvam',
      phone: '+91 98401 44332',
      status: 'Active'
    });

    // Create 2 Completed Bookings assigned to driver:
    // Trip 1: Day trip, distance 150km (<250km) -> Per Trip Allowance = 300
    // Trip 2: Night duty (pickup 23:00) + Long Distance (300km > 250km) -> Per Trip (300) + Night (250) + LongDist (400) = 950
    // Total expected allowances = 300 + 950 = 1,250
    await Booking.create([
      {
        tenantId: 'mak-tours',
        refId: 'BK-TRIP-DRV-1',
        bookingNumber: 'BK-TRIP-DRV-1',
        fullName: 'Passenger One',
        bookingType: 'Round Trip',
        mobileNumber: '+91 98401 11111',
        driverId: 'drv-101',
        status: 'Completed',
        travelDate: '2026-11-05',
        pickupTime: '10:00',
        actualDistanceKm: 150
      },
      {
        tenantId: 'mak-tours',
        refId: 'BK-TRIP-DRV-2',
        bookingNumber: 'BK-TRIP-DRV-2',
        fullName: 'Passenger Two',
        bookingType: 'Round Trip',
        mobileNumber: '+91 98401 22222',
        driverId: 'drv-101',
        status: 'Completed',
        travelDate: '2026-11-06',
        pickupTime: '23:00', // Night shift
        actualDistanceKm: 300 // Long distance
      }
    ]);

    // 1. Calculate Settlement Preview
    const calcRes = await fetch(`${baseUrl}/api/driver-settlements/calculate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        driverId: 'DRV-101',
        periodStart: '2026-11-01',
        periodEnd: '2026-11-10',
        deductions: 100,
        deductionReason: 'Uniform washing charge'
      })
    });

    assert.equal(calcRes.status, 200);
    const calcBody = await calcRes.json();
    assert.equal(calcBody.calculation.tripCount, 2);
    assert.equal(calcBody.calculation.perTripAllowanceTotal, 600); // 300 * 2
    assert.equal(calcBody.calculation.nightAllowanceTotal, 250);   // 1 night trip
    assert.equal(calcBody.calculation.longDistanceAllowanceTotal, 400); // 1 long dist trip
    assert.equal(calcBody.calculation.grossEarnings, 1250);
    assert.equal(calcBody.calculation.otherDeductions, 100);
    assert.equal(calcBody.calculation.netSettlementAmount, 1150); // 1250 - 100

    // 2. Create Driver Settlement
    const createRes = await fetch(`${baseUrl}/api/driver-settlements`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        driverId: 'DRV-101',
        driverName: 'Muruganandam Selvam',
        periodStart: '2026-11-01',
        periodEnd: '2026-11-10',
        trips: calcBody.calculation.trips,
        grossEarnings: 1250,
        otherDeductions: 100,
        deductionReason: 'Uniform charge'
      })
    });

    assert.equal(createRes.status, 201);
    const settlement = (await createRes.json()).data;
    assert.equal(settlement.netSettlementAmount, 1150);
    assert.equal(settlement.balanceDue, 1150);

    // 3. Disburse Settlement Payment (Posts to General Ledger)
    const payRes = await fetch(`${baseUrl}/api/driver-settlements/${settlement.settlementNo}/pay`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        amount: 1150,
        paymentMethod: 'UPI'
      })
    });

    assert.equal(payRes.status, 200);
    const paidSettlement = (await payRes.json()).data;
    assert.equal(paidSettlement.status, 'Paid');
    assert.equal(paidSettlement.balanceDue, 0);
    assert.ok(paidSettlement.journalEntryNo, 'Settlement payment must create double-entry journal entry');

    // 4. Statement View
    const stmtRes = await fetch(`${baseUrl}/api/driver-settlements/${settlement.settlementNo}/statement`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    assert.equal(stmtRes.status, 200);
    const stmt = (await stmtRes.json()).data;
    assert.equal(stmt.status, 'Paid');
    assert.equal(stmt.trips.length, 2);
  });

  // 3. Payroll Accounting & Ledger Integration
  test('3. Payroll accounting posts to general ledger on payment and exposes accountant analytics', async () => {
    const { token } = await setupAccountant('mak-tours');

    // Create Employee and Approved Payroll record
    const emp = await Employee.create({
      tenantId: 'mak-tours',
      employeeCode: 'EMP-ACC-01',
      id: 'EMP-ACC-01',
      fullName: 'Dhanalakshmi Narayanan',
      designation: 'Senior Accountant',
      department: 'Finance & Accounts',
      phone: '+91 98401 12345'
    });

    const payroll = await Payroll.create({
      tenantId: 'mak-tours',
      payrollCode: 'PAY-202611-EMP01',
      employeeId: emp.employeeCode,
      employeeName: emp.fullName,
      month: '2026-11',
      earningsBreakdown: {
        basicSalary: 30000,
        hra: 12000,
        monthlyGrossSalary: 42000,
        grossEarnings: 42000
      },
      deductionsBreakdown: {
        pfDeduction: 1800,
        esiDeduction: 0,
        totalDeductions: 1800
      },
      netPayableSalary: 40200,
      totalPaidAmount: 0,
      outstandingSalary: 40200,
      status: 'Approved'
    });

    // 1. Record Payment via existing payrollController endpoint
    const payRes = await fetch(`${baseUrl}/api/payroll/${payroll.payrollCode}/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        amount: 40200,
        paymentMethod: 'Bank Transfer'
      })
    });

    assert.equal(payRes.status, 201);
    const payBody = await payRes.json();
    assert.equal(payBody.data.payroll.status, 'Paid');
    assert.equal(payBody.data.payroll.outstandingSalary, 0);

    // Verify double-entry journal entry was posted
    const jv = await JournalEntry.findOne({ tenantId: 'mak-tours', sourceType: 'salary_payment' });
    assert.notEqual(jv, null, 'Salary payment must generate a posted double-entry journal entry');
    assert.equal(jv.totalDebit, 40200);
    assert.equal(jv.totalCredit, 40200);

    // 2. Accountant Monthly Payroll Summary
    const summaryRes = await fetch(`${baseUrl}/api/payroll/accounting/summary?month=2026-11`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    assert.equal(summaryRes.status, 200);
    const summary = (await summaryRes.json()).data;
    assert.equal(summary.totalCount, 1);
    assert.equal(summary.totalGrossSalary, 42000);
    assert.equal(summary.statutoryDeductions.pf, 1800);
    assert.equal(summary.totalNetPayableSalary, 40200);
    assert.equal(summary.totalDisbursed, 40200);
    assert.equal(summary.totalOutstanding, 0);
  });

  // 4. Cash & Bank Management: Cashbook, Transfers & Reconciliation
  test('4.4: Cashbook running balance, inter-account transfers, and bank reconciliation', async () => {
    const { token } = await setupAccountant('mak-tours');

    // Cash and Bank accounts were seeded by setupAccountant:
    // Cash: 1010, Bank: 1020, UPI: 1030
    const bankAcc = await CashBankAccount.findOne({ tenantId: 'mak-tours', $or: [{ accountType: 'bank' }, { type: 'bank' }] });
    const upiAcc = await CashBankAccount.findOne({ tenantId: 'mak-tours', $or: [{ accountType: 'upi' }, { type: 'upi' }] });

    assert.ok(bankAcc);
    assert.ok(upiAcc);

    const initialBankBal = Number(bankAcc.currentBalance || 0);
    const initialUpiBal = Number(upiAcc.currentBalance || 0);

    // 1. Record Deposit of 50,000 into Bank Account
    const depRes = await fetch(`${baseUrl}/api/cash-bank/deposits`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        accountId: bankAcc._id.toString(),
        amount: 50000,
        narration: 'Initial promoter capital bank deposit'
      })
    });

    assert.equal(depRes.status, 201);
    const depBody = await depRes.json();
    assert.equal(depBody.updatedBalance, initialBankBal + 50000);

    // 2. Inter-Account Transfer: Transfer 15,000 from Bank to UPI
    const transferRes = await fetch(`${baseUrl}/api/cash-bank/transfers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        fromAccountId: bankAcc._id.toString(),
        toAccountId: upiAcc._id.toString(),
        amount: 15000,
        narration: 'Transfer from HDFC Current Account to UPI Wallet for fleet fuel'
      })
    });

    assert.equal(transferRes.status, 201);
    const transferBody = await transferRes.json();
    assert.equal(transferBody.fromAccountBalance, initialBankBal + 50000 - 15000);
    assert.equal(transferBody.toAccountBalance, initialUpiBal + 15000);

    // 3. Overdraw check: Transferring 500,000 exceeding balance must be rejected
    const overdrawRes = await fetch(`${baseUrl}/api/cash-bank/transfers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        fromAccountId: bankAcc._id.toString(),
        toAccountId: upiAcc._id.toString(),
        amount: 500000
      })
    });
    assert.equal(overdrawRes.status, 400);

    // 4. Cashbook Query
    const cashbookRes = await fetch(`${baseUrl}/api/cash-bank/cashbook?accountId=${bankAcc._id.toString()}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    assert.equal(cashbookRes.status, 200);
    const cashbook = await cashbookRes.json();
    assert.equal(cashbook.summary.totalDeposits, 50000);
    assert.equal(cashbook.summary.totalWithdrawals, 15000);
    assert.equal(cashbook.summary.closingBalance, initialBankBal + 50000 - 15000);

    // 5. Bank Reconciliation: Fetch unmatched transactions
    const reconRes = await fetch(`${baseUrl}/api/cash-bank/reconciliation?accountId=${bankAcc._id.toString()}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    assert.equal(reconRes.status, 200);
    const reconBody = await reconRes.json();
    assert.equal(reconBody.summary.unmatchedCount, 2); // Deposit + Transfer
    assert.equal(reconBody.summary.matchedCount, 0);

    // 6. Match statement line
    const txnToMatch = reconBody.data[0];
    const matchRes = await fetch(`${baseUrl}/api/cash-bank/reconciliation/${txnToMatch.txnNo}/match`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        matched: true,
        notes: 'Verified against HDFC Bank e-statement line #451'
      })
    });

    assert.equal(matchRes.status, 200);
    const matchBody = await matchRes.json();
    assert.equal(matchBody.data.matched, true);
    assert.ok(matchBody.data.reconciledAt);
    assert.ok(matchBody.data.reconciledBy);
  });
});