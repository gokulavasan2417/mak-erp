// MAK Tours & Travels ERP - Financial & Executive Reports Routes
import express from 'express';
import { reportController } from '../controllers/reportController.js';
import { requireAuth, requirePermission } from '../middleware/authMiddleware.js';
import { resolveTenant } from '../middleware/tenantMiddleware.js';

const router = express.Router();

// Apply Security Pipeline: Auth -> Strict User Tenant -> Permission Check
router.use(requireAuth, resolveTenant, requirePermission('reports.view'));

// 1. Daily Income & Expense
router.get('/daily-income-expense', reportController.getDailyIncomeExpense);

// 2. Monthly Revenue & Expense
router.get('/monthly-revenue-expense', reportController.getMonthlyRevenueExpense);

// 3. Profit & Loss Statement
router.get('/profit-and-loss', reportController.getProfitAndLossReport);

// 4. Cash Flow Statement
router.get('/cash-flow', reportController.getCashFlowReport);

// 5. Customer Outstanding Aging
router.get('/customer-outstanding', reportController.getCustomerOutstandingReport);

// 6. Vendor Outstanding Payables
router.get('/vendor-outstanding', reportController.getVendorOutstandingReport);

// 7. Driver Settlements Summary
router.get('/driver-settlements', reportController.getDriverSettlementReport);

// 8. Payroll & Statutory Compliance
router.get('/payroll', reportController.getPayrollReport);

// 9. GST Compliance & Tax Split
router.get('/gst', reportController.getGstReport);

// 10. Vehicle Profitability
router.get('/vehicle-profitability', reportController.getVehicleProfitabilityReport);

// 11. Tour Package Profitability
router.get('/tour-package-profitability', reportController.getTourPackageProfitabilityReport);

// 12. Booking Revenue Analysis
router.get('/booking-revenue', reportController.getBookingRevenueReport);

// 13. Payment Collections & Reconciliation
router.get('/payment-collections', reportController.getPaymentCollectionReport);

// 14. Trial Balance
router.get('/trial-balance', reportController.getTrialBalanceReport);

// 15. Balance Sheet
router.get('/balance-sheet', reportController.getBalanceSheetReport);

// Exports
router.get('/export/pdf', reportController.exportReportPdf);
router.get('/export/excel', reportController.exportReportExcel);

export default router;
