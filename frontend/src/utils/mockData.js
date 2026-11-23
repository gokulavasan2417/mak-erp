// MAK Tours & Travels ERP - Centralized Mock Data

export const mockNotifications = [
  { id: 'notif-1', title: 'New Corporate Booking', message: 'Booking #BK-9021 confirmed for 4 Innova Crystas.', time: '5m ago', unread: true, portal: 'admin' },
  { id: 'notif-2', title: 'Driver Duty Assigned', message: 'Driver Rajesh Kumar assigned to Trip #TR-1042.', time: '18m ago', unread: true, portal: 'driver' },
  { id: 'notif-3', title: 'Vendor Invoice Approved', message: 'Invoice #INV-2026-088 for ₹1,45,000 processed.', time: '1h ago', unread: false, portal: 'vendor' },
  { id: 'notif-4', title: 'System Security Audit', message: 'Routine credential rotation completed for 12 admins.', time: '2h ago', unread: false, portal: 'super-admin' },
  { id: 'notif-5', title: 'Document Expiry Warning', message: 'Vehicle RC for KA-01-MJ-8890 expires in 14 days.', time: '3h ago', unread: true, portal: 'admin' },
];

export const mockSuperAdminData = {
  stats: [
    { title: 'Total System Users', value: '1,428', change: '+12.4%', isPositive: true, description: 'Across all enterprise portals' },
    { title: 'Active Tenant Roles', value: '18', change: 'Stable', isPositive: true, description: 'Role-based access matrix' },
    { title: 'API Gateway Health', value: '99.98%', change: '+0.02%', isPositive: true, description: 'Average response: 42ms' },
    { title: 'Security Audit Events', value: '4,892', change: '-5.1%', isPositive: true, description: 'Zero critical vulnerabilities' },
  ],
  systemUsers: [
    { id: 'USR-001', name: 'Vikramaditya Rao', email: 'v.rao@maktours.com', role: 'Super Admin', portal: 'Super Admin', status: 'Active', lastActive: '2 mins ago' },
    { id: 'USR-002', name: 'Ananya Deshmukh', email: 'ananya.d@maktours.com', role: 'Chief Dispatcher', portal: 'Admin', status: 'Active', lastActive: '12 mins ago' },
    { id: 'USR-003', name: 'Rajesh Kumar', email: 'rajesh.k@maktours.com', role: 'Senior Driver', portal: 'Driver', status: 'Active', lastActive: 'Just now' },
    { id: 'USR-004', name: 'Suresh Apex Travels', email: 'billing@apexfleet.in', role: 'Fleet Partner', portal: 'Vendor', status: 'Active', lastActive: '1 hour ago' },
    { id: 'USR-005', name: 'Pooja Sundaram', email: 'p.sundaram@maktours.com', role: 'Finance Manager', portal: 'Admin', status: 'Active', lastActive: '45 mins ago' },
    { id: 'USR-006', name: 'Karthik Narayanan', email: 'karthik.n@maktours.com', role: 'Security Officer', portal: 'Super Admin', status: 'Suspended', lastActive: '2 days ago' },
  ],
  auditLogs: [
    { id: 'LOG-771', action: 'ROLE_PERMISSION_UPDATE', user: 'Vikramaditya Rao', ip: '10.84.12.91', timestamp: '2026-11-07 10:45:12', severity: 'Info' },
    { id: 'LOG-770', action: 'FAILED_LOGIN_ATTEMPT', user: 'unknown@external.net', ip: '198.51.100.24', timestamp: '2026-11-07 09:12:04', severity: 'Warning' },
    { id: 'LOG-769', action: 'DATABASE_BACKUP_COMPLETED', user: 'SYSTEM_CRON', ip: 'localhost', timestamp: '2026-11-07 03:00:00', severity: 'Success' },
    { id: 'LOG-768', action: 'NEW_PORTAL_USER_CREATED', user: 'Vikramaditya Rao', ip: '10.84.12.91', timestamp: '2026-11-06 17:30:19', severity: 'Info' },
    { id: 'LOG-767', action: 'EXPORT_AUDIT_TRAIL', user: 'Karthik Narayanan', ip: '10.84.15.110', timestamp: '2026-11-06 14:15:22', severity: 'Info' },
  ],
  roles: [
    { id: 'ROL-1', name: 'Super Administrator', usersCount: 3, permissions: 'All Permissions (Root)', accessLevel: 'Tier 1' },
    { id: 'ROL-2', name: 'Operations General Manager', usersCount: 8, permissions: 'Bookings, Fleet, Drivers, Reports', accessLevel: 'Tier 2' },
    { id: 'ROL-3', name: 'Fleet Dispatcher', usersCount: 24, permissions: 'Live Fleet, Trips, Driver Assignment', accessLevel: 'Tier 3' },
    { id: 'ROL-4', name: 'Finance Controller', usersCount: 6, permissions: 'Invoicing, Vendor Payouts, Audit', accessLevel: 'Tier 3' },
    { id: 'ROL-5', name: 'Commercial Driver', usersCount: 340, permissions: 'Mobile Trips, Fuel Entry, Documents', accessLevel: 'Tier 4' },
    { id: 'ROL-6', name: 'Fleet Vendor Partner', usersCount: 52, permissions: 'Vehicle Supply, Invoices, Service Log', accessLevel: 'Tier 4' },
  ]
};

export const mockAdminData = {
  stats: [
    { title: "Today's Bookings", value: '148', change: '+18.2%', isPositive: true, description: '42 Outstation, 106 Local/Airport' },
    { title: 'Fleet on Road', value: '112 / 135', change: '83% Active', isPositive: true, description: '15 Available, 8 in Maintenance' },
    { title: 'On-Duty Drivers', value: '118', change: '+4 Today', isPositive: true, description: '98 on trip, 20 standby' },
    { title: "Today's Invoiced Revenue", value: '₹4,82,500', change: '+14.6%', isPositive: true, description: 'Target: ₹4,50,000' },
  ],
  recentBookings: [
    { id: 'BK-9021', customer: 'Infosys Corp Mobility', route: 'Bangalore Airport ⇄ Electronic City', vehicleType: 'Innova Crysta (x4)', pickupTime: 'Today, 18:30', status: 'Confirmed', amount: '₹14,800' },
    { id: 'BK-9020', customer: 'Dr. Arvind Swaminathan', route: 'Bangalore ⇄ Mysore Heritage Tour', vehicleType: 'Toyota Fortuner', pickupTime: 'Today, 06:00', status: 'In-Transit', amount: '₹18,500' },
    { id: 'BK-9019', customer: 'Cognizant Tech Solutions', route: 'Whitefield Campus Shuttle', vehicleType: 'Tempo Traveller (20S)', pickupTime: 'Today, 19:00', status: 'Dispatched', amount: '₹9,200' },
    { id: 'BK-9018', customer: 'Meera Nair & Family', route: 'Bangalore ⇄ Ooty 3D/2N', vehicleType: 'Kia Carens Luxury', pickupTime: 'Tomorrow, 05:30', status: 'Confirmed', amount: '₹28,000' },
    { id: 'BK-9017', customer: 'Titan Watches Leadership', route: 'Hosur Plant VIP Transfer', vehicleType: 'Mercedes E-Class', pickupTime: 'Completed', status: 'Completed', amount: '₹16,500' },
  ],
  fleetList: [
    { id: 'VEH-101', regNo: 'KA-01-MJ-8890', model: 'Toyota Innova Crysta ZX', category: 'Premium MPV', capacity: '7 Seater', status: 'On-Trip', driver: 'Rajesh Kumar', fuel: 'Diesel', odo: '48,210 km' },
    { id: 'VEH-102', regNo: 'KA-03-NB-4421', model: 'Force Urbania Luxury', category: 'Tempo Coach', capacity: '17 Seater', status: 'Available', driver: 'Mohan Lal', fuel: 'Diesel', odo: '22,400 km' },
    { id: 'VEH-103', regNo: 'KA-05-MK-9912', model: 'Toyota Fortuner 4x4', category: 'Luxury SUV', capacity: '7 Seater', status: 'On-Trip', driver: 'Syed Imran', fuel: 'Diesel', odo: '36,150 km' },
    { id: 'VEH-104', regNo: 'KA-01-EL-1209', model: 'Tata Nexon EV Max', category: 'Eco Sedan', capacity: '5 Seater', status: 'Maintenance', driver: 'Unassigned', fuel: 'Electric', odo: '18,900 km' },
    { id: 'VEH-105', regNo: 'KA-04-MM-7701', model: 'Kia Carnival Limousine', category: 'VIP Van', capacity: '7 Seater', status: 'Available', driver: 'Venkatesh P.', fuel: 'Diesel', odo: '14,200 km' },
  ]
};

export const mockDriverData = {
  profile: {
    name: 'Rajesh Kumar',
    driverId: 'MAK-DRV-442',
    phone: '+91 98450 12345',
    rating: '4.92 ★',
    tripsCompleted: 842,
    dutyStatus: 'On Duty',
    vehicleAssigned: 'Toyota Innova Crysta (KA-01-MJ-8890)'
  },
  stats: [
    { title: "Today's Earnings", value: '₹1,850', change: '+₹350 Tips', isPositive: true, description: '3 Trips completed today' },
    { title: 'On-Duty Time', value: '6h 40m', change: 'Shift: 08:00 - 20:00', isPositive: true, description: 'Shift ends in 5h 20m' },
    { title: 'Upcoming Trips', value: '2 Scheduled', change: 'Next: 18:30', isPositive: true, description: 'Airport Pickup Transfer' },
    { title: 'Performance Rating', value: '4.92 ★', change: 'Top 5%', isPositive: true, description: 'Based on 420 reviews' },
  ],
  activeTrip: {
    id: 'TRIP-1042',
    bookingId: 'BK-9021',
    customerName: 'Infosys Corp Mobility (Mr. Alok Verma)',
    passengerPhone: '+91 98765 43210',
    passengersCount: 4,
    vehicle: 'Toyota Innova Crysta - KA-01-MJ-8890',
    pickupAddress: 'Infosys Main Gate, Electronic City Phase 1, Bangalore',
    dropAddress: 'Terminal 2, Kempegowda International Airport (BLR)',
    scheduledTime: 'Today at 18:30',
    distanceKm: '54 km',
    estimatedTime: '1 hr 25 mins',
    tollCharges: '₹120 (Fastag)',
    fare: '₹2,450',
    status: 'In Progress',
    notes: 'Executive corporate guest with 3 pieces of luggage. AC preset to 23°C.'
  },
  upcomingTrips: [
    { id: 'TRIP-1043', time: 'Tomorrow, 07:00 AM', from: 'Koramangala 4th Block', to: 'Manyata Tech Park', client: 'Cognizant VIP', fare: '₹1,200', status: 'Scheduled' },
    { id: 'TRIP-1044', time: 'Tomorrow, 14:00 PM', from: 'Indiranagar 100ft Rd', to: 'Whitefield Marriott', client: 'ITC Infotech', fare: '₹1,650', status: 'Scheduled' },
  ],
  documents: [
    { id: 'DOC-1', name: 'Commercial Driving License', number: 'KA-01-201500892', expiry: '2029-08-15', status: 'Verified' },
    { id: 'DOC-2', name: 'Public Service Vehicle (PSV) Badge', number: 'PSV-BLR-8812', expiry: '2028-03-10', status: 'Verified' },
    { id: 'DOC-3', name: 'Medical Fitness Certificate', number: 'MED-2026-901', expiry: '2027-01-30', status: 'Verified' },
    { id: 'DOC-4', name: 'Police Verification Clearance', number: 'POL-BLR-44910', expiry: '2027-06-18', status: 'Verified' },
  ]
};

export const mockVendorData = {
  profile: {
    companyName: 'Apex Fleet & Logistics Solutions Pvt Ltd',
    vendorId: 'VND-8892',
    contactPerson: 'Suresh Chandran',
    gstin: '29ABCDE1234F1Z5',
    activeVehiclesSupplied: 18,
    partnerTier: 'Gold Fleet Partner'
  },
  stats: [
    { title: 'Vehicles Deployed', value: '18 / 20', change: '90% Utilization', isPositive: true, description: '18 Active on MAK Tours trips' },
    { title: "This Month's Invoicing", value: '₹8,45,000', change: '+22.8%', isPositive: true, description: '12 Invoices generated' },
    { title: 'Pending Settlement', value: '₹1,95,000', change: 'Due in 3 days', isPositive: false, description: 'Approved by MAK Finance' },
    { title: 'Completed Fleet Trips', value: '312', change: '+44 this week', isPositive: true, description: '99.4% On-time dispatch' },
  ],
  invoices: [
    { id: 'INV-2026-088', month: 'October 2026', totalTrips: 94, amount: '₹2,85,000', tax: '₹14,250', status: 'Paid', date: '2026-10-31' },
    { id: 'INV-2026-089', month: 'Mid-Nov 2026 Fortnight', totalTrips: 58, amount: '₹1,95,000', tax: '₹9,750', status: 'Pending Approval', date: '2026-11-05' },
    { id: 'INV-2026-087', month: 'September 2026', totalTrips: 110, amount: '₹3,40,000', tax: '₹17,000', status: 'Paid', date: '2026-09-30' },
  ],
  vehicles: [
    { id: 'VND-VEH-1', regNo: 'KA-01-AB-1102', model: 'Toyota Innova Crysta', driver: 'Ramesh K.', status: 'Active', contract: 'Monthly Retainer' },
    { id: 'VND-VEH-2', regNo: 'KA-03-CD-3391', model: 'Force Traveller (17S)', driver: 'Ganesh M.', status: 'Active', contract: 'Corporate Shuttle' },
    { id: 'VND-VEH-3', regNo: 'KA-04-EF-7720', model: 'Toyota Etios', driver: 'Vinay B.', status: 'Standby', contract: 'On-Demand Pool' },
    { id: 'VND-VEH-4', regNo: 'KA-05-GH-9901', model: 'Maruti Ertiga ZXi', driver: 'Santosh N.', status: 'Active', contract: 'Airport Fleet' },
  ]
};
