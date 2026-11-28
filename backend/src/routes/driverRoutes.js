import { Router } from 'express';
import { driverController } from '../controllers/driverController.js';
import { resolveTenant } from '../middleware/tenantMiddleware.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = Router();

router.use(requireAuth, resolveTenant);

router.get('/applications', driverController.getApplications);
router.put('/applications/:id/status', driverController.updateApplicationStatus);
router.put('/applications/:id/documents/:docId', driverController.updateApplicationDocument);

router.get('/', driverController.getAll);
router.get('/:id', driverController.getById);
router.post('/', driverController.create);
router.put('/:id', driverController.update);
router.delete('/:id', driverController.delete);
router.get('/:id/availability', driverController.getAvailability);
router.put('/:id/availability', driverController.updateAvailability);

export default router;
