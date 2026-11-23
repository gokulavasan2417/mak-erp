import React, { useState } from 'react';
import { Layers, Plus, Download, SlidersHorizontal, Search, Sparkles } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card, CardBody } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Breadcrumbs } from './Breadcrumbs';

export function ModulePlaceholder({
  title,
  subtitle,
  portal = 'admin',
  badgeText = 'Module Scaffolded',
  stats = [],
  tabs = ['Overview', 'Active', 'History', 'Configuration']
}) {
  const [activeTab, setActiveTab] = React.useState(tabs[0]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Top Header & Actions */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: '1rem'
        }}
      >
        <div>
          <Breadcrumbs portal={portal} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.5rem' }}>
            <h1 style={{ fontSize: '1.625rem', fontWeight: 700, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
              {title}
            </h1>
            <Badge variant="primary" size="sm">
              <Sparkles size={11} style={{ marginRight: '0.25rem' }} />
              {badgeText}
            </Badge>
          </div>
          {subtitle && (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
              {subtitle}
            </p>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Button variant="secondary" size="sm" leftIcon={<Download size={14} />}>
            Export
          </Button>
          <Button variant="primary" size="sm" leftIcon={<Plus size={14} />}>
            New Entry
          </Button>
        </div>
      </div>

      {/* Optional Stats Highlights */}
      {stats.length > 0 && (
        <div className="grid-cols-4">
          {stats.map((stat, i) => (
            <Card key={i}>
              <div style={{ padding: '1.25rem' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500, textTransform: 'uppercase' }}>
                  {stat.label}
                </span>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '0.25rem' }}>
                  {stat.value}
                </div>
                {stat.note && (
                  <span style={{ fontSize: '0.75rem', color: 'var(--status-success)', marginTop: '0.25rem', display: 'block' }}>
                    {stat.note}
                  </span>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Filter & Search Bar */}
      <Card>
        <CardBody style={{ padding: '1rem 1.25rem' }}>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem'
            }}
          >
            {/* Tabs */}
            <div style={{ display: 'flex', gap: '0.25rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.25rem' }}>
              {tabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{
                    padding: '0.5rem 0.875rem',
                    fontSize: '0.8125rem',
                    fontWeight: 500,
                    border: 'none',
                    background: 'none',
                    cursor: 'pointer',
                    color: activeTab === tab ? 'var(--color-primary)' : 'var(--text-muted)',
                    borderBottom: activeTab === tab ? '2px solid var(--color-primary)' : '2px solid transparent',
                    transition: 'all var(--transition-fast)'
                  }}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Search and Filters */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ width: '220px' }}>
                <Input placeholder="Filter records..." leftIcon={<Search size={15} />} />
              </div>
              <Button variant="secondary" size="sm" leftIcon={<SlidersHorizontal size={14} />}>
                Filter
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Main Scaffold Area */}
      <Card>
        <CardBody style={{ padding: '3.5rem 2rem', textAlign: 'center' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: 'var(--color-primary-light)',
              color: 'var(--color-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.25rem auto'
            }}
          >
            <Layers size={32} />
          </div>

          <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
            {title} Component Architecture Initialized
          </h3>

          <p style={{ color: 'var(--text-muted)', maxWidth: '520px', margin: '0 auto 1.5rem auto', fontSize: '0.875rem', lineHeight: 1.6 }}>
            This route is mapped to <code>/{portal}/{title.toLowerCase().replace(/\s+/g, '-')}</code>.
            The frontend layout, route guards, navigation active states, and design system tokens are operational.
            API endpoints and database models will connect during backend milestone integration.
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem' }}>
            <Button variant="secondary" size="sm">
              View Design Schema
            </Button>
            <Button variant="primary" size="sm">
              Prepare Schema Model
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

export default ModulePlaceholder;
