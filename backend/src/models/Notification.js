// MAK Tours & Travels ERP - Multi-Tenant Operations Notification Model
// Collection: notifications
import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    tenantId: { type: String, default: 'mak-tours', index: true, lowercase: true, trim: true },
    id: { type: String, index: true },
    portal: {
      type: String,
      default: 'admin',
      enum: ['super-admin', 'admin', 'driver', 'vendor', 'customer', 'staff', 'accountant']
    },
    title: { type: String, required: true },
    description: { type: String, default: '' },
    message: { type: String, default: '' },
    category: { type: String, default: 'General' },
    priority: { type: String, default: 'Normal' },
    bookingId: { type: String, default: null },
    driverName: { type: String, default: null },
    actionUrl: { type: String, default: '' },
    actionLink: { type: String, default: '' },
    isRead: { type: Boolean, default: false },
    unread: { type: Boolean, default: true },
    time: { type: String, default: '' },
    timestamp: { type: String, default: '' }
  },
  {
    timestamps: true,
    collection: 'notifications'
  }
);

notificationSchema.index({ tenantId: 1, portal: 1, unread: 1 });
notificationSchema.index({ tenantId: 1, createdAt: -1 });

export const Notification = mongoose.models.Notification || mongoose.model('Notification', notificationSchema);
export default Notification;
