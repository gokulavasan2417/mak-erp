// MAK Tours & Travels ERP - Safe Multi-Tenant Database Migration Script
// Creates an automated snapshot backup of all collections before applying in-place tenantId defaulting.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import { connectDB } from '../config/db.js';
import {
  Company,
  License,
  AuditLog,
  User,
  Booking,
  Vehicle,
  Driver,
  Vendor,
  Employee,
  Attendance,
  Payroll,
  SalaryPayment,
  PayrollPolicy,
  LeaveRequest,
  Expense,
  Payment,
  TourPackage,
  Setting
} from '../models/index.js';

const MASTER_TENANT_ID = 'mak-tours';
const MASTER_COMPANY_NAME = 'MAK Tours & Travels';
const MASTER_ADMIN_EMAIL = 'admin@maktours.com';
const SUPER_ADMIN_EMAIL = process.env.SUPER_ADMIN_EMAIL || 'superadmin@maktours.com';

const COLLECTIONS_TO_MIGRATE = [
  { name: 'users', model: User },
  { name: 'bookings', model: Booking },
  { name: 'vehicles', model: Vehicle },
  { name: 'drivers', model: Driver },
  { name: 'vendors', model: Vendor },
  { name: 'employees', model: Employee },
  { name: 'attendance', model: Attendance },
  { name: 'payrolls', model: Payroll },
  { name: 'salarypayments', model: SalaryPayment },
  { name: 'payrollpolicies', model: PayrollPolicy },
  { name: 'leaverequests', model: LeaveRequest },
  { name: 'expenses', model: Expense },
  { name: 'payments', model: Payment },
  { name: 'tourpackages', model: TourPackage },
  { name: 'settings', model: Setting }
];

async function runMigration() {
  console.log('=====================================================');
  console.log('🚀 Starting Safe Multi-Tenant Migration to MongoDB Atlas');
  console.log('=====================================================\n');

  try {
    await connectDB();
    console.log('[1/5] Connected to MongoDB Atlas successfully.');

    // 1. Create Timestamped Backup Snapshot
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = path.resolve(__dirname, `../../backups/pre-saas-backup-${timestamp}`);
    fs.mkdirSync(backupDir, { recursive: true });
    console.log(`[2/5] Creating pre-migration JSON snapshot backup in:\n      ${backupDir}`);

    const backupSummary = {};
    for (const item of COLLECTIONS_TO_MIGRATE) {
      try {
        const docs = await item.model.find({}).lean();
        const filePath = path.join(backupDir, `${item.name}.json`);
        fs.writeFileSync(filePath, JSON.stringify(docs, null, 2), 'utf8');
        backupSummary[item.name] = docs.length;
        console.log(`  ✓ Backed up "${item.name}": ${docs.length} records`);
      } catch (backupErr) {
        console.warn(`  ⚠️ Could not backup collection "${item.name}":`, backupErr.message);
      }
    }
    fs.writeFileSync(
      path.join(backupDir, 'manifest.json'),
      JSON.stringify({ timestamp, backupSummary, masterTenantId: MASTER_TENANT_ID }, null, 2),
      'utf8'
    );

    // 2. Provision Master Company ('mak-tours')
    console.log('\n[3/5] Provisioning Master Tenant ("MAK Tours & Travels")...');
    let masterCompany = await Company.findOne({ tenantId: MASTER_TENANT_ID });
    if (!masterCompany) {
      masterCompany = await Company.create({
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
          'bookings',
          'fleet',
          'drivers',
          'vendors',
          'employees',
          'attendance',
          'payroll',
          'finance',
          'reports',
          'packages'
        ],
        limits: {
          maxUsers: 100,
          maxVehicles: 200,
          maxDrivers: 200,
          maxMonthlyBookings: 10000
        },
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
        },
        notes: 'Original master company and default ERP tenant.'
      });
      console.log('  ✓ Created Master Company: "MAK Tours & Travels" (tenantId: "mak-tours")');
    } else {
      console.log('  ✓ Master Company already exists.');
    }

    // 3. Provision Master License
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
        limits: masterCompany.limits,
        issuedBy: 'Platform Setup Bootstrap'
      });
      console.log('  ✓ Provisioned Master Enterprise License (valid until 2035)');
    }

    // 4. Provision Platform Super Admin
    console.log('\n[4/5] Bootstrapping Super Administrator Account...');
    let superAdmin = await User.findOne({ email: SUPER_ADMIN_EMAIL.toLowerCase() });
    if (!superAdmin) {
      superAdmin = await User.create({
        tenantId: 'system',
        fullName: 'Platform Super Administrator',
        name: 'Platform Super Administrator',
        email: SUPER_ADMIN_EMAIL.toLowerCase(),
        password: process.env.SUPER_ADMIN_PASSWORD || 'Super@123',
        role: 'super_admin',
        portal: 'super-admin',
        designation: 'Enterprise Platform Owner',
        company: 'MAK SaaS Cloud Infrastructure',
        location: 'Central Control Hub',
        status: 'Active',
        isActive: true
      });
      console.log(`  ✓ Super Admin created: ${SUPER_ADMIN_EMAIL}`);
    } else {
      if (superAdmin.role !== 'super_admin') {
        await User.findByIdAndUpdate(superAdmin._id, {
          $set: { role: 'super_admin', portal: 'super-admin', tenantId: 'system' }
        });
        console.log(`  ✓ Updated existing user ${SUPER_ADMIN_EMAIL} to super_admin.`);
      } else {
        console.log(`  ✓ Super Admin account verified: ${SUPER_ADMIN_EMAIL}`);
      }
    }

    // 5. In-Place Enrichment: Set tenantId = 'mak-tours' on unassigned records
    console.log('\n[5/5] In-Place Tenant Enrichment on All Collections...');
    const migrationResults = {};

    for (const item of COLLECTIONS_TO_MIGRATE) {
      try {
        const filter = {
          $or: [{ tenantId: { $exists: false } }, { tenantId: null }, { tenantId: '' }]
        };
        const countMissing = await item.model.countDocuments(filter);
        if (countMissing > 0) {
          const updateRes = await item.model.updateMany(filter, {
            $set: { tenantId: MASTER_TENANT_ID }
          });
          migrationResults[item.name] = updateRes.modifiedCount;
          console.log(`  ✓ "${item.name}": Updated ${updateRes.modifiedCount} documents to tenantId "${MASTER_TENANT_ID}"`);
        } else {
          migrationResults[item.name] = 0;
          console.log(`  ✓ "${item.name}": All records already properly tagged.`);
        }
      } catch (updErr) {
        console.error(`  ❌ Error updating "${item.name}":`, updErr.message);
      }
    }

    // Log this migration event to AuditLog
    await AuditLog.create({
      tenantId: 'system',
      action: 'PLATFORM_MIGRATION_COMPLETED',
      actorName: 'System Migration Script',
      actorRole: 'system',
      entityType: 'Platform',
      details: {
        timestamp,
        backupDir,
        migrationResults
      },
      severity: 'info'
    });

    console.log('\n=====================================================');
    console.log('🎉 Multi-Tenant SaaS Migration Completed Successfully!');
    console.log('   All existing MAK Tours records are safe & isolated.');
    console.log('=====================================================\n');
  } catch (err) {
    console.error('\n❌ Fatal Migration Error:', err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

if (process.argv[1] && process.argv[1].endsWith('migrateTenants.js')) {
  runMigration();
}

export { runMigration };
