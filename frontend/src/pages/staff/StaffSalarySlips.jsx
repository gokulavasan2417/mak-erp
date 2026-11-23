// MAK Tours & Travels ERP - Employee Salary Slips & History
import React, { useState } from 'react';
import {
  FileText,
  Download,
  Printer,
  Eye,
  CheckCircle2,
  Building2,
  Calendar,
  X,
  CreditCard
} from 'lucide-react';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { useStaffData } from '../../context/StaffDataContext';

export function StaffSalarySlips() {
  const { profile, salarySlips, salaryDetails } = useStaffData();
  const [selectedSlip, setSelectedSlip] = useState(null);

  const isDriverStaff = Boolean(
    profile?.isDriver ||
    salaryDetails?.salaryBasis?.toLowerCase().includes('trip') ||
    profile?.designation?.toLowerCase().includes('driver') ||
    profile?.department === 'Fleet Logistics'
  );

  const handlePrint = () => {
    window.print();
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
            <FileText size={18} color="#2C3480" />
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#2C3480', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Official Payslip Archive
            </span>
          </div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
            Salary Slips &amp; Disbursement History
          </h1>
          <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0.25rem 0 0' }}>
            View and download verified monthly salary slips with complete attendance and deduction statements.
          </p>
        </div>
      </div>

      {/* Salary Slips Table Card */}
      <Card>
        <CardHeader
          title="Past Monthly Salary Slips"
          subtitle="Processed attendance-based salary statements"
        />
        <CardBody style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e2e8f0', textAlign: 'left', backgroundColor: '#f8fafc' }}>
                <th style={{ padding: '0.85rem 1rem', color: '#475569', fontWeight: 700 }}>Month / Cycle</th>
                <th style={{ padding: '0.85rem 1rem', color: '#475569', fontWeight: 700 }}>Slip Number</th>
                <th style={{ padding: '0.85rem 1rem', color: '#475569', fontWeight: 700 }}>Attendance %</th>
                <th style={{ padding: '0.85rem 1rem', color: '#475569', fontWeight: 700 }}>{isDriverStaff ? 'Rate Basis' : 'Monthly Salary'}</th>
                <th style={{ padding: '0.85rem 1rem', color: '#475569', fontWeight: 700 }}>Calculated Net Pay</th>
                <th style={{ padding: '0.85rem 1rem', color: '#475569', fontWeight: 700 }}>Payment Method</th>
                <th style={{ padding: '0.85rem 1rem', color: '#475569', fontWeight: 700, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {salarySlips.map((slip, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: '#0f172a' }}>{slip.month}</td>
                  <td style={{ padding: '0.85rem 1rem', fontFamily: 'monospace', color: '#64748b' }}>{slip.slipNumber}</td>
                  <td style={{ padding: '0.85rem 1rem' }}>
                    <span style={{ backgroundColor: '#dcfce7', color: '#15803d', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700 }}>
                      {slip.attendancePercentage}%
                    </span>
                  </td>
                  <td style={{ padding: '0.85rem 1rem', fontWeight: 600 }}>
                    {isDriverStaff ? (
                      <span style={{ color: '#059669', backgroundColor: '#ecfdf5', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700 }}>
                        Trip-Based
                      </span>
                    ) : (
                      `₹${slip.grossSalary.toLocaleString()}`
                    )}
                  </td>
                  <td style={{ padding: '0.85rem 1rem', fontWeight: 800, color: '#166534' }}>₹{slip.netSalary.toLocaleString()}</td>
                  <td style={{ padding: '0.85rem 1rem', color: '#475569' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.8rem' }}>
                      <CheckCircle2 size={13} color="#16a34a" /> {slip.paymentMethod}
                    </span>
                  </td>
                  <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                    <Button
                      variant="primary"
                      size="sm"
                      style={{ backgroundColor: '#2C3480' }}
                      onClick={() => setSelectedSlip(slip)}
                    >
                      <Eye size={14} style={{ marginRight: '0.3rem' }} /> View Slip
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardBody>
      </Card>

      {/* Official Salary Slip Modal */}
      {selectedSlip && (
        <Modal
          isOpen={Boolean(selectedSlip)}
          onClose={() => setSelectedSlip(null)}
          title={`Official Salary Slip - ${selectedSlip.month}`}
          size="lg"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', padding: '0.5rem' }}>
            {/* Payslip Header */}
            <div style={{ textAlign: 'center', borderBottom: '2px solid #0f172a', paddingBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.2rem' }}>
                MAK TOURS &amp; TRAVELS PRIVATE LIMITED
              </h2>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>
                Main Operations Center, Anna Salai, Chennai, Tamil Nadu 600002
              </p>
              <div style={{ marginTop: '0.5rem', display: 'inline-block', backgroundColor: '#f1f5f9', padding: '0.25rem 0.75rem', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 700 }}>
                PAYSLIP FOR THE MONTH OF {selectedSlip.month.toUpperCase()}
              </div>
            </div>

            {/* Employee Particulars Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '8px', fontSize: '0.85rem' }}>
              <div>
                <div><strong>Employee Code:</strong> {profile.employeeCode}</div>
                <div><strong>Employee Name:</strong> {profile.fullName}</div>
                <div><strong>Designation:</strong> {profile.designation}</div>
                <div><strong>Department:</strong> {profile.department}</div>
              </div>
              <div>
                <div><strong>Pay Period:</strong> {selectedSlip.period}</div>
                <div><strong>Salary Basis:</strong> {isDriverStaff ? 'Trip-Based Driver Compensation' : salaryDetails.salaryBasis}</div>
                {isDriverStaff ? (
                  <div><strong>Completed Trips:</strong> <span style={{ color: '#059669', fontWeight: 700 }}>{selectedSlip.presentDays || selectedSlip.tripsCompleted || 0} Trips</span></div>
                ) : (
                  <>
                    <div><strong>Attendance %:</strong> {selectedSlip.attendancePercentage}%</div>
                    <div><strong>Payable Days:</strong> {selectedSlip.presentDays} of {selectedSlip.workingDays} Days</div>
                  </>
                )}
              </div>
            </div>

            {/* Direct Attendance or Trip-Based Salary Calculation */}
            {isDriverStaff ? (
              <div style={{ backgroundColor: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: '12px', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#2C3480', textTransform: 'uppercase', letterSpacing: '0.04em', borderBottom: '1.5px solid #e2e8f0', paddingBottom: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Trip-Based Driver Earnings Calculation</span>
                  <span style={{ fontSize: '0.72rem', backgroundColor: '#ecfdf5', color: '#059669', padding: '0.15rem 0.45rem', borderRadius: '4px', fontWeight: 700 }}>
                    Per-Trip Basis
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.95rem' }}>
                  <span style={{ color: '#475569', fontWeight: 600 }}>Salary Basis:</span>
                  <span style={{ fontWeight: 800, color: '#059669', fontSize: '1.05rem' }}>
                    Trip-Based Pay (Not Monthly)
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.9rem' }}>
                  <span style={{ color: '#475569' }}>Completed Eligible Trips:</span>
                  <span style={{ fontWeight: 700, color: '#0f172a' }}>
                    {selectedSlip.presentDays || selectedSlip.tripsCompleted || 0} Trips
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.95rem', borderTop: '1px dashed #cbd5e1', paddingTop: '0.65rem' }}>
                  <div>
                    <span style={{ fontWeight: 700, color: '#2C3480' }}>Trip Earnings &amp; Allowances:</span>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      Calculated on completed trip journeys and audited driver allowances
                    </div>
                  </div>
                  <span style={{ fontWeight: 800, color: '#16a34a', fontSize: '1.25rem' }}>
                    ₹{selectedSlip.netSalary.toLocaleString()}
                  </span>
                </div>
              </div>
            ) : (
              <div style={{ backgroundColor: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: '12px', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#2C3480', textTransform: 'uppercase', letterSpacing: '0.04em', borderBottom: '1.5px solid #e2e8f0', paddingBottom: '0.5rem' }}>
                  Salary &amp; Attendance Calculation
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.95rem' }}>
                  <span style={{ color: '#475569', fontWeight: 600 }}>Monthly Salary:</span>
                  <span style={{ fontWeight: 800, color: '#0f172a', fontSize: '1.15rem' }}>
                    ₹{(selectedSlip.grossSalary || salaryDetails.monthlyBasicSalary || 42000).toLocaleString()}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.9rem' }}>
                  <span style={{ color: '#475569' }}>Total Working Days in Month:</span>
                  <span style={{ fontWeight: 700, color: '#0f172a' }}>
                    {selectedSlip.workingDays || 26} Days
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.9rem' }}>
                  <span style={{ color: '#475569' }}>Attendance (Payable Days):</span>
                  <span style={{ fontWeight: 700, color: '#16a34a' }}>
                    {selectedSlip.presentDays || 26} of {selectedSlip.workingDays || 26} Days ({selectedSlip.attendancePercentage}%)
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.95rem', borderTop: '1px dashed #cbd5e1', paddingTop: '0.65rem' }}>
                  <div>
                    <span style={{ fontWeight: 700, color: '#2C3480' }}>Calculated Amount (From Attendance):</span>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      (₹{(selectedSlip.grossSalary || salaryDetails.monthlyBasicSalary || 42000).toLocaleString()} &divide; {selectedSlip.workingDays || 26} days) &times; {selectedSlip.presentDays || 26} days
                    </div>
                  </div>
                  <span style={{ fontWeight: 800, color: '#16a34a', fontSize: '1.25rem' }}>
                    ₹{selectedSlip.netSalary.toLocaleString()}
                  </span>
                </div>
              </div>
            )}

            {/* Net Salary Highlight */}
            <div style={{ backgroundColor: '#EEF0FD', padding: '0.85rem 1.25rem', borderRadius: '8px', border: '1px solid #c7d2fe', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#4338ca', textTransform: 'uppercase' }}>
                  NET SALARY DISBURSED
                </span>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#1e1b4b' }}>
                  ₹{selectedSlip.netSalary.toLocaleString()}
                </div>
              </div>

              <div style={{ textAlign: 'right', fontSize: '0.8rem', color: '#475569' }}>
                <div><strong>Ref:</strong> {selectedSlip.transactionRef}</div>
                <div><strong>Date:</strong> {selectedSlip.paymentDate}</div>
              </div>
            </div>

            {/* Modal Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', borderTop: '1px solid #e2e8f0', paddingTop: '1rem' }}>
              <Button variant="outline" onClick={() => setSelectedSlip(null)}>
                Close
              </Button>
              <Button
                variant="primary"
                style={{ backgroundColor: '#2C3480' }}
                onClick={handlePrint}
              >
                <Printer size={15} style={{ marginRight: '0.35rem' }} /> Print / Save PDF
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default StaffSalarySlips;
