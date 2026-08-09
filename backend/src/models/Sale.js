const mongoose = require('mongoose');

const saleItemSchema = new mongoose.Schema(
  {
    itemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Item',
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: [1, 'Quantity must be at least 1'],
    },
    price: {
      type: Number,
      required: true,
      min: [0, 'Price cannot be negative'],
    },
    cost: {
      type: Number,
      required: true,
      min: [0, 'Cost cannot be negative'],
    },
  },
  { _id: false }
);

const saleSchema = new mongoose.Schema(
  {
    items: {
      type: [saleItemSchema],
      required: true,
      validate: {
        validator: (arr) => arr && arr.length > 0,
        message: 'A sale must contain at least one item',
      },
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    discountAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    discountLabel: {
      type: String,
      default: '',
    },
    total: {
      type: Number,
      required: true,
      min: 0,
    },
    paymentMethod: {
      type: String,
      enum: ['cash', 'card', 'wallet'],
      required: [true, 'Payment method is required'],
    },
    amountReceived: {
      type: Number,
      required: true,
      min: 0,
    },
    change: {
      type: Number,
      required: true,
      min: 0,
    },
    customerName: {
      type: String,
      default: '',
      trim: true,
    },
  },
  { timestamps: true }
);

// Index for date-range queries used by analytics
saleSchema.index({ createdAt: -1 });

const Sale = mongoose.model('Sale', saleSchema);

module.exports = Sale;
