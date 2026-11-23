import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Compass,
  ArrowLeft,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  FileQuestion,
  Search,
  UploadCloud,
  FileText,
  UserCheck,
  ShieldCheck,
  PhoneCall,
  ExternalLink,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { useDriverData } from '../../context/DriverDataContext';

export function DriverApplicationStatus() {
  const navigate = useNavigate();
  const {
    applications,
    currentAppId,
    setCurrentAppId,
    simulateApplicationStatusChange
  } = useDriverData();

  const [searchId, setSearchId] = useState(currentAppId || 'APP-2026-002');
  const [isUpdateDocModalOpen, setIsUpdateDocModalOpen] = useState(false);
  const [updatedDocFile, setUpdatedDocFile] = useState(null);

  const application =
    applications.find((a) => a.id.toLowerCase() === searchId.trim().toLowerCase()) ||
    applications[0];

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchId.trim()) {
      setCurrentAppId(searchId.trim());
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Pending Verification':
        return <Badge variant="warning" dot size="md">Pending Verification</Badge>;
      case 'Under Review':
        return <Badge variant="info" dot size="md">Under Review</Badge>;
      case 'Approved':
        return <Badge variant="success" dot size="md">Approved</Badge>;
      case 'Rejected':
        return <Badge variant="danger" dot size="md">Rejected</Badge>;
      case 'Documents Required':
        return <Badge variant="warning" dot size="md">Documents Required</Badge>;
      default:
        return <Badge variant="default" size="md">{status}</Badge>;
    }
  };

  const maskLicenseNumber = (license) => {
    if (!license) return 'TN-**-****-****';
    const parts = license.split('-');
    if (parts.length >= 3) {
      return `${parts[0]}-${parts[1]}-****-${parts.slice(3).join('-') || '****'}`;
    }
    return license.substring(0, 5) + '******' + license.slice(-4);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#f8fafc',
        padding: '2rem 1rem'
      }}
    >
      <div style={{ maxWidth: '850px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/driver/login')}
            >
              <ArrowLeft size={16} />
            </Button>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Compass size={22} color="#2C3480" />
                <h1 style={{ fontSize: '1.375rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  Application Verification Status
                </h1>
              </div>
              <p style={{ fontSize: '0.8125rem', color: '#64748b', margin: '0.15rem 0 0 0' }}>
                Track real-time RTO and commercial transport badge clearance by MAK Admin Operations Desk.
              </p>
            </div>
          </div>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate('/driver/register')}
          >
            New Registration
          </Button>
        </div>

        {/* Search Bar */}
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            padding: '1rem 1.25rem',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            flexWrap: 'wrap'
          }}
        >
          <form onSubmit={handleSearch} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
            <div style={{ flex: 1, minWidth: '220px' }}>
              <Input
                placeholder="Enter Application ID (e.g. APP-2026-002)..."
                value={searchId}
                onChange={(e) => setSearchId(e.target.value)}
                leftIcon={<Search size={16} color="#64748b" />}
              />
            </div>
            <Button type="submit" variant="primary" size="sm" style={{ backgroundColor: '#2C3480', borderColor: '#2C3480' }}>
              Check Status
            </Button>
          </form>

          {/* Quick Switch Demo Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Demo IDs:</span>
            {applications.slice(0, 5).map((app) => (
              <button
                key={app.id}
                type="button"
                onClick={() => {
                  setSearchId(app.id);
                  setCurrentAppId(app.id);
                }}
                style={{
                  padding: '0.2rem 0.5rem',
                  borderRadius: '4px',
                  border: application?.id === app.id ? '1px solid #2C3480' : '1px solid #cbd5e1',
                  backgroundColor: application?.id === app.id ? '#2C3480' : '#f8fafc',
                  color: application?.id === app.id ? '#ffffff' : '#475569',
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                {app.id}
              </button>
            ))}
          </div>
        </div>

        {/* Application Details Card */}
        {application ? (
          <Card>
            <CardHeader
              title={`Application #${application.id}`}
              subtitle={`Submitted on ${application.submittedDate} • Registered Mobile: ${application.phone}`}
              action={getStatusBadge(application.status)}
            />
            <CardBody style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Status Banner */}
              {application.status === 'Pending Verification' && (
                <div style={{ backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: '10px', padding: '1.25rem', display: 'flex', alignItems: 'flex-start', gap: '0.875rem' }}>
                  <Clock size={24} color="#d97706" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#92400e', margin: 0 }}>
                      Your application is waiting for Admin verification.
                    </h3>
                    <p style={{ fontSize: '0.8125rem', color: '#b45309', marginTop: '0.25rem', lineHeight: 1.5 }}>
                      Our Operations Safety Compliance team is verifying your submitted commercial driving badge and identity credentials. Typical review takes 24 business hours.
                    </p>
                  </div>
                </div>
              )}

              {application.status === 'Under Review' && (
                <div style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '10px', padding: '1.25rem', display: 'flex', alignItems: 'flex-start', gap: '0.875rem' }}>
                  <RefreshCw size={24} color="#2563eb" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#1e40af', margin: 0 }}>
                      Your application is currently being reviewed by our Admin team.
                    </h3>
                    <p style={{ fontSize: '0.8125rem', color: '#1d4ed8', marginTop: '0.25rem', lineHeight: 1.5 }}>
                      State Transport Authority (RTO) commercial endorsement check is in progress. You will receive an SMS as soon as the verification is finalized.
                    </p>
                  </div>
                </div>
              )}

              {application.status === 'Approved' && (
                <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '1.25rem', display: 'flex', alignItems: 'flex-start', gap: '0.875rem' }}>
                  <CheckCircle2 size={24} color="#16a34a" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#166534', margin: 0 }}>
                      Congratulations! Your driver registration has been approved.
                    </h3>
                    <p style={{ fontSize: '0.8125rem', color: '#15803d', marginTop: '0.25rem', lineHeight: 1.5 }}>
                      Your driver profile is now verified and active in the MAK ERP network. You can sign in to view your assigned duty roster and start accepting trips.
                    </p>
                    <div style={{ marginTop: '0.875rem' }}>
                      <Button
                        variant="primary"
                        size="sm"
                        style={{ backgroundColor: '#10b981', borderColor: '#10b981', fontWeight: 700 }}
                        onClick={() => navigate('/driver/login')}
                      >
                        Continue to Driver Login →
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {application.status === 'Rejected' && (
                <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', padding: '1.25rem', display: 'flex', alignItems: 'flex-start', gap: '0.875rem' }}>
                  <XCircle size={24} color="#dc2626" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#991b1b', margin: 0 }}>
                      Application Rejected by Admin Compliance Desk
                    </h3>
                    <p style={{ fontSize: '0.8125rem', color: '#b91c1c', marginTop: '0.25rem', lineHeight: 1.5 }}>
                      <strong>Reason:</strong> {application.adminRemarks || 'Document non-compliance or expired driving license endorsement.'}
                    </p>
                    <div style={{ marginTop: '0.875rem' }}>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => navigate('/driver/register')}
                      >
                        Resubmit Application with Updated Documents
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {application.status === 'Documents Required' && (
                <div style={{ backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: '10px', padding: '1.25rem', display: 'flex', alignItems: 'flex-start', gap: '0.875rem' }}>
                  <FileQuestion size={24} color="#d97706" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#92400e', margin: 0 }}>
                      Additional Documents Required by Admin
                    </h3>
                    <p style={{ fontSize: '0.8125rem', color: '#b45309', marginTop: '0.25rem', lineHeight: 1.5 }}>
                      <strong>Remarks:</strong> {application.adminRemarks}
                    </p>
                    <div style={{ marginTop: '0.875rem' }}>
                      <Button
                        variant="primary"
                        size="sm"
                        style={{ backgroundColor: '#d97706', borderColor: '#d97706', fontWeight: 700 }}
                        onClick={() => setIsUpdateDocModalOpen(true)}
                      >
                        Update / Re-upload Documents
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Applicant Identity Card */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', backgroundColor: '#f8fafc', padding: '1.25rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <img
                    src={application.photo}
                    alt={application.fullName}
                    style={{ width: '64px', height: '64px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #2C3480' }}
                  />
                  <div>
                    <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>Applicant Name</span>
                    <strong style={{ fontSize: '1rem', color: '#0f172a' }}>{application.fullName}</strong>
                    <div style={{ fontSize: '0.8125rem', color: '#475569' }}>{application.phone}</div>
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>Driving License (Masked)</span>
                  <strong style={{ fontSize: '0.9375rem', color: '#2C3480', fontFamily: 'monospace' }}>
                    {maskLicenseNumber(application.licenseNumber)}
                  </strong>
                  <div style={{ fontSize: '0.75rem', color: '#475569', marginTop: '0.2rem' }}>
                    Validity Expiry: {application.licenseExpiry}
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>Commercial Experience</span>
                  <strong style={{ fontSize: '0.9375rem', color: '#0f172a' }}>
                    {application.experienceYears} Years
                  </strong>
                  <div style={{ fontSize: '0.75rem', color: '#475569', marginTop: '0.2rem' }}>
                    RTO Endorsement Class: Commercial Badge
                  </div>
                </div>
              </div>

              {/* Admin Remarks Audit Section */}
              <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '1.25rem' }}>
                <h4 style={{ fontSize: '0.875rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.5rem' }}>
                  Admin Verification Audit Log
                </h4>
                <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.85rem 1rem', fontSize: '0.8125rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b', fontSize: '0.75rem', marginBottom: '0.35rem' }}>
                    <span>Reviewed By: {application.reviewedBy || 'Pending Queue'}</span>
                    <span>Last Updated: {application.reviewedDate || application.submittedDate}</span>
                  </div>
                  <div style={{ color: '#334155', fontStyle: application.adminRemarks ? 'normal' : 'italic' }}>
                    {application.adminRemarks || 'No remarks recorded yet. Verification pending in Admin queue.'}
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
        ) : (
          <div style={{ padding: '3rem', textAlign: 'center', backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <AlertCircle size={32} color="#dc2626" style={{ margin: '0 auto 0.5rem' }} />
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#0f172a' }}>Application Not Found</h3>
            <p style={{ fontSize: '0.8125rem', color: '#64748b', marginTop: '0.25rem' }}>
              No driver application matches the entered Application ID. Please verify your reference number.
            </p>
          </div>
        )}

        {/* Admin Verification Integration Simulation Panel */}
        <div
          style={{
            marginTop: '2rem',
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            border: '2px dashed #cbd5e1',
            padding: '1.25rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <div>
              <span style={{ fontSize: '0.8125rem', fontWeight: 800, color: '#2C3480', textTransform: 'uppercase' }}>
                Admin Verification Integration – Frontend Simulation
              </span>
              <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '0.15rem 0 0 0' }}>
                Simulate how MAK Admin reviews, verifies, approves, or rejects this driver application:
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            <Button
              variant="outline"
              size="sm"
              style={{ color: '#16a34a', borderColor: '#bbf7d0', backgroundColor: '#f0fdf4', fontWeight: 700 }}
              onClick={() => simulateApplicationStatusChange(application.id, 'Approved', 'All documents, commercial badge, and background verification cleared. Approved as Senior Tour Driver.')}
            >
              ✓ Approve Driver
            </Button>
            <Button
              variant="outline"
              size="sm"
              style={{ color: '#2563eb', borderColor: '#bfdbfe', backgroundColor: '#eff6ff', fontWeight: 700 }}
              onClick={() => simulateApplicationStatusChange(application.id, 'Under Review', 'Commercial badge verification in progress with State Transport Authority portal.')}
            >
              ⏳ Mark Under Review
            </Button>
            <Button
              variant="outline"
              size="sm"
              style={{ color: '#d97706', borderColor: '#fde68a', backgroundColor: '#fffbeb', fontWeight: 700 }}
              onClick={() => simulateApplicationStatusChange(application.id, 'Documents Required', 'Driving license back photograph was blurred and unreadable. Kindly re-upload a clear scanned copy.')}
            >
              📄 Request Documents
            </Button>
            <Button
              variant="outline"
              size="sm"
              style={{ color: '#dc2626', borderColor: '#fecaca', backgroundColor: '#fef2f2', fontWeight: 700 }}
              onClick={() => simulateApplicationStatusChange(application.id, 'Rejected', 'Driving license expired. Please renew your commercial endorsement and resubmit.')}
            >
              ✕ Reject Driver
            </Button>
            <Button
              variant="outline"
              size="sm"
              style={{ color: '#475569', borderColor: '#cbd5e1', backgroundColor: '#f8fafc', fontWeight: 700 }}
              onClick={() => simulateApplicationStatusChange(application.id, 'Pending Verification', 'Application queued for RTO badge verification and address proof validation.')}
            >
              Reset to Pending
            </Button>
          </div>
        </div>

        {/* Update Documents Modal */}
        <Modal
          isOpen={isUpdateDocModalOpen}
          onClose={() => setIsUpdateDocModalOpen(false)}
          title="Update & Re-upload Documents"
          subtitle={`Submit corrected documents for Application #${application?.id}`}
          size="md"
          footer={
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', width: '100%' }}>
              <Button variant="outline" onClick={() => setIsUpdateDocModalOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                style={{ backgroundColor: '#2C3480', borderColor: '#2C3480' }}
                onClick={() => {
                  simulateApplicationStatusChange(application.id, 'Under Review', 'Updated documents submitted by applicant. Re-queued for compliance review.');
                  setIsUpdateDocModalOpen(false);
                }}
              >
                Submit Updated Document
              </Button>
            </div>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.85rem', fontSize: '0.8125rem' }}>
              <strong>Admin Instruction:</strong> {application?.adminRemarks}
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                Select Document to Replace
              </label>
              <select
                style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.875rem', backgroundColor: '#fff' }}
              >
                <option value="dl_back">Commercial Driving License (Back Side)</option>
                <option value="dl_front">Commercial Driving License (Front Side)</option>
                <option value="medical">Medical Fitness Certificate</option>
              </select>
            </div>

            <div
              style={{
                border: '2px dashed #cbd5e1',
                borderRadius: '8px',
                padding: '1.5rem',
                textAlign: 'center',
                backgroundColor: '#f8fafc',
                cursor: 'pointer'
              }}
              onClick={() => setUpdatedDocFile('DL_Back_Clear_Scan_2026.jpg')}
            >
              <UploadCloud size={30} color="#2C3480" style={{ margin: '0 auto 0.5rem' }} />
              <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#0f172a', margin: 0 }}>
                {updatedDocFile ? `Selected: ${updatedDocFile}` : 'Click to select clear scanned image'}
              </p>
              <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '0.25rem 0 0 0' }}>
                Supported formats: JPG, PNG, PDF (Max 10MB)
              </p>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
}

export default DriverApplicationStatus;
