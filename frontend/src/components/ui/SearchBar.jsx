// MAK Tours & Travels ERP - SearchBar & Filter Components
import React from 'react';
import { Search, X, SlidersHorizontal, RotateCcw } from 'lucide-react';

export function SearchBar({
  value,
  onChange,
  placeholder = 'Search records...',
  width = '300px'
}) {
  return (
    <div
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        width: '100%',
        maxWidth: width
      }}
    >
      <Search
        size={16}
        style={{
          position: 'absolute',
          left: '0.75rem',
          color: 'var(--text-muted, #64748b)',
          pointerEvents: 'none'
        }}
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: '100%',
          padding: '0.5rem 2rem 0.5rem 2.25rem',
          fontSize: '0.8125rem',
          borderRadius: '8px',
          border: '1px solid var(--border-medium, #cbd5e1)',
          backgroundColor: 'var(--bg-surface, #ffffff)',
          color: 'var(--text-main, #090d16)',
          outline: 'none',
          transition: 'all 0.15s ease'
        }}
        onFocus={(e) => {
          e.target.style.borderColor = 'var(--color-primary, #2C3480)';
          e.target.style.boxShadow = '0 0 0 3px rgba(44, 52, 128, 0.12)';
        }}
        onBlur={(e) => {
          e.target.style.borderColor = 'var(--border-medium, #cbd5e1)';
          e.target.style.boxShadow = 'none';
        }}
      />
      {value && (
        <button
          onClick={() => onChange('')}
          style={{
            position: 'absolute',
            right: '0.625rem',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--text-muted, #64748b)',
            display: 'flex',
            alignItems: 'center',
            padding: 0
          }}
          title="Clear search"
        >
          <X size={15} />
        </button>
      )}
    </div>
  );
}

export function FilterSelect({
  label,
  value,
  onChange,
  options = []
}) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
      {label && (
        <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary, #334155)', whiteSpace: 'nowrap' }}>
          {label}:
        </span>
      )}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          padding: '0.45rem 1.75rem 0.45rem 0.75rem',
          fontSize: '0.8125rem',
          fontWeight: 500,
          borderRadius: '8px',
          border: '1px solid var(--border-medium, #cbd5e1)',
          backgroundColor: 'var(--bg-surface, #ffffff)',
          color: 'var(--text-main, #090d16)',
          outline: 'none',
          cursor: 'pointer',
          appearance: 'auto'
        }}
      >
        {options.map((opt) => {
          const val = typeof opt === 'string' ? opt : opt.value;
          const lbl = typeof opt === 'string' ? opt : opt.label;
          return (
            <option key={val} value={val}>
              {lbl}
            </option>
          );
        })}
      </select>
    </div>
  );
}
