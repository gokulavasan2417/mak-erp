// MAK Tours & Travels ERP - Driver Settlements & Allowances Module
import React, { useState, useEffect } from 'react';
import {
  UserCheck,
  Search,
  Plus,
  Calculator,
  Download,
  Calendar,
  CheckCircle2,
  FileText,
  IndianRupee,
  Car
} from 'lucide-react';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Modal } from '../../components/ui/Modal';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { accountantService } from '../../services/accountantService';
import { formatDateDMY } from '../../utils/dateUtils';

export function DriverSettlementsPage() {
  const [settlements, setSettlements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Preview & Create Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [statementModalOpen, setStatementModalOpen] = useState(false);
  const [activeStatement, setActiveStatement] = useState(null);
  const [calculating, setCalculating] = useState(false);
  const [calculationResult, setCalculationResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState('');

  const [calcForm, setCalcForm] = useState({
    driverId: 'DRV-001',
    driverName: 'Senthil Kumar',
    startDate: '2026-11-01',
    endDate: '2026-11-30',
    fuelAdvanceDeduction: 0,
    otherDeductions: 0
  });

  const loadSettlements = async () => {
    setLoading(true);
    try {
      const res = await accountantService.getDriverSettlements();
      setSettlements(Array.isArray(res?.data) ? res.data : []);
    } catch (err) {
      console.error('Error fetching driver settlements:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettlements();
  }, []);

  const handleCalculateEarnings = async () => {
    setModalError('');
    setCalculating(true);
    try {
      const res = await accountantService.calculateDriverSettlement({
        driverId: calcForm.driverId.trim(),
        driverName: calcForm.driverName.trim(),
        startDate: calcForm.startDate,
        endDate: calcForm.endDate
      });
      setCalculationResult(res?.data || null);
    } catch (err) {
      setModalError(err.message || 'Error calculating driver earnings.');
    } finally {
      setCalculating(false);
    }
  };

  const handleCreateSettlement = async (e) => {
    e.preventDefault();
    setModalError('');
    if (!calculationResult) {
      setModalError('Please preview and calculate driver earnings first.');
      return;
    }

    setSubmitting(true);
    try {
      await accountantService.createDriverSettlement({
        driverId: calcForm.driverId.trim(),
        driverName: calcForm.driverName.trim(),
        startDate: calcForm.startDate,
        endDate: calcForm.endDate,
        fuelAdvanceDeduction: Number(calcForm.fuelAdvanceDeduction || 0),
        otherDeductions: Number(calcForm.otherDeductions || 0)
      });
      setIsCreateModalOpen(false);
      setCalculationResult(null);
      loadSettlements();
    } catch (err) {
      setModalError(err.message || 'Failed to generate driver settlement.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDisbursePayment = async (settlement) => {
    if (!window.confirm(`Disburse payment of ₹${Number(settlement.netPayable || 0).toLocaleString('en-IN')} to ${settlement.driverName}?`)) {
      return;
    }

    try {
      await accountantService.payDriverSettlement(settlement.settlementNo, {
        paymentMethod: 'Bank Transfer'
      });
      loadSettlements();
    } catch (err) {
      alert(err.message || 'Disbursement failed.');
    }
  };

  const handleViewStatement = async (settlement) => {
    try {
      const res = await accountantService.getDriverStatement(settlement.settlementNo);
      setActiveStatement(res?.data || settlement);
      setStatementModalOpen(true);
    } catch (err) {
      setActiveStatement(settlement);
      setStatementModalOpen(true);
    }
  };

  const filteredSettlements = settlements.filter((s) => {
    const q = searchTerm.toLowerCase();
    const matchSearch =
      (s.settlementNo || '').toLowerCase().includes(q) ||
      (s.driverName || '').toLowerCase().includes(q) ||
      (s.driverId || '').toLowerCase().includes(q);

    const matchStatus = statusFilter === 'All' || s.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalDisbursed = settlements.filter(s => s.status === 'Paid').reduce((sum, s) => sum + Number(s.netPayable || 0), 0);
  const totalPending = settlements.filter(s => s.status !== 'Paid').reduce((sum, s) => sum + Number(s.netPayable || 0), 0);

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
            Driver Settlements & Trip Allowances
          </h1>
          <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0.25rem 0 0' }}>
            Calculate trip allowances, deduct advances, and settle driver payouts
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#059669', backgroundColor: '#ecfdf5', padding: '0.45rem 0.85rem', borderRadius: '8px' }}>
            Pending Settlement: ₹{totalPending.toLocaleString('en-IN')}
          </div>
          <Button variant="primary" size="sm" onClick={() => setIsCreateModalOpen(true)}>
            <Calculator size={16} style={{ marginRight: '0.35rem' }} /> Calculate Settlement
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          flexWrap: 'wrap',
          backgroundColor: '#ffffff',
          padding: '1rem 1.25rem',
          borderRadius: '12px',
          border: '1px solid #e2e8f0'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flex: 1, minWidth: '240px' }}>
          <Search size={18} style={{ color: '#94a3b8' }} />
          <input
            type="text"
            placeholder="Search by Settlement #, Driver Name, ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%', border: 'none', outline: 'none', fontSize: '0.9rem' }}
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{ padding: '0.45rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', backgroundColor: '#ffffff' }}
        >
          <option value="All">All Statuses</option>
          <option value="Approved">Approved</option>
          <option value="Paid">Paid (Disbursed)</option>
          <option value="Draft">Draft</option>
        </select>
      </div>

      {/* Settlements Table */}
      <Card>
        <CardBody style={{ padding: 0 }}>
          {loading ? (
            <LoadingSpinner message="Loading driver settlements..." />
          ) : filteredSettlements.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
              No driver settlements generated yet.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b' }}>
                    <th style={{ padding: '0.85rem 1.25rem' }}>Settlement #</th>
                    <th style={{ padding: '0.85rem 1.25rem' }}>Driver Name</th>
                    <th style={{ padding: '0.85rem 1.25rem' }}>Period</th>
                    <th style={{ padding: '0.85rem 1.25rem' }}>Trips</th>
                    <th style={{ padding: '0.85rem 1.25rem' }}>Gross Earnings</th>
                    <th style={{ padding: '0.85rem 1.25rem' }}>Deductions</th>
                    <th style={{ padding: '0.85rem 1.25rem' }}>Net Payable</th>
                    <th style={{ padding: '0.85rem 1.25rem' }}>Status</th>
                    <th style={{ padding: '0.85rem 1.25rem' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSettlements.map((s) => (
                    <tr key={s._id || s.settlementNo} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '0.85rem 1.25rem', fontWeight: 700, color: '#0f172a' }}>
                        {s.settlementNo}
                      </td>
                      <td style={{ padding: '0.85rem 1.25rem' }}>
                        <div style={{ fontWeight: 600, color: '#0f172a' }}>{s.driverName}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>ID: {s.driverId}</div>
                      </td>
                      <td style={{ padding: '0.85rem 1.25rem', color: '#64748b', fontSize: '0.8rem' }}>
                        {formatDateDMY(s.startDate)} to {formatDateDMY(s.endDate)}
                      </td>
                      <td style={{ padding: '0.85rem 1.25rem', color: '#0f172a', fontWeight: 600 }}>
                        {s.totalTrips || s.trips?.length || 0}
                      </td>
                      <td style={{ padding: '0.85rem 1.25rem', color: '#0f172a', fontWeight: 600 }}>
                        ₹{Number(s.grossEarnings || s.totalTripAllowances || 0).toLocaleString('en-IN')}
                      </td>
                      <td style={{ padding: '0.85rem 1.25rem', color: '#dc2626' }}>
                        ₹{Number((s.fuelAdvanceDeduction || 0) + (s.otherDeductions || 0)).toLocaleString('en-IN')}
                      </td>
                      <td style={{ padding: '0.85rem 1.25rem', fontWeight: 800, color: '#059669' }}>
                        ₹{Number(s.netPayable || 0).toLocaleString('en-IN')}
                      </td>
                      <td style={{ padding: '0.85rem 1.25rem' }}>
                        <StatusBadge status={s.status || 'Approved'} />
                      </td>
                      <td style={{ padding: '0.85rem 1.25rem' }}>
                        <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                          <Button size="xs" variant="outline" onClick={() => handleViewStatement(s)}>
                            Statement
                          </Button>
                          {s.status !== 'Paid' && (
                            <Button size="xs" variant="primary" style={{ backgroundColor: '#059669' }} onClick={() => handleDisbursePayment(s)}>
                              Pay Now
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Calculate & Generate Settlement Modal */}
      {isCreateModalOpen && (
        <Modal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          title="Calculate & Settle Driver Earnings"
        >
          <form onSubmit={handleCreateSettlement} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {modalError && (
              <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', padding: '0.75rem', borderRadius: '8px', color: '#b91c1c', fontSize: '0.85rem' }}>
                {modalError}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                  Driver ID *
                </label>
                <input
                  type="text"
                  required
                  value={calcForm.driverId}
                  onChange={(e) => setCalcForm({ ...calcForm, driverId: e.target.value })}
                  style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                  Driver Name *
                </label>
                <input
                  type="text"
                  required
                  value={calcForm.driverName}
                  onChange={(e) => setCalcForm({ ...calcForm, driverName: e.target.value })}
                  style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155' }}>
                    Start Date
                  </label>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0284c7' }}>
                    ({formatDateDMY(calcForm.startDate)})
                  </span>
                </div>
                <input
                  type="date"
                  value={calcForm.startDate}
                  onChange={(e) => setCalcForm({ ...calcForm, startDate: e.target.value })}
                  style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                />
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155' }}>
                    End Date
                  </label>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0284c7' }}>
                    ({formatDateDMY(calcForm.endDate)})
                  </span>
                </div>
                <input
                  type="date"
                  value={calcForm.endDate}
                  onChange={(e) => setCalcForm({ ...calcForm, endDate: e.target.value })}
                  style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                />
              </div>
            </div>

            <Button type="button" variant="outline" onClick={handleCalculateEarnings} disabled={calculating}>
              {calculating ? 'Analyzing Trip Logs...' : '⚡ Preview Allowance Engine Calculation'}
            </Button>

            {calculationResult && (
              <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', padding: '1rem', borderRadius: '8px' }}>
                <div style={{ fontWeight: 700, color: '#166534', marginBottom: '0.4rem' }}>
                  Earnings Preview ({calculationResult.totalTrips || 0} Trips Completed)
                </div>
                <div style={{ fontSize: '0.85rem', color: '#14532d', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <div>Per-Trip Allowance: ₹{Number(calculationResult.totalTripAllowances || 0).toLocaleString('en-IN')}</div>
                  <div>Night Shift Bonus: ₹{Number(calculationResult.nightAllowanceTotal || 0).toLocaleString('en-IN')}</div>
                  <div>Long Distance: ₹{Number(calculationResult.longDistanceAllowanceTotal || 0).toLocaleString('en-IN')}</div>
                  <div style={{ fontWeight: 800, borderTop: '1px solid #bbf7d0', paddingTop: '0.4rem', marginTop: '0.2rem' }}>
                    Gross Trip Earnings: ₹{Number(calculationResult.grossEarnings || 0).toLocaleString('en-IN')}
                  </div>
                </div>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                  Fuel / Cash Advance Deduction
                </label>
                <input
                  type="number"
                  placeholder="0.00"
                  value={calcForm.fuelAdvanceDeduction}
                  onChange={(e) => setCalcForm({ ...calcForm, fuelAdvanceDeduction: e.target.value })}
                  style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                  Other Deductions
                </label>
                <input
                  type="number"
                  placeholder="0.00"
                  value={calcForm.otherDeductions}
                  onChange={(e) => setCalcForm({ ...calcForm, otherDeductions: e.target.value })}
                  style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
              <Button variant="ghost" onClick={() => setIsCreateModalOpen(false)}>Cancel</Button>
              <Button variant="primary" type="submit" disabled={submitting || !calculationResult}>
                {submitting ? 'Generating...' : 'Confirm & Generate Settlement'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Statement Modal */}
      {statementModalOpen && activeStatement && (
        <Modal
          isOpen={statementModalOpen}
          onClose={() => setStatementModalOpen(false)}
          title={`Driver Trip Statement: ${activeStatement.settlementNo}`}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem' }}>
              <div>
                <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '1.1rem' }}>{activeStatement.driverName}</div>
                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Driver ID: {activeStatement.driverId}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <StatusBadge status={activeStatement.status || 'Approved'} />
                <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.25rem' }}>
                  {formatDateDMY(activeStatement.startDate)} to {formatDateDMY(activeStatement.endDate)}
                </div>
              </div>
            </div>

            <div style={{ backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '8px', display: 'flex', justifyContent: 'space-around', textAlign: 'center' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Gross Allowances</div>
                <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '1.1rem' }}>
                  ₹{Number(activeStatement.grossEarnings || activeStatement.totalTripAllowances || 0).toLocaleString('en-IN')}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Total Deductions</div>
                <div style={{ fontWeight: 700, color: '#dc2626', fontSize: '1.1rem' }}>
                  ₹{Number((activeStatement.fuelAdvanceDeduction || 0) + (activeStatement.otherDeductions || 0)).toLocaleString('en-IN')}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Net Disbursed</div>
                <div style={{ fontWeight: 800, color: '#059669', fontSize: '1.2rem' }}>
                  ₹{Number(activeStatement.netPayable || 0).toLocaleString('en-IN')}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
              <Button variant="outline" onClick={() => window.print()}>
                Print Statement
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default DriverSettlementsPage;
