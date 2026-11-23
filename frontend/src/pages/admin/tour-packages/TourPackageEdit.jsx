// MAK Tours & Travels ERP - Edit Tour Package
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Plus, Trash2, Camera, Upload, Image as ImageIcon } from 'lucide-react';
import { Card, CardHeader, CardBody } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { useAdminData } from '../../../context/AdminDataContext';
import { useToast } from '../../../context/ToastContext';
import { packageCategories } from '../../../data';
import { TOUR_IMAGE_PRESETS } from './TourPackageList';

export function TourPackageEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { tourPackages, updateTourPackage } = useAdminData();

  const pkg = tourPackages.find((p) => p.id === id);

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [category, setCategory] = useState('');
  const [destination, setDestination] = useState('');
  const [image, setImage] = useState('');
  const [imageUploadPreview, setImageUploadPreview] = useState('');
  const [days, setDays] = useState(3);
  const [nights, setNights] = useState(2);
  const [startingPrice, setStartingPrice] = useState(0);
  const [pricingType, setPricingType] = useState('Per Person');
  const [description, setDescription] = useState('');
  const [featured, setFeatured] = useState(false);
  const [status, setStatus] = useState('Active');
  const [inclusionsText, setInclusionsText] = useState('');
  const [exclusionsText, setExclusionsText] = useState('');
  const [itinerary, setItinerary] = useState([]);

  useEffect(() => {
    if (pkg) {
      setName(pkg.name || '');
      setCode(pkg.code || '');
      setCategory(pkg.category || 'South India');
      setDestination(pkg.destination || '');
      const currentImg = pkg.images?.[0] || pkg.destinationImage || pkg.heroImage || pkg.image || '';
      setImage(currentImg);
      setImageUploadPreview(currentImg);
      setDays(pkg.days || 3);
      setNights(pkg.nights || 2);
      const currentPrice = Number(pkg.startingPrice || pkg.priceNumeric || (typeof pkg.price === 'string' ? pkg.price.replace(/[^\d]/g, '') : pkg.price)) || 0;
      setStartingPrice(currentPrice);
      setPricingType(pkg.pricingType || 'Per Person');
      setDescription(pkg.description || '');
      setFeatured(Boolean(pkg.featured));
      setStatus(pkg.status || 'Active');
      setInclusionsText((pkg.inclusions || []).join('\n'));
      setExclusionsText((pkg.exclusions || []).join('\n'));
      setItinerary(pkg.itinerary || []);
    }
  }, [pkg]);

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

  const handleItineraryChange = (idx, field, val) => {
    const updated = [...itinerary];
    updated[idx][field] = val;
    setItinerary(updated);
  };

  const handleAddDay = () => {
    setItinerary([
      ...itinerary,
      { day: itinerary.length + 1, title: `Day ${itinerary.length + 1}`, details: '' }
    ]);
    setDays(itinerary.length + 1);
    setNights(itinerary.length);
  };

  const handleRemoveDay = (idx) => {
    if (itinerary.length <= 1) return;
    const updated = itinerary.filter((_, i) => i !== idx).map((item, i) => ({ ...item, day: i + 1 }));
    setItinerary(updated);
    setDays(updated.length);
    setNights(Math.max(1, updated.length - 1));
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
      setImage('');
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const inclusions = inclusionsText.split('\n').filter((s) => s.trim().length > 0);
    const exclusions = exclusionsText.split('\n').filter((s) => s.trim().length > 0);

    const numPrice = Number(startingPrice) || 0;
    const finalImage = (imageUploadPreview || image || '').trim();

    updateTourPackage(pkg.id, {
      name,
      code,
      category,
      destination,
      image: finalImage,
      destinationImage: finalImage,
      heroImage: finalImage,
      images: finalImage ? [finalImage] : [],
      days: Number(days),
      nights: Number(nights),
      daysCount: Number(days),
      startingPrice: numPrice,
      priceNumeric: numPrice,
      price: `₹${numPrice.toLocaleString('en-IN')}`,
      pricingType,
      description,
      featured,
      status,
      inclusions,
      exclusions,
      itinerary
    });

    navigate(`/admin/tour-packages/${pkg.id}`);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: '1000px', margin: '0 auto' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: 'var(--bg-surface, #ffffff)',
          padding: '1.25rem 1.5rem',
          borderRadius: '16px',
          border: '1px solid var(--border-light, #e2e8f0)',
          boxShadow: 'var(--shadow-sm)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Button variant="ghost" onClick={() => navigate(`/admin/tour-packages/${pkg.id}`)} style={{ padding: '0.5rem' }}>
            <ArrowLeft size={18} />
          </Button>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main, #090d16)', margin: 0 }}>
              Edit Tour Package #{pkg.code}
            </h1>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted, #64748b)', margin: '0.25rem 0 0' }}>
              Update itinerary schedule, pricing tiers, and holiday parameters.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <Card>
          <CardHeader title="General Package Details" subtitle="Category, location, and durations" />
          <CardBody style={{ padding: '1.25rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.375rem' }}>
                  Package Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={{ width: '100%', padding: '0.625rem 0.75rem', fontSize: '0.8125rem', borderRadius: '8px', border: '1px solid var(--border-medium, #cbd5e1)', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.375rem' }}>
                  Package Code *
                </label>
                <input
                  type="text"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  style={{ width: '100%', padding: '0.625rem 0.75rem', fontSize: '0.8125rem', borderRadius: '8px', border: '1px solid var(--border-medium, #cbd5e1)', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.375rem' }}>
                  Category *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  style={{ width: '100%', padding: '0.625rem 0.75rem', fontSize: '0.8125rem', borderRadius: '8px', border: '1px solid var(--border-medium, #cbd5e1)' }}
                >
                  {packageCategories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.375rem' }}>
                  Destination Location *
                </label>
                <input
                  type="text"
                  required
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  style={{ width: '100%', padding: '0.625rem 0.75rem', fontSize: '0.8125rem', borderRadius: '8px', border: '1px solid var(--border-medium, #cbd5e1)', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.375rem' }}>
                  Starting Price (₹) *
                </label>
                <input
                  type="number"
                  required
                  value={startingPrice}
                  onChange={(e) => setStartingPrice(e.target.value)}
                  style={{ width: '100%', padding: '0.625rem 0.75rem', fontSize: '0.8125rem', borderRadius: '8px', border: '1px solid var(--border-medium, #cbd5e1)', boxSizing: 'border-box', fontWeight: 700 }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.375rem' }}>
                  Pricing Model
                </label>
                <select
                  value={pricingType}
                  onChange={(e) => setPricingType(e.target.value)}
                  style={{ width: '100%', padding: '0.625rem 0.75rem', fontSize: '0.8125rem', borderRadius: '8px', border: '1px solid var(--border-medium, #cbd5e1)' }}
                >
                  <option value="Per Person">Per Person</option>
                  <option value="Per Couple">Per Couple</option>
                  <option value="Per Vehicle (Up to 4 Pax)">Per Vehicle (Up to 4 Pax)</option>
                  <option value="Per Group (Up to 12 Pax)">Per Group (Up to 12 Pax)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.375rem' }}>
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  style={{ width: '100%', padding: '0.625rem 0.75rem', fontSize: '0.8125rem', borderRadius: '8px', border: '1px solid var(--border-medium, #cbd5e1)' }}
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', marginTop: '1.5rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.8125rem', fontWeight: 600 }}>
                  <input
                    type="checkbox"
                    checked={featured}
                    onChange={(e) => setFeatured(e.target.checked)}
                    style={{ accentColor: '#2C3480' }}
                  />
                  <span>Featured Package</span>
                </label>
              </div>

              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.375rem' }}>
                  Package Description *
                </label>
                <textarea
                  required
                  rows="3"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  style={{ width: '100%', padding: '0.625rem 0.75rem', fontSize: '0.8125rem', borderRadius: '8px', border: '1px solid var(--border-medium, #cbd5e1)', boxSizing: 'border-box' }}
                />
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Tour Package Cover Photograph */}
        <Card>
          <CardHeader title="Package Cover Photograph" subtitle="Promotional display photo used across the catalog and quotes" />
          <CardBody style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Preview Banner */}
              <div style={{ height: '220px', width: '100%', borderRadius: '12px', overflow: 'hidden', backgroundColor: '#0f172a', position: 'relative', border: '1.5px solid #cbd5e1' }}>
                {(imageUploadPreview || image) ? (
                  <img
                    src={imageUploadPreview || image}
                    alt="Package Cover"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={(e) => {
                      e.currentTarget.src = 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=800&q=80';
                    }}
                  />
                ) : (
                  <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', flexDirection: 'column', gap: '0.5rem' }}>
                    <ImageIcon size={40} />
                    <span style={{ fontSize: '0.85rem' }}>No image specified</span>
                  </div>
                )}
                <div style={{ position: 'absolute', bottom: '0.5rem', right: '0.5rem', backgroundColor: 'rgba(15, 23, 42, 0.85)', color: '#ffffff', padding: '0.25rem 0.65rem', borderRadius: '4px', fontSize: '0.725rem', fontWeight: 700 }}>
                  Active Preview
                </div>
              </div>

              {/* Upload & URL Inputs */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
                <div style={{ padding: '0.85rem', border: '1.5px dashed #cbd5e1', borderRadius: '10px', backgroundColor: '#f8fafc', textAlign: 'center' }}>
                  <Upload size={22} color="#2C3480" style={{ margin: '0 auto 0.35rem' }} />
                  <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#0f172a' }}>Upload File from Device</div>
                  <div style={{ fontSize: '0.725rem', color: '#64748b', margin: '0.2rem 0 0.6rem' }}>JPG, PNG or WebP up to 5MB</div>
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
                    Select Photo
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageFileChange}
                      style={{ display: 'none' }}
                    />
                  </label>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.35rem' }}>
                    Or Enter Direct Image URL
                  </label>
                  <input
                    type="url"
                    value={image}
                    onChange={(e) => {
                      setImage(e.target.value);
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
                    Direct web URL or CDN photograph link.
                  </span>
                </div>
              </div>

              {/* Destination Presets */}
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '0.4rem' }}>
                  Or Choose from Destination Presets:
                </span>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(135px, 1fr))', gap: '0.5rem', maxHeight: '150px', overflowY: 'auto', padding: '2px' }}>
                  {TOUR_IMAGE_PRESETS.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setImage(preset.url);
                        setImageUploadPreview(preset.url);
                      }}
                      style={{
                        padding: '0.35rem',
                        borderRadius: '8px',
                        border: (image === preset.url || imageUploadPreview === preset.url) ? '2px solid #2C3480' : '1px solid #e2e8f0',
                        backgroundColor: (image === preset.url || imageUploadPreview === preset.url) ? '#EEF0FD' : '#ffffff',
                        cursor: 'pointer',
                        textAlign: 'left',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.25rem'
                      }}
                    >
                      <img
                        src={preset.url}
                        alt={preset.label}
                        style={{ width: '100%', height: '50px', objectFit: 'cover', borderRadius: '4px' }}
                      />
                      <span style={{ fontSize: '0.675rem', fontWeight: 700, color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {preset.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Day-Wise Itinerary */}
        <Card>
          <CardHeader
            title="Itinerary Schedule"
            action={
              <Button type="button" size="sm" variant="outline" leftIcon={<Plus size={14} />} onClick={handleAddDay}>
                Add Day
              </Button>
            }
          />
          <CardBody style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              {itinerary.map((dayItem, idx) => (
                <div key={idx} style={{ padding: '0.875rem', borderRadius: '8px', backgroundColor: 'var(--bg-app, #f8fafc)', border: '1px solid var(--border-light, #e2e8f0)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.375rem' }}>
                    <span style={{ fontWeight: 800, fontSize: '0.8125rem', color: 'var(--color-primary, #2C3480)' }}>
                      DAY {dayItem.day}
                    </span>
                    {itinerary.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveDay(idx)}
                        style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', fontSize: '0.75rem' }}
                      >
                        Remove Day
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    required
                    value={dayItem.title}
                    onChange={(e) => handleItineraryChange(idx, 'title', e.target.value)}
                    style={{ width: '100%', padding: '0.5rem 0.75rem', fontSize: '0.8125rem', borderRadius: '6px', border: '1px solid var(--border-medium, #cbd5e1)', marginBottom: '0.375rem', boxSizing: 'border-box', fontWeight: 600 }}
                  />
                  <textarea
                    rows="2"
                    value={dayItem.details}
                    onChange={(e) => handleItineraryChange(idx, 'details', e.target.value)}
                    style={{ width: '100%', padding: '0.5rem 0.75rem', fontSize: '0.8125rem', borderRadius: '6px', border: '1px solid var(--border-medium, #cbd5e1)', boxSizing: 'border-box' }}
                  />
                </div>
              ))}
            </div>
          </CardBody>
        </Card>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          <Button variant="ghost" onClick={() => navigate(`/admin/tour-packages/${pkg.id}`)}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" leftIcon={<Save size={16} />}>
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  );
}

export default TourPackageEdit;
