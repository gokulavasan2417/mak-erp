import React from 'react';

export function Skeleton({
  width = '100%',
  height = '1rem',
  borderRadius = 'var(--radius-sm)',
  className = '',
  style = {}
}) {
  return (
    <div
      className={`animate-pulse ${className}`}
      style={{
        width,
        height,
        borderRadius,
        backgroundColor: 'var(--bg-surface-active)',
        ...style
      }}
    />
  );
}

export function CardSkeleton() {
  return (
    <div
      style={{
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--border-light)',
        borderRadius: 'var(--radius-lg)',
        padding: '1.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem'
      }}
    >
      <Skeleton width="40%" height="0.875rem" />
      <Skeleton width="60%" height="1.75rem" />
      <Skeleton width="80%" height="0.75rem" />
    </div>
  );
}

export default Skeleton;
