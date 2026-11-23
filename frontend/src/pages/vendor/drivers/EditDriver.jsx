// MAK Tours & Travels ERP - Edit Vendor Driver
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  UserCheck,
  ArrowLeft,
  CheckCircle
} from 'lucide-react';
import { Card, CardHeader, CardBody } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { useVendorData } from '../../../context/VendorDataContext';

export function EditDriver() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { drivers, updateDriver, vehicles } = useVendorData();

  const driver = drivers.find((d) => d.id === id) || drivers[0];

  const [name, setName] = useState(driver?.name || '');
  const [phone, setPhone] = useState(driver?.phone || '');
  const [altPhone, setAltPhone] = useState(driver?.altPhone || '');
  const [email, setEmail] = useState(driver?.email || '');
  const [licenseNumber, setLicenseNumber] = useState(driver?.licenseNumber || '');
  const [licenseExpiry, setLicenseExpiry] = useState(driver?.licenseExpiry || '2028-12-31');
  const [licenseType, setLicenseType] = useState(driver?.licenseType || 'Commercial Transport');
  const [assignedVehicleId, setAssignedVehicleId] = useState(driver?.assignedVehicleId || '');
  const [emergencyContact, setEmergencyContact] = useState(driver?.emergencyContact || '');
  const [address, setAddress] = useState(driver?.address || '');
  const [status, setStatus] = useState(driver?.status || 'Available');

  const handleSubmit = (e) => {
    e.preventDefault();
    const assignedVeh = vehicles.find((v) => v.id === assignedVehicleId);

    updateDriver(driver.id, {
      name,
      phone,
      altPhone,
      email,
      licenseNumber: licenseNumber.toUpperCase(),
      licenseExpiry,
      licenseType,
      assignedVehicleId,
      assignedVehicleReg: assignedVeh ? `${assignedVeh.regNo} (${assignedVeh.brand} ${assignedVeh.model})` : 'Unassigned',
      emergencyContact,
      address,
      status
    });

    navigate(`/vendor/drivers/${driver.id}`);
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '850px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <button
            type="button"
            onClick={() => navigate(`/vendor/drivers/${driver.id}`)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              background: 'none',
              border: 'none',
              color: '#64748b',
              fontSize: '0.85rem',
              cursor: 'pointer',
              marginBottom: '0.5rem',
              padding: 0
            }}
          >
            <ArrowLeft size={16} /> Back to Profile
          </button>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
            Edit Driver Profile: {driver.name}
          </h1>
          <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0.25rem 0 0' }}>
            Update contact details, driving license validity and paired vehicle
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Button type="button" variant="outline" onClick={() => navigate(`/vendor/drivers/${driver.id}`)}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" style={{ backgroundColor: '#2C3480', fontWeight: 700 }}>
            <CheckCircle size={16} style={{ marginRight: '0.35rem' }} /> Save Changes
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader title="Contact & Licensing Information" />
        <CardBody style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                Full Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.875rem' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                Phone Number *
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.875rem' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                Duty Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.875rem', backgroundColor: '#fff' }}
              >
                <option value="Available">Available</option>
                <option value="Assigned">Assigned</option>
                <option value="On Trip">On Trip</option>
                <option value="On Leave">On Leave</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                Driving License Number (DL) *
              </label>
              <input
                type="text"
                value={licenseNumber}
                onChange={(e) => setLicenseNumber(e.target.value)}
                required
                style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.875rem', fontWeight: 700, fontFamily: 'monospace' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                License Expiry Date *
              </label>
              <input
                type="date"
                value={licenseExpiry}
                onChange={(e) => setLicenseExpiry(e.target.value)}
                required
                style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.875rem' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                Assigned Vehicle
              </label>
              <select
                value={assignedVehicleId}
                onChange={(e) => setAssignedVehicleId(e.target.value)}
                style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.875rem', backgroundColor: '#fff' }}
              >
                <option value="">-- No vehicle (Float Driver) --</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.regNo} - {v.brand} {v.model}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardBody>
      </Card>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', paddingBottom: '2rem' }}>
        <Button type="button" variant="outline" onClick={() => navigate(`/vendor/drivers/${driver.id}`)}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" style={{ backgroundColor: '#2C3480', fontWeight: 700 }}>
          <CheckCircle size={16} style={{ marginRight: '0.35rem' }} /> Update Driver Profile
        </Button>
      </div>
    </form>
  );
}

export default EditDriver;
