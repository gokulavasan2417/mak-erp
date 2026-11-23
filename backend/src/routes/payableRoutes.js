// MAK Tours & Travels ERP - Vendor Payables & Bills Router
import { Router } from 'express';
import { payableController } from '../controllers/payableController.js';
import { resolveTenant } from '../middleware/tenantMiddleware.js';
import { requireAuth, requirePermission } from '../middleware/authMiddleware.js';

const router = Router();

// Strict Security: All payable routes require authentication & tenant context
router.use(requireAuth, resolveTenant);

// Bills Management
router.get('/bills', requirePermission('finance.view'), payableController.getBills);
router.post('/bills', requirePermission('finance.manage'), payableController.createBill);
router.get('/bills/:id', requirePermission('finance.view'), payableController.getBillById);

// Payments Management
router.get('/payments', requirePermission('payments.view'), payableController.getPayments);
router.post('/payments', requirePermission('payments.manage'), payableController.recordPayment);

// Ledger & Outstanding
router.get('/ledger', requirePermission('finance.view'), payableController.getVendorLedger);
router.get('/outstanding', requirePermission('finance.view'), payableController.getOutstandingReport);

export default router;