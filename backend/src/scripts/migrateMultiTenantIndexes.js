// MAK Tours & Travels ERP - Multi-Tenant Index Migration Script
// Defaults to --dry-run. Pass --apply to execute changes.
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import dns from 'dns';

try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../../backend/.env') });

const isApply = process.argv.includes('--apply');
const isDryRun = !isApply;

async function findCollisions(collection, groupFields, title) {
  const groupId = {};
  groupFields.forEach((f) => {
    groupId[f] = `$${f}`;
  });

  const pipeline = [
    { $match: { [groupFields[0]]: { $exists: true, $ne: null } } },
    {
      $group: {
        _id: groupId,
        count: { $sum: 1 },
        docs: { $push: { _id: '$_id' } }
      }
    },
    { $match: { count: { $gt: 1 } } }
  ];

  const duplicates = await collection.aggregate(pipeline).toArray();
  if (duplicates.length > 0) {
    console.warn(`[WARNING] Found ${duplicates.length} duplicate collision(s) for ${title}:`);
    duplicates.forEach((d) => console.warn(`   Key:`, d._id, `Count:`, d.count));
  } else {
    console.log(`[OK] No collisions detected for ${title}.`);
  }
  return duplicates;
}

async function runMigration() {
  const uri = process.env.TEST_MONGODB_URI || process.env.MONGODB_URI;
  if (!uri) {
    console.error('[ERROR] No MongoDB URI provided in environment.');
    process.exit(1);
  }

  console.log(`=======================================================`);
  console.log(`MAK ERP Multi-Tenant Index Migration`);
  console.log(`Mode: ${isApply ? 'APPLY (Modifications will be executed)' : 'DRY-RUN (Diagnostic only)'}`);
  console.log(`Target: ${uri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')}`);
  console.log(`=======================================================\n`);

  await mongoose.connect(uri);
  const db = mongoose.connection.db;

  try {
    // 1. Check Payrolls
    console.log(`--- Checking 'payrolls' collection ---`);
    const payrollsCol = db.collection('payrolls');
    await findCollisions(payrollsCol, ['tenantId', 'employeeId', 'month'], 'payrolls {tenantId, employeeId, month}');
    await findCollisions(payrollsCol, ['tenantId', 'payrollCode'], 'payrolls {tenantId, payrollCode}');

    const existingPayrollIndexes = await payrollsCol.indexes();
    const obsoletePayrollIndexes = existingPayrollIndexes.filter(
      (idx) => idx.name === 'employeeId_1_month_1' || idx.name === 'payrollCode_1'
    );

    if (obsoletePayrollIndexes.length > 0) {
      console.log(`Found obsolete global indexes on payrolls:`, obsoletePayrollIndexes.map((i) => i.name));
      if (isApply) {
        for (const idx of obsoletePayrollIndexes) {
          console.log(`Dropping obsolete index '${idx.name}'...`);
          await payrollsCol.dropIndex(idx.name);
        }
      }
    }

    if (isApply) {
      console.log(`Creating compound unique index { tenantId: 1, employeeId: 1, month: 1 }...`);
      await payrollsCol.createIndex({ tenantId: 1, employeeId: 1, month: 1 }, { unique: true });
      console.log(`Creating compound unique index { tenantId: 1, payrollCode: 1 } (sparse)...`);
      await payrollsCol.createIndex({ tenantId: 1, payrollCode: 1 }, { unique: true, sparse: true });
    }

    // Helper to safely create index
    const safeCreateIndex = async (col, spec, opts, label) => {
      try {
        console.log(`Creating index for ${label}...`);
        await col.createIndex(spec, opts);
      } catch (err) {
        if (err.code === 85 || err.code === 86 || err.message?.includes('existing index')) {
          console.log(`[NOTE] Index for ${label} already exists in database.`);
        } else {
          console.warn(`[WARN] Could not create index for ${label}:`, err.message);
        }
      }
    };

    // 2. Check Bookings
    console.log(`\n--- Checking 'bookings' collection ---`);
    const bookingsCol = db.collection('bookings');
    await findCollisions(bookingsCol, ['tenantId', 'refId'], 'bookings {tenantId, refId}');
    if (isApply) {
      await safeCreateIndex(bookingsCol, { tenantId: 1, refId: 1 }, { unique: true, sparse: true }, 'bookings { tenantId: 1, refId: 1 }');
      await safeCreateIndex(bookingsCol, { tenantId: 1, bookingNumber: 1 }, { unique: true, sparse: true }, 'bookings { tenantId: 1, bookingNumber: 1 }');
    }

    // 3. Check Salary Payments
    console.log(`\n--- Checking 'salary_payments' collection ---`);
    const salPayCol = db.collection('salary_payments');
    await findCollisions(salPayCol, ['tenantId', 'paymentRef'], 'salary_payments {tenantId, paymentRef}');
    if (isApply) {
      await safeCreateIndex(salPayCol, { tenantId: 1, paymentRef: 1 }, { unique: true, sparse: true }, 'salary_payments { tenantId: 1, paymentRef: 1 }');
    }

    // 4. Check Invoices
    console.log(`\n--- Checking 'invoices' collection ---`);
    const invoicesCol = db.collection('invoices');
    await findCollisions(invoicesCol, ['tenantId', 'invoiceNumber'], 'invoices {tenantId, invoiceNumber}');
    if (isApply) {
      await safeCreateIndex(invoicesCol, { tenantId: 1, invoiceNumber: 1 }, { unique: true }, 'invoices { tenantId: 1, invoiceNumber: 1 }');
    }

    // 5. Check Expenses
    console.log(`\n--- Checking 'expenses' collection ---`);
    const expensesCol = db.collection('expenses');
    await findCollisions(expensesCol, ['tenantId', 'id'], 'expenses {tenantId, id}');
    if (isApply) {
      await safeCreateIndex(expensesCol, { tenantId: 1, id: 1 }, { unique: true, sparse: true }, 'expenses { tenantId: 1, id: 1 }');
    }

    // 6. Check Employees
    console.log(`\n--- Checking 'employees' collection ---`);
    const employeesCol = db.collection('employees');
    await findCollisions(employeesCol, ['tenantId', 'employeeCode'], 'employees {tenantId, employeeCode}');
    if (isApply) {
      await safeCreateIndex(
        employeesCol,
        { tenantId: 1, employeeCode: 1 },
        { unique: true, partialFilterExpression: { employeeCode: { $type: 'string', $gt: '' } } },
        'employees { tenantId: 1, employeeCode: 1 }'
      );
    }

    // 7. Check Vendors
    console.log(`\n--- Checking 'vendors' collection ---`);
    const vendorsCol = db.collection('vendors');
    await findCollisions(vendorsCol, ['tenantId', 'vendorId'], 'vendors {tenantId, vendorId}');
    if (isApply) {
      await safeCreateIndex(
        vendorsCol,
        { tenantId: 1, vendorId: 1 },
        { unique: true, partialFilterExpression: { vendorId: { $type: 'string', $gt: '' } } },
        'vendors { tenantId: 1, vendorId: 1 }'
      );
    }

    // 8. Check Counters
    console.log(`\n--- Checking 'counters' collection ---`);
    const countersCol = db.collection('counters');
    if (isApply) {
      await safeCreateIndex(countersCol, { tenantId: 1, sequenceName: 1 }, { unique: true }, 'counters { tenantId: 1, sequenceName: 1 }');
    }

    // 9. Check Payments (Clean obsolete orderId_1 index)
    console.log(`\n--- Checking 'payments' collection ---`);
    const paymentsCol = db.collection('payments');
    const existingPayIndexes = await paymentsCol.indexes().catch(() => []);
    const obsoletePayIndexes = existingPayIndexes.filter(
      (idx) => idx.name === 'orderId_1' || (idx.key && idx.key.orderId === 1 && !idx.key.tenantId && idx.unique)
    );
    if (obsoletePayIndexes.length > 0) {
      console.log(`Found obsolete legacy unique indexes on payments:`, obsoletePayIndexes.map((i) => i.name));
      if (isApply) {
        for (const idx of obsoletePayIndexes) {
          console.log(`Dropping obsolete index '${idx.name}'...`);
          await paymentsCol.dropIndex(idx.name).catch((e) => console.warn(`Drop failed:`, e.message));
        }
      }
    }

    console.log(`\n=======================================================`);
    if (isDryRun) {
      console.log(`[DRY-RUN COMPLETE] No database modifications were performed.`);
      console.log(`To apply these index changes, re-run with: node backend/src/scripts/migrateMultiTenantIndexes.js --apply`);
    } else {
      console.log(`[MIGRATION COMPLETE] All multi-tenant indexes successfully created.`);
    }
    console.log(`=======================================================`);
  } finally {
    await mongoose.disconnect();
  }
}

runMigration().catch((err) => {
  console.error('[MIGRATION FAILED]', err);
  process.exit(1);
});
