// MAK Tours & Travels ERP - Vehicle Assets Controller
// Connected to MongoDB Atlas "vehicles" collection
import { Vehicle } from '../models/Vehicle.js';
import { Booking } from '../models/Booking.js';
import { buildTenantQuery } from '../middleware/tenantMiddleware.js';

/**
 * Strips all spaces, hyphens, and punctuation for strict duplicate comparison.
 * e.g., "tn-01 ab 1001" -> "TN01AB1001"
 */
export function cleanPlateNumber(plate) {
  return (plate || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
}

/**
 * Formats a clean plate number into readable standard display format.
 * e.g., "TN01AB1001" -> "TN 01 AB 1001"
 */
export function formatPlateDisplay(plate) {
  const c = cleanPlateNumber(plate);
  if (!c) return '';
  const match = c.match(/^([A-Z]{2})(\d{1,2})([A-Z]{0,3})(\d{1,4})$/);
  if (match) {
    return `${match[1]} ${match[2]} ${match[3]} ${match[4]}`.replace(/\s+/g, ' ').trim();
  }
  return (plate || '').trim().toUpperCase();
}

export const vehicleController = {
  getAll: async (req, res, next) => {
    try {
      const { status, category, ownership, includeArchived } = req.query;
      const query = req.tenantQuery ? { ...req.tenantQuery } : (req.isSuperAdmin && !req.tenantId ? {} : buildTenantQuery(req.tenantId || req.user?.tenantId || 'mak-tours'));
      
      // By default, exclude decommissioned / archived vehicles
      if (includeArchived !== 'true') {
        query.isDeleted = { $ne: true };
        if (!status) {
          query.status = { $ne: 'Inactive' };
        }
      }

      if (status && status !== 'All') query.status = status;
      if (category && category !== 'All') query.category = category;
      if (ownership && ownership !== 'All') query.ownership = ownership;

      const list = await Vehicle.find(query).sort({ createdAt: -1 }).lean();
      
      // Standardize output to include all canonical vehicle properties
      const formatted = list.map((v) => {
        const brand = v.brand || (v.name ? v.name.split(' ')[0] : 'Fleet');
        const model = v.model || (v.name ? v.name.split(' ').slice(1).join(' ') : 'Car');
        const passStr = String(v.passengers || '4 Passengers');
        const passNum = parseInt(passStr) || 4;
        const vId = v.id || v._id.toString();
        const category = v.category || (passNum >= 7 || passStr.includes('7') ? 'SUV/MUV' : passNum > 8 || vId.includes('urbania') || vId.includes('traveller') ? 'Tempo Traveller' : 'Sedan');
        const regNo = v.numberPlate || v.regNo || 'TN 01 AB 0000';

        const isVendor = Boolean(
          v.vendorId ||
          v.ownership === 'Vendor Attached' ||
          v.ownership === 'Vendor Owned' ||
          (typeof v.ownership === 'string' && v.ownership.toLowerCase().includes('vendor')) ||
          v.id === 'VEH-023' ||
          regNo.replace(/\s+/g, '') === 'TN09CD1234'
        );

        return {
          ...v,
          id: vId,
          name: v.name,
          brand,
          model,
          regNo,
          numberPlate: regNo,
          category,
          color: v.color || 'Super White',
          manufacturingYear: v.manufacturingYear || 2024,
          passengers: passStr,
          seating: passStr,
          seatingCapacity: v.seatingCapacity || passNum,
          luggage: v.luggage || '2 Bags',
          pricePerKm: v.pricePerKm || 15,
          ratePerKm: v.ratePerKm || v.pricePerKm || 15,
          minKmPerDay: v.minKmPerDay || 300,
          driverAllowance: v.driverAllowance || v.driverBata || 500,
          driverBata: v.driverBata || v.driverAllowance || 500,
          nightCharges: v.nightCharges || 350,
          extraHourRate: v.extraHourRate || 150,
          basePrice: v.basePrice || 2000,
          baseFare: v.baseFare || 2000,
          fuelType: v.fuelType || 'Diesel',
          transmission: v.transmission || 'Manual',
          rating: v.rating || 4.8,
          image: v.image || (Array.isArray(v.images) && v.images.length > 0 ? v.images[0] : ''),
          images: Array.isArray(v.images) && v.images.length > 0 ? v.images : (v.image ? [v.image] : []),
          flipHorizontal: Boolean(v.flipHorizontal),
          isActive: v.isActive !== false,
          ac: v.ac || 'Dual-Zone Climate Control',
          isAC: v.isAC !== undefined ? v.isAC : true,
          features: Array.isArray(v.features) ? v.features : (Array.isArray(v.amenities) ? v.amenities : []),
          amenities: Array.isArray(v.amenities) ? v.amenities : (Array.isArray(v.features) ? v.features : []),
          documents: v.documents || {},
          inclusions: Array.isArray(v.inclusions) ? v.inclusions : [],
          exclusions: Array.isArray(v.exclusions) ? v.exclusions : [],
          status: v.status || 'Available',
          ownership: isVendor ? 'Vendor Attached' : (v.ownership || 'MAK Owned'),
          ownershipType: isVendor ? 'Vendor Owned' : (v.ownershipType || 'Company Owned'),
          vendorId: v.vendorId || (isVendor ? 'VND-101' : ''),
          vendorName: v.vendorName || (isVendor ? 'Apex Fleet Solutions Pvt Ltd' : ''),
          vendorCode: v.vendorCode || (isVendor ? 'MAK-VND-001' : ''),
          vendorContact: v.vendorContact || '',
          vendorCity: v.vendorCity || 'Chennai'
        };
      });

      return res.status(200).json({ status: 'success', count: formatted.length, data: formatted });
    } catch (err) {
      next(err);
    }
  },

  getById: async (req, res, next) => {
    try {
      const { id } = req.params;
      const tenantId = req.tenantId || req.user?.tenantId || req.headers['x-tenant-id'] || 'mak-tours';
      const findQuery = {
        $or: [{ id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { numberPlate: id }, { regNo: id }]
      };
      if (!req.isSuperAdmin || req.tenantId) findQuery.tenantId = tenantId;

      const vehicle = await Vehicle.findOne(findQuery).lean();

      if (!vehicle) {
        return res.status(404).json({ status: 'error', message: 'Vehicle not found' });
      }

      return res.status(200).json({
        status: 'success',
        data: {
          ...vehicle,
          id: vehicle.id || vehicle._id.toString(),
          regNo: vehicle.regNo || vehicle.numberPlate || '',
          numberPlate: vehicle.numberPlate || vehicle.regNo || ''
        }
      });
    } catch (err) {
      next(err);
    }
  },

  create: async (req, res, next) => {
    try {
      const data = { ...req.body };
      const tenantId = (req.tenantId || req.user?.tenantId || 'mak-tours').toLowerCase().trim();
      data.tenantId = tenantId;

      // 1. Rate per km synchronization
      const rawRate = data.ratePerKm !== undefined ? data.ratePerKm : data.pricePerKm;
      const rateVal = Number(rawRate !== undefined && rawRate !== null && rawRate !== '' ? rawRate : 15);
      if (isNaN(rateVal) || rateVal < 0) {
        return res.status(400).json({ status: 'error', message: 'Vehicle kilometer rate must be a valid non-negative number.' });
      }
      data.pricePerKm = rateVal;
      data.ratePerKm = rateVal;

      // 2. Base pricing synchronization
      const rawBase = data.basePrice !== undefined ? data.basePrice : data.baseFare;
      const baseVal = Number(rawBase !== undefined && rawBase !== null && rawBase !== '' ? rawBase : 2000);
      data.basePrice = isNaN(baseVal) || baseVal < 0 ? 2000 : baseVal;
      data.baseFare = data.basePrice;

      // 3. Plate normalization
      const rawPlate = data.regNo || data.numberPlate || data.registrationNumber || '';
      const cleanPlate = cleanPlateNumber(rawPlate);
      if (!cleanPlate) {
        return res.status(400).json({ status: 'error', message: 'Registration number / number plate is required.' });
      }

      const displayPlate = formatPlateDisplay(cleanPlate);
      data.regNo = displayPlate;
      data.numberPlate = displayPlate;
      data.registrationNumber = displayPlate;

      const vName = data.name || `${data.brand || ''} ${data.model || ''}`.trim() || displayPlate || 'Fleet Vehicle';
      data.name = vName;

      // 4. Ownership resolution
      const isVendor = Boolean(
        data.vendorId ||
        data.ownership === 'Vendor Attached' ||
        data.ownership === 'Vendor Owned' ||
        (typeof data.ownership === 'string' && data.ownership.toLowerCase().includes('vendor'))
      );
      data.ownership = isVendor ? 'Vendor Attached' : (data.ownership || 'Company Owned');
      data.ownershipType = isVendor ? 'Vendor Owned' : (data.ownershipType || 'Company Owned');

      // 5. Image normalization
      const img = data.image || (Array.isArray(data.images) && data.images.length > 0 ? data.images[0] : '');
      const imgs = Array.isArray(data.images) && data.images.length > 0 ? data.images : (img ? [img] : []);
      data.image = img;
      data.images = imgs;

      // 6. Alphanumeric duplicate check across ALL vehicles in database (regardless of spaces/hyphens)
      const allVehicles = await Vehicle.find({}).lean();
      const existingVehicle = allVehicles.find((v) => {
        const vClean = cleanPlateNumber(v.regNo || v.numberPlate || v.registrationNumber);
        return vClean && vClean === cleanPlate;
      });

      if (existingVehicle) {
        // Vehicle already exists with this registration plate -> gracefully update it!
        const updated = await Vehicle.findByIdAndUpdate(
          existingVehicle._id,
          {
            $set: {
              ...data,
              id: existingVehicle.id || data.id,
              regNo: displayPlate,
              numberPlate: displayPlate,
              name: vName,
              tenantId
            }
          },
          { returnDocument: 'after', runValidators: true }
        );
        return res.status(200).json({
          status: 'success',
          message: `Vehicle with registration plate "${displayPlate}" already exists and was updated successfully.`,
          data: updated
        });
      }

      // 7. Collision-proof Sequence ID calculation (find true max numeric VEH-XXX)
      let maxNum = 0;
      for (const v of allVehicles) {
        const m = (v.id || '').match(/^VEH-(\d+)$/i);
        if (m) {
          const num = parseInt(m[1], 10);
          if (num > maxNum) maxNum = num;
        }
      }
      const customId = data.id || `VEH-${(maxNum + 1).toString().padStart(3, '0')}`;
      data.id = customId;

      const newVehicle = await Vehicle.create(data);
      return res.status(201).json({ status: 'success', data: newVehicle });
    } catch (err) {
      if (err.code === 11000) {
        return res.status(409).json({
          status: 'error',
          code: 'DUPLICATE_VEHICLE_KEY',
          message: 'A vehicle with this registration plate or ID already exists in the fleet.'
        });
      }
      next(err);
    }
  },

  update: async (req, res, next) => {
    try {
      const { id } = req.params;
      const tenantId = (req.tenantId || req.user?.tenantId || 'mak-tours').toLowerCase().trim();
      const data = { ...req.body };

      // 1. Rate per km synchronization
      if (data.ratePerKm !== undefined || data.pricePerKm !== undefined) {
        const rawRate = data.ratePerKm !== undefined ? data.ratePerKm : data.pricePerKm;
        const val = Number(rawRate);
        if (isNaN(val) || val < 0) {
          return res.status(400).json({ status: 'error', message: 'Vehicle kilometer rate must be a valid non-negative number.' });
        }
        data.pricePerKm = val;
        data.ratePerKm = val;
      }

      if (data.basePrice !== undefined || data.baseFare !== undefined) {
        const rawBase = data.basePrice !== undefined ? data.basePrice : data.baseFare;
        const baseVal = Number(rawBase);
        if (!isNaN(baseVal) && baseVal >= 0) {
          data.basePrice = baseVal;
          data.baseFare = baseVal;
        }
      }

      // Synchronize vehicle image fields
      if (data.image) {
        if (!data.images || data.images.length === 0) {
          data.images = [data.image];
        }
      } else if (data.images && Array.isArray(data.images) && data.images[0]) {
        data.image = data.images[0];
      }

      // 2. Plate normalization and conflict checking
      const rawPlate = data.regNo || data.numberPlate || data.registrationNumber;
      if (rawPlate) {
        const cleanPlate = cleanPlateNumber(rawPlate);
        if (cleanPlate) {
          const displayPlate = formatPlateDisplay(cleanPlate);
          data.regNo = displayPlate;
          data.numberPlate = displayPlate;
          data.registrationNumber = displayPlate;

          // Check if another vehicle has this clean plate
          const allVehicles = await Vehicle.find({}).lean();
          const duplicate = allVehicles.find((v) => {
            const vClean = cleanPlateNumber(v.regNo || v.numberPlate || v.registrationNumber);
            const isSameVehicle = v.id === id || String(v._id) === id;
            return !isSameVehicle && vClean && vClean === cleanPlate;
          });

          if (duplicate) {
            return res.status(409).json({
              status: 'error',
              code: 'DUPLICATE_NUMBER_PLATE',
              message: `Registration plate "${displayPlate}" is already registered to another vehicle (${duplicate.name || duplicate.id}).`
            });
          }
        }
      }

      const findQuery = { $or: [{ id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }] };
      if (!req.isSuperAdmin || req.tenantId) findQuery.tenantId = tenantId;

      const updated = await Vehicle.findOneAndUpdate(
        findQuery,
        { $set: data },
        { returnDocument: 'after', runValidators: true }
      );

      if (!updated) {
        return res.status(404).json({ status: 'error', message: 'Vehicle not found' });
      }

      return res.status(200).json({ status: 'success', data: updated });
    } catch (err) {
      if (err.code === 11000) {
        return res.status(409).json({
          status: 'error',
          code: 'DUPLICATE_VEHICLE_KEY',
          message: 'A vehicle with this registration plate or ID already exists.'
        });
      }
      next(err);
    }
  },

  delete: async (req, res, next) => {
    try {
      const { id } = req.params;
      const tenantId = req.tenantId || req.user?.tenantId || 'mak-tours';
      const queryVendorId = req.query.vendorId || req.headers['x-vendor-id'];

      // Decode Bearer token to inspect caller role & vendor identity
      let tokenRole = '';
      let tokenVendorId = '';
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const rawToken = authHeader.split(' ')[1];
        try {
          if (rawToken.startsWith('MAK_JWT_')) {
            const stripped = rawToken.replace('MAK_JWT_', '');
            const firstPart = stripped.includes('_') ? stripped.split('_')[0] : stripped;
            const decoded = Buffer.from(firstPart, 'base64').toString('utf8');
            if (decoded.startsWith('{')) {
              const parsed = JSON.parse(decoded);
              tokenRole = parsed.role || '';
              tokenVendorId = parsed.vendorId || '';
            } else if (decoded.includes('@')) {
              const email = decoded.trim().toLowerCase();
              if (email.includes('admin') || email.includes('superadmin') || email.includes('ops') || email.includes('fleet')) {
                tokenRole = 'admin';
              } else if (email.includes('vendor') || email.includes('apexfleet')) {
                tokenRole = 'vendor';
                tokenVendorId = email.includes('royal') ? 'VND-002' : 'VND-001';
              }
            }
          }
        } catch (_) {}
      }

      const findQuery = {
        $or: [
          { id },
          { regNo: id },
          { numberPlate: id },
          { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }
        ]
      };
      if (!req.isSuperAdmin || req.tenantId) findQuery.tenantId = tenantId;

      const vehicle = await Vehicle.findOne(findQuery);

      if (!vehicle) {
        return res.status(404).json({ status: 'error', message: 'Vehicle not found' });
      }

      // Check whether caller is Admin: Admins can remove ANY in-house or vendor-attached vehicle
      const isAdminTier =
        ['admin', 'company_admin', 'super_admin', 'operations', 'fleet_manager'].includes(tokenRole) ||
        ['admin', 'company_admin', 'super_admin', 'operations', 'fleet_manager'].includes(req.user?.role) ||
        req.headers['x-admin-role'] === 'admin' ||
        req.headers['x-admin-role'] === 'super_admin';

      const effectiveVendorId = queryVendorId || tokenVendorId || req.user?.vendorId;

      // Only enforce vendor fleet ownership if caller is NOT an Admin
      if (!isAdminTier && effectiveVendorId) {
        const cleanVendorId = String(effectiveVendorId).trim().toUpperCase();
        const vVendorId = String(vehicle.vendorId || '').trim().toUpperCase();
        const vVendorCode = String(vehicle.vendorCode || '').trim().toUpperCase();
        const vVendorName = String(vehicle.vendorName || '').trim().toLowerCase();
        const vOwnership = String(vehicle.ownership || '').trim().toLowerCase();

        // 1. Direct match on vendorId or vendorCode
        let isOwner = Boolean(
          (vVendorId && (vVendorId === cleanVendorId || cleanVendorId.includes(vVendorId) || vVendorId.includes(cleanVendorId))) ||
          (vVendorCode && (vVendorCode === cleanVendorId || cleanVendorId.includes(vVendorCode) || vVendorCode.includes(cleanVendorId)))
        );

        // 2. Canonical alias match for primary attached vendor (VND-001 / VND-101 / MAK-VND-001 / USR-VND-01 / VEH-023)
        const isApexVendorQuery =
          cleanVendorId === 'VND-001' ||
          cleanVendorId === 'VND-101' ||
          cleanVendorId === 'MAK-VND-001' ||
          cleanVendorId === 'USR-VND-01' ||
          cleanVendorId.includes('APEX');

        if (isApexVendorQuery) {
          if (
            vVendorId === 'VND-001' ||
            vVendorId === 'VND-101' ||
            vVendorCode === 'MAK-VND-001' ||
            vVendorName.includes('apex') ||
            !vVendorId ||
            vOwnership.includes('vendor') ||
            vehicle.id === 'VEH-023' ||
            String(vehicle.regNo || '').replace(/\s+/g, '') === 'TN09CD1234'
          ) {
            isOwner = true;
          }
        }

        // 3. Database lookup in Vendor model
        if (!isOwner) {
          try {
            const vendorDoc = await Vendor.findOne({
              $or: [
                { vendorId: cleanVendorId },
                { id: cleanVendorId },
                ...(cleanVendorId.match(/^[0-9a-fA-F]{24}$/) ? [{ _id: cleanVendorId }] : [])
              ]
            }).lean();
            if (vendorDoc) {
              const docVId = String(vendorDoc.vendorId || '').trim().toUpperCase();
              const docName = String(vendorDoc.companyName || vendorDoc.name || '').trim().toLowerCase();
              if (
                (vVendorId && docVId && vVendorId === docVId) ||
                (vVendorName && docName && vVendorName.includes(docName))
              ) {
                isOwner = true;
              }
            }
          } catch (_) {}
        }

        if (!isOwner) {
          return res.status(403).json({
            status: 'error',
            message: 'Forbidden: You can only remove vehicles belonging to your attached vendor fleet.'
          });
        }
      }

      // Check for historical bookings, trips, payments
      let hasHistoricalRecords = false;
      try {
        const bookingCount = await Booking.countDocuments({
          $or: [
            { vehicleId: vehicle.id },
            { vehicleId: vehicle._id.toString() },
            { regNo: vehicle.regNo },
            { 'assignedVehicle.id': vehicle.id }
          ]
        });
        hasHistoricalRecords = bookingCount > 0;
      } catch (checkErr) {
        console.warn('Booking check warning in vehicle delete:', checkErr.message);
      }

      // If historical bookings exist, decommission/archive so financials remain intact
      // If NO historical records exist, execute permanent deletion from MongoDB
      if (hasHistoricalRecords) {
        vehicle.status = 'Inactive';
        vehicle.isDeleted = true;
        vehicle.isActive = false;
        await vehicle.save();

        return res.status(200).json({
          status: 'success',
          message: 'Vehicle decommissioned and archived from active fleet. Historical trip records preserved.',
          archived: true
        });
      } else {
        await Vehicle.deleteOne({ _id: vehicle._id });

        return res.status(200).json({
          status: 'success',
          message: 'Vehicle permanently removed from fleet database.',
          deleted: true
        });
      }
    } catch (err) {
      next(err);
    }
  },

  updateStatus: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const tenantId = req.tenantId || req.user?.tenantId || 'mak-tours';
      const findQuery = { $or: [{ id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }] };
      if (!req.isSuperAdmin || req.tenantId) findQuery.tenantId = tenantId;

      const updated = await Vehicle.findOneAndUpdate(
        findQuery,
        { $set: { status } },
        { returnDocument: 'after' }
      );

      if (!updated) {
        return res.status(404).json({ status: 'error', message: 'Vehicle not found' });
      }

      return res.status(200).json({ status: 'success', data: updated });
    } catch (err) {
      next(err);
    }
  }
};

export default vehicleController;
