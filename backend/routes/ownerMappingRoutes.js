/**
 * ownerMappingRoutes.js
 * GET /  — owners can read their own mapping; admin reads all
 * POST / DELETE — admin only
 */

const express = require('express');
const {
  getOwnerMappings,
  createOwnerMapping,
  deleteOwnerMapping
} = require('../controllers/restaurantController');

const { authenticate }          = require('../middleware/authMiddleware');
const { requireAdmin }          = require('../middleware/roleMiddleware');

const router = express.Router();

// BUG FIX: owners need to call this to find their restaurantId.
// Admin gets all mappings; owner gets only their own.
router.get('/', authenticate, async (req, res, next) => {
  if (req.user.role === 'admin') {
    return getOwnerMappings(req, res, next);
  }
  // Owner: return only their own mapping as an array
  try {
    const OwnerMapping = require('../models/OwnerMapping');
    const mapping = await OwnerMapping.findOne({ email: req.user.email.toLowerCase() });
    return res.json(mapping ? [mapping] : []);
  } catch (err) { next(err); }
});

router.post('/',         authenticate, requireAdmin, createOwnerMapping);
router.delete('/:email', authenticate, requireAdmin, deleteOwnerMapping);

module.exports = router;
