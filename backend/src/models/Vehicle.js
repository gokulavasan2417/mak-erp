import mongoose from 'mongoose';

const vehicleSchema = new mongoose.Schema(
  {
    tenantId: { type: String, default: 'mak-tours', index: true, lowercase: true, trim: true },
    id: { type: String, index: true },
    name: { type: String, required: true },
    brand: { type: String, default: '' },
    model: { type: String, default: '' },
    category: { type: String, default: 'Sedan' },
    numberPlate: { type: String, default: '' },
    regNo: { type: String, default: '' },
    registrationNumber: { type: String, default: '' },
    color: { type: String, default: 'Super White' },
    manufacturingYear: { type: Number, default: 2024 },
    seatingCapacity: { type: Number, default: 7 },
    passengers: { type: mongoose.Schema.Types.Mixed, default: '4 Passengers' },
    luggage: { type: mongoose.Schema.Types.Mixed, default: '2 Bags' },
    pricePerKm: { type: Number, default: 15 },
    ratePerKm: { type: Number, default: 15 },
    basePrice: { type: Number, default: 2000 },
    baseFare: { type: Number, default: 2000 },
    minKmPerDay: { type: Number, default: 300 },
    driverAllowance: { type: Number, default: 500 },
    driverBata: { type: Number, default: 500 },
    nightCharges: { type: Number, default: 350 },
    extraHourRate: { type: Number, default: 150 },
    fuelType: { type: String, default: 'Diesel' },
    transmission: { type: String, default: 'Manual' },
    rating: { type: Number, default: 4.8 },
    image: { type: String, default: '' },
    images: { type: [String], default: [] },
    flipHorizontal: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false, index: true },
    inclusions: { type: [String], default: [] },
    exclusions: { type: [String], default: [] },
    ac: { type: String, default: 'Dual Air Conditioner' },
    isAC: { type: Boolean, default: true },
    features: { type: [String], default: [] },
    amenities: { type: [String], default: [] },
    status: { type: String, default: 'Available', enum: ['Available', 'On Duty', 'Maintenance', 'Inactive', 'Reserved', 'On Trip', 'Unavailable'] },
    ownership: { type: String, default: 'Company Owned', enum: ['Company Owned', 'Vendor Attached', 'Attached', 'MAK Owned', 'Vendor Owned'] },
    ownershipType: { type: String, default: 'Company Owned' },
    vendorId: { type: String, default: '' },
    vendorName: { type: String, default: '' },
    vendorCode: { type: String, default: '' },
    vendorContact: { type: String, default: '' },
    vendorCity: { type: String, default: '' },
    assignedDriverId: { type: String, default: '' },
    assignedDriverName: { type: String, default: '' },
    documents: { type: mongoose.Schema.Types.Mixed, default: {} },
    insuranceExpiry: { type: String, default: '' },
    fitnessExpiry: { type: String, default: '' },
    permitExpiry: { type: String, default: '' },
    odometerKm: { type: Number, default: 0 }
  },
  {
    timestamps: true,
    strict: false,
    collection: 'vehicles' // Connect to existing Atlas collection
  }
);

vehicleSchema.pre('save', function (next) {
  // 1. Synchronize and normalize Registration Number / Number Plate
  const rawPlate = this.regNo || this.numberPlate || this.registrationNumber || '';
  if (rawPlate) {
    const cleanPlate = rawPlate.toUpperCase().replace(/[^A-Z0-9]/g, '');
    const match = cleanPlate.match(/^([A-Z]{2})(\d{1,2})([A-Z]{0,3})(\d{1,4})$/);
    const displayPlate = match
      ? `${match[1]} ${match[2]} ${match[3]} ${match[4]}`.replace(/\s+/g, ' ').trim()
      : rawPlate.trim().toUpperCase();
    this.regNo = displayPlate;
    this.numberPlate = displayPlate;
    this.registrationNumber = displayPlate;
  }

  // 2. Synchronize rate per kilometer (guarantees website's pricePerKm requirement)
  if (this.ratePerKm !== undefined && (this.pricePerKm === undefined || this.pricePerKm === null)) {
    this.pricePerKm = this.ratePerKm;
  } else if (this.pricePerKm !== undefined && (this.ratePerKm === undefined || this.ratePerKm === null)) {
    this.ratePerKm = this.pricePerKm;
  }
  if (!this.pricePerKm && !this.ratePerKm) {
    this.pricePerKm = 15;
    this.ratePerKm = 15;
  }

  // 3. Synchronize base package fare
  if (this.baseFare !== undefined && (this.basePrice === undefined || this.basePrice === null)) {
    this.basePrice = this.baseFare;
  } else if (this.basePrice !== undefined && (this.baseFare === undefined || this.baseFare === null)) {
    this.baseFare = this.basePrice;
  }
  if (!this.basePrice && !this.baseFare) {
    this.basePrice = 2000;
    this.baseFare = 2000;
  }

  if (typeof next === 'function') next();
});

vehicleSchema.index({ tenantId: 1, regNo: 1 });
vehicleSchema.index({ tenantId: 1, id: 1 });
vehicleSchema.index({ tenantId: 1, status: 1 });

export const Vehicle = mongoose.models.Vehicle || mongoose.model('Vehicle', vehicleSchema);
export default Vehicle;
