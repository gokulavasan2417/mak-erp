// MAK Tours & Travels ERP - Cash and Bank Transaction Model
// Collection: cash_bank_transactions
import mongoose from 'mongoose';

const cashBankTransactionSchema = new mongoose.Schema(
  {
    tenantId: {
      type: String,
      required: true,
      index: true,
      lowercase: true,
      trim: true
    },
    txnNo: {
      type: String,
      required: true,
      trim: true
    },
    accountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CashBankAccount',
      required: true
    },
    accountName: {
      type: String,
      required: true
    },
    accountType: {
      type: String,
      enum: ['cash', 'bank', 'upi'],
      required: true
    },
    type: {
      type: String,
      enum: ['deposit', 'withdrawal', 'transfer'],
      required: true
    },
    fromAccountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CashBankAccount',
      default: null
    },
    fromAccountName: {
      type: String,
      default: ''
    },
    toAccountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CashBankAccount',
      default: null
    },
    toAccountName: {
      type: String,
      default: ''
    },
    amount: {
      type: Number,
      required: true,
      min: 0.01
    },
    date: {
      type: String,
      required: true
    },
    reference: {
      type: String,
      default: ''
    },
    narration: {
      type: String,
      required: true
    },
    matched: {
      type: Boolean,
      default: false,
      index: true
    },
    reconciledAt: {
      type: Date,
      default: null
    },
    reconciledBy: {
      type: String,
      default: ''
    },
    reconciliationNotes: {
      type: String,
      default: ''
    },
    journalEntryNo: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true,
    collection: 'cash_bank_transactions'
  }
);

cashBankTransactionSchema.index({ tenantId: 1, txnNo: 1 }, { unique: true });
cashBankTransactionSchema.index({ tenantId: 1, accountId: 1, date: -1 });
cashBankTransactionSchema.index({ tenantId: 1, matched: 1 });

export const CashBankTransaction = mongoose.models.CashBankTransaction || mongoose.model('CashBankTransaction', cashBankTransactionSchema);
export default CashBankTransaction;