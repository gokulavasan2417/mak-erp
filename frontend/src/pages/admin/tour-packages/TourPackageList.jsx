// MAK Tours & Travels ERP - Tour Packages List (Matching Reference Card Design)
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Compass,
  Plus,
  Clock,
  MapPin,
  Eye,
  Edit,
  Trash2,
  CheckCircle2,
  LayoutGrid,
  List,
  Sparkles,
  ArrowRight,
  Check,
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
import { packageCategories } from '../../../data';

export const TOUR_IMAGE_PRESETS = [
  { label: 'Golden Temple, Amritsar', category: 'North India', url: 'https://images.unsplash.com/photo-1588714477688-cf28a50e94f7?auto=format&fit=crop&w=800&q=80' },
  { label: 'Nainital & Uttarakhand Hills', category: 'North India', url: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=800&q=80' },
  { label: 'Goa Coastal Beach', category: 'Beach Tours', url: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=800&q=80' },
  { label: 'Rameswaram & Madurai Temple', category: 'South India', url: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=800&q=80' },
  { label: 'Kerala Backwaters & Houseboat', category: 'South India', url: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=800&q=80' },
  { label: 'Mysore Heritage Palace', category: 'South India', url: 'https://images.unsplash.com/photo-1590766940554-634a7ed41450?auto=format&fit=crop&w=800&q=80' },
  { label: 'Ooty & Nilgiri Hills', category: 'South India', url: 'https://images.unsplash.com/photo-1589182373726-e4f658ab50f0?auto=format&fit=crop&w=800&q=80' },
  { label: 'Ladakh High Passes', category: 'North India', url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80' }
];

export function TourPackageList() {
  const navigate = useNavigate();
  const toast = useToast();
  const { tourPackages, updateTourPackage, togglePackageStatus } = useAdminData();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'

  // Quick Edit Price Modal State
  const [editPriceModalPkg, setEditPriceModalPkg] = useState(null);
  const [priceInputValue, setPriceInputValue] = useState('');
  const [isSavingPrice, setIsSavingPrice] = useState(false);

  // Quick Edit Image Modal State
  const [editImageModalPkg, setEditImageModalPkg] = useState(null);
  const [imageInputValue, setImageInputValue] = useState('');
  const [imageUploadPreview, setImageUploadPreview] = useState('');
  const [isSavingImage, setIsSavingImage] = useState(false);

  const formatPackagePrice = (pkg) => {
    const val = Number(pkg?.startingPrice || pkg?.priceNumeric || (typeof pkg?.price === 'string' ? pkg.price.replace(/[^\d]/g, '') : pkg?.price)) || 0;
    return val > 0 ? val.toLocaleString('en-IN') : '0';
  };

  const handleOpenEditPrice = (pkg) => {
    const currentPrice = Number(pkg?.startingPrice || pkg?.priceNumeric || (typeof pkg?.price === 'string' ? pkg.price.replace(/[^\d]/g, '') : pkg?.price)) || 0;
    setEditPriceModalPkg(pkg);
    setPriceInputValue(String(currentPrice));
  };

  const handleSavePrice = async (e) => {
    e.preventDefault();
    if (!editPriceModalPkg) return;
    const newPrice = Number(priceInputValue);
    if (isNaN(newPrice) || newPrice < 0) return;

    setIsSavingPrice(true);
    try {
      await updateTourPackage(editPriceModalPkg.id, {
        startingPrice: newPrice,
        priceNumeric: newPrice,
        price: `₹${newPrice.toLocaleString('en-IN')}`
      });
      setEditPriceModalPkg(null);
      toast.success('Tour package price updated successfully in database!');
    } catch (err) {
      toast.error('Failed to update price: ' + (err.message || 'Error'));
    } finally {
      setIsSavingPrice(false);
    }
  };

  const handleOpenEditImage = (pkg) => {
    const currentImg = pkg.images?.[0] || pkg.destinationImage || pkg.heroImage || pkg.image || 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=800&q=80';
    setEditImageModalPkg(pkg);
    setImageInputValue(currentImg);
    setImageUploadPreview(currentImg);
  };

  const handleImageFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.warning('Image file size exceeds 5MB. Please choose a smaller image.');
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
    if (!editImageModalPkg) return;
    const finalUrl = (imageUploadPreview || imageInputValue || '').trim();
    if (!finalUrl) {
      toast.error('Please enter a valid image URL or upload an image file.');
      return;
    }

    setIsSavingImage(true);
    try {
      await updateTourPackage(editImageModalPkg.id, {
        image: finalUrl,
        destinationImage: finalUrl,
        heroImage: finalUrl,
        images: [finalUrl]
      });
      setEditImageModalPkg(null);
      toast.success('Tour package photo updated successfully in database!');
    } catch (err) {
      toast.error('Failed to update tour package photo: ' + (err.message || 'Error'));
    } finally {
      setIsSavingImage(false);
    }
  };

  const filteredPackages = useMemo(() => {
    return tourPackages.filter((pkg) => {
      if (!pkg) return false;
      const q = searchQuery.toLowerCase().trim();
      const name = (pkg.name || '').toLowerCase();
      const dest = (pkg.destination || pkg.pickupLocation || '').toLowerCase();
      const code = (pkg.code || pkg.id || pkg.slug || '').toLowerCase();

      const matchesSearch = !q || name.includes(q) || dest.includes(q) || code.includes(q);

      const pkgCats = Array.isArray(pkg.categories) ? pkg.categories : [pkg.category || ''];
      const matchesCategory =
        selectedCategory === 'All' ||
        selectedCategory === 'All Categories' ||
        pkg.category === selectedCategory ||
        pkgCats.includes(selectedCategory);

      return matchesSearch && matchesCategory;
    });
  }, [tourPackages, searchQuery, selectedCategory]);

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
            <Compass size={18} color="#2C3480" />
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#2C3480', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Curated Holiday Circuits
            </span>
          </div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
            Tour Package Management
          </h1>
          <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0.25rem 0 0' }}>
            Manage pilgrimage, hill station, coastal, and heritage itineraries.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {/* View Mode Switcher */}
          <div style={{ display: 'flex', border: '1px solid #cbd5e1', borderRadius: '8px', overflow: 'hidden' }}>
            <button
              onClick={() => setViewMode('grid')}
              title="Cards View"
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
            onClick={() => navigate('/admin/tour-packages/new')}
          >
            <Plus size={16} style={{ marginRight: '0.35rem' }} /> Add Package
          </Button>
        </div>
      </div>

      {/* Filter Card */}
      <Card>
        <CardBody style={{ padding: '1rem 1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search by package name, destination, code..."
              width="360px"
            />

            <FilterSelect
              label="Category"
              value={selectedCategory}
              onChange={setSelectedCategory}
              options={['All', ...packageCategories.filter((c) => c !== 'All Categories' && c !== 'All')]}
            />
          </div>
        </CardBody>
      </Card>

      {/* Grid View Mode (Styled with exact equal card heights and alignment) */}
      {viewMode === 'grid' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(330px, 1fr))', gap: '1.5rem', alignItems: 'stretch' }}>
          {filteredPackages.map((pkg) => {
            const shortInclusions = pkg.inclusions && pkg.inclusions.length > 0
              ? pkg.inclusions.slice(0, 3)
              : [
                  'Dedicated AC Driver Vehicle',
                  'Confirmed Entry & Route Passes',
                  'All Tolls & Inter-State Permits Covered'
                ];

            return (
              <div
                key={pkg.id}
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '16px',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -2px rgba(0,0,0,0.05)',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  height: '100%',
                  transition: 'transform 0.2s, box-shadow 0.2s, border-color 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 12px 24px -4px rgba(0,0,0,0.1)';
                  e.currentTarget.style.borderColor = '#cbd5e1';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'none';
                  e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -2px rgba(0,0,0,0.05)';
                  e.currentTarget.style.borderColor = '#e2e8f0';
                }}
              >
                {/* Image Banner */}
                <div style={{ position: 'relative', height: '185px', width: '100%', overflow: 'hidden', backgroundColor: '#0f172a', flexShrink: 0 }}>
                  <img
                    src={pkg.images?.[0] || pkg.destinationImage || pkg.heroImage || pkg.image || 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=800&q=80'}
                    alt={pkg.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />

                  {/* Over-image badge (Matches reference image) */}
                  <div style={{ position: 'absolute', top: '0.85rem', left: '0.85rem' }}>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                        fontSize: '0.725rem',
                        fontWeight: 800,
                        backgroundColor: '#2C3480',
                        color: '#ffffff',
                        padding: '0.3rem 0.65rem',
                        borderRadius: '20px',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                        letterSpacing: '0.04em'
                      }}
                    >
                      ★ {pkg.featured ? 'POPULAR TOUR' : 'FEATURED CIRCUIT'}
                    </span>
                  </div>

                  {/* Change Image Overlay Button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenEditImage(pkg);
                    }}
                    title="Change tour package photo"
                    style={{
                      position: 'absolute',
                      top: '0.85rem',
                      right: '0.85rem',
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
                    <Camera size={13} /> Change Image
                  </button>
                </div>

                {/* Card Content Body */}
                <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', flex: 1, gap: '0.875rem' }}>
                  {/* Category Pill */}
                  <div style={{ display: 'flex', alignItems: 'center', minHeight: '26px' }}>
                    <span
                      style={{
                        fontSize: '0.725rem',
                        fontWeight: 700,
                        color: '#2C3480',
                        backgroundColor: '#eef2ff',
                        padding: '0.2rem 0.55rem',
                        borderRadius: '6px',
                        border: '1px solid #c7d2fe',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                      }}
                    >
                      {pkg.category}
                    </span>
                  </div>

                  {/* Title & Short Description (Equal Height) */}
                  <div>
                    <h3
                      onClick={() => navigate(`/admin/tour-packages/${pkg.id}`)}
                      style={{
                        fontSize: '1.15rem',
                        fontWeight: 800,
                        color: '#0f172a',
                        margin: '0 0 0.35rem',
                        cursor: 'pointer',
                        lineHeight: 1.3,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = '#2C3480')}
                      onMouseLeave={(e) => (e.currentTarget.style.color = '#0f172a')}
                      title={pkg.name}
                    >
                      {pkg.name}
                    </h3>
                    <p
                      style={{
                        fontSize: '0.825rem',
                        color: '#64748b',
                        margin: 0,
                        lineHeight: 1.5,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        height: '3em'
                      }}
                    >
                      {pkg.description}
                    </p>
                  </div>

                  {/* Checklist with Green Checkmarks - Equal Min-Height (110px) */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', margin: '0.25rem 0', minHeight: '110px' }}>
                    {shortInclusions.map((inc, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.8rem', color: '#334155' }}>
                        <div
                          style={{
                            width: '16px',
                            height: '16px',
                            borderRadius: '50%',
                            backgroundColor: '#dcfce7',
                            color: '#16a34a',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            marginTop: '0.1rem'
                          }}
                        >
                          <Check size={11} strokeWidth={3} />
                        </div>
                        <span style={{ fontWeight: 500, lineHeight: 1.35, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{inc}</span>
                      </div>
                    ))}
                  </div>

                  {/* Card Bottom: Starting Price & Cobalt Blue CTA */}
                  <div
                    style={{
                      marginTop: 'auto',
                      paddingTop: '0.875rem',
                      borderTop: '1px solid #f1f5f9',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '0.75rem'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <span style={{ fontSize: '0.675rem', color: '#64748b', display: 'block', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          STARTING FROM
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenEditPrice(pkg);
                          }}
                          title="Quick edit price"
                          style={{
                            border: 'none',
                            background: '#EEF0FD',
                            color: '#2C3480',
                            padding: '1px 5px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '0.65rem',
                            fontWeight: 700,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '2px'
                          }}
                        >
                          <Edit size={10} /> Edit
                        </button>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem' }}>
                        <span style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a' }}>
                          ₹{formatPackagePrice(pkg)}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 500 }}>
                          / person
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                      <button
                        type="button"
                        onClick={() => handleOpenEditPrice(pkg)}
                        title="Edit Price"
                        style={{
                          backgroundColor: '#EEF0FD',
                          color: '#2C3480',
                          border: '1px solid #c7d2fe',
                          padding: '0.65rem 0.85rem',
                          borderRadius: '10px',
                          fontWeight: 700,
                          fontSize: '0.825rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          cursor: 'pointer',
                          transition: 'all 0.15s'
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#e0e7ff')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#EEF0FD')}
                      >
                        <Edit size={13} /> Edit Price
                      </button>
                      <button
                        type="button"
                        onClick={() => navigate(`/admin/tour-packages/${pkg.id}`)}
                        style={{
                          backgroundColor: '#2C3480',
                          color: '#ffffff',
                          border: 'none',
                          padding: '0.65rem 1rem',
                          borderRadius: '10px',
                          fontWeight: 700,
                          fontSize: '0.85rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.45rem',
                          cursor: 'pointer',
                          transition: 'background-color 0.15s, transform 0.15s'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#232a68';
                          e.currentTarget.style.transform = 'translateY(-1px)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = '#2C3480';
                          e.currentTarget.style.transform = 'none';
                        }}
                      >
                        View Package <ArrowRight size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View Mode */
        <Card>
          <CardBody style={{ padding: 0 }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
                    <th style={{ padding: '0.875rem 1rem', color: '#334155', fontWeight: 700 }}>Package Code</th>
                    <th style={{ padding: '0.875rem 1rem', color: '#334155', fontWeight: 700 }}>Package Name</th>
                    <th style={{ padding: '0.875rem 1rem', color: '#334155', fontWeight: 700 }}>Category</th>
                    <th style={{ padding: '0.875rem 1rem', color: '#334155', fontWeight: 700 }}>Destination</th>
                    <th style={{ padding: '0.875rem 1rem', color: '#334155', fontWeight: 700 }}>Duration</th>
                    <th style={{ padding: '0.875rem 1rem', color: '#334155', fontWeight: 700 }}>Price</th>
                    <th style={{ padding: '0.875rem 1rem', color: '#334155', fontWeight: 700 }}>Status</th>
                    <th style={{ padding: '0.875rem 1rem', textAlign: 'right', color: '#334155', fontWeight: 700 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPackages.map((pkg) => (
                    <tr
                      key={pkg.id}
                      style={{ borderBottom: '1px solid #e2e8f0', transition: 'background-color 0.15s ease' }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <td style={{ padding: '0.875rem 1rem', fontWeight: 800, color: '#2C3480' }}>
                        {pkg.code}
                      </td>
                      <td style={{ padding: '0.875rem 1rem', fontWeight: 600, color: '#090d16' }}>
                        {pkg.name}
                      </td>
                      <td style={{ padding: '0.875rem 1rem' }}>
                        <span style={{ fontSize: '0.75rem', backgroundColor: '#eef2ff', color: '#2C3480', padding: '0.125rem 0.375rem', borderRadius: '4px', fontWeight: 600 }}>
                          {pkg.category}
                        </span>
                      </td>
                      <td style={{ padding: '0.875rem 1rem' }}>{pkg.destination}</td>
                      <td style={{ padding: '0.875rem 1rem' }}>{pkg.days}D / {pkg.nights}N</td>
                      <td style={{ padding: '0.875rem 1rem', fontWeight: 700, color: '#2C3480' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                          <span>₹{formatPackagePrice(pkg)}</span>
                          <button
                            type="button"
                            onClick={() => handleOpenEditPrice(pkg)}
                            title="Quick edit price"
                            style={{
                              border: 'none',
                              background: '#EEF0FD',
                              color: '#2C3480',
                              padding: '2px 5px',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center'
                            }}
                          >
                            <Edit size={11} />
                          </button>
                        </div>
                      </td>
                      <td style={{ padding: '0.875rem 1rem' }}>
                        <StatusBadge status={pkg.status} />
                      </td>
                      <td style={{ padding: '0.875rem 1rem', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
                          <button
                            type="button"
                            onClick={() => handleOpenEditPrice(pkg)}
                            style={{
                              padding: '0.35rem 0.65rem',
                              backgroundColor: '#EEF0FD',
                              color: '#2C3480',
                              borderRadius: '6px',
                              border: '1px solid #c7d2fe',
                              cursor: 'pointer',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.25rem'
                            }}
                          >
                            <Edit size={11} /> Edit Price
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenEditImage(pkg)}
                            style={{
                              padding: '0.35rem 0.65rem',
                              backgroundColor: '#EEF0FD',
                              color: '#2C3480',
                              borderRadius: '6px',
                              border: '1px solid #c7d2fe',
                              cursor: 'pointer',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.25rem'
                            }}
                          >
                            <Camera size={11} /> Photo
                          </button>
                          <button
                            type="button"
                            onClick={() => navigate(`/admin/tour-packages/${pkg.id}/edit`)}
                            style={{
                              padding: '0.35rem 0.65rem',
                              backgroundColor: '#f1f5f9',
                              color: '#334155',
                              borderRadius: '6px',
                              border: '1px solid #cbd5e1',
                              cursor: 'pointer',
                              fontSize: '0.75rem',
                              fontWeight: 600
                            }}
                          >
                            Full Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => navigate(`/admin/tour-packages/${pkg.id}`)}
                            style={{
                              padding: '0.35rem 0.65rem',
                              backgroundColor: '#2C3480',
                              color: '#fff',
                              borderRadius: '6px',
                              border: 'none',
                              cursor: 'pointer',
                              fontSize: '0.75rem',
                              fontWeight: 600
                            }}
                          >
                            View
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Quick Edit Price Modal */}
      <Modal
        isOpen={Boolean(editPriceModalPkg)}
        onClose={() => setEditPriceModalPkg(null)}
        title="Edit Tour Package Price"
      >
        {editPriceModalPkg && (
          <form onSubmit={handleSavePrice}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem', backgroundColor: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <img
                  src={editPriceModalPkg.destinationImage || editPriceModalPkg.heroImage || editPriceModalPkg.image || 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=400&q=80'}
                  alt={editPriceModalPkg.name}
                  style={{ width: '64px', height: '64px', borderRadius: '8px', objectFit: 'cover' }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ fontSize: '0.725rem', fontWeight: 700, color: '#2C3480', textTransform: 'uppercase' }}>
                    {editPriceModalPkg.category || 'Tour Package'}
                  </span>
                  <h4 style={{ margin: '0.15rem 0 0.25rem', fontSize: '1rem', fontWeight: 800, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {editPriceModalPkg.name}
                  </h4>
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    Duration: {editPriceModalPkg.duration || `${editPriceModalPkg.days || editPriceModalPkg.daysCount || 1} Days`}
                  </span>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.35rem' }}>
                  Starting Price Amount (₹ / person) *
                </label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', fontWeight: 700, color: '#64748b', fontSize: '1.1rem' }}>
                    ₹
                  </span>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    required
                    value={priceInputValue}
                    onChange={(e) => setPriceInputValue(e.target.value)}
                    placeholder="e.g. 14999"
                    style={{
                      width: '100%',
                      padding: '0.75rem 0.75rem 0.75rem 2.25rem',
                      fontSize: '1.15rem',
                      fontWeight: 800,
                      borderRadius: '8px',
                      border: '1.5px solid #cbd5e1',
                      color: '#0f172a',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                <p style={{ margin: '0.35rem 0 0', fontSize: '0.75rem', color: '#64748b' }}>
                  This amount will be saved to MongoDB Atlas database and used for automatic passenger fare calculations.
                </p>
              </div>

              {/* Quick Presets */}
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '0.35rem' }}>
                  Quick Adjust Presets:
                </span>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {[1000, 2000, 5000].map((add) => (
                    <button
                      key={add}
                      type="button"
                      onClick={() => setPriceInputValue((prev) => String((Number(prev) || 0) + add))}
                      style={{
                        padding: '0.35rem 0.65rem',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        backgroundColor: '#f1f5f9',
                        border: '1px solid #cbd5e1',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        color: '#334155'
                      }}
                    >
                      +₹{add.toLocaleString('en-IN')}
                    </button>
                  ))}
                  {[1000, 2000, 5000].map((sub) => (
                    <button
                      key={`sub-${sub}`}
                      type="button"
                      onClick={() => setPriceInputValue((prev) => String(Math.max(1, (Number(prev) || 0) - sub)))}
                      style={{
                        padding: '0.35rem 0.65rem',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        backgroundColor: '#f1f5f9',
                        border: '1px solid #cbd5e1',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        color: '#334155'
                      }}
                    >
                      -₹{sub.toLocaleString('en-IN')}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid #e2e8f0' }}>
                <Button variant="outline" type="button" onClick={() => setEditPriceModalPkg(null)}>
                  Cancel
                </Button>
                <Button variant="primary" type="submit" disabled={isSavingPrice}>
                  {isSavingPrice ? 'Saving to Database...' : 'Save Price to Database'}
                </Button>
              </div>
            </div>
          </form>
        )}
      </Modal>

      {/* Quick Edit Tour Package Image Modal */}
      <Modal
        isOpen={Boolean(editImageModalPkg)}
        onClose={() => setEditImageModalPkg(null)}
        title="Edit Tour Package Photograph"
        maxWidth="680px"
      >
        {editImageModalPkg && (
          <form onSubmit={handleSaveImage}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Header with info */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', backgroundColor: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <div>
                  <span style={{ fontSize: '0.725rem', fontWeight: 700, color: '#2C3480', textTransform: 'uppercase' }}>
                    {editImageModalPkg.category || 'Tour Package'} • {editImageModalPkg.code}
                  </span>
                  <h4 style={{ margin: '0.2rem 0 0', fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>
                    {editImageModalPkg.name}
                  </h4>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>Destination</span>
                  <strong style={{ fontSize: '0.85rem', color: '#2C3480' }}>{editImageModalPkg.destination}</strong>
                </div>
              </div>

              {/* Live Preview Box */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.4rem' }}>
                  Live Image Preview
                </label>
                <div style={{ height: '200px', width: '100%', borderRadius: '12px', overflow: 'hidden', backgroundColor: '#0f172a', border: '1.5px solid #cbd5e1', position: 'relative' }}>
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
                <Button variant="outline" type="button" onClick={() => setEditImageModalPkg(null)}>
                  Cancel
                </Button>
                <Button variant="primary" type="submit" disabled={isSavingImage} style={{ backgroundColor: '#2C3480' }}>
                  {isSavingImage ? 'Saving to Database...' : 'Save Photo to Database'}
                </Button>
              </div>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}

export default TourPackageList;
