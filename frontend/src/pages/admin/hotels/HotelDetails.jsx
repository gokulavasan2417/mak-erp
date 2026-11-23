// MAK Tours & Travels ERP - Partner Hotel Details & Inventory
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Edit,
  Hotel,
  MapPin,
  Star,
  Phone,
  Mail,
  IndianRupee,
  BedDouble,
  CheckCircle2,
  Users,
  AlertCircle
} from 'lucide-react';
import { Card, CardHeader, CardBody } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { useAdminData } from '../../../context/AdminDataContext';

export function HotelDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hotels } = useAdminData();

  const hotel = hotels.find((h) => h.id === id);

  if (!hotel) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', backgroundColor: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
        <AlertCircle size={48} style={{ color: '#ef4444', margin: '0 auto 1rem' }} />
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>Hotel Not Found</h2>
        <p style={{ color: '#64748b', margin: '0.5rem 0 1.5rem' }}>No hotel partner record matches ID: {id}</p>
        <Button variant="primary" onClick={() => navigate('/admin/hotels')} style={{ backgroundColor: '#2C3480' }}>
          Back to Hotels Directory
        </Button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: '1200px', margin: '0 auto' }}>
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Button variant="outline" size="sm" onClick={() => navigate('/admin/hotels')}>
            <ArrowLeft size={16} style={{ marginRight: '0.25rem' }} /> Back
          </Button>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <h1 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                {hotel.name}
              </h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', color: '#d97706', fontWeight: 700, fontSize: '0.85rem' }}>
                <Star size={14} fill="#f59e0b" /> {hotel.starRating} Star
              </div>
              <StatusBadge status={hotel.status} />
            </div>
            <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0.25rem 0 0' }}>
              Code: {hotel.hotelCode} &bull; Destination: {hotel.destination} &bull; Tier: {hotel.partnerDiscount}
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate(`/admin/hotels/${hotel.id}/edit`)}
        >
          <Edit size={15} style={{ marginRight: '0.35rem' }} /> Edit Hotel Details
        </Button>
      </div>

      {/* Hero Banner & Image */}
      <div
        style={{
          height: '240px',
          borderRadius: '16px',
          overflow: 'hidden',
          position: 'relative',
          backgroundColor: '#1e293b'
        }}
      >
        <img
          src={hotel.image}
          alt={hotel.name}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          onError={(e) => {
            e.target.style.display = 'none';
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            padding: '1.25rem 1.5rem',
            background: 'linear-gradient(to top, rgba(15, 23, 42, 0.9), transparent)',
            color: '#fff',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end'
          }}
        >
          <div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{hotel.name}</div>
            <div style={{ fontSize: '0.85rem', color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <MapPin size={14} /> {hotel.address}
            </div>
          </div>
          <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)', backdropFilter: 'blur(8px)', padding: '0.5rem 1rem', borderRadius: '8px' }}>
            <span style={{ fontSize: '0.75rem', display: 'block', color: '#cbd5e1' }}>Contracted Discount</span>
            <span style={{ fontSize: '1rem', fontWeight: 800, color: '#fff' }}>{hotel.partnerDiscount}</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.25rem', alignItems: 'start' }}>
        {/* Left Column: Room Inventory & Rates */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <Card>
            <CardHeader
              title="Contracted Room Inventory & Nightly Tariffs"
              subtitle="Wholesale negotiated pricing applicable for Tour Packages"
            />
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: '#f8fafc', color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                    <th style={{ padding: '0.75rem 1rem' }}>Room Category</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Max Occupancy</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Allotted Rooms</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Base Rate (INR)</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Tax (GST)</th>
                  </tr>
                </thead>
                <tbody>
                  {hotel.roomCategories && hotel.roomCategories.map((room, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <BedDouble size={16} style={{ color: '#2C3480' }} />
                          <span style={{ fontWeight: 600, color: '#0f172a' }}>{room.name}</span>
                        </div>
                      </td>
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                        {room.maxOccupancy} Guests
                      </td>
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'center', fontWeight: 700, color: '#16a34a' }}>
                        {room.availableRooms} Units
                      </td>
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>
                        ₹{room.baseRate.toLocaleString('en-IN')}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'right', color: '#64748b' }}>
                        {room.taxPercent}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Amenities & Property Highlights */}
          <Card>
            <CardHeader title="Guest Amenities & Inclusions" subtitle="Services available for travelers" />
            <CardBody>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.75rem' }}>
                {hotel.amenities && hotel.amenities.map((amenity, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.6rem 0.85rem',
                      borderRadius: '8px',
                      backgroundColor: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      fontSize: '0.85rem',
                      color: '#334155'
                    }}
                  >
                    <CheckCircle2 size={16} style={{ color: '#16a34a' }} />
                    {amenity}
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Right Column: Contact & Stats */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <Card>
            <CardHeader title="Reservations Desk" subtitle="Front office & duty manager" />
            <CardBody style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>Duty Manager</span>
                <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#0f172a' }}>{hotel.contactPerson}</span>
              </div>

              <div>
                <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>Reservations Telephone</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.875rem', fontWeight: 600, color: '#2C3480' }}>
                  <Phone size={14} /> {hotel.phone}
                </div>
              </div>

              <div>
                <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>Reservations Email</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', color: '#475569' }}>
                  <Mail size={14} /> {hotel.email}
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Historical Performance" subtitle="MAK Tours client volume" />
            <CardBody style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.75rem', borderBottom: '1px solid #f1f5f9' }}>
                <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Active Guest Stays</span>
                <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#2C3480' }}>{hotel.activeBookingsCount} Rooms</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Lifetime Guests Hosted</span>
                <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#16a34a' }}>{hotel.totalGuestsHosted.toLocaleString('en-IN')}</span>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default HotelDetails;
