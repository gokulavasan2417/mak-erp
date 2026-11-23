// MAK Tours & Travels ERP - Finance, Expenses, Payments & Receivable Router
import { Router } from 'express';
import { financeController } from '../controllers/financeController.js';
import { resolveTenant } from '../middleware/tenantMiddleware.js';
import { requireAuth, requirePermission } from '../middleware/authMiddleware.js';
import { avatarUpload } from '../middleware/uploadMiddleware.js';

const router = Router();

// Strict Security Foundation: All finance endpoints require authentication & tenant context
router.use(requireAuth, resolveTenant);

// 1. Executive Financial Overview
router.get('/overview', requirePermission('finance.view'), financeController.getOverview);

// 2. Expenses Management
router.get('/expenses', requirePermission('expense.view'), financeController.getExpenses);
router.post('/expenses', requirePermission('expense.manage'), financeController.createExpense);
router.post('/expenses/upload-receipt', requirePermission('expense.manage'), avatarUpload.single('receipt'), financeController.uploadExpenseReceipt);
router.put('/expenses/:id', requirePermission('expense.manage'), financeController.updateExpense);
router.patch('/expenses/:id', requirePermission('expense.manage'), financeController.updateExpense);
router.patch('/expenses/:id/status', requirePermission('expense.manage'), financeController.updateExpenseStatus);

// 3. Receivable Management & Customer Ledger
router.get('/receivable/customer-ledger', requirePermission('finance.view'), financeController.getCustomerLedger);
router.get('/receivable/pending', requirePermission('finance.view'), financeController.getReceivablePending);
router.get('/receivable/overdue', requirePermission('finance.view'), financeController.getReceivableOverdue);
router.post('/receivable/reminders', requirePermission('finance.manage'), financeController.sendPaymentReminder);

// 4. Invoices Management, Tax Math, PDF & Cancellation
router.get('/invoices', requirePermission('invoice.view'), financeController.getInvoices);
router.post('/invoices', requirePermission('invoice.manage'), financeController.createInvoice);
router.get('/invoices/:id/pdf', requirePermission('invoice.view'), financeController.downloadInvoicePdf);
router.get('/invoices/:id', requirePermission('invoice.view'), financeController.getInvoiceById);
router.post('/invoices/:id/cancel', requirePermission('invoice.manage'), financeController.cancelInvoice);
router.post('/invoices/:id/credit-note', requirePermission('invoice.manage'), financeController.createCreditNote);

// 5. Payments, Overpayment Guards & Receipts
router.get('/payments', requirePermission('payments.view'), financeController.getPayments);
router.post('/payments', requirePermission('payments.manage'), financeController.createPayment);

export default router;