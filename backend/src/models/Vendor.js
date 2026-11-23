// MAK Tours & Travels ERP - Dedicated Vendor / Partner Model
// Collection: vendors (Separate collection for Vendors)
import mongoose from 'mongoose';

const vendorSchema = new mongoose.Schema(
  {
    tenantId: { type: String, default: 'mak-tours', index: true, lowercase: true, trim: true },
    vendorId: { type: String, sparse: true, index: true },
    id: { type: String, index: true },
    companyName: { type: String, required: true },
    name: { type: String },
    ownerName: { type: String, default: '' },
    contactPerson: { type: String, default: '' },
    phone: { type: String, required: true },
    email: { type: String, default: '' },
    password: { type: String, default: 'Vendor@123' },
    role: { type: String, default: 'vendor' },
    gstin: { type: String, default: '' },
    panNumber: { type: String, default: '' },
    address: { type: String, default: '' },
    city: { type: String, default: 'Chennai' },
    state: { type: String, default: 'Tamil Nadu' },
    pincode: { type: String, default: '' },
    contractPayoutPercent: { type: Number, default: 85 },
    commissionRate: { type: Number, default: 15 },
    fleetCount: { type: Number, default: 0 },
    totalVehiclesAttached: { type: Number, default: 0 },
    vehiclesAssigned: { type: [String], default: [] },
    driversCount: { type: Number, default: 0 },
    rating: { type: Number, default: 5.0 },
    bankDetails: {
      accountHolderName: { type: String, default: '' },
      accountNumber: { type: String, default: '' },
      ifscCode: { type: String, default: '' },
      bankName: { type: String, default: '' },
      branch: { type: String, default: '' },
      upiId: { type: String, default: '' }
    },
    documents: {
      gstCertUrl: { type: String, default: '' },
      panCardUrl: { type: String, default: '' },
      contractAgreementUrl: { type: String, default: '' }
    },
    avatar: { type: String, default: '' },
    status: { type: String, default: 'Active', enum: ['Active', 'Pending Verification', 'Suspended', 'Inactive'] }
  },
  {
    timestamps: true,
    collection: 'vendors' // Dedicated Vendors collection
  }
);

vendorSchema.pre('save', function (next) {
  if (!this.name && this.companyName) {
    this.name = this.companyName;
  }
  if (!this.contactPerson && this.ownerName) {
    this.contactPerson = this.ownerName;
  }
  if (!this.id && this.vendorId) {
    this.id = this.vendorId;
  }
  if (typeof next === 'function') next();
});

vendorSchema.index({ tenantId: 1, vendorId: 1 }, { unique: true, sparse: true });
vendorSchema.index({ tenantId: 1, phone: 1 });

export const Vendor = mongoose.models.Vendor || mongoose.model('Vendor', vendorSchema);
export default Vendor;
