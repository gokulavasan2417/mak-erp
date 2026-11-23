// MAK Tours & Travels ERP - Super Admin SaaS Platform Service
import { apiClient } from './apiClient';

export const superAdminService = {
  // Platform Dashboard Overview & Statistics
  getStats: async () => {
    return apiClient.get('/super-admin/stats');
  },

  // Company Directory Management
  getCompanies: async (params = {}) => {
    const query = new URLSearchParams();
    if (params.search) query.set('search', params.search);
    if (params.status && params.status !== 'All') query.set('status', params.status);
    if (params.plan && params.plan !== 'All') query.set('plan', params.plan);
    const queryString = query.toString();
    return apiClient.get(`/super-admin/companies${queryString ? `?${queryString}` : ''}`);
  },

  getCompanyById: async (id) => {
    return apiClient.get(`/super-admin/companies/${id}`);
  },

  createCompany: async (companyData) => {
    return apiClient.post('/super-admin/companies', companyData);
  },

  updateCompanyStatus: async (id, status, reason = '') => {
    return apiClient.put(`/super-admin/companies/${id}/status`, { status, reason });
  },

  updateCompanyLicense: async (id, licenseData) => {
    return apiClient.put(`/super-admin/companies/${id}/license`, licenseData);
  },

  resetCompanyAdminPassword: async (id, newPassword) => {
    return apiClient.post(`/super-admin/companies/${id}/reset-admin`, { newPassword });
  },

  // Audit Logs
  getAuditLogs: async (params = {}) => {
    const query = new URLSearchParams();
    if (params.tenantId && params.tenantId !== 'All') query.set('tenantId', params.tenantId);
    if (params.action && params.action !== 'All') query.set('action', params.action);
    if (params.limit) query.set('limit', params.limit);
    const queryString = query.toString();
    return apiClient.get(`/super-admin/audit-logs${queryString ? `?${queryString}` : ''}`);
  },

  // Global SaaS Settings
  getGlobalSettings: async () => {
    return apiClient.get('/super-admin/settings');
  },

  updateGlobalSettings: async (settings) => {
    return apiClient.put('/super-admin/settings', { settings });
  }
};

export default superAdminService;
