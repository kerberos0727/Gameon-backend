const { validationResult } = require('../../middleware/utils')
const { check } = require('express-validator')

/**
 * Validates join card request
 */
exports.joinItem = [
  check('partner')
    .exists()
    .withMessage('MISSING')
    .not()
    .isEmpty()
    .withMessage('IS_EMPTY'),
  check('enable'),
  (req, res, next) => {
    validationResult(req, res, next)
  }
]
