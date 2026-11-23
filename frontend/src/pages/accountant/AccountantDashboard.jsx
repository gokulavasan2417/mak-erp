// MAK Tours & Travels ERP - Dedicated Accountant Financial Dashboard
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  IndianRupee,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  CreditCard,
  FileText,
  AlertTriangle,
  Receipt,
  Download,
  Calendar,
  Building,
  CheckCircle2,
  Clock,
  Plus,
  Banknote,
  Landmark,
  BookOpen,
  BarChart3,
  Truck,
  UserCheck
} from 'lucide-react';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { accountantService } from '../../services/accountantService';

export function AccountantDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [metrics, setMetrics] = useState({
    bookingRevenue: 0,
    collectedRevenue: 0,
    receivables: 0,
    operatingExpenses: 0,
    netProfit: 0,
    profitMargin: 0
  });

  const [bankBalances, setBankBalances] = useState({
    totalLiquid: 0,
    accounts: []
  });

  const [payableMetrics, setPayableMetrics] = useState({
    totalOutstanding: 0,
    overdueCount: 0
  });

  const [recentPayments, setRecentPayments] = useState([]);
  const [recentExpenses, setRecentExpenses] = useState([]);

  useEffect(() => {
    let mounted = true;

    async function loadDashboardData() {
      setLoading(true);
      setError(null);
      try {
        const [ovRes, cbRes, payRes, expRes, payblRes] = await Promise.allSettled([
          accountantService.getOverview(),
          accountantService.getCashBankAccounts(),
          accountantService.getPayments({ limit: 6 }),
          accountantService.getExpenses({ limit: 6 }),
          accountantService.getVendorOutstanding()
        ]);

        if (ovRes.status === 'fulfilled' && ovRes.value?.data) {
          const d = ovRes.value.data;
          const rev = Number(d.bookingRevenue || d.revenue || 0);
          const col = Number(d.collectedRevenue || d.collected || 0);
          const exp = Number(d.operatingExpenses || d.expenses || 0);
          const rec = Number(d.receivables !== undefined ? d.receivables : Math.max(0, rev - col));
          const net = rev - exp;
          const margin = rev > 0 ? ((net / rev) * 100).toFixed(1) : 0;
          if (mounted) {
            setMetrics({
              bookingRevenue: rev,
              collectedRevenue: col,
              receivables: rec,
              operatingExpenses: exp,
              netProfit: net,
              profitMargin: margin
            });
          }
        }

        if (cbRes.status === 'fulfilled' && cbRes.value?.data) {
          const accs = Array.isArray(cbRes.value.data) ? cbRes.value.data : cbRes.value.data.accounts || [];
          const total = accs.reduce((sum, a) => sum + Number(a.currentBalance || 0), 0);
          if (mounted) {
            setBankBalances({
              totalLiquid: total,
              accounts: accs
            });
          }
        }

        if (payblRes.status === 'fulfilled' && payblRes.value?.summary) {
          if (mounted) {
            setPayableMetrics({
              totalOutstanding: payblRes.value.summary.totalOutstanding || 0,
              overdueCount: payblRes.value.summary.overdueCount || 0
            });
          }
        }

        if (payRes.status === 'fulfilled' && payRes.value?.data) {
          const pList = Array.isArray(payRes.value.data) ? payRes.value.data : [];
          if (mounted) setRecentPayments(pList.slice(0, 5));
        }

        if (expRes.status === 'fulfilled' && expRes.value?.data) {
          const eList = Array.isArray(expRes.value.data) ? expRes.value.data : [];
          if (mounted) setRecentExpenses(eList.slice(0, 5));
        }
      } catch (err) {
        if (mounted) setError(err.message || 'Error loading financial metrics');
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadDashboardData();
    return () => { mounted = false; };
  }, []);

  if (loading) {
    return <LoadingSpinner message="Calculating financial metrics & ledger balances..." />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* 1. Header Command Bar */}
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
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                color: '#059669',
                backgroundColor: '#d1fae5',
                padding: '0.2rem 0.55rem',
                borderRadius: '6px',
                textTransform: 'uppercase'
              }}
            >
              Accountant Command Center
            </span>
            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
              FY 2026–2027 • Double-Entry Ledger Active
            </span>
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', margin: '0.35rem 0 0' }}>
            Financial Overview & Operations
          </h1>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <Button variant="outline" size="sm" onClick={() => navigate('/accountant/income')}>
            <IndianRupee size={15} style={{ marginRight: '0.35rem' }} /> Record Income
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate('/accountant/expenses')}>
            <Receipt size={15} style={{ marginRight: '0.35rem' }} /> Add Expense
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate('/accountant/payable')}>
            <Truck size={15} style={{ marginRight: '0.35rem' }} /> Vendor Bill
          </Button>
          <Button variant="primary" size="sm" onClick={() => navigate('/accountant/reports')}>
            <BarChart3 size={15} style={{ marginRight: '0.35rem' }} /> Financial Reports
          </Button>
        </div>
      </div>

      {error && (
        <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', padding: '1rem', borderRadius: '12px', color: '#b91c1c' }}>
          {error}
        </div>
      )}

      {/* 2. Key Financial KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '1.15rem' }}>
        {/* Card 1: Recognized Revenue */}
        <div style={{ backgroundColor: '#ffffff', padding: '1.25rem', borderRadius: '14px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Recognised Revenue</span>
            <div style={{ padding: '0.4rem', borderRadius: '8px', backgroundColor: '#eef2ff', color: '#2563eb' }}>
              <IndianRupee size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', marginTop: '0.4rem' }}>
            ₹{metrics.bookingRevenue.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#059669', marginTop: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <ArrowUpRight size={14} /> Collected: ₹{metrics.collectedRevenue.toLocaleString('en-IN')}
          </div>
        </div>

        {/* Card 2: Receivables */}
        <div style={{ backgroundColor: '#ffffff', padding: '1.25rem', borderRadius: '14px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Accounts Receivable</span>
            <div style={{ padding: '0.4rem', borderRadius: '8px', backgroundColor: '#fff7ed', color: '#ea580c' }}>
              <Clock size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#ea580c', marginTop: '0.4rem' }}>
            ₹{metrics.receivables.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.35rem' }}>
            Pending customer collections
          </div>
        </div>

        {/* Card 3: Payables */}
        <div style={{ backgroundColor: '#ffffff', padding: '1.25rem', borderRadius: '14px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Accounts Payable</span>
            <div style={{ padding: '0.4rem', borderRadius: '8px', backgroundColor: '#fef2f2', color: '#dc2626' }}>
              <Truck size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#dc2626', marginTop: '0.4rem' }}>
            ₹{payableMetrics.totalOutstanding.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.35rem' }}>
            {payableMetrics.overdueCount > 0 ? `${payableMetrics.overdueCount} bills overdue` : 'Vendor & Fleet dues'}
          </div>
        </div>

        {/* Card 4: Liquid Cash & Bank */}
        <div style={{ backgroundColor: '#ffffff', padding: '1.25rem', borderRadius: '14px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Cash & Bank Liquidity</span>
            <div style={{ padding: '0.4rem', borderRadius: '8px', backgroundColor: '#ecfdf5', color: '#059669' }}>
              <Landmark size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#059669', marginTop: '0.4rem' }}>
            ₹{bankBalances.totalLiquid.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.35rem' }}>
            {bankBalances.accounts.length} active cash/bank accounts
          </div>
        </div>

        {/* Card 5: Net Profit & Margin */}
        <div style={{ backgroundColor: '#ffffff', padding: '1.25rem', borderRadius: '14px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Net Operating Margin</span>
            <div style={{ padding: '0.4rem', borderRadius: '8px', backgroundColor: '#f0fdf4', color: '#16a34a' }}>
              <TrendingUp size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', marginTop: '0.4rem' }}>
            {metrics.profitMargin}%
          </div>
          <div style={{ fontSize: '0.8rem', color: '#16a34a', marginTop: '0.35rem' }}>
            Net profit: ₹{metrics.netProfit.toLocaleString('en-IN')}
          </div>
        </div>
      </div>

      {/* 3. Quick Accounting Navigation Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
        <div
          onClick={() => navigate('/accountant/cash-bank')}
          style={{
            cursor: 'pointer',
            backgroundColor: '#ffffff',
            padding: '1.25rem',
            borderRadius: '14px',
            border: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            transition: 'transform 0.15s, box-shadow 0.15s'
          }}
        >
          <div style={{ backgroundColor: '#e0f2fe', color: '#0284c7', padding: '0.85rem', borderRadius: '12px' }}>
            <Landmark size={24} />
          </div>
          <div>
            <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '1rem' }}>Cash & Bank Management</div>
            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Deposits, inter-account transfers & bank reconciliation</div>
          </div>
        </div>

        <div
          onClick={() => navigate('/accountant/driver-settlements')}
          style={{
            cursor: 'pointer',
            backgroundColor: '#ffffff',
            padding: '1.25rem',
            borderRadius: '14px',
            border: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem'
          }}
        >
          <div style={{ backgroundColor: '#fef3c7', color: '#d97706', padding: '0.85rem', borderRadius: '12px' }}>
            <UserCheck size={24} />
          </div>
          <div>
            <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '1rem' }}>Driver Trip Settlements</div>
            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Trip allowances, duty earnings & instant disbursements</div>
          </div>
        </div>

        <div
          onClick={() => navigate('/accountant/payroll')}
          style={{
            cursor: 'pointer',
            backgroundColor: '#ffffff',
            padding: '1.25rem',
            borderRadius: '14px',
            border: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem'
          }}
        >
          <div style={{ backgroundColor: '#f3e8ff', color: '#9333ea', padding: '0.85rem', borderRadius: '12px' }}>
            <Banknote size={24} />
          </div>
          <div>
            <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '1rem' }}>Payroll Accounting</div>
            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Monthly gross, PF/ESI/TDS statutory breakdown & salary slips</div>
          </div>
        </div>

        <div
          onClick={() => navigate('/accountant/ledger')}
          style={{
            cursor: 'pointer',
            backgroundColor: '#ffffff',
            padding: '1.25rem',
            borderRadius: '14px',
            border: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem'
          }}
        >
          <div style={{ backgroundColor: '#ecfdf5', color: '#059669', padding: '0.85rem', borderRadius: '12px' }}>
            <BookOpen size={24} />
          </div>
          <div>
            <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '1rem' }}>Chart of Accounts & Ledger</div>
            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Double-entry journals, trial balance & account ledgers</div>
          </div>
        </div>
      </div>

      {/* 4. Split Activity Tables */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '1.5rem' }}>
        {/* Table 1: Recent Customer Payments */}
        <Card>
          <CardHeader>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
              <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '1.05rem' }}>Recent Customer Receipts</div>
              <Button variant="ghost" size="sm" onClick={() => navigate('/accountant/income')}>View All →</Button>
            </div>
          </CardHeader>
          <CardBody style={{ padding: 0 }}>
            {recentPayments.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>No recorded receipts yet.</div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b', backgroundColor: '#f8fafc' }}>
                      <th style={{ padding: '0.75rem 1rem' }}>Receipt #</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Booking</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Method</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Amount</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentPayments.map((p) => (
                      <tr key={p._id || p.paymentId} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '0.75rem 1rem', fontWeight: 600, color: '#0f172a' }}>{p.paymentId || p.receiptNumber || 'REC'}</td>
                        <td style={{ padding: '0.75rem 1rem', color: '#64748b' }}>{p.bookingRef || p.bookingId || '—'}</td>
                        <td style={{ padding: '0.75rem 1rem', color: '#64748b' }}>{p.method || p.paymentMethod || 'Cash'}</td>
                        <td style={{ padding: '0.75rem 1rem', fontWeight: 700, color: '#059669' }}>₹{Number(p.amount || 0).toLocaleString('en-IN')}</td>
                        <td style={{ padding: '0.75rem 1rem' }}><StatusBadge status={p.status || 'Completed'} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardBody>
        </Card>

        {/* Table 2: Recent Operating Expenses */}
        <Card>
          <CardHeader>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
              <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '1.05rem' }}>Operating Expenses</div>
              <Button variant="ghost" size="sm" onClick={() => navigate('/accountant/expenses')}>View All →</Button>
            </div>
          </CardHeader>
          <CardBody style={{ padding: 0 }}>
            {recentExpenses.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>No recorded expenses yet.</div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b', backgroundColor: '#f8fafc' }}>
                      <th style={{ padding: '0.75rem 1rem' }}>Expense #</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Category</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Vendor / Ref</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Amount</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentExpenses.map((e) => (
                      <tr key={e._id || e.expenseId} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '0.75rem 1rem', fontWeight: 600, color: '#0f172a' }}>{e.expenseId || e.expenseNumber || 'EXP'}</td>
                        <td style={{ padding: '0.75rem 1rem', color: '#64748b' }}>{e.category || 'General'}</td>
                        <td style={{ padding: '0.75rem 1rem', color: '#64748b' }}>{e.vendorName || e.payee || e.description?.slice(0, 20) || '—'}</td>
                        <td style={{ padding: '0.75rem 1rem', fontWeight: 700, color: '#dc2626' }}>₹{Number(e.amount || 0).toLocaleString('en-IN')}</td>
                        <td style={{ padding: '0.75rem 1rem' }}><StatusBadge status={e.status || 'Approved'} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

export default AccountantDashboard;
