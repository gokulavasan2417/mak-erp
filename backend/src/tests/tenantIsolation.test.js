// MAK Tours & Travels ERP - Multi-Tenant Security & Isolation Test Suite
// Verifies strict tenant boundaries, Super Admin gatekeeping, tamper protection, and schema integrity.

import {
  requireTenant,
  requireSuperAdmin,
  requireLicenseActive,
  resolveTenant
} from '../middleware/tenantMiddleware.js';
import * as models from '../models/index.js';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    failed++;
  }
}

async function runTestSuite() {
  console.log('\n======================================================');
  console.log('   MULTI-TENANT SAAS ARCHITECTURE TEST SUITE');
  console.log('======================================================\n');

  // TEST SUITE 1: Model Schema Integrity
  console.log('[Suite 1: Database Models Tenant Field Validation]');
  const expectedModels = [
    'User',
    'Booking',
    'Vehicle',
    'Driver',
    'Vendor',
    'Employee',
    'Attendance',
    'Expense',
    'Payment',
    'Payroll',
    'SalaryPayment',
    'PayrollPolicy',
    'LeaveRequest',
    'TourPackage',
    'Setting'
  ];

  for (const modelName of expectedModels) {
    const Model = models[modelName];
    assert(Boolean(Model), `Model ${modelName} is exported from models index`);
    if (Model && Model.schema) {
      const hasTenantId = Boolean(Model.schema.paths.tenantId);
      assert(hasTenantId, `Model ${modelName} schema has indexed 'tenantId' property`);
    }
  }

  assert(Boolean(models.Company), 'Multi-tenant Company model exists and is exported');
  assert(Boolean(models.License), 'Software License model exists and is exported');
  assert(Boolean(models.AuditLog), 'System AuditLog model exists and is exported');

  // TEST SUITE 2: Middleware Tenant Resolution & Tamper Resistance
  console.log('\n[Suite 2: Tenant Middleware & Anti-Tamper Enforcement]');

  // Test 2.1: Authenticated User Tenant Derivation
  {
    const req = {
      user: { id: 'u1', username: 'admin_abc', role: 'company_admin', tenantId: 'tenant-abc' },
      headers: {}
    };
    const res = {};
    let nextCalled = false;
    const next = () => { nextCalled = true; };

    requireTenant(req, res, next);
    assert(nextCalled === true, 'requireTenant permits authenticated user');
    assert(req.tenantId === 'tenant-abc', 'req.tenantId correctly assigned from req.user.tenantId');
    assert(req.tenantQuery && req.tenantQuery.tenantId === 'tenant-abc', 'req.tenantQuery is scoped strictly to tenant-abc');
  }

  // Test 2.2: Tampered Header Override Attempt
  {
    const req = {
      user: { id: 'u1', username: 'attacker', role: 'company_admin', tenantId: 'tenant-victim' },
      headers: { 'x-tenant-id': 'tenant-competitor' } // Malicious attempt to spoof tenant
    };
    const res = {};
    let nextCalled = false;
    const next = () => { nextCalled = true; };

    requireTenant(req, res, next);
    assert(req.tenantId === 'tenant-victim', 'Spoofed x-tenant-id header ignored; server-side identity enforced');
    assert(req.tenantQuery.tenantId === 'tenant-victim', 'Query remains scoped strictly to authenticated tenant');
  }

  // Test 2.3: Unauthenticated Fallback with resolveTenant
  {
    const req = {
      headers: { 'x-tenant-id': 'partner-tours' }
    };
    const res = {};
    let nextCalled = false;
    const next = () => { nextCalled = true; };

    resolveTenant(req, res, next);
    assert(nextCalled === true, 'resolveTenant permits unauthenticated public booking');
    assert(req.tenantId === 'partner-tours', 'resolveTenant accurately resolves public tenant header');
  }

  // Test 2.4: Default Legacy Tenant Fallback
  {
    const req = { headers: {} };
    const res = {};
    let nextCalled = false;
    const next = () => { nextCalled = true; };

    resolveTenant(req, res, next);
    assert(req.tenantId === 'mak-tours', 'resolveTenant defaults seamlessly to mak-tours for legacy traffic');
  }

  // TEST SUITE 3: Super Admin Security Barrier
  console.log('\n[Suite 3: Super Admin Authorization Boundaries]');

  // Test 3.1: Super Admin Access Granted
  {
    const req = {
      user: { id: 'sa1', username: 'superadmin', role: 'super_admin', tenantId: 'mak-tours' }
    };
    let statusCode = null;
    let jsonResponse = null;
    const res = {
      status: (code) => { statusCode = code; return res; },
      json: (data) => { jsonResponse = data; return res; }
    };
    let nextCalled = false;
    const next = () => { nextCalled = true; };

    requireSuperAdmin(req, res, next);
    assert(nextCalled === true, 'requireSuperAdmin grants access to role === super_admin');
    assert(statusCode === null, 'No error response code returned for super_admin');
  }

  // Test 3.2: Company Admin Blocked from Super Admin
  {
    const req = {
      user: { id: 'ca1', username: 'company_ceo', role: 'company_admin', tenantId: 'abc-travels' }
    };
    let statusCode = null;
    let jsonResponse = null;
    const res = {
      status: (code) => { statusCode = code; return res; },
      json: (data) => { jsonResponse = data; return res; }
    };
    let nextCalled = false;
    const next = () => { nextCalled = true; };

    requireSuperAdmin(req, res, next);
    assert(nextCalled === false, 'requireSuperAdmin strictly blocks company_admin');
    assert(statusCode === 403, 'Returns HTTP 403 Forbidden for non-superadmin');
    assert(jsonResponse && jsonResponse.code === 'FORBIDDEN_SUPER_ADMIN_REQUIRED', 'Returns FORBIDDEN_SUPER_ADMIN_REQUIRED error code');
  }

  // Test 3.3: Normal Admin Blocked from Super Admin
  {
    const req = {
      user: { id: 'a1', username: 'admin_user', role: 'admin', tenantId: 'abc-travels' }
    };
    let statusCode = null;
    const res = {
      status: (code) => { statusCode = code; return res; },
      json: () => res
    };
    let nextCalled = false;
    const next = () => { nextCalled = true; };

    requireSuperAdmin(req, res, next);
    assert(nextCalled === false, 'requireSuperAdmin strictly blocks normal admin');
    assert(statusCode === 403, 'Returns HTTP 403 Forbidden for admin');
  }

  // TEST SUITE 4: License & Company Status Enforcement
  console.log('\n[Suite 4: Subscription & License Gatekeeping]');

  // Test 4.1: Master Tenant Bypass
  {
    const req = {
      tenantId: 'mak-tours',
      user: { role: 'admin', tenantId: 'mak-tours' }
    };
    let nextCalled = false;
    const next = () => { nextCalled = true; };
    const res = {};

    await requireLicenseActive(req, res, next);
    assert(nextCalled === true, 'Master tenant (mak-tours) is always active and protected from lockout');
  }

  // Test 4.2: Super Admin Bypass
  {
    const req = {
      tenantId: 'suspended-corp',
      user: { role: 'super_admin', tenantId: 'suspended-corp' }
    };
    let nextCalled = false;
    const next = () => { nextCalled = true; };
    const res = {};

    await requireLicenseActive(req, res, next);
    assert(nextCalled === true, 'Super Admin bypasses company lockouts for management purposes');
  }

  console.log('\n======================================================');
  console.log(`TOTAL TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log('======================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTestSuite().catch((err) => {
  console.error('Test runner encountered an error:', err);
  process.exit(1);
});
