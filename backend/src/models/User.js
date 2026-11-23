// MAK Tours & Travels ERP - User Model
// Collection: users (Existing Atlas collection)
import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    tenantId: { type: String, default: 'mak-tours', index: true, lowercase: true, trim: true },
    fullName: { type: String, required: true },
    name: { type: String },
    email: { type: String, required: true, unique: true, index: true },
    mobileNumber: { type: String, default: '' },
    phone: { type: String, default: '' },
    password: { type: String, required: true },
    role: {
      type: String,
      default: 'company_admin',
      enum: [
        'super_admin',
        'admin',
        'company_admin',
        'operations',
        'driver',
        'vendor',
        'customer',
        'staff',
        'employee',
        'finance_admin',
        'accountant',
        'fleet_manager'
      ]
    },
    portal: {
      type: String,
      default: 'admin',
      enum: ['super-admin', 'admin', 'accountant', 'driver', 'vendor', 'customer', 'staff']
    },
    permissions: {
      type: [String],
      default: []
    },
    designation: { type: String, default: '' },
    avatar: { type: String, default: '' },
    company: { type: String, default: 'MAK Tours & Travels Operations' },
    location: { type: String, default: 'Head Office, Chennai' },
    driverBadgeId: { type: String, default: '' },
    vendorId: { type: String, default: '' },
    employeeCode: { type: String, default: '' },
    employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
    isActive: { type: Boolean, default: true },
    status: { type: String, default: 'Active' }
  },
  {
    timestamps: true,
    collection: 'users' // Existing Atlas collection
  }
);

userSchema.pre('save', function (next) {
  if (!this.name && this.fullName) {
    this.name = this.fullName;
  }
  if (!this.phone && this.mobileNumber) {
    this.phone = this.mobileNumber;
  }
  if (typeof next === 'function') {
    return next();
  }
});

export const User = mongoose.models.User || mongoose.model('User', userSchema);
export default User;
