import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../../backend/.env') });

async function checkPayrolls() {
  const uri = process.env.TEST_MONGODB_URI || process.env.MONGODB_URI;
  if (!uri) {
    console.error('No MONGODB_URI found in environment.');
    process.exit(1);
  }
  await mongoose.connect(uri);
  const payrolls = await mongoose.connection.collection('payrolls').find({}).toArray();
  console.log('Total Payrolls:', payrolls.length);
  payrolls.forEach((p) => {
    console.log(
      p.payrollCode || p.id,
      '| Tenant:', p.tenantId,
      '| Month:', p.month,
      '| Emp:', p.employeeName,
      '| Net:', p.netPayableSalary,
      '| Paid:', p.totalPaidAmount,
      '| Outstanding:', p.outstandingSalary,
      '| Status:', p.status
    );
  });
  await mongoose.disconnect();
}

checkPayrolls().catch(console.error);
