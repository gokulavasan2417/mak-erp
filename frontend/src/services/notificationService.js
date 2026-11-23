// MAK Tours & Travels ERP - Notifications API Service
import apiClient from './apiClient';

export const notificationService = {
  async getAll(portal = 'admin') {
    return apiClient.get('/notifications', { portal });
  },

  async markAsRead(id) {
    return apiClient.patch(`/notifications/${id}/read`);
  },

  async markAllAsRead(portal = 'admin') {
    return apiClient.post('/notifications/mark-all-read', { portal });
  },

  async create(notificationData) {
    return apiClient.post('/notifications', notificationData);
  }
};

export default notificationService;
