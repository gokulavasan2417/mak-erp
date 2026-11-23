import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema(
  {
    tenantId: { type: String, default: 'mak-tours', index: true, lowercase: true, trim: true },
    id: { type: String, index: true },
    refId: { type: String, index: true },
    bookingNumber: { type: String, index: true },
    bookingId: { type: String, index: true },
    userId: { type: mongoose.Schema.Types.Mixed, default: null },
    fullName: { type: String, default: '' },
    customerName: { type: String, default: '' },
    name: { type: String, default: '' },
    mobileNumber: { type: String, default: '' },
    customerPhone: { type: String, default: '' },
    phone: { type: String, default: '' },
    customerEmail: { type: String, default: '' },
    email: { type: String, default: '' },
    // CRITICAL: ONE WAY TRIP IS STRICTLY FORBIDDEN. Only Round Trip, Local Trip, Tour Package, Airport Transfer, or Custom Journey
    bookingType: {
      type: String,
      required: true,
      validate: {
        validator: function (v) {
          return !v || !v.toLowerCase().includes('one way');
        },
        message: 'ONE WAY TRIP IS STRICTLY PROHIBITED IN MAK TOURS ERP'
      }
    },
    tripType: { type: String, default: 'Round Trip' },
    assignedVehicleReg: { type: String, default: '' },
    distanceKm: { type: Number, default: 0 },
    vehicleId: { type: String, default: '' },
    vehicleName: { type: String, default: '' },
    vehicleCategory: { type: String, default: '' },
    passengers: { type: Number, default: 1 },
    pricing: { type: Number, default: 0 },
    fare: { type: Number, default: 0 },
    totalFare: { type: Number, default: 0 },
    totalAmount: { type: Number, default: 0 },
    advancePaid: { type: Number, default: 0 },
    advancePayment: { type: Number, default: 0 },
    amountPaid: { type: Number, default: 0 },
    balanceDue: { type: Number, default: 0 },
    balanceAmount: { type: Number, default: 0 },
    paymentOption: { type: String, default: 'Pay on Departure' },
    paymentStatus: { type: String, default: 'unpaid' },
    bookingStatus: { type: String, default: 'Confirmed' },
    status: { type: String, default: 'Confirmed' },
    fromLocation: { type: String, default: '' },
    toLocation: { type: String, default: '' },
    pickupLocation: { type: String, default: '' },
    dropLocation: { type: String, default: '' },
    travelDate: { type: String, default: '' },
    pickupDate: { type: String, default: '' },
    pickupTime: { type: String, default: '' },
    returnDate: { type: String, default: '' },
    packageName: { type: String, default: '' },
    packageId: { type: String, default: '' },
    driverId: { type: String, default: '' },
    driverName: { type: String, default: '' },
    driverPhone: { type: String, default: '' },
    assignedDriverId: { type: String, default: '' },
    assignedDriverName: { type: String, default: '' },
    assignedDriverPhone: { type: String, default: '' },
    assignedVehicle: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    },
    assignedDriver: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    },
    assignmentTimeline: [
      {
        id: { type: String },
        timestamp: { type: String },
        event: { type: String },
        actor: { type: String, default: 'Operations Admin' },
        status: { type: String, default: 'Assigned' }
      }
    ],
    driverCompensationAmount: { type: Number, default: 0 },
    driverBaseTripPay: { type: Number, default: 0 },
    nightStayAmount: { type: Number, default: 0 },
    nightStayNights: { type: Number, default: 0 },
    nightStayRemarks: { type: String, default: '' },
    nightStayAddedByDriver: { type: Boolean, default: false },
    vendorPayoutPercent: { type: Number, default: null },
    vendorPayableAmount: { type: Number, default: 0 },
    driverAssignmentStatus: {
      type: String,
      default: 'Unassigned',
      enum: ['Unassigned', 'Pending', 'Assigned', 'Accepted', 'Declined', 'Rejected', 'Reassignment Required', 'Completed']
    },
    tripStatus: {
      type: String,
      default: 'Upcoming',
      enum: ['Upcoming', 'Draft', 'Confirmed', 'Dispatched', 'Driver Assigned', 'Awaiting Driver Acceptance', 'Driver Accepted', 'Arrived at Pickup', 'Trip Started', 'In Progress', 'In Transit', 'Driver Declined', 'Trip Completed', 'Completed', 'Cancelled']
    },
    startOdometer: { type: Number, default: 0 },
    endOdometer: { type: Number, default: 0 },
    actualDistanceKm: { type: Number, default: 0 },
    distanceTravelled: { type: Number, default: 0 },
    vehicleRatePerKm: { type: Number, default: 0 },
    vehicleTripCharge: { type: Number, default: 0 },
    tripStartedAt: { type: Date, default: null },
    tripCompletedAt: { type: String, default: '' },
    arrivedAtPickupAt: { type: Date, default: null },
    driverAcceptedAt: { type: Date, default: null },
    declineReason: { type: String, default: '' },
    declineExplanation: { type: String, default: '' },
    declinedAt: { type: Date, default: null },
    assignmentHistory: [
      {
        driverId: { type: String },
        driverName: { type: String },
        assignedAt: { type: String },
        declinedAt: { type: String },
        status: { type: String, default: 'Declined' },
        declineReason: { type: String }
      }
    ],
    tripRemarks: { type: String, default: '' },
    tripDuration: { type: String, default: '' },
    balanceAmount: { type: Number, default: 0 },
    invoiceNumber: { type: String, default: '' },
    invoice: { type: mongoose.Schema.Types.Mixed, default: null },
    notes: { type: String, default: '' },
    confirmedAt: { type: Date, default: Date.now },
    completedAt: { type: Date, default: null }
  },
  {
    timestamps: true,
    collection: 'bookings' // Connect to existing Atlas collection
  }
);

bookingSchema.pre('save', function (next) {
  if (this.bookingType && this.bookingType.toLowerCase().includes('one way')) {
    const err = new Error('ONE WAY TRIP IS STRICTLY FORBIDDEN IN THIS SYSTEM');
    if (typeof next === 'function') return next(err);
    throw err;
  }
  const ref = this.refId || this.bookingNumber || this.bookingId || this.id;
  if (ref) {
    if (!this.refId) this.refId = ref;
    if (!this.bookingNumber) this.bookingNumber = ref;
    if (!this.bookingId) this.bookingId = ref;
    if (!this.id) this.id = ref;
  }
  const name = this.fullName || this.customerName || this.name;
  if (name) {
    if (!this.fullName) this.fullName = name;
    if (!this.customerName) this.customerName = name;
    if (!this.name) this.name = name;
  }
  const phone = this.mobileNumber || this.customerPhone || this.phone;
  if (phone) {
    if (!this.mobileNumber) this.mobileNumber = phone;
    if (!this.customerPhone) this.customerPhone = phone;
    if (!this.phone) this.phone = phone;
  }
  const email = this.email || this.customerEmail;
  if (email) {
    if (!this.email) this.email = email;
    if (!this.customerEmail) this.customerEmail = email;
  }
  if (!this.advancePaid && this.advancePayment) {
    this.advancePaid = this.advancePayment;
  }
  if (!this.advancePayment && this.advancePaid) {
    this.advancePayment = this.advancePaid;
  }
  if (typeof next === 'function') next();
});

bookingSchema.index({ tenantId: 1, bookingNumber: 1 }, { unique: true, sparse: true });
bookingSchema.index({ tenantId: 1, refId: 1 }, { unique: true, sparse: true });
bookingSchema.index({ tenantId: 1, tripStatus: 1 });
bookingSchema.index({ tenantId: 1, driverId: 1 });
bookingSchema.index({ tenantId: 1, vehicleId: 1 });

export const Booking = mongoose.models.Booking || mongoose.model('Booking', bookingSchema);
export default Booking;
