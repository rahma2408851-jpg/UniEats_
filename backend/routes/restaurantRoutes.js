/**
 * restaurantRoutes.js
 * Routes for the /api/restaurants resource (including menu items & owner mappings).
 *
 * Public (no auth):
 *   GET  /api/restaurants
 *   GET  /api/restaurants/:id
 *
 * Admin + Owner:
 *   POST   /api/restaurants
 *   PUT    /api/restaurants/:id
 *   POST   /api/restaurants/:id/items
 *   PUT    /api/restaurants/:id/items
 *   DELETE /api/restaurants/:id/items
 *
 * Admin only:
 *   DELETE /api/restaurants/:id
 *   GET    /api/owner-mappings
 *   POST   /api/owner-mappings
 *   DELETE /api/owner-mappings/:email
 */

const express = require('express');
const {
  getAllRestaurants,
  getRestaurantById,
  createRestaurant,
  updateRestaurant,
  deleteRestaurant,
  addMenuItem,
  updateMenuItem,
  deleteMenuItem,
  getOwnerMappings,
  createOwnerMapping,
  deleteOwnerMapping
} = require('../controllers/restaurantController');

const { authenticate }          = require('../middleware/authMiddleware');
const { requireAdmin, requireOwnerOrAdmin } = require('../middleware/roleMiddleware');
const upload                    = require('../middleware/uploadMiddleware');

const router = express.Router();

// ── Public ──────────────────────────────────────────────────────────────────
router.get('/',    getAllRestaurants);
router.get('/:id', getRestaurantById);

// ── Admin + Owner ────────────────────────────────────────────────────────────
router.post('/',    authenticate, requireOwnerOrAdmin, createRestaurant);
router.put('/:id',  authenticate, requireOwnerOrAdmin, updateRestaurant);

// Menu items
router.post('/:id/items',   authenticate, requireOwnerOrAdmin, addMenuItem);
router.put('/:id/items',    authenticate, requireOwnerOrAdmin, updateMenuItem);
router.delete('/:id/items', authenticate, requireOwnerOrAdmin, deleteMenuItem);

// ── File upload (returns { url } for use in image fields) ───────────────────
// POST /api/restaurants/upload   multipart field name: "image"
router.post(
  '/upload',
  authenticate,
  requireOwnerOrAdmin,
  upload.single('image'),
  (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No image file received.' });
    const url = `/uploads/${req.file.filename}`;
    return res.status(201).json({ url, filename: req.file.filename });
  }
);

// ── Admin only ───────────────────────────────────────────────────────────────
router.delete('/:id', authenticate, requireAdmin, deleteRestaurant);

module.exports = router;
