/**
 * userController.js
 * Data layer: Mongoose (was: JSON flat files)
 */

const bcrypt = require('bcryptjs');
const User   = require('../models/User');

const SALT_ROUNDS = 10;

// ─── Read ──────────────────────────────────────────────────────────────────

async function getAllUsers(req, res, next) {
  try {
    const filter = {};
    if (req.query.role)  filter.role  = req.query.role;
    if (req.query.email) filter.email = req.query.email.toLowerCase();

    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const skip  = (page - 1) * limit;

    const [users, total] = await Promise.all([
      User.find(filter).select('-password').skip(skip).limit(limit),
      User.countDocuments(filter)
    ]);

    // If caller doesn't send ?page= just return the array (backward compat)
    if (!req.query.page && !req.query.limit) {
      return res.json(users);
    }

    return res.json({
      users,
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

async function getUserById(req, res, next) {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found.' });
    return res.json(user);
  } catch (err) {
    next(err);
  }
}

// ─── Self endpoints ────────────────────────────────────────────────────────

async function getOwnProfile(req, res, next) {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found.' });
    return res.json(user);
  } catch (err) {
    next(err);
  }
}

async function updateOwnProfile(req, res, next) {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found.' });

    const { name, email, password } = req.body;

    if (name && typeof name === 'string') {
      const trimmedName = name.trim();
      if (trimmedName.length < 2) {
        return res.status(400).json({ error: 'Name must be at least 2 characters.' });
      }
      if (trimmedName.length > 100) {
        return res.status(400).json({ error: 'Name must be 100 characters or less.' });
      }
      user.name = trimmedName;
    }

    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ error: 'Invalid email format.' });
      }
      const emailTaken = await User.findOne({
        email: email.toLowerCase().trim(),
        _id  : { $ne: user._id }
      });
      if (emailTaken) {
        return res.status(409).json({ error: 'Another user with that email already exists.' });
      }
      user.email = email.toLowerCase().trim();
    }

    if (password) {
      if (password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters.' });
      }
      user.password = await bcrypt.hash(password, SALT_ROUNDS);
    }

    await user.save();
    return res.json(user.toSafeObject());
  } catch (err) {
    next(err);
  }
}

// ─── Admin Update ──────────────────────────────────────────────────────────

async function updateUser(req, res, next) {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found.' });

    const { name, email, password, role } = req.body;

    if (name && typeof name === 'string') {
      const trimmedName = name.trim();
      if (trimmedName.length < 2) {
        return res.status(400).json({ error: 'Name must be at least 2 characters.' });
      }
      if (trimmedName.length > 100) {
        return res.status(400).json({ error: 'Name must be 100 characters or less.' });
      }
      user.name = trimmedName;
    }

    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ error: 'Invalid email format.' });
      }
      const emailTaken = await User.findOne({
        email: email.toLowerCase().trim(),
        _id  : { $ne: user._id }
      });
      if (emailTaken) {
        return res.status(409).json({ error: 'Another user with that email already exists.' });
      }
      user.email = email.toLowerCase().trim();
    }

    if (password) {
      if (password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters.' });
      }
      user.password = await bcrypt.hash(password, SALT_ROUNDS);
    }

    if (role && ['admin', 'owner', 'student'].includes(role)) {
      user.role = role;
    } else if (role) {
      return res.status(400).json({ error: 'Invalid role. Allowed: admin, owner, student.' });
    }

    await user.save();
    return res.json(user.toSafeObject());
  } catch (err) {
    next(err);
  }
}

// ─── Delete ────────────────────────────────────────────────────────────────

async function deleteUser(req, res, next) {
  try {
    const user = await User.findByIdAndDelete(req.params.id).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found.' });
    return res.json({ message: 'User deleted.', user });
  } catch (err) {
    next(err);
  }
}

module.exports = { getAllUsers, getUserById, getOwnProfile, updateOwnProfile, updateUser, deleteUser };