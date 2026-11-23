import React, { useState } from 'react';
import {
  Building,
  Phone,
  Mail,
  Award,
  Truck,
  ShieldCheck,
  MapPin,
  CreditCard,
  Calendar,
  Star,
  FileText,
  Edit2,
  Check,
  X
} from 'lucide-react';
import { Breadcrumbs } from '../../../components/common/Breadcrumbs';
import { Card, CardHeader, CardBody, CardFooter } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Input } from '../../../components/ui/Input';
import { useVendorData } from '../../../context/VendorDataContext';
import { VendorNavTabs, VENDOR_PROFILE_TABS } from '../../../components/vendor/VendorNavTabs';

export function VendorProfile() {
  const { profile, updateProfile, vehicles, drivers } = useVendorData();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ ...profile });

  const handleSave = (e) => {
    e.preventDefault();
    updateProfile(formData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setFormData({ ...profile });
    setIsEditing(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '1000px', margin: '0 auto' }}>
      <VendorNavTabs tabs={VENDOR_PROFILE_TABS} />
      {/* Header */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
        <div>
          <Breadcrumbs portal="vendor" />
          <h1 style={{ fontSize: '1.625rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '0.25rem' }}>
            Vendor Partner Agency Profile
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Corporate business registration, GSTIN compliance, verified bank settlement mandate, and contract terms.
          </p>
        </div>

        <div>
          {!isEditing ? (
            <Button
              variant="primary"
              size="md"
              leftIcon={<Edit2 size={16} />}
              onClick={() => setIsEditing(true)}
            >
              Edit Profile
            </Button>
          ) : (
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <Button variant="secondary" size="md" leftIcon={<X size={16} />} onClick={handleCancel}>
                Cancel
              </Button>
              <Button variant="primary" size="md" leftIcon={<Check size={16} />} onClick={handleSave}>
                Save Changes
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Hero Agency Card */}
      <Card>
        <CardBody style={{ padding: '1.75rem' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
              <div
                style={{
                  width: '68px',
                  height: '68px',
                  borderRadius: 'var(--radius-lg)',
                  backgroundColor: 'rgba(44, 52, 128, 0.1)',
                  color: '#2C3480',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '1.5rem'
                }}
              >
                <Building size={34} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <h2 style={{ fontSize: '1.375rem', fontWeight: 700, color: 'var(--text-main)' }}>
                    {profile.companyName}
                  </h2>
                  <Badge variant="warning" size="sm">
                    {profile.partnerTier}
                  </Badge>
                  <Badge variant="success" dot size="sm">
                    {profile.status}
                  </Badge>
                </div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                  Vendor ID: <span style={{ fontWeight: 600, color: '#2C3480', fontFamily: 'monospace' }}>{profile.vendorId}</span> &bull; Code: {profile.vendorCode} &bull; Category: {profile.category}
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
              <div style={{ textAlign: 'center', padding: '0.5rem 1rem', borderLeft: '1px solid var(--border-light)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem', color: '#f59e0b', fontWeight: 700, fontSize: '1.125rem' }}>
                  <Star size={16} fill="#f59e0b" /> {profile.rating}
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Quality Score</span>
              </div>
              <div style={{ textAlign: 'center', padding: '0.5rem 1rem', borderLeft: '1px solid var(--border-light)' }}>
                <div style={{ fontWeight: 700, fontSize: '1.125rem', color: 'var(--text-main)' }}>
                  {profile.totalTripsCompleted}+
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Trips Fulfilled</span>
              </div>
              <div style={{ textAlign: 'center', padding: '0.5rem 1rem', borderLeft: '1px solid var(--border-light)' }}>
                <div style={{ fontWeight: 700, fontSize: '1.125rem', color: '#2C3480' }}>
                  {vehicles.length} Units
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Attached Fleet</span>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Main Details Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(440px, 1fr))', gap: '1.5rem' }}>
        {/* Business & Contact Details */}
        <Card>
          <CardHeader
            title="Business & Operations Contact"
            subtitle="Registered corporate credentials and point of contact"
          />
          <CardBody style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {!isEditing ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem', fontSize: '0.875rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.5rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Managing Director / Owner</span>
                  <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{profile.ownerName}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.5rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Primary Telephone</span>
                  <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{profile.phone}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.5rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Alternative Dispatch Phone</span>
                  <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{profile.altPhone}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.5rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Billing Email</span>
                  <span style={{ fontWeight: 600, color: '#2C3480' }}>{profile.email}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.5rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Dispatch Operations Email</span>
                  <span style={{ fontWeight: 600, color: '#2C3480' }}>{profile.dispatchEmail}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.5rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Corporate Office Address</span>
                  <span style={{ fontWeight: 500, color: 'var(--text-main)', textAlign: 'right', maxWidth: '60%' }}>
                    {profile.address}, {profile.city}, {profile.state} - {profile.pincode}
                  </span>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>Company Legal Name</label>
                  <Input value={formData.companyName} onChange={(e) => setFormData({ ...formData, companyName: e.target.value })} />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>Owner / Director Name</label>
                  <Input value={formData.ownerName} onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>Primary Phone</label>
                    <Input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>Alt Phone</label>
                    <Input value={formData.altPhone} onChange={(e) => setFormData({ ...formData, altPhone: e.target.value })} />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>Billing Email</label>
                    <Input value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>Dispatch Email</label>
                    <Input value={formData.dispatchEmail} onChange={(e) => setFormData({ ...formData, dispatchEmail: e.target.value })} />
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>Address Line</label>
                  <Input value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>City</label>
                    <Input value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>State</label>
                    <Input value={formData.state} onChange={(e) => setFormData({ ...formData, state: e.target.value })} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>Pincode</label>
                    <Input value={formData.pincode} onChange={(e) => setFormData({ ...formData, pincode: e.target.value })} />
                  </div>
                </div>
              </div>
            )}
          </CardBody>
        </Card>

        {/* Banking & Statutory Details */}
        <Card>
          <CardHeader
            title="Statutory & Bank Settlement Mandate"
            subtitle="Verified payment routing for direct IMPS/NEFT disbursements"
          />
          <CardBody style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem', fontSize: '0.875rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.5rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>GSTIN Registration</span>
                <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--text-main)' }}>
                  {profile.gstin}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.5rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>PAN Number</span>
                <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--text-main)' }}>
                  {profile.panNumber}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.5rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Beneficiary Account Name</span>
                <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                  {profile.bankDetails.accountName}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.5rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Bank Account Number</span>
                <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#2C3480' }}>
                  {profile.bankDetails.accountNumber}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.5rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Bank & Branch</span>
                <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                  {profile.bankDetails.bankName} ({profile.bankDetails.branch})
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.5rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>IFSC Routing Code</span>
                <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--text-main)' }}>
                  {profile.bankDetails.ifscCode}
                </span>
              </div>
            </div>

            <div
              style={{
                marginTop: '0.5rem',
                padding: '0.75rem 1rem',
                backgroundColor: 'rgba(16, 185, 129, 0.08)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid rgba(16, 185, 129, 0.2)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem'
              }}
            >
              <ShieldCheck size={22} color="#10b981" />
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.8125rem', color: '#065f46' }}>
                  Bank Mandate Verified & Encrypted
                </div>
                <div style={{ fontSize: '0.75rem', color: '#047857' }}>
                  Direct automated payout settlement active under Reserve Bank of India NEFT/RTGS standards.
                </div>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Master Vendor Agreement Terms */}
      <Card>
        <CardHeader
          title="Master Fleet Service Level Agreement (SLA)"
          subtitle="Contractual obligations and platform revenue model terms"
        />
        <CardBody style={{ padding: '1.5rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem', fontSize: '0.875rem' }}>
            <div style={{ padding: '1rem', backgroundColor: 'var(--bg-surface-hover)', borderRadius: 'var(--radius-md)' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', display: 'block' }}>Contract Validity</span>
              <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                {profile.contractStartDate} to {profile.contractExpiryDate}
              </span>
            </div>
            <div style={{ padding: '1rem', backgroundColor: 'var(--bg-surface-hover)', borderRadius: 'var(--radius-md)' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', display: 'block' }}>Platform Commission</span>
              <span style={{ fontWeight: 700, color: '#2C3480' }}>
                {profile.commissionRate} standard platform deduction
              </span>
            </div>
            <div style={{ padding: '1rem', backgroundColor: 'var(--bg-surface-hover)', borderRadius: 'var(--radius-md)' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', display: 'block' }}>Vendor Net Share</span>
              <span style={{ fontWeight: 700, color: '#10b981' }}>
                90% of total booking revenue
              </span>
            </div>
            <div style={{ padding: '1rem', backgroundColor: 'var(--bg-surface-hover)', borderRadius: 'var(--radius-md)' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', display: 'block' }}>Settlement Frequency</span>
              <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                Bi-Weekly (1st & 16th of month)
              </span>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

export default VendorProfile;
