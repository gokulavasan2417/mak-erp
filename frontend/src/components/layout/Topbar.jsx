import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Menu,
  Search,
  Sun,
  Moon,
  LogOut,
  User,
  ShieldAlert,
  ArrowRightLeft,
  ChevronDown
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import { Breadcrumbs } from '../common/Breadcrumbs';
import { NotificationPopover } from '../common/NotificationPopover';
import { EditProfileModal } from '../common/EditProfileModal';

export function Topbar({
  portal = 'admin',
  onOpenMobileSidebar
}) {
  const { currentUser, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [topbarAvatarError, setTopbarAvatarError] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const profileMenuRef = useRef(null);

  useEffect(() => {
    setTopbarAvatarError(false);
  }, [currentUser?.avatar]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target)) {
        setIsProfileOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header
      style={{
        height: 'var(--topbar-height)',
        backgroundColor: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border-light)',
        padding: '0 1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        gap: '1rem'
      }}
    >
      {/* Left Area: Mobile Toggle & Breadcrumbs */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', minWidth: 0 }}>
        {onOpenMobileSidebar && (
          <button
            onClick={onOpenMobileSidebar}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-main)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              padding: '0.375rem',
              borderRadius: 'var(--radius-sm)'
            }}
            aria-label="Open Navigation Menu"
          >
            <Menu size={22} />
          </button>
        )}

        <div style={{ minWidth: 0 }}>
          <Breadcrumbs portal={portal} />
        </div>
      </div>

      {/* Middle Area: Global Search */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          maxWidth: '380px',
          width: '100%',
          position: 'relative'
        }}
        className="topbar-search"
      >
        <Search
          size={16}
          style={{
            position: 'absolute',
            left: '0.875rem',
            color: 'var(--text-muted)'
          }}
        />
        <input
          type="text"
          placeholder="Global search (bookings, vehicles, drivers)..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: '100%',
            padding: '0.45rem 2.25rem 0.45rem 2.25rem',
            backgroundColor: 'var(--bg-app)',
            border: '1px solid var(--border-medium)',
            borderRadius: 'var(--radius-full)',
            fontSize: '0.8125rem',
            color: 'var(--text-main)',
            outline: 'none',
            transition: 'border-color var(--transition-fast)'
          }}
        />
        <span
          style={{
            position: 'absolute',
            right: '0.875rem',
            fontSize: '0.6875rem',
            color: 'var(--text-muted)',
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-light)',
            padding: '0.125rem 0.375rem',
            borderRadius: '4px',
            pointerEvents: 'none'
          }}
        >
          ⌘K
        </span>
      </div>

      {/* Right Area: Controls & Profile */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          style={{
            width: '38px',
            height: '38px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-medium)',
            backgroundColor: 'var(--bg-surface)',
            color: 'var(--text-main)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all var(--transition-fast)'
          }}
          title={isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
        >
          {isDark ? <Sun size={18} style={{ color: '#f59e0b' }} /> : <Moon size={18} />}
        </button>

        {/* Notifications */}
        <NotificationPopover portal={portal} />

        {/* Profile Dropdown */}
        <div style={{ position: 'relative' }} ref={profileMenuRef}>
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.625rem',
              background: 'none',
              border: '1px solid var(--border-light)',
              borderRadius: 'var(--radius-full)',
              padding: '0.25rem 0.75rem 0.25rem 0.375rem',
              cursor: 'pointer',
              backgroundColor: isProfileOpen ? 'var(--bg-surface-hover)' : 'transparent',
              transition: 'background-color var(--transition-fast)'
            }}
          >
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: 'var(--color-primary, #2C3480)',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                flexShrink: 0
              }}
            >
              {currentUser?.avatar && !topbarAvatarError && (currentUser.avatar.startsWith('http') || currentUser.avatar.startsWith('data:') || currentUser.avatar.startsWith('/')) ? (
                <img
                  src={currentUser.avatar}
                  alt={currentUser?.name || 'User'}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={() => setTopbarAvatarError(true)}
                />
              ) : (
                (currentUser?.avatar || currentUser?.name || 'MK').substring(0, 2).toUpperCase()
              )}
            </div>
            <div style={{ textAlign: 'left', display: 'none' }} className="user-text-lg">
              <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-main)', lineHeight: 1.2 }}>
                {currentUser?.name || 'Administrator'}
              </div>
              <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                {currentUser?.role || 'Operations'}
              </div>
            </div>
            <ChevronDown size={14} style={{ color: 'var(--text-muted)' }} />
          </button>

          {/* Profile Popover Menu */}
          {isProfileOpen && (
            <div
              style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                right: 0,
                width: '260px',
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-light)',
                borderRadius: 'var(--radius-lg)',
                boxShadow: 'var(--shadow-xl)',
                zIndex: 1000,
                overflow: 'hidden'
              }}
            >
              <div style={{ padding: '1rem', borderBottom: '1px solid var(--border-light)' }}>
                <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-main)' }}>
                  {currentUser?.name || 'MAK User'}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.125rem' }}>
                  {currentUser?.email || 'user@maktours.com'}
                </div>
                {currentUser?.designation && (
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.125rem', fontStyle: 'italic' }}>
                    {currentUser.designation}
                  </div>
                )}
                <div
                  style={{
                    display: 'inline-block',
                    fontSize: '0.6875rem',
                    fontWeight: 600,
                    color: 'var(--color-primary)',
                    backgroundColor: 'var(--color-primary-light)',
                    padding: '0.125rem 0.5rem',
                    borderRadius: 'var(--radius-full)',
                    marginTop: '0.5rem'
                  }}
                >
                  {currentUser?.role || portal.toUpperCase()}
                </div>
              </div>

              {/* User Profile & Account Actions */}
              <div style={{ padding: '0.375rem 0', borderBottom: '1px solid var(--border-light)' }}>
                <button
                  type="button"
                  onClick={() => {
                    setIsProfileOpen(false);
                    setIsEditProfileOpen(true);
                  }}
                  style={{
                    width: '100%',
                    padding: '0.625rem 1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.625rem',
                    background: 'none',
                    border: 'none',
                    fontSize: '0.8125rem',
                    color: 'var(--text-main, #0f172a)',
                    fontWeight: 600,
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'background-color 0.15s ease'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover, #f1f5f9)')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <User size={16} style={{ color: 'var(--color-primary, #2C3480)' }} />
                  <span>Edit Profile</span>
                </button>
              </div>

              {/* Sign out */}
              <div style={{ padding: '0.5rem' }}>
                <button
                  onClick={handleLogout}
                  style={{
                    width: '100%',
                    padding: '0.5rem 0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    borderRadius: 'var(--radius-md)',
                    background: 'none',
                    border: 'none',
                    fontSize: '0.8125rem',
                    color: 'var(--status-danger)',
                    cursor: 'pointer',
                    fontWeight: 500
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--status-danger-bg)')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <LogOut size={16} />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Edit Profile Modal */}
      <EditProfileModal
        isOpen={isEditProfileOpen}
        onClose={() => setIsEditProfileOpen(false)}
      />
    </header>
  );
}

export default Topbar;
