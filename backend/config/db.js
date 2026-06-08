/**
 * db.js
 * Connects to MongoDB via Mongoose.
 * Call connectDB() once in server.js before app.listen().
 */

const mongoose = require('mongoose');

async function connectDB() {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`✅ MongoDB connected → ${conn.connection.host}`);
  } catch (err) {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1); // Exit so the problem is immediately visible
  }
}

module.exports = connectDB;
