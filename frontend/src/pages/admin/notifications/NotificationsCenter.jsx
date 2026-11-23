// MAK Tours & Travels ERP - Centralized Operations Notifications Center
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  CheckCheck,
  Trash2,
  Calendar,
  AlertCircle,
  CreditCard,
  Car,
  UserCheck,
  FileText,
  Clock,
  ExternalLink,
  Filter,
  Check
} from 'lucide-react';
import { Card, CardHeader, CardBody } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { useAdminData } from '../../../context/AdminDataContext';
import { notificationCategories } from '../../../data';

export function NotificationsCenter() {
  const navigate = useNavigate();
  const {
    notifications,
    markNotificationRead,
    markAllNotificationsRead,
    clearNotification
  } = useAdminData();

  const [categoryFilter, setCategoryFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [onlyUnread, setOnlyUnread] = useState(false);

  // Filtered notifications
  const filteredNotifications = useMemo(() => {
    return notifications.filter((n) => {
      const matchCategory = categoryFilter === 'All' || n.category === categoryFilter;
      const matchPriority = priorityFilter === 'All' || n.priority === priorityFilter;
      const matchUnread = !onlyUnread || n.unread;

      return matchCategory && matchPriority && matchUnread;
    });
  }, [notifications, categoryFilter, priorityFilter, onlyUnread]);

  const unreadCount = notifications.filter((n) => n.unread).length;

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'New Booking':
      case 'Upcoming Trips':
        return <Calendar size={18} style={{ color: '#2C3480' }} />;
      case 'Payment Received':
      case 'Pending Payments':
        return <CreditCard size={18} style={{ color: '#16a34a' }} />;
      case 'Vehicle Document Expiry':
        return <Car size={18} style={{ color: '#dc2626' }} />;
      case 'Driver Assignment':
      case 'Driver License Expiry':
      case 'Driver Leave Request':
      case 'Staff Leave Request':
        return <UserCheck size={18} style={{ color: '#2563eb' }} />;
      case 'Booking Cancellation':
        return <AlertCircle size={18} style={{ color: '#ea580c' }} />;
      default:
        return <Bell size={18} style={{ color: '#64748b' }} />;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: '1000px', margin: '0 auto' }}>
      {/* Header Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          backgroundColor: '#ffffff',
          padding: '1.25rem 1.5rem',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              backgroundColor: '#eef2ff',
              color: '#2C3480',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative'
            }}
          >
            <Bell size={22} />
            {unreadCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: '-4px',
                  right: '-4px',
                  width: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  backgroundColor: '#dc2626',
                  color: '#fff',
                  fontSize: '0.7rem',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {unreadCount}
              </span>
            )}
          </div>
          <div>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
              Operations Notification Center
            </h1>
            <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0.25rem 0 0' }}>
              Real-time operational alerts, booking dispatches, document expiries & payment confirmations
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={markAllNotificationsRead}>
              <CheckCheck size={15} style={{ marginRight: '0.35rem', color: '#16a34a' }} /> Mark All Read
            </Button>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      <Card>
        <CardBody style={{ padding: '0.875rem 1.25rem' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                style={{
                  padding: '0.5rem 0.75rem',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.85rem',
                  backgroundColor: '#fff'
                }}
              >
                {notificationCategories.map((c) => (
                  <option key={c} value={c}>
                    {c === 'All' ? 'All Alert Categories' : c}
                  </option>
                ))}
              </select>

              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                style={{
                  padding: '0.5rem 0.75rem',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.85rem',
                  backgroundColor: '#fff'
                }}
              >
                <option value="All">All Priorities</option>
                <option value="high">High Priority</option>
                <option value="medium">Medium</option>
                <option value="low">Standard / Low</option>
              </select>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', color: '#334155', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={onlyUnread}
                  onChange={(e) => setOnlyUnread(e.target.checked)}
                  style={{ width: '16px', height: '16px', accentColor: '#2C3480' }}
                />
                Unread only
              </label>
            </div>

            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
              Showing {filteredNotifications.length} of {notifications.length} alerts
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Notifications List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {filteredNotifications.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', backgroundColor: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
            <Bell size={40} style={{ color: '#cbd5e1', margin: '0 auto 0.75rem' }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e293b' }}>No notifications found</h3>
            <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.25rem' }}>
              You're completely caught up with your operational alerts.
            </p>
          </div>
        ) : (
          filteredNotifications.map((ntf) => (
            <div
              key={ntf.id}
              style={{
                backgroundColor: ntf.unread ? '#f8fafc' : '#ffffff',
                borderLeft: ntf.unread ? '4px solid #2C3480' : '1px solid #e2e8f0',
                borderTop: '1px solid #e2e8f0',
                borderRight: '1px solid #e2e8f0',
                borderBottom: '1px solid #e2e8f0',
                borderRadius: '12px',
                padding: '1rem 1.25rem',
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                gap: '1rem',
                boxShadow: ntf.unread ? '0 2px 4px rgba(0,0,0,0.03)' : 'none',
                transition: 'background-color 0.15s'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.875rem', flex: 1 }}>
                <div
                  style={{
                    padding: '0.6rem',
                    borderRadius: '10px',
                    backgroundColor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}
                >
                  {getCategoryIcon(ntf.category)}
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.925rem', fontWeight: ntf.unread ? 800 : 600, color: '#0f172a' }}>
                      {ntf.title}
                    </span>
                    <span
                      style={{
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        padding: '0.1rem 0.45rem',
                        borderRadius: '4px',
                        backgroundColor: '#f1f5f9',
                        color: '#475569'
                      }}
                    >
                      {ntf.category}
                    </span>
                    {ntf.priority === 'high' && (
                      <span
                        style={{
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          padding: '0.1rem 0.45rem',
                          borderRadius: '4px',
                          backgroundColor: '#fef2f2',
                          color: '#dc2626'
                        }}
                      >
                        High Priority
                      </span>
                    )}
                  </div>

                  <p style={{ fontSize: '0.85rem', color: '#475569', margin: '0.35rem 0 0.5rem', lineHeight: 1.5 }}>
                    {ntf.message || ntf.description}
                  </p>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', fontSize: '0.75rem', color: '#64748b', flexWrap: 'wrap' }}>
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        color: '#334155',
                        backgroundColor: '#f1f5f9',
                        padding: '0.2rem 0.55rem',
                        borderRadius: '6px',
                        border: '1px solid #e2e8f0'
                      }}
                    >
                      <Clock size={12} style={{ color: '#2C3480' }} />
                      <span>
                        {(ntf.time && String(ntf.time).trim()) ||
                         (ntf.timestamp && String(ntf.timestamp).trim()) ||
                         (ntf.createdAt ? new Date(ntf.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Just now')}
                      </span>
                    </div>

                    {(ntf.actionLink || ntf.actionUrl) && (
                      <button
                        onClick={() => {
                          markNotificationRead(ntf.id);
                          navigate(ntf.actionLink || ntf.actionUrl);
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#2C3480',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          padding: 0
                        }}
                      >
                        Inspect Details <ExternalLink size={12} />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                {ntf.unread && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => markNotificationRead(ntf.id)}
                    title="Mark as read"
                    style={{ padding: '0.35rem' }}
                  >
                    <Check size={16} style={{ color: '#16a34a' }} />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => clearNotification(ntf.id)}
                  title="Dismiss notification"
                  style={{ padding: '0.35rem' }}
                >
                  <Trash2 size={16} style={{ color: '#94a3b8' }} />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default NotificationsCenter;
