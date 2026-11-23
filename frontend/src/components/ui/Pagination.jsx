// MAK Tours & Travels ERP - Reusable Accessible Pagination Component
import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export function Pagination({
  currentPage = 1,
  totalItems = 0,
  pageSize = 10,
  onPageChange
}) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.875rem 1.25rem',
        borderTop: '1px solid var(--border-light, #e2e8f0)',
        fontSize: '0.8125rem',
        color: 'var(--text-muted, #64748b)',
        flexWrap: 'wrap',
        gap: '0.75rem'
      }}
    >
      <div>
        Showing <span style={{ fontWeight: 600, color: 'var(--text-main, #090d16)' }}>{startItem}</span> to{' '}
        <span style={{ fontWeight: 600, color: 'var(--text-main, #090d16)' }}>{endItem}</span> of{' '}
        <span style={{ fontWeight: 600, color: 'var(--text-main, #090d16)' }}>{totalItems}</span> results
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0.375rem 0.625rem',
            borderRadius: '6px',
            border: '1px solid var(--border-medium, #cbd5e1)',
            backgroundColor: 'var(--bg-surface, #ffffff)',
            color: 'var(--text-main, #090d16)',
            cursor: currentPage <= 1 ? 'not-allowed' : 'pointer',
            opacity: currentPage <= 1 ? 0.45 : 1
          }}
          title="Previous Page"
        >
          <ChevronLeft size={16} />
        </button>

        {Array.from({ length: totalPages }).map((_, idx) => {
          const pageNum = idx + 1;
          const isActive = pageNum === currentPage;
          return (
            <button
              key={pageNum}
              onClick={() => onPageChange(pageNum)}
              style={{
                minWidth: '32px',
                height: '32px',
                padding: '0 0.5rem',
                borderRadius: '6px',
                border: isActive ? 'none' : '1px solid var(--border-medium, #cbd5e1)',
                backgroundColor: isActive ? 'var(--color-primary, #2C3480)' : 'var(--bg-surface, #ffffff)',
                color: isActive ? '#ffffff' : 'var(--text-main, #090d16)',
                fontWeight: isActive ? 700 : 500,
                fontSize: '0.8125rem',
                cursor: 'pointer'
              }}
            >
              {pageNum}
            </button>
          );
        })}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0.375rem 0.625rem',
            borderRadius: '6px',
            border: '1px solid var(--border-medium, #cbd5e1)',
            backgroundColor: 'var(--bg-surface, #ffffff)',
            color: 'var(--text-main, #090d16)',
            cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer',
            opacity: currentPage >= totalPages ? 0.45 : 1
          }}
          title="Next Page"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
