const { validationResult } = require('express-validator');

/**
 * Middleware that checks express-validator results.
 * Place after your validation chains in the route definition.
 * On failure returns 400 with { message, errors: [{field, message}] }.
 * On success calls next().
 */
const validate = (req, res, next) => {
  const result = validationResult(req);

  if (!result.isEmpty()) {
    const errors = result.array().map((err) => ({
      field: err.path || err.param,
      message: err.msg,
    }));

    return res.status(400).json({
      message: 'Validation failed',
      errors,
    });
  }

  next();
};

module.exports = { validate };
