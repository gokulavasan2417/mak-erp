// MAK Tours & Travels ERP - Driver Documents & Compliance Verification
// Complete Statutory Compliance System: License, Identity, PVC, Bank & Medical Verification
import React, { useState, useRef, useMemo } from 'react';
import {
  FileCheck,
  UploadCloud,
  CheckCircle,
  AlertTriangle,
  Clock,
  Eye,
  RefreshCw,
  ShieldCheck,
  FileText,
  Plus,
  Download,
  Trash2,
  ArrowRight,
  CheckCircle2,
  X,
  CreditCard,
  Building,
  UserCheck,
  ExternalLink,
  HelpCircle,
  File
} from 'lucide-react';
import { Breadcrumbs } from '../../components/common/Breadcrumbs';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { useDriverData } from '../../context/DriverDataContext';
import { useToast } from '../../context/ToastContext';

export function DriverDocuments() {
  const toast = useToast();
  const {
    driver,
    documents = [],
    replaceDocument,
    uploadNewDocument,
    removeDocument
  } = useDriverData();

  const safeDocs = Array.isArray(documents) ? documents : [];

  // Active document modals
  const [selectedDocForPreview, setSelectedDocForPreview] = useState(null);
  const [selectedDocForReplace, setSelectedDocForReplace] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [deleteConfirmDoc, setDeleteConfirmDoc] = useState(null);

  // Replace / Resubmit Form State
  const [newExpiryDate, setNewExpiryDate] = useState('');
  const [newUploadedFileName, setNewUploadedFileName] = useState('');
  const [newUploadedFileUrl, setNewUploadedFileUrl] = useState('');
  const [replaceNotes, setReplaceNotes] = useState('');
  const replaceFileInputRef = useRef(null);

  // Add Document Form State
  const [addDocType, setAddDocType] = useState('Address Proof');
  const [addDocTitle, setAddDocTitle] = useState('');
  const [addDocNumber, setAddDocNumber] = useState('');
  const [addAddressProofType, setAddAddressProofType] = useState('Electricity Bill');
  const [addExpiryDate, setAddExpiryDate] = useState('');
  const [addFileName, setAddFileName] = useState('');
  const [addFileUrl, setAddFileUrl] = useState('');
  const addFileInputRef = useRef(null);

  // Dynamic Expiry Calculation with configurable thresholds (30, 15, 7 days, Expired)
  const getExpiryStatus = (expiryDate) => {
    if (!expiryDate) {
      return {
        label: 'Lifetime / No Expiry',
        color: '#16a34a',
        bg: '#f0fdf4',
        border: '#bbf7d0',
        daysRemaining: Infinity,
        isExpiring: false,
        isExpired: false
      };
    }
    const expiry = new Date(expiryDate).getTime();
    const now = new Date('2026-11-10').getTime();
    const diffDays = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return {
        label: `Expired (${Math.abs(diffDays)} days ago)`,
        color: '#dc2626',
        bg: '#fef2f2',
        border: '#fecaca',
        daysRemaining: diffDays,
        isExpiring: false,
        isExpired: true
      };
    }
    if (diffDays <= 7) {
      return {
        label: `Critical: Expires in ${diffDays} days`,
        color: '#dc2626',
        bg: '#fef2f2',
        border: '#fecaca',
        daysRemaining: diffDays,
        isExpiring: true,
        isExpired: false
      };
    }
    if (diffDays <= 15) {
      return {
        label: `Urgent: Expires in ${diffDays} days`,
        color: '#ea580c',
        bg: '#fff7ed',
        border: '#ffedd5',
        daysRemaining: diffDays,
        isExpiring: true,
        isExpired: false
      };
    }
    if (diffDays <= 45) {
      return {
        label: `Expiring Soon (${diffDays} days)`,
        color: '#d97706',
        bg: '#fffbeb',
        border: '#fde68a',
        daysRemaining: diffDays,
        isExpiring: true,
        isExpired: false
      };
    }
    return {
      label: `Valid until ${expiryDate}`,
      color: '#16a34a',
      bg: '#f0fdf4',
      border: '#bbf7d0',
      daysRemaining: diffDays,
      isExpiring: false,
      isExpired: false
    };
  };

  // Urgent expiring documents
  const expiringDocs = useMemo(() => {
    return safeDocs.filter((d) => {
      const exp = getExpiryStatus(d.expiryDate);
      return exp.isExpiring || exp.isExpired;
    });
  }, [safeDocs]);

  // Verification Summary Metrics
  const summaryMetrics = useMemo(() => {
    const total = safeDocs.length;
    const verified = safeDocs.filter((d) => d.status === 'Verified').length;
    const underReview = safeDocs.filter((d) => d.status === 'Under Review' || d.status === 'Pending').length;
    const rejected = safeDocs.filter((d) => d.status === 'Rejected' || d.status === 'Resubmission Required').length;
    const mandatoryTotal = safeDocs.filter((d) => d.required).length;
    const mandatoryVerified = safeDocs.filter((d) => d.required && d.status === 'Verified').length;
    const progressPercent = total > 0 ? Math.round((verified / total) * 100) : 0;
    return { total, verified, underReview, rejected, mandatoryTotal, mandatoryVerified, progressPercent };
  }, [safeDocs]);

  // File Handlers
  const handleReplaceFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size exceeds the 5MB statutory limit. Please compress the file.');
        return;
      }
      setNewUploadedFileName(file.name);
      const url = URL.createObjectURL(file);
      setNewUploadedFileUrl(url);
      toast.success(`Attached: ${file.name}`);
    }
  };

  const handleConfirmReplace = () => {
    if (!selectedDocForReplace) return;
    replaceDocument(
      selectedDocForReplace.id,
      newUploadedFileUrl || selectedDocForReplace.fileUrl,
      newExpiryDate !== '' ? newExpiryDate : selectedDocForReplace.expiryDate,
      newUploadedFileName || selectedDocForReplace.fileName,
      replaceNotes
    );
    setSelectedDocForReplace(null);
    setNewUploadedFileName('');
    setNewUploadedFileUrl('');
    setReplaceNotes('');
    setNewExpiryDate('');
  };

  const handleAddFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size exceeds the 5MB statutory limit.');
        return;
      }
      setAddFileName(file.name);
      const url = URL.createObjectURL(file);
      setAddFileUrl(url);
      toast.success(`Attached: ${file.name}`);
    }
  };

  const handleConfirmAddDocument = (e) => {
    e.preventDefault();
    if (!addDocTitle.trim()) {
      toast.error('Please enter a document title');
      return;
    }
    if (!addDocNumber.trim()) {
      toast.error('Please enter the document reference number');
      return;
    }
    uploadNewDocument({
      type: addDocType,
      title: addDocTitle,
      description: `Uploaded supporting ${addDocType} record (${addAddressProofType || ''})`,
      documentNumber: addDocNumber,
      holderName: driver?.fullName || 'Arun Kumar Sundaram',
      addressProofType: addDocType === 'Address Proof' ? addAddressProofType : undefined,
      required: false,
      issueDate: new Date().toISOString().substring(0, 10),
      expiryDate: addExpiryDate || null,
      fileUrl: addFileUrl || 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=800&q=80',
      fileName: addFileName || `${addDocTitle.replace(/\s+/g, '_')}.pdf`,
      fileSize: '1.1 MB',
      fileType: 'pdf'
    });
    setIsAddModalOpen(false);
    setAddDocTitle('');
    setAddDocNumber('');
    setAddExpiryDate('');
    setAddFileName('');
    setAddFileUrl('');
  };

  const handleConfirmRemove = () => {
    if (!deleteConfirmDoc) return;
    removeDocument(deleteConfirmDoc.id);
    setDeleteConfirmDoc(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', width: '100%', paddingBottom: '3rem' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
        <div>
          <Breadcrumbs portal="driver" />
          <h1 style={{ fontSize: '1.625rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.25rem' }}>
            Compliance Documents &amp; License Validity
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Statutory commercial driving badge, police background clearance, and medical fitness records.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <Button
            variant="primary"
            size="sm"
            style={{ backgroundColor: '#2C3480', borderColor: '#2C3480', fontWeight: 700, borderRadius: '6px' }}
            leftIcon={<Plus size={15} />}
            onClick={() => setIsAddModalOpen(true)}
          >
            Upload Supporting Document
          </Button>
        </div>
      </div>

      {/* Driver Registration & Verification Progress Indicator (Section 3) */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '6px',
          border: '1px solid #e2e8f0',
          padding: '1.25rem 1.5rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#2C3480', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Registration &amp; Statutory Compliance Progress
            </span>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', margin: '0.15rem 0 0' }}>
              {summaryMetrics.verified} of {summaryMetrics.total} Documents Verified ({summaryMetrics.progressPercent}%)
            </h3>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, backgroundColor: '#dcfce7', color: '#15803d', padding: '0.25rem 0.65rem', borderRadius: '4px', border: '1px solid #bbf7d0' }}>
              ✓ Driver Account Active
            </span>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, backgroundColor: '#EEF0FD', color: '#2C3480', padding: '0.25rem 0.65rem', borderRadius: '4px', border: '1px solid #c7cefa' }}>
              Ready for Dispatch
            </span>
          </div>
        </div>

        {/* 5-Step Visual Progress Bar */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem', position: 'relative' }}>
          {[
            { step: '1', title: 'Registration', status: 'Completed', detail: 'Profile & KYC submitted' },
            { step: '2', title: 'Documents Uploaded', status: 'Completed', detail: `${summaryMetrics.total} statutory records` },
            { step: '3', title: 'Admin Verification', status: 'Active', detail: `${summaryMetrics.verified} approved by Ops` },
            { step: '4', title: 'Background Check', status: 'Completed', detail: 'Police PVC cleared' },
            { step: '5', title: 'Account Activated', status: 'Completed', detail: 'Authorized for duty' }
          ].map((st, i) => (
            <div
              key={st.title}
              style={{
                backgroundColor: st.status === 'Completed' ? '#f0fdf4' : st.status === 'Active' ? '#f8faff' : '#f8fafc',
                border: `1px solid ${st.status === 'Completed' ? '#bbf7d0' : st.status === 'Active' ? '#c7cefa' : '#e2e8f0'}`,
                borderLeft: st.status === 'Completed' ? '4px solid #16a34a' : st.status === 'Active' ? '4px solid #2C3480' : '4px solid #94a3b8',
                borderRadius: '4px',
                padding: '0.65rem 0.85rem'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.6875rem', fontWeight: 800, color: st.status === 'Completed' ? '#15803d' : '#2C3480' }}>
                  STEP {st.step}
                </span>
                {st.status === 'Completed' && <CheckCircle2 size={13} color="#16a34a" />}
              </div>
              <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#0f172a', marginTop: '0.15rem' }}>
                {st.title}
              </div>
              <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '0.1rem' }}>
                {st.detail}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Proactive Document Expiry Advisory Banners (Section 6) */}
      {expiringDocs.map((doc) => {
        const exp = getExpiryStatus(doc.expiryDate);
        return (
          <div
            key={doc.id}
            style={{
              backgroundColor: exp.bg,
              border: `1px solid ${exp.border}`,
              borderLeft: `4px solid ${exp.color}`,
              borderRadius: '6px',
              padding: '1rem 1.25rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem',
              flexWrap: 'wrap'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <AlertTriangle size={22} color={exp.color} style={{ flexShrink: 0 }} />
              <div>
                <div style={{ fontWeight: 800, fontSize: '0.875rem', color: exp.color }}>
                  Statutory Renewal Advisory: {doc.title}
                </div>
                <div style={{ fontSize: '0.8125rem', color: '#475569', marginTop: '0.15rem' }}>
                  Your document expires on <strong>{doc.expiryDate}</strong> ({exp.daysRemaining} days remaining). Please submit renewed clearance before the deadline to prevent duty assignment hold.
                </div>
              </div>
            </div>

            <Button
              variant="primary"
              size="sm"
              style={{ backgroundColor: exp.color, borderColor: exp.color, borderRadius: '4px', fontWeight: 700 }}
              onClick={() => {
                setSelectedDocForReplace(doc);
                setNewExpiryDate(doc.expiryDate || '');
              }}
            >
              Renew Now
            </Button>
          </div>
        );
      })}

      {/* Document Verification Summary Metrics (Section 5) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        <div style={{ backgroundColor: '#ffffff', borderRadius: '6px', border: '1px solid #e2e8f0', padding: '1rem 1.25rem' }}>
          <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>
            Total Documents Filed
          </span>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', marginTop: '0.2rem' }}>
            {summaryMetrics.total}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.15rem' }}>
            {summaryMetrics.mandatoryTotal} mandatory records
          </div>
        </div>

        <div style={{ backgroundColor: '#ffffff', borderRadius: '6px', border: '1px solid #e2e8f0', padding: '1rem 1.25rem' }}>
          <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#16a34a', textTransform: 'uppercase' }}>
            Verified by Admin
          </span>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#15803d', marginTop: '0.2rem' }}>
            {summaryMetrics.verified}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: 600, marginTop: '0.15rem' }}>
            ✓ Sarathi &amp; UIDAI verified
          </div>
        </div>

        <div style={{ backgroundColor: '#ffffff', borderRadius: '6px', border: '1px solid #e2e8f0', padding: '1rem 1.25rem' }}>
          <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#d97706', textTransform: 'uppercase' }}>
            Under Review / Pending
          </span>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#b45309', marginTop: '0.2rem' }}>
            {summaryMetrics.underReview}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.15rem' }}>
            In Operations review queue
          </div>
        </div>

        <div style={{ backgroundColor: '#ffffff', borderRadius: '6px', border: '1px solid #e2e8f0', padding: '1rem 1.25rem' }}>
          <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#2563eb', textTransform: 'uppercase' }}>
            Expiring Within 45 Days
          </span>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1d4ed8', marginTop: '0.2rem' }}>
            {expiringDocs.length}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#1d4ed8', fontWeight: 600, marginTop: '0.15rem' }}>
            Annual Medical Clearance
          </div>
        </div>
      </div>

      {/* Main Documents Grid: Straight Rectangular Cards (Section 2 & 5) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {safeDocs.map((doc) => {
          const exp = getExpiryStatus(doc.expiryDate);
          const isUnderReview = doc.status === 'Under Review' || doc.status === 'Pending';
          const isVerified = doc.status === 'Verified';
          const isRejected = doc.status === 'Rejected' || doc.status === 'Resubmission Required';

          return (
            <div
              key={doc.id}
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '6px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
                padding: '1.25rem 1.5rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.875rem'
              }}
            >
              {/* Top Row: Title, Category, Mandatory Tag & Status Badges */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                  <div
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '6px',
                      backgroundColor: '#EEF0FD',
                      border: '1px solid #c7cefa',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#2C3480',
                      flexShrink: 0
                    }}
                  >
                    {doc.type === 'Driving License' && <ShieldCheck size={22} />}
                    {doc.type === 'Identity Proof' && <UserCheck size={22} />}
                    {doc.type === 'PAN Card' && <CreditCard size={22} />}
                    {doc.type === 'Police Verification' && <FileCheck size={22} />}
                    {doc.type === 'Bank Details' && <Building size={22} />}
                    {doc.type === 'Medical Certificate' && <FileText size={22} />}
                    {doc.type === 'Address Proof' && <File size={22} />}
                  </div>

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                        {doc.title}
                      </h3>
                      {doc.required ? (
                        <span style={{ fontSize: '0.6875rem', fontWeight: 700, backgroundColor: '#f1f5f9', color: '#475569', padding: '0.15rem 0.45rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}>
                          MANDATORY
                        </span>
                      ) : (
                        <span style={{ fontSize: '0.6875rem', fontWeight: 700, backgroundColor: '#f8fafc', color: '#64748b', padding: '0.15rem 0.45rem', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
                          OPTIONAL
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '0.8125rem', color: '#64748b', marginTop: '0.2rem' }}>
                      {doc.description}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {/* Verification Status */}
                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      backgroundColor: isVerified ? '#dcfce7' : isUnderReview ? '#e0f2fe' : '#fee2e2',
                      color: isVerified ? '#15803d' : isUnderReview ? '#0369a1' : '#b91c1c',
                      padding: '0.25rem 0.65rem',
                      borderRadius: '4px',
                      border: `1px solid ${isVerified ? '#bbf7d0' : isUnderReview ? '#bae6fd' : '#fca5a5'}`
                    }}
                  >
                    {isVerified ? '✓ Verified' : isUnderReview ? '⏳ Under Review' : '⚠ Resubmission Required'}
                  </span>

                  {/* Expiry Badge */}
                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      backgroundColor: exp.bg,
                      color: exp.color,
                      border: `1px solid ${exp.border}`,
                      padding: '0.25rem 0.65rem',
                      borderRadius: '4px'
                    }}
                  >
                    {exp.label}
                  </span>
                </div>
              </div>

              {/* Middle Row: Document Metadata Grid */}
              <div
                style={{
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  padding: '0.875rem 1.25rem',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '0.875rem',
                  fontSize: '0.8125rem'
                }}
              >
                <div>
                  <span style={{ color: '#64748b', display: 'block', fontSize: '0.725rem', fontWeight: 600 }}>DOCUMENT / REG NUMBER</span>
                  <strong className="font-mono" style={{ color: '#0f172a', fontSize: '0.875rem' }}>
                    {doc.documentNumber || 'TN-07-2015-0089123'}
                  </strong>
                </div>

                <div>
                  <span style={{ color: '#64748b', display: 'block', fontSize: '0.725rem', fontWeight: 600 }}>HOLDER NAME</span>
                  <strong style={{ color: '#0f172a' }}>{doc.holderName || driver?.fullName}</strong>
                </div>

                <div>
                  <span style={{ color: '#64748b', display: 'block', fontSize: '0.725rem', fontWeight: 600 }}>ATTACHED FILE &amp; SIZE</span>
                  <span style={{ color: '#0f172a', fontWeight: 600 }}>
                    {doc.fileName} <span style={{ color: '#64748b' }}>({doc.fileSize})</span>
                  </span>
                </div>

                <div>
                  <span style={{ color: '#64748b', display: 'block', fontSize: '0.725rem', fontWeight: 600 }}>UPLOAD DATE</span>
                  <span style={{ color: '#0f172a', fontWeight: 600 }}>{doc.uploadDate}</span>
                </div>

                {doc.verifiedBy && (
                  <div>
                    <span style={{ color: '#64748b', display: 'block', fontSize: '0.725rem', fontWeight: 600 }}>VERIFIED BY</span>
                    <span style={{ color: '#15803d', fontWeight: 600 }}>
                      ✓ {doc.verifiedBy} ({doc.verifiedAt?.substring(0, 10)})
                    </span>
                  </div>
                )}
              </div>

              {/* Rejection / Resubmission Alert if applicable */}
              {isRejected && (
                <div
                  style={{
                    backgroundColor: '#FEF2F2',
                    border: '1px solid #FECACA',
                    borderRadius: '6px',
                    padding: '0.75rem 1rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '0.75rem',
                    flexWrap: 'wrap'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#991B1B', fontSize: '0.8125rem' }}>
                    <AlertTriangle size={18} />
                    <span>
                      <strong>Rejection Reason:</strong> {doc.rejectionReason || 'Document was blurry, illegible or details did not match Parivahan record.'}
                    </span>
                  </div>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => {
                      setSelectedDocForReplace(doc);
                      setNewExpiryDate(doc.expiryDate || '');
                    }}
                  >
                    Resubmit Corrected File
                  </Button>
                </div>
              )}

              {/* Bottom Actions Row */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', paddingTop: '0.25rem' }}>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                  {doc.internalRemarks ? (
                    <span><strong>Compliance Note:</strong> {doc.internalRemarks}</span>
                  ) : (
                    <span>Authorized compliance record under MAK transport regulations.</span>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Button
                    variant="secondary"
                    size="sm"
                    style={{ borderRadius: '4px' }}
                    leftIcon={<Eye size={14} />}
                    onClick={() => setSelectedDocForPreview(doc)}
                  >
                    Preview Document
                  </Button>

                  <Button
                    variant="secondary"
                    size="sm"
                    style={{ borderRadius: '4px' }}
                    leftIcon={<RefreshCw size={14} />}
                    onClick={() => {
                      setSelectedDocForReplace(doc);
                      setNewExpiryDate(doc.expiryDate || '');
                    }}
                  >
                    Replace / Renew
                  </Button>

                  {!doc.required && (
                    <Button
                      variant="ghost"
                      size="sm"
                      style={{ color: '#dc2626', borderRadius: '4px' }}
                      leftIcon={<Trash2 size={14} />}
                      onClick={() => setDeleteConfirmDoc(doc)}
                    >
                      Remove
                    </Button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal 1: Document Preview Modal */}
      <Modal
        isOpen={Boolean(selectedDocForPreview)}
        onClose={() => setSelectedDocForPreview(null)}
        title={selectedDocForPreview?.title || 'Document Inspection Preview'}
        subtitle={`Reference #${selectedDocForPreview?.documentNumber} • Holder: ${selectedDocForPreview?.holderName}`}
        size="lg"
      >
        {selectedDocForPreview && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ backgroundColor: '#f8fafc', padding: '0.75rem 1rem', borderRadius: '6px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Statutory Record Status:</span>
                <span style={{ fontWeight: 700, color: '#15803d', marginLeft: '0.5rem' }}>
                  ✓ {selectedDocForPreview.status}
                </span>
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                Uploaded: {selectedDocForPreview.uploadDate} ({selectedDocForPreview.fileSize})
              </div>
            </div>

            {/* Document Preview Area */}
            <div
              style={{
                width: '100%',
                maxHeight: '440px',
                backgroundColor: '#f1f5f9',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0.5rem'
              }}
            >
              <img
                src={selectedDocForPreview.fileUrl}
                alt={selectedDocForPreview.title}
                style={{ maxWidth: '100%', maxHeight: '420px', objectFit: 'contain', borderRadius: '4px' }}
              />
            </div>

            {selectedDocForPreview.backImageUrl && (
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '0.35rem' }}>
                  Back Side Scan (License Badge Details):
                </span>
                <div style={{ width: '100%', maxHeight: '220px', backgroundColor: '#f1f5f9', borderRadius: '6px', border: '1px solid #cbd5e1', overflow: 'hidden', padding: '0.5rem', display: 'flex', justifyContent: 'center' }}>
                  <img
                    src={selectedDocForPreview.backImageUrl}
                    alt="Back Scan"
                    style={{ maxHeight: '200px', objectFit: 'contain' }}
                  />
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.5rem', borderTop: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: '0.8125rem', color: '#64748b' }}>
                File: <strong style={{ color: '#0f172a' }}>{selectedDocForPreview.fileName}</strong>
              </span>

              <a
                href={selectedDocForPreview.fileUrl}
                download={selectedDocForPreview.fileName}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  fontSize: '0.8125rem',
                  fontWeight: 700,
                  color: '#2C3480',
                  textDecoration: 'none',
                  padding: '0.35rem 0.75rem',
                  backgroundColor: '#EEF0FD',
                  borderRadius: '4px'
                }}
              >
                <Download size={14} /> Download Secure Copy
              </a>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal 2: Replace / Renew Document Modal */}
      <Modal
        isOpen={Boolean(selectedDocForReplace)}
        onClose={() => setSelectedDocForReplace(null)}
        title={`Renew / Replace: ${selectedDocForReplace?.title}`}
        subtitle={`Reference #${selectedDocForReplace?.documentNumber}`}
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', width: '100%' }}>
            <Button variant="ghost" onClick={() => setSelectedDocForReplace(null)}>Cancel</Button>
            <Button
              variant="primary"
              style={{ backgroundColor: '#2C3480', borderColor: '#2C3480', fontWeight: 700, borderRadius: '4px' }}
              onClick={handleConfirmReplace}
            >
              Submit for Admin Verification
            </Button>
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
              Statutory Expiry Date (Per renewed certificate) *
            </label>
            <Input
              type="date"
              value={newExpiryDate}
              onChange={(e) => setNewExpiryDate(e.target.value)}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
              Upload Scanned Document (PDF, JPG, PNG &lt; 5MB) *
            </label>
            <input
              type="file"
              ref={replaceFileInputRef}
              accept="image/*,application/pdf"
              onChange={handleReplaceFileSelect}
              style={{ display: 'none' }}
            />
            <div
              style={{
                border: '2px dashed #cbd5e1',
                borderRadius: '6px',
                padding: '1.5rem',
                textAlign: 'center',
                backgroundColor: '#f8fafc',
                cursor: 'pointer'
              }}
              onClick={() => replaceFileInputRef.current?.click()}
            >
              <UploadCloud size={28} color="#2C3480" style={{ margin: '0 auto 0.5rem' }} />
              <p style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                {newUploadedFileName ? `Selected: ${newUploadedFileName}` : 'Click to select renewed copy or drag here'}
              </p>
              <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '0.25rem 0 0 0' }}>
                Supported: PDF, JPG, JPEG, PNG (Max 5MB)
              </p>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
              Notes for Operations Verification Desk
            </label>
            <Input
              placeholder="e.g. Annual renewal cleared at Dr. Rajesh Eye Clinic, Chennai"
              value={replaceNotes}
              onChange={(e) => setReplaceNotes(e.target.value)}
            />
          </div>
        </div>
      </Modal>

      {/* Modal 3: Add Supporting Document Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Upload Supporting Compliance Document"
        subtitle="Add voter ID, passport, or current residence address proof"
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', width: '100%' }}>
            <Button variant="ghost" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
            <Button
              variant="primary"
              style={{ backgroundColor: '#2C3480', borderColor: '#2C3480', fontWeight: 700, borderRadius: '4px' }}
              onClick={handleConfirmAddDocument}
            >
              Upload &amp; Submit
            </Button>
          </div>
        }
      >
        <form onSubmit={handleConfirmAddDocument} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
              Document Category *
            </label>
            <select
              value={addDocType}
              onChange={(e) => setAddDocType(e.target.value)}
              style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.8125rem' }}
            >
              <option value="Address Proof">Current Address Proof</option>
              <option value="Passport">Passport</option>
              <option value="Voter ID">Voter ID</option>
              <option value="Hill Driving Certification">Hill / Ghat Road Driving Certification</option>
              <option value="Other Certification">Other Training / Defense Driving Certificate</option>
            </select>
          </div>

          {addDocType === 'Address Proof' && (
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                Address Proof Type *
              </label>
              <select
                value={addAddressProofType}
                onChange={(e) => setAddAddressProofType(e.target.value)}
                style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.8125rem' }}
              >
                <option value="Electricity Bill">Electricity Bill (TNEB / Bescom / etc.)</option>
                <option value="Rental Agreement">Registered Rental Agreement</option>
                <option value="Bank Statement">Nationalized Bank Passbook / Statement</option>
                <option value="Gas Bill">Piped Gas / LPG Connection Voucher</option>
                <option value="Telephone Bill">BSNL / Postpaid Landline Bill</option>
              </select>
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
              Document Title *
            </label>
            <Input
              placeholder="e.g. TNEB Electricity Bill - Oct 2026"
              value={addDocTitle}
              onChange={(e) => setAddDocTitle(e.target.value)}
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
              Document Reference Number *
            </label>
            <Input
              placeholder="e.g. EB-0982-4412"
              value={addDocNumber}
              onChange={(e) => setAddDocNumber(e.target.value)}
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
              Expiry Date (if applicable)
            </label>
            <Input
              type="date"
              value={addExpiryDate}
              onChange={(e) => setAddExpiryDate(e.target.value)}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
              Upload Scanned Copy (PDF, JPG, PNG &lt; 5MB) *
            </label>
            <input
              type="file"
              ref={addFileInputRef}
              accept="image/*,application/pdf"
              onChange={handleAddFileSelect}
              style={{ display: 'none' }}
            />
            <div
              style={{
                border: '2px dashed #cbd5e1',
                borderRadius: '6px',
                padding: '1.25rem',
                textAlign: 'center',
                backgroundColor: '#f8fafc',
                cursor: 'pointer'
              }}
              onClick={() => addFileInputRef.current?.click()}
            >
              <UploadCloud size={24} color="#2C3480" style={{ margin: '0 auto 0.35rem' }} />
              <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#0f172a', margin: 0 }}>
                {addFileName ? `Selected: ${addFileName}` : 'Click to select file'}
              </p>
            </div>
          </div>
        </form>
      </Modal>

      {/* Modal 4: Remove Confirmation Modal */}
      <Modal
        isOpen={Boolean(deleteConfirmDoc)}
        onClose={() => setDeleteConfirmDoc(null)}
        title="Remove Supporting Document"
        subtitle={`Document #${deleteConfirmDoc?.id}`}
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeleteConfirmDoc(null)}>Keep Document</Button>
            <Button variant="danger" onClick={handleConfirmRemove}>
              <Trash2 size={14} style={{ marginRight: '0.35rem' }} /> Yes, Remove
            </Button>
          </>
        }
      >
        {deleteConfirmDoc && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <p style={{ fontSize: '0.875rem', color: '#0f172a', margin: 0 }}>
              Are you sure you want to remove <strong>"{deleteConfirmDoc.title}"</strong>?
            </p>
            <p style={{ fontSize: '0.8125rem', color: '#64748b', margin: 0 }}>
              This document will be deleted from your driver profile and compliance records.
            </p>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default DriverDocuments;
