const Category = require('../models/Category');
const Item = require('../models/Item');

// GET /api/categories
const getAllCategories = async (req, res, next) => {
  try {
    const categories = await Category.find().sort({ name: 1 });
    res.json(categories);
  } catch (error) {
    next(error);
  }
};

// GET /api/categories/:id
const getCategoryById = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }
    res.json(category);
  } catch (error) {
    next(error);
  }
};

// POST /api/categories
const createCategory = async (req, res, next) => {
  try {
    const category = new Category(req.body);
    await category.save();
    res.status(201).json(category);
  } catch (error) {
    next(error);
  }
};

// PUT /api/categories/:id
const updateCategory = async (req, res, next) => {
  try {
    const oldCategory = await Category.findById(req.params.id);
    if (!oldCategory) {
      return res.status(404).json({ message: 'Category not found' });
    }

    const oldName = oldCategory.name;
    const newName = req.body.name;

    const updated = await Category.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    // If the name changed, update all items that referenced the old name
    if (newName && newName !== oldName) {
      await Item.updateMany({ category: oldName }, { $set: { category: newName } });
    }

    res.json(updated);
  } catch (error) {
    next(error);
  }
};

// DELETE /api/categories/:id
// Reject deletion if items still reference this category
const deleteCategory = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    const itemCount = await Item.countDocuments({ category: category.name });
    if (itemCount > 0) {
      return res.status(409).json({
        message: `Cannot delete category '${category.name}' — it still has ${itemCount} item(s). Reassign or delete those items first.`,
      });
    }

    await Category.findByIdAndDelete(req.params.id);
    res.json({ message: 'Category deleted successfully', id: category._id });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
};
