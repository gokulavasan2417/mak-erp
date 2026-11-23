// MAK Tours & Travels ERP - Salary Disbursement & Payment Model
// Collection: salary_payments
import mongoose from 'mongoose';

const salaryPaymentSchema = new mongoose.Schema(
  {
    tenantId: { type: String, default: 'mak-tours', index: true, lowercase: true, trim: true },
    paymentRef: { type: String, index: true },
    payrollId: { type: mongoose.Schema.Types.ObjectId, ref: 'Payroll', required: true, index: true },
    payrollCode: { type: String, index: true },
    employeeId: { type: String, required: true, index: true },
    employeeName: { type: String, required: true },
    month: { type: String, required: true, index: true },
    amount: { type: Number, required: true },
    paymentDate: { type: String, required: true },
    paymentMethod: {
      type: String,
      required: true,
      default: 'Bank Transfer',
      enum: ['Bank Transfer', 'UPI', 'Cash', 'Cheque', 'Other']
    },
    transactionRef: { type: String, required: true },
    bankDetails: {
      accountNumber: { type: String, default: '' },
      ifscCode: { type: String, default: '' },
      bankName: { type: String, default: '' }
    },
    notes: { type: String, default: '' },
    recordedBy: { type: String, default: 'Accounts & HR Desk' }
  },
  {
    timestamps: true,
    collection: 'salary_payments'
  }
);

salaryPaymentSchema.pre('save', function (next) {
  if (!this.paymentRef) {
    const randomHex = Math.random().toString(36).substring(2, 8).toUpperCase();
    this.paymentRef = `SAL-TXN-${Date.now()}-${randomHex}`;
  }
  if (typeof next === 'function') next();
});

salaryPaymentSchema.index({ tenantId: 1, paymentRef: 1 }, { unique: true, sparse: true });
salaryPaymentSchema.index({ tenantId: 1, payrollId: 1 });

export const SalaryPayment = mongoose.models.SalaryPayment || mongoose.model('SalaryPayment', salaryPaymentSchema);
export default SalaryPayment;
