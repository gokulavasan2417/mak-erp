import React from 'react';
import { Loader2 } from 'lucide-react';

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  leftIcon = null,
  rightIcon = null,
  className = '',
  style = {},
  type = 'button',
  onClick,
  ...props
}) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: 'var(--color-primary)',
          color: '#ffffff',
          border: '1px solid transparent',
          boxShadow: 'var(--shadow-sm)'
        };
      case 'secondary':
        return {
          backgroundColor: 'var(--bg-surface-hover)',
          color: 'var(--text-main)',
          border: '1px solid var(--border-medium)',
        };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          color: 'var(--color-primary)',
          border: '1px solid var(--color-primary)',
        };
      case 'ghost':
        return {
          backgroundColor: 'transparent',
          color: 'var(--text-secondary)',
          border: '1px solid transparent',
        };
      case 'danger':
        return {
          backgroundColor: 'var(--status-danger)',
          color: '#ffffff',
          border: '1px solid transparent',
        };
      case 'success':
        return {
          backgroundColor: 'var(--status-success, #10B981)',
          color: '#ffffff',
          border: '1px solid transparent',
          boxShadow: '0 2px 4px rgba(16, 185, 129, 0.2)'
        };
      default:
        return {};
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return { padding: '0.375rem 0.75rem', fontSize: '0.8125rem' };
      case 'lg':
        return { padding: '0.75rem 1.5rem', fontSize: '1rem' };
      case 'md':
      default:
        return { padding: '0.5rem 1rem', fontSize: '0.875rem' };
    }
  };

  const baseStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    borderRadius: 'var(--radius-md)',
    fontWeight: '500',
    cursor: disabled || isLoading ? 'not-allowed' : 'pointer',
    opacity: disabled || isLoading ? 0.65 : 1,
    transition: 'all var(--transition-fast)',
    outline: 'none',
    userSelect: 'none',
    ...getVariantStyles(),
    ...getSizeStyles(),
    ...style
  };

  return (
    <button
      type={type}
      style={baseStyle}
      disabled={disabled || isLoading}
      onClick={onClick}
      className={`btn btn-${variant} ${className}`}
      {...props}
    >
      {isLoading && <Loader2 size={16} className="animate-spin" />}
      {!isLoading && leftIcon && leftIcon}
      <span>{children}</span>
      {!isLoading && rightIcon && rightIcon}
    </button>
  );
}

export default Button;
