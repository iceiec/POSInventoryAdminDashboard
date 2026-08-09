const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Item name is required'],
      trim: true,
    },
    sku: {
      type: String,
      required: [true, 'SKU is required'],
      unique: true,
      uppercase: true,
      trim: true,
    },
    barcode: {
      type: String,
      sparse: true,   // allows multiple null values while keeping uniqueness for real values
      unique: true,
      trim: true,
      default: null,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },
    cost: {
      type: Number,
      required: [true, 'Cost is required'],
      min: [0, 'Cost cannot be negative'],
    },
    stock: {
      type: Number,
      default: 0,
      min: [0, 'Stock cannot be negative'],
    },
    status: {
      type: String,
      enum: ['IN_STOCK', 'LOW_STOCK', 'OUT_OF_STOCK'],
      default: 'IN_STOCK',
    },
    onSale: {
      type: Boolean,
      default: false,
    },
    compositeItem: {
      type: Boolean,
      default: false,
    },
    trackStock: {
      type: Boolean,
      default: true,
    },
    color: {
      type: String,
      default: '#3b82f6',
    },
    shape: {
      type: String,
      default: 'circle',
    },
    variants: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
);

// Auto-compute status before save based on current stock level
itemSchema.pre('save', function (next) {
  if (this.isModified('stock') || this.isNew) {
    if (this.stock <= 0) {
      this.status = 'OUT_OF_STOCK';
    } else if (this.stock <= 30) {
      this.status = 'LOW_STOCK';
    } else {
      this.status = 'IN_STOCK';
    }
  }
  next();
});

// Helper used by saleController after stock decrements via findByIdAndUpdate
// (pre-save won't fire for update ops, so controllers call this static manually)
itemSchema.statics.computeStatus = function (stock) {
  if (stock <= 0) return 'OUT_OF_STOCK';
  if (stock <= 30) return 'LOW_STOCK';
  return 'IN_STOCK';
};

// Text index for search
itemSchema.index({ name: 'text', sku: 'text' });

const Item = mongoose.model('Item', itemSchema);

module.exports = Item;
