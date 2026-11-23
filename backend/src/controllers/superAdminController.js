// MAK Tours & Travels ERP - Super Admin Platform Controller
import { Company } from '../models/Company.js';
import { License } from '../models/License.js';
import { AuditLog } from '../models/AuditLog.js';
import { User } from '../models/User.js';
import { Vehicle } from '../models/Vehicle.js';
import { Driver } from '../models/Driver.js';
import { Booking } from '../models/Booking.js';
import { Employee } from '../models/Employee.js';
import { Setting } from '../models/Setting.js';
import { clearCompanyCache } from '../middleware/tenantMiddleware.js';

export const superAdminController = {
  // 1. Platform KPI & Dashboard Statistics
  getStats: async (req, res, next) => {
    try {
      const now = new Date();
      const [
        totalCompanies,
        activeCompanies,
        pendingApprovals,
        suspendedCompanies,
        totalBookings,
        totalVehicles,
        totalDrivers,
        totalEmployees
      ] = await Promise.all([
        Company.countDocuments({}),
        Company.countDocuments({ status: 'Active' }),
        Company.countDocuments({ status: 'Pending' }),
        Company.countDocuments({ status: 'Suspended' }),
        Booking.countDocuments({}),
        Vehicle.countDocuments({}),
        Driver.countDocuments({}),
        Employee.countDocuments({})
      ]);

      // Count expired licenses
      const expiredLicenses = await Company.countDocuments({
        licenseExpiry: { $lt: now },
        status: { $ne: 'Pending' }
      });

      // Subscription distribution
      const plans = await Company.aggregate([
        { $match: { status: 'Active' } },
        { $group: { _id: '$plan', count: { $sum: 1 } } }
      ]);

      const planBreakdown = {
        Starter: 0,
        Professional: 0,
        Enterprise: 0
      };
      plans.forEach(p => {
        if (p._id) planBreakdown[p._id] = p.count;
      });

      // Estimated Monthly Platform Revenue (SaaS Subscriptions)
      const starterPrice = 4999;
      const proPrice = 11999;
      const enterprisePrice = 24999;
      const estimatedMRR =
        (planBreakdown.Starter * starterPrice) +
        (planBreakdown.Professional * proPrice) +
        (planBreakdown.Enterprise * enterprisePrice);

      return res.status(200).json({
        status: 'success',
        data: {
          totalCompanies,
          activeCompanies,
          pendingApprovals,
          suspendedCompanies,
          expiredLicenses,
          totalBookings,
          totalVehicles,
          totalDrivers,
          totalEmployees,
          planBreakdown,
          estimatedMRR,
          systemHealth: 'Optimal',
          timestamp: new Date().toISOString()
        }
      });
    } catch (err) {
      next(err);
    }
  },

  // 2. Company Roster with Metrics
  getCompanies: async (req, res, next) => {
    try {
      const { search, status, plan } = req.query;
      const query = {};

      if (status && status !== 'All') {
        query.status = status;
      }
      if (plan && plan !== 'All') {
        query.plan = plan;
      }
      if (search) {
        const s = search.trim();
        query.$or = [
          { name: { $regex: s, $options: 'i' } },
          { tenantId: { $regex: s, $options: 'i' } },
          { email: { $regex: s, $options: 'i' } },
          { city: { $regex: s, $options: 'i' } }
        ];
      }

      const companies = await Company.find(query).sort({ createdAt: -1 }).lean();

      // Enrich companies with live counts
      const enriched = await Promise.all(
        companies.map(async (c) => {
          const [vehCount, drvCount, bookCount] = await Promise.all([
            Vehicle.countDocuments({ tenantId: c.tenantId }),
            Driver.countDocuments({ tenantId: c.tenantId }),
            Booking.countDocuments({ tenantId: c.tenantId })
          ]);

          return {
            ...c,
            vehicleCount: vehCount,
            driverCount: drvCount,
            bookingCount: bookCount
          };
        })
      );

      return res.status(200).json({
        status: 'success',
        count: enriched.length,
        data: enriched
      });
    } catch (err) {
      next(err);
    }
  },

  // 3. Single Company Details
  getCompanyById: async (req, res, next) => {
    try {
      const { id } = req.params;
      const company = await Company.findOne({
        $or: [{ tenantId: id.toLowerCase() }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }]
      }).lean();

      if (!company) {
        return res.status(404).json({
          status: 'error',
          message: `Company with ID "${id}" was not found.`
        });
      }

      const [vehicles, drivers, employees, recentBookings, license] = await Promise.all([
        Vehicle.countDocuments({ tenantId: company.tenantId }),
        Driver.countDocuments({ tenantId: company.tenantId }),
        Employee.countDocuments({ tenantId: company.tenantId }),
        Booking.find({ tenantId: company.tenantId }).sort({ createdAt: -1 }).limit(5).lean(),
        License.findOne({ tenantId: company.tenantId }).lean()
      ]);

      return res.status(200).json({
        status: 'success',
        data: {
          ...company,
          stats: {
            vehicles,
            drivers,
            employees,
            bookings: recentBookings.length
          },
          recentBookings,
          license
        }
      });
    } catch (err) {
      next(err);
    }
  },

  // 4. Create New Company Account (Direct Super Admin Provisioning)
  createCompany: async (req, res, next) => {
    try {
      const {
        name,
        email,
        phone,
        address,
        city,
        state,
        gstin,
        plan = 'Professional',
        adminName,
        adminPassword = 'Admin@123',
        licenseExpiryMonths = 12
      } = req.body;

      if (!name || !email) {
        return res.status(400).json({
          status: 'error',
          message: 'Company name and primary email are required.'
        });
      }

      // Generate clean unique tenant slug
      let baseSlug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
      if (!baseSlug) baseSlug = 'tenant';

      let tenantId = baseSlug;
      let counter = 1;
      while (await Company.findOne({ tenantId })) {
        tenantId = `${baseSlug}-${counter++}`;
      }

      // Calculate license expiration
      const startDate = new Date();
      const expiryDate = new Date();
      expiryDate.setMonth(expiryDate.getMonth() + Number(licenseExpiryMonths));

      const licenseKey = `MAK-LIC-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

      // 1. Create Company Document
      const newCompany = await Company.create({
        tenantId,
        name: name.trim(),
        legalName: name.trim(),
        slug: tenantId,
        email: email.trim().toLowerCase(),
        phone: phone || '',
        address: address || '',
        city: city || 'Chennai',
        state: state || 'Tamil Nadu',
        gstin: gstin || '',
        status: 'Active',
        plan,
        licenseKey,
        licenseStatus: 'Active',
        licenseStart: startDate,
        licenseExpiry: expiryDate,
        limits: {
          maxUsers: plan === 'Enterprise' ? 100 : plan === 'Professional' ? 30 : 10,
          maxVehicles: plan === 'Enterprise' ? 200 : plan === 'Professional' ? 50 : 15,
          maxDrivers: plan === 'Enterprise' ? 200 : plan === 'Professional' ? 50 : 15,
          maxMonthlyBookings: plan === 'Enterprise' ? 10000 : plan === 'Professional' ? 2000 : 500
        },
        branding: {
          logo: '',
          primaryColor: '#2C3480',
          invoicePrefix: `INV-${tenantId.toUpperCase().slice(0, 4)}-`,
          receiptPrefix: `RCPT-${tenantId.toUpperCase().slice(0, 4)}-`,
          bookingPrefix: `BK-${tenantId.toUpperCase().slice(0, 4)}-`,
          currency: 'INR',
          timezone: 'Asia/Kolkata'
        },
        primaryAdmin: {
          name: adminName || `${name} Administrator`,
          email: email.trim().toLowerCase(),
          phone: phone || ''
        }
      });

      // 2. Create Master License Record
      await License.create({
        licenseKey,
        tenantId,
        companyName: name.trim(),
        plan,
        status: 'Active',
        validFrom: startDate,
        validUntil: expiryDate,
        limits: newCompany.limits,
        issuedBy: req.user?.email || 'Super Admin Platform'
      });

      // 3. Create or Link Company Admin User Account
      let adminUser = await User.findOne({ email: email.trim().toLowerCase() });
      if (!adminUser) {
        adminUser = await User.create({
          tenantId,
          fullName: adminName || `${name} Administrator`,
          name: adminName || `${name} Administrator`,
          email: email.trim().toLowerCase(),
          password: adminPassword,
          role: 'company_admin',
          portal: 'admin',
          company: name.trim(),
          status: 'Active',
          isActive: true
        });
      } else {
        await User.findByIdAndUpdate(adminUser._id, {
          $set: {
            tenantId,
            role: 'company_admin',
            portal: 'admin',
            company: name.trim(),
            status: 'Active'
          }
        });
      }

      // Link User to Company
      await Company.findByIdAndUpdate(newCompany._id, {
        $set: { 'primaryAdmin.userId': adminUser._id }
      });

      // 4. Audit Log
      await AuditLog.create({
        tenantId,
        action: 'COMPANY_CREATED',
        actorId: req.user?.id || 'super_admin',
        actorName: req.user?.name || 'Super Admin',
        actorEmail: req.user?.email || 'superadmin@maktours.com',
        actorRole: 'super_admin',
        entityType: 'Company',
        entityId: tenantId,
        details: { companyName: name, plan, licenseKey },
        ipAddress: req.ip
      });

      clearCompanyCache(tenantId);

      return res.status(201).json({
        status: 'success',
        message: `Company "${name}" successfully registered and provisioned!`,
        data: newCompany
      });
    } catch (err) {
      next(err);
    }
  },

  // 5. Update Company Status (Approve, Suspend, Reactivate, Reject)
  updateCompanyStatus: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { status, reason } = req.body;

      if (!['Active', 'Suspended', 'Rejected', 'Pending'].includes(status)) {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid status. Allowed: Active, Suspended, Rejected, Pending'
        });
      }

      const company = await Company.findOne({
        $or: [{ tenantId: id.toLowerCase() }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }]
      });

      if (!company) {
        return res.status(404).json({
          status: 'error',
          message: `Company "${id}" not found.`
        });
      }

      const previousStatus = company.status;
      company.status = status;

      if (status === 'Suspended') {
        company.suspensionReason = reason || 'Suspended by platform administration';
      } else if (status === 'Rejected') {
        company.rejectionReason = reason || 'Company application rejected';
      } else if (status === 'Active') {
        company.suspensionReason = '';
        company.rejectionReason = '';

        // If activating from Pending, ensure a valid license exists
        if (!company.licenseKey || company.licenseStatus !== 'Active') {
          const licenseKey = company.licenseKey || `MAK-LIC-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
          const startDate = new Date();
          const expiryDate = new Date();
          expiryDate.setFullYear(expiryDate.getFullYear() + 1);

          company.licenseKey = licenseKey;
          company.licenseStatus = 'Active';
          company.licenseStart = startDate;
          company.licenseExpiry = expiryDate;

          await License.findOneAndUpdate(
            { tenantId: company.tenantId },
            {
              licenseKey,
              tenantId: company.tenantId,
              companyName: company.name,
              plan: company.plan,
              status: 'Active',
              validFrom: startDate,
              validUntil: expiryDate,
              limits: company.limits,
              issuedBy: req.user?.email || 'Super Admin Platform'
            },
            { upsert: true, new: true }
          );
        }

        // Activate or create the primary admin user account
        if (company.primaryAdmin?.email) {
          const existingUser = await User.findOne({ email: company.primaryAdmin.email });
          if (existingUser) {
            await User.findByIdAndUpdate(existingUser._id, {
              $set: { status: 'Active', isActive: true, tenantId: company.tenantId, role: 'company_admin', portal: 'admin' }
            });
          } else {
            await User.create({
              tenantId: company.tenantId,
              fullName: company.primaryAdmin.name || `${company.name} Admin`,
              name: company.primaryAdmin.name || `${company.name} Admin`,
              email: company.primaryAdmin.email,
              password: 'Admin@123',
              role: 'company_admin',
              portal: 'admin',
              company: company.name,
              status: 'Active',
              isActive: true
            });
          }
        }
      }

      await company.save();
      clearCompanyCache(company.tenantId);

      // Audit Log
      await AuditLog.create({
        tenantId: company.tenantId,
        action: `COMPANY_STATUS_${status.toUpperCase()}`,
        actorId: req.user?.id || 'super_admin',
        actorName: req.user?.name || 'Super Admin',
        actorEmail: req.user?.email || 'superadmin@maktours.com',
        actorRole: 'super_admin',
        entityType: 'Company',
        entityId: company.tenantId,
        details: { previousStatus, newStatus: status, reason },
        ipAddress: req.ip
      });

      return res.status(200).json({
        status: 'success',
        message: `Company status updated to "${status}"!`,
        data: company
      });
    } catch (err) {
      next(err);
    }
  },

  // 6. Manage License & Subscriptions
  updateCompanyLicense: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { plan, expiryDate, limits, enabledModules } = req.body;

      const company = await Company.findOne({
        $or: [{ tenantId: id.toLowerCase() }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }]
      });

      if (!company) {
        return res.status(404).json({
          status: 'error',
          message: `Company "${id}" not found.`
        });
      }

      if (plan) company.plan = plan;
      if (expiryDate) company.licenseExpiry = new Date(expiryDate);
      if (limits) company.limits = { ...company.limits, ...limits };
      if (enabledModules) company.enabledModules = enabledModules;

      await company.save();

      // Update License record
      if (company.licenseKey) {
        await License.findOneAndUpdate(
          { tenantId: company.tenantId },
          {
            plan: company.plan,
            validUntil: company.licenseExpiry,
            limits: company.limits,
            enabledModules: company.enabledModules
          }
        );
      }

      clearCompanyCache(company.tenantId);

      // Audit Log
      await AuditLog.create({
        tenantId: company.tenantId,
        action: 'LICENSE_UPDATED',
        actorId: req.user?.id || 'super_admin',
        actorName: req.user?.name || 'Super Admin',
        actorEmail: req.user?.email || 'superadmin@maktours.com',
        actorRole: 'super_admin',
        entityType: 'License',
        entityId: company.tenantId,
        details: { plan, expiryDate, limits, enabledModules },
        ipAddress: req.ip
      });

      return res.status(200).json({
        status: 'success',
        message: `License and plan details updated for ${company.name}!`,
        data: company
      });
    } catch (err) {
      next(err);
    }
  },

  // 7. Reset Company Admin Password
  resetCompanyAdminPassword: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { newPassword } = req.body;

      if (!newPassword || newPassword.length < 6) {
        return res.status(400).json({
          status: 'error',
          message: 'New password must be at least 6 characters long.'
        });
      }

      const company = await Company.findOne({
        $or: [{ tenantId: id.toLowerCase() }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }]
      });

      if (!company) {
        return res.status(404).json({
          status: 'error',
          message: `Company "${id}" not found.`
        });
      }

      const adminEmail = company.primaryAdmin?.email || company.email;
      const user = await User.findOne({ email: adminEmail });

      if (!user) {
        return res.status(404).json({
          status: 'error',
          message: `Admin user for email ${adminEmail} not found in database.`
        });
      }

      user.password = newPassword;
      await user.save();

      // Audit Log
      await AuditLog.create({
        tenantId: company.tenantId,
        action: 'ADMIN_PASSWORD_RESET',
        actorId: req.user?.id || 'super_admin',
        actorName: req.user?.name || 'Super Admin',
        actorEmail: req.user?.email || 'superadmin@maktours.com',
        actorRole: 'super_admin',
        entityType: 'User',
        entityId: user._id.toString(),
        details: { adminEmail },
        ipAddress: req.ip
      });

      return res.status(200).json({
        status: 'success',
        message: `Password for ${adminEmail} successfully reset!`
      });
    } catch (err) {
      next(err);
    }
  },

  // 8. System Audit Logs
  getAuditLogs: async (req, res, next) => {
    try {
      const { tenantId, action, limit = 100 } = req.query;
      const query = {};

      if (tenantId && tenantId !== 'All') {
        query.tenantId = tenantId;
      }
      if (action && action !== 'All') {
        query.action = action;
      }

      const logs = await AuditLog.find(query)
        .sort({ createdAt: -1 })
        .limit(Number(limit))
        .lean();

      return res.status(200).json({
        status: 'success',
        count: logs.length,
        data: logs
      });
    } catch (err) {
      next(err);
    }
  },

  // 9. Global SaaS Settings
  getGlobalSettings: async (req, res, next) => {
    try {
      const settings = await Setting.find({ tenantId: 'system' }).lean();
      const settingsObj = {};
      settings.forEach(s => {
        settingsObj[s.key] = s.value;
      });

      return res.status(200).json({
        status: 'success',
        data: settingsObj
      });
    } catch (err) {
      next(err);
    }
  },

  updateGlobalSettings: async (req, res, next) => {
    try {
      const { settings } = req.body;
      if (!settings || typeof settings !== 'object') {
        return res.status(400).json({
          status: 'error',
          message: 'Settings object is required.'
        });
      }

      for (const [key, val] of Object.entries(settings)) {
        await Setting.findOneAndUpdate(
          { tenantId: 'system', key },
          { tenantId: 'system', key, value: val },
          { upsert: true }
        );
      }

      return res.status(200).json({
        status: 'success',
        message: 'Global settings updated successfully!'
      });
    } catch (err) {
      next(err);
    }
  }
};

export default superAdminController;
