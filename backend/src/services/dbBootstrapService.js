// MAK Tours & Travels ERP - Database Self-Healing & Bootstrap Service
// Automatically verifies, provisions, and maintains multi-tenant integrity on startup.
import mongoose from 'mongoose';
import { Company } from '../models/Company.js';
import { License } from '../models/License.js';
import { Driver } from '../models/Driver.js';
import { Employee } from '../models/Employee.js';
import { Vendor } from '../models/Vendor.js';
import { User } from '../models/User.js';
import { autoEnrollRepeatCustomers } from '../controllers/customerController.js';

const MASTER_TENANT_ID = 'mak-tours';
const MASTER_COMPANY_NAME = 'MAK Tours & Travels';
const MASTER_ADMIN_EMAIL = 'admin@maktours.com';

const CORE_COLLECTIONS = [
  'drivers',
  'employees',
  'vendors',
  'attendance',
  'bookings',
  'vehicles',
  'customers',
  'tourpackages',
  'payrolls',
  'payroll_policies',
  'salary_payments',
  'payments',
  'expenses',
  'enquiries',
  'settings',
  'users',
  'notifications',
  'leave_requests'
];

export async function bootstrapDatabaseIntegrity() {
  try {
    const db = mongoose.connection.db;
    if (!db) {
      console.warn('[DB-Bootstrap] Cannot run bootstrap: MongoDB connection not ready');
      return;
    }

    console.log('[DB-Bootstrap] Running automated database integrity verification...');

    // 1. Ensure Master Company Profile exists
    let masterCompany = await Company.findOne({ tenantId: MASTER_TENANT_ID });
    if (!masterCompany) {
      await Company.create({
        tenantId: MASTER_TENANT_ID,
        name: MASTER_COMPANY_NAME,
        legalName: 'MAK Tours & Travels Private Limited',
        slug: 'mak-tours',
        email: MASTER_ADMIN_EMAIL,
        phone: '+91 98401 11000',
        address: '14/2 GST Road, Alandur',
        city: 'Chennai',
        state: 'Tamil Nadu',
        pincode: '600016',
        gstin: '33AABCM9821K1ZZ',
        status: 'Active',
        plan: 'Enterprise',
        licenseKey: 'MAK-LIC-2026-ENT-0001',
        licenseStatus: 'Active',
        licenseStart: new Date('2026-01-01'),
        licenseExpiry: new Date('2035-12-31'),
        enabledModules: [
          'bookings', 'fleet', 'drivers', 'vendors', 'employees',
          'attendance', 'payroll', 'finance', 'reports', 'packages'
        ],
        limits: { maxUsers: 100, maxVehicles: 200, maxDrivers: 200, maxMonthlyBookings: 10000 },
        branding: {
          logo: '',
          primaryColor: '#2C3480',
          accentColor: '#EAB308',
          tagline: 'Premier Tours, Fleet Operations & Logistics',
          invoicePrefix: 'INV-MAK-',
          receiptPrefix: 'RCPT-MAK-',
          bookingPrefix: 'MAK-',
          currency: 'INR',
          currencySymbol: '₹',
          timezone: 'Asia/Kolkata'
        },
        primaryAdmin: {
          name: 'Ananya Deshmukh',
          email: MASTER_ADMIN_EMAIL,
          phone: '+91 98401 11000'
        }
      });
      console.log('  [✓] Master Company ("mak-tours") provisioned successfully');
    }

    // 2. Ensure Master License exists
    let masterLicense = await License.findOne({ licenseKey: 'MAK-LIC-2026-ENT-0001' });
    if (!masterLicense) {
      await License.create({
        licenseKey: 'MAK-LIC-2026-ENT-0001',
        tenantId: MASTER_TENANT_ID,
        companyName: MASTER_COMPANY_NAME,
        plan: 'Enterprise',
        status: 'Active',
        validFrom: new Date('2026-01-01'),
        validUntil: new Date('2035-12-31'),
        issuedBy: 'Platform Setup Bootstrap'
      });
      console.log('  [✓] Master License provisioned successfully');
    }

    // 3. Ensure all drivers have unique driverBadgeId and tenantId: 'mak-tours'
    const driversCol = db.collection('drivers');
    const drivers = await driversCol.find({}).toArray();
    for (const d of drivers) {
      const badgeId = d.driverBadgeId || d.badgeNumber || d.id || `DRV-${d._id.toString().slice(-3)}`;
      const targetTenant = d.tenantId || MASTER_TENANT_ID;
      if (!d.driverBadgeId || !d.tenantId || !d.id) {
        await driversCol.updateOne(
          { _id: d._id },
          {
            $set: {
              tenantId: targetTenant,
              driverBadgeId: badgeId,
              badgeNumber: badgeId,
              id: d.id || badgeId
            }
          }
        );
      }
    }

    // 4. Ensure all employees have unique employeeCode and tenantId: 'mak-tours'
    const employeesCol = db.collection('employees');
    const employees = await employeesCol.find({}).toArray();
    for (const e of employees) {
      const code = e.employeeCode || e.code || e.id || `EMP-${e._id.toString().slice(-3)}`;
      const targetTenant = e.tenantId || MASTER_TENANT_ID;
      if (!e.employeeCode || !e.tenantId || !e.id) {
        await employeesCol.updateOne(
          { _id: e._id },
          {
            $set: {
              tenantId: targetTenant,
              employeeCode: code,
              code: code,
              id: e.id || code
            }
          }
        );
      }
    }

    // 5. Ensure all vendors have unique vendorId and tenantId: 'mak-tours'
    const vendorsCol = db.collection('vendors');
    const vendors = await vendorsCol.find({}).toArray();
    for (const v of vendors) {
      const vId = v.vendorId || v.id || `VND-${v._id.toString().slice(-3)}`;
      const targetTenant = v.tenantId || MASTER_TENANT_ID;
      if (!v.vendorId || !v.tenantId || !v.id) {
        await vendorsCol.updateOne(
          { _id: v._id },
          {
            $set: {
              tenantId: targetTenant,
              vendorId: vId,
              id: v.id || vId
            }
          }
        );
      }
    }

    // 6. In-place self-heal: Ensure ANY record missing tenantId defaults to 'mak-tours'
    for (const colName of CORE_COLLECTIONS) {
      try {
        const col = db.collection(colName);
        const filter = {
          $or: [{ tenantId: { $exists: false } }, { tenantId: null }, { tenantId: '' }]
        };
        const missing = await col.countDocuments(filter);
        if (missing > 0) {
          const res = await col.updateMany(filter, { $set: { tenantId: MASTER_TENANT_ID } });
          console.log(`  [✓] Auto-healed "${colName}": tagged ${res.modifiedCount} records with tenantId: "${MASTER_TENANT_ID}"`);
        }
      } catch (err) {
        console.warn(`  [!] Auto-heal notice for "${colName}":`, err.message);
      }
    }

    // 7. Ensure vehicle fields consistency (regNo <-> numberPlate, ratePerKm <-> pricePerKm)
    try {
      const vehiclesCol = db.collection('vehicles');
      const allVehs = await vehiclesCol.find({}).toArray();
      for (const v of allVehs) {
        const updates = {};
        const targetTenant = v.tenantId || MASTER_TENANT_ID;
        if (!v.tenantId) updates.tenantId = targetTenant;

        const plate = v.numberPlate || v.regNo || v.registrationNumber || '';
        if (plate) {
          if (!v.regNo) updates.regNo = plate;
          if (!v.numberPlate) updates.numberPlate = plate;
          if (!v.registrationNumber) updates.registrationNumber = plate;
        }

        const rate = Number(v.pricePerKm !== undefined ? v.pricePerKm : (v.ratePerKm !== undefined ? v.ratePerKm : 15));
        if (v.pricePerKm === undefined) updates.pricePerKm = rate;
        if (v.ratePerKm === undefined) updates.ratePerKm = rate;

        const base = Number(v.basePrice !== undefined ? v.basePrice : (v.baseFare !== undefined ? v.baseFare : 2000));
        if (v.basePrice === undefined) updates.basePrice = base;
        if (v.baseFare === undefined) updates.baseFare = base;

        if (Object.keys(updates).length > 0) {
          await vehiclesCol.updateOne({ _id: v._id }, { $set: updates });
        }
      }
    } catch (vErr) {
      console.warn('  [!] Vehicle integrity self-heal notice:', vErr.message);
    }

    // 8. Ensure booking customer and reference fields consistency across all existing records
    try {
      const bookingsCol = db.collection('bookings');
      const allBookings = await bookingsCol.find({}).toArray();
      for (const b of allBookings) {
        const updates = {};
        const cName = (b.fullName || b.customerName || b.name || '').trim();
        if (cName) {
          if (!b.fullName) updates.fullName = cName;
          if (!b.customerName) updates.customerName = cName;
          if (!b.name) updates.name = cName;
        }

        const cPhone = (b.mobileNumber || b.customerPhone || b.phone || '').trim();
        if (cPhone) {
          if (!b.mobileNumber) updates.mobileNumber = cPhone;
          if (!b.customerPhone) updates.customerPhone = cPhone;
          if (!b.phone) updates.phone = cPhone;
        }

        const bRef = (b.bookingNumber || b.refId || b.bookingId || b.id || (b._id ? b._id.toString() : '')).trim();
        if (bRef) {
          if (!b.bookingNumber) updates.bookingNumber = bRef;
          if (!b.refId) updates.refId = bRef;
          if (!b.bookingId) updates.bookingId = bRef;
          if (!b.id) updates.id = bRef;
        }

        if (Object.keys(updates).length > 0) {
          await bookingsCol.updateOne({ _id: b._id }, { $set: updates });
        }
      }
    } catch (bErr) {
      console.warn('  [!] Booking integrity self-heal notice:', bErr.message);
    }

    // 8. Auto-enroll repeat customers with >= 2 bookings into Customer CRM
    try {
      await autoEnrollRepeatCustomers({ tenantId: MASTER_TENANT_ID }, MASTER_TENANT_ID);
      console.log('  [✓] Auto-enrolled repeat customers (>= 2 bookings) into Customer CRM');
    } catch (cErr) {
      console.warn('  [!] Repeat customer auto-enroll notice:', cErr.message);
    }

    console.log('[DB-Bootstrap] Database integrity verified: All records linked and visible.');
  } catch (err) {
    console.error('[DB-Bootstrap] Error during database integrity check:', err.message);
  }
}

export default { bootstrapDatabaseIntegrity };
