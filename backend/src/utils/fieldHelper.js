// MAK Tours & Travels ERP - Request Field Whitelisting & Protection Utility

const DEFAULT_PROTECTED_FIELDS = [
  'tenantId',
  '_id',
  'createdAt',
  'updatedAt',
  '__v'
];

/**
 * Remove protected / server-managed fields from user input.
 * Ensures clients cannot overwrite tenantId, database IDs, or audit timestamps.
 *
 * @param {Object} data - Input object (e.g. req.body)
 * @param {Array<string>} extraProtected - Optional additional fields to strip
 * @returns {Object} Cleaned object
 */
export function stripProtectedFields(data, extraProtected = []) {
  if (!data || typeof data !== 'object') return {};
  const protectedSet = new Set([...DEFAULT_PROTECTED_FIELDS, ...extraProtected]);
  const cleaned = {};

  for (const [key, value] of Object.entries(data)) {
    if (!protectedSet.has(key)) {
      cleaned[key] = value;
    }
  }

  return cleaned;
}

/**
 * Pick ONLY allowed fields from input data.
 * Guarantees that arbitrary attributes cannot be injected into database documents.
 *
 * @param {Object} data - Input object
 * @param {Array<string>} allowedFields - Whitelist of permitted field names
 * @returns {Object} Object with only allowed keys
 */
export function whitelistFields(data, allowedFields = []) {
  if (!data || typeof data !== 'object') return {};
  const allowedSet = new Set(allowedFields);
  const result = {};

  for (const key of allowedSet) {
    if (key in data && !DEFAULT_PROTECTED_FIELDS.includes(key)) {
      result[key] = data[key];
    }
  }

  return result;
}

export default {
  stripProtectedFields,
  whitelistFields
};
