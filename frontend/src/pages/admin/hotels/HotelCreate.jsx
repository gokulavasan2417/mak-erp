// MAK Tours & Travels ERP - Add Partner Hotel
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Plus, Trash2, BedDouble } from 'lucide-react';
import { Card, CardHeader, CardBody } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { useAdminData } from '../../../context/AdminDataContext';

export function HotelCreate() {
  const navigate = useNavigate();
  const { addHotel } = useAdminData();

  const [name, setName] = useState('');
  const [destination, setDestination] = useState('');
  const [city, setCity] = useState('Ooty');
  const [starRating, setStarRating] = useState(4);
  const [address, setAddress] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('+91 ');
  const [email, setEmail] = useState('');
  const [partnerDiscount, setPartnerDiscount] = useState('15% Wholesale Contract');
  const [image, setImage] = useState('https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80');

  // Dynamic Room Categories
  const [roomCategories, setRoomCategories] = useState([
    { name: 'Deluxe Room', baseRate: 4500, taxPercent: 12, maxOccupancy: 3, availableRooms: 10 }
  ]);

  const [amenitiesInput, setAmenitiesInput] = useState('Free WiFi, Complimentary Breakfast, Swimming Pool, Parking');

  const addRoomRow = () => {
    setRoomCategories((prev) => [
      ...prev,
      { name: 'Executive Suite', baseRate: 7000, taxPercent: 12, maxOccupancy: 4, availableRooms: 5 }
    ]);
  };

  const removeRoomRow = (index) => {
    setRoomCategories((prev) => prev.filter((_, idx) => idx !== index));
  };

  const updateRoomRow = (index, field, value) => {
    setRoomCategories((prev) =>
      prev.map((r, idx) => (idx === index ? { ...r, [field]: value } : r))
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const amenities = amenitiesInput.split(',').map((a) => a.trim()).filter(Boolean);

    const created = addHotel({
      name,
      destination: destination || `${city}, South India`,
      city,
      starRating: Number(starRating),
      address,
      contactPerson,
      phone,
      email,
      partnerDiscount,
      image,
      amenities,
      roomCategories: roomCategories.map((r) => ({
        ...r,
        baseRate: Number(r.baseRate),
        taxPercent: Number(r.taxPercent),
        maxOccupancy: Number(r.maxOccupancy),
        availableRooms: Number(r.availableRooms)
      }))
    });

    navigate(`/admin/hotels/${created.id}`);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: '1000px', margin: '0 auto' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: '#ffffff',
          padding: '1.25rem 1.5rem',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Button variant="outline" size="sm" onClick={() => navigate('/admin/hotels')}>
            <ArrowLeft size={16} style={{ marginRight: '0.25rem' }} /> Cancel
          </Button>
          <div>
            <h1 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
              Add Partner Hotel / Resort
            </h1>
            <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0.25rem 0 0' }}>
              Contract a new hospitality partner for tour packages & holiday packages
            </p>
          </div>
        </div>

        <Button
          type="submit"
          form="create-hotel-form"
          variant="primary"
          style={{ backgroundColor: '#2C3480', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <Save size={16} /> Save Hotel Partner
        </Button>
      </div>

      <form id="create-hotel-form" onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
          {/* Property Identity */}
          <Card>
            <CardHeader title="Property Details" subtitle="Hotel name, star rating & location" />
            <CardBody style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                  Hotel / Resort Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sterling Ooty Fern Hill"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.625rem 0.875rem',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.875rem'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                    Destination City *
                  </label>
                  <select
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.625rem 0.875rem',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.875rem',
                      backgroundColor: '#fff'
                    }}
                  >
                    <option value="Tirupati">Tirupati</option>
                    <option value="Ooty">Ooty</option>
                    <option value="Coorg">Coorg</option>
                    <option value="Kodaikanal">Kodaikanal</option>
                    <option value="Munnar">Munnar</option>
                    <option value="Mysuru">Mysuru</option>
                    <option value="Madurai">Madurai</option>
                    <option value="Rameshwaram">Rameshwaram</option>
                    <option value="Wayanad">Wayanad</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                    Star Category *
                  </label>
                  <select
                    value={starRating}
                    onChange={(e) => setStarRating(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.625rem 0.875rem',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.875rem',
                      backgroundColor: '#fff'
                    }}
                  >
                    <option value={5}>5 Star Luxury</option>
                    <option value={4}>4 Star Premium</option>
                    <option value={3}>3 Star Comfort</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                  Destination Circuit Description
                </label>
                <input
                  type="text"
                  placeholder="e.g. Ooty, Nilgiris, Tamil Nadu"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.625rem 0.875rem',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.875rem'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                  Full Street Address
                </label>
                <textarea
                  rows={2}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.625rem 0.875rem',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.875rem',
                    fontFamily: 'inherit'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                  Banner Photo URL
                </label>
                <input
                  type="url"
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.625rem 0.875rem',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.875rem'
                  }}
                />
              </div>
            </CardBody>
          </Card>

          {/* Contact & Contract Tier */}
          <Card>
            <CardHeader title="Reservations & Contract Terms" subtitle="Front office contacts & SLA discount" />
            <CardBody style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                  Duty / General Manager *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Varma"
                  value={contactPerson}
                  onChange={(e) => setContactPerson(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.625rem 0.875rem',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.875rem'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                    Telephone *
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.625rem 0.875rem',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.875rem'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                    Reservations Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.625rem 0.875rem',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.875rem'
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                  Contracted Partner Discount Tier
                </label>
                <input
                  type="text"
                  value={partnerDiscount}
                  onChange={(e) => setPartnerDiscount(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.625rem 0.875rem',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.875rem'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                  Amenities (comma-separated)
                </label>
                <textarea
                  rows={2}
                  value={amenitiesInput}
                  onChange={(e) => setAmenitiesInput(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.625rem 0.875rem',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.875rem',
                    fontFamily: 'inherit'
                  }}
                />
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Room Inventory Section */}
        <div style={{ marginTop: '1.25rem' }}>
          <Card>
            <CardHeader
              title="Contracted Room Tariffs & Allotments"
              subtitle="Add room categories with negotiated wholesale pricing"
              action={
                <Button type="button" variant="outline" size="sm" onClick={addRoomRow}>
                  <Plus size={14} style={{ marginRight: '0.25rem' }} /> Add Room Category
                </Button>
              }
            />
            <CardBody style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {roomCategories.map((room, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr auto',
                    gap: '0.75rem',
                    alignItems: 'center',
                    padding: '0.75rem',
                    backgroundColor: '#f8fafc',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0'
                  }}
                >
                  <div>
                    <label style={{ display: 'block', fontSize: '0.7rem', color: '#64748b' }}>Category Name</label>
                    <input
                      type="text"
                      required
                      value={room.name}
                      onChange={(e) => updateRoomRow(idx, 'name', e.target.value)}
                      style={{ width: '100%', padding: '0.45rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.7rem', color: '#64748b' }}>Base Rate (₹)</label>
                    <input
                      type="number"
                      min="500"
                      required
                      value={room.baseRate}
                      onChange={(e) => updateRoomRow(idx, 'baseRate', e.target.value)}
                      style={{ width: '100%', padding: '0.45rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.7rem', color: '#64748b' }}>GST %</label>
                    <input
                      type="number"
                      value={room.taxPercent}
                      onChange={(e) => updateRoomRow(idx, 'taxPercent', e.target.value)}
                      style={{ width: '100%', padding: '0.45rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.7rem', color: '#64748b' }}>Max Guests</label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={room.maxOccupancy}
                      onChange={(e) => updateRoomRow(idx, 'maxOccupancy', e.target.value)}
                      style={{ width: '100%', padding: '0.45rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.7rem', color: '#64748b' }}>Rooms Held</label>
                    <input
                      type="number"
                      min="1"
                      value={room.availableRooms}
                      onChange={(e) => updateRoomRow(idx, 'availableRooms', e.target.value)}
                      style={{ width: '100%', padding: '0.45rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.7rem', color: 'transparent' }}>Action</label>
                    <button
                      type="button"
                      disabled={roomCategories.length <= 1}
                      onClick={() => removeRoomRow(idx)}
                      style={{
                        padding: '0.45rem',
                        backgroundColor: '#fef2f2',
                        color: '#ef4444',
                        border: '1px solid #fecaca',
                        borderRadius: '6px',
                        cursor: roomCategories.length > 1 ? 'pointer' : 'not-allowed',
                        opacity: roomCategories.length > 1 ? 1 : 0.4
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </CardBody>
          </Card>
        </div>
      </form>
    </div>
  );
}

export default HotelCreate;
