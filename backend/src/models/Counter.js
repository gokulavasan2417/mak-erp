// MAK Tours & Travels ERP - Atomic Multi-Tenant Sequence Counter Model
// Collection: counters
import mongoose from 'mongoose';

const counterSchema = new mongoose.Schema(
  {
    tenantId: {
      type: String,
      required: true,
      index: true,
      lowercase: true,
      trim: true
    },
    sequenceName: {
      type: String,
      required: true,
      trim: true
    },
    seq: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true,
    collection: 'counters'
  }
);

// Compound unique index ensuring each tenant has independent sequences
counterSchema.index({ tenantId: 1, sequenceName: 1 }, { unique: true });

export const Counter = mongoose.models.Counter || mongoose.model('Counter', counterSchema);
export default Counter;
