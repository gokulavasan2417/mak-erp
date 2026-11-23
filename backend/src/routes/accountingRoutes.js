// MAK Tours & Travels ERP - Accounting & Ledger Management Routes
import { Router } from 'express';
import { accountingController } from '../controllers/accountingController.js';
import { resolveTenant } from '../middleware/tenantMiddleware.js';
import { requireAuth, requirePermission } from '../middleware/authMiddleware.js';
import cashBankRoutes from './cashBankRoutes.js';
import driverSettlementRoutes from './driverSettlementRoutes.js';
import payableRoutes from './payableRoutes.js';

const router = Router();

// Sub-modules accessible under /accounting
router.use('/cash-bank', cashBankRoutes);
router.use('/driver-settlements', driverSettlementRoutes);
router.use('/payable', payableRoutes);

// Strict security: require valid JWT, resolve tenant identity, and check ledger permission
router.use(requireAuth, resolveTenant, requirePermission('ledger.view'));

// Chart of Accounts
router.get('/accounts', accountingController.getAccounts);
router.post('/accounts', requirePermission('ledger.manage'), accountingController.createAccount);

// Financial Years
router.get('/financial-years', accountingController.getFinancialYears);
router.post('/financial-years', requirePermission('ledger.manage'), accountingController.createFinancialYear);

// Cash & Bank Accounts Master
router.get('/cash-bank-accounts', accountingController.getCashBankAccounts);
router.post('/cash-bank-accounts', requirePermission('ledger.manage'), accountingController.createCashBankAccount);

// Double-Entry Journal Entries (Immutable: only create manual or reverse)
router.get('/journal-entries', accountingController.getJournalEntries);
router.get('/journal-entries/:id', accountingController.getJournalEntryById);
router.post('/journal-entries', requirePermission('ledger.manage'), accountingController.createManualJournal);
router.post('/journal-entries/:id/reverse', requirePermission('ledger.manage'), accountingController.reverseJournal);

// Reports
router.get('/reports/trial-balance', accountingController.getTrialBalance);
router.get('/reports/general-ledger', accountingController.getGeneralLedger);
router.get('/reports/profit-and-loss', accountingController.getProfitAndLoss);
router.get('/reports/balance-sheet', accountingController.getBalanceSheet);
router.get('/reports/cash-flow', accountingController.getCashFlow);

export default router;
