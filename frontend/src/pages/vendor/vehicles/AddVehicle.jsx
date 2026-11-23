// MAK Tours & Travels ERP - Vendor Add Vehicle Registration
import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Car,
  Upload,
  UploadCloud,
  Image as ImageIcon,
  ImagePlus,
  ArrowLeft,
  CheckCircle,
  FileText,
  DollarSign,
  UserCheck,
  Sparkles,
  X,
  AlertCircle,
  Star,
  Trash2,
  Link as LinkIcon,
  Plus
} from 'lucide-react';
import { Card, CardHeader, CardBody } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
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

export function AddVehicle() {
  const navigate = useNavigate();
  const { addVehicle, drivers } = useVendorData();
  const toast = useToast();
  const fileInputRef = useRef(null);

  // Basic Information
  const [regNo, setRegNo] = useState('');
  const [brand, setBrand] = useState('Toyota');
  const [model, setModel] = useState('');
  const [category, setCategory] = useState('Premium MPV');
  const [manufacturingYear, setManufacturingYear] = useState('2024');
  const [seatingCapacity, setSeatingCapacity] = useState('7');
  const [isAC, setIsAC] = useState(true);
  const [fuelType, setFuelType] = useState('Diesel');
  const [color, setColor] = useState('Super White');
  const [luggageCapacity, setLuggageCapacity] = useState('4 Bags');

  // Dynamic User-Uploaded Images State (Starts clean and empty)
  const [images, setImages] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlInput, setUrlInput] = useState('');

  // Documents state
  const [rcNumber, setRcNumber] = useState('');
  const [rcExpiry, setRcExpiry] = useState('2039-12-31');
  const [insurancePolicy, setInsurancePolicy] = useState('');
  const [insuranceExpiry, setInsuranceExpiry] = useState('2027-12-31');
  const [fitnessCert, setFitnessCert] = useState('');
  const [fitnessExpiry, setFitnessExpiry] = useState('2027-12-31');
  const [permitNumber, setPermitNumber] = useState('');
  const [permitExpiry, setPermitExpiry] = useState('2028-12-31');

  // Amenities
  const [selectedAmenities, setSelectedAmenities] = useState(['AC', 'GPS Telematics', 'USB Fast Charging', 'First Aid Kit']);

  // Pricing
  const [perKmRate, setPerKmRate] = useState('22');
  const [minKmPerDay, setMinKmPerDay] = useState('300');
  const [driverBata, setDriverBata] = useState('500');
  const [nightCharges, setNightCharges] = useState('350');
  const [extraHourRate, setExtraHourRate] = useState('150');

  const toggleAmenity = (item) => {
    setSelectedAmenities((prev) =>
      prev.includes(item) ? prev.filter((a) => a !== item) : [...prev, item]
    );
  };

  // Process user-selected local files (from device file dialog or drag & drop)
  const handleFiles = async (fileList) => {
    if (!fileList || fileList.length === 0) return;
    const filesArray = Array.from(fileList);
    const validImageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg', 'image/avif', 'image/heic'];
    const maxSizeBytes = 10 * 1024 * 1024; // 10MB limit

    for (const file of filesArray) {
      if (!file.type.startsWith('image/') && !validImageTypes.includes(file.type.toLowerCase())) {
        toast?.error?.(`"${file.name}" is not a supported image file (PNG, JPG, WEBP only).`);
        continue;
      }
      if (file.size > maxSizeBytes) {
        toast?.error?.(`"${file.name}" exceeds the 10MB limit (${(file.size / (1024 * 1024)).toFixed(1)}MB).`);
        continue;
      }

      try {
        const compressedBase64 = await compressImage(file, { maxWidth: 1200, maxHeight: 1200, quality: 0.82 });
        if (compressedBase64) {
          setImages((prev) => [...prev, compressedBase64]);
          toast?.success?.(`Photo "${file.name}" added to gallery`);
        }
      } catch (err) {
        console.error('Failed to process image:', err);
        toast?.error?.(`Failed to process "${file.name}"`);
      }
    }
  };

  const handleFileInputChange = (e) => {
    handleFiles(e.target.files);
    e.target.value = ''; // Reset input to allow re-uploading same file if desired
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
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

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!regNo || !model) {
      toast?.error?.('Please provide Vehicle Registration Number and Model');
      return;
    }

    setIsSubmitting(true);
    try {
      await addVehicle({
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
        documents: {
          rcNumber: rcNumber || regNo.toUpperCase(),
          rcExpiry,
          rcStatus: 'Verified',
          insurancePolicy,
          insuranceExpiry,
          fitnessCert,
          fitnessExpiry,
          permitNumber,
          permitExpiry
        },
        amenities: selectedAmenities,
        perKmRate: parseFloat(perKmRate) || 20,
        minKmPerDay: parseInt(minKmPerDay) || 300,
        driverBata: parseInt(driverBata) || 500,
        nightCharges: parseInt(nightCharges) || 350,
        extraHourRate: parseInt(extraHourRate) || 150,
        assignedDriverId: '',
        assignedDriverName: 'Assigned by MAK Dispatch'
      });

      navigate('/vendor/vehicles');
    } catch (err) {
      console.error('Failed to register vehicle:', err);
      toast?.error?.('Error saving vehicle to database. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '1000px', margin: '0 auto' }}>
      <VendorNavTabs tabs={VENDOR_VEHICLE_TABS} />
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <button
            type="button"
            onClick={() => navigate('/vendor/vehicles')}
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
            <ArrowLeft size={16} /> Back to Fleet Inventory
          </button>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
            Register New Fleet Vehicle
          </h1>
          <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0.25rem 0 0' }}>
            Attach a new commercial vehicle to your MAK ERP vendor transport pool
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Button type="button" variant="outline" onClick={() => navigate('/vendor/vehicles')}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={isSubmitting}
            style={{ backgroundColor: '#2C3480', fontWeight: 700, opacity: isSubmitting ? 0.7 : 1 }}
          >
            <CheckCircle size={16} style={{ marginRight: '0.35rem' }} /> {isSubmitting ? 'Registering Vehicle...' : 'Complete Registration'}
          </Button>
        </div>
      </div>

      {/* 1. Basic Vehicle Information */}
      <Card>
        <CardHeader title="1. Basic Vehicle Information" subtitle="Official registration and specifications" />
        <CardBody style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                Registration Number (Plate) *
              </label>
              <input
                type="text"
                placeholder="e.g. TN-09-CB-4491"
                value={regNo}
                onChange={(e) => setRegNo(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '0.55rem 0.75rem',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.875rem',
                  textTransform: 'uppercase',
                  fontWeight: 700,
                  fontFamily: 'monospace'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                Brand / Manufacturer *
              </label>
              <select
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.875rem', backgroundColor: '#fff' }}
              >
                <option value="Toyota">Toyota</option>
                <option value="Force Motors">Force Motors</option>
                <option value="Maruti Suzuki">Maruti Suzuki</option>
                <option value="Tata Motors">Tata Motors</option>
                <option value="Mahindra">Mahindra</option>
                <option value="Hyundai">Hyundai</option>
                <option value="Mercedes-Benz">Mercedes-Benz</option>
                <option value="Volvo">Volvo</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                Model & Variant *
              </label>
              <input
                type="text"
                placeholder="e.g. Innova Crysta ZX 2.4"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                required
                style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.875rem' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                Vehicle Category *
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
                Manufacturing Year
              </label>
              <input
                type="number"
                value={manufacturingYear}
                onChange={(e) => setManufacturingYear(e.target.value)}
                style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.875rem' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                Passenger Seating Capacity *
              </label>
              <select
                value={seatingCapacity}
                onChange={(e) => setSeatingCapacity(e.target.value)}
                style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.875rem', backgroundColor: '#fff' }}
              >
                <option value="4">4 Seater (Sedan)</option>
                <option value="6">6 Seater (MPV)</option>
                <option value="7">7 Seater (Innova / Fortuner)</option>
                <option value="9">9 Seater (Winger / Luxury)</option>
                <option value="12">12 Seater (Tempo Traveller)</option>
                <option value="17">17 Seater (Force Urbania)</option>
                <option value="26">26 Seater (Mini Coach)</option>
                <option value="35">35 Seater (Luxury Coach)</option>
                <option value="45">45 Seater (Intercity Bus)</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                Air Conditioning (AC)
              </label>
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.85rem', cursor: 'pointer' }}>
                  <input type="radio" checked={isAC} onChange={() => setIsAC(true)} /> Full AC
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.85rem', cursor: 'pointer' }}>
                  <input type="radio" checked={!isAC} onChange={() => setIsAC(false)} /> Non-AC
                </label>
              </div>
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
                Exterior Color
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

      {/* 2. Vehicle Photographs & Gallery */}
      <Card>
        <CardHeader
          title="2. Vehicle Photographs & Gallery"
          subtitle="Upload authentic exterior, interior and passenger cabin views of your vehicle"
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
          {/* Hidden native file input for multiple image selection */}
          <input
            type="file"
            ref={fileInputRef}
            accept="image/png, image/jpeg, image/jpg, image/webp"
            multiple
            onChange={handleFileInputChange}
            style={{ display: 'none' }}
          />

          {/* Optional Direct URL Input Bar */}
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

          {/* State A: Empty State — Prominent Interactive Drag & Drop Area */}
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
                padding: '2.5rem 1.5rem',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.75rem'
              }}
            >
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  backgroundColor: '#EEF0FD',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1.5px solid #C7CEFA'
                }}
              >
                <UploadCloud size={28} color="#2C3480" />
              </div>
              <div>
                <div style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>
                  Upload your commercial vehicle photographs
                </div>
                <div style={{ fontSize: '0.8125rem', color: '#64748b', marginTop: '0.25rem' }}>
                  Drag and drop image files here, or <span style={{ color: '#2C3480', fontWeight: 700, textDecoration: 'underline' }}>browse from your device</span>
                </div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.35rem' }}>
                  Supports PNG, JPG, WEBP up to 10MB • Recommended: Front exterior, passenger cabin, and rear boot views
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                <Button
                  type="button"
                  size="sm"
                  variant="primary"
                  style={{ backgroundColor: '#2C3480', fontWeight: 700 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                >
                  <Upload size={14} style={{ marginRight: '0.35rem' }} /> Choose Images
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowUrlInput((prev) => !prev);
                  }}
                >
                  <LinkIcon size={14} style={{ marginRight: '0.35rem' }} /> Add via Image URL
                </Button>
              </div>
            </div>
          ) : (
            /* State B: Gallery Preview Grid with Dedicated Add Card */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem', color: '#64748b' }}>
                <span>
                  <strong>{images.length}</strong> photo{images.length > 1 ? 's' : ''} uploaded. The first photo is your <strong>Primary Cover Photo</strong>.
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

                    {/* Primary Badge or Set Primary Action */}
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
                          gap: '0.25rem',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
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
                          gap: '0.25rem',
                          backdropFilter: 'blur(4px)'
                        }}
                      >
                        <Star size={11} /> Set as Cover
                      </button>
                    )}

                    {/* Delete Photo Button */}
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
                        justifyContent: 'center',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.25)',
                        transition: 'transform 0.15s ease'
                      }}
                      title="Remove this photo"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}

                {/* Additional Upload Card in Grid */}
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
                    textAlign: 'center',
                    transition: 'all 0.15s ease'
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

      {/* 3. Vehicle Compliance & Documents */}
      <Card>
        <CardHeader title="3. Statutory Documents & Expiry Information" subtitle="RC Book, Insurance, Fitness & State Permit records" />
        <CardBody style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                RC Book Registration #
              </label>
              <input
                type="text"
                placeholder="RC No (defaults to Reg No)"
                value={rcNumber}
                onChange={(e) => setRcNumber(e.target.value)}
                style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.875rem' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                RC Validity / Expiry Date (if applicable)
              </label>
              <input
                type="date"
                value={rcExpiry}
                onChange={(e) => setRcExpiry(e.target.value)}
                style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.875rem' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                Commercial Insurance Policy #
              </label>
              <input
                type="text"
                placeholder="e.g. BAGIC-889021-2024"
                value={insurancePolicy}
                onChange={(e) => setInsurancePolicy(e.target.value)}
                style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.875rem' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                Insurance Expiry Date *
              </label>
              <input
                type="date"
                value={insuranceExpiry}
                onChange={(e) => setInsuranceExpiry(e.target.value)}
                required
                style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.875rem' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                Fitness Certificate (FC) Number
              </label>
              <input
                type="text"
                placeholder="e.g. FIT-CHN-2024-991"
                value={fitnessCert}
                onChange={(e) => setFitnessCert(e.target.value)}
                style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.875rem' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                Fitness Expiry Date *
              </label>
              <input
                type="date"
                value={fitnessExpiry}
                onChange={(e) => setFitnessExpiry(e.target.value)}
                required
                style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.875rem' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                Permit Type & Number
              </label>
              <input
                type="text"
                placeholder="e.g. ALL-INDIA-TN-4491"
                value={permitNumber}
                onChange={(e) => setPermitNumber(e.target.value)}
                style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.875rem' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                Permit Expiry Date
              </label>
              <input
                type="date"
                value={permitExpiry}
                onChange={(e) => setPermitExpiry(e.target.value)}
                style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.875rem' }}
              />
            </div>
          </div>
        </CardBody>
      </Card>

      {/* 4. Amenities Checklist */}
      <Card>
        <CardHeader title="4. Vehicle Amenities & Passenger Comforts" subtitle="Select all amenities available in this vehicle" />
        <CardBody>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.75rem' }}>
            {availableAmenitiesList.map((amenity) => {
              const isChecked = selectedAmenities.includes(amenity);
              return (
                <div
                  key={amenity}
                  onClick={() => toggleAmenity(amenity)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.6rem',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '8px',
                    border: `1px solid ${isChecked ? '#2C3480' : '#e2e8f0'}`,
                    backgroundColor: isChecked ? '#EEF0FD' : '#ffffff',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => {}}
                    style={{ accentColor: '#2C3480' }}
                  />
                  <span style={{ fontSize: '0.85rem', fontWeight: isChecked ? 700 : 500, color: isChecked ? '#2C3480' : '#334155' }}>
                    {amenity}
                  </span>
                </div>
              );
            })}
          </div>
        </CardBody>
      </Card>

      {/* 5. Commercial Pricing & Tariff */}
      <Card>
        <CardHeader title="5. Commercial Tariff & Billing Configuration" subtitle="Configure base billing rates and commercial pricing" />
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
                required
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
                required
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
                Night Surcharge (₹)
              </label>
              <input
                type="number"
                value={nightCharges}
                onChange={(e) => setNightCharges(e.target.value)}
                style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.875rem' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                Extra Hour Charge (₹)
              </label>
              <input
                type="number"
                value={extraHourRate}
                onChange={(e) => setExtraHourRate(e.target.value)}
                style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.875rem' }}
              />
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Bottom Action Footer */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', paddingBottom: '2rem' }}>
        <Button type="button" variant="outline" onClick={() => navigate('/vendor/vehicles')}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" style={{ backgroundColor: '#2C3480', fontWeight: 700, padding: '0.65rem 1.75rem' }}>
          <CheckCircle size={16} style={{ marginRight: '0.35rem' }} /> Complete Registration & Add to Fleet
        </Button>
      </div>
    </form>
  );
}

export default AddVehicle;
