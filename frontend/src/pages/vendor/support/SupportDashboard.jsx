import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  HelpCircle,
  Plus,
  Phone,
  Mail,
  Clock,
  CheckCircle,
  AlertTriangle,
  MessageSquare,
  Search,
  ChevronRight,
  ExternalLink,
  ShieldAlert,
  Headphones
} from 'lucide-react';
import { Breadcrumbs } from '../../../components/common/Breadcrumbs';
import { Card, CardHeader, CardBody } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Input } from '../../../components/ui/Input';
import { useVendorData } from '../../../context/VendorDataContext';
import { VendorNavTabs, VENDOR_SUPPORT_TABS } from '../../../components/vendor/VendorNavTabs';

export function SupportDashboard() {
  const navigate = useNavigate();
  const { tickets } = useVendorData();
  const [activeTab, setActiveTab] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredTickets = tickets.filter((t) => {
    const matchesTab =
      activeTab === 'All'
        ? true
        : activeTab === 'Open'
        ? t.status === 'Open' || t.status === 'In Progress' || t.status === 'Waiting for Admin'
        : t.status === 'Resolved' || t.status === 'Closed';
    const matchesSearch =
      t.ticketNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.category.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'Urgent':
        return <Badge variant="danger" size="sm">Urgent</Badge>;
      case 'High':
        return <Badge variant="warning" size="sm">High</Badge>;
      case 'Medium':
        return <Badge variant="info" size="sm">Medium</Badge>;
      default:
        return <Badge variant="default" size="sm">Low</Badge>;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Open':
        return <Badge variant="info" dot size="sm">Open</Badge>;
      case 'In Progress':
        return <Badge variant="warning" dot size="sm">In Progress</Badge>;
      case 'Waiting for Admin':
        return <Badge variant="primary" dot size="sm">Waiting for Admin</Badge>;
      case 'Resolved':
        return <Badge variant="success" dot size="sm">Resolved</Badge>;
      case 'Closed':
        return <Badge variant="default" size="sm">Closed</Badge>;
      default:
        return <Badge variant="default" size="sm">{status}</Badge>;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <VendorNavTabs tabs={VENDOR_SUPPORT_TABS} />
      {/* Header */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
        <div>
          <Breadcrumbs portal="vendor" />
          <h1 style={{ fontSize: '1.625rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '0.25rem' }}>
            Support & Help Desk
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Direct communication channel with MAK Tours & Travels Operations, Accounts, and Telematics Teams.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Button variant="secondary" size="md" onClick={() => navigate('/vendor/support/announcements')}>
            View Announcements
          </Button>
          <Button variant="primary" size="md" leftIcon={<Plus size={16} />} onClick={() => navigate('/vendor/support/new')}>
            Raise Support Ticket
          </Button>
        </div>
      </div>

      {/* Support Hotlines & Emergency Desk */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
        <Card style={{ borderLeft: '4px solid #2C3480' }}>
          <CardBody style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.875rem' }}>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'rgba(44, 52, 128, 0.1)',
                  color: '#2C3480',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                <Headphones size={22} />
              </div>
              <div>
                <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-main)' }}>
                  Vendor Partner Help Desk
                </h3>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '0.125rem' }}>
                  Trip dispatch, rate dispute, roster changes
                </p>
                <div style={{ marginTop: '0.625rem', display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.8125rem' }}>
                  <a href="tel:+914428190011" style={{ color: '#2C3480', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.375rem', textDecoration: 'none' }}>
                    <Phone size={13} /> +91 44 2819 0011 / Ext: 402
                  </a>
                  <a href="mailto:vendor.support@maktours.com" style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.375rem', textDecoration: 'none' }}>
                    <Mail size={13} /> vendor.support@maktours.com
                  </a>
                </div>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card style={{ borderLeft: '4px solid #10b981' }}>
          <CardBody style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.875rem' }}>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'rgba(16, 185, 129, 0.1)',
                  color: '#10b981',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                <Clock size={22} />
              </div>
              <div>
                <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-main)' }}>
                  Accounts & Billing Clearance
                </h3>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '0.125rem' }}>
                  TDS certificate, UTR inquiries, invoice approvals
                </p>
                <div style={{ marginTop: '0.625rem', display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.8125rem' }}>
                  <a href="tel:+914428190015" style={{ color: '#10b981', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.375rem', textDecoration: 'none' }}>
                    <Phone size={13} /> +91 44 2819 0015 / Ext: 204
                  </a>
                  <a href="mailto:finance.desk@maktours.com" style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.375rem', textDecoration: 'none' }}>
                    <Mail size={13} /> finance.desk@maktours.com
                  </a>
                </div>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card style={{ borderLeft: '4px solid #ef4444' }}>
          <CardBody style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.875rem' }}>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  color: '#ef4444',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                <ShieldAlert size={22} />
              </div>
              <div>
                <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-main)' }}>
                  24/7 On-Road Breakdown SOS
                </h3>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '0.125rem' }}>
                  Emergency towing, passenger rescue dispatch
                </p>
                <div style={{ marginTop: '0.625rem', display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.8125rem' }}>
                  <a href="tel:+919840999112" style={{ color: '#ef4444', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.375rem', textDecoration: 'none' }}>
                    <Phone size={13} /> +91 98409 99112 (Toll-Free 24x7)
                  </a>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                    Avg Response Time: &lt; 8 Minutes
                  </span>
                </div>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Tickets List */}
      <Card>
        <CardHeader
          title="Support Tickets"
          subtitle="Track resolution progress on raised queries, billing adjustments, and compliance approvals"
          action={
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ display: 'flex', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                {['All', 'Open', 'Resolved'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    style={{
                      padding: '0.375rem 0.875rem',
                      fontSize: '0.8125rem',
                      fontWeight: 500,
                      border: 'none',
                      backgroundColor: activeTab === tab ? '#2C3480' : 'var(--bg-surface)',
                      color: activeTab === tab ? '#ffffff' : 'var(--text-muted)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>
          }
        />
        <CardBody style={{ padding: 0 }}>
          {/* Search bar */}
          <div style={{ padding: '0.875rem 1.25rem', borderBottom: '1px solid var(--border-light)' }}>
            <div style={{ maxWidth: '380px' }}>
              <Input
                placeholder="Search ticket #, subject, or category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                leftIcon={<Search size={15} color="var(--text-muted)" />}
              />
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--bg-surface-hover)', borderBottom: '1px solid var(--border-light)', textAlign: 'left' }}>
                  <th style={{ padding: '0.75rem 1.25rem', color: 'var(--text-muted)', fontWeight: 600 }}>TICKET ID</th>
                  <th style={{ padding: '0.75rem 1.25rem', color: 'var(--text-muted)', fontWeight: 600 }}>SUBJECT</th>
                  <th style={{ padding: '0.75rem 1.25rem', color: 'var(--text-muted)', fontWeight: 600 }}>CATEGORY</th>
                  <th style={{ padding: '0.75rem 1.25rem', color: 'var(--text-muted)', fontWeight: 600 }}>PRIORITY</th>
                  <th style={{ padding: '0.75rem 1.25rem', color: 'var(--text-muted)', fontWeight: 600 }}>STATUS</th>
                  <th style={{ padding: '0.75rem 1.25rem', color: 'var(--text-muted)', fontWeight: 600 }}>LAST UPDATED</th>
                  <th style={{ padding: '0.75rem 1.25rem', textAlign: 'right', color: 'var(--text-muted)', fontWeight: 600 }}>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {filteredTickets.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                      No support tickets found matching criteria.
                    </td>
                  </tr>
                ) : (
                  filteredTickets.map((t) => (
                    <tr
                      key={t.id}
                      onClick={() => navigate(`/vendor/support/${t.id}`)}
                      style={{
                        borderBottom: '1px solid var(--border-light)',
                        cursor: 'pointer',
                        transition: 'background-color 0.15s ease'
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover)')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <td style={{ padding: '0.875rem 1.25rem', fontFamily: 'monospace', fontWeight: 600, color: '#2C3480' }}>
                        {t.ticketNumber}
                      </td>
                      <td style={{ padding: '0.875rem 1.25rem' }}>
                        <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{t.subject}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.125rem' }}>
                          {t.messages && t.messages.length} message{t.messages && t.messages.length > 1 ? 's' : ''} in thread
                        </div>
                      </td>
                      <td style={{ padding: '0.875rem 1.25rem', color: 'var(--text-secondary)' }}>
                        {t.category}
                      </td>
                      <td style={{ padding: '0.875rem 1.25rem' }}>
                        {getPriorityBadge(t.priority)}
                      </td>
                      <td style={{ padding: '0.875rem 1.25rem' }}>
                        {getStatusBadge(t.status)}
                      </td>
                      <td style={{ padding: '0.875rem 1.25rem', color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
                        {t.updatedAt}
                      </td>
                      <td style={{ padding: '0.875rem 1.25rem', textAlign: 'right' }}>
                        <Button
                          variant="ghost"
                          size="sm"
                          rightIcon={<ChevronRight size={14} />}
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/vendor/support/${t.id}`);
                          }}
                        >
                          View
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

export default SupportDashboard;
