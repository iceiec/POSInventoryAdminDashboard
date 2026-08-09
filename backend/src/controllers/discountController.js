const Discount = require('../models/Discount');

// GET /api/discounts
const getAllDiscounts = async (req, res, next) => {
  try {
    const discounts = await Discount.find().sort({ name: 1 });
    res.json(discounts);
  } catch (error) {
    next(error);
  }
};

// GET /api/discounts/:id
const getDiscountById = async (req, res, next) => {
  try {
    const discount = await Discount.findById(req.params.id);
    if (!discount) {
      return res.status(404).json({ message: 'Discount not found' });
    }
    res.json(discount);
  } catch (error) {
    next(error);
  }
};

// POST /api/discounts
const createDiscount = async (req, res, next) => {
  try {
    const discount = new Discount(req.body);
    await discount.save();
    res.status(201).json(discount);
  } catch (error) {
    next(error);
  }
};

// PUT /api/discounts/:id
const updateDiscount = async (req, res, next) => {
  try {
    const discount = await Discount.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!discount) {
      return res.status(404).json({ message: 'Discount not found' });
    }
    res.json(discount);
  } catch (error) {
    next(error);
  }
};

// DELETE /api/discounts/:id
const deleteDiscount = async (req, res, next) => {
  try {
    const discount = await Discount.findByIdAndDelete(req.params.id);
    if (!discount) {
      return res.status(404).json({ message: 'Discount not found' });
    }
    res.json({ message: 'Discount deleted successfully', id: discount._id });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/discounts/:id/toggle
// Flips ACTIVE <-> INACTIVE
const toggleDiscount = async (req, res, next) => {
  try {
    const discount = await Discount.findById(req.params.id);
    if (!discount) {
      return res.status(404).json({ message: 'Discount not found' });
    }

    discount.status = discount.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    await discount.save();

    res.json(discount);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllDiscounts,
  getDiscountById,
  createDiscount,
  updateDiscount,
  deleteDiscount,
  toggleDiscount,
};
