// MAK Tours & Travels ERP - Role-Based Portal Route Protection
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export function ProtectedRoute({ children, portal }) {
  const { isAuthenticated, currentUser } = useAuth();
  const location = useLocation();

  // SECTION 5.1: If not authenticated, redirect to /login with state and role param
  if (!isAuthenticated || !currentUser) {
    const roleParam = portal ? `?role=${portal}` : '';
    return <Navigate to={`/login${roleParam}`} state={{ from: location }} replace />;
  }

  const role = String(currentUser.role || '').toLowerCase().replace('-', '_');
  const userPortal = String(currentUser.portal || '').toLowerCase();
  const isAdminTier = [
    'admin',
    'company_admin',
    'super_admin',
    'operations',
    'fleet_manager'
  ].includes(role);

  // Validate that the user's role actually matches the requested portal:
  let isAllowed = false;

  if (portal === 'super-admin') {
    // Strictly isolate Super Admin: Company Admins can NEVER access Super Admin routes
    isAllowed = role === 'super_admin';
  } else if (portal === 'accountant') {
    // Accountant portal: accessible by accountant, finance_admin, and company/super admins
    isAllowed =
      ['accountant', 'finance_admin', 'admin', 'company_admin', 'super_admin'].includes(role) ||
      userPortal === 'accountant';
  } else if (portal === 'admin') {
    // Only Admin tiers can access Admin Portal; Accountant, Staff, Drivers, and Vendors cannot access Admin routes
    isAllowed =
      isAdminTier &&
      userPortal !== 'staff' &&
      userPortal !== 'driver' &&
      userPortal !== 'vendor' &&
      userPortal !== 'accountant' &&
      role !== 'accountant' &&
      role !== 'finance_admin';
  } else if (portal === 'staff') {
    // Staff/Employees have direct access; Admins can also inspect/preview staff portal
    const isStaffRole = ['employee', 'staff'].includes(role);
    const isStaffSession = userPortal === 'staff' || Boolean(currentUser.employeeCode || currentUser.employeeId);
    isAllowed = isStaffRole || isStaffSession || isAdminTier;
  } else if (portal === 'driver') {
    // Drivers have direct access; Admins can also inspect/preview driver portal
    const isDriverRole = role === 'driver';
    const isDriverSession = userPortal === 'driver' || Boolean(currentUser.driverId || currentUser.driverBadgeId);
    isAllowed = isDriverRole || isDriverSession || isAdminTier;
  } else if (portal === 'vendor') {
    // Vendors have direct access; Admins can also inspect/preview vendor portal
    const isVendorRole = role === 'vendor' || role.includes('vendor');
    const isVendorSession = userPortal === 'vendor' || Boolean(currentUser.vendorId);
    const isVendorEmail = Boolean(
      currentUser.email &&
      (currentUser.email.toLowerCase().includes('vendor') || currentUser.email.toLowerCase().includes('apexfleet') || currentUser.email.toLowerCase().includes('royaltravels'))
    );
    isAllowed = isVendorRole || isVendorSession || isVendorEmail || isAdminTier;
  } else {
    isAllowed = true;
  }

  // If authenticated with the wrong role, redirect to /unauthorized (not /login)
  if (!isAllowed) {
    return <Navigate to="/unauthorized" state={{ from: location, targetPortal: portal }} replace />;
  }

  // Tenant account suspension / license expiry gate for normal company users
  if (role !== 'super_admin' && currentUser?.tenant) {
    if (currentUser.tenant.status === 'Suspended' && location.pathname !== '/account-suspended') {
      return <Navigate to="/account-suspended" replace />;
    }
    if (currentUser.tenant.licenseStatus === 'Expired' && location.pathname !== '/license-expired') {
      return <Navigate to="/license-expired" replace />;
    }
  }

  // Driver application review gate: If driver application is pending, route to application-status
  if (role === 'driver' && ['Pending Verification', 'Under Review'].includes(currentUser.approvalStatus)) {
    if (location.pathname !== '/driver/application-status') {
      return <Navigate to="/driver/application-status" replace />;
    }
  }

  return children;
}

export default ProtectedRoute;
