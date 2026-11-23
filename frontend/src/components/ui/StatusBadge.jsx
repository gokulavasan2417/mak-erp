// MAK Tours & Travels ERP - Status Badge Component
import React from 'react';
import { Badge } from './Badge';

export function StatusBadge({ status, size = 'md', className = '', style = {} }) {
  if (!status) return null;

  const normalized = status.toString().trim().toLowerCase();

  let variant = 'neutral';
  let dot = true;

  switch (normalized) {
    // Success States
    case 'confirmed':
    case 'completed':
    case 'paid':
    case 'approved':
    case 'active':
    case 'available':
    case 'present':
    case 'verified':
    case 'on schedule':
      variant = 'success';
      break;

    // Info / In-Flight States
    case 'on trip':
    case 'driver assigned':
    case 'vehicle assigned':
    case 'in transit':
    case 'in progress':
      variant = 'info';
      break;

    // Primary Brand States
    case 'corporate':
    case 'standard':
      variant = 'primary';
      break;

    // Warning / Pending States
    case 'pending':
    case 'pending approval':
    case 'pending audit':
    case 'partially paid':
    case 'on leave':
    case 'under maintenance':
    case 'upcoming':
    case 'expiring soon':
      variant = 'warning';
      break;

    // Danger / Negative States
    case 'cancelled':
    case 'rejected':
    case 'suspended':
    case 'inactive':
    case 'refunded':
    case 'overdue':
    case 'expired':
    case 'breakdown':
      variant = 'danger';
      break;

    default:
      variant = 'neutral';
  }

  return (
    <Badge
      variant={variant}
      size={size}
      dot={dot}
      className={className}
      style={style}
    >
      {status}
    </Badge>
  );
}

export default StatusBadge;
