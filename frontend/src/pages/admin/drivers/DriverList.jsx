// MAK Tours & Travels ERP - Drivers Management Directory (Modern Cards Design)
import React, { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  UserCheck,
  Plus,
  Calendar,
  Phone,
  Star,
  ShieldCheck,
  Eye,
  Edit,
  Clock,
  Car,
  LayoutGrid,
  List,
  ArrowRight,
  Award,
  Download
} from 'lucide-react';
import { Card, CardHeader, CardBody } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { SearchBar, FilterSelect } from '../../../components/ui/SearchBar';
import { useAdminData } from '../../../context/AdminDataContext';
import { driverStatuses } from '../../../data';

export function DriverList() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { drivers, updateDriverStatus, driverApplications = [] } = useAdminData();

  const pendingAppsCount = driverApplications.filter(
    (a) => a.status === 'Pending Verification'
  ).length;

  const activeTab = searchParams.get('tab') || 'directory'; // 'directory' | 'schedules'
  const [viewMode, setViewMode] = useState('grid'); // 'grid' (default modern cards) or 'table'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('All');

  const filteredDrivers = useMemo(() => {
    return (drivers || []).filter((d) => {
      const code = d.driverCode || d.driverBadgeId || d.badgeId || d.id || '';
      const name = d.name || d.fullName || '';
      const phone = d.phone || '';
      const license = d.licenseNumber || d.drivingLicenseNumber || '';

      const matchesSearch =
        name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        phone.toLowerCase().includes(searchQuery.toLowerCase()) ||
        code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        license.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus =
        selectedStatus === 'All' ||
        d.dutyStatus === selectedStatus ||
        d.status === selectedStatus ||
        String(d.dutyStatus || '').toLowerCase() === selectedStatus.toLowerCase() ||
        String(d.status || '').toLowerCase() === selectedStatus.toLowerCase();
      return matchesSearch && matchesStatus;
    });
  }, [drivers, searchQuery, selectedStatus]);

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
            <UserCheck size={18} color="#2C3480" />
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#2C3480', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Certified Driver Roster
            </span>
          </div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
            Driver Operations &amp; Roster
          </h1>
          <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0.25rem 0 0' }}>
            Professional commercial drivers, verified badges, and daily duty schedules.
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
            variant="outline"
            style={{ color: '#b45309', borderColor: '#fde68a', backgroundColor: '#fffbeb', fontWeight: 700 }}
            onClick={() => navigate('/admin/drivers/applications')}
          >
            <ShieldCheck size={16} style={{ marginRight: '0.35rem' }} />
            Applications ({pendingAppsCount} Pending)
          </Button>

          <Button
            variant="primary"
            style={{ backgroundColor: '#2C3480' }}
            onClick={() => navigate('/admin/drivers/new')}
          >
            <Plus size={16} style={{ marginRight: '0.35rem' }} /> Add Driver
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>
        <button
          onClick={() => setSearchParams({ tab: 'directory' })}
          style={{
            padding: '0.6rem 1.2rem',
            fontSize: '0.875rem',
            fontWeight: activeTab === 'directory' ? 700 : 500,
            color: activeTab === 'directory' ? '#ffffff' : '#64748b',
            backgroundColor: activeTab === 'directory' ? '#2C3480' : 'transparent',
            borderRadius: '8px',
            border: 'none',
            cursor: 'pointer'
          }}
        >
          Driver Directory ({drivers.length})
        </button>

        <button
          onClick={() => setSearchParams({ tab: 'schedules' })}
          style={{
            padding: '0.6rem 1.2rem',
            fontSize: '0.875rem',
            fontWeight: activeTab === 'schedules' ? 700 : 500,
            color: activeTab === 'schedules' ? '#ffffff' : '#64748b',
            backgroundColor: activeTab === 'schedules' ? '#2C3480' : 'transparent',
            borderRadius: '8px',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.375rem'
          }}
        >
          <Calendar size={15} /> Driver Duty Schedules
        </button>
      </div>

      {activeTab === 'directory' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <Card>
            <CardBody style={{ padding: '1rem 1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                <SearchBar
                  value={searchQuery}
                  onChange={setSearchQuery}
                  placeholder="Search by driver name, mobile, badge code or license..."
                  width="360px"
                />

                <FilterSelect
                  label="Duty Status"
                  value={selectedStatus}
                  onChange={setSelectedStatus}
                  options={['All', ...driverStatuses]}
                />
              </div>
            </CardBody>
          </Card>

          {/* VIEW MODE 1: MODERN DRIVER CARDS (DEFAULT) */}
          {viewMode === 'grid' ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(330px, 1fr))', gap: '1.25rem', alignItems: 'stretch' }}>
              {filteredDrivers.length === 0 ? (
                <div style={{ gridColumn: '1 / -1', padding: '3rem', textAlign: 'center', backgroundColor: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                  <UserCheck size={40} style={{ color: '#cbd5e1', margin: '0 auto 0.75rem' }} />
                  <p style={{ fontWeight: 600, color: '#334155' }}>No drivers match the selected filter criteria.</p>
                </div>
              ) : (
                filteredDrivers.map((d) => (
                  <div
                    key={d.id}
                    style={{
                      backgroundColor: '#ffffff',
                      borderRadius: '16px',
                      border: '1px solid #e2e8f0',
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
                      e.currentTarget.style.borderColor = '#cbd5e1';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'none';
                      e.currentTarget.style.boxShadow = '0 2px 5px rgba(0,0,0,0.04)';
                      e.currentTarget.style.borderColor = '#e2e8f0';
                    }}
                  >
                    {/* Top Strip */}
                    <div
                      style={{
                        padding: '0.875rem 1.15rem',
                        backgroundColor: '#f8fafc',
                        borderBottom: '1px solid #f1f5f9',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '0.5rem'
                      }}
                    >
                      <span
                        style={{
                          fontSize: '0.725rem',
                          fontWeight: 700,
                          padding: '0.2rem 0.55rem',
                          borderRadius: '6px',
                          backgroundColor: '#eef2ff',
                          color: '#2C3480',
                          border: '1px solid #c7d2fe',
                          fontFamily: 'monospace'
                        }}
                      >
                        #{d.driverCode || d.driverBadgeId || d.badgeId || d.id || 'DRV'}
                      </span>

                      <StatusBadge status={d.status} />
                    </div>

                    {/* Main Body */}
                    <div style={{ padding: '1.25rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
                        <div
                          style={{
                            width: '50px',
                            height: '50px',
                            borderRadius: '14px',
                            backgroundColor: '#2C3480',
                            color: '#ffffff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 800,
                            fontSize: '1.1rem',
                            flexShrink: 0
                          }}
                        >
                          {d.name.substring(0, 2).toUpperCase()}
                        </div>

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <h3
                              onClick={() => navigate(`/admin/drivers/${d.id}`)}
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
                              {d.name}
                            </h3>
                            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#d97706', display: 'flex', alignItems: 'center', gap: '0.15rem' }}>
                              <Star size={13} fill="#f59e0b" color="#f59e0b" /> {d.rating}
                            </span>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', color: '#64748b', marginTop: '0.15rem', fontWeight: 600 }}>
                            <Award size={13} style={{ color: '#2C3480' }} /> {d.experienceYears} Yrs Exp
                          </div>
                        </div>
                      </div>

                      {/* Contact & License Chips */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', backgroundColor: '#f8fafc', padding: '0.75rem', borderRadius: '10px', border: '1px solid #f1f5f9' }}>
                        <a
                          href={`tel:${d.phone}`}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            fontSize: '0.8rem',
                            color: '#1e293b',
                            textDecoration: 'none',
                            fontWeight: 600
                          }}
                        >
                          <Phone size={13} style={{ color: '#2C3480' }} /> {d.phone}
                        </a>
                        <div style={{ fontSize: '0.75rem', color: '#64748b', fontFamily: 'monospace' }}>
                          DL: {d.licenseNumber} (Exp: {d.licenseExpiry})
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: '#475569' }}>
                          <Car size={13} style={{ color: '#2C3480' }} />
                          {d.currentVehicle ? (
                            <span style={{ fontWeight: 600, color: '#0f172a' }}>{d.currentVehicle}</span>
                          ) : (
                            <span style={{ color: '#94a3b8' }}>On Standby at Yard</span>
                          )}
                        </div>
                      </div>

                      {/* Card Bottom: Completed Trips & Cobalt Blue CTA */}
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
                            TRIPS COMPLETED
                          </span>
                          <span style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>
                            {d.tripsCompleted ?? d.totalTripsCompleted ?? 0} Trips
                          </span>
                        </div>

                        <div>
                          <span style={{ fontSize: '0.675rem', color: '#166534', display: 'block', fontWeight: 700 }}>
                            TRIP RATE
                          </span>
                          <span style={{ fontSize: '1.05rem', fontWeight: 800, color: '#15803D' }}>
                            ₹{(d.perTripRate || d.tripRate || d.salaryStructure?.perTripRate || 1500).toLocaleString('en-IN')}
                          </span>
                        </div>

                        <button
                          onClick={() => navigate(`/admin/drivers/${d.id}`)}
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
                          Driver Profile <ArrowRight size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
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
                        <th style={{ padding: '0.875rem 1rem', color: '#334155', fontWeight: 700 }}>Driver Code</th>
                        <th style={{ padding: '0.875rem 1rem', color: '#334155', fontWeight: 700 }}>Driver Name</th>
                        <th style={{ padding: '0.875rem 1rem', color: '#334155', fontWeight: 700 }}>Phone</th>
                        <th style={{ padding: '0.875rem 1rem', color: '#334155', fontWeight: 700 }}>Commercial License</th>
                        <th style={{ padding: '0.875rem 1rem', color: '#334155', fontWeight: 700 }}>Rating</th>
                        <th style={{ padding: '0.875rem 1rem', color: '#166534', fontWeight: 700 }}>Trip Rate (₹)</th>
                        <th style={{ padding: '0.875rem 1rem', color: '#334155', fontWeight: 700 }}>Assigned Vehicle</th>
                        <th style={{ padding: '0.875rem 1rem', color: '#334155', fontWeight: 700 }}>Duty Status</th>
                        <th style={{ padding: '0.875rem 1rem', textAlign: 'right', color: '#334155', fontWeight: 700 }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredDrivers.length === 0 ? (
                        <tr>
                          <td colSpan="9" style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
                            No drivers found matching your criteria.
                          </td>
                        </tr>
                      ) : (
                        filteredDrivers.map((d) => (
                        <tr
                          key={d.id}
                          style={{ borderBottom: '1px solid #e2e8f0', transition: 'background-color 0.15s ease' }}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                        >
                          <td style={{ padding: '0.875rem 1rem', fontWeight: 800, color: '#2C3480' }}>
                            {d.driverCode || d.driverBadgeId || d.badgeId || d.id || 'DRV'}
                          </td>
                          <td style={{ padding: '0.875rem 1rem', fontWeight: 600, color: '#090d16' }}>
                            {d.name}
                          </td>
                          <td style={{ padding: '0.875rem 1rem' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                              <Phone size={13} color="#10B981" /> {d.phone}
                            </span>
                          </td>
                          <td style={{ padding: '0.875rem 1rem', fontFamily: 'monospace', fontSize: '0.75rem' }}>
                            {d.licenseNumber}
                          </td>
                          <td style={{ padding: '0.875rem 1rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontWeight: 700 }}>
                              <Star size={13} fill="#F59E0B" color="#F59E0B" /> {d.rating}
                              <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 400 }}>({d.tripsCompleted ?? d.totalTripsCompleted ?? 0} trips)</span>
                            </div>
                          </td>
                          <td style={{ padding: '0.875rem 1rem', fontWeight: 700, color: '#15803D' }}>
                            ₹{(d.perTripRate || d.tripRate || d.salaryStructure?.perTripRate || 1500).toLocaleString('en-IN')}
                          </td>
                          <td style={{ padding: '0.875rem 1rem' }}>
                            {d.currentVehicle ? (
                              <span style={{ fontWeight: 600, color: '#2C3480', fontSize: '0.75rem' }}>{d.currentVehicle}</span>
                            ) : (
                              <span style={{ color: '#64748b' }}>Standby Yard</span>
                            )}
                          </td>
                          <td style={{ padding: '0.875rem 1rem' }}>
                            <StatusBadge status={d.status} />
                          </td>
                          <td style={{ padding: '0.875rem 1rem', textAlign: 'right' }}>
                            <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                              <button
                                onClick={() => navigate(`/admin/drivers/${d.id}`)}
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
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                    </tbody>
                  </table>
                </div>
              </CardBody>
            </Card>
          )}
        </div>
      ) : (
        /* Driver Schedules Cards View */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
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
                  Duty Dispatch &amp; Schedule Roster
                </span>
              </div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#090d16', margin: 0 }}>
                Daily Driver Duty &amp; Dispatch Schedule ({drivers.length} Drivers)
              </h2>
              <p style={{ fontSize: '0.8125rem', color: '#64748b', margin: '0.25rem 0 0' }}>
                Live assignment coordinates, route manifests, and availability status for today's departures.
              </p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.25rem' }}>
            {drivers.length === 0 ? (
              <div style={{ gridColumn: '1 / -1', padding: '3.5rem 2rem', textAlign: 'center', backgroundColor: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                <UserCheck size={40} style={{ color: '#cbd5e1', margin: '0 auto 0.75rem' }} />
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#1e293b', margin: '0 0 0.25rem' }}>No drivers in roster</h3>
                <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>Add a driver to view the daily duty schedule and dispatch roster.</p>
              </div>
            ) : (
              drivers.map((d) => (
              <div
                key={d.id}
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '14px',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem',
                  padding: '1.25rem'
                }}
              >
                {/* Driver Info Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div
                      style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '50%',
                        backgroundColor: '#EEF0FD',
                        color: '#2C3480',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 800,
                        fontSize: '1rem',
                        flexShrink: 0
                      }}
                    >
                      {d.name.charAt(0)}
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#090d16', margin: 0 }}>
                        {d.name}
                      </h3>
                      <div style={{ fontSize: '0.75rem', color: '#64748b', fontFamily: 'monospace', marginTop: '0.15rem' }}>
                        Badge: {d.driverCode || d.id} &bull; {d.phone || '+91 98401 22345'}
                      </div>
                    </div>
                  </div>

                  <StatusBadge status={d.status} />
                </div>

                {/* Duty Assignment Box */}
                <div style={{ backgroundColor: '#f8fafc', border: '1px solid #f1f5f9', borderRadius: '10px', padding: '0.85rem' }}>
                  <div style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                    Assigned Fleet Unit
                  </div>
                  <div style={{ fontSize: '0.9375rem', fontWeight: 800, color: '#2C3480', marginTop: '0.2rem' }}>
                    {d.currentVehicle || 'Koramangala Standby Depot'}
                  </div>

                  <div style={{ marginTop: '0.6rem', borderTop: '1px solid #e2e8f0', paddingTop: '0.6rem' }}>
                    <div style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>
                      Today's Duty Manifest
                    </div>
                    <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#090d16', marginTop: '0.2rem' }}>
                      {d.scheduleToday || 'Bangalore City Transfers & On-Call Dispatch'}
                    </div>
                  </div>
                </div>

                {/* Footer Availability & Action */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #f1f5f9', paddingTop: '0.75rem', marginTop: 'auto' }}>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    Next Availability: <strong style={{ color: '#090d16' }}>{d.status === 'Available' ? 'Immediate' : 'Post Trip Duty'}</strong>
                  </div>

                  <button
                    type="button"
                    onClick={() => navigate(`/admin/drivers/${d.id}`)}
                    style={{
                      padding: '0.4rem 0.8rem',
                      backgroundColor: '#2C3480',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem'
                    }}
                  >
                    Profile <ArrowRight size={13} />
                  </button>
                </div>
              </div>
            ))
          )}
          </div>
        </div>
      )}
    </div>
  );
}

export default DriverList;
