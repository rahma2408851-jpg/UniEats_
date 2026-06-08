/**
 * authController.js
 * Handles: Register, Login, Logout, Forgot Password, Reset Password
 * Data layer: Mongoose (was: JSON flat files)
 */

const nodemailer = require('nodemailer');
const bcrypt     = require('bcryptjs');
const jwt        = require('jsonwebtoken');
const crypto     = require('crypto');
const User       = require('../models/User');
const { blockToken } = require('../middleware/authMiddleware');

const SALT_ROUNDS = 10;

// ─── Email transporter ────────────────────────────────────────────────────────

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function signToken(user) {
  return jwt.sign(
    { id: user._id, name: user.name, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// ─── REGISTER ─────────────────────────────────────────────────────────────────

async function register(req, res, next) {
  try {
    const { name, email, password, mnumber, bdate } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    }
    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'Invalid email format.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }
    if (mnumber && !/^[0-9]+$/.test(mnumber)) {
      return res.status(400).json({ error: 'Mobile number must contain numbers only.' });
    }
    if (bdate) {
      const d = new Date(bdate);
      if (isNaN(d.getTime()) || d < new Date('1906-01-01') || d > new Date('2013-01-01')) {
        return res.status(400).json({ error: 'Please enter a valid birth date.' });
      }
    }

    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.status(409).json({ error: 'A user with that email already exists.' });
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    // Fix #16: always register as student — admin/owner assigned by admin only
    const newUser = await User.create({
      name,
      email,
      password    : hashedPassword,
      role        : 'student',
      mobileNumber: mnumber || '',
      birthDate   : bdate ? new Date(bdate) : null
    });

    return res.status(201).json(newUser.toSafeObject());
  } catch (err) {
    next(err);
  }
}

// ─── LOGIN ────────────────────────────────────────────────────────────────────

async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    const token = signToken(user);

    return res.json({
      token,
      id   : user._id,
      name : user.name,
      email: user.email,
      role : user.role,
      user : { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (err) {
    next(err);
  }
}

// ─── LOGOUT ───────────────────────────────────────────────────────────────────

async function logout(req, res, next) {
  try {
    blockToken(req.token);
    return res.json({ message: 'Logged out successfully.' });
  } catch (err) {
    next(err);
  }
}

// ─── FORGOT PASSWORD ──────────────────────────────────────────────────────────

async function forgotPassword(req, res, next) {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required.' });

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) return res.status(404).json({ error: 'No account found with that email.' });

    // Fix #10: store token in DB so it survives server restarts
    const token = crypto.randomBytes(32).toString('hex');
    user.resetToken        = token;
    user.resetTokenExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await user.save();

    // Fix #3: use clean EJS route — not /pages/reset-password.html
    const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${token}`;

    await transporter.sendMail({
      from   : `"UNIEats" <${process.env.EMAIL_USER}>`,
      to     : user.email,
      subject: 'Reset Your UNIEats Password',
      html   : `
        <div style="font-family:Arial;padding:30px;background:#faf7f2;color:#222;">
          <h1>UNIEats Password Reset</h1>
          <p>We received a request to reset your password.</p>
          <a href="${resetLink}" style="
            display:inline-block;padding:12px 22px;background:black;
            color:white;text-decoration:none;border-radius:8px;margin-top:10px;">
            Reset Password
          </a>
          <p style="margin-top:25px;font-size:14px;color:#666;">
            This link expires in 1 hour. If you didn't request this, ignore this email.
          </p>
        </div>
      `
    });

    return res.json({ message: 'Reset email sent successfully.' });
  } catch (err) {
    next(err);
  }
}

// ─── RESET PASSWORD ───────────────────────────────────────────────────────────

async function resetPassword(req, res, next) {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ error: 'Token and password are required.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }

    // Fix #10: look up token from DB instead of in-memory object
    const user = await User.findOne({
      resetToken       : token,
      resetTokenExpires: { $gt: new Date() }
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired token.' });
    }

    user.password          = await bcrypt.hash(password, SALT_ROUNDS);
    user.resetToken        = null;
    user.resetTokenExpires = null;
    await user.save();

    return res.json({ message: 'Password reset successful.' });
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login, logout, forgotPassword, resetPassword };
