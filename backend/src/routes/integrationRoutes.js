// MAK Tours & Travels ERP - Integration Router for External Partner Applications
// Mounts secure APIs for MAK TAXI Vendor App Integration
import { Router } from 'express';
import { integrationController } from '../controllers/integrationController.js';
import { resolveTenant } from '../middleware/tenantMiddleware.js';

const router = Router();

// Resolve tenant safely (supports x-tenant-id header or defaults to mak-tours)
router.use(resolveTenant);

// Status & diagnostic route
router.get('/mak-taxi/status', integrationController.getStatus);

// 1. Inbound: Vendor Registration Sync (invoked by MAK TAXI Vendor App backend upon admin approval)
router.post('/mak-taxi/vendors/sync', integrationController.syncVendor);

// 2. Outbound Trigger: Dispatch Outstation Trip to MAK TAXI Vendor App
router.post('/mak-taxi/trips/:id/dispatch', integrationController.dispatchTrip);

// 3. Inbound: Driver and Vehicle Allocation Sync (invoked by MAK TAXI App backend when vendor selects car + driver)
router.post('/mak-taxi/trips/:id/allocate', integrationController.allocateDriverVehicle);
router.post('/mak-taxi/trips/allocate', integrationController.allocateDriverVehicle);

// Connectivity testing
router.post('/mak-taxi/test-webhook', integrationController.testWebhook);

export default router;
