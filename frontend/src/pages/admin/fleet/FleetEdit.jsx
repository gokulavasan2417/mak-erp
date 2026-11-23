// MAK Tours & Travels ERP - Edit Fleet Vehicle
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Trash2, AlertTriangle, Camera, Upload, Image as ImageIcon } from 'lucide-react';
import { Card, CardHeader, CardBody } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Modal } from '../../../components/ui/Modal';
import { useAdminData } from '../../../context/AdminDataContext';
import { useToast } from '../../../context/ToastContext';
import { vehicleCategories, vehicleStatuses } from '../../../data';
import { CAR_IMAGE_PRESETS } from './FleetList';

export function FleetEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { vehicles, vendors = [], updateVehicle, deleteVehicle } = useAdminData();

  const vehicle = vehicles.find(
    (v) => v.id === id || v._id === id || (v.regNo && v.regNo.replace(/\s+/g, '').toUpperCase() === (id || '').replace(/\s+/g, '').toUpperCase())
  );

  const [isRemoveModalOpen, setIsRemoveModalOpen] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  const [regNo, setRegNo] = useState('');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [category, setCategory] = useState('');
  const [image, setImage] = useState('');
  const [imageUploadPreview, setImageUploadPreview] = useState('');
  const [seatingCapacity, setSeatingCapacity] = useState(7);
  const [isAC, setIsAC] = useState(true);
  const [fuelType, setFuelType] = useState('Diesel');
  const [ownership, setOwnership] = useState('MAK Owned');
  const [selectedVendorId, setSelectedVendorId] = useState('');
  const [status, setStatus] = useState('Available');
  const [ratePerKm, setRatePerKm] = useState(15);
  const [insuranceExpiry, setInsuranceExpiry] = useState('');
  const [fitnessExpiry, setFitnessExpiry] = useState('');
  const [permitExpiry, setPermitExpiry] = useState('');

  useEffect(() => {
    if (vehicle) {
      setRegNo(vehicle.regNo || '');
      setBrand(vehicle.brand || '');
      setModel(vehicle.model || '');
      setCategory(vehicle.category || 'Premium MPV');
      const currentImg = vehicle.image || (Array.isArray(vehicle.images) && vehicle.images[0]) || '';
      setImage(currentImg);
      setImageUploadPreview(currentImg);
      setSeatingCapacity(vehicle.seatingCapacity || 7);
      setIsAC(Boolean(vehicle.isAC));
      setFuelType(vehicle.fuelType || 'Diesel');
      setOwnership(vehicle.ownership || 'MAK Owned');
      setSelectedVendorId(vehicle.vendorId || '');
      setStatus(vehicle.status || 'Available');
      setRatePerKm(vehicle.ratePerKm || vehicle.pricePerKm || 15);
      setInsuranceExpiry(vehicle.insuranceExpiry || '');
      setFitnessExpiry(vehicle.fitnessExpiry || '');
      setPermitExpiry(vehicle.permitExpiry || '');
    }
  }, [vehicle]);

  if (!vehicle) {
    return (
      <Card style={{ padding: '3rem', textAlign: 'center' }}>
        <h2>Vehicle Not Found</h2>
        <Button variant="primary" onClick={() => navigate('/admin/fleet')}>Back to Fleet</Button>
      </Card>
    );
  }

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
    const finalImage = (imageUploadPreview || image || '').trim();

    updateVehicle(vehicle.id, {
      regNo: regNo.toUpperCase(),
      brand,
      model,
      category,
      image: finalImage,
      images: finalImage ? [finalImage] : [],
      seatingCapacity: Number(seatingCapacity),
      isAC,
      fuelType,
      ownership,
      vendorId: ownership === 'Vendor Attached' ? (selectedVendor?.id || null) : null,
      vendorName: ownership === 'Vendor Attached' ? (selectedVendor?.businessName || selectedVendor?.name || null) : null,
      vendorCode: ownership === 'Vendor Attached' ? (selectedVendor?.vendorCode || null) : null,
      vendorContact: ownership === 'Vendor Attached' ? (selectedVendor?.phone || null) : null,
      vendorCity: ownership === 'Vendor Attached' ? (selectedVendor?.city || null) : null,
      status,
      odometerKm: vehicle.odometerKm || 0,
      ratePerKm: Number(ratePerKm) || 15,
      pricePerKm: Number(ratePerKm) || 15,
      insuranceExpiry,
      fitnessExpiry,
      permitExpiry
    });

    navigate(`/admin/fleet/${vehicle.id}`);
  };

  const handleConfirmRemove = async () => {
    if (!vehicle?.id && !vehicle?._id) return;
    setIsRemoving(true);
    try {
      const targetId = vehicle.id || vehicle._id;
      const result = await deleteVehicle(targetId);
      if (result !== false) {
        setIsRemoveModalOpen(false);
        navigate('/admin/fleet');
      }
    } catch (err) {
      console.error('Error removing vehicle:', err);
      toast?.error?.(err?.response?.data?.message || err?.message || 'Failed to remove vehicle');
    } finally {
      setIsRemoving(false);
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
          <Button variant="ghost" onClick={() => navigate(`/admin/fleet/${vehicle.id}`)} style={{ padding: '0.5rem' }}>
            <ArrowLeft size={18} />
          </Button>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main, #090d16)', margin: 0 }}>
              Edit Vehicle - {vehicle.regNo}
            </h1>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted, #64748b)', margin: '0.25rem 0 0' }}>
              Update vehicle parameters, tariff rates, and statutory dates.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <Card>
          <CardHeader title="Vehicle Specifications" subtitle="Registration and model particulars" />
          <CardBody style={{ padding: '1.25rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, marginBottom: '0.375rem' }}>
                  Reg Number *
                </label>
                <input
                  type="text"
                  required
                  value={regNo}
                  onChange={(e) => setRegNo(e.target.value)}
                  style={{ width: '100%', padding: '0.625rem 0.75rem', fontSize: '0.8125rem', borderRadius: '8px', border: '1px solid var(--border-medium, #cbd5e1)', boxSizing: 'border-box', fontWeight: 700 }}
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
                  style={{ width: '100%', padding: '0.625rem 0.75rem', fontSize: '0.8125rem', borderRadius: '8px', border: '1px solid var(--border-medium, #cbd5e1)', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.375rem' }}>
                  Model *
                </label>
                <input
                  type="text"
                  required
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
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
                    This vehicle is attached to the selected vendor for trip dispatch and settlement.
                  </span>
                </div>
              )}

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.375rem' }}>
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  style={{ width: '100%', padding: '0.625rem 0.75rem', fontSize: '0.8125rem', borderRadius: '8px', border: '1px solid var(--border-medium, #cbd5e1)' }}
                >
                  {vehicleStatuses.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Document Expiries" subtitle="Statutory permit and compliance renewals" />
          <CardBody style={{ padding: '1.25rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.375rem' }}>
                  Insurance Expiry Date
                </label>
                <input
                  type="date"
                  value={insuranceExpiry}
                  onChange={(e) => setInsuranceExpiry(e.target.value)}
                  style={{ width: '100%', padding: '0.625rem 0.75rem', fontSize: '0.8125rem', borderRadius: '8px', border: '1px solid var(--border-medium, #cbd5e1)', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.375rem' }}>
                  Fitness Certificate Expiry
                </label>
                <input
                  type="date"
                  value={fitnessExpiry}
                  onChange={(e) => setFitnessExpiry(e.target.value)}
                  style={{ width: '100%', padding: '0.625rem 0.75rem', fontSize: '0.8125rem', borderRadius: '8px', border: '1px solid var(--border-medium, #cbd5e1)', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.375rem' }}>
                  Permit Expiry Date
                </label>
                <input
                  type="date"
                  value={permitExpiry}
                  onChange={(e) => setPermitExpiry(e.target.value)}
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

        {/* Danger Zone: Remove Vehicle Option */}
        <Card style={{ borderColor: '#fca5a5', backgroundColor: '#fffaf0' }}>
          <CardBody style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '10px',
                    backgroundColor: '#fee2e2',
                    color: '#dc2626',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}
                >
                  <AlertTriangle size={22} />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#991b1b' }}>
                    Danger Zone &bull; Remove Vehicle from Fleet
                  </h4>
                  <p style={{ margin: '0.2rem 0 0', fontSize: '0.8125rem', color: '#7f1d1d' }}>
                    Decommission this vehicle from the active corporate fleet. All linked customer bookings, driver assignments, and ledger transactions will remain preserved.
                  </p>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={() => setIsRemoveModalOpen(true)}
                style={{
                  borderColor: '#dc2626',
                  color: '#dc2626',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#dc2626';
                  e.currentTarget.style.color = '#ffffff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = '#dc2626';
                }}
              >
                <Trash2 size={16} /> Remove Vehicle
              </Button>
            </div>
          </CardBody>
        </Card>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          <Button variant="ghost" onClick={() => navigate(`/admin/fleet/${vehicle.id}`)}>Cancel</Button>
          <Button type="submit" variant="primary" leftIcon={<Save size={16} />}>
            Save Changes
          </Button>
        </div>
      </form>

      {/* Removal Confirmation Modal */}
      <Modal
        isOpen={isRemoveModalOpen}
        onClose={() => !isRemoving && setIsRemoveModalOpen(false)}
        title="Confirm Vehicle Removal"
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', width: '100%' }}>
            <Button
              type="button"
              variant="outline"
              disabled={isRemoving}
              onClick={() => setIsRemoveModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              disabled={isRemoving}
              style={{ backgroundColor: '#dc2626', borderColor: '#dc2626', color: '#ffffff', fontWeight: 700 }}
              onClick={handleConfirmRemove}
            >
              {isRemoving ? 'Removing...' : 'Confirm Remove'}
            </Button>
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.875rem',
              backgroundColor: '#fef2f2',
              borderRadius: '8px',
              border: '1px solid #fecaca'
            }}
          >
            <AlertTriangle size={24} color="#dc2626" style={{ flexShrink: 0 }} />
            <div style={{ fontSize: '0.875rem', color: '#991b1b', lineHeight: 1.4 }}>
              Are you sure you want to remove <strong>{vehicle?.regNo}</strong> ({vehicle?.brand} {vehicle?.model}) from the active fleet?
            </div>
          </div>
          <p style={{ margin: 0, fontSize: '0.8125rem', color: '#475569', lineHeight: 1.5 }}>
            This action archives the vehicle and removes it from active fleet operations. All historical booking manifests, route assignments, and billing ledgers are safely preserved.
          </p>
        </div>
      </Modal>
    </div>
  );
}

export default FleetEdit;
