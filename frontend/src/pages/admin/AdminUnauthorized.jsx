// MAK Tours & Travels ERP - Admin Unauthorized Access Screen
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, Home, LogIn } from 'lucide-react';
import { Button } from '../../components/ui/Button';

export function AdminUnauthorized() {
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
          Access Restricted / Unauthorized
        </h1>

        <p style={{ fontSize: '0.9rem', color: '#64748b', lineHeight: 1.6, margin: '0 0 1.75rem' }}>
          You do not have administrative clearance or token credentials to inspect this section of MAK Tours and Travels ERP. Please verify your role or re-authenticate.
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <Button variant="outline" onClick={() => navigate('/admin/dashboard')}>
            <Home size={16} style={{ marginRight: '0.4rem' }} /> Operations Dashboard
          </Button>
          <Button
            variant="primary"
            style={{ backgroundColor: '#2C3480' }}
            onClick={() => navigate('/admin/login')}
          >
            <LogIn size={16} style={{ marginRight: '0.4rem' }} /> Switch Credentials
          </Button>
        </div>
      </div>
    </div>
  );
}

export default AdminUnauthorized;
