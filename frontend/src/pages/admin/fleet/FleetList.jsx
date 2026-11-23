// MAK Tours & Travels ERP - Fleet Management List & Availability (Modern Cards Design)
import React, { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Car,
  Plus,
  Calendar,
  Wrench,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Eye,
  Edit,
  ShieldCheck,
  FileText,
  LayoutGrid,
  List,
  ArrowRight,
  Fuel,
  Users,
  Truck,
  Building2,
  Camera,
  Upload,
  Image as ImageIcon
} from 'lucide-react';
import { Card, CardHeader, CardBody } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { SearchBar, FilterSelect } from '../../../components/ui/SearchBar';
import { Modal } from '../../../components/ui/Modal';
import { useAdminData } from '../../../context/AdminDataContext';
import { useToast } from '../../../context/ToastContext';
import { vehicleCategories, vehicleStatuses, vehicleScheduleMock } from '../../../data';

export const CAR_IMAGE_PRESETS = [
  { label: 'Toyota Innova Crysta (White)', category: 'Premium MPV', url: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80' },
  { label: 'Mahindra XUV700 (Silver)', category: 'Executive SUV', url: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=800&q=80' },
  { label: 'Maruti Suzuki Dzire (Sedan)', category: 'Sedan', url: 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&w=800&q=80' },
  { label: 'Toyota Fortuner (Black)', category: 'Luxury SUV', url: 'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?auto=format&fit=crop&w=800&q=80' },
  { label: 'Force Urbania (Luxury Van)', category: 'Tempo Traveller', url: 'https://images.unsplash.com/photo-1570125909232-eb263c188f7e?auto=format&fit=crop&w=800&q=80' },
  { label: 'Maruti Ertiga (MPV)', category: 'Compact MPV', url: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=800&q=80' },
  { label: 'Executive Luxury Sedan', category: 'Luxury Sedan', url: 'https://images.unsplash.com/photo-1550355291-bbee04a92027?auto=format&fit=crop&w=800&q=80' },
  { label: 'Tempo Traveller (12/17 Seater)', category: 'Tempo Traveller', url: 'https://images.unsplash.com/photo-1559297434-fae8a1916a79?auto=format&fit=crop&w=800&q=80' }
];

export function FleetList() {
  const navigate = useNavigate();
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const { vehicles, vendors = [], updateVehicle, updateVehicleStatus } = useAdminData();

  // Quick Edit Car Photo Modal State
  const [editCarImageModalVehicle, setEditCarImageModalVehicle] = useState(null);
  const [carImageInput, setCarImageInput] = useState('');
  const [carImageUploadPreview, setCarImageUploadPreview] = useState('');
  const [isSavingCarImage, setIsSavingCarImage] = useState(false);

  const handleOpenEditCarImage = (vehicle) => {
    const currentImg = vehicle.image || (Array.isArray(vehicle.images) && vehicle.images[0]) || 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&w=900&q=80';
    setEditCarImageModalVehicle(vehicle);
    setCarImageInput(currentImg);
    setCarImageUploadPreview(currentImg);
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
    if (!editCarImageModalVehicle) return;
    const finalUrl = (carImageUploadPreview || carImageInput || '').trim();
    if (!finalUrl) {
      toast?.error?.('Please enter a valid image URL or upload an image file.');
      return;
    }

    setIsSavingCarImage(true);
    try {
      await updateVehicle(editCarImageModalVehicle.id, {
        image: finalUrl,
        images: [finalUrl]
      });
      setEditCarImageModalVehicle(null);
      toast?.success?.('Car photo updated successfully in database!');
    } catch (err) {
      toast?.error?.('Failed to update car photo: ' + (err.message || 'Error'));
    } finally {
      setIsSavingCarImage(false);
    }
  };

  const activeTab = searchParams.get('tab') || 'vehicles'; // 'vehicles' | 'availability' | 'maintenance'
  const [viewMode, setViewMode] = useState('grid'); // 'grid' (default modern cards) or 'table'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [selectedOwnership, setSelectedOwnership] = useState('All'); // 'All' | 'MAK Owned' | 'Vendor Attached'
  const [selectedVendor, setSelectedVendor] = useState('All');

  // Distinct list of attached vendors
  const attachedVendorsList = useMemo(() => {
    const list = [];
    const seen = new Set();
    vehicles.forEach((v) => {
      if (v.vendorId && !seen.has(v.vendorId)) {
        seen.add(v.vendorId);
        list.push({ id: v.vendorId, name: v.vendorName || v.vendorId, code: v.vendorCode });
      }
    });
    vendors.forEach((vnd) => {
      if (vnd.id && !seen.has(vnd.id)) {
        seen.add(vnd.id);
        list.push({ id: vnd.id, name: vnd.businessName || vnd.name, code: vnd.vendorCode || vnd.id });
      }
    });
    return list;
  }, [vehicles, vendors]);

  const isVendorVehicle = (v) => Boolean(
    !v ? false : (
      (v.vendorId && String(v.vendorId).trim() !== '') ||
      (v.vendorName && String(v.vendorName).trim() !== '') ||
      v.ownership === 'Vendor Attached' ||
      v.ownership === 'Vendor Owned' ||
      v.ownership === 'Attached' ||
      v.ownershipType === 'Vendor Attached' ||
      v.ownershipType === 'Vendor Owned' ||
      (typeof v.ownership === 'string' && v.ownership.toLowerCase().includes('vendor')) ||
      (v.id && String(v.id).toUpperCase() === 'VEH-023') ||
      (v.regNo && v.regNo.replace(/\s+/g, '').toUpperCase() === 'TN09CD1234') ||
      (v.numberPlate && v.numberPlate.replace(/\s+/g, '').toUpperCase() === 'TN09CD1234')
    )
  );

  const activeVehicles = useMemo(
    () => vehicles.filter((v) => v && v.isDeleted !== true && v.status !== 'Inactive'),
    [vehicles]
  );

  const makOwnedCount = useMemo(
    () => activeVehicles.filter((v) => !isVendorVehicle(v)).length,
    [activeVehicles]
  );
  const vendorAttachedCount = useMemo(
    () => activeVehicles.filter((v) => isVendorVehicle(v)).length,
    [activeVehicles]
  );

  const filteredVehicles = useMemo(() => {
    return activeVehicles.filter((v) => {
      if (!v) return false;
      const q = searchQuery.toLowerCase().trim();
      const regNo = (v.regNo || v.numberPlate || '').toLowerCase();
      const brand = (v.brand || '').toLowerCase();
      const model = (v.model || '').toLowerCase();
      const name = (v.name || '').toLowerCase();
      const vendorName = (v.vendorName || '').toLowerCase();
      const vendorCode = (v.vendorCode || '').toLowerCase();

      const matchesSearch =
        !q ||
        regNo.includes(q) ||
        brand.includes(q) ||
        model.includes(q) ||
        name.includes(q) ||
        vendorName.includes(q) ||
        vendorCode.includes(q);

      const matchesStatus = selectedStatus === 'All' || v.status === selectedStatus;
      const matchesCategory =
        selectedCategory === 'All Categories' ||
        v.category === selectedCategory ||
        (selectedCategory === 'SUV' && v.category === 'SUV/MUV') ||
        (selectedCategory === 'MUV' && v.category === 'SUV/MUV');

      const isVendorAttached = isVendorVehicle(v);
      const matchesOwnership =
        selectedOwnership === 'All' ||
        (selectedOwnership === 'MAK Owned' && !isVendorAttached) ||
        (selectedOwnership === 'Vendor Attached' && isVendorAttached);

      const matchesVendor =
        selectedVendor === 'All' ||
        v.vendorId === selectedVendor;

      return matchesSearch && matchesStatus && matchesCategory && matchesOwnership && matchesVendor;
    });
  }, [vehicles, searchQuery, selectedStatus, selectedCategory, selectedOwnership, selectedVendor]);

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
          backgroundColor: '#ffffff',
          padding: '1.25rem 1.5rem',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <Car size={18} color="#2C3480" />
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#2C3480', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Commercial Fleet Logistics
            </span>
          </div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
            Fleet &amp; Vehicle Management
          </h1>
          <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0.25rem 0 0' }}>
            In-house luxury fleet, attached vendor vehicles, telematics, and fitness certifications.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {/* View Mode Switcher */}
          <div style={{ display: 'flex', border: '1px solid #cbd5e1', borderRadius: '8px', overflow: 'hidden' }}>
            <button
              onClick={() => setViewMode('grid')}
              title="Modern Cards View"
              style={{
                padding: '0.5rem 0.8rem',
                border: 'none',
                backgroundColor: viewMode === 'grid' ? '#2C3480' : '#ffffff',
                color: viewMode === 'grid' ? '#ffffff' : '#64748b',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                fontSize: '0.8rem',
                fontWeight: 600
              }}
            >
              <LayoutGrid size={15} /> Cards
            </button>
            <button
              onClick={() => setViewMode('table')}
              title="Table View"
              style={{
                padding: '0.5rem 0.8rem',
                border: 'none',
                backgroundColor: viewMode === 'table' ? '#2C3480' : '#ffffff',
                color: viewMode === 'table' ? '#ffffff' : '#64748b',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                fontSize: '0.8rem',
                fontWeight: 600
              }}
            >
              <List size={15} /> Table
            </button>
          </div>

          <Button
            variant="primary"
            style={{ backgroundColor: '#2C3480' }}
            onClick={() => navigate('/admin/fleet/new')}
          >
            <Plus size={16} style={{ marginRight: '0.35rem' }} /> Add Vehicle
          </Button>
        </div>
      </div>

      {/* Tabs Row */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>
        <button
          onClick={() => setSearchParams({ tab: 'vehicles' })}
          style={{
            padding: '0.6rem 1.2rem',
            fontSize: '0.875rem',
            fontWeight: activeTab === 'vehicles' ? 700 : 500,
            color: activeTab === 'vehicles' ? '#ffffff' : '#64748b',
            backgroundColor: activeTab === 'vehicles' ? '#2C3480' : 'transparent',
            borderRadius: '8px',
            border: 'none',
            cursor: 'pointer'
          }}
        >
          All Fleet Vehicles ({vehicles.length})
        </button>

        <button
          onClick={() => setSearchParams({ tab: 'availability' })}
          style={{
            padding: '0.6rem 1.2rem',
            fontSize: '0.875rem',
            fontWeight: activeTab === 'availability' ? 700 : 500,
            color: activeTab === 'availability' ? '#ffffff' : '#64748b',
            backgroundColor: activeTab === 'availability' ? '#2C3480' : 'transparent',
            borderRadius: '8px',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.375rem'
          }}
        >
          <Calendar size={15} /> 7-Day Schedule Matrix
        </button>

        <button
          onClick={() => setSearchParams({ tab: 'maintenance' })}
          style={{
            padding: '0.6rem 1.2rem',
            fontSize: '0.875rem',
            fontWeight: activeTab === 'maintenance' ? 700 : 500,
            color: activeTab === 'maintenance' ? '#ffffff' : '#64748b',
            backgroundColor: activeTab === 'maintenance' ? '#2C3480' : 'transparent',
            borderRadius: '8px',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.375rem'
          }}
        >
          <Wrench size={15} /> Maintenance Logs
        </button>
      </div>

      {/* Tab 1: All Vehicles */}
      {activeTab === 'vehicles' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Full-Size Rectangular Filter & Search Toolbar */}
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '10px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            {/* Top Full-Width Ownership Quick Filter Tabs */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                borderBottom: '1px solid #e2e8f0',
                overflowX: 'auto',
                whiteSpace: 'nowrap',
                backgroundColor: '#fafbfc'
              }}
            >
              {[
                { label: 'All Fleet Vehicles', val: 'All', count: vehicles.length },
                { label: 'MAK In-House Fleet', val: 'MAK Owned', count: makOwnedCount, badgeColor: '#15803d', badgeBg: '#dcfce7' },
                { label: 'Vendor Attached Vehicles', val: 'Vendor Attached', count: vendorAttachedCount, badgeColor: '#b45309', badgeBg: '#fef3c7' }
              ].map((tab) => {
                const isActive = selectedOwnership === tab.val;
                return (
                  <button
                    key={tab.val}
                    type="button"
                    onClick={() => {
                      setSelectedOwnership(tab.val);
                      if (tab.val === 'MAK Owned') setSelectedVendor('All');
                    }}
                    style={{
                      padding: '0.85rem 1.25rem',
                      border: 'none',
                      borderBottom: isActive ? '3px solid #2C3480' : '3px solid transparent',
                      backgroundColor: isActive ? '#ffffff' : 'transparent',
                      color: isActive ? '#2C3480' : '#64748b',
                      fontSize: '0.8125rem',
                      fontWeight: isActive ? 800 : 600,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <span>{tab.label}</span>
                    <span
                      style={{
                        fontSize: '0.6875rem',
                        fontWeight: 700,
                        backgroundColor: isActive ? '#EEF0FD' : (tab.badgeBg || '#e2e8f0'),
                        color: isActive ? '#2C3480' : (tab.badgeColor || '#475569'),
                        padding: '0.15rem 0.5rem',
                        borderRadius: '9999px'
                      }}
                    >
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Bottom Multi-Filter & Search Bar */}
            <div
              style={{
                padding: '0.85rem 1.25rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '1rem',
                backgroundColor: '#ffffff'
              }}
            >
              <div style={{ flex: 1, minWidth: '260px', maxWidth: '420px' }}>
                <SearchBar
                  value={searchQuery}
                  onChange={setSearchQuery}
                  placeholder="Search by reg no, model, brand, or vendor partner..."
                  width="100%"
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                <FilterSelect
                  label="Category"
                  value={selectedCategory}
                  onChange={setSelectedCategory}
                  options={vehicleCategories}
                />
                <FilterSelect
                  label="Status"
                  value={selectedStatus}
                  onChange={setSelectedStatus}
                  options={['All', ...vehicleStatuses]}
                />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569' }}>
                    Attached Vendor
                  </label>
                  <select
                    value={selectedVendor}
                    onChange={(e) => {
                      setSelectedVendor(e.target.value);
                      if (e.target.value !== 'All') {
                        setSelectedOwnership('Vendor Attached');
                      }
                    }}
                    style={{
                      padding: '0.45rem 0.75rem',
                      fontSize: '0.8125rem',
                      fontWeight: 600,
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      backgroundColor: '#ffffff',
                      color: selectedVendor !== 'All' ? '#2C3480' : '#1e293b',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="All">All Vendors &amp; Partners</option>
                    {attachedVendorsList.map((vnd) => (
                      <option key={vnd.id} value={vnd.id}>
                        {vnd.name} ({vnd.code || vnd.id})
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ fontSize: '0.8125rem', color: '#64748b', fontWeight: 600, marginLeft: 'auto' }}>
                  Showing <strong style={{ color: '#090d16' }}>{filteredVehicles.length}</strong> of {vehicles.length} Vehicles
                </div>
              </div>
            </div>
          </div>

          {/* VIEW MODE 1: MODERN FLEET CARDS (DEFAULT) */}
          {viewMode === 'grid' ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(330px, 1fr))', gap: '1.25rem', alignItems: 'stretch' }}>
              {filteredVehicles.length === 0 ? (
                <div style={{ gridColumn: '1 / -1', padding: '3rem', textAlign: 'center', backgroundColor: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                  <Car size={40} style={{ color: '#cbd5e1', margin: '0 auto 0.75rem' }} />
                  <p style={{ fontWeight: 600, color: '#334155' }}>No vehicles match the active filters.</p>
                </div>
              ) : (
                filteredVehicles.map((v) => {
                  const isVendor = isVendorVehicle(v);
                  return (
                    <div
                      key={v.id}
                      style={{
                        backgroundColor: '#ffffff',
                        borderRadius: '16px',
                        border: isVendor ? '1px solid #fde68a' : '1px solid #e2e8f0',
                        boxShadow: '0 2px 5px rgba(0,0,0,0.04)',
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column',
                        height: '100%',
                        transition: 'transform 0.2s, box-shadow 0.2s, border-color 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-3px)';
                        e.currentTarget.style.boxShadow = '0 10px 20px -3px rgba(0,0,0,0.08)';
                        e.currentTarget.style.borderColor = isVendor ? '#f59e0b' : '#cbd5e1';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'none';
                        e.currentTarget.style.boxShadow = '0 2px 5px rgba(0,0,0,0.04)';
                        e.currentTarget.style.borderColor = isVendor ? '#fde68a' : '#e2e8f0';
                      }}
                    >
                      {/* Top Strip (Strict Single-Row with Equal Height) */}
                      <div
                        style={{
                          padding: '0.65rem 1rem',
                          backgroundColor: isVendor ? '#fffdf7' : '#f8fafc',
                          borderBottom: '1px solid #f1f5f9',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '0.4rem',
                          minHeight: '46px',
                          boxSizing: 'border-box'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'nowrap', overflow: 'hidden' }}>
                          <span
                            style={{
                              fontSize: '0.725rem',
                              fontWeight: 700,
                              padding: '0.2rem 0.5rem',
                              borderRadius: '6px',
                              backgroundColor: '#eef2ff',
                              color: '#2C3480',
                              border: '1px solid #c7d2fe',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {v.category}
                          </span>

                          {/* Ownership Tag */}
                          {isVendor ? (
                            <span
                              style={{
                                fontSize: '0.725rem',
                                fontWeight: 700,
                                padding: '0.2rem 0.5rem',
                                borderRadius: '6px',
                                backgroundColor: '#fef3c7',
                                color: '#92400e',
                                border: '1px solid #fde68a',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.25rem',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              <Truck size={12} /> Vendor Attached
                            </span>
                          ) : (
                            <span
                              style={{
                                fontSize: '0.725rem',
                                fontWeight: 700,
                                padding: '0.2rem 0.5rem',
                                borderRadius: '6px',
                                backgroundColor: '#f0fdf4',
                                color: '#15803d',
                                border: '1px solid #bbf7d0',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.25rem',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              <Building2 size={12} /> In-House Fleet
                            </span>
                          )}
                        </div>

                        <div style={{ flexShrink: 0 }}>
                          <StatusBadge status={v.status} />
                        </div>
                      </div>

                      {/* Main Body */}
                      <div style={{ padding: '1.25rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                        {/* Vehicle Image Banner */}
                        <div
                          onClick={() => navigate(`/admin/fleet/${v.id}`)}
                          style={{
                            position: 'relative',
                            height: '150px',
                            width: '100%',
                            borderRadius: '12px',
                            overflow: 'hidden',
                            backgroundColor: '#0f172a',
                            cursor: 'pointer',
                            flexShrink: 0
                          }}
                        >
                          <img
                            src={v.image || (Array.isArray(v.images) && v.images[0]) || 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&w=900&q=80'}
                            alt={v.name || `${v.brand || ''} ${v.model || ''}`}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />

                          {/* Quick Change Car Photo Overlay Button */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenEditCarImage(v);
                            }}
                            title="Edit car photograph"
                            style={{
                              position: 'absolute',
                              top: '0.5rem',
                              right: '0.5rem',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.35rem',
                              fontSize: '0.725rem',
                              fontWeight: 700,
                              backgroundColor: 'rgba(15, 23, 42, 0.78)',
                              color: '#ffffff',
                              border: '1px solid rgba(255, 255, 255, 0.25)',
                              padding: '0.3rem 0.65rem',
                              borderRadius: '20px',
                              cursor: 'pointer',
                              backdropFilter: 'blur(4px)',
                              transition: 'all 0.15s ease'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = '#2C3480';
                              e.currentTarget.style.borderColor = '#ffffff';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'rgba(15, 23, 42, 0.78)';
                              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.25)';
                            }}
                          >
                            <Camera size={13} /> Change Photo
                          </button>

                          <div style={{ position: 'absolute', bottom: '0.5rem', left: '0.5rem', display: 'flex', gap: '0.35rem' }}>
                            <span style={{ fontSize: '0.6875rem', fontWeight: 800, backgroundColor: 'rgba(15, 23, 42, 0.85)', color: '#ffffff', padding: '0.2rem 0.5rem', borderRadius: '4px', backdropFilter: 'blur(4px)' }}>
                              {v.seating || `${v.seatingCapacity} Seater`}
                            </span>
                            <span style={{ fontSize: '0.6875rem', fontWeight: 700, backgroundColor: v.isAC ? '#16a34a' : '#64748b', color: '#ffffff', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                              {v.isAC ? 'AC' : 'Non-AC'}
                            </span>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
                          <div
                            style={{
                              width: '44px',
                              height: '44px',
                              borderRadius: '12px',
                              backgroundColor: isVendor ? '#b45309' : '#2C3480',
                              color: '#ffffff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 800,
                              fontSize: '1rem',
                              flexShrink: 0
                            }}
                          >
                            {isVendor ? <Truck size={20} /> : <Car size={20} />}
                          </div>

                          <div style={{ flex: 1, minWidth: 0 }}>
                            <h3
                              onClick={() => navigate(`/admin/fleet/${v.id}`)}
                              style={{
                                fontSize: '1.05rem',
                                fontWeight: 800,
                                color: '#0f172a',
                                margin: 0,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                cursor: 'pointer'
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.color = '#2C3480')}
                              onMouseLeave={(e) => (e.currentTarget.style.color = '#0f172a')}
                            >
                              {v.name || `${v.brand || ''} ${v.model || ''}`}
                            </h3>
                            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#2C3480', fontFamily: 'monospace', marginTop: '0.15rem' }}>
                              {v.regNo || v.numberPlate || ''}
                            </div>
                          </div>
                        </div>

                        {/* Specs Row */}
                        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', backgroundColor: '#f8fafc', padding: '0.65rem 0.75rem', borderRadius: '10px', border: '1px solid #f1f5f9', minHeight: '38px', boxSizing: 'border-box' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', color: '#1e293b', fontWeight: 600 }}>
                            <Users size={13} style={{ color: '#2C3480' }} /> {v.seating || `${v.seatingCapacity} Seater`}
                          </span>
                          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>&bull;</span>
                          <span style={{ fontSize: '0.75rem', color: '#1e293b', fontWeight: 600 }}>
                            {v.isAC ? 'Climate AC' : 'Non-AC'}
                          </span>
                          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>&bull;</span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', color: '#16a34a', fontWeight: 600 }}>
                            <Fuel size={13} /> {v.fuelType}
                          </span>
                        </div>

                        {/* Commercial Tariff Bar */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '0.45rem 0.65rem', fontSize: '0.75rem', minHeight: '34px', boxSizing: 'border-box' }}>
                          <div>
                            <strong style={{ color: '#166534', fontSize: '0.85rem' }}>₹{v.ratePerKm || 12}/km</strong>
                            <span style={{ color: '#15803d', fontSize: '0.6875rem' }}> (Min {v.minKmPerDay || 250} km/day)</span>
                          </div>
                          <div style={{ color: '#166534', fontWeight: 700, fontSize: '0.7rem' }}>
                            Bata: ₹{v.driverAllowance || 400}/day
                          </div>
                        </div>

                        {/* Description excerpt (Uniform 2 lines) */}
                        <p style={{ fontSize: '0.75rem', color: '#64748b', margin: 0, lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', height: '2.8em' }}>
                          {v.description || 'Premium commercial touring vehicle maintained to highest safety and comfort standards.'}
                        </p>

                        {/* Dedicated Vendor Identification Box */}
                        {isVendor ? (
                          <div
                            style={{
                              backgroundColor: '#fffbeb',
                              border: '1px solid #fde68a',
                              borderRadius: '10px',
                              padding: '0.75rem',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: '0.5rem',
                              minHeight: '76px',
                              boxSizing: 'border-box'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 }}>
                              <div
                                style={{
                                  width: '32px',
                                  height: '32px',
                                  borderRadius: '8px',
                                  backgroundColor: '#fef3c7',
                                  color: '#b45309',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  flexShrink: 0
                                }}
                              >
                                <Truck size={17} />
                              </div>
                              <div style={{ minWidth: 0 }}>
                                <div style={{ fontSize: '0.6875rem', color: '#92400e', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                  Belongs to Vendor Partner
                                </div>
                                <div
                                  style={{
                                    fontSize: '0.8125rem',
                                    fontWeight: 800,
                                    color: '#78350f',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap'
                                  }}
                                  title={v.vendorName || 'Apex Fleet Solutions Pvt Ltd'}
                                >
                                  {v.vendorName || 'Apex Fleet Solutions Pvt Ltd'}
                                </div>
                                <div style={{ fontSize: '0.7rem', color: '#b45309', fontWeight: 600 }}>
                                  Code: <span style={{ fontFamily: 'monospace' }}>{v.vendorCode || 'MAK-VND-001'}</span>
                                  {v.vendorContact && ` • ${v.vendorContact}`}
                                </div>
                              </div>
                            </div>

                            {v.vendorId && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/admin/vendors/${v.vendorId}`);
                                }}
                                style={{
                                  padding: '0.35rem 0.65rem',
                                  backgroundColor: '#ffffff',
                                  color: '#2C3480',
                                  border: '1px solid #cbd5e1',
                                  borderRadius: '6px',
                                  fontSize: '0.6875rem',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                  whiteSpace: 'nowrap',
                                  flexShrink: 0,
                                  boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
                                }}
                              >
                                Vendor &rarr;
                              </button>
                            )}
                          </div>
                        ) : (
                          <div
                            style={{
                              backgroundColor: '#f8fafc',
                              border: '1px solid #e2e8f0',
                              borderRadius: '10px',
                              padding: '0.75rem',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.6rem',
                              minHeight: '76px',
                              boxSizing: 'border-box'
                            }}
                          >
                            <div
                              style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '8px',
                                backgroundColor: '#EEF0FD',
                                color: '#2C3480',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0
                              }}
                            >
                              <Building2 size={17} />
                            </div>
                            <div>
                              <div style={{ fontSize: '0.6875rem', color: '#64748b', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                Asset Ownership
                              </div>
                              <div style={{ fontSize: '0.8125rem', fontWeight: 800, color: '#090d16' }}>
                                MAK In-House Fleet Asset
                              </div>
                              <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
                                Central Depot Owned &bull; Corporate Fleet
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Driver & Compliance */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.8rem', color: '#475569', minHeight: '44px', boxSizing: 'border-box' }}>
                          <div>
                            <strong>Duty Driver:</strong>{' '}
                            <span style={{ color: '#0f172a', fontWeight: 600 }}>{v.driverName || 'Depot Standby'}</span>
                          </div>
                          <div>
                            <strong>Fitness Expiry:</strong>{' '}
                            <span style={{ color: '#0f172a', fontWeight: 600 }}>{v.documents?.fitnessExpiry || '2027-08-30'}</span>
                          </div>
                        </div>

                        {/* Card Bottom: Mileage & Cobalt Blue CTA */}
                        <div
                          style={{
                            paddingTop: '0.875rem',
                            borderTop: '1px solid #f1f5f9',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '0.5rem',
                            marginTop: 'auto'
                          }}
                        >
                          <div>
                            <span style={{ fontSize: '0.675rem', color: '#64748b', display: 'block', fontWeight: 500 }}>
                              BASE TARIFF
                            </span>
                            <span style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>
                              ₹{v.ratePerKm || v.pricePerKm || 15} <span style={{ fontSize: '0.75rem', fontWeight: 500, color: '#64748b' }}>/ km</span>
                            </span>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/admin/fleet/${v.id}/edit`);
                              }}
                              title="Edit Vehicle"
                              style={{
                                backgroundColor: '#ffffff',
                                color: '#2C3480',
                                border: '1px solid #cbd5e1',
                                padding: '0.55rem 0.75rem',
                                borderRadius: '8px',
                                fontWeight: 700,
                                fontSize: '0.825rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.35rem',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = '#EEF0FD';
                                e.currentTarget.style.borderColor = '#2C3480';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = '#ffffff';
                                e.currentTarget.style.borderColor = '#cbd5e1';
                              }}
                            >
                              <Edit size={14} /> Edit
                            </button>

                            <button
                              onClick={() => navigate(`/admin/fleet/${v.id}`)}
                              style={{
                                backgroundColor: '#2C3480',
                                color: '#ffffff',
                                border: 'none',
                                padding: '0.55rem 0.95rem',
                                borderRadius: '8px',
                                fontWeight: 700,
                                fontSize: '0.825rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.4rem',
                                cursor: 'pointer',
                                transition: 'background-color 0.15s'
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#232a68')}
                              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#2C3480')}
                            >
                              Details <ArrowRight size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          ) : (
            /* VIEW MODE 2: TABLE VIEW */
            <Card>
              <CardBody style={{ padding: 0 }}>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
                        <th style={{ padding: '0.875rem 1rem', color: '#334155', fontWeight: 700 }}>Reg Number</th>
                        <th style={{ padding: '0.875rem 1rem', color: '#334155', fontWeight: 700 }}>Brand &amp; Model</th>
                        <th style={{ padding: '0.875rem 1rem', color: '#334155', fontWeight: 700 }}>Category</th>
                        <th style={{ padding: '0.875rem 1rem', color: '#334155', fontWeight: 700 }}>Capacity / AC</th>
                        <th style={{ padding: '0.875rem 1rem', color: '#334155', fontWeight: 700 }}>Fuel</th>
                        <th style={{ padding: '0.875rem 1rem', color: '#334155', fontWeight: 700 }}>Ownership / Vendor</th>
                        <th style={{ padding: '0.875rem 1rem', color: '#334155', fontWeight: 700 }}>Duty Driver</th>
                        <th style={{ padding: '0.875rem 1rem', color: '#334155', fontWeight: 700 }}>Status</th>
                        <th style={{ padding: '0.875rem 1rem', textAlign: 'right', color: '#334155', fontWeight: 700 }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredVehicles.map((v) => {
                        const isVendor = isVendorVehicle(v);
                        return (
                          <tr
                            key={v.id}
                            style={{ borderBottom: '1px solid #e2e8f0', transition: 'background-color 0.15s ease' }}
                            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
                            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                          >
                            <td style={{ padding: '0.875rem 1rem', fontWeight: 800, color: '#2C3480' }}>
                              {v.regNo}
                            </td>
                            <td style={{ padding: '0.875rem 1rem', fontWeight: 600, color: '#090d16' }}>
                              {v.brand} {v.model}
                            </td>
                            <td style={{ padding: '0.875rem 1rem' }}>
                              <span style={{ fontSize: '0.75rem', backgroundColor: '#EEF0FD', color: '#2C3480', padding: '0.125rem 0.375rem', borderRadius: '4px', fontWeight: 600 }}>
                                {v.category}
                              </span>
                            </td>
                            <td style={{ padding: '0.875rem 1rem' }}>
                              {v.seatingCapacity} Seater • {v.isAC ? 'AC' : 'Non-AC'}
                            </td>
                            <td style={{ padding: '0.875rem 1rem' }}>{v.fuelType}</td>
                            <td style={{ padding: '0.875rem 1rem' }}>
                              {isVendor ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                                  <span style={{ fontWeight: 800, color: '#b45309', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8125rem' }}>
                                    <Truck size={13} /> {v.vendorName || 'Vendor Attached'}
                                  </span>
                                  <span style={{ fontSize: '0.6875rem', color: '#64748b', fontFamily: 'monospace' }}>
                                    {v.vendorCode || 'Partner'} {v.vendorContact ? `• ${v.vendorContact}` : ''}
                                  </span>
                                </div>
                              ) : (
                                <span style={{ fontWeight: 700, color: '#15803d', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8125rem' }}>
                                  <Building2 size={13} /> MAK In-House
                                </span>
                              )}
                            </td>
                            <td style={{ padding: '0.875rem 1rem' }}>
                              {v.driverName ? (
                                <span style={{ fontWeight: 600, color: '#2C3480' }}>{v.driverName}</span>
                              ) : (
                                <span style={{ color: '#64748b' }}>Unassigned</span>
                              )}
                            </td>
                            <td style={{ padding: '0.875rem 1rem' }}>
                              <StatusBadge status={v.status} />
                            </td>
                            <td style={{ padding: '0.875rem 1rem', textAlign: 'right' }}>
                              <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                                <button
                                  onClick={() => navigate(`/admin/fleet/${v.id}`)}
                                  style={{
                                    padding: '0.375rem 0.625rem',
                                    backgroundColor: '#EEF0FD',
                                    color: '#2C3480',
                                    borderRadius: '6px',
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontSize: '0.75rem',
                                    fontWeight: 600
                                  }}
                                >
                                  View
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditCarImage(v)}
                                  style={{
                                    padding: '0.375rem 0.625rem',
                                    backgroundColor: '#EEF0FD',
                                    color: '#2C3480',
                                    borderRadius: '6px',
                                    border: '1px solid #c7d2fe',
                                    cursor: 'pointer',
                                    fontSize: '0.75rem',
                                    fontWeight: 700,
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.25rem'
                                  }}
                                  title="Change Car Photo"
                                >
                                  <Camera size={12} /> Photo
                                </button>
                                <button
                                  onClick={() => navigate(`/admin/fleet/${v.id}/edit`)}
                                  style={{
                                    padding: '0.375rem 0.625rem',
                                    backgroundColor: '#ffffff',
                                    color: '#334155',
                                    borderRadius: '6px',
                                    border: '1px solid #cbd5e1',
                                    cursor: 'pointer',
                                    fontSize: '0.75rem',
                                    fontWeight: 600,
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.25rem'
                                  }}
                                  title="Edit Vehicle"
                                >
                                  <Edit size={12} /> Edit
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardBody>
            </Card>
          )}
        </div>
      )}

      {/* Tab 2: Availability Schedule Matrix - Modern Card Style */}
      {activeTab === 'availability' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Header Card */}
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              padding: '1.25rem 1.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '1rem',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                <Calendar size={18} color="#2C3480" />
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#2C3480', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Fleet Dispatch &amp; Yard Availability Matrix
                </span>
              </div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#090d16', margin: 0 }}>
                7-Day Rolling Availability Schedule ({activeVehicles.length} Units)
              </h2>
              <p style={{ fontSize: '0.8125rem', color: '#64748b', margin: '0.25rem 0 0' }}>
                Real-time yard dispatch coordinates, allocated reservations, and active trip schedules.
              </p>
            </div>

            {/* Legend */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', fontSize: '0.75rem', fontWeight: 700 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', color: '#15803d' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#15803d' }} /> Available
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', color: '#2C3480' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#2C3480' }} /> On Trip
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', color: '#b45309' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#b45309' }} /> Reserved
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', color: '#b91c1c' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#b91c1c' }} /> Maintenance
              </span>
            </div>
          </div>

          {/* Schedule Cards Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
            {activeVehicles.length === 0 ? (
              <div style={{ padding: '3.5rem 2rem', textAlign: 'center', backgroundColor: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                <Calendar size={40} style={{ color: '#cbd5e1', margin: '0 auto 0.75rem' }} />
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#1e293b', margin: '0 0 0.25rem' }}>No fleet vehicles in registry</h3>
                <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>Add a vehicle to view the 7-day operational schedule matrix.</p>
              </div>
            ) : (
              activeVehicles.map((v) => {
              const schedMatch = vehicleScheduleMock.find((s) => s.regNo === v.regNo);
              const sched = schedMatch?.schedule || ['Available', 'Available', 'Available', 'Available', 'Available', 'Available', 'Available'];
              const days = ['Nov 09 (Mon)', 'Nov 10 (Tue)', 'Nov 11 (Wed)', 'Nov 12 (Thu)', 'Nov 13 (Fri)', 'Nov 14 (Sat)', 'Nov 15 (Sun)'];
              const isVendor = isVendorVehicle(v);

              return (
                <div
                  key={v.id}
                  style={{
                    backgroundColor: '#ffffff',
                    borderRadius: '14px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                    padding: '1.25rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1rem',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {/* Top Header Row of the Card */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div
                        style={{
                          width: '42px',
                          height: '42px',
                          borderRadius: '10px',
                          backgroundColor: isVendor ? '#b45309' : '#2C3480',
                          color: '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 800,
                          flexShrink: 0
                        }}
                      >
                        {isVendor ? <Truck size={20} /> : <Car size={20} />}
                      </div>

                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                          <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#090d16', margin: 0 }}>
                            {v.brand} {v.model}
                          </h3>
                          <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#2C3480', fontFamily: 'monospace' }}>
                            {v.regNo}
                          </span>
                          <span style={{ fontSize: '0.6875rem', fontWeight: 700, backgroundColor: '#EEF0FD', color: '#2C3480', padding: '0.15rem 0.5rem', borderRadius: '4px' }}>
                            {v.category}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.2rem' }}>
                          {isVendor ? (
                            <span style={{ color: '#b45309', fontWeight: 700 }}>
                              Attached Partner: {v.vendorName || 'Vendor Attached'} ({v.vendorCode || 'VND'})
                            </span>
                          ) : (
                            <span style={{ color: '#15803d', fontWeight: 700 }}>
                              MAK In-House Fleet
                            </span>
                          )}
                          {' '}&bull; Driver: <strong>{v.driverName || 'Depot Standby'}</strong>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => navigate(`/admin/fleet/${v.id}`)}
                      style={{
                        padding: '0.4rem 0.8rem',
                        backgroundColor: '#ffffff',
                        color: '#2C3480',
                        border: '1px solid #cbd5e1',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem'
                      }}
                    >
                      Details <ArrowRight size={13} />
                    </button>
                  </div>

                  {/* 7-Day Visual Chips Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '0.5rem' }}>
                    {days.map((dayLabel, idx) => {
                      const dayStatus = sched[idx] || 'Available';
                      const isAvail = dayStatus === 'Available';
                      const isTrip = dayStatus === 'On Trip';
                      const isMaint = dayStatus === 'Maintenance';
                      const isReserved = dayStatus === 'Reserved';

                      return (
                        <div
                          key={dayLabel}
                          style={{
                            backgroundColor: '#fafbfc',
                            border: '1px solid #f1f5f9',
                            borderRadius: '8px',
                            padding: '0.625rem 0.5rem',
                            textAlign: 'center',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '0.35rem'
                          }}
                        >
                          <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#64748b' }}>
                            {dayLabel}
                          </span>
                          <span
                            style={{
                              display: 'inline-block',
                              padding: '0.2rem 0.5rem',
                              borderRadius: '6px',
                              fontSize: '0.725rem',
                              fontWeight: 800,
                              backgroundColor: isAvail ? '#DCFCE7' : isTrip ? '#EEF0FD' : isMaint ? '#FEE2E2' : '#FEF3C7',
                              color: isAvail ? '#15803D' : isTrip ? '#2C3480' : isMaint ? '#B91C1C' : '#B45309'
                            }}
                          >
                            {dayStatus}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
          </div>
        </div>
      )}

      {/* Tab 3: Maintenance Logs - Modern Card Style */}
      {activeTab === 'maintenance' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Header Card */}
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              padding: '1.25rem 1.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '1rem',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                <Wrench size={18} color="#2C3480" />
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#2C3480', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Preventive Maintenance &amp; Statutory Inspection Ledger
                </span>
              </div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#090d16', margin: 0 }}>
                Service &amp; Periodic Inspection Schedule ({vehicles.length} Units)
              </h2>
              <p style={{ fontSize: '0.8125rem', color: '#64748b', margin: '0.25rem 0 0' }}>
                Scheduled oil changes, brake pads, tyre rotation, and statutory RTO fitness test certificates.
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ padding: '0.5rem 0.85rem', backgroundColor: '#f0fdf4', borderRadius: '8px', border: '1px solid #bbf7d0', fontSize: '0.75rem', fontWeight: 700, color: '#16a34a', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <CheckCircle2 size={15} /> All Units Certified &amp; Roadworthy
              </div>
            </div>
          </div>

          {/* Cards Grid: 1 Card Per Vehicle */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.25rem' }}>
            {vehicles.length === 0 ? (
              <div style={{ gridColumn: '1 / -1', padding: '3.5rem 2rem', textAlign: 'center', backgroundColor: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                <Wrench size={40} style={{ color: '#cbd5e1', margin: '0 auto 0.75rem' }} />
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#1e293b', margin: '0 0 0.25rem' }}>No maintenance records</h3>
                <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>Vehicles and inspection logs will appear here once vehicles are added to the fleet.</p>
              </div>
            ) : (
              vehicles.map((v) => {
                const isVendor = isVendorVehicle(v);
              return (
                <div
                  key={v.id}
                  style={{
                    backgroundColor: '#ffffff',
                    borderRadius: '14px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {/* Card Header */}
                  <div
                    style={{
                      padding: '0.85rem 1.15rem',
                      backgroundColor: '#f8fafc',
                      borderBottom: '1px solid #f1f5f9',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '0.5rem',
                      flexWrap: 'wrap'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span
                        style={{
                          fontSize: '0.8125rem',
                          fontWeight: 800,
                          color: '#2C3480',
                          fontFamily: 'monospace'
                        }}
                      >
                        {v.regNo}
                      </span>
                      <span
                        style={{
                          fontSize: '0.6875rem',
                          fontWeight: 700,
                          backgroundColor: '#EEF0FD',
                          color: '#2C3480',
                          padding: '0.15rem 0.45rem',
                          borderRadius: '4px'
                        }}
                      >
                        {v.category}
                      </span>
                    </div>

                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        color: '#15803d',
                        backgroundColor: '#dcfce7',
                        padding: '0.2rem 0.55rem',
                        borderRadius: '6px',
                        fontWeight: 700,
                        fontSize: '0.725rem'
                      }}
                    >
                      <CheckCircle2 size={13} /> Certified
                    </span>
                  </div>

                  {/* Vehicle Title & Ownership */}
                  <div style={{ padding: '1rem 1.15rem 0.5rem' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#090d16', margin: 0 }}>
                      {v.brand} {v.model}
                    </h3>
                    <div style={{ fontSize: '0.75rem', color: isVendor ? '#b45309' : '#15803d', fontWeight: 700, marginTop: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      {isVendor ? (
                        <>
                          <Truck size={13} /> Attached: {v.vendorName || 'Vendor Partner'} ({v.vendorCode || 'VND'})
                        </>
                      ) : (
                        <>
                          <Building2 size={13} /> MAK In-House Fleet
                        </>
                      )}
                    </div>
                  </div>

                  {/* Service Intervals Grid */}
                  <div style={{ padding: '0.75rem 1.15rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.625rem' }}>
                    <div style={{ backgroundColor: '#f8fafc', padding: '0.6rem 0.75rem', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
                      <span style={{ fontSize: '0.6875rem', color: '#64748b', fontWeight: 600, display: 'block' }}>
                        Last Service Date
                      </span>
                      <strong style={{ fontSize: '0.85rem', color: '#090d16' }}>
                        {v.maintenanceHistory?.[0]?.date || '2026-09-15'}
                      </strong>
                    </div>

                    <div style={{ backgroundColor: '#f8fafc', padding: '0.6rem 0.75rem', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
                      <span style={{ fontSize: '0.6875rem', color: '#64748b', fontWeight: 600, display: 'block' }}>
                        Next Service Due
                      </span>
                      <strong style={{ fontSize: '0.85rem', color: '#d97706' }}>
                        {v.nextServiceDue || '2026-12-15'}
                      </strong>
                    </div>
                  </div>

                  {/* Statutory Document Compliance Chips */}
                  <div style={{ padding: '0 1.15rem 0.75rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <span style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                      Statutory Compliance Certifications
                    </span>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem', fontSize: '0.75rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.35rem 0.55rem', backgroundColor: '#fafbfc', borderRadius: '6px', border: '1px solid #f1f5f9' }}>
                        <span style={{ color: '#64748b' }}>Insurance:</span>
                        <strong style={{ color: '#090d16' }}>{v.insuranceExpiry || '2027-03-15'}</strong>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.35rem 0.55rem', backgroundColor: '#fafbfc', borderRadius: '6px', border: '1px solid #f1f5f9' }}>
                        <span style={{ color: '#64748b' }}>Fitness FC:</span>
                        <strong style={{ color: '#090d16' }}>{v.fitnessExpiry || '2027-04-10'}</strong>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.35rem 0.55rem', backgroundColor: '#fafbfc', borderRadius: '6px', border: '1px solid #f1f5f9' }}>
                        <span style={{ color: '#64748b' }}>PUC Cert:</span>
                        <strong style={{ color: '#090d16' }}>{v.pucExpiry || '2027-02-15'}</strong>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.35rem 0.55rem', backgroundColor: '#fafbfc', borderRadius: '6px', border: '1px solid #f1f5f9' }}>
                        <span style={{ color: '#64748b' }}>Permit:</span>
                        <strong style={{ color: '#090d16' }}>{v.permitExpiry || '2028-01-20'}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Card Footer: Tariff & Action Button */}
                  <div
                    style={{
                      padding: '0.75rem 1.15rem',
                      backgroundColor: '#f8fafc',
                      borderTop: '1px solid #f1f5f9',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginTop: 'auto'
                    }}
                  >
                    <div>
                      <span style={{ fontSize: '0.675rem', color: '#64748b', display: 'block', fontWeight: 600 }}>
                        BASE TARIFF
                      </span>
                      <strong style={{ fontSize: '0.9375rem', color: '#090d16' }}>
                        ₹{v.ratePerKm || v.pricePerKm || 15} <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 500 }}>/ km</span>
                      </strong>
                    </div>

                    <button
                      type="button"
                      onClick={() => navigate(`/admin/fleet/${v.id}`)}
                      style={{
                        padding: '0.45rem 0.85rem',
                        backgroundColor: '#2C3480',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.3rem'
                      }}
                    >
                      Details <ArrowRight size={13} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
          </div>
        </div>
      )}

      {/* Quick Edit Car Photo Modal */}
      <Modal
        isOpen={Boolean(editCarImageModalVehicle)}
        onClose={() => setEditCarImageModalVehicle(null)}
        title="Edit Vehicle Car Photograph"
        maxWidth="680px"
      >
        {editCarImageModalVehicle && (
          <form onSubmit={handleSaveCarImage}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Vehicle Specs Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', backgroundColor: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <div>
                  <span style={{ fontSize: '0.725rem', fontWeight: 800, color: '#2C3480', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    {editCarImageModalVehicle.category} • {editCarImageModalVehicle.seating || `${editCarImageModalVehicle.seatingCapacity} Seater`}
                  </span>
                  <h4 style={{ margin: '0.2rem 0 0', fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>
                    {editCarImageModalVehicle.brand} {editCarImageModalVehicle.model}
                  </h4>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '0.725rem', color: '#64748b', display: 'block' }}>Registration Plate</span>
                  <strong style={{ fontSize: '0.95rem', color: '#2C3480', fontFamily: 'monospace' }}>
                    {editCarImageModalVehicle.regNo || editCarImageModalVehicle.id}
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
                <Button variant="outline" type="button" onClick={() => setEditCarImageModalVehicle(null)}>
                  Cancel
                </Button>
                <Button variant="primary" type="submit" disabled={isSavingCarImage} style={{ backgroundColor: '#2C3480' }}>
                  {isSavingCarImage ? 'Saving to Database...' : 'Save Car Photo to Database'}
                </Button>
              </div>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}

export default FleetList;
