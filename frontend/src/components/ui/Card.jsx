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
        padding: '1rem clamp(0.875rem, 2.5vw, 1.5rem)',
        borderBottom: '1px solid var(--border-light)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.75rem',
        ...style
      }}
    >
      <div style={{ minWidth: 0, flex: '1 1 200px' }}>
        {title && <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-main)', margin: 0 }}>{title}</h3>}
        {subtitle && <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '0.25rem', margin: 0, overflowWrap: 'break-word', wordBreak: 'break-word' }}>{subtitle}</p>}
        {children}
      </div>
      {action && <div style={{ flexShrink: 0, maxWidth: '100%' }}>{action}</div>}
    </div>
  );
}

export function CardBody({ children, style = {}, className = '' }) {
  return (
    <div style={{ padding: 'clamp(0.875rem, 2.5vw, 1.5rem)', minWidth: 0, ...style }} className={`card-body ${className}`}>
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
