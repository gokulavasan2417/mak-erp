// MAK Tours & Travels ERP - Driver Portal Data
// Clean slate: Populated dynamically from connected backend / database.
// CRITICAL: ONE WAY TRIP MUST NOT EXIST ANYWHERE IN THIS APPLICATION.

export const driverTripCategories = [
  'Round Trip',
  'Local Trip',
  'Tour Package',
  'Airport Transfer',
  'Custom Journey'
];

export const driverTripStatuses = [
  'Assigned',
  'Accepted',
  'Arrived at Pickup',
  'Trip Started',
  'Trip Completed',
  'Declined',
  'Cancelled'
];

export const driverApplicationStatuses = [
  'Pending Verification',
  'Under Review',
  'Approved',
  'Rejected',
  'Documents Required'
];

export const driverDutyStatuses = [
  'Available',
  'Assigned',
  'On Trip',
  'Unavailable',
  'On Leave'
];

export const initialDriverProfile = {
  id: '',
  applicationId: '',
  fullName: '',
  displayName: '',
  dob: '',
  gender: '',
  phone: '',
  altPhone: '',
  email: '',
  photo: '',
  address: '',
  city: '',
  state: '',
  pincode: '',
  emergencyContactName: '',
  emergencyContactPhone: '',
  emergencyContactRelation: '',
  dutyStatus: 'Available',
  drivingLicense: {
    number: '',
    holderName: '',
    issueDate: '',
    expiryDate: '',
    typeClass: 'LMV-TR (Commercial Transport Badge)',
    status: 'Pending'
  },
  experienceYears: 0,
  languages: [],
  preferredTripType: 'All',
  previousExperience: '',
  badgeNumber: '',
  badgeExpiry: '',
  badgeAuthority: '',
  badgeEndorsementDate: '',
  bloodGroup: '',
  panNumber: '',
  aadhaarNumber: '',
  policeVerification: {
    certificateNumber: '',
    issuingStation: '',
    issueDate: '',
    expiryDate: '',
    status: 'Pending'
  },
  bankAccount: {
    accountNumber: '',
    ifscCode: '',
    bankName: '',
    branch: '',
    accountHolder: '',
    status: 'Pending'
  },
  rating: 5.0,
  totalTripsCompleted: 0
};

export const initialDriverApplications = [];
export const initialDriverTrips = [];
export const initialPendingAssignments = [];
export const initialDriverEarnings = [];
export const initialDriverPayments = [];
export const initialDriverDocuments = [];
export const initialDriverNotifications = [];
export const initialDriverSupportTickets = [];
export const initialDriverFeedback = [];

export const emergencyContacts = {
  police: '112 / 100',
  ambulance: '108',
  mak24x7Support: '+91 98450 99999',
  headDispatcher: '+91 98450 77881',
  fleetSupervisor: '+91 97410 44332'
};
