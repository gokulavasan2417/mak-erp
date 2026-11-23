// MAK Tours & Travels ERP - Vendor Confirmed & Historical Bookings List
// CRITICAL: ONE WAY TRIP MUST NOT EXIST ANYWHERE IN THIS APPLICATION.
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  Search,
  Filter,
  Eye,
  Phone,
  Car,
  UserCheck,
  MapPin,
  Clock,
  ArrowRight,
  LayoutGrid,
  List,
  IndianRupee,
  CheckCircle2
} from 'lucide-react';
import { Card, CardHeader, CardBody } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { useVendorData } from '../../../context/VendorDataContext';
import { vendorBookingCategories, vendorBookingStatuses } from '../../../data/vendorPortalData';
import { VendorNavTabs, VENDOR_BOOKING_TABS } from '../../../components/vendor/VendorNavTabs';
import { formatDateDMY } from '../../../utils/dateUtils';

export function BookingList() {
  const navigate = useNavigate();
  const { bookings } = useVendorData();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [viewMode, setViewMode] = useState('grid');

  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      // Auto-normalize any legacy One Way classification to Round Trip
      if (b.bookingCategory?.toLowerCase().includes('one way') || b.bookingType?.toLowerCase().includes('one way')) {
        b.bookingCategory = 'Round Trip';
        b.bookingType = 'Round Trip';
      }

      const matchSearch =
        searchTerm === '' ||
        b.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.pickupLocation.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.dropLocation.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (b.vehicleName && b.vehicleName.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchCat =
        selectedCategory === 'All' || b.bookingCategory === selectedCategory;
      const matchStat =
        selectedStatus === 'All' || b.bookingStatus === selectedStatus;

      return matchSearch && matchCat && matchStat;
    });
  }, [bookings, searchTerm, selectedCategory, selectedStatus]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <VendorNavTabs tabs={VENDOR_BOOKING_TABS} />
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
            <Calendar size={18} color="#2C3480" />
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#2C3480', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Vendor Assigned Bookings
            </span>
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
            Vehicle Bookings Ledger
          </h1>
          <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0.25rem 0 0' }}>
            Complete manifest of assigned vehicle bookings, outstation hires and corporate rentals
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ display: 'flex', border: '1px solid #cbd5e1', borderRadius: '8px', overflow: 'hidden' }}>
            <button
              onClick={() => setViewMode('grid')}
              style={{
                padding: '0.45rem 0.75rem',
                border: 'none',
                backgroundColor: viewMode === 'grid' ? '#2C3480' : '#ffffff',
                color: viewMode === 'grid' ? '#ffffff' : '#64748b',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                fontSize: '0.8125rem',
                fontWeight: 600
              }}
            >
              <LayoutGrid size={15} /> Cards
            </button>
            <button
              onClick={() => setViewMode('table')}
              style={{
                padding: '0.45rem 0.75rem',
                border: 'none',
                backgroundColor: viewMode === 'table' ? '#2C3480' : '#ffffff',
                color: viewMode === 'table' ? '#ffffff' : '#64748b',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                fontSize: '0.8125rem',
                fontWeight: 600
              }}
            >
              <List size={15} /> Table
            </button>
          </div>

          <Button
            variant="primary"
            style={{ backgroundColor: '#2C3480' }}
            onClick={() => navigate('/vendor/booking-requests')}
          >
            Booking Requests
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <Card style={{ padding: '1rem 1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ position: 'relative', minWidth: '280px', flex: 1 }}>
            <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input
              type="text"
              placeholder="Search by ID, customer name, route or vehicle..."
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

          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              style={{
                padding: '0.55rem 0.85rem',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '0.875rem',
                backgroundColor: '#fff'
              }}
            >
              <option value="All">All Categories</option>
              {vendorBookingCategories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              style={{
                padding: '0.55rem 0.85rem',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '0.875rem',
                backgroundColor: '#fff'
              }}
            >
              {vendorBookingStatuses.map((s) => (
                <option key={s} value={s}>{s === 'All' ? 'All Statuses' : s}</option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Bookings Presentation */}
      {viewMode === 'grid' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.25rem' }}>
          {filteredBookings.length === 0 ? (
            <div style={{ gridColumn: '1 / -1', padding: '3.5rem 2rem', textAlign: 'center', backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
              <Calendar size={44} style={{ color: '#cbd5e1', margin: '0 auto 0.75rem' }} />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e293b', margin: '0 0 0.25rem' }}>No travel bookings found</h3>
              <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>Try clearing your search query or adjusting your filters.</p>
            </div>
          ) : (
            filteredBookings.map((b) => (
              <div
                key={b.id}
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '16px',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.04)',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'transform 0.2s, box-shadow 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 14px rgba(0,0,0,0.08)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'none';
                  e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.04)';
                }}
              >
                {/* Top strip */}
                <div style={{ padding: '0.875rem 1.25rem', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fafbfc' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        backgroundColor: '#EEF0FD',
                        color: '#2C3480',
                        padding: '0.2rem 0.55rem',
                        borderRadius: '6px'
                      }}
                    >
                      {b.bookingCategory}
                    </span>
                    <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#0f172a' }}>
                      #{b.id}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <StatusBadge status={b.bookingStatus} />
                  </div>
                </div>

                {/* Card Body */}
                <div style={{ padding: '1.25rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem' }}>
                    <div>
                      <h3
                        onClick={() => navigate(`/vendor/bookings/${b.id}`)}
                        style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', margin: 0, cursor: 'pointer' }}
                      >
                        {b.customerName}
                      </h3>
                      <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.15rem' }}>
                        {b.customerPhone} &bull; {b.passengerCount} Passengers
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', color: '#2C3480', fontWeight: 700 }}>
                        <Calendar size={13} /> {formatDateDMY(b.travelDate)}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '0.1rem' }}>
                        {b.travelEndDate ? `Ret: ${formatDateDMY(b.travelEndDate)}` : 'One Day'}
                      </div>
                    </div>
                  </div>

                  {/* Route Box */}
                  <div style={{ backgroundColor: '#f8fafc', padding: '0.75rem 0.85rem', borderRadius: '10px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '0.45rem', fontSize: '0.8rem' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10B981', marginTop: '5px', flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <span style={{ fontSize: '0.65rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, display: 'block' }}>Pickup</span>
                        <span style={{ color: '#1e293b', fontWeight: 600 }}>{b.pickupLocation}</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#EF4444', marginTop: '5px', flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <span style={{ fontSize: '0.65rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, display: 'block' }}>Destination</span>
                        <span style={{ color: '#1e293b', fontWeight: 600 }}>{b.dropLocation}</span>
                      </div>
                    </div>
                  </div>

                  {/* Assigned Fleet & Driver */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                    <div style={{ padding: '0.5rem 0.6rem', borderRadius: '8px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', fontSize: '0.75rem' }}>
                      <span style={{ fontSize: '0.65rem', color: '#64748b', display: 'block', fontWeight: 700 }}>FLEET UNIT</span>
                      <strong style={{ color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }}>
                        {b.vehicleName}
                      </strong>
                    </div>

                    <div style={{ padding: '0.5rem 0.6rem', borderRadius: '8px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', fontSize: '0.75rem' }}>
                      <span style={{ fontSize: '0.65rem', color: '#64748b', display: 'block', fontWeight: 700 }}>DRIVER</span>
                      <strong style={{ color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }}>
                        {b.driverName}
                      </strong>
                    </div>
                  </div>

                  {/* Financial Footer */}
                  <div style={{ marginTop: 'auto', paddingTop: '0.875rem', borderTop: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <span style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', display: 'block' }}>
                        Vendor Payable
                      </span>
                      <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
                        ₹{b.vendorPayable?.toLocaleString('en-IN')}
                      </div>
                      <span style={{ fontSize: '0.7rem', color: b.remainingAmount > 0 ? '#d97706' : '#16a34a', fontWeight: 600 }}>
                        {b.remainingAmount > 0 ? `Dues: ₹${b.remainingAmount.toLocaleString('en-IN')}` : 'Fully Settled ✓'}
                      </span>
                    </div>

                    <Button
                      variant="primary"
                      size="sm"
                      style={{ backgroundColor: '#2C3480', fontWeight: 700 }}
                      onClick={() => navigate(`/vendor/bookings/${b.id}`)}
                    >
                      Manifest Details <ArrowRight size={14} style={{ marginLeft: '0.25rem' }} />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        /* Table View */
        <Card>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                  <th style={{ padding: '0.875rem 1rem' }}>Booking #</th>
                  <th style={{ padding: '0.875rem 1rem' }}>Customer</th>
                  <th style={{ padding: '0.875rem 1rem' }}>Category</th>
                  <th style={{ padding: '0.875rem 1rem' }}>Travel Date</th>
                  <th style={{ padding: '0.875rem 1rem' }}>Vehicle & Driver</th>
                  <th style={{ padding: '0.875rem 1rem' }}>Net Payable</th>
                  <th style={{ padding: '0.875rem 1rem' }}>Status</th>
                  <th style={{ padding: '0.875rem 1rem', textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredBookings.map((b) => (
                  <tr key={b.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '0.875rem 1rem', fontWeight: 800, color: '#2C3480' }}>
                      #{b.id}
                    </td>
                    <td style={{ padding: '0.875rem 1rem' }}>
                      <div style={{ fontWeight: 600, color: '#0f172a' }}>{b.customerName}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{b.customerPhone}</div>
                    </td>
                    <td style={{ padding: '0.875rem 1rem' }}>
                      <span style={{ backgroundColor: '#EEF0FD', color: '#2C3480', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>
                        {b.bookingCategory}
                      </span>
                    </td>
                    <td style={{ padding: '0.875rem 1rem' }}>
                      <div style={{ fontWeight: 600 }}>{formatDateDMY(b.travelDate)}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{b.dropLocation.split(',')[0]}</div>
                    </td>
                    <td style={{ padding: '0.875rem 1rem' }}>
                      <div style={{ fontWeight: 600 }}>{b.vehicleName}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{b.driverName}</div>
                    </td>
                    <td style={{ padding: '0.875rem 1rem', fontWeight: 800, color: '#0f172a' }}>
                      ₹{b.vendorPayable?.toLocaleString('en-IN')}
                    </td>
                    <td style={{ padding: '0.875rem 1rem' }}>
                      <StatusBadge status={b.bookingStatus} />
                    </td>
                    <td style={{ padding: '0.875rem 1rem', textAlign: 'right' }}>
                      <Button size="sm" variant="outline" onClick={() => navigate(`/vendor/bookings/${b.id}`)}>
                        <Eye size={14} style={{ marginRight: '0.25rem' }} /> View
                      </Button>
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

export default BookingList;
