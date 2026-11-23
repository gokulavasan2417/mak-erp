// MAK Tours & Travels ERP - Vendor Payment Model
// Collection: vendor_payments
import mongoose from 'mongoose';

const vendorPaymentSchema = new mongoose.Schema(
  {
    tenantId: {
      type: String,
      required: true,
      index: true,
      lowercase: true,
      trim: true
    },
    paymentRef: {
      type: String,
      required: true,
      trim: true
    },
    vendorId: {
      type: String,
      required: true,
      index: true
    },
    vendorName: {
      type: String,
      required: true
    },
    billNumber: {
      type: String,
      default: ''
    },
    amount: {
      type: Number,
      required: true,
      min: 0.01
    },
    paymentType: {
      type: String,
      enum: ['Full Payment', 'Partial Payment', 'Advance Payment'],
      default: 'Full Payment'
    },
    paymentMethod: {
      type: String,
      enum: ['Bank Transfer', 'UPI', 'Cash', 'Cheque'],
      default: 'Bank Transfer'
    },
    paymentDate: {
      type: String,
      required: true
    },
    transactionRef: {
      type: String,
      default: ''
    },
    notes: {
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
    collection: 'vendor_payments'
  }
);

vendorPaymentSchema.index({ tenantId: 1, paymentRef: 1 }, { unique: true });
vendorPaymentSchema.index({ tenantId: 1, vendorId: 1, paymentDate: -1 });

export const VendorPayment = mongoose.models.VendorPayment || mongoose.model('VendorPayment', vendorPaymentSchema);
export default VendorPayment;