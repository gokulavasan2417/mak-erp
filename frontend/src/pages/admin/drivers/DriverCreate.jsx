// MAK Tours & Travels ERP - Add Driver to Roster
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, UserCheck } from 'lucide-react';
import { Card, CardHeader, CardBody } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { useAdminData } from '../../../context/AdminDataContext';
import { driverStatuses } from '../../../data';

export function DriverCreate() {
  const navigate = useNavigate();
  const { addDriver, vehicles } = useAdminData();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('+91 ');
  const [email, setEmail] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [licenseExpiry, setLicenseExpiry] = useState('2034-05-15');
  const [experienceYears, setExperienceYears] = useState(8);
  const [bloodGroup, setBloodGroup] = useState('B+ve');
  const [address, setAddress] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [status, setStatus] = useState('Available');
  const [perTripRate, setPerTripRate] = useState(1500);

  const handleSubmit = (e) => {
    e.preventDefault();

    const selectedVehicle = (vehicles || []).find((v) => v.id === selectedVehicleId);

    const created = addDriver({
      name,
      phone,
      email,
      licenseNumber: licenseNumber.toUpperCase(),
      licenseExpiry,
      experienceYears: Number(experienceYears),
      bloodGroup,
      address,
      emergencyContact,
      status,
      perTripRate: Number(perTripRate),
      tripRate: Number(perTripRate),
      salaryStructure: { perTripRate: Number(perTripRate) },
      currentVehicle: selectedVehicle ? `${selectedVehicle.brand} ${selectedVehicle.model} (${selectedVehicle.regNo})` : null,
      scheduleToday: 'On Standby at Dispatch Yard'
    });

    navigate(`/admin/drivers/${created.id}`);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: '1000px', margin: '0 auto' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: 'var(--bg-surface, #ffffff)',
          padding: '1.25rem 1.5rem',
          borderRadius: '16px',
          border: '1px solid var(--border-light, #e2e8f0)',
          boxShadow: 'var(--shadow-sm)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Button variant="ghost" onClick={() => navigate('/admin/drivers')} style={{ padding: '0.5rem' }}>
            <ArrowLeft size={18} />
          </Button>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main, #090d16)', margin: 0 }}>
              Enroll Commercial Driver
            </h1>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted, #64748b)', margin: '0.25rem 0 0' }}>
              Add a new commercial driver to the active duty roster.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <Card>
          <CardHeader title="Driver Personal & Contact Details" subtitle="Full name, emergency contacts, and residential address" />
          <CardBody style={{ padding: '1.25rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.375rem' }}>
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Ramesh Kumar"
                  style={{ width: '100%', padding: '0.625rem 0.75rem', fontSize: '0.8125rem', borderRadius: '8px', border: '1px solid var(--border-medium, #cbd5e1)', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.375rem' }}>
                  Phone Number *
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98450 12345"
                  style={{ width: '100%', padding: '0.625rem 0.75rem', fontSize: '0.8125rem', borderRadius: '8px', border: '1px solid var(--border-medium, #cbd5e1)', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.375rem' }}>
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="driver@maktours.com"
                  style={{ width: '100%', padding: '0.625rem 0.75rem', fontSize: '0.8125rem', borderRadius: '8px', border: '1px solid var(--border-medium, #cbd5e1)', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.375rem' }}>
                  Driving Experience (Years)
                </label>
                <input
                  type="number"
                  min="1"
                  max="40"
                  value={experienceYears}
                  onChange={(e) => setExperienceYears(e.target.value)}
                  style={{ width: '100%', padding: '0.625rem 0.75rem', fontSize: '0.8125rem', borderRadius: '8px', border: '1px solid var(--border-medium, #cbd5e1)', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.375rem' }}>
                  Blood Group
                </label>
                <select
                  value={bloodGroup}
                  onChange={(e) => setBloodGroup(e.target.value)}
                  style={{ width: '100%', padding: '0.625rem 0.75rem', fontSize: '0.8125rem', borderRadius: '8px', border: '1px solid var(--border-medium, #cbd5e1)' }}
                >
                  <option value="A+ve">A+ve</option>
                  <option value="A-ve">A-ve</option>
                  <option value="B+ve">B+ve</option>
                  <option value="B-ve">B-ve</option>
                  <option value="O+ve">O+ve</option>
                  <option value="O-ve">O-ve</option>
                  <option value="AB+ve">AB+ve</option>
                  <option value="AB-ve">AB-ve</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.375rem' }}>
                  Initial Duty Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  style={{ width: '100%', padding: '0.625rem 0.75rem', fontSize: '0.8125rem', borderRadius: '8px', border: '1px solid var(--border-medium, #cbd5e1)' }}
                >
                  {driverStatuses.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#166534', marginBottom: '0.375rem' }}>
                  Standard Per-Trip Rate (₹) *
                </label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', fontWeight: 800, color: '#166534' }}>
                    ₹
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    required
                    value={perTripRate}
                    onChange={(e) => setPerTripRate(Number(e.target.value))}
                    style={{
                      width: '100%',
                      padding: '0.625rem 0.75rem 0.625rem 1.85rem',
                      fontSize: '0.875rem',
                      fontWeight: 700,
                      borderRadius: '8px',
                      border: '1.5px solid #86EFAC',
                      backgroundColor: '#F0FDF4',
                      color: '#15803D',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                <p style={{ fontSize: '0.72rem', color: '#166534', margin: '0.25rem 0 0' }}>
                  Auto-populates to bookings when this driver is assigned. (Editable in booking)
                </p>
              </div>

              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.375rem' }}>
                  Residential Address *
                </label>
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Door No, Street, Area, City & Pincode"
                  style={{ width: '100%', padding: '0.625rem 0.75rem', fontSize: '0.8125rem', borderRadius: '8px', border: '1px solid var(--border-medium, #cbd5e1)', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.375rem' }}>
                  Emergency Contact (Name &amp; Phone) *
                </label>
                <input
                  type="text"
                  required
                  value={emergencyContact}
                  onChange={(e) => setEmergencyContact(e.target.value)}
                  placeholder="e.g. Lakshmi Kumar (Wife) - +91 98450 99881"
                  style={{ width: '100%', padding: '0.625rem 0.75rem', fontSize: '0.8125rem', borderRadius: '8px', border: '1px solid var(--border-medium, #cbd5e1)', boxSizing: 'border-box' }}
                />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Commercial License & Assigned Fleet" subtitle="RTO license validation and primary vehicle allocation" />
          <CardBody style={{ padding: '1.25rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, marginBottom: '0.375rem' }}>
                  Commercial License Number *
                </label>
                <input
                  type="text"
                  required
                  value={licenseNumber}
                  onChange={(e) => setLicenseNumber(e.target.value)}
                  placeholder="e.g. KA-01-20150008892"
                  style={{ width: '100%', padding: '0.625rem 0.75rem', fontSize: '0.8125rem', borderRadius: '8px', border: '1.5px solid var(--color-primary, #2C3480)', boxSizing: 'border-box', fontWeight: 700, textTransform: 'uppercase' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.375rem' }}>
                  License Expiry Date *
                </label>
                <input
                  type="date"
                  required
                  value={licenseExpiry}
                  onChange={(e) => setLicenseExpiry(e.target.value)}
                  style={{ width: '100%', padding: '0.625rem 0.75rem', fontSize: '0.8125rem', borderRadius: '8px', border: '1px solid var(--border-medium, #cbd5e1)', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.375rem' }}>
                  Primary Assigned Vehicle
                </label>
                <select
                  value={selectedVehicleId}
                  onChange={(e) => setSelectedVehicleId(e.target.value)}
                  style={{ width: '100%', padding: '0.625rem 0.75rem', fontSize: '0.8125rem', borderRadius: '8px', border: '1px solid var(--border-medium, #cbd5e1)' }}
                >
                  <option value="">-- No Assigned Vehicle (Standby) --</option>
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>{v.brand} {v.model} ({v.regNo})</option>
                  ))}
                </select>
              </div>
            </div>
          </CardBody>
        </Card>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          <Button variant="ghost" onClick={() => navigate('/admin/drivers')}>Cancel</Button>
          <Button type="submit" variant="primary" leftIcon={<Save size={16} />}>
            Enroll Driver
          </Button>
        </div>
      </form>
    </div>
  );
}

export default DriverCreate;
