/**
 * seed.js
 * Run once to populate MongoDB with your existing data.
 *
 * Usage:
 *   cd backend
 *   node seed.js
 *
 * Safe to re-run — it clears existing data first so you won't get duplicates.
 */

require('dotenv').config();
const mongoose   = require('mongoose');
const User       = require('./models/User');
const Restaurant = require('./models/Restaurant');
const OwnerMapping = require('./models/OwnerMapping');

// ─── Restaurants ───────────────────────────────────────────────────────────

const restaurants = [
  {
    name        : 'Gyro',
    description : 'Greek & Mediterranean',
    rating      : 4.5,
    deliveryTime: '15-20 mins',
    logo        : 'assets/gyro/logo.jpg',
    categories  : [
      {
        name : 'Main Dishes',
        items: [
          { name: 'Crispy Chicken Sandwich', price: 150, image: 'assets/gyro/crispy chicken sandwich.jpg' },
          { name: 'Greek Shawerma',          price: 155, image: 'assets/gyro/greek shawerma.webp'         },
          { name: 'Shawerma Meal',           price: 215, image: 'assets/gyro/shawerma meal.webp'          }
        ]
      },
      {
        name : 'Sides',
        items: [
          { name: 'Greek Salad', price: 95, image: 'assets/gyro/greek salad.webp'       },
          { name: 'Gyro Fries',  price: 65, image: 'assets/gyro/gyro fires.jpg'         },
          { name: 'Pita Fries',  price: 65, image: 'assets/gyro/pita fries.webp'        },
          { name: 'Honey Mustard Fries', price: 70, image: 'assets/gyro/honey mustard fries.webp' }
        ]
      },
      {
        name : 'Beverages',
        items: [
          { name: 'Soda', price: 30, image: 'assets/gyro/soda.webp' }
        ]
      }
    ]
  },
  {
    name        : 'TBS',
    description : 'Coffee & Sandwiches',
    rating      : 4.5,
    deliveryTime: '15-20 mins',
    logo        : 'assets/tbs/logo.jpg',
    categories  : [
      {
        name : 'Hot Beverages',
        items: [
          { name: 'Espresso',             price: 80,  image: 'assets/tbs/beverages/hot/expresso.jpg'         },
          { name: 'Latte',                price: 130, image: 'assets/tbs/beverages/hot/latte.jpg'            },
          { name: 'Mocha',                price: 120, image: 'assets/tbs/beverages/hot/mocha.jpg'            },
          { name: 'Hot Chocolate',        price: 110, image: 'assets/tbs/beverages/hot/hot chcolate.jpg'     },
          { name: 'Hot Matcha Coconut',   price: 120, image: 'assets/tbs/beverages/hot/hot matcha coconut.jpg' },
          { name: 'Tea',                  price: 50,  image: 'assets/tbs/beverages/hot/tea.jpg'              }
        ]
      },
      {
        name : 'Cold Beverages',
        items: [
          { name: 'Caramel Latte Frappe',          price: 150, image: 'assets/tbs/beverages/cold/caramel latte frappe.jpg'            },
          { name: 'Chocolate Peanutbutter Frappe',  price: 160, image: 'assets/tbs/beverages/cold/chocolate peanutbutter frappe.jpg'   },
          { name: 'Matcha Spanish Latte',           price: 140, image: 'assets/tbs/beverages/cold/matcha spanish latte.jpg'           },
          { name: 'Pink Lemonade',                  price: 90,  image: 'assets/tbs/beverages/cold/pink lemonade.jpg'                  },
          { name: 'Strawberry Matcha',              price: 140, image: 'assets/tbs/beverages/cold/strawberry matcha.jpg'              }
        ]
      },
      {
        name : 'Croissants',
        items: [
          { name: 'Plain Croissant',   price: 65,  image: 'assets/tbs/croissant/plain croissant.jpg'   },
          { name: 'Almond Croissant',  price: 85,  image: 'assets/tbs/croissant/almond croissant.jpg'  },
          { name: 'Nutella Croissant', price: 85,  image: 'assets/tbs/croissant/nutella croissant.jpg' },
          { name: 'Cheddar Croissant', price: 85,  image: 'assets/tbs/croissant/chedder croissant.jpg' },
          { name: 'Zaatar Croissant',  price: 75,  image: 'assets/tbs/croissant/zaater croissant.jpg'  }
        ]
      },
      {
        name : 'Salads',
        items: [
          { name: 'Chicken Caesar Salad',  price: 150, image: 'assets/tbs/salads/chicken caesar salad.jpg'  },
          { name: 'Chicken Italian Salad', price: 150, image: 'assets/tbs/salads/chicken italian salad.jpg' },
          { name: 'Make Your Own Salad',   price: 120, image: 'assets/tbs/salads/make your own salad.jpg'   }
        ]
      }
    ]
  },
  {
    name        : 'Cinnabon',
    description : 'Fresh Baked Daily',
    rating      : 4.5,
    deliveryTime: '15-20 mins',
    logo        : 'assets/cinnabon/logo.jpeg',
    categories  : [
      {
        name : 'Baked Goods',
        items: [
          { name: 'Cinnabon Classic Roll', price: 139, image: 'assets/cinnabon/baked goods/cinnabon-classic-roll.jpg' },
          { name: 'Chocobon',              price: 159, image: 'assets/cinnabon/baked goods/chocobon.jpg'              },
          { name: 'Caramel Roll',          price: 159, image: 'assets/cinnabon/baked goods/caramel-roll.jpg'          },
          { name: 'Caramel Pecanbon',      price: 179, image: 'assets/cinnabon/baked goods/caramel-pecanbon-roll.jpg' },
          { name: 'Choco Pecanbon',        price: 179, image: 'assets/cinnabon/baked goods/choco-pecanbon.jpg'        }
        ]
      },
      {
        name : 'Cold Beverages',
        items: [
          { name: 'Chillatta Caramel',         price: 120, image: 'assets/cinnabon/beverages/cold/chillatta-caramel.jpg'          },
          { name: 'Chillatta Cookies & Cream',  price: 120, image: 'assets/cinnabon/beverages/cold/chillatta-cookies-cream.jpg'   },
          { name: 'Chillatta Cappuccino',       price: 120, image: 'assets/cinnabon/beverages/cold/chillattas-cappuccino.jpg'     },
          { name: 'Chillatta Strawberry',       price: 120, image: 'assets/cinnabon/beverages/cold/chillatta-strawberry.jpg'      },
          { name: 'Chillatta Tropical Blast',   price: 120, image: 'assets/cinnabon/beverages/cold/chillatta-tropical-blast.jpg'  }
        ]
      },
      {
        name : 'Hot Beverages',
        items: [
          { name: 'Americano',            price: 80,  image: 'assets/cinnabon/beverages/hot/americano.jpg'              },
          { name: 'Cappuccino',           price: 90,  image: 'assets/cinnabon/beverages/hot/cappuccino.jpg'             },
          { name: 'Latte',                price: 95,  image: 'assets/cinnabon/beverages/hot/latte.jpg'                  },
          { name: 'Mocha',                price: 100, image: 'assets/cinnabon/beverages/hot/mocha.jpg'                  },
          { name: 'Signature Hot Chocolate', price: 100, image: 'assets/cinnabon/beverages/hot/signature-hot-chocolate.jpg' }
        ]
      }
    ]
  },
  {
    name        : 'My Corner',
    description : 'Home-style Favorites',
    rating      : 4.5,
    deliveryTime: '15-20 mins',
    logo        : 'assets/mycorner/logo.jpg',
    categories  : [
      {
        name : 'Sandwiches',
        items: [
          { name: 'Foul with Olive Oil',     price: 20,  image: 'assets/mycorner/foul with olive oil.jpg'        },
          { name: 'Foul with Flaxseed Oil',  price: 20,  image: 'assets/mycorner/foul with flaxseed oil.jpg'     },
          { name: 'Cottage Cheese Sandwich', price: 30,  image: 'assets/mycorner/cottage cheese sandwich.jpg'    },
          { name: 'Stuffed Falafel Sandwich',price: 35,  image: 'assets/mycorner/stuffed flafel sandwich.jpg'    },
          { name: 'Fries Sandwich',          price: 40,  image: 'assets/mycorner/fries sandwich.jpg'             },
          { name: 'Spanish Omelette Sandwich',price: 55, image: 'assets/mycorner/spanish omlette sandwish.jpg'   },
          { name: 'Crispy Chicken Crepe',    price: 150, image: 'assets/mycorner/crispy chicken crepe.jpg'       }
        ]
      }
    ]
  },
  {
    name        : 'Conitta',
    description : 'Sweet Treats',
    rating      : 4.5,
    deliveryTime: '15-20 mins',
    logo        : 'assets/conitta/logo.png',
    categories  : [
      {
        name : 'Desserts',
        items: [
          { name: 'Brownie',             price: 50,  image: 'assets/conitta/Brownie.webp'                  },
          { name: 'Cookie',              price: 70,  image: 'assets/conitta/Cookie.webp'                   },
          { name: 'Conitta Rolls',       price: 90,  image: 'assets/conitta/Conitta_Rolls.webp'            },
          { name: 'Soft Ice Cream',      price: 80,  image: 'assets/conitta/Soft_Ice_Cream.webp'           },
          { name: 'Cookies and Cream Cup', price: 95, image: 'assets/conitta/Cookies and Cream_Ccup.webp'  },
          { name: 'The C-Taco',          price: 85,  image: 'assets/conitta/The_Ctaco.webp'                },
          { name: 'The Eclair',          price: 90,  image: 'assets/conitta/The_ecalair.webp'              }
        ]
      }
    ]
  }
];

// ─── Users (from your existing users.json — passwords already hashed) ──────

const users = [
  {
    name    : 'Student One',
    email   : 'student@uni.edu',
    password: '$2a$10$qbtAv810dIN7EDt8vOAdxet9zFrhfXI5EVqFLeRGvyLvzUiHhB73O',
    role    : 'student'
  },
  {
    name    : 'Admin One',
    email   : 'admin@uni.edu',
    password: '$2a$10$5LuSzyfcNNB9lGpi6ksEO.9L9S5oWBNaRCWCErYAKgyfC1A6mj53W',
    role    : 'admin'
  },
  {
    name    : 'Owner One',
    email   : 'owner@uni.edu',
    password: '$2a$10$IpC.6p9daTwE2cDVJp.2qexh86cMM84EV9lXUeyGTTgojImRmBZYe',
    role    : 'owner'
  },
  {
    name    : 'rawanbakr',
    email   : 'rawanbakr285@gmail.com',
    password: '$2a$10$kvkseqj5HnKvrRkbVw2MnukAVD0Sym4xnUxEthVoVrtUYgTBZBw7q',
    role    : 'student'
  }
];

// ─── Seed ──────────────────────────────────────────────────────────────────

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await Restaurant.deleteMany({});
    await User.deleteMany({});
    await OwnerMapping.deleteMany({});
    console.log('🗑  Cleared existing collections');

    // Insert restaurants
    const insertedRestaurants = await Restaurant.insertMany(restaurants);
    console.log(`🍔 Inserted ${insertedRestaurants.length} restaurants`);

    // Insert users
    const insertedUsers = await User.insertMany(users);
    console.log(`👤 Inserted ${insertedUsers.length} users`);

    // Build owner mappings:
    // owner@uni.edu → owns all 5 restaurants (for testing)
    const ownerUser = insertedUsers.find(u => u.email === 'owner@uni.edu');
    const allRestaurantIds = insertedRestaurants.map(r => r._id);

    await OwnerMapping.create({
      email        : ownerUser.email,
      restaurantIds: allRestaurantIds
    });
    console.log(`🔑 Created owner mapping for ${ownerUser.email}`);

    // Print restaurant IDs so you can update frontend references
    console.log('\n📋 Restaurant IDs (save these):');
    insertedRestaurants.forEach(r => {
      console.log(`   ${r.name}: ${r._id}`);
    });

    console.log('\n✅ Seed complete!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed failed:', err.message);
    process.exit(1);
  }
}

seed();