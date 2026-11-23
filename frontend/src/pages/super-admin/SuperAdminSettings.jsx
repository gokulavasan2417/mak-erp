import React, { useState, useEffect } from 'react';
import { Breadcrumbs } from '../../components/common/Breadcrumbs';
import { Card, CardHeader, CardBody, CardFooter } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Shield, Key, Mail, Database, Save, CheckCircle, RefreshCw } from 'lucide-react';
import { superAdminService } from '../../services/superAdminService';

export function SuperAdminSettings() {
  const [activeTab, setActiveTab] = useState('security');
  const [settings, setSettings] = useState({
    sessionTimeout: 45,
    mfaEnforced: true,
    maxLoginAttempts: 5,
    smtpHost: 'smtp.sendgrid.net',
    smtpPort: 587,
    smtpSender: 'noreply@saas-erp.com',
    backupFrequency: 'Daily (02:00 UTC)',
    auditRetentionDays: 365,
    rateLimitPerMinute: 300
  });
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await superAdminService.getGlobalSettings();
        if (res?.data?.data) {
          setSettings(prev => ({ ...prev, ...res.data.data }));
        }
      } catch (err) {
        // Fallback to defaults
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setSavedSuccess(false);
    try {
      await superAdminService.updateGlobalSettings(settings);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to save settings:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const tabs = [
    { id: 'security', label: 'Security & Auth', icon: Shield },
    { id: 'email', label: 'Email (SMTP)', icon: Mail },
    { id: 'database', label: 'Database & Retention', icon: Database },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '1000px' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
        <div>
          <Breadcrumbs portal="super-admin" />
          <h1 style={{ fontSize: '1.625rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '0.5rem' }}>
            Global SaaS Settings &amp; Governance
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Multi-Tenant platform configurations, global token lifetimes, encryption parameters, and system defaults.
          </p>
        </div>

        {savedSuccess && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#16a34a', fontWeight: 600, fontSize: '0.875rem' }}>
            <CheckCircle size={18} />
            Settings Saved Successfully
          </div>
        )}
      </div>

      {/* Tabs Header */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border-light)' }}>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1.25rem',
                border: 'none',
                background: 'transparent',
                borderBottom: isActive ? '2px solid var(--color-primary)' : '2px solid transparent',
                color: isActive ? 'var(--color-primary)' : 'var(--text-muted)',
                fontWeight: isActive ? 600 : 500,
                cursor: 'pointer',
                fontSize: '0.875rem'
              }}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      <form onSubmit={handleSave}>
        {activeTab === 'security' && (
          <Card>
            <CardHeader
              title="Platform Authentication & Security Defaults"
              subtitle="Applies universally across all tenant sub-accounts"
            />
            <CardBody style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.375rem', color: 'var(--text-main)' }}>
                    Session Timeout (Minutes)
                  </label>
                  <input
                    type="number"
                    value={settings.sessionTimeout}
                    onChange={(e) => setSettings({ ...settings, sessionTimeout: Number(e.target.value) })}
                    style={{ width: '100%', padding: '0.625rem 0.875rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', backgroundColor: 'var(--bg-surface)' }}
                  />
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Idle time before user re-authentication is required</span>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.375rem', color: 'var(--text-main)' }}>
                    Max Failed Login Attempts
                  </label>
                  <input
                    type="number"
                    value={settings.maxLoginAttempts}
                    onChange={(e) => setSettings({ ...settings, maxLoginAttempts: Number(e.target.value) })}
                    style={{ width: '100%', padding: '0.625rem 0.875rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', backgroundColor: 'var(--bg-surface)' }}
                  />
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Account locked temporarily if threshold exceeded</span>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.375rem', color: 'var(--text-main)' }}>
                  API Gateway Rate Limit (Requests / Minute / IP)
                </label>
                <input
                  type="number"
                  value={settings.rateLimitPerMinute}
                  onChange={(e) => setSettings({ ...settings, rateLimitPerMinute: Number(e.target.value) })}
                  style={{ width: '100%', padding: '0.625rem 0.875rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', backgroundColor: 'var(--bg-surface)' }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.875rem', backgroundColor: 'var(--bg-surface-hover)', borderRadius: 'var(--radius-md)' }}>
                <input
                  type="checkbox"
                  id="mfa"
                  checked={settings.mfaEnforced}
                  onChange={(e) => setSettings({ ...settings, mfaEnforced: e.target.checked })}
                  style={{ width: '1.125rem', height: '1.125rem', accentColor: 'var(--color-primary)' }}
                />
                <label htmlFor="mfa" style={{ cursor: 'pointer', fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-main)' }}>
                  Enforce Two-Factor Authentication (2FA) for all Company Admins and Super Admins
                </label>
              </div>
            </CardBody>
            <CardFooter style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--border-light)', padding: '1rem 1.5rem' }}>
              <Button type="submit" variant="primary" isLoading={isSaving} leftIcon={<Save size={15} />}>
                Save Security Settings
              </Button>
            </CardFooter>
          </Card>
        )}

        {activeTab === 'email' && (
          <Card>
            <CardHeader
              title="Global SaaS Transactional Email (SMTP)"
              subtitle="Sends onboarding invitations, password resets, and license alert emails"
            />
            <CardBody style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.25rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.375rem', color: 'var(--text-main)' }}>
                    SMTP Host
                  </label>
                  <input
                    type="text"
                    value={settings.smtpHost}
                    onChange={(e) => setSettings({ ...settings, smtpHost: e.target.value })}
                    style={{ width: '100%', padding: '0.625rem 0.875rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', backgroundColor: 'var(--bg-surface)' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.375rem', color: 'var(--text-main)' }}>
                    SMTP Port
                  </label>
                  <input
                    type="number"
                    value={settings.smtpPort}
                    onChange={(e) => setSettings({ ...settings, smtpPort: Number(e.target.value) })}
                    style={{ width: '100%', padding: '0.625rem 0.875rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', backgroundColor: 'var(--bg-surface)' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.375rem', color: 'var(--text-main)' }}>
                  Platform Sender Email Address
                </label>
                <input
                  type="email"
                  value={settings.smtpSender}
                  onChange={(e) => setSettings({ ...settings, smtpSender: e.target.value })}
                  style={{ width: '100%', padding: '0.625rem 0.875rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', backgroundColor: 'var(--bg-surface)' }}
                />
              </div>
            </CardBody>
            <CardFooter style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--border-light)', padding: '1rem 1.5rem' }}>
              <Button type="submit" variant="primary" isLoading={isSaving} leftIcon={<Save size={15} />}>
                Save Email Settings
              </Button>
            </CardFooter>
          </Card>
        )}

        {activeTab === 'database' && (
          <Card>
            <CardHeader
              title="Database Partitioning & Compliance Retention"
              subtitle="Multi-tenant storage rules and backup schedules"
            />
            <CardBody style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.375rem', color: 'var(--text-main)' }}>
                  Compliance Audit Retention (Days)
                </label>
                <input
                  type="number"
                  value={settings.auditRetentionDays}
                  onChange={(e) => setSettings({ ...settings, auditRetentionDays: Number(e.target.value) })}
                  style={{ width: '100%', padding: '0.625rem 0.875rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', backgroundColor: 'var(--bg-surface)' }}
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Audit logs older than this are archived to cold storage</span>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.375rem', color: 'var(--text-main)' }}>
                  Automated Cloud Snapshot Schedule
                </label>
                <input
                  type="text"
                  value={settings.backupFrequency}
                  disabled
                  style={{ width: '100%', padding: '0.625rem 0.875rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', backgroundColor: 'var(--bg-surface-hover)', cursor: 'not-allowed' }}
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Managed by MongoDB Atlas High-Availability Clusters</span>
              </div>
            </CardBody>
            <CardFooter style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--border-light)', padding: '1rem 1.5rem' }}>
              <Button type="submit" variant="primary" isLoading={isSaving} leftIcon={<Save size={15} />}>
                Save Retention Settings
              </Button>
            </CardFooter>
          </Card>
        )}
      </form>
    </div>
  );
}

export default SuperAdminSettings;