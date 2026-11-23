// MAK Tours & Travels ERP - Dedicated Accountant Portal API Service
import apiClient from './apiClient';

export const accountantService = {
  // 1. Overview & Financial KPIs
  async getOverview() {
    return apiClient.get('/finance/overview');
  },

  // 2. Customer Payments & Income
  async getPayments(params = {}) {
    return apiClient.get('/finance/payments', params);
  },
  async recordPayment(data) {
    return apiClient.post('/finance/payments', data);
  },

  // 3. Operating Expenses
  async getExpenses(params = {}) {
    return apiClient.get('/finance/expenses', params);
  },
  async createExpense(data) {
    return apiClient.post('/finance/expenses', data);
  },
  async updateExpense(id, data) {
    return apiClient.put(`/finance/expenses/${id}`, data);
  },
  async updateExpenseStatus(id, status, notes = '') {
    return apiClient.patch(`/finance/expenses/${id}/status`, { status, notes });
  },

  // 4. Receivables & Aging
  async getReceivableOverdue() {
    return apiClient.get('/finance/receivable/overdue');
  },
  async getCustomerLedger(params = {}) {
    return apiClient.get('/finance/receivable/customer-ledger', params);
  },
  async sendReminder(data) {
    return apiClient.post('/finance/receivable/reminders', data);
  },

  // 5. Invoicing & Credit Notes
  async getInvoices(params = {}) {
    return apiClient.get('/finance/invoices', params);
  },
  async createInvoice(data) {
    return apiClient.post('/finance/invoices', data);
  },
  async cancelInvoice(id, reason) {
    return apiClient.post(`/finance/invoices/${id}/cancel`, { reason });
  },
  async issueCreditNote(id, data) {
    return apiClient.post(`/finance/invoices/${id}/credit-note`, data);
  },

  // 6. Payables & Vendor Bills
  async getVendorBills(params = {}) {
    return apiClient.get('/payable/bills', params);
  },
  async createVendorBill(data) {
    return apiClient.post('/payable/bills', data);
  },
  async getVendorBillDetails(billNumber) {
    return apiClient.get(`/payable/bills/${billNumber}`);
  },
  async recordVendorPayment(data) {
    return apiClient.post('/payable/payments', data);
  },
  async getVendorLedger(params = {}) {
    return apiClient.get('/payable/ledger', params);
  },
  async getVendorOutstanding() {
    return apiClient.get('/payable/outstanding');
  },

  // 7. Driver Settlements
  async calculateDriverSettlement(data) {
    return apiClient.post('/driver-settlements/calculate', data);
  },
  async createDriverSettlement(data) {
    return apiClient.post('/driver-settlements', data);
  },
  async getDriverSettlements(params = {}) {
    return apiClient.get('/driver-settlements', params);
  },
  async getDriverSettlementDetails(settlementNo) {
    return apiClient.get(`/driver-settlements/${settlementNo}`);
  },
  async payDriverSettlement(settlementNo, data) {
    return apiClient.post(`/driver-settlements/${settlementNo}/pay`, data);
  },
  async getDriverStatement(settlementNo) {
    return apiClient.get(`/driver-settlements/${settlementNo}/statement`);
  },

  // 8. Cash & Bank Management
  async getCashBankAccounts() {
    return apiClient.get('/cash-bank/accounts');
  },
  async createCashBankAccount(data) {
    return apiClient.post('/cash-bank/accounts', data);
  },
  async getCashbook(params = {}) {
    return apiClient.get('/cash-bank/cashbook', params);
  },
  async recordDeposit(data) {
    return apiClient.post('/cash-bank/deposits', data);
  },
  async recordWithdrawal(data) {
    return apiClient.post('/cash-bank/withdrawals', data);
  },
  async recordTransfer(data) {
    return apiClient.post('/cash-bank/transfers', data);
  },
  async getReconciliation(params = {}) {
    return apiClient.get('/cash-bank/reconciliation', params);
  },
  async matchReconciliation(txnNo, data) {
    return apiClient.post(`/cash-bank/reconciliation/${txnNo}/match`, data);
  },

  // 9. Payroll Accounting
  async getPayrollSummary(params = {}) {
    return apiClient.get('/payroll/accounting/summary', params);
  },
  async getPayrollDisbursements(params = {}) {
    return apiClient.get('/payroll/accounting/disbursements', params);
  },
  async recordPayrollPayment(id, data) {
    return apiClient.post(`/payroll/${id}/payments`, data);
  },

  // 10. Chart of Accounts & General Ledger
  async getChartOfAccounts() {
    return apiClient.get('/accounting/accounts');
  },
  async createAccount(data) {
    return apiClient.post('/accounting/accounts', data);
  },
  async getJournalEntries(params = {}) {
    return apiClient.get('/accounting/journal-entries', params);
  },
  async createJournalEntry(data) {
    return apiClient.post('/accounting/journal-entries', data);
  },
  async reverseJournalEntry(id, reason) {
    return apiClient.post(`/accounting/journal-entries/${id}/reverse`, { reason });
  },

  // 11. Core Financial Statements & Reports
  async getTrialBalance(params = {}) {
    return apiClient.get('/accounting/reports/trial-balance', params);
  },
  async getGeneralLedger(params = {}) {
    return apiClient.get('/accounting/reports/general-ledger', params);
  },
  async getProfitAndLoss(params = {}) {
    return apiClient.get('/accounting/reports/profit-and-loss', params);
  },
  async getBalanceSheet(params = {}) {
    return apiClient.get('/accounting/reports/balance-sheet', params);
  },
  async getCashFlow(params = {}) {
    return apiClient.get('/accounting/reports/cash-flow', params);
  },

  // 12. Full Suite of 15 Financial & Compliance Reports
  async getDailyIncomeExpenseReport(params = {}) {
    return apiClient.get('/reports/daily-income-expense', params);
  },
  async getMonthlyRevenueExpenseReport(params = {}) {
    return apiClient.get('/reports/monthly-revenue-expense', params);
  },
  async getProfitAndLossStatement(params = {}) {
    return apiClient.get('/reports/profit-and-loss', params);
  },
  async getCashFlowReport(params = {}) {
    return apiClient.get('/reports/cash-flow', params);
  },
  async getCustomerOutstandingAging(params = {}) {
    return apiClient.get('/reports/customer-outstanding', params);
  },
  async getVendorOutstandingPayables(params = {}) {
    return apiClient.get('/reports/vendor-outstanding', params);
  },
  async getDriverSettlementsReport(params = {}) {
    return apiClient.get('/reports/driver-settlements', params);
  },
  async getPayrollComplianceReport(params = {}) {
    return apiClient.get('/reports/payroll', params);
  },
  async getGstComplianceReport(params = {}) {
    return apiClient.get('/reports/gst', params);
  },
  async getVehicleProfitabilityReport(params = {}) {
    return apiClient.get('/reports/vehicle-profitability', params);
  },
  async getTourPackageProfitabilityReport(params = {}) {
    return apiClient.get('/reports/tour-package-profitability', params);
  },
  async getBookingRevenueReport(params = {}) {
    return apiClient.get('/reports/booking-revenue', params);
  },
  async getPaymentCollectionsReport(params = {}) {
    return apiClient.get('/reports/payment-collections', params);
  },
  async getTrialBalanceReport(params = {}) {
    return apiClient.get('/reports/trial-balance', params);
  },
  async getBalanceSheetReport(params = {}) {
    return apiClient.get('/reports/balance-sheet', params);
  }
};

export default accountantService;
