// MAK Tours & Travels ERP - Vendor Notification Center
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  CheckCircle,
  Calendar,
  CreditCard,
  AlertTriangle,
  Radio,
  ArrowRight
} from 'lucide-react';
import { Card, CardHeader, CardBody } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { useVendorData } from '../../../context/VendorDataContext';

export function NotificationCenter() {
  const navigate = useNavigate();
  const { notifications, markNotificationAsRead, markAllNotificationsAsRead } = useVendorData();

  const [activeTab, setActiveTab] = useState('All');

  const filteredNotifs = notifications.filter((n) => {
    if (activeTab === 'All') return true;
    if (activeTab === 'Bookings') return n.category.includes('Booking');
    if (activeTab === 'Payments') return n.category.includes('Payment');
    if (activeTab === 'Expiry') return n.category.includes('Expiry');
    if (activeTab === 'Announcements') return n.category.includes('Announcements');
    return true;
  });

  const getIcon = (category) => {
    if (category.includes('Booking')) return <Calendar size={18} color="#2C3480" />;
    if (category.includes('Payment')) return <CreditCard size={18} color="#16A34A" />;
    if (category.includes('Expiry')) return <AlertTriangle size={18} color="#DC2626" />;
    return <Radio size={18} color="#2563EB" />;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: '900px', margin: '0 auto' }}>
      {/* Header */}
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
          border: '1px solid #e2e8f0'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <Bell size={18} color="#2C3480" />
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#2C3480', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Alerts & Notifications
            </span>
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
            Notifications & Dispatch Broadcasts
          </h1>
          <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0.25rem 0 0' }}>
            Stay updated on new trip dispatch orders, bank disbursements and vehicle compliance deadlines
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={markAllNotificationsAsRead}
        >
          <CheckCircle size={14} style={{ marginRight: '0.35rem' }} /> Mark All Read
        </Button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem', overflowX: 'auto' }}>
        {['All', 'Bookings', 'Payments', 'Expiry', 'Announcements'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: activeTab === tab ? '#2C3480' : '#f1f5f9',
              color: activeTab === tab ? '#ffffff' : '#64748b',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer'
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {filteredNotifs.length === 0 ? (
          <Card>
            <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
              <Bell size={40} color="#cbd5e1" style={{ margin: '0 auto 0.5rem' }} />
              <p style={{ fontWeight: 700, color: '#334155' }}>No notifications found in this category.</p>
            </div>
          </Card>
        ) : (
          filteredNotifs.map((n) => (
            <div
              key={n.id}
              onClick={() => {
                markNotificationAsRead(n.id);
                if (n.link) navigate(n.link);
              }}
              style={{
                backgroundColor: n.isRead ? '#ffffff' : '#fafbfc',
                borderRadius: '12px',
                border: `1px solid ${n.isRead ? '#e2e8f0' : '#cbd5e1'}`,
                borderLeft: `4px solid ${n.isRead ? '#94a3b8' : '#2C3480'}`,
                padding: '1rem 1.25rem',
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                gap: '1rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem' }}>
                <div style={{ padding: '0.5rem', borderRadius: '8px', backgroundColor: '#f1f5f9', marginTop: '2px' }}>
                  {getIcon(n.category)}
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                      {n.category}
                    </span>
                    {!n.isRead && (
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#2C3480' }} />
                    )}
                  </div>
                  <h4 style={{ fontSize: '0.98rem', fontWeight: 800, color: '#0f172a', margin: '0.2rem 0' }}>
                    {n.title}
                  </h4>
                  <p style={{ fontSize: '0.83rem', color: '#475569', margin: 0 }}>
                    {n.message}
                  </p>
                </div>
              </div>

              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{n.timestamp}</span>
                <div style={{ marginTop: '0.5rem' }}>
                  <Button size="sm" variant="ghost" style={{ color: '#2C3480', padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}>
                    View →
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default NotificationCenter;
