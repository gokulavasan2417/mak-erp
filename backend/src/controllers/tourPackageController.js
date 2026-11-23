// MAK Tours & Travels ERP - Tour Packages Controller
// Connected to MongoDB Atlas "tourpackages" collection
import { TourPackage } from '../models/TourPackage.js';

export const tourPackageController = {
  getAll: async (req, res, next) => {
    try {
      const tenantId = req.tenantId || 'mak-tours';
      const tenantQuery = req.tenantQuery || { tenantId };
      const { category, status } = req.query;
      const query = { ...tenantQuery };

      if (category && category !== 'All Categories' && category !== 'All') {
        query.categories = category;
      }
      if (status && status !== 'All') {
        query.status = status;
      }

      const list = await TourPackage.find(query).sort({ createdAt: -1 }).lean();

      const formatted = list.map((p) => {
        const cats = Array.isArray(p.categories) && p.categories.length > 0 ? p.categories : ['South India'];
        const primaryCat = p.category || cats[0];
        const dest = p.destination || p.pickupLocation || p.name;
        const code = p.code || ('MAK-' + (p.id || p.slug || 'PKG').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10));
        const numPrice = Number(p.priceNumeric || p.startingPrice || (typeof p.price === 'string' ? p.price.replace(/[^\d]/g, '') : p.price)) || 0;

        return {
          ...p,
          id: p.id || p.slug || p._id.toString(),
          code,
          slug: p.slug || p.id,
          name: p.name,
          duration: p.duration || '1 Day',
          daysCount: p.daysCount || p.days || 1,
          days: p.days || p.daysCount || 1,
          nights: p.nights || Math.max(0, (p.daysCount || p.days || 1) - 1),
          price: p.price || (numPrice > 0 ? `₹${numPrice.toLocaleString('en-IN')}` : '₹0'),
          priceNumeric: numPrice,
          startingPrice: numPrice,
          pricingType: p.pricingType || 'Per Person',
          rating: p.rating || 4.9,
          reviewsCount: p.reviewsCount || 1,
          badge: p.badge || '',
          category: primaryCat,
          categories: cats,
          destination: dest,
          pickupLocation: p.pickupLocation || 'Chennai, Tamil Nadu',
          destinationImage: p.destinationImage || p.heroImage || p.image || (Array.isArray(p.images) && p.images[0]) || '',
          heroImage: p.heroImage || p.destinationImage || p.image || (Array.isArray(p.images) && p.images[0]) || '',
          image: p.image || p.destinationImage || p.heroImage || (Array.isArray(p.images) && p.images[0]) || '',
          images: Array.isArray(p.images) && p.images.length > 0 ? p.images : [p.image || p.destinationImage || p.heroImage || ''].filter(Boolean),
          shortDescription: p.shortDescription || '',
          fullDescription: p.fullDescription || '',
          itinerary: Array.isArray(p.itinerary) ? p.itinerary : [],
          inclusions: Array.isArray(p.inclusions) ? p.inclusions : [],
          exclusions: Array.isArray(p.exclusions) ? p.exclusions : [],
          places: Array.isArray(p.places) ? p.places : [],
          serviceHighlights: Array.isArray(p.serviceHighlights) ? p.serviceHighlights : [],
          sightseeingSpots: Array.isArray(p.sightseeingSpots) ? p.sightseeingSpots : [],
          status: p.status || 'Active',
          isActive: p.isActive !== false
        };
      });

      return res.status(200).json({ status: 'success', count: formatted.length, data: formatted });
    } catch (err) {
      next(err);
    }
  },

  getById: async (req, res, next) => {
    try {
      const tenantId = req.tenantId || 'mak-tours';
      const tenantQuery = req.tenantQuery || { tenantId };
      const { id } = req.params;
      const pkg = await TourPackage.findOne({
        ...tenantQuery,
        $or: [{ id }, { slug: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }]
      }).lean();

      if (!pkg) {
        return res.status(404).json({ status: 'error', message: 'Tour package not found' });
      }

      const numPrice = Number(pkg.priceNumeric || pkg.startingPrice || (typeof pkg.price === 'string' ? pkg.price.replace(/[^\d]/g, '') : pkg.price)) || 0;
      return res.status(200).json({
        status: 'success',
        data: {
          ...pkg,
          id: pkg.id || pkg.slug || pkg._id.toString(),
          slug: pkg.slug || pkg.id || pkg._id.toString(),
          price: pkg.price || (numPrice > 0 ? `₹${numPrice.toLocaleString('en-IN')}` : '₹0'),
          priceNumeric: numPrice,
          startingPrice: numPrice,
          pricingType: pkg.pricingType || 'Per Person',
          days: pkg.days || pkg.daysCount || 1,
          nights: pkg.nights || Math.max(0, (pkg.daysCount || pkg.days || 1) - 1)
        }
      });
    } catch (err) {
      next(err);
    }
  },

  create: async (req, res, next) => {
    try {
      const tenantId = req.tenantId || 'mak-tours';
      const data = { ...req.body };
      const numPrice = Number(data.priceNumeric || data.startingPrice || (typeof data.price === 'string' ? data.price.replace(/[^\d]/g, '') : data.price)) || 0;
      if (numPrice > 0) {
        data.priceNumeric = numPrice;
        data.startingPrice = numPrice;
        data.price = `₹${numPrice.toLocaleString('en-IN')}`;
      }
      const count = await TourPackage.countDocuments({ tenantId });
      const seq = count + 101;
      const customId = data.id || `PKG-${seq}`;
      const slug = data.slug || data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

      const newPkg = await TourPackage.create({
        ...data,
        tenantId,
        id: customId,
        slug,
        rating: data.rating || 5.0,
        reviewsCount: data.reviewsCount || 1
      });

      return res.status(201).json({ status: 'success', data: newPkg });
    } catch (err) {
      next(err);
    }
  },

  update: async (req, res, next) => {
    try {
      const tenantId = req.tenantId || 'mak-tours';
      const tenantQuery = req.tenantQuery || { tenantId };
      const { id } = req.params;
      const data = { ...req.body };

      // Ensure price fields are synchronized across database schema fields
      const numPrice = Number(data.priceNumeric || data.startingPrice || (typeof data.price === 'string' ? data.price.replace(/[^\d]/g, '') : data.price)) || 0;
      if (numPrice > 0) {
        data.priceNumeric = numPrice;
        data.startingPrice = numPrice;
        data.price = `₹${numPrice.toLocaleString('en-IN')}`;
      }

      // Synchronize image fields across schema fields
      const rawImg = data.image || data.destinationImage || data.heroImage || (Array.isArray(data.images) && data.images[0]);
      if (rawImg) {
        data.image = rawImg;
        data.destinationImage = rawImg;
        data.heroImage = rawImg;
        data.images = Array.isArray(data.images) && data.images.length > 0 ? data.images : [rawImg];
      }

      const updated = await TourPackage.findOneAndUpdate(
        { ...tenantQuery, $or: [{ id }, { slug: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }] },
        { $set: data },
        { returnDocument: 'after', runValidators: true }
      );

      if (!updated) {
        return res.status(404).json({ status: 'error', message: 'Tour package not found' });
      }

      const resNumPrice = Number(updated.priceNumeric || updated.startingPrice || numPrice);
      return res.status(200).json({
        status: 'success',
        data: {
          ...updated.toObject(),
          id: updated.id || updated.slug || updated._id.toString(),
          startingPrice: resNumPrice,
          priceNumeric: resNumPrice,
          price: updated.price || `₹${resNumPrice.toLocaleString('en-IN')}`
        }
      });
    } catch (err) {
      next(err);
    }
  },

  delete: async (req, res, next) => {
    try {
      const tenantId = req.tenantId || 'mak-tours';
      const tenantQuery = req.tenantQuery || { tenantId };
      const { id } = req.params;
      const deleted = await TourPackage.findOneAndDelete({
        ...tenantQuery,
        $or: [{ id }, { slug: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }]
      });

      if (!deleted) {
        return res.status(404).json({ status: 'error', message: 'Tour package not found' });
      }

      return res.status(200).json({ status: 'success', message: 'Tour package deleted successfully' });
    } catch (err) {
      next(err);
    }
  },

  toggleStatus: async (req, res, next) => {
    try {
      const tenantId = req.tenantId || 'mak-tours';
      const tenantQuery = req.tenantQuery || { tenantId };
      const { id } = req.params;
      const pkg = await TourPackage.findOne({
        ...tenantQuery,
        $or: [{ id }, { slug: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }]
      });

      if (!pkg) {
        return res.status(404).json({ status: 'error', message: 'Tour package not found' });
      }

      pkg.status = pkg.status === 'Active' ? 'Inactive' : 'Active';
      pkg.isActive = pkg.status === 'Active';
      await pkg.save();

      return res.status(200).json({ status: 'success', data: pkg });
    } catch (err) {
      next(err);
    }
  }
};

export default tourPackageController;