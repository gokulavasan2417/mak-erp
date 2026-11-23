import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Send,
  Clock,
  CheckCircle,
  User,
  ShieldCheck,
  Building,
  Paperclip,
  AlertCircle
} from 'lucide-react';
import { Breadcrumbs } from '../../../components/common/Breadcrumbs';
import { Card, CardHeader, CardBody, CardFooter } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { useVendorData } from '../../../context/VendorDataContext';
import { VendorNavTabs, VENDOR_SUPPORT_TABS } from '../../../components/vendor/VendorNavTabs';

export function TicketDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { tickets, replySupportTicket, profile } = useVendorData();
  const [replyText, setReplyText] = useState('');

  const ticket = tickets.find((t) => t.id === id || t.ticketNumber === id);

  if (!ticket) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-main)' }}>
          Support Ticket Not Found
        </h2>
        <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem', marginBottom: '1.5rem' }}>
          The requested ticket does not exist or has been closed.
        </p>
        <Button variant="primary" onClick={() => navigate('/vendor/support')}>
          Return to Support Center
        </Button>
      </div>
    );
  }

  const handleReplySubmit = (e) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    replySupportTicket(ticket.id, replyText);
    setReplyText('');
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'Urgent':
        return <Badge variant="danger" size="sm">Urgent Priority</Badge>;
      case 'High':
        return <Badge variant="warning" size="sm">High Priority</Badge>;
      case 'Medium':
        return <Badge variant="info" size="sm">Medium Priority</Badge>;
      default:
        return <Badge variant="default" size="sm">Low Priority</Badge>;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Open':
        return <Badge variant="info" dot size="sm">Open</Badge>;
      case 'In Progress':
        return <Badge variant="warning" dot size="sm">In Progress</Badge>;
      case 'Waiting for Admin':
        return <Badge variant="primary" dot size="sm">Waiting for Admin Desk</Badge>;
      case 'Resolved':
        return <Badge variant="success" dot size="sm">Resolved</Badge>;
      case 'Closed':
        return <Badge variant="default" size="sm">Closed</Badge>;
      default:
        return <Badge variant="default" size="sm">{status}</Badge>;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '900px', margin: '0 auto' }}>
      <VendorNavTabs tabs={VENDOR_SUPPORT_TABS} />
      {/* Header */}
      <div>
        <Breadcrumbs portal="vendor" />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginTop: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Button variant="ghost" size="sm" onClick={() => navigate('/vendor/support')}>
              <ArrowLeft size={16} />
            </Button>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#2C3480', fontSize: '1.125rem' }}>
                  {ticket.ticketNumber}
                </span>
                {getStatusBadge(ticket.status)}
                {getPriorityBadge(ticket.priority)}
              </div>
              <h1 style={{ fontSize: '1.375rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '0.25rem' }}>
                {ticket.subject}
              </h1>
            </div>
          </div>
        </div>
      </div>

      {/* Meta Details Box */}
      <Card>
        <CardBody style={{ padding: '1rem 1.25rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', fontSize: '0.8125rem' }}>
            <div>
              <span style={{ color: 'var(--text-muted)', display: 'block' }}>Category</span>
              <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{ticket.category}</span>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)', display: 'block' }}>Created On</span>
              <span style={{ fontWeight: 500, color: 'var(--text-main)' }}>{ticket.createdAt}</span>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)', display: 'block' }}>Last Activity</span>
              <span style={{ fontWeight: 500, color: 'var(--text-main)' }}>{ticket.updatedAt}</span>
            </div>
            {ticket.relatedVehicle && (
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block' }}>Linked Vehicle</span>
                <span style={{ fontWeight: 600, color: '#2C3480' }}>{ticket.relatedVehicle}</span>
              </div>
            )}
            {ticket.relatedBooking && (
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block' }}>Linked Booking</span>
                <span style={{ fontWeight: 600, color: '#2C3480' }}>{ticket.relatedBooking}</span>
              </div>
            )}
          </div>
        </CardBody>
      </Card>

      {/* Conversation Thread */}
      <Card>
        <CardHeader
          title="Conversation Thread"
          subtitle={`Message history with MAK Support Desk (${ticket.messages ? ticket.messages.length : 0} interactions)`}
        />
        <CardBody style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', padding: '1.5rem' }}>
          {ticket.messages && ticket.messages.map((msg, index) => {
            const isVendor = msg.senderRole === 'Vendor' || msg.sender === profile.ownerName;

            return (
              <div
                key={index}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: isVendor ? 'flex-end' : 'flex-start'
                }}
              >
                <div
                  style={{
                    maxWidth: '82%',
                    backgroundColor: isVendor ? 'rgba(44, 52, 128, 0.06)' : 'var(--bg-surface-hover)',
                    border: isVendor ? '1px solid rgba(44, 52, 128, 0.2)' : '1px solid var(--border-light)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '1rem 1.25rem'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginBottom: '0.5rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.375rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                      {isVendor ? <User size={14} color="#2C3480" /> : <Building size={14} color="#10b981" />}
                      <span style={{ fontWeight: 600, fontSize: '0.8125rem', color: isVendor ? '#2C3480' : '#10b981' }}>
                        {msg.sender}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        ({msg.senderRole || (isVendor ? 'Vendor' : 'MAK Desk')})
                      </span>
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {msg.time}
                    </span>
                  </div>

                  <p style={{ fontSize: '0.875rem', color: 'var(--text-main)', lineHeight: 1.5, whiteSpace: 'pre-line' }}>
                    {msg.content}
                  </p>
                </div>
              </div>
            );
          })}
        </CardBody>

        {/* Reply Section */}
        {ticket.status !== 'Closed' && (
          <CardFooter style={{ borderTop: '1px solid var(--border-light)', padding: '1.25rem' }}>
            <form onSubmit={handleReplySubmit} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', alignSelf: 'center' }}>
                  Quick Insert:
                </span>
                {[
                  'Payment received and verified in bank account, thank you.',
                  'Updated insurance document copy attached for verification.',
                  'Vehicle will be back on road by tomorrow 08:00 AM.'
                ].map((quick, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setReplyText(quick)}
                    style={{
                      border: '1px solid var(--border-light)',
                      backgroundColor: 'var(--bg-surface)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '0.2rem 0.5rem',
                      fontSize: '0.75rem',
                      color: 'var(--text-secondary)',
                      cursor: 'pointer'
                    }}
                  >
                    {quick.slice(0, 32)}...
                  </button>
                ))}
              </div>

              <textarea
                rows={3}
                placeholder="Type your response to the support executive..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-light)',
                  backgroundColor: 'var(--bg-surface)',
                  color: 'var(--text-main)',
                  fontSize: '0.875rem',
                  fontFamily: 'inherit',
                  resize: 'vertical'
                }}
              />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Average response turnaround from MAK Desk: &lt; 2 business hours
                </span>
                <Button type="submit" variant="primary" size="sm" leftIcon={<Send size={14} />} disabled={!replyText.trim()}>
                  Send Reply
                </Button>
              </div>
            </form>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}

export default TicketDetails;
