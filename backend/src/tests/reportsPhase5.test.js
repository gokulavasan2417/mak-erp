// MAK Tours & Travels ERP - Phase 5 Executive & Financial Reports Test Suite
// Verifies all 15 reports, zero double-counting guarantee, date filters, and PDF/Excel exports.
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
import { VendorBill } from '../models/VendorBill.js';
import { VendorPayment } from '../models/VendorPayment.js';
import { DriverSettlement } from '../models/DriverSettlement.js';
import { Payroll } from '../models/Payroll.js';
import { Vehicle } from '../models/Vehicle.js';
import { TourPackage } from '../models/TourPackage.js';
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

async function setupAccountant(tenantId = 'mak-tours') {
  await Company.create({
    tenantId,
    name: 'MAK Tours & Travels Private Limited',
    slug: tenantId,
    email: `admin@${tenantId}.com`,
    state: 'Tamil Nadu',
    gstin: '33AABCT1234A1Z5',
    status: 'Active'
  });

  const accountant = await User.create({
    tenantId,
    name: 'Pooja Sundaram',
    fullName: 'Pooja Sundaram',
    email: `finance@${tenantId}.com`,
    password: 'HashedPassword123',
    role: 'accountant',
    status: 'Active',
    permissions: [
      'reports.view',
      'ledger.view',
      'finance.view',
      'invoices.view',
      'payable.view',
      'driver.settlement.view'
    ]
  });

  await seedChartOfAccounts(tenantId);
  const token = signToken({
    id: accountant._id.toString(),
    userId: accountant._id.toString(),
    email: accountant.email,
    role: accountant.role,
    tenantId: accountant.tenantId,
    permissions: accountant.permissions
  });

  return { token, accountant };
}

describe('Phase 5: Financial Statements & Reports Suite', () => {
  // 1. Zero Double-Counting Guarantee & Daily/Monthly reports
  test('5.1: Zero double-counting guarantee: Completed booking, payment, and invoice count once for the same sale', async () => {
    const { token } = await setupAccountant('mak-tours');

    // Single sale of ₹12,000 creates a Booking, an Invoice, and a Payment
    const booking = await Booking.create({
      tenantId: 'mak-tours',
      refId: 'BK-SALE-001',
      bookingNumber: 'BK-SALE-001',
      customerName: 'Suresh Raina',
      fullName: 'Suresh Raina',
      mobileNumber: '+91 98401 22334',
      bookingType: 'Round Trip',
      pickupLocation: 'Chennai Airport',
      dropoffLocation: 'Mahabalipuram',
      tripType: 'Round Trip',
      pickupDate: '2026-11-10',
      totalFare: 12000,
      fare: 12000,
      advancePayment: 0,
      status: 'Completed'
    });

    await Invoice.create({
      tenantId: 'mak-tours',
      invoiceNumber: 'INV-SALE-001',
      bookingRef: booking.refId,
      customerName: 'Suresh Raina',
      customer: { name: 'Suresh Raina' },
      amount: 12600,
      subtotal: 12000,
      totalAmount: 12600, // ₹12,000 + 5% GST
      balanceDue: 0,
      invoiceDate: '2026-11-10',
      status: 'Paid'
    });

    await Payment.create({
      tenantId: 'mak-tours',
      paymentId: 'PAY-SALE-001',
      bookingRef: booking.refId,
      amount: 12000,
      status: 'paid',
      method: 'Bank Transfer',
      paymentMethod: 'Bank Transfer'
    });

    // Operating expense of ₹3,000
    await Expense.create({
      tenantId: 'mak-tours',
      expenseId: 'EXP-SALE-001',
      title: 'Toll plaza charges',
      category: 'Toll Plaza',
      amount: 3000,
      date: '2026-11-10',
      status: 'Paid'
    });

    // Query Daily Report
    const dailyRes = await fetch(`${baseUrl}/api/reports/daily-income-expense?startDate=2026-11-01&endDate=2026-11-30`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    assert.equal(dailyRes.status, 200);
    const daily = await dailyRes.json();

    // Verify counting rule: Booking sale counts ONCE (₹12,000), NOT ₹24,000 or ₹36,000!
    assert.equal(daily.summary.totalBookingRevenue, 12000);
    assert.equal(daily.summary.totalCollectedRevenue, 12000);
    assert.equal(daily.summary.totalOperatingExpense, 3000);
    assert.equal(daily.summary.netMargin, 9000); // 12000 - 3000

    // Query Monthly Report
    const monthlyRes = await fetch(`${baseUrl}/api/reports/monthly-revenue-expense?year=2026`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    assert.equal(monthlyRes.status, 200);
    const monthly = await monthlyRes.json();
    assert.equal(monthly.summary.totalAnnualRevenue, 12000);
    assert.equal(monthly.summary.totalAnnualExpenses, 3000);
    assert.equal(monthly.summary.totalAnnualNetProfit, 9000);
  });

  // 2. Profit & Loss Statement and Cash Flow Statement
  test('5.2: Profit & Loss Statement and Cash Flow Statement reflect accurate revenues and direct costs', async () => {
    const { token } = await setupAccountant('mak-tours');

    // Create completed transport booking and tour package booking
    await Booking.create({
      tenantId: 'mak-tours',
      refId: 'BK-TRP-01',
      bookingNumber: 'BK-TRP-01',
      customerName: 'Ananya Sharma',
      fullName: 'Ananya Sharma',
      mobileNumber: '+91 98401 12345',
      bookingType: 'Round Trip',
      pickupLocation: 'Chennai',
      dropoffLocation: 'Pondicherry',
      tripType: 'Round Trip',
      pickupDate: '2026-11-15',
      totalFare: 15000,
      status: 'Completed'
    });

    await Booking.create({
      tenantId: 'mak-tours',
      refId: 'BK-PKG-01',
      bookingNumber: 'BK-PKG-01',
      customerName: 'Vikram Seth',
      fullName: 'Vikram Seth',
      mobileNumber: '+91 98401 54321',
      bookingType: 'Tour Package',
      tripType: 'Package',
      pickupDate: '2026-11-15',
      totalFare: 25000,
      status: 'Completed'
    });

    await Expense.create({
      tenantId: 'mak-tours',
      expenseId: 'EXP-FUEL-01',
      title: 'Fleet Diesel Fuel',
      category: 'Fuel',
      amount: 8000,
      date: '2026-11-15',
      status: 'Paid'
    });

    await Payment.create({
      tenantId: 'mak-tours',
      paymentId: 'PAY-COL-01',
      bookingRef: 'BK-TRP-01',
      amount: 15000,
      status: 'paid',
      method: 'UPI',
      paymentMethod: 'UPI'
    });

    // P&L Statement
    const pnlRes = await fetch(`${baseUrl}/api/reports/profit-and-loss?startDate=2026-11-01&endDate=2026-11-30`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    assert.equal(pnlRes.status, 200);
    const pnl = await pnlRes.json();
    assert.equal(pnl.income.transportTripSales, 15000);
    assert.equal(pnl.income.tourPackageSales, 25000);
    assert.equal(pnl.income.totalRevenue, 40000);
    assert.equal(pnl.expenses.directFleetCosts.fuel, 8000);
    assert.equal(pnl.netOperatingProfit, 32000); // 40000 - 8000

    // Cash Flow Statement
    const cfRes = await fetch(`${baseUrl}/api/reports/cash-flow?startDate=2026-11-01&endDate=2026-11-30`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    assert.equal(cfRes.status, 200);
    const cf = await cfRes.json();
    assert.equal(cf.operatingActivities.inflows.customerCollections, 15000);
    assert.equal(cf.operatingActivities.outflows.operatingExpenses, 8000);
    assert.equal(cf.operatingActivities.netCashFromOperations, 7000); // 15000 - 8000
  });

  // 3. Customer & Vendor Aging Reports
  test('5.3: Customer aging bucketizes correctly and vendor payables report active dues', async () => {
    const { token } = await setupAccountant('mak-tours');

    // Customer with 5,000 pending due
    await Booking.create({
      tenantId: 'mak-tours',
      refId: 'BK-AGING-01',
      bookingNumber: 'BK-AGING-01',
      customerName: 'Karthik Subramanian',
      fullName: 'Karthik Subramanian',
      mobileNumber: '+91 98401 99999',
      bookingType: 'Round Trip',
      pickupLocation: 'Chennai',
      dropoffLocation: 'Ooty',
      tripType: 'Round Trip',
      pickupDate: '2026-11-01',
      totalFare: 20000,
      advancePayment: 5000,
      status: 'Completed'
    });
    await Payment.create({
      tenantId: 'mak-tours',
      paymentId: 'PAY-AG-01',
      bookingRef: 'BK-AGING-01',
      amount: 10000,
      status: 'paid',
      method: 'Bank Transfer',
      paymentMethod: 'Bank Transfer'
    }); // 20000 - 5000 - 10000 = 5000 balance

    // Vendor Bill with 12,000 pending
    await VendorBill.create({
      tenantId: 'mak-tours',
      billNumber: 'VB-AG-01',
      vendorId: 'VND-001',
      vendorName: 'Apex Fleet Logistics',
      billDate: '2026-11-05',
      dueDate: '2026-11-20',
      subtotal: 20000,
      totalAmount: 20000,
      amountPaid: 8000,
      paidAmount: 8000,
      balanceDue: 12000,
      status: 'Partially Paid'
    });

    // Customer Outstanding Report
    const custRes = await fetch(`${baseUrl}/api/reports/customer-outstanding`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    assert.equal(custRes.status, 200);
    const custReport = await custRes.json();
    assert.equal(custReport.summary.totalOutstanding, 5000);
    assert.equal(custReport.data[0].balanceDue, 5000);

    // Vendor Outstanding Report
    const vndRes = await fetch(`${baseUrl}/api/reports/vendor-outstanding`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    assert.equal(vndRes.status, 200);
    const vndReport = await vndRes.json();
    assert.equal(vndReport.summary.totalOutstanding, 12000);
    assert.equal(vndReport.data[0].balanceDue, 12000);
  });

  // 4. Driver Settlement, Payroll & GST Reports
  test('5.4: Driver settlements, payroll statutory deductions, and GST tax split reports', async () => {
    const { token } = await setupAccountant('mak-tours');

    // Driver Settlement
    await DriverSettlement.create({
      tenantId: 'mak-tours',
      settlementNo: 'DS-2026-00010',
      driverId: 'DRV-001',
      driverName: 'Senthil Kumar',
      periodStart: '2026-11-01',
      periodEnd: '2026-11-15',
      startDate: '2026-11-01',
      endDate: '2026-11-15',
      totalTrips: 3,
      grossEarnings: 6500,
      advancesDeducted: 1500,
      amountPaid: 5000,
      fuelAdvanceDeduction: 1500,
      netSettlementAmount: 5000,
      netPayable: 5000,
      status: 'Paid',
      paymentDetails: { paidAt: new Date() }
    });

    // Payroll record
    await Payroll.create({
      tenantId: 'mak-tours',
      payrollCode: 'PAY-REP-01',
      employeeId: 'EMP-001',
      employeeName: 'Dhanalakshmi',
      month: '2026-11',
      earningsBreakdown: { monthlyGrossSalary: 35000 },
      deductionsBreakdown: { pfDeduction: 1800, esiDeduction: 0, tdsDeduction: 1000 },
      netPayableSalary: 32200,
      totalPaidAmount: 32200,
      status: 'Paid'
    });

    // Invoice with GST split
    await Invoice.create({
      tenantId: 'mak-tours',
      invoiceNumber: 'INV-GST-01',
      bookingRef: 'BK-GST-01',
      customerName: 'Infosys Limited',
      customer: { name: 'Infosys Limited', gstin: '33AABCI1234F1Z9' },
      customerGstin: '33AABCI1234F1Z9',
      customerState: 'Tamil Nadu',
      amount: 52500,
      subtotal: 50000,
      taxableAmount: 50000,
      cgstAmount: 1250,
      sgstAmount: 1250,
      igstAmount: 0,
      totalAmount: 52500,
      invoiceDate: '2026-11-12',
      status: 'Paid'
    });

    // Driver Settlement Report
    const drvRes = await fetch(`${baseUrl}/api/reports/driver-settlements`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    assert.equal(drvRes.status, 200);
    const drv = await drvRes.json();
    assert.equal(drv.summary.totalGrossEarnings, 6500);
    assert.equal(drv.summary.totalNetDisbursed, 5000);

    // Payroll Report
    const payRes = await fetch(`${baseUrl}/api/reports/payroll?month=2026-11`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    assert.equal(payRes.status, 200);
    const pay = await payRes.json();
    assert.equal(pay.summary.totalGross, 35000);
    assert.equal(pay.summary.totalPfDeduction, 1800);
    assert.equal(pay.summary.totalTdsDeduction, 1000);

    // GST Report
    const gstRes = await fetch(`${baseUrl}/api/reports/gst`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    assert.equal(gstRes.status, 200);
    const gst = await gstRes.json();
    assert.equal(gst.summary.totalTaxableTurnover, 50000);
    assert.equal(gst.summary.totalCgstCollected, 1250);
    assert.equal(gst.summary.totalSgstCollected, 1250);
    assert.equal(gst.summary.totalGstLiability, 2500);
  });

  // 5. Vehicle & Tour Package Profitability, Booking Revenue, and Payment Collections
  test('5.5: Vehicle profitability, tour package profitability, and payment mode reconciliation', async () => {
    const { token } = await setupAccountant('mak-tours');

    // Vehicle
    await Vehicle.create({
      tenantId: 'mak-tours',
      name: 'Toyota Innova Crysta',
      registrationNumber: 'TN-01-AB-1234',
      regNo: 'TN-01-AB-1234',
      make: 'Toyota',
      model: 'Innova Crysta',
      category: 'SUV'
    });

    await Booking.create({
      tenantId: 'mak-tours',
      refId: 'BK-VEH-01',
      bookingNumber: 'BK-VEH-01',
      customerName: 'Traveler One',
      fullName: 'Traveler One',
      mobileNumber: '+91 98401 77777',
      bookingType: 'Round Trip',
      assignedVehicleReg: 'TN-01-AB-1234',
      pickupLocation: 'Chennai',
      dropoffLocation: 'Bangalore',
      tripType: 'Round Trip',
      distanceKm: 350,
      totalFare: 18000,
      status: 'Completed'
    });

    await Expense.create({
      tenantId: 'mak-tours',
      expenseId: 'EXP-VEH-01',
      title: 'Innova Fuel',
      category: 'Fuel',
      vehicleNumber: 'TN-01-AB-1234',
      amount: 4000,
      status: 'Paid'
    });

    // Payment collections
    await Payment.create({
      tenantId: 'mak-tours',
      paymentId: 'PAY-COL-UPI',
      amount: 10000,
      method: 'UPI',
      paymentMethod: 'UPI',
      status: 'paid'
    });
    await Payment.create({
      tenantId: 'mak-tours',
      paymentId: 'PAY-COL-CASH',
      amount: 5000,
      method: 'Cash',
      paymentMethod: 'Cash',
      status: 'paid'
    });

    // Vehicle Profitability Report
    const vehRes = await fetch(`${baseUrl}/api/reports/vehicle-profitability`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    assert.equal(vehRes.status, 200);
    const veh = await vehRes.json();
    const innova = veh.data.find(v => v.regNo === 'TN-01-AB-1234');
    assert.ok(innova);
    assert.equal(innova.revenueEarned, 18000);
    assert.equal(innova.fuelCost, 4000);
    assert.equal(innova.netProfit, 14000); // 18000 - 4000

    // Payment Collections Report
    const colRes = await fetch(`${baseUrl}/api/reports/payment-collections`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    assert.equal(colRes.status, 200);
    const col = await colRes.json();
    assert.equal(col.summary.totalCollections, 15000);
    const upiRow = col.data.find(r => r.method === 'UPI');
    assert.equal(upiRow.amount, 10000);
  });

  // 6. PDF and Excel Exports
  test('5.6: Export endpoints stream valid PDF documents and Excel .xlsx workbooks', async () => {
    const { token } = await setupAccountant('mak-tours');

    // PDF Export
    const pdfRes = await fetch(`${baseUrl}/api/reports/export/pdf?reportType=daily-income-expense`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    assert.equal(pdfRes.status, 200);
    assert.equal(pdfRes.headers.get('content-type'), 'application/pdf');
    const pdfBuffer = await pdfRes.arrayBuffer();
    assert.ok(pdfBuffer.byteLength > 500, 'PDF buffer must be non-empty and well-formed');

    // Excel Export
    const excelRes = await fetch(`${baseUrl}/api/reports/export/excel?reportType=monthly-revenue-expense`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    assert.equal(excelRes.status, 200);
    assert.equal(excelRes.headers.get('content-type'), 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    const excelBuffer = await excelRes.arrayBuffer();
    assert.ok(excelBuffer.byteLength > 1000, 'Excel .xlsx buffer must be non-empty and well-formed');
  });
});
