/**
 * userRoutes.js
 */

const express = require('express');
const {
  getAllUsers, getUserById,
  getOwnProfile, updateOwnProfile,
  updateUser, deleteUser
} = require('../controllers/userController');
const { authenticate } = require('../middleware/authMiddleware');
const { requireAdmin } = require('../middleware/roleMiddleware');
const upload = require('../middleware/uploadMiddleware');
const User = require('../models/User');

const router = express.Router();

// ── Own profile (any logged-in user) ──────────────────────────────────────
router.get('/me',  authenticate, getOwnProfile);
router.put('/me',  authenticate, updateOwnProfile);

// ── Profile picture upload ─────────────────────────────────────────────────
// POST /api/users/me/avatar   multipart field name: "avatar"
// Returns { url } which the client saves and sends back via PUT /api/users/me
router.post('/me/avatar', authenticate, upload.single('avatar'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No image file received.' });
    const url = `/uploads/${req.file.filename}`;
    // Persist the avatar URL on the user record
    await User.findOneAndUpdate({ email: req.user.email }, { avatar: url });
    return res.status(201).json({ url });
  } catch (err) { next(err); }
});

// ── Loyalty balance (reads from MongoDB now) ──────────────────────────────
router.get('/loyalty/:email', authenticate, async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.params.email.toLowerCase() }).select('email loyaltyPoints');
    if (!user) return res.status(404).json({ error: 'User not found.' });
    res.json({ email: user.email, loyaltyPoints: user.loyaltyPoints || 0 });
  } catch (err) { next(err); }
});

// ── Admin-only CRUD ────────────────────────────────────────────────────────
router.get('/',       authenticate, requireAdmin, getAllUsers);
router.get('/:id',    authenticate, requireAdmin, getUserById);
router.put('/:id',    authenticate, requireAdmin, updateUser);
router.delete('/:id', authenticate, requireAdmin, deleteUser);

module.exports = router;
