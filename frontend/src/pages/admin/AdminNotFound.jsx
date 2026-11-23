// MAK Tours & Travels ERP - Admin 404 Route Not Found
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Compass, Home, ArrowLeft } from 'lucide-react';
import { Button } from '../../components/ui/Button';

export function AdminNotFound() {
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
            backgroundColor: '#eef2ff',
            color: '#2C3480',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.25rem'
          }}
        >
          <Compass size={32} />
        </div>

        <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#2C3480', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          404 &bull; Missing Route
        </span>

        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', margin: '0.35rem 0 0.5rem' }}>
          Operational Route Not Found
        </h1>

        <p style={{ fontSize: '0.9rem', color: '#64748b', lineHeight: 1.6, margin: '0 0 1.75rem' }}>
          The ERP portal path you navigated to does not exist or has been relocated to another logistics module.
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <Button variant="outline" onClick={() => navigate(-1)}>
            <ArrowLeft size={16} style={{ marginRight: '0.4rem' }} /> Back to Previous
          </Button>
          <Button
            variant="primary"
            style={{ backgroundColor: '#2C3480' }}
            onClick={() => navigate('/admin/dashboard')}
          >
            <Home size={16} style={{ marginRight: '0.4rem' }} /> Return to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}

export default AdminNotFound;
