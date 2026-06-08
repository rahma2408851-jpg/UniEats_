/**
 * OwnerMapping.js — Mongoose model
 * Replaces data/ownerMappings.json
 * Maps one owner email → array of restaurant ObjectIds they manage.
 */

const mongoose = require('mongoose');

const ownerMappingSchema = new mongoose.Schema(
  {
    email        : { type: String, required: true, unique: true, lowercase: true, trim: true },
    restaurantIds: { type: [mongoose.Schema.Types.ObjectId], ref: 'Restaurant', default: [] }
  },
  { timestamps: true }
);

module.exports = mongoose.model('OwnerMapping', ownerMappingSchema);