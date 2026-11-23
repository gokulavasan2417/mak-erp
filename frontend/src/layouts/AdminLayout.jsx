import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Calendar,
  CalendarCheck,
  Compass,
  Car,
  UserCheck,
  ShieldCheck,
  Users,
  Truck,
  DollarSign,
  Receipt,
  Briefcase,
  BarChart3,
  Bell,
  Settings,
  Banknote
} from 'lucide-react';
import { Sidebar } from '../components/layout/Sidebar';
import { Topbar } from '../components/layout/Topbar';
import { useAdminData } from '../context/AdminDataContext';

function AdminLayoutInner() {
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const {
    bookings = [],
    tourPackages = [],
    vehicles = [],
    drivers = [],
    driverApplications = [],
    customers = [],
    vendors = [],
    payments = [],
    expenses = [],
    employees = [],
    notifications = []
  } = useAdminData();

  const pendingApps = driverApplications.filter(
    (a) => a.status === 'Pending Verification'
  ).length;

  const unreadNotifications = notifications.filter((n) => n.unread).length;

  const adminNavItems = [
    {
      to: '/admin/dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard
    },
    {
      to: '/admin/bookings',
      label: 'Bookings',
      icon: Calendar,
      badge: bookings.length > 0 ? String(bookings.length) : undefined
    },
    {
      to: '/admin/tour-packages',
      label: 'Tour Packages',
      icon: Compass,
      badge: tourPackages.length > 0 ? String(tourPackages.length) : undefined
    },
    {
      to: '/admin/fleet',
      label: 'Fleet Management',
      icon: Car,
      badge: vehicles.length > 0 ? String(vehicles.length) : undefined
    },
    {
      to: '/admin/drivers',
      label: 'Drivers',
      icon: UserCheck,
      badge: drivers.length > 0 ? String(drivers.length) : undefined,
      end: true
    },
    {
      to: '/admin/drivers/applications',
      label: 'Driver Applications',
      icon: ShieldCheck,
      badge: pendingApps > 0 ? String(pendingApps) : undefined,
      badgeColor: '#f59e0b'
    },
    {
      to: '/admin/customers',
      label: 'Customers',
      icon: Users,
      badge: customers.length > 0 ? String(customers.length) : undefined
    },
    {
      to: '/admin/vendors',
      label: 'Vendors & Partners',
      icon: Truck,
      badge: vendors.length > 0 ? String(vendors.length) : undefined
    },
    {
      label: 'Finance',
      icon: DollarSign,
      children: [
        { to: '/admin/finance', label: 'Finance Dashboard' },
        { to: '/admin/payments', label: 'Payments', badge: payments.length > 0 ? String(payments.length) : undefined },
        { to: '/admin/expenses', label: 'Expenses', badge: expenses.length > 0 ? String(expenses.length) : undefined }
      ]
    },
    {
      to: '/admin/employees',
      label: 'Employees',
      icon: Briefcase,
      badge: employees.length > 0 ? String(employees.length) : undefined
    },
    {
      to: '/admin/attendance',
      label: 'Attendance',
      icon: CalendarCheck
    },
    {
      to: '/admin/payroll',
      label: 'Payroll System',
      icon: Banknote
    },
    {
      to: '/admin/reports',
      label: 'Reports & Analytics',
      icon: BarChart3
    },
    {
      to: '/admin/notifications',
      label: 'Notifications',
      icon: Bell,
      badge: unreadNotifications > 0 ? String(unreadNotifications) : undefined,
      badgeColor: '#EF4444'
    },
    {
      to: '/admin/settings',
      label: 'Settings',
      icon: Settings
    }
  ];

  return (
    <div className="app-layout">
      <Sidebar
        portal="admin"
        navItems={adminNavItems}
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
        isMobileOpen={isMobileOpen}
        onCloseMobile={() => setIsMobileOpen(false)}
      />

      <div className="main-content">
        <Topbar
          portal="admin"
          onOpenMobileSidebar={() => setIsMobileOpen(true)}
        />
        <main className="page-container" key={location.pathname}>
          <Outlet key={location.pathname} />
        </main>
      </div>
    </div>
  );
}

export function AdminLayout() {
  return <AdminLayoutInner />;
}

export default AdminLayout;
