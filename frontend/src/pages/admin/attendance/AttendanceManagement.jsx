// MAK Tours & Travels ERP - Staff Attendance Management & Biometric Duty Logs
// Comprehensive tracking, daily shift punches, monthly matrix & leave regularization for all staff
import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Calendar,
  Clock,
  UserCheck,
  Users,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  Clock3,
  CalendarCheck,
  CalendarDays,
  FileText,
  Download,
  Plus,
  RefreshCw,
  MapPin,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  ArrowRight,
  Edit2,
  Check,
  X,
  Briefcase,
  Layers,
  Sparkles,
  Banknote,
  Car
} from 'lucide-react';
import { Breadcrumbs } from '../../../components/common/Breadcrumbs';
import { Card, CardHeader, CardBody } from '../../../components/ui/Card';
import { EmployeeAvatar } from '../../../components/common/EmployeeAvatar';
import { Button } from '../../../components/ui/Button';
import { Modal } from '../../../components/ui/Modal';
import { Badge } from '../../../components/ui/Badge';
import { Input } from '../../../components/ui/Input';
import { useAdminData } from '../../../context/AdminDataContext';
import { departments, shifts, punchLocations } from '../../../data/employeesData';

export function AttendanceManagement() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const {
    employees = [],
    staffAttendance = [],
    staffLeaveRequests = [],
    driverLeaveRequests = [],
    approveDriverLeave,
    markAttendance,
    bulkMarkAttendance,
    updateAttendanceRecord,
    approveStaffLeave,
    submitStaffLeave
  } = useAdminData();

  // Active Date Filter (defaults to today)
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().substring(0, 10));
  const initialTab = searchParams.get('tab') || 'daily';
  const [activeTab, setActiveTab] = useState(initialTab); // 'daily', 'matrix', 'leaves', 'roster'
  const [leaveScope, setLeaveScope] = useState('all'); // 'all', 'drivers', 'staff'
  const [viewMode, setViewMode] = useState('cards'); // 'cards' or 'table'

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && ['daily', 'matrix', 'leaves', 'roster'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [shiftFilter, setShiftFilter] = useState('All');

  // Edit / Mark Attendance Modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [editStatus, setEditStatus] = useState('Present');
  const [editCheckIn, setEditCheckIn] = useState('09:15 AM');
  const [editCheckOut, setEditCheckOut] = useState('06:30 PM');
  const [editWorkHours, setEditWorkHours] = useState('9h 15m');
  const [editPunchLocation, setEditPunchLocation] = useState('HQ Chennai - Biometric T1');
  const [editPunchMethod, setEditPunchMethod] = useState('Biometric Fingerprint');
  const [editRemarks, setEditRemarks] = useState('');

  // Today's date string YYYY-MM-DD
  const todayStr = useMemo(() => new Date().toISOString().substring(0, 10), []);

  // New Leave Modal
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [leaveEmpId, setLeaveEmpId] = useState('');
  const [leaveType, setLeaveType] = useState('Casual Leave');
  const [leaveFrom, setLeaveFrom] = useState(() => new Date().toISOString().substring(0, 10));
  const [leaveTo, setLeaveTo] = useState(() => new Date().toISOString().substring(0, 10));
  const [leaveTotalDays, setLeaveTotalDays] = useState(1);
  const [leaveReason, setLeaveReason] = useState('');

  // Driver Leave Review & Approval Modal (decide 1, 2, or 3 days)
  const [approvingDriverLeave, setApprovingDriverLeave] = useState(null);
  const [approveDurationDays, setApproveDurationDays] = useState(1);
  const [approveCustomStart, setApproveCustomStart] = useState('');
  const [approveCustomEnd, setApproveCustomEnd] = useState('');
  const [approveRemarks, setApproveRemarks] = useState('');

  const handleOpenApproveDriverLeave = (leave) => {
    setApprovingDriverLeave(leave);
    setApproveDurationDays(leave.totalDays || 1);
    setApproveCustomStart(leave.startDate);
    setApproveCustomEnd(leave.endDate);
    setApproveRemarks('Approved by Operations Admin');
  };

  const handleConfirmApproveDriverLeave = () => {
    if (!approvingDriverLeave) return;
    const leave = approvingDriverLeave;
    let finalStart = approveCustomStart || leave.startDate;
    let finalEnd = approveCustomEnd || leave.endDate;

    let days = approveDurationDays;
    try {
      const s = new Date(finalStart);
      const e = new Date(finalEnd);
      days = Math.max(1, Math.round(Math.abs(e - s) / (1000 * 60 * 60 * 24)) + 1);
    } catch {}

    approveDriverLeave(leave.id, true, approveRemarks || `Approved for ${days} Day(s)`, {
      approvedDays: days,
      approvedStartDate: finalStart,
      approvedEndDate: finalEnd
    });
    setApprovingDriverLeave(null);
  };

  // Bulk Clock-In Confirmation Modal
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);

  // Formatted date string for display (DD-MM-YYYY)
  const formattedDisplayDate = useMemo(() => {
    try {
      const parts = selectedDate.split('-');
      const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      const weekday = d.toLocaleDateString('en-IN', { weekday: 'long' });
      const dd = String(d.getDate()).padStart(2, '0');
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const yyyy = d.getFullYear();
      return `${weekday}, ${dd}-${mm}-${yyyy}`;
    } catch {
      return selectedDate;
    }
  }, [selectedDate]);

  // Navigate date
  const changeDateBy = (offset) => {
    try {
      const parts = selectedDate.split('-');
      const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      d.setDate(d.getDate() + offset);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      setSelectedDate(`${yyyy}-${mm}-${dd}`);
    } catch (e) {
      console.warn('Date navigation error:', e);
    }
  };

  // Build attendance map for selected date merged with all employees
  // Every active employee is guaranteed an entry on the selected date!
  const dailyAttendanceList = useMemo(() => {
    const norm = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');

    const todayStr = new Date().toISOString().substring(0, 10);
    const [yStr, mStr, dStr] = (selectedDate || todayStr).split('-');
    const dateObj = new Date(parseInt(yStr, 10), parseInt(mStr, 10) - 1, parseInt(dStr, 10));
    const isSunday = dateObj.getDay() === 0;
    const isPastDay = selectedDate < todayStr;
    const isToday = selectedDate === todayStr;

    return employees.map((emp) => {
      const empCodes = [
        norm(emp.id),
        norm(emp.code),
        norm(emp.employeeCode),
        norm(emp._id),
        norm(emp.driverId)
      ].filter(Boolean);
      const empNames = [norm(emp.fullName), norm(emp.name)].filter(Boolean);

      // Find matching record on selected date
      const record = (staffAttendance || []).find((a) => {
        if (a.date !== selectedDate) return false;
        const aCodes = [norm(a.employeeId), norm(a.employeeCode), norm(a.driverId)].filter(Boolean);
        const aNames = [norm(a.employeeName)].filter(Boolean);
        const codeMatch = empCodes.some((c) => aCodes.some((ac) => ac === c || ac.endsWith(c) || c.endsWith(ac)));
        const nameMatch = empNames.some((n) => aNames.some((an) => an === n));
        return codeMatch || nameMatch;
      });

      if (record) {
        return {
          ...record,
          employee: emp,
          employeeName: emp.fullName || emp.name,
          employeeCode: emp.employeeCode || emp.code || emp.id,
          role: emp.designation || emp.role,
          department: emp.department,
          avatar: emp.avatar || (emp.fullName || emp.name || 'EM').substring(0, 2).toUpperCase(),
          isMarked: true
        };
      }

      // NO AUTOMATIC ATTENDANCE MARKING:
      // When admin has NOT marked attendance for this staff on this date, show "Not Marked" / Pending.
      return {
        id: `ATT-${selectedDate.replace(/-/g, '')}-${emp.employeeCode || emp.id}`,
        employeeId: emp.employeeCode || emp.code || emp.id,
        employeeCode: emp.employeeCode || emp.code || emp.id,
        employeeName: emp.fullName || emp.name,
        role: emp.designation || emp.role,
        department: emp.department,
        avatar: emp.avatar || (emp.fullName || emp.name || 'EM').substring(0, 2).toUpperCase(),
        date: selectedDate,
        shift: emp.shift || 'General (09:30 - 18:30)',
        checkIn: '--:--',
        checkOut: '--:--',
        workHours: '0h 00m',
        status: isSunday ? 'Weekly Off' : 'Not Marked',
        punchLocation: isSunday ? 'N/A' : 'Not Marked',
        punchMethod: isSunday ? 'System Calendar' : 'Pending Admin Marking',
        remarks: isSunday ? 'Weekly off (Sunday schedule).' : 'Not marked yet. Admin must mark attendance below.',
        isMarked: false,
        employee: emp
      };
    });
  }, [employees, staffAttendance, selectedDate]);

  // Filtered Daily Attendance
  const filteredDailyList = useMemo(() => {
    return dailyAttendanceList.filter((item) => {
      const matchSearch =
        searchTerm === '' ||
        item.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.employeeCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.department.toLowerCase().includes(searchTerm.toLowerCase());

      const matchDept = departmentFilter === 'All' || departmentFilter === 'All Departments' || item.department === departmentFilter;
      const matchStatus =
        statusFilter === 'All' ||
        item.status === statusFilter ||
        (statusFilter === 'Not Marked' && (item.status === 'Not Marked' || !item.isMarked)) ||
        (statusFilter === 'Present' && item.isMarked && (item.status === 'Present' || item.status?.startsWith('Present'))) ||
        (statusFilter === 'On Leave' && item.isMarked && item.status?.includes('Leave'));
      const matchShift = shiftFilter === 'All' || item.shift.toLowerCase().includes(shiftFilter.toLowerCase());

      return matchSearch && matchDept && matchStatus && matchShift;
    });
  }, [dailyAttendanceList, searchTerm, departmentFilter, statusFilter, shiftFilter]);

  // Aggregated Daily Metrics
  const metrics = useMemo(() => {
    const total = dailyAttendanceList.length;
    const present = dailyAttendanceList.filter((a) => a.isMarked && (a.status === 'Present' || a.status?.startsWith('Present') || a.status?.includes('Duty'))).length;
    const late = dailyAttendanceList.filter((a) => a.isMarked && (a.status === 'Late' || a.status?.includes('Late'))).length;
    const halfDay = dailyAttendanceList.filter((a) => a.isMarked && (a.status === 'Half Day' || a.status?.includes('Half Day'))).length;
    const onLeave = dailyAttendanceList.filter((a) => a.isMarked && a.status?.includes('Leave')).length;
    const weeklyOff = dailyAttendanceList.filter((a) => a.status === 'Weekly Off').length;
    const holiday = dailyAttendanceList.filter((a) => a.status === 'Public Holiday').length;
    const absent = dailyAttendanceList.filter((a) => a.isMarked && (a.status === 'Absent' || a.status?.includes('Absent'))).length;
    const notMarked = dailyAttendanceList.filter((a) => !a.isMarked && a.status === 'Not Marked').length;

    const totalAttended = present + late + halfDay;
    const markedStaff = present + late + halfDay + onLeave + absent;
    const attendanceRate = markedStaff > 0 ? Math.round((totalAttended / markedStaff) * 100) : 0;

    return { total, present, late, halfDay, onLeave, absent, notMarked, attendanceRate, weeklyOff, holiday, markedStaff };
  }, [dailyAttendanceList]);

  // Department colors mapping
  const getDeptColor = (dept) => {
    switch (dept) {
      case 'Operations & Dispatch':
        return { bg: '#e0e7ff', text: '#3730a3', border: '#c7d2fe' };
      case 'Fleet Logistics':
        return { bg: '#fef3c7', text: '#92400e', border: '#fde68a' };
      case 'Finance & Accounts':
        return { bg: '#dcfce7', text: '#166534', border: '#bbf7d0' };
      case 'Tour Packages & Sales':
        return { bg: '#fae8ff', text: '#86198f', border: '#f5d0fe' };
      case 'Customer Support':
        return { bg: '#e0f2fe', text: '#075985', border: '#bae6fd' };
      case 'IT & Engineering':
        return { bg: '#f3e8ff', text: '#6b21a8', border: '#e9d5ff' };
      default:
        return { bg: '#f1f5f9', text: '#334155', border: '#e2e8f0' };
    }
  };

  // Status badges & styling
  const getStatusBadge = (status) => {
    const s = String(status || '');
    if (s === 'Not Marked' || s === 'Pending' || s === 'Unrecorded') {
      return { label: 'Not Marked', bg: '#f1f5f9', color: '#64748b', border: '#cbd5e1', dot: '#94a3b8' };
    }
    if (s.includes('Office') || s === 'Present') {
      return { label: 'Present (Office)', bg: '#f0fdf4', color: '#15803d', border: '#bbf7d0', dot: '#16a34a' };
    }
    if (s.includes('Trip')) {
      return { label: 'Present (On Trip)', bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe', dot: '#2563eb' };
    }
    if (s.includes('Standby')) {
      return { label: 'Present (Standby)', bg: '#fffbeb', color: '#b45309', border: '#fde68a', dot: '#d97706' };
    }
    if (s.includes('Other Duty')) {
      return { label: 'Other Duty', bg: '#f5f3ff', color: '#6b21a8', border: '#ddd6fe', dot: '#7c3aed' };
    }
    if (s === 'Late' || s.includes('Late')) {
      return { label: 'Late Arrival', bg: '#fffbeb', color: '#b45309', border: '#fde68a', dot: '#d97706' };
    }
    if (s.includes('Half Day')) {
      return { label: 'Half Day', bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe', dot: '#2563eb' };
    }
    if (s.includes('Paid Leave') || s.includes('On Leave')) {
      return { label: 'Paid Leave', bg: '#faf5ff', color: '#7e22ce', border: '#e9d5ff', dot: '#9333ea' };
    }
    if (s.includes('Unpaid Leave')) {
      return { label: 'Unpaid Leave', bg: '#fef2f2', color: '#991b1b', border: '#fecaca', dot: '#b91c1c' };
    }
    if (s === 'Weekly Off') {
      return { label: 'Weekly Off', bg: '#f1f5f9', color: '#475569', border: '#cbd5e1', dot: '#64748b' };
    }
    if (s === 'Public Holiday') {
      return { label: 'Public Holiday', bg: '#fef2f2', color: '#991b1b', border: '#fecaca', dot: '#dc2626' };
    }
    if (s === 'Absent') {
      return { label: 'Absent', bg: '#fef2f2', color: '#991b1b', border: '#fecaca', dot: '#dc2626' };
    }
    return { label: s || 'Not Marked', bg: '#f8fafc', color: '#64748b', border: '#e2e8f0', dot: '#94a3b8' };
  };

  // Quick 1-click attendance status toggle
  const handleQuickStatus = (empId, newStatus) => {
    let checkIn = '--:--';
    let checkOut = '--:--';
    let workHours = '0h 00m';

    if (newStatus === 'Present') {
      checkIn = '09:15 AM';
      checkOut = '06:30 PM';
      workHours = '9h 15m';
    } else if (newStatus === 'Late') {
      checkIn = '09:55 AM';
      checkOut = '06:30 PM';
      workHours = '8h 35m';
    } else if (newStatus === 'Half Day') {
      checkIn = '09:30 AM';
      checkOut = '01:30 PM';
      workHours = '4h 00m';
    } else if (newStatus === 'Weekly Off' || newStatus === 'Public Holiday') {
      checkIn = '--:--';
      checkOut = '--:--';
      workHours = '0h 00m';
    }

    markAttendance(empId, selectedDate, newStatus, {
      checkIn,
      checkOut,
      workHours,
      remarks: `Quick marked ${newStatus} by Admin Operations.`
    });
  };

  // Open modal for detailed edit
  const handleOpenEdit = (item) => {
    setEditingEmployee(item);
    const isUnmarked = !item.isMarked || item.status === 'Not Marked';
    setEditStatus(isUnmarked ? 'Present – Office' : item.status);
    setEditCheckIn(isUnmarked || item.checkIn === '--:--' ? '09:15 AM' : item.checkIn);
    setEditCheckOut(isUnmarked || item.checkOut === '--:--' ? '06:30 PM' : item.checkOut);
    setEditWorkHours(isUnmarked || item.workHours === '0h 00m' ? '9h 15m' : item.workHours);
    setEditPunchLocation(isUnmarked || item.punchLocation === 'Not Marked' ? 'HQ Chennai - Biometric T1' : item.punchLocation);
    setEditPunchMethod(isUnmarked || item.punchMethod?.includes('Pending') ? 'Admin Operations Manual' : item.punchMethod);
    setEditRemarks(isUnmarked || item.remarks?.includes('Not marked yet') ? '' : item.remarks);
    setIsEditModalOpen(true);
  };

  // Save Modal Attendance
  const handleSaveEdit = (e) => {
    e.preventDefault();
    if (!editingEmployee) return;

    const isReset = editStatus === 'Not Marked';
    markAttendance(editingEmployee.employeeId, selectedDate, editStatus, {
      checkIn: isReset || editStatus === 'Weekly Off' || editStatus === 'Absent' ? '--:--' : editCheckIn,
      checkOut: isReset || editStatus === 'Weekly Off' || editStatus === 'Absent' ? '--:--' : editCheckOut,
      workHours: isReset || editStatus === 'Weekly Off' || editStatus === 'Absent' ? '0h 00m' : editWorkHours,
      punchLocation: isReset ? 'Not Marked' : editPunchLocation,
      punchMethod: isReset ? 'Pending Admin Marking' : (editPunchMethod || 'Admin Operations Manual'),
      remarks: isReset ? 'Not marked yet. Admin must mark attendance below.' : (editRemarks || `Marked ${editStatus} by Admin Operations.`)
    });

    setIsEditModalOpen(false);
  };

  // Handle Bulk Clock-In All
  const handleConfirmBulkClockIn = () => {
    bulkMarkAttendance('Present', selectedDate);
    setIsBulkModalOpen(false);
  };

  // Handle Submit Leave Application
  const handleCreateLeave = (e) => {
    e.preventDefault();
    if (!leaveEmpId) return;

    if (!leaveFrom || leaveFrom < todayStr) {
      alert('Leave cannot be applied for past dates. Please choose today or a future date.');
      return;
    }
    if (!leaveTo || leaveTo < leaveFrom) {
      alert('End date cannot be earlier than start date.');
      return;
    }

    const targetEmp = employees.find((emp) => emp.id === leaveEmpId || emp.code === leaveEmpId);
    if (!targetEmp) return;

    submitStaffLeave({
      employeeId: targetEmp.id,
      employeeName: targetEmp.name,
      employeeCode: targetEmp.code,
      department: targetEmp.department,
      leaveType,
      fromDate: leaveFrom,
      toDate: leaveTo,
      totalDays: parseFloat(leaveTotalDays) || 1,
      reason: leaveReason || 'Staff annual personal leave request'
    });

    setIsLeaveModalOpen(false);
    setLeaveReason('');
  };

  // Export Daily Register to CSV
  const handleExportCSV = () => {
    const headers = ['Employee Code', 'Staff Name', 'Department', 'Role', 'Date', 'Shift', 'Clock In', 'Clock Out', 'Work Hours', 'Status', 'Terminal', 'Remarks'];
    const rows = filteredDailyList.map((item) => [
      `"${item.employeeCode}"`,
      `"${item.employeeName}"`,
      `"${item.department}"`,
      `"${item.role}"`,
      `"${item.date}"`,
      `"${item.shift}"`,
      `"${item.checkIn}"`,
      `"${item.checkOut}"`,
      `"${item.workHours}"`,
      `"${item.status}"`,
      `"${item.punchLocation}"`,
      `"${(item.remarks || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `MAK_Staff_Attendance_${selectedDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%', maxWidth: '1440px', margin: '0 auto' }}>
      {/* Top Breadcrumbs */}
      <div>
        <Breadcrumbs portal="admin" />
      </div>

      {/* Page Title & Interactive Date Control Strip */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          padding: '1.25rem 1.5rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.25rem' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                fontSize: '0.75rem',
                fontWeight: 800,
                color: '#2C3480',
                backgroundColor: '#EEF0FD',
                padding: '0.2rem 0.65rem',
                borderRadius: '6px',
                textTransform: 'uppercase',
                letterSpacing: '0.04em'
              }}
            >
              <CalendarCheck size={14} /> Biometric Punch Records
            </span>
            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>&bull; Real-time Attendance Operations</span>
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#090d16', margin: 0, letterSpacing: '-0.02em' }}>
            Staff Attendance &amp; Shift Duty Logs
          </h1>
          <p style={{ fontSize: '0.875rem', color: '#64748b', margin: '0.25rem 0 0' }}>
            Automated biometric attendance verification, shift rotas, and leave authorizations for operational &amp; admin staff.
          </p>
        </div>

        {/* Date Selector & Primary Action Buttons */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.75rem' }}>
          {/* Day Navigation Controls */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              backgroundColor: '#f8fafc',
              border: '1px solid #cbd5e1',
              borderRadius: '10px',
              padding: '0.25rem 0.35rem',
              gap: '0.25rem'
            }}
          >
            <button
              onClick={() => changeDateBy(-1)}
              title="Previous Day"
              style={{
                border: 'none',
                background: 'transparent',
                padding: '0.4rem',
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                color: '#334155'
              }}
            >
              <ChevronLeft size={16} />
            </button>

            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              style={{
                border: 'none',
                background: 'transparent',
                fontFamily: 'inherit',
                fontSize: '0.85rem',
                fontWeight: 700,
                color: '#0f172a',
                padding: '0.25rem 0.4rem',
                cursor: 'pointer',
                outline: 'none'
              }}
            />

            <button
              onClick={() => changeDateBy(1)}
              title="Next Day"
              style={{
                border: 'none',
                background: 'transparent',
                padding: '0.4rem',
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                color: '#334155'
              }}
            >
              <ChevronRight size={16} />
            </button>

            <button
              onClick={() => setSelectedDate(new Date().toISOString().substring(0, 10))}
              style={{
                border: 'none',
                backgroundColor: selectedDate === new Date().toISOString().substring(0, 10) ? '#2C3480' : '#e2e8f0',
                color: selectedDate === new Date().toISOString().substring(0, 10) ? '#ffffff' : '#334155',
                padding: '0.3rem 0.65rem',
                borderRadius: '6px',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: 'pointer',
                marginLeft: '0.25rem'
              }}
            >
              Today
            </button>
          </div>

          {/* Action Buttons */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            leftIcon={<Download size={14} />}
            style={{ fontWeight: 700 }}
          >
            Export Register
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/admin/payroll')}
            leftIcon={<Banknote size={14} color="#2C3480" />}
            style={{ fontWeight: 700, borderColor: '#C7D2FE', color: '#2C3480', backgroundColor: '#EEF0FD' }}
          >
            Payroll System &rarr;
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsBulkModalOpen(true)}
            leftIcon={<Sparkles size={14} color="#2C3480" />}
            style={{ fontWeight: 700 }}
          >
            Clock-In All Staff
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsLeaveModalOpen(true)}
            leftIcon={<Plus size={14} />}
            style={{ backgroundColor: '#2C3480', borderColor: '#2C3480', fontWeight: 800 }}
          >
            Apply Staff Leave
          </Button>
        </div>
      </div>

      {/* KPI Overview Metrics Strip (Straight Rectangle Cards) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        {/* Total Staff */}
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            padding: '1.15rem 1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
          }}
        >
          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Total Staff On Roster
            </span>
            <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#090d16', marginTop: '0.25rem' }}>
              {metrics.total}
            </div>
            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
              {metrics.markedStaff || 0} Marked &bull; {metrics.notMarked || 0} Pending
            </span>
          </div>
          <div style={{ width: '44px', height: '44px', borderRadius: '10px', backgroundColor: '#EEF0FD', color: '#2C3480', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Users size={22} />
          </div>
        </div>

        {/* Present Today */}
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #bbf7d0',
            borderLeft: '4px solid #16a34a',
            padding: '1.15rem 1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
          }}
        >
          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#15803d', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Present Today
            </span>
            <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#15803d', marginTop: '0.25rem' }}>
              {metrics.present}
            </div>
            <span style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: 700 }}>
              {metrics.attendanceRate}% Marked Attendance Rate
            </span>
          </div>
          <div style={{ width: '44px', height: '44px', borderRadius: '10px', backgroundColor: '#f0fdf4', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CheckCircle2 size={22} />
          </div>
        </div>

        {/* Late Arrivals */}
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #fde68a',
            borderLeft: '4px solid #d97706',
            padding: '1.15rem 1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
          }}
        >
          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#b45309', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Late Arrivals
            </span>
            <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#b45309', marginTop: '0.25rem' }}>
              {metrics.late}
            </div>
            <span style={{ fontSize: '0.75rem', color: '#b45309' }}>Beyond grace time (+15m)</span>
          </div>
          <div style={{ width: '44px', height: '44px', borderRadius: '10px', backgroundColor: '#fffbeb', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Clock3 size={22} />
          </div>
        </div>

        {/* Half Day */}
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #bfdbfe',
            borderLeft: '4px solid #2563eb',
            padding: '1.15rem 1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
          }}
        >
          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#1d4ed8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Half Day Session
            </span>
            <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#1d4ed8', marginTop: '0.25rem' }}>
              {metrics.halfDay}
            </div>
            <span style={{ fontSize: '0.75rem', color: '#2563eb' }}>4 Hours Shift Approved</span>
          </div>
          <div style={{ width: '44px', height: '44px', borderRadius: '10px', backgroundColor: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Clock size={22} />
          </div>
        </div>

        {/* On Approved Leave */}
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #e9d5ff',
            borderLeft: '4px solid #9333ea',
            padding: '1.15rem 1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
          }}
        >
          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#7e22ce', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              On Approved Leave
            </span>
            <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#7e22ce', marginTop: '0.25rem' }}>
              {metrics.onLeave}
            </div>
            <span style={{ fontSize: '0.75rem', color: '#9333ea' }}>Casual / Medical leaves</span>
          </div>
          <div style={{ width: '44px', height: '44px', borderRadius: '10px', backgroundColor: '#faf5ff', color: '#9333ea', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CalendarDays size={22} />
          </div>
        </div>

        {/* Absent / Unmarked */}
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #fecaca',
            borderLeft: '4px solid #dc2626',
            padding: '1.15rem 1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
          }}
        >
          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#b91c1c', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Absent / Unpunched
            </span>
            <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#b91c1c', marginTop: '0.25rem' }}>
              {metrics.absent}
            </div>
            <span style={{ fontSize: '0.75rem', color: '#dc2626' }}>Requires Regularization</span>
          </div>
          <div style={{ width: '44px', height: '44px', borderRadius: '10px', backgroundColor: '#fef2f2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <AlertCircle size={22} />
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.5rem',
          borderBottom: '1px solid #e2e8f0',
          paddingBottom: '0.5rem'
        }}
      >
        <button
          onClick={() => setActiveTab('daily')}
          style={{
            padding: '0.625rem 1.25rem',
            borderRadius: '8px',
            border: 'none',
            backgroundColor: activeTab === 'daily' ? '#2C3480' : 'transparent',
            color: activeTab === 'daily' ? '#ffffff' : '#64748b',
            fontWeight: 700,
            fontSize: '0.875rem',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            transition: 'all 0.15s ease'
          }}
        >
          <CalendarCheck size={16} /> Daily Shift Register ({dailyAttendanceList.length})
        </button>

        <button
          onClick={() => setActiveTab('matrix')}
          style={{
            padding: '0.625rem 1.25rem',
            borderRadius: '8px',
            border: 'none',
            backgroundColor: activeTab === 'matrix' ? '#2C3480' : 'transparent',
            color: activeTab === 'matrix' ? '#ffffff' : '#64748b',
            fontWeight: 700,
            fontSize: '0.875rem',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            transition: 'all 0.15s ease'
          }}
        >
          <Layers size={16} /> Monthly Staff Matrix
        </button>

        <button
          onClick={() => setActiveTab('leaves')}
          style={{
            padding: '0.625rem 1.25rem',
            borderRadius: '8px',
            border: 'none',
            backgroundColor: activeTab === 'leaves' ? '#2C3480' : 'transparent',
            color: activeTab === 'leaves' ? '#ffffff' : '#64748b',
            fontWeight: 700,
            fontSize: '0.875rem',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            transition: 'all 0.15s ease'
          }}
        >
          <CalendarDays size={16} /> Leave Approvals
          {((driverLeaveRequests || []).filter((l) => l.status === 'Under Review' || l.status === 'Pending').length + staffLeaveRequests.filter((l) => l.status === 'Pending').length) > 0 ? (
            <span style={{ backgroundColor: '#ef4444', color: '#ffffff', padding: '0.1rem 0.5rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 800 }}>
              {((driverLeaveRequests || []).filter((l) => l.status === 'Under Review' || l.status === 'Pending').length + staffLeaveRequests.filter((l) => l.status === 'Pending').length)} Pending
            </span>
          ) : (
            <span style={{ color: activeTab === 'leaves' ? '#c7cefa' : '#94a3b8', fontSize: '0.75rem' }}>(0)</span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('roster')}
          style={{
            padding: '0.625rem 1.25rem',
            borderRadius: '8px',
            border: 'none',
            backgroundColor: activeTab === 'roster' ? '#2C3480' : 'transparent',
            color: activeTab === 'roster' ? '#ffffff' : '#64748b',
            fontWeight: 700,
            fontSize: '0.875rem',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            transition: 'all 0.15s ease'
          }}
        >
          <Briefcase size={16} /> Shift Roster Coverage
        </button>
      </div>

      {/* ========================================================
          TAB 1: DAILY ATTENDANCE REGISTER
          ======================================================== */}
      {activeTab === 'daily' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Search, Filter Toolbar & View Switcher */}
          <Card>
            <CardBody style={{ padding: '1rem 1.25rem' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', flex: 1, minWidth: '300px' }}>
                  {/* Search */}
                  <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
                    <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                    <input
                      type="text"
                      placeholder="Search staff by name, #MAK-EMP code, role..."
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

                  {/* Department filter */}
                  <select
                    value={departmentFilter}
                    onChange={(e) => setDepartmentFilter(e.target.value)}
                    style={{
                      padding: '0.55rem 0.85rem',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.875rem',
                      backgroundColor: '#ffffff'
                    }}
                  >
                    {departments.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>

                  {/* Status filter */}
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    style={{
                      padding: '0.55rem 0.85rem',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.875rem',
                      backgroundColor: '#ffffff'
                    }}
                  >
                    <option value="All">All Attendance Statuses</option>
                    <option value="Not Marked">Not Marked (Pending Admin)</option>
                    <option value="Present">Present</option>
                    <option value="Late">Late Arrival</option>
                    <option value="Half Day">Half Day</option>
                    <option value="On Leave">On Leave</option>
                    <option value="Absent">Absent</option>
                  </select>

                  {/* Shift filter */}
                  <select
                    value={shiftFilter}
                    onChange={(e) => setShiftFilter(e.target.value)}
                    style={{
                      padding: '0.55rem 0.85rem',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.875rem',
                      backgroundColor: '#ffffff'
                    }}
                  >
                    <option value="All">All Shifts</option>
                    <option value="General">General (09:30 - 18:30)</option>
                    <option value="Morning">Morning Shift (06:00 - 15:00)</option>
                    <option value="Night">Night Shift (21:00 - 06:00)</option>
                  </select>
                </div>

                {/* View Switcher: Cards vs Table */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ fontSize: '0.8125rem', color: '#64748b', marginRight: '0.5rem' }}>
                    Showing <strong>{filteredDailyList.length}</strong> of {dailyAttendanceList.length} staff
                  </div>

                  <div style={{ display: 'inline-flex', backgroundColor: '#f1f5f9', borderRadius: '8px', padding: '0.2rem' }}>
                    <button
                      onClick={() => setViewMode('cards')}
                      style={{
                        padding: '0.35rem 0.65rem',
                        border: 'none',
                        borderRadius: '6px',
                        backgroundColor: viewMode === 'cards' ? '#2C3480' : 'transparent',
                        color: viewMode === 'cards' ? '#ffffff' : '#64748b',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      Cards
                    </button>
                    <button
                      onClick={() => setViewMode('table')}
                      style={{
                        padding: '0.35rem 0.65rem',
                        border: 'none',
                        borderRadius: '6px',
                        backgroundColor: viewMode === 'table' ? '#2C3480' : 'transparent',
                        color: viewMode === 'table' ? '#ffffff' : '#64748b',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      Register Table
                    </button>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* VIEW MODE 1: STRAIGHT RECTANGULAR CARDS */}
          {viewMode === 'cards' ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.25rem' }}>
              {filteredDailyList.length === 0 ? (
                <div style={{ gridColumn: '1 / -1', padding: '3.5rem', textAlign: 'center', backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                  <Users size={44} style={{ color: '#cbd5e1', margin: '0 auto 0.75rem' }} />
                  <p style={{ fontWeight: 700, color: '#334155', fontSize: '1rem' }}>No staff attendance records match the selected filters.</p>
                  <p style={{ color: '#64748b', fontSize: '0.8125rem' }}>Try clearing the search or changing the department/status filter.</p>
                </div>
              ) : (
                filteredDailyList.map((item) => {
                  const deptTheme = getDeptColor(item.department);
                  const statusInfo = getStatusBadge(item.status);

                  return (
                    <div
                      key={item.employeeId}
                      style={{
                        backgroundColor: '#ffffff',
                        borderRadius: '14px',
                        border: '1px solid #e2e8f0',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.03)',
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden',
                        transition: 'transform 0.15s, box-shadow 0.15s, border-color 0.15s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 8px 16px -4px rgba(0,0,0,0.06)';
                        e.currentTarget.style.borderColor = '#cbd5e1';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'none';
                        e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.03)';
                        e.currentTarget.style.borderColor = '#e2e8f0';
                      }}
                    >
                      {/* Top Header Strip: Department pill & Status Badge */}
                      <div
                        style={{
                          padding: '0.75rem 1rem',
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
                            padding: '0.2rem 0.55rem',
                            borderRadius: '6px',
                            backgroundColor: deptTheme.bg,
                            color: deptTheme.text,
                            border: `1px solid ${deptTheme.border}`
                          }}
                        >
                          {item.department}
                        </span>

                        <div
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            color: statusInfo.color,
                            backgroundColor: statusInfo.bg,
                            padding: '0.2rem 0.55rem',
                            borderRadius: '6px',
                            border: `1px solid ${statusInfo.border}`
                          }}
                        >
                          <span
                            style={{
                              width: '7px',
                              height: '7px',
                              borderRadius: '50%',
                              backgroundColor: statusInfo.dot,
                              display: 'inline-block'
                            }}
                          />
                          {statusInfo.label}
                        </div>
                      </div>

                      {/* Main Staff Body */}
                      <div style={{ padding: '1.25rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                        {/* Profile Info */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                          <EmployeeAvatar
                            avatar={item.avatar}
                            name={item.employeeName}
                            size={46}
                            borderRadius="12px"
                            fontSize="1.1rem"
                          />

                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                              <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {item.employeeName}
                              </h3>
                              <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b', fontFamily: 'monospace' }}>
                                #{item.employeeCode}
                              </span>
                            </div>
                            <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#475569', margin: '0.15rem 0 0' }}>
                              {item.role}
                            </p>
                          </div>
                        </div>

                        {/* Punch Timings & Shift Strip */}
                        <div
                          style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(3, 1fr)',
                            backgroundColor: '#f8fafc',
                            borderRadius: '10px',
                            border: '1px solid #f1f5f9',
                            padding: '0.625rem 0.5rem',
                            textAlign: 'center',
                            gap: '0.25rem'
                          }}
                        >
                          <div>
                            <span style={{ fontSize: '0.675rem', fontWeight: 700, color: '#64748b', display: 'block', textTransform: 'uppercase' }}>
                              CLOCK IN
                            </span>
                            <span
                              style={{
                                fontSize: '0.85rem',
                                fontWeight: 800,
                                color: item.status === 'Late' ? '#d97706' : item.checkIn !== '--:--' ? '#15803d' : '#94a3b8'
                              }}
                            >
                              {item.checkIn}
                            </span>
                          </div>

                          <div style={{ borderLeft: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0' }}>
                            <span style={{ fontSize: '0.675rem', fontWeight: 700, color: '#64748b', display: 'block', textTransform: 'uppercase' }}>
                              CLOCK OUT
                            </span>
                            <span style={{ fontSize: '0.85rem', fontWeight: 800, color: item.checkOut !== '--:--' ? '#0f172a' : '#94a3b8' }}>
                              {item.checkOut}
                            </span>
                          </div>

                          <div>
                            <span style={{ fontSize: '0.675rem', fontWeight: 700, color: '#64748b', display: 'block', textTransform: 'uppercase' }}>
                              TOTAL HOURS
                            </span>
                            <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#2C3480' }}>
                              {item.workHours}
                            </span>
                          </div>
                        </div>

                        {/* Shift & Terminal Location */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.775rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#64748b' }}>
                            <span>Assigned Shift:</span>
                            <strong style={{ color: '#0f172a' }}>{item.shift}</strong>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#64748b' }}>
                            <span>Punch Terminal:</span>
                            <span style={{ color: '#334155', fontWeight: 600 }}>{item.punchLocation}</span>
                          </div>
                          {item.remarks && (
                            <div
                              style={{
                                backgroundColor: !item.isMarked ? '#f1f5f9' : '#fffbeb',
                                border: `1px solid ${!item.isMarked ? '#e2e8f0' : '#fef3c7'}`,
                                borderRadius: '6px',
                                padding: '0.35rem 0.55rem',
                                fontSize: '0.75rem',
                                color: !item.isMarked ? '#64748b' : '#92400e',
                                marginTop: '0.2rem'
                              }}
                            >
                              <strong>Note:</strong> {item.remarks}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Card Footer: 1-Click Fast Status Pills & Edit */}
                      <div
                        style={{
                          padding: '0.75rem 1rem',
                          backgroundColor: '#f8fafc',
                          borderTop: '1px solid #f1f5f9',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '0.5rem'
                        }}
                      >
                        {/* 1-Click Quick Toggle Pills */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', flexWrap: 'wrap' }}>
                          {(() => {
                            const isPresent = item.isMarked && (item.status === 'Present' || item.status?.startsWith('Present'));
                            const isLate = item.isMarked && (item.status === 'Late' || item.status?.includes('Late'));
                            const isHalfDay = item.isMarked && item.status === 'Half Day';
                            const isOnLeave = item.isMarked && (item.status === 'Paid Leave' || item.status === 'On Leave');
                            const isUnpaid = item.isMarked && item.status === 'Unpaid Leave';
                            const isAbsent = item.isMarked && item.status === 'Absent';
                            const isWeekOff = item.isMarked && item.status === 'Weekly Off';

                            return (
                              <>
                                <button
                                  onClick={() => handleQuickStatus(item.employeeId, 'Present')}
                                  title="Mark Present (On Time)"
                                  style={{
                                    padding: '0.2rem 0.45rem',
                                    borderRadius: '5px',
                                    border: isPresent ? '1px solid #16a34a' : '1px solid #cbd5e1',
                                    backgroundColor: isPresent ? '#16a34a' : '#ffffff',
                                    color: isPresent ? '#ffffff' : '#334155',
                                    fontSize: '0.7rem',
                                    fontWeight: 800,
                                    cursor: 'pointer'
                                  }}
                                >
                                  P
                                </button>

                                <button
                                  onClick={() => handleQuickStatus(item.employeeId, 'Late')}
                                  title="Mark Late Arrival (+25m)"
                                  style={{
                                    padding: '0.2rem 0.45rem',
                                    borderRadius: '5px',
                                    border: isLate ? '1px solid #d97706' : '1px solid #cbd5e1',
                                    backgroundColor: isLate ? '#d97706' : '#ffffff',
                                    color: isLate ? '#ffffff' : '#334155',
                                    fontSize: '0.7rem',
                                    fontWeight: 800,
                                    cursor: 'pointer'
                                  }}
                                >
                                  L
                                </button>

                                <button
                                  onClick={() => handleQuickStatus(item.employeeId, 'Half Day')}
                                  title="Mark Half Day (0.5x)"
                                  style={{
                                    padding: '0.2rem 0.45rem',
                                    borderRadius: '5px',
                                    border: isHalfDay ? '1px solid #2563eb' : '1px solid #cbd5e1',
                                    backgroundColor: isHalfDay ? '#2563eb' : '#ffffff',
                                    color: isHalfDay ? '#ffffff' : '#334155',
                                    fontSize: '0.7rem',
                                    fontWeight: 800,
                                    cursor: 'pointer'
                                  }}
                                >
                                  HD
                                </button>

                                <button
                                  onClick={() => handleQuickStatus(item.employeeId, 'Paid Leave')}
                                  title="Mark Approved Paid Leave"
                                  style={{
                                    padding: '0.2rem 0.45rem',
                                    borderRadius: '5px',
                                    border: isOnLeave ? '1px solid #9333ea' : '1px solid #cbd5e1',
                                    backgroundColor: isOnLeave ? '#9333ea' : '#ffffff',
                                    color: isOnLeave ? '#ffffff' : '#334155',
                                    fontSize: '0.7rem',
                                    fontWeight: 800,
                                    cursor: 'pointer'
                                  }}
                                >
                                  OL
                                </button>

                                <button
                                  onClick={() => handleQuickStatus(item.employeeId, 'Unpaid Leave')}
                                  title="Mark Unpaid Leave (Deductible)"
                                  style={{
                                    padding: '0.2rem 0.45rem',
                                    borderRadius: '5px',
                                    border: isUnpaid ? '1px solid #ea580c' : '1px solid #cbd5e1',
                                    backgroundColor: isUnpaid ? '#ea580c' : '#ffffff',
                                    color: isUnpaid ? '#ffffff' : '#334155',
                                    fontSize: '0.7rem',
                                    fontWeight: 800,
                                    cursor: 'pointer'
                                  }}
                                >
                                  UL
                                </button>

                                <button
                                  onClick={() => handleQuickStatus(item.employeeId, 'Absent')}
                                  title="Mark Absent"
                                  style={{
                                    padding: '0.2rem 0.45rem',
                                    borderRadius: '5px',
                                    border: isAbsent ? '1px solid #dc2626' : '1px solid #cbd5e1',
                                    backgroundColor: isAbsent ? '#dc2626' : '#ffffff',
                                    color: isAbsent ? '#ffffff' : '#334155',
                                    fontSize: '0.7rem',
                                    fontWeight: 800,
                                    cursor: 'pointer'
                                  }}
                                >
                                  A
                                </button>

                                <button
                                  onClick={() => handleQuickStatus(item.employeeId, 'Weekly Off')}
                                  title="Mark Weekly Off"
                                  style={{
                                    padding: '0.2rem 0.45rem',
                                    borderRadius: '5px',
                                    border: isWeekOff ? '1px solid #475569' : '1px solid #cbd5e1',
                                    backgroundColor: isWeekOff ? '#475569' : '#ffffff',
                                    color: isWeekOff ? '#ffffff' : '#334155',
                                    fontSize: '0.7rem',
                                    fontWeight: 800,
                                    cursor: 'pointer'
                                  }}
                                >
                                  WO
                                </button>
                              </>
                            );
                          })()}
                        </div>

                        {/* Detailed Edit Action */}
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={() => handleOpenEdit(item)}
                          leftIcon={<Edit2 size={12} />}
                          style={{ color: '#2C3480', fontWeight: 700 }}
                        >
                          Edit Punch
                        </Button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          ) : (
            /* VIEW MODE 2: REGISTER TABLE */
            <Card>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
                      <th style={{ padding: '0.75rem 1rem', fontWeight: 700, color: '#475569' }}>Staff Member</th>
                      <th style={{ padding: '0.75rem 1rem', fontWeight: 700, color: '#475569' }}>Department</th>
                      <th style={{ padding: '0.75rem 1rem', fontWeight: 700, color: '#475569' }}>Shift &amp; Duty</th>
                      <th style={{ padding: '0.75rem 1rem', fontWeight: 700, color: '#475569' }}>Status</th>
                      <th style={{ padding: '0.75rem 1rem', fontWeight: 700, color: '#475569' }}>In Time</th>
                      <th style={{ padding: '0.75rem 1rem', fontWeight: 700, color: '#475569' }}>Out Time</th>
                      <th style={{ padding: '0.75rem 1rem', fontWeight: 700, color: '#475569' }}>Work Hours</th>
                      <th style={{ padding: '0.75rem 1rem', fontWeight: 700, color: '#475569' }}>Punch Terminal</th>
                      <th style={{ padding: '0.75rem 1rem', fontWeight: 700, color: '#475569', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDailyList.map((item) => {
                      const statusInfo = getStatusBadge(item.status);
                      const deptTheme = getDeptColor(item.department);

                      return (
                        <tr key={item.employeeId} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background-color 0.15s' }}>
                          <td style={{ padding: '0.75rem 1rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                              <EmployeeAvatar
                                avatar={item.avatar}
                                name={item.employeeName}
                                size={36}
                                borderRadius="8px"
                                fontSize="0.85rem"
                              />
                              <div>
                                <strong style={{ color: '#0f172a', display: 'block' }}>{item.employeeName}</strong>
                                <span style={{ fontSize: '0.75rem', color: '#64748b', fontFamily: 'monospace' }}>#{item.employeeCode}</span>
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: '0.75rem 1rem' }}>
                            <span
                              style={{
                                fontSize: '0.725rem',
                                fontWeight: 700,
                                padding: '0.2rem 0.55rem',
                                borderRadius: '6px',
                                backgroundColor: deptTheme.bg,
                                color: deptTheme.text,
                                border: `1px solid ${deptTheme.border}`
                              }}
                            >
                              {item.department}
                            </span>
                          </td>
                          <td style={{ padding: '0.75rem 1rem', fontSize: '0.8125rem', color: '#334155' }}>
                            {item.shift}
                          </td>
                          <td style={{ padding: '0.75rem 1rem' }}>
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.35rem',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                color: statusInfo.color,
                                backgroundColor: statusInfo.bg,
                                padding: '0.2rem 0.55rem',
                                borderRadius: '6px',
                                border: `1px solid ${statusInfo.border}`
                              }}
                            >
                              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: statusInfo.dot }} />
                              {statusInfo.label}
                            </span>
                          </td>
                          <td style={{ padding: '0.75rem 1rem', fontWeight: 700, color: item.status === 'Late' ? '#d97706' : '#15803d' }}>
                            {item.checkIn}
                          </td>
                          <td style={{ padding: '0.75rem 1rem', color: '#0f172a', fontWeight: 600 }}>
                            {item.checkOut}
                          </td>
                          <td style={{ padding: '0.75rem 1rem', fontWeight: 700, color: '#2C3480' }}>
                            {item.workHours}
                          </td>
                          <td style={{ padding: '0.75rem 1rem', fontSize: '0.8rem', color: '#64748b' }}>
                            {item.punchLocation}
                          </td>
                          <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                            <Button variant="ghost" size="xs" onClick={() => handleOpenEdit(item)}>
                              Adjust
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* ========================================================
          TAB 2: MONTHLY STAFF ATTENDANCE MATRIX
          ======================================================== */}
      {activeTab === 'matrix' && (() => {
        const [mYear, mMonth] = (selectedDate || '2026-11-01').split('-').map((v) => parseInt(v, 10));
        const daysInCurrentMonth = new Date(mYear, mMonth, 0).getDate();
        const monthName = new Date(mYear, mMonth - 1, 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
        const todayStr = new Date().toISOString().substring(0, 10);

        return (
          <Card>
            <CardHeader
              title={`Monthly Staff Attendance Matrix (${monthName})`}
              subtitle="Complete calendar grid view of all personnel daily biometric compliance and shift records."
            />
            <CardBody style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Legend */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', backgroundColor: '#f8fafc', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase' }}>LEGEND:</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', color: '#16a34a', fontWeight: 700 }}>
                  <span style={{ width: '18px', height: '18px', borderRadius: '4px', backgroundColor: '#dcfce7', border: '1px solid #86efac', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>P</span> Present
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', color: '#d97706', fontWeight: 700 }}>
                  <span style={{ width: '18px', height: '18px', borderRadius: '4px', backgroundColor: '#fef3c7', border: '1px solid #fde68a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>L</span> Late
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', color: '#2563eb', fontWeight: 700 }}>
                  <span style={{ width: '18px', height: '18px', borderRadius: '4px', backgroundColor: '#dbeafe', border: '1px solid #bfdbfe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>HD</span> Half Day
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', color: '#9333ea', fontWeight: 700 }}>
                  <span style={{ width: '18px', height: '18px', borderRadius: '4px', backgroundColor: '#f3e8ff', border: '1px solid #e9d5ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>OL</span> On Leave
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', color: '#ea580c', fontWeight: 700 }}>
                  <span style={{ width: '18px', height: '18px', borderRadius: '4px', backgroundColor: '#fff7ed', border: '1px solid #fed7aa', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>UL</span> Unpaid
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', color: '#dc2626', fontWeight: 700 }}>
                  <span style={{ width: '18px', height: '18px', borderRadius: '4px', backgroundColor: '#fee2e2', border: '1px solid #fca5a5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>A</span> Absent
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', color: '#64748b', fontWeight: 700 }}>
                  <span style={{ width: '18px', height: '18px', borderRadius: '4px', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>WO</span> Week Off
                </span>
              </div>

              {/* Matrix Table */}
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0', textAlign: 'center' }}>
                      <th style={{ padding: '0.65rem 0.75rem', textAlign: 'left', minWidth: '180px', color: '#334155', fontWeight: 800 }}>Staff Name</th>
                      <th style={{ padding: '0.65rem 0.5rem', textAlign: 'left', minWidth: '130px', color: '#334155', fontWeight: 800 }}>Department</th>
                      {Array.from({ length: daysInCurrentMonth }, (_, i) => i + 1).map((day) => {
                        const dayDateStr = `${mYear}-${String(mMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                        const isToday = dayDateStr === todayStr;
                        return (
                          <th
                            key={day}
                            style={{
                              padding: '0.5rem 0.2rem',
                              minWidth: '26px',
                              backgroundColor: isToday ? '#EEF0FD' : 'transparent',
                              color: isToday ? '#2C3480' : '#475569',
                              fontWeight: 800
                            }}
                          >
                            {day}
                          </th>
                        );
                      })}
                      <th style={{ padding: '0.5rem 0.75rem', color: '#16a34a', fontWeight: 800 }}>Present</th>
                      <th style={{ padding: '0.5rem 0.75rem', color: '#9333ea', fontWeight: 800 }}>Leave</th>
                      <th style={{ padding: '0.5rem 0.75rem', color: '#dc2626', fontWeight: 800 }}>Absent</th>
                    </tr>
                  </thead>
                  <tbody>
                    {employees.map((emp) => {
                      const norm = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
                      const empCodes = [norm(emp.id), norm(emp.code), norm(emp.employeeCode), norm(emp._id), norm(emp.driverId)].filter(Boolean);
                      const empNames = [norm(emp.fullName), norm(emp.name)].filter(Boolean);

                      // Pre-calculate status for every day in month
                      const daysData = Array.from({ length: daysInCurrentMonth }, (_, i) => i + 1).map((day) => {
                        const dObj = new Date(mYear, mMonth - 1, day);
                        const isSunday = dObj.getDay() === 0;
                        const dayDateStr = `${mYear}-${String(mMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                        const isToday = dayDateStr === todayStr;

                        const attRecord = (staffAttendance || []).find((a) => {
                          if (a.date !== dayDateStr) return false;
                          const aCodes = [norm(a.employeeId), norm(a.employeeCode), norm(a.driverId)].filter(Boolean);
                          const aNames = [norm(a.employeeName)].filter(Boolean);
                          const codeMatch = empCodes.some((c) => aCodes.some((ac) => ac === c || ac.endsWith(c) || c.endsWith(ac)));
                          const nameMatch = empNames.some((n) => aNames.some((an) => an === n));
                          return codeMatch || nameMatch;
                        });

                        let code = '-';
                        let bg = '#f8fafc';
                        let text = '#94a3b8';

                        if (attRecord) {
                          const st = String(attRecord.status || '').toLowerCase();
                          if (st === 'not marked' || st === 'pending') {
                            code = '-'; bg = '#f8fafc'; text = '#94a3b8';
                          } else if (st.includes('present')) {
                            code = 'P'; bg = '#dcfce7'; text = '#15803d';
                          } else if (st.includes('late')) {
                            code = 'L'; bg = '#fef3c7'; text = '#d97706';
                          } else if (st.includes('half day')) {
                            code = 'HD'; bg = '#dbeafe'; text = '#2563eb';
                          } else if (st.includes('paid leave') || st.includes('on leave') || st === 'leave') {
                            code = 'OL'; bg = '#f3e8ff'; text = '#9333ea';
                          } else if (st.includes('unpaid')) {
                            code = 'UL'; bg = '#fff7ed'; text = '#ea580c';
                          } else if (st.includes('absent')) {
                            code = 'A'; bg = '#fee2e2'; text = '#dc2626';
                          } else if (st.includes('weekly off')) {
                            code = 'WO'; bg = '#f1f5f9'; text = '#64748b';
                          } else if (st.includes('holiday')) {
                            code = 'PH'; bg = '#fee2e2'; text = '#991b1b';
                          }
                        } else if (isSunday) {
                          code = 'WO'; bg = '#f1f5f9'; text = '#64748b';
                        } else {
                          code = '-'; bg = '#f8fafc'; text = '#94a3b8';
                        }

                        return { day, code, bg, text, isToday };
                      });

                      // Dynamic row metrics
                      let rowPresent = 0;
                      let rowLeave = 0;
                      let rowAbsent = 0;
                      daysData.forEach((d) => {
                        if (d.code === 'P' || d.code === 'L') rowPresent += 1;
                        else if (d.code === 'HD') rowPresent += 0.5;
                        else if (d.code === 'OL') rowLeave += 1;
                        else if (d.code === 'A' || d.code === 'UL') rowAbsent += 1;
                      });

                      return (
                        <tr key={emp.id || emp.employeeCode} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '0.6rem 0.75rem', fontWeight: 700, color: '#0f172a' }}>
                            <div>{emp.fullName || emp.name}</div>
                            <span style={{ fontSize: '0.65rem', color: '#64748b', fontFamily: 'monospace' }}>#{emp.employeeCode || emp.code || emp.id}</span>
                          </td>
                          <td style={{ padding: '0.6rem 0.5rem', color: '#475569' }}>
                            {emp.department}
                          </td>
                          {daysData.map((d) => (
                            <td key={d.day} style={{ padding: '0.35rem 0.15rem', textAlign: 'center', backgroundColor: d.isToday ? '#EEF0FD' : 'transparent' }}>
                              <span
                                style={{
                                  display: 'inline-flex',
                                  width: '24px',
                                  height: '24px',
                                  borderRadius: '4px',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  backgroundColor: d.bg,
                                  color: d.text,
                                  fontWeight: 800,
                                  fontSize: '0.65rem',
                                  border: d.isToday ? '1.5px solid #2C3480' : 'none'
                                }}
                              >
                                {d.code}
                              </span>
                            </td>
                          ))}
                          <td style={{ padding: '0.6rem 0.75rem', textAlign: 'center', fontWeight: 800, color: '#15803d' }}>
                            {rowPresent}
                          </td>
                          <td style={{ padding: '0.6rem 0.75rem', textAlign: 'center', fontWeight: 800, color: '#9333ea' }}>
                            {rowLeave}
                          </td>
                          <td style={{ padding: '0.6rem 0.75rem', textAlign: 'center', fontWeight: 800, color: '#dc2626' }}>
                            {rowAbsent}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardBody>
          </Card>
        );
      })()}

      {/* ========================================================
          TAB 3: LEAVE APPLICATIONS & AUTHORIZATIONS
          ======================================================== */}
      {activeTab === 'leaves' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Sub-filter Navigation Pills */}
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', backgroundColor: '#ffffff', padding: '0.875rem 1.25rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
              <button
                type="button"
                onClick={() => setLeaveScope('all')}
                style={{
                  padding: '0.45rem 0.95rem',
                  borderRadius: '20px',
                  border: '1px solid',
                  borderColor: leaveScope === 'all' ? '#2C3480' : '#e2e8f0',
                  backgroundColor: leaveScope === 'all' ? '#2C3480' : '#ffffff',
                  color: leaveScope === 'all' ? '#ffffff' : '#475569',
                  fontSize: '0.8125rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  transition: 'all 0.15s ease'
                }}
              >
                All Applications ({(driverLeaveRequests || []).length + (staffLeaveRequests || []).length})
              </button>

              <button
                type="button"
                onClick={() => setLeaveScope('drivers')}
                style={{
                  padding: '0.45rem 0.95rem',
                  borderRadius: '20px',
                  border: '1px solid',
                  borderColor: leaveScope === 'drivers' ? '#2C3480' : '#e2e8f0',
                  backgroundColor: leaveScope === 'drivers' ? '#2C3480' : '#ffffff',
                  color: leaveScope === 'drivers' ? '#ffffff' : '#475569',
                  fontSize: '0.8125rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  transition: 'all 0.15s ease'
                }}
              >
                <Car size={14} /> Driver Leave Requests ({(driverLeaveRequests || []).length})
                {(driverLeaveRequests || []).filter((l) => l.status === 'Under Review' || l.status === 'Pending').length > 0 && (
                  <span style={{ backgroundColor: leaveScope === 'drivers' ? '#ffffff' : '#ef4444', color: leaveScope === 'drivers' ? '#ef4444' : '#ffffff', padding: '0.05rem 0.4rem', borderRadius: '999px', fontSize: '0.7rem', fontWeight: 800 }}>
                    {(driverLeaveRequests || []).filter((l) => l.status === 'Under Review' || l.status === 'Pending').length} Pending
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setLeaveScope('staff')}
                style={{
                  padding: '0.45rem 0.95rem',
                  borderRadius: '20px',
                  border: '1px solid',
                  borderColor: leaveScope === 'staff' ? '#2C3480' : '#e2e8f0',
                  backgroundColor: leaveScope === 'staff' ? '#2C3480' : '#ffffff',
                  color: leaveScope === 'staff' ? '#ffffff' : '#475569',
                  fontSize: '0.8125rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  transition: 'all 0.15s ease'
                }}
              >
                <Users size={14} /> Staff &amp; Office Requests ({(staffLeaveRequests || []).length})
                {(staffLeaveRequests || []).filter((l) => l.status === 'Pending').length > 0 && (
                  <span style={{ backgroundColor: leaveScope === 'staff' ? '#ffffff' : '#ef4444', color: leaveScope === 'staff' ? '#ef4444' : '#ffffff', padding: '0.05rem 0.4rem', borderRadius: '999px', fontSize: '0.7rem', fontWeight: 800 }}>
                    {(staffLeaveRequests || []).filter((l) => l.status === 'Pending').length} Pending
                  </span>
                )}
              </button>
            </div>

            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsLeaveModalOpen(true)}
              leftIcon={<Plus size={14} />}
              style={{ backgroundColor: '#2C3480', borderColor: '#2C3480', fontWeight: 800 }}
            >
              Submit Staff Leave
            </Button>
          </div>

          {/* SECTION A: DRIVER LEAVE APPLICATIONS */}
          {(leaveScope === 'all' || leaveScope === 'drivers') && (
            <Card>
              <CardHeader
                title="Driver Planned Leave & Duty Absence Requests"
                subtitle="Review and authorize planned leaves, standby relief, and time-off filed by drivers."
                action={
                  <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#2C3480', backgroundColor: '#eef2ff', padding: '0.25rem 0.75rem', borderRadius: '20px' }}>
                    {(driverLeaveRequests || []).filter((l) => l.status === 'Under Review' || l.status === 'Pending').length} Action Required
                  </span>
                }
              />
              <CardBody style={{ padding: '1.25rem' }}>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
                        <th style={{ padding: '0.75rem 1rem', fontWeight: 700, color: '#475569' }}>Leave ID</th>
                        <th style={{ padding: '0.75rem 1rem', fontWeight: 700, color: '#475569' }}>Driver Member</th>
                        <th style={{ padding: '0.75rem 1rem', fontWeight: 700, color: '#475569' }}>Role / Category</th>
                        <th style={{ padding: '0.75rem 1rem', fontWeight: 700, color: '#475569' }}>Leave Type</th>
                        <th style={{ padding: '0.75rem 1rem', fontWeight: 700, color: '#475569' }}>Duration &amp; Dates</th>
                        <th style={{ padding: '0.75rem 1rem', fontWeight: 700, color: '#475569' }}>Reason</th>
                        <th style={{ padding: '0.75rem 1rem', fontWeight: 700, color: '#475569' }}>Status</th>
                        <th style={{ padding: '0.75rem 1rem', fontWeight: 700, color: '#475569', textAlign: 'right' }}>Authorization</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(driverLeaveRequests || []).length === 0 ? (
                        <tr>
                          <td colSpan={8} style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
                            No driver leave requests found.
                          </td>
                        </tr>
                      ) : (
                        (driverLeaveRequests || []).map((leave) => {
                          const isPending = leave.status === 'Under Review' || leave.status === 'Pending';
                          const isApproved = leave.status === 'Approved';
                          const isCancelled = leave.status === 'Cancelled';

                          return (
                            <tr key={leave.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                              <td style={{ padding: '0.75rem 1rem', fontFamily: 'monospace', fontWeight: 800, color: '#2C3480' }}>
                                {leave.id}
                              </td>
                              <td style={{ padding: '0.75rem 1rem' }}>
                                <strong style={{ color: '#0f172a', display: 'block' }}>{leave.driverName || 'Driver'}</strong>
                                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>#{leave.driverBadge || leave.driverId || 'DRV-001'}</span>
                              </td>
                              <td style={{ padding: '0.75rem 1rem', color: '#475569' }}>
                                {leave.role || 'Senior Tour Driver'}
                              </td>
                              <td style={{ padding: '0.75rem 1rem', fontWeight: 700, color: '#0f172a' }}>
                                {leave.leaveType || 'Planned Leave'}
                              </td>
                              <td style={{ padding: '0.75rem 1rem' }}>
                                <div style={{ fontWeight: 700, color: '#0f172a' }}>{leave.totalDays || 1} Day(s)</div>
                                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                                   {leave.startDate} &rarr; {leave.endDate}
                                </span>
                                {isApproved && leave.approvedDays && leave.approvedDays < leave.totalDays && (
                                  <span style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: 700, display: 'block', marginTop: '0.15rem' }}>
                                    ✓ Approved: {leave.approvedStartDate} to {leave.approvedEndDate} ({leave.approvedDays}d)
                                  </span>
                                )}
                              </td>
                              <td style={{ padding: '0.75rem 1rem', maxWidth: '240px', color: '#475569', fontSize: '0.8125rem' }}>
                                {leave.reason || 'Personal Reason'}
                              </td>
                              <td style={{ padding: '0.75rem 1rem' }}>
                                <Badge variant={isApproved ? 'success' : isPending ? 'warning' : isCancelled ? 'neutral' : 'danger'} dot size="sm">
                                  {isApproved && leave.approvedDays && leave.approvedDays < leave.totalDays
                                    ? `Approved (${leave.approvedDays} of ${leave.totalDays}d)`
                                    : (leave.status || 'Under Review')}
                                </Badge>
                              </td>
                              <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                                {isPending ? (
                                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                    <Button
                                      variant="primary"
                                      size="xs"
                                      style={{ backgroundColor: '#16a34a', borderColor: '#16a34a', fontWeight: 800 }}
                                      onClick={() => handleOpenApproveDriverLeave(leave)}
                                    >
                                      Approve {leave.totalDays > 1 ? `(1-${leave.totalDays}d)` : ''}
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="xs"
                                      style={{ color: '#dc2626', borderColor: '#fca5a5' }}
                                      onClick={() => approveDriverLeave(leave.id, false, 'Declined due to duty assignment schedule')}
                                    >
                                      Reject
                                    </Button>
                                  </div>
                                ) : isCancelled ? (
                                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b' }}>
                                    Cancelled by Driver
                                  </span>
                                ) : (
                                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: isApproved ? '#16a34a' : '#dc2626', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                                    {isApproved ? (
                                      <>
                                        <Check size={14} />{' '}
                                        {leave.approvedDays && leave.approvedDays < leave.totalDays
                                          ? `Approved (${leave.approvedDays} of ${leave.totalDays} Days)`
                                          : 'Approved by Admin'}
                                      </>
                                    ) : (
                                      <><X size={14} /> Rejected</>
                                    )}
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </CardBody>
            </Card>
          )}

          {/* SECTION B: STAFF LEAVE APPLICATIONS */}
          {(leaveScope === 'all' || leaveScope === 'staff') && (
            <Card>
              <CardHeader
                title="Staff Leave Requests & Authorizations"
                subtitle="Review pending leave requests, medical absences, and casual leaves submitted by staff members."
              />
              <CardBody style={{ padding: '1.25rem' }}>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
                        <th style={{ padding: '0.75rem 1rem', fontWeight: 700, color: '#475569' }}>Leave ID</th>
                        <th style={{ padding: '0.75rem 1rem', fontWeight: 700, color: '#475569' }}>Staff Member</th>
                        <th style={{ padding: '0.75rem 1rem', fontWeight: 700, color: '#475569' }}>Department</th>
                        <th style={{ padding: '0.75rem 1rem', fontWeight: 700, color: '#475569' }}>Leave Type</th>
                        <th style={{ padding: '0.75rem 1rem', fontWeight: 700, color: '#475569' }}>Duration &amp; Dates</th>
                        <th style={{ padding: '0.75rem 1rem', fontWeight: 700, color: '#475569' }}>Reason</th>
                        <th style={{ padding: '0.75rem 1rem', fontWeight: 700, color: '#475569' }}>Status</th>
                        <th style={{ padding: '0.75rem 1rem', fontWeight: 700, color: '#475569', textAlign: 'right' }}>Authorization</th>
                      </tr>
                    </thead>
                    <tbody>
                      {staffLeaveRequests.length === 0 ? (
                        <tr>
                          <td colSpan={8} style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
                            No staff leave requests found.
                          </td>
                        </tr>
                      ) : (
                        staffLeaveRequests.map((leave) => {
                          const isPending = leave.status === 'Pending';
                          const isApproved = leave.status === 'Approved';
                          const isCancelled = leave.status === 'Cancelled';

                          return (
                            <tr key={leave.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                              <td style={{ padding: '0.75rem 1rem', fontFamily: 'monospace', fontWeight: 800, color: '#2C3480' }}>
                                {leave.id}
                              </td>
                              <td style={{ padding: '0.75rem 1rem' }}>
                                <strong style={{ color: '#0f172a', display: 'block' }}>{leave.employeeName}</strong>
                                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>#{leave.employeeCode}</span>
                              </td>
                              <td style={{ padding: '0.75rem 1rem', color: '#475569' }}>
                                {leave.department}
                              </td>
                              <td style={{ padding: '0.75rem 1rem', fontWeight: 700, color: '#0f172a' }}>
                                {leave.leaveType}
                              </td>
                              <td style={{ padding: '0.75rem 1rem' }}>
                                <div style={{ fontWeight: 700, color: '#0f172a' }}>{leave.totalDays} Day(s)</div>
                                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                                  {leave.fromDate} &rarr; {leave.toDate}
                                </span>
                              </td>
                              <td style={{ padding: '0.75rem 1rem', maxWidth: '240px', color: '#475569', fontSize: '0.8125rem' }}>
                                {leave.reason}
                              </td>
                              <td style={{ padding: '0.75rem 1rem' }}>
                                <Badge variant={isApproved ? 'success' : isPending ? 'warning' : isCancelled ? 'neutral' : 'danger'} size="sm">
                                  {leave.status}
                                </Badge>
                              </td>
                              <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                                {isPending ? (
                                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                    <Button
                                      variant="primary"
                                      size="xs"
                                      style={{ backgroundColor: '#16a34a', borderColor: '#16a34a', fontWeight: 800 }}
                                      onClick={() => approveStaffLeave(leave.id, true, 'Approved by Operations Lead')}
                                    >
                                      Approve
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="xs"
                                      style={{ color: '#dc2626', borderColor: '#fca5a5' }}
                                      onClick={() => approveStaffLeave(leave.id, false, 'Declined due to duty shortage')}
                                    >
                                      Reject
                                    </Button>
                                  </div>
                                ) : isCancelled ? (
                                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b' }}>
                                    Cancelled by Staff
                                  </span>
                                ) : (
                                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                                    {leave.reviewedBy || 'Admin Desk'}
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </CardBody>
            </Card>
          )}
        </div>
      )}

      {/* ========================================================
          TAB 4: SHIFT ROSTER & TIMINGS COVERAGE
          ======================================================== */}
      {activeTab === 'roster' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
          {/* General Shift */}
          <Card>
            <CardHeader
              title="General Duty Shift (09:30 - 18:30)"
              subtitle="Core headquarters administrative, dispatch, and finance personnel"
            />
            <CardBody style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {employees
                .filter((e) => (e.shift || '').includes('General'))
                .map((emp) => (
                  <div
                    key={emp.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.625rem 0.75rem',
                      borderRadius: '8px',
                      backgroundColor: '#f8fafc',
                      border: '1px solid #f1f5f9'
                    }}
                  >
                    <div>
                      <strong style={{ fontSize: '0.875rem', color: '#0f172a' }}>{emp.name}</strong>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        {emp.role} &bull; {emp.department}
                      </div>
                    </div>
                    <Badge variant="info" size="sm">HQ Chennai</Badge>
                  </div>
                ))}
            </CardBody>
          </Card>

          {/* Morning Shift */}
          <Card>
            <CardHeader
              title="Morning Early Shift (06:00 - 15:00)"
              subtitle="Airport counter operations and fleet inspection dispatch"
            />
            <CardBody style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {employees
                .filter((e) => (e.shift || '').includes('Morning'))
                .map((emp) => (
                  <div
                    key={emp.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.625rem 0.75rem',
                      borderRadius: '8px',
                      backgroundColor: '#f8fafc',
                      border: '1px solid #f1f5f9'
                    }}
                  >
                    <div>
                      <strong style={{ fontSize: '0.875rem', color: '#0f172a' }}>{emp.name}</strong>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        {emp.role} &bull; {emp.department}
                      </div>
                    </div>
                    <Badge variant="warning" size="sm">Airport / Yard</Badge>
                  </div>
                ))}
            </CardBody>
          </Card>

          {/* Night Shift & Special */}
          <Card>
            <CardHeader
              title="Night Emergency Shift (21:00 - 06:00)"
              subtitle="24/7 round-the-clock emergency SOS, driver tracking, and night dispatch"
            />
            <CardBody style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {employees
                .filter((e) => (e.shift || '').includes('Night'))
                .map((emp) => (
                  <div
                    key={emp.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.625rem 0.75rem',
                      borderRadius: '8px',
                      backgroundColor: '#f8fafc',
                      border: '1px solid #f1f5f9'
                    }}
                  >
                    <div>
                      <strong style={{ fontSize: '0.875rem', color: '#0f172a' }}>{emp.name}</strong>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        {emp.role} &bull; {emp.department}
                      </div>
                    </div>
                    <Badge variant="primary" size="sm">Night SOS Hub</Badge>
                  </div>
                ))}
            </CardBody>
          </Card>
        </div>
      )}

      {/* ========================================================
          MODAL 1: EDIT / REGULARIZE STAFF ATTENDANCE
          ======================================================== */}
      {isEditModalOpen && editingEmployee && (
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          title={`Adjust Attendance Record: ${editingEmployee.employeeName}`}
          subtitle={`#${editingEmployee.employeeCode} &bull; ${editingEmployee.department} &bull; ${formattedDisplayDate}`}
          size="md"
          footer={
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', width: '100%' }}>
              <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
              <Button variant="primary" style={{ backgroundColor: '#2C3480', borderColor: '#2C3480', fontWeight: 800 }} onClick={handleSaveEdit}>
                Save Attendance Record
              </Button>
            </div>
          }
        >
          <form onSubmit={handleSaveEdit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                Attendance Status *
              </label>
              <select
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value)}
                style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.875rem' }}
              >
                <option value="Not Marked">Not Marked (Clear / Reset)</option>
                <option value="Present – Office">Present – Office Duty</option>
                <option value="Present – Trip">Present – Driver on Trip</option>
                <option value="Present – Standby">Present – Standby / Available</option>
                <option value="Present – Other Duty">Present – Other Duty / Workshop</option>
                <option value="Half Day">Half Day Session (0.5x)</option>
                <option value="Paid Leave">Approved Paid Leave (1.0x)</option>
                <option value="Unpaid Leave">Unpaid Leave (Salary Deductible)</option>
                <option value="Weekly Off">Weekly Off (Roster Day Off)</option>
                <option value="Public Holiday">Public Holiday</option>
                <option value="Absent">Absent (Unauthorized)</option>
                <option value="Present">Present (Standard)</option>
                <option value="Late">Late Arrival</option>
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                  Clock In Time
                </label>
                <input
                  type="text"
                  value={editCheckIn}
                  onChange={(e) => setEditCheckIn(e.target.value)}
                  placeholder="e.g. 09:15 AM"
                  style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.875rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                  Clock Out Time
                </label>
                <input
                  type="text"
                  value={editCheckOut}
                  onChange={(e) => setEditCheckOut(e.target.value)}
                  placeholder="e.g. 06:30 PM"
                  style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.875rem' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                  Total Work Hours
                </label>
                <input
                  type="text"
                  value={editWorkHours}
                  onChange={(e) => setEditWorkHours(e.target.value)}
                  placeholder="e.g. 9h 15m"
                  style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.875rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                  Punch Device / Terminal
                </label>
                <select
                  value={editPunchLocation}
                  onChange={(e) => setEditPunchLocation(e.target.value)}
                  style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.875rem' }}
                >
                  {punchLocations.map((loc) => (
                    <option key={loc} value={loc}>{loc}</option>
                  ))}
                  <option value="N/A">N/A (Leave / Remote)</option>
                </select>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                Regularization Reason / Admin Remarks
              </label>
              <textarea
                rows={2}
                value={editRemarks}
                onChange={(e) => setEditRemarks(e.target.value)}
                placeholder="Reason for adjustment, metro delay, gate pass notes..."
                style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.875rem', fontFamily: 'inherit' }}
              />
            </div>
          </form>
        </Modal>
      )}

      {/* ========================================================
          MODAL 2: APPLY STAFF LEAVE
          ======================================================== */}
      {isLeaveModalOpen && (
        <Modal
          isOpen={isLeaveModalOpen}
          onClose={() => setIsLeaveModalOpen(false)}
          title="Submit Staff Leave Application"
          subtitle="Record planned vacation, sick leave, or casual time off for personnel"
          size="md"
          footer={
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', width: '100%' }}>
              <Button variant="outline" onClick={() => setIsLeaveModalOpen(false)}>Cancel</Button>
              <Button variant="primary" style={{ backgroundColor: '#2C3480', borderColor: '#2C3480', fontWeight: 800 }} onClick={handleCreateLeave}>
                Submit Leave Application
              </Button>
            </div>
          }
        >
          <form onSubmit={handleCreateLeave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                Select Staff Member *
              </label>
              <select
                value={leaveEmpId}
                onChange={(e) => setLeaveEmpId(e.target.value)}
                required
                style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.875rem' }}
              >
                <option value="">-- Choose Staff Personnel --</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} ({emp.code}) - {emp.department}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                  Leave Type *
                </label>
                <select
                  value={leaveType}
                  onChange={(e) => setLeaveType(e.target.value)}
                  style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.875rem' }}
                >
                  <option value="Casual Leave">Casual Leave (CL)</option>
                  <option value="Sick Leave">Sick / Medical Leave (SL)</option>
                  <option value="Earned Leave">Earned Leave / Vacation (EL)</option>
                  <option value="Half Day Leave">Half Day Leave</option>
                  <option value="Compensatory Off">Compensatory Off</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                  Total Days *
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={leaveTotalDays}
                  onChange={(e) => setLeaveTotalDays(e.target.value)}
                  style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.875rem' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))', gap: '0.75rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                  From Date * (Today or Future)
                </label>
                <input
                  type="date"
                  min={todayStr}
                  value={leaveFrom}
                  onChange={(e) => {
                    const val = e.target.value;
                    setLeaveFrom(val);
                    if (leaveTo < val) setLeaveTo(val);
                  }}
                  style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.875rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                  To Date *
                </label>
                <input
                  type="date"
                  min={leaveFrom || todayStr}
                  value={leaveTo}
                  onChange={(e) => setLeaveTo(e.target.value)}
                  style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.875rem' }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                Reason for Leave *
              </label>
              <textarea
                rows={2}
                value={leaveReason}
                onChange={(e) => setLeaveReason(e.target.value)}
                placeholder="State the purpose of leave and delegate duty coverage..."
                required
                style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.875rem', fontFamily: 'inherit' }}
              />
            </div>
          </form>
        </Modal>
      )}

      {/* ========================================================
          MODAL 3: BULK CLOCK-IN ALL CONFIRMATION
          ======================================================== */}
      {isBulkModalOpen && (
        <Modal
          isOpen={isBulkModalOpen}
          onClose={() => setIsBulkModalOpen(false)}
          title="Bulk Clock-In All Active Staff"
          subtitle={`Date: ${formattedDisplayDate}`}
          size="sm"
          footer={
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', width: '100%' }}>
              <Button variant="outline" onClick={() => setIsBulkModalOpen(false)}>Cancel</Button>
              <Button variant="primary" style={{ backgroundColor: '#16a34a', borderColor: '#16a34a', fontWeight: 800 }} onClick={handleConfirmBulkClockIn}>
                Confirm Bulk Clock-In
              </Button>
            </div>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.875rem', color: '#334155' }}>
            <p style={{ margin: 0 }}>
              This action will mark all <strong>{employees.length} staff members</strong> as <strong>"Present"</strong> for <strong>{formattedDisplayDate}</strong> with standard shift punch-in times.
            </p>
            <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '0.75rem', color: '#166534', fontSize: '0.8125rem' }}>
              ✓ Default punch time: 09:15 AM<br />
              ✓ Default terminal: HQ Chennai Biometric T1<br />
              ✓ Leaves already authorized will not be overwritten.
            </div>
          </div>
        </Modal>
      )}

      {/* ========================================================
          MODAL 4: DRIVER LEAVE APPROVAL & DURATION DECISION
          ======================================================== */}
      {approvingDriverLeave && (
        <Modal
          isOpen={Boolean(approvingDriverLeave)}
          onClose={() => setApprovingDriverLeave(null)}
          title="Approve Driver Leave Application"
          subtitle={`Ref #${approvingDriverLeave.id} • ${approvingDriverLeave.driverName || 'Driver'} (#${approvingDriverLeave.driverBadge || approvingDriverLeave.driverId || 'DRV-001'})`}
          size="md"
          footer={
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', width: '100%' }}>
              <Button variant="ghost" onClick={() => setApprovingDriverLeave(null)}>
                Cancel
              </Button>
              <Button
                variant="outline"
                style={{ color: '#dc2626', borderColor: '#fca5a5' }}
                onClick={() => {
                  approveDriverLeave(approvingDriverLeave.id, false, approveRemarks || 'Declined due to duty assignment schedule');
                  setApprovingDriverLeave(null);
                }}
              >
                Reject Request
              </Button>
              <Button
                variant="primary"
                style={{ backgroundColor: '#16a34a', borderColor: '#16a34a', fontWeight: 800 }}
                onClick={handleConfirmApproveDriverLeave}
              >
                Confirm Approval ({approveDurationDays} Day{approveDurationDays > 1 ? 's' : ''})
              </Button>
            </div>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Request Summary Box */}
            <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 700, color: '#64748b' }}>
                  Driver Planned Leave Request
                </span>
                <span style={{ fontSize: '0.8125rem', fontWeight: 800, color: '#2C3480' }}>
                  {approvingDriverLeave.totalDays} Total Day(s) Requested
                </span>
              </div>
              <div style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#0f172a' }}>
                {approvingDriverLeave.startDate} &rarr; {approvingDriverLeave.endDate}
              </div>
              <div style={{ fontSize: '0.8125rem', color: '#475569', fontStyle: 'italic' }}>
                Reason: "{approvingDriverLeave.reason || 'Personal Reason'}"
              </div>
            </div>

            {/* Decision on Days: 1, 2, 3, or All Days */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.5rem' }}>
                Admin Decision: How many days to approve?
              </label>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.625rem' }}>
                {/* Option: Full Requested */}
                <button
                  type="button"
                  onClick={() => {
                    setApproveDurationDays(approvingDriverLeave.totalDays);
                    setApproveCustomStart(approvingDriverLeave.startDate);
                    setApproveCustomEnd(approvingDriverLeave.endDate);
                  }}
                  style={{
                    padding: '0.65rem 0.75rem',
                    borderRadius: '8px',
                    border: approveDurationDays === approvingDriverLeave.totalDays ? '2px solid #16a34a' : '1px solid #cbd5e1',
                    backgroundColor: approveDurationDays === approvingDriverLeave.totalDays ? '#f0fdf4' : '#ffffff',
                    color: approveDurationDays === approvingDriverLeave.totalDays ? '#15803d' : '#334155',
                    textAlign: 'center',
                    cursor: 'pointer',
                    fontWeight: 700,
                    fontSize: '0.8125rem'
                  }}
                >
                  All {approvingDriverLeave.totalDays} Days
                  <span style={{ display: 'block', fontSize: '0.7rem', fontWeight: 500, color: '#64748b', marginTop: '2px' }}>
                    Full requested span
                  </span>
                </button>

                {/* Option: 1 Day */}
                <button
                  type="button"
                  onClick={() => {
                    setApproveDurationDays(1);
                    setApproveCustomStart(approvingDriverLeave.startDate);
                    setApproveCustomEnd(approvingDriverLeave.startDate);
                  }}
                  style={{
                    padding: '0.65rem 0.75rem',
                    borderRadius: '8px',
                    border: approveDurationDays === 1 && approveCustomEnd === approveCustomStart ? '2px solid #16a34a' : '1px solid #cbd5e1',
                    backgroundColor: approveDurationDays === 1 && approveCustomEnd === approveCustomStart ? '#f0fdf4' : '#ffffff',
                    color: approveDurationDays === 1 && approveCustomEnd === approveCustomStart ? '#15803d' : '#334155',
                    textAlign: 'center',
                    cursor: 'pointer',
                    fontWeight: 700,
                    fontSize: '0.8125rem'
                  }}
                >
                  Approve 1 Day
                  <span style={{ display: 'block', fontSize: '0.7rem', fontWeight: 500, color: '#64748b', marginTop: '2px' }}>
                    {approvingDriverLeave.startDate} only
                  </span>
                </button>

                {/* Option: 2 Days (if totalDays >= 2) */}
                {approvingDriverLeave.totalDays >= 2 && (
                  <button
                    type="button"
                    onClick={() => {
                      setApproveDurationDays(2);
                      setApproveCustomStart(approvingDriverLeave.startDate);
                      const d = new Date(approvingDriverLeave.startDate);
                      d.setDate(d.getDate() + 1);
                      const y = d.getFullYear();
                      const m = String(d.getMonth() + 1).padStart(2, '0');
                      const day = String(d.getDate()).padStart(2, '0');
                      setApproveCustomEnd(`${y}-${m}-${day}`);
                    }}
                    style={{
                      padding: '0.65rem 0.75rem',
                      borderRadius: '8px',
                      border: approveDurationDays === 2 ? '2px solid #16a34a' : '1px solid #cbd5e1',
                      backgroundColor: approveDurationDays === 2 ? '#f0fdf4' : '#ffffff',
                      color: approveDurationDays === 2 ? '#15803d' : '#334155',
                      textAlign: 'center',
                      cursor: 'pointer',
                      fontWeight: 700,
                      fontSize: '0.8125rem'
                    }}
                  >
                    Approve 2 Days
                    <span style={{ display: 'block', fontSize: '0.7rem', fontWeight: 500, color: '#64748b', marginTop: '2px' }}>
                      First 2 days of leave
                    </span>
                  </button>
                )}

                {/* Option: 3 Days (if totalDays >= 3) */}
                {approvingDriverLeave.totalDays >= 3 && (
                  <button
                    type="button"
                    onClick={() => {
                      setApproveDurationDays(3);
                      setApproveCustomStart(approvingDriverLeave.startDate);
                      const d = new Date(approvingDriverLeave.startDate);
                      d.setDate(d.getDate() + 2);
                      const y = d.getFullYear();
                      const m = String(d.getMonth() + 1).padStart(2, '0');
                      const day = String(d.getDate()).padStart(2, '0');
                      setApproveCustomEnd(`${y}-${m}-${day}`);
                    }}
                    style={{
                      padding: '0.65rem 0.75rem',
                      borderRadius: '8px',
                      border: approveDurationDays === 3 ? '2px solid #16a34a' : '1px solid #cbd5e1',
                      backgroundColor: approveDurationDays === 3 ? '#f0fdf4' : '#ffffff',
                      color: approveDurationDays === 3 ? '#15803d' : '#334155',
                      textAlign: 'center',
                      cursor: 'pointer',
                      fontWeight: 700,
                      fontSize: '0.8125rem'
                    }}
                  >
                    Approve 3 Days
                    <span style={{ display: 'block', fontSize: '0.7rem', fontWeight: 500, color: '#64748b', marginTop: '2px' }}>
                      First 3 days of leave
                    </span>
                  </button>
                )}
              </div>
            </div>

            {/* Approved Dates Range */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                  Approved From *
                </label>
                <input
                  type="date"
                  value={approveCustomStart}
                  min={approvingDriverLeave.startDate}
                  max={approvingDriverLeave.endDate}
                  onChange={(e) => setApproveCustomStart(e.target.value)}
                  style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.875rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                  Approved To *
                </label>
                <input
                  type="date"
                  value={approveCustomEnd}
                  min={approveCustomStart || approvingDriverLeave.startDate}
                  max={approvingDriverLeave.endDate}
                  onChange={(e) => setApproveCustomEnd(e.target.value)}
                  style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.875rem' }}
                />
              </div>
            </div>

            {/* Remarks */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                Admin Remarks (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Approved 1 day due to peak weekend duty coverage"
                value={approveRemarks}
                onChange={(e) => setApproveRemarks(e.target.value)}
                style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.875rem' }}
              />
            </div>

            <div style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '0.75rem', fontSize: '0.75rem', color: '#1e40af', lineHeight: 1.5 }}>
              ℹ <strong>Roster Notice:</strong> Approving {approveDurationDays} day(s) will update the driver's duty availability to <strong>ON LEAVE</strong> for {approveCustomStart} to {approveCustomEnd}. Any remaining unapproved days automatically revert to <strong>AVAILABLE</strong> in the standby pool.
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default AttendanceManagement;
