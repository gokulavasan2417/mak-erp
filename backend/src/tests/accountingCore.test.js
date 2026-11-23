// MAK Tours & Travels ERP - Phase 2 Accounting Core Verification Test Suite
import test, { describe, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

import app from '../app.js';
import { Account } from '../models/Account.js';
import { FinancialYear } from '../models/FinancialYear.js';
import { CashBankAccount } from '../models/CashBankAccount.js';
import { JournalEntry } from '../models/JournalEntry.js';
import { User } from '../models/User.js';
import { Company } from '../models/Company.js';
import { postingService } from '../services/postingService.js';
import { seedChartOfAccounts } from '../services/chartOfAccountsSeedService.js';
import { sequenceService } from '../services/sequenceService.js';
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

describe('Phase 2: Accounting Core, Double-Entry & Financial Reports Suite', () => {

  test('2.1: JournalEntry model strictly requires totalDebit === totalCredit and rejects imbalanced entries', async () => {
    await seedChartOfAccounts('mak-tours');
    const cashAcc = await Account.findOne({ tenantId: 'mak-tours', code: '1010' });
    const revAcc = await Account.findOne({ tenantId: 'mak-tours', code: '4010' });

    // Imbalanced entry: Debit 1000, Credit 800
    const imbalancedEntry = new JournalEntry({
      tenantId: 'mak-tours',
      entryNo: 'JV-TEST-001',
      date: '2026-11-15',
      narration: 'Imbalanced entry test',
      lines: [
        { account: cashAcc._id, accountCode: cashAcc.code, accountName: cashAcc.name, debit: 1000, credit: 0 },
        { account: revAcc._id, accountCode: revAcc.code, accountName: revAcc.name, debit: 0, credit: 800 }
      ],
      totalDebit: 1000,
      totalCredit: 800,
      sourceType: 'manual_journal',
      sourceId: 'TEST-001',
      status: 'posted'
    });

    await assert.rejects(
      async () => {
        await imbalancedEntry.save();
      },
      /Accounting imbalance/i,
      'Should reject journal entry where debits do not equal credits'
    );
  });

  test('2.2: JournalEntry model strictly rejects negative amounts and single-line journals', async () => {
    await seedChartOfAccounts('mak-tours');
    const cashAcc = await Account.findOne({ tenantId: 'mak-tours', code: '1010' });
    const revAcc = await Account.findOne({ tenantId: 'mak-tours', code: '4010' });

    // Negative amount
    const negativeEntry = new JournalEntry({
      tenantId: 'mak-tours',
      entryNo: 'JV-TEST-002',
      date: '2026-11-15',
      narration: 'Negative test',
      lines: [
        { account: cashAcc._id, accountCode: cashAcc.code, accountName: cashAcc.name, debit: -500, credit: 0 },
        { account: revAcc._id, accountCode: revAcc.code, accountName: revAcc.name, debit: 0, credit: -500 }
      ],
      totalDebit: -500,
      totalCredit: -500,
      sourceType: 'manual_journal',
      sourceId: 'TEST-002',
      status: 'posted'
    });

    await assert.rejects(
      async () => {
        await negativeEntry.save();
      },
      /Negative values are strictly forbidden/i
    );

    // Single-line journal
    const singleLineEntry = new JournalEntry({
      tenantId: 'mak-tours',
      entryNo: 'JV-TEST-003',
      date: '2026-11-15',
      narration: 'Single line test',
      lines: [
        { account: cashAcc._id, accountCode: cashAcc.code, accountName: cashAcc.name, debit: 500, credit: 0 }
      ],
      totalDebit: 500,
      totalCredit: 0,
      sourceType: 'manual_journal',
      sourceId: 'TEST-003',
      status: 'posted'
    });

    await assert.rejects(
      async () => {
        await singleLineEntry.save();
      },
      /at least 2 lines/i
    );
  });

  test('2.3: postingService creates balanced journal entries for all 7 business transaction types', async () => {
    await seedChartOfAccounts('mak-tours');

    // 1. Customer Payment
    const jv1 = await postingService.postCustomerPayment({
      tenantId: 'mak-tours',
      paymentId: 'PAY-1001',
      amount: 5000,
      date: '2026-11-10',
      paymentMethod: 'UPI',
      customerName: 'Senthil Kumar',
      bookingRef: 'BK-001'
    });
    assert.equal(jv1.totalDebit, 5000);
    assert.equal(jv1.totalCredit, 5000);
    assert.equal(jv1.lines[0].accountCode, '1030'); // UPI
    assert.equal(jv1.lines[1].accountCode, '1050'); // Accounts Receivable

    // 2. Expense Payment (Fuel)
    const jv2 = await postingService.postExpensePayment({
      tenantId: 'mak-tours',
      expenseId: 'EXP-2001',
      amount: 2500,
      date: '2026-11-11',
      category: 'Fuel',
      paymentMode: 'Cash',
      driverName: 'Arun Kumar'
    });
    assert.equal(jv2.totalDebit, 2500);
    assert.equal(jv2.totalCredit, 2500);
    assert.equal(jv2.lines[0].accountCode, '5010'); // Fuel Expense
    assert.equal(jv2.lines[1].accountCode, '1010'); // Cash

    // 3. Vendor Payment
    const jv3 = await postingService.postVendorPayment({
      tenantId: 'mak-tours',
      paymentId: 'VPAY-3001',
      amount: 15000,
      date: '2026-11-12',
      vendorId: 'VND-001',
      vendorName: 'Apex Fleet Solutions',
      paymentMethod: 'NEFT'
    });
    assert.equal(jv3.totalDebit, 15000);
    assert.equal(jv3.totalCredit, 15000);
    assert.equal(jv3.lines[0].accountCode, '2020'); // Vendor Payables
    assert.equal(jv3.lines[1].accountCode, '1020'); // Bank Account

    // 4. Driver Settlement
    const jv4 = await postingService.postDriverSettlement({
      tenantId: 'mak-tours',
      settlementId: 'SETTLE-4001',
      amount: 4500,
      date: '2026-11-12',
      driverId: 'DRV-001',
      driverName: 'Arun Kumar',
      paymentMethod: 'Cash'
    });
    assert.equal(jv4.totalDebit, 4500);
    assert.equal(jv4.totalCredit, 4500);
    assert.equal(jv4.lines[0].accountCode, '2030'); // Driver Settlement Payables
    assert.equal(jv4.lines[1].accountCode, '1010'); // Cash

    // 5. Salary Payment
    const jv5 = await postingService.postSalaryPayment({
      tenantId: 'mak-tours',
      paymentCode: 'SAL-5001',
      amount: 35000,
      date: '2026-11-05',
      employeeId: 'EMP-001',
      employeeName: 'Rajesh Sharma',
      month: '2026-10'
    });
    assert.equal(jv5.totalDebit, 35000);
    assert.equal(jv5.totalCredit, 35000);
    assert.equal(jv5.lines[0].accountCode, '2040'); // Salary Payable
    assert.equal(jv5.lines[1].accountCode, '1020'); // Bank

    // 6. Invoice with GST
    const jv6 = await postingService.postInvoice({
      tenantId: 'mak-tours',
      invoiceNumber: 'INV-6001',
      subtotal: 10000,
      taxAmount: 500, // 5% GST
      totalAmount: 10500,
      date: '2026-11-08',
      customerName: 'Infosys Corp',
      bookingRef: 'BK-002'
    });
    assert.equal(jv6.totalDebit, 10500);
    assert.equal(jv6.totalCredit, 10500);
    assert.equal(jv6.lines[0].accountCode, '1050'); // AR = 10,500
    assert.equal(jv6.lines[1].accountCode, '4010'); // Revenue = 10,000
    assert.equal(jv6.lines[2].accountCode, '2080'); // GST Output = 500

    // 7. Credit Note
    const jv7 = await postingService.postCreditNote({
      tenantId: 'mak-tours',
      creditNoteNumber: 'CN-7001',
      subtotal: 2000,
      taxAmount: 100,
      totalAmount: 2100,
      date: '2026-11-09',
      customerName: 'Infosys Corp',
      reason: 'Trip hours rebate'
    });
    assert.equal(jv7.totalDebit, 2100);
    assert.equal(jv7.totalCredit, 2100);
  });

  test('2.4: Double-posting prevention: same transaction cannot post twice (unique compound index)', async () => {
    await JournalEntry.createIndexes();
    await seedChartOfAccounts('mak-tours');

    // First post
    await postingService.postCustomerPayment({
      tenantId: 'mak-tours',
      paymentId: 'PAY-UNIQUE-101',
      amount: 3000,
      date: '2026-11-10',
      paymentMethod: 'Bank'
    });

    // Second post with exact same paymentId must be rejected
    await assert.rejects(
      async () => {
        await postingService.postCustomerPayment({
          tenantId: 'mak-tours',
          paymentId: 'PAY-UNIQUE-101',
          amount: 3000,
          date: '2026-11-10',
          paymentMethod: 'Bank'
        });
      },
      /E11000 duplicate key/i,
      'Double posting of same transaction must be rejected by unique compound index'
    );
  });

  test('2.5: Immutability and Reversal: Posted entries cannot be mutated, only reversed via opposite entry', async () => {
    await seedChartOfAccounts('mak-tours');

    const entry = await postingService.postCustomerPayment({
      tenantId: 'mak-tours',
      paymentId: 'PAY-REV-01',
      amount: 4000,
      date: '2026-11-10',
      paymentMethod: 'Cash'
    });

    // Attempting to mutate lines on saved entry throws error
    entry.lines[0].debit = 9999;
    await assert.rejects(
      async () => {
        await entry.save();
      },
      /Immutable ledger error/i
    );

    // Legitimate reversal creates inverse entry and marks original as reversed
    const { original, reversal } = await postingService.reverseJournalEntry(
      'mak-tours',
      entry.entryNo,
      'Customer cheque bounced'
    );

    assert.equal(original.status, 'reversed');
    assert.equal(original.reversedBy, reversal.entryNo);
    assert.equal(reversal.sourceType, 'reversal');
    assert.equal(reversal.totalDebit, 4000);
    assert.equal(reversal.totalCredit, 4000);
    // In reversal, line 0 credit should be 4000 (undoing line 0 debit of 4000)
    assert.equal(reversal.lines[0].credit, 4000);
    assert.equal(reversal.lines[1].debit, 4000);
  });

  test('2.6: Trial Balance: Net Debit equals Net Credit and difference equals zero', async () => {
    await seedChartOfAccounts('mak-tours');

    // Create a series of business transactions
    await postingService.postInvoice({
      tenantId: 'mak-tours',
      invoiceNumber: 'INV-TB-01',
      subtotal: 20000,
      taxAmount: 1000,
      totalAmount: 21000,
      date: '2026-11-01'
    });

    await postingService.postCustomerPayment({
      tenantId: 'mak-tours',
      paymentId: 'PAY-TB-01',
      amount: 21000,
      date: '2026-11-02',
      paymentMethod: 'Bank'
    });

    await postingService.postExpensePayment({
      tenantId: 'mak-tours',
      expenseId: 'EXP-TB-01',
      amount: 5000,
      date: '2026-11-03',
      category: 'Fuel',
      paymentMode: 'Cash'
    });

    // Login as Accountant
    const user = await User.create({
      fullName: 'Accountant User',
      email: 'tb.accountant@maktours.com',
      password: 'HashPassword123',
      role: 'accountant',
      portal: 'accountant',
      tenantId: 'mak-tours',
      status: 'Active'
    });
    const token = signToken({ id: user._id.toString(), email: user.email, role: user.role, tenantId: user.tenantId });

    const res = await fetch(`${baseUrl}/api/accounting/reports/trial-balance`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.status, 'success');
    assert.equal(body.isBalanced, true);
    assert.equal(body.difference, 0, 'Trial balance must be completely balanced with zero difference');
    assert.ok(body.totalDebit > 0);
    assert.equal(body.totalDebit, body.totalCredit);
  });

  test('2.7: Balance Sheet: Assets equal Liabilities + Equity (Accounting Equation Verification)', async () => {
    await seedChartOfAccounts('mak-tours');

    // 1. Initial Owner Capital: Debit Bank 100,000, Credit Owner Capital 100,000
    const bankAcc = await Account.findOne({ tenantId: 'mak-tours', code: '1020' });
    const capAcc = await Account.findOne({ tenantId: 'mak-tours', code: '3010' });

    const entryNo = await sequenceService.getNextJournalNo('mak-tours');
    await JournalEntry.create({
      tenantId: 'mak-tours',
      entryNo,
      date: '2026-11-01',
      narration: 'Initial promoter capital contribution',
      lines: [
        { account: bankAcc._id, accountCode: bankAcc.code, accountName: bankAcc.name, debit: 100000, credit: 0 },
        { account: capAcc._id, accountCode: capAcc.code, accountName: capAcc.name, debit: 0, credit: 100000 }
      ],
      totalDebit: 100000,
      totalCredit: 100000,
      sourceType: 'manual_journal',
      sourceId: entryNo,
      status: 'posted'
    });

    // 2. Sales: Invoice 50,000
    await postingService.postInvoice({
      tenantId: 'mak-tours',
      invoiceNumber: 'INV-BS-01',
      subtotal: 50000,
      taxAmount: 0,
      totalAmount: 50000,
      date: '2026-11-05'
    });

    // 3. Operating Expense: Fuel 10,000
    await postingService.postExpensePayment({
      tenantId: 'mak-tours',
      expenseId: 'EXP-BS-01',
      amount: 10000,
      date: '2026-11-06',
      category: 'Fuel',
      paymentMode: 'Bank'
    });

    const user = await User.create({
      fullName: 'Accountant User',
      email: 'bs.accountant@maktours.com',
      password: 'HashPassword123',
      role: 'accountant',
      portal: 'accountant',
      tenantId: 'mak-tours',
      status: 'Active'
    });
    const token = signToken({ id: user._id.toString(), email: user.email, role: user.role, tenantId: user.tenantId });

    const res = await fetch(`${baseUrl}/api/accounting/reports/balance-sheet?asOfDate=2026-11-30`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.status, 'success');
    assert.equal(body.isBalanced, true, 'Balance sheet must balance: Assets = Liabilities + Equity');
    assert.equal(body.difference, 0);

    // Assets: Bank (100,000 - 10,000 = 90,000) + AR (50,000) = 140,000
    // Liabilities: 0
    // Equity: Capital (100,000) + Net Profit (50,000 revenue - 10,000 fuel = 40,000) = 140,000
    assert.equal(body.assets.total, 140000);
    assert.equal(body.totalLiabilitiesAndEquity, 140000);
  });

  test('2.8: General Ledger: calculates accurate running balance for given account', async () => {
    await seedChartOfAccounts('mak-tours');

    // Make 2 payments into Bank (1020) and 1 payout
    await postingService.postCustomerPayment({
      tenantId: 'mak-tours',
      paymentId: 'GL-PAY-1',
      amount: 8000,
      date: '2026-11-01',
      paymentMethod: 'Bank'
    });

    await postingService.postCustomerPayment({
      tenantId: 'mak-tours',
      paymentId: 'GL-PAY-2',
      amount: 12000,
      date: '2026-11-02',
      paymentMethod: 'Bank'
    });

    await postingService.postVendorPayment({
      tenantId: 'mak-tours',
      paymentId: 'GL-VPAY-1',
      amount: 5000,
      date: '2026-11-03',
      vendorId: 'V1',
      paymentMethod: 'Bank'
    });

    const user = await User.create({
      fullName: 'Accountant User',
      email: 'gl.accountant@maktours.com',
      password: 'HashPassword123',
      role: 'accountant',
      portal: 'accountant',
      tenantId: 'mak-tours',
      status: 'Active'
    });
    const token = signToken({ id: user._id.toString(), email: user.email, role: user.role, tenantId: user.tenantId });

    const res = await fetch(`${baseUrl}/api/accounting/reports/general-ledger?accountCode=1020&startDate=2026-11-01&endDate=2026-11-30`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.status, 'success');
    assert.equal(body.account.code, '1020');
    assert.equal(body.transactions.length, 3);
    // Net running balance: +8000, +12000, -5000 = 15,000
    assert.equal(body.closingBalance, 15000);
  });

});
