// MAK Tours & Travels ERP - Super Admin Routes
import { Router } from 'express';
import { superAdminController } from '../controllers/superAdminController.js';
import { requireAuth } from '../middleware/authMiddleware.js';
import { requireSuperAdmin } from '../middleware/tenantMiddleware.js';

const router = Router();

// Protect all Super Admin routes with strict dual authentication and authorization
router.use(requireAuth, requireSuperAdmin);

// Platform Metrics & Overview
router.get('/stats', superAdminController.getStats);

// Company Management
router.get('/companies', superAdminController.getCompanies);
router.post('/companies', superAdminController.createCompany);
router.get('/companies/:id', superAdminController.getCompanyById);
router.put('/companies/:id/status', superAdminController.updateCompanyStatus);
router.put('/companies/:id/license', superAdminController.updateCompanyLicense);
router.post('/companies/:id/reset-admin', superAdminController.resetCompanyAdminPassword);

// Audit & Security Logs
router.get('/audit-logs', superAdminController.getAuditLogs);

// Global SaaS Settings
router.get('/settings', superAdminController.getGlobalSettings);
router.put('/settings', superAdminController.updateGlobalSettings);

export default router;
