// MAK Tours & Travels ERP - Onboard New Vendor Partner
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Truck, Landmark } from 'lucide-react';
import { Card, CardHeader, CardBody } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { useAdminData } from '../../../context/AdminDataContext';
import { vendorCategories } from '../../../data';

export function VendorCreate() {
  const navigate = useNavigate();
  const { addVendor } = useAdminData();

  const [businessName, setBusinessName] = useState('');
  const [name, setName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [category, setCategory] = useState('Fleet Supply Partner');
  const [phone, setPhone] = useState('+91 ');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('Bengaluru');
  const [address, setAddress] = useState('');
  const [gstin, setGstin] = useState('');
  const [agreementExpiry, setAgreementExpiry] = useState('2028-12-31');

  // Bank Info
  const [bankName, setBankName] = useState('HDFC Bank');
  const [accountName, setAccountName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();

    const created = addVendor({
      businessName,
      name: name || businessName,
      contactPerson,
      category,
      phone,
      email,
      city,
      address,
      gstin: gstin ? gstin.toUpperCase() : null,
      agreementExpiry,
      status: 'Active',
      bankDetails: {
        bankName,
        accountName: accountName || businessName,
        accountNumber,
        ifscCode: ifscCode.toUpperCase()
      }
    });

    navigate(`/admin/vendors/${created.id}`);
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
          <Button variant="outline" size="sm" onClick={() => navigate('/admin/vendors')}>
            <ArrowLeft size={16} style={{ marginRight: '0.25rem' }} /> Cancel
          </Button>
          <div>
            <h1 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
              Onboard Vendor Partner
            </h1>
            <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0.25rem 0 0' }}>
              Register coach contractors, attached taxi operators & settlement bank coordinates
            </p>
          </div>
        </div>

        <Button
          type="submit"
          form="create-vendor-form"
          variant="primary"
          style={{ backgroundColor: '#2C3480', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <Save size={16} /> Save Partner
        </Button>
      </div>

      <form id="create-vendor-form" onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
          {/* Business & Category */}
          <Card>
            <CardHeader title="Business Information" subtitle="Commercial trade details" />
            <CardBody style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                  Business / Trading Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Royal South Travels & Coaches"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
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
                  Partner Service Category *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.625rem 0.875rem',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.875rem',
                    backgroundColor: '#fff'
                  }}
                >
                  {vendorCategories.filter((c) => c !== 'All Categories').map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                  Key Contact Person *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. K. Narayanan (Fleet In-Charge)"
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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                    City *
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
                    <option value="Kochi">Kochi</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                    GSTIN
                  </label>
                  <input
                    type="text"
                    placeholder="29AABCR5566K1Z9"
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
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                  Yard / Office Address
                </label>
                <textarea
                  rows={2}
                  placeholder="Plot/Door number, Road, Area..."
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

          {/* Banking Coordinates */}
          <Card>
            <CardHeader title="Settlement Bank Coordinates" subtitle="Payout disbursement details" />
            <CardBody style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                  Bank Name & Branch
                </label>
                <input
                  type="text"
                  placeholder="e.g. ICICI Bank, MG Road Branch"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
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
                  Beneficiary Name on Account
                </label>
                <input
                  type="text"
                  placeholder="As printed on Cheque / Passbook"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
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
                  Bank Account Number
                </label>
                <input
                  type="text"
                  placeholder="e.g. 50200012345678"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.625rem 0.875rem',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.875rem',
                    fontFamily: 'monospace'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                    IFSC Code
                  </label>
                  <input
                    type="text"
                    placeholder="ICIC0000123"
                    value={ifscCode}
                    onChange={(e) => setIfscCode(e.target.value)}
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
                    Agreement Expiry
                  </label>
                  <input
                    type="date"
                    value={agreementExpiry}
                    onChange={(e) => setAgreementExpiry(e.target.value)}
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
        </div>
      </form>
    </div>
  );
}

export default VendorCreate;
