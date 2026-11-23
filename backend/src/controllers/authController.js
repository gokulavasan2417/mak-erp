// MAK Tours & Travels ERP - Centralized Auth Controller
// Checks and syncs User, Driver, Vendor, and Employee models with MongoDB Atlas
import { User } from '../models/User.js';
import { Company } from '../models/Company.js';
import { AuditLog } from '../models/AuditLog.js';
import { Driver } from '../models/Driver.js';
import { Vendor } from '../models/Vendor.js';
import { Employee } from '../models/Employee.js';
import { processUploadedFile, processBase64Avatar, avatarUpload } from '../middleware/uploadMiddleware.js';
import { signToken } from '../utils/jwtUtils.js';
import multer from 'multer';

export const uploadAvatarMiddleware = (req, res, next) => {
  const upload = avatarUpload.single('avatar');
  upload(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({
        status: 'error',
        message: `Upload error: ${err.message}`
      });
    } else if (err) {
      return res.status(400).json({
        status: 'error',
        message: err.message
      });
    }
    next();
  });
};

export const authController = {
  login: async (req, res, next) => {
    try {
      const { email, password, role } = req.body;
      const cleanEmail = (email || '').trim().toLowerCase();

      // 1. Check User collection first
      let user = await User.findOne({ email: cleanEmail }).lean();

      // If user found in User collection and is Staff / Employee
      if (user && (user.role === 'staff' || user.role === 'employee' || user.portal === 'staff')) {
        user.portal = 'staff';
        // Enrich user with live linked Employee data from MongoDB Atlas
        let linkedEmp = await Employee.findOne({
          $or: [
            ...(user._id ? [{ userId: user._id }] : []),
            { email: cleanEmail },
            ...(user.employeeCode ? [{ employeeCode: user.employeeCode }] : [])
          ]
        }).lean();

        // If no Employee document exists yet for this staff member in MongoDB, create one!
        if (!linkedEmp) {
          const empCode = user.employeeCode || 'MAK-EMP-010';
          const newEmp = await Employee.create({
            userId: user._id,
            employeeCode: empCode,
            code: empCode,
            id: empCode,
            fullName: user.fullName || user.name || 'Staff Member',
            name: user.fullName || user.name || 'Staff Member',
            email: cleanEmail,
            phone: user.phone || user.mobileNumber || '+91 98401 23456',
            role: user.designation || 'Operations Staff',
            designation: user.designation || 'Operations Associate',
            department: user.department || 'Operations & Dispatch',
            workType: 'Operations Staff',
            jobRole: user.designation || 'Operations Associate',
            reportingManager: 'Ananya Deshmukh (General Operations Manager)',
            workLocation: 'Chennai HQ - Main Operations Center',
            employmentType: 'Full-Time',
            responsibilities: [
              'Live customer itinerary management and tour reservations',
              'Fleet vehicle assignment coordination with senior dispatchers',
              'Customer travel support, route coordination & emergency resolution'
            ],
            salaryBasis: 'Attendance-Based Monthly Salary',
            monthlySalary: 42000,
            salary: 42000,
            status: 'Active',
            avatar: user.avatar || ''
          });
          linkedEmp = newEmp.toObject();
          // Update User.employeeId
          await User.findByIdAndUpdate(user._id, { $set: { employeeId: newEmp._id, employeeCode: empCode } });
        }

        if (linkedEmp) {
          user.employeeId = linkedEmp._id;
          user.employeeCode = linkedEmp.employeeCode || linkedEmp.code || user.employeeCode;
          user.designation = linkedEmp.designation || linkedEmp.role || user.designation;
          user.department = linkedEmp.department || user.department;
          user.workType = linkedEmp.workType || user.workType;
          user.jobRole = linkedEmp.jobRole || user.jobRole;
          user.monthlySalary = Number(linkedEmp.monthlySalary || linkedEmp.salary || user.monthlySalary || 42000);
          user.salaryBasis = linkedEmp.salaryBasis || user.salaryBasis || 'Attendance-Based Monthly Salary';
          user.reportingManager = linkedEmp.reportingManager || user.reportingManager;
          user.workLocation = linkedEmp.workLocation || user.workLocation;
          user.employmentType = linkedEmp.employmentType || user.employmentType;
          user.status = linkedEmp.status || user.status;
          user.responsibilities = linkedEmp.responsibilities || user.responsibilities;
          user.address = linkedEmp.address || user.address || '';
          user.emergencyContact = linkedEmp.emergencyContact || user.emergencyContact || '';
          if (!user.avatar && linkedEmp.avatar) user.avatar = linkedEmp.avatar;
        }
      }

      // If user found in User collection and is Vendor
      if (user && (user.role === 'vendor' || role === 'vendor' || user.portal === 'vendor' || cleanEmail.includes('vendor') || cleanEmail.includes('apexfleet') || cleanEmail.includes('royaltravels'))) {
        user.role = 'vendor';
        user.portal = 'vendor';
        user.vendorId = user.vendorId || 'VND-001';

        let linkedVendor = await Vendor.findOne({
          $or: [
            { vendorId: user.vendorId },
            { email: cleanEmail }
          ]
        }).lean();

        if (!linkedVendor) {
          const newVnd = await Vendor.create({
            vendorId: user.vendorId,
            id: user.vendorId,
            companyName: user.companyName || user.company || 'Apex Fleet Solutions Pvt Ltd',
            name: user.name || 'Apex Fleet Solutions',
            ownerName: user.name || 'Apex Fleet Solutions',
            email: cleanEmail,
            phone: user.phone || user.mobileNumber || '+91 98401 99887',
            role: 'vendor',
            city: 'Chennai',
            state: 'Tamil Nadu',
            status: 'Active'
          });
          linkedVendor = newVnd.toObject();
        }

        if (linkedVendor) {
          user.vendorId = linkedVendor.vendorId || linkedVendor.id || user.vendorId;
          user.companyName = linkedVendor.companyName || linkedVendor.name || user.companyName;
          user.company = linkedVendor.companyName || user.company;
        }

        await User.findByIdAndUpdate(user._id, {
          $set: {
            role: 'vendor',
            portal: 'vendor',
            vendorId: user.vendorId
          }
        });
      }

      // If user found in User collection and is Driver
      if (user && (user.role === 'driver' || role === 'driver' || user.portal === 'driver' || cleanEmail.includes('driver'))) {
        user.role = 'driver';
        user.portal = 'driver';
        user.driverBadgeId = user.driverBadgeId || 'DRV-001';
        await User.findByIdAndUpdate(user._id, {
          $set: {
            role: 'driver',
            portal: 'driver',
            driverBadgeId: user.driverBadgeId
          }
        });
      }

      // If user found in User collection and is Accountant / Finance
      if (user && (user.role === 'accountant' || user.role === 'finance_admin' || role === 'accountant' || cleanEmail.includes('finance') || cleanEmail.includes('accountant'))) {
        user.role = 'accountant';
        user.portal = 'accountant';
        const accountantPermissions = [
          'finance.view', 'finance.manage', 'finance.create', 'finance.edit',
          'income.view', 'income.manage', 'income.create',
          'expense.view', 'expense.manage', 'expense.create', 'expense.edit', 'expense.approve',
          'invoice.view', 'invoice.manage', 'invoice.create', 'invoice.edit', 'invoice.cancel',
          'payments.view', 'payments.manage', 'payments.create',
          'ledger.view', 'ledger.manage', 'ledger.create',
          'reports.view', 'reports.export',
          'payroll.view', 'driver.settle', 'vendor.pay'
        ];
        user.permissions = accountantPermissions;
        await User.findByIdAndUpdate(user._id, {
          $set: {
            role: 'accountant',
            portal: 'accountant',
            permissions: accountantPermissions
          }
        });
      }

      // 2. If not in User, check Driver collection
      if (!user) {
        const driver = await Driver.findOne({
          $or: [{ email: cleanEmail }, { phone: cleanEmail }, { driverBadgeId: cleanEmail }]
        }).lean();
        if (driver) {
          user = {
            id: driver.driverBadgeId || driver.id || driver._id.toString(),
            name: driver.fullName || driver.name,
            fullName: driver.fullName || driver.name,
            email: driver.email || cleanEmail,
            role: 'driver',
            portal: 'driver',
            driverBadgeId: driver.driverBadgeId || driver.id,
            status: driver.status || 'Active',
            avatar: driver.avatar || ''
          };
        }
      }

      // 3. If not in Driver, check Vendor collection
      if (!user) {
        const vendor = await Vendor.findOne({
          $or: [{ email: cleanEmail }, { phone: cleanEmail }, { vendorId: cleanEmail }]
        }).lean();
        if (vendor) {
          user = {
            id: vendor.vendorId || vendor.id || vendor._id.toString(),
            name: vendor.companyName || vendor.name,
            companyName: vendor.companyName || vendor.name,
            email: vendor.email || cleanEmail,
            role: 'vendor',
            portal: 'vendor',
            vendorId: vendor.vendorId || vendor.id,
            status: vendor.status || 'Active',
            avatar: vendor.avatar || ''
          };
        }
      }

      // 4. If not in Vendor, check Employee collection
      if (!user) {
        const employee = await Employee.findOne({
          $or: [{ email: cleanEmail }, { phone: cleanEmail }, { employeeCode: cleanEmail }]
        }).lean();
        if (employee) {
          user = {
            id: employee.employeeCode || employee.id || employee._id.toString(),
            name: employee.fullName || employee.name,
            fullName: employee.fullName || employee.name,
            email: employee.email || cleanEmail,
            role: 'staff',
            portal: 'staff',
            employeeId: employee._id,
            employeeCode: employee.employeeCode || employee.code || employee.id,
            department: employee.department || 'Operations & Dispatch',
            designation: employee.designation || employee.role || 'Operations Staff',
            workType: employee.workType || 'Operations Staff',
            jobRole: employee.jobRole || employee.designation,
            monthlySalary: Number(employee.monthlySalary || employee.salary || 42000),
            salaryBasis: employee.salaryBasis || 'Attendance-Based Monthly Salary',
            reportingManager: employee.reportingManager,
            workLocation: employee.workLocation,
            employmentType: employee.employmentType,
            responsibilities: employee.responsibilities,
            status: employee.status || 'Active',
            avatar: employee.avatar || '',
            address: employee.address || '',
            emergencyContact: employee.emergencyContact || ''
          };
        }
      }

      // 5. If still not found and role is provided, return default matching dev user
      if (!user) {
        if (role === 'admin' || role === 'super_admin' || cleanEmail.includes('admin')) {
          user = {
            id: 'USR-ADM-01',
            name: 'MAK Administrator',
            fullName: 'MAK Administrator',
            email: cleanEmail || 'admin@maktours.com',
            role: 'admin',
            portal: 'admin',
            status: 'Active'
          };
        } else if (role === 'driver' || cleanEmail.includes('driver')) {
          user = {
            id: 'DRV-001',
            name: 'Arun Kumar Sundaram',
            fullName: 'Arun Kumar Sundaram',
            email: cleanEmail || 'driver@maktours.com',
            role: 'driver',
            portal: 'driver',
            driverBadgeId: 'DRV-001',
            status: 'Active'
          };
        } else if (role === 'vendor' || cleanEmail.includes('vendor')) {
          user = {
            id: 'VND-001',
            name: 'Apex Fleet Solutions',
            companyName: 'Apex Fleet Solutions',
            email: cleanEmail || 'vendor@maktours.com',
            role: 'vendor',
            portal: 'vendor',
            vendorId: 'VND-001',
            status: 'Active'
          };
        } else if (role === 'staff' || role === 'employee' || cleanEmail.includes('staff')) {
          user = {
            id: 'USR-EMP-01',
            name: 'Vimal',
            fullName: 'Vimal',
            email: cleanEmail || 'staff@maktours.com',
            role: 'staff',
            portal: 'staff',
            employeeCode: 'MAK-EMP-010',
            department: 'Operations & Dispatch',
            designation: 'Cleaner',
            workType: 'Travel Coordinator',
            monthlySalary: 42000,
            status: 'Active'
          };
        } else if (role === 'accountant' || cleanEmail.includes('accountant') || cleanEmail.includes('finance')) {
          user = {
            id: 'USR-ACC-01',
            name: 'Rajesh Ramanathan',
            fullName: 'Rajesh Ramanathan',
            email: cleanEmail || 'finance@maktours.com',
            role: 'accountant',
            portal: 'accountant',
            permissions: [
              'finance.view', 'finance.manage', 'finance.create', 'finance.edit',
              'income.view', 'income.manage', 'income.create',
              'expense.view', 'expense.manage', 'expense.create', 'expense.edit', 'expense.approve',
              'invoice.view', 'invoice.manage', 'invoice.create', 'invoice.edit', 'invoice.cancel',
              'payments.view', 'payments.manage', 'payments.create',
              'ledger.view', 'ledger.manage', 'ledger.create',
              'reports.view', 'reports.export',
              'payroll.view', 'driver.settle', 'vendor.pay'
            ],
            designation: 'Senior Chartered Accountant',
            tenantId: 'mak-tours',
            status: 'Active'
          };
        } else {
          return res.status(404).json({
            status: 'error',
            message: `User with email "${email}" not found.`
          });
        }
      }

      // If user matched dev fallback but does not exist in User collection, persist in DB so requireAuth finds them
      if (user && !user._id && cleanEmail) {
        let persisted = await User.findOne({ email: cleanEmail });
        if (!persisted) {
          persisted = await User.create({
            fullName: user.fullName || user.name || 'MAK User',
            name: user.name || user.fullName || 'MAK User',
            email: cleanEmail,
            password: 'MakSecure@2026',
            role: user.role || 'company_admin',
            portal: user.portal || 'admin',
            tenantId: user.tenantId || 'mak-tours',
            status: 'Active'
          });
        }
        user = persisted.toObject();
      }

      // Tenant & License Status Enforcement
      const tenantId = user.tenantId || (user.role === 'super_admin' ? 'system' : 'mak-tours');
      let company = null;

      if (user.role !== 'super_admin') {
        company = await Company.findOne({ tenantId }).lean();
        if (company) {
          if (company.status === 'Suspended') {
            return res.status(403).json({
              status: 'error',
              code: 'ACCOUNT_SUSPENDED',
              message: 'This company account is currently suspended by platform administration.',
              company: { name: company.name, tenantId: company.tenantId }
            });
          }
          if (company.status === 'Pending') {
            return res.status(403).json({
              status: 'error',
              code: 'ACCOUNT_PENDING',
              message: 'Your company registration is pending review and approval by Super Admin.',
              company: { name: company.name, tenantId: company.tenantId }
            });
          }
          if (company.status === 'Rejected') {
            return res.status(403).json({
              status: 'error',
              code: 'ACCOUNT_REJECTED',
              message: 'Your company registration was not approved.',
              company: { name: company.name, tenantId: company.tenantId }
            });
          }
        }
      }

      // Cryptographically signed JWT generation
      const token = signToken({
        id: user._id || user.id,
        email: user.email,
        role: user.role,
        tenantId
      });

      // Return sanitized user
      const { password: _, ...safeUser } = user;
      if (!safeUser.name && safeUser.fullName) safeUser.name = safeUser.fullName;
      if (!safeUser.fullName && safeUser.name) safeUser.fullName = safeUser.name;
      if (!safeUser.phone && safeUser.mobileNumber) safeUser.phone = safeUser.mobileNumber;

      safeUser.tenantId = tenantId;
      safeUser.companyName = company?.name || safeUser.company || 'MAK Tours & Travels';
      safeUser.tenant = company
        ? {
            tenantId: company.tenantId,
            name: company.name,
            status: company.status,
            plan: company.plan,
            licenseStatus: company.licenseStatus,
            licenseExpiry: company.licenseExpiry,
            branding: company.branding,
            limits: company.limits,
            enabledModules: company.enabledModules
          }
        : null;

      return res.status(200).json({
        status: 'success',
        message: 'Authentication successful',
        token,
        user: safeUser
      });
    } catch (err) {
      next(err);
    }
  },

  register: async (req, res, next) => {
    try {
      const { name, fullName, email, password, role = 'staff', phone, mobileNumber, address, emergencyContact } = req.body;
      const cleanEmail = (email || '').trim().toLowerCase();
      const resolvedName = (fullName || name || '').trim();
      const resolvedPhone = (phone || mobileNumber || '').trim();

      if (!resolvedName) {
        return res.status(400).json({
          status: 'error',
          message: 'Full legal name is required.'
        });
      }

      if (!cleanEmail) {
        return res.status(400).json({
          status: 'error',
          message: 'Valid work email address is required.'
        });
      }

      // Check for duplicate user in User collection
      const existingUser = await User.findOne({ email: cleanEmail });
      if (existingUser) {
        return res.status(400).json({
          status: 'error',
          message: 'An account with this email address already exists.'
        });
      }

      const isStaffRole = role === 'staff' || role === 'employee';

      // If registering as Staff, check duplicate in Employee collection
      if (isStaffRole) {
        const existingEmp = await Employee.findOne({
          $or: [
            { email: cleanEmail },
            ...(resolvedPhone ? [{ phone: resolvedPhone }] : [])
          ]
        });
        if (existingEmp) {
          return res.status(400).json({
            status: 'error',
            message: `An employee record with this email or phone is already registered (${existingEmp.fullName || existingEmp.name}).`
          });
        }
      }

      const assignedPortal = role === 'vendor' ? 'vendor' : role === 'driver' ? 'driver' : isStaffRole ? 'staff' : (role === 'accountant' || role === 'finance_admin') ? 'accountant' : role.includes('admin') ? 'admin' : 'staff';

      // 1. Auto-generate sequential Employee Code for Staff
      let generatedEmployeeCode = '';
      let createdEmployee = null;

      if (isStaffRole) {
        const allEmps = await Employee.find({}, { employeeCode: 1, code: 1, id: 1 }).lean();
        let maxNum = 10;
        allEmps.forEach((e) => {
          const c = e.employeeCode || e.code || e.id || '';
          const match = c.match(/(\d+)$/);
          if (match) {
            const n = parseInt(match[1], 10);
            if (n > maxNum) maxNum = n;
          }
        });
        const nextSeq = (maxNum + 1).toString().padStart(3, '0');
        generatedEmployeeCode = `MAK-EMP-${nextSeq}`;
      }

      // Auto-generate sequential Vendor ID for Vendor registration
      let generatedVendorId = '';
      if (role === 'vendor') {
        const allVnds = await Vendor.find({}, { vendorId: 1, id: 1 }).lean();
        let maxNum = 1;
        allVnds.forEach((v) => {
          const c = v.vendorId || v.id || '';
          const match = c.match(/(\d+)$/);
          if (match) {
            const n = parseInt(match[1], 10);
            if (n > maxNum) maxNum = n;
          }
        });
        const nextSeq = (maxNum + 1).toString().padStart(3, '0');
        generatedVendorId = `VND-${nextSeq}`;
      }

      // 2. Create User account
      const newUser = await User.create({
        fullName: resolvedName,
        name: resolvedName,
        email: cleanEmail,
        password: password || 'Mak@123',
        role: isStaffRole ? 'staff' : role,
        portal: assignedPortal,
        mobileNumber: resolvedPhone,
        phone: resolvedPhone,
        employeeCode: generatedEmployeeCode,
        vendorId: generatedVendorId,
        avatar: resolvedName.substring(0, 2).toUpperCase(),
        status: 'Active'
      });

      // 3. Create linked Employee document in MongoDB Atlas
      if (isStaffRole) {
        createdEmployee = await Employee.create({
          userId: newUser._id,
          employeeCode: generatedEmployeeCode,
          code: generatedEmployeeCode,
          id: generatedEmployeeCode,
          fullName: resolvedName,
          name: resolvedName,
          email: cleanEmail,
          phone: resolvedPhone || '+91 98401 00000',
          password: password || 'Staff@123',
          role: 'Operations Staff',
          designation: 'Operations Associate',
          department: 'Operations & Dispatch',
          workType: 'Operations Staff',
          jobRole: 'Operations Associate',
          reportingManager: 'Ananya Deshmukh (General Operations Manager)',
          workLocation: 'Chennai HQ - Main Operations Center',
          employmentType: 'Full-Time',
          responsibilities: [
            'Live customer itinerary management and tour reservations',
            'Fleet vehicle assignment coordination with senior dispatchers',
            'Customer travel support, route coordination & emergency resolution'
          ],
          salaryBasis: 'Attendance-Based Monthly Salary',
          monthlySalary: 42000,
          salary: 42000,
          baseSalary: 42000,
          status: 'Active',
          attendanceToday: 'Not Marked',
          leavesLeft: 18,
          leavesBalance: 18,
          leavesTaken: 0,
          address: address || '',
          emergencyContact: emergencyContact || '',
          joiningDate: new Date().toISOString().substring(0, 10),
          avatar: resolvedName.substring(0, 2).toUpperCase()
        });

        // Link User to Employee
        newUser.employeeId = createdEmployee._id;
        await newUser.save();
      }

      // 4. Create linked Vendor document in MongoDB Atlas
      let createdVendor = null;
      if (role === 'vendor') {
        createdVendor = await Vendor.create({
          vendorId: generatedVendorId,
          id: generatedVendorId,
          companyName: req.body.companyName || req.body.company || `${resolvedName} Travels`,
          name: resolvedName,
          email: cleanEmail,
          phone: resolvedPhone || '+91 98401 00000',
          role: 'vendor',
          city: 'Chennai',
          state: 'Tamil Nadu',
          status: 'Active'
        });
      }

      const token = signToken({
        id: newUser._id,
        email: newUser.email,
        role: newUser.role,
        tenantId: newUser.tenantId || 'mak-tours'
      });
      const { password: _, ...safeUser } = newUser.toObject();

      if (createdVendor) {
        safeUser.vendorId = createdVendor.vendorId;
        safeUser.companyName = createdVendor.companyName;
      }

      if (createdEmployee) {
        safeUser.employeeId = createdEmployee._id;
        safeUser.employeeCode = createdEmployee.employeeCode;
        safeUser.department = createdEmployee.department;
        safeUser.designation = createdEmployee.designation;
        safeUser.workType = createdEmployee.workType;
        safeUser.jobRole = createdEmployee.jobRole;
        safeUser.monthlySalary = createdEmployee.monthlySalary;
        safeUser.salaryBasis = createdEmployee.salaryBasis;
        safeUser.reportingManager = createdEmployee.reportingManager;
        safeUser.workLocation = createdEmployee.workLocation;
        safeUser.employmentType = createdEmployee.employmentType;
        safeUser.responsibilities = createdEmployee.responsibilities;
      }

      return res.status(201).json({
        status: 'success',
        message: 'Account and individual employee profile successfully created in MongoDB Atlas.',
        token,
        user: safeUser
      });
    } catch (err) {
      next(err);
    }
  },

  getProfile: async (req, res, next) => {
    try {
      const modelName = req.userModel || 'User';
      const userId = req.userId || req.user?._id || req.user?.id;
      const email = req.user?.email;

      let freshUser = null;
      if (modelName === 'Driver') {
        freshUser = await Driver.findOne({ $or: [{ _id: userId }, { email }] }).lean();
      } else if (modelName === 'Vendor') {
        freshUser = await Vendor.findOne({ $or: [{ _id: userId }, { email }] }).lean();
      } else if (modelName === 'Employee') {
        freshUser = await Employee.findOne({ $or: [{ _id: userId }, { email }] }).lean();
      } else {
        freshUser = await User.findOne({ $or: [{ _id: userId }, { email }] }).lean();
      }

      if (!freshUser) {
        freshUser = req.user || { role: 'admin', portal: 'admin' };
      }

      // If user is Staff / Employee, enrich from the linked Employee record in MongoDB Atlas
      const isStaff = freshUser.role === 'staff' || freshUser.role === 'employee' || freshUser.portal === 'staff' || modelName === 'Employee';
      if (isStaff) {
        freshUser.portal = 'staff';
        freshUser.role = 'staff';
        let emp = await Employee.findOne({
          $or: [
            ...(freshUser._id ? [{ userId: freshUser._id }] : []),
            { email: freshUser.email },
            ...(freshUser.employeeCode ? [{ employeeCode: freshUser.employeeCode }] : [])
          ]
        }).lean();

        // If no Employee document exists yet for this staff member in MongoDB, create one!
        if (!emp) {
          const empCode = freshUser.employeeCode || 'MAK-EMP-010';
          const newEmp = await Employee.create({
            userId: freshUser._id,
            employeeCode: empCode,
            code: empCode,
            id: empCode,
            fullName: freshUser.fullName || freshUser.name || 'Staff Member',
            name: freshUser.fullName || freshUser.name || 'Staff Member',
            email: freshUser.email,
            phone: freshUser.phone || freshUser.mobileNumber || '+91 98401 23456',
            role: freshUser.designation || 'Operations Staff',
            designation: freshUser.designation || 'Operations Associate',
            department: freshUser.department || 'Operations & Dispatch',
            workType: 'Operations Staff',
            jobRole: freshUser.designation || 'Operations Associate',
            reportingManager: 'Ananya Deshmukh (General Operations Manager)',
            workLocation: 'Chennai HQ - Main Operations Center',
            employmentType: 'Full-Time',
            responsibilities: [
              'Live customer itinerary management and tour reservations',
              'Fleet vehicle assignment coordination with senior dispatchers',
              'Customer travel support, route coordination & emergency resolution'
            ],
            salaryBasis: 'Attendance-Based Monthly Salary',
            monthlySalary: 42000,
            salary: 42000,
            status: 'Active',
            avatar: freshUser.avatar || ''
          });
          emp = newEmp.toObject();
          if (freshUser._id) {
            await User.findByIdAndUpdate(freshUser._id, { $set: { employeeId: newEmp._id, employeeCode: empCode } });
          }
        }

        if (emp) {
          freshUser.employeeId = emp._id;
          freshUser.employeeCode = emp.employeeCode || emp.code || freshUser.employeeCode;
          freshUser.name = emp.fullName || emp.name || freshUser.name;
          freshUser.fullName = emp.fullName || emp.name || freshUser.fullName;
          freshUser.phone = emp.phone || freshUser.phone;
          freshUser.mobileNumber = emp.phone || freshUser.mobileNumber;
          freshUser.avatar = emp.avatar || freshUser.avatar;
          freshUser.designation = emp.designation || emp.role || freshUser.designation;
          freshUser.department = emp.department || freshUser.department;
          freshUser.workType = emp.workType || freshUser.workType;
          freshUser.jobRole = emp.jobRole || freshUser.jobRole;
          freshUser.monthlySalary = Number(emp.monthlySalary || emp.salary || freshUser.monthlySalary || 42000);
          freshUser.salaryBasis = emp.salaryBasis || freshUser.salaryBasis || 'Attendance-Based Monthly Salary';
          freshUser.reportingManager = emp.reportingManager || freshUser.reportingManager;
          freshUser.workLocation = emp.workLocation || freshUser.workLocation;
          freshUser.employmentType = emp.employmentType || freshUser.employmentType;
          freshUser.responsibilities = emp.responsibilities || freshUser.responsibilities;
          freshUser.address = emp.address || freshUser.address || '';
          freshUser.emergencyContact = emp.emergencyContact || freshUser.emergencyContact || '';
          freshUser.status = emp.status || freshUser.status;
          freshUser.joiningDate = emp.joiningDate || freshUser.joiningDate;
        }
      }

      const { password: _, ...safeUser } = freshUser;
      if (!safeUser.name && safeUser.fullName) safeUser.name = safeUser.fullName;
      if (!safeUser.fullName && safeUser.name) safeUser.fullName = safeUser.name;
      if (!safeUser.phone && safeUser.mobileNumber) safeUser.phone = safeUser.mobileNumber;

      return res.status(200).json({
        status: 'success',
        user: safeUser
      });
    } catch (err) {
      next(err);
    }
  },

  updateProfile: async (req, res, next) => {
    try {
      const modelName = req.userModel || 'User';
      const userId = req.userId || req.user?._id || req.user?.id;
      const email = req.user?.email;
      const userRole = req.user?.role || 'staff';

      const isStaffUser = userRole === 'staff' || userRole === 'employee' || req.user?.portal === 'staff';

      const {
        name,
        fullName,
        phone,
        mobileNumber,
        designation,
        department,
        workType,
        company,
        companyName,
        location,
        city,
        avatar,
        address,
        dob,
        gender,
        bloodGroup,
        emergencyContact,
        emergencyContactName,
        emergencyContactPhone
      } = req.body;

      // 1. Prepare personal fields allowed for update
      const updates = {};
      const resolvedName = (name || fullName || '').trim();
      if (resolvedName) {
        updates.name = resolvedName;
        updates.fullName = resolvedName;
      }

      const resolvedPhone = (phone || mobileNumber || '').trim();
      if (resolvedPhone) {
        updates.phone = resolvedPhone;
        updates.mobileNumber = resolvedPhone;
      }

      if (address !== undefined) updates.address = String(address).trim();
      if (dob !== undefined) updates.dob = String(dob).trim();
      if (gender !== undefined) updates.gender = String(gender).trim();
      if (bloodGroup !== undefined) updates.bloodGroup = String(bloodGroup).trim();
      if (emergencyContact !== undefined) updates.emergencyContact = String(emergencyContact).trim();
      if (emergencyContactName !== undefined) updates.emergencyContactName = String(emergencyContactName).trim();
      if (emergencyContactPhone !== undefined) updates.emergencyContactPhone = String(emergencyContactPhone).trim();

      // Only Admins / privileged users can update official corporate designations & departments
      if (!isStaffUser) {
        if (designation !== undefined) updates.designation = String(designation).trim();
        if (department !== undefined) updates.department = String(department).trim();
        if (workType !== undefined) updates.workType = String(workType).trim();
        if (company !== undefined) updates.company = String(company).trim();
        if (companyName !== undefined) updates.companyName = String(companyName).trim();
        if (location !== undefined) updates.location = String(location).trim();
        if (city !== undefined) updates.city = String(city).trim();
      }

      // Process Avatar: If base64 or URL
      if (avatar !== undefined) {
        const cleanAvatar = String(avatar).trim();
        if (cleanAvatar.startsWith('data:image/')) {
          const processedUrl = await processBase64Avatar(cleanAvatar, req);
          updates.avatar = processedUrl;
        } else {
          updates.avatar = cleanAvatar;
        }
      }

      // 2. Update User collection in MongoDB Atlas
      const userUpdates = { ...updates };
      const updatedUser = await User.findOneAndUpdate(
        { $or: [{ _id: userId }, { email }] },
        { $set: userUpdates },
        { returnDocument: 'after' }
      ).lean();

      // 3. If Staff/Employee, ALSO update the corresponding Employee collection in MongoDB Atlas!
      let updatedEmployee = null;
      if (isStaffUser || modelName === 'Employee' || updatedUser?.employeeCode) {
        const empQuery = {
          $or: [
            ...(userId ? [{ userId }] : []),
            { email },
            ...(updatedUser?.employeeCode ? [{ employeeCode: updatedUser.employeeCode }] : []),
            ...(req.user?.employeeCode ? [{ employeeCode: req.user.employeeCode }] : [])
          ]
        };

        const empUpdates = { ...updates };
        if (updates.name || updates.fullName) {
          empUpdates.fullName = resolvedName;
          empUpdates.name = resolvedName;
        }
        if (updates.phone || updates.mobileNumber) {
          empUpdates.phone = resolvedPhone;
        }

        updatedEmployee = await Employee.findOneAndUpdate(
          empQuery,
          { $set: empUpdates },
          { returnDocument: 'after' }
        ).lean();

        // If Employee didn't exist in MongoDB yet, create it now!
        if (!updatedEmployee && isStaffUser) {
          const empCode = updatedUser?.employeeCode || req.user?.employeeCode || 'MAK-EMP-010';
          updatedEmployee = await Employee.create({
            userId: updatedUser?._id || userId,
            employeeCode: empCode,
            code: empCode,
            id: empCode,
            fullName: resolvedName || updatedUser?.fullName || 'Staff Member',
            name: resolvedName || updatedUser?.name || 'Staff Member',
            email,
            phone: resolvedPhone || updatedUser?.phone || '+91 98401 23456',
            avatar: updates.avatar || updatedUser?.avatar || '',
            role: 'Operations Staff',
            designation: 'Operations Associate',
            department: 'Operations & Dispatch',
            workType: 'Operations Staff',
            jobRole: 'Operations Associate',
            reportingManager: 'Ananya Deshmukh (General Operations Manager)',
            workLocation: 'Chennai HQ - Main Operations Center',
            employmentType: 'Full-Time',
            responsibilities: [
              'Live customer itinerary management and tour reservations',
              'Fleet vehicle assignment coordination with senior dispatchers'
            ],
            salaryBasis: 'Attendance-Based Monthly Salary',
            monthlySalary: 42000,
            salary: 42000,
            status: 'Active',
            address: updates.address || '',
            emergencyContact: updates.emergencyContact || ''
          });
        }
      }

      // If Driver, also synchronize Driver model in MongoDB Atlas
      let updatedDriver = null;
      if (modelName === 'Driver' || userRole === 'driver' || req.user?.portal === 'driver' || req.user?.driverId || req.user?.driverBadgeId) {
        const driverQuery = {
          $or: [
            ...(userId ? [{ _id: userId }] : []),
            { email },
            ...(resolvedPhone ? [{ phone: resolvedPhone }] : []),
            { id: req.user?.driverId || 'DRV-001' },
            { driverBadgeId: req.user?.driverId || req.user?.driverBadgeId || 'DRV-001' }
          ]
        };
        const driverUpdates = { ...updates };
        if (updates.avatar) {
          driverUpdates.avatar = updates.avatar;
          driverUpdates.photo = updates.avatar;
        }
        updatedDriver = await Driver.findOneAndUpdate(
          driverQuery,
          { $set: driverUpdates },
          { returnDocument: 'after' }
        ).lean();
      }

      // If Vendor, also synchronize Vendor model in MongoDB Atlas
      let updatedVendor = null;
      if (modelName === 'Vendor' || userRole === 'vendor' || req.user?.portal === 'vendor' || req.user?.vendorId) {
        const vendorQuery = {
          $or: [
            ...(userId ? [{ _id: userId }] : []),
            { email },
            ...(req.user?.vendorId ? [{ vendorId: req.user.vendorId }, { id: req.user.vendorId }] : [])
          ]
        };
        updatedVendor = await Vendor.findOneAndUpdate(
          vendorQuery,
          { $set: updates },
          { returnDocument: 'after' }
        ).lean();
      }

      // Explicitly protect system RBAC role and portal tier:
      const authSystemRole = isStaffUser
        ? 'staff'
        : (updatedUser?.role || req.user?.role || (modelName === 'Driver' || userRole === 'driver' ? 'driver' : modelName === 'Vendor' || userRole === 'vendor' ? 'vendor' : 'admin'));
      const authSystemPortal = isStaffUser
        ? 'staff'
        : (updatedUser?.portal || req.user?.portal || authSystemRole);

      const mergedDoc = {
        ...(updatedUser || {}),
        ...(updatedEmployee || {}),
        ...(updatedDriver || {}),
        ...(updatedVendor || {}),
        role: authSystemRole,
        portal: authSystemPortal
      };

      if (updatedDriver) {
        mergedDoc.driverId = updatedDriver.id || updatedDriver.driverBadgeId || mergedDoc.driverId || 'DRV-001';
        mergedDoc.name = updatedDriver.name || updatedDriver.fullName || mergedDoc.name;
        mergedDoc.fullName = updatedDriver.fullName || updatedDriver.name || mergedDoc.fullName;
        mergedDoc.avatar = updatedDriver.avatar || updatedDriver.photo || mergedDoc.avatar;
        mergedDoc.photo = mergedDoc.avatar;
      }

      if (updatedEmployee) {
        mergedDoc.employeeId = updatedEmployee._id;
        mergedDoc.employeeCode = updatedEmployee.employeeCode || updatedEmployee.code || mergedDoc.employeeCode;
        mergedDoc.designation = updatedEmployee.designation || updatedEmployee.role || mergedDoc.designation;
        mergedDoc.jobRole = updatedEmployee.jobRole || updatedEmployee.designation || mergedDoc.jobRole;
        mergedDoc.workType = updatedEmployee.workType || mergedDoc.workType;
        mergedDoc.department = updatedEmployee.department || mergedDoc.department;
        mergedDoc.monthlySalary = Number(updatedEmployee.monthlySalary || updatedEmployee.salary || mergedDoc.monthlySalary);
        mergedDoc.salaryBasis = updatedEmployee.salaryBasis || mergedDoc.salaryBasis;
        mergedDoc.reportingManager = updatedEmployee.reportingManager || mergedDoc.reportingManager;
        mergedDoc.workLocation = updatedEmployee.workLocation || mergedDoc.workLocation;
        mergedDoc.employmentType = updatedEmployee.employmentType || mergedDoc.employmentType;
        mergedDoc.responsibilities = updatedEmployee.responsibilities || mergedDoc.responsibilities;
        mergedDoc.employeeRole = updatedEmployee.role || mergedDoc.designation;
      }

      if (!mergedDoc._id && !mergedDoc.email) {
        return res.status(404).json({
          status: 'error',
          message: 'User record not found in MongoDB Atlas.'
        });
      }

      const { password: _, ...safeUser } = mergedDoc;
      if (!safeUser.name && safeUser.fullName) safeUser.name = safeUser.fullName;
      if (!safeUser.fullName && safeUser.name) safeUser.fullName = safeUser.name;
      if (!safeUser.phone && safeUser.mobileNumber) safeUser.phone = safeUser.mobileNumber;

      return res.status(200).json({
        status: 'success',
        message: 'Profile updated and persisted successfully to MongoDB Atlas.',
        user: safeUser
      });
    } catch (err) {
      next(err);
    }
  },

  uploadAvatar: async (req, res, next) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          status: 'error',
          message: 'No image file uploaded.'
        });
      }

      const avatarUrl = await processUploadedFile(req.file, req);

      return res.status(200).json({
        status: 'success',
        message: 'Profile photo uploaded successfully.',
        url: avatarUrl
      });
    } catch (err) {
      next(err);
    }
  },

  getMe: async (req, res, next) => {
    return authController.getProfile(req, res, next);
  },

  logout: async (req, res, next) => {
    try {
      return res.status(200).json({
        status: 'success',
        message: 'Logged out successfully'
      });
    } catch (err) {
      next(err);
    }
  },

  companyRegister: async (req, res, next) => {
    try {
      const {
        companyName,
        adminName,
        email,
        phone,
        password,
        plan = 'Professional',
        city = 'Chennai',
        state = 'Tamil Nadu',
        notes = ''
      } = req.body;

      if (!companyName || !email || !password) {
        return res.status(400).json({
          status: 'error',
          message: 'Company name, admin email, and master password are required.'
        });
      }

      const cleanEmail = email.trim().toLowerCase();

      // Check if email already in use
      const existingUser = await User.findOne({ email: cleanEmail });
      if (existingUser) {
        return res.status(400).json({
          status: 'error',
          message: 'An account with this email address already exists.'
        });
      }

      // Generate tenant slug
      let baseSlug = companyName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
      if (!baseSlug) baseSlug = 'tenant';

      let tenantId = baseSlug;
      let counter = 1;
      while (await Company.findOne({ tenantId })) {
        tenantId = `${baseSlug}-${counter++}`;
      }

      // Create Company with status 'Pending'
      const newCompany = await Company.create({
        tenantId,
        name: companyName.trim(),
        legalName: companyName.trim(),
        slug: tenantId,
        email: cleanEmail,
        phone: phone || '',
        city,
        state,
        status: 'Pending',
        plan,
        licenseStatus: 'Pending',
        primaryAdmin: {
          name: adminName || `${companyName} Admin`,
          email: cleanEmail,
          phone: phone || ''
        },
        notes: notes || 'Submitted through public SaaS onboarding registration.'
      });

      // Create Admin User with status 'Pending'
      await User.create({
        tenantId,
        fullName: adminName || `${companyName} Admin`,
        name: adminName || `${companyName} Admin`,
        email: cleanEmail,
        password,
        role: 'company_admin',
        portal: 'admin',
        company: companyName.trim(),
        status: 'Pending',
        isActive: false
      });

      // Audit Log
      await AuditLog.create({
        tenantId,
        action: 'COMPANY_REGISTRATION_SUBMITTED',
        actorName: adminName || companyName,
        actorEmail: cleanEmail,
        actorRole: 'company_admin',
        entityType: 'Company',
        entityId: tenantId,
        details: { companyName, plan, city, state },
        ipAddress: req.ip
      });

      return res.status(201).json({
        status: 'success',
        message: 'Your company registration has been received! Platform administration will review and approve your account shortly.',
        data: {
          tenantId,
          companyName: newCompany.name,
          status: 'Pending'
        }
      });
    } catch (err) {
      next(err);
    }
  }
};

export default authController;
