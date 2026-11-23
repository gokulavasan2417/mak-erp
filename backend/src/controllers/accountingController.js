// MAK Tours & Travels ERP - Centralized Accounting & Financial Reports Controller
import mongoose from 'mongoose';
import { Account } from '../models/Account.js';
import { FinancialYear } from '../models/FinancialYear.js';
import { CashBankAccount } from '../models/CashBankAccount.js';
import { JournalEntry } from '../models/JournalEntry.js';
import { postingService } from '../services/postingService.js';
import { seedChartOfAccounts } from '../services/chartOfAccountsSeedService.js';
import { sequenceService } from '../services/sequenceService.js';
import { stripProtectedFields, whitelistFields } from '../utils/fieldHelper.js';
import { escapeRegex } from '../utils/escapeRegex.js';

export const accountingController = {
  // 1. Chart of Accounts - List
  getAccounts: async (req, res, next) => {
    try {
      const tenantId = (req.tenantId || 'mak-tours').toLowerCase().trim();
      const tenantQuery = req.tenantQuery || { tenantId };
      const { type, search, isActive } = req.query;

      const query = { ...tenantQuery };
      if (type && type !== 'all') query.type = type.toLowerCase();
      if (isActive !== undefined && isActive !== 'all') query.isActive = isActive === 'true';

      if (search && search.trim()) {
        const s = escapeRegex(search.trim());
        query.$or = [
          { code: { $regex: s, $options: 'i' } },
          { name: { $regex: s, $options: 'i' } },
          { subType: { $regex: s, $options: 'i' } }
        ];
      }

      let accounts = await Account.find(query).sort({ code: 1 }).lean();

      // If empty for tenant, seed default standard accounts automatically
      if (accounts.length === 0 && !search && !type) {
        await seedChartOfAccounts(tenantId);
        accounts = await Account.find(query).sort({ code: 1 }).lean();
      }

      return res.status(200).json({ status: 'success', count: accounts.length, data: accounts });
    } catch (err) {
      next(err);
    }
  },

  // 2. Chart of Accounts - Create Custom Account
  createAccount: async (req, res, next) => {
    try {
      const tenantId = (req.tenantId || 'mak-tours').toLowerCase().trim();
      const ALLOWED = ['code', 'name', 'type', 'subType', 'parent', 'normalBalance', 'description'];
      const data = whitelistFields(req.body, ALLOWED);

      if (!data.code || !data.name || !data.type) {
        return res.status(400).json({
          status: 'error',
          code: 'VALIDATION_ERROR',
          message: 'Account code, name, and type (asset/liability/equity/income/expense) are required'
        });
      }

      // Default normal balance based on account type
      if (!data.normalBalance) {
        data.normalBalance = (data.type === 'asset' || data.type === 'expense') ? 'debit' : 'credit';
      }

      const existing = await Account.findOne({ tenantId, code: String(data.code).trim() });
      if (existing) {
        return res.status(409).json({
          status: 'error',
          code: 'DUPLICATE_ACCOUNT_CODE',
          message: `Account with code '${data.code}' already exists in your company.`
        });
      }

      const account = await Account.create({
        ...data,
        tenantId,
        isSystem: false,
        isActive: true,
        createdBy: req.user?.name || req.user?.email || 'User'
      });

      return res.status(201).json({ status: 'success', data: account });
    } catch (err) {
      next(err);
    }
  },

  // 3. Financial Years - List & Manage
  getFinancialYears: async (req, res, next) => {
    try {
      const tenantId = (req.tenantId || 'mak-tours').toLowerCase().trim();
      const tenantQuery = req.tenantQuery || { tenantId };

      let years = await FinancialYear.find(tenantQuery).sort({ startDate: -1 }).lean();
      if (years.length === 0) {
        await seedChartOfAccounts(tenantId);
        years = await FinancialYear.find(tenantQuery).sort({ startDate: -1 }).lean();
      }

      return res.status(200).json({ status: 'success', data: years });
    } catch (err) {
      next(err);
    }
  },

  createFinancialYear: async (req, res, next) => {
    try {
      const tenantId = (req.tenantId || 'mak-tours').toLowerCase().trim();
      const { name, startDate, endDate, status = 'open', notes } = req.body;

      if (!name || !startDate || !endDate) {
        return res.status(400).json({
          status: 'error',
          message: 'Financial year name, startDate (YYYY-MM-DD), and endDate (YYYY-MM-DD) are required.'
        });
      }

      const fy = await FinancialYear.create({
        tenantId,
        name: name.trim(),
        startDate,
        endDate,
        status,
        notes: notes || '',
        createdBy: req.user?.name || req.user?.email || 'User'
      });

      return res.status(201).json({ status: 'success', data: fy });
    } catch (err) {
      next(err);
    }
  },

  // 4. Cash & Bank Accounts - List & Create
  getCashBankAccounts: async (req, res, next) => {
    try {
      const tenantId = (req.tenantId || 'mak-tours').toLowerCase().trim();
      const tenantQuery = req.tenantQuery || { tenantId };

      let accounts = await CashBankAccount.find(tenantQuery)
        .populate('linkedLedgerAccountId', 'code name type normalBalance')
        .sort({ isDefault: -1, accountName: 1 })
        .lean();

      if (accounts.length === 0) {
        await seedChartOfAccounts(tenantId);
        accounts = await CashBankAccount.find(tenantQuery)
          .populate('linkedLedgerAccountId', 'code name type normalBalance')
          .sort({ isDefault: -1, accountName: 1 })
          .lean();
      }

      return res.status(200).json({ status: 'success', data: accounts });
    } catch (err) {
      next(err);
    }
  },

  createCashBankAccount: async (req, res, next) => {
    try {
      const tenantId = (req.tenantId || 'mak-tours').toLowerCase().trim();
      const ALLOWED = ['accountName', 'type', 'accountNumber', 'bankName', 'ifscCode', 'branch', 'upiId', 'openingBalance', 'linkedLedgerAccountId'];
      const data = whitelistFields(req.body, ALLOWED);

      if (!data.accountName || !data.type || !data.linkedLedgerAccountId) {
        return res.status(400).json({
          status: 'error',
          message: 'accountName, type (cash/bank/upi), and linkedLedgerAccountId are required'
        });
      }

      const linkedAccount = await Account.findOne({ tenantId, _id: data.linkedLedgerAccountId });
      if (!linkedAccount) {
        return res.status(404).json({ status: 'error', message: 'Linked ledger account not found in your company' });
      }

      const openBal = Number(data.openingBalance) || 0;
      const newAcc = await CashBankAccount.create({
        ...data,
        tenantId,
        openingBalance: openBal,
        currentBalance: openBal,
        linkedLedgerAccountCode: linkedAccount.code,
        createdBy: req.user?.name || req.user?.email || 'User'
      });

      return res.status(201).json({ status: 'success', data: newAcc });
    } catch (err) {
      next(err);
    }
  },

  // 5. Journal Entries - List with Filters
  getJournalEntries: async (req, res, next) => {
    try {
      const tenantId = (req.tenantId || 'mak-tours').toLowerCase().trim();
      const tenantQuery = req.tenantQuery || { tenantId };
      const { startDate, endDate, sourceType, status, search, page = 1, limit = 50 } = req.query;

      const query = { ...tenantQuery };

      if (status && status !== 'all') query.status = status;
      if (sourceType && sourceType !== 'all') query.sourceType = sourceType;

      if (startDate && endDate) {
        query.date = { $gte: startDate, $lte: endDate };
      } else if (startDate) {
        query.date = { $gte: startDate };
      } else if (endDate) {
        query.date = { $lte: endDate };
      }

      if (search && search.trim()) {
        const s = escapeRegex(search.trim());
        query.$or = [
          { entryNo: { $regex: s, $options: 'i' } },
          { narration: { $regex: s, $options: 'i' } },
          { sourceId: { $regex: s, $options: 'i' } },
          { 'lines.accountName': { $regex: s, $options: 'i' } },
          { 'lines.accountCode': { $regex: s, $options: 'i' } }
        ];
      }

      const skip = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);
      const [entries, total] = await Promise.all([
        JournalEntry.find(query)
          .sort({ date: -1, createdAt: -1 })
          .skip(skip)
          .limit(parseInt(limit, 10))
          .lean(),
        JournalEntry.countDocuments(query)
      ]);

      return res.status(200).json({
        status: 'success',
        count: entries.length,
        total,
        page: parseInt(page, 10),
        pages: Math.ceil(total / parseInt(limit, 10)),
        data: entries
      });
    } catch (err) {
      next(err);
    }
  },

  // 6. Journal Entries - Get Single
  getJournalEntryById: async (req, res, next) => {
    try {
      const tenantId = (req.tenantId || 'mak-tours').toLowerCase().trim();
      const { id } = req.params;

      const entry = await JournalEntry.findOne({
        tenantId,
        $or: [{ entryNo: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }]
      }).lean();

      if (!entry) {
        return res.status(404).json({ status: 'error', message: 'Journal entry not found' });
      }

      return res.status(200).json({ status: 'success', data: entry });
    } catch (err) {
      next(err);
    }
  },

  // 7. Manual Journal Entry Creation
  createManualJournal: async (req, res, next) => {
    try {
      const tenantId = (req.tenantId || 'mak-tours').toLowerCase().trim();
      const { date, narration, lines } = req.body;

      if (!date || !narration || !Array.isArray(lines) || lines.length < 2) {
        return res.status(400).json({
          status: 'error',
          code: 'VALIDATION_ERROR',
          message: 'Date, narration, and at least 2 balanced journal lines are required'
        });
      }

      const dateStr = String(date).substring(0, 10);
      const accounts = await Account.find({ tenantId }).lean();
      const accMap = new Map(accounts.map((a) => [a._id.toString(), a]));
      const accCodeMap = new Map(accounts.map((a) => [a.code, a]));

      const resolvedLines = [];
      let totalDebit = 0;
      let totalCredit = 0;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        let acc = (line.account && accMap.get(String(line.account))) || (line.accountCode && accCodeMap.get(String(line.accountCode)));

        if (!acc) {
          return res.status(400).json({
            status: 'error',
            message: `Line ${i + 1}: Account not found in your company chart of accounts`
          });
        }

        const debit = Math.round((Number(line.debit) || 0) * 100) / 100;
        const credit = Math.round((Number(line.credit) || 0) * 100) / 100;

        if (debit < 0 || credit < 0) {
          return res.status(400).json({ status: 'error', message: `Line ${i + 1}: Negative amounts are forbidden` });
        }
        if ((debit > 0 && credit > 0) || (debit === 0 && credit === 0)) {
          return res.status(400).json({ status: 'error', message: `Line ${i + 1}: Exactly one side (Debit or Credit) must be entered` });
        }

        totalDebit += debit;
        totalCredit += credit;

        resolvedLines.push({
          account: acc._id,
          accountCode: acc.code,
          accountName: acc.name,
          debit,
          credit,
          narration: line.narration || ''
        });
      }

      totalDebit = Math.round(totalDebit * 100) / 100;
      totalCredit = Math.round(totalCredit * 100) / 100;

      if (Math.abs(totalDebit - totalCredit) >= 0.01) {
        return res.status(400).json({
          status: 'error',
          code: 'IMBALANCED_ENTRY',
          message: `Total debit (₹${totalDebit}) must equal total credit (₹${totalCredit}). Difference: ₹${Math.abs(totalDebit - totalCredit)}`
        });
      }

      const entryNo = await sequenceService.getNextJournalNo(tenantId);
      const fy = await FinancialYear.findOne({ tenantId, startDate: { $lte: dateStr }, endDate: { $gte: dateStr }, status: 'open' }).lean();

      const journal = await JournalEntry.create({
        tenantId,
        entryNo,
        date: dateStr,
        financialYearId: fy?._id || null,
        financialYearName: fy?.name || '',
        narration: narration.trim(),
        lines: resolvedLines,
        totalDebit,
        totalCredit,
        sourceType: 'manual_journal',
        sourceId: entryNo,
        status: 'posted',
        postedBy: req.user?.name || req.user?.email || 'User',
        createdBy: req.user?.name || req.user?.email || 'User'
      });

      return res.status(201).json({ status: 'success', data: journal });
    } catch (err) {
      next(err);
    }
  },

  // 8. Reverse Journal Entry
  reverseJournal: async (req, res, next) => {
    try {
      const tenantId = (req.tenantId || 'mak-tours').toLowerCase().trim();
      const { id } = req.params;
      const { reason = 'Entry reversed by Accountant' } = req.body;

      const result = await postingService.reverseJournalEntry(tenantId, id, reason, req.user);
      return res.status(200).json({
        status: 'success',
        message: `Journal entry '${id}' successfully reversed`,
        data: result
      });
    } catch (err) {
      next(err);
    }
  },

  // ============================================================================
  // ACCOUNTING REPORTS
  // ============================================================================

  // Report 1: Trial Balance
  getTrialBalance: async (req, res, next) => {
    try {
      const tenantId = (req.tenantId || 'mak-tours').toLowerCase().trim();
      const tenantQuery = req.tenantQuery || { tenantId };
      const { asOfDate, startDate, endDate } = req.query;

      const dateQuery = {};
      if (asOfDate) {
        dateQuery.date = { $lte: asOfDate };
      } else if (startDate && endDate) {
        dateQuery.date = { $gte: startDate, $lte: endDate };
      }

      // Fetch all accounts for tenant
      let accounts = await Account.find(tenantQuery).sort({ code: 1 }).lean();
      if (accounts.length === 0) {
        await seedChartOfAccounts(tenantId);
        accounts = await Account.find(tenantQuery).sort({ code: 1 }).lean();
      }

      // Aggregate journal entry lines for posted entries
      const pipeline = [
        { $match: { ...tenantQuery, status: 'posted', ...dateQuery } },
        { $unwind: '$lines' },
        {
          $group: {
            _id: '$lines.accountCode',
            accountName: { $first: '$lines.accountName' },
            totalDebit: { $sum: '$lines.debit' },
            totalCredit: { $sum: '$lines.credit' }
          }
        }
      ];

      const aggResults = await JournalEntry.aggregate(pipeline);
      const aggMap = new Map(aggResults.map((r) => [r._id, r]));

      let grandDebit = 0;
      let grandCredit = 0;

      const trialBalance = accounts.map((acc) => {
        const row = aggMap.get(acc.code) || { totalDebit: 0, totalCredit: 0 };
        const d = Math.round(row.totalDebit * 100) / 100;
        const c = Math.round(row.totalCredit * 100) / 100;

        let netDebit = 0;
        let netCredit = 0;

        if (acc.normalBalance === 'debit') {
          const bal = d - c;
          if (bal >= 0) netDebit = bal;
          else netCredit = Math.abs(bal);
        } else {
          const bal = c - d;
          if (bal >= 0) netCredit = bal;
          else netDebit = Math.abs(bal);
        }

        grandDebit += netDebit;
        grandCredit += netCredit;

        return {
          code: acc.code,
          name: acc.name,
          type: acc.type,
          normalBalance: acc.normalBalance,
          debit: Math.round(netDebit * 100) / 100,
          credit: Math.round(netCredit * 100) / 100
        };
      });

      grandDebit = Math.round(grandDebit * 100) / 100;
      grandCredit = Math.round(grandCredit * 100) / 100;
      const difference = Math.round(Math.abs(grandDebit - grandCredit) * 100) / 100;

      return res.status(200).json({
        status: 'success',
        asOfDate: asOfDate || endDate || new Date().toISOString().split('T')[0],
        totalDebit: grandDebit,
        totalCredit: grandCredit,
        difference,
        isBalanced: difference === 0,
        data: trialBalance
      });
    } catch (err) {
      next(err);
    }
  },

  // Report 2: General Ledger by Account
  getGeneralLedger: async (req, res, next) => {
    try {
      const tenantId = (req.tenantId || 'mak-tours').toLowerCase().trim();
      const tenantQuery = req.tenantQuery || { tenantId };
      const { accountCode, startDate, endDate } = req.query;

      if (!accountCode) {
        return res.status(400).json({ status: 'error', message: 'accountCode query parameter is required' });
      }

      const acc = await Account.findOne({ ...tenantQuery, code: accountCode }).lean();
      if (!acc) {
        return res.status(404).json({ status: 'error', message: `Account with code '${accountCode}' not found` });
      }

      // 1. Calculate Opening Balance before startDate
      let openingBalance = 0;
      if (startDate) {
        const openingAgg = await JournalEntry.aggregate([
          { $match: { ...tenantQuery, status: 'posted', date: { $lt: startDate } } },
          { $unwind: '$lines' },
          { $match: { 'lines.accountCode': accountCode } },
          {
            $group: {
              _id: null,
              totalDebit: { $sum: '$lines.debit' },
              totalCredit: { $sum: '$lines.credit' }
            }
          }
        ]);
        if (openingAgg.length > 0) {
          const { totalDebit = 0, totalCredit = 0 } = openingAgg[0];
          openingBalance = acc.normalBalance === 'debit' ? (totalDebit - totalCredit) : (totalCredit - totalDebit);
        }
      }

      // 2. Fetch Ledger movements within date range
      const matchRange = { ...tenantQuery, status: 'posted' };
      if (startDate && endDate) {
        matchRange.date = { $gte: startDate, $lte: endDate };
      } else if (startDate) {
        matchRange.date = { $gte: startDate };
      } else if (endDate) {
        matchRange.date = { $lte: endDate };
      }

      const entries = await JournalEntry.find({
        ...matchRange,
        'lines.accountCode': accountCode
      }).sort({ date: 1, createdAt: 1 }).lean();

      let running = openingBalance;
      const transactions = [];

      for (const entry of entries) {
        const matchedLines = entry.lines.filter((l) => l.accountCode === accountCode);
        for (const l of matchedLines) {
          const debit = Number(l.debit) || 0;
          const credit = Number(l.credit) || 0;

          if (acc.normalBalance === 'debit') {
            running += (debit - credit);
          } else {
            running += (credit - debit);
          }

          transactions.push({
            date: entry.date,
            entryNo: entry.entryNo,
            sourceType: entry.sourceType,
            sourceId: entry.sourceId,
            narration: l.narration || entry.narration,
            debit,
            credit,
            balance: Math.round(running * 100) / 100
          });
        }
      }

      return res.status(200).json({
        status: 'success',
        account: {
          code: acc.code,
          name: acc.name,
          type: acc.type,
          normalBalance: acc.normalBalance
        },
        period: { startDate: startDate || 'Beginning', endDate: endDate || 'Present' },
        openingBalance: Math.round(openingBalance * 100) / 100,
        closingBalance: Math.round(running * 100) / 100,
        transactions
      });
    } catch (err) {
      next(err);
    }
  },

  // Report 3: Profit & Loss Statement (Income Statement)
  getProfitAndLoss: async (req, res, next) => {
    try {
      const tenantId = (req.tenantId || 'mak-tours').toLowerCase().trim();
      const tenantQuery = req.tenantQuery || { tenantId };
      const { startDate, endDate } = req.query;

      const dateQuery = {};
      if (startDate && endDate) dateQuery.date = { $gte: startDate, $lte: endDate };
      else if (startDate) dateQuery.date = { $gte: startDate };
      else if (endDate) dateQuery.date = { $lte: endDate };

      // Aggregate all income & expense postings
      const pipeline = [
        { $match: { ...tenantQuery, status: 'posted', ...dateQuery } },
        { $unwind: '$lines' },
        {
          $group: {
            _id: '$lines.accountCode',
            accountName: { $first: '$lines.accountName' },
            totalDebit: { $sum: '$lines.debit' },
            totalCredit: { $sum: '$lines.credit' }
          }
        }
      ];

      const aggResults = await JournalEntry.aggregate(pipeline);
      const aggMap = new Map(aggResults.map((r) => [r._id, r]));

      const accounts = await Account.find({ ...tenantQuery, type: { $in: ['income', 'expense'] } }).sort({ code: 1 }).lean();

      let totalRevenue = 0;
      let totalDirectExpenses = 0;
      let totalIndirectExpenses = 0;

      const revenueLines = [];
      const directExpenseLines = [];
      const indirectExpenseLines = [];

      for (const acc of accounts) {
        const row = aggMap.get(acc.code) || { totalDebit: 0, totalCredit: 0 };
        const d = Number(row.totalDebit) || 0;
        const c = Number(row.totalCredit) || 0;

        if (acc.type === 'income') {
          const net = Math.round((c - d) * 100) / 100;
          totalRevenue += net;
          revenueLines.push({ code: acc.code, name: acc.name, amount: net });
        } else if (acc.type === 'expense') {
          const net = Math.round((d - c) * 100) / 100;
          if (acc.subType === 'direct_expense' || acc.code.startsWith('501') || acc.code.startsWith('502') || acc.code.startsWith('503') || acc.code.startsWith('504')) {
            totalDirectExpenses += net;
            directExpenseLines.push({ code: acc.code, name: acc.name, amount: net });
          } else {
            totalIndirectExpenses += net;
            indirectExpenseLines.push({ code: acc.code, name: acc.name, amount: net });
          }
        }
      }

      totalRevenue = Math.round(totalRevenue * 100) / 100;
      totalDirectExpenses = Math.round(totalDirectExpenses * 100) / 100;
      totalIndirectExpenses = Math.round(totalIndirectExpenses * 100) / 100;

      const grossProfit = Math.round((totalRevenue - totalDirectExpenses) * 100) / 100;
      const netProfit = Math.round((grossProfit - totalIndirectExpenses) * 100) / 100;

      return res.status(200).json({
        status: 'success',
        period: { startDate: startDate || 'Fiscal Start', endDate: endDate || 'Current Date' },
        revenue: { total: totalRevenue, lines: revenueLines },
        directExpenses: { total: totalDirectExpenses, lines: directExpenseLines },
        grossProfit,
        indirectExpenses: { total: totalIndirectExpenses, lines: indirectExpenseLines },
        netProfit,
        profitMargin: totalRevenue > 0 ? `${((netProfit / totalRevenue) * 100).toFixed(2)}%` : '0.00%'
      });
    } catch (err) {
      next(err);
    }
  },

  // Report 4: Balance Sheet
  getBalanceSheet: async (req, res, next) => {
    try {
      const tenantId = (req.tenantId || 'mak-tours').toLowerCase().trim();
      const tenantQuery = req.tenantQuery || { tenantId };
      const { asOfDate } = req.query;

      const targetDate = asOfDate || new Date().toISOString().split('T')[0];
      const dateQuery = { date: { $lte: targetDate } };

      const pipeline = [
        { $match: { ...tenantQuery, status: 'posted', ...dateQuery } },
        { $unwind: '$lines' },
        {
          $group: {
            _id: '$lines.accountCode',
            accountName: { $first: '$lines.accountName' },
            totalDebit: { $sum: '$lines.debit' },
            totalCredit: { $sum: '$lines.credit' }
          }
        }
      ];

      const aggResults = await JournalEntry.aggregate(pipeline);
      const aggMap = new Map(aggResults.map((r) => [r._id, r]));

      const accounts = await Account.find(tenantQuery).sort({ code: 1 }).lean();

      let totalAssets = 0;
      let totalLiabilities = 0;
      let totalEquity = 0;
      let netProfit = 0;

      const assetLines = [];
      const liabilityLines = [];
      const equityLines = [];

      for (const acc of accounts) {
        const row = aggMap.get(acc.code) || { totalDebit: 0, totalCredit: 0 };
        const d = Number(row.totalDebit) || 0;
        const c = Number(row.totalCredit) || 0;

        if (acc.type === 'asset') {
          const net = Math.round((d - c) * 100) / 100;
          totalAssets += net;
          assetLines.push({ code: acc.code, name: acc.name, subType: acc.subType, amount: net });
        } else if (acc.type === 'liability') {
          const net = Math.round((c - d) * 100) / 100;
          totalLiabilities += net;
          liabilityLines.push({ code: acc.code, name: acc.name, subType: acc.subType, amount: net });
        } else if (acc.type === 'equity') {
          const net = Math.round((c - d) * 100) / 100;
          totalEquity += net;
          equityLines.push({ code: acc.code, name: acc.name, subType: acc.subType, amount: net });
        } else if (acc.type === 'income') {
          netProfit += (c - d);
        } else if (acc.type === 'expense') {
          netProfit -= (d - c);
        }
      }

      netProfit = Math.round(netProfit * 100) / 100;
      // Net Profit rolls into Equity Retained Earnings
      totalEquity += netProfit;

      totalAssets = Math.round(totalAssets * 100) / 100;
      totalLiabilities = Math.round(totalLiabilities * 100) / 100;
      totalEquity = Math.round(totalEquity * 100) / 100;

      const totalLiabilitiesAndEquity = Math.round((totalLiabilities + totalEquity) * 100) / 100;
      const difference = Math.round(Math.abs(totalAssets - totalLiabilitiesAndEquity) * 100) / 100;

      return res.status(200).json({
        status: 'success',
        asOfDate: targetDate,
        assets: { total: totalAssets, lines: assetLines },
        liabilities: { total: totalLiabilities, lines: liabilityLines },
        equity: {
          total: totalEquity,
          netProfitYearToDate: netProfit,
          lines: equityLines
        },
        totalLiabilitiesAndEquity,
        isBalanced: difference === 0,
        difference
      });
    } catch (err) {
      next(err);
    }
  },

  // Report 5: Cash Flow Statement (Cash & Bank Movements)
  getCashFlow: async (req, res, next) => {
    try {
      const tenantId = (req.tenantId || 'mak-tours').toLowerCase().trim();
      const tenantQuery = req.tenantQuery || { tenantId };
      const { startDate, endDate } = req.query;

      const dateQuery = {};
      if (startDate && endDate) dateQuery.date = { $gte: startDate, $lte: endDate };
      else if (startDate) dateQuery.date = { $gte: startDate };
      else if (endDate) dateQuery.date = { $lte: endDate };

      // Cash accounts: 1010, 1020, 1030
      const cashCodes = ['1010', '1020', '1030'];

      // Opening Cash Balance
      let openingCash = 0;
      if (startDate) {
        const openingAgg = await JournalEntry.aggregate([
          { $match: { ...tenantQuery, status: 'posted', date: { $lt: startDate } } },
          { $unwind: '$lines' },
          { $match: { 'lines.accountCode': { $in: cashCodes } } },
          {
            $group: {
              _id: null,
              net: { $sum: { $subtract: ['$lines.debit', '$lines.credit'] } }
            }
          }
        ]);
        if (openingAgg.length > 0) openingCash = Number(openingAgg[0].net) || 0;
      }

      // Cash Inflows and Outflows by Source Type in period
      const flowAgg = await JournalEntry.aggregate([
        { $match: { ...tenantQuery, status: 'posted', ...dateQuery } },
        { $unwind: '$lines' },
        { $match: { 'lines.accountCode': { $in: cashCodes } } },
        {
          $group: {
            _id: '$sourceType',
            inflow: { $sum: '$lines.debit' },
            outflow: { $sum: '$lines.credit' }
          }
        }
      ]);

      let operatingInflow = 0;
      let operatingOutflow = 0;
      let investingInflow = 0;
      let investingOutflow = 0;
      let financingInflow = 0;
      let financingOutflow = 0;

      for (const item of flowAgg) {
        const inf = Number(item.inflow) || 0;
        const out = Number(item.outflow) || 0;

        if (['customer_payment', 'expense_payment', 'salary_payment', 'driver_settlement', 'vendor_payment'].includes(item._id)) {
          operatingInflow += inf;
          operatingOutflow += out;
        } else if (item._id === 'fixed_asset_purchase' || item._id === 'vehicle_purchase') {
          investingOutflow += out;
          investingInflow += inf;
        } else {
          financingInflow += inf;
          financingOutflow += out;
        }
      }

      const netOperating = Math.round((operatingInflow - operatingOutflow) * 100) / 100;
      const netInvesting = Math.round((investingInflow - investingOutflow) * 100) / 100;
      const netFinancing = Math.round((financingInflow - financingOutflow) * 100) / 100;

      const netCashChange = Math.round((netOperating + netInvesting + netFinancing) * 100) / 100;
      const closingCash = Math.round((openingCash + netCashChange) * 100) / 100;

      return res.status(200).json({
        status: 'success',
        period: { startDate: startDate || 'Period Start', endDate: endDate || 'Period End' },
        openingCashBalance: Math.round(openingCash * 100) / 100,
        operatingActivities: { inflow: operatingInflow, outflow: operatingOutflow, net: netOperating },
        investingActivities: { inflow: investingInflow, outflow: investingOutflow, net: netInvesting },
        financingActivities: { inflow: financingInflow, outflow: financingOutflow, net: netFinancing },
        netCashChange,
        closingCashBalance: closingCash
      });
    } catch (err) {
      next(err);
    }
  }
};

export default accountingController;
