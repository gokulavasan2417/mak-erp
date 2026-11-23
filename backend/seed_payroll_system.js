import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

import { Employee, Driver, Attendance, Booking, PayrollPolicy, Payroll, SalaryPayment } from './src/models/index.js';

async function seedPayrollSystem() {
  console.log('Connecting to MongoDB Atlas...');
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to mak_tours database.');

  // 1. Setup Default Payroll Policy
  console.log('Configuring Payroll Policy...');
  await PayrollPolicy.findOneAndUpdate(
    { isDefault: true },
    {
      policyName: 'MAK Tours Standard Enterprise Policy',
      isDefault: true,
      payrollWorkingDays: 26,
      calculationMethod: 'Fixed Payroll Working Days',
      weeklyOffDays: ['Sunday'],
      publicHolidays: [
        { date: '2026-11-01', name: 'Tamil Nadu Day' },
        { date: '2026-11-14', name: 'Diwali Festival' }
      ],
      allowances: {
        perTripRate: 500,
        nightDutyRate: 350,
        longDistanceRate: 400,
        overnightOutstationRate: 600,
        extraDutyHourRate: 150
      },
      overtime: {
        enabled: true,
        hourlyRate: 150,
        multiplier: 1.5
      },
      leaveRules: {
        monthlyPaidLeaveQuota: 2,
        halfDayDeductionFraction: 0.5,
        unpaidLeaveDeduction: true
      },
      salaryRounding: 'Nearest Rupee'
    },
    { upsert: true, returnDocument: 'after' }
  );

  // 2. Seed Employees across All 5 Categories
  console.log('Seeding Employees...');
  const employeesData = [
    {
      employeeCode: 'EMP-001',
      id: 'EMP-001',
      firstName: 'Rajesh',
      lastName: 'Sharma',
      fullName: 'Rajesh Sharma',
      email: 'rajesh.sharma@maktours.com',
      phone: '+91 98401 11001',
      department: 'Operations & Dispatch',
      designation: 'Operations Manager',
      status: 'Active',
      joinDate: '2023-03-15',
      salaryCategory: 'Category A – Fixed Monthly',
      baseSalary: 45000,
      salary: 45000,
      monthlySalary: 45000,
      salaryRevisionHistory: [
        {
          revisionId: 'REV-001042',
          previousSalary: 40000,
          newSalary: 45000,
          effectiveDate: '2026-11-15',
          salaryCategory: 'Category A',
          updatedBy: 'General Operations Manager',
          updatedAt: new Date('2026-11-15T10:00:00Z'),
          remarks: 'Performance promotion to Operations Manager grade'
        }
      ],
      salaryStructure: {
        basic: 25000,
        hra: 12000,
        allowances: 8000,
        fixedIncentives: 0,
        providentFund: 1800,
        professionalTax: 200,
        otherDeductions: 0
      },
      isDriver: false
    },
    {
      employeeCode: 'EMP-002',
      id: 'EMP-002',
      firstName: 'Priya',
      lastName: 'Raman',
      fullName: 'Priya Raman',
      email: 'priya.raman@maktours.com',
      phone: '+91 98401 11002',
      department: 'Finance & Accounts',
      designation: 'Senior Accountant',
      status: 'Active',
      joinDate: '2023-06-01',
      salaryCategory: 'Category A – Fixed Monthly',
      baseSalary: 38000,
      salary: 38000,
      salaryStructure: {
        basic: 22000,
        hra: 10000,
        allowances: 6000,
        fixedIncentives: 0,
        providentFund: 1800,
        professionalTax: 200,
        otherDeductions: 0
      },
      isDriver: false
    },
    {
      employeeCode: 'EMP-003',
      id: 'EMP-003',
      firstName: 'Karthik',
      lastName: 'Kumar',
      fullName: 'Karthik Kumar',
      email: 'karthik.kumar@maktours.com',
      phone: '+91 98401 11003',
      department: 'Fleet Logistics',
      designation: 'Fleet Supervisor',
      status: 'Active',
      joinDate: '2024-01-10',
      salaryCategory: 'Category A – Fixed Monthly',
      baseSalary: 32000,
      salary: 32000,
      salaryStructure: {
        basic: 18000,
        hra: 8000,
        allowances: 6000,
        fixedIncentives: 0,
        providentFund: 1500,
        professionalTax: 200,
        otherDeductions: 0
      },
      isDriver: false
    },
    {
      employeeCode: 'EMP-004',
      id: 'EMP-004',
      firstName: 'Murugan',
      lastName: 'S',
      fullName: 'Murugan S',
      email: 'murugan.driver@maktours.com',
      phone: '+91 98401 11004',
      department: 'Fleet Logistics',
      designation: 'Permanent Senior Driver',
      status: 'Active',
      joinDate: '2023-01-15',
      salaryCategory: 'Category B – Monthly + Trip Allowances',
      baseSalary: 22000,
      salary: 22000,
      monthlySalary: 22000,
      salaryRevisionHistory: [
        {
          revisionId: 'REV-001038',
          previousSalary: 18000,
          newSalary: 22000,
          effectiveDate: '2026-10-01',
          salaryCategory: 'Category B',
          updatedBy: 'Fleet Logistics Admin',
          updatedAt: new Date('2026-10-01T09:30:00Z'),
          remarks: 'Biannual fleet driver base salary increment'
        }
      ],
      salaryStructure: {
        basic: 14000,
        hra: 5000,
        allowances: 3000,
        fixedIncentives: 1000,
        providentFund: 1200,
        professionalTax: 150,
        otherDeductions: 0
      },
      isDriver: true,
      driverId: 'DRV-001',
      allowanceConfig: {
        perTripRate: 500,
        nightDutyRate: 350,
        longDistanceRate: 400,
        overnightOutstationRate: 600,
        extraDutyHourRate: 150
      }
    },
    {
      employeeCode: 'EMP-005',
      id: 'EMP-005',
      firstName: 'Suresh',
      lastName: 'Babu',
      fullName: 'Suresh Babu',
      email: 'suresh.driver@maktours.com',
      phone: '+91 98401 11005',
      department: 'Fleet Logistics',
      designation: 'Permanent Fleet Driver',
      status: 'Active',
      joinDate: '2023-08-20',
      salaryCategory: 'Category B – Monthly + Trip Allowances',
      baseSalary: 20000,
      salary: 20000,
      salaryStructure: {
        basic: 13000,
        hra: 4500,
        allowances: 2500,
        fixedIncentives: 500,
        providentFund: 1200,
        professionalTax: 150,
        otherDeductions: 0
      },
      isDriver: true,
      driverId: 'DRV-002',
      allowanceConfig: {
        perTripRate: 450,
        nightDutyRate: 300,
        longDistanceRate: 350,
        overnightOutstationRate: 550,
        extraDutyHourRate: 140
      }
    },
    {
      employeeCode: 'EMP-006',
      id: 'EMP-006',
      firstName: 'Vignesh',
      lastName: 'P',
      fullName: 'Vignesh P',
      email: 'vignesh.driver@maktours.com',
      phone: '+91 98401 11006',
      department: 'Fleet Logistics',
      designation: 'Freelance Outstation Driver',
      status: 'Active',
      joinDate: '2024-02-01',
      salaryCategory: 'Category C – Trip-Based Driver',
      baseSalary: 0,
      salary: 0,
      salaryStructure: {
        basic: 0,
        hra: 0,
        allowances: 0,
        perTripRate: 800,
        nightDutyRate: 400,
        longDistanceRate: 500,
        overnightRate: 700
      },
      isDriver: true,
      driverId: 'DRV-003',
      allowanceConfig: {
        perTripRate: 800,
        nightDutyRate: 400,
        longDistanceRate: 500,
        overnightOutstationRate: 700,
        extraDutyHourRate: 150
      }
    },
    {
      employeeCode: 'EMP-007',
      id: 'EMP-007',
      firstName: 'Anandh',
      lastName: 'R',
      fullName: 'Anandh R',
      email: 'anandh.driver@maktours.com',
      phone: '+91 98401 11007',
      department: 'Fleet Logistics',
      designation: 'Per-Trip Specialist',
      status: 'Active',
      joinDate: '2024-04-12',
      salaryCategory: 'Category C – Trip-Based Driver',
      baseSalary: 0,
      salary: 0,
      salaryStructure: {
        basic: 0,
        hra: 0,
        allowances: 0,
        perTripRate: 750,
        nightDutyRate: 350,
        longDistanceRate: 450,
        overnightRate: 650
      },
      isDriver: true,
      driverId: 'DRV-004',
      allowanceConfig: {
        perTripRate: 750,
        nightDutyRate: 350,
        longDistanceRate: 450,
        overnightOutstationRate: 650,
        extraDutyHourRate: 140
      }
    },
    {
      employeeCode: 'EMP-008',
      id: 'EMP-008',
      firstName: 'Selvam',
      lastName: 'K',
      fullName: 'Selvam K',
      email: 'selvam.yard@maktours.com',
      phone: '+91 98401 11008',
      department: 'Fleet Logistics',
      designation: 'Yard Maintenance & Cleaner',
      status: 'Active',
      joinDate: '2023-11-05',
      salaryCategory: 'Category D – Daily Wage',
      baseSalary: 0,
      salary: 18200,
      salaryStructure: {
        basic: 0,
        dailyWage: 700,
        overtimeRate: 100
      },
      isDriver: false
    },
    {
      employeeCode: 'EMP-009',
      id: 'EMP-009',
      firstName: 'David',
      lastName: 'Miller',
      fullName: 'David Miller',
      email: 'david.miller@maktours.com',
      phone: '+91 98401 11009',
      department: 'IT & Engineering',
      designation: 'GPS & Fleet IT Consultant',
      status: 'Active',
      joinDate: '2024-01-01',
      salaryCategory: 'Category E – Contract',
      baseSalary: 55000,
      salary: 55000,
      salaryStructure: {
        basic: 55000,
        contractTerms: 'Fixed Monthly Consultancy Fee'
      },
      isDriver: false
    }
  ];

  for (const emp of employeesData) {
    await Employee.findOneAndUpdate(
      { employeeCode: emp.employeeCode },
      { $set: emp },
      { upsert: true, returnDocument: 'after' }
    );
  }
  console.log(`Successfully seeded ${employeesData.length} employees.`);

  // 3. Seed Drivers
  console.log('Seeding Drivers in drivers collection...');
  const driversData = [
    {
      id: 'DRV-001',
      driverId: 'DRV-001',
      name: 'Murugan S',
      fullName: 'Murugan S',
      phone: '+91 98401 11004',
      status: 'Active',
      licenseNumber: 'TN-01-2015-0048123',
      licenseExpiry: '2028-06-30',
      experienceYears: 9,
      rating: 4.9,
      category: 'Permanent'
    },
    {
      id: 'DRV-002',
      driverId: 'DRV-002',
      name: 'Suresh Babu',
      fullName: 'Suresh Babu',
      phone: '+91 98401 11005',
      status: 'Active',
      licenseNumber: 'TN-02-2017-0093847',
      licenseExpiry: '2027-11-15',
      experienceYears: 7,
      rating: 4.8,
      category: 'Permanent'
    },
    {
      id: 'DRV-003',
      driverId: 'DRV-003',
      name: 'Vignesh P',
      fullName: 'Vignesh P',
      phone: '+91 98401 11006',
      status: 'Active',
      licenseNumber: 'TN-04-2019-0028475',
      licenseExpiry: '2029-03-20',
      experienceYears: 5,
      rating: 4.7,
      category: 'Freelance / Trip-Based'
    },
    {
      id: 'DRV-004',
      driverId: 'DRV-004',
      name: 'Anandh R',
      fullName: 'Anandh R',
      phone: '+91 98401 11007',
      status: 'Active',
      licenseNumber: 'TN-05-2020-0019284',
      licenseExpiry: '2030-01-10',
      experienceYears: 4,
      rating: 4.6,
      category: 'Freelance / Trip-Based'
    }
  ];

  for (const drv of driversData) {
    await Driver.findOneAndUpdate(
      { id: drv.id },
      { $set: drv },
      { upsert: true, returnDocument: 'after' }
    );
  }

  // 4. Link Completed Trips to Drivers
  console.log('Linking trips to drivers...');
  const bookings = await Booking.find({ status: 'Completed' });
  if (bookings.length >= 4) {
    // Murugan S: 2 trips
    await Booking.findByIdAndUpdate(bookings[0]._id, {
      $set: {
        driverId: 'DRV-001',
        assignedDriverId: 'DRV-001',
        driverName: 'Murugan S',
        pickupDate: '2026-11-04',
        travelDate: '2026-11-04',
        distanceKm: 320,
        isNightTrip: true,
        isOutstation: true,
        tripStatus: 'Completed'
      }
    });

    await Booking.findByIdAndUpdate(bookings[1]._id, {
      $set: {
        driverId: 'DRV-001',
        assignedDriverId: 'DRV-001',
        driverName: 'Murugan S',
        pickupDate: '2026-11-08',
        travelDate: '2026-11-08',
        distanceKm: 180,
        isNightTrip: false,
        isOutstation: false,
        tripStatus: 'Completed'
      }
    });

    // Suresh Babu: 1 trip
    await Booking.findByIdAndUpdate(bookings[2]._id, {
      $set: {
        driverId: 'DRV-002',
        assignedDriverId: 'DRV-002',
        driverName: 'Suresh Babu',
        pickupDate: '2026-11-06',
        travelDate: '2026-11-06',
        distanceKm: 280,
        isNightTrip: true,
        isOutstation: true,
        tripStatus: 'Completed'
      }
    });

    // Vignesh P: 2 trips
    await Booking.findByIdAndUpdate(bookings[3]._id, {
      $set: {
        driverId: 'DRV-003',
        assignedDriverId: 'DRV-003',
        driverName: 'Vignesh P',
        pickupDate: '2026-11-05',
        travelDate: '2026-11-05',
        distanceKm: 420,
        isNightTrip: true,
        isOutstation: true,
        tripStatus: 'Completed'
      }
    });

    if (bookings[4]) {
      await Booking.findByIdAndUpdate(bookings[4]._id, {
        $set: {
          driverId: 'DRV-003',
          assignedDriverId: 'DRV-003',
          driverName: 'Vignesh P',
          pickupDate: '2026-11-10',
          travelDate: '2026-11-10',
          distanceKm: 210,
          isNightTrip: false,
          isOutstation: false,
          tripStatus: 'Completed'
        }
      });
    }
  }

  // 5. Seed Attendance Records for 2026-11
  console.log('Seeding Attendance Records for November 2026...');
  // Clear old test attendance records for 2026-11
  await Attendance.deleteMany({ date: { $regex: '^2026-11' } });

  const attendanceBatch = [];

  // Helper dates (2026-11-01 to 2026-11-12)
  for (let day = 1; day <= 12; day++) {
    const dayStr = day < 10 ? `0${day}` : `${day}`;
    const dateStr = `2026-11-${dayStr}`;
    const dateObj = new Date(`2026-11-${dayStr}T12:00:00Z`);
    const dayOfWeek = dateObj.getDay(); // 0 is Sunday

    const isSunday = dayOfWeek === 0;
    const isHoliday = dateStr === '2026-11-01';

    // Rajesh Sharma (EMP-001) - Office Staff
    attendanceBatch.push({
      employeeId: 'EMP-001',
      employeeCode: 'EMP-001',
      employeeName: 'Rajesh Sharma',
      date: dateStr,
      status: isHoliday ? 'Public Holiday' : isSunday ? 'Weekly Off' : 'Present – Office',
      checkInTime: isHoliday || isSunday ? null : '09:15',
      checkOutTime: isHoliday || isSunday ? null : '18:30',
      dutyDuration: isHoliday || isSunday ? 0 : 9.25,
      isVerified: true
    });

    // Priya Raman (EMP-002) - Office Staff with Paid Leave & Unpaid Leave
    let priyaStatus = 'Present – Office';
    if (isHoliday) priyaStatus = 'Public Holiday';
    else if (isSunday) priyaStatus = 'Weekly Off';
    else if (day === 3) priyaStatus = 'Paid Leave';
    else if (day === 7) priyaStatus = 'Unpaid Leave';

    attendanceBatch.push({
      employeeId: 'EMP-002',
      employeeCode: 'EMP-002',
      employeeName: 'Priya Raman',
      date: dateStr,
      status: priyaStatus,
      checkInTime: ['Present – Office'].includes(priyaStatus) ? '09:25' : null,
      checkOutTime: ['Present – Office'].includes(priyaStatus) ? '18:15' : null,
      dutyDuration: ['Present – Office'].includes(priyaStatus) ? 8.8 : 0,
      isVerified: true
    });

    // Murugan S (EMP-004, DRV-001) - Driver
    let muruganStatus = 'Present – Standby';
    let muruganTrips = [];
    if (isHoliday) muruganStatus = 'Public Holiday';
    else if (isSunday) muruganStatus = 'Weekly Off';
    else if (day === 4) {
      muruganStatus = 'Present – Trip';
      muruganTrips = [{ tripId: 'MAK-105305', date: dateStr, dutyHours: 11, distanceKm: 320, isNightTrip: true, isOutstation: true }];
    } else if (day === 8) {
      muruganStatus = 'Present – Trip';
      muruganTrips = [{ tripId: 'MAK-921964', date: dateStr, dutyHours: 7, distanceKm: 180, isNightTrip: false, isOutstation: false }];
    } else if (day === 2 || day === 5 || day === 9) {
      muruganStatus = 'Present – Office';
    }

    attendanceBatch.push({
      employeeId: 'EMP-004',
      employeeCode: 'EMP-004',
      employeeName: 'Murugan S',
      driverId: 'DRV-001',
      isDriverAttendance: true,
      date: dateStr,
      status: muruganStatus,
      checkInTime: isSunday || isHoliday ? null : '07:30',
      checkOutTime: isSunday || isHoliday ? null : '19:00',
      dutyDuration: isSunday || isHoliday ? 0 : 10,
      trips: muruganTrips,
      isVerified: true
    });

    // Suresh Babu (EMP-005, DRV-002) - Driver
    let sureshStatus = 'Present – Standby';
    let sureshTrips = [];
    if (isHoliday) sureshStatus = 'Public Holiday';
    else if (isSunday) sureshStatus = 'Weekly Off';
    else if (day === 6) {
      sureshStatus = 'Present – Trip';
      sureshTrips = [{ tripId: 'MAK-849030', date: dateStr, dutyHours: 12, distanceKm: 280, isNightTrip: true, isOutstation: true }];
    }

    attendanceBatch.push({
      employeeId: 'EMP-005',
      employeeCode: 'EMP-005',
      employeeName: 'Suresh Babu',
      driverId: 'DRV-002',
      isDriverAttendance: true,
      date: dateStr,
      status: sureshStatus,
      checkInTime: isSunday || isHoliday ? null : '08:00',
      checkOutTime: isSunday || isHoliday ? null : '18:00',
      dutyDuration: isSunday || isHoliday ? 0 : 9,
      trips: sureshTrips,
      isVerified: true
    });

    // Vignesh P (EMP-006, DRV-003) - Trip-Based Driver
    if (day === 5 || day === 10) {
      attendanceBatch.push({
        employeeId: 'EMP-006',
        employeeCode: 'EMP-006',
        employeeName: 'Vignesh P',
        driverId: 'DRV-003',
        isDriverAttendance: true,
        date: dateStr,
        status: 'Present – Trip',
        checkInTime: '06:00',
        checkOutTime: '22:00',
        dutyDuration: 14,
        trips: day === 5 ? [{ tripId: 'MAK-751846', date: dateStr, dutyHours: 14, distanceKm: 420, isNightTrip: true, isOutstation: true }] : [{ tripId: 'MAK-243933', date: dateStr, dutyHours: 8, distanceKm: 210, isNightTrip: false, isOutstation: false }],
        isVerified: true
      });
    }

    // Selvam K (EMP-008) - Daily Wage Employee
    if (!isSunday && !isHoliday) {
      attendanceBatch.push({
        employeeId: 'EMP-008',
        employeeCode: 'EMP-008',
        employeeName: 'Selvam K',
        date: dateStr,
        status: day === 11 ? 'Half Day' : 'Present – Other Duty',
        checkInTime: '08:00',
        checkOutTime: day === 11 ? '13:00' : '17:00',
        dutyDuration: day === 11 ? 4.5 : 8.5,
        isVerified: true
      });
    }

    // David Miller (EMP-009) - Contract Employee
    attendanceBatch.push({
      employeeId: 'EMP-009',
      employeeCode: 'EMP-009',
      employeeName: 'David Miller',
      date: dateStr,
      status: isHoliday ? 'Public Holiday' : isSunday ? 'Weekly Off' : 'Present – Office',
      dutyDuration: isSunday || isHoliday ? 0 : 8,
      isVerified: true
    });
  }

  await Attendance.insertMany(attendanceBatch);
  console.log(`Inserted ${attendanceBatch.length} attendance records.`);

  await mongoose.disconnect();
  console.log('Seeding completed successfully!');
}

seedPayrollSystem().catch(err => {
  console.error('Seeding error:', err);
  process.exit(1);
});
