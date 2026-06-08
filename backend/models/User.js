/**
 * User.js — Mongoose model
 */

const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name          : { type: String, required: true, trim: true },
    email         : { type: String, required: true, unique: true, lowercase: true, trim: true },
    password      : { type: String, required: true },
    role          : { type: String, enum: ['admin', 'owner', 'student'], default: 'student' },
    loyaltyPoints : { type: Number, default: 0 },
    avatar        : { type: String, default: '' },
    mobileNumber  : { type: String, default: '' },
    birthDate     : { type: Date,   default: null },
    resetToken        : { type: String,  default: null },
    resetTokenExpires : { type: Date,    default: null }
  },
  { timestamps: true }
);

userSchema.methods.toSafeObject = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
