// MAK Tours & Travels ERP - Driver Trips List
// CRITICAL: ONE WAY TRIP MUST NOT EXIST ANYWHERE IN THIS APPLICATION.
// Strictly allowed journey categories: Round Trip, Local Trip, Tour Package, Airport Transfer, Custom Journey.
import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import {
  Compass,
  Search,
  Filter,
  Calendar,
  Clock,
  MapPin,
  Car,
  User,
  Phone,
  ArrowRight,
  Eye,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { Breadcrumbs } from '../../../components/common/Breadcrumbs';
import { Card, CardHeader, CardBody } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Input } from '../../../components/ui/Input';
import { useDriverData } from '../../../context/DriverDataContext';
import { formatDateDMY } from '../../../utils/dateUtils';

export function DriverTrips() {
  const navigate = useNavigate();
  const location = useLocation();
  const { trips } = useDriverData();

  // Determine initial filter based on route pathname or search params
  const getInitialTab = () => {
    const params = new URLSearchParams(location.search);
    const filterParam = params.get('tab') || params.get('filter') || params.get('status');
    if (filterParam) {
      const p = filterParam.toLowerCase();
      if (p === 'today') return 'Today';
      if (p === 'upcoming') return 'Upcoming';
      if (p === 'active') return 'Active';
      if (p === 'completed') return 'Completed';
      if (p === 'all') return 'All';
    }
    if (location.pathname.includes('/upcoming')) return 'Upcoming';
    if (location.pathname.includes('/active')) return 'Active';
    if (location.pathname.includes('/completed')) return 'Completed';
    if (location.pathname.includes('/today')) return 'Today';
    return 'All';
  };

  const [activeTab, setActiveTab] = useState(getInitialTab());

  // Sync activeTab whenever route pathname or search params change
  useEffect(() => {
    setActiveTab(getInitialTab());
  }, [location.pathname, location.search]);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [viewMode, setViewMode] = useState('cards');

  // Categories (Strictly NO One Way Trip)
  const categories = [
    'All',
    'Round Trip',
    'Local Trip',
    'Tour Package',
    'Airport Transfer',
    'Custom Journey'
  ];

  const safeTrips = Array.isArray(trips) ? trips : [];

  const filteredTrips = safeTrips.filter((t) => {
    // Auto-normalize any legacy One Way classification to Round Trip
    if (t.tripCategory?.toLowerCase().includes('one way')) {
      t.tripCategory = 'Round Trip';
    }

    // Filter by tab
    const todayStr = new Date().toISOString().substring(0, 10);
    let matchesTab = true;
    if (activeTab === 'Today') {
      matchesTab = t.pickupDate === todayStr;
    } else if (activeTab === 'Active') {
      matchesTab = t.status === 'Trip Started' || t.status === 'Arrived at Pickup';
    } else if (activeTab === 'Upcoming') {
      matchesTab = t.status === 'Accepted' || t.status === 'Assigned';
    } else if (activeTab === 'Completed') {
      matchesTab = t.status === 'Trip Completed';
    } else if (activeTab === 'Cancelled') {
      matchesTab = t.status === 'Cancelled';
    }

    // Filter by category
    const matchesCategory =
      selectedCategory === 'All' || t.tripCategory === selectedCategory;

    // Filter by search
    const matchesSearch =
      (t.bookingNumber || t.bookingId || t.id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.customerName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.pickupLocation || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.dropLocation || t.destination || '').toLowerCase().includes(searchTerm.toLowerCase());

    return matchesTab && matchesCategory && matchesSearch;
  });

  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case 'Trip Started':
        return 'primary';
      case 'Arrived at Pickup':
        return 'warning';
      case 'Accepted':
        return 'info';
      case 'Trip Completed':
        return 'success';
      case 'Assigned':
        return 'warning';
      default:
        return 'default';
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
        <div>
          <Breadcrumbs portal="driver" />
          <h1 style={{ fontSize: '1.625rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.25rem' }}>
            My Assigned Trips & Manifests
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Confirmed tour itineraries, passenger pickup coordinates, and duty allowances.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Button
            variant="secondary"
            size="md"
            onClick={() => navigate('/driver/trips/assignments')}
          >
            View New Assignments
          </Button>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <Card>
        <CardBody style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
            {/* Tab buttons */}
            <div style={{ display: 'flex', border: '1px solid var(--border-light)', borderRadius: '8px', overflow: 'hidden' }}>
              {['All', 'Today', 'Active', 'Upcoming', 'Completed'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{
                    padding: '0.45rem 1rem',
                    fontSize: '0.8125rem',
                    fontWeight: 700,
                    border: 'none',
                    backgroundColor: activeTab === tab ? '#2C3480' : 'var(--bg-surface)',
                    color: activeTab === tab ? '#ffffff' : 'var(--text-muted)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* View Mode Toggle */}
            <div style={{ display: 'flex', border: '1px solid var(--border-light)', borderRadius: '6px', overflow: 'hidden' }}>
              <button
                onClick={() => setViewMode('cards')}
                style={{
                  padding: '0.35rem 0.75rem',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  border: 'none',
                  backgroundColor: viewMode === 'cards' ? '#f1f5f9' : 'transparent',
                  color: 'var(--text-main)',
                  cursor: 'pointer'
                }}
              >
                Cards View
              </button>
              <button
                onClick={() => setViewMode('table')}
                style={{
                  padding: '0.35rem 0.75rem',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  border: 'none',
                  backgroundColor: viewMode === 'table' ? '#f1f5f9' : 'transparent',
                  color: 'var(--text-main)',
                  cursor: 'pointer'
                }}
              >
                Table View
              </button>
            </div>
          </div>

          {/* Search & Category Filter Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
            <Input
              placeholder="Search by Booking ID, customer name, route..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              leftIcon={<Search size={15} color="var(--text-muted)" />}
            />

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              style={{
                padding: '0.55rem 0.75rem',
                borderRadius: '8px',
                border: '1px solid var(--border-light)',
                backgroundColor: 'var(--bg-surface)',
                color: 'var(--text-main)',
                fontSize: '0.875rem'
              }}
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  Category: {c}
                </option>
              ))}
            </select>
          </div>
        </CardBody>
      </Card>

      {/* Trips Content */}
      {filteredTrips.length === 0 ? (
        <Card>
          <CardBody style={{ padding: '3.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            No trips found matching the selected filter criteria.
          </CardBody>
        </Card>
      ) : viewMode === 'cards' ? (
        /* Cards View */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.25rem' }}>
          {filteredTrips.map((trip) => (
            <Card
              key={trip.id}
              style={{
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                borderLeft:
                  trip.status === 'Trip Started'
                    ? '4px solid #2C3480'
                    : trip.status === 'Arrived at Pickup'
                    ? '4px solid #f59e0b'
                    : '1px solid var(--border-light)'
              }}
              onClick={() => navigate(`/driver/trips/${trip.id}`)}
            >
              <CardBody style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontFamily: 'monospace', fontWeight: 800, color: '#2C3480', fontSize: '0.9375rem' }}>
                      {trip.bookingId}
                    </span>
                    <Badge variant="info" size="sm">
                      {trip.tripCategory}
                    </Badge>
                  </div>
                  <Badge variant={getStatusBadgeVariant(trip.status)} dot size="sm">
                    {trip.status}
                  </Badge>
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                    <MapPin size={16} color="#2C3480" style={{ marginTop: '2px', flexShrink: 0 }} />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--text-main)' }}>
                        {trip.pickupLocation}
                      </div>
                      <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                        ➔ {trip.dropLocation}
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', backgroundColor: 'var(--bg-surface-hover)', padding: '0.75rem', borderRadius: '8px', fontSize: '0.75rem' }}>
                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block' }}>PICKUP TIME</span>
                    <strong style={{ color: 'var(--text-main)' }}>{formatDateDMY(trip.pickupDate)} at {trip.pickupTime}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block' }}>PASSENGER</span>
                    <strong style={{ color: 'var(--text-main)' }}>{trip.customerName} ({trip.passengerCount} Pax)</strong>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '0.5rem', borderTop: '1px solid var(--border-light)', fontSize: '0.8125rem' }}>
                  <div>
                    <span style={{ color: '#10b981', fontWeight: 700, display: 'block' }}>
                      Allowance: ₹{Number(trip.totalTripEarnings || 1200).toLocaleString('en-IN')}
                    </span>
                    {(trip.nightStayAmount || 0) > 0 && (
                      <span style={{ fontSize: '0.7rem', color: '#15803d', fontWeight: 600, display: 'block' }}>
                        🌙 Incl. ₹{Number(trip.nightStayAmount).toLocaleString('en-IN')} Night Stay
                      </span>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    rightIcon={<ArrowRight size={14} />}
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/driver/trips/${trip.id}`);
                    }}
                  >
                    View Details
                  </Button>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      ) : (
        /* Table View */
        <Card>
          <CardBody style={{ padding: 0 }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--bg-surface-hover)', borderBottom: '1px solid var(--border-light)', textAlign: 'left' }}>
                    <th style={{ padding: '0.75rem 1.25rem', color: 'var(--text-muted)' }}>BOOKING ID</th>
                    <th style={{ padding: '0.75rem 1.25rem', color: 'var(--text-muted)' }}>CATEGORY</th>
                    <th style={{ padding: '0.75rem 1.25rem', color: 'var(--text-muted)' }}>PICKUP DATE & TIME</th>
                    <th style={{ padding: '0.75rem 1.25rem', color: 'var(--text-muted)' }}>ROUTE</th>
                    <th style={{ padding: '0.75rem 1.25rem', color: 'var(--text-muted)' }}>PASSENGER</th>
                    <th style={{ padding: '0.75rem 1.25rem', color: 'var(--text-muted)' }}>ALLOWANCE</th>
                    <th style={{ padding: '0.75rem 1.25rem', color: 'var(--text-muted)' }}>STATUS</th>
                    <th style={{ padding: '0.75rem 1.25rem', textAlign: 'right', color: 'var(--text-muted)' }}>ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTrips.map((trip) => (
                    <tr
                      key={trip.id}
                      onClick={() => navigate(`/driver/trips/${trip.id}`)}
                      style={{ borderBottom: '1px solid var(--border-light)', cursor: 'pointer' }}
                    >
                      <td style={{ padding: '0.875rem 1.25rem', fontFamily: 'monospace', fontWeight: 700, color: '#2C3480' }}>
                        {trip.bookingId}
                      </td>
                      <td style={{ padding: '0.875rem 1.25rem' }}>
                        <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', backgroundColor: '#f1f5f9', borderRadius: '4px', fontWeight: 600 }}>
                          {trip.tripCategory}
                        </span>
                      </td>
                      <td style={{ padding: '0.875rem 1.25rem', fontWeight: 600 }}>
                        {formatDateDMY(trip.pickupDate)} at {trip.pickupTime}
                      </td>
                      <td style={{ padding: '0.875rem 1.25rem' }}>
                        <div style={{ fontWeight: 600 }}>{trip.pickupLocation}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>➔ {trip.dropLocation}</div>
                      </td>
                      <td style={{ padding: '0.875rem 1.25rem' }}>
                        <div>{trip.customerName}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{trip.customerPhone}</div>
                      </td>
                      <td style={{ padding: '0.875rem 1.25rem' }}>
                        <div style={{ fontWeight: 700, color: '#10b981' }}>
                          ₹{Number(trip.totalTripEarnings || 1200).toLocaleString('en-IN')}
                        </div>
                        {(trip.nightStayAmount || 0) > 0 && (
                          <div style={{ fontSize: '0.7rem', color: '#15803d', fontWeight: 600 }}>
                            🌙 +₹{Number(trip.nightStayAmount).toLocaleString('en-IN')} Night
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '0.875rem 1.25rem' }}>
                        <Badge variant={getStatusBadgeVariant(trip.status)} dot size="sm">
                          {trip.status}
                        </Badge>
                      </td>
                      <td style={{ padding: '0.875rem 1.25rem', textAlign: 'right' }}>
                        <Button
                          variant="ghost"
                          size="sm"
                          rightIcon={<ArrowRight size={14} />}
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/driver/trips/${trip.id}`);
                          }}
                        >
                          View
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}

export default DriverTrips;
