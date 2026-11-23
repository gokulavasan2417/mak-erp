// MAK Tours & Travels ERP - Advanced Payroll API Service
import apiClient from './apiClient';

export const payrollService = {
  // Calculate or regenerate monthly payroll
  async calculateMonthlyPayroll(month) {
    return apiClient.post('/payroll/calculate', { month });
  },

  // Get all payroll records for month with optional filters
  async getAll(params = {}) {
    return apiClient.get('/payroll', params);
  },

  // Get single payroll record
  async getById(id) {
    return apiClient.get(`/payroll/${id}`);
  },

  // Approve payroll
  async approve(id, approvalData = {}) {
    return apiClient.put(`/payroll/${id}/approve`, approvalData);
  },

  // Record salary payment (full or partial)
  async recordPayment(id, paymentData) {
    return apiClient.post(`/payroll/${id}/payments`, paymentData);
  },

  // Get printable salary slip data
  async getSalarySlip(id) {
    return apiClient.get(`/payroll/${id}/slip`);
  },

  // Get active payroll policy
  async getPolicy() {
    return apiClient.get('/payroll/policy');
  },

  // Update payroll policy
  async updatePolicy(policyData) {
    return apiClient.put('/payroll/policy', policyData);
  },

  // Update employee or driver salary & trigger dynamic recalculation
  async updateSalary(employeeId, salaryData) {
    return apiClient.put(`/payroll/employees/${employeeId}/salary`, salaryData);
  },

  // Get salary revision history
  async getSalaryHistory(employeeId) {
    return apiClient.get(`/payroll/employees/${employeeId}/salary-history`);
  }
};

export default payrollService;
