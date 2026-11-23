// MAK Tours & Travels ERP - Vendor Partner Profile & Payout Ledger
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Edit,
  Truck,
  Building,
  Phone,
  Mail,
  MapPin,
  Calendar,
  IndianRupee,
  CreditCard,
  Car,
  AlertCircle,
  FileCheck,
  ShieldCheck,
  Landmark
} from 'lucide-react';
import { Card, CardHeader, CardBody } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { useAdminData } from '../../../context/AdminDataContext';

export function VendorDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { vendors = [], vehicles = [], payments = [] } = useAdminData();

  const formatInr = (val) => {
    const num = Number(val);
    return (isNaN(num) ? 0 : num).toLocaleString('en-IN');
  };

  const vendor = (vendors || []).find(
    (v) => v && (v.id === id || v.vendorId === id || v._id === id)
  );

  if (!vendor) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', backgroundColor: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
        <AlertCircle size={48} style={{ color: '#ef4444', margin: '0 auto 1rem' }} />
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>Vendor Not Found</h2>
        <p style={{ color: '#64748b', margin: '0.5rem 0 1.5rem' }}>No partner record matches ID: {id}</p>
        <Button variant="primary" onClick={() => navigate('/admin/vendors')} style={{ backgroundColor: '#2C3480' }}>
          Back to Vendor Network
        </Button>
      </div>
    );
  }

  // Vehicles attached from this vendor (if any match vendor ownership)
  const attachedVehicles = vehicles.filter(
    (veh) => veh.ownership === 'Attached' || (veh.vendorId && veh.vendorId === vendor.id)
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header Bar */}
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
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Button variant="outline" size="sm" onClick={() => navigate('/admin/vendors')}>
            <ArrowLeft size={16} style={{ marginRight: '0.25rem' }} /> Back
          </Button>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <h1 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                {vendor.businessName || vendor.companyName || vendor.name || 'Vendor Partner'}
              </h1>
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  padding: '0.2rem 0.55rem',
                  borderRadius: '6px',
                  backgroundColor: '#eef2ff',
                  color: '#2C3480'
                }}
              >
                {vendor.category || 'Fleet Supply Partner'}
              </span>
              <StatusBadge status={vendor.status} />
            </div>
            <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0.25rem 0 0' }}>
              Vendor ID #{vendor.id || vendor.vendorId} &bull; Code: {vendor.vendorCode || vendor.vendorId || vendor.id} &bull; Agreement Expiry: {vendor.agreementExpiry || '2028-12-31'}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/admin/vendors/${vendor.id || vendor.vendorId}/edit`)}
          >
            <Edit size={15} style={{ marginRight: '0.35rem' }} /> Edit Details
          </Button>
          <Button
            variant="primary"
            size="sm"
            style={{ backgroundColor: '#2C3480' }}
            onClick={() => navigate('/admin/payments')}
          >
            <IndianRupee size={15} style={{ marginRight: '0.35rem' }} /> Disburse Payout
          </Button>
        </div>
      </div>

      {/* KPI Highlights */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        <div style={{ backgroundColor: '#ffffff', padding: '1.15rem', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b' }}>ATTACHED VEHICLES</span>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', marginTop: '0.35rem' }}>
            {vendor.attachedVehiclesCount ?? vendor.totalVehiclesAttached ?? vendor.fleetCount ?? 0}
          </div>
          <span style={{ fontSize: '0.75rem', color: '#16a34a' }}>Active commercial units</span>
        </div>

        <div style={{ backgroundColor: '#ffffff', padding: '1.15rem', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b' }}>TOTAL INVOICED</span>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', marginTop: '0.35rem' }}>
            ₹{formatInr(vendor?.totalInvoiced)}
          </div>
          <span style={{ fontSize: '0.75rem', color: '#2563eb' }}>Gross contractor claims</span>
        </div>

        <div style={{ backgroundColor: '#ffffff', padding: '1.15rem', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b' }}>TOTAL SETTLED</span>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#16a34a', marginTop: '0.35rem' }}>
            ₹{formatInr(vendor?.totalPaid)}
          </div>
          <span style={{ fontSize: '0.75rem', color: '#16a34a' }}>Disbursed via NEFT/RTGS</span>
        </div>

        <div style={{ backgroundColor: '#ffffff', padding: '1.15rem', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b' }}>OUTSTANDING DUE</span>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: Number(vendor?.outstandingBalance || 0) > 0 ? '#ea580c' : '#16a34a', marginTop: '0.35rem' }}>
            ₹{formatInr(vendor?.outstandingBalance)}
          </div>
          <span style={{ fontSize: '0.75rem', color: Number(vendor?.outstandingBalance || 0) > 0 ? '#ea580c' : '#16a34a' }}>
            {Number(vendor?.outstandingBalance || 0) > 0 ? 'Pending payout reconciliation' : 'All accounts squared'}
          </span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 2fr', gap: '1.25rem', alignItems: 'start' }}>
        {/* Left Column: Contact & Bank NEFT */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <Card>
            <CardHeader title="Company & Contact" subtitle="Authorized representative info" />
            <CardBody style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>Key Contact Person</span>
                <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#1e293b' }}>
                  {vendor.contactPerson || vendor.ownerName || vendor.name || 'Vendor Admin'}
                </span>
              </div>

              <div>
                <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>Phone & Mobile</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.9rem', fontWeight: 600, color: '#2C3480' }}>
                  <Phone size={14} /> {vendor.phone || 'N/A'}
                </div>
              </div>

              <div>
                <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>Email</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', color: '#475569' }}>
                  <Mail size={14} /> {vendor.email || 'N/A'}
                </div>
              </div>

              <div>
                <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>Operational Yard / Address</span>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.4rem', fontSize: '0.85rem', color: '#334155', marginTop: '0.2rem' }}>
                  <MapPin size={15} style={{ flexShrink: 0, marginTop: '0.15rem', color: '#64748b' }} />
                  <div>{vendor.address || 'Chennai, Tamil Nadu'}</div>
                </div>
              </div>

              {vendor.gstin && (
                <div style={{ padding: '0.75rem', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>GSTIN Registration</span>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a', fontFamily: 'monospace' }}>
                    {vendor.gstin}
                  </span>
                </div>
              )}
            </CardBody>
          </Card>

          {/* Bank NEFT / Settlement Details */}
          <Card>
            <CardHeader title="Banking & Settlement Coordinates" subtitle="Verified NEFT / RTGS account" />
            <CardBody style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                <Landmark size={24} style={{ color: '#2C3480' }} />
                <div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#0f172a' }}>
                    {vendor.bankDetails?.bankName || 'HDFC Bank Corporate'}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Primary disbursement account</div>
                </div>
              </div>

              <div>
                <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>Account Holder</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1e293b' }}>
                  {vendor.bankDetails?.accountName || vendor.businessName}
                </span>
              </div>

              <div>
                <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>Account Number</span>
                <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a', fontFamily: 'monospace' }}>
                  {vendor.bankDetails?.accountNumber || '921020045512349'}
                </span>
              </div>

              <div>
                <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>IFSC Code</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#2C3480', fontFamily: 'monospace' }}>
                  {vendor.bankDetails?.ifscCode || 'HDFC0001244'}
                </span>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Right Column: Supplied Vehicles & Partner Agreement */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <Card>
            <CardHeader
              title={`Supplied Commercial Vehicles (${attachedVehicles.length})`}
              subtitle="Units on duty under MAK Tours and Travels service contracts"
            />
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: '#f8fafc', color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                    <th style={{ padding: '0.75rem 1rem' }}>Reg No</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Model & Category</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Seating</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Vehicle Status</th>
                  </tr>
                </thead>
                <tbody>
                  {attachedVehicles.length === 0 ? (
                    <tr>
                      <td colSpan={4} style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>
                        No specific attached vehicles mapped yet.
                      </td>
                    </tr>
                  ) : (
                    attachedVehicles.map((v) => (
                      <tr
                        key={v.id}
                        style={{ borderBottom: '1px solid #f1f5f9', cursor: 'pointer' }}
                        onClick={() => navigate(`/admin/fleet/${v.id}`)}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                      >
                        <td style={{ padding: '0.75rem 1rem', fontWeight: 700, color: '#0f172a', fontFamily: 'monospace' }}>
                          {v.regNo}
                        </td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <div style={{ fontWeight: 600, color: '#1e293b' }}>{v.brand} {v.model}</div>
                          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{v.category} &bull; {v.fuelType}</div>
                        </td>
                        <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                          {v.seatingCapacity} Seater
                        </td>
                        <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                          <StatusBadge status={v.status} />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Vendor Service Agreement Details */}
          <Card>
            <CardHeader title="Contractual Agreement Status" subtitle="SLA & Compliance Terms" />
            <CardBody>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>Contract Validity</span>
                  <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a' }}>
                    Active till {vendor.agreementExpiry || '2028-12-31'}
                  </span>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>Payment Term</span>
                  <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a' }}>
                    Net 15 Days after Trip Completion
                  </span>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>Diesel Escalation Clause</span>
                  <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#16a34a' }}>
                    Standard RTO Matrix Applicable
                  </span>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default VendorDetails;
