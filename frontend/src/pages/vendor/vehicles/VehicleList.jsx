// MAK Tours & Travels ERP - Vendor Vehicle Fleet Management
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Car,
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  Wrench,
  CheckCircle,
  AlertTriangle,
  LayoutGrid,
  List,
  Users,
  Fuel,
  Wind,
  ShieldCheck,
  Calendar,
  ArrowRight,
  MoreVertical,
  CheckCircle2,
  X
} from 'lucide-react';
import { Card, CardHeader, CardBody } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { Modal } from '../../../components/ui/Modal';
import { useVendorData } from '../../../context/VendorDataContext';
import { vendorVehicleCategories, vendorVehicleStatuses } from '../../../data/vendorPortalData';
import { VendorNavTabs, VENDOR_VEHICLE_TABS } from '../../../components/vendor/VendorNavTabs';

export function VehicleList() {
  const navigate = useNavigate();
  const { vehicles, setVehicleMaintenance } = useVendorData();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [selectedStatus, setSelectedStatus] = useState('All Statuses');
  const [acFilter, setAcFilter] = useState('All');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'

  // Maintenance Modal State
  const [maintenanceModalVehicle, setMaintenanceModalVehicle] = useState(null);
  const [maintenanceReason, setMaintenanceReason] = useState('Scheduled Periodic Maintenance');

  // Filtered vehicles
  const filteredVehicles = useMemo(() => {
    return vehicles.filter((v) => {
      const matchSearch =
        searchTerm === '' ||
        v.regNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (v.assignedDriverName && v.assignedDriverName.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchCategory =
        selectedCategory === 'All Categories' || v.category === selectedCategory;
      const matchStatus =
        selectedStatus === 'All Statuses' || v.status === selectedStatus;
      const matchAc =
        acFilter === 'All' || (acFilter === 'AC' ? v.isAC : !v.isAC);

      return matchSearch && matchCategory && matchStatus && matchAc;
    });
  }, [vehicles, searchTerm, selectedCategory, selectedStatus, acFilter]);

  const handleConfirmMaintenance = () => {
    if (!maintenanceModalVehicle) return;
    const isCurrentlyMaintenance = maintenanceModalVehicle.status === 'Maintenance';
    setVehicleMaintenance(
      maintenanceModalVehicle.id,
      !isCurrentlyMaintenance,
      maintenanceReason
    );
    setMaintenanceModalVehicle(null);
  };

  const isDocExpiringSoon = (expiryDateStr) => {
    if (!expiryDateStr) return false;
    const diff = (new Date(expiryDateStr) - new Date()) / (1000 * 60 * 60 * 24);
    return diff >= 0 && diff <= 30;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <VendorNavTabs tabs={VENDOR_VEHICLE_TABS} />
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
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <Car size={18} color="#2C3480" />
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#2C3480', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Vendor Transport Fleet
            </span>
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
            Fleet Vehicle Inventory
          </h1>
          <p style={{ fontSize: '0.8125rem', color: '#64748b', margin: '0.25rem 0 0' }}>
            Manage attached luxury coaches, premium MPVs, SUVs, availability, compliance documents and per-KM rates
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {/* View mode toggle */}
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
            onClick={() => navigate('/vendor/vehicles/availability')}
          >
            <Calendar size={15} style={{ marginRight: '0.35rem' }} /> Availability Calendar
          </Button>

          <Button
            variant="primary"
            style={{ backgroundColor: '#2C3480' }}
            onClick={() => navigate('/vendor/vehicles/new')}
          >
            <Plus size={16} style={{ marginRight: '0.35rem' }} /> Add Vehicle
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <Card style={{ padding: '1rem 1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ position: 'relative', minWidth: '260px', flex: 1 }}>
            <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input
              type="text"
              placeholder="Search by registration number, brand, model or driver..."
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

          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              style={{
                padding: '0.55rem 0.85rem',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '0.875rem',
                backgroundColor: '#fff'
              }}
            >
              <option value="All">All Categories</option>
              {vendorVehicleCategories.filter((c) => c !== 'All' && c !== 'All Categories').map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

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
              {vendorVehicleStatuses.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>

            <select
              value={acFilter}
              onChange={(e) => setAcFilter(e.target.value)}
              style={{
                padding: '0.55rem 0.85rem',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '0.875rem',
                backgroundColor: '#fff'
              }}
            >
              <option value="All">All AC Types</option>
              <option value="AC">AC Vehicles</option>
              <option value="Non-AC">Non-AC</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Vehicles Presentation: Cards Grid View (Default) or Table View */}
      {viewMode === 'grid' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.25rem' }}>
          {filteredVehicles.length === 0 ? (
            <div style={{ gridColumn: '1 / -1', padding: '3.5rem 2rem', textAlign: 'center', backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
              <Car size={44} style={{ color: '#cbd5e1', margin: '0 auto 0.75rem' }} />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e293b', margin: '0 0 0.25rem' }}>No vehicles match your criteria</h3>
              <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>Try clearing your search query or adjusting your filters.</p>
            </div>
          ) : (
            filteredVehicles.map((veh) => {
              const hasExpiringDoc =
                isDocExpiringSoon(veh.documents?.fitnessExpiry) ||
                isDocExpiringSoon(veh.documents?.insuranceExpiry);

              return (
                <div
                  key={veh.id}
                  style={{
                    backgroundColor: '#ffffff',
                    borderRadius: '16px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.04)',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
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
                  {/* Vehicle Image Banner */}
                  <div style={{ position: 'relative', height: '180px', backgroundColor: '#f1f5f9' }}>
                    <img
                      src={(Array.isArray(veh.images) && veh.images[0]) || veh.image || 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=600&q=80'}
                      alt={veh.model}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    {/* Top Badges */}
                    <div style={{ position: 'absolute', top: '0.75rem', left: '0.75rem', display: 'flex', gap: '0.35rem' }}>
                      <span
                        style={{
                          backgroundColor: 'rgba(15, 23, 42, 0.85)',
                          color: '#ffffff',
                          padding: '0.2rem 0.5rem',
                          borderRadius: '6px',
                          fontSize: '0.7rem',
                          fontWeight: 700
                        }}
                      >
                        {veh.category}
                      </span>
                      {veh.isAC && (
                        <span
                          style={{
                            backgroundColor: 'rgba(44, 52, 128, 0.9)',
                            color: '#ffffff',
                            padding: '0.2rem 0.5rem',
                            borderRadius: '6px',
                            fontSize: '0.7rem',
                            fontWeight: 700
                          }}
                        >
                          AC
                        </span>
                      )}
                    </div>

                    <div style={{ position: 'absolute', top: '0.75rem', right: '0.75rem' }}>
                      <StatusBadge status={veh.status} />
                    </div>

                    {hasExpiringDoc && (
                      <div
                        style={{
                          position: 'absolute',
                          bottom: '0.5rem',
                          left: '0.75rem',
                          backgroundColor: '#FEF2F2',
                          color: '#DC2626',
                          border: '1px solid #FECACA',
                          padding: '0.2rem 0.5rem',
                          borderRadius: '6px',
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem'
                        }}
                      >
                        <AlertTriangle size={12} /> Compliance Expiry Warning
                      </div>
                    )}
                  </div>

                  {/* Vehicle Body Content */}
                  <div style={{ padding: '1.25rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#2C3480', fontFamily: 'monospace' }}>
                          {veh.regNo}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                          {veh.manufacturingYear} Model
                        </span>
                      </div>

                      <h3
                        onClick={() => navigate(`/vendor/vehicles/${veh.id}`)}
                        style={{
                          fontSize: '1.1rem',
                          fontWeight: 800,
                          color: '#0f172a',
                          margin: '0.35rem 0 0.15rem',
                          cursor: 'pointer',
                          transition: 'color 0.15s'
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = '#2C3480')}
                        onMouseLeave={(e) => (e.currentTarget.style.color = '#0f172a')}
                      >
                        {veh.brand} {veh.model}
                      </h3>
                      <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                        Color: {veh.color} • Category: {veh.category}
                      </div>
                    </div>

                    {/* Quick Specs Chips */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.4rem', backgroundColor: '#f8fafc', padding: '0.6rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      <div style={{ textAlign: 'center' }}>
                        <span style={{ fontSize: '0.65rem', color: '#64748b', display: 'block' }}>CAPACITY</span>
                        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1e293b' }}>{veh.seatingCapacity} Seats</span>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <span style={{ fontSize: '0.65rem', color: '#64748b', display: 'block' }}>FUEL</span>
                        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1e293b' }}>{veh.fuelType}</span>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <span style={{ fontSize: '0.65rem', color: '#64748b', display: 'block' }}>MIN KM</span>
                        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1e293b', whiteSpace: 'nowrap' }}>
                          {veh.minKmPerDay} km
                        </span>
                      </div>
                    </div>

                    {/* Footer with Rate and Actions */}
                    <div
                      style={{
                        marginTop: 'auto',
                        paddingTop: '0.875rem',
                        borderTop: '1px solid #f1f5f9',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}
                    >
                      <div>
                        <span style={{ fontSize: '0.6875rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block' }}>
                          Per KM Tariff
                        </span>
                        <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
                          ₹{veh.perKmRate} <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 500 }}>/ KM</span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <Button
                          variant="primary"
                          size="sm"
                          style={{ backgroundColor: '#2C3480', fontWeight: 700 }}
                          onClick={() => navigate(`/vendor/vehicles/${veh.id}`)}
                        >
                          Details <ArrowRight size={14} style={{ marginLeft: '0.2rem' }} />
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/vendor/vehicles/${veh.id}/edit`)}
                          title="Edit vehicle"
                        >
                          <Edit size={14} />
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setMaintenanceModalVehicle(veh)}
                          title={veh.status === 'Maintenance' ? 'Complete Maintenance' : 'Mark for Maintenance'}
                          style={{ color: veh.status === 'Maintenance' ? '#16a34a' : '#d97706' }}
                        >
                          <Wrench size={14} />
                        </Button>
                      </div>
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
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  <th style={{ padding: '0.875rem 1rem' }}>Vehicle</th>
                  <th style={{ padding: '0.875rem 1rem' }}>Reg Number</th>
                  <th style={{ padding: '0.875rem 1rem' }}>Category</th>
                  <th style={{ padding: '0.875rem 1rem' }}>Capacity & AC</th>
                  <th style={{ padding: '0.875rem 1rem' }}>Min KM / Day</th>
                  <th style={{ padding: '0.875rem 1rem' }}>Rate / KM</th>
                  <th style={{ padding: '0.875rem 1rem' }}>Status</th>
                  <th style={{ padding: '0.875rem 1rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredVehicles.map((v) => (
                  <tr
                    key={v.id}
                    style={{ borderBottom: '1px solid #f1f5f9' }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <td style={{ padding: '0.875rem 1rem' }}>
                      <div style={{ fontWeight: 700, color: '#0f172a' }}>{v.brand} {v.model}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{v.fuelType} • {v.color}</div>
                    </td>
                    <td style={{ padding: '0.875rem 1rem', fontWeight: 800, color: '#2C3480', fontFamily: 'monospace' }}>
                      {v.regNo}
                    </td>
                    <td style={{ padding: '0.875rem 1rem' }}>
                      <span style={{ backgroundColor: '#f1f5f9', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>
                        {v.category}
                      </span>
                    </td>
                    <td style={{ padding: '0.875rem 1rem' }}>
                      <div>{v.seatingCapacity} Seater</div>
                      <div style={{ fontSize: '0.75rem', color: v.isAC ? '#16a34a' : '#64748b' }}>{v.isAC ? 'Air Conditioned' : 'Non-AC'}</div>
                    </td>
                    <td style={{ padding: '0.875rem 1rem' }}>
                      <div style={{ fontWeight: 600, color: '#0f172a' }}>
                        {v.minKmPerDay} km
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        Bata: ₹{v.driverBata}
                      </div>
                    </td>
                    <td style={{ padding: '0.875rem 1rem', fontWeight: 700, color: '#0f172a' }}>
                      ₹{v.perKmRate}
                    </td>
                    <td style={{ padding: '0.875rem 1rem' }}>
                      <StatusBadge status={v.status} />
                    </td>
                    <td style={{ padding: '0.875rem 1rem', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
                        <Button size="sm" variant="ghost" onClick={() => navigate(`/vendor/vehicles/${v.id}`)}>
                          <Eye size={15} />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => navigate(`/vendor/vehicles/${v.id}/edit`)}>
                          <Edit size={15} />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setMaintenanceModalVehicle(v)}>
                          <Wrench size={15} color={v.status === 'Maintenance' ? '#16a34a' : '#d97706'} />
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

      {/* Maintenance Toggle Modal */}
      <Modal
        isOpen={Boolean(maintenanceModalVehicle)}
        onClose={() => setMaintenanceModalVehicle(null)}
        title={maintenanceModalVehicle?.status === 'Maintenance' ? 'Restore Vehicle to Available Service' : 'Mark Vehicle for Maintenance'}
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', width: '100%' }}>
            <Button variant="outline" onClick={() => setMaintenanceModalVehicle(null)}>Cancel</Button>
            <Button
              variant="primary"
              style={{ backgroundColor: maintenanceModalVehicle?.status === 'Maintenance' ? '#16a34a' : '#dc2626' }}
              onClick={handleConfirmMaintenance}
            >
              {maintenanceModalVehicle?.status === 'Maintenance' ? 'Confirm Service Complete' : 'Move to Maintenance'}
            </Button>
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <p style={{ fontSize: '0.875rem', color: '#475569', margin: 0 }}>
            {maintenanceModalVehicle?.status === 'Maintenance'
              ? `Vehicle ${maintenanceModalVehicle?.regNo} will be restored to 'Available' status and made bookable for new tours.`
              : `Moving ${maintenanceModalVehicle?.regNo} to 'Maintenance' will prevent new bookings from dispatching this unit.`}
          </p>

          {maintenanceModalVehicle?.status !== 'Maintenance' && (
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                Service Reason / Work Order *
              </label>
              <input
                type="text"
                value={maintenanceReason}
                onChange={(e) => setMaintenanceReason(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.55rem 0.75rem',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.875rem'
                }}
              />
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}

export default VehicleList;
