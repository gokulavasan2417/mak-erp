// MAK Tours & Travels ERP - Vendor Section In-Page Tab Navigation
import React, { useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Car,
  Plus,
  Calendar,
  Wrench,
  Tags,
  Clock,
  DollarSign,
  CreditCard,
  FileText,
  TrendingUp,
  HelpCircle,
  Bell,
  Building,
  Settings
} from 'lucide-react';

export const VENDOR_VEHICLE_TABS = [
  { label: 'All Vehicles', to: '/vendor/vehicles', icon: Car, exact: true },
  { label: 'Add Vehicle', to: '/vendor/vehicles/new', icon: Plus },
  { label: 'Vehicle Availability', to: '/vendor/vehicles/availability', icon: Calendar },
  { label: 'Maintenance', to: '/vendor/vehicles/maintenance', icon: Wrench }
];

export const VENDOR_PRICING_TABS = [
  { label: 'Pricing Overview', to: '/vendor/pricing', icon: Tags, exact: true },
  { label: 'Vehicle Rate Cards', to: '/vendor/pricing/vehicles', icon: Car }
];

export const VENDOR_BOOKING_TABS = [
  { label: 'All Bookings', to: '/vendor/bookings', icon: Calendar, exact: true },
  { label: 'Booking Requests', to: '/vendor/booking-requests', icon: Clock }
];

export const VENDOR_FINANCE_TABS = [
  { label: 'Finance Dashboard', to: '/vendor/finance', icon: DollarSign, exact: true },
  { label: 'Payments', to: '/vendor/payments', icon: CreditCard },
  { label: 'Invoices', to: '/vendor/invoices', icon: FileText },
  { label: 'Payment Statements', to: '/vendor/statements', icon: TrendingUp }
];

export const VENDOR_SUPPORT_TABS = [
  { label: 'Support Hub', to: '/vendor/support', icon: HelpCircle, exact: true },
  { label: 'Create Ticket', to: '/vendor/support/new', icon: Plus },
  { label: 'Announcements', to: '/vendor/support/announcements', icon: Bell }
];

export const VENDOR_PROFILE_TABS = [
  { label: 'Agency Profile', to: '/vendor/profile', icon: Building, exact: true },
  { label: 'Account Settings', to: '/vendor/settings', icon: Settings }
];

export function VendorNavTabs({ tabs = VENDOR_VEHICLE_TABS }) {
  const navigate = useNavigate();
  const location = useLocation();

  const activeTabTo = useMemo(() => {
    // 1. Direct match
    const exactMatch = tabs.find((t) => location.pathname === t.to);
    if (exactMatch) return exactMatch.to;

    // Subpath aliases for finance tabs
    if (location.pathname === '/vendor/finance/statements') return '/vendor/statements';
    if (location.pathname === '/vendor/finance/payments') return '/vendor/payments';
    if (location.pathname === '/vendor/finance/invoices') return '/vendor/invoices';

    // 2. Longest matching prefix for detail/sub-routes (e.g. /vendor/vehicles/VEH-001 -> /vendor/vehicles)
    const prefixMatches = tabs
      .filter((t) => location.pathname.startsWith(t.to + '/'))
      .sort((a, b) => b.to.length - a.to.length);

    if (prefixMatches.length > 0) {
      return prefixMatches[0].to;
    }

    return null;
  }, [location.pathname, tabs]);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        backgroundColor: '#ffffff',
        padding: '0.5rem 0.625rem',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
        overflowX: 'auto',
        marginBottom: '0.5rem'
      }}
    >
      {tabs.map((tab) => {
        const isActive = activeTabTo === tab.to;
        const Icon = tab.icon;

        return (
          <button
            key={tab.to}
            type="button"
            onClick={() => navigate(tab.to)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.5rem 0.9rem',
              borderRadius: '8px',
              fontSize: '0.8125rem',
              fontWeight: 700,
              cursor: 'pointer',
              border: isActive ? '1.5px solid #2C3480' : '1px solid transparent',
              backgroundColor: isActive ? '#2C3480' : '#f8fafc',
              color: isActive ? '#ffffff' : '#475569',
              transition: 'all 0.15s ease',
              whiteSpace: 'nowrap'
            }}
          >
            {Icon && <Icon size={15} style={{ flexShrink: 0 }} />}
            <span>{tab.label}</span>
            {tab.badge && (
              <span
                style={{
                  fontSize: '0.625rem',
                  fontWeight: 800,
                  padding: '0.1rem 0.4rem',
                  borderRadius: '9999px',
                  backgroundColor: isActive ? 'rgba(255,255,255,0.25)' : '#e2e8f0',
                  color: isActive ? '#ffffff' : '#1e293b'
                }}
              >
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export default VendorNavTabs;
