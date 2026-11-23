// MAK Tours & Travels ERP - Tour Packages API Service
import apiClient from './apiClient';

export const tourPackageService = {
  async getAll(filters = {}) {
    return apiClient.get('/tour-packages', filters);
  },

  async getById(id) {
    return apiClient.get(`/tour-packages/${id}`);
  },

  async create(packageData) {
    return apiClient.post('/tour-packages', packageData);
  },

  async update(id, packageData) {
    return apiClient.put(`/tour-packages/${id}`, packageData);
  },

  async delete(id) {
    return apiClient.delete(`/tour-packages/${id}`);
  }
};

export default tourPackageService;
