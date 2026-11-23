import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Bell,
  ArrowLeft,
  Calendar,
  User,
  Tag,
  ChevronRight,
  Sparkles,
  Info,
  AlertCircle,
  Megaphone
} from 'lucide-react';
import { Breadcrumbs } from '../../../components/common/Breadcrumbs';
import { Card, CardHeader, CardBody } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { useVendorData } from '../../../context/VendorDataContext';
import { VendorNavTabs, VENDOR_SUPPORT_TABS } from '../../../components/vendor/VendorNavTabs';
import { formatDateDMY } from '../../../utils/dateUtils';

export function Announcements() {
  const navigate = useNavigate();
  const { announcements } = useVendorData();
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(announcements[0] || null);

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'High':
      case 'Urgent':
        return <Badge variant="danger" size="sm">High Priority</Badge>;
      case 'Important':
        return <Badge variant="warning" size="sm">Important</Badge>;
      default:
        return <Badge variant="info" size="sm">Circular</Badge>;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <VendorNavTabs tabs={VENDOR_SUPPORT_TABS} />
      {/* Header */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
        <div>
          <Breadcrumbs portal="vendor" />
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.25rem' }}>
            <Button variant="ghost" size="sm" onClick={() => navigate('/vendor/support')}>
              <ArrowLeft size={16} />
            </Button>
            <div>
              <h1 style={{ fontSize: '1.625rem', fontWeight: 700, color: 'var(--text-main)' }}>
                Official Announcements & Circulars
              </h1>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                Important policies, rate adjustments, festive incentives, and operational advisories from MAK Leadership.
              </p>
            </div>
          </div>
        </div>

        <Button variant="secondary" size="md" onClick={() => navigate('/vendor/support')}>
          Back to Support Desk
        </Button>
      </div>

      {/* Two Column Layout: List & Reader */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 1fr) minmax(400px, 1.4fr)', gap: '1.5rem', alignItems: 'start' }}>
        {/* Announcements List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {announcements.map((item) => {
            const isSelected = selectedAnnouncement && selectedAnnouncement.id === item.id;

            return (
              <Card
                key={item.id}
                style={{
                  cursor: 'pointer',
                  border: isSelected ? '2px solid #2C3480' : '1px solid var(--border-light)',
                  backgroundColor: isSelected ? 'rgba(44, 52, 128, 0.02)' : 'var(--bg-surface)',
                  transition: 'all 0.15s ease'
                }}
                onClick={() => setSelectedAnnouncement(item)}
              >
                <CardBody style={{ padding: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Megaphone size={16} color="#2C3480" />
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                        {formatDateDMY(item.date)}
                      </span>
                    </div>
                    {getPriorityBadge(item.priority)}
                  </div>

                  <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, color: isSelected ? '#2C3480' : 'var(--text-main)', marginBottom: '0.375rem' }}>
                    {item.title}
                  </h3>

                  <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', lineClamp: 2, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {item.content}
                  </p>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.75rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border-light)', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    <span>{item.category}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#2C3480', fontWeight: 500 }}>
                      Read details <ChevronRight size={14} />
                    </span>
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </div>

        {/* Selected Announcement Reader */}
        {selectedAnnouncement && (
          <Card style={{ position: 'sticky', top: '1.5rem' }}>
            <CardHeader
              title={selectedAnnouncement.title}
              subtitle={`Published on ${formatDateDMY(selectedAnnouncement.date)} &bull; ${selectedAnnouncement.category}`}
              action={getPriorityBadge(selectedAnnouncement.priority)}
            />
            <CardBody style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.75rem 1rem',
                  backgroundColor: 'var(--bg-surface-hover)',
                  borderRadius: 'var(--radius-md)'
                }}
              >
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(44, 52, 128, 0.1)',
                    color: '#2C3480',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <User size={18} />
                </div>
                <div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main)' }}>
                    {selectedAnnouncement.author}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Executive Directorate, MAK Tours & Travels ERP Network
                  </div>
                </div>
              </div>

              <div style={{ fontSize: '0.9375rem', color: 'var(--text-main)', lineHeight: 1.7, whiteSpace: 'pre-line' }}>
                {selectedAnnouncement.content}
              </div>

              <div
                style={{
                  borderTop: '1px solid var(--border-light)',
                  paddingTop: '1rem',
                  marginTop: '0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '1rem',
                  fontSize: '0.8125rem'
                }}
              >
                <span style={{ color: 'var(--text-muted)' }}>
                  Questions regarding this circular?
                </span>
                <Button variant="outline" size="sm" onClick={() => navigate('/vendor/support/new')}>
                  Inquire via Ticket
                </Button>
              </div>
            </CardBody>
          </Card>
        )}
      </div>
    </div>
  );
}

export default Announcements;
