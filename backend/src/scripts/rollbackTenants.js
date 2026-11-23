// MAK Tours & Travels ERP - Safe Multi-Tenant Rollback Script
// Restores collections from pre-migration backup snapshots if ever needed.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import { connectDB } from '../config/db.js';

async function rollback(backupFolderName) {
  if (!backupFolderName) {
    console.error('Usage: node rollbackTenants.js <backup-folder-name>');
    console.error('Example: node rollbackTenants.js pre-saas-backup-2026-11-16T...');
    process.exit(1);
  }

  const backupDir = path.resolve(__dirname, `../../backups/${backupFolderName}`);
  if (!fs.existsSync(backupDir)) {
    console.error(`Backup directory not found: ${backupDir}`);
    process.exit(1);
  }

  console.log(`Connecting to database to restore from ${backupDir}...`);
  await connectDB();

  const manifestPath = path.join(backupDir, 'manifest.json');
  if (fs.existsSync(manifestPath)) {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    console.log('Manifest loaded:', manifest);
  }

  console.log('Restoring backup documents into Atlas collections...');
  const files = fs.readdirSync(backupDir).filter(f => f.endsWith('.json') && f !== 'manifest.json');

  for (const file of files) {
    const collectionName = file.replace('.json', '');
    const data = JSON.parse(fs.readFileSync(path.join(backupDir, file), 'utf8'));
    const collection = mongoose.connection.collection(collectionName);
    console.log(`Restoring collection "${collectionName}" (${data.length} records)...`);
    for (const doc of data) {
      const { _id, ...rest } = doc;
      await collection.updateOne(
        { _id: new mongoose.Types.ObjectId(_id) },
        { $set: rest, $unset: { tenantId: "" } },
        { upsert: true }
      );
    }
  }

  console.log('Rollback completed.');
  await mongoose.disconnect();
}

if (process.argv[2]) {
  rollback(process.argv[2]);
}

export { rollback };
