import React, { Suspense } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { RouteErrorBoundary } from '../components/common/RouteErrorBoundary';

// Layouts
import { SuperAdminLayout } from '../layouts/SuperAdminLayout';
import { AdminLayout } from '../layouts/AdminLayout';
import { DriverLayout } from '../layouts/DriverLayout';
import { VendorLayout } from '../layouts/VendorLayout';
import { ProtectedRoute } from './ProtectedRoute';

// Unified Login Page (Double Card Slider with Role Selector Pills)
import { LoginPage } from '../pages/auth/LoginPage';

// Common Pages
import { NotFound } from '../pages/common/NotFound';
import { Unauthorized } from '../pages/common/Unauthorized';
import { LicenseLockoutPage } from '../pages/common/LicenseLockoutPage';

// Super Admin Pages (Direct imports for zero chunk latency)
import SuperAdminDashboard from '../pages/super-admin/SuperAdminDashboard';
import SuperAdminCompanies from '../pages/super-admin/SuperAdminCompanies';
import SuperAdminUsers from '../pages/super-admin/SuperAdminUsers';
import SuperAdminRoles from '../pages/super-admin/SuperAdminRoles';
import SuperAdminPermissions from '../pages/super-admin/SuperAdminPermissions';
import SuperAdminAuditLogs from '../pages/super-admin/SuperAdminAuditLogs';
import SuperAdminSettings from '../pages/super-admin/SuperAdminSettings';
import { CompanyRegisterPage } from '../pages/auth/CompanyRegisterPage';

// Admin Portal Pages - Dedicated Enterprise Modules (Direct imports for instant navigation & zero chunk latency)
import AdminDashboard from '../pages/admin/dashboard/AdminDashboard';
import BookingList from '../pages/admin/bookings/BookingList';
import BookingCreate from '../pages/admin/bookings/BookingCreate';
import BookingDetails from '../pages/admin/bookings/BookingDetails';
import BookingEdit from '../pages/admin/bookings/BookingEdit';

import TourPackageList from '../pages/admin/tour-packages/TourPackageList';
import TourPackageCreate from '../pages/admin/tour-packages/TourPackageCreate';
import TourPackageDetails from '../pages/admin/tour-packages/TourPackageDetails';
import TourPackageEdit from '../pages/admin/tour-packages/TourPackageEdit';

import FleetList from '../pages/admin/fleet/FleetList';
import FleetCreate from '../pages/admin/fleet/FleetCreate';
import FleetDetails from '../pages/admin/fleet/FleetDetails';
import FleetEdit from '../pages/admin/fleet/FleetEdit';

import DriverList from '../pages/admin/drivers/DriverList';
import DriverCreate from '../pages/admin/drivers/DriverCreate';
import DriverDetails from '../pages/admin/drivers/DriverDetails';
import DriverEdit from '../pages/admin/drivers/DriverEdit';
import DriverApplications from '../pages/admin/drivers/DriverApplications';

import CustomerList from '../pages/admin/customers/CustomerList';
import CustomerCreate from '../pages/admin/customers/CustomerCreate';
import CustomerDetails from '../pages/admin/customers/CustomerDetails';
import CustomerEdit from '../pages/admin/customers/CustomerEdit';

import VendorList from '../pages/admin/vendors/VendorList';
import VendorCreate from '../pages/admin/vendors/VendorCreate';
import VendorDetails from '../pages/admin/vendors/VendorDetails';
import VendorEdit from '../pages/admin/vendors/VendorEdit';

import FinanceDashboard from '../pages/admin/finance/FinanceDashboard';
import PaymentsList from '../pages/admin/payments/PaymentsList';
import ExpensesList from '../pages/admin/expenses/ExpensesList';
import EmployeeList from '../pages/admin/employees/EmployeeList';
import AttendanceManagement from '../pages/admin/attendance/AttendanceManagement';
import PayrollManagement from '../pages/admin/payroll/PayrollManagement';
import ReportsDashboard from '../pages/admin/reports/ReportsDashboard';
import NotificationsCenter from '../pages/admin/notifications/NotificationsCenter';
import SettingsPage from '../pages/admin/settings/SettingsPage';
import AdminUnauthorized from '../pages/admin/AdminUnauthorized';
import AdminNotFound from '../pages/admin/AdminNotFound';

// Driver Pages - Dedicated Enterprise Modules (Direct imports for instant navigation & zero chunk latency)
import { DriverLogin } from '../pages/driver/DriverLogin';
import { DriverRegister } from '../pages/driver/DriverRegister';
import { DriverApplicationStatus } from '../pages/driver/DriverApplicationStatus';
import { DriverForgotPassword } from '../pages/driver/DriverForgotPassword';
import { DriverDashboard } from '../pages/driver/DriverDashboard';
import { DriverTrips } from '../pages/driver/trips/DriverTrips';
import { DriverTripAssignments } from '../pages/driver/trips/DriverTripAssignments';
import { DriverTripDetails } from '../pages/driver/trips/DriverTripDetails';
import { DriverAvailability } from '../pages/driver/DriverAvailability';
import { DriverEarnings } from '../pages/driver/DriverEarnings';
import { DriverPayments } from '../pages/driver/DriverPayments';
import { DriverExpenses } from '../pages/driver/DriverExpenses';
import { DriverDocuments } from '../pages/driver/DriverDocuments';
import { DriverNotifications } from '../pages/driver/DriverNotifications';
import { DriverSupport } from '../pages/driver/DriverSupport';
import { DriverProfile } from '../pages/driver/DriverProfile';
import { DriverSettings } from '../pages/driver/DriverSettings';
import { DriverUnauthorized } from '../pages/driver/DriverUnauthorized';
import { DriverNotFound } from '../pages/driver/DriverNotFound';

// Vendor Pages - Dedicated Enterprise Modules (Direct imports for instant navigation & zero chunk latency)
import VendorDashboard from '../pages/vendor/VendorDashboard';
import VendorVehicleList from '../pages/vendor/vehicles/VehicleList';
import VendorAddVehicle from '../pages/vendor/vehicles/AddVehicle';
import VendorVehicleDetails from '../pages/vendor/vehicles/VehicleDetails';
import VendorEditVehicle from '../pages/vendor/vehicles/EditVehicle';
import VendorVehicleAvailability from '../pages/vendor/vehicles/VehicleAvailability';
import VendorVehicleMaintenance from '../pages/vendor/vehicles/VehicleMaintenance';

import VendorPricingDashboard from '../pages/vendor/pricing/PricingDashboard';
import VendorVehiclePricing from '../pages/vendor/pricing/VehiclePricing';
import VendorTripPricing from '../pages/vendor/pricing/TripPricing';

import VendorDriverList from '../pages/vendor/drivers/DriverList';
import VendorAddDriver from '../pages/vendor/drivers/AddDriver';
import VendorDriverDetails from '../pages/vendor/drivers/DriverDetails';
import VendorEditDriver from '../pages/vendor/drivers/EditDriver';
import VendorDriverAvailability from '../pages/vendor/drivers/DriverAvailability';

import VendorBookingRequests from '../pages/vendor/bookings/BookingRequests';
import VendorBookingList from '../pages/vendor/bookings/BookingList';
import VendorBookingDetails from '../pages/vendor/bookings/BookingDetails';
import VendorTripList from '../pages/vendor/trips/TripList';
import VendorTripDetails from '../pages/vendor/trips/TripDetails';

import VendorFinanceDashboard from '../pages/vendor/finance/FinanceDashboard';
import VendorPaymentList from '../pages/vendor/finance/PaymentList';
import VendorInvoiceList from '../pages/vendor/finance/InvoiceList';
import VendorPaymentStatements from '../pages/vendor/finance/PaymentStatements';

import VendorReportsDashboard from '../pages/vendor/reports/ReportsDashboard';
import VendorNotificationCenter from '../pages/vendor/notifications/NotificationCenter';

import VendorSupportDashboard from '../pages/vendor/support/SupportDashboard';
import VendorCreateTicket from '../pages/vendor/support/CreateTicket';
import VendorTicketDetails from '../pages/vendor/support/TicketDetails';
import VendorAnnouncements from '../pages/vendor/support/Announcements';

import VendorProfile from '../pages/vendor/profile/VendorProfile';
import VendorSettings from '../pages/vendor/profile/VendorSettings';
import VendorUnauthorized from '../pages/vendor/VendorUnauthorized';
import VendorNotFound from '../pages/vendor/VendorNotFound';

// Staff Portal Pages & Layout
import { StaffLayout } from '../layouts/StaffLayout';
import StaffDashboard from '../pages/staff/StaffDashboard';
import StaffWorkDetails from '../pages/staff/StaffWorkDetails';
import StaffSalaryDetails from '../pages/staff/StaffSalaryDetails';
import StaffAttendance from '../pages/staff/StaffAttendance';
import StaffSalarySlips from '../pages/staff/StaffSalarySlips';
import StaffLeaves from '../pages/staff/StaffLeaves';

// Accountant Portal Pages & Dedicated Layout
import { AccountantLayout } from '../layouts/AccountantLayout';
import AccountantDashboard from '../pages/accountant/AccountantDashboard';
import IncomePage from '../pages/accountant/IncomePage';
import ExpensesPage from '../pages/accountant/ExpensesPage';
import ReceivablePage from '../pages/accountant/ReceivablePage';
import PayablePage from '../pages/accountant/PayablePage';
import DriverSettlementsPage from '../pages/accountant/DriverSettlementsPage';
import InvoicesPage from '../pages/accountant/InvoicesPage';
import CashBankPage from '../pages/accountant/CashBankPage';
import PayrollPage from '../pages/accountant/PayrollPage';
import LedgerPage from '../pages/accountant/LedgerPage';
import ReportsPage from '../pages/accountant/ReportsPage';

export function AppRoutes() {
  return (
    <RouteErrorBoundary>
      <Suspense fallback={<LoadingSpinner message="Loading workspace..." />}>
        <Routes>
          {/* Root & Authentication Routes -> Unified Split Double-Card Login */}
          <Route path="/" element={<LoginPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<LoginPage initialMode="signup" />} />
          <Route path="/book" element={<Navigate to="/" replace />} />
          <Route path="/booking" element={<Navigate to="/" replace />} />

          {/* Multi-Tenant SaaS Public Registration */}
          <Route path="/company-register" element={<CompanyRegisterPage />} />
          <Route path="/company-signup" element={<CompanyRegisterPage />} />
          <Route path="/register-company" element={<CompanyRegisterPage />} />

          {/* License & Subscription Lockout Screens */}
          <Route path="/account-suspended" element={<LicenseLockoutPage type="suspended" />} />
          <Route path="/license-expired" element={<LicenseLockoutPage type="expired" />} />

          {/* Portal Login Aliases */}
          <Route path="/super-admin/login" element={<LoginPage initialRole="super_admin" />} />
          <Route path="/admin/login" element={<LoginPage initialRole="company_admin" />} />
          <Route path="/accountant/login" element={<LoginPage initialRole="accountant" />} />
          <Route path="/vendor/login" element={<LoginPage initialRole="vendor" />} />
          <Route path="/staff/login" element={<LoginPage initialRole="employee" />} />

          {/* Driver Public Portal Routes */}
          <Route path="/driver/login" element={<DriverLogin />} />
          <Route path="/driver/signup" element={<Navigate to="/driver/register" replace />} />
          <Route path="/driver/register" element={<DriverRegister />} />
          <Route path="/driver/application-status" element={<DriverApplicationStatus />} />
          <Route path="/driver/forgot-password" element={<DriverForgotPassword />} />

          {/* ========================================================
              1. SUPER ADMIN PORTAL ROUTES
              ======================================================== */}
          <Route
            path="/super-admin"
            element={
              <ProtectedRoute portal="super-admin">
                <SuperAdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/super-admin/dashboard" replace />} />
            <Route path="dashboard" element={<SuperAdminDashboard />} />
            <Route path="companies" element={<SuperAdminCompanies />} />
            <Route path="licenses" element={<SuperAdminCompanies />} />
            <Route path="users" element={<SuperAdminUsers />} />
            <Route path="roles" element={<SuperAdminRoles />} />
            <Route path="permissions" element={<SuperAdminPermissions />} />
            <Route path="audit-logs" element={<SuperAdminAuditLogs />} />
            <Route path="settings" element={<SuperAdminSettings />} />
          </Route>

          {/* ========================================================
              2. ADMIN PORTAL ROUTES (Enterprise Modules)
              ======================================================== */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute portal="admin">
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />

            {/* Bookings Management */}
            <Route path="bookings" element={<BookingList />} />
            <Route path="bookings/new" element={<BookingCreate />} />
            <Route path="bookings/:id" element={<BookingDetails />} />
            <Route path="bookings/:id/edit" element={<BookingEdit />} />

            {/* Tour Packages */}
            <Route path="tour-packages" element={<TourPackageList />} />
            <Route path="tour-packages/new" element={<TourPackageCreate />} />
            <Route path="tour-packages/:id" element={<TourPackageDetails />} />
            <Route path="tour-packages/:id/edit" element={<TourPackageEdit />} />

            {/* Fleet Management */}
            <Route path="fleet" element={<FleetList />} />
            <Route path="fleet/new" element={<FleetCreate />} />
            <Route path="fleet/:id" element={<FleetDetails />} />
            <Route path="fleet/:id/edit" element={<FleetEdit />} />

            {/* Driver Operations */}
            <Route path="drivers" element={<DriverList />} />
            <Route path="drivers/new" element={<DriverCreate />} />
            <Route path="drivers/applications" element={<DriverApplications />} />
            <Route path="drivers/:id" element={<DriverDetails />} />
            <Route path="drivers/:id/edit" element={<DriverEdit />} />

            {/* Customer Accounts / CRM */}
            <Route path="customers" element={<CustomerList />} />
            <Route path="customers/new" element={<CustomerCreate />} />
            <Route path="customers/:id" element={<CustomerDetails />} />
            <Route path="customers/:id/edit" element={<CustomerEdit />} />

            {/* Vendor & Partner Network */}
            <Route path="vendors" element={<VendorList />} />
            <Route path="vendors/new" element={<VendorCreate />} />
            <Route path="vendors/:id" element={<VendorDetails />} />
            <Route path="vendors/:id/edit" element={<VendorEdit />} />

            {/* Finance, Payments & Expenses */}
            <Route path="finance" element={<FinanceDashboard />} />
            <Route path="payments" element={<PaymentsList />} />
            <Route path="expenses" element={<ExpensesList />} />

            {/* Staff & Employees */}
            <Route path="employees" element={<EmployeeList />} />
            <Route path="attendance" element={<AttendanceManagement />} />
            <Route path="payroll" element={<PayrollManagement />} />

            {/* Reports & Analytics */}
            <Route path="reports" element={<ReportsDashboard />} />

            {/* Operations Notifications */}
            <Route path="notifications" element={<NotificationsCenter />} />

            {/* System Settings */}
            <Route path="settings" element={<SettingsPage />} />

            {/* Admin Fallbacks */}
            <Route path="unauthorized" element={<AdminUnauthorized />} />
            <Route path="*" element={<AdminNotFound />} />
          </Route>

          {/* ========================================================
              3. DRIVER PORTAL ROUTES
              ======================================================== */}
          <Route
            path="/driver"
            element={
              <ProtectedRoute portal="driver">
                <DriverLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/driver/dashboard" replace />} />
            <Route path="dashboard" element={<DriverDashboard />} />

            {/* Trips & Assignments */}
            <Route path="trips" element={<DriverTrips />} />
            <Route path="trips/assignments" element={<DriverTripAssignments />} />
            <Route path="trips/today" element={<DriverTrips />} />
            <Route path="trips/upcoming" element={<DriverTrips />} />
            <Route path="trips/active" element={<DriverTrips />} />
            <Route path="trips/completed" element={<DriverTrips />} />
            <Route path="trips/:id" element={<DriverTripDetails />} />

            {/* Legacy aliases */}
            <Route path="my-trips" element={<Navigate to="/driver/trips" replace />} />
            <Route path="trip-details" element={<Navigate to="/driver/trips/active" replace />} />
            <Route path="trip-details/:id" element={<DriverTripDetails />} />

            {/* Duty Availability */}
            <Route path="availability" element={<DriverAvailability />} />

            {/* Expenses */}
            <Route path="expenses" element={<DriverExpenses />} />
            <Route path="trips/:id/expenses" element={<DriverExpenses />} />

            {/* Earnings & Payments */}
            <Route path="earnings" element={<DriverEarnings />} />
            <Route path="payments" element={<DriverPayments />} />

            {/* Documents & Compliance */}
            <Route path="documents" element={<DriverDocuments />} />

            {/* Notifications */}
            <Route path="notifications" element={<DriverNotifications />} />

            {/* Performance & Quality - Removed per user request, redirect to dashboard */}
            <Route path="performance" element={<Navigate to="/driver/dashboard" replace />} />

            {/* Support & Admin Desk */}
            <Route path="support" element={<DriverSupport />} />

            {/* Profile & Settings */}
            <Route path="profile" element={<DriverProfile />} />
            <Route path="settings" element={<DriverSettings />} />

            {/* Error Fallbacks */}
            <Route path="unauthorized" element={<DriverUnauthorized />} />
            <Route path="*" element={<DriverNotFound />} />
          </Route>

          {/* ========================================================
              4. VENDOR PORTAL ROUTES
              ======================================================== */}
          <Route
            path="/vendor"
            element={
              <ProtectedRoute portal="vendor">
                <VendorLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/vendor/dashboard" replace />} />
            <Route path="dashboard" element={<VendorDashboard />} />

            {/* Vehicle Management */}
            <Route path="vehicles" element={<VendorVehicleList />} />
            <Route path="vehicles/new" element={<VendorAddVehicle />} />
            <Route path="vehicles/availability" element={<VendorVehicleAvailability />} />
            <Route path="vehicles/maintenance" element={<VendorVehicleMaintenance />} />
            <Route path="vehicles/:id" element={<VendorVehicleDetails />} />
            <Route path="vehicles/:id/edit" element={<VendorEditVehicle />} />

            {/* Pricing Management */}
            <Route path="pricing" element={<VendorPricingDashboard />} />
            <Route path="pricing/vehicles" element={<VendorVehiclePricing />} />
            <Route path="pricing/trips" element={<Navigate to="/vendor/pricing/vehicles" replace />} />

            {/* Driver Management Disabled for Vendors (Admin Manages Drivers) */}
            <Route path="drivers" element={<Navigate to="/vendor/vehicles" replace />} />
            <Route path="drivers/*" element={<Navigate to="/vendor/vehicles" replace />} />

            {/* Booking Requests & Bookings (No Vendor Trip Management) */}
            <Route path="booking-requests" element={<VendorBookingRequests />} />
            <Route path="bookings" element={<VendorBookingList />} />
            <Route path="bookings/:id" element={<VendorBookingDetails />} />
            <Route path="trips" element={<Navigate to="/vendor/bookings" replace />} />
            <Route path="trips/:id" element={<Navigate to="/vendor/bookings" replace />} />

            {/* Finance & Invoices & Payments */}
            <Route path="finance" element={<VendorFinanceDashboard />} />
            <Route path="finance/statements" element={<VendorPaymentStatements />} />
            <Route path="finance/payments" element={<VendorPaymentList />} />
            <Route path="finance/invoices" element={<VendorInvoiceList />} />
            <Route path="payments" element={<VendorPaymentList />} />
            <Route path="invoices" element={<VendorInvoiceList />} />
            <Route path="statements" element={<VendorPaymentStatements />} />

            {/* Reports & Notifications */}
            <Route path="reports" element={<VendorReportsDashboard />} />
            <Route path="notifications" element={<VendorNotificationCenter />} />

            {/* Support & Help Desk */}
            <Route path="support" element={<VendorSupportDashboard />} />
            <Route path="support/new" element={<VendorCreateTicket />} />
            <Route path="support/announcements" element={<VendorAnnouncements />} />
            <Route path="support/:id" element={<VendorTicketDetails />} />

            {/* Profile & Settings */}
            <Route path="profile" element={<VendorProfile />} />
            <Route path="settings" element={<VendorSettings />} />

            {/* Error Fallbacks */}
            <Route path="unauthorized" element={<VendorUnauthorized />} />
            <Route path="*" element={<VendorNotFound />} />
          </Route>

          {/* ========================================================
              5. STAFF / EMPLOYEE PORTAL ROUTES
              ======================================================== */}
          <Route
            path="/staff"
            element={
              <ProtectedRoute portal="staff">
                <StaffLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/staff/dashboard" replace />} />
            <Route path="dashboard" element={<StaffDashboard />} />
            <Route path="work-details" element={<StaffWorkDetails />} />
            <Route path="salary" element={<StaffSalaryDetails />} />
            <Route path="attendance" element={<StaffAttendance />} />
            <Route path="slips" element={<StaffSalarySlips />} />
            <Route path="leaves" element={<StaffLeaves />} />
            <Route path="*" element={<Navigate to="/staff/dashboard" replace />} />
          </Route>

          {/* ========================================================
              5. ACCOUNTANT PORTAL ROUTES (Dedicated Finance & Books)
              ======================================================== */}
          <Route
            path="/accountant"
            element={
              <ProtectedRoute portal="accountant">
                <AccountantLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/accountant/dashboard" replace />} />
            <Route path="dashboard" element={<AccountantDashboard />} />
            <Route path="income" element={<IncomePage />} />
            <Route path="payments" element={<Navigate to="/accountant/income" replace />} />
            <Route path="expenses" element={<ExpensesPage />} />
            <Route path="receivable" element={<ReceivablePage />} />
            <Route path="payable" element={<PayablePage />} />
            <Route path="driver-settlements" element={<DriverSettlementsPage />} />
            <Route path="invoices" element={<InvoicesPage />} />
            <Route path="cash-bank" element={<CashBankPage />} />
            <Route path="payroll" element={<PayrollPage />} />
            <Route path="ledger" element={<LedgerPage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="*" element={<Navigate to="/accountant/dashboard" replace />} />
          </Route>

          {/* Error & Authorization Routes */}
          <Route path="/unauthorized" element={<Unauthorized />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </RouteErrorBoundary>
  );
}

export default AppRoutes;
