// MAK Tours & Travels ERP - Driver Settlements Controller
// Reuses verified Phase 0 trip allowance engine; calculates gross earnings, advances, deductions & ledger postings
import mongoose from 'mongoose';
import { DriverSettlement } from '../models/DriverSettlement.js';
import { Driver } from '../models/Driver.js';
import { Booking } from '../models/Booking.js';
import { Expense } from '../models/Expense.js';
import { PayrollPolicy } from '../models/PayrollPolicy.js';
import { sequenceService } from '../services/sequenceService.js';
import { postingService } from '../services/postingService.js';
import { calculateDriverTripAllowances } from '../services/driverEarningsService.js';
import { whitelistFields } from '../utils/fieldHelper.js';

export const driverSettlementController = {
  // 1. Calculate Driver Trip Earnings & Settlement Preview (REUSING PHASE 0 ENGINE)
  calculatePreview: async (req, res, next) => {
    try {
      const tenantId = (req.tenantId || 'mak-tours').toLowerCase().trim();
      const tenantQuery = req.tenantQuery || { tenantId };
      const { driverId, periodStart, periodEnd, deductions = 0, deductionReason = '' } = req.body;

      if (!driverId) {
        return res.status(400).json({ status: 'error', message: 'Driver ID is required for settlement calculation' });
      }

      // Lookup Driver Profile & Allowance overrides
      const driver = await Driver.findOne({
        ...tenantQuery,
        $or: [{ id: driverId }, { driverBadgeId: driverId }, { _id: driverId.match(/^[0-9a-fA-F]{24}$/) ? driverId : null }]
      }).lean();

      if (!driver) {
        return res.status(404).json({ status: 'error', message: `Driver '${driverId}' not found in your company` });
      }

      const driverCodes = new Set([
        String(driver.id || '').toLowerCase().trim(),
        String(driver.driverBadgeId || '').toLowerCase().trim(),
        String(driver._id || '').toLowerCase().trim()
      ].filter(Boolean));

      // Fetch active payroll policy for rates
      let policy = await PayrollPolicy.findOne({ tenantId, isDefault: true }).lean();
      if (!policy) {
        policy = {
          driverAllowanceRules: {
            perTripAllowance: 300,
            nightAllowance: 250,
            longDistanceAllowance: 400,
            overnightAllowance: 500,
            longDistanceThresholdKm: 250
          },
          nightShiftStart: '22:00',
          nightShiftEnd: '06:00'
        };
      }

      // Query completed bookings for this driver in period
      const tripQuery = {
        ...tenantQuery,
        status: { $in: ['Completed', 'Confirmed'] },
        $or: [
          { driverId: { $in: Array.from(driverCodes) } },
          { assignedDriverId: { $in: Array.from(driverCodes) } }
        ]
      };

      if (periodStart || periodEnd) {
        tripQuery.travelDate = {};
        if (periodStart) tripQuery.travelDate.$gte = periodStart;
        if (periodEnd) tripQuery.travelDate.$lte = periodEnd;
      }

      const completedTrips = await Booking.find(tripQuery).lean();

      // REUSE PHASE 0 ENGINE
      const allowanceResult = calculateDriverTripAllowances({
        trips: completedTrips,
        driverCodes,
        policy,
        allowanceConfig: driver.allowanceConfig || {}
      });

      // Calculate Advances unrecovered from Expenses
      const advanceExpenses = await Expense.find({
        ...tenantQuery,
        $or: [
          { driverId: { $in: Array.from(driverCodes) } },
          { driverName: driver.name || driver.fullName }
        ],
        paymentMode: 'Driver Personal Advance',
        status: { $ne: 'Rejected' }
      }).lean();

      const advancesTotal = advanceExpenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);
      const otherDeductions = Math.max(0, Number(deductions) || 0);
      const grossEarnings = allowanceResult.totalDriverAllowances;
      const netSettlement = Math.max(0, grossEarnings - advancesTotal - otherDeductions);

      return res.status(200).json({
        status: 'success',
        driver: {
          id: driver.id || driver.driverBadgeId || driver._id.toString(),
          name: driver.name || driver.fullName || 'Driver',
          phone: driver.phone || driver.mobile || ''
        },
        period: {
          start: periodStart || 'Beginning of time',
          end: periodEnd || 'Present'
        },
        calculation: {
          tripCount: allowanceResult.tripCount,
          trips: allowanceResult.trips,
          perTripAllowanceTotal: allowanceResult.perTripAllowanceTotal,
          nightAllowanceTotal: allowanceResult.nightAllowanceTotal,
          longDistanceAllowanceTotal: allowanceResult.longDistanceAllowanceTotal,
          overnightAllowanceTotal: allowanceResult.overnightAllowanceTotal,
          grossEarnings,
          advancesDeducted: advancesTotal,
          otherDeductions,
          deductionReason,
          netSettlementAmount: netSettlement
        }
      });
    } catch (err) {
      next(err);
    }
  },

  // 2. Create Driver Settlement
  createSettlement: async (req, res, next) => {
    try {
      const tenantId = (req.tenantId || 'mak-tours').toLowerCase().trim();

      const ALLOWED = [
        'driverId',
        'driverName',
        'driverPhone',
        'periodStart',
        'periodEnd',
        'trips',
        'grossEarnings',
        'advancesDeducted',
        'otherDeductions',
        'deductionReason',
        'paymentMethod',
        'notes',
        'status'
      ];
      const data = whitelistFields(req.body, ALLOWED);

      if (!data.driverId) {
        return res.status(400).json({ status: 'error', message: 'Driver ID is required' });
      }

      const grossEarnings = Math.max(0, Number(data.grossEarnings) || 0);
      const advancesDeducted = Math.max(0, Number(data.advancesDeducted) || 0);
      const otherDeductions = Math.max(0, Number(data.otherDeductions) || 0);
      const netSettlementAmount = Math.max(0, grossEarnings - advancesDeducted - otherDeductions);

      const settlementNo = await sequenceService.getNextSettlementNo(tenantId);
      const periodStart = data.periodStart || new Date().toISOString().split('T')[0];
      const periodEnd = data.periodEnd || periodStart;

      const settlement = new DriverSettlement({
        tenantId,
        settlementNo,
        driverId: data.driverId,
        driverName: data.driverName || 'Driver',
        driverPhone: data.driverPhone || '',
        periodStart,
        periodEnd,
        trips: Array.isArray(data.trips) ? data.trips : [],
        tripCount: Array.isArray(data.trips) ? data.trips.length : 0,
        grossEarnings,
        advancesDeducted,
        otherDeductions,
        deductionReason: data.deductionReason || '',
        netSettlementAmount,
        amountPaid: 0,
        balanceDue: netSettlementAmount,
        status: data.status || 'Approved',
        paymentMethod: data.paymentMethod || 'UPI',
        notes: data.notes || ''
      });

      await settlement.save();
      return res.status(201).json({ status: 'success', data: settlement });
    } catch (err) {
      next(err);
    }
  },

  // 3. Disburse Settlement Payment (Posts to General Ledger)
  recordSettlementPayment: async (req, res, next) => {
    try {
      const tenantId = (req.tenantId || 'mak-tours').toLowerCase().trim();
      const tenantQuery = req.tenantQuery || { tenantId };
      const { id } = req.params;
      const { amount, paymentMethod = 'UPI', notes } = req.body;

      const settlement = await DriverSettlement.findOne({
        ...tenantQuery,
        $or: [{ settlementNo: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }]
      });

      if (!settlement) {
        return res.status(404).json({ status: 'error', message: 'Driver settlement record not found' });
      }

      const payAmt = Math.round((Number(amount) || settlement.balanceDue) * 100) / 100;
      if (payAmt <= 0) {
        return res.status(400).json({ status: 'error', message: 'Valid payment amount greater than zero is required' });
      }

      if (payAmt > settlement.balanceDue) {
        return res.status(400).json({
          status: 'error',
          code: 'OVERPAYMENT_REJECTED',
          message: `Payment of ₹${payAmt} exceeds settlement balance of ₹${settlement.balanceDue}`
        });
      }

      settlement.amountPaid = (settlement.amountPaid || 0) + payAmt;
      settlement.balanceDue = Math.max(0, settlement.netSettlementAmount - settlement.amountPaid);
      settlement.paymentMethod = paymentMethod;
      settlement.settledAt = new Date();
      settlement.settledBy = req.user?.name || req.user?.email || 'Accountant';

      if (settlement.balanceDue === 0) {
        settlement.status = 'Paid';
      } else {
        settlement.status = 'Partially Paid';
      }

      // Post to Double-Entry General Ledger (Debit: 2030 Driver Settlement Payables, Credit: 1010/1020/1030 Cash/Bank)
      try {
        const jv = await postingService.postDriverSettlement({
          tenantId,
          settlementId: settlement.settlementNo,
          amount: payAmt,
          date: new Date().toISOString().split('T')[0],
          driverId: settlement.driverId,
          driverName: settlement.driverName,
          paymentMethod,
          user: req.user
        });
        settlement.journalEntryNo = jv.entryNo;
      } catch (ledgerErr) {
        console.warn('[DriverSettlementController] Ledger posting note on driver settlement:', ledgerErr.message);
      }

      await settlement.save();

      return res.status(200).json({
        status: 'success',
        message: `Driver settlement disbursement of ₹${payAmt} recorded successfully`,
        data: settlement
      });
    } catch (err) {
      next(err);
    }
  },

  // 4. List Driver Settlements
  getAll: async (req, res, next) => {
    try {
      const tenantId = (req.tenantId || 'mak-tours').toLowerCase().trim();
      const tenantQuery = req.tenantQuery || { tenantId };
      const { driverId, status, startDate, endDate } = req.query;

      const query = { ...tenantQuery };
      if (driverId) query.driverId = driverId;
      if (status && status !== 'All') query.status = status;
      if (startDate || endDate) {
        query.periodStart = {};
        if (startDate) query.periodStart.$gte = startDate;
        if (endDate) query.periodStart.$lte = endDate;
      }

      const list = await DriverSettlement.find(query).sort({ createdAt: -1 }).lean();
      return res.status(200).json({ status: 'success', count: list.length, data: list });
    } catch (err) {
      next(err);
    }
  },

  // 5. Driver Settlement Statement View
  getStatement: async (req, res, next) => {
    try {
      const tenantId = (req.tenantId || 'mak-tours').toLowerCase().trim();
      const tenantQuery = req.tenantQuery || { tenantId };
      const { id } = req.params;

      const settlement = await DriverSettlement.findOne({
        ...tenantQuery,
        $or: [{ settlementNo: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }]
      }).lean();

      if (!settlement) {
        return res.status(404).json({ status: 'error', message: 'Driver settlement statement not found' });
      }

      return res.status(200).json({ status: 'success', data: settlement });
    } catch (err) {
      next(err);
    }
  }
};

export default driverSettlementController;