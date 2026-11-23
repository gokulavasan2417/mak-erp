// MAK Tours & Travels ERP - Cryptographic Authentication & RBAC Middleware
import mongoose from 'mongoose';
import { User } from '../models/User.js';
import { Driver } from '../models/Driver.js';
import { Vendor } from '../models/Vendor.js';
import { Employee } from '../models/Employee.js';
import { verifyToken, extractBearerToken } from '../utils/jwtUtils.js';

// Sensible Role Default Permissions
export const ROLE_DEFAULT_PERMISSIONS = {
  super_admin: ['*'],
  company_admin: ['*'],
  admin: ['*'],
  finance_admin: [
    'finance.*',
    'income.*',
    'expense.*',
    'invoice.*',
    'payments.*',
    'ledger.*',
    'reports.*',
    'payroll.view',
    'payroll.*'
  ],
  accountant: [
    'finance.view',
    'finance.manage',
    'income.view',
    'income.manage',
    'expense.view',
    'expense.manage',
    'invoice.view',
    'invoice.manage',
    'payments.view',
    'payments.manage',
    'ledger.view',
    'ledger.manage',
    'reports.view',
    'reports.export',
    'payroll.view'
  ],
  operations: [
    'bookings.*',
    'trips.*',
    'vehicles.view',
    'drivers.view',
    'customers.*'
  ],
  fleet_manager: [
    'vehicles.*',
    'trips.view',
    'drivers.view'
  ],
  staff: [
    'bookings.create',
    'bookings.view',
    'customers.view'
  ],
  employee: [
    'bookings.create',
    'bookings.view',
    'customers.view'
  ],
  driver: [
    'trips.assigned',
    'expenses.submit'
  ],
  vendor: [
    'trips.vendor',
    'vehicles.vendor',
    'invoices.vendor'
  ],
  customer: [
    'bookings.own'
  ]
};

// Explicitly Denied Modules / Actions for Accountant
export const ACCOUNTANT_DENIED_MODULES = [
  'vehicles',
  'trips.assign',
  'bookings.delete',
  'settings',
  'users',
  'super_admin',
  'subscription'
];

/**
 * Checks whether user has the required permission
 */
export function hasPermission(user, requiredPermission) {
  if (!user) return false;

  const role = String(user.role || '').toLowerCase();

  // Super Admin has all permissions
  if (role === 'super_admin') return true;

  // Company Admin has all non-super-admin permissions
  if ((role === 'admin' || role === 'company_admin') && !requiredPermission.startsWith('super_admin')) {
    return true;
  }

  // Accountant Denied list check: explicit hard-gate
  if (role === 'accountant') {
    const isDenied = ACCOUNTANT_DENIED_MODULES.some((denied) => {
      if (denied.endsWith('.*')) {
        const prefix = denied.slice(0, -2);
        return requiredPermission === prefix || requiredPermission.startsWith(prefix + '.');
      }
      return requiredPermission === denied || requiredPermission.startsWith(denied + '.');
    });
    if (isDenied) return false;
  }

  // Get active permissions: custom user permissions take priority if present, else role defaults
  const userPermissions = Array.isArray(user.permissions) && user.permissions.length > 0
    ? user.permissions
    : ROLE_DEFAULT_PERMISSIONS[role] || [];

  if (userPermissions.includes('*')) return true;

  // Exact match
  if (userPermissions.includes(requiredPermission)) return true;

  // Wildcard match (e.g. 'finance.*' matches 'finance.view')
  const [reqModule] = requiredPermission.split('.');
  if (userPermissions.includes(`${reqModule}.*`)) return true;

  return false;
}

/**
 * Cryptographic JWT Authentication Middleware
 * Strictly validates signature and expiration. Auto-creation of users and admin fallbacks are REMOVED.
 */
export const requireAuth = async (req, res, next) => {
  try {
    const token = extractBearerToken(req.headers.authorization) || (req.query?.token ? String(req.query.token).trim() : null);

    if (!token) {
      return res.status(401).json({
        status: 'error',
        code: 'UNAUTHORIZED_TOKEN_MISSING',
        message: 'Authentication token missing or invalid.'
      });
    }

    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (err) {
      return res.status(401).json({
        status: 'error',
        code: 'UNAUTHORIZED_INVALID_TOKEN',
        message: 'Authentication token is invalid or expired: ' + err.message
      });
    }

    const cleanEmail = (decoded.email || '').trim().toLowerCase();
    const userId = decoded.id || decoded._id;

    let userDoc = null;
    let modelName = 'User';

    // 1. Look up in User collection
    if (userId && mongoose.Types.ObjectId.isValid(userId)) {
      userDoc = await User.findById(userId);
    }
    if (!userDoc && cleanEmail) {
      userDoc = await User.findOne({ email: cleanEmail });
    }

    // 2. Look up in Driver collection
    if (!userDoc && cleanEmail) {
      userDoc = await Driver.findOne({
        $or: [{ email: cleanEmail }, { phone: cleanEmail }, { driverBadgeId: cleanEmail }]
      });
      if (userDoc) modelName = 'Driver';
    }

    // 3. Look up in Vendor collection
    if (!userDoc && cleanEmail) {
      userDoc = await Vendor.findOne({
        $or: [{ email: cleanEmail }, { phone: cleanEmail }, { vendorId: cleanEmail }]
      });
      if (userDoc) modelName = 'Vendor';
    }

    // 4. Look up in Employee collection
    if (!userDoc && cleanEmail) {
      userDoc = await Employee.findOne({
        $or: [{ email: cleanEmail }, { phone: cleanEmail }, { employeeCode: cleanEmail }]
      });
      if (userDoc) modelName = 'Employee';
    }

    // STRICT: User must exist in the database! Auto-creation and default admin fallback are REMOVED.
    if (!userDoc) {
      return res.status(401).json({
        status: 'error',
        code: 'UNAUTHORIZED_USER_NOT_FOUND',
        message: 'User session not found in database.'
      });
    }

    const safeUser = userDoc.toObject ? userDoc.toObject() : { ...userDoc };
    delete safeUser.password;

    // Attach linked Employee document data for Staff/Employee accounts
    if (modelName === 'Employee') {
      safeUser.portal = 'staff';
      safeUser.designation = safeUser.designation || safeUser.role || 'Operations Staff';
      safeUser.jobRole = safeUser.jobRole || safeUser.designation;
      safeUser.employeeRole = safeUser.role || safeUser.designation;
      safeUser.role = 'staff';
    } else if (modelName === 'User' && (safeUser.role === 'staff' || safeUser.role === 'employee' || safeUser.portal === 'staff')) {
      safeUser.portal = 'staff';
      safeUser.role = 'staff';
      const linkedEmp = await Employee.findOne({
        $or: [
          { userId: userDoc._id },
          { email: userDoc.email },
          ...(userDoc.employeeCode ? [{ employeeCode: userDoc.employeeCode }] : [])
        ]
      }).lean();
      if (linkedEmp) {
        safeUser.employeeId = linkedEmp._id;
        safeUser.employeeCode = linkedEmp.employeeCode || linkedEmp.code || safeUser.employeeCode;
        safeUser.designation = linkedEmp.designation || linkedEmp.role || safeUser.designation;
        safeUser.department = linkedEmp.department || safeUser.department;
        safeUser.workType = linkedEmp.workType || safeUser.workType;
        safeUser.jobRole = linkedEmp.jobRole || safeUser.jobRole;
        safeUser.monthlySalary = Number(linkedEmp.monthlySalary || linkedEmp.salary || safeUser.monthlySalary || 42000);
        safeUser.salaryBasis = linkedEmp.salaryBasis || safeUser.salaryBasis;
        safeUser.reportingManager = linkedEmp.reportingManager || safeUser.reportingManager;
        safeUser.workLocation = linkedEmp.workLocation || safeUser.workLocation;
        safeUser.employmentType = linkedEmp.employmentType || safeUser.employmentType;
        safeUser.responsibilities = linkedEmp.responsibilities || safeUser.responsibilities;
        safeUser.address = linkedEmp.address || safeUser.address;
        safeUser.emergencyContact = linkedEmp.emergencyContact || safeUser.emergencyContact;
      }
    }

    // tenantId strictly derived from user record
    safeUser.tenantId = userDoc.tenantId || (safeUser.role === 'super_admin' ? 'system' : 'mak-tours');

    // Attach effective permissions
    safeUser.permissions = Array.isArray(userDoc.permissions) && userDoc.permissions.length > 0
      ? userDoc.permissions
      : ROLE_DEFAULT_PERMISSIONS[safeUser.role] || [];

    req.user = safeUser;
    req.userId = userDoc._id || userDoc.id;
    req.userModel = modelName;
    req.tenantId = safeUser.tenantId;
    next();
  } catch (err) {
    return res.status(401).json({
      status: 'error',
      code: 'UNAUTHORIZED_SESSION_ERROR',
      message: 'Invalid session credentials: ' + err.message
    });
  }
};

/**
 * Optional Authentication Middleware
 * If valid Bearer token provided, populates req.user. If no token, allows request to proceed unauthenticated.
 */
export const optionalAuth = async (req, res, next) => {
  const token = extractBearerToken(req.headers.authorization) || (req.query?.token ? String(req.query.token).trim() : null);
  if (!token) {
    return next();
  }
  try {
    const decoded = verifyToken(token);
    const cleanEmail = (decoded.email || '').trim().toLowerCase();
    const userId = decoded.id || decoded._id;

    let userDoc = null;
    if (userId && mongoose.Types.ObjectId.isValid(userId)) {
      userDoc = await User.findById(userId);
    }
    if (!userDoc && cleanEmail) {
      userDoc = await User.findOne({ email: cleanEmail });
    }

    if (userDoc) {
      const safeUser = userDoc.toObject ? userDoc.toObject() : { ...userDoc };
      delete safeUser.password;
      safeUser.tenantId = userDoc.tenantId || (safeUser.role === 'super_admin' ? 'system' : 'mak-tours');
      req.user = safeUser;
      req.userId = userDoc._id || userDoc.id;
      req.tenantId = safeUser.tenantId;
    }
    next();
  } catch {
    // If token invalid, proceed unauthenticated
    next();
  }
};

/**
 * Role-Based Access Control Middleware
 */
export const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        status: 'error',
        code: 'FORBIDDEN_INSUFFICIENT_ROLE',
        message: 'Access forbidden: Insufficient authorization role.'
      });
    }
    next();
  };
};

/**
 * Permission-Based Access Control Middleware
 */
export const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        code: 'UNAUTHORIZED',
        message: 'Authentication session required.'
      });
    }

    if (!hasPermission(req.user, permission)) {
      return res.status(403).json({
        status: 'error',
        code: 'FORBIDDEN_INSUFFICIENT_PERMISSIONS',
        message: `Access denied: Missing required permission "${permission}".`
      });
    }

    next();
  };
};

export default {
  requireAuth,
  optionalAuth,
  requireRole,
  requirePermission,
  hasPermission,
  ROLE_DEFAULT_PERMISSIONS,
  ACCOUNTANT_DENIED_MODULES
};
