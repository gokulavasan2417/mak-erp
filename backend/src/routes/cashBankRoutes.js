// MAK Tours & Travels ERP - Cash & Bank Management Router
import { Router } from 'express';
import { cashBankController } from '../controllers/cashBankController.js';
import { resolveTenant } from '../middleware/tenantMiddleware.js';
import { requireAuth, requirePermission } from '../middleware/authMiddleware.js';

const router = Router();

// Strict Security: All Cash & Bank routes require authentication & tenant context
router.use(requireAuth, resolveTenant);

// Accounts & Balances
router.get('/accounts', requirePermission('finance.view'), cashBankController.getAccounts);
router.get('/cashbook', requirePermission('finance.view'), cashBankController.getCashbook);

// Operational Transactions
router.post('/deposits', requirePermission('finance.manage'), cashBankController.recordDeposit);
router.post('/withdrawals', requirePermission('finance.manage'), cashBankController.recordWithdrawal);
router.post('/transfers', requirePermission('finance.manage'), cashBankController.recordTransfer);

// Bank Reconciliation
router.get('/reconciliation', requirePermission('finance.view'), cashBankController.getReconciliation);
router.post('/reconciliation/:id/match', requirePermission('finance.manage'), cashBankController.matchTransaction);

export default router;