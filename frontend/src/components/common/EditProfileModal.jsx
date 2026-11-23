// MAK Tours & Travels ERP - Edit User Profile Modal
import React, { useState, useEffect, useRef } from 'react';
import {
  User,
  Mail,
  Phone,
  Briefcase,
  Building,
  MapPin,
  Camera,
  Upload,
  Check,
  X,
  Shield,
  Link as LinkIcon,
  RotateCcw,
  Lock,
  DollarSign,
  UserCheck,
  Home
} from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../context/ToastContext';
import { useTripContext } from '../../context/TripContext';
import { authService } from '../../services/authService';
import { loadStoredJson, saveStoredJson } from '../../utils/storage';

// Preset avatar photos for quick professional selection
const AVATAR_PRESETS = [
  {
    label: 'Corporate Lead (Female)',
    url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80'
  },
  {
    label: 'Corporate Lead (Male)',
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80'
  },
  {
    label: 'Executive Manager (Female)',
    url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80'
  },
  {
    label: 'Operations Specialist (Male)',
    url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80'
  },
  {
    label: 'Finance Specialist (Female)',
    url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=400&q=80'
  },
  {
    label: 'Driver / Fleet Officer (Male)',
    url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=400&q=80'
  }
];

export function EditProfileModal({ isOpen, onClose }) {
  const { currentUser, updateUserProfile } = useAuth();
  const tripCtx = useTripContext();
  const toast = useToast();
  const fileInputRef = useRef(null);
  const wasOpenRef = useRef(false);

  // Form State for Editable Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [avatar, setAvatar] = useState('');
  const [customAvatarUrl, setCustomAvatarUrl] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [isProcessingPhoto, setIsProcessingPhoto] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [errors, setErrors] = useState({});

  const isStaff = currentUser?.role === 'staff' || currentUser?.role === 'employee' || currentUser?.portal === 'staff';
  const isDriver = currentUser?.role === 'driver' || currentUser?.portal === 'driver';
  const isVendor = currentUser?.role === 'vendor' || currentUser?.portal === 'vendor';

  // Sync form state ONLY when modal transitions from closed to open
  useEffect(() => {
    if (isOpen && !wasOpenRef.current && currentUser) {
      setName(currentUser.name || currentUser.fullName || '');
      setEmail(currentUser.email || '');
      setPhone(currentUser.phone || currentUser.mobileNumber || '');
      setAddress(currentUser.address || '');
      setEmergencyContact(currentUser.emergencyContact || '');
      setAvatar(currentUser.avatar || '');
      setCustomAvatarUrl(
        currentUser.avatar && (currentUser.avatar.startsWith('http') || currentUser.avatar.startsWith('data:'))
          ? currentUser.avatar
          : ''
      );
      setErrors({});
      setShowUrlInput(false);
      setImageError(false);
    }
    wasOpenRef.current = isOpen;
  }, [isOpen, currentUser]);

  // Handle local file upload
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please choose a valid image file (PNG, JPG, WEBP, or GIF).');
      return;
    }

    setIsProcessingPhoto(true);

    // 1. Try uploading to backend image storage first
    try {
      const uploadRes = await authService.uploadAvatar(file);
      if (uploadRes?.url) {
        setAvatar(uploadRes.url);
        setCustomAvatarUrl(uploadRes.url);
        setImageError(false);
        toast.success('Photo uploaded and stored successfully!');
        setIsProcessingPhoto(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }
    } catch (uploadErr) {
      console.warn('Backend upload unavailable, falling back to local image optimizer:', uploadErr.message);
    }

    // 2. Client-side fallback if backend upload is offline
    const reader = new FileReader();

    reader.onload = (event) => {
      const rawDataUrl = event.target?.result;
      if (typeof rawDataUrl !== 'string') {
        setIsProcessingPhoto(false);
        return;
      }

      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const TARGET_SIZE = 256;
          canvas.width = TARGET_SIZE;
          canvas.height = TARGET_SIZE;
          const ctx = canvas.getContext('2d');

          const minDim = Math.min(img.width, img.height);
          const startX = (img.width - minDim) / 2;
          const startY = (img.height - minDim) / 2;

          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, TARGET_SIZE, TARGET_SIZE);
          ctx.drawImage(img, startX, startY, minDim, minDim, 0, 0, TARGET_SIZE, TARGET_SIZE);

          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.88);
          setAvatar(compressedDataUrl);
          setCustomAvatarUrl(compressedDataUrl);
          setImageError(false);
          toast.success('Photo loaded and optimized for profile avatar!');
        } catch {
          setAvatar(rawDataUrl);
          setCustomAvatarUrl(rawDataUrl);
          setImageError(false);
          toast.success('Photo loaded successfully!');
        } finally {
          setIsProcessingPhoto(false);
          if (fileInputRef.current) fileInputRef.current.value = '';
        }
      };

      img.onerror = () => {
        setIsProcessingPhoto(false);
        toast.error('Failed to parse image file. Please try another image.');
      };

      img.src = rawDataUrl;
    };

    reader.onerror = () => {
      setIsProcessingPhoto(false);
      toast.error('Failed to read image file from disk.');
    };

    reader.readAsDataURL(file);
  };

  const handleApplyCustomUrl = (e) => {
    if (e) e.preventDefault();
    const cleanUrl = (customAvatarUrl || '').trim();
    if (!cleanUrl) {
      toast.warning('Please enter a valid image web URL.');
      return;
    }
    setAvatar(cleanUrl);
    setImageError(false);
    toast.success('Avatar image URL applied!');
  };

  const handleResetToInitials = () => {
    const initials = (name || currentUser?.name || 'MK').substring(0, 2).toUpperCase();
    setAvatar(initials);
    setCustomAvatarUrl('');
    setImageError(false);
    toast.info(`Avatar reset to monogram initials (${initials}).`);
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    const newErrors = {};

    if (!name.trim()) {
      newErrors.name = 'Full legal name is required.';
    }

    if (!email.trim()) {
      newErrors.email = 'Email address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      newErrors.email = 'Please provide a valid email address.';
    }

    if (!phone.trim()) {
      newErrors.phone = 'Contact phone number is required.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const finalAvatar = avatar || (name ? name.substring(0, 2).toUpperCase() : 'MK');

    const updatedData = {
      name: name.trim(),
      fullName: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      mobileNumber: phone.trim(),
      address: address.trim(),
      emergencyContact: emergencyContact.trim(),
      avatar: finalAvatar
    };

    setIsSaving(true);
    try {
      await updateUserProfile(updatedData);

      // If user is a driver, also synchronize DriverDataContext cache and TripContext driver list
      if (isDriver) {
        const authDriverId = currentUser?.driverId || currentUser?.id || 'DRV-001';
        if (tripCtx?.updateDriver) {
          tripCtx.updateDriver(authDriverId, {
            ...updatedData,
            photo: finalAvatar,
            displayName: updatedData.name
          });
        }
        const cachedDriver = loadStoredJson('mak_driver_profile_cache', {});
        saveStoredJson('mak_driver_profile_cache', {
          ...cachedDriver,
          ...updatedData,
          photo: finalAvatar,
          displayName: updatedData.name
        });
      }

      onClose();
    } catch (err) {
      toast.error(err.message || 'Failed to update profile.');
    } finally {
      setIsSaving(false);
    }
  };

  const isAvatarUrl = avatar && (avatar.startsWith('http') || avatar.startsWith('data:') || avatar.startsWith('/'));
  const fallbackInitials = (name || currentUser?.name || 'MK').substring(0, 2).toUpperCase();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isDriver ? 'Edit Driver Profile' : isVendor ? 'Edit Vendor Profile' : isStaff ? 'Edit Staff Profile' : 'Edit Profile'}
      subtitle={isDriver ? 'Update your driver personal details, contact phone, and profile photo' : 'Update your personal details, contact information, and profile photo'}
      maxWidth="680px"
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', width: '100%' }}>
          <Button variant="outline" type="button" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button
            variant="primary"
            type="button"
            onClick={handleSubmit}
            disabled={isSaving || isProcessingPhoto}
            leftIcon={<Check size={16} />}
          >
            {isSaving ? 'Saving Changes...' : 'Save Changes'}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* 1. Avatar Photo Management Section */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1.25rem',
            padding: '1.25rem',
            backgroundColor: '#f8fafc',
            borderRadius: '12px',
            border: '1px solid #e2e8f0'
          }}
        >
          {/* Avatar Preview */}
          <div
            style={{
              position: 'relative',
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              backgroundColor: '#2C3480',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.5rem',
              fontWeight: 800,
              flexShrink: 0,
              boxShadow: '0 4px 12px rgba(44, 52, 128, 0.25)',
              overflow: 'hidden',
              border: '3px solid #ffffff'
            }}
          >
            {isAvatarUrl && !imageError ? (
              <img
                src={avatar}
                alt={name || 'Avatar'}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={() => setImageError(true)}
              />
            ) : (
              <span>{fallbackInitials}</span>
            )}
          </div>

          {/* Avatar Controls */}
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div>
                <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#0f172a' }}>
                  Profile Photo
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                  Upload a photo from your computer, choose a preset, or enter an image link
                </div>
              </div>

              {/* Upload Local File Button */}
              <div style={{ display: 'flex', gap: '0.375rem', alignItems: 'center' }}>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/*"
                  style={{ display: 'none' }}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  leftIcon={<Upload size={14} />}
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isProcessingPhoto || isSaving}
                >
                  {isProcessingPhoto ? 'Uploading...' : 'Upload Photo'}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  title="Enter Image URL"
                  onClick={() => setShowUrlInput(!showUrlInput)}
                  style={{ padding: '0.35rem 0.6rem' }}
                >
                  <LinkIcon size={14} />
                </Button>
              </div>
            </div>

            {/* Custom URL Input Field (Collapsible) */}
            {showUrlInput && (
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                <input
                  type="url"
                  placeholder="https://example.com/avatar.jpg"
                  value={customAvatarUrl}
                  onChange={(e) => setCustomAvatarUrl(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleApplyCustomUrl(e); }}
                  style={{
                    flex: 1,
                    padding: '0.45rem 0.625rem',
                    fontSize: '0.8125rem',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    outline: 'none',
                    backgroundColor: '#ffffff'
                  }}
                />
                <Button type="button" size="sm" variant="outline" onClick={handleApplyCustomUrl}>
                  Apply
                </Button>
              </div>
            )}

            {/* Quick Presets */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.25rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b' }}>
                Presets:
              </span>
              {AVATAR_PRESETS.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setAvatar(preset.url);
                    setCustomAvatarUrl(preset.url);
                    setImageError(false);
                    toast.success(`Selected ${preset.label}`);
                  }}
                  title={preset.label}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    padding: 0,
                    border: avatar === preset.url ? '2px solid #2C3480' : '1px solid #cbd5e1',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    transform: avatar === preset.url ? 'scale(1.15)' : 'scale(1)',
                    boxShadow: avatar === preset.url ? '0 0 0 2px rgba(44, 52, 128, 0.3)' : 'none',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <img
                    src={preset.url}
                    alt={preset.label}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none' }}
                  />
                </button>
              ))}

              <button
                type="button"
                onClick={handleResetToInitials}
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: '#2C3480',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '0.1rem 0.4rem',
                  textDecoration: 'underline'
                }}
              >
                Use Initials
              </button>
            </div>
          </div>
        </div>

        {/* 2. Personal Information (Fully Editable) */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', paddingBottom: '0.5rem', borderBottom: '1px solid #e2e8f0' }}>
            <User size={16} color="#2C3480" />
            <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: '#0f172a' }}>
              {isDriver ? 'Driver Personal & Contact Information' : isStaff ? 'Personal & Contact Information (Employee Editable)' : 'Personal & Contact Information'}
            </h4>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
            {/* Full Legal Name */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#0f172a', marginBottom: '0.35rem' }}>
                Full Legal Name <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <User
                  size={16}
                  style={{
                    position: 'absolute',
                    left: '0.75rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#94a3b8',
                    pointerEvents: 'none'
                  }}
                />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (errors.name) setErrors((prev) => ({ ...prev, name: null }));
                  }}
                  placeholder="e.g. Manoj Kumar"
                  autoComplete="name"
                  style={{
                    width: '100%',
                    padding: '0.6rem 0.75rem 0.6rem 2.25rem',
                    borderRadius: '8px',
                    border: errors.name ? '1px solid #dc2626' : '1px solid #cbd5e1',
                    fontSize: '0.875rem',
                    backgroundColor: '#ffffff',
                    color: '#0f172a',
                    outline: 'none',
                    pointerEvents: 'auto',
                    cursor: 'text'
                  }}
                />
              </div>
              {errors.name && <span style={{ fontSize: '0.75rem', color: '#dc2626', marginTop: '0.25rem', display: 'block' }}>{errors.name}</span>}
            </div>

            {/* Contact Phone */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#0f172a', marginBottom: '0.35rem' }}>
                Contact Phone <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <Phone
                  size={16}
                  style={{
                    position: 'absolute',
                    left: '0.75rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#94a3b8',
                    pointerEvents: 'none'
                  }}
                />
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    if (errors.phone) setErrors((prev) => ({ ...prev, phone: null }));
                  }}
                  placeholder="e.g. +91 98401 23456"
                  autoComplete="tel"
                  style={{
                    width: '100%',
                    padding: '0.6rem 0.75rem 0.6rem 2.25rem',
                    borderRadius: '8px',
                    border: errors.phone ? '1px solid #dc2626' : '1px solid #cbd5e1',
                    fontSize: '0.875rem',
                    backgroundColor: '#ffffff',
                    color: '#0f172a',
                    outline: 'none',
                    pointerEvents: 'auto',
                    cursor: 'text'
                  }}
                />
              </div>
              {errors.phone && <span style={{ fontSize: '0.75rem', color: '#dc2626', marginTop: '0.25rem', display: 'block' }}>{errors.phone}</span>}
            </div>

            {/* Email Address */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#0f172a', marginBottom: '0.35rem' }}>
                Email Address <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <Mail
                  size={16}
                  style={{
                    position: 'absolute',
                    left: '0.75rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#94a3b8',
                    pointerEvents: 'none'
                  }}
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email) setErrors((prev) => ({ ...prev, email: null }));
                  }}
                  placeholder="e.g. staff@maktours.com"
                  autoComplete="email"
                  style={{
                    width: '100%',
                    padding: '0.6rem 0.75rem 0.6rem 2.25rem',
                    borderRadius: '8px',
                    border: errors.email ? '1px solid #dc2626' : '1px solid #cbd5e1',
                    fontSize: '0.875rem',
                    backgroundColor: '#ffffff',
                    color: '#0f172a',
                    outline: 'none',
                    pointerEvents: 'auto',
                    cursor: 'text'
                  }}
                />
              </div>
              {errors.email && <span style={{ fontSize: '0.75rem', color: '#dc2626', marginTop: '0.25rem', display: 'block' }}>{errors.email}</span>}
            </div>

            {/* Emergency Contact */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#0f172a', marginBottom: '0.35rem' }}>
                Emergency Contact (Name &amp; Phone)
              </label>
              <div style={{ position: 'relative' }}>
                <Phone
                  size={16}
                  style={{
                    position: 'absolute',
                    left: '0.75rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#94a3b8',
                    pointerEvents: 'none'
                  }}
                />
                <input
                  type="text"
                  value={emergencyContact}
                  onChange={(e) => setEmergencyContact(e.target.value)}
                  placeholder="e.g. Ramesh Kumar (+91 98401 99887)"
                  style={{
                    width: '100%',
                    padding: '0.6rem 0.75rem 0.6rem 2.25rem',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.875rem',
                    backgroundColor: '#ffffff',
                    color: '#0f172a',
                    outline: 'none',
                    pointerEvents: 'auto',
                    cursor: 'text'
                  }}
                />
              </div>
            </div>

            {/* Residential Address (Full Width) */}
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#0f172a', marginBottom: '0.35rem' }}>
                Residential Address
              </label>
              <div style={{ position: 'relative' }}>
                <Home
                  size={16}
                  style={{
                    position: 'absolute',
                    left: '0.75rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#94a3b8',
                    pointerEvents: 'none'
                  }}
                />
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. Flat 4B, Central Terminal Quarters, Anna Nagar, Chennai"
                  style={{
                    width: '100%',
                    padding: '0.6rem 0.75rem 0.6rem 2.25rem',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.875rem',
                    backgroundColor: '#ffffff',
                    color: '#0f172a',
                    outline: 'none',
                    pointerEvents: 'auto',
                    cursor: 'text'
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* 3. Official Admin-Controlled Particulars (Read-Only) */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem', paddingBottom: '0.5rem', borderBottom: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Lock size={15} color="#0284c7" />
              <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: '#0f172a' }}>
                {isDriver ? 'Official Driver Particulars' : 'Official Employment Particulars'}
              </h4>
            </div>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0284c7', backgroundColor: '#e0f2fe', padding: '0.2rem 0.6rem', borderRadius: '6px' }}>
              ● Admin Controlled &amp; Protected
            </span>
          </div>

          {isDriver ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.85rem' }}>
              <div style={{ padding: '0.65rem 0.85rem', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                  Driver ID
                </div>
                <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#0284c7', marginTop: '0.2rem' }}>
                  {currentUser?.driverId || currentUser?.id || 'DRV-001'}
                </div>
              </div>

              <div style={{ padding: '0.65rem 0.85rem', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                  Portal Role
                </div>
                <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#0f172a', marginTop: '0.2rem' }}>
                  Verified Driver
                </div>
              </div>

              <div style={{ padding: '0.65rem 0.85rem', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                  Designation
                </div>
                <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#0f172a', marginTop: '0.2rem' }}>
                  {currentUser?.designation || 'Senior Tour Driver'}
                </div>
              </div>

              <div style={{ padding: '0.65rem 0.85rem', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                  Duty Status
                </div>
                <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#16a34a', marginTop: '0.2rem' }}>
                  ● {currentUser?.dutyStatus || 'Available'}
                </div>
              </div>

              <div style={{ padding: '0.65rem 0.85rem', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                  Assigned Vehicle
                </div>
                <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#0f172a', marginTop: '0.2rem' }}>
                  Toyota Innova Crysta (TN-09-CB-4491)
                </div>
              </div>

              <div style={{ padding: '0.65rem 0.85rem', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                  Employment Status
                </div>
                <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#16a34a', marginTop: '0.2rem' }}>
                  ● Active / Verified
                </div>
              </div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.85rem' }}>
              {/* Employee ID */}
              <div style={{ padding: '0.65rem 0.85rem', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                  Employee ID
                </div>
                <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#0284c7', marginTop: '0.2rem' }}>
                  {currentUser?.employeeCode || 'MAK-EMP-010'}
                </div>
              </div>

              {/* Department */}
              <div style={{ padding: '0.65rem 0.85rem', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                  Department
                </div>
                <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#0f172a', marginTop: '0.2rem' }}>
                  {currentUser?.department || 'Operations & Dispatch'}
                </div>
              </div>

              {/* Designation */}
              <div style={{ padding: '0.65rem 0.85rem', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                  Designation
                </div>
                <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#0f172a', marginTop: '0.2rem' }}>
                  {currentUser?.designation || 'Tour Coordinator'}
                </div>
              </div>

              {/* Work Type */}
              <div style={{ padding: '0.65rem 0.85rem', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                  Assigned Work Type
                </div>
                <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#0f172a', marginTop: '0.2rem' }}>
                  {currentUser?.workType || 'Operations Staff'}
                </div>
              </div>

              {/* Work Location */}
              <div style={{ padding: '0.65rem 0.85rem', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                  Official Work Location
                </div>
                <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#0f172a', marginTop: '0.2rem' }}>
                  {currentUser?.workLocation || 'Chennai HQ - Main Operations Center'}
                </div>
              </div>

              {/* Monthly Basic Salary */}
              <div style={{ padding: '0.65rem 0.85rem', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                  Monthly Salary &amp; Basis
                </div>
                <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#16a34a', marginTop: '0.2rem' }}>
                  ₹{Number(currentUser?.monthlySalary || currentUser?.salary || 42000).toLocaleString()} <span style={{ fontSize: '0.725rem', color: '#64748b', fontWeight: 500 }}>({currentUser?.salaryBasis || 'Attendance-Based'})</span>
                </div>
              </div>

              {/* System Access Role */}
              <div style={{ padding: '0.65rem 0.85rem', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                  System Access Role
                </div>
                <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#2563eb', marginTop: '0.2rem' }}>
                  {currentUser?.role || 'staff'}
                </div>
              </div>
            </div>
          )}
        </div>
      </form>
    </Modal>
  );
}

export default EditProfileModal;
