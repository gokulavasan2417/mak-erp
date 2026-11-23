// MAK Tours & Travels ERP - Cash & Bank Management Module
import React, { useState, useEffect } from 'react';
import {
  Landmark,
  ArrowRightLeft,
  ArrowDownLeft,
  ArrowUpRight,
  Search,
  Plus,
  CheckCircle2,
  Clock,
  Building,
  CreditCard,
  IndianRupee,
  ShieldCheck
} from 'lucide-react';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Modal } from '../../components/ui/Modal';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { accountantService } from '../../services/accountantService';
import { formatDateDMY } from '../../utils/dateUtils';

export function CashBankPage() {
  const [activeTab, setActiveTab] = useState('accounts'); // accounts, cashbook, reconciliation
  const [accounts, setAccounts] = useState([]);
  const [cashbookData, setCashbookData] = useState({ summary: {}, data: [] });
  const [reconData, setReconData] = useState({ summary: {}, data: [] });
  const [loading, setLoading] = useState(true);
  const [selectedAccountId, setSelectedAccountId] = useState('');

  // Modals
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState('');

  // Form State
  const [txnForm, setTxnForm] = useState({
    accountId: '',
    fromAccountId: '',
    toAccountId: '',
    amount: '',
    narration: ''
  });

  const loadAccounts = async () => {
    try {
      const res = await accountantService.getCashBankAccounts();
      const list = Array.isArray(res?.data) ? res.data : res?.data?.accounts || [];
      setAccounts(list);
      if (list.length > 0 && !selectedAccountId) {
        setSelectedAccountId(list[0]._id || list[0].id);
      }
    } catch (err) {
      console.error('Error fetching accounts:', err);
    }
  };

  const loadCashbook = async (accId) => {
    try {
      const res = await accountantService.getCashbook(accId ? { accountId: accId } : {});
      if (res) {
        setCashbookData({
          summary: res.summary || {},
          data: Array.isArray(res.data) ? res.data : []
        });
      }
    } catch (err) {
      console.error('Error loading cashbook:', err);
    }
  };

  const loadReconciliation = async (accId) => {
    try {
      const res = await accountantService.getReconciliation(accId ? { accountId: accId } : {});
      if (res) {
        setReconData({
          summary: res.summary || {},
          data: Array.isArray(res.data) ? res.data : []
        });
      }
    } catch (err) {
      console.error('Error loading reconciliation:', err);
    }
  };

  const reloadAll = async () => {
    setLoading(true);
    await loadAccounts();
    await loadCashbook(selectedAccountId);
    await loadReconciliation(selectedAccountId);
    setLoading(false);
  };

  useEffect(() => {
    reloadAll();
  }, [selectedAccountId]);

  const handleDeposit = async (e) => {
    e.preventDefault();
    setModalError('');
    if (!txnForm.accountId || !txnForm.amount) return;

    setSubmitting(true);
    try {
      await accountantService.recordDeposit({
        accountId: txnForm.accountId,
        amount: Number(txnForm.amount),
        narration: txnForm.narration.trim()
      });
      setIsDepositModalOpen(false);
      setTxnForm({ accountId: '', fromAccountId: '', toAccountId: '', amount: '', narration: '' });
      reloadAll();
    } catch (err) {
      setModalError(err.message || 'Deposit recording failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleWithdrawal = async (e) => {
    e.preventDefault();
    setModalError('');
    if (!txnForm.accountId || !txnForm.amount) return;

    setSubmitting(true);
    try {
      await accountantService.recordWithdrawal({
        accountId: txnForm.accountId,
        amount: Number(txnForm.amount),
        narration: txnForm.narration.trim()
      });
      setIsWithdrawModalOpen(false);
      setTxnForm({ accountId: '', fromAccountId: '', toAccountId: '', amount: '', narration: '' });
      reloadAll();
    } catch (err) {
      setModalError(err.message || 'Withdrawal recording failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleTransfer = async (e) => {
    e.preventDefault();
    setModalError('');
    if (!txnForm.fromAccountId || !txnForm.toAccountId || !txnForm.amount) {
      setModalError('Source account, Destination account, and Amount are required.');
      return;
    }
    if (txnForm.fromAccountId === txnForm.toAccountId) {
      setModalError('Source and Destination accounts must be different.');
      return;
    }

    setSubmitting(true);
    try {
      await accountantService.recordTransfer({
        fromAccountId: txnForm.fromAccountId,
        toAccountId: txnForm.toAccountId,
        amount: Number(txnForm.amount),
        narration: txnForm.narration.trim()
      });
      setIsTransferModalOpen(false);
      setTxnForm({ accountId: '', fromAccountId: '', toAccountId: '', amount: '', narration: '' });
      reloadAll();
    } catch (err) {
      setModalError(err.message || 'Transfer failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleMatchRecon = async (txn) => {
    try {
      await accountantService.matchReconciliation(txn.txnNo || txn._id, {
        matched: true,
        notes: 'Verified against e-statement line'
      });
      loadReconciliation(selectedAccountId);
    } catch (err) {
      alert(err.message || 'Reconciliation match failed');
    }
  };

  const totalLiquidity = accounts.reduce((sum, a) => sum + Number(a.currentBalance || 0), 0);

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
            Cash & Bank Management
          </h1>
          <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0.25rem 0 0' }}>
            Multi-account cashbook, inter-account transfers, and bank statement reconciliation
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#059669', backgroundColor: '#ecfdf5', padding: '0.45rem 0.85rem', borderRadius: '8px' }}>
            Total Liquidity: ₹{totalLiquidity.toLocaleString('en-IN')}
          </div>
          <Button variant="outline" size="sm" onClick={() => { setTxnForm({ ...txnForm, accountId: selectedAccountId }); setIsDepositModalOpen(true); }}>
            <ArrowDownLeft size={15} style={{ marginRight: '0.35rem' }} /> Deposit
          </Button>
          <Button variant="outline" size="sm" onClick={() => { setTxnForm({ ...txnForm, accountId: selectedAccountId }); setIsWithdrawModalOpen(true); }}>
            <ArrowUpRight size={15} style={{ marginRight: '0.35rem' }} /> Withdrawal
          </Button>
          <Button variant="primary" size="sm" onClick={() => { setTxnForm({ ...txnForm, fromAccountId: selectedAccountId }); setIsTransferModalOpen(true); }}>
            <ArrowRightLeft size={15} style={{ marginRight: '0.35rem' }} /> Transfer
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>
        <button
          onClick={() => setActiveTab('accounts')}
          style={{
            padding: '0.5rem 1rem',
            borderRadius: '8px',
            border: 'none',
            fontSize: '0.875rem',
            fontWeight: 700,
            cursor: 'pointer',
            backgroundColor: activeTab === 'accounts' ? '#2563eb' : 'transparent',
            color: activeTab === 'accounts' ? '#ffffff' : '#64748b'
          }}
        >
          Accounts Overview
        </button>
        <button
          onClick={() => setActiveTab('cashbook')}
          style={{
            padding: '0.5rem 1rem',
            borderRadius: '8px',
            border: 'none',
            fontSize: '0.875rem',
            fontWeight: 700,
            cursor: 'pointer',
            backgroundColor: activeTab === 'cashbook' ? '#2563eb' : 'transparent',
            color: activeTab === 'cashbook' ? '#ffffff' : '#64748b'
          }}
        >
          Running Cashbook
        </button>
        <button
          onClick={() => setActiveTab('reconciliation')}
          style={{
            padding: '0.5rem 1rem',
            borderRadius: '8px',
            border: 'none',
            fontSize: '0.875rem',
            fontWeight: 700,
            cursor: 'pointer',
            backgroundColor: activeTab === 'reconciliation' ? '#2563eb' : 'transparent',
            color: activeTab === 'reconciliation' ? '#ffffff' : '#64748b'
          }}
        >
          Bank Reconciliation
        </button>
      </div>

      {loading ? (
        <LoadingSpinner message="Loading cash and bank records..." />
      ) : activeTab === 'accounts' ? (
        /* Tab 1: Accounts Cards */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
          {accounts.map((acc) => (
            <div
              key={acc._id}
              style={{
                backgroundColor: '#ffffff',
                padding: '1.25rem',
                borderRadius: '14px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                  {acc.accountType || acc.type || 'Bank'}
                </span>
                <div style={{ padding: '0.4rem', borderRadius: '8px', backgroundColor: '#e0f2fe', color: '#0284c7' }}>
                  <Landmark size={18} />
                </div>
              </div>
              <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#0f172a', marginTop: '0.5rem' }}>
                {acc.accountName}
              </div>
              {acc.accountNumber && (
                <div style={{ fontSize: '0.8rem', color: '#64748b', fontFamily: 'monospace' }}>
                  A/C: {acc.accountNumber} • {acc.bankName || 'HDFC Bank'}
                </div>
              )}
              <div style={{ marginTop: '1rem', borderTop: '1px solid #f1f5f9', paddingTop: '0.75rem' }}>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Current Available Balance</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#059669' }}>
                  ₹{Number(acc.currentBalance || 0).toLocaleString('en-IN')}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : activeTab === 'cashbook' ? (
        /* Tab 2: Running Cashbook */
        <Card>
          <CardHeader>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', flexWrap: 'wrap', gap: '1rem' }}>
              <div style={{ fontWeight: 700, color: '#0f172a' }}>Running Cashbook Ledger</div>
              <div style={{ display: 'flex', gap: '1rem', fontSize: '0.85rem' }}>
                <span>Opening: <strong>₹{Number(cashbookData.summary?.openingBalance || 0).toLocaleString('en-IN')}</strong></span>
                <span style={{ color: '#059669' }}>Deposits: <strong>+₹{Number(cashbookData.summary?.totalDeposits || 0).toLocaleString('en-IN')}</strong></span>
                <span style={{ color: '#dc2626' }}>Withdrawals: <strong>-₹{Number(cashbookData.summary?.totalWithdrawals || 0).toLocaleString('en-IN')}</strong></span>
                <span style={{ color: '#0f172a' }}>Closing: <strong>₹{Number(cashbookData.summary?.closingBalance || 0).toLocaleString('en-IN')}</strong></span>
              </div>
            </div>
          </CardHeader>
          <CardBody style={{ padding: 0 }}>
            {cashbookData.data.length === 0 ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
                No cashbook entries recorded yet for this period.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b' }}>
                      <th style={{ padding: '0.85rem 1.25rem' }}>Txn #</th>
                      <th style={{ padding: '0.85rem 1.25rem' }}>Date</th>
                      <th style={{ padding: '0.85rem 1.25rem' }}>Type</th>
                      <th style={{ padding: '0.85rem 1.25rem' }}>Narration</th>
                      <th style={{ padding: '0.85rem 1.25rem' }}>Deposit (+)</th>
                      <th style={{ padding: '0.85rem 1.25rem' }}>Withdrawal (-)</th>
                      <th style={{ padding: '0.85rem 1.25rem' }}>Running Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cashbookData.data.map((t) => (
                      <tr key={t._id || t.txnNo} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '0.85rem 1.25rem', fontWeight: 700, color: '#0f172a' }}>{t.txnNo}</td>
                        <td style={{ padding: '0.85rem 1.25rem', color: '#64748b' }}>
                          {formatDateDMY(t.date) || '—'}
                        </td>
                        <td style={{ padding: '0.85rem 1.25rem', textTransform: 'capitalize' }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: 600, padding: '0.2rem 0.5rem', borderRadius: '4px', backgroundColor: t.isDeposit ? '#ecfdf5' : '#fef2f2', color: t.isDeposit ? '#059669' : '#dc2626' }}>
                            {t.type}
                          </span>
                        </td>
                        <td style={{ padding: '0.85rem 1.25rem', color: '#334155' }}>{t.narration || '—'}</td>
                        <td style={{ padding: '0.85rem 1.25rem', fontWeight: 700, color: '#059669' }}>
                          {t.isDeposit ? `₹${Number(t.amount || 0).toLocaleString('en-IN')}` : '—'}
                        </td>
                        <td style={{ padding: '0.85rem 1.25rem', fontWeight: 700, color: '#dc2626' }}>
                          {t.isWithdrawal ? `₹${Number(t.amount || 0).toLocaleString('en-IN')}` : '—'}
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
      ) : (
        /* Tab 3: Bank Reconciliation */
        <Card>
          <CardHeader>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
              <div style={{ fontWeight: 700, color: '#0f172a' }}>Bank Statement Line Reconciliation</div>
              <div style={{ display: 'flex', gap: '1rem', fontSize: '0.85rem' }}>
                <span style={{ color: '#ea580c' }}>Unmatched: <strong>{reconData.summary?.unmatchedCount || 0}</strong></span>
                <span style={{ color: '#059669' }}>Matched: <strong>{reconData.summary?.matchedCount || 0}</strong></span>
              </div>
            </div>
          </CardHeader>
          <CardBody style={{ padding: 0 }}>
            {reconData.data.length === 0 ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
                All transaction entries are 100% reconciled against bank statement!
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b' }}>
                      <th style={{ padding: '0.85rem 1.25rem' }}>Txn #</th>
                      <th style={{ padding: '0.85rem 1.25rem' }}>Date</th>
                      <th style={{ padding: '0.85rem 1.25rem' }}>Type</th>
                      <th style={{ padding: '0.85rem 1.25rem' }}>Narration</th>
                      <th style={{ padding: '0.85rem 1.25rem' }}>Amount</th>
                      <th style={{ padding: '0.85rem 1.25rem' }}>Status</th>
                      <th style={{ padding: '0.85rem 1.25rem' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reconData.data.map((r) => (
                      <tr key={r._id || r.txnNo} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '0.85rem 1.25rem', fontWeight: 700, color: '#0f172a' }}>{r.txnNo}</td>
                        <td style={{ padding: '0.85rem 1.25rem', color: '#64748b' }}>
                          {formatDateDMY(r.date) || '—'}
                        </td>
                        <td style={{ padding: '0.85rem 1.25rem', textTransform: 'capitalize' }}>{r.type}</td>
                        <td style={{ padding: '0.85rem 1.25rem', color: '#334155' }}>{r.narration || '—'}</td>
                        <td style={{ padding: '0.85rem 1.25rem', fontWeight: 700, color: '#0f172a' }}>
                          ₹{Number(r.amount || 0).toLocaleString('en-IN')}
                        </td>
                        <td style={{ padding: '0.85rem 1.25rem' }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: r.matched ? '#059669' : '#ea580c', backgroundColor: r.matched ? '#ecfdf5' : '#fff7ed', padding: '0.2rem 0.55rem', borderRadius: '4px' }}>
                            {r.matched ? 'Matched ✓' : 'Unmatched'}
                          </span>
                        </td>
                        <td style={{ padding: '0.85rem 1.25rem' }}>
                          {!r.matched && (
                            <Button size="xs" variant="primary" style={{ backgroundColor: '#059669' }} onClick={() => handleMatchRecon(r)}>
                              Match Line
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
      )}

      {/* Deposit Modal */}
      {isDepositModalOpen && (
        <Modal
          isOpen={isDepositModalOpen}
          onClose={() => setIsDepositModalOpen(false)}
          title="Record Bank / Cash Deposit"
        >
          <form onSubmit={handleDeposit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {modalError && (
              <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', padding: '0.75rem', borderRadius: '8px', color: '#b91c1c', fontSize: '0.85rem' }}>
                {modalError}
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                Target Account *
              </label>
              <select
                required
                value={txnForm.accountId}
                onChange={(e) => setTxnForm({ ...txnForm, accountId: e.target.value })}
                style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff' }}
              >
                <option value="">Select Account</option>
                {accounts.map(a => (
                  <option key={a._id} value={a._id}>{a.accountName} (Bal: ₹{Number(a.currentBalance || 0).toLocaleString('en-IN')})</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                Deposit Amount (INR) *
              </label>
              <input
                type="number"
                required
                min="1"
                placeholder="0.00"
                value={txnForm.amount}
                onChange={(e) => setTxnForm({ ...txnForm, amount: e.target.value })}
                style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                Narration / Reference
              </label>
              <input
                type="text"
                placeholder="e.g. Promoter capital / cash vault deposit"
                value={txnForm.narration}
                onChange={(e) => setTxnForm({ ...txnForm, narration: e.target.value })}
                style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
              <Button variant="ghost" onClick={() => setIsDepositModalOpen(false)}>Cancel</Button>
              <Button variant="primary" type="submit" disabled={submitting}>
                {submitting ? 'Depositing...' : 'Confirm Deposit'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Withdrawal Modal */}
      {isWithdrawModalOpen && (
        <Modal
          isOpen={isWithdrawModalOpen}
          onClose={() => setIsWithdrawModalOpen(false)}
          title="Record Withdrawal"
        >
          <form onSubmit={handleWithdrawal} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {modalError && (
              <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', padding: '0.75rem', borderRadius: '8px', color: '#b91c1c', fontSize: '0.85rem' }}>
                {modalError}
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                From Account *
              </label>
              <select
                required
                value={txnForm.accountId}
                onChange={(e) => setTxnForm({ ...txnForm, accountId: e.target.value })}
                style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff' }}
              >
                <option value="">Select Account</option>
                {accounts.map(a => (
                  <option key={a._id} value={a._id}>{a.accountName} (Bal: ₹{Number(a.currentBalance || 0).toLocaleString('en-IN')})</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                Withdrawal Amount (INR) *
              </label>
              <input
                type="number"
                required
                min="1"
                placeholder="0.00"
                value={txnForm.amount}
                onChange={(e) => setTxnForm({ ...txnForm, amount: e.target.value })}
                style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                Narration / Purpose
              </label>
              <input
                type="text"
                placeholder="e.g. Petty cash replenishment"
                value={txnForm.narration}
                onChange={(e) => setTxnForm({ ...txnForm, narration: e.target.value })}
                style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
              <Button variant="ghost" onClick={() => setIsWithdrawModalOpen(false)}>Cancel</Button>
              <Button variant="primary" type="submit" disabled={submitting}>
                {submitting ? 'Processing...' : 'Confirm Withdrawal'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Transfer Modal */}
      {isTransferModalOpen && (
        <Modal
          isOpen={isTransferModalOpen}
          onClose={() => setIsTransferModalOpen(false)}
          title="Inter-Account Liquidity Transfer"
        >
          <form onSubmit={handleTransfer} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {modalError && (
              <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', padding: '0.75rem', borderRadius: '8px', color: '#b91c1c', fontSize: '0.85rem' }}>
                {modalError}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                  From Account *
                </label>
                <select
                  required
                  value={txnForm.fromAccountId}
                  onChange={(e) => setTxnForm({ ...txnForm, fromAccountId: e.target.value })}
                  style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff' }}
                >
                  <option value="">Source Account</option>
                  {accounts.map(a => (
                    <option key={a._id} value={a._id}>{a.accountName} (₹{Number(a.currentBalance || 0).toLocaleString('en-IN')})</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                  To Account *
                </label>
                <select
                  required
                  value={txnForm.toAccountId}
                  onChange={(e) => setTxnForm({ ...txnForm, toAccountId: e.target.value })}
                  style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff' }}
                >
                  <option value="">Destination Account</option>
                  {accounts.map(a => (
                    <option key={a._id} value={a._id}>{a.accountName} (₹{Number(a.currentBalance || 0).toLocaleString('en-IN')})</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                Transfer Amount (INR) *
              </label>
              <input
                type="number"
                required
                min="1"
                placeholder="0.00"
                value={txnForm.amount}
                onChange={(e) => setTxnForm({ ...txnForm, amount: e.target.value })}
                style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                Narration
              </label>
              <input
                type="text"
                placeholder="e.g. Bank to UPI wallet transfer for fastag & fuel"
                value={txnForm.narration}
                onChange={(e) => setTxnForm({ ...txnForm, narration: e.target.value })}
                style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
              <Button variant="ghost" onClick={() => setIsTransferModalOpen(false)}>Cancel</Button>
              <Button variant="primary" type="submit" disabled={submitting}>
                {submitting ? 'Transferring...' : 'Transfer Funds'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

export default CashBankPage;
