// MAK Tours & Travels ERP - Staff Attendance-Based Salary & Compensation Details
import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DollarSign,
  Calculator,
  ShieldCheck,
  TrendingUp,
  FileText,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Building,
  Receipt,
  ArrowRight
} from 'lucide-react';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useStaffData } from '../../context/StaffDataContext';

export function StaffSalaryDetails() {
  const navigate = useNavigate();
  const { profile, attendanceMetrics, salaryDetails } = useStaffData();

  const isDriverStaff = Boolean(
    profile?.isDriver ||
    salaryDetails?.salaryBasis?.toLowerCase().includes('trip') ||
    profile?.designation?.toLowerCase().includes('driver') ||
    profile?.department === 'Fleet Logistics'
  );

  const { salaryStructure, statutoryDeductions } = salaryDetails;

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
            <DollarSign size={18} color="#2C3480" />
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#2C3480', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Payroll Compensation &amp; Structure
            </span>
          </div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
            Official Salary &amp; Attendance-Based Pay
          </h1>
          <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0.25rem 0 0' }}>
            Admin-assigned monthly compensation, statutory benefits, and attendance-based salary calculations.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Button
            variant="outline"
            onClick={() => navigate('/staff/slips')}
          >
            <FileText size={15} style={{ marginRight: '0.35rem' }} /> Salary Slips
          </Button>
        </div>
      </div>

      {/* Salary Basis Callout Banner */}
      <div
        style={{
          backgroundColor: '#EEF0FD',
          borderRadius: '12px',
          border: '1px solid #c7d2fe',
          padding: '1rem 1.25rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ padding: '0.6rem', borderRadius: '10px', backgroundColor: '#2C3480', color: '#ffffff' }}>
            <Calculator size={22} />
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#4338ca', textTransform: 'uppercase' }}>
              Official Configured Salary Basis
            </span>
            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1e1b4b' }}>
              {isDriverStaff ? 'Category C – Trip-Based Driver Compensation' : salaryDetails.salaryBasis}
            </div>
            <p style={{ margin: '0.15rem 0 0', fontSize: '0.8rem', color: '#475569' }}>
              {isDriverStaff
                ? 'Calculated per completed trip plus official driver travel duty allowances (bata, night shift, outstation distance, and overnight allowances).'
                : 'Calculated using attendance proration: Attendance % × Monthly Salary, minus statutory deductions.'}
            </p>
          </div>
        </div>

        <div style={{ textAlign: 'right' }}>
          <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', fontWeight: 600 }}>CURRENT MONTH ATTENDANCE</span>
          <span style={{ fontSize: '1.4rem', fontWeight: 800, color: '#15803d' }}>
            {attendanceMetrics.attendancePercentage}%
          </span>
        </div>
      </div>

      {/* Main Summary Highlights */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem' }}>
        <div style={{ backgroundColor: '#ffffff', padding: '1.25rem', borderRadius: '14px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.03)' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '0.35rem' }}>
            {isDriverStaff ? 'Rate Per Trip' : 'Assigned Monthly Salary'}
          </span>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0f172a' }}>
            ₹{(isDriverStaff ? (profile.perTripRate || 600) : salaryDetails.monthlyBasicSalary).toLocaleString()}
            {isDriverStaff && <span style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: 600 }}> / trip</span>}
          </div>
          <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', marginTop: '0.35rem' }}>
            {isDriverStaff ? 'Assigned by Fleet Operations • Trip Basis' : 'Assigned by Company Operations • Read-Only'}
          </span>
        </div>

        <div style={{ backgroundColor: '#ffffff', padding: '1.25rem', borderRadius: '14px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.03)' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '0.35rem' }}>
            Estimated Net Payable Salary
          </span>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#2C3480' }}>
            ₹{salaryDetails.netPayableSalary.toLocaleString()}
          </div>
          <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', marginTop: '0.35rem' }}>
            Post ₹{statutoryDeductions.totalDeductions.toLocaleString()} statutory deductions
          </span>
        </div>
      </div>

      {/* Two-Column Breakdown: Earnings (Salary Structure) vs Deductions */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>
        {/* Earnings Structure Card */}
        <Card>
          <CardHeader title="Official Salary Structure (Earnings)" subtitle="Breakdown of fixed monthly compensation components" />
          <CardBody style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.65rem 0', borderBottom: '1px solid #f1f5f9', fontSize: '0.875rem' }}>
              <span style={{ color: '#475569' }}>Basic Pay (50%)</span>
              <strong style={{ color: '#0f172a' }}>₹{salaryStructure.basicPay.toLocaleString()}</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.65rem 0', borderBottom: '1px solid #f1f5f9', fontSize: '0.875rem' }}>
              <span style={{ color: '#475569' }}>House Rent Allowance (HRA - 25%)</span>
              <strong style={{ color: '#0f172a' }}>₹{salaryStructure.hra.toLocaleString()}</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.65rem 0', borderBottom: '1px solid #f1f5f9', fontSize: '0.875rem' }}>
              <span style={{ color: '#475569' }}>Travel &amp; Conveyance Allowance (15%)</span>
              <strong style={{ color: '#0f172a' }}>₹{salaryStructure.travelAllowance.toLocaleString()}</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.65rem 0', borderBottom: '1px solid #f1f5f9', fontSize: '0.875rem' }}>
              <span style={{ color: '#475569' }}>Special Operations Allowance (10%)</span>
              <strong style={{ color: '#0f172a' }}>₹{salaryStructure.specialAllowance.toLocaleString()}</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.85rem 0 0.2rem', marginTop: '0.5rem', borderTop: '2px solid #e2e8f0', fontSize: '1rem' }}>
              <span style={{ fontWeight: 700, color: '#0f172a' }}>Total Monthly Gross Salary</span>
              <span style={{ fontWeight: 800, color: '#2C3480', fontSize: '1.15rem' }}>
                ₹{salaryStructure.grossSalary.toLocaleString()}
              </span>
            </div>
          </CardBody>
        </Card>

        {/* Statutory Deductions Card */}
        <Card>
          <CardHeader
            title="Deductions &amp; Statutory Withholdings"
            subtitle={salaryDetails.isDeductionWaived ? 'Deductions waived by Admin Operations' : 'Admin controlled deductions & statutory PT'}
          />
          <CardBody style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {salaryDetails.isDeductionWaived ? (
              <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#166534', fontWeight: 800, fontSize: '0.95rem' }}>
                  <CheckCircle2 size={16} /> Admin Deduction Waiver Active
                </div>
                <p style={{ margin: 0, fontSize: '0.8rem', color: '#15803d' }}>
                  All deductions for this pay cycle have been cancelled/waived by Admin Operations. You will receive 100% full gross pay of ₹{(salaryDetails.monthlyBasicSalary || 42000).toLocaleString()}.
                </p>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.65rem 0', borderBottom: '1px solid #f1f5f9', fontSize: '0.875rem' }}>
                  <div>
                    <span style={{ color: '#475569', fontWeight: 600 }}>Applied Deduction</span>
                    {salaryDetails.deductionReason && (
                      <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Reason: {salaryDetails.deductionReason}</div>
                    )}
                  </div>
                  <strong style={{ color: '#dc2626' }}>-₹{salaryDetails.deductions.toLocaleString()}</strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.65rem 0', borderBottom: '1px solid #f1f5f9', fontSize: '0.875rem' }}>
                  <span style={{ color: '#475569' }}>Income Tax (TDS)</span>
                  <strong style={{ color: '#64748b' }}>₹0 (Standard Exemption)</strong>
                </div>
              </>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.85rem 0 0.2rem', marginTop: '0.5rem', borderTop: '2px solid #e2e8f0', fontSize: '1rem' }}>
              <span style={{ fontWeight: 700, color: '#0f172a' }}>Total Monthly Deductions</span>
              <span style={{ fontWeight: 800, color: salaryDetails.isDeductionWaived ? '#16a34a' : '#dc2626', fontSize: '1.15rem' }}>
                {salaryDetails.isDeductionWaived ? '₹0 (Waived)' : `-₹${salaryDetails.deductions.toLocaleString()}`}
              </span>
            </div>
            <div style={{ fontSize: '0.72rem', color: '#64748b', fontStyle: 'italic' }}>
              * Admin Operations controls deductions directly and can waive or adjust penalties/taxes at any time.
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Payment Status & Disbursement Timeline Card */}
      <Card>
        <CardHeader title="Current Month Disbursement Status" subtitle="Monthly payroll processing lifecycle" />
        <CardBody>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', fontSize: '0.875rem' }}>
            <div style={{ padding: '0.85rem', backgroundColor: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, display: 'block' }}>LAST DISBURSEMENT</span>
              <span style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>₹{salaryDetails.lastSalaryPaid.toLocaleString()}</span>
              <span style={{ fontSize: '0.75rem', color: '#16a34a', display: 'block', marginTop: '0.2rem' }}>Paid on 2026-10-31 (NEFT)</span>
            </div>

            <div style={{ padding: '0.85rem', backgroundColor: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, display: 'block' }}>PENDING DISBURSEMENT</span>
              <span style={{ fontSize: '1.2rem', fontWeight: 800, color: '#b45309' }}>₹{salaryDetails.pendingSalary.toLocaleString()}</span>
              <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', marginTop: '0.2rem' }}>Estimated for 2026-11-30</span>
            </div>

            <div style={{ padding: '0.85rem', backgroundColor: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, display: 'block' }}>CYCLE STATUS</span>
              <span style={{ fontSize: '1rem', fontWeight: 800, color: '#2C3480' }}>Open (Days 1–13/30)</span>
              <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', marginTop: '0.2rem' }}>Attendance tracking active</span>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

export default StaffSalaryDetails;
