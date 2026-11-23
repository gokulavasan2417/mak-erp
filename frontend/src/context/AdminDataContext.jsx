// MAK Tours & Travels ERP - Admin Data Context
// Enterprise Administrator State, Operations & Module Data Store
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { initialCustomers } from '../data/customersData';
import { initialVendors } from '../data/vendorsData';
import { initialHotels } from '../data/hotelsData';
import { initialTourPackages } from '../data/tourPackagesData';
import { initialEmployees, initialStaffAttendance, initialStaffLeaveRequests } from '../data/employeesData';
import { initialNotifications } from '../data/notificationsData';
import { initialSettings } from '../data/settingsData';
import { initialDriverApplications } from '../data/driverPortalData';
import { useToast } from './ToastContext';
import { TripContext } from './TripContext';
import { loadStoredJson, saveStoredJson } from '../utils/storage';
import { generateId } from '../utils/idGenerator';
import { tourPackageService, employeeService, attendanceService, vendorService, payrollService, customerService } from '../services';

// Normalize tour package data to ensure startingPrice, priceNumeric, and price are synchronized
export const normalizeTourPackage = (pkg) => {
  if (!pkg) return pkg;
  const numPrice = Number(pkg.startingPrice || pkg.priceNumeric || (typeof pkg.price === 'string' ? pkg.price.replace(/[^\d]/g, '') : pkg.price)) || 0;
  return {
    ...pkg,
    priceNumeric: numPrice,
    startingPrice: numPrice,
    price: pkg.price || (numPrice > 0 ? `₹${numPrice.toLocaleString('en-IN')}` : '₹0'),
    pricingType: pkg.pricingType || 'Per Person',
    days: pkg.days || pkg.daysCount || 1,
    nights: pkg.nights || Math.max(0, (pkg.daysCount || pkg.days || 1) - 1)
  };
};

export const AdminDataContext = createContext();

// Purge legacy mock localStorage keys so they never resurrect old mock items
try {
  [
    'mak_admin_employees_v8',
    'mak_admin_attendance_v8',
    'mak_admin_leaves_v8',
    'mak_admin_vendors_v8',
    'mak_admin_packages_v8',
    'mak_admin_customers_v8',
    'mak_admin_driver_apps_v8',
    'mak_admin_packages_v9_clean'
  ].forEach((k) => localStorage.removeItem(k));
} catch {}

const ADMIN_STORAGE_KEYS = {
  TOUR_PACKAGES: 'mak_admin_packages_v10_atlas',
  APPLICATIONS: 'mak_admin_driver_apps_v10_atlas',
  CUSTOMERS: 'mak_admin_customers_v10_atlas',
  VENDORS: 'mak_admin_vendors_v10_atlas',
  HOTELS: 'mak_admin_hotels_v10_atlas',
  EMPLOYEES: 'mak_admin_employees_v10_atlas',
  ATTENDANCE: 'mak_admin_attendance_v10_atlas',
  LEAVES: 'mak_admin_leaves_v10_atlas',
  PAYROLL: 'mak_admin_payroll_v10_atlas',
  PAYROLL_POLICY: 'mak_admin_payroll_policy_v10_atlas',
  SETTINGS: 'mak_admin_settings_v10_atlas',
  NOTIFICATIONS: 'mak_admin_notifications_v10_atlas'
};

export function AdminDataProvider({ children }) {
  const toast = useToast();
  const tripCtx = useContext(TripContext);

  // SECTION 1.1: If TripContext is missing, fail loudly with a clear error
  if (!tripCtx) {
    throw new Error('AdminDataProvider must be rendered within a TripProvider');
  }

  // Authoritative shared trip and fleet state from TripContext
  const {
    bookings,
    vehicles,
    drivers,
    expenses,
    payments,
    invoices,
    adminNotifications,
    setAdminNotifications,
    markAdminNotificationRead,
    markAllAdminNotificationsRead,
    clearAdminNotification,
    financialMetrics,
    setBookings,
    setVehicles,
    setDrivers,
    setExpenses,
    setPayments,
    setInvoices,
    addBooking: tripAddBooking,
    updateBooking: tripUpdateBooking,
    cancelBooking: tripCancelBooking,
    assignVehicle: tripAssignVehicle,
    confirmTripAssignment,
    acceptTripAssignment,
    declineTripAssignment,
    arrivedAtPickup,
    startTrip,
    endTrip,
    markBookingCompleted: tripMarkCompleted,
    addVehicle: tripAddVehicle,
    updateVehicle: tripUpdateVehicle,
    updateVehicleStatus: tripUpdateVehicleStatus,
    deleteVehicle: tripDeleteVehicle,
    addDriver: tripAddDriver,
    updateDriver: tripUpdateDriver,
    updateDriverStatus: tripUpdateDriverStatus,
    deleteDriver: tripDeleteDriver,
    addAdminExpense,
    approveExpenseClaim,
    rejectExpenseClaim,
    markExpensePaid,
    resubmitExpenseClaim,
    removeExpenseClaim,
    recordBalancePayment,
    isDriverAvailable,
    isVehicleAvailable,
    getBookingExpenses,
    getBookingPayments,
    getBookingInvoices
  } = tripCtx;

  // Persisted Admin-only Entities (SECTION 4.2)
  const [tourPackages, setTourPackages] = useState(() => {
    const stored = loadStoredJson(ADMIN_STORAGE_KEYS.TOUR_PACKAGES, null);
    const baseList = (stored && Array.isArray(stored) && stored.length > 0) ? stored : initialTourPackages;
    return (baseList || []).map(normalizeTourPackage);
  });
  const [customers, setCustomers] = useState(() => loadStoredJson(ADMIN_STORAGE_KEYS.CUSTOMERS, initialCustomers));
  const [vendors, setVendors] = useState(() => {
    const stored = loadStoredJson(ADMIN_STORAGE_KEYS.VENDORS, null);
    if (stored && Array.isArray(stored) && stored.length > 0) return stored;
    return initialVendors;
  });
  const [hotels, setHotels] = useState(() => loadStoredJson(ADMIN_STORAGE_KEYS.HOTELS, initialHotels));
  const [employees, setEmployees] = useState(() => {
    const stored = loadStoredJson(ADMIN_STORAGE_KEYS.EMPLOYEES, null);
    if (stored && Array.isArray(stored) && stored.length > 0) return stored;
    return initialEmployees;
  });
  const [staffAttendance, setStaffAttendance] = useState(() => {
    const stored = loadStoredJson(ADMIN_STORAGE_KEYS.ATTENDANCE, null);
    if (stored && Array.isArray(stored) && stored.length > 0) return stored;
    return initialStaffAttendance;
  });
  const [staffLeaveRequests, setStaffLeaveRequests] = useState(() => loadStoredJson(ADMIN_STORAGE_KEYS.LEAVES, initialStaffLeaveRequests));
  const [settings, setSettings] = useState(() => loadStoredJson(ADMIN_STORAGE_KEYS.SETTINGS, initialSettings));
  const [localNotifications, setLocalNotifications] = useState(() => loadStoredJson(ADMIN_STORAGE_KEYS.NOTIFICATIONS, initialNotifications));

  const [driverApplications, setDriverApplications] = useState(() => {
    return loadStoredJson(ADMIN_STORAGE_KEYS.APPLICATIONS, initialDriverApplications);
  });

  // Dedicated Automatic Attendance-Based Payroll State
  const [payrolls, setPayrolls] = useState(() => loadStoredJson(ADMIN_STORAGE_KEYS.PAYROLL, []));
  const [payrollPolicy, setPayrollPolicy] = useState(() =>
    loadStoredJson(ADMIN_STORAGE_KEYS.PAYROLL_POLICY, {
      payrollWorkingDays: 26,
      calculationMethod: 'Fixed Payroll Working Days',
      weeklyOffDays: ['Sunday'],
      publicHolidays: [
        { date: '2026-11-01', name: 'State Formation Day' },
        { date: '2026-11-14', name: 'Diwali Festival' }
      ],
      salaryRounding: 'Nearest Rupee'
    })
  );
  const [selectedPayrollMonth, setSelectedPayrollMonth] = useState(() => '2026-11');

  // Save changes to localStorage
  useEffect(() => { saveStoredJson(ADMIN_STORAGE_KEYS.TOUR_PACKAGES, tourPackages); }, [tourPackages]);
  useEffect(() => { saveStoredJson(ADMIN_STORAGE_KEYS.CUSTOMERS, customers); }, [customers]);
  useEffect(() => { saveStoredJson(ADMIN_STORAGE_KEYS.VENDORS, vendors); }, [vendors]);
  useEffect(() => { saveStoredJson(ADMIN_STORAGE_KEYS.HOTELS, hotels); }, [hotels]);
  useEffect(() => { saveStoredJson(ADMIN_STORAGE_KEYS.EMPLOYEES, employees); }, [employees]);
  useEffect(() => { saveStoredJson(ADMIN_STORAGE_KEYS.ATTENDANCE, staffAttendance); }, [staffAttendance]);
  useEffect(() => { saveStoredJson(ADMIN_STORAGE_KEYS.LEAVES, staffLeaveRequests); }, [staffLeaveRequests]);
  useEffect(() => { saveStoredJson(ADMIN_STORAGE_KEYS.SETTINGS, settings); }, [settings]);
  useEffect(() => { saveStoredJson(ADMIN_STORAGE_KEYS.NOTIFICATIONS, localNotifications); }, [localNotifications]);
  useEffect(() => { saveStoredJson(ADMIN_STORAGE_KEYS.APPLICATIONS, driverApplications); }, [driverApplications]);
  useEffect(() => { saveStoredJson(ADMIN_STORAGE_KEYS.PAYROLL, payrolls); }, [payrolls]);
  useEffect(() => { saveStoredJson(ADMIN_STORAGE_KEYS.PAYROLL_POLICY, payrollPolicy); }, [payrollPolicy]);

  // Synchronize monthly payroll and policy with backend
  useEffect(() => {
    payrollService
      .getAll({ month: selectedPayrollMonth })
      .then((res) => {
        if (res?.data && Array.isArray(res.data) && res.data.length > 0) {
          setPayrolls(res.data);
        }
      })
      .catch((err) => console.warn('Live payroll sync note:', err.message));

    payrollService
      .getPolicy()
      .then((res) => {
        if (res?.data) {
          setPayrollPolicy(res.data);
        }
      })
      .catch((err) => console.warn('Live payroll policy sync note:', err.message));
  }, [selectedPayrollMonth]);

  // Reflect live database records when backend is connected
  useEffect(() => {
    // 1. Tour Packages from MongoDB Atlas
    tourPackageService
      .getAll()
      .then((res) => {
        if (res?.data && Array.isArray(res.data) && res.data.length > 0) {
          setTourPackages(res.data.map(normalizeTourPackage));
        }
      })
      .catch(() => {});

    // 2. Staff / Employees from MongoDB Atlas
    employeeService
      .getAll()
      .then((res) => {
        if (res?.data && Array.isArray(res.data) && res.data.length > 0) {
          setEmployees(res.data);
        }
      })
      .catch(() => {});

    // 3. Staff Attendance from MongoDB Atlas
    attendanceService
      .getAll()
      .then((res) => {
        if (res?.data && Array.isArray(res.data) && res.data.length > 0) {
          setStaffAttendance(res.data);
        }
      })
      .catch(() => {});

    // 4. Vendors from MongoDB Atlas
    vendorService
      .getAll()
      .then((res) => {
        if (res?.data && Array.isArray(res.data) && res.data.length > 0) {
          setVendors(res.data);
        }
      })
      .catch(() => {});

    // 5. Customers from MongoDB Atlas
    if (customerService?.getAll) {
      customerService
        .getAll()
        .then((res) => {
          if (res?.data && Array.isArray(res.data) && res.data.length > 0) {
            setCustomers(res.data);
          }
        })
        .catch(() => {});
    }
  }, [tripCtx?.isBackendConnected]);

  // --- AUTOMATIC CUSTOMER ENROLLMENT LOGIC ---
  // All users are considered customers even if they booked only one trip (>= 1 booking).
  // Automatically synchronizes and enrolls every client into the Customer CRM ledger.
  useEffect(() => {
    if (!bookings || bookings.length === 0) return;

    const normalizePhoneDigits = (val) => {
      if (!val) return '';
      const digits = String(val).replace(/\D/g, '');
      if (digits.length === 12 && digits.startsWith('91')) return digits.slice(2);
      if (digits.length === 11 && digits.startsWith('0')) return digits.slice(1);
      return digits.length >= 10 ? digits.slice(-10) : digits;
    };

    // Group all bookings by clean 10-digit phone, or fallback to email or customer name
    const customerGroups = new Map();
    bookings.forEach((b) => {
      const rawPhone = b.mobileNumber || b.customerPhone || b.phone;
      const clean = normalizePhoneDigits(rawPhone);
      let groupKey = clean && clean.length >= 10 ? `phone:${clean}` : null;
      if (!groupKey) {
        const rawEmail = (b.customerEmail || b.email || '').trim().toLowerCase();
        if (rawEmail) groupKey = `email:${rawEmail}`;
      }
      if (!groupKey) {
        const rawName = (b.customerName || b.fullName || b.name || '').trim().toLowerCase();
        if (rawName) groupKey = `name:${rawName}`;
      }
      if (!groupKey) return;

      if (!customerGroups.has(groupKey)) {
        customerGroups.set(groupKey, { cleanPhone: clean || '', bookings: [] });
      }
      customerGroups.get(groupKey).bookings.push(b);
    });

    setCustomers((prevCustomers) => {
      const currentList = Array.isArray(prevCustomers) ? [...prevCustomers] : [];

      const existingPhoneMap = new Map();
      const existingEmailMap = new Map();
      const existingNameMap = new Map();

      currentList.forEach((c) => {
        const clean = normalizePhoneDigits(c.phone);
        if (clean && clean.length >= 10) existingPhoneMap.set(clean, c);
        if (c.email && c.email.trim()) existingEmailMap.set(c.email.trim().toLowerCase(), c);
        if (c.name && c.name.trim()) existingNameMap.set(c.name.trim().toLowerCase(), c);
      });

      let hasNewOrUpdated = false;

      // 1. Update existing customer stats for anyone who has bookings (>= 1 trip)
      const updatedList = currentList.map((c) => {
        const clean = normalizePhoneDigits(c.phone);
        const email = (c.email || '').trim().toLowerCase();
        const name = (c.name || '').trim().toLowerCase();

        let groupData = null;
        if (clean && customerGroups.has(`phone:${clean}`)) {
          groupData = customerGroups.get(`phone:${clean}`);
        } else if (email && customerGroups.has(`email:${email}`)) {
          groupData = customerGroups.get(`email:${email}`);
        } else if (name && customerGroups.has(`name:${name}`)) {
          groupData = customerGroups.get(`name:${name}`);
        }

        const matchedBookings = groupData ? groupData.bookings : null;
        if (matchedBookings && matchedBookings.length >= 1) {
          const totalSpent = matchedBookings.reduce(
            (sum, b) => sum + Number(b.totalAmount || b.fareAmount || b.fare || b.pricing || b.totalFare || 0),
            0
          );
          const outstanding = matchedBookings.reduce((sum, b) => {
            const tot = Number(b.totalAmount || b.fareAmount || b.fare || b.pricing || b.totalFare || 0);
            const paid = Number(b.amountPaid ?? b.advancePaid ?? 0);
            const bal = b.balanceAmount !== undefined && b.balanceAmount !== null && !isNaN(Number(b.balanceAmount))
              ? Number(b.balanceAmount)
              : Math.max(0, tot - paid);
            return sum + Math.max(0, bal);
          }, 0);
          if (c.totalBookings !== matchedBookings.length || c.totalSpent !== totalSpent || c.outstandingBalance !== outstanding) {
            hasNewOrUpdated = true;
            return {
              ...c,
              totalBookings: matchedBookings.length,
              totalSpent,
              outstandingBalance: outstanding
            };
          }
        }
        return c;
      });

      // Find highest CUST-xxx number to avoid ID collisions
      let maxIdNum = 0;
      updatedList.forEach((c) => {
        const m = String(c.id || '').match(/CUST-(\d+)/i);
        if (m) {
          const n = parseInt(m[1], 10);
          if (!isNaN(n) && n > maxIdNum) maxIdNum = n;
        }
      });
      if (maxIdNum === 0) maxIdNum = updatedList.length;

      // 2. Auto-enroll any client who booked at least 1 trip and is not yet in the CRM
      customerGroups.forEach(({ cleanPhone, bookings: matchedBookings }) => {
        if (!matchedBookings || matchedBookings.length < 1) return;

        const latestB = matchedBookings[matchedBookings.length - 1];
        const primaryName = (latestB.fullName || latestB.customerName || latestB.name || 'Valued Client').trim();
        const primaryPhone = latestB.mobileNumber || latestB.customerPhone || latestB.phone || cleanPhone;
        const primaryEmail = (latestB.email || latestB.customerEmail || '').trim();
        const clean = normalizePhoneDigits(primaryPhone);

        // Check if already in CRM by phone, email, or exact name
        const exists =
          (clean && clean.length >= 10 && existingPhoneMap.has(clean)) ||
          (primaryEmail && existingEmailMap.has(primaryEmail.toLowerCase())) ||
          (primaryName && existingNameMap.has(primaryName.toLowerCase()));

        if (!exists) {
          maxIdNum += 1;
          const primaryCity = latestB.city || latestB.pickupLocation || 'Chennai';
          const primaryAddress = latestB.fromLocation || latestB.pickupLocation || 'Chennai';
          const isCorp = Boolean(latestB.companyName || latestB.isCorporate || latestB.gstin);
          const totalSpent = matchedBookings.reduce(
            (sum, b) => sum + Number(b.totalAmount || b.fareAmount || b.fare || b.pricing || b.totalFare || 0),
            0
          );
          const outstanding = matchedBookings.reduce((sum, b) => {
            const tot = Number(b.totalAmount || b.fareAmount || b.fare || b.pricing || b.totalFare || 0);
            const paid = Number(b.amountPaid ?? b.advancePaid ?? 0);
            const bal = b.balanceAmount !== undefined && b.balanceAmount !== null && !isNaN(Number(b.balanceAmount))
              ? Number(b.balanceAmount)
              : Math.max(0, tot - paid);
            return sum + Math.max(0, bal);
          }, 0);

          const newCustomer = {
            id: `CUST-${String(maxIdNum).padStart(3, '0')}`,
            name: primaryName,
            phone: primaryPhone,
            email: primaryEmail,
            city: primaryCity,
            address: primaryAddress,
            type: isCorp ? 'Corporate' : 'Individual',
            status: 'Active',
            totalBookings: matchedBookings.length,
            totalSpent,
            outstandingBalance: outstanding,
            rating: 5.0,
            notes: `Client enrolled from booking (${matchedBookings.length} trip${matchedBookings.length > 1 ? 's' : ''}).`,
            createdAt: latestB.createdAt || new Date().toISOString()
          };

          // Mark in maps so duplicate groups are not re-enrolled
          if (clean && clean.length >= 10) existingPhoneMap.set(clean, newCustomer);
          if (primaryEmail) existingEmailMap.set(primaryEmail.toLowerCase(), newCustomer);
          if (primaryName) existingNameMap.set(primaryName.toLowerCase(), newCustomer);

          updatedList.push(newCustomer);
          hasNewOrUpdated = true;

          // Asynchronously persist to MongoDB Atlas if backend is active
          if (customerService?.create) {
            customerService.create(newCustomer).catch(() => {});
          }
        }
      });

      return hasNewOrUpdated ? updatedList : prevCustomers;
    });
  }, [bookings]);

  // Real-time synchronization of employee profiles and avatars from Staff Portal
  useEffect(() => {
    const handleStaffProfileUpdate = (e) => {
      const updatedUser = e?.detail;
      if (!updatedUser) return;

      setEmployees((prev) =>
        prev.map((emp) => {
          const matches =
            (emp.email && updatedUser.email && emp.email.toLowerCase() === updatedUser.email.toLowerCase()) ||
            (emp.employeeCode && updatedUser.employeeCode && emp.employeeCode.toUpperCase() === updatedUser.employeeCode.toUpperCase()) ||
            (emp.id && updatedUser.id && String(emp.id) === String(updatedUser.id)) ||
            (emp.userId && updatedUser._id && String(emp.userId) === String(updatedUser._id));

          if (!matches) return emp;

          return {
            ...emp,
            name: updatedUser.name || updatedUser.fullName || emp.name,
            fullName: updatedUser.fullName || updatedUser.name || emp.fullName,
            avatar: updatedUser.avatar !== undefined ? updatedUser.avatar : emp.avatar,
            phone: updatedUser.phone || updatedUser.mobileNumber || emp.phone,
            address: updatedUser.address !== undefined ? updatedUser.address : emp.address,
            emergencyContact: updatedUser.emergencyContact !== undefined ? updatedUser.emergencyContact : emp.emergencyContact
          };
        })
      );

      // Revalidate from MongoDB Atlas in background
      employeeService
        .getAll()
        .then((res) => {
          if (res?.data && Array.isArray(res.data)) {
            setEmployees(res.data);
          }
        })
        .catch(() => {});
    };

    window.addEventListener('mak_staff_profile_updated', handleStaffProfileUpdate);
    return () => {
      window.removeEventListener('mak_staff_profile_updated', handleStaffProfileUpdate);
    };
  }, []);

  // Combined notifications: trip notifications + local system notifications with standardized timestamps
  const notifications = React.useMemo(() => {
    const tripNotifs = adminNotifications || [];
    const tripIds = new Set(tripNotifs.map((n) => n.id));
    const nonDuplicateLocal = (localNotifications || []).filter((ln) => !tripIds.has(ln.id));
    const combined = [...tripNotifs, ...nonDuplicateLocal];

    return combined.map((n) => {
      const resolvedTime = n.time || n.timestamp || 'Just now';
      const resolvedMessage = n.message || n.description || '';
      return {
        ...n,
        time: resolvedTime,
        timestamp: resolvedTime,
        message: resolvedMessage,
        description: resolvedMessage,
        actionLink: n.actionLink || n.actionUrl || '/admin/bookings'
      };
    });
  }, [adminNotifications, localNotifications]);

  // --- DRIVER APPLICATIONS OPERATIONS ---
  const approveDriverApplication = (applicationId, notes = '') => {
    let approvedApp = null;
    const updatedApps = driverApplications.map((app) => {
      if (app.id === applicationId) {
        approvedApp = {
          ...app,
          status: 'Approved',
          reviewedDate: new Date().toISOString().substring(0, 10),
          reviewedBy: 'Admin Operations Desk',
          adminRemarks:
            notes ||
            'Verified all credentials, commercial driving license, passport photograph, and Annual Medical Fitness & Eye Checkup Certificate. Approved for commercial fleet duty.'
        };
        return approvedApp;
      }
      return app;
    });

    setDriverApplications(updatedApps);

    if (approvedApp) {
      // Automatically add to active Driver List via TripContext action!
      const newEnrolledDriver = {
        name: approvedApp.fullName,
        fullName: approvedApp.fullName,
        phone: approvedApp.phone,
        email: approvedApp.email || `${approvedApp.fullName.toLowerCase().replace(/\s+/g, '.')}@maktours.com`,
        licenseNumber: approvedApp.licenseNumber,
        licenseExpiry: approvedApp.licenseExpiry,
        badgeNumber: `BDG-TN-${Math.floor(1000 + Math.random() * 9000)}`,
        badgeExpiry: '2029-12-31',
        experience: `${approvedApp.experienceYears || 8} Years`,
        rating: 5.0,
        tripsCompleted: 0,
        totalTripsCompleted: 0,
        status: 'Active',
        approvalStatus: 'Approved',
        dutyStatus: 'Available',
        currentTripId: null,
        currentVehicle: null,
        address: approvedApp.address,
        emergencyContact: `${approvedApp.emergencyContactName} (${approvedApp.emergencyContactRelation || 'Emergency'}) - ${approvedApp.emergencyContactPhone}`,
        bloodGroup: approvedApp.bloodGroup || 'B+ve',
        joiningDate: new Date().toISOString().substring(0, 10),
        languages: approvedApp.languages || ['Tamil', 'English'],
        photo: approvedApp.passportPhoto || approvedApp.photo,
        documents: [
          { name: 'Commercial Driving License', status: 'Verified', expiry: approvedApp.licenseExpiry },
          { name: 'Passport Photograph', status: 'Verified', expiry: 'Lifetime' },
          { name: 'Annual Medical Fitness & Eye Checkup Certificate', status: 'Verified', expiry: approvedApp.medicalFitness?.expiryDate || '2027-10-14' },
          { name: 'Police Verification Certificate', status: 'Verified', expiry: '2027-01-10' }
        ],
        scheduleToday: 'Standby - Ready for Roster Dispatch'
      };

      const added = tripAddDriver(newEnrolledDriver);

      toast.success(
        `Driver ${approvedApp.fullName} confirmed & approved! Successfully added to active Driver List as #${added.id}.`
      );
      return added;
    }
  };

  const rejectDriverApplication = (applicationId, reason = 'Document verification failed') => {
    setDriverApplications((prev) =>
      prev.map((app) =>
        app.id === applicationId
          ? {
              ...app,
              status: 'Rejected',
              reviewedDate: new Date().toISOString().substring(0, 10),
              reviewedBy: 'Admin Operations Desk',
              adminRemarks: reason
            }
          : app
      )
    );
    toast.warning(`Application #${applicationId} marked as Rejected.`);
  };

  const requestDocumentsApplication = (applicationId, remarks = 'Additional document verification requested') => {
    setDriverApplications((prev) =>
      prev.map((app) =>
        app.id === applicationId
          ? {
              ...app,
              status: 'Documents Required',
              reviewedDate: new Date().toISOString().substring(0, 10),
              reviewedBy: 'Admin Compliance Desk',
              adminRemarks: remarks
            }
          : app
      )
    );
    toast.info(`Application #${applicationId} status set to Documents Required.`);
  };

  const verifyDriverDocument = (applicationId, documentId, newStatus, reason = '', remarks = '') => {
    setDriverApplications((prev) =>
      prev.map((app) => {
        if (app.id === applicationId) {
          const updatedDocs = (app.documents || []).map((doc) => {
            if (doc.id === documentId) {
              return {
                ...doc,
                status: newStatus,
                rejectionReason: reason || (newStatus === 'Verified' ? '' : doc.rejectionReason || ''),
                remarks: remarks || doc.remarks || '',
                verifiedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
                verifiedBy: 'Admin Operations Desk'
              };
            }
            return doc;
          });

          const mandatoryDocs = updatedDocs.filter((d) => d.required);
          const allMandatoryVerified = mandatoryDocs.length > 0 && mandatoryDocs.every((d) => d.status === 'Verified');
          const hasRejected = updatedDocs.some((d) => d.status === 'Rejected');
          const hasResubmission = updatedDocs.some((d) => d.status === 'Resubmission Required');

          let newAppStatus = app.status;
          if (app.status !== 'Approved') {
            if (hasRejected) {
              newAppStatus = 'Rejected';
            } else if (hasResubmission) {
              newAppStatus = 'Resubmission Required';
            } else if (allMandatoryVerified) {
              newAppStatus = 'Verified';
            } else {
              newAppStatus = 'Under Review';
            }
          }

          return {
            ...app,
            documents: updatedDocs,
            status: newAppStatus,
            reviewedDate: new Date().toISOString().substring(0, 10),
            reviewedBy: 'Admin Operations Desk',
            adminRemarks: remarks || reason || app.adminRemarks
          };
        }
        return app;
      })
    );

    toast.success(`Document status updated to: ${newStatus}`);
  };

  // --- TOUR PACKAGES ---
  const addTourPackage = (pkg) => {
    const newId = generateId('PKG', { useYear: false });
    const newPkg = normalizeTourPackage({ ...pkg, id: newId, rating: 5.0, reviewsCount: 1 });
    setTourPackages((prev) => [newPkg, ...prev]);

    if (tourPackageService?.create) {
      tourPackageService.create(newPkg).catch((err) => {
        console.warn('Backend tour package creation deferred:', err);
      });
    }

    toast.success(`Tour Package "${pkg.name}" created!`);
    return newPkg;
  };

  const updateTourPackage = (id, updatedFields) => {
    const numPrice = Number(updatedFields.startingPrice || updatedFields.priceNumeric || (typeof updatedFields.price === 'string' ? updatedFields.price.replace(/[^\d]/g, '') : updatedFields.price)) || 0;
    const normalizedFields = {
      ...updatedFields,
      priceNumeric: numPrice > 0 ? numPrice : updatedFields.priceNumeric,
      startingPrice: numPrice > 0 ? numPrice : updatedFields.startingPrice,
      price: numPrice > 0 ? `₹${numPrice.toLocaleString('en-IN')}` : updatedFields.price
    };

    setTourPackages((prev) =>
      prev.map((p) => {
        const isMatch = p.id === id || p.slug === id || p.code === id || p._id === id;
        return isMatch ? { ...p, ...normalizedFields } : p;
      })
    );

    // Save directly to database via tourPackageService
    if (tourPackageService?.update) {
      tourPackageService.update(id, normalizedFields)
        .then((res) => {
          if (res?.data) {
            setTourPackages((prev) =>
              prev.map((p) => {
                const isMatch = p.id === id || p.slug === id || p.code === id || p._id === id;
                return isMatch ? normalizeTourPackage({ ...p, ...res.data }) : p;
              })
            );
          }
        })
        .catch((err) => {
          console.warn('Backend updateTourPackage sync deferred:', err);
        });
    }

    toast.success(`Tour package updated successfully!`);
  };

  const togglePackageStatus = (id) => {
    setTourPackages((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, status: p.status === 'Active' ? 'Inactive' : 'Active' } : p
      )
    );
    toast.info(`Package status toggled`);
  };

  // --- CUSTOMER OPERATIONS ---
  const addCustomer = async (cust) => {
    const newId = generateId('CUST', { useYear: false });
    const newCust = {
      ...cust,
      id: newId,
      totalBookings: 0,
      totalSpent: 0,
      outstandingBalance: 0,
      rating: 5.0,
      status: cust.status || 'Active',
      createdAt: new Date().toISOString().substring(0, 10)
    };
    setCustomers((prev) => [newCust, ...prev]);

    if (customerService?.create) {
      try {
        const res = await customerService.create(newCust);
        if (res?.data) {
          const saved = { ...newCust, ...res.data, id: res.data.id || newCust.id };
          setCustomers((prev) => prev.map((c) => (c.id === newCust.id ? saved : c)));
          toast.success(`Customer ${cust.name} added to database!`);
          return saved;
        }
      } catch (err) {
        console.warn('Customer create sync error:', err.message);
      }
    }
    toast.success(`Customer ${cust.name} added!`);
    return newCust;
  };

  const updateCustomer = (id, updatedFields) => {
    setCustomers((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updatedFields } : c))
    );
    if (customerService?.update) {
      customerService.update(id, updatedFields).catch(() => {});
    }
    toast.success(`Customer record updated!`);
  };

  const deleteCustomer = async (id) => {
    setCustomers((prev) => prev.filter((c) => c.id !== id));
    if (customerService?.delete) {
      customerService.delete(id).catch(() => {});
    }
    toast.info(`Customer removed`);
  };

  // --- VENDOR OPERATIONS ---
  const addVendor = async (vnd) => {
    const newId = generateId('VND', { useYear: false });
    const newVnd = {
      ...vnd,
      id: newId,
      vendorId: vnd.vendorId || newId,
      vendorCode: `MAK-VND-00${vendors.length + 1}`,
      companyName: vnd.companyName || vnd.businessName || vnd.name,
      name: vnd.companyName || vnd.businessName || vnd.name,
      attachedVehiclesCount: 0,
      rating: 4.8,
      totalInvoiced: 0,
      totalPaid: 0,
      outstandingBalance: 0,
      activeBookingsCount: 0,
      status: vnd.status || 'Active',
      createdAt: new Date().toISOString().substring(0, 10)
    };
    setVendors((prev) => [newVnd, ...prev]);

    if (vendorService?.create) {
      try {
        const res = await vendorService.create(newVnd);
        if (res?.data) {
          const saved = { ...newVnd, ...res.data, id: res.data.id || res.data.vendorId || newVnd.id };
          setVendors((prev) => prev.map((v) => (v.id === newVnd.id ? saved : v)));
          toast.success(`Vendor ${vnd.businessName || vnd.name} onboarded in database!`);
          return saved;
        }
      } catch (err) {
        console.warn('Vendor create sync error:', err.message);
      }
    }
    toast.success(`Vendor ${vnd.businessName || vnd.name} onboarded!`);
    return newVnd;
  };

  const updateVendor = (id, updatedFields) => {
    setVendors((prev) =>
      prev.map((v) => (v.id === id ? { ...v, ...updatedFields } : v))
    );
    if (vendorService?.update) {
      vendorService.update(id, updatedFields).catch(() => {});
    }
    toast.success(`Vendor details updated!`);
  };

  const updateVendorStatus = (id, status) => {
    setVendors((prev) =>
      prev.map((v) => (v.id === id ? { ...v, status } : v))
    );
    if (vendorService?.update) {
      vendorService.update(id, { status }).catch(() => {});
    }
    toast.info(`Vendor status set to ${status}`);
  };

  const deleteVendor = async (id) => {
    setVendors((prev) => prev.filter((v) => v.id !== id));
    if (vendorService?.delete) {
      vendorService.delete(id).catch(() => {});
    }
    toast.info(`Vendor removed`);
  };

  // --- HOTEL OPERATIONS ---
  const addHotel = (htl) => {
    const newId = generateId('HTL', { useYear: false });
    const newHtl = {
      ...htl,
      id: newId,
      hotelCode: `MAK-HTL-00${hotels.length + 1}`,
      activeBookingsCount: 0,
      totalGuestsHosted: 0,
      status: 'Active'
    };
    setHotels((prev) => [newHtl, ...prev]);
    toast.success(`Hotel partner ${htl.name} registered!`);
    return newHtl;
  };

  const updateHotel = (id, updatedFields) => {
    setHotels((prev) =>
      prev.map((h) => (h.id === id ? { ...h, ...updatedFields } : h))
    );
    toast.success(`Hotel information updated!`);
  };

  // --- EXPENSE OPERATIONS (SECTION 1.3: Unified schema and status) ---
  const addExpense = (exp) => {
    return addAdminExpense(exp);
  };

  const updateExpenseStatus = (id, newStatus, meta = {}) => {
    if (newStatus === 'Approved') {
      return approveExpenseClaim(id, meta.approvedAmount, meta.adminRemarks);
    } else if (newStatus === 'Rejected') {
      return rejectExpenseClaim(id, meta.rejectionReason || 'Declined by Admin');
    } else if (newStatus === 'Paid') {
      return markExpensePaid(id, meta.paymentReference, meta.paymentDate);
    } else {
      setExpenses((prev) =>
        prev.map((e) => (e.id === id ? { ...e, status: newStatus } : e))
      );
      toast.info(`Expense status: ${newStatus}`);
    }
  };

  // --- PAYMENT OPERATIONS ---
  const addPayment = (pay) => {
    // If linked to a customer booking, route through recordBalancePayment so the booking & invoice update
    if (pay.bookingId && (!pay.type || pay.type === 'Customer Payment')) {
      const ok = recordBalancePayment(pay.bookingId, pay.amount, pay.method || 'UPI / QR', pay.transactionRef);
      if (ok) return ok;
    }

    const newId = generateId('PAY', { useYear: true });
    const recId = generateId('REC', { useYear: true });
    const newPay = {
      ...pay,
      id: newId,
      receiptNumber: recId,
      paymentNumber: `RCPT-${recId.replace(/[^0-9]/g, '')}`,
      partyName: pay.partyName || pay.customerName || 'N/A',
      customerName: pay.customerName || pay.partyName || 'N/A',
      amount: parseFloat(pay.amount) || 0,
      method: pay.method || pay.paymentMethod || 'UPI / QR',
      paymentMethod: pay.method || pay.paymentMethod || 'UPI / QR',
      transactionRef: pay.transactionRef || pay.paymentReference || `TXN-${Date.now().toString().slice(-6)}`,
      paymentReference: pay.transactionRef || pay.paymentReference || `TXN-${Date.now().toString().slice(-6)}`,
      type: pay.type || 'Customer Payment',
      paymentType: pay.paymentType || (pay.type === 'Customer Payment' ? 'Balance' : 'Disbursement'),
      date: new Date().toISOString().replace('T', ' ').substring(0, 16),
      status: 'Completed'
    };
    setPayments((prev) => [newPay, ...prev]);
    toast.success(`Payment of ₹${pay.amount} logged successfully!`);
    return newPay;
  };

  // --- EMPLOYEE OPERATIONS ---
  const addEmployee = async (emp) => {
    try {
      const res = await employeeService.create(emp);
      const created = res?.data || {
        ...emp,
        id: emp.employeeCode || emp.code || generateId('EMP', { useYear: false }),
        code: emp.employeeCode || emp.code,
        employeeCode: emp.employeeCode || emp.code,
        fullName: emp.fullName || emp.name,
        name: emp.fullName || emp.name,
        attendanceToday: 'Not Marked',
        leavesTaken: 0,
        leavesRemaining: 18,
        status: emp.status || 'Active'
      };
      setEmployees((prev) => [created, ...prev.filter((e) => e.id !== created.id && e.code !== created.code)]);
      toast.success(`Staff member ${created.fullName || created.name} (${created.employeeCode || created.code}) enrolled!`);
      return created;
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to enroll staff member';
      toast.error(msg);
      throw err;
    }
  };

  const updateEmployee = async (id, updatedFields) => {
    try {
      const res = await employeeService.update(id, updatedFields);
      const updated = res?.data || updatedFields;
      setEmployees((prev) =>
        prev.map((e) =>
          e.id === id || e.code === id || e.employeeCode === id || (updated._id && e._id === updated._id)
            ? { ...e, ...updated }
            : e
        )
      );
      toast.success(`Staff profile for ${updated.fullName || updated.name || id} updated!`);
      return updated;
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to update employee';
      toast.error(msg);
      throw err;
    }
  };

  const deleteEmployee = async (id) => {
    try {
      const res = await employeeService.delete(id);
      setEmployees((prev) =>
        prev.filter((e) => e.id !== id && e.code !== id && e.employeeCode !== id && e._id !== id)
      );
      toast.success(res?.message || 'Staff member deleted successfully');
      return res;
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to delete staff member';
      toast.error(msg);
      throw err;
    }
  };

  // --- STAFF ATTENDANCE OPERATIONS ---
  const markAttendance = async (empId, date, status, details = {}) => {
    const norm = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const targetEmp = employees.find((e) => {
      const codes = [norm(e.id), norm(e.code), norm(e.employeeCode), norm(e._id)].filter(Boolean);
      const names = [norm(e.fullName), norm(e.name)].filter(Boolean);
      return codes.includes(norm(empId)) || names.includes(norm(empId));
    });
    const empName = targetEmp ? (targetEmp.fullName || targetEmp.name) : 'Staff';
    const finalEmpId = targetEmp ? (targetEmp.employeeCode || targetEmp.code || targetEmp.id) : empId;

    // Normalize status into rich classification
    let cleanStatus = status;
    if (status === 'Present') {
      cleanStatus = targetEmp?.isDriver ? 'Present – Standby' : 'Present – Office';
    } else if (status === 'Late') {
      cleanStatus = 'Late';
    } else if (status === 'On Leave') {
      cleanStatus = 'Paid Leave';
    }

    // Reset / clear attendance when Not Marked is chosen
    if (cleanStatus === 'Not Marked') {
      setStaffAttendance((prev) => {
        const arr = Array.isArray(prev) ? prev : [];
        return arr.filter((a) => {
          if (a.date !== date) return true;
          const aNorm = norm(a.employeeId);
          const aCodeNorm = norm(a.employeeCode);
          const aNameNorm = norm(a.employeeName);
          return !(
            aNorm === norm(finalEmpId) ||
            aCodeNorm === norm(finalEmpId) ||
            aNorm === norm(empId) ||
            (targetEmp && aNameNorm === norm(targetEmp.fullName || targetEmp.name))
          );
        });
      });

      if (targetEmp) {
        setEmployees((prev) =>
          prev.map((e) => {
            if (e.id === targetEmp.id || e.code === targetEmp.code || e.employeeCode === targetEmp.employeeCode) {
              return { ...e, attendanceToday: 'Not Marked' };
            }
            return e;
          })
        );
      }

      toast.info(`Attendance reset to Not Marked for ${empName}`);
      return;
    }

    const checkInVal = details.checkIn || (cleanStatus === 'Late' ? '09:55 AM' : cleanStatus.includes('Present') ? '09:15 AM' : '--:--');
    const checkOutVal = details.checkOut || (cleanStatus === 'Late' || cleanStatus.includes('Present') ? '06:30 PM' : '--:--');
    const workHoursVal = details.workHours || (cleanStatus === 'Late' ? '8h 35m' : cleanStatus.includes('Present') ? '9h 15m' : cleanStatus === 'Half Day' ? '4h 00m' : '0h 00m');

    const record = {
      id: `ATT-${date.replace(/-/g, '')}-${finalEmpId}`,
      employeeId: finalEmpId,
      employeeCode: finalEmpId,
      employeeName: targetEmp ? (targetEmp.fullName || targetEmp.name) : 'Staff Member',
      role: targetEmp ? (targetEmp.designation || targetEmp.role) : 'Operations Staff',
      department: targetEmp ? targetEmp.department : 'Operations & Dispatch',
      date,
      shift: details.shift || (targetEmp ? targetEmp.shift : 'General (09:30 - 18:30)'),
      checkIn: checkInVal,
      checkOut: checkOutVal,
      workHours: workHoursVal,
      status: cleanStatus,
      punchLocation: details.punchLocation || (cleanStatus.includes('Leave') || cleanStatus === 'Absent' ? 'N/A' : 'HQ Chennai - Biometric T1'),
      punchMethod: details.punchMethod || (cleanStatus.includes('Leave') ? 'Leave Portal' : cleanStatus === 'Absent' ? 'Unrecorded' : 'Biometric Fingerprint'),
      remarks: details.remarks || (cleanStatus === 'Late' ? 'Late arrival recorded (+25m grace exceeded).' : `Marked ${cleanStatus} by Admin Operations.`),
      isDriverAttendance: Boolean(targetEmp?.isDriver),
      driverId: targetEmp?.driverId || ''
    };

    setStaffAttendance((prev) => {
      const arr = Array.isArray(prev) ? prev : [];
      const existingIdx = arr.findIndex((a) => {
        if (a.date !== date) return false;
        const aNorm = norm(a.employeeId);
        const aCodeNorm = norm(a.employeeCode);
        const aNameNorm = norm(a.employeeName);
        return (
          aNorm === norm(finalEmpId) ||
          aCodeNorm === norm(finalEmpId) ||
          aNorm === norm(empId) ||
          (targetEmp && aNameNorm === norm(targetEmp.fullName || targetEmp.name))
        );
      });

      if (existingIdx >= 0) {
        const next = [...arr];
        next[existingIdx] = { ...next[existingIdx], ...record, ...details };
        return next;
      } else {
        return [record, ...arr];
      }
    });

    if (targetEmp) {
      setEmployees((prev) =>
        prev.map((e) => {
          if (e.id === targetEmp.id || e.code === targetEmp.code || e.employeeCode === targetEmp.employeeCode) {
            const formattedToday =
              cleanStatus.includes('Present')
                ? `Present (${checkInVal})`
                : cleanStatus === 'Late'
                ? `Late (${checkInVal})`
                : cleanStatus.includes('Leave')
                ? `On Leave (${details.leaveType || 'Approved'})`
                : cleanStatus === 'Half Day'
                ? 'Half Day (09:30 - 13:30)'
                : cleanStatus;
            return { ...e, attendanceToday: formattedToday };
          }
          return e;
        })
      );
    }

    // Update local payroll immediately so UI reflects present day addition right away
    const monthStr = date.substring(0, 7);
    setPayrolls((prev) => {
      if (!Array.isArray(prev)) return prev;
      return prev.map((p) => {
        const pNorm = norm(p.employeeId);
        const pCodeNorm = norm(p.employeeCode);
        const pNameNorm = norm(p.employeeName);
        const isMatch =
          pNorm === norm(finalEmpId) ||
          pCodeNorm === norm(finalEmpId) ||
          pNorm === norm(empId) ||
          (targetEmp && pNameNorm === norm(targetEmp.fullName || targetEmp.name));

        if (!isMatch || p.month !== monthStr) return p;

        const isPres = cleanStatus.includes('Present');
        const isHDay = cleanStatus === 'Half Day';
        const isPdLeave = cleanStatus.includes('Paid Leave') || cleanStatus === 'Paid Leave';

        const curSummary = p.attendanceSummary || {};
        const oldPresentOffice = curSummary.presentOfficeDays || 0;
        const oldTotalPresent = curSummary.totalPresentDays || 0;
        const oldPayable = curSummary.payableDays || 0;

        const newPresentOffice = isPres ? oldPresentOffice + 1 : oldPresentOffice;
        const newTotalPresent = isPres ? oldTotalPresent + 1 : oldTotalPresent;
        const newPayable = Math.min(
          p.policySnapshot?.payrollWorkingDays || 26,
          isPres ? oldPayable + 1 : isHDay ? oldPayable + 0.5 : isPdLeave ? oldPayable + 1 : oldPayable
        );

        const gross = p.earningsBreakdown?.monthlyGrossSalary || p.grossEarnings || 45000;
        const workingDays = p.policySnapshot?.payrollWorkingDays || 26;
        const newAttPay = Math.round((gross / workingDays) * newPayable);
        const tripAllow = p.earningsBreakdown?.tripAllowances || 0;
        const ot = p.earningsBreakdown?.approvedOvertimePay || 0;
        const incent = p.earningsBreakdown?.approvedIncentives || 0;
        const newGrossEarnings = newAttPay + tripAllow + ot + incent;
        const newNet = newGrossEarnings;
        const paid = p.totalPaidAmount || 0;
        const newDue = Math.max(0, newNet - paid);

        return {
          ...p,
          attendanceSummary: {
            ...curSummary,
            presentOfficeDays: newPresentOffice,
            totalPresentDays: newTotalPresent,
            payableDays: newPayable
          },
          earningsBreakdown: {
            ...p.earningsBreakdown,
            attendancePay: newAttPay,
            grossEarnings: newGrossEarnings
          },
          grossEarnings: newGrossEarnings,
          netPayableSalary: newNet,
          outstandingSalary: newDue
        };
      });
    });

    // Persist to MongoDB Atlas backend & auto-recalculate payroll for this month immediately
    try {
      const res = await attendanceService.mark(record);
      if (res?.data) {
        setStaffAttendance((prev) => {
          const arr = Array.isArray(prev) ? prev : [];
          const idx = arr.findIndex(
            (a) =>
              a.date === date &&
              (a.employeeId === finalEmpId ||
                a.employeeCode === finalEmpId ||
                (res.data._id && a._id === res.data._id) ||
                (res.data.id && a.id === res.data.id))
          );
          if (idx >= 0) {
            const next = [...arr];
            next[idx] = { ...next[idx], ...res.data };
            return next;
          }
          return [res.data, ...arr];
        });
      }
      await calculatePayroll(monthStr, false);
    } catch (err) {
      console.warn('Backend attendance sync warning:', err);
    }

    toast.success(`Attendance updated for ${empName}: ${cleanStatus}`);
    return true;
  };

  const bulkMarkAttendance = async (status, date, empIds = null) => {
    const targets = empIds
      ? employees.filter((e) => empIds.includes(e.id) || empIds.includes(e.code) || empIds.includes(e.employeeCode))
      : employees;

    for (const emp of targets) {
      await markAttendance(emp.id || emp.employeeCode, date, status, {
        remarks: `Bulk marked as ${status} by Admin.`
      });
    }

    const monthStr = date.substring(0, 7);
    await calculatePayroll(monthStr, false);

    toast.success(`Bulk updated ${targets.length} staff records to "${status}"`);
  };

  const updateAttendanceRecord = async (recordId, updates) => {
    setStaffAttendance((prev) =>
      prev.map((a) => (a.id === recordId ? { ...a, ...updates } : a))
    );
    const existing = staffAttendance.find((a) => a.id === recordId);
    if (existing) {
      try {
        const merged = { ...existing, ...updates };
        await attendanceService.mark(merged);
        if (merged.date) {
          const monthStr = merged.date.substring(0, 7);
          await calculatePayroll(monthStr, false);
        }
      } catch (err) {
        console.warn('Backend update attendance warning:', err);
      }
    }
    toast.success(`Attendance record updated`);
  };

  const approveStaffLeave = (leaveId, approved = true, remarks = '') => {
    setStaffLeaveRequests((prev) =>
      prev.map((l) => {
        if (l.id === leaveId) {
          return {
            ...l,
            status: approved ? 'Approved' : 'Rejected',
            reviewedBy: 'Operations Admin',
            adminRemarks: remarks || (approved ? 'Approved by Admin' : 'Declined due to duty coverage')
          };
        }
        return l;
      })
    );

    const targetLeave = staffLeaveRequests.find((l) => l.id === leaveId);
    if (approved && targetLeave) {
      markAttendance(targetLeave.employeeId, targetLeave.fromDate, 'On Leave', {
        remarks: `Approved ${targetLeave.leaveType}: ${targetLeave.reason}`,
        leaveType: targetLeave.leaveType
      });
    }

    toast.info(`Staff leave request ${approved ? 'Approved' : 'Rejected'}`);
  };

  const submitStaffLeave = (leaveData) => {
    const newId = generateId('LVR', { useYear: true });
    const newLeave = {
      id: newId,
      ...leaveData,
      status: 'Pending',
      appliedOn: new Date().toISOString().substring(0, 10),
      reviewedBy: null
    };
    setStaffLeaveRequests((prev) => [newLeave, ...prev]);
    toast.success(`Leave application submitted for ${leaveData.employeeName}`);
    return newLeave;
  };

  // --- AUTOMATIC ATTENDANCE-BASED PAYROLL ACTIONS ---
  const calculatePayroll = useCallback(async (month = selectedPayrollMonth, showToast = true) => {
    try {
      const res = await payrollService.calculateMonthlyPayroll(month);
      if (res?.data && Array.isArray(res.data)) {
        setPayrolls(res.data);
        if (showToast) {
          toast.success(`Generated payroll for ${res.data.length} staff records (${month})`);
        }
        return res.data;
      }
    } catch (err) {
      console.warn('Backend payroll calculation fallback:', err);
    }
  }, [selectedPayrollMonth, toast]);

  const approvePayroll = async (payrollId, approverName = 'Operations Admin', remarks = 'Approved by Admin') => {
    try {
      await payrollService.approve(payrollId, { approverName, remarks });
    } catch (err) {
      console.warn('Backend payroll approval fallback:', err);
    }
    setPayrolls((prev) =>
      prev.map((p) =>
        (p._id === payrollId || p.payrollCode === payrollId || p.id === payrollId)
          ? {
              ...p,
              status: 'Approved',
              approvalInfo: { approvedBy: approverName, approvedAt: new Date().toISOString(), remarks }
            }
          : p
      )
    );
    toast.success(`Payroll record approved!`);
  };

  const recordSalaryPayment = async (payrollId, paymentData) => {
    try {
      const res = await payrollService.recordPayment(payrollId, paymentData);
      if (res?.data?.payroll) {
        setPayrolls((prev) =>
          prev.map((p) =>
            (p._id === payrollId || p.payrollCode === payrollId || p.id === payrollId)
              ? { ...res.data.payroll, status: 'Settled' }
              : p
          )
        );
        toast.success(`Salary marked as Settled!`);
        return res.data;
      }
    } catch (err) {
      console.warn('Backend salary payment fallback:', err);
    }

    // Local state fallback
    setPayrolls((prev) =>
      prev.map((p) => {
        if (p._id === payrollId || p.payrollCode === payrollId || p.id === payrollId) {
          const amt = Number(paymentData?.amount) || p.netPayableSalary || 0;
          return {
            ...p,
            totalPaidAmount: amt,
            outstandingSalary: 0,
            status: 'Settled',
            paymentHistory: [
              ...(p.paymentHistory || []),
              {
                paymentRef: `SAL-TXN-${Date.now().toString().slice(-6)}`,
                amount: amt,
                paymentDate: paymentData?.paymentDate || new Date().toISOString().substring(0, 10),
                paymentMethod: paymentData?.paymentMethod || 'Bank Transfer',
                transactionRef: paymentData?.transactionRef || `SAL-TXN-${Date.now().toString().slice(-6)}`,
                recordedBy: paymentData?.recordedBy || 'Operations Admin'
              }
            ]
          };
        }
        return p;
      })
    );
    toast.success(`Salary marked as Settled!`);
  };

  const updatePayrollPolicy = async (policyData) => {
    try {
      await payrollService.updatePolicy(policyData);
    } catch (err) {
      console.warn('Backend policy update fallback:', err);
    }
    setPayrollPolicy((prev) => ({ ...prev, ...policyData }));
    toast.success(`Payroll policy updated successfully!`);
  };

  // Dynamic Salary Management & Revision History
  const updateEmployeeSalary = async (employeeId, salaryData) => {
    try {
      const res = await payrollService.updateSalary(employeeId, salaryData);
      if (res?.data) {
        if (res.data.payroll) {
          setPayrolls((prev) => {
            const pId = res.data.payroll._id || res.data.payroll.payrollCode;
            const idx = prev.findIndex((p) => p._id === pId || p.payrollCode === res.data.payroll.payrollCode || p.employeeId === res.data.payroll.employeeId);
            if (idx >= 0) {
              const copy = [...prev];
              copy[idx] = res.data.payroll;
              return copy;
            }
            return [res.data.payroll, ...prev];
          });
        }
        if (res.data.employee) {
          setEmployees((prev) =>
            prev.map((e) =>
              (e._id === res.data.employee._id || e.id === res.data.employee.id || e.employeeCode === res.data.employee.employeeCode)
                ? { ...e, ...res.data.employee }
                : e
            )
          );
        }
        toast.success(res.message || 'Salary revised successfully!');
        return res.data;
      }
    } catch (err) {
      console.error('Failed to update salary:', err);
      toast.error(err?.response?.data?.message || 'Failed to update salary');
      throw err;
    }
  };

  const getSalaryHistory = async (employeeId) => {
    try {
      const res = await payrollService.getSalaryHistory(employeeId);
      return res?.data || [];
    } catch (err) {
      console.warn('Failed to fetch salary history:', err);
      return [];
    }
  };

  // --- NOTIFICATIONS ---
  const markNotificationRead = (id) => {
    if (markAdminNotificationRead) {
      markAdminNotificationRead(id);
    }
    setLocalNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, unread: false, read: true, isRead: true } : n))
    );
  };

  const markAllNotificationsRead = () => {
    if (markAllAdminNotificationsRead) {
      markAllAdminNotificationsRead();
    }
    setLocalNotifications((prev) => prev.map((n) => ({ ...n, unread: false, read: true, isRead: true })));
    toast.info('All notifications marked as read');
  };

  const clearNotification = (id) => {
    if (clearAdminNotification) {
      clearAdminNotification(id);
    }
    setLocalNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  // --- SETTINGS ---
  const updateSettings = (section, data) => {
    setSettings((prev) => ({
      ...prev,
      [section]: { ...prev[section], ...data }
    }));
    toast.success(`Settings updated!`);
  };

  // SECTION 4.2: Reset demo data cleanly
  const resetDemoData = () => {
    try {
      Object.values(ADMIN_STORAGE_KEYS).forEach((k) => localStorage.removeItem(k));
      setTourPackages(initialTourPackages);
      setCustomers(initialCustomers);
      setVendors(initialVendors);
      setHotels(initialHotels);
      setEmployees(initialEmployees);
      setStaffAttendance(initialStaffAttendance);
      setStaffLeaveRequests(initialStaffLeaveRequests);
      setSettings(initialSettings);
      setDriverApplications(initialDriverApplications);
      toast.success('Admin demo data reset to default successfully!');
    } catch (e) {
      toast.error('Failed to reset demo data: ' + e.message);
    }
  };

  return (
    <AdminDataContext.Provider
      value={{
        // Data arrays
        bookings,
        tourPackages,
        vehicles,
        drivers,
        driverApplications,
        customers,
        vendors,
        hotels,
        payments,
        invoices,
        expenses,
        employees,
        notifications,
        settings,

        // Setters for external components
        setBookings,
        setVehicles,
        setDrivers,
        setExpenses,
        setPayments,
        setInvoices,

        // Financial & Trip metrics
        financialMetrics,
        getBookingExpenses,
        getBookingPayments,
        getBookingInvoices,
        isDriverAvailable,
        isVehicleAvailable,

        // Booking actions
        addBooking: tripAddBooking,
        updateBooking: tripUpdateBooking,
        cancelBooking: tripCancelBooking,
        assignVehicle: tripAssignVehicle,
        confirmTripAssignment,
        acceptTripAssignment,
        declineTripAssignment,
        arrivedAtPickup,
        startTrip,
        endTrip,
        markBookingCompleted: tripMarkCompleted,

        // Tour Package actions
        addTourPackage,
        updateTourPackage,
        togglePackageStatus,

        // Fleet actions
        addVehicle: tripAddVehicle,
        updateVehicle: tripUpdateVehicle,
        updateVehicleStatus: tripUpdateVehicleStatus,
        deleteVehicle: tripDeleteVehicle,

        // Driver actions
        addDriver: tripAddDriver,
        updateDriver: tripUpdateDriver,
        updateDriverStatus: tripUpdateDriverStatus,
        deleteDriver: tripDeleteDriver,
        approveDriverApplication,
        rejectDriverApplication,
        requestDocumentsApplication,
        verifyDriverDocument,

        // Customer actions
        addCustomer,
        updateCustomer,
        deleteCustomer,

        // Vendor actions
        addVendor,
        updateVendor,
        updateVendorStatus,
        deleteVendor,

        // Hotel actions
        addHotel,
        updateHotel,

        // Expense actions
        addExpense,
        updateExpenseStatus,
        approveExpenseClaim,
        rejectExpenseClaim,
        markExpensePaid,
        resubmitExpenseClaim,
        removeExpenseClaim,

        // Payment actions
        addPayment,
        recordBalancePayment,

        // Employee & Staff actions
        addEmployee,
        updateEmployee,
        deleteEmployee,

        // Staff Attendance & Leaves
        staffAttendance,
        staffLeaveRequests,
        markAttendance,
        bulkMarkAttendance,
        updateAttendanceRecord,
        approveStaffLeave,
        submitStaffLeave,

        // Payroll & Salaries
        payrolls,
        setPayrolls,
        payrollPolicy,
        setPayrollPolicy,
        selectedPayrollMonth,
        setSelectedPayrollMonth,
        calculatePayroll,
        approvePayroll,
        recordSalaryPayment,
        updatePayrollPolicy,
        updateEmployeeSalary,
        getSalaryHistory,

        // Notification actions
        markNotificationRead,
        markAllNotificationsRead,
        clearNotification,

        // Settings actions
        updateSettings,
        resetDemoData
      }}
    >
      {children}
    </AdminDataContext.Provider>
  );
}

export function useAdminData() {
  const context = useContext(AdminDataContext);
  if (!context) {
    throw new Error('useAdminData must be used within an AdminDataProvider');
  }
  return context;
}
