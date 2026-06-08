/**
 * Restaurant.js — Mongoose model
 * Mirrors the shape previously stored in data/restaurants.json
 * Categories + items are embedded subdocuments (no separate collection needed).
 */

const mongoose = require('mongoose');

const menuItemSchema = new mongoose.Schema(
  {
    name : { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    image: { type: String, default: '' }
  },
  { _id: false } // items don't need their own _id
);

const categorySchema = new mongoose.Schema(
  {
    name : { type: String, required: true, trim: true },
    items: { type: [menuItemSchema], default: [] }
  },
  { _id: false }
);

const restaurantSchema = new mongoose.Schema(
  {
    name        : { type: String, required: true, unique: true, trim: true },
    description : { type: String, default: '' },
    rating      : { type: Number, default: 0, min: 0, max: 5 },
    deliveryTime: { type: String, required: true },
    logo        : { type: String, default: '' },
    categories  : { type: [categorySchema], default: [] }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Restaurant', restaurantSchema);