import mongoose from 'mongoose';

const tourPackageSchema = new mongoose.Schema(
  {
    tenantId: { type: String, default: 'mak-tours', index: true, lowercase: true, trim: true },
    id: { type: String, index: true },
    slug: { type: String, index: true },
    name: { type: String, required: true },
    code: { type: String, default: '' },
    category: { type: String, default: 'South India' },
    destination: { type: String, default: '' },
    duration: { type: String, default: '1 Day' },
    days: { type: Number, default: 1 },
    nights: { type: Number, default: 0 },
    daysCount: { type: Number, default: 1 },
    price: { type: String, default: '₹0' },
    priceNumeric: { type: Number, default: 0 },
    startingPrice: { type: Number, default: 0 },
    pricingType: { type: String, default: 'Per Person' },
    rating: { type: Number, default: 4.9 },
    reviewsCount: { type: Number, default: 1 },
    badge: { type: String, default: '' },
    categories: { type: [String], default: [] },
    pickupLocation: { type: String, default: 'Chennai, Tamil Nadu' },
    destinationImage: { type: String, default: '' },
    heroImage: { type: String, default: '' },
    image: { type: String, default: '' },
    images: { type: [String], default: [] },
    shortDescription: { type: String, default: '' },
    fullDescription: { type: String, default: '' },
    itinerary: { type: [mongoose.Schema.Types.Mixed], default: [] },
    inclusions: { type: [String], default: [] },
    exclusions: { type: [String], default: [] },
    sightseeingSpots: { type: [mongoose.Schema.Types.Mixed], default: [] },
    places: { type: [mongoose.Schema.Types.Mixed], default: [] },
    serviceHighlights: { type: [String], default: [] },
    isActive: { type: Boolean, default: true },
    status: { type: String, default: 'Active', enum: ['Active', 'Draft', 'Inactive'] }
  },
  {
    timestamps: true,
    collection: 'tourpackages' // Connect to existing Atlas collection
  }
);

export const TourPackage = mongoose.models.TourPackage || mongoose.model('TourPackage', tourPackageSchema);
export default TourPackage;
