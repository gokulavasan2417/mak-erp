// MAK Tours & Travels ERP - Employees & Staff Management (Modern Cards Design)
import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  UserCheck,
  Calendar,
  Clock,
  Plus,
  Search,
  Download,
  Mail,
  Phone,
  Briefcase,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  LayoutGrid,
  List,
  MapPin,
  ArrowRight,
  ChevronRight,
  ExternalLink,
  DollarSign,
  Award,
  Banknote,
  Edit3,
  Trash2,
  ShieldAlert,
  Building2,
  Filter
} from 'lucide-react';
import { Card, CardHeader, CardBody } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Modal } from '../../../components/ui/Modal';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { EmployeeAvatar } from '../../../components/common/EmployeeAvatar';
import { useAdminData } from '../../../context/AdminDataContext';
import { departments, mockAttendanceRecords } from '../../../data';

export function EmployeeList() {
  const navigate = useNavigate();
  const { employees = [], staffAttendance = [], addEmployee, updateEmployee, deleteEmployee } = useAdminData();

  const [activeTab, setActiveTab] = useState('directory'); // 'directory' or 'attendance'
  const [viewMode, setViewMode] = useState('grid'); // 'grid' (default modern cards) or 'table'
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  // Selected employee for detailed modal inspection
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  // Add Employee Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [employeeCode, setEmployeeCode] = useState('');
  const [role, setRole] = useState('');
  const [department, setDepartment] = useState('Operations & Dispatch');
  const [phone, setPhone] = useState('+91 ');
  const [email, setEmail] = useState('');
  const [shift, setShift] = useState('General (09:30 - 18:30)');
  const [salary, setSalary] = useState(45000);
  const [salaryCategory, setSalaryCategory] = useState('Category A');
  const [status, setStatus] = useState('Active');
  const [address, setAddress] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [isSubmittingCreate, setIsSubmittingCreate] = useState(false);

  // Edit Employee Modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [editName, setEditName] = useState('');
  const [editEmployeeCode, setEditEmployeeCode] = useState('');
  const [editRole, setEditRole] = useState('');
  const [editDepartment, setEditDepartment] = useState('Operations & Dispatch');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editShift, setEditShift] = useState('General (09:30 - 18:30)');
  const [editSalary, setEditSalary] = useState(45000);
  const [editStatus, setEditStatus] = useState('Active');
  const [editAddress, setEditAddress] = useState('');
  const [editEmergencyContact, setEditEmergencyContact] = useState('');
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

  // Delete Confirmation Modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingEmployee, setDeletingEmployee] = useState(null);
  const [deleteBlockedReason, setDeleteBlockedReason] = useState(null);
  const [isSubmittingDelete, setIsSubmittingDelete] = useState(false);

  // Filtered employees
  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      const empName = emp.fullName || emp.name || '';
      const empCode = emp.employeeCode || emp.code || emp.id || '';
      const empRole = emp.role || emp.designation || '';
      const empEmail = emp.email || '';
      const empPhone = emp.phone || '';

      const matchSearch =
        searchTerm === '' ||
        empName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        empCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        empRole.toLowerCase().includes(searchTerm.toLowerCase()) ||
        empEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
        empPhone.includes(searchTerm);

      const matchDept =
        departmentFilter === 'All' ||
        departmentFilter === 'All Departments' ||
        emp.department === departmentFilter;

      const matchStatus =
        statusFilter === 'All' ||
        statusFilter === 'All Statuses' ||
        (emp.status || 'Active') === statusFilter;

      return matchSearch && matchDept && matchStatus;
    });
  }, [employees, searchTerm, departmentFilter, statusFilter]);

  const todayStr = useMemo(() => new Date().toISOString().substring(0, 10), []);

  // Real today's attendance resolver: Strictly avoids automatic marking!
  // If admin has NOT marked attendance in the Attendance page for today, it returns 'Not Marked'.
  const getEmployeeTodayAttendance = useCallback(
    (emp) => {
      if (!emp) return 'Not Marked';
      const norm = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      const empCodes = [
        norm(emp.id),
        norm(emp.code),
        norm(emp.employeeCode),
        norm(emp._id),
        norm(emp.driverId)
      ].filter(Boolean);
      const empNames = [norm(emp.fullName), norm(emp.name)].filter(Boolean);

      // Find matching record on today's date from staffAttendance
      const record = (staffAttendance || []).find((a) => {
        if (a.date !== todayStr) return false;
        const aCodes = [norm(a.employeeId), norm(a.employeeCode), norm(a.driverId)].filter(Boolean);
        const aNames = [norm(a.employeeName)].filter(Boolean);
        const codeMatch = empCodes.some((c) => aCodes.some((ac) => ac === c || ac.endsWith(c) || c.endsWith(ac)));
        const nameMatch = empNames.some((n) => aNames.some((an) => an === n));
        return codeMatch || nameMatch;
      });

      if (record) {
        return record.status;
      }

      // Check if backend resolved real attendance (e.g. from server Attendance collection)
      if (emp.attendanceToday && emp.attendanceToday !== 'Present' && emp.attendanceToday !== 'Absent') {
        return emp.attendanceToday;
      }

      return 'Not Marked';
    },
    [staffAttendance, todayStr]
  );

  // Aggregates: Core Employee & Roster Metrics (Present Today / On Leave are not mandatory on Employee page)
  const activeStaffCount = employees.filter((e) => (e.status || 'Active') === 'Active').length;
  const totalDepartments = new Set(employees.map((e) => e.department).filter(Boolean)).size || (departments.length > 1 ? departments.length - 1 : 6);
  const totalPayroll = employees.reduce((sum, e) => sum + Number(e.monthlySalary || e.salary || 0), 0);

  const handleOpenModal = () => {
    setName('');
    setEmployeeCode('');
    setRole('');
    setDepartment('Operations & Dispatch');
    setPhone('+91 ');
    setEmail('');
    setShift('General (09:30 - 18:30)');
    setSalary(45000);
    setStatus('Active');
    setAddress('');
    setEmergencyContact('');
    setIsModalOpen(true);
  };

  const handleCreateEmployee = async (e) => {
    e.preventDefault();
    if (!name.trim() || !role.trim() || !phone.trim()) return;

    setIsSubmittingCreate(true);
    try {
      await addEmployee({
        name: name.trim(),
        fullName: name.trim(),
        employeeCode: employeeCode.trim() || undefined,
        role: role.trim(),
        designation: role.trim(),
        department,
        phone: phone.trim(),
        email: email.trim(),
        shift,
        salary: Number(salary) || 45000,
        monthlySalary: Number(salary) || 45000,
        baseSalary: Number(salary) || 45000,
        salaryCategory,
        status,
        address: address.trim(),
        emergencyContact: emergencyContact.trim(),
        avatar: name.trim().substring(0, 2).toUpperCase(),
        joiningDate: new Date().toISOString().substring(0, 10)
      });
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingCreate(false);
    }
  };

  const handleOpenEditModal = (emp) => {
    setEditingEmployee(emp);
    setEditName(emp.fullName || emp.name || '');
    setEditEmployeeCode(emp.employeeCode || emp.code || emp.id || '');
    setEditRole(emp.role || emp.designation || '');
    setEditDepartment(emp.department || 'Operations & Dispatch');
    setEditPhone(emp.phone || '');
    setEditEmail(emp.email || '');
    setEditShift(emp.shift || 'General (09:30 - 18:30)');
    setEditSalary(Number(emp.monthlySalary || emp.salary || 45000));
    setEditStatus(emp.status || 'Active');
    setEditAddress(emp.address || '');
    setEditEmergencyContact(emp.emergencyContact || '');
    setIsEditModalOpen(true);
  };

  const handleUpdateEmployee = async (e) => {
    e.preventDefault();
    if (!editName.trim() || !editRole.trim() || !editPhone.trim() || !editingEmployee) return;

    setIsSubmittingEdit(true);
    try {
      const targetId = editingEmployee.id || editingEmployee.employeeCode || editingEmployee._id;
      const updatedData = {
        name: editName.trim(),
        fullName: editName.trim(),
        employeeCode: editEmployeeCode.trim() || undefined,
        role: editRole.trim(),
        designation: editRole.trim(),
        department: editDepartment,
        phone: editPhone.trim(),
        email: editEmail.trim(),
        shift: editShift,
        salary: Number(editSalary) || 45000,
        monthlySalary: Number(editSalary) || 45000,
        baseSalary: Number(editSalary) || 45000,
        status: editStatus,
        address: editAddress.trim(),
        emergencyContact: editEmergencyContact.trim()
      };

      await updateEmployee(targetId, updatedData);
      setIsEditModalOpen(false);

      if (selectedEmployee && (selectedEmployee.id === targetId || selectedEmployee.code === targetId || selectedEmployee.employeeCode === targetId)) {
        setSelectedEmployee((prev) => ({
          ...prev,
          ...updatedData
        }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  const handleOpenDeleteModal = (emp) => {
    setDeletingEmployee(emp);
    setDeleteBlockedReason(null);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingEmployee) return;
    setIsSubmittingDelete(true);
    try {
      const targetId = deletingEmployee.id || deletingEmployee.employeeCode || deletingEmployee._id;
      await deleteEmployee(targetId);
      setIsDeleteModalOpen(false);
      setDeletingEmployee(null);
      if (selectedEmployee && (selectedEmployee.id === targetId || selectedEmployee.employeeCode === targetId)) {
        setSelectedEmployee(null);
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Deletion blocked by database safety checks.';
      setDeleteBlockedReason(msg);
    } finally {
      setIsSubmittingDelete(false);
    }
  };

  const handleDeactivateInstead = async () => {
    if (!deletingEmployee) return;
    setIsSubmittingDelete(true);
    try {
      const targetId = deletingEmployee.id || deletingEmployee.employeeCode || deletingEmployee._id;
      await updateEmployee(targetId, { status: 'Inactive' });
      setIsDeleteModalOpen(false);
      setDeletingEmployee(null);
      if (selectedEmployee && (selectedEmployee.id === targetId || selectedEmployee.employeeCode === targetId)) {
        setSelectedEmployee((prev) => ({ ...prev, status: 'Inactive' }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingDelete(false);
    }
  };

  const getDeptColor = (dept) => {
    switch (dept) {
      case 'Operations & Dispatch':
        return { bg: '#eef2ff', text: '#2C3480', border: '#c7d2fe' };
      case 'Finance & Accounts':
        return { bg: '#f0fdf4', text: '#16a34a', border: '#bbf7d0' };
      case 'Fleet Logistics':
        return { bg: '#eff6ff', text: '#2563eb', border: '#bfdbfe' };
      case 'Tour Packages & Sales':
        return { bg: '#fdf4ff', text: '#9333ea', border: '#f5d0fe' };
      case 'IT & Engineering':
        return { bg: '#fff7ed', text: '#ea580c', border: '#fed7aa' };
      default:
        return { bg: '#f1f5f9', text: '#475569', border: '#e2e8f0' };
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Header Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          backgroundColor: '#ffffff',
          padding: '1.25rem 1.5rem',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
            Employee & Operations Staff Management
          </h1>
          <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0.25rem 0 0' }}>
            Dispatchers, fleet superintendents, tour consultants, payroll & shift attendance
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {/* View Mode Switcher */}
          <div style={{ display: 'flex', border: '1px solid #cbd5e1', borderRadius: '8px', overflow: 'hidden' }}>
            <button
              onClick={() => setViewMode('grid')}
              title="Modern Cards View"
              style={{
                padding: '0.5rem 0.8rem',
                border: 'none',
                backgroundColor: viewMode === 'grid' ? '#2C3480' : '#ffffff',
                color: viewMode === 'grid' ? '#ffffff' : '#64748b',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                fontSize: '0.8rem',
                fontWeight: 600
              }}
            >
              <LayoutGrid size={15} /> Cards
            </button>
            <button
              onClick={() => setViewMode('table')}
              title="Table View"
              style={{
                padding: '0.5rem 0.8rem',
                border: 'none',
                backgroundColor: viewMode === 'table' ? '#2C3480' : '#ffffff',
                color: viewMode === 'table' ? '#ffffff' : '#64748b',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                fontSize: '0.8rem',
                fontWeight: 600
              }}
            >
              <List size={15} /> Table
            </button>
          </div>

          <Button
            variant="outline"
            onClick={() => navigate('/admin/attendance')}
            style={{ fontWeight: 700, borderColor: '#C7D2FE', color: '#2C3480', backgroundColor: '#EEF0FD' }}
          >
            <Clock size={15} style={{ marginRight: '0.35rem' }} /> Attendance Register &rarr;
          </Button>

          <Button
            variant="outline"
            onClick={() => navigate('/admin/payroll')}
            style={{ fontWeight: 700, borderColor: '#C7D2FE', color: '#2C3480', backgroundColor: '#EEF0FD' }}
          >
            <Banknote size={15} style={{ marginRight: '0.35rem' }} /> Payroll System &rarr;
          </Button>

          <Button
            variant="primary"
            style={{ backgroundColor: '#2C3480' }}
            onClick={handleOpenModal}
          >
            <Plus size={16} style={{ marginRight: '0.35rem' }} /> Add Staff Member
          </Button>
        </div>
      </div>

      {/* KPI Cards: Focused on Workforce Roster & Directory (Present Today / On Leave are handled on Attendance Register) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        <div style={{ backgroundColor: '#ffffff', padding: '1.15rem', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b' }}>TOTAL STAFF</span>
            <div style={{ padding: '0.4rem', borderRadius: '8px', backgroundColor: '#eef2ff', color: '#2C3480' }}>
              <Users size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0f172a', marginTop: '0.4rem' }}>
            {employees.length}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
            Enrolled across all departments
          </div>
        </div>

        <div style={{ backgroundColor: '#ffffff', padding: '1.15rem', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b' }}>ACTIVE ON ROSTER</span>
            <div style={{ padding: '0.4rem', borderRadius: '8px', backgroundColor: '#f0fdf4', color: '#16a34a' }}>
              <ShieldCheck size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#16a34a', marginTop: '0.4rem' }}>
            {activeStaffCount}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#16a34a', marginTop: '0.25rem' }}>
            Active operational personnel
          </div>
        </div>

        <div style={{ backgroundColor: '#ffffff', padding: '1.15rem', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b' }}>DEPARTMENTS</span>
            <div style={{ padding: '0.4rem', borderRadius: '8px', backgroundColor: '#eff6ff', color: '#2563eb' }}>
              <Building2 size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#2563eb', marginTop: '0.4rem' }}>
            {totalDepartments}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
            Operational business units
          </div>
        </div>

        <div style={{ backgroundColor: '#ffffff', padding: '1.15rem', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b' }}>MONTHLY PAYROLL</span>
            <div style={{ padding: '0.4rem', borderRadius: '8px', backgroundColor: '#fff7ed', color: '#ea580c' }}>
              <Briefcase size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0f172a', marginTop: '0.4rem' }}>
            ₹{totalPayroll.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
            Gross base remuneration
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>
        <button
          onClick={() => setActiveTab('directory')}
          style={{
            padding: '0.6rem 1.2rem',
            borderRadius: '8px',
            border: 'none',
            backgroundColor: activeTab === 'directory' ? '#2C3480' : 'transparent',
            color: activeTab === 'directory' ? '#ffffff' : '#64748b',
            fontWeight: 700,
            fontSize: '0.875rem',
            cursor: 'pointer'
          }}
        >
          Staff Directory ({employees.length})
        </button>

        <button
          onClick={() => setActiveTab('attendance')}
          style={{
            padding: '0.6rem 1.2rem',
            borderRadius: '8px',
            border: 'none',
            backgroundColor: activeTab === 'attendance' ? '#2C3480' : 'transparent',
            color: activeTab === 'attendance' ? '#ffffff' : '#64748b',
            fontWeight: 700,
            fontSize: '0.875rem',
            cursor: 'pointer'
          }}
        >
          Daily Shift Attendance Log
        </button>
      </div>

      {activeTab === 'directory' ? (
        <>
          {/* Search & Filter Toolbar */}
          <Card>
            <CardBody style={{ padding: '1rem 1.25rem' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', flex: 1, minWidth: '280px' }}>
                  <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
                    <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                    <input
                      type="text"
                      placeholder="Search staff by employee name, code, role or email..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.55rem 0.75rem 0.55rem 2.25rem',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        fontSize: '0.875rem'
                      }}
                    />
                  </div>

                  <select
                    value={departmentFilter}
                    onChange={(e) => setDepartmentFilter(e.target.value)}
                    style={{
                      padding: '0.55rem 0.85rem',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.875rem',
                      backgroundColor: '#fff',
                      fontWeight: 600,
                      color: '#1e293b'
                    }}
                  >
                    {departments.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>

                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    style={{
                      padding: '0.55rem 0.85rem',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.875rem',
                      backgroundColor: '#fff',
                      fontWeight: 600,
                      color: '#1e293b'
                    }}
                  >
                    <option value="All">All Statuses</option>
                    <option value="Active">Active</option>
                    <option value="On Leave">On Leave</option>
                    <option value="Probation">Probation</option>
                    <option value="Terminated">Terminated</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>

                <div style={{ fontSize: '0.825rem', color: '#64748b' }}>
                  Showing {filteredEmployees.length} personnel
                </div>
              </div>
            </CardBody>
          </Card>

          {/* VIEW MODE 1: MODERN EXECUTIVE CARDS (DEFAULT) */}
          {viewMode === 'grid' ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
              {filteredEmployees.length === 0 ? (
                <div style={{ gridColumn: '1 / -1', padding: '3rem', textAlign: 'center', backgroundColor: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                  <Users size={40} style={{ color: '#cbd5e1', margin: '0 auto 0.75rem' }} />
                  <p style={{ fontWeight: 600, color: '#334155' }}>No staff members match the selected criteria.</p>
                </div>
              ) : (
                filteredEmployees.map((emp) => {
                  const deptTheme = getDeptColor(emp.department);
                  const attText = getEmployeeTodayAttendance(emp);

                  return (
                    <div
                      key={emp.id}
                      style={{
                        backgroundColor: '#ffffff',
                        borderRadius: '16px',
                        border: '1px solid #e2e8f0',
                        boxShadow: '0 2px 5px rgba(0,0,0,0.04)',
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column',
                        transition: 'transform 0.2s, box-shadow 0.2s, border-color 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-3px)';
                        e.currentTarget.style.boxShadow = '0 10px 20px -3px rgba(0,0,0,0.08)';
                        e.currentTarget.style.borderColor = '#cbd5e1';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'none';
                        e.currentTarget.style.boxShadow = '0 2px 5px rgba(0,0,0,0.04)';
                        e.currentTarget.style.borderColor = '#e2e8f0';
                      }}
                    >
                      {/* Top Header Strip: Department pill & Attendance status */}
                      <div
                        style={{
                          padding: '0.875rem 1.15rem',
                          backgroundColor: '#f8fafc',
                          borderBottom: '1px solid #f1f5f9',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '0.5rem'
                        }}
                      >
                        <span
                          style={{
                            fontSize: '0.725rem',
                            fontWeight: 700,
                            padding: '0.2rem 0.6rem',
                            borderRadius: '6px',
                            backgroundColor: deptTheme.bg,
                            color: deptTheme.text,
                            border: `1px solid ${deptTheme.border}`
                          }}
                        >
                          {emp.department}
                        </span>

                        {(() => {
                          const isPresent = attText.startsWith('Present');
                          const isLate = attText.startsWith('Late');
                          const isLeave = attText.includes('Leave') || attText.includes('Paid Leave') || attText.includes('Unpaid Leave');
                          const isNotMarked = attText === 'Not Marked';

                          let badgeBg = '#f1f5f9';
                          let badgeColor = '#64748b';
                          let badgeBorder = '#cbd5e1';
                          let dotColor = '#94a3b8';

                          if (isPresent) {
                            badgeBg = '#f0fdf4'; badgeColor = '#16a34a'; badgeBorder = '#bbf7d0'; dotColor = '#16a34a';
                          } else if (isLate) {
                            badgeBg = '#fef3c7'; badgeColor = '#d97706'; badgeBorder = '#fde68a'; dotColor = '#d97706';
                          } else if (isLeave) {
                            badgeBg = '#f3e8ff'; badgeColor = '#9333ea'; badgeBorder = '#e9d5ff'; dotColor = '#9333ea';
                          } else if (!isNotMarked) {
                            badgeBg = '#fff7ed'; badgeColor = '#ea580c'; badgeBorder = '#fed7aa'; dotColor = '#ea580c';
                          }

                          return (
                            <div
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.35rem',
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                color: badgeColor,
                                backgroundColor: badgeBg,
                                padding: '0.2rem 0.5rem',
                                borderRadius: '6px',
                                border: `1px solid ${badgeBorder}`
                              }}
                            >
                              <span
                                style={{
                                  width: '7px',
                                  height: '7px',
                                  borderRadius: '50%',
                                  backgroundColor: dotColor,
                                  display: 'inline-block'
                                }}
                              />
                              {attText}
                            </div>
                          );
                        })()}
                      </div>

                      {/* Main Profile Body */}
                      <div style={{ padding: '1.25rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {/* Avatar & Name Info */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
                          <EmployeeAvatar
                            avatar={emp.avatar}
                            name={emp.fullName || emp.name}
                            size={52}
                            borderRadius="14px"
                            fontSize="1.15rem"
                            boxShadow="0 4px 6px -1px rgba(44, 52, 128, 0.25)"
                          />

                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', justifyContent: 'space-between' }}>
                              <h3
                                onClick={() => setSelectedEmployee(emp)}
                                style={{
                                  fontSize: '1.05rem',
                                  fontWeight: 800,
                                  color: '#0f172a',
                                  margin: 0,
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                  cursor: 'pointer'
                                }}
                                onMouseEnter={(e) => (e.currentTarget.style.color = '#2C3480')}
                                onMouseLeave={(e) => (e.currentTarget.style.color = '#0f172a')}
                              >
                                {emp.name}
                              </h3>
                              <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b', fontFamily: 'monospace' }}>
                                #{emp.code}
                              </span>
                            </div>

                            <p style={{ fontSize: '0.825rem', fontWeight: 600, color: '#334155', margin: '0.2rem 0 0' }}>
                              {emp.role}
                            </p>
                          </div>
                        </div>

                        {/* Interactive Contact Chips */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', backgroundColor: '#f8fafc', padding: '0.75rem', borderRadius: '10px', border: '1px solid #f1f5f9' }}>
                          <a
                            href={`tel:${emp.phone}`}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem',
                              fontSize: '0.8rem',
                              color: '#1e293b',
                              textDecoration: 'none',
                              fontWeight: 500
                            }}
                          >
                            <Phone size={13} style={{ color: '#2C3480' }} /> {emp.phone}
                          </a>
                          <a
                            href={`mailto:${emp.email}`}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem',
                              fontSize: '0.775rem',
                              color: '#64748b',
                              textDecoration: 'none',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            <Mail size={13} style={{ color: '#64748b' }} /> {emp.email}
                          </a>
                        </div>

                        {/* Operational Stats Grid */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: 'auto' }}>
                          <div style={{ padding: '0.5rem 0.65rem', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#64748b', fontSize: '0.7rem', fontWeight: 600 }}>
                              <Clock size={12} /> SHIFT
                            </div>
                            <div style={{ fontSize: '0.775rem', fontWeight: 700, color: '#0f172a', marginTop: '0.2rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {emp.shift}
                            </div>
                          </div>

                          <div style={{ padding: '0.5rem 0.65rem', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#64748b', fontSize: '0.7rem', fontWeight: 600 }}>
                              <Calendar size={12} /> LEAVES LEFT
                            </div>
                            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#16a34a', marginTop: '0.2rem' }}>
                              {emp.leavesRemaining} <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 500 }}>/ 18 Days</span>
                            </div>
                          </div>
                        </div>

                        {/* Card Bottom: Monthly Remuneration & Cobalt Blue Action Button */}
                        <div
                          style={{
                            paddingTop: '0.875rem',
                            borderTop: '1px solid #f1f5f9',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '0.5rem'
                          }}
                        >
                          <div>
                            <span style={{ fontSize: '0.7rem', color: '#64748b', display: 'block', fontWeight: 500 }}>
                              MONTHLY REMUNERATION
                            </span>
                            <span style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>
                              ₹{emp.salary.toLocaleString('en-IN')}
                            </span>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <button
                              onClick={() => handleOpenEditModal(emp)}
                              title="Edit Employee Profile"
                              style={{
                                backgroundColor: '#f8fafc',
                                color: '#2C3480',
                                border: '1px solid #cbd5e1',
                                padding: '0.5rem 0.65rem',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.25rem',
                                fontSize: '0.75rem',
                                fontWeight: 700
                              }}
                            >
                              <Edit3 size={13} /> Edit
                            </button>
                            <button
                              onClick={() => handleOpenDeleteModal(emp)}
                              title="Delete Employee"
                              style={{
                                backgroundColor: '#fef2f2',
                                color: '#dc2626',
                                border: '1px solid #fecaca',
                                padding: '0.5rem 0.6rem',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center'
                              }}
                            >
                              <Trash2 size={13} />
                            </button>
                            <button
                              onClick={() => setSelectedEmployee(emp)}
                              style={{
                                backgroundColor: '#2C3480',
                                color: '#ffffff',
                                border: 'none',
                                padding: '0.5rem 0.85rem',
                                borderRadius: '8px',
                                fontWeight: 700,
                                fontSize: '0.8rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.35rem',
                                cursor: 'pointer',
                                transition: 'background-color 0.15s'
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#232a68')}
                              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#2C3480')}
                            >
                              Profile <ArrowRight size={13} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          ) : (
            /* VIEW MODE 2: MODERN CLEAN TABLE VIEW */
            <Card>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: '#f8fafc', color: '#475569', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      <th style={{ padding: '0.875rem 1rem' }}>Employee Name</th>
                      <th style={{ padding: '0.875rem 1rem' }}>Role & Department</th>
                      <th style={{ padding: '0.875rem 1rem' }}>Contact</th>
                      <th style={{ padding: '0.875rem 1rem' }}>Shift Schedule</th>
                      <th style={{ padding: '0.875rem 1rem' }}>Today's Punch</th>
                      <th style={{ padding: '0.875rem 1rem', textAlign: 'center' }}>Leave Balance</th>
                      <th style={{ padding: '0.875rem 1rem', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEmployees.map((emp) => (
                      <tr
                        key={emp.id}
                        style={{
                          borderBottom: '1px solid #f1f5f9',
                          transition: 'background-color 0.15s'
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                      >
                        <td style={{ padding: '0.875rem 1rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <EmployeeAvatar
                              avatar={emp.avatar}
                              name={emp.fullName || emp.name}
                              size={38}
                              borderRadius="10px"
                              fontSize="0.85rem"
                            />
                            <div>
                              <div
                                onClick={() => setSelectedEmployee(emp)}
                                style={{ fontWeight: 700, color: '#0f172a', cursor: 'pointer' }}
                                onMouseEnter={(e) => (e.currentTarget.style.color = '#2C3480')}
                                onMouseLeave={(e) => (e.currentTarget.style.color = '#0f172a')}
                              >
                                {emp.name}
                              </div>
                              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{emp.code}</div>
                            </div>
                          </div>
                        </td>

                        <td style={{ padding: '0.875rem 1rem' }}>
                          <div style={{ fontWeight: 600, color: '#1e293b' }}>{emp.role}</div>
                          <span
                            style={{
                              fontSize: '0.7rem',
                              padding: '0.15rem 0.45rem',
                              borderRadius: '4px',
                              backgroundColor: '#f1f5f9',
                              color: '#475569',
                              fontWeight: 600
                            }}
                          >
                            {emp.department}
                          </span>
                        </td>

                        <td style={{ padding: '0.875rem 1rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', color: '#1e293b' }}>
                            <Phone size={12} /> {emp.phone}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', color: '#64748b' }}>
                            <Mail size={12} /> {emp.email}
                          </div>
                        </td>

                        <td style={{ padding: '0.875rem 1rem', fontSize: '0.8rem', color: '#475569' }}>
                          {emp.shift}
                        </td>

                        <td style={{ padding: '0.875rem 1rem' }}>
                          {(() => {
                            const attText = getEmployeeTodayAttendance(emp);
                            const isPresent = attText.startsWith('Present');
                            const isLate = attText.startsWith('Late');
                            const isLeave = attText.includes('Leave') || attText.includes('Paid Leave') || attText.includes('Unpaid Leave');
                            const isNotMarked = attText === 'Not Marked';

                            let badgeBg = '#f1f5f9';
                            let badgeColor = '#64748b';

                            if (isPresent) {
                              badgeBg = '#f0fdf4'; badgeColor = '#16a34a';
                            } else if (isLate) {
                              badgeBg = '#fef3c7'; badgeColor = '#d97706';
                            } else if (isLeave) {
                              badgeBg = '#f3e8ff'; badgeColor = '#9333ea';
                            } else if (!isNotMarked) {
                              badgeBg = '#fff7ed'; badgeColor = '#ea580c';
                            }

                            return (
                              <span
                                style={{
                                  fontSize: '0.75rem',
                                  fontWeight: 600,
                                  padding: '0.2rem 0.5rem',
                                  borderRadius: '6px',
                                  backgroundColor: badgeBg,
                                  color: badgeColor
                                }}
                              >
                                {attText}
                              </span>
                            );
                          })()}
                        </td>

                        <td style={{ padding: '0.875rem 1rem', textAlign: 'center', fontSize: '0.8rem' }}>
                          <span style={{ fontWeight: 700, color: '#16a34a' }}>{emp.leavesRemaining}</span>
                          <span style={{ color: '#94a3b8' }}> / 18 days</span>
                        </td>

                        <td style={{ padding: '0.875rem 1rem', textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                            <Button
                              variant="outline"
                              size="sm"
                              style={{ borderColor: '#cbd5e1', color: '#2C3480', padding: '0.35rem 0.6rem' }}
                              onClick={() => handleOpenEditModal(emp)}
                              title="Edit Employee Profile"
                            >
                              <Edit3 size={13} style={{ marginRight: '0.2rem' }} /> Edit
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              style={{ borderColor: '#fecaca', color: '#dc2626', backgroundColor: '#fff5f5', padding: '0.35rem 0.5rem' }}
                              onClick={() => handleOpenDeleteModal(emp)}
                              title="Delete Employee"
                            >
                              <Trash2 size={13} />
                            </Button>
                            <Button
                              variant="primary"
                              size="sm"
                              style={{ backgroundColor: '#2C3480', padding: '0.35rem 0.65rem' }}
                              onClick={() => setSelectedEmployee(emp)}
                            >
                              Profile
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </>
      ) : (
        /* Attendance Cards Grid View */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              padding: '1.25rem 1.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '1rem',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                <Clock size={18} color="#2C3480" />
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#2C3480', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Biometric Punch Records
                </span>
              </div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#090d16', margin: 0 }}>
                Weekly Attendance &amp; Biometric Duty Log
              </h2>
              <p style={{ fontSize: '0.8125rem', color: '#64748b', margin: '0.25rem 0 0' }}>
                Punched shifts across Headquarters, Dispatch Yard, and Airport Counters.
              </p>
            </div>

            <Button
              variant="outline"
              onClick={() => navigate('/admin/attendance')}
              style={{ fontWeight: 700, borderColor: '#C7D2FE', color: '#2C3480', backgroundColor: '#EEF0FD' }}
            >
              <Clock size={15} style={{ marginRight: '0.35rem' }} /> Open Staff Attendance Register &rarr;
            </Button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
            {mockAttendanceRecords.length === 0 ? (
              <div style={{ gridColumn: '1 / -1', padding: '3rem', textAlign: 'center', backgroundColor: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                <Clock size={40} style={{ color: '#cbd5e1', margin: '0 auto 0.75rem' }} />
                <p style={{ fontWeight: 600, color: '#334155' }}>No biometric duty logs recorded yet.</p>
              </div>
            ) : (
              mockAttendanceRecords.map((rec, idx) => {
              const total = rec.present + rec.onLeave + rec.absent;
              const rate = Math.round((rec.present / (total || 1)) * 100);
              return (
                <div
                  key={idx}
                  style={{
                    backgroundColor: '#ffffff',
                    borderRadius: '14px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                    padding: '1.25rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1rem'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Calendar size={16} color="#2C3480" />
                      <span style={{ fontSize: '0.9375rem', fontWeight: 800, color: '#090d16' }}>
                        {rec.date}
                      </span>
                    </div>
                    <span
                      style={{
                        padding: '0.2rem 0.55rem',
                        borderRadius: '9999px',
                        fontSize: '0.75rem',
                        fontWeight: 800,
                        backgroundColor: rate >= 90 ? '#dcfce7' : rate >= 75 ? '#fef3c7' : '#fee2e2',
                        color: rate >= 90 ? '#15803d' : rate >= 75 ? '#b45309' : '#b91c1c'
                      }}
                    >
                      {rate}% Present
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', textAlign: 'center' }}>
                    <div style={{ backgroundColor: '#f0fdf4', padding: '0.625rem 0.25rem', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
                      <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#16a34a' }}>
                        {rec.present}
                      </div>
                      <span style={{ fontSize: '0.6875rem', color: '#15803d', fontWeight: 700 }}>Present</span>
                    </div>

                    <div style={{ backgroundColor: '#fff7ed', padding: '0.625rem 0.25rem', borderRadius: '8px', border: '1px solid #fed7aa' }}>
                      <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#ea580c' }}>
                        {rec.onLeave}
                      </div>
                      <span style={{ fontSize: '0.6875rem', color: '#c2410c', fontWeight: 700 }}>On Leave</span>
                    </div>

                    <div style={{ backgroundColor: '#f8fafc', padding: '0.625rem 0.25rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#64748b' }}>
                        {rec.absent}
                      </div>
                      <span style={{ fontSize: '0.6875rem', color: '#475569', fontWeight: 700 }}>Absent</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
          </div>
        </div>
      )}

      {/* Employee Quick Profile View Modal */}
      {selectedEmployee && (
        <Modal
          isOpen={Boolean(selectedEmployee)}
          onClose={() => setSelectedEmployee(null)}
          title={`Staff Profile: ${selectedEmployee.name || selectedEmployee.fullName}`}
          size="md"
          footer={
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <Button
                  variant="outline"
                  style={{ borderColor: '#fecaca', color: '#dc2626', backgroundColor: '#fff5f5' }}
                  onClick={() => {
                    const emp = selectedEmployee;
                    setSelectedEmployee(null);
                    handleOpenDeleteModal(emp);
                  }}
                >
                  <Trash2 size={14} style={{ marginRight: '0.25rem' }} /> Delete
                </Button>
                <Button
                  variant="outline"
                  style={{ borderColor: '#cbd5e1', color: '#2C3480' }}
                  onClick={() => {
                    const emp = selectedEmployee;
                    handleOpenEditModal(emp);
                  }}
                >
                  <Edit3 size={14} style={{ marginRight: '0.25rem' }} /> Edit Details
                </Button>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <Button
                  variant="outline"
                  onClick={() => navigate('/admin/payroll')}
                  style={{ color: '#2C3480', borderColor: '#c7d2fe', backgroundColor: '#eef2ff' }}
                >
                  <Banknote size={14} style={{ marginRight: '0.25rem' }} /> Payroll System
                </Button>
                <Button variant="primary" style={{ backgroundColor: '#2C3480' }} onClick={() => setSelectedEmployee(null)}>
                  Close Profile
                </Button>
              </div>
            </div>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', paddingBottom: '1rem', borderBottom: '1px solid #e2e8f0' }}>
              <EmployeeAvatar
                avatar={selectedEmployee.avatar}
                name={selectedEmployee.fullName || selectedEmployee.name}
                size={60}
                borderRadius="16px"
                fontSize="1.4rem"
              />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                    {selectedEmployee.name || selectedEmployee.fullName}
                  </h3>
                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      padding: '0.2rem 0.55rem',
                      borderRadius: '6px',
                      backgroundColor: selectedEmployee.status === 'Active' ? '#f0fdf4' : selectedEmployee.status === 'On Leave' ? '#fff7ed' : '#f1f5f9',
                      color: selectedEmployee.status === 'Active' ? '#16a34a' : selectedEmployee.status === 'On Leave' ? '#ea580c' : '#475569',
                      border: '1px solid currentColor'
                    }}
                  >
                    ● {selectedEmployee.status || 'Active'}
                  </span>
                </div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#2C3480', marginTop: '0.2rem' }}>
                  {selectedEmployee.role || selectedEmployee.designation}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.15rem' }}>
                  #{selectedEmployee.code || selectedEmployee.employeeCode} &bull; Joined {selectedEmployee.joiningDate || '2023-01-15'}
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div style={{ padding: '0.75rem', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '0.7rem', color: '#64748b', display: 'block' }}>DEPARTMENT</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>{selectedEmployee.department}</span>
              </div>
              <div style={{ padding: '0.75rem', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '0.7rem', color: '#64748b', display: 'block' }}>SHIFT TIMING</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>{selectedEmployee.shift || 'General (09:30 - 18:30)'}</span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div style={{ padding: '0.75rem', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '0.7rem', color: '#64748b', display: 'block' }}>MONTHLY REMUNERATION</span>
                <span style={{ fontSize: '0.95rem', fontWeight: 800, color: '#16a34a' }}>
                  ₹{Number(selectedEmployee.monthlySalary || selectedEmployee.salary || 0).toLocaleString('en-IN')}
                </span>
              </div>
              <div style={{ padding: '0.75rem', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '0.7rem', color: '#64748b', display: 'block' }}>PAYROLL CATEGORY</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#2C3480' }}>
                  {selectedEmployee.salaryCategory || 'Category A'}
                </span>
              </div>
            </div>

            <div style={{ padding: '0.75rem', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontSize: '0.7rem', color: '#64748b', display: 'block' }}>TODAY'S ATTENDANCE STATUS</span>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>
                    {getEmployeeTodayAttendance(selectedEmployee)}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedEmployee(null);
                    navigate('/admin/attendance');
                  }}
                  style={{ borderColor: '#c7d2fe', color: '#2C3480', fontSize: '0.75rem' }}
                >
                  <Clock size={12} style={{ marginRight: '0.25rem' }} /> Mark / Verify in Register &rarr;
                </Button>
              </div>
            </div>

            <div style={{ padding: '0.75rem', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: '0.7rem', color: '#64748b', display: 'block' }}>CONTACT COORDINATES</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginTop: '0.35rem', fontSize: '0.85rem', color: '#1e293b' }}>
                <div><strong>Phone:</strong> {selectedEmployee.phone || 'N/A'}</div>
                <div><strong>Email:</strong> {selectedEmployee.email || 'N/A'}</div>
                <div><strong>Address:</strong> {selectedEmployee.address || 'N/A'}</div>
                <div><strong>Emergency Contact:</strong> {selectedEmployee.emergencyContact || 'N/A'}</div>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Add Employee Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Enroll New Operations Staff Member"
        size="md"
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', width: '100%' }}>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              form="add-employee-form"
              variant="primary"
              disabled={isSubmittingCreate}
              style={{ backgroundColor: '#2C3480' }}
            >
              {isSubmittingCreate ? 'Enrolling...' : 'Enroll Staff'}
            </Button>
          </div>
        }
      >
        <form id="add-employee-form" onSubmit={handleCreateEmployee} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                Full Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Ramesh Kumar"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.875rem' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                Staff ID / Code
              </label>
              <input
                type="text"
                placeholder="Auto EMP-xxx"
                value={employeeCode}
                onChange={(e) => setEmployeeCode(e.target.value)}
                style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.875rem' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                Job Role / Designation *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Senior Dispatcher"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.875rem' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                Department *
              </label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.875rem', backgroundColor: '#fff' }}
              >
                {departments.filter((d) => d !== 'All Departments').map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                Phone Number *
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.875rem' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                Email Address
              </label>
              <input
                type="email"
                placeholder="name@maktours.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.875rem' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                Shift Timing
              </label>
              <input
                type="text"
                value={shift}
                onChange={(e) => setShift(e.target.value)}
                style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.875rem' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                Monthly Base Salary (INR)
              </label>
              <input
                type="number"
                min="10000"
                value={salary}
                onChange={(e) => setSalary(e.target.value)}
                style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.875rem' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                Initial Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.875rem', backgroundColor: '#fff' }}
              >
                <option value="Active">Active</option>
                <option value="Probation">Probation</option>
                <option value="On Leave">On Leave</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                Salary Category
              </label>
              <select
                value={salaryCategory}
                onChange={(e) => setSalaryCategory(e.target.value)}
                style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.875rem', backgroundColor: '#fff' }}
              >
                <option value="Category A">Category A – Fixed Monthly</option>
                <option value="Category B">Category B – Monthly + Trips</option>
                <option value="Category C">Category C – Trip Driver</option>
                <option value="Category D">Category D – Daily Wage</option>
                <option value="Category E">Category E – Contract</option>
              </select>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
              Residential Address
            </label>
            <textarea
              rows={2}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.875rem', fontFamily: 'inherit' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
              Emergency Contact (Name & Phone)
            </label>
            <input
              type="text"
              placeholder="e.g. Spouse / Parent name & contact"
              value={emergencyContact}
              onChange={(e) => setEmergencyContact(e.target.value)}
              style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.875rem' }}
            />
          </div>
        </form>
      </Modal>

      {/* Edit Employee Modal */}
      {editingEmployee && (
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          title={`Edit Staff Profile: ${editName}`}
          size="md"
          footer={
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', width: '100%' }}>
              <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                form="edit-employee-form"
                variant="primary"
                disabled={isSubmittingEdit}
                style={{ backgroundColor: '#2C3480' }}
              >
                {isSubmittingEdit ? 'Saving Changes...' : 'Save Profile Changes'}
              </Button>
            </div>
          }
        >
          <form id="edit-employee-form" onSubmit={handleUpdateEmployee} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.875rem' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                  Staff Code / ID
                </label>
                <input
                  type="text"
                  value={editEmployeeCode}
                  onChange={(e) => setEditEmployeeCode(e.target.value)}
                  style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.875rem' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                  Designation / Role *
                </label>
                <input
                  type="text"
                  required
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value)}
                  style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.875rem' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                  Department *
                </label>
                <select
                  value={editDepartment}
                  onChange={(e) => setEditDepartment(e.target.value)}
                  style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.875rem', backgroundColor: '#fff' }}
                >
                  {departments.filter((d) => d !== 'All Departments').map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                  Contact Phone *
                </label>
                <input
                  type="tel"
                  required
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.875rem' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                  Email Address
                </label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.875rem' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                  Operational Status
                </label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.875rem', backgroundColor: '#fff' }}
                >
                  <option value="Active">Active</option>
                  <option value="On Leave">On Leave</option>
                  <option value="Probation">Probation</option>
                  <option value="Terminated">Terminated</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                  Monthly Base Remuneration (INR)
                </label>
                <input
                  type="number"
                  min="0"
                  value={editSalary}
                  onChange={(e) => setEditSalary(e.target.value)}
                  style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.875rem' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.75rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                  Shift Timing
                </label>
                <input
                  type="text"
                  value={editShift}
                  onChange={(e) => setEditShift(e.target.value)}
                  style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.875rem' }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                Residential Address
              </label>
              <textarea
                rows={2}
                value={editAddress}
                onChange={(e) => setEditAddress(e.target.value)}
                style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.875rem', fontFamily: 'inherit' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                Emergency Contact
              </label>
              <input
                type="text"
                value={editEmergencyContact}
                onChange={(e) => setEditEmergencyContact(e.target.value)}
                style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.875rem' }}
              />
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Confirmation & Audit Safety Modal */}
      {deletingEmployee && (
        <Modal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          title={`Delete Staff: ${deletingEmployee.fullName || deletingEmployee.name}`}
          size="md"
          footer={
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', width: '100%' }}>
              <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>
                Cancel
              </Button>
              {deleteBlockedReason ? (
                <Button
                  variant="primary"
                  style={{ backgroundColor: '#475569' }}
                  disabled={isSubmittingDelete}
                  onClick={handleDeactivateInstead}
                >
                  {isSubmittingDelete ? 'Updating...' : 'Set Status to Inactive Instead'}
                </Button>
              ) : (
                <Button
                  variant="primary"
                  style={{ backgroundColor: '#dc2626' }}
                  disabled={isSubmittingDelete}
                  onClick={handleConfirmDelete}
                >
                  {isSubmittingDelete ? 'Verifying & Deleting...' : 'Confirm Delete'}
                </Button>
              )}
            </div>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {deleteBlockedReason ? (
              <div
                style={{
                  backgroundColor: '#fff1f2',
                  border: '1px solid #fecdd3',
                  borderRadius: '12px',
                  padding: '1rem',
                  display: 'flex',
                  gap: '0.75rem',
                  alignItems: 'flex-start'
                }}
              >
                <ShieldAlert size={22} color="#e11d48" style={{ flexShrink: 0, marginTop: '0.1rem' }} />
                <div>
                  <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 800, color: '#9f1239' }}>
                    Audit Deletion Protection Activated
                  </h4>
                  <p style={{ margin: '0.4rem 0 0', fontSize: '0.825rem', color: '#881337', lineHeight: 1.4 }}>
                    {deleteBlockedReason}
                  </p>
                  <p style={{ margin: '0.5rem 0 0', fontSize: '0.8rem', color: '#475569' }}>
                    Click <strong>"Set Status to Inactive Instead"</strong> to revoke system access while keeping historical records compliant.
                  </p>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <p style={{ margin: 0, fontSize: '0.875rem', color: '#334155', lineHeight: 1.5 }}>
                  Are you sure you want to delete staff member <strong>{deletingEmployee.fullName || deletingEmployee.name}</strong> (#{deletingEmployee.employeeCode || deletingEmployee.code})?
                </p>
                <div
                  style={{
                    backgroundColor: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    padding: '0.75rem',
                    fontSize: '0.8rem',
                    color: '#64748b'
                  }}
                >
                  <p style={{ margin: 0 }}>
                    <strong>Note:</strong> MAK ERP automatically enforces audit protection. If this employee has any registered attendance records, trip assignments, or payroll entries in the system, deletion will be blocked to maintain financial integrity.
                  </p>
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}

export default EmployeeList;
