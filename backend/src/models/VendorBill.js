// MAK Tours & Travels ERP - Vendor Bill Model
// Collection: vendor_bills
import mongoose from 'mongoose';

const vendorBillLineItemSchema = new mongoose.Schema(
  {
    description: { type: String, required: true },
    quantity: { type: Number, default: 1 },
    rate: { type: Number, required: true },
    amount: { type: Number, required: true }
  },
  { _id: false }
);

const vendorBillSchema = new mongoose.Schema(
  {
    tenantId: {
      type: String,
      required: true,
      index: true,
      lowercase: true,
      trim: true
    },
    billNumber: {
      type: String,
      required: true,
      trim: true
    },
    vendorInvoiceNumber: {
      type: String,
      default: ''
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
    bookingRef: {
      type: String,
      index: true,
      default: ''
    },
    category: {
      type: String,
      enum: ['Fleet Lease', 'Subcontract Vehicle', 'Driver Outsourcing', 'Fuel Reimbursement', 'Maintenance & Repairs', 'Toll & Permit', 'Other'],
      default: 'Subcontract Vehicle'
    },
    billDate: {
      type: String,
      required: true
    },
    dueDate: {
      type: String,
      required: true
    },
    lineItems: [vendorBillLineItemSchema],
    subtotal: {
      type: Number,
      required: true,
      min: 0
    },
    taxAmount: {
      type: Number,
      default: 0,
      min: 0
    },
    totalAmount: {
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
    collection: 'vendor_bills'
  }
);

// Unique bill number per tenant
vendorBillSchema.index({ tenantId: 1, billNumber: 1 }, { unique: true });
vendorBillSchema.index({ tenantId: 1, vendorId: 1, status: 1 });
vendorBillSchema.index({ tenantId: 1, dueDate: 1 });

vendorBillSchema.pre('save', function (next) {
  this.balanceDue = Math.max(0, (this.totalAmount || 0) - (this.amountPaid || 0));

  if (this.status !== 'Cancelled') {
    if (this.totalAmount > 0 && this.amountPaid >= this.totalAmount) {
      this.status = 'Paid';
    } else if (this.amountPaid > 0 && this.amountPaid < this.totalAmount) {
      this.status = 'Partially Paid';
    } else {
      this.status = 'Unpaid';
    }
  }

  if (typeof next === 'function') next();
});

export const VendorBill = mongoose.models.VendorBill || mongoose.model('VendorBill', vendorBillSchema);
export default VendorBill;