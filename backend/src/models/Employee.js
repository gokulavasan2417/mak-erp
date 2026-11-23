// MAK Tours & Travels ERP - Dedicated Staff / Employee Model
// Collection: employees (Separate collection for Staff/Personnel)
import mongoose from 'mongoose';

const employeeSchema = new mongoose.Schema(
  {
    tenantId: { type: String, default: 'mak-tours', index: true, lowercase: true, trim: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    employeeCode: { type: String, sparse: true, index: true },
    id: { type: String, index: true },
    code: { type: String, index: true },
    fullName: { type: String, required: true },
    name: { type: String },
    email: { type: String, default: '' },
    phone: { type: String, required: true },
    password: { type: String, default: 'Staff@123' },
    role: { type: String, default: 'Operations Staff' },
    designation: { type: String, default: 'Operations Associate' },
    avatar: { type: String, default: '' },
    // Official Job & Work Particulars
    workType: {
      type: String,
      default: 'Operations Staff',
      enum: [
        'Operations Staff',
        'Booking Executive',
        'Customer Support',
        'Travel Coordinator',
        'Accountant',
        'HR Executive',
        'Marketing Executive',
        'Office Administrator',
        'IT Support',
        'Fleet Coordinator',
        'Other'
      ]
    },
    jobRole: { type: String, default: 'Operations Associate' },
    reportingManager: { type: String, default: 'Ananya Deshmukh (General Operations Manager)' },
    workLocation: { type: String, default: 'Chennai HQ - Main Operations Center' },
    employmentType: {
      type: String,
      default: 'Full-Time',
      enum: ['Full-Time', 'Part-Time', 'Contract', 'Probation']
    },
    responsibilities: {
      type: [String],
      default: ['Live driver dispatch', 'Customer coordination', 'Fleet telemetry tracking']
    },
    salaryBasis: {
      type: String,
      default: 'Attendance-Based Monthly Salary',
      enum: [
        'Monthly Fixed Salary',
        'Attendance-Based Monthly Salary',
        'Daily Wage',
        'Contract'
      ]
    },
    department: {
      type: String,
      default: 'Operations & Dispatch',
      enum: [
        'Operations & Dispatch',
        'Fleet Logistics',
        'Finance & Accounts',
        'Tour Packages & Sales',
        'Customer Support',
        'IT & Engineering'
      ]
    },
    shift: {
      type: String,
      default: 'General (09:30 - 18:30)',
      enum: [
        'General (09:30 - 18:30)',
        'Morning Shift (06:00 - 15:00)',
        'Afternoon Shift (14:00 - 22:30)',
        'Night Shift (21:00 - 06:00)'
      ]
    },
    monthlySalary: { type: Number, default: 45000 },
    salary: { type: Number, default: 45000 },
    // Advanced Attendance-Based Payroll Extensions
    salaryCategory: {
      type: String,
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
    salaryStructure: {
      basicSalary: { type: Number, default: 25000 },
      hra: { type: Number, default: 10000 },
      fixedAllowances: { type: Number, default: 5000 },
      fixedIncentives: { type: Number, default: 5000 },
      dailyWage: { type: Number, default: 1200 },
      perTripRate: { type: Number, default: 1500 },
      contractTerms: {
        rate: { type: Number, default: 50000 },
        description: { type: String, default: 'Standard Monthly Service Contract' }
      },
      pfDeduction: { type: Number, default: 0 },
      esiDeduction: { type: Number, default: 350 },
      tdsDeduction: { type: Number, default: 0 },
      professionalTax: { type: Number, default: 200 }
    },
    isDriver: { type: Boolean, default: false },
    driverId: { type: String, default: '' },
    allowanceConfig: {
      perTripAllowance: { type: Number, default: 300 },
      nightAllowance: { type: Number, default: 250 },
      longDistanceAllowance: { type: Number, default: 400 },
      overnightAllowance: { type: Number, default: 500 },
      extraDutyAllowance: { type: Number, default: 350 }
    },
    salaryRevisionHistory: [
      {
        revisionId: { type: String },
        previousSalary: { type: Number, default: 0 },
        newSalary: { type: Number, required: true },
        effectiveDate: { type: String, required: true },
        salaryCategory: { type: String },
        previousStructure: { type: mongoose.Schema.Types.Mixed },
        newStructure: { type: mongoose.Schema.Types.Mixed },
        updatedBy: { type: String, default: 'Operations Admin' },
        updatedAt: { type: Date, default: Date.now },
        remarks: { type: String, default: '' }
      }
    ],
    joiningDate: { type: String, default: () => new Date().toISOString().split('T')[0] },
    attendanceToday: {
      type: String,
      default: 'Not Marked'
    },
    leavesLeft: { type: Number, default: 18 },
    leavesBalance: { type: Number, default: 18 },
    leavesTaken: { type: Number, default: 0 },
    address: { type: String, default: '' },
    dob: { type: String, default: '' },
    gender: { type: String, default: '' },
    emergencyContact: { type: String, default: '' },
    emergencyContactName: { type: String, default: '' },
    emergencyContactPhone: { type: String, default: '' },
    bloodGroup: { type: String, default: '' },
    bankDetails: {
      accountNumber: { type: String, default: '' },
      ifscCode: { type: String, default: '' },
      bankName: { type: String, default: '' }
    },
    status: {
      type: String,
      default: 'Active',
      enum: [
        'Pending',
        'Registered',
        'Pending Admin Approval',
        'Active',
        'Approved',
        'On Leave',
        'Probation',
        'Terminated',
        'Inactive',
        'Rejected'
      ]
    }
  },
  {
    timestamps: true,
    collection: 'employees' // Dedicated Staff / Employees collection
  }
);

employeeSchema.pre('save', function (next) {
  if (!this.name && this.fullName) {
    this.name = this.fullName;
  }
  if (!this.fullName && this.name) {
    this.fullName = this.name;
  }
  if (!this.code && this.employeeCode) {
    this.code = this.employeeCode;
  }
  if (!this.employeeCode && this.code) {
    this.employeeCode = this.code;
  }
  if (!this.id && this.employeeCode) {
    this.id = this.employeeCode;
  }
  if (!this.salary && this.monthlySalary) {
    this.salary = this.monthlySalary;
  }
  if (typeof next === 'function') {
    return next();
  }
});

employeeSchema.index({ tenantId: 1, employeeCode: 1 }, { unique: true, sparse: true });
employeeSchema.index({ tenantId: 1, email: 1 });

export const Employee = mongoose.models.Employee || mongoose.model('Employee', employeeSchema);
export default Employee;
