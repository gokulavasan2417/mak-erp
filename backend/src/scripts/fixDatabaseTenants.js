import dns from 'dns';
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {}

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../../backend/.env') });

const MASTER_TENANT_ID = 'mak-tours';

async function run() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('No MONGODB_URI in environment!');
    process.exit(1);
  }

  console.log('Connecting to MongoDB Atlas...');
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });
  const db = mongoose.connection.db;
  console.log('Connected to:', mongoose.connection.name);

  // Set explicit driverBadgeId and tenantId for all drivers
  const driversCol = db.collection('drivers');
  const drivers = await driversCol.find({}).toArray();
  for (const d of drivers) {
    const badgeId = d.driverBadgeId || d.badgeNumber || d.id || `DRV-${d._id.toString().slice(-3)}`;
    await driversCol.updateOne(
      { _id: d._id },
      {
        $set: {
          tenantId: MASTER_TENANT_ID,
          driverBadgeId: badgeId,
          badgeNumber: badgeId,
          id: d.id || badgeId
        }
      }
    );
    console.log(`✓ Updated driver ${d.name || d.fullName} (${badgeId}) -> tenantId: ${MASTER_TENANT_ID}`);
  }

  // Set explicit employeeCode and tenantId for all employees
  const employeesCol = db.collection('employees');
  const employees = await employeesCol.find({}).toArray();
  for (const e of employees) {
    const code = e.employeeCode || e.code || e.id || `EMP-${e._id.toString().slice(-3)}`;
    await employeesCol.updateOne(
      { _id: e._id },
      {
        $set: {
          tenantId: MASTER_TENANT_ID,
          employeeCode: code,
          code: code,
          id: e.id || code
        }
      }
    );
  }
  console.log(`✓ Updated all ${employees.length} employees with employeeCode and tenantId`);

  // Set explicit vendorId and tenantId for all vendors
  const vendorsCol = db.collection('vendors');
  const vendors = await vendorsCol.find({}).toArray();
  for (const v of vendors) {
    const vId = v.vendorId || v.id || `VND-${v._id.toString().slice(-3)}`;
    await vendorsCol.updateOne(
      { _id: v._id },
      {
        $set: {
          tenantId: MASTER_TENANT_ID,
          vendorId: vId,
          id: v.id || vId
        }
      }
    );
  }
  console.log(`✓ Updated all ${vendors.length} vendors with vendorId and tenantId`);

  // 5. Verify counts for mak-tours
  console.log('\n=== VERIFICATION SUMMARY FOR "mak-tours" ===');
  for (const name of ['drivers', 'employees', 'vendors', 'attendance', 'bookings', 'vehicles', 'customers', 'tourpackages']) {
    const total = await db.collection(name).countDocuments();
    const makCount = await db.collection(name).countDocuments({ tenantId: MASTER_TENANT_ID });
    console.log(`  ${name.padEnd(16)}: ${makCount} for mak-tours (total ${total} in db)`);
  }

  await mongoose.disconnect();
  console.log('\nAll drivers, employees, and vendors successfully verified!');
  process.exit(0);
}

run().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
