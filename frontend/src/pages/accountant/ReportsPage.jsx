// MAK Tours & Travels ERP - Full Suite of 15 Financial & Compliance Reports
import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Calendar,
  Download,
  Printer,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  FileText,
  IndianRupee,
  Layers,
  Truck,
  Car,
  Compass,
  CreditCard,
  Banknote,
  TrendingUp,
  Receipt
} from 'lucide-react';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { accountantService } from '../../services/accountantService';
import { formatDateDMY, isDateLike } from '../../utils/dateUtils';

export function ReportsPage() {
  const [selectedReport, setSelectedReport] = useState('daily-income-expense');
  const [startDate, setStartDate] = useState('2026-11-01');
  const [endDate, setEndDate] = useState('2026-11-30');
  const [selectedYear, setSelectedYear] = useState('2026');
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState(null);

  const reportList = [
    { id: 'daily-income-expense', label: '1. Daily Income & Expense', icon: Calendar },
    { id: 'monthly-revenue-expense', label: '2. Monthly Revenue & Expense', icon: TrendingUp },
    { id: 'profit-loss', label: '3. Profit & Loss (P&L) Statement', icon: BarChart3 },
    { id: 'cash-flow', label: '4. Cash Flow Statement', icon: IndianRupee },
    { id: 'customer-outstanding', label: '5. Customer Outstanding Aging', icon: ClockIcon },
    { id: 'vendor-outstanding', label: '6. Vendor Outstanding Payables', icon: Truck },
    { id: 'driver-settlements', label: '7. Driver Settlements Summary', icon: Car },
    { id: 'payroll', label: '8. Payroll & Statutory Compliance (PF/ESI/TDS)', icon: Banknote },
    { id: 'gst', label: '9. GST Compliance & Tax Split', icon: FileText },
    { id: 'vehicle-profitability', label: '10. Vehicle Profitability', icon: Car },
    { id: 'tour-package-profitability', label: '11. Tour Package Profitability', icon: Compass },
    { id: 'booking-revenue', label: '12. Booking Revenue by Route', icon: Layers },
    { id: 'payment-collections', label: '13. Payment Collections by Mode', icon: CreditCard },
    { id: 'trial-balance', label: '14. Trial Balance (Debits == Credits)', icon: BookOpenIcon },
    { id: 'balance-sheet', label: '15. Balance Sheet (A = L + E)', icon: LandmarkIcon }
  ];

  function ClockIcon(props) { return <AlertCircle {...props} />; }
  function BookOpenIcon(props) { return <FileText {...props} />; }
  function LandmarkIcon(props) { return <IndianRupee {...props} />; }

  const fetchReport = async (repId, s, e, yr) => {
    setLoading(true);
    setReportData(null);
    try {
      let res = null;
      switch (repId) {
        case 'daily-income-expense':
          res = await accountantService.getDailyIncomeExpenseReport({ startDate: s, endDate: e });
          break;
        case 'monthly-revenue-expense':
          res = await accountantService.getMonthlyRevenueExpenseReport({ year: yr });
          break;
        case 'profit-loss':
          res = await accountantService.getProfitAndLossStatement({ startDate: s, endDate: e });
          break;
        case 'cash-flow':
          res = await accountantService.getCashFlowReport({ startDate: s, endDate: e });
          break;
        case 'customer-outstanding':
          res = await accountantService.getCustomerOutstandingAging();
          break;
        case 'vendor-outstanding':
          res = await accountantService.getVendorOutstandingPayables();
          break;
        case 'driver-settlements':
          res = await accountantService.getDriverSettlementsReport();
          break;
        case 'payroll':
          res = await accountantService.getPayrollComplianceReport();
          break;
        case 'gst':
          res = await accountantService.getGstComplianceReport({ startDate: s, endDate: e });
          break;
        case 'vehicle-profitability':
          res = await accountantService.getVehicleProfitabilityReport();
          break;
        case 'tour-package-profitability':
          res = await accountantService.getTourPackageProfitabilityReport();
          break;
        case 'booking-revenue':
          res = await accountantService.getBookingRevenueReport({ startDate: s, endDate: e });
          break;
        case 'payment-collections':
          res = await accountantService.getPaymentCollectionsReport({ startDate: s, endDate: e });
          break;
        case 'trial-balance':
          res = await accountantService.getTrialBalanceReport({ asOfDate: e });
          break;
        case 'balance-sheet':
          res = await accountantService.getBalanceSheetReport({ asOfDate: e });
          break;
        default:
          break;
      }
      setReportData(res?.data !== undefined ? res : null);
    } catch (err) {
      console.error('Error loading report:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport(selectedReport, startDate, endDate, selectedYear);
  }, [selectedReport, startDate, endDate, selectedYear]);

  const handleDownloadPdf = () => {
    const token = localStorage.getItem('mak_erp_auth_token');
    const url = `/api/reports/export/pdf?reportType=${selectedReport}&title=${encodeURIComponent(selectedReport.toUpperCase())}&token=${encodeURIComponent(token)}`;
    window.open(url, '_blank');
  };

  const handleDownloadExcel = () => {
    const token = localStorage.getItem('mak_erp_auth_token');
    const url = `/api/reports/export/excel?reportType=${selectedReport}&title=${encodeURIComponent(selectedReport.toUpperCase())}&token=${encodeURIComponent(token)}`;
    window.open(url, '_blank');
  };

  const currentRepMeta = reportList.find((r) => r.id === selectedReport);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* 1. Command Header Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          backgroundColor: '#ffffff',
          padding: '1.25rem 1.75rem',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                color: '#0284c7',
                backgroundColor: '#e0f2fe',
                padding: '0.2rem 0.55rem',
                borderRadius: '6px',
                textTransform: 'uppercase'
              }}
            >
              Enterprise Accounting Suite
            </span>
            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
              All 15 Certified Financial Reports
            </span>
          </div>
          <h1 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0f172a', margin: '0.35rem 0 0' }}>
            {currentRepMeta ? currentRepMeta.label : 'Financial Statements & Reports'}
          </h1>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Printer size={15} style={{ marginRight: '0.35rem' }} /> Print
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownloadPdf}>
            <Download size={15} style={{ marginRight: '0.35rem' }} /> PDF Download
          </Button>
          <Button variant="primary" size="sm" onClick={handleDownloadExcel}>
            <FileSpreadsheet size={15} style={{ marginRight: '0.35rem' }} /> Excel (.xlsx)
          </Button>
        </div>
      </div>

      {/* 2. Controls & Report Switcher */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          backgroundColor: '#ffffff',
          padding: '1rem 1.25rem',
          borderRadius: '12px',
          border: '1px solid #e2e8f0'
        }}
      >
        <div style={{ minWidth: '320px', flex: 1 }}>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', marginBottom: '0.25rem', textTransform: 'uppercase' }}>
            Select Financial Report
          </label>
          <select
            value={selectedReport}
            onChange={(e) => setSelectedReport(e.target.value)}
            style={{
              width: '100%',
              padding: '0.55rem 0.85rem',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              fontSize: '0.9rem',
              fontWeight: 700,
              backgroundColor: '#ffffff',
              color: '#0f172a'
            }}
          >
            {reportList.map((r) => (
              <option key={r.id} value={r.id}>{r.label}</option>
            ))}
          </select>
        </div>

        {selectedReport === 'monthly-revenue-expense' ? (
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', marginBottom: '0.25rem', textTransform: 'uppercase' }}>
              Fiscal Year
            </label>
            <input
              type="number"
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              style={{ padding: '0.45rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', fontWeight: 600 }}
            />
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.25rem' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                  From Date
                </label>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0284c7' }}>
                  ({formatDateDMY(startDate)})
                </span>
              </div>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                style={{ padding: '0.45rem 0.65rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
              />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.25rem' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                  To Date
                </label>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0284c7' }}>
                  ({formatDateDMY(endDate)})
                </span>
              </div>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                style={{ padding: '0.45rem 0.65rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
              />
            </div>
          </div>
        )}
      </div>

      {/* 3. Report Display */}
      <Card>
        <CardBody style={{ padding: '1.5rem' }}>
          {loading ? (
            <LoadingSpinner message="Calculating real-time financial figures & ledger balances..." />
          ) : !reportData ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
              No statement data generated for this period.
            </div>
          ) : (
            <div>
              {/* Report Header Block */}
              <div style={{ textAlign: 'center', marginBottom: '1.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  {reportData.report || currentRepMeta?.label}
                </h2>
                <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.25rem' }}>
                  Period: {formatDateDMY(startDate)} to {formatDateDMY(endDate)} • MAK Tours & Travels
                </div>
              </div>

              {/* Summary KPIs Row if summary present */}
              {reportData.summary && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                  {Object.entries(reportData.summary).map(([key, val]) => (
                    <div key={key} style={{ backgroundColor: '#f8fafc', padding: '0.85rem 1rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'capitalize' }}>
                        {key.replace(/([A-Z])/g, ' $1')}
                      </div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginTop: '0.25rem' }}>
                        {typeof val === 'number' ? `₹${val.toLocaleString('en-IN')}` : String(val)}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Data Table */}
              {Array.isArray(reportData.data || reportData.accounts || reportData.assets) ? (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #cbd5e1', color: '#0f172a' }}>
                        {Object.keys((reportData.data || reportData.accounts || reportData.assets)[0] || {}).map((headerKey) => (
                          <th key={headerKey} style={{ padding: '0.75rem 1rem', textTransform: 'capitalize' }}>
                            {headerKey.replace(/([A-Z])/g, ' $1')}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {(reportData.data || reportData.accounts || reportData.assets).map((row, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          {Object.entries(row).map(([key, cellVal], cIdx) => (
                            <td key={cIdx} style={{ padding: '0.75rem 1rem', color: typeof cellVal === 'number' ? '#0f172a' : '#334155', fontWeight: typeof cellVal === 'number' ? 600 : 400 }}>
                              {typeof cellVal === 'number'
                                ? `₹${cellVal.toLocaleString('en-IN')}`
                                : (isDateLike(key, cellVal) ? formatDateDMY(cellVal) : String(cellVal ?? '—'))
                              }
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <pre style={{ backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '8px', fontSize: '0.85rem', overflowX: 'auto' }}>
                  {JSON.stringify(reportData, null, 2)}
                </pre>
              )}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}

export default ReportsPage;
