// MAK Tours & Travels ERP - Fleet & Vehicle Assets API Service
import apiClient from './apiClient';

export const vehicleService = {
  async getAll(filters = {}) {
    return apiClient.get('/vehicles', filters);
  },

  async getById(id) {
    return apiClient.get(`/vehicles/${id}`);
  },

  async create(vehicleData) {
    return apiClient.post('/vehicles', vehicleData);
  },

  async update(id, vehicleData) {
    return apiClient.put(`/vehicles/${id}`, vehicleData);
  },

  async delete(id, params = {}) {
    let endpoint = `/vehicles/${id}`;
    if (params && Object.keys(params).length > 0) {
      const searchParams = new URLSearchParams(params);
      endpoint += `?${searchParams.toString()}`;
    }
    return apiClient.delete(endpoint);
  },

  async updateStatus(id, status) {
    return apiClient.patch(`/vehicles/${id}/status`, { status });
  }
};

export default vehicleService;
