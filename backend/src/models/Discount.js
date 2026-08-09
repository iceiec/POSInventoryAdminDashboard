const mongoose = require('mongoose');

const discountSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Discount name is required'],
      trim: true,
    },
    type: {
      type: String,
      enum: ['percentage', 'amount'],
      required: [true, 'Discount type is required'],
    },
    // Stored as string to allow values like "10%" or "50.00" for display flexibility
    value: {
      type: String,
      required: [true, 'Discount value is required'],
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE'],
      default: 'ACTIVE',
    },
  },
  { timestamps: true }
);

const Discount = mongoose.model('Discount', discountSchema);

module.exports = Discount;
