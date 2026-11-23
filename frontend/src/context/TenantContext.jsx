// MAK Tours & Travels ERP - Multi-Tenant SaaS Branding & License Context
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';

export const TenantContext = createContext();

export const DEFAULT_MASTER_TENANT = {
  tenantId: 'mak-tours',
  name: 'MAK Tours & Travels',
  legalName: 'MAK Tours & Travels Private Limited',
  slug: 'mak-tours',
  email: 'admin@maktours.com',
  phone: '+91 98401 11000',
  address: '14/2 GST Road, Alandur, Chennai, Tamil Nadu - 600016',
  city: 'Chennai',
  state: 'Tamil Nadu',
  gstin: '33AABCM9821K1ZZ',
  status: 'Active',
  plan: 'Enterprise',
  licenseKey: 'MAK-LIC-2026-ENT-0001',
  licenseStatus: 'Active',
  licenseExpiry: '2035-12-31T00:00:00.000Z',
  enabledModules: [
    'bookings',
    'fleet',
    'drivers',
    'vendors',
    'employees',
    'attendance',
    'payroll',
    'finance',
    'reports',
    'packages'
  ],
  limits: {
    maxUsers: 100,
    maxVehicles: 200,
    maxDrivers: 200,
    maxMonthlyBookings: 10000
  },
  branding: {
    logo: '',
    primaryColor: '#2C3480',
    accentColor: '#EAB308',
    tagline: 'Premier Travels & Fleet Operations',
    invoicePrefix: 'INV-MAK-',
    receiptPrefix: 'RCPT-MAK-',
    bookingPrefix: 'MAK-',
    currency: 'INR',
    currencySymbol: '₹',
    timezone: 'Asia/Kolkata'
  }
};

export function TenantProvider({ children }) {
  const { currentUser } = useAuth();

  const [currentCompany, setCurrentCompany] = useState(() => {
    try {
      const savedTenant = localStorage.getItem('mak_erp_active_tenant');
      if (savedTenant) {
        return JSON.parse(savedTenant);
      }
      if (currentUser?.tenant) {
        return currentUser.tenant;
      }
    } catch (_) {}
    return DEFAULT_MASTER_TENANT;
  });

  // Keep tenant state synchronized with currentUser when user logs in or switches
  useEffect(() => {
    if (currentUser?.tenant) {
      setCurrentCompany((prev) => {
        const updated = {
          ...prev,
          ...currentUser.tenant,
          name: currentUser.tenant.name || currentUser.companyName || prev.name,
          tenantId: currentUser.tenant.tenantId || currentUser.tenantId || prev.tenantId
        };
        try {
          localStorage.setItem('mak_erp_active_tenant', JSON.stringify(updated));
        } catch (_) {}
        return updated;
      });
    } else if (currentUser?.companyName && currentUser.companyName !== 'MAK SaaS Cloud Infrastructure') {
      setCurrentCompany((prev) => ({
        ...prev,
        name: currentUser.companyName,
        tenantId: currentUser.tenantId || prev.tenantId
      }));
    }
  }, [currentUser]);

  const updateBranding = (newBranding) => {
    setCurrentCompany((prev) => {
      const updated = {
        ...prev,
        branding: {
          ...prev.branding,
          ...newBranding
        }
      };
      try {
        localStorage.setItem('mak_erp_active_tenant', JSON.stringify(updated));
      } catch (_) {}
      return updated;
    });
  };

  const isModuleEnabled = (moduleKey) => {
    if (!currentCompany?.enabledModules || !Array.isArray(currentCompany.enabledModules)) {
      return true; // Default permissive
    }
    return currentCompany.enabledModules.includes(moduleKey);
  };

  const isLicenseActive = () => {
    if (!currentCompany) return true;
    if (currentCompany.status !== 'Active') return false;
    if (currentCompany.licenseStatus && currentCompany.licenseStatus !== 'Active') return false;
    if (currentCompany.licenseExpiry) {
      return new Date() <= new Date(currentCompany.licenseExpiry);
    }
    return true;
  };

  return (
    <TenantContext.Provider
      value={{
        currentCompany,
        setCurrentCompany,
        tenantId: currentCompany?.tenantId || 'mak-tours',
        companyName: currentCompany?.name || 'MAK Tours & Travels',
        branding: currentCompany?.branding || DEFAULT_MASTER_TENANT.branding,
        plan: currentCompany?.plan || 'Enterprise',
        status: currentCompany?.status || 'Active',
        isLicenseActive,
        isModuleEnabled,
        updateBranding
      }}
    >
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  const context = useContext(TenantContext);
  if (!context) {
    return {
      currentCompany: DEFAULT_MASTER_TENANT,
      tenantId: 'mak-tours',
      companyName: 'MAK Tours & Travels',
      branding: DEFAULT_MASTER_TENANT.branding,
      plan: 'Enterprise',
      status: 'Active',
      isLicenseActive: () => true,
      isModuleEnabled: () => true,
      updateBranding: () => {}
    };
  }
  return context;
}

export default TenantContext;
