// MAK Tours & Travels ERP - Tour Package Details
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Compass,
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  XCircle,
  Edit,
  Sparkles,
  Plus,
  Camera,
  Upload,
  Image as ImageIcon
} from 'lucide-react';
import { Card, CardHeader, CardBody } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Modal } from '../../../components/ui/Modal';
import { useAdminData } from '../../../context/AdminDataContext';
import { useToast } from '../../../context/ToastContext';
import { TOUR_IMAGE_PRESETS } from './TourPackageList';

export function TourPackageDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { tourPackages, togglePackageStatus, updateTourPackage, bookings } = useAdminData();

  const [isEditImageModalOpen, setIsEditImageModalOpen] = useState(false);
  const [imageInputValue, setImageInputValue] = useState('');
  const [imageUploadPreview, setImageUploadPreview] = useState('');
  const [isSavingImage, setIsSavingImage] = useState(false);

  const handleOpenEditImage = () => {
    const currentImg = pkg?.images?.[0] || pkg?.destinationImage || pkg?.heroImage || pkg?.image || 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=800&q=80';
    setImageInputValue(currentImg);
    setImageUploadPreview(currentImg);
    setIsEditImageModalOpen(true);
  };

  const handleImageFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast?.warning?.('Image file size exceeds 5MB. Please choose a smaller image.');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setImageUploadPreview(reader.result);
      setImageInputValue('');
    };
    reader.readAsDataURL(file);
  };

  const handleSaveImage = async (e) => {
    e.preventDefault();
    if (!pkg) return;
    const finalUrl = (imageUploadPreview || imageInputValue || '').trim();
    if (!finalUrl) {
      toast?.error?.('Please enter a valid image URL or upload an image file.');
      return;
    }

    setIsSavingImage(true);
    try {
      await updateTourPackage(pkg.id, {
        image: finalUrl,
        destinationImage: finalUrl,
        heroImage: finalUrl,
        images: [finalUrl]
      });
      setIsEditImageModalOpen(false);
      toast?.success?.('Tour package photo updated successfully in database!');
    } catch (err) {
      toast?.error?.('Failed to update photo: ' + (err.message || 'Error'));
    } finally {
      setIsSavingImage(false);
    }
  };

  const pkg = tourPackages.find((p) => p.id === id);

  if (!pkg) {
    return (
      <Card style={{ padding: '3rem', textAlign: 'center' }}>
        <h2>Tour Package Not Found</h2>
        <Button variant="primary" onClick={() => navigate('/admin/tour-packages')}>
          Back to Packages
        </Button>
      </Card>
    );
  }

  const linkedBookings = bookings.filter((b) => b.tourPackageId === pkg.id || b.tourPackageName === pkg.name);

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
          <Button variant="ghost" onClick={() => navigate('/admin/tour-packages')} style={{ padding: '0.5rem' }}>
            <ArrowLeft size={18} />
          </Button>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main, #090d16)', margin: 0 }}>
                {pkg.name}
              </h1>
              <Badge variant={pkg.status === 'Active' ? 'success' : 'neutral'}>
                {pkg.status}
              </Badge>
              {pkg.featured && (
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    backgroundColor: 'var(--color-primary, #2C3480)',
                    color: '#ffffff',
                    padding: '0.15rem 0.5rem',
                    borderRadius: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem'
                  }}
                >
                  <Sparkles size={12} /> Featured Package
                </span>
              )}
            </div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted, #64748b)', marginTop: '0.25rem' }}>
              Code: <strong>{pkg.code}</strong> • Category: <strong>{pkg.category}</strong>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Button variant="outline" onClick={() => togglePackageStatus(pkg.id)}>
            Toggle Status
          </Button>
          <Button variant="outline" leftIcon={<Edit size={15} />} onClick={() => navigate(`/admin/tour-packages/${pkg.id}/edit`)}>
            Edit Package
          </Button>
          <Button variant="primary" leftIcon={<Plus size={15} />} onClick={() => navigate('/admin/bookings/new')}>
            Book for Customer
          </Button>
        </div>
      </div>

      {/* Main Grid: Images & Overview + Itinerary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '1.25rem' }}>
        {/* Left: Gallery & Highlights */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <Card style={{ overflow: 'hidden' }}>
            <div style={{ position: 'relative', height: '240px', width: '100%', backgroundColor: '#090d16' }}>
              <img
                src={pkg.images?.[0] || pkg.destinationImage || pkg.heroImage || pkg.image || 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=800&q=80'}
                alt={pkg.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={handleOpenEditImage}
                style={{
                  position: 'absolute',
                  top: '1rem',
                  right: '1rem',
                  backgroundColor: 'rgba(15, 23, 42, 0.85)',
                  color: '#ffffff',
                  borderColor: 'rgba(255, 255, 255, 0.3)',
                  backdropFilter: 'blur(4px)',
                  fontWeight: 700
                }}
              >
                <Camera size={14} style={{ marginRight: '0.35rem' }} /> Change Photo
              </Button>
            </div>
            <CardBody style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted, #64748b)', fontSize: '0.8125rem', marginBottom: '0.5rem' }}>
                <MapPin size={16} color="#2C3480" /> {pkg.destination}
              </div>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary, #334155)', lineHeight: 1.6, margin: 0 }}>
                {pkg.description}
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--border-light, #e2e8f0)' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted, #64748b)' }}>Duration</span>
                  <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-main, #090d16)' }}>
                    {pkg.days} Days / {pkg.nights} Nights
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted, #64748b)' }}>Starting Price</span>
                  <div style={{ fontWeight: 800, fontSize: '1.25rem', color: 'var(--color-primary, #2C3480)' }}>
                    ₹{(Number(pkg.startingPrice || pkg.priceNumeric || (typeof pkg.price === 'string' ? pkg.price.replace(/[^\d]/g, '') : pkg.price)) || 0).toLocaleString('en-IN')}
                  </div>
                  <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted, #64748b)' }}>{pkg.pricingType}</span>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Inclusions & Exclusions */}
          <Card>
            <CardHeader title="Services Breakdown" subtitle="What is included and excluded in this package" />
            <CardBody style={{ padding: '1.25rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', fontSize: '0.8125rem' }}>
                <div>
                  <h4 style={{ fontSize: '0.875rem', fontWeight: 700, color: '#065F46', marginBottom: '0.625rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                    <CheckCircle2 size={16} /> Included Services
                  </h4>
                  <ul style={{ paddingLeft: '1.25rem', margin: 0, display: 'flex', flexDirection: 'column', gap: '0.375rem', color: 'var(--text-secondary, #334155)' }}>
                    {(pkg.inclusions || []).map((inc, idx) => (
                      <li key={idx}>{inc}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 style={{ fontSize: '0.875rem', fontWeight: 700, color: '#991B1B', marginBottom: '0.625rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                    <XCircle size={16} /> Excluded Services
                  </h4>
                  <ul style={{ paddingLeft: '1.25rem', margin: 0, display: 'flex', flexDirection: 'column', gap: '0.375rem', color: 'var(--text-secondary, #334155)' }}>
                    {(pkg.exclusions || []).map((exc, idx) => (
                      <li key={idx}>{exc}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Right: Day-wise Itinerary */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <Card>
            <CardHeader title="Day-Wise Itinerary Plan" subtitle="Comprehensive schedule and milestone stops" />
            <CardBody style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {(pkg.itinerary || []).map((dayPlan, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: '1rem',
                      borderRadius: '10px',
                      backgroundColor: 'var(--bg-app, #f8fafc)',
                      border: '1px solid var(--border-light, #e2e8f0)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.375rem' }}>
                      <span
                        style={{
                          fontSize: '0.6875rem',
                          fontWeight: 800,
                          backgroundColor: 'var(--color-primary, #2C3480)',
                          color: '#ffffff',
                          padding: '0.15rem 0.5rem',
                          borderRadius: '4px'
                        }}
                      >
                        DAY {dayPlan.day}
                      </span>
                      <h4 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-main, #090d16)', margin: 0 }}>
                        {dayPlan.title}
                      </h4>
                    </div>
                    <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary, #334155)', margin: 0, lineHeight: 1.55 }}>
                      {dayPlan.details}
                    </p>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>

          {/* Linked Bookings Section */}
          <Card>
            <CardHeader title={`Linked Customer Bookings (${linkedBookings.length})`} subtitle="Trips booked under this tour package" />
            <CardBody style={{ padding: 0 }}>
              {linkedBookings.length === 0 ? (
                <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted, #64748b)', fontSize: '0.8125rem' }}>
                  No active customer bookings currently mapped to this package.
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
                  <thead>
                    <tr style={{ backgroundColor: 'var(--bg-app, #f8fafc)', borderBottom: '1px solid var(--border-light, #e2e8f0)', textAlign: 'left' }}>
                      <th style={{ padding: '0.75rem 1rem' }}>Booking ID</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Customer</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Departure</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Amount</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {linkedBookings.map((b) => (
                      <tr
                        key={b.id}
                        onClick={() => navigate(`/admin/bookings/${b.id}`)}
                        style={{ borderBottom: '1px solid var(--border-light, #e2e8f0)', cursor: 'pointer' }}
                      >
                        <td style={{ padding: '0.75rem 1rem', fontWeight: 700, color: '#2C3480' }}>{b.id}</td>
                        <td style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>{b.customerName}</td>
                        <td style={{ padding: '0.75rem 1rem' }}>{b.journeyDate}</td>
                        <td style={{ padding: '0.75rem 1rem', fontWeight: 700 }}>₹{b.totalAmount?.toLocaleString('en-IN')}</td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <Badge variant="primary">{b.bookingStatus}</Badge>
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

      {/* Edit Tour Package Image Modal */}
      <Modal
        isOpen={isEditImageModalOpen}
        onClose={() => setIsEditImageModalOpen(false)}
        title="Edit Tour Package Photograph"
        maxWidth="680px"
      >
        <form onSubmit={handleSaveImage}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Header with info */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', backgroundColor: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <div>
                <span style={{ fontSize: '0.725rem', fontWeight: 700, color: '#2C3480', textTransform: 'uppercase' }}>
                  {pkg.category || 'Tour Package'} • {pkg.code}
                </span>
                <h4 style={{ margin: '0.2rem 0 0', fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>
                  {pkg.name}
                </h4>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>Destination</span>
                <strong style={{ fontSize: '0.85rem', color: '#2C3480' }}>{pkg.destination}</strong>
              </div>
            </div>

            {/* Live Preview Box */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.4rem' }}>
                Live Image Preview
              </label>
              <div style={{ height: '220px', width: '100%', borderRadius: '12px', overflow: 'hidden', backgroundColor: '#0f172a', border: '1.5px solid #cbd5e1', position: 'relative' }}>
                {(imageUploadPreview || imageInputValue) ? (
                  <img
                    src={imageUploadPreview || imageInputValue}
                    alt="Preview"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={(e) => {
                      e.currentTarget.src = 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=800&q=80';
                    }}
                  />
                ) : (
                  <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', flexDirection: 'column', gap: '0.5rem' }}>
                    <ImageIcon size={36} />
                    <span style={{ fontSize: '0.85rem' }}>No image selected yet</span>
                  </div>
                )}
                <div style={{ position: 'absolute', bottom: '0.5rem', right: '0.5rem', backgroundColor: 'rgba(15, 23, 42, 0.8)', color: '#ffffff', padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 600 }}>
                  Active Preview
                </div>
              </div>
            </div>

            {/* Upload Option & URL Input */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
              {/* File Upload from PC */}
              <div style={{ padding: '0.85rem', border: '1.5px dashed #cbd5e1', borderRadius: '10px', backgroundColor: '#f8fafc', textAlign: 'center' }}>
                <Upload size={22} color="#2C3480" style={{ margin: '0 auto 0.35rem' }} />
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0f172a' }}>Upload from Device</div>
                <div style={{ fontSize: '0.72rem', color: '#64748b', margin: '0.2rem 0 0.6rem' }}>JPG, PNG or WebP up to 5MB</div>
                <label
                  style={{
                    display: 'inline-block',
                    padding: '0.4rem 0.9rem',
                    backgroundColor: '#2C3480',
                    color: '#ffffff',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}
                >
                  Select File
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageFileChange}
                    style={{ display: 'none' }}
                  />
                </label>
              </div>

              {/* Direct Image URL input */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.35rem' }}>
                  Or Paste Image URL (HTTPS)
                </label>
                <input
                  type="url"
                  value={imageInputValue}
                  onChange={(e) => {
                    setImageInputValue(e.target.value);
                    setImageUploadPreview('');
                  }}
                  placeholder="https://images.unsplash.com/photo-..."
                  style={{
                    width: '100%',
                    padding: '0.625rem 0.75rem',
                    fontSize: '0.8125rem',
                    borderRadius: '8px',
                    border: '1.5px solid #cbd5e1',
                    boxSizing: 'border-box'
                  }}
                />
                <span style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '0.3rem', display: 'block' }}>
                  Direct web URL to an image asset.
                </span>
              </div>
            </div>

            {/* Popular Curated Tour Presets */}
            <div>
              <span style={{ fontSize: '0.775rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.45rem' }}>
                Select from Popular Destination Presets:
              </span>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(135px, 1fr))', gap: '0.5rem', maxHeight: '160px', overflowY: 'auto', padding: '2px' }}>
                {TOUR_IMAGE_PRESETS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setImageInputValue(preset.url);
                      setImageUploadPreview(preset.url);
                    }}
                    style={{
                      padding: '0.35rem',
                      borderRadius: '8px',
                      border: (imageInputValue === preset.url || imageUploadPreview === preset.url) ? '2px solid #2C3480' : '1px solid #e2e8f0',
                      backgroundColor: (imageInputValue === preset.url || imageUploadPreview === preset.url) ? '#EEF0FD' : '#ffffff',
                      cursor: 'pointer',
                      textAlign: 'left',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.25rem',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <img
                      src={preset.url}
                      alt={preset.label}
                      style={{ width: '100%', height: '55px', objectFit: 'cover', borderRadius: '4px' }}
                    />
                    <span style={{ fontSize: '0.675rem', fontWeight: 700, color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {preset.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid #e2e8f0' }}>
              <Button variant="outline" type="button" onClick={() => setIsEditImageModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" type="submit" disabled={isSavingImage} style={{ backgroundColor: '#2C3480' }}>
                {isSavingImage ? 'Saving to Database...' : 'Save Photo to Database'}
              </Button>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default TourPackageDetails;
