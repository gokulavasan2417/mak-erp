// MAK Tours & Travels ERP - Multi-Tenant Vendor Payables Controller
// Handles Vendor Bills, Payments, Vendor Ledger & Outstanding Aging Reports
import mongoose from 'mongoose';
import { VendorBill } from '../models/VendorBill.js';
import { VendorPayment } from '../models/VendorPayment.js';
import { Vendor } from '../models/Vendor.js';
import { CashBankAccount } from '../models/CashBankAccount.js';
import { sequenceService } from '../services/sequenceService.js';
import { postingService } from '../services/postingService.js';
import { whitelistFields } from '../utils/fieldHelper.js';
import { escapeRegex } from '../utils/escapeRegex.js';

export const payableController = {
  // ==========================================================================
  // 1. VENDOR BILLS
  // ==========================================================================

  // List Vendor Bills with Filters
  getBills: async (req, res, next) => {
    try {
      const tenantId = (req.tenantId || 'mak-tours').toLowerCase().trim();
      const tenantQuery = req.tenantQuery || { tenantId };
      const { vendorId, status, startDate, endDate, search } = req.query;

      const query = { ...tenantQuery };
      if (vendorId) query.vendorId = vendorId;
      if (status && status !== 'All') query.status = status;
      if (startDate || endDate) {
        query.billDate = {};
        if (startDate) query.billDate.$gte = startDate;
        if (endDate) query.billDate.$lte = endDate;
      }
      if (search && search.trim()) {
        const s = escapeRegex(search.trim());
        query.$or = [
          { billNumber: { $regex: s, $options: 'i' } },
          { vendorInvoiceNumber: { $regex: s, $options: 'i' } },
          { vendorName: { $regex: s, $options: 'i' } },
          { bookingRef: { $regex: s, $options: 'i' } }
        ];
      }

      const bills = await VendorBill.find(query).sort({ billDate: -1, createdAt: -1 }).lean();
      return res.status(200).json({ status: 'success', count: bills.length, data: bills });
    } catch (err) {
      next(err);
    }
  },

  // Get Single Vendor Bill
  getBillById: async (req, res, next) => {
    try {
      const tenantId = (req.tenantId || 'mak-tours').toLowerCase().trim();
      const tenantQuery = req.tenantQuery || { tenantId };
      const { id } = req.params;

      const bill = await VendorBill.findOne({
        ...tenantQuery,
        $or: [{ billNumber: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }]
      });

      if (!bill) {
        return res.status(404).json({ status: 'error', message: 'Vendor bill not found' });
      }

      return res.status(200).json({ status: 'success', data: bill });
    } catch (err) {
      next(err);
    }
  },

  // Create Vendor Bill
  createBill: async (req, res, next) => {
    try {
      const tenantId = (req.tenantId || 'mak-tours').toLowerCase().trim();

      const ALLOWED = [
        'vendorId',
        'vendorName',
        'vendorInvoiceNumber',
        'bookingRef',
        'category',
        'billDate',
        'dueDate',
        'subtotal',
        'taxAmount',
        'totalAmount',
        'lineItems',
        'notes'
      ];
      const data = whitelistFields(req.body, ALLOWED);

      if (!data.vendorId) {
        return res.status(400).json({ status: 'error', message: 'Vendor ID is required' });
      }

      // Lookup Vendor details if vendorName missing
      let vendorName = data.vendorName;
      if (!vendorName) {
        const v = await Vendor.findOne({
          tenantId,
          $or: [{ vendorId: data.vendorId }, { id: data.vendorId }, { _id: data.vendorId.match(/^[0-9a-fA-F]{24}$/) ? data.vendorId : null }]
        }).lean();
        vendorName = v?.companyName || v?.name || 'Vendor Partner';
      }

      const subtotal = Math.max(0, Number(data.subtotal) || 0);
      const taxAmount = Math.max(0, Number(data.taxAmount) || 0);
      const totalAmount = Math.round((Number(data.totalAmount) || (subtotal + taxAmount)) * 100) / 100;

      if (totalAmount <= 0) {
        return res.status(400).json({ status: 'error', message: 'Bill total amount must be greater than zero' });
      }

      const billNumber = await sequenceService.getNextBillNo(tenantId);
      const billDate = data.billDate || new Date().toISOString().split('T')[0];
      const dueDate = data.dueDate || billDate;

      const newBill = new VendorBill({
        tenantId,
        billNumber,
        vendorInvoiceNumber: data.vendorInvoiceNumber || '',
        vendorId: data.vendorId,
        vendorName,
        bookingRef: data.bookingRef || '',
        category: data.category || 'Subcontract Vehicle',
        billDate,
        dueDate,
        lineItems: Array.isArray(data.lineItems) && data.lineItems.length > 0
          ? data.lineItems
          : [{ description: data.category || 'Vendor Fleet Services', rate: subtotal || totalAmount, amount: subtotal || totalAmount }],
        subtotal: subtotal || totalAmount,
        taxAmount,
        totalAmount,
        amountPaid: 0,
        balanceDue: totalAmount,
        status: 'Unpaid',
        notes: data.notes || ''
      });

      await newBill.save();
      return res.status(201).json({ status: 'success', data: newBill });
    } catch (err) {
      next(err);
    }
  },

  // ==========================================================================
  // 2. VENDOR PAYMENTS
  // ==========================================================================

  // List Vendor Payments
  getPayments: async (req, res, next) => {
    try {
      const tenantId = (req.tenantId || 'mak-tours').toLowerCase().trim();
      const tenantQuery = req.tenantQuery || { tenantId };
      const { vendorId, paymentDate } = req.query;

      const query = { ...tenantQuery };
      if (vendorId) query.vendorId = vendorId;
      if (paymentDate) query.paymentDate = paymentDate;

      const list = await VendorPayment.find(query).sort({ paymentDate: -1, createdAt: -1 }).lean();
      return res.status(200).json({ status: 'success', count: list.length, data: list });
    } catch (err) {
      next(err);
    }
  },

  // Record Vendor Payment (Full / Partial / Advance with Overpayment Guard & Ledger Posting)
  recordPayment: async (req, res, next) => {
    try {
      const tenantId = (req.tenantId || 'mak-tours').toLowerCase().trim();
      const tenantQuery = req.tenantQuery || { tenantId };

      const { vendorId, billNumber, amount, paymentType = 'Full Payment', paymentMethod = 'Bank Transfer', paymentDate, transactionRef, notes } = req.body;

      const numAmount = Math.round(Number(amount) * 100) / 100;
      if (!numAmount || numAmount <= 0) {
        return res.status(400).json({ status: 'error', message: 'Valid payment amount greater than zero is required' });
      }

      if (!vendorId) {
        return res.status(400).json({ status: 'error', message: 'Vendor ID is required' });
      }

      // Find Vendor
      const vendor = await Vendor.findOne({
        ...tenantQuery,
        $or: [{ vendorId }, { id: vendorId }, { _id: vendorId.match(/^[0-9a-fA-F]{24}$/) ? vendorId : null }]
      }).lean();

      const vendorName = vendor?.companyName || vendor?.name || req.body.vendorName || 'Vendor';

      let bill = null;
      if (billNumber) {
        bill = await VendorBill.findOne({
          ...tenantQuery,
          billNumber
        });

        if (bill) {
          // Overpayment check against bill balance
          if (paymentType !== 'Advance Payment' && numAmount > bill.balanceDue) {
            return res.status(400).json({
              status: 'error',
              code: 'OVERPAYMENT_REJECTED',
              message: `Payment of ₹${numAmount} exceeds bill balance due of ₹${bill.balanceDue}. Use paymentType='Advance Payment' for advance payments.`
            });
          }

          bill.amountPaid = (bill.amountPaid || 0) + numAmount;
          bill.balanceDue = Math.max(0, bill.totalAmount - bill.amountPaid);
          if (bill.balanceDue === 0) {
            bill.status = 'Paid';
          } else if (bill.amountPaid > 0) {
            bill.status = 'Partially Paid';
          }
          await bill.save();
        }
      }

      const paymentRef = await sequenceService.getNextVendorPaymentRef(tenantId);
      const effectiveDate = paymentDate || new Date().toISOString().split('T')[0];

      const newPayment = new VendorPayment({
        tenantId,
        paymentRef,
        vendorId,
        vendorName,
        billNumber: billNumber || '',
        amount: numAmount,
        paymentType,
        paymentMethod,
        paymentDate: effectiveDate,
        transactionRef: transactionRef || '',
        notes: notes || `Vendor payout to ${vendorName}`
      });

      // Post to Double-Entry General Ledger (Debit: 2020 Vendor Payables, Credit: 1020 Bank / 1010 Cash)
      try {
        const jv = await postingService.postVendorPayment({
          tenantId,
          paymentId: paymentRef,
          amount: numAmount,
          date: effectiveDate,
          vendorId,
          vendorName,
          paymentMethod,
          user: req.user
        });
        newPayment.journalEntryNo = jv.entryNo;
      } catch (ledgerErr) {
        console.warn('[PayableController] Ledger posting note on vendor payment:', ledgerErr.message);
      }

      await newPayment.save();

      return res.status(201).json({
        status: 'success',
        message: `Vendor payment of ₹${numAmount} recorded successfully`,
        data: newPayment,
        bill: bill || null
      });
    } catch (err) {
      next(err);
    }
  },

  // ==========================================================================
  // 3. VENDOR LEDGER
  // ==========================================================================

  // Chronological Vendor Statement & Ledger
  getVendorLedger: async (req, res, next) => {
    try {
      const tenantId = (req.tenantId || 'mak-tours').toLowerCase().trim();
      const tenantQuery = req.tenantQuery || { tenantId };
      const { vendorId } = req.query;

      if (!vendorId) {
        return res.status(400).json({ status: 'error', message: 'vendorId query parameter is required' });
      }

      const [vendor, bills, payments] = await Promise.all([
        Vendor.findOne({
          ...tenantQuery,
          $or: [{ vendorId }, { id: vendorId }, { _id: vendorId.match(/^[0-9a-fA-F]{24}$/) ? vendorId : null }]
        }).lean(),
        VendorBill.find({ ...tenantQuery, vendorId }).lean(),
        VendorPayment.find({ ...tenantQuery, vendorId }).lean()
      ]);

      const transactions = [];

      // Bills increase liability to vendor (Credit)
      for (const b of bills) {
        if (b.status !== 'Cancelled') {
          transactions.push({
            date: b.billDate,
            type: 'BILL',
            refNo: b.billNumber,
            description: `Bill for ${b.category || 'Services'} (#${b.bookingRef || 'General'})`,
            debit: 0,
            credit: b.totalAmount || 0
          });
        }
      }

      // Payments decrease liability to vendor (Debit)
      for (const p of payments) {
        transactions.push({
          date: p.paymentDate,
          type: 'PAYMENT',
          refNo: p.paymentRef,
          description: `Disbursement via ${p.paymentMethod || 'Bank'} (#${p.billNumber || 'Advance'})`,
          debit: p.amount || 0,
          credit: 0
        });
      }

      // Sort Chronologically
      transactions.sort((a, b) => new Date(a.date) - new Date(b.date));

      let runningBalance = 0;
      let totalBilled = 0;
      let totalPaid = 0;

      for (const tx of transactions) {
        totalBilled += tx.credit; // Payable increases
        totalPaid += tx.debit;    // Payable decreases
        runningBalance += tx.credit - tx.debit;
        tx.runningBalance = Math.round(runningBalance * 100) / 100;
      }

      return res.status(200).json({
        status: 'success',
        vendor: {
          vendorId,
          companyName: vendor?.companyName || vendor?.name || 'Vendor Partner',
          phone: vendor?.phone || '',
          email: vendor?.email || ''
        },
        summary: {
          totalBilled: Math.round(totalBilled * 100) / 100,
          totalPaid: Math.round(totalPaid * 100) / 100,
          outstandingBalance: Math.round(runningBalance * 100) / 100
        },
        count: transactions.length,
        transactions
      });
    } catch (err) {
      next(err);
    }
  },

  // ==========================================================================
  // 4. OUTSTANDING REPORT & DUE DATES
  // ==========================================================================

  // Vendor Outstanding Report with Due Date Aging
  getOutstandingReport: async (req, res, next) => {
    try {
      const tenantId = (req.tenantId || 'mak-tours').toLowerCase().trim();
      const tenantQuery = req.tenantQuery || { tenantId };

      const bills = await VendorBill.find({
        ...tenantQuery,
        status: { $in: ['Unpaid', 'Partially Paid'] },
        balanceDue: { $gt: 0 }
      }).sort({ dueDate: 1 }).lean();

      const today = new Date().toISOString().split('T')[0];
      const now = Date.now();

      const aging = {
        notDue: { count: 0, amount: 0 },
        '1-15': { count: 0, amount: 0 },
        '16-30': { count: 0, amount: 0 },
        '31-60': { count: 0, amount: 0 },
        '60+': { count: 0, amount: 0 }
      };

      let totalOutstanding = 0;
      const itemized = [];

      for (const b of bills) {
        totalOutstanding += b.balanceDue;
        const dueDateMs = new Date(b.dueDate).getTime();
        const daysOverdue = Math.floor((now - dueDateMs) / (1000 * 60 * 60 * 24));

        let bucket = 'notDue';
        if (daysOverdue > 60) bucket = '60+';
        else if (daysOverdue > 30) bucket = '31-60';
        else if (daysOverdue > 15) bucket = '16-30';
        else if (daysOverdue > 0) bucket = '1-15';

        aging[bucket].count += 1;
        aging[bucket].amount = Math.round((aging[bucket].amount + b.balanceDue) * 100) / 100;

        itemized.push({
          billNumber: b.billNumber,
          vendorId: b.vendorId,
          vendorName: b.vendorName,
          category: b.category,
          billDate: b.billDate,
          dueDate: b.dueDate,
          totalAmount: b.totalAmount,
          amountPaid: b.amountPaid,
          balanceDue: b.balanceDue,
          isOverdue: daysOverdue > 0,
          daysOverdue: Math.max(0, daysOverdue),
          bucket
        });
      }

      return res.status(200).json({
        status: 'success',
        asOfDate: today,
        totalOutstanding: Math.round(totalOutstanding * 100) / 100,
        agingSummary: aging,
        count: itemized.length,
        data: itemized
      });
    } catch (err) {
      next(err);
    }
  }
};

export default payableController;