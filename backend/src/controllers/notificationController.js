// MAK Tours & Travels ERP - Multi-Tenant Operations Notifications Controller
// Collection: notifications
import { Notification } from '../models/Notification.js';
import { db } from '../config/db.js';

function formatTimestamp(d = new Date()) {
  const dateObj = d instanceof Date ? d : new Date(d);
  return dateObj.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
}

export const notificationController = {
  getAll: async (req, res, next) => {
    try {
      const { portal, category, unreadOnly } = req.query;
      const tenantQuery = req.tenantQuery || (req.tenantId ? { tenantId: req.tenantId } : {});
      const query = { ...tenantQuery };

      if (portal) query.portal = portal;
      if (category && category !== 'All') query.category = category;
      if (unreadOnly === 'true' || unreadOnly === true) query.unread = true;

      let list = await Notification.find(query).sort({ createdAt: -1 }).lean();

      // If tenant is master 'mak-tours' and collection is empty, backfill from db.notifications
      if (list.length === 0 && (req.tenantId === 'mak-tours' || !req.tenantId) && Array.isArray(db.notifications) && db.notifications.length > 0) {
        const seedNotifs = db.notifications.map((n) => ({
          ...n,
          tenantId: 'mak-tours',
          time: n.time || formatTimestamp(n.createdAt || new Date()),
          timestamp: n.timestamp || formatTimestamp(n.createdAt || new Date())
        }));
        try {
          await Notification.insertMany(seedNotifs, { ordered: false });
          list = await Notification.find(query).sort({ createdAt: -1 }).lean();
        } catch {
          list = seedNotifs;
        }
      }

      const formatted = list.map((n) => ({
        ...n,
        id: n.id || n._id.toString(),
        time: n.time || n.timestamp || formatTimestamp(n.createdAt),
        timestamp: n.timestamp || n.time || formatTimestamp(n.createdAt)
      }));

      return res.status(200).json({ status: 'success', count: formatted.length, data: formatted });
    } catch (err) {
      next(err);
    }
  },

  markRead: async (req, res, next) => {
    try {
      const { id } = req.params;
      const tenantQuery = req.tenantQuery || (req.tenantId ? { tenantId: req.tenantId } : {});

      await Notification.updateMany(
        { ...tenantQuery, $or: [{ id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }] },
        { $set: { isRead: true, unread: false } }
      );

      // In-memory sync
      const notif = Array.isArray(db.notifications) ? db.notifications.find((n) => n.id === id) : null;
      if (notif) {
        notif.isRead = true;
        notif.unread = false;
      }

      return res.status(200).json({ status: 'success', message: 'Notification marked as read' });
    } catch (err) {
      next(err);
    }
  },

  markAllRead: async (req, res, next) => {
    try {
      const { portal } = req.body;
      const tenantQuery = req.tenantQuery || (req.tenantId ? { tenantId: req.tenantId } : {});
      const query = { ...tenantQuery };
      if (portal) query.portal = portal;

      await Notification.updateMany(query, { $set: { isRead: true, unread: false } });

      if (Array.isArray(db.notifications)) {
        db.notifications.forEach((n) => {
          if (!portal || n.portal === portal) {
            n.isRead = true;
            n.unread = false;
          }
        });
      }

      return res.status(200).json({ status: 'success', message: 'All notifications marked as read' });
    } catch (err) {
      next(err);
    }
  },

  create: async (req, res, next) => {
    try {
      const data = req.body;
      const tenantId = req.user?.tenantId || req.tenantId || (req.isSuperAdmin && data.tenantId) || 'mak-tours';
      const id = `NOTIF-${Date.now().toString().slice(-4)}`;
      const now = new Date();
      const timeFormatted = formatTimestamp(now);

      const newNotif = await Notification.create({
        ...data,
        id,
        tenantId,
        portal: data.portal || 'admin',
        title: data.title || 'Notice',
        description: data.description || data.message || '',
        message: data.message || data.description || '',
        category: data.category || 'General',
        priority: data.priority || 'Normal',
        time: timeFormatted,
        timestamp: timeFormatted,
        isRead: false,
        unread: true,
        actionUrl: data.actionUrl || data.actionLink || '/admin/bookings'
      });

      if (Array.isArray(db.notifications)) {
        db.notifications.unshift(newNotif.toObject ? newNotif.toObject() : newNotif);
      }

      return res.status(201).json({ status: 'success', data: newNotif });
    } catch (err) {
      next(err);
    }
  },

  delete: async (req, res, next) => {
    try {
      const { id } = req.params;
      const tenantQuery = req.tenantQuery || (req.tenantId ? { tenantId: req.tenantId } : {});

      await Notification.deleteMany({
        ...tenantQuery,
        $or: [{ id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }]
      });

      if (Array.isArray(db.notifications)) {
        const idx = db.notifications.findIndex((n) => n.id === id);
        if (idx !== -1) db.notifications.splice(idx, 1);
      }

      return res.status(200).json({ status: 'success', message: 'Notification deleted' });
    } catch (err) {
      next(err);
    }
  }
};

export default notificationController;
