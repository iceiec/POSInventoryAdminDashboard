const express = require('express');
const { body } = require('express-validator');
const {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
} = require('../controllers/categoryController');
const { validate } = require('../middleware/validate');

const router = express.Router();

const createCategoryValidators = [
  body('name').trim().notEmpty().withMessage('name is required'),
];

router.get('/', getAllCategories);
router.get('/:id', getCategoryById);
router.post('/', createCategoryValidators, validate, createCategory);
router.put('/:id', updateCategory);
router.delete('/:id', deleteCategory);

module.exports = router;
