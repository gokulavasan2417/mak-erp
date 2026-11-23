// MAK Tours & Travels ERP - Financial Year Model
import mongoose from 'mongoose';

const financialYearSchema = new mongoose.Schema(
  {
    tenantId: {
      type: String,
      required: true,
      index: true,
      lowercase: true,
      trim: true
    },
    name: {
      type: String,
      required: true,
      trim: true // e.g. "FY 2026-27"
    },
    startDate: {
      type: String,
      required: true // YYYY-MM-DD e.g. "2026-04-01"
    },
    endDate: {
      type: String,
      required: true // YYYY-MM-DD e.g. "2027-03-31"
    },
    status: {
      type: String,
      required: true,
      enum: ['open', 'closed'],
      default: 'open'
    },
    isDefault: {
      type: Boolean,
      default: false
    },
    closedAt: {
      type: Date,
      default: null
    },
    closedBy: {
      type: String,
      default: null
    },
    notes: {
      type: String,
      default: ''
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
    collection: 'financial_years'
  }
);

// Compound Unique Index: Start and End dates unique per tenant
financialYearSchema.index({ tenantId: 1, startDate: 1, endDate: 1 }, { unique: true });
financialYearSchema.index({ tenantId: 1, status: 1 });
financialYearSchema.index({ tenantId: 1, isDefault: 1 });

export const FinancialYear = mongoose.models.FinancialYear || mongoose.model('FinancialYear', financialYearSchema);
export default FinancialYear;
