// MAK Tours & Travels ERP - Configurable Payroll Policy Model
// Collection: payroll_policies
import mongoose from 'mongoose';

const payrollPolicySchema = new mongoose.Schema(
  {
    tenantId: { type: String, default: 'mak-tours', index: true, lowercase: true, trim: true },
    name: { type: String, default: 'Standard Corporate Policy' },
    isDefault: { type: Boolean, default: true },
    payrollStartDate: { type: Number, default: 1 },
    payrollEndDate: { type: Number, default: 30 },
    payrollWorkingDays: { type: Number, default: 26 },
    calculationMethod: {
      type: String,
      default: 'Fixed Payroll Working Days',
      enum: ['Calendar Days', 'Fixed Payroll Working Days', 'Actual Scheduled Working Days']
    },
    weeklyOffDays: { type: [String], default: ['Sunday'] },
    publicHolidays: [
      {
        date: { type: String, required: true },
        name: { type: String, required: true }
      }
    ],
    paidLeaveRules: {
      maxPaidLeavesPerMonth: { type: Number, default: 2 },
      payPercent: { type: Number, default: 100 }
    },
    unpaidLeaveRules: {
      deductPerDay: { type: Boolean, default: true }
    },
    halfDayRules: {
      payFactor: { type: Number, default: 0.5 }
    },
    overtimeRules: {
      enabled: { type: Boolean, default: true },
      hourlyMultiplier: { type: Number, default: 1.5 },
      fixedHourlyRate: { type: Number, default: 150 }
    },
    driverAllowanceRules: {
      perTripAllowance: { type: Number, default: 300 },
      nightAllowance: { type: Number, default: 250 },
      longDistanceThresholdKm: { type: Number, default: 250 },
      longDistanceAllowance: { type: Number, default: 400 },
      overnightAllowance: { type: Number, default: 500 },
      extraDutyAllowance: { type: Number, default: 350 },
      standbyDailyAllowance: { type: Number, default: 450 }
    },
    nightShiftStart: { type: String, default: '22:00' },
    nightShiftEnd: { type: String, default: '06:00' },
    statutory: {
      pf: {
        enabled: { type: Boolean, default: true },
        employeeRate: { type: Number, default: 0.12 },
        employerRate: { type: Number, default: 0.12 },
        wageCeiling: { type: Number, default: 15000 },
        enforceCeiling: { type: Boolean, default: true }
      },
      esi: {
        enabled: { type: Boolean, default: true },
        employeeRate: { type: Number, default: 0.0075 },
        employerRate: { type: Number, default: 0.0325 },
        wageCeiling: { type: Number, default: 21000 }
      },
      professionalTax: {
        enabled: { type: Boolean, default: true },
        slabs: [
          {
            minGross: { type: Number, default: 0 },
            maxGross: { type: Number, default: 15000 },
            taxAmount: { type: Number, default: 0 }
          },
          {
            minGross: { type: Number, default: 15001 },
            maxGross: { type: Number, default: 20000 },
            taxAmount: { type: Number, default: 150 }
          },
          {
            minGross: { type: Number, default: 20001 },
            maxGross: { type: Number, default: null },
            taxAmount: { type: Number, default: 200 }
          }
        ]
      },
      applyToContractors: { type: Boolean, default: false }
    },
    salaryRounding: {
      type: String,
      default: 'Nearest Rupee',
      enum: ['Nearest Rupee', 'Exact Decimals']
    },
    isAttendanceLocked: { type: Boolean, default: false },
    approvalRequired: { type: Boolean, default: true }
  },
  {
    timestamps: true,
    collection: 'payroll_policies'
  }
);

payrollPolicySchema.index({ tenantId: 1, isDefault: 1 });

export const PayrollPolicy = mongoose.models.PayrollPolicy || mongoose.model('PayrollPolicy', payrollPolicySchema);
export default PayrollPolicy;
