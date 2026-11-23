import { Router } from 'express';
import { customerController } from '../controllers/customerController.js';
import { resolveTenant } from '../middleware/tenantMiddleware.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = Router();

router.use(requireAuth, resolveTenant);

router.get('/', customerController.getAll);
router.get('/:id', customerController.getById);
router.post('/', customerController.create);
router.patch('/:id', customerController.update);
router.put('/:id', customerController.update);
router.delete('/:id', customerController.delete);

export default router;
