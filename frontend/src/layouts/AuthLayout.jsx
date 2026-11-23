import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Compass, ShieldCheck } from 'lucide-react';

export function AuthLayout({ children, portalName = 'ERP Portal' }) {
  const location = useLocation();

  const portalLinks = [
    { to: '/super-admin/login', label: 'Super Admin' },
    { to: '/admin/login', label: 'Admin' },
    { to: '/driver/login', label: 'Driver' },
    { to: '/vendor/login', label: 'Vendor' },
  ];

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: 'var(--bg-app)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        backgroundImage: 'radial-gradient(ellipse at top, rgba(220, 38, 38, 0.08) 0%, transparent 65%)',
        padding: '1.5rem'
      }}
    >
      {/* Top Header */}
      <header
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          maxWidth: '1200px',
          width: '100%',
          margin: '0 auto',
          paddingBottom: '1rem',
          gap: '1rem'
        }}
      >
        <Link
          to="/"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.625rem',
            textDecoration: 'none'
          }}
        >
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--color-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            <Compass size={22} />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
              MAK TOURS &amp; TRAVELS
            </div>
            <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
              ENTERPRISE RESOURCE PLANNING
            </div>
          </div>
        </Link>

        {/* Quick Portal Switcher Pills */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-medium)',
            borderRadius: 'var(--radius-full)',
            padding: '0.25rem',
            gap: '0.25rem',
            boxShadow: 'var(--shadow-xs)'
          }}
        >
          {portalLinks.map((item) => {
            const isActive = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                style={{
                  padding: '0.3125rem 0.75rem',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.75rem',
                  fontWeight: isActive ? 600 : 500,
                  textDecoration: 'none',
                  color: isActive ? '#ffffff' : 'var(--text-secondary)',
                  backgroundColor: isActive ? 'var(--color-primary)' : 'transparent',
                  transition: 'all var(--transition-fast)'
                }}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </header>

      {/* Main Login Card Body */}
      <main
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '2rem auto',
          width: '100%',
          maxWidth: '460px'
        }}
      >
        {children}
      </main>

      {/* Footer */}
      <footer
        style={{
          textAlign: 'center',
          fontSize: '0.75rem',
          color: 'var(--text-muted)',
          maxWidth: '1200px',
          width: '100%',
          margin: '0 auto',
          paddingTop: '1rem',
          borderTop: '1px solid var(--border-light)',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.5rem'
        }}
      >
        <span>&copy; 2026 MAK Tours and Travels. All rights reserved.</span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
          <ShieldCheck size={14} style={{ color: 'var(--status-success)' }} />
          Frontend Simulation Mode &bull; Mock Authentication
        </span>
      </footer>
    </div>
  );
}

export default AuthLayout;
