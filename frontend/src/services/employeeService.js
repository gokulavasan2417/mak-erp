// MAK Tours & Travels ERP - Employees & Staff API Service
import apiClient from './apiClient';

export const employeeService = {
  async getAll(params = {}) {
    return apiClient.get('/employees', params);
  },

  async getById(id) {
    return apiClient.get(`/employees/${id}`);
  },

  async create(data) {
    return apiClient.post('/employees', data);
  },

  async update(id, data) {
    return apiClient.put(`/employees/${id}`, data);
  },

  async delete(id) {
    return apiClient.delete(`/employees/${id}`);
  }
};

export default employeeService;
