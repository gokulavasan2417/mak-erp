// MAK Tours & Travels ERP - Staff Leave Request Model
// Collection: leave_requests
import mongoose from 'mongoose';

const leaveRequestSchema = new mongoose.Schema(
  {
    tenantId: { type: String, default: 'mak-tours', index: true, lowercase: true, trim: true },
    leaveId: { type: String, unique: true, index: true },
    employeeId: { type: String, required: true, index: true },
    employeeName: { type: String, required: true },
    leaveType: {
      type: String,
      required: true,
      default: 'Casual Leave',
      enum: ['Casual Leave', 'Sick Leave', 'Earned Leave', 'Unpaid Leave', 'Compensatory Off']
    },
    fromDate: { type: String, required: true },
    toDate: { type: String, required: true },
    totalDays: { type: Number, default: 1 },
    reason: { type: String, default: '' },
    status: {
      type: String,
      default: 'Pending',
      enum: ['Pending', 'Approved', 'Rejected']
    },
    adminRemarks: { type: String, default: '' },
    reviewedBy: { type: String, default: null },
    reviewedAt: { type: Date, default: null }
  },
  {
    timestamps: true,
    collection: 'leave_requests'
  }
);

leaveRequestSchema.pre('save', function (next) {
  if (!this.leaveId) {
    this.leaveId = `LVR-${Date.now().toString().slice(-6)}`;
  }
  if (typeof next === 'function') next();
});

export const LeaveRequest = mongoose.models.LeaveRequest || mongoose.model('LeaveRequest', leaveRequestSchema);
export default LeaveRequest;
