// MAK Tours & Travels ERP - Driver Operations API Service
import apiClient from './apiClient';

export const driverService = {
  async getAll(filters = {}) {
    return apiClient.get('/drivers', filters);
  },

  async getById(id) {
    return apiClient.get(`/drivers/${id}`);
  },

  async create(driverData) {
    return apiClient.post('/drivers', driverData);
  },

  async update(id, driverData) {
    return apiClient.put(`/drivers/${id}`, driverData);
  },

  async delete(id) {
    return apiClient.delete(`/drivers/${id}`);
  },

  async getAvailability(id) {
    return apiClient.get(`/drivers/${id}/availability`);
  },

  async updateAvailability(id, availabilityData) {
    return apiClient.put(`/drivers/${id}/availability`, availabilityData);
  },

  async requestLeave(id, leaveData) {
    return apiClient.post(`/drivers/${id}/leaves`, leaveData);
  }
};

export default driverService;
