// MAK Tours & Travels ERP - Regex Safety Utility

/**
 * Escapes special characters in a string for safe use in RegExp.
 * Optionally truncates input to prevent Regular Expression Denial of Service (ReDoS).
 *
 * @param {string} str - Raw user input string
 * @param {number} maxLength - Maximum allowed length (default 100)
 * @returns {string} Sanitized string safe for new RegExp() or $regex
 */
export function escapeRegex(str, maxLength = 100) {
  if (typeof str !== 'string') return '';
  const truncated = str.slice(0, maxLength);
  return truncated.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export default escapeRegex;
