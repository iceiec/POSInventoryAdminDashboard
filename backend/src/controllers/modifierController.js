const Modifier = require('../models/Modifier');

// GET /api/modifiers
const getAllModifiers = async (req, res, next) => {
  try {
    const modifiers = await Modifier.find().sort({ name: 1 });
    res.json(modifiers);
  } catch (error) {
    next(error);
  }
};

// GET /api/modifiers/:id
const getModifierById = async (req, res, next) => {
  try {
    const modifier = await Modifier.findById(req.params.id);
    if (!modifier) {
      return res.status(404).json({ message: 'Modifier not found' });
    }
    res.json(modifier);
  } catch (error) {
    next(error);
  }
};

// POST /api/modifiers
const createModifier = async (req, res, next) => {
  try {
    const modifier = new Modifier(req.body);
    await modifier.save();
    res.status(201).json(modifier);
  } catch (error) {
    next(error);
  }
};

// PUT /api/modifiers/:id
const updateModifier = async (req, res, next) => {
  try {
    const modifier = await Modifier.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!modifier) {
      return res.status(404).json({ message: 'Modifier not found' });
    }
    res.json(modifier);
  } catch (error) {
    next(error);
  }
};

// DELETE /api/modifiers/:id
const deleteModifier = async (req, res, next) => {
  try {
    const modifier = await Modifier.findByIdAndDelete(req.params.id);
    if (!modifier) {
      return res.status(404).json({ message: 'Modifier not found' });
    }
    res.json({ message: 'Modifier deleted successfully', id: modifier._id });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllModifiers,
  getModifierById,
  createModifier,
  updateModifier,
  deleteModifier,
};
