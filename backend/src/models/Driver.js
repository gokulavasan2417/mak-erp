// MAK Tours & Travels ERP - Dedicated Driver Model
// Collection: drivers (Separate collection for Drivers)
import mongoose from 'mongoose';

const driverSchema = new mongoose.Schema(
  {
    tenantId: { type: String, default: 'mak-tours', index: true, lowercase: true, trim: true },
    driverBadgeId: { type: String, sparse: true, index: true },
    id: { type: String, index: true },
    fullName: { type: String, required: true },
    name: { type: String },
    phone: { type: String, required: true },
    email: { type: String, default: '' },
    password: { type: String, default: 'Driver@123' },
    role: { type: String, default: 'driver' },
    licenseNumber: { type: String, default: '' },
    licenseExpiry: { type: String, default: '' },
    badgeNumber: { type: String, default: '' },
    experienceYears: { type: Number, default: 3 },
    rating: { type: Number, default: 5.0 },
    dutyStatus: {
      type: String,
      default: 'Available',
      enum: ['Available', 'On Duty', 'Assigned', 'On Trip', 'Resting', 'Off Duty', 'Leave']
    },
    assignedVehicleId: { type: String, default: '' },
    assignedVehicleName: { type: String, default: '' },
    assignedVehicleReg: { type: String, default: '' },
    address: { type: String, default: '' },
    city: { type: String, default: 'Chennai' },
    state: { type: String, default: 'Tamil Nadu' },
    emergencyContact: { type: String, default: '' },
    bloodGroup: { type: String, default: '' },
    policeVerified: { type: Boolean, default: true },
    medicalFitnessValid: { type: Boolean, default: true },
    allowancePerDay: { type: Number, default: 600 },
    bataRate: { type: Number, default: 450 },
    perTripRate: { type: Number, default: 1500 },
    monthlySalary: { type: Number, default: 0 },
    salaryCategory: { type: String, default: 'Category B' },
    salaryStructure: {
      basicSalary: { type: Number, default: 0 },
      hra: { type: Number, default: 0 },
      fixedAllowances: { type: Number, default: 0 },
      fixedIncentives: { type: Number, default: 0 },
      dailyWage: { type: Number, default: 0 },
      perTripRate: { type: Number, default: 1500 },
      pfDeduction: { type: Number, default: 0 },
      esiDeduction: { type: Number, default: 0 },
      professionalTax: { type: Number, default: 0 },
      tdsDeduction: { type: Number, default: 0 }
    },
    salaryRevisionHistory: [
      {
        revisionId: { type: String },
        previousSalary: { type: Number, default: 0 },
        newSalary: { type: Number, required: true },
        effectiveDate: { type: String, required: true },
        salaryCategory: { type: String },
        updatedBy: { type: String, default: 'Operations Admin' },
        updatedAt: { type: Date, default: Date.now },
        remarks: { type: String, default: '' }
      }
    ],
    bankDetails: {
      accountNumber: { type: String, default: '' },
      ifscCode: { type: String, default: '' },
      bankName: { type: String, default: '' },
      upiId: { type: String, default: '' }
    },
    documents: {
      drivingLicenseUrl: { type: String, default: '' },
      aadharUrl: { type: String, default: '' },
      policeVerificationUrl: { type: String, default: '' },
      medicalCertUrl: { type: String, default: '' }
    },
    totalTripsCompleted: { type: Number, default: 0 },
    totalEarnings: { type: Number, default: 0 },
    avatar: { type: String, default: '' },
    status: { type: String, default: 'Active', enum: ['Active', 'Pending Verification', 'Suspended', 'Inactive'] }
  },
  {
    timestamps: true,
    collection: 'drivers' // Dedicated Drivers collection
  }
);

driverSchema.pre('save', function (next) {
  if (!this.name && this.fullName) {
    this.name = this.fullName;
  }
  if (!this.fullName && this.name) {
    this.fullName = this.name;
  }
  if (!this.id && this.driverBadgeId) {
    this.id = this.driverBadgeId;
  }
  if (typeof next === 'function') next();
});

driverSchema.index({ tenantId: 1, driverBadgeId: 1 }, { unique: true, sparse: true });
driverSchema.index({ tenantId: 1, phone: 1 });

export const Driver = mongoose.models.Driver || mongoose.model('Driver', driverSchema);
export default Driver;
