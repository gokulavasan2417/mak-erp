// MAK Tours & Travels ERP - Dedicated Staff / Employee Controller
// Collection: employees (Separate collection for Staff)
import { Employee } from '../models/Employee.js';
import { User } from '../models/User.js';
import { Attendance } from '../models/Attendance.js';
import { Payroll } from '../models/Payroll.js';
import { Booking } from '../models/Booking.js';
import { Driver } from '../models/Driver.js';
import { buildTenantQuery, mergeTenantFilter } from '../middleware/tenantMiddleware.js';

export const employeeController = {
  getAll: async (req, res, next) => {
    try {
      const { department, status, search, q } = req.query;
      const tenantId = req.tenantId || req.user?.tenantId || req.headers['x-tenant-id'] || 'mak-tours';
      const tenantQuery = req.tenantQuery || buildTenantQuery(tenantId);
      const query = req.isSuperAdmin && !req.tenantId ? {} : { ...tenantQuery };

      if (department && department !== 'All' && department !== 'All Departments') {
        query.department = department;
      }
      if (status && status !== 'All' && status !== 'All Statuses') {
        query.status = status;
      }

      const searchTerm = (search || q || '').trim();
      if (searchTerm) {
        const regex = new RegExp(searchTerm.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&'), 'i');
        query.$or = [
          { fullName: regex },
          { name: regex },
          { employeeCode: regex },
          { code: regex },
          { id: regex },
          { email: regex },
          { phone: regex },
          { role: regex },
          { designation: regex },
          { department: regex }
        ];
      }

      const list = await Employee.find(query).sort({ createdAt: -1 }).lean();

      // Cross-synchronize avatar from User collection if Employee record does not have one
      const emails = list.map((e) => e.email).filter(Boolean);
      const userList = emails.length > 0
        ? await User.find({ email: { $in: emails }, avatar: { $exists: true, $ne: '' } }).select('email avatar').lean()
        : [];
      const userAvatarMap = new Map(userList.map((u) => [u.email.toLowerCase(), u.avatar]));

      // Fetch today's real attendance records to strictly avoid fake automatic marking
      const todayStr = new Date().toISOString().split('T')[0];
      const todayAttendance = await Attendance.find({
        date: todayStr,
        ...tenantQuery
      }).lean();

      const norm = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');

      const formatted = list.map((e) => {
        const userAvatar = e.email ? userAvatarMap.get(e.email.toLowerCase()) : null;
        const resolvedAvatar = e.avatar || userAvatar || '';

        // Dynamically resolve today's attendance from actual attendance records only
        const empCodes = [norm(e.id), norm(e.code), norm(e.employeeCode), norm(e._id)].filter(Boolean);
        const empNames = [norm(e.fullName), norm(e.name)].filter(Boolean);
        const todayAtt = todayAttendance.find((a) => {
          const aCodes = [norm(a.employeeId), norm(a.employeeCode), norm(a.driverId)].filter(Boolean);
          const aNames = [norm(a.employeeName)].filter(Boolean);
          return empCodes.some((c) => aCodes.some((ac) => ac === c || ac.endsWith(c) || c.endsWith(ac))) ||
                 empNames.some((n) => aNames.some((an) => an === n));
        });

        // If admin has NOT marked attendance for this staff for today, strictly show 'Not Marked'
        const resolvedAttendance = todayAtt ? todayAtt.status : 'Not Marked';

        return {
          ...e,
          id: e.id || e.employeeCode || e._id.toString(),
          code: e.employeeCode || e.code || e.id || '',
          employeeCode: e.employeeCode || e.code || e.id || '',
          name: e.fullName || e.name || '',
          fullName: e.fullName || e.name || '',
          role: e.role || e.designation || 'Operations Staff',
          designation: e.designation || e.role || 'Operations Staff',
          department: e.department || 'Operations & Dispatch',
          status: e.status || 'Active',
          avatar: resolvedAvatar,
          salary: Number(e.monthlySalary || e.salary || e.baseSalary || 45000),
          monthlySalary: Number(e.monthlySalary || e.salary || e.baseSalary || 45000),
          attendanceToday: resolvedAttendance,
          leavesRemaining: e.leavesBalance ?? e.leavesLeft ?? 18
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
      const tenantQuery = req.tenantQuery || buildTenantQuery(tenantId);
      const specificFilter = {
        $or: [{ id }, { employeeCode: id }, { code: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }]
      };
      const findQuery = (!req.isSuperAdmin || req.tenantId)
        ? mergeTenantFilter(tenantQuery, specificFilter)
        : specificFilter;

      const employee = await Employee.findOne(findQuery).lean();

      if (!employee) {
        return res.status(404).json({ status: 'error', message: 'Employee not found' });
      }

      // Cross-sync avatar from User if missing
      if (!employee.avatar && employee.email) {
        const linkedUser = await User.findOne({ email: employee.email, tenantId }).select('avatar').lean();
        if (linkedUser?.avatar) {
          employee.avatar = linkedUser.avatar;
        }
      }

      const empCode = employee.employeeCode || employee.code || employee.id;
      const targetCodes = [empCode, employee.id, employee.code, employee.driverId].filter(Boolean);

      // Fetch linked attendance & payroll summaries
      const [recentAttendance, recentPayroll] = await Promise.all([
        Attendance.find({
          tenantId,
          $or: [{ employeeId: { $in: targetCodes } }, { employeeCode: { $in: targetCodes } }]
        })
          .sort({ date: -1 })
          .limit(10)
          .lean(),
        Payroll.find({
          tenantId,
          $or: [{ employeeId: { $in: targetCodes } }, { employeeCode: { $in: targetCodes } }]
        })
          .sort({ month: -1 })
          .limit(6)
          .lean()
      ]);

      return res.status(200).json({
        status: 'success',
        data: {
          ...employee,
          id: employee.id || employee.employeeCode || employee._id.toString(),
          code: employee.employeeCode || employee.code || employee.id || '',
          employeeCode: employee.employeeCode || employee.code || employee.id || '',
          name: employee.fullName || employee.name || '',
          fullName: employee.fullName || employee.name || '',
          role: employee.role || employee.designation || 'Operations Staff',
          designation: employee.designation || employee.role || 'Operations Staff',
          department: employee.department || 'Operations & Dispatch',
          status: employee.status || 'Active',
          salary: Number(employee.monthlySalary || employee.salary || employee.baseSalary || 45000),
          monthlySalary: Number(employee.monthlySalary || employee.salary || employee.baseSalary || 45000),
          recentAttendance: recentAttendance || [],
          recentPayroll: recentPayroll || []
        }
      });
    } catch (err) {
      next(err);
    }
  },

  create: async (req, res, next) => {
    try {
      const data = req.body;
      const tenantId = req.tenantId || req.user?.tenantId || (req.isSuperAdmin && data.tenantId) || 'mak-tours';

      // 1. Validate required fields
      const fullName = (data.fullName || data.name || '').trim();
      if (!fullName) {
        return res.status(400).json({ status: 'error', message: 'Employee full name is required' });
      }

      const phone = (data.phone || '').trim();
      if (!phone || phone.length < 5) {
        return res.status(400).json({ status: 'error', message: 'Valid contact phone number is required' });
      }

      const role = (data.role || data.designation || 'Operations Staff').trim();
      const department = data.department || 'Operations & Dispatch';
      const monthlySalary = Number(data.salary || data.monthlySalary || data.baseSalary) || 45000;

      // 2. Generate or validate employee code (per tenant)
      let employeeCode = (data.employeeCode || data.code || '').trim();
      if (employeeCode) {
        const existing = await Employee.findOne({
          tenantId,
          $or: [{ employeeCode }, { code: employeeCode }, { id: employeeCode }]
        });
        if (existing) {
          return res.status(400).json({
            status: 'error',
            message: `Employee code '${employeeCode}' is already registered to another staff member in this company (${existing.fullName || existing.name})`
          });
        }
      } else {
        // Auto-generate next collision-free EMP code for this tenant
        const allEmps = await Employee.find({ tenantId }, { employeeCode: 1, code: 1, id: 1 }).lean();
        let maxNum = 0;
        allEmps.forEach((e) => {
          const c = e.employeeCode || e.code || e.id || '';
          const match = c.match(/(\d+)$/);
          if (match) {
            const n = parseInt(match[1], 10);
            if (n > maxNum) maxNum = n;
          }
        });
        const nextSeq = (maxNum + 1).toString().padStart(3, '0');
        employeeCode = `EMP-${nextSeq}`;
      }

      const newEmployee = await Employee.create({
        ...data,
        tenantId,
        employeeCode,
        id: employeeCode,
        code: employeeCode,
        fullName,
        name: fullName,
        role,
        designation: role,
        department,
        phone,
        email: data.email || '',
        shift: data.shift || 'General (09:30 - 18:30)',
        salary: monthlySalary,
        monthlySalary,
        baseSalary: monthlySalary,
        salaryCategory: data.salaryCategory || 'Category A',
        status: data.status || 'Active',
        attendanceToday: data.attendanceToday || 'Not Marked',
        leavesLeft: data.leavesRemaining ?? data.leavesLeft ?? 18,
        leavesBalance: data.leavesRemaining ?? data.leavesBalance ?? 18,
        leavesTaken: data.leavesTaken ?? 0,
        address: data.address || '',
        emergencyContact: data.emergencyContact || '',
        joiningDate: data.joiningDate || new Date().toISOString().substring(0, 10),
        avatar: data.avatar || fullName.substring(0, 2).toUpperCase()
      });

      // Automatically create or link User authentication account for this employee within tenant
      if (data.email) {
        try {
          const cleanEmail = data.email.trim().toLowerCase();
          let userAcc = await User.findOne({ email: cleanEmail, tenantId });
          if (!userAcc) {
            userAcc = await User.create({
              tenantId,
              fullName,
              name: fullName,
              email: cleanEmail,
              phone: phone || '',
              mobileNumber: phone || '',
              password: data.password || 'Staff@123',
              role: 'staff',
              portal: 'staff',
              employeeCode,
              status: data.status || 'Active',
              avatar: data.avatar || fullName.substring(0, 2).toUpperCase()
            });
          }
          if (userAcc) {
            newEmployee.userId = userAcc._id;
            await newEmployee.save();
            userAcc.employeeId = newEmployee._id;
            userAcc.employeeCode = employeeCode;
            await userAcc.save();
          }
        } catch (uErr) {
          console.warn('User linking warning in employee creation:', uErr.message);
        }
      }

      return res.status(201).json({ status: 'success', data: newEmployee });
    } catch (err) {
      if (err.code === 11000) {
        return res.status(400).json({ status: 'error', message: 'Employee code or email already exists in system' });
      }
      next(err);
    }
  },

  update: async (req, res, next) => {
    try {
      const { id } = req.params;
      const tenantId = req.tenantId || req.user?.tenantId || req.headers['x-tenant-id'] || 'mak-tours';
      const tenantQuery = req.tenantQuery || buildTenantQuery(tenantId);
      const specificFilter = {
        $or: [{ id }, { employeeCode: id }, { code: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }]
      };
      const findQuery = (!req.isSuperAdmin || req.tenantId)
        ? mergeTenantFilter(tenantQuery, specificFilter)
        : specificFilter;

      const target = await Employee.findOne(findQuery);

      if (!target) {
        return res.status(404).json({ status: 'error', message: 'Employee not found' });
      }

      const updates = { ...req.body };
      delete updates.tenantId; // Never mutate tenant ownership

      // Prevent duplicate employeeCode within tenant if code is changing
      if (updates.employeeCode && updates.employeeCode !== target.employeeCode) {
        const conflict = await Employee.findOne({
          tenantId: target.tenantId,
          _id: { $ne: target._id },
          $or: [{ employeeCode: updates.employeeCode }, { code: updates.employeeCode }, { id: updates.employeeCode }]
        });
        if (conflict) {
          return res.status(400).json({
            status: 'error',
            message: `Employee code '${updates.employeeCode}' is already in use by ${conflict.fullName || conflict.name}`
          });
        }
        updates.code = updates.employeeCode;
        updates.id = updates.employeeCode;
      }

      // Keep paired fields synced
      if (updates.name || updates.fullName) {
        const n = (updates.fullName || updates.name).trim();
        updates.name = n;
        updates.fullName = n;
      }
      if (updates.role || updates.designation) {
        const r = (updates.role || updates.designation).trim();
        updates.role = r;
        updates.designation = r;
      }
      if (updates.salary !== undefined || updates.monthlySalary !== undefined) {
        const s = Number(updates.monthlySalary !== undefined ? updates.monthlySalary : updates.salary);
        updates.salary = s;
        updates.monthlySalary = s;
        updates.baseSalary = s;
      }

      const updated = await Employee.findByIdAndUpdate(
        target._id,
        { $set: updates },
        { returnDocument: 'after', runValidators: true }
      );

      // Sync linked Driver collection if applicable within tenant
      if (target.isDriver || target.driverId) {
        const driverUpdates = {};
        if (updates.fullName) driverUpdates.fullName = updates.fullName;
        if (updates.phone) driverUpdates.phone = updates.phone;
        if (updates.status) driverUpdates.status = updates.status;
        if (updates.monthlySalary) driverUpdates.monthlySalary = updates.monthlySalary;

        if (Object.keys(driverUpdates).length > 0) {
          await Driver.findOneAndUpdate(
            { tenantId: target.tenantId, $or: [{ id: target.driverId }, { driverBadgeId: target.driverId }, { phone: target.phone }] },
            { $set: driverUpdates },
            { returnDocument: 'after' }
          );
        }
      }

      // Sync linked User account in MongoDB Atlas within tenant
      if (target.userId || target.email || target.employeeCode) {
        const userUpdates = {};
        if (updates.fullName || updates.name) {
          userUpdates.fullName = updates.fullName || updates.name;
          userUpdates.name = updates.fullName || updates.name;
        }
        if (updates.phone) {
          userUpdates.phone = updates.phone;
          userUpdates.mobileNumber = updates.phone;
        }
        if (updates.designation || updates.role) {
          userUpdates.designation = updates.designation || updates.role;
        }
        if (updates.status) {
          userUpdates.status = updates.status;
        }
        if (updates.employeeCode) {
          userUpdates.employeeCode = updates.employeeCode;
        }
        if (updates.avatar) {
          userUpdates.avatar = updates.avatar;
        }

        if (Object.keys(userUpdates).length > 0) {
          try {
            await User.findOneAndUpdate(
              {
                tenantId: target.tenantId,
                $or: [
                  ...(target.userId ? [{ _id: target.userId }] : []),
                  ...(target.email ? [{ email: target.email }] : []),
                  ...(target.employeeCode ? [{ employeeCode: target.employeeCode }] : [])
                ]
              },
              { $set: userUpdates }
            );
          } catch (uErr) {
            console.warn('User sync error on employee update:', uErr.message);
          }
        }
      }

      return res.status(200).json({ status: 'success', data: updated });
    } catch (err) {
      if (err.code === 11000) {
        return res.status(400).json({ status: 'error', message: 'Employee code or email collision detected' });
      }
      next(err);
    }
  },

  delete: async (req, res, next) => {
    try {
      const { id } = req.params;
      let tenantId = req.tenantId || req.user?.tenantId || req.headers['x-tenant-id'] || 'mak-tours';
      const tenantQuery = req.tenantQuery || buildTenantQuery(tenantId);
      const specificFilter = {
        $or: [{ id }, { employeeCode: id }, { code: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }]
      };
      const findQuery = (!req.isSuperAdmin || req.tenantId)
        ? mergeTenantFilter(tenantQuery, specificFilter)
        : specificFilter;

      const target = await Employee.findOne(findQuery);

      if (!target) {
        return res.status(404).json({ status: 'error', message: 'Employee not found' });
      }

      tenantId = target.tenantId || tenantId;
      const targetCodes = [target.employeeCode, target.code, target.id].filter(Boolean);

      // Audit Check: Prevent accidental deletion of employees with attendance, payroll, or booking history in this tenant
      const [attCount, payCount, bookingCount] = await Promise.all([
        Attendance.countDocuments({
          tenantId,
          $or: [
            { employeeId: { $in: targetCodes } },
            { employeeCode: { $in: targetCodes } }
          ]
        }),
        Payroll.countDocuments({
          tenantId,
          $or: [
            { employeeId: { $in: targetCodes } },
            { employeeCode: { $in: targetCodes } }
          ]
        }),
        target.driverId
          ? Booking.countDocuments({
              tenantId,
              $or: [{ driverId: target.driverId }, { assignedDriverId: target.driverId }]
            })
          : 0
      ]);

      if (attCount > 0 || payCount > 0 || bookingCount > 0) {
        const issues = [];
        if (attCount > 0) issues.push(`${attCount} daily attendance record(s)`);
        if (payCount > 0) issues.push(`${payCount} monthly payroll entry/entries`);
        if (bookingCount > 0) issues.push(`${bookingCount} trip booking assignment(s)`);

        return res.status(400).json({
          status: 'error',
          hasHistory: true,
          attCount,
          payCount,
          bookingCount,
          message: `Cannot delete employee '${target.fullName || target.name}' (${target.employeeCode}). This employee has audit history: ${issues.join(', ')}. To preserve payroll compliance and ledger history, please mark their status as 'Inactive' or 'Terminated' instead.`
        });
      }

      // Safe to delete if no historical audit records exist
      await Employee.findByIdAndDelete(target._id);

      // Delete linked User account within tenant if exists
      if (target.userId || target.email) {
        await User.deleteOne({
          tenantId,
          $or: [
            ...(target.userId ? [{ _id: target.userId }] : []),
            ...(target.email ? [{ email: target.email }] : [])
          ]
        });
      }

      return res.status(200).json({
        status: 'success',
        message: `Employee '${target.fullName || target.name}' (${target.employeeCode}) was deleted successfully.`
      });
    } catch (err) {
      next(err);
    }
  }
};

export default employeeController;
