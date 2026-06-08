/**
 * orderController.js
 * Data layer: Mongoose (was: JSON flat files)
 *
 * NOTE: restaurantId is now a MongoDB ObjectId string from the frontend.
 * The frontend must send the Mongo _id of the restaurant, not a numeric id.
 */

const mongoose   = require('mongoose');
const Order      = require('../models/Order');
const User       = require('../models/User');
const OwnerMapping = require('../models/OwnerMapping');

const VALID_STATUSES = ['Pending', 'Preparing', 'Ready', 'Completed', 'Cancelled'];
// ─── Read ──────────────────────────────────────────────────────────────────

async function getAllOrders(req, res, next) {
  try {
    const { role, email: userEmail } = req.user;
    const filter = {};

    if (role === 'admin') {
      if (req.query.email)        filter.email        = req.query.email;
      if (req.query.restaurantId) filter.restaurantId = req.query.restaurantId;

    } else if (role === 'owner') {
      const mapping = await OwnerMapping.findOne({ email: userEmail.toLowerCase() });
      const ownedIds = mapping ? mapping.restaurantIds : [];
      filter.restaurantId = { $in: ownedIds };

    } else {
      filter.email = userEmail;
    }

    // ── Pagination (requirement: Pagination & Localization) ──────────────
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 50));
    const skip  = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Order.countDocuments(filter)
    ]);

    // If caller doesn't send ?page= just return the array (backward compat)
    if (!req.query.page && !req.query.limit) {
      return res.json(orders);
    }

    return res.json({
      orders,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    });
  } catch (err) {
    next(err);
  }
}

async function getOrderById(req, res, next) {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid order ID.' });
    }

    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found.' });

    const { role, email } = req.user;

    if (role === 'student' && order.email !== email) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    if (role === 'owner') {
      const mapping  = await OwnerMapping.findOne({ email: email.toLowerCase() });
      const ownedIds = mapping ? mapping.restaurantIds.map(String) : [];
      if (!ownedIds.includes(String(order.restaurantId))) {
        return res.status(403).json({ error: 'Access denied.' });
      }
    }

    return res.json(order);
  } catch (err) {
    next(err);
  }
}

// ─── Create ────────────────────────────────────────────────────────────────

async function createOrder(req, res, next) {
  try {
    const { items, total, comment, restaurantId } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Order must include at least one item.' });
    }
    if (total === undefined || isNaN(Number(total))) {
      return res.status(400).json({ error: 'A valid order total is required.' });
    }

    const order = await Order.create({
      items,
      total       : parseFloat(Number(total).toFixed(2)),
      comment     : comment || '',
      email       : req.user.email,
      status      : 'Pending',
      restaurantId: restaurantId || null
    });

    // Award loyalty points: 1 point per whole EGP spent
    const earned = Math.floor(Number(total));
    if (earned > 0) {
      await User.findOneAndUpdate(
        { email: req.user.email },
        { $inc: { loyaltyPoints: earned } }
      );
    }

    return res.status(201).json(order);
  } catch (err) {
    next(err);
  }
}

// ─── Update ────────────────────────────────────────────────────────────────

async function updateOrder(req, res, next) {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid order ID.' });
    }

    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found.' });

    if (req.user.role === 'owner') {
      const mapping  = await OwnerMapping.findOne({ email: req.user.email.toLowerCase() });
      const ownedIds = mapping ? mapping.restaurantIds.map(String) : [];
      if (!ownedIds.includes(String(order.restaurantId))) {
        return res.status(403).json({ error: 'You do not own this restaurant.' });
      }
    }

    const { status, comment, total, items } = req.body;

    if (status !== undefined) {
      if (!VALID_STATUSES.includes(status)) {
        return res.status(400).json({
          error: `Invalid status. Allowed values: ${VALID_STATUSES.join(', ')}.`
        });
      }
      order.status = status;
    }

    if (comment !== undefined) order.comment = comment;
    if (total   !== undefined) order.total   = parseFloat(Number(total).toFixed(2));
    if (Array.isArray(items) && items.length > 0) order.items = items;

    await order.save();
    return res.json(order);
  } catch (err) {
    next(err);
  }
}

async function getTrendingMeals(req, res, next) {
  try {
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const results = await Order.aggregate([
      { $match: { createdAt: { $gte: since } } },
      { $unwind: '$items' },
      {
        $group: {
          _id  : '$items.name',
          count: { $sum: '$items.quantity' },
          // Grab price and image from the most recent occurrence
          price: { $last: '$items.price' },
          image: { $last: '$items.image' },
          restaurantId: { $last: '$restaurantId' }
        }
      },
      // Enforce minimum 10 orders this week
      { $match: { count: { $gte: 10 } } },
      { $sort: { count: -1 } },
      { $limit: 6 },
      {
        $lookup: {
          from        : 'restaurants',
          localField  : 'restaurantId',
          foreignField: '_id',
          as          : 'restaurant'
        }
      },
      {
        $project: {
          _id           : 0,
          name          : '$_id',
          price         : 1,
          image         : 1,
          restaurantName: { $ifNull: [{ $arrayElemAt: ['$restaurant.name', 0] }, 'Campus Restaurant'] }
        }
      }
    ]);
    return res.json(results);
  } catch (err) {
    next(err);
  }
}
async function cancelOrder(req, res, next) {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid order ID.' });
    }

    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found.' });

    // Only the student who placed it can cancel
    if (order.email !== req.user.email) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    // Only Pending orders can be cancelled
    if (order.status !== 'Pending') {
      return res.status(400).json({ error: 'Only pending orders can be cancelled.' });
    }

    // Must be within 2 minutes of placing
    const ageMs = Date.now() - new Date(order.createdAt).getTime();
    if (ageMs > 2 * 60 * 1000) {
      return res.status(400).json({ error: 'Cancellation window has expired (2 minutes).' });
    }

    order.status = 'Cancelled';
    await order.save();

    // Refund loyalty points
    const earned = Math.floor(Number(order.total));
    if (earned > 0) {
      await User.findOneAndUpdate(
        { email: req.user.email },
        { $inc: { loyaltyPoints: -earned } }
      );
    }

    return res.json({ message: 'Order cancelled successfully.', order });
  } catch (err) {
    next(err);
  }
}

module.exports = { getAllOrders, getOrderById, createOrder, updateOrder, cancelOrder, getTrendingMeals };