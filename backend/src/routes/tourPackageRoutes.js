import { Router } from 'express';
import { tourPackageController } from '../controllers/tourPackageController.js';
import { resolveTenant } from '../middleware/tenantMiddleware.js';

const router = Router();

router.use(resolveTenant);

router.get('/', tourPackageController.getAll);
router.get('/:id', tourPackageController.getById);
router.post('/', tourPackageController.create);
router.put('/:id', tourPackageController.update);
router.delete('/:id', tourPackageController.delete);

export default router;
