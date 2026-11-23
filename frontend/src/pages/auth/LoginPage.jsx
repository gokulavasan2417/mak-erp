import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import {
  Building2,
  Shield,
  Truck,
  Car,
  Calculator,
  UserCheck,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import './LoginPage.css';

const portalsConfig = [
  { id: 'company_admin', title: 'Company Admin', icon: Building2, defaultEmail: 'admin@maktours.com', defaultPass: 'admin123' },
  { id: 'super_admin', title: 'Super Admin', icon: Shield, defaultEmail: 'superadmin@maktours.com', defaultPass: 'super123' },
  { id: 'accountant', title: 'Accountant', icon: Calculator, defaultEmail: 'finance@maktours.com', defaultPass: 'finance123' },
  { id: 'driver', title: 'Driver', icon: Car, defaultEmail: 'driver@maktours.com', defaultPass: 'driver123' },
  { id: 'vendor', title: 'Vendor', icon: Truck, defaultEmail: 'vendor@apexfleet.in', defaultPass: 'vendor123' },
  { id: 'employee', title: 'Staff', icon: UserCheck, defaultEmail: 'staff@maktours.com', defaultPass: 'staff123' }
];

export const LoginPage = ({ initialRole = null, initialMode = 'signin' }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { login, register, getPortalHome } = useAuth();

  // Mode: isSignUp true when sliding panel is shifted to show Sign Up form
  const [isSignUp, setIsSignUp] = useState(
    initialMode === 'signup' || location.pathname.includes('/signup')
  );

  // Determine initial role based on URL query param, path, or prop
  const getInitialPortal = () => {
    if (initialRole) return initialRole;
    try {
      const params = new URLSearchParams(location.search);
      const roleParam = params.get('role');
      if (roleParam) {
        if (roleParam === 'super-admin' || roleParam === 'super_admin') return 'super_admin';
        if (roleParam === 'admin' || roleParam === 'company_admin') return 'company_admin';
        if (roleParam === 'driver') return 'driver';
        if (roleParam === 'vendor') return 'vendor';
        if (roleParam === 'accountant' || roleParam === 'finance') return 'accountant';
        if (roleParam === 'staff' || roleParam === 'employee') return 'employee';
      }
    } catch {}
    if (location.pathname.includes('super-admin')) return 'super_admin';
    if (location.pathname.includes('driver')) return 'driver';
    if (location.pathname.includes('vendor')) return 'vendor';
    if (location.pathname.includes('staff')) return 'employee';
    return 'company_admin';
  };

  const initialRoleChoice = getInitialPortal();

  // Sign In State
  const [signInPortal, setSignInPortal] = useState(initialRoleChoice);
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');
  const [showSignInPassword, setShowSignInPassword] = useState(false);
  const [signInRemember, setSignInRemember] = useState(true);
  const [signInLoading, setSignInLoading] = useState(false);
  const [signInError, setSignInError] = useState('');
  const [signInSuccess, setSignInSuccess] = useState('');

  // Sign Up State - Synchronized with initial role choice
  const [signUpRole, setSignUpRole] = useState(initialRoleChoice);
  const [signUpName, setSignUpName] = useState('');
  const [signUpCompany, setSignUpCompany] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPhone, setSignUpPhone] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [signUpConfirmPassword, setSignUpConfirmPassword] = useState('');
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);
  const [showSignUpConfirmPassword, setShowSignUpConfirmPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [signUpLoading, setSignUpLoading] = useState(false);
  const [signUpError, setSignUpError] = useState('');
  const [signUpSuccess, setSignUpSuccess] = useState('');

  // Auto-fill demo credentials on role change (Sign In) and sync to Sign Up
  const handleSelectRole = (roleId) => {
    setSignInPortal(roleId);
    setSignUpRole(roleId); // Keep synchronized across both Sign In and Sign Up
    setSignInError('');
    setSignUpError('');
    const config = portalsConfig.find(p => p.id === roleId);
    if (config) {
      setSignInEmail(config.defaultEmail);
      setSignInPassword(config.defaultPass);
    }
  };

  // Role change on Sign Up - if driver is chosen, navigate directly to dedicated driver registration
  const handleSelectSignUpRole = (roleId) => {
    if (roleId === 'driver') {
      navigate('/driver/register');
      return;
    }
    setSignUpRole(roleId);
    setSignInPortal(roleId); // Keep synchronized across both Sign In and Sign Up
    setSignUpError('');
    setSignInError('');
    const config = portalsConfig.find(p => p.id === roleId);
    if (config) {
      setSignInEmail(config.defaultEmail);
      setSignInPassword(config.defaultPass);
    }
  };

  useEffect(() => {
    // Pre-populate demo credentials on mount
    const currentConfig = portalsConfig.find(p => p.id === signInPortal);
    if (currentConfig && !signInEmail) {
      setSignInEmail(currentConfig.defaultEmail);
      setSignInPassword(currentConfig.defaultPass);
    }
  }, [signInPortal]);

  useEffect(() => {
    try {
      const params = new URLSearchParams(location.search);
      const roleParam = params.get('role');
      if (roleParam) {
        const mappedRole =
          roleParam === 'super-admin'
            ? 'super_admin'
            : roleParam === 'admin'
            ? 'company_admin'
            : roleParam;
        handleSelectRole(mappedRole);
      }
    } catch {}
  }, [location.search]);

  // Handle Switch To Sign Up - new drivers navigate directly to driver registration
  const handleSwitchToSignUp = () => {
    if (signInPortal === 'driver') {
      navigate('/driver/register');
      return;
    }
    setIsSignUp(true);
    setSignUpRole(signInPortal);
    setSignInError('');
    setSignInSuccess('');
  };

  // Handle Switch To Sign In - strictly preserve the currently selected role
  const handleSwitchToSignIn = () => {
    setIsSignUp(false);
    setSignInPortal(signUpRole);
    const config = portalsConfig.find(p => p.id === signUpRole);
    if (config) {
      setSignInEmail(config.defaultEmail);
      setSignInPassword(config.defaultPass);
    }
    setSignUpError('');
    setSignUpSuccess('');
  };

  // Handle Sign In Submit
  const handleSignInSubmit = async (e) => {
    e.preventDefault();
    setSignInError('');
    setSignInSuccess('');

    if (!signInEmail.trim() || !signInPassword) {
      setSignInError('Please enter both your email address and password.');
      return;
    }

    setSignInLoading(true);
    try {
      const loggedUser = await login({
        email: signInEmail.trim(),
        password: signInPassword,
        role: signInPortal
      });
      const destination = getPortalHome(loggedUser?.role || signInPortal, loggedUser);
      navigate(destination, { replace: true });
    } catch (err) {
      setSignInError(
        err.message || 'Invalid credentials. Please verify your email and password.'
      );
    } finally {
      setSignInLoading(false);
    }
  };

  // Handle Sign Up Submit
  const handleSignUpSubmit = async (e) => {
    e.preventDefault();
    if (signUpRole === 'driver') {
      navigate('/driver/register');
      return;
    }
    setSignUpError('');
    setSignUpSuccess('');

    if (!signUpName.trim()) {
      setSignUpError('Please enter your full name.');
      return;
    }
    if (!signUpEmail.trim()) {
      setSignUpError('Please enter a valid work email address.');
      return;
    }
    if (!signUpPassword) {
      setSignUpError('Please enter a password.');
      return;
    }
    if (signUpPassword.length < 6) {
      setSignUpError('Password must be at least 6 characters.');
      return;
    }
    if (signUpPassword !== signUpConfirmPassword) {
      setSignUpError('Passwords do not match. Please verify.');
      return;
    }
    if (!agreeTerms) {
      setSignUpError('Please accept the Terms & Conditions to proceed.');
      return;
    }

    setSignUpLoading(true);
    try {
      await register({
        name: signUpName.trim(),
        companyName: signUpCompany.trim(),
        email: signUpEmail.trim(),
        phone: signUpPhone.trim(),
        password: signUpPassword,
        role: signUpRole
      });

      setSignUpSuccess('Account successfully registered in MAK ERP!');
      setSignInEmail(signUpEmail.trim());
      setSignInPassword(signUpPassword);
      setSignInPortal(signUpRole);

      setSignUpName('');
      setSignUpCompany('');
      setSignUpEmail('');
      setSignUpPhone('');
      setSignUpPassword('');
      setSignUpConfirmPassword('');

      setTimeout(() => {
        handleSwitchToSignIn();
        setSignInSuccess('Account created! Please sign in with your credentials.');
      }, 900);
    } catch (err) {
      setSignUpError(err.message || 'Registration failed. Please check details.');
    } finally {
      setSignUpLoading(false);
    }
  };

  return (
    <div className="login-page-wrapper">
      {/* Ambient background glows */}
      <div className="login-glow-1" />
      <div className="login-glow-2" />

      {/* Main Sliding Double Card Container */}
      <div className={`login-double-card ${isSignUp ? 'is-signup' : ''}`}>
        
        {/* ========================================================================= */}
        {/* SIGN UP FORM CONTAINER (Appears on the right in desktop when active)       */}
        {/* ========================================================================= */}
        <div className={`login-form-container login-signup-panel ${isSignUp ? 'active-block' : ''}`}>
          <div className="login-form-inner">
            <h2 className="login-form-title">
              Create Account
            </h2>

            {/* Role picker pills - all roles available and synchronized */}
            <div className="login-role-pills">
              {portalsConfig.map((p) => {
                const isSelected = signUpRole === p.id;
                const Icon = p.icon;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleSelectSignUpRole(p.id)}
                    className={`login-role-pill ${isSelected ? 'active' : 'inactive'}`}
                  >
                    <Icon size={12} />
                    <span>{p.title}</span>
                  </button>
                );
              })}
            </div>

            {/* Driver registration quick shortcut if driver chosen */}
            {signUpRole === 'driver' ? (
              <div style={{ padding: '1.25rem 0.5rem', textAlign: 'center' }}>
                <div
                  style={{
                    width: '52px',
                    height: '52px',
                    borderRadius: '14px',
                    backgroundColor: '#EEF0FD',
                    color: '#2C3480',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 1rem',
                    boxShadow: '0 4px 14px rgba(44, 52, 128, 0.15)'
                  }}
                >
                  <Car size={26} />
                </div>

                <h3 style={{ fontSize: '1.1875rem', fontWeight: 800, color: '#0F172A', margin: '0 0 0.5rem' }}>
                  Commercial Driver Registration
                </h3>

                <p style={{ fontSize: '0.8125rem', color: '#64748B', lineHeight: 1.5, margin: '0 auto 1.25rem', maxWidth: '340px' }}>
                  New drivers must complete statutory verification and upload required documents (Driving License, Aadhaar, PAN, Police Verification &amp; Medical Certificate).
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxWidth: '320px', margin: '0 auto' }}>
                  <button
                    type="button"
                    onClick={() => navigate('/driver/register')}
                    className="login-pill-button"
                    style={{ width: '100%', fontSize: '0.8125rem' }}
                  >
                    CONTINUE TO DRIVER REGISTER &rarr;
                  </button>

                  <button
                    type="button"
                    onClick={handleSwitchToSignIn}
                    style={{
                      background: 'none',
                      border: '1px solid #CBD5E1',
                      borderRadius: '9999px',
                      padding: '0.5rem 1rem',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      color: '#334155',
                      cursor: 'pointer'
                    }}
                  >
                    Already have an account? Sign In Directly
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Social Icons matching Pinterest design */}
                <div className="login-social-row">
                  <button type="button" className="login-social-btn" title="Sign up with Google">
                    <svg width="16" height="16" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                    </svg>
                  </button>
                  <button type="button" className="login-social-btn" title="Sign up with Facebook">
                    <svg width="16" height="16" fill="#1877F2" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                  </button>
                  <button type="button" className="login-social-btn" title="Sign up with LinkedIn">
                    <svg width="16" height="16" fill="#0A66C2" viewBox="0 0 24 24">
                      <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                    </svg>
                  </button>
                </div>

                <span className="login-sub-divider">
                  or use your email for registration
                </span>

                {/* Error / Success Feedback */}
                {signUpError && (
                  <div style={{ marginBottom: '0.625rem', padding: '0.5rem', borderRadius: '12px', backgroundColor: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '0.375rem', textAlign: 'left' }}>
                    <AlertCircle size={14} style={{ flexShrink: 0 }} />
                    <span>{signUpError}</span>
                  </div>
                )}
                {signUpSuccess && (
                  <div style={{ marginBottom: '0.625rem', padding: '0.5rem', borderRadius: '12px', backgroundColor: '#ECFDF5', border: '1px solid #A7F3D0', color: '#047857', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '0.375rem', textAlign: 'left' }}>
                    <CheckCircle2 size={14} style={{ flexShrink: 0 }} />
                    <span>{signUpSuccess}</span>
                  </div>
                )}

                {/* Signup Form */}
                <form onSubmit={handleSignUpSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', textAlign: 'left' }}>
                  <input
                    type="text"
                    required
                    value={signUpName}
                    onChange={(e) => setSignUpName(e.target.value)}
                    placeholder="Full Name"
                    className="login-input"
                  />

                  <div className="login-input-row">
                    <input
                      type="text"
                      value={signUpCompany}
                      onChange={(e) => setSignUpCompany(e.target.value)}
                      placeholder="Company / Agency"
                      className="login-input"
                    />
                    <input
                      type="tel"
                      value={signUpPhone}
                      onChange={(e) => setSignUpPhone(e.target.value)}
                      placeholder="Phone Number"
                      className="login-input"
                    />
                  </div>

                  <input
                    type="email"
                    required
                    value={signUpEmail}
                    onChange={(e) => setSignUpEmail(e.target.value)}
                    placeholder="Work Email Address"
                    className="login-input"
                  />

                  <div className="login-input-row">
                    <div style={{ position: 'relative' }}>
                      <input
                        type={showSignUpPassword ? 'text' : 'password'}
                        required
                        value={signUpPassword}
                        onChange={(e) => setSignUpPassword(e.target.value)}
                        placeholder="Password"
                        className="login-input"
                        style={{ paddingRight: '1.75rem' }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowSignUpPassword(!showSignUpPassword)}
                        style={{ position: 'absolute', right: '0.5rem', top: '0.55rem', background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}
                      >
                        {showSignUpPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>

                    <div style={{ position: 'relative' }}>
                      <input
                        type={showSignUpConfirmPassword ? 'text' : 'password'}
                        required
                        value={signUpConfirmPassword}
                        onChange={(e) => setSignUpConfirmPassword(e.target.value)}
                        placeholder="Confirm"
                        className="login-input"
                        style={{ paddingRight: '1.75rem' }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowSignUpConfirmPassword(!showSignUpConfirmPassword)}
                        style={{ position: 'absolute', right: '0.5rem', top: '0.55rem', background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}
                      >
                        {showSignUpConfirmPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </div>

                  <div style={{ paddingTop: '0.25rem' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', cursor: 'pointer', fontSize: '11px', color: '#64748B' }}>
                      <input
                        type="checkbox"
                        checked={agreeTerms}
                        onChange={(e) => setAgreeTerms(e.target.checked)}
                        style={{ accentColor: '#2C3480' }}
                      />
                      <span>I agree to MAK ERP Terms &amp; Privacy Policy</span>
                    </label>
                  </div>

                  <div style={{ textAlign: 'center', paddingTop: '0.5rem' }}>
                    <button
                      type="submit"
                      disabled={signUpLoading}
                      className="login-pill-button"
                    >
                      {signUpLoading ? 'CREATING...' : 'SIGN UP'}
                    </button>
                  </div>
                </form>
              </>
            )}

            {/* Mobile switch helper */}
            <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid #F1F5F9', textAlign: 'center' }} className="md-hidden">
              <span style={{ fontSize: '12px', color: '#94A3B8' }}>Already registered? </span>
              <button
                type="button"
                onClick={handleSwitchToSignIn}
                style={{ fontSize: '12px', fontWeight: 700, color: '#2C3480', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                Sign In
              </button>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SIGN IN FORM CONTAINER (Appears on the left in desktop when active)        */}
        {/* ========================================================================= */}
        <div className={`login-form-container login-signin-panel ${!isSignUp ? 'active-block' : ''}`}>
          <div className="login-form-inner">
            <h2 className="login-form-title">
              Sign In
            </h2>

            {/* Role picker chips matching the exact user image */}
            <div className="login-role-pills">
              {portalsConfig.map((p) => {
                const isSelected = signInPortal === p.id;
                const Icon = p.icon;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleSelectRole(p.id)}
                    className={`login-role-pill ${isSelected ? 'active' : 'inactive'}`}
                  >
                    <Icon size={12} />
                    <span>{p.title}</span>
                  </button>
                );
              })}
            </div>

            {/* Social Icons matching design */}
            <div className="login-social-row">
              <button type="button" className="login-social-btn" title="Sign in with Google">
                <svg width="16" height="16" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
              </button>
              <button type="button" className="login-social-btn" title="Sign in with Facebook">
                <svg width="16" height="16" fill="#1877F2" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </button>
              <button type="button" className="login-social-btn" title="Sign in with LinkedIn">
                <svg width="16" height="16" fill="#0A66C2" viewBox="0 0 24 24">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                </svg>
              </button>
            </div>

            <span className="login-sub-divider">
              or use your email account
            </span>

            {/* Error / Success Feedback */}
            {signInError && (
              <div style={{ marginBottom: '0.75rem', padding: '0.5rem', borderRadius: '12px', backgroundColor: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '0.375rem', textAlign: 'left' }}>
                <AlertCircle size={14} style={{ flexShrink: 0 }} />
                <span>{signInError}</span>
              </div>
            )}
            {signInSuccess && (
              <div style={{ marginBottom: '0.75rem', padding: '0.5rem', borderRadius: '12px', backgroundColor: '#ECFDF5', border: '1px solid #A7F3D0', color: '#047857', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '0.375rem', textAlign: 'left' }}>
                <CheckCircle2 size={14} style={{ flexShrink: 0 }} />
                <span>{signInSuccess}</span>
              </div>
            )}

            {/* Sign In Form */}
            <form onSubmit={handleSignInSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', textAlign: 'left' }}>
              <div>
                <input
                  type="email"
                  required
                  value={signInEmail}
                  onChange={(e) => setSignInEmail(e.target.value)}
                  placeholder="Enter E-mail"
                  className="login-input"
                />
              </div>

              <div style={{ position: 'relative' }}>
                <input
                  type={showSignInPassword ? 'text' : 'password'}
                  required
                  value={signInPassword}
                  onChange={(e) => setSignInPassword(e.target.value)}
                  placeholder="Enter Password"
                  className="login-input"
                  style={{ paddingRight: '2rem' }}
                />
                <button
                  type="button"
                  onClick={() => setShowSignInPassword(!showSignInPassword)}
                  style={{ position: 'absolute', right: '0.625rem', top: '0.625rem', background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}
                >
                  {showSignInPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px', paddingTop: '0.25rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: '#64748B', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={signInRemember}
                    onChange={(e) => setSignInRemember(e.target.checked)}
                    style={{ accentColor: '#2C3480' }}
                  />
                  <span>Remember me</span>
                </label>
                <button
                  type="button"
                  onClick={() => alert('Please contact administrator to reset password.')}
                  style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: 0 }}
                  onMouseEnter={(e) => e.target.style.color = '#2C3480'}
                  onMouseLeave={(e) => e.target.style.color = '#94A3B8'}
                >
                  Forgot Password?
                </button>
              </div>

              <div style={{ textAlign: 'center', paddingTop: '0.5rem' }}>
                <button
                  type="submit"
                  disabled={signInLoading}
                  className="login-pill-button"
                >
                  {signInLoading ? 'SIGNING IN...' : 'SIGN IN'}
                </button>
              </div>
            </form>

            {/* Mobile switch helper */}
            <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid #F1F5F9', textAlign: 'center' }} className="md-hidden">
              <span style={{ fontSize: '12px', color: '#94A3B8' }}>Don't have an account? </span>
              <button
                type="button"
                onClick={handleSwitchToSignUp}
                style={{ fontSize: '12px', fontWeight: 700, color: '#2C3480', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                Sign Up
              </button>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SLIDING OVERLAY CONTAINER (Desktop Double Slider exactly like Image 2)     */}
        {/* ========================================================================= */}
        <div className="login-overlay-container">
          <div className="login-overlay-inner">
            {/* Soft decorative background circles */}
            <div className="login-overlay-circle-1" />
            <div className="login-overlay-circle-2" />

            {/* OVERLAY LEFT (Shown when sliding to Sign Up form) */}
            <div className="login-overlay-panel login-overlay-left">
              <h2 className="login-overlay-title">
                Welcome Back!
              </h2>
              <p className="login-overlay-desc">
                To keep connected with your fleet &amp; travel bookings, please login with your personal credentials.
              </p>
              <button
                type="button"
                onClick={handleSwitchToSignIn}
                className="login-outline-button"
              >
                SIGN IN
              </button>
            </div>

            {/* OVERLAY RIGHT (Shown when on Sign In form - exactly like Image 2) */}
            <div className="login-overlay-panel login-overlay-right">
              <h2 className="login-overlay-title">
                Hello, Friend!
              </h2>
              <p className="login-overlay-desc">
                Enter your personal details and start your journey with MAK Tours and Travels ERP tours, fleet and accounting operations.
              </p>
              <button
                type="button"
                onClick={handleSwitchToSignUp}
                className="login-outline-button"
              >
                SIGN UP
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default LoginPage;
