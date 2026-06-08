/**
 * Order.js — Mongoose model
 * Mirrors the shape previously stored in data/orders.json
 */

const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema(
  {
    name        : { type: String, required: true },
    price       : { type: Number, required: true },
    quantity    : { type: Number, default: 1 },
    restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant' }
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    email       : { type: String, required: true, lowercase: true, trim: true },
    items       : { type: [orderItemSchema], required: true },
    total       : { type: Number, required: true },
    comment     : { type: String, default: '' },
    status      : {
      type   : String,
      enum   : ['Pending', 'Preparing', 'Ready', 'Completed'],
      default: 'Pending'
    },
    restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', default: null },
    pickupTime  : { type: Date, default: null }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Order', orderSchema);