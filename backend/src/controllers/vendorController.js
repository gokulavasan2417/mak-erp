// MAK Tours & Travels ERP - Dedicated Vendor / Partner Controller
// Collection: vendors (Separate collection for Vendors)
import { Vendor } from '../models/Vendor.js';
import { Vehicle } from '../models/Vehicle.js';
import { buildTenantQuery, mergeTenantFilter } from '../middleware/tenantMiddleware.js';

export const vendorController = {
  getAll: async (req, res, next) => {
    try {
      const { status } = req.query;
      const tenantId = req.tenantId || req.user?.tenantId || req.headers['x-tenant-id'] || 'mak-tours';
      const tenantQuery = req.tenantQuery || buildTenantQuery(tenantId);
      const query = req.isSuperAdmin && !req.tenantId ? {} : { ...tenantQuery };

      if (status && status !== 'All') query.status = status;

      const list = await Vendor.find(query).sort({ createdAt: -1 }).lean();

      const formatted = list.map((v) => ({
        ...v,
        id: v.id || v.vendorId || v._id.toString(),
        name: v.companyName || v.name || ''
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
        $or: [{ id }, { vendorId: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }]
      };
      const findQuery = (!req.isSuperAdmin || req.tenantId)
        ? mergeTenantFilter(tenantQuery, specificFilter)
        : specificFilter;

      const vendor = await Vendor.findOne(findQuery).lean();

      if (!vendor) {
        return res.status(404).json({ status: 'error', message: 'Vendor not found' });
      }

      return res.status(200).json({
        status: 'success',
        data: {
          ...vendor,
          id: vendor.id || vendor.vendorId || vendor._id.toString(),
          name: vendor.companyName || vendor.name || ''
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
      const count = await Vendor.countDocuments({ tenantId });
      const seq = (count + 1).toString().padStart(3, '0');
      const vendorId = data.vendorId || `VND-${seq}`;

      const newVendor = await Vendor.create({
        tenantId,
        ...data,
        vendorId,
        id: vendorId,
        companyName: data.companyName || data.name,
        name: data.companyName || data.name,
        contactPerson: data.contactPerson || data.ownerName || ''
      });

      return res.status(201).json({ status: 'success', data: newVendor });
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
        $or: [{ id }, { vendorId: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }]
      };
      const findQuery = (!req.isSuperAdmin || req.tenantId)
        ? mergeTenantFilter(tenantQuery, specificFilter)
        : specificFilter;

      const updated = await Vendor.findOneAndUpdate(
        findQuery,
        { $set: req.body },
        { returnDocument: 'after', runValidators: true }
      );

      if (!updated) {
        return res.status(404).json({ status: 'error', message: 'Vendor not found' });
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
        $or: [{ id }, { vendorId: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }]
      };
      const findQuery = (!req.isSuperAdmin || req.tenantId)
        ? mergeTenantFilter(tenantQuery, specificFilter)
        : specificFilter;

      const deleted = await Vendor.findOneAndDelete(findQuery);

      if (!deleted) {
        return res.status(404).json({ status: 'error', message: 'Vendor not found' });
      }

      return res.status(200).json({ status: 'success', message: 'Vendor deleted successfully' });
    } catch (err) {
      next(err);
    }
  },

  getVehicles: async (req, res, next) => {
    try {
      const { id } = req.params;
      const tenantId = req.tenantId || req.user?.tenantId || req.headers['x-tenant-id'] || 'mak-tours';
      const tenantQuery = req.tenantQuery || buildTenantQuery(tenantId);
      const specificFilter = {
        $or: [{ id }, { vendorId: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }]
      };
      const findQuery = (!req.isSuperAdmin || req.tenantId)
        ? mergeTenantFilter(tenantQuery, specificFilter)
        : specificFilter;

      const vendor = await Vendor.findOne(findQuery).lean();

      if (!vendor) {
        return res.status(404).json({ status: 'error', message: 'Vendor not found' });
      }

      return res.status(200).json({ status: 'success', count: vendor.vehiclesAssigned?.length || 0, data: vendor.vehiclesAssigned || [] });
    } catch (err) {
      next(err);
    }
  },

  addVehicle: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { vehicleRegNo, vehicleId } = req.body;
      const tenantId = req.tenantId || req.user?.tenantId || req.headers['x-tenant-id'] || 'mak-tours';
      const tenantQuery = req.tenantQuery || buildTenantQuery(tenantId);
      const specificFilter = {
        $or: [{ id }, { vendorId: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }]
      };
      const findQuery = (!req.isSuperAdmin || req.tenantId)
        ? mergeTenantFilter(tenantQuery, specificFilter)
        : specificFilter;

      const vendor = await Vendor.findOne(findQuery);

      if (!vendor) {
        return res.status(404).json({ status: 'error', message: 'Vendor not found' });
      }

      const plate = vehicleRegNo || vehicleId;

      if (plate) {
        // Enforce vehicle belongs to same tenant
        const targetVehicle = await Vehicle.findOne(
          mergeTenantFilter(buildTenantQuery(vendor.tenantId || tenantId), {
            $or: [
              { regNo: plate },
              { id: plate },
              { numberPlate: plate },
              { _id: plate.match(/^[0-9a-fA-F]{24}$/) ? plate : null }
            ]
          })
        );

        if (!targetVehicle) {
          return res.status(400).json({
            status: 'error',
            code: 'CROSS_TENANT_RELATIONSHIP_FORBIDDEN',
            message: 'Vehicle does not belong to this company or was not found in company fleet'
          });
        }

        const canonicalReg = targetVehicle.regNo || targetVehicle.id;
        if (!vendor.vehiclesAssigned.includes(canonicalReg)) {
          vendor.vehiclesAssigned.push(canonicalReg);
          vendor.fleetCount = vendor.vehiclesAssigned.length;
          vendor.totalVehiclesAttached = vendor.vehiclesAssigned.length;
          await vendor.save();
        }

        // Link vehicle to vendor
        targetVehicle.vendorId = vendor.vendorId || vendor.id;
        targetVehicle.vendorName = vendor.companyName || vendor.name;
        targetVehicle.ownership = 'Attached';
        await targetVehicle.save();
      }

      return res.status(200).json({ status: 'success', data: vendor });
    } catch (err) {
      next(err);
    }
  }
};

export default vendorController;
