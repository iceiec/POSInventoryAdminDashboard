const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Category name is required'],
      unique: true,
      trim: true,
    },
    color: {
      type: String,
      default: '#3b82f6',
    },
    // Maintained by itemController on create/update/delete operations
    itemCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    // Maintained by modifierController on create/update/delete operations
    activeModifiers: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true }
);

const Category = mongoose.model('Category', categorySchema);

module.exports = Category;
