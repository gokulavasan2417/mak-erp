// MAK Tours & Travels ERP - Dedicated Staff Portal Layout
import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Briefcase,
  DollarSign,
  Calendar,
  FileText,
  Clock,
  UserCheck
} from 'lucide-react';
import { Sidebar } from '../components/layout/Sidebar';
import { Topbar } from '../components/layout/Topbar';
import { StaffDataProvider, useStaffData } from '../context/StaffDataContext';

function StaffLayoutContent() {
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { attendanceMetrics, leaveRequests } = useStaffData();

  const pendingLeaves = leaveRequests.filter((l) => l.status === 'Pending').length;

  const staffNavItems = [
    {
      to: '/staff/dashboard',
      label: 'Staff Dashboard',
      icon: LayoutDashboard
    },
    {
      to: '/staff/work-details',
      label: 'Work & Job Details',
      icon: Briefcase
    },
    {
      to: '/staff/salary',
      label: 'Salary Information',
      icon: DollarSign
    },
    {
      to: '/staff/attendance',
      label: 'Attendance & Roster',
      icon: Calendar,
      badge: `${attendanceMetrics.attendancePercentage}%`
    },
    {
      to: '/staff/slips',
      label: 'Payslips & History',
      icon: FileText
    },
    {
      to: '/staff/leaves',
      label: 'Leave Requests',
      icon: Clock,
      badge: pendingLeaves > 0 ? `${pendingLeaves} Pending` : undefined
    }
  ];

  return (
    <div className="app-layout">
      <Sidebar
        portal="staff"
        navItems={staffNavItems}
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
        isMobileOpen={isMobileOpen}
        onCloseMobile={() => setIsMobileOpen(false)}
      />

      <div className="main-content">
        <Topbar
          portal="staff"
          onOpenMobileSidebar={() => setIsMobileOpen(true)}
        />
        <main className="page-container" key={location.pathname}>
          <Outlet key={location.pathname} />
        </main>
      </div>
    </div>
  );
}

export function StaffLayout() {
  return (
    <StaffDataProvider>
      <StaffLayoutContent />
    </StaffDataProvider>
  );
}

export default StaffLayout;
