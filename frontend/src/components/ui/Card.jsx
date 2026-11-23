import React from 'react';

export function Card({
  children,
  className = '',
  style = {},
  onClick,
  hoverable = false
}) {
  return (
    <div
      onClick={onClick}
      style={{
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--border-light)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-sm)',
        transition: 'all var(--transition-normal)',
        cursor: hoverable ? 'pointer' : 'default',
        overflow: 'hidden',
        ...style
      }}
      className={`card ${hoverable ? 'card-hoverable' : ''} ${className}`}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  subtitle,
  action,
  children,
  style = {}
}) {
  return (
    <div
      style={{
        padding: '1.25rem 1.5rem',
        borderBottom: '1px solid var(--border-light)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1rem',
        ...style
      }}
    >
      <div>
        {title && <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-main)' }}>{title}</h3>}
        {subtitle && <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>{subtitle}</p>}
        {children}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

export function CardBody({ children, style = {}, className = '' }) {
  return (
    <div style={{ padding: '1.5rem', ...style }} className={`card-body ${className}`}>
      {children}
    </div>
  );
}

export function CardFooter({ children, style = {} }) {
  return (
    <div
      style={{
        padding: '1rem 1.5rem',
        borderTop: '1px solid var(--border-light)',
        backgroundColor: 'var(--bg-surface-hover)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        gap: '0.75rem',
        ...style
      }}
    >
      {children}
    </div>
  );
}

export default Card;
