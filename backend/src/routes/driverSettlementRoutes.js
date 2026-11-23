// MAK Tours & Travels ERP - Driver Settlements Router
import { Router } from 'express';
import { driverSettlementController } from '../controllers/driverSettlementController.js';
import { resolveTenant } from '../middleware/tenantMiddleware.js';
import { requireAuth, requirePermission } from '../middleware/authMiddleware.js';

const router = Router();

// Strict Security: All driver settlement routes require authentication & tenant context
router.use(requireAuth, resolveTenant);

router.post('/calculate', requirePermission('finance.view'), driverSettlementController.calculatePreview);
router.get('/', requirePermission('finance.view'), driverSettlementController.getAll);
router.post('/', requirePermission('finance.manage'), driverSettlementController.createSettlement);
router.get('/:id/statement', requirePermission('finance.view'), driverSettlementController.getStatement);
router.post('/:id/pay', requirePermission('payments.manage'), driverSettlementController.recordSettlementPayment);

export default router;