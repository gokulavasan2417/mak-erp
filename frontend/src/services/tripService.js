// MAK Tours & Travels ERP - Trip & Driver Dispatch API Service
import apiClient from './apiClient';

export const tripService = {
  /**
   * Fetch pending assignments awaiting driver acceptance
   */
  async getAssignments(driverId) {
    return apiClient.get('/trips/assignments', { driverId });
  },

  /**
   * Driver accepts assigned trip
   */
  async acceptAssignment(tripId) {
    return apiClient.post(`/trips/${tripId}/accept`);
  },

  /**
   * Driver declines assigned trip
   */
  async declineAssignment(tripId, reason, explanation = '') {
    return apiClient.post(`/trips/${tripId}/decline`, { reason, explanation });
  },

  /**
   * Driver reports arrival at pickup location
   */
  async arriveAtPickup(tripId) {
    return apiClient.post(`/trips/${tripId}/arrive`);
  },

  /**
   * Driver starts journey with starting odometer reading
   */
  async startTrip(tripId, metadata = {}) {
    return apiClient.post(`/trips/${tripId}/start`, metadata);
  },

  /**
   * Driver completes journey with ending odometer reading and remarks
   */
  async endTrip(tripId, metadata = {}) {
    return apiClient.post(`/trips/${tripId}/end`, metadata);
  },

  /**
   * Fetch active trip status & telemetry
   */
  async getTrip(tripId) {
    return apiClient.get(`/trips/${tripId}`);
  },

  /**
   * Submit toll, fuel, parking expense claim
   */
  async submitExpense(tripId, expenseData) {
    return apiClient.post(`/trips/${tripId}/expenses`, expenseData);
  }
};

export default tripService;
