// MAK Tours & Travels ERP - Staff Attendance Routes
import { Router } from 'express';
import { attendanceController } from '../controllers/attendanceController.js';
import { resolveTenant } from '../middleware/tenantMiddleware.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = Router();

router.use(requireAuth, resolveTenant);

router.get('/', attendanceController.getAll);
router.get('/history/:employeeId', attendanceController.getHistory);
router.post('/mark', attendanceController.mark);
router.post('/bulk-mark', attendanceController.bulkMark);
router.delete('/:id', attendanceController.delete);

export default router;
