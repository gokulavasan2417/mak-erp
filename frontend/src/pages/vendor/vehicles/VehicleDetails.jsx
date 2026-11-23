// MAK Tours & Travels ERP - Vendor Vehicle Details Page
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Car,
  ArrowLeft,
  Edit,
  Wrench,
  Calendar,
  Users,
  Fuel,
  ShieldCheck,
  AlertTriangle,
  Phone,
  FileText,
  Clock,
  CheckCircle2,
  MapPin,
  Sparkles
} from 'lucide-react';
import { Card, CardHeader, CardBody } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { Modal } from '../../../components/ui/Modal';
import { useVendorData } from '../../../context/VendorDataContext';
import { VendorNavTabs, VENDOR_VEHICLE_TABS } from '../../../components/vendor/VendorNavTabs';

export function VehicleDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { vehicles, drivers, setVehicleMaintenance } = useVendorData();

  const vehicle = vehicles.find((v) => v.id === id) || vehicles[0];
  const assignedDriver = drivers.find((d) => d.id === vehicle?.assignedDriverId);

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [maintenanceModalOpen, setMaintenanceModalOpen] = useState(false);
  const [maintenanceReason, setMaintenanceReason] = useState('Periodic 40,000 KM general service');

  if (!vehicle) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center' }}>
        <h2>Vehicle not found</h2>
        <Button onClick={() => navigate('/vendor/vehicles')}>Back to Fleet</Button>
      </div>
    );
  }

  const isDocExpiringSoon = (expiryDateStr) => {
    if (!expiryDateStr) return false;
    const diff = (new Date(expiryDateStr) - new Date()) / (1000 * 60 * 60 * 24);
    return diff >= 0 && diff <= 30;
  };

  const handleToggleMaintenance = () => {
    const isMaintenance = vehicle.status === 'Maintenance';
    setVehicleMaintenance(vehicle.id, !isMaintenance, maintenanceReason);
    setMaintenanceModalOpen(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '1100px', margin: '0 auto' }}>
      <VendorNavTabs tabs={VENDOR_VEHICLE_TABS} />
      {/* Top Navigation */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
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
            <ArrowLeft size={16} /> Back to Fleet Inventory
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
              {vehicle.brand} {vehicle.model}
            </h1>
            <span
              style={{
                fontFamily: 'monospace',
                fontSize: '0.9rem',
                fontWeight: 800,
                color: '#2C3480',
                backgroundColor: '#EEF0FD',
                padding: '0.2rem 0.6rem',
                borderRadius: '6px'
              }}
            >
              {vehicle.regNo}
            </span>
            <StatusBadge status={vehicle.status} />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Button
            variant="outline"
            onClick={() => setMaintenanceModalOpen(true)}
            style={{ color: vehicle.status === 'Maintenance' ? '#16a34a' : '#d97706' }}
          >
            <Wrench size={15} style={{ marginRight: '0.35rem' }} />
            {vehicle.status === 'Maintenance' ? 'Restore to Service' : 'Schedule Maintenance'}
          </Button>

          <Button
            variant="primary"
            style={{ backgroundColor: '#2C3480' }}
            onClick={() => navigate(`/vendor/vehicles/${vehicle.id}/edit`)}
          >
            <Edit size={15} style={{ marginRight: '0.35rem' }} /> Edit Vehicle
          </Button>
        </div>
      </div>

      {/* Hero Overview Card: Gallery + Key Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 460px) 1fr', gap: '1.5rem', backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '1.5rem' }}>
        {/* Photo Gallery */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ height: '280px', borderRadius: '12px', overflow: 'hidden', backgroundColor: '#f1f5f9', border: '1px solid #e2e8f0' }}>
            <img
              src={vehicle.images?.[activeImageIndex] || vehicle.images?.[0] || vehicle.image || 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=600&q=80'}
              alt={vehicle.model}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>

          {vehicle.images && vehicle.images.length > 1 && (
            <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
              {vehicle.images.map((imgUrl, idx) => (
                <div
                  key={idx}
                  onClick={() => setActiveImageIndex(idx)}
                  style={{
                    width: '64px',
                    height: '50px',
                    borderRadius: '6px',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    border: `2px solid ${activeImageIndex === idx ? '#2C3480' : 'transparent'}`,
                    opacity: activeImageIndex === idx ? 1 : 0.7
                  }}
                >
                  <img src={imgUrl} alt={`Thumb ${idx}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Identity & Key Metrics */}
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, backgroundColor: '#f1f5f9', color: '#334155', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                {vehicle.category}
              </span>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, backgroundColor: vehicle.isAC ? '#dcfce7' : '#f1f5f9', color: vehicle.isAC ? '#15803d' : '#475569', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                {vehicle.isAC ? 'Full Air Conditioning' : 'Non-AC'}
              </span>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, backgroundColor: '#eff6ff', color: '#1d4ed8', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                {vehicle.fuelType}
              </span>
            </div>

            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.25rem' }}>
              {vehicle.brand} {vehicle.model}
            </h2>
            <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>
              Manufacturing Year: {vehicle.manufacturingYear} &bull; Color: {vehicle.color} &bull; Ownership: {vehicle.ownershipType}
            </p>
          </div>

          {/* Quick Metrics Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
            <div style={{ backgroundColor: '#f8fafc', padding: '0.85rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Per KM Tariff</span>
              <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a' }}>
                ₹{vehicle.perKmRate} <span style={{ fontSize: '0.75rem', fontWeight: 500, color: '#64748b' }}>/ KM</span>
              </div>
              <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Min Quota: {vehicle.minKmPerDay} KM/day</span>
            </div>

            <div style={{ backgroundColor: '#f8fafc', padding: '0.85rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Capacity</span>
              <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a' }}>
                {vehicle.seatingCapacity} Passengers
              </div>
              <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Luggage: {vehicle.luggageCapacity || '4 Bags'}</span>
            </div>

            <div style={{ backgroundColor: '#f8fafc', padding: '0.85rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Fuel & Powertrain</span>
              <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a' }}>
                {vehicle.fuelType || 'Diesel'}
              </div>
              <span style={{ fontSize: '0.7rem', color: '#16a34a' }}>GPS AIS-140 Live</span>
            </div>

            <div style={{ backgroundColor: '#f8fafc', padding: '0.85rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Driver Bata</span>
              <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a' }}>
                ₹{vehicle.driverBata} <span style={{ fontSize: '0.75rem', fontWeight: 500, color: '#64748b' }}>/ Day</span>
              </div>
              <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Night Halt: ₹{vehicle.nightCharges}</span>
            </div>
          </div>

          {/* Driver Management Info Box */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.85rem 1rem', borderRadius: '10px', backgroundColor: '#EEF0FD', border: '1px solid #C7CEFA' }}>
            <div>
              <span style={{ fontSize: '0.7rem', color: '#2C3480', fontWeight: 700, textTransform: 'uppercase' }}>Driver Assignment</span>
              <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a', marginTop: '0.15rem' }}>
                Managed Centrally by MAK Admin Operations Desk
              </div>
              <span style={{ fontSize: '0.75rem', color: '#475569' }}>Drivers are dispatched by MAK Admin on confirmed booking schedules</span>
            </div>
            <ShieldCheck size={26} color="#2C3480" />
          </div>
        </div>
      </div>

      {/* Compliance Documents & Expiry Timeline */}
      <Card>
        <CardHeader title="Compliance Documents & Expiry Dates" subtitle="Statutory certificates and validity tracking" />
        <CardBody>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
            {/* RC Book */}
            <div style={{ padding: '1rem', borderRadius: '10px', border: '1px solid #e2e8f0', backgroundColor: '#fcfcfd' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b' }}>RC BOOK</span>
                <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#16a34a', backgroundColor: '#dcfce7', padding: '0.15rem 0.4rem', borderRadius: '4px' }}>
                  {vehicle.documents?.rcStatus || 'Verified'}
                </span>
              </div>
              <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a', margin: '0.4rem 0 0.15rem', fontFamily: 'monospace' }}>
                {vehicle.documents?.rcNumber || vehicle.regNo}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                Valid Until: {vehicle.documents?.rcExpiry || '2039-02-14'}
              </div>
            </div>

            {/* Insurance */}
            <div
              style={{
                padding: '1rem',
                borderRadius: '10px',
                border: `1px solid ${isDocExpiringSoon(vehicle.documents?.insuranceExpiry) ? '#FECACA' : '#e2e8f0'}`,
                backgroundColor: isDocExpiringSoon(vehicle.documents?.insuranceExpiry) ? '#FEF2F2' : '#fcfcfd'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b' }}>COMMERCIAL INSURANCE</span>
                {isDocExpiringSoon(vehicle.documents?.insuranceExpiry) && (
                  <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#DC2626' }}>Expiring Soon</span>
                )}
              </div>
              <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a', margin: '0.4rem 0 0.15rem' }}>
                {vehicle.documents?.insurancePolicy || 'Standard Comprehensive'}
              </div>
              <div style={{ fontSize: '0.75rem', color: isDocExpiringSoon(vehicle.documents?.insuranceExpiry) ? '#DC2626' : '#64748b', fontWeight: isDocExpiringSoon(vehicle.documents?.insuranceExpiry) ? 700 : 500 }}>
                Expiry: {vehicle.documents?.insuranceExpiry || '2027-03-20'}
              </div>
            </div>

            {/* Fitness Certificate */}
            <div
              style={{
                padding: '1rem',
                borderRadius: '10px',
                border: `1px solid ${isDocExpiringSoon(vehicle.documents?.fitnessExpiry) ? '#FECACA' : '#e2e8f0'}`,
                backgroundColor: isDocExpiringSoon(vehicle.documents?.fitnessExpiry) ? '#FEF2F2' : '#fcfcfd'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b' }}>FITNESS CERTIFICATE (FC)</span>
                {isDocExpiringSoon(vehicle.documents?.fitnessExpiry) && (
                  <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#DC2626' }}>Expires &lt; 30 Days</span>
                )}
              </div>
              <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a', margin: '0.4rem 0 0.15rem' }}>
                {vehicle.documents?.fitnessCert || 'Certified'}
              </div>
              <div style={{ fontSize: '0.75rem', color: isDocExpiringSoon(vehicle.documents?.fitnessExpiry) ? '#DC2626' : '#64748b', fontWeight: isDocExpiringSoon(vehicle.documents?.fitnessExpiry) ? 700 : 500 }}>
                Expiry: {vehicle.documents?.fitnessExpiry || '2026-11-28'}
              </div>
            </div>

            {/* Permit */}
            <div style={{ padding: '1rem', borderRadius: '10px', border: '1px solid #e2e8f0', backgroundColor: '#fcfcfd' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b' }}>STATE / NATIONAL PERMIT</span>
                <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#2563eb' }}>All-India</span>
              </div>
              <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a', margin: '0.4rem 0 0.15rem' }}>
                {vehicle.documents?.permitNumber || 'ALL-INDIA-TOURIST'}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                Expiry: {vehicle.documents?.permitExpiry || '2028-01-15'}
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Amenities Section */}
      <Card>
        <CardHeader title="Installed Amenities & Onboard Facilities" subtitle="Verified comfort equipment available on this vehicle" />
        <CardBody>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem' }}>
            {vehicle.amenities && vehicle.amenities.length > 0 ? (
              vehicle.amenities.map((item) => (
                <div
                  key={item}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    padding: '0.4rem 0.75rem',
                    borderRadius: '8px',
                    backgroundColor: '#EEF0FD',
                    color: '#2C3480',
                    fontSize: '0.8rem',
                    fontWeight: 700
                  }}
                >
                  <CheckCircle2 size={14} color="#10B981" /> {item}
                </div>
              ))
            ) : (
              <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Standard amenities configured.</span>
            )}
          </div>
        </CardBody>
      </Card>

      {/* Maintenance Modal */}
      <Modal
        isOpen={maintenanceModalOpen}
        onClose={() => setMaintenanceModalOpen(false)}
        title={vehicle.status === 'Maintenance' ? 'Restore Vehicle to Active Duty' : 'Mark Vehicle for Maintenance'}
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', width: '100%' }}>
            <Button variant="outline" onClick={() => setMaintenanceModalOpen(false)}>Cancel</Button>
            <Button
              variant="primary"
              style={{ backgroundColor: vehicle.status === 'Maintenance' ? '#16a34a' : '#dc2626' }}
              onClick={handleToggleMaintenance}
            >
              {vehicle.status === 'Maintenance' ? 'Confirm Service Complete' : 'Confirm Maintenance'}
            </Button>
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <p style={{ fontSize: '0.875rem', color: '#475569', margin: 0 }}>
            {vehicle.status === 'Maintenance'
              ? `Vehicle ${vehicle.regNo} will be restored to 'Available' status and can be assigned to bookings immediately.`
              : `Moving ${vehicle.regNo} to maintenance will mark it unavailable for new trip allocations.`}
          </p>
          {vehicle.status !== 'Maintenance' && (
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                Service Description / Workshop Note *
              </label>
              <input
                type="text"
                value={maintenanceReason}
                onChange={(e) => setMaintenanceReason(e.target.value)}
                style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.875rem' }}
              />
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}

export default VehicleDetails;
