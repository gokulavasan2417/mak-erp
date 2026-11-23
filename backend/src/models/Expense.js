// MAK Tours & Travels ERP - Trip & Fleet Expenses Model
// Collection: expenses
import mongoose from 'mongoose';

const expenseSchema = new mongoose.Schema(
  {
    tenantId: { type: String, default: 'mak-tours', index: true, lowercase: true, trim: true },
    id: { type: String, index: true },
    tripId: { type: String, index: true },
    bookingRef: { type: String, index: true },
    bookingId: { type: String, index: true },
    driverId: { type: String, default: '' },
    driverName: { type: String, default: '' },
    vehicleId: { type: String, default: '' },
    vehicleNumber: { type: String, default: '' },
    vehicleRegNo: { type: String, default: '' },
    category: {
      type: String,
      required: true,
      trim: true
    },
    subCategory: { type: String, default: '' },
    workshopName: { type: String, default: '' },
    odometerKm: { type: Number, default: 0 },
    invoiceNo: { type: String, default: '' },
    invoiceNumber: { type: String, default: '' },
    amount: { type: Number, required: true },
    approvedAmount: { type: Number, default: null },
    adminRemarks: { type: String, default: '' },
    expenseType: { type: String, default: '' },
    description: { type: String, default: '' },
    source: { type: String, default: 'Operations' },
    payee: { type: String, default: '' },
    date: { type: String, default: () => new Date().toISOString().split('T')[0] },
    expenseDate: { type: String, default: '' },
    receiptNumber: { type: String, default: '' },
    receiptUrl: { type: String, default: '' },
    notes: { type: String, default: '' },
    litersFilled: { type: Number, default: 0 },
    tollPlazaName: { type: String, default: '' },
    paymentMode: {
      type: String,
      default: 'Fastag / UPI'
    },
    paymentMethod: { type: String, default: 'Bank Transfer' },
    paymentReference: { type: String, default: '' },
    paymentDate: { type: String, default: '' },
    status: {
      type: String,
      default: 'Pending Approval',
      enum: ['Pending', 'Pending Approval', 'Approved', 'Rejected', 'Paid', 'Verified', 'Reimbursed']
    },
    approvedBy: { type: String, default: '' },
    approvedAt: { type: Date, default: null },
    rejectionReason: { type: String, default: '' },
    paidBy: { type: String, default: '' },
    paidAt: { type: Date, default: null },
    journalEntryNo: { type: String, default: '' }
  },
  {
    timestamps: true,
    collection: 'expenses'
  }
);

expenseSchema.index({ tenantId: 1, id: 1 }, { unique: true, sparse: true });
expenseSchema.index({ tenantId: 1, category: 1 });
expenseSchema.index({ tenantId: 1, status: 1 });

export const Expense = mongoose.models.Expense || mongoose.model('Expense', expenseSchema);
export default Expense;
