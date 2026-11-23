// MAK Tours & Travels ERP - Reusable Accessible Dropdown Component
import React, { useState, useRef, useEffect } from 'react';

export function Dropdown({ trigger, items = [], align = 'right' }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div ref={dropdownRef} style={{ position: 'relative', display: 'inline-block' }}>
      <div onClick={() => setIsOpen(!isOpen)} style={{ cursor: 'pointer' }}>
        {trigger}
      </div>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            [align === 'right' ? 'right' : 'left']: 0,
            zIndex: 1000,
            minWidth: '180px',
            backgroundColor: 'var(--bg-surface, #ffffff)',
            borderRadius: '10px',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.05)',
            border: '1px solid var(--border-light, #e2e8f0)',
            padding: '0.375rem',
            animation: 'fadeIn 0.15s ease-out'
          }}
        >
          {items.map((item, idx) => {
            if (item.divider) {
              return (
                <div
                  key={idx}
                  style={{
                    height: '1px',
                    backgroundColor: 'var(--border-light, #e2e8f0)',
                    margin: '0.375rem 0'
                  }}
                />
              );
            }
            const Icon = item.icon;
            return (
              <button
                key={idx}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsOpen(false);
                  if (item.onClick) item.onClick();
                }}
                disabled={item.disabled}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.625rem',
                  padding: '0.5rem 0.75rem',
                  fontSize: '0.8125rem',
                  fontWeight: 500,
                  color: item.danger ? 'var(--status-danger, #ef4444)' : 'var(--text-main, #090d16)',
                  backgroundColor: 'transparent',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: item.disabled ? 'not-allowed' : 'pointer',
                  opacity: item.disabled ? 0.5 : 1,
                  textAlign: 'left',
                  transition: 'background-color 0.15s ease'
                }}
                onMouseEnter={(e) => {
                  if (!item.disabled) {
                    e.currentTarget.style.backgroundColor = item.danger
                      ? '#FEF2F2'
                      : 'var(--bg-surface-hover, #f1f5f9)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                {Icon && <Icon size={16} />}
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
