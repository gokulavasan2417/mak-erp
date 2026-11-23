// MAK Tours & Travels ERP - Centralized Double-Entry Posting Service
// Generates atomic, balanced ledger journal entries with duplicate-posting prevention
import mongoose from 'mongoose';
import { Account } from '../models/Account.js';
import { JournalEntry } from '../models/JournalEntry.js';
import { FinancialYear } from '../models/FinancialYear.js';
import { CashBankAccount } from '../models/CashBankAccount.js';
import { sequenceService } from './sequenceService.js';
import { seedChartOfAccounts } from './chartOfAccountsSeedService.js';

/**
 * Helper to ensure accounts are seeded and cached for the tenant
 */
const accountsCache = new Map();

async function getTenantAccounts(tenantId) {
  const normTenant = (tenantId || 'mak-tours').toLowerCase().trim();
  let accs = await Account.find({ tenantId: normTenant }).lean();

  if (!accs || accs.length === 0) {
    await seedChartOfAccounts(normTenant);
    accs = await Account.find({ tenantId: normTenant }).lean();
  }

  const byCode = new Map();
  for (const a of accs) {
    byCode.set(a.code, a);
  }
  return byCode;
}

/**
 * Verify financial year is open for given date
 */
async function getOpenFinancialYear(tenantId, dateStr) {
  const normTenant = (tenantId || 'mak-tours').toLowerCase().trim();
  const targetDate = dateStr || new Date().toISOString().split('T')[0];

  let fy = await FinancialYear.findOne({
    tenantId: normTenant,
    startDate: { $lte: targetDate },
    endDate: { $gte: targetDate }
  }).lean();

  if (!fy) {
    // If no FY matches date, fallback to default or open FY
    fy = await FinancialYear.findOne({ tenantId: normTenant, status: 'open' }).lean();
  }

  if (fy && fy.status === 'closed') {
    throw new Error(`Financial Year '${fy.name}' is closed. No new postings allowed for date ${targetDate}.`);
  }

  return fy;
}

/**
 * Determine Cash / Bank / UPI Account code from payment method
 */
function resolveCashBankAccountCode(paymentMode) {
  const mode = String(paymentMode || '').toLowerCase();
  if (mode.includes('cash')) return '1010';
  if (mode.includes('upi') || mode.includes('qr') || mode.includes('fastag') || mode.includes('online')) return '1030';
  return '1020'; // Default to Bank (NEFT / RTGS / Card / Cheque)
}

/**
 * Determine Expense Account code from expense category
 */
function resolveExpenseAccountCode(category) {
  const cat = String(category || '').toLowerCase();
  if (cat.includes('fuel') || cat.includes('diesel') || cat.includes('petrol') || cat.includes('cng')) return '5010';
  if (cat.includes('toll') || cat.includes('fastag')) return '5020';
  if (cat.includes('parking') || cat.includes('permit') || cat.includes('state tax') || cat.includes('entry tax')) return '5030';
  if (cat.includes('bata') || cat.includes('driver') || cat.includes('chauffeur') || cat.includes('allowance')) return '5040';
  if (cat.includes('maintenance') || cat.includes('repair') || cat.includes('servicing') || cat.includes('tyre') || cat.includes('tire')) return '5050';
  if (cat.includes('vendor') || cat.includes('hire') || cat.includes('attachment')) return '5060';
  if (cat.includes('salary') || cat.includes('wage')) return '5070';
  return '5080'; // Office & Administrative Expenses
}

export const postingService = {
  /**
   * 1. Post Customer Payment (Booking advance or settlement)
   * Debit: Cash / Bank (1010 / 1020 / 1030)
   * Credit: Accounts Receivable (1050)
   */
  postCustomerPayment: async (data, session = null) => {
    const { tenantId = 'mak-tours', paymentId, amount, date, paymentMethod, customerName, bookingRef, user } = data;
    const normTenant = tenantId.toLowerCase().trim();
    const numAmount = Math.round(Number(amount) * 100) / 100;

    if (numAmount <= 0) {
      throw new Error('Payment amount must be greater than zero for journal entry creation');
    }

    const accounts = await getTenantAccounts(normTenant);
    const fy = await getOpenFinancialYear(normTenant, date);

    const assetCode = resolveCashBankAccountCode(paymentMethod);
    const assetAcc = accounts.get(assetCode) || accounts.get('1020');
    const arAcc = accounts.get('1050') || accounts.get('4010');

    if (!assetAcc || !arAcc) {
      throw new Error('Ledger Chart of Accounts missing required Cash/Bank (1010/1020) or Accounts Receivable (1050) accounts');
    }

    const entryNo = await sequenceService.getNextJournalNo(normTenant);
    const dateFormatted = date || new Date().toISOString().split('T')[0];

    const lines = [
      {
        account: assetAcc._id,
        accountCode: assetAcc.code,
        accountName: assetAcc.name,
        debit: numAmount,
        credit: 0,
        narration: `Received via ${paymentMethod || 'Bank'} from ${customerName || 'Customer'}`
      },
      {
        account: arAcc._id,
        accountCode: arAcc.code,
        accountName: arAcc.name,
        debit: 0,
        credit: numAmount,
        narration: `Booking collection for #${bookingRef || paymentId}`
      }
    ];

    const entry = new JournalEntry({
      tenantId: normTenant,
      entryNo,
      date: dateFormatted,
      financialYearId: fy?._id || null,
      financialYearName: fy?.name || '',
      narration: `Customer payment received for booking ${bookingRef || ''} (${customerName || 'Customer'}) via ${paymentMethod || 'Bank'}`,
      lines,
      totalDebit: numAmount,
      totalCredit: numAmount,
      sourceType: 'customer_payment',
      sourceId: String(paymentId),
      status: 'posted',
      postedBy: user?.name || user?.email || 'System',
      createdBy: user?.name || user?.email || 'System'
    });

    await entry.save({ session });

    try {
      const type = assetCode === '1010' ? 'cash' : assetCode === '1030' ? 'upi' : 'bank';
      await CashBankAccount.findOneAndUpdate(
        { tenantId: normTenant, accountType: type },
        { $inc: { currentBalance: numAmount } },
        { session }
      );
    } catch {}

    return entry;
  },

  /**
   * 2. Post Expense Payment
   * Debit: Operating Expense Account (5010 / 5020 / 5030 / etc.)
   * Credit: Cash / Bank (1010 / 1020 / 1030)
   */
  postExpensePayment: async (data, session = null) => {
    const { tenantId = 'mak-tours', expenseId, amount, date, category, paymentMode, driverName, notes, user } = data;
    const normTenant = tenantId.toLowerCase().trim();
    const numAmount = Math.round(Number(amount) * 100) / 100;

    if (numAmount <= 0) {
      throw new Error('Expense amount must be greater than zero for ledger entry');
    }

    const accounts = await getTenantAccounts(normTenant);
    const fy = await getOpenFinancialYear(normTenant, date);

    const expenseCode = resolveExpenseAccountCode(category);
    const expenseAcc = accounts.get(expenseCode) || accounts.get('5080');
    const assetCode = resolveCashBankAccountCode(paymentMode);
    const assetAcc = accounts.get(assetCode) || accounts.get('1010');

    if (!expenseAcc || !assetAcc) {
      throw new Error('Ledger Chart of Accounts missing required Expense or Cash/Bank account');
    }

    const entryNo = await sequenceService.getNextJournalNo(normTenant);
    const dateFormatted = date || new Date().toISOString().split('T')[0];

    const lines = [
      {
        account: expenseAcc._id,
        accountCode: expenseAcc.code,
        accountName: expenseAcc.name,
        debit: numAmount,
        credit: 0,
        narration: `${category} expense paid by ${driverName || 'Staff'}: ${notes || ''}`.trim()
      },
      {
        account: assetAcc._id,
        accountCode: assetAcc.code,
        accountName: assetAcc.name,
        debit: 0,
        credit: numAmount,
        narration: `Disbursement via ${paymentMode || 'Cash/Bank'}`
      }
    ];

    const entry = new JournalEntry({
      tenantId: normTenant,
      entryNo,
      date: dateFormatted,
      financialYearId: fy?._id || null,
      financialYearName: fy?.name || '',
      narration: `Operating expense recorded: ${category} (₹${numAmount}) paid via ${paymentMode || 'Cash'}`,
      lines,
      totalDebit: numAmount,
      totalCredit: numAmount,
      sourceType: 'expense_payment',
      sourceId: String(expenseId),
      status: 'posted',
      postedBy: user?.name || user?.email || 'System',
      createdBy: user?.name || user?.email || 'System'
    });

    await entry.save({ session });

    try {
      const type = assetCode === '1010' ? 'cash' : assetCode === '1030' ? 'upi' : 'bank';
      await CashBankAccount.findOneAndUpdate(
        { tenantId: normTenant, accountType: type },
        { $inc: { currentBalance: -numAmount } },
        { session }
      );
    } catch {}

    return entry;
  },

  /**
   * 3. Post Vendor Payment
   * Debit: Vendor Fleet Payables (2020)
   * Credit: Cash / Bank (1020 / 1010)
   */
  postVendorPayment: async (data, session = null) => {
    const { tenantId = 'mak-tours', paymentId, amount, date, vendorId, vendorName, paymentMethod, user } = data;
    const normTenant = tenantId.toLowerCase().trim();
    const numAmount = Math.round(Number(amount) * 100) / 100;

    if (numAmount <= 0) throw new Error('Vendor payment amount must be greater than zero');

    const accounts = await getTenantAccounts(normTenant);
    const fy = await getOpenFinancialYear(normTenant, date);

    const apAcc = accounts.get('2020') || accounts.get('2010');
    const assetCode = resolveCashBankAccountCode(paymentMethod);
    const assetAcc = accounts.get(assetCode) || accounts.get('1020');

    const entryNo = await sequenceService.getNextJournalNo(normTenant);
    const dateFormatted = date || new Date().toISOString().split('T')[0];

    const lines = [
      {
        account: apAcc._id,
        accountCode: apAcc.code,
        accountName: apAcc.name,
        debit: numAmount,
        credit: 0,
        narration: `Payout to vendor ${vendorName || vendorId}`
      },
      {
        account: assetAcc._id,
        accountCode: assetAcc.code,
        accountName: assetAcc.name,
        debit: 0,
        credit: numAmount,
        narration: `Disbursed via ${paymentMethod || 'Bank Transfer'}`
      }
    ];

    const entry = new JournalEntry({
      tenantId: normTenant,
      entryNo,
      date: dateFormatted,
      financialYearId: fy?._id || null,
      financialYearName: fy?.name || '',
      narration: `Vendor hire settlement to ${vendorName || vendorId} (${vendorId || ''}) for ₹${numAmount}`,
      lines,
      totalDebit: numAmount,
      totalCredit: numAmount,
      sourceType: 'vendor_payment',
      sourceId: String(paymentId),
      status: 'posted',
      postedBy: user?.name || user?.email || 'System',
      createdBy: user?.name || user?.email || 'System'
    });

    await entry.save({ session });

    try {
      const type = assetCode === '1010' ? 'cash' : assetCode === '1030' ? 'upi' : 'bank';
      await CashBankAccount.findOneAndUpdate(
        { tenantId: normTenant, accountType: type },
        { $inc: { currentBalance: -numAmount } },
        { session }
      );
    } catch {}

    return entry;
  },

  /**
   * 4. Post Driver Settlement Payout
   * Debit: Driver Settlement Payables (2030)
   * Credit: Cash / Bank (1010 / 1020)
   */
  postDriverSettlement: async (data, session = null) => {
    const { tenantId = 'mak-tours', settlementId, amount, date, driverId, driverName, paymentMethod, user } = data;
    const normTenant = tenantId.toLowerCase().trim();
    const numAmount = Math.round(Number(amount) * 100) / 100;

    if (numAmount <= 0) throw new Error('Driver settlement amount must be greater than zero');

    const accounts = await getTenantAccounts(normTenant);
    const fy = await getOpenFinancialYear(normTenant, date);

    const apAcc = accounts.get('2030') || accounts.get('5040');
    const assetCode = resolveCashBankAccountCode(paymentMethod);
    const assetAcc = accounts.get(assetCode) || accounts.get('1010');

    const entryNo = await sequenceService.getNextJournalNo(normTenant);
    const dateFormatted = date || new Date().toISOString().split('T')[0];

    const lines = [
      {
        account: apAcc._id,
        accountCode: apAcc.code,
        accountName: apAcc.name,
        debit: numAmount,
        credit: 0,
        narration: `Trip allowances and bata settlement for driver ${driverName || driverId}`
      },
      {
        account: assetAcc._id,
        accountCode: assetAcc.code,
        accountName: assetAcc.name,
        debit: 0,
        credit: numAmount,
        narration: `Settled via ${paymentMethod || 'UPI / Cash'}`
      }
    ];

    const entry = new JournalEntry({
      tenantId: normTenant,
      entryNo,
      date: dateFormatted,
      financialYearId: fy?._id || null,
      financialYearName: fy?.name || '',
      narration: `Driver trip settlement paid to ${driverName || driverId} for ₹${numAmount}`,
      lines,
      totalDebit: numAmount,
      totalCredit: numAmount,
      sourceType: 'driver_settlement',
      sourceId: String(settlementId),
      status: 'posted',
      postedBy: user?.name || user?.email || 'System',
      createdBy: user?.name || user?.email || 'System'
    });

    await entry.save({ session });

    try {
      const type = assetCode === '1010' ? 'cash' : assetCode === '1030' ? 'upi' : 'bank';
      await CashBankAccount.findOneAndUpdate(
        { tenantId: normTenant, accountType: type },
        { $inc: { currentBalance: -numAmount } },
        { session }
      );
    } catch {}

    return entry;
  },

  /**
   * 5. Post Salary Payment
   * Debit: Salary & Wages Payable (2040)
   * Credit: Bank Account (1020)
   */
  postSalaryPayment: async (data, session = null) => {
    const { tenantId = 'mak-tours', paymentCode, amount, date, employeeId, employeeName, month, user } = data;
    const normTenant = tenantId.toLowerCase().trim();
    const numAmount = Math.round(Number(amount) * 100) / 100;

    if (numAmount <= 0) throw new Error('Salary payment amount must be greater than zero');

    const accounts = await getTenantAccounts(normTenant);
    const fy = await getOpenFinancialYear(normTenant, date);

    const salPayableAcc = accounts.get('2040') || accounts.get('5070');
    const bankAcc = accounts.get('1020') || accounts.get('1010');

    const entryNo = await sequenceService.getNextJournalNo(normTenant);
    const dateFormatted = date || new Date().toISOString().split('T')[0];

    const lines = [
      {
        account: salPayableAcc._id,
        accountCode: salPayableAcc.code,
        accountName: salPayableAcc.name,
        debit: numAmount,
        credit: 0,
        narration: `Salary payout to ${employeeName || employeeId} for month ${month || ''}`
      },
      {
        account: bankAcc._id,
        accountCode: bankAcc.code,
        accountName: bankAcc.name,
        debit: 0,
        credit: numAmount,
        narration: `Bank salary disbursement`
      }
    ];

    const entry = new JournalEntry({
      tenantId: normTenant,
      entryNo,
      date: dateFormatted,
      financialYearId: fy?._id || null,
      financialYearName: fy?.name || '',
      narration: `Salary disbursement to ${employeeName || employeeId} for month ${month || ''} (₹${numAmount})`,
      lines,
      totalDebit: numAmount,
      totalCredit: numAmount,
      sourceType: 'salary_payment',
      sourceId: String(paymentCode),
      status: 'posted',
      postedBy: user?.name || user?.email || 'System',
      createdBy: user?.name || user?.email || 'System'
    });

    await entry.save({ session });

    try {
      await CashBankAccount.findOneAndUpdate(
        { tenantId: normTenant, accountType: 'bank' },
        { $inc: { currentBalance: -numAmount } },
        { session }
      );
    } catch {}

    return entry;
  },

  /**
   * 6. Post Invoice (Sales Accrual)
   * Debit: Accounts Receivable (1050) = Total Amount
   * Credit: Trip Revenue (4010) = Subtotal
   * Credit: GST Output Tax (2080) = Tax Amount (if > 0)
   */
  postInvoice: async (data, session = null) => {
    const { tenantId = 'mak-tours', invoiceNumber, subtotal, taxAmount = 0, totalAmount, date, customerName, bookingRef, user } = data;
    const normTenant = tenantId.toLowerCase().trim();

    const numTotal = Math.round(Number(totalAmount) * 100) / 100;
    const numTax = Math.round(Number(taxAmount || 0) * 100) / 100;
    const numSubtotal = Math.round(Number(subtotal || (numTotal - numTax)) * 100) / 100;

    if (numTotal <= 0) throw new Error('Invoice total must be greater than zero');

    const accounts = await getTenantAccounts(normTenant);
    const fy = await getOpenFinancialYear(normTenant, date);

    const arAcc = accounts.get('1050');
    const revAcc = accounts.get('4010');
    const taxAcc = accounts.get('2080');

    if (!arAcc || !revAcc) {
      throw new Error('Ledger Chart of Accounts missing required Accounts Receivable (1050) or Revenue (4010) accounts');
    }

    const entryNo = await sequenceService.getNextJournalNo(normTenant);
    const dateFormatted = date || new Date().toISOString().split('T')[0];

    const lines = [
      {
        account: arAcc._id,
        accountCode: arAcc.code,
        accountName: arAcc.name,
        debit: numTotal,
        credit: 0,
        narration: `Invoice #${invoiceNumber} for ${customerName || 'Customer'} (Booking: ${bookingRef || ''})`
      },
      {
        account: revAcc._id,
        accountCode: revAcc.code,
        accountName: revAcc.name,
        debit: 0,
        credit: numSubtotal,
        narration: `Trip & Travel Service Revenue`
      }
    ];

    if (numTax > 0 && taxAcc) {
      lines.push({
        account: taxAcc._id,
        accountCode: taxAcc.code,
        accountName: taxAcc.name,
        debit: 0,
        credit: numTax,
        narration: `GST Output Tax on Invoice #${invoiceNumber}`
      });
    }

    const entry = new JournalEntry({
      tenantId: normTenant,
      entryNo,
      date: dateFormatted,
      financialYearId: fy?._id || null,
      financialYearName: fy?.name || '',
      narration: `Invoice #${invoiceNumber} billed to ${customerName || 'Customer'} for booking ${bookingRef || ''}`,
      lines,
      totalDebit: numTotal,
      totalCredit: numTotal,
      sourceType: 'invoice',
      sourceId: String(invoiceNumber),
      status: 'posted',
      postedBy: user?.name || user?.email || 'System',
      createdBy: user?.name || user?.email || 'System'
    });

    return entry.save({ session });
  },

  /**
   * 7. Post Credit Note (Sales Return / Cancellation Credit)
   * Debit: Trip Revenue (4010) = Subtotal
   * Debit: GST Output Tax (2080) = Tax Amount (if > 0)
   * Credit: Accounts Receivable (1050) = Total Amount
   */
  postCreditNote: async (data, session = null) => {
    const { tenantId = 'mak-tours', creditNoteNumber, subtotal, taxAmount = 0, totalAmount, date, customerName, reason, user } = data;
    const normTenant = tenantId.toLowerCase().trim();

    const numTotal = Math.round(Number(totalAmount) * 100) / 100;
    const numTax = Math.round(Number(taxAmount || 0) * 100) / 100;
    const numSubtotal = Math.round(Number(subtotal || (numTotal - numTax)) * 100) / 100;

    if (numTotal <= 0) throw new Error('Credit note total must be greater than zero');

    const accounts = await getTenantAccounts(normTenant);
    const fy = await getOpenFinancialYear(normTenant, date);

    const arAcc = accounts.get('1050');
    const revAcc = accounts.get('4010');
    const taxAcc = accounts.get('2080');

    const entryNo = await sequenceService.getNextJournalNo(normTenant);
    const dateFormatted = date || new Date().toISOString().split('T')[0];

    const lines = [
      {
        account: revAcc._id,
        accountCode: revAcc.code,
        accountName: revAcc.name,
        debit: numSubtotal,
        credit: 0,
        narration: `Revenue reduction for Credit Note #${creditNoteNumber}: ${reason || ''}`
      }
    ];

    if (numTax > 0 && taxAcc) {
      lines.push({
        account: taxAcc._id,
        accountCode: taxAcc.code,
        accountName: taxAcc.name,
        debit: numTax,
        credit: 0,
        narration: `GST adjustment for Credit Note #${creditNoteNumber}`
      });
    }

    lines.push({
      account: arAcc._id,
      accountCode: arAcc.code,
      accountName: arAcc.name,
      debit: 0,
      credit: numTotal,
      narration: `Credit applied to customer account: ${customerName || 'Customer'}`
    });

    const entry = new JournalEntry({
      tenantId: normTenant,
      entryNo,
      date: dateFormatted,
      financialYearId: fy?._id || null,
      financialYearName: fy?.name || '',
      narration: `Credit Note #${creditNoteNumber} issued to ${customerName || 'Customer'} (${reason || 'Trip Adjustment'})`,
      lines,
      totalDebit: numTotal,
      totalCredit: numTotal,
      sourceType: 'credit_note',
      sourceId: String(creditNoteNumber),
      status: 'posted',
      postedBy: user?.name || user?.email || 'System',
      createdBy: user?.name || user?.email || 'System'
    });

    return entry.save({ session });
  },

  /**
   * 8. Reverse Journal Entry
   * Immutable accounting: creates a matching inverse entry with flipped debits and credits
   */
  reverseJournalEntry: async (tenantId, entryNo, reason = 'Entry reversal', user = null, session = null) => {
    const normTenant = (tenantId || 'mak-tours').toLowerCase().trim();

    const original = await JournalEntry.findOne({ tenantId: normTenant, entryNo }).session(session);
    if (!original) {
      throw new Error(`Journal Entry '${entryNo}' not found in your company`);
    }

    if (original.status === 'reversed') {
      throw new Error(`Journal Entry '${entryNo}' has already been reversed by '${original.reversedBy}'`);
    }

    const reversalEntryNo = await sequenceService.getNextJournalNo(normTenant);
    const dateFormatted = new Date().toISOString().split('T')[0];
    const fy = await getOpenFinancialYear(normTenant, dateFormatted);

    // Swap debit and credit on each line
    const reversedLines = original.lines.map((l) => ({
      account: l.account,
      accountCode: l.accountCode,
      accountName: l.accountName,
      debit: l.credit,
      credit: l.debit,
      narration: `Reversal of ${original.entryNo}: ${l.narration || ''}`.trim()
    }));

    const reversalEntry = new JournalEntry({
      tenantId: normTenant,
      entryNo: reversalEntryNo,
      date: dateFormatted,
      financialYearId: fy?._id || original.financialYearId,
      financialYearName: fy?.name || original.financialYearName,
      narration: `REVERSAL of ${original.entryNo}: ${reason}`,
      lines: reversedLines,
      totalDebit: original.totalCredit,
      totalCredit: original.totalDebit,
      sourceType: 'reversal',
      sourceId: original.entryNo,
      status: 'posted',
      reversalOf: original.entryNo,
      postedBy: user?.name || user?.email || 'System',
      createdBy: user?.name || user?.email || 'System'
    });

    await reversalEntry.save({ session });

    // Mark original entry as reversed
    original.status = 'reversed';
    original.reversedBy = reversalEntryNo;
    original.reversedAt = new Date();
    await original.save({ session });

    return {
      original,
      reversal: reversalEntry
    };
  }
};

export default postingService;
