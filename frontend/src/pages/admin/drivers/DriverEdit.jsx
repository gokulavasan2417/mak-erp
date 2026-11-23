// MAK Tours & Travels ERP - Edit Driver Record
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, UserCheck, AlertCircle } from 'lucide-react';
import { Card, CardHeader, CardBody } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { useAdminData } from '../../../context/AdminDataContext';
import { driverStatuses } from '../../../data';

export function DriverEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { drivers = [], updateDriver, vehicles = [] } = useAdminData();

  const driver = (drivers || []).find(
    (d) => d.id === id || d.driverId === id || d.driverBadgeId === id || d._id === id
  );

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [licenseExpiry, setLicenseExpiry] = useState('');
  const [experienceYears, setExperienceYears] = useState(5);
  const [bloodGroup, setBloodGroup] = useState('B+ve');
  const [address, setAddress] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [status, setStatus] = useState('Available');
  const [perTripRate, setPerTripRate] = useState(1500);

  useEffect(() => {
    if (driver) {
      setName(driver.name || '');
      setPhone(driver.phone || '');
      setEmail(driver.email || '');
      setLicenseNumber(driver.licenseNumber || '');
      setLicenseExpiry(driver.licenseExpiry || '');
      setExperienceYears(driver.experienceYears || 5);
      setBloodGroup(driver.bloodGroup || 'B+ve');
      setAddress(driver.address || '');
      setEmergencyContact(driver.emergencyContact || '');
      setStatus(driver.status || 'Available');
      setPerTripRate(driver.perTripRate || driver.tripRate || driver.salaryStructure?.perTripRate || 1500);
      const matchedVeh = (vehicles || []).find((v) => driver.currentVehicle && driver.currentVehicle.includes(v.regNo));
      if (matchedVeh) setSelectedVehicleId(matchedVeh.id);
    }
  }, [driver, vehicles]);

  if (!driver) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', backgroundColor: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
        <AlertCircle size={48} style={{ color: '#ef4444', margin: '0 auto 1rem' }} />
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>Driver Not Found</h2>
        <p style={{ color: '#64748b', margin: '0.5rem 0 1.5rem' }}>No driver record matches ID: {id}</p>
        <Button variant="primary" onClick={() => navigate('/admin/drivers')} style={{ backgroundColor: '#2C3480' }}>
          Back to Drivers
        </Button>
      </div>
    );
  }

  const handleSubmit = (e) => {
    e.preventDefault();

    const selectedVehicle = vehicles.find((v) => v.id === selectedVehicleId);

    updateDriver(id, {
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
      salaryStructure: {
        ...(driver.salaryStructure || {}),
        perTripRate: Number(perTripRate)
      },
      currentVehicle: selectedVehicle ? `${selectedVehicle.brand} ${selectedVehicle.model} (${selectedVehicle.regNo})` : null
    });

    navigate(`/admin/drivers/${id}`);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: '1000px', margin: '0 auto' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: '#ffffff',
          padding: '1.25rem 1.5rem',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Button variant="outline" size="sm" onClick={() => navigate(`/admin/drivers/${id}`)}>
            <ArrowLeft size={16} style={{ marginRight: '0.25rem' }} /> Cancel
          </Button>
          <div>
            <h1 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
              Edit Driver: {driver.name}
            </h1>
            <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0.25rem 0 0' }}>
              Badge #{driver.driverCode} &bull; Update commercial driving credentials & assignments
            </p>
          </div>
        </div>

        <Button
          type="submit"
          form="edit-driver-form"
          variant="primary"
          style={{ backgroundColor: '#2C3480', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <Save size={16} /> Save Changes
        </Button>
      </div>

      <form id="edit-driver-form" onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
          {/* Personal Details */}
          <Card>
            <CardHeader title="Driver Identity & Contact" subtitle="Primary identification information" />
            <CardBody style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                  Full Legal Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.625rem 0.875rem',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.875rem'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.625rem 0.875rem',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.875rem'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.625rem 0.875rem',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.875rem'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                    Blood Group
                  </label>
                  <select
                    value={bloodGroup}
                    onChange={(e) => setBloodGroup(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.625rem 0.875rem',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.875rem',
                      backgroundColor: '#fff'
                    }}
                  >
                    {['A+ve', 'A-ve', 'B+ve', 'B-ve', 'O+ve', 'O-ve', 'AB+ve', 'AB-ve'].map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                    Experience (Years)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="40"
                    value={experienceYears}
                    onChange={(e) => setExperienceYears(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.625rem 0.875rem',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.875rem'
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                  Emergency Contact (Name & Phone)
                </label>
                <input
                  type="text"
                  value={emergencyContact}
                  onChange={(e) => setEmergencyContact(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.625rem 0.875rem',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.875rem'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                  Residential Address
                </label>
                <textarea
                  rows={2}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.625rem 0.875rem',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.875rem',
                    fontFamily: 'inherit'
                  }}
                />
              </div>
            </CardBody>
          </Card>

          {/* License & Operational Assignment */}
          <Card>
            <CardHeader title="License & Fleet Assignment" subtitle="RTO registration & vehicle status" />
            <CardBody style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                  Commercial License Number *
                </label>
                <input
                  type="text"
                  required
                  value={licenseNumber}
                  onChange={(e) => setLicenseNumber(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.625rem 0.875rem',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.875rem',
                    fontFamily: 'monospace',
                    textTransform: 'uppercase'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                  License Expiry Date *
                </label>
                <input
                  type="date"
                  required
                  value={licenseExpiry}
                  onChange={(e) => setLicenseExpiry(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.625rem 0.875rem',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.875rem'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                  Duty Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.625rem 0.875rem',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.875rem',
                    backgroundColor: '#fff'
                  }}
                >
                  {driverStatuses.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 700, color: '#166534', marginBottom: '0.35rem' }}>
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
                      padding: '0.625rem 0.875rem 0.625rem 1.85rem',
                      borderRadius: '8px',
                      border: '1.5px solid #86EFAC',
                      backgroundColor: '#F0FDF4',
                      fontSize: '0.925rem',
                      fontWeight: 700,
                      color: '#15803D',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                <p style={{ fontSize: '0.75rem', color: '#166534', marginTop: '0.25rem' }}>
                  Auto-populates into bookings when this driver is assigned. (Editable in booking)
                </p>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                  Primary Assigned Vehicle
                </label>
                <select
                  value={selectedVehicleId}
                  onChange={(e) => setSelectedVehicleId(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.625rem 0.875rem',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.875rem',
                    backgroundColor: '#fff'
                  }}
                >
                  <option value="">-- No vehicle assigned (Roving Driver) --</option>
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.brand} {v.model} ({v.regNo}) &bull; {v.category} &bull; Status: {v.status}
                    </option>
                  ))}
                </select>
                <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
                  Assigning a vehicle automatically aligns their daily dispatch log.
                </p>
              </div>

              <div
                style={{
                  backgroundColor: '#f8fafc',
                  border: '1px dashed #cbd5e1',
                  borderRadius: '12px',
                  padding: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  marginTop: '0.5rem'
                }}
              >
                <UserCheck size={28} style={{ color: '#2C3480', flexShrink: 0 }} />
                <div style={{ fontSize: '0.8rem', color: '#475569' }}>
                  Police verification and medical fitness records are securely verified on file for this driver.
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      </form>
    </div>
  );
}

export default DriverEdit;
