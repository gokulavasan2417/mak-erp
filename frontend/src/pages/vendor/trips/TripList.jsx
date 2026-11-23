// MAK Tours & Travels ERP - Vendor Active & Historical Trips
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Compass,
  Calendar,
  Car,
  UserCheck,
  MapPin,
  Clock,
  ArrowRight,
  Eye,
  CheckCircle2,
  Navigation
} from 'lucide-react';
import { Card, CardHeader, CardBody } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { useVendorData } from '../../../context/VendorDataContext';

export function TripList() {
  const navigate = useNavigate();
  const { trips } = useVendorData();

  const [statusFilter, setStatusFilter] = useState('All');

  const filteredTrips = trips.filter((t) =>
    statusFilter === 'All' ? true : t.status === statusFilter
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Header */}
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
          border: '1px solid #e2e8f0'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <Compass size={18} color="#2C3480" />
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#2C3480', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Telematics & Dispatches
            </span>
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
            Trip Dispatch & Tracking
          </h1>
          <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0.25rem 0 0' }}>
            Monitor active outstation tours, upcoming departure manifests and completed passenger journeys
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Button
            variant="outline"
            onClick={() => navigate('/vendor/bookings')}
          >
            All Bookings Manifest
          </Button>
          <Button
            variant="primary"
            style={{ backgroundColor: '#2C3480' }}
            onClick={() => navigate('/vendor/booking-requests')}
          >
            Pending Requests
          </Button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem', overflowX: 'auto' }}>
        {['All', 'In Progress', 'Upcoming', 'Completed'].map((tab) => (
          <button
            key={tab}
            onClick={() => setStatusFilter(tab)}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: statusFilter === tab ? '#2C3480' : '#f1f5f9',
              color: statusFilter === tab ? '#ffffff' : '#64748b',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer'
            }}
          >
            {tab} {tab === 'All' ? `(${trips.length})` : ''}
          </button>
        ))}
      </div>

      {/* Trips Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.25rem' }}>
        {filteredTrips.map((trp) => (
          <div
            key={trp.id}
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 2px 4px rgba(0,0,0,0.04)',
              padding: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.875rem'
            }}
          >
            {/* Top row */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#2C3480', fontFamily: 'monospace' }}>
                  {trp.id}
                </span>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                  Ref: #{trp.bookingId}
                </span>
              </div>
              <StatusBadge status={trp.status} />
            </div>

            {/* Customer & Route */}
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.15rem' }}>
                {trp.customerName}
              </h3>
              <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                Category: <strong>{trp.routeCategory}</strong>
              </div>
            </div>

            {/* Route Box */}
            <div style={{ backgroundColor: '#f8fafc', padding: '0.75rem 0.85rem', borderRadius: '10px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '0.45rem', fontSize: '0.8rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#1e293b', fontWeight: 700 }}>
                <Calendar size={13} color="#2C3480" /> {trp.startDate} to {trp.endDate}
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.45rem', marginTop: '0.15rem' }}>
                <MapPin size={14} color="#10B981" style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>{trp.pickupLocation}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.45rem' }}>
                <MapPin size={14} color="#EF4444" style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>{trp.destination}</span>
              </div>
            </div>

            {/* Vehicle & Driver */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.75rem' }}>
              <div style={{ backgroundColor: '#f8fafc', padding: '0.5rem', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                <span style={{ color: '#64748b', display: 'block', fontSize: '0.65rem', fontWeight: 700 }}>VEHICLE</span>
                <strong style={{ color: '#0f172a', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{trp.vehicleName}</strong>
              </div>

              <div style={{ backgroundColor: '#f8fafc', padding: '0.5rem', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                <span style={{ color: '#64748b', display: 'block', fontSize: '0.65rem', fontWeight: 700 }}>DRIVER</span>
                <strong style={{ color: '#0f172a', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{trp.driverName}</strong>
              </div>
            </div>

            {/* Journey Meter Tracker */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem', backgroundColor: '#EEF0FD', padding: '0.45rem 0.75rem', borderRadius: '6px' }}>
              <span style={{ color: '#2C3480', fontWeight: 700 }}>Trip Meter Start: {trp.odometerStart || 0} KM</span>
              <span style={{ color: '#16a34a', fontWeight: 800 }}>Current: {trp.odometerCurrent || 0} KM</span>
            </div>

            {/* Action Footer */}
            <div style={{ marginTop: 'auto', paddingTop: '0.5rem', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="primary"
                size="sm"
                style={{ backgroundColor: '#2C3480' }}
                onClick={() => navigate(`/vendor/trips/${trp.id}`)}
              >
                Track Details <ArrowRight size={13} style={{ marginLeft: '0.2rem' }} />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default TripList;
