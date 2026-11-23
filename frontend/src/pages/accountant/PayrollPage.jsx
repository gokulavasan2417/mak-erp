// MAK Tours & Travels ERP - Payroll Accounting & Statutory Deductions Module
import React, { useState, useEffect } from 'react';
import {
  Banknote,
  Search,
  Calendar,
  CheckCircle2,
  Clock,
  Shield,
  FileText,
  IndianRupee,
  UserCheck
} from 'lucide-react';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Modal } from '../../components/ui/Modal';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { accountantService } from '../../services/accountantService';

export function PayrollPage() {
  const [currentMonth, setCurrentMonth] = useState('2026-11');
  const [summary, setSummary] = useState(null);
  const [disbursements, setDisbursements] = useState([]);
  const [loading, setLoading] = useState(true);

  // Pay Modal
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [selectedDisbursement, setSelectedDisbursement] = useState(null);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('Bank Transfer');
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState('');

  const loadPayrollData = async (m) => {
    setLoading(true);
    try {
      const [sumRes, disbRes] = await Promise.allSettled([
        accountantService.getPayrollSummary({ month: m }),
        accountantService.getPayrollDisbursements({ month: m })
      ]);

      if (sumRes.status === 'fulfilled') {
        setSummary(sumRes.value?.data || null);
      }
      if (disbRes.status === 'fulfilled') {
        setDisbursements(Array.isArray(disbRes.value?.data) ? disbRes.value.data : []);
      }
    } catch (err) {
      console.error('Error fetching payroll accounting data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayrollData(currentMonth);
  }, [currentMonth]);

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    if (!selectedDisbursement || !payAmount) return;

    setSubmitting(true);
    try {
      await accountantService.recordPayrollPayment(selectedDisbursement.payrollCode || selectedDisbursement._id, {
        amount: Number(payAmount),
        paymentMethod: payMethod
      });
      setIsPayModalOpen(false);
      loadPayrollData(currentMonth);
    } catch (err) {
      setModalError(err.message || 'Payment recording failed.');
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
            Payroll Accounting & Statutory Compliance
          </h1>
          <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0.25rem 0 0' }}>
            Salary liabilities, PF & ESI contributions, and double-entry bank disbursements
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#f8fafc', padding: '0.35rem 0.65rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
            <Calendar size={15} style={{ color: '#64748b' }} />
            <input
              type="month"
              value={currentMonth}
              onChange={(e) => setCurrentMonth(e.target.value)}
              style={{ border: 'none', backgroundColor: 'transparent', outline: 'none', fontWeight: 600, fontSize: '0.85rem' }}
            />
          </div>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner message="Calculating monthly payroll accounting analytics..." />
      ) : summary ? (
        <>
          {/* Summary Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '1rem' }}>
            <div style={{ backgroundColor: '#ffffff', padding: '1.15rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Total Gross Salary</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', marginTop: '0.35rem' }}>
                ₹{Number(summary.totalGrossSalary || 0).toLocaleString('en-IN')}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
                {summary.totalCount || 0} employees calculated
              </div>
            </div>

            <div style={{ backgroundColor: '#ffffff', padding: '1.15rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#d97706', textTransform: 'uppercase' }}>Statutory Deductions</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#d97706', marginTop: '0.35rem' }}>
                ₹{Number(summary.statutoryDeductions?.totalDeductions || 0).toLocaleString('en-IN')}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
                PF: ₹{summary.statutoryDeductions?.pf || 0} • ESI: ₹{summary.statutoryDeductions?.esi || 0}
              </div>
            </div>

            <div style={{ backgroundColor: '#ffffff', padding: '1.15rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#2563eb', textTransform: 'uppercase' }}>Net Payable Liability</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#2563eb', marginTop: '0.35rem' }}>
                ₹{Number(summary.totalNetPayableSalary || 0).toLocaleString('en-IN')}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
                After statutory tax deduction
              </div>
            </div>

            <div style={{ backgroundColor: '#ffffff', padding: '1.15rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#059669', textTransform: 'uppercase' }}>Disbursed (Paid)</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#059669', marginTop: '0.35rem' }}>
                ₹{Number(summary.totalDisbursed || 0).toLocaleString('en-IN')}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
                Pending: ₹{Number(summary.totalOutstanding || 0).toLocaleString('en-IN')}
              </div>
            </div>
          </div>

          {/* Disbursements & Payroll Records Table */}
          <Card>
            <CardHeader>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                <div style={{ fontWeight: 700, color: '#0f172a' }}>Monthly Staff Payroll Breakdown: {currentMonth}</div>
              </div>
            </CardHeader>
            <CardBody style={{ padding: 0 }}>
              {disbursements.length === 0 ? (
                <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
                  No payroll records found for {currentMonth}.
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b' }}>
                        <th style={{ padding: '0.85rem 1.25rem' }}>Payroll Code</th>
                        <th style={{ padding: '0.85rem 1.25rem' }}>Employee Name</th>
                        <th style={{ padding: '0.85rem 1.25rem' }}>Basic + HRA</th>
                        <th style={{ padding: '0.85rem 1.25rem' }}>Deductions</th>
                        <th style={{ padding: '0.85rem 1.25rem' }}>Net Salary</th>
                        <th style={{ padding: '0.85rem 1.25rem' }}>Outstanding</th>
                        <th style={{ padding: '0.85rem 1.25rem' }}>Status</th>
                        <th style={{ padding: '0.85rem 1.25rem' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {disbursements.map((d) => (
                        <tr key={d._id || d.payrollCode} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '0.85rem 1.25rem', fontWeight: 700, color: '#0f172a' }}>
                            {d.payrollCode}
                          </td>
                          <td style={{ padding: '0.85rem 1.25rem' }}>
                            <div style={{ fontWeight: 600, color: '#0f172a' }}>{d.employeeName}</div>
                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{d.designation || 'Staff'}</div>
                          </td>
                          <td style={{ padding: '0.85rem 1.25rem', color: '#0f172a' }}>
                            ₹{Number(d.earningsBreakdown?.basicSalary || d.basicSalary || 0).toLocaleString('en-IN')}
                          </td>
                          <td style={{ padding: '0.85rem 1.25rem', color: '#dc2626' }}>
                            ₹{Number(d.deductionsBreakdown?.totalDeductions || d.pfDeduction || 0).toLocaleString('en-IN')}
                          </td>
                          <td style={{ padding: '0.85rem 1.25rem', fontWeight: 700, color: '#0f172a' }}>
                            ₹{Number(d.netPayableSalary || 0).toLocaleString('en-IN')}
                          </td>
                          <td style={{ padding: '0.85rem 1.25rem', fontWeight: 800, color: d.outstandingSalary > 0 ? '#ea580c' : '#059669' }}>
                            ₹{Number(d.outstandingSalary !== undefined ? d.outstandingSalary : d.netPayableSalary).toLocaleString('en-IN')}
                          </td>
                          <td style={{ padding: '0.85rem 1.25rem' }}>
                            <StatusBadge status={d.status || 'Approved'} />
                          </td>
                          <td style={{ padding: '0.85rem 1.25rem' }}>
                            {d.status !== 'Paid' ? (
                              <Button
                                size="xs"
                                variant="primary"
                                style={{ backgroundColor: '#059669' }}
                                onClick={() => {
                                  setSelectedDisbursement(d);
                                  setPayAmount(d.outstandingSalary || d.netPayableSalary);
                                  setIsPayModalOpen(true);
                                }}
                              >
                                Disburse
                              </Button>
                            ) : (
                              <span style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                                <CheckCircle2 size={13} /> Disbursed
                              </span>
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
        </>
      ) : null}

      {/* Disburse Modal */}
      {isPayModalOpen && selectedDisbursement && (
        <Modal
          isOpen={isPayModalOpen}
          onClose={() => setIsPayModalOpen(false)}
          title={`Disburse Salary: ${selectedDisbursement.employeeName}`}
        >
          <form onSubmit={handleRecordPayment} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {modalError && (
              <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', padding: '0.75rem', borderRadius: '8px', color: '#b91c1c', fontSize: '0.85rem' }}>
                {modalError}
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                Disbursement Amount (INR) *
              </label>
              <input
                type="number"
                required
                min="1"
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
                style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                Payment Method
              </label>
              <select
                value={payMethod}
                onChange={(e) => setPayMethod(e.target.value)}
                style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff' }}
              >
                <option value="Bank Transfer">Bank Transfer (NEFT/IMPS)</option>
                <option value="Cash">Cash</option>
                <option value="Cheque">Cheque</option>
              </select>
            </div>

            <p style={{ fontSize: '0.75rem', color: '#64748b', margin: 0 }}>
              Recording salary payment automatically creates a double-entry journal entry debiting Salary Expense / Payable and crediting Bank Account.
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
              <Button variant="ghost" onClick={() => setIsPayModalOpen(false)}>Cancel</Button>
              <Button variant="primary" type="submit" disabled={submitting}>
                {submitting ? 'Disbursing...' : 'Disburse to Ledger'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

export default PayrollPage;
