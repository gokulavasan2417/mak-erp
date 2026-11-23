// MAK Tours & Travels ERP - Centralized Trip, Driver Assignment, Finance & Expense Lifecycle Context
// CRITICAL: ONE WAY TRIP IS STRICTLY FORBIDDEN IN THIS ENTIRE SYSTEM.
// Allowed journey categories: 'Round Trip', 'Local Trip', 'Tour Package', 'Airport Transfer', 'Custom Journey'

/**
 * CANONICAL BOOKING & TRIP STATUS MODEL:
 * 
 * bookingStatus:
 *   Pending → Confirmed (after driver accepts assignment) → On Trip → Completed
 *   Also: Cancelled
 * 
 * tripStatus:
 *   Awaiting Driver Assignment → Awaiting Driver Acceptance → Driver Accepted → In Progress → Completed
 *   Also: Driver Declined, Cancelled
 * 
 * driverAssignmentStatus:
 *   Pending → Assigned → Accepted
 *   Also: Reassignment Required, Cancelled
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { initialBookings } from '../data/bookingsData';
import { initialDrivers } from '../data/driversData';
import { initialVehicles } from '../data/fleetData';
import { initialPayments, initialInvoices, initialExpenses } from '../data/financeData';
import { useToast } from './ToastContext';
import {
  datesOverlap,
  getDaysBetween,
  isDriverAvailable as checkDriverAvailability,
  isVehicleAvailable as checkVehicleAvailability,
  getDriverConflicts,
  getVehicleConflicts,
  normalizeDate,
  formatDateDMY
} from '../utils/dateUtils';
import { generateId, generateBookingIdentifiers, seedSequenceIfHigher } from '../utils/idGenerator';
import { loadStoredJson, saveStoredJson } from '../utils/storage';
import { apiClient, bookingService, tripService, vehicleService, driverService, financeService } from '../services';

export const TripContext = createContext(null);

// Purge legacy mock shared keys so fresh Atlas data reflects accurately
try {
  [
    'mak_shared_bookings_v7',
    'mak_shared_drivers_v7',
    'mak_shared_vehicles_v7',
    'mak_shared_assignments_v7',
    'mak_shared_expenses_v7',
    'mak_shared_payments_v7',
    'mak_shared_invoices_v7',
    'mak_admin_notifs_v7',
    'mak_driver_notifs_v7',
    'mak_shared_bookings_v9_clean',
    'mak_shared_drivers_v9_clean',
    'mak_shared_vehicles_v9_clean'
  ].forEach((k) => localStorage.removeItem(k));
} catch {}

const STORAGE_KEYS = {
  BOOKINGS: 'mak_shared_bookings_v10_atlas',
  DRIVERS: 'mak_shared_drivers_v10_atlas',
  VEHICLES: 'mak_shared_vehicles_v10_atlas',
  ASSIGNMENTS: 'mak_shared_assignments_v10_atlas',
  EXPENSES: 'mak_shared_expenses_v10_atlas',
  PAYMENTS: 'mak_shared_payments_v10_atlas',
  INVOICES: 'mak_shared_invoices_v10_atlas',
  ADMIN_NOTIFS: 'mak_admin_notifs_v10_atlas',
  DRIVER_NOTIFS: 'mak_driver_notifs_v10_atlas'
};

// Sanitize trip category: strictly prohibits 'One Way' and normalizes to canonical categories
export function sanitizeBookingCategory(cat, booking) {
  if (!cat || typeof cat !== 'string' || cat.toLowerCase().includes('one way')) {
    if (booking?.packageName || booking?.packageId) return 'Tour Package';
    if (booking?.bookingCategory === 'Local Trip' || booking?.tripType === 'Local Trip') return 'Local Trip';
    return 'Round Trip';
  }
  return cat.trim();
}

// Normalize and migrate initial bookings to canonical format
function cleanInitialBookings() {
  return initialBookings.map((b) => {
    const total = parseFloat(b.totalAmount) || 0;
    const adv = parseFloat(b.advancePaid) || 0;
    const bal = Math.max(0, total - adv);
    const timeline = Array.isArray(b.assignmentTimeline)
      ? b.assignmentTimeline
      : Array.isArray(b.history)
      ? b.history.map((h, i) => ({ id: `TL-${i}`, timestamp: h.timestamp, event: h.event, actor: h.user || 'System', status: 'Info' }))
      : [];
    const cleanCat = sanitizeBookingCategory(b.bookingCategory || b.category || b.bookingType, b);

    return {
      ...b,
      bookingCategory: cleanCat,
      bookingType: cleanCat,
      category: cleanCat,
      tripType: b.tripType && !String(b.tripType).toLowerCase().includes('one way') ? b.tripType : cleanCat,
      totalAmount: total,
      advancePaid: adv,
      balanceAmount: bal,
      assignmentTimeline: timeline,
      history: timeline,
      // Expenses are stored strictly in expenses collection
      expenses: undefined
    };
  });
}

// Extract initial expenses from bookings and finance data
function cleanInitialExpenses() {
  const all = [...initialExpenses];
  initialBookings.forEach((b) => {
    if (Array.isArray(b.expenses)) {
      b.expenses.forEach((exp) => {
        all.push({
          ...exp,
          source: exp.source || 'Driver Claim',
          status: exp.status === 'Pending Approval' ? 'Pending Approval' : (exp.status || 'Approved'),
          approvedAmount: exp.approvedAmount !== undefined ? parseFloat(exp.approvedAmount) : parseFloat(exp.amount)
        });
      });
    }

    // Include completed bookings driver compensation in initial expenses
    if (b.bookingStatus === 'Completed' && b.driverId) {
      const driverPay = b.driverCompensationAmount || (b.bookingCategory === 'Tour Package' ? 2500 : 1500);
      const exists = all.some((e) => e.bookingId === b.id && e.category === 'Driver Salary');
      if (!exists) {
        all.push({
          id: `EXP-DRV-${b.id}`,
          bookingId: b.id,
          bookingNumber: b.bookingNumber || b.id,
          title: `Driver Compensation - #${b.bookingNumber || b.id} (${b.bookingCategory})`,
          description: `Fixed driver trip compensation for ${b.driverName || 'Driver'} on ${b.bookingCategory}`,
          category: 'Driver Salary',
          source: 'Driver Payroll',
          amount: driverPay,
          approvedAmount: driverPay,
          payee: b.driverName || 'Driver',
          driverId: b.driverId,
          date: '2026-11-08',
          status: 'Approved',
          paymentMethod: 'UPI / Direct Bank'
        });
      }
    }
  });
  return all;
}

// Helper to generate expenses for completed bookings: Vendor Payout & Driver Compensation
function generateCompletedBookingExpenses(booking, totalAmt, todayStr) {
  const generated = [];
  const storedSettings = loadStoredJson('mak_admin_settings_v4', null);
  const defVendorPercent = storedSettings?.payoutPolicies?.vendorPayoutPercent ?? 85;
  const defRoundTripPay = storedSettings?.payoutPolicies?.driverRoundTripPay ?? 1500;
  const defTourPackagePay = storedSettings?.payoutPolicies?.driverTourPackagePay ?? 2500;

  const isVendor = Boolean(
    booking.isVendorVehicle ||
    booking.assignedVehicle?.isVendorVehicle ||
    (booking.assignedVehicle?.vendorId && booking.assignedVehicle?.ownership !== 'MAK Owned') ||
    booking.vendorId
  );

  const vPercent = booking.vendorPayoutPercent || defVendorPercent;
  const vPayableAmt = booking.vendorPayableAmount !== undefined
    ? booking.vendorPayableAmount
    : (isVendor ? Math.round(totalAmt * (vPercent / 100)) : 0);

  const dPayAmt = booking.driverCompensationAmount !== undefined
    ? booking.driverCompensationAmount
    : (booking.bookingCategory === 'Tour Package' ? defTourPackagePay : defRoundTripPay);

  // 1. Vendor Vehicle Payout Expense (if vendor vehicle was used)
  if (isVendor && vPayableAmt > 0) {
    const vName = booking.assignedVehicle?.vendorName || booking.vendorName || 'Apex Fleet Solutions Pvt Ltd';
    generated.push({
      id: `EXP-VND-${booking.id}`,
      bookingId: booking.id,
      bookingNumber: booking.bookingNumber || booking.id,
      title: `Vendor Vehicle Payout - #${booking.bookingNumber || booking.id}`,
      description: `Contracted vehicle hire payout for ${vName} (${vPercent}% of booking fare ₹${Number(totalAmt).toLocaleString('en-IN')})`,
      category: 'Vendor Payout',
      source: 'Vendor Settlement',
      amount: vPayableAmt,
      approvedAmount: vPayableAmt,
      payee: vName,
      vendorId: booking.assignedVehicle?.vendorId || booking.vendorId || 'VND-101',
      date: todayStr,
      status: 'Approved',
      paymentMethod: 'Bank Transfer'
    });
  }

  // 2. Driver Compensation Expense (Fixed price amount managed by Admin: Round Trip vs Tour)
  if (booking.driverId && dPayAmt > 0) {
    const dName = booking.driverName || booking.assignedDriver?.name || 'Assigned Driver';
    generated.push({
      id: `EXP-DRV-${booking.id}`,
      bookingId: booking.id,
      bookingNumber: booking.bookingNumber || booking.id,
      title: `Driver Compensation - #${booking.bookingNumber || booking.id} (${booking.bookingCategory})`,
      description: `Fixed driver trip compensation for ${dName} on ${booking.bookingCategory}`,
      category: 'Driver Salary',
      source: 'Driver Payroll',
      amount: dPayAmt,
      approvedAmount: dPayAmt,
      payee: dName,
      driverId: booking.driverId,
      date: todayStr,
      status: 'Approved',
      paymentMethod: 'UPI / Direct Bank'
    });
  }

  return generated;
}

export function TripProvider({ children }) {
  const toast = useToast();

  // Backend API connectivity status
  const [isBackendConnected, setIsBackendConnected] = useState(false);

  useEffect(() => {
    let mounted = true;
    const probe = async () => {
      try {
        const ok = await apiClient.healthCheck();
        if (mounted) setIsBackendConnected(Boolean(ok));
      } catch {
        if (mounted) setIsBackendConnected(false);
      }
    };
    probe();
    const timer = setInterval(probe, 15000);
    return () => {
      mounted = false;
      clearInterval(timer);
    };
  }, []);

  // Reflect live vehicles/cars, bookings, and drivers from connected database
  useEffect(() => {
    vehicleService
      .getAll()
      .then((res) => {
        if (res?.data && Array.isArray(res.data) && res.data.length > 0) {
          setVehicles((prev) => {
            const localMap = new Map();
            (prev || []).forEach((v) => {
              const k1 = (v.id || '').toUpperCase();
              const k2 = (v.regNo || v.numberPlate || '').toUpperCase().replace(/\s+/g, '');
              if (k1) localMap.set(k1, v);
              if (k2) localMap.set(k2, v);
            });

            const seenKeys = new Set();
            const merged = [];

            res.data.forEach((remote) => {
              if (remote.isDeleted === true || remote.status === 'Inactive') return;
              const k1 = (remote.id || '').toUpperCase();
              const k2 = (remote.regNo || remote.numberPlate || '').toUpperCase().replace(/\s+/g, '');
              const local = (k1 && localMap.get(k1)) || (k2 && localMap.get(k2));

              const isVendor = Boolean(
                (local && (local.vendorId || local.ownership === 'Vendor Attached' || local.ownership === 'Vendor Owned')) ||
                remote.vendorId ||
                remote.ownership === 'Vendor Attached' ||
                remote.ownership === 'Vendor Owned' ||
                (typeof remote.ownership === 'string' && remote.ownership.toLowerCase().includes('vendor')) ||
                k1 === 'VEH-023' ||
                k2 === 'TN09CD1234'
              );

              // Use remote image from MongoDB Atlas first; fallback to local
              const chosenImg = (Array.isArray(remote.images) && remote.images.length > 0 ? remote.images[0] : remote.image) ||
                (local && Array.isArray(local.images) && local.images.length > 0 ? local.images[0] : local?.image) || '';

              const chosenImgs = (Array.isArray(remote.images) && remote.images.length > 0 ? remote.images : null) ||
                (local && Array.isArray(local.images) && local.images.length > 0 ? local.images : null) ||
                (chosenImg ? [chosenImg] : []);

              const mergedVehicle = {
                ...(local || {}),
                ...remote,
                ownership: isVendor ? 'Vendor Attached' : (remote.ownership || local?.ownership || 'MAK Owned'),
                ownershipType: isVendor ? 'Vendor Owned' : (remote.ownershipType || local?.ownershipType || 'Company Owned'),
                vendorId: remote.vendorId || local?.vendorId || (isVendor ? 'VND-101' : ''),
                vendorName: remote.vendorName || local?.vendorName || (isVendor ? 'Apex Fleet Solutions Pvt Ltd' : ''),
                vendorCode: remote.vendorCode || local?.vendorCode || (isVendor ? 'MAK-VND-001' : ''),
                vendorContact: remote.vendorContact || local?.vendorContact || '',
                vendorCity: remote.vendorCity || local?.vendorCity || 'Chennai',
                image: chosenImg,
                images: chosenImgs
              };

              const canonicalKey = (mergedVehicle.regNo || mergedVehicle.numberPlate || mergedVehicle.id || '').toUpperCase().replace(/\s+/g, '');
              if (!seenKeys.has(canonicalKey)) {
                seenKeys.add(canonicalKey);
                merged.push(mergedVehicle);
              }
            });

            return merged;
          });
        }
      })
      .catch(() => {});

    bookingService
      .getAll()
      .then((res) => {
        if (res?.data && Array.isArray(res.data) && res.data.length > 0) {
          // Auto-seed ID sequence counter above any existing loaded IDs
          let maxBookingNum = 10;
          res.data.forEach((b) => {
            const raw = String(b.bookingNumber || b.refId || b.id || '');
            const match = raw.match(/(\d+)$/);
            if (match) {
              const num = parseInt(match[1], 10);
              if (!isNaN(num) && num > maxBookingNum && num < 100000) {
                maxBookingNum = num;
              }
            }
          });
          seedSequenceIfHigher('BK', maxBookingNum);

          setBookings((prev) => {
            const localMap = new Map((prev || []).map((b) => [b.id || b.bookingNumber || b.refId || b._id, b]));
            const merged = res.data.map((remote) => {
              const bKey = remote.id || remote.bookingNumber || remote.refId || remote._id;
              const local = localMap.get(bKey);
              if (local) localMap.delete(bKey);
              const resolvedCustomerName = String(remote.customerName || remote.fullName || remote.name || (local && (local.customerName || local.fullName)) || '').trim() || 'Valued Guest';
              const resolvedCustomerPhone = String(remote.customerPhone || remote.mobileNumber || remote.phone || (local && (local.customerPhone || local.mobileNumber)) || '').trim();
              const resolvedBookingNumber = String(remote.bookingNumber || remote.refId || remote.id || (local && (local.bookingNumber || local.refId)) || '').trim();
              const base = local ? { ...local, ...remote } : remote;
              const rawCat = remote.bookingCategory || remote.bookingType || local?.bookingCategory || local?.bookingType || base.category || base.bookingCategory || base.bookingType;
              const cleanCat = sanitizeBookingCategory(rawCat, base);
              return {
                ...base,
                bookingCategory: cleanCat,
                bookingType: cleanCat,
                category: cleanCat,
                tripType: base.tripType && !String(base.tripType).toLowerCase().includes('one way') ? base.tripType : cleanCat,
                customerName: resolvedCustomerName,
                fullName: resolvedCustomerName,
                name: resolvedCustomerName,
                customerPhone: resolvedCustomerPhone,
                mobileNumber: resolvedCustomerPhone,
                phone: resolvedCustomerPhone,
                bookingNumber: resolvedBookingNumber,
                refId: resolvedBookingNumber,
                bookingId: resolvedBookingNumber,
                id: base.id || resolvedBookingNumber,
                assignedVehicle: remote.assignedVehicle || (local && local.assignedVehicle),
                assignedDriver: remote.assignedDriver || (local && local.assignedDriver),
                assignmentTimeline: (remote.assignmentTimeline && remote.assignmentTimeline.length > 0)
                  ? remote.assignmentTimeline
                  : ((local && local.assignmentTimeline) || [])
              };
            });

            // Auto-sync any local-only bookings to MongoDB Atlas
            if (localMap.size > 0 && bookingService?.create) {
              localMap.forEach((unsynced) => {
                bookingService.create(unsynced)
                  .then((syncRes) => {
                    if (syncRes?.data) {
                      setBookings((current) =>
                        current.map((b) => {
                          const isMatch = b.id === unsynced.id || b.bookingNumber === unsynced.bookingNumber || b.refId === unsynced.refId;
                          if (!isMatch) return b;
                          return {
                            ...b,
                            ...syncRes.data,
                            id: syncRes.data.id || syncRes.data._id || b.id,
                            bookingNumber: syncRes.data.bookingNumber || syncRes.data.refId || b.bookingNumber,
                            refId: syncRes.data.refId || syncRes.data.bookingNumber || b.refId
                          };
                        })
                      );
                    }
                  })
                  .catch((err) => {
                    console.warn('Auto-sync unsaved booking to Atlas deferred:', err);
                  });
              });
            }

            return [...merged, ...Array.from(localMap.values())];
          });
        }
      })
      .catch(() => {});

    driverService
      .getAll()
      .then((res) => {
        if (res?.data && Array.isArray(res.data) && res.data.length > 0) {
          setDrivers(res.data);
        }
      })
      .catch(() => {});

    // Live sync Payments from MongoDB Atlas
    if (financeService?.getPayments) {
      financeService
        .getPayments()
        .then((res) => {
          if (res?.data && Array.isArray(res.data) && res.data.length > 0) {
            setPayments((prev) => {
              const remoteMap = new Map();
              res.data.forEach((rp) => {
                const k = (rp.id || rp.paymentId || rp.receiptNumber || rp._id || '').toString();
                if (k) remoteMap.set(k, rp);
              });
              const merged = [...res.data];
              (prev || []).forEach((lp) => {
                const k = (lp.id || lp.paymentId || lp.receiptNumber || lp._id || '').toString();
                if (k && !remoteMap.has(k)) {
                  merged.push(lp);
                  // Auto-sync unpersisted local payment to Atlas
                  financeService.recordPayment({
                    bookingRef: lp.bookingNumber || lp.bookingId,
                    amount: lp.amount,
                    paymentMethod: lp.paymentMethod || lp.method || 'Bank Transfer',
                    paymentReference: lp.paymentReference || lp.transactionRef,
                    allowOverpayment: true,
                    isAdvance: lp.paymentType === 'Advance',
                    status: 'captured'
                  }).catch(() => {});
                }
              });
              return merged;
            });
          }
        })
        .catch(() => {});
    }

    // Live sync Expenses from MongoDB Atlas
    if (financeService?.getExpenses) {
      financeService
        .getExpenses()
        .then((res) => {
          if (res?.data && Array.isArray(res.data) && res.data.length > 0) {
            setExpenses((prev) => {
              const remoteMap = new Map();
              res.data.forEach((re) => {
                const k = (re.id || re.expenseId || re._id || '').toString();
                if (k) remoteMap.set(k, re);
              });
              const merged = [...res.data];
              (prev || []).forEach((le) => {
                const k = (le.id || le.expenseId || le._id || '').toString();
                if (k && !remoteMap.has(k)) {
                  merged.push(le);
                  // Auto-sync unpersisted local expense to Atlas
                  financeService.createExpense({
                    category: le.category,
                    amount: le.amount,
                    tripId: le.tripId,
                    bookingRef: le.bookingNumber || le.bookingId,
                    driverId: le.driverId,
                    driverName: le.driverName || le.payee,
                    date: le.expenseDate || le.date,
                    status: le.status || 'Approved',
                    receiptUrl: le.receiptUrl,
                    notes: le.description || le.notes,
                    paymentMode: le.paymentMethod || 'Bank Transfer'
                  }).catch(() => {});
                }
              });
              return merged;
            });
          }
        })
        .catch(() => {});
    }

    // Live sync Invoices from MongoDB Atlas
    if (financeService?.getInvoices) {
      financeService
        .getInvoices()
        .then((res) => {
          if (res?.data && Array.isArray(res.data) && res.data.length > 0) {
            setInvoices((prev) => {
              const remoteMap = new Map();
              res.data.forEach((ri) => {
                const k = (ri.id || ri.invoiceNumber || ri._id || '').toString();
                if (k) remoteMap.set(k, ri);
              });
              const merged = [...res.data];
              (prev || []).forEach((li) => {
                const k = (li.id || li.invoiceNumber || li._id || '').toString();
                if (k && !remoteMap.has(k)) {
                  merged.push(li);
                }
              });
              return merged;
            });
          }
        })
        .catch(() => {});
    }
  }, [isBackendConnected]);

  // 1. Shared Bookings
  const [bookings, setBookings] = useState(() => {
    const stored = loadStoredJson(STORAGE_KEYS.BOOKINGS, null);
    if (stored && Array.isArray(stored) && stored.length > 0) {
      const existingIds = new Set(stored.map((b) => b.id));
      const missing = cleanInitialBookings().filter((b) => !existingIds.has(b.id));
      const combined = [...stored, ...missing];
      return combined.map((b) => {
        const cleanCat = sanitizeBookingCategory(b.bookingCategory || b.category || b.bookingType, b);
        return {
          ...b,
          bookingCategory: cleanCat,
          bookingType: cleanCat,
          category: cleanCat,
          tripType: b.tripType && !String(b.tripType).toLowerCase().includes('one way') ? b.tripType : cleanCat,
          assignmentTimeline: b.assignmentTimeline || b.history || [],
          history: b.assignmentTimeline || b.history || []
        };
      });
    }
    return cleanInitialBookings();
  });

  // 2. Shared Drivers
  const [drivers, setDrivers] = useState(() => {
    const stored = loadStoredJson(STORAGE_KEYS.DRIVERS, null);
    if (stored && Array.isArray(stored) && stored.length > 0) {
      const existingIds = new Set(stored.map((d) => d.id));
      const missing = initialDrivers.filter((d) => !existingIds.has(d.id));
      return [...stored, ...missing];
    }
    return initialDrivers;
  });

  // 3. Shared Vehicles (Filtered & Synchronized with MongoDB Atlas)
  const [vehicles, setVehicles] = useState(() => {
    const stored = loadStoredJson(STORAGE_KEYS.VEHICLES, null);
    const vendorStored = loadStoredJson('mak_vendor_vehicles_v7', []);
    const baseList = (stored && Array.isArray(stored) && stored.length > 0) ? stored : initialVehicles;
    
    // Create canonical vehicle map indexing by ID and normalized Registration Plate
    const vehicleMap = new Map();
    baseList.forEach((v) => {
      const kId = (v.id || '').toUpperCase();
      const kReg = (v.regNo || v.numberPlate || '').toUpperCase().replace(/\s+/g, '');
      if (kId === 'VEH-023' || kReg === 'TN09CD1234' || v.isDeleted === true || v.status === 'Inactive') return;
      const isVendor = Boolean(
        v.vendorId ||
        v.ownership === 'Vendor Attached' ||
        v.ownership === 'Vendor Owned'
      );
      const enhanced = {
        ...v,
        ownership: isVendor ? 'Vendor Attached' : (v.ownership || 'MAK Owned'),
        ownershipType: isVendor ? 'Vendor Owned' : (v.ownershipType || 'Company Owned')
      };
      const key = kReg || kId;
      if (key) vehicleMap.set(key, enhanced);
    });

    // Ensure all canonical initial vehicles exist
    initialVehicles.forEach((iv) => {
      const kId = (iv.id || '').toUpperCase();
      const kReg = (iv.regNo || iv.numberPlate || '').toUpperCase().replace(/\s+/g, '');
      if (kId === 'VEH-023' || kReg === 'TN09CD1234' || iv.isDeleted === true || iv.status === 'Inactive') return;
      const key = kReg || kId;
      const isVendor = Boolean(
        iv.vendorId ||
        iv.ownership === 'Vendor Attached' ||
        iv.ownership === 'Vendor Owned'
      );
      if (key) {
        if (!vehicleMap.has(key)) {
          vehicleMap.set(key, {
            ...iv,
            ownership: isVendor ? 'Vendor Attached' : (iv.ownership || 'MAK Owned'),
            ownershipType: isVendor ? 'Vendor Owned' : (iv.ownershipType || 'Company Owned')
          });
        }
      }
    });

    // Ensure all vendor-registered vehicles are merged with 'Vendor Attached' ownership
    (vendorStored || []).forEach((vv) => {
      const kId = (vv.id || '').toUpperCase();
      const kReg = (vv.regNo || vv.numberPlate || '').toUpperCase().replace(/\s+/g, '');
      if (kId === 'VEH-023' || kReg === 'TN09CD1234' || vv.isDeleted === true || vv.status === 'Inactive') return;
      const key = kReg || kId;
      if (key) {
        const existing = vehicleMap.get(key);
        vehicleMap.set(key, {
          ...(existing || {}),
          ...vv,
          ownership: 'Vendor Attached',
          ownershipType: 'Vendor Owned'
        });
      }
    });

    return Array.from(vehicleMap.values());
  });

  // 4. Shared Assignments
  const [assignments, setAssignments] = useState(() => {
    const stored = loadStoredJson(STORAGE_KEYS.ASSIGNMENTS, null);
    if (stored) return stored;
    // Derive initial assignments from initial bookings
    const init = [];
    initialBookings.forEach((b) => {
      if (b.driverId && b.assignedDriver) {
        init.push({
          id: `ASN-2026-00${b.id.replace(/\D/g, '').slice(-2) || '1'}`,
          bookingId: b.id,
          bookingNumber: b.bookingNumber || b.id,
          driverId: b.driverId,
          driverName: b.assignedDriver.name || b.assignedDriver.fullName,
          tripCategory: b.bookingCategory,
          customerName: b.customerName,
          customerPhone: b.customerPhone,
          passengerCount: b.passengerCount,
          pickupLocation: b.pickupLocation,
          dropLocation: b.destination || b.dropLocation || 'Destination',
          destination: b.destination || b.dropLocation || 'Destination',
          pickupDate: b.journeyDate,
          pickupTime: b.journeyTime || '08:00 AM',
          returnDate: b.returnDate || b.journeyDate,
          returnTime: '06:00 PM',
          durationDays: getDaysBetween(b.journeyDate, b.returnDate),
          assignedVehicle: b.assignedVehicle,
          estimatedEarnings: (getDaysBetween(b.journeyDate, b.returnDate) * (b.assignedVehicle?.driverAllowance || 500)),
          status: b.driverAssignmentStatus === 'Accepted' ? 'Accepted' : 'Assigned',
          assignedAt: b.createdAt || '2026-11-08 11:30'
        });
      }
    });
    return init;
  });

  // 5. Shared Expenses
  const [expenses, setExpenses] = useState(() => {
    const stored = loadStoredJson(STORAGE_KEYS.EXPENSES, null);
    if (stored) return stored;
    return cleanInitialExpenses();
  });

  // 6. Shared Payments
  const [payments, setPayments] = useState(() => {
    const stored = loadStoredJson(STORAGE_KEYS.PAYMENTS, null);
    if (stored) return stored;
    // Derive initial advance payments from initial bookings that have advances
    const init = [...initialPayments];
    initialBookings.forEach((b, idx) => {
      if (b.advancePaid && b.advancePaid > 0) {
        init.push({
          id: `PAY-2026-00${idx + 1}`,
          paymentNumber: `PAY-2026-00${idx + 1}`,
          receiptNumber: `REC-2026-00${idx + 1}`,
          bookingId: b.id,
          bookingNumber: b.bookingNumber || b.id,
          customerName: b.customerName,
          partyName: b.customerName,
          amount: b.advancePaid,
          method: b.paymentType?.includes('Online') ? 'UPI / QR' : 'NEFT / RTGS',
          paymentMethod: b.paymentType?.includes('Online') ? 'UPI / QR' : 'NEFT / RTGS',
          type: 'Customer Payment',
          paymentType: 'Advance',
          category: 'Advance Booking Fee',
          status: 'Completed',
          date: b.journeyDate || '2026-11-08',
          createdAt: b.createdAt || '2026-11-08 11:15'
        });
      }
    });
    return init;
  });

  // 7. Shared Invoices
  const [invoices, setInvoices] = useState(() => {
    const stored = loadStoredJson(STORAGE_KEYS.INVOICES, null);
    if (stored) return stored;
    const init = [...initialInvoices];
    initialBookings.forEach((b) => {
      if (b.bookingStatus === 'Completed') {
        const balDue = Math.max(0, (b.totalAmount || 0) - (b.advancePaid || 0));
        init.push({
          id: `INV-${b.invoiceNumber || b.id}`,
          invoiceNumber: b.invoiceNumber || `INV-${b.id}`,
          bookingId: b.id,
          bookingNumber: b.bookingNumber || b.id,
          customerName: b.customerName,
          customerPhone: b.customerPhone,
          totalAmount: b.totalAmount || 0,
          advancePaid: b.advancePaid || 0,
          balanceDue: balDue,
          status: balDue === 0 ? 'Paid' : 'Partially Paid',
          issueDate: b.journeyDate || '2026-11-05',
          dueDate: b.returnDate || '2026-11-12'
        });
      }
    });
    return init;
  });

  // 8. Admin Notifications
  const [adminNotifications, setAdminNotifications] = useState(() => {
    const defaultNotifs = [
      {
        id: 'NOTIF-ADM-006',
        title: 'New VIP Booking – BK-2026-006 (Ananya Deshmukh)',
        description: 'Account Ananya Deshmukh (admin@maktours.com) booked Round Trip to Yercaud (Nov 22–24). Maruti Suzuki Swift requested (5 in fleet). Physical vehicle & driver allocation pending.',
        message: 'Account Ananya Deshmukh (admin@maktours.com) booked Round Trip to Yercaud (Nov 22–24). Maruti Suzuki Swift requested (5 in fleet). Physical vehicle & driver allocation pending.',
        bookingId: 'BK-2026-006',
        timestamp: '11 Nov 2026, 12:15 PM',
        time: '11 Nov 2026, 12:15 PM',
        date: '11 Nov 2026',
        timeOnly: '12:15 PM',
        category: 'New Booking',
        priority: 'high',
        type: 'booking',
        actionUrl: '/admin/bookings/BK-2026-006',
        actionLink: '/admin/bookings/BK-2026-006',
        unread: true
      },
      {
        id: 'NOTIF-ADM-005',
        title: 'New Customer Booking – BK-2026-005',
        description: 'Customer Anand Swaminathan booked Round Trip to Pondicherry (Nov 18–19). Maruti Suzuki Swift requested (5 in fleet). Physical car & driver allocation pending.',
        message: 'Customer Anand Swaminathan booked Round Trip to Pondicherry (Nov 18–19). Maruti Suzuki Swift requested (5 in fleet). Physical car & driver allocation pending.',
        bookingId: 'BK-2026-005',
        timestamp: '11 Nov 2026, 12:10 PM',
        time: '11 Nov 2026, 12:10 PM',
        date: '11 Nov 2026',
        timeOnly: '12:10 PM',
        category: 'New Booking',
        priority: 'medium',
        type: 'booking',
        actionUrl: '/admin/bookings/BK-2026-005',
        actionLink: '/admin/bookings/BK-2026-005',
        unread: true
      },
      {
        id: 'NOTIF-ADM-004',
        title: 'New Customer Booking – BK-2026-004',
        description: 'Customer Rajesh Nambiar booked Round Trip to Munnar (Nov 14–16). Toyota Innova Crysta requested. Fleet car & driver assignment pending.',
        message: 'Customer Rajesh Nambiar booked Round Trip to Munnar (Nov 14–16). Toyota Innova Crysta requested. Fleet car & driver assignment pending.',
        bookingId: 'BK-2026-004',
        timestamp: '11 Nov 2026, 11:30 AM',
        time: '11 Nov 2026, 11:30 AM',
        date: '11 Nov 2026',
        timeOnly: '11:30 AM',
        category: 'New Booking',
        priority: 'medium',
        type: 'booking',
        actionUrl: '/admin/bookings/BK-2026-004',
        actionLink: '/admin/bookings/BK-2026-004',
        unread: true
      },
      {
        id: 'NOTIF-ADM-001',
        title: 'New Customer Booking – BK-508331',
        description: 'Customer Suresh Kumar booked Round Trip to Pondicherry. Driver assignment pending.',
        message: 'Customer Suresh Kumar booked Round Trip to Pondicherry. Driver assignment pending.',
        bookingId: 'BK-508331',
        timestamp: '05 Nov 2026, 03:29 PM',
        time: '05 Nov 2026, 03:29 PM',
        date: '05 Nov 2026',
        timeOnly: '03:29 PM',
        category: 'New Booking',
        priority: 'low',
        type: 'booking',
        actionUrl: '/admin/bookings/BK-508331',
        actionLink: '/admin/bookings/BK-508331',
        unread: false
      },
      {
        id: 'NOTIF-ADM-002',
        title: 'Driver Accepted Trip – BK-2026-002',
        description: 'Arun Kumar Sundaram accepted assignment for Toyota Innova Crysta (KA-01-MJ-8890) on 08 Nov 2026 at 11:35 AM.',
        message: 'Arun Kumar Sundaram accepted assignment for Toyota Innova Crysta (KA-01-MJ-8890) on 08 Nov 2026 at 11:35 AM.',
        bookingId: 'BK-2026-002',
        driverName: 'Arun Kumar Sundaram',
        timestamp: '08 Nov 2026, 11:35 AM',
        time: '08 Nov 2026, 11:35 AM',
        date: '08 Nov 2026',
        timeOnly: '11:35 AM',
        category: 'Driver Assignment',
        priority: 'high',
        type: 'driver',
        actionUrl: '/admin/bookings/BK-2026-002',
        actionLink: '/admin/bookings/BK-2026-002',
        unread: false
      },
      {
        id: 'NOTIF-ADM-003',
        title: 'New Expense Claim – EXP-2026-001',
        description: 'Booking BK-2026-002: Arun Kumar Sundaram claimed ₹450 for Toll on 14 Nov 2026 at 09:15 AM. Awaiting Admin Approval.',
        message: 'Booking BK-2026-002: Arun Kumar Sundaram claimed ₹450 for Toll on 14 Nov 2026 at 09:15 AM. Awaiting Admin Approval.',
        bookingId: 'BK-2026-002',
        driverName: 'Arun Kumar Sundaram',
        timestamp: '14 Nov 2026, 09:15 AM',
        time: '14 Nov 2026, 09:15 AM',
        date: '14 Nov 2026',
        timeOnly: '09:15 AM',
        category: 'Pending Payments',
        priority: 'high',
        type: 'expense',
        actionUrl: '/admin/expenses',
        actionLink: '/admin/expenses',
        unread: true
      }
    ];
    const stored = loadStoredJson(STORAGE_KEYS.ADMIN_NOTIFS, null);
    if (stored && Array.isArray(stored) && stored.length > 0) {
      const existingIds = new Set(stored.map((n) => n.id));
      const missing = defaultNotifs.filter((n) => !existingIds.has(n.id));
      const all = [...missing, ...stored];
      return all.map((n) => {
        const fallback = defaultNotifs.find((d) => d.id === n.id);
        const resolvedTime = n.time || n.timestamp || fallback?.time || fallback?.timestamp || '16 Nov 2026, 10:48 AM';
        const resolvedMsg = n.message || n.description || fallback?.message || fallback?.description || '';
        return {
          ...n,
          time: resolvedTime,
          timestamp: resolvedTime,
          message: resolvedMsg,
          description: resolvedMsg,
          category: n.category || fallback?.category || 'Operations',
          priority: n.priority || fallback?.priority || 'Normal',
          actionUrl: n.actionUrl || n.actionLink || fallback?.actionUrl || '/admin/bookings',
          actionLink: n.actionLink || n.actionUrl || fallback?.actionLink || '/admin/bookings'
        };
      });
    }
    return defaultNotifs;
  });

  // 9. Driver Notifications
  const [driverNotifications, setDriverNotifications] = useState(() => {
    return loadStoredJson(STORAGE_KEYS.DRIVER_NOTIFS, [
      {
        id: 'NOTIF-DRV-001',
        title: 'New Trip Assignment – Booking BK-2026-002',
        description: 'Tour Package to Kodaikanal scheduled for Nov 10. Vehicle: Toyota Innova Crysta.',
        bookingId: 'BK-2026-002',
        timestamp: 'Nov 8, 2026, 11:30 AM',
        type: 'assignment',
        actionUrl: '/driver/trips/assignments',
        isRead: true
      }
    ]);
  });

  // Persist shared states
  useEffect(() => { saveStoredJson(STORAGE_KEYS.BOOKINGS, bookings); }, [bookings]);
  useEffect(() => { saveStoredJson(STORAGE_KEYS.DRIVERS, drivers); }, [drivers]);
  useEffect(() => { saveStoredJson(STORAGE_KEYS.VEHICLES, vehicles); }, [vehicles]);
  useEffect(() => { saveStoredJson(STORAGE_KEYS.ASSIGNMENTS, assignments); }, [assignments]);
  useEffect(() => { saveStoredJson(STORAGE_KEYS.EXPENSES, expenses); }, [expenses]);
  useEffect(() => { saveStoredJson(STORAGE_KEYS.PAYMENTS, payments); }, [payments]);
  useEffect(() => { saveStoredJson(STORAGE_KEYS.INVOICES, invoices); }, [invoices]);
  useEffect(() => { saveStoredJson(STORAGE_KEYS.ADMIN_NOTIFS, adminNotifications); }, [adminNotifications]);
  useEffect(() => { saveStoredJson(STORAGE_KEYS.DRIVER_NOTIFS, driverNotifications); }, [driverNotifications]);

  // Dynamically reconcile vehicle statuses with active bookings
  useEffect(() => {
    if (!vehicles || vehicles.length === 0) return;

    const onTripVehicleKeys = new Set();
    const reservedVehicleKeys = new Set();

    (bookings || []).forEach((b) => {
      if (b.bookingStatus === 'Cancelled') return;

      const vKeys = [
        b.vehicleId,
        b.assignedVehicle?.id,
        b.assignedVehicle?.regNo,
        b.assignedVehicle?.numberPlate,
        b.assignedVehicle?.name,
        b.assignedVehicle?.model,
        b.vehicleName,
        b.requestedVehicleModel
      ]
        .filter(Boolean)
        .map((k) => String(k).toUpperCase().replace(/[\s-]+/g, ''));

      const isTripActive = (b.bookingStatus === 'On Trip' || b.tripStatus === 'In Progress') && b.bookingStatus !== 'Completed';
      const isCompleted = b.bookingStatus === 'Completed' || b.tripStatus === 'Completed';
      const isReserved = !isCompleted && !isTripActive && (b.bookingStatus === 'Confirmed' || b.bookingStatus === 'Pending') && (b.assignedVehicle || b.vehicleId);

      if (isTripActive) {
        vKeys.forEach((k) => onTripVehicleKeys.add(k));
      } else if (isReserved) {
        vKeys.forEach((k) => reservedVehicleKeys.add(k));
      }
    });

    let vehiclesChanged = false;
    const reconciled = vehicles.map((v) => {
      if (v.status === 'Maintenance' || v.status === 'Inactive') return v;

      const vKeys = [
        v.id,
        v.regNo,
        v.numberPlate,
        v.name,
        v.model
      ]
        .filter(Boolean)
        .map((k) => String(k).toUpperCase().replace(/[\s-]+/g, ''));

      const isOnTrip = vKeys.some((k) => onTripVehicleKeys.has(k));
      const isReserved = !isOnTrip && vKeys.some((k) => reservedVehicleKeys.has(k));

      let expectedStatus = 'Available';
      if (isOnTrip) expectedStatus = 'On Trip';
      else if (isReserved) expectedStatus = 'Reserved';

      if (v.status !== expectedStatus) {
        vehiclesChanged = true;
        return { ...v, status: expectedStatus };
      }
      return v;
    });

    if (vehiclesChanged) {
      setVehicles(reconciled);
    }
  }, [bookings]);

  // Synchronize across browser tabs (native storage event fires exclusively in other tabs)
  useEffect(() => {
    const handleSync = (e) => {
      const changedKey = e.key;
      if (!changedKey) return;
      if (changedKey === STORAGE_KEYS.BOOKINGS) {
        setBookings(loadStoredJson(STORAGE_KEYS.BOOKINGS, cleanInitialBookings()));
      } else if (changedKey === STORAGE_KEYS.DRIVERS) {
        const loadedDrivers = loadStoredJson(STORAGE_KEYS.DRIVERS, null);
        if (Array.isArray(loadedDrivers) && loadedDrivers.length > 0) {
          setDrivers(loadedDrivers);
        }
      } else if (changedKey === STORAGE_KEYS.VEHICLES || changedKey === 'mak_vendor_vehicles_v7') {
        const storedVehicles = loadStoredJson(STORAGE_KEYS.VEHICLES, initialVehicles);
        const storedVendor = loadStoredJson('mak_vendor_vehicles_v7', []);
        const vehicleMap = new Map((storedVehicles || []).map((v) => [v.id || (v.regNo || v.numberPlate || '').toUpperCase(), v]));
        (storedVendor || []).forEach((vv) => {
          const k = vv.id || (vv.regNo || vv.numberPlate || '').toUpperCase();
          if (k) {
            const ex = vehicleMap.get(k);
            vehicleMap.set(k, { ...(ex || {}), ...vv, ownership: 'Vendor Attached', ownershipType: 'Vendor Owned' });
          }
        });
        setVehicles(Array.from(vehicleMap.values()));
      } else if (changedKey === STORAGE_KEYS.ASSIGNMENTS) {
        setAssignments(loadStoredJson(STORAGE_KEYS.ASSIGNMENTS, []));
      } else if (changedKey === STORAGE_KEYS.EXPENSES) {
        setExpenses(loadStoredJson(STORAGE_KEYS.EXPENSES, []));
      } else if (changedKey === STORAGE_KEYS.PAYMENTS) {
        setPayments(loadStoredJson(STORAGE_KEYS.PAYMENTS, []));
      } else if (changedKey === STORAGE_KEYS.INVOICES) {
        setInvoices(loadStoredJson(STORAGE_KEYS.INVOICES, []));
      } else if (changedKey === STORAGE_KEYS.ADMIN_NOTIFS) {
        setAdminNotifications(loadStoredJson(STORAGE_KEYS.ADMIN_NOTIFS, []));
      } else if (changedKey === STORAGE_KEYS.DRIVER_NOTIFS) {
        setDriverNotifications(loadStoredJson(STORAGE_KEYS.DRIVER_NOTIFS, []));
      }
    };
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  // Notifications
  const pushAdminNotification = useCallback((title, description, metadata = {}) => {
    const now = new Date();
    const formattedDate = formatDateDMY(now);
    const formattedTime = now.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
    const fullDateTime = `${formattedDate}, ${formattedTime}`;

    const newNotif = {
      id: generateId('NOTIF', { useYear: false }),
      title,
      description,
      message: description,
      category: metadata.category || (metadata.type === 'booking' ? 'New Booking' : metadata.type === 'driver' ? 'Driver Assignment' : 'Operations'),
      priority: metadata.priority || 'Normal',
      bookingId: metadata.bookingId || null,
      driverName: metadata.driverName || null,
      timestamp: metadata.timestamp || fullDateTime,
      time: metadata.time || fullDateTime,
      date: metadata.date || formattedDate,
      timeOnly: metadata.timeOnly || formattedTime,
      createdAt: now.toISOString(),
      type: metadata.type || 'info',
      actionUrl: metadata.actionUrl || metadata.actionLink || '/admin/bookings',
      actionLink: metadata.actionLink || metadata.actionUrl || '/admin/bookings',
      unread: true
    };
    setAdminNotifications((prev) => [newNotif, ...prev]);
  }, []);

  const markAdminNotificationRead = useCallback((id) => {
    setAdminNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, unread: false, read: true, isRead: true } : n))
    );
  }, []);

  const markAllAdminNotificationsRead = useCallback(() => {
    setAdminNotifications((prev) =>
      prev.map((n) => ({ ...n, unread: false, read: true, isRead: true }))
    );
  }, []);

  const clearAdminNotification = useCallback((id) => {
    setAdminNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const pushDriverNotification = useCallback((title, description, metadata = {}) => {
    const now = new Date();
    const formattedDate = formatDateDMY(now);
    const formattedTime = now.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
    const fullDateTime = `${formattedDate}, ${formattedTime}`;

    const cat =
      metadata.type === 'assignment'
        ? 'Trip Assignment'
        : metadata.type === 'expense'
        ? 'Trip Expense'
        : metadata.type === 'payment'
        ? 'Payment & Settlement'
        : 'Dispatch Notice';

    const newNotif = {
      id: generateId('NOTIF', { useYear: false }),
      title,
      description,
      message: description,
      category: cat,
      bookingId: metadata.bookingId || null,
      timestamp: metadata.timestamp || fullDateTime,
      time: metadata.time || fullDateTime,
      date: metadata.date || formattedDate,
      timeOnly: metadata.timeOnly || formattedTime,
      createdAt: now.toISOString(),
      type: metadata.type || 'assignment',
      actionUrl: metadata.actionUrl || metadata.link || '/driver/trips/assignments',
      link: metadata.actionUrl || metadata.link || '/driver/trips/assignments',
      isRead: false
    };
    setDriverNotifications((prev) => [newNotif, ...prev]);
  }, []);

  const markDriverNotificationRead = useCallback((notifId) => {
    setDriverNotifications((prev) =>
      prev.map((n) => (n.id === notifId ? { ...n, isRead: true, unread: false } : n))
    );
  }, []);

  const markAllDriverNotificationsRead = useCallback(() => {
    setDriverNotifications((prev) =>
      prev.map((n) => ({ ...n, isRead: true, unread: false }))
    );
    toast.success('All notifications marked as read');
  }, [toast]);

  // Per-booking lookups derived strictly from authoritative stores
  const getBookingExpenses = useCallback((bookingId) => {
    if (!bookingId) return [];
    return expenses.filter((e) => e.bookingId === bookingId);
  }, [expenses]);

  const getBookingPayments = useCallback((bookingId) => {
    if (!bookingId) return [];
    return payments.filter((p) => p.bookingId === bookingId);
  }, [payments]);

  const getBookingInvoices = useCallback((bookingId) => {
    if (!bookingId) return [];
    return invoices.filter((i) => i.bookingId === bookingId);
  }, [invoices]);

  // Availability helpers
  const isDriverAvailable = useCallback((driverId, start, end, excludeBookingId = null) => {
    return checkDriverAvailability(driverId, start, end, drivers, assignments, bookings, excludeBookingId);
  }, [drivers, assignments, bookings]);

  const isVehicleAvailable = useCallback((vehicleId, start, end, excludeBookingId = null) => {
    return checkVehicleAvailability(vehicleId, start, end, vehicles, bookings, excludeBookingId);
  }, [vehicles, bookings]);

  // --- 1. CUSTOMER BOOKING CREATION ---
  const createCustomerBooking = useCallback((bookingData) => {
    // ONE WAY TRIP IS STRICTLY FORBIDDEN IN THIS ENTIRE SYSTEM
    const rawCat = String(bookingData.bookingCategory || bookingData.category || bookingData.bookingType || '');
    if (rawCat.toLowerCase().includes('one way')) {
      toast.error('One Way Trip is strictly prohibited in MAK Tours ERP. Reclassified to Round Trip.');
      bookingData.bookingCategory = 'Round Trip';
      bookingData.bookingType = 'Round Trip';
      bookingData.category = 'Round Trip';
    }

    // Required fields validation
    const custName = String(bookingData.customerName || bookingData.fullName || bookingData.name || '').trim();
    if (!custName) {
      toast.error('Customer name is required');
      return null;
    }
    const cleanPhone = (bookingData.customerPhone || bookingData.mobileNumber || bookingData.phone || '').replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      toast.error('Please enter a valid customer phone number');
      return null;
    }
    if (!bookingData.pickupLocation || !bookingData.pickupLocation.trim()) {
      toast.error('Pickup location is required');
      return null;
    }
    if (!bookingData.destination || !bookingData.destination.trim()) {
      toast.error('Destination is required');
      return null;
    }
    if (!bookingData.journeyDate) {
      toast.error('Journey date is required');
      return null;
    }

    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const jDate = normalizeDate(bookingData.journeyDate);
    const rDate = normalizeDate(bookingData.returnDate || bookingData.journeyDate);

    if (jDate < todayStr) {
      toast.error('Journey date cannot be in the past');
      return null;
    }
    if (rDate < jDate) {
      toast.error('Return date cannot be earlier than journey date');
      return null;
    }

    // Vehicle Selection Template (Tariff calculation)
    if (!bookingData.vehicleId && !bookingData.vehicleReserved && !bookingData.vehicleName) {
      toast.error('Please select a car model for this reservation');
      return null;
    }

    const selectedVeh = vehicles.find((v) => v.id === bookingData.vehicleId) ||
      vehicles.find((v) => `${v.brand} ${v.model}`.toLowerCase().includes((bookingData.vehicleReserved || bookingData.vehicleName || '').toLowerCase())) ||
      vehicles[0];

    const durationDays = getDaysBetween(jDate, rDate);

    // Calculate total amount based on vehicle rate if not explicitly specified
    let totalAmt = parseFloat(bookingData.totalAmount);
    if (!totalAmt || totalAmt <= 0) {
      const minKm = selectedVeh.minKmPerDay || 250;
      const rateKm = selectedVeh.ratePerKm || 15;
      const allowance = selectedVeh.driverAllowance || 500;
      totalAmt = (durationDays * minKm * rateKm) + (durationDays * allowance);
    }

    // Payment Logic
    let advPaid = 0;
    let balAmt = totalAmt;
    let pStatus = 'Pending';
    let pType = bookingData.paymentType || 'Book at ₹0 (Pay on Departure)';

    if (bookingData.advancePaid !== undefined && !isNaN(parseFloat(bookingData.advancePaid))) {
      advPaid = Math.min(totalAmt, Math.max(0, parseFloat(bookingData.advancePaid)));
      balAmt = Math.max(0, totalAmt - advPaid);
      if (balAmt === 0 && advPaid > 0) {
        pStatus = 'Paid';
        pType = bookingData.paymentType || 'Full Payment (100% Settled)';
      } else if (advPaid > 0) {
        pStatus = 'Partially Paid';
        pType = bookingData.paymentType || 'Partial Advance Payment';
      } else {
        pStatus = 'Pending';
        pType = bookingData.paymentType || 'Book at ₹0 (Pay on Departure)';
      }
    } else if (pType.includes('Pay on Departure') || pType.includes('Book at ₹0')) {
      advPaid = 0;
      balAmt = totalAmt;
      pStatus = 'Pending';
    }

    // Identifiers - collision-safe against all existing loaded bookings
    const existingIds = new Set((bookings || []).map((b) => b.bookingNumber || b.refId || b.id));
    let { id: newBookingId, bookingNumber: newBookingNumber } = generateBookingIdentifiers();
    let collisionRetries = 0;
    while ((existingIds.has(newBookingNumber) || existingIds.has(newBookingId)) && collisionRetries < 50) {
      collisionRetries++;
      const nextPair = generateBookingIdentifiers();
      newBookingId = nextPair.id;
      newBookingNumber = nextPair.bookingNumber;
    }
    const nowFormatted = new Date().toISOString().replace('T', ' ').substring(0, 16);
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const invoiceNum = generateId('INV', { useYear: true });

    // Requested Car Name
    const reqCarModel = (bookingData.vehicleReserved || bookingData.vehicleName || `${selectedVeh.brand || ''} ${selectedVeh.model || selectedVeh.name}`).trim();

    // Physical Vehicle Allocation (if selected by Admin or explicitly provided)
    let assignedVehObj = bookingData.assignedVehicle || null;
    if (!assignedVehObj && bookingData.vehicleId) {
      const matchVeh = vehicles.find((v) => v.id === bookingData.vehicleId || v.regNo === bookingData.vehicleId);
      if (matchVeh) {
        const isCompany = !matchVeh.vendorId || matchVeh.ownership === 'MAK Owned' || matchVeh.ownership === 'Company Owned';
        const isVendorVehicle = !isCompany;
        const vPayoutPercent = bookingData.vendorPayoutPercent !== undefined
          ? bookingData.vendorPayoutPercent
          : (matchVeh.vendorPayoutPercent ?? (isVendorVehicle ? 85 : null));
        const vPayableAmount = bookingData.vendorPayableAmount !== undefined
          ? bookingData.vendorPayableAmount
          : (isVendorVehicle ? Math.round(totalAmt * ((vPayoutPercent || 85) / 100)) : 0);

        assignedVehObj = {
          id: matchVeh.id,
          brand: matchVeh.brand,
          model: matchVeh.model,
          name: matchVeh.model || matchVeh.name,
          regNo: matchVeh.regNo,
          category: matchVeh.category,
          seating: matchVeh.seating,
          fuelType: matchVeh.fuelType,
          status: 'Reserved',
          ratePerKm: matchVeh.ratePerKm,
          driverAllowance: matchVeh.driverAllowance,
          image: matchVeh.image,
          ownership: matchVeh.ownership || (isCompany ? 'MAK Owned' : 'Vendor Attached'),
          isVendorVehicle,
          vendorId: matchVeh.vendorId || null,
          vendorName: matchVeh.vendorName || null,
          vendorPayoutPercent: vPayoutPercent,
          vendorPayableAmount: vPayableAmount
        };
      }
    }

    // Physical Driver Allocation (if selected by Admin or explicitly provided)
    let assignedDrvObj = bookingData.assignedDriver || null;
    if (!assignedDrvObj && bookingData.driverId) {
      const matchDrv = drivers.find((d) => d.id === bookingData.driverId || d.driverId === bookingData.driverId);
      if (matchDrv) {
        assignedDrvObj = {
          id: matchDrv.id,
          name: matchDrv.name || matchDrv.fullName,
          fullName: matchDrv.fullName || matchDrv.name,
          phone: matchDrv.phone,
          photo: matchDrv.photo || matchDrv.avatar,
          licenseNumber: matchDrv.licenseNumber || '',
          status: 'Assigned'
        };
      }
    }

    const drvCompensationAmount = Number(
      bookingData.driverCompensationAmount !== undefined
        ? bookingData.driverCompensationAmount
        : (assignedDrvObj ? (drivers.find((d) => d.id === assignedDrvObj.id)?.perTripRate || 1500) : 1500)
    );

    const timelineEntry1 = {
      id: generateId('TL', { useYear: false }),
      timestamp: nowTime,
      event: `Customer Booking Received: Requested ${reqCarModel}`,
      actor: bookingData.customerName,
      status: 'Pending'
    };

    const initialTimeline = [timelineEntry1];
    if (assignedVehObj && assignedDrvObj) {
      initialTimeline.push({
        id: generateId('TL', { useYear: false }),
        timestamp: nowTime,
        event: `Vehicle Allocated: ${assignedVehObj.brand || ''} ${assignedVehObj.model || assignedVehObj.name} (${assignedVehObj.regNo}) [${assignedVehObj.ownership}] & Driver Assigned: ${assignedDrvObj.name} (Compensation: ₹${drvCompensationAmount.toLocaleString('en-IN')})`,
        actor: 'Operations Admin',
        status: 'Assigned'
      });
    } else if (assignedVehObj) {
      initialTimeline.push({
        id: generateId('TL', { useYear: false }),
        timestamp: nowTime,
        event: `Vehicle Allocated: ${assignedVehObj.brand || ''} ${assignedVehObj.model || assignedVehObj.name} (${assignedVehObj.regNo}) [${assignedVehObj.ownership}]`,
        actor: 'Operations Admin',
        status: 'Assigned'
      });
    }

    const newBooking = {
      id: newBookingId,
      bookingNumber: newBookingNumber,
      refId: newBookingNumber,
      bookingId: newBookingNumber,
      customerName: custName,
      fullName: custName,
      name: custName,
      customerPhone: cleanPhone,
      mobileNumber: cleanPhone,
      phone: cleanPhone,
      customerEmail: bookingData.customerEmail || bookingData.email || '',
      email: bookingData.email || bookingData.customerEmail || '',
      bookingCategory: bookingData.bookingCategory || 'Round Trip',
      bookingStatus: (assignedVehObj && assignedDrvObj) ? 'Confirmed' : (bookingData.bookingStatus || 'Pending'),
      status: (assignedVehObj && assignedDrvObj) ? 'Confirmed' : (bookingData.bookingStatus || 'Pending'),
      paymentStatus: pStatus,
      paymentType: pType,
      pickupLocation: bookingData.pickupLocation.trim(),
      destination: bookingData.destination.trim(),
      journeyDate: jDate,
      journeyTime: bookingData.journeyTime || '08:00 AM',
      returnDate: rDate,
      returnTime: bookingData.returnTime || '06:00 PM',
      durationDays,
      passengerCount: parseInt(bookingData.passengerCount) || 4,
      vehicleId: assignedVehObj ? (assignedVehObj.regNo || assignedVehObj.id) : null,
      vehicleName: assignedVehObj ? `${assignedVehObj.brand || ''} ${assignedVehObj.model || assignedVehObj.name} (${assignedVehObj.regNo})`.trim() : reqCarModel,
      vehicleReserved: reqCarModel,
      requestedVehicleModel: reqCarModel,
      assignedVehicle: assignedVehObj,
      vehicleStatus: assignedVehObj ? 'Reserved' : 'Pending Assignment',
      driverId: assignedDrvObj ? assignedDrvObj.id : null,
      driverName: assignedDrvObj ? (assignedDrvObj.name || assignedDrvObj.fullName) : null,
      assignedDriver: assignedDrvObj,
      driverAssignmentStatus: assignedDrvObj ? 'Assigned' : 'Pending',
      tripStatus: assignedDrvObj ? 'Awaiting Driver Acceptance' : 'Upcoming',
      driverCompensationAmount: drvCompensationAmount,
      driverBaseTripPay: drvCompensationAmount,
      vendorPayoutPercent: assignedVehObj?.vendorPayoutPercent ?? (bookingData.vendorPayoutPercent ?? null),
      vendorPayableAmount: assignedVehObj?.vendorPayableAmount ?? (bookingData.vendorPayableAmount || 0),
      totalAmount: totalAmt,
      advancePaid: advPaid,
      balanceAmount: balAmt,
      createdAt: nowFormatted,
      confirmedAt: new Date().toLocaleString(),
      invoiceNumber: invoiceNum,
      assignmentTimeline: initialTimeline,
      history: initialTimeline,
      assignmentHistory: []
    };

    // Save Booking locally and persist to MongoDB Atlas
    setBookings((prev) => [newBooking, ...prev]);

    // Update vehicle status in state if allocated
    if (assignedVehObj) {
      setVehicles((prev) =>
        prev.map((v) => (v.id === assignedVehObj.id || v.regNo === assignedVehObj.regNo ? { ...v, status: 'Reserved' } : v))
      );
    }

    // Add Driver Assignment in state if allocated
    if (assignedDrvObj) {
      const assignmentId = generateId('ASN', { useYear: true });
      const newAssignment = {
        id: assignmentId,
        bookingId: newBookingId,
        bookingNumber: newBookingNumber,
        driverId: assignedDrvObj.id,
        driverName: assignedDrvObj.name,
        driverPhone: assignedDrvObj.phone,
        vehicleId: assignedVehObj?.id || assignedVehObj?.regNo || null,
        vehicleName: assignedVehObj ? `${assignedVehObj.brand || ''} ${assignedVehObj.model || assignedVehObj.name} (${assignedVehObj.regNo})`.trim() : null,
        customerName: bookingData.customerName.trim(),
        customerPhone: cleanPhone,
        pickupLocation: bookingData.pickupLocation.trim(),
        destination: bookingData.destination.trim(),
        journeyDate: jDate,
        returnDate: rDate,
        tripCategory: bookingData.bookingCategory || 'Round Trip',
        driverCompensationAmount: drvCompensationAmount,
        driverBaseTripPay: drvCompensationAmount,
        status: 'Assigned',
        createdAt: nowFormatted,
        assignedAt: nowFormatted
      };
      setAssignments((prev) => [newAssignment, ...prev]);
    }

    if (bookingService?.create) {
      bookingService
        .create(newBooking)
        .then((res) => {
          if (res?.data) {
            setBookings((prev) =>
              prev.map((b) => {
                const isMatch = b.id === newBooking.id || b.bookingNumber === newBooking.bookingNumber ||
                  b.id === res.data.id || b.bookingNumber === res.data.bookingNumber || b.refId === res.data.refId;
                if (!isMatch) return b;
                return {
                  ...b,
                  ...res.data,
                  id: b.id || res.data.id,
                  bookingNumber: b.bookingNumber || res.data.bookingNumber,
                  refId: b.refId || res.data.refId || b.bookingNumber,
                  assignedVehicle: res.data.assignedVehicle || b.assignedVehicle,
                  assignedDriver: res.data.assignedDriver || b.assignedDriver
                };
              })
            );
          }
        })
        .catch((err) => {
          console.warn('Backend booking registration sync deferred:', err);
        });
    }

    // Record system Payment if advance was paid
    if (advPaid > 0) {
      const receiptNum = generateId('REC', { useYear: true });
      const payNum = `RCPT-${receiptNum.replace(/[^0-9]/g, '')}`;
      const newPayment = {
        id: generateId('PAY', { useYear: true }),
        receiptNumber: receiptNum,
        paymentNumber: payNum,
        bookingId: newBookingId,
        bookingNumber: newBookingNumber,
        partyName: newBooking.customerName,
        customerName: newBooking.customerName,
        customerPhone: cleanPhone,
        amount: advPaid,
        method: bookingData.paymentMethod || (pType.includes('Online') ? 'UPI / QR' : 'NEFT / RTGS'),
        paymentMethod: bookingData.paymentMethod || (pType.includes('Online') ? 'UPI / QR' : 'NEFT / RTGS'),
        transactionRef: `TXN-${Date.now().toString().slice(-6)}`,
        paymentReference: `TXN-${Date.now().toString().slice(-6)}`,
        type: 'Customer Payment',
        paymentType: 'Advance',
        category: 'Advance Booking Fee',
        status: 'Completed',
        date: jDate,
        createdAt: nowFormatted
      };
      setPayments((prev) => [newPayment, ...prev]);

      if (financeService?.recordPayment) {
        financeService.recordPayment({
          bookingRef: newBookingNumber,
          amount: advPaid,
          paymentMethod: newPayment.paymentMethod,
          paymentReference: newPayment.paymentReference,
          allowOverpayment: true,
          isAdvance: true,
          status: 'captured'
        }).catch((err) => console.warn('Advance payment Atlas sync note:', err.message));
      }
    }

    // Notify Admin
    const bookTime = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
    const bookDate = formatDateDMY(new Date());
    pushAdminNotification(
      `New Booking Received – ${newBooking.bookingNumber}`,
      `Customer ${newBooking.customerName} booked ${newBooking.bookingCategory} to ${newBooking.destination} on ${bookDate} at ${bookTime}. Reserved: ${newBooking.vehicleName}. Driver assignment pending.`,
      { bookingId: newBooking.id, type: 'booking', actionUrl: `/admin/bookings/${newBooking.id}`, timestamp: `${bookDate}, ${bookTime}`, time: `${bookDate}, ${bookTime}` }
    );

    toast.success(`Booking ${newBooking.bookingNumber} created successfully!`);
    return newBooking;
  }, [vehicles, bookings, pushAdminNotification, toast]);

  // --- 2. ADMIN DRIVER & VEHICLE ASSIGNMENT & CONFIRM TRIP ---
  const confirmTripAssignment = useCallback(async (bookingId, selectedDriverId, selectedVehicleId = null, customFinancials = {}) => {
    const booking = bookings.find(
      (b) => b.id === bookingId || b.bookingNumber === bookingId || b.refId === bookingId || b._id === bookingId
    );
    if (!booking) {
      toast.error('Booking not found');
      return false;
    }

    if (['Cancelled', 'Completed'].includes(booking.bookingStatus)) {
      toast.error(`Cannot assign driver: Booking is already ${booking.bookingStatus}.`);
      return false;
    }
    if (booking.tripStatus === 'In Progress') {
      toast.error('Cannot reassign driver: Trip is currently in progress.');
      return false;
    }

    const bJourney = booking.journeyDate || booking.travelDate || booking.pickupDate;
    const bReturn = booking.returnDate || booking.travelDate || booking.pickupDate || booking.journeyDate || bJourney;

    // Determine target vehicle (either passed from dropdown or pre-existing on booking)
    const vehicleId = selectedVehicleId || booking.vehicleId || booking.assignedVehicle?.id;
    if (!vehicleId) {
      toast.error('Please select a commercial fleet vehicle from the dropdown to assign to this booking.');
      return false;
    }

    const veh = vehicles.find((v) => v.id === vehicleId);
    if (!veh) {
      toast.error('Assigned vehicle record not found in fleet');
      return false;
    }

    // Validate vehicle availability
    const vehCheck = checkVehicleAvailability(vehicleId, bJourney, bReturn, vehicles, bookings, booking.id);
    if (!vehCheck.available) {
      toast.error(vehCheck.reason);
      return false;
    }

    // Driver eligibility and conflict validation
    const driverObj = drivers.find((d) => d.id === selectedDriverId || d.driverId === selectedDriverId);
    if (!driverObj) {
      toast.error('Please select an eligible driver from the roster');
      return false;
    }

    const drvCheck = checkDriverAvailability(driverObj.id, bJourney, bReturn, drivers, assignments, bookings, booking.id);
    if (!drvCheck.available) {
      toast.error(drvCheck.reason);
      return false;
    }

    const assignmentId = generateId('ASN', { useYear: true });
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const nowFormatted = new Date().toLocaleString();
    const durationDays = getDaysBetween(bJourney, bReturn);

    // Keep history: mark any previous active assignment for this booking as 'Reassigned'
    setAssignments((prev) =>
      prev.map((a) =>
        (a.bookingId === bookingId || a.bookingId === booking.id || a.bookingNumber === booking.bookingNumber) && ['Assigned', 'Accepted'].includes(a.status)
          ? { ...a, status: 'Reassigned', reassignedAt: nowFormatted }
          : a
      )
    );

    const isCompany = !veh.vendorId || veh.ownership === 'MAK Owned' || veh.ownership === 'Company Owned';
    const isVendorVehicle = !isCompany;

    const storedSettings = loadStoredJson('mak_admin_settings_v4', null);
    const defVendorPercent = storedSettings?.payoutPolicies?.vendorPayoutPercent ?? 85;
    const defRoundTripPay = storedSettings?.payoutPolicies?.driverRoundTripPay ?? 1500;
    const defTourPackagePay = storedSettings?.payoutPolicies?.driverTourPackagePay ?? 2500;

    const vendorPayoutPercent = isVendorVehicle
      ? (customFinancials.vendorPayoutPercent !== undefined ? Number(customFinancials.vendorPayoutPercent) : defVendorPercent)
      : null;

    const totalFare = Number(booking.totalAmount || booking.pricing || booking.totalFare || 0);
    const vendorPayableAmount = isVendorVehicle
      ? Math.round(totalFare * (vendorPayoutPercent / 100))
      : 0;

    const driverBaseTripPay = customFinancials.driverBaseTripPay !== undefined
      ? Number(customFinancials.driverBaseTripPay)
      : (customFinancials.driverCompensationAmount !== undefined
          ? Number(customFinancials.driverCompensationAmount)
          : (driverObj?.perTripRate || (booking.bookingCategory === 'Tour Package' ? defTourPackagePay : defRoundTripPay)));

    const nightStayAmount = Number(customFinancials.nightStayAmount || booking.nightStayAmount || 0);
    const nightStayNights = Number(customFinancials.nightStayNights || booking.nightStayNights || (nightStayAmount > 0 ? 1 : 0));
    const nightStayRemarks = customFinancials.nightStayRemarks || booking.nightStayRemarks || '';
    const totalDriverCompAmount = driverBaseTripPay + nightStayAmount;

    const estEarnings = durationDays * (veh.driverAllowance || 500) + totalDriverCompAmount;

    const vName = `${veh.brand || ''} ${veh.model || veh.name} (${veh.regNo})`.trim();
    const assignedVehObj = {
      id: veh.id,
      brand: veh.brand,
      model: veh.model,
      name: veh.model || veh.name,
      regNo: veh.regNo,
      category: veh.category,
      seating: veh.seating,
      fuelType: veh.fuelType,
      status: 'Reserved',
      ratePerKm: veh.ratePerKm,
      driverAllowance: veh.driverAllowance,
      image: veh.image,
      ownership: veh.ownership || (isCompany ? 'MAK Owned' : 'Vendor Attached'),
      isVendorVehicle,
      vendorId: veh.vendorId || null,
      vendorName: veh.vendorName || null,
      vendorPayoutPercent,
      vendorPayableAmount
    };

    const existingTimeline = booking.assignmentTimeline || booking.history || [];
    const newTimelineEntry = {
      id: generateId('TL', { useYear: false }),
      timestamp: nowTime,
      event: `Vehicle Assigned: ${vName} [${assignedVehObj.ownership}${isVendorVehicle ? ` - ${vendorPayoutPercent}% Payout` : ''}] & Driver Assigned: ${driverObj.name} (Compensation: ₹${Number(totalDriverCompAmount || 0).toLocaleString('en-IN')}${nightStayAmount > 0 ? ` incl. ₹${Number(nightStayAmount || 0).toLocaleString('en-IN')} Night Stay` : ''})`,
      actor: 'Operations Admin',
      status: 'Assigned'
    };
    const updatedTimeline = [...existingTimeline, newTimelineEntry];

    const assignmentPayload = {
      vehicleId: veh.id,
      vehicleName: vName,
      assignedVehicle: assignedVehObj,
      driverId: driverObj.id,
      driverName: driverObj.name || driverObj.fullName,
      assignedDriver: driverObj,
      driverAssignmentStatus: 'Assigned',
      tripStatus: 'Awaiting Driver Acceptance',
      vendorPayoutPercent,
      vendorPayableAmount,
      driverCompensationAmount: totalDriverCompAmount,
      driverBaseTripPay,
      nightStayAmount,
      nightStayNights,
      nightStayRemarks,
      nightStayAddedByDriver: Boolean(customFinancials.nightStayAddedByDriver || booking.nightStayAddedByDriver),
      assignmentTimeline: updatedTimeline,
      history: updatedTimeline
    };

    // 1. Immediately update Booking in local state & persist to localStorage
    setBookings((prev) => {
      const nextList = prev.map((b) => {
        if (b.id === bookingId || b.id === booking.id || b.bookingNumber === booking.bookingNumber || b.refId === bookingId || b._id === bookingId) {
          return {
            ...b,
            ...assignmentPayload
          };
        }
        return b;
      });
      saveStoredJson(STORAGE_KEYS.BOOKINGS, nextList);
      return nextList;
    });

    // 2. Persist to MongoDB Atlas via bookingService.assign and update
    try {
      const syncTargetId = booking.id || booking.bookingNumber || booking.refId || booking._id;
      if (syncTargetId && bookingService?.assign) {
        const res = await bookingService.assign(syncTargetId, assignmentPayload);
        if (res?.data) {
          setBookings((prev) => {
            const nextList = prev.map((b) =>
              (b.id === syncTargetId || b.bookingNumber === syncTargetId || b.refId === syncTargetId || b._id === syncTargetId)
                ? { ...b, ...res.data }
                : b
            );
            saveStoredJson(STORAGE_KEYS.BOOKINGS, nextList);
            return nextList;
          });
        }
      }
    } catch (err) {
      console.warn('Primary assign API deferred, attempting PUT update fallback:', err);
      try {
        const syncTargetId = booking.id || booking.bookingNumber || booking.refId || booking._id;
        if (syncTargetId && bookingService?.update) {
          const res = await bookingService.update(syncTargetId, assignmentPayload);
          if (res?.data) {
            setBookings((prev) => {
              const nextList = prev.map((b) =>
                (b.id === syncTargetId || b.bookingNumber === syncTargetId || b.refId === syncTargetId || b._id === syncTargetId)
                  ? { ...b, ...res.data }
                  : b
              );
              saveStoredJson(STORAGE_KEYS.BOOKINGS, nextList);
              return nextList;
            });
          }
        }
      } catch (fallbackErr) {
        console.warn('Fallback booking update deferred:', fallbackErr);
      }
    }

    // 2. Create new assignment record for driver
    const newAssignment = {
      id: assignmentId,
      bookingId: booking.id || booking.bookingNumber,
      bookingNumber: booking.bookingNumber || booking.id,
      driverId: driverObj.id,
      driverName: driverObj.name || driverObj.fullName,
      tripCategory: booking.bookingCategory || 'Round Trip',
      customerName: booking.customerName || booking.fullName || 'Customer',
      customerPhone: booking.customerPhone || booking.mobileNumber || '',
      passengerCount: booking.passengerCount || 4,
      pickupLocation: booking.pickupLocation || booking.fromLocation || 'Depot',
      destination: booking.destination || booking.toLocation || 'Destination',
      pickupDate: bJourney,
      pickupTime: booking.journeyTime || booking.pickupTime || '08:00 AM',
      returnDate: bReturn,
      returnTime: booking.returnTime || '06:00 PM',
      durationDays,
      assignedVehicle: assignedVehObj,
      vehicleId: veh.id,
      vehicleModel: veh.model,
      vehicleRegNo: veh.regNo,
      vehicleCategory: veh.category,
      estimatedEarnings: estEarnings,
      status: 'Assigned',
      assignedAt: nowFormatted
    };

    setAssignments((prev) => [newAssignment, ...prev]);

    // 3. Notify Driver
    pushDriverNotification(
      `New Trip Assignment – Booking ${booking.bookingNumber || booking.id}`,
      `New ${booking.bookingCategory} assigned from ${booking.pickupLocation} to ${booking.destination} on ${booking.journeyDate}. Vehicle: ${veh.regNo} (${veh.model}). Please review and accept.`,
      { bookingId: booking.id, actionUrl: '/driver/trips/assignments', type: 'assignment' }
    );

    // 4. Notify Admin
    const dispatchTime = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
    const dispatchDate = formatDateDMY(new Date());
    pushAdminNotification(
      `Trip Assignment Dispatched – ${booking.bookingNumber || booking.id}`,
      `Assigned ${vName} [${assignedVehObj.ownership}] and Driver ${driverObj.name} on ${dispatchDate} at ${dispatchTime}. Status: Awaiting Driver Acceptance.`,
      { bookingId: booking.id, driverName: driverObj.name, type: 'driver', actionUrl: `/admin/bookings/${booking.id}`, timestamp: `${dispatchDate}, ${dispatchTime}`, time: `${dispatchDate}, ${dispatchTime}` }
    );

    toast.success(`Dispatched ${veh.model} (${veh.regNo}) [${assignedVehObj.ownership}] & Driver ${driverObj.name}!`);
    return true;
  }, [bookings, drivers, vehicles, assignments, pushDriverNotification, pushAdminNotification, toast]);

  // --- 3. DRIVER ACCEPT TRIP ---
  const acceptTripAssignment = useCallback((targetId) => {
    if (!targetId) return false;
    const cleanId = String(targetId).startsWith('ASN-') ? String(targetId).replace(/^ASN-/, '') : String(targetId);

    // 1. Locate assignment by targetId, cleanId, id, bookingId, or bookingNumber
    let assignment = assignments.find((a) =>
      a.id === targetId ||
      a.id === cleanId ||
      a.bookingId === targetId ||
      a.bookingId === cleanId ||
      a.bookingNumber === targetId ||
      a.bookingNumber === cleanId
    );

    // 2. Locate booking by id, cleanId, bookingNumber, or assignment's bookingId
    const targetBookingId = assignment?.bookingId || cleanId || targetId;
    let booking = bookings.find((b) =>
      b.id === targetBookingId ||
      b.id === targetId ||
      b.id === cleanId ||
      b.bookingNumber === targetBookingId ||
      b.bookingNumber === targetId ||
      b.bookingNumber === cleanId
    );

    if (!assignment && !booking) {
      toast.error('Assignment or Booking not found');
      return false;
    }

    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const nowFormatted = new Date().toLocaleString();
    const driverName = assignment?.driverName || booking?.driverName || booking?.assignedDriver?.name || 'Arun Kumar Sundaram';
    const vehName = assignment?.assignedVehicle?.model || booking?.assignedVehicle?.model || booking?.vehicleName || 'Vehicle';
    const vehReg = assignment?.assignedVehicle?.regNo || booking?.assignedVehicle?.regNo || '';

    // If assignment object doesn't exist yet in assignments array, synthesize it
    if (!assignment && booking) {
      const durDays = getDaysBetween(booking.journeyDate, booking.returnDate);
      assignment = {
        id: generateId('ASN', { useYear: false }),
        bookingId: booking.id,
        bookingNumber: booking.bookingNumber || booking.id,
        driverId: booking.driverId || 'DRV-001',
        driverName,
        tripCategory: booking.bookingCategory,
        customerName: booking.customerName,
        customerPhone: booking.customerPhone,
        passengerCount: booking.passengerCount,
        pickupLocation: booking.pickupLocation,
        dropLocation: booking.destination,
        destination: booking.destination,
        pickupDate: booking.journeyDate,
        pickupTime: booking.journeyTime || '08:00 AM',
        returnDate: booking.returnDate || booking.journeyDate,
        returnTime: booking.returnTime || '06:00 PM',
        durationDays: durDays,
        assignedVehicle: booking.assignedVehicle,
        vehicleId: booking.vehicleId,
        vehicleModel: booking.assignedVehicle?.model || booking.vehicleName,
        vehicleRegNo: vehReg,
        vehicleCategory: booking.assignedVehicle?.category || booking.vehicleCategory,
        estimatedEarnings: (durDays * (booking.assignedVehicle?.driverAllowance || 500)) + (booking.driverCompensationAmount || 1500),
        status: 'Accepted',
        assignedAt: booking.createdAt || nowFormatted,
        acceptedAt: nowFormatted
      };
    }

    // 1. Update assignment state
    setAssignments((prev) => {
      const matchFn = (a) =>
        a.id === targetId ||
        a.id === cleanId ||
        a.id === assignment?.id ||
        a.bookingId === targetBookingId ||
        a.bookingId === targetId ||
        a.bookingId === cleanId;
      const exists = prev.some(matchFn);
      if (exists) {
        return prev.map((a) =>
          matchFn(a)
            ? { ...a, status: 'Accepted', acceptedAt: nowFormatted }
            : a
        );
      } else if (assignment) {
        return [{ ...assignment, status: 'Accepted', acceptedAt: nowFormatted }, ...prev];
      }
      return prev;
    });

    // 2. Update booking in shared state: bookingStatus becomes 'Confirmed'
    const resolvedDriverId = booking?.driverId || assignment?.driverId || 'DRV-001';
    const resolvedDriverName = driverName || booking?.driverName || 'Arun Kumar Sundaram';
    const resolvedDriver = booking?.assignedDriver || { id: resolvedDriverId, name: resolvedDriverName, phone: '9840122345' };
    const resolvedVehicle = booking?.assignedVehicle || assignment?.assignedVehicle || {
      id: booking?.vehicleId || 'VEH-105',
      model: booking?.requestedVehicleModel || booking?.vehicleReserved || booking?.vehicleName || 'Maruti Suzuki Swift',
      regNo: vehReg || 'KA-01-MJ-4419',
      category: booking?.vehicleCategory || 'Hatchback',
      ownershipType: 'In-House Fleet'
    };

    setBookings((prev) =>
      prev.map((b) => {
        if (
          b.id === targetBookingId ||
          b.id === targetId ||
          b.id === cleanId ||
          b.bookingNumber === targetBookingId ||
          b.bookingNumber === targetId ||
          b.bookingNumber === cleanId
        ) {
          const updatedTimeline = [
            ...(b.assignmentTimeline || []),
            {
              id: generateId('TL', { useYear: false }),
              timestamp: nowTime,
              event: `Driver Accepted Assignment (${resolvedDriverName})`,
              actor: resolvedDriverName,
              status: 'Accepted'
            }
          ];
          return {
            ...b,
            driverId: resolvedDriverId,
            driverName: resolvedDriverName,
            assignedDriver: resolvedDriver,
            assignedVehicle: resolvedVehicle,
            vehicleId: resolvedVehicle?.id || b.vehicleId,
            bookingStatus: 'Confirmed',
            driverAssignmentStatus: 'Accepted',
            tripStatus: 'Driver Accepted',
            driverAcceptedAt: nowFormatted,
            assignmentTimeline: updatedTimeline,
            history: updatedTimeline
          };
        }
        return b;
      })
    );

    // Update driver dutyStatus to 'Assigned'
    setDrivers((prev) =>
      prev.map((d) => (d.id === resolvedDriverId ? { ...d, dutyStatus: 'Assigned', status: 'Assigned' } : d))
    );

    // Sync accept to backend if possible
    try {
      const bSyncId = booking?.id || booking?.bookingNumber || booking?.refId || booking?._id || targetBookingId;
      if (bSyncId && tripService?.acceptAssignment) {
        tripService.acceptAssignment(bSyncId).then((res) => {
          if (res?.data) {
            setBookings((prev) =>
              prev.map((b) => (b.id === bSyncId || b.bookingNumber === bSyncId || b.refId === bSyncId ? { ...b, ...res.data } : b))
            );
          }
        }).catch(() => {
          if (bookingService?.update) {
            bookingService.update(bSyncId, {
              driverId: resolvedDriverId,
              driverName: resolvedDriverName,
              assignedDriver: resolvedDriver,
              assignedVehicle: resolvedVehicle,
              vehicleId: resolvedVehicle?.id,
              bookingStatus: 'Confirmed',
              driverAssignmentStatus: 'Accepted',
              tripStatus: 'Driver Accepted',
              driverAcceptedAt: nowFormatted
            }).catch(() => {});
          }
        });
      }
    } catch (_) {}

    // 3. Notify Admin (High Priority Operational Alert with exact date & time)
    const bookingIdentifier = booking?.bookingNumber || booking?.id || assignment?.bookingNumber || assignment?.bookingId || cleanId || targetId;
    const now = new Date();
    const formattedDate = formatDateDMY(now);
    const formattedTime = now.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
    const fullAcceptedStamp = `${formattedDate} at ${formattedTime}`;

    pushAdminNotification(
      `Driver Accepted Trip – ${bookingIdentifier}`,
      `Driver ${driverName} accepted trip #${bookingIdentifier} on ${fullAcceptedStamp}. Passenger: ${booking?.customerName || assignment?.customerName || 'Passenger'} (${booking?.bookingCategory || assignment?.tripCategory || 'Trip'}: ${booking?.pickupLocation || assignment?.pickupLocation} → ${booking?.destination || assignment?.destination}). Booking is now Confirmed on roster.`,
      {
        bookingId: booking?.id || assignment?.bookingId || cleanId || targetId,
        driverName,
        type: 'driver',
        category: 'Driver Assignment',
        priority: 'High',
        actionUrl: `/admin/bookings/${booking?.id || assignment?.bookingId || cleanId || targetId}`,
        timestamp: `${formattedDate}, ${formattedTime}`,
        time: `${formattedDate}, ${formattedTime}`,
        date: formattedDate,
        timeOnly: formattedTime,
        acceptedAt: fullAcceptedStamp
      }
    );

    // 4. Notify Driver
    pushDriverNotification(
      `Trip Confirmed – ${bookingIdentifier}`,
      `Trip confirmed. Please arrive at ${booking?.pickupLocation || assignment?.pickupLocation} 15 minutes prior to ${booking?.journeyTime || assignment?.pickupTime || '08:00 AM'}.`,
      {
        bookingId: booking?.id || assignment?.bookingId || cleanId || targetId,
        actionUrl: `/driver/trips/${booking?.id || assignment?.bookingId || cleanId || targetId}`,
        type: 'trip'
      }
    );

    toast.success(`🎉 Trip assignment #${bookingIdentifier} accepted! Added to your active roster.`);
    return true;
  }, [assignments, bookings, pushAdminNotification, pushDriverNotification, toast]);

  // --- 4. DRIVER DECLINE TRIP ---
  const declineTripAssignment = useCallback((targetId, reason, explanation = '') => {
    if (!targetId) return false;
    const cleanId = String(targetId).startsWith('ASN-') ? String(targetId).replace(/^ASN-/, '') : String(targetId);

    let assignment = assignments.find((a) =>
      a.id === targetId ||
      a.id === cleanId ||
      a.bookingId === targetId ||
      a.bookingId === cleanId ||
      a.bookingNumber === targetId ||
      a.bookingNumber === cleanId
    );
    const targetBookingId = assignment?.bookingId || cleanId || targetId;
    let booking = bookings.find((b) =>
      b.id === targetBookingId ||
      b.id === targetId ||
      b.id === cleanId ||
      b.bookingNumber === targetBookingId ||
      b.bookingNumber === targetId ||
      b.bookingNumber === cleanId
    );

    if (!assignment && !booking) {
      toast.error('Assignment or Booking not found');
      return false;
    }

    const fullReason = explanation ? `${reason}: ${explanation}` : reason;
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const nowFormatted = new Date().toLocaleString();
    const driverName = assignment?.driverName || booking?.driverName || 'Driver';

    // 1. Update assignment: keep record with final status Declined
    setAssignments((prev) => {
      const matchFn = (a) =>
        a.id === targetId ||
        a.id === cleanId ||
        a.id === assignment?.id ||
        a.bookingId === targetBookingId ||
        a.bookingId === targetId ||
        a.bookingId === cleanId;
      return prev.map((a) =>
        matchFn(a)
          ? { ...a, status: 'Declined', declineReason: fullReason, declinedAt: nowFormatted }
          : a
      );
    });

    // 2. Update booking in shared state
    setBookings((prev) =>
      prev.map((b) => {
        if (
          b.id === targetBookingId ||
          b.id === targetId ||
          b.id === cleanId ||
          b.bookingNumber === targetBookingId ||
          b.bookingNumber === targetId ||
          b.bookingNumber === cleanId
        ) {
          const historyEntry = {
            driverId: assignment?.driverId || b.driverId,
            driverName: driverName,
            assignedAt: assignment?.assignedAt || b.createdAt,
            declinedAt: nowFormatted,
            status: 'Declined',
            declineReason: fullReason
          };
          const updatedTimeline = [
            ...(b.assignmentTimeline || []),
            {
              id: generateId('TL', { useYear: false }),
              timestamp: nowTime,
              event: `Driver Declined (${driverName}) – Reason: ${reason}`,
              actor: driverName,
              status: 'Declined'
            }
          ];
          return {
            ...b,
            driverId: null,
            driverName: null,
            assignedDriver: null,
            driverAssignmentStatus: 'Reassignment Required',
            tripStatus: 'Driver Declined',
            declineReason: fullReason,
            assignmentHistory: [...(b.assignmentHistory || []), historyEntry],
            assignmentTimeline: updatedTimeline,
            history: updatedTimeline
          };
        }
        return b;
      })
    );

    // 3. Notify Admin immediately
    const bookingIdentifier = booking?.bookingNumber || booking?.id || assignment?.bookingNumber || assignment?.bookingId || cleanId || targetId;
    pushAdminNotification(
      `Driver Declined Trip – ${bookingIdentifier}`,
      `Driver ${driverName} declined trip for ${bookingIdentifier}. Reason: ${fullReason}. Immediate reassignment required.`,
      {
        bookingId: booking?.id || assignment?.bookingId || cleanId || targetId,
        driverName,
        type: 'driver',
        category: 'Driver Assignment',
        priority: 'High',
        actionUrl: `/admin/bookings/${booking?.id || assignment?.bookingId || cleanId || targetId}`
      }
    );

    // Sync decline to backend if possible
    try {
      const bSyncId = booking?.id || booking?.bookingNumber || booking?.refId || booking?._id || targetBookingId;
      if (bSyncId && tripService?.declineAssignment) {
        tripService.declineAssignment(bSyncId, reason, explanation).then((res) => {
          if (res?.data) {
            setBookings((prev) =>
              prev.map((b) => (b.id === bSyncId || b.bookingNumber === bSyncId || b.refId === bSyncId ? { ...b, ...res.data } : b))
            );
          }
        }).catch((err) => console.warn('Decline trip backend sync deferred:', err));
      }
    } catch (_) {}

    toast.info('Assignment declined. Returned to Admin for reassignment.');
    return true;
  }, [assignments, bookings, pushAdminNotification, toast]);

  // --- 4.5. ARRIVED AT PICKUP ---
  const arrivedAtPickup = useCallback((targetId) => {
    if (!targetId) return false;
    const cleanId = String(targetId).startsWith('ASN-') ? String(targetId).replace(/^ASN-/, '') : String(targetId);
    const booking = bookings.find((b) => b.id === targetId || b.id === cleanId || b.bookingNumber === targetId || b.bookingNumber === cleanId);
    const bId = booking?.id || cleanId || targetId;
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const nowFormatted = new Date().toLocaleString();
    const dName = booking?.driverName || 'Driver';

    setBookings((prev) =>
      prev.map((b) => {
        if (b.id === bId || b.bookingNumber === bId || b.refId === bId) {
          const updatedTimeline = [
            ...(b.assignmentTimeline || []),
            {
              id: generateId('TL', { useYear: false }),
              timestamp: nowTime,
              event: `Driver Arrived at Pickup Location (${dName})`,
              actor: dName,
              status: 'Arrived at Pickup'
            }
          ];
          return {
            ...b,
            tripStatus: 'Arrived at Pickup',
            arrivedAtPickupAt: nowFormatted,
            assignmentTimeline: updatedTimeline,
            history: updatedTimeline
          };
        }
        return b;
      })
    );

    const arriveTime = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
    const arriveDate = formatDateDMY(new Date());
    pushAdminNotification(
      `Driver Arrived at Pickup – ${booking?.bookingNumber || bId}`,
      `Driver ${dName} reached pickup point (${booking?.pickupLocation || 'pickup location'}) on ${arriveDate} at ${arriveTime} and reported ready.`,
      { bookingId: bId, driverName: dName, type: 'trip', actionUrl: `/admin/bookings/${bId}`, timestamp: `${arriveDate}, ${arriveTime}`, time: `${arriveDate}, ${arriveTime}` }
    );

    try {
      if (tripService?.arriveAtPickup) {
        tripService.arriveAtPickup(bId).then((res) => {
          if (res?.data) {
            setBookings((prev) =>
              prev.map((b) => (b.id === bId || b.bookingNumber === bId || b.refId === bId ? { ...b, ...res.data } : b))
            );
          }
        }).catch((err) => console.warn('Arrive at pickup backend sync deferred:', err));
      }
    } catch (_) {}

    toast.success('Pickup arrival confirmed! Operations Desk notified.');
    return true;
  }, [bookings, pushAdminNotification, toast]);

  // --- 5. START TRIP ---
  const startTrip = useCallback((bookingId, metadata = {}) => {
    const booking = bookings.find((b) => b.id === bookingId || b.bookingNumber === bookingId);
    if (!booking) {
      toast.error('Booking not found');
      return false;
    }

    if (booking.tripStatus === 'In Progress' || booking.bookingStatus === 'On Trip') {
      toast.warning('Trip is already in progress.');
      return false;
    }
    if (booking.tripStatus === 'Completed' || booking.bookingStatus === 'Completed') {
      toast.error('Trip has already been completed.');
      return false;
    }
    if (booking.bookingStatus === 'Cancelled') {
      toast.error('Cannot start a cancelled booking.');
      return false;
    }

    // Validate schedule date: Driver and Admin can start the trip on the journey start date
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const rawJDate = booking.journeyDate || booking.travelDate || booking.pickupDate;
    const jDate = normalizeDate(rawJDate);
    if (jDate && todayStr < jDate && !metadata.overrideDateCheck) {
      toast.error(`Trip cannot be started prior to the journey start date (${formatDateDMY(jDate)}). The driver/admin can start the trip on the journey start date.`);
      return false;
    }

    // Driver & Vehicle assignment check
    const isAdmin = Boolean(metadata.isAdmin || metadata.forceStart);
    if (!booking.driverId && !booking.assignedDriverId && !booking.assignedDriver?.id) {
      toast.error('Please assign a driver before starting the trip.');
      return false;
    }

    if (booking.driverAssignmentStatus !== 'Accepted' && !isAdmin && !metadata.forceStart) {
      toast.error('Trip cannot be started until driver accepts the assignment.');
      return false;
    }

    // Vehicle lookup
    const bVehKey = String(booking.vehicleId || booking.assignedVehicle?.id || booking.assignedVehicle?.regNo || booking.assignedVehicle?.numberPlate || '').toUpperCase().replace(/[\s-]+/g, '');
    const veh = vehicles.find((v) => {
      const vId = String(v.id || '').toUpperCase().replace(/[\s-]+/g, '');
      const vReg = String(v.regNo || v.numberPlate || '').toUpperCase().replace(/[\s-]+/g, '');
      return (bVehKey && (vId === bVehKey || vReg === bVehKey)) || (booking.vehicleName && (v.name === booking.vehicleName || v.model === booking.vehicleName));
    });
    const lastVehicleOdo = veh ? (veh.odometerKm || veh.currentKm || 0) : 0;

    // Validate odometer reading: required number >= vehicle last recorded odometer
    const rawOdo = metadata.startOdometer;
    let startOdo = lastVehicleOdo || 45000;
    if (rawOdo !== undefined && rawOdo !== null && rawOdo !== '' && !isNaN(Number(rawOdo))) {
      const parsedOdo = Number(rawOdo);
      if (parsedOdo < lastVehicleOdo && !isAdmin && !metadata.forceStart) {
        toast.error(`Starting odometer (${parsedOdo} km) cannot be less than vehicle's current odometer (${lastVehicleOdo} km).`);
        return false;
      }
      startOdo = Math.max(parsedOdo, lastVehicleOdo);
    }

    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const nowFormatted = new Date().toLocaleString();

    // Update booking
    setBookings((prev) =>
      prev.map((b) => {
        if (b.id === booking.id) {
          const updatedTimeline = [
            ...(b.assignmentTimeline || []),
            {
              id: generateId('TL', { useYear: false }),
              timestamp: nowTime,
              event: `Trip Started by ${b.driverName || 'Driver'} (Odometer: ${startOdo} km)`,
              actor: b.driverName || 'Driver',
              status: 'In Progress'
            }
          ];
          return {
            ...b,
            bookingStatus: 'On Trip',
            tripStatus: 'In Progress',
            driverAssignmentStatus: 'Accepted',
            tripStartedAt: nowFormatted,
            startOdometer: startOdo,
            assignmentTimeline: updatedTimeline,
            history: updatedTimeline
          };
        }
        return b;
      })
    );

    // Update vehicle status & odometer
    setVehicles((prev) =>
      prev.map((v) => {
        const vId = String(v.id || '').toUpperCase().replace(/[\s-]+/g, '');
        const vReg = String(v.regNo || v.numberPlate || '').toUpperCase().replace(/[\s-]+/g, '');
        const isTarget = (bVehKey && (vId === bVehKey || vReg === bVehKey)) || (veh && (v.id === veh.id || (veh.regNo && v.regNo === veh.regNo)));
        return isTarget ? { ...v, status: 'On Trip', odometerKm: startOdo, currentKm: startOdo } : v;
      })
    );

    // Update driver dutyStatus
    if (booking.driverId) {
      setDrivers((prev) =>
        prev.map((d) => (d.id === booking.driverId ? { ...d, dutyStatus: 'On Trip' } : d))
      );
    }

    // Notify Admin
    const startTripTime = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
    const startTripDate = formatDateDMY(new Date());
    pushAdminNotification(
      `Trip Started – ${booking.bookingNumber || booking.id}`,
      `Trip started on ${startTripDate} at ${startTripTime}. Driver: ${booking.driverName}, Vehicle: ${veh?.regNo || 'Car'}, Start Odometer: ${startOdo} km.`,
      { bookingId: booking.id, driverName: booking.driverName, type: 'trip', actionUrl: `/admin/bookings/${booking.id}`, timestamp: `${startTripDate}, ${startTripTime}`, time: `${startTripDate}, ${startTripTime}` }
    );

    // Sync to backend
    try {
      const bSyncId = booking.id || booking.bookingNumber || booking.refId || booking._id;
      if (bSyncId && tripService?.startTrip) {
        tripService.startTrip(bSyncId, { startOdometer: startOdo, remarks: metadata.remarks || '' }).then((res) => {
          if (res?.data) {
            setBookings((prev) =>
              prev.map((b) => (b.id === bSyncId || b.bookingNumber === bSyncId || b.refId === bSyncId ? { ...b, ...res.data } : b))
            );
          }
        }).catch((err) => console.warn('Start trip backend sync deferred:', err));
      }
    } catch (_) {}

    toast.success('Trip started successfully! Drive safely.');
    return true;
  }, [bookings, vehicles, pushAdminNotification, toast]);

  // --- 6. END TRIP ---
  const endTrip = useCallback((bookingId, metadata = {}) => {
    // Exact matching on booking.id or booking.bookingNumber
    const booking = bookings.find((b) => b.id === bookingId || b.bookingNumber === bookingId);
    if (!booking) {
      toast.error('Booking record not found');
      return false;
    }

    if (booking.tripStatus === 'Completed') {
      return true;
    }

    if (booking.tripStatus !== 'In Progress') {
      toast.error('Cannot end a trip that is not currently in progress.');
      return false;
    }

    const startOdo = booking.startOdometer || 0;
    const rawEndOdo = metadata.endOdometer;

    if (rawEndOdo === undefined || rawEndOdo === null || rawEndOdo === '' || isNaN(Number(rawEndOdo))) {
      toast.error('Please enter a valid ending odometer reading.');
      return false;
    }
    const endOdo = Number(rawEndOdo);
    if (endOdo <= startOdo) {
      toast.error(`Ending odometer (${endOdo} km) must be strictly greater than starting odometer (${startOdo} km).`);
      return false;
    }

    const distanceTravelled = endOdo - startOdo;
    const remarks = metadata.remarks || metadata.completionRemarks || 'Trip concluded successfully. Passenger dropped safely.';
    const duration = metadata.duration || 'Completed';

    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const nowFormatted = new Date().toLocaleString();
    const nowIso = new Date().toISOString();
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    const totalAmt = booking.totalAmount || 0;
    const advPaid = booking.advancePaid || 0;
    const balAmt = Math.max(0, totalAmt - advPaid);

    // 1. Update Booking
    setBookings((prev) =>
      prev.map((b) => {
        if (b.id === booking.id) {
          const updatedTimeline = [
            ...(b.assignmentTimeline || []),
            {
              id: generateId('TL', { useYear: false }),
              timestamp: nowTime,
              event: `Trip Completed (Odometer: ${endOdo} km, Distance: ${distanceTravelled} km)`,
              actor: b.driverName || 'Driver',
              status: 'Completed'
            }
          ];
          return {
            ...b,
            bookingStatus: 'Completed',
            tripStatus: 'Completed',
            completedAt: nowIso,
            tripCompletedAt: nowFormatted,
            endOdometer: endOdo,
            distanceTravelled,
            balanceAmount: balAmt,
            tripRemarks: remarks,
            tripDuration: duration,
            assignmentTimeline: updatedTimeline,
            history: updatedTimeline
          };
        }
        return b;
      })
    );

    // 2. Driver trip stats & release
    if (booking.driverId) {
      setDrivers((prev) =>
        prev.map((d) => {
          if (d.id === booking.driverId) {
            // Check if driver has any OTHER in-progress trip
            const otherActive = bookings.some((b) => b.id !== booking.id && b.driverId === d.id && b.tripStatus === 'In Progress');
            return {
              ...d,
              totalTripsCompleted: (d.totalTripsCompleted || 0) + 1,
              tripsCompleted: (d.tripsCompleted || 0) + 1,
              dutyStatus: otherActive ? 'On Trip' : 'Available'
            };
          }
          return d;
        })
      );
    }

    // 3. Vehicle stats & release
    const bVehKey = String(booking.vehicleId || booking.assignedVehicle?.id || booking.assignedVehicle?.regNo || booking.assignedVehicle?.numberPlate || '').toUpperCase().replace(/[\s-]+/g, '');
    setVehicles((prev) =>
      prev.map((v) => {
        const vId = String(v.id || '').toUpperCase().replace(/[\s-]+/g, '');
        const vReg = String(v.regNo || v.numberPlate || '').toUpperCase().replace(/[\s-]+/g, '');
        const isMatch = (bVehKey && (vId === bVehKey || vReg === bVehKey)) || (booking.vehicleName && (v.name === booking.vehicleName || v.model === booking.vehicleName));
        if (isMatch) {
          const otherActive = bookings.some((b) => b.id !== booking.id && (b.vehicleId === v.id || b.assignedVehicle?.id === v.id || String(b.assignedVehicle?.regNo || '').toUpperCase().replace(/[\s-]+/g, '') === vReg) && ['On Trip', 'Confirmed'].includes(b.bookingStatus));
          return {
            ...v,
            odometerKm: endOdo,
            currentKm: endOdo,
            tripHistoryCount: (v.tripHistoryCount || 0) + 1,
            status: otherActive ? v.status : 'Available'
          };
        }
        return v;
      })
    );

    // 4. Generate system Invoice for completed trip
    const invoiceNum = booking.invoiceNumber || generateId('INV', { useYear: true });
    const dueDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().substring(0, 10);
    const newInvoice = {
      id: generateId('INV', { useYear: true }),
      invoiceNumber: invoiceNum,
      bookingId: booking.id,
      bookingNumber: booking.bookingNumber || booking.id,
      customerName: booking.customerName,
      customerPhone: booking.customerPhone,
      customerEmail: booking.customerEmail || '',
      totalAmount: totalAmt,
      advancePaid: advPaid,
      balanceDue: balAmt,
      status: balAmt === 0 ? 'Paid' : 'Partially Paid',
      issueDate: todayStr,
      dueDate,
      items: [
        {
          id: 'ITEM-1',
          description: `${booking.bookingCategory} – ${booking.pickupLocation} to ${booking.destination} (${distanceTravelled} km)`,
          amount: totalAmt
        }
      ]
    };
    setInvoices((prev) => [newInvoice, ...prev.filter((i) => i.bookingId !== booking.id)]);

    // Persist Invoice to MongoDB Atlas via financeService
    if (financeService?.createInvoice) {
      financeService.createInvoice({
        bookingRef: booking.bookingNumber || booking.id,
        customerName: booking.customerName,
        customerPhone: booking.customerPhone,
        customerEmail: booking.customerEmail || '',
        amount: totalAmt,
        amountPaid: advPaid,
        invoiceDate: todayStr,
        dueDate,
        lineItems: newInvoice.items
      }).catch((err) => console.warn('Invoice Atlas persistence note:', err.message));
    }

    // 4.5. Generate Vendor Payout & Driver Compensation Expenses
    const completedExpenses = generateCompletedBookingExpenses(booking, totalAmt, todayStr);
    if (completedExpenses.length > 0) {
      setExpenses((prev) => {
        const existingIds = new Set(prev.map((e) => e.id));
        const toAdd = completedExpenses.filter((e) => !existingIds.has(e.id));
        return toAdd.length > 0 ? [...toAdd, ...prev] : prev;
      });

      // Persist Vendor Payout & Driver Compensation to MongoDB Atlas via financeService
      if (financeService?.createExpense) {
        completedExpenses.forEach((exp) => {
          financeService.createExpense({
            category: exp.category,
            amount: exp.amount,
            tripId: exp.tripId || `TRP-${booking.id}`,
            bookingRef: booking.bookingNumber || booking.id,
            driverId: exp.driverId || null,
            driverName: exp.payee || null,
            date: todayStr,
            status: 'Paid',
            notes: exp.description,
            paymentMode: exp.paymentMethod || 'Bank Transfer'
          }).catch((err) => console.warn('Completed expense Atlas persistence note:', err.message));
        });
      }
    }

    // 5. Notify Admin
    const endTripTime = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
    const endTripDate = formatDateDMY(new Date());
    pushAdminNotification(
      `Trip Completed – ${booking.bookingNumber || booking.id}`,
      `Trip concluded by ${booking.driverName} on ${endTripDate} at ${endTripTime}. Distance: ${distanceTravelled} km. Balance Due: ₹${balAmt}. Invoice #${invoiceNum} generated.`,
      { bookingId: booking.id, driverName: booking.driverName, type: 'trip', actionUrl: `/admin/bookings/${booking.id}`, timestamp: `${endTripDate}, ${endTripTime}`, time: `${endTripDate}, ${endTripTime}` }
    );

    // Sync to backend
    try {
      const bSyncId = booking.id || booking.bookingNumber || booking.refId || booking._id;
      if (bSyncId && tripService?.endTrip) {
        tripService.endTrip(bSyncId, {
          endOdometer: endOdo,
          remarks,
          completionRemarks: remarks,
          tollAmount: metadata.tollAmount || 0,
          fuelAmount: metadata.fuelAmount || 0
        }).then((res) => {
          if (res?.data) {
            setBookings((prev) =>
              prev.map((b) => (b.id === bSyncId || b.bookingNumber === bSyncId || b.refId === bSyncId ? { ...b, ...res.data } : b))
            );
          }
        }).catch((err) => console.warn('End trip backend sync deferred:', err));
      }
    } catch (_) {}

    toast.success(`Trip completed successfully! All records & invoice #${invoiceNum} generated.`);
    return true;
  }, [bookings, pushAdminNotification, toast]);

  // --- 6.5. ADD / UPDATE NIGHT STAY ALLOWANCE (Added by Driver or Admin) ---
  const addNightStayToTrip = useCallback(async (bookingId, nightStayData = {}) => {
    if (!bookingId) return false;
    const cleanId = String(bookingId).startsWith('ASN-') ? String(bookingId).replace(/^ASN-/, '') : String(bookingId);

    const booking = bookings.find(
      (b) => b.id === bookingId || b.id === cleanId || b.bookingNumber === bookingId || b.bookingNumber === cleanId || b.refId === bookingId
    );

    const nights = Math.max(1, Number(nightStayData.nights || 1));
    const ratePerNight = Number(nightStayData.ratePerNight || nightStayData.amountPerNight || 500);
    const additionalAmount = Number(nightStayData.totalAmount || (nights * ratePerNight));
    const remarks = nightStayData.remarks || `Driver overnight stay (${nights} night${nights > 1 ? 's' : ''})`;
    const stayDate = nightStayData.date || new Date().toISOString().substring(0, 10);
    const addedBy = nightStayData.driverName || booking?.driverName || 'Driver';

    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    let updatedBookingResult = null;

    setBookings((prev) => {
      const nextList = prev.map((b) => {
        if (b.id === bookingId || b.id === cleanId || b.bookingNumber === bookingId || b.bookingNumber === cleanId || b.refId === bookingId) {
          const currentBase = Number(b.driverBaseTripPay || (b.driverCompensationAmount ? (b.driverCompensationAmount - (b.nightStayAmount || 0)) : 1000));
          const newTotalDriverCompensation = currentBase + additionalAmount;
          const updatedTimeline = [
            ...(b.assignmentTimeline || []),
            {
              id: generateId('TL', { useYear: false }),
              timestamp: nowTime,
              event: `🌙 Night Stay Allowance Added by ${addedBy}: ₹${Number(additionalAmount || 0).toLocaleString('en-IN')} (${nights} night(s) @ ₹${Number(ratePerNight || 0).toLocaleString('en-IN')}/night - ${remarks})`,
              actor: addedBy,
              status: b.tripStatus || 'In Progress'
            }
          ];

          const updated = {
            ...b,
            driverBaseTripPay: currentBase,
            nightStayAmount: additionalAmount,
            nightStayNights: nights,
            nightStayRatePerNight: ratePerNight,
            nightStayRemarks: remarks,
            nightStayDate: stayDate,
            nightStayAddedByDriver: true,
            driverCompensationAmount: newTotalDriverCompensation,
            assignmentTimeline: updatedTimeline,
            history: updatedTimeline
          };
          updatedBookingResult = updated;
          return updated;
        }
        return b;
      });
      saveStoredJson(STORAGE_KEYS.BOOKINGS, nextList);
      return nextList;
    });

    // Also update assignments so driver sees updated estimatedEarnings & nightStayAmount
    setAssignments((prev) =>
      prev.map((a) => {
        if (a.bookingId === bookingId || a.bookingId === cleanId || a.bookingNumber === bookingId || a.bookingNumber === cleanId || a.id === bookingId) {
          return {
            ...a,
            nightStayAmount: additionalAmount,
            nightStayNights: nights,
            nightStayRemarks: remarks,
            estimatedEarnings: (a.estimatedEarnings || 1500) + additionalAmount
          };
        }
        return a;
      })
    );

    // Push Admin Notification
    pushAdminNotification(
      `🌙 Night Stay Claim Added - Booking #${booking?.bookingNumber || booking?.id || cleanId}`,
      `Driver ${addedBy} added a Night Stay allowance of ₹${Number(additionalAmount || 0).toLocaleString('en-IN')} (${nights} night(s) @ ₹${Number(ratePerNight || 0).toLocaleString('en-IN')}/night). Total driver pay updated to ₹${Number((booking?.driverBaseTripPay || 1000) + additionalAmount).toLocaleString('en-IN')}.`,
      { bookingId: booking?.id || cleanId, type: 'trip', actionUrl: `/admin/bookings/${booking?.id || cleanId}` }
    );

    // Push Driver Notification
    pushDriverNotification(
      `🌙 Night Stay Allowance Recorded - ₹${Number(additionalAmount || 0).toLocaleString('en-IN')}`,
      `Your night halt allowance of ₹${Number(additionalAmount || 0).toLocaleString('en-IN')} (${nights} night(s)) has been added to Booking #${booking?.bookingNumber || cleanId}. Updated trip earnings: ₹${Number((booking?.driverBaseTripPay || 1000) + additionalAmount).toLocaleString('en-IN')}.`,
      { bookingId: booking?.id || cleanId, actionUrl: `/driver/trips/${booking?.id || cleanId}`, type: 'trip' }
    );

    // Async backend update
    try {
      const bSyncId = booking?.id || booking?.bookingNumber || cleanId;
      if (bSyncId && bookingService?.update) {
        bookingService.update(bSyncId, {
          driverBaseTripPay: updatedBookingResult?.driverBaseTripPay,
          nightStayAmount: additionalAmount,
          nightStayNights: nights,
          nightStayRemarks: remarks,
          nightStayAddedByDriver: true,
          driverCompensationAmount: updatedBookingResult?.driverCompensationAmount
        }).catch((err) => console.warn('Night stay backend sync deferred:', err));
      }
    } catch (_) {}

    toast.success(`Night stay allowance of ₹${Number(additionalAmount || 0).toLocaleString('en-IN')} added to trip payout!`);
    return true;
  }, [bookings, pushAdminNotification, pushDriverNotification, toast]);

  // --- 7. RECORD BALANCE PAYMENT ---
  const recordBalancePayment = useCallback((bookingId, amount, method = 'UPI / QR', reference = '') => {
    const booking = bookings.find((b) => b.id === bookingId || b.bookingNumber === bookingId);
    if (!booking) {
      toast.error('Booking not found');
      return false;
    }

    const payAmt = parseFloat(amount);
    if (!payAmt || payAmt <= 0) {
      toast.error('Please enter a valid payment amount');
      return false;
    }

    const curAdvance = parseFloat(booking.advancePaid) || 0;
    const total = parseFloat(booking.totalAmount) || 0;
    const curBalance = Math.max(0, total - curAdvance);

    if (payAmt > curBalance) {
      toast.error(`Payment amount (₹${payAmt}) cannot exceed remaining balance due (₹${curBalance})`);
      return false;
    }

    const newAdvance = curAdvance + payAmt;
    const newBalance = Math.max(0, total - newAdvance);
    const newStatus = newBalance === 0 ? 'Paid' : 'Partially Paid';
    const nowFormatted = new Date().toISOString().replace('T', ' ').substring(0, 16);
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const receiptNum = generateId('REC', { useYear: true });
    const payNum = `RCPT-${receiptNum.replace(/[^0-9]/g, '')}`;

    // 1. Record Payment
    const newPayment = {
      id: generateId('PAY', { useYear: true }),
      receiptNumber: receiptNum,
      paymentNumber: payNum,
      bookingId: booking.id,
      bookingNumber: booking.bookingNumber || booking.id,
      partyName: booking.customerName,
      customerName: booking.customerName,
      customerPhone: booking.customerPhone,
      amount: payAmt,
      method: method,
      paymentMethod: method,
      transactionRef: reference || `REF-${Date.now().toString().slice(-6)}`,
      paymentReference: reference || `REF-${Date.now().toString().slice(-6)}`,
      type: 'Customer Payment',
      paymentType: 'Balance',
      category: 'Booking Balance Payment',
      status: 'Completed',
      date: todayStr,
      createdAt: nowFormatted
    };
    setPayments((prev) => [newPayment, ...prev]);

    // 2. Update Booking
    setBookings((prev) =>
      prev.map((b) => {
        if (b.id === booking.id) {
          const updatedTimeline = [
            ...(b.assignmentTimeline || []),
            {
              id: generateId('TL', { useYear: false }),
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              event: `Balance Payment of ₹${payAmt} received via ${method} (Receipt #${receiptNum})`,
              actor: 'Finance Admin',
              status: newStatus
            }
          ];
          return {
            ...b,
            advancePaid: newAdvance,
            balanceAmount: newBalance,
            paymentStatus: newStatus,
            assignmentTimeline: updatedTimeline,
            history: updatedTimeline
          };
        }
        return b;
      })
    );

    // 3. Update Invoice
    setInvoices((prev) =>
      prev.map((inv) =>
        inv.bookingId === booking.id
          ? {
              ...inv,
              advancePaid: newAdvance,
              balanceDue: newBalance,
              status: newBalance === 0 ? 'Paid' : 'Partially Paid'
            }
          : inv
      )
    );

    // 4. Persist Payment & Updated Booking to MongoDB Atlas
    if (financeService?.recordPayment) {
      financeService.recordPayment({
        bookingRef: booking.bookingNumber || booking.id,
        amount: payAmt,
        paymentMethod: method,
        paymentReference: reference || newPayment.paymentReference,
        allowOverpayment: true,
        status: 'captured'
      }).catch((err) => console.warn('Payment Atlas persistence note:', err.message));
    }

    if (bookingService?.update) {
      bookingService.update(booking.id, {
        advancePaid: newAdvance,
        balanceAmount: newBalance,
        paymentStatus: newStatus
      }).catch(() => {});
    }

    toast.success(`Payment of ₹${payAmt} recorded! Receipt #${receiptNum}`);
    return true;
  }, [bookings, toast]);

  // --- 8. EXPENSE CLAIMS & ENTRIES WORKFLOW ---
  const submitExpenseClaim = useCallback((claimData) => {
    if (!claimData.amount || parseFloat(claimData.amount) <= 0) {
      toast.error('Please enter a valid expense amount');
      return null;
    }
    if (!claimData.category) {
      toast.error('Please select an expense category');
      return null;
    }

    // Verify booking
    const booking = bookings.find((b) => b.id === claimData.bookingId);
    if (!booking) {
      toast.error('Booking associated with this claim could not be found');
      return null;
    }

    if (!booking.driverId || !booking.assignedDriver) {
      toast.error('Expense claim rejected: No driver is assigned to this booking.');
      return null;
    }

    if (claimData.driverId && claimData.driverId !== booking.driverId) {
      toast.error('Expense claim rejected: Submitting driver does not match the driver assigned to this booking.');
      return null;
    }

    const driverName = booking.assignedDriver?.name || booking.driverName || 'Driver';
    const vehReg = booking.assignedVehicle?.regNo || 'Fleet Vehicle';
    const newClaimId = generateId('EXP', { useYear: true });
    const nowFormatted = new Date().toISOString().replace('T', ' ').substring(0, 16);

    const newClaim = {
      id: newClaimId,
      bookingId: booking.id,
      bookingNumber: booking.bookingNumber || booking.id,
      tripId: claimData.tripId || `TRP-${booking.id}`,
      driverId: booking.driverId,
      driverName,
      vehicleRegNo: vehReg,
      category: claimData.category,
      expenseDate: claimData.expenseDate || new Date().toISOString().substring(0, 10),
      amount: parseFloat(claimData.amount),
      approvedAmount: null,
      description: claimData.description || `${claimData.category} expense during journey`,
      receiptUrl: claimData.receiptUrl || 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=800&q=80',
      receiptFileName: claimData.receiptFileName || 'receipt.jpg',
      receiptType: claimData.receiptType || 'image',
      paymentMethod: claimData.paymentMethod || 'Cash',
      status: 'Pending Approval',
      source: 'Driver Claim',
      submittedAt: nowFormatted,
      adminRemarks: '',
      rejectionReason: '',
      approvalDate: null,
      paymentDate: null,
      paymentReference: null,
      statusHistory: [
        {
          status: 'Pending Approval',
          by: driverName,
          at: nowFormatted,
          remark: 'Initial claim submission'
        }
      ],
      history: []
    };

    setExpenses((prev) => [newClaim, ...prev]);

    // Persist claim to MongoDB Atlas via financeService
    if (financeService?.createExpense) {
      financeService.createExpense({
        category: claimData.category,
        amount: parseFloat(claimData.amount),
        tripId: claimData.tripId || `TRP-${booking.id}`,
        bookingRef: booking.bookingNumber || booking.id,
        driverId: booking.driverId,
        driverName,
        date: claimData.expenseDate || new Date().toISOString().substring(0, 10),
        status: 'Pending',
        receiptUrl: claimData.receiptUrl || null,
        notes: claimData.description || `${claimData.category} expense during journey`,
        paymentMode: claimData.paymentMethod || 'Cash'
      }).catch((err) => console.warn('Driver claim Atlas persistence note:', err.message));
    }

    // Notify Admin
    const claimTime = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
    const claimDate = formatDateDMY(new Date());
    pushAdminNotification(
      `New Expense Claim – ${newClaim.id}`,
      `Booking ${booking.bookingNumber || booking.id}: ${driverName} submitted ₹${newClaim.amount} claim for ${newClaim.category} on ${claimDate} at ${claimTime}. Awaiting Admin Review.`,
      { bookingId: booking.id, driverName, type: 'expense', actionUrl: '/admin/expenses', timestamp: `${claimDate}, ${claimTime}`, time: `${claimDate}, ${claimTime}` }
    );

    toast.success(`Expense claim #${newClaim.id} submitted for approval!`);
    return newClaim;
  }, [bookings, pushAdminNotification, toast]);

  const addAdminExpense = useCallback((expenseData) => {
    if (!expenseData.amount || parseFloat(expenseData.amount) <= 0) {
      toast.error('Please enter a valid expense amount');
      return null;
    }
    if (!expenseData.category) {
      toast.error('Please select an expense category');
      return null;
    }

    const newId = generateId('EXP', { useYear: true });
    const amt = parseFloat(expenseData.amount);
    const todayStr = expenseData.expenseDate || expenseData.date || new Date().toISOString().substring(0, 10);

    const newExpense = {
      id: newId,
      bookingId: expenseData.bookingId || null,
      tripId: expenseData.tripId || null,
      driverId: expenseData.driverId || null,
      driverName: expenseData.driverName || 'Admin Operations',
      vehicleRegNo: expenseData.vehicleRegNo || null,
      vehicleNumber: expenseData.vehicleNumber || expenseData.vehicleRegNo || null,
      vehicleId: expenseData.vehicleId || null,
      workshopName: expenseData.workshopName || null,
      invoiceNo: expenseData.invoiceNo || null,
      subCategory: expenseData.subCategory || null,
      odometerKm: expenseData.odometerKm || 0,
      category: expenseData.category,
      expenseDate: todayStr,
      amount: amt,
      approvedAmount: amt,
      description: expenseData.description || `${expenseData.category} operational expense`,
      receiptUrl: expenseData.receiptUrl || null,
      status: 'Approved',
      source: expenseData.source || 'Admin Entry',
      submittedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      approvedBy: 'Admin Ops',
      approvalDate: todayStr,
      adminRemarks: 'Admin Direct Expense Entry'
    };

    setExpenses((prev) => [newExpense, ...prev]);

    // Persist Expense to MongoDB Atlas via financeService
    if (financeService?.createExpense) {
      financeService.createExpense({
        category: expenseData.category === 'Vehicle Maintenance' ? 'Maintenance' : expenseData.category,
        amount: amt,
        tripId: expenseData.tripId || null,
        bookingRef: expenseData.bookingId || null,
        driverId: expenseData.driverId || null,
        driverName: expenseData.driverName || 'Admin Operations',
        vehicleId: expenseData.vehicleId || null,
        vehicleNumber: expenseData.vehicleRegNo || null,
        vehicleRegNo: expenseData.vehicleRegNo || null,
        date: todayStr,
        status: 'Paid',
        notes: expenseData.description || `${expenseData.category} operational expense`,
        receiptUrl: expenseData.receiptUrl || null,
        paymentMode: expenseData.paymentMethod || 'Bank Transfer'
      }).catch((err) => console.warn('Expense Atlas persistence note:', err.message));
    }

    toast.success(`Operational expense entry ₹${amt} recorded!`);
    return newExpense;
  }, [toast]);

  const approveExpenseClaim = useCallback((claimId, approvedAmount, adminRemarks = '') => {
    const claim = expenses.find((e) => e.id === claimId);
    if (!claim) {
      toast.error('Expense claim not found');
      return false;
    }

    if (claim.status !== 'Pending Approval') {
      toast.warning(`Claim cannot be approved because current status is "${claim.status}".`);
      return false;
    }

    const appAmt = parseFloat(approvedAmount);
    if (isNaN(appAmt) || appAmt <= 0) {
      toast.error('Please enter a valid approved amount greater than 0');
      return false;
    }
    if (appAmt > claim.amount) {
      toast.error(`Approved amount (₹${appAmt}) cannot exceed claimed amount (₹${claim.amount}).`);
      return false;
    }
    if (appAmt < claim.amount && (!adminRemarks || !adminRemarks.trim())) {
      toast.error('Admin remarks are mandatory when the approved amount is less than the claimed amount.');
      return false;
    }

    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const nowFormatted = new Date().toISOString().replace('T', ' ').substring(0, 16);

    setExpenses((prev) =>
      prev.map((e) =>
        e.id === claimId
          ? {
              ...e,
              status: 'Approved',
              approvedAmount: appAmt,
              adminRemarks: adminRemarks || 'Approved by Operations Admin',
              approvalDate: todayStr,
              statusHistory: [
                ...(e.statusHistory || []),
                {
                  status: 'Approved',
                  by: 'Admin Ops',
                  at: nowFormatted,
                  remark: adminRemarks || 'Approved by Operations Admin'
                }
              ]
            }
          : e
      )
    );

    // Notify Driver
    if (claim.source === 'Driver Claim') {
      pushDriverNotification(
        `Expense Approved – ${claim.id}`,
        `Your expense claim of ₹${claim.amount} for ${claim.category} was approved for ₹${appAmt}. ${adminRemarks ? 'Remarks: ' + adminRemarks : ''}`,
        { bookingId: claim.bookingId, actionUrl: '/driver/expenses', type: 'expense' }
      );
    }

    if (financeService?.updateExpenseStatus) {
      financeService.updateExpenseStatus(claimId, 'Approved').catch(() => {});
    }

    toast.success(`Expense claim #${claimId} approved for ₹${appAmt}`);
    return true;
  }, [expenses, pushDriverNotification, toast]);

  const rejectExpenseClaim = useCallback((claimId, rejectionReason) => {
    const claim = expenses.find((e) => e.id === claimId);
    if (!claim) {
      toast.error('Expense claim not found');
      return false;
    }

    if (claim.status !== 'Pending Approval') {
      toast.warning(`Claim cannot be rejected because current status is "${claim.status}".`);
      return false;
    }

    if (!rejectionReason || !rejectionReason.trim()) {
      toast.error('A rejection reason is mandatory when declining an expense claim.');
      return false;
    }

    const reason = rejectionReason.trim();
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const nowFormatted = new Date().toISOString().replace('T', ' ').substring(0, 16);

    setExpenses((prev) =>
      prev.map((e) =>
        e.id === claimId
          ? {
              ...e,
              status: 'Rejected',
              rejectionReason: reason,
              adminRemarks: reason,
              statusHistory: [
                ...(e.statusHistory || []),
                {
                  status: 'Rejected',
                  by: 'Admin Ops',
                  at: nowFormatted,
                  remark: reason
                }
              ],
              history: [
                ...(e.history || []),
                {
                  status: 'Rejected',
                  amount: e.amount,
                  reason,
                  date: todayStr
                }
              ]
            }
          : e
      )
    );

    if (claim.source === 'Driver Claim') {
      pushDriverNotification(
        `Expense Rejected – ${claim.id}`,
        `Your claim of ₹${claim.amount} for ${claim.category} was rejected. Reason: ${reason}. You may resubmit with corrections.`,
        { bookingId: claim.bookingId, actionUrl: '/driver/expenses', type: 'expense' }
      );
    }

    if (financeService?.updateExpenseStatus) {
      financeService.updateExpenseStatus(claimId, 'Rejected').catch(() => {});
    }

    toast.info(`Expense claim #${claimId} marked as Rejected.`);
    return true;
  }, [expenses, pushDriverNotification, toast]);

  const markExpensePaid = useCallback((claimId, paymentRef, paymentMethod = 'Bank Transfer', paymentDate = '') => {
    const claim = expenses.find((e) => e.id === claimId);
    if (!claim) {
      toast.error('Expense claim not found');
      return false;
    }

    if (claim.status !== 'Approved') {
      toast.error('Only approved expenses can be transitioned to Paid status.');
      return false;
    }

    if (!paymentRef || !paymentRef.trim()) {
      toast.error('Payment reference is required to mark expense as paid.');
      return false;
    }

    const pDate = paymentDate || new Date().toISOString().substring(0, 10);
    const ref = paymentRef.trim();
    const method = paymentMethod || 'Bank Transfer';
    const nowFormatted = new Date().toISOString().replace('T', ' ').substring(0, 16);

    setExpenses((prev) =>
      prev.map((e) =>
        e.id === claimId
          ? {
              ...e,
              status: 'Paid',
              paymentReference: ref,
              paymentMethod: method,
              paymentDate: pDate,
              statusHistory: [
                ...(e.statusHistory || []),
                {
                  status: 'Paid',
                  by: 'Finance Admin',
                  at: nowFormatted,
                  remark: `Paid via ${method} (Ref: ${ref})`
                }
              ]
            }
          : e
      )
    );

    if (claim.source === 'Driver Claim') {
      pushDriverNotification(
        `Expense Payment Settled – ${claim.id}`,
        `Payment of ₹${claim.approvedAmount || claim.amount} disbursed to your account via ${ref}.`,
        { bookingId: claim.bookingId, actionUrl: '/driver/expenses', type: 'expense' }
      );
    }

    if (financeService?.updateExpenseStatus) {
      financeService.updateExpenseStatus(claimId, 'Paid').catch(() => {});
    }

    toast.success(`Expense #${claimId} marked as Paid!`);
    return true;
  }, [expenses, pushDriverNotification, toast]);

  const resubmitExpenseClaim = useCallback((claimId, updatedData, driverId = null) => {
    const claim = expenses.find((e) => e.id === claimId);
    if (!claim) {
      toast.error('Expense claim not found');
      return false;
    }

    if (claim.status !== 'Rejected') {
      toast.error('Only rejected expense claims can be resubmitted.');
      return false;
    }

    if (driverId && claim.driverId && driverId !== claim.driverId) {
      toast.error('Only the driver who submitted this claim may resubmit it.');
      return false;
    }

    const newAmt = parseFloat(updatedData.amount) || claim.amount;
    const nowFormatted = new Date().toISOString().replace('T', ' ').substring(0, 16);

    setExpenses((prev) =>
      prev.map((e) =>
        e.id === claimId
          ? {
              ...e,
              ...updatedData,
              amount: newAmt,
              approvedAmount: null,
              status: 'Pending Approval',
              rejectionReason: '',
              submittedAt: nowFormatted,
              statusHistory: [
                ...(e.statusHistory || []),
                {
                  status: 'Pending Approval (Resubmitted)',
                  by: claim.driverName,
                  at: nowFormatted,
                  remark: `Resubmitted for ₹${newAmt}`
                }
              ],
              history: [
                ...(e.history || []),
                {
                  status: 'Resubmitted',
                  amount: newAmt,
                  date: new Date().toISOString().substring(0, 10)
                }
              ]
            }
          : e
      )
    );

    pushAdminNotification(
      `Expense Claim Resubmitted – ${claimId}`,
      `Driver ${claim.driverName} corrected and resubmitted claim #${claimId} for ₹${newAmt}.`,
      { bookingId: claim.bookingId, driverName: claim.driverName, type: 'expense', actionUrl: '/admin/expenses' }
    );

    toast.success(`Expense claim #${claimId} resubmitted for Admin review!`);
    return true;
  }, [expenses, pushAdminNotification, toast]);

  const removeExpenseClaim = useCallback((claimId) => {
    const claim = expenses.find((e) => e.id === claimId);
    if (!claim) return false;

    if (['Approved', 'Paid'].includes(claim.status)) {
      toast.error(`Approved and Paid expenses cannot be deleted to preserve statutory audit compliance.`);
      return false;
    }

    setExpenses((prev) => prev.filter((e) => e.id !== claimId));

    pushAdminNotification(
      `Expense Claim Dismissed – ${claimId}`,
      `Dismissed ${claim.status} claim #${claimId} (₹${claim.amount} for ${claim.category}).`,
      { bookingId: claim.bookingId, type: 'expense', actionUrl: '/admin/expenses' }
    );

    toast.success(`Expense claim #${claimId} removed.`);
    return true;
  }, [expenses, pushAdminNotification, toast]);

  // --- 9. CANCELLATION WORKFLOW ---
  const cancelBooking = useCallback(async (bookingId, cancelReason = 'Cancelled by Customer/Admin') => {
    const rawId = String(bookingId || '').trim();
    const altId = rawId.startsWith('BK-')
      ? rawId.replace('BK-', 'MAK-')
      : rawId.startsWith('MAK-')
      ? rawId.replace('MAK-', 'BK-')
      : rawId;

    let booking = bookings.find(
      (b) => b.id === rawId || b.bookingNumber === rawId || b.refId === rawId || b._id === rawId ||
             b.id === altId || b.bookingNumber === altId || b.refId === altId || b._id === altId
    );

    // If not found in local state (e.g. direct URL visit or refreshed page), cancel directly via backend API
    if (!booking) {
      if (bookingService?.cancel) {
        try {
          const res = await bookingService.cancel(rawId, cancelReason);
          if (res?.data) {
            setBookings((prev) => [res.data, ...(prev || []).filter((x) => x.id !== res.data.id && x.bookingNumber !== res.data.bookingNumber)]);
          }
          toast.warning(`Booking #${rawId} cancelled successfully.`);
          return true;
        } catch (err) {
          console.error('Remote cancellation failed:', err);
          toast.error(err?.response?.data?.message || 'Booking not found');
          return false;
        }
      }
      toast.error('Booking not found');
      return false;
    }

    if (['On Trip', 'Completed'].includes(booking.bookingStatus) || ['Trip Completed', 'Completed'].includes(booking.tripStatus)) {
      toast.error(`Cannot cancel booking: Trip is already ${booking.bookingStatus || booking.tripStatus}.`);
      return false;
    }

    const nowFormatted = new Date().toISOString().replace('T', ' ').substring(0, 16);
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const advPaid = parseFloat(booking.advancePaid) || 0;

    // 1. Cancel active assignment if exists
    setAssignments((prev) =>
      prev.map((a) =>
        (a.bookingId === booking.id || a.bookingId === booking.bookingNumber || a.bookingNumber === booking.bookingNumber) &&
        ['Assigned', 'Accepted'].includes(a.status)
          ? { ...a, status: 'Cancelled', cancelReason, cancelledAt: nowFormatted }
          : a
      )
    );

    // 2. Release driver
    const dId = booking.driverId || booking.assignedDriver?.id;
    if (dId) {
      setDrivers((prev) =>
        prev.map((d) => (d.id === dId || d.driverId === dId ? { ...d, dutyStatus: 'Available' } : d))
      );
      pushDriverNotification(
        `Assignment Cancelled – Booking ${booking.bookingNumber || booking.id}`,
        `Booking ${booking.bookingNumber || booking.id} has been cancelled. Reason: ${cancelReason}. Your roster is released.`,
        { bookingId: booking.id, type: 'assignment' }
      );
    }

    // 3. Release vehicle
    const vehId = booking.vehicleId || booking.assignedVehicle?.id || booking.assignedVehicle?.regNo;
    if (vehId) {
      setVehicles((prev) =>
        prev.map((v) => (v.id === vehId || v.regNo === vehId ? { ...v, status: 'Available' } : v))
      );
    }

    // 4. Update booking
    setBookings((prev) =>
      prev.map((b) => {
        const isMatch = b.id === booking.id || b.bookingNumber === booking.bookingNumber || b.refId === booking.refId ||
                        b.id === rawId || b.bookingNumber === rawId || b.refId === rawId ||
                        b.id === altId || b.bookingNumber === altId || b.refId === altId;
        if (isMatch) {
          const updatedTimeline = [
            ...(b.assignmentTimeline || b.history || []),
            {
              id: generateId('TL', { useYear: false }),
              timestamp: nowTime,
              event: `Booking Cancelled: ${cancelReason}`,
              actor: 'Admin',
              status: 'Cancelled'
            }
          ];
          return {
            ...b,
            bookingStatus: 'Cancelled',
            status: 'Cancelled',
            tripStatus: 'Cancelled',
            driverAssignmentStatus: 'Unassigned',
            cancelReason,
            cancelledAt: nowFormatted,
            refundDue: advPaid,
            refundStatus: advPaid > 0 ? 'Refund Due' : 'None',
            assignmentTimeline: updatedTimeline,
            history: updatedTimeline
          };
        }
        return b;
      })
    );

    // Persist cancellation to MongoDB Atlas
    const syncCancelId = booking.refId || booking.bookingNumber || booking.id || booking._id;
    if (syncCancelId && bookingService?.cancel) {
      try {
        await bookingService.cancel(syncCancelId, cancelReason);
      } catch (err) {
        if (bookingService?.updateStatus) {
          try {
            await bookingService.updateStatus(syncCancelId, 'Cancelled', { cancelReason, tripStatus: 'Cancelled' });
          } catch {}
        }
      }
    }

    // Notify Admin
    const cancelTime = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
    const cancelDate = formatDateDMY(new Date());
    pushAdminNotification(
      `Booking Cancelled – ${booking.bookingNumber || booking.id}`,
      `Booking cancelled on ${cancelDate} at ${cancelTime}. Advance paid: ₹${advPaid} ${advPaid > 0 ? '(Refund Due to customer)' : ''}. Reason: ${cancelReason}`,
      { bookingId: booking.id, type: 'booking', actionUrl: `/admin/bookings/${booking.id}`, timestamp: `${cancelDate}, ${cancelTime}`, time: `${cancelDate}, ${cancelTime}` }
    );

    toast.warning(`Booking #${booking.bookingNumber || booking.id} cancelled. ${advPaid > 0 ? '₹' + advPaid + ' marked as Refund Due.' : ''}`);
    return true;
  }, [bookings, pushAdminNotification, pushDriverNotification, toast]);

  // --- 10. DEDICATED ENTITY CRUD HELPERS (For AdminDataContext) ---
  const addBooking = useCallback((bData) => {
    return createCustomerBooking(bData);
  }, [createCustomerBooking]);

  const updateBooking = useCallback((id, updatedFields) => {
    const booking = bookings.find((b) => b.id === id || b.bookingNumber === id || b.refId === id);
    setBookings((prev) =>
      prev.map((b) => (b.id === id || b.bookingNumber === id || b.refId === id ? { ...b, ...updatedFields } : b))
    );

    // Sync vehicle & driver status if starting or completing trip
    if (updatedFields.bookingStatus === 'On Trip' || updatedFields.tripStatus === 'In Progress') {
      const bVehKey = String(booking?.vehicleId || booking?.assignedVehicle?.id || booking?.assignedVehicle?.regNo || booking?.assignedVehicle?.numberPlate || '').toUpperCase().replace(/[\s-]+/g, '');
      if (bVehKey) {
        setVehicles((prev) =>
          prev.map((v) => {
            const vId = String(v.id || '').toUpperCase().replace(/[\s-]+/g, '');
            const vReg = String(v.regNo || v.numberPlate || '').toUpperCase().replace(/[\s-]+/g, '');
            if (vId === bVehKey || vReg === bVehKey) {
              return { ...v, status: 'On Trip' };
            }
            return v;
          })
        );
      }
      if (booking?.driverId) {
        setDrivers((prev) =>
          prev.map((d) => (d.id === booking.driverId ? { ...d, dutyStatus: 'On Trip' } : d))
        );
      }
    } else if (updatedFields.bookingStatus === 'Completed' || updatedFields.tripStatus === 'Completed') {
      const bVehKey = String(booking?.vehicleId || booking?.assignedVehicle?.id || booking?.assignedVehicle?.regNo || booking?.assignedVehicle?.numberPlate || '').toUpperCase().replace(/[\s-]+/g, '');
      if (bVehKey) {
        setVehicles((prev) =>
          prev.map((v) => {
            const vId = String(v.id || '').toUpperCase().replace(/[\s-]+/g, '');
            const vReg = String(v.regNo || v.numberPlate || '').toUpperCase().replace(/[\s-]+/g, '');
            if (vId === bVehKey || vReg === bVehKey) {
              return { ...v, status: 'Available' };
            }
            return v;
          })
        );
      }
      if (booking?.driverId) {
        setDrivers((prev) =>
          prev.map((d) => (d.id === booking.driverId ? { ...d, dutyStatus: 'Available' } : d))
        );
      }
    }

    if (bookingService?.update) {
      bookingService.update(id, updatedFields).catch(() => {});
    }
    toast.success(`Booking #${id} updated successfully!`);
  }, [bookings, toast]);

  const markBookingCompleted = useCallback((id, metadata = {}) => {
    const booking = bookings.find((b) => b.id === id || b.bookingNumber === id);
    if (!booking) {
      toast.error('Booking not found');
      return false;
    }

    if (booking.bookingStatus === 'Completed') {
      toast.info(`Booking #${booking.bookingNumber || booking.id} is already completed.`);
      return true;
    }

    const nowFormatted = new Date().toISOString().replace('T', ' ').substring(0, 16);
    const nowIso = new Date().toISOString();
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    const startOdo = booking.startOdometer || 42000;
    const endOdo = metadata.endOdometer ? Number(metadata.endOdometer) : startOdo + 150;
    const distanceTravelled = endOdo - startOdo;
    const remarks = metadata.remarks || metadata.completionRemarks || 'Trip concluded & marked completed by Operations Admin';

    const totalAmt = booking.totalAmount || 0;
    const advPaid = booking.advancePaid || 0;
    const balAmt = Math.max(0, totalAmt - advPaid);

    const updatedTimeline = [
      ...(booking.assignmentTimeline || booking.history || []),
      {
        id: generateId('TL', { useYear: false }),
        timestamp: nowTime,
        event: `Trip Marked Completed by Operations Admin (${remarks})`,
        actor: 'Operations Admin',
        status: 'Completed'
      }
    ];

    // 1. Update Booking
    setBookings((prev) =>
      prev.map((b) => {
        if (b.id === booking.id) {
          return {
            ...b,
            bookingStatus: 'Completed',
            tripStatus: 'Completed',
            completedAt: nowIso,
            tripCompletedAt: nowFormatted,
            endOdometer: endOdo,
            distanceTravelled,
            balanceAmount: balAmt,
            tripRemarks: remarks,
            tripDuration: metadata.duration || 'Completed',
            assignmentTimeline: updatedTimeline,
            history: updatedTimeline
          };
        }
        return b;
      })
    );

    // Persist completion to MongoDB Atlas
    const syncCompId = booking.refId || booking.bookingNumber || booking.id || booking._id;
    if (syncCompId && bookingService?.updateStatus) {
      bookingService.updateStatus(syncCompId, 'Completed', {
        tripStatus: 'Completed',
        tripCompletedAt: nowFormatted,
        completedAt: nowIso,
        endOdometer: endOdo,
        distanceTravelled,
        balanceAmount: balAmt,
        tripRemarks: remarks
      }).catch(() => {});
    }

    // 2. Free Driver if assigned
    if (booking.driverId) {
      setDrivers((prev) =>
        prev.map((d) => {
          if (d.id === booking.driverId) {
            const otherActive = bookings.some((b) => b.id !== booking.id && b.driverId === d.id && b.tripStatus === 'In Progress');
            return {
              ...d,
              totalTripsCompleted: (d.totalTripsCompleted || 0) + 1,
              tripsCompleted: (d.tripsCompleted || 0) + 1,
              dutyStatus: otherActive ? 'On Trip' : 'Available'
            };
          }
          return d;
        })
      );
    }

    // 3. Free Vehicle if assigned
    const bVehKey = String(booking.vehicleId || booking.assignedVehicle?.id || booking.assignedVehicle?.regNo || booking.assignedVehicle?.numberPlate || '').toUpperCase().replace(/[\s-]+/g, '');
    setVehicles((prev) =>
      prev.map((v) => {
        const vId = String(v.id || '').toUpperCase().replace(/[\s-]+/g, '');
        const vReg = String(v.regNo || v.numberPlate || '').toUpperCase().replace(/[\s-]+/g, '');
        const isMatch = (bVehKey && (vId === bVehKey || vReg === bVehKey)) || (booking.vehicleName && (v.name === booking.vehicleName || v.model === booking.vehicleName));
        if (isMatch) {
          const otherActive = bookings.some((b) => b.id !== booking.id && (b.vehicleId === v.id || b.assignedVehicle?.id === v.id || String(b.assignedVehicle?.regNo || '').toUpperCase().replace(/[\s-]+/g, '') === vReg) && ['On Trip', 'Confirmed'].includes(b.bookingStatus));
          return {
            ...v,
            odometerKm: endOdo,
            currentKm: endOdo,
            tripHistoryCount: (v.tripHistoryCount || 0) + 1,
            status: otherActive ? v.status : 'Available'
          };
        }
        return v;
      })
    );

    // 4. Generate Invoice
    const invoiceNum = booking.invoiceNumber || generateId('INV', { useYear: true });
    const dueDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().substring(0, 10);
    const newInvoice = {
      id: generateId('INV', { useYear: true }),
      invoiceNumber: invoiceNum,
      bookingId: booking.id,
      bookingNumber: booking.bookingNumber || booking.id,
      customerName: booking.customerName,
      customerPhone: booking.customerPhone,
      customerEmail: booking.customerEmail || '',
      totalAmount: totalAmt,
      advancePaid: advPaid,
      balanceDue: balAmt,
      status: balAmt === 0 ? 'Paid' : 'Partially Paid',
      issueDate: todayStr,
      dueDate,
      items: [
        {
          id: 'ITEM-1',
          description: `${booking.bookingCategory} – ${booking.pickupLocation} to ${booking.destination} (${distanceTravelled} km)`,
          amount: totalAmt
        }
      ]
    };
    setInvoices((prev) => [newInvoice, ...prev.filter((i) => i.bookingId !== booking.id)]);

    // Persist Invoice to MongoDB Atlas via financeService
    if (financeService?.createInvoice) {
      financeService.createInvoice({
        bookingRef: booking.bookingNumber || booking.id,
        customerName: booking.customerName,
        customerPhone: booking.customerPhone,
        customerEmail: booking.customerEmail || '',
        amount: totalAmt,
        amountPaid: advPaid,
        invoiceDate: todayStr,
        dueDate,
        lineItems: newInvoice.items
      }).catch((err) => console.warn('Invoice Atlas persistence note:', err.message));
    }

    // 4.5. Generate Vendor Payout & Driver Compensation Expenses
    const completedExpenses = generateCompletedBookingExpenses(booking, totalAmt, todayStr);
    if (completedExpenses.length > 0) {
      setExpenses((prev) => {
        const existingIds = new Set(prev.map((e) => e.id));
        const toAdd = completedExpenses.filter((e) => !existingIds.has(e.id));
        return toAdd.length > 0 ? [...toAdd, ...prev] : prev;
      });

      // Persist Vendor Payout & Driver Compensation to MongoDB Atlas via financeService
      if (financeService?.createExpense) {
        completedExpenses.forEach((exp) => {
          financeService.createExpense({
            category: exp.category,
            amount: exp.amount,
            tripId: exp.tripId || `TRP-${booking.id}`,
            bookingRef: booking.bookingNumber || booking.id,
            driverId: exp.driverId || null,
            driverName: exp.payee || null,
            date: todayStr,
            status: 'Paid',
            notes: exp.description,
            paymentMode: exp.paymentMethod || 'Bank Transfer'
          }).catch((err) => console.warn('Completed expense Atlas persistence note:', err.message));
        });
      }
    }

    // 5. Notify Admin (Push Notification)
    pushAdminNotification(
      `Trip Completed – ${booking.bookingNumber || booking.id}`,
      `Booking ${booking.bookingNumber || booking.id} for ${booking.customerName} has been marked Completed. Vehicle & driver released. Moved to completed ledger.`,
      { bookingId: booking.id, type: 'trip', actionUrl: `/admin/bookings/${booking.id}` }
    );

    // 6. Pop message (toast notification to user/admin)
    toast.success(`🎉 Booking #${booking.bookingNumber || booking.id} marked as Completed! Trip settlement finalized & moved down to completed ledger.`);
    return true;
  }, [bookings, setBookings, setDrivers, setVehicles, setInvoices, pushAdminNotification, toast]);

  const assignVehicle = useCallback((bookingId, vehicleId, vehicleName = '') => {
    const booking = bookings.find((b) => b.id === bookingId);
    if (!booking) {
      toast.error('Booking not found');
      return false;
    }
    const veh = vehicles.find((v) => v.id === vehicleId);
    if (!veh) {
      toast.error('Vehicle not found in fleet');
      return false;
    }

    const check = checkVehicleAvailability(veh.id, booking.journeyDate, booking.returnDate, vehicles, bookings, booking.id);
    if (!check.available) {
      toast.error(check.reason);
      return false;
    }

    const vName = vehicleName || `${veh.brand || ''} ${veh.model || veh.name} (${veh.regNo})`.trim();

    setBookings((prev) =>
      prev.map((b) => {
        if (b.id === bookingId) {
          const updatedTimeline = [
            ...(b.assignmentTimeline || b.history || []),
            {
              id: generateId('TL', { useYear: false }),
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              event: `Vehicle assigned: ${vName}`,
              actor: 'Dispatcher',
              status: 'Vehicle Assigned'
            }
          ];
          return {
            ...b,
            vehicleId: veh.id,
            vehicleName: vName,
            assignedVehicle: {
              id: veh.id,
              brand: veh.brand,
              model: veh.model,
              name: veh.model || veh.name,
              regNo: veh.regNo,
              category: veh.category,
              seating: veh.seating,
              fuelType: veh.fuelType,
              status: 'Reserved',
              ratePerKm: veh.ratePerKm,
              driverAllowance: veh.driverAllowance,
              image: veh.image
            },
            assignmentTimeline: updatedTimeline,
            history: updatedTimeline
          };
        }
        return b;
      })
    );

    toast.success(`Vehicle ${veh.regNo} assigned to booking #${bookingId}`);
    return true;
  }, [bookings, vehicles, toast]);

  // Vehicle Fleet CRUD
  const addVehicle = useCallback((veh) => {
    const vehicleId = veh.id || generateId('VEH', { useYear: false });
    const isVendor = veh.ownership === 'Vendor Attached' || veh.ownership === 'Vendor Owned' || Boolean(veh.vendorId);
    const newVehicle = {
      ...veh,
      id: vehicleId,
      name: veh.name || `${veh.brand || ''} ${veh.model || ''}`.trim() || veh.regNo,
      status: veh.status || 'Available',
      ownership: isVendor ? 'Vendor Attached' : (veh.ownership || 'MAK Owned'),
      tripHistoryCount: 0,
      maintenanceHistory: []
    };
    setVehicles((prev) => {
      const exists = prev.some((v) => v.id === vehicleId || (v.regNo && v.regNo.toUpperCase() === (veh.regNo || '').toUpperCase()));
      if (exists) {
        return prev.map((v) => (v.id === vehicleId || (v.regNo && v.regNo.toUpperCase() === (veh.regNo || '').toUpperCase()) ? { ...v, ...newVehicle } : v));
      }
      return [newVehicle, ...prev];
    });

    // Write to backend API
    if (vehicleService?.create) {
      vehicleService
        .create(newVehicle)
        .then((res) => {
          if (res?.data) {
            setVehicles((prev) =>
              prev.map((v) => (v.id === vehicleId || (v.regNo && v.regNo.toUpperCase() === (veh.regNo || '').toUpperCase()) ? { ...v, ...res.data } : v))
            );
          }
        })
        .catch((err) => {
          console.warn('Backend vehicle registration sync deferred:', err);
        });
    }

    if (pushAdminNotification && isVendor) {
      pushAdminNotification(
        `New Vendor Vehicle: ${veh.regNo}`,
        `${veh.vendorName || 'Vendor Attached Partner'} registered ${veh.brand || ''} ${veh.model || ''} (${veh.regNo}) into the platform fleet.`,
        { type: 'fleet', vehicleId }
      );
    }
    toast.success(`Vehicle ${veh.regNo} added to fleet!`);
    return newVehicle;
  }, [pushAdminNotification, toast]);

  const updateVehicle = useCallback((id, updatedFields) => {
    setVehicles((prev) =>
      prev.map((v) => (v.id === id || v._id === id || v.regNo === id ? { ...v, ...updatedFields } : v))
    );
    if (vehicleService?.update) {
      vehicleService.update(id, updatedFields).catch((err) => console.warn('Vehicle update backend sync deferred:', err));
    }
    toast.success('Vehicle details updated successfully!');
  }, [toast]);

  const updateVehicleStatus = useCallback((id, status) => {
    setVehicles((prev) =>
      prev.map((v) => (v.id === id ? { ...v, status } : v))
    );
    toast.info(`Vehicle status updated to ${status}`);
  }, [toast]);

  const deleteVehicle = useCallback(async (id, options = {}) => {
    try {
      // 1. Call backend API FIRST - verify MongoDB deletion before changing state
      if (vehicleService?.delete) {
        try {
          await vehicleService.delete(id, options);
        } catch (apiErr) {
          // If vehicle is already not found (404) in MongoDB, it's already removed
          if (apiErr.status === 404) {
            console.log('Vehicle already removed from database');
          } else {
            throw apiErr;
          }
        }
      }

      // 2. Only after backend confirms deletion, remove from state & local storage
      setVehicles((prev) => prev.filter((v) => v.id !== id && v._id !== id && v.regNo !== id));

      try {
        const storedVendor = loadStoredJson('mak_vendor_vehicles_v7', []);
        const cleanVendor = storedVendor.filter((v) => v.id !== id && v._id !== id && v.regNo !== id);
        saveStoredJson('mak_vendor_vehicles_v7', cleanVendor);
      } catch (_) {}

      // 3. Re-fetch fresh vehicle list from MongoDB Atlas
      if (vehicleService?.getAll) {
        const fresh = await vehicleService.getAll().catch(() => null);
        if (fresh?.data && Array.isArray(fresh.data)) {
          setVehicles(fresh.data.filter((v) => v.isDeleted !== true && v.status !== 'Inactive'));
        }
      }

      toast.success(`Vehicle removed from fleet successfully`);
      return true;
    } catch (err) {
      console.error('Error removing vehicle from database:', err);
      const isNetworkErr = err.message?.includes('Failed to fetch') || err.message?.includes('Network connection failed');
      if (isNetworkErr) {
        toast.error('Cannot connect to backend API server. Please ensure the backend is running on http://localhost:5000.');
      } else {
        toast.error(err?.data?.message || err?.message || 'Failed to remove vehicle from database.');
      }
      return false;
    }
  }, [toast]);

  // Driver Fleet CRUD
  const addDriver = useCallback(async (drv) => {
    const newId = generateId('DRV', { useYear: false });
    const payload = {
      ...drv,
      id: newId,
      driverBadgeId: drv.driverBadgeId || newId,
      badgeNumber: drv.badgeNumber || newId,
      driverCode: `MAK-DRV-${newId.replace(/\D/g, '')}`,
      approvalStatus: drv.approvalStatus || 'Approved',
      status: drv.status || 'Active',
      dutyStatus: drv.dutyStatus || 'Available',
      rating: 5.0,
      tripsCompleted: 0,
      totalTripsCompleted: 0,
      documents: [{ name: 'Commercial License', status: 'Submitted', expiry: drv.licenseExpiry }]
    };

    setDrivers((prev) => [payload, ...prev]);

    try {
      if (driverService?.create) {
        const res = await driverService.create(payload);
        if (res?.data) {
          const saved = { ...payload, ...res.data, id: res.data.id || res.data.driverBadgeId || payload.id };
          setDrivers((prev) => prev.map((d) => (d.id === payload.id ? saved : d)));
          toast.success(`Driver ${drv.name || drv.fullName} enrolled successfully in database!`);
          return saved;
        }
      }
    } catch (err) {
      console.warn('Driver creation backend sync error:', err.message);
    }

    toast.success(`Driver ${drv.name} enrolled successfully!`);
    return payload;
  }, [toast]);

  const updateDriver = useCallback((id, updatedFields) => {
    setDrivers((prev) => {
      const updated = prev.map((d) =>
        d.id === id || d.driverBadgeId === id || d.driverId === id || d._id === id || (d.id === 'DRV-001' && id === 'DRV-001')
          ? { ...d, ...updatedFields }
          : d
      );
      saveStoredJson(STORAGE_KEYS.DRIVERS, updated);
      return updated;
    });

    if (driverService?.update) {
      driverService.update(id, updatedFields).catch(() => {});
    }
  }, []);

  const updateDriverStatus = useCallback((id, status) => {
    const dutyStatus = status === 'Active' ? 'Available' : 'Unavailable';
    setDrivers((prev) =>
      prev.map((d) => (d.id === id ? { ...d, status, dutyStatus } : d))
    );
    if (driverService?.update) {
      driverService.update(id, { status, dutyStatus }).catch(() => {});
    }
    toast.info(`Driver status changed to ${status}`);
  }, [toast]);

  const deleteDriver = useCallback(async (id) => {
    setDrivers((prev) => prev.filter((d) => d.id !== id));
    if (driverService?.delete) {
      try {
        await driverService.delete(id);
      } catch (err) {
        console.warn('Driver delete backend sync error:', err.message);
      }
    }
    toast.info(`Driver record removed`);
  }, [toast]);

  // --- 11. FINANCIAL METRICS (Strict Formulations from Prompt) ---
  const financialMetrics = useMemo(() => {
    // 1. Recognised Revenue: sum of totalAmount for bookings with bookingStatus 'Completed' ONLY!
    const recognisedRevenue = bookings
      .filter((b) => b.bookingStatus === 'Completed')
      .reduce((sum, b) => sum + (parseFloat(b.totalAmount) || 0), 0);

    // 2. Cash Collected: sum of advancePaid on non-cancelled bookings + balance payments made
    const cashCollected = bookings
      .filter((b) => b.bookingStatus !== 'Cancelled')
      .reduce((sum, b) => sum + (parseFloat(b.advancePaid) || 0), 0);

    // 3. Receivables: recognisedRevenue – amounts collected on completed bookings
    const cashOnCompleted = bookings
      .filter((b) => b.bookingStatus === 'Completed')
      .reduce((sum, b) => sum + (parseFloat(b.advancePaid) || 0), 0);
    const receivables = Math.max(0, recognisedRevenue - cashOnCompleted);

    // 4. Refunds Due: amounts paid on Cancelled bookings
    const refundsDue = bookings
      .filter((b) => b.bookingStatus === 'Cancelled')
      .reduce((sum, b) => sum + (parseFloat(b.advancePaid) || 0), 0);

    // 5. Approved Trip Expenses: trip claims with bookingId that are Approved or Paid
    const approvedTripExpenses = expenses
      .filter((e) => e.bookingId && (e.status === 'Approved' || e.status === 'Paid'))
      .reduce((sum, e) => sum + (parseFloat(e.approvedAmount || e.amount) || 0), 0);

    // 6. Approved Office Expenses: admin entries without bookingId that are Approved or Paid
    const approvedOfficeExpenses = expenses
      .filter((e) => !e.bookingId && (e.status === 'Approved' || e.status === 'Paid'))
      .reduce((sum, e) => sum + (parseFloat(e.approvedAmount || e.amount) || 0), 0);

    // 7. Total Approved Expenses
    const totalApprovedTripExpenses = approvedTripExpenses;
    const totalOperatingExpenses = approvedTripExpenses + approvedOfficeExpenses;

    // 8. Pending Claims Count & Amount
    const pendingClaimsCount = expenses.filter((e) => e.status === 'Pending Approval').length;
    const totalPendingTripExpenses = expenses
      .filter((e) => e.status === 'Pending Approval')
      .reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);

    // 9. Paid Expenses
    const totalPaidTripExpenses = expenses
      .filter((e) => e.status === 'Paid')
      .reduce((sum, e) => sum + (parseFloat(e.approvedAmount || e.amount) || 0), 0);

    // 10. Outstanding Expense Payments
    const outstandingExpensePayments = Math.max(0, totalOperatingExpenses - totalPaidTripExpenses);

    // 11. Overheads come ONLY from real recorded expenses. No hardcoded 42500!
    const otherBusinessExpenses = approvedOfficeExpenses;

    // 12. Net Profit = recognisedRevenue – approvedTripExpenses – approvedOfficeExpenses
    const netProfit = recognisedRevenue - totalOperatingExpenses;

    // Legacy compatibility aliases
    const totalBookingRevenue = recognisedRevenue;

    // 13. Detailed Expenses Breakdown
    const vendorPayoutsTotal = expenses
      .filter((e) => e.category === 'Vendor Payout' && (e.status === 'Approved' || e.status === 'Paid'))
      .reduce((sum, e) => sum + (parseFloat(e.approvedAmount || e.amount) || 0), 0);

    const driverSalariesTotal = expenses
      .filter((e) => (e.category === 'Driver Salary' || e.category === 'Driver Allowance') && (e.status === 'Approved' || e.status === 'Paid'))
      .reduce((sum, e) => sum + (parseFloat(e.approvedAmount || e.amount) || 0), 0);

    const operationalTripExpenses = expenses
      .filter((e) => e.category !== 'Vendor Payout' && e.category !== 'Driver Salary' && e.bookingId && (e.status === 'Approved' || e.status === 'Paid'))
      .reduce((sum, e) => sum + (parseFloat(e.approvedAmount || e.amount) || 0), 0);

    // 14. Vendor Payables: completed vendor-booking costs minus vendor payments made
    const vendorExpensesCost = expenses
      .filter((e) => e.category === 'Vendor Payout')
      .reduce((sum, e) => sum + (parseFloat(e.approvedAmount || e.amount) || 0), 0);
    const fallbackVendorCost = bookings
      .filter((b) => b.bookingStatus === 'Completed' && (b.vendorId || b.isVendorVehicle || b.assignedVehicle?.isVendorVehicle || b.assignedVehicle?.vendorId))
      .reduce((sum, b) => {
        const vPay = b.vendorPayableAmount || (b.vendorPayoutPercent ? (Number(b.totalAmount || b.pricing || 0) * Number(b.vendorPayoutPercent) / 100) : 0);
        return sum + (parseFloat(vPay) || 0);
      }, 0);
    const completedVendorCost = Math.max(vendorExpensesCost, fallbackVendorCost);

    const vendorPaymentsMade = payments
      .filter((p) => p.paymentType === 'Vendor Payment' || p.type === 'Vendor Payment' || p.paymentType === 'Vendor Payout')
      .reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
    const vendorPayables = Math.max(0, completedVendorCost - vendorPaymentsMade);

    return {
      recognisedRevenue,
      cashCollected,
      receivables,
      refundsDue,
      approvedTripExpenses,
      approvedOfficeExpenses,
      totalOperatingExpenses,
      totalBookingRevenue,
      totalApprovedTripExpenses,
      totalPendingTripExpenses,
      pendingClaimsCount,
      totalPaidTripExpenses,
      outstandingExpensePayments,
      otherBusinessExpenses,
      netProfit,
      vendorPayables,
      vendorPayoutsTotal,
      driverSalariesTotal,
      operationalTripExpenses
    };
  }, [bookings, expenses, payments]);

  const value = {
    // Backend API Connectivity
    isBackendConnected,

    // Shared State
    bookings,
    drivers,
    vehicles,
    assignments,
    expenses,
    payments,
    invoices,
    adminNotifications,
    driverNotifications,

    // Setters
    setBookings,
    setDrivers,
    setVehicles,
    setAssignments,
    setExpenses,
    setPayments,
    setInvoices,
    setAdminNotifications,

    // Booking & Assignment Operations
    createCustomerBooking,
    addBooking,
    updateBooking,
    cancelBooking,
    markBookingCompleted,
    assignVehicle,
    confirmTripAssignment,
    acceptTripAssignment,
    declineTripAssignment,
    arrivedAtPickup,
    startTrip,
    endTrip,
    addNightStayToTrip,

    // Vehicle Operations
    addVehicle,
    updateVehicle,
    updateVehicleStatus,
    deleteVehicle,

    // Driver Operations
    addDriver,
    updateDriver,
    updateDriverStatus,
    deleteDriver,

    // Expense Operations
    submitExpenseClaim,
    addAdminExpense,
    addExpense: addAdminExpense,
    approveExpenseClaim,
    rejectExpenseClaim,
    markExpensePaid,
    resubmitExpenseClaim,
    removeExpenseClaim,

    // Finance & Payment Operations
    recordBalancePayment,

    // Helpers & Metrics
    financialMetrics,
    getBookingExpenses,
    getBookingPayments,
    getBookingInvoices,
    isDriverAvailable,
    isVehicleAvailable,
    pushAdminNotification,
    pushDriverNotification,
    markAdminNotificationRead,
    markAllAdminNotificationsRead,
    clearAdminNotification,
    markDriverNotificationRead,
    markAllDriverNotificationsRead
  };

  return <TripContext.Provider value={value}>{children}</TripContext.Provider>;
}

export function useTripContext() {
  const ctx = useContext(TripContext);
  if (!ctx) {
    console.warn('useTripContext called outside of TripProvider; returning safe fallback context.');
    return {
      bookings: [],
      drivers: [],
      vehicles: [],
      assignments: [],
      expenses: [],
      payments: [],
      invoices: [],
      adminNotifications: [],
      driverNotifications: [],
      getBookingExpenses: () => [],
      getBookingPayments: () => [],
      getBookingInvoices: () => [],
      isDriverAvailable: () => true,
      isVehicleAvailable: () => true
    };
  }
  return ctx;
}

export const useTrip = useTripContext;
