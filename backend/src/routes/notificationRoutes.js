import { Router } from 'express';
import { notificationController } from '../controllers/notificationController.js';
import { resolveTenant } from '../middleware/tenantMiddleware.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = Router();

router.use(requireAuth, resolveTenant);

router.get('/', notificationController.getAll);
router.patch('/:id/read', notificationController.markRead);
router.post('/mark-all-read', notificationController.markAllRead);
router.post('/', notificationController.create);

export default router;
