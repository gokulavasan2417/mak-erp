// MAK Tours & Travels ERP - Customers API Service
import apiClient from './apiClient';

export const customerService = {
  async getAll(params = {}) {
    return apiClient.get('/customers', params);
  },

  async getById(id) {
    return apiClient.get(`/customers/${id}`);
  },

  async create(data) {
    return apiClient.post('/customers', data);
  },

  async update(id, data) {
    return apiClient.put(`/customers/${id}`, data);
  },

  async delete(id) {
    return apiClient.delete(`/customers/${id}`);
  }
};

export default customerService;
