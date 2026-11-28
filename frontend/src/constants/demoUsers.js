// MAK Tours & Travels ERP - Shared Demo User Accounts & Credentials Single Source of Truth
// Standardized demo credentials across all enterprise portals

export const DEMO_USERS = [
  {
    id: 'USR-SA-01',
    name: 'Vikramaditya Rao',
    email: 'superadmin@maktours.com',
    password: 'Super@123',
    alternatePasswords: ['super123'],
    role: 'super_admin',
    portal: 'super-admin',
    portalName: 'Super Admin',
    designation: 'Enterprise Platform Administrator',
    status: 'Active',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'
  },
  {
    id: 'USR-ADM-01',
    name: 'Ananya Deshmukh',
    email: 'admin@maktours.com',
    password: 'Admin@123',
    alternatePasswords: ['admin123'],
    role: 'company_admin',
    portal: 'admin',
    portalName: 'Company Admin',
    designation: 'General Operations Manager',
    status: 'Active',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80'
  },
  {
    id: 'USR-OPS-01',
    name: 'Karthik Narayanan',
    email: 'ops@maktours.com',
    password: 'Ops@123',
    alternatePasswords: ['ops123', 'admin123'],
    role: 'operations',
    portal: 'admin',
    portalName: 'Operations Admin',
    designation: 'Live Dispatch & Fleet Controller',
    status: 'Active',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80'
  },
  {
    id: 'USR-FLT-01',
    name: 'Sundaram Murthy',
    email: 'fleet@maktours.com',
    password: 'Fleet@123',
    alternatePasswords: ['fleet123', 'admin123'],
    role: 'fleet_manager',
    portal: 'admin',
    portalName: 'Fleet Manager',
    designation: 'Fleet Asset & Telematics Head',
    status: 'Active',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80'
  },
  {
    id: 'USR-FIN-01',
    name: 'Pooja Sundaram',
    email: 'finance@maktours.com',
    password: 'Finance@123',
    alternatePasswords: ['finance123', 'admin123'],
    role: 'accountant',
    portal: 'accountant',
    portalName: 'Accountant Portal',
    designation: 'Senior Accountant & Financial Controller',
    status: 'Active',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80'
  },
  {
    id: 'USR-ACC-01',
    name: 'Rajesh Ramanathan',
    email: 'accountant@maktours.com',
    password: 'Accountant@123',
    alternatePasswords: ['accountant123', 'admin123'],
    role: 'accountant',
    portal: 'accountant',
    portalName: 'Accountant Portal',
    designation: 'Senior Chartered Accountant',
    status: 'Active',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'
  },
  {
    id: 'USR-EMP-01',
    name: 'Vimal',
    fullName: 'Vimal',
    email: 'staff@maktours.com',
    password: 'Staff@123',
    alternatePasswords: ['staff123', 'admin123'],
    role: 'employee',
    portal: 'staff',
    portalName: 'Staff Portal',
    employeeCode: 'MAK-EMP-010',
    designation: 'Cleaner',
    department: 'Operations & Dispatch',
    workType: 'Travel Coordinator',
    salaryBasis: 'Attendance-Based Monthly Salary',
    monthlySalary: 42000,
    status: 'Active',
    avatar: '/uploads/avatars/avatar-1794562651050-830977.jpeg'
  },
  {
    id: 'USR-DRV-01',
    name: 'Arun Kumar Sundaram',
    email: 'arun.driver@maktours.com',
    alternateEmails: ['driver@maktours.com'],
    password: 'Driver@123',
    alternatePasswords: ['driver123'],
    role: 'driver',
    driverId: 'DRV-001',
    portal: 'driver',
    portalName: 'Driver Portal',
    designation: 'Senior Tour Driver',
    approvalStatus: 'Approved',
    status: 'Active',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80'
  },
  {
    id: 'USR-DRV-02',
    name: 'Karthik Raja',
    email: 'karthik.driver@maktours.com',
    password: 'Driver@123',
    role: 'driver',
    driverId: 'DRV-002',
    portal: 'driver',
    portalName: 'Driver Portal',
    designation: 'Intercity Driver',
    approvalStatus: 'Approved',
    status: 'Active',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80'
  },
  {
    id: 'USR-DRV-03',
    name: 'Ramesh Sundaram',
    email: 'ramesh.driver@maktours.com',
    password: 'Driver@123',
    role: 'driver',
    driverId: 'DRV-003',
    portal: 'driver',
    portalName: 'Driver Portal',
    designation: 'Executive Driver',
    approvalStatus: 'Approved',
    status: 'Active',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=400&q=80'
  },
  {
    id: 'USR-VND-01',
    name: 'Apex Fleet Solutions',
    email: 'apex@apexfleet.in',
    alternateEmails: ['vendor@apexfleet.in', 'vendor@maktours.com'],
    password: 'Vendor@123',
    alternatePasswords: ['vendor123', 'admin123'],
    role: 'vendor',
    vendorId: 'VND-001',
    portal: 'vendor',
    portalName: 'Vendor Partner Portal',
    designation: 'Fleet Partner Operator',
    status: 'Active',
    avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=400&q=80'
  },
  {
    id: 'USR-VND-02',
    name: 'Royal Travels Network',
    email: 'royal@royaltravels.in',
    alternateEmails: ['royaltravels@maktours.com'],
    password: 'Vendor@123',
    alternatePasswords: ['vendor123', 'admin123'],
    role: 'vendor',
    vendorId: 'VND-002',
    portal: 'vendor',
    portalName: 'Vendor Partner Portal',
    designation: 'Luxury Coach Partner',
    status: 'Active',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=400&q=80'
  }
];

export function findDemoUser(email) {
  if (!email) return null;
  const clean = email.trim().toLowerCase();
  return (
    DEMO_USERS.find(
      (u) =>
        u.email.toLowerCase() === clean ||
        (u.alternateEmails && u.alternateEmails.some((ae) => ae.toLowerCase() === clean))
    ) || null
  );
}

export function verifyUserPassword(user, password) {
  if (!user || !password) return false;
  const clean = password.trim();
  if (user.password === clean) return true;
  if (user.alternatePasswords && user.alternatePasswords.includes(clean)) return true;
  return false;
}

export function findDemoUserById(id) {
  if (!id) return null;
  return DEMO_USERS.find((u) => u.id === id || u.driverId === id || u.vendorId === id) || null;
}
