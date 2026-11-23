// MAK Tours & Travels ERP - Bookings API Service
// CRITICAL: ONE WAY TRIP IS STRICTLY FORBIDDEN AND DOES NOT EXIST IN THIS APPLICATION.
import apiClient from './apiClient';

export const bookingService = {
  /**
   * Fetch all bookings with optional query filters
   * @param {Object} filters - { status, category, date, driverId, vehicleId }
   */
  async getAll(filters = {}) {
    return apiClient.get('/bookings', filters);
  },

  /**
   * Fetch single booking details by booking ID or booking number
   */
  async getById(id) {
    return apiClient.get(`/bookings/${id}`);
  },

  /**
   * Create a new booking (Customer Portal or Admin Desk)
   */
  async create(bookingData) {
    return apiClient.post('/bookings', bookingData);
  },

  /**
   * Update existing booking
   */
  async update(id, bookingData) {
    return apiClient.put(`/bookings/${id}`, bookingData);
  },

  /**
   * Assign vehicle and driver to a booking
   */
  async assign(id, { driverId, vehicleId, notes }) {
    return apiClient.post(`/bookings/${id}/assign`, { driverId, vehicleId, notes });
  },

  /**
   * Change booking status
   */
  async updateStatus(id, status, metadata = {}) {
    return apiClient.patch(`/bookings/${id}/status`, { status, ...metadata });
  },

  /**
   * Cancel booking
   */
  async cancel(id, reason = '') {
    return apiClient.post(`/bookings/${id}/cancel`, { reason });
  },

  /**
   * Download Invoice PDF for a booking
   */
  async downloadInvoicePdf(id, filename) {
    const token = apiClient.getToken();
    const encodedId = encodeURIComponent(id);
    const url = `${apiClient.baseUrl}/bookings/${encodedId}/invoice/pdf${token ? `?token=${encodeURIComponent(token)}` : ''}`;

    const headers = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(url, { headers });
    if (!res.ok) {
      let errMsg = `Failed to generate PDF (${res.status})`;
      try {
        const errJson = await res.json();
        if (errJson && errJson.message) errMsg = errJson.message;
      } catch {
        // fallback
      }
      throw new Error(errMsg);
    }

    const blob = await res.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename || `Invoice-${id}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => window.URL.revokeObjectURL(blobUrl), 10000);
    return true;
  }
};

export default bookingService;
