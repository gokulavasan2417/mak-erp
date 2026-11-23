// MAK Tours & Travels ERP - Employee Avatar Component
// Renders uploaded photos, preset avatars, and monogram initials with graceful fallbacks
import React, { useState, useEffect } from 'react';

/**
 * Priority Display:
 * 1. Employee's uploaded profile photo (http, https, data:, /)
 * 2. Employee's selected preset avatar URL
 * 3. Monogram initials (if Use Initials is chosen or image absent/broken)
 */
export function EmployeeAvatar({
  avatar,
  name = 'Staff Member',
  size = 52,
  borderRadius = '14px',
  fontSize,
  style = {},
  className = '',
  backgroundColor = '#2C3480',
  color = '#ffffff',
  boxShadow,
  border
}) {
  const [imageError, setImageError] = useState(false);

  // Reset error state if avatar prop changes
  useEffect(() => {
    setImageError(false);
  }, [avatar]);

  const cleanName = (name || '').trim();

  // Compute initials fallback (e.g., "Vimal" -> "VI", "Rajesh Sharma" -> "RS")
  let initials = 'ST';
  if (cleanName) {
    const parts = cleanName.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      initials = (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    } else {
      initials = cleanName.substring(0, 2).toUpperCase();
    }
  }

  // Check if avatar is an image URL or data URI
  const isImageSrc =
    avatar &&
    typeof avatar === 'string' &&
    (avatar.startsWith('http://') ||
      avatar.startsWith('https://') ||
      avatar.startsWith('data:image/') ||
      avatar.startsWith('/'));

  // Custom initials if avatar string is 1-4 letters without URL characters
  const customInitials =
    typeof avatar === 'string' &&
    avatar.length <= 4 &&
    !avatar.includes('/') &&
    !avatar.includes('.') &&
    !avatar.includes(':')
      ? avatar.toUpperCase()
      : null;

  const displayInitials = customInitials || initials;
  const computedFontSize = fontSize || `${Math.max(0.75, Math.round(size * 0.28) / 10)}rem`;

  if (isImageSrc && !imageError) {
    return (
      <img
        src={avatar}
        alt={cleanName}
        onError={() => setImageError(true)}
        className={className}
        style={{
          width: `${size}px`,
          height: `${size}px`,
          borderRadius,
          objectFit: 'cover',
          display: 'block',
          flexShrink: 0,
          border: border || 'none',
          boxShadow: boxShadow || '0 2px 4px rgba(0,0,0,0.06)',
          ...style
        }}
      />
    );
  }

  return (
    <div
      className={className}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        borderRadius,
        backgroundColor,
        color,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 800,
        fontSize: computedFontSize,
        letterSpacing: '0.04em',
        flexShrink: 0,
        boxShadow: boxShadow || '0 2px 4px rgba(44, 52, 128, 0.2)',
        border: border || 'none',
        ...style
      }}
    >
      {displayInitials}
    </div>
  );
}

export default EmployeeAvatar;
