// MAK Tours & Travels ERP - Employee Leave Management
import React, { useState } from 'react';
import {
  Clock,
  Plus,
  Calendar,
  CheckCircle2,
  AlertCircle,
  FileText,
  UserCheck
} from 'lucide-react';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { useStaffData } from '../../context/StaffDataContext';

export function StaffLeaves() {
  const { leaveBalances, leaveRequests, applyForLeave, cancelLeave } = useStaffData();

  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [cancelConfirmLeave, setCancelConfirmLeave] = useState(null);
  const [leaveType, setLeaveType] = useState('Casual Leave');
  const [startDate, setStartDate] = useState(new Date().toISOString().substring(0, 10));
  const [endDate, setEndDate] = useState(new Date().toISOString().substring(0, 10));
  const [reason, setReason] = useState('');

  const handleApply = (e) => {
    e.preventDefault();
    if (!reason.trim()) return;

    applyForLeave({
      leaveType,
      startDate,
      endDate,
      days: 1,
      reason
    });

    setIsApplyModalOpen(false);
    setReason('');
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Approved':
        return { bg: '#dcfce7', color: '#15803d', border: '#bbf7d0' };
      case 'Rejected':
        return { bg: '#fee2e2', color: '#b91c1c', border: '#fecaca' };
      case 'Cancelled':
        return { bg: '#f1f5f9', color: '#64748b', border: '#e2e8f0' };
      case 'Pending':
      default:
        return { bg: '#fef3c7', color: '#b45309', border: '#fde68a' };
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header Banner */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          padding: '1.5rem 2rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <Clock size={18} color="#2C3480" />
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#2C3480', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Time-Off &amp; Leave Administration
            </span>
          </div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
            Leave Management &amp; Requests
          </h1>
          <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0.25rem 0 0' }}>
            Track your official annual leave balance, request time off, and monitor manager review status.
          </p>
        </div>

        <Button
          variant="primary"
          style={{ backgroundColor: '#2C3480', fontWeight: 700 }}
          onClick={() => setIsApplyModalOpen(true)}
        >
          <Plus size={16} style={{ marginRight: '0.35rem' }} /> Apply for Leave
        </Button>
      </div>

      {/* Leave Balances Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
        <div style={{ backgroundColor: '#ffffff', padding: '1.25rem', borderRadius: '14px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.03)' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '0.35rem' }}>
            Casual Leave (CL)
          </span>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0f172a' }}>
            {leaveBalances.casualLeave.remaining} <span style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: 500 }}>/ {leaveBalances.casualLeave.total} Days</span>
          </div>
          <span style={{ fontSize: '0.75rem', color: '#16a34a', display: 'block', marginTop: '0.35rem' }}>
            {leaveBalances.casualLeave.used} days utilized this year
          </span>
        </div>

        <div style={{ backgroundColor: '#ffffff', padding: '1.25rem', borderRadius: '14px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.03)' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '0.35rem' }}>
            Sick / Medical Leave (SL)
          </span>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0f172a' }}>
            {leaveBalances.sickLeave.remaining} <span style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: 500 }}>/ {leaveBalances.sickLeave.total} Days</span>
          </div>
          <span style={{ fontSize: '0.75rem', color: '#16a34a', display: 'block', marginTop: '0.35rem' }}>
            {leaveBalances.sickLeave.used} days utilized this year
          </span>
        </div>

        <div style={{ backgroundColor: '#ffffff', padding: '1.25rem', borderRadius: '14px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.03)' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '0.35rem' }}>
            Earned Leave (EL)
          </span>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0f172a' }}>
            {leaveBalances.earnedLeave.remaining} <span style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: 500 }}>/ {leaveBalances.earnedLeave.total} Days</span>
          </div>
          <span style={{ fontSize: '0.75rem', color: '#16a34a', display: 'block', marginTop: '0.35rem' }}>
            {leaveBalances.earnedLeave.used} days utilized this year
          </span>
        </div>
      </div>

      {/* Leave History Table */}
      <Card>
        <CardHeader title="Leave Application History" subtitle="Recent leave requests and supervisor decisions" />
        <CardBody style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e2e8f0', textAlign: 'left', backgroundColor: '#f8fafc' }}>
                <th style={{ padding: '0.85rem 1rem', color: '#475569', fontWeight: 700 }}>Request ID</th>
                <th style={{ padding: '0.85rem 1rem', color: '#475569', fontWeight: 700 }}>Leave Type</th>
                <th style={{ padding: '0.85rem 1rem', color: '#475569', fontWeight: 700 }}>Duration</th>
                <th style={{ padding: '0.85rem 1rem', color: '#475569', fontWeight: 700 }}>Days</th>
                <th style={{ padding: '0.85rem 1rem', color: '#475569', fontWeight: 700 }}>Reason</th>
                <th style={{ padding: '0.85rem 1rem', color: '#475569', fontWeight: 700 }}>Status</th>
                <th style={{ padding: '0.85rem 1rem', color: '#475569', fontWeight: 700 }}>Reviewer</th>
                <th style={{ padding: '0.85rem 1rem', color: '#475569', fontWeight: 700, textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {leaveRequests.map((req, i) => {
                const badge = getStatusBadge(req.status);
                const isCancelled = req.status === 'Cancelled';
                const isRejected = req.status === 'Rejected';

                return (
                  <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: '#2C3480', fontFamily: 'monospace' }}>
                      {req.id}
                    </td>
                    <td style={{ padding: '0.85rem 1rem', fontWeight: 600 }}>{req.leaveType}</td>
                    <td style={{ padding: '0.85rem 1rem', color: '#475569' }}>
                      {req.startDate} to {req.endDate}
                    </td>
                    <td style={{ padding: '0.85rem 1rem', fontWeight: 700 }}>{req.days} Day</td>
                    <td style={{ padding: '0.85rem 1rem', color: '#64748b' }}>{req.reason}</td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <span
                        style={{
                          backgroundColor: badge.bg,
                          color: badge.color,
                          border: `1px solid ${badge.border}`,
                          padding: '0.2rem 0.55rem',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          fontWeight: 700
                        }}
                      >
                        ● {req.status}
                      </span>
                    </td>
                    <td style={{ padding: '0.85rem 1rem', color: '#64748b', fontSize: '0.8rem' }}>
                      {req.reviewedBy}
                    </td>
                    <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                      {!isCancelled && !isRejected ? (
                        <Button
                          size="xs"
                          variant="outline"
                          style={{
                            color: '#dc2626',
                            borderColor: '#fca5a5',
                            fontWeight: 700,
                            fontSize: '0.75rem',
                            padding: '0.25rem 0.65rem'
                          }}
                          onClick={() => setCancelConfirmLeave(req)}
                        >
                          Cancel Leave
                        </Button>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontStyle: 'italic', fontWeight: 500 }}>
                          {isCancelled ? 'Cancelled' : '—'}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </CardBody>
      </Card>

      {/* Cancel Leave Confirmation Modal */}
      {cancelConfirmLeave && (
        <Modal
          isOpen={Boolean(cancelConfirmLeave)}
          onClose={() => setCancelConfirmLeave(null)}
          title="Cancel Leave Application"
          subtitle={`Leave Request #${cancelConfirmLeave?.id}`}
          size="sm"
          footer={
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', width: '100%' }}>
              <Button variant="ghost" onClick={() => setCancelConfirmLeave(null)}>
                Keep Leave
              </Button>
              <Button
                variant="danger"
                style={{ backgroundColor: '#dc2626', borderColor: '#dc2626', fontWeight: 700 }}
                onClick={() => {
                  if (cancelConfirmLeave) {
                    cancelLeave(cancelConfirmLeave.id);
                    setCancelConfirmLeave(null);
                  }
                }}
              >
                Confirm Cancellation
              </Button>
            </div>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <p style={{ margin: 0, fontSize: '0.875rem', color: '#334155', lineHeight: 1.5 }}>
              Are you sure you want to cancel your leave application for{' '}
              <strong>
                {cancelConfirmLeave.startDate} to {cancelConfirmLeave.endDate}
              </strong>
              ?
            </p>
            <div
              style={{
                backgroundColor: '#fff7ed',
                border: '1px solid #fed7aa',
                borderRadius: '8px',
                padding: '0.75rem',
                fontSize: '0.8125rem',
                color: '#9a3412',
                lineHeight: 1.4
              }}
            >
              ⚠ Cancelling this leave will restore your attendance schedule and alert the Management Operations Desk immediately.
            </div>
          </div>
        </Modal>
      )}

      {/* Apply Leave Modal */}
      {isApplyModalOpen && (
        <Modal
          isOpen={isApplyModalOpen}
          onClose={() => setIsApplyModalOpen(false)}
          title="Submit New Leave Application"
          size="md"
        >
          <form onSubmit={handleApply} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '0.5rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                Leave Type *
              </label>
              <select
                value={leaveType}
                onChange={(e) => setLeaveType(e.target.value)}
                style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.875rem' }}
              >
                <option value="Casual Leave">Casual Leave (CL)</option>
                <option value="Sick Leave">Sick / Medical Leave (SL)</option>
                <option value="Earned Leave">Earned Leave (EL)</option>
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                  From Date *
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.875rem' }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                  To Date *
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.875rem' }}
                  required
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                Reason for Leave *
              </label>
              <textarea
                rows={3}
                placeholder="State reason for absence..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.875rem' }}
                required
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem', borderTop: '1px solid #e2e8f0', paddingTop: '1rem' }}>
              <Button type="button" variant="outline" onClick={() => setIsApplyModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" style={{ backgroundColor: '#2C3480', fontWeight: 700 }}>
                Submit Leave Application
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

export default StaffLeaves;
