const Item = require('../models/Item');
const Category = require('../models/Category');

// GET /api/items
// Query params: category, status, search
const getAllItems = async (req, res, next) => {
  try {
    const { category, status, search } = req.query;
    const filter = {};

    if (category) filter.category = category;
    if (status) filter.status = status;

    if (search) {
      const regex = new RegExp(search, 'i');
      filter.$or = [{ name: regex }, { sku: regex }];
    }

    const items = await Item.find(filter).sort({ name: 1 });
    res.json(items);
  } catch (error) {
    next(error);
  }
};

// GET /api/items/:id
const getItemById = async (req, res, next) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }
    res.json(item);
  } catch (error) {
    next(error);
  }
};

// POST /api/items
const createItem = async (req, res, next) => {
  try {
    const item = new Item(req.body);
    await item.save();

    // Increment itemCount on the matching category
    await Category.findOneAndUpdate(
      { name: item.category },
      { $inc: { itemCount: 1 } }
    );

    res.status(201).json(item);
  } catch (error) {
    next(error);
  }
};

// PUT /api/items/:id
const updateItem = async (req, res, next) => {
  try {
    const existing = await Item.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ message: 'Item not found' });
    }

    const oldCategory = existing.category;
    const newCategory = req.body.category;

    Object.assign(existing, req.body);
    await existing.save(); // pre-save hook recalculates status

    // If category changed, adjust counts on both categories
    if (newCategory && newCategory !== oldCategory) {
      await Category.findOneAndUpdate({ name: oldCategory }, { $inc: { itemCount: -1 } });
      await Category.findOneAndUpdate({ name: newCategory }, { $inc: { itemCount: 1 } });
    }

    res.json(existing);
  } catch (error) {
    next(error);
  }
};

// DELETE /api/items/:id
const deleteItem = async (req, res, next) => {
  try {
    const item = await Item.findByIdAndDelete(req.params.id);
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    // Decrement category itemCount
    await Category.findOneAndUpdate(
      { name: item.category },
      { $inc: { itemCount: -1 } }
    );

    res.json({ message: 'Item deleted successfully', id: item._id });
  } catch (error) {
    next(error);
  }
};

// POST /api/items/bulk-delete
// Body: { ids: ["id1", "id2", ...] }
const bulkDelete = async (req, res, next) => {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: 'ids must be a non-empty array' });
    }

    // Fetch items first so we can update category counts
    const items = await Item.find({ _id: { $in: ids } });

    if (items.length === 0) {
      return res.status(404).json({ message: 'No items found for given ids' });
    }

    // Tally category decrements
    const categoryDecrements = {};
    items.forEach((item) => {
      categoryDecrements[item.category] = (categoryDecrements[item.category] || 0) + 1;
    });

    await Item.deleteMany({ _id: { $in: ids } });

    // Update category counts in parallel
    await Promise.all(
      Object.entries(categoryDecrements).map(([categoryName, count]) =>
        Category.findOneAndUpdate({ name: categoryName }, { $inc: { itemCount: -count } })
      )
    );

    res.json({ message: `${items.length} item(s) deleted`, deleted: items.length });
  } catch (error) {
    next(error);
  }
};

// POST /api/items/import
// Body: { items: [...] }
// Upserts by SKU. Also syncs category itemCounts after bulk import.
const importItems = async (req, res, next) => {
  try {
    const { items } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'items must be a non-empty array' });
    }

    const results = { upserted: 0, errors: [] };

    for (const itemData of items) {
      try {
        if (!itemData.sku) {
          results.errors.push({ item: itemData, message: 'SKU is required' });
          continue;
        }

        // Normalize SKU to uppercase
        const sku = String(itemData.sku).toUpperCase().trim();

        const existing = await Item.findOne({ sku });

        if (existing) {
          // Track old category for count adjustment
          const oldCategory = existing.category;
          Object.assign(existing, { ...itemData, sku });
          await existing.save();

          const newCategory = existing.category;
          if (newCategory !== oldCategory) {
            await Category.findOneAndUpdate({ name: oldCategory }, { $inc: { itemCount: -1 } });
            await Category.findOneAndUpdate({ name: newCategory }, { $inc: { itemCount: 1 } });
          }
        } else {
          const newItem = new Item({ ...itemData, sku });
          await newItem.save();
          await Category.findOneAndUpdate(
            { name: newItem.category },
            { $inc: { itemCount: 1 } }
          );
        }

        results.upserted += 1;
      } catch (itemError) {
        results.errors.push({ item: itemData, message: itemError.message });
      }
    }

    res.status(200).json({
      message: `Import complete: ${results.upserted} upserted, ${results.errors.length} failed`,
      ...results,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllItems,
  getItemById,
  createItem,
  updateItem,
  deleteItem,
  bulkDelete,
  importItems,
};
