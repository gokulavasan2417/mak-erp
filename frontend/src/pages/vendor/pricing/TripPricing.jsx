// MAK Tours & Travels ERP - Vendor Trip Type Pricing Rules
// CRITICAL: ONE WAY TRIP MUST NOT EXIST ANYWHERE IN THIS APPLICATION.
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Compass,
  ArrowLeft,
  CheckCircle,
  Edit,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { Card, CardHeader, CardBody } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Modal } from '../../../components/ui/Modal';
import { useVendorData } from '../../../context/VendorDataContext';

export function TripPricing() {
  const navigate = useNavigate();
  const { pricing, updateTripPricing } = useVendorData();

  const [editTrip, setEditTrip] = useState(null);
  const [basePackageRate, setBasePackageRate] = useState('');
  const [extraKmRate, setExtraKmRate] = useState('');
  const [driverAllowance, setDriverAllowance] = useState('');

  const handleOpenEdit = (tp) => {
    setEditTrip(tp);
    setBasePackageRate(String(tp.basePackageRate || tp.minKmPerDay || 3000));
    setExtraKmRate(String(tp.extraKmRate || tp.basePerKmRate || 18));
    setDriverAllowance(String(tp.driverAllowance || tp.driverAllowancePerDay || 400));
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!editTrip) return;

    updateTripPricing(editTrip.tripType, {
      basePackageRate: parseFloat(basePackageRate) || editTrip.basePackageRate,
      extraKmRate: parseFloat(extraKmRate) || editTrip.extraKmRate,
      driverAllowance: parseInt(driverAllowance) || editTrip.driverAllowance
    });

    setEditTrip(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
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
            Standard Journey Package Rules
          </h1>
          <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0.25rem 0 0' }}>
            Configure standard package packages for Local 8h/80km rentals, Outstation Round Trips and Airport Transfers
          </p>
        </div>

        <Button
          variant="primary"
          style={{ backgroundColor: '#2C3480' }}
          onClick={() => navigate('/vendor/pricing/vehicles')}
        >
          Vehicle Rate Cards →
        </Button>
      </div>

      {/* Rules Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
        {pricing.tripTypes.map((tp, idx) => (
          <div
            key={idx}
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
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#16a34a', backgroundColor: '#dcfce7', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                  {tp.category}
                </span>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', margin: '0.4rem 0 0.15rem' }}>
                  {tp.tripType}
                </h3>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleOpenEdit(tp)}
              >
                <Edit size={14} />
              </Button>
            </div>

            <div style={{ backgroundColor: '#f8fafc', padding: '0.85rem', borderRadius: '10px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.825rem' }}>
              {tp.basePackageRate && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Base Package Fare:</span>
                  <span style={{ fontWeight: 800, color: '#0f172a' }}>₹{tp.basePackageRate}</span>
                </div>
              )}
              {tp.includedKm && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Included Distance / Time:</span>
                  <span style={{ fontWeight: 700, color: '#334155' }}>{tp.includedKm} KM {tp.includedHours ? `(${tp.includedHours} Hrs)` : ''}</span>
                </div>
              )}
              {tp.minKmPerDay && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Outstation Min Run:</span>
                  <span style={{ fontWeight: 700, color: '#334155' }}>{tp.minKmPerDay} KM / Day</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Extra KM Rate:</span>
                <span style={{ fontWeight: 700, color: '#334155' }}>₹{tp.extraKmRate || tp.basePerKmRate} / KM</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Driver Allowance / Bata:</span>
                <span style={{ fontWeight: 700, color: '#334155' }}>₹{tp.driverAllowance || tp.driverAllowancePerDay} / day</span>
              </div>
            </div>

            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 'auto' }}>
              Toll / Parking / State Permit: <strong>{tp.parkingHandling || tp.statePermitHandling || 'At Actuals / Fastag'}</strong>
            </div>
          </div>
        ))}
      </div>

      {/* Edit Modal */}
      <Modal
        isOpen={Boolean(editTrip)}
        onClose={() => setEditTrip(null)}
        title={`Edit Trip Rule: ${editTrip?.tripType}`}
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', width: '100%' }}>
            <Button variant="outline" onClick={() => setEditTrip(null)}>Cancel</Button>
            <Button variant="primary" style={{ backgroundColor: '#2C3480' }} onClick={handleSave}>
              Save Rule
            </Button>
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
              Base Package Amount (₹)
            </label>
            <input
              type="number"
              value={basePackageRate}
              onChange={(e) => setBasePackageRate(e.target.value)}
              style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.875rem' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
              Extra KM Surcharge (₹)
            </label>
            <input
              type="number"
              value={extraKmRate}
              onChange={(e) => setExtraKmRate(e.target.value)}
              style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.875rem' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
              Driver Allowance / Bata (₹)
            </label>
            <input
              type="number"
              value={driverAllowance}
              onChange={(e) => setDriverAllowance(e.target.value)}
              style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.875rem' }}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default TripPricing;
