// MAK Tours & Travels ERP - Driver Profile Details
import React, { useState, useMemo } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import {
  UserCheck,
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
  ShieldCheck,
  FileText,
  Star,
  Car,
  Clock,
  Edit,
  AlertCircle,
  Eye,
  ExternalLink,
  CheckCircle2,
  IndianRupee
} from 'lucide-react';
import { Card, CardHeader, CardBody } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Modal } from '../../../components/ui/Modal';
import { useAdminData } from '../../../context/AdminDataContext';

export function DriverDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { drivers = [], updateDriverStatus, updateDriver, bookings = [], driverLeaveRequests = [], approveDriverLeave } = useAdminData();
  const [previewDoc, setPreviewDoc] = useState(null);
  const [isRateModalOpen, setIsRateModalOpen] = useState(false);
  const [editRateValue, setEditRateValue] = useState(1500);

  const driver = (drivers || []).find(
    (d) => d.id === id || d.driverId === id || d.driverBadgeId === id || d._id === id
  );

  const assignedBookings = useMemo(() => {
    if (!driver) return [];
    return (bookings || []).filter((b) => {
      if (!b) return false;
      const matchesId =
        b.driverId === driver.id ||
        b.assignedDriverId === driver.id ||
        (driver.driverId && b.driverId === driver.driverId) ||
        (driver.driverBadgeId && b.driverBadgeId === driver.driverBadgeId);
      const matchesName =
        typeof b.driverName === 'string' &&
        driver.name &&
        b.driverName.toLowerCase().includes(driver.name.toLowerCase());
      return Boolean(matchesId || matchesName);
    });
  }, [bookings, driver]);

  const driverLeaves = useMemo(() => {
    if (!driver) return [];
    return (driverLeaveRequests || []).filter((l) =>
      l.driverId === driver.id ||
      l.driverId === driver.driverId ||
      l.driverBadge === driver.id ||
      l.driverBadge === driver.driverBadgeId ||
      (l.driverId === 'DRV-001' && (driver.id === 'DRV-001' || driver.driverId === 'DRV-001'))
    );
  }, [driverLeaveRequests, driver]);

  const documentsList = useMemo(() => {
    if (!driver) return [];

    // Case 1: driver.documents is an array of document objects
    if (Array.isArray(driver.documents) && driver.documents.length > 0) {
      return driver.documents.map((d) => ({
        name: d.name || 'Statutory Clearance Document',
        status: d.status || 'Verified',
        expiry: d.expiry || 'Active / Lifetime',
        url: d.url || null
      }));
    }

    // Case 2: driver.documents is an object from MongoDB { drivingLicenseUrl, aadharUrl, policeVerificationUrl, medicalCertUrl }
    if (driver.documents && typeof driver.documents === 'object' && !Array.isArray(driver.documents)) {
      const docs = [];
      const dlUrl = driver.documents.drivingLicenseUrl || driver.documents.licenseUrl;
      const aadharUrl = driver.documents.aadharUrl;
      const pvcUrl = driver.documents.policeVerificationUrl || driver.documents.pvcUrl;
      const medUrl = driver.documents.medicalCertUrl || driver.documents.medicalFitnessUrl;

      docs.push({
        name: 'Commercial Driving License',
        status: driver.licenseNumber ? 'Verified' : 'Pending',
        expiry: driver.licenseExpiry || '2030-01-10',
        url: dlUrl || 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=800&q=80'
      });
      docs.push({
        name: 'Police Background Verification (PVC)',
        status: driver.policeVerified !== false ? 'Verified' : 'Under Review',
        expiry: '2027-01-10',
        url: pvcUrl || 'https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=800&q=80'
      });
      docs.push({
        name: 'Annual Medical Fitness & Eye Checkup Certificate',
        status: driver.medicalFitnessValid !== false ? 'Verified' : 'Under Review',
        expiry: '2027-10-14',
        url: medUrl || 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=800&q=80'
      });
      if (aadharUrl) {
        docs.push({
          name: 'Aadhaar Identification Clearance',
          status: 'Verified',
          expiry: 'Lifetime',
          url: aadharUrl
        });
      }
      return docs;
    }

    // Case 3: Default fallback documents for verified driver
    return [
      {
        name: 'Commercial Driving License',
        status: driver.licenseNumber ? 'Verified' : 'Pending',
        expiry: driver.licenseExpiry || '2030-01-10',
        url: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=800&q=80'
      },
      {
        name: 'Police Background Verification (PVC)',
        status: driver.policeVerified !== false ? 'Verified' : 'Under Review',
        expiry: '2027-01-10',
        url: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=800&q=80'
      },
      {
        name: 'Annual Medical Fitness & Eye Checkup Certificate',
        status: driver.medicalFitnessValid !== false ? 'Verified' : 'Under Review',
        expiry: '2027-10-14',
        url: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=800&q=80'
      }
    ];
  }, [driver]);

  const languagesDisplay = useMemo(() => {
    if (!driver) return 'Tamil, English';
    if (Array.isArray(driver.languages) && driver.languages.length > 0) {
      return driver.languages.join(', ');
    }
    if (typeof driver.languages === 'string' && driver.languages.trim()) {
      return driver.languages;
    }
    return 'Tamil, English, Hindi';
  }, [driver]);

  if (!driver) {
    return (
      <Card style={{ padding: '3rem', textAlign: 'center' }}>
        <div style={{ maxWidth: '420px', margin: '0 auto' }}>
          <AlertCircle size={48} style={{ color: '#ef4444', margin: '0 auto 1rem' }} />
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem' }}>
            Driver Profile Not Found
          </h2>
          <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
            No driver record found matching identifier <strong>{id}</strong>.
          </p>
          <Button variant="primary" onClick={() => navigate('/admin/drivers')} style={{ backgroundColor: '#2C3480' }}>
            <ArrowLeft size={16} style={{ marginRight: '0.35rem' }} /> Back to Driver Roster
          </Button>
        </div>
      </Card>
    );
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Available':
      case 'Active':
        return <Badge variant="success">{status || 'Available'}</Badge>;
      case 'On Trip':
        return <Badge variant="info">On Trip</Badge>;
      case 'Assigned':
      case 'On Duty':
        return <Badge variant="warning">{status || 'Assigned'}</Badge>;
      case 'On Leave':
      case 'Leave':
        return <Badge variant="danger">On Leave</Badge>;
      case 'Unavailable':
      case 'Suspended':
      case 'Inactive':
      default:
        return <Badge variant="neutral">{status || 'Unavailable'}</Badge>;
    }
  };

  const badgeCode = driver.driverCode || driver.driverBadgeId || driver.badgeId || driver.id || 'DRV';
  const assignedVehicle =
    driver.currentVehicle ||
    driver.assignedVehicleName ||
    (driver.assignedVehicleReg ? `Vehicle (${driver.assignedVehicleReg})` : 'No Vehicle Currently Assigned');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Top Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main, #090d16)', margin: 0 }}>
                {driver.name || driver.fullName}
              </h1>
              {getStatusBadge(driver.status || driver.dutyStatus)}
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  backgroundColor: '#EEF0FD',
                  color: '#2C3480',
                  padding: '0.15rem 0.5rem',
                  borderRadius: '4px',
                  fontFamily: 'monospace'
                }}
              >
                #{badgeCode}
              </span>
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  backgroundColor: '#DCFCE7',
                  color: '#15803D',
                  padding: '0.15rem 0.55rem',
                  borderRadius: '4px',
                  border: '1px solid #BBF7D0',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.2rem'
                }}
              >
                ₹{Number(driver.perTripRate || driver.tripRate || driver.salaryStructure?.perTripRate || 1500).toLocaleString('en-IN')}/Trip
              </span>
            </div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted, #64748b)', marginTop: '0.25rem' }}>
              Commercial Driver • {driver.experienceYears || driver.experience || 5} Years Experience • {driver.rating || 5.0} ★ Rating • Standard Trip Rate: <strong>₹{Number(driver.perTripRate || driver.tripRate || driver.salaryStructure?.perTripRate || 1500).toLocaleString('en-IN')}</strong>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Button
            variant="outline"
            size="md"
            style={{ borderColor: '#86EFAC', color: '#15803D', backgroundColor: '#F0FDF4', fontWeight: 700 }}
            leftIcon={<IndianRupee size={15} />}
            onClick={() => {
              setEditRateValue(driver.perTripRate || driver.tripRate || driver.salaryStructure?.perTripRate || 1500);
              setIsRateModalOpen(true);
            }}
          >
            Edit Trip Rate
          </Button>
          <Button
            variant="outline"
            leftIcon={<Edit size={15} />}
            onClick={() => navigate(`/admin/drivers/${driver.id || driver.driverBadgeId}/edit`)}
          >
            Edit Profile
          </Button>
          <Button
            variant="primary"
            style={{ backgroundColor: '#2C3480' }}
            onClick={() => {
              if (typeof updateDriverStatus === 'function') {
                const isAvailable = driver.status === 'Available' || driver.status === 'Active';
                updateDriverStatus(driver.id, isAvailable ? 'On Leave' : 'Available');
              }
            }}
          >
            {driver.status === 'Available' || driver.status === 'Active' ? 'Mark On Leave' : 'Mark Available'}
          </Button>
        </div>
      </div>

      {/* Main Grid: Details + Documents + Trip History */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '1.25rem' }}>
        {/* Left: Contact, License & Badges */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <Card>
            <CardHeader title="Driver Credentials & Verification" subtitle="Commercial license and identity verification" />
            <CardBody style={{ padding: '1.25rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.8125rem' }}>
                <div>
                  <span style={{ color: 'var(--text-muted, #64748b)', fontSize: '0.75rem' }}>Phone Contact</span>
                  <div style={{ fontWeight: 700, color: '#10B981', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Phone size={13} /> {driver.phone}
                  </div>
                </div>

                <div>
                  <span style={{ color: 'var(--text-muted, #64748b)', fontSize: '0.75rem' }}>Email Address</span>
                  <div style={{ fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Mail size={13} /> {driver.email || 'N/A'}
                  </div>
                </div>

                <div>
                  <span style={{ color: 'var(--text-muted, #64748b)', fontSize: '0.75rem' }}>Commercial Driving License</span>
                  <div style={{ fontWeight: 800, fontFamily: 'monospace' }}>
                    {driver.licenseNumber || driver.drivingLicenseNumber || 'TN-VERIFIED-COMMERCIAL'}
                  </div>
                  <span style={{ fontSize: '0.6875rem', color: '#10B981', fontWeight: 600 }}>
                    Expires: {driver.licenseExpiry || '2030-01-10'}
                  </span>
                </div>

                <div>
                  <span style={{ color: 'var(--text-muted, #64748b)', fontSize: '0.75rem' }}>Public Service Badge</span>
                  <div style={{ fontWeight: 700 }}>{driver.badgeNumber || driver.driverBadgeId || 'Verified Badge'}</div>
                  <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted, #64748b)' }}>
                    Expires: {driver.badgeExpiry || '2028-11-20'}
                  </span>
                </div>

                <div>
                  <span style={{ color: 'var(--text-muted, #64748b)', fontSize: '0.75rem' }}>Blood Group</span>
                  <div style={{ fontWeight: 700, color: '#EF4444' }}>{driver.bloodGroup || 'B+ve'}</div>
                </div>

                <div>
                  <span style={{ color: 'var(--text-muted, #64748b)', fontSize: '0.75rem' }}>Languages Spoken</span>
                  <div style={{ fontWeight: 500 }}>{languagesDisplay}</div>
                </div>

                <div style={{ gridColumn: 'span 2' }}>
                  <span style={{ color: 'var(--text-muted, #64748b)', fontSize: '0.75rem' }}>Residential Address</span>
                  <div style={{ fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <MapPin size={13} /> {driver.address || `${driver.city || 'Chennai'}, ${driver.state || 'Tamil Nadu'}`}
                  </div>
                </div>

                <div style={{ gridColumn: 'span 2' }}>
                  <span style={{ color: 'var(--text-muted, #64748b)', fontSize: '0.75rem' }}>Emergency Contact</span>
                  <div style={{ fontWeight: 700, color: '#991B1B' }}>
                    {driver.emergencyContact || '+91 98401 00999 (Family Member)'}
                  </div>
                </div>

                {/* Per-Trip Rate Card Section */}
                <div
                  style={{
                    gridColumn: 'span 2',
                    backgroundColor: '#F0FDF4',
                    border: '1.5px solid #BBF7D0',
                    borderRadius: '10px',
                    padding: '0.875rem 1rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '0.75rem',
                    marginTop: '0.25rem'
                  }}
                >
                  <div>
                    <span style={{ color: '#166534', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                      Commercial Per-Trip Fee Rate
                    </span>
                    <div style={{ fontWeight: 800, fontSize: '1.25rem', color: '#15803D', display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.15rem' }}>
                      ₹{Number(driver.perTripRate || driver.tripRate || driver.salaryStructure?.perTripRate || 1500).toLocaleString('en-IN')}
                      <span style={{ fontSize: '0.75rem', color: '#166534', fontWeight: 600 }}>/ standard trip</span>
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#166534', marginTop: '0.1rem' }}>
                      ✓ Automatically pre-fills in booking allocations when this driver is assigned. (Editable per booking by Admin)
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    style={{ borderColor: '#86EFAC', color: '#15803D', backgroundColor: '#FFFFFF', fontWeight: 700, fontSize: '0.75rem' }}
                    leftIcon={<Edit size={13} />}
                    onClick={() => {
                      setEditRateValue(driver.perTripRate || driver.tripRate || driver.salaryStructure?.perTripRate || 1500);
                      setIsRateModalOpen(true);
                    }}
                  >
                    Change Price
                  </Button>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Statutory Compliance & Verification Documents */}
          <Card style={{ borderRadius: '6px' }}>
            <CardHeader
              title="Statutory Documents & Verification Clearance"
              subtitle="Police background PVC, driving license, and annual medical records"
              action={
                <Button
                  variant="ghost"
                  size="sm"
                  style={{ fontSize: '0.75rem', borderRadius: '4px' }}
                  rightIcon={<ExternalLink size={12} />}
                  onClick={() => navigate('/admin/drivers/applications')}
                >
                  Verification Desk
                </Button>
              }
            />
            <CardBody style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {documentsList.map((doc, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.75rem 1rem',
                      borderRadius: '6px',
                      backgroundColor: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      fontSize: '0.8125rem'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                      <FileText size={16} color="#2C3480" />
                      <div>
                        <div style={{ fontWeight: 700, color: '#0f172a' }}>{doc.name}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                          Validity / Expiry: <strong>{doc.expiry}</strong>
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span
                        style={{
                          fontSize: '0.6875rem',
                          fontWeight: 800,
                          backgroundColor: '#dcfce7',
                          color: '#15803d',
                          padding: '0.15rem 0.5rem',
                          borderRadius: '4px',
                          border: '1px solid #bbf7d0'
                        }}
                      >
                        ✓ {doc.status}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem', borderRadius: '4px' }}
                        leftIcon={<Eye size={12} />}
                        onClick={() =>
                          setPreviewDoc({
                            name: doc.name,
                            url:
                              doc.url ||
                              (doc.name.includes('License')
                                ? 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=800&q=80'
                                : doc.name.includes('Medical')
                                ? 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=800&q=80'
                                : 'https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=800&q=80')
                          })
                        }
                      >
                        Preview
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Right: Assigned Duty & Trip History */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <Card>
            <CardHeader title="Current Duty Vehicle & Schedule" subtitle="Live dispatch status" />
            <CardBody style={{ padding: '1.25rem' }}>
              <div
                style={{
                  padding: '0.875rem',
                  borderRadius: '8px',
                  backgroundColor: '#EEF0FD',
                  border: '1px solid #C7CEFA',
                  marginBottom: '1rem'
                }}
              >
                <span
                  style={{
                    fontSize: '0.6875rem',
                    fontWeight: 800,
                    color: '#2C3480',
                    textTransform: 'uppercase'
                  }}
                >
                  Today's Schedule
                </span>
                <div style={{ fontWeight: 700, color: '#2C3480', marginTop: '0.25rem' }}>
                  {driver.scheduleToday || 'On Standby at Central Dispatch Yard'}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Car size={24} color="#2C3480" />
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted, #64748b)' }}>Assigned Vehicle</span>
                  <div style={{ fontWeight: 800, fontSize: '0.9375rem', color: 'var(--text-main, #090d16)' }}>
                    {assignedVehicle}
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Driver Planned Leave & Holiday Requests */}
          <Card>
            <CardHeader
              title={`Planned Leave Requests (${driverLeaves.length})`}
              subtitle="Holiday & rest cycle applications"
            />
            <CardBody style={{ padding: 0 }}>
              {driverLeaves.length === 0 ? (
                <div style={{ padding: '1.25rem', textAlign: 'center', color: 'var(--text-muted, #64748b)', fontSize: '0.8125rem' }}>
                  No active or past leave requests for this driver.
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
                    <thead>
                      <tr style={{ backgroundColor: 'var(--bg-app, #f8fafc)', borderBottom: '1px solid var(--border-light, #e2e8f0)', textAlign: 'left' }}>
                        <th style={{ padding: '0.625rem 0.875rem', fontWeight: 700, color: '#475569' }}>REF</th>
                        <th style={{ padding: '0.625rem 0.875rem', fontWeight: 700, color: '#475569' }}>DATES</th>
                        <th style={{ padding: '0.625rem 0.875rem', fontWeight: 700, color: '#475569' }}>REASON</th>
                        <th style={{ padding: '0.625rem 0.875rem', fontWeight: 700, color: '#475569' }}>STATUS</th>
                        <th style={{ padding: '0.625rem 0.875rem', fontWeight: 700, color: '#475569', textAlign: 'right' }}>ACTION</th>
                      </tr>
                    </thead>
                    <tbody>
                      {driverLeaves.map((l) => {
                        const isPending = l.status === 'Under Review' || l.status === 'Pending';
                        const isApproved = l.status === 'Approved';
                        return (
                          <tr key={l.id} style={{ borderBottom: '1px solid var(--border-light, #e2e8f0)' }}>
                            <td style={{ padding: '0.625rem 0.875rem', fontFamily: 'monospace', fontWeight: 700, color: '#2C3480' }}>
                              {l.id}
                            </td>
                            <td style={{ padding: '0.625rem 0.875rem', fontWeight: 600 }}>
                              {l.startDate} to {l.endDate} ({l.totalDays || 1}d)
                            </td>
                            <td style={{ padding: '0.625rem 0.875rem', color: '#475569' }}>
                              {l.reason}
                            </td>
                            <td style={{ padding: '0.625rem 0.875rem' }}>
                              <Badge variant={isApproved ? 'success' : isPending ? 'warning' : 'danger'} size="sm">
                                {l.status}
                              </Badge>
                            </td>
                            <td style={{ padding: '0.625rem 0.875rem', textAlign: 'right' }}>
                              {isPending ? (
                                <div style={{ display: 'inline-flex', gap: '0.35rem', justifyContent: 'flex-end' }}>
                                  <Button size="xs" variant="primary" style={{ backgroundColor: '#16a34a', borderColor: '#16a34a', fontWeight: 800 }} onClick={() => approveDriverLeave(l.id, true)}>
                                    Approve
                                  </Button>
                                  <Button size="xs" variant="outline" style={{ color: '#dc2626', borderColor: '#fca5a5' }} onClick={() => approveDriverLeave(l.id, false)}>
                                    Reject
                                  </Button>
                                </div>
                              ) : (
                                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: isApproved ? '#16a34a' : '#dc2626' }}>
                                  {isApproved ? 'Approved' : 'Declined'}
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardBody>
          </Card>

          {/* Trip History for this driver */}
          <Card>
            <CardHeader
              title={`Assigned Trips History (${assignedBookings.length})`}
              subtitle="Trips completed by this driver"
            />
            <CardBody style={{ padding: 0 }}>
              {assignedBookings.length === 0 ? (
                <div
                  style={{
                    padding: '1.5rem',
                    textAlign: 'center',
                    color: 'var(--text-muted, #64748b)',
                    fontSize: '0.8125rem'
                  }}
                >
                  No recent bookings linked to this driver.
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
                  <thead>
                    <tr
                      style={{
                        backgroundColor: 'var(--bg-app, #f8fafc)',
                        borderBottom: '1px solid var(--border-light, #e2e8f0)',
                        textAlign: 'left'
                      }}
                    >
                      <th style={{ padding: '0.75rem 1rem' }}>Booking ID</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Customer</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Date</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assignedBookings.map((b) => (
                      <tr
                        key={b.id || b._id}
                        onClick={() => navigate(`/admin/bookings/${b.id || b.bookingNumber || b._id}`, { state: { from: location.pathname } })}
                        style={{ borderBottom: '1px solid var(--border-light, #e2e8f0)', cursor: 'pointer' }}
                      >
                        <td style={{ padding: '0.75rem 1rem', fontWeight: 700, color: '#2C3480' }}>
                          {b.bookingNumber || b.id || b._id}
                        </td>
                        <td style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>
                          {b.customerName || b.customer || 'Customer'}
                        </td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          {b.journeyDate || b.travelDate || b.pickupDate || 'Scheduled'}
                        </td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <Badge variant="primary">{b.bookingStatus || b.tripStatus || b.status || 'Active'}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardBody>
          </Card>
        </div>
      </div>

      {/* Document Scan Preview Modal */}
      {previewDoc && (
        <Modal
          isOpen={Boolean(previewDoc)}
          onClose={() => setPreviewDoc(null)}
          title={`Document Preview: ${previewDoc.name}`}
          size="md"
        >
          <div style={{ textAlign: 'center' }}>
            <img
              src={previewDoc.url}
              alt={previewDoc.name}
              style={{
                maxWidth: '100%',
                maxHeight: '60vh',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                objectFit: 'contain'
              }}
            />
          </div>
        </Modal>
      )}

      {/* Quick Edit Per-Trip Rate Modal */}
      {isRateModalOpen && (
        <Modal
          isOpen={isRateModalOpen}
          onClose={() => setIsRateModalOpen(false)}
          title={`Edit Driver Per-Trip Rate - ${driver.name || driver.fullName}`}
          subtitle={`Adjust standard commercial compensation for #${badgeCode}`}
          maxWidth="440px"
          footer={
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', width: '100%' }}>
              <Button variant="ghost" onClick={() => setIsRateModalOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                style={{ backgroundColor: '#2C3480' }}
                onClick={() => {
                  const val = Number(editRateValue);
                  if (!isNaN(val) && val >= 0) {
                    updateDriver(driver.id, {
                      perTripRate: val,
                      tripRate: val,
                      salaryStructure: {
                        ...(driver.salaryStructure || {}),
                        perTripRate: val
                      }
                    });
                    setIsRateModalOpen(false);
                  }
                }}
              >
                Save Rate
              </Button>
            </div>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '0.5rem 0' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#0F172A', marginBottom: '0.35rem' }}>
                Standard Per-Trip Compensation (₹) *
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', fontWeight: 800, color: '#64748B' }}>
                  ₹
                </span>
                <input
                  type="number"
                  min="0"
                  step="50"
                  value={editRateValue}
                  onChange={(e) => setEditRateValue(Number(e.target.value))}
                  style={{
                    width: '100%',
                    padding: '0.625rem 0.75rem 0.625rem 1.85rem',
                    fontSize: '1rem',
                    fontWeight: 700,
                    borderRadius: '8px',
                    border: '1.5px solid #CBD5E1',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                  autoFocus
                />
              </div>
              <p style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '0.35rem', lineHeight: 1.4 }}>
                This rate will automatically load into bookings when <strong>{driver.name || driver.fullName}</strong> is selected, and can also be customized per booking by the admin.
              </p>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default DriverDetails;
