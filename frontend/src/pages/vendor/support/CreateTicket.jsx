import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Send, UploadCloud, AlertCircle } from 'lucide-react';
import { Breadcrumbs } from '../../../components/common/Breadcrumbs';
import { Card, CardHeader, CardBody, CardFooter } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { useVendorData } from '../../../context/VendorDataContext';
import { VendorNavTabs, VENDOR_SUPPORT_TABS } from '../../../components/vendor/VendorNavTabs';

export function CreateTicket() {
  const navigate = useNavigate();
  const { createSupportTicket, vehicles, bookings } = useVendorData();

  const [formData, setFormData] = useState({
    subject: '',
    category: 'Billing & Settlement',
    priority: 'Medium',
    relatedVehicle: '',
    relatedBooking: '',
    description: ''
  });

  const [attachments, setAttachments] = useState([]);
  const [errors, setErrors] = useState({});

  const categories = [
    'Billing & Settlement',
    'Trip Dispatch & Operations',
    'Vehicle Compliance & Documents',
    'Driver Reassignment',
    'Breakdown & Maintenance',
    'Portal / Mobile App Bug',
    'General Inquiry'
  ];

  const priorities = ['Low', 'Medium', 'High', 'Urgent'];

  const validate = () => {
    const errs = {};
    if (!formData.subject.trim()) errs.subject = 'Subject is required';
    if (!formData.description.trim()) errs.description = 'Please describe the issue or query in detail';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    createSupportTicket({
      subject: formData.subject,
      category: formData.category,
      priority: formData.priority,
      relatedVehicle: formData.relatedVehicle || undefined,
      relatedBooking: formData.relatedBooking || undefined,
      description: formData.description
    });

    navigate('/vendor/support');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '850px', margin: '0 auto' }}>
      <VendorNavTabs tabs={VENDOR_SUPPORT_TABS} />
      {/* Header */}
      <div>
        <Breadcrumbs portal="vendor" />
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.5rem' }}>
          <Button variant="ghost" size="sm" onClick={() => navigate('/vendor/support')}>
            <ArrowLeft size={16} />
          </Button>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-main)' }}>
              Raise Support Ticket
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              Submit a formal request to MAK Tours & Travels admin, finance, or dispatch teams.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader
            title="Ticket Details"
            subtitle="Provide accurate context to expedite support resolution"
          />
          <CardBody style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Subject */}
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.375rem' }}>
                Subject / Issue Summary <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <Input
                placeholder="e.g. UTR discrepancy for Invoice #APX/26-27/050 or Insurance renewal endorsement"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                error={errors.subject}
              />
            </div>

            {/* Category & Priority */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.375rem' }}>
                  Category <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.625rem 0.875rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-light)',
                    backgroundColor: 'var(--bg-surface)',
                    color: 'var(--text-main)',
                    fontSize: '0.875rem'
                  }}
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.375rem' }}>
                  Urgency / Priority <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.625rem 0.875rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-light)',
                    backgroundColor: 'var(--bg-surface)',
                    color: 'var(--text-main)',
                    fontSize: '0.875rem'
                  }}
                >
                  {priorities.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Related Vehicle & Related Booking */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.375rem' }}>
                  Associated Vehicle (Optional)
                </label>
                <select
                  value={formData.relatedVehicle}
                  onChange={(e) => setFormData({ ...formData, relatedVehicle: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.625rem 0.875rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-light)',
                    backgroundColor: 'var(--bg-surface)',
                    color: 'var(--text-main)',
                    fontSize: '0.875rem'
                  }}
                >
                  <option value="">-- None / General --</option>
                  {vehicles.map((v) => (
                    <option key={v.id} value={`${v.regNo} - ${v.brand} ${v.model}`}>
                      {v.regNo} ({v.brand} {v.model})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.375rem' }}>
                  Associated Booking (Optional)
                </label>
                <select
                  value={formData.relatedBooking}
                  onChange={(e) => setFormData({ ...formData, relatedBooking: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.625rem 0.875rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-light)',
                    backgroundColor: 'var(--bg-surface)',
                    color: 'var(--text-main)',
                    fontSize: '0.875rem'
                  }}
                >
                  <option value="">-- None / Not Booking Specific --</option>
                  {bookings.map((b) => (
                    <option key={b.id} value={b.bookingNumber}>
                      {b.bookingNumber} - {b.customerName} ({b.tripType})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Description */}
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.375rem' }}>
                Detailed Description <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <textarea
                rows={5}
                placeholder="Explain the background, specific dates, amounts, or dispatch issues in detail..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: 'var(--radius-md)',
                  border: errors.description ? '1px solid #ef4444' : '1px solid var(--border-light)',
                  backgroundColor: 'var(--bg-surface)',
                  color: 'var(--text-main)',
                  fontSize: '0.875rem',
                  fontFamily: 'inherit',
                  resize: 'vertical'
                }}
              />
              {errors.description && (
                <p style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem' }}>{errors.description}</p>
              )}
            </div>

            {/* Attachments */}
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.375rem' }}>
                Supporting Files & Documents (Optional)
              </label>
              <div
                style={{
                  border: '2px dashed var(--border-light)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1.5rem',
                  textAlign: 'center',
                  backgroundColor: 'var(--bg-surface-hover)',
                  cursor: 'pointer'
                }}
                onClick={() => {
                  const demoFileName = `Document_${Date.now().toString().slice(-4)}.pdf`;
                  setAttachments([...attachments, demoFileName]);
                }}
              >
                <UploadCloud size={28} color="#2C3480" style={{ margin: '0 auto 0.5rem' }} />
                <p style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-main)' }}>
                  Click to attach invoice copy, payment advice, or vehicle RC/insurance photo
                </p>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                  Supported formats: PDF, JPG, PNG (Max 10MB)
                </p>
              </div>

              {attachments.length > 0 && (
                <div style={{ marginTop: '0.75rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {attachments.map((file, idx) => (
                    <span
                      key={idx}
                      style={{
                        fontSize: '0.8125rem',
                        backgroundColor: 'rgba(44, 52, 128, 0.08)',
                        color: '#2C3480',
                        padding: '0.25rem 0.625rem',
                        borderRadius: 'var(--radius-sm)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.375rem'
                      }}
                    >
                      📄 {file}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </CardBody>

          <CardFooter style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <Button variant="secondary" onClick={() => navigate('/vendor/support')}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" leftIcon={<Send size={16} />}>
              Submit Ticket
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}

export default CreateTicket;
