// MAK Tours & Travels ERP - Bookings Data
// IMPORTANT: ONE WAY TRIP IS STRICTLY FORBIDDEN AND DOES NOT EXIST IN THIS SYSTEM.
// Allowed categories: 'Round Trip', 'Local Trip', 'Tour Package', 'Airport Transfer', 'Custom Journey'

export const bookingCategories = [
  'Round Trip',
  'Local Trip',
  'Tour Package',
  'Airport Transfer',
  'Custom Journey'
];

export const bookingStatuses = [
  'Pending',
  'Confirmed',
  'On Trip',
  'Completed',
  'Cancelled'
];

export const paymentStatuses = [
  'Pending',
  'Partial',
  'Paid',
  'Refund Due',
  'Refunded'
];

export const tripStatuses = [
  'Awaiting Driver Assignment',
  'Awaiting Driver Acceptance',
  'Driver Accepted',
  'In Progress',
  'Completed',
  'Cancelled'
];

export const driverAssignmentStatuses = [
  'Pending',
  'Assigned',
  'Accepted',
  'Declined',
  'Reassignment Required',
  'Cancelled'
];

export const initialBookings = [
  {
    id: 'MAK-753587',
    bookingNumber: 'MAK-753587',
    refId: 'MAK-753587',
    fullName: 'Kavitha Sundaram',
    customerName: 'Kavitha Sundaram',
    mobileNumber: '+91 98410 77889',
    customerPhone: '+91 98410 77889',
    email: 'kavitha.sundaram@gmail.com',
    customerEmail: 'kavitha.sundaram@gmail.com',
    bookingType: 'Round Trip',
    bookingCategory: 'Round Trip',
    vehicleId: 'mahindra-xuv700',
    vehicleName: 'Mahindra XUV700 (TN 01 AB 4002)',
    vehicleReserved: 'Mahindra XUV700',
    vehicleCategory: 'SUV/MUV',
    passengers: 5,
    passengerCount: 5,
    pricing: 8500,
    fare: 8500,
    totalFare: 8500,
    totalAmount: 8500,
    advancePaid: 2500,
    balanceDue: 6000,
    balanceAmount: 6000,
    paymentOption: 'Online Advance (₹2,500) + Cash Balance',
    paymentType: 'Online Advance (₹2,500) + Cash Balance',
    paymentStatus: 'Partial',
    bookingStatus: 'Confirmed',
    status: 'Confirmed',
    tripStatus: 'Awaiting Driver Acceptance',
    fromLocation: 'T. Nagar, Chennai, Tamil Nadu',
    pickupLocation: 'T. Nagar, Chennai, Tamil Nadu',
    toLocation: 'Mahabalipuram & Pondicherry Promenade',
    destination: 'Mahabalipuram & Pondicherry Promenade',
    dropLocation: 'T. Nagar, Chennai, Tamil Nadu',
    travelDate: '2026-11-15',
    journeyDate: '2026-11-15',
    pickupDate: '2026-11-15',
    pickupTime: '07:00 AM',
    journeyTime: '07:00 AM',
    returnDate: '2026-11-16',
    driverId: 'DRV-004',
    driverName: 'Anandh R',
    driverPhone: '+91 98401 11007',
    assignedDriverId: 'DRV-004',
    assignedDriverName: 'Anandh R',
    assignedDriverPhone: '+91 98401 11007',
    assignedVehicle: {
      id: 'mahindra-xuv700',
      brand: 'Mahindra',
      model: 'XUV700',
      name: 'XUV700',
      regNo: 'TN 01 AB 4002',
      numberPlate: 'TN 01 AB 4002',
      category: 'SUV/MUV',
      seating: '7 Passengers',
      fuelType: 'Diesel',
      status: 'Reserved',
      ratePerKm: 27,
      driverAllowance: 500,
      image: 'https://imgd.aeplcdn.com/664x374/n/cw/ec/42355/xuv700-exterior-right-front-three-quarter-2.png?isig=0&q=80',
      ownership: 'MAK Owned',
      isVendorVehicle: false,
      vendorId: null,
      vendorName: null,
      vendorPayoutPercent: null,
      vendorPayableAmount: 0
    },
    assignedDriver: {
      id: 'DRV-004',
      name: 'Anandh R',
      fullName: 'Anandh R',
      phone: '+91 98401 11007',
      photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
      licenseNumber: 'TN-05-2020-0019284',
      rating: 4.6,
      status: 'Assigned'
    },
    assignmentTimeline: [
      {
        id: 'TL-1794488092759',
        timestamp: '05:59 PM',
        event: 'Vehicle Assigned: Mahindra XUV700 (TN 01 AB 4002) [MAK Owned] & Driver Assigned: Anandh R (Compensation: ₹1,500)',
        actor: 'Operations Admin',
        status: 'Assigned'
      }
    ],
    history: [
      {
        id: 'TL-1794488092759',
        timestamp: '05:59 PM',
        event: 'Vehicle Assigned: Mahindra XUV700 (TN 01 AB 4002) [MAK Owned] & Driver Assigned: Anandh R (Compensation: ₹1,500)',
        actor: 'Operations Admin',
        status: 'Assigned'
      }
    ],
    driverAssignmentStatus: 'Assigned',
    driverCompensationAmount: 1500,
    vendorPayoutPercent: 85,
    vendorPayableAmount: 0,
    vehicleRatePerKm: 27
  },
  {
    id: 'MAK-753590',
    bookingNumber: 'MAK-753590',
    refId: 'MAK-753590',
    fullName: 'Rajesh Kumar',
    customerName: 'Rajesh Kumar',
    mobileNumber: '+91 98401 22334',
    customerPhone: '+91 98401 22334',
    email: 'rajesh.kumar@example.com',
    customerEmail: 'rajesh.kumar@example.com',
    bookingType: 'Round Trip',
    bookingCategory: 'Round Trip',
    vehicleId: '',
    vehicleName: 'Mahindra XUV700',
    vehicleReserved: 'Mahindra XUV700',
    vehicleCategory: 'SUV/MUV',
    passengers: 4,
    passengerCount: 4,
    pricing: 8500,
    fare: 8500,
    totalFare: 8500,
    totalAmount: 8500,
    advancePaid: 2500,
    balanceDue: 6000,
    balanceAmount: 6000,
    paymentOption: 'Online Advance (₹2,500) + Cash Balance',
    paymentType: 'Online Advance (₹2,500) + Cash Balance',
    paymentStatus: 'Partial',
    bookingStatus: 'Confirmed',
    status: 'Confirmed',
    tripStatus: 'Upcoming',
    fromLocation: 'Chennai Airport (MAA), Meenambakkam',
    pickupLocation: 'Chennai Airport (MAA), Meenambakkam',
    toLocation: 'Pondicherry Promenade Beach',
    destination: 'Pondicherry Promenade Beach',
    dropLocation: 'Pondicherry Promenade Beach',
    travelDate: '2026-11-15',
    journeyDate: '2026-11-15',
    pickupDate: '2026-11-15',
    pickupTime: '08:00 AM',
    journeyTime: '08:00 AM',
    returnDate: '2026-11-16',
    driverId: '',
    driverName: '',
    assignedDriverId: '',
    assignedDriverName: '',
    assignedDriverPhone: '',
    assignedVehicle: null,
    assignedDriver: null,
    assignmentTimeline: [],
    history: [],
    driverAssignmentStatus: 'Pending',
    driverCompensationAmount: 1500,
    vendorPayoutPercent: 85,
    vendorPayableAmount: 0
  }
];

export default initialBookings;
