import { Router } from 'express';
import { bookingController } from '../controllers/bookingController.js';
import { financeController } from '../controllers/financeController.js';
import { resolveTenant } from '../middleware/tenantMiddleware.js';
import { requireAuth, optionalAuth, requirePermission } from '../middleware/authMiddleware.js';

const router = Router();

// Genuinely public customer website booking / inquiry creation (with safe tenant resolution)
router.post('/', optionalAuth, resolveTenant, bookingController.create);

// Authenticated booking management routes
router.use(requireAuth, resolveTenant);

router.get('/', bookingController.getAll);
router.get('/:id/invoice/pdf', financeController.downloadInvoicePdf);
router.get('/:id', bookingController.getById);
router.put('/:id', bookingController.update);
router.post('/:id/assign', requirePermission('trips.assign'), bookingController.assign);
router.post('/:id/cancel', requirePermission('bookings.delete'), bookingController.cancel);
router.patch('/:id/status', bookingController.updateStatus);

export default router;
