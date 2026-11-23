// MAK Tours & Travels ERP - Production MongoDB Atlas Database Connection
// Connected to Atlas cluster mak_tours
import mongoose from 'mongoose';
import dns from 'dns';
import dotenv from 'dotenv';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure backend .env is loaded regardless of invocation working directory
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Fix Windows DNS SRV record lookup issues with MongoDB Atlas clusters
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {
  // Ignore if running in environments where setServers is restricted
}

// Disable query buffering so database-dependent APIs fail immediately and cleanly
// instead of hanging for 10-30 seconds when MongoDB is disconnected or degraded
mongoose.set('bufferCommands', false);

let isConnected = false;
let lastError = null;
let lastDiagnosis = null;
let detectedClientIp = '106.51.150.44';
let reconnectInterval = null;

// Resolve client public IP asynchronously for whitelist diagnostics
function detectPublicIp() {
  try {
    https.get('https://api.ipify.org?format=json', { timeout: 3000 }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.ip) detectedClientIp = parsed.ip;
        } catch (_) {}
      });
    }).on('error', () => {});
  } catch (_) {}
}
detectPublicIp();

function analyzeConnectionError(err) {
  const msg = err?.message || String(err);
  let diagnosis = 'Unknown database connection error.';

  if (msg.includes('SSL alert number 80') || msg.includes('ERR_SSL_TLSV1_ALERT_INTERNAL_ERROR')) {
    diagnosis = `MongoDB Atlas rejected the TLS handshake with SSL alert 80. In MongoDB Atlas, this occurs when the connecting client's IP address is not included in the Atlas cluster's Network Access IP Whitelist. Current Public IP: ${detectedClientIp}. Please add this IP or '0.0.0.0/0' to your Atlas Network Access list.`;
  } else if (msg.includes('ServerSelectionError') || msg.includes('Could not connect to any servers')) {
    diagnosis = `Could not reach any replica set primary server in MongoDB Atlas cluster. Verify internet access, DNS resolution for SRV records, and ensure your current IP (${detectedClientIp}) is whitelisted on the Atlas cluster.`;
  } else if (msg.includes('bad auth') || msg.includes('Authentication failed')) {
    diagnosis = 'Authentication failed. Please verify the database user credentials in MONGODB_URI in backend/.env.';
  } else if (msg.includes('ENOTFOUND') || msg.includes('querySrv')) {
    diagnosis = 'DNS resolution error for the MongoDB cluster hostname. Ensure network connectivity and working DNS servers.';
  }

  return diagnosis;
}

export const connectDB = async () => {
  if (isConnected && mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    const err = new Error('MONGODB_URI is not defined in backend/.env');
    lastError = err.message;
    lastDiagnosis = 'Environment variable MONGODB_URI is missing.';
    throw err;
  }

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 8000,
      socketTimeoutMS: 45000,
      retryWrites: true,
      w: 'majority'
    });

    isConnected = true;
    lastError = null;
    lastDiagnosis = null;
    console.log(`[MongoDB] Successfully connected to database: "${conn.connection.name}" at host: ${conn.connection.host}`);

    // Clear background reconnect interval if running
    if (reconnectInterval) {
      clearInterval(reconnectInterval);
      reconnectInterval = null;
    }

    return conn.connection;
  } catch (err) {
    isConnected = false;
    lastError = err.message;
    lastDiagnosis = analyzeConnectionError(err);
    console.error('[MongoDB] Connection failure:', err.message);
    console.warn(`[MongoDB Diagnosis] ${lastDiagnosis}`);
    throw err;
  }
};

mongoose.connection.on('connected', () => {
  isConnected = true;
  lastError = null;
  lastDiagnosis = null;
  console.log('[MongoDB] Connection established');
});

mongoose.connection.on('error', (err) => {
  isConnected = false;
  lastError = err.message;
  lastDiagnosis = analyzeConnectionError(err);
  console.error('[MongoDB] Connection error event:', err.message);
});

mongoose.connection.on('disconnected', () => {
  isConnected = false;
  console.log('[MongoDB] Connection disconnected');
});

export const isDbConnected = () => isConnected && mongoose.connection.readyState === 1;

export const getDbStatus = () => ({
  connected: isDbConnected(),
  status: isDbConnected() ? 'connected' : 'disconnected',
  readyState: mongoose.connection.readyState,
  host: mongoose.connection.host || null,
  databaseName: mongoose.connection.name || null,
  lastError: lastError,
  diagnosis: lastDiagnosis,
  clientIp: detectedClientIp
});

/**
 * Periodically attempts to reconnect in the background when running in degraded mode.
 * As soon as the user whitelists their IP in Atlas, the connection will automatically succeed.
 */
export const startBackgroundReconnect = (intervalMs = 25000) => {
  if (reconnectInterval) return;
  reconnectInterval = setInterval(async () => {
    if (isDbConnected()) {
      clearInterval(reconnectInterval);
      reconnectInterval = null;
      return;
    }
    console.log('[MongoDB] Attempting background reconnection to Atlas...');
    detectPublicIp();
    try {
      await connectDB();
      console.log('[MongoDB] Background reconnection to Atlas succeeded! Database is now online.');
      try {
        const { bootstrapDatabaseIntegrity } = await import('../services/dbBootstrapService.js');
        await bootstrapDatabaseIntegrity();
      } catch (_) {}
    } catch (_) {
      // Reconnection attempt failed; keep running in degraded mode
    }
  }, intervalMs);
};

export const disconnectDB = async () => {
  if (reconnectInterval) {
    clearInterval(reconnectInterval);
    reconnectInterval = null;
  }
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    isConnected = false;
    console.log('[MongoDB] Disconnected successfully');
  }
};

// In-memory fallback container for backwards compatibility during initial boot
export const db = {
  users: [],
  bookings: [],
  drivers: [],
  vehicles: [],
  tourPackages: [],
  vendors: [],
  employees: [],
  attendance: [],
  expenses: [],
  payments: [],
  invoices: [],
  notifications: []
};

export default connectDB;
