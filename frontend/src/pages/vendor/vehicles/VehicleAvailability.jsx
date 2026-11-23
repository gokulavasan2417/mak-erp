// MAK Tours & Travels ERP - Vendor Vehicle Availability Calendar
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar as CalendarIcon,
  Car,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  Wrench,
  CheckCircle2,
  Clock,
  ArrowLeft,
  Filter
} from 'lucide-react';
import { Card, CardHeader, CardBody } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Modal } from '../../../components/ui/Modal';
import { useVendorData } from '../../../context/VendorDataContext';
import { VendorNavTabs, VENDOR_VEHICLE_TABS } from '../../../components/vendor/VendorNavTabs';

export function VehicleAvailability() {
  const navigate = useNavigate();
  const { vehicles, bookings, setVehicleMaintenance } = useVendorData();

  // Current view month (November 2026)
  const [currentDate, setCurrentDate] = useState(new Date(2026, 10, 9)); // Nov 9, 2026
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Selected date / vehicle for action modal
  const [actionVehicle, setActionVehicle] = useState(null);
  const [actionDay, setActionDay] = useState(null);
  const [actionStatus, setActionStatus] = useState('Blocked');

  // Days in month calculation
  const daysInMonth = 30; // November has 30 days
  const daysArray = Array.from({ length: 14 }, (_, i) => i + 6); // Focus on Nov 6 to Nov 19

  // Helper to determine vehicle status on a given day in Nov 2026
  const getDayStatus = (vehicle, day) => {
    // If permanently under maintenance
    if (vehicle.status === 'Maintenance') {
      return { status: 'Maintenance', color: '#EF4444', label: 'Maintenance' };
    }

    // Check if on trip or reserved on this day
    const dayStr = `2026-11-${String(day).padStart(2, '0')}`;
    const matchingBooking = bookings.find((b) => {
      if (b.vehicleId !== vehicle.id) return false;
      const start = b.travelDate;
      const end = b.travelEndDate || b.travelDate;
      return dayStr >= start && dayStr <= end;
    });

    if (matchingBooking) {
      if (matchingBooking.bookingStatus === 'On Trip' || matchingBooking.tripStatus === 'In Progress') {
        return { status: 'On Trip', color: '#F59E0B', label: `Trip #${matchingBooking.id}`, booking: matchingBooking };
      }
      return { status: 'Reserved', color: '#2C3480', label: `Reserved #${matchingBooking.id}`, booking: matchingBooking };
    }

    return { status: 'Available', color: '#10B981', label: 'Available' };
  };

  const handleCellClick = (vehicle, day) => {
    const info = getDayStatus(vehicle, day);
    setActionVehicle(vehicle);
    setActionDay(day);
    setActionStatus(info.status);
  };

  const handleApplyStatus = () => {
    if (actionStatus === 'Maintenance') {
      setVehicleMaintenance(actionVehicle.id, true, `Scheduled maintenance for Nov ${actionDay}`);
    } else if (actionStatus === 'Available' && actionVehicle.status === 'Maintenance') {
      setVehicleMaintenance(actionVehicle.id, false);
    }
    setActionVehicle(null);
  };

  const filteredVehicles = vehicles.filter((v) =>
    selectedCategory === 'All' ? true : v.category === selectedCategory
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <VendorNavTabs tabs={VENDOR_VEHICLE_TABS} />
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
          <button
            onClick={() => navigate('/vendor/vehicles')}
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
            <ArrowLeft size={16} /> Back to Vehicles
          </button>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
            Fleet Availability Schedule & Roster
          </h1>
          <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0.25rem 0 0' }}>
            Interactive duty calendar &bull; View active trip assignments, reserved dates and block maintenance periods
          </p>
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', fontWeight: 600 }}>
            <span style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: '#10B981' }} />
            <span>Available</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', fontWeight: 600 }}>
            <span style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: '#2C3480' }} />
            <span>Reserved</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', fontWeight: 600 }}>
            <span style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: '#F59E0B' }} />
            <span>On Trip</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', fontWeight: 600 }}>
            <span style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: '#EF4444' }} />
            <span>Maintenance</span>
          </div>
        </div>
      </div>

      {/* Filter and Month Selector */}
      <Card style={{ padding: '0.875rem 1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <CalendarIcon size={18} color="#2C3480" />
            <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>
              November 2026 (Operational Fortnight)
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              style={{
                padding: '0.45rem 0.75rem',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '0.85rem',
                backgroundColor: '#fff'
              }}
            >
              <option value="All">All Vehicle Categories</option>
              <option value="Premium MPV">Premium MPV</option>
              <option value="Tempo Coach">Tempo Coach</option>
              <option value="Executive Sedan">Executive Sedan</option>
              <option value="Luxury SUV">Luxury SUV</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Availability Matrix Grid */}
      <Card>
        <CardBody style={{ padding: 0 }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center', fontSize: '0.8rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  <th style={{ padding: '0.85rem 1rem', textAlign: 'left', minWidth: '220px', fontWeight: 700, color: '#334155' }}>
                    Vehicle & Plate
                  </th>
                  {daysArray.map((day) => (
                    <th
                      key={day}
                      style={{
                        padding: '0.65rem 0.4rem',
                        minWidth: '55px',
                        borderLeft: '1px solid #f1f5f9',
                        fontWeight: day === 9 ? 800 : 600,
                        backgroundColor: day === 9 ? '#EEF0FD' : 'transparent',
                        color: day === 9 ? '#2C3480' : '#475569'
                      }}
                    >
                      <div>{['Fri', 'Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu'][(day - 6) % 7]}</div>
                      <div style={{ fontSize: '0.9rem' }}>{day}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredVehicles.map((veh) => (
                  <tr key={veh.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '0.85rem 1rem', textAlign: 'left' }}>
                      <div style={{ fontWeight: 700, color: '#0f172a' }}>{veh.brand} {veh.model}</div>
                      <div style={{ fontFamily: 'monospace', fontSize: '0.75rem', fontWeight: 700, color: '#2C3480' }}>
                        {veh.regNo} &bull; {veh.seatingCapacity} Seater
                      </div>
                    </td>

                    {daysArray.map((day) => {
                      const dayStatus = getDayStatus(veh, day);
                      return (
                        <td
                          key={day}
                          onClick={() => handleCellClick(veh, day)}
                          style={{
                            padding: '0.4rem 0.25rem',
                            borderLeft: '1px solid #f1f5f9',
                            cursor: 'pointer',
                            backgroundColor: day === 9 ? 'rgba(238, 240, 253, 0.4)' : 'transparent'
                          }}
                          title={`Click to manage ${veh.regNo} on Nov ${day}: ${dayStatus.label}`}
                        >
                          <div
                            style={{
                              padding: '0.45rem 0.2rem',
                              borderRadius: '6px',
                              backgroundColor: dayStatus.color,
                              color: '#ffffff',
                              fontSize: '0.68rem',
                              fontWeight: 700,
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                            }}
                          >
                            {dayStatus.status === 'Available' ? '✓ Free' : dayStatus.status === 'On Trip' ? 'On Trip' : dayStatus.status === 'Reserved' ? 'Booked' : 'Maint.'}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>

      {/* Date Inspection / Action Modal */}
      <Modal
        isOpen={Boolean(actionVehicle)}
        onClose={() => setActionVehicle(null)}
        title={`Roster Management - ${actionVehicle?.regNo}`}
        subtitle={`Schedule details for November ${actionDay}, 2026`}
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', width: '100%' }}>
            <Button variant="outline" onClick={() => setActionVehicle(null)}>Close</Button>
            <Button
              variant="primary"
              style={{ backgroundColor: '#2C3480' }}
              onClick={handleApplyStatus}
            >
              Update Schedule
            </Button>
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Vehicle</span>
            <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>
              {actionVehicle?.brand} {actionVehicle?.model} ({actionVehicle?.regNo})
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
              Availability Status for Nov {actionDay}
            </label>
            <select
              value={actionStatus}
              onChange={(e) => setActionStatus(e.target.value)}
              style={{
                width: '100%',
                padding: '0.55rem 0.75rem',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '0.875rem',
                backgroundColor: '#fff'
              }}
            >
              <option value="Available">Available (Ready for Dispatch)</option>
              <option value="Maintenance">Maintenance (Workshop Hold)</option>
              <option value="Blocked">Blocked by Vendor (Private Hire / Depot Hold)</option>
            </select>
          </div>

          <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0 }}>
            * Note: Confirmed bookings assigned by MAK Admin operations can only be rescheduled with Operations dispatch approval.
          </p>
        </div>
      </Modal>
    </div>
  );
}

export default VehicleAvailability;
