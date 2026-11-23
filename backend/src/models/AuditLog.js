// MAK Tours & Travels ERP - SaaS Platform Audit Log Model
// Collection: auditlogs
import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema(
  {
    tenantId: {
      type: String,
      default: 'system',
      index: true
    },
    action: {
      type: String,
      required: true,
      index: true
    },
    actorId: {
      type: String,
      default: ''
    },
    actorName: {
      type: String,
      default: 'System'
    },
    actorEmail: {
      type: String,
      default: ''
    },
    actorRole: {
      type: String,
      default: 'system'
    },
    entityType: {
      type: String,
      default: 'Platform'
    },
    entityId: {
      type: String,
      default: ''
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    ipAddress: {
      type: String,
      default: ''
    },
    severity: {
      type: String,
      enum: ['info', 'warning', 'critical'],
      default: 'info'
    }
  },
  {
    timestamps: true,
    collection: 'auditlogs'
  }
);

auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ tenantId: 1, createdAt: -1 });

export const AuditLog = mongoose.models.AuditLog || mongoose.model('AuditLog', auditLogSchema);
export default AuditLog;
