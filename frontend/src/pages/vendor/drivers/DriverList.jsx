// MAK Tours & Travels ERP - Vendor Driver Management List
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UserCheck,
  Plus,
  Search,
  Phone,
  Mail,
  Car,
  Star,
  ShieldCheck,
  AlertTriangle,
  LayoutGrid,
  List,
  Edit,
  Trash2,
  ArrowRight,
  Eye
} from 'lucide-react';
import { Card, CardHeader, CardBody } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { Modal } from '../../../components/ui/Modal';
import { useVendorData } from '../../../context/VendorDataContext';
import { vendorDriverStatuses } from '../../../data/vendorPortalData';

export function DriverList() {
  const navigate = useNavigate();
  const { drivers, deleteDriver } = useVendorData();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('All Statuses');
  const [viewMode, setViewMode] = useState('grid');
  const [deleteModalDriver, setDeleteModalDriver] = useState(null);

  const isLicenseExpiringSoon = (expiryDateStr) => {
    if (!expiryDateStr) return false;
    const diff = (new Date(expiryDateStr) - new Date()) / (1000 * 60 * 60 * 24);
    return diff >= 0 && diff <= 30;
  };

  const filteredDrivers = useMemo(() => {
    return drivers.filter((d) => {
      const matchSearch =
        searchTerm === '' ||
        d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.phone.includes(searchTerm) ||
        d.licenseNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (d.assignedVehicleReg && d.assignedVehicleReg.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchStatus =
        selectedStatus === 'All Statuses' || d.status === selectedStatus;

      return matchSearch && matchStatus;
    });
  }, [drivers, searchTerm, selectedStatus]);

  const handleConfirmDelete = () => {
    if (!deleteModalDriver) return;
    deleteDriver(deleteModalDriver.id);
    setDeleteModalDriver(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Header */}
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
          border: '1px solid #e2e8f0'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <UserCheck size={18} color="#2C3480" />
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#2C3480', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Vendor Driver Roster
            </span>
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
            Driver Management
          </h1>
          <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0.25rem 0 0' }}>
            Track driver assignments, commercial driving licenses, duty status and trip performance ratings
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ display: 'flex', border: '1px solid #cbd5e1', borderRadius: '8px', overflow: 'hidden' }}>
            <button
              onClick={() => setViewMode('grid')}
              style={{
                padding: '0.45rem 0.75rem',
                border: 'none',
                backgroundColor: viewMode === 'grid' ? '#2C3480' : '#ffffff',
                color: viewMode === 'grid' ? '#ffffff' : '#64748b',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                fontSize: '0.8125rem',
                fontWeight: 600
              }}
            >
              <LayoutGrid size={15} /> Cards
            </button>
            <button
              onClick={() => setViewMode('table')}
              style={{
                padding: '0.45rem 0.75rem',
                border: 'none',
                backgroundColor: viewMode === 'table' ? '#2C3480' : '#ffffff',
                color: viewMode === 'table' ? '#ffffff' : '#64748b',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                fontSize: '0.8125rem',
                fontWeight: 600
              }}
            >
              <List size={15} /> Table
            </button>
          </div>

          <Button
            variant="outline"
            onClick={() => navigate('/vendor/drivers/availability')}
          >
            Availability Roster
          </Button>

          <Button
            variant="primary"
            style={{ backgroundColor: '#2C3480' }}
            onClick={() => navigate('/vendor/drivers/new')}
          >
            <Plus size={16} style={{ marginRight: '0.35rem' }} /> Add Driver
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <Card style={{ padding: '1rem 1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ position: 'relative', minWidth: '280px', flex: 1 }}>
            <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input
              type="text"
              placeholder="Search driver by name, phone, license # or assigned vehicle..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
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
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            style={{
              padding: '0.55rem 0.85rem',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              fontSize: '0.875rem',
              backgroundColor: '#fff'
            }}
          >
            {vendorDriverStatuses.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </Card>

      {/* Driver Presentation */}
      {viewMode === 'grid' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(330px, 1fr))', gap: '1.25rem' }}>
          {filteredDrivers.length === 0 ? (
            <div style={{ gridColumn: '1 / -1', padding: '3.5rem 2rem', textAlign: 'center', backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
              <UserCheck size={44} style={{ color: '#cbd5e1', margin: '0 auto 0.75rem' }} />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e293b', margin: '0 0 0.25rem' }}>No drivers found</h3>
              <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>Try clearing your search query or adjusting your filters.</p>
            </div>
          ) : (
            filteredDrivers.map((drv) => {
              const isLicenseExpiring = isLicenseExpiringSoon(drv.licenseExpiry);

              return (
                <div
                  key={drv.id}
                  style={{
                    backgroundColor: '#ffffff',
                    borderRadius: '16px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.04)',
                    padding: '1.25rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.875rem',
                    transition: 'transform 0.2s, box-shadow 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 6px 14px rgba(0,0,0,0.08)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'none';
                    e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.04)';
                  }}
                >
                  {/* Top Bar */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', backgroundColor: '#fef9c3', color: '#a16207', padding: '0.2rem 0.5rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700 }}>
                      <Star size={13} fill="#a16207" /> {drv.rating} Rating
                    </div>
                    <StatusBadge status={drv.status} />
                  </div>

                  {/* Driver Identity */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
                    <div
                      style={{
                        width: '46px',
                        height: '46px',
                        borderRadius: '50%',
                        backgroundColor: '#EEF0FD',
                        color: '#2C3480',
                        fontWeight: 800,
                        fontSize: '1rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}
                    >
                      {drv.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                    </div>
                    <div>
                      <h3
                        onClick={() => navigate(`/vendor/drivers/${drv.id}`)}
                        style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', margin: 0, cursor: 'pointer' }}
                      >
                        {drv.name}
                      </h3>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.78rem', color: '#64748b', marginTop: '0.15rem' }}>
                        <Phone size={12} color="#2C3480" /> {drv.phone}
                      </div>
                    </div>
                  </div>

                  {/* License & Vehicle Box */}
                  <div style={{ backgroundColor: '#f8fafc', padding: '0.75rem 0.85rem', borderRadius: '10px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '0.45rem', fontSize: '0.78rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: '#64748b' }}>License:</span>
                      <span style={{ fontWeight: 700, color: '#0f172a', fontFamily: 'monospace' }}>{drv.licenseNumber}</span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: '#64748b' }}>DL Expiry:</span>
                      <span style={{ fontWeight: 700, color: isLicenseExpiring ? '#DC2626' : '#334155' }}>
                        {drv.licenseExpiry} {isLicenseExpiring && '⚠️ (Renew)'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: '#64748b' }}>Assigned Unit:</span>
                      <span style={{ fontWeight: 700, color: '#2C3480', maxWidth: '170px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {drv.assignedVehicleReg || 'Pool / Unassigned'}
                      </span>
                    </div>
                  </div>

                  {/* Footer */}
                  <div style={{ marginTop: 'auto', paddingTop: '0.75rem', borderTop: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      {drv.completedTrips} Trips Done
                    </span>

                    <div style={{ display: 'flex', gap: '0.35rem' }}>
                      <Button
                        size="sm"
                        variant="primary"
                        style={{ backgroundColor: '#2C3480', fontWeight: 700 }}
                        onClick={() => navigate(`/vendor/drivers/${drv.id}`)}
                      >
                        Profile <ArrowRight size={13} style={{ marginLeft: '0.2rem' }} />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate(`/vendor/drivers/${drv.id}/edit`)}
                      >
                        <Edit size={14} />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        /* Table View */
        <Card>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                  <th style={{ padding: '0.875rem 1rem' }}>Driver Name</th>
                  <th style={{ padding: '0.875rem 1rem' }}>Phone</th>
                  <th style={{ padding: '0.875rem 1rem' }}>License Number</th>
                  <th style={{ padding: '0.875rem 1rem' }}>License Expiry</th>
                  <th style={{ padding: '0.875rem 1rem' }}>Assigned Vehicle</th>
                  <th style={{ padding: '0.875rem 1rem' }}>Status</th>
                  <th style={{ padding: '0.875rem 1rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDrivers.map((d) => (
                  <tr key={d.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '0.875rem 1rem', fontWeight: 700, color: '#0f172a' }}>
                      {d.name}
                    </td>
                    <td style={{ padding: '0.875rem 1rem' }}>{d.phone}</td>
                    <td style={{ padding: '0.875rem 1rem', fontFamily: 'monospace', fontWeight: 600 }}>{d.licenseNumber}</td>
                    <td style={{ padding: '0.875rem 1rem', color: isLicenseExpiringSoon(d.licenseExpiry) ? '#DC2626' : '#475569', fontWeight: isLicenseExpiringSoon(d.licenseExpiry) ? 700 : 500 }}>
                      {d.licenseExpiry}
                    </td>
                    <td style={{ padding: '0.875rem 1rem', color: '#2C3480', fontWeight: 600 }}>
                      {d.assignedVehicleReg || 'Pool'}
                    </td>
                    <td style={{ padding: '0.875rem 1rem' }}>
                      <StatusBadge status={d.status} />
                    </td>
                    <td style={{ padding: '0.875rem 1rem', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
                        <Button size="sm" variant="ghost" onClick={() => navigate(`/vendor/drivers/${d.id}`)}>
                          <Eye size={15} />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => navigate(`/vendor/drivers/${d.id}/edit`)}>
                          <Edit size={15} />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setDeleteModalDriver(d)}>
                          <Trash2 size={15} color="#dc2626" />
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

      {/* Delete Driver Modal */}
      <Modal
        isOpen={Boolean(deleteModalDriver)}
        onClose={() => setDeleteModalDriver(null)}
        title="Archive Driver Record"
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', width: '100%' }}>
            <Button variant="outline" onClick={() => setDeleteModalDriver(null)}>Cancel</Button>
            <Button variant="primary" style={{ backgroundColor: '#dc2626' }} onClick={handleConfirmDelete}>
              Confirm Archive
            </Button>
          </div>
        }
      >
        <p style={{ fontSize: '0.875rem', color: '#475569', margin: 0 }}>
          Are you sure you want to remove <strong>{deleteModalDriver?.name} ({deleteModalDriver?.phone})</strong>? Historical trip rosters will be preserved.
        </p>
      </Modal>
    </div>
  );
}

export default DriverList;
