import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Compass, Home, ArrowLeft } from 'lucide-react';
import { Button } from '../../components/ui/Button';

export function NotFound() {
  const navigate = useNavigate();
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--bg-app)',
        padding: '2rem',
        textAlign: 'center'
      }}
    >
      <div
        style={{
          width: '72px',
          height: '72px',
          borderRadius: '50%',
          backgroundColor: 'rgba(220, 38, 38, 0.1)',
          color: 'var(--color-primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '1.5rem'
        }}
      >
        <Compass size={36} />
      </div>

      <div style={{ fontSize: '4rem', fontWeight: 800, color: 'var(--color-primary)', lineHeight: 1 }}>
        404
      </div>

      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '0.75rem', marginBottom: '0.5rem' }}>
        Route Not Found in MAK ERP
      </h1>

      <p style={{ color: 'var(--text-muted)', maxWidth: '440px', fontSize: '0.875rem', lineHeight: 1.5, marginBottom: '1.75rem' }}>
        The requested URL path does not exist or may belong to another portal module. Please check the route or return to the gateway.
      </p>

      <div style={{ display: 'flex', gap: '0.75rem' }}>
        <Button variant="primary" size="md" leftIcon={<Home size={16} />} onClick={() => navigate('/')}>
          Portal Gateway
        </Button>
        <Button variant="secondary" size="md" onClick={() => navigate('/admin/dashboard')}>
          Operations Admin
        </Button>
      </div>
    </div>
  );
}

export default NotFound;
