const express = require('express');
const { body } = require('express-validator');
const {
  getAllItems,
  getItemById,
  createItem,
  updateItem,
  deleteItem,
  bulkDelete,
  importItems,
} = require('../controllers/itemController');
const { validate } = require('../middleware/validate');

const router = express.Router();

const createItemValidators = [
  body('name').trim().notEmpty().withMessage('name is required'),
  body('sku').trim().notEmpty().withMessage('sku is required'),
  body('price')
    .isFloat({ min: 0 })
    .withMessage('price must be a non-negative number'),
  body('cost')
    .isFloat({ min: 0 })
    .withMessage('cost must be a non-negative number'),
  body('category').trim().notEmpty().withMessage('category is required'),
];

// Specific routes must come BEFORE /:id to avoid shadowing
router.post('/bulk-delete', bulkDelete);
router.post('/import', importItems);

router.get('/', getAllItems);
router.get('/:id', getItemById);
router.post('/', createItemValidators, validate, createItem);
router.put('/:id', updateItem);
router.delete('/:id', deleteItem);

module.exports = router;
