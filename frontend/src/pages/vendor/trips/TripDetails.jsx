// MAK Tours & Travels ERP - Vendor Trip Details
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Compass,
  ArrowLeft,
  Calendar,
  Phone,
  Car,
  UserCheck,
  MapPin,
  Clock,
  CheckCircle2,
  Navigation
} from 'lucide-react';
import { Card, CardHeader, CardBody } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { useVendorData } from '../../../context/VendorDataContext';

export function TripDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { trips } = useVendorData();

  const trip = trips.find((t) => t.id === id) || trips[0];

  if (!trip) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center' }}>
        <h2>Trip not found</h2>
        <Button onClick={() => navigate('/vendor/trips')}>Back to Trips</Button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <button
            onClick={() => navigate('/vendor/trips')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              background: 'none',
              border: 'none',
              color: '#64748b',
              fontSize: '0.85rem',
              cursor: 'pointer',
              marginBottom: '0.4rem',
              padding: 0
            }}
          >
            <ArrowLeft size={16} /> Back to Trips Tracker
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
              Live Trip Telematics: {trip.id}
            </h1>
            <StatusBadge status={trip.status} />
          </div>
        </div>

        <Button
          variant="outline"
          onClick={() => navigate(`/vendor/bookings/${trip.bookingId}`)}
        >
          View Linked Booking #{trip.bookingId} →
        </Button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        {/* Left: Journey Coordinates */}
        <Card>
          <CardHeader title="Journey Route & Schedule" subtitle="Itinerary and journey tracking" />
          <CardBody style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ backgroundColor: '#f8fafc', padding: '0.85rem', borderRadius: '10px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem' }}>
              <div><strong>Travel Period:</strong> {trip.startDate} to {trip.endDate}</div>
              <div><strong>Route Category:</strong> {trip.routeCategory}</div>
              <div><strong>Trip Meter Start:</strong> {trip.odometerStart || 0} KM &bull; <strong>Current:</strong> {trip.odometerCurrent || 0} KM</div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10B981', marginTop: '6px' }} />
                <div>
                  <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700 }}>PICKUP POINT</span>
                  <div style={{ fontWeight: 600, color: '#0f172a' }}>{trip.pickupLocation}</div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#EF4444', marginTop: '6px' }} />
                <div>
                  <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700 }}>DESTINATION</span>
                  <div style={{ fontWeight: 600, color: '#0f172a' }}>{trip.destination}</div>
                </div>
              </div>
            </div>

            {trip.notes && (
              <div style={{ backgroundColor: '#EEF0FD', padding: '0.75rem', borderRadius: '8px', border: '1px solid #C7CEFA', fontSize: '0.8rem', color: '#2C3480' }}>
                <strong>Dispatch Note:</strong> {trip.notes}
              </div>
            )}
          </CardBody>
        </Card>

        {/* Right: Assigned Crew */}
        <Card>
          <CardHeader title="Assigned Fleet & Driver" subtitle="Crew contact and telematics unit" />
          <CardBody style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ padding: '0.85rem', borderRadius: '10px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>VEHICLE UNIT</span>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', marginTop: '0.2rem' }}>{trip.vehicleName}</div>
              <span style={{ fontSize: '0.75rem', color: '#16a34a' }}>GPS Online & Active</span>
            </div>

            <div style={{ padding: '0.85rem', borderRadius: '10px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>DRIVER</span>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', marginTop: '0.2rem' }}>{trip.driverName}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.35rem' }}>
                <a
                  href={`tel:${trip.driverPhone}`}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                    padding: '0.35rem 0.75rem',
                    backgroundColor: '#2C3480',
                    color: '#ffffff',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    textDecoration: 'none'
                  }}
                >
                  <Phone size={12} /> {trip.driverPhone}
                </a>
              </div>
            </div>

            <div style={{ padding: '0.85rem', borderRadius: '10px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>PASSENGER CONTACT</span>
              <div style={{ fontWeight: 700, color: '#0f172a', marginTop: '0.2rem' }}>{trip.customerName}</div>
              <span style={{ fontSize: '0.8rem', color: '#475569' }}>{trip.customerPhone}</span>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

export default TripDetails;
