// MAK Tours & Travels ERP - Commercial SaaS Company Registration Page
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Building2, ShieldCheck, Mail, Phone, Lock, MapPin, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { authService } from '../../services/authService';
import { useToast } from '../../context/ToastContext';

export function CompanyRegisterPage() {
  const navigate = useNavigate();
  const toast = useToast();

  const [companyName, setCompanyName] = useState('');
  const [adminName, setAdminName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [city, setCity] = useState('Chennai');
  const [state, setState] = useState('Tamil Nadu');
  const [plan, setPlan] = useState('Professional');
  const [notes, setNotes] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successData, setSuccessData] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!companyName.trim() || !adminName.trim() || !email.trim() || !password) {
      setError('Please provide all required business details.');
      return;
    }

    if (password.length < 6) {
      setError('Master password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    try {
      const res = await authService.companyRegister({
        companyName: companyName.trim(),
        adminName: adminName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        password,
        plan,
        city: city.trim(),
        state: state.trim(),
        notes: notes.trim()
      });

      setSuccessData(res.data || { companyName, status: 'Pending' });
      toast.success('Registration request submitted successfully!');
    } catch (err) {
      setError(err.message || 'Could not submit company registration. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (successData) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0f172a',
          padding: '1.5rem',
          fontFamily: 'inherit'
        }}
      >
        <div
          style={{
            maxWidth: '520px',
            width: '100%',
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            padding: '2.5rem',
            textAlign: 'center',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: '#ecfdf5',
              color: '#059669',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.25rem'
            }}
          >
            <CheckCircle2 size={36} />
          </div>

          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.75rem' }}>
            Application Received!
          </h2>

          <p style={{ fontSize: '0.9rem', color: '#475569', lineHeight: 1.6, marginBottom: '1.5rem' }}>
            Thank you for registering <strong>{companyName}</strong>. Your account has been placed into our
            <strong> Pending Verification</strong> queue.
          </p>

          <div
            style={{
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              padding: '1rem',
              textAlign: 'left',
              fontSize: '0.8125rem',
              color: '#334155',
              marginBottom: '1.75rem'
            }}
          >
            <div style={{ marginBottom: '0.4rem' }}>
              <strong>What happens next?</strong>
            </div>
            <ol style={{ paddingLeft: '1.25rem', margin: 0, lineHeight: 1.5 }}>
              <li>The Platform Super Administrator verifies your credentials and fleet particulars.</li>
              <li>Once approved, a commercial License Key will be issued to your account.</li>
              <li>You can log in at <code>/admin/login</code> with your master credentials.</li>
            </ol>
          </div>

          <Button
            variant="primary"
            style={{ width: '100%' }}
            onClick={() => navigate('/login')}
          >
            Return to Gateway Login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#0f172a',
        padding: '2rem 1rem',
        fontFamily: 'inherit'
      }}
    >
      <div
        style={{
          maxWidth: '640px',
          width: '100%',
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
          overflow: 'hidden'
        }}
      >
        {/* Banner */}
        <div
          style={{
            backgroundColor: '#1e293b',
            padding: '2rem',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <Building2 size={24} style={{ color: '#EAB308' }} />
              <span style={{ fontSize: '0.8125rem', fontWeight: 700, letterSpacing: '0.05em', color: '#94a3b8', textTransform: 'uppercase' }}>
                Commercial SaaS Onboarding
              </span>
            </div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0 }}>Register Your Travels Agency</h1>
            <p style={{ fontSize: '0.85rem', color: '#cbd5e1', margin: '0.35rem 0 0' }}>
              Provision an isolated enterprise ERP instance for your fleet &amp; tour operations.
            </p>
          </div>

          <Link
            to="/login"
            style={{
              color: '#94a3b8',
              textDecoration: 'none',
              fontSize: '0.8125rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem'
            }}
          >
            <ArrowLeft size={14} /> Back
          </Link>
        </div>

        {/* Form Container */}
        <form onSubmit={handleSubmit} style={{ padding: '2rem' }}>
          {error && (
            <div
              style={{
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '8px',
                padding: '0.75rem 1rem',
                color: '#dc2626',
                fontSize: '0.8125rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '1.5rem'
              }}
            >
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                Company / Agency Legal Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. ABC Travels & Tours"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.625rem 0.875rem',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.875rem'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                Primary Admin Full Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Rajesh Kumar"
                value={adminName}
                onChange={(e) => setAdminName(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.625rem 0.875rem',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.875rem'
                }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                Work Email Address *
              </label>
              <input
                type="email"
                required
                placeholder="admin@abctravels.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.625rem 0.875rem',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.875rem'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                Primary Mobile / WhatsApp *
              </label>
              <input
                type="tel"
                required
                placeholder="+91 98401 22334"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.625rem 0.875rem',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.875rem'
                }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                Master Admin Password *
              </label>
              <input
                type="password"
                required
                placeholder="Min 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.625rem 0.875rem',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.875rem'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                Subscription Tier Plan *
              </label>
              <select
                value={plan}
                onChange={(e) => setPlan(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.625rem 0.875rem',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.875rem',
                  backgroundColor: '#ffffff'
                }}
              >
                <option value="Starter">Starter (Up to 15 Vehicles, 10 Staff)</option>
                <option value="Professional">Professional (Up to 50 Vehicles, 30 Staff)</option>
                <option value="Enterprise">Enterprise (Unlimited Fleet &amp; Users)</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                Operational City / Hub
              </label>
              <input
                type="text"
                placeholder="Chennai, Bangalore, Hyderabad..."
                value={city}
                onChange={(e) => setCity(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.625rem 0.875rem',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.875rem'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                State / Region
              </label>
              <input
                type="text"
                placeholder="Tamil Nadu"
                value={state}
                onChange={(e) => setState(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.625rem 0.875rem',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.875rem'
                }}
              />
            </div>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
              Fleet Operations Overview / Notes
            </label>
            <textarea
              rows={2}
              placeholder="e.g. We operate 25 Tempo Travellers and Innovas for outstation circuits."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              style={{
                width: '100%',
                padding: '0.625rem 0.875rem',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                fontSize: '0.875rem'
              }}
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            isLoading={loading}
            style={{ width: '100%', padding: '0.75rem', fontSize: '0.9375rem', fontWeight: 700 }}
          >
            Submit Registration Request
          </Button>

          <p style={{ textAlign: 'center', fontSize: '0.75rem', color: '#64748b', marginTop: '1rem' }}>
            Already have an active company account? <Link to="/login" style={{ color: '#2C3480', fontWeight: 600 }}>Sign in here</Link>
          </p>
        </form>
      </div>
    </div>
  );
}

export default CompanyRegisterPage;
