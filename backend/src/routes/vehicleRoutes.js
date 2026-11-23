import { Router } from 'express';
import { vehicleController } from '../controllers/vehicleController.js';
import { resolveTenant } from '../middleware/tenantMiddleware.js';
import { requireAuth, requirePermission } from '../middleware/authMiddleware.js';

const router = Router();

router.use(requireAuth, resolveTenant, requirePermission('vehicles.view'));

router.get('/', vehicleController.getAll);
router.get('/:id', vehicleController.getById);
router.post('/', vehicleController.create);
router.put('/:id', vehicleController.update);
router.delete('/:id', vehicleController.delete);

export default router;
