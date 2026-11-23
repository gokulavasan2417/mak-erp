import { Router } from 'express';
import { authController, uploadAvatarMiddleware } from '../controllers/authController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = Router();

router.post('/login', authController.login);
router.post('/register', authController.register);
router.post('/company-register', authController.companyRegister);
router.get('/me', requireAuth, authController.getProfile);
router.put('/me', requireAuth, authController.updateProfile);
router.post('/upload-avatar', requireAuth, uploadAvatarMiddleware, authController.uploadAvatar);
router.post('/avatar', requireAuth, uploadAvatarMiddleware, authController.uploadAvatar);
router.post('/logout', authController.logout);

export default router;
