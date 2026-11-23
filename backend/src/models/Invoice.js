// MAK Tours & Travels ERP - Dedicated Multi-Tenant Invoice Model
// Collection: invoices
import mongoose from 'mongoose';

const invoiceLineItemSchema = new mongoose.Schema(
  {
    description: { type: String, required: true },
    quantity: { type: Number, default: 1 },
    rate: { type: Number, required: true },
    amount: { type: Number, required: true },
    taxRate: { type: Number, default: 0 }
  },
  { _id: false }
);

const invoiceSchema = new mongoose.Schema(
  {
    tenantId: {
      type: String,
      required: true,
      index: true,
      lowercase: true,
      trim: true
    },
    invoiceNumber: {
      type: String,
      required: true,
      trim: true
    },
    bookingRef: {
      type: String,
      index: true,
      trim: true,
      default: ''
    },
    bookingId: {
      type: String,
      default: ''
    },
    customer: {
      name: { type: String, required: true },
      email: { type: String, default: '' },
      phone: { type: String, default: '' },
      address: { type: String, default: '' },
      gstin: { type: String, default: '' }
    },
    lineItems: [invoiceLineItemSchema],
    subtotal: {
      type: Number,
      default: 0
    },
    discount: {
      type: Number,
      default: 0,
      min: 0
    },
    additionalCharges: [
      {
        reason: { type: String, required: true },
        amount: { type: Number, required: true }
      }
    ],
    gstType: {
      type: String,
      enum: ['CGST_SGST', 'IGST', 'EXEMPT', 'NONE'],
      default: 'NONE'
    },
    gstRate: {
      type: Number,
      default: 0
    },
    cgstRate: {
      type: Number,
      default: 0
    },
    cgstAmount: {
      type: Number,
      default: 0
    },
    sgstRate: {
      type: Number,
      default: 0
    },
    sgstAmount: {
      type: Number,
      default: 0
    },
    igstRate: {
      type: Number,
      default: 0
    },
    igstAmount: {
      type: Number,
      default: 0
    },
    taxAmount: {
      type: Number,
      default: 0
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    amountPaid: {
      type: Number,
      default: 0,
      min: 0
    },
    balanceDue: {
      type: Number,
      default: 0,
      min: 0
    },
    status: {
      type: String,
      enum: ['Unpaid', 'Partially Paid', 'Paid', 'Cancelled'],
      default: 'Unpaid'
    },
    cancellationReason: {
      type: String,
      default: ''
    },
    cancelledAt: {
      type: Date,
      default: null
    },
    cancelledBy: {
      type: String,
      default: ''
    },
    creditNotes: [
      {
        creditNoteNumber: { type: String, required: true },
        reason: { type: String, required: true },
        amount: { type: Number, required: true },
        issuedAt: { type: Date, default: Date.now },
        issuedBy: { type: String, default: '' },
        journalEntryNo: { type: String, default: '' }
      }
    ],
    journalEntryNo: {
      type: String,
      default: ''
    },
    invoiceDate: {
      type: String,
      required: true
    },
    dueDate: {
      type: String,
      default: ''
    },
    brandingSnapshot: {
      companyName: { type: String, default: '' },
      address: { type: String, default: '' },
      gstin: { type: String, default: '' },
      pan: { type: String, default: '' },
      phone: { type: String, default: '' },
      email: { type: String, default: '' },
      logoUrl: { type: String, default: '' }
    },
    notes: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true,
    collection: 'invoices'
  }
);

// Compound unique index ensuring invoice numbers never collide within a tenant
invoiceSchema.index({ tenantId: 1, invoiceNumber: 1 }, { unique: true });
invoiceSchema.index({ tenantId: 1, bookingRef: 1 });
invoiceSchema.index({ tenantId: 1, status: 1 });

// Helper to determine status from payments and credit notes
invoiceSchema.pre('save', function (next) {
  const totalCreditNotes = Array.isArray(this.creditNotes)
    ? this.creditNotes.reduce((s, cn) => s + (Number(cn.amount) || 0), 0)
    : 0;

  this.balanceDue = Math.max(0, (this.amount || 0) - (this.amountPaid || 0) - totalCreditNotes);

  if (this.status !== 'Cancelled') {
    if (this.amount > 0 && (this.amountPaid + totalCreditNotes) >= this.amount) {
      this.status = 'Paid';
    } else if (this.amountPaid > 0 && (this.amountPaid + totalCreditNotes) < this.amount) {
      this.status = 'Partially Paid';
    } else {
      this.status = 'Unpaid';
    }
  }

  if (typeof next === 'function') next();
});

export const Invoice = mongoose.models.Invoice || mongoose.model('Invoice', invoiceSchema);
export default Invoice;
