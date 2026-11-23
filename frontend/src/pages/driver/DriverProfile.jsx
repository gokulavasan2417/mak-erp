// MAK Tours & Travels ERP - Driver Profile Management
// Allows drivers to view and edit profile photo, full legal name, driver username, and contact details
import React, { useState, useRef } from 'react';
import {
  User,
  Phone,
  Mail,
  MapPin,
  ShieldCheck,
  Award,
  CreditCard,
  Edit2,
  Check,
  X,
  Lock,
  Camera,
  UploadCloud,
  Image,
  RefreshCw,
  PhoneCall,
  CheckCircle2,
  Clock,
  Sparkles,
  Calendar,
  AlertCircle,
  CheckCircle,
  FileCheck
} from 'lucide-react';
import { Breadcrumbs } from '../../components/common/Breadcrumbs';
import { Card, CardHeader, CardBody, CardFooter } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { useDriverData } from '../../context/DriverDataContext';
import { useAuth } from '../../hooks/useAuth';
import { initialDriverProfile } from '../../data/driverPortalData';

export function DriverProfile() {
  const { driver, updateProfile } = useDriverData();
  const { currentUser, login } = useAuth();
  const safeDriver = driver ? { ...initialDriverProfile, ...driver } : initialDriverProfile;

  const fileInputRef = useRef(null);

  // Edit Mode State
  const [isEditing, setIsEditing] = useState(false);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);

  // Form Fields State
  const [photo, setPhoto] = useState(safeDriver?.photo || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80');
  const [fullName, setFullName] = useState(safeDriver?.fullName || '');
  const [displayName, setDisplayName] = useState(safeDriver?.displayName || '');
  const [phone, setPhone] = useState(safeDriver?.phone || '');
  const [altPhone, setAltPhone] = useState(safeDriver?.altPhone || '');
  const [email, setEmail] = useState(safeDriver?.email || '');
  const [address, setAddress] = useState(safeDriver?.address || '');
  const [city, setCity] = useState(safeDriver?.city || '');
  const [pincode, setPincode] = useState(safeDriver?.pincode || '');
  const [emergencyContactName, setEmergencyContactName] = useState(safeDriver?.emergencyContactName || '');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState(safeDriver?.emergencyContactPhone || '');

  // Temporary photo URL input in modal
  const [customPhotoUrl, setCustomPhotoUrl] = useState('');

  // Sample quick driver avatar presets
  const avatarPresets = [
    { label: 'Executive 1', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80' },
    { label: 'Executive 2', url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80' },
    { label: 'Executive 3', url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=400&q=80' },
    { label: 'Executive 4', url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=400&q=80' }
  ];

  // Handle local file selection
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const dataUrl = uploadEvent.target?.result;
        if (dataUrl) {
          setPhoto(dataUrl);
          updateProfile({ photo: dataUrl });
          setIsPhotoModalOpen(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleApplyPresetPhoto = (url) => {
    setPhoto(url);
    updateProfile({ photo: url });
    setIsPhotoModalOpen(false);
  };

  const handleApplyCustomUrl = (e) => {
    e.preventDefault();
    if (customPhotoUrl.trim()) {
      setPhoto(customPhotoUrl.trim());
      updateProfile({ photo: customPhotoUrl.trim() });
      setCustomPhotoUrl('');
      setIsPhotoModalOpen(false);
    }
  };

  const handleSave = (e) => {
    e.preventDefault();
    const updates = {
      photo,
      fullName: fullName.trim() || safeDriver.fullName,
      displayName: displayName.trim() || safeDriver.displayName,
      phone,
      address,
      city,
      pincode,
      altPhone,
      email,
      emergencyContactName,
      emergencyContactPhone
    };

    updateProfile(updates);

    // Sync AuthContext user name and avatar if needed
    try {
      const activeUser = JSON.parse(localStorage.getItem('mak_erp_auth_user') || '{}');
      if (activeUser && activeUser.portal === 'driver') {
        activeUser.name = displayName.trim() || fullName.trim();
        localStorage.setItem('mak_erp_auth_user', JSON.stringify(activeUser));
      }
    } catch (err) {
      console.warn('Auth sync notice:', err);
    }

    setIsEditing(false);
  };

  const handleCancel = () => {
    setPhoto(safeDriver?.photo || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80');
    setFullName(safeDriver?.fullName || '');
    setDisplayName(safeDriver?.displayName || '');
    setPhone(safeDriver?.phone || '');
    setAddress(safeDriver?.address || '');
    setCity(safeDriver?.city || '');
    setPincode(safeDriver?.pincode || '');
    setAltPhone(safeDriver?.altPhone || '');
    setEmail(safeDriver?.email || '');
    setEmergencyContactName(safeDriver?.emergencyContactName || '');
    setEmergencyContactPhone(safeDriver?.emergencyContactPhone || '');
    setIsEditing(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '960px', margin: '0 auto' }}>
      {/* Hidden File Input for Avatar Upload */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/png, image/jpeg, image/jpg, image/webp"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      {/* Header */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
        <div>
          <Breadcrumbs portal="driver" />
          <h1 style={{ fontSize: '1.625rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.25rem' }}>
            Driver Profile & Credentials
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Manage your driver photo, badge username, verified credentials, and emergency contact details.
          </p>
        </div>

        <div>
          {!isEditing ? (
            <Button
              variant="primary"
              size="md"
              style={{ backgroundColor: '#2C3480', borderColor: '#2C3480', fontWeight: 700 }}
              leftIcon={<Edit2 size={16} />}
              onClick={() => setIsEditing(true)}
            >
              Edit Profile & Photo
            </Button>
          ) : (
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <Button variant="outline" size="md" onClick={handleCancel} leftIcon={<X size={16} />}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="md"
                style={{ backgroundColor: '#10b981', borderColor: '#10b981', fontWeight: 700 }}
                onClick={handleSave}
                leftIcon={<Check size={16} />}
              >
                Save Updates
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Executive Digital Driver ID Credential Card */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '20px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 10px 30px -4px rgba(44, 52, 128, 0.08), 0 4px 12px -2px rgba(0, 0, 0, 0.03)',
          overflow: 'hidden',
          position: 'relative'
        }}
      >
        {/* Top Executive Header Banner */}
        <div
          style={{
            background: 'linear-gradient(135deg, #161c4a 0%, #2C3480 55%, #1e1b4b 100%)',
            padding: '1.25rem 2rem 3.25rem 2rem',
            position: 'relative',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
            overflow: 'hidden'
          }}
        >
          {/* Subtle Watermark Pattern */}
          <div
            style={{
              position: 'absolute',
              right: '-15px',
              top: '-35px',
              opacity: 0.06,
              fontSize: '110px',
              fontWeight: 900,
              letterSpacing: '-4px',
              userSelect: 'none',
              pointerEvents: 'none'
            }}
          >
            MAK
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', zIndex: 1 }}>
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '8px',
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                backdropFilter: 'blur(8px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid rgba(255, 255, 255, 0.25)'
              }}
            >
              <ShieldCheck size={20} color="#ffffff" />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#c7cefa' }}>
                MAK Tours &amp; Travels &bull; Executive Driver Roster
              </div>
              <div style={{ fontSize: '0.7rem', color: 'rgba(255, 255, 255, 0.75)', fontFamily: 'monospace' }}>
                BADGE ID: {safeDriver?.id || 'DRV-NEW'} &bull; REF: {safeDriver?.applicationId || 'APP-NEW'}
              </div>
            </div>
          </div>

          {/* Live Verification Capsule */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              backgroundColor: 'rgba(16, 185, 129, 0.2)',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              padding: '0.4rem 0.85rem',
              borderRadius: '9999px',
              backdropFilter: 'blur(6px)',
              zIndex: 1
            }}
          >
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: '#34d399',
                boxShadow: '0 0 8px #34d399'
              }}
            />
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#ecfdf5', letterSpacing: '0.02em' }}>
              RTO Badge Verified &bull; Active Duty
            </span>
          </div>
        </div>

        {/* Driver Main Content Body */}
        <div style={{ padding: '0 2rem 1.75rem 2rem', position: 'relative' }}>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'flex-end',
              justifyContent: 'space-between',
              gap: '1.5rem',
              marginTop: '-40px',
              marginBottom: '1.75rem'
            }}
          >
            {/* Overlapping Avatar with Camera Edit button */}
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '1.5rem', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative' }}>
                <img
                  src={photo}
                  alt={displayName || fullName}
                  style={{
                    width: '104px',
                    height: '104px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: '4px solid #ffffff',
                    boxShadow: '0 8px 24px rgba(44, 52, 128, 0.25)',
                    backgroundColor: '#f1f5f9'
                  }}
                />
                <button
                  type="button"
                  onClick={() => setIsPhotoModalOpen(true)}
                  title="Update Profile Photo"
                  style={{
                    position: 'absolute',
                    bottom: '4px',
                    right: '2px',
                    backgroundColor: '#2C3480',
                    color: '#ffffff',
                    border: '2.5px solid #ffffff',
                    borderRadius: '50%',
                    width: '34px',
                    height: '34px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    boxShadow: '0 3px 8px rgba(0, 0, 0, 0.25)',
                    transition: 'transform 0.15s ease'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.1)')}
                  onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                >
                  <Camera size={16} />
                </button>
              </div>

              {/* Driver Identity Info */}
              <div style={{ paddingBottom: '0.25rem' }}>
                {!isEditing ? (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', flexWrap: 'wrap' }}>
                      <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#090d16', margin: 0, letterSpacing: '-0.02em' }}>
                        {fullName}
                      </h2>
                      <span
                        style={{
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          backgroundColor: '#ecfdf5',
                          color: '#065f46',
                          border: '1px solid #a7f3d0',
                          padding: '0.2rem 0.6rem',
                          borderRadius: '9999px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.3rem'
                        }}
                      >
                        <CheckCircle size={12} color="#059669" /> RTO Badge Certified
                      </span>
                      <span
                        style={{
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          backgroundColor: '#EEF0FD',
                          color: '#2C3480',
                          padding: '0.2rem 0.65rem',
                          borderRadius: '6px'
                        }}
                      >
                        {safeDriver?.dutyStatus || 'Available'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginTop: '0.4rem', flexWrap: 'wrap' }}>
                      <div style={{ fontSize: '0.875rem', color: '#475569', fontWeight: 600 }}>
                        Badge Handle: <span style={{ color: '#2C3480', fontWeight: 700 }}>@{displayName ? displayName.toLowerCase().replace(/\s+/g, '') : 'driver'}</span>
                      </div>
                      <span style={{ color: '#cbd5e1' }}>&bull;</span>
                      <div style={{ fontSize: '0.8125rem', color: '#64748b' }}>
                        Vehicle: <strong style={{ color: '#0f172a' }}>{safeDriver?.assignedVehicle?.model || 'Unassigned'}</strong> {safeDriver?.assignedVehicle?.regNo ? `(${safeDriver.assignedVehicle.regNo})` : ''}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem', minWidth: '340px' }}>
                    <div>
                      <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#090d16', display: 'block', marginBottom: '0.25rem' }}>
                        Full Legal Name (RTO Record) *
                      </label>
                      <Input
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="e.g. Arun Kumar Sundaram"
                        style={{ fontWeight: 700 }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#090d16', display: 'block', marginBottom: '0.25rem' }}>
                        Driver Display Username *
                      </label>
                      <Input
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="e.g. Arun Kumar"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right: Fleet Assignment Info Chip */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div
                style={{
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '0.75rem 1.15rem',
                  textAlign: 'right'
                }}
              >
                <div style={{ fontSize: '0.6875rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Assigned Fleet Unit
                </div>
                <div style={{ fontSize: '0.9375rem', fontWeight: 800, color: '#2C3480', marginTop: '0.1rem' }}>
                  {safeDriver?.assignedVehicle?.regNo || 'Unassigned'}
                </div>
                <div style={{ fontSize: '0.75rem', color: safeDriver?.assignedVehicle ? '#10b981' : '#64748b', fontWeight: 600, marginTop: '0.1rem' }}>
                  {safeDriver?.assignedVehicle ? 'Inspection Cleared • Ready' : 'Awaiting Assignment'}
                </div>
              </div>
            </div>
          </div>

          {/* Metric Strip with 4 Pillars */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '0.75rem',
              backgroundColor: '#f8fafc',
              borderRadius: '14px',
              padding: '1rem',
              border: '1px solid #edf2f7'
            }}
          >
            {/* Metric 1 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.25rem 0.5rem' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '10px', backgroundColor: '#fef3c7', color: '#b45309', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Award size={22} />
              </div>
              <div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
                  ★ {safeDriver?.rating || '0.0'}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>
                  {safeDriver?.totalTripsCompleted ? `Rating (${safeDriver.totalTripsCompleted} Reviews)` : 'Rating'}
                </div>
              </div>
            </div>

            {/* Metric 2 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.25rem 0.5rem' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '10px', backgroundColor: '#dcfce7', color: '#15803d', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <CheckCircle2 size={22} />
              </div>
              <div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
                  {safeDriver?.totalTripsCompleted || 0}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>
                  Trips Fulfilled Safely
                </div>
              </div>
            </div>

            {/* Metric 3 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.25rem 0.5rem' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '10px', backgroundColor: '#EEF0FD', color: '#2C3480', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <ShieldCheck size={22} />
              </div>
              <div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
                  {safeDriver?.experienceYears || 0} Yrs
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>
                  Commercial Experience
                </div>
              </div>
            </div>

            {/* Metric 4 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.25rem 0.5rem' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '10px', backgroundColor: '#e0e7ff', color: '#4338ca', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Clock size={22} />
              </div>
              <div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
                  {safeDriver?.onTimePerformanceRate || 0}%
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>
                  On-Time Dispatch Rate
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Info Status Banner */}
      <div
        style={{
          backgroundColor: '#EEF0FD',
          border: '1px solid #C7CEFA',
          borderRadius: '12px',
          padding: '0.875rem 1.25rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem'
        }}
      >
        <ShieldCheck size={20} color="#2C3480" style={{ flexShrink: 0 }} />
        <span style={{ fontSize: '0.8125rem', color: '#1e293b' }}>
          <strong>Driver Identity &amp; Duty Manifest:</strong> Changes to your profile photograph and username update immediately across your active trip sheets, manifest receipts, and passenger greeting screens.
        </span>
      </div>

      {/* Main Details Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '1.5rem' }}>
        {/* Contact & Residential Details */}
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 2px 10px rgba(44, 52, 128, 0.04), 0 1px 3px rgba(0, 0, 0, 0.02)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          {/* Card Header */}
          <div
            style={{
              padding: '1.25rem 1.5rem',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: '#fafbfc'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  backgroundColor: '#EEF0FD',
                  color: '#2C3480',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <PhoneCall size={16} />
              </div>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#090d16', margin: 0 }}>
                  Contact &amp; Residential Profile
                </h3>
                <p style={{ fontSize: '0.75rem', color: '#64748b', margin: 0 }}>
                  Verified contact numbers and duty address
                </p>
              </div>
            </div>
          </div>

          <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1 }}>
            {!isEditing ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                {/* Primary Phone Tile */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', backgroundColor: '#f8fafc', borderRadius: '10px', border: '1px solid #edf2f7' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                    <Phone size={15} color="#2C3480" />
                    <span style={{ fontSize: '0.8125rem', color: '#64748b', fontWeight: 600 }}>Primary Phone</span>
                  </div>
                  <strong style={{ fontSize: '0.875rem', color: '#0f172a' }}>{phone}</strong>
                </div>

                {/* Alternate Phone Tile */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', backgroundColor: '#f8fafc', borderRadius: '10px', border: '1px solid #edf2f7' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                    <Phone size={15} color="#64748b" />
                    <span style={{ fontSize: '0.8125rem', color: '#64748b', fontWeight: 600 }}>Alternate Phone</span>
                  </div>
                  <span style={{ fontSize: '0.875rem', fontWeight: 600, color: altPhone ? '#0f172a' : '#94a3b8' }}>
                    {altPhone || 'Not provided'}
                  </span>
                </div>

                {/* Email Address Tile */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', backgroundColor: '#f8fafc', borderRadius: '10px', border: '1px solid #edf2f7' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                    <Mail size={15} color="#2C3480" />
                    <span style={{ fontSize: '0.8125rem', color: '#64748b', fontWeight: 600 }}>Dispatch Email</span>
                  </div>
                  <strong style={{ fontSize: '0.875rem', color: '#2C3480' }}>
                    {email || 'Not configured'}
                  </strong>
                </div>

                {/* Residential Address Tile */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '0.75rem 1rem', backgroundColor: '#f8fafc', borderRadius: '10px', border: '1px solid #edf2f7', gap: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', flexShrink: 0 }}>
                    <MapPin size={15} color="#2C3480" />
                    <span style={{ fontSize: '0.8125rem', color: '#64748b', fontWeight: 600 }}>Residential Address</span>
                  </div>
                  <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#0f172a', textAlign: 'right' }}>
                    {[address, city, pincode].filter(Boolean).join(', ') || 'Not configured'}
                  </span>
                </div>

                {/* Emergency Contact SOS Tile */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.875rem 1rem',
                    backgroundColor: '#fff7ed',
                    borderRadius: '10px',
                    border: '1px solid #fed7aa'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                    <AlertCircle size={16} color="#c2410c" />
                    <div>
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#9a3412', textTransform: 'uppercase' }}>
                        Emergency SOS Contact
                      </div>
                      <div style={{ fontSize: '0.875rem', fontWeight: 800, color: '#7c2d12', marginTop: '0.1rem' }}>
                        {emergencyContactName || 'Not configured'}
                      </div>
                    </div>
                  </div>
                  <span style={{ fontSize: '0.875rem', fontWeight: 800, color: '#c2410c' }}>
                    {emergencyContactPhone || 'Not configured'}
                  </span>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b' }}>Primary Phone</label>
                  <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b' }}>Residential Address</label>
                  <Input value={address} onChange={(e) => setAddress(e.target.value)} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b' }}>City</label>
                    <Input value={city} onChange={(e) => setCity(e.target.value)} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b' }}>Pincode</label>
                    <Input value={pincode} onChange={(e) => setPincode(e.target.value)} />
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b' }}>Alternate Phone</label>
                  <Input value={altPhone} onChange={(e) => setAltPhone(e.target.value)} />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b' }}>Email Address</label>
                  <Input value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b' }}>Emergency Contact Name</label>
                  <Input value={emergencyContactName} onChange={(e) => setEmergencyContactName(e.target.value)} />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b' }}>Emergency Contact Phone</label>
                  <Input value={emergencyContactPhone} onChange={(e) => setEmergencyContactPhone(e.target.value)} />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Driving License & Statutory RTO Record */}
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 2px 10px rgba(44, 52, 128, 0.04), 0 1px 3px rgba(0, 0, 0, 0.02)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          {/* Card Header */}
          <div
            style={{
              padding: '1.25rem 1.5rem',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: '#fafbfc'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  backgroundColor: '#ecfdf5',
                  color: '#059669',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Award size={16} />
              </div>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#090d16', margin: 0 }}>
                  Commercial Transport License Record
                </h3>
                <p style={{ fontSize: '0.75rem', color: '#64748b', margin: 0 }}>
                  State Transport Authority statutory certification
                </p>
              </div>
            </div>
            <span
              style={{
                fontSize: '0.6875rem',
                fontWeight: 700,
                color: '#15803d',
                backgroundColor: '#dcfce7',
                padding: '0.2rem 0.5rem',
                borderRadius: '6px'
              }}
            >
              RTO Certified
            </span>
          </div>

          <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.875rem', flex: 1 }}>
            {/* License Number Badge */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.875rem 1rem',
                backgroundColor: '#EEF0FD',
                borderRadius: '10px',
                border: '1px solid #C7CEFA'
              }}
            >
              <div>
                <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#2C3480', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Commercial Driving License No.
                </div>
                <div style={{ fontSize: '1.125rem', fontWeight: 800, color: '#2C3480', fontFamily: 'monospace', letterSpacing: '0.04em', marginTop: '0.15rem' }}>
                  {safeDriver?.drivingLicense?.number || 'Pending Entry'}
                </div>
              </div>
              <CheckCircle size={20} color="#2C3480" />
            </div>

            {/* License Holder */}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.65rem 0.85rem', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #edf2f7' }}>
              <span style={{ fontSize: '0.8125rem', color: '#64748b', fontWeight: 600 }}>License Holder:</span>
              <strong style={{ fontSize: '0.875rem', color: '#0f172a' }}>{safeDriver?.drivingLicense?.holderName || fullName || 'Not provided'}</strong>
            </div>

            {/* Endorsement Class */}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.65rem 0.85rem', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #edf2f7' }}>
              <span style={{ fontSize: '0.8125rem', color: '#64748b', fontWeight: 600 }}>Endorsement Class:</span>
              <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#2C3480' }}>
                {safeDriver?.drivingLicense?.typeClass || 'Commercial LMV-TR'}
              </span>
            </div>

            {/* Validity Expiry */}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.65rem 0.85rem', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #edf2f7' }}>
              <span style={{ fontSize: '0.8125rem', color: '#64748b', fontWeight: 600 }}>Validity Expiry:</span>
              <strong style={{ fontSize: '0.875rem', color: safeDriver?.drivingLicense?.expiryDate ? '#16a34a' : '#64748b' }}>
                {safeDriver?.drivingLicense?.expiryDate ? `${safeDriver.drivingLicense.expiryDate} (Active)` : 'Pending Verification'}
              </strong>
            </div>

            {/* Languages Known Chips */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.65rem 0.85rem', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #edf2f7' }}>
              <span style={{ fontSize: '0.8125rem', color: '#64748b', fontWeight: 600 }}>Languages:</span>
              <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                {(safeDriver?.languages?.length > 0 ? safeDriver.languages : ['English']).map((lang) => (
                  <span
                    key={lang}
                    style={{
                      fontSize: '0.6875rem',
                      fontWeight: 700,
                      backgroundColor: '#f1f5f9',
                      color: '#334155',
                      padding: '0.15rem 0.45rem',
                      borderRadius: '4px',
                      border: '1px solid #cbd5e1'
                    }}
                  >
                    {lang}
                  </span>
                ))}
              </div>
            </div>

            {/* Special Skills */}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.65rem 0.85rem', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #edf2f7' }}>
              <span style={{ fontSize: '0.8125rem', color: '#64748b', fontWeight: 600 }}>Special Skills:</span>
              <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#0f172a' }}>
                {safeDriver?.notes || 'Commercial Driver'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================
          UPDATE PROFILE PHOTO MODAL
          ======================================================== */}
      <Modal
        isOpen={isPhotoModalOpen}
        onClose={() => setIsPhotoModalOpen(false)}
        title="Update Driver Profile Photograph"
        subtitle="Upload a clear headshot or select from verified commercial driver presets"
        size="md"
        maxWidth="520px"
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', width: '100%' }}>
            <Button variant="outline" size="sm" onClick={() => setIsPhotoModalOpen(false)}>
              Cancel
            </Button>
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Current / Selected Preview */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-light)' }}>
            <img
              src={photo}
              alt="Preview"
              style={{ width: '64px', height: '64px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #2C3480' }}
            />
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-main)' }}>
                Active Driver Photograph
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                Used in dispatch slips, passenger SMS notifications, and navigation badge.
              </div>
            </div>
          </div>

          {/* Option 1: File Upload */}
          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', marginBottom: '0.5rem' }}>
              Upload from Device
            </span>
            <Button
              variant="outline"
              size="md"
              style={{ width: '100%', borderStyle: 'dashed', borderColor: '#2C3480', fontWeight: 600, color: '#2C3480' }}
              leftIcon={<UploadCloud size={16} />}
              onClick={() => fileInputRef.current?.click()}
            >
              Choose Photo File (JPG, PNG, WEBP)
            </Button>
          </div>

          {/* Option 2: Presets */}
          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', marginBottom: '0.5rem' }}>
              Or Choose Preset Driver Portrait
            </span>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem' }}>
              {avatarPresets.map((preset, idx) => (
                <div
                  key={idx}
                  onClick={() => handleApplyPresetPhoto(preset.url)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.35rem',
                    padding: '0.5rem',
                    borderRadius: '8px',
                    border: photo === preset.url ? '2px solid #2C3480' : '1px solid var(--border-light)',
                    backgroundColor: photo === preset.url ? '#EEF0FD' : 'transparent',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <img
                    src={preset.url}
                    alt={preset.label}
                    style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover' }}
                  />
                  <span style={{ fontSize: '0.6875rem', fontWeight: 600, color: photo === preset.url ? '#2C3480' : 'var(--text-muted)' }}>
                    {preset.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Option 3: Image URL */}
          <form onSubmit={handleApplyCustomUrl}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>
              Or Paste Direct Image Web URL
            </span>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <Input
                placeholder="https://example.com/photo.jpg"
                value={customPhotoUrl}
                onChange={(e) => setCustomPhotoUrl(e.target.value)}
                style={{ flex: 1 }}
              />
              <Button type="submit" variant="primary" size="sm" style={{ backgroundColor: '#2C3480', borderColor: '#2C3480', whiteSpace: 'nowrap' }}>
                Apply URL
              </Button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
}

export default DriverProfile;
