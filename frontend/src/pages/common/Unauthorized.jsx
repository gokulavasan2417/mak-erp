import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, Home, LogIn } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../hooks/useAuth';

export function Unauthorized() {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, logout } = useAuth();

  const targetPath = location.state?.from?.pathname || '';
  const targetPortal = location.state?.targetPortal || (targetPath.includes('/vendor') ? 'vendor' : targetPath.includes('/staff') ? 'employee' : targetPath.includes('/driver') ? 'driver' : 'company_admin');

  const handleSwitchAccount = (roleToSelect) => {
    logout();
    navigate(`/login?role=${roleToSelect}`);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--bg-app, #f8fafc)',
        padding: '2rem',
        textAlign: 'center'
      }}
    >
      <div
        style={{
          width: '72px',
          height: '72px',
          borderRadius: '50%',
          backgroundColor: 'rgba(239, 68, 68, 0.12)',
          color: '#dc2626',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '1.5rem'
        }}
      >
        <ShieldAlert size={36} />
      </div>

      <div style={{ fontSize: '3.5rem', fontWeight: 800, color: '#dc2626', lineHeight: 1 }}>
        403
      </div>

      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a', marginTop: '0.75rem', marginBottom: '0.5rem' }}>
        Access Unauthorized
      </h1>

      <p style={{ color: '#64748b', maxWidth: '480px', fontSize: '0.875rem', lineHeight: 1.5, marginBottom: '0.75rem' }}>
        Your authenticated session {currentUser?.email ? `(${currentUser.email} • ${currentUser.role || 'user'})` : ''} does not possess the RBAC authorization tier required for this portal resource.
      </p>

      <p style={{ color: '#475569', fontSize: '0.8125rem', marginBottom: '1.75rem' }}>
        Please sign in with an account authorized for the <strong>{targetPortal === 'vendor' ? 'Vendor Partner Portal' : targetPortal === 'staff' ? 'Staff Portal' : 'Admin Portal'}</strong>.
      </p>

      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center' }}>
        {targetPortal === 'vendor' && (
          <Button
            variant="primary"
            size="md"
            style={{ backgroundColor: '#2C3480' }}
            leftIcon={<LogIn size={16} />}
            onClick={() => handleSwitchAccount('vendor')}
          >
            Sign In as Vendor Partner
          </Button>
        )}
        <Button
          variant="outline"
          size="md"
          leftIcon={<Home size={16} />}
          onClick={() => handleSwitchAccount(targetPortal || 'company_admin')}
        >
          Switch Portal Gateway
        </Button>
      </div>
    </div>
  );
}

export default Unauthorized;
