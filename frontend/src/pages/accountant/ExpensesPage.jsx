// MAK Tours & Travels ERP - Dedicated Operating Expenses Module
import React, { useState, useEffect } from 'react';
import {
  Receipt,
  Search,
  Plus,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  Edit2,
  FileText,
  IndianRupee
} from 'lucide-react';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Modal } from '../../components/ui/Modal';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { accountantService } from '../../services/accountantService';

export function ExpensesPage() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    category: 'Fuel',
    amount: '',
    vendorName: '',
    vehicleNumber: '',
    notes: ''
  });

  const loadExpenses = async () => {
    setLoading(true);
    try {
      const res = await accountantService.getExpenses();
      setExpenses(Array.isArray(res?.data) ? res.data : []);
    } catch (err) {
      console.error('Error fetching expenses:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExpenses();
  }, []);

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setModalError('');
    if (!formData.title || !formData.amount) {
      setModalError('Title and Amount are required.');
      return;
    }

    setSubmitting(true);
    try {
      await accountantService.createExpense({
        title: formData.title.trim(),
        category: formData.category,
        amount: Number(formData.amount),
        vendorName: formData.vendorName.trim(),
        vehicleNumber: formData.vehicleNumber.trim(),
        notes: formData.notes.trim()
      });
      setIsCreateModalOpen(false);
      setFormData({
        title: '',
        category: 'Fuel',
        amount: '',
        vendorName: '',
        vehicleNumber: '',
        notes: ''
      });
      loadExpenses();
    } catch (err) {
      setModalError(err.message || 'Failed to record expense.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (expense, newStatus) => {
    try {
      await accountantService.updateExpenseStatus(expense.expenseId || expense._id, newStatus);
      loadExpenses();
    } catch (err) {
      alert(err.message || `Failed to update status to ${newStatus}`);
    }
  };

  const filteredExpenses = expenses.filter((e) => {
    const q = searchTerm.toLowerCase();
    const matchSearch =
      (e.expenseId || '').toLowerCase().includes(q) ||
      (e.title || '').toLowerCase().includes(q) ||
      (e.vendorName || '').toLowerCase().includes(q) ||
      (e.vehicleNumber || '').toLowerCase().includes(q);

    const matchCat = categoryFilter === 'All' || e.category === categoryFilter;
    const matchStatus = statusFilter === 'All' || e.status === statusFilter;
    return matchSearch && matchCat && matchStatus;
  });

  const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header Bar */}
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
            Operating Expenses & Fleet Payouts
          </h1>
          <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0.25rem 0 0' }}>
            Track, approve, and disburse operational, fleet, and office vouchers
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#dc2626', backgroundColor: '#fef2f2', padding: '0.45rem 0.85rem', borderRadius: '8px' }}>
            Total Expenses: ₹{totalExpenses.toLocaleString('en-IN')}
          </div>
          <Button variant="primary" size="sm" onClick={() => setIsCreateModalOpen(true)}>
            <Plus size={16} style={{ marginRight: '0.35rem' }} /> Add Expense Voucher
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
            placeholder="Search by Voucher #, Title, Vendor, Vehicle..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%', border: 'none', outline: 'none', fontSize: '0.9rem' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            style={{ padding: '0.45rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', backgroundColor: '#ffffff' }}
          >
            <option value="All">All Categories</option>
            <option value="Fuel">Fuel</option>
            <option value="Tolls & Parking">Tolls & Parking</option>
            <option value="Maintenance">Maintenance</option>
            <option value="Driver Allowance">Driver Allowance</option>
            <option value="Office & Administrative">Office & Admin</option>
            <option value="Salary & Wages">Salary & Wages</option>
            <option value="Vendor Payout">Vendor Payout</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ padding: '0.45rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', backgroundColor: '#ffffff' }}
          >
            <option value="All">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Paid">Paid (Posted)</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Expenses Table */}
      <Card>
        <CardBody style={{ padding: 0 }}>
          {loading ? (
            <LoadingSpinner message="Loading operating expenses..." />
          ) : filteredExpenses.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
              No expenses found matching the selected filters.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b' }}>
                    <th style={{ padding: '0.85rem 1.25rem' }}>Voucher #</th>
                    <th style={{ padding: '0.85rem 1.25rem' }}>Title & Details</th>
                    <th style={{ padding: '0.85rem 1.25rem' }}>Category</th>
                    <th style={{ padding: '0.85rem 1.25rem' }}>Vendor / Payee</th>
                    <th style={{ padding: '0.85rem 1.25rem' }}>Amount</th>
                    <th style={{ padding: '0.85rem 1.25rem' }}>Status</th>
                    <th style={{ padding: '0.85rem 1.25rem' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredExpenses.map((exp) => (
                    <tr key={exp._id || exp.expenseId} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '0.85rem 1.25rem', fontWeight: 700, color: '#0f172a' }}>
                        {exp.expenseId || exp.expenseNumber || 'EXP'}
                      </td>
                      <td style={{ padding: '0.85rem 1.25rem' }}>
                        <div style={{ fontWeight: 600, color: '#0f172a' }}>{exp.title}</div>
                        {exp.vehicleNumber && (
                          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Vehicle: {exp.vehicleNumber}</div>
                        )}
                      </td>
                      <td style={{ padding: '0.85rem 1.25rem', color: '#475569' }}>
                        {exp.category}
                      </td>
                      <td style={{ padding: '0.85rem 1.25rem', color: '#64748b' }}>
                        {exp.vendorName || exp.payee || '—'}
                      </td>
                      <td style={{ padding: '0.85rem 1.25rem', fontWeight: 800, color: '#dc2626' }}>
                        ₹{Number(exp.amount || 0).toLocaleString('en-IN')}
                      </td>
                      <td style={{ padding: '0.85rem 1.25rem' }}>
                        <StatusBadge status={exp.status || 'Pending'} />
                      </td>
                      <td style={{ padding: '0.85rem 1.25rem' }}>
                        {exp.status === 'Pending' && (
                          <div style={{ display: 'flex', gap: '0.4rem' }}>
                            <Button size="xs" variant="outline" onClick={() => handleStatusChange(exp, 'Approved')}>
                              Approve
                            </Button>
                            <Button size="xs" variant="danger" onClick={() => handleStatusChange(exp, 'Rejected')}>
                              Reject
                            </Button>
                          </div>
                        )}
                        {exp.status === 'Approved' && (
                          <Button size="xs" variant="primary" style={{ backgroundColor: '#059669' }} onClick={() => handleStatusChange(exp, 'Paid')}>
                            Mark Paid
                          </Button>
                        )}
                        {exp.status === 'Paid' && (
                          <span style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                            <CheckCircle2 size={13} /> Posted
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

      {/* Add Expense Modal */}
      {isCreateModalOpen && (
        <Modal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          title="Create Operating Expense Voucher"
        >
          <form onSubmit={handleCreateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {modalError && (
              <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', padding: '0.75rem', borderRadius: '8px', color: '#b91c1c', fontSize: '0.85rem' }}>
                {modalError}
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                Expense Title / Description *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Fuel filling at HPCL OMR"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff' }}
                >
                  <option value="Fuel">Fuel</option>
                  <option value="Tolls & Parking">Tolls & Parking</option>
                  <option value="Maintenance">Maintenance & Servicing</option>
                  <option value="Driver Allowance">Driver Trip Allowance</option>
                  <option value="Office & Administrative">Office Supplies</option>
                  <option value="Salary & Wages">Salary Disbursement</option>
                  <option value="Vendor Payout">Vendor Payout</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                  Amount (INR) *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  placeholder="0.00"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                  Payee / Vendor Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Shell Petrol Bunk"
                  value={formData.vendorName}
                  onChange={(e) => setFormData({ ...formData, vendorName: e.target.value })}
                  style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                  Vehicle Reg No (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. TN-01-AB-1234"
                  value={formData.vehicleNumber}
                  onChange={(e) => setFormData({ ...formData, vehicleNumber: e.target.value })}
                  style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
              <Button variant="ghost" onClick={() => setIsCreateModalOpen(false)}>Cancel</Button>
              <Button variant="primary" type="submit" disabled={submitting}>
                {submitting ? 'Saving...' : 'Create Voucher'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

export default ExpensesPage;
