import React, { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { TenantProvider } from './context/TenantContext';
import { ToastProvider } from './context/ToastContext';
import { TripProvider } from './context/TripContext';
import { DriverDataProvider } from './context/DriverDataContext';
import { VendorDataProvider } from './context/VendorDataContext';
import { AdminDataProvider } from './context/AdminDataContext';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { AppRoutes } from './routes/AppRoutes';

// Ensure browser LocalStorage mock caches are completely purged for direct database reflection
const CLEAN_SLATE_VERSION = 'mak_clean_slate_db_ready_v13';
if (typeof window !== 'undefined') {
  try {
    // Purge legacy pseudo-tokens that cause 401 unauthorized errors
    const currentToken = localStorage.getItem('mak_erp_auth_token');
    if (currentToken && currentToken.startsWith('MAK_JWT_')) {
      localStorage.removeItem('mak_erp_auth_token');
    }

    if (localStorage.getItem('mak_data_version') !== CLEAN_SLATE_VERSION) {
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (
          key &&
          key !== 'mak_erp_auth_user' &&
          key !== 'mak_erp_auth_token' &&
          key !== 'mak_erp_active_portal' &&
          (key.startsWith('mak_') || key.startsWith('driver_') || key.startsWith('vendor_'))
        ) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((k) => localStorage.removeItem(k));
      localStorage.removeItem('mak_staff_profile_cache');
      localStorage.setItem('mak_data_version', CLEAN_SLATE_VERSION);
    }
  } catch (e) {
    console.warn('LocalStorage cache reset error:', e);
  }
}

export function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <TenantProvider>
            <ToastProvider>
              <TripProvider>
                <VendorDataProvider>
                  <DriverDataProvider>
                    <AdminDataProvider>
                      <BrowserRouter useTransitions={false}>
                        <AppRoutes />
                      </BrowserRouter>
                    </AdminDataProvider>
                  </DriverDataProvider>
                </VendorDataProvider>
              </TripProvider>
            </ToastProvider>
          </TenantProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
