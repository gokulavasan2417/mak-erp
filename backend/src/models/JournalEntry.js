// MAK Tours & Travels ERP - Double-Entry Journal Entry Model
import mongoose from 'mongoose';

const journalLineSchema = new mongoose.Schema(
  {
    account: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Account',
      required: true
    },
    accountCode: {
      type: String,
      required: true,
      trim: true
    },
    accountName: {
      type: String,
      required: true,
      trim: true
    },
    debit: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    },
    credit: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    },
    narration: {
      type: String,
      default: '',
      trim: true
    }
  },
  { _id: true }
);

const journalEntrySchema = new mongoose.Schema(
  {
    tenantId: {
      type: String,
      required: true,
      index: true,
      lowercase: true,
      trim: true
    },
    entryNo: {
      type: String,
      required: true,
      trim: true
    },
    date: {
      type: String,
      required: true // YYYY-MM-DD
    },
    financialYearId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FinancialYear',
      default: null
    },
    financialYearName: {
      type: String,
      default: ''
    },
    narration: {
      type: String,
      required: true,
      trim: true
    },
    lines: {
      type: [journalLineSchema],
      required: true,
      validate: {
        validator: function (lines) {
          return Array.isArray(lines) && lines.length >= 2;
        },
        message: 'Journal entry must contain at least 2 lines (double-entry requirement)'
      }
    },
    totalDebit: {
      type: Number,
      required: true,
      min: 0
    },
    totalCredit: {
      type: Number,
      required: true,
      min: 0
    },
    sourceType: {
      type: String,
      required: true,
      enum: [
        'customer_payment',
        'expense_payment',
        'vendor_payment',
        'driver_settlement',
        'salary_payment',
        'invoice',
        'credit_note',
        'opening_balance',
        'manual_journal',
        'reversal'
      ]
    },
    sourceId: {
      type: String,
      required: true,
      trim: true
    },
    status: {
      type: String,
      required: true,
      enum: ['posted', 'reversed'],
      default: 'posted'
    },
    reversalOf: {
      type: String,
      default: null // Entry number of original journal that was reversed
    },
    reversedBy: {
      type: String,
      default: null // Entry number of reversing journal
    },
    reversedAt: {
      type: Date,
      default: null
    },
    postedBy: {
      type: String,
      default: 'System'
    },
    createdBy: {
      type: String,
      default: 'System'
    }
  },
  {
    timestamps: true,
    collection: 'journal_entries'
  }
);

// Guard Against Updates on Posted Entries (Immutability) & Mathematical Double-Entry Validation Hook
journalEntrySchema.pre('validate', function () {
  // 1. Immutability guard for already saved posted entries
  if (!this.isNew && this.status === 'posted') {
    if (this.isModified('lines') || this.isModified('totalDebit') || this.isModified('totalCredit') || this.isModified('date')) {
      throw new Error('Immutable ledger error: Posted journal entry lines cannot be modified. Issue a reversal entry instead.');
    }
  }

  // 2. Minimum line count requirement
  if (!Array.isArray(this.lines) || this.lines.length < 2) {
    throw new Error('Journal entry must contain at least 2 lines (double-entry requirement)');
  }

  let sumDebit = 0;
  let sumCredit = 0;

  for (let i = 0; i < this.lines.length; i++) {
    const line = this.lines[i];
    const d = Number(line.debit) || 0;
    const c = Number(line.credit) || 0;

    // No negative values
    if (d < 0 || c < 0) {
      throw new Error(`Line ${i + 1}: Negative values are strictly forbidden in accounting ledger`);
    }

    // Exactly one side per line
    if ((d > 0 && c > 0) || (d === 0 && c === 0)) {
      throw new Error(`Line ${i + 1}: Exactly one side (Debit or Credit) must be greater than zero`);
    }

    sumDebit += d;
    sumCredit += c;
  }

  // Rounding safety to 2 decimal places
  sumDebit = Math.round(sumDebit * 100) / 100;
  sumCredit = Math.round(sumCredit * 100) / 100;

  this.totalDebit = sumDebit;
  this.totalCredit = sumCredit;

  if (Math.abs(sumDebit - sumCredit) >= 0.01) {
    throw new Error(
      `Accounting imbalance: Total Debit (₹${sumDebit}) does not equal Total Credit (₹${sumCredit}). Difference: ₹${Math.abs(
        sumDebit - sumCredit
      )}`
    );
  }
});

// Secondary Guard in pre('save') as well
journalEntrySchema.pre('save', function () {
  if (!this.isNew && this.status === 'posted') {
    if (this.isModified('lines') || this.isModified('totalDebit') || this.isModified('totalCredit') || this.isModified('date')) {
      throw new Error('Immutable ledger error: Posted journal entry lines cannot be modified. Issue a reversal entry instead.');
    }
  }
});

// Compound Unique Indexes
// 1. One posting per transaction event (Double-posting rejection)
journalEntrySchema.index({ tenantId: 1, sourceType: 1, sourceId: 1 }, { unique: true });

// 2. Entry Number unique per tenant
journalEntrySchema.index({ tenantId: 1, entryNo: 1 }, { unique: true });

// 3. Operational query indexes
journalEntrySchema.index({ tenantId: 1, date: 1 });
journalEntrySchema.index({ tenantId: 1, status: 1 });
journalEntrySchema.index({ tenantId: 1, 'lines.account': 1, date: 1 });
journalEntrySchema.index({ tenantId: 1, 'lines.accountCode': 1, date: 1 });

export const JournalEntry = mongoose.models.JournalEntry || mongoose.model('JournalEntry', journalEntrySchema);
export default JournalEntry;
