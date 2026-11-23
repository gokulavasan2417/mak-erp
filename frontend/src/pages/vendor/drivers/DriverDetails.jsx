// MAK Tours & Travels ERP - Vendor Driver Details Page
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  UserCheck,
  ArrowLeft,
  Edit,
  Phone,
  Mail,
  Car,
  Star,
  ShieldCheck,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  MapPin
} from 'lucide-react';
import { Card, CardHeader, CardBody } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { useVendorData } from '../../../context/VendorDataContext';

export function DriverDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { drivers, vehicles } = useVendorData();

  const driver = drivers.find((d) => d.id === id) || drivers[0];
  const assignedVehicle = vehicles.find((v) => v.id === driver?.assignedVehicleId);

  if (!driver) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center' }}>
        <h2>Driver not found</h2>
        <Button onClick={() => navigate('/vendor/drivers')}>Back to Roster</Button>
      </div>
    );
  }

  const isLicenseExpiringSoon = (expiryDateStr) => {
    if (!expiryDateStr) return false;
    const diff = (new Date(expiryDateStr) - new Date()) / (1000 * 60 * 60 * 24);
    return diff >= 0 && diff <= 30;
  };

  const isLicenseExpiring = isLicenseExpiringSoon(driver.licenseExpiry);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '1000px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <button
            onClick={() => navigate('/vendor/drivers')}
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
            <ArrowLeft size={16} /> Back to Drivers
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
              {driver.name}
            </h1>
            <StatusBadge status={driver.status} />
          </div>
        </div>

        <Button
          variant="primary"
          style={{ backgroundColor: '#2C3480' }}
          onClick={() => navigate(`/vendor/drivers/${driver.id}/edit`)}
        >
          <Edit size={15} style={{ marginRight: '0.35rem' }} /> Edit Profile
        </Button>
      </div>

      {/* Main Profile Card */}
      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '1.5rem', backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '1.5rem' }}>
        {/* Avatar & Rating Column */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', borderRight: '1px solid #f1f5f9', paddingRight: '1.5rem' }}>
          <div
            style={{
              width: '90px',
              height: '90px',
              borderRadius: '50%',
              backgroundColor: '#EEF0FD',
              color: '#2C3480',
              fontWeight: 800,
              fontSize: '2rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '0.75rem'
            }}
          >
            {driver.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
          </div>

          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.25rem' }}>
            {driver.name}
          </h3>
          <span style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.75rem' }}>
            Driver ID: {driver.id}
          </span>

          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', backgroundColor: '#fef9c3', color: '#a16207', padding: '0.3rem 0.65rem', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 800, marginBottom: '1rem' }}>
            <Star size={15} fill="#a16207" /> {driver.rating} Star Customer Rating
          </div>

          <a
            href={`tel:${driver.phone}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem',
              width: '100%',
              padding: '0.55rem',
              backgroundColor: '#2C3480',
              color: '#ffffff',
              borderRadius: '8px',
              fontSize: '0.85rem',
              fontWeight: 700,
              textDecoration: 'none'
            }}
          >
            <Phone size={14} /> Call Driver
          </a>
        </div>

        {/* Details Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.875rem' }}>
            <div style={{ backgroundColor: '#f8fafc', padding: '0.85rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>DRIVING LICENSE</span>
              <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', fontFamily: 'monospace', marginTop: '0.2rem' }}>
                {driver.licenseNumber}
              </div>
              <span style={{ fontSize: '0.75rem', color: '#475569' }}>{driver.licenseType}</span>
            </div>

            <div style={{ backgroundColor: isLicenseExpiring ? '#FEF2F2' : '#f8fafc', padding: '0.85rem', borderRadius: '10px', border: `1px solid ${isLicenseExpiring ? '#FECACA' : '#e2e8f0'}` }}>
              <span style={{ fontSize: '0.7rem', color: isLicenseExpiring ? '#DC2626' : '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                DL VALIDITY EXPIRY
              </span>
              <div style={{ fontSize: '1.05rem', fontWeight: 800, color: isLicenseExpiring ? '#DC2626' : '#0f172a', marginTop: '0.2rem' }}>
                {driver.licenseExpiry}
              </div>
              <span style={{ fontSize: '0.75rem', color: isLicenseExpiring ? '#DC2626' : '#16a34a', fontWeight: 600 }}>
                {isLicenseExpiring ? '⚠️ Expiring within 30 days' : 'Active Commercial License'}
              </span>
            </div>

            <div style={{ backgroundColor: '#f8fafc', padding: '0.85rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>COMPLETED TRIPS</span>
              <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a', marginTop: '0.2rem' }}>
                {driver.completedTrips} Trips
              </div>
              <span style={{ fontSize: '0.75rem', color: '#16a34a' }}>Zero accident history</span>
            </div>
          </div>

          {/* Assigned Vehicle */}
          <div style={{ padding: '1rem', borderRadius: '10px', backgroundColor: '#EEF0FD', border: '1px solid #C7CEFA', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <span style={{ fontSize: '0.7rem', color: '#2C3480', fontWeight: 700, textTransform: 'uppercase' }}>DEDICATED FLEET VEHICLE</span>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>
                {assignedVehicle ? `${assignedVehicle.brand} ${assignedVehicle.model} (${assignedVehicle.regNo})` : driver.assignedVehicleReg || 'Pool Driver'}
              </div>
              {assignedVehicle && (
                <span style={{ fontSize: '0.75rem', color: '#475569' }}>Category: {assignedVehicle.category} &bull; Capacity: {assignedVehicle.seatingCapacity} Seater</span>
              )}
            </div>

            {assignedVehicle && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/vendor/vehicles/${assignedVehicle.id}`)}
              >
                View Vehicle →
              </Button>
            )}
          </div>

          {/* Contact and Emergency details */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.85rem' }}>
            <div>
              <span style={{ color: '#64748b', display: 'block', fontSize: '0.75rem', fontWeight: 700 }}>EMERGENCY CONTACT</span>
              <span style={{ fontWeight: 600, color: '#1e293b' }}>{driver.emergencyContact || 'Family contact on file'}</span>
            </div>
            <div>
              <span style={{ color: '#64748b', display: 'block', fontSize: '0.75rem', fontWeight: 700 }}>RESIDENTIAL ADDRESS</span>
              <span style={{ fontWeight: 600, color: '#1e293b' }}>{driver.address || 'Chennai Depot Roster'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DriverDetails;
