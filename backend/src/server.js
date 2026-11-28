import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import app from './app.js';
import { connectDB, getDbStatus, startBackgroundReconnect } from './config/db.js';
import { bootstrapDatabaseIntegrity } from './services/dbBootstrapService.js';

// Load environment variables reliably from backend/.env
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const PORT = process.env.PORT || 5000;
let serverInstance = null;

function setupGracefulShutdown(server) {
  const shutdown = async (signal) => {
    console.log(`\n[MAK-ERP Server] Received ${signal}. Initiating graceful shutdown...`);
    if (server) {
      server.close(() => {
        console.log('[MAK-ERP Server] HTTP server closed cleanly.');
      });
    }
    try {
      if (mongoose.connection && mongoose.connection.readyState !== 0) {
        await mongoose.connection.close(false);
        console.log('[MAK-ERP Server] MongoDB Atlas connection closed cleanly.');
      }
    } catch (e) {
      console.error('[MAK-ERP Server] Error closing MongoDB connection:', e.message);
    }
    process.exit(0);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

async function startServer() {
  try {
    // Attempt real connection to MongoDB Atlas
    await connectDB();
    console.log('[MAK-ERP Server] Connected to MongoDB Atlas successfully.');

    // Automatically verify database records and ensure complete multi-tenant integrity
    await bootstrapDatabaseIntegrity();

    serverInstance = app.listen(PORT, () => {
      console.log(`[MAK-ERP Server] Running online on http://localhost:${PORT}`);
      console.log(`[MAK-ERP Server] Database Status: Connected`);
      console.log(`[MAK-ERP Server] Environment: ${process.env.NODE_ENV || 'development'}`);
    });
    setupGracefulShutdown(serverInstance);
  } catch (err) {
    const dbStatus = getDbStatus();
    console.error('[MAK-ERP Server] Database connection could not be established:', err.message);
    console.warn(`[MAK-ERP Server] Running in DB DEGRADED mode on http://localhost:${PORT}`);
    console.warn(`[MAK-ERP Server] Diagnostic Note: ${dbStatus.diagnosis}`);
    console.warn(`[MAK-ERP Server] Current Client Public IP: ${dbStatus.clientIp}`);
    console.warn(`[MAK-ERP Server] Whitelist this IP in Atlas Network Access: https://cloud.mongodb.com/`);

    // Start background auto-reconnection so the server connects as soon as Atlas IP whitelist is active
    startBackgroundReconnect(20000);

    serverInstance = app.listen(PORT, () => {
      console.warn(`[MAK-ERP Server] Started with DB degraded on http://localhost:${PORT}`);
      console.warn(`[MAK-ERP Server] Database-dependent endpoints will return 503 until Atlas connection succeeds.`);
    });
    setupGracefulShutdown(serverInstance);
  }
}

startServer();
