// MAK Tours & Travels ERP - Add Customer / Corporate Account
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Building2, User } from 'lucide-react';
import { Card, CardHeader, CardBody } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { useAdminData } from '../../../context/AdminDataContext';

export function CustomerCreate() {
  const navigate = useNavigate();
  const { addCustomer } = useAdminData();

  const [name, setName] = useState('');
  const [type, setType] = useState('Corporate');
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('+91 ');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('Bengaluru');
  const [address, setAddress] = useState('');
  const [gstin, setGstin] = useState('');
  const [notes, setNotes] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();

    const created = addCustomer({
      name,
      type,
      contactPerson,
      phone,
      email,
      city,
      address,
      gstin: gstin ? gstin.toUpperCase() : null,
      notes,
      totalBookings: 0,
      totalSpent: 0,
      outstandingBalance: 0,
      status: 'Active'
    });

    navigate(`/admin/customers/${created.id}`);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: '960px', margin: '0 auto' }}>
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
          <Button variant="outline" size="sm" onClick={() => navigate('/admin/customers')}>
            <ArrowLeft size={16} style={{ marginRight: '0.25rem' }} /> Cancel
          </Button>
          <div>
            <h1 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
              Add New Customer Account
            </h1>
            <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0.25rem 0 0' }}>
              Create an enterprise corporate profile or individual traveler account
            </p>
          </div>
        </div>

        <Button
          type="submit"
          form="create-customer-form"
          variant="primary"
          style={{ backgroundColor: '#2C3480', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <Save size={16} /> Save Customer
        </Button>
      </div>

      <form id="create-customer-form" onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
          {/* Identity & Contact */}
          <Card>
            <CardHeader title="Account Identity" subtitle="Company or primary traveler name" />
            <CardBody style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                  Account Type *
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <button
                    type="button"
                    onClick={() => setType('Corporate')}
                    style={{
                      padding: '0.75rem',
                      borderRadius: '8px',
                      border: type === 'Corporate' ? '2px solid #2C3480' : '1px solid #cbd5e1',
                      backgroundColor: type === 'Corporate' ? '#eef2ff' : '#fff',
                      color: type === 'Corporate' ? '#2C3480' : '#475569',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      cursor: 'pointer'
                    }}
                  >
                    <Building2 size={16} /> Corporate Company
                  </button>
                  <button
                    type="button"
                    onClick={() => setType('Individual')}
                    style={{
                      padding: '0.75rem',
                      borderRadius: '8px',
                      border: type === 'Individual' ? '2px solid #2C3480' : '1px solid #cbd5e1',
                      backgroundColor: type === 'Individual' ? '#eef2ff' : '#fff',
                      color: type === 'Individual' ? '#2C3480' : '#475569',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      cursor: 'pointer'
                    }}
                  >
                    <User size={16} /> Individual Client
                  </button>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                  {type === 'Corporate' ? 'Company / Business Entity Name *' : 'Client Full Name *'}
                </label>
                <input
                  type="text"
                  required
                  placeholder={type === 'Corporate' ? 'e.g. Wipro Enterprises Mobility' : 'e.g. Rajesh Kannan'}
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

              <div>
                <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                  Contact Person & Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Sunita Rao (Logistics Manager)"
                  value={contactPerson}
                  onChange={(e) => setContactPerson(e.target.value)}
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
            </CardBody>
          </Card>

          {/* Location & Tax Info */}
          <Card>
            <CardHeader title="Billing & Tax Coordinates" subtitle="GSTIN & Address" />
            <CardBody style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                  City / Base Station *
                </label>
                <select
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.625rem 0.875rem',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.875rem',
                    backgroundColor: '#fff'
                  }}
                >
                  <option value="Bengaluru">Bengaluru</option>
                  <option value="Chennai">Chennai</option>
                  <option value="Coimbatore">Coimbatore</option>
                  <option value="Madurai">Madurai</option>
                  <option value="Hyderabad">Hyderabad</option>
                  <option value="Mysuru">Mysuru</option>
                  <option value="Kochi">Kochi</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                  GSTIN (Tax ID)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 29AAACW1234F1Z5"
                  value={gstin}
                  onChange={(e) => setGstin(e.target.value)}
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
                  Complete Billing Address
                </label>
                <textarea
                  rows={2}
                  placeholder="Building, street, tech park, pincode..."
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

              <div>
                <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                  Special Fleet & Dispatch Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Premium vehicles only, English-speaking drivers required..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
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
        </div>
      </form>
    </div>
  );
}

export default CustomerCreate;
