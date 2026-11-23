import React from 'react';

export function Badge({
  children,
  variant = 'neutral',
  size = 'md',
  dot = false,
  className = '',
  style = {}
}) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'success':
        return {
          backgroundColor: 'var(--status-success-bg)',
          color: 'var(--status-success-text)',
          borderColor: 'transparent'
        };
      case 'warning':
        return {
          backgroundColor: 'var(--status-warning-bg)',
          color: 'var(--status-warning-text)',
          borderColor: 'transparent'
        };
      case 'danger':
        return {
          backgroundColor: 'var(--status-danger-bg)',
          color: 'var(--status-danger-text)',
          borderColor: 'transparent'
        };
      case 'info':
        return {
          backgroundColor: 'var(--status-info-bg)',
          color: 'var(--status-info-text)',
          borderColor: 'transparent'
        };
      case 'primary':
        return {
          backgroundColor: 'var(--color-primary-light)',
          color: 'var(--color-primary)',
          borderColor: 'var(--color-primary-border)'
        };
      case 'neutral':
      default:
        return {
          backgroundColor: 'var(--bg-surface-hover)',
          color: 'var(--text-secondary)',
          borderColor: 'var(--border-light)'
        };
    }
  };

  const getDotColor = () => {
    switch (variant) {
      case 'success': return 'var(--status-success)';
      case 'warning': return 'var(--status-warning)';
      case 'danger': return 'var(--status-danger)';
      case 'info': return 'var(--status-info)';
      case 'primary': return 'var(--color-primary)';
      default: return 'var(--text-muted)';
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return { padding: '0.125rem 0.5rem', fontSize: '0.6875rem' };
      case 'lg':
        return { padding: '0.375rem 0.875rem', fontSize: '0.8125rem' };
      case 'md':
      default:
        return { padding: '0.25rem 0.625rem', fontSize: '0.75rem' };
    }
  };

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.375rem',
        borderRadius: 'var(--radius-full)',
        fontWeight: 600,
        border: '1px solid',
        letterSpacing: '0.025em',
        textTransform: 'none',
        whiteSpace: 'nowrap',
        ...getVariantStyles(),
        ...getSizeStyles(),
        ...style
      }}
      className={`badge badge-${variant} ${className}`}
    >
      {dot && (
        <span
          style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            backgroundColor: getDotColor(),
            display: 'inline-block'
          }}
        />
      )}
      {children}
    </span>
  );
}

export default Badge;
