import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export function Input({
  label,
  type = 'text',
  name,
  value,
  onChange,
  placeholder,
  error,
  leftIcon = null,
  showPasswordToggle = false,
  required = false,
  disabled = false,
  helperText,
  style = {},
  className = '',
  ...props
}) {
  const [showPassword, setShowPassword] = useState(false);
  const inputType = type === 'password' && showPassword ? 'text' : type;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', width: '100%', ...style }}>
      {label && (
        <label
          htmlFor={name}
          style={{
            fontSize: '0.875rem',
            fontWeight: 500,
            color: 'var(--text-main)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem'
          }}
        >
          {label}
          {required && <span style={{ color: 'var(--color-primary)' }}>*</span>}
        </label>
      )}

      <div
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          width: '100%',
          backgroundColor: 'var(--bg-surface)',
          border: `1px solid ${error ? 'var(--status-danger)' : 'var(--border-medium)'}`,
          borderRadius: 'var(--radius-md)',
          transition: 'border-color var(--transition-fast), box-shadow var(--transition-fast)',
          overflow: 'hidden'
        }}
      >
        {leftIcon && (
          <span
            style={{
              paddingLeft: '0.75rem',
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            {leftIcon}
          </span>
        )}

        <input
          id={name}
          name={name}
          type={inputType}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          style={{
            flex: 1,
            padding: '0.625rem 0.875rem',
            paddingLeft: leftIcon ? '0.5rem' : '0.875rem',
            paddingRight: showPasswordToggle ? '2.5rem' : '0.875rem',
            border: 'none',
            outline: 'none',
            background: 'transparent',
            color: 'var(--text-main)',
            fontSize: '0.875rem',
            width: '100%'
          }}
          {...props}
        />

        {showPasswordToggle && type === 'password' && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            tabIndex={-1}
            style={{
              position: 'absolute',
              right: '0.75rem',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              padding: 0
            }}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>

      {error ? (
        <span style={{ fontSize: '0.75rem', color: 'var(--status-danger)', marginTop: '0.125rem' }}>
          {error}
        </span>
      ) : helperText ? (
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.125rem' }}>
          {helperText}
        </span>
      ) : null}
    </div>
  );
}

export default Input;
