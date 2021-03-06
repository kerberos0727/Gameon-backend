const controller = require('../controllers/users/setting')
const validate = require('../controllers/users/setting.validate')
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
 * Setting routes
 */

/*
 * Get setting route
 */
router.get('/', requireAuth, AuthController.roleAuthorization(['user']), trimRequest.all, controller.getItem)

router.post(
  '/',
  requireAuth,
  AuthController.roleAuthorization(['user']),
  trimRequest.all,
  validate.createItem,
  controller.createItem
)

module.exports = router
