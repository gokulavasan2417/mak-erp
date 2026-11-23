// MAK Tours & Travels ERP - Super Admin Multi-Tenant Companies Management
import React, { useState, useEffect } from 'react';
import {
  Building2,
  Plus,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  AlertTriangle,
  PauseCircle,
  PlayCircle,
  KeyRound,
  Lock,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  Calendar,
  Car,
  Users,
  Eye,
  Sliders
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { Modal } from '../../components/ui/Modal';
import { superAdminService } from '../../services/superAdminService';
import { useToast } from '../../context/ToastContext';
import { formatDateDMY } from '../../utils/dateUtils';

export function SuperAdminCompanies() {
  const toast = useToast();

  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [planFilter, setPlanFilter] = useState('All');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [actionType, setActionType] = useState(null); // 'status' | 'license' | 'reset-password' | 'details'
  const [actionReason, setActionReason] = useState('');
  const [targetStatus, setTargetStatus] = useState('');

  // Add Company Form State
  const [newCompany, setNewCompany] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: 'Chennai',
    state: 'Tamil Nadu',
    gstin: '',
    plan: 'Professional',
    adminName: '',
    adminPassword: 'Admin@123',
    licenseExpiryMonths: 12
  });

  // Edit License State
  const [licenseForm, setLicenseForm] = useState({
    plan: 'Professional',
    expiryDate: '',
    maxVehicles: 50,
    maxDrivers: 50,
    maxUsers: 20
  });

  // Reset Password State
  const [newAdminPassword, setNewAdminPassword] = useState('');

  const fetchCompanies = async () => {
    setLoading(true);
    try {
      const res = await superAdminService.getCompanies({
        search,
        status: statusFilter,
        plan: planFilter
      });
      setCompanies(res?.data || []);
    } catch (err) {
      console.warn('Could not fetch companies from API, using local fallback:', err);
      // Fallback default companies
      setCompanies([
        {
          id: 'CMP-MAK-001',
          tenantId: 'mak-tours',
          name: 'MAK Tours & Travels',
          email: 'admin@maktours.com',
          phone: '+91 98401 11000',
          city: 'Chennai',
          state: 'Tamil Nadu',
          status: 'Active',
          plan: 'Enterprise',
          licenseKey: 'MAK-LIC-2026-ENT-0001',
          licenseStatus: 'Active',
          licenseExpiry: '2035-12-31T00:00:00.000Z',
          vehicleCount: 22,
          driverCount: 4,
          bookingCount: 13,
          primaryAdmin: { name: 'Ananya Deshmukh', email: 'admin@maktours.com' },
          createdAt: '2026-01-01T00:00:00.000Z'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, [statusFilter, planFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchCompanies();
  };

  // 1. Create Company
  const handleCreateCompanySubmit = async (e) => {
    e.preventDefault();
    if (!newCompany.name || !newCompany.email) {
      toast.error('Company Name and Primary Email are required.');
      return;
    }
    try {
      await superAdminService.createCompany(newCompany);
      toast.success(`Company "${newCompany.name}" provisioned successfully!`);
      setIsAddModalOpen(false);
      setNewCompany({
        name: '',
        email: '',
        phone: '',
        address: '',
        city: 'Chennai',
        state: 'Tamil Nadu',
        gstin: '',
        plan: 'Professional',
        adminName: '',
        adminPassword: 'Admin@123',
        licenseExpiryMonths: 12
      });
      fetchCompanies();
    } catch (err) {
      toast.error(err.message || 'Could not create company account.');
    }
  };

  // 2. Status Change (Approve, Suspend, Reactivate, Reject)
  const handleConfirmStatusChange = async () => {
    if (!selectedCompany || !targetStatus) return;
    try {
      await superAdminService.updateCompanyStatus(selectedCompany.tenantId, targetStatus, actionReason);
      toast.success(`Company ${selectedCompany.name} is now ${targetStatus}!`);
      setSelectedCompany(null);
      setActionType(null);
      setActionReason('');
      fetchCompanies();
    } catch (err) {
      toast.error(err.message || 'Failed to update company status.');
    }
  };

  // 3. Update License
  const handleUpdateLicenseSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCompany) return;
    try {
      await superAdminService.updateCompanyLicense(selectedCompany.tenantId, {
        plan: licenseForm.plan,
        expiryDate: licenseForm.expiryDate,
        limits: {
          maxVehicles: Number(licenseForm.maxVehicles),
          maxDrivers: Number(licenseForm.maxDrivers),
          maxUsers: Number(licenseForm.maxUsers)
        }
      });
      toast.success(`License updated for ${selectedCompany.name}!`);
      setSelectedCompany(null);
      setActionType(null);
      fetchCompanies();
    } catch (err) {
      toast.error(err.message || 'Failed to update license.');
    }
  };

  // 4. Reset Admin Password
  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCompany || !newAdminPassword || newAdminPassword.length < 6) {
      toast.error('Password must be at least 6 characters.');
      return;
    }
    try {
      await superAdminService.resetCompanyAdminPassword(selectedCompany.tenantId, newAdminPassword);
      toast.success(`Admin password reset successfully for ${selectedCompany.name}!`);
      setSelectedCompany(null);
      setActionType(null);
      setNewAdminPassword('');
    } catch (err) {
      toast.error(err.message || 'Failed to reset password.');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Active':
        return <Badge variant="success" dot size="sm">Active</Badge>;
      case 'Pending':
        return <Badge variant="warning" dot size="sm">Pending Approval</Badge>;
      case 'Suspended':
        return <Badge variant="danger" dot size="sm">Suspended</Badge>;
      case 'Rejected':
        return <Badge variant="neutral" size="sm">Rejected</Badge>;
      default:
        return <Badge variant="neutral" size="sm">{status}</Badge>;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.625rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em', margin: 0 }}>
            Companies &amp; Tenants Management
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            Multi-tenant governance, commercial license provisioning, subscription quotas, and access control.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Button
            variant="secondary"
            size="sm"
            onClick={fetchCompanies}
            leftIcon={<RefreshCw size={14} className={loading ? 'animate-spin' : ''} />}
          >
            Refresh
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsAddModalOpen(true)}
            leftIcon={<Plus size={15} />}
          >
            Add New Company
          </Button>
        </div>
      </div>

      {/* Filters Toolbar */}
      <Card>
        <CardBody style={{ padding: '1rem 1.25rem' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
            <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '0.5rem', flex: 1, maxWidth: '420px' }}>
              <div style={{ position: 'relative', width: '100%' }}>
                <Search
                  size={16}
                  style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}
                />
                <input
                  type="text"
                  placeholder="Search by company name, tenantId, email, or city..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.5rem 0.75rem 0.5rem 2.25rem',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.85rem'
                  }}
                />
              </div>
              <Button type="submit" variant="secondary" size="sm">Search</Button>
            </form>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8125rem', color: '#64748b' }}>
                <Filter size={14} /> Status:
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{
                  padding: '0.45rem 0.75rem',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.8125rem',
                  backgroundColor: '#ffffff'
                }}
              >
                <option value="All">All Statuses</option>
                <option value="Active">Active</option>
                <option value="Pending">Pending Approval</option>
                <option value="Suspended">Suspended</option>
                <option value="Rejected">Rejected</option>
              </select>

              <select
                value={planFilter}
                onChange={(e) => setPlanFilter(e.target.value)}
                style={{
                  padding: '0.45rem 0.75rem',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.8125rem',
                  backgroundColor: '#ffffff'
                }}
              >
                <option value="All">All Plans</option>
                <option value="Starter">Starter</option>
                <option value="Professional">Professional</option>
                <option value="Enterprise">Enterprise</option>
              </select>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Companies Data Table */}
      <Card>
        <CardBody style={{ padding: 0, overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.8125rem' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b', fontWeight: 600 }}>
                <th style={{ padding: '0.875rem 1rem' }}>COMPANY &amp; TENANT ID</th>
                <th style={{ padding: '0.875rem 1rem' }}>PRIMARY ADMIN</th>
                <th style={{ padding: '0.875rem 1rem' }}>PLAN &amp; LICENSE</th>
                <th style={{ padding: '0.875rem 1rem' }}>FLEET / DRIVERS</th>
                <th style={{ padding: '0.875rem 1rem' }}>STATUS</th>
                <th style={{ padding: '0.875rem 1rem' }}>VALID UNTIL</th>
                <th style={{ padding: '0.875rem 1rem', textAlign: 'right' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ padding: '2.5rem', textAlign: 'center', color: '#64748b' }}>
                    <RefreshCw size={20} className="animate-spin" style={{ margin: '0 auto 0.5rem', display: 'block' }} />
                    Loading companies directory...
                  </td>
                </tr>
              ) : companies.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
                    No companies found matching the filter criteria.
                  </td>
                </tr>
              ) : (
                companies.map((c) => (
                  <tr
                    key={c.tenantId || c._id}
                    style={{
                      borderBottom: '1px solid #f1f5f9',
                      transition: 'background-color 0.15s ease'
                    }}
                  >
                    {/* Company */}
                    <td style={{ padding: '0.875rem 1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                        <div
                          style={{
                            width: '34px',
                            height: '34px',
                            borderRadius: '6px',
                            backgroundColor: c.tenantId === 'mak-tours' ? '#eef0fd' : '#f1f5f9',
                            color: c.tenantId === 'mak-tours' ? '#2C3480' : '#475569',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            flexShrink: 0
                          }}
                        >
                          <Building2 size={18} />
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.875rem' }}>
                            {c.name}
                            {c.tenantId === 'mak-tours' && (
                              <span style={{ fontSize: '0.6875rem', color: '#2C3480', backgroundColor: '#eef0fd', padding: '0.1rem 0.35rem', borderRadius: '4px', marginLeft: '0.4rem' }}>
                                Master Tenant
                              </span>
                            )}
                          </div>
                          <div style={{ color: '#64748b', fontSize: '0.75rem', fontFamily: 'monospace' }}>
                            tenantId: <strong>{c.tenantId}</strong>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Admin */}
                    <td style={{ padding: '0.875rem 1rem' }}>
                      <div style={{ fontWeight: 600, color: '#334155' }}>
                        {c.primaryAdmin?.name || c.adminName || 'Admin'}
                      </div>
                      <div style={{ color: '#64748b', fontSize: '0.75rem' }}>{c.email || c.primaryAdmin?.email}</div>
                    </td>

                    {/* Plan */}
                    <td style={{ padding: '0.875rem 1rem' }}>
                      <span
                        style={{
                          fontWeight: 700,
                          fontSize: '0.75rem',
                          padding: '0.15rem 0.5rem',
                          borderRadius: '4px',
                          backgroundColor: c.plan === 'Enterprise' ? '#fdf4ff' : c.plan === 'Professional' ? '#eef2ff' : '#f1f5f9',
                          color: c.plan === 'Enterprise' ? '#a21caf' : c.plan === 'Professional' ? '#3730a3' : '#334155',
                          border: '1px solid rgba(0,0,0,0.06)'
                        }}
                      >
                        {c.plan || 'Professional'}
                      </span>
                      {c.licenseKey && (
                        <div style={{ fontSize: '0.6875rem', color: '#94a3b8', fontFamily: 'monospace', marginTop: '0.2rem' }}>
                          {c.licenseKey}
                        </div>
                      )}
                    </td>

                    {/* Fleet & Drivers */}
                    <td style={{ padding: '0.875rem 1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#475569' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <Car size={13} color="#2C3480" /> <strong>{c.vehicleCount || 0}</strong>
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <Users size={13} color="#16a34a" /> <strong>{c.driverCount || 0}</strong>
                        </span>
                      </div>
                    </td>

                    {/* Status */}
                    <td style={{ padding: '0.875rem 1rem' }}>{getStatusBadge(c.status)}</td>

                    {/* Valid Until */}
                    <td style={{ padding: '0.875rem 1rem', color: '#475569' }}>
                      {c.licenseExpiry ? formatDateDMY(c.licenseExpiry) : 'Lifetime'}
                    </td>

                    {/* Actions */}
                    <td style={{ padding: '0.875rem 1rem', textAlign: 'right' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.4rem' }}>
                        {/* Approval buttons if Pending */}
                        {c.status === 'Pending' ? (
                          <>
                            <button
                              onClick={() => {
                                setSelectedCompany(c);
                                setTargetStatus('Active');
                                setActionType('status');
                              }}
                              style={{
                                padding: '0.3rem 0.6rem',
                                borderRadius: '4px',
                                border: '1px solid #86efac',
                                backgroundColor: '#f0fdf4',
                                color: '#16a34a',
                                fontWeight: 700,
                                fontSize: '0.75rem',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.25rem'
                              }}
                              title="Approve Company & Grant Access"
                            >
                              <CheckCircle size={13} /> Approve
                            </button>
                            <button
                              onClick={() => {
                                setSelectedCompany(c);
                                setTargetStatus('Rejected');
                                setActionType('status');
                              }}
                              style={{
                                padding: '0.3rem 0.6rem',
                                borderRadius: '4px',
                                border: '1px solid #fecaca',
                                backgroundColor: '#fef2f2',
                                color: '#dc2626',
                                fontWeight: 700,
                                fontSize: '0.75rem',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.25rem'
                              }}
                              title="Reject Application"
                            >
                              <XCircle size={13} /> Reject
                            </button>
                          </>
                        ) : c.status === 'Active' ? (
                          <button
                            onClick={() => {
                              setSelectedCompany(c);
                              setTargetStatus('Suspended');
                              setActionType('status');
                            }}
                            style={{
                              padding: '0.3rem 0.5rem',
                              borderRadius: '4px',
                              border: '1px solid #fecaca',
                              backgroundColor: '#fff1f2',
                              color: '#e11d48',
                              fontWeight: 600,
                              fontSize: '0.75rem',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.25rem'
                            }}
                            title="Suspend Company Account"
                          >
                            <PauseCircle size={13} /> Suspend
                          </button>
                        ) : c.status === 'Suspended' ? (
                          <button
                            onClick={() => {
                              setSelectedCompany(c);
                              setTargetStatus('Active');
                              setActionType('status');
                            }}
                            style={{
                              padding: '0.3rem 0.5rem',
                              borderRadius: '4px',
                              border: '1px solid #bbf7d0',
                              backgroundColor: '#f0fdf4',
                              color: '#16a34a',
                              fontWeight: 700,
                              fontSize: '0.75rem',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.25rem'
                            }}
                            title="Reactivate Suspended Account"
                          >
                            <PlayCircle size={13} /> Reactivate
                          </button>
                        ) : null}

                        {/* License Editor */}
                        <button
                          onClick={() => {
                            setSelectedCompany(c);
                            setLicenseForm({
                              plan: c.plan || 'Professional',
                              expiryDate: c.licenseExpiry ? c.licenseExpiry.substring(0, 10) : '',
                              maxVehicles: c.limits?.maxVehicles || 50,
                              maxDrivers: c.limits?.maxDrivers || 50,
                              maxUsers: c.limits?.maxUsers || 20
                            });
                            setActionType('license');
                          }}
                          style={{
                            padding: '0.3rem 0.5rem',
                            borderRadius: '4px',
                            border: '1px solid #cbd5e1',
                            backgroundColor: '#f8fafc',
                            color: '#334155',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem'
                          }}
                          title="Manage Subscription & License Quota"
                        >
                          <KeyRound size={13} /> License
                        </button>

                        {/* Password Reset */}
                        <button
                          onClick={() => {
                            setSelectedCompany(c);
                            setNewAdminPassword('');
                            setActionType('reset-password');
                          }}
                          style={{
                            padding: '0.3rem 0.5rem',
                            borderRadius: '4px',
                            border: '1px solid #cbd5e1',
                            backgroundColor: '#f8fafc',
                            color: '#64748b',
                            fontSize: '0.75rem',
                            cursor: 'pointer'
                          }}
                          title="Reset Company Admin Password"
                        >
                          <Lock size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardBody>
      </Card>

      {/* MODAL 1: ADD NEW COMPANY */}
      {isAddModalOpen && (
        <Modal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          title="Provision New Company Account"
        >
          <form onSubmit={handleCreateCompanySubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                  Company Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Blue Ocean Travels"
                  value={newCompany.name}
                  onChange={(e) => setNewCompany({ ...newCompany, name: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                  Primary Work Email *
                </label>
                <input
                  type="email"
                  required
                  placeholder="admin@blueoceantravels.com"
                  value={newCompany.email}
                  onChange={(e) => setNewCompany({ ...newCompany, email: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                  Admin Contact Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Suresh Babu"
                  value={newCompany.adminName}
                  onChange={(e) => setNewCompany({ ...newCompany, adminName: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                  Initial Admin Password
                </label>
                <input
                  type="text"
                  value={newCompany.adminPassword}
                  onChange={(e) => setNewCompany({ ...newCompany, adminPassword: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                  Subscription Tier
                </label>
                <select
                  value={newCompany.plan}
                  onChange={(e) => setNewCompany({ ...newCompany, plan: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', backgroundColor: '#fff' }}
                >
                  <option value="Starter">Starter (15 Vehicles)</option>
                  <option value="Professional">Professional (50 Vehicles)</option>
                  <option value="Enterprise">Enterprise (Unlimited)</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                  License Validity (Months)
                </label>
                <input
                  type="number"
                  min="1"
                  max="120"
                  value={newCompany.licenseExpiryMonths}
                  onChange={(e) => setNewCompany({ ...newCompany, licenseExpiryMonths: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
              <Button type="button" variant="secondary" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
              <Button type="submit" variant="primary">Provision Company</Button>
            </div>
          </form>
        </Modal>
      )}

      {/* MODAL 2: STATUS CONFIRMATION (APPROVE / SUSPEND / REACTIVATE / REJECT) */}
      {actionType === 'status' && selectedCompany && (
        <Modal
          isOpen={Boolean(selectedCompany && actionType === 'status')}
          onClose={() => { setSelectedCompany(null); setActionType(null); }}
          title={`${targetStatus === 'Active' ? 'Approve / Reactivate' : targetStatus} Company: ${selectedCompany.name}`}
        >
          <div style={{ padding: '0.5rem 0' }}>
            <p style={{ fontSize: '0.875rem', color: '#475569', lineHeight: 1.5 }}>
              Are you sure you want to mark <strong>{selectedCompany.name}</strong> as{' '}
              <strong style={{ color: targetStatus === 'Active' ? '#16a34a' : '#dc2626' }}>{targetStatus}</strong>?
            </p>

            {targetStatus === 'Active' && selectedCompany.status === 'Pending' && (
              <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '6px', padding: '0.75rem', margin: '0.75rem 0', fontSize: '0.8125rem', color: '#166534' }}>
                ✓ An active commercial license will automatically be issued.<br />
                ✓ The primary administrator account will be activated immediately.
              </div>
            )}

            {targetStatus === 'Suspended' && (
              <div style={{ backgroundColor: '#fff1f2', border: '1px solid #fecdd3', borderRadius: '6px', padding: '0.75rem', margin: '0.75rem 0', fontSize: '0.8125rem', color: '#9f1239' }}>
                ⚠️ Warning: All company staff, drivers, and administrators will immediately lose access to protected ERP modules. Company data will remain securely preserved.
              </div>
            )}

            <div style={{ marginTop: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                Reason / Internal Administrative Remarks (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Verified commercial registration credentials"
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
              <Button variant="secondary" onClick={() => { setSelectedCompany(null); setActionType(null); }}>Cancel</Button>
              <Button
                variant={targetStatus === 'Suspended' || targetStatus === 'Rejected' ? 'danger' : 'primary'}
                onClick={handleConfirmStatusChange}
              >
                Confirm {targetStatus}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL 3: MANAGE LICENSE & QUOTAS */}
      {actionType === 'license' && selectedCompany && (
        <Modal
          isOpen={Boolean(selectedCompany && actionType === 'license')}
          onClose={() => { setSelectedCompany(null); setActionType(null); }}
          title={`Subscription & License: ${selectedCompany.name}`}
        >
          <form onSubmit={handleUpdateLicenseSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                  Subscription Tier
                </label>
                <select
                  value={licenseForm.plan}
                  onChange={(e) => setLicenseForm({ ...licenseForm, plan: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', backgroundColor: '#fff' }}
                >
                  <option value="Starter">Starter</option>
                  <option value="Professional">Professional</option>
                  <option value="Enterprise">Enterprise</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                  License Expiry Date
                </label>
                <input
                  type="date"
                  value={licenseForm.expiryDate}
                  onChange={(e) => setLicenseForm({ ...licenseForm, expiryDate: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', marginBottom: '0.25rem' }}>
                  Max Vehicles
                </label>
                <input
                  type="number"
                  value={licenseForm.maxVehicles}
                  onChange={(e) => setLicenseForm({ ...licenseForm, maxVehicles: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', marginBottom: '0.25rem' }}>
                  Max Drivers
                </label>
                <input
                  type="number"
                  value={licenseForm.maxDrivers}
                  onChange={(e) => setLicenseForm({ ...licenseForm, maxDrivers: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', marginBottom: '0.25rem' }}>
                  Max Users
                </label>
                <input
                  type="number"
                  value={licenseForm.maxUsers}
                  onChange={(e) => setLicenseForm({ ...licenseForm, maxUsers: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <Button type="button" variant="secondary" onClick={() => { setSelectedCompany(null); setActionType(null); }}>Cancel</Button>
              <Button type="submit" variant="primary">Save Changes</Button>
            </div>
          </form>
        </Modal>
      )}

      {/* MODAL 4: RESET ADMIN PASSWORD */}
      {actionType === 'reset-password' && selectedCompany && (
        <Modal
          isOpen={Boolean(selectedCompany && actionType === 'reset-password')}
          onClose={() => { setSelectedCompany(null); setActionType(null); }}
          title={`Reset Admin Password: ${selectedCompany.name}`}
        >
          <form onSubmit={handleResetPasswordSubmit}>
            <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1rem' }}>
              Set a new secure password for the company administrator account (<strong>{selectedCompany.primaryAdmin?.email || selectedCompany.email}</strong>).
            </p>

            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                New Password (minimum 6 characters) *
              </label>
              <input
                type="text"
                required
                placeholder="Enter new master password"
                value={newAdminPassword}
                onChange={(e) => setNewAdminPassword(e.target.value)}
                style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <Button type="button" variant="secondary" onClick={() => { setSelectedCompany(null); setActionType(null); }}>Cancel</Button>
              <Button type="submit" variant="primary">Update Password</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

export default SuperAdminCompanies;
