/**
 * seedOwners.js
 * Run AFTER Seed.js so the restaurants already exist in MongoDB.
 *
 * Usage:
 *   cd backend
 *   node seedOwners.js
 */

require('dotenv').config();
const mongoose     = require('mongoose');
const bcrypt       = require('bcryptjs');
const User         = require('./models/User');
const Restaurant   = require('./models/Restaurant');
const OwnerMapping = require('./models/OwnerMapping');

const SALT_ROUNDS = 10;

const ADMIN = {
  name    : 'Platform Admin',
  email   : 'admin@unieats.com',
  password: 'Admin@UniEats2026',
  role    : 'admin'
};

// Fix #17: restaurant IDs are looked up by name at runtime, not hardcoded
const OWNERS = [
  { name: 'Gyro Owner',      email: 'gyro@unieats.com',      password: 'Gyro@Owner2026',      role: 'owner', restaurantName: 'Gyro'      },
  { name: 'TBS Owner',       email: 'tbs@unieats.com',        password: 'TBS@Owner2026',        role: 'owner', restaurantName: 'TBS'       },
  { name: 'Cinnabon Owner',  email: 'cinnabon@unieats.com',   password: 'Cinnabon@Owner2026',   role: 'owner', restaurantName: 'Cinnabon'  },
  { name: 'My Corner Owner', email: 'mycorner@unieats.com',   password: 'MyCorner@Owner2026',   role: 'owner', restaurantName: 'My Corner' },
  { name: 'Conitta Owner',   email: 'conitta@unieats.com',    password: 'Conitta@Owner2026',    role: 'owner', restaurantName: 'Conitta'   }
];

async function createUser(userData) {
  const existing = await User.findOne({ email: userData.email });
  if (existing) {
    console.log(`⏭  Skipped (already exists): ${userData.email}`);
    return existing;
  }
  const hashed = await bcrypt.hash(userData.password, SALT_ROUNDS);
  const user   = await User.create({
    name    : userData.name,
    email   : userData.email,
    password: hashed,
    role    : userData.role
  });
  console.log(`✅ Created: ${userData.email}`);
  return user;
}

async function createMapping(email, restaurantId) {
  const existing = await OwnerMapping.findOne({ email });
  if (existing) {
    console.log(`⏭  Mapping already exists for: ${email}`);
    return;
  }
  await OwnerMapping.create({ email, restaurantIds: [restaurantId] });
  console.log(`🔑 Mapped: ${email} → ${restaurantId}`);
}

async function run() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    console.log('── Admin ──────────────────────────');
    await createUser(ADMIN);

    console.log('\n── Owners ─────────────────────────');
    for (const owner of OWNERS) {
      await createUser(owner);

      // Fix #17: look up the real ObjectId by restaurant name
      const restaurant = await Restaurant.findOne({ name: owner.restaurantName });
      if (!restaurant) {
        console.warn(`⚠️  Restaurant not found: "${owner.restaurantName}" — run Seed.js first`);
        continue;
      }
      await createMapping(owner.email, restaurant._id);
    }

    console.log('\n══════════════════════════════════════');
    console.log('           CREDENTIALS SUMMARY');
    console.log('══════════════════════════════════════');
    console.log('\n👑 ADMIN');
    console.log(`   Email   : ${ADMIN.email}`);
    console.log(`   Password: ${ADMIN.password}`);
    console.log('\n🏪 OWNERS');
    OWNERS.forEach(o => {
      console.log(`\n   ${o.restaurantName}`);
      console.log(`   Email   : ${o.email}`);
      console.log(`   Password: ${o.password}`);
    });
    console.log('\n══════════════════════════════════════');
    console.log('✅ Done!\n');

    process.exit(0);
  } catch (err) {
    console.error('❌ Failed:', err.message);
    process.exit(1);
  }
}

run();
