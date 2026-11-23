import React, { useState, Suspense } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  CalendarCheck,
  Compass,
  Calendar,
  DollarSign,
  CreditCard,
  FileCheck,
  Award,
  Bell,
  HelpCircle,
  User,
  Settings,
  AlertOctagon,
  LogOut,
  ShieldCheck,
  PhoneCall,
  Receipt,
  Menu
} from 'lucide-react';
import { Sidebar } from '../components/layout/Sidebar';
import { Topbar } from '../components/layout/Topbar';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { useDriverData } from '../context/DriverDataContext';
import { initialDriverProfile } from '../data/driverPortalData';

function DriverLayoutContent() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isSosModalOpen, setIsSosModalOpen] = useState(false);

  const {
    driver,
    pendingAssignments = [],
    notifications = [],
    emergencyContacts = {},
    triggerEmergencySos
  } = useDriverData();

  const safeDriver = driver ? { ...initialDriverProfile, ...driver } : initialDriverProfile;
  const unreadCount = (notifications || []).filter((n) => !n.isRead).length;
  const pendingCount = (pendingAssignments || []).length;

  const driverNavItems = [
    {
      to: '/driver/dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard
    },
    {
      to: '/driver/trips/assignments',
      label: 'Trip Assignments',
      icon: CalendarCheck,
      badge: pendingCount > 0 ? `${pendingCount} New` : undefined
    },
    {
      to: '/driver/expenses',
      label: 'Trip Expenses',
      icon: Receipt
    },
    {
      to: '/driver/trips',
      label: 'My Trips',
      icon: Compass,
      end: true
    },
    {
      to: '/driver/availability',
      label: 'Duty Availability',
      icon: Calendar
    },
    {
      to: '/driver/earnings',
      label: 'Earnings & Allowances',
      icon: DollarSign
    },
    {
      to: '/driver/payments',
      label: 'Payment History',
      icon: CreditCard
    },
    {
      to: '/driver/documents',
      label: 'Documents & Compliance',
      icon: FileCheck
    },
    {
      to: '/driver/notifications',
      label: 'Notifications',
      icon: Bell,
      badge: unreadCount > 0 ? `${unreadCount}` : undefined
    },
    {
      to: '/driver/support',
      label: 'Help & Admin Support',
      icon: HelpCircle
    },
    {
      to: '/driver/profile',
      label: 'Driver Profile',
      icon: User
    },
    {
      to: '/driver/settings',
      label: 'Portal Settings',
      icon: Settings
    }
  ];

  const handleConfirmSos = () => {
    triggerEmergencySos('ACTIVE-DUTY', 'Driver triggered SOS from application navigation bar');
    setIsSosModalOpen(false);
  };

  return (
    <div className="app-layout">
      {/* Desktop / Tablet Sidebar */}
      <Sidebar
        portal="driver"
        navItems={driverNavItems}
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
        isMobileOpen={isMobileOpen}
        onCloseMobile={() => setIsMobileOpen(false)}
      />

      <div className="main-content" style={{ paddingBottom: '70px' }}>
        {/* Custom Enhanced Topbar with Driver SOS */}
        <div
          style={{
            height: '64px',
            backgroundColor: 'var(--bg-surface)',
            borderBottom: '1px solid var(--border-light)',
            padding: '0 1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            position: 'sticky',
            top: 0,
            zIndex: 1010
          }}
        >
          {/* Left: Mobile hamburger & Driver Identity */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
            <button
              onClick={() => setIsMobileOpen(true)}
              className="mobile-menu-btn"
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '0.375rem',
                color: 'var(--text-main)',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              aria-label="Open Mobile Menu"
            >
              <Menu size={22} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              {safeDriver?.avatar || safeDriver?.photo ? (
                <img
                  src={safeDriver?.avatar || safeDriver?.photo}
                  alt={safeDriver?.displayName || safeDriver?.name || 'Driver'}
                  style={{ width: '38px', height: '38px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #2C3480' }}
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              ) : (
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '50%',
                    backgroundColor: '#2C3480',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.875rem',
                    fontWeight: 700,
                    border: '2px solid #ffffff'
                  }}
                >
                  {(safeDriver?.displayName || safeDriver?.name || 'DR').substring(0, 2).toUpperCase()}
                </div>
              )}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--text-main)' }}>
                    {safeDriver?.displayName || safeDriver?.fullName || safeDriver?.name || 'Driver Portal'}
                  </span>
                  <span
                    style={{
                      fontSize: '0.6875rem',
                      fontWeight: 700,
                      backgroundColor: 'rgba(16, 185, 129, 0.1)',
                      color: '#10b981',
                      padding: '0.125rem 0.375rem',
                      borderRadius: '4px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.2rem'
                    }}
                  >
                    <ShieldCheck size={11} /> Verified Driver
                  </span>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  ID: <strong style={{ color: '#2C3480', fontFamily: 'monospace' }}>{safeDriver?.id || 'DRV-NEW'}</strong> &bull; Duty:{' '}
                  <span style={{ color: safeDriver?.dutyStatus === 'Available' ? '#10b981' : '#f59e0b', fontWeight: 600 }}>
                    {safeDriver?.dutyStatus || 'Available'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Quick SOS Emergency & Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
            {/* SOS Button */}
            <button
              onClick={() => setIsSosModalOpen(true)}
              style={{
                backgroundColor: '#dc2626',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                padding: '0.45rem 0.9rem',
                fontSize: '0.8125rem',
                fontWeight: 800,
                letterSpacing: '0.04em',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(220, 38, 38, 0.35)',
                transition: 'transform 0.1s ease'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.03)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            >
              <AlertOctagon size={16} /> EMERGENCY SOS
            </button>

            {/* Notifications Shortcut */}
            <NavLink
              to="/driver/notifications"
              style={{
                position: 'relative',
                color: 'var(--text-main)',
                padding: '0.4rem',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: '2px',
                    right: '2px',
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: '#dc2626'
                  }}
                />
              )}
            </NavLink>

            {/* Logout / Switch */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/driver/login')}
              leftIcon={<LogOut size={15} />}
            >
              Logout
            </Button>
          </div>
        </div>

        <main className="page-container" style={{ padding: '1.5rem' }} key={location.pathname}>
          <Suspense fallback={<LoadingSpinner message="Loading driver module..." />}>
            <Outlet key={location.pathname} />
          </Suspense>
        </main>

        {/* Mobile Bottom Navigation Bar for Drivers */}
        <nav
          className="driver-mobile-nav"
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            height: '62px',
            backgroundColor: 'var(--bg-surface)',
            borderTop: '1px solid var(--border-light)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-around',
            zIndex: 1020,
            boxShadow: '0 -2px 10px rgba(0,0,0,0.08)'
          }}
        >
          {[
            { to: '/driver/dashboard', label: 'Dashboard', icon: LayoutDashboard },
            { to: '/driver/trips', label: 'Trips', icon: Compass, end: true },
            { to: '/driver/trips/assignments', label: 'Assign', icon: CalendarCheck, badge: pendingCount > 0 ? String(pendingCount) : undefined },
            { to: '/driver/earnings', label: 'Earnings', icon: DollarSign },
            { to: '/driver/profile', label: 'Profile', icon: User }
          ].map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={Boolean(item.end)}
                style={({ isActive }) => ({
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.125rem',
                  color: isActive ? '#2C3480' : 'var(--text-muted)',
                  textDecoration: 'none',
                  fontSize: '0.6875rem',
                  fontWeight: isActive ? 700 : 500,
                  flex: 1,
                  height: '100%',
                  padding: '0.25rem 0',
                  position: 'relative'
                })}
              >
                <Icon size={18} />
                <span>{item.label}</span>
                {item.badge && (
                  <span
                    style={{
                      position: 'absolute',
                      top: '6px',
                      right: '25%',
                      backgroundColor: '#dc2626',
                      color: '#ffffff',
                      fontSize: '0.625rem',
                      fontWeight: 800,
                      borderRadius: '50%',
                      width: '15px',
                      height: '15px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Emergency SOS Modal */}
      <Modal
        isOpen={isSosModalOpen}
        onClose={() => setIsSosModalOpen(false)}
        title="EMERGENCY SOS ASSISTANCE"
        subtitle="Immediately alert MAK Tours & Travels 24x7 Control Room and Emergency Responders"
        size="md"
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', width: '100%' }}>
            <Button variant="outline" onClick={() => setIsSosModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              style={{ backgroundColor: '#dc2626', borderColor: '#dc2626', fontWeight: 800 }}
              leftIcon={<AlertOctagon size={16} />}
              onClick={handleConfirmSos}
            >
              TRIGGER SOS NOW
            </Button>
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '1rem', color: '#991b1b', fontSize: '0.875rem' }}>
            <strong>Are you in an accident, breakdown, or passenger emergency?</strong>
            <p style={{ marginTop: '0.35rem', color: '#b91c1c', fontSize: '0.8125rem' }}>
              Clicking below will broadcast your vehicle telematics coordinates, passenger count, and route details to MAK emergency operations.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.8125rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0.75rem', backgroundColor: '#f8fafc', borderRadius: '6px' }}>
              <span>MAK 24x7 Control Room:</span>
              <a href="tel:+919840999112" style={{ fontWeight: 700, color: '#2C3480', textDecoration: 'none' }}>
                <PhoneCall size={12} style={{ display: 'inline', marginRight: '4px' }} />
                {emergencyContacts?.companyEmergencySos || '+91 98409 99112'}
              </a>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0.75rem', backgroundColor: '#f8fafc', borderRadius: '6px' }}>
              <span>National Police SOS:</span>
              <span style={{ fontWeight: 700, color: '#dc2626' }}>{emergencyContacts?.policeSos || '112'}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0.75rem', backgroundColor: '#f8fafc', borderRadius: '6px' }}>
              <span>Ambulance / Medical Emergency:</span>
              <span style={{ fontWeight: 700, color: '#16a34a' }}>{emergencyContacts?.ambulanceSos || '108'}</span>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export function DriverLayout() {
  return <DriverLayoutContent />;
}

export default DriverLayout;
