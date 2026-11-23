// MAK Tours & Travels ERP - Chart of Accounts & General Ledger Module
import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Search,
  Plus,
  ArrowRightLeft,
  Calendar,
  CheckCircle2,
  RotateCcw,
  AlertCircle,
  FileText,
  IndianRupee,
  Layers
} from 'lucide-react';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Modal } from '../../components/ui/Modal';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { accountantService } from '../../services/accountantService';
import { formatDateDMY } from '../../utils/dateUtils';

export function LedgerPage() {
  const [activeTab, setActiveTab] = useState('journals'); // journals, coa, gl
  const [loading, setLoading] = useState(true);

  const [journals, setJournals] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [glData, setGlData] = useState(null);

  const [selectedAccountCode, setSelectedAccountCode] = useState('1020');
  const [startDate, setStartDate] = useState('2026-11-01');
  const [endDate, setEndDate] = useState('2026-11-30');

  // Modals
  const [isJournalModalOpen, setIsJournalModalOpen] = useState(false);
  const [isReverseModalOpen, setIsReverseModalOpen] = useState(false);
  const [selectedJournal, setSelectedJournal] = useState(null);
  const [reverseReason, setReverseReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState('');

  // Manual Journal Form
  const [journalForm, setJournalForm] = useState({
    date: new Date().toISOString().split('T')[0],
    narration: '',
    lines: [
      { account: '', debit: '', credit: '' },
      { account: '', debit: '', credit: '' }
    ]
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [jRes, aRes] = await Promise.allSettled([
        accountantService.getJournalEntries(),
        accountantService.getChartOfAccounts()
      ]);

      if (jRes.status === 'fulfilled') {
        setJournals(Array.isArray(jRes.value?.data) ? jRes.value.data : []);
      }
      if (aRes.status === 'fulfilled') {
        const accList = Array.isArray(aRes.value?.data) ? aRes.value.data : [];
        setAccounts(accList);
        if (accList.length > 0 && !selectedAccountCode) {
          setSelectedAccountCode(accList[0].code);
        }
      }
    } catch (err) {
      console.error('Error loading ledger data:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadGeneralLedger = async (code, s, e) => {
    try {
      const res = await accountantService.getGeneralLedger({
        accountCode: code,
        startDate: s,
        endDate: e
      });
      setGlData(res?.data || null);
    } catch (err) {
      console.error('Error loading general ledger:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (activeTab === 'gl' && selectedAccountCode) {
      loadGeneralLedger(selectedAccountCode, startDate, endDate);
    }
  }, [activeTab, selectedAccountCode, startDate, endDate]);

  const handleAddLine = () => {
    setJournalForm({
      ...journalForm,
      lines: [...journalForm.lines, { account: '', debit: '', credit: '' }]
    });
  };

  const handleLineChange = (index, field, val) => {
    const updated = [...journalForm.lines];
    updated[index][field] = val;
    setJournalForm({ ...journalForm, lines: updated });
  };

  const handleCreateJournal = async (e) => {
    e.preventDefault();
    setModalError('');

    const lines = journalForm.lines
      .filter((l) => l.account && (Number(l.debit) > 0 || Number(l.credit) > 0))
      .map((l) => ({
        account: l.account,
        debit: Number(l.debit || 0),
        credit: Number(l.credit || 0)
      }));

    if (lines.length < 2) {
      setModalError('A double-entry journal requires at least two lines.');
      return;
    }

    const totalDebit = lines.reduce((s, l) => s + l.debit, 0);
    const totalCredit = lines.reduce((s, l) => s + l.credit, 0);

    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      setModalError(`Imbalanced entry: Debits (₹${totalDebit}) must equal Credits (₹${totalCredit}).`);
      return;
    }

    setSubmitting(true);
    try {
      await accountantService.createJournalEntry({
        date: journalForm.date,
        narration: journalForm.narration.trim(),
        lines
      });
      setIsJournalModalOpen(false);
      setJournalForm({
        date: new Date().toISOString().split('T')[0],
        narration: '',
        lines: [
          { account: '', debit: '', credit: '' },
          { account: '', debit: '', credit: '' }
        ]
      });
      loadData();
    } catch (err) {
      setModalError(err.message || 'Journal entry failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReverseJournal = async (e) => {
    e.preventDefault();
    if (!selectedJournal || !reverseReason.trim()) return;

    setSubmitting(true);
    try {
      await accountantService.reverseJournalEntry(selectedJournal._id || selectedJournal.entryNo, reverseReason.trim());
      setIsReverseModalOpen(false);
      setReverseReason('');
      loadData();
    } catch (err) {
      setModalError(err.message || 'Journal reversal failed.');
    } finally {
      setSubmitting(false);
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
            Chart of Accounts & General Ledger
          </h1>
          <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0.25rem 0 0' }}>
            Immutable double-entry journal vouchers, account ledgers, and audit-stamped reversals
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <Button variant="primary" size="sm" onClick={() => setIsJournalModalOpen(true)}>
            <Plus size={16} style={{ marginRight: '0.35rem' }} /> Manual Journal Entry
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>
        <button
          onClick={() => setActiveTab('journals')}
          style={{
            padding: '0.5rem 1rem',
            borderRadius: '8px',
            border: 'none',
            fontSize: '0.875rem',
            fontWeight: 700,
            cursor: 'pointer',
            backgroundColor: activeTab === 'journals' ? '#2563eb' : 'transparent',
            color: activeTab === 'journals' ? '#ffffff' : '#64748b'
          }}
        >
          Journal Entries (Vouchers)
        </button>
        <button
          onClick={() => setActiveTab('gl')}
          style={{
            padding: '0.5rem 1rem',
            borderRadius: '8px',
            border: 'none',
            fontSize: '0.875rem',
            fontWeight: 700,
            cursor: 'pointer',
            backgroundColor: activeTab === 'gl' ? '#2563eb' : 'transparent',
            color: activeTab === 'gl' ? '#ffffff' : '#64748b'
          }}
        >
          Account Ledger Statement
        </button>
        <button
          onClick={() => setActiveTab('coa')}
          style={{
            padding: '0.5rem 1rem',
            borderRadius: '8px',
            border: 'none',
            fontSize: '0.875rem',
            fontWeight: 700,
            cursor: 'pointer',
            backgroundColor: activeTab === 'coa' ? '#2563eb' : 'transparent',
            color: activeTab === 'coa' ? '#ffffff' : '#64748b'
          }}
        >
          Chart of Accounts
        </button>
      </div>

      {loading ? (
        <LoadingSpinner message="Loading double-entry ledger..." />
      ) : activeTab === 'journals' ? (
        /* Tab 1: Journal Entries Table */
        <Card>
          <CardBody style={{ padding: 0 }}>
            {journals.length === 0 ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
                No journal entries posted yet.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b' }}>
                      <th style={{ padding: '0.85rem 1.25rem' }}>Entry #</th>
                      <th style={{ padding: '0.85rem 1.25rem' }}>Date</th>
                      <th style={{ padding: '0.85rem 1.25rem' }}>Narration</th>
                      <th style={{ padding: '0.85rem 1.25rem' }}>Source</th>
                      <th style={{ padding: '0.85rem 1.25rem' }}>Total Debit</th>
                      <th style={{ padding: '0.85rem 1.25rem' }}>Total Credit</th>
                      <th style={{ padding: '0.85rem 1.25rem' }}>Status</th>
                      <th style={{ padding: '0.85rem 1.25rem' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {journals.map((j) => (
                      <tr key={j._id || j.entryNo} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '0.85rem 1.25rem', fontWeight: 700, color: '#0f172a' }}>{j.entryNo}</td>
                        <td style={{ padding: '0.85rem 1.25rem', color: '#64748b' }}>
                          {formatDateDMY(j.date) || '—'}
                        </td>
                        <td style={{ padding: '0.85rem 1.25rem', color: '#334155' }}>{j.narration}</td>
                        <td style={{ padding: '0.85rem 1.25rem', color: '#64748b', textTransform: 'capitalize' }}>
                          {j.sourceType?.replace('_', ' ') || 'Manual'}
                        </td>
                        <td style={{ padding: '0.85rem 1.25rem', fontWeight: 700, color: '#059669' }}>
                          ₹{Number(j.totalDebit || 0).toLocaleString('en-IN')}
                        </td>
                        <td style={{ padding: '0.85rem 1.25rem', fontWeight: 700, color: '#059669' }}>
                          ₹{Number(j.totalCredit || 0).toLocaleString('en-IN')}
                        </td>
                        <td style={{ padding: '0.85rem 1.25rem' }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: j.status === 'posted' ? '#059669' : '#dc2626', backgroundColor: j.status === 'posted' ? '#ecfdf5' : '#fef2f2', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                            {j.status === 'posted' ? 'Posted' : 'Reversed'}
                          </span>
                        </td>
                        <td style={{ padding: '0.85rem 1.25rem' }}>
                          {j.status === 'posted' && (
                            <Button
                              size="xs"
                              variant="ghost"
                              style={{ color: '#dc2626' }}
                              onClick={() => {
                                setSelectedJournal(j);
                                setReverseReason('');
                                setIsReverseModalOpen(true);
                              }}
                            >
                              <RotateCcw size={13} style={{ marginRight: '0.2rem' }} /> Reverse
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardBody>
        </Card>
      ) : activeTab === 'gl' ? (
        /* Tab 2: General Ledger Filter & Table */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', backgroundColor: '#ffffff', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0', alignItems: 'center' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Select Account</label>
              <select
                value={selectedAccountCode}
                onChange={(e) => setSelectedAccountCode(e.target.value)}
                style={{ padding: '0.45rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', backgroundColor: '#ffffff' }}
              >
                {accounts.map(a => (
                  <option key={a.code} value={a.code}>{a.code} - {a.name} ({a.type})</option>
                ))}
              </select>
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.2rem' }}>
                <label style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Start Date</label>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0284c7' }}>({formatDateDMY(startDate)})</span>
              </div>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                style={{ padding: '0.45rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
              />
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.2rem' }}>
                <label style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>End Date</label>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0284c7' }}>({formatDateDMY(endDate)})</span>
              </div>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                style={{ padding: '0.45rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
              />
            </div>
          </div>

          <Card>
            <CardHeader>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                <div style={{ fontWeight: 700, color: '#0f172a' }}>Ledger Account Statement: {selectedAccountCode}</div>
                {glData && (
                  <div style={{ fontWeight: 800, color: '#059669', fontSize: '1.1rem' }}>
                    Closing Balance: ₹{Number(glData.closingBalance || 0).toLocaleString('en-IN')}
                  </div>
                )}
              </div>
            </CardHeader>
            <CardBody style={{ padding: 0 }}>
              {!glData || !glData.transactions || glData.transactions.length === 0 ? (
                <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
                  No transactions recorded for this account in the selected date range.
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b' }}>
                        <th style={{ padding: '0.85rem 1.25rem' }}>Date</th>
                        <th style={{ padding: '0.85rem 1.25rem' }}>Entry #</th>
                        <th style={{ padding: '0.85rem 1.25rem' }}>Narration</th>
                        <th style={{ padding: '0.85rem 1.25rem' }}>Debit (Dr)</th>
                        <th style={{ padding: '0.85rem 1.25rem' }}>Credit (Cr)</th>
                        <th style={{ padding: '0.85rem 1.25rem' }}>Running Balance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {glData.transactions.map((t, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '0.85rem 1.25rem', color: '#64748b' }}>{formatDateDMY(t.date) || '—'}</td>
                          <td style={{ padding: '0.85rem 1.25rem', fontWeight: 700, color: '#0f172a' }}>{t.entryNo}</td>
                          <td style={{ padding: '0.85rem 1.25rem', color: '#334155' }}>{t.narration}</td>
                          <td style={{ padding: '0.85rem 1.25rem', fontWeight: 600, color: '#059669' }}>
                            {t.debit > 0 ? `₹${Number(t.debit).toLocaleString('en-IN')}` : '—'}
                          </td>
                          <td style={{ padding: '0.85rem 1.25rem', fontWeight: 600, color: '#dc2626' }}>
                            {t.credit > 0 ? `₹${Number(t.credit).toLocaleString('en-IN')}` : '—'}
                          </td>
                          <td style={{ padding: '0.85rem 1.25rem', fontWeight: 800, color: '#0f172a' }}>
                            ₹{Number(t.runningBalance || 0).toLocaleString('en-IN')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      ) : (
        /* Tab 3: Chart of Accounts Table */
        <Card>
          <CardBody style={{ padding: 0 }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b' }}>
                    <th style={{ padding: '0.85rem 1.25rem' }}>Account Code</th>
                    <th style={{ padding: '0.85rem 1.25rem' }}>Account Name</th>
                    <th style={{ padding: '0.85rem 1.25rem' }}>Type</th>
                    <th style={{ padding: '0.85rem 1.25rem' }}>Normal Balance</th>
                    <th style={{ padding: '0.85rem 1.25rem' }}>System Protected</th>
                  </tr>
                </thead>
                <tbody>
                  {accounts.map((a) => (
                    <tr key={a.code} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '0.85rem 1.25rem', fontWeight: 700, color: '#0f172a', fontFamily: 'monospace' }}>{a.code}</td>
                      <td style={{ padding: '0.85rem 1.25rem', fontWeight: 600, color: '#334155' }}>{a.name}</td>
                      <td style={{ padding: '0.85rem 1.25rem', textTransform: 'capitalize' }}>{a.type}</td>
                      <td style={{ padding: '0.85rem 1.25rem', textTransform: 'uppercase', color: '#64748b', fontSize: '0.8rem' }}>{a.normalBalance}</td>
                      <td style={{ padding: '0.85rem 1.25rem' }}>
                        {a.isSystem ? (
                          <span style={{ fontSize: '0.75rem', color: '#059669', backgroundColor: '#ecfdf5', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>System Default</span>
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Custom</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Manual Journal Entry Modal */}
      {isJournalModalOpen && (
        <Modal
          isOpen={isJournalModalOpen}
          onClose={() => setIsJournalModalOpen(false)}
          title="New Double-Entry Journal Voucher"
        >
          <form onSubmit={handleCreateJournal} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {modalError && (
              <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', padding: '0.75rem', borderRadius: '8px', color: '#b91c1c', fontSize: '0.85rem' }}>
                {modalError}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                  Posting Date *
                </label>
                <input
                  type="date"
                  required
                  value={journalForm.date}
                  onChange={(e) => setJournalForm({ ...journalForm, date: e.target.value })}
                  style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                  Narration / Description *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Adjustment for vehicle depreciation"
                  value={journalForm.narration}
                  onChange={(e) => setJournalForm({ ...journalForm, narration: e.target.value })}
                  style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                />
              </div>
            </div>

            <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '1rem' }}>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#0f172a', marginBottom: '0.5rem' }}>
                Journal Lines (Debits must equal Credits)
              </div>

              {journalForm.lines.map((line, idx) => (
                <div key={idx} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '0.75rem', marginBottom: '0.5rem' }}>
                  <select
                    value={line.account}
                    onChange={(e) => handleLineChange(idx, 'account', e.target.value)}
                    style={{ padding: '0.45rem 0.65rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', backgroundColor: '#ffffff' }}
                  >
                    <option value="">Select Ledger Account</option>
                    {accounts.map(a => (
                      <option key={a._id} value={a._id}>{a.code} - {a.name}</option>
                    ))}
                  </select>

                  <input
                    type="number"
                    placeholder="Debit"
                    min="0"
                    value={line.debit}
                    onChange={(e) => handleLineChange(idx, 'debit', e.target.value)}
                    style={{ padding: '0.45rem 0.65rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                  />

                  <input
                    type="number"
                    placeholder="Credit"
                    min="0"
                    value={line.credit}
                    onChange={(e) => handleLineChange(idx, 'credit', e.target.value)}
                    style={{ padding: '0.45rem 0.65rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                  />
                </div>
              ))}

              <Button type="button" variant="outline" size="xs" onClick={handleAddLine} style={{ marginTop: '0.5rem' }}>
                + Add Line
              </Button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
              <Button variant="ghost" onClick={() => setIsJournalModalOpen(false)}>Cancel</Button>
              <Button variant="primary" type="submit" disabled={submitting}>
                {submitting ? 'Posting...' : 'Post Journal Voucher'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Reverse Journal Modal */}
      {isReverseModalOpen && selectedJournal && (
        <Modal
          isOpen={isReverseModalOpen}
          onClose={() => setIsReverseModalOpen(false)}
          title={`Reverse Journal Entry: ${selectedJournal.entryNo}`}
        >
          <form onSubmit={handleReverseJournal} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>
              Posted journal entries are strictly immutable. Reversal creates an equal and opposite journal entry referencing this original voucher.
            </p>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                Reason for Reversal *
              </label>
              <textarea
                required
                rows={3}
                placeholder="Audit explanation for journal reversal..."
                value={reverseReason}
                onChange={(e) => setReverseReason(e.target.value)}
                style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <Button variant="ghost" onClick={() => setIsReverseModalOpen(false)}>Cancel</Button>
              <Button variant="danger" type="submit" disabled={submitting}>
                {submitting ? 'Reversing...' : 'Post Reversal Entry'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

export default LedgerPage;
