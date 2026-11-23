// MAK Tours & Travels ERP - Vendor Vehicle Pricing Rates
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Tags,
  Car,
  Edit,
  ArrowLeft,
  CheckCircle,
  Percent,
  Plus
} from 'lucide-react';
import { Card, CardHeader, CardBody } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Modal } from '../../../components/ui/Modal';
import { useVendorData } from '../../../context/VendorDataContext';
import { VendorNavTabs, VENDOR_PRICING_TABS } from '../../../components/vendor/VendorNavTabs';

export function VehiclePricing() {
  const navigate = useNavigate();
  const { pricing, updateVehiclePricing } = useVendorData();

  const [editItem, setEditItem] = useState(null);
  const [perKmRate, setPerKmRate] = useState('');
  const [minKmPerDay, setMinKmPerDay] = useState('');
  const [driverBata, setDriverBata] = useState('');
  const [nightCharges, setNightCharges] = useState('');
  const [extraHourRate, setExtraHourRate] = useState('');
  const [tollsPermitRules, setTollsPermitRules] = useState('');

  const handleOpenEdit = (item) => {
    setEditItem(item);
    setPerKmRate(String(item.perKmRate));
    setMinKmPerDay(String(item.minKmPerDay));
    setDriverBata(String(item.driverBata));
    setNightCharges(String(item.nightCharges));
    setExtraHourRate(String(item.extraHourRate));
    setTollsPermitRules(item.tollsPermitRules || 'Customer Payable / Fastag Reimbursed');
  };

  const handleSavePricing = (e) => {
    e.preventDefault();
    if (!editItem) return;

    updateVehiclePricing(editItem.vehicleId, {
      perKmRate: parseFloat(perKmRate) || editItem.perKmRate,
      minKmPerDay: parseInt(minKmPerDay) || editItem.minKmPerDay,
      driverBata: parseInt(driverBata) || editItem.driverBata,
      nightCharges: parseInt(nightCharges) || editItem.nightCharges,
      extraHourRate: parseInt(extraHourRate) || editItem.extraHourRate,
      tollsPermitRules
    });

    setEditItem(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
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
          <button
            onClick={() => navigate('/vendor/pricing')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              background: 'none',
              border: 'none',
              color: '#64748b',
              fontSize: '0.85rem',
              cursor: 'pointer',
              marginBottom: '0.4rem',
              padding: 0
            }}
          >
            <ArrowLeft size={16} /> Back to Pricing Overview
          </button>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
            Vehicle Model Rate Cards
          </h1>
          <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0.25rem 0 0' }}>
            Set standard per-kilometer billing rates, daily minimum run quotas and driver bata per vehicle model
          </p>
        </div>

        <Button
          variant="outline"
          onClick={() => navigate('/vendor/pricing/trips')}
        >
          View Trip Rules →
        </Button>
      </div>

      {/* Pricing Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
        {pricing.vehicles.map((vp) => (
          <div
            key={vp.vehicleId}
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 2px 4px rgba(0,0,0,0.04)',
              padding: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#2C3480', backgroundColor: '#EEF0FD', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                  {vp.category}
                </span>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', margin: '0.4rem 0 0.15rem' }}>
                  {vp.model}
                </h3>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleOpenEdit(vp)}
                title="Edit rate card"
              >
                <Edit size={14} />
              </Button>
            </div>

            {/* Rate Specs Box */}
            <div style={{ backgroundColor: '#f8fafc', padding: '0.85rem', borderRadius: '10px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.825rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Per KM Tariff:</span>
                <span style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.95rem' }}>₹{vp.perKmRate} / KM</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Min KM / Day:</span>
                <span style={{ fontWeight: 700, color: '#334155' }}>{vp.minKmPerDay} KM</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Driver Bata / Day:</span>
                <span style={{ fontWeight: 700, color: '#334155' }}>₹{vp.driverBata}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Night Halt Surcharge:</span>
                <span style={{ fontWeight: 700, color: '#334155' }}>₹{vp.nightCharges}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Extra Hour Charge:</span>
                <span style={{ fontWeight: 700, color: '#334155' }}>₹{vp.extraHourRate} / hr</span>
              </div>
            </div>

            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 'auto' }}>
              Tolls & Permits: <strong>{vp.tollsPermitRules}</strong>
            </div>
          </div>
        ))}
      </div>

      {/* Edit Pricing Modal */}
      <Modal
        isOpen={Boolean(editItem)}
        onClose={() => setEditItem(null)}
        title={`Edit Tariff: ${editItem?.model}`}
        subtitle={`Category: ${editItem?.category}`}
        size="md"
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', width: '100%' }}>
            <Button variant="outline" onClick={() => setEditItem(null)}>Cancel</Button>
            <Button
              type="submit"
              form="vehicle-pricing-form"
              variant="primary"
              style={{ backgroundColor: '#2C3480' }}
            >
              Update Rate Card
            </Button>
          </div>
        }
      >
        <form id="vehicle-pricing-form" onSubmit={handleSavePricing} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                Per KM Rate (₹) *
              </label>
              <input
                type="number"
                value={perKmRate}
                onChange={(e) => setPerKmRate(e.target.value)}
                required
                style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.875rem', fontWeight: 700 }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                Minimum KM / Day *
              </label>
              <input
                type="number"
                value={minKmPerDay}
                onChange={(e) => setMinKmPerDay(e.target.value)}
                required
                style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.875rem' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                Driver Bata / Day (₹)
              </label>
              <input
                type="number"
                value={driverBata}
                onChange={(e) => setDriverBata(e.target.value)}
                style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.875rem' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                Night Charges (₹)
              </label>
              <input
                type="number"
                value={nightCharges}
                onChange={(e) => setNightCharges(e.target.value)}
                style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.875rem' }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
              Extra Hour Charge (₹)
            </label>
            <input
              type="number"
              value={extraHourRate}
              onChange={(e) => setExtraHourRate(e.target.value)}
              style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.875rem' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
              Tolls & State Permit Policy
            </label>
            <input
              type="text"
              value={tollsPermitRules}
              onChange={(e) => setTollsPermitRules(e.target.value)}
              style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.875rem' }}
            />
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default VehiclePricing;
