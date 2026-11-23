// MAK Tours & Travels ERP - Vendor Fleet Maintenance Hub
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Wrench,
  Car,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  IndianRupee,
  Plus,
  ArrowLeft,
  Search
} from 'lucide-react';
import { Card, CardHeader, CardBody } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { Modal } from '../../../components/ui/Modal';
import { useVendorData } from '../../../context/VendorDataContext';
import { VendorNavTabs, VENDOR_VEHICLE_TABS } from '../../../components/vendor/VendorNavTabs';

export function VehicleMaintenance() {
  const navigate = useNavigate();
  const { vehicles, setVehicleMaintenance } = useVendorData();

  const maintenanceVehicles = vehicles.filter((v) => v.status === 'Maintenance');
  const activeVehicles = vehicles.filter((v) => v.status !== 'Maintenance');

  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [selectedVehicleId, setSelectedVehicleId] = useState(vehicles[0]?.id || '');
  const [serviceType, setServiceType] = useState('Periodic 40,000 KM Engine Oil & Filter Service');
  const [garageName, setGarageName] = useState('Authorized Dealership Workshop');
  const [estimatedCost, setEstimatedCost] = useState('8500');

  const [completeModalVehicle, setCompleteModalVehicle] = useState(null);

  const handleLogNewService = (e) => {
    e.preventDefault();
    if (!selectedVehicleId) return;
    setVehicleMaintenance(selectedVehicleId, true, `${serviceType} at ${garageName}`);
    setIsLogModalOpen(false);
  };

  const handleCompleteService = () => {
    if (!completeModalVehicle) return;
    setVehicleMaintenance(completeModalVehicle.id, false);
    setCompleteModalVehicle(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <VendorNavTabs tabs={VENDOR_VEHICLE_TABS} />
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
          <button
            onClick={() => navigate('/vendor/vehicles')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              background: 'none',
              border: 'none',
              color: '#64748b',
              fontSize: '0.85rem',
              cursor: 'pointer',
              marginBottom: '0.4rem',
              padding: 0
            }}
          >
            <ArrowLeft size={16} /> Back to Vehicles
          </button>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
            Fleet Maintenance & Workshop Center
          </h1>
          <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0.25rem 0 0' }}>
            Monitor vehicles currently in service, track repair work orders and maintain roadworthiness records
          </p>
        </div>

        <Button
          variant="primary"
          style={{ backgroundColor: '#2C3480' }}
          onClick={() => setIsLogModalOpen(true)}
        >
          <Plus size={16} style={{ marginRight: '0.35rem' }} /> Schedule Maintenance
        </Button>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        <div style={{ backgroundColor: '#ffffff', padding: '1.25rem', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>VEHICLES IN WORKSHOP</span>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: maintenanceVehicles.length > 0 ? '#DC2626' : '#16A34A', marginTop: '0.3rem' }}>
            {maintenanceVehicles.length} Units
          </div>
          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Temporarily off-duty</span>
        </div>

        <div style={{ backgroundColor: '#ffffff', padding: '1.25rem', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>HEALTHY ACTIVE FLEET</span>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#16A34A', marginTop: '0.3rem' }}>
            {activeVehicles.length} / {vehicles.length} Units
          </div>
          <span style={{ fontSize: '0.75rem', color: '#16a34a' }}>Roadworthy & operational</span>
        </div>

        <div style={{ backgroundColor: '#ffffff', padding: '1.25rem', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>MONTHLY SERVICE EXPENSES</span>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', marginTop: '0.3rem' }}>
            ₹38,400
          </div>
          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Lubricants, spares & brake pads</span>
        </div>
      </div>

      {/* Currently in Maintenance - Modern Cards Style */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#090d16', margin: 0 }}>
              Vehicles Currently In Workshop ({maintenanceVehicles.length})
            </h2>
            <p style={{ fontSize: '0.8125rem', color: '#64748b', margin: '0.2rem 0 0' }}>
              Fleet units undergoing scheduled oil service, brake overhaul, or body inspection
            </p>
          </div>
        </div>

        {maintenanceVehicles.length === 0 ? (
          <div style={{ backgroundColor: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '3rem', textAlign: 'center', color: '#64748b' }}>
            <CheckCircle2 size={40} color="#16a34a" style={{ margin: '0 auto 0.5rem' }} />
            <p style={{ fontWeight: 700, color: '#1e293b' }}>All fleet vehicles are active and roadworthy!</p>
            <span style={{ fontSize: '0.85rem' }}>No attached vehicles are currently held in maintenance.</span>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
            {maintenanceVehicles.map((v) => (
              <div
                key={v.id}
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '14px',
                  border: '1px solid #fecaca',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                  padding: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.875rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: '#fee2e2', color: '#b91c1c', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Wrench size={18} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#090d16', margin: 0 }}>
                        {v.brand} {v.model}
                      </h3>
                      <div style={{ fontFamily: 'monospace', fontSize: '0.75rem', fontWeight: 800, color: '#2C3480' }}>
                        {v.regNo}
                      </div>
                    </div>
                  </div>
                  <StatusBadge status="Maintenance" />
                </div>

                <div style={{ backgroundColor: '#fef2f2', borderRadius: '8px', padding: '0.75rem', border: '1px solid #fee2e2' }}>
                  <span style={{ fontSize: '0.6875rem', color: '#991b1b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                    Reported Service / Issue
                  </span>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#7f1d1d', marginTop: '0.15rem' }}>
                    {v.maintenanceReason || 'Periodic scheduled inspection'}
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid #f1f5f9', paddingTop: '0.75rem', marginTop: 'auto' }}>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setCompleteModalVehicle(v)}
                    style={{ color: '#16a34a', borderColor: '#86efac', fontWeight: 700, width: '100%', justifyContent: 'center' }}
                  >
                    <CheckCircle2 size={14} style={{ marginRight: '0.25rem' }} /> Mark Service Complete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Schedule Maintenance Modal */}
      <Modal
        isOpen={isLogModalOpen}
        onClose={() => setIsLogModalOpen(false)}
        title="Schedule Vehicle for Maintenance"
        size="md"
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', width: '100%' }}>
            <Button variant="outline" onClick={() => setIsLogModalOpen(false)}>Cancel</Button>
            <Button
              type="submit"
              form="maintenance-form"
              variant="primary"
              style={{ backgroundColor: '#2C3480' }}
            >
              Post Work Order
            </Button>
          </div>
        }
      >
        <form id="maintenance-form" onSubmit={handleLogNewService} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
              Select Vehicle *
            </label>
            <select
              value={selectedVehicleId}
              onChange={(e) => setSelectedVehicleId(e.target.value)}
              style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.875rem', backgroundColor: '#fff' }}
            >
              {activeVehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.regNo} - {v.brand} {v.model} ({v.status})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
              Service Description / Issue *
            </label>
            <input
              type="text"
              value={serviceType}
              onChange={(e) => setServiceType(e.target.value)}
              required
              style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.875rem' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                Workshop / Service Station
              </label>
              <input
                type="text"
                value={garageName}
                onChange={(e) => setGarageName(e.target.value)}
                style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.875rem' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                Estimated Cost (₹)
              </label>
              <input
                type="number"
                value={estimatedCost}
                onChange={(e) => setEstimatedCost(e.target.value)}
                style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.875rem' }}
              />
            </div>
          </div>
        </form>
      </Modal>

      {/* Complete Maintenance Modal */}
      <Modal
        isOpen={Boolean(completeModalVehicle)}
        onClose={() => setCompleteModalVehicle(null)}
        title="Complete Service & Release Vehicle"
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', width: '100%' }}>
            <Button variant="outline" onClick={() => setCompleteModalVehicle(null)}>Cancel</Button>
            <Button
              variant="primary"
              style={{ backgroundColor: '#16a34a' }}
              onClick={handleCompleteService}
            >
              Confirm Roadworthy & Available
            </Button>
          </div>
        }
      >
        <p style={{ fontSize: '0.875rem', color: '#475569', margin: 0 }}>
          Confirm that <strong>{completeModalVehicle?.regNo} ({completeModalVehicle?.brand} {completeModalVehicle?.model})</strong> has passed all mechanical safety inspections and is ready for dispatch on customer bookings.
        </p>
      </Modal>
    </div>
  );
}

export default VehicleMaintenance;
