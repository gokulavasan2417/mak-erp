// MAK Tours & Travels ERP - External Integrations API Client
// Connects frontend to MAK TAXI Vendor App Integration endpoints
import apiClient from './apiClient';

export const integrationService = {
  /**
   * Get MAK TAXI integration health, statistics, and configuration
   */
  async getStatus() {
    return apiClient.get('/integrations/mak-taxi/status');
  },

  /**
   * Dispatch an outstation booking to MAK TAXI Vendor App
   */
  async dispatchTripToVendor(bookingId, { vendorId, vendorPayoutPercent, webhookUrl } = {}) {
    return apiClient.post(`/integrations/mak-taxi/trips/${bookingId}/dispatch`, {
      vendorId,
      vendorPayoutPercent,
      webhookUrl
    });
  },

  /**
   * Test webhook connectivity to target URL
   */
  async testWebhook(targetUrl) {
    return apiClient.post('/integrations/mak-taxi/test-webhook', { targetUrl });
  }
};

export default integrationService;
