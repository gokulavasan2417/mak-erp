// MAK Tours & Travels ERP - Centralized Authentication & Access Control Context
import React, { createContext, useContext, useState, useEffect } from 'react';
import { DEMO_USERS, findDemoUser, verifyUserPassword } from '../constants/demoUsers';
import { useToast } from './ToastContext';
import { authService } from '../services/authService';

export const AuthContext = createContext();

const PORTAL_HOME_MAP = {
  'super_admin': '/super-admin/dashboard',
  'super-admin': '/super-admin/dashboard',
  'company_admin': '/admin/dashboard',
  'admin': '/admin/dashboard',
  'operations': '/admin/dashboard',
  'fleet_manager': '/admin/fleet',
  'finance_admin': '/accountant/dashboard',
  'accountant': '/accountant/dashboard',
  'employee': '/staff/dashboard',
  'staff': '/staff/dashboard',
  'driver': '/driver/dashboard',
  'vendor': '/vendor/dashboard'
};

export function AuthProvider({ children }) {
  const toast = useToast();

  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('mak_erp_auth_user');
      if (!saved) return null;
      const user = JSON.parse(saved);
      // Auto-heal: If user has vendor credentials but role was set to customer, restore vendor role
      if (user?.email && (user.email.includes('vendor') || user.email.includes('apexfleet') || user.email.includes('royaltravels')) && (user.role === 'customer' || !user.role)) {
        user.role = 'vendor';
        user.portal = 'vendor';
        user.vendorId = user.vendorId || 'VND-001';
        localStorage.setItem('mak_erp_auth_user', JSON.stringify(user));
        localStorage.setItem('mak_erp_active_portal', 'vendor');
      }
      // Auto-heal: If user has driver credentials but role was set to customer, restore driver role
      if (user?.email && user.email.includes('driver') && (user.role === 'customer' || !user.role)) {
        user.role = 'driver';
        user.portal = 'driver';
        user.driverBadgeId = user.driverBadgeId || 'DRV-001';
        localStorage.setItem('mak_erp_auth_user', JSON.stringify(user));
        localStorage.setItem('mak_erp_active_portal', 'driver');
      }
      // Auto-heal: If user has staff credentials, restore staff role & portal
      if (
        user?.email &&
        (user.email.includes('staff') ||
          user.employeeCode ||
          user.employeeId ||
          user.role === 'employee' ||
          user.role === 'staff' ||
          user.portal === 'staff' ||
          user.designation === 'Cleaner' ||
          user.designation === 'Tour Coordinator')
      ) {
        user.role = 'staff';
        user.portal = 'staff';
        user.employeeCode = user.employeeCode || 'MAK-EMP-010';
        localStorage.setItem('mak_erp_auth_user', JSON.stringify(user));
        localStorage.setItem('mak_erp_active_portal', 'staff');
      }
      // Auto-heal: If user has accountant / finance credentials, restore accountant role & portal
      if (
        user?.email &&
        (user.email.includes('finance') ||
          user.email.includes('accountant') ||
          user.role === 'accountant' ||
          user.role === 'finance_admin' ||
          user.portal === 'accountant')
      ) {
        user.role = 'accountant';
        user.portal = 'accountant';
        localStorage.setItem('mak_erp_auth_user', JSON.stringify(user));
        localStorage.setItem('mak_erp_active_portal', 'accountant');
      }
      return user;
    } catch {
      return null;
    }
  });

  const [activePortal, setActivePortal] = useState(() => {
    return localStorage.getItem('mak_erp_active_portal') || 'admin';
  });

  const getPortalHome = (role = 'company_admin', user = null) => {
    const active = user || currentUser;
    if (
      active?.portal === 'staff' ||
      active?.role === 'staff' ||
      active?.role === 'employee' ||
      active?.employeeCode ||
      (active?.email && active.email.includes('staff'))
    ) {
      return '/staff/dashboard';
    }
    if (
      active?.portal === 'vendor' ||
      active?.role === 'vendor' ||
      active?.vendorId ||
      (active?.email && (active.email.includes('vendor') || active.email.includes('apexfleet')))
    ) {
      return '/vendor/dashboard';
    }
    if (
      active?.portal === 'driver' ||
      active?.role === 'driver' ||
      active?.driverBadgeId ||
      (active?.email && active.email.includes('driver'))
    ) {
      return '/driver/dashboard';
    }
    if (
      active?.portal === 'accountant' ||
      active?.role === 'accountant' ||
      active?.role === 'finance_admin' ||
      (active?.email && (active.email.includes('finance') || active.email.includes('accountant')))
    ) {
      return '/accountant/dashboard';
    }
    const key = String(role).toLowerCase().replace('-', '_');
    if (key === 'accountant' || key === 'finance_admin') return '/accountant/dashboard';
    if (key.includes('staff') || key.includes('employee')) return '/staff/dashboard';
    if (key.includes('vendor')) return '/vendor/dashboard';
    if (key.includes('driver')) return '/driver/dashboard';
    return PORTAL_HOME_MAP[key] || PORTAL_HOME_MAP[role] || '/admin/dashboard';
  };

  /**
   * Single Canonical Login Signature: login({ email, password, role })
   * Also accepts login(email, password, role) or login(role, credentials) for backward compatibility
   */
  const login = async (arg1, arg2, arg3) => {
    let email = '';
    let password = '';
    let role = '';

    if (typeof arg1 === 'object' && arg1 !== null) {
      // login({ email, password, role })
      email = arg1.email || '';
      password = arg1.password || '';
      role = arg1.role || arg1.portal || '';
    } else if (arg3 !== undefined) {
      // login(email, password, role)
      email = arg1;
      password = arg2;
      role = arg3;
    } else if (typeof arg1 === 'string' && (arg1.includes('@') || arg2?.email)) {
      email = arg1.includes('@') ? arg1 : arg2?.email;
      password = arg2?.password || '';
      role = arg2?.role || arg2?.portal || '';
    } else if (typeof arg1 === 'string') {
      // login(role, credentials)
      role = arg1;
      email = arg2?.email || '';
      password = arg2?.password || '';
    }

    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanPassword = (password || '').trim();

    // 1. Look up in DEMO_USERS single source of truth
    let matchedUser = findDemoUser(cleanEmail);

    // If role provided but email not matched, try finding user by role
    if (!matchedUser && role) {
      const normRole = role.toLowerCase().replace('-', '_');
      matchedUser = DEMO_USERS.find((u) => u.role.toLowerCase() === normRole || u.portal === role);
    }

    if (!matchedUser) {
      const msg = `User with email "${email}" not found. Please use one of the standard demo accounts.`;
      toast.error(msg);
      throw new Error(msg);
    }

    // Verify Password if one was entered
    if (cleanPassword && !verifyUserPassword(matchedUser, cleanPassword)) {
      const msg = 'Invalid credentials. Please verify your password.';
      toast.error(msg);
      throw new Error(msg);
    }

    // Driver approval status enforcement
    if (matchedUser.role === 'driver') {
      const appStatus = matchedUser.approvalStatus || 'Approved';
      if (['Pending Verification', 'Under Review'].includes(appStatus)) {
        toast.info('Your driver account application is currently under verification.');
        matchedUser = { ...matchedUser, redirectUrl: '/driver/application-status' };
      } else if (['Rejected', 'Suspended'].includes(appStatus)) {
        const msg = `Account Access Restricted: Your driver account is ${appStatus}. Contact MAK Dispatch for assistance.`;
        toast.error(msg);
        throw new Error(msg);
      }
    }

    // Authenticate with backend API to obtain signed JWT session token
    let sessionToken = null;
    try {
      const res = await authService.login({ email: cleanEmail, password: cleanPassword, role: matchedUser.role });
      if (res?.token) {
        sessionToken = res.token;
      }
      if (res?.user) {
        const resolvedRole = (res.user.role && res.user.role !== 'customer') ? res.user.role : matchedUser.role;
        const resolvedPortal = (res.user.portal && res.user.portal !== 'customer') ? res.user.portal : matchedUser.portal;
        const resolvedVendorId = res.user.vendorId || matchedUser.vendorId || (matchedUser.role === 'vendor' ? 'VND-001' : undefined);
        const resolvedDriverId = res.user.driverBadgeId || res.user.driverId || matchedUser.driverId || (matchedUser.role === 'driver' ? 'DRV-001' : undefined);

        matchedUser = {
          ...matchedUser,
          ...res.user,
          role: resolvedRole,
          portal: resolvedPortal,
          ...(resolvedVendorId ? { vendorId: resolvedVendorId } : {}),
          ...(resolvedDriverId ? { driverId: resolvedDriverId } : {})
        };
      }
    } catch (err) {
      console.warn('Backend login attempt:', err?.message);
    }

    setCurrentUser(matchedUser);
    setActivePortal(matchedUser.portal);

    try {
      if (sessionToken) {
        localStorage.setItem('mak_erp_auth_token', sessionToken);
      }
      localStorage.setItem('mak_erp_auth_user', JSON.stringify(matchedUser));
      localStorage.setItem('mak_erp_active_portal', matchedUser.portal);
      if (matchedUser.driverId) {
        localStorage.setItem('mak_current_driver_id', matchedUser.driverId);
      }
      if (matchedUser.vendorId) {
        localStorage.setItem('mak_current_vendor_id', matchedUser.vendorId);
      }
    } catch (e) {
      console.warn('LocalStorage error saving auth session:', e);
    }

    toast.success(`Welcome back, ${matchedUser.name}!`);
    return matchedUser;
  };

  const register = async (userData) => {
    const role = userData.role || 'employee';
    const normalizedRole = role.replace('-', '_');

    let backendUser = null;
    let token = null;

    // Call backend API to persist to MongoDB Atlas User & Employee collections
    try {
      const res = await authService.register({
        name: userData.name,
        companyName: userData.companyName,
        email: userData.email,
        phone: userData.phone,
        password: userData.password,
        role: role
      });

      if (res?.user) {
        backendUser = res.user;
        token = res.token;
      }
    } catch (apiErr) {
      console.warn('Backend register error, creating local fallback session:', apiErr.message);
      if (apiErr.message?.includes('already exists') || apiErr.message?.includes('already registered')) {
        throw apiErr;
      }
    }

    const newUser = {
      id: backendUser?.id || backendUser?._id || `USR-${Date.now().toString().slice(-4)}`,
      employeeCode: backendUser?.employeeCode || '',
      name: userData.name,
      company: userData.companyName || 'MAK Partner Agency',
      email: userData.email,
      phone: userData.phone,
      role: role,
      portal: normalizedRole.includes('super')
        ? 'super-admin'
        : normalizedRole.includes('driver')
        ? 'driver'
        : normalizedRole.includes('vendor')
        ? 'vendor'
        : (normalizedRole.includes('employee') || normalizedRole.includes('staff'))
        ? 'staff'
        : 'admin',
      avatar: backendUser?.avatar || (userData.name ? userData.name.substring(0, 2).toUpperCase() : 'NU'),
      ...(backendUser || {})
    };

    if (!token && res?.token) {
      token = res.token;
    }

    setCurrentUser(newUser);
    setActivePortal(newUser.portal);
    try {
      localStorage.setItem('mak_erp_auth_token', token);
      localStorage.setItem('mak_erp_auth_user', JSON.stringify(newUser));
      localStorage.setItem('mak_erp_active_portal', newUser.portal);
      window.dispatchEvent(new CustomEvent('mak_staff_profile_updated', { detail: newUser }));
    } catch (e) {
      console.warn('LocalStorage error on register:', e);
    }

    return newUser;
  };

  // Section 5.3: logout must clear user, role, token and all portal-specific active state
  const logout = () => {
    setCurrentUser(null);
    try {
      localStorage.removeItem('mak_erp_auth_token');
      localStorage.removeItem('mak_erp_auth_user');
      localStorage.removeItem('mak_erp_active_portal');
      localStorage.removeItem('mak_current_driver_id');
      localStorage.removeItem('mak_current_vendor_id');
      localStorage.removeItem('mak_driver_profile');
      localStorage.removeItem('mak_vendor_profile');
      localStorage.removeItem('mak_staff_profile_cache');
      localStorage.removeItem('mak_staff_leaves_cache');
      localStorage.removeItem('mak_staff_punches_cache');
    } catch (e) {
      console.warn('LocalStorage error on logout:', e);
    }
    toast.info('You have been signed out safely.');
  };

  /**
   * Update current user profile fields (name, email, phone, avatar, designation, company, etc.)
   * Persists to MongoDB Atlas, localStorage and immediately notifies Topbar & Sidebar
   */
  const updateUserProfile = async (updatedFields) => {
    if (!currentUser) return false;

    // Ensure RBAC system role and portal are strictly preserved
    const preservedRole = currentUser.role || 'staff';
    const preservedPortal = currentUser.portal || (['staff', 'employee'].includes(preservedRole) ? 'staff' : 'admin');

    // Immediate optimistic local update so UI reflects changes instantly
    const updated = {
      ...currentUser,
      ...updatedFields,
      role: preservedRole,
      portal: preservedPortal
    };

    setCurrentUser(updated);

    let token = localStorage.getItem('mak_erp_auth_token');
    if (token && token.startsWith('MAK_JWT_')) {
      localStorage.removeItem('mak_erp_auth_token');
      token = null;
    }

    try {
      localStorage.setItem('mak_erp_auth_user', JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('mak_staff_profile_updated', { detail: updated }));
    } catch (e) {
      console.warn('LocalStorage error updating user profile:', e);
    }

    // Also update matched user in DEMO_USERS so session switches retain changes
    const demoUser = DEMO_USERS.find(
      (u) => u.email?.toLowerCase() === currentUser.email?.toLowerCase() || u.id === currentUser.id
    );
    if (demoUser) {
      Object.assign(demoUser, updatedFields);
    }

    // Persist to MongoDB Atlas via authenticated PUT /api/auth/me
    try {
      const response = await authService.updateProfile(updatedFields);
      if (response?.user) {
        const incomingRole = String(response.user.role || '').toLowerCase();
        const validSystemRoles = ['staff', 'employee', 'admin', 'company_admin', 'super_admin', 'driver', 'vendor'];
        const normalizedRole = validSystemRoles.includes(incomingRole)
          ? response.user.role
          : preservedRole;

        const syncedUser = {
          ...updated,
          ...response.user,
          role: normalizedRole,
          portal: preservedPortal
        };
        setCurrentUser(syncedUser);
        localStorage.setItem('mak_erp_auth_user', JSON.stringify(syncedUser));
        window.dispatchEvent(new CustomEvent('mak_staff_profile_updated', { detail: syncedUser }));
        if (demoUser) {
          Object.assign(demoUser, { ...response.user, role: normalizedRole, portal: preservedPortal });
        }
      }
      toast.success('Profile updated and saved to database successfully!');
      return true;
    } catch (err) {
      console.warn('Backend updateProfile error, saved locally:', err.message);
      toast.success('Profile updated locally.');
      return true;
    }
  };

  // Synchronize auth user from MongoDB Atlas on mount and handle multi-tab storage events
  useEffect(() => {
    let isMounted = true;

    // Fetch fresh profile from MongoDB Atlas if active session exists
    const syncProfileFromDB = async () => {
      try {
        let token = localStorage.getItem('mak_erp_auth_token');
        if (token && token.startsWith('MAK_JWT_')) {
          localStorage.removeItem('mak_erp_auth_token');
          token = null;
        }

        const savedUser = localStorage.getItem('mak_erp_auth_user');
        const parsed = savedUser ? JSON.parse(savedUser) : null;

        // If no token exists but user session is active, obtain a real signed JWT from backend
        if (!token && parsed?.email) {
          try {
            const loginRes = await authService.login({
              email: parsed.email,
              password: parsed.password || 'MakSecure@2026',
              role: parsed.role || 'admin'
            });
            if (loginRes?.token) {
              token = loginRes.token;
              localStorage.setItem('mak_erp_auth_token', token);
            }
          } catch (_) {}
        }
        if (!token) return;

        const res = await authService.getProfile();
        if (res?.user && isMounted) {
          setCurrentUser((prev) => {
            const preservedRole = prev?.role || 'staff';
            const preservedPortal = prev?.portal || (['staff', 'employee'].includes(preservedRole) ? 'staff' : 'admin');
            const incomingRole = String(res.user.role || '').toLowerCase();
            const validSystemRoles = ['staff', 'employee', 'admin', 'company_admin', 'super_admin', 'driver', 'vendor'];
            const normalizedRole = validSystemRoles.includes(incomingRole)
              ? res.user.role
              : preservedRole;

            const merged = {
              ...(prev || {}),
              ...res.user,
              role: normalizedRole,
              portal: preservedPortal
            };
            localStorage.setItem('mak_erp_auth_user', JSON.stringify(merged));
            return merged;
          });
        }
      } catch (e) {
        // Safe fallback to localStorage if backend is starting up
      }
    };

    syncProfileFromDB();

    const handleSync = (e) => {
      // Only process when auth user was changed from another tab
      if (e.key && e.key !== 'mak_erp_auth_user') return;
      try {
        const saved = localStorage.getItem('mak_erp_auth_user');
        if (saved && isMounted) {
          const parsed = JSON.parse(saved);
          setCurrentUser(parsed);
        }
      } catch (err) {
        console.warn('Error reading synced auth user:', err);
      }
    };

    window.addEventListener('storage', handleSync);
    return () => {
      isMounted = false;
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  // Guard switchPortal: only allowed in development mode (Section 5.3)
  const switchPortal = (newPortal) => {
    if (!import.meta.env.DEV) {
      console.warn('switchPortal is disabled in production builds');
      toast.warning('Portal switcher is disabled in production.');
      return;
    }

    const norm = newPortal.replace('-', '_');
    const user = DEMO_USERS.find((u) => u.portal === newPortal || u.role === norm || u.role === newPortal) || DEMO_USERS[1];
    if (user) {
      setCurrentUser(user);
      setActivePortal(user.portal);
      try {
        localStorage.setItem('mak_erp_auth_user', JSON.stringify(user));
        localStorage.setItem('mak_erp_active_portal', user.portal);
      } catch (e) {
        console.warn('LocalStorage error switching portal:', e);
      }
      toast.info(`Switched to ${user.portalName} demo session`);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        activePortal,
        isAuthenticated: !!currentUser,
        login,
        register,
        logout,
        updateUserProfile,
        switchPortal,
        getPortalHome,
        demoUsers: DEMO_USERS
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export default AuthContext;
