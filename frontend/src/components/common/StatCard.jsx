import React, { useState } from 'react';
import { TrendingUp, TrendingDown, ArrowUpRight } from 'lucide-react';

export function StatCard({
  title,
  value,
  change,
  isPositive = true,
  description,
  icon: Icon,
  accentColor = '#2C3480',
  onClick,
  style = {},
  className = '',
  tooltip,
  ...props
}) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      title={tooltip || (onClick ? `Open ${title}` : undefined)}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(e); } } : undefined}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        backgroundColor: '#ffffff',
        border: `1px solid ${isHovered && onClick ? accentColor : '#e2e8f0'}`,
        borderRadius: '16px',
        boxShadow: isHovered && onClick
          ? '0 10px 24px rgba(44, 52, 128, 0.12), 0 3px 8px rgba(0, 0, 0, 0.04)'
          : '0 2px 10px rgba(44, 52, 128, 0.04), 0 1px 3px rgba(0, 0, 0, 0.02)',
        transform: isHovered && onClick ? 'translateY(-3px)' : 'none',
        position: 'relative',
        overflow: 'hidden',
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        height: '100%',
        cursor: onClick ? 'pointer' : 'default',
        userSelect: onClick ? 'none' : 'auto',
        ...style
      }}
      className={`stat-card ${className}`}
      {...props}
    >
      {/* Top Accent Strip */}
      <div
        style={{
          height: isHovered && onClick ? '4px' : '3px',
          background: `linear-gradient(90deg, ${accentColor} 0%, rgba(44, 52, 128, 0.2) 100%)`,
          transition: 'height 0.2s ease'
        }}
      />

      <div style={{ padding: '1.25rem 1.35rem 1.15rem 1.35rem', display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', minHeight: '40px', gap: '0.5rem', marginBottom: '0.625rem' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.03em', lineHeight: 1.35 }}>
              {title}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              {onClick && isHovered && (
                <ArrowUpRight size={14} color={accentColor} style={{ opacity: 0.85 }} />
              )}
              {Icon && (
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    backgroundColor: isHovered && onClick ? '#EEF0FD' : '#EEF0FD',
                    color: accentColor,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    border: '1px solid rgba(44, 52, 128, 0.12)',
                    transition: 'transform 0.2s ease',
                    transform: isHovered && onClick ? 'scale(1.08)' : 'none'
                  }}
                >
                  <Icon size={18} />
                </div>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.35rem', flexWrap: 'wrap' }}>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#090d16', letterSpacing: '-0.03em', margin: 0, lineHeight: 1.1 }}>
              {value}
            </h2>
            {change && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.2rem',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  whiteSpace: 'nowrap',
                  color: isPositive ? '#065f46' : '#991b1b',
                  backgroundColor: isPositive ? '#ecfdf5' : '#fef2f2',
                  padding: '0.15rem 0.45rem',
                  borderRadius: '9999px',
                  border: isPositive ? '1px solid #d1fae5' : '1px solid #fee2e2'
                }}
              >
                {isPositive ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                {change}
              </span>
            )}
          </div>
        </div>

        {description && (
          <p style={{ fontSize: '0.8125rem', color: '#64748b', margin: 0, fontWeight: 500, marginTop: '0.25rem' }}>
            {description}
          </p>
        )}
      </div>
    </div>
  );
}

export default StatCard;
