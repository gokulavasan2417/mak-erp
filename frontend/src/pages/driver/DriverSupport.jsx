// MAK Tours & Travels ERP - Driver Support & Help Desk
import React, { useState } from 'react';
import {
  HelpCircle,
  Plus,
  Phone,
  Mail,
  Send,
  MessageSquare,
  AlertOctagon,
  Clock,
  CheckCircle,
  ShieldAlert,
  ChevronRight,
  ArrowLeft
} from 'lucide-react';
import { Breadcrumbs } from '../../components/common/Breadcrumbs';
import { Card, CardHeader, CardBody, CardFooter } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { useDriverData } from '../../context/DriverDataContext';

export function DriverSupport() {
  const {
    driver,
    supportTickets,
    createSupportTicket,
    replySupportTicket,
    emergencyContacts,
    triggerEmergencySos
  } = useDriverData();

  const safeTickets = Array.isArray(supportTickets) ? supportTickets : [];
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [isNewTicketModalOpen, setIsNewTicketModalOpen] = useState(false);
  const [newSubject, setNewSubject] = useState('');
  const [newCategory, setNewCategory] = useState('Trip / Route Issue');
  const [newDescription, setNewDescription] = useState('');
  const [replyText, setReplyText] = useState('');

  const ticketCategories = [
    'Trip / Route Issue',
    'Vehicle Breakdown / Maintenance',
    'Customer-Related Query',
    'Payment / Allowance Clarification',
    'Profile / Document Update',
    'Emergency / SOS Assistance'
  ];

  const handleCreateTicketSubmit = (e) => {
    e.preventDefault();
    if (!newSubject.trim() || !newDescription.trim()) return;

    createSupportTicket({
      subject: newSubject,
      category: newCategory,
      description: newDescription
    });

    setIsNewTicketModalOpen(false);
    setNewSubject('');
    setNewDescription('');
  };

  const handleReplySubmit = (e) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedTicket) return;

    replySupportTicket(selectedTicket.id, replyText);
    setReplyText('');
    // refresh selected ticket
    const updated = safeTickets.find((t) => t.id === selectedTicket.id);
    if (updated) setSelectedTicket(updated);
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
      default:
        return <Badge variant="default" size="sm">{status}</Badge>;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '1000px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
        <div>
          <Breadcrumbs portal="driver" />
          <h1 style={{ fontSize: '1.625rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.25rem' }}>
            Driver Support & Help Desk
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Direct assistance from MAK Operations, Fleet Superintendent, and Accounts Desk.
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          style={{ backgroundColor: '#2C3480', borderColor: '#2C3480' }}
          leftIcon={<Plus size={16} />}
          onClick={() => setIsNewTicketModalOpen(true)}
        >
          Raise Support Ticket
        </Button>
      </div>

      {/* Support Hotlines */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
        <Card style={{ borderLeft: '4px solid #2C3480' }}>
          <CardBody style={{ padding: '1.25rem' }}>
            <span style={{ fontSize: '0.7rem', color: '#2C3480', fontWeight: 700, textTransform: 'uppercase' }}>OPERATIONS & DISPATCH</span>
            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.2rem' }}>
              +91 44 2819 0011
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0.25rem 0 0 0' }}>
              Trip reassignment, delay updates, customer contact issues.
            </p>
          </CardBody>
        </Card>

        <Card style={{ borderLeft: '4px solid #10b981' }}>
          <CardBody style={{ padding: '1.25rem' }}>
            <span style={{ fontSize: '0.7rem', color: '#10b981', fontWeight: 700, textTransform: 'uppercase' }}>ALLOWANCE & ACCOUNTS</span>
            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.2rem' }}>
              +91 44 2819 0015
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0.25rem 0 0 0' }}>
              Driver batta disbursements, Fastag deductions, UPI inquiries.
            </p>
          </CardBody>
        </Card>

        <Card style={{ borderLeft: '4px solid #dc2626' }}>
          <CardBody style={{ padding: '1.25rem' }}>
            <span style={{ fontSize: '0.7rem', color: '#dc2626', fontWeight: 700, textTransform: 'uppercase' }}>24x7 BREAKDOWN SOS</span>
            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#dc2626', marginTop: '0.2rem' }}>
              +91 98409 99112
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0.25rem 0 0 0' }}>
              Immediate highway towing, passenger rescue replacement vehicle.
            </p>
          </CardBody>
        </Card>
      </div>

      {/* Ticket List or Selected Ticket Thread View */}
      {!selectedTicket ? (
        <Card>
          <CardHeader
            title="My Support Tickets"
            subtitle="Track inquiries, vehicle service requests, and allowance adjustments"
          />
          <CardBody style={{ padding: 0 }}>
            {safeTickets.length === 0 ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                No active support tickets found. Click "Raise Support Ticket" to submit an inquiry.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                  <thead>
                    <tr style={{ backgroundColor: 'var(--bg-surface-hover)', borderBottom: '1px solid var(--border-light)', textAlign: 'left' }}>
                      <th style={{ padding: '0.75rem 1.25rem', color: 'var(--text-muted)' }}>TICKET ID</th>
                      <th style={{ padding: '0.75rem 1.25rem', color: 'var(--text-muted)' }}>SUBJECT</th>
                      <th style={{ padding: '0.75rem 1.25rem', color: 'var(--text-muted)' }}>CATEGORY</th>
                      <th style={{ padding: '0.75rem 1.25rem', color: 'var(--text-muted)' }}>STATUS</th>
                      <th style={{ padding: '0.75rem 1.25rem', color: 'var(--text-muted)' }}>LAST UPDATED</th>
                      <th style={{ padding: '0.75rem 1.25rem', textAlign: 'right', color: 'var(--text-muted)' }}>ACTION</th>
                    </tr>
                  </thead>
                  <tbody>
                    {safeTickets.map((t) => (
                      <tr
                        key={t.id}
                        onClick={() => setSelectedTicket(t)}
                        style={{ borderBottom: '1px solid var(--border-light)', cursor: 'pointer' }}
                      >
                        <td style={{ padding: '0.875rem 1.25rem', fontFamily: 'monospace', fontWeight: 700, color: '#2C3480' }}>
                          {t.ticketNumber}
                        </td>
                        <td style={{ padding: '0.875rem 1.25rem', fontWeight: 600 }}>
                          {t.subject}
                        </td>
                        <td style={{ padding: '0.875rem 1.25rem', color: 'var(--text-secondary)' }}>
                          {t.category}
                        </td>
                        <td style={{ padding: '0.875rem 1.25rem' }}>
                          {getStatusBadge(t.status)}
                        </td>
                        <td style={{ padding: '0.875rem 1.25rem', color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
                          {t.updatedAt}
                        </td>
                        <td style={{ padding: '0.875rem 1.25rem', textAlign: 'right' }}>
                          <Button variant="ghost" size="sm" rightIcon={<ChevronRight size={14} />}>
                            View Thread
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardBody>
        </Card>
      ) : (
        /* Conversation Thread View */
        <Card>
          <CardHeader
            title={selectedTicket.subject}
            subtitle={`${selectedTicket.ticketNumber} • Category: ${selectedTicket.category}`}
            action={
              <Button variant="ghost" size="sm" onClick={() => setSelectedTicket(null)} leftIcon={<ArrowLeft size={14} />}>
                Back to Tickets
              </Button>
            }
          />
          <CardBody style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {selectedTicket.messages.map((msg, i) => {
              const isDriver = msg.role === 'Driver' || msg.sender.includes(driver.displayName);

              return (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: isDriver ? 'flex-end' : 'flex-start'
                  }}
                >
                  <div
                    style={{
                      maxWidth: '80%',
                      backgroundColor: isDriver ? 'rgba(44, 52, 128, 0.08)' : 'var(--bg-surface-hover)',
                      border: isDriver ? '1px solid rgba(44, 52, 128, 0.2)' : '1px solid var(--border-light)',
                      borderRadius: '10px',
                      padding: '0.85rem 1.25rem'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.35rem', marginBottom: '0.45rem', fontSize: '0.75rem' }}>
                      <strong style={{ color: isDriver ? '#2C3480' : '#10b981' }}>{msg.sender}</strong>
                      <span style={{ color: 'var(--text-muted)' }}>{msg.time}</span>
                    </div>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-main)', margin: 0, lineHeight: 1.5, whiteSpace: 'pre-line' }}>
                      {msg.content}
                    </p>
                  </div>
                </div>
              );
            })}
          </CardBody>

          <CardFooter style={{ borderTop: '1px solid var(--border-light)', padding: '1rem 1.5rem' }}>
            <form onSubmit={handleReplySubmit} style={{ width: '100%', display: 'flex', gap: '0.75rem' }}>
              <input
                type="text"
                placeholder="Type your response to the Admin desk..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                style={{ flex: 1, padding: '0.55rem 0.85rem', borderRadius: '8px', border: '1px solid var(--border-light)', fontSize: '0.875rem', backgroundColor: 'var(--bg-surface)' }}
              />
              <Button type="submit" variant="primary" style={{ backgroundColor: '#2C3480', borderColor: '#2C3480' }} leftIcon={<Send size={14} />}>
                Send
              </Button>
            </form>
          </CardFooter>
        </Card>
      )}

      {/* New Support Ticket Modal */}
      <Modal
        isOpen={isNewTicketModalOpen}
        onClose={() => setIsNewTicketModalOpen(false)}
        title="Raise Driver Support Ticket"
        subtitle="Submit an operational or settlement query to MAK Admin"
        size="md"
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', width: '100%' }}>
            <Button variant="outline" onClick={() => setIsNewTicketModalOpen(false)}>Cancel</Button>
            <Button variant="primary" style={{ backgroundColor: '#2C3480', borderColor: '#2C3480', fontWeight: 700 }} onClick={handleCreateTicketSubmit}>
              Submit Ticket
            </Button>
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
              Issue Subject *
            </label>
            <Input
              placeholder="e.g. Fastag toll deduction discrepancy or scheduled service request"
              value={newSubject}
              onChange={(e) => setNewSubject(e.target.value)}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
              Category *
            </label>
            <select
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.875rem', backgroundColor: '#fff' }}
            >
              {ticketCategories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
              Detailed Description *
            </label>
            <textarea
              rows={4}
              placeholder="Describe your issue with booking reference, dates, and amounts..."
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.875rem', fontFamily: 'inherit' }}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default DriverSupport;
