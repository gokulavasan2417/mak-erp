// MAK Tours & Travels ERP - Idempotent Chart of Accounts & Financial Year Seeder
import { Account } from '../models/Account.js';
import { FinancialYear } from '../models/FinancialYear.js';
import { CashBankAccount } from '../models/CashBankAccount.js';

export const STANDARD_ACCOUNTS = [
  // 1000 - 1999: ASSETS
  { code: '1010', name: 'Cash on Hand', type: 'asset', subType: 'cash', normalBalance: 'debit', isSystem: true, description: 'Petty cash and on-hand cash registers' },
  { code: '1020', name: 'Bank Accounts (HDFC / Primary)', type: 'asset', subType: 'bank', normalBalance: 'debit', isSystem: true, description: 'Primary corporate checking and operating bank accounts' },
  { code: '1030', name: 'UPI & Digital Collections', type: 'asset', subType: 'upi', normalBalance: 'debit', isSystem: true, description: 'Instant QR code, UPI, and payment gateway settlements in transit' },
  { code: '1050', name: 'Accounts Receivable (Customers)', type: 'asset', subType: 'receivable', normalBalance: 'debit', isSystem: true, description: 'Outstanding customer balances on completed & confirmed bookings' },
  { code: '1060', name: 'Driver Advances & Float', type: 'asset', subType: 'advance', normalBalance: 'debit', isSystem: true, description: 'Advances given to chauffeurs for fuel, tolls, and trip operations' },
  { code: '1070', name: 'Vendor Advances', type: 'asset', subType: 'advance', normalBalance: 'debit', isSystem: true, description: 'Advance deposits paid to vehicle attachment partners' },
  { code: '1080', name: 'GST Input Tax Credit', type: 'asset', subType: 'tax_credit', normalBalance: 'debit', isSystem: true, description: 'Eligible GST credits on fleet maintenance, office rent, and purchases' },
  { code: '1500', name: 'Vehicles & Fleet Assets', type: 'asset', subType: 'fixed_asset', normalBalance: 'debit', isSystem: true, description: 'Capitalized cost of company-owned fleet vehicles' },

  // 2000 - 2999: LIABILITIES
  { code: '2010', name: 'Accounts Payable (Trade Creditors)', type: 'liability', subType: 'payable', normalBalance: 'credit', isSystem: true, description: 'Bills due to parts, fuel, and service providers' },
  { code: '2020', name: 'Vendor Fleet Payables', type: 'liability', subType: 'payable', normalBalance: 'credit', isSystem: true, description: 'Payouts due to attached fleet vendors and vehicle owners' },
  { code: '2030', name: 'Driver Settlement Payables', type: 'liability', subType: 'payable', normalBalance: 'credit', isSystem: true, description: 'Settlement dues payable to drivers for trip batas and allowances' },
  { code: '2040', name: 'Salary & Wages Payable', type: 'liability', subType: 'payable', normalBalance: 'credit', isSystem: true, description: 'Accrued staff and administrative salary liabilities' },
  { code: '2050', name: 'Statutory Dues Payable (PF / ESI / PT)', type: 'liability', subType: 'statutory', normalBalance: 'credit', isSystem: true, description: 'Government withholdings (Provident Fund, ESI, Professional Tax, TDS)' },
  { code: '2060', name: 'Customer Advances & Unearned Revenue', type: 'liability', subType: 'unearned', normalBalance: 'credit', isSystem: true, description: 'Advance trip bookings received before journey completion' },
  { code: '2080', name: 'GST Output Tax Payable', type: 'liability', subType: 'tax_payable', normalBalance: 'credit', isSystem: true, description: 'CGST, SGST, and IGST collected on passenger transport services' },

  // 3000 - 3999: EQUITY
  { code: '3010', name: "Owner's Capital", type: 'equity', subType: 'capital', normalBalance: 'credit', isSystem: true, description: 'Initial promoter capital and injected business equity' },
  { code: '3020', name: 'Retained Earnings', type: 'equity', subType: 'retained_earnings', normalBalance: 'credit', isSystem: true, description: 'Cumulative profits retained in enterprise operations' },

  // 4000 - 4999: INCOME
  { code: '4010', name: 'Trip & Tour Package Revenue', type: 'income', subType: 'operating_revenue', normalBalance: 'credit', isSystem: true, description: 'Revenue earned from car rentals, intercity trips, and holiday packages' },
  { code: '4020', name: 'Corporate Vehicle Rental Revenue', type: 'income', subType: 'operating_revenue', normalBalance: 'credit', isSystem: true, description: 'Long-term corporate fleet lease contracts' },
  { code: '4030', name: 'Cancellation & Incidental Charges', type: 'income', subType: 'other_income', normalBalance: 'credit', isSystem: true, description: 'Cancellation fees, night holding fees, and additional service income' },

  // 5000 - 5999: EXPENSES
  { code: '5010', name: 'Fuel & Energy Expenses', type: 'expense', subType: 'direct_expense', normalBalance: 'debit', isSystem: true, description: 'Diesel, petrol, CNG, and EV charging costs for fleet' },
  { code: '5020', name: 'Toll & Fastag Charges', type: 'expense', subType: 'direct_expense', normalBalance: 'debit', isSystem: true, description: 'Highway tolls and electronic toll plaza deductions' },
  { code: '5030', name: 'Parking & State Permit Taxes', type: 'expense', subType: 'direct_expense', normalBalance: 'debit', isSystem: true, description: 'Interstate border permits, airport parking, and municipal entry taxes' },
  { code: '5040', name: 'Driver Trip Bata & Allowances', type: 'expense', subType: 'direct_expense', normalBalance: 'debit', isSystem: true, description: 'Trip allowances, night shift pay, food bata, and long-distance incentives' },
  { code: '5050', name: 'Vehicle Maintenance & Repairs', type: 'expense', subType: 'fleet_maintenance', normalBalance: 'debit', isSystem: true, description: 'Scheduled servicing, oil changes, tire replacements, and insurance' },
  { code: '5060', name: 'Vendor Fleet Hire Payouts', type: 'expense', subType: 'vendor_cost', normalBalance: 'debit', isSystem: true, description: 'Hiring cost of third-party vendor attached vehicles' },
  { code: '5070', name: 'Staff Salaries & Benefits', type: 'expense', subType: 'payroll', normalBalance: 'debit', isSystem: true, description: 'Monthly salaries, employer PF/ESI contributions, and staff welfare' },
  { code: '5080', name: 'Office & Administrative Expenses', type: 'expense', subType: 'admin_expense', normalBalance: 'debit', isSystem: true, description: 'Office rent, electricity, software subscriptions, and communications' },
  { code: '5090', name: 'Depreciation on Fleet Vehicles', type: 'expense', subType: 'depreciation', normalBalance: 'debit', isSystem: true, description: 'Quarterly wear and tear depreciation on motorized assets' }
];

/**
 * Idempotently seeds or updates the standard Chart of Accounts, active Financial Year,
 * and default Cash/Bank accounts for a tenant. Never deletes or mutates existing ledger balances.
 */
export async function seedChartOfAccounts(tenantId = 'mak-tours') {
  const normTenant = (tenantId || 'mak-tours').toLowerCase().trim();

  // 1. Seed Accounts
  const accountMap = new Map();
  for (const item of STANDARD_ACCOUNTS) {
    const acc = await Account.findOneAndUpdate(
      { tenantId: normTenant, code: item.code },
      {
        $setOnInsert: {
          tenantId: normTenant,
          code: item.code,
          name: item.name,
          type: item.type,
          subType: item.subType || '',
          normalBalance: item.normalBalance,
          isSystem: item.isSystem ?? true,
          description: item.description || ''
        }
      },
      { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
    );
    accountMap.set(item.code, acc);
  }

  // 2. Seed Default Financial Year (FY 2026-27: 2026-04-01 to 2027-03-31)
  const fy = await FinancialYear.findOneAndUpdate(
    { tenantId: normTenant, startDate: '2026-04-01', endDate: '2027-03-31' },
    {
      $setOnInsert: {
        tenantId: normTenant,
        name: 'FY 2026-27',
        startDate: '2026-04-01',
        endDate: '2027-03-31',
        status: 'open',
        isDefault: true,
        notes: 'Primary active fiscal period for MAK ERP operations'
      }
    },
    { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
  );

  // 3. Seed Default Cash and Bank Accounts
  const cashAcc = accountMap.get('1010');
  const bankAcc = accountMap.get('1020');
  const upiAcc = accountMap.get('1030');

  if (cashAcc) {
    await CashBankAccount.findOneAndUpdate(
      { tenantId: normTenant, accountName: 'Main Cash Drawer' },
      {
        $setOnInsert: {
          tenantId: normTenant,
          accountName: 'Main Cash Drawer',
          type: 'cash',
          accountType: 'cash',
          openingBalance: 15000,
          currentBalance: 15000,
          linkedLedgerAccountId: cashAcc._id,
          linkedLedgerAccountCode: cashAcc.code,
          isDefault: true,
          isActive: true
        }
      },
      { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
    );
  }

  if (bankAcc) {
    await CashBankAccount.findOneAndUpdate(
      { tenantId: normTenant, accountName: 'HDFC Bank Operating A/C' },
      {
        $setOnInsert: {
          tenantId: normTenant,
          accountName: 'HDFC Bank Operating A/C',
          type: 'bank',
          accountType: 'bank',
          bankName: 'HDFC Bank Ltd',
          accountNumber: '50200098401234',
          ifscCode: 'HDFC0001234',
          branch: 'Anna Salai, Chennai',
          openingBalance: 250000,
          currentBalance: 250000,
          linkedLedgerAccountId: bankAcc._id,
          linkedLedgerAccountCode: bankAcc.code,
          isDefault: true,
          isActive: true
        }
      },
      { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
    );
  }

  if (upiAcc) {
    await CashBankAccount.findOneAndUpdate(
      { tenantId: normTenant, accountName: 'Primary Fastag & UPI Desk' },
      {
        $setOnInsert: {
          tenantId: normTenant,
          accountName: 'Primary Fastag & UPI Desk',
          type: 'upi',
          accountType: 'upi',
          upiId: 'maktours@hdfcbank',
          openingBalance: 50000,
          currentBalance: 50000,
          linkedLedgerAccountId: upiAcc._id,
          linkedLedgerAccountCode: upiAcc.code,
          isDefault: false,
          isActive: true
        }
      },
      { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
    );
  }

  return {
    accountsCount: accountMap.size,
    financialYear: fy,
    status: 'success'
  };
}

export default {
  STANDARD_ACCOUNTS,
  seedChartOfAccounts
};
