// MAK Tours & Travels ERP - Advanced Automatic Payroll Routes
import { Router } from 'express';
import { payrollController } from '../controllers/payrollController.js';
import { resolveTenant } from '../middleware/tenantMiddleware.js';
import { requireAuth, requirePermission } from '../middleware/authMiddleware.js';

const router = Router();

router.use(requireAuth, resolveTenant);

// Dynamic Salary Management & Revision History
router.put('/employees/:id/salary', requirePermission('payroll.manage'), payrollController.updateSalary);
router.get('/employees/:id/salary-history', requirePermission('payroll.view'), payrollController.getSalaryHistory);

// Accountant View & Analytics
router.get('/accounting/summary', requirePermission('payroll.view'), payrollController.getAccountingSummary);
router.get('/accounting/disbursements', requirePermission('payroll.view'), payrollController.getAccountingDisbursements);

// Payroll calculation & management
router.post('/calculate', requirePermission('payroll.manage'), payrollController.calculateMonthlyPayroll);
router.get('/', requirePermission('payroll.view'), payrollController.getAll);
router.get('/policy', requirePermission('payroll.view'), payrollController.getPolicy);
router.put('/policy', requirePermission('payroll.manage'), payrollController.updatePolicy);
router.get('/:id', requirePermission('payroll.view'), payrollController.getById);
router.put('/:id/approve', requirePermission('payroll.manage'), payrollController.approve);
router.post('/:id/payments', requirePermission('payments.manage'), payrollController.recordPayment);
router.get('/:id/slip', requirePermission('payroll.view'), payrollController.getSalarySlip);

export default router;
