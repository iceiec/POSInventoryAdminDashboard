const express = require('express');
const { body } = require('express-validator');
const {
  createSale,
  getAllSales,
  getSaleById,
} = require('../controllers/saleController');
const { validate } = require('../middleware/validate');

const router = express.Router();

const createSaleValidators = [
  body('items')
    .isArray({ min: 1 })
    .withMessage('items must be a non-empty array'),
  body('items.*.itemId')
    .notEmpty()
    .withMessage('each item must have an itemId'),
  body('items.*.quantity')
    .isInt({ min: 1 })
    .withMessage('each item quantity must be at least 1'),
  body('items.*.price')
    .isFloat({ min: 0 })
    .withMessage('each item price must be non-negative'),
  body('items.*.cost')
    .isFloat({ min: 0 })
    .withMessage('each item cost must be non-negative'),
  body('subtotal').isFloat({ min: 0 }).withMessage('subtotal must be non-negative'),
  body('total').isFloat({ min: 0 }).withMessage('total must be non-negative'),
  body('paymentMethod')
    .isIn(['cash', 'card', 'wallet'])
    .withMessage('paymentMethod must be cash, card, or wallet'),
  body('amountReceived')
    .isFloat({ min: 0 })
    .withMessage('amountReceived must be non-negative'),
  body('change').isFloat({ min: 0 }).withMessage('change must be non-negative'),
];

router.get('/', getAllSales);
router.get('/:id', getSaleById);
router.post('/', createSaleValidators, validate, createSale);

module.exports = router;
