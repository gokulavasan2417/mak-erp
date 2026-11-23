// MAK Tours & Travels ERP - Finance & Payments Data

export const expenseCategories = [
  'All Categories',
  'Fuel',
  'Toll',
  'Parking',
  'Driver Allowance',
  'Vehicle Maintenance',
  'Hotel Expenses',
  'Food Expenses',
  'Vendor Charges',
  'Office Expenses',
  'Other Expenses'
];

export const paymentMethods = [
  'All Methods',
  'UPI / QR',
  'NEFT / RTGS',
  'Credit Card',
  'Debit Card',
  'Cash',
  'Corporate Ledger'
];

export const initialPayments = [];

export const initialInvoices = [];

export const initialExpenses = [];

export const financeKPIs = {
  totalRevenue: 0,
  totalRevenueChange: '0%',
  totalExpenses: 0,
  totalExpensesChange: '0%',
  outstandingPayments: 0,
  outstandingCount: 0,
  vendorPayables: 0,
  vendorPayablesCount: 0,
  netProfit: 0,
  netProfitMargin: '0%'
};
