// MAK Tours & Travels ERP - SaaS License & Suspension Notice Page
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, AlertTriangle, LogOut, Phone, Mail, Clock, RefreshCw } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useTenant } from '../../context/TenantContext';
import { Button } from '../../components/ui/Button';

export function LicenseLockoutPage({ type = 'suspended' }) {
  const { currentUser, logout } = useAuth();
  const { currentCompany } = useTenant();
  const navigate = useNavigate();

  const isSuspended = type === 'suspended' || currentCompany?.status === 'Suspended';
  const companyName = currentCompany?.name || currentUser?.companyName || 'Your Company';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f8fafc',
        padding: '1.5rem',
        fontFamily: 'inherit'
      }}
    >
      <div
        style={{
          maxWidth: '560px',
          width: '100%',
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01)',
          overflow: 'hidden'
        }}
      >
        {/* Header Alert Ribbon */}
        <div
          style={{
            backgroundColor: isSuspended ? '#fef2f2' : '#fffbeb',
            borderBottom: `1px solid ${isSuspended ? '#fee2e2' : '#fef3c7'}`,
            padding: '1.5rem',
            textAlign: 'center'
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: isSuspended ? '#fee2e2' : '#fef3c7',
              color: isSuspended ? '#dc2626' : '#d97706',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem'
            }}
          >
            {isSuspended ? <ShieldAlert size={32} /> : <AlertTriangle size={32} />}
          </div>

          <h2
            style={{
              fontSize: '1.35rem',
              fontWeight: 800,
              color: isSuspended ? '#991b1b' : '#92400e',
              margin: '0 0 0.5rem 0'
            }}
          >
            {isSuspended ? 'Company Account Suspended' : 'Subscription License Expired'}
          </h2>

          <p
            style={{
              fontSize: '0.875rem',
              color: isSuspended ? '#b91c1c' : '#b45309',
              margin: 0,
              lineHeight: 1.5
            }}
          >
            {isSuspended
              ? `Operational access for ${companyName} has been temporarily placed on administrative hold.`
              : `The commercial software license for ${companyName} has concluded its validity period.`}
          </p>
        </div>

        {/* Body Details */}
        <div style={{ padding: '2rem' }}>
          <div
            style={{
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              padding: '1rem',
              marginBottom: '1.5rem',
              fontSize: '0.8125rem',
              color: '#475569'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ color: '#64748b' }}>Company Tenant:</span>
              <strong style={{ color: '#0f172a' }}>{companyName}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ color: '#64748b' }}>Account Status:</span>
              <strong style={{ color: isSuspended ? '#dc2626' : '#d97706' }}>
                {isSuspended ? 'Administrative Suspension' : 'License Expired'}
              </strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748b' }}>Company Data:</span>
              <strong style={{ color: '#16a34a' }}>Safely Preserved (Zero Data Loss)</strong>
            </div>
          </div>

          <h4 style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.75rem' }}>
            Next Steps &amp; Account Reactivation
          </h4>

          <ul
            style={{
              fontSize: '0.85rem',
              color: '#475569',
              lineHeight: 1.6,
              paddingLeft: '1.25rem',
              margin: '0 0 1.5rem 0'
            }}
          >
            <li>All your bookings, vehicles, drivers, invoices, and attendance logs are securely preserved in the cloud database.</li>
            <li>New trip dispatches, booking creation, and driver assignments are paused until account reactivation.</li>
            <li>Contact your platform software administrator or SaaS billing department to renew your plan or lift the account hold.</li>
          </ul>

          <div
            style={{
              borderTop: '1px solid #e2e8f0',
              paddingTop: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem', color: '#64748b' }}>
              <Mail size={16} color="#2C3480" />
              <span>Platform Administration: <strong>support@maktours.com</strong></span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem', color: '#64748b' }}>
              <Phone size={16} color="#2C3480" />
              <span>Emergency Desk: <strong>+91 98401 11000</strong></span>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '2rem' }}>
            <Button
              variant="secondary"
              leftIcon={<LogOut size={15} />}
              onClick={handleLogout}
              style={{ flex: 1 }}
            >
              Sign Out
            </Button>
            <Button
              variant="primary"
              leftIcon={<RefreshCw size={15} />}
              onClick={() => window.location.reload()}
              style={{ flex: 1 }}
            >
              Check Status
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LicenseLockoutPage;
