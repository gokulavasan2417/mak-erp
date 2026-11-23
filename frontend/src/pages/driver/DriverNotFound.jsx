// MAK Tours & Travels ERP - Driver 404 Not Found Screen
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Compass, ArrowLeft, Home } from 'lucide-react';
import { Button } from '../../components/ui/Button';

export function DriverNotFound() {
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
            backgroundColor: '#EEF0FD',
            color: '#2C3480',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.25rem'
          }}
        >
          <Compass size={32} />
        </div>

        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.5rem' }}>
          Driver Resource Not Found (404)
        </h1>
        <p style={{ color: '#64748b', fontSize: '0.875rem', lineHeight: 1.6, marginBottom: '1.75rem' }}>
          The trip manifest, itinerary route, or document you are looking for does not exist or has been reassigned.
        </p>

        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
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
            style={{ backgroundColor: '#2C3480', borderColor: '#2C3480' }}
            leftIcon={<Home size={16} />}
            onClick={() => navigate('/driver/dashboard')}
          >
            Driver Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}

export default DriverNotFound;
