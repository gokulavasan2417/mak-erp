import React, { useState } from 'react';
import {
  Bell,
  Lock,
  Sliders,
  Shield,
  Smartphone,
  Save,
  CheckCircle2,
  Mail,
  Moon,
  Clock
} from 'lucide-react';
import { Breadcrumbs } from '../../../components/common/Breadcrumbs';
import { Card, CardHeader, CardBody, CardFooter } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { useToast } from '../../../context/ToastContext';
import { VendorNavTabs, VENDOR_PROFILE_TABS } from '../../../components/vendor/VendorNavTabs';

export function VendorSettings() {
  const toast = useToast();

  const [notifications, setNotifications] = useState({
    emailBookings: true,
    smsBookings: true,
    emailPayments: true,
    smsPayments: true,
    complianceReminders: true,
    promotionalNotices: false
  });

  const [dispatchSettings, setDispatchSettings] = useState({
    autoRejectNotice: true,
    minLeadHours: '3',
    maxTripRadiusKm: '650',
    nightDrivingAllowed: true,
    weekendAutoAccept: false
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const handleSaveNotifications = (e) => {
    e.preventDefault();
    toast.success('Notification preferences updated successfully');
  };

  const handleSaveDispatch = (e) => {
    e.preventDefault();
    toast.success('Dispatch operational rules updated');
  };

  const handlePasswordChange = (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    toast.success('Password changed successfully');
    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '900px', margin: '0 auto' }}>
      <VendorNavTabs tabs={VENDOR_PROFILE_TABS} />
      {/* Header */}
      <div>
        <Breadcrumbs portal="vendor" />
        <h1 style={{ fontSize: '1.625rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '0.25rem' }}>
          Vendor Portal Settings & Preferences
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          Configure dispatch automation, real-time alert triggers, and credential security.
        </p>
      </div>

      {/* Notification Preferences */}
      <Card>
        <CardHeader
          title="Notification Channels & Alerts"
          subtitle="Select which events trigger instant SMS and email notifications"
        />
        <CardBody style={{ padding: '1.5rem' }}>
          <form onSubmit={handleSaveNotifications} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-main)' }}>
                    New Booking Dispatch Requests
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Immediate alert when MAK operations assigns a trip manifest to your agency
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.8125rem' }}>
                    <input
                      type="checkbox"
                      checked={notifications.emailBookings}
                      onChange={(e) => setNotifications({ ...notifications, emailBookings: e.target.checked })}
                    />
                    Email
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.8125rem' }}>
                    <input
                      type="checkbox"
                      checked={notifications.smsBookings}
                      onChange={(e) => setNotifications({ ...notifications, smsBookings: e.target.checked })}
                    />
                    SMS / WhatsApp
                  </label>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border-light)', paddingTop: '1rem' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-main)' }}>
                    Payment & Remittance Advice
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Bank UTR confirmation when accounts transfers earnings to your registered HDFC account
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.8125rem' }}>
                    <input
                      type="checkbox"
                      checked={notifications.emailPayments}
                      onChange={(e) => setNotifications({ ...notifications, emailPayments: e.target.checked })}
                    />
                    Email
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.8125rem' }}>
                    <input
                      type="checkbox"
                      checked={notifications.smsPayments}
                      onChange={(e) => setNotifications({ ...notifications, smsPayments: e.target.checked })}
                    />
                    SMS / WhatsApp
                  </label>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border-light)', paddingTop: '1rem' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-main)' }}>
                    Statutory Expiry Warnings (&lt; 30 Days)
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Pre-emptive reminders before vehicle Insurance, Fitness, or driver DL expires
                  </div>
                </div>
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.8125rem' }}>
                    <input
                      type="checkbox"
                      checked={notifications.complianceReminders}
                      onChange={(e) => setNotifications({ ...notifications, complianceReminders: e.target.checked })}
                    />
                    Enabled
                  </label>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
              <Button type="submit" variant="primary" size="sm" leftIcon={<Save size={14} />}>
                Save Notification Rules
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>

      {/* Dispatch Rules */}
      <Card>
        <CardHeader
          title="Fleet Dispatch Preferences"
          subtitle="Set automated operational criteria for incoming trip allocations"
        />
        <CardBody style={{ padding: '1.5rem' }}>
          <form onSubmit={handleSaveDispatch} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.375rem' }}>
                  Minimum Lead Notice Before Pickup (Hours)
                </label>
                <Input
                  type="number"
                  value={dispatchSettings.minLeadHours}
                  onChange={(e) => setDispatchSettings({ ...dispatchSettings, minLeadHours: e.target.value })}
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem', display: 'block' }}>
                  Trip requests with less notice will be flagged for review
                </span>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.375rem' }}>
                  Maximum Outstation Radius (KM)
                </label>
                <Input
                  type="number"
                  value={dispatchSettings.maxTripRadiusKm}
                  onChange={(e) => setDispatchSettings({ ...dispatchSettings, maxTripRadiusKm: e.target.value })}
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem', display: 'block' }}>
                  Maximum distance preference from Chennai base hub
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', paddingTop: '0.5rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--text-main)', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={dispatchSettings.nightDrivingAllowed}
                  onChange={(e) => setDispatchSettings({ ...dispatchSettings, nightDrivingAllowed: e.target.checked })}
                />
                Accept journeys departing during night hours (10:00 PM – 06:00 AM) with standard night bata surcharge
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--text-main)', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={dispatchSettings.autoRejectNotice}
                  onChange={(e) => setDispatchSettings({ ...dispatchSettings, autoRejectNotice: e.target.checked })}
                />
                Alert dispatch supervisor via WhatsApp if request remains unacknowledged for &gt; 15 minutes
              </label>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
              <Button type="submit" variant="primary" size="sm" leftIcon={<Save size={14} />}>
                Save Dispatch Rules
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>

      {/* Security & Password */}
      <Card>
        <CardHeader
          title="Account Security & Password"
          subtitle="Update login credentials for Apex Fleet Solutions partner account"
        />
        <CardBody style={{ padding: '1.5rem' }}>
          <form onSubmit={handlePasswordChange} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '450px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.375rem' }}>
                Current Password
              </label>
              <Input
                type="password"
                placeholder="••••••••"
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.375rem' }}>
                New Password
              </label>
              <Input
                type="password"
                placeholder="••••••••"
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.375rem' }}>
                Confirm New Password
              </label>
              <Input
                type="password"
                placeholder="••••••••"
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-start', marginTop: '0.5rem' }}>
              <Button type="submit" variant="secondary" size="sm" leftIcon={<Lock size={14} />}>
                Update Security Password
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}

export default VendorSettings;
