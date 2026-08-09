const mongoose = require('mongoose');

const modifierSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Modifier name is required'],
      trim: true,
    },
    price: {
      type: Number,
      required: [true, 'Modifier price is required'],
      min: [0, 'Price cannot be negative'],
    },
    appliesTo: {
      type: String,
      required: [true, 'appliesTo category is required'],
      trim: true,
    },
  },
  { timestamps: true }
);

const Modifier = mongoose.model('Modifier', modifierSchema);

module.exports = Modifier;
