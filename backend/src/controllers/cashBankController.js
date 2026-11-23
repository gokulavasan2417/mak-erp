// MAK Tours & Travels ERP - Cash & Bank Management Controller
// Handles Cashbook, Deposits, Withdrawals, Inter-Account Transfers & Bank Reconciliation
import mongoose from 'mongoose';
import { CashBankAccount } from '../models/CashBankAccount.js';
import { CashBankTransaction } from '../models/CashBankTransaction.js';
import { Account } from '../models/Account.js';
import { JournalEntry } from '../models/JournalEntry.js';
import { sequenceService } from '../services/sequenceService.js';
import { seedChartOfAccounts } from '../services/chartOfAccountsSeedService.js';
import { escapeRegex } from '../utils/escapeRegex.js';

export const cashBankController = {
  // 1. List Cash/Bank/UPI Accounts with Balances
  getAccounts: async (req, res, next) => {
    try {
      const tenantId = (req.tenantId || 'mak-tours').toLowerCase().trim();
      let accounts = await CashBankAccount.find({ tenantId }).lean();

      if (!accounts || accounts.length === 0) {
        await seedChartOfAccounts(tenantId);
        accounts = await CashBankAccount.find({ tenantId }).lean();
      }

      return res.status(200).json({ status: 'success', count: accounts.length, data: accounts });
    } catch (err) {
      next(err);
    }
  },

  // 2. Chronological Cashbook / Bank Book with Daily Running Balances
  getCashbook: async (req, res, next) => {
    try {
      const tenantId = (req.tenantId || 'mak-tours').toLowerCase().trim();
      const tenantQuery = req.tenantQuery || { tenantId };
      const { accountId, startDate, endDate } = req.query;

      const query = { ...tenantQuery };
      if (accountId) {
        query.$or = [
          { accountId },
          { fromAccountId: accountId },
          { toAccountId: accountId }
        ];
      }

      if (startDate || endDate) {
        query.date = {};
        if (startDate) query.date.$gte = startDate;
        if (endDate) query.date.$lte = endDate;
      }

      const txns = await CashBankTransaction.find(query).sort({ date: 1, createdAt: 1 }).lean();

      let targetAccount = null;
      if (accountId) {
        targetAccount = await CashBankAccount.findOne({
          tenantId,
          $or: [{ _id: accountId.match(/^[0-9a-fA-F]{24}$/) ? accountId : null }, { accountName: accountId }]
        }).lean();
      }

      let openingBalance = targetAccount ? Number(targetAccount.openingBalance || 0) : 0;
      let runningBalance = openingBalance;
      let totalDeposits = 0;
      let totalWithdrawals = 0;

      const transactionsWithBalance = txns.map((t) => {
        let isDeposit = t.type === 'deposit';
        let isWithdrawal = t.type === 'withdrawal';

        if (t.type === 'transfer' && accountId) {
          if (String(t.toAccountId) === String(targetAccount?._id)) isDeposit = true;
          else if (String(t.fromAccountId) === String(targetAccount?._id)) isWithdrawal = true;
        }

        if (isDeposit) {
          totalDeposits += t.amount;
          runningBalance += t.amount;
        } else if (isWithdrawal) {
          totalWithdrawals += t.amount;
          runningBalance -= t.amount;
        }

        return {
          ...t,
          isDeposit,
          isWithdrawal,
          runningBalance: Math.round(runningBalance * 100) / 100
        };
      });

      return res.status(200).json({
        status: 'success',
        account: targetAccount || { accountName: 'All Accounts' },
        summary: {
          openingBalance: Math.round(openingBalance * 100) / 100,
          totalDeposits: Math.round(totalDeposits * 100) / 100,
          totalWithdrawals: Math.round(totalWithdrawals * 100) / 100,
          closingBalance: Math.round(runningBalance * 100) / 100
        },
        count: transactionsWithBalance.length,
        data: transactionsWithBalance
      });
    } catch (err) {
      next(err);
    }
  },

  // 3. Record Deposit (Increments Balance & Posts to Ledger)
  recordDeposit: async (req, res, next) => {
    try {
      const tenantId = (req.tenantId || 'mak-tours').toLowerCase().trim();
      const { accountId, amount, date, reference, narration } = req.body;

      const numAmount = Math.round(Number(amount) * 100) / 100;
      if (!numAmount || numAmount <= 0) {
        return res.status(400).json({ status: 'error', message: 'Valid deposit amount greater than zero is required' });
      }

      const account = await CashBankAccount.findOne({
        tenantId,
        $or: [{ _id: accountId?.match?.(/^[0-9a-fA-F]{24}$/) ? accountId : null }, { accountName: accountId }]
      });

      if (!account) {
        return res.status(404).json({ status: 'error', message: 'Cash or bank account not found' });
      }

      const txnNo = await sequenceService.getNextCashBankTxnNo(tenantId);
      const effectiveDate = date || new Date().toISOString().split('T')[0];

      // Update account current balance
      account.currentBalance = Math.round(((account.currentBalance || 0) + numAmount) * 100) / 100;
      await account.save();

      // Post Double-Entry Journal Entry (Debit Bank/Cash, Credit Capital / Direct Inflow 3010)
      let journalEntryNo = '';
      try {
        const jvNo = await sequenceService.getNextJournalNo(tenantId);
        const assetCode = account.accountType === 'cash' ? '1010' : account.accountType === 'upi' ? '1030' : '1020';
        const [assetAcc, capAcc] = await Promise.all([
          Account.findOne({ tenantId, code: assetCode }).lean(),
          Account.findOne({ tenantId, code: '3010' }).lean()
        ]);

        if (assetAcc && capAcc) {
          const jv = new JournalEntry({
            tenantId,
            entryNo: jvNo,
            date: effectiveDate,
            narration: narration || `Deposit to ${account.accountName}: ₹${numAmount}`,
            lines: [
              { account: assetAcc._id, accountCode: assetAcc.code, accountName: assetAcc.name, debit: numAmount, credit: 0 },
              { account: capAcc._id, accountCode: capAcc.code, accountName: capAcc.name, debit: 0, credit: numAmount }
            ],
            totalDebit: numAmount,
            totalCredit: numAmount,
            sourceType: 'manual_journal',
            sourceId: txnNo,
            status: 'posted',
            postedBy: req.user?.name || req.user?.email || 'Accountant'
          });
          await jv.save();
          journalEntryNo = jv.entryNo;
        }
      } catch (jvErr) {
        console.warn('[CashBankController] Journal posting note on deposit:', jvErr.message);
      }

      const txn = new CashBankTransaction({
        tenantId,
        txnNo,
        accountId: account._id,
        accountName: account.accountName,
        accountType: account.accountType,
        type: 'deposit',
        amount: numAmount,
        date: effectiveDate,
        reference: reference || '',
        narration: narration || `Deposit into ${account.accountName}`,
        journalEntryNo
      });

      await txn.save();

      return res.status(201).json({
        status: 'success',
        message: `Deposit of ₹${numAmount} into ${account.accountName} recorded successfully`,
        data: txn,
        updatedBalance: account.currentBalance
      });
    } catch (err) {
      next(err);
    }
  },

  // 4. Record Cash/Bank Withdrawal
  recordWithdrawal: async (req, res, next) => {
    try {
      const tenantId = (req.tenantId || 'mak-tours').toLowerCase().trim();
      const { accountId, amount, date, reference, narration } = req.body;

      const numAmount = Math.round(Number(amount) * 100) / 100;
      if (!numAmount || numAmount <= 0) {
        return res.status(400).json({ status: 'error', message: 'Valid withdrawal amount greater than zero is required' });
      }

      const account = await CashBankAccount.findOne({
        tenantId,
        $or: [{ _id: accountId?.match?.(/^[0-9a-fA-F]{24}$/) ? accountId : null }, { accountName: accountId }]
      });

      if (!account) {
        return res.status(404).json({ status: 'error', message: 'Account not found' });
      }

      if (numAmount > account.currentBalance) {
        return res.status(400).json({
          status: 'error',
          code: 'INSUFFICIENT_BALANCE',
          message: `Withdrawal amount of ₹${numAmount} exceeds available balance of ₹${account.currentBalance}`
        });
      }

      const txnNo = await sequenceService.getNextCashBankTxnNo(tenantId);
      const effectiveDate = date || new Date().toISOString().split('T')[0];

      account.currentBalance = Math.round((account.currentBalance - numAmount) * 100) / 100;
      await account.save();

      // Post Double-Entry Journal Entry (Debit Petty Cash 1010 or Drawings 3020, Credit Bank 1020)
      let journalEntryNo = '';
      try {
        const jvNo = await sequenceService.getNextJournalNo(tenantId);
        const assetCode = account.accountType === 'cash' ? '1010' : account.accountType === 'upi' ? '1030' : '1020';
        const [assetAcc, cashAcc] = await Promise.all([
          Account.findOne({ tenantId, code: assetCode }).lean(),
          Account.findOne({ tenantId, code: '1010' }).lean()
        ]);

        if (assetAcc && cashAcc) {
          const jv = new JournalEntry({
            tenantId,
            entryNo: jvNo,
            date: effectiveDate,
            narration: narration || `Cash withdrawal from ${account.accountName}: ₹${numAmount}`,
            lines: [
              { account: cashAcc._id, accountCode: cashAcc.code, accountName: cashAcc.name, debit: numAmount, credit: 0 },
              { account: assetAcc._id, accountCode: assetAcc.code, accountName: assetAcc.name, debit: 0, credit: numAmount }
            ],
            totalDebit: numAmount,
            totalCredit: numAmount,
            sourceType: 'manual_journal',
            sourceId: txnNo,
            status: 'posted',
            postedBy: req.user?.name || req.user?.email || 'Accountant'
          });
          await jv.save();
          journalEntryNo = jv.entryNo;
        }
      } catch (jvErr) {
        console.warn('[CashBankController] Journal posting note on withdrawal:', jvErr.message);
      }

      const txn = new CashBankTransaction({
        tenantId,
        txnNo,
        accountId: account._id,
        accountName: account.accountName,
        accountType: account.accountType,
        type: 'withdrawal',
        amount: numAmount,
        date: effectiveDate,
        reference: reference || '',
        narration: narration || `Withdrawal from ${account.accountName}`,
        journalEntryNo
      });

      await txn.save();

      return res.status(201).json({
        status: 'success',
        message: `Withdrawal of ₹${numAmount} from ${account.accountName} recorded successfully`,
        data: txn,
        updatedBalance: account.currentBalance
      });
    } catch (err) {
      next(err);
    }
  },

  // 5. Inter-Account Transfer (e.g. Bank to UPI or Bank to Cash)
  recordTransfer: async (req, res, next) => {
    try {
      const tenantId = (req.tenantId || 'mak-tours').toLowerCase().trim();
      const { fromAccountId, toAccountId, amount, date, reference, narration } = req.body;

      const numAmount = Math.round(Number(amount) * 100) / 100;
      if (!numAmount || numAmount <= 0) {
        return res.status(400).json({ status: 'error', message: 'Valid transfer amount greater than zero is required' });
      }

      if (!fromAccountId || !toAccountId) {
        return res.status(400).json({ status: 'error', message: 'Source and destination accounts are required' });
      }

      if (fromAccountId === toAccountId) {
        return res.status(400).json({ status: 'error', message: 'Source and destination accounts must be different' });
      }

      const [fromAcc, toAcc] = await Promise.all([
        CashBankAccount.findOne({
          tenantId,
          $or: [{ _id: fromAccountId.match?.(/^[0-9a-fA-F]{24}$/) ? fromAccountId : null }, { accountName: fromAccountId }]
        }),
        CashBankAccount.findOne({
          tenantId,
          $or: [{ _id: toAccountId.match?.(/^[0-9a-fA-F]{24}$/) ? toAccountId : null }, { accountName: toAccountId }]
        })
      ]);

      if (!fromAcc || !toAcc) {
        return res.status(404).json({ status: 'error', message: 'One or both cash/bank accounts not found' });
      }

      if (numAmount > fromAcc.currentBalance) {
        return res.status(400).json({
          status: 'error',
          code: 'INSUFFICIENT_BALANCE',
          message: `Transfer amount (₹${numAmount}) exceeds source account balance (₹${fromAcc.currentBalance})`
        });
      }

      const txnNo = await sequenceService.getNextCashBankTxnNo(tenantId);
      const effectiveDate = date || new Date().toISOString().split('T')[0];

      // Update Balances
      fromAcc.currentBalance = Math.round((fromAcc.currentBalance - numAmount) * 100) / 100;
      toAcc.currentBalance = Math.round((toAcc.currentBalance + numAmount) * 100) / 100;
      await Promise.all([fromAcc.save(), toAcc.save()]);

      // Post Double-Entry Contra Journal Entry (Debit Destination, Credit Source)
      let journalEntryNo = '';
      try {
        const jvNo = await sequenceService.getNextJournalNo(tenantId);
        const fromCode = fromAcc.accountType === 'cash' ? '1010' : fromAcc.accountType === 'upi' ? '1030' : '1020';
        const toCode = toAcc.accountType === 'cash' ? '1010' : toAcc.accountType === 'upi' ? '1030' : '1020';

        const [fromLedger, toLedger] = await Promise.all([
          Account.findOne({ tenantId, code: fromCode }).lean(),
          Account.findOne({ tenantId, code: toCode }).lean()
        ]);

        if (fromLedger && toLedger) {
          const jv = new JournalEntry({
            tenantId,
            entryNo: jvNo,
            date: effectiveDate,
            narration: narration || `Transfer: ₹${numAmount} from ${fromAcc.accountName} to ${toAcc.accountName}`,
            lines: [
              { account: toLedger._id, accountCode: toLedger.code, accountName: toLedger.name, debit: numAmount, credit: 0 },
              { account: fromLedger._id, accountCode: fromLedger.code, accountName: fromLedger.name, debit: 0, credit: numAmount }
            ],
            totalDebit: numAmount,
            totalCredit: numAmount,
            sourceType: 'manual_journal',
            sourceId: txnNo,
            status: 'posted',
            postedBy: req.user?.name || req.user?.email || 'Accountant'
          });
          await jv.save();
          journalEntryNo = jv.entryNo;
        }
      } catch (jvErr) {
        console.warn('[CashBankController] Journal posting note on transfer:', jvErr.message);
      }

      const txn = new CashBankTransaction({
        tenantId,
        txnNo,
        accountId: fromAcc._id,
        accountName: fromAcc.accountName,
        accountType: fromAcc.accountType,
        type: 'transfer',
        fromAccountId: fromAcc._id,
        fromAccountName: fromAcc.accountName,
        toAccountId: toAcc._id,
        toAccountName: toAcc.accountName,
        amount: numAmount,
        date: effectiveDate,
        reference: reference || '',
        narration: narration || `Inter-account transfer from ${fromAcc.accountName} to ${toAcc.accountName}`,
        journalEntryNo
      });

      await txn.save();

      return res.status(201).json({
        status: 'success',
        message: `Transfer of ₹${numAmount} from ${fromAcc.accountName} to ${toAcc.accountName} completed successfully`,
        data: txn,
        fromAccountBalance: fromAcc.currentBalance,
        toAccountBalance: toAcc.currentBalance
      });
    } catch (err) {
      next(err);
    }
  },

  // 6. Bank Reconciliation Status View
  getReconciliation: async (req, res, next) => {
    try {
      const tenantId = (req.tenantId || 'mak-tours').toLowerCase().trim();
      const tenantQuery = req.tenantQuery || { tenantId };
      const { accountId, matched, startDate, endDate } = req.query;

      const query = { ...tenantQuery };
      if (accountId) query.accountId = accountId;
      if (matched !== undefined) query.matched = matched === 'true';
      if (startDate || endDate) {
        query.date = {};
        if (startDate) query.date.$gte = startDate;
        if (endDate) query.date.$lte = endDate;
      }

      const transactions = await CashBankTransaction.find(query).sort({ date: -1, createdAt: -1 }).lean();

      let matchedTotal = 0;
      let unmatchedTotal = 0;
      let matchedCount = 0;
      let unmatchedCount = 0;

      for (const t of transactions) {
        if (t.matched) {
          matchedCount += 1;
          matchedTotal += t.amount;
        } else {
          unmatchedCount += 1;
          unmatchedTotal += t.amount;
        }
      }

      return res.status(200).json({
        status: 'success',
        summary: {
          matchedCount,
          matchedTotal: Math.round(matchedTotal * 100) / 100,
          unmatchedCount,
          unmatchedTotal: Math.round(unmatchedTotal * 100) / 100
        },
        count: transactions.length,
        data: transactions
      });
    } catch (err) {
      next(err);
    }
  },

  // 7. Mark Statement Line Matched / Unmatched (Reconciliation Action)
  matchTransaction: async (req, res, next) => {
    try {
      const tenantId = (req.tenantId || 'mak-tours').toLowerCase().trim();
      const tenantQuery = req.tenantQuery || { tenantId };
      const { id } = req.params;
      const { matched = true, notes } = req.body;

      const txn = await CashBankTransaction.findOne({
        ...tenantQuery,
        $or: [{ txnNo: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }]
      });

      if (!txn) {
        return res.status(404).json({ status: 'error', message: 'Transaction record not found' });
      }

      txn.matched = Boolean(matched);
      txn.reconciledAt = matched ? new Date() : null;
      txn.reconciledBy = matched ? (req.user?.name || req.user?.email || 'Accountant') : '';
      if (notes) txn.reconciliationNotes = notes;

      await txn.save();

      return res.status(200).json({
        status: 'success',
        message: `Transaction ${txn.txnNo} marked as ${txn.matched ? 'MATCHED' : 'UNMATCHED'}`,
        data: txn
      });
    } catch (err) {
      next(err);
    }
  }
};

export default cashBankController;