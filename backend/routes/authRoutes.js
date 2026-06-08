/**
 * authRoutes.js
 */

const express = require('express');
const { register, login, logout, forgotPassword, resetPassword } = require('../controllers/authController');
const { authenticate } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/register',       register);
router.post('/login',          login);
router.post('/logout',         authenticate, logout);   // FIX #5 — requires valid token

// ─── Password reset ───────────────────────────────────────────────────────────
router.post('/forgot-password', forgotPassword);
router.post('/reset-password',  resetPassword);

module.exports = router;
