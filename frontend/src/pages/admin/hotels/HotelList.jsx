// MAK Tours & Travels ERP - Partner Hotels & Resorts Directory
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Hotel,
  MapPin,
  Star,
  Plus,
  Search,
  Eye,
  Edit,
  Phone,
  Mail,
  IndianRupee,
  LayoutGrid,
  List,
  BedDouble,
  Sparkles
} from 'lucide-react';
import { Card, CardHeader, CardBody } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { useAdminData } from '../../../context/AdminDataContext';

export function HotelList() {
  const navigate = useNavigate();
  const { hotels } = useAdminData();

  const [searchTerm, setSearchTerm] = useState('');
  const [cityFilter, setCityFilter] = useState('All');
  const [starFilter, setStarFilter] = useState('All');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'table'

  const cities = useMemo(() => {
    const set = new Set(hotels.map((h) => h.city));
    return ['All', ...Array.from(set)];
  }, [hotels]);

  const filteredHotels = useMemo(() => {
    return hotels.filter((h) => {
      const matchSearch =
        searchTerm === '' ||
        h.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        h.destination.toLowerCase().includes(searchTerm.toLowerCase()) ||
        h.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (h.amenities && h.amenities.some((a) => a.toLowerCase().includes(searchTerm.toLowerCase())));

      const matchCity = cityFilter === 'All' || h.city === cityFilter;
      const matchStar = starFilter === 'All' || h.starRating.toString() === starFilter;

      return matchSearch && matchCity && matchStar;
    });
  }, [hotels, searchTerm, cityFilter, starFilter]);

  // Aggregate stats
  const totalGuests = hotels.reduce((sum, h) => sum + (h.totalGuestsHosted || 0), 0);
  const totalActiveBookings = hotels.reduce((sum, h) => sum + (h.activeBookingsCount || 0), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Header Bar */}
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
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
            Hotel & Resort Partner Network
          </h1>
          <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0.25rem 0 0' }}>
            Accommodations inventory, B2B wholesale negotiated rates & tour package room allocations
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <div style={{ display: 'flex', border: '1px solid #cbd5e1', borderRadius: '8px', overflow: 'hidden' }}>
            <button
              onClick={() => setViewMode('grid')}
              style={{
                padding: '0.45rem 0.75rem',
                border: 'none',
                backgroundColor: viewMode === 'grid' ? '#2C3480' : '#fff',
                color: viewMode === 'grid' ? '#fff' : '#64748b',
                cursor: 'pointer'
              }}
            >
              <LayoutGrid size={16} />
            </button>
            <button
              onClick={() => setViewMode('table')}
              style={{
                padding: '0.45rem 0.75rem',
                border: 'none',
                backgroundColor: viewMode === 'table' ? '#2C3480' : '#fff',
                color: viewMode === 'table' ? '#fff' : '#64748b',
                cursor: 'pointer'
              }}
            >
              <List size={16} />
            </button>
          </div>

          <Button
            variant="primary"
            style={{ backgroundColor: '#2C3480' }}
            onClick={() => navigate('/admin/hotels/new')}
          >
            <Plus size={16} style={{ marginRight: '0.35rem' }} /> Add Partner Hotel
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        <div style={{ backgroundColor: '#ffffff', padding: '1.15rem', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b' }}>TOTAL HOTELS</span>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0f172a', marginTop: '0.4rem' }}>
            {hotels.length}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#16a34a', marginTop: '0.25rem' }}>
            Contracted partner properties
          </div>
        </div>

        <div style={{ backgroundColor: '#ffffff', padding: '1.15rem', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b' }}>DESTINATIONS COVERED</span>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0f172a', marginTop: '0.4rem' }}>
            {new Set(hotels.map((h) => h.city)).size} Cities
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
            South Indian tourism circuits
          </div>
        </div>

        <div style={{ backgroundColor: '#ffffff', padding: '1.15rem', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b' }}>ACTIVE GUEST STAYS</span>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#2C3480', marginTop: '0.4rem' }}>
            {totalActiveBookings}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#2C3480', marginTop: '0.25rem' }}>
            Rooms reserved currently
          </div>
        </div>

        <div style={{ backgroundColor: '#ffffff', padding: '1.15rem', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b' }}>TOTAL GUESTS HOSTED</span>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#16a34a', marginTop: '0.4rem' }}>
            {totalGuests.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#16a34a', marginTop: '0.25rem' }}>
            Lifetime guest nights
          </div>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <Card>
        <CardBody style={{ padding: '1rem 1.25rem' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', flex: 1, minWidth: '280px' }}>
              <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
                <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input
                  type="text"
                  placeholder="Search hotel by property name, destination, city or amenities..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.55rem 0.75rem 0.55rem 2.25rem',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.875rem'
                  }}
                />
              </div>

              <select
                value={cityFilter}
                onChange={(e) => setCityFilter(e.target.value)}
                style={{
                  padding: '0.55rem 0.85rem',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.875rem',
                  backgroundColor: '#fff'
                }}
              >
                {cities.map((c) => (
                  <option key={c} value={c}>
                    {c === 'All' ? 'All Destinations' : c}
                  </option>
                ))}
              </select>

              <select
                value={starFilter}
                onChange={(e) => setStarFilter(e.target.value)}
                style={{
                  padding: '0.55rem 0.85rem',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.875rem',
                  backgroundColor: '#fff'
                }}
              >
                <option value="All">All Star Ratings</option>
                <option value="5">5 Star Luxury</option>
                <option value="4">4 Star Premium</option>
                <option value="3">3 Star Comfort</option>
              </select>
            </div>

            <div style={{ fontSize: '0.825rem', color: '#64748b' }}>
              Showing {filteredHotels.length} properties
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Grid or Table Presentation */}
      {viewMode === 'grid' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
          {filteredHotels.length === 0 ? (
            <div style={{ gridColumn: '1 / -1', padding: '3rem', textAlign: 'center', backgroundColor: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
              <Hotel size={40} style={{ color: '#cbd5e1', margin: '0 auto 0.75rem' }} />
              <p style={{ fontWeight: 600, color: '#334155' }}>No hotel partner matches the search criteria.</p>
            </div>
          ) : (
            filteredHotels.map((htl) => {
              const minRate = htl.roomCategories && htl.roomCategories.length > 0
                ? Math.min(...htl.roomCategories.map((r) => r.baseRate))
                : 3500;

              return (
                <div
                  key={htl.id}
                  style={{
                    backgroundColor: '#ffffff',
                    borderRadius: '16px',
                    border: '1px solid #e2e8f0',
                    overflow: 'hidden',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.04)',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'transform 0.2s, box-shadow 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 6px 12px rgba(0,0,0,0.08)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'none';
                    e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.04)';
                  }}
                >
                  {/* Property Image & Star Badge */}
                  <div style={{ position: 'relative', height: '175px', backgroundColor: '#e2e8f0' }}>
                    <img
                      src={htl.image}
                      alt={htl.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        top: '0.75rem',
                        left: '0.75rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.2rem',
                        backgroundColor: 'rgba(15, 23, 42, 0.85)',
                        color: '#facc15',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        fontWeight: 700
                      }}
                    >
                      <Star size={12} fill="#facc15" /> {htl.starRating} Star
                    </div>
                    <div
                      style={{
                        position: 'absolute',
                        top: '0.75rem',
                        right: '0.75rem',
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        padding: '0.2rem 0.5rem',
                        borderRadius: '6px',
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        color: '#2C3480'
                      }}
                    >
                      {htl.partnerDiscount || 'Contracted Tier'}
                    </div>
                  </div>

                  {/* Body Content */}
                  <div style={{ padding: '1.25rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div>
                      <h3
                        onClick={() => navigate(`/admin/hotels/${htl.id}`)}
                        style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.25rem', cursor: 'pointer' }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = '#2C3480')}
                        onMouseLeave={(e) => (e.currentTarget.style.color = '#0f172a')}
                      >
                        {htl.name}
                      </h3>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#64748b', fontSize: '0.8rem' }}>
                        <MapPin size={13} style={{ color: '#2C3480', flexShrink: 0 }} /> {htl.destination}
                      </div>
                    </div>

                    {/* Amenities pills */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                      {htl.amenities &&
                        htl.amenities.slice(0, 3).map((a) => (
                          <span
                            key={a}
                            style={{
                              fontSize: '0.7rem',
                              padding: '0.15rem 0.45rem',
                              backgroundColor: '#f1f5f9',
                              color: '#475569',
                              borderRadius: '4px'
                            }}
                          >
                            {a}
                          </span>
                        ))}
                      {htl.amenities && htl.amenities.length > 3 && (
                        <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.45rem', color: '#64748b' }}>
                          +{htl.amenities.length - 3} more
                        </span>
                      )}
                    </div>

                    {/* Room Categories preview */}
                    <div style={{ marginTop: 'auto', paddingTop: '0.75rem', borderTop: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <span style={{ fontSize: '0.7rem', color: '#64748b', display: 'block' }}>Contract Base Rate</span>
                        <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>
                          ₹{minRate.toLocaleString('en-IN')}{' '}
                          <span style={{ fontSize: '0.75rem', fontWeight: 500, color: '#64748b' }}>/ night</span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/admin/hotels/${htl.id}/edit`)}
                        >
                          <Edit size={14} />
                        </Button>
                        <Button
                          variant="primary"
                          size="sm"
                          style={{ backgroundColor: '#2C3480' }}
                          onClick={() => navigate(`/admin/hotels/${htl.id}`)}
                        >
                          View Details
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        /* Table View */
        <Card>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: '#f8fafc', color: '#475569', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  <th style={{ padding: '0.875rem 1rem' }}>Property Name</th>
                  <th style={{ padding: '0.875rem 1rem' }}>Destination</th>
                  <th style={{ padding: '0.875rem 1rem', textAlign: 'center' }}>Rating</th>
                  <th style={{ padding: '0.875rem 1rem' }}>Contact</th>
                  <th style={{ padding: '0.875rem 1rem', textAlign: 'right' }}>Active Stays</th>
                  <th style={{ padding: '0.875rem 1rem', textAlign: 'center' }}>Status</th>
                  <th style={{ padding: '0.875rem 1rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredHotels.map((htl) => (
                  <tr key={htl.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '0.875rem 1rem', fontWeight: 700, color: '#0f172a' }}>
                      <div
                        onClick={() => navigate(`/admin/hotels/${htl.id}`)}
                        style={{ cursor: 'pointer' }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = '#2C3480')}
                        onMouseLeave={(e) => (e.currentTarget.style.color = '#0f172a')}
                      >
                        {htl.name}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{htl.hotelCode}</div>
                    </td>
                    <td style={{ padding: '0.875rem 1rem', color: '#475569' }}>{htl.destination}</td>
                    <td style={{ padding: '0.875rem 1rem', textAlign: 'center' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem', fontWeight: 700, color: '#d97706' }}>
                        <Star size={13} fill="#f59e0b" /> {htl.starRating}
                      </span>
                    </td>
                    <td style={{ padding: '0.875rem 1rem', fontSize: '0.8rem', color: '#64748b' }}>
                      {htl.contactPerson}<br />{htl.phone}
                    </td>
                    <td style={{ padding: '0.875rem 1rem', textAlign: 'right', fontWeight: 700, color: '#2C3480' }}>
                      {htl.activeBookingsCount}
                    </td>
                    <td style={{ padding: '0.875rem 1rem', textAlign: 'center' }}>
                      <StatusBadge status={htl.status} />
                    </td>
                    <td style={{ padding: '0.875rem 1rem', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/admin/hotels/${htl.id}`)}
                        >
                          <Eye size={15} style={{ color: '#2C3480' }} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/admin/hotels/${htl.id}/edit`)}
                        >
                          <Edit size={15} style={{ color: '#64748b' }} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

export default HotelList;
