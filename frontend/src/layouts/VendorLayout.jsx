import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Car,
  Tags,
  UserCheck,
  Calendar,
  DollarSign,
  BarChart3,
  Bell,
  HelpCircle,
  Building
} from 'lucide-react';
import { Sidebar } from '../components/layout/Sidebar';
import { Topbar } from '../components/layout/Topbar';
import { VendorDataProvider, useVendorData } from '../context/VendorDataContext';

function VendorLayoutContent() {
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { kpis, notifications, bookingRequests } = useVendorData();

  const unreadNotifs = notifications.filter((n) => !n.isRead).length;
  const pendingReqs = bookingRequests.filter((r) => r.status === 'Pending').length;

  const vendorNavItems = [
    {
      to: '/vendor/dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      end: true
    },
    {
      to: '/vendor/vehicles',
      label: 'Vehicle Management',
      icon: Car,
      badge: kpis.totalVehicles ? String(kpis.totalVehicles) : undefined
    },
    {
      to: '/vendor/pricing',
      label: 'Pricing Management',
      icon: Tags
    },
    {
      to: '/vendor/bookings',
      label: 'Booking Management',
      icon: Calendar,
      badge: pendingReqs > 0 ? `${pendingReqs} New` : undefined
    },
    {
      to: '/vendor/finance',
      label: 'Finance & Invoicing',
      icon: DollarSign
    },
    {
      to: '/vendor/reports',
      label: 'Reports & Analytics',
      icon: BarChart3
    },
    {
      to: '/vendor/notifications',
      label: 'Notifications',
      icon: Bell,
      badge: unreadNotifs > 0 ? `${unreadNotifs}` : undefined
    },
    {
      to: '/vendor/support',
      label: 'Support & Help',
      icon: HelpCircle
    },
    {
      to: '/vendor/profile',
      label: 'Profile & Settings',
      icon: Building
    }
  ];

  return (
    <div className="app-layout">
      <Sidebar
        portal="vendor"
        navItems={vendorNavItems}
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
        isMobileOpen={isMobileOpen}
        onCloseMobile={() => setIsMobileOpen(false)}
      />

      <div className="main-content">
        <Topbar
          portal="vendor"
          onOpenMobileSidebar={() => setIsMobileOpen(true)}
        />
        <main className="page-container" key={location.pathname}>
          <Outlet key={location.pathname} />
        </main>
      </div>
    </div>
  );
}

export function VendorLayout() {
  return <VendorLayoutContent />;
}

export default VendorLayout;
