import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Compass,
  Phone,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  UserCheck,
  Clock,
  XCircle,
  FileQuestion
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useDriverData } from '../../context/DriverDataContext';
import { useAuth } from '../../hooks/useAuth';

export function DriverLogin() {
  const navigate = useNavigate();
  const { setCurrentAppId } = useDriverData();
  const { login } = useAuth();

  const [identifier, setIdentifier] = useState('9840122345');
  const [password, setPassword] = useState('driver123');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    if (!identifier.trim() || !password.trim()) {
      setErrorMessage('Please enter your phone number and password');
      return;
    }

    // Authenticate as driver in AuthContext
    login({ email: 'driver@maktours.com', password: 'Driver@123', role: 'driver' });
    setCurrentAppId('APP-2026-001');
    navigate('/driver/dashboard');
  };

  const handleQuickDemo = (scenario) => {
    login({ email: 'driver@maktours.com', password: 'Driver@123', role: 'driver' });
    switch (scenario) {
      case 'approved':
        setIdentifier('9840122345');
        setPassword('driver123');
        setCurrentAppId('APP-2026-001');
        navigate('/driver/dashboard');
        break;
      case 'pending':
        setIdentifier('9791088231');
        setPassword('driver123');
        setCurrentAppId('APP-2026-002');
        navigate('/driver/application-status');
        break;
      case 'under_review':
        setIdentifier('9884477112');
        setPassword('driver123');
        setCurrentAppId('APP-2026-003');
        navigate('/driver/application-status');
        break;
      case 'rejected':
        setIdentifier('9443311223');
        setPassword('driver123');
        setCurrentAppId('APP-2026-004');
        navigate('/driver/application-status');
        break;
      case 'docs_required':
        setIdentifier('9629044556');
        setPassword('driver123');
        setCurrentAppId('APP-2026-005');
        navigate('/driver/application-status');
        break;
      default:
        break;
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#f8fafc',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem 1rem'
      }}
    >
      {/* Branding Header */}
      <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.5rem' }}>
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              backgroundColor: '#2C3480',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(44, 52, 128, 0.25)'
            }}
          >
            <Compass size={24} />
          </div>
          <span style={{ fontSize: '1.375rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
            MAK TOURS & TRAVELS
          </span>
        </div>
        <p style={{ fontSize: '0.875rem', color: '#64748b' }}>
          Official Commercial Driver Portal
        </p>
      </div>

      {/* Main Login Card */}
      <div
        style={{
          width: '100%',
          maxWidth: '460px',
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05)',
          padding: '2rem'
        }}
      >
        <div style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>
            Commercial Driver Sign In
          </h2>
          <p style={{ fontSize: '0.8125rem', color: '#64748b', marginTop: '0.25rem' }}>
            Access your duty roster, active tour itineraries, and payout advices.
          </p>
        </div>

        {errorMessage && (
          <div
            style={{
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '8px',
              padding: '0.75rem',
              color: '#dc2626',
              fontSize: '0.8125rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '1rem'
            }}
          >
            <AlertCircle size={16} />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
              Registered Phone Number or Email *
            </label>
            <div style={{ position: 'relative' }}>
              <Input
                type="text"
                placeholder="e.g. 9840122345 or arun@gmail.com"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                leftIcon={<Phone size={15} color="#64748b" />}
              />
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
              <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#334155' }}>
                Password *
              </label>
              <Link to="/driver/forgot-password" style={{ fontSize: '0.75rem', color: '#2C3480', fontWeight: 600, textDecoration: 'none' }}>
                Forgot Password?
              </Link>
            </div>
            <div style={{ position: 'relative' }}>
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                leftIcon={<Lock size={15} color="#64748b" />}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#94a3b8'
                }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8125rem', color: '#475569', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              Remember my session
            </label>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="md"
            style={{ width: '100%', backgroundColor: '#2C3480', borderColor: '#2C3480', fontWeight: 700 }}
            rightIcon={<ArrowRight size={16} />}
          >
            Sign In to Driver Portal
          </Button>
        </form>

        <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column', gap: '0.75rem', textAlign: 'center', fontSize: '0.8125rem' }}>
          <div>
            <span style={{ color: '#64748b' }}>New commercial driver? </span>
            <Link to="/driver/register" style={{ color: '#2C3480', fontWeight: 700, textDecoration: 'none' }}>
              Register Here
            </Link>
          </div>
          <div>
            <Link to="/driver/application-status" style={{ color: '#f59e0b', fontWeight: 600, textDecoration: 'none' }}>
              Check Application Verification Status →
            </Link>
          </div>
        </div>
      </div>

      {/* Demonstration Scenario Switcher Box */}
      <div
        style={{
          width: '100%',
          maxWidth: '460px',
          marginTop: '1.5rem',
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          border: '1px dashed #cbd5e1',
          padding: '1rem'
        }}
      >
        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: '0.5rem', textAlign: 'center' }}>
          Interactive Demo Scenarios (1-Click Switch)
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
          <button
            type="button"
            onClick={() => handleQuickDemo('approved')}
            style={{
              padding: '0.45rem',
              borderRadius: '6px',
              border: '1px solid #bbf7d0',
              backgroundColor: '#f0fdf4',
              color: '#166534',
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              justifyContent: 'center'
            }}
          >
            <UserCheck size={13} /> Approved Driver
          </button>
          <button
            type="button"
            onClick={() => handleQuickDemo('pending')}
            style={{
              padding: '0.45rem',
              borderRadius: '6px',
              border: '1px solid #fed7aa',
              backgroundColor: '#fff7ed',
              color: '#9a3412',
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              justifyContent: 'center'
            }}
          >
            <Clock size={13} /> Pending Review
          </button>
          <button
            type="button"
            onClick={() => handleQuickDemo('rejected')}
            style={{
              padding: '0.45rem',
              borderRadius: '6px',
              border: '1px solid #fecaca',
              backgroundColor: '#fef2f2',
              color: '#991b1b',
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              justifyContent: 'center'
            }}
          >
            <XCircle size={13} /> Rejected Driver
          </button>
          <button
            type="button"
            onClick={() => handleQuickDemo('docs_required')}
            style={{
              padding: '0.45rem',
              borderRadius: '6px',
              border: '1px solid #fef08a',
              backgroundColor: '#fefce8',
              color: '#854d0e',
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              justifyContent: 'center'
            }}
          >
            <FileQuestion size={13} /> Docs Required
          </button>
        </div>
      </div>
    </div>
  );
}

export default DriverLogin;
