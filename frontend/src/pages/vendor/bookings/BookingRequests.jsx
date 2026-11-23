// MAK Tours & Travels ERP - Vendor Booking Requests Awaiting Confirmation
// CRITICAL: ONE WAY TRIP MUST NOT EXIST ANYWHERE IN THIS APPLICATION.
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  Car,
  UserCheck,
  MapPin,
  Users,
  IndianRupee,
  AlertCircle,
  Eye,
  ArrowRight
} from 'lucide-react';
import { Card, CardHeader, CardBody } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { Modal } from '../../../components/ui/Modal';
import { useVendorData } from '../../../context/VendorDataContext';
import { rejectionReasonOptions } from '../../../data/vendorPortalData';
import { VendorNavTabs, VENDOR_BOOKING_TABS } from '../../../components/vendor/VendorNavTabs';
import { formatDateDMY } from '../../../utils/dateUtils';

export function BookingRequests() {
  const navigate = useNavigate();
  const {
    bookingRequests,
    vehicles,
    drivers,
    acceptBookingRequest,
    rejectBookingRequest
  } = useVendorData();

  const pendingRequests = bookingRequests.filter((r) => r.status === 'Pending');
  const pastRequests = bookingRequests.filter((r) => r.status !== 'Pending');

  // Accept Dialog State
  const [acceptModalRequest, setAcceptModalRequest] = useState(null);
  const [assignedVehicleId, setAssignedVehicleId] = useState('');

  // Reject Dialog State
  const [rejectModalRequest, setRejectModalRequest] = useState(null);
  const [rejectionReason, setRejectionReason] = useState(rejectionReasonOptions[0]);
  const [rejectionExplanation, setRejectionExplanation] = useState('');

  const handleOpenAccept = (req) => {
    setAcceptModalRequest(req);
    // Find matching vehicle
    const matchedVeh = vehicles.find((v) => v.category === req.requiredCategory && v.status === 'Available') || vehicles[0];
    setAssignedVehicleId(matchedVeh ? matchedVeh.id : vehicles[0]?.id || '');
  };

  const handleConfirmAccept = () => {
    if (!acceptModalRequest) return;
    acceptBookingRequest(acceptModalRequest.id, assignedVehicleId);
    setAcceptModalRequest(null);
  };

  const handleOpenReject = (req) => {
    setRejectModalRequest(req);
    setRejectionReason(rejectionReasonOptions[0]);
    setRejectionExplanation('');
  };

  const handleConfirmReject = () => {
    if (!rejectModalRequest) return;
    rejectBookingRequest(rejectModalRequest.id, rejectionReason, rejectionExplanation);
    setRejectModalRequest(null);
  };

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
              Pending Dispatch Orders
            </span>
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
            Booking Requests Awaiting Confirmation
          </h1>
          <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0.25rem 0 0' }}>
            Review incoming trip dispatch orders from MAK Operations desk, assign fleet and confirm or decline
          </p>
        </div>

        <Button
          variant="outline"
          onClick={() => navigate('/vendor/bookings')}
        >
          View All Bookings Manifest →
        </Button>
      </div>

      {/* Pending Requests Section */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
          New Booking Requests ({pendingRequests.length})
        </h2>

        {pendingRequests.length === 0 ? (
          <Card>
            <div style={{ padding: '3.5rem 2rem', textAlign: 'center', color: '#64748b' }}>
              <CheckCircle size={44} color="#16a34a" style={{ margin: '0 auto 0.75rem' }} />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e293b', margin: '0 0 0.25rem' }}>
                All Booking Requests Actioned!
              </h3>
              <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>
                There are currently no new booking requests waiting for your confirmation.
              </p>
            </div>
          </Card>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1.25rem' }}>
            {pendingRequests.map((req) => (
              <div
                key={req.id}
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
                      {req.bookingCategory}
                    </span>
                    <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#0f172a' }}>
                      #{req.bookingId}
                    </span>
                  </div>

                  <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                    Received: {req.receivedAt}
                  </span>
                </div>

                {/* Body Content */}
                <div style={{ padding: '1.25rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.15rem' }}>
                      {req.customerName}
                    </h3>
                    <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                      Contact: {req.contactPerson || req.customerName} ({req.phone})
                    </div>
                  </div>

                  {/* Route Box */}
                  <div style={{ backgroundColor: '#f8fafc', padding: '0.75rem 0.85rem', borderRadius: '10px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '0.45rem', fontSize: '0.8rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                      <Calendar size={13} color="#2C3480" />
                      <strong style={{ color: '#1e293b' }}>{formatDateDMY(req.travelDate)}</strong>
                      <span style={{ color: '#64748b' }}>at {req.pickupTime}</span>
                      {req.travelEndDate && req.travelEndDate !== req.travelDate && (
                        <span style={{ color: '#64748b' }}>&bull; Returns: {formatDateDMY(req.travelEndDate)}</span>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', marginTop: '0.2rem' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10B981', marginTop: '5px', flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <span style={{ fontSize: '0.65rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, display: 'block' }}>Pickup</span>
                        <span style={{ color: '#1e293b', fontWeight: 600 }}>{req.pickupLocation}</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#EF4444', marginTop: '5px', flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <span style={{ fontSize: '0.65rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, display: 'block' }}>Destination</span>
                        <span style={{ color: '#1e293b', fontWeight: 600 }}>{req.dropLocation}</span>
                      </div>
                    </div>
                  </div>

                  {/* Vehicle requirement & passenger count */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.78rem' }}>
                    <span style={{ color: '#64748b' }}>
                      Required Fleet: <strong style={{ color: '#0f172a' }}>{req.requiredCategory}</strong> ({req.passengerCount} Pax)
                    </span>
                    <span style={{ color: '#16a34a', fontWeight: 600 }}>
                      {req.paymentStatus}
                    </span>
                  </div>

                  {/* Financial Breakdown */}
                  <div style={{ backgroundColor: '#EEF0FD', padding: '0.75rem', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <span style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Vendor Net Payable</span>
                      <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#2C3480' }}>
                        ₹{req.vendorPayable?.toLocaleString('en-IN')}
                      </div>
                      <span style={{ fontSize: '0.68rem', color: '#64748b' }}>
                        Fare: ₹{req.bookingAmount?.toLocaleString('en-IN')} &bull; Comm: ₹{req.adminCommission}
                      </span>
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <Button
                        size="sm"
                        variant="outline"
                        style={{ color: '#DC2626', borderColor: '#FECACA' }}
                        onClick={() => handleOpenReject(req)}
                      >
                        <XCircle size={14} style={{ marginRight: '0.2rem' }} /> Reject
                      </Button>
                      <Button
                        size="sm"
                        variant="primary"
                        style={{ backgroundColor: '#16A34A', fontWeight: 700 }}
                        onClick={() => handleOpenAccept(req)}
                      >
                        <CheckCircle size={14} style={{ marginRight: '0.2rem' }} /> Accept Request
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Past Requests Audit Log */}
      {pastRequests.length > 0 && (
        <Card style={{ marginTop: '1rem' }}>
          <CardHeader title="Recently Actioned Requests" subtitle="History of accepted and declined dispatch orders" />
          <CardBody style={{ padding: 0 }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                    <th style={{ padding: '0.875rem 1rem' }}>Booking #</th>
                    <th style={{ padding: '0.875rem 1rem' }}>Customer</th>
                    <th style={{ padding: '0.875rem 1rem' }}>Travel Date</th>
                    <th style={{ padding: '0.875rem 1rem' }}>Route</th>
                    <th style={{ padding: '0.875rem 1rem' }}>Payable</th>
                    <th style={{ padding: '0.875rem 1rem' }}>Decision</th>
                  </tr>
                </thead>
                <tbody>
                  {pastRequests.map((r) => (
                    <tr key={r.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '0.875rem 1rem', fontWeight: 800, color: '#2C3480' }}>#{r.bookingId}</td>
                      <td style={{ padding: '0.875rem 1rem' }}>{r.customerName}</td>
                      <td style={{ padding: '0.875rem 1rem' }}>{formatDateDMY(r.travelDate)}</td>
                      <td style={{ padding: '0.875rem 1rem' }}>{r.dropLocation}</td>
                      <td style={{ padding: '0.875rem 1rem', fontWeight: 700 }}>₹{r.vendorPayable?.toLocaleString('en-IN')}</td>
                      <td style={{ padding: '0.875rem 1rem' }}>
                        <StatusBadge status={r.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Accept Booking Confirmation Modal */}
      <Modal
        isOpen={Boolean(acceptModalRequest)}
        onClose={() => setAcceptModalRequest(null)}
        title={`Accept Booking - #${acceptModalRequest?.bookingId}`}
        subtitle={`Customer: ${acceptModalRequest?.customerName}`}
        size="md"
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', width: '100%' }}>
            <Button variant="outline" onClick={() => setAcceptModalRequest(null)}>Cancel</Button>
            <Button
              variant="primary"
              style={{ backgroundColor: '#16A34A', fontWeight: 700 }}
              onClick={handleConfirmAccept}
            >
              Confirm Acceptance (₹{acceptModalRequest?.vendorPayable?.toLocaleString('en-IN')})
            </Button>
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ backgroundColor: '#f8fafc', padding: '0.85rem', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.85rem' }}>
            <div><strong>Route:</strong> {acceptModalRequest?.pickupLocation} ➔ {acceptModalRequest?.dropLocation}</div>
            <div style={{ marginTop: '0.25rem' }}><strong>Date:</strong> {acceptModalRequest?.travelDate} at {acceptModalRequest?.pickupTime}</div>
            <div style={{ marginTop: '0.25rem', color: '#16A34A', fontWeight: 700 }}>
              Vendor Payout: ₹{acceptModalRequest?.vendorPayable?.toLocaleString('en-IN')}
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
              Assign Fleet Vehicle *
            </label>
            <select
              value={assignedVehicleId}
              onChange={(e) => setAssignedVehicleId(e.target.value)}
              style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.875rem', backgroundColor: '#fff' }}
            >
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.regNo} - {v.brand} {v.model} ({v.status}) &bull; {v.category}
                </option>
              ))}
            </select>
          </div>

          <div
            style={{
              backgroundColor: '#EEF0FD',
              border: '1px solid #C7CEFA',
              borderRadius: '8px',
              padding: '0.75rem 1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.625rem'
            }}
          >
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#2C3480', textTransform: 'uppercase' }}>
                Driver Assignment Notice
              </div>
              <div style={{ fontSize: '0.8125rem', color: '#1e293b', marginTop: '0.15rem' }}>
                Drivers are managed and assigned centrally by MAK Admin Operations Desk upon booking dispatch.
              </div>
            </div>
          </div>
        </div>
      </Modal>

      {/* Reject Booking Reason Modal */}
      <Modal
        isOpen={Boolean(rejectModalRequest)}
        onClose={() => setRejectModalRequest(null)}
        title={`Decline Booking Request #${rejectModalRequest?.bookingId}`}
        subtitle="Please specify an operational reason for the operations dispatch desk"
        size="md"
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', width: '100%' }}>
            <Button variant="outline" onClick={() => setRejectModalRequest(null)}>Cancel</Button>
            <Button
              variant="primary"
              style={{ backgroundColor: '#DC2626', fontWeight: 700 }}
              onClick={handleConfirmReject}
            >
              Confirm Decline
            </Button>
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
              Primary Rejection Reason *
            </label>
            <select
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.875rem', backgroundColor: '#fff' }}
            >
              {rejectionReasonOptions.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
              Additional Explanation (Optional)
            </label>
            <textarea
              rows={3}
              placeholder="e.g. Vehicle has scheduled fitness renewal inspection on this date..."
              value={rejectionExplanation}
              onChange={(e) => setRejectionExplanation(e.target.value)}
              style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.875rem', fontFamily: 'inherit' }}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default BookingRequests;
