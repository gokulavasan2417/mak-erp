// MAK Tours & Travels ERP - Staff Attendance API Service
import apiClient from './apiClient';

export const attendanceService = {
  async getAll(params = {}) {
    return apiClient.get('/attendance', params);
  },

  async getHistory(employeeId) {
    return apiClient.get(`/attendance/history/${employeeId}`);
  },

  async mark(attendanceData) {
    return apiClient.post('/attendance/mark', attendanceData);
  },

  async bulkMark(bulkData) {
    return apiClient.post('/attendance/bulk-mark', bulkData);
  },

  async delete(id) {
    return apiClient.delete(`/attendance/${id}`);
  }
};

export default attendanceService;
