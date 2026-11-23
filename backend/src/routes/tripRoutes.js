import { Router } from 'express';
import { tripController } from '../controllers/tripController.js';
import { resolveTenant } from '../middleware/tenantMiddleware.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = Router();

router.use(requireAuth, resolveTenant);

router.get('/assignments', tripController.getAssignments);
router.get('/:id', tripController.getTrip);
router.post('/:id/accept', tripController.accept);
router.post('/:id/decline', tripController.decline);
router.post('/:id/arrive', tripController.arrive);
router.post('/:id/start', tripController.start);
router.post('/:id/end', tripController.end);

export default router;
