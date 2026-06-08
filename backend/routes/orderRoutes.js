const express = require('express');
const { getAllOrders, getOrderById, createOrder, updateOrder, cancelOrder, getTrendingMeals } = require('../controllers/orderController');
const { authenticate }        = require('../middleware/authMiddleware');
const { requireOwnerOrAdmin } = require('../middleware/roleMiddleware');
const Order = require('../models/Order');

const router = express.Router();

router.get('/trending', getTrendingMeals);

router.get('/queue/:id', async (req, res, next) => {
  try {
    const target = await Order.findById(req.params.id);
    if (!target) return res.status(404).json({ error: 'Order not found.' });
    const ahead = await Order.countDocuments({
      _id         : { $ne: target._id },
      restaurantId: target.restaurantId,
      status      : { $in: ['Pending', 'Preparing'] },
      createdAt   : { $lt: target.createdAt }
    });
    res.json({
      orderId    : target._id,
      status     : target.status,
      position   : ahead + 1,
      ahead,
      estWaitMins: ahead * 5 + (target.status === 'Preparing' ? 3 : 8),
      isReady    : target.status === 'Ready'
    });
  } catch (err) { next(err); }
});

router.get('/',      authenticate, getAllOrders);
router.get('/:id',   authenticate, getOrderById);
router.post('/',     authenticate, createOrder);
router.patch('/:id',        authenticate, requireOwnerOrAdmin, updateOrder);
router.delete('/:id/cancel', authenticate, cancelOrder);

module.exports = router;