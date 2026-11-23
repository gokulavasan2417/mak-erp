// MAK Tours & Travels ERP - Driver Settlement Model
// Collection: driver_settlements
import mongoose from 'mongoose';

const tripBreakdownSchema = new mongoose.Schema(
  {
    tripId: { type: String, required: true },
    bookingRef: { type: String, default: '' },
    date: { type: String, default: '' },
    distanceKm: { type: Number, default: 0 },
    isNightDuty: { type: Boolean, default: false },
    isOvernightDuty: { type: Boolean, default: false },
    allowanceAmount: { type: Number, default: 0 }
  },
  { _id: false }
);

const driverSettlementSchema = new mongoose.Schema(
  {
    tenantId: {
      type: String,
      required: true,
      index: true,
      lowercase: true,
      trim: true
    },
    settlementNo: {
      type: String,
      required: true,
      trim: true
    },
    driverId: {
      type: String,
      required: true,
      index: true
    },
    driverName: {
      type: String,
      required: true
    },
    driverPhone: {
      type: String,
      default: ''
    },
    periodStart: {
      type: String,
      required: true
    },
    periodEnd: {
      type: String,
      required: true
    },
    trips: [tripBreakdownSchema],
    tripCount: {
      type: Number,
      default: 0
    },
    grossEarnings: {
      type: Number,
      required: true,
      min: 0
    },
    advancesDeducted: {
      type: Number,
      default: 0,
      min: 0
    },
    otherDeductions: {
      type: Number,
      default: 0,
      min: 0
    },
    deductionReason: {
      type: String,
      default: ''
    },
    netSettlementAmount: {
      type: Number,
      required: true,
      min: 0
    },
    amountPaid: {
      type: Number,
      default: 0,
      min: 0
    },
    balanceDue: {
      type: Number,
      default: 0,
      min: 0
    },
    status: {
      type: String,
      enum: ['Draft', 'Approved', 'Paid', 'Partially Paid', 'Cancelled'],
      default: 'Draft'
    },
    paymentMethod: {
      type: String,
      enum: ['UPI', 'Cash', 'Bank Transfer'],
      default: 'UPI'
    },
    settledAt: {
      type: Date,
      default: null
    },
    settledBy: {
      type: String,
      default: ''
    },
    notes: {
      type: String,
      default: ''
    },
    journalEntryNo: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true,
    collection: 'driver_settlements'
  }
);

driverSettlementSchema.index({ tenantId: 1, settlementNo: 1 }, { unique: true });
driverSettlementSchema.index({ tenantId: 1, driverId: 1, status: 1 });

driverSettlementSchema.pre('save', function (next) {
  this.tripCount = Array.isArray(this.trips) ? this.trips.length : 0;
  this.netSettlementAmount = Math.max(0, (this.grossEarnings || 0) - (this.advancesDeducted || 0) - (this.otherDeductions || 0));
  this.balanceDue = Math.max(0, this.netSettlementAmount - (this.amountPaid || 0));

  if (this.status !== 'Cancelled') {
    if (this.netSettlementAmount > 0 && this.amountPaid >= this.netSettlementAmount) {
      this.status = 'Paid';
    } else if (this.amountPaid > 0 && this.amountPaid < this.netSettlementAmount) {
      this.status = 'Partially Paid';
    }
  }

  if (typeof next === 'function') next();
});

export const DriverSettlement = mongoose.models.DriverSettlement || mongoose.model('DriverSettlement', driverSettlementSchema);
export default DriverSettlement;