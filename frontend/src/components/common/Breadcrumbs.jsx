import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

export function Breadcrumbs({ portal = 'admin' }) {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter(x => x);

  const getPortalHome = () => {
    switch (portal) {
      case 'super-admin': return '/super-admin/dashboard';
      case 'driver': return '/driver/dashboard';
      case 'vendor': return '/vendor/dashboard';
      case 'staff': return '/staff/dashboard';
      case 'accountant': return '/accountant/dashboard';
      case 'admin':
      default: return '/admin/dashboard';
    }
  };

  const formatSegment = (segment) => {
    return segment
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <nav style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
      <Link
        to={getPortalHome()}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.25rem',
          color: 'var(--text-muted)'
        }}
        title="Dashboard"
      >
        <Home size={14} />
      </Link>

      {pathnames.map((name, index) => {
        const routeTo = `/${pathnames.slice(0, index + 1).join('/')}`;
        const isLast = index === pathnames.length - 1;

        // Skip root portal prefix if it's the first segment and there are subsequent segments
        if (index === 0 && pathnames.length > 1) {
          return null;
        }

        return (
          <React.Fragment key={routeTo}>
            <ChevronRight size={12} style={{ color: 'var(--text-muted)', opacity: 0.7 }} />
            {isLast ? (
              <span style={{ color: 'var(--text-main)', fontWeight: 500 }}>
                {formatSegment(name)}
              </span>
            ) : (
              <Link to={routeTo} style={{ color: 'var(--text-muted)' }}>
                {formatSegment(name)}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}

export default Breadcrumbs;
