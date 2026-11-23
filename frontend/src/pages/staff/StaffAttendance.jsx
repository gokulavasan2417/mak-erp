// MAK Tours & Travels ERP - Staff Attendance & Shift Rosters
import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  MapPin,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Check
} from 'lucide-react';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useStaffData } from '../../context/StaffDataContext';

export function StaffAttendance() {
  const { attendanceMetrics, attendanceLog, recordTodayPunch, profile } = useStaffData();
  const [selectedDayDetail, setSelectedDayDetail] = useState(null);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Present':
        return { bg: '#dcfce7', color: '#15803d', border: '#bbf7d0' };
      case 'Half Day':
        return { bg: '#fffbeb', color: '#b45309', border: '#fde68a' };
      case 'Paid Leave':
        return { bg: '#e0e7ff', color: '#4338ca', border: '#c7d2fe' };
      case 'Unpaid Leave':
      case 'Absent':
        return { bg: '#fee2e2', color: '#b91c1c', border: '#fecaca' };
      case 'Weekly Off':
        return { bg: '#f1f5f9', color: '#475569', border: '#cbd5e1' };
      case 'Holiday':
        return { bg: '#fef3c7', color: '#92400e', border: '#fde68a' };
      default:
        return { bg: '#f8fafc', color: '#64748b', border: '#e2e8f0' };
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header Banner */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          padding: '1.5rem 2rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <Calendar size={18} color="#2C3480" />
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#2C3480', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Timesheets &amp; Rostering
            </span>
          </div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
            Attendance &amp; Monthly Timesheets
          </h1>
          <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0.25rem 0 0' }}>
            November 2026 Shift Roster: {profile.shift} &bull; Chennai HQ Terminal Biometric
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Button
            variant="outline"
            onClick={() => recordTodayPunch('Punch In')}
          >
            <Clock size={16} style={{ marginRight: '0.35rem' }} /> Punch In
          </Button>
          <Button
            variant="primary"
            style={{ backgroundColor: '#2C3480', fontWeight: 700 }}
            onClick={() => recordTodayPunch('Punch Out')}
          >
            <CheckCircle2 size={16} style={{ marginRight: '0.35rem' }} /> Punch Out
          </Button>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        <div style={{ backgroundColor: '#ffffff', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
          <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, display: 'block' }}>ATTENDANCE RATE</span>
          <span style={{ fontSize: '1.75rem', fontWeight: 800, color: '#15803d' }}>{attendanceMetrics.attendancePercentage}%</span>
          <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', marginTop: '0.2rem' }}>Prorated MTD</span>
        </div>

        <div style={{ backgroundColor: '#ffffff', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
          <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, display: 'block' }}>PRESENT DAYS</span>
          <span style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a' }}>{attendanceMetrics.presentDays}</span>
          <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', marginTop: '0.2rem' }}>Full Day Shifts</span>
        </div>

        <div style={{ backgroundColor: '#ffffff', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
          <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, display: 'block' }}>HALF DAYS</span>
          <span style={{ fontSize: '1.75rem', fontWeight: 800, color: '#b45309' }}>{attendanceMetrics.halfDays}</span>
          <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', marginTop: '0.2rem' }}>0.5 Pay Factor</span>
        </div>

        <div style={{ backgroundColor: '#ffffff', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
          <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, display: 'block' }}>PAID LEAVES</span>
          <span style={{ fontSize: '1.75rem', fontWeight: 800, color: '#4338ca' }}>{attendanceMetrics.paidLeaves}</span>
          <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', marginTop: '0.2rem' }}>Casual / Medical</span>
        </div>

        <div style={{ backgroundColor: '#ffffff', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
          <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, display: 'block' }}>ABSENT DAYS</span>
          <span style={{ fontSize: '1.75rem', fontWeight: 800, color: attendanceMetrics.absentDays > 0 ? '#b91c1c' : '#15803d' }}>
            {attendanceMetrics.absentDays}
          </span>
          <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', marginTop: '0.2rem' }}>Loss of Pay</span>
        </div>
      </div>

      {/* Attendance Log Table */}
      <Card>
        <CardHeader
          title="Daily Attendance Register (November 2026)"
          subtitle="Biometric punch records and shift verification"
        />
        <CardBody style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e2e8f0', textAlign: 'left', backgroundColor: '#f8fafc' }}>
                <th style={{ padding: '0.75rem 1rem', color: '#475569', fontWeight: 700 }}>Date</th>
                <th style={{ padding: '0.75rem 1rem', color: '#475569', fontWeight: 700 }}>Day</th>
                <th style={{ padding: '0.75rem 1rem', color: '#475569', fontWeight: 700 }}>Status</th>
                <th style={{ padding: '0.75rem 1rem', color: '#475569', fontWeight: 700 }}>Punch In</th>
                <th style={{ padding: '0.75rem 1rem', color: '#475569', fontWeight: 700 }}>Punch Out</th>
                <th style={{ padding: '0.75rem 1rem', color: '#475569', fontWeight: 700 }}>Total Hours</th>
                <th style={{ padding: '0.75rem 1rem', color: '#475569', fontWeight: 700 }}>Terminal</th>
              </tr>
            </thead>
            <tbody>
              {attendanceLog.map((row, idx) => {
                const badge = getStatusBadge(row.status);
                return (
                  <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '0.75rem 1rem', fontWeight: 700, color: '#0f172a' }}>{row.date}</td>
                    <td style={{ padding: '0.75rem 1rem', color: '#64748b' }}>{row.day}</td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <span
                        style={{
                          backgroundColor: badge.bg,
                          color: badge.color,
                          border: `1px solid ${badge.border}`,
                          padding: '0.2rem 0.55rem',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          fontWeight: 700
                        }}
                      >
                        {row.status}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem 1rem', fontFamily: 'monospace', color: '#1e293b' }}>{row.checkIn}</td>
                    <td style={{ padding: '0.75rem 1rem', fontFamily: 'monospace', color: '#1e293b' }}>{row.checkOut}</td>
                    <td style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>{row.hours > 0 ? `${row.hours} hrs` : '-'}</td>
                    <td style={{ padding: '0.75rem 1rem', color: '#64748b', fontSize: '0.8rem' }}>
                      {row.status === 'Present' ? 'HQ Biometric T1' : row.remarks || '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </CardBody>
      </Card>
    </div>
  );
}

export default StaffAttendance;
