// MAK Tours & Travels ERP - Edit Vendor Vehicle
import React, { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Car,
  ArrowLeft,
  CheckCircle,
  Upload,
  UploadCloud,
  X,
  Star,
  Trash2,
  Plus,
  AlertTriangle,
  Link as LinkIcon
} from 'lucide-react';
import { Card, CardHeader, CardBody } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Modal } from '../../../components/ui/Modal';
import { useVendorData } from '../../../context/VendorDataContext';
import { useToast } from '../../../context/ToastContext';
import { vendorVehicleCategories } from '../../../data/vendorPortalData';
import { compressImage } from '../../../utils/imageUtils';
import { VendorNavTabs, VENDOR_VEHICLE_TABS } from '../../../components/vendor/VendorNavTabs';

const availableAmenitiesList = [
  'AC',
  'GPS Telematics',
  'Music System',
  'Bluetooth Audio',
  'USB Fast Charging',
  'Pushback Seats',
  'Reclining Seats',
  'First Aid Kit',
  'Fire Extinguisher',
  'Luggage Carrier',
  'Wi-Fi Hotspot',
  'Complimentary Water Bottles'
];

export function EditVehicle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { vehicles, updateVehicle, deleteVehicle, drivers } = useVendorData();
  const toast = useToast();
  const fileInputRef = useRef(null);

  const vehicle = vehicles.find(
    (v) => v.id === id || v._id === id || (v.regNo && v.regNo.replace(/\s+/g, '').toUpperCase() === (id || '').replace(/\s+/g, '').toUpperCase())
  ) || null;

  const [isRemoveModalOpen, setIsRemoveModalOpen] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  const [regNo, setRegNo] = useState(vehicle?.regNo || '');
  const [brand, setBrand] = useState(vehicle?.brand || 'Toyota');
  const [model, setModel] = useState(vehicle?.model || '');
  const [category, setCategory] = useState(vehicle?.category && vehicle.category !== 'All' ? vehicle.category : 'Premium MPV');
  const [manufacturingYear, setManufacturingYear] = useState(vehicle?.manufacturingYear || 2024);
  const [seatingCapacity, setSeatingCapacity] = useState(vehicle?.seatingCapacity || 7);
  const [isAC, setIsAC] = useState(vehicle?.isAC ?? true);
  const [fuelType, setFuelType] = useState(vehicle?.fuelType || 'Diesel');
  const [color, setColor] = useState(vehicle?.color || 'Super White');
  const [luggageCapacity, setLuggageCapacity] = useState(vehicle?.luggageCapacity || '4 Bags');
  const [perKmRate, setPerKmRate] = useState(vehicle?.perKmRate || 22);
  const [minKmPerDay, setMinKmPerDay] = useState(vehicle?.minKmPerDay || 300);
  const [driverBata, setDriverBata] = useState(vehicle?.driverBata || 500);
  const [nightCharges, setNightCharges] = useState(vehicle?.nightCharges || 350);
  const [extraHourRate, setExtraHourRate] = useState(vehicle?.extraHourRate || 150);
  const [selectedAmenities, setSelectedAmenities] = useState(vehicle?.amenities || []);

  // Images state
  const [images, setImages] = useState(() => {
    if (vehicle?.images && Array.isArray(vehicle.images) && vehicle.images.length > 0) {
      return vehicle.images;
    }
    if (vehicle?.image) {
      return [vehicle.image];
    }
    return [];
  });
  const [isDragging, setIsDragging] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlInput, setUrlInput] = useState('');

  const toggleAmenity = (item) => {
    setSelectedAmenities((prev) =>
      prev.includes(item) ? prev.filter((a) => a !== item) : [...prev, item]
    );
  };

  const handleFiles = async (fileList) => {
    if (!fileList || fileList.length === 0) return;
    const filesArray = Array.from(fileList);
    const validImageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg', 'image/avif', 'image/heic'];
    const maxSizeBytes = 10 * 1024 * 1024;

    for (const file of filesArray) {
      if (!file.type.startsWith('image/') && !validImageTypes.includes(file.type.toLowerCase())) {
        toast?.error?.(`"${file.name}" is not a supported image file (PNG, JPG, WEBP only).`);
        continue;
      }
      if (file.size > maxSizeBytes) {
        toast?.error?.(`"${file.name}" exceeds the 10MB limit.`);
        continue;
      }

      try {
        const compressedBase64 = await compressImage(file, { maxWidth: 1200, maxHeight: 1200, quality: 0.82 });
        if (compressedBase64) {
          setImages((prev) => [...prev, compressedBase64]);
          toast?.success?.(`Added "${file.name}"`);
        }
      } catch (err) {
        console.error('Failed to process image:', err);
        toast?.error?.(`Failed to process "${file.name}"`);
      }
    }
  };

  const handleFileInputChange = (e) => {
    handleFiles(e.target.files);
    e.target.value = '';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleAddImageUrl = (e) => {
    e?.preventDefault();
    const trimmed = urlInput.trim();
    if (!trimmed) return;
    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://') && !trimmed.startsWith('data:image/')) {
      toast?.error?.('Please enter a valid HTTP or HTTPS image URL');
      return;
    }
    setImages((prev) => [...prev, trimmed]);
    setUrlInput('');
    setShowUrlInput(false);
    toast?.success?.('Image link added to gallery');
  };

  const handleSetPrimary = (index) => {
    if (index === 0) return;
    setImages((prev) => {
      const selected = prev[index];
      const remainder = prev.filter((_, i) => i !== index);
      return [selected, ...remainder];
    });
    toast?.info?.('Primary cover photo updated');
  };

  const handleRemoveImage = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    toast?.info?.('Photo removed');
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    updateVehicle(vehicle.id, {
      regNo: regNo.toUpperCase(),
      brand,
      model,
      name: `${brand} ${model}`.trim(),
      category,
      manufacturingYear: parseInt(manufacturingYear) || 2024,
      seatingCapacity: parseInt(seatingCapacity) || 7,
      seating: `${seatingCapacity} Seater`,
      isAC,
      fuelType,
      color,
      luggageCapacity,
      image: images.length > 0 ? images[0] : '',
      images: images,
      amenities: selectedAmenities,
      perKmRate: parseFloat(perKmRate) || 20,
      minKmPerDay: parseInt(minKmPerDay) || 300,
      driverBata: parseInt(driverBata) || 500,
      nightCharges: parseInt(nightCharges) || 350,
      extraHourRate: parseInt(extraHourRate) || 150,
      assignedDriverId: '',
      assignedDriverName: 'Assigned by MAK Admin'
    });

    navigate(`/vendor/vehicles/${vehicle.id}`);
  };

  const handleConfirmRemove = async () => {
    if (!vehicle?.id) return;
    setIsRemoving(true);
    try {
      const result = await deleteVehicle(vehicle.id);
      if (result !== false) {
        setIsRemoveModalOpen(false);
        navigate('/vendor/vehicles');
      }
    } catch (err) {
      console.error('Error removing vehicle:', err);
      toast.error(err?.response?.data?.message || err?.message || 'Failed to remove vehicle');
    } finally {
      setIsRemoving(false);
    }
  };

  if (!vehicle) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', maxWidth: '600px', margin: '2rem auto' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.75rem' }}>Vehicle Not Found</h2>
        <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: '1.5rem' }}>The requested vehicle is not present in your active fleet inventory.</p>
        <button
          type="button"
          onClick={() => navigate('/vendor/vehicles')}
          style={{ padding: '0.625rem 1.25rem', backgroundColor: '#2C3480', color: '#ffffff', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}
        >
          Back to Fleet Inventory
        </button>
      </div>
    );
  }

  return (
    <>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '1000px', margin: '0 auto' }}>
      <VendorNavTabs tabs={VENDOR_VEHICLE_TABS} />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <button
            type="button"
            onClick={() => navigate(`/vendor/vehicles/${vehicle.id}`)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              background: 'none',
              border: 'none',
              color: '#64748b',
              fontSize: '0.85rem',
              cursor: 'pointer',
              marginBottom: '0.5rem',
              padding: 0
            }}
          >
            <ArrowLeft size={16} /> Back to Vehicle
          </button>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
            Edit Vehicle: {vehicle.regNo}
          </h1>
          <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0.25rem 0 0' }}>
            Modify technical specifications and commercial per-KM rates
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Button type="button" variant="outline" onClick={() => navigate(`/vendor/vehicles/${vehicle.id}`)}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" style={{ backgroundColor: '#2C3480', fontWeight: 700 }}>
            <CheckCircle size={16} style={{ marginRight: '0.35rem' }} /> Save Changes
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader title="Vehicle Specifications" subtitle="General identity and specifications" />
        <CardBody style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                Registration Number *
              </label>
              <input
                type="text"
                value={regNo}
                onChange={(e) => setRegNo(e.target.value)}
                required
                style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.875rem', fontWeight: 700, fontFamily: 'monospace' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                Brand / Manufacturer *
              </label>
              <input
                type="text"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                required
                style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.875rem' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                Model & Variant *
              </label>
              <input
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                required
                style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.875rem' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                Category *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.875rem', backgroundColor: '#fff' }}
              >
                {vendorVehicleCategories.filter((c) => c !== 'All' && c !== 'All Categories').map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                Seating Capacity
              </label>
              <input
                type="number"
                value={seatingCapacity}
                onChange={(e) => setSeatingCapacity(e.target.value)}
                style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.875rem' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                Fuel Type
              </label>
              <select
                value={fuelType}
                onChange={(e) => setFuelType(e.target.value)}
                style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.875rem', backgroundColor: '#fff' }}
              >
                <option value="Diesel">Diesel</option>
                <option value="Petrol">Petrol</option>
                <option value="Hybrid Petrol">Hybrid Petrol</option>
                <option value="CNG">CNG</option>
                <option value="Electric (EV)">Electric (EV)</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                Air Conditioning
              </label>
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.85rem' }}>
                  <input type="radio" checked={isAC} onChange={() => setIsAC(true)} /> Full AC
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.85rem' }}>
                  <input type="radio" checked={!isAC} onChange={() => setIsAC(false)} /> Non-AC
                </label>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                Color
              </label>
              <input
                type="text"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.875rem' }}
              />
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Vehicle Photographs & Gallery */}
      <Card>
        <CardHeader
          title="Vehicle Photographs & Gallery"
          subtitle="Manage uploaded vehicle photographs, exterior & cabin views"
          action={
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                style={{ fontSize: '0.75rem', fontWeight: 600 }}
              >
                <Upload size={14} style={{ marginRight: '0.35rem' }} /> Choose from Device
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => setShowUrlInput((prev) => !prev)}
                style={{ fontSize: '0.75rem' }}
              >
                <LinkIcon size={14} style={{ marginRight: '0.35rem' }} /> {showUrlInput ? 'Hide URL' : 'Paste URL'}
              </Button>
              {images.length > 0 && (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => setImages([])}
                  style={{ fontSize: '0.75rem', color: '#ef4444' }}
                >
                  Clear All
                </Button>
              )}
            </div>
          }
        />
        <CardBody style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <input
            type="file"
            ref={fileInputRef}
            accept="image/png, image/jpeg, image/jpg, image/webp"
            multiple
            onChange={handleFileInputChange}
            style={{ display: 'none' }}
          />

          {showUrlInput && (
            <div
              style={{
                display: 'flex',
                gap: '0.5rem',
                backgroundColor: '#f8fafc',
                padding: '0.75rem',
                borderRadius: '10px',
                border: '1px solid #e2e8f0'
              }}
            >
              <input
                type="url"
                placeholder="Paste direct image link (e.g. https://example.com/my-vehicle.jpg)"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddImageUrl();
                  }
                }}
                style={{
                  flex: 1,
                  padding: '0.5rem 0.75rem',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.85rem'
                }}
              />
              <Button
                type="button"
                size="sm"
                variant="primary"
                onClick={handleAddImageUrl}
                style={{ backgroundColor: '#2C3480', fontWeight: 600 }}
              >
                Add Link
              </Button>
            </div>
          )}

          {images.length === 0 ? (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: `2px dashed ${isDragging ? '#2C3480' : '#cbd5e1'}`,
                backgroundColor: isDragging ? '#EEF0FD' : '#f8fafc',
                borderRadius: '14px',
                padding: '2rem 1.5rem',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.65rem'
              }}
            >
              <div
                style={{
                  width: '50px',
                  height: '50px',
                  borderRadius: '50%',
                  backgroundColor: '#EEF0FD',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1.5px solid #C7CEFA'
                }}
              >
                <UploadCloud size={26} color="#2C3480" />
              </div>
              <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a' }}>
                Upload vehicle photographs
              </div>
              <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                Drag and drop image files here, or <span style={{ color: '#2C3480', fontWeight: 700, textDecoration: 'underline' }}>browse from your device</span>
              </div>
              <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                Supports PNG, JPG, WEBP up to 10MB
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem', color: '#64748b' }}>
                <span>
                  <strong>{images.length}</strong> photo{images.length > 1 ? 's' : ''} in gallery. The first photo is your <strong>Primary Cover Photo</strong>.
                </span>
                <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                  Click "Set as Cover" on any photo to reorder
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem' }}>
                {images.map((imgUrl, idx) => (
                  <div
                    key={idx}
                    style={{
                      position: 'relative',
                      height: '140px',
                      borderRadius: '12px',
                      overflow: 'hidden',
                      border: idx === 0 ? '2px solid #2C3480' : '1px solid #e2e8f0',
                      boxShadow: idx === 0 ? '0 4px 12px rgba(44, 52, 128, 0.15)' : 'none',
                      backgroundColor: '#0f172a'
                    }}
                  >
                    <img
                      src={imgUrl}
                      alt={`Vehicle Photo ${idx + 1}`}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />

                    {idx === 0 ? (
                      <span
                        style={{
                          position: 'absolute',
                          bottom: '0.4rem',
                          left: '0.4rem',
                          backgroundColor: '#2C3480',
                          color: '#ffffff',
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          padding: '0.2rem 0.45rem',
                          borderRadius: '6px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem'
                        }}
                      >
                        <Star size={11} fill="#fbbf24" color="#fbbf24" /> Primary Cover
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleSetPrimary(idx)}
                        style={{
                          position: 'absolute',
                          bottom: '0.4rem',
                          left: '0.4rem',
                          backgroundColor: 'rgba(15, 23, 42, 0.85)',
                          color: '#ffffff',
                          fontSize: '0.65rem',
                          fontWeight: 600,
                          padding: '0.2rem 0.45rem',
                          borderRadius: '6px',
                          border: 'none',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem'
                        }}
                      >
                        <Star size={11} /> Set as Cover
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleRemoveImage(idx)}
                      style={{
                        position: 'absolute',
                        top: '0.4rem',
                        right: '0.4rem',
                        backgroundColor: 'rgba(239, 68, 68, 0.95)',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '50%',
                        width: '24px',
                        height: '24px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                      title="Remove this photo"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}

                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    height: '140px',
                    borderRadius: '12px',
                    border: `2px dashed ${isDragging ? '#2C3480' : '#cbd5e1'}`,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: isDragging ? '#EEF0FD' : '#f8fafc',
                    cursor: 'pointer',
                    padding: '0.75rem',
                    textAlign: 'center'
                  }}
                >
                  <Plus size={22} color="#2C3480" />
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#2C3480', marginTop: '0.35rem' }}>
                    + Add More Photos
                  </span>
                  <span style={{ fontSize: '0.65rem', color: '#94a3b8' }}>Browse or drop file</span>
                </div>
              </div>
            </div>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Commercial Pricing & Tariff Configuration" subtitle="Update tariff structure and commercial rates" />
        <CardBody style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                Per KM Rate (₹) *
              </label>
              <input
                type="number"
                value={perKmRate}
                onChange={(e) => setPerKmRate(e.target.value)}
                style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.875rem', fontWeight: 700 }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                Min KM / Day Quota *
              </label>
              <input
                type="number"
                value={minKmPerDay}
                onChange={(e) => setMinKmPerDay(e.target.value)}
                style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.875rem' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                Driver Bata / Day (₹)
              </label>
              <input
                type="number"
                value={driverBata}
                onChange={(e) => setDriverBata(e.target.value)}
                style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.875rem' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                Night Charges (₹)
              </label>
              <input
                type="number"
                value={nightCharges}
                onChange={(e) => setNightCharges(e.target.value)}
                style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.875rem' }}
              />
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
                  Decommission this vehicle from your active vendor fleet. Historical trips, invoices, and accounting entries remain preserved.
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

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', paddingBottom: '2rem' }}>
        <Button type="button" variant="outline" onClick={() => navigate(`/vendor/vehicles/${vehicle.id}`)}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" style={{ backgroundColor: '#2C3480', fontWeight: 700, padding: '0.65rem 1.75rem' }}>
          <CheckCircle size={16} style={{ marginRight: '0.35rem' }} /> Update Vehicle Record
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
            Are you sure you want to remove <strong>{vehicle?.regNo}</strong> ({vehicle?.brand} {vehicle?.model}) from your active fleet?
          </div>
        </div>
        <p style={{ margin: 0, fontSize: '0.8125rem', color: '#475569', lineHeight: 1.5 }}>
          This will archive the vehicle record. It will no longer be available for dispatch or new trip bookings. All past trip manifests, customer logs, and vendor invoices will be preserved.
        </p>
      </div>
    </Modal>
  </>
  );
}

export default EditVehicle;
