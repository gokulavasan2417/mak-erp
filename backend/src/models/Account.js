// MAK Tours & Travels ERP - Chart of Accounts Model
import mongoose from 'mongoose';

const accountSchema = new mongoose.Schema(
  {
    tenantId: {
      type: String,
      required: true,
      index: true,
      lowercase: true,
      trim: true
    },
    code: {
      type: String,
      required: true,
      trim: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    type: {
      type: String,
      required: true,
      enum: ['asset', 'liability', 'equity', 'income', 'expense']
    },
    subType: {
      type: String,
      default: '',
      trim: true
    },
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Account',
      default: null
    },
    isSystem: {
      type: Boolean,
      default: false
    },
    normalBalance: {
      type: String,
      required: true,
      enum: ['debit', 'credit']
    },
    currency: {
      type: String,
      default: 'INR'
    },
    description: {
      type: String,
      default: ''
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
    collection: 'accounts'
  }
);

// Compound Unique Index: Code must be unique per tenant
accountSchema.index({ tenantId: 1, code: 1 }, { unique: true });
accountSchema.index({ tenantId: 1, type: 1 });
accountSchema.index({ tenantId: 1, isActive: 1 });
accountSchema.index({ tenantId: 1, isSystem: 1 });

export const Account = mongoose.models.Account || mongoose.model('Account', accountSchema);
export default Account;
