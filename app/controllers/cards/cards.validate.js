const { validationResult } = require('../../middleware/utils')
const { check } = require('express-validator')

/**
 * Validates join card request
 */
exports.joinItem = [
  check('cardId')
    .exists()
    .withMessage('MISSING')
    .not()
    .isEmpty()
    .withMessage('IS_EMPTY'),
  check('cardType')
    .exists()
    .withMessage('MISSING')
    .not()
    .isEmpty()
    .withMessage('IS_EMPTY')
    .isIn(['event', 'trial', 'training'])
    .withMessage('UNKNOWN_CARD_TYPE'),
  check('status'),
  (req, res, next) => {
    validationResult(req, res, next)
  }
]

exports.createItem = [
  check('cardType')
    .exists()
    .withMessage('MISSING')
    .not()
    .isEmpty()
    .withMessage('IS_EMPTY')
    .isIn(['event', 'trial', 'training'])
    .withMessage('UNKNOWN_CARD_TYPE'),
  (req, res, next) => {
    validationResult(req, res, next)
  }
]
