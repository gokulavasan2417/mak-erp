// MAK Tours & Travels ERP - Vendor Booking Manifest Details Page
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Calendar,
  ArrowLeft,
  MapPin,
  Phone,
  Car,
  UserCheck,
  CheckCircle2,
  Clock,
  IndianRupee,
  FileText
} from 'lucide-react';
import { Card, CardHeader, CardBody } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { useVendorData } from '../../../context/VendorDataContext';
import { VendorNavTabs, VENDOR_BOOKING_TABS } from '../../../components/vendor/VendorNavTabs';
import { formatDateDMY } from '../../../utils/dateUtils';

export function BookingDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { bookings } = useVendorData();

  const booking = bookings.find((b) => b.id === id) || bookings[0];

  if (!booking) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center' }}>
        <h2>Booking record not found</h2>
        <Button onClick={() => navigate('/vendor/bookings')}>Back to Bookings</Button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '1000px', margin: '0 auto' }}>
      <VendorNavTabs tabs={VENDOR_BOOKING_TABS} />
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <button
            onClick={() => navigate('/vendor/bookings')}
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
            <ArrowLeft size={16} /> Back to Bookings
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
              Booking Manifest #{booking.id}
            </h1>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, backgroundColor: '#EEF0FD', color: '#2C3480', padding: '0.2rem 0.6rem', borderRadius: '6px' }}>
              {booking.bookingCategory}
            </span>
            <StatusBadge status={booking.bookingStatus} />
          </div>
        </div>

        <Button
          variant="outline"
          onClick={() => navigate('/vendor/bookings')}
        >
          View All Bookings →
        </Button>
      </div>

      {/* Main Details Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        {/* Left Card: Customer & Route */}
        <Card>
          <CardHeader title="Customer & Journey Coordinates" subtitle="Passenger contact and itinerary schedule" />
          <CardBody style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700 }}>CUSTOMER NAME</span>
              <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>{booking.customerName}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#2C3480', fontSize: '0.85rem', marginTop: '0.2rem' }}>
                <Phone size={14} /> {booking.customerPhone}
              </div>
            </div>

            <div style={{ backgroundColor: '#f8fafc', padding: '0.85rem', borderRadius: '10px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Calendar size={14} color="#2C3480" />
                <span>Start Date: <strong>{formatDateDMY(booking.travelDate)}</strong></span>
              </div>
              {booking.travelEndDate && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Calendar size={14} color="#2C3480" />
                  <span>Return Date: <strong>{formatDateDMY(booking.travelEndDate)}</strong></span>
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span>Passenger Count: <strong>{booking.passengerCount} Pax</strong></span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10B981', marginTop: '6px' }} />
                <div>
                  <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700 }}>PICKUP LOCATION</span>
                  <div style={{ fontWeight: 600, color: '#0f172a' }}>{booking.pickupLocation}</div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#EF4444', marginTop: '6px' }} />
                <div>
                  <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700 }}>DESTINATION</span>
                  <div style={{ fontWeight: 600, color: '#0f172a' }}>{booking.dropLocation}</div>
                </div>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Right Card: Financial Settlement */}
        <Card>
          <CardHeader title="Commercial Fare & Payment Settlement" subtitle="B2B breakdown according to 10% platform term" />
          <CardBody style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ backgroundColor: '#EEF0FD', padding: '1rem', borderRadius: '12px', border: '1px solid #C7CEFA' }}>
              <span style={{ fontSize: '0.75rem', color: '#2C3480', fontWeight: 700, textTransform: 'uppercase' }}>
                Total Net Vendor Payable
              </span>
              <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#2C3480' }}>
                ₹{booking.vendorPayable?.toLocaleString('en-IN')}
              </div>
              <span style={{ fontSize: '0.75rem', color: '#475569' }}>
                Payment Status: <strong>{booking.paymentStatus}</strong>
              </span>
            </div>

            {/* Breakdown Table */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px solid #f1f5f9' }}>
                <span style={{ color: '#64748b' }}>Client Total Booking Fare:</span>
                <span style={{ fontWeight: 700 }}>₹{booking.bookingAmount?.toLocaleString('en-IN')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px solid #f1f5f9' }}>
                <span style={{ color: '#64748b' }}>Admin Platform Commission (10%):</span>
                <span style={{ fontWeight: 700, color: '#dc2626' }}>- ₹{booking.adminCommission?.toLocaleString('en-IN')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px solid #f1f5f9' }}>
                <span style={{ color: '#64748b' }}>Amount Disbursed / Paid:</span>
                <span style={{ fontWeight: 700, color: '#16a34a' }}>₹{booking.paidAmount?.toLocaleString('en-IN')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0' }}>
                <span style={{ color: '#64748b', fontWeight: 700 }}>Outstanding Balance Due:</span>
                <span style={{ fontWeight: 800, color: booking.remainingAmount > 0 ? '#d97706' : '#16a34a' }}>
                  ₹{booking.remainingAmount?.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {/* Assigned vehicle & central driver box */}
            <div style={{ backgroundColor: '#f8fafc', padding: '0.85rem', borderRadius: '10px', border: '1px solid #e2e8f0', marginTop: 'auto' }}>
              <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700 }}>DISPATCH FLEET ALLOCATION</div>
              <div style={{ fontWeight: 700, color: '#0f172a', marginTop: '0.2rem' }}>{booking.vehicleName}</div>
              <div style={{ fontSize: '0.8rem', color: '#2C3480', fontWeight: 600, marginTop: '0.2rem' }}>
                Driver: {booking.driverName || 'Dispatched by MAK Admin'}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.15rem' }}>
                (Driver assigned centrally by MAK Admin Operations Desk)
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

export default BookingDetails;
