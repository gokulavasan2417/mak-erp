// MAK Tours & Travels ERP - Driver Data Context
// Manages driver profile, registration applications, sequential trip lifecycle, earnings, documents & SOS
import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import {
  initialDriverProfile,
  initialDriverApplications,
  initialDriverTrips,
  initialPendingAssignments,
  initialDriverEarnings,
  initialDriverPayments,
  initialDriverDocuments,
  initialDriverNotifications,
  initialDriverSupportTickets,
  initialDriverFeedback,
  emergencyContacts
} from '../data/driverPortalData';
import { useToast } from './ToastContext';
import { useTripContext } from './TripContext';
import { useAuth } from '../hooks/useAuth';
import { loadStoredJson, saveStoredJson } from '../utils/storage';
import { calculateBookingKm } from '../utils/formatters';
import { authService } from '../services/authService';

export const DriverDataContext = createContext();

export function DriverDataProvider({ children }) {
  const toast = useToast();
  const tripCtx = useTripContext();
  const { currentUser } = useAuth();

  // SECTION 4.4: Authenticated Driver Identification
  const authDriverId = currentUser?.driverId || (currentUser?.role === 'driver' ? (currentUser.id || 'DRV-001') : 'DRV-001');

  // Look up driver in TripContext, authenticated session, or cached storage
  const activeDriver = useMemo(() => {
    const cachedProfile = loadStoredJson('mak_driver_profile_cache', null);
    const found = tripCtx?.drivers?.find((d) => d.id === authDriverId || d.driverId === authDriverId);
    
    // Authenticated user data takes priority, followed by database driver record, then initial mock
    const resolvedName = currentUser?.fullName || currentUser?.name || cachedProfile?.fullName || cachedProfile?.name || found?.fullName || found?.name || 'Murugan S';
    const resolvedAvatar = currentUser?.avatar || currentUser?.photo || cachedProfile?.photo || cachedProfile?.avatar || found?.avatar || found?.photo || '';
    const resolvedPhone = currentUser?.phone || currentUser?.mobileNumber || cachedProfile?.phone || found?.phone || '+91 98401 11004';
    const resolvedEmail = currentUser?.email || cachedProfile?.email || found?.email || 'driver@maktours.com';
    const resolvedAddress = currentUser?.address || cachedProfile?.address || found?.address || '';
    const resolvedEmergency = currentUser?.emergencyContact || cachedProfile?.emergencyContact || found?.emergencyContact || '';

    return {
      ...initialDriverProfile,
      ...(found || {}),
      ...(cachedProfile || {}),
      id: authDriverId,
      driverId: authDriverId,
      name: resolvedName,
      fullName: resolvedName,
      displayName: resolvedName,
      photo: resolvedAvatar,
      avatar: resolvedAvatar,
      phone: resolvedPhone,
      mobileNumber: resolvedPhone,
      email: resolvedEmail,
      address: resolvedAddress,
      emergencyContact: resolvedEmergency,
      rating: found?.rating || 4.9,
      experienceYears: found?.experienceYears || cachedProfile?.experienceYears || 9,
      onTimePerformanceRate: found?.onTimePerformanceRate || cachedProfile?.onTimePerformanceRate || 99,
      totalTripsCompleted: found?.totalTripsCompleted || found?.tripsCompleted || cachedProfile?.totalTripsCompleted || 6,
      dutyStatus: cachedProfile?.dutyStatus || found?.dutyStatus || 'Available'
    };
  }, [authDriverId, tripCtx?.drivers, currentUser]);

  const [driver, setDriver] = useState(activeDriver);

  // Sync state whenever activeDriver changes (e.g. currentUser updates)
  useEffect(() => {
    setDriver(activeDriver);
  }, [activeDriver]);

  // Synchronize with external profile updates across tabs or from EditProfileModal
  useEffect(() => {
    const handleProfileUpdate = (e) => {
      const updatedUser = e?.detail;
      if (!updatedUser) return;
      if (updatedUser.role === 'driver' || updatedUser.portal === 'driver' || updatedUser.id === currentUser?.id || updatedUser.email === currentUser?.email) {
        const resolvedName = updatedUser.fullName || updatedUser.name;
        const resolvedAvatar = updatedUser.avatar || updatedUser.photo;
        const updatedProfile = {
          name: resolvedName,
          fullName: resolvedName,
          displayName: resolvedName,
          photo: resolvedAvatar,
          avatar: resolvedAvatar,
          phone: updatedUser.phone || updatedUser.mobileNumber,
          mobileNumber: updatedUser.phone || updatedUser.mobileNumber,
          email: updatedUser.email,
          address: updatedUser.address,
          emergencyContact: updatedUser.emergencyContact
        };

        setDriver((prev) => ({
          ...prev,
          ...updatedProfile
        }));

        saveStoredJson('mak_driver_profile_cache', { ...driver, ...updatedProfile });

        if (tripCtx?.updateDriver && authDriverId) {
          tripCtx.updateDriver(authDriverId, updatedProfile);
        }
      }
    };

    window.addEventListener('mak_staff_profile_updated', handleProfileUpdate);
    return () => {
      window.removeEventListener('mak_staff_profile_updated', handleProfileUpdate);
    };
  }, [currentUser?.id, currentUser?.email]);

  const [applications, setApplications] = useState(() => loadStoredJson('mak_driver_applications_v7', initialDriverApplications));
  const [localTrips, setLocalTrips] = useState(() => loadStoredJson('mak_driver_trips_v7', initialDriverTrips));
  const [earnings, setEarnings] = useState(() => loadStoredJson('mak_driver_earnings_v7', initialDriverEarnings));
  const [payments, setPayments] = useState(() => loadStoredJson('mak_driver_payments_v7', initialDriverPayments));
  const [documents, setDocuments] = useState(() => loadStoredJson('mak_driver_documents_v7', initialDriverDocuments));
  const [supportTickets, setSupportTickets] = useState(() => loadStoredJson('mak_driver_tickets_v7', initialDriverSupportTickets));
  const [leaveRequests, setLeaveRequests] = useState(() => loadStoredJson('mak_driver_leaves_v7', []));
  const [driverActivities, setDriverActivities] = useState(() => loadStoredJson('mak_driver_activities_v7', []));
  const [currentAppId, setCurrentAppId] = useState('');
  const [sosActive, setSosActive] = useState(false);

  useEffect(() => { saveStoredJson('mak_driver_applications_v7', applications); }, [applications]);
  useEffect(() => { saveStoredJson('mak_driver_trips_v7', localTrips); }, [localTrips]);
  useEffect(() => { saveStoredJson('mak_driver_earnings_v7', earnings); }, [earnings]);
  useEffect(() => { saveStoredJson('mak_driver_payments_v7', payments); }, [payments]);
  useEffect(() => { saveStoredJson('mak_driver_documents_v7', documents); }, [documents]);
  useEffect(() => { saveStoredJson('mak_driver_tickets_v7', supportTickets); }, [supportTickets]);
  useEffect(() => { saveStoredJson('mak_driver_leaves_v7', leaveRequests); }, [leaveRequests]);
  useEffect(() => { saveStoredJson('mak_driver_activities_v7', driverActivities); }, [driverActivities]);

  const logActivity = (text, type = 'info') => {
    setDriverActivities((prev) => [
      { id: Date.now(), text, time: 'Just now', type },
      ...prev.slice(0, 19)
    ]);
  };

  // Synchronized pending assignments from shared TripContext for THIS driver
  const pendingAssignments = useMemo(() => {
    const list = [];
    const seenBookingIds = new Set();

    // 1. From tripCtx.assignments
    if (tripCtx?.assignments) {
      tripCtx.assignments
        .filter((a) => a.status === 'Assigned' && (a.driverId === authDriverId || !a.driverId))
        .forEach((a) => {
          list.push({
            ...a,
            id: a.id || `ASN-${a.bookingId}`,
            bookingId: a.bookingId,
            bookingNumber: a.bookingNumber || a.bookingId,
            dropLocation: a.dropLocation || a.destination,
            destination: a.destination || a.dropLocation,
            deadlineHours: a.deadlineHours || 2,
            estimatedEarnings: a.estimatedEarnings || 1365
          });
          if (a.bookingId) seenBookingIds.add(a.bookingId);
        });
    }

    // 2. From tripCtx.bookings (if dispatched/assigned but awaiting driver acceptance)
    if (tripCtx?.bookings) {
      tripCtx.bookings
        .filter((b) => {
          const matchesDriver = b.driverId === authDriverId || b.assignedDriver?.id === authDriverId || !b.driverId;
          const isPendingAccept = b.driverAssignmentStatus === 'Assigned' && b.tripStatus !== 'Driver Accepted' && b.tripStatus !== 'In Progress' && b.tripStatus !== 'Completed';
          return matchesDriver && isPendingAccept && !seenBookingIds.has(b.id);
        })
        .forEach((b) => {
          seenBookingIds.add(b.id);
          list.push({
            id: `ASN-${b.id}`,
            bookingId: b.id,
            bookingNumber: b.bookingNumber || b.id,
            driverId: b.driverId || authDriverId,
            driverName: b.driverName || 'Arun Kumar Sundaram',
            tripCategory: b.bookingCategory,
            customerName: b.customerName || b.fullName || 'Valued Guest',
            customerPhone: b.customerPhone || b.mobileNumber || b.phone || '',
            passengerCount: b.passengerCount,
            pickupLocation: b.pickupLocation,
            dropLocation: b.destination,
            destination: b.destination,
            pickupDate: b.journeyDate,
            pickupTime: b.journeyTime || '08:00 AM',
            returnDate: b.returnDate || b.journeyDate,
            returnTime: b.returnTime || '06:00 PM',
            durationDays: b.durationDays || 2,
            assignedVehicle: b.assignedVehicle || {
              model: b.vehicleReserved || b.vehicleName || 'Swift VXI',
              regNo: b.assignedVehicle?.regNo || 'KA-01-MJ-4419'
            },
            estimatedEarnings: b.driverCompensationAmount || 1365,
            status: 'Assigned',
            deadlineHours: 2,
            assignedAt: b.createdAt || 'Just now'
          });
        });
    }

    return list;
  }, [tripCtx?.assignments, tripCtx?.bookings, authDriverId]);

  // Synchronized trips from shared TripContext bookings (Canonical State of Truth)
  const trips = useMemo(() => {
    if (!tripCtx || !tripCtx.bookings) return localTrips;
    return tripCtx.bookings
      .filter((b) => {
        const matchesDriver =
          b.driverId === authDriverId ||
          b.assignedDriver?.id === authDriverId ||
          (!b.driverId && b.driverAssignmentStatus === 'Accepted') ||
          (b.driverAssignmentStatus === 'Accepted' && authDriverId === 'DRV-001');
        const isAcceptedOrActive =
          b.driverAssignmentStatus === 'Accepted' ||
          b.tripStatus === 'In Progress' ||
          b.tripStatus === 'Completed' ||
          b.tripStatus === 'Driver Accepted';
        return matchesDriver && isAcceptedOrActive;
      })
      .map((b) => {
        const local = (localTrips || []).find((t) => t.id === b.id || t.bookingId === b.id || (b.bookingNumber && t.bookingNumber === b.bookingNumber));
        
        // CANONICAL STATUS: TripContext b.tripStatus is authoritative!
        let resolvedStatus = 'Assigned';
        if (b.tripStatus === 'Completed' || b.tripStatus === 'Trip Completed') {
          resolvedStatus = 'Trip Completed';
        } else if (b.tripStatus === 'In Progress' || b.tripStatus === 'Trip Started') {
          resolvedStatus = 'Trip Started';
        } else if (b.tripStatus === 'Arrived at Pickup') {
          resolvedStatus = 'Arrived at Pickup';
        } else if (b.tripStatus === 'Driver Accepted' || b.driverAssignmentStatus === 'Accepted') {
          resolvedStatus = 'Accepted';
        } else if (b.tripStatus === 'Driver Declined' || b.driverAssignmentStatus === 'Declined' || b.driverAssignmentStatus === 'Reassignment Required') {
          resolvedStatus = 'Declined';
        } else {
          resolvedStatus = b.tripStatus || 'Assigned';
        }

        return {
          id: b.id,
          bookingId: b.id,
          bookingNumber: b.bookingNumber || b.id,
          tripCategory: b.bookingCategory,
          customerName: b.customerName || b.fullName || 'Valued Guest',
          customerPhone: b.customerPhone || b.mobileNumber || b.phone || '',
          passengerCount: b.passengerCount,
          pickupLocation: b.pickupLocation,
          dropLocation: b.destination,
          destination: b.destination,
          pickupDate: b.journeyDate,
          pickupTime: b.journeyTime || '08:00 AM',
          returnDate: b.returnDate || b.journeyDate,
          returnTime: b.returnTime || '06:00 PM',
          durationDays: b.durationDays || 2,
          vehicle: {
            regNo: b.assignedVehicle?.regNo || 'KA-01-MJ-8890',
            model: b.assignedVehicle?.model || 'Toyota Innova Crysta',
            category: b.assignedVehicle?.category || 'SUV/MUV',
            ratePerKm: b.vehicleRatePerKm || 15
          },
          status: resolvedStatus,
          rawStatus: b.tripStatus,
          startOdometer: b.startOdometer || local?.startOdometer || 0,
          currentOdometer: b.currentOdometer || b.startOdometer || 0,
          endOdometer: b.endOdometer || local?.endOdometer || 0,
          distanceTravelled: calculateBookingKm(b) || b.distanceTravelled || b.actualDistanceKm || 0,
          distanceKm: calculateBookingKm(b) || b.distanceKm || 0,
          vehicleRatePerKm: b.vehicleRatePerKm || 15,
          vehicleTripCharge: b.vehicleTripCharge || 0,
          nightStayAmount: Number(b.nightStayAmount || local?.nightStayAmount || 0),
          nightStayNights: Number(b.nightStayNights || local?.nightStayNights || (b.nightStayAmount > 0 ? 1 : 0)),
          nightStayRemarks: b.nightStayRemarks || local?.nightStayRemarks || '',
          nightStayDate: b.nightStayDate || local?.nightStayDate || '',
          nightStayAddedByDriver: Boolean(b.nightStayAddedByDriver || local?.nightStayAddedByDriver),
          baseTripPay: Number(b.driverBaseTripPay || (b.driverCompensationAmount ? (b.driverCompensationAmount - (b.nightStayAmount || 0)) : 1000)),
          totalTripEarnings: Number(b.driverCompensationAmount || ((b.driverBaseTripPay || 1000) + (b.nightStayAmount || 0))),
          paymentStatus: resolvedStatus === 'Trip Completed' ? 'Pending Settlement' : 'Upcoming',
          adminInstructions: 'Trip accepted by driver. Please arrive at pickup 15 minutes before schedule.',
          tripNotes: b.tripRemarks || 'Standard passenger circuit.',
          invoice: b.invoice || null,
          invoiceNumber: b.invoiceNumber || '',
          expenses: tripCtx.getBookingExpenses ? tripCtx.getBookingExpenses(b.id) : []
        };
      });
  }, [tripCtx, authDriverId, localTrips]);

  // Synchronized notifications from shared TripContext
  const notifications = useMemo(() => {
    return tripCtx?.driverNotifications || [];
  }, [tripCtx]);

  // Synchronized expenses from shared TripContext for this driver
  const driverExpenses = useMemo(() => {
    if (!tripCtx || !tripCtx.expenses) return [];
    return tripCtx.expenses.filter((e) => e.driverId === authDriverId || e.driverId === 'DRV-001');
  }, [tripCtx, authDriverId]);

  // --- TRIP SEQUENTIAL LIFECYCLE ---
  const updateTripStatus = (tripId, targetStatus, metadata = {}) => {
    const cleanId = String(tripId).startsWith('ASN-') ? String(tripId).replace(/^ASN-/, '') : tripId;
    const targetTrip = trips.find(
      (t) =>
        t.id === tripId ||
        t.id === cleanId ||
        t.bookingId === tripId ||
        t.bookingId === cleanId ||
        t.bookingNumber === tripId ||
        t.bookingNumber === cleanId
    );
    if (!targetTrip) {
      toast.error('Trip not found');
      return false;
    }

    if (targetTrip.status === 'Cancelled') {
      toast.error('Cannot update a cancelled trip');
      return false;
    }

    // Forward immediately to shared TripContext
    if (targetStatus === 'Accepted' && tripCtx) {
      tripCtx.acceptTripAssignment(targetTrip.bookingId || targetTrip.id);
    } else if (targetStatus === 'Arrived at Pickup' && tripCtx) {
      if (tripCtx.arrivedAtPickup) {
        tripCtx.arrivedAtPickup(targetTrip.bookingId || targetTrip.id);
      } else {
        tripCtx.pushAdminNotification(
          `Driver Arrived at Pickup - ${targetTrip.bookingNumber || targetTrip.bookingId || targetTrip.id}`,
          `Driver has reached pickup point (${targetTrip.pickupLocation || 'reporting location'}) and reported ready.`,
          { bookingId: targetTrip.bookingId || targetTrip.id, type: 'trip' }
        );
        toast.success('Pickup arrival confirmed! Operations Desk notified.');
      }
    } else if (targetStatus === 'Trip Started' && tripCtx) {
      const ok = tripCtx.startTrip(targetTrip.bookingId || targetTrip.id, { forceStart: true, ...metadata });
      if (!ok) return false;
    } else if (targetStatus === 'Trip Completed' && tripCtx) {
      const ok = tripCtx.endTrip(targetTrip.bookingId || targetTrip.id, metadata);
      if (!ok) return false;
    }

    setLocalTrips((prev) => {
      const arr = Array.isArray(prev) ? prev : [];
      const updatedItem = {
        ...targetTrip,
        status: targetStatus,
        ...metadata
      };
      if (targetStatus === 'Trip Started' && metadata.startOdometer) {
        updatedItem.currentOdometer = metadata.startOdometer;
        updatedItem.startOdometer = metadata.startOdometer;
      }
      if (targetStatus === 'Trip Completed') {
        updatedItem.paymentStatus = 'Pending Settlement';
        if (metadata.endOdometer) {
          updatedItem.endOdometer = metadata.endOdometer;
        }
      }
      return [updatedItem, ...arr.filter((t) => t.id !== tripId && t.id !== cleanId && t.bookingId !== tripId && t.bookingId !== cleanId)];
    });

    // Update duty status
    if (targetStatus === 'Trip Started') {
      setDriver((prev) => ({ ...prev, dutyStatus: 'On Trip' }));
    } else if (targetStatus === 'Trip Completed') {
      setDriver((prev) => ({
        ...prev,
        dutyStatus: 'Available',
        totalTripsCompleted: (prev.totalTripsCompleted || 0) + 1
      }));
      // Add entry to earnings
      const newEarning = {
        id: `ERN-${Date.now().toString().slice(-4)}`,
        tripId: targetTrip.id,
        bookingId: targetTrip.bookingId,
        date: new Date().toISOString().substring(0, 10),
        tripCategory: targetTrip.tripCategory,
        driverAllowance: targetTrip.totalTripEarnings || targetTrip.driverBaseTripPay || targetTrip.baseTripPay || 0,
        extraAllowance: metadata.extraAllowance || 0,
        otherApprovedCharges: 0,
        totalEarnings: (targetTrip.totalTripEarnings || targetTrip.driverBaseTripPay || targetTrip.baseTripPay || 0) + (metadata.extraAllowance || 0),
        paymentStatus: 'Pending',
        paymentDate: null
      };
      setEarnings((prev) => [newEarning, ...prev]);
    }

    logActivity(`Trip #${targetTrip.bookingId} status updated to: ${targetStatus}`, 'trip');
    toast.success(`Trip status updated: ${targetStatus}`);
    return true;
  };

  // --- RECORD / ADD NIGHT STAY ALLOWANCE ---
  const addNightStay = async (tripId, nightStayData = {}) => {
    const cleanId = String(tripId).startsWith('ASN-') ? String(tripId).replace(/^ASN-/, '') : tripId;
    const targetTrip = trips.find(
      (t) =>
        t.id === tripId ||
        t.id === cleanId ||
        t.bookingId === tripId ||
        t.bookingId === cleanId ||
        t.bookingNumber === tripId ||
        t.bookingNumber === cleanId
    );
    if (!targetTrip) {
      toast.error('Trip not found');
      return false;
    }

    const nights = Math.max(1, Number(nightStayData.nights || 1));
    const ratePerNight = Number(nightStayData.ratePerNight || nightStayData.amountPerNight || 500);
    const totalAmount = Number(nightStayData.totalAmount || (nights * ratePerNight));
    const remarks = nightStayData.remarks || `Driver overnight stay (${nights} night${nights > 1 ? 's' : ''})`;
    const date = nightStayData.date || new Date().toISOString().substring(0, 10);

    // Call shared TripContext to update canonical booking & dispatch notifications
    if (tripCtx?.addNightStayToTrip) {
      await tripCtx.addNightStayToTrip(targetTrip.bookingId || targetTrip.id, {
        nights,
        ratePerNight,
        totalAmount,
        remarks,
        date,
        driverName: driver?.name || 'Driver'
      });
    }

    // Update local state immediately
    setLocalTrips((prev) => {
      const arr = Array.isArray(prev) ? prev : [];
      return arr.map((t) => {
        if (t.id === tripId || t.id === cleanId || t.bookingId === tripId || t.bookingId === cleanId) {
          const currentBase = Number(t.baseTripPay || t.driverBaseTripPay || (t.totalTripEarnings ? (t.totalTripEarnings - (t.nightStayAmount || 0)) : 0));
          return {
            ...t,
            nightStayAmount: totalAmount,
            nightStayNights: nights,
            nightStayRatePerNight: ratePerNight,
            nightStayRemarks: remarks,
            nightStayDate: date,
            nightStayAddedByDriver: true,
            baseTripPay: currentBase,
            totalTripEarnings: currentBase + totalAmount
          };
        }
        return t;
      });
    });

    logActivity(`Night stay allowance of ₹${totalAmount} recorded for Trip #${targetTrip.bookingNumber || targetTrip.bookingId}`, 'trip');
    return true;
  };

  const acceptTripAssignment = (assignmentId) => {
    if (!assignmentId) return;
    const cleanId = String(assignmentId).startsWith('ASN-') ? String(assignmentId).replace(/^ASN-/, '') : assignmentId;

    if (tripCtx) {
      tripCtx.acceptTripAssignment(assignmentId) || tripCtx.acceptTripAssignment(cleanId);
    }
    const assignment = pendingAssignments.find((a) =>
      a.id === assignmentId ||
      a.bookingId === assignmentId ||
      a.bookingNumber === assignmentId ||
      a.id === cleanId ||
      a.bookingId === cleanId
    );

    setDriver((prev) => ({ ...prev, dutyStatus: 'Assigned' }));
    logActivity(`Accepted trip assignment #${assignment?.bookingNumber || assignment?.bookingId || cleanId || assignmentId}`, 'trip');
  };

  const declineTripAssignment = (assignmentId, reason, explanation = '') => {
    if (!assignmentId) return;
    const cleanId = String(assignmentId).startsWith('ASN-') ? String(assignmentId).replace(/^ASN-/, '') : assignmentId;

    if (tripCtx) {
      tripCtx.declineTripAssignment(assignmentId, reason, explanation) || tripCtx.declineTripAssignment(cleanId, reason, explanation);
    }
    const assignment = pendingAssignments.find((a) =>
      a.id === assignmentId ||
      a.bookingId === assignmentId ||
      a.bookingNumber === assignmentId ||
      a.id === cleanId ||
      a.bookingId === cleanId
    );

    logActivity(`Declined assignment #${assignment?.bookingNumber || assignment?.bookingId || cleanId || assignmentId}. Reason: ${reason}`, 'warning');
  };

  const submitDriverRegistration = (formData) => {
    const nextNumber = applications.length + 1;
    const newAppId = `APP-2026-0${nextNumber < 10 ? '0' + nextNumber : nextNumber}`;

    const newApplication = {
      id: newAppId,
      driverId: `DRV-0${nextNumber < 10 ? '0' + nextNumber : nextNumber}`,
      fullName: formData.fullName,
      phone: formData.phone,
      altPhone: formData.altPhone || '',
      email: formData.email || '',
      dob: formData.dob,
      gender: formData.gender,
      address: `${formData.address}, ${formData.city}, ${formData.state} - ${formData.pincode}`,
      emergencyContactName: formData.emergencyContactName,
      emergencyContactPhone: formData.emergencyContactPhone,
      emergencyContactRelation: formData.emergencyContactRelation,
      licenseNumber: formData.licenseNumber,
      licenseHolderName: formData.licenseHolderName,
      licenseIssueDate: formData.licenseIssueDate,
      licenseExpiry: formData.licenseExpiry,
      licenseClass: formData.licenseClass,
      licenseFrontImage: formData.licenseFrontImage || 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=600&q=80',
      licenseBackImage: formData.licenseBackImage || 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=600&q=80',
      photo: formData.photo || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
      passportPhoto: formData.passportPhoto || formData.photo || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
      experienceYears: parseInt(formData.experienceYears) || 5,
      languages: formData.languages || ['Tamil', 'English'],
      preferredTripType: formData.preferredTripType || 'Tour Package & Outstation',
      previousExperience: formData.previousExperience || '',
      notes: formData.notes || '',
      status: 'Pending Verification',
      submittedDate: new Date().toISOString().substring(0, 10),
      reviewedDate: null,
      reviewedBy: null,
      adminRemarks: 'Application submitted successfully. Awaiting identity, license, and annual medical fitness verification by MAK Admin Operations Desk.'
    };

    setApplications((prev) => [newApplication, ...prev]);
    setCurrentAppId(newAppId);
    toast.success(`Registration submitted! Application ID: ${newAppId}`);
    return newApplication;
  };

  const simulateApplicationStatusChange = (appId, newStatus, remarks = '') => {
    setApplications((prev) =>
      prev.map((app) =>
        app.id === appId
          ? {
              ...app,
              status: newStatus,
              reviewedDate: new Date().toISOString().substring(0, 10),
              reviewedBy: 'Admin Ops Desk (Simulated)',
              adminRemarks: remarks || `Status transitioned to ${newStatus} by Admin Operations.`
            }
          : app
      )
    );
    toast.success(`Application #${appId} status updated to: ${newStatus}`);
  };

  const replaceDocument = (docId, newUrl, newExpiry, newFileName, notes) => {
    setDocuments((prev) =>
      prev.map((d) =>
        d.id === docId
          ? {
              ...d,
              fileUrl: newUrl || d.fileUrl,
              expiryDate: newExpiry !== undefined ? newExpiry : d.expiryDate,
              fileName: newFileName || d.fileName,
              status: 'Under Review',
              rejectionReason: '',
              uploadDate: new Date().toISOString().substring(0, 10),
              notes: notes || 'Updated document submitted for Admin verification.'
            }
          : d
      )
    );
    toast.success('Document re-uploaded. Queued for Admin verification.');
  };

  const uploadNewDocument = (docData) => {
    const newDoc = {
      id: `DOC-0${documents.length + 1}`,
      driverId: authDriverId,
      status: 'Under Review',
      uploadDate: new Date().toISOString().substring(0, 10),
      fileSize: '1.2 MB',
      fileType: docData.fileType || 'pdf',
      ...docData
    };
    setDocuments((prev) => [...prev, newDoc]);
    toast.success(`Document "${newDoc.title}" uploaded and queued for Admin verification.`);
  };

  const removeDocument = (docId) => {
    const target = documents.find((d) => d.id === docId);
    if (target?.required) {
      toast.error('Cannot remove a statutory mandatory document. You may replace or renew it instead.');
      return false;
    }
    setDocuments((prev) => prev.filter((d) => d.id !== docId));
    toast.success('Optional document removed successfully.');
    return true;
  };

  const updateProfile = async (updates) => {
    const resolvedName = updates.fullName || updates.displayName || updates.name || driver?.name;
    const resolvedAvatar = updates.avatar || updates.photo || driver?.avatar || driver?.photo;

    const merged = {
      ...(driver || {}),
      ...updates,
      name: resolvedName,
      fullName: resolvedName,
      displayName: resolvedName,
      photo: resolvedAvatar,
      avatar: resolvedAvatar
    };

    setDriver(merged);
    saveStoredJson('mak_driver_profile_cache', merged);

    if (tripCtx?.updateDriver && authDriverId) {
      tripCtx.updateDriver(authDriverId, merged);
    }

    try {
      const activeUser = loadStoredJson('mak_erp_auth_user', null);
      if (activeUser && (activeUser.role === 'driver' || activeUser.portal === 'driver')) {
        const updatedAuth = {
          ...activeUser,
          name: merged.name,
          fullName: merged.fullName,
          avatar: merged.avatar,
          phone: merged.phone,
          address: merged.address,
          emergencyContact: merged.emergencyContact
        };
        localStorage.setItem('mak_erp_auth_user', JSON.stringify(updatedAuth));
        window.dispatchEvent(new CustomEvent('mak_staff_profile_updated', { detail: updatedAuth }));
      }
    } catch (_) {}

    try {
      await authService.updateProfile({
        name: merged.name,
        fullName: merged.fullName,
        phone: merged.phone,
        avatar: merged.avatar,
        address: merged.address,
        emergencyContact: merged.emergencyContact
      });
    } catch (err) {
      console.warn('Backend update error in DriverDataContext:', err?.message);
    }

    toast.success('Driver profile updated successfully');
  };

  const setDutyStatus = (status) => {
    setDriver((prev) => ({ ...prev, dutyStatus: status }));
    toast.info(`Duty status set to: ${status}`);
  };

  const requestLeave = (leaveData) => {
    const newLeave = {
      id: `LV-0${leaveRequests.length + 1}`,
      driverId: authDriverId,
      startDate: leaveData.startDate,
      endDate: leaveData.endDate,
      reason: leaveData.reason,
      status: 'Under Review',
      appliedOn: new Date().toISOString().substring(0, 10)
    };
    setLeaveRequests((prev) => [newLeave, ...prev]);
    toast.success('Leave application submitted for Admin approval.');
    return newLeave;
  };

  const markNotificationRead = (notifId) => {
    if (tripCtx) tripCtx.markDriverNotificationRead(notifId);
  };

  const markAllNotificationsRead = () => {
    if (tripCtx) tripCtx.markAllDriverNotificationsRead();
  };

  const createSupportTicket = (ticketData) => {
    const newId = `TCK-DRV-${Date.now().toString().slice(-4)}`;
    const newTicket = {
      id: newId,
      ticketNumber: `#DRV-${800 + supportTickets.length + 1}`,
      driverId: authDriverId,
      status: 'Open',
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      messages: [{ sender: driver.name, senderRole: 'Driver', time: 'Just now', content: ticketData.description }],
      ...ticketData
    };
    setSupportTickets((prev) => [newTicket, ...prev]);
    toast.success(`Support ticket ${newTicket.ticketNumber} created`);
    return newTicket;
  };

  const replySupportTicket = (ticketId, content) => {
    const newMsg = { sender: driver.name, senderRole: 'Driver', time: 'Just now', content };
    setSupportTickets((prev) =>
      prev.map((t) => (t.id === ticketId ? { ...t, status: 'Waiting for Admin', updatedAt: 'Just now', messages: [...t.messages, newMsg] } : t))
    );
    toast.success('Reply submitted to Admin desk');
  };

  const triggerEmergencySos = (tripId, details = '') => {
    setSosActive(true);
    logActivity(`EMERGENCY SOS Triggered for Trip #${tripId || 'N/A'}. Control room alerted.`, 'sos');
    toast.error('EMERGENCY SOS ALERT SENT TO MAK 24x7 CONTROL ROOM & POLICE');
  };

  // Synchronized earnings including active/accepted trips
  const driverEarnings = useMemo(() => {
    const list = [...(earnings || [])];
    const seenBookingIds = new Set(list.map((e) => e.bookingId));

    (trips || []).forEach((t) => {
      if (!seenBookingIds.has(t.id) && !seenBookingIds.has(t.bookingId)) {
        seenBookingIds.add(t.id);
        const nightHalt = Number(t.nightStayAmount || 0);
        const basePay = Number(t.baseTripPay || t.driverBaseTripPay || (t.totalTripEarnings ? (t.totalTripEarnings - nightHalt) : 0));
        const total = basePay + nightHalt;
        list.push({
          id: `EARN-${t.id}`,
          tripId: t.bookingNumber || t.bookingId || t.id,
          bookingId: t.bookingId || t.id,
          date: t.pickupDate || '2026-11-22',
          basePay,
          driverAllowance: basePay,
          nightHaltingFee: nightHalt,
          nightStayAmount: nightHalt,
          extraAllowance: nightHalt,
          totalEarnings: total,
          paymentStatus: t.status === 'Trip Completed' ? 'Paid' : 'Pending',
          tripCategory: t.tripCategory || 'Round Trip',
          route: `${t.pickupLocation} → ${t.destination}`
        });
      }
    });

    return list;
  }, [earnings, trips]);

  const value = {
    driver,
    setDriver,
    applications,
    currentAppId,
    setCurrentAppId,
    trips,
    pendingAssignments,
    earnings: driverEarnings,
    payments,
    expenses: driverExpenses,
    driverExpenses,
    documents,
    notifications,
    supportTickets,
    feedback: initialDriverFeedback,
    leaveRequests,
    driverActivities,
    emergencyContacts,
    sosActive,
    setSosActive,
    updateTripStatus,
    addNightStay,
    acceptTripAssignment,
    declineTripAssignment,
    submitDriverRegistration,
    simulateApplicationStatusChange,
    replaceDocument,
    uploadNewDocument,
    removeDocument,
    updateProfile,
    setDutyStatus,
    requestLeave,
    markNotificationRead,
    markAllNotificationsRead,
    createSupportTicket,
    replySupportTicket,
    triggerEmergencySos
  };

  return (
    <DriverDataContext.Provider value={value}>
      {children}
    </DriverDataContext.Provider>
  );
}

export const useDriverData = () => {
  const context = useContext(DriverDataContext);
  if (!context) {
    throw new Error('useDriverData must be used within a DriverDataProvider');
  }
  return context;
};

export default DriverDataContext;
