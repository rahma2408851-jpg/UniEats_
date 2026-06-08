/**
 * restaurantController.js
 * Data layer: Mongoose (was: JSON flat files)
 */

const mongoose     = require('mongoose');
const Restaurant   = require('../models/Restaurant');
const OwnerMapping = require('../models/OwnerMapping');

// ─── Helpers ───────────────────────────────────────────────────────────────

async function canModifyRestaurant(user, restaurantId) {
  if (user.role === 'admin') return true;
  const mapping  = await OwnerMapping.findOne({ email: user.email.toLowerCase() });
  const ownedIds = mapping ? mapping.restaurantIds.map(String) : [];
  return ownedIds.includes(String(restaurantId));
}

// ─── Restaurants ───────────────────────────────────────────────────────────

async function getAllRestaurants(req, res, next) {
  try {
    const search = (req.query.search || '').toLowerCase().trim();
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 10);
    const skip = (page - 1) * limit;

    let query = {};
    if (search) {
      query = {
        $or: [
          { name       : { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { 'categories.items.name': { $regex: search, $options: 'i' } }
        ]
      };
    }

    const total = await Restaurant.countDocuments(query);
    const restaurants = await Restaurant.find(query).skip(skip).limit(limit).lean();

    return res.json({
      data: restaurants,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasNext: skip + limit < total,
        hasPrev: page > 1
      }
    });
  } catch (err) {
    next(err);
  }
}

async function getRestaurantById(req, res, next) {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid restaurant ID.' });
    }
    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) return res.status(404).json({ error: 'Restaurant not found.' });
    return res.json(restaurant);
  } catch (err) {
    next(err);
  }
}

async function createRestaurant(req, res, next) {
  try {
    const { name, description, rating, deliveryTime, categories } = req.body;

    if (!name || !deliveryTime) {
      return res.status(400).json({ error: 'Restaurant name and delivery time are required.' });
    }

    const existing = await Restaurant.findOne({ name: { $regex: `^${name}$`, $options: 'i' } });
    if (existing) {
      return res.status(409).json({ error: 'A restaurant with that name already exists.' });
    }

    const restaurant = await Restaurant.create({
      name,
      description : description || '',
      rating      : rating !== undefined ? Number(rating) : 0,
      deliveryTime,
      categories  : Array.isArray(categories) ? categories : []
    });

    return res.status(201).json(restaurant);
  } catch (err) {
    next(err);
  }
}

async function updateRestaurant(req, res, next) {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid restaurant ID.' });
    }
    if (!(await canModifyRestaurant(req.user, req.params.id))) {
      return res.status(403).json({ error: 'You do not own this restaurant.' });
    }

    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) return res.status(404).json({ error: 'Restaurant not found.' });

    const { name, description, rating, deliveryTime, categories } = req.body;

    if (name)                       restaurant.name         = name.trim();
    if (description !== undefined)  restaurant.description  = description;
    if (rating      !== undefined)  restaurant.rating       = Number(rating);
    if (deliveryTime)               restaurant.deliveryTime = deliveryTime;
    if (categories  !== undefined)  restaurant.categories   = Array.isArray(categories) ? categories : restaurant.categories;

    await restaurant.save();
    return res.json(restaurant);
  } catch (err) {
    next(err);
  }
}

async function deleteRestaurant(req, res, next) {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid restaurant ID.' });
    }
    const restaurant = await Restaurant.findByIdAndDelete(req.params.id);
    if (!restaurant) return res.status(404).json({ error: 'Restaurant not found.' });
    return res.json({ message: 'Restaurant deleted.', restaurant });
  } catch (err) {
    next(err);
  }
}

// ─── Menu Items ────────────────────────────────────────────────────────────

async function addMenuItem(req, res, next) {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid restaurant ID.' });
    }
    if (!(await canModifyRestaurant(req.user, req.params.id))) {
      return res.status(403).json({ error: 'You do not own this restaurant.' });
    }

    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) return res.status(404).json({ error: 'Restaurant not found.' });

    const { category, name, price, image } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ error: 'Item name is required.' });
    }
    if (price === undefined || isNaN(Number(price)) || Number(price) < 0) {
      return res.status(400).json({ error: 'A valid non-negative price is required.' });
    }

    const categoryName = (category || 'Menu').trim();
    let categoryObj    = restaurant.categories.find(
      c => c.name.toLowerCase() === categoryName.toLowerCase()
    );

    if (!categoryObj) {
      restaurant.categories.push({ name: categoryName, items: [] });
      categoryObj = restaurant.categories[restaurant.categories.length - 1];
    }

    if (categoryObj.items.some(i => i.name.toLowerCase() === name.toLowerCase())) {
      return res.status(409).json({ error: 'An item with that name already exists in this category.' });
    }

    categoryObj.items.push({ name: name.trim(), price: Number(price), image: image || '' });
    await restaurant.save();
    return res.status(201).json(restaurant);
  } catch (err) {
    next(err);
  }
}

async function updateMenuItem(req, res, next) {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid restaurant ID.' });
    }
    if (!(await canModifyRestaurant(req.user, req.params.id))) {
      return res.status(403).json({ error: 'You do not own this restaurant.' });
    }

    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) return res.status(404).json({ error: 'Restaurant not found.' });

    const { category, originalName, name, price, image, newCategory } = req.body;

    if (!category || !originalName || !name || price === undefined) {
      return res.status(400).json({ error: 'category, originalName, name, and price are all required.' });
    }
    if (isNaN(Number(price)) || Number(price) < 0) {
      return res.status(400).json({ error: 'A valid non-negative price is required.' });
    }

    const categoryObj = restaurant.categories.find(
      c => c.name.toLowerCase() === category.toLowerCase()
    );
    if (!categoryObj) return res.status(404).json({ error: 'Category not found.' });

    const itemIdx = categoryObj.items.findIndex(
      i => i.name.toLowerCase() === originalName.toLowerCase()
    );
    if (itemIdx === -1) return res.status(404).json({ error: 'Item not found.' });

    const item = categoryObj.items[itemIdx];
    item.name  = name.trim();
    item.price = Number(price);
    if (image !== undefined) item.image = image; // preserve image when not re-uploaded

    // Move item to a different category if newCategory is specified and different
    const targetCategoryName = (newCategory || '').trim();
    if (targetCategoryName && targetCategoryName.toLowerCase() !== category.toLowerCase()) {
      let targetCat = restaurant.categories.find(
        c => c.name.toLowerCase() === targetCategoryName.toLowerCase()
      );
      if (!targetCat) {
        restaurant.categories.push({ name: targetCategoryName, items: [] });
        targetCat = restaurant.categories[restaurant.categories.length - 1];
      }
      targetCat.items.push(item);
      categoryObj.items.splice(itemIdx, 1);
    }

    await restaurant.save();
    return res.json(restaurant);
  } catch (err) {
    next(err);
  }
}

async function deleteMenuItem(req, res, next) {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid restaurant ID.' });
    }
    if (!(await canModifyRestaurant(req.user, req.params.id))) {
      return res.status(403).json({ error: 'You do not own this restaurant.' });
    }

    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) return res.status(404).json({ error: 'Restaurant not found.' });

    const { category, name } = req.body;
    if (!category || !name) {
      return res.status(400).json({ error: 'Category and item name are required.' });
    }

    const categoryObj = restaurant.categories.find(
      c => c.name.toLowerCase() === category.toLowerCase()
    );
    if (!categoryObj) return res.status(404).json({ error: 'Category not found.' });

    const itemIdx = categoryObj.items.findIndex(
      i => i.name.toLowerCase() === name.toLowerCase()
    );
    if (itemIdx === -1) return res.status(404).json({ error: 'Item not found.' });

    categoryObj.items.splice(itemIdx, 1);
    await restaurant.save();
    return res.json(restaurant);
  } catch (err) {
    next(err);
  }
}

// ─── Owner Mappings ────────────────────────────────────────────────────────

async function getOwnerMappings(req, res, next) {
  try {
    const mappings = await OwnerMapping.find();
    return res.json(mappings);
  } catch (err) {
    next(err);
  }
}

async function createOwnerMapping(req, res, next) {
  try {
    const { email, restaurantIds } = req.body;

    if (!email || !Array.isArray(restaurantIds)) {
      return res.status(400).json({ error: 'Owner email and restaurantIds array are required.' });
    }

    const normalised = email.toLowerCase().trim();

    const mapping = await OwnerMapping.findOneAndUpdate(
      { email: normalised },
      { email: normalised, restaurantIds },
      { upsert: true, new: true }
    );

    return res.status(201).json(mapping);
  } catch (err) {
    next(err);
  }
}

async function deleteOwnerMapping(req, res, next) {
  try {
    const email   = req.params.email.toLowerCase();
    const mapping = await OwnerMapping.findOneAndDelete({ email });
    if (!mapping) return res.status(404).json({ error: 'Owner mapping not found.' });
    return res.json({ message: 'Owner mapping deleted.', email });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getAllRestaurants, getRestaurantById, createRestaurant, updateRestaurant, deleteRestaurant,
  addMenuItem, updateMenuItem, deleteMenuItem,
  getOwnerMappings, createOwnerMapping, deleteOwnerMapping
};