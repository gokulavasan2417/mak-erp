// MAK Tours & Travels ERP - Multi-Tenant Customer Controller
// Collection: customers
import { Customer } from '../models/Customer.js';
import { Booking } from '../models/Booking.js';
import { buildTenantQuery, mergeTenantFilter } from '../middleware/tenantMiddleware.js';

// Helper to reliably normalize phone number to standard 10 digits
export function normalizePhoneDigits(phone) {
  if (!phone) return '';
  const digits = String(phone).replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) return digits.slice(2);
  if (digits.length === 11 && digits.startsWith('0')) return digits.slice(1);
  return digits.length >= 10 ? digits.slice(-10) : digits;
}

// Automatically detect any booking passenger (even with 1 trip) and auto-enroll into Customer CRM
export async function autoEnrollRepeatCustomers(tenantQuery, tenantId) {
  try {
    const bookings = await Booking.find(tenantQuery).lean();
    if (!bookings || bookings.length === 0) return;

    // Group bookings by clean 10-digit phone number or fallback identifier
    const customerGroups = new Map();
    for (const b of bookings) {
      const rawPhone = b.customerPhone || b.mobileNumber || b.phone || '';
      const clean = normalizePhoneDigits(rawPhone);
      let key = clean && clean.length >= 10 ? `phone:${clean}` : null;
      if (!key) {
        const rawEmail = (b.email || b.customerEmail || '').trim().toLowerCase();
        if (rawEmail) key = `email:${rawEmail}`;
      }
      if (!key) {
        const rawName = (b.fullName || b.customerName || b.name || '').trim().toLowerCase();
        if (rawName) key = `name:${rawName}`;
      }
      if (!key) continue;

      if (!customerGroups.has(key)) {
        customerGroups.set(key, { cleanPhone: clean || '', bookings: [] });
      }
      customerGroups.get(key).bookings.push(b);
    }

    // Get all existing customers in this tenant
    const existingCustomers = await Customer.find(tenantQuery).lean();
    const existingMap = new Map();
    let maxCount = 0;
    for (const c of existingCustomers) {
      const clean = normalizePhoneDigits(c.phone);
      if (clean && clean.length >= 10) existingMap.set(clean, c);
      if (c.email) existingMap.set(`email:${c.email.trim().toLowerCase()}`, c);
      if (c.name) existingMap.set(`name:${c.name.trim().toLowerCase()}`, c);

      const match = String(c.id || '').match(/CUST-(\d+)/i);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxCount) maxCount = num;
      }
    }
    if (maxCount === 0) maxCount = existingCustomers.length;

    // Iterate through all booked passengers (even 1 trip is enrolled as customer)
    for (const [, { cleanPhone, bookings: bList }] of customerGroups.entries()) {
      if (!bList || bList.length < 1) continue;

      const totalBookings = bList.length;
      const totalSpent = bList.reduce(
        (sum, b) => sum + Number(b.totalAmount || b.totalFare || b.fare || b.pricing || 0),
        0
      );
      const latestB = bList[bList.length - 1];
      const primaryName = (latestB.fullName || latestB.customerName || latestB.name || 'Valued Client').trim();
      const primaryPhone = latestB.customerPhone || latestB.mobileNumber || latestB.phone || cleanPhone;
      const primaryEmail = (latestB.email || latestB.customerEmail || '').trim();
      const primaryCity = latestB.city || latestB.pickupLocation || 'Chennai';
      const isCorporate = Boolean(latestB.companyName || latestB.isCorporate || latestB.gstin);

      const clean = normalizePhoneDigits(primaryPhone);
      const existing = (clean && clean.length >= 10 && existingMap.get(clean)) ||
        (primaryEmail && existingMap.get(`email:${primaryEmail.toLowerCase()}`)) ||
        (primaryName && existingMap.get(`name:${primaryName.toLowerCase()}`));

      if (!existing) {
        maxCount += 1;
        const custId = `CUST-${String(maxCount).padStart(3, '0')}`;
        await Customer.create({
          tenantId: tenantId || 'mak-tours',
          id: custId,
          name: primaryName,
          phone: primaryPhone,
          email: primaryEmail,
          city: primaryCity,
          type: isCorporate ? 'Corporate' : 'Individual',
          status: 'Active',
          totalBookings,
          totalSpent,
          rating: 5.0,
          notes: `Auto-enrolled customer (${totalBookings} booking${totalBookings > 1 ? 's' : ''} detected).`
        });

        if (clean && clean.length >= 10) existingMap.set(clean, { id: custId });
        if (primaryEmail) existingMap.set(`email:${primaryEmail.toLowerCase()}`, { id: custId });
        if (primaryName) existingMap.set(`name:${primaryName.toLowerCase()}`, { id: custId });
      } else {
        // Sync stats if changed
        if (existing.totalBookings !== totalBookings || existing.totalSpent !== totalSpent) {
          await Customer.updateOne(
            { _id: existing._id },
            {
              $set: {
                totalBookings,
                totalSpent,
                ...(primaryEmail && !existing.email ? { email: primaryEmail } : {})
              }
            }
          );
        }
      }
    }
  } catch (err) {
    console.warn('[CustomerController] Auto-enroll customers note:', err.message);
  }
}

export const customerController = {
  getAll: async (req, res, next) => {
    try {
      const { type, status, search, q } = req.query;
      const tenantId = req.tenantId || req.user?.tenantId || req.headers['x-tenant-id'] || 'mak-tours';
      const tenantQuery = req.tenantQuery || buildTenantQuery(tenantId);

      // Automatically sync repeat bookers (>= 2 bookings) into the Customer collection
      await autoEnrollRepeatCustomers(tenantQuery, tenantId);

      const query = req.isSuperAdmin && !req.tenantId ? {} : { ...tenantQuery };

      if (type && type !== 'All') query.type = type;
      if (status && status !== 'All') query.status = status;

      const searchTerm = (search || q || '').trim();
      if (searchTerm) {
        const regex = new RegExp(searchTerm.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&'), 'i');
        query.$or = [
          { name: regex },
          { phone: regex },
          { email: regex },
          { companyName: regex },
          { city: regex }
        ];
      }

      const list = await Customer.find(query).sort({ createdAt: -1 }).lean();
      const formatted = list.map((c) => ({
        ...c,
        id: c.id || c._id.toString()
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
        $or: [{ id }, { phone: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }]
      };
      const findQuery = (!req.isSuperAdmin || req.tenantId)
        ? mergeTenantFilter(tenantQuery, specificFilter)
        : specificFilter;

      const customer = await Customer.findOne(findQuery).lean();

      if (!customer) {
        return res.status(404).json({ status: 'error', message: 'Customer not found' });
      }

      return res.status(200).json({
        status: 'success',
        data: {
          ...customer,
          id: customer.id || customer._id.toString()
        }
      });
    } catch (err) {
      next(err);
    }
  },

  create: async (req, res, next) => {
    try {
      const data = req.body;
      const tenantId = req.user?.tenantId || req.tenantId || (req.isSuperAdmin && data.tenantId) || 'mak-tours';

      const name = (data.name || data.fullName || '').trim();
      if (!name) {
        return res.status(400).json({ status: 'error', message: 'Customer name is required' });
      }

      const phone = (data.phone || '').trim();
      if (!phone) {
        return res.status(400).json({ status: 'error', message: 'Customer phone number is required' });
      }

      // Check collision within tenant
      const existing = await Customer.findOne({ tenantId, phone });
      if (existing) {
        return res.status(400).json({
          status: 'error',
          message: `Customer with phone '${phone}' is already registered in this company (${existing.name})`
        });
      }

      const count = await Customer.countDocuments({ tenantId });
      const seq = (count + 1).toString().padStart(3, '0');
      const id = data.id || `CUST-${seq}`;

      const newCustomer = await Customer.create({
        ...data,
        tenantId,
        id,
        name,
        phone,
        type: data.type || 'Individual',
        status: data.status || 'Active'
      });

      return res.status(201).json({ status: 'success', data: newCustomer });
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
        $or: [{ id }, { phone: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }]
      };
      const findQuery = (!req.isSuperAdmin || req.tenantId)
        ? mergeTenantFilter(tenantQuery, specificFilter)
        : specificFilter;

      const updates = { ...req.body };
      delete updates.tenantId; // Never mutate tenant ownership

      const updated = await Customer.findOneAndUpdate(
        findQuery,
        { $set: updates },
        { returnDocument: 'after', runValidators: true }
      );

      if (!updated) {
        return res.status(404).json({ status: 'error', message: 'Customer not found' });
      }

      return res.status(200).json({ status: 'success', data: updated });
    } catch (err) {
      next(err);
    }
  },

  delete: async (req, res, next) => {
    try {
      const { id } = req.params;
      let tenantId = req.tenantId || req.user?.tenantId || req.headers['x-tenant-id'] || 'mak-tours';
      const tenantQuery = req.tenantQuery || buildTenantQuery(tenantId);
      const specificFilter = {
        $or: [{ id }, { phone: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }]
      };
      const findQuery = (!req.isSuperAdmin || req.tenantId)
        ? mergeTenantFilter(tenantQuery, specificFilter)
        : specificFilter;

      const target = await Customer.findOne(findQuery);

      if (!target) {
        return res.status(404).json({ status: 'error', message: 'Customer not found' });
      }

      tenantId = target.tenantId || tenantId;

      // Check if bookings exist for this customer in this company
      const bookingCount = await Booking.countDocuments({
        tenantId,
        $or: [
          { customerPhone: target.phone },
          { mobileNumber: target.phone },
          { customerId: target.id }
        ]
      });

      if (bookingCount > 0) {
        return res.status(400).json({
          status: 'error',
          hasHistory: true,
          message: `Cannot delete customer '${target.name}'. ${bookingCount} trip booking(s) exist in this company. Set status to Inactive instead to preserve audit records.`
        });
      }

      await Customer.findByIdAndDelete(target._id);

      return res.status(200).json({ status: 'success', message: 'Customer deleted successfully' });
    } catch (err) {
      next(err);
    }
  }
};

export default customerController;
