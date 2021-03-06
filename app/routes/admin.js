const HistoryController = require('../controllers/admin/history')
const AuthController = require('../controllers/users/auth')
const express = require('express')
const router = express.Router()
require('../../config/passport')
const passport = require('passport')
const requireAuth = passport.authenticate('jwt', {
  session: false
})
const trimRequest = require('trim-request')

/*
 * Cities routes
 */

/*
 * Get items route
 */
router.get(
  '/gallery',
  requireAuth,
  AuthController.roleAuthorization(['admin']),
  trimRequest.all,
  HistoryController.getContentHistory
)


router.get(
  '/logs/login',
  requireAuth,
  AuthController.roleAuthorization(['admin']),
  trimRequest.all,
  HistoryController.getLoginHistory
)

router.get(
  '/logs/users',
  requireAuth,
  AuthController.roleAuthorization(['admin']),
  trimRequest.all,
  HistoryController.getUsersHistory
)

router.get(
  '/logs/totals',
  requireAuth,
  AuthController.roleAuthorization(['admin']),
  trimRequest.all,
  HistoryController.getTotalHistory
)
module.exports = router
