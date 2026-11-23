// MAK Tours & Travels ERP - Authentication API Service
import apiClient from './apiClient';

export const authService = {
  /**
   * Authenticate user credentials
   * @param {Object} credentials - { email, password, role }
   */
  async login(credentials) {
    const data = await apiClient.post('/auth/login', credentials);
    if (data?.token) {
      localStorage.setItem('mak_erp_auth_token', data.token);
    }
    if (data?.user) {
      localStorage.setItem('mak_erp_auth_user', JSON.stringify(data.user));
    }
    return data;
  },

  /**
   * Driver / Vendor registration
   */
  async register(registrationData) {
    return apiClient.post('/auth/register', registrationData);
  },

  /**
   * Public SaaS Company Onboarding Registration
   */
  async companyRegister(companyData) {
    return apiClient.post('/auth/company-register', companyData);
  },

  /**
   * Get active user profile
   */
  async getProfile() {
    return apiClient.get('/auth/me');
  },

  /**
   * Update active user profile
   */
  async updateProfile(profileData) {
    return apiClient.put('/auth/me', profileData);
  },

  /**
   * Upload user avatar photo to backend storage / Cloudinary
   * @param {File} file - Image file object from input[type=file]
   */
  async uploadAvatar(file) {
    const formData = new FormData();
    formData.append('avatar', file);
    return apiClient.post('/auth/upload-avatar', formData);
  },

  /**
   * Invalidate active session
   */
  async logout() {
    try {
      await apiClient.post('/auth/logout');
    } catch {
      // Ignored on client-side cleanup
    } finally {
      localStorage.removeItem('mak_erp_auth_token');
      localStorage.removeItem('mak_erp_auth_user');
    }
  }
};

export default authService;
