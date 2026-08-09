const express = require('express');
const { body } = require('express-validator');
const {
  getAllDiscounts,
  getDiscountById,
  createDiscount,
  updateDiscount,
  deleteDiscount,
  toggleDiscount,
} = require('../controllers/discountController');
const { validate } = require('../middleware/validate');

const router = express.Router();

const createDiscountValidators = [
  body('name').trim().notEmpty().withMessage('name is required'),
  body('type')
    .isIn(['percentage', 'amount'])
    .withMessage('type must be percentage or amount'),
  body('value').notEmpty().withMessage('value is required'),
];

router.get('/', getAllDiscounts);
router.get('/:id', getDiscountById);
router.post('/', createDiscountValidators, validate, createDiscount);
router.put('/:id', updateDiscount);
router.patch('/:id/toggle', toggleDiscount);
router.delete('/:id', deleteDiscount);

module.exports = router;
