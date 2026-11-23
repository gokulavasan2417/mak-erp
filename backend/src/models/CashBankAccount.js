// MAK Tours & Travels ERP - Cash & Bank Account Master Model
import mongoose from 'mongoose';

const cashBankAccountSchema = new mongoose.Schema(
  {
    tenantId: {
      type: String,
      required: true,
      index: true,
      lowercase: true,
      trim: true
    },
    accountName: {
      type: String,
      required: true,
      trim: true // e.g. "HDFC Current Account" or "Main Cash Drawer"
    },
    type: {
      type: String,
      required: true,
      enum: ['cash', 'bank', 'upi']
    },
    accountType: {
      type: String,
      enum: ['cash', 'bank', 'upi'],
      default: function () {
        return this.type || 'bank';
      }
    },
    accountNumber: {
      type: String,
      default: '',
      trim: true
    },
    bankName: {
      type: String,
      default: '',
      trim: true
    },
    ifscCode: {
      type: String,
      default: '',
      trim: true
    },
    branch: {
      type: String,
      default: '',
      trim: true
    },
    upiId: {
      type: String,
      default: '',
      trim: true
    },
    openingBalance: {
      type: Number,
      default: 0
    },
    currentBalance: {
      type: Number,
      default: 0
    },
    linkedLedgerAccountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Account',
      required: true
    },
    linkedLedgerAccountCode: {
      type: String,
      default: ''
    },
    isDefault: {
      type: Boolean,
      default: false
    },
    isActive: {
      type: Boolean,
      default: true
    },
    createdBy: {
      type: String,
      default: 'System'
    },
    updatedBy: {
      type: String,
      default: 'System'
    }
  },
  {
    timestamps: true,
    collection: 'cash_bank_accounts'
  }
);

// Compound Unique Index: accountName unique per tenant
cashBankAccountSchema.index({ tenantId: 1, accountName: 1 }, { unique: true });
cashBankAccountSchema.index({ tenantId: 1, type: 1 });
cashBankAccountSchema.index({ tenantId: 1, isActive: 1 });

export const CashBankAccount = mongoose.models.CashBankAccount || mongoose.model('CashBankAccount', cashBankAccountSchema);
export default CashBankAccount;
