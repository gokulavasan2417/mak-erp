// MAK Tours & Travels ERP - Tenant Settings Controller
import { Setting } from '../models/Setting.js';
import { buildTenantQuery } from '../middleware/tenantMiddleware.js';

export const settingController = {
  getSettings: async (req, res, next) => {
    try {
      const tenantId = req.tenantId || req.user?.tenantId || req.headers['x-tenant-id'] || 'mak-tours';
      const settings = await Setting.find({ tenantId }).lean();
      const settingsMap = {};
      settings.forEach((s) => {
        settingsMap[s.key] = s.value;
      });
      return res.status(200).json({ status: 'success', data: settingsMap });
    } catch (err) {
      next(err);
    }
  },

  updateSettings: async (req, res, next) => {
    try {
      const tenantId = req.tenantId || req.user?.tenantId || req.headers['x-tenant-id'] || 'mak-tours';
      const settingsData = req.body || {};

      const updates = Object.entries(settingsData).map(([key, value]) =>
        Setting.findOneAndUpdate(
          { tenantId, key },
          { $set: { value } },
          { upsert: true, returnDocument: 'after' }
        )
      );

      await Promise.all(updates);

      return res.status(200).json({
        status: 'success',
        message: 'Settings updated successfully',
        data: settingsData
      });
    } catch (err) {
      next(err);
    }
  }
};

export default settingController;
