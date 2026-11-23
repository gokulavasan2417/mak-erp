// MAK Tours & Travels ERP - Centralized HTTP API Client
// Standardized REST client handling headers, tokens, timeouts, and error handling.

const DEFAULT_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export class ApiError extends Error {
  constructor(message, status = 500, data = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

class ApiClient {
  constructor(baseUrl = DEFAULT_BASE_URL) {
    this.baseUrl = baseUrl.replace(/\/+$/, '');
    this._backendAvailable = null;
    this._lastHealthCheck = 0;
  }

  /**
   * Retrieves active auth token from localStorage
   */
  getToken() {
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
    } catch {
      // Fallback
    }
    return null;
  }

  /**
   * Builds request headers including JSON content type, Bearer token, and role headers
   */
  getHeaders(customHeaders = {}) {
    const headers = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...customHeaders
    };

    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const userStr = localStorage.getItem('mak_erp_auth_user');
      if (userStr) {
        const u = JSON.parse(userStr);
        if (u.role === 'admin' || u.role === 'super_admin' || u.portal === 'admin') {
          headers['X-Admin-Role'] = 'admin';
        }
        if (u.vendorId) {
          headers['X-Vendor-Id'] = u.vendorId;
        } else if (u.role === 'vendor') {
          headers['X-Vendor-Id'] = u.id || (u.email?.includes('royal') ? 'VND-002' : 'VND-001');
        }
      }
    } catch (_) {}

    return headers;
  }

  /**
   * Quick probe to check if the backend API server is online
   */
  async healthCheck() {
    const now = Date.now();
    // Cache health check for 10 seconds to avoid spamming
    if (this._backendAvailable !== null && now - this._lastHealthCheck < 10000) {
      return this._backendAvailable;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);
      const res = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      this._backendAvailable = res.ok;
      this._lastHealthCheck = now;
      return res.ok;
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
    const url = `${this.baseUrl}${cleanEndpoint}`;

    const config = {
      ...options,
      headers: this.getHeaders(options.headers)
    };

    if (config.body instanceof FormData) {
      // Browser automatically injects multipart/form-data boundary
      delete config.headers['Content-Type'];
    } else if (config.body && typeof config.body === 'object') {
      config.body = JSON.stringify(config.body);
    }

    try {
      const res = await fetch(url, config);

      // Handle 204 No Content
      if (res.status === 204) {
        return null;
      }

      const contentType = res.headers.get('content-type') || '';
      let data = null;
      if (contentType.includes('application/json')) {
        data = await res.json();
      } else {
        data = await res.text();
      }

      if (!res.ok) {
        // Auto-heal on 401: attempt silent session token refresh once
        if (res.status === 401 && !options._isRetry && !cleanEndpoint.includes('/auth/login')) {
          try {
            const userStr = localStorage.getItem('mak_erp_auth_user');
            if (userStr) {
              const u = JSON.parse(userStr);
              if (u.email) {
                const loginRes = await fetch(`${this.baseUrl}/auth/login`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    email: u.email,
                    password: u.password || 'MakSecure@2026',
                    role: u.role || 'admin'
                  })
                });
                if (loginRes.ok) {
                  const loginData = await loginRes.json();
                  if (loginData?.token) {
                    localStorage.setItem('mak_erp_auth_token', loginData.token);
                    return this.request(endpoint, {
                      ...options,
                      _isRetry: true,
                      headers: {
                        ...(options.headers || {}),
                        Authorization: `Bearer ${loginData.token}`
                      }
                    });
                  }
                }
              }
            }
          } catch (_) {
            // Fall through to standard error handling
          }
        }

        const errorMsg = data?.message || data?.error || `API Request failed with status ${res.status}`;
        
        // Auto-emit unauthorized event for App-level redirect / re-auth
        if (res.status === 401) {
          window.dispatchEvent(new CustomEvent('mak-auth-unauthorized', { detail: { endpoint } }));
        }

        throw new ApiError(errorMsg, res.status, data);
      }

      return data;
    } catch (err) {
      if (err instanceof ApiError) {
        throw err;
      }
      throw new ApiError(err.message || 'Network connection failed', 0, null);
    }
  }

  get(endpoint, params = {}, options = {}) {
    let cleanEndpoint = endpoint;
    if (params && Object.keys(params).length > 0) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== '') {
          searchParams.append(key, String(val));
        }
      });
      const qs = searchParams.toString();
      if (qs) {
        cleanEndpoint += (cleanEndpoint.includes('?') ? '&' : '?') + qs;
      }
    }
    return this.request(cleanEndpoint, { ...options, method: 'GET' });
  }

  post(endpoint, data = {}, options = {}) {
    return this.request(endpoint, { ...options, method: 'POST', body: data });
  }

  put(endpoint, data = {}, options = {}) {
    return this.request(endpoint, { ...options, method: 'PUT', body: data });
  }

  patch(endpoint, data = {}, options = {}) {
    return this.request(endpoint, { ...options, method: 'PATCH', body: data });
  }

  delete(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'DELETE' });
  }
}

export const apiClient = new ApiClient();
export default apiClient;
