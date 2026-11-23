import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck, Clock } from 'lucide-react';
import { useAdminData } from '../../context/AdminDataContext';
import { useDriverData } from '../../context/DriverDataContext';

export function NotificationPopover({ portal = 'admin' }) {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef(null);

  let adminCtx = null;
  let driverCtx = null;
  try {
    adminCtx = useAdminData();
  } catch (e) {}
  try {
    driverCtx = useDriverData();
  } catch (e) {}

  const activeCtx = portal === 'driver' ? driverCtx : adminCtx;
  const notifications = activeCtx?.notifications || [];
  const unreadCount = notifications.filter(n => n.unread || (n.isRead !== undefined && !n.isRead)).length;

  useEffect(() => {
    function handleClickOutside(event) {
      if (popoverRef.current && !popoverRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAllAsRead = () => {
    if (activeCtx?.markAllNotificationsRead) {
      activeCtx.markAllNotificationsRead();
    }
  };

  const handleMarkOne = (item) => {
    if (activeCtx?.markNotificationRead && item?.id) {
      activeCtx.markNotificationRead(item.id);
    }
    const targetUrl = item?.actionUrl || item?.actionLink || item?.link;
    if (targetUrl) {
      setIsOpen(false);
      navigate(targetUrl);
    }
  };

  return (
    <div style={{ position: 'relative' }} ref={popoverRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '38px',
          height: '38px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-medium)',
          backgroundColor: isOpen ? 'var(--bg-surface-hover)' : 'var(--bg-surface)',
          color: 'var(--text-main)',
          cursor: 'pointer',
          transition: 'all var(--transition-fast)'
        }}
        title="Notifications"
        aria-label="View notifications"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: '-4px',
              right: '-4px',
              backgroundColor: 'var(--color-primary)',
              color: '#ffffff',
              fontSize: '0.625rem',
              fontWeight: 700,
              minWidth: '18px',
              height: '18px',
              borderRadius: '9999px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 4px',
              boxShadow: '0 0 0 2px var(--bg-surface)'
            }}
          >
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            width: 'min(320px, calc(100vw - 2rem))',
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-light)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-xl)',
            zIndex: 1000,
            overflow: 'hidden'
          }}
        >
          <div
            style={{
              padding: '0.875rem 1rem',
              borderBottom: '1px solid var(--border-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-main)' }}>Notifications</span>
              {unreadCount > 0 && (
                <span
                  style={{
                    backgroundColor: 'var(--color-primary-light)',
                    color: 'var(--color-primary)',
                    fontSize: '0.6875rem',
                    fontWeight: 600,
                    padding: '0.125rem 0.375rem',
                    borderRadius: 'var(--radius-full)'
                  }}
                >
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '0.75rem',
                  color: 'var(--color-primary)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  padding: 0
                }}
              >
                <CheckCheck size={14} /> Mark all read
              </button>
            )}
          </div>

          <div style={{ maxHeight: '340px', overflowY: 'auto' }}>
            {notifications.length > 0 ? (
              notifications.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleMarkOne(item)}
                  style={{
                    padding: '0.875rem 1rem',
                    borderBottom: '1px solid var(--border-light)',
                    backgroundColor: (item.unread || item.isRead === false) ? 'rgba(44, 52, 128, 0.08)' : 'transparent',
                    cursor: 'pointer',
                    transition: 'background-color var(--transition-fast)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.25rem' }}>
                    <h5 style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-main)', margin: 0 }}>
                      {item.title}
                    </h5>
                    <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.125rem' }}>
                      <Clock size={10} /> {(item.time && String(item.time).trim()) || (item.timestamp && String(item.timestamp).trim()) || (item.createdAt ? new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now')}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.4, margin: '0.25rem 0 0' }}>
                    {item.message || item.description}
                  </p>
                </div>
              ))
            ) : (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
                No notifications right now
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default NotificationPopover;
