// MAK Tours & Travels ERP - Payment Model
// Collection: payments (Existing Atlas collection)
import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema(
  {
    tenantId: { type: String, default: 'mak-tours', index: true, lowercase: true, trim: true },
    bookingRef: { type: String, index: true },
    userId: { type: mongoose.Schema.Types.Mixed, default: null },
    orderId: { type: String, default: undefined, trim: true },
    paymentId: { type: String, default: undefined, trim: true },
    signature: { type: String, default: '' },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    status: {
      type: String,
      default: 'created',
      enum: ['created', 'captured', 'paid', 'failed', 'refunded', 'pending']
    },
    paymentMethod: {
      type: String,
      default: 'Bank Transfer',
      enum: ['Cash', 'UPI', 'Bank Transfer', 'Card', 'Fastag', 'Other', 'Bank', '']
    },
    idempotencyKey: { type: String, default: '', index: true },
    allowOverpayment: { type: Boolean, default: false },
    isAdvance: { type: Boolean, default: false },
    receiptNumber: { type: String, default: '' },
    receiptDate: { type: String, default: '' },
    journalEntryNo: { type: String, default: '' },
    customerEmail: { type: String, default: '' },
    customerPhone: { type: String, default: '' },
    rawResponse: { type: mongoose.Schema.Types.Mixed, default: {} }
  },
  {
    timestamps: true,
    collection: 'payments' // Existing Atlas collection
  }
);

paymentSchema.index(
  { tenantId: 1, idempotencyKey: 1 },
  { unique: true, partialFilterExpression: { idempotencyKey: { $type: 'string', $gt: '' } } }
);

paymentSchema.index(
  { tenantId: 1, paymentId: 1 },
  { unique: true, partialFilterExpression: { paymentId: { $type: 'string', $gt: '' } } }
);
paymentSchema.index(
  { tenantId: 1, orderId: 1 },
  { unique: true, partialFilterExpression: { orderId: { $type: 'string', $gt: '' } } }
);
paymentSchema.index({ tenantId: 1, bookingRef: 1 });
paymentSchema.index({ tenantId: 1, status: 1 });

export const Payment = mongoose.models.Payment || mongoose.model('Payment', paymentSchema);
export default Payment;
