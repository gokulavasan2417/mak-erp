// MAK Tours & Travels ERP - Tenant Settings Router
import { Router } from 'express';
import { settingController } from '../controllers/settingController.js';
import { resolveTenant } from '../middleware/tenantMiddleware.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = Router();

router.use(requireAuth, resolveTenant);

router.get('/', settingController.getSettings);
router.put('/', settingController.updateSettings);

export default router;
