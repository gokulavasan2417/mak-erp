// MAK Tours & Travels ERP - Multi-Tenant Customer Model
// Collection: customers
import mongoose from 'mongoose';

const customerSchema = new mongoose.Schema(
  {
    tenantId: { type: String, default: 'mak-tours', index: true, lowercase: true, trim: true },
    id: { type: String, index: true },
    name: { type: String, required: true },
    email: { type: String, default: '' },
    phone: { type: String, required: true },
    type: { type: String, default: 'Individual', enum: ['Individual', 'Corporate'] },
    companyName: { type: String, default: '' },
    gstin: { type: String, default: '' },
    address: { type: String, default: '' },
    city: { type: String, default: 'Chennai' },
    state: { type: String, default: 'Tamil Nadu' },
    status: { type: String, default: 'Active', enum: ['Active', 'Inactive', 'Suspended'] },
    totalBookings: { type: Number, default: 0 },
    totalSpent: { type: Number, default: 0 },
    rating: { type: Number, default: 5.0 },
    notes: { type: String, default: '' }
  },
  {
    timestamps: true,
    collection: 'customers'
  }
);

customerSchema.index({ tenantId: 1, phone: 1 });
customerSchema.index({ tenantId: 1, id: 1 });
customerSchema.index({ tenantId: 1, email: 1 });

export const Customer = mongoose.models.Customer || mongoose.model('Customer', customerSchema);
export default Customer;
