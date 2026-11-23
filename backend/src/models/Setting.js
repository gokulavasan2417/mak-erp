// MAK Tours & Travels ERP - Application Settings Model
// Collection: settings (Multi-tenant scoped)
import mongoose from 'mongoose';

const settingSchema = new mongoose.Schema(
  {
    tenantId: { type: String, default: 'mak-tours', index: true, lowercase: true, trim: true },
    key: { type: String, required: true, index: true },
    value: { type: mongoose.Schema.Types.Mixed, required: true }
  },
  {
    timestamps: true,
    collection: 'settings'
  }
);

settingSchema.index({ tenantId: 1, key: 1 }, { unique: true });

export const Setting = mongoose.models.Setting || mongoose.model('Setting', settingSchema);
export default Setting;
