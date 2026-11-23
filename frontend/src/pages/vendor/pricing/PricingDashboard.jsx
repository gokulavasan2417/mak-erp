// MAK Tours & Travels ERP - Vendor Pricing Management Dashboard
import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Tags,
  Car,
  Compass,
  ArrowRight,
  ShieldCheck,
  Percent,
  CheckCircle2,
  DollarSign
} from 'lucide-react';
import { Card, CardHeader, CardBody } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { useVendorData } from '../../../context/VendorDataContext';
import { VendorNavTabs, VENDOR_PRICING_TABS } from '../../../components/vendor/VendorNavTabs';

export function PricingDashboard() {
  const navigate = useNavigate();
  const { pricing, profile } = useVendorData();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <VendorNavTabs tabs={VENDOR_PRICING_TABS} />
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          backgroundColor: '#ffffff',
          padding: '1.25rem 1.5rem',
          borderRadius: '16px',
          border: '1px solid #e2e8f0'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <Tags size={18} color="#2C3480" />
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#2C3480', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Commercial Tariffs & Rate Cards
            </span>
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
            Pricing & Commercial Management
          </h1>
          <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0.25rem 0 0' }}>
            Configure per-kilometer rates, minimum daily quotas, and commercial vehicle rate cards
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Button
            variant="primary"
            style={{ backgroundColor: '#2C3480' }}
            onClick={() => navigate('/vendor/pricing/vehicles')}
          >
            Vehicle Rate Cards <ArrowRight size={15} style={{ marginLeft: '0.25rem' }} />
          </Button>
        </div>
      </div>

      {/* Contract & Commission Terms Card */}
      <div
        style={{
          backgroundColor: '#EEF0FD',
          borderRadius: '16px',
          border: '1px solid #C7CEFA',
          padding: '1.25rem 1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '0.75rem', borderRadius: '12px', backgroundColor: '#2C3480', color: '#ffffff' }}>
            <Percent size={24} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
              Partner Commission Structure: 10% Flat
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#475569', margin: '0.25rem 0 0' }}>
              Formula: <strong>Vendor Payable = Booking Total - Admin Commission (10%)</strong>. You receive 90% of all assigned booking fares.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: '#16a34a', fontWeight: 700, backgroundColor: '#ffffff', padding: '0.5rem 1rem', borderRadius: '8px' }}>
          <CheckCircle2 size={16} /> Tier-1 Gold Negotiated Term
        </div>
      </div>

      {/* Two Main Sections: Vehicle Pricing & Trip Pricing */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.5rem' }}>
        {/* Card 1: Vehicle Rate Cards */}
        <Card>
          <CardHeader
            title="Vehicle-Wise Commercial Tariffs"
            subtitle="Configured per-KM rates and daily minimums for your 8 fleet units"
          />
          <CardBody style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>
              Set individual billing terms for Toyota Innova Crysta, Force Urbania, Fortuner, and Executive Sedans.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {pricing.vehicles.slice(0, 4).map((vp) => (
                <div
                  key={vp.vehicleId}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.75rem 1rem',
                    backgroundColor: '#f8fafc',
                    borderRadius: '10px',
                    border: '1px solid #e2e8f0'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, color: '#0f172a' }}>{vp.model}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      Min {vp.minKmPerDay} KM/day &bull; Bata: ₹{vp.driverBata}/day
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#2C3480' }}>
                      ₹{vp.perKmRate} <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 500 }}>/ KM</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <Button
              variant="outline"
              onClick={() => navigate('/vendor/pricing/vehicles')}
              style={{ marginTop: '0.5rem' }}
            >
              Manage All Vehicle Rates →
            </Button>
          </CardBody>
        </Card>

        {/* Card 2: Commercial Billing Policies */}
        <Card>
          <CardHeader
            title="Commercial Billing Policies"
            subtitle="Operational rules and payout terms for attached fleet"
          />
          <CardBody style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>
              Vendor vehicles operate on approved commercial rate cards with guaranteed minimum daily utilization.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ padding: '0.75rem 1rem', backgroundColor: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontWeight: 700, color: '#0f172a' }}>Minimum Daily Kilometer Guarantee</div>
                <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.15rem' }}>
                  Vehicles dispatched on outstation itineraries are billed at a minimum of 250 km / 300 km per calendar day.
                </div>
              </div>

              <div style={{ padding: '0.75rem 1rem', backgroundColor: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontWeight: 700, color: '#0f172a' }}>Standard Platform Payout (90%)</div>
                <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.15rem' }}>
                  Vendors receive 90% net of the agreed vehicle contract amount disbursed via fortnightly NEFT.
                </div>
              </div>

              <div style={{ padding: '0.75rem 1rem', backgroundColor: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontWeight: 700, color: '#0f172a' }}>Central Driver Operations</div>
                <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.15rem' }}>
                  Driver assignment and duty dispatch are managed centrally by the MAK Operations Desk.
                </div>
              </div>
            </div>

            <Button
              variant="outline"
              onClick={() => navigate('/vendor/pricing/vehicles')}
              style={{ marginTop: '0.5rem' }}
            >
              Configure Vehicle Rates →
            </Button>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

export default PricingDashboard;
