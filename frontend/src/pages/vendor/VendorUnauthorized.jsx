// MAK Tours & Travels ERP - Vendor Unauthorized Access Screen
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, Home, LogIn } from 'lucide-react';
import { Button } from '../../components/ui/Button';

export function VendorUnauthorized() {
  const navigate = useNavigate();

  return (
    <div
      style={{
        minHeight: '70vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem'
      }}
    >
      <div
        style={{
          maxWidth: '520px',
          width: '100%',
          backgroundColor: '#ffffff',
          borderRadius: '20px',
          border: '1px solid #e2e8f0',
          padding: '2.5rem 2rem',
          textAlign: 'center',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05)'
        }}
      >
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '16px',
            backgroundColor: '#fef2f2',
            color: '#dc2626',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.25rem'
          }}
        >
          <ShieldAlert size={32} />
        </div>

        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.5rem' }}>
          Vendor Access Restricted
        </h1>
        <p style={{ color: '#64748b', fontSize: '0.875rem', lineHeight: 1.6, marginBottom: '1.75rem' }}>
          You do not have verified partner credentials to access this section of the MAK Vendor Portal. Please contact your MAK account manager or sign in with an authorized partner profile.
        </p>

        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<ArrowLeft size={16} />}
            onClick={() => navigate(-1)}
          >
            Go Back
          </Button>
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Home size={16} />}
            onClick={() => navigate('/vendor/dashboard')}
          >
            Vendor Dashboard
          </Button>
          <Button
            variant="outline"
            size="sm"
            leftIcon={<LogIn size={16} />}
            onClick={() => navigate('/login')}
          >
            Switch Account
          </Button>
        </div>
      </div>
    </div>
  );
}

export default VendorUnauthorized;
