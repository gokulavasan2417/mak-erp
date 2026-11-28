// MAK Tours & Travels ERP - Admin Driver Registration & Document Verification Desk
// Complete Statutory Verification Workflow: Inspect, Verify individual documents (DL, Aadhaar, PAN, PVC, Bank, Photo, Medical),
// add rejection reasons/remarks, and authorize driver activation.
import React, { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ShieldCheck,
  UserCheck,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Search,
  Filter,
  Eye,
  FileText,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Award,
  ExternalLink,
  Check,
  X,
  FileCheck,
  AlertCircle,
  User,
  HeartPulse,
  CreditCard,
  Building,
  Download,
  CheckCircle2,
  RefreshCw,
  Lock
} from 'lucide-react';
import { Breadcrumbs } from '../../../components/common/Breadcrumbs';
import { Card, CardHeader, CardBody } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Input } from '../../../components/ui/Input';
import { Modal } from '../../../components/ui/Modal';
import { useAdminData } from '../../../context/AdminDataContext';
import { useToast } from '../../../context/ToastContext';

export function DriverApplications() {
  const navigate = useNavigate();
  const toast = useToast();
  const {
    driverApplications = [],
    approveDriverApplication,
    rejectDriverApplication,
    requestDocumentsApplication,
    verifyDriverDocument,
    syncDriverApplications
  } = useAdminData();

  const [activeTab, setActiveTab] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);

  const handleManualSync = async () => {
    if (typeof syncDriverApplications === 'function') {
      setIsSyncing(true);
      await syncDriverApplications();
      setTimeout(() => setIsSyncing(false), 600);
      toast.info('Driver applications synchronized from Driver Portal Server.');
    }
  };

  // Rejection & Resubmission Modal State (for overall application or specific document)
  const [rejectModalApp, setRejectModalApp] = useState(null);
  const [rejectReason, setRejectReason] = useState('Driving license or badge scan was unreadable');
  const [docActionModal, setDocActionModal] = useState(null); // { app, doc, action: 'reject' | 'resubmit' | 'remark' }
  const [docActionInput, setDocActionInput] = useState('');

  // Preview Document Modal
  const [previewDocUrl, setPreviewDocUrl] = useState(null);
  const [previewDocTitle, setPreviewDocTitle] = useState('');

  // Live updated selectedApplication pointer
  const currentApp = useMemo(() => {
    if (!selectedApplication) return null;
    return driverApplications.find((a) => a.id === selectedApplication.id) || selectedApplication;
  }, [driverApplications, selectedApplication]);

  // Counts
  const pendingCount = driverApplications.filter(
    (a) => a.status === 'Pending Verification' || a.status === 'Submitted for Verification'
  ).length;
  const underReviewCount = driverApplications.filter((a) => a.status === 'Under Review').length;
  const approvedCount = driverApplications.filter((a) => a.status === 'Approved' || a.status === 'Verified').length;
  const rejectedCount = driverApplications.filter(
    (a) => a.status === 'Rejected' || a.status === 'Resubmission Required'
  ).length;

  const filteredApplications = useMemo(() => {
    return driverApplications.filter((app) => {
      const matchesTab =
        activeTab === 'All' ||
        (activeTab === 'Pending' &&
          (app.status === 'Pending Verification' || app.status === 'Submitted for Verification')) ||
        (activeTab === 'Under Review' && app.status === 'Under Review') ||
        (activeTab === 'Approved' && (app.status === 'Approved' || app.status === 'Verified')) ||
        (activeTab === 'Rejected' &&
          (app.status === 'Rejected' || app.status === 'Resubmission Required'));

      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        app.fullName?.toLowerCase().includes(q) ||
        app.id?.toLowerCase().includes(q) ||
        app.phone?.toLowerCase().includes(q) ||
        app.licenseNumber?.toLowerCase().includes(q) ||
        app.city?.toLowerCase().includes(q);

      return matchesTab && matchesSearch;
    });
  }, [driverApplications, activeTab, searchQuery]);

  const handleApprove = (appId) => {
    approveDriverApplication(appId, reviewNotes);
    setSelectedApplication(null);
    setReviewNotes('');
  };

  const handleConfirmRejectApp = () => {
    if (!rejectModalApp) return;
    rejectDriverApplication(rejectModalApp.id, rejectReason);
    setRejectModalApp(null);
    if (selectedApplication?.id === rejectModalApp.id) {
      setSelectedApplication(null);
    }
  };

  const handleConfirmDocAction = () => {
    if (!docActionModal) return;
    const { app, doc, action } = docActionModal;
    if (action === 'reject') {
      verifyDriverDocument(app.id, doc.id, 'Rejected', docActionInput || 'Document failed compliance checks');
    } else if (action === 'resubmit') {
      verifyDriverDocument(
        app.id,
        doc.id,
        'Resubmission Required',
        '',
        docActionInput || 'Please re-upload a clear copy'
      );
    } else if (action === 'remark') {
      verifyDriverDocument(app.id, doc.id, doc.status, '', docActionInput);
    }
    setDocActionModal(null);
    setDocActionInput('');
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Approved':
      case 'Verified':
        return (
          <span style={{ fontSize: '0.6875rem', fontWeight: 800, backgroundColor: '#dcfce7', color: '#15803d', padding: '0.2rem 0.6rem', borderRadius: '4px', border: '1px solid #bbf7d0' }}>
            ✓ {status}
          </span>
        );
      case 'Under Review':
        return (
          <span style={{ fontSize: '0.6875rem', fontWeight: 800, backgroundColor: '#e0f2fe', color: '#0369a1', padding: '0.2rem 0.6rem', borderRadius: '4px', border: '1px solid #bae6fd' }}>
            Under Review
          </span>
        );
      case 'Pending Verification':
      case 'Submitted for Verification':
      case 'Pending':
        return (
          <span style={{ fontSize: '0.6875rem', fontWeight: 800, backgroundColor: '#fef3c7', color: '#b45309', padding: '0.2rem 0.6rem', borderRadius: '4px', border: '1px solid #fde68a' }}>
            Pending Verification
          </span>
        );
      case 'Resubmission Required':
        return (
          <span style={{ fontSize: '0.6875rem', fontWeight: 800, backgroundColor: '#fff7ed', color: '#c2410c', padding: '0.2rem 0.6rem', borderRadius: '4px', border: '1px solid #fed7aa' }}>
            Resubmission Required
          </span>
        );
      case 'Rejected':
        return (
          <span style={{ fontSize: '0.6875rem', fontWeight: 800, backgroundColor: '#fee2e2', color: '#b91c1c', padding: '0.2rem 0.6rem', borderRadius: '4px', border: '1px solid #fca5a5' }}>
            Rejected
          </span>
        );
      default:
        return (
          <span style={{ fontSize: '0.6875rem', fontWeight: 800, backgroundColor: '#f1f5f9', color: '#475569', padding: '0.2rem 0.6rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}>
            {status}
          </span>
        );
    }
  };

  const getDocStatusBadge = (status) => {
    switch (status) {
      case 'Verified':
        return (
          <span style={{ fontSize: '0.6875rem', fontWeight: 800, backgroundColor: '#dcfce7', color: '#15803d', padding: '0.15rem 0.5rem', borderRadius: '4px', border: '1px solid #bbf7d0' }}>
            ✓ Verified
          </span>
        );
      case 'Under Review':
        return (
          <span style={{ fontSize: '0.6875rem', fontWeight: 800, backgroundColor: '#e0f2fe', color: '#0369a1', padding: '0.15rem 0.5rem', borderRadius: '4px', border: '1px solid #bae6fd' }}>
            Under Review
          </span>
        );
      case 'Resubmission Required':
        return (
          <span style={{ fontSize: '0.6875rem', fontWeight: 800, backgroundColor: '#fff7ed', color: '#ea580c', padding: '0.15rem 0.5rem', borderRadius: '4px', border: '1px solid #ffedd5' }}>
            Resubmit
          </span>
        );
      case 'Rejected':
        return (
          <span style={{ fontSize: '0.6875rem', fontWeight: 800, backgroundColor: '#fee2e2', color: '#dc2626', padding: '0.15rem 0.5rem', borderRadius: '4px', border: '1px solid #fca5a5' }}>
            Rejected
          </span>
        );
      case 'Expired':
        return (
          <span style={{ fontSize: '0.6875rem', fontWeight: 800, backgroundColor: '#fee2e2', color: '#dc2626', padding: '0.15rem 0.5rem', borderRadius: '4px', border: '1px solid #fca5a5' }}>
            Expired
          </span>
        );
      case 'Pending':
      default:
        return (
          <span style={{ fontSize: '0.6875rem', fontWeight: 800, backgroundColor: '#fef3c7', color: '#d97706', padding: '0.15rem 0.5rem', borderRadius: '4px', border: '1px solid #fde68a' }}>
            Pending
          </span>
        );
    }
  };

  // Determine if application is ready for final approval
  const canApproveApplication = (app) => {
    if (!app || !app.documents || app.documents.length === 0) return false;
    const mandatoryDocs = app.documents.filter((d) => d.required);
    if (mandatoryDocs.length === 0) return true;
    return mandatoryDocs.every((d) => d.status === 'Verified');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', width: '100%', paddingBottom: '3rem' }}>
      {/* Top Banner Header */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          backgroundColor: '#ffffff',
          padding: '1.25rem 1.5rem',
          borderRadius: '6px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
        }}
      >
        <div>
          <Breadcrumbs portal="admin" />
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginTop: '0.35rem' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '6px',
                backgroundColor: '#EEF0FD',
                color: '#2C3480',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <ShieldCheck size={20} />
            </div>
            <div>
              <h1 style={{ fontSize: '1.375rem', fontWeight: 800, color: '#090d16', margin: 0, letterSpacing: '-0.02em' }}>
                Driver Registration &amp; Document Verification Desk
              </h1>
              <p style={{ fontSize: '0.8125rem', color: '#64748b', margin: 0 }}>
                Review registered drivers, verify statutory documents (License, Aadhaar, PAN, Police PVC, Bank details, Photo, Medical), and authorize roster activation.
              </p>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <Button
            variant="outline"
            size="sm"
            leftIcon={<RefreshCw size={14} className={isSyncing ? "animate-spin" : ""} />}
            style={{ borderRadius: '6px' }}
            onClick={handleManualSync}
            disabled={isSyncing}
          >
            {isSyncing ? 'Syncing...' : 'Sync Driver Portal'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            leftIcon={<UserCheck size={14} />}
            style={{ borderRadius: '6px' }}
            onClick={() => navigate('/admin/drivers')}
          >
            Active Fleet Roster
          </Button>
          <Button
            variant="primary"
            size="sm"
            style={{ backgroundColor: '#2C3480', borderColor: '#2C3480', borderRadius: '6px', fontWeight: 700 }}
            leftIcon={<ExternalLink size={14} />}
            onClick={() => navigate('/driver/register')}
          >
            Open Driver Registration Form
          </Button>
        </div>
      </div>

      {/* KPI Stats Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
        <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '1rem 1.25rem' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
            Total Registrations
          </div>
          <div style={{ fontSize: '1.625rem', fontWeight: 800, color: '#090d16', marginTop: '0.2rem' }}>
            {driverApplications.length}
          </div>
          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Submitted via Driver Portal</span>
        </div>

        <div style={{ backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: '6px', padding: '1rem 1.25rem' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#92400e', textTransform: 'uppercase' }}>
            Pending Verification
          </div>
          <div style={{ fontSize: '1.625rem', fontWeight: 800, color: '#b45309', marginTop: '0.2rem' }}>
            {pendingCount}
          </div>
          <span style={{ fontSize: '0.75rem', color: '#b45309', fontWeight: 700 }}>Awaiting Ops Review</span>
        </div>

        <div style={{ backgroundColor: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '6px', padding: '1rem 1.25rem' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#0369a1', textTransform: 'uppercase' }}>
            Under Review
          </div>
          <div style={{ fontSize: '1.625rem', fontWeight: 800, color: '#0284c7', marginTop: '0.2rem' }}>
            {underReviewCount}
          </div>
          <span style={{ fontSize: '0.75rem', color: '#0284c7' }}>Sarathi / Police Check</span>
        </div>

        <div style={{ backgroundColor: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '6px', padding: '1rem 1.25rem' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#065f46', textTransform: 'uppercase' }}>
            Approved &amp; Enrolled
          </div>
          <div style={{ fontSize: '1.625rem', fontWeight: 800, color: '#059669', marginTop: '0.2rem' }}>
            {approvedCount}
          </div>
          <span style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 700 }}>Active in Dispatch Roster</span>
        </div>

        <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', padding: '1rem 1.25rem' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#991b1b', textTransform: 'uppercase' }}>
            Rejected / Resubmit
          </div>
          <div style={{ fontSize: '1.625rem', fontWeight: 800, color: '#dc2626', marginTop: '0.2rem' }}>
            {rejectedCount}
          </div>
          <span style={{ fontSize: '0.75rem', color: '#dc2626' }}>Document issue flagged</span>
        </div>
      </div>

      {/* Filter Tabs & Search Toolbar */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '6px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            borderBottom: '1px solid #e2e8f0',
            overflowX: 'auto',
            backgroundColor: '#fafbfc'
          }}
        >
          {[
            { label: 'All Registrations', val: 'All', count: driverApplications.length },
            { label: 'Pending Verification', val: 'Pending', count: pendingCount, badgeColor: '#b45309', badgeBg: '#fef3c7' },
            { label: 'Under Review', val: 'Under Review', count: underReviewCount, badgeColor: '#0369a1', badgeBg: '#e0f2fe' },
            { label: 'Approved & Enrolled', val: 'Approved', count: approvedCount, badgeColor: '#15803d', badgeBg: '#dcfce7' },
            { label: 'Rejected / Resubmit', val: 'Rejected', count: rejectedCount, badgeColor: '#b91c1c', badgeBg: '#fee2e2' }
          ].map((tab) => {
            const isActive = activeTab === tab.val;
            return (
              <button
                key={tab.val}
                type="button"
                onClick={() => setActiveTab(tab.val)}
                style={{
                  padding: '0.85rem 1.25rem',
                  border: 'none',
                  borderBottom: isActive ? '3px solid #2C3480' : '3px solid transparent',
                  backgroundColor: isActive ? '#ffffff' : 'transparent',
                  color: isActive ? '#2C3480' : '#64748b',
                  fontSize: '0.8125rem',
                  fontWeight: isActive ? 800 : 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  whiteSpace: 'nowrap'
                }}
              >
                <span>{tab.label}</span>
                <span
                  style={{
                    fontSize: '0.6875rem',
                    fontWeight: 700,
                    backgroundColor: isActive ? '#EEF0FD' : tab.badgeBg || '#e2e8f0',
                    color: isActive ? '#2C3480' : tab.badgeColor || '#475569',
                    padding: '0.15rem 0.5rem',
                    borderRadius: '4px'
                  }}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        <div style={{ padding: '0.85rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ flex: 1, minWidth: '280px', maxWidth: '520px' }}>
            <Input
              placeholder="Search by driver name, mobile, license number, or application ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={<Search size={15} color="#94a3b8" />}
            />
          </div>
          <div style={{ fontSize: '0.8125rem', color: '#64748b', fontWeight: 600 }}>
            Showing <strong>{filteredApplications.length}</strong> of {driverApplications.length} Drivers
          </div>
        </div>
      </div>

      {/* Applications List: Straight Rectangular Cards */}
      {filteredApplications.length === 0 ? (
        <Card style={{ borderRadius: '6px' }}>
          <CardBody style={{ padding: '3.5rem', textAlign: 'center', color: '#64748b' }}>
            <ShieldCheck size={42} color="#94a3b8" style={{ margin: '0 auto 1rem' }} />
            <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: '#0f172a' }}>No Driver Applications Found</h3>
            <p style={{ fontSize: '0.875rem', margin: '0.25rem 0 1rem' }}>
              No applications match the selected filter &quot;{activeTab}&quot; or search query.
            </p>
            <Button variant="outline" size="sm" onClick={() => { setActiveTab('All'); setSearchQuery(''); }} style={{ borderRadius: '6px' }}>
              Reset Filters
            </Button>
          </CardBody>
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filteredApplications.map((app) => {
            const docs = app.documents || [];
            const mandatoryDocs = docs.filter((d) => d.required);
            const verifiedDocs = docs.filter((d) => d.status === 'Verified');
            const mandatoryVerified = mandatoryDocs.filter((d) => d.status === 'Verified');
            const readyForEnrollment = canApproveApplication(app);

            return (
              <div
                key={app.id}
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '6px',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)',
                  padding: '1.25rem 1.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem'
                }}
              >
                {/* Header Row: Driver Photo & Info */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <img
                      src={app.passportPhoto || app.photo}
                      alt={app.fullName}
                      style={{
                        width: '56px',
                        height: '56px',
                        borderRadius: '6px',
                        objectFit: 'cover',
                        border: '2px solid #2C3480'
                      }}
                    />
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                          {app.fullName}
                        </h3>
                        <span style={{ fontSize: '0.7rem', fontFamily: 'monospace', fontWeight: 800, backgroundColor: '#EEF0FD', color: '#2C3480', padding: '0.15rem 0.5rem', borderRadius: '4px' }}>
                          {app.id}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginTop: '0.25rem', flexWrap: 'wrap', fontSize: '0.8125rem', color: '#64748b' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          <Phone size={13} color="#2C3480" /> {app.phone}
                        </span>
                        {app.email && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                            <Mail size={13} color="#2C3480" /> {app.email}
                          </span>
                        )}
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          <MapPin size={13} color="#2C3480" /> {app.city || 'Chennai'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                    {getStatusBadge(app.status)}
                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      Applied: <strong>{app.submittedDate}</strong>
                    </span>
                  </div>
                </div>

                {/* Statutory Documents Verification Progress Strip */}
                <div
                  style={{
                    backgroundColor: '#f8fafc',
                    borderRadius: '6px',
                    border: '1px solid #e2e8f0',
                    padding: '0.75rem 1rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '0.75rem'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                    <div style={{ fontSize: '0.8125rem' }}>
                      <span style={{ color: '#64748b' }}>Documents Verification: </span>
                      <strong style={{ color: verifiedDocs.length === docs.length ? '#15803d' : '#2C3480' }}>
                        {verifiedDocs.length} of {docs.length} Verified
                      </strong>
                    </div>

                    <div style={{ fontSize: '0.8125rem' }}>
                      <span style={{ color: '#64748b' }}>Mandatory Compliance: </span>
                      <strong style={{ color: readyForEnrollment ? '#15803d' : '#b45309' }}>
                        {mandatoryVerified.length} of {mandatoryDocs.length} Cleared
                      </strong>
                    </div>

                    {app.licenseNumber && (
                      <div style={{ fontSize: '0.75rem', color: '#475569' }}>
                        DL: <code style={{ color: '#2C3480', fontWeight: 700 }}>{app.licenseNumber}</code> (Exp: {app.licenseExpiry})
                      </div>
                    )}

                    {app.vehicleModel && (
                      <div style={{ fontSize: '0.75rem', color: '#475569' }}>
                        Cab: <strong style={{ color: '#0f172a' }}>{app.vehicleModel}</strong> ({app.vehicleCategory || 'SEDAN'}) &bull; <code style={{ color: '#2C3480', fontWeight: 700 }}>{app.vehiclePlate || 'On file'}</code>
                      </div>
                    )}
                  </div>

                  <div>
                    {readyForEnrollment ? (
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#15803d', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <CheckCircle2 size={14} /> Ready for Roster Activation
                      </span>
                    ) : (
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#b45309', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <Clock size={14} /> Documents Verification Pending
                      </span>
                    )}
                  </div>
                </div>

                {/* Admin Remarks if any */}
                {app.adminRemarks && (
                  <div style={{ fontSize: '0.75rem', color: '#334155', backgroundColor: '#fafbfc', padding: '0.5rem 0.75rem', borderRadius: '4px', borderLeft: '3px solid #2C3480' }}>
                    <strong>Admin Audit Note:</strong> {app.adminRemarks}
                  </div>
                )}

                {/* Bottom Actions Row */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #f1f5f9', paddingTop: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    Preferred Journey: <strong>{app.preferredTripType || 'Tour Package'}</strong> &bull; {app.experienceYears || 5} Yrs Exp
                  </span>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Button
                      variant="outline"
                      size="sm"
                      style={{ borderRadius: '6px' }}
                      onClick={() => {
                        setSelectedApplication(app);
                        setReviewNotes(app.adminRemarks || '');
                      }}
                      leftIcon={<Eye size={14} />}
                    >
                      Review &amp; Verify Documents ({docs.length})
                    </Button>

                    {app.status !== 'Approved' && (
                      <Button
                        variant="primary"
                        size="sm"
                        disabled={!readyForEnrollment}
                        style={{
                          backgroundColor: readyForEnrollment ? '#10b981' : '#94a3b8',
                          borderColor: readyForEnrollment ? '#10b981' : '#94a3b8',
                          cursor: readyForEnrollment ? 'pointer' : 'not-allowed',
                          fontWeight: 700,
                          borderRadius: '6px'
                        }}
                        onClick={() => handleApprove(app.id)}
                        leftIcon={<CheckCircle size={14} />}
                        title={
                          readyForEnrollment
                            ? 'Approve driver application'
                            : 'All mandatory documents must be verified before approval'
                        }
                      >
                        Confirm &amp; Approve Driver
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================
          FULL CREDENTIALS & DOCUMENT VERIFICATION MODAL
          ======================================================== */}
      {currentApp && (
        <Modal
          isOpen={Boolean(currentApp)}
          onClose={() => setSelectedApplication(null)}
          title={`Driver Statutory Verification: ${currentApp.fullName}`}
          subtitle={`Application ID: ${currentApp.id} • Submitted: ${currentApp.submittedDate}`}
          size="xl"
          maxWidth="980px"
          footer={
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <Button
                  variant="outline"
                  size="sm"
                  style={{ color: '#dc2626', borderColor: '#fca5a5', borderRadius: '6px' }}
                  onClick={() => setRejectModalApp(currentApp)}
                  leftIcon={<X size={14} />}
                >
                  Reject Application
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  style={{ borderRadius: '6px' }}
                  onClick={() => {
                    requestDocumentsApplication(
                      currentApp.id,
                      'Statutory compliance desk requested correction / re-upload of invalid documents.'
                    );
                    setSelectedApplication(null);
                  }}
                >
                  Request Document Resubmission
                </Button>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <Button variant="outline" size="sm" onClick={() => setSelectedApplication(null)} style={{ borderRadius: '6px' }}>
                  Close
                </Button>
                {currentApp.status !== 'Approved' && (
                  <Button
                    variant="primary"
                    size="sm"
                    disabled={!canApproveApplication(currentApp)}
                    style={{
                      backgroundColor: canApproveApplication(currentApp) ? '#10b981' : '#94a3b8',
                      borderColor: canApproveApplication(currentApp) ? '#10b981' : '#94a3b8',
                      cursor: canApproveApplication(currentApp) ? 'pointer' : 'not-allowed',
                      fontWeight: 800,
                      borderRadius: '6px'
                    }}
                    onClick={() => handleApprove(currentApp.id)}
                    leftIcon={<CheckCircle size={15} />}
                  >
                    Confirm &amp; Enroll into Active Roster
                  </Button>
                )}
              </div>
            </div>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxHeight: '74vh', overflowY: 'auto', paddingRight: '0.25rem' }}>
            {/* 5-Step Verification Workflow Strip */}
            <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '1rem' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#2C3480', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                Statutory Verification Workflow (Section 4)
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.5rem' }}>
                {[
                  { title: '1. Profile Check', detail: 'KYC & contact info' },
                  { title: '2. Inspect Documents', detail: 'View high-res scans' },
                  { title: '3. Verify Each Doc', detail: 'Independent approval' },
                  { title: '4. Compliance Clear', detail: 'All mandatory verified' },
                  { title: '5. Roster Activation', detail: 'Authorized for duty' }
                ].map((wf, idx) => (
                  <div
                    key={wf.title}
                    style={{
                      backgroundColor: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderTop: '3px solid #2C3480',
                      borderRadius: '4px',
                      padding: '0.45rem',
                      textAlign: 'center'
                    }}
                  >
                    <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#0f172a' }}>{wf.title}</div>
                    <div style={{ fontSize: '0.625rem', color: '#64748b' }}>{wf.detail}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Profile Overview Card */}
            <div style={{ backgroundColor: '#ffffff', borderRadius: '6px', border: '1px solid #e2e8f0', padding: '1rem 1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                <img
                  src={currentApp.passportPhoto || currentApp.photo}
                  alt={currentApp.fullName}
                  style={{ width: '70px', height: '70px', borderRadius: '6px', objectFit: 'cover', border: '2px solid #2C3480' }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                      {currentApp.fullName}
                    </h3>
                    {getStatusBadge(currentApp.status)}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.5rem', marginTop: '0.5rem', fontSize: '0.75rem', color: '#475569' }}>
                    <div>DOB: <strong>{currentApp.dob} ({currentApp.gender || 'Male'})</strong></div>
                    <div>Phone: <strong>{currentApp.phone}</strong></div>
                    <div>City: <strong>{currentApp.city || 'Madurai'}</strong></div>
                    <div>Address: <strong>{currentApp.address}</strong></div>
                    <div>Emergency: <strong>{currentApp.emergencyContactName} ({currentApp.emergencyContactPhone})</strong></div>
                    <div>Vehicle: <strong>{currentApp.vehicleModel || 'Registered Cab'} ({currentApp.vehicleCategory || 'SEDAN'})</strong></div>
                    <div>Number Plate: <code style={{ color: '#2C3480', fontWeight: 700 }}>{currentApp.vehiclePlate || 'On file'}</code></div>
                    <div>Driving License: <code style={{ color: '#2C3480', fontWeight: 700 }}>{currentApp.licenseNumber || 'On file'}</code></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Statutory Compliance Checklist Banner */}
            {!canApproveApplication(currentApp) ? (
              <div style={{ backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderLeft: '4px solid #d97706', borderRadius: '4px', padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <AlertTriangle size={18} color="#d97706" style={{ flexShrink: 0 }} />
                <div style={{ fontSize: '0.8125rem', color: '#92400e' }}>
                  <strong>Mandatory Documents Verification Incomplete:</strong> Please verify all required statutory documents (Commercial DL, Aadhaar, PAN, Police Clearance, Bank Details, and Medical Fitness) before approving driver registration.
                </div>
              </div>
            ) : (
              <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderLeft: '4px solid #16a34a', borderRadius: '4px', padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <CheckCircle2 size={18} color="#16a34a" style={{ flexShrink: 0 }} />
                <div style={{ fontSize: '0.8125rem', color: '#166534' }}>
                  <strong>All Mandatory Verification Requirements Satisfied:</strong> This driver is eligible for full registration approval and active fleet roster assignment.
                </div>
              </div>
            )}

            {/* ========================================================
                INDIVIDUAL STATUTORY DOCUMENTS VERIFICATION TABLE/CARDS
                ======================================================== */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <h4 style={{ fontSize: '0.875rem', fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.03em', margin: 0 }}>
                  Statutory Uploaded Documents ({currentApp.documents?.length || 0})
                </h4>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                  Verify each document individually
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {(currentApp.documents || []).map((doc) => {
                  const isVerified = doc.status === 'Verified';
                  const isRejected = doc.status === 'Rejected';
                  const isResubmit = doc.status === 'Resubmission Required';

                  return (
                    <div
                      key={doc.id}
                      style={{
                        backgroundColor: '#ffffff',
                        borderRadius: '6px',
                        border: '1px solid #e2e8f0',
                        borderLeft: isVerified
                          ? '4px solid #16a34a'
                          : isRejected
                          ? '4px solid #dc2626'
                          : isResubmit
                          ? '4px solid #ea580c'
                          : '4px solid #2C3480',
                        padding: '1rem 1.25rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.75rem'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                            <h5 style={{ fontSize: '0.9375rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                              {doc.title}
                            </h5>
                            {doc.required ? (
                              <span style={{ fontSize: '0.625rem', fontWeight: 700, backgroundColor: '#f1f5f9', color: '#475569', padding: '0.1rem 0.4rem', borderRadius: '3px', border: '1px solid #cbd5e1' }}>
                                MANDATORY
                              </span>
                            ) : (
                              <span style={{ fontSize: '0.625rem', fontWeight: 700, backgroundColor: '#f8fafc', color: '#64748b', padding: '0.1rem 0.4rem', borderRadius: '3px', border: '1px solid #e2e8f0' }}>
                                OPTIONAL
                              </span>
                            )}
                            {getDocStatusBadge(doc.status)}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.2rem' }}>
                            Doc Ref: <strong style={{ color: '#0f172a', fontFamily: 'monospace' }}>{doc.documentNumber || 'N/A'}</strong>
                            {doc.expiryDate && (
                              <span> &bull; Expiry: <strong style={{ color: '#16a34a' }}>{doc.expiryDate}</strong></span>
                            )}
                            {doc.fileName && <span> &bull; File: {doc.fileName}</span>}
                          </div>
                        </div>

                        {/* Document View & Download Buttons */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          {doc.fileUrl && (
                            <Button
                              variant="outline"
                              size="sm"
                              style={{ borderRadius: '4px', fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}
                              leftIcon={<Eye size={13} />}
                              onClick={() => {
                                setPreviewDocUrl(doc.fileUrl);
                                setPreviewDocTitle(doc.title);
                              }}
                            >
                              Preview Scan
                            </Button>
                          )}
                          <a
                            href={doc.fileUrl || '#'}
                            target="_blank"
                            rel="noopener noreferrer"
                            download={doc.fileName || 'document.pdf'}
                            style={{ textDecoration: 'none' }}
                          >
                            <Button
                              variant="ghost"
                              size="sm"
                              style={{ borderRadius: '4px', fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}
                              leftIcon={<Download size={13} />}
                            >
                              Download
                            </Button>
                          </a>
                        </div>
                      </div>

                      {/* Document Scanned Photo Inline Thumbnail Preview */}
                      {doc.fileUrl && (
                        <div
                          style={{
                            marginTop: '0.5rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            backgroundColor: '#f8fafc',
                            padding: '0.5rem',
                            borderRadius: '4px',
                            border: '1px solid #e2e8f0',
                            cursor: 'pointer'
                          }}
                          onClick={() => {
                            setPreviewDocUrl(doc.fileUrl);
                            setPreviewDocTitle(doc.title);
                          }}
                          title="Click to view full high-res scan"
                        >
                          <img
                            src={doc.fileUrl}
                            alt={doc.title}
                            style={{
                              width: '120px',
                              height: '80px',
                              objectFit: 'cover',
                              borderRadius: '4px',
                              border: '1px solid #cbd5e1'
                            }}
                          />
                          <div>
                            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#2C3480' }}>
                              Scanned Document Attached
                            </div>
                            <div style={{ fontSize: '0.6875rem', color: '#64748b' }}>
                              Click image or &quot;Preview Scan&quot; to inspect full resolution
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Display Rejection / Resubmission Notes */}
                      {(doc.rejectionReason || doc.remarks) && (
                        <div style={{ backgroundColor: isRejected ? '#fef2f2' : isResubmit ? '#fff7ed' : '#f8fafc', padding: '0.5rem 0.75rem', borderRadius: '4px', fontSize: '0.75rem' }}>
                          {doc.rejectionReason && (
                            <div style={{ color: '#dc2626', fontWeight: 600 }}>
                              Rejection Reason: {doc.rejectionReason}
                            </div>
                          )}
                          {doc.remarks && (
                            <div style={{ color: '#475569', marginTop: '0.15rem' }}>
                              Internal Remarks: {doc.remarks}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Verification Action Toolbar for this Document */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.5rem', borderTop: '1px solid #f1f5f9', paddingTop: '0.5rem', flexWrap: 'wrap' }}>
                        <Button
                          variant="ghost"
                          size="sm"
                          style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem', color: '#64748b' }}
                          onClick={() => {
                            setDocActionModal({ app: currentApp, doc, action: 'remark' });
                            setDocActionInput(doc.remarks || '');
                          }}
                        >
                          Add Remarks
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem', color: '#ea580c', borderColor: '#fed7aa', borderRadius: '4px' }}
                          onClick={() => {
                            setDocActionModal({ app: currentApp, doc, action: 'resubmit' });
                            setDocActionInput('Document scan is blurry. Please re-scan clearly at 300 DPI.');
                          }}
                        >
                          Request Resubmission
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem', color: '#dc2626', borderColor: '#fca5a5', borderRadius: '4px' }}
                          onClick={() => {
                            setDocActionModal({ app: currentApp, doc, action: 'reject' });
                            setDocActionInput('Document credentials mismatch or unreadable');
                          }}
                        >
                          Reject
                        </Button>

                        <Button
                          variant="primary"
                          size="sm"
                          style={{
                            fontSize: '0.75rem',
                            padding: '0.25rem 0.75rem',
                            backgroundColor: isVerified ? '#15803d' : '#10b981',
                            borderColor: isVerified ? '#15803d' : '#10b981',
                            borderRadius: '4px',
                            fontWeight: 700
                          }}
                          leftIcon={<Check size={13} />}
                          onClick={() => {
                            verifyDriverDocument(currentApp.id, doc.id, 'Verified');
                          }}
                        >
                          {isVerified ? '✓ Verified' : 'Approve Document'}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Internal Audit Log Textarea */}
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#090d16', marginBottom: '0.35rem' }}>
                Overall Admin Operations Verification Remarks
              </label>
              <textarea
                rows={2}
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder="Enter audit notes on Sarathi license status, police PVC verification number, or duty assignment instructions..."
                style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.8125rem', fontFamily: 'inherit' }}
              />
            </div>
          </div>
        </Modal>
      )}

      {/* ========================================================
          DOCUMENT ACTION MODAL (Reject, Resubmit, or Remark)
          ======================================================== */}
      {docActionModal && (
        <Modal
          isOpen={Boolean(docActionModal)}
          onClose={() => setDocActionModal(null)}
          title={
            docActionModal.action === 'reject'
              ? `Reject Document: ${docActionModal.doc.title}`
              : docActionModal.action === 'resubmit'
              ? `Request Resubmission: ${docActionModal.doc.title}`
              : `Add Remarks: ${docActionModal.doc.title}`
          }
          subtitle={`Driver: ${docActionModal.app.fullName} • ${docActionModal.doc.documentNumber || ''}`}
          size="md"
          footer={
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', width: '100%' }}>
              <Button variant="outline" size="sm" onClick={() => setDocActionModal(null)} style={{ borderRadius: '4px' }}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                style={{
                  backgroundColor: docActionModal.action === 'reject' ? '#dc2626' : '#2C3480',
                  borderColor: docActionModal.action === 'reject' ? '#dc2626' : '#2C3480',
                  borderRadius: '4px',
                  fontWeight: 700
                }}
                onClick={handleConfirmDocAction}
              >
                Confirm Action
              </Button>
            </div>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <p style={{ fontSize: '0.8125rem', color: '#475569', margin: 0 }}>
              {docActionModal.action === 'reject'
                ? 'Specify the official reason for rejecting this document. The driver will be notified.'
                : docActionModal.action === 'resubmit'
                ? 'Provide clear correction instructions for the driver to resubmit a compliant copy.'
                : 'Enter internal notes for MAK compliance records.'}
            </p>

            <textarea
              rows={3}
              value={docActionInput}
              onChange={(e) => setDocActionInput(e.target.value)}
              placeholder="Enter note or reason..."
              style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.8125rem', fontFamily: 'inherit' }}
            />
          </div>
        </Modal>
      )}

      {/* ========================================================
          HIGH-RES DOCUMENT PREVIEW MODAL
          ======================================================== */}
      {previewDocUrl && (
        <Modal
          isOpen={Boolean(previewDocUrl)}
          onClose={() => setPreviewDocUrl(null)}
          title={previewDocTitle}
          size="lg"
          footer={
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
              <a href={previewDocUrl} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                <Button variant="outline" size="sm" leftIcon={<ExternalLink size={14} />} style={{ borderRadius: '4px' }}>
                  Open in New Tab
                </Button>
              </a>
              <Button variant="primary" size="sm" onClick={() => setPreviewDocUrl(null)} style={{ backgroundColor: '#2C3480', borderRadius: '4px' }}>
                Close Preview
              </Button>
            </div>
          }
        >
          <div style={{ textAlign: 'center' }}>
            <img
              src={previewDocUrl}
              alt={previewDocTitle}
              style={{ maxWidth: '100%', maxHeight: '68vh', borderRadius: '6px', border: '1px solid #cbd5e1', objectFit: 'contain' }}
            />
          </div>
        </Modal>
      )}

      {/* ========================================================
          REJECT APPLICATION MODAL
          ======================================================== */}
      {rejectModalApp && (
        <Modal
          isOpen={Boolean(rejectModalApp)}
          onClose={() => setRejectModalApp(null)}
          title={`Reject Application #${rejectModalApp.id}`}
          subtitle={`Applicant: ${rejectModalApp.fullName}`}
          size="md"
          footer={
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', width: '100%' }}>
              <Button variant="outline" size="sm" onClick={() => setRejectModalApp(null)} style={{ borderRadius: '4px' }}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                style={{ backgroundColor: '#dc2626', borderColor: '#dc2626', fontWeight: 700, borderRadius: '4px' }}
                onClick={handleConfirmRejectApp}
              >
                Confirm Rejection
              </Button>
            </div>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <p style={{ fontSize: '0.875rem', color: '#334155', margin: 0 }}>
              Specify the official compliance reason for rejecting this driver application:
            </p>

            <select
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.875rem', backgroundColor: '#fff' }}
            >
              <option value="Driving license or badge scan was unreadable">Driving license or badge scan was unreadable</option>
              <option value="Commercial transport license has expired with RTO">Commercial transport license has expired with RTO</option>
              <option value="Police Verification Certificate expired or invalid">Police Verification Certificate expired or invalid</option>
              <option value="Annual Medical Fitness Certificate failed or expired">Annual Medical Fitness Certificate failed or expired</option>
              <option value="Bank details or cancelled cheque unverified">Bank details or cancelled cheque unverified</option>
            </select>

            <textarea
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.8125rem' }}
              placeholder="Customize official rejection remarks..."
            />
          </div>
        </Modal>
      )}
    </div>
  );
}

export default DriverApplications;
