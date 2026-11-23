// MAK Tours & Travels ERP - Vendor Data Context
// Connected to shared TripContext data and scoped to the authenticated Vendor Partner
import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import {
  initialVendorProfile,
  initialVendorVehicles,
  initialVendorDrivers,
  initialBookingRequests,
  initialVendorBookings,
  initialVendorTrips,
  initialVendorPricing,
  initialVendorInvoices,
  initialVendorPayments,
  initialVendorTickets,
  initialVendorNotifications,
  initialVendorAnnouncements
} from '../data/vendorPortalData';
import { useToast } from './ToastContext';
import { useTripContext } from './TripContext';
import { useAuth } from '../hooks/useAuth';
import { loadStoredJson, saveStoredJson } from '../utils/storage';
import { generateId } from '../utils/idGenerator';
import { vehicleService } from '../services/vehicleService';

export const VendorDataContext = createContext();

export function VendorDataProvider({ children }) {
  const toast = useToast();
  const tripCtx = useTripContext();
  const { currentUser } = useAuth();

  // Active authenticated vendor ID
  const activeVendorId = currentUser?.vendorId || (currentUser?.email?.includes('royal') ? 'VND-002' : 'VND-001');

  // Vendor Profile
  const [profile, setProfile] = useState(() => {
    const stored = loadStoredJson('mak_vendor_profile_v6', null);
    if (stored) return stored;
    if (currentUser?.role === 'vendor') {
      return {
        ...initialVendorProfile,
        id: activeVendorId,
        businessName: currentUser.name || initialVendorProfile.businessName,
        email: currentUser.email || initialVendorProfile.email
      };
    }
    return initialVendorProfile;
  });

  const [localVehicles, setLocalVehicles] = useState(() => loadStoredJson('mak_vendor_vehicles_v7', initialVendorVehicles));
  const [localDrivers, setLocalDrivers] = useState(() => loadStoredJson('mak_vendor_drivers_v7', initialVendorDrivers));
  const [localRequests, setLocalRequests] = useState(() => loadStoredJson('mak_vendor_requests_v7', initialBookingRequests));
  const [pricing, setPricing] = useState(() => loadStoredJson('mak_vendor_pricing_v7', initialVendorPricing));
  const [invoices, setInvoices] = useState(() => loadStoredJson('mak_vendor_invoices_v7', initialVendorInvoices));
  const [payments, setPayments] = useState(() => loadStoredJson('mak_vendor_payments_v7', initialVendorPayments));
  const [tickets, setTickets] = useState(() => loadStoredJson('mak_vendor_tickets_v7', initialVendorTickets));
  const [notifications, setNotifications] = useState(() => loadStoredJson('mak_vendor_notifications_v7', initialVendorNotifications));
  const [recentActivities, setRecentActivities] = useState(() => loadStoredJson('mak_vendor_activity_v7', []));

  useEffect(() => { saveStoredJson('mak_vendor_profile_v7', profile); }, [profile]);
  useEffect(() => { saveStoredJson('mak_vendor_vehicles_v7', localVehicles); }, [localVehicles]);
  useEffect(() => { saveStoredJson('mak_vendor_drivers_v7', localDrivers); }, [localDrivers]);
  useEffect(() => { saveStoredJson('mak_vendor_requests_v7', localRequests); }, [localRequests]);
  useEffect(() => { saveStoredJson('mak_vendor_pricing_v7', pricing); }, [pricing]);
  useEffect(() => { saveStoredJson('mak_vendor_invoices_v7', invoices); }, [invoices]);
  useEffect(() => { saveStoredJson('mak_vendor_payments_v7', payments); }, [payments]);
  useEffect(() => { saveStoredJson('mak_vendor_tickets_v7', tickets); }, [tickets]);
  useEffect(() => { saveStoredJson('mak_vendor_notifications_v7', notifications); }, [notifications]);
  useEffect(() => { saveStoredJson('mak_vendor_activity_v7', recentActivities); }, [recentActivities]);

  const logActivity = (action, details) => {
    const newAct = {
      id: Date.now(),
      action,
      details,
      timestamp: 'Just now'
    };
    setRecentActivities((prev) => [newAct, ...prev.slice(0, 19)]);
  };

  // 1. Shared Fleet Vehicles (Filtered by Vendor ID or assigned to Vendor, excluding deleted/archived)
  const vehicles = useMemo(() => {
    if (!tripCtx || !tripCtx.vehicles) return [];
    return tripCtx.vehicles.filter((v) => {
      if (v.isDeleted === true || v.status === 'Inactive') return false;
      const vId = String(v.vendorId || '').toUpperCase();
      const cleanActiveId = String(activeVendorId || '').toUpperCase();
      return (
        vId === cleanActiveId ||
        (cleanActiveId === 'VND-001' && (vId === 'VND-101' || v.vendorCode === 'MAK-VND-001' || v.id === 'VEH-023')) ||
        (v.ownership === 'Vendor Attached' && !v.vendorId)
      );
    });
  }, [tripCtx?.vehicles, activeVendorId]);

  // 2. Shared Drivers
  const drivers = useMemo(() => {
    if (!tripCtx || !tripCtx.drivers) return localDrivers;
    const vendorDrivers = tripCtx.drivers.filter((d) => d.vendorId === activeVendorId || d.company === profile.businessName);
    if (vendorDrivers.length > 0) return vendorDrivers;
    return localDrivers;
  }, [tripCtx, activeVendorId, profile.businessName, localDrivers]);

  // 3. Shared Bookings & Trips
  const bookings = useMemo(() => {
    if (!tripCtx || !tripCtx.bookings) return initialVendorBookings;
    const vehicleIds = new Set(vehicles.map((v) => v.id));
    const vendorBookings = tripCtx.bookings
      .filter((b) => b.vendorId === activeVendorId || vehicleIds.has(b.vehicleId) || vehicleIds.has(b.assignedVehicle?.id))
      .map((b) => ({
        id: b.id,
        bookingId: b.id,
        bookingNumber: b.bookingNumber || b.id,
        customerName: b.customerName || b.fullName || 'Valued Guest',
        customerPhone: b.customerPhone || b.mobileNumber || b.phone || '',
        bookingCategory: b.bookingCategory,
        travelDate: b.journeyDate,
        travelEndDate: b.returnDate,
        pickupLocation: b.pickupLocation,
        dropLocation: b.destination,
        passengerCount: b.passengerCount,
        vehicleId: b.vehicleId,
        vehicleName: b.vehicleName,
        driverId: b.driverId,
        driverName: b.driverName || 'Assigned by MAK Dispatch',
        bookingAmount: b.totalAmount,
        adminCommission: Math.round(b.totalAmount * 0.15),
        vendorPayable: Math.round(b.totalAmount * 0.85),
        paidAmount: b.advancePaid || 0,
        remainingAmount: b.balanceAmount || 0,
        paymentStatus: b.bookingStatus === 'Completed' ? 'Settled' : 'Pending Settlement',
        bookingStatus: b.bookingStatus,
        tripStatus: b.tripStatus,
        assignedAt: b.createdAt
      }));

    if (vendorBookings.length > 0) return vendorBookings;
    return initialVendorBookings;
  }, [tripCtx, vehicles, activeVendorId]);

  const trips = useMemo(() => {
    return bookings.map((b) => ({
      id: `TRP-${b.id}`,
      bookingId: b.id,
      tripCategory: b.bookingCategory,
      customerName: b.customerName || b.fullName || 'Valued Guest',
      customerPhone: b.customerPhone || b.mobileNumber || b.phone || '',
      pickupLocation: b.pickupLocation,
      dropLocation: b.dropLocation,
      pickupDate: b.travelDate,
      returnDate: b.travelEndDate,
      vehicleId: b.vehicleId,
      vehicleName: b.vehicleName,
      driverName: b.driverName,
      status: b.tripStatus === 'Completed' ? 'Completed' : b.tripStatus === 'In Progress' ? 'In Progress' : 'Scheduled',
      payoutAmount: b.vendorPayable
    }));
  }, [bookings]);

  // 4. Booking Requests: bookings awaiting vehicle or vendor allocation
  const bookingRequests = useMemo(() => {
    if (!tripCtx || !tripCtx.bookings) return localRequests;
    const openBookings = tripCtx.bookings
      .filter((b) => b.bookingStatus === 'Pending' && (!b.vehicleId || b.vendorId === activeVendorId))
      .map((b) => ({
        id: `REQ-${b.id}`,
        bookingId: b.id,
        customerName: b.customerName,
        phone: b.customerPhone,
        bookingCategory: b.bookingCategory,
        travelDate: b.journeyDate,
        travelEndDate: b.returnDate,
        pickupLocation: b.pickupLocation,
        dropLocation: b.destination,
        passengerCount: b.passengerCount,
        bookingAmount: b.totalAmount,
        adminCommission: Math.round(b.totalAmount * 0.15),
        vendorPayable: Math.round(b.totalAmount * 0.85),
        status: 'Pending',
        receivedAt: 'Just now'
      }));

    if (openBookings.length > 0) return openBookings;
    return localRequests;
  }, [tripCtx, activeVendorId, localRequests]);

  // --- ACTIONS (Write to shared state & local) ---
  const addVehicle = async (vehicleData) => {
    const newId = generateId('VEH', { useYear: false });
    const vendorDisplayName = profile.businessName || profile.companyName || currentUser?.name || 'Apex Fleet Solutions Pvt Ltd';
    const vendorDisplayCode = profile.vendorCode || 'MAK-VND-001';
    const vendorPhone = profile.phone || currentUser?.phone || '+91 98840 55112';
    const vendorCity = profile.city || 'Chennai';
    const vName = vehicleData.name || `${vehicleData.brand || ''} ${vehicleData.model || ''}`.trim() || vehicleData.regNo || 'Vendor Attached Vehicle';

    const newVehicle = {
      ...vehicleData,
      id: newId,
      name: vName,
      vendorId: profile.vendorId || activeVendorId || 'VND-101',
      vendorName: vendorDisplayName,
      vendorCode: vendorDisplayCode,
      vendorContact: vendorPhone,
      vendorCity: vendorCity,
      ownership: 'Vendor Attached',
      ownershipType: 'Vendor Owned',
      status: 'Available',
      ratePerKm: vehicleData.perKmRate || 18,
      minKmPerDay: vehicleData.minKmPerDay || 250,
      driverAllowance: vehicleData.driverBata || 450,
      seating: vehicleData.seatingCapacity ? `${vehicleData.seatingCapacity} Seater` : '7 Seater',
      image: (vehicleData.images && vehicleData.images[0]) || vehicleData.image || '',
      images: Array.isArray(vehicleData.images) && vehicleData.images.length > 0 ? vehicleData.images : (vehicleData.image ? [vehicleData.image] : [])
    };

    // 1. Write to backend API
    try {
      const res = await vehicleService.create(newVehicle);
      if (res?.data) {
        Object.assign(newVehicle, res.data);
      }
    } catch (err) {
      console.warn('Vehicle backend registration deferred:', err);
    }

    // 2. Write to authoritative shared TripContext
    if (tripCtx && tripCtx.addVehicle) {
      tripCtx.addVehicle(newVehicle);
    }

    // 3. Update local Vendor state & storage (avoiding duplicates)
    setLocalVehicles((prev) => [
      newVehicle,
      ...prev.filter((v) => v.id !== newVehicle.id && (v.regNo || '').replace(/\s+/g, '').toUpperCase() !== (newVehicle.regNo || '').replace(/\s+/g, '').toUpperCase())
    ]);
    logActivity('Vehicle Added', `${newVehicle.brand} ${newVehicle.model} (${newVehicle.regNo}) registered under ${vendorDisplayName}`);
    toast.success(`Vehicle ${newVehicle.regNo} successfully added to fleet under ${vendorDisplayName}!`);
    return newVehicle;
  };

  const updateVehicle = (id, updatedData) => {
    const payload = {
      ...updatedData
    };
    if (Array.isArray(updatedData.images) && updatedData.images.length > 0) {
      payload.image = updatedData.images[0];
    }
    if (tripCtx && tripCtx.updateVehicle) {
      tripCtx.updateVehicle(id, payload);
    }
    setLocalVehicles((prev) =>
      prev.map((v) => (v.id === id ? { ...v, ...payload } : v))
    );
    logActivity('Vehicle Updated', `Updated vehicle #${id}`);
    toast.success('Vehicle details updated successfully');
  };

  const deleteVehicle = async (id) => {
    let result = false;
    if (tripCtx && tripCtx.deleteVehicle) {
      result = await tripCtx.deleteVehicle(id, { vendorId: activeVendorId });
    }
    if (result) {
      setLocalVehicles((prev) => {
        const filtered = prev.filter((x) => x.id !== id && x._id !== id && x.regNo !== id);
        saveStoredJson('mak_vendor_vehicles_v7', filtered);
        return filtered;
      });
      logActivity('Vehicle Removed', `Removed vehicle #${id}`);
    }
    return result;
  };

  const setVehicleMaintenance = (id, isMaintenance, reason = 'Periodic service') => {
    const newStatus = isMaintenance ? 'Maintenance' : 'Available';
    if (tripCtx && tripCtx.updateVehicleStatus) {
      tripCtx.updateVehicleStatus(id, newStatus);
    }
    setLocalVehicles((prev) =>
      prev.map((v) => (v.id === id ? { ...v, status: newStatus, maintenanceReason: isMaintenance ? reason : null } : v))
    );
    logActivity(
      isMaintenance ? 'Vehicle to Maintenance' : 'Maintenance Completed',
      `Vehicle #${id} marked as ${newStatus}`
    );
    toast.success(`Vehicle status updated to ${newStatus}`);
  };

  const addDriver = (driverData) => {
    const newId = generateId('DRV', { useYear: false });
    const newDriver = {
      id: newId,
      vendorId: activeVendorId,
      status: 'Active',
      dutyStatus: 'Available',
      rating: 5.0,
      tripsCompleted: 0,
      ...driverData
    };

    if (tripCtx && tripCtx.addDriver) {
      tripCtx.addDriver(newDriver);
    }
    setLocalDrivers((prev) => [newDriver, ...prev]);
    logActivity('Driver Added', `Driver ${newDriver.name} onboarded`);
    toast.success('Driver profile enrolled into roster');
    return newDriver;
  };

  const updateDriver = (id, updatedData) => {
    if (tripCtx && tripCtx.updateDriver) {
      tripCtx.updateDriver(id, updatedData);
    }
    setLocalDrivers((prev) =>
      prev.map((d) => (d.id === id ? { ...d, ...updatedData } : d))
    );
    logActivity('Driver Updated', `Updated profile for #${id}`);
    toast.success('Driver details updated');
  };

  const deleteDriver = (id) => {
    if (tripCtx && tripCtx.deleteDriver) {
      tripCtx.deleteDriver(id);
    }
    setLocalDrivers((prev) => prev.filter((d) => d.id !== id));
    logActivity('Driver Removed', `Removed driver #${id}`);
    toast.success('Driver record archived');
  };

  const acceptBookingRequest = (requestId, vehicleId) => {
    const req = bookingRequests.find((r) => r.id === requestId);
    if (!req) return;

    const assignedVeh = vehicles.find((v) => v.id === vehicleId) || vehicles[0];

    // Update shared booking in TripContext
    if (tripCtx && tripCtx.assignVehicle) {
      tripCtx.assignVehicle(req.bookingId, assignedVeh.id, `${assignedVeh.brand} ${assignedVeh.model} (${assignedVeh.regNo})`);
    }

    setLocalRequests((prev) =>
      prev.map((r) => (r.id === requestId ? { ...r, status: 'Confirmed' } : r))
    );

    logActivity('Booking Accepted', `Accepted booking #${req.bookingId} with ${assignedVeh.regNo}`);
    toast.success(`Booking #${req.bookingId} accepted and vehicle allocated!`);
  };

  const rejectBookingRequest = (requestId, reason, explanation = '') => {
    setLocalRequests((prev) =>
      prev.map((r) =>
        r.id === requestId ? { ...r, status: 'Rejected', rejectionReason: reason, rejectionExplanation: explanation } : r
      )
    );
    logActivity('Booking Rejected', `Rejected request #${requestId} (${reason})`);
    toast.warning(`Booking request declined`);
  };

  const updateProfile = (updates) => {
    setProfile((prev) => ({ ...prev, ...updates }));
    toast.success('Vendor profile updated');
  };

  const updateVehiclePricing = (vehicleId, pricingUpdates) => {
    setPricing((prev) => ({
      ...prev,
      vehicles: prev.vehicles.map((v) => (v.vehicleId === vehicleId ? { ...v, ...pricingUpdates } : v))
    }));
    toast.success('Vehicle pricing configuration updated');
  };

  const updateTripPricing = (tripType, pricingUpdates) => {
    setPricing((prev) => ({
      ...prev,
      tripTypes: prev.tripTypes.map((t) => (t.tripType === tripType ? { ...t, ...pricingUpdates } : t))
    }));
    toast.success('Trip type pricing rule updated');
  };

  const addInvoice = (invoiceData) => {
    const newInvoice = {
      id: generateId('INV', { useYear: true }),
      invoiceNumber: `APX/26-27/${Date.now().toString().slice(-4)}`,
      vendorId: activeVendorId,
      status: 'Pending',
      issueDate: new Date().toISOString().substring(0, 10),
      dueDate: new Date(Date.now() + 10 * 86400000).toISOString().substring(0, 10),
      balanceDue: invoiceData.netPayable || invoiceData.grossAmount || 0,
      paidAmount: 0,
      pdfUrl: '#',
      ...invoiceData
    };
    setInvoices((prev) => [newInvoice, ...prev]);
    logActivity('Invoice Uploaded', `Invoice ${newInvoice.invoiceNumber} submitted for audit`);
    toast.success('Invoice uploaded and queued for finance audit');
    return newInvoice;
  };

  const createSupportTicket = (ticketData) => {
    const newId = generateId('TCK', { useYear: false });
    const newTicket = {
      id: newId,
      ticketNumber: `#SUP-${Date.now().toString().slice(-4)}`,
      vendorId: activeVendorId,
      status: 'Open',
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      messages: [{ sender: profile.ownerName, senderRole: 'Vendor', time: 'Just now', content: ticketData.description }],
      ...ticketData
    };
    setTickets((prev) => [newTicket, ...prev]);
    logActivity('Support Ticket Created', `Raised ticket ${newTicket.ticketNumber}`);
    toast.success(`Support ticket ${newTicket.ticketNumber} created`);
    return newTicket;
  };

  const replySupportTicket = (ticketId, content) => {
    const msg = { sender: profile.ownerName, senderRole: 'Vendor', time: 'Just now', content };
    setTickets((prev) =>
      prev.map((t) => (t.id === ticketId ? { ...t, status: 'Waiting for Admin', updatedAt: 'Just now', messages: [...t.messages, msg] } : t))
    );
    toast.success('Reply submitted to Admin desk');
  };

  const markNotificationAsRead = (id) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
  };

  const markAllNotificationsAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    toast.success('All notifications marked as read');
  };

  // KPIs
  const totalVehiclesCount = vehicles.length;
  const availableVehiclesCount = vehicles.filter((v) => v.status === 'Available').length;
  const reservedVehiclesCount = vehicles.filter((v) => v.status === 'Reserved').length;
  const onTripVehiclesCount = vehicles.filter((v) => v.status === 'On Trip').length;
  const maintenanceVehiclesCount = vehicles.filter((v) => v.status === 'Maintenance').length;
  const totalDriversCount = drivers.length;
  const pendingRequestsCount = bookingRequests.filter((r) => r.status === 'Pending').length;
  const confirmedBookingsCount = bookings.filter((b) => b.bookingStatus === 'Confirmed').length;
  const completedTripsCount = trips.filter((t) => t.status === 'Completed').length;
  const pendingPaymentsAmount = bookings.reduce((sum, b) => sum + (b.remainingAmount || 0), 0);
  const totalRevenueAmount = bookings.reduce((sum, b) => sum + (b.vendorPayable || 0), 0);
  const totalOutstandingAmount = invoices
    .filter((inv) => inv.status === 'Pending')
    .reduce((sum, inv) => sum + (inv.balanceDue || 0), 0);

  const value = {
    profile,
    updateProfile,
    vehicles,
    addVehicle,
    updateVehicle,
    deleteVehicle,
    setVehicleMaintenance,
    drivers,
    addDriver,
    updateDriver,
    deleteDriver,
    bookingRequests,
    acceptBookingRequest,
    rejectBookingRequest,
    bookings,
    trips,
    pricing,
    updateVehiclePricing,
    updateTripPricing,
    invoices,
    addInvoice,
    payments,
    tickets,
    createSupportTicket,
    replySupportTicket,
    notifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    announcements: initialVendorAnnouncements,
    recentActivities,
    kpis: {
      totalVehicles: totalVehiclesCount,
      availableVehicles: availableVehiclesCount,
      reservedVehicles: reservedVehiclesCount,
      onTripVehicles: onTripVehiclesCount,
      vehiclesOnTrip: onTripVehiclesCount,
      vehiclesUnderMaintenance: maintenanceVehiclesCount,
      totalDrivers: 0,
      pendingRequests: pendingRequestsCount,
      confirmedBookings: confirmedBookingsCount,
      completedTrips: completedTripsCount,
      pendingPayments: pendingPaymentsAmount,
      totalRevenue: totalRevenueAmount,
      totalOutstanding: totalOutstandingAmount
    }
  };

  return (
    <VendorDataContext.Provider value={value}>
      {children}
    </VendorDataContext.Provider>
  );
}

export const useVendorData = () => {
  const context = useContext(VendorDataContext);
  if (!context) {
    throw new Error('useVendorData must be used within a VendorDataProvider');
  }
  return context;
};

export default VendorDataContext;
