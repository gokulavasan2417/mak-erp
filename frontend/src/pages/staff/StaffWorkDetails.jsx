// MAK Tours & Travels ERP - Employee Work & Official Job Particulars
import React from 'react';
import {
  Briefcase,
  UserCheck,
  Building2,
  MapPin,
  Calendar,
  Clock,
  ShieldCheck,
  CheckCircle2,
  FileText,
  Users
} from 'lucide-react';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { useStaffData } from '../../context/StaffDataContext';

export function StaffWorkDetails() {
  const { profile } = useStaffData();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Top Title Banner */}
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
            <Briefcase size={18} color="#2C3480" />
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#2C3480', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Official Staff Job Particulars
            </span>
          </div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
            Work &amp; Job Designation Profile
          </h1>
          <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0.25rem 0 0' }}>
            Official duties, designated department, reporting structure, and assigned operations responsibilities.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span
            style={{
              backgroundColor: '#dcfce7',
              color: '#15803d',
              border: '1px solid #bbf7d0',
              padding: '0.35rem 0.85rem',
              borderRadius: '8px',
              fontSize: '0.8rem',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem'
            }}
          >
            <ShieldCheck size={16} /> Read-Only Verified Profile
          </span>
        </div>
      </div>

      {/* Primary Work Coordinates Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        {/* Card 1: Official Role & Designation */}
        <Card>
          <CardHeader title="1. Official Designation &amp; Work Type" subtitle="Managed by Admin Employee Management" />
          <CardBody style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                  EMPLOYEE FULL NAME
                </span>
                <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a' }}>{profile.fullName}</div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                    EMPLOYEE CODE / ID
                  </span>
                  <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#2C3480', fontFamily: 'monospace' }}>
                    {profile.employeeCode}
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                    WORK STATUS
                  </span>
                  <div>
                    <span style={{ backgroundColor: '#f0fdf4', color: '#166534', padding: '0.15rem 0.5rem', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 700 }}>
                      ● {profile.workStatus}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                  OFFICIAL WORK TYPE
                </span>
                <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>
                  {profile.workType}
                </div>
              </div>

              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                  DESIGNATION &amp; ROLE
                </span>
                <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#334155' }}>
                  {profile.designation} &bull; {profile.jobRole}
                </div>
              </div>

              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                  ASSIGNED DEPARTMENT
                </span>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#2C3480' }}>
                  {profile.department}
                </div>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Card 2: Reporting & Organization Structure */}
        <Card>
          <CardHeader title="2. Organization &amp; Operational Structure" subtitle="Management hierarchy and work hours" />
          <CardBody style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                  REPORTING MANAGER
                </span>
                <div style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>
                  {profile.reportingManager}
                </div>
              </div>

              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                  PRIMARY WORK LOCATION
                </span>
                <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#334155', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <MapPin size={16} color="#64748b" /> {profile.workLocation}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                    DATE OF JOINING
                  </span>
                  <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#0f172a' }}>
                    {profile.joiningDate}
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                    EMPLOYMENT TYPE
                  </span>
                  <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#0f172a' }}>
                    {profile.employmentType}
                  </div>
                </div>
              </div>

              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                  OFFICIAL SHIFT ROSTER
                </span>
                <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#334155', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Clock size={16} color="#64748b" /> {profile.shift}
                </div>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Card 3: Assigned Job Responsibilities */}
      <Card>
        <CardHeader
          title="3. Assigned Operational Responsibilities &amp; Job Duties"
          subtitle="Administering official duties assigned to this work role"
        />
        <CardBody>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {profile.responsibilities.map((task, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.75rem',
                  padding: '0.85rem 1rem',
                  backgroundColor: '#f8fafc',
                  borderRadius: '10px',
                  border: '1px solid #e2e8f0'
                }}
              >
                <div
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    backgroundColor: '#e0e7ff',
                    color: '#3730a3',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    flexShrink: 0,
                    marginTop: '2px'
                  }}
                >
                  {idx + 1}
                </div>
                <div style={{ fontSize: '0.9rem', color: '#1e293b', fontWeight: 600, lineHeight: 1.5 }}>
                  {task}
                </div>
              </div>
            ))}
          </div>

          <div
            style={{
              marginTop: '1.5rem',
              padding: '0.85rem 1rem',
              backgroundColor: '#eff6ff',
              borderRadius: '8px',
              border: '1px solid #bfdbfe',
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              fontSize: '0.825rem',
              color: '#1e40af'
            }}
          >
            <ShieldCheck size={18} />
            <span>
              Your department, work type, and operational responsibilities are maintained by MAK Tours &amp; Travels Admin Operations. Whenever Admin updates your duties or role, this view automatically updates in real-time.
            </span>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

export default StaffWorkDetails;
