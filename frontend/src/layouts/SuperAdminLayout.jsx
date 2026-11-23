import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  KeyRound,
  Users,
  ShieldCheck,
  FileText,
  Settings
} from 'lucide-react';
import { Sidebar } from '../components/layout/Sidebar';
import { Topbar } from '../components/layout/Topbar';

const superAdminNavItems = [
  { to: '/super-admin/dashboard', label: 'Platform Dashboard', icon: LayoutDashboard },
  { to: '/super-admin/companies', label: 'Companies (Tenants)', icon: Building2 },
  { to: '/super-admin/licenses', label: 'Licenses & Quotas', icon: KeyRound },
  { to: '/super-admin/users', label: 'User Directory', icon: Users },
  { to: '/super-admin/roles', label: 'Roles Matrix', icon: ShieldCheck },
  { to: '/super-admin/audit-logs', label: 'Security & Audit', icon: FileText },
  { to: '/super-admin/settings', label: 'Platform Settings', icon: Settings },
];

export function SuperAdminLayout() {
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <div className="app-layout">
      <Sidebar
        portal="super-admin"
        navItems={superAdminNavItems}
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
        isMobileOpen={isMobileOpen}
        onCloseMobile={() => setIsMobileOpen(false)}
      />

      <div className="main-content">
        <Topbar
          portal="super-admin"
          onOpenMobileSidebar={() => setIsMobileOpen(true)}
        />
        <main className="page-container" key={location.pathname}>
          <Outlet key={location.pathname} />
        </main>
      </div>
    </div>
  );
}

export default SuperAdminLayout;
