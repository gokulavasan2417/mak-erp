// MAK Tours & Travels ERP - Database Availability Verification Middleware
import mongoose from 'mongoose';
import { getDbStatus } from '../config/db.js';

/**
 * Middleware that verifies MongoDB connectivity before executing database-dependent API handlers.
 * When MongoDB is unavailable (running in degraded mode), it returns an immediate HTTP 503 Service Unavailable
 * with diagnostic details rather than hanging or falsely reporting success.
 */
export const requireDatabase = (req, res, next) => {
  if (mongoose.connection.readyState === 1) {
    return next();
  }

  const dbStatus = getDbStatus();

  return res.status(503).json({
    status: 'error',
    statusCode: 503,
    error: 'DATABASE_UNAVAILABLE',
    message: 'Database is currently unavailable. The backend server is running in degraded mode because MongoDB Atlas could not be reached.',
    database: {
      connected: false,
      readyState: mongoose.connection.readyState,
      lastError: dbStatus.lastError || 'Could not connect to MongoDB Atlas cluster.',
      diagnosis: dbStatus.diagnosis || 'Atlas cluster unreachable. Check IP Access List in MongoDB Atlas Network Access.',
      clientIp: dbStatus.clientIp
    },
    hint: `Ensure the connecting client IP (${dbStatus.clientIp || 'your current IP'}) is added to the MongoDB Atlas cluster Network Access IP Whitelist.`
  });
};

export default requireDatabase;
