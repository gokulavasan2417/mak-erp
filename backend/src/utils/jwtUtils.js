// MAK Tours & Travels ERP - Cryptographically Signed JWT Utility
import jwt from 'jsonwebtoken';

const DEFAULT_SECRET = 'mak_tours_travels_super_secure_jwt_secret_key_2026';

export function getJwtSecret() {
  return process.env.JWT_SECRET || DEFAULT_SECRET;
}

export function signToken(payload, options = {}) {
  const secret = getJwtSecret();
  const expiresIn = options.expiresIn || process.env.JWT_EXPIRES_IN || '7d';
  return jwt.sign(payload, secret, { expiresIn, ...options });
}

export function verifyToken(token) {
  if (!token || typeof token !== 'string') {
    throw new Error('Token string required');
  }
  const secret = getJwtSecret();
  return jwt.verify(token, secret);
}

export function extractBearerToken(authHeader) {
  if (!authHeader || typeof authHeader !== 'string') return null;
  const parts = authHeader.trim().split(/\s+/);
  if (parts.length === 2 && parts[0].toLowerCase() === 'bearer') {
    return parts[1];
  }
  return null;
}

export default {
  signToken,
  verifyToken,
  extractBearerToken,
  getJwtSecret
};
