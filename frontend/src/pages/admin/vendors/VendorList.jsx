// MAK Tours & Travels ERP - Vendor Directory & Partner Network (Modern Cards Design)
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Truck,
  Building,
  Plus,
  Search,
  Download,
  Eye,
  Edit,
  Phone,
  Mail,
  MapPin,
  IndianRupee,
  ShieldCheck,
  AlertTriangle,
  Car,
  LayoutGrid,
  List,
  ArrowRight,
  Landmark
} from 'lucide-react';
import { Card, CardHeader, CardBody } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { Pagination } from '../../../components/ui/Pagination';
import { useAdminData } from '../../../context/AdminDataContext';
import { vendorCategories, vendorStatuses } from '../../../data';

export function VendorList() {
  const navigate = useNavigate();
  const { vendors, updateVendorStatus } = useAdminData();

  const [viewMode, setViewMode] = useState('grid'); // 'grid' (default modern cards) or 'table'
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  const formatInr = (val) => {
    const num = Number(val);
    return (isNaN(num) ? 0 : num).toLocaleString('en-IN');
  };

  // Filtered vendors
  const filteredVendors = useMemo(() => {
    return (vendors || []).filter((v) => {
      if (!v) return false;
      const bName = v.businessName || v.companyName || v.name || '';
      const cPerson = v.contactPerson || v.ownerName || v.name || '';
      const phone = v.phone || '';
      const email = v.email || '';
      const city = v.city || '';
      const gstin = v.gstin || '';
      const vCode = v.vendorCode || v.vendorId || v.id || '';

      const matchSearch =
        searchTerm === '' ||
        bName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cPerson.toLowerCase().includes(searchTerm.toLowerCase()) ||
        phone.includes(searchTerm) ||
        email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        city.toLowerCase().includes(searchTerm.toLowerCase()) ||
        gstin.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vCode.toLowerCase().includes(searchTerm.toLowerCase());

      const matchCategory =
        categoryFilter === 'All' ||
        categoryFilter === 'All Categories' ||
        v.category === categoryFilter;

      const matchStatus = statusFilter === 'All' || v.status === statusFilter;

      return matchSearch && matchCategory && matchStatus;
    });
  }, [vendors, searchTerm, categoryFilter, statusFilter]);

  // Aggregate metrics
  const totalAttachedFleet = (vendors || []).reduce(
    (sum, v) => sum + Number(v?.attachedVehiclesCount || v?.totalVehiclesAttached || v?.fleetCount || 0),
    0
  );
  const totalPayableOutstanding = (vendors || []).reduce(
    (sum, v) => sum + Number(v?.outstandingBalance || 0),
    0
  );
  const totalInvoiced = (vendors || []).reduce(
    (sum, v) => sum + Number(v?.totalInvoiced || 0),
    0
  );

  const handleExportCSV = () => {
    const headers = ['Vendor ID', 'Code', 'Business Name', 'Category', 'Contact Person', 'Phone', 'City', 'Attached Vehicles', 'Total Invoiced (INR)', 'Outstanding (INR)', 'Status'];
    const rows = filteredVendors.map((v) => [
      v.id,
      v.vendorCode,
      `"${v.businessName}"`,
      v.category,
      `"${v.contactPerson || v.name}"`,
      v.phone,
      v.city,
      v.attachedVehiclesCount,
      v.totalInvoiced,
      v.outstandingBalance,
      v.status
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `MAK_Vendors_${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Header Bar */}
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
            Vendor & Fleet Partner Network
          </h1>
          <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0.25rem 0 0' }}>
            External coach operators, attached vehicle contractors, payout ledgers & partner agreements
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
            onClick={() => navigate('/admin/vendors/new')}
          >
            <Plus size={16} style={{ marginRight: '0.35rem' }} /> Add Vendor Partner
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        <div style={{ backgroundColor: '#ffffff', padding: '1.15rem', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b' }}>TOTAL PARTNERS</span>
            <div style={{ padding: '0.4rem', borderRadius: '8px', backgroundColor: '#eef2ff', color: '#2C3480' }}>
              <Building size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0f172a', marginTop: '0.4rem' }}>
            {vendors.length}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#16a34a', marginTop: '0.25rem' }}>
            {vendors.filter((v) => v.status === 'Active').length} active agreements on file
          </div>
        </div>

        <div style={{ backgroundColor: '#ffffff', padding: '1.15rem', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b' }}>ATTACHED FLEET</span>
            <div style={{ padding: '0.4rem', borderRadius: '8px', backgroundColor: '#eff6ff', color: '#2563eb' }}>
              <Car size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0f172a', marginTop: '0.4rem' }}>
            {totalAttachedFleet}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
            Commercial vehicles supplied
          </div>
        </div>

        <div style={{ backgroundColor: '#ffffff', padding: '1.15rem', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b' }}>GROSS INVOICED</span>
            <div style={{ padding: '0.4rem', borderRadius: '8px', backgroundColor: '#f0fdf4', color: '#16a34a' }}>
              <IndianRupee size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0f172a', marginTop: '0.4rem' }}>
            ₹{formatInr(totalInvoiced)}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
            Cumulative vendor contractor bills
          </div>
        </div>

        <div style={{ backgroundColor: '#ffffff', padding: '1.15rem', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b' }}>OUTSTANDING PAYABLE</span>
            <div style={{ padding: '0.4rem', borderRadius: '8px', backgroundColor: '#fff7ed', color: '#ea580c' }}>
              <AlertTriangle size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#ea580c', marginTop: '0.4rem' }}>
            ₹{formatInr(totalPayableOutstanding)}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
            Pending payment cycles
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <Card>
        <CardBody style={{ padding: '1rem 1.25rem' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', flex: 1, minWidth: '280px' }}>
              <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
                <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input
                  type="text"
                  placeholder="Search partner by company name, contact, phone, city..."
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
                value={categoryFilter}
                onChange={(e) => {
                  setCategoryFilter(e.target.value);
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
                {vendorCategories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
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
                {vendorStatuses.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ fontSize: '0.825rem', color: '#64748b' }}>
              Showing {filteredVendors.length} partners
            </div>
          </div>
        </CardBody>
      </Card>

      {/* VIEW MODE 1: MODERN PARTNER CARDS (DEFAULT) */}
      {viewMode === 'grid' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(330px, 1fr))', gap: '1.25rem' }}>
          {filteredVendors.length === 0 ? (
            <div style={{ gridColumn: '1 / -1', padding: '3rem', textAlign: 'center', backgroundColor: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
              <Truck size={40} style={{ color: '#cbd5e1', margin: '0 auto 0.75rem' }} />
              <p style={{ fontWeight: 600, color: '#334155' }}>No vendor partners match the selected filters.</p>
            </div>
          ) : (
            filteredVendors.map((vnd) => (
              <div
                key={vnd.id}
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
                      fontSize: '0.725rem',
                      fontWeight: 700,
                      padding: '0.2rem 0.55rem',
                      borderRadius: '6px',
                      backgroundColor: '#eef2ff',
                      color: '#2C3480',
                      border: '1px solid #c7d2fe'
                    }}
                  >
                    {vnd.category}
                  </span>

                  <StatusBadge status={vnd.status} />
                </div>

                {/* Main Body */}
                <div style={{ padding: '1.25rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
                    <div
                      style={{
                        width: '50px',
                        height: '50px',
                        borderRadius: '14px',
                        backgroundColor: '#2C3480',
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 800,
                        fontSize: '1.1rem',
                        flexShrink: 0
                      }}
                    >
                      <Truck size={22} />
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h3
                        onClick={() => navigate(`/admin/vendors/${vnd.id}`)}
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
                        {vnd.businessName || vnd.companyName || vnd.name || 'Vendor Partner'}
                      </h3>
                      <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.15rem' }}>
                        {vnd.vendorCode || vnd.vendorId || vnd.id} &bull; {vnd.contactPerson || vnd.ownerName || vnd.name || 'Vendor Admin'}
                      </div>
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', backgroundColor: '#f8fafc', padding: '0.75rem', borderRadius: '10px', border: '1px solid #f1f5f9' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: '#1e293b' }}>
                      <Phone size={13} style={{ color: '#2C3480' }} /> {vnd.phone || 'N/A'}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.775rem', color: '#64748b' }}>
                      <MapPin size={13} style={{ color: '#64748b' }} /> {vnd.city || 'Tamil Nadu'}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.725rem', color: '#64748b' }}>
                      <Landmark size={12} style={{ color: '#16a34a' }} /> Bank NEFT Verified &bull; Exp: {vnd.agreementExpiry || '2028-12-31'}
                    </div>
                  </div>

                  {/* Operational Stats Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: 'auto' }}>
                    <div style={{ padding: '0.5rem 0.65rem', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                      <span style={{ fontSize: '0.675rem', color: '#64748b', display: 'block', fontWeight: 600 }}>
                        ATTACHED FLEET
                      </span>
                      <div style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', marginTop: '0.15rem' }}>
                        {vnd.attachedVehiclesCount ?? vnd.totalVehiclesAttached ?? vnd.fleetCount ?? 0} Units
                      </div>
                    </div>

                    <div style={{ padding: '0.5rem 0.65rem', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                      <span style={{ fontSize: '0.675rem', color: '#64748b', display: 'block', fontWeight: 600 }}>
                        OUTSTANDING DUE
                      </span>
                      <div style={{ fontSize: '0.95rem', fontWeight: 800, color: Number(vnd?.outstandingBalance || 0) > 0 ? '#ea580c' : '#16a34a', marginTop: '0.15rem' }}>
                        {Number(vnd?.outstandingBalance || 0) > 0 ? `₹${formatInr(vnd?.outstandingBalance)}` : 'Settled'}
                      </div>
                    </div>
                  </div>

                  {/* Card Bottom: Total Invoiced & Cobalt Blue CTA */}
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
                        TOTAL INVOICED
                      </span>
                      <span style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>
                        ₹{formatInr(vnd?.totalInvoiced)}
                      </span>
                    </div>

                    <button
                      onClick={() => navigate(`/admin/vendors/${vnd.id}`)}
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
                      Partner Profile <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        /* VIEW MODE 2: MODERN TABLE VIEW */
        <Card>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: '#f8fafc', color: '#475569', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  <th style={{ padding: '0.875rem 1rem' }}>Partner Business</th>
                  <th style={{ padding: '0.875rem 1rem' }}>Category</th>
                  <th style={{ padding: '0.875rem 1rem' }}>Contact & City</th>
                  <th style={{ padding: '0.875rem 1rem', textAlign: 'center' }}>Supplied Vehicles</th>
                  <th style={{ padding: '0.875rem 1rem', textAlign: 'right' }}>Total Invoiced</th>
                  <th style={{ padding: '0.875rem 1rem', textAlign: 'right' }}>Outstanding Due</th>
                  <th style={{ padding: '0.875rem 1rem', textAlign: 'center' }}>Status</th>
                  <th style={{ padding: '0.875rem 1rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredVendors.map((vnd) => (
                  <tr
                    key={vnd.id}
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
                            backgroundColor: '#eef2ff',
                            color: '#2C3480',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            fontSize: '0.85rem',
                            flexShrink: 0
                          }}
                        >
                          <Truck size={18} />
                        </div>
                        <div>
                          <div
                            onClick={() => navigate(`/admin/vendors/${vnd.id}`)}
                            style={{ fontWeight: 700, color: '#0f172a', cursor: 'pointer' }}
                            onMouseEnter={(e) => (e.currentTarget.style.color = '#2C3480')}
                            onMouseLeave={(e) => (e.currentTarget.style.color = '#0f172a')}
                          >
                            {vnd.businessName || vnd.companyName || vnd.name || 'Vendor Partner'}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                            {vnd.vendorCode || vnd.vendorId || vnd.id} &bull; {vnd.id}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td style={{ padding: '0.875rem 1rem' }}>
                      <span
                        style={{
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          padding: '0.2rem 0.5rem',
                          borderRadius: '6px',
                          backgroundColor: '#f1f5f9',
                          color: '#334155'
                        }}
                      >
                        {vnd.category || 'Fleet Supply Partner'}
                      </span>
                    </td>

                    <td style={{ padding: '0.875rem 1rem' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                        <span style={{ fontWeight: 600, color: '#1e293b' }}>{vnd.contactPerson || vnd.ownerName || vnd.name || 'Vendor Admin'}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#64748b', fontSize: '0.775rem' }}>
                          <Phone size={12} /> {vnd.phone || 'N/A'}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#64748b', fontSize: '0.775rem' }}>
                          <MapPin size={12} /> {vnd.city || 'Tamil Nadu'}
                        </div>
                      </div>
                    </td>

                    <td style={{ padding: '0.875rem 1rem', textAlign: 'center' }}>
                      <span style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.95rem' }}>
                        {vnd.attachedVehiclesCount ?? vnd.totalVehiclesAttached ?? vnd.fleetCount ?? 0}
                      </span>
                    </td>

                    <td style={{ padding: '0.875rem 1rem', textAlign: 'right', fontWeight: 600, color: '#0f172a' }}>
                      ₹{formatInr(vnd?.totalInvoiced)}
                    </td>

                    <td style={{ padding: '0.875rem 1rem', textAlign: 'right' }}>
                      {Number(vnd?.outstandingBalance || 0) > 0 ? (
                        <span style={{ fontWeight: 700, color: '#ea580c' }}>
                          ₹{formatInr(vnd?.outstandingBalance)}
                        </span>
                      ) : (
                        <span style={{ color: '#16a34a', fontSize: '0.8rem', fontWeight: 600 }}>Settled</span>
                      )}
                    </td>

                    <td style={{ padding: '0.875rem 1rem', textAlign: 'center' }}>
                      <StatusBadge status={vnd.status} />
                    </td>

                    <td style={{ padding: '0.875rem 1rem', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/admin/vendors/${vnd.id}`)}
                          title="View Vendor Profile"
                          style={{ padding: '0.4rem' }}
                        >
                          <Eye size={15} style={{ color: '#2C3480' }} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/admin/vendors/${vnd.id}/edit`)}
                          title="Edit Vendor"
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

export default VendorList;
