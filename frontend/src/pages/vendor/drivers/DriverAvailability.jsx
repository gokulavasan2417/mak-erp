// MAK Tours & Travels ERP - Vendor Driver Duty Roster & Availability
import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UserCheck,
  Calendar,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Phone,
  AlertCircle
} from 'lucide-react';
import { Card, CardHeader, CardBody } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { useVendorData } from '../../../context/VendorDataContext';

export function DriverAvailability() {
  const navigate = useNavigate();
  const { drivers, updateDriver } = useVendorData();

  const handleToggleLeave = (driver) => {
    const newStatus = driver.status === 'On Leave' ? 'Available' : 'On Leave';
    updateDriver(driver.id, { status: newStatus });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
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
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
            Driver Duty & Leave Roster
          </h1>
          <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0.25rem 0 0' }}>
            Live status of your commercial drivers, active trip dispatches and scheduled leaves
          </p>
        </div>

        <Button
          variant="primary"
          style={{ backgroundColor: '#2C3480' }}
          onClick={() => navigate('/vendor/drivers/new')}
        >
          Add Driver
        </Button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
        {drivers.map((drv) => (
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
              gap: '0.75rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#0f172a' }}>
                {drv.name}
              </div>
              <StatusBadge status={drv.status} />
            </div>

            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
              Phone: <strong>{drv.phone}</strong> &bull; DL: <span style={{ fontFamily: 'monospace' }}>{drv.licenseNumber}</span>
            </div>

            <div style={{ backgroundColor: '#f8fafc', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.8rem' }}>
              <span style={{ color: '#64748b' }}>Assigned Fleet: </span>
              <strong style={{ color: '#2C3480' }}>{drv.assignedVehicleReg || 'Float / Unassigned'}</strong>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', paddingTop: '0.5rem', borderTop: '1px solid #f1f5f9' }}>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                {drv.completedTrips} trips logged
              </span>

              <Button
                size="sm"
                variant={drv.status === 'On Leave' ? 'primary' : 'outline'}
                onClick={() => handleToggleLeave(drv)}
                style={drv.status === 'On Leave' ? { backgroundColor: '#16a34a' } : {}}
              >
                {drv.status === 'On Leave' ? 'End Leave' : 'Mark On Leave'}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default DriverAvailability;
