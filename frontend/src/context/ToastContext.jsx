import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'success', duration = 3500) => {
    const id = Date.now() + Math.random().toString(36).substr(2, 5);
    setToasts((prev) => {
      // Prevent stacking duplicate toasts with identical message
      if (prev.some((t) => t.message === message)) {
        return prev;
      }
      // Limit to at most 3 simultaneous toasts on screen
      const trimmed = prev.length >= 3 ? prev.slice(prev.length - 2) : prev;
      return [...trimmed, { id, message, type }];
    });

    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    }
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = {
    success: (msg, dur) => addToast(msg, 'success', dur),
    error: (msg, dur) => addToast(msg, 'error', dur),
    info: (msg, dur) => addToast(msg, 'info', dur),
    warning: (msg, dur) => addToast(msg, 'warning', dur),
  };

  const getIcon = (type) => {
    switch (type) {
      case 'success': return <CheckCircle2 size={18} color="#10B981" />;
      case 'error': return <AlertCircle size={18} color="#EF4444" />;
      case 'warning': return <AlertTriangle size={18} color="#F59E0B" />;
      case 'info':
      default: return <Info size={18} color="#2C3480" />;
    }
  };

  const getBgBorder = (type) => {
    switch (type) {
      case 'success': return { bg: '#F0FDF4', border: '#BBF7D0', text: '#15803D' };
      case 'error': return { bg: '#FEF2F2', border: '#FECACA', text: '#B91C1C' };
      case 'warning': return { bg: '#FFFBEB', border: '#FDE68A', text: '#B45309' };
      case 'info':
      default: return { bg: '#EEF0FD', border: '#C7CEFA', text: '#2C3480' };
    }
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      {/* Toast container */}
      <div
        style={{
          position: 'fixed',
          top: '1.25rem',
          right: '1.25rem',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          gap: '0.625rem',
          maxWidth: '380px',
          width: '100%',
          pointerEvents: 'none'
        }}
      >
        {toasts.map((t) => {
          const style = getBgBorder(t.type);
          return (
            <div
              key={t.id}
              style={{
                pointerEvents: 'auto',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '0.75rem',
                backgroundColor: style.bg,
                border: `1px solid ${style.border}`,
                borderRadius: '12px',
                padding: '0.75rem 1rem',
                boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.05)',
                color: style.text,
                fontSize: '0.875rem',
                fontWeight: 500,
                animation: 'slideInRight 0.25s ease-out',
                lineHeight: 1.4
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                {getIcon(t.type)}
                <span>{t.message}</span>
              </div>
              <button
                onClick={() => removeToast(t.id)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: style.text,
                  opacity: 0.6,
                  display: 'flex',
                  alignItems: 'center',
                  padding: '2px'
                }}
              >
                <X size={15} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    return {
      success: (msg) => console.log('Toast:', msg),
      error: (msg) => console.error('Toast Error:', msg),
      info: (msg) => console.log('Toast Info:', msg),
      warning: (msg) => console.warn('Toast Warning:', msg),
    };
  }
  return context;
}
