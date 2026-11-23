// MAK Tours & Travels ERP - Centralized Persistent ID Generator
// Guarantees monotonic, non-repeating, collision-free identifiers across all entities

const SEQUENCE_STORAGE_KEY = 'mak_id_sequences_v1';

let memorySequences = {
  BK: 10,
  ASN: 10,
  EXP: 20,
  PAY: 20,
  REC: 20,
  INV: 100,
  DRV: 10,
  VEH: 120,
  CUST: 50,
  VND: 20,
  HTL: 20,
  PKG: 120,
  EMP: 30,
  NOTIF: 50,
  TCK: 20,
  TL: 100
};

function getStoredSequences() {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const raw = window.localStorage.getItem(SEQUENCE_STORAGE_KEY);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch (e) {
      console.warn('Failed to read ID sequences:', e);
    }
  }
  return { ...memorySequences };
}

function saveSequences(seqs) {
  memorySequences = { ...seqs };
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.setItem(SEQUENCE_STORAGE_KEY, JSON.stringify(seqs));
    } catch (e) {
      console.warn('Failed to save ID sequences:', e);
    }
  }
}

/**
 * Update the sequence counter if existing items have higher IDs
 */
export function seedSequenceIfHigher(prefix, highestNumber) {
  if (typeof highestNumber !== 'number' || isNaN(highestNumber)) return;
  const seqs = getStoredSequences();
  const cleanPrefix = prefix.replace(/[^A-Z]/g, '');
  if (!seqs[cleanPrefix] || highestNumber >= seqs[cleanPrefix]) {
    seqs[cleanPrefix] = highestNumber + 1;
    saveSequences(seqs);
  }
}

/**
 * Generate a new unique ID with prefix.
 * e.g. generateId('EXP') => 'EXP-2026-021'
 * e.g. generateId('DRV', { useYear: false, pad: 3 }) => 'DRV-011'
 */
export function generateId(prefix, options = {}) {
  const {
    useYear = true,
    year = new Date().getFullYear(),
    pad = 3,
    customSeparator = '-'
  } = options;

  const cleanPrefix = prefix.replace(/[^A-Z]/g, '');
  const seqs = getStoredSequences();
  const currentVal = seqs[cleanPrefix] || 1;
  const nextVal = currentVal + 1;
  seqs[cleanPrefix] = nextVal;
  saveSequences(seqs);

  const numPart = String(currentVal).padStart(pad, '0');

  if (useYear) {
    return `${cleanPrefix}${customSeparator}${year}${customSeparator}${numPart}`;
  }
  return `${cleanPrefix}${customSeparator}${numPart}`;
}

/**
 * Generate synchronized Booking ID and Booking Number
 * e.g. { id: 'BK-2026-010', bookingNumber: 'MAK-2026-010' }
 */
export function generateBookingIdentifiers(year = new Date().getFullYear()) {
  const seqs = getStoredSequences();
  const currentVal = seqs.BK || 10;
  seqs.BK = currentVal + 1;
  saveSequences(seqs);

  const numPart = String(currentVal).padStart(3, '0');
  return {
    id: `BK-${year}-${numPart}`,
    bookingNumber: `MAK-${year}-${numPart}`
  };
}

export default generateId;
