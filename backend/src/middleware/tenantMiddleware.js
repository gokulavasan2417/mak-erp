// MAK Tours & Travels ERP - Multi-Tenant Authorization & Licensing Middleware
import { Company } from '../models/Company.js';
import { License } from '../models/License.js';

// In-memory cache for company license statuses (cached for 15 seconds to minimize DB hits)
const companyCache = new Map();
const CACHE_TTL_MS = 15000;

export async function getCachedCompany(tenantId) {
  if (!tenantId) return null;
  const cleanId = String(tenantId).trim().toLowerCase();
  const cached = companyCache.get(cleanId);
  const now = Date.now();
  if (cached && (now - cached.cachedAt < CACHE_TTL_MS)) {
    return cached.data;
  }

  const company = await Company.findOne({ tenantId: cleanId }).lean();
  if (company) {
    companyCache.set(cleanId, { data: company, cachedAt: now });
  }
  return company;
}

export function clearCompanyCache(tenantId) {
  if (tenantId) {
    companyCache.delete(String(tenantId).trim().toLowerCase());
  } else {
    companyCache.clear();
  }
}

/**
 * Builds a query object for tenant isolation.
 * For the default master tenant 'mak-tours', legacy documents without a tenantId are included.
 */
export function buildTenantQuery(tenantId) {
  if (!tenantId) return {};
  const cleanId = String(tenantId).trim().toLowerCase();
  if (cleanId === 'mak-tours') {
    return {
      $or: [
        { tenantId: 'mak-tours' },
        { tenantId: { $exists: false } },
        { tenantId: null },
        { tenantId: '' }
      ]
    };
  }
  return { tenantId: cleanId };
}

/**
 * Safely merges a tenant query with a specific filter without letting $or keys overwrite each other.
 */
export function mergeTenantFilter(tenantFilter, specificFilter = {}) {
  const hasTenant = tenantFilter && Object.keys(tenantFilter).length > 0;
  const hasSpecific = specificFilter && Object.keys(specificFilter).length > 0;

  if (!hasTenant) return specificFilter || {};
  if (!hasSpecific) return tenantFilter || {};

  // If both filters have an $or clause, combine them using $and so neither is overwritten
  if (tenantFilter.$or && specificFilter.$or) {
    const { $or: tOr, ...tRest } = tenantFilter;
    const { $or: sOr, ...sRest } = specificFilter;
    return {
      ...tRest,
      ...sRest,
      $and: [
        { $or: tOr },
        { $or: sOr }
      ]
    };
  }

  return {
    ...tenantFilter,
    ...specificFilter
  };
}

/**
 * Resolves tenant for both authenticated and unauthenticated public requests (e.g., customer booking website).
 */
export const resolveTenant = (req, res, next) => {
  if (req.user) {
    if (req.user.role === 'super_admin') {
      const explicit = req.headers['x-tenant-id'] || req.query?.tenantId;
      req.tenantId = explicit ? String(explicit).trim().toLowerCase() : null;
      req.isSuperAdmin = true;
      req.tenantQuery = req.tenantId ? buildTenantQuery(req.tenantId) : {};
      return next();
    }

    // Authenticated non-super-admin: strictly ignore x-tenant-id / body / query
    req.tenantId = String(req.user.tenantId || 'mak-tours').trim().toLowerCase();
    req.isSuperAdmin = false;
    req.tenantQuery = buildTenantQuery(req.tenantId);

    // Strip/override client-provided tenant values to ensure downstream safety
    if (req.headers && req.headers['x-tenant-id']) {
      delete req.headers['x-tenant-id'];
    }
    if (req.body && typeof req.body === 'object' && req.body.tenantId && req.body.tenantId !== req.tenantId) {
      req.body.tenantId = req.tenantId;
    }
    return next();
  }

  // Unauthenticated requests (e.g. public website booking, inquiry)
  const headerTenant = req.headers['x-tenant-id'] || req.body?.tenantId || req.query?.tenantId;
  req.tenantId = headerTenant ? String(headerTenant).trim().toLowerCase() : 'mak-tours';
  req.isSuperAdmin = false;
  req.tenantQuery = buildTenantQuery(req.tenantId);
  next();
};

/**
 * Ensures the request is strictly associated with an authenticated tenant identity.
 * Super Admin can optionally query specific tenants, but company users are strictly locked to their own.
 */
export const requireTenant = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication session required.'
      });
    }

    // Super Admin operates platform-wide or can inspect specific tenants
    if (req.user.role === 'super_admin') {
      const explicitTenant = req.headers['x-tenant-id'] || req.query.tenantId;
      req.tenantId = explicitTenant ? String(explicitTenant).trim().toLowerCase() : null;
      req.isSuperAdmin = true;
      req.tenantQuery = req.tenantId ? buildTenantQuery(req.tenantId) : {};
      return next();
    }

    // Standard tenant user: identity derived strictly from server-side database record
    const tenantId = req.user.tenantId || 'mak-tours';
    req.tenantId = String(tenantId).trim().toLowerCase();
    req.isSuperAdmin = false;
    req.tenantQuery = buildTenantQuery(req.tenantId);
    next();
  } catch (err) {
    next(err);
  }
};

/**
 * Validates that the company account is active and its subscription/license has not expired.
 * Suspended or expired companies are immediately blocked from state-mutating and operational APIs.
 */
export const requireLicenseActive = async (req, res, next) => {
  try {
    // Super Admins bypass licensing checks
    if (req.user?.role === 'super_admin') {
      return next();
    }

    const tenantId = req.tenantId || req.user?.tenantId || 'mak-tours';
    const company = await getCachedCompany(tenantId);

    // If company doesn't exist in DB yet (e.g. legacy fallback before migration), allow fallback tenant
    if (!company) {
      if (tenantId === 'mak-tours') {
        return next();
      }
      return res.status(403).json({
        status: 'error',
        code: 'TENANT_NOT_FOUND',
        message: 'The requested company account was not found.'
      });
    }

    // 1. Check Company Status
    if (company.status === 'Suspended') {
      return res.status(403).json({
        status: 'error',
        code: 'ACCOUNT_SUSPENDED',
        message: 'This company account has been suspended by platform administration.',
        reason: company.suspensionReason || 'Subscription or compliance policy hold.',
        company: { name: company.name, tenantId: company.tenantId }
      });
    }

    if (company.status === 'Pending') {
      return res.status(403).json({
        status: 'error',
        code: 'ACCOUNT_PENDING',
        message: 'Your company registration is currently pending review and approval by Super Admin.',
        company: { name: company.name, tenantId: company.tenantId }
      });
    }

    if (company.status === 'Rejected') {
      return res.status(403).json({
        status: 'error',
        code: 'ACCOUNT_REJECTED',
        message: 'Your company registration was rejected.',
        reason: company.rejectionReason || 'Did not meet platform partner criteria.',
        company: { name: company.name, tenantId: company.tenantId }
      });
    }

    // 2. Check License Validity
    if (company.licenseExpiry) {
      const now = new Date();
      const expiry = new Date(company.licenseExpiry);
      if (now > expiry) {
        return res.status(403).json({
          status: 'error',
          code: 'LICENSE_EXPIRED',
          message: `Your subscription license expired on ${expiry.toLocaleDateString('en-IN')}. Please contact your administrator to renew.`,
          expiryDate: company.licenseExpiry,
          company: { name: company.name, tenantId: company.tenantId }
        });
      }
    }

    // Attach company details to request
    req.company = company;
    next();
  } catch (err) {
    next(err);
  }
};

/**
 * Strict gatekeeper allowing ONLY Super Administrators.
 */
export const requireSuperAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'super_admin') {
    return res.status(403).json({
      status: 'error',
      code: 'FORBIDDEN_SUPER_ADMIN_REQUIRED',
      message: 'Access denied: Requires Super Administrator privileges.'
    });
  }
  next();
};

export default {
  requireTenant,
  requireLicenseActive,
  requireSuperAdmin,
  getCachedCompany,
  clearCompanyCache
};
