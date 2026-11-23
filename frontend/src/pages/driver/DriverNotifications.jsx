// MAK Tours & Travels ERP - Driver Notifications Center
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Bell,
  CheckCheck,
  CalendarCheck,
  CreditCard,
  FileCheck,
  Megaphone,
  Clock,
  ArrowRight
} from 'lucide-react';
import { Breadcrumbs } from '../../components/common/Breadcrumbs';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { useDriverData } from '../../context/DriverDataContext';

export function DriverNotifications() {
  const {
    notifications,
    markNotificationRead,
    markAllNotificationsRead
  } = useDriverData();

  const safeNotifications = Array.isArray(notifications) ? notifications : [];
  const [activeTab, setActiveTab] = useState('All');

  const getCat = (n) => {
    if (n.category) return n.category;
    if (n.type === 'assignment') return 'Trip Assignment';
    if (n.type === 'trip') return 'Trip Update';
    if (n.type === 'payment' || n.type === 'expense') return 'Payment & Settlement';
    return 'Dispatch Notice';
  };

  const filteredNotifications = safeNotifications.filter((n) => {
    if (activeTab === 'All') return true;
    const cat = String(getCat(n) || '').toLowerCase();
    if (activeTab === 'Trips') return cat.includes('trip') || cat.includes('assignment');
    if (activeTab === 'Payments') return cat.includes('payment') || cat.includes('expense') || cat.includes('settlement');
    if (activeTab === 'Documents') return cat.includes('document') || cat.includes('verification');
    if (activeTab === 'Announcements') return cat.includes('announcement') || cat.includes('notice');
    return true;
  });

  const getCategoryIcon = (category = '') => {
    const str = String(category || '').toLowerCase();
    if (str.includes('trip') || str.includes('assignment')) return <CalendarCheck size={18} color="#2C3480" />;
    if (str.includes('payment') || str.includes('expense') || str.includes('settlement')) return <CreditCard size={18} color="#10b981" />;
    if (str.includes('document') || str.includes('verification')) return <FileCheck size={18} color="#f59e0b" />;
    return <Megaphone size={18} color="#6366f1" />;
  };

  const sanitizeMessage = (msg = '') => {
    if (!msg) return '';
    return msg.replace(/Reason:\s*nil\.?/gi, '').replace(/\s{2,}/g, ' ').trim();
  };

  const isUnread = (n) => !n.isRead && n.unread !== false;
  const unreadCount = filteredNotifications.filter(isUnread).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', width: '100%' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
        <div>
          <Breadcrumbs portal="driver" />
          <h1 style={{ fontSize: '1.625rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.25rem' }}>
            Notifications &amp; Dispatch Alerts
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Trip assignments, payment credits, compliance reminders, and company announcements.
          </p>
        </div>

        <Button
          variant="secondary"
          size="sm"
          leftIcon={<CheckCheck size={15} />}
          onClick={markAllNotificationsRead}
          style={{ borderRadius: '6px' }}
        >
          Mark All as Read
        </Button>
      </div>

      {/* Unified Straight Rectangular Card */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '6px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
          overflow: 'hidden',
          width: '100%'
        }}
      >
        {/* Rectangular Filter Tabs Toolbar */}
        <div
          style={{
            padding: '0.875rem 1.25rem',
            borderBottom: '1px solid #e2e8f0',
            backgroundColor: '#f8fafc',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.75rem'
          }}
        >
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {['All', 'Trips', 'Payments', 'Documents', 'Announcements'].map((tab) => {
              const isActive = activeTab === tab;
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  style={{
                    padding: '0.45rem 0.95rem',
                    borderRadius: '4px',
                    border: isActive ? '1px solid #2C3480' : '1px solid #cbd5e1',
                    fontSize: '0.8125rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    backgroundColor: isActive ? '#2C3480' : '#ffffff',
                    color: isActive ? '#ffffff' : '#475569',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {tab}
                </button>
              );
            })}
          </div>

          <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>
            {unreadCount > 0 ? `${unreadCount} Unread Notifications` : 'All caught up'}
          </div>
        </div>

        {/* Rectangular Notifications Rows */}
        {filteredNotifications.length === 0 ? (
          <div style={{ padding: '3.5rem 2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            No notifications in this category.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {filteredNotifications.map((notif) => {
              const unread = isUnread(notif);
              return (
                <div
                  key={notif.id}
                  style={{
                    padding: '1.25rem 1.5rem',
                    borderBottom: '1px solid #e2e8f0',
                    borderLeft: unread ? '4px solid #2C3480' : '4px solid transparent',
                    backgroundColor: unread ? '#f8faff' : '#ffffff',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '1rem',
                    transition: 'background-color 0.15s ease'
                  }}
                >
                  {/* Straight Rectangular Icon Container */}
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '6px',
                      backgroundColor: unread ? '#eef0fd' : '#f1f5f9',
                      border: '1px solid #e2e8f0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}
                  >
                    {getCategoryIcon(getCat(notif))}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.35rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span
                          style={{
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            color: '#2C3480',
                            backgroundColor: '#EEF0FD',
                            padding: '0.15rem 0.5rem',
                            borderRadius: '4px',
                            border: '1px solid #c7cefa'
                          }}
                        >
                          {getCat(notif)}
                        </span>
                        {unread && (
                          <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#dc2626', backgroundColor: '#fee2e2', padding: '0.1rem 0.4rem', borderRadius: '3px' }}>
                            NEW
                          </span>
                        )}
                      </div>
                      <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        {notif.time || notif.timestamp || 'Just now'}
                      </span>
                    </div>

                    <h4 style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#0f172a', margin: '0 0 0.25rem 0' }}>
                      {notif.title}
                    </h4>

                    <p style={{ fontSize: '0.8125rem', color: '#475569', margin: 0, lineHeight: 1.5 }}>
                      {sanitizeMessage(notif.description || notif.message)}
                    </p>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.75rem' }}>
                      {(notif.actionUrl || notif.link) ? (
                        <Link
                          to={notif.actionUrl || notif.link}
                          style={{
                            fontSize: '0.78125rem',
                            color: '#2C3480',
                            fontWeight: 700,
                            textDecoration: 'none',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            padding: '0.3rem 0.65rem',
                            backgroundColor: '#f1f5f9',
                            borderRadius: '4px',
                            border: '1px solid #e2e8f0'
                          }}
                        >
                          Open Action <ArrowRight size={13} />
                        </Link>
                      ) : <span />}

                      {unread && (
                        <button
                          type="button"
                          onClick={() => markNotificationRead(notif.id)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#2C3480',
                            fontSize: '0.75rem',
                            cursor: 'pointer',
                            textDecoration: 'underline',
                            fontWeight: 700
                          }}
                        >
                          Mark as Read
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default DriverNotifications;
