// MAK Tours & Travels ERP - Software License Model
// Collection: licenses
import mongoose from 'mongoose';

const licenseSchema = new mongoose.Schema(
  {
    licenseKey: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true
    },
    tenantId: {
      type: String,
      required: true,
      index: true,
      lowercase: true,
      trim: true
    },
    companyName: {
      type: String,
      required: true
    },
    plan: {
      type: String,
      enum: ['Starter', 'Professional', 'Enterprise'],
      default: 'Professional'
    },
    status: {
      type: String,
      enum: ['Pending', 'Active', 'Suspended', 'Expired', 'Cancelled'],
      default: 'Active',
      index: true
    },
    validFrom: {
      type: Date,
      default: Date.now
    },
    validUntil: {
      type: Date,
      required: true
    },
    enabledModules: {
      type: [String],
      default: [
        'bookings',
        'fleet',
        'drivers',
        'vendors',
        'employees',
        'attendance',
        'payroll',
        'finance',
        'reports',
        'packages'
      ]
    },
    limits: {
      maxUsers: { type: Number, default: 20 },
      maxVehicles: { type: Number, default: 50 },
      maxDrivers: { type: Number, default: 50 },
      maxMonthlyBookings: { type: Number, default: 1000 }
    },
    issuedBy: {
      type: String,
      default: 'Super Admin Operations'
    },
    notes: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true,
    collection: 'licenses'
  }
);

export const License = mongoose.models.License || mongoose.model('License', licenseSchema);
export default License;
