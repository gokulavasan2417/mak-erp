// MAK Tours & Travels ERP - Employee Staff Dashboard
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UserCheck,
  Calendar,
  DollarSign,
  Briefcase,
  CheckCircle2,
  Clock,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  FileText,
  Building2,
  MapPin,
  ShieldCheck,
  Award,
  Edit3
} from 'lucide-react';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useStaffData } from '../../context/StaffDataContext';
import { EditProfileModal } from '../../components/common/EditProfileModal';

export function StaffDashboard() {
  const navigate = useNavigate();
  const { profile, attendanceMetrics, salaryDetails, recordTodayPunch, salarySlips } = useStaffData();
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [avatarError, setAvatarError] = useState(false);

  const displayName = profile.fullName || profile.name || 'Staff Personnel';
  const displayInitials = (displayName || 'SP').substring(0, 2).toUpperCase();
  const isUrlAvatar = profile.avatar && (profile.avatar.startsWith('http') || profile.avatar.startsWith('data:') || profile.avatar.startsWith('/'));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '1400px', margin: '0 auto' }}>
      {/* 1. Header Hero Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
          borderRadius: '16px',
          padding: '1.75rem 2rem',
          color: '#ffffff',
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1.5rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          {isUrlAvatar && !avatarError ? (
            <img
              src={profile.avatar}
              alt={displayName}
              onError={() => setAvatarError(true)}
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                border: '3px solid #38bdf8',
                objectFit: 'cover'
              }}
            />
          ) : (
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                border: '3px solid #38bdf8',
                backgroundColor: '#0284c7',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.5rem',
                fontWeight: 800,
                flexShrink: 0
              }}
            >
              {displayInitials}
            </div>
          )}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0 }}>
                {displayName}
              </h1>
              {profile.employeeCode && (
                <span
                  style={{
                    backgroundColor: 'rgba(56, 189, 248, 0.2)',
                    color: '#38bdf8',
                    border: '1px solid #38bdf8',
                    padding: '0.2rem 0.6rem',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    fontWeight: 700
                  }}
                >
                  {profile.employeeCode}
                </span>
              )}
              <span
                style={{
                  backgroundColor: '#10b981',
                  color: '#ffffff',
                  padding: '0.2rem 0.6rem',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  fontWeight: 700
                }}
              >
                ● {profile.employmentStatus || 'Active'}
              </span>
            </div>

            <p style={{ margin: '0.35rem 0 0', color: '#94a3b8', fontSize: '0.875rem' }}>
              {profile.designation} &bull; <strong style={{ color: '#e2e8f0' }}>{profile.department}</strong> &bull; Work Type: <span style={{ color: '#38bdf8', fontWeight: 600 }}>{profile.workType}</span>
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <Button
            variant="outline"
            style={{ color: '#ffffff', borderColor: '#475569', backgroundColor: 'rgba(255,255,255,0.06)' }}
            onClick={() => setIsEditProfileOpen(true)}
          >
            <Edit3 size={15} style={{ marginRight: '0.35rem' }} /> Edit Profile
          </Button>
          <Button
            variant="outline"
            style={{ color: '#ffffff', borderColor: '#475569' }}
            onClick={() => navigate('/staff/work-details')}
          >
            <Briefcase size={15} style={{ marginRight: '0.35rem' }} /> Job Profile
          </Button>
          <Button
            variant="primary"
            style={{ backgroundColor: '#2C3480', fontWeight: 700 }}
            onClick={() => recordTodayPunch('Punch In')}
          >
            <CheckCircle2 size={16} style={{ marginRight: '0.35rem' }} /> Punch In (Today)
          </Button>
        </div>
      </div>

      {/* 2. Top Metric KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem' }}>
        {/* KPI 1: Attendance Percentage */}
        <div style={{ backgroundColor: '#ffffff', padding: '1.25rem', borderRadius: '14px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
              Attendance (Nov 2026)
            </span>
            <span style={{ backgroundColor: '#dcfce7', color: '#15803d', padding: '0.2rem 0.5rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 800 }}>
              {attendanceMetrics.attendancePercentage}%
            </span>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a' }}>
            {attendanceMetrics.effectivePresentDays} <span style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: 500 }}>/ {attendanceMetrics.workingDays} Days</span>
          </div>
          <div style={{ marginTop: '0.6rem', height: '6px', backgroundColor: '#f1f5f9', borderRadius: '999px', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${attendanceMetrics.attendancePercentage}%`, backgroundColor: '#10b981', borderRadius: '999px' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#64748b', marginTop: '0.5rem' }}>
            <span>Present: {attendanceMetrics.presentDays}d</span>
            <span>Half Day: {attendanceMetrics.halfDays}d</span>
            <span>Leave: {attendanceMetrics.paidLeaves}d</span>
          </div>
        </div>

        {/* KPI 2: Monthly Basic Salary */}
        <div style={{ backgroundColor: '#ffffff', padding: '1.25rem', borderRadius: '14px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
              Monthly Basic Salary
            </span>
            <DollarSign size={18} color="#2C3480" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a' }}>
            ₹{salaryDetails.monthlyBasicSalary.toLocaleString()}
          </div>
          <p style={{ margin: '0.4rem 0 0', fontSize: '0.75rem', color: '#64748b' }}>
            Basis: <strong style={{ color: '#2C3480' }}>{salaryDetails.salaryBasis}</strong>
          </p>
        </div>

        {/* KPI 3: Estimated Current Month Salary */}
        <div style={{ backgroundColor: '#ffffff', padding: '1.25rem', borderRadius: '14px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
              Estimated Month Salary
            </span>
            <TrendingUp size={18} color="#10b981" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#15803d' }}>
            ₹{salaryDetails.earnedGrossSalary.toLocaleString()}
          </div>
          <p style={{ margin: '0.4rem 0 0', fontSize: '0.75rem', color: '#64748b' }}>
            Net Payable: <strong>₹{salaryDetails.netPayableSalary.toLocaleString()}</strong> (Post-deductions)
          </p>
        </div>

        {/* KPI 4: Pending / Outstanding Salary */}
        <div style={{ backgroundColor: '#ffffff', padding: '1.25rem', borderRadius: '14px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
              Pending Salary
            </span>
            <Clock size={18} color="#f59e0b" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#b45309' }}>
            ₹{salaryDetails.pendingSalary.toLocaleString()}
          </div>
          <p style={{ margin: '0.4rem 0 0', fontSize: '0.75rem', color: '#64748b' }}>
            Last Paid: <strong style={{ color: '#0f172a' }}>₹{salaryDetails.lastSalaryPaid.toLocaleString()}</strong> (Oct 2026)
          </p>
        </div>
      </div>

      {/* 3. Two Column Grid: Detailed Attendance Breakdown & Official Work Profile */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>
        {/* Attendance Breakdown Card */}
        <Card>
          <CardHeader
            title="Monthly Attendance Summary (November 2026)"
            subtitle="Attendance metrics evaluated for payroll disbursement"
          />
          <CardBody style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
              <div style={{ padding: '0.75rem', backgroundColor: '#f0fdf4', borderRadius: '8px', border: '1px solid #bbf7d0', textAlign: 'center' }}>
                <span style={{ fontSize: '0.7rem', color: '#15803d', fontWeight: 700, display: 'block' }}>PRESENT DAYS</span>
                <span style={{ fontSize: '1.3rem', fontWeight: 800, color: '#166534' }}>{attendanceMetrics.presentDays}</span>
              </div>
              <div style={{ padding: '0.75rem', backgroundColor: '#fef2f2', borderRadius: '8px', border: '1px solid #fecaca', textAlign: 'center' }}>
                <span style={{ fontSize: '0.7rem', color: '#b91c1c', fontWeight: 700, display: 'block' }}>ABSENT DAYS</span>
                <span style={{ fontSize: '1.3rem', fontWeight: 800, color: '#991b1b' }}>{attendanceMetrics.absentDays}</span>
              </div>
              <div style={{ padding: '0.75rem', backgroundColor: '#fffbeb', borderRadius: '8px', border: '1px solid #fde68a', textAlign: 'center' }}>
                <span style={{ fontSize: '0.7rem', color: '#b45309', fontWeight: 700, display: 'block' }}>HALF DAYS</span>
                <span style={{ fontSize: '1.3rem', fontWeight: 800, color: '#92400e' }}>{attendanceMetrics.halfDays}</span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem' }}>
              <div style={{ padding: '0.6rem', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                <span style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 600, display: 'block' }}>PAID LEAVES</span>
                <span style={{ fontSize: '1.1rem', fontWeight: 700, color: '#334155' }}>{attendanceMetrics.paidLeaves}</span>
              </div>
              <div style={{ padding: '0.6rem', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                <span style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 600, display: 'block' }}>UNPAID LEAVES</span>
                <span style={{ fontSize: '1.1rem', fontWeight: 700, color: '#334155' }}>{attendanceMetrics.unpaidLeaves}</span>
              </div>
              <div style={{ padding: '0.6rem', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                <span style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 600, display: 'block' }}>HOLIDAYS</span>
                <span style={{ fontSize: '1.1rem', fontWeight: 700, color: '#334155' }}>{attendanceMetrics.holidays}</span>
              </div>
              <div style={{ padding: '0.6rem', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                <span style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 600, display: 'block' }}>WEEKLY OFFS</span>
                <span style={{ fontSize: '1.1rem', fontWeight: 700, color: '#334155' }}>{attendanceMetrics.weeklyOffs}</span>
              </div>
            </div>

            <div style={{ marginTop: '0.5rem', display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/staff/attendance')}
              >
                View Full Attendance Calendar <ArrowRight size={14} style={{ marginLeft: '0.25rem' }} />
              </Button>
            </div>
          </CardBody>
        </Card>

        {/* Official Work Details Card */}
        <Card>
          <CardHeader
            title="Official Work & Responsibilities"
            subtitle="Verified official job assignments managed by Admin"
          />
          <CardBody style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.85rem' }}>
              <div>
                <span style={{ color: '#64748b', fontSize: '0.75rem', display: 'block' }}>REPORTING MANAGER</span>
                <strong style={{ color: '#0f172a' }}>{profile.reportingManager}</strong>
              </div>
              <div>
                <span style={{ color: '#64748b', fontSize: '0.75rem', display: 'block' }}>WORK LOCATION</span>
                <strong style={{ color: '#0f172a' }}>{profile.workLocation}</strong>
              </div>
              <div>
                <span style={{ color: '#64748b', fontSize: '0.75rem', display: 'block' }}>EMPLOYMENT TYPE</span>
                <strong style={{ color: '#0f172a' }}>{profile.employmentType} ({profile.shift})</strong>
              </div>
              <div>
                <span style={{ color: '#64748b', fontSize: '0.75rem', display: 'block' }}>DATE OF JOINING</span>
                <strong style={{ color: '#0f172a' }}>{profile.joiningDate}</strong>
              </div>
            </div>

            <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '0.75rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.4rem' }}>
                KEY ASSIGNED DUTIES:
              </span>
              <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.825rem', color: '#475569', lineHeight: 1.6 }}>
                {profile.responsibilities.slice(0, 3).map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </div>

            <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/staff/work-details')}
              >
                View Complete Work Profile <ArrowRight size={14} style={{ marginLeft: '0.25rem' }} />
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* 4. Recent Payslips Strip */}
      <Card>
        <CardHeader
          title="Recent Salary Payslips"
          subtitle="Official monthly attendance-based salary payment records"
        />
        <CardBody style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e2e8f0', textAlign: 'left', backgroundColor: '#f8fafc' }}>
                <th style={{ padding: '0.75rem 1rem', color: '#475569', fontWeight: 700 }}>Month</th>
                <th style={{ padding: '0.75rem 1rem', color: '#475569', fontWeight: 700 }}>Slip #</th>
                <th style={{ padding: '0.75rem 1rem', color: '#475569', fontWeight: 700 }}>Attendance %</th>
                <th style={{ padding: '0.75rem 1rem', color: '#475569', fontWeight: 700 }}>Gross Pay</th>
                <th style={{ padding: '0.75rem 1rem', color: '#475569', fontWeight: 700 }}>Deductions</th>
                <th style={{ padding: '0.75rem 1rem', color: '#475569', fontWeight: 700 }}>Net Disbursed</th>
                <th style={{ padding: '0.75rem 1rem', color: '#475569', fontWeight: 700 }}>Status</th>
                <th style={{ padding: '0.75rem 1rem', color: '#475569', fontWeight: 700, textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {salarySlips.map((slip, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '0.75rem 1rem', fontWeight: 700, color: '#0f172a' }}>{slip.month}</td>
                  <td style={{ padding: '0.75rem 1rem', color: '#64748b', fontFamily: 'monospace' }}>{slip.slipNumber}</td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <span style={{ backgroundColor: '#dcfce7', color: '#15803d', padding: '0.15rem 0.45rem', borderRadius: '4px', fontWeight: 700, fontSize: '0.75rem' }}>
                      {slip.attendancePercentage}%
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>₹{slip.grossSalary.toLocaleString()}</td>
                  <td style={{ padding: '0.75rem 1rem', color: '#dc2626' }}>-₹{slip.totalDeductions.toLocaleString()}</td>
                  <td style={{ padding: '0.75rem 1rem', fontWeight: 800, color: '#166534' }}>₹{slip.netSalary.toLocaleString()}</td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <span style={{ backgroundColor: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0', padding: '0.15rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700 }}>
                      ● {slip.paymentStatus}
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate('/staff/slips')}
                    >
                      <FileText size={14} style={{ marginRight: '0.25rem' }} /> View Slip
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardBody>
      </Card>

      {/* Edit Profile Modal Integration */}
      <EditProfileModal
        isOpen={isEditProfileOpen}
        onClose={() => setIsEditProfileOpen(false)}
      />
    </div>
  );
}

export default StaffDashboard;
