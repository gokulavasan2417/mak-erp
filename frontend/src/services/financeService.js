// MAK Tours & Travels ERP - Finance, Expenses & Payouts API Service
import apiClient from './apiClient';

export const financeService = {
  /**
   * Executive Financial Dashboard Metrics
   */
  async getOverview() {
    return apiClient.get('/finance/overview');
  },

  /**
   * Expenses & Payouts (Driver salary/allowance, vendor payouts, tolls, fuel)
   */
  async getExpenses(filters = {}) {
    return apiClient.get('/finance/expenses', filters);
  },

  async createExpense(expenseData) {
    return apiClient.post('/finance/expenses', expenseData);
  },

  async updateExpenseStatus(id, status) {
    return apiClient.patch(`/finance/expenses/${id}/status`, { status });
  },

  /**
   * Payments
   */
  async getPayments(filters = {}) {
    return apiClient.get('/finance/payments', filters);
  },

  async recordPayment(paymentData) {
    return apiClient.post('/finance/payments', paymentData);
  },

  /**
   * Invoices
   */
  async getInvoices(filters = {}) {
    return apiClient.get('/finance/invoices', filters);
  },

  async createInvoice(invoiceData) {
    return apiClient.post('/finance/invoices', invoiceData);
  },

  /**
   * Download Invoice PDF as file via authenticated blob stream
   */
  async downloadInvoicePdf(id, filename) {
    const token = apiClient.getToken();
    const encodedId = encodeURIComponent(id);
    const url = `${apiClient.baseUrl}/finance/invoices/${encodedId}/pdf${token ? `?token=${encodeURIComponent(token)}` : ''}`;

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

export default financeService;
