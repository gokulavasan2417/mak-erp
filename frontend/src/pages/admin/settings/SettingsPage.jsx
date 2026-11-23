// MAK Tours & Travels ERP - System Settings & Enterprise Configuration
import React, { useState } from 'react';
import {
  Building2,
  FileText,
  IndianRupee,
  ShieldCheck,
  Bell,
  Sliders,
  Save,
  CheckCircle2,
  Landmark,
  MapPin,
  Phone,
  Mail,
  Car,
  Truck,
  Percent,
  TrendingUp,
  Wallet,
  ArrowRight,
  LogOut
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardBody } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { useAdminData } from '../../../context/AdminDataContext';
import { useAuth } from '../../../hooks/useAuth';

export function SettingsPage() {
  const { settings, updateSettings } = useAdminData();
  const { currentUser, logout, currentCompany } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const [activeTab, setActiveTab] = useState('company');

  // Company Form State
  const [legalName, setLegalName] = useState(settings.company?.legalName || '');
  const [brandName, setBrandName] = useState(settings.company?.brandName || '');
  const [gstin, setGstin] = useState(settings.company?.gstin || '');
  const [pan, setPan] = useState(settings.company?.pan || '');
  const [cin, setCin] = useState(settings.company?.cin || '');
  const [email, setEmail] = useState(settings.company?.email || '');
  const [supportPhone, setSupportPhone] = useState(settings.company?.supportPhone || '');
  const [emergencyHelpline, setEmergencyHelpline] = useState(settings.company?.emergencyHelpline || '');
  const [addressLine1, setAddressLine1] = useState(settings.company?.headOffice?.addressLine1 || '');
  const [city, setCity] = useState(settings.company?.headOffice?.city || '');
  const [pincode, setPincode] = useState(settings.company?.headOffice?.pincode || '');

  // Invoicing & Banking State
  const [invoicePrefix, setInvoicePrefix] = useState(settings.invoice?.prefix || 'MAK-INV-');
  const [gstRate, setGstRate] = useState(settings.invoice?.gstTaxRatePercent || 5);
  const [sacCode, setSacCode] = useState(settings.invoice?.sacCode || '996601');
  const [paymentTermsDays, setPaymentTermsDays] = useState(settings.invoice?.paymentTermsDays || 15);
  const [bankName, setBankName] = useState(settings.invoice?.bankDetails?.bankName || '');
  const [accountNumber, setAccountNumber] = useState(settings.invoice?.bankDetails?.accountNumber || '');
  const [ifscCode, setIfscCode] = useState(settings.invoice?.bankDetails?.ifscCode || '');
  const [terms, setTerms] = useState(settings.invoice?.termsAndConditions || '');

  // Booking & Extra Charges State
  const [driverBattaDay, setDriverBattaDay] = useState(settings.bookingPolicies?.driverBattaDay || 400);
  const [driverBattaNight, setDriverBattaNight] = useState(settings.bookingPolicies?.driverBattaNight || 600);
  const [waitingChargePerHour, setWaitingChargePerHour] = useState(settings.bookingPolicies?.waitingChargePerHour || 150);
  const [extraKmSedan, setExtraKmSedan] = useState(settings.bookingPolicies?.extraKmRateSedan || 14);
  const [extraKmMpv, setExtraKmMpv] = useState(settings.bookingPolicies?.extraKmRateMpv || 18);
  const [extraKmSuv, setExtraKmSuv] = useState(settings.bookingPolicies?.extraKmRateSuv || 24);
  const [extraKmTempo, setExtraKmTempo] = useState(settings.bookingPolicies?.extraKmRateTempo || 28);

  // Notification Preferences State
  const [emailAlerts, setEmailAlerts] = useState(settings.notificationPreferences?.emailAlerts ?? true);
  const [smsDispatches, setSmsDispatches] = useState(settings.notificationPreferences?.smsDispatches ?? true);
  const [whatsappUpdates, setWhatsappUpdates] = useState(settings.notificationPreferences?.whatsappUpdates ?? true);

  // Vendor Payout % & Driver Compensation State (Managed by Admin)
  const [vendorPayoutPercent, setVendorPayoutPercent] = useState(settings.payoutPolicies?.vendorPayoutPercent || 85);
  const [vendorPayoutTermsDays, setVendorPayoutTermsDays] = useState(settings.payoutPolicies?.vendorPayoutTermsDays || 7);
  const [driverRoundTripPay, setDriverRoundTripPay] = useState(settings.payoutPolicies?.driverRoundTripPay || 1500);
  const [driverTourPackagePay, setDriverTourPackagePay] = useState(settings.payoutPolicies?.driverTourPackagePay || 2500);
  const [driverDayBatta, setDriverDayBatta] = useState(settings.payoutPolicies?.driverDayBatta || 400);
  const [driverNightBatta, setDriverNightBatta] = useState(settings.payoutPolicies?.driverNightBatta || 600);

  const handleSaveCompany = (e) => {
    e.preventDefault();
    updateSettings('company', {
      legalName,
      brandName,
      gstin,
      pan,
      cin,
      email,
      supportPhone,
      emergencyHelpline,
      headOffice: {
        ...settings.company?.headOffice,
        addressLine1,
        city,
        pincode
      }
    });
  };

  const handleSaveInvoice = (e) => {
    e.preventDefault();
    updateSettings('invoice', {
      prefix: invoicePrefix,
      gstTaxRatePercent: Number(gstRate),
      sacCode,
      paymentTermsDays: Number(paymentTermsDays),
      bankDetails: {
        ...settings.invoice?.bankDetails,
        bankName,
        accountNumber,
        ifscCode
      },
      termsAndConditions: terms
    });
  };

  const handleSavePolicies = (e) => {
    e.preventDefault();
    updateSettings('bookingPolicies', {
      driverBattaDay: Number(driverBattaDay),
      driverBattaNight: Number(driverBattaNight),
      waitingChargePerHour: Number(waitingChargePerHour),
      extraKmRateSedan: Number(extraKmSedan),
      extraKmRateMpv: Number(extraKmMpv),
      extraKmRateSuv: Number(extraKmSuv),
      extraKmRateTempo: Number(extraKmTempo)
    });
  };

  const handleSaveNotifications = (e) => {
    e.preventDefault();
    updateSettings('notificationPreferences', {
      emailAlerts,
      smsDispatches,
      whatsappUpdates
    });
  };

  const handleSavePayouts = (e) => {
    e.preventDefault();
    updateSettings('payoutPolicies', {
      vendorPayoutPercent: Number(vendorPayoutPercent),
      vendorPayoutTermsDays: Number(vendorPayoutTermsDays),
      driverRoundTripPay: Number(driverRoundTripPay),
      driverTourPackagePay: Number(driverTourPackagePay),
      driverDayBatta: Number(driverDayBatta),
      driverNightBatta: Number(driverNightBatta)
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: '1050px', margin: '0 auto' }}>
      {/* Header Bar */}
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
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
            Enterprise Settings & Platform Configuration
          </h1>
          <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0.25rem 0 0' }}>
            GST taxation rules, invoice numbering, driver batta slabs, kilometer charges & branding
          </p>
        </div>
      </div>

      {/* Settings Tab Navigation */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>
        {[
          { id: 'company', label: 'Company Profile & GST', icon: Building2 },
          { id: 'payouts', label: 'Vendor % & Driver Payouts', icon: Sliders },
          { id: 'invoice', label: 'Invoice & Banking', icon: FileText },
          { id: 'policies', label: 'Batta & Extra Km Rates', icon: IndianRupee },
          { id: 'cancellation', label: 'Cancellation Policy', icon: ShieldCheck },
          { id: 'notifications', label: 'Alert Preferences', icon: Bell }
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.6rem 1.15rem',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: activeTab === tab.id ? '#2C3480' : 'transparent',
                color: activeTab === tab.id ? '#ffffff' : '#64748b',
                fontWeight: 700,
                fontSize: '0.875rem',
                cursor: 'pointer'
              }}
            >
              <Icon size={16} /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab 1: Company Profile */}
      {activeTab === 'company' && (
        <form onSubmit={handleSaveCompany}>
          <Card>
            <CardHeader
              title="Statutory Legal & Corporate Identity"
              subtitle="Registered company records printed on invoices and contract agreements"
              action={
                <Button type="submit" variant="primary" style={{ backgroundColor: '#2C3480', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Save size={15} /> Save Changes
                </Button>
              }
            />
            <CardBody style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                    Legal Registered Entity Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={legalName}
                    onChange={(e) => setLegalName(e.target.value)}
                    style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.875rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                    Brand / Trading Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={brandName}
                    onChange={(e) => setBrandName(e.target.value)}
                    style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.875rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                    GSTIN (Goods & Services Tax)
                  </label>
                  <input
                    type="text"
                    value={gstin}
                    onChange={(e) => setGstin(e.target.value)}
                    style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.875rem', fontFamily: 'monospace' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                    PAN Number
                  </label>
                  <input
                    type="text"
                    value={pan}
                    onChange={(e) => setPan(e.target.value)}
                    style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.875rem', fontFamily: 'monospace' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                    CIN (Corporate Identity)
                  </label>
                  <input
                    type="text"
                    value={cin}
                    onChange={(e) => setCin(e.target.value)}
                    style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.875rem', fontFamily: 'monospace' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                    Corporate Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.875rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                    Support Desk Landline
                  </label>
                  <input
                    type="text"
                    value={supportPhone}
                    onChange={(e) => setSupportPhone(e.target.value)}
                    style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.875rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                    24x7 SOS Dispatch Helpline
                  </label>
                  <input
                    type="text"
                    value={emergencyHelpline}
                    onChange={(e) => setEmergencyHelpline(e.target.value)}
                    style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.875rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                    Headquarters Street Address
                  </label>
                  <input
                    type="text"
                    value={addressLine1}
                    onChange={(e) => setAddressLine1(e.target.value)}
                    style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.875rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                    City
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.875rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                    PIN Code
                  </label>
                  <input
                    type="text"
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                    style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.875rem' }}
                  />
                </div>
              </div>
            </CardBody>
          </Card>
        </form>
      )}

      {/* Tab: Vendor % & Driver Payout Policies */}
      {activeTab === 'payouts' && (
        <form onSubmit={handleSavePayouts} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <Card>
            <CardHeader
              title="Vendor Commission & Driver Compensation Configuration"
              subtitle="Admin decisions for vendor % share of booking fare, fixed driver compensation per trip type, and commercial expenses"
              action={
                <Button type="submit" variant="primary" style={{ backgroundColor: '#2C3480', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Save size={15} /> Save Payout Policies
                </Button>
              }
            />
            <CardBody style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Row 1: Two Policy Columns */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
                {/* Column 1: Vendor Payout Percentage */}
                <div style={{ backgroundColor: '#fffbeb', border: '1.5px solid #fde68a', borderRadius: '12px', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#fef3c7', color: '#b45309', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Truck size={18} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#78350f', margin: 0 }}>
                        Fleet Vendor Partner Share (%)
                      </h3>
                      <p style={{ fontSize: '0.75rem', color: '#92400e', margin: '0.15rem 0 0' }}>
                        Decided by Admin: % of customer booking fare disbursed to vendor
                      </p>
                    </div>
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                      <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#78350f' }}>
                        Vendor Payout Share Percentage *
                      </label>
                      <span style={{ fontSize: '1.15rem', fontWeight: 800, color: '#b45309' }}>
                        {vendorPayoutPercent}%
                      </span>
                    </div>

                    <input
                      type="range"
                      min="50"
                      max="95"
                      step="1"
                      value={vendorPayoutPercent}
                      onChange={(e) => setVendorPayoutPercent(Number(e.target.value))}
                      style={{ width: '100%', accentColor: '#b45309', cursor: 'pointer' }}
                    />

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#92400e', marginTop: '0.2rem' }}>
                      <span>50% Minimum</span>
                      <span>85% Standard Default</span>
                      <span>95% Maximum</span>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 150px), 1fr))', gap: '0.75rem', backgroundColor: '#ffffff', padding: '0.85rem', borderRadius: '10px', border: '1px solid #fde68a' }}>
                    <div>
                      <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600, display: 'block' }}>VENDOR RECEIVES</span>
                      <strong style={{ fontSize: '1rem', color: '#b45309' }}>{vendorPayoutPercent}%</strong>
                      <span style={{ fontSize: '0.65rem', color: '#94a3b8', display: 'block' }}>of customer fare</span>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600, display: 'block' }}>ADMIN PLATFORM MARGIN</span>
                      <strong style={{ fontSize: '1rem', color: '#16a34a' }}>{100 - vendorPayoutPercent}%</strong>
                      <span style={{ fontSize: '0.65rem', color: '#94a3b8', display: 'block' }}>retained gross profit</span>
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#78350f', marginBottom: '0.35rem' }}>
                      Disbursement Credit Period (Days)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="60"
                      value={vendorPayoutTermsDays}
                      onChange={(e) => setVendorPayoutTermsDays(e.target.value)}
                      style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.875rem' }}
                    />
                  </div>
                </div>

                {/* Column 2: Driver Compensation (Price Amount) */}
                <div style={{ backgroundColor: '#f0fdf4', border: '1.5px solid #bbf7d0', borderRadius: '12px', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#dcfce7', color: '#166534', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <IndianRupee size={18} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#166534', margin: 0 }}>
                        Driver Compensation (Fixed Price ₹)
                      </h3>
                      <p style={{ fontSize: '0.75rem', color: '#15803d', margin: '0.15rem 0 0' }}>
                        Decided by Admin: Fixed price amount per trip type (No % model)
                      </p>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))', gap: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#166534', marginBottom: '0.35rem' }}>
                        Round Trip Driver Pay (₹) *
                      </label>
                      <input
                        type="number"
                        required
                        min="500"
                        step="50"
                        value={driverRoundTripPay}
                        onChange={(e) => setDriverRoundTripPay(e.target.value)}
                        style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: '8px', border: '1.5px solid #86efac', fontSize: '0.95rem', fontWeight: 700, color: '#0f172a' }}
                      />
                      <span style={{ fontSize: '0.6875rem', color: '#15803d', display: 'block', marginTop: '0.2rem' }}>
                        Flat pay for Round Trips
                      </span>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#166534', marginBottom: '0.35rem' }}>
                        Tour Package Driver Pay (₹) *
                      </label>
                      <input
                        type="number"
                        required
                        min="500"
                        step="50"
                        value={driverTourPackagePay}
                        onChange={(e) => setDriverTourPackagePay(e.target.value)}
                        style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: '8px', border: '1.5px solid #86efac', fontSize: '0.95rem', fontWeight: 700, color: '#0f172a' }}
                      />
                      <span style={{ fontSize: '0.6875rem', color: '#15803d', display: 'block', marginTop: '0.2rem' }}>
                        Flat pay for Tour Packages
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))', gap: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                        Daily Day Batta Allowance (₹/day)
                      </label>
                      <input
                        type="number"
                        value={driverDayBatta}
                        onChange={(e) => setDriverDayBatta(e.target.value)}
                        style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.875rem' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                        Night Halt Allowance (₹/night)
                      </label>
                      <input
                        type="number"
                        value={driverNightBatta}
                        onChange={(e) => setDriverNightBatta(e.target.value)}
                        style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.875rem' }}
                      />
                    </div>
                  </div>

                  <div style={{ fontSize: '0.75rem', color: '#15803d', backgroundColor: '#ffffff', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #bbf7d0', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <CheckCircle2 size={15} color="#16a34a" />
                    <span>Statutory Note: One-way trip logic is strictly forbidden. Drivers are paid per designated trip type.</span>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
        </form>
      )}

      {/* Tab 2: Invoicing & Banking */}
      {activeTab === 'invoice' && (
        <form onSubmit={handleSaveInvoice}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: '1.25rem' }}>
            <Card>
              <CardHeader title="Tax Invoice Rules" subtitle="Sequencing & SAC tax categorization" />
              <CardBody style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: '0.75rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                      Invoice Series Prefix
                    </label>
                    <input
                      type="text"
                      value={invoicePrefix}
                      onChange={(e) => setInvoicePrefix(e.target.value)}
                      style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.875rem', fontFamily: 'monospace' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                      GST Tax Rate %
                    </label>
                    <input
                      type="number"
                      value={gstRate}
                      onChange={(e) => setGstRate(e.target.value)}
                      style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.875rem' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: '0.75rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                      SAC HSN Code
                    </label>
                    <input
                      type="text"
                      value={sacCode}
                      onChange={(e) => setSacCode(e.target.value)}
                      style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.875rem', fontFamily: 'monospace' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                      Credit Terms (Days)
                    </label>
                    <input
                      type="number"
                      value={paymentTermsDays}
                      onChange={(e) => setPaymentTermsDays(e.target.value)}
                      style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.875rem' }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                    Invoice Standard Terms & Conditions
                  </label>
                  <textarea
                    rows={4}
                    value={terms}
                    onChange={(e) => setTerms(e.target.value)}
                    style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.8rem', fontFamily: 'inherit' }}
                  />
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardHeader title="Remittance Bank Account" subtitle="Coordinates displayed on client bills" />
              <CardBody style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                    Bank Name & Branch
                  </label>
                  <input
                    type="text"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.875rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                    Current Account Number
                  </label>
                  <input
                    type="text"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.875rem', fontFamily: 'monospace' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                    IFSC Code
                  </label>
                  <input
                    type="text"
                    value={ifscCode}
                    onChange={(e) => setIfscCode(e.target.value)}
                    style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.875rem', fontFamily: 'monospace', textTransform: 'uppercase' }}
                  />
                </div>

                <div style={{ marginTop: 'auto', paddingTop: '1rem' }}>
                  <Button type="submit" variant="primary" style={{ backgroundColor: '#2C3480', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
                    <Save size={15} /> Save Invoicing Settings
                  </Button>
                </div>
              </CardBody>
            </Card>
          </div>
        </form>
      )}

      {/* Tab 3: Policies & Extra Km Rates */}
      {activeTab === 'policies' && (
        <form onSubmit={handleSavePolicies}>
          <Card>
            <CardHeader
              title="Driver Batta & Extra Kilometer Pricing Tiers"
              subtitle="Default pricing rules auto-computed across booking manifests"
              action={
                <Button type="submit" variant="primary" style={{ backgroundColor: '#2C3480', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Save size={15} /> Save Pricing Policies
                </Button>
              }
            />
            <CardBody style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a', margin: '0 0 0.5rem' }}>
                  Driver Daily Allowances (Batta)
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                      Day Trip Batta (INR / Day)
                    </label>
                    <input
                      type="number"
                      value={driverBattaDay}
                      onChange={(e) => setDriverBattaDay(e.target.value)}
                      style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.875rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                      Night Halt Batta (INR / Night)
                    </label>
                    <input
                      type="number"
                      value={driverBattaNight}
                      onChange={(e) => setDriverBattaNight(e.target.value)}
                      style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.875rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                      Idle Waiting Charge (INR / Hour)
                    </label>
                    <input
                      type="number"
                      value={waitingChargePerHour}
                      onChange={(e) => setWaitingChargePerHour(e.target.value)}
                      style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.875rem' }}
                    />
                  </div>
                </div>
              </div>

              <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '1rem' }}>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a', margin: '0 0 0.5rem' }}>
                  Extra Kilometer Overrun Rates (by Vehicle Class)
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                      Sedan (e.g. Dzire / Etios)
                    </label>
                    <input
                      type="number"
                      value={extraKmSedan}
                      onChange={(e) => setExtraKmSedan(e.target.value)}
                      style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.875rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                      MPV (e.g. Ertiga / Innova)
                    </label>
                    <input
                      type="number"
                      value={extraKmMpv}
                      onChange={(e) => setExtraKmMpv(e.target.value)}
                      style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.875rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                      Luxury SUV (e.g. Fortuner)
                    </label>
                    <input
                      type="number"
                      value={extraKmSuv}
                      onChange={(e) => setExtraKmSuv(e.target.value)}
                      style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.875rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                      Tempo Traveller / Urbania
                    </label>
                    <input
                      type="number"
                      value={extraKmTempo}
                      onChange={(e) => setExtraKmTempo(e.target.value)}
                      style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.875rem' }}
                    />
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
        </form>
      )}

      {/* Tab 4: Cancellation Policy */}
      {activeTab === 'cancellation' && (
        <Card>
          <CardHeader
            title="Standard Reservation Cancellation & Refund Matrix"
            subtitle="Applied automatically when dispatchers or clients initiate trip cancellation"
          />
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: '#f8fafc', color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                  <th style={{ padding: '0.875rem 1rem' }}>Cancellation Window</th>
                  <th style={{ padding: '0.875rem 1rem', textAlign: 'center' }}>Refund %</th>
                  <th style={{ padding: '0.875rem 1rem' }}>Applicable Terms / Retained Charges</th>
                </tr>
              </thead>
              <tbody>
                {settings.bookingPolicies?.cancellationPolicy?.map((tier, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '0.875rem 1rem', fontWeight: 700, color: '#0f172a' }}>
                      {tier.hoursBeforePickup}
                    </td>
                    <td style={{ padding: '0.875rem 1rem', textAlign: 'center' }}>
                      <span
                        style={{
                          fontWeight: 800,
                          fontSize: '0.95rem',
                          color: tier.refundPercent >= 75 ? '#16a34a' : tier.refundPercent > 0 ? '#ea580c' : '#dc2626'
                        }}
                      >
                        {tier.refundPercent}% Refund
                      </span>
                    </td>
                    <td style={{ padding: '0.875rem 1rem', color: '#475569' }}>
                      {tier.deductionNote}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Tab 5: Notifications & Preferences */}
      {activeTab === 'notifications' && (
        <form onSubmit={handleSaveNotifications}>
          <Card>
            <CardHeader
              title="Automated Dispatch Alerts & Channel Subscriptions"
              subtitle="Configure notification broadcast across operations channels"
              action={
                <Button type="submit" variant="primary" style={{ backgroundColor: '#2C3480', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Save size={15} /> Save Alert Settings
                </Button>
              }
            />
            <CardBody style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', backgroundColor: '#f8fafc', borderRadius: '8px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={emailAlerts}
                  onChange={(e) => setEmailAlerts(e.target.checked)}
                  style={{ width: '18px', height: '18px', accentColor: '#2C3480' }}
                />
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#0f172a' }}>Email Dispatch Notifications</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Send trip confirmation PDF vouchers to customer & operations in-charge</div>
                </div>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', backgroundColor: '#f8fafc', borderRadius: '8px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={smsDispatches}
                  onChange={(e) => setSmsDispatches(e.target.checked)}
                  style={{ width: '18px', height: '18px', accentColor: '#2C3480' }}
                />
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#0f172a' }}>SMS Driver Coordinates</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Dispatch driver phone number & vehicle registration number 2 hours prior to departure</div>
                </div>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', backgroundColor: '#f8fafc', borderRadius: '8px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={whatsappUpdates}
                  onChange={(e) => setWhatsappUpdates(e.target.checked)}
                  style={{ width: '18px', height: '18px', accentColor: '#2C3480' }}
                />
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#0f172a' }}>WhatsApp Trip Itinerary Broadcast</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Deliver day-wise hotel vouchers & live driver location link to client WhatsApp</div>
                </div>
              </label>
            </CardBody>
          </Card>
        </form>
      )}

      {/* Account Session & Logout */}
      <Card style={{ border: '1px solid #fee2e2', backgroundColor: '#fff5f5', marginTop: '1rem' }}>
        <CardBody style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', padding: '1.25rem 1.5rem' }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#991b1b', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <LogOut size={18} color="#dc2626" /> Account &amp; Session Management
            </div>
            <div style={{ fontSize: '0.8rem', color: '#b91c1c', marginTop: '0.25rem' }}>
              Logged in as <strong>{currentUser?.name || 'Administrator'}</strong> ({currentUser?.role || 'Admin'}) &bull; Company: {currentCompany?.name || 'MAK Tours & Travels'}
            </div>
          </div>
          <Button
            type="button"
            variant="danger"
            size="sm"
            onClick={handleLogout}
            style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', backgroundColor: '#dc2626', borderColor: '#dc2626', fontWeight: 700 }}
          >
            <LogOut size={15} /> Log Out from ERP
          </Button>
        </CardBody>
      </Card>
    </div>
  );
}

export default SettingsPage;
