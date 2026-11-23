// MAK Tours & Travels ERP - Driver Portal Settings
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Settings,
  Bell,
  Lock,
  Globe,
  Save,
  ShieldCheck,
  Moon,
  Smartphone,
  LogOut
} from 'lucide-react';
import { Breadcrumbs } from '../../components/common/Breadcrumbs';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../hooks/useAuth';

export function DriverSettings() {
  const toast = useToast();
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const [notifications, setNotifications] = useState({
    smsTripAssignments: true,
    whatsappReminders: true,
    paymentAlerts: true,
    nightTripAlerts: false
  });

  const [language, setLanguage] = useState('Tamil & English');
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');

  const handleSaveNotifications = (e) => {
    e.preventDefault();
    toast.success('Notification preferences updated successfully');
  };

  const handlePasswordChange = (e) => {
    e.preventDefault();
    if (newPass !== confirmPass) {
      toast.error('New passwords do not match');
      return;
    }
    toast.success('Security password updated');
    setCurrentPass('');
    setNewPass('');
    setConfirmPass('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '850px', margin: '0 auto' }}>
      {/* Header */}
      <div>
        <Breadcrumbs portal="driver" />
        <h1 style={{ fontSize: '1.625rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.25rem' }}>
          Driver Portal Settings
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          Notification delivery preferences, language selections, and account security.
        </p>
      </div>

      {/* Notifications Preferences */}
      <Card>
        <CardHeader title="Trip Alert Preferences" subtitle="Manage mobile SMS and WhatsApp dispatch notifications" />
        <CardBody style={{ padding: '1.5rem' }}>
          <form onSubmit={handleSaveNotifications} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--border-light)', cursor: 'pointer' }}>
              <div>
                <strong style={{ fontSize: '0.875rem', color: 'var(--text-main)' }}>SMS Trip Assignment Alerts</strong>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Instant SMS when Admin allocates a new tour circuit</span>
              </div>
              <input
                type="checkbox"
                checked={notifications.smsTripAssignments}
                onChange={(e) => setNotifications({ ...notifications, smsTripAssignments: e.target.checked })}
              />
            </label>

            <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--border-light)', cursor: 'pointer' }}>
              <div>
                <strong style={{ fontSize: '0.875rem', color: 'var(--text-main)' }}>WhatsApp Itinerary & Pickup Location</strong>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Receive passenger map coordinates via WhatsApp</span>
              </div>
              <input
                type="checkbox"
                checked={notifications.whatsappReminders}
                onChange={(e) => setNotifications({ ...notifications, whatsappReminders: e.target.checked })}
              />
            </label>

            <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0', cursor: 'pointer' }}>
              <div>
                <strong style={{ fontSize: '0.875rem', color: 'var(--text-main)' }}>Payment & Allowance Credits</strong>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Receive bank UTR notifications on money disbursements</span>
              </div>
              <input
                type="checkbox"
                checked={notifications.paymentAlerts}
                onChange={(e) => setNotifications({ ...notifications, paymentAlerts: e.target.checked })}
              />
            </label>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
              <Button type="submit" variant="primary" size="sm" style={{ backgroundColor: '#2C3480', borderColor: '#2C3480' }} leftIcon={<Save size={14} />}>
                Save Alert Settings
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>

      {/* Security & Password */}
      <Card>
        <CardHeader title="Account Security & Password" subtitle="Change login password for the Driver Portal" />
        <CardBody style={{ padding: '1.5rem' }}>
          <form onSubmit={handlePasswordChange} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '420px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                Current Password
              </label>
              <Input
                type="password"
                placeholder="••••••••"
                value={currentPass}
                onChange={(e) => setCurrentPass(e.target.value)}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                New Password
              </label>
              <Input
                type="password"
                placeholder="••••••••"
                value={newPass}
                onChange={(e) => setNewPass(e.target.value)}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                Confirm New Password
              </label>
              <Input
                type="password"
                placeholder="••••••••"
                value={confirmPass}
                onChange={(e) => setConfirmPass(e.target.value)}
              />
            </div>

            <Button type="submit" variant="secondary" size="sm" leftIcon={<Lock size={14} />}>
              Update Password
            </Button>
          </form>
        </CardBody>
      </Card>

      {/* Account Session & Logout */}
      <Card style={{ border: '1px solid #fee2e2', backgroundColor: '#fff5f5' }}>
        <CardBody style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', padding: '1.25rem 1.5rem' }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#991b1b', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <LogOut size={18} color="#dc2626" /> Driver Account &amp; Session
            </div>
            <div style={{ fontSize: '0.8rem', color: '#b91c1c', marginTop: '0.25rem' }}>
              Logged in as <strong>{currentUser?.name || 'Driver'}</strong> ({currentUser?.badgeNumber || currentUser?.id || 'DRV'})
            </div>
          </div>
          <Button
            type="button"
            variant="danger"
            size="sm"
            onClick={handleLogout}
            style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', backgroundColor: '#dc2626', borderColor: '#dc2626', fontWeight: 700 }}
          >
            <LogOut size={15} /> Log Out from Driver Portal
          </Button>
        </CardBody>
      </Card>
    </div>
  );
}

export default DriverSettings;
