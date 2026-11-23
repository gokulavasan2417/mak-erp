// MAK Tours & Travels ERP - Vehicle Details Page
import React, { useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  Car,
  ArrowLeft,
  Calendar,
  Clock,
  ShieldCheck,
  FileText,
  Wrench,
  Fuel,
  Users,
  Edit,
  AlertTriangle,
  UserCheck,
  Truck,
  Building2,
  CheckCircle2,
  Sparkles,
  Tag,
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
import { CAR_IMAGE_PRESETS } from './FleetList';

export function FleetDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const { vehicles, updateVehicle, updateVehicleStatus } = useAdminData();

  const vehicle = vehicles.find((v) => v.id === id || v._id === id || (v.regNo && v.regNo.replace(/\s+/g, '').toUpperCase() === (id || '').replace(/\s+/g, '').toUpperCase()));

  const [isEditImageModalOpen, setIsEditImageModalOpen] = useState(false);
  const [carImageInput, setCarImageInput] = useState('');
  const [carImageUploadPreview, setCarImageUploadPreview] = useState('');
  const [isSavingCarImage, setIsSavingCarImage] = useState(false);

  const handleOpenEditImage = () => {
    const currentImg = vehicle?.image || (Array.isArray(vehicle?.images) && vehicle?.images[0]) || 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&w=900&q=80';
    setCarImageInput(currentImg);
    setCarImageUploadPreview(currentImg);
    setIsEditImageModalOpen(true);
  };

  const handleCarImageFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast?.warning?.('Car image size exceeds 5MB. Please choose a smaller image.');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setCarImageUploadPreview(reader.result);
      setCarImageInput('');
    };
    reader.readAsDataURL(file);
  };

  const handleSaveCarImage = async (e) => {
    e.preventDefault();
    if (!vehicle) return;
    const finalUrl = (carImageUploadPreview || carImageInput || '').trim();
    if (!finalUrl) {
      toast?.error?.('Please enter a valid image URL or upload an image file.');
      return;
    }

    setIsSavingCarImage(true);
    try {
      await updateVehicle(vehicle.id, {
        image: finalUrl,
        images: [finalUrl]
      });
      setIsEditImageModalOpen(false);
      toast?.success?.('Car photo updated successfully in database!');
    } catch (err) {
      toast?.error?.('Failed to update car photo: ' + (err.message || 'Error'));
    } finally {
      setIsSavingCarImage(false);
    }
  };

  if (!vehicle) {
    return (
      <Card style={{ padding: '3rem', textAlign: 'center' }}>
        <h2>Vehicle Not Found</h2>
        <Button variant="primary" onClick={() => navigate('/admin/fleet')}>Back to Fleet</Button>
      </Card>
    );
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Available': return <Badge variant="success">Available</Badge>;
      case 'On Trip': return <Badge variant="info">On Trip</Badge>;
      case 'Reserved': return <Badge variant="warning">Reserved</Badge>;
      case 'Maintenance': return <Badge variant="danger">Maintenance</Badge>;
      case 'Unavailable':
      default: return <Badge variant="neutral">Unavailable</Badge>;
    }
  };

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
          <Button variant="ghost" onClick={() => navigate('/admin/fleet')} style={{ padding: '0.5rem' }}>
            <ArrowLeft size={18} />
          </Button>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main, #090d16)', margin: 0 }}>
                {vehicle.regNo}
              </h1>
              {getStatusBadge(vehicle.status)}
              {vehicle.vendorId || vehicle.ownership === 'Vendor Attached' ? (
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    backgroundColor: '#fffbeb',
                    color: '#b45309',
                    border: '1px solid #fde68a',
                    padding: '0.2rem 0.6rem',
                    borderRadius: '6px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem'
                  }}
                >
                  <Truck size={12} /> Attached Partner: {vehicle.vendorName || 'Vendor Attached'}
                </span>
              ) : (
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    backgroundColor: '#f0fdf4',
                    color: '#15803d',
                    border: '1px solid #bbf7d0',
                    padding: '0.2rem 0.6rem',
                    borderRadius: '6px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem'
                  }}
                >
                  <Building2 size={12} /> MAK In-House Fleet
                </span>
              )}
            </div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted, #64748b)', marginTop: '0.25rem' }}>
              {vehicle.brand} {vehicle.model} • {vehicle.category} • Year {vehicle.manufacturingYear || 2024}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Button variant="outline" leftIcon={<Edit size={15} />} onClick={() => navigate(`/admin/fleet/${vehicle.id}/edit`)}>
            Edit Vehicle
          </Button>
          <Button
            variant="primary"
            onClick={() => updateVehicleStatus(vehicle.id, vehicle.status === 'Available' ? 'Maintenance' : 'Available')}
          >
            {vehicle.status === 'Available' ? 'Mark for Maintenance' : 'Set Available'}
          </Button>
        </div>
      </div>

      {/* Main Grid: Specifications + Documents + Maintenance */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '1.25rem' }}>
        {/* Left: Specs & Current Assignment */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Vehicle Visual Banner & Tariff Overview */}
          <Card style={{ overflow: 'hidden' }}>
            <div style={{ position: 'relative', height: '240px', width: '100%', backgroundColor: '#090d16' }}>
              <img
                src={vehicle.image || (Array.isArray(vehicle.images) && vehicle.images[0]) || 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&w=900&q=80'}
                alt={`${vehicle.brand} ${vehicle.model}`}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              <div style={{ position: 'absolute', top: '1rem', left: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <span style={{ backgroundColor: '#2C3480', color: '#ffffff', padding: '0.3rem 0.75rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.04em' }}>
                  {vehicle.category}
                </span>
                <span style={{ backgroundColor: 'rgba(15, 23, 42, 0.85)', color: '#ffffff', padding: '0.3rem 0.75rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700, backdropFilter: 'blur(4px)' }}>
                  {vehicle.seating || `${vehicle.seatingCapacity} Seater`}
                </span>
                <span style={{ backgroundColor: vehicle.isAC ? '#16a34a' : '#64748b', color: '#ffffff', padding: '0.3rem 0.75rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700 }}>
                  {vehicle.isAC ? 'Climate AC' : 'Non-AC'}
                </span>
              </div>
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
                <Camera size={14} style={{ marginRight: '0.35rem' }} /> Change Car Photo
              </Button>
            </div>
          </Card>

          {/* Commercial Rental Tariff & Minimums */}
          <Card>
            <CardHeader title="Commercial Rental Rates & Tariff" subtitle="Per kilometer rates, driver bata, and daily thresholds" />
            <CardBody style={{ padding: '1.25rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '1rem' }}>
                <div style={{ padding: '0.85rem', backgroundColor: '#f0fdf4', borderRadius: '10px', border: '1px solid #bbf7d0' }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#166534', textTransform: 'uppercase' }}>Per Km Rate</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#15803d', marginTop: '0.2rem' }}>
                    ₹{vehicle.ratePerKm || 12}
                    <span style={{ fontSize: '0.75rem', fontWeight: 500 }}> / km</span>
                  </div>
                </div>

                <div style={{ padding: '0.85rem', backgroundColor: '#eff6ff', borderRadius: '10px', border: '1px solid #bfdbfe' }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#1e40af', textTransform: 'uppercase' }}>Driver Allowance</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#2C3480', marginTop: '0.2rem' }}>
                    ₹{vehicle.driverAllowance || 450}
                    <span style={{ fontSize: '0.75rem', fontWeight: 500 }}> / day</span>
                  </div>
                </div>

                <div style={{ padding: '0.85rem', backgroundColor: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>Min Distance / Day</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#090d16', marginTop: '0.2rem' }}>
                    {vehicle.minKmPerDay || 250}
                    <span style={{ fontSize: '0.75rem', fontWeight: 500 }}> km/day</span>
                  </div>
                </div>
              </div>

              {vehicle.description && (
                <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #f1f5f9' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Vehicle Profile</span>
                  <p style={{ fontSize: '0.85rem', color: '#334155', lineHeight: 1.5, margin: '0.35rem 0 0' }}>
                    {vehicle.description}
                  </p>
                </div>
              )}

              {vehicle.features && vehicle.features.length > 0 && (
                <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #f1f5f9' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '0.5rem' }}>
                    Key Amenities & Features
                  </span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                    {vehicle.features.map((feat, idx) => (
                      <span
                        key={idx}
                        style={{
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          backgroundColor: '#f1f5f9',
                          color: '#1e293b',
                          padding: '0.3rem 0.65rem',
                          borderRadius: '6px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          border: '1px solid #e2e8f0'
                        }}
                      >
                        <CheckCircle2 size={12} color="#16a34a" /> {feat}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Vehicle Specifications & Telematics" subtitle="Physical and operational capabilities" />
            <CardBody style={{ padding: '1.25rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.8125rem' }}>
                <div>
                  <span style={{ color: 'var(--text-muted, #64748b)', fontSize: '0.75rem' }}>Per-KM Tariff</span>
                  <div style={{ fontWeight: 800, fontSize: '1.125rem', color: 'var(--text-main, #090d16)' }}>
                    ₹{vehicle.ratePerKm || vehicle.pricePerKm || 15} / km
                  </div>
                </div>

                <div>
                  <span style={{ color: 'var(--text-muted, #64748b)', fontSize: '0.75rem' }}>Fuel / Powertrain</span>
                  <div style={{ fontWeight: 700, fontSize: '1rem', color: '#10B981', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Fuel size={15} /> {vehicle.fuelType}
                  </div>
                </div>

                <div>
                  <span style={{ color: 'var(--text-muted, #64748b)', fontSize: '0.75rem' }}>Seating Capacity</span>
                  <div style={{ fontWeight: 700 }}>
                    {vehicle.seatingCapacity} Passengers ({vehicle.isAC ? 'AC Climate Control' : 'Non-AC'})
                  </div>
                </div>

                <div>
                  <span style={{ color: 'var(--text-muted, #64748b)', fontSize: '0.75rem' }}>Body Color</span>
                  <div style={{ fontWeight: 700 }}>{vehicle.color || 'Standard White'}</div>
                </div>

                <div>
                  <span style={{ color: 'var(--text-muted, #64748b)', fontSize: '0.75rem' }}>Fastag Identification</span>
                  <div style={{ fontWeight: 600 }}>{vehicle.fastagId || 'Attached'}</div>
                </div>

                <div>
                  <span style={{ color: 'var(--text-muted, #64748b)', fontSize: '0.75rem' }}>GPS Tracking Unit</span>
                  <div style={{ fontWeight: 700, color: '#10B981', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <ShieldCheck size={14} /> Active &amp; Synced
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Attached Vendor Partner Details or MAK Asset Card */}
          {vehicle.vendorId || vehicle.ownership === 'Vendor Attached' ? (
            <Card style={{ border: '1px solid #fde68a', backgroundColor: '#fffdf5' }}>
              <CardHeader
                title="Attached Vendor Partner Details"
                subtitle="Commercial vehicle supplied by registered external transport partner"
                action={
                  vehicle.vendorId ? (
                    <Button
                      size="sm"
                      variant="outline"
                      style={{ borderColor: '#b45309', color: '#b45309', backgroundColor: '#ffffff', fontWeight: 700 }}
                      onClick={() => navigate(`/admin/vendors/${vehicle.vendorId}`)}
                    >
                      View Vendor Details
                    </Button>
                  ) : null
                }
              />
              <CardBody style={{ padding: '1.25rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.8125rem' }}>
                  <div>
                    <span style={{ color: '#92400e', fontSize: '0.75rem', fontWeight: 600 }}>Vendor Company Name</span>
                    <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#78350f', marginTop: '0.15rem' }}>
                      {vehicle.vendorName || 'Apex Fleet Solutions Pvt Ltd'}
                    </div>
                  </div>
                  <div>
                    <span style={{ color: '#92400e', fontSize: '0.75rem', fontWeight: 600 }}>Vendor Partner Code</span>
                    <div style={{ fontWeight: 700, fontFamily: 'monospace', color: '#78350f', marginTop: '0.15rem' }}>
                      {vehicle.vendorCode || 'MAK-VND-001'}
                    </div>
                  </div>
                  <div>
                    <span style={{ color: '#92400e', fontSize: '0.75rem', fontWeight: 600 }}>Primary Dispatch Contact</span>
                    <div style={{ fontWeight: 600, color: '#090d16', marginTop: '0.15rem' }}>
                      {vehicle.vendorContact || '+91 98840 55112'}
                    </div>
                  </div>
                  <div>
                    <span style={{ color: '#92400e', fontSize: '0.75rem', fontWeight: 600 }}>Partner Base City</span>
                    <div style={{ fontWeight: 600, color: '#090d16', marginTop: '0.15rem' }}>
                      {vehicle.vendorCity || 'Chennai'}
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>
          ) : (
            <Card>
              <CardHeader title="Ownership & Asset Custody" subtitle="MAK in-house capital asset details" />
              <CardBody style={{ padding: '1.25rem' }}>
                <div style={{ fontSize: '0.8125rem', color: '#475569', display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                  <Building2 size={22} color="#15803d" style={{ flexShrink: 0 }} />
                  <div>
                    <div style={{ fontWeight: 700, color: '#090d16' }}>MAK Tours &amp; Travels Pvt Ltd (100% In-House Fleet Asset)</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Assigned to Central Depot fleet roster under company-owned commercial transport registration.</div>
                  </div>
                </div>
              </CardBody>
            </Card>
          )}

          {/* Current Duty Driver */}
          <Card>
            <CardHeader title="Current Duty Driver & Assignment" subtitle="Driver attached to this vehicle" />
            <CardBody style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: '42px', height: '42px', borderRadius: '50%', backgroundColor: '#EEF0FD', color: '#2C3480', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <UserCheck size={22} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--text-main, #090d16)' }}>
                      {vehicle.currentDriverName || 'No Driver Currently Assigned'}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #64748b)' }}>
                      {vehicle.currentBookingId ? `Assigned to Trip #${vehicle.currentBookingId}` : 'Vehicle parked at Koramangala yard'}
                    </div>
                  </div>
                </div>

                {vehicle.currentBookingId && (
                  <Button size="sm" variant="outline" onClick={() => navigate(`/admin/bookings/${vehicle.currentBookingId}`, { state: { from: location.pathname } })}>
                    View Trip
                  </Button>
                )}
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Right: Document Compliance & Maintenance */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Statutory Document Expiry Countdown */}
          <Card>
            <CardHeader title="Statutory Compliance & Certifications" subtitle="RTO inspection certificates, insurance, and road permits" />
            <CardBody style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', borderRadius: '8px', backgroundColor: 'var(--bg-app, #f8fafc)', border: '1px solid var(--border-light, #e2e8f0)' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.8125rem' }}>Commercial Comprehensive Insurance</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #64748b)' }}>Expiry Date: {vehicle.insuranceExpiry}</div>
                  </div>
                  <Badge variant="success">Valid</Badge>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', borderRadius: '8px', backgroundColor: 'var(--bg-app, #f8fafc)', border: '1px solid var(--border-light, #e2e8f0)' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.8125rem' }}>RTO Vehicle Fitness Certificate (FC)</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #64748b)' }}>Expiry Date: {vehicle.fitnessExpiry}</div>
                  </div>
                  <Badge variant="success">Valid</Badge>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', borderRadius: '8px', backgroundColor: 'var(--bg-app, #f8fafc)', border: '1px solid var(--border-light, #e2e8f0)' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.8125rem' }}>All India Tourist Permit (AITP)</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #64748b)' }}>Expiry Date: {vehicle.permitExpiry}</div>
                  </div>
                  <Badge variant="success">Valid</Badge>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', borderRadius: '8px', backgroundColor: 'var(--bg-app, #f8fafc)', border: '1px solid var(--border-light, #e2e8f0)' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.8125rem' }}>Pollution Under Control (PUC)</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #64748b)' }}>Expiry Date: {vehicle.pucExpiry}</div>
                  </div>
                  <Badge variant="success">Valid</Badge>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Maintenance Records */}
          <Card>
            <CardHeader title="Garage Service Records" subtitle="Preventive maintenance and bills" />
            <CardBody style={{ padding: '0.75rem 1.25rem' }}>
              {(vehicle.maintenanceHistory || []).length === 0 ? (
                <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted, #64748b)', fontSize: '0.8125rem' }}>
                  No recent workshop service tickets recorded for this unit.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {vehicle.maintenanceHistory.map((m, idx) => (
                    <div key={idx} style={{ padding: '0.75rem', borderRadius: '8px', backgroundColor: 'var(--bg-app, #f8fafc)', border: '1px solid var(--border-light, #e2e8f0)', fontSize: '0.8125rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                        <span style={{ fontWeight: 700, color: 'var(--text-main, #090d16)' }}>{m.service}</span>
                        <span style={{ fontWeight: 800, color: '#2C3480' }}>₹{m.cost?.toLocaleString('en-IN')}</span>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #64748b)' }}>
                        {m.date} • {m.garage} • <strong style={{ color: '#10B981' }}>{m.status}</strong>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      </div>

      {/* Edit Car Photo Modal */}
      <Modal
        isOpen={isEditImageModalOpen}
        onClose={() => setIsEditImageModalOpen(false)}
        title="Edit Vehicle Car Photograph"
        maxWidth="680px"
      >
        <form onSubmit={handleSaveCarImage}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Vehicle Specs Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', backgroundColor: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <div>
                <span style={{ fontSize: '0.725rem', fontWeight: 800, color: '#2C3480', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  {vehicle.category} • {vehicle.seating || `${vehicle.seatingCapacity} Seater`}
                </span>
                <h4 style={{ margin: '0.2rem 0 0', fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>
                  {vehicle.brand} {vehicle.model}
                </h4>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.725rem', color: '#64748b', display: 'block' }}>Registration Plate</span>
                <strong style={{ fontSize: '0.95rem', color: '#2C3480', fontFamily: 'monospace' }}>
                  {vehicle.regNo || vehicle.id}
                </strong>
              </div>
            </div>

            {/* Live Preview Box */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.4rem' }}>
                Live Car Photograph Preview
              </label>
              <div style={{ height: '220px', width: '100%', borderRadius: '12px', overflow: 'hidden', backgroundColor: '#0f172a', border: '1.5px solid #cbd5e1', position: 'relative' }}>
                {(carImageUploadPreview || carImageInput) ? (
                  <img
                    src={carImageUploadPreview || carImageInput}
                    alt="Car Preview"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={(e) => {
                      e.currentTarget.src = 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&w=900&q=80';
                    }}
                  />
                ) : (
                  <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', flexDirection: 'column', gap: '0.5rem' }}>
                    <ImageIcon size={36} />
                    <span style={{ fontSize: '0.85rem' }}>No car image selected yet</span>
                  </div>
                )}
                <div style={{ position: 'absolute', bottom: '0.5rem', right: '0.5rem', backgroundColor: 'rgba(15, 23, 42, 0.85)', color: '#ffffff', padding: '0.25rem 0.65rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 700 }}>
                  Active Preview
                </div>
              </div>
            </div>

            {/* Upload Option & URL Input */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
              {/* File Upload from PC */}
              <div style={{ padding: '0.85rem', border: '1.5px dashed #cbd5e1', borderRadius: '10px', backgroundColor: '#f8fafc', textAlign: 'center' }}>
                <Upload size={22} color="#2C3480" style={{ margin: '0 auto 0.35rem' }} />
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0f172a' }}>Upload Car Image</div>
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
                  Select Photo
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleCarImageFileChange}
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
                  value={carImageInput}
                  onChange={(e) => {
                    setCarImageInput(e.target.value);
                    setCarImageUploadPreview('');
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

            {/* Popular Curated Car Presets */}
            <div>
              <span style={{ fontSize: '0.775rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.45rem' }}>
                Select from Popular Fleet Vehicle Presets:
              </span>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(135px, 1fr))', gap: '0.5rem', maxHeight: '160px', overflowY: 'auto', padding: '2px' }}>
                {CAR_IMAGE_PRESETS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setCarImageInput(preset.url);
                      setCarImageUploadPreview(preset.url);
                    }}
                    style={{
                      padding: '0.35rem',
                      borderRadius: '8px',
                      border: (carImageInput === preset.url || carImageUploadPreview === preset.url) ? '2px solid #2C3480' : '1px solid #e2e8f0',
                      backgroundColor: (carImageInput === preset.url || carImageUploadPreview === preset.url) ? '#EEF0FD' : '#ffffff',
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
              <Button variant="primary" type="submit" disabled={isSavingCarImage} style={{ backgroundColor: '#2C3480' }}>
                {isSavingCarImage ? 'Saving to Database...' : 'Save Car Photo to Database'}
              </Button>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default FleetDetails;
