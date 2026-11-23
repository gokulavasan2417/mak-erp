import { Router } from 'express';
import { vendorController } from '../controllers/vendorController.js';
import { resolveTenant } from '../middleware/tenantMiddleware.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = Router();

router.use(requireAuth, resolveTenant);

router.get('/', vendorController.getAll);
router.get('/:id', vendorController.getById);
router.post('/', vendorController.create);
router.put('/:id', vendorController.update);
router.get('/:id/vehicles', vendorController.getVehicles);
router.post('/:id/vehicles', vendorController.addVehicle);

export default router;
