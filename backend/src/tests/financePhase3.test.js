// MAK Tours & Travels ERP - Phase 3 Finance, Payments, Expenses & Invoices Test Suite
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
import { Notification } from '../models/Notification.js';
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

describe('Phase 3: Income, Expenses, Receivable, Invoices Suite', () => {

  // Helper to create authenticated accountant session
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
      fullName: 'Radha Ramanathan',
      name: 'Radha Ramanathan',
      email: `accountant@${tenantId}.com`,
      password: 'SecurePassword123!',
      role: 'accountant',
      tenantId
    });

    await seedChartOfAccounts(tenantId);
    const token = signToken({ id: user._id.toString(), email: user.email, role: user.role, tenantId });
    return { user, token };
  }

  test('3.1: Overpayment guard rejects payment > outstanding without explicit flag, allows with flag', async () => {
    const { token } = await setupAccountant('mak-tours');

    // Create a booking with Total Fare = 10,000, Advance Paid = 6,000 (Outstanding = 4,000)
    await Booking.create({
      tenantId: 'mak-tours',
      refId: 'BK-OP-101',
      bookingNumber: 'BK-OP-101',
      fullName: 'Vikram Seth',
      bookingType: 'Round Trip',
      mobileNumber: '+91 98401 11111',
      travelDate: '2026-11-20',
      pricing: 10000,
      totalFare: 10000,
      advancePaid: 6000,
      balanceDue: 4000
    });

    // 1. Attempting to pay 5,000 (exceeds outstanding 4,000) without flag must be REJECTED with 400
    const rejectRes = await fetch(`${baseUrl}/api/finance/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        bookingRef: 'BK-OP-101',
        amount: 5000,
        paymentMethod: 'Bank Transfer'
      })
    });

    assert.equal(rejectRes.status, 400);
    const rejectBody = await rejectRes.json();
    assert.equal(rejectBody.code, 'OVERPAYMENT_REJECTED');
    assert.equal(rejectBody.outstanding, 4000);
    assert.equal(rejectBody.requested, 5000);

    // 2. Paying 5,000 with allowOverpayment = true must SUCCEED with 201
    const allowRes = await fetch(`${baseUrl}/api/finance/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        bookingRef: 'BK-OP-101',
        amount: 5000,
        allowOverpayment: true,
        paymentMethod: 'Bank Transfer'
      })
    });

    assert.equal(allowRes.status, 201);
    const allowBody = await allowRes.json();
    assert.equal(allowBody.status, 'success');
    assert.equal(allowBody.data.amount, 5000);
    assert.ok(allowBody.data.receiptNumber.startsWith('REC-'));
  });

  test('3.2: Payment idempotency key blocks duplicate payments and returns existing record', async () => {
    const { token } = await setupAccountant('mak-tours');

    const paymentPayload = {
      idempotencyKey: 'IDEM-KEY-TEST-99',
      amount: 7500,
      paymentMethod: 'UPI',
      customerEmail: 'guest@example.com'
    };

    // First call: Creates payment
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
    const createdId = body1.data.paymentId;
    assert.ok(createdId);

    // Second call: Exact same idempotencyKey must return existing payment with 200 OK
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
    assert.equal(body2.status, 'success');
    assert.equal(body2.message.includes('idempotent'), true);
    assert.equal(body2.data.paymentId, createdId);

    // Database check: Only 1 record exists
    const count = await Payment.countDocuments({ tenantId: 'mak-tours', idempotencyKey: 'IDEM-KEY-TEST-99' });
    assert.equal(count, 1, 'Idempotency key prevents duplicate database insertion');
  });

  test('3.3: Expense editing and approval workflow; paid expenses are immutable and posted to ledger', async () => {
    const { token } = await setupAccountant('mak-tours');

    // 1. Create expense in Pending status
    const createRes = await fetch(`${baseUrl}/api/finance/expenses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        category: 'Office',
        amount: 3500,
        notes: 'Office stationery and internet bill',
        date: '2026-11-05'
      })
    });

    assert.equal(createRes.status, 201);
    const createdExp = (await createRes.json()).data;
    assert.equal(createdExp.status, 'Pending');
    assert.equal(createdExp.category, 'Office');

    // 2. Edit expense endpoint (PUT /api/finance/expenses/:id)
    const editRes = await fetch(`${baseUrl}/api/finance/expenses/${createdExp.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        category: 'Maintenance',
        amount: 4000,
        notes: 'Annual office maintenance and repairs'
      })
    });

    assert.equal(editRes.status, 200);
    const editedExp = (await editRes.json()).data;
    assert.equal(editedExp.category, 'Maintenance');
    assert.equal(editedExp.amount, 4000);

    // 3. Approve expense
    const approveRes = await fetch(`${baseUrl}/api/finance/expenses/${createdExp.id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ status: 'Approved' })
    });

    assert.equal(approveRes.status, 200);
    const approvedExp = (await approveRes.json()).data;
    assert.equal(approvedExp.status, 'Approved');
    assert.ok(approvedExp.approvedBy);

    // 4. Mark as Paid (triggers double-entry ledger posting)
    const payRes = await fetch(`${baseUrl}/api/finance/expenses/${createdExp.id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ status: 'Paid' })
    });

    assert.equal(payRes.status, 200);
    const paidExp = (await payRes.json()).data;
    assert.equal(paidExp.status, 'Paid');
    assert.ok(paidExp.journalEntryNo, 'Paid expense must generate a ledger journal entry number');

    // 5. Attempting to edit a Paid expense must be REJECTED with 400 (Immutable ledger)
    const forbiddenEditRes = await fetch(`${baseUrl}/api/finance/expenses/${createdExp.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ amount: 9999 })
    });

    assert.equal(forbiddenEditRes.status, 400);
    const forbiddenBody = await forbiddenEditRes.json();
    assert.equal(forbiddenBody.code, 'PAID_EXPENSE_IMMUTABLE');
  });

  test('3.4: Tax Math: Intra-state calculates CGST+SGST; Inter-state calculates IGST', async () => {
    const { token } = await setupAccountant('mak-tours');

    // 1. Intra-State Invoice: Company state = Tamil Nadu, Customer state = Tamil Nadu
    // Subtotal: 20,000, Discount: 2,000, Additional Charges: 1,000 => Taxable: 19,000. GST: 5%
    const intraRes = await fetch(`${baseUrl}/api/finance/invoices`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        customerName: 'Karthik Raja',
        customerState: 'Tamil Nadu',
        subtotal: 20000,
        discount: 2000,
        additionalCharges: [{ reason: 'Airport Toll Charge', amount: 1000 }],
        gstRate: 5
      })
    });

    assert.equal(intraRes.status, 201);
    const intraInv = (await intraRes.json()).data;
    assert.equal(intraInv.gstType, 'CGST_SGST');
    assert.equal(intraInv.cgstRate, 2.5);
    assert.equal(intraInv.cgstAmount, 475);
    assert.equal(intraInv.sgstRate, 2.5);
    assert.equal(intraInv.sgstAmount, 475);
    assert.equal(intraInv.igstAmount, 0);
    assert.equal(intraInv.taxAmount, 950);
    assert.equal(intraInv.amount, 19950);

    // 2. Inter-State Invoice: Company state = Tamil Nadu, Customer state = Karnataka
    // Subtotal: 10,000, GST: 18% => Taxable: 10,000. IGST: 1,800. Total: 11,800
    const interRes = await fetch(`${baseUrl}/api/finance/invoices`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        customerName: 'Deepa Rao',
        customerState: 'Karnataka',
        subtotal: 10000,
        gstRate: 18
      })
    });

    assert.equal(interRes.status, 201);
    const interInv = (await interRes.json()).data;
    assert.equal(interInv.gstType, 'IGST');
    assert.equal(interInv.igstRate, 18);
    assert.equal(interInv.igstAmount, 1800);
    assert.equal(interInv.cgstAmount, 0);
    assert.equal(interInv.sgstAmount, 0);
    assert.equal(interInv.taxAmount, 1800);
    assert.equal(interInv.amount, 11800);
  });

  test('3.5: Invoice cancellation with audit trail and credit note issuance', async () => {
    const { token } = await setupAccountant('mak-tours');

    // Create an invoice
    const invRes = await fetch(`${baseUrl}/api/finance/invoices`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        customerName: 'Meenakshi Sundaram',
        amount: 15000,
        subtotal: 15000
      })
    });

    const inv = (await invRes.json()).data;

    // 1. Issue Credit Note for 3,000
    const cnRes = await fetch(`${baseUrl}/api/finance/invoices/${inv.invoiceNumber}/credit-note`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        amount: 3000,
        reason: 'Client requested vehicle category downgrade rebate'
      })
    });

    assert.equal(cnRes.status, 201);
    const cnBody = await cnRes.json();
    assert.ok(cnBody.creditNoteNumber.startsWith('CN-'));
    assert.equal(cnBody.data.balanceDue, 12000);
    assert.equal(cnBody.data.creditNotes.length, 1);

    // 2. Cancel invoice with audit trail
    const cancelRes = await fetch(`${baseUrl}/api/finance/invoices/${inv.invoiceNumber}/cancel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        reason: 'Customer cancelled travel due to medical emergency'
      })
    });

    assert.equal(cancelRes.status, 200);
    const cancelledInv = (await cancelRes.json()).data;
    assert.equal(cancelledInv.status, 'Cancelled');
    assert.equal(cancelledInv.cancellationReason, 'Customer cancelled travel due to medical emergency');
    assert.ok(cancelledInv.cancelledAt);
    assert.ok(cancelledInv.cancelledBy);

    // 3. Second cancellation attempt must be rejected with 400
    const dupCancelRes = await fetch(`${baseUrl}/api/finance/invoices/${inv.invoiceNumber}/cancel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ reason: 'Duplicate' })
    });
    assert.equal(dupCancelRes.status, 400);
  });

  test('3.6: Customer ledger, overdue list and in-app payment reminders', async () => {
    const { token } = await setupAccountant('mak-tours');

    // Create a booking with travel date in the past (overdue)
    await Booking.create({
      tenantId: 'mak-tours',
      refId: 'BK-LEDGER-01',
      bookingNumber: 'BK-LEDGER-01',
      fullName: 'Siddharth Roy',
      bookingType: 'Round Trip',
      mobileNumber: '+91 98401 55555',
      pricing: 12000,
      totalFare: 12000,
      advancePaid: 4000,
      balanceDue: 8000,
      travelDate: '2026-10-15', // Past date
      status: 'Confirmed'
    });

    // 1. Customer Ledger
    const ledgerRes = await fetch(`${baseUrl}/api/finance/receivable/customer-ledger?bookingRef=BK-LEDGER-01`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    assert.equal(ledgerRes.status, 200);
    const ledgerBody = await ledgerRes.json();
    assert.equal(ledgerBody.status, 'success');
    assert.equal(ledgerBody.summary.totalBilled, 12000);
    assert.ok(ledgerBody.transactions.length >= 1);

    // 2. Overdue Receivable List
    const overdueRes = await fetch(`${baseUrl}/api/finance/receivable/overdue`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    assert.equal(overdueRes.status, 200);
    const overdueBody = await overdueRes.json();
    assert.ok(overdueBody.data.length >= 1);
    assert.equal(overdueBody.data[0].bookingRef, 'BK-LEDGER-01');
    assert.equal(overdueBody.data[0].overdueBalance, 8000);

    // 3. Send Payment Reminder (In-App Notification)
    const reminderRes = await fetch(`${baseUrl}/api/finance/receivable/reminders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        bookingRef: 'BK-LEDGER-01',
        customerName: 'Siddharth Roy',
        customerPhone: '+91 98401 55555',
        amount: 8000,
        notes: 'Followed up via phone call'
      })
    });

    assert.equal(reminderRes.status, 201);
    const reminderBody = await reminderRes.json();
    assert.equal(reminderBody.status, 'success');

    const notifFromDb = await Notification.findOne({ tenantId: 'mak-tours', bookingId: 'BK-LEDGER-01' });
    assert.notEqual(notifFromDb, null, 'Payment reminder must be saved to notifications collection');
    assert.equal(notifFromDb.portal, 'accountant');
  });

  test('3.7: Invoice PDF download streams valid PDF document', async () => {
    const { token } = await setupAccountant('mak-tours');

    // Create an invoice
    const inv = await Invoice.create({
      tenantId: 'mak-tours',
      invoiceNumber: 'INV-PDF-TEST-01',
      bookingRef: 'BK-PDF-01',
      customer: {
        name: 'Lakshmi Narayanan',
        phone: '+91 98401 77777',
        email: 'lakshmi@example.com'
      },
      subtotal: 8000,
      taxAmount: 400,
      amount: 8400,
      amountPaid: 2000,
      balanceDue: 6400,
      status: 'Partially Paid',
      invoiceDate: '2026-11-12'
    });

    const res = await fetch(`${baseUrl}/api/finance/invoices/${inv.invoiceNumber}/pdf`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    assert.equal(res.status, 200);
    assert.equal(res.headers.get('content-type'), 'application/pdf');

    const buffer = Buffer.from(await res.arrayBuffer());
    assert.ok(buffer.length > 500, 'PDF buffer must not be empty');
    assert.equal(buffer.toString('utf8', 0, 4), '%PDF', 'PDF buffer must begin with %PDF header');
  });
});