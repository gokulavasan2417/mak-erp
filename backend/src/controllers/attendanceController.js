// MAK Tours & Travels ERP - Dedicated Staff Attendance Controller
// Collection: attendance (Separate collection for Attendance logs)
import { Attendance } from '../models/Attendance.js';
import { Employee } from '../models/Employee.js';
import { Driver } from '../models/Driver.js';
import { Payroll } from '../models/Payroll.js';
import { PayrollPolicy } from '../models/PayrollPolicy.js';
import { Booking } from '../models/Booking.js';
import { calculateOrUpsertEmployeePayroll } from './payrollController.js';
import { buildTenantQuery, mergeTenantFilter } from '../middleware/tenantMiddleware.js';

// Status normalizer helper supporting all operational classifications
export function normalizeAttendanceStatus(rawStatus, isDriver = false) {
  const s = String(rawStatus || '').trim();
  const lower = s.toLowerCase();

  if (lower.includes('office') || (lower === 'present' && !isDriver)) {
    return 'Present – Office';
  }
  if (lower.includes('trip') || (lower === 'present' && isDriver)) {
    return 'Present – Trip';
  }
  if (lower.includes('standby')) {
    return 'Present – Standby';
  }
  if (lower.includes('other duty') || (lower.includes('duty') && !lower.includes('half'))) {
    return 'Present – Other Duty';
  }
  if (lower.includes('half')) {
    return 'Half Day';
  }
  if (lower.includes('paid leave') || lower === 'leave' || lower === 'on leave') {
    return 'Paid Leave';
  }
  if (lower.includes('unpaid')) {
    return 'Unpaid Leave';
  }
  if (lower.includes('weekly off') || lower === 'off' || lower === 'week off') {
    return 'Weekly Off';
  }
  if (lower.includes('holiday') || lower.includes('public holiday')) {
    return 'Public Holiday';
  }
  if (lower.includes('absent')) {
    return 'Absent';
  }
  if (lower.includes('late')) {
    return 'Late';
  }
  return 'Present – Office';
}

export const attendanceController = {
  getAll: async (req, res, next) => {
    try {
      const tenantId = req.tenantId || 'mak-tours';
      const tenantQuery = req.tenantQuery || buildTenantQuery(tenantId);
      const { date, month, startDate, endDate, employeeId, department, status, isDriver } = req.query;
      const query = { ...tenantQuery };

      if (date) {
        if (date.length === 7) {
          // Format YYYY-MM query
          query.date = { $regex: `^${date}` };
        } else {
          query.date = date;
        }
      } else if (month) {
        query.date = { $regex: `^${month}` };
      } else if (startDate && endDate) {
        query.date = { $gte: startDate, $lte: endDate };
      }

      if (department && department !== 'All' && department !== 'All Departments') {
        query.department = department;
      }
      if (status && status !== 'All' && status !== 'All Statuses') {
        query.status = status;
      }
      if (isDriver !== undefined) {
        query.isDriverAttendance = String(isDriver) === 'true';
      }

      if (employeeId) {
        const emp = await Employee.findOne(
          mergeTenantFilter(tenantQuery, {
            $or: [
              { employeeCode: employeeId },
              { code: employeeId },
              { id: employeeId },
              { driverId: employeeId },
              { _id: employeeId.match(/^[0-9a-fA-F]{24}$/) ? employeeId : null }
            ]
          })
        ).lean();

        const targetCodes = [employeeId];
        if (emp) {
          if (emp.employeeCode) targetCodes.push(emp.employeeCode);
          if (emp.code) targetCodes.push(emp.code);
          if (emp.id) targetCodes.push(emp.id);
          if (emp.driverId) targetCodes.push(emp.driverId);
          targetCodes.push(emp._id.toString());
        }

        const employeeFilter = {
          $or: [
            { employeeId: { $in: targetCodes } },
            { employeeCode: { $in: targetCodes } },
            { driverId: { $in: targetCodes } }
          ]
        };
        const finalQuery = mergeTenantFilter(query, employeeFilter);
        const list = await Attendance.find(finalQuery).sort({ date: -1, createdAt: -1 }).lean();
        return res.status(200).json({ status: 'success', count: list.length, data: list });
      }

      const list = await Attendance.find(query).sort({ date: -1, createdAt: -1 }).lean();

      return res.status(200).json({ status: 'success', count: list.length, data: list });
    } catch (err) {
      next(err);
    }
  },

  getHistory: async (req, res, next) => {
    try {
      const tenantId = req.tenantId || 'mak-tours';
      const tenantQuery = req.tenantQuery || buildTenantQuery(tenantId);
      const { employeeId } = req.params;
      const emp = await Employee.findOne(
        mergeTenantFilter(tenantQuery, {
          $or: [
            { employeeCode: employeeId },
            { code: employeeId },
            { id: employeeId },
            { driverId: employeeId },
            { _id: employeeId.match(/^[0-9a-fA-F]{24}$/) ? employeeId : null }
          ]
        })
      ).lean();

      const targetCodes = [employeeId];
      if (emp) {
        if (emp.employeeCode) targetCodes.push(emp.employeeCode);
        if (emp.code) targetCodes.push(emp.code);
        if (emp.id) targetCodes.push(emp.id);
        if (emp.driverId) targetCodes.push(emp.driverId);
        targetCodes.push(emp._id.toString());
      }

      const history = await Attendance.find(
        mergeTenantFilter(tenantQuery, {
          $or: [
            { employeeId: { $in: targetCodes } },
            { employeeCode: { $in: targetCodes } },
            { driverId: { $in: targetCodes } }
          ]
        })
      )
        .sort({ date: -1 })
        .limit(60)
        .lean();

      return res.status(200).json({ status: 'success', count: history.length, data: history });
    } catch (err) {
      next(err);
    }
  },

  mark: async (req, res, next) => {
    try {
      const tenantId = req.tenantId || 'mak-tours';
      const tenantQuery = req.tenantQuery || buildTenantQuery(tenantId);
      const {
        employeeId: rawEmpId,
        employeeCode: rawEmpCode,
        employeeName: rawEmpName,
        date,
        status: rawStatus,
        checkIn,
        checkOut,
        shift,
        department,
        role,
        punchLocation,
        remarks,
        overtimeHours,
        dutyDuration,
        isDriverAttendance,
        driverId,
        trips
      } = req.body;

      if (!rawEmpId || !date) {
        return res.status(400).json({ status: 'error', message: 'employeeId and date are required' });
      }

      // Date validation
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return res.status(400).json({ status: 'error', message: 'Invalid date format. Expected YYYY-MM-DD' });
      }

      // Resolve Employee or Driver for canonical matching
      const targetEmp = await Employee.findOne(
        mergeTenantFilter(tenantQuery, {
          $or: [
            { employeeCode: rawEmpId },
            { code: rawEmpId },
            { id: rawEmpId },
            { driverId: rawEmpId },
            { _id: rawEmpId.match(/^[0-9a-fA-F]{24}$/) ? rawEmpId : null }
          ]
        })
      );

      let targetDriver = null;
      if (!targetEmp && (isDriverAttendance || driverId || rawEmpId.startsWith('DRV'))) {
        targetDriver = await Driver.findOne(
          mergeTenantFilter(tenantQuery, {
            $or: [
              { id: driverId || rawEmpId },
              { driverBadgeId: driverId || rawEmpId },
              { phone: rawEmpId }
            ]
          })
        );
      }

      // Canonical identifiers
      const canonicalEmpId = targetEmp
        ? (targetEmp.employeeCode || targetEmp.code || targetEmp.id)
        : targetDriver
        ? (targetDriver.id || targetDriver.driverBadgeId)
        : (rawEmpCode || rawEmpId);

      const canonicalEmpCode = targetEmp
        ? (targetEmp.employeeCode || targetEmp.code || targetEmp.id)
        : targetDriver
        ? (targetDriver.id || targetDriver.driverBadgeId)
        : (rawEmpCode || rawEmpId);

      const canonicalEmpName = targetEmp
        ? (targetEmp.fullName || targetEmp.name)
        : targetDriver
        ? (targetDriver.fullName || targetDriver.name)
        : (rawEmpName || 'Staff Member');

      const isDriver = targetEmp ? (targetEmp.isDriver || Boolean(targetEmp.driverId)) : Boolean(targetDriver || isDriverAttendance);
      const canonicalDriverId = targetEmp ? (targetEmp.driverId || '') : targetDriver ? targetDriver.id : (driverId || '');

      const normalizedStatus = normalizeAttendanceStatus(rawStatus, isDriver);

      const allKnownCodes = [
        canonicalEmpId,
        canonicalEmpCode,
        rawEmpId,
        rawEmpCode,
        canonicalDriverId,
        targetEmp?._id?.toString(),
        targetDriver?._id?.toString()
      ].filter(Boolean);

      // Search for any existing attendance record on this date for this employee
      const existing = await Attendance.findOne(
        mergeTenantFilter(tenantQuery, {
          date,
          $or: [
            { employeeId: { $in: allKnownCodes } },
            { employeeCode: { $in: allKnownCodes } },
            { driverId: { $in: allKnownCodes } }
          ]
        })
      );

      const defaultCheckIn = normalizedStatus === 'Late' ? '09:55 AM' : normalizedStatus.includes('Present') ? '09:15 AM' : '--:--';
      const defaultCheckOut = normalizedStatus === 'Late' || normalizedStatus.includes('Present') ? '06:30 PM' : '--:--';
      const defaultDuration = normalizedStatus === 'Late' ? '8h 35m' : normalizedStatus.includes('Present') ? '9h 15m' : normalizedStatus === 'Half Day' ? '4h 00m' : '0h 00m';

      const updateDoc = {
        tenantId,
        employeeId: canonicalEmpId,
        employeeCode: canonicalEmpCode,
        employeeName: canonicalEmpName,
        date,
        status: normalizedStatus,
        checkIn: checkIn || defaultCheckIn,
        checkOut: checkOut || defaultCheckOut,
        dutyDuration: dutyDuration || defaultDuration,
        shift: shift || (targetEmp ? targetEmp.shift : 'General (09:30 - 18:30)'),
        department: department || (targetEmp ? targetEmp.department : isDriver ? 'Fleet Logistics' : 'Operations & Dispatch'),
        role: role || (targetEmp ? (targetEmp.designation || targetEmp.role) : isDriver ? 'Fleet Driver' : 'Operations Staff'),
        punchLocation: punchLocation || (normalizedStatus.includes('Leave') || normalizedStatus === 'Absent' ? 'N/A' : 'HQ Chennai - Biometric T1'),
        remarks: remarks || (normalizedStatus === 'Late' ? 'Late arrival recorded.' : `Marked ${normalizedStatus} by Admin Operations.`),
        isDriverAttendance: isDriver,
        driverId: canonicalDriverId
      };

      if (overtimeHours !== undefined) updateDoc.overtimeHours = Number(overtimeHours) || 0;
      if (trips && Array.isArray(trips)) updateDoc.trips = trips;

      let savedRecord;
      if (existing) {
        // Create audit history entry if status changed
        const updateOperations = { $set: updateDoc };
        if (existing.status !== normalizedStatus) {
          updateOperations.$push = {
            auditHistory: {
              updatedBy: req.user?.username || req.user?.name || 'Admin Operations',
              updatedAt: new Date(),
              oldStatus: existing.status,
              newStatus: normalizedStatus,
              reason: remarks || 'Status updated via Attendance Management'
            }
          };
        }
        savedRecord = await Attendance.findByIdAndUpdate(existing._id, updateOperations, {
          returnDocument: 'after',
          runValidators: true
        });
      } else {
        savedRecord = await Attendance.create(updateDoc);
      }

      // Update today's punch state on Employee model if date is today
      const todayStr = new Date().toISOString().split('T')[0];
      if (date === todayStr && targetEmp) {
        targetEmp.attendanceToday = normalizedStatus.includes('Present')
          ? `Present (${updateDoc.checkIn})`
          : normalizedStatus === 'Late'
          ? `Late (${updateDoc.checkIn})`
          : normalizedStatus === 'Half Day'
          ? 'Half Day'
          : normalizedStatus.includes('Leave')
          ? 'On Leave'
          : normalizedStatus;
        await targetEmp.save();
      }

      // Dynamically recalculate active payroll for this employee for this month
      const monthStr = date.substring(0, 7);
      try {
        const policy = (await PayrollPolicy.findOne({ isDefault: true }).lean()) || {};
        const [yearStr, mStr] = monthStr.split('-');
        const year = parseInt(yearStr);
        const mIdx = parseInt(mStr) - 1;

        const attRecords = await Attendance.find({ date: { $regex: `^${monthStr}` } }).lean();
        const completedTrips = await Booking.find({
          tripStatus: { $in: ['Completed', 'Trip Completed'] },
          $or: [
            { pickupDate: { $regex: `^${monthStr}` } },
            { travelDate: { $regex: `^${monthStr}` } },
            { createdAt: { $gte: new Date(year, mIdx, 1), $lt: new Date(year, mIdx + 1, 1) } }
          ]
        }).lean();

        if (targetEmp) {
          await calculateOrUpsertEmployeePayroll(targetEmp.toObject(), monthStr, policy, attRecords, completedTrips);
        } else if (targetDriver) {
          await calculateOrUpsertEmployeePayroll(targetDriver.toObject(), monthStr, policy, attRecords, completedTrips);
        }
      } catch (payrollErr) {
        console.warn('Payroll auto-recalculation notice:', payrollErr.message);
      }

      return res.status(200).json({ status: 'success', data: savedRecord });
    } catch (err) {
      next(err);
    }
  },

  bulkMark: async (req, res, next) => {
    try {
      const tenantId = req.tenantId || 'mak-tours';
      const tenantQuery = req.tenantQuery || buildTenantQuery(tenantId);
      const { status = 'Present', date = new Date().toISOString().split('T')[0], employeeIds } = req.body;

      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return res.status(400).json({ status: 'error', message: 'Invalid date format. Expected YYYY-MM-DD' });
      }

      let employees = [];
      if (employeeIds && Array.isArray(employeeIds) && employeeIds.length > 0) {
        employees = await Employee.find(
          mergeTenantFilter(tenantQuery, {
            $or: [{ id: { $in: employeeIds } }, { employeeCode: { $in: employeeIds } }]
          })
        ).lean();
      } else {
        employees = await Employee.find({ ...tenantQuery, status: 'Active' }).lean();
      }

      for (const emp of employees) {
        const canonicalCode = emp.employeeCode || emp.code || emp.id;
        const normalized = normalizeAttendanceStatus(status, emp.isDriver);

        const allCodes = [canonicalCode, emp.id, emp.code, emp._id.toString(), emp.driverId].filter(Boolean);
        const existing = await Attendance.findOne(
          mergeTenantFilter(tenantQuery, {
            date,
            $or: [{ employeeId: { $in: allCodes } }, { employeeCode: { $in: allCodes } }]
          })
        );

        const doc = {
          tenantId,
          employeeId: canonicalCode,
          employeeCode: canonicalCode,
          employeeName: emp.fullName || emp.name,
          date,
          status: normalized,
          checkIn: normalized === 'Present' || normalized.includes('Present') ? '09:15 AM' : '--:--',
          checkOut: normalized === 'Present' || normalized.includes('Present') ? '06:30 PM' : '--:--',
          dutyDuration: normalized.includes('Present') ? '9h 15m' : '0h 00m',
          shift: emp.shift || 'General (09:30 - 18:30)',
          department: emp.department || 'Operations & Dispatch',
          role: emp.designation || emp.role || 'Operations Staff',
          punchLocation: 'HQ Chennai - Biometric T1',
          remarks: `Bulk marked as ${normalized} by Admin.`,
          isDriverAttendance: Boolean(emp.isDriver),
          driverId: emp.driverId || ''
        };

        if (existing) {
          await Attendance.findByIdAndUpdate(existing._id, { $set: doc });
        } else {
          await Attendance.create(doc);
        }
      }

      return res.status(200).json({
        status: 'success',
        message: `Marked ${employees.length} staff attendance as ${status} on ${date}`
      });
    } catch (err) {
      next(err);
    }
  },

  delete: async (req, res, next) => {
    try {
      const tenantId = req.tenantId || 'mak-tours';
      const tenantQuery = req.tenantQuery || buildTenantQuery(tenantId);
      const { id } = req.params;
      const deleted = await Attendance.findOneAndDelete(
        mergeTenantFilter(tenantQuery, {
          $or: [
            { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null },
            { id }
          ]
        })
      );

      if (!deleted) {
        return res.status(404).json({ status: 'error', message: 'Attendance record not found' });
      }

      return res.status(200).json({ status: 'success', message: 'Attendance record deleted successfully' });
    } catch (err) {
      next(err);
    }
  }
};

export default attendanceController;
