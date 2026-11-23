import React from 'react';

export function LoadingSpinner({ message = 'Loading...' }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '280px',
        padding: '3rem 1.5rem',
        width: '100%',
        color: '#2C3480'
      }}
    >
      <div
        style={{
          width: '38px',
          height: '38px',
          border: '3px solid rgba(44, 52, 128, 0.15)',
          borderTopColor: '#2C3480',
          borderRadius: '50%',
          animation: 'mak-spin 0.75s linear infinite'
        }}
      />
      <p style={{ marginTop: '1rem', fontSize: '0.85rem', fontWeight: 600, color: '#64748b' }}>
        {message}
      </p>
      <style>{`
        @keyframes mak-spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default LoadingSpinner;
