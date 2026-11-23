// MAK Tours & Travels ERP - Vendor & Fleet Partner Network API Service
import apiClient from './apiClient';

export const vendorService = {
  async getAll(filters = {}) {
    return apiClient.get('/vendors', filters);
  },

  async getById(id) {
    return apiClient.get(`/vendors/${id}`);
  },

  async create(vendorData) {
    return apiClient.post('/vendors', vendorData);
  },

  async update(id, vendorData) {
    return apiClient.put(`/vendors/${id}`, vendorData);
  },

  async delete(id) {
    return apiClient.delete(`/vendors/${id}`);
  },

  async getVehicles(vendorId) {
    return apiClient.get(`/vendors/${vendorId}/vehicles`);
  },

  async addVehicle(vendorId, vehicleData) {
    return apiClient.post(`/vendors/${vendorId}/vehicles`, vehicleData);
  },

  async getInvoices(vendorId) {
    return apiClient.get(`/vendors/${vendorId}/invoices`);
  },

  async getStatements(vendorId) {
    return apiClient.get(`/vendors/${vendorId}/statements`);
  }
};

export default vendorService;
