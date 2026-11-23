import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Compass, ArrowLeft, Phone, Lock, CheckCircle2, ArrowRight } from 'lucide-react';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useToast } from '../../context/ToastContext';

export function DriverForgotPassword() {
  const navigate = useNavigate();
  const toast = useToast();

  const [step, setStep] = useState(1);
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSendOtp = (e) => {
    e.preventDefault();
    if (!phone.trim()) {
      toast.error('Please enter your registered phone number');
      return;
    }
    toast.success('Security OTP sent to ' + phone);
    setStep(2);
  };

  const handleResetPassword = (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    toast.success('Password reset successfully! Please sign in.');
    navigate('/driver/login');
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
              justifyContent: 'center'
            }}
          >
            <Compass size={24} />
          </div>
          <span style={{ fontSize: '1.375rem', fontWeight: 800, color: '#0f172a' }}>
            MAK TOURS & TRAVELS
          </span>
        </div>
        <p style={{ fontSize: '0.875rem', color: '#64748b' }}>
          Driver Portal Password Recovery
        </p>
      </div>

      <div
        style={{
          width: '100%',
          maxWidth: '440px',
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05)',
          padding: '2rem'
        }}
      >
        <div style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>
            Reset Password
          </h2>
          <p style={{ fontSize: '0.8125rem', color: '#64748b', marginTop: '0.25rem' }}>
            {step === 1 ? 'Enter your registered mobile number to receive an OTP' : 'Enter the 4-digit code sent to your phone and choose a new password'}
          </p>
        </div>

        {step === 1 ? (
          <form onSubmit={handleSendOtp} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                Registered Phone Number *
              </label>
              <Input
                placeholder="e.g. 9840122345"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                leftIcon={<Phone size={15} color="#64748b" />}
              />
            </div>

            <Button type="submit" variant="primary" size="md" style={{ backgroundColor: '#2C3480', borderColor: '#2C3480', fontWeight: 700 }}>
              Send Verification OTP
            </Button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                Enter OTP (Demo: 1234) *
              </label>
              <Input
                placeholder="4-digit OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                New Password *
              </label>
              <Input
                type="password"
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                leftIcon={<Lock size={15} color="#64748b" />}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                Confirm New Password *
              </label>
              <Input
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                leftIcon={<Lock size={15} color="#64748b" />}
              />
            </div>

            <Button type="submit" variant="primary" size="md" style={{ backgroundColor: '#10b981', borderColor: '#10b981', fontWeight: 700 }}>
              Set New Password & Sign In
            </Button>
          </form>
        )}

        <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
          <Link to="/driver/login" style={{ fontSize: '0.8125rem', color: '#2C3480', fontWeight: 600, textDecoration: 'none' }}>
            ← Back to Driver Login
          </Link>
        </div>
      </div>
    </div>
  );
}

export default DriverForgotPassword;
