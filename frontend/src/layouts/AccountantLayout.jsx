// MAK Tours & Travels ERP - Dedicated Accountant Portal Layout
import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  DollarSign,
  Receipt,
  TrendingUp,
  Truck,
  UserCheck,
  FileText,
  Landmark,
  Banknote,
  BookOpen,
  BarChart3
} from 'lucide-react';
import { Sidebar } from '../components/layout/Sidebar';
import { Topbar } from '../components/layout/Topbar';

export function AccountantLayout() {
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const accountantNavItems = [
    {
      to: '/accountant/dashboard',
      label: 'Financial Dashboard',
      icon: LayoutDashboard
    },
    {
      to: '/accountant/income',
      label: 'Income & Payments',
      icon: DollarSign
    },
    {
      to: '/accountant/expenses',
      label: 'Operating Expenses',
      icon: Receipt
    },
    {
      to: '/accountant/receivable',
      label: 'Accounts Receivable',
      icon: TrendingUp
    },
    {
      to: '/accountant/payable',
      label: 'Accounts Payable',
      icon: Truck
    },
    {
      to: '/accountant/driver-settlements',
      label: 'Driver Settlements',
      icon: UserCheck
    },
    {
      to: '/accountant/invoices',
      label: 'Invoices & Billing',
      icon: FileText
    },
    {
      to: '/accountant/cash-bank',
      label: 'Cash & Bank Management',
      icon: Landmark
    },
    {
      to: '/accountant/payroll',
      label: 'Payroll Accounting',
      icon: Banknote
    },
    {
      to: '/accountant/ledger',
      label: 'Chart of Accounts & Ledger',
      icon: BookOpen
    },
    {
      to: '/accountant/reports',
      label: 'Accounting & Tax Reports',
      icon: BarChart3
    }
  ];

  return (
    <div className="app-layout">
      <Sidebar
        portal="accountant"
        navItems={accountantNavItems}
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
        isMobileOpen={isMobileOpen}
        onCloseMobile={() => setIsMobileOpen(false)}
      />

      <div className="main-content">
        <Topbar
          portal="accountant"
          onOpenMobileSidebar={() => setIsMobileOpen(true)}
        />
        <main className="page-container" style={{ padding: '1.5rem' }} key={location.pathname}>
          <Outlet key={location.pathname} />
        </main>
      </div>
    </div>
  );
}

export default AccountantLayout;
