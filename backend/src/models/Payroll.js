// MAK Tours & Travels ERP - Monthly Employee & Driver Payroll Model
// Collection: payrolls
import mongoose from 'mongoose';

const payrollSchema = new mongoose.Schema(
  {
    tenantId: { type: String, default: 'mak-tours', index: true, lowercase: true, trim: true },
    payrollCode: { type: String, index: true },
    month: { type: String, required: true, index: true }, // Format: YYYY-MM (e.g. '2026-11')
    employeeId: { type: String, required: true, index: true },
    employeeCode: { type: String, index: true },
    employeeName: { type: String, required: true },
    designation: { type: String, default: 'Operations Associate' },
    department: { type: String, default: 'Operations & Dispatch' },
    salaryCategory: {
      type: String,
      required: true,
      default: 'Category A',
      enum: [
        'Category A',
        'Category B',
        'Category C',
        'Category D',
        'Category E',
        'Category A – Fixed Monthly',
        'Category B – Monthly + Trip Allowances',
        'Category C – Trip-Based Driver',
        'Category D – Daily Wage',
        'Category E – Contract'
      ]
    },
    isDriver: { type: Boolean, default: false },
    driverId: { type: String, default: '' },
    status: {
      type: String,
      required: true,
      default: 'Calculated',
      enum: ['Draft', 'Calculated', 'Under Review', 'Approved', 'Partially Paid', 'Paid', 'Settled', 'Cancelled']
    },

    // Policy Snapshot captured at time of calculation
    policySnapshot: {
      payrollWorkingDays: { type: Number, default: 26 },
      payrollStartDate: { type: String, default: '01' },
      payrollEndDate: { type: String, default: '30' },
      calculationMethod: {
        type: String,
        default: 'Fixed Payroll Working Days',
        enum: ['Calendar Days', 'Fixed Payroll Working Days', 'Actual Scheduled Working Days']
      }
    },

    // Attendance breakdown for the month
    attendanceSummary: {
      totalScheduledDays: { type: Number, default: 26 },
      presentOfficeDays: { type: Number, default: 0 },
      presentTripDays: { type: Number, default: 0 },
      presentStandbyDays: { type: Number, default: 0 },
      presentOtherDutyDays: { type: Number, default: 0 },
      totalPresentDays: { type: Number, default: 0 },
      paidLeaveDays: { type: Number, default: 0 },
      unpaidLeaveDays: { type: Number, default: 0 },
      halfDays: { type: Number, default: 0 },
      absentDays: { type: Number, default: 0 },
      weeklyOffDays: { type: Number, default: 4 },
      publicHolidays: { type: Number, default: 1 },
      payableDays: { type: Number, default: 26 },
      overtimeHours: { type: Number, default: 0 }
    },

    // Driver Trip Activity & Allowances (For Category B & C)
    driverTripSummary: {
      totalEligibleTrips: { type: Number, default: 0 },
      totalTripDistanceKm: { type: Number, default: 0 },
      perTripAllowanceTotal: { type: Number, default: 0 },
      nightAllowanceTotal: { type: Number, default: 0 },
      longDistanceAllowanceTotal: { type: Number, default: 0 },
      overnightAllowanceTotal: { type: Number, default: 0 },
      extraDutyAllowanceTotal: { type: Number, default: 0 },
      totalAllowances: { type: Number, default: 0 },
      tripDetails: [
        {
          tripId: { type: String },
          bookingNumber: { type: String },
          date: { type: String },
          route: { type: String },
          allowancesEarned: { type: Number, default: 0 }
        }
      ]
    },

    // Detailed Earnings Breakdown
    earningsBreakdown: {
      basicSalary: { type: Number, default: 0 },
      hra: { type: Number, default: 0 },
      fixedAllowances: { type: Number, default: 0 },
      fixedIncentives: { type: Number, default: 0 },
      monthlyGrossSalary: { type: Number, default: 0 },
      // Attendance-proportionate pay: Gross / WorkingDays × PayableDays
      attendancePay: { type: Number, default: 0 },
      tripAllowances: { type: Number, default: 0 },
      approvedOvertimePay: { type: Number, default: 0 },
      approvedIncentives: { type: Number, default: 0 },
      otherAllowances: { type: Number, default: 0 },
      grossEarnings: { type: Number, default: 0 },
      isProRata: { type: Boolean, default: false },
      proRataDetails: { type: mongoose.Schema.Types.Mixed, default: null }
    },

    // Salary Revision History snapshot
    salaryRevisionHistory: [
      {
        revisionId: { type: String },
        previousSalary: { type: Number },
        newSalary: { type: Number },
        effectiveDate: { type: String },
        salaryCategory: { type: String },
        updatedBy: { type: String },
        updatedAt: { type: Date },
        remarks: { type: String }
      }
    ],

    // Detailed Deductions Breakdown
    deductionsBreakdown: {
      unpaidLeaveDeduction: { type: Number, default: 0 },
      pfDeduction: { type: Number, default: 0 },
      esiDeduction: { type: Number, default: 0 },
      tdsDeduction: { type: Number, default: 0 },
      professionalTax: { type: Number, default: 0 },
      advanceSalaryDeduction: { type: Number, default: 0 },
      otherDeductions: { type: Number, default: 0 },
      totalDeductions: { type: Number, default: 0 }
    },

    // Final Net Salary
    netPayableSalary: { type: Number, required: true },
    totalPaidAmount: { type: Number, default: 0 },
    outstandingSalary: { type: Number, default: 0 },

    // Approval information
    approvalInfo: {
      approvedBy: { type: String, default: null },
      approvedAt: { type: Date, default: null },
      remarks: { type: String, default: '' }
    },

    // Payment History records
    paymentHistory: [
      {
        paymentRef: { type: String },
        amount: { type: Number },
        paymentDate: { type: String },
        paymentMethod: { type: String },
        transactionRef: { type: String },
        recordedBy: { type: String }
      }
    ],

    notes: { type: String, default: '' }
  },
  {
    timestamps: true,
    collection: 'payrolls'
  }
);

// Compound index to guarantee one payroll snapshot per employee per month per tenant
payrollSchema.index({ tenantId: 1, employeeId: 1, month: 1 }, { unique: true });
payrollSchema.index({ tenantId: 1, payrollCode: 1 }, { unique: true, sparse: true });

payrollSchema.pre('save', function (next) {
  if (!this.payrollCode) {
    const cleanId = String(this.employeeCode || this.employeeId).replace(/[^A-Za-z0-9]/g, '');
    this.payrollCode = `PAY-${this.month.replace('-', '')}-${cleanId}`;
  }
  this.outstandingSalary = Math.max(0, Math.round(this.netPayableSalary - (this.totalPaidAmount || 0)));
  // Guard Cancelled status from being overwritten
  if (this.status !== 'Cancelled') {
    if (this.totalPaidAmount > 0 && this.outstandingSalary > 0) {
      this.status = 'Partially Paid';
    } else if (this.totalPaidAmount > 0 && this.outstandingSalary === 0) {
      this.status = 'Paid';
    }
  }
  if (typeof next === 'function') next();
});

export const Payroll = mongoose.models.Payroll || mongoose.model('Payroll', payrollSchema);
export default Payroll;
