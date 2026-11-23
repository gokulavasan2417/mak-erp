// MAK Tours & Travels ERP - Add Vehicle to Fleet
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Car, Camera, Upload, Image as ImageIcon } from 'lucide-react';
import { Card, CardHeader, CardBody } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { useAdminData } from '../../../context/AdminDataContext';
import { useToast } from '../../../context/ToastContext';
import { vehicleCategories, vehicleStatuses } from '../../../data';
import { CAR_IMAGE_PRESETS } from './FleetList';

export function FleetCreate() {
  const navigate = useNavigate();
  const toast = useToast();
  const { addVehicle, vendors = [] } = useAdminData();

  const [regNo, setRegNo] = useState('');
  const [brand, setBrand] = useState('Toyota');
  const [model, setModel] = useState('');
  const [category, setCategory] = useState('Premium MPV');
  const [seatingCapacity, setSeatingCapacity] = useState(7);
  const [isAC, setIsAC] = useState(true);
  const [fuelType, setFuelType] = useState('Diesel');
  const [color, setColor] = useState('Super White');
  const [manufacturingYear, setManufacturingYear] = useState(2025);
  const [ratePerKm, setRatePerKm] = useState(15);
  const [ownership, setOwnership] = useState('MAK Owned');
  const [selectedVendorId, setSelectedVendorId] = useState('');
  const [status, setStatus] = useState('Available');

  const [insuranceExpiry, setInsuranceExpiry] = useState('2027-06-30');
  const [fitnessExpiry, setFitnessExpiry] = useState('2027-08-15');
  const [permitExpiry, setPermitExpiry] = useState('2028-04-10');
  const [pucExpiry, setPucExpiry] = useState('2027-02-18');
  const [fastagId, setFastagId] = useState('');

  const [image, setImage] = useState(CAR_IMAGE_PRESETS?.[0]?.url || 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&w=900&q=80');
  const [imageUploadPreview, setImageUploadPreview] = useState(CAR_IMAGE_PRESETS?.[0]?.url || '');

  const handleCarImageFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast?.warning?.('Car image size exceeds 5MB. Please choose a smaller image.');
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

    const selectedVendor = vendors.find((vnd) => vnd.id === selectedVendorId);
    const finalImage = imageUploadPreview || image || CAR_IMAGE_PRESETS?.[0]?.url || '';

    const created = addVehicle({
      regNo: regNo.toUpperCase(),
      brand,
      model,
      category,
      seatingCapacity: Number(seatingCapacity),
      isAC,
      fuelType,
      color,
      manufacturingYear: Number(manufacturingYear),
      odometerKm: 0,
      ratePerKm: Number(ratePerKm) || 15,
      pricePerKm: Number(ratePerKm) || 15,
      ownership,
      vendorId: ownership === 'Vendor Attached' ? (selectedVendor?.id || null) : null,
      vendorName: ownership === 'Vendor Attached' ? (selectedVendor?.businessName || selectedVendor?.name || null) : null,
      vendorCode: ownership === 'Vendor Attached' ? (selectedVendor?.vendorCode || null) : null,
      vendorContact: ownership === 'Vendor Attached' ? (selectedVendor?.phone || null) : null,
      vendorCity: ownership === 'Vendor Attached' ? (selectedVendor?.city || null) : null,
      status,
      image: finalImage,
      images: finalImage ? [finalImage] : [],
      insuranceExpiry,
      fitnessExpiry,
      permitExpiry,
      pucExpiry,
      fastagId: fastagId || `FAST-${regNo.toUpperCase()}`
    });

    if (created?.id) {
      navigate(`/admin/fleet/${created.id}`);
    } else {
      navigate('/admin/fleet');
    }
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
          <Button variant="ghost" onClick={() => navigate('/admin/fleet')} style={{ padding: '0.5rem' }}>
            <ArrowLeft size={18} />
          </Button>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main, #090d16)', margin: 0 }}>
              Add Vehicle to Fleet
            </h1>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted, #64748b)', margin: '0.25rem 0 0' }}>
              Register a new commercial tourist vehicle or attached vendor unit.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <Card>
          <CardHeader title="Vehicle Identification & Specs" subtitle="RTO registration, brand, and seating layout" />
          <CardBody style={{ padding: '1.25rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, marginBottom: '0.375rem' }}>
                  Vehicle Reg Number (Yellow Board) *
                </label>
                <input
                  type="text"
                  required
                  value={regNo}
                  onChange={(e) => setRegNo(e.target.value)}
                  placeholder="e.g. KA-01-MJ-9900"
                  style={{ width: '100%', padding: '0.625rem 0.75rem', fontSize: '0.8125rem', borderRadius: '8px', border: '1.5px solid var(--color-primary, #2C3480)', fontWeight: 700, textTransform: 'uppercase', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.375rem' }}>
                  Brand *
                </label>
                <input
                  type="text"
                  required
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  placeholder="e.g. Toyota, Force, Kia, Tata"
                  style={{ width: '100%', padding: '0.625rem 0.75rem', fontSize: '0.8125rem', borderRadius: '8px', border: '1px solid var(--border-medium, #cbd5e1)', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.375rem' }}>
                  Model &amp; Variant *
                </label>
                <input
                  type="text"
                  required
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder="e.g. Innova Crysta ZX 2.4 AT"
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
                  {vehicleCategories.filter((c) => c !== 'All Categories').map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.375rem' }}>
                  Seating Capacity
                </label>
                <input
                  type="number"
                  min="2"
                  max="60"
                  value={seatingCapacity}
                  onChange={(e) => setSeatingCapacity(e.target.value)}
                  style={{ width: '100%', padding: '0.625rem 0.75rem', fontSize: '0.8125rem', borderRadius: '8px', border: '1px solid var(--border-medium, #cbd5e1)', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.375rem' }}>
                  Fuel Type
                </label>
                <select
                  value={fuelType}
                  onChange={(e) => setFuelType(e.target.value)}
                  style={{ width: '100%', padding: '0.625rem 0.75rem', fontSize: '0.8125rem', borderRadius: '8px', border: '1px solid var(--border-medium, #cbd5e1)' }}
                >
                  <option value="Diesel">Diesel</option>
                  <option value="Petrol">Petrol</option>
                  <option value="Strong Hybrid">Strong Hybrid</option>
                  <option value="Electric">Electric</option>
                  <option value="CNG">CNG</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.375rem' }}>
                  Per-Kilometer Rate (₹/km) *
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  required
                  value={ratePerKm}
                  onChange={(e) => setRatePerKm(e.target.value)}
                  style={{ width: '100%', padding: '0.625rem 0.75rem', fontSize: '0.8125rem', borderRadius: '8px', border: '1px solid var(--border-medium, #cbd5e1)', boxSizing: 'border-box', fontWeight: 700, color: '#15803d' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.375rem' }}>
                  Ownership Model
                </label>
                <select
                  value={ownership}
                  onChange={(e) => setOwnership(e.target.value)}
                  style={{ width: '100%', padding: '0.625rem 0.75rem', fontSize: '0.8125rem', borderRadius: '8px', border: '1px solid var(--border-medium, #cbd5e1)' }}
                >
                  <option value="MAK Owned">MAK Owned (In-House)</option>
                  <option value="Vendor Attached">Vendor Attached</option>
                </select>
              </div>

              {ownership === 'Vendor Attached' && (
                <div style={{ gridColumn: '1 / -1', backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', padding: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#92400e', marginBottom: '0.375rem' }}>
                    Select Attached Vendor Partner *
                  </label>
                  <select
                    value={selectedVendorId}
                    onChange={(e) => setSelectedVendorId(e.target.value)}
                    required
                    style={{ width: '100%', padding: '0.625rem 0.75rem', fontSize: '0.8125rem', borderRadius: '8px', border: '1px solid #d97706', backgroundColor: '#ffffff' }}
                  >
                    <option value="">-- Choose Partner from Vendors Register --</option>
                    {vendors.map((vnd) => (
                      <option key={vnd.id} value={vnd.id}>
                        {vnd.businessName || vnd.name} ({vnd.vendorCode || vnd.id}) - {vnd.city}
                      </option>
                    ))}
                  </select>
                  <span style={{ fontSize: '0.75rem', color: '#b45309', display: 'block', marginTop: '0.35rem' }}>
                    This vehicle will be linked to the vendor's profile and fleet settlement records.
                  </span>
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', marginTop: '1.25rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.8125rem', fontWeight: 600 }}>
                  <input
                    type="checkbox"
                    checked={isAC}
                    onChange={(e) => setIsAC(e.target.checked)}
                    style={{ accentColor: '#2C3480' }}
                  />
                  <span>Air Conditioned (AC Climate Control)</span>
                </label>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Statutory Compliance & Expiry Dates" subtitle="RTO Fitness, Insurance, and National Tourism Permits" />
          <CardBody style={{ padding: '1.25rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.375rem' }}>
                  Insurance Expiry Date *
                </label>
                <input
                  type="date"
                  required
                  value={insuranceExpiry}
                  onChange={(e) => setInsuranceExpiry(e.target.value)}
                  style={{ width: '100%', padding: '0.625rem 0.75rem', fontSize: '0.8125rem', borderRadius: '8px', border: '1px solid var(--border-medium, #cbd5e1)', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.375rem' }}>
                  RTO Fitness Certificate (FC) Expiry *
                </label>
                <input
                  type="date"
                  required
                  value={fitnessExpiry}
                  onChange={(e) => setFitnessExpiry(e.target.value)}
                  style={{ width: '100%', padding: '0.625rem 0.75rem', fontSize: '0.8125rem', borderRadius: '8px', border: '1px solid var(--border-medium, #cbd5e1)', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.375rem' }}>
                  All India Tourist Permit Expiry *
                </label>
                <input
                  type="date"
                  required
                  value={permitExpiry}
                  onChange={(e) => setPermitExpiry(e.target.value)}
                  style={{ width: '100%', padding: '0.625rem 0.75rem', fontSize: '0.8125rem', borderRadius: '8px', border: '1px solid var(--border-medium, #cbd5e1)', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.375rem' }}>
                  Fastag Tag Identifier
                </label>
                <input
                  type="text"
                  value={fastagId}
                  onChange={(e) => setFastagId(e.target.value)}
                  placeholder="e.g. FAST-KA01-9900"
                  style={{ width: '100%', padding: '0.625rem 0.75rem', fontSize: '0.8125rem', borderRadius: '8px', border: '1px solid var(--border-medium, #cbd5e1)', boxSizing: 'border-box' }}
                />
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Vehicle Photograph & Visual Asset */}
        <Card>
          <CardHeader title="Vehicle Photograph" subtitle="Display photograph for fleet dispatch, driver apps and customer quotes" />
          <CardBody style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Preview Banner */}
              <div style={{ height: '220px', width: '100%', borderRadius: '12px', overflow: 'hidden', backgroundColor: '#0f172a', position: 'relative', border: '1.5px solid #cbd5e1' }}>
                {(imageUploadPreview || image) ? (
                  <img
                    src={imageUploadPreview || image}
                    alt="Vehicle Preview"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={(e) => {
                      e.currentTarget.src = 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&w=900&q=80';
                    }}
                  />
                ) : (
                  <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', flexDirection: 'column', gap: '0.5rem' }}>
                    <ImageIcon size={40} />
                    <span style={{ fontSize: '0.85rem' }}>No vehicle photograph specified</span>
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
                  <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#0f172a' }}>Upload Car Image</div>
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
                      onChange={handleCarImageFileChange}
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
                    Direct web URL or asset link to car photo.
                  </span>
                </div>
              </div>

              {/* Fleet Presets */}
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '0.4rem' }}>
                  Or Choose from Fleet Vehicle Presets:
                </span>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(135px, 1fr))', gap: '0.5rem', maxHeight: '150px', overflowY: 'auto', padding: '2px' }}>
                  {CAR_IMAGE_PRESETS.map((preset, idx) => (
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

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          <Button variant="ghost" onClick={() => navigate('/admin/fleet')}>Cancel</Button>
          <Button type="submit" variant="primary" leftIcon={<Save size={16} />}>
            Save &amp; Enroll Vehicle
          </Button>
        </div>
      </form>
    </div>
  );
}

export default FleetCreate;
