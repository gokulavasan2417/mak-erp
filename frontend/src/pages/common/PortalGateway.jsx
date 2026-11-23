import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Compass,
  Shield,
  Briefcase,
  Car,
  Truck,
  ArrowRight,
  ExternalLink,
  CheckCircle2,
  Lock
} from 'lucide-react';
import { Card, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { useAuth } from '../../hooks/useAuth';

export function PortalGateway() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleInstantDemoLogin = (portal) => {
    login({ role: portal });
    navigate(`/${portal}/dashboard`);
  };

  const portals = [
    {
      id: 'super-admin',
      title: 'Super Admin Portal',
      subtitle: 'System Governance & Multi-Tenant Security',
      description: 'Root access for platform configurations, user identity provisioning, role privilege matrices, and security audit log streams.',
      loginPath: '/super-admin/login',
      dashboardPath: '/super-admin/dashboard',
      icon: Shield,
      accentColor: '#2C3480',
      badge: 'Tier 1 Access',
      badgeVariant: 'primary',
      keyRoutes: ['/super-admin/users', '/super-admin/roles', '/super-admin/audit-logs']
    },
    {
      id: 'admin',
      title: 'Admin Operations Portal',
      subtitle: 'Fleet Logistics & Tour Reservations',
      description: 'Complete operational command for tour manifests, vehicle fleet allocations, driver duty rosters, CRM accounts, and billing ledgers.',
      loginPath: '/admin/login',
      dashboardPath: '/admin/dashboard',
      icon: Briefcase,
      accentColor: '#2C3480',
      badge: 'Operations Hub',
      badgeVariant: 'primary',
      keyRoutes: ['/admin/bookings', '/admin/fleet', '/admin/drivers', '/admin/finance']
    },
    {
      id: 'driver',
      title: 'Driver Portal',
      subtitle: 'Mobile-Optimized Duty & Navigation Companion',
      description: 'Touch-friendly interface for commercial drivers to view active trip coordinates, call passengers, start/complete shifts, and view earnings.',
      loginPath: '/driver/login',
      dashboardPath: '/driver/dashboard',
      icon: Car,
      accentColor: '#10b981',
      badge: 'Mobile-First',
      badgeVariant: 'success',
      keyRoutes: ['/driver/my-trips', '/driver/trip-details', '/driver/documents']
    },
    {
      id: 'vendor',
      title: 'Vendor Partner Portal',
      subtitle: 'Fleet Supply & Contractor Settlements',
      description: 'Dedicated portal for third-party bus operators, taxi owners, and agencies to track attached vehicles, monthly invoices, and payout advice.',
      loginPath: '/vendor/login',
      dashboardPath: '/vendor/dashboard',
      icon: Truck,
      accentColor: '#f59e0b',
      badge: 'Partner Network',
      badgeVariant: 'warning',
      keyRoutes: ['/vendor/bookings', '/vendor/invoices', '/vendor/payments']
    },
  ];

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: 'var(--bg-app)',
        backgroundImage: 'radial-gradient(ellipse at top, rgba(44, 52, 128, 0.08) 0%, transparent 60%)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '2rem 1.5rem'
      }}
    >
      {/* Brand Hero */}
      <div style={{ maxWidth: '1200px', width: '100%', margin: '0 auto', textAlign: 'center', paddingTop: '1.5rem', marginBottom: '2.5rem' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.625rem',
            padding: '0.5rem 1rem',
            borderRadius: 'var(--radius-full)',
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-medium)',
            boxShadow: 'var(--shadow-sm)',
            marginBottom: '1.25rem'
          }}
        >
          <Compass size={20} style={{ color: 'var(--color-primary)' }} />
          <span style={{ fontSize: '0.8125rem', fontWeight: 700, letterSpacing: '0.05em', color: 'var(--text-main)' }}>
            MAK TOURS AND TRAVELS &bull; ERP SUITE
          </span>
        </div>

        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.03em', lineHeight: 1.2 }}>
          Four Dedicated Enterprise Portals
        </h1>
        <p style={{ fontSize: '1.125rem', color: 'var(--text-secondary)', maxWidth: '650px', margin: '0.75rem auto 0 auto', lineHeight: 1.5 }}>
          Select a portal below to access its independent login screen or launch an instant simulated test session.
        </p>
      </div>

      {/* 4 Portals Grid */}
      <div
        style={{
          maxWidth: '1200px',
          width: '100%',
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(270px, 1fr))',
          gap: '1.5rem'
        }}
      >
        {portals.map((p) => {
          const Icon = p.icon;
          return (
            <Card key={p.id} style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <CardBody style={{ padding: '1.75rem 1.5rem', display: 'flex', flexDirection: 'column', height: '100%' }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                  <div
                    style={{
                      width: '46px',
                      height: '46px',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'var(--bg-app)',
                      color: p.accentColor,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '1px solid var(--border-light)'
                    }}
                  >
                    <Icon size={24} />
                  </div>
                  <Badge variant={p.badgeVariant} size="sm">
                    {p.badge}
                  </Badge>
                </div>

                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.25rem' }}>
                  {p.title}
                </h3>
                <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: p.accentColor, marginBottom: '0.75rem' }}>
                  {p.subtitle}
                </div>

                <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', lineHeight: 1.5, flex: 1, marginBottom: '1.25rem' }}>
                  {p.description}
                </p>

                {/* Key Routes list */}
                <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '0.75rem', marginBottom: '1.25rem' }}>
                  <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    Available Routes:
                  </span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem', marginTop: '0.375rem' }}>
                    {p.keyRoutes.map((r, i) => (
                      <code
                        key={i}
                        style={{
                          fontSize: '0.6875rem',
                          backgroundColor: 'var(--bg-app)',
                          padding: '0.125rem 0.375rem',
                          borderRadius: '3px',
                          color: 'var(--text-secondary)'
                        }}
                      >
                        {r.split('/')[2]}
                      </code>
                    ))}
                  </div>
                </div>

                {/* Dual Action Buttons */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <Button
                    variant="outline"
                    size="sm"
                    style={{ width: '100%' }}
                    rightIcon={<ArrowRight size={14} />}
                    onClick={() => navigate(p.loginPath)}
                  >
                    Go to {p.title.split(' ')[0]} Login
                  </Button>

                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleInstantDemoLogin(p.id)}
                    style={{ width: '100%' }}
                  >
                    Quick Launch Demo
                  </Button>
                </div>
              </CardBody>
            </Card>
          );
        })}
      </div>

      {/* Footer Info */}
      <div style={{ textAlign: 'center', marginTop: '3rem', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
        MAK Tours and Travels ERP &bull; Frontend Architecture Initialized &bull; Mock Authentication Active
      </div>
    </div>
  );
}

export default PortalGateway;
