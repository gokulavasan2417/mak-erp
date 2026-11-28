// MAK Tours & Travels ERP - Dedicated Driver Operations Controller
// Collection: drivers (Separate collection for Drivers)
import { Driver } from '../models/Driver.js';
import { buildTenantQuery, mergeTenantFilter } from '../middleware/tenantMiddleware.js';

export const driverController = {
  getAll: async (req, res, next) => {
    try {
      const { status, dutyStatus } = req.query;
      const tenantId = req.tenantId || req.user?.tenantId || req.headers['x-tenant-id'] || 'mak-tours';
      const tenantQuery = req.tenantQuery || buildTenantQuery(tenantId);
      const query = req.isSuperAdmin && !req.tenantId ? {} : { ...tenantQuery };

      if (dutyStatus && dutyStatus !== 'All') query.dutyStatus = dutyStatus;
      if (status && status !== 'All') query.status = status;

      const list = await Driver.find(query).sort({ createdAt: -1 }).lean();
      
      const formatted = list.map((d) => ({
        ...d,
        id: d.id || d.driverBadgeId || d._id.toString(),
        badgeId: d.driverBadgeId || d.badgeNumber || d.id || '',
        name: d.name || d.fullName || ''
      }));

      return res.status(200).json({ status: 'success', count: formatted.length, data: formatted });
    } catch (err) {
      next(err);
    }
  },

  getById: async (req, res, next) => {
    try {
      const { id } = req.params;
      const tenantId = req.tenantId || req.user?.tenantId || req.headers['x-tenant-id'] || 'mak-tours';
      const tenantQuery = req.tenantQuery || buildTenantQuery(tenantId);
      const specificFilter = {
        $or: [{ id }, { driverBadgeId: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }]
      };
      const findQuery = (!req.isSuperAdmin || req.tenantId)
        ? mergeTenantFilter(tenantQuery, specificFilter)
        : specificFilter;

      const driver = await Driver.findOne(findQuery).lean();

      if (!driver) {
        return res.status(404).json({ status: 'error', message: 'Driver not found' });
      }

      return res.status(200).json({
        status: 'success',
        data: {
          ...driver,
          id: driver.id || driver.driverBadgeId || driver._id.toString(),
          badgeId: driver.driverBadgeId || driver.badgeNumber || driver.id || '',
          name: driver.name || driver.fullName || ''
        }
      });
    } catch (err) {
      next(err);
    }
  },

  create: async (req, res, next) => {
    try {
      const data = req.body;
      const tenantId = req.tenantId || req.user?.tenantId || req.headers['x-tenant-id'] || data.tenantId || 'mak-tours';
      const count = await Driver.countDocuments({ tenantId });
      const seq = (count + 1).toString().padStart(3, '0');
      const badgeId = data.driverBadgeId || `DRV-${seq}`;

      const newDriver = await Driver.create({
        tenantId,
        ...data,
        driverBadgeId: badgeId,
        id: badgeId,
        fullName: data.fullName || data.name,
        name: data.fullName || data.name,
        dutyStatus: data.dutyStatus || 'Available'
      });

      return res.status(201).json({ status: 'success', data: newDriver });
    } catch (err) {
      next(err);
    }
  },

  update: async (req, res, next) => {
    try {
      const { id } = req.params;
      const tenantId = req.tenantId || req.user?.tenantId || req.headers['x-tenant-id'] || 'mak-tours';
      const tenantQuery = req.tenantQuery || buildTenantQuery(tenantId);
      const specificFilter = {
        $or: [{ id }, { driverBadgeId: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }]
      };
      const findQuery = (!req.isSuperAdmin || req.tenantId)
        ? mergeTenantFilter(tenantQuery, specificFilter)
        : specificFilter;

      const updated = await Driver.findOneAndUpdate(
        findQuery,
        { $set: req.body },
        { returnDocument: 'after', runValidators: true }
      );

      if (!updated) {
        return res.status(404).json({ status: 'error', message: 'Driver not found' });
      }

      return res.status(200).json({ status: 'success', data: updated });
    } catch (err) {
      next(err);
    }
  },

  delete: async (req, res, next) => {
    try {
      const { id } = req.params;
      const tenantId = req.tenantId || req.user?.tenantId || req.headers['x-tenant-id'] || 'mak-tours';
      const tenantQuery = req.tenantQuery || buildTenantQuery(tenantId);
      const specificFilter = {
        $or: [{ id }, { driverBadgeId: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }]
      };
      const findQuery = (!req.isSuperAdmin || req.tenantId)
        ? mergeTenantFilter(tenantQuery, specificFilter)
        : specificFilter;

      const deleted = await Driver.findOneAndDelete(findQuery);

      if (!deleted) {
        return res.status(404).json({ status: 'error', message: 'Driver not found' });
      }

      return res.status(200).json({ status: 'success', message: 'Driver deleted successfully' });
    } catch (err) {
      next(err);
    }
  },

  updateDutyStatus: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { dutyStatus } = req.body;
      const tenantId = req.tenantId || req.user?.tenantId || req.headers['x-tenant-id'] || 'mak-tours';
      const tenantQuery = req.tenantQuery || buildTenantQuery(tenantId);
      const specificFilter = {
        $or: [{ id }, { driverBadgeId: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }]
      };
      const findQuery = (!req.isSuperAdmin || req.tenantId)
        ? mergeTenantFilter(tenantQuery, specificFilter)
        : specificFilter;

      const updated = await Driver.findOneAndUpdate(
        findQuery,
        { $set: { dutyStatus } },
        { returnDocument: 'after' }
      );

      if (!updated) {
        return res.status(404).json({ status: 'error', message: 'Driver not found' });
      }

      return res.status(200).json({ status: 'success', data: updated });
    } catch (err) {
      next(err);
    }
  },

  getAvailability: async (req, res, next) => {
    try {
      const { id } = req.params;
      const tenantId = req.tenantId || req.user?.tenantId || req.headers['x-tenant-id'] || 'mak-tours';
      const tenantQuery = req.tenantQuery || buildTenantQuery(tenantId);
      const specificFilter = {
        $or: [{ id }, { driverBadgeId: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }]
      };
      const findQuery = (!req.isSuperAdmin || req.tenantId)
        ? mergeTenantFilter(tenantQuery, specificFilter)
        : specificFilter;

      const driver = await Driver.findOne(findQuery).lean();

      if (!driver) {
        return res.status(404).json({ status: 'error', message: 'Driver not found' });
      }

      return res.status(200).json({
        status: 'success',
        data: {
          driverId: driver.driverBadgeId || driver.id,
          dutyStatus: driver.dutyStatus || 'Available'
        }
      });
    } catch (err) {
      next(err);
    }
  },

  updateAvailability: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { dutyStatus } = req.body;
      const tenantId = req.tenantId || req.user?.tenantId || req.headers['x-tenant-id'] || 'mak-tours';
      const tenantQuery = req.tenantQuery || buildTenantQuery(tenantId);
      const specificFilter = {
        $or: [{ id }, { driverBadgeId: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }]
      };
      const findQuery = (!req.isSuperAdmin || req.tenantId)
        ? mergeTenantFilter(tenantQuery, specificFilter)
        : specificFilter;

      const updated = await Driver.findOneAndUpdate(
        findQuery,
        { $set: { dutyStatus } },
        { returnDocument: 'after' }
      );

      if (!updated) {
        return res.status(404).json({ status: 'error', message: 'Driver not found' });
      }

      return res.status(200).json({ status: 'success', data: updated });
    } catch (err) {
      next(err);
    }
  },

  getApplications: async (req, res, next) => {
    try {
      const tenantId = req.tenantId || req.user?.tenantId || req.headers['x-tenant-id'] || 'mak-tours';
      const tenantQuery = req.tenantQuery || buildTenantQuery(tenantId);
      const query = req.isSuperAdmin && !req.tenantId ? {} : { ...tenantQuery };

      // Return drivers with application/verification statuses or all candidates
      const applications = await Driver.find({
        ...query,
        status: { $in: ['Pending Verification', 'Under Review', 'Documents Required', 'Rejected', 'Active'] }
      }).sort({ createdAt: -1 }).lean();

      const formatted = applications.map((d) => ({
        id: d.id || d.driverBadgeId || d._id.toString(),
        applicationId: d.id || d.driverBadgeId || d._id.toString(),
        fullName: d.fullName || d.name || '',
        phone: d.phone || '',
        email: d.email || '',
        experience: d.experienceYears ? `${d.experienceYears} Years` : '3 Years',
        experienceYears: d.experienceYears || 3,
        vehiclePreference: 'Sedan / SUV',
        licenseNumber: d.licenseNumber || '',
        licenseExpiry: d.licenseExpiry || '',
        badgeNumber: d.badgeNumber || d.driverBadgeId || '',
        rating: d.rating || 5.0,
        status: d.status === 'Active' ? 'Approved' : (d.status || 'Under Review'),
        appliedDate: d.createdAt ? new Date(d.createdAt).toISOString().substring(0, 10) : '2026-11-20',
        city: d.city || 'Chennai',
        state: d.state || 'Tamil Nadu',
        policeVerified: d.policeVerified ?? true,
        medicalFitnessValid: d.medicalFitnessValid ?? true,
        documents: d.documents || {}
      }));

      return res.status(200).json({ status: 'success', count: formatted.length, data: formatted });
    } catch (err) {
      next(err);
    }
  },

  updateApplicationStatus: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { status, rejectionReason, remarks } = req.body;
      const tenantId = req.tenantId || req.user?.tenantId || req.headers['x-tenant-id'] || 'mak-tours';
      const tenantQuery = req.tenantQuery || buildTenantQuery(tenantId);
      const specificFilter = {
        $or: [{ id }, { driverBadgeId: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }]
      };
      const findQuery = (!req.isSuperAdmin || req.tenantId)
        ? mergeTenantFilter(tenantQuery, specificFilter)
        : specificFilter;

      const normStatus = (status || '').toUpperCase() === 'APPROVED' ? 'Active' : (status || 'Under Review');
      const updateFields = {
        status: normStatus,
        dutyStatus: normStatus === 'Active' ? 'Available' : 'Resting'
      };
      if (rejectionReason || remarks) {
        updateFields.adminRemarks = rejectionReason || remarks;
      }

      const updated = await Driver.findOneAndUpdate(
        findQuery,
        { $set: updateFields },
        { returnDocument: 'after' }
      );

      return res.status(200).json({
        status: 'success',
        message: `Driver application ${id} updated to ${status}`,
        data: updated
      });
    } catch (err) {
      next(err);
    }
  },

  updateApplicationDocument: async (req, res, next) => {
    try {
      const { id, docId } = req.params;
      const { status, rejectionReason } = req.body;
      const tenantId = req.tenantId || req.user?.tenantId || req.headers['x-tenant-id'] || 'mak-tours';
      const tenantQuery = req.tenantQuery || buildTenantQuery(tenantId);
      const specificFilter = {
        $or: [{ id }, { driverBadgeId: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }]
      };
      const findQuery = (!req.isSuperAdmin || req.tenantId)
        ? mergeTenantFilter(tenantQuery, specificFilter)
        : specificFilter;

      const updateKey = `documents.${docId}Status`;
      const updated = await Driver.findOneAndUpdate(
        findQuery,
        { $set: { [updateKey]: status, lastDocumentRemark: rejectionReason || '' } },
        { returnDocument: 'after' }
      );

      return res.status(200).json({
        status: 'success',
        message: `Document ${docId} on application ${id} updated to ${status}`,
        data: updated
      });
    } catch (err) {
      next(err);
    }
  }
};

export default driverController;
