// MAK Tours & Travels ERP - Integration Controller
// Handles REST APIs for MAK TAXI Vendor App Integration
import {
  verifyInboundApiKey,
  verifyHmacSignature,
  syncVendorFromTaxiApp,
  dispatchOutstationTripToVendor,
  allocateDriverAndVehicleFromTaxiApp,
  INTEGRATION_CONFIG
} from '../services/makTaxiIntegrationService.js';
import { Booking } from '../models/Booking.js';
import { Vendor } from '../models/Vendor.js';
import { buildTenantQuery } from '../middleware/tenantMiddleware.js';

export const integrationController = {
  /**
   * Status / Health check for MAK TAXI integration
   * GET /api/integrations/mak-taxi/status
   */
  getStatus: async (req, res, next) => {
    try {
      const tenantId = req.tenantId || req.user?.tenantId || 'mak-tours';
      const vendorCount = await Vendor.countDocuments({
        ...buildTenantQuery(tenantId),
        source: 'MAK_TAXI_APP'
      });
      const dispatchedTripsCount = await Booking.countDocuments({
        ...buildTenantQuery(tenantId),
        makTaxiDispatchStatus: { $in: ['sent', 'delivered'] }
      });

      return res.status(200).json({
        status: 'success',
        integration: 'MAK TAXI Vendor App',
        active: true,
        authenticated: true,
        config: {
          webhookUrlConfigured: Boolean(INTEGRATION_CONFIG.webhookUrl),
          webhookUrl: INTEGRATION_CONFIG.webhookUrl ? INTEGRATION_CONFIG.webhookUrl.replace(/\/\/.*@/, '//***@') : 'Not Set (Payloads Queued in DB)',
          apiKeyConfigured: Boolean(INTEGRATION_CONFIG.apiKey),
          authMethodsSupported: ['X-API-Key', 'X-MAK-TAXI-API-KEY', 'Bearer Token', 'HMAC-SHA256 Signature']
        },
        stats: {
          syncedVendorsCount: vendorCount,
          dispatchedTripsCount
        },
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * 1. Inbound: Vendor Registration Sync
   * POST /api/integrations/mak-taxi/vendors/sync
   */
  syncVendor: async (req, res, next) => {
    try {
      if (!verifyInboundApiKey(req)) {
        return res.status(401).json({
          status: 'error',
          code: 'UNAUTHORIZED',
          message: 'Invalid or missing API key. Provide header X-API-Key or X-MAK-TAXI-API-KEY or Bearer token.'
        });
      }

      // Check optional HMAC signature if provided
      const sigHeader = req.headers['x-signature-sha256'] || req.headers['x-mak-taxi-signature'];
      if (sigHeader && !verifyHmacSignature(req.body, sigHeader)) {
        return res.status(403).json({
          status: 'error',
          code: 'INVALID_SIGNATURE',
          message: 'HMAC signature verification failed'
        });
      }

      const tenantId = req.headers['x-tenant-id'] || req.body.tenantId || req.tenantId || 'mak-tours';
      const result = await syncVendorFromTaxiApp(req.body, tenantId);

      return res.status(result.action === 'created' ? 201 : 200).json({
        status: 'success',
        action: result.action,
        data: result.vendor,
        message: result.message
      });
    } catch (err) {
      if (err.message && err.message.includes('Missing required field')) {
        return res.status(400).json({ status: 'error', code: 'BAD_REQUEST', message: err.message });
      }
      next(err);
    }
  },

  /**
   * 2. Outbound Trigger / Manual Retry: Dispatch Outstation Trip to MAK TAXI Vendor
   * POST /api/integrations/mak-taxi/trips/:id/dispatch
   */
  dispatchTrip: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { vendorId, vendorPayoutPercent, webhookUrl } = req.body;
      const tenantId = req.tenantId || req.user?.tenantId || 'mak-tours';

      const orClauses = [{ id }, { refId: id }, { bookingNumber: id }, { bookingId: id }];
      if (typeof id === 'string' && id.match(/^[0-9a-fA-F]{24}$/)) {
        orClauses.push({ _id: id });
      }

      const booking = await Booking.findOne({
        ...buildTenantQuery(tenantId),
        $or: orClauses
      });

      if (!booking) {
        return res.status(404).json({
          status: 'error',
          code: 'BOOKING_NOT_FOUND',
          message: `Booking #${id} not found`
        });
      }

      // Resolve vendor
      const targetVendorId = vendorId || booking.assignedVendorId || (booking.assignedVehicle && booking.assignedVehicle.vendorId);
      if (!targetVendorId) {
        return res.status(400).json({
          status: 'error',
          code: 'NO_VENDOR_SPECIFIED',
          message: 'No vendor specified or assigned to this booking. Provide vendorId in request body.'
        });
      }

      const vendor = await Vendor.findOne({
        ...buildTenantQuery(tenantId),
        $or: [
          { vendorId: targetVendorId },
          { externalVendorId: targetVendorId },
          { id: targetVendorId },
          { _id: String(targetVendorId).match(/^[0-9a-fA-F]{24}$/) ? targetVendorId : null }
        ]
      });

      if (!vendor) {
        return res.status(404).json({
          status: 'error',
          code: 'VENDOR_NOT_FOUND',
          message: `Vendor #${targetVendorId} not found`
        });
      }

      const result = await dispatchOutstationTripToVendor(booking, vendor, {
        vendorPayoutPercent,
        webhookUrl
      });

      return res.status(200).json({
        status: 'success',
        dispatched: result.dispatched,
        dispatchStatus: result.status,
        message: result.message,
        data: {
          bookingId: booking.bookingNumber || booking.refId || booking.id,
          vendor: {
            vendorId: vendor.vendorId || vendor.id,
            companyName: vendor.companyName
          },
          payload: result.payload,
          responseData: result.responseData
        }
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * 3. Inbound: Driver and Vehicle Allocation Sync
   * POST /api/integrations/mak-taxi/trips/:id/allocate
   * POST /api/integrations/mak-taxi/trips/allocate
   */
  allocateDriverVehicle: async (req, res, next) => {
    try {
      if (!verifyInboundApiKey(req)) {
        return res.status(401).json({
          status: 'error',
          code: 'UNAUTHORIZED',
          message: 'Invalid or missing API key. Provide header X-API-Key or X-MAK-TAXI-API-KEY or Bearer token.'
        });
      }

      // Check optional HMAC signature if provided
      const sigHeader = req.headers['x-signature-sha256'] || req.headers['x-mak-taxi-signature'];
      if (sigHeader && !verifyHmacSignature(req.body, sigHeader)) {
        return res.status(403).json({
          status: 'error',
          code: 'INVALID_SIGNATURE',
          message: 'HMAC signature verification failed'
        });
      }

      const bookingIdentifier = req.params.id || req.body.bookingId || req.body.bookingNumber || req.body.id;
      if (!bookingIdentifier) {
        return res.status(400).json({
          status: 'error',
          code: 'MISSING_BOOKING_ID',
          message: 'Booking ID is required (in URL path or body.bookingId)'
        });
      }

      const tenantId = req.headers['x-tenant-id'] || req.body.tenantId || req.tenantId || 'mak-tours';
      const result = await allocateDriverAndVehicleFromTaxiApp(bookingIdentifier, req.body, tenantId);

      return res.status(200).json({
        status: 'success',
        data: result.booking,
        allocatedVehicle: result.allocatedVehicle,
        allocatedDriver: result.allocatedDriver,
        message: result.message
      });
    } catch (err) {
      if (err.message && (err.message.includes('not found') || err.message.includes('Missing required'))) {
        return res.status(err.message.includes('not found') ? 404 : 400).json({
          status: 'error',
          code: err.message.includes('not found') ? 'NOT_FOUND' : 'BAD_REQUEST',
          message: err.message
        });
      }
      next(err);
    }
  },

  /**
   * Test Webhook Connection
   * POST /api/integrations/mak-taxi/test-webhook
   */
  testWebhook: async (req, res, next) => {
    try {
      const { targetUrl } = req.body;
      const urlToTest = targetUrl || INTEGRATION_CONFIG.webhookUrl;

      if (!urlToTest) {
        return res.status(400).json({
          status: 'error',
          code: 'NO_WEBHOOK_URL',
          message: 'No webhook URL provided in body.targetUrl and MAK_TAXI_WEBHOOK_URL is not set in environment.'
        });
      }

      const testPayload = {
        event: 'test.ping',
        timestamp: new Date().toISOString(),
        message: 'Ping from MAK Journey ERP Integration Service',
        testBooking: {
          bookingNumber: 'BK-TEST-PING',
          tripType: 'Outstation',
          pickupLocation: 'Chennai',
          destination: 'Pondicherry'
        }
      };

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(urlToTest, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': INTEGRATION_CONFIG.apiKey,
          'X-MAK-ERP-Signature': 'test-signature'
        },
        body: JSON.stringify(testPayload),
        signal: controller.signal
      });

      clearTimeout(timeout);

      const text = await response.text();

      return res.status(200).json({
        status: 'success',
        targetUrl: urlToTest,
        httpStatus: response.status,
        reachable: response.ok,
        responseSample: text.substring(0, 300)
      });
    } catch (err) {
      return res.status(200).json({
        status: 'error',
        reachable: false,
        error: err.message,
        message: `Could not connect to webhook target: ${err.message}`
      });
    }
  }
};

export default integrationController;
