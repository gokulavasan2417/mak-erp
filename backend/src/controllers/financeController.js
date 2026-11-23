// MAK Tours & Travels ERP - Multi-Tenant Finance, Payments & Expenses Controller
// Connected to MongoDB Atlas "expenses", "payments", "invoices", and double-entry general ledger
import mongoose from 'mongoose';
import { Expense } from '../models/Expense.js';
import { Payment } from '../models/Payment.js';
import { Booking } from '../models/Booking.js';
import { Invoice } from '../models/Invoice.js';
import { Company } from '../models/Company.js';
import { Notification } from '../models/Notification.js';
import { CashBankAccount } from '../models/CashBankAccount.js';
import { sequenceService } from '../services/sequenceService.js';
import { postingService } from '../services/postingService.js';
import { generateInvoicePdfBuffer } from '../services/pdfService.js';
import { processUploadedFile } from '../middleware/uploadMiddleware.js';
import { whitelistFields } from '../utils/fieldHelper.js';
import { escapeRegex } from '../utils/escapeRegex.js';
import { buildTenantQuery } from '../middleware/tenantMiddleware.js';

const VALID_EXPENSE_STATUSES = ['Pending', 'Approved', 'Rejected', 'Paid', 'Verified', 'Reimbursed'];

export const financeController = {
  // ==========================================================================
  // 1. EXECUTIVE FINANCIAL OVERVIEW METRICS
  // ==========================================================================
  getOverview: async (req, res, next) => {
    try {
      const tenantId = (req.tenantId || 'mak-tours').toLowerCase().trim();
      const tenantQuery = req.tenantQuery || buildTenantQuery(tenantId);

      const [expenses, payments, bookings] = await Promise.all([
        Expense.find(tenantQuery).lean(),
        Payment.find(tenantQuery).lean(),
        Booking.find({
          ...tenantQuery,
          status: { $ne: 'Cancelled' },
          bookingStatus: { $ne: 'Cancelled' }
        }).lean()
      ]);

      // 1. Booking Revenue (Accrual basis: sum of active bookings' fare/pricing)
      const bookingRevenue = bookings.reduce(
        (acc, b) => acc + (Number(b.pricing || b.totalFare || b.fare || b.totalAmount) || 0),
        0
      );

      // 2. Collected Revenue (Cash basis: captured/paid payments minus refunds)
      const collectedRevenue = payments.reduce((acc, p) => {
        const amt = Number(p.amount) || 0;
        if (p.status === 'captured' || p.status === 'paid') return acc + amt;
        if (p.status === 'refunded') return acc - amt;
        return acc;
      }, 0);

      // 3. Pending Payments (in flight)
      const pendingPayments = payments.reduce((acc, p) => {
        if (p.status === 'created' || p.status === 'pending') {
          return acc + (Number(p.amount) || 0);
        }
        return acc;
      }, 0);

      // 4. Total Operating Expenses (excluding rejected)
      const totalExpenses = expenses.reduce((acc, e) => {
        if (e.status !== 'Rejected') {
          return acc + (Number(e.amount) || 0);
        }
        return acc;
      }, 0);

      // 5. Outstanding Balance (Booking fare minus collected, floored at 0)
      const outstandingBalance = Math.max(0, bookingRevenue - Math.max(0, collectedRevenue));

      // 6. Cash Profit vs Accrual Profit
      const profit = collectedRevenue - totalExpenses;
      const accrualProfit = bookingRevenue - totalExpenses;

      return res.status(200).json({
        status: 'success',
        data: {
          bookingRevenue,
          collectedRevenue,
          pendingPayments,
          outstandingBalance,
          totalExpenses,
          profit,
          accrualProfit,
          totalRevenue: collectedRevenue,
          netProfit: profit,
          totalBookingsRevenue: bookingRevenue,
          expensesCount: expenses.length,
          paymentsCount: payments.length,
          bookingsCount: bookings.length
        }
      });
    } catch (err) {
      next(err);
    }
  },

  // ==========================================================================
  // 2. EXPENSES MANAGEMENT
  // ==========================================================================

  // List Expenses with Filters
  getExpenses: async (req, res, next) => {
    try {
      const tenantId = (req.tenantId || 'mak-tours').toLowerCase().trim();
      const tenantQuery = req.tenantQuery || buildTenantQuery(tenantId);
      const { tripId, category, status, search, startDate, endDate } = req.query;
      const query = { ...tenantQuery };

      if (tripId) {
        query.$or = [{ tripId }, { bookingRef: tripId }, { bookingId: tripId }];
      }
      if (category && category !== 'All' && category !== 'All Categories') {
        query.category = category;
      }
      if (status && status !== 'All') {
        query.status = status;
      }
      if (startDate || endDate) {
        query.date = {};
        if (startDate) query.date.$gte = startDate;
        if (endDate) query.date.$lte = endDate;
      }
      if (search && search.trim()) {
        const s = escapeRegex(search.trim());
        query.$or = [
          { driverName: { $regex: s, $options: 'i' } },
          { receiptNumber: { $regex: s, $options: 'i' } },
          { id: { $regex: s, $options: 'i' } },
          { tollPlazaName: { $regex: s, $options: 'i' } },
          { notes: { $regex: s, $options: 'i' } }
        ];
      }

      const list = await Expense.find(query).sort({ date: -1, createdAt: -1 }).lean();
      return res.status(200).json({ status: 'success', count: list.length, data: list });
    } catch (err) {
      next(err);
    }
  },

  // Create Expense (Wider Categories, Optional Immediate Ledger Posting)
  createExpense: async (req, res, next) => {
    try {
      const tenantId = (req.tenantId || 'mak-tours').toLowerCase().trim();

      const ALLOWED_FIELDS = [
        'category',
        'amount',
        'tripId',
        'bookingRef',
        'bookingId',
        'driverId',
        'driverName',
        'vehicleId',
        'date',
        'receiptNumber',
        'receiptUrl',
        'notes',
        'odometerKm',
        'litersFilled',
        'tollPlazaName',
        'paymentMode',
        'status'
      ];
      const cleanData = whitelistFields(req.body, ALLOWED_FIELDS);

      if (!cleanData.category || !cleanData.amount) {
        return res.status(400).json({
          status: 'error',
          message: 'Category and amount are required to record an expense'
        });
      }

      const id = await sequenceService.getNextExpenseId(tenantId);
      const expenseStatus = cleanData.status && VALID_EXPENSE_STATUSES.includes(cleanData.status) ? cleanData.status : 'Pending';

      const newExpense = new Expense({
        ...cleanData,
        tenantId,
        id,
        amount: Math.max(0, Number(cleanData.amount) || 0),
        status: expenseStatus
      });

      // If created directly in "Paid" status, post to double-entry general ledger
      if (expenseStatus === 'Paid') {
        try {
          const jv = await postingService.postExpensePayment({
            tenantId,
            expenseId: id,
            amount: newExpense.amount,
            date: newExpense.date,
            category: newExpense.category,
            paymentMode: newExpense.paymentMode,
            driverName: newExpense.driverName,
            notes: newExpense.notes,
            user: req.user
          });
          newExpense.journalEntryNo = jv.entryNo;
          newExpense.paidBy = req.user?.name || req.user?.email || 'Accountant';
          newExpense.paidAt = new Date();
        } catch (postErr) {
          console.warn('[FinanceController] Ledger posting note on createExpense:', postErr.message);
        }
      }

      await newExpense.save();
      return res.status(201).json({ status: 'success', data: newExpense });
    } catch (err) {
      next(err);
    }
  },

  // Edit Expense Endpoint (Guards Against Modifying Already Paid/Posted Expenses)
  updateExpense: async (req, res, next) => {
    try {
      const tenantId = (req.tenantId || 'mak-tours').toLowerCase().trim();
      const tenantQuery = req.tenantQuery || buildTenantQuery(tenantId);
      const { id } = req.params;

      const existing = await Expense.findOne({
        ...tenantQuery,
        $or: [{ id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }]
      });

      if (!existing) {
        return res.status(404).json({ status: 'error', message: 'Expense record not found' });
      }

      // Guard: Paid expenses cannot be modified as they are already posted to the ledger
      if (existing.status === 'Paid') {
        return res.status(400).json({
          status: 'error',
          code: 'PAID_EXPENSE_IMMUTABLE',
          message: 'Paid expense cannot be edited as it has already been posted to the general ledger.'
        });
      }

      const ALLOWED_EDITS = [
        'category',
        'amount',
        'tripId',
        'bookingRef',
        'driverId',
        'driverName',
        'vehicleId',
        'date',
        'receiptNumber',
        'receiptUrl',
        'notes',
        'odometerKm',
        'litersFilled',
        'tollPlazaName',
        'paymentMode'
      ];
      const edits = whitelistFields(req.body, ALLOWED_EDITS);

      Object.assign(existing, edits);
      if (edits.amount !== undefined) {
        existing.amount = Math.max(0, Number(edits.amount) || 0);
      }

      await existing.save();
      return res.status(200).json({ status: 'success', data: existing });
    } catch (err) {
      next(err);
    }
  },

  // Expense Approval Workflow & Ledger Posting on "Paid"
  updateExpenseStatus: async (req, res, next) => {
    try {
      const tenantId = (req.tenantId || 'mak-tours').toLowerCase().trim();
      const tenantQuery = req.tenantQuery || buildTenantQuery(tenantId);
      const { id } = req.params;
      const { status, reason } = req.body;

      if (!status || !VALID_EXPENSE_STATUSES.includes(status)) {
        return res.status(400).json({
          status: 'error',
          code: 'INVALID_STATUS',
          message: `Invalid expense status. Allowed values: ${VALID_EXPENSE_STATUSES.join(', ')}`
        });
      }

      const existing = await Expense.findOne({
        ...tenantQuery,
        $or: [{ id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }]
      });

      if (!existing) {
        return res.status(404).json({ status: 'error', message: 'Expense record not found' });
      }

      // State transition guards
      if (existing.status === 'Paid' && status !== 'Paid') {
        return res.status(400).json({
          status: 'error',
          code: 'ILLEGAL_TRANSITION',
          message: 'Paid expenses cannot be moved back to other statuses (already posted to ledger).'
        });
      }
      if (existing.status === 'Reimbursed' && status === 'Pending') {
        return res.status(400).json({
          status: 'error',
          code: 'ILLEGAL_TRANSITION',
          message: 'Reimbursed expenses cannot be moved back to Pending status.'
        });
      }
      if (existing.status === 'Rejected' && (status === 'Reimbursed' || status === 'Paid')) {
        return res.status(400).json({
          status: 'error',
          code: 'ILLEGAL_TRANSITION',
          message: 'Rejected expenses must be Approved before being Paid or Reimbursed.'
        });
      }

      existing.status = status;

      if (status === 'Approved') {
        existing.approvedBy = req.user?.name || req.user?.email || 'Accountant';
        existing.approvedAt = new Date();
      } else if (status === 'Rejected') {
        existing.rejectionReason = reason || 'Rejected by accountant';
      } else if (status === 'Paid') {
        existing.paidBy = req.user?.name || req.user?.email || 'Accountant';
        existing.paidAt = new Date();

        // Post to ledger if not already posted
        if (!existing.journalEntryNo) {
          try {
            const jv = await postingService.postExpensePayment({
              tenantId,
              expenseId: existing.id || String(existing._id),
              amount: existing.amount,
              date: existing.date,
              category: existing.category,
              paymentMode: existing.paymentMode,
              driverName: existing.driverName,
              notes: existing.notes,
              user: req.user
            });
            existing.journalEntryNo = jv.entryNo;
          } catch (ledgerErr) {
            console.error('[FinanceController] Ledger posting failed on expense payment:', ledgerErr.message);
          }
        }
      }

      await existing.save();
      return res.status(200).json({ status: 'success', data: existing });
    } catch (err) {
      next(err);
    }
  },

  // Upload Expense Receipt File
  uploadExpenseReceipt: async (req, res, next) => {
    try {
      if (!req.file) {
        return res.status(400).json({ status: 'error', message: 'No receipt file provided' });
      }
      const receiptUrl = await processUploadedFile(req.file, req);
      return res.status(200).json({ status: 'success', receiptUrl });
    } catch (err) {
      next(err);
    }
  },

  // ==========================================================================
  // 3. INVOICES MANAGEMENT & TAX SPLIT (CGST/SGST/IGST)
  // ==========================================================================

  // Get Invoices List
  getInvoices: async (req, res, next) => {
    try {
      const tenantId = (req.tenantId || 'mak-tours').toLowerCase().trim();
      const tenantQuery = req.tenantQuery || buildTenantQuery(tenantId);

      const persistedInvoices = await Invoice.find(tenantQuery).sort({ createdAt: -1 }).lean();
      const seenBookingRefs = new Set(persistedInvoices.map((inv) => inv.bookingRef).filter(Boolean));

      // Non-cancelled bookings that do not have a persisted invoice
      const bookings = await Booking.find({
        ...tenantQuery,
        status: { $ne: 'Cancelled' },
        bookingStatus: { $ne: 'Cancelled' }
      }).lean();

      const legacyInvoices = [];
      for (const b of bookings) {
        const ref = b.refId || b.bookingNumber || b._id.toString();
        if (!seenBookingRefs.has(ref) && !seenBookingRefs.has(b.refId) && !seenBookingRefs.has(b.bookingNumber)) {
          const fare = Number(b.totalFare || b.pricing || b.fare || b.totalAmount || 0);
          const advance = Number(b.advancePaid || 0);
          const bal = b.balanceDue !== undefined ? Number(b.balanceDue) : Math.max(0, fare - advance);

          let computedStatus = 'Unpaid';
          if (advance >= fare && fare > 0) {
            computedStatus = 'Paid';
          } else if (advance > 0 && advance < fare) {
            computedStatus = 'Partially Paid';
          }

          legacyInvoices.push({
            id: `INV-${ref}`,
            invoiceNumber: `INV-${ref}`,
            bookingRef: ref,
            customerName: b.fullName || b.customerName || 'Valued Guest',
            customer: {
              name: b.fullName || b.customerName || 'Valued Guest',
              phone: b.mobileNumber || b.phone || '',
              email: b.email || ''
            },
            amount: fare,
            amountPaid: advance,
            balanceDue: bal,
            status: computedStatus,
            date: b.travelDate || b.pickupDate || b.createdAt,
            invoiceDate: b.travelDate || b.pickupDate || new Date(b.createdAt || Date.now()).toISOString().split('T')[0],
            isLegacyBookingDerived: true
          });
        }
      }

      const allInvoices = [...persistedInvoices, ...legacyInvoices];
      return res.status(200).json({ status: 'success', count: allInvoices.length, data: allInvoices });
    } catch (err) {
      next(err);
    }
  },

  // Get Invoice by ID / Number
  getInvoiceById: async (req, res, next) => {
    try {
      const tenantId = (req.tenantId || 'mak-tours').toLowerCase().trim();
      const tenantQuery = req.tenantQuery || buildTenantQuery(tenantId);
      const { id } = req.params;

      const inv = await Invoice.findOne({
        ...tenantQuery,
        $or: [{ invoiceNumber: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { bookingRef: id }]
      });

      if (!inv) {
        return res.status(404).json({ status: 'error', message: 'Invoice not found' });
      }

      return res.status(200).json({ status: 'success', data: inv });
    } catch (err) {
      next(err);
    }
  },

  // Create Invoice with GST Split, Discount, Additional Charges & Ledger Posting
  createInvoice: async (req, res, next) => {
    try {
      const tenantId = (req.tenantId || 'mak-tours').toLowerCase().trim();

      const ALLOWED_FIELDS = [
        'bookingRef',
        'bookingId',
        'customer',
        'customerName',
        'customerEmail',
        'customerPhone',
        'customerState',
        'lineItems',
        'subtotal',
        'amount',
        'discount',
        'additionalCharges',
        'gstRate',
        'amountPaid',
        'invoiceDate',
        'dueDate',
        'notes',
        'brandingSnapshot'
      ];
      const cleanData = whitelistFields(req.body, ALLOWED_FIELDS);

      // 1. Fetch Company Settings to determine home state & branding
      const company = await Company.findOne({ tenantId }).lean();
      const companyState = (company?.state || 'Tamil Nadu').trim().toLowerCase();
      const customerState = (cleanData.customerState || cleanData.customer?.address || 'Tamil Nadu').trim().toLowerCase();

      // 2. Subtotal calculation
      let subtotal = Number(cleanData.subtotal) || 0;
      if (!subtotal && cleanData.amount !== undefined) {
        subtotal = Number(cleanData.amount) || 0;
      }
      if (!subtotal && Array.isArray(cleanData.lineItems) && cleanData.lineItems.length > 0) {
        subtotal = cleanData.lineItems.reduce((acc, item) => acc + (Number(item.amount || (item.quantity * item.rate)) || 0), 0);
      }

      const discount = Math.max(0, Number(cleanData.discount) || 0);

      let totalAdditionalCharges = 0;
      const additionalCharges = Array.isArray(cleanData.additionalCharges) ? cleanData.additionalCharges : [];
      for (const chg of additionalCharges) {
        totalAdditionalCharges += Number(chg.amount) || 0;
      }

      const taxableAmount = Math.max(0, subtotal - discount + totalAdditionalCharges);

      // 3. GST Calculation & Split (CGST/SGST vs IGST)
      // Only apply GST if explicitly specified via gstRate or line items
      const gstRate = Number(cleanData.gstRate || 0);
      let gstType = 'NONE';
      let cgstRate = 0;
      let cgstAmount = 0;
      let sgstRate = 0;
      let sgstAmount = 0;
      let igstRate = 0;
      let igstAmount = 0;
      let taxAmount = 0;

      if (gstRate > 0) {
        // Compare states for Intra-state vs Inter-state GST
        if (companyState === customerState || !customerState) {
          gstType = 'CGST_SGST';
          cgstRate = gstRate / 2;
          sgstRate = gstRate / 2;
          cgstAmount = Math.round(taxableAmount * (cgstRate / 100) * 100) / 100;
          sgstAmount = Math.round(taxableAmount * (sgstRate / 100) * 100) / 100;
          taxAmount = Math.round((cgstAmount + sgstAmount) * 100) / 100;
        } else {
          gstType = 'IGST';
          igstRate = gstRate;
          igstAmount = Math.round(taxableAmount * (igstRate / 100) * 100) / 100;
          taxAmount = igstAmount;
        }
      }

      const finalAmount = Math.round((taxableAmount + taxAmount) * 100) / 100;
      const amountPaid = Math.max(0, Number(cleanData.amountPaid) || 0);
      const balanceDue = Math.max(0, finalAmount - amountPaid);

      let status = 'Unpaid';
      if (finalAmount > 0 && amountPaid >= finalAmount) {
        status = 'Paid';
      } else if (amountPaid > 0 && amountPaid < finalAmount) {
        status = 'Partially Paid';
      }

      // 4. Generate atomic invoice number
      const invoiceNumber = await sequenceService.getNextInvoiceNumber(tenantId, cleanData.bookingRef);

      // 5. Snapshot Company Branding
      let branding = cleanData.brandingSnapshot;
      if (!branding || !branding.companyName) {
        if (company) {
          branding = {
            companyName: company.name || company.legalName || 'MAK Tours & Travels',
            address: company.address || `${company.city || ''}, ${company.state || ''}`.trim(),
            gstin: company.gstin || '',
            pan: company.pan || '',
            phone: company.phone || '',
            email: company.email || '',
            logoUrl: company.branding?.logoUrl || ''
          };
        }
      }

      const customerObj = cleanData.customer || {
        name: cleanData.customerName || 'Valued Guest',
        email: cleanData.customerEmail || '',
        phone: cleanData.customerPhone || '',
        address: cleanData.customerState || ''
      };

      const newInvoice = new Invoice({
        tenantId,
        invoiceNumber,
        bookingRef: cleanData.bookingRef || '',
        bookingId: cleanData.bookingId || '',
        customer: customerObj,
        lineItems: Array.isArray(cleanData.lineItems) && cleanData.lineItems.length > 0
          ? cleanData.lineItems
          : [{ description: 'Travel Services', rate: subtotal || finalAmount, amount: subtotal || finalAmount }],
        subtotal,
        discount,
        additionalCharges,
        gstType,
        gstRate,
        cgstRate,
        cgstAmount,
        sgstRate,
        sgstAmount,
        igstRate,
        igstAmount,
        taxAmount,
        amount: finalAmount,
        amountPaid,
        balanceDue,
        status,
        invoiceDate: cleanData.invoiceDate || new Date().toISOString().split('T')[0],
        dueDate: cleanData.dueDate || '',
        brandingSnapshot: branding || {},
        notes: cleanData.notes || ''
      });

      // Post to general ledger (Debit: AR 1050, Credit: Sales 4010 + GST Output 2080)
      try {
        const jv = await postingService.postInvoice({
          tenantId,
          invoiceNumber,
          bookingRef: newInvoice.bookingRef,
          customerName: customerObj.name,
          subtotal: taxableAmount,
          taxAmount,
          totalAmount: finalAmount,
          date: newInvoice.invoiceDate,
          user: req.user
        });
        newInvoice.journalEntryNo = jv.entryNo;
      } catch (ledgerErr) {
        console.warn('[FinanceController] Ledger posting note on createInvoice:', ledgerErr.message);
      }

      await newInvoice.save();
      return res.status(201).json({ status: 'success', data: newInvoice });
    } catch (err) {
      next(err);
    }
  },

  // Cancel Invoice with Audit Trail and Ledger Reversal
  cancelInvoice: async (req, res, next) => {
    try {
      const tenantId = (req.tenantId || 'mak-tours').toLowerCase().trim();
      const tenantQuery = req.tenantQuery || buildTenantQuery(tenantId);
      const { id } = req.params;
      const { reason } = req.body;

      if (!reason || !reason.trim()) {
        return res.status(400).json({ status: 'error', message: 'Cancellation reason is required' });
      }

      const inv = await Invoice.findOne({
        ...tenantQuery,
        $or: [{ invoiceNumber: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }]
      });

      if (!inv) {
        return res.status(404).json({ status: 'error', message: 'Invoice not found' });
      }

      if (inv.status === 'Cancelled') {
        return res.status(400).json({ status: 'error', message: 'Invoice has already been cancelled' });
      }

      inv.status = 'Cancelled';
      inv.cancellationReason = reason.trim();
      inv.cancelledAt = new Date();
      inv.cancelledBy = req.user?.name || req.user?.email || 'Accountant';

      // Reverse posted ledger entry if one was created
      if (inv.journalEntryNo) {
        try {
          await postingService.reverseJournalEntry(
            tenantId,
            inv.journalEntryNo,
            `Invoice ${inv.invoiceNumber} cancelled: ${reason}`,
            req.user
          );
        } catch (revErr) {
          console.warn('[FinanceController] Ledger reversal note on cancelInvoice:', revErr.message);
        }
      }

      await inv.save();
      return res.status(200).json({ status: 'success', data: inv, message: 'Invoice cancelled successfully' });
    } catch (err) {
      next(err);
    }
  },

  // Issue Credit Note against Invoice
  createCreditNote: async (req, res, next) => {
    try {
      const tenantId = (req.tenantId || 'mak-tours').toLowerCase().trim();
      const tenantQuery = req.tenantQuery || buildTenantQuery(tenantId);
      const { id } = req.params;
      const { amount, reason } = req.body;

      const numAmount = Math.round(Number(amount) * 100) / 100;
      if (!numAmount || numAmount <= 0) {
        return res.status(400).json({ status: 'error', message: 'Valid credit note amount is required' });
      }

      const inv = await Invoice.findOne({
        ...tenantQuery,
        $or: [{ invoiceNumber: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }]
      });

      if (!inv) {
        return res.status(404).json({ status: 'error', message: 'Invoice not found' });
      }

      if (numAmount > inv.amount) {
        return res.status(400).json({
          status: 'error',
          message: `Credit note amount (₹${numAmount}) cannot exceed invoice total (₹${inv.amount})`
        });
      }

      const creditNoteNumber = await sequenceService.getNextCreditNoteNo(tenantId);

      // Post credit note to ledger (Debit: Revenue/GST, Credit: AR)
      let journalEntryNo = '';
      try {
        const jv = await postingService.postCreditNote({
          tenantId,
          creditNoteNumber,
          subtotal: numAmount,
          taxAmount: 0,
          totalAmount: numAmount,
          customerName: inv.customer?.name || 'Customer',
          reason: reason || 'Adjustment',
          user: req.user
        });
        journalEntryNo = jv.entryNo;
      } catch (cnErr) {
        console.warn('[FinanceController] Credit note ledger posting note:', cnErr.message);
      }

      inv.creditNotes.push({
        creditNoteNumber,
        reason: reason || 'Service rebate / credit adjustment',
        amount: numAmount,
        issuedAt: new Date(),
        issuedBy: req.user?.name || req.user?.email || 'Accountant',
        journalEntryNo
      });

      // Update remaining invoice balance
      inv.balanceDue = Math.max(0, inv.balanceDue - numAmount);
      await inv.save();

      return res.status(201).json({
        status: 'success',
        creditNoteNumber,
        data: inv,
        message: `Credit note #${creditNoteNumber} issued successfully for ₹${numAmount}`
      });
    } catch (err) {
      next(err);
    }
  },

  // Download Invoice as Professional PDF
  downloadInvoicePdf: async (req, res, next) => {
    try {
      const tenantId = (req.tenantId || 'mak-tours').toLowerCase().trim();
      const tenantQuery = req.tenantQuery || buildTenantQuery(tenantId);
      const { id } = req.params;

      let [inv, company] = await Promise.all([
        Invoice.findOne({
          ...tenantQuery,
          $or: [{ invoiceNumber: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { bookingRef: id }]
        }).lean(),
        Company.findOne({ tenantId }).lean()
      ]);

      // Always look for the corresponding booking to get complete operational/fleet/driver manifest details
      const booking = await Booking.findOne({
        ...tenantQuery,
        $or: [
          { id },
          { refId: id },
          { bookingNumber: id },
          { invoiceNumber: id },
          { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null },
          ...(inv?.bookingRef ? [{ bookingNumber: inv.bookingRef }, { refId: inv.bookingRef }, { id: inv.bookingRef }] : []),
          ...(inv?.bookingId ? [{ id: inv.bookingId }, { _id: inv.bookingId.match(/^[0-9a-fA-F]{24}$/) ? inv.bookingId : null }] : []),
          ...(inv?.invoiceNumber ? [{ invoiceNumber: inv.invoiceNumber }] : [])
        ]
      }).lean();

      if (!inv && !booking) {
        return res.status(404).json({ status: 'error', message: 'Invoice not found for this booking or identifier' });
      }

      // Extract comprehensive operational data if booking exists
      let tripDetails = null;
      if (booking) {
        const bInv = booking.invoice || {};
        const baseFare = Number(booking.fare || booking.pricing || booking.totalFare || booking.totalAmount || bInv.totalAmount || bInv.finalInvoiceTotal || (inv?.amount || 0));
        const advancePaid = Number(booking.advancePaid || booking.advancePayment || bInv.advancePaid || (inv?.amountPaid || 0));
        const balanceDue = booking.balanceAmount !== undefined && booking.balanceAmount !== null && !isNaN(Number(booking.balanceAmount))
          ? Math.max(0, Number(booking.balanceAmount))
          : Math.max(0, baseFare - advancePaid);
        const isCompleted = (booking.bookingStatus || '').toLowerCase() === 'completed' || (booking.tripStatus || '').toLowerCase() === 'completed';
        const invStatus = (inv?.status && inv.status !== 'Unpaid') ? inv.status : (bInv.status || (isCompleted && balanceDue <= 0 ? 'Paid' : (advancePaid > 0 ? 'Partially Paid' : 'Unpaid')));
        const invoiceNo = inv?.invoiceNumber || booking.invoiceNumber || bInv.invoiceNumber || `INV-${booking.bookingNumber || booking.refId || booking.id || 'BK'}`;

        const startOdo = Number(booking.startOdometer) || 0;
        const endOdo = Number(booking.endOdometer) || 0;
        const dist = booking.distanceTravelled !== undefined && booking.distanceTravelled !== null
          ? Number(booking.distanceTravelled)
          : (endOdo > startOdo ? endOdo - startOdo : (Number(booking.actualDistanceKm || booking.distanceKm) || 0));

        const ratePerKm = Number(booking.vehicleRatePerKm || 15);
        const vehicleName = booking.vehicleName || booking.assignedVehicle?.model || booking.assignedVehicle?.name || booking.vehicleReserved || 'Commercial Fleet Vehicle';
        const vehicleRegNo = booking.assignedVehicleReg || booking.assignedVehicle?.regNo || booking.vehicleRegNo || booking.vehicleId || 'TN 01 AB 4002';
        const driverName = booking.driverName || booking.assignedDriverName || booking.assignedDriver?.name || 'Murugan S';
        const driverPhone = booking.driverPhone || booking.assignedDriverPhone || booking.assignedDriver?.phone || '+91 98401 22334';
        const driverId = booking.driverId || booking.assignedDriverId || 'DRV-004';
        const fromLoc = booking.pickupLocation || booking.fromLocation || 'Chennai, Tamil Nadu';
        const toLoc = booking.destination || booking.dropLocation || booking.toLocation || 'Outstation Circuit';
        const journeyDate = booking.pickupDate || booking.travelDate || '';
        const journeyTime = booking.pickupTime || booking.journeyTime || '';
        const returnDate = booking.returnDate || '';
        const passengers = booking.passengers || booking.passengerCount || 1;
        const bookingType = booking.bookingType || booking.tripType || 'Round Trip';
        const packageName = booking.packageName || booking.packageTitle || '';

        tripDetails = {
          bookingId: booking.bookingNumber || booking.refId || booking.id,
          bookingType,
          packageName,
          fromLocation: fromLoc,
          toLocation: toLoc,
          route: `${fromLoc} to ${toLoc}`,
          journeyDate,
          journeyTime,
          returnDate,
          passengers,
          vehicleModel: vehicleName,
          vehicleRegNo,
          vehicleCategory: booking.vehicleCategory || booking.assignedVehicle?.category || 'Commercial AC Vehicle',
          driverName,
          driverPhone,
          driverId,
          startOdometer: startOdo,
          endOdometer: endOdo,
          distanceTravelled: dist,
          ratePerKm,
          paymentOption: booking.paymentOption || booking.paymentType || 'Pay on Departure',
          paymentStatus: booking.paymentStatus || 'Pending',
          advancePaid,
          balanceDue,
          totalFare: baseFare,
          tollExpenses: Number(booking.invoice?.tollCharges || 0),
          driverAllowance: Number(booking.driverCompensationAmount || booking.driverBaseTripPay || 0),
          fuelReimbursements: Number(booking.invoice?.fuelReimbursements || 0)
        };

        if (!inv) {
          const lineItems = (Array.isArray(bInv.items) && bInv.items.length > 0)
            ? bInv.items.map(it => ({
                description: it.description || 'Travel & Transport Service',
                sacCode: '996601',
                quantity: it.quantity || 1,
                rate: Number(it.amount || it.rate || baseFare),
                amount: Number(it.amount || baseFare),
                taxRate: 0
              }))
            : [
                {
                  description: `${bookingType} Passenger Transport: ${fromLoc} to ${toLoc}` +
                    (vehicleName ? ` (${vehicleName})` : '') +
                    (dist > 0 ? ` [${dist} km]` : ''),
                  sacCode: '996601',
                  quantity: 1,
                  rate: baseFare,
                  amount: baseFare,
                  taxRate: 0
                }
              ];

          // Add toll if explicitly tracked
          if (tripDetails.tollExpenses > 0) {
            lineItems.push({
              description: 'Fastag Electronic Toll & Parking Charges (At Actuals)',
              sacCode: '996601',
              quantity: 1,
              rate: tripDetails.tollExpenses,
              amount: tripDetails.tollExpenses,
              taxRate: 0
            });
          }

          inv = {
            tenantId,
            invoiceNumber: invoiceNo,
            bookingRef: booking.bookingNumber || booking.refId || booking.id,
            bookingId: String(booking._id || booking.id),
            customer: {
              name: booking.customerName || booking.fullName || bInv.customerName || 'Valued Guest',
              email: booking.email || booking.customerEmail || bInv.customerEmail || '',
              phone: booking.mobileNumber || booking.customerPhone || bInv.customerPhone || '',
              address: booking.pickupLocation || booking.fromLocation || 'Chennai, Tamil Nadu',
              gstin: booking.customerGstin || ''
            },
            lineItems,
            subtotal: baseFare,
            discount: 0,
            additionalCharges: [],
            gstType: 'NONE',
            gstRate: 0,
            taxAmount: 0,
            amount: baseFare,
            amountPaid: advancePaid,
            balanceDue,
            status: invStatus,
            invoiceDate: bInv.issueDate || (booking.completedAt ? new Date(booking.completedAt).toISOString().split('T')[0] : (booking.pickupDate || booking.travelDate || new Date().toISOString().split('T')[0])),
            dueDate: bInv.dueDate || booking.returnDate || booking.pickupDate || '',
            brandingSnapshot: {
              companyName: company?.name || company?.legalName || 'MAK Tours & Travels India Pvt. Ltd.',
              address: company?.address || '14/2 GST Road, Alandur, Chennai, Tamil Nadu - 600016',
              gstin: company?.gstin || '33AABCM9821K1ZZ',
              pan: company?.pan || 'AABCM1234F',
              phone: company?.phone || '+91 98401 11000',
              email: company?.email || 'accounts@maktours.com'
            },
            tripDetails,
            notes: booking.notes || booking.tripRemarks || 'Official Trip Invoice & Commercial Billing Statement. Thank you for choosing MAK Tours & Travels.'
          };
        } else {
          inv.tripDetails = tripDetails;
          if (!inv.brandingSnapshot) {
            inv.brandingSnapshot = {
              companyName: company?.name || company?.legalName || 'MAK Tours & Travels India Pvt. Ltd.',
              address: company?.address || '14/2 GST Road, Alandur, Chennai, Tamil Nadu - 600016',
              gstin: company?.gstin || '33AABCM9821K1ZZ',
              pan: company?.pan || 'AABCM1234F',
              phone: company?.phone || '+91 98401 11000',
              email: company?.email || 'accounts@maktours.com'
            };
          }
        }
      }

      const pdfBuffer = await generateInvoicePdfBuffer(inv, company || {});

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="Invoice-${inv.invoiceNumber || 'INV'}.pdf"`);
      return res.send(pdfBuffer);
    } catch (err) {
      next(err);
    }
  },

  // ==========================================================================
  // 4. PAYMENTS & OVERPAYMENT GUARDS (Transactions + Ledger Posting)
  // ==========================================================================

  // Get Payments
  getPayments: async (req, res, next) => {
    try {
      const tenantId = (req.tenantId || 'mak-tours').toLowerCase().trim();
      const tenantQuery = req.tenantQuery || buildTenantQuery(tenantId);
      const { bookingRef, status, paymentMethod } = req.query;
      const query = { ...tenantQuery };

      if (bookingRef) query.bookingRef = bookingRef;
      if (status) query.status = status;
      if (paymentMethod) query.paymentMethod = paymentMethod;

      const list = await Payment.find(query).sort({ createdAt: -1 }).lean();
      return res.status(200).json({ status: 'success', count: list.length, data: list });
    } catch (err) {
      next(err);
    }
  },

  // Create Payment with Overpayment Guard, Idempotency & Transactional Ledger Posting
  createPayment: async (req, res, next) => {
    try {
      const tenantId = (req.tenantId || 'mak-tours').toLowerCase().trim();
      const tenantQuery = req.tenantQuery || buildTenantQuery(tenantId);

      const ALLOWED_FIELDS = [
        'bookingRef',
        'userId',
        'orderId',
        'paymentId',
        'idempotencyKey',
        'signature',
        'amount',
        'currency',
        'status',
        'paymentMethod',
        'allowOverpayment',
        'isAdvance',
        'customerEmail',
        'customerPhone',
        'rawResponse'
      ];
      const cleanData = whitelistFields(req.body, ALLOWED_FIELDS);
      const idempotencyKey = (cleanData.idempotencyKey || req.headers?.['idempotency-key'] || '').trim();
      const cleanAmount = Math.round(Number(cleanData.amount) * 100) / 100;

      if (!cleanAmount || cleanAmount <= 0) {
        return res.status(400).json({ status: 'error', message: 'Payment amount must be greater than zero' });
      }

      // 1. Idempotency Check: Idempotency Key, PaymentId, or OrderId
      if (idempotencyKey) {
        const existingByKey = await Payment.findOne({ ...tenantQuery, idempotencyKey });
        if (existingByKey) {
          return res.status(200).json({
            status: 'success',
            message: 'Payment already recorded (idempotent response)',
            data: existingByKey
          });
        }
      }

      if (cleanData.paymentId && cleanData.paymentId.trim()) {
        const existingByPaymentId = await Payment.findOne({
          ...tenantQuery,
          paymentId: cleanData.paymentId.trim()
        });
        if (existingByPaymentId) {
          return res.status(200).json({
            status: 'success',
            message: 'Payment already recorded (idempotent response)',
            data: existingByPaymentId
          });
        }
      }

      if (cleanData.orderId && cleanData.orderId.trim()) {
        const existingByOrderId = await Payment.findOne({
          ...tenantQuery,
          orderId: cleanData.orderId.trim()
        });
        if (existingByOrderId) {
          return res.status(200).json({
            status: 'success',
            message: 'Payment already recorded (idempotent response)',
            data: existingByOrderId
          });
        }
      }

      // 2. Per-Booking Outstanding Calculation & Overpayment Guard
      let associatedBooking = null;
      if (cleanData.bookingRef) {
        associatedBooking = await Booking.findOne({
          ...tenantQuery,
          $or: [{ refId: cleanData.bookingRef }, { bookingNumber: cleanData.bookingRef }]
        });

        if (associatedBooking) {
          const fare = Number(associatedBooking.pricing || associatedBooking.totalFare || associatedBooking.fare || associatedBooking.totalAmount || 0);

          // Sum all captured/paid payments already recorded for this booking
          const existingPayments = await Payment.find({
            ...tenantQuery,
            bookingRef: cleanData.bookingRef,
            status: { $in: ['captured', 'paid'] }
          }).lean();

          const paymentsTotal = existingPayments.reduce((s, p) => s + (Number(p.amount) || 0), 0);
          const alreadyPaid = Math.max(paymentsTotal, Number(associatedBooking.advancePaid) || 0);
          const outstanding = associatedBooking.balanceDue !== undefined && associatedBooking.balanceDue >= 0
            ? Math.min(Number(associatedBooking.balanceDue), Math.max(0, fare - alreadyPaid))
            : Math.max(0, fare - alreadyPaid);

          // Guard: Reject amount > outstanding unless explicit advance / overpayment flag is set
          const isAllowedOverpayment = cleanData.allowOverpayment === true || cleanData.isAdvance === true;
          if (fare > 0 && cleanAmount > outstanding && !isAllowedOverpayment) {
            return res.status(400).json({
              status: 'error',
              code: 'OVERPAYMENT_REJECTED',
              message: `Payment amount of ₹${cleanAmount} exceeds outstanding balance of ₹${outstanding}. Explicit advance/overpayment flag required.`,
              outstanding,
              requested: cleanAmount
            });
          }
        }
      }

      // 3. Generate Sequences (Payment Ref & Official Receipt No)
      const paymentId = cleanData.paymentId || (await sequenceService.getNextPaymentRef(tenantId));
      const receiptNumber = await sequenceService.getNextReceiptNo(tenantId);
      const receiptDate = new Date().toISOString().split('T')[0];

      // Normalize Payment Method enum
      const rawMethod = String(cleanData.paymentMethod || '').toLowerCase();
      let normalizedMethod = 'Bank Transfer';
      if (rawMethod.includes('cash')) normalizedMethod = 'Cash';
      else if (rawMethod.includes('upi')) normalizedMethod = 'UPI';
      else if (rawMethod.includes('card')) normalizedMethod = 'Card';
      else if (rawMethod.includes('bank')) normalizedMethod = 'Bank Transfer';

      // 4. Session & Transaction Support (Used on Replica Sets in production; atomic sequential fallback in standalone test environments)
      const isReplicaSet = Boolean(
        mongoose.connection.client?.topology?.description?.type === 'ReplicaSetWithPrimary' ||
        mongoose.connection.client?.topology?.description?.type === 'Sharded' ||
        Boolean(mongoose.connection.replicaSetName)
      );

      const session = isReplicaSet ? await mongoose.startSession() : null;
      let inTxn = false;
      if (session) {
        try {
          await session.startTransaction();
          inTxn = true;
        } catch {
          inTxn = false;
        }
      }

      try {
        const sessionOpts = inTxn ? { session } : {};

        // A. Create Payment Record
        let newPayment;
        if (inTxn) {
          const docs = await Payment.create(
            [
              {
                ...cleanData,
                tenantId,
                paymentId,
                idempotencyKey,
                receiptNumber,
                receiptDate,
                paymentMethod: normalizedMethod,
                amount: cleanAmount,
                status: cleanData.status || 'captured'
              }
            ],
            sessionOpts
          );
          newPayment = docs[0];
        } else {
          newPayment = await Payment.create({
            ...cleanData,
            tenantId,
            paymentId,
            idempotencyKey,
            receiptNumber,
            receiptDate,
            paymentMethod: normalizedMethod,
            amount: cleanAmount,
            status: cleanData.status || 'captured'
          });
        }

        // B. Update Booking Balances & Payment Status
        if (associatedBooking && (newPayment.status === 'captured' || newPayment.status === 'paid')) {
          const fare = Number(associatedBooking.pricing || associatedBooking.totalFare || associatedBooking.fare || associatedBooking.totalAmount || 0);
          const newAdvance = (Number(associatedBooking.advancePaid) || 0) + cleanAmount;
          associatedBooking.advancePaid = newAdvance;
          associatedBooking.balanceDue = Math.max(0, fare - newAdvance);
          associatedBooking.balanceAmount = associatedBooking.balanceDue;

          if (associatedBooking.balanceDue === 0 && fare > 0) {
            associatedBooking.paymentStatus = 'paid';
          } else if (newAdvance > 0) {
            associatedBooking.paymentStatus = 'partial';
          }
          await associatedBooking.save(sessionOpts);
        }

        // C. Post to Ledger (Debit: Cash/Bank, Credit: Accounts Receivable)
        try {
          const jv = await postingService.postCustomerPayment(
            {
              tenantId,
              paymentId,
              amount: cleanAmount,
              date: receiptDate,
              paymentMethod: normalizedMethod,
              customerName: associatedBooking?.fullName || associatedBooking?.customerName || cleanData.customerEmail,
              bookingRef: cleanData.bookingRef,
              user: req.user
            },
            inTxn ? session : null
          );
          newPayment.journalEntryNo = jv.entryNo;
          await newPayment.save(sessionOpts);
        } catch (ledgerErr) {
          console.warn('[FinanceController] Ledger posting note on createPayment:', ledgerErr.message);
        }

        if (inTxn) {
          await session.commitTransaction();
        }

        return res.status(201).json({ status: 'success', data: newPayment });
      } catch (txnErr) {
        if (inTxn && session) {
          await session.abortTransaction();
        }
        throw txnErr;
      } finally {
        if (session) {
          await session.endSession();
        }
      }
    } catch (err) {
      next(err);
    }
  },

  // ==========================================================================
  // 5. RECEIVABLE MANAGEMENT & CUSTOMER LEDGER
  // ==========================================================================

  // Customer Ledger (Chronological Invoices, Collections & Running Balance)
  getCustomerLedger: async (req, res, next) => {
    try {
      const tenantId = (req.tenantId || 'mak-tours').toLowerCase().trim();
      const tenantQuery = req.tenantQuery || buildTenantQuery(tenantId);
      const { bookingRef, customerName, customerPhone } = req.query;

      const bookingQuery = { ...tenantQuery };
      const invoiceQuery = { ...tenantQuery };
      const paymentQuery = { ...tenantQuery };

      if (bookingRef) {
        bookingQuery.$or = [{ refId: bookingRef }, { bookingNumber: bookingRef }];
        invoiceQuery.bookingRef = bookingRef;
        paymentQuery.bookingRef = bookingRef;
      }

      // Fetch bookings, invoices, and payments
      const [bookings, invoices, payments] = await Promise.all([
        Booking.find(bookingQuery).lean(),
        Invoice.find(invoiceQuery).lean(),
        Payment.find(paymentQuery).lean()
      ]);

      const transactions = [];

      // Add Invoices as Debits
      for (const inv of invoices) {
        if (inv.status !== 'Cancelled') {
          transactions.push({
            date: inv.invoiceDate || inv.createdAt,
            type: 'INVOICE',
            refNo: inv.invoiceNumber,
            description: `Invoice for Booking #${inv.bookingRef || 'Direct'}`,
            debit: inv.amount || 0,
            credit: 0
          });
        }
      }

      // Add Booking Fares for bookings without invoices
      const invoicedRefs = new Set(invoices.map((i) => i.bookingRef).filter(Boolean));
      for (const b of bookings) {
        const ref = b.refId || b.bookingNumber;
        if (!invoicedRefs.has(ref) && b.status !== 'Cancelled') {
          const fare = Number(b.pricing || b.totalFare || b.fare || b.totalAmount || 0);
          transactions.push({
            date: b.travelDate || b.pickupDate || b.createdAt,
            type: 'BOOKING_FARE',
            refNo: ref,
            description: `Trip Booking: ${b.pickupCity || ''} to ${b.dropCity || ''}`,
            debit: fare,
            credit: 0
          });
        }
      }

      // Add Payments as Credits
      for (const p of payments) {
        if (p.status === 'captured' || p.status === 'paid') {
          transactions.push({
            date: p.receiptDate || p.createdAt,
            type: 'PAYMENT',
            refNo: p.receiptNumber || p.paymentId,
            description: `Collection via ${p.paymentMethod || 'Bank'} (#${p.bookingRef || ''})`,
            debit: 0,
            credit: p.amount || 0
          });
        }
      }

      // Sort Chronologically
      transactions.sort((a, b) => new Date(a.date) - new Date(b.date));

      // Compute Running Balance
      let runningBalance = 0;
      let totalBilled = 0;
      let totalPaid = 0;

      for (const tx of transactions) {
        totalBilled += tx.debit;
        totalPaid += tx.credit;
        runningBalance += tx.debit - tx.credit;
        tx.runningBalance = Math.round(runningBalance * 100) / 100;
      }

      return res.status(200).json({
        status: 'success',
        customer: {
          name: customerName || bookings[0]?.fullName || bookings[0]?.customerName || 'Customer',
          phone: customerPhone || bookings[0]?.mobileNumber || bookings[0]?.phone || ''
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

  // Booking-Wise Pending Receivable Report
  getReceivablePending: async (req, res, next) => {
    try {
      const tenantId = (req.tenantId || 'mak-tours').toLowerCase().trim();
      const tenantQuery = req.tenantQuery || buildTenantQuery(tenantId);

      const bookings = await Booking.find({
        ...tenantQuery,
        status: { $ne: 'Cancelled' },
        bookingStatus: { $ne: 'Cancelled' }
      }).lean();

      const pendingList = [];
      let totalOutstanding = 0;

      for (const b of bookings) {
        const fare = Number(b.pricing || b.totalFare || b.fare || b.totalAmount || 0);
        const advance = Number(b.advancePaid || 0);
        const balance = b.balanceDue !== undefined ? Number(b.balanceDue) : Math.max(0, fare - advance);

        if (balance > 0) {
          totalOutstanding += balance;
          const travelDate = b.travelDate || b.pickupDate || b.createdAt;
          const daysPending = Math.max(0, Math.floor((Date.now() - new Date(travelDate).getTime()) / (1000 * 60 * 60 * 24)));

          pendingList.push({
            bookingRef: b.refId || b.bookingNumber,
            customerName: b.fullName || b.customerName || 'Valued Guest',
            customerPhone: b.mobileNumber || b.phone || '',
            travelDate,
            totalFare: fare,
            advancePaid: advance,
            pendingBalance: balance,
            daysPending
          });
        }
      }

      pendingList.sort((a, b) => b.daysPending - a.daysPending);

      return res.status(200).json({
        status: 'success',
        totalOutstanding: Math.round(totalOutstanding * 100) / 100,
        count: pendingList.length,
        data: pendingList
      });
    } catch (err) {
      next(err);
    }
  },

  // Overdue Receivable List & Aging Summary (1-15, 16-30, 31-60, 60+ days)
  getReceivableOverdue: async (req, res, next) => {
    try {
      const tenantId = (req.tenantId || 'mak-tours').toLowerCase().trim();
      const tenantQuery = req.tenantQuery || buildTenantQuery(tenantId);

      const bookings = await Booking.find({
        ...tenantQuery,
        status: { $ne: 'Cancelled' },
        bookingStatus: { $ne: 'Cancelled' }
      }).lean();

      const agingBuckets = {
        '1-15': { count: 0, amount: 0 },
        '16-30': { count: 0, amount: 0 },
        '31-60': { count: 0, amount: 0 },
        '60+': { count: 0, amount: 0 }
      };

      const overdueList = [];
      const now = Date.now();

      for (const b of bookings) {
        const fare = Number(b.pricing || b.totalFare || b.fare || b.totalAmount || 0);
        const advance = Number(b.advancePaid || 0);
        const balance = b.balanceDue !== undefined ? Number(b.balanceDue) : Math.max(0, fare - advance);

        if (balance > 0) {
          const travelDate = new Date(b.travelDate || b.pickupDate || b.createdAt).getTime();
          const daysOverdue = Math.floor((now - travelDate) / (1000 * 60 * 60 * 24));

          if (daysOverdue > 0) {
            let bucket = '60+';
            if (daysOverdue <= 15) bucket = '1-15';
            else if (daysOverdue <= 30) bucket = '16-30';
            else if (daysOverdue <= 60) bucket = '31-60';

            agingBuckets[bucket].count += 1;
            agingBuckets[bucket].amount += balance;

            overdueList.push({
              bookingRef: b.refId || b.bookingNumber,
              customerName: b.fullName || b.customerName || 'Valued Guest',
              customerPhone: b.mobileNumber || b.phone || '',
              travelDate: b.travelDate || b.pickupDate || b.createdAt,
              totalFare: fare,
              advancePaid: advance,
              overdueBalance: balance,
              daysOverdue,
              bucket
            });
          }
        }
      }

      overdueList.sort((a, b) => b.daysOverdue - a.daysOverdue);

      return res.status(200).json({
        status: 'success',
        agingSummary: agingBuckets,
        count: overdueList.length,
        data: overdueList
      });
    } catch (err) {
      next(err);
    }
  },

  // Record In-App Payment Reminder Notification
  sendPaymentReminder: async (req, res, next) => {
    try {
      const tenantId = (req.tenantId || 'mak-tours').toLowerCase().trim();
      const { bookingRef, customerName, customerPhone, amount, notes } = req.body;

      if (!bookingRef || !amount) {
        return res.status(400).json({ status: 'error', message: 'Booking reference and amount are required' });
      }

      const notif = await Notification.create({
        tenantId,
        portal: 'accountant',
        title: `Payment Reminder: Booking #${bookingRef}`,
        description: `Payment reminder recorded for ${customerName || 'Customer'} (Ph: ${customerPhone || 'N/A'}) for outstanding ₹${amount}. ${notes || ''}`.trim(),
        category: 'Finance Reminder',
        priority: 'High',
        bookingId: bookingRef,
        actionUrl: `/accountant/receivable?bookingRef=${bookingRef}`,
        isRead: false,
        unread: true,
        timestamp: new Date().toISOString()
      });

      return res.status(201).json({
        status: 'success',
        message: 'Payment reminder recorded in company notification log',
        data: notif
      });
    } catch (err) {
      next(err);
    }
  }
};

export default financeController;