// MAK Tours & Travels ERP - Customers Directory & Accounts (Modern Cards Design)
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Building2,
  User,
  Plus,
  Search,
  Filter,
  Download,
  Eye,
  Edit,
  Phone,
  Mail,
  MapPin,
  Calendar,
  IndianRupee,
  Star,
  CheckCircle2,
  AlertTriangle,
  LayoutGrid,
  List,
  ArrowRight
} from 'lucide-react';
import { Card, CardHeader, CardBody } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { Pagination } from '../../../components/ui/Pagination';
import { useAdminData } from '../../../context/AdminDataContext';

export function CustomerList() {
  const navigate = useNavigate();
  const { customers = [], bookings = [] } = useAdminData();

  const [viewMode, setViewMode] = useState('grid'); // 'grid' (default modern cards) or 'table'
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  const normalizeDigits = (val) => {
    if (!val) return '';
    const digits = String(val).replace(/\D/g, '');
    if (digits.length === 12 && digits.startsWith('91')) return digits.slice(2);
    if (digits.length === 11 && digits.startsWith('0')) return digits.slice(1);
    return digits.length >= 10 ? digits.slice(-10) : digits;
  };

  // Dynamically enrich customers with live booking metrics & balance
  const enrichedCustomers = useMemo(() => {
    return (customers || []).map((c) => {
      const cCleanPhone = normalizeDigits(c.phone);
      const linkedBookings = (bookings || []).filter((b) => {
        const bCleanPhone = normalizeDigits(b.customerPhone || b.mobileNumber || b.phone);
        if (cCleanPhone && bCleanPhone && cCleanPhone === bCleanPhone) return true;
        if (b.customerId && (b.customerId === c.id || b.customerId === c._id)) return true;
        if (b.customerName && c.name && b.customerName.toLowerCase().includes(c.name.toLowerCase().substring(0, 5))) return true;
        return false;
      });

      if (linkedBookings.length > 0) {
        const liveSpent = linkedBookings.reduce((sum, bk) => sum + Number(bk.totalAmount || bk.fareAmount || bk.fare || bk.pricing || 0), 0);
        const liveOutstanding = linkedBookings.reduce((sum, bk) => {
          const tot = Number(bk.totalAmount || bk.fareAmount || bk.fare || bk.pricing || 0);
          const paid = Number(bk.amountPaid ?? bk.advancePaid ?? 0);
          const bal = bk.balanceAmount !== undefined && bk.balanceAmount !== null && !isNaN(Number(bk.balanceAmount))
            ? Number(bk.balanceAmount)
            : Math.max(0, tot - paid);
          return sum + Math.max(0, bal);
        }, 0);

        return {
          ...c,
          totalBookings: linkedBookings.length,
          totalSpent: liveSpent,
          outstandingBalance: liveOutstanding
        };
      }
      return c;
    });
  }, [customers, bookings]);

  // Filtered & searched customers
  const filteredCustomers = useMemo(() => {
    return enrichedCustomers.filter((cust) => {
      const s = (searchTerm || '').trim().toLowerCase();
      const matchSearch =
        s === '' ||
        String(cust.name || '').toLowerCase().includes(s) ||
        String(cust.phone || '').includes(s) ||
        String(cust.email || '').toLowerCase().includes(s) ||
        String(cust.city || '').toLowerCase().includes(s) ||
        String(cust.gstin || '').toLowerCase().includes(s) ||
        String(cust.id || '').toLowerCase().includes(s);

      const matchType = typeFilter === 'All' || String(cust.type || '').toLowerCase() === typeFilter.toLowerCase();
      const matchStatus = statusFilter === 'All' || String(cust.status || '').toLowerCase() === statusFilter.toLowerCase();

      return matchSearch && matchType && matchStatus;
    });
  }, [enrichedCustomers, searchTerm, typeFilter, statusFilter]);

  // Pagination
  const paginatedCustomers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredCustomers.slice(start, start + pageSize);
  }, [filteredCustomers, currentPage, pageSize]);

  // Aggregate Metrics
  const totalCorporate = enrichedCustomers.filter((c) => c.type === 'Corporate').length;
  const totalIndividual = enrichedCustomers.filter((c) => c.type === 'Individual').length;
  const totalLifetimeRevenue = enrichedCustomers.reduce((sum, c) => sum + (c.totalSpent || 0), 0);
  const totalOutstanding = enrichedCustomers.reduce((sum, c) => sum + (c.outstandingBalance || 0), 0);

  const handleExportCSV = () => {
    const headers = ['ID', 'Customer Name', 'Type', 'Contact Person', 'Phone', 'Email', 'City', 'Bookings', 'Total Spent (INR)', 'Outstanding (INR)', 'Status'];
    const rows = filteredCustomers.map((c) => [
      c.id,
      `"${c.name}"`,
      c.type,
      `"${c.contactPerson || ''}"`,
      c.phone,
      c.email || '',
      c.city,
      c.totalBookings,
      c.totalSpent,
      c.outstandingBalance,
      c.status
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `MAK_Customers_${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Page Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          backgroundColor: '#ffffff',
          padding: '1.25rem 1.5rem',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
            Customer Accounts & CRM
          </h1>
          <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0.25rem 0 0' }}>
            Manage corporate mobility accounts, individual clients, billing ledgers & trip histories
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          {/* View Mode Switcher */}
          <div style={{ display: 'flex', border: '1px solid #cbd5e1', borderRadius: '8px', overflow: 'hidden' }}>
            <button
              onClick={() => setViewMode('grid')}
              title="Modern Cards View"
              style={{
                padding: '0.5rem 0.8rem',
                border: 'none',
                backgroundColor: viewMode === 'grid' ? '#2C3480' : '#ffffff',
                color: viewMode === 'grid' ? '#ffffff' : '#64748b',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                fontSize: '0.8rem',
                fontWeight: 600
              }}
            >
              <LayoutGrid size={15} /> Cards
            </button>
            <button
              onClick={() => setViewMode('table')}
              title="Table View"
              style={{
                padding: '0.5rem 0.8rem',
                border: 'none',
                backgroundColor: viewMode === 'table' ? '#2C3480' : '#ffffff',
                color: viewMode === 'table' ? '#ffffff' : '#64748b',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                fontSize: '0.8rem',
                fontWeight: 600
              }}
            >
              <List size={15} /> Table
            </button>
          </div>

          <Button variant="outline" size="sm" onClick={handleExportCSV}>
            <Download size={15} style={{ marginRight: '0.35rem' }} /> Export CSV
          </Button>
          <Button
            variant="primary"
            style={{ backgroundColor: '#2C3480' }}
            onClick={() => navigate('/admin/customers/new')}
          >
            <Plus size={16} style={{ marginRight: '0.35rem' }} /> Add Customer
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        <div style={{ backgroundColor: '#ffffff', padding: '1.15rem', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b' }}>TOTAL CLIENTS</span>
            <div style={{ padding: '0.4rem', borderRadius: '8px', backgroundColor: '#eef2ff', color: '#2C3480' }}>
              <Users size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0f172a', marginTop: '0.4rem' }}>
            {customers.length}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
            Active clients in CRM database
          </div>
        </div>

        <div style={{ backgroundColor: '#ffffff', padding: '1.15rem', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b' }}>CORPORATE ENTERPRISES</span>
            <div style={{ padding: '0.4rem', borderRadius: '8px', backgroundColor: '#f0fdf4', color: '#16a34a' }}>
              <Building2 size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0f172a', marginTop: '0.4rem' }}>
            {totalCorporate}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
            {totalIndividual} retail individual accounts
          </div>
        </div>

        <div style={{ backgroundColor: '#ffffff', padding: '1.15rem', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b' }}>LIFETIME REVENUE</span>
            <div style={{ padding: '0.4rem', borderRadius: '8px', backgroundColor: '#eff6ff', color: '#2563eb' }}>
              <IndianRupee size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0f172a', marginTop: '0.4rem' }}>
            ₹{Number(totalLifetimeRevenue || 0).toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
            Cumulated customer billings
          </div>
        </div>

        <div style={{ backgroundColor: '#ffffff', padding: '1.15rem', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b' }}>OUTSTANDING BENDINGS</span>
            <div style={{ padding: '0.4rem', borderRadius: '8px', backgroundColor: '#fef2f2', color: '#dc2626' }}>
              <AlertTriangle size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#dc2626', marginTop: '0.4rem' }}>
            ₹{Number(totalOutstanding || 0).toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
            Unsettled corporate balance
          </div>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <Card>
        <CardBody style={{ padding: '1rem 1.25rem' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', flex: 1, minWidth: '280px' }}>
              <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
                <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input
                  type="text"
                  placeholder="Search by client name, mobile, email, city or GSTIN..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  style={{
                    width: '100%',
                    padding: '0.55rem 0.75rem 0.55rem 2.25rem',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.875rem'
                  }}
                />
              </div>

              <select
                value={typeFilter}
                onChange={(e) => {
                  setTypeFilter(e.target.value);
                  setCurrentPage(1);
                }}
                style={{
                  padding: '0.55rem 0.85rem',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.875rem',
                  backgroundColor: '#fff'
                }}
              >
                <option value="All">All Client Types</option>
                <option value="Corporate">Corporate</option>
                <option value="Individual">Individual</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                style={{
                  padding: '0.55rem 0.85rem',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.875rem',
                  backgroundColor: '#fff'
                }}
              >
                <option value="All">All Statuses</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>

            <div style={{ fontSize: '0.825rem', color: '#64748b' }}>
              Showing {filteredCustomers.length} clients
            </div>
          </div>
        </CardBody>
      </Card>

      {/* VIEW MODE 1: MODERN CLIENT CARDS (DEFAULT) */}
      {viewMode === 'grid' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(330px, 1fr))', gap: '1.25rem' }}>
          {filteredCustomers.length === 0 ? (
            <div style={{ gridColumn: '1 / -1', padding: '3rem', textAlign: 'center', backgroundColor: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
              <Users size={40} style={{ color: '#cbd5e1', margin: '0 auto 0.75rem' }} />
              <p style={{ fontWeight: 600, color: '#334155' }}>No customers match the active filters.</p>
            </div>
          ) : (
            filteredCustomers.map((cust) => {
              const isCorporate = cust.type === 'Corporate';

              return (
                <div
                  key={cust.id}
                  style={{
                    backgroundColor: '#ffffff',
                    borderRadius: '16px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 2px 5px rgba(0,0,0,0.04)',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'transform 0.2s, box-shadow 0.2s, border-color 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-3px)';
                    e.currentTarget.style.boxShadow = '0 10px 20px -3px rgba(0,0,0,0.08)';
                    e.currentTarget.style.borderColor = '#cbd5e1';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'none';
                    e.currentTarget.style.boxShadow = '0 2px 5px rgba(0,0,0,0.04)';
                    e.currentTarget.style.borderColor = '#e2e8f0';
                  }}
                >
                  {/* Top Strip */}
                  <div
                    style={{
                      padding: '0.875rem 1.15rem',
                      backgroundColor: '#f8fafc',
                      borderBottom: '1px solid #f1f5f9',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '0.5rem'
                    }}
                  >
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                        fontSize: '0.725rem',
                        fontWeight: 700,
                        padding: '0.2rem 0.55rem',
                        borderRadius: '6px',
                        backgroundColor: isCorporate ? '#eff6ff' : '#f0fdf4',
                        color: isCorporate ? '#1e40af' : '#16a34a',
                        border: isCorporate ? '1px solid #bfdbfe' : '1px solid #bbf7d0'
                      }}
                    >
                      {isCorporate ? <Building2 size={12} /> : <User size={12} />}
                      {cust.type} Account
                    </span>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <StatusBadge status={cust.status} />
                    </div>
                  </div>

                  {/* Main Profile Info */}
                  <div style={{ padding: '1.25rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
                      <div
                        style={{
                          width: '50px',
                          height: '50px',
                          borderRadius: '14px',
                          backgroundColor: isCorporate ? '#2C3480' : '#059669',
                          color: '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 800,
                          fontSize: '1.1rem',
                          flexShrink: 0
                        }}
                      >
                        {cust.name.substring(0, 2).toUpperCase()}
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h3
                          onClick={() => navigate(`/admin/customers/${cust.id}`)}
                          style={{
                            fontSize: '1.05rem',
                            fontWeight: 800,
                            color: '#0f172a',
                            margin: 0,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            cursor: 'pointer'
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.color = '#2C3480')}
                          onMouseLeave={(e) => (e.currentTarget.style.color = '#0f172a')}
                        >
                          {cust.name}
                        </h3>
                        <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.15rem' }}>
                          {cust.id} &bull; {cust.contactPerson || 'Direct Client'}
                        </div>
                      </div>
                    </div>

                    {/* Contact & Location Chips */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', backgroundColor: '#f8fafc', padding: '0.75rem', borderRadius: '10px', border: '1px solid #f1f5f9' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: '#1e293b' }}>
                        <Phone size={13} style={{ color: '#2C3480' }} /> {cust.phone}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.775rem', color: '#64748b' }}>
                        <MapPin size={13} style={{ color: '#64748b' }} /> {cust.city}
                      </div>
                      {cust.gstin && (
                        <div style={{ fontSize: '0.725rem', color: '#64748b', fontFamily: 'monospace', marginTop: '0.1rem' }}>
                          GST: {cust.gstin}
                        </div>
                      )}
                    </div>

                    {/* Operational Stats Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: 'auto' }}>
                      <div style={{ padding: '0.5rem 0.65rem', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                        <span style={{ fontSize: '0.675rem', color: '#64748b', display: 'block', fontWeight: 600 }}>
                          TOTAL TRIPS
                        </span>
                        <div style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', marginTop: '0.15rem' }}>
                          {cust.totalBookings}
                        </div>
                      </div>

                      <div style={{ padding: '0.5rem 0.65rem', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                        <span style={{ fontSize: '0.675rem', color: '#64748b', display: 'block', fontWeight: 600 }}>
                          OUTSTANDING
                        </span>
                        <div style={{ fontSize: '0.95rem', fontWeight: 800, color: (cust.outstandingBalance || 0) > 0 ? '#dc2626' : '#16a34a', marginTop: '0.15rem' }}>
                          {(cust.outstandingBalance || 0) > 0 ? `₹${Number(cust.outstandingBalance || 0).toLocaleString('en-IN')}` : 'Settled'}
                        </div>
                      </div>
                    </div>

                    {/* Card Bottom: Total Billed & Cobalt Blue CTA */}
                    <div
                      style={{
                        paddingTop: '0.875rem',
                        borderTop: '1px solid #f1f5f9',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '0.5rem'
                      }}
                    >
                      <div>
                        <span style={{ fontSize: '0.675rem', color: '#64748b', display: 'block', fontWeight: 500 }}>
                          LIFETIME BILLED
                        </span>
                        <span style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>
                          ₹{Number(cust.totalSpent || 0).toLocaleString('en-IN')}
                        </span>
                      </div>

                      <button
                        onClick={() => navigate(`/admin/customers/${cust.id}`)}
                        style={{
                          backgroundColor: '#2C3480',
                          color: '#ffffff',
                          border: 'none',
                          padding: '0.55rem 0.95rem',
                          borderRadius: '8px',
                          fontWeight: 700,
                          fontSize: '0.825rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                          cursor: 'pointer',
                          transition: 'background-color 0.15s'
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#232a68')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#2C3480')}
                      >
                        View Account <ArrowRight size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        /* VIEW MODE 2: MODERN TABLE VIEW */
        <Card>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: '#f8fafc', color: '#475569', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  <th style={{ padding: '0.875rem 1rem' }}>Client Name</th>
                  <th style={{ padding: '0.875rem 1rem' }}>Contact & City</th>
                  <th style={{ padding: '0.875rem 1rem' }}>Type</th>
                  <th style={{ padding: '0.875rem 1rem', textAlign: 'center' }}>Total Trips</th>
                  <th style={{ padding: '0.875rem 1rem', textAlign: 'right' }}>Total Billed</th>
                  <th style={{ padding: '0.875rem 1rem', textAlign: 'right' }}>Outstanding</th>
                  <th style={{ padding: '0.875rem 1rem', textAlign: 'center' }}>Status</th>
                  <th style={{ padding: '0.875rem 1rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map((cust) => (
                  <tr
                    key={cust.id}
                    style={{
                      borderBottom: '1px solid #f1f5f9',
                      transition: 'background-color 0.15s'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <td style={{ padding: '0.875rem 1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div
                          style={{
                            width: '38px',
                            height: '38px',
                            borderRadius: '10px',
                            backgroundColor: cust.type === 'Corporate' ? '#eef2ff' : '#f0fdf4',
                            color: cust.type === 'Corporate' ? '#2C3480' : '#16a34a',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            fontSize: '0.9rem',
                            flexShrink: 0
                          }}
                        >
                          {cust.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div
                            onClick={() => navigate(`/admin/customers/${cust.id}`)}
                            style={{ fontWeight: 700, color: '#0f172a', cursor: 'pointer', textDecoration: 'none' }}
                            onMouseEnter={(e) => (e.currentTarget.style.color = '#2C3480')}
                            onMouseLeave={(e) => (e.currentTarget.style.color = '#0f172a')}
                          >
                            {cust.name}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                            {cust.id} {cust.gstin ? `• GST: ${cust.gstin}` : ''}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td style={{ padding: '0.875rem 1rem' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                        <span style={{ fontWeight: 500, color: '#1e293b' }}>{cust.contactPerson || cust.name}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#64748b', fontSize: '0.775rem' }}>
                          <Phone size={12} /> {cust.phone}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#64748b', fontSize: '0.775rem' }}>
                          <MapPin size={12} /> {cust.city}
                        </div>
                      </div>
                    </td>

                    <td style={{ padding: '0.875rem 1rem' }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.3rem',
                          padding: '0.2rem 0.55rem',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          backgroundColor: cust.type === 'Corporate' ? '#eff6ff' : '#f8fafc',
                          color: cust.type === 'Corporate' ? '#1e40af' : '#475569',
                          border: cust.type === 'Corporate' ? '1px solid #bfdbfe' : '1px solid #cbd5e1'
                        }}
                      >
                        {cust.type === 'Corporate' ? <Building2 size={12} /> : <User size={12} />}
                        {cust.type}
                      </span>
                    </td>

                    <td style={{ padding: '0.875rem 1rem', textAlign: 'center' }}>
                      <span style={{ fontWeight: 700, color: '#0f172a' }}>{cust.totalBookings}</span>
                    </td>

                    <td style={{ padding: '0.875rem 1rem', textAlign: 'right', fontWeight: 600, color: '#0f172a' }}>
                      ₹{Number(cust.totalSpent || 0).toLocaleString('en-IN')}
                    </td>

                    <td style={{ padding: '0.875rem 1rem', textAlign: 'right' }}>
                      {(cust.outstandingBalance || 0) > 0 ? (
                        <span style={{ fontWeight: 700, color: '#dc2626' }}>
                          ₹{Number(cust.outstandingBalance || 0).toLocaleString('en-IN')}
                        </span>
                      ) : (
                        <span style={{ color: '#16a34a', fontSize: '0.8rem', fontWeight: 600 }}>Settled</span>
                      )}
                    </td>

                    <td style={{ padding: '0.875rem 1rem', textAlign: 'center' }}>
                      <StatusBadge status={cust.status} />
                    </td>

                    <td style={{ padding: '0.875rem 1rem', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/admin/customers/${cust.id}`)}
                          title="View Customer Profile"
                          style={{ padding: '0.4rem' }}
                        >
                          <Eye size={15} style={{ color: '#2C3480' }} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/admin/customers/${cust.id}/edit`)}
                          title="Edit Customer"
                          style={{ padding: '0.4rem' }}
                        >
                          <Edit size={15} style={{ color: '#64748b' }} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

export default CustomerList;
