// MAK Tours & Travels ERP - Phase 1 Security Foundation Verification Test Suite
import test, { describe, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

import app from '../app.js';
import { User } from '../models/User.js';
import { Company } from '../models/Company.js';
import { Vehicle } from '../models/Vehicle.js';
import { Booking } from '../models/Booking.js';
import { signToken } from '../utils/jwtUtils.js';

let mongod;
let server;
let baseUrl;

before(async () => {
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  await mongoose.connect(uri);

  // Start in-process Express server on ephemeral port (port 0)
  await new Promise((resolve) => {
    server = app.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://127.0.0.1:${port}`;
      resolve();
    });
  });
});

after(async () => {
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
  await mongoose.disconnect();
  if (mongod) {
    await mongod.stop();
  }
});

beforeEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key of Object.keys(collections)) {
    await collections[key].deleteMany({});
  }
});

describe('Phase 1: Security Foundation & Tenant Isolation Suite', () => {

  test('1. Unauthenticated request to protected route returns 401', async () => {
    const res = await fetch(`${baseUrl}/api/finance/overview`);
    assert.equal(res.status, 401);
    const body = await res.json();
    assert.equal(body.status, 'error');
  });

  test('2. Forged / unsigned token returns 401 and does NOT create a user in MongoDB', async () => {
    const forgedToken = 'MAK_JWT_' + Buffer.from('attacker-admin@evil.com').toString('base64');
    const res = await fetch(`${baseUrl}/api/finance/overview`, {
      headers: {
        'Authorization': `Bearer ${forgedToken}`
      }
    });

    assert.equal(res.status, 401);

    // Verify attacker user was NOT created in DB
    const attackerUser = await User.findOne({ email: 'attacker-admin@evil.com' });
    assert.equal(attackerUser, null, 'Security check: Attacker user must NOT be auto-created in MongoDB');
  });

  test('3. Token signed with WRONG secret returns 401', async () => {
    import('jsonwebtoken').then(async (jwt) => {
      const fakeToken = jwt.default.sign(
        { email: 'fake@example.com', role: 'company_admin', tenantId: 'mak-tours' },
        'wrong-secret-key-1234'
      );

      const res = await fetch(`${baseUrl}/api/finance/overview`, {
        headers: {
          'Authorization': `Bearer ${fakeToken}`
        }
      });

      assert.equal(res.status, 401);
    });
  });

  test('4. Tenant Isolation with Header Tampering: Tenant A token with Tenant B header still accesses Tenant A data', async () => {
    // 1. Seed two companies
    await Company.create({
      tenantId: 'company-a',
      slug: 'company-a',
      email: 'contact@companya.com',
      name: 'Company A Travels',
      status: 'Active'
    });
    await Company.create({
      tenantId: 'company-b',
      slug: 'company-b',
      email: 'contact@companyb.com',
      name: 'Company B Tours',
      status: 'Active'
    });

    // 2. Seed user for Company A
    const userA = await User.create({
      fullName: 'Alice Manager',
      email: 'alice@companya.com',
      password: 'HashPassword123',
      role: 'company_admin',
      portal: 'admin',
      tenantId: 'company-a',
      status: 'Active'
    });

    // 3. Seed vehicles in Company A and Company B
    await Vehicle.create({
      tenantId: 'company-a',
      name: 'Innova Crysta - A',
      regNo: 'TN-01-A-1001',
      category: 'SUV',
      status: 'Available'
    });
    await Vehicle.create({
      tenantId: 'company-b',
      name: 'Fortuner - B',
      regNo: 'TN-02-B-2002',
      category: 'Luxury SUV',
      status: 'Available'
    });

    // 4. Generate legitimate JWT for User A
    const tokenA = signToken({
      id: userA._id.toString(),
      email: userA.email,
      role: userA.role,
      tenantId: userA.tenantId
    });

    // 5. User A tries to tamper tenant by sending `x-tenant-id: company-b`
    const res = await fetch(`${baseUrl}/api/vehicles`, {
      headers: {
        'Authorization': `Bearer ${tokenA}`,
        'X-Tenant-Id': 'company-b'
      }
    });

    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.status, 'success');

    // Must return strictly Company A vehicles, never Company B
    const returnedRegNos = (body.data || []).map((v) => v.regNo);
    assert.ok(returnedRegNos.includes('TN-01-A-1001'), 'Must include Company A vehicle');
    assert.ok(!returnedRegNos.includes('TN-02-B-2002'), 'Must NEVER include Company B vehicle (Header Tampering thwarted)');
  });

  test('5. RBAC & Permission: Accountant allowed on finance/overview, denied on vehicles and trip assign', async () => {
    await Company.create({
      tenantId: 'mak-tours',
      slug: 'mak-tours',
      email: 'info@maktours.com',
      name: 'MAK Tours',
      status: 'Active'
    });

    const accountantUser = await User.create({
      fullName: 'Rajesh Accountant',
      email: 'accountant@maktours.com',
      password: 'HashPassword123',
      role: 'accountant',
      portal: 'accountant',
      tenantId: 'mak-tours',
      status: 'Active'
    });

    const accountantToken = signToken({
      id: accountantUser._id.toString(),
      email: accountantUser.email,
      role: accountantUser.role,
      tenantId: accountantUser.tenantId
    });

    // Allowed: GET /api/finance/overview -> 200
    const financeRes = await fetch(`${baseUrl}/api/finance/overview`, {
      headers: { 'Authorization': `Bearer ${accountantToken}` }
    });
    assert.equal(financeRes.status, 200, 'Accountant should have permission to view finance overview');

    // Denied: GET /api/vehicles -> 403
    const vehiclesRes = await fetch(`${baseUrl}/api/vehicles`, {
      headers: { 'Authorization': `Bearer ${accountantToken}` }
    });
    assert.equal(vehiclesRes.status, 403, 'Accountant must be denied access to fleet vehicles');
    const vehBody = await vehiclesRes.json();
    assert.equal(vehBody.code, 'FORBIDDEN_INSUFFICIENT_PERMISSIONS');

    // Denied: POST /api/bookings/123/assign -> 403
    const assignRes = await fetch(`${baseUrl}/api/bookings/BK-1001/assign`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accountantToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ vehicleId: 'V1', driverId: 'D1' })
    });
    assert.equal(assignRes.status, 403, 'Accountant must be denied access to trip assignments');
  });

  test('6. Super Admin flow unchanged: Super Admin can query specific tenant with x-tenant-id header', async () => {
    await Company.create({
      tenantId: 'target-company',
      slug: 'target-company',
      email: 'info@target.com',
      name: 'Target Company',
      status: 'Active'
    });

    const superAdminUser = await User.create({
      fullName: 'Super Admin',
      email: 'superadmin@maktours.com',
      password: 'HashPassword123',
      role: 'super_admin',
      portal: 'super-admin',
      tenantId: 'system',
      status: 'Active'
    });

    await Vehicle.create({
      tenantId: 'target-company',
      name: 'Target Fleet Van',
      regNo: 'TN-99-TGT-01',
      category: 'Tempo Traveller',
      status: 'Available'
    });

    const superAdminToken = signToken({
      id: superAdminUser._id.toString(),
      email: superAdminUser.email,
      role: superAdminUser.role,
      tenantId: superAdminUser.tenantId
    });

    const res = await fetch(`${baseUrl}/api/vehicles`, {
      headers: {
        'Authorization': `Bearer ${superAdminToken}`,
        'X-Tenant-Id': 'target-company'
      }
    });

    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.status, 'success');
    assert.ok(body.data.some((v) => v.regNo === 'TN-99-TGT-01'), 'Super Admin can inspect target-company vehicles');
  });

  test('7. Genuinely public customer booking endpoint POST /api/bookings remains accessible without auth', async () => {
    const res = await fetch(`${baseUrl}/api/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        customerName: 'Public Guest',
        mobileNumber: '9840112233',
        pickupLocation: 'Chennai Central',
        toLocation: 'Pondicherry Promenade',
        travelDate: '2026-11-20',
        vehicleType: 'Sedan',
        bookingType: 'Round Trip',
        pricing: 4500
      })
    });

    assert.equal(res.status, 201);
    const body = await res.json();
    assert.equal(body.status, 'success');
    assert.equal(body.data.fullName, 'Public Guest');
    assert.equal(body.data.tenantId, 'mak-tours');
  });

});
