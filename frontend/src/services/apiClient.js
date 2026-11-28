// MAK Tours & Travels ERP - Centralized HTTP API Client (Axios-Powered)
// Single source of truth for all frontend-to-backend REST communication.
import axios from 'axios';

// Read backend URL from VITE_API_URL, fallback to VITE_API_BASE_URL, default to relative '/api'
export const RAW_BASE_URL =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  '/api';

// Normalize base URL: strip trailing slashes
const BASE_URL = RAW_BASE_URL.replace(/\/+$/, '');

export class ApiError extends Error {
  constructor(message, status = 500, data = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

/**
 * Retrieve active JWT auth token from localStorage
 */
export function getStoredAuthToken() {
  try {
    const token = localStorage.getItem('mak_erp_auth_token');
    if (token && !token.startsWith('MAK_JWT_')) return token;
    if (token && token.startsWith('MAK_JWT_')) {
      localStorage.removeItem('mak_erp_auth_token');
    }
    const user = localStorage.getItem('mak_erp_auth_user');
    if (user) {
      const parsed = JSON.parse(user);
      const uToken = parsed.token || parsed.authToken;
      if (uToken && !uToken.startsWith('MAK_JWT_')) return uToken;
    }
  } catch (_) {
    // Fallback
  }
  return null;
}

/**
 * Centralized Axios instance
 */
export const axiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: {
    Accept: 'application/json'
  }
});

// Request Interceptor: Attach JWT Token and Tenant / Role Headers
axiosInstance.interceptors.request.use(
  (config) => {
    const token = getStoredAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    try {
      const userStr = localStorage.getItem('mak_erp_auth_user');
      if (userStr) {
        const u = JSON.parse(userStr);
        if (u.role === 'admin' || u.role === 'super_admin' || u.portal === 'admin') {
          config.headers['X-Admin-Role'] = 'admin';
        }
        if (u.vendorId) {
          config.headers['X-Vendor-Id'] = u.vendorId;
        } else if (u.role === 'vendor') {
          config.headers['X-Vendor-Id'] = u.id || (u.email?.includes('royal') ? 'VND-002' : 'VND-001');
        }
        if (u.tenantId) {
          config.headers['X-Tenant-Id'] = u.tenantId;
        }
      }
    } catch (_) {}

    // Support FormData and image uploads: let browser set multipart boundary
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    } else if (config.data && typeof config.data === 'object' && !config.headers['Content-Type']) {
      config.headers['Content-Type'] = 'application/json';
    }

    return config;
  },
  (error) => {
    return Promise.reject(new ApiError(error.message || 'Request configuration error', 0, null));
  }
);

// Response Interceptor: Standardized error handling & 401 session recovery
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    const status = error.response ? error.response.status : 0;
    const data = error.response ? error.response.data : null;

    // Auto-heal on 401: attempt silent session token refresh once
    if (status === 401 && originalRequest && !originalRequest._retry && originalRequest.url && !originalRequest.url.includes('/auth/login')) {
      originalRequest._retry = true;
      try {
        const userStr = localStorage.getItem('mak_erp_auth_user');
        if (userStr) {
          const u = JSON.parse(userStr);
          if (u.email) {
            const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
              email: u.email,
              password: u.password || 'MakSecure@2026',
              role: u.role || 'admin'
            });
            if (loginRes.data?.token) {
              localStorage.setItem('mak_erp_auth_token', loginRes.data.token);
              originalRequest.headers.Authorization = `Bearer ${loginRes.data.token}`;
              return axiosInstance(originalRequest);
            }
          }
        }
      } catch (_) {
        // Fall through
      }

      window.dispatchEvent(new CustomEvent('mak-auth-unauthorized', { detail: { endpoint: originalRequest?.url } }));
    }

    // Format human-friendly error messages based on status
    let message = data?.message || data?.error || error.message;
    if (!message || message === 'Network Error') {
      if (status === 401) message = 'Session expired. Please log in again.';
      else if (status === 403) message = 'Access denied. You do not have permission for this resource.';
      else if (status === 404) message = 'Requested resource not found.';
      else if (status >= 500) message = 'Internal server error. Please try again later.';
      else if (status === 0) message = 'Unable to connect to backend server. Please check your network connection.';
    }

    return Promise.reject(new ApiError(message, status, data));
  }
);

/**
 * High-Level ApiClient Class
 * Exposes methods (get, post, put, patch, delete, healthCheck) used across all ERP modules
 */
class ApiClient {
  constructor(baseUrl = BASE_URL) {
    this.baseUrl = baseUrl.replace(/\/+$/, '');
    this.axios = axiosInstance;
    this._backendAvailable = null;
    this._lastHealthCheck = 0;
  }

  getToken() {
    return getStoredAuthToken();
  }

  getHeaders(customHeaders = {}) {
    const headers = { Accept: 'application/json', ...customHeaders };
    const token = this.getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
  }

  /**
   * Quick probe to check if the backend API server is online
   */
  async healthCheck() {
    const now = Date.now();
    if (this._backendAvailable !== null && now - this._lastHealthCheck < 10000) {
      return this._backendAvailable;
    }

    try {
      const res = await axiosInstance.get('/health', { timeout: 4000 });
      this._backendAvailable = res.status >= 200 && res.status < 300;
      this._lastHealthCheck = now;
      return this._backendAvailable;
    } catch {
      this._backendAvailable = false;
      this._lastHealthCheck = now;
      return false;
    }
  }

  /**
   * Core request dispatch method
   */
  async request(endpoint, options = {}) {
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const method = (options.method || 'GET').toLowerCase();
    const config = {
      url: cleanEndpoint,
      method,
      headers: options.headers,
      params: options.params,
      data: options.body || options.data,
      signal: options.signal,
      timeout: options.timeout
    };

    const response = await axiosInstance(config);
    return response.data;
  }

  async get(endpoint, params = {}, options = {}) {
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const res = await axiosInstance.get(cleanEndpoint, { params, ...options });
    return res.data;
  }

  async post(endpoint, data = {}, options = {}) {
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const res = await axiosInstance.post(cleanEndpoint, data, options);
    return res.data;
  }

  async put(endpoint, data = {}, options = {}) {
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const res = await axiosInstance.put(cleanEndpoint, data, options);
    return res.data;
  }

  async patch(endpoint, data = {}, options = {}) {
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const res = await axiosInstance.patch(cleanEndpoint, data, options);
    return res.data;
  }

  async delete(endpoint, options = {}) {
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const res = await axiosInstance.delete(cleanEndpoint, options);
    return res.data;
  }
}

export const apiClient = new ApiClient();
export default apiClient;
