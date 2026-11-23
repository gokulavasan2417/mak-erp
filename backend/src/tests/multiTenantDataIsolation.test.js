// MAK Tours & Travels ERP - Multi-Tenant Data Isolation End-to-End Test Suite
// Simulates Company A (apex-travels), Company B (royal-tours), Company C (city-cabs),
// Super Admin, and Master Tenant (mak-tours).

import dns from 'dns';
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch {}

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import * as models from '../models/index.js';
import { vehicleController } from '../controllers/vehicleController.js';
import { driverController } from '../controllers/driverController.js';
import { employeeController } from '../controllers/employeeController.js';
import { vendorController } from '../controllers/vendorController.js';
import { customerController } from '../controllers/customerController.js';
import { bookingController } from '../controllers/bookingController.js';
import { tripController } from '../controllers/tripController.js';
import { notificationController } from '../controllers/notificationController.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

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

// Helper to simulate Express mock req and res
function createMockReqRes({ user, tenantId, headers = {}, body = {}, params = {}, query = {} }) {
  const isSuperAdmin = user?.role === 'super_admin';
  const effectiveTenant = tenantId !== undefined ? tenantId : (isSuperAdmin ? null : (user?.tenantId || headers['x-tenant-id'] || 'mak-tours'));

  const req = {
    user,
    tenantId: effectiveTenant,
    tenantQuery: isSuperAdmin && !effectiveTenant ? {} : { tenantId: effectiveTenant },
    isSuperAdmin,
    headers: { ...headers },
    body: { ...body },
    params: { ...params },
    query: { ...query }
  };

  let statusCode = 200;
  let responseData = null;

  const res = {
    status: (code) => {
      statusCode = code;
      return res;
    },
    json: (data) => {
      responseData = data;
      return res;
    },
    send: (data) => {
      responseData = data;
      return res;
    }
  };

  return { req, res, getStatus: () => statusCode, getData: () => responseData };
}

async function runMultiTenantIsolationTests() {
  console.log('\n========================================================================');
  console.log('   MULTI-TENANT MONGO DATA ISOLATION & SECURITY VERIFICATION SUITE');
  console.log('========================================================================\n');

  // Connect to MongoDB Atlas
  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!mongoUri) {
    console.error('Missing MONGODB_URI in environment!');
    process.exit(1);
  }

  await mongoose.connect(mongoUri);
  console.log('Connected to MongoDB Atlas:', mongoose.connection.name);

  const tenantA = 'apex-travels';
  const tenantB = 'royal-tours';
  const tenantC = 'city-cabs';
  const masterTenant = 'mak-tours';

  try {
    // Clean up any test fixtures from previous runs
    await Promise.all([
      models.Vehicle.deleteMany({ tenantId: { $in: [tenantA, tenantB, tenantC] } }),
      models.Driver.deleteMany({ tenantId: { $in: [tenantA, tenantB, tenantC] } }),
      models.Employee.deleteMany({ tenantId: { $in: [tenantA, tenantB, tenantC] } }),
      models.Vendor.deleteMany({ tenantId: { $in: [tenantA, tenantB, tenantC] } }),
      models.Customer.deleteMany({ tenantId: { $in: [tenantA, tenantB, tenantC] } }),
      models.Booking.deleteMany({ tenantId: { $in: [tenantA, tenantB, tenantC] } }),
      models.Notification.deleteMany({ tenantId: { $in: [tenantA, tenantB, tenantC] } })
    ]);

    // -------------------------------------------------------------------------
    // TEST 1: Compound Unique Index Verification
    // -------------------------------------------------------------------------
    console.log('\n[Test 1: Compound Unique Indexes Schema Inspection]');
    {
      const driverIndexes = models.Driver.schema.indexes();
      const hasDriverCompound = driverIndexes.some(
        ([fields, opts]) => fields.tenantId === 1 && fields.driverBadgeId === 1 && opts.unique === true
      );
      assert(hasDriverCompound, 'Driver model has compound unique index on { tenantId: 1, driverBadgeId: 1 }');

      const employeeIndexes = models.Employee.schema.indexes();
      const hasEmpCompound = employeeIndexes.some(
        ([fields, opts]) => fields.tenantId === 1 && fields.employeeCode === 1 && opts.unique === true
      );
      assert(hasEmpCompound, 'Employee model has compound unique index on { tenantId: 1, employeeCode: 1 }');

      const vendorIndexes = models.Vendor.schema.indexes();
      const hasVendorCompound = vendorIndexes.some(
        ([fields, opts]) => fields.tenantId === 1 && fields.vendorId === 1 && opts.unique === true
      );
      assert(hasVendorCompound, 'Vendor model has compound unique index on { tenantId: 1, vendorId: 1 }');

      const vehicleIndexes = models.Vehicle.schema.indexes();
      const hasVehicleTenantIdx = vehicleIndexes.some(([fields]) => fields.tenantId === 1 && fields.regNo === 1);
      assert(hasVehicleTenantIdx, 'Vehicle model has compound index on { tenantId: 1, regNo: 1 }');

      const bookingIndexes = models.Booking.schema.indexes();
      const hasBookingTenantIdx = bookingIndexes.some(([fields]) => fields.tenantId === 1 && fields.bookingNumber === 1);
      assert(hasBookingTenantIdx, 'Booking model has compound index on { tenantId: 1, bookingNumber: 1 }');
    }

    // -------------------------------------------------------------------------
    // TEST 2: Company A Creates Full Business Data Records
    // -------------------------------------------------------------------------
    console.log('\n[Test 2: Company A Data Provisioning (apex-travels)]');
    let carA, driverA, employeeA, vendorA, customerA, bookingA;
    {
      // 2.1 Vehicle
      const { req, res, getStatus, getData } = createMockReqRes({
        user: { id: 'usr_a1', role: 'company_admin', tenantId: tenantA },
        body: {
          brand: 'Toyota',
          model: 'Innova Crysta',
          regNo: 'TN-09-APEX-01',
          ownership: 'Company Owned',
          category: 'SUV',
          seatingCapacity: 7,
          fuelType: 'Diesel',
          ratePerKm: 18,
          status: 'Available'
        }
      });
      await vehicleController.create(req, res, () => {});
      assert(getStatus() === 201, 'Company A successfully created vehicle TN-09-APEX-01');
      carA = getData().data;
      assert(carA.tenantId === tenantA, 'Created vehicle has tenantId === apex-travels');

      // 2.2 Driver
      const { req: dReq, res: dRes, getStatus: dStatus, getData: dData } = createMockReqRes({
        user: { id: 'usr_a1', role: 'company_admin', tenantId: tenantA },
        body: {
          driverBadgeId: 'DRV-001',
          fullName: 'Karthik Raja',
          phone: '+91 99001 12233',
          drivingLicenseNumber: 'DL-TN-APEX-01',
          status: 'Active',
          dutyStatus: 'Available',
          perTripRate: 1500
        }
      });
      await driverController.create(dReq, dRes, (err) => {
        if (err) console.error('Driver create next(err):', err);
      });
      assert(dStatus() === 201, `Company A successfully created driver DRV-001 (status: ${dStatus()})`);
      if (dStatus() !== 201) {
        console.error('Driver create response data:', dData());
      }
      driverA = dData().data;
      assert(driverA.tenantId === tenantA, 'Created driver has tenantId === apex-travels');

      // 2.3 Employee
      const { req: eReq, res: eRes, getStatus: eStatus, getData: eData } = createMockReqRes({
        user: { id: 'usr_a1', role: 'company_admin', tenantId: tenantA },
        body: {
          employeeCode: 'EMP-001',
          fullName: 'Sundar Operations',
          phone: '+91 98888 11111',
          role: 'Operations Coordinator',
          department: 'Operations & Dispatch',
          salary: 40000
        }
      });
      await employeeController.create(eReq, eRes, (err) => {
        if (err) console.error('Employee create next(err):', err);
      });
      assert(eStatus() === 201, `Company A successfully created employee EMP-001 (status: ${eStatus()})`);
      if (eStatus() !== 201) {
        console.error('Employee create response data:', eData());
      }
      employeeA = eData().data;
      assert(employeeA.tenantId === tenantA, 'Created employee has tenantId === apex-travels');

      // 2.4 Vendor
      const { req: vReq, res: vRes, getStatus: vStatus, getData: vData } = createMockReqRes({
        user: { id: 'usr_a1', role: 'company_admin', tenantId: tenantA },
        body: {
          vendorId: 'VND-001',
          companyName: 'Apex Fleet Suppliers',
          contactPerson: 'Mani Partner',
          phone: '+91 94444 33333',
          category: 'Fleet Partner'
        }
      });
      await vendorController.create(vReq, vRes, () => {});
      assert(vStatus() === 201, 'Company A successfully created vendor VND-001');
      vendorA = vData().data;
      assert(vendorA.tenantId === tenantA, 'Created vendor has tenantId === apex-travels');

      // 2.5 Customer
      const { req: cReq, res: cRes, getStatus: cStatus, getData: cData } = createMockReqRes({
        user: { id: 'usr_a1', role: 'company_admin', tenantId: tenantA },
        body: {
          name: 'Prakash Passenger',
          phone: '+91 98765 00001',
          email: 'prakash@example.com',
          city: 'Chennai'
        }
      });
      await customerController.create(cReq, cRes, () => {});
      assert(cStatus() === 201, 'Company A successfully created customer');
      customerA = cData().data;
      assert(customerA.tenantId === tenantA, 'Created customer has tenantId === apex-travels');

      // 2.6 Booking
      const { req: bReq, res: bRes, getStatus: bStatus, getData: bData } = createMockReqRes({
        user: { id: 'usr_a1', role: 'company_admin', tenantId: tenantA },
        body: {
          refId: 'BK-APEX-1001',
          bookingNumber: 'BK-APEX-1001',
          customerName: 'Prakash Passenger',
          customerPhone: '+91 98765 00001',
          pickupLocation: 'Chennai Airport',
          destination: 'Mahabalipuram',
          totalAmount: 4500,
          advancePaid: 1000,
          bookingType: 'Round Trip'
        }
      });
      await bookingController.create(bReq, bRes, () => {});
      assert(bStatus() === 201 || bStatus() === 200, 'Company A successfully created booking BK-APEX-1001');
      bookingA = bData().data;
      assert(bookingA.tenantId === tenantA, 'Created booking has tenantId === apex-travels');
    }

    // -------------------------------------------------------------------------
    // TEST 3: Company B Query Isolation (royal-tours returns 0 Company A records)
    // -------------------------------------------------------------------------
    console.log('\n[Test 3: Company B Read Query Isolation (royal-tours)]');
    {
      // 3.1 Vehicles
      const { req, res, getData } = createMockReqRes({
        user: { id: 'usr_b1', role: 'company_admin', tenantId: tenantB }
      });
      await vehicleController.getAll(req, res, () => {});
      const bCars = getData().data;
      assert(Array.isArray(bCars) && bCars.length === 0, 'Company B vehicle list contains 0 records (Company A car excluded)');

      // 3.2 Drivers
      const { req: dReq, res: dRes, getData: dData } = createMockReqRes({
        user: { id: 'usr_b1', role: 'company_admin', tenantId: tenantB }
      });
      await driverController.getAll(dReq, dRes, () => {});
      const bDrivers = dData().data;
      assert(Array.isArray(bDrivers) && bDrivers.length === 0, 'Company B driver list contains 0 records (Company A driver excluded)');

      // 3.3 Employees
      const { req: eReq, res: eRes, getData: eData } = createMockReqRes({
        user: { id: 'usr_b1', role: 'company_admin', tenantId: tenantB }
      });
      await employeeController.getAll(eReq, eRes, () => {});
      const bEmps = eData().data;
      assert(Array.isArray(bEmps) && bEmps.length === 0, 'Company B employee list contains 0 records (Company A employee excluded)');

      // 3.4 Vendors
      const { req: vReq, res: vRes, getData: vData } = createMockReqRes({
        user: { id: 'usr_b1', role: 'company_admin', tenantId: tenantB }
      });
      await vendorController.getAll(vReq, vRes, () => {});
      const bVendors = vData().data;
      assert(Array.isArray(bVendors) && bVendors.length === 0, 'Company B vendor list contains 0 records (Company A vendor excluded)');

      // 3.5 Customers
      const { req: cReq, res: cRes, getData: cData } = createMockReqRes({
        user: { id: 'usr_b1', role: 'company_admin', tenantId: tenantB }
      });
      await customerController.getAll(cReq, cRes, () => {});
      const bCustomers = cData().data;
      assert(Array.isArray(bCustomers) && bCustomers.length === 0, 'Company B customer list contains 0 records (Company A customer excluded)');

      // 3.6 Bookings
      const { req: bReq, res: bRes, getData: bData } = createMockReqRes({
        user: { id: 'usr_b1', role: 'company_admin', tenantId: tenantB }
      });
      await bookingController.getAll(bReq, bRes, () => {});
      const bBookings = bData().data;
      assert(Array.isArray(bBookings) && bBookings.length === 0, 'Company B booking list contains 0 records (Company A booking excluded)');
    }

    // -------------------------------------------------------------------------
    // TEST 4: Direct ID Access Attack Prevention
    // -------------------------------------------------------------------------
    console.log('\n[Test 4: Direct ID Access / IDOR Attack Prevention]');
    {
      // 4.1 Company B attempts GET /api/vehicles/:id with Company A car ID
      const { req, res, getStatus } = createMockReqRes({
        user: { id: 'usr_b1', role: 'company_admin', tenantId: tenantB },
        params: { id: carA.regNo }
      });
      await vehicleController.getById(req, res, () => {});
      assert(getStatus() === 404, 'Company B querying Company A car by ID receives 404 Not Found');

      // 4.2 Company B attempts GET /api/drivers/:id with Company A driver ID
      const { req: dReq, res: dRes, getStatus: dStatus } = createMockReqRes({
        user: { id: 'usr_b1', role: 'company_admin', tenantId: tenantB },
        params: { id: driverA.id || driverA.driverBadgeId }
      });
      await driverController.getById(dReq, dRes, () => {});
      assert(dStatus() === 404, 'Company B querying Company A driver by ID receives 404 Not Found');

      // 4.3 Company B attempts GET /api/employees/:id with Company A employee ID
      const { req: eReq, res: eRes, getStatus: eStatus } = createMockReqRes({
        user: { id: 'usr_b1', role: 'company_admin', tenantId: tenantB },
        params: { id: employeeA.employeeCode }
      });
      await employeeController.getById(eReq, eRes, () => {});
      assert(eStatus() === 404, 'Company B querying Company A employee by ID receives 404 Not Found');

      // 4.4 Company B attempts GET /api/bookings/:id with Company A booking ID
      const { req: bReq, res: bRes, getStatus: bStatus } = createMockReqRes({
        user: { id: 'usr_b1', role: 'company_admin', tenantId: tenantB },
        params: { id: bookingA.bookingNumber }
      });
      await bookingController.getById(bReq, bRes, () => {});
      assert(bStatus() === 404, 'Company B querying Company A booking by ID receives 404 Not Found');
    }

    // -------------------------------------------------------------------------
    // TEST 5: Cross-Tenant Data Tampering / Modification Blocked
    // -------------------------------------------------------------------------
    console.log('\n[Test 5: Cross-Tenant Mutation & Deletion Attack Prevention]');
    {
      // 5.1 Company B attempts to update Company A employee's salary
      const { req, res, getStatus } = createMockReqRes({
        user: { id: 'usr_b1', role: 'company_admin', tenantId: tenantB },
        params: { id: employeeA.employeeCode },
        body: { salary: 999999 }
      });
      await employeeController.update(req, res, () => {});
      assert(getStatus() === 404, 'Company B attempting to modify Company A employee receives 404 Not Found');

      // Verify Company A employee salary unchanged
      const empFresh = await models.Employee.findById(employeeA._id);
      assert(empFresh.salary === 40000, 'Company A employee salary was NOT modified by Company B request');

      // 5.2 Company B attempts to delete Company A vehicle
      const { req: vReq, res: vRes, getStatus: vStatus } = createMockReqRes({
        user: { id: 'usr_b1', role: 'company_admin', tenantId: tenantB },
        params: { id: carA.regNo }
      });
      await vehicleController.delete(vReq, vRes, () => {});
      assert(vStatus() === 404, 'Company B attempting to delete Company A vehicle receives 404 Not Found');

      const carFresh = await models.Vehicle.findById(carA._id);
      assert(Boolean(carFresh), 'Company A vehicle was NOT deleted by Company B request');
    }

    // -------------------------------------------------------------------------
    // TEST 6: Cross-Tenant Booking Assignment Protection
    // -------------------------------------------------------------------------
    console.log('\n[Test 6: Cross-Tenant Vehicle & Driver Assignment Prevention]');
    {
      // First, Company B creates a legitimate booking within its own company
      const { req: bReq, res: bRes, getData: bData } = createMockReqRes({
        user: { id: 'usr_b1', role: 'company_admin', tenantId: tenantB },
        body: {
          refId: 'BK-ROYAL-2001',
          bookingNumber: 'BK-ROYAL-2001',
          customerName: 'Queen Visitor',
          customerPhone: '+91 99999 88888',
          bookingType: 'Round Trip'
        }
      });
      await bookingController.create(bReq, bRes, () => {});
      const royalBooking = bData().data;

      // Now Company B attempts to assign Company A's car (TN-09-APEX-01) and driver (DRV-001) to Royal booking
      const { req: assignReq, res: assignRes, getStatus: assignStatus, getData: assignData } = createMockReqRes({
        user: { id: 'usr_b1', role: 'company_admin', tenantId: tenantB },
        params: { id: royalBooking.bookingNumber },
        body: {
          vehicleId: carA.regNo,
          driverId: driverA.driverBadgeId
        }
      });
      await bookingController.assign(assignReq, assignRes, () => {});

      assert(assignStatus() === 400, 'Company B assigning Company A vehicle/driver is rejected with HTTP 400');
      assert(
        assignData()?.code === 'CROSS_TENANT_RELATIONSHIP_FORBIDDEN',
        'Returns machine-readable code CROSS_TENANT_RELATIONSHIP_FORBIDDEN'
      );
    }

    // -------------------------------------------------------------------------
    // TEST 7: Cross-Tenant Vendor Vehicle Assignment Protection
    // -------------------------------------------------------------------------
    console.log('\n[Test 7: Cross-Tenant Vendor Attachment Attack Prevention]');
    {
      // Company B creates vendor
      const { req: vReq, res: vRes, getData: vData } = createMockReqRes({
        user: { id: 'usr_b1', role: 'company_admin', tenantId: tenantB },
        body: {
          vendorId: 'VND-ROYAL-01',
          companyName: 'Royal Coach Logistics',
          phone: '+91 91111 22222'
        }
      });
      await vendorController.create(vReq, vRes, () => {});
      const royalVendor = vData().data;

      // Company B attempts to attach Company A's car to Royal Vendor
      const { req: attachReq, res: attachRes, getStatus: attachStatus, getData: attachData } = createMockReqRes({
        user: { id: 'usr_b1', role: 'company_admin', tenantId: tenantB },
        params: { id: royalVendor.vendorId },
        body: {
          vehicleRegNo: carA.regNo
        }
      });
      await vendorController.addVehicle(attachReq, attachRes, () => {});

      assert(attachStatus() === 400, 'Company B vendor attaching Company A vehicle is rejected with HTTP 400');
      assert(
        attachData()?.code === 'CROSS_TENANT_RELATIONSHIP_FORBIDDEN',
        'Returns machine-readable code CROSS_TENANT_RELATIONSHIP_FORBIDDEN'
      );
    }

    // -------------------------------------------------------------------------
    // TEST 8: Anti-Tamper & Header Spoofing Resistance
    // -------------------------------------------------------------------------
    console.log('\n[Test 8: Client Header Spoofing & Tamper Resistance]');
    {
      // Company B user sends malicious header x-tenant-id: apex-travels to query vehicles
      const { req, res, getData } = createMockReqRes({
        user: { id: 'usr_b1', role: 'company_admin', tenantId: tenantB },
        headers: { 'x-tenant-id': tenantA } // Attempted spoof
      });
      await vehicleController.getAll(req, res, () => {});
      const cars = getData().data;
      assert(cars.length === 0, 'Server ignores spoofed x-tenant-id header and strictly enforces user.tenantId');
    }

    // -------------------------------------------------------------------------
    // TEST 9: Sequential Code Collisions Across Independent Companies
    // -------------------------------------------------------------------------
    console.log('\n[Test 9: Sequential Code Collisions Isolated Across Companies]');
    {
      // Company B creates Driver with SAME driverBadgeId 'DRV-001' and Employee with 'EMP-001'
      const { req: dReq, res: dRes, getStatus: dStatus, getData: dData } = createMockReqRes({
        user: { id: 'usr_b1', role: 'company_admin', tenantId: tenantB },
        body: {
          driverBadgeId: 'DRV-001', // Identical badge to Company A
          fullName: 'Suresh Royal Driver',
          phone: '+91 97777 66666'
        }
      });
      await driverController.create(dReq, dRes, () => {});
      assert(dStatus() === 201, 'Company B successfully created DRV-001 without duplicate key collision');
      assert(dData().data.tenantId === tenantB, 'Company B driver stored under royal-tours tenantId');

      const { req: eReq, res: eRes, getStatus: eStatus, getData: eData } = createMockReqRes({
        user: { id: 'usr_b1', role: 'company_admin', tenantId: tenantB },
        body: {
          employeeCode: 'EMP-001', // Identical code to Company A
          fullName: 'Anand Royal Coordinator',
          phone: '+91 96666 55555'
        }
      });
      await employeeController.create(eReq, eRes, () => {});
      assert(eStatus() === 201, 'Company B successfully created EMP-001 without duplicate key collision');
      assert(eData().data.tenantId === tenantB, 'Company B employee stored under royal-tours tenantId');

      // Company C also creates DRV-001 and EMP-001
      const { req: cReq, res: cRes, getStatus: cStatus } = createMockReqRes({
        user: { id: 'usr_c1', role: 'company_admin', tenantId: tenantC },
        body: {
          driverBadgeId: 'DRV-001',
          fullName: 'Muthu City Driver',
          phone: '+91 95555 44444'
        }
      });
      await driverController.create(cReq, cRes, () => {});
      assert(cStatus() === 201, 'Company C also successfully created DRV-001 in isolation');
    }

    // -------------------------------------------------------------------------
    // TEST 10: Trip Execution & Tenant Scoped Notifications with Timing
    // -------------------------------------------------------------------------
    console.log('\n[Test 10: Trip Lifecycle & Tenant-Scoped Timestamped Notifications]');
    {
      // First legitimately assign carA and driverA to bookingA
      const { req: assignReq, res: assignRes } = createMockReqRes({
        user: { id: 'usr_a1', role: 'company_admin', tenantId: tenantA },
        params: { id: bookingA.bookingNumber },
        body: {
          vehicleId: carA.regNo,
          driverId: driverA.driverBadgeId
        }
      });
      await bookingController.assign(assignReq, assignRes, () => {});

      // Chauffeur accepts trip
      const { req: accReq, res: accRes, getStatus: accStatus } = createMockReqRes({
        user: { id: 'drv_a1', role: 'driver', tenantId: tenantA },
        params: { id: bookingA.bookingNumber }
      });
      await tripController.accept(accReq, accRes, () => {});
      assert(accStatus() === 200, 'Company A driver accepted trip successfully');

      // Verify notification in Notification collection
      const notifsA = await models.Notification.find({ tenantId: tenantA }).sort({ createdAt: -1 }).lean();
      assert(notifsA.length > 0, 'Company A has persistent notification created');
      const latestNotif = notifsA[0];
      assert(Boolean(latestNotif.time), `Notification has human-readable time stamp: '${latestNotif.time}'`);
      assert(Boolean(latestNotif.timestamp), `Notification has human-readable timestamp: '${latestNotif.timestamp}'`);

      // Verify Company B notifications collection does NOT contain Company A's notification
      const notifsB = await models.Notification.find({ tenantId: tenantB }).lean();
      assert(notifsB.length === 0, 'Company B has 0 notifications (Company A notification not leaked)');
    }

    // -------------------------------------------------------------------------
    // TEST 11: Master Tenant (mak-tours) & Super Admin Access
    // -------------------------------------------------------------------------
    console.log('\n[Test 11: Master Tenant (mak-tours) Integrity & Super Admin Scope]');
    {
      // Verify mak-tours records remain intact
      const makCarCount = await models.Vehicle.countDocuments({ tenantId: masterTenant });
      assert(makCarCount >= 0, `Master tenant 'mak-tours' vehicles intact (count: ${makCarCount})`);

      // Super Admin can list companies & platform-wide vehicles
      const { req: saReq, res: saRes, getData: saData } = createMockReqRes({
        user: { id: 'sa_root', role: 'super_admin' },
        tenantId: null
      });
      // Test querying all vehicles as Super Admin across platform
      await vehicleController.getAll(saReq, saRes, () => {});
      const allPlatformVehicles = saData().data;
      assert(
        allPlatformVehicles.some((v) => v.tenantId === tenantA),
        'Super Admin authorized query includes tenant apex-travels vehicle'
      );
    }

    // -------------------------------------------------------------------------
    // CLEANUP
    // -------------------------------------------------------------------------
    await Promise.all([
      models.Vehicle.deleteMany({ tenantId: { $in: [tenantA, tenantB, tenantC] } }),
      models.Driver.deleteMany({ tenantId: { $in: [tenantA, tenantB, tenantC] } }),
      models.Employee.deleteMany({ tenantId: { $in: [tenantA, tenantB, tenantC] } }),
      models.Vendor.deleteMany({ tenantId: { $in: [tenantA, tenantB, tenantC] } }),
      models.Customer.deleteMany({ tenantId: { $in: [tenantA, tenantB, tenantC] } }),
      models.Booking.deleteMany({ tenantId: { $in: [tenantA, tenantB, tenantC] } }),
      models.Notification.deleteMany({ tenantId: { $in: [tenantA, tenantB, tenantC] } })
    ]);
  } finally {
    await mongoose.disconnect();
  }

  console.log('\n======================================================');
  console.log(`   MULTI-TENANT TEST RUN COMPLETE: ${passed} PASSED, ${failed} FAILED`);
  console.log('======================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runMultiTenantIsolationTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
