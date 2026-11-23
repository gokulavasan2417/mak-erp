// MAK Tours & Travels ERP - Vendor Add Driver
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UserCheck,
  ArrowLeft,
  CheckCircle,
  Phone,
  ShieldCheck,
  Car
} from 'lucide-react';
import { Card, CardHeader, CardBody } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { useVendorData } from '../../../context/VendorDataContext';

export function AddDriver() {
  const navigate = useNavigate();
  const { addDriver, vehicles } = useVendorData();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [altPhone, setAltPhone] = useState('');
  const [email, setEmail] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [licenseExpiry, setLicenseExpiry] = useState('2028-12-31');
  const [licenseType, setLicenseType] = useState('Commercial Transport (HMV/LMV)');
  const [assignedVehicleId, setAssignedVehicleId] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [address, setAddress] = useState('');
  const [status, setStatus] = useState('Available');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name || !phone || !licenseNumber) {
      alert('Please fill in Driver Name, Phone Number, and License Number');
      return;
    }

    const assignedVeh = vehicles.find((v) => v.id === assignedVehicleId);

    addDriver({
      name,
      phone,
      altPhone,
      email: email || `${name.toLowerCase().replace(/\s+/g, '.')}@apexfleet.in`,
      licenseNumber: licenseNumber.toUpperCase(),
      licenseExpiry,
      licenseType,
      assignedVehicleId,
      assignedVehicleReg: assignedVeh ? `${assignedVeh.regNo} (${assignedVeh.brand} ${assignedVeh.model})` : 'Unassigned',
      emergencyContact,
      address,
      status
    });

    navigate('/vendor/drivers');
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '850px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <button
            type="button"
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
              marginBottom: '0.5rem',
              padding: 0
            }}
          >
            <ArrowLeft size={16} /> Back to Drivers
          </button>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
            Onboard Commercial Driver
          </h1>
          <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0.25rem 0 0' }}>
            Register verified driver identity, driving license credentials and vehicle assignment
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Button type="button" variant="outline" onClick={() => navigate('/vendor/drivers')}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" style={{ backgroundColor: '#2C3480', fontWeight: 700 }}>
            <CheckCircle size={16} style={{ marginRight: '0.35rem' }} /> Save Driver
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader title="1. Personal & Contact Information" subtitle="Full legal name and phone coordinates" />
        <CardBody style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                Full Name *
              </label>
              <input
                type="text"
                placeholder="e.g. M. Selvam"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.875rem' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                Primary Mobile Number *
              </label>
              <input
                type="text"
                placeholder="+91 97890 12345"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.875rem' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                Alternate Phone Number
              </label>
              <input
                type="text"
                placeholder="+91 97890 99887"
                value={altPhone}
                onChange={(e) => setAltPhone(e.target.value)}
                style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.875rem' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                Emergency Contact Person & Phone
              </label>
              <input
                type="text"
                placeholder="e.g. S. Rani (Wife) - +91 98400 11223"
                value={emergencyContact}
                onChange={(e) => setEmergencyContact(e.target.value)}
                style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.875rem' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                Residential Address
              </label>
              <input
                type="text"
                placeholder="Street, City, Pincode"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.875rem' }}
              />
            </div>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="2. Commercial Driving License & Fleet Assignment" subtitle="Official licensing credentials and vehicle pairing" />
        <CardBody style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                Driving License Number (DL) *
              </label>
              <input
                type="text"
                placeholder="e.g. TN09-20150008892"
                value={licenseNumber}
                onChange={(e) => setLicenseNumber(e.target.value)}
                required
                style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.875rem', textTransform: 'uppercase', fontFamily: 'monospace', fontWeight: 700 }}
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
                License Category
              </label>
              <select
                value={licenseType}
                onChange={(e) => setLicenseType(e.target.value)}
                style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.875rem', backgroundColor: '#fff' }}
              >
                <option value="Commercial Transport (HMV/LMV)">Commercial Transport (HMV/LMV)</option>
                <option value="Heavy Passenger Vehicle (HPV)">Heavy Passenger Vehicle (HPV)</option>
                <option value="Commercial LMV">Commercial LMV</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                Pair to Attached Fleet Vehicle
              </label>
              <select
                value={assignedVehicleId}
                onChange={(e) => setAssignedVehicleId(e.target.value)}
                style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.875rem', backgroundColor: '#fff' }}
              >
                <option value="">-- No vehicle (Float Driver) --</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.regNo} - {v.brand} {v.model} ({v.category})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                Initial Duty Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.875rem', backgroundColor: '#fff' }}
              >
                <option value="Available">Available for Dispatch</option>
                <option value="Assigned">Assigned to Vehicle</option>
                <option value="On Leave">On Leave</option>
              </select>
            </div>
          </div>
        </CardBody>
      </Card>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', paddingBottom: '2rem' }}>
        <Button type="button" variant="outline" onClick={() => navigate('/vendor/drivers')}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" style={{ backgroundColor: '#2C3480', fontWeight: 700, padding: '0.65rem 1.75rem' }}>
          <CheckCircle size={16} style={{ marginRight: '0.35rem' }} /> Complete Driver Registration
        </Button>
      </div>
    </form>
  );
}

export default AddDriver;
