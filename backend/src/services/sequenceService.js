// MAK Tours & Travels ERP - Concurrency-Safe Multi-Tenant Sequence Service
import { Counter } from '../models/Counter.js';

/**
 * Atomically increment and return the next formatted sequence ID for a given tenant.
 * Uses MongoDB findOneAndUpdate with $inc and upsert to prevent collisions under high concurrency.
 *
 * @param {string} tenantId - Tenant identifier
 * @param {string} sequenceName - Sequence category (e.g. 'booking', 'expense', 'invoice')
 * @param {Object} options - { prefix, padLength, startAt }
 * @returns {Promise<{ seq: number, formatted: string }>}
 */
export async function getNextSequence(tenantId, sequenceName, options = {}) {
  const normTenant = (tenantId || 'mak-tours').toLowerCase().trim();
  const { prefix = '', padLength = 6, startAt = 1 } = options;

  const counter = await Counter.findOneAndUpdate(
    { tenantId: normTenant, sequenceName },
    { $inc: { seq: 1 } },
    {
      upsert: true,
      returnDocument: 'after',
      setDefaultsOnInsert: true
    }
  );

  let seqNum = counter.seq;
  if (seqNum < startAt) {
    // If startAt is provided and seq is lower, initialize upward
    const adjusted = await Counter.findOneAndUpdate(
      { tenantId: normTenant, sequenceName, seq: { $lt: startAt } },
      { $set: { seq: startAt } },
      { returnDocument: 'after' }
    );
    if (adjusted) {
      seqNum = adjusted.seq;
    }
  }

  const padded = String(seqNum).padStart(padLength, '0');
  const formatted = prefix ? `${prefix}${padded}` : padded;

  return { seq: seqNum, formatted };
}

/**
 * Generate next Booking Reference: e.g. MAK-000101 or TENANT-000101
 */
export async function getNextBookingRef(tenantId) {
  const prefix = tenantId === 'mak-tours' ? 'MAK-' : 'BK-';
  const { formatted } = await getNextSequence(tenantId, 'bookings', { prefix, padLength: 6 });
  return formatted;
}

/**
 * Generate next Invoice Number: e.g. INV-MAK-000101 or INV-000101
 */
export async function getNextInvoiceNumber(tenantId, bookingRef = null) {
  if (bookingRef) {
    return `INV-${bookingRef}`;
  }
  const { formatted } = await getNextSequence(tenantId, 'invoices', { prefix: 'INV-', padLength: 6 });
  return formatted;
}

/**
 * Generate next Expense ID: e.g. EXP-000101
 */
export async function getNextExpenseId(tenantId) {
  const { formatted } = await getNextSequence(tenantId, 'expenses', { prefix: 'EXP-', padLength: 6 });
  return formatted;
}

/**
 * Generate next Payment Reference: e.g. PAY-000101
 */
export async function getNextPaymentRef(tenantId) {
  const { formatted } = await getNextSequence(tenantId, 'payments', { prefix: 'PAY-', padLength: 6 });
  return formatted;
}

/**
 * Generate next Salary Disbursement Transaction Reference: e.g. SAL-TXN-000101
 */
export async function getNextSalaryPaymentRef(tenantId) {
  const { formatted } = await getNextSequence(tenantId, 'salary_payments', { prefix: 'SAL-TXN-', padLength: 6 });
  return formatted;
}

/**
 * Generate next Employee Code: e.g. EMP-001
 */
export async function getNextEmployeeCode(tenantId) {
  const { formatted } = await getNextSequence(tenantId, 'employees', { prefix: 'EMP-', padLength: 3 });
  return formatted;
}

/**
 * Generate next Vendor ID: e.g. VND-001
 */
export async function getNextVendorId(tenantId) {
  const { formatted } = await getNextSequence(tenantId, 'vendors', { prefix: 'VND-', padLength: 3 });
  return formatted;
}

/**
 * Generate next Journal Entry Number: e.g. JV-2026-00001
 */
export async function getNextJournalNo(tenantId) {
  const year = new Date().getFullYear();
  const { formatted } = await getNextSequence(tenantId, `journal_${year}`, { prefix: `JV-${year}-`, padLength: 5 });
  return formatted;
}

/**
 * Generate next Receipt Number: e.g. REC-2026-00001
 */
export async function getNextReceiptNo(tenantId) {
  const year = new Date().getFullYear();
  const { formatted } = await getNextSequence(tenantId, `receipt_${year}`, { prefix: `REC-${year}-`, padLength: 5 });
  return formatted;
}

/**
 * Generate next Credit Note Number: e.g. CN-2026-00001
 */
export async function getNextCreditNoteNo(tenantId) {
  const year = new Date().getFullYear();
  const { formatted } = await getNextSequence(tenantId, `credit_note_${year}`, { prefix: `CN-${year}-`, padLength: 5 });
  return formatted;
}

/**
 * Generate next Vendor Bill Number: e.g. BILL-2026-00001
 */
export async function getNextBillNo(tenantId) {
  const year = new Date().getFullYear();
  const { formatted } = await getNextSequence(tenantId, `vendor_bill_${year}`, { prefix: `BILL-${year}-`, padLength: 5 });
  return formatted;
}

/**
 * Generate next Vendor Payment Ref: e.g. VPAY-2026-00001
 */
export async function getNextVendorPaymentRef(tenantId) {
  const year = new Date().getFullYear();
  const { formatted } = await getNextSequence(tenantId, `vendor_payment_${year}`, { prefix: `VPAY-${year}-`, padLength: 5 });
  return formatted;
}

/**
 * Generate next Driver Settlement Number: e.g. DS-2026-00001
 */
export async function getNextSettlementNo(tenantId) {
  const year = new Date().getFullYear();
  const { formatted } = await getNextSequence(tenantId, `driver_settlement_${year}`, { prefix: `DS-${year}-`, padLength: 5 });
  return formatted;
}

/**
 * Generate next Cash/Bank Transaction Number: e.g. CBT-2026-00001
 */
export async function getNextCashBankTxnNo(tenantId) {
  const year = new Date().getFullYear();
  const { formatted } = await getNextSequence(tenantId, `cash_bank_txn_${year}`, { prefix: `CBT-${year}-`, padLength: 5 });
  return formatted;
}

export const sequenceService = {
  getNextSequence,
  getNextBookingRef,
  getNextInvoiceNumber,
  getNextExpenseId,
  getNextPaymentRef,
  getNextSalaryPaymentRef,
  getNextEmployeeCode,
  getNextVendorId,
  getNextJournalNo,
  getNextReceiptNo,
  getNextCreditNoteNo,
  getNextBillNo,
  getNextVendorPaymentRef,
  getNextSettlementNo,
  getNextCashBankTxnNo
};

export default sequenceService;
