// MAK Tours & Travels ERP - Accounts Receivable & Aging Module
import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Search,
  Clock,
  AlertTriangle,
  Bell,
  CheckCircle2,
  Calendar,
  FileText,
  IndianRupee,
  Send
} from 'lucide-react';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { accountantService } from '../../services/accountantService';

export function ReceivablePage() {
  const [loading, setLoading] = useState(true);
  const [overdueData, setOverdueData] = useState({
    summary: { totalPending: 0, current: 0, days30: 0, days60: 0, days90Plus: 0 },
    data: []
  });

  const [bookingSearch, setBookingSearch] = useState('');
  const [ledgerResults, setLedgerResults] = useState(null);
  const [searchingLedger, setSearchingLedger] = useState(false);
  const [reminderStatus, setReminderStatus] = useState({});

  const loadReceivables = async () => {
    setLoading(true);
    try {
      const res = await accountantService.getReceivableOverdue();
      if (res) {
        setOverdueData({
          summary: res.summary || { totalPending: 0, current: 0, days30: 0, days60: 0, days90Plus: 0 },
          data: Array.isArray(res.data) ? res.data : []
        });
      }
    } catch (err) {
      console.error('Error loading receivables:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReceivables();
  }, []);

  const handleSearchLedger = async (e) => {
    e.preventDefault();
    if (!bookingSearch.trim()) return;

    setSearchingLedger(true);
    try {
      const res = await accountantService.getCustomerLedger({ bookingRef: bookingSearch.trim() });
      setLedgerResults(res?.data || null);
    } catch (err) {
      alert(err.message || 'Error searching customer ledger');
    } finally {
      setSearchingLedger(false);
    }
  };

  const handleSendReminder = async (item) => {
    const key = item.bookingRef || item._id;
    setReminderStatus((prev) => ({ ...prev, [key]: 'sending' }));
    try {
      await accountantService.sendReminder({
        bookingRef: item.bookingRef || item.bookingNumber,
        customerName: item.customerName,
        phone: item.phone,
        email: item.email,
        pendingAmount: item.pendingAmount || item.balanceDue,
        dueDate: item.dueDate
      });
      setReminderStatus((prev) => ({ ...prev, [key]: 'sent' }));
      setTimeout(() => {
        setReminderStatus((prev) => ({ ...prev, [key]: null }));
      }, 3000);
    } catch (err) {
      alert(err.message || 'Error sending reminder');
      setReminderStatus((prev) => ({ ...prev, [key]: null }));
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          backgroundColor: '#ffffff',
          padding: '1.25rem 1.75rem',
          borderRadius: '16px',
          border: '1px solid #e2e8f0'
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
            Accounts Receivable & Aging Analysis
          </h1>
          <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0.25rem 0 0' }}>
            Customer outstanding dues, payment aging buckets, and collection reminders
          </p>
        </div>

        <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#ea580c', backgroundColor: '#fff7ed', padding: '0.45rem 0.85rem', borderRadius: '8px' }}>
          Total Outstanding: ₹{Number(overdueData.summary.totalPending || 0).toLocaleString('en-IN')}
        </div>
      </div>

      {/* Aging Analysis Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        <div style={{ backgroundColor: '#ffffff', padding: '1.15rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#059669', textTransform: 'uppercase' }}>Current (0–15 Days)</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', marginTop: '0.35rem' }}>
            ₹{Number(overdueData.summary.current || 0).toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>Within terms</div>
        </div>

        <div style={{ backgroundColor: '#ffffff', padding: '1.15rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#d97706', textTransform: 'uppercase' }}>16–30 Days Overdue</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', marginTop: '0.35rem' }}>
            ₹{Number(overdueData.summary.days30 || 0).toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>Moderate follow-up</div>
        </div>

        <div style={{ backgroundColor: '#ffffff', padding: '1.15rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#ea580c', textTransform: 'uppercase' }}>31–60 Days Overdue</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#ea580c', marginTop: '0.35rem' }}>
            ₹{Number(overdueData.summary.days60 || 0).toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>Priority collection</div>
        </div>

        <div style={{ backgroundColor: '#ffffff', padding: '1.15rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#dc2626', textTransform: 'uppercase' }}>60+ Days Overdue</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#dc2626', marginTop: '0.35rem' }}>
            ₹{Number(overdueData.summary.days90Plus || 0).toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>Escalation required</div>
        </div>
      </div>

      {/* Customer Ledger Search */}
      <Card>
        <CardHeader>
          <div style={{ fontWeight: 700, color: '#0f172a' }}>Booking-Wise Customer Ledger Statement</div>
        </CardHeader>
        <CardBody>
          <form onSubmit={handleSearchLedger} style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <input
              type="text"
              placeholder="Enter Booking Reference (e.g. BK-2026-0001)..."
              value={bookingSearch}
              onChange={(e) => setBookingSearch(e.target.value)}
              style={{ flex: 1, minWidth: '260px', padding: '0.55rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
            />
            <Button variant="primary" type="submit" disabled={searchingLedger}>
              {searchingLedger ? 'Searching...' : 'Search Ledger'}
            </Button>
          </form>

          {ledgerResults && (
            <div style={{ marginTop: '1.25rem', borderTop: '1px solid #e2e8f0', paddingTop: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <span style={{ fontWeight: 700, color: '#0f172a' }}>Booking: {ledgerResults.booking?.bookingNumber}</span>
                <span style={{ fontWeight: 800, color: ledgerResults.balanceDue > 0 ? '#ea580c' : '#059669' }}>
                  Balance Due: ₹{Number(ledgerResults.balanceDue || 0).toLocaleString('en-IN')}
                </span>
              </div>
              <div style={{ fontSize: '0.85rem', color: '#64748b', display: 'flex', gap: '1.5rem' }}>
                <span>Total Fare: ₹{Number(ledgerResults.totalFare || 0).toLocaleString('en-IN')}</span>
                <span>Total Paid: ₹{Number(ledgerResults.totalPaid || 0).toLocaleString('en-IN')}</span>
              </div>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Overdue Items List */}
      <Card>
        <CardHeader>
          <div style={{ fontWeight: 700, color: '#0f172a' }}>Pending Customer Balances & Receivables</div>
        </CardHeader>
        <CardBody style={{ padding: 0 }}>
          {loading ? (
            <LoadingSpinner message="Calculating receivable dues..." />
          ) : overdueData.data.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
              Zero overdue receivables. All completed bookings are fully reconciled!
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b' }}>
                    <th style={{ padding: '0.85rem 1.25rem' }}>Booking Ref</th>
                    <th style={{ padding: '0.85rem 1.25rem' }}>Customer Name</th>
                    <th style={{ padding: '0.85rem 1.25rem' }}>Contact</th>
                    <th style={{ padding: '0.85rem 1.25rem' }}>Total Fare</th>
                    <th style={{ padding: '0.85rem 1.25rem' }}>Outstanding</th>
                    <th style={{ padding: '0.85rem 1.25rem' }}>Aging</th>
                    <th style={{ padding: '0.85rem 1.25rem' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {overdueData.data.map((item) => {
                    const key = item.bookingRef || item._id;
                    const isSent = reminderStatus[key] === 'sent';
                    const isSending = reminderStatus[key] === 'sending';

                    return (
                      <tr key={key} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '0.85rem 1.25rem', fontWeight: 700, color: '#0f172a' }}>
                          {item.bookingRef || item.bookingNumber}
                        </td>
                        <td style={{ padding: '0.85rem 1.25rem', color: '#334155', fontWeight: 600 }}>
                          {item.customerName || 'Direct Customer'}
                        </td>
                        <td style={{ padding: '0.85rem 1.25rem', color: '#64748b' }}>
                          {item.phone || item.email || '—'}
                        </td>
                        <td style={{ padding: '0.85rem 1.25rem', color: '#64748b' }}>
                          ₹{Number(item.totalFare || 0).toLocaleString('en-IN')}
                        </td>
                        <td style={{ padding: '0.85rem 1.25rem', fontWeight: 800, color: '#ea580c' }}>
                          ₹{Number(item.pendingAmount || item.balanceDue || 0).toLocaleString('en-IN')}
                        </td>
                        <td style={{ padding: '0.85rem 1.25rem' }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: item.daysOverdue > 30 ? '#dc2626' : '#ea580c', backgroundColor: item.daysOverdue > 30 ? '#fef2f2' : '#fff7ed', padding: '0.2rem 0.5rem', borderRadius: '6px' }}>
                            {item.daysOverdue ? `${item.daysOverdue} Days` : 'Due'}
                          </span>
                        </td>
                        <td style={{ padding: '0.85rem 1.25rem' }}>
                          <Button
                            size="xs"
                            variant={isSent ? 'success' : 'outline'}
                            disabled={isSending || isSent}
                            onClick={() => handleSendReminder(item)}
                          >
                            {isSending ? 'Sending...' : isSent ? 'Sent ✓' : 'Send Reminder'}
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}

export default ReceivablePage;
