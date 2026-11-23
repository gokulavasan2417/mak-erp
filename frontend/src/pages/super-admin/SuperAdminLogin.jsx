import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Mail, Lock, AlertCircle, ArrowRight, CheckCircle2 } from 'lucide-react';
import { AuthLayout } from '../../layouts/AuthLayout';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardBody } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { useAuth } from '../../hooks/useAuth';

export function SuperAdminLogin() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState('superadmin@maktours.com');
  const [password, setPassword] = useState('supersecret123');
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [forgotMessage, setForgotMessage] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    const errors = {};

    if (!email.trim()) {
      errors.email = 'Administrator email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.email = 'Please enter a valid email address';
    }

    if (!password) {
      errors.password = 'Master password is required';
    } else if (password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    setIsLoading(true);

    // Simulated login
    setTimeout(() => {
      setIsLoading(false);
      login({ email, password, role: 'super-admin' });
      navigate('/super-admin/dashboard');
    }, 700);
  };

  const fillDemo = () => {
    setEmail('superadmin@maktours.com');
    setPassword('supersecret123');
    setFieldErrors({});
    setError('');
  };

  return (
    <AuthLayout portalName="Super Admin Portal">
      <Card style={{ width: '100%', boxShadow: 'var(--shadow-xl)' }}>
        <CardBody style={{ padding: '2.25rem 2rem' }}>
          {/* Portal Title Badge */}
          <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: 'var(--radius-lg)',
                backgroundColor: 'rgba(220, 38, 38, 0.12)',
                color: 'var(--color-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 0.875rem auto'
              }}
            >
              <Shield size={26} />
            </div>

            <Badge variant="danger" size="md" style={{ marginBottom: '0.625rem' }}>
              Root Privileges Required
            </Badge>

            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
              Super Admin Access
            </h1>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              Governance, Tenant Management &amp; System Audits
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div
              style={{
                padding: '0.75rem 1rem',
                backgroundColor: 'var(--status-danger-bg)',
                border: '1px solid var(--status-danger)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--status-danger-text)',
                fontSize: '0.8125rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '1.25rem'
              }}
            >
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          {forgotMessage && (
            <div
              style={{
                padding: '0.75rem 1rem',
                backgroundColor: 'var(--status-info-bg)',
                border: '1px solid var(--status-info)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--status-info-text)',
                fontSize: '0.8125rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '1.25rem'
              }}
            >
              <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
              <span>Password reset instructions sent to security team.</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.125rem' }}>
            <Input
              label="Root Administrator Email"
              type="email"
              name="email"
              placeholder="superadmin@maktours.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={fieldErrors.email}
              leftIcon={<Mail size={16} />}
              required
            />

            <Input
              label="Master Password"
              type="password"
              name="password"
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={fieldErrors.password}
              leftIcon={<Lock size={16} />}
              showPasswordToggle
              required
            />

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  style={{ accentColor: 'var(--color-primary)', width: '15px', height: '15px' }}
                />
                Remember root session
              </label>

              <button
                type="button"
                onClick={() => setForgotMessage(true)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--color-primary)',
                  cursor: 'pointer',
                  fontSize: '0.8125rem',
                  padding: 0
                }}
              >
                Forgot password?
              </button>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isLoading}
              style={{ width: '100%', marginTop: '0.5rem' }}
              rightIcon={<ArrowRight size={16} />}
            >
              Authenticate Super Admin
            </Button>

            {/* Quick Demo Autofill Button */}
            <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '1rem', textAlign: 'center' }}>
              <button
                type="button"
                onClick={fillDemo}
                style={{
                  background: 'none',
                  border: '1px dashed var(--border-medium)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '0.375rem 0.75rem',
                  fontSize: '0.75rem',
                  color: 'var(--text-muted)',
                  cursor: 'pointer'
                }}
              >
                Auto-fill Super Admin Demo Credentials
              </button>
            </div>
          </form>
        </CardBody>
      </Card>
    </AuthLayout>
  );
}

export default SuperAdminLogin;
