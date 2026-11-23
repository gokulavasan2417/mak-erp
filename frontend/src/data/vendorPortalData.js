// MAK Tours & Travels ERP - Vendor Portal Data
// Strictly allowed journey categories: Round Trip, Local Trip, Tour Package, Airport Transfer, Custom Journey.

export const vendorVehicleCategories = [
  'Hatchback',
  'Sedan',
  'SUV/MUV',
  'SUV',
  'MUV',
  'Premium MPV',
  'Luxury SUV',
  'Tempo Traveller',
  'Tempo Coach',
  'Executive Sedan',
  'VIP Van',
  'Mini Bus',
  'Luxury Coach'
];

export const vendorVehicleStatuses = [
  'All',
  'Available',
  'Reserved',
  'On Trip',
  'Maintenance'
];

export const vendorDriverStatuses = [
  'All',
  'Available',
  'Assigned',
  'On Trip',
  'On Leave'
];

export const vendorBookingCategories = [
  'All',
  'Round Trip',
  'Local Trip',
  'Tour Package',
  'Airport Transfer',
  'Custom Journey'
];

export const vendorBookingStatuses = [
  'All',
  'Pending',
  'Confirmed',
  'On Trip',
  'Completed',
  'Rejected',
  'Cancelled'
];

export const initialVendorProfile = {
  vendorId: '',
  vendorCode: '',
  companyName: '',
  tradingName: '',
  ownerName: '',
  contactPerson: '',
  phone: '',
  altPhone: '',
  email: '',
  dispatchEmail: '',
  category: 'Fleet Supply Partner',
  partnerTier: 'Registered Partner',
  address: '',
  city: '',
  state: '',
  pincode: '',
  gstin: '',
  panNumber: '',
  bankDetails: {
    accountName: '',
    accountNumber: '',
    ifscCode: '',
    bankName: '',
    branch: ''
  },
  commissionRate: '10%',
  contractStartDate: '',
  contractExpiryDate: '',
  rating: 0,
  totalTripsCompleted: 0,
  status: 'Active'
};

export const initialVendorVehicles = [];
export const initialVendorDrivers = [];
export const initialBookingRequests = [];
export const initialVendorBookings = [];
export const initialVendorTrips = [];
export const initialVendorPricing = {
  vehicles: [],
  tripTypes: []
};
export const initialVendorInvoices = [];
export const initialVendorPayments = [];
export const initialVendorTickets = [];
export const initialVendorNotifications = [];
export const initialVendorAnnouncements = [];

export const rejectionReasonOptions = [
  'Vehicle unavailable for requested dates',
  'Driver not available on specified route',
  'Rate expectation mismatch',
  'Vehicle under scheduled maintenance',
  'Route / terrain not feasible for vehicle category',
  'Short notice dispatch unavailable',
  'Other logistical reason'
];
