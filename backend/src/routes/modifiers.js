const express = require('express');
const { body } = require('express-validator');
const {
  getAllModifiers,
  getModifierById,
  createModifier,
  updateModifier,
  deleteModifier,
} = require('../controllers/modifierController');
const { validate } = require('../middleware/validate');

const router = express.Router();

const createModifierValidators = [
  body('name').trim().notEmpty().withMessage('name is required'),
  body('price').isFloat({ min: 0 }).withMessage('price must be a non-negative number'),
  body('appliesTo').trim().notEmpty().withMessage('appliesTo is required'),
];

router.get('/', getAllModifiers);
router.get('/:id', getModifierById);
router.post('/', createModifierValidators, validate, createModifier);
router.put('/:id', updateModifier);
router.delete('/:id', deleteModifier);

module.exports = router;
