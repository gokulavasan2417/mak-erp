// MAK Tours & Travels ERP - Dedicated Staff Attendance Model
// Collection: attendance (Separate collection for Attendance logs)
import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema(
  {
    tenantId: { type: String, default: 'mak-tours', index: true, lowercase: true, trim: true },
    employeeId: { type: String, required: true, index: true },
    employeeCode: { type: String, index: true },
    employeeName: { type: String, required: true },
    date: { type: String, required: true, index: true }, // Format YYYY-MM-DD
    status: {
      type: String,
      required: true,
      default: 'Present – Office',
      enum: [
        'Present – Office',
        'Present – Trip',
        'Present – Standby',
        'Present – Other Duty',
        'Half Day',
        'Paid Leave',
        'Unpaid Leave',
        'Absent',
        'Weekly Off',
        'Public Holiday',
        // Backward-compatible aliases:
        'Present',
        'Late',
        'On Leave'
      ]
    },
    checkIn: { type: String, default: '09:30 AM' },
    checkOut: { type: String, default: '06:30 PM' },
    hoursWorked: { type: Number, default: 9 },
    overtimeHours: { type: Number, default: 0 },
    dutyDuration: { type: String, default: '9h 00m' },
    shift: { type: String, default: 'General (09:30 - 18:30)' },
    department: { type: String, default: 'Operations & Dispatch' },
    role: { type: String, default: 'Operations Staff' },
    punchLocation: { type: String, default: 'HQ Chennai - Biometric T1' },
    remarks: { type: String, default: '' },
    leaveType: { type: String, default: '' },
    // Driver Trip Activity & Attendance Contribution
    isDriverAttendance: { type: Boolean, default: false },
    driverId: { type: String, default: '', index: true },
    trips: [
      {
        tripId: { type: String },
        bookingNumber: { type: String },
        dutyDurationHours: { type: Number, default: 0 },
        distanceKm: { type: Number, default: 0 },
        pickupLocation: { type: String },
        dropLocation: { type: String },
        startTime: { type: String },
        endTime: { type: String },
        status: { type: String },
        verified: { type: Boolean, default: true }
      }
    ],
    verifiedByAdmin: { type: Boolean, default: true },
    auditHistory: [
      {
        updatedBy: { type: String, default: 'Admin' },
        updatedAt: { type: Date, default: Date.now },
        oldStatus: { type: String },
        newStatus: { type: String },
        reason: { type: String }
      }
    ]
  },
  {
    timestamps: true,
    collection: 'attendance' // Dedicated Attendance collection
  }
);

// Compound index to guarantee one attendance record per employee per day
attendanceSchema.index({ employeeId: 1, date: 1 }, { unique: true });

export const Attendance = mongoose.models.Attendance || mongoose.model('Attendance', attendanceSchema);
export default Attendance;
