// MAK Tours & Travels ERP - Multi-Tenant Company Model
// Collection: companies
import mongoose from 'mongoose';

const companySchema = new mongoose.Schema(
  {
    tenantId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      lowercase: true,
      trim: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    legalName: {
      type: String,
      default: ''
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true
    },
    phone: {
      type: String,
      default: ''
    },
    address: {
      type: String,
      default: ''
    },
    city: {
      type: String,
      default: 'Chennai'
    },
    state: {
      type: String,
      default: 'Tamil Nadu'
    },
    pincode: {
      type: String,
      default: ''
    },
    gstin: {
      type: String,
      default: ''
    },
    panNumber: {
      type: String,
      default: ''
    },
    status: {
      type: String,
      enum: ['Pending', 'Active', 'Suspended', 'Rejected'],
      default: 'Pending',
      index: true
    },
    rejectionReason: {
      type: String,
      default: ''
    },
    suspensionReason: {
      type: String,
      default: ''
    },
    // Subscription & License Snapshot
    plan: {
      type: String,
      enum: ['Starter', 'Professional', 'Enterprise'],
      default: 'Professional'
    },
    licenseKey: {
      type: String,
      unique: true,
      sparse: true,
      index: true
    },
    licenseStatus: {
      type: String,
      enum: ['Pending', 'Active', 'Suspended', 'Expired', 'Cancelled'],
      default: 'Pending'
    },
    licenseStart: {
      type: Date,
      default: Date.now
    },
    licenseExpiry: {
      type: Date
    },
    // Feature Access
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
    // Resource Limits
    limits: {
      maxUsers: { type: Number, default: 20 },
      maxVehicles: { type: Number, default: 50 },
      maxDrivers: { type: Number, default: 50 },
      maxMonthlyBookings: { type: Number, default: 1000 }
    },
    // Dynamic Branding & Configuration
    branding: {
      logo: { type: String, default: '' },
      primaryColor: { type: String, default: '#2C3480' },
      accentColor: { type: String, default: '#EAB308' },
      tagline: { type: String, default: 'Premium Travels & Tour Operations' },
      invoicePrefix: { type: String, default: 'INV-' },
      receiptPrefix: { type: String, default: 'RCPT-' },
      bookingPrefix: { type: String, default: 'BK-' },
      currency: { type: String, default: 'INR' },
      currencySymbol: { type: String, default: '₹' },
      timezone: { type: String, default: 'Asia/Kolkata' }
    },
    // Primary Company Admin
    primaryAdmin: {
      name: { type: String, default: '' },
      email: { type: String, default: '' },
      phone: { type: String, default: '' },
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
    },
    notes: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true,
    collection: 'companies'
  }
);

companySchema.index({ status: 1, createdAt: -1 });

export const Company = mongoose.models.Company || mongoose.model('Company', companySchema);
export default Company;
