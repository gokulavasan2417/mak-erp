import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import requestLogger from './middleware/requestLogger.js';
import errorHandler from './middleware/errorHandler.js';
import requireDatabase from './middleware/checkDbConnection.js';
import { getDbStatus, isDbConnected, connectDB } from './config/db.js';
import { requireAuth } from './middleware/authMiddleware.js';
import { requireSuperAdmin } from './middleware/tenantMiddleware.js';
import apiRoutes from './routes/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const isProduction = process.env.NODE_ENV === 'production';

// Explicit CORS origin allow-list
const corsOriginsEnv = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',').map((o) => o.trim()).filter(Boolean)
  : [];

const allowedOrigins = [
  process.env.CLIENT_URL,
  ...corsOriginsEnv,
  ...(!isProduction
    ? [
        'http://localhost:5173',
        'http://localhost:5174',
        'http://localhost:3000',
        'http://127.0.0.1:5173',
        'http://127.0.0.1:5174'
      ]
    : [])
].filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, or server-to-server)
    if (!origin) {
      return callback(null, true);
    }
    const cleanOrigin = origin.replace(/\/+$/, '').toLowerCase();
    const isVercel = cleanOrigin.endsWith('.vercel.app') || cleanOrigin.includes('.vercel.app');
    const isLocal = cleanOrigin.includes('localhost') || cleanOrigin.includes('127.0.0.1');
    const isInList = allowedOrigins.some((o) => o.replace(/\/+$/, '').toLowerCase() === cleanOrigin);

    if (isVercel || isLocal || isInList) {
      return callback(null, true);
    }
    return callback(new Error(`Origin '${origin}' not allowed by CORS policy`), false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'X-Vendor-Id',
    'x-vendor-id',
    'X-Admin-Role',
    'x-admin-role',
    'X-Tenant-Id',
    'x-tenant-id'
  ]
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Body limit: Default 1MB for all general JSON and urlencoded traffic
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(requestLogger);

// Serve statically uploaded avatars and documents
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Root Route
app.get('/', (req, res) => {
  const dbStatus = getDbStatus();
  res.status(200).json({
    status: 'success',
    service: 'MAK Tours & Travels ERP API',
    version: '1.0.0',
    documentation: '/api/health',
    database: {
      connected: dbStatus.connected,
      status: dbStatus.status
    },
    timestamp: new Date().toISOString()
  });
});

// Accurate Health Check Route - Does NOT falsely report healthy when DB is down
app.get('/api/health', (req, res) => {
  const dbStatus = getDbStatus();
  const healthy = dbStatus.connected;

  res.status(healthy ? 200 : 503).json({
    status: healthy ? 'healthy' : 'degraded',
    service: 'mak-erp-backend',
    uptime: process.uptime(),
    database: isProduction
      ? { connected: dbStatus.connected, status: dbStatus.status }
      : dbStatus,
    timestamp: new Date().toISOString()
  });
});

// Deep Database Diagnostic Route - Sanitized in production
app.get('/api/health/db', (req, res) => {
  const dbStatus = getDbStatus();
  res.status(dbStatus.connected ? 200 : 503).json({
    service: 'mak-erp-backend',
    database: isProduction
      ? { connected: dbStatus.connected, status: dbStatus.status }
      : dbStatus,
    timestamp: new Date().toISOString()
  });
});

// In-Memory Rate Limiter for Reconnect Trigger (Max 3 calls/min)
const reconnectAttempts = new Map();
function reconnectRateLimiter(req, res, next) {
  const ip = req.ip || req.connection?.remoteAddress || 'unknown';
  const now = Date.now();
  const windowMs = 60 * 1000;
  const maxCalls = 3;

  const timestamps = (reconnectAttempts.get(ip) || []).filter((t) => now - t < windowMs);
  if (timestamps.length >= maxCalls) {
    return res.status(429).json({
      status: 'error',
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many database reconnect requests. Limit is 3 requests per minute.'
    });
  }
  timestamps.push(now);
  reconnectAttempts.set(ip, timestamps);
  next();
}

// Protected Manual Reconnect Trigger Route (Requires Super Admin Auth + Rate Limiting)
app.post('/api/health/reconnect', requireAuth, requireSuperAdmin, reconnectRateLimiter, async (req, res) => {
  try {
    await connectDB();
    try {
      const { bootstrapDatabaseIntegrity } = await import('./services/dbBootstrapService.js');
      await bootstrapDatabaseIntegrity();
    } catch (_) {}
    const status = getDbStatus();
    return res.status(200).json({
      status: 'success',
      message: 'Successfully reconnected to MongoDB Atlas',
      database: isProduction ? { connected: status.connected, status: status.status } : status
    });
  } catch (err) {
    const status = getDbStatus();
    return res.status(503).json({
      status: 'error',
      message: 'Reconnection attempt failed',
      error: isProduction ? 'Internal database error' : err.message,
      database: isProduction ? { connected: status.connected, status: status.status } : status
    });
  }
});

// Mount All Database-Dependent Master REST API Endpoints at /api with DB check
app.use('/api', requireDatabase, apiRoutes);

// Centralized Error Handler
app.use(errorHandler);

export default app;
