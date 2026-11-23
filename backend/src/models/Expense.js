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
      enum: [
        'Fuel',
        'Toll Plaza',
        'Parking',
        'Driver Allowance',
        'Chauffeur Bata',
        'Maintenance',
        'State Permit Tax',
        'Food & Refreshments',
        'Office',
        'Salary',
        'Vendor',
        'Trip',
        'Other'
      ]
    },
    amount: { type: Number, required: true },
    date: { type: String, default: () => new Date().toISOString().split('T')[0] },
    receiptNumber: { type: String, default: '' },
    receiptUrl: { type: String, default: '' },
    notes: { type: String, default: '' },
    odometerKm: { type: Number, default: 0 },
    litersFilled: { type: Number, default: 0 },
    tollPlazaName: { type: String, default: '' },
    paymentMode: {
      type: String,
      default: 'Fastag / UPI',
      enum: ['Cash', 'UPI', 'Bank Transfer', 'Card', 'Fastag', 'Fastag / UPI', 'Company Card', 'Driver Personal Advance']
    },
    status: {
      type: String,
      default: 'Pending',
      enum: ['Pending', 'Approved', 'Rejected', 'Paid', 'Verified', 'Reimbursed']
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
